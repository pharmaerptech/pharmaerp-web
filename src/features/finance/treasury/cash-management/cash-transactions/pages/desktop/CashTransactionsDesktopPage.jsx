// src/features/finance/treasury/cash-management/cash-transactions/pages/desktop/CashTransactionsDesktopPage.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  RefreshCw,
  Banknote,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  Copy,
  Check,
  Receipt,
  CreditCard,
  ExternalLink,
  Sparkles,
  TrendingUp,
  TrendingDown,
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
} from "@/components/ui";
import { cn } from "@/lib/utils";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import useBranch from "@/features/branch/hooks/useBranch";
import { useBranchFilter } from "@/hooks";
import { BranchFilterSelect, BranchBadge } from "@/components/shared";
import useCashTransaction from "../../hooks/useCashTransaction";
import {
  CashTransactionDetailsDialog,
  CashTransactionsFilterModal,
} from "../../components";
import { BillingInvoiceDetailsDrawer } from "@/features/billing/components/BillingInvoiceDetailsDrawer";

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (val) => {
  if (!val) return "Today";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "Today";
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

const DATE_RANGE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last7days" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Month", value: "thisMonth" },
  { label: "Custom Range", value: "custom" },
];

const PARTITION_OPTIONS = [
  { label: "All Partitions", value: "all" },
  { label: "Running Cash", value: "running" },
  { label: "Frozen Cash", value: "frozen" },
];

const DIRECTION_OPTIONS = [
  { label: "All Directions", value: "all" },
  { label: "Inward (Credit)", value: "CREDIT" },
  { label: "Outward (Debit)", value: "DEBIT" },
];

const PAGE_LIMIT = 10;

