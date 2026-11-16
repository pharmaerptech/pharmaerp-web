// src/features/operations/business-days/pages/mobile/BusinessDaysMobilePage.jsx

import React, { useState } from "react";
import {
  CalendarDays,
  Plus,
  LockKeyhole,
  Download,
  RotateCcw,
  Search,
  LayoutGrid,
  List,
  Clock,
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
import {
  BusinessDayTableView,
  BusinessDayCard,
  OpenBusinessDayDialog,
  ViewBusinessDayDialog,
  CloseBusinessDayDialog,
} from "../../components";
import { BranchFilterSelect } from "@/components/shared";
import { cn } from "@/lib/utils";

export const BusinessDaysMobilePage = ({
  businessDays = [],
  paginatedBusinessDays = [],
  stats = [],
  filters,
  sortBy,
  onSortChange,
  viewMode = VIEW_MODES.GRID,
  onViewModeChange,
  statusOptions = [],
  totalBusinessDays = 0,
  filteredBusinessDaysCount = 0,
  hasBusinessDays,
  hasFilteredBusinessDays,
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
  isOpenDialogOpen,
  setIsOpenDialogOpen,
  selectedDay,
  setSelectedDay,
  dialogType,
  setDialogType,
  handleOpenDialog,
  handleCloseDialog,
}) => {
  const navigate = useNavigate();
  const activeCount =
    stats.find((s) => s.id === "open")?.value ??
    businessDays.filter((d) => d.status === "open").length;
  const closedCount =
    stats.find((s) => s.id === "closed")?.value ??
    businessDays.filter((d) => d.status === "closed").length;

  const shouldShowPagination = hasFilteredBusinessDays && filteredBusinessDaysCount > pageSize;
  const displayList = paginatedBusinessDays.length ? paginatedBusinessDays : businessDays;

  const handleExportCSV = () => {
    if (!businessDays.length) return;
    const headers = [
      "Business Day No",
      "Business Date",
      "Opened At",
      "Opened By",
      "Shifts Count",
      "Opening Float",
      "Closing Cash",
      "Status",
    ];
    const rows = businessDays.map((bd) => [
      `"${bd.businessDayNo || ""}"`,
      `"${bd.businessDate ? new Date(bd.businessDate).toLocaleDateString() : ""}"`,
      `"${bd.actualOpenedAt ? new Date(bd.actualOpenedAt).toLocaleTimeString() : ""}"`,
      `"${bd.createdBy?.fullName || bd.createdBy?.name || ""}"`,
      `"${bd.shifts?.length || 0}"`,
      `"${bd.openingFloatAmount || 0}"`,
      `"${bd.actualClosingCashAmount || 0}"`,
      `"${bd.status || ""}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `business_days_mobile_export_${Date.now()}.csv`);
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
              <span className="font-mono tabular-nums">{totalBusinessDays}</span> Business Days
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

          {!openBusinessDay && (
            <UIButton
              type="button"
              variant="primary"
              size="sm"
              startIcon={<Plus className="size-3.5" />}
              onClick={() => setIsOpenDialogOpen(true)}
            >
              Open Day
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
            startIcon={<Clock className="size-3.5 text-text-muted" />}
            onClick={() => navigate("/operations/shifts")}
          >
            Shifts
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
              placeholder="Search business days..."
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
      {isLoading && !hasBusinessDays ? (
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
      ) : !hasBusinessDays ? (
        <div className="py-8 bg-surface rounded-2xl shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          <UIEmptyState
            icon={<CalendarDays className="size-8 text-primary" />}
            title="No business day sessions opened"
            description="Open a Business Day to manage daily branch operations."
            primaryAction={
              <UIButton
                variant="primary"
                size="sm"
                startIcon={<Plus className="size-3.5" />}
                onClick={() => setIsOpenDialogOpen(true)}
              >
                Open Day
              </UIButton>
            }
          />
        </div>
      ) : !hasFilteredBusinessDays ? (
        <div className="py-8 bg-surface rounded-2xl shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          <UIEmptyState
            icon={<Search className="size-8 text-text-muted" />}
            title="No matching business days"
            description="Try changing your search query or active date/status filter."
            primaryAction={
              <UIButton variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </UIButton>
            }
          />
        </div>
      ) : viewMode === VIEW_MODES.LIST ? (
        <BusinessDayTableView
          businessDays={displayList}
          onView={(day) => handleOpenDialog(day, "view")}
          onCloseDay={(day) => handleOpenDialog(day, "close")}
        />
      ) : (
        <div className="space-y-2.5">
          {displayList.map((bd) => (
            <BusinessDayCard
              key={bd._id}
              businessDay={bd}
              onView={(day) => handleOpenDialog(day, "view")}
              onCloseDay={(day) => handleOpenDialog(day, "close")}
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
            totalItems={filteredBusinessDaysCount}
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

export default BusinessDaysMobilePage;
