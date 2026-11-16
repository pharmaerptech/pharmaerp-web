// src/features/finance/account-balances/pages/desktop/AccountBalancesDesktopPage.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  Users,
  Truck,
  Layers,
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
import { useCompanyFilter } from "@/hooks";
import { CompanyFilterSelect } from "@/components/shared";
import accountBalanceService from "../../services/accountBalanceService";
import { AccountBalanceDetailsDialog } from "../../components/AccountBalanceDetailsDialog";

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

const BALANCE_TYPE_OPTIONS = [
  { label: "All Balance Types", value: "all" },
  { label: "Debit Balances (DR)", value: "dr" },
  { label: "Credit Balances (CR)", value: "cr" },
];

const ACCOUNT_NATURE_OPTIONS = [
  { label: "All Natures", value: "all" },
  { label: "Asset Accounts", value: "ASSET" },
  { label: "Liability Accounts", value: "LIABILITY" },
  { label: "Income Accounts", value: "INCOME" },
  { label: "Expense Accounts", value: "EXPENSE" },
  { label: "Equity Accounts", value: "EQUITY" },
];

const SORT_SELECT_OPTIONS = [
  { label: "Recent Activity", value: "lastTransactionAt-desc" },
  { label: "Balance: High to Low", value: "balance-desc" },
  { label: "Balance: Low to High", value: "balance-asc" },
  { label: "Account Name: A to Z", value: "name-asc" },
  { label: "Account Name: Z to A", value: "name-desc" },
  { label: "Account Code: A to Z", value: "code-asc" },
];

const SCOPE_OPTIONS = [
  { value: "company", label: "Company & Branch Accounts", icon: Building2 },
  { value: "customer", label: "Customer Accounts", icon: Users },
  { value: "supplier", label: "Supplier Accounts", icon: Truck },
  { value: "all", label: "All Ledgers", icon: Layers },
];

const PAGE_LIMIT = 10;

