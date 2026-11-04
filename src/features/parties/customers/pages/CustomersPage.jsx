// src/features/parties/customers/pages/CustomersPage.jsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile } from "@/hooks";
import { UIConfirmDialog } from "@/components/ui";

import useCustomer from "../hooks/useCustomer";
import useCompany from "@/features/company/hooks/useCompany";
import CustomersMobilePage from "./mobile/CustomersMobilePage";
import CustomersDesktopPage from "./desktop/CustomersDesktopPage";
import CustomerDialog from "../components/CustomerDialog";
import CustomerAdvanceReceiptDialog from "../components/CustomerAdvanceReceiptDialog";
import CustomerSettlementDialog from "../components/CustomerSettlementDialog";
import CustomerStatementLedgerDialog from "../components/CustomerStatementLedgerDialog";
import CustomerCreditNotesDialog from "../components/CustomerCreditNotesDialog";

const initialFilters = {
  search: "",
  status: "all",
  type: "all",
};

// B2B covers retail & wholesale; B2C covers the rest
const B2B_TYPES = ["retail", "wholesale"];
const B2C_TYPES = ["hospital", "clinic", "corporate", "other", "walk_in"];

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const formatCustomerType = (type) => {
  if (!type) return "Retail";
  if (type === "walk_in") return "Walk-in";
  return String(type)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const mapCustomerForView = (customer) => {
  return {
    ...customer,
    id: customer?._id,
    displayName: customer?.name || "",
    displayCode: customer?.customerCode || "",
    displayType: formatCustomerType(customer?.customerType || customer?.type),
    displayMobile: customer?.mobile || "",
    displayEmail: customer?.email || "",
    displayCreditLimit: customer?.creditLimit || 0,
    displayStatus: customer?.status || "Active",
    displayCreatedAt: formatDate(customer?.createdAt),
    displayUpdatedAt: formatDate(customer?.updatedAt),
  };
};

const CustomersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { currentCompany } = useCompany();
  const companyId = currentCompany?._id;

  // Read segment from URL: "b2b" | "b2c" | null
  const activeSegment = searchParams.get("segment") || null;

  const {
    customers,
    getCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomersStatus,
    deleteCustomerStatus,
    error,
    message,
    clearError,
    clearMessage,
    stats: backendStats,
    total,
  } = useCustomer();

  const [filters, setFilters] = useState(initialFilters);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: "create",
    customerData: null,
  });

  const [advanceCustomer, setAdvanceCustomer] = useState(null);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [settleCustomer, setSettleCustomer] = useState(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [statementCustomer, setStatementCustomer] = useState(null);
  const [isStatementLedgerOpen, setIsStatementLedgerOpen] = useState(false);
  const [creditNotesCustomer, setCreditNotesCustomer] = useState(null);
  const [isCreditNotesModalOpen, setIsCreditNotesModalOpen] = useState(false);

  const isLoading = getCustomersStatus === API_STATUS.LOADING;
  const isDeleting = deleteCustomerStatus === API_STATUS.LOADING;
  const hasError = getCustomersStatus === API_STATUS.ERROR;

  const fetchCustomers = useCallback(async () => {
    let apiCustomerType = undefined;
    if (filters.type !== "all") {
      apiCustomerType = filters.type;
    } else if (activeSegment === "b2b") {
      apiCustomerType = B2B_TYPES.join(",");
    } else if (activeSegment === "b2c") {
      apiCustomerType = B2C_TYPES.join(",");
    }

    try {
      await getCustomers({
        page: currentPage,
        limit: pageSize,
        search: filters.search || undefined,
        status: filters.status !== "all" ? filters.status : undefined,
        customerType: apiCustomerType,
        sort: "-updatedAt",
      });
    } catch {
      // Regulated by store selectors
    }
  }, [
    getCustomers,
    currentPage,
    pageSize,
    filters.search,
    filters.status,
    filters.type,
    activeSegment,
  ]);

  useEffect(() => {
    if (!companyId) return;
    fetchCustomers();
  }, [fetchCustomers, companyId]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => {
      clearMessage();
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [message, clearMessage]);

  const mappedCustomers = useMemo(
    () => (Array.isArray(customers) ? customers : []).map(mapCustomerForView),
    [customers],
  );

  const filteredCustomers = useMemo(() => {
    const search = normalizeText(filters.search);

    const list = mappedCustomers.filter((customer) => {
      const matchesSearch =
        !search ||
        normalizeText(customer.displayName).includes(search) ||
        normalizeText(customer.displayCode).includes(search) ||
        normalizeText(customer.displayEmail).includes(search) ||
        normalizeText(customer.displayMobile).includes(search);

      const matchesStatus =
        filters.status === "all" ||
        normalizeText(customer.status) === normalizeText(filters.status);

      const matchesType =
        filters.type === "all" ||
        normalizeText(customer.customerType || customer.type) ===
          normalizeText(filters.type);

      // Segment-based filtering (B2B / B2C)
      const customerType = normalizeText(
        customer.customerType || customer.type,
      );
      let matchesSegment = true;
      if (activeSegment === "b2b") {
        matchesSegment = B2B_TYPES.includes(customerType);
      } else if (activeSegment === "b2c") {
        matchesSegment = B2C_TYPES.includes(customerType);
      }

      return matchesSearch && matchesStatus && matchesType && matchesSegment;
    });

    // Prioritize Walk-in customer first, then sort by recently updated descending
    list.sort((a, b) => {
      const aIsWalk = Boolean(
        a.isWalkIn ||
          a.customerType === "walk_in" ||
          a.type === "walk_in" ||
          a.customerCode === "WALK-IN" ||
          a.displayCode === "WALK-IN",
      );
      const bIsWalk = Boolean(
        b.isWalkIn ||
          b.customerType === "walk_in" ||
          b.type === "walk_in" ||
          b.customerCode === "WALK-IN" ||
          b.displayCode === "WALK-IN",
      );
      if (aIsWalk && !bIsWalk) return -1;
      if (!aIsWalk && bIsWalk) return 1;
      return (
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
      );
    });

    return list;
  }, [mappedCustomers, filters, activeSegment]);

  const stats = useMemo(() => {
    console.log("frontend backendStats:", backendStats);
    if (backendStats) {
      const netRunning =
        (backendStats.totalDr || 0) - (backendStats.totalCr || 0);
      return {
        total:
          (backendStats.active || 0) +
          (backendStats.inactive || 0) +
          (backendStats.blocked || 0),
        active: backendStats.active || 0,
        inactive: backendStats.inactive || 0,
        blocked: backendStats.blocked || 0,
        totalCr: backendStats.totalCr || 0,
        totalDr: backendStats.totalDr || 0,
        netRunning: Math.abs(netRunning),
        runningType: netRunning >= 0 ? "Dr" : "Cr",
      };
    }
    const fallbackTotal = mappedCustomers.length;
    const active = mappedCustomers.filter(
      (c) => normalizeText(c.status) === "active",
    ).length;
    const inactive = mappedCustomers.filter(
      (c) => normalizeText(c.status) === "inactive",
    ).length;
    const blocked = mappedCustomers.filter(
      (c) => normalizeText(c.status) === "blocked",
    ).length;

    let totalCr = 0;
    let totalDr = 0;
    mappedCustomers.forEach((c) => {
      const amt = Number(c.outstandingAmount) || 0;
      if (String(c.balanceType).toLowerCase() === "cr") {
        totalCr += amt;
      } else {
        totalDr += amt;
      }
    });

    const netRunning = totalDr - totalCr; // For customers, Dr is positive balance (they owe us)
    const runningType = netRunning >= 0 ? "Dr" : "Cr";

    return {
      total: fallbackTotal,
      active,
      inactive,
      blocked,
      totalCr,
      totalDr,
      netRunning: Math.abs(netRunning),
      runningType,
    };
  }, [mappedCustomers, backendStats]);

  const typeDistribution = useMemo(() => {
    const total = mappedCustomers.length || 1;
    const counts = {
      retail: 0,
      wholesale: 0,
      hospital: 0,
      clinic: 0,
      corporate: 0,
      other: 0,
    };

    mappedCustomers.forEach((cust) => {
      const t = normalizeText(cust.customerType || cust.type);
      if (counts[t] !== undefined) {
        counts[t] += 1;
      } else {
        counts.other += 1;
      }
    });

    return [
      {
        name: "Retail",
        count: counts.retail,
        color: "#16a34a",
        percent: Math.round((counts.retail / total) * 100),
      },
      {
        name: "Wholesale",
        count: counts.wholesale,
        color: "#2563eb",
        percent: Math.round((counts.wholesale / total) * 100),
      },
      {
        name: "Hospital",
        count: counts.hospital,
        color: "#a855f7",
        percent: Math.round((counts.hospital / total) * 100),
      },
      {
        name: "Clinic",
        count: counts.clinic,
        color: "#eab308",
        percent: Math.round((counts.clinic / total) * 100),
      },
      {
        name: "Corporate",
        count: counts.corporate,
        color: "#06b6d4",
        percent: Math.round((counts.corporate / total) * 100),
      },
      {
        name: "Other",
        count: counts.other,
        color: "#6b7280",
        percent: Math.round((counts.other / total) * 100),
      },
    ];
  }, [mappedCustomers]);

  const activeFilterChips = useMemo(() => {
    const chips = [];

    if (filters.search) {
      chips.push({ key: "search", label: `Search: ${filters.search}` });
    }
    if (filters.status !== "all") {
      chips.push({
        key: "status",
        label: `Status: ${filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}`,
      });
    }
    if (filters.type !== "all") {
      chips.push({
        key: "type",
        label: `Type: ${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}`,
      });
    }

    return chips;
  }, [filters]);

  const handleFilterChange = useCallback((eventOrValue) => {
    setCurrentPage(1);
    if (eventOrValue?.target) {
      const { name, value } = eventOrValue.target;
      setFilters((prev) => ({ ...prev, [name]: value }));
      return;
    }
    setFilters((prev) => ({ ...prev, ...eventOrValue }));
  }, []);

  const handleSearchChange = useCallback((event) => {
    setCurrentPage(1);
    const value = event?.target?.value ?? event;
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  const handleRemoveFilter = useCallback((key) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [key]: initialFilters[key] }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setCurrentPage(1);
    setFilters(initialFilters);
  }, []);

  const handleCreateCustomer = useCallback(() => {
    setDialogState({ isOpen: true, mode: "create", customerData: null });
  }, []);

  const handleViewCustomer = useCallback(
    async (customer) => {
      setDialogState({ isOpen: true, mode: "view", customerData: customer });
      const custId = customer?._id || customer?.id;
      if (custId) {
        try {
          const fullCustomer = await getCustomerById(custId);
          if (fullCustomer) {
            setDialogState((prev) => ({
              ...prev,
              customerData: fullCustomer,
            }));
          }
        } catch {
          // Keep customer data as-is if network fails
        }
      }
    },
    [getCustomerById],
  );

  const handleEditCustomer = useCallback((customer) => {
    setDialogState({ isOpen: true, mode: "edit", customerData: customer });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleOpenReceiveAdvance = useCallback((customer) => {
    setAdvanceCustomer(customer);
    setIsAdvanceModalOpen(true);
  }, []);

  const handleCloseReceiveAdvance = useCallback(() => {
    setIsAdvanceModalOpen(false);
    setAdvanceCustomer(null);
  }, []);

  const handleOpenSettleCredit = useCallback((customer) => {
    setSettleCustomer(customer);
    setIsSettleModalOpen(true);
  }, []);

  const handleCloseSettleCredit = useCallback(() => {
    setIsSettleModalOpen(false);
    setSettleCustomer(null);
  }, []);

  const handleOpenStatementLedger = useCallback((customer) => {
    setStatementCustomer(customer);
    setIsStatementLedgerOpen(true);
  }, []);

  const handleCloseStatementLedger = useCallback(() => {
    setIsStatementLedgerOpen(false);
    setStatementCustomer(null);
  }, []);

  const handleOpenCreditNotes = useCallback((customer) => {
    setCreditNotesCustomer(customer);
    setIsCreditNotesModalOpen(true);
  }, []);

  const handleCloseCreditNotes = useCallback(() => {
    setIsCreditNotesModalOpen(false);
    setCreditNotesCustomer(null);
  }, []);

  const handleViewTransactions = handleOpenStatementLedger;

  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAdvanceSuccess = useCallback(async () => {
    triggerRefresh();
    if (dialogState.isOpen && dialogState.customerData) {
      const custId =
        dialogState.customerData._id || dialogState.customerData.id;
      if (custId) {
        try {
          const updated = await getCustomerById(custId);
          if (updated) {
            setDialogState((prev) => ({ ...prev, customerData: updated }));
          }
        } catch {
          // Ignore
        }
      }
    }
  }, [
    triggerRefresh,
    dialogState.isOpen,
    dialogState.customerData,
    getCustomerById,
  ]);

  const handleSettlementSuccess = useCallback(async () => {
    triggerRefresh();
    if (dialogState.isOpen && dialogState.customerData) {
      const custId =
        dialogState.customerData._id || dialogState.customerData.id;
      if (custId) {
        try {
          const updated = await getCustomerById(custId);
          if (updated) {
            setDialogState((prev) => ({ ...prev, customerData: updated }));
          }
        } catch {
          // Ignore
        }
      }
    }
  }, [
    triggerRefresh,
    dialogState.isOpen,
    dialogState.customerData,
    getCustomerById,
  ]);

  const handleStatementSuccess = useCallback(async () => {
    triggerRefresh();
    if (dialogState.isOpen && dialogState.customerData) {
      const custId =
        dialogState.customerData._id || dialogState.customerData.id;
      if (custId) {
        try {
          const updated = await getCustomerById(custId);
          if (updated) {
            setDialogState((prev) => ({ ...prev, customerData: updated }));
          }
        } catch {
          // Ignore
        }
      }
    }
  }, [
    triggerRefresh,
    dialogState.isOpen,
    dialogState.customerData,
    getCustomerById,
  ]);

  const handleRequestDeleteCustomer = useCallback((customer) => {
    setSelectedCustomer(customer || null);
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setSelectedCustomer(null);
  }, [isDeleting]);

  const handleConfirmDeleteCustomer = useCallback(async () => {
    if (!selectedCustomer?._id) return;
    try {
      await deleteCustomer(selectedCustomer._id);
      setIsDeleteModalOpen(false);
      setSelectedCustomer(null);
      triggerRefresh();
    } catch {
      // Managed gracefully by standard slice errors
    }
  }, [deleteCustomer, selectedCustomer, triggerRefresh]);

  const handleRefresh = useCallback(() => {
    clearError();
    clearMessage();
    triggerRefresh();
  }, [clearError, clearMessage, triggerRefresh]);

  const pageProps = {
    customers: filteredCustomers,
    allCustomers: mappedCustomers,
    stats,
    typeDistribution,
    activeSegment,

    filters,
    activeFilterChips,
    viewMode,
    onViewModeChange: setViewMode,

    isLoading,
    isDeleting,
    hasError,
    error,
    message,

    totalCustomers: total,
    filteredCustomersCount: total,
    hasCustomers: total > 0,
    hasFilteredCustomers: total > 0,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,

    handleFilterChange,
    handleSearchChange,
    handleRemoveFilter,
    handleClearFilters,

    handleCreateCustomer,
    handleViewCustomer,
    handleEditCustomer,
    handleDeleteCustomer: handleRequestDeleteCustomer,
    handleReceiveAdvance: handleOpenReceiveAdvance,
    handleSettleCredit: handleOpenSettleCredit,
    handleViewCreditNotes: handleOpenCreditNotes,
    handleViewTransactions,
    handleRefresh,
    refreshKey,

    clearMessage,
  };

  return (
    <>
      {isMobile ? (
        <CustomersMobilePage {...pageProps} />
      ) : (
        <CustomersDesktopPage {...pageProps} />
      )}

      <CustomerDialog
        isOpen={dialogState.isOpen}
        onClose={handleCloseDialog}
        mode={dialogState.mode}
        customerData={dialogState.customerData}
        onSubmitCreate={createCustomer}
        onSubmitUpdate={updateCustomer}
        onSuccess={triggerRefresh}
        onReceiveAdvance={handleOpenReceiveAdvance}
        onSettleCredit={handleOpenSettleCredit}
        onViewCreditNotes={handleOpenCreditNotes}
        onViewTransactions={handleViewTransactions}
      />

      <CustomerAdvanceReceiptDialog
        isOpen={isAdvanceModalOpen}
        onClose={handleCloseReceiveAdvance}
        customer={advanceCustomer}
        onSuccess={handleAdvanceSuccess}
      />

      <CustomerSettlementDialog
        isOpen={isSettleModalOpen}
        onClose={handleCloseSettleCredit}
        customer={settleCustomer}
        onSuccess={handleSettlementSuccess}
      />

      <CustomerStatementLedgerDialog
        isOpen={isStatementLedgerOpen}
        onClose={handleCloseStatementLedger}
        customer={statementCustomer}
        onSuccess={handleStatementSuccess}
      />

      <CustomerCreditNotesDialog
        isOpen={isCreditNotesModalOpen}
        onClose={handleCloseCreditNotes}
        customer={creditNotesCustomer}
      />

      <UIConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteCustomer}
        title="Delete Customer Profile"
        description={
          selectedCustomer
            ? `Are you sure you want to delete ${selectedCustomer.displayName || selectedCustomer.name}? Associated sales invoices and transaction records will remain preserved in historical statements.`
            : "Are you sure you want to delete this customer?"
        }
        confirmText="Delete Customer"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};

export default CustomersPage;
