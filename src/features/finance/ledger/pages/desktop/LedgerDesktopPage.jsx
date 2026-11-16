// src/features/finance/ledger/pages/desktop/LedgerDesktopPage.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  RefreshCw,
  RotateCcw,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Scale,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  Hash,
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
  UITableScrollArea,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import useBranch from "@/features/branch/hooks/useBranch";
import useAccount from "@/features/finance/chart-of-accounts/accounts/hooks/useAccount";
import { useCompanyFilter } from "@/hooks";
import { CompanyFilterSelect } from "@/components/shared";
import ledgerService from "../../services/ledgerService";
import { LedgerEntryDetailsDialog } from "../../components";

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

const DATE_RANGE_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last7days" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Month", value: "thisMonth" },
  { label: "Custom Range", value: "custom" },
];

const PAGE_LIMIT = 20;

export const LedgerDesktopPage = () => {
  const { currentWorkspace } = useWorkspace();
  const { currentBranch } = useBranch();
  const { accounts = [], getAccounts } = useAccount();
  const companyFilter = useCompanyFilter();

  const tableContainerRef = useRef(null);
  const hasFetchedAccountsRef = useRef(false);

  // ── Ledger Entries & Infinite Scroll state ──
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // ── Summary Statistics ──
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalDebit: 0,
    totalCredit: 0,
    netBalance: 0,
    netBalanceType: "dr",
  });

  // ── Filter States ──
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // ── Action Feedback State ──
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // ── View Entry Details Dialog ──
  const [selectedEntryForView, setSelectedEntryForView] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleRowClick = (entry) => {
    if (!entry) return;
    setSelectedEntryForView(entry);
    setIsViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedEntryForView(null);
  };

  // Fetch accounts catalog for the account selector
  useEffect(() => {
    if (hasFetchedAccountsRef.current) return;
    hasFetchedAccountsRef.current = true;
    getAccounts({
      all: true,
      excludeCategories: "CUSTOMER,SUPPLIER",
      branchId: currentBranch?._id,
    }).catch((err) => console.warn("Failed to load accounts for ledger dropdown:", err));
  }, [getAccounts, currentBranch?._id]);

  // Map accounts to options
  const accountSelectOptions = useMemo(() => {
    const list = Array.isArray(accounts) ? accounts : [];
    const filtered = list.filter(
      (acc) =>
        acc.accountCategory !== "CUSTOMER" &&
        !acc.accountCode?.startsWith("CUST-") &&
        acc.accountCategory !== "SUPPLIER" &&
        !acc.accountCode?.startsWith("SUPP-")
    );

    return [
      { label: "All Operating Accounts", value: "" },
      ...filtered.map((acc) => ({
        label: `${acc.accountName} (${acc.accountCode || "ACC"})`,
        value: acc._id,
        description: `${acc.accountNature || "GENERAL"} · ${acc.accountCategory || "General"}`,
      })),
    ];
  }, [accounts]);

  // Selected account details
  const activeAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return accounts.find((a) => a._id === selectedAccountId) || null;
  }, [selectedAccountId, accounts]);

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

  // Fetch initial batch of ledger entries & stats
  const fetchInitialLedger = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      const dateParams = buildDateParams();
      const params = {
        page: 1,
        limit: PAGE_LIMIT,
        accountId: selectedAccountId || undefined,
        branchId: currentBranch?._id,
        companyId: companyFilter?.queryCompanyId,
        sort: "-voucherDate -createdAt",
        ...dateParams,
      };

      const res = await ledgerService.getLedger(params);
      const resData = res.data?.data || res.data || {};
      const list = Array.isArray(resData.entries)
        ? resData.entries
        : Array.isArray(resData.data)
        ? resData.data
        : [];

      const total = resData.total ?? list.length;
      const meta = resData.meta || {};

      const listDebit = list.reduce((acc, r) => acc + (Number(r.debit) || 0), 0);
      const listCredit = list.reduce((acc, r) => acc + (Number(r.credit) || 0), 0);

      const totalDebit = meta.totalDebit !== undefined ? Number(meta.totalDebit) : listDebit;
      const totalCredit = meta.totalCredit !== undefined ? Number(meta.totalCredit) : listCredit;

      // Net Balance determination
      let netBal = totalDebit - totalCredit;
      let netType = netBal >= 0 ? "dr" : "cr";

      if (activeAccount) {
        const isAssetOrExpense = ["ASSET", "EXPENSE"].includes(activeAccount.accountNature);
        if (list.length > 0 && list[0].runningBalance !== undefined) {
          netBal = Number(list[0].runningBalance);
          netType = netBal >= 0 ? "dr" : "cr";
        } else {
          netBal = isAssetOrExpense ? totalDebit - totalCredit : totalCredit - totalDebit;
          netType = isAssetOrExpense ? (netBal >= 0 ? "dr" : "cr") : (netBal >= 0 ? "cr" : "dr");
        }
      }

      setStats({
        totalEntries: total,
        totalDebit,
        totalCredit,
        netBalance: Math.abs(netBal),
        netBalanceType: netType,
      });

      setLedgerEntries(list);
      setTotalCount(total);
      setCurrentPage(1);
      setHasMore(list.length < total);

      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.warn("Failed to fetch ledger entries:", err);
      setLedgerEntries([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, currentBranch?._id, selectedAccountId, activeAccount, buildDateParams, companyFilter?.queryCompanyId]);

  // Load next batch via Infinite Scroll
  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore || !currentWorkspace) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const dateParams = buildDateParams();
      const params = {
        page: nextPage,
        limit: PAGE_LIMIT,
        accountId: selectedAccountId || undefined,
        branchId: currentBranch?._id,
        companyId: companyFilter?.queryCompanyId,
        sort: "-voucherDate -createdAt",
        ...dateParams,
      };

      const res = await ledgerService.getLedger(params);
      const resData = res.data?.data || res.data || {};
      const nextList = Array.isArray(resData.entries)
        ? resData.entries
        : Array.isArray(resData.data)
        ? resData.data
        : [];

      setLedgerEntries((prev) => [...prev, ...nextList]);
      setCurrentPage(nextPage);
      const newTotal = resData.total ?? totalCount;
      setTotalCount(newTotal);
      setHasMore(ledgerEntries.length + nextList.length < newTotal);
    } catch (err) {
      console.warn("Failed to load more ledger entries:", err);
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
    selectedAccountId,
    currentBranch?._id,
    buildDateParams,
    totalCount,
    ledgerEntries.length,
    companyFilter?.queryCompanyId,
  ]);

  // Trigger fetch on parameter change
  useEffect(() => {
    fetchInitialLedger();
  }, [fetchInitialLedger]);

  // Filter client-side by debounced search if search text is provided
  const visibleEntries = useMemo(() => {
    if (!debouncedSearch) return ledgerEntries;
    const term = debouncedSearch.toLowerCase();
    return ledgerEntries.filter((entry) => {
      const vNo = String(entry.voucherNumber || "").toLowerCase();
      const narr = String(entry.narration || "").toLowerCase();
      const acc = String(entry.accountId?.accountName || "").toLowerCase();
      const code = String(entry.accountId?.accountCode || "").toLowerCase();
      return vNo.includes(term) || narr.includes(term) || acc.includes(term) || code.includes(term);
    });
  }, [ledgerEntries, debouncedSearch]);

  // Reset filters
  const handleResetFilters = () => {
    setSelectedAccountId("");
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedDateRange("all");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  const isAnyFilterActive = useMemo(() => {
    return (
      Boolean(selectedAccountId) ||
      Boolean(searchQuery) ||
      selectedDateRange !== "all"
    );
  }, [selectedAccountId, searchQuery, selectedDateRange]);

  // Copy to clipboard helper
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

  // Recalculate balance for selected account
  const handleRecalculate = async () => {
    if (!selectedAccountId || isRecalculating) return;
    setIsRecalculating(true);
    try {
      await ledgerService.recalculateLedger({ accountId: selectedAccountId });
      setToastMessage("Account running balances recalculated successfully.");
      await fetchInitialLedger();
    } catch (err) {
      console.error("Recalculate ledger error:", err);
      const msg = err.response?.data?.message || "Failed to recalculate ledger.";
      setToastMessage(`Error: ${msg}`);
    } finally {
      setIsRecalculating(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Render voucher type badge
  const renderVoucherTypeBadge = (vType) => {
    const type = String(vType || "").toUpperCase();
    switch (type) {
      case "RECEIPT":
      case "CUSTOMER_RECEIPT":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Receipt
          </span>
        );
      case "PAYMENT":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Payment
          </span>
        );
      case "JOURNAL":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            Journal
          </span>
        );
      case "CONTRA":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Contra
          </span>
        );
      case "SALE":
      case "SALE_RETURN":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            {type === "SALE_RETURN" ? "Sale Return" : "Sale Bill"}
          </span>
        );
      case "PURCHASE":
      case "PURCHASE_RETURN":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            {type === "PURCHASE_RETURN" ? "Purc Return" : "Purchase"}
          </span>
        );
      case "OPENING_BALANCE":
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            Opening Bal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-alt text-text-muted border border-border/80">
            {type || "ENTRY"}
          </span>
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

      {/* ── 1. Compact 4-Card Statistics Grid ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Ledger Account Scope & Tally */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BookOpen className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-indigo-600 dark:text-indigo-400 truncate flex items-center gap-1">
              <Sparkles className="size-3" />
              {activeAccount ? activeAccount.accountName : "Ledger Audit Trail"}
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums truncate">
              {stats.totalEntries} Entries
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {activeAccount
                ? `${activeAccount.accountNature} · ${activeAccount.accountCategory || "General"}`
                : "Aggregated journal entries across accounts"}
            </div>
          </div>
        </div>

        {/* Card 2: Total Debits (Dr Volume) */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <TrendingUp className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              Total Debits (Dr)
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              ₹{formatCurrency(stats.totalDebit)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Cumulative debits posted
            </div>
          </div>
        </div>

        {/* Card 3: Total Credits (Cr Volume) */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <TrendingDown className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-rose-600 dark:text-rose-400 truncate">
              Total Credits (Cr)
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums text-rose-600 dark:text-rose-400">
              ₹{formatCurrency(stats.totalCredit)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Cumulative credits posted
            </div>
          </div>
        </div>

        {/* Card 4: Net Position / Running Balance */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Scale className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-primary truncate">
              {activeAccount ? "Closing Running Balance" : "Net Ledger Flow"}
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums flex items-baseline gap-1.5">
              <span>₹{formatCurrency(stats.netBalance)}</span>
              <UIBadge
                variant="soft"
                color={stats.netBalanceType === "dr" ? "success" : "error"}
                className="text-[10px] font-extrabold px-1.5 py-0.2"
              >
                {stats.netBalanceType === "dr" ? "DR" : "CR"}
              </UIBadge>
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {activeAccount
                ? `Normal standing: ${activeAccount.accountNature}`
                : "Debit/Credit net difference"}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Filter Toolbar ───────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Account Selector Dropdown with Search */}
        <div className="w-[240px] sm:w-[280px]">
          <UISelect
            value={selectedAccountId}
            onChange={(val) => setSelectedAccountId(val || "")}
            options={accountSelectOptions}
            placeholder="Select Account"
            size="md"
            isSearchable
            isClearable
            searchPlaceholder="Search accounts..."
            popoverClassName="min-w-[280px] sm:min-w-[320px]"
          />
        </div>

        {/* Search Input (Reduced, Compact Width) */}
        <div className="w-[210px] sm:w-[250px]">
          <UIInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voucher, narration..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => setSearchQuery("")}
            className="w-full"
          />
        </div>

        {/* Workspace Level Company Filter (Zero width/elements at Company level) */}
        <CompanyFilterSelect
          value={companyFilter?.selectedCompanyId || "all"}
          onChange={companyFilter?.setSelectedCompanyId}
          size="md"
          className="w-[170px] sm:w-[195px]"
        />

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
            <div className="w-[135px]">
              <UIDatePicker
                value={customStartDate}
                onChange={(val) => setCustomStartDate(val || "")}
                placeholder="From date"
                size="md"
                isClearable
              />
            </div>
            <span className="text-xs text-text-muted">to</span>
            <div className="w-[135px]">
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

        {/* Right-aligned Actions Group: Recalculate + Refresh */}
        <div className="ml-auto flex items-center gap-2">
          {/* Recalculate Button (when an account is selected) */}
          {selectedAccountId && (
            <UIButton
              variant="outline"
              size="md"
              onClick={handleRecalculate}
              disabled={isRecalculating || isLoading}
              className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5 font-semibold text-xs transition-colors"
              title="Recalculate running balances for this account"
            >
              <RefreshCw
                className={cn("size-3.5", isRecalculating && "animate-spin text-primary")}
              />
              <span>{isRecalculating ? "Recalculating..." : "Recalculate"}</span>
            </UIButton>
          )}

          {/* Refresh Button */}
          <UIButton
            variant="outline"
            size="md"
            onClick={fetchInitialLedger}
            disabled={isLoading}
            className="p-2.5"
            title="Refresh ledger entries"
          >
            <RefreshCw className={cn("size-4 text-text", isLoading && "animate-spin text-primary")} />
          </UIButton>
        </div>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ──── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
        <UITableScrollArea containerRef={tableContainerRef}>
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full"
          >
            <UITableHeader
              sticky
              className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs border-b border-border"
            >
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt h-10">
                <UITableHead sticky className="min-w-[130px]">
                  Date & Time
                </UITableHead>

                <UITableHead sticky className="min-w-[160px]">
                  Voucher # & Type
                </UITableHead>

                <UITableHead sticky className="min-w-[260px]">
                  Account & Narration
                </UITableHead>

                <UITableHead sticky align="right" className="min-w-[140px]">
                  Debit (₹ Dr)
                </UITableHead>

                <UITableHead sticky align="right" className="min-w-[140px]">
                  Credit (₹ Cr)
                </UITableHead>

                <UITableHead sticky align="right" className="min-w-[160px] pr-4">
                  Running Balance
                </UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading rows={8} columns={6} />
              ) : visibleEntries.length === 0 ? (
                <UITableEmpty
                  colSpan={6}
                  title="No Ledger Postings Found"
                  description={
                    isAnyFilterActive
                      ? "No ledger postings match your search and filter criteria. Try clearing filters."
                      : "No ledger postings recorded yet. Journal entries are automatically logged upon posting sales, receipts, payments, and bank transactions."
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
                visibleEntries.map((entry, index) => {
                  const debitVal = Number(entry.debit) || 0;
                  const creditVal = Number(entry.credit) || 0;
                  const runningBal = Number(entry.runningBalance) || 0;
                  const isDebitBal = runningBal >= 0;
                  const vNumber = entry.voucherNumber || "VCH-ENTRY";
                  const isCopied = copiedId === vNumber;

                  const accountObj =
                    entry.accountId && typeof entry.accountId === "object"
                      ? entry.accountId
                      : null;
                  const voucherObj =
                    entry.voucherId && typeof entry.voucherId === "object"
                      ? entry.voucherId
                      : null;

                  const voucherType = voucherObj?.voucherType || "JOURNAL";
                  const reference = voucherObj?.referenceNumber;

                  return (
                    <UITableRow
                      key={entry._id || `entry-${index}`}
                      onClick={() => handleRowClick(entry)}
                      className="hover:bg-surface-hover/80 transition-colors group text-xs border-b border-border/50 last:border-b-0 h-13 cursor-pointer"
                    >
                      {/* 1. Date & Time */}
                      <UITableCell className="py-2.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-text">
                            {formatDate(entry.voucherDate)}
                          </span>
                          <span className="text-[10.5px] text-text-muted font-mono">
                            {formatTime(entry.voucherDate)}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 2. Voucher # & Type */}
                      <UITableCell className="py-2.5 font-mono">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-text group-hover:text-primary transition-colors">
                              {vNumber}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyText(e, vNumber, "Voucher #")}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-text-muted hover:text-text transition-opacity cursor-pointer"
                              title="Copy voucher number"
                            >
                              {isCopied ? (
                                <Check className="size-3 text-success" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            {renderVoucherTypeBadge(voucherType)}
                            {reference ? (
                              <span className="text-[10px] text-text-muted truncate max-w-[90px]" title={reference}>
                                Ref: {reference}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </UITableCell>

                      {/* 3. Account & Narration */}
                      <UITableCell className="py-2.5">
                        <div className="min-w-0 max-w-[340px]">
                          {accountObj && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-text truncate">
                              <span>{accountObj.accountName}</span>
                              {accountObj.accountCode ? (
                                <span className="font-mono text-[10.5px] text-text-muted font-normal">
                                  ({accountObj.accountCode})
                                </span>
                              ) : null}
                            </div>
                          )}
                          <div
                            className="text-[11px] text-text-muted truncate leading-relaxed mt-0.5"
                            title={entry.narration || "Ledger posting entry"}
                          >
                            {entry.narration || "Standard balanced posting entry"}
                          </div>
                        </div>
                      </UITableCell>

                      {/* 4. Debit (₹ Dr) */}
                      <UITableCell className="py-2.5 text-right font-mono tabular-nums">
                        {debitVal > 0 ? (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{formatCurrency(debitVal)}
                          </span>
                        ) : (
                          <span className="text-text-muted/40 font-normal">—</span>
                        )}
                      </UITableCell>

                      {/* 5. Credit (₹ Cr) */}
                      <UITableCell className="py-2.5 text-right font-mono tabular-nums">
                        {creditVal > 0 ? (
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                            ₹{formatCurrency(creditVal)}
                          </span>
                        ) : (
                          <span className="text-text-muted/40 font-normal">—</span>
                        )}
                      </UITableCell>

                      {/* 6. Running Balance */}
                      <UITableCell className="py-2.5 text-right pr-4 font-mono">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span className="text-xs font-extrabold text-text tabular-nums">
                            ₹{formatCurrency(Math.abs(runningBal))}
                          </span>
                          <UIBadge
                            variant="soft"
                            color={isDebitBal ? "success" : "error"}
                            className="text-[9.5px] font-black px-1.5 py-0.2"
                          >
                            {isDebitBal ? "DR" : "CR"}
                          </UIBadge>
                        </div>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Reusable UIInfiniteScroll Component */}
          {!isLoading && visibleEntries.length > 0 && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                !hasMore && visibleEntries.length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none">
                    ✓ All {totalCount} matching ledger entries loaded
                  </span>
                ) : null
              }
            />
          )}
        </UITableScrollArea>
      </div>
      {/* ── 4. View Ledger Entry Details Modal Dialog ───────────────────── */}
      <LedgerEntryDetailsDialog
        isOpen={isViewDialogOpen}
        onClose={handleCloseViewDialog}
        entry={selectedEntryForView}
      />
    </div>
  );
};

export default LedgerDesktopPage;
