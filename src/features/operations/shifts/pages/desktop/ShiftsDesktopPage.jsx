// src/features/operations/shifts/pages/desktop/ShiftsDesktopPage.jsx

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Play,
  CheckCircle2,
  XCircle,
  Plus,
  RotateCcw,
  Download,
  Search,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  UIButton,
  UIInput,
  UIDatePicker,
  UISelect,
  UIEmptyState,
  UIAlert,
  UIInfiniteScroll,
  UITableLoading,
  UITableScrollArea,
} from "@/components/ui";

import {
  ShiftTableView,
  CreateShiftDialog,
  ViewShiftDialog,
  CloseShiftDialog,
} from "../../components";
import CloseBusinessDayDialog from "@/features/operations/business-days/components/CloseBusinessDayDialog";
import { BranchFilterSelect } from "@/components/shared";
import { cn } from "@/lib/utils";

const STATUS_SELECT_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
  { label: "Cancelled", value: "cancelled" },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "desc" },
  { label: "Oldest First", value: "asc" },
];

const INITIAL_BATCH = 20;

export const ShiftsDesktopPage = ({
  shifts = [],
  paginatedShifts,
  allShifts = [],
  stats: propStats,

  filters = {},
  sortBy = "desc",
  onSortChange,

  isLoading,
  hasError,
  error,
  message,

  handleFilterChange,
  handleSearchChange,
  handleClearFilters,
  handleRefresh,
  clearMessage,

  // Branch filter state (Company Level Only)
  isCompanyLevel,
  selectedBranchId,
  setSelectedBranchId,

  // Shift specific actions & dialog controls
  openBusinessDay,
  isCreateOpen,
  setIsCreateOpen,
  viewShift,
  setViewShift,
  closeShift,
  setCloseShift,
  isCloseBusinessDayOpen,
  setIsCloseBusinessDayOpen,
}) => {
  const navigate = useNavigate();
  const tableContainerRef = useRef(null);

  // Client-side Infinite Scroll state
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);

  const activeDataset = allShifts.length > 0 ? allShifts : shifts;
  const totalCount = activeDataset.length;
  const openCount = activeDataset.filter((s) => s.status === "open").length;
  const closedCount = activeDataset.filter((s) => s.status === "closed").length;
  const cancelledCount = activeDataset.filter((s) => s.status === "cancelled").length;

  const hasOpenShift = openCount > 0;

  // Reset infinite scroll batch when dataset or filters change
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [shifts.length, filters.date, filters.status, filters.search]);

  const visibleShifts = useMemo(() => {
    return shifts.slice(0, visibleCount);
  }, [shifts, visibleCount]);

  const hasMore = visibleCount < shifts.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + 20, shifts.length));
  }, [shifts.length]);

  const handleExportCSV = () => {
    const listToExport = shifts.length ? shifts : allShifts;
    if (!listToExport.length) return;
    const headers = [
      "Shift No",
      "Shift Name",
      "Business Date",
      "Opened At",
      "Closed At",
      "Cashier",
      "Opening Float",
      "Cash Sales",
      "Deposits",
      "Withdrawals",
      "Status",
    ];
    const rows = listToExport.map((s) => [
      `"${s.shiftNo || ""}"`,
      `"${s.shiftName || ""}"`,
      `"${s.businessDate || s.date ? new Date(s.businessDate || s.date).toLocaleDateString("en-GB") : ""}"`,
      `"${s.openedAt ? new Date(s.openedAt).toLocaleTimeString() : ""}"`,
      `"${s.closedAt ? new Date(s.closedAt).toLocaleTimeString() : ""}"`,
      `"${s.openedBy?.fullName || s.openedBy?.name || ""}"`,
      `"${s.openingFloatAmount || 0}"`,
      `"${s.cashSalesTotal || s.summary?.cashNet || s.actualClosingCashAmount || 0}"`,
      `"${Array.isArray(s.manualDeposits) ? s.manualDeposits.reduce((acc, d) => acc + (d.amount || 0), 0) : s.totalFundDeposits || 0}"`,
      `"${Array.isArray(s.manualWithdrawals) ? s.manualWithdrawals.reduce((acc, w) => acc + (w.amount || 0), 0) : s.totalFundWithdrawals || 0}"`,
      `"${s.status || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shifts_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        {/* Card 1: Total Shifts */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <Users className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total Shifts
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {totalCount}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              All cashier sessions
            </div>
          </div>
        </div>

        {/* Card 2: Open Shifts */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <Play className="size-4 fill-current" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              Open Shifts
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {openCount}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate mt-0.5">
              Currently active sessions
            </div>
          </div>
        </div>

        {/* Card 3: Closed Shifts */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-surface-alt text-text flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4.5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Closed Shifts
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {closedCount}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Reconciled & completed
            </div>
          </div>
        </div>

        {/* Card 4: Cancelled Shifts */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-error-soft text-error flex items-center justify-center shrink-0">
            <XCircle className="size-4.5 stroke-[2]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-error truncate">
              Cancelled Shifts
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {cancelledCount}
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono truncate mt-0.5">
              Unstarted or terminated
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Filter Toolbar ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Search Input */}
        <div className="w-[200px] sm:w-[240px] lg:w-[280px]">
          <UIInput
            type="text"
            value={filters.search || ""}
            onChange={(e) => handleSearchChange?.(e.target.value)}
            placeholder="Search shift #, name, or cashier..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange?.("")}
            className="w-full"
          />
        </div>

        {/* Branch Filter (Company Level Only) */}
        <BranchFilterSelect
          value={selectedBranchId}
          onChange={setSelectedBranchId}
          size="md"
          className="w-[180px] sm:w-[200px]"
        />

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
        <div className="w-[140px] sm:w-[150px]">
          <UISelect
            value={filters.status || "all"}
            onChange={(val) => handleFilterChange?.({ status: val })}
            options={STATUS_SELECT_OPTIONS}
            placeholder="Status"
            size="md"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="w-[140px] sm:w-[150px]">
          <UISelect
            value={sortBy || "desc"}
            onChange={(val) => onSortChange?.(val)}
            options={SORT_OPTIONS}
            placeholder="Sort by"
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
            title="Reset all filters"
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
            title="Refresh shifts"
          >
            <RefreshCw
              className={cn("size-4 text-text-muted hover:text-primary", isLoading && "animate-spin text-primary")}
            />
          </UIButton>

          {/* Export CSV */}
          <UIButton
            type="button"
            variant="outline"
            size="md"
            onClick={handleExportCSV}
            startIcon={<Download className="size-3.5" />}
            className="h-10 px-3 text-xs font-semibold hidden sm:inline-flex"
            title="Export shifts to CSV"
          >
            Export
          </UIButton>

          {/* New Shift Button (when no shift is currently open) */}
          {!hasOpenShift && (
            <UIButton
              type="button"
              variant="primary"
              size="md"
              startIcon={<Plus className="size-3.5" />}
              onClick={() => setIsCreateOpen?.(true)}
              className="h-10 px-3.5 text-xs font-semibold shadow-xs"
            >
              New Shift
            </UIButton>
          )}
        </div>
      </div>

      {/* ── 3. Main Data View (Table with Sticky Header) ────────── */}
      {isLoading && shifts.length === 0 ? (
        <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col">
          <div className="relative overflow-y-auto overflow-x-auto flex-1 min-h-0">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-alt/40 text-[13px] font-semibold text-text select-none">
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Shift Name</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap">Cashier</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-right">Opening Float</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-right">Cash Sales</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-right">Deposits</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-right">Withdrawals</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-right">Expected Cash</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-right">Actual Cash</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-center">Status</th>
                  <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                <UITableLoading rows={8} columns={11} />
              </tbody>
            </table>
          </div>
        </div>
      ) : shifts.length === 0 ? (
        <div className="flex-1 min-h-0 bg-surface rounded-2xl border border-border p-8 shadow-2xs flex items-center justify-center">
          <UIEmptyState
            icon={<Clock className="size-8 text-primary" />}
            title="No shifts found"
            description={
              isFiltered
                ? "No shift sessions matched your filter criteria. Try clearing your filters."
                : hasOpenShift
                ? "No additional shifts found. Close the active shift before opening a new one."
                : "No shift sessions opened yet. Open a New Shift to start cashier operations."
            }
            actionText={
              isFiltered
                ? "Clear Filters"
                : !hasOpenShift
                ? "New Shift"
                : undefined
            }
            onAction={
              isFiltered
                ? handleClearFilters
                : !hasOpenShift
                ? () => setIsCreateOpen?.(true)
                : undefined
            }
            actionIcon={!hasOpenShift ? <Plus className="size-4" /> : undefined}
            variant="inline"
          />
        </div>
      ) : (
        /* Table View Only */
        <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
          <UITableScrollArea containerRef={tableContainerRef} className="divide-y divide-border/60">
            <ShiftTableView
              shifts={visibleShifts}
              onView={setViewShift}
              onCloseShift={setCloseShift}
            />

            {/* Infinite Scroll Trigger */}
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={false}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                !hasMore && shifts.length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none">
                    ✓ All {shifts.length} matching shifts loaded
                  </span>
                ) : null
              }
            />
          </UITableScrollArea>
        </div>
      )}

      {/* ── Dialogs ──────────────────────────────────────────────────────────── */}
      <CreateShiftDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen?.(false)}
        openBusinessDay={openBusinessDay}
        onSuccess={handleRefresh}
      />

      <ViewShiftDialog
        isOpen={Boolean(viewShift)}
        shift={viewShift}
        onClose={() => setViewShift?.(null)}
      />

      <CloseShiftDialog
        isOpen={Boolean(closeShift)}
        shift={closeShift}
        onClose={() => setCloseShift?.(null)}
        onSuccess={handleRefresh}
        onOpenNewShift={() => setIsCreateOpen?.(true)}
        onCreateDayClosing={() => navigate("/operations/business-days")}
      />

      <CloseBusinessDayDialog
        isOpen={isCloseBusinessDayOpen}
        businessDay={openBusinessDay}
        onClose={() => setIsCloseBusinessDayOpen?.(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default ShiftsDesktopPage;
