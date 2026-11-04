// src/features/finance/treasury/bank-management/bank-transactions/pages/desktop/BankTransactionsDesktopPage.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  RefreshCw,
  Landmark,
  Building2,
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
  Layers,
  Eye,
  ArrowUpDown,
  ShieldCheck,
  Ban,
  ArrowDownToLine,
  ArrowUpFromLine,
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
import useBankTransaction from "../../hooks/useBankTransaction";
import useBankAccount from "@/features/finance/treasury/bank-management/bank-accounts/hooks/useBankAccount";
import {
  BankTransactionDetailsDialog,
  BankTransactionsFilterModal,
  BankDepositModal,
  BankWithdrawModal,
} from "../../components";

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
    timeZone: "Asia/Kolkata",
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
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const resolveTxTimestamp = (tx) => {
  if (!tx) return null;
  const d = tx.transactionDate ? new Date(tx.transactionDate) : null;
  const isMidnightUTC =
    d &&
    !Number.isNaN(d.getTime()) &&
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0;

  if (isMidnightUTC && (tx.postedAt || tx.createdAt)) {
    return tx.postedAt || tx.createdAt;
  }
  return tx.transactionDate || tx.postedAt || tx.createdAt;
};

const getTodayISTString = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const getISTStartOfDayISO = (dateStr) => {
  return new Date(`${dateStr}T00:00:00.000+05:30`).toISOString();
};

const getISTEndOfDayISO = (dateStr) => {
  return new Date(`${dateStr}T23:59:59.999+05:30`).toISOString();
};

const DATE_RANGE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last7days" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Month", value: "thisMonth" },
  { label: "Custom Range", value: "custom" },
];

const DIRECTION_OPTIONS = [
  { label: "All Directions", value: "all" },
  { label: "Inward (Credit)", value: "CREDIT" },
  { label: "Outward (Debit)", value: "DEBIT" },
];

const PAGE_LIMIT = 10;

