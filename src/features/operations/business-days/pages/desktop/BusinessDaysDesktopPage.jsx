// src/features/operations/business-days/pages/desktop/BusinessDaysDesktopPage.jsx

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  CalendarDays,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  LockKeyhole,
  MoreVertical,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import {
  UIButton,
  UIInput,
  UIDatePicker,
  UISelect,
  UIBadge,
  UIEmptyState,
  UIAlert,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  UIInfiniteScroll,
  UITableLoading,
  UITableScrollArea,
} from "@/components/ui";

import {
  OpenBusinessDayDialog,
  ViewBusinessDayDialog,
  CloseBusinessDayDialog,
} from "../../components";
import { BranchFilterSelect, BranchBadge } from "@/components/shared";
import { cn } from "@/lib/utils";

const formatDate = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatCurrencyNumber = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const STATUS_SELECT_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
  { label: "With Issues", value: "with_issues" },
];

const INITIAL_BATCH = 20;

export const BusinessDaysDesktopPage = ({
  businessDays = [],
  paginatedBusinessDays,
  allBusinessDays = [],
  stats: propStats,

  filters = {},
  handleFilterChange,
  handleSearchChange,
  handleClearFilters,
  handleRefresh,

  isLoading,
  hasError,
  error,
  clearMessage,

  hasBusinessDays = false,

  // Branch filter state (Company Level Only)
  isCompanyLevel = false,
  selectedBranchId = "all",
  setSelectedBranchId,

  // Dialog controls
  openBusinessDay,
  isOpenDialogOpen,
  setIsOpenDialogOpen,
  selectedDay,
  dialogType,
  handleOpenDialog,
  handleCloseDialog,
}) => {
  const tableContainerRef = useRef(null);
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);

  // Close actions menu popover on outside mousedown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-actions-menu]")) {
        setActiveMenuRowId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset infinite scroll count on filters/data change
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [businessDays.length, filters.date, filters.status, filters.search]);

  // Stat Calculations using Active Data
  const totalCount = allBusinessDays.length;
  const openCount = allBusinessDays.filter((d) => d.status === "open").length;
  const closedCount = allBusinessDays.filter((d) => d.status === "closed").length;
  const issuesCount = allBusinessDays.filter(
    (d) =>
      d.status === "with_issues" ||
      d.status === "cancelled" ||
      d.hasDiscrepancy
  ).length;

  const hasOpenDay =
    Boolean(openBusinessDay) ||
    openCount > 0 ||
    allBusinessDays.some((d) => d.status === "open");

  const visibleDays = useMemo(() => {
    return businessDays.slice(0, visibleCount);
  }, [businessDays, visibleCount]);

  const hasMore = visibleCount < businessDays.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + 20, businessDays.length));
  }, [businessDays.length]);

  const isFiltered = Boolean(
    filters.search ||
    filters.date ||
    (filters.status && filters.status !== "all")
  );

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* Global Error Banner */}
      {error && !hasError && (
        <UIAlert
          intent="danger"
          title="Something went wrong"
          description={error}
          onClose={clearMessage}
        />
      )}

      {/* ── 1. Compact 4-Card Statistics Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Business Days */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <CalendarDays className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total Business Days
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {totalCount}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Operating sessions
            </div>
          </div>
        </div>

        {/* Card 2: Open */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              Open Day
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {openCount}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate mt-0.5">
              Currently active
            </div>
          </div>
        </div>

        {/* Card 3: Closed */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-surface-alt text-text flex items-center justify-center shrink-0">
            <Clock className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Closed Days
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {closedCount}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Reconciled & ended
            </div>
          </div>
        </div>

        {/* Card 4: With Issues */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-error-soft text-error flex items-center justify-center shrink-0">
            <AlertCircle className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-error truncate">
              With Issues
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {issuesCount}
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono truncate mt-0.5">
              Requires attention
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Filter Toolbar ─────────────────────────── */}
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

        {/* Search Input */}
        <div className="w-[220px] sm:w-[260px] lg:w-[290px] shrink-0">
          <UIInput
            type="text"
            value={filters.search || ""}
            onChange={(e) => handleSearchChange?.(e.target.value)}
            placeholder="Search date, session, or branch..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange?.("")}
            className="w-full"
          />
        </div>

        {/* Date Picker */}
        <div className="w-[145px] sm:w-[160px]">
          <UIDatePicker
            value={filters.date || ""}
            onChange={(val) => handleFilterChange?.({ date: val || "" })}
            placeholder="Select date"
            size="md"
            isClearable
          />
        </div>

        {/* Status Dropdown */}
        <div className="w-[140px] sm:w-[155px]">
          <UISelect
            value={filters.status || "all"}
            onChange={(val) => handleFilterChange?.({ status: val })}
            options={STATUS_SELECT_OPTIONS}
            placeholder="All Statuses"
            size="md"
          />
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleClearFilters}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
            className="h-10 px-2 text-xs text-text-muted hover:text-text"
            title="Reset filters"
          >
            Reset
          </UIButton>
        )}

        {/* Right-Aligned Action Cluster */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Refresh Button */}
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={handleRefresh}
            className="h-10 w-10 p-0 text-text-muted hover:text-text"
            title="Refresh business days"
          >
            <RefreshCw
              className={cn("size-4 text-text-muted hover:text-primary", isLoading && "animate-spin text-primary")}
            />
          </UIButton>

          {/* Open Business Day Button (when no day is open) */}
          {!hasOpenDay && (
            <UIButton
              type="button"
              variant="primary"
              size="md"
              startIcon={<Plus className="size-3.5" />}
              onClick={() => setIsOpenDialogOpen(true)}
              className="h-10 px-3.5 text-xs font-semibold shadow-xs"
            >
              Open Business Day
            </UIButton>
          )}
        </div>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ──── */}
      {isLoading && businessDays.length === 0 ? (
        <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col">
          <div className="relative overflow-y-auto overflow-x-auto flex-1 min-h-0">
            <UITable
              stickyHeader
              containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
              className="w-full text-xs font-sans"
            >
              <UITableHeader sticky className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs">
                <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
                  <UITableHead sticky className="min-w-[130px]">Business Date</UITableHead>
                  <UITableHead sticky className="min-w-[170px]">Branch</UITableHead>
                  <UITableHead sticky align="center" className="min-w-[110px]">Status</UITableHead>
                  <UITableHead sticky className="min-w-[120px]">Opening Time</UITableHead>
                  <UITableHead sticky className="min-w-[120px]">Closing Time</UITableHead>
                  <UITableHead sticky align="right" className="min-w-[130px]">Total Sales (₹)</UITableHead>
                  <UITableHead sticky align="right" className="min-w-[130px]">Total Cash (₹)</UITableHead>
                  <UITableHead sticky align="center" className="min-w-[90px]">Sessions</UITableHead>
                  <UITableHead sticky align="right" className="w-24">Actions</UITableHead>
                </UITableRow>
              </UITableHeader>
              <UITableBody>
                <UITableLoading rows={8} columns={9} />
              </UITableBody>
            </UITable>
          </div>
        </div>
      ) : businessDays.length === 0 ? (
        <div className="flex-1 min-h-0 bg-surface rounded-2xl border border-border p-8 shadow-2xs flex items-center justify-center">
          <UIEmptyState
            icon={<CalendarDays className="size-8 text-primary" />}
            title="No business days found"
            description={
              isFiltered
                ? "No business day sessions matched your filter criteria. Try clearing your filters."
                : "No business day sessions opened yet. Open a Business Day to start operations."
            }
            actionText={
              isFiltered
                ? "Clear Filters"
                : !hasOpenDay
                ? "Open Business Day"
                : undefined
            }
            onAction={
              isFiltered
                ? handleClearFilters
                : !hasOpenDay
                ? () => setIsOpenDialogOpen(true)
                : undefined
            }
            actionIcon={
              isFiltered
                ? undefined
                : !hasOpenDay
                ? <Plus className="size-4" />
                : undefined
            }
            variant="inline"
          />
        </div>
      ) : (
        <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
          <UITableScrollArea containerRef={tableContainerRef} className="divide-y divide-border/60">
            <UITable
              stickyHeader
              containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
              className="w-full text-xs font-sans"
            >
              {/* Sticky Table Header */}
              <UITableHeader sticky className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs">
                <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
                  <UITableHead sticky className="min-w-[130px]">Business Date</UITableHead>
                  <UITableHead sticky className="min-w-[170px]">Branch</UITableHead>
                  <UITableHead sticky align="center" className="min-w-[110px]">Status</UITableHead>
                  <UITableHead sticky className="min-w-[120px]">Opening Time</UITableHead>
                  <UITableHead sticky className="min-w-[120px]">Closing Time</UITableHead>
                  <UITableHead sticky align="right" className="min-w-[130px]">Total Sales (₹)</UITableHead>
                  <UITableHead sticky align="right" className="min-w-[130px]">Total Cash (₹)</UITableHead>
                  <UITableHead sticky align="center" className="min-w-[90px]">Sessions</UITableHead>
                  <UITableHead sticky align="right" className="w-24">Actions</UITableHead>
                </UITableRow>
              </UITableHeader>

              <UITableBody>
                {visibleDays.map((bd) => {
                  const dayDate = formatDate(bd.businessDate);
                  const branchName =
                    bd.branchName ||
                    bd.branch?.name ||
                    bd.branchId?.name ||
                    "Main Branch";
                  const openTime = formatTime(bd.actualOpenedAt || bd.createdAt);
                  const isDayOpen = bd.status === "open";
                  const isDayWithIssues =
                    bd.status === "with_issues" ||
                    bd.status === "cancelled" ||
                    bd.hasDiscrepancy;
                  const closeTime = isDayOpen
                    ? "-"
                    : formatTime(bd.actualClosedAt || bd.closedAt);

                  const totalSales = formatCurrencyNumber(
                    bd.totalSalesAmount ?? bd.summary?.totalSales ?? 0
                  );
                  const totalCash = formatCurrencyNumber(
                    bd.actualClosingCashAmount ??
                      bd.closingCash ??
                      bd.openingFloatAmount ??
                      0
                  );

                  const sessionsDisplay =
                    bd.sessionsRatio ||
                    `${bd.shifts?.filter((s) => s.status === "closed")?.length || 0} / ${
                      bd.shifts?.length || 1
                    }`;

                  return (
                    <UITableRow
                      key={bd._id}
                      onClick={() => handleOpenDialog?.(bd, "view")}
                      className="cursor-pointer hover:bg-surface-hover/70 transition-colors"
                    >
                      {/* Business Date */}
                      <UITableCell className="font-bold text-primary font-mono text-[13px] whitespace-nowrap">
                        {dayDate}
                      </UITableCell>

                      {/* Branch */}
                      <UITableCell className="text-text font-medium truncate">
                        {bd.branchId ? (
                          <BranchBadge branch={bd.branchId} />
                        ) : (
                          branchName
                        )}
                      </UITableCell>

                      {/* Status */}
                      <UITableCell align="center" className="whitespace-nowrap">
                        {isDayOpen ? (
                          <UIBadge variant="dot" color="success">
                            Open
                          </UIBadge>
                        ) : isDayWithIssues ? (
                          <UIBadge variant="dot" color="error">
                            With Issues
                          </UIBadge>
                        ) : (
                          <UIBadge variant="dot" color="neutral">
                            Closed
                          </UIBadge>
                        )}
                      </UITableCell>

                      {/* Opening Time */}
                      <UITableCell className="text-text-muted font-mono whitespace-nowrap text-xs">
                        {openTime}
                      </UITableCell>

                      {/* Closing Time */}
                      <UITableCell className="text-text-muted font-mono whitespace-nowrap text-xs">
                        {closeTime}
                      </UITableCell>

                      {/* Total Sales */}
                      <UITableCell align="right" className="font-mono font-bold text-text tabular-nums text-sm">
                        ₹{totalSales}
                      </UITableCell>

                      {/* Total Cash */}
                      <UITableCell align="right" className="font-mono font-semibold text-text tabular-nums text-xs">
                        ₹{totalCash}
                      </UITableCell>

                      {/* Sessions */}
                      <UITableCell align="center" className="font-mono font-medium text-text-muted text-xs">
                        {sessionsDisplay}
                      </UITableCell>

                      {/* Actions */}
                      <UITableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-left" data-actions-menu>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveMenuRowId((prev) => (prev === bd._id ? null : bd._id));
                            }}
                            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
                            title="More options"
                          >
                            <MoreVertical className="size-4" />
                          </button>

                          {activeMenuRowId === bd._id && (
                            <div className="absolute right-0 mt-1 w-44 rounded-xl border border-border bg-surface py-1.5 shadow-lg z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuRowId(null);
                                  handleOpenDialog?.(bd, "view");
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text hover:bg-surface-hover transition-colors text-left"
                              >
                                <Eye className="size-3.5 text-text-muted" />
                                <span>View Summary</span>
                              </button>

                              {isDayOpen && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuRowId(null);
                                    handleOpenDialog?.(bd, "close");
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-error hover:bg-error-soft transition-colors text-left font-medium"
                                >
                                  <LockKeyhole className="size-3.5" />
                                  <span>Close Business Day</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </UITableCell>
                    </UITableRow>
                  );
                })}
              </UITableBody>
            </UITable>

            {/* Infinite Scroll Trigger */}
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={false}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                !hasMore && businessDays.length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none">
                    ✓ All {businessDays.length} matching business days loaded
                  </span>
                ) : null
              }
            />
          </UITableScrollArea>
        </div>
      )}

      {/* ── Dialog Modals ────────────────────────────────────────────────────── */}
      <OpenBusinessDayDialog
        isOpen={isOpenDialogOpen}
        onClose={() => setIsOpenDialogOpen(false)}
      />
      <ViewBusinessDayDialog
        isOpen={dialogType === "view"}
        onClose={handleCloseDialog}
        businessDay={selectedDay}
        onRequestCloseDay={(day) => handleOpenDialog(day, "close")}
      />
      <CloseBusinessDayDialog
        isOpen={dialogType === "close"}
        onClose={handleCloseDialog}
        businessDay={selectedDay}
      />
    </div>
  );
};

export default BusinessDaysDesktopPage;
