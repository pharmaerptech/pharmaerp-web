// src/features/parties/suppliers/pages/SuppliersPage.jsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile } from "@/hooks";
import { UIConfirmDialog } from "@/components/ui";

import useSupplier from "../hooks/useSupplier";
import useCompany from "@/features/company/hooks/useCompany";
import SuppliersMobilePage from "./mobile/SuppliersMobilePage";
import SuppliersDesktopPage from "./desktop/SuppliersDesktopPage";
import SupplierDialog from "../components/SupplierDialog";

const initialFilters = {
  search: "",
  status: "all",
  type: "all",
  page: 1,
  limit: 8,
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const formatSupplierType = (type) => {
  if (!type) return "Distributor";
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

const mapSupplierForView = (supplier) => {
  return {
    ...supplier,
    id: supplier?._id,
    displayName: supplier?.businessName || "",
    displayCode: supplier?.supplierCode || "",
    displayType: formatSupplierType(supplier?.supplierType || supplier?.type),
    displayMobile: supplier?.mobile || "",
    displayEmail: supplier?.email || "",
    displayStatus: supplier?.status || "Active",
    displayCreatedAt: formatDate(supplier?.createdAt),
    displayUpdatedAt: formatDate(supplier?.updatedAt),
    outstandingAmount: supplier?.outstandingAmount || 0,
    balanceType: supplier?.balanceType || "cr",
  };
};

const SuppliersPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentCompany } = useCompany();
  const companyId = currentCompany?._id;

  const {
    suppliers,
    total,
    stats: serverStats,
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSuppliersStatus,
    deleteSupplierStatus,
    error,
    message,
    clearError,
    clearMessage,
  } = useSupplier();

  const [filters, setFilters] = useState(initialFilters);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: "create",
    supplierData: null,
  });

  const isLoading = getSuppliersStatus === API_STATUS.LOADING;
  const isDeleting = deleteSupplierStatus === API_STATUS.LOADING;
  const hasError = getSuppliersStatus === API_STATUS.ERROR;

  const fetchSuppliers = useCallback(async () => {
    try {
      const queryParams = { ...filters };
      if (queryParams.status === "all") delete queryParams.status;
      if (queryParams.type === "all") delete queryParams.type;
      else {
        queryParams.supplierType = queryParams.type;
        delete queryParams.type;
      }
      await getSuppliers(queryParams);
    } catch {
      // Regulated by store selectors
    }
  }, [getSuppliers, filters]);

  useEffect(() => {
    if (!companyId) return;
    fetchSuppliers();
  }, [fetchSuppliers, companyId]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => {
      clearMessage();
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [message, clearMessage]);

  const mappedSuppliers = useMemo(
    () => (Array.isArray(suppliers) ? suppliers : []).map(mapSupplierForView),
    [suppliers],
  );

  const filteredSuppliers = mappedSuppliers;

  const stats = useMemo(() => {
    if (serverStats) {
      return serverStats;
    }
    
    // Fallback to local calculation if serverStats is not available
    const fallbackTotal = mappedSuppliers.length;
    const active = mappedSuppliers.filter((c) => normalizeText(c.status) === "active").length;
    const inactive = mappedSuppliers.filter((c) => normalizeText(c.status) === "inactive").length;
    const blocked = mappedSuppliers.filter((c) => normalizeText(c.status) === "blocked").length;

    let totalCr = 0;
    let totalDr = 0;
    mappedSuppliers.forEach((s) => {
      const amt = Number(s.outstandingAmount) || 0;
      if (String(s.balanceType).toLowerCase() === "dr") {
        totalDr += amt;
      } else {
        totalCr += amt;
      }
    });

    const netRunning = totalCr - totalDr;
    const runningType = netRunning >= 0 ? "Cr" : "Dr";

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
  }, [serverStats, mappedSuppliers]);

  const typeDistribution = useMemo(() => {
    const total = mappedSuppliers.length || 1;
    const counts = {
      manufacturer: 0,
      distributor: 0,
      wholesaler: 0,
      local_vendor: 0,
      other: 0,
    };

    mappedSuppliers.forEach((sup) => {
      const t = normalizeText(sup.supplierType || sup.type);
      if (counts[t] !== undefined) {
        counts[t] += 1;
      } else {
        counts.other += 1;
      }
    });

    return [
      { name: "Manufacturer", count: counts.manufacturer, color: "#a855f7", percent: Math.round((counts.manufacturer / total) * 100) },
      { name: "Distributor", count: counts.distributor, color: "#16a34a", percent: Math.round((counts.distributor / total) * 100) },
      { name: "Wholesaler", count: counts.wholesaler, color: "#2563eb", percent: Math.round((counts.wholesaler / total) * 100) },
      { name: "Local Vendor", count: counts.local_vendor, color: "#eab308", percent: Math.round((counts.local_vendor / total) * 100) },
      { name: "Other", count: counts.other, color: "#6b7280", percent: Math.round((counts.other / total) * 100) },
    ];
  }, [mappedSuppliers]);

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
        label: `Type: ${filters.type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}`,
      });
    }

    return chips;
  }, [filters]);

  const handleFilterChange = useCallback((eventOrValue) => {
    if (eventOrValue?.target) {
      const { name, value } = eventOrValue.target;
      setFilters((prev) => ({ ...prev, [name]: value }));
      return;
    }
    setFilters((prev) => ({ ...prev, ...eventOrValue }));
  }, []);

  const handleSearchChange = useCallback((event) => {
    const value = event?.target?.value ?? event;
    setFilters((prev) => ({ ...prev, search: value, page: 1 })); // reset page on search
  }, []);

  const handleRemoveFilter = useCallback((key) => {
    setFilters((prev) => ({ ...prev, [key]: initialFilters[key] }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const handleCreateSupplier = useCallback(() => {
    setDialogState({ isOpen: true, mode: "create", supplierData: null });
  }, []);

  const handleViewSupplier = useCallback((supplier) => {
    setDialogState({ isOpen: true, mode: "view", supplierData: supplier });
  }, []);

  const handleEditSupplier = useCallback((supplier) => {
    setDialogState({ isOpen: true, mode: "edit", supplierData: supplier });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleRequestDeleteSupplier = useCallback((supplier) => {
    setSelectedSupplier(supplier || null);
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setSelectedSupplier(null);
  }, [isDeleting]);

  const handleConfirmDeleteSupplier = useCallback(async () => {
    if (!selectedSupplier?._id) return;
    try {
      await deleteSupplier(selectedSupplier._id);
      setIsDeleteModalOpen(false);
      setSelectedSupplier(null);
    } catch {
      // Managed gracefully by standard slice errors
    }
  }, [deleteSupplier, selectedSupplier]);

  const handleRefresh = useCallback(() => {
    clearError();
    clearMessage();
    fetchSuppliers();
  }, [clearError, clearMessage, fetchSuppliers]);

  const pageProps = {
    suppliers: filteredSuppliers,
    allSuppliers: mappedSuppliers,
    stats,
    typeDistribution,

    filters,
    activeFilterChips,
    viewMode,
    onViewModeChange: setViewMode,

    isLoading,
    isDeleting,
    hasError,
    error,
    message,

    totalSuppliers: total || 0,
    filteredSuppliersCount: total || 0,
    hasSuppliers: true,
    hasFilteredSuppliers: true,

    currentPage: filters.page,
    pageSize: filters.limit,
    onPageChange: (newPage) => setFilters(prev => ({ ...prev, page: newPage })),
    onPageSizeChange: (newLimit) => setFilters(prev => ({ ...prev, limit: newLimit, page: 1 })),

    handleFilterChange,
    handleSearchChange,
    handleRemoveFilter,
    handleClearFilters,

    handleCreateSupplier,
    handleViewSupplier,
    handleEditSupplier,
    handleDeleteSupplier: handleRequestDeleteSupplier,
    handleRefresh,

    clearMessage,
  };

  return (
    <>
      {isMobile ? (
        <SuppliersMobilePage {...pageProps} />
      ) : (
        <SuppliersDesktopPage {...pageProps} />
      )}


      <SupplierDialog
        isOpen={dialogState.isOpen}
        onClose={handleCloseDialog}
        mode={dialogState.mode}
        supplierData={dialogState.supplierData}
        onSubmitCreate={createSupplier}
        onSubmitUpdate={updateSupplier}
        onSuccess={fetchSuppliers}
      />

      <UIConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteSupplier}
        title="Delete Supplier Profile"
        description={
          selectedSupplier
            ? `Are you sure you want to delete ${selectedSupplier.displayName || selectedSupplier.businessName || selectedSupplier.name}? Associated purchase bills and ledger entries will remain preserved.`
            : "Are you sure you want to delete this supplier?"
        }
        confirmText="Delete Supplier"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};

export default SuppliersPage;
