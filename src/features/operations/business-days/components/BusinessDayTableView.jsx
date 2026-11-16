// src/features/operations/business-days/components/BusinessDayTableView.jsx

import React from "react";
import {
  CalendarDays,
  Info,
  LockKeyhole,
} from "lucide-react";
import {
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  UIBadge,
  UIIconButton,
  UIButton,
} from "@/components/ui";
import { BranchBadge } from "@/components/shared";

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const BusinessDayTableView = ({
  businessDays = [],
  onView,
  onCloseDay,
}) => {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <UITable>
          <UITableHeader>
            <UITableRow className="bg-surface-alt/60">
              <UITableHead className="min-w-[180px]">Business Day</UITableHead>
              <UITableHead className="min-w-[140px]">Branch</UITableHead>
              <UITableHead className="min-w-[160px]">Business Date</UITableHead>
              <UITableHead className="min-w-[140px]">Opened At</UITableHead>
              <UITableHead className="min-w-[150px]">Opened By</UITableHead>
              <UITableHead className="min-w-[100px] text-center">Shifts</UITableHead>
              <UITableHead className="min-w-[120px] text-right">Opening Float</UITableHead>
              <UITableHead className="min-w-[140px] text-right">Closing Cash</UITableHead>
              <UITableHead className="min-w-[110px]">Status</UITableHead>
              <UITableHead className="w-28 text-right">Actions</UITableHead>
            </UITableRow>
          </UITableHeader>

          <UITableBody>
            {businessDays.map((bd) => {
              const dayNo = bd.businessDayNo || "Business Day";
              const formattedDate = formatDate(bd.businessDate);
              const openedTime = formatTime(bd.actualOpenedAt || bd.createdAt);
              const openedByStaff =
                bd.createdBy?.fullName ||
                bd.createdBy?.name ||
                bd.createdBy?.email ||
                "System";
              const shiftsCount = bd.shifts?.length || 0;
              const isOpen = bd.status === "open";
              const isClosing = bd.status === "closing";
              const isClosed = bd.status === "closed";

              return (
                <UITableRow
                  key={bd._id}
                  onClick={() => onView?.(bd)}
                  className={`cursor-pointer transition-colors ${
                    isOpen
                      ? "bg-emerald-500/[0.06] hover:bg-emerald-500/[0.1] border-l-4 border-l-emerald-500 font-medium"
                      : isClosing
                      ? "bg-amber-500/[0.08] hover:bg-amber-500/[0.12] border-l-4 border-l-amber-500 font-medium"
                      : "hover:bg-surface-hover/60"
                  }`}
                >
                  {/* Business Day No & Icon */}
                  <UITableCell>
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs uppercase border ${
                          isOpen
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 ring-2 ring-emerald-500/20"
                            : isClosing
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 ring-2 ring-amber-500/20"
                            : "bg-primary/10 text-primary border-primary/20"
                        }`}
                      >
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-text text-[13.5px] font-mono truncate">
                            {dayNo}
                          </p>
                          {isOpen && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              LIVE
                            </span>
                          )}
                          {isClosing && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                              CLOSING
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </UITableCell>

                  {/* Branch */}
                  <UITableCell>
                    <BranchBadge branch={bd.branchId} />
                  </UITableCell>

                  {/* Business Date */}
                  <UITableCell>
                    <p className="text-xs font-semibold text-text truncate">
                      {formattedDate}
                    </p>
                  </UITableCell>

                  {/* Opened At */}
                  <UITableCell>
                    <p className="text-xs font-mono text-text-muted truncate">
                      {openedTime}
                    </p>
                  </UITableCell>

                  {/* Opened By */}
                  <UITableCell>
                    <p className="text-xs font-semibold text-text truncate" title={openedByStaff}>
                      {openedByStaff}
                    </p>
                  </UITableCell>

                  {/* Shifts Count */}
                  <UITableCell className="text-center">
                    <UIBadge variant="soft" color={isOpen ? "success" : "primary"} className="text-xs font-bold font-mono">
                      {shiftsCount}
                    </UIBadge>
                  </UITableCell>

                  {/* Opening Float */}
                  <UITableCell className="text-right">
                    <p className="text-xs font-mono font-bold text-text tabular-nums">
                      {formatCurrency(bd.openingFloatAmount)}
                    </p>
                  </UITableCell>

                  {/* Closing Cash */}
                  <UITableCell className="text-right">
                    {isClosed ? (
                      <p className="text-xs font-mono font-bold text-primary tabular-nums">
                        {formatCurrency(bd.actualClosingCashAmount)}
                      </p>
                    ) : isClosing ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Closing In Progress
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Day
                      </span>
                    )}
                  </UITableCell>

                  {/* Status */}
                  <UITableCell>
                    {isClosing ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Closing
                      </span>
                    ) : (
                      <UIBadge
                        variant="soft"
                        color={isOpen ? "success" : isClosed ? "neutral" : "error"}
                        className={`text-xs capitalize font-bold ${
                          isOpen ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : ""
                        }`}
                      >
                        {bd.status || "open"}
                      </UIBadge>
                    )}
                  </UITableCell>

                  {/* Actions: Direct "i" Info button & Lock icon button */}
                  <UITableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5 shrink-0">
                      <UIIconButton
                        variant="ghost"
                        size="sm"
                        aria-label="View Business Day Details"
                        title="View Business Day Details"
                        onClick={() => onView?.(bd)}
                        className="h-8 w-8 text-text-muted hover:text-primary hover:bg-primary/10 shrink-0"
                      >
                        <Info className="h-4 w-4" />
                      </UIIconButton>

                      {(isOpen || isClosing) && (
                        <UIIconButton
                          variant="ghost"
                          size="sm"
                          aria-label={isClosing ? "Resume Closing Business Day" : "Start Closing Business Day"}
                          title={isClosing ? "Resume Closing Business Day" : "Start Closing Business Day"}
                          onClick={() => onCloseDay?.(bd)}
                          className={`h-8 w-8 rounded-lg shrink-0 transition-colors ${
                            isClosing
                              ? "text-amber-700 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40"
                              : "text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/30"
                          }`}
                        >
                          <LockKeyhole className="h-4 w-4" />
                        </UIIconButton>
                      )}
                    </div>
                  </UITableCell>
                </UITableRow>
              );
            })}
          </UITableBody>
        </UITable>
      </div>
    </div>
  );
};

export default BusinessDayTableView;
