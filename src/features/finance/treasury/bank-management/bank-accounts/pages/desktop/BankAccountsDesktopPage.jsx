// src/features/finance/treasury/bank-management/bank-accounts/pages/desktop/BankAccountsDesktopPage.jsx

import React, { useMemo, useState, useRef, useCallback } from "react";
import {
  Building2,
  Wallet,
  CheckCircle2,
  Star,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  Plus,
  Copy,
  Check,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  CreditCard,
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
  PermissionGate,
  uiToast,
} from "@/components/ui";
import { CompanyFilterSelect, CompanyBadge } from "@/components/shared";
import { usePermission } from "@/hooks";
import { cn } from "@/lib/utils";

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Sleek CSS-based Bank Brand Logos
const BankLogo = ({ bankName }) => {
  const name = String(bankName || "").toLowerCase();

  if (name.includes("hdfc")) {
    return (
      <div className="size-8 rounded-lg bg-[#1d4f91] border border-white/20 flex items-center justify-center text-white font-black text-[9px] shrink-0 select-none shadow-2xs">
        <span className="tracking-tighter">HDFC</span>
      </div>
    );
  }
  if (name.includes("icici")) {
    return (
      <div className="size-8 rounded-lg bg-[#ff7a00] border border-[#d65f00] flex items-center justify-center text-white font-black text-[11px] shrink-0 select-none shadow-2xs">
        <span className="italic font-serif leading-none">i</span>
      </div>
    );
  }
  if (name.includes("axis")) {
    return (
      <div className="size-8 rounded-lg bg-[#971a43] border border-white/20 flex items-center justify-center text-white font-bold text-[8.5px] shrink-0 select-none shadow-2xs">
        <span>AXIS</span>
      </div>
    );
  }
  if (name.includes("state") || name.includes("sbi")) {
    return (
      <div className="size-8 rounded-lg bg-[#00a3e0] border border-white/20 flex items-center justify-center shrink-0 select-none shadow-2xs relative">
        <div className="size-3.5 rounded-full bg-[#00a3e0] border-[2px] border-white flex items-center justify-center relative">
          <div className="absolute w-[2px] h-[5px] bg-white bottom-[-4px] left-[2.5px]" />
        </div>
      </div>
    );
  }
  if (name.includes("yes")) {
    return (
      <div className="size-8 rounded-lg bg-[#004b93] border border-white/20 flex items-center justify-center text-white font-black text-[9px] shrink-0 select-none shadow-2xs">
        <span>YES</span>
      </div>
    );
  }
  if (name.includes("kotak")) {
    return (
      <div className="size-8 rounded-lg bg-[#0039a6] border border-[#ea1c24] flex items-center justify-center text-white font-black text-[11px] shrink-0 select-none shadow-2xs">
        <span className="text-[#ea1c24]">k</span>
      </div>
    );
  }
  if (name.includes("canara")) {
    return (
      <div className="size-8 rounded-lg bg-[#00a3e0] border border-white/20 flex items-center justify-center text-[#ffd100] font-black text-[8px] shrink-0 select-none shadow-2xs">
        <span>CNB</span>
      </div>
    );
  }
  if (name.includes("baroda") || name.includes("bob")) {
    return (
      <div className="size-8 rounded-lg bg-[#f05a28] border border-white/20 flex items-center justify-center text-white font-black text-[9px] shrink-0 select-none shadow-2xs">
        <span>BOB</span>
      </div>
    );
  }
  return (
    <div className="size-8 rounded-lg bg-surface-alt border border-border flex items-center justify-center text-text-muted font-bold text-[10px] shrink-0 shadow-2xs">
      <Building2 className="size-4 text-text-muted" />
    </div>
  );
};

const ACCOUNT_TYPE_OPTIONS = [
  { label: "All Account Types", value: "all" },
  { label: "Current Account", value: "current" },
  { label: "Savings Account", value: "savings" },
  { label: "Overdraft Account", value: "overdraft" },
  { label: "Cash Credit Account", value: "cash_credit" },
];

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const INITIAL_BATCH = 20;

