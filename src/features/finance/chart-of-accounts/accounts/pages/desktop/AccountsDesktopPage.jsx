// src/features/finance/chart-of-accounts/accounts/pages/desktop/AccountsDesktopPage.jsx

import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  Layers,
  Landmark,
  Scale,
  Receipt,
  Search,
  RefreshCw,
  RotateCcw,
  Plus,
  Eye,
  Edit3,
  Trash2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Folder,
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
  PermissionGate,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks";
import { CompanyFilterSelect } from "@/components/shared";

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getInitials = (name) => {
  if (!name) return "AC";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const NATURE_COLOR_MAP = {
  ASSET: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  LIABILITY: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  EQUITY: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  INCOME: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  EXPENSE: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const PAGE_LIMIT = 10;

export const AccountsDesktopPage = ({
  accounts = [],
  totalCount = 0,
  stats = {},
  filters = {},
  companyFilter,
  accountTypeOptions = [],
  statusOptions = [],
  accountGroupOptions = [],
  isLoading = false,
  handleFilterChange,
  handleClearFilters,
  handleCreateAccount,
  handleViewAccount,
  handleEditAccount,
  handleDeleteAccount,
  handleRefresh,
}) => {
  const tableContainerRef = useRef(null);
  const { can } = usePermission();

  // Infinite Scroll state - initial 10 records matching Sales Invoice page
  const [visibleCount, setVisibleCount] = useState(PAGE_LIMIT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Reset to first 10 items and scroll to top on filter/search change
  useEffect(() => {
    setVisibleCount(PAGE_LIMIT);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [filters.search, filters.accountType, filters.status, filters.accountGroupId]);

  const displayedAccounts = useMemo(() => {
    return (accounts || []).slice(0, visibleCount);
  }, [accounts, visibleCount]);

  const hasMore = visibleCount < (accounts || []).length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_LIMIT, (accounts || []).length));
      setIsLoadingMore(false);
    }, 120);
  }, [isLoadingMore, hasMore, accounts]);

  // Stat cards calculation
  const statCards = useMemo(() => {
    const list = Array.isArray(accounts) ? accounts : [];
    let assetCount = 0;
    let liabilityEquityCount = 0;
    let incomeExpenseCount = 0;

    list.forEach((acc) => {
      const nat = String(acc.accountNature || acc.type || "").toUpperCase();
      if (nat.includes("ASSET")) assetCount++;
      else if (nat.includes("LIAB") || nat.includes("EQUITY")) liabilityEquityCount++;
      else if (nat.includes("INC") || nat.includes("EXP")) incomeExpenseCount++;
    });

    return [
      {
        id: "total",
        title: "Total Accounts",
        value: totalCount || list.length,
        subtitle: "Active Chart of Accounts",
        icon: Layers,
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
      },
      {
        id: "assets",
        title: "Asset Accounts",
        value: assetCount,
        subtitle: "Bank, Cash & Receivables",
        icon: Landmark,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      },
      {
        id: "liabilities",
        title: "Liabilities & Equity",
        value: liabilityEquityCount,
        subtitle: "Payables, Taxes & Capital",
        icon: Scale,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      },
      {
        id: "income-expense",
        title: "Income & Expenses",
        value: incomeExpenseCount,
        subtitle: "Operating Revenues & Costs",
        icon: Receipt,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
      },
    ];
  }, [accounts, totalCount]);

  const hasActiveFilters = Boolean(
    filters.search ||
    (filters.accountType && filters.accountType !== "all") ||
    (filters.status && filters.status !== "all") ||
    (filters.accountGroupId && filters.accountGroupId !== "all")
  );

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden select-none">
      {/* ── 1. Compact 4-Card Statistics Grid ───────────────────────────── */}
      <div className="shrink-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors"
              >
                <div
                  className={cn(
                    "size-9 rounded-lg flex items-center justify-center shrink-0 border",
                    stat.bg,
                    stat.border,
                    stat.color
                  )}
                >
                  <Icon className="size-4.5 stroke-[1.8]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11.5px] font-medium text-text-muted truncate">
                    {stat.title}
                  </div>
                  <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-text-muted truncate mt-0.5">
                    {stat.subtitle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Toolbar ────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {/* Search Input */}
        <div className="flex-1 min-w-[240px] sm:min-w-[280px]">
          <UIInput
            type="text"
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            placeholder="Search by account name, code..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleFilterChange("search", "")}
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

        {/* Account Type Select */}
        <div className="w-[150px] sm:w-[170px]">
          <UISelect
            name="accountType"
            value={filters.accountType || "all"}
            onChange={(val) => handleFilterChange("accountType", val)}
            options={accountTypeOptions}
            placeholder="All Types"
            size="md"
          />
        </div>

        {/* Status Select */}
        <div className="w-[125px] sm:w-[140px]">
          <UISelect
            name="status"
            value={filters.status || "all"}
            onChange={(val) => handleFilterChange("status", val)}
            options={statusOptions}
            placeholder="All Status"
            size="md"
          />
        </div>

        {/* Quick Reset */}
        {hasActiveFilters && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleClearFilters}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
            className="h-10 px-2.5 text-xs text-text-muted hover:text-text"
            title="Reset all filters"
          >
            Reset
          </UIButton>
        )}

        {/* Action Cluster (Right) */}
        <div className="flex items-center gap-1.5 ml-auto">
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={handleRefresh}
            className="h-10 w-10 p-0 text-text-muted hover:text-text cursor-pointer"
            title="Refresh accounts"
          >
            <RefreshCw
              className={cn(
                "size-4 text-text-muted hover:text-primary",
                isLoading && "animate-spin text-primary"
              )}
            />
          </UIButton>

          <PermissionGate permission="account:create">
            <UIButton
              type="button"
              variant="primary"
              size="md"
              startIcon={<Plus className="size-4" />}
              onClick={handleCreateAccount}
              className="h-10 px-3.5 text-xs font-semibold shadow-xs"
            >
              Add Account
            </UIButton>
          </PermissionGate>
        </div>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
        <UITableScrollArea containerRef={tableContainerRef} className="divide-y divide-border/60">
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full"
          >
            {/* Sticky Table Header */}
            <UITableHeader
              sticky
              className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs"
            >
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
                <UITableHead sticky className="min-w-[240px]">Account Name</UITableHead>
                <UITableHead sticky className="min-w-[120px]">Account Code</UITableHead>
                <UITableHead sticky className="min-w-[170px]">Account Group</UITableHead>
                <UITableHead sticky align="center" className="min-w-[120px]">Classification</UITableHead>
                <UITableHead sticky align="right" className="min-w-[140px]">Opening Balance</UITableHead>
                <UITableHead sticky align="center" className="min-w-[100px]">Status</UITableHead>
                <UITableHead sticky align="right" className="min-w-[70px]">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={7} rows={8} />
              ) : displayedAccounts.length === 0 ? (
                <UITableEmpty
                  colSpan={7}
                  title="No accounts found"
                  description={
                    hasActiveFilters
                      ? "No accounts match your active filter criteria. Try clearing search or resetting filters."
                      : "No ledger accounts registered yet."
                  }
                  action={
                    hasActiveFilters ? (
                      <UIButton
                        variant="secondary"
                        size="sm"
                        onClick={handleClearFilters}
                      >
                        Clear Filters
                      </UIButton>
                    ) : (
                      <UIButton
                        variant="primary"
                        size="sm"
                        startIcon={<Plus className="size-4" />}
                        onClick={handleCreateAccount}
                      >
                        Add First Account
                      </UIButton>
                    )
                  }
                />
              ) : (
                displayedAccounts.map((acc) => {
                  const natureKey = String(acc.accountNature || acc.type || "ASSET").toUpperCase();
                  const natureBadgeClass =
                    NATURE_COLOR_MAP[natureKey] ||
                    "bg-surface-alt text-text-muted border-border";

                  const numBalance = Number(acc.openingBalance || 0);
                  const balType = (acc.openingBalanceType || "dr").toUpperCase();

                  return (
                    <UITableRow
                      key={acc._id || acc.id}
                      onClick={() => handleViewAccount(acc._id || acc.id)}
                      className="group cursor-pointer transition-colors hover:bg-surface-hover/70 h-12.5"
                    >
                      {/* Account Name */}
                      <UITableCell className="py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-8 rounded-lg bg-surface-alt border border-border/80 text-text flex items-center justify-center font-bold text-xs shrink-0 select-none">
                            {getInitials(acc.name || acc.accountName)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text truncate group-hover:text-primary transition-colors text-xs sm:text-sm leading-tight">
                              {acc.name || acc.accountName}
                            </span>
                            {acc.accountCategory && (
                              <span className="text-[11px] text-text-muted truncate mt-0.5">
                                {acc.accountCategory}
                              </span>
                            )}
                          </div>
                        </div>
                      </UITableCell>

                      {/* Account Code */}
                      <UITableCell className="py-2">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-alt border border-border/70 text-text">
                          {acc.code || acc.accountCode || "—"}
                        </span>
                      </UITableCell>

                      {/* Account Group */}
                      <UITableCell className="py-2">
                        <div className="flex items-center gap-1.5 text-xs text-text truncate">
                          <Folder className="size-3.5 text-text-muted shrink-0" />
                          <span className="truncate">{acc.underGroup || "—"}</span>
                        </div>
                      </UITableCell>

                      {/* Classification / Nature */}
                      <UITableCell align="center" className="py-2">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold border",
                            natureBadgeClass
                          )}
                        >
                          {natureKey}
                        </span>
                      </UITableCell>

                      {/* Opening Balance */}
                      <UITableCell align="right" className="font-mono tabular-nums text-xs py-2">
                        {numBalance > 0 ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-bold text-text">
                              ₹{formatCurrency(numBalance)}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] font-bold px-1 py-0.2 rounded border",
                                balType === "DR"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                              )}
                            >
                              {balType}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-muted/40 font-mono text-xs">₹0.00</span>
                        )}
                      </UITableCell>

                      {/* Status */}
                      <UITableCell align="center" className="py-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border",
                            acc.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-surface-alt text-text-muted border-border"
                          )}
                        >
                          {acc.status === "active" ? (
                            <CheckCircle2 className="size-2.5" />
                          ) : (
                            <XCircle className="size-2.5" />
                          )}
                          <span className="capitalize">{acc.status || "active"}</span>
                        </span>
                      </UITableCell>

                      {/* Actions */}
                      <UITableCell align="right" className="py-2">
                        <div
                          className="flex items-center justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <UIDropdown>
                            <UIDropdownTrigger asChild>
                              <button
                                type="button"
                                className="size-7 rounded-md flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt transition-colors cursor-pointer"
                                title="Actions"
                              >
                                <MoreVertical className="size-3.5" />
                              </button>
                            </UIDropdownTrigger>
                            <UIDropdownMenu align="right" className="w-44 shadow-lg">
                              <UIDropdownItem
                                icon={<Eye className="size-4 text-text-muted shrink-0" />}
                                onClick={(e) => {
                                  e?.stopPropagation?.();
                                  handleViewAccount(acc._id || acc.id);
                                }}
                              >
                                View Details
                              </UIDropdownItem>
                              {can("account:update") && (
                                <UIDropdownItem
                                  icon={<Edit3 className="size-4 text-text-muted shrink-0" />}
                                  onClick={(e) => {
                                    e?.stopPropagation?.();
                                    handleEditAccount(acc._id || acc.id);
                                  }}
                                >
                                  Edit Account
                                </UIDropdownItem>
                              )}
                              {can("account:delete") && (
                                <>
                                  <UIDropdownDivider />
                                  <UIDropdownItem
                                    destructive
                                    icon={<Trash2 className="size-4 text-error shrink-0" />}
                                    onClick={(e) => {
                                      e?.stopPropagation?.();
                                      handleDeleteAccount(
                                        acc._id || acc.id,
                                        acc.name || acc.accountName
                                      );
                                    }}
                                  >
                                    Delete Account
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

          {/* Infinite Scroll trigger - loads next 10 items on scroll */}
          {!isLoading && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                !hasMore && (accounts || []).length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none">
                    ✓ All {(accounts || []).length} matching accounts loaded
                  </span>
                ) : null
              }
            />
          )}
        </UITableScrollArea>
      </div>
    </div>
  );
};

export default AccountsDesktopPage;
