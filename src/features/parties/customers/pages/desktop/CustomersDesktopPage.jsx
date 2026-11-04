// src/features/parties/customers/pages/desktop/CustomersDesktopPage.jsx

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  Plus,
  Download,
  Receipt,
  Wallet,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Mail,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Contact,
  Store,
} from "lucide-react";

import {
  UIButton,
  UIInput,
  UISelect,
  UIBadge,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  UITableEmpty,
  UITableLoading,
  UIInfiniteScroll,
  UIDropdown,
  UIDropdownTrigger,
  UIDropdownMenu,
  UIDropdownItem,
  UIDropdownDivider,
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
  PermissionGate,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import customerService from "../../services/customerService";
import CustomerImportPreviewModal from "../../components/CustomerImportPreviewModal";
import ImportConfigModal from "../../components/ImportConfigModal";
import OutstandingImportPreviewModal from "../../components/OutstandingImportPreviewModal";
import B2cCustomerImportModal from "../../components/B2cCustomerImportModal";
import B2cLegacyHistoryImportModal from "@/features/sales/components/B2cLegacyHistoryImportModal";
import * as XLSX from "xlsx";

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getInitials = (name) => {
  if (!name) return "CU";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const CUSTOMER_TYPE_OPTIONS = [
  { label: "All Customer Types", value: "all" },
  { label: "Walk-in", value: "walk_in" },
  { label: "Retail", value: "retail" },
  { label: "Wholesale", value: "wholesale" },
  { label: "Hospital", value: "hospital" },
  { label: "Clinic", value: "clinic" },
  { label: "Corporate", value: "corporate" },
  { label: "Other", value: "other" },
];

const BALANCE_FILTER_OPTIONS = [
  { label: "All Balances", value: "all" },
  { label: "Credit Outstanding (DR)", value: "dr" },
  { label: "Advance Available (CR)", value: "cr" },
  { label: "Over Credit Limit", value: "overlimit" },
  { label: "Settled / Zero Balance", value: "zero" },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Blocked", value: "blocked" },
];

const SORT_SELECT_OPTIONS = [
  { label: "Recently Updated", value: "updatedAt-desc" },
  { label: "Name: A to Z", value: "name-asc" },
  { label: "Name: Z to A", value: "name-desc" },
  { label: "Credit Due: High to Low", value: "due-desc" },
  { label: "Advance: High to Low", value: "adv-desc" },
  { label: "Newest First", value: "createdAt-desc" },
  { label: "Oldest First", value: "createdAt-asc" },
];

const SCOPE_MODAL_OPTIONS = [
  { value: "all", label: "All Customers", icon: Users },
  { value: "b2b", label: "B2B Accounts", icon: Building2 },
  { value: "b2c", label: "B2C Walk-ins", icon: Contact },
];

const PAGE_LIMIT = 10;

export const CustomersDesktopPage = ({
  handleCreateCustomer,
  handleViewCustomer,
  handleEditCustomer,
  handleDeleteCustomer,
  handleReceiveAdvance,
  handleSettleCredit,
  handleViewCreditNotes,
  handleViewTransactions,
  handleRefresh: propHandleRefresh,
  activeSegment: propActiveSegment,
  refreshKey = 0,
}) => {
  const navigate = useNavigate();
  const tableContainerRef = useRef(null);

  // Core Customer data and infinite scroll pagination
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Walk-in Customer detection & creation
  const [hasWalkInCustomer, setHasWalkInCustomer] = useState(true);
  const [isCreatingWalkIn, setIsCreatingWalkIn] = useState(false);

  useEffect(() => {
    let isMounted = true;
    customerService
      .getWalkInCustomer()
      .then((res) => {
        if (!isMounted) return;
        const exists = Boolean(res.data?.data || res.data);
        setHasWalkInCustomer(exists);
      })
      .catch(() => {
        if (isMounted) setHasWalkInCustomer(false);
      });
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const handleCreateWalkInCustomer = async () => {
    try {
      setIsCreatingWalkIn(true);
      await customerService.ensureWalkInCustomer();
      setHasWalkInCustomer(true);
      if (propHandleRefresh) {
        propHandleRefresh();
      } else {
        fetchInitialCustomers();
      }
    } catch (err) {
      console.error("Failed to ensure walk-in customer:", err);
    } finally {
      setIsCreatingWalkIn(false);
    }
  };

  // Global Financial & Count Statistics (independent of pagination)
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalDr: 0,
    totalAdvance: 0,
    totalCr: 0,
    netRunning: 0,
    runningType: "Dr",
    active: 0,
    inactive: 0,
    blocked: 0,
    drCount: 0,
    crCount: 0,
  });

  // Filter & Search States
  const [customerScope, setCustomerScope] = useState(
    propActiveSegment === "b2b"
      ? "b2b"
      : propActiveSegment === "b2c"
        ? "b2c"
        : "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedBalanceType, setSelectedBalanceType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortOption, setSortOption] = useState("updatedAt-desc");

  // Filter Modal Dialog state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Active filter count for badge (filters configured inside modal)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedType !== "all") count++;
    if (selectedBalanceType !== "all") count++;
    if (selectedStatus !== "all") count++;
    if (sortOption !== "updatedAt-desc") count++;
    return count;
  }, [selectedType, selectedBalanceType, selectedStatus, sortOption]);

  // Excel Import States
  const [isImportConfigOpen, setIsImportConfigOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isOutstandingImportModalOpen, setIsOutstandingImportModalOpen] =
    useState(false);
  const [isB2cImportModalOpen, setIsB2cImportModalOpen] = useState(false);
  const [isLegacyHistoryImportModalOpen, setIsLegacyHistoryImportModalOpen] =
    useState(false);
  const [activeImportType, setActiveImportType] = useState("b2b");
  const [importPreviewData, setImportPreviewData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Chunked Import Modal State
  const [chunkState, setChunkState] = useState({
    chunks: [],
    currentIndex: 0,
    isImporting: false,
    isModalOpen: false,
    error: null,
    stats: { successful: 0, failed: 0, errors: [] },
    totalRecords: 0,
  });
  const abortControllerRef = useRef(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync customerScope if parent activeSegment changes
  useEffect(() => {
    if (propActiveSegment === "b2b") setCustomerScope("b2b");
    else if (propActiveSegment === "b2c") setCustomerScope("b2c");
  }, [propActiveSegment]);

  // Format customer row data safely
  const formatCustomerRow = useCallback((c) => {
    const id = c._id || c.id;
    const name = c.name || c.displayName || "Unknown Customer";
    const customerCode = c.customerCode || c.displayCode || "—";
    const mobile = c.mobile || c.phone || "—";
    const email = c.email || "";
    const type = String(c.customerType || c.type || "retail").toLowerCase();
    const status = c.status || c.displayStatus || "Active";
    const creditLimit = Math.max(0, Number(c.creditLimit || 0));
    const creditDays = Math.max(0, Number(c.creditDays || 0));

    const advanceBalance = Math.max(
      0,
      Number(c.advanceBalance ?? c.advance ?? 0),
    );
    const creditOutstanding = Math.max(
      0,
      Number(c.creditOutstanding ?? c.credit ?? c.creditDue ?? 0),
    );
    const creditNoteBalance = Math.max(
      0,
      Number(c.creditNoteBalance ?? 0),
    );
    const outstandingAmount = Math.max(
      0,
      Number(c.outstandingAmount ?? creditOutstanding ?? 0),
    );
    const balanceType = String(
      c.balanceType ||
        (creditOutstanding > 0 ? "dr" : advanceBalance > 0 ? "cr" : "zero"),
    ).toLowerCase();

    const billingAddress = c.billingAddress || c.address || {};
    const city = billingAddress.city || "";
    const state = billingAddress.state || "";
    const gstNumber = c.gstNumber || c.gstin || "";
    const drugLicense = c.drugLicenseNumber || "";

    return {
      _id: id,
      id,
      name,
      customerCode,
      mobile,
      email,
      customerType: type,
      status,
      creditLimit,
      creditDays,
      advanceBalance,
      creditOutstanding,
      creditNoteBalance,
      outstandingAmount,
      balanceType,
      city,
      state,
      gstNumber,
      drugLicense,
      isWalkIn: Boolean(c.isWalkIn || type === "walk_in" || customerCode === "WALK-IN"),
      isSystemCustomer: Boolean(c.isSystemCustomer),
      createdAt: c.createdAt || null,
      updatedAt: c.updatedAt || null,
      rawCustomer: c,
    };
  }, []);

  // Build API Query Parameters
  const buildQueryParams = useCallback(
    (page = 1) => {
      const params = {
        page,
        limit: PAGE_LIMIT,
      };

      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }

      // Customer type or segment scope mapping
      if (selectedType !== "all") {
        params.customerType = selectedType;
      } else if (customerScope === "b2b") {
        params.customerType = "retail,wholesale";
      } else if (customerScope === "b2c") {
        params.customerType = "walk_in,hospital,clinic,corporate,other";
      }

      // Backend sort query mapping
      if (sortOption === "name-asc") {
        params.sort = "name";
      } else if (sortOption === "name-desc") {
        params.sort = "-name";
      } else if (sortOption === "due-desc") {
        params.sort = "-creditOutstanding";
      } else if (sortOption === "adv-desc") {
        params.sort = "-advanceBalance";
      } else if (sortOption === "createdAt-desc") {
        params.sort = "-createdAt";
      } else if (sortOption === "createdAt-asc") {
        params.sort = "createdAt";
      } else {
        // Default recently updated
        params.sort = "-updatedAt";
      }

      return params;
    },
    [debouncedSearch, selectedStatus, selectedType, customerScope, sortOption],
  );

  // Fetch initial batch (Page 1) or full refresh
  const fetchInitialCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = buildQueryParams(1);
      const res = await customerService.getCustomers(params);
      const resData = res.data?.data || {};
      const rawList = Array.isArray(resData.customers)
        ? resData.customers
        : Array.isArray(resData)
          ? resData
          : [];
      const total = Number(resData.total ?? rawList.length);

      // Extract backend aggregated stats
      if (resData.stats) {
        setStats({
          totalCustomers: total,
          totalDr: Number(resData.stats.totalDr || 0),
          totalAdvance: Number(
            resData.stats.totalAdvance || resData.stats.totalCr || 0,
          ),
          totalCr: Number(resData.stats.totalCr || 0),
          netRunning: Number(resData.stats.netRunning || 0),
          runningType: resData.stats.runningType || "Dr",
          active: Number(resData.stats.active || 0),
          inactive: Number(resData.stats.inactive || 0),
          blocked: Number(resData.stats.blocked || 0),
          drCount: rawList.filter((c) => Number(c.creditOutstanding || 0) > 0)
            .length,
          crCount: rawList.filter((c) => Number(c.advanceBalance || 0) > 0)
            .length,
        });
      } else {
        let drSum = 0;
        let advSum = 0;
        let act = 0;
        let inact = 0;
        let blk = 0;
        rawList.forEach((c) => {
          drSum += Number(c.creditOutstanding || 0);
          advSum += Number(c.advanceBalance || 0);
          const s = String(c.status || "active").toLowerCase();
          if (s === "active") act++;
          else if (s === "inactive") inact++;
          else if (s === "blocked") blk++;
        });
        const netGap = Math.abs(drSum - advSum);
        setStats({
          totalCustomers: total,
          totalDr: drSum,
          totalAdvance: advSum,
          totalCr: advSum,
          netRunning: netGap,
          runningType: drSum >= advSum ? "Dr" : "Cr",
          active: act,
          inactive: inact,
          blocked: blk,
          drCount: rawList.filter((c) => Number(c.creditOutstanding || 0) > 0)
            .length,
          crCount: rawList.filter((c) => Number(c.advanceBalance || 0) > 0)
            .length,
        });
      }

      const formatted = rawList.map(formatCustomerRow);
      setCustomers(formatted);
      setTotalCount(total);
      setCurrentPage(1);
      setHasMore(formatted.length < total);

      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.warn("Failed to fetch customers list:", err);
      setCustomers([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryParams, formatCustomerRow]);

  // Load next batch via Infinite Scroll
  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const params = buildQueryParams(nextPage);
      const res = await customerService.getCustomers(params);
      const resData = res.data?.data || {};
      const rawList = Array.isArray(resData.customers) ? resData.customers : [];
      const total = Number(resData.total ?? totalCount);

      if (rawList.length > 0) {
        setCustomers((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const newRows = rawList
            .map(formatCustomerRow)
            .filter((c) => !existingIds.has(c._id));
          const combined = [...prev, ...newRows];
          setHasMore(combined.length < total);
          return combined;
        });
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn("Failed to load more customers:", err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    currentPage,
    hasMore,
    isLoading,
    isLoadingMore,
    buildQueryParams,
    totalCount,
    formatCustomerRow,
  ]);

  // Observer on the 8th row (index 7 of each 10-item batch) to trigger loading next 10 items
  const eighthRowObserverRef = useRef(null);
  const eighthRowCallbackRef = useCallback(
    (node) => {
      if (isLoading || isLoadingMore || !hasMore) return;
      if (eighthRowObserverRef.current)
        eighthRowObserverRef.current.disconnect();

      eighthRowObserverRef.current = new IntersectionObserver(
        (entries) => {
          if (
            entries[0]?.isIntersecting &&
            hasMore &&
            !isLoadingMore &&
            !isLoading
          ) {
            handleLoadMore();
          }
        },
        {
          root: tableContainerRef.current,
          threshold: 0.1,
        },
      );

      if (node) eighthRowObserverRef.current.observe(node);
    },
    [hasMore, isLoading, isLoadingMore, handleLoadMore],
  );

  useEffect(() => {
    return () => {
      if (eighthRowObserverRef.current) {
        eighthRowObserverRef.current.disconnect();
      }
    };
  }, []);

  // Initial load and auto re-fetch on filter / refreshKey changes
  useEffect(() => {
    fetchInitialCustomers();
  }, [fetchInitialCustomers, refreshKey]);

  // Unified Refresh Handler
  const handleRefresh = useCallback(() => {
    fetchInitialCustomers();
    if (propHandleRefresh) {
      propHandleRefresh();
    }
    setToastMessage("Customer list refreshed.");
    setTimeout(() => setToastMessage(null), 2500);
  }, [fetchInitialCustomers, propHandleRefresh]);

  // Reset Filters Handler
  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedType("all");
    setSelectedBalanceType("all");
    setSelectedStatus("all");
    setSortOption("updatedAt-desc");
    setCustomerScope("all");
    navigate(ROUTES.CUSTOMERS, { replace: true });
  }, [navigate]);

  // Client-side filtering & sorting on currently loaded customers
  const filteredAndSortedCustomers = useMemo(() => {
    let result = [...customers];

    // Filter by balance dropdown
    if (selectedBalanceType === "dr") {
      result = result.filter(
        (c) =>
          c.creditOutstanding > 0 ||
          (c.balanceType === "dr" && c.outstandingAmount > 0),
      );
    } else if (selectedBalanceType === "cr") {
      result = result.filter(
        (c) =>
          c.advanceBalance > 0 ||
          (c.balanceType === "cr" && c.outstandingAmount > 0),
      );
    } else if (selectedBalanceType === "overlimit") {
      result = result.filter(
        (c) => c.creditLimit > 0 && c.creditOutstanding > c.creditLimit,
      );
    } else if (selectedBalanceType === "zero") {
      result = result.filter(
        (c) =>
          (c.creditOutstanding || 0) === 0 && (c.advanceBalance || 0) === 0,
      );
    }

    // Sort result
    result.sort((a, b) => {
      // Priority: Walk-in customer is always first
      const aIsWalkIn = Boolean(
        a.isWalkIn ||
          a.customerType === "walk_in" ||
          a.customerCode === "WALK-IN",
      );
      const bIsWalkIn = Boolean(
        b.isWalkIn ||
          b.customerType === "walk_in" ||
          b.customerCode === "WALK-IN",
      );
      if (aIsWalkIn && !bIsWalkIn) return -1;
      if (!aIsWalkIn && bIsWalkIn) return 1;

      switch (sortOption) {
        case "updatedAt-desc":
          return (
            new Date(b.updatedAt || b.createdAt || 0) -
            new Date(a.updatedAt || a.createdAt || 0)
          );
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "due-desc":
          return (b.creditOutstanding || 0) - (a.creditOutstanding || 0);
        case "adv-desc":
          return (b.advanceBalance || 0) - (a.advanceBalance || 0);
        case "createdAt-desc":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "createdAt-asc":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        default:
          return (
            new Date(b.updatedAt || b.createdAt || 0) -
            new Date(a.updatedAt || a.createdAt || 0)
          );
      }
    });

    return result;
  }, [customers, selectedBalanceType, sortOption]);

  // ── Import Handling ────────────────────────────────────────────────────────
  const handleImportClick = () => {
    setIsImportConfigOpen(true);
  };

  const processChunk = async (chunkIndex, chunks, currentStats) => {
    if (chunkIndex >= chunks.length) {
      setChunkState((prev) => ({
        ...prev,
        isImporting: false,
        currentIndex: chunkIndex,
      }));
      setToastMessage(
        `Import complete! Successful: ${currentStats.successful}, Failed: ${currentStats.failed}`,
      );
      setTimeout(() => setToastMessage(null), 4000);
      handleRefresh();
      return;
    }

    setChunkState((prev) => ({
      ...prev,
      currentIndex: chunkIndex,
      error: null,
    }));

    try {
      const chunk = chunks[chunkIndex];
      const res = await customerService.importChunk({
        customers: chunk,
        importType: activeImportType,
      });

      const result = res.data?.data?.importResult || {
        successful: 0,
        failed: 0,
        errors: [],
      };
      const newStats = {
        successful: currentStats.successful + (result.successful || 0),
        failed: currentStats.failed + (result.failed || 0),
        errors: [...currentStats.errors, ...(result.errors || [])],
      };

      setChunkState((prev) => ({ ...prev, stats: newStats }));

      if (
        abortControllerRef.current &&
        !abortControllerRef.current.signal.aborted
      ) {
        processChunk(chunkIndex + 1, chunks, newStats);
      }
    } catch (err) {
      setChunkState((prev) => ({
        ...prev,
        isImporting: false,
        error:
          err?.response?.data?.message ||
          err.message ||
          "Failed to import chunk",
      }));
    }
  };

  const handleImportSubmit = async (file, importType) => {
    setActiveImportType(importType);

    if (importType === "b2c") {
      setIsImportConfigOpen(false);
      setIsB2cImportModalOpen(true);
      return;
    }

    // Standard B2B import via backend preview
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("importType", importType);

      const res = await customerService.previewImport(formData);
      setIsImportConfigOpen(false);

      if (res.data?.data?.isDirectlyImported) {
        const result = res.data.data.importResult;
        if (result?.failed > 0) {
          alert(
            `Imported ${result.successful} successfully. ${result.failed} failed.\nErrors: ${result.errors?.join(", ")}`,
          );
        } else {
          alert(
            `Directly imported ${result?.successful || 0} customers successfully.`,
          );
        }
        handleRefresh();
        return;
      }

      setImportPreviewData(res.data?.data || []);

      if (importType === "b2b-outstanding") {
        setIsOutstandingImportModalOpen(true);
      } else {
        setIsImportModalOpen(true);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to parse file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportSuccess = (successful, failed, errors) => {
    setIsImportModalOpen(false);
    setIsOutstandingImportModalOpen(false);
    if (failed > 0) {
      alert(
        `Imported ${successful} successfully. ${failed} failed.\nErrors: ${errors.join(", ")}`,
      );
    } else {
      setToastMessage(`Imported ${successful} customers successfully.`);
      setTimeout(() => setToastMessage(null), 3000);
    }
    if (successful > 0) {
      handleRefresh();
    }
  };

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-alt border border-primary/30 shadow-lg text-text text-xs sm:text-sm font-medium"
          >
            <CheckCircle2 className="size-4.5 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Compact 4-Card Statistics Grid (Top of Page) ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Customers */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <Users className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              {customerScope === "b2b"
                ? "B2B Accounts"
                : customerScope === "b2c"
                  ? "B2C Walk-ins"
                  : "Total Customers"}
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalCustomers || totalCount || 0}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {customerScope === "b2b"
                ? "B2B wholesale & commercial"
                : customerScope === "b2c"
                  ? "B2C retail walk-in accounts"
                  : "Registered customer base"}
            </div>
          </div>
        </div>

        {/* Card 2: Credit Receivables (DR) */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-error-soft text-error flex items-center justify-center shrink-0">
            <ArrowDownRight className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-error truncate">
              Credit Receivables (DR)
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.totalDr)}
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono truncate mt-0.5">
              {stats.drCount || 0} accounts with dues
            </div>
          </div>
        </div>

        {/* Card 3: Customer Advances (CR) */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <ArrowUpRight className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              Customer Advances (CR)
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.totalAdvance || stats.totalCr)}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate mt-0.5">
              {stats.crCount || 0} accounts with advance
            </div>
          </div>
        </div>

        {/* Card 4: Net Position */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Scale className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-primary truncate">
              Net Position
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹
              {formatCurrency(
                stats.netRunning ||
                  Math.abs(
                    (stats.totalDr || 0) -
                      (stats.totalAdvance || stats.totalCr || 0),
                  ),
              )}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {(stats.totalDr || 0) >=
              (stats.totalAdvance || stats.totalCr || 0)
                ? "Net Debit Position (Receivable)"
                : "Net Credit Position (Advance Held)"}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Toolbar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Compact Search Input (Decreased Width, Not Stretching Full Width) */}
        <div className="w-[240px] sm:w-[280px] lg:w-[320px]">
          <UIInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, mobile, code, GSTIN..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => setSearchQuery("")}
            className="w-full"
          />
        </div>

        {/* Upfront Best Filter: Customer Scope / Segment (B2B, B2C, All) */}
        <div className="w-[170px] sm:w-[195px]">
          <UISelect
            value={customerScope}
            onChange={(val) => setCustomerScope(val)}
            options={SCOPE_MODAL_OPTIONS}
            placeholder="All Customers"
            size="md"
          />
        </div>

        {/* Filter Modal Trigger Button */}
        <UIButton
          type="button"
          variant={activeFilterCount > 0 ? "secondary" : "outline"}
          size="md"
          onClick={() => setIsFilterModalOpen(true)}
          startIcon={
            <Filter
              className={cn(
                "size-3.5",
                activeFilterCount > 0 ? "text-primary" : "text-text-muted",
              )}
            />
          }
          className={cn(
            "h-10 px-3 text-xs sm:text-sm font-semibold gap-1.5 transition-all select-none",
            activeFilterCount > 0 &&
              "border-primary/40 bg-primary/10 text-primary font-bold shadow-2xs",
          )}
          title="Open filters dialog"
        >
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="size-4.5 rounded-full bg-primary text-white text-[10.5px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </UIButton>

        {/* Quick Reset (only visible when filters or search query are active) */}
        {(activeFilterCount > 0 || searchQuery || customerScope !== "all") && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleResetFilters}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
            className="h-10 px-2 text-xs text-text-muted hover:text-text"
            title="Reset all filters"
          >
            Reset
          </UIButton>
        )}

        {/* Toolbar Action Cluster */}
        <div className="flex items-center gap-1.5 ml-auto">
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={handleRefresh}
            className="h-10 w-10 p-0 text-text-muted hover:text-text"
            title="Refresh customer table"
          >
            <RefreshCw
              className={cn(
                "size-4 text-text-muted hover:text-primary",
                isLoading && "animate-spin text-primary",
              )}
            />
          </UIButton>

          <UIButton
            type="button"
            variant="outline"
            size="md"
            startIcon={
              <Receipt className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            }
            onClick={() => navigate(ROUTES.CUSTOMER_SETTLEMENTS)}
            className="h-10 px-3 text-xs font-semibold hidden md:inline-flex"
            title="Outstanding Collections & Credit Settlements"
          >
            Settlements
          </UIButton>

          <PermissionGate permission="customer:create">
            {customerScope === "b2c" ? (
              <div className="flex items-center gap-2">
                <UIButton
                  type="button"
                  variant="outline"
                  size="md"
                  startIcon={
                    <Users className="size-3.5 text-purple-600 dark:text-purple-400" />
                  }
                  onClick={() => setIsB2cImportModalOpen(true)}
                  disabled={isUploading}
                  className="h-10 px-3 text-xs font-semibold hidden sm:inline-flex border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                  title="Import B2C Customer Records from Excel"
                >
                  Import B2C Customers
                </UIButton>
                <UIButton
                  type="button"
                  variant="outline"
                  size="md"
                  startIcon={
                    <BookOpen className="size-3.5 text-blue-600 dark:text-blue-400" />
                  }
                  onClick={() => setIsLegacyHistoryImportModalOpen(true)}
                  disabled={isUploading}
                  className="h-10 px-3 text-xs font-semibold hidden sm:inline-flex border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                  title="Import Customer Purchase History from Legacy Excel"
                >
                  Legacy History Import
                </UIButton>
              </div>
            ) : (
              <UIButton
                type="button"
                variant="outline"
                size="md"
                startIcon={<Download className="size-3.5 text-text-muted" />}
                onClick={handleImportClick}
                disabled={isUploading}
                className="h-10 px-3 text-xs font-semibold hidden sm:inline-flex"
                title="Import Customer Records from Excel"
              >
                {isUploading ? "Uploading..." : "Import"}
              </UIButton>
            )}
          </PermissionGate>

          {!hasWalkInCustomer && (
            <PermissionGate permission="customer:create">
              <UIButton
                type="button"
                variant="outline"
                size="md"
                startIcon={<Store className="size-3.5 text-emerald-600 dark:text-emerald-400" />}
                onClick={handleCreateWalkInCustomer}
                isLoading={isCreatingWalkIn}
                className="h-10 px-3.5 text-xs font-semibold border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs"
              >
                Create Walk-in Customer
              </UIButton>
            </PermissionGate>
          )}

          <PermissionGate permission="customer:create">
            <UIButton
              type="button"
              variant="primary"
              size="md"
              startIcon={<Plus className="size-3.5" />}
              onClick={handleCreateCustomer}
              className="h-10 px-3.5 text-xs font-semibold shadow-xs"
            >
              Add Customer
            </UIButton>
          </PermissionGate>
        </div>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ────── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col">
        {/* Internal Scroll Container: Definitive scroll parent */}
        <div
          ref={tableContainerRef}
          className="relative overflow-y-auto overflow-x-auto flex-1 min-h-0"
        >
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full"
          >
            {/* Sticky Table Header */}
            <UITableHeader
              sticky
              className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs border-b border-border"
            >
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text-muted uppercase tracking-wider bg-surface-alt/70 h-10">
                <UITableHead sticky className="min-w-[240px]">
                  Customer
                </UITableHead>
                <UITableHead sticky align="center" className="min-w-[100px]">
                  Segment
                </UITableHead>
                <UITableHead sticky align="right" className="min-w-[110px]">
                  Credit Limit
                </UITableHead>
                <UITableHead sticky align="right" className="min-w-[125px]">
                  Advance (CR)
                </UITableHead>
                <UITableHead sticky align="right" className="min-w-[130px]">
                  Credit Due (DR)
                </UITableHead>
                <UITableHead sticky align="right" className="min-w-[125px]">
                  Credit Note
                </UITableHead>
                <UITableHead sticky align="right" className="min-w-[80px]">
                  Actions
                </UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={7} rows={5} />
              ) : filteredAndSortedCustomers.length === 0 ? (
                <UITableEmpty
                  colSpan={7}
                  title="No customers found"
                  description={
                    debouncedSearch || activeFilterCount > 0
                      ? "No customers match your active filter criteria. Try clearing search or resetting filters."
                      : "No customer profiles registered yet."
                  }
                  action={
                    debouncedSearch || activeFilterCount > 0 ? (
                      <UIButton
                        variant="secondary"
                        size="sm"
                        onClick={handleResetFilters}
                      >
                        Clear Filters
                      </UIButton>
                    ) : (
                      <UIButton
                        variant="primary"
                        size="sm"
                        startIcon={<Plus className="size-4" />}
                        onClick={handleCreateCustomer}
                      >
                        Add First Customer
                      </UIButton>
                    )
                  }
                />
              ) : (
                filteredAndSortedCustomers.map((c, index) => {
                  const isOverLimit =
                    c.creditLimit > 0 && c.creditOutstanding > c.creditLimit;
                  // Trigger loading next 10 items when reaching the 8th row of any 10-row batch
                  const isTriggerRow =
                    index % 10 === 7 ||
                    index === filteredAndSortedCustomers.length - 3;

                  return (
                    <UITableRow
                      key={c._id}
                      ref={isTriggerRow ? eighthRowCallbackRef : null}
                      onClick={() => handleViewCustomer(c.rawCustomer || c)}
                      className={cn(
                        "group cursor-pointer transition-colors hover:bg-surface-hover/70 h-13",
                        c.isWalkIn && "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.09]"
                      )}
                    >
                      {/* 1. Customer: Line 1 = Name, Line 2 = Mobile (No Customer ID) */}
                      <UITableCell className="py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-8 rounded-lg bg-surface-alt border border-border/80 text-text flex items-center justify-center font-bold text-xs shrink-0 select-none">
                            {getInitials(c.name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text truncate hover:text-primary transition-colors text-xs sm:text-sm leading-tight">
                              {c.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs text-text-muted truncate mt-0.5">
                              <span className="text-[13px] font-bold text-text/90 font-mono tracking-tight">
                                {c.mobile && c.mobile !== "—" ? c.mobile : "—"}
                              </span>
                              {c.city ? (
                                <>
                                  <span className="text-text-muted/40 font-sans">
                                    •
                                  </span>
                                  <span className="font-sans text-text-muted/80 text-xs">
                                    {c.city}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </UITableCell>

                      {/* 2. Segment / Type */}
                      <UITableCell
                        align="center"
                        className="whitespace-nowrap py-2"
                      >
                        {c.isWalkIn ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                            <Store className="size-3 text-emerald-600 dark:text-emerald-400" />
                            Walk-in
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-alt border border-border/60 text-text-muted capitalize">
                            {c.customerType}
                          </span>
                        )}
                      </UITableCell>

                      {/* 3. Credit Limit */}
                      <UITableCell
                        align="right"
                        className="whitespace-nowrap font-mono tabular-nums text-xs py-2"
                      >
                        {c.creditLimit > 0 ? (
                          <div className="flex flex-col items-end leading-tight">
                            <span className="font-medium text-text">
                              ₹{formatCurrency(c.creditLimit)}
                            </span>
                            {c.creditDays > 0 && (
                              <span className="text-[10px] text-text-muted font-sans">
                                {c.creditDays}d terms
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-muted/40 font-mono text-xs">
                            —
                          </span>
                        )}
                      </UITableCell>

                      {/* 5. Advance Balance (CR) */}
                      <UITableCell
                        align="right"
                        className="whitespace-nowrap font-mono tabular-nums text-xs py-2"
                      >
                        {c.advanceBalance > 0 ? (
                          <div className="inline-flex items-baseline gap-1">
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              ₹{formatCurrency(c.advanceBalance)}
                            </span>
                            <span className="text-[9.5px] font-bold text-emerald-700/80 dark:text-emerald-300/80">
                              CR
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-muted/30 font-mono text-xs">
                            0.00
                          </span>
                        )}
                      </UITableCell>

                      {/* 6. Credit Due (DR) */}
                      <UITableCell
                        align="right"
                        className="whitespace-nowrap font-mono tabular-nums text-xs py-2"
                      >
                        {c.creditOutstanding > 0 ? (
                          <div className="flex flex-col items-end leading-tight">
                            <div className="inline-flex items-baseline gap-1">
                              <span className="font-semibold text-rose-600 dark:text-rose-400">
                                ₹{formatCurrency(c.creditOutstanding)}
                              </span>
                              <span className="text-[9.5px] font-bold text-rose-700/80 dark:text-rose-300/80">
                                DR
                              </span>
                            </div>
                            {isOverLimit && (
                              <span className="text-[9.5px] font-semibold text-rose-500 mt-0.5">
                                Over limit
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-text-muted/30 font-mono text-xs">
                            0.00
                          </span>
                        )}
                      </UITableCell>

                      {/* 7. Credit Note Balance */}
                      <UITableCell
                        align="right"
                        className="whitespace-nowrap font-mono tabular-nums text-xs py-2"
                      >
                        {c.creditNoteBalance > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCreditNotes?.(c.rawCustomer || c);
                            }}
                            className="inline-flex items-baseline gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 transition-colors cursor-pointer group"
                            title="View customer credit notes"
                          >
                            <span className="font-semibold font-mono">
                              ₹{formatCurrency(c.creditNoteBalance)}
                            </span>
                            <span className="text-[9.5px] font-bold text-indigo-700/80 dark:text-indigo-300/80">
                              CN
                            </span>
                          </button>
                        ) : (
                          <span className="text-text-muted/30 font-mono text-xs">
                            0.00
                          </span>
                        )}
                      </UITableCell>

                      {/* 8. Refined Row Actions */}
                      <UITableCell align="right" className="py-2">
                        <div
                          className="flex items-center justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Actions Dropdown */}
                          <UIDropdown align="right">
                            <UIDropdownTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className="size-7 rounded-md flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt transition-colors cursor-pointer"
                                title="More actions"
                              >
                                <MoreVertical className="size-3.5" />
                              </button>
                            </UIDropdownTrigger>
                            <UIDropdownMenu
                              align="right"
                              className="w-52 shadow-lg"
                            >
                              {!c.isWalkIn && (
                                <>
                                  <UIDropdownItem
                                    icon={
                                      <Wallet className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    }
                                    onClick={(e) => {
                                      e?.stopPropagation?.();
                                      handleReceiveAdvance(c.rawCustomer || c);
                                    }}
                                  >
                                    Receive Advance
                                  </UIDropdownItem>
                                  <UIDropdownItem
                                    icon={
                                      <Receipt className="size-4 text-rose-600 dark:text-rose-400 shrink-0" />
                                    }
                                    onClick={(e) => {
                                      e?.stopPropagation?.();
                                      handleSettleCredit(c.rawCustomer || c);
                                    }}
                                  >
                                    Settle Credit
                                  </UIDropdownItem>
                                  <UIDropdownItem
                                    icon={
                                      <Receipt className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                    }
                                    onClick={(e) => {
                                      e?.stopPropagation?.();
                                      handleViewCreditNotes?.(c.rawCustomer || c);
                                    }}
                                  >
                                    Credit Notes {c.creditNoteBalance > 0 ? `(₹${formatCurrency(c.creditNoteBalance)})` : ""}
                                  </UIDropdownItem>
                                </>
                              )}
                              <UIDropdownItem
                                icon={
                                  <BookOpen className="size-4 text-primary shrink-0" />
                                }
                                onClick={(e) => {
                                  e?.stopPropagation?.();
                                  handleViewTransactions(c.rawCustomer || c);
                                }}
                              >
                                Statement & Ledger
                              </UIDropdownItem>
                              <UIDropdownItem
                                icon={
                                  <Eye className="size-4 text-text-muted shrink-0" />
                                }
                                onClick={(e) => {
                                  e?.stopPropagation?.();
                                  handleViewCustomer(c.rawCustomer || c);
                                }}
                              >
                                View Details
                              </UIDropdownItem>
                              <UIDropdownItem
                                icon={
                                  <Edit3 className="size-4 text-text-muted shrink-0" />
                                }
                                onClick={(e) => {
                                  e?.stopPropagation?.();
                                  handleEditCustomer(c.rawCustomer || c);
                                }}
                              >
                                Edit Profile
                              </UIDropdownItem>
                              {!c.isWalkIn && (
                                <>
                                  <UIDropdownDivider />
                                  <UIDropdownItem
                                    destructive
                                    icon={
                                      <Trash2 className="size-4 text-error shrink-0" />
                                    }
                                    onClick={(e) => {
                                      e?.stopPropagation?.();
                                      handleDeleteCustomer(c.rawCustomer || c);
                                    }}
                                  >
                                    Delete Customer
                                  </UIDropdownItem>
                                </>
                              )}
                            </UIDropdownMenu>
                          </UIDropdown>
                        </div>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Infinite Scroll Trigger */}
          {!isLoading && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              scrollContainerRef={tableContainerRef}
            />
          )}
        </div>
      </div>

      {/* ── Comprehensive Filter & Sort Modal Dialog ─────────────────────────── */}
      <UIModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        className="max-w-md"
      >
        <UIModalHeader>
          <UIModalTitle className="flex items-center gap-2 text-base font-bold text-text">
            <Filter className="size-4.5 text-primary" />
            Filter & Sort Customers
          </UIModalTitle>
          <UIModalDescription>
            Configure customer segment scope, balance standing, status, and sort
            sequence.
          </UIModalDescription>
        </UIModalHeader>
        <UIModalBody>
          <div className="space-y-4 py-2">
            {/* 1. Segment Scope Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text flex items-center justify-between">
                <span>Account Segment</span>
                {customerScope !== "all" && (
                  <span className="text-[11px] text-primary font-bold">
                    Active Scope
                  </span>
                )}
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-alt border border-border rounded-xl">
                {SCOPE_MODAL_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = customerScope === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCustomerScope(opt.value)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        isSelected
                          ? "bg-surface text-primary border border-primary/20 shadow-xs font-bold"
                          : "text-text-muted hover:text-text hover:bg-surface/50 border border-transparent",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-3.5 shrink-0",
                          isSelected ? "text-primary" : "text-text-muted",
                        )}
                      />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Customer Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text flex items-center justify-between">
                <span>Customer Type</span>
                {selectedType !== "all" && (
                  <span className="text-[11px] text-primary font-bold">
                    Active Filter
                  </span>
                )}
              </label>
              <UISelect
                value={selectedType}
                onChange={(val) => setSelectedType(val)}
                options={CUSTOMER_TYPE_OPTIONS}
                placeholder="All Customer Types"
                size="md"
              />
            </div>

            {/* 3. Balance Standing */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text flex items-center justify-between">
                <span>Balance Standing</span>
                {selectedBalanceType !== "all" && (
                  <span className="text-[11px] text-primary font-bold">
                    Active Filter
                  </span>
                )}
              </label>
              <UISelect
                value={selectedBalanceType}
                onChange={(val) => setSelectedBalanceType(val)}
                options={BALANCE_FILTER_OPTIONS}
                placeholder="All Balances"
                size="md"
              />
              <span className="text-[11px] text-text-muted block">
                Filter by Credit Outstanding (DR), Advance (CR), or Over Limit
              </span>
            </div>

            {/* 4. Customer Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text flex items-center justify-between">
                <span>Customer Status</span>
                {selectedStatus !== "all" && (
                  <span className="text-[11px] text-primary font-bold">
                    Active Filter
                  </span>
                )}
              </label>
              <UISelect
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val)}
                options={STATUS_OPTIONS}
                placeholder="All Status"
                size="md"
              />
            </div>

            {/* 5. Sort Sequence */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text flex items-center justify-between">
                <span>Sort Sequence</span>
                {sortOption !== "updatedAt-desc" && (
                  <span className="text-[11px] text-primary font-bold">
                    Custom Sort
                  </span>
                )}
              </label>
              <UISelect
                value={sortOption}
                onChange={(val) => setSortOption(val)}
                options={SORT_SELECT_OPTIONS}
                placeholder="Sort Sequence"
                size="md"
              />
            </div>
          </div>
        </UIModalBody>
        <UIModalFooter className="flex items-center justify-between">
          <UIButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setCustomerScope("all");
              setSelectedType("all");
              setSelectedBalanceType("all");
              setSelectedStatus("all");
              setSortOption("updatedAt-desc");
            }}
            className="text-text-muted hover:text-text text-xs"
          >
            Reset Filters
          </UIButton>
          <UIButton
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setIsFilterModalOpen(false)}
            className="px-4 text-xs font-semibold shadow-xs"
          >
            Apply Filters
          </UIButton>
        </UIModalFooter>
      </UIModal>

      {/* ── Chunked Background Import Progress Modal ─────────────────────────────── */}
      <UIModal
        isOpen={chunkState.isModalOpen}
        onClose={() => {
          if (!chunkState.isImporting) {
            setChunkState((prev) => ({ ...prev, isModalOpen: false }));
          }
        }}
      >
        <UIModalHeader>
          <UIModalTitle>Importing Customers</UIModalTitle>
          <UIModalDescription>
            Processing customer records in batches. Please do not close your
            browser.
          </UIModalDescription>
        </UIModalHeader>
        <UIModalBody>
          <div className="space-y-4 py-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1 text-text">
                <span>Progress</span>
                <span>
                  {Math.round(
                    (chunkState.currentIndex /
                      (chunkState.chunks.length || 1)) *
                      100,
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (chunkState.currentIndex /
                        (chunkState.chunks.length || 1)) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-surface-alt rounded-lg border border-border">
                <span className="text-text-muted block">Processed Records</span>
                <span className="font-bold text-text font-mono text-sm">
                  {Math.min(
                    chunkState.currentIndex * 250,
                    chunkState.totalRecords,
                  )}{" "}
                  / {chunkState.totalRecords}
                </span>
              </div>
              <div className="p-2.5 bg-surface-alt rounded-lg border border-border">
                <span className="text-text-muted block">
                  Successful / Failed
                </span>
                <span className="font-bold font-mono text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {chunkState.stats.successful}
                  </span>{" "}
                  /{" "}
                  <span className="text-rose-600 dark:text-rose-400">
                    {chunkState.stats.failed}
                  </span>
                </span>
              </div>
            </div>

            {chunkState.error && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-xs text-error overflow-y-auto max-h-32">
                <p className="font-bold mb-1">Import Paused due to Error:</p>
                {chunkState.error}
              </div>
            )}
          </div>
        </UIModalBody>
        <UIModalFooter>
          <UIButton
            variant="ghost"
            onClick={() => {
              if (chunkState.isImporting) {
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                }
                setChunkState((prev) => ({ ...prev, isImporting: false }));
              } else {
                setChunkState((prev) => ({ ...prev, isModalOpen: false }));
              }
            }}
          >
            {chunkState.isImporting ? "Pause" : "Close"}
          </UIButton>

          {!chunkState.isImporting &&
            chunkState.currentIndex < chunkState.chunks.length && (
              <UIButton
                variant="primary"
                onClick={() => {
                  abortControllerRef.current = new AbortController();
                  setChunkState((prev) => ({ ...prev, isImporting: true }));
                  processChunk(
                    chunkState.currentIndex,
                    chunkState.chunks,
                    chunkState.stats,
                  );
                }}
              >
                {chunkState.currentIndex === 0
                  ? "Start Import"
                  : "Resume Import"}
              </UIButton>
            )}
        </UIModalFooter>
      </UIModal>

      {/* ── Excel Import Configuration & Preview Modals ──────────────────────── */}
      <ImportConfigModal
        isOpen={isImportConfigOpen}
        onClose={() => setIsImportConfigOpen(false)}
        onImportSubmit={handleImportSubmit}
        isUploading={isUploading}
      />
      <CustomerImportPreviewModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        previewData={importPreviewData}
        onImportSuccess={handleImportSuccess}
      />
      <OutstandingImportPreviewModal
        isOpen={isOutstandingImportModalOpen}
        onClose={() => setIsOutstandingImportModalOpen(false)}
        previewData={importPreviewData}
        onImportSuccess={handleImportSuccess}
        importType={activeImportType}
      />
      <B2cCustomerImportModal
        isOpen={isB2cImportModalOpen}
        onClose={() => setIsB2cImportModalOpen(false)}
        onSuccess={() => {
          handleRefresh();
        }}
      />
      <B2cLegacyHistoryImportModal
        isOpen={isLegacyHistoryImportModalOpen}
        onClose={() => setIsLegacyHistoryImportModalOpen(false)}
        onSuccess={() => {
          handleRefresh();
        }}
      />
    </div>
  );
};

export default CustomersDesktopPage;
