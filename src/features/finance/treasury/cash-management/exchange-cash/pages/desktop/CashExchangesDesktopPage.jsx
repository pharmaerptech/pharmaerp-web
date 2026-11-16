import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  Repeat,
  Search,
  RefreshCw,
  RotateCcw,
  Plus,
  MoreVertical,
  Eye,
  Calendar,
  Banknote,
  Sparkles,
  Printer,
  ShieldCheck,
} from "lucide-react";
import dayjs from "dayjs";
import {
  UIButton,
  UIInput,
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
  PermissionGate,
  uiToast,
} from "@/components/ui";
import { usePermission } from "@/hooks";
import { BranchFilterSelect, BranchBadge } from "@/components/shared";
import { cn } from "@/lib/utils";

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const INITIAL_BATCH = 20;

const DENOM_BADGE_COLORS = {
  500: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  200: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  100: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  50:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  20:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  10:  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  5:   "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200 dark:border-pink-800",
  2:   "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  1:   "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
};

export const CashExchangesDesktopPage = ({
  cashExchanges = [],
  searchParams = {},
  isLoading = false,
  handleSearchChange,
  handleViewDetails,
  handleCreateNew,
  canCreateExchange = true,
  handleRefresh,
  isCompanyLevel = false,
  selectedBranchId = "all",
  setSelectedBranchId,
}) => {
  const { can } = usePermission();
  const tableContainerRef = useRef(null);

  // Client-side infinite scroll state
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter cash exchanges by search token
  const filteredExchanges = useMemo(() => {
    const list = Array.isArray(cashExchanges) ? cashExchanges : [];
    const searchToken = String(searchParams.search || "").trim().toLowerCase();

    if (!searchToken) return list;

    return list.filter((exchange) => {
      const exchangeNo = String(exchange.exchangeNumber || "").toLowerCase();
      const narration = String(exchange.narration || "").toLowerCase();
      const cashier = String(
        exchange.createdBy?.name ||
        exchange.createdBy?.fullName ||
        ""
      ).toLowerCase();

      return (
        exchangeNo.includes(searchToken) ||
        narration.includes(searchToken) ||
        cashier.includes(searchToken)
      );
    });
  }, [cashExchanges, searchParams.search]);

  // Sliced list for infinite scroll
  const displayedExchanges = useMemo(() => {
    return filteredExchanges.slice(0, visibleCount);
  }, [filteredExchanges, visibleCount]);

  const hasMore = visibleCount < filteredExchanges.length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 15, filteredExchanges.length));
      setIsLoadingMore(false);
    }, 200);
  }, [isLoadingMore, hasMore, filteredExchanges.length]);

  // Operational statistics (Running drawer only - no redundant cancelled/completed duplicates)
  const stats = useMemo(() => {
    const list = Array.isArray(cashExchanges) ? cashExchanges : [];
    const totalSwaps = list.length;
    let totalVolume = 0;
    let todayVolume = 0;
    let todayCount = 0;

    const todayStr = dayjs().format("YYYY-MM-DD");

    for (const item of list) {
      const amt = Number(item.totalReceived || 0);
      totalVolume += amt;

      const itemDateStr = dayjs(item.exchangeDate || item.createdAt).format("YYYY-MM-DD");
      if (itemDateStr === todayStr) {
        todayCount++;
        todayVolume += amt;
      }
    }

    const avgAmount = totalSwaps > 0 ? totalVolume / totalSwaps : 0;

    return {
      totalSwaps,
      totalVolume,
      todayVolume,
      todayCount,
      avgAmount,
    };
  }, [cashExchanges]);

  const hasActiveFilters = Boolean(
    searchParams.search && searchParams.search.trim()
  );

  const handleClearAllFilters = () => {
    handleSearchChange("");
    setVisibleCount(INITIAL_BATCH);
  };



  const renderDenomPills = (denominations = []) => {
    if (!denominations || denominations.length === 0) {
      return <span className="text-text-muted text-[11px]">—</span>;
    }

    const shown = denominations.slice(0, 3);
    const extra = denominations.length - 3;

    return (
      <div className="flex flex-wrap items-center gap-1">
        {shown.map((d, i) => {
          const denom = Number(d.denomination);
          const colorClass =
            DENOM_BADGE_COLORS[denom] ||
            "bg-surface-alt text-text border-border";

          return (
            <span
              key={i}
              className={cn(
                "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border",
                colorClass
              )}
            >
              <span>₹{denom}</span>
              <span className="opacity-75">×{d.quantity}</span>
            </span>
          );
        })}
        {extra > 0 && (
          <span className="text-[10px] font-bold font-mono px-1 py-0.5 rounded bg-surface-alt border border-border text-text-muted">
            +{extra}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* ── 1. Compact 4-Card Statistics Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Exchanges */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Repeat className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-blue-600 dark:text-blue-400 truncate flex items-center gap-1">
              <ShieldCheck className="size-3" />
              Total Exchanges
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalSwaps} Swaps
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              All settled & verified
            </div>
          </div>
        </div>

        {/* Card 2: Total Volume Swapped */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Banknote className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400 truncate">
              Volume Swapped
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              ₹{formatCurrency(stats.totalVolume)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Cumulative cash traded
            </div>
          </div>
        </div>

        {/* Card 3: Today's Exchanges */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Calendar className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-indigo-600 dark:text-indigo-400 truncate">
              Today's Exchanges
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.todayVolume)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {stats.todayCount} {stats.todayCount === 1 ? "swap" : "swaps"} settled today
            </div>
          </div>
        </div>

        {/* Card 4: Average Swap Value */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400 truncate">
              Average Swap Value
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums text-amber-600 dark:text-amber-400">
              ₹{formatCurrency(stats.avgAmount)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Per transaction average
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Table Filter Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Branch Filter (Company Level Only) */}
        {isCompanyLevel && (
          <div className="w-[180px] sm:w-[200px]">
            <BranchFilterSelect
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              size="md"
            />
          </div>
        )}

        {/* Search Input */}
        <div className="flex-1 min-w-[240px] sm:min-w-[280px]">
          <UIInput
            type="text"
            value={searchParams.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search exchange #, cashier, or narration..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange("")}
            className="w-full"
          />
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <UIButton
            type="button"
            variant="secondary"
            size="md"
            onClick={handleClearAllFilters}
            startIcon={<RotateCcw className="size-4 text-text-muted" />}
            className="h-10 px-3.5 shrink-0"
            title="Reset Filters"
          >
            Reset
          </UIButton>
        )}

        {/* Refresh Button */}
        <UIButton
          type="button"
          variant="secondary"
          size="md"
          disabled={isLoading}
          onClick={handleRefresh}
          startIcon={
            <RefreshCw
              className={cn("size-4 text-primary", isLoading && "animate-spin")}
            />
          }
          className="h-10 px-3.5 shrink-0"
          title="Refresh Cash Exchanges"
        >
          Refresh
        </UIButton>

        {/* Primary Action Button: New Cash Exchange Modal */}
        {canCreateExchange && (
          <PermissionGate permission="cash-exchange:create">
            <UIButton
              type="button"
              variant="primary"
              size="md"
              startIcon={<Plus className="size-4" />}
              onClick={handleCreateNew}
              className="h-10 px-4 font-bold shadow-xs shrink-0 cursor-pointer"
            >
              New Cash Exchange
            </UIButton>
          </PermissionGate>
        )}
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
            <UITableHeader>
              <UITableRow className="h-10 hover:bg-transparent border-b border-border bg-surface-alt/75 backdrop-blur-xs">
                <UITableHead className="w-[190px] font-bold text-xs">
                  Exchange # & Date
                </UITableHead>
                {isCompanyLevel && (
                  <UITableHead className="w-[140px] font-bold text-xs">
                    Branch
                  </UITableHead>
                )}
                <UITableHead className="w-[160px] font-bold text-xs">
                  Processed By
                </UITableHead>
                <UITableHead className="w-[220px] font-bold text-xs">
                  Received from Customer
                </UITableHead>
                <UITableHead className="w-[220px] font-bold text-xs">
                  Given to Customer
                </UITableHead>
                <UITableHead align="right" className="w-[150px] font-bold text-xs">
                  Swapped Total
                </UITableHead>
                <UITableHead align="right" className="w-[60px] font-bold text-xs">
                  Actions
                </UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading && displayedExchanges.length === 0 ? (
                <UITableLoading rows={7} columns={isCompanyLevel ? 7 : 6} />
              ) : displayedExchanges.length === 0 ? (
                <UITableEmpty
                  colSpan={isCompanyLevel ? 7 : 6}
                  title="No Cash Exchanges Found"
                  description={
                    hasActiveFilters
                      ? "No exchanges matched your selected filter criteria. Try adjusting your query."
                      : "No cash denomination exchanges have been performed yet."
                  }
                  action={
                    hasActiveFilters ? (
                      <UIButton
                        variant="secondary"
                        size="sm"
                        onClick={handleClearAllFilters}
                      >
                        Clear Filters
                      </UIButton>
                    ) : canCreateExchange ? (
                      <PermissionGate permission="cash-exchange:create">
                        <UIButton
                          variant="primary"
                          size="sm"
                          startIcon={<Plus className="size-4" />}
                          onClick={handleCreateNew}
                        >
                          Record First Cash Exchange
                        </UIButton>
                      </PermissionGate>
                    ) : null
                  }
                />
              ) : (
                displayedExchanges.map((exchange) => {

                  return (
                    <UITableRow
                      key={exchange._id || exchange.id}
                      onClick={() => handleViewDetails(exchange)}
                      className="group cursor-pointer transition-colors hover:bg-surface-hover/70 h-13 border-b border-border/60 last:border-b-0"
                    >
                      {/* 1. Exchange # & Date */}
                      <UITableCell className="py-2.5">
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono font-bold text-xs sm:text-sm text-text group-hover:text-primary transition-colors">
                            {exchange.exchangeNumber || "—"}
                          </span>
                          <span className="text-[11px] text-text-muted mt-0.5">
                            {dayjs(exchange.exchangeDate || exchange.createdAt).format(
                              "DD MMM YYYY, hh:mm A"
                            )}
                            {exchange.shiftId && (
                              <span className="text-text-muted/80 font-medium">
                                {" "}· {exchange.shiftId?.name || "Shift"}
                              </span>
                            )}
                          </span>
                        </div>
                      </UITableCell>

                      {/* Branch (Company Level) */}
                      {isCompanyLevel && (
                        <UITableCell className="py-2.5">
                          <BranchBadge branch={exchange.branchId} />
                        </UITableCell>
                      )}

                      {/* 2. Processed By */}
                      <UITableCell className="py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-text truncate">
                            {exchange.createdBy?.name ||
                              exchange.createdBy?.fullName ||
                              "Staff Cashier"}
                          </span>
                          <span className="text-[11px] text-text-muted truncate mt-0.5">
                            {exchange.createdBy?.role || "Authorized Staff"}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 4. Received From Customer */}
                      <UITableCell className="py-2">
                        <div className="flex flex-col min-w-0">
                          {renderDenomPills(exchange.denominationsReceived)}
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold mt-0.5">
                            ₹{formatCurrency(exchange.totalReceived)}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 5. Given To Customer */}
                      <UITableCell className="py-2">
                        <div className="flex flex-col min-w-0">
                          {renderDenomPills(exchange.denominationsGiven)}
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold mt-0.5">
                            ₹{formatCurrency(exchange.totalGiven)}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 6. Swapped Total */}
                      <UITableCell
                        align="right"
                        className="whitespace-nowrap font-mono tabular-nums text-xs py-2"
                      >
                        <span className="font-bold text-text text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                          ₹{formatCurrency(exchange.totalReceived)}
                        </span>
                        <div className="text-[10px] text-text-muted">
                          Net Zero Impact
                        </div>
                      </UITableCell>

                      {/* 6. Actions */}
                      <UITableCell
                        align="right"
                        className="py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                          <UIDropdownMenu align="end" className="w-44">
                            <UIDropdownItem
                              icon={<Eye className="size-4 text-text-muted shrink-0" />}
                              onClick={() => handleViewDetails(exchange)}
                            >
                              View Details
                            </UIDropdownItem>
                            <UIDropdownItem
                              icon={<Printer className="size-4 text-text-muted shrink-0" />}
                              onClick={() => {
                                handleViewDetails(exchange);
                                setTimeout(() => window.print(), 300);
                              }}
                            >
                              Print Receipt
                            </UIDropdownItem>
                          </UIDropdownMenu>
                        </UIDropdown>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {!isLoading && displayedExchanges.length > 0 && (
            <UIInfiniteScroll
              hasMore={hasMore}
              isLoading={isLoadingMore}
              onLoadMore={handleLoadMore}
              rootRef={tableContainerRef}
              threshold={0.8}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CashExchangesDesktopPage;