export const BankAccountsDesktopPage = ({
  accounts = [],
  dashboardStats = [],
  filters = {},
  uniqueBanks = [],
  isLoading = false,
  hasError = false,
  error = "",
  message = "",
  totalAccounts = 0,
  hasAccounts = false,
  hasFilteredAccounts = false,
  handleFilterChange,
  handleSearchChange,
  handleClearFilters,
  handleRefresh,
  handleAddAccount,
  handleEditAccount,
  handleViewDetails,
  handleSetPrimary,
  handleDeleteAccount,
  companyFilter,
  clearMessage,
}) => {
  const { can } = usePermission();
  const tableContainerRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);

  // Client-side Infinite Scroll state
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleCopyAccountNumber = (e, account) => {
    e.stopPropagation();
    if (!account?.displayAccountNumber) return;
    navigator.clipboard.writeText(String(account.displayAccountNumber));
    setCopiedId(account._id);
    uiToast.success(
      "Copied to Clipboard",
      `Account number for ${account.displayName || "bank account"} copied.`
    );
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isFiltered = Boolean(
    filters.search ||
    (filters.accountType && filters.accountType !== "all") ||
    (filters.status && filters.status !== "all") ||
    (filters.bank && filters.bank !== "all")
  );

  const bankSelectOptions = useMemo(() => {
    return (uniqueBanks || []).map((b) => ({
      label: b === "all" ? "All Banks" : b,
      value: b,
    }));
  }, [uniqueBanks]);

  // Sliced accounts for infinite scroll
  const displayedAccounts = useMemo(() => {
    return accounts.slice(0, visibleCount);
  }, [accounts, visibleCount]);

  const hasMore = visibleCount < accounts.length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 15, accounts.length));
      setIsLoadingMore(false);
    }, 250);
  }, [accounts.length, hasMore, isLoadingMore]);

  // Dynamic stats calculation
  const stats = useMemo(() => {
    const totalCount = accounts.length;
    const activeCount = accounts.filter((a) => a.displayStatus === "active").length;
    const totalBalance = accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
    const primaryAcc = accounts.find((a) => a.isPrimary);

    return {
      totalCount,
      activeCount,
      totalBalance,
      primaryAcc,
    };
  }, [accounts]);

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* ── 1. Compact 4-Card Statistics Grid (Top of Page) ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Accounts */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <Building2 className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total Accounts
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalCount}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Registered bank accounts
            </div>
          </div>
        </div>

        {/* Card 2: Total Bank Balance */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <Wallet className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              Total Bank Balance
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              ₹{formatCurrency(stats.totalBalance)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Across all liquid balances
            </div>
          </div>
        </div>

        {/* Card 3: Active Accounts */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-primary truncate">
              Active Accounts
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.activeCount}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Ready for receipts & payouts
            </div>
          </div>
        </div>

        {/* Card 4: Primary Account */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Star className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400 truncate">
              Primary Account
            </div>
            <div className="text-sm sm:text-base font-bold text-text leading-tight truncate">
              {stats.primaryAcc?.displayName || "None"}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5 font-mono">
              {stats.primaryAcc
                ? `${stats.primaryAcc.displayBank} • ${String(stats.primaryAcc.displayAccountNumber).slice(-4)}`
                : "No default selected"}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Filter Toolbar ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Search Input */}
        <div className="w-[220px] sm:w-[260px] lg:w-[300px]">
          <UIInput
            type="text"
            value={filters.search || ""}
            onChange={(e) => handleSearchChange?.(e.target.value)}
            placeholder="Search account, number, IFSC, branch..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange?.("")}
            className="w-full"
          />
        </div>

        {/* Account Type Select */}
        <div className="w-[160px] sm:w-[180px]">
          <UISelect
            value={filters.accountType || "all"}
            onChange={(val) => handleFilterChange?.({ accountType: val })}
            options={ACCOUNT_TYPE_OPTIONS}
            placeholder="All Types"
            size="md"
          />
        </div>

        {/* Status Select */}
        <div className="w-[130px] sm:w-[145px]">
          <UISelect
            value={filters.status || "all"}
            onChange={(val) => handleFilterChange?.({ status: val })}
            options={STATUS_OPTIONS}
            placeholder="Status"
            size="md"
          />
        </div>

        {/* Workspace Level Company Filter (Zero width/elements at Company level) */}
        <CompanyFilterSelect
          value={companyFilter?.selectedCompanyId || "all"}
          onChange={companyFilter?.setSelectedCompanyId}
          size="md"
          className="w-[160px] sm:w-[190px]"
        />

        {/* Bank Select */}
        {bankSelectOptions.length > 2 && (
          <div className="w-[150px] sm:w-[170px]">
            <UISelect
              value={filters.bank || "all"}
              onChange={(val) => handleFilterChange?.({ bank: val })}
              options={bankSelectOptions}
              placeholder="All Banks"
              size="md"
            />
          </div>
        )}

        {/* Reset Filter Button */}
        {isFiltered && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleClearFilters}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
            className="h-10 px-2 text-xs text-text-muted hover:text-text"
            title="Reset all filters"
          >
            Reset
          </UIButton>
        )}

        {/* Action Cluster (Right Aligned) */}
        <div className="flex items-center gap-1.5 ml-auto">
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={handleRefresh}
            className="h-10 w-10 p-0 text-text-muted hover:text-text"
            title="Refresh bank accounts"
          >
            <RefreshCw
              className={cn("size-4 text-text-muted hover:text-primary", isLoading && "animate-spin text-primary")}
            />
          </UIButton>

          <PermissionGate permission="bank-account:create">
            <UIButton
              type="button"
              variant="primary"
              size="md"
              startIcon={<Plus className="size-3.5" />}
              onClick={handleAddAccount}
              className="h-10 px-3.5 text-xs font-semibold shadow-xs"
            >
              Add Bank Account
            </UIButton>
          </PermissionGate>
        </div>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ── */}
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
            <UITableHeader
              sticky
              className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs border-b border-border"
            >
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text-muted uppercase tracking-wider bg-surface-alt/70 h-10">
                <UITableHead sticky className="min-w-[220px]">Bank & Account</UITableHead>
                <UITableHead sticky className="min-w-[190px]">Account No & IFSC</UITableHead>
                <UITableHead sticky className="min-w-[160px]">Branch & Mobile</UITableHead>
                <UITableHead sticky align="center" className="min-w-[130px]">Type</UITableHead>
                <UITableHead sticky align="right" className="min-w-[140px]">Current Balance</UITableHead>
                <UITableHead sticky align="center" className="min-w-[100px]">Status</UITableHead>
                <UITableHead sticky align="right" className="min-w-[80px]">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={7} rows={8} />
              ) : displayedAccounts.length === 0 ? (
                <UITableEmpty
                  colSpan={7}
                  title="No bank accounts found"
                  description={
                    isFiltered
                      ? "No accounts match your active filter criteria. Try clearing search or resetting filters."
                      : "No bank accounts registered in treasury yet."
                  }
                  action={
                    isFiltered ? (
                      <UIButton
                        variant="secondary"
                        size="sm"
                        onClick={handleClearFilters}
                      >
                        Clear Filters
                      </UIButton>
                    ) : (
                      <PermissionGate permission="bank-account:create">
                        <UIButton
                          variant="primary"
                          size="sm"
                          startIcon={<Plus className="size-4" />}
                          onClick={handleAddAccount}
                        >
                          Add First Bank Account
                        </UIButton>
                      </PermissionGate>
                    )
                  }
                />
              ) : (
                displayedAccounts.map((account) => {
                  const isActive = account.displayStatus === "active";
                  const isPrimary = Boolean(account.isPrimary);

                  return (
                    <UITableRow
                      key={account._id}
                      onClick={() => handleViewDetails(account)}
                      className="group cursor-pointer transition-colors hover:bg-surface-hover/70 h-13 border-b border-border/60 last:border-b-0"
                    >
                      {/* 1. Bank & Account */}
                      <UITableCell className="py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BankLogo bankName={account.displayBank || account.displayName} />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-text truncate hover:text-primary transition-colors text-xs sm:text-sm leading-tight">
                                {account.displayName}
                              </span>
                              {isPrimary && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  <Star className="size-2.5 fill-current" />
                                  Primary
                                </span>
                              )}
                              <CompanyBadge company={account.companyId} />
                            </div>
                            <span className="text-[11px] text-text-muted truncate mt-0.5">
                              {account.displayBank}
                            </span>
                          </div>
                        </div>
                      </UITableCell>

                      {/* 2. Account No & IFSC */}
                      <UITableCell className="py-2">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-text tabular-nums tracking-wide">
                              {account.displayAccountNumber || "—"}
                            </span>
                            {account.displayAccountNumber && (
                              <button
                                type="button"
                                onClick={(e) => handleCopyAccountNumber(e, account)}
                                className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-alt transition-colors cursor-pointer"
                                title="Copy account number"
                              >
                                {copiedId === account._id ? (
                                  <Check className="size-3 text-emerald-600" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </button>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-text-muted">
                            IFSC: {account.displayIfsc || "—"}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 3. Branch & Mobile */}
                      <UITableCell className="py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-text truncate">
                            {account.displayBranch || "—"}
                          </span>
                          <span className="text-[11px] font-mono text-text-muted truncate">
                            {account.registeredMobile || "—"}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 4. Type */}
                      <UITableCell align="center" className="whitespace-nowrap py-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-alt border border-border/70 text-text capitalize">
                          {account.displayType || "Current"}
                        </span>
                      </UITableCell>

                      {/* 5. Balance */}
                      <UITableCell align="right" className="whitespace-nowrap font-mono tabular-nums text-xs py-2">
                        <span className="font-bold text-text text-xs sm:text-sm">
                          ₹{formatCurrency(account.balance)}
                        </span>
                      </UITableCell>

                      {/* 6. Status */}
                      <UITableCell align="center" className="whitespace-nowrap py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              isActive ? "bg-emerald-500" : "bg-rose-500"
                            )}
                          />
                          <span
                            className={cn(
                              "text-xs font-semibold capitalize",
                              isActive
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-rose-700 dark:text-rose-400"
                            )}
                          >
                            {account.displayStatus}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 7. Actions */}
                      <UITableCell align="right" className="py-2" onClick={(e) => e.stopPropagation()}>
                        <UIDropdown>
                          <UIDropdownTrigger asChild>
                            <UIButton
                              variant="ghost"
                              size="sm"
                              className="size-8 p-0 text-text-muted hover:text-text cursor-pointer"
                              title="Actions"
                            >
                              <MoreVertical className="size-4" />
                            </UIButton>
                          </UIDropdownTrigger>
                          <UIDropdownMenu align="end" className="w-48">
                            <UIDropdownItem
                              icon={<Eye className="size-4 text-text-muted shrink-0" />}
                              onClick={() => handleViewDetails(account)}
                            >
                              View Details
                            </UIDropdownItem>

                            {can("bank-account:update") && (
                              <UIDropdownItem
                                icon={<Edit3 className="size-4 text-text-muted shrink-0" />}
                                onClick={() => handleEditAccount(account)}
                              >
                                Edit Account
                              </UIDropdownItem>
                            )}

                            {!isPrimary && can("bank-account:update") && (
                              <UIDropdownItem
                                icon={<Star className="size-4 text-amber-500 shrink-0" />}
                                onClick={() => handleSetPrimary(account)}
                              >
                                Set as Primary
                              </UIDropdownItem>
                            )}

                            {can("bank-account:delete") && (
                              <>
                                <UIDropdownDivider />
                                <UIDropdownItem
                                  destructive
                                  icon={<Trash2 className="size-4 text-error shrink-0" />}
                                  onClick={() => handleDeleteAccount(account)}
                                >
                                  Delete Account
                                </UIDropdownItem>
                              </>
                            )}
                          </UIDropdownMenu>
                        </UIDropdown>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Infinite Scroll Sentinel */}
          {!isLoading && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BankAccountsDesktopPage;
