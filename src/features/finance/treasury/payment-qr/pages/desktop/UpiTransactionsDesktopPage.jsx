// src/features/finance/treasury/payment-qr/pages/desktop/UpiTransactionsDesktopPage.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  RefreshCw,
  Receipt,
  Banknote,
  QrCode,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  Layers,
  Sparkles,
  Phone,
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
import usePaymentQr from "../../hooks/usePaymentQr";
import {
  UpiTransactionDetailsDialog,
  UpiTransactionsFilterModal,
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

const SOURCE_TYPE_OPTIONS = [
  { label: "All Sources", value: "all" },
  { label: "Sales Invoices", value: "invoice" },
  { label: "Credit Settlements", value: "credit_settlement" },
  { label: "Advance Receipts", value: "advance" },
];

const PAGE_LIMIT = 10;

export const UpiTransactionsDesktopPage = () => {
  const { currentWorkspace } = useWorkspace();
  const { currentBranch } = useBranch();
  const {
    isCompanyLevel,
    selectedBranchId,
    setSelectedBranchId,
    queryBranchId,
  } = useBranchFilter();
  const activeBranchId = isCompanyLevel ? queryBranchId : (currentBranch?._id || undefined);

  const { paymentQrs, getPaymentQrs, getUpiTransactions } = usePaymentQr();

  const tableContainerRef = useRef(null);

  // ── Transactions & Infinite Scroll state ──
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // ── Global UPI Tally Summary Statistics ──
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    invoiceCount: 0,
    invoiceAmount: 0,
    creditSettlementCount: 0,
    creditSettlementAmount: 0,
    advanceCount: 0,
    advanceAmount: 0,
    matchingSplitCount: 0,
  });

  // ── Filter States ──
  const [selectedPaymentQr, setSelectedPaymentQr] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedSourceType, setSelectedSourceType] = useState("all");
  const [splitFilter, setSplitFilter] = useState("all");
  const [sortOption, setSortOption] = useState("date-desc");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // ── Modal / Inspector state ──
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedInvoiceForDrawer, setSelectedInvoiceForDrawer] = useState(null);
  const [copiedUpiId, setCopiedUpiId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load branch UPI QR codes for selector dropdown
  useEffect(() => {
    if (currentWorkspace) {
      getPaymentQrs({
        branchId: activeBranchId,
        status: "ACTIVE",
      });
    }
  }, [currentWorkspace, activeBranchId, getPaymentQrs]);

  // Branch UPI options for select dropdown
  const upiQrOptions = useMemo(() => {
    const list = (paymentQrs || []).filter((q) => {
      if (q.status && q.status !== "ACTIVE") return false;
      if (!activeBranchId) return true;
      const qBranchId = q.branchId?._id || q.branchId;
      return !qBranchId || String(qBranchId) === String(activeBranchId);
    });

    return [
      { label: "All Branch UPIs", value: "all" },
      ...list.map((qr) => {
        const bankName =
          qr.bankAccountId?.bankMasterId?.name ||
          qr.bankAccountId?.bankName ||
          qr.bankAccountId?.accountName ||
          "";
        const labelText = qr.label
          ? `${qr.label}${bankName ? ` (${bankName})` : ""}`
          : bankName
          ? `${bankName} (${qr.upiId})`
          : qr.upiId;
        return {
          label: labelText,
          value: String(qr._id),
        };
      }),
    ];
  }, [paymentQrs, activeBranchId]);

  // Active filter count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedPaymentQr !== "all") count++;
    if (selectedSourceType !== "all") count++;
    if (splitFilter !== "all") count++;
    if (sortOption !== "date-desc") count++;
    return count;
  }, [selectedPaymentQr, selectedSourceType, splitFilter, sortOption]);

  // Helper to build calendar date boundaries
  const buildDateParams = useCallback(() => {
    const params = {};
    const now = new Date();

    if (selectedDateRange === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      params.startDate = start.toISOString();
      params.endDate = end.toISOString();
    } else if (selectedDateRange === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const start = new Date(yesterday);
      start.setHours(0, 0, 0, 0);
      const end = new Date(yesterday);
      end.setHours(23, 59, 59, 999);
      params.startDate = start.toISOString();
      params.endDate = end.toISOString();
    } else if (selectedDateRange === "last7days") {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      params.startDate = sevenDaysAgo.toISOString();
      params.endDate = end.toISOString();
    } else if (selectedDateRange === "thisWeek") {
      const dayOfWeek = now.getDay();
      const firstDayOfWeek = new Date(now);
      firstDayOfWeek.setDate(now.getDate() - dayOfWeek);
      firstDayOfWeek.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      params.startDate = firstDayOfWeek.toISOString();
      params.endDate = end.toISOString();
    } else if (selectedDateRange === "thisMonth") {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      params.startDate = firstDayOfMonth.toISOString();
      params.endDate = lastDayOfMonth.toISOString();
    } else if (selectedDateRange === "custom") {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        params.startDate = start.toISOString();
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        params.endDate = end.toISOString();
      }
    }

    return params;
  }, [selectedDateRange, customStartDate, customEndDate]);

  // Fetch Page 1 (initial load or filter change)
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
        paymentQrId: selectedPaymentQr !== "all" ? selectedPaymentQr : undefined,
        sourceType: selectedSourceType !== "all" ? selectedSourceType : undefined,
        search: debouncedSearch || undefined,
        sortBy: sBy,
        sortOrder: sOrder,
        ...dateParams,
      };

      const res = await getUpiTransactions(params);
      const resData = res.data?.data || res.data || {};
      let list = Array.isArray(resData.data) ? resData.data : [];

      // Client-side Split filter if chosen
      if (splitFilter === "pure") {
        list = list.filter((r) => !r.isSplit);
      } else if (splitFilter === "split") {
        list = list.filter((r) => r.isSplit);
      }

      const total = resData.meta?.total ?? list.length;

      if (resData.summary) {
        setStats({
          totalTransactions: resData.summary.totalTransactions ?? total,
          totalAmount: resData.summary.totalAmount ?? 0,
          invoiceCount: resData.summary.invoiceCount ?? 0,
          invoiceAmount: resData.summary.invoiceAmount ?? 0,
          creditSettlementCount: resData.summary.creditSettlementCount ?? 0,
          creditSettlementAmount: resData.summary.creditSettlementAmount ?? 0,
          advanceCount: resData.summary.advanceCount ?? 0,
          advanceAmount: resData.summary.advanceAmount ?? 0,
          matchingSplitCount: resData.summary.matchingSplitCount ?? 0,
        });
      } else {
        const totalAmt = list.reduce((acc, r) => acc + Number(r.upiAmount || 0), 0);
        setStats({
          totalTransactions: total,
          totalAmount: totalAmt,
          invoiceCount: list.filter((r) => r.sourceType === "INVOICE").length,
          invoiceAmount: totalAmt,
          creditSettlementCount: 0,
          creditSettlementAmount: 0,
          advanceCount: 0,
          advanceAmount: 0,
          matchingSplitCount: 0,
        });
      }

      setTransactions(list);
      setTotalCount(total);
      setCurrentPage(1);
      setHasMore(list.length < total);

      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.warn("Failed to fetch UPI transactions:", err);
      setTransactions([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentWorkspace,
    activeBranchId,
    selectedPaymentQr,
    selectedSourceType,
    splitFilter,
    debouncedSearch,
    sortOption,
    buildDateParams,
    getUpiTransactions,
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
        paymentQrId: selectedPaymentQr !== "all" ? selectedPaymentQr : undefined,
        sourceType: selectedSourceType !== "all" ? selectedSourceType : undefined,
        search: debouncedSearch || undefined,
        sortBy: sBy,
        sortOrder: sOrder,
        ...dateParams,
      };

      const res = await getUpiTransactions(params);
      const resData = res.data?.data || res.data || {};
      let list = Array.isArray(resData.data) ? resData.data : [];

      if (splitFilter === "pure") {
        list = list.filter((r) => !r.isSplit);
      } else if (splitFilter === "split") {
        list = list.filter((r) => r.isSplit);
      }

      const total = resData.meta?.total ?? totalCount;

      if (list.length > 0) {
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const newRows = list.filter((i) => !existingIds.has(i.id));
          const combined = [...prev, ...newRows];
          setHasMore(combined.length < total);
          return combined;
        });
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn("Failed to load more UPI transactions:", err);
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
    activeBranchId,
    selectedPaymentQr,
    selectedSourceType,
    splitFilter,
    debouncedSearch,
    sortOption,
    buildDateParams,
    getUpiTransactions,
    totalCount,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleResetFilters = () => {
    setSelectedPaymentQr("all");
    setSearchQuery("");
    setSelectedDateRange("today");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedSourceType("all");
    setSplitFilter("all");
    setSortOption("date-desc");
  };

  const handleCopyUpiId = (upiId, e) => {
    e?.stopPropagation();
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedUpiId(upiId);
    setTimeout(() => setCopiedUpiId(null), 2000);
  };

  const handleOpenInvoiceDrawerFromModal = (txn) => {
    if (txn.sourceType !== "INVOICE") return;
    setSelectedTransaction(null);
    setSelectedInvoiceForDrawer({
      id: txn.rawId,
      invoiceNo: txn.referenceNo,
      amount: txn.totalAmount,
      grandTotal: txn.totalAmount,
      date: txn.date,
      customer: txn.customer?.name,
      phone: txn.customer?.mobile,
      items: txn.details?.items || [],
      payments: txn.details?.payments || [],
      status: txn.status,
    });
  };

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

  const renderSourceBadge = (sourceType) => {
    switch (sourceType) {
      case "INVOICE":
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
      case "CREDIT_SETTLEMENT":
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
      case "ADVANCE_RECEIPT":
        return (
          <UIBadge
            variant="soft"
            color="success"
            icon={<Banknote className="size-3 shrink-0" />}
            className="inline-flex items-center whitespace-nowrap font-semibold text-xs"
          >
            Advance Receipt
          </UIBadge>
        );
      default:
        return (
          <UIBadge
            variant="soft"
            color="neutral"
            className="inline-flex items-center whitespace-nowrap font-semibold text-xs"
          >
            {sourceType || "UPI"}
          </UIBadge>
        );
    }
  };

  const renderProviderBadge = (provider) => {
    const raw = String(provider || "").toUpperCase();
    let bg = "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20";
    if (raw === "GPAY") bg = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
    else if (raw === "PHONEPE") bg = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
    else if (raw === "PAYTM") bg = "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30";
    else if (raw === "BHIM") bg = "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30";
    else if (raw === "RAZORPAY") bg = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30";
    return (
      <span className={cn("px-1.5 py-0.2 rounded text-[9px] font-black uppercase border tracking-wider", bg)}>
        {raw || "UPI"}
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

      {/* ── 1. Compact 4-Card Statistics Grid (Matching Daily UPI Tally) ────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: UPI Transaction Count */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <QrCode className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-indigo-600 dark:text-indigo-400 truncate flex items-center gap-1">
              <Sparkles className="size-3" />
              UPI Register Tally
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalTransactions} Txns
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {stats.invoiceCount} Invoices · {stats.creditSettlementCount} Credit · {stats.advanceCount} Adv
            </div>
          </div>
        </div>

        {/* Card 2: Total UPI Amount Collected */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <Banknote className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              Total UPI Volume
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.totalAmount)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Total credited to bank
            </div>
          </div>
        </div>

        {/* Card 3: Billing Invoices UPI */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Receipt className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Billing Invoices
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.invoiceAmount)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {stats.invoiceCount} sales{stats.matchingSplitCount > 0 ? ` (${stats.matchingSplitCount} split)` : ""}
            </div>
          </div>
        </div>

        {/* Card 4: Settlements & Advances */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Layers className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400 truncate">
              Credit & Advance
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.creditSettlementAmount + stats.advanceAmount)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              ₹{formatCurrency(stats.creditSettlementAmount)} credit · ₹{formatCurrency(stats.advanceAmount)} adv
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

        {/* Branch UPI Selector Dropdown */}
        <div className="w-[200px] sm:w-[240px] shrink-0">
          <UISelect
            value={selectedPaymentQr}
            onChange={(val) => setSelectedPaymentQr(val)}
            options={upiQrOptions}
            placeholder="Select UPI Register"
            size="md"
          />
        </div>

        {/* Search Input */}
        <div className="w-[240px] sm:w-[280px] lg:w-[320px] shrink-0">
          <UIInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference #, customer, mobile or UPI ID..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => setSearchQuery("")}
            className="w-full"
          />
        </div>

        {/* Date Range Selector */}
        <div className="w-[155px] sm:w-[165px]">
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

        {/* Source Type Selector */}
        <div className="w-[150px]">
          <UISelect
            value={selectedSourceType}
            onChange={(val) => setSelectedSourceType(val)}
            options={SOURCE_TYPE_OPTIONS}
            placeholder="All Sources"
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
          title="Refresh UPI Transactions"
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
                  sortDirection={sortBy === "referenceno" ? sortOrder : null}
                  onSort={() => handleHeaderSort("referenceno")}
                  className="min-w-[160px]"
                >
                  Reference #
                </UITableHead>
                {isCompanyLevel && (
                  <UITableHead sticky className="min-w-[140px]">Branch</UITableHead>
                )}
                <UITableHead sticky className="min-w-[150px]">Source</UITableHead>
                <UITableHead
                  sticky
                  sortable
                  sortDirection={sortBy === "date" ? sortOrder : null}
                  onSort={() => handleHeaderSort("date")}
                  className="min-w-[150px]"
                >
                  Date & Time
                </UITableHead>
                <UITableHead sticky className="min-w-[200px]">UPI VPA & Bank</UITableHead>
                <UITableHead sticky className="min-w-[200px]">Customer / Patient</UITableHead>
                <UITableHead
                  sticky
                  sortable
                  align="right"
                  sortDirection={sortBy === "amount" ? sortOrder : null}
                  onSort={() => handleHeaderSort("amount")}
                  className="min-w-[150px]"
                >
                  UPI Amount
                </UITableHead>
                <UITableHead sticky className="min-w-[140px]">Shift / Terminal</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={isCompanyLevel ? 8 : 7} rows={7} />
              ) : transactions.length === 0 ? (
                <UITableEmpty
                  colSpan={isCompanyLevel ? 8 : 7}
                  title="No UPI Transactions Found"
                  description={
                    debouncedSearch || selectedPaymentQr !== "all" || selectedDateRange !== "today"
                      ? "No records matched your current filters. Try resetting filters or expanding the date range."
                      : "No UPI transactions have been recorded for this branch today."
                  }
                  action={
                    (debouncedSearch || selectedPaymentQr !== "all" || selectedDateRange !== "today") && (
                      <UIButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleResetFilters}
                        startIcon={<RotateCcw className="size-3.5" />}
                        className="mt-2 text-xs"
                      >
                        Reset All Filters
                      </UIButton>
                    )
                  }
                />
              ) : (
                transactions.map((txn) => {
                  const isCopied = copiedUpiId === txn.paymentQr?.upiId;

                  return (
                    <UITableRow
                      key={txn.id}
                      onClick={() => setSelectedTransaction(txn)}
                      className="cursor-pointer hover:bg-surface-hover/80 transition-colors group text-xs border-b border-border/50 last:border-b-0"
                    >
                      {/* Reference # */}
                      <UITableCell className="font-semibold text-text font-mono">
                        <div className="flex flex-col">
                          <span className="group-hover:text-primary transition-colors font-bold">
                            {txn.referenceNo}
                          </span>
                          {txn.narration && (
                            <span className="text-[10px] text-text-muted truncate max-w-[160px]">
                              {txn.narration}
                            </span>
                          )}
                        </div>
                      </UITableCell>

                      {/* Branch (Company Level) */}
                      {isCompanyLevel && (
                        <UITableCell>
                          <BranchBadge branch={txn.branchId} />
                        </UITableCell>
                      )}

                      {/* Source */}
                      <UITableCell className="whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 items-start">
                          {renderSourceBadge(txn.sourceType)}
                          {txn.isSplit && (
                            <span className="text-[9.5px] font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                              Split Bill Allocation
                            </span>
                          )}
                        </div>
                      </UITableCell>

                      {/* Date & Time */}
                      <UITableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-text">{formatDate(txn.date)}</span>
                          <span className="text-[10.5px] text-text-muted">{formatTime(txn.date)}</span>
                        </div>
                      </UITableCell>

                      {/* UPI VPA & Bank */}
                      <UITableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-text truncate max-w-[150px]">
                              {txn.paymentQr?.upiId || "—"}
                            </span>
                            {renderProviderBadge(txn.paymentQr?.provider)}
                            {txn.paymentQr?.upiId && (
                              <button
                                type="button"
                                onClick={(e) => handleCopyUpiId(txn.paymentQr.upiId, e)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-primary text-text-muted cursor-pointer"
                                title="Copy UPI Address"
                              >
                                {isCopied ? (
                                  <Check className="size-3 text-emerald-500" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            )}
                          </div>
                          <span className="text-[10.5px] text-text-muted truncate">
                            {txn.paymentQr?.bankAccount?.accountName || txn.paymentQr?.label || "Bank Account"}
                          </span>
                        </div>
                      </UITableCell>

                      {/* Customer / Patient */}
                      <UITableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-text truncate max-w-[180px]">
                            {txn.customer?.name || "Walk-in Retail Customer"}
                          </span>
                          {txn.customer?.mobile && (
                            <span className="text-[12px] font-bold text-text/80 font-mono tracking-tight">
                              {txn.customer.mobile}
                            </span>
                          )}
                        </div>
                      </UITableCell>

                      {/* UPI Amount */}
                      <UITableCell align="right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-bold text-text tabular-nums text-sm text-indigo-600 dark:text-indigo-400">
                            ₹{formatCurrency(txn.upiAmount)}
                          </span>
                          {txn.isSplit && (
                            <span className="text-[9.5px] text-text-muted font-mono">
                              Total: ₹{formatCurrency(txn.totalAmount)}
                            </span>
                          )}
                        </div>
                      </UITableCell>

                      {/* Shift / Terminal */}
                      <UITableCell>
                        <div className="flex flex-col text-text-muted">
                          <span className="font-medium text-text">
                            {txn.shift?.shiftName || (txn.shift?.shiftNo ? `Shift #${txn.shift.shiftNo}` : "—")}
                          </span>
                          {txn.details?.createdByName && (
                            <span className="text-[10.5px]">
                              {txn.details.createdByName}
                            </span>
                          )}
                        </div>
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
                    ✓ All {totalCount} matching UPI transactions loaded
                  </span>
                ) : null
              }
            />
          )}
        </div>
      </div>

      {/* ── 4. Transaction Inspection Dialog ── */}
      {selectedTransaction && (
        <UpiTransactionDetailsDialog
          isOpen={Boolean(selectedTransaction)}
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
          onOpenInvoiceDrawer={handleOpenInvoiceDrawerFromModal}
        />
      )}

      {/* ── 5. Advanced Filters Modal ── */}
      <UpiTransactionsFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        initialFilters={{
          sourceType: selectedSourceType,
          sortBy: sortOption,
          splitFilter,
        }}
        onApply={(newFilters) => {
          setSelectedSourceType(newFilters.sourceType || "all");
          setSortOption(newFilters.sortBy || "date-desc");
          setSplitFilter(newFilters.splitFilter || "all");
        }}
        onReset={() => {
          setSelectedSourceType("all");
          setSortOption("date-desc");
          setSplitFilter("all");
        }}
      />

      {/* ── 6. Full Invoice Drawer (if user drills down from an invoice transaction) ── */}
      <BillingInvoiceDetailsDrawer
        invoice={selectedInvoiceForDrawer}
        isOpen={Boolean(selectedInvoiceForDrawer)}
        onClose={() => setSelectedInvoiceForDrawer(null)}
      />
    </div>
  );
};

export default UpiTransactionsDesktopPage;