export const BankTransactionsDesktopPage = () => {
  const { currentWorkspace } = useWorkspace();
  const { getBankTransactions } = useBankTransaction();
  const { bankAccounts, getBankAccounts } = useBankAccount();

  const tableContainerRef = useRef(null);
  const hasFetchedBanksRef = useRef(false);

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
  const [selectedBankAccount, setSelectedBankAccount] = useState("all");
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
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // ── Inspection dialog & notification state ──
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Load bank accounts catalog for the account selector
  useEffect(() => {
    if (hasFetchedBanksRef.current) return;
    hasFetchedBanksRef.current = true;
    getBankAccounts({ all: true }).catch((err) =>
      console.warn("Failed to load bank accounts for filter:", err)
    );
  }, [getBankAccounts]);

  const bankAccountSelectOptions = useMemo(() => {
    const list = Array.isArray(bankAccounts) ? bankAccounts : [];
    return [
      { label: "All Bank Accounts", value: "all" },
      ...list.map((b) => {
        const bankTitle = b.bankMasterId?.name || b.accountName || "Bank";
        const last4 = b.accountNumber ? `•••• ${String(b.accountNumber).slice(-4)}` : "";
        return {
          label: `${bankTitle} ${last4}`.trim(),
          value: b._id,
        };
      }),
    ];
  }, [bankAccounts]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Construct start and end dates from selected date range strictly adhering to Indian Standard Time (IST)
  const buildDateParams = useCallback(() => {
    let startDate = null;
    let endDate = null;

    if (selectedDateRange === "today") {
      const todayIST = getTodayISTString();
      startDate = getISTStartOfDayISO(todayIST);
      endDate = getISTEndOfDayISO(todayIST);
    } else if (selectedDateRange === "yesterday") {
      const yest = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yestIST = getTodayISTString(yest);
      startDate = getISTStartOfDayISO(yestIST);
      endDate = getISTEndOfDayISO(yestIST);
    } else if (selectedDateRange === "last7days") {
      const todayIST = getTodayISTString();
      const past7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const past7IST = getTodayISTString(past7);
      startDate = getISTStartOfDayISO(past7IST);
      endDate = getISTEndOfDayISO(todayIST);
    } else if (selectedDateRange === "thisWeek") {
      const todayIST = getTodayISTString();
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const mondayIST = getTodayISTString(monday);
      startDate = getISTStartOfDayISO(mondayIST);
      endDate = getISTEndOfDayISO(todayIST);
    } else if (selectedDateRange === "thisMonth") {
      const todayIST = getTodayISTString();
      const [yyyy, mm] = todayIST.split("-");
      startDate = getISTStartOfDayISO(`${yyyy}-${mm}-01`);
      endDate = getISTEndOfDayISO(todayIST);
    } else if (selectedDateRange === "custom") {
      if (customStartDate) {
        startDate = getISTStartOfDayISO(customStartDate);
      }
      if (customEndDate) {
        endDate = getISTEndOfDayISO(customEndDate);
      }
    }

    return {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
  }, [selectedDateRange, customStartDate, customEndDate]);

  // Fetch initial batch of bank transactions & stats
  const fetchTransactions = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      const dateParams = buildDateParams();
      const [sBy, sOrder] = sortOption.split("-");
      const params = {
        page: 1,
        limit: PAGE_LIMIT,
        bankAccountId: selectedBankAccount !== "all" ? selectedBankAccount : undefined,
        direction: selectedDirection !== "all" ? selectedDirection : undefined,
        transactionType: selectedTransactionType !== "all" ? selectedTransactionType : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        search: debouncedSearch || undefined,
        sortBy: sBy,
        sortOrder: sOrder,
        ...dateParams,
      };

      const res = await getBankTransactions(params);
      const resData = res?.data || res || {};
      const list = Array.isArray(resData.bankTransactions)
        ? resData.bankTransactions
        : Array.isArray(resData.data)
        ? resData.data
        : [];

      const total = resData.total ?? list.length;
      const rawSummary = resData.summary;

      const isCreditRow = (r) => r.direction === "CREDIT";
      const isDebitRow = (r) => r.direction === "DEBIT";

      const listCredits = list.filter(isCreditRow).reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
      const listDebits = list.filter(isDebitRow).reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
      const listInwardCount = list.filter(isCreditRow).length;
      const listOutwardCount = list.filter(isDebitRow).length;

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
      console.warn("Failed to fetch bank transactions:", err);
      setTransactions([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentWorkspace,
    selectedBankAccount,
    selectedDirection,
    selectedTransactionType,
    selectedStatus,
    debouncedSearch,
    sortOption,
    buildDateParams,
    getBankTransactions,
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
        bankAccountId: selectedBankAccount !== "all" ? selectedBankAccount : undefined,
        direction: selectedDirection !== "all" ? selectedDirection : undefined,
        transactionType: selectedTransactionType !== "all" ? selectedTransactionType : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        search: debouncedSearch || undefined,
        sortBy: sBy,
        sortOrder: sOrder,
        ...dateParams,
      };

      const res = await getBankTransactions(params);
      const resData = res?.data || res || {};
      const nextList = Array.isArray(resData.bankTransactions)
        ? resData.bankTransactions
        : Array.isArray(resData.data)
        ? resData.data
        : [];

      setTransactions((prev) => [...prev, ...nextList]);
      setCurrentPage(nextPage);
      const newTotal = resData.total ?? totalCount;
      setTotalCount(newTotal);
      setHasMore(transactions.length + nextList.length < newTotal);
    } catch (err) {
      console.warn("Failed to load more bank transactions:", err);
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
    selectedBankAccount,
    selectedDirection,
    selectedTransactionType,
    selectedStatus,
    debouncedSearch,
    sortOption,
    buildDateParams,
    getBankTransactions,
    totalCount,
    transactions.length,
  ]);

  // Trigger initial fetch when filters change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setSelectedBankAccount("all");
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedDateRange("today");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedDirection("all");
    setSelectedTransactionType("all");
    setSelectedStatus("all");
    setSortOption("date-desc");
  };

  const isAnyFilterActive = useMemo(() => {
    return (
      selectedBankAccount !== "all" ||
      Boolean(searchQuery) ||
      selectedDateRange !== "today" ||
      selectedDirection !== "all" ||
      selectedTransactionType !== "all" ||
      selectedStatus !== "all" ||
      sortOption !== "date-desc"
    );
  }, [
    selectedBankAccount,
    searchQuery,
    selectedDateRange,
    selectedDirection,
    selectedTransactionType,
    selectedStatus,
    sortOption,
  ]);

  const activeAdvancedFilterCount = useMemo(() => {
    return [
      selectedTransactionType !== "all" ? 1 : 0,
      selectedStatus !== "all" ? 1 : 0,
      sortOption !== "date-desc" ? 1 : 0,
    ].reduce((a, b) => a + b, 0);
  }, [selectedTransactionType, selectedStatus, sortOption]);

  const handleCopyText = (e, text, label) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setToastMessage(`${label} copied to clipboard`);
    setTimeout(() => {
      setCopiedId(null);
      setToastMessage(null);
    }, 2000);
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

  const renderTransactionTypeBadge = (type, paymentMode, category) => {
    let badgeNode;
    switch (type) {
      case "DEPOSIT":
        badgeNode = (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Deposit
          </span>
        );
        break;
      case "WITHDRAWAL":
        badgeNode = (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Withdrawal
          </span>
        );
        break;
      case "NEFT":
        badgeNode = (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            NEFT
          </span>
        );
        break;
      case "RTGS":
        badgeNode = (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            RTGS
          </span>
        );
        break;
      case "IMPS":
        badgeNode = (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            IMPS
          </span>
        );
        break;
      case "UPI":
        if (category === "UPI_SETTLEMENT") {
          badgeNode = (
            <span
              title="Consolidated Business Day UPI Settlement"
              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30"
            >
              Day Settlement
            </span>
          );
        } else {
          badgeNode = (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              UPI Pay
            </span>
          );
        }
        break;
      case "CHEQUE":
        badgeNode = (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Cheque
          </span>
        );
        break;
      case "BANK_CHARGES":
        badgeNode = (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20">
            Charges
          </span>
        );
        break;
      case "INTEREST":
        badgeNode = (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            Interest
          </span>
        );
        break;
      default:
        badgeNode = (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-alt border border-border/70 text-text">
            {type || "OTHER"}
          </span>
        );
        break;
    }

    if (paymentMode && (type === "DEPOSIT" || type === "WITHDRAWAL")) {
      return (
        <div className="flex items-center gap-1 flex-wrap">
          {badgeNode}
          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-surface-alt text-text-muted border border-border/80 uppercase">
            {paymentMode}
          </span>
        </div>
      );
    }
    return badgeNode;
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "POSTED":
        return (
          <UIBadge
            variant="soft"
            color="success"
            icon={<ShieldCheck className="size-3 shrink-0" />}
            className="inline-flex items-center whitespace-nowrap font-bold text-xs"
          >
            Posted
          </UIBadge>
        );
      case "CANCELLED":
        return (
          <UIBadge
            variant="soft"
            color="error"
            icon={<Ban className="size-3 shrink-0" />}
            className="inline-flex items-center whitespace-nowrap font-bold text-xs"
          >
            Cancelled
          </UIBadge>
        );
      case "DRAFT":
      default:
        return (
          <UIBadge
            variant="soft"
            color="warning"
            className="inline-flex items-center whitespace-nowrap font-bold text-xs"
          >
            Draft
          </UIBadge>
        );
    }
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

      {/* ── 1. Compact 4-Card Statistics Grid (Bank Register Tally) ─────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Bank Register Tally */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Landmark className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-indigo-600 dark:text-indigo-400 truncate flex items-center gap-1">
              <Sparkles className="size-3" />
              Bank Register Tally
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalTransactions} Txns
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {stats.inwardCount} Inward · {stats.outwardCount} Outward · {stats.draftCount} Drafts
            </div>
          </div>
        </div>

        {/* Card 2: Total Credits (Inward Volume) */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <TrendingUp className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              Bank Inward (Credits)
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              ₹{formatCurrency(stats.totalCredits)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Total credited to accounts
            </div>
          </div>
        </div>

        {/* Card 3: Total Debits (Outward Volume) */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <TrendingDown className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-rose-600 dark:text-rose-400 truncate">
              Bank Outward (Debits)
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums text-rose-600 dark:text-rose-400">
              ₹{formatCurrency(stats.totalDebits)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Withdrawals, transfers & charges
            </div>
          </div>
        </div>

        {/* Card 4: Net Bank Impact */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Wallet className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-primary truncate">
              Net Bank Flow
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.netFlow >= 0 ? "+" : "-"} ₹{formatCurrency(Math.abs(stats.netFlow))}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Net ledger balance movement
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Table Filter Toolbar (Using Reusable UI Components) ───────────────── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Bank Account Selector Dropdown */}
        <div className="w-[200px] sm:w-[240px]">
          <UISelect
            value={selectedBankAccount}
            onChange={(val) => setSelectedBankAccount(val)}
            options={bankAccountSelectOptions}
            placeholder="Select Bank Account"
            size="md"
          />
        </div>

        {/* Search Input */}
        <div className="flex-1 min-w-[220px] sm:min-w-[260px]">
          <UIInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transaction #, reference, or narration..."
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
            placeholder="Direction"
            size="md"
          />
        </div>

        {/* Advanced Filters Button */}
        <UIButton
          variant="outline"
          size="md"
          onClick={() => setIsFilterModalOpen(true)}
          className={cn(
            "gap-1.5 transition-colors",
            activeAdvancedFilterCount > 0 && "border-primary text-primary bg-primary/5"
          )}
        >
          <SlidersHorizontal className="size-4" />
          <span>Filters</span>
          {activeAdvancedFilterCount > 0 && (
            <span className="size-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
              {activeAdvancedFilterCount}
            </span>
          )}
        </UIButton>

        {/* Reset Filters Button */}
        {isAnyFilterActive && (
          <UIButton
            variant="ghost"
            size="md"
            onClick={handleResetFilters}
            className="text-text-muted hover:text-text gap-1.5"
            title="Reset all filters"
          >
            <RotateCcw className="size-4" />
            <span className="hidden sm:inline">Reset</span>
          </UIButton>
        )}

        {/* Refresh Button */}
        <UIButton
          variant="outline"
          size="md"
          onClick={fetchTransactions}
          disabled={isLoading}
          className="p-2.5"
          title="Refresh bank transactions"
        >
          <RefreshCw className={cn("size-4 text-text", isLoading && "animate-spin text-primary")} />
        </UIButton>

        {/* Direct Deposit & Withdraw Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <UIButton
            variant="primary"
            size="md"
            onClick={() => setIsDepositModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-xs px-3.5 py-2 rounded-xl text-xs transition-transform active:scale-95 cursor-pointer"
            title="Deposit funds or personal capital into bank account"
          >
            <ArrowDownToLine className="size-4 stroke-[2.2]" />
            <span>Deposit</span>
          </UIButton>
          <UIButton
            variant="primary"
            size="md"
            onClick={() => setIsWithdrawModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5 shadow-xs px-3.5 py-2 rounded-xl text-xs transition-transform active:scale-95 cursor-pointer"
            title="Withdraw funds or personal drawings from bank account"
          >
            <ArrowUpFromLine className="size-4 stroke-[2.2]" />
            <span>Withdraw</span>
          </UIButton>
        </div>
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
            <UITableHeader sticky className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs border-b border-border">
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt h-10">
                <UITableHead
                  sticky
                  className="min-w-[170px]"
                >
                  Txn # & Reference
                </UITableHead>

                <UITableHead sticky className="min-w-[130px]">
                  Type & Flow
                </UITableHead>

                <UITableHead
                  sticky
                  sortable
                  sortDirection={sortBy === "date" ? (sortOption.endsWith("-asc") ? "asc" : "desc") : null}
                  onSort={() => handleHeaderSort("date")}
                  className="min-w-[140px]"
                >
                  Date & Time
                </UITableHead>

                <UITableHead sticky className="min-w-[190px]">
                  Bank Account
                </UITableHead>

                <UITableHead sticky className="min-w-[200px]">
                  Counterparty & Narration
                </UITableHead>

                <UITableHead
                  sticky
                  sortable
                  align="right"
                  sortDirection={sortBy === "amount" ? (sortOption.endsWith("-asc") ? "asc" : "desc") : null}
                  onSort={() => handleHeaderSort("amount")}
                  className="min-w-[140px]"
                >
                  Amount (₹)
                </UITableHead>

                <UITableHead sticky align="center" className="min-w-[100px]">
                  Status
                </UITableHead>

                <UITableHead sticky align="right" className="min-w-[70px]">
                  Actions
                </UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
                {isLoading ? (
                  <UITableLoading rows={7} columns={8} />
                ) : transactions.length === 0 ? (
                  <UITableEmpty
                    colSpan={8}
                    title="No Bank Transactions Found"
                    description={
                      isAnyFilterActive
                        ? "No transactions match your search and filter criteria. Try clearing filters."
                        : "No bank transactions recorded yet. Bank transactions are automatically logged when confirming deposit slips, processing UPI/Cheque clearance, or fund transfers."
                    }
                    action={
                      isAnyFilterActive ? (
                        <UIButton
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="mt-2 gap-1.5"
                        >
                          <RotateCcw className="size-3.5" />
                          Reset Filters
                        </UIButton>
                      ) : null
                    }
                  />
                ) : (
                  transactions.map((txn, index) => {
                    const isCredit = txn.direction === "CREDIT";
                    const isCopiedTxn = copiedId === txn.transactionNumber;
                    const isCopiedRef = copiedId === txn.referenceNumber;

                    const bankAcc = txn.bankAccountId && typeof txn.bankAccountId === "object"
                      ? txn.bankAccountId
                      : null;
                    const bankMaster = bankAcc?.bankMasterId && typeof bankAcc.bankMasterId === "object"
                      ? bankAcc.bankMasterId
                      : null;
                    const bankDisplayName = bankMaster?.name || bankAcc?.accountName || "Corporate Bank";
                    const maskedNumber = bankAcc?.accountNumber
                      ? `•••• ${String(bankAcc.accountNumber).slice(-4)}`
                      : "";

                    const counterparty = txn.counterpartyAccountId?.accountName;

                    return (
                      <UITableRow
                        key={txn._id || `txn-${index}`}
                        onClick={() => setSelectedTransaction(txn)}
                        className="cursor-pointer hover:bg-surface-hover/80 transition-colors group text-xs border-b border-border/50 last:border-b-0 h-13"
                      >
                        {/* 1. Txn # & Reference */}
                        <UITableCell className="py-2.5 font-mono">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-text group-hover:text-primary transition-colors">
                                {txn.transactionNumber}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyText(e, txn.transactionNumber, "Transaction #")}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-text-muted hover:text-text transition-opacity cursor-pointer"
                                title="Copy transaction number"
                              >
                                {isCopiedTxn ? (
                                  <Check className="size-3 text-success" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            </div>
                            {txn.referenceNumber ? (
                              <div className="flex items-center gap-1 text-[10.5px] text-text-muted mt-0.5">
                                <span className="font-semibold text-text-muted/80">Ref:</span>
                                <span className="truncate max-w-[110px]" title={txn.referenceNumber}>
                                  {txn.referenceNumber}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyText(e, txn.referenceNumber, "Reference #")}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-text-muted hover:text-text transition-opacity cursor-pointer"
                                  title="Copy reference / UTR"
                                >
                                  {isCopiedRef ? (
                                    <Check className="size-2.5 text-success" />
                                  ) : (
                                    <Copy className="size-2.5" />
                                  )}
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </UITableCell>

                        {/* 2. Type & Flow */}
                        <UITableCell className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "size-7 rounded-lg flex items-center justify-center shrink-0 border",
                              isCredit
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                            )}>
                              {isCredit ? (
                                <ArrowDownLeft className="size-3.5 stroke-[2.2]" />
                              ) : (
                                <ArrowUpRight className="size-3.5 stroke-[2.2]" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              {renderTransactionTypeBadge(txn.transactionType, txn.paymentMode, txn.category)}
                              <span className="text-[10px] text-text-muted font-medium mt-0.5">
                                {isCredit ? "Inward (+ CR)" : "Outward (- DR)"}
                              </span>
                            </div>
                          </div>
                        </UITableCell>

                        {/* 3. Date & Time */}
                        <UITableCell className="py-2.5">
                          {(() => {
                            const effectiveTs = resolveTxTimestamp(txn);
                            return (
                              <div className="flex flex-col">
                                <span className="font-medium text-text">{formatDate(effectiveTs)}</span>
                                <span className="text-[10.5px] text-text-muted font-mono">{formatTime(effectiveTs)}</span>
                              </div>
                            );
                          })()}
                        </UITableCell>

                        {/* 4. Bank Account */}
                        <UITableCell className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Landmark className="size-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-text truncate max-w-[150px]">
                                {bankDisplayName}
                              </div>
                              <div className="text-[11px] font-mono text-text-muted truncate">
                                {maskedNumber || "Primary Account"}
                              </div>
                            </div>
                          </div>
                        </UITableCell>

                        {/* 5. Counterparty & Narration */}
                        <UITableCell className="py-2.5">
                          <div className="min-w-0 max-w-[220px]">
                            {counterparty ? (
                              <div className="text-xs font-bold text-text truncate">
                                {counterparty}
                              </div>
                            ) : null}
                            <div className="text-[11px] text-text-muted truncate leading-relaxed">
                              {txn.narration || "General bank settlement"}
                            </div>
                          </div>
                        </UITableCell>

                        {/* 6. Amount */}
                        <UITableCell className="py-2.5 text-right">
                          <div className={cn(
                            "text-sm font-extrabold font-mono tabular-nums leading-tight",
                            isCredit
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          )}>
                            {isCredit ? "+" : "-"} ₹{formatCurrency(txn.amount)}
                          </div>
                          <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mt-0.5">
                            {isCredit ? "CR" : "DR"}
                          </div>
                        </UITableCell>

                        {/* 7. Status */}
                        <UITableCell className="py-2.5 text-center">
                          {renderStatusBadge(txn.status)}
                        </UITableCell>

                        {/* 8. Action button */}
                        <UITableCell className="py-2.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                          <UIButton
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTransaction(txn)}
                            className="p-1.5 size-7 rounded-lg text-text-muted hover:text-text hover:bg-surface-alt cursor-pointer"
                            title="Inspect transaction"
                          >
                            <Eye className="size-4" />
                          </UIButton>
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
                      ✓ All {totalCount} matching bank transactions loaded
                    </span>
                  ) : null
                }
              />
            )}
          </div>
        </div>

      {/* ── 4. Dialogs & Modals ─────────────────────────────────────────────────── */}
      <BankTransactionsFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        initialFilters={{
          transactionType: selectedTransactionType,
          status: selectedStatus,
          sortBy: sortOption,
        }}
        onApply={({ transactionType, status, sortBy }) => {
          setSelectedTransactionType(transactionType);
          setSelectedStatus(status);
          setSortOption(sortBy);
        }}
        onReset={() => {
          setSelectedTransactionType("all");
          setSelectedStatus("all");
          setSortOption("date-desc");
        }}
      />

      <BankTransactionDetailsDialog
        isOpen={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />

      <BankDepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSuccess={() => {
          fetchTransactions();
          getBankAccounts({ all: true });
          setToastMessage("Direct deposit posted successfully to ledger.");
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />

      <BankWithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onSuccess={() => {
          fetchTransactions();
          getBankAccounts({ all: true });
          setToastMessage("Direct withdrawal posted successfully to ledger.");
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />
    </div>
  );
};

export default BankTransactionsDesktopPage;
