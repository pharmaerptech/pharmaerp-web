// src/features/operations/shifts/pages/mobile/ShiftsMobilePage.jsx

import React, { useState } from "react";
import {
  Clock,
  Plus,
  Download,
  RotateCcw,
  Search,
  LayoutGrid,
  List,
  CalendarDays,
} from "lucide-react";
import {
  UISearchInput,
  UIButton,
  UIEmptyState,
  UISelect,
  UIPagination,
  UISkeleton,
  UI_TOOLBAR_VIEWS as VIEW_MODES,
  UIInput,
} from "@/components/ui";
import { useNavigate } from "react-router-dom";
import { ShiftTableView, ShiftCard, CreateShiftDialog, ViewShiftDialog, CloseShiftDialog } from "../../components";
import CloseBusinessDayDialog from "@/features/operations/business-days/components/CloseBusinessDayDialog";
import { BranchFilterSelect } from "@/components/shared";
import { cn } from "@/lib/utils";

export const ShiftsMobilePage = ({
  shifts = [],
  paginatedShifts = [],
  stats = [],
  filters,
  sortBy,
  onSortChange,
  viewMode = VIEW_MODES.GRID,
  onViewModeChange,
  statusOptions = [],
  totalShifts = 0,
  filteredShiftsCount = 0,
  hasShifts,
  hasFilteredShifts,
  isLoading,
  currentPage = 1,
  pageSize = 6,
  totalPages = 1,
  handlePageChange,
  handlePageSizeChange,
  handleFilterChange,
  handleSearchChange,
  handleRemoveFilter,
  handleClearFilters,
  handleRefresh,
  activeFilterChips = [],
  isCompanyLevel = false,
  selectedBranchId = "all",
  setSelectedBranchId,
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
  const activeCount =
    stats.find((s) => s.id === "open")?.value ??
    shifts.filter((s) => s.status === "open").length;
  const closedCount =
    stats.find((s) => s.id === "closed")?.value ??
    shifts.filter((s) => s.status === "closed").length;

  const shouldShowPagination = hasFilteredShifts && filteredShiftsCount > pageSize;
  const displayList = paginatedShifts.length ? paginatedShifts : shifts;
  const hasOpenShift = shifts.some((s) => s.status === "open");

  const handleExportCSV = () => {
    if (!shifts.length) return;
    const headers = [
      "Shift No",
      "Shift Name",
      "Date",
      "Opened At",
      "Closed At",
      "Opened By",
      "Opening Float",
      "Closing Cash",
      "Status",
    ];
    const rows = shifts.map((s) => [
      `"${s.shiftNo || ""}"`,
      `"${s.shiftName || ""}"`,
      `"${s.date ? new Date(s.date).toLocaleDateString() : ""}"`,
      `"${s.openedAt ? new Date(s.openedAt).toLocaleTimeString() : ""}"`,
      `"${s.closedAt ? new Date(s.closedAt).toLocaleTimeString() : ""}"`,
      `"${s.openedBy?.fullName || s.openedBy?.name || ""}"`,
      `"${s.openingFloatAmount || 0}"`,
      `"${s.actualClosingCashAmount || 0}"`,
      `"${s.status || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shifts_mobile_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full bg-bg text-text p-2.5 sm:p-3 pb-20 space-y-2.5 max-w-[480px] mx-auto">
      {/* Header Area */}
      <div className="flex flex-col gap-2 pt-0.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-text tracking-tight flex items-center gap-1.5">
              <span className="font-mono tabular-nums">{totalShifts}</span> Shifts
            </h1>
            <div className="flex items-center gap-3 text-xs font-semibold mt-0.5">
              <span className="inline-flex items-center gap-1 text-text">
                <span className="size-2 rounded-full bg-success ring-2 ring-success/20" />
                Open{" "}
                <strong className="font-mono tabular-nums text-text font-bold">
                  {activeCount}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1 text-text">
                <span className="size-2 rounded-full bg-neutral-400 ring-2 ring-neutral-400/20" />
                Closed{" "}
                <strong className="font-mono tabular-nums text-text font-bold">
                  {closedCount}
                </strong>
              </span>
            </div>
          </div>

          {!hasOpenShift && (
            <UIButton
              type="button"
              variant="primary"
              size="sm"
              startIcon={<Plus className="size-3.5" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Open Shift
            </UIButton>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <UIButton
            type="button"
            variant="outline"
            size="xs"
            fullWidth
            startIcon={
              <RotateCcw
                className={`size-3.5 text-text-muted ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            }
            onClick={handleRefresh}
          >
            Refresh
          </UIButton>

          <UIButton
            type="button"
            variant="outline"
            size="xs"
            fullWidth
            startIcon={<CalendarDays className="size-3.5 text-text-muted" />}
            onClick={() => navigate("/operations/business-days")}
          >
            Business Days
          </UIButton>

          <UIButton
            type="button"
            variant="outline"
            size="xs"
            fullWidth
            startIcon={<Download className="size-3.5 text-text-muted" />}
            onClick={handleExportCSV}
          >
            Export
          </UIButton>
        </div>
      </div>

      {/* Filter & View Switcher */}
      <div className="bg-surface border border-border/60 rounded-xl p-2.5 shadow-2xs space-y-2">
        {isCompanyLevel && (
          <BranchFilterSelect
            value={selectedBranchId}
            onChange={setSelectedBranchId}
            size="sm"
            className="w-full"
          />
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <UISearchInput
              placeholder="Search shifts..."
              value={filters.search}
              onChange={handleSearchChange}
              onClear={() => handleSearchChange("")}
              size="sm"
            />
          </div>

          <div className="flex items-center rounded-lg border border-border bg-surface-alt/75 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange?.(VIEW_MODES.GRID)}
              className={cn(
                "flex items-center justify-center p-1.5 rounded-md transition-all text-xs cursor-pointer",
                viewMode === VIEW_MODES.GRID
                  ? "bg-surface text-primary shadow-xs font-bold"
                  : "text-text-muted hover:text-text"
              )}
              title="Grid View"
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange?.(VIEW_MODES.LIST)}
              className={cn(
                "flex items-center justify-center p-1.5 rounded-md transition-all text-xs cursor-pointer",
                viewMode === VIEW_MODES.LIST
                  ? "bg-surface text-primary shadow-xs font-bold"
                  : "text-text-muted hover:text-text"
              )}
              title="List View"
            >
              <List className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <UIInput
            type="date"
            value={filters.date || ""}
            onChange={(e) => handleFilterChange({ date: e.target.value })}
            className="h-8 text-xs"
          />
          <UISelect
            value={filters.status}
            onChange={(val) => handleFilterChange({ status: val })}
            options={statusOptions}
            placeholder="All Status"
            size="sm"
          />
        </div>

        {activeFilterChips.length > 0 && (
          <div className="flex justify-end">
            <UIButton
              type="button"
              variant="ghost"
              size="xs"
              startIcon={<RotateCcw className="size-3 text-text-muted" />}
              onClick={handleClearFilters}
            >
              Reset Filters
            </UIButton>
          </div>
        )}
      </div>

      {/* Main Content Stream */}
      {isLoading && !hasShifts ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-surface rounded-2xl p-4 flex flex-col items-center space-y-2.5 shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
            >
              <UISkeleton className="size-16 rounded-[12px]" />
              <UISkeleton className="h-4 w-28 rounded" />
              <UISkeleton className="h-3 w-20 rounded" />
              <div className="w-full pt-2.5 border-t border-border/30 grid grid-cols-2 gap-2">
                <UISkeleton className="h-6 rounded" />
                <UISkeleton className="h-6 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : !hasShifts ? (
        <div className="py-8 bg-surface rounded-2xl shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          <UIEmptyState
            icon={<Clock className="size-8 text-primary" />}
            title="No shifts opened yet"
            description="Open a register shift to manage POS sessions."
            primaryAction={
              <UIButton
                variant="primary"
                size="sm"
                startIcon={<Plus className="size-3.5" />}
                onClick={() => setIsCreateOpen(true)}
              >
                Open Shift
              </UIButton>
            }
          />
        </div>
      ) : !hasFilteredShifts ? (
        <div className="py-8 bg-surface rounded-2xl shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          <UIEmptyState
            icon={<Search className="size-8 text-text-muted" />}
            title="No matching shifts"
            description="Try changing your search query or active date/status filter."
            primaryAction={
              <UIButton variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </UIButton>
            }
          />
        </div>
      ) : viewMode === VIEW_MODES.LIST ? (
        <ShiftTableView
          shifts={displayList}
          onView={setViewShift}
          onCloseShift={setCloseShift}
        />
      ) : (
        <div className="space-y-2.5">
          {displayList.map((shift) => (
            <ShiftCard
              key={shift._id}
              shift={shift}
              onView={setViewShift}
              onCloseShift={setCloseShift}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {shouldShowPagination && (
        <div className="bg-surface rounded-xl shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden">
          <UIPagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={filteredShiftsCount}
            pageSize={pageSize}
            pageSizeOptions={[6, 12, 24]}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            showSummary
            showPageSize={false}
          />
        </div>
      )}

      {/* Dialog Modals */}
      <CreateShiftDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <ViewShiftDialog isOpen={!!viewShift} onClose={() => setViewShift(null)} shift={viewShift} />
      <CloseShiftDialog
        isOpen={!!closeShift}
        onClose={() => setCloseShift(null)}
        shift={closeShift}
        onOpenNewShift={() => setIsCreateOpen(true)}
        onCreateDayClosing={() => navigate("/operations/business-days")}
      />
      <CloseBusinessDayDialog
        isOpen={isCloseBusinessDayOpen}
        onClose={() => setIsCloseBusinessDayOpen(false)}
        businessDay={openBusinessDay}
      />
    </div>
  );
};

export default ShiftsMobilePage;
