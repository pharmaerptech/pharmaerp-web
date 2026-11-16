// src/features/parties/suppliers/pages/desktop/SuppliersDesktopPage.jsx

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  Plus,
  Download,
  Eye,
  Edit3,
  Trash2,
  Scale,
  ArrowDownRight,
  ArrowUpRight,
  Phone,
  Mail,
  MoreVertical,
  Building2,
  AlertTriangle,
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
  UITableScrollArea,
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
  UIIconButton,
  UIAlert,
  PermissionGate,
} from "@/components/ui";
import { CompanyFilterSelect, CompanyBadge } from "@/components/shared";
import { cn } from "@/lib/utils";
import supplierService from "../../services/supplierService";
import SupplierImportPreviewModal from "../../components/SupplierImportPreviewModal";
import SupplierImportConfigModal from "../../components/SupplierImportConfigModal";
import SupplierOutstandingImportPreviewModal from "../../components/SupplierOutstandingImportPreviewModal";

const PAGE_LIMIT = 10;

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getInitials = (name) => {
  if (!name) return "SU";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const SUPPLIER_TYPE_OPTIONS = [
  { label: "All Types", value: "all" },
  { label: "Manufacturer", value: "manufacturer" },
  { label: "Distributor", value: "distributor" },
  { label: "Wholesaler", value: "wholesaler" },
  { label: "Retailer", value: "retailer" },
  { label: "Stockist", value: "stockist" },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Blocked", value: "blocked" },
];

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

export const SuppliersDesktopPage = ({
  handleCreateSupplier,
  handleViewSupplier,
  handleEditSupplier,
  handleDeleteSupplier,
  handleRefresh: propHandleRefresh,
  stats: propStats,
  error: propError,
  companyFilter,
  clearMessage,
}) => {
  const tableContainerRef = useRef(null);

  // Core Supplier data and infinite scroll pagination
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Local Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Modals & Popovers
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isImportConfigOpen, setIsImportConfigOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isOutstandingImportModalOpen, setIsOutstandingImportModalOpen] =
    useState(false);
  const [activeImportType, setActiveImportType] = useState("standard");
  const [importPreviewData, setImportPreviewData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Format supplier for display
  const formatSupplierRow = useCallback((sup) => {
    const rawType = sup?.supplierType || sup?.type || "distributor";
    const displayType = String(rawType)
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return {
      ...sup,
      id: sup?._id,
      displayName: sup?.businessName || sup?.name || "Supplier",
      displayCode: sup?.supplierCode || "-",
      displayType,
      displayMobile: sup?.mobile || "-",
      displayEmail: sup?.email || "",
      displayStatus: sup?.status || "Active",
      outstandingAmount: Number(sup?.outstandingAmount || 0),
      balanceType: sup?.balanceType || "cr",
      gstin: sup?.taxIdentification?.gstin || sup?.gstin || "-",
      city: sup?.address?.city || sup?.billingAddress?.city || "-",
      state: sup?.address?.state || sup?.billingAddress?.state || "-",
      companyId: sup?.companyId || null,
    };
  }, []);

  // Build query params
  const buildQueryParams = useCallback(
    (page = 1) => {
      const params = {
        page,
        limit: PAGE_LIMIT,
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedType !== "all") params.supplierType = selectedType;
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (companyFilter?.queryCompanyId) {
        params.companyId = companyFilter.queryCompanyId;
      }

      // Sort
      if (sortBy === "name_asc") {
        params.sortBy = "businessName";
        params.sortOrder = "asc";
      } else if (sortBy === "name_desc") {
        params.sortBy = "businessName";
        params.sortOrder = "desc";
      } else if (sortBy === "oldest") {
        params.sortBy = "createdAt";
        params.sortOrder = "asc";
      } else {
        params.sortBy = "createdAt";
        params.sortOrder = "desc";
      }

      return params;
    },
    [searchQuery, selectedType, selectedStatus, sortBy, companyFilter?.queryCompanyId],
  );

  // Initial Fetch
  const fetchInitialSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = buildQueryParams(1);
      const res = await supplierService.getSuppliers(params);
      const resData = res.data?.data || {};
      const rawList = Array.isArray(resData.suppliers) ? resData.suppliers : [];
      const total = Number(resData.total ?? rawList.length);

      const formatted = rawList.map(formatSupplierRow);
      setSuppliers(formatted);
      setTotalCount(total);
      setCurrentPage(1);
      setHasMore(formatted.length < total);

      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.warn("Failed to fetch suppliers:", err);
      setSuppliers([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryParams, formatSupplierRow]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInitialSuppliers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchInitialSuppliers, companyFilter?.selectedCompanyId]);

  // Load More Infinite Scroll
  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const params = buildQueryParams(nextPage);
      const res = await supplierService.getSuppliers(params);
      const resData = res.data?.data || {};
      const rawList = Array.isArray(resData.suppliers) ? resData.suppliers : [];
      const total = Number(resData.total ?? totalCount);

      if (rawList.length > 0) {
        setSuppliers((prev) => {
          const existingIds = new Set(prev.map((s) => s._id || s.id));
          const newRows = rawList
            .map(formatSupplierRow)
            .filter((s) => !existingIds.has(s._id || s.id));
          const combined = [...prev, ...newRows];
          setHasMore(combined.length < total);
          return combined;
        });
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn("Failed to load more suppliers:", err);
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
    formatSupplierRow,
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

  // Refresh
  const handleRefresh = useCallback(() => {
    fetchInitialSuppliers();
    if (propHandleRefresh) propHandleRefresh();
  }, [fetchInitialSuppliers, propHandleRefresh]);

  // Reset Filters
  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedStatus("all");
    setSortBy("newest");
  }, []);

  // Compute dynamic stats across loaded or backend stats
  const stats = useMemo(() => {
    if (propStats && (propStats.total || propStats.totalCr !== undefined)) {
      return propStats;
    }
    const count = totalCount || suppliers.length;
    let totalCr = 0;
    let totalDr = 0;
    let active = 0;
    let inactive = 0;
    let blocked = 0;

    for (const s of suppliers) {
      const amt = Number(s.outstandingAmount || 0);
      if (String(s.balanceType).toLowerCase() === "dr") {
        totalDr += amt;
      } else {
        totalCr += amt;
      }
      const st = String(s.displayStatus).toLowerCase();
      if (st === "active") active++;
      else if (st === "inactive") inactive++;
      else if (st === "blocked") blocked++;
    }

    const netRunning = Math.abs(totalCr - totalDr);
    const runningType = totalCr >= totalDr ? "Cr" : "Dr";

    return {
      total: count,
      totalCr,
      totalDr,
      netRunning,
      runningType,
      active,
      inactive,
      blocked,
    };
  }, [propStats, totalCount, suppliers]);

  // Import handler
  const handleImportSubmit = async (file, importType) => {
    try {
      setIsUploading(true);
      setActiveImportType(importType);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("importType", importType);

      const res = await supplierService.previewImport(formData);
      setImportPreviewData(res.data?.data || []);
      setIsImportConfigOpen(false);

      if (importType === "outstanding") {
        setIsOutstandingImportModalOpen(true);
      } else {
        setIsImportModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to parse supplier Excel", err);
      alert(err?.response?.data?.message || "Failed to parse Excel file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportSuccess = (successful, failed, errors) => {
    setIsImportModalOpen(false);
    setIsOutstandingImportModalOpen(false);
    if (failed > 0) {
      alert(
        `Imported ${successful} successfully. ${failed} failed.\nErrors: ${errors?.join(", ") || ""}`,
      );
    } else if (successful > 0) {
      alert(`Imported ${successful} successfully.`);
    }
    handleRefresh();
  };

  const activeFilterCount =
    (selectedType !== "all" ? 1 : 0) +
    (selectedStatus !== "all" ? 1 : 0) +
    (sortBy !== "newest" ? 1 : 0);

  const getStatusBadge = (status) => {
    const s = String(status).toLowerCase();
    if (s === "active")
      return (
        <UIBadge variant="soft" color="success">
          Active
        </UIBadge>
      );
    if (s === "inactive")
      return (
        <UIBadge variant="soft" color="error">
          Inactive
        </UIBadge>
      );
    if (s === "blocked")
      return (
        <UIBadge variant="soft" color="warning">
          Blocked
        </UIBadge>
      );
    return (
      <UIBadge variant="soft" color="neutral">
        {status}
      </UIBadge>
    );
  };

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* Global Error Banner */}
      {propError && (
        <UIAlert
          intent="danger"
          title="Something went wrong"
          description={propError}
          onClose={clearMessage}
        />
      )}

      {/* ── 1. Compact 4-Card Statistics Grid (Top of Page) ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Suppliers */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <Users className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total Suppliers
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.total}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Verified vendor directory
            </div>
          </div>
        </div>

        {/* Card 2: Payable Dues (CR) */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-error-soft text-error flex items-center justify-center shrink-0">
            <ArrowDownRight className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-error truncate">
              Payables Due (CR)
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.totalCr)}
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono truncate mt-0.5">
              Outstanding bills payable
            </div>
          </div>
        </div>

        {/* Card 3: Supplier Advances (DR) */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <ArrowUpRight className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              Advances (DR)
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.totalDr)}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate mt-0.5">
              Advance payments made
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
              Net Balance
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.netRunning)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {stats.runningType === "Cr"
                ? "Net Payable (Credit)"
                : "Net Advance (Debit)"}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Filter Toolbar ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Search Input */}
        <div className="w-[240px] sm:w-[280px] lg:w-[320px]">
          <UIInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search supplier name, mobile, or code..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => setSearchQuery("")}
            className="w-full"
          />
        </div>

        {/* Supplier Type Dropdown */}
        <div className="w-[160px] sm:w-[180px]">
          <UISelect
            value={selectedType}
            onChange={(val) => setSelectedType(val)}
            options={SUPPLIER_TYPE_OPTIONS}
            placeholder="All Types"
            size="md"
          />
        </div>

        {/* Workspace Level Company Filter (Zero width/elements at Company level) */}
        <CompanyFilterSelect
          value={companyFilter?.selectedCompanyId || "all"}
          onChange={companyFilter?.setSelectedCompanyId}
          size="md"
          className="w-[170px] sm:w-[195px]"
        />

        {/* Filter Modal Trigger */}
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

        {/* Reset Filter Button */}
        {(activeFilterCount > 0 || searchQuery || selectedType !== "all") && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleResetFilters}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
            className="h-10 px-2 text-xs text-text-muted hover:text-text"
            title="Reset filters"
          >
            Reset
          </UIButton>
        )}

        {/* Right-Aligned Action Cluster */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Refresh Button */}
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={handleRefresh}
            className="h-10 w-10 p-0 text-text-muted hover:text-text"
            title="Refresh suppliers"
          >
            <RefreshCw
              className={cn(
                "size-4 text-text-muted hover:text-primary",
                isLoading && "animate-spin text-primary",
              )}
            />
          </UIButton>

          {/* Import Button */}
          <PermissionGate permission="supplier:create">
            <UIButton
              type="button"
              variant="outline"
              size="md"
              startIcon={<Download className="size-3.5 text-text-muted" />}
              onClick={() => setIsImportConfigOpen(true)}
              disabled={isUploading}
              className="h-10 px-3 text-xs font-semibold hidden sm:inline-flex"
              title="Import Supplier Records from Excel"
            >
              {isUploading ? "Uploading..." : "Import"}
            </UIButton>
          </PermissionGate>

          {/* Add Supplier Button */}
          <PermissionGate permission="supplier:create">
            <UIButton
              type="button"
              variant="primary"
              size="md"
              startIcon={<Plus className="size-3.5" />}
              onClick={handleCreateSupplier}
              className="h-10 px-3.5 text-xs font-semibold shadow-xs"
            >
              Add Supplier
            </UIButton>
          </PermissionGate>
        </div>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ──── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
        <UITableScrollArea containerRef={tableContainerRef}>
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full text-xs font-sans"
          >
            {/* Sticky Table Header */}
            <UITableHeader
              sticky
              className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs border-b border-border"
            >
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text-muted uppercase tracking-wider bg-surface-alt/70 h-10">
                <UITableHead sticky className="min-w-[220px]">
                  Supplier Name
                </UITableHead>
                <UITableHead sticky className="min-w-[110px]">
                  Code
                </UITableHead>
                <UITableHead sticky className="min-w-[130px]">
                  Type
                </UITableHead>
                <UITableHead sticky className="min-w-[140px]">
                  Mobile
                </UITableHead>
                <UITableHead sticky align="right" className="min-w-[150px]">
                  Balance
                </UITableHead>
                <UITableHead sticky align="center" className="min-w-[100px]">
                  Status
                </UITableHead>
                <UITableHead sticky align="right" className="w-20">
                  Actions
                </UITableHead>
              </UITableRow>
            </UITableHeader>

              <UITableBody>
                {isLoading ? (
                  <UITableLoading colSpan={7} rows={5} />
                ) : suppliers.length === 0 ? (
                  <UITableEmpty
                    colSpan={7}
                    title="No suppliers found"
                    description={
                      searchQuery ||
                      selectedType !== "all" ||
                      selectedStatus !== "all"
                        ? "No suppliers match your active filter criteria. Try clearing filters."
                        : "No supplier accounts recorded yet."
                    }
                    action={
                      searchQuery ||
                      selectedType !== "all" ||
                      selectedStatus !== "all" ? (
                        <UIButton
                          variant="secondary"
                          size="sm"
                          onClick={handleResetFilters}
                        >
                          Clear Filters
                        </UIButton>
                      ) : undefined
                    }
                  />
                ) : (
                  suppliers.map((sup, index) => {
                    const isCredit = sup.balanceType?.toLowerCase() === "cr";
                    const isTriggerRow =
                      index % 10 === 7 || index === suppliers.length - 3;

                    return (
                      <UITableRow
                        key={sup._id || sup.id}
                        ref={isTriggerRow ? eighthRowCallbackRef : null}
                        onClick={() => handleViewSupplier(sup)}
                        className="cursor-pointer hover:bg-surface-hover/70 transition-colors"
                      >
                        {/* Supplier Name */}
                        <UITableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {getInitials(sup.displayName)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="font-semibold text-[13px] text-text truncate">
                                  {sup.displayName}
                                </p>
                                <CompanyBadge company={sup.companyId} />
                              </div>
                              <p className="text-[11px] text-text-muted truncate">
                                {sup.displayEmail || sup.city || "-"}
                              </p>
                            </div>
                          </div>
                        </UITableCell>

                        {/* Code */}
                        <UITableCell className="font-mono text-xs font-semibold text-text-muted whitespace-nowrap">
                          {sup.displayCode}
                        </UITableCell>

                        {/* Type */}
                        <UITableCell className="whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-border text-[10.5px] font-bold text-text-muted bg-surface-alt">
                            {sup.displayType}
                          </span>
                        </UITableCell>

                        {/* Mobile */}
                        <UITableCell className="font-mono text-[13px] font-bold text-text/90 tracking-tight whitespace-nowrap">
                          {sup.displayMobile}
                        </UITableCell>

                        {/* Outstanding Balance */}
                        <UITableCell
                          align="right"
                          className="whitespace-nowrap font-mono tabular-nums"
                        >
                          <div className="flex flex-col items-end">
                            <span
                              className={cn(
                                "font-bold text-sm",
                                isCredit
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-emerald-600 dark:text-emerald-400",
                              )}
                            >
                              ₹{formatCurrency(sup.outstandingAmount)}
                            </span>
                            <span className="text-[9.5px] text-text-muted font-semibold uppercase">
                              {sup.balanceType?.toUpperCase() || "CR"}
                            </span>
                          </div>
                        </UITableCell>

                        {/* Status */}
                        <UITableCell
                          align="center"
                          className="whitespace-nowrap"
                        >
                          {getStatusBadge(sup.displayStatus)}
                        </UITableCell>

                        {/* Actions */}
                        <UITableCell
                          align="right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <UIDropdown align="right">
                            <UIDropdownTrigger asChild>
                              <UIIconButton
                                variant="ghost"
                                size="sm"
                                className="text-text-muted hover:text-text h-8 w-8"
                              >
                                <MoreVertical className="size-4" />
                              </UIIconButton>
                            </UIDropdownTrigger>

                            <UIDropdownMenu width="w-44">
                              <UIDropdownItem
                                icon={<Eye className="size-3.5" />}
                                onClick={() => handleViewSupplier(sup)}
                              >
                                View Details
                              </UIDropdownItem>
                              <UIDropdownItem
                                icon={<Edit3 className="size-3.5" />}
                                onClick={() => handleEditSupplier(sup)}
                              >
                                Edit Profile
                              </UIDropdownItem>
                              <UIDropdownDivider />
                              <UIDropdownItem
                                destructive
                                icon={<Trash2 className="size-3.5" />}
                                onClick={() => handleDeleteSupplier(sup)}
                              >
                                Delete
                              </UIDropdownItem>
                            </UIDropdownMenu>
                          </UIDropdown>
                        </UITableCell>
                      </UITableRow>
                    );
                  })
                )}
              </UITableBody>
            </UITable>

            {/* Infinite Scroll Trigger */}
            {!isLoading && suppliers.length > 0 && (
              <UIInfiniteScroll
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isLoading={isLoadingMore}
                rootRef={tableContainerRef}
                rootMargin="160px"
                endMessage={
                  !hasMore && suppliers.length > 0 ? (
                    <span className="font-mono text-[11px] text-text-muted select-none">
                      ✓ All {totalCount} matching suppliers loaded
                    </span>
                  ) : null
                }
              />
            )}
        </UITableScrollArea>
      </div>

      {/* ── Filter Modal ──────────────────────────────────────────────────────── */}
      <UIModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        className="overflow-visible"
      >
        <UIModalHeader>
          <UIModalTitle>Filter Suppliers</UIModalTitle>
          <UIModalDescription>
            Refine supplier list by type, status, or sorting.
          </UIModalDescription>
        </UIModalHeader>
        <UIModalBody className="overflow-visible space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted">
              Supplier Type
            </label>
            <UISelect
              value={selectedType}
              onChange={(val) => setSelectedType(val)}
              options={SUPPLIER_TYPE_OPTIONS}
              placeholder="All Types"
              size="md"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted">
              Status
            </label>
            <UISelect
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
              options={STATUS_OPTIONS}
              placeholder="All Status"
              size="md"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-muted">
              Sort By
            </label>
            <UISelect
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={SORT_OPTIONS}
              placeholder="Sort By..."
              size="md"
            />
          </div>
        </UIModalBody>
        <UIModalFooter>
          <UIButton variant="ghost" onClick={handleResetFilters}>
            Clear Filters
          </UIButton>
          <UIButton
            variant="primary"
            onClick={() => setIsFilterModalOpen(false)}
          >
            Apply Filters
          </UIButton>
        </UIModalFooter>
      </UIModal>

      {/* ── Import Modals ────────────────────────────────────────────────────── */}
      <SupplierImportConfigModal
        isOpen={isImportConfigOpen}
        onClose={() => setIsImportConfigOpen(false)}
        onImportSubmit={handleImportSubmit}
        onSubmit={handleImportSubmit}
        isUploading={isUploading}
        isLoading={isUploading}
      />

      <SupplierImportPreviewModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        previewData={importPreviewData}
        onImportSuccess={handleImportSuccess}
        onSuccess={handleImportSuccess}
      />

      <SupplierOutstandingImportPreviewModal
        isOpen={isOutstandingImportModalOpen}
        onClose={() => setIsOutstandingImportModalOpen(false)}
        previewData={importPreviewData}
        onImportSuccess={handleImportSuccess}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default SuppliersDesktopPage;