export const CashTransactionsDesktopPage = () => {
  const { currentWorkspace } = useWorkspace();
  const { currentBranch } = useBranch();
  const {
    isCompanyLevel,
    selectedBranchId,
    setSelectedBranchId,
    queryBranchId,
  } = useBranchFilter();
  const activeBranchId = isCompanyLevel ? queryBranchId : (currentBranch?._id || undefined);

  const { getCashTransactions } = useCashTransaction();

  const tableContainerRef = useRef(null);

  // ── Transactions & Infinite Scroll state ──
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // ── Summary Statistics ──
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalCredits: 0,
    totalDebits: 0,
    netFlow: 0,
    inwardCount: 0,
    outwardCount: 0,
    draftCount: 0,
    postedCount: 0,
  });

  // ── Filter States ──
  const [selectedPartition, setSelectedPartition] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedDirection, setSelectedDirection] = useState("all");
  const [selectedTransactionType, setSelectedTransactionType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortOption, setSortOption] = useState("date-desc");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // ── Inspection dialogs & drawer state ──
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedInvoiceForDrawer, setSelectedInvoiceForDrawer] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Construct start and end dates from selected date range
  const buildDateParams = useCallback(() => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    if (selectedDateRange === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      startDate = start.toISOString();
      endDate = end.toISOString();
    } else if (selectedDateRange === "yesterday") {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const start = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 0, 0, 0, 0);
      const end = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59, 999);
      startDate = start.toISOString();
      endDate = end.toISOString();
    } else if (selectedDateRange === "last7days") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      startDate = start.toISOString();
      endDate = now.toISOString();
    } else if (selectedDateRange === "thisWeek") {
      const start = new Date(now);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      startDate = start.toISOString();
      endDate = now.toISOString();
    } else if (selectedDateRange === "thisMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      startDate = start.toISOString();
      endDate = now.toISOString();
    } else if (selectedDateRange === "custom") {
      if (customStartDate) {
        const s = new Date(customStartDate);
        s.setHours(0, 0, 0, 0);
        startDate = s.toISOString();
      }
      if (customEndDate) {
        const e = new Date(customEndDate);
        e.setHours(23, 59, 59, 999);
        endDate = e.toISOString();
      }
    }

    return {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
  }, [selectedDateRange, customStartDate, customEndDate]);

  // Fetch initial batch of cash transactions & stats
  const fetchTransactions = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      const dateParams = buildDateParams();
      const [sBy, sOrder] = sortOption.split("-");
      const params = {
        page: 1,
        limit: PAGE_LIMIT,
        branchId: activeBranchId,
        partition: selectedPartition !== "all" ? selectedPartition : undefined,
        direction: selectedDirection !== "all" ? selectedDirection : undefined,
        transactionType: selectedTransactionType !== "all" ? selectedTransactionType : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        search: debouncedSearch || undefined,
        sortBy: sBy,
        sortOrder: sOrder,
        ...dateParams,
      };

      const res = await getCashTransactions(params);
      const resData = res?.data || res || {};
      const list = Array.isArray(resData.cashTransactions)
        ? resData.cashTransactions
        : Array.isArray(resData.data)
        ? resData.data
        : [];

      const total = resData.total ?? list.length;
      const rawSummary = resData.summary;

      const isCreditRow = (r) =>
        r.direction === "CREDIT" || r.transactionType === "CASH_IN";
      const isDebitRow = (r) =>
        r.direction === "DEBIT" ||
        r.transactionType === "CASH_OUT" ||
        r.transactionType === "EXPENSE" ||
        r.transactionType === "PETTY_CASH";

      const listCredits = list.filter(isCreditRow).reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
      const listDebits = list.filter(isDebitRow).reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
      const listInwardCount = list.filter(isCreditRow).length;
      const listOutwardCount = list.filter(isDebitRow).length;

      // Resilient fallback: If backend summary returned 0s but list has rows, use list calculations
      const summaryHasValues =
        rawSummary && (rawSummary.totalCredits > 0 || rawSummary.totalDebits > 0 || list.length === 0);

      const finalCredits = summaryHasValues ? (rawSummary.totalCredits ?? 0) : listCredits;
      const finalDebits = summaryHasValues ? (rawSummary.totalDebits ?? 0) : listDebits;
      const finalInward = summaryHasValues ? (rawSummary.inwardCount ?? 0) : listInwardCount;
      const finalOutward = summaryHasValues ? (rawSummary.outwardCount ?? 0) : listOutwardCount;
      const finalTotal = summaryHasValues ? (rawSummary.totalTransactions ?? total) : total;

      setStats({
        totalTransactions: finalTotal,
        totalCredits: finalCredits,
        totalDebits: finalDebits,
        netFlow: finalCredits - finalDebits,
        inwardCount: finalInward,
        outwardCount: finalOutward,
        draftCount: rawSummary?.draftCount ?? list.filter((r) => r.status === "DRAFT").length,
        postedCount: rawSummary?.postedCount ?? list.filter((r) => r.status === "POSTED").length,
      });

      setTransactions(list);
      setTotalCount(total);
      setCurrentPage(1);
      setHasMore(list.length < total);

      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.warn("Failed to fetch cash transactions:", err);
      setTransactions([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentWorkspace,
    activeBranchId,
    selectedPartition,
    selectedDirection,
    selectedTransactionType,
    selectedStatus,
    debouncedSearch,
    sortOption,
    buildDateParams,
    getCashTransactions,
  ]);

  // Load next batch via Infinite Scroll
  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore || !currentWorkspace) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const dateParams = buildDateParams();
      const [sBy, sOrder] = sortOption.split("-");
      const params = {
        page: nextPage,
        limit: PAGE_LIMIT,
        branchId: activeBranchId,
        partition: selectedPartition !== "all" ? selectedPartition : undefined,
        direction: selectedDirection !== "all" ? selectedDirection : undefined,
        transactionType: selectedTransactionType !== "all" ? selectedTransactionType : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        search: debouncedSearch || undefined,
        sortBy: sBy,
        sortOrder: sOrder,
        ...dateParams,
      };

      const res = await getCashTransactions(params);
      const resData = res?.data || res || {};
      const list = Array.isArray(resData.cashTransactions)
        ? resData.cashTransactions
        : Array.isArray(resData.data)
        ? resData.data
        : [];

      const total = resData.total ?? totalCount;

      if (list.length > 0) {
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((i) => i._id || i.id));
          const newRows = list.filter((i) => !existingIds.has(i._id || i.id));
          const combined = [...prev, ...newRows];
          setHasMore(combined.length < total);
          return combined;
        });
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn("Failed to load more cash transactions:", err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoading,
    isLoadingMore,
    hasMore,
    currentWorkspace,
    currentPage,
    totalCount,
    activeBranchId,
    selectedPartition,
    selectedDirection,
    selectedTransactionType,
    selectedStatus,
    debouncedSearch,
    sortOption,
    buildDateParams,
    getCashTransactions,
  ]);

  // Re-fetch on filter changes
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedPartition("all");
    setSelectedDirection("all");
    setSelectedTransactionType("all");
    setSelectedStatus("all");
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedDateRange("today");
    setCustomStartDate("");
    setCustomEndDate("");
    setSortOption("date-desc");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedPartition !== "all") count++;
    if (selectedDirection !== "all") count++;
    if (selectedTransactionType !== "all") count++;
    if (selectedStatus !== "all") count++;
    if (selectedDateRange !== "today") count++;
    if (debouncedSearch) count++;
    return count;
  }, [
    selectedPartition,
    selectedDirection,
    selectedTransactionType,
    selectedStatus,
    selectedDateRange,
    debouncedSearch,
  ]);

  // Header Sort Handler
  const handleHeaderSort = (field) => {
    const [currentField, currentOrder] = sortOption.split("-");
    let nextOrder = "desc";
    if (currentField === field) {
      nextOrder = currentOrder === "desc" ? "asc" : "desc";
    }
    setSortOption(`${field}-${nextOrder}`);
  };

  const [sortBy, sortOrder] = useMemo(() => {
    const parts = sortOption.split("-");
    return [parts[0] || "date", parts[1] || "desc"];
  }, [sortOption]);

  // Drill down to full invoice drawer
  const handleOpenInvoiceDrawer = (txn) => {
    setSelectedTransaction(null);
    const inv = txn.invoice || {};
    setSelectedInvoiceForDrawer({
      id: inv._id || inv.id || txn.rawId || txn._id || txn.id,
      invoiceNo: inv.invoiceNo || txn.referenceNumber,
      amount: txn.amount,
      grandTotal: inv.grandTotal || txn.amount,
      date: inv.date || txn.transactionDate,
      customer: inv.customerId?.name || txn.counterpartyAccountId?.accountName,
      phone: inv.customerId?.mobile || inv.customerId?.phone,
      items: inv.items || [],
      payments: inv.payments || [],
      status: inv.status,
    });
  };

  const renderDirectionBadge = (direction) => {
    const isCredit = String(direction).toUpperCase() === "CREDIT";
    if (isCredit) {
      return (
        <UIBadge
          variant="soft"
          color="success"
          icon={<ArrowDownLeft className="size-3 shrink-0" />}
          className="inline-flex items-center whitespace-nowrap font-semibold text-xs"
        >
          Inward (Credit)
        </UIBadge>
      );
    }
    return (
      <UIBadge
        variant="soft"
        color="danger"
        icon={<ArrowUpRight className="size-3 shrink-0" />}
        className="inline-flex items-center whitespace-nowrap font-semibold text-xs"
      >
        Outward (Debit)
      </UIBadge>
    );
  };

  const renderSourceBadge = (txn) => {
    const narration = String(txn.narration || "");
    const ref = String(txn.referenceNumber || "");
    const isInv = txn.invoice || /Invoice/i.test(narration) || /^(INV|BILL|CTB|P[0-9]|SALE)/i.test(ref);
    const isCreditSettlement = /Credit settlement/i.test(narration) || /settlement/i.test(narration);
    const isAdvance = /Customer advance/i.test(narration) || /advance/i.test(narration);

    if (isInv) {
      return (
        <UIBadge
          variant="soft"
          color="primary"
          icon={<Receipt className="size-3 shrink-0" />}
          className="inline-flex items-center whitespace-nowrap font-semibold text-xs"
        >
          Sale Invoice
        </UIBadge>
      );
    }
    if (isCreditSettlement) {
      return (
        <UIBadge
          variant="soft"
          color="warning"
          icon={<CreditCard className="size-3 shrink-0" />}
          className="inline-flex items-center whitespace-nowrap font-semibold text-xs"
        >
          Credit Settlement
        </UIBadge>
      );
    }
    if (isAdvance) {
      return (
        <UIBadge
          variant="soft"
          color="success"
          icon={<Banknote className="size-3 shrink-0" />}
          className="inline-flex items-center whitespace-nowrap font-semibold text-xs"
        >
          Customer Advance
        </UIBadge>
      );
    }
    return (
      <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold bg-surface-alt border border-border/70 text-text">
        {txn.transactionType || "CASH"}
      </span>
    );
  };

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* Toast Notification */}
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

      {/* ── 1. Compact 4-Card Statistics Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Cash Register Tally */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Banknote className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400 truncate flex items-center gap-1">
              <Sparkles className="size-3" />
              Cash Register Tally
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalTransactions} Txns
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {stats.inwardCount} Inward · {stats.outwardCount} Outward · {stats.draftCount} Drafts
            </div>
          </div>
        </div>

        {/* Card 2: Total Inward Cash (Credits) */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <TrendingUp className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              Cash Inward (Credits)
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              ₹{formatCurrency(stats.totalCredits)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Total credited to drawers
            </div>
          </div>
        </div>

        {/* Card 3: Total Outward Cash (Debits) */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <TrendingDown className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-rose-600 dark:text-rose-400 truncate">
              Cash Outward (Debits)
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums text-rose-600 dark:text-rose-400">
              ₹{formatCurrency(stats.totalDebits)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Expenses & disbursements
            </div>
          </div>
        </div>

        {/* Card 4: Net Drawer Cash Flow */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Wallet className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-primary truncate">
              Net Drawer Impact
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.netFlow >= 0 ? "+" : "-"} ₹{formatCurrency(Math.abs(stats.netFlow))}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Net physical flow
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Table Filter Toolbar (Using Reusable UI Components) ───────────────── */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-3.5 shrink-0">
        {/* Branch Filter (Company Level Only) */}
        {isCompanyLevel && (
          <div className="w-[190px] sm:w-[210px] shrink-0">
            <BranchFilterSelect
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              size="md"
              className="w-full"
            />
          </div>
        )}

        {/* Cash Partition Selector */}
        <div className="w-[160px] sm:w-[180px] shrink-0">
          <UISelect
            value={selectedPartition}
            onChange={(val) => setSelectedPartition(val)}
            options={PARTITION_OPTIONS}
            placeholder="Select Partition"
            size="md"
          />
        </div>

        {/* Search Input */}
        <div className="w-[240px] sm:w-[280px] lg:w-[320px] shrink-0">
          <UIInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transaction #, narration, or voucher..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => setSearchQuery("")}
            className="w-full"
          />
        </div>

        {/* Date Range Selector Dropdown */}
        <div className="w-[140px] sm:w-[160px]">
          <UISelect
            value={selectedDateRange}
            onChange={(val) => setSelectedDateRange(val)}
            options={DATE_RANGE_OPTIONS}
            placeholder="Date Range"
            size="md"
          />
        </div>

        {/* Custom Date Pickers (Shown if Custom Range selected) */}
        {selectedDateRange === "custom" && (
          <div className="flex items-center gap-2 animate-in fade-in-50 duration-200">
            <div className="w-[140px]">
              <UIDatePicker
                value={customStartDate}
                onChange={(val) => setCustomStartDate(val || "")}
                placeholder="From date"
                size="md"
                isClearable
              />
            </div>
            <span className="text-xs text-text-muted">to</span>
            <div className="w-[140px]">
              <UIDatePicker
                value={customEndDate}
                onChange={(val) => setCustomEndDate(val || "")}
                placeholder="To date"
                size="md"
                isClearable
              />
            </div>
          </div>
        )}

        {/* Direction Selector */}
        <div className="w-[150px]">
          <UISelect
            value={selectedDirection}
            onChange={(val) => setSelectedDirection(val)}
            options={DIRECTION_OPTIONS}
            placeholder="All Directions"
            size="md"
          />
        </div>

        {/* Advanced Filters Button */}
        <UIButton
          type="button"
          variant={activeFiltersCount > 0 ? "primary" : "secondary"}
          size="md"
          onClick={() => setIsFilterModalOpen(true)}
          startIcon={<SlidersHorizontal className="size-4" />}
          className={cn(
            "h-10 px-3.5 shrink-0 transition-all",
            activeFiltersCount > 0 && "font-bold shadow-xs"
          )}
          title="Open Advanced Filters"
        >
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="size-5 rounded-full bg-white/25 text-white font-mono text-[10.5px] font-bold flex items-center justify-center shrink-0 ml-1">
              {activeFiltersCount}
            </span>
          )}
        </UIButton>

        {/* Refresh Button */}
        <UIButton
          type="button"
          variant="secondary"
          size="md"
          disabled={isLoading}
          onClick={fetchTransactions}
          startIcon={
            <RefreshCw
              className={cn("size-4 text-primary", isLoading && "animate-spin")}
            />
          }
          className="h-10 px-3.5 shrink-0"
          title="Refresh Cash Transactions"
        >
          Refresh
        </UIButton>

        {/* Reset Filters Button */}
        <UIButton
          type="button"
          variant="ghost"
          size="md"
          onClick={handleResetFilters}
          startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
          className="h-10 px-3 text-text-muted hover:text-text shrink-0"
          title="Reset All Filters"
        >
          Reset
        </UIButton>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ────── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col">
        <div
          ref={tableContainerRef}
          className="relative overflow-y-auto overflow-x-auto flex-1 min-h-0"
        >
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full"
          >
            <UITableHeader sticky className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs">
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
                <UITableHead
                  sticky
                  sortable
                  sortDirection={sortBy === "number" || sortBy === "transactionnumber" ? sortOrder : null}
                  onSort={() => handleHeaderSort("number")}
                  className="min-w-[170px]"
                >
                  Transaction / Bill #
                </UITableHead>
                {isCompanyLevel && (
                  <UITableHead sticky className="min-w-[140px]">Branch</UITableHead>
                )}
                <UITableHead sticky className="min-w-[150px]">Source / Type</UITableHead>
                <UITableHead
                  sticky
                  sortable
                  sortDirection={sortBy === "date" ? sortOrder : null}
                  onSort={() => handleHeaderSort("date")}
                  className="min-w-[140px]"
                >
                  Date & Time
                </UITableHead>
                <UITableHead sticky className="min-w-[120px]">Partition</UITableHead>
                <UITableHead sticky className="min-w-[200px]">Party / Offset Account</UITableHead>
                <UITableHead sticky className="min-w-[130px]">Direction</UITableHead>
                <UITableHead
                  sticky
                  sortable
                  align="right"
                  sortDirection={sortBy === "amount" ? sortOrder : null}
                  onSort={() => handleHeaderSort("amount")}
                  className="min-w-[130px]"
                >
                  Amount
                </UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={isCompanyLevel ? 8 : 7} rows={7} />
              ) : transactions.length === 0 ? (
                <UITableEmpty
                  colSpan={isCompanyLevel ? 8 : 7}
                  title="No Cash Transactions Found"
                  description={
                    debouncedSearch || selectedPartition !== "all" || selectedDirection !== "all" || selectedDateRange !== "today"
                      ? "Try clearing filters or adjusting your date range to find cash transactions."
                      : "No cash movements recorded yet in the system."
                  }
                  action={
                    activeFiltersCount > 0 ? (
                      <UIButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleResetFilters}
                      >
                        Reset All Filters
                      </UIButton>
                    ) : null
                  }
                />
              ) : (
                transactions.map((txn) => {
                  const txnId = txn._id || txn.id;
                  const isCredit =
                    String(txn.direction).toUpperCase() === "CREDIT" ||
                    String(txn.transactionType).toUpperCase() === "CASH_IN";

                  const ref = String(txn.referenceNumber || "");
                  const narration = String(txn.narration || "");
                  const hasInvoice = Boolean(
                    txn.invoice ||
                    /Invoice/i.test(narration) ||
                    /^(INV|BILL|CTB|P[0-9]|SALE)/i.test(ref)
                  );
                  const invoiceNo = txn.invoice?.invoiceNo || txn.referenceNumber;

                  const partyName =
                    txn.invoice?.customerId?.name ||
                    txn.counterpartyAccountId?.accountName ||
                    (narration.includes("from ") ? narration.split("from ").pop().trim() : "Store Drawer / Counter");

                  const partyCode =
                    txn.invoice?.customerId?.code
                      ? `Code: ${txn.invoice.customerId.code}`
                      : txn.invoice?.customerId?.mobile
                      ? `Mob: ${txn.invoice.customerId.mobile}`
                      : txn.counterpartyAccountId?.accountCode
                      ? `Code: ${txn.counterpartyAccountId.accountCode}`
                      : null;

                  return (
                    <UITableRow
                      key={txnId}
                      onClick={() => setSelectedTransaction(txn)}
                      className="cursor-pointer hover:bg-surface-hover/80 transition-colors group text-xs border-b border-border/50 last:border-b-0"
                    >
                      {/* Transaction # & Sale Bill Link */}
                      <UITableCell className="font-semibold text-text font-mono">
                        <div className="flex flex-col">
                          <span className="group-hover:text-primary transition-colors font-bold">
                            {txn.transactionNumber}
                          </span>
                          {hasInvoice && invoiceNo ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenInvoiceDrawer(txn);
                              }}
                              className="inline-flex items-center gap-1 text-[10.5px] text-primary font-mono font-bold hover:underline mt-0.5 text-left cursor-pointer w-fit"
                              title="Click to view full sale invoice bill"
                            >
                              <Receipt className="size-3 shrink-0" />
                              <span>{invoiceNo}</span>
                              <ExternalLink className="size-2.5 opacity-70" />
                            </button>
                          ) : txn.referenceNumber ? (
                            <span className="text-[10px] text-text-muted font-mono truncate max-w-[150px]">
                              Ref: {txn.referenceNumber}
                            </span>
                          ) : txn.narration ? (
                            <span className="text-[10px] text-text-muted truncate max-w-[160px]" title={txn.narration}>
                              {txn.narration}
                            </span>
                          ) : null}
                        </div>
                      </UITableCell>

                      {/* Branch (Company Level) */}
                      {isCompanyLevel && (
                        <UITableCell>
                          <BranchBadge branch={txn.branchId} />
                        </UITableCell>
                      )}

                      {/* Source / Type */}
                      <UITableCell className="whitespace-nowrap">
                        {renderSourceBadge(txn)}
                      </UITableCell>

                      {/* Date & Time */}
                      <UITableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-text">{formatDate(txn.transactionDate)}</span>
                          <span className="text-[10.5px] text-text-muted">{formatTime(txn.transactionDate)}</span>
                        </div>
                      </UITableCell>

                      {/* Partition */}
                      <UITableCell>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10.5px] font-medium border",
                            txn.cashPartition === "running"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          )}
                        >
                          {txn.cashPartition === "running" ? "Running" : "Frozen"}
                        </span>
                      </UITableCell>

                      {/* Party / Offset Account */}
                      <UITableCell>
                        <div className="flex flex-col max-w-[210px]">
                          <span className="font-semibold text-text truncate">
                            {partyName}
                          </span>
                          {partyCode && (
                            <span className="text-[10px] text-text-muted font-mono">
                              {partyCode}
                            </span>
                          )}
                        </div>
                      </UITableCell>

                      {/* Direction */}
                      <UITableCell className="whitespace-nowrap">
                        {renderDirectionBadge(txn.direction)}
                      </UITableCell>

                      {/* Amount */}
                      <UITableCell align="right">
                        <span
                          className={cn(
                            "font-mono font-bold tabular-nums text-sm",
                            isCredit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          )}
                        >
                          {isCredit ? "+" : "-"} ₹{formatCurrency(txn.amount)}
                        </span>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Reusable UIInfiniteScroll Component */}
          {!isLoading && transactions.length > 0 && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                !hasMore && transactions.length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none">
                    ✓ All {totalCount} matching cash transactions loaded
                  </span>
                ) : null
              }
            />
          )}
        </div>
      </div>

      {/* ── 4. In-Place Cash Transaction Details Dialog ── */}
      {selectedTransaction && (
        <CashTransactionDetailsDialog
          isOpen={Boolean(selectedTransaction)}
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
          onOpenInvoiceDrawer={handleOpenInvoiceDrawer}
        />
      )}

      {/* ── 5. Advanced Filters Modal ── */}
      <CashTransactionsFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        initialFilters={{
          transactionType: selectedTransactionType,
          status: selectedStatus,
          sortBy: sortOption,
        }}
        onApply={(newFilters) => {
          setSelectedTransactionType(newFilters.transactionType || "all");
          setSelectedStatus(newFilters.status || "all");
          setSortOption(newFilters.sortBy || "date-desc");
        }}
        onReset={() => {
          setSelectedTransactionType("all");
          setSelectedStatus("all");
          setSortOption("date-desc");
        }}
      />

      {/* ── 6. Full Invoice Drawer (if user drills down from an invoice cash transaction) ── */}
      <BillingInvoiceDetailsDrawer
        invoice={selectedInvoiceForDrawer}
        isOpen={Boolean(selectedInvoiceForDrawer)}
        onClose={() => setSelectedInvoiceForDrawer(null)}
      />
    </div>
  );
};

export default CashTransactionsDesktopPage;
