// src/features/finance/chart-of-accounts/account-groups/pages/desktop/AccountGroupsDesktopPage.jsx

import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  FolderTree,
  Folder,
  Layers,
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
  GitBranch,
} from "lucide-react";

import {
  UIButton,
  UIInput,
  UISelect,
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

const NATURE_COLOR_MAP = {
  ASSET: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  LIABILITY: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  EQUITY: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  INCOME: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  EXPENSE: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const PAGE_LIMIT = 10;

export const AccountGroupsDesktopPage = ({
  accountGroups = [],
  totalCount = 0,
  rawGroups = [],
  stats = {},
  filters = {},
  rootGroupOptions = [],
  statusOptions = [],
  isLoading = false,
  handleFilterChange,
  handleClearFilters,
  handleCreateGroup,
  handleViewGroup,
  handleEditGroup,
  handleDeleteGroup,
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
  }, [filters.search, filters.status, filters.underGroup]);

  const displayedGroups = useMemo(() => {
    return (accountGroups || []).slice(0, visibleCount);
  }, [accountGroups, visibleCount]);

  const hasMore = visibleCount < (accountGroups || []).length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + PAGE_LIMIT, (accountGroups || []).length)
      );
      setIsLoadingMore(false);
    }, 120);
  }, [isLoadingMore, hasMore, accountGroups]);

  const statCards = useMemo(() => {
    return [
      {
        id: "total",
        title: "Total Groups",
        value: stats.totalGroups || totalCount || accountGroups.length,
        subtitle: "Account Categories",
        icon: FolderTree,
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
      },
      {
        id: "root",
        title: "Primary Groups",
        value: stats.rootGroups || 0,
        subtitle: "Top-level Ledgers",
        icon: Folder,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      },
      {
        id: "subgroups",
        title: "Subgroups",
        value: stats.underGroups || 0,
        subtitle: "Nested Account Groups",
        icon: GitBranch,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      },
      {
        id: "accounts",
        title: "Linked Accounts",
        value: stats.totalAccounts || 0,
        subtitle: "Assigned GL Accounts",
        icon: Layers,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
      },
    ];
  }, [stats, totalCount, accountGroups.length]);

  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.status && filters.status !== "all") ||
      (filters.underGroup && filters.underGroup !== "all")
  );

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden select-none">
      {/* ── 1. Compact 4-Card Statistics Grid (Matches Billing/Sales Invoice Page) ── */}
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
            placeholder="Search account groups by name, code..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleFilterChange("search", "")}
            className="w-full"
          />
        </div>

        {/* Under / Root Group Select */}
        <div className="w-[180px] sm:w-[210px]">
          <UISelect
            name="underGroup"
            value={filters.underGroup || "all"}
            onChange={(val) => handleFilterChange("underGroup", val)}
            options={rootGroupOptions}
            placeholder="All Groups"
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
            title="Refresh account groups"
          >
            <RefreshCw
              className={cn(
                "size-4 text-text-muted hover:text-primary",
                isLoading && "animate-spin text-primary"
              )}
            />
          </UIButton>

          <PermissionGate permission="account-group:create">
            <UIButton
              type="button"
              variant="primary"
              size="md"
              startIcon={<Plus className="size-4" />}
              onClick={handleCreateGroup}
              className="h-10 px-3.5 text-xs font-semibold shadow-xs"
            >
              Add Group
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
                <UITableHead sticky className="min-w-[240px]">Group Name</UITableHead>
                <UITableHead sticky className="min-w-[130px]">Group Code</UITableHead>
                <UITableHead sticky className="min-w-[180px]">Under Group</UITableHead>
                <UITableHead sticky align="center" className="min-w-[120px]">Nature</UITableHead>
                <UITableHead sticky align="center" className="min-w-[110px]">Hierarchy</UITableHead>
                <UITableHead sticky align="center" className="min-w-[110px]">Accounts</UITableHead>
                <UITableHead sticky align="center" className="min-w-[100px]">Status</UITableHead>
                <UITableHead sticky align="right" className="min-w-[70px]">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={8} rows={8} />
              ) : displayedGroups.length === 0 ? (
                <UITableEmpty
                  colSpan={8}
                  title="No account groups found"
                  description={
                    hasActiveFilters
                      ? "No groups match your active filter criteria. Try clearing search or resetting filters."
                      : "No account groups configured yet."
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
                        onClick={handleCreateGroup}
                      >
                        Add First Group
                      </UIButton>
                    )
                  }
                />
              ) : (
                displayedGroups.map((group) => {
                  const natureKey = String(group.nature || "ASSET").toUpperCase();
                  const natureBadgeClass =
                    NATURE_COLOR_MAP[natureKey] ||
                    "bg-surface-alt text-text-muted border-border";

                  const isSubgroup = Boolean(group.parentGroupId);

                  return (
                    <UITableRow
                      key={group._id || group.id}
                      onClick={() => handleViewGroup(group._id || group.id)}
                      className="group cursor-pointer transition-colors hover:bg-surface-hover/70 h-12.5"
                    >
                      {/* Group Name */}
                      <UITableCell className="py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-8 rounded-lg bg-surface-alt border border-border/80 text-text flex items-center justify-center font-bold text-xs shrink-0 select-none">
                            <Folder className="size-4 text-indigo-500" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text truncate group-hover:text-primary transition-colors text-xs sm:text-sm leading-tight">
                              {group.name || group.groupName}
                            </span>
                            {group.description && (
                              <span className="text-[11px] text-text-muted truncate mt-0.5">
                                {group.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </UITableCell>

                      {/* Group Code */}
                      <UITableCell className="py-2">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-alt border border-border/70 text-text">
                          {group.code || group.groupCode || "—"}
                        </span>
                      </UITableCell>

                      {/* Under Group */}
                      <UITableCell className="py-2">
                        <div className="flex items-center gap-1.5 text-xs text-text truncate">
                          {isSubgroup ? (
                            <GitBranch className="size-3.5 text-text-muted shrink-0" />
                          ) : (
                            <FolderTree className="size-3.5 text-emerald-500 shrink-0" />
                          )}
                          <span className="truncate">{group.underGroup || "Primary Group"}</span>
                        </div>
                      </UITableCell>

                      {/* Nature */}
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

                      {/* Hierarchy */}
                      <UITableCell align="center" className="py-2">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold border",
                            isSubgroup
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                              : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20"
                          )}
                        >
                          {isSubgroup ? "Subgroup" : "Primary Group"}
                        </span>
                      </UITableCell>

                      {/* Accounts Count */}
                      <UITableCell align="center" className="py-2 font-mono text-xs font-semibold">
                        <span className="px-2 py-0.5 rounded-full bg-surface-alt border border-border text-text">
                          {group.accountsCount ?? 0}
                        </span>
                      </UITableCell>

                      {/* Status */}
                      <UITableCell align="center" className="py-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border",
                            group.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-surface-alt text-text-muted border-border"
                          )}
                        >
                          {group.status === "active" ? (
                            <CheckCircle2 className="size-2.5" />
                          ) : (
                            <XCircle className="size-2.5" />
                          )}
                          <span className="capitalize">{group.status || "active"}</span>
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
                                  handleViewGroup(group._id || group.id);
                                }}
                              >
                                View Details
                              </UIDropdownItem>
                              {can("account-group:update") && (
                                <UIDropdownItem
                                  icon={<Edit3 className="size-4 text-text-muted shrink-0" />}
                                  onClick={(e) => {
                                    e?.stopPropagation?.();
                                    handleEditGroup(group._id || group.id);
                                  }}
                                >
                                  Edit Group
                                </UIDropdownItem>
                              )}
                              {can("account-group:delete") && (
                                <>
                                  <UIDropdownDivider />
                                  <UIDropdownItem
                                    destructive
                                    icon={<Trash2 className="size-4 text-error shrink-0" />}
                                    onClick={(e) => {
                                      e?.stopPropagation?.();
                                      handleDeleteGroup(
                                        group._id || group.id,
                                        group.name || group.groupName
                                      );
                                    }}
                                  >
                                    Delete Group
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
                !hasMore && (accountGroups || []).length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none">
                    ✓ All {(accountGroups || []).length} matching account groups loaded
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

export default AccountGroupsDesktopPage;