export const AccountBalancesDesktopPage = () => {
  const { currentWorkspace } = useWorkspace();
  const { currentBranch } = useBranch();
  const companyFilter = useCompanyFilter();
  const tableContainerRef = useRef(null);

  // Balances & Infinite Scroll states
  const [balances, setBalances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBalances, setTotalBalances] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Global Statistics (independent of pagination)
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalDebit: 0,
    totalCredit: 0,
    drCount: 0,
    crCount: 0,
  });

  // Filter & Scope States
  const [accountScope, setAccountScope] = useState("company");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBalanceType, setSelectedBalanceType] = useState("all");
  const [selectedNature, setSelectedNature] = useState("all");
  const [sortOption, setSortOption] = useState("lastTransactionAt-desc");

  // Filter Modal Dialog state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Active filter count for badge (tracks filters configured in modal)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedBalanceType !== "all") count++;
    if (selectedNature !== "all") count++;
    if (sortOption !== "lastTransactionAt-desc") count++;
    return count;
  }, [selectedBalanceType, selectedNature, sortOption]);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState(null);

  // View Details Dialog state (no page redirection)
  const [selectedAccountIdForView, setSelectedAccountIdForView] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Transform and normalize account balance row
  const formatBalanceRow = (b) => {
    const account = b.accountId || {};
    const rawBalance = Number(b.balance || 0);
    const balanceType = String(b.balanceType || (rawBalance >= 0 ? "dr" : "cr")).toLowerCase();
    const absBalance = Math.abs(rawBalance);

    return {
      _id: b._id || `bal-${Date.now()}-${Math.random()}`,
      accountId: account._id || b.accountId,
      accountCode: account.accountCode || "—",
      accountName: account.accountName || "Unnamed Account",
      accountNature: account.accountNature || "ASSET",
      accountCategory: account.accountCategory || "GENERAL",
      debitTotal: Number(b.debitTotal || 0),
      creditTotal: Number(b.creditTotal || 0),
      balance: absBalance,
      balanceType: balanceType,
      lastTransactionAt: b.lastTransactionAt || b.updatedAt,
      createdAt: b.createdAt,
    };
  };

  // Build query parameters
  const buildQueryParams = (page) => {
    const [sBy, sOrder] = sortOption.split("-");
    const params = {
      page,
      limit: PAGE_LIMIT,
      branchId: currentBranch?._id || undefined,
      companyId: companyFilter?.queryCompanyId,
      accountScope,
    };

    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedBalanceType && selectedBalanceType !== "all") params.balanceType = selectedBalanceType;
    if (selectedNature && selectedNature !== "all") params.accountNature = selectedNature;
    if (sBy) params.sortBy = sBy;
    if (sOrder) params.sortOrder = sOrder;

    return params;
  };

  // Fetch initial batch (Page 1) or refresh
  const fetchInitialBalances = useCallback(async () => {
    if (!currentWorkspace) return;
    setIsLoading(true);
    try {
      const params = buildQueryParams(1);
      const res = await accountBalanceService.getAccountBalances(params);
      const resData = res.data?.data || {};
      const balanceList = Array.isArray(resData.balances) ? resData.balances : [];
      const total = resData.total ?? balanceList.length;

      // Update global statistics
      if (resData.summary) {
        setStats({
          totalAccounts: resData.summary.totalAccounts ?? total,
          totalDebit: resData.summary.totalDebit ?? 0,
          totalCredit: resData.summary.totalCredit ?? 0,
          drCount: resData.summary.drCount ?? 0,
          crCount: resData.summary.crCount ?? 0,
        });
      } else {
        let dr = 0;
        let cr = 0;
        let dSum = 0;
        let cSum = 0;
        balanceList.forEach((item) => {
          dSum += Number(item.debitTotal || 0);
          cSum += Number(item.creditTotal || 0);
          if (String(item.balanceType).toLowerCase() === "dr") dr++;
          else if (String(item.balanceType).toLowerCase() === "cr") cr++;
        });
        setStats({
          totalAccounts: total,
          totalDebit: dSum,
          totalCredit: cSum,
          drCount: dr,
          crCount: cr,
        });
      }

      setBalances(balanceList.map(formatBalanceRow));
      setTotalBalances(total);
      setCurrentPage(1);
      setHasMore(balanceList.length < total);

      // Scroll container to top on fresh search / filter change
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.warn("Failed to fetch account balances:", err);
      setBalances([]);
      setTotalBalances(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentWorkspace,
    currentBranch?._id,
    debouncedSearch,
    selectedBalanceType,
    selectedNature,
    sortOption,
    accountScope,
    companyFilter?.queryCompanyId,
  ]);

  // Load next batch via Infinite Scroll
  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore || !currentWorkspace) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const params = buildQueryParams(nextPage);
      const res = await accountBalanceService.getAccountBalances(params);
      const resData = res.data?.data || {};
      const balanceList = Array.isArray(resData.balances) ? resData.balances : [];
      const total = resData.total ?? totalBalances;

      if (balanceList.length > 0) {
        setBalances((prev) => {
          const existingIds = new Set(prev.map((b) => b._id));
          const newRows = balanceList
            .map(formatBalanceRow)
            .filter((b) => !existingIds.has(b._id));
          const combined = [...prev, ...newRows];
          setHasMore(combined.length < total);
          return combined;
        });
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn("Failed to load more account balances:", err);
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
    selectedBalanceType,
    selectedNature,
    sortOption,
    accountScope,
    totalBalances,
    companyFilter?.queryCompanyId,
  ]);

  // Trigger re-fetch on filter changes
  useEffect(() => {
    fetchInitialBalances();
  }, [fetchInitialBalances]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setSelectedBalanceType("all");
    setSelectedNature("all");
    setSortOption("lastTransactionAt-desc");
    setAccountScope("company");
  };

  // View Details in modal dialog (no page redirection)
  const handleViewDetails = (accountId) => {
    if (!accountId) return;
    setSelectedAccountIdForView(accountId);
    setIsViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedAccountIdForView(null);
  };

  const handleModalRecalculateSuccess = () => {
    fetchInitialBalances();
  };

  // Helper for Nature Badge
  const renderNatureBadge = (nature) => {
    const nat = String(nature || "").toUpperCase();
    switch (nat) {
      case "ASSET":
        return <UIBadge variant="soft" color="info" className="font-semibold text-xs">ASSET</UIBadge>;
      case "LIABILITY":
        return <UIBadge variant="soft" color="warning" className="font-semibold text-xs">LIABILITY</UIBadge>;
      case "INCOME":
        return <UIBadge variant="soft" color="success" className="font-semibold text-xs">INCOME</UIBadge>;
      case "EXPENSE":
        return <UIBadge variant="soft" color="error" className="font-semibold text-xs">EXPENSE</UIBadge>;
      case "EQUITY":
        return <UIBadge variant="soft" color="primary" className="font-semibold text-xs">EQUITY</UIBadge>;
      default:
        return <UIBadge variant="soft" color="neutral" className="font-semibold text-xs">{nat || "OTHER"}</UIBadge>;
    }
  };

  // Helper for Category Tag
  const renderCategoryTag = (category) => {
    const cat = String(category || "").toUpperCase();
    if (cat.includes("CUSTOMER")) {
      return <span className="text-[10.5px] font-medium text-primary px-1.5 py-0.5 bg-primary/10 rounded-md">Customer</span>;
    }
    if (cat.includes("SUPPLIER")) {
      return <span className="text-[10.5px] font-medium text-amber-600 dark:text-amber-400 px-1.5 py-0.5 bg-amber-500/10 rounded-md">Supplier</span>;
    }
    if (cat.includes("CASH") || cat.includes("BANK")) {
      return <span className="text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 bg-emerald-500/10 rounded-md">Treasury</span>;
    }
    if (cat.includes("SALES")) {
      return <span className="text-[10.5px] font-medium text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 bg-indigo-500/10 rounded-md">Sales</span>;
    }
    return <span className="text-[10.5px] font-medium text-text-muted px-1.5 py-0.5 bg-surface-alt rounded-md">{category || "General"}</span>;
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
        {/* Card 1: Total Accounts Tracked */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <BookOpen className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              {accountScope === "customer"
                ? "Customers Tracked"
                : accountScope === "supplier"
                ? "Suppliers Tracked"
                : accountScope === "company"
                ? "Operating Accounts"
                : "Accounts Tracked"}
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalAccounts}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {accountScope === "customer"
                ? "Customer debtor ledgers"
                : accountScope === "supplier"
                ? "Supplier creditor ledgers"
                : accountScope === "company"
                ? "Core branch & general ledger"
                : "All ledger accounts"}
            </div>
          </div>
        </div>

        {/* Card 2: Debit Balances (DR) */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <ArrowUpRight className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              {accountScope === "customer"
                ? "Credit Outstanding (DR)"
                : accountScope === "supplier"
                ? "Advance to Vendors (DR)"
                : "Debit Balances (DR)"}
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.drCount} Accounts
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate mt-0.5">
              ₹{formatCurrency(stats.totalDebit)} volume
            </div>
          </div>
        </div>

        {/* Card 3: Credit Balances (CR) */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-error-soft text-error flex items-center justify-center shrink-0">
            <ArrowDownRight className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-error truncate">
              {accountScope === "customer"
                ? "Customer Advances (CR)"
                : accountScope === "supplier"
                ? "Supplier Payables (CR)"
                : "Credit Balances (CR)"}
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.crCount} Accounts
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono truncate mt-0.5">
              ₹{formatCurrency(stats.totalCredit)} volume
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
              Net Balance Gap
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(Math.abs((stats.totalDebit || 0) - (stats.totalCredit || 0)))}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {(stats.totalDebit || 0) >= (stats.totalCredit || 0)
                ? "Net Debit Position"
                : "Net Credit Position"}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Toolbar (Customer Desktop Page Pattern) ────── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Prominent Search Input */}
        <div className="flex-1 min-w-[240px] sm:min-w-[280px]">
          <UIInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search account name or code..."
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

        {/* Upfront Best Filter: Account Scope */}
        <div className="w-[180px] sm:w-[220px]">
          <UISelect
            value={accountScope}
            onChange={(val) => setAccountScope(val)}
            options={SCOPE_OPTIONS}
            placeholder="Account Scope"
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
        {(activeFilterCount > 0 || searchQuery || accountScope !== "company") && (
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
            variant="secondary"
            size="md"
            disabled={isLoading}
            onClick={fetchInitialBalances}
            startIcon={
              <RefreshCw className={cn("size-3.5 text-primary", isLoading && "animate-spin")} />
            }
            className="h-10 px-3 text-xs sm:text-sm font-semibold"
            title="Refresh Balances"
          >
            Refresh
          </UIButton>
        </div>
      </div>

      {/* ── 4. Constrained-Height Table with Sticky Header & Infinite Scroll ────── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
        <UITableScrollArea containerRef={tableContainerRef} className="divide-y divide-border/60">
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full"
          >
            {/* Sticky Header: pinned to top of tableContainerRef with solid surface background */}
            <UITableHeader sticky className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs">
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
                <UITableHead sticky className="min-w-[240px]">Account Name</UITableHead>
                <UITableHead sticky align="center" className="min-w-[140px]">Nature & Category</UITableHead>
                <UITableHead sticky align="right" className="min-w-[140px]">Debit Total (Dr)</UITableHead>
                <UITableHead sticky align="right" className="min-w-[140px]">Credit Total (Cr)</UITableHead>
                <UITableHead sticky align="right" className="min-w-[170px]">Closing Balance</UITableHead>
                <UITableHead sticky align="center" className="min-w-[130px]">Last Activity</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={6} rows={8} />
              ) : balances.length === 0 ? (
                <UITableEmpty
                  colSpan={6}
                  title="No account balances found"
                  description={
                    debouncedSearch || selectedBalanceType !== "all" || selectedNature !== "all"
                      ? "No accounts match your selected filter criteria. Try clearing filters."
                      : "No account balances recorded yet."
                  }
                  action={
                    (debouncedSearch || selectedBalanceType !== "all" || selectedNature !== "all") ? (
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
                balances.map((b) => {
                  const isDebit = b.balanceType === "dr";

                  return (
                    <UITableRow
                      key={b._id}
                      onClick={() => handleViewDetails(b.accountId)}
                      className="cursor-pointer transition-colors hover:bg-surface-hover/70"
                    >
                      {/* Account Name (First Column) */}
                      <UITableCell>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text truncate hover:text-primary transition-colors">
                            {b.accountName}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {renderCategoryTag(b.accountCategory)}
                          </div>
                        </div>
                      </UITableCell>

                      {/* Nature & Category */}
                      <UITableCell align="center" className="whitespace-nowrap">
                        {renderNatureBadge(b.accountNature)}
                      </UITableCell>

                      {/* Debit Total (Dr) */}
                      <UITableCell align="right" className="whitespace-nowrap font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                        ₹{formatCurrency(b.debitTotal)}
                      </UITableCell>

                      {/* Credit Total (Cr) */}
                      <UITableCell align="right" className="whitespace-nowrap font-mono tabular-nums text-rose-600 dark:text-rose-400 font-semibold text-xs">
                        ₹{formatCurrency(b.creditTotal)}
                      </UITableCell>

                      {/* Closing Balance */}
                      <UITableCell align="right" className="whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-sm text-text tabular-nums">
                            ₹{formatCurrency(b.balance)}
                          </span>
                          {isDebit ? (
                            <UIBadge variant="soft" color="success" className="font-bold text-[10px] px-1.5 py-0.5">
                              DR
                            </UIBadge>
                          ) : (
                            <UIBadge variant="soft" color="error" className="font-bold text-[10px] px-1.5 py-0.5">
                              CR
                            </UIBadge>
                          )}
                        </div>
                      </UITableCell>

                      {/* Last Activity */}
                      <UITableCell align="center" className="whitespace-nowrap text-xs text-text-muted">
                        <div className="flex flex-col items-center">
                          <span>{formatDate(b.lastTransactionAt)}</span>
                          <span className="text-[10.5px] font-mono text-text-muted/70">
                            {formatTime(b.lastTransactionAt)}
                          </span>
                        </div>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Reusable UIInfiniteScroll Component */}
          {!isLoading && balances.length > 0 && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                !hasMore && balances.length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none py-2 block text-center">
                    ✓ All {totalBalances} account balances loaded
                  </span>
                ) : null
              }
            />
          )}
        </UITableScrollArea>
      </div>

      {/* ── 5. Filter Dialog (Modal) ──────────────────────────────────────────────── */}
      <UIModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        size="md"
      >
        <UIModalHeader>
          <UIModalTitle>Filter Account Balances</UIModalTitle>
          <UIModalDescription>
            Refine ledgers by scope, balance standing, accounting nature, and sorting.
          </UIModalDescription>
        </UIModalHeader>
        <UIModalBody>
          <div className="space-y-4 py-2">
            {/* 1. Account Scope */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text flex items-center justify-between">
                <span>Account Scope</span>
                {accountScope !== "company" && (
                  <span className="text-[11px] text-primary font-bold">Active Scope</span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-alt border border-border rounded-xl">
                {SCOPE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = accountScope === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAccountScope(opt.value)}
                      className={cn(
                        "flex items-center justify-start gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        isSelected
                          ? "bg-surface text-primary border border-primary/20 shadow-xs font-bold"
                          : "text-text-muted hover:text-text hover:bg-surface/50 border border-transparent"
                      )}
                    >
                      <Icon className={cn("size-3.5 shrink-0", isSelected ? "text-primary" : "text-text-muted")} />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Balance Standing */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text flex items-center justify-between">
                <span>Balance Standing</span>
                {selectedBalanceType !== "all" && (
                  <span className="text-[11px] text-primary font-bold">Active Filter</span>
                )}
              </label>
              <UISelect
                value={selectedBalanceType}
                onChange={(val) => setSelectedBalanceType(val)}
                options={BALANCE_TYPE_OPTIONS}
                placeholder="All Balance Types"
                size="md"
              />
              <span className="text-[11px] text-text-muted block">
                Filter by Debit Balances (DR) or Credit Balances (CR)
              </span>
            </div>

            {/* 3. Account Nature */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text flex items-center justify-between">
                <span>Accounting Nature</span>
                {selectedNature !== "all" && (
                  <span className="text-[11px] text-primary font-bold">Active Filter</span>
                )}
              </label>
              <UISelect
                value={selectedNature}
                onChange={(val) => setSelectedNature(val)}
                options={ACCOUNT_NATURE_OPTIONS}
                placeholder="All Natures"
                size="md"
              />
            </div>

            {/* 4. Sort Sequence */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text flex items-center justify-between">
                <span>Sort Sequence</span>
                {sortOption !== "lastTransactionAt-desc" && (
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
              setSelectedBalanceType("all");
              setSelectedNature("all");
              setSortOption("lastTransactionAt-desc");
              setAccountScope("company");
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

      {/* ── 6. Account Balance View Dialog (No Page Redirection) ────────────────── */}
      <AccountBalanceDetailsDialog
        isOpen={isViewDialogOpen}
        onClose={handleCloseViewDialog}
        accountId={selectedAccountIdForView}
        onRecalculateSuccess={handleModalRecalculateSuccess}
      />
    </div>
  );
};

export default AccountBalancesDesktopPage;
