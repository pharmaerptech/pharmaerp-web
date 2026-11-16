// src/features/finance/financial-periods/pages/desktop/FinancialPeriodsDesktopPage.jsx

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Activity,
  Lock,
  CheckCircle2,
  Search,
  RotateCcw,
  RefreshCw,
  Plus,
  Eye,
  Unlock,
  AlertCircle,
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
  PermissionGate,
} from "@/components/ui";
import { usePermission } from "@/hooks";
import { formatDate } from "@/utils";
import { CompanyFilterSelect } from "@/components/shared";
import { cn } from "@/lib/utils";

const typeOptions = [
  { label: "All Types", value: "all" },
  { label: "Financial Year", value: "YEAR" },
  { label: "Quarterly Period", value: "QUARTER" },
  { label: "Monthly Period", value: "MONTH" },
  { label: "Adjustment Period", value: "ADJUSTMENT" },
];

const statusOptions = [
  { label: "All Statuses", value: "all" },
  { label: "Open Period", value: "OPEN" },
  { label: "Closed Period", value: "CLOSED" },
  { label: "Locked Period", value: "LOCKED" },
];

const PAGE_LIMIT = 15;

const FinancialPeriodsDesktopPage = ({
  financialPeriods = [],
  searchParams = { search: "", periodType: "all", status: "all" },
  companyFilter,
  currentPage = 1,
  pageSize = 25,
  totalPeriods = 0,
  isLoading = false,
  isUpdating = false,
  error,
  clearError,
  handleSearchChange,
  handleFilterChange,
  handlePageChange,
  handlePageSizeChange,
  handleUpdateStatus,
  handleCreate,
  handleView,
  handleRefresh,
}) => {
  const tableContainerRef = useRef(null);
  const { can } = usePermission();

  // Infinite Scroll state - incremental batches
  const [visibleCount, setVisibleCount] = useState(PAGE_LIMIT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Reset visible count and scroll to top on filter change
  useEffect(() => {
    setVisibleCount(PAGE_LIMIT);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [searchParams.search, searchParams.periodType, searchParams.status]);

  const displayedPeriods = useMemo(() => {
    return (financialPeriods || []).slice(0, visibleCount);
  }, [financialPeriods, visibleCount]);

  const hasMore = visibleCount < (financialPeriods || []).length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + PAGE_LIMIT, (financialPeriods || []).length)
      );
      setIsLoadingMore(false);
    }, 120);
  }, [isLoadingMore, hasMore, financialPeriods]);

  const currentActivePeriod = useMemo(() => {
    return financialPeriods.find((p) => p.isCurrent)?.periodCode || "—";
  }, [financialPeriods]);

  const stats = useMemo(() => {
    const counts = { total: totalPeriods || financialPeriods.length, open: 0, closed: 0, locked: 0 };
    financialPeriods.forEach((p) => {
      if (p.status === "OPEN") counts.open++;
      else if (p.status === "CLOSED") counts.closed++;
      else if (p.status === "LOCKED") counts.locked++;
    });
    return counts;
  }, [financialPeriods, totalPeriods]);

  const statCards = useMemo(
    () => [
      {
        id: "total_periods",
        title: "Defined Periods",
        value: stats.total,
        subtitle: "Total fiscal calendars",
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
        icon: Calendar,
      },
      {
        id: "current_active",
        title: "Active Period",
        value: currentActivePeriod,
        subtitle: `${stats.open} open periods`,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        icon: Activity,
      },
      {
        id: "closed_periods",
        title: "Closed Periods",
        value: stats.closed,
        subtitle: "Awaiting audit & locking",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        icon: CheckCircle2,
      },
      {
        id: "locked_periods",
        title: "Locked Periods",
        value: stats.locked,
        subtitle: "Fully frozen books",
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        icon: Lock,
      },
    ],
    [stats, currentActivePeriod]
  );

  const hasActiveFilters = Boolean(
    searchParams.search ||
      (searchParams.periodType && searchParams.periodType !== "all") ||
      (searchParams.status && searchParams.status !== "all")
  );

  const handleClearFilters = () => {
    handleSearchChange("");
    handleFilterChange("periodType", "all");
    handleFilterChange("status", "all");
  };

  const getStatusBadge = (status) => {
    const raw = String(status || "").toUpperCase();
    switch (raw) {
      case "OPEN":
        return (
          <UIBadge variant="soft" color="success" className="font-semibold text-xs">
            Open Period
          </UIBadge>
        );
      case "CLOSED":
        return (
          <UIBadge variant="soft" color="warning" className="font-semibold text-xs">
            Closed Period
          </UIBadge>
        );
      case "LOCKED":
        return (
          <UIBadge variant="soft" color="neutral" className="font-semibold text-xs">
            Locked Period
          </UIBadge>
        );
      default:
        return (
          <UIBadge variant="soft" color="neutral" className="font-semibold text-xs">
            {raw}
          </UIBadge>
        );
    }
  };

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
                  <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums truncate">
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
        <div className="flex-1 min-w-[220px] sm:min-w-[260px]">
          <UIInput
            type="text"
            value={searchParams.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search period code (e.g. FY-2024-25, Q1)..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange("")}
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

        {/* Period Type Select */}
        <div className="w-[150px] sm:w-[170px]">
          <UISelect
            value={searchParams.periodType || "all"}
            onChange={(val) => handleFilterChange("periodType", val)}
            options={typeOptions}
            placeholder="All Types"
            size="md"
          />
        </div>

        {/* Status Select */}
        <div className="w-[130px] sm:w-[150px]">
          <UISelect
            value={searchParams.status || "all"}
            onChange={(val) => handleFilterChange("status", val)}
            options={statusOptions}
            placeholder="All Statuses"
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
            title="Refresh financial periods"
          >
            <RefreshCw
              className={cn(
                "size-4 text-text-muted hover:text-primary",
                isLoading && "animate-spin text-primary"
              )}
            />
          </UIButton>

          <PermissionGate permission="financial-period:create">
            <UIButton
              type="button"
              variant="primary"
              size="md"
              startIcon={<Plus className="size-4" />}
              onClick={handleCreate}
              className="h-10 px-3.5 text-xs font-semibold shadow-xs"
            >
              Add Period
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
                <UITableHead sticky className="min-w-[170px]">Period Code</UITableHead>
                <UITableHead sticky className="min-w-[130px]">Type</UITableHead>
                <UITableHead sticky className="min-w-[120px]">Start Date</UITableHead>
                <UITableHead sticky className="min-w-[120px]">End Date</UITableHead>
                <UITableHead sticky align="center" className="min-w-[130px]">Current Active</UITableHead>
                <UITableHead sticky align="center" className="min-w-[120px]">Status</UITableHead>
                <UITableHead sticky align="right" className="min-w-[180px]">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={7} rows={8} />
              ) : displayedPeriods.length === 0 ? (
                <UITableEmpty
                  colSpan={7}
                  title="No financial periods found"
                  description={
                    hasActiveFilters
                      ? "Try clearing filters to find defined fiscal periods."
                      : "Define new financial years, quarters or monthly accounting periods."
                  }
                />
              ) : (
                displayedPeriods.map((p) => {
                  return (
                    <UITableRow
                      key={p._id || p.id}
                      className="hover:bg-surface-alt/50 transition-colors"
                    >
                      {/* Period Code */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="font-mono text-xs font-bold text-text">
                          {p.periodCode}
                        </div>
                        {p.periodName && (
                          <div className="text-[10px] text-text-muted truncate max-w-[200px]">
                            {p.periodName}
                          </div>
                        )}
                      </UITableCell>

                      {/* Type */}
                      <UITableCell className="py-2.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-alt border border-border text-text">
                          {p.periodType}
                        </span>
                      </UITableCell>

                      {/* Start Date */}
                      <UITableCell className="py-2.5 px-3 font-mono text-xs text-text-muted">
                        {formatDate(p.startDate)}
                      </UITableCell>

                      {/* End Date */}
                      <UITableCell className="py-2.5 px-3 font-mono text-xs text-text-muted">
                        {formatDate(p.endDate)}
                      </UITableCell>

                      {/* Current Active */}
                      <UITableCell align="center" className="py-2.5 px-3">
                        {p.isCurrent ? (
                          <UIBadge variant="soft" color="success" className="text-[10px] font-semibold">
                            ACTIVE PERIOD
                          </UIBadge>
                        ) : (
                          <span className="text-text-muted text-xs font-mono">—</span>
                        )}
                      </UITableCell>

                      {/* Status */}
                      <UITableCell align="center" className="py-2.5 px-3">
                        {getStatusBadge(p.status)}
                      </UITableCell>

                      {/* Actions */}
                      <UITableCell align="right" className="py-2.5 px-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {handleView && (
                            <UIButton
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-text-muted hover:text-text cursor-pointer"
                              title="View Details"
                              onClick={() => handleView(p)}
                            >
                              <Eye className="size-3.5" />
                            </UIButton>
                          )}

                          {can("financial-period:update") && (
                            <>
                              {p.status === "OPEN" && (
                                <UIButton
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(p._id, "CLOSED")}
                                  disabled={isUpdating}
                                  className="h-7 px-2 text-[11px] font-medium border-amber-500/30 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                >
                                  Close Period
                                </UIButton>
                              )}

                              {p.status === "CLOSED" && (
                                <>
                                  <UIButton
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(p._id, "LOCKED")}
                                    disabled={isUpdating}
                                    className="h-7 px-2 text-[11px] font-medium border-rose-500/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                  >
                                    <Lock className="size-3 mr-1" />
                                    Lock Period
                                  </UIButton>
                                  <UIButton
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(p._id, "OPEN")}
                                    disabled={isUpdating}
                                    className="h-7 px-2 text-[11px] font-medium text-text-muted hover:text-text"
                                  >
                                    <Unlock className="size-3 mr-1" />
                                    Reopen
                                  </UIButton>
                                </>
                              )}

                              {p.status === "LOCKED" && (
                                <UIButton
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(p._id, "CLOSED")}
                                  disabled={isUpdating}
                                  className="h-7 px-2 text-[11px] font-medium text-text-muted hover:text-text"
                                >
                                  <Unlock className="size-3 mr-1" />
                                  Unlock
                                </UIButton>
                              )}
                            </>
                          )}
                        </div>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Infinite Scroll trigger */}
          {!isLoading && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                !hasMore && (financialPeriods || []).length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none">
                    ✓ All {(financialPeriods || []).length} financial periods loaded
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

export default FinancialPeriodsDesktopPage;
