// src/features/sales/credit-notes/pages/desktop/CreditNotesDesktopPage.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
} from "lucide-react";

import {
  UIButton,
  UIInput,
  UISelect,
  UIDatePicker,
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
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import useBranch from "@/features/branch/hooks/useBranch";
import creditNoteService from "../../services/creditNoteService";
import CreditNoteDetailsDialog from "../../components/CreditNoteDetailsDialog";

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_SELECT_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Active", value: "ACTIVE" },
  { label: "Partially Used", value: "PARTIALLY_REDEEMED" },
  { label: "Fully Redeemed", value: "FULLY_REDEEMED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const DATE_RANGE_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last7days" },
  { label: "This Month", value: "thisMonth" },
  { label: "Custom Range", value: "custom" },
];

const BILLING_MODE_OPTIONS = [
  { label: "All Modes", value: "all" },
  { label: "B2C (Retail)", value: "B2C" },
  { label: "B2B (Wholesale)", value: "B2B" },
];

const SORT_SELECT_OPTIONS = [
  { label: "Recent Issue Date", value: "issueDate-desc" },
  { label: "Oldest Issue Date", value: "issueDate-asc" },
  { label: "Amount: High to Low", value: "totalAmount-desc" },
  { label: "Amount: Low to High", value: "totalAmount-asc" },
  { label: "Balance: High to Low", value: "balanceAmount-desc" },
  { label: "Balance: Low to High", value: "balanceAmount-asc" },
];

const PAGE_LIMIT = 20;

