// src/features/reports/components/ReportDataTable.jsx

import React from "react";
import {
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
  UIBadge,
  UIButton,
} from "@/components/ui";
import { cn } from "@/lib/utils";

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

export const ReportDataTable = ({
  columns = [],
  rows = [],
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  total = 0,
  onLoadMore,
  tableContainerRef,
  onResetFilters,
}) => {
  const renderCellContent = (col, row) => {
    const val = row[col.id];

    if (col.type === "currency") {
      return (
        <span
          className={cn(
            "font-mono tabular-nums font-semibold text-xs",
            col.highlight ? "font-bold text-text text-sm" : "text-text"
          )}
        >
          ₹{formatCurrency(val)}
        </span>
      );
    }

    if (col.type === "number") {
      return (
        <span
          className={cn(
            "font-mono tabular-nums font-semibold text-xs",
            col.highlight ? "font-bold text-primary" : "text-text"
          )}
        >
          {Number(val || 0).toLocaleString("en-IN")}
        </span>
      );
    }

    if (col.type === "percent") {
      return (
        <span className="font-mono tabular-nums text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {(val || 0).toFixed(1)}%
        </span>
      );
    }

    if (col.type === "date") {
      return (
        <div className="flex flex-col text-xs">
          <span className="font-medium text-text">{formatDate(val)}</span>
          <span className="text-[10px] font-mono text-text-muted/70">{formatTime(val)}</span>
        </div>
      );
    }

    if (col.type === "badge") {
      const str = String(val || "").toUpperCase();
      let color = "neutral";
      if (str === "PAID" || str === "SETTLED" || str === "APPROVED" || str === "CASH") color = "success";
      else if (str === "UPI" || str === "SPLIT") color = "info";
      else if (str === "PENDING" || str === "CREDIT" || str === "SCHEDULE H") color = "warning";
      else if (str === "CANCELLED" || str === "OVERDUE" || str === "SCHEDULE H1") color = "error";

      return (
        <UIBadge variant="soft" color={color} className="font-bold text-[10.5px] px-2 py-0.5">
          {val || "—"}
        </UIBadge>
      );
    }

    if (col.type === "daysBadge") {
      const days = Number(val || 0);
      let color = "info";
      if (days <= 30) color = "error";
      else if (days <= 60) color = "warning";

      return (
        <UIBadge variant="soft" color={color} className="font-bold text-[10.5px] px-2 py-0.5 font-mono">
          {days <= 0 ? "EXPIRED" : `${days} Days`}
        </UIBadge>
      );
    }

    if (col.type === "agingBadge") {
      const str = String(val || "");
      let color = "neutral";
      if (str.includes("0-15")) color = "info";
      else if (str.includes("16-30")) color = "warning";
      else if (str.includes("> 60") || str.includes("Critical")) color = "error";

      return (
        <UIBadge variant="soft" color={color} className="font-semibold text-[10px] px-1.5 py-0.5">
          {str}
        </UIBadge>
      );
    }

    if (col.type === "varianceBadge") {
      const diff = Number(val || 0);
      if (diff === 0) {
        return (
          <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
            ₹0.00 (Balanced)
          </span>
        );
      }
      return (
        <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
          {diff > 0 ? `+₹${formatCurrency(diff)} Over` : `-₹${formatCurrency(Math.abs(diff))} Short`}
        </span>
      );
    }

    if (col.type === "stockBadge") {
      const stock = Number(val || 0);
      return (
        <span
          className={cn(
            "font-mono text-xs font-bold px-2 py-0.5 rounded-md",
            stock <= 0
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          )}
        >
          {stock} Units
        </span>
      );
    }

    return (
      <span className={cn("text-xs text-text truncate block", col.highlight && "font-semibold")}>
        {val !== undefined && val !== null ? String(val) : "—"}
      </span>
    );
  };

  return (
    <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
      <UITableScrollArea containerRef={tableContainerRef} className="divide-y divide-border/60">
        <UITable
          stickyHeader
          containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
          className="w-full"
        >
          {/* Sticky Header */}
          <UITableHeader
            sticky
            className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs"
          >
            <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
              {columns.map((col) => (
                <UITableHead
                  key={col.id}
                  sticky
                  align={col.align || "left"}
                  className={cn(col.width || "min-w-[120px]")}
                >
                  {col.label}
                </UITableHead>
              ))}
            </UITableRow>
          </UITableHeader>

          {/* Table Body */}
          <UITableBody>
            {isLoading ? (
              <UITableLoading colSpan={columns.length} rows={8} />
            ) : rows.length === 0 ? (
              <UITableEmpty
                colSpan={columns.length}
                title="No records found in this report"
                description="Try broadening your date range or clearing search filters to see records."
                action={
                  onResetFilters ? (
                    <UIButton variant="secondary" size="sm" onClick={onResetFilters}>
                      Reset Filters
                    </UIButton>
                  ) : undefined
                }
              />
            ) : (
              rows.map((row, idx) => (
                <UITableRow
                  key={row._id || `report-row-${idx}`}
                  className="transition-colors hover:bg-surface-hover/70"
                >
                  {columns.map((col) => (
                    <UITableCell
                      key={col.id}
                      align={col.align || "left"}
                      className={cn("whitespace-nowrap py-2.5", col.width)}
                    >
                      {renderCellContent(col, row)}
                    </UITableCell>
                  ))}
                </UITableRow>
              ))
            )}
          </UITableBody>
        </UITable>

        {/* Infinite Scroll */}
        {!isLoading && rows.length > 0 && (
          <UIInfiniteScroll
            onLoadMore={onLoadMore}
            hasMore={hasMore}
            isLoading={isLoadingMore}
            rootRef={tableContainerRef}
            rootMargin="160px"
            endMessage={
              !hasMore && rows.length > 0 ? (
                <span className="font-mono text-[11px] text-text-muted select-none py-2 block text-center">
                  ✓ All {total} records loaded
                </span>
              ) : null
            }
          />
        )}
      </UITableScrollArea>
    </div>
  );
};

export default ReportDataTable;