export const CreditNotesDesktopPage = () => {
  const { currentWorkspace } = useWorkspace();
  const { currentBranch } = useBranch();
  const tableContainerRef = useRef(null);

  // Credit Notes & Infinite Scroll State
  const [creditNotes, setCreditNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Global Statistics State
  const [stats, setStats] = useState({
    totalIssuedCount: 0,
    totalIssuedAmount: 0,
    totalRedeemedAmount: 0,
    totalActiveBalance: 0,
    activeCount: 0,
  });

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [billingModeFilter, setBillingModeFilter] = useState("all");
  const [sortOption, setSortOption] = useState("issueDate-desc");

  // Filter Modal Dialog State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState(null);

  // View Details Modal State (no drawer, no page navigation)
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Debounce search query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Compute active filters count (excluding search)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (dateRange !== "all") count++;
    if (billingModeFilter !== "all") count++;
    if (sortOption !== "issueDate-desc") count++;
    return count;
  }, [statusFilter, dateRange, billingModeFilter, sortOption]);

  // Date range parameter calculator
  const computeDateRangeParams = (selectedRange, customStart, customEnd) => {
    const params = {};
    const now = new Date();

    if (selectedRange === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      params.startDate = start.toISOString();
      params.endDate = end.toISOString();
    } else if (selectedRange === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const end = new Date(yesterday);
      end.setHours(23, 59, 59, 999);
      params.startDate = yesterday.toISOString();
      params.endDate = end.toISOString();
    } else if (selectedRange === "last7days") {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      params.startDate = start.toISOString();
      params.endDate = end.toISOString();
    } else if (selectedRange === "thisMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      params.startDate = start.toISOString();
      params.endDate = end.toISOString();
    } else if (selectedRange === "custom") {
      if (customStart) {
        const s = new Date(customStart);
        s.setHours(0, 0, 0, 0);
        params.startDate = s.toISOString();
      }
      if (customEnd) {
        const e = new Date(customEnd);
        e.setHours(23, 59, 59, 999);
        params.endDate = e.toISOString();
      }
    }

    return params;
  };

  // Build API Query Parameters
  const buildQueryParams = (page) => {
    const [sBy, sOrder] = sortOption.split("-");
    const dateParams = computeDateRangeParams(dateRange, customStartDate, customEndDate);

    const params = {
      page,
      limit: PAGE_LIMIT,
      branchId: currentBranch?._id || undefined,
      ...dateParams,
    };

    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter && statusFilter !== "all") params.status = statusFilter;
    if (billingModeFilter && billingModeFilter !== "all") params.billingMode = billingModeFilter;
    if (sBy) params.sortBy = sBy;
    if (sOrder) params.sortOrder = sOrder;

    return params;
  };

  // Fetch Page 1 and global stats
  const fetchInitialCreditNotes = useCallback(async () => {
    if (!currentWorkspace) return;
    setIsLoading(true);
    try {
      const params = buildQueryParams(1);
      const [notesRes, statsRes] = await Promise.all([
        creditNoteService.getCreditNotes(params),
        creditNoteService.getCreditNoteStats({ branchId: currentBranch?._id || undefined }),
      ]);

      const resData = notesRes.data?.data || {};
      const noteList = Array.isArray(resData.creditNotes)
        ? resData.creditNotes
        : Array.isArray(resData)
        ? resData
        : [];
      const total = resData.meta?.total ?? resData.total ?? noteList.length;

      const rawStats = statsRes.data?.data || statsRes.data || {};
      setStats({
        totalIssuedCount: rawStats.totalIssuedCount ?? total,
        totalIssuedAmount: Number(rawStats.totalIssuedAmount || 0),
        totalRedeemedAmount: Number(rawStats.totalRedeemedAmount || 0),
        totalActiveBalance: Number(rawStats.totalActiveBalance || 0),
        activeCount: rawStats.activeCount ?? 0,
      });

      setCreditNotes(noteList);
      setTotalCount(total);
      setCurrentPage(1);
      setHasMore(noteList.length < total);

      // Scroll table container back to top
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.warn("Failed to fetch credit notes:", err);
      setCreditNotes([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentWorkspace,
    currentBranch?._id,
    debouncedSearch,
    statusFilter,
    dateRange,
    customStartDate,
    customEndDate,
    billingModeFilter,
    sortOption,
  ]);

  // Load next batch via Infinite Scroll
  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore || !currentWorkspace) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const params = buildQueryParams(nextPage);
      const res = await creditNoteService.getCreditNotes(params);
      const resData = res.data?.data || {};
      const noteList = Array.isArray(resData.creditNotes)
        ? resData.creditNotes
        : Array.isArray(resData)
        ? resData
        : [];
      const total = resData.meta?.total ?? resData.total ?? totalCount;

      if (noteList.length > 0) {
        setCreditNotes((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const newRows = noteList.filter((c) => !existingIds.has(c._id));
          const combined = [...prev, ...newRows];
          setHasMore(combined.length < total);
          return combined;
        });
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn("Failed to load more credit notes:", err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    currentPage,
    hasMore,
    isLoading,
    isLoadingMore,
    currentWorkspace,
    currentBranch?._id,
    debouncedSearch,
    statusFilter,
    dateRange,
    customStartDate,
    customEndDate,
    billingModeFilter,
    sortOption,
    totalCount,
  ]);

  // Re-fetch when filters/search change
  useEffect(() => {
    fetchInitialCreditNotes();
  }, [fetchInitialCreditNotes]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setDateRange("all");
    setCustomStartDate(null);
    setCustomEndDate(null);
    setBillingModeFilter("all");
    setSortOption("issueDate-desc");
  };

  // Open Details Dialog (Row Click)
  const handleViewDetails = (cnItem) => {
    if (!cnItem) return;
    setSelectedCreditNote(cnItem);
    setIsViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedCreditNote(null);
  };

  const handleCancelSuccess = () => {
    setToastMessage("Credit Note cancelled successfully.");
    setTimeout(() => setToastMessage(null), 3000);
    fetchInitialCreditNotes();
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return (
          <UIBadge variant="soft" color="success" className="font-semibold text-[11px] px-2 py-0.5">
            Active
          </UIBadge>
        );
      case "PARTIALLY_REDEEMED":
        return (
          <UIBadge variant="soft" color="warning" className="font-semibold text-[11px] px-2 py-0.5">
            Partially Used
          </UIBadge>
        );
      case "FULLY_REDEEMED":
        return (
          <UIBadge variant="soft" color="info" className="font-semibold text-[11px] px-2 py-0.5">
            Fully Redeemed
          </UIBadge>
        );
      case "CANCELLED":
        return (
          <UIBadge variant="soft" color="error" className="font-semibold text-[11px] px-2 py-0.5">
            Cancelled
          </UIBadge>
        );
      default:
        return (
          <UIBadge variant="soft" color="neutral" className="font-semibold text-[11px] px-2 py-0.5">
            {status || "—"}
          </UIBadge>
        );
    }
  };

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-8 z-[9999] flex items-center gap-2.5 rounded-2xl border border-primary/30 bg-surface/95 px-4 py-3 text-sm font-semibold text-text shadow-xl backdrop-blur-md"
          >
            <CheckCircle2 className="size-5 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Compact 4-Card Statistics Grid (Top of Page) ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Notes Issued */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <Receipt className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total Notes Issued
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalIssuedCount}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Total credit vouchers generated
            </div>
          </div>
        </div>

        {/* Card 2: Total Credit Value */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <RotateCcw className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-primary truncate">
              Total Credit Value
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.totalIssuedAmount)}
            </div>
            <div className="text-[10px] text-primary/80 truncate mt-0.5">
              Return credit voucher volume
            </div>
          </div>
        </div>

        {/* Card 3: Redeemed in Invoices */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-blue-600 dark:text-blue-400 truncate">
              Redeemed in Sales
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.totalRedeemedAmount)}
            </div>
            <div className="text-[10px] text-blue-600/80 dark:text-blue-400 font-mono truncate mt-0.5">
              {stats.totalIssuedAmount > 0
                ? `${Math.round((stats.totalRedeemedAmount / stats.totalIssuedAmount) * 100)}% utilized across invoices`
                : "Used against purchases"}
            </div>
          </div>
        </div>

        {/* Card 4: Usable Active Balance */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <Clock className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              Active Available Balance
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.totalActiveBalance)}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate mt-0.5">
              {stats.activeCount} notes ready for checkout
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Toolbar (Account Balances Pattern) ────────── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Prominent Search Input */}
        <div className="flex-1 min-w-[240px] sm:min-w-[280px]">
          <UIInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search CN#, customer name, phone, return#..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => setSearchQuery("")}
            className="w-full"
          />
        </div>

        {/* Upfront Quick Filter: Status */}
        <div className="w-[180px] sm:w-[200px]">
          <UISelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={STATUS_SELECT_OPTIONS}
            placeholder="All Statuses"
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
              className={cn("size-3.5", activeFilterCount > 0 ? "text-primary" : "text-text-muted")}
            />
          }
          className={cn(
            "h-10 px-3 text-xs sm:text-sm font-semibold gap-1.5 transition-all select-none",
            activeFilterCount > 0 && "border-primary/40 bg-primary/10 text-primary font-bold shadow-2xs"
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
        {(activeFilterCount > 0 || searchQuery || statusFilter !== "all") && (
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

        {/* Refresh Button */}
        <div className="flex items-center gap-1.5 ml-auto">
          <UIButton
            type="button"
            variant="secondary"
            size="md"
            disabled={isLoading}
            onClick={fetchInitialCreditNotes}
            startIcon={
              <RefreshCw className={cn("size-3.5 text-primary", isLoading && "animate-spin")} />
            }
            className="h-10 px-3 text-xs sm:text-sm font-semibold"
            title="Refresh Credit Notes"
          >
            Refresh
          </UIButton>
        </div>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ────── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col">
        {/* Internal Vertical Scroll Container: The definitive scroll parent */}
        <div
          ref={tableContainerRef}
          className="relative overflow-y-auto overflow-x-auto flex-1 min-h-0 divide-y divide-border/60"
        >
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full"
          >
            {/* Sticky Header: pinned to top of tableContainerRef with solid surface background */}
            <UITableHeader sticky className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs">
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
                <UITableHead sticky className="min-w-[180px]">Credit Note #</UITableHead>
                <UITableHead sticky className="min-w-[130px]">Issue Date</UITableHead>
                <UITableHead sticky className="min-w-[220px]">Customer</UITableHead>
                <UITableHead sticky align="right" className="min-w-[140px]">Total Amount</UITableHead>
                <UITableHead sticky align="right" className="min-w-[140px]">Redeemed</UITableHead>
                <UITableHead sticky align="right" className="min-w-[160px]">Balance Available</UITableHead>
                <UITableHead sticky align="center" className="min-w-[130px]">Status</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={7} rows={8} />
              ) : creditNotes.length === 0 ? (
                <UITableEmpty
                  colSpan={7}
                  title="No credit notes found"
                  description={
                    debouncedSearch || statusFilter !== "all" || dateRange !== "all" || billingModeFilter !== "all"
                      ? "No credit notes match your selected filter criteria. Try resetting filters."
                      : "No credit notes recorded yet. Credit notes are issued on sales returns or manual credits."
                  }
                  action={
                    (debouncedSearch || statusFilter !== "all" || dateRange !== "all" || billingModeFilter !== "all") ? (
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
                creditNotes.map((cnItem) => {
                  const cust = cnItem.customerId;
                  const custName = typeof cust === "object" ? cust?.name : (cnItem.customerName || "Walk-in Retail Customer");
                  const custPhone = typeof cust === "object" ? (cust?.mobile || cust?.phone) : cnItem.customerPhone;
                  const issueTimestamp = cnItem.issueDate || cnItem.date || cnItem.createdAt;

                  return (
                    <UITableRow
                      key={cnItem._id}
                      onClick={() => handleViewDetails(cnItem)}
                      className="cursor-pointer transition-colors hover:bg-surface-hover/70"
                      title="Click to view full credit note details"
                    >
                      {/* 1. Credit Note # with Source Reference below */}
                      <UITableCell>
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono font-bold text-text truncate hover:text-primary transition-colors">
                            {cnItem.creditNoteNo}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10.5px] mt-0.5 truncate">
                            {cnItem.sourceReturnNo ? (
                              <span
                                className="font-mono text-primary font-medium truncate"
                                title={`Sales Return: ${cnItem.sourceReturnNo}`}
                              >
                                Ret: {cnItem.sourceReturnNo}
                              </span>
                            ) : cnItem.originalInvoiceNo ? (
                              <span
                                className="font-mono text-text-muted truncate"
                                title={`Original Invoice: ${cnItem.originalInvoiceNo}`}
                              >
                                Inv: {cnItem.originalInvoiceNo}
                              </span>
                            ) : (
                              <span className="text-text-muted/70">Manual Issue</span>
                            )}
                            {cnItem.billingMode && (
                              <>
                                <span className="text-text-muted/40">•</span>
                                <span className="text-[10px] text-text-muted shrink-0">
                                  {cnItem.billingMode}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </UITableCell>

                      {/* 2. Issue Date */}
                      <UITableCell className="whitespace-nowrap text-xs text-text-muted">
                        <div className="flex flex-col">
                          <span className="font-medium text-text">{formatDate(issueTimestamp)}</span>
                          <span className="text-[10.5px] font-mono text-text-muted/70">
                            {formatTime(issueTimestamp)}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 3. Customer */}
                      <UITableCell>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text truncate hover:text-primary transition-colors">
                            {custName}
                          </span>
                          {custPhone && custPhone !== "—" && (
                            <span className="text-[10.5px] font-mono text-text-muted mt-0.5">
                              {custPhone}
                            </span>
                          )}
                        </div>
                      </UITableCell>

                      {/* 4. Total Amount */}
                      <UITableCell align="right" className="whitespace-nowrap font-mono tabular-nums font-bold text-text text-xs">
                        ₹{formatCurrency(cnItem.totalAmount)}
                      </UITableCell>

                      {/* 5. Redeemed Amount */}
                      <UITableCell align="right" className="whitespace-nowrap font-mono tabular-nums font-semibold text-blue-600 dark:text-blue-400 text-xs">
                        ₹{formatCurrency(cnItem.redeemedAmount)}
                      </UITableCell>

                      {/* 6. Balance Available */}
                      <UITableCell align="right" className="whitespace-nowrap">
                        <span className="font-mono font-bold text-sm tabular-nums text-emerald-600 dark:text-emerald-400">
                          ₹{formatCurrency(cnItem.balanceAmount)}
                        </span>
                      </UITableCell>

                      {/* 7. Status */}
                      <UITableCell align="center" className="whitespace-nowrap">
                        {renderStatusBadge(cnItem.status)}
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Reusable UIInfiniteScroll Component */}
          {!isLoading && creditNotes.length > 0 && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                !hasMore && creditNotes.length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none py-2 block text-center">
                    ✓ All {totalCount} credit notes loaded
                  </span>
                ) : null
              }
            />
          )}
        </div>
      </div>

      {/* ── 4. Filter Dialog (Modal) ──────────────────────────────────────────────── */}
      <UIModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        size="md"
      >
        <UIModalHeader>
          <UIModalTitle>Filter Credit Notes</UIModalTitle>
          <UIModalDescription>
            Refine credit notes by status, date period, billing mode, and sorting sequence.
          </UIModalDescription>
        </UIModalHeader>
        <UIModalBody>
          <div className="space-y-4 py-2">
            {/* 1. Status Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text flex items-center justify-between">
                <span>Credit Note Status</span>
                {statusFilter !== "all" && (
                  <span className="text-[11px] text-primary font-bold">Active Filter</span>
                )}
              </label>
              <UISelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={STATUS_SELECT_OPTIONS}
                placeholder="All Statuses"
                size="md"
              />
            </div>

            {/* 2. Date Range */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text flex items-center justify-between">
                <span>Date Period</span>
                {dateRange !== "all" && (
                  <span className="text-[11px] text-primary font-bold">Active Filter</span>
                )}
              </label>
              <UISelect
                value={dateRange}
                onChange={(val) => setDateRange(val)}
                options={DATE_RANGE_OPTIONS}
                placeholder="All Time"
                size="md"
              />

              {dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-2 pt-1.5">
                  <div>
                    <label className="text-[11px] text-text-muted block mb-1">Start Date</label>
                    <UIDatePicker
                      value={customStartDate}
                      onChange={(date) => setCustomStartDate(date)}
                      placeholder="Start date"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-text-muted block mb-1">End Date</label>
                    <UIDatePicker
                      value={customEndDate}
                      onChange={(date) => setCustomEndDate(date)}
                      placeholder="End date"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. Billing Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text flex items-center justify-between">
                <span>Billing Mode</span>
                {billingModeFilter !== "all" && (
                  <span className="text-[11px] text-primary font-bold">Active Filter</span>
                )}
              </label>
              <UISelect
                value={billingModeFilter}
                onChange={(val) => setBillingModeFilter(val)}
                options={BILLING_MODE_OPTIONS}
                placeholder="All Modes"
                size="md"
              />
            </div>

            {/* 4. Sort Sequence */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text flex items-center justify-between">
                <span>Sort Sequence</span>
                {sortOption !== "issueDate-desc" && (
                  <span className="text-[11px] text-primary font-bold">Custom Sort</span>
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
              setStatusFilter("all");
              setDateRange("all");
              setCustomStartDate(null);
              setCustomEndDate(null);
              setBillingModeFilter("all");
              setSortOption("issueDate-desc");
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

      {/* ── 5. Credit Note View Dialog (No Page Redirection) ───────────────────── */}
      <CreditNoteDetailsDialog
        isOpen={isViewDialogOpen}
        onClose={handleCloseViewDialog}
        creditNote={selectedCreditNote}
        creditNoteId={selectedCreditNote?._id}
        onCancelSuccess={handleCancelSuccess}
      />
    </div>
  );
};

export default CreditNotesDesktopPage;
