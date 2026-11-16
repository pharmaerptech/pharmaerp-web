// src/features/operations/shifts/components/ShiftTableView.jsx

import React, { useState, useEffect } from "react";
import { Eye, LockKeyhole, MoreVertical } from "lucide-react";
import { BranchBadge } from "@/components/shared";
import { useBranchFilter } from "@/hooks";

const formatDate = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTimeRange = (openedAt, closedAt, isShiftOpen) => {
  if (!openedAt) return "-";
  const dOpen = new Date(openedAt);
  const openStr = Number.isNaN(dOpen.getTime())
    ? "-"
    : dOpen.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

  if (isShiftOpen || !closedAt) {
    return `${openStr} → Open`;
  }

  const dClose = new Date(closedAt);
  const closeStr = Number.isNaN(dClose.getTime())
    ? "-"
    : dClose.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

  return `${openStr} – ${closeStr}`;
};

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "₹ 0.00";
  return `₹ ${Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getInitials = (name) => {
  if (!name) return "US";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColorClass = (name = "") => {
  const colors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getShiftTitle = (shift) => {
  if (shift?.shiftName) return shift.shiftName;
  const hour = new Date(shift?.openedAt || shift?.createdAt || Date.now()).getHours();
  if (hour >= 5 && hour < 12) return "Morning Shift";
  if (hour >= 12 && hour < 17) return "Afternoon Shift";
  if (hour >= 17 && hour < 21) return "Evening Shift";
  return "Night Shift";
};

export const ShiftTableView = ({
  shifts = [],
  onView,
  onCloseShift,
}) => {
  const { isCompanyLevel } = useBranchFilter();
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);

  // Close actions dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-actions-menu]")) {
        setActiveMenuRowId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-alt/40 text-[13px] font-semibold text-text select-none">
            <th className="py-3.5 px-4 font-semibold whitespace-nowrap">
              Shift Name
            </th>
            {isCompanyLevel && (
              <th className="py-3.5 px-4 font-semibold whitespace-nowrap">
                Branch
              </th>
            )}
            <th className="py-3.5 px-4 font-semibold whitespace-nowrap">
              Date & Time
            </th>
            <th className="py-3.5 px-4 font-semibold whitespace-nowrap">
              Cashier
            </th>
            <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-right">
              Opening Float
            </th>
            <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-right">
              Cash Sales
            </th>
            <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-right">
              Deposits
            </th>
            <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-right">
              Withdrawals
            </th>
            <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-right">
              Expected Cash
            </th>
            <th className="py-3.5 px-4 font-semibold whitespace-nowrap text-right">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border/60">
          {shifts.map((shift, idx) => {
            const shiftName = getShiftTitle(shift);
            const isShiftOpen = shift.status === "open";
            const isShiftClosing = shift.status === "closing";

            const businessDateStr = formatDate(
              shift.businessDate || shift.date || shift.openedAt
            );
            const timeRangeStr = formatTimeRange(
              shift.openedAt || shift.createdAt,
              shift.closedAt,
              isShiftOpen
            );

            const cashierName =
              shift.openedBy?.fullName ||
              shift.openedBy?.name ||
              shift.openedBy?.email ||
              "Cashier";
            const cashierInitials = getInitials(cashierName);
            const avatarColor = getAvatarColorClass(cashierName);

            const openingFloatAmount = Number(shift.openingFloatAmount) || 0;
            const openingFloat = formatCurrency(openingFloatAmount);

            const cashSalesAmount =
              Number(
                shift.cashSalesTotal ??
                shift.summary?.cashNet ??
                shift.cashSales ??
                shift.actualClosingCashAmount ??
                0
              ) || 0;
            const cashSales = formatCurrency(cashSalesAmount);

            const depositsAmount =
              Array.isArray(shift.manualDeposits) && shift.manualDeposits.length > 0
                ? shift.manualDeposits.reduce((acc, d) => acc + (Number(d.amount) || 0), 0)
                : Number(shift.totalFundDeposits) || 0;
            const deposits = formatCurrency(depositsAmount);

            const withdrawalsAmount =
              Array.isArray(shift.manualWithdrawals) && shift.manualWithdrawals.length > 0
                ? shift.manualWithdrawals.reduce((acc, w) => acc + (Number(w.amount) || 0), 0)
                : Number(shift.totalFundWithdrawals) || 0;
            const withdrawals = formatCurrency(withdrawalsAmount);

            const advanceCashAmount = Number(shift.advanceCashTotal || 0);
            const creditCashAmount = Number(shift.creditCashTotal || 0);
            const totalAdvanceIn = Number((shift.advanceCashTotal || 0) + (shift.advanceUpiTotal || 0));
            const advanceBillsCount = Number(shift.advanceInvoiceCount || 0);
            const advanceSalesAmount = Number(shift.advanceSalesTotal || 0);

            const expectedCashAmount =
              shift.expectedClosingCashAmount !== undefined &&
              shift.expectedClosingCashAmount !== null &&
              shift.expectedClosingCashAmount > 0
                ? Number(shift.expectedClosingCashAmount)
                : openingFloatAmount + cashSalesAmount + advanceCashAmount + creditCashAmount + depositsAmount - withdrawalsAmount;
            const expectedCash = formatCurrency(expectedCashAmount);

            return (
              <tr
                key={shift._id || idx}
                onClick={() => onView?.(shift)}
                className={`transition-colors cursor-pointer text-text ${
                  isShiftOpen
                    ? "bg-emerald-500/[0.08] hover:bg-emerald-500/[0.14] dark:bg-emerald-500/[0.12] dark:hover:bg-emerald-500/[0.18] border-l-4 border-l-emerald-500 font-medium"
                    : isShiftClosing
                    ? "bg-amber-500/[0.08] hover:bg-amber-500/[0.14] dark:bg-amber-500/[0.12] dark:hover:bg-amber-500/[0.18] border-l-4 border-l-amber-500 font-medium"
                    : "hover:bg-surface-hover/70"
                }`}
              >
                {/* Column 1: Shift Name (with pulsing Open tag if open) */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text">
                      {shiftName}
                    </span>
                    {isShiftOpen && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        OPEN
                      </span>
                    )}
                    {isShiftClosing && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
                        CLOSING
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {shift.shiftNo && (
                      <span className="font-mono text-[11px] text-text-muted">
                        {shift.shiftNo}
                      </span>
                    )}
                    {totalAdvanceIn > 0 && (
                      <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                        Adv In: {formatCurrency(totalAdvanceIn)}
                      </span>
                    )}
                    {advanceBillsCount > 0 && (
                      <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded">
                        Adv Used: {advanceBillsCount} bills ({formatCurrency(advanceSalesAmount)})
                      </span>
                    )}
                  </div>
                </td>

                {/* Branch Badge (Company Level Only) */}
                {isCompanyLevel && (
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <BranchBadge branch={shift.branchId} />
                  </td>
                )}

                {/* Column 2: Date & Time (Line 1: Date, Line 2: Time range on single line) */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="text-xs leading-tight">
                    <div className="font-semibold text-text">{businessDateStr}</div>
                    <div className="text-text-muted mt-1 font-mono text-[11.5px]">
                      {timeRangeStr}
                    </div>
                  </div>
                </td>

                {/* Column 3: Cashier (Avatar initials + Name) */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`size-7 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${avatarColor}`}
                    >
                      {cashierInitials}
                    </div>
                    <span className="text-sm font-medium text-text">
                      {cashierName}
                    </span>
                  </div>
                </td>

                {/* Column 4: Opening Float */}
                <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap text-text font-medium">
                  {openingFloat}
                </td>

                {/* Column 5: Cash Sales */}
                <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap text-text font-medium">
                  {cashSales}
                </td>

                {/* Column 6: Deposits */}
                <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap text-text font-medium">
                  {deposits}
                </td>

                {/* Column 7: Withdrawals */}
                <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap text-text font-medium">
                  {withdrawals}
                </td>

                {/* Column 8: Expected Cash */}
                <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap text-text font-semibold">
                  {expectedCash}
                </td>

                {/* Column 9: Actions */}
                <td
                  className="py-3.5 px-4 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="inline-flex items-center justify-end gap-1">
                    {/* View Details Eye Icon Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onView?.(shift);
                      }}
                      className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
                      title="View Details"
                      aria-label="View Details"
                    >
                      <Eye className="size-4" />
                    </button>

                    {/* Lock Shift Icon Button (if open or closing) */}
                    {(isShiftOpen || isShiftClosing) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onCloseShift?.(shift);
                        }}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          isShiftClosing
                            ? "text-amber-600 hover:text-amber-700 bg-amber-500/15"
                            : "text-warning hover:text-warning-hover hover:bg-warning-soft"
                        }`}
                        title={isShiftClosing ? "Resume Closing" : "Start Closing"}
                        aria-label={isShiftClosing ? "Resume Closing" : "Start Closing"}
                      >
                        <LockKeyhole className="size-4" />
                      </button>
                    )}

                    {/* 3 Dots Menu Button */}
                    <div className="relative inline-block" data-actions-menu>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveMenuRowId((prev) =>
                            prev === (shift._id || idx) ? null : (shift._id || idx)
                          );
                        }}
                        className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
                        title="More options"
                        aria-label="More options"
                      >
                        <MoreVertical className="size-4" />
                      </button>

                      {activeMenuRowId === (shift._id || idx) && (
                        <div
                          className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border rounded-lg shadow-lg py-1 z-30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveMenuRowId(null);
                              onView?.(shift);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-text hover:bg-surface-hover flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Eye className="size-3.5 text-text-muted" />
                            <span>View Details</span>
                          </button>

                          {(isShiftOpen || isShiftClosing) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveMenuRowId(null);
                                onCloseShift?.(shift);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-medium text-warning hover:bg-warning-soft flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <LockKeyhole className="size-3.5" />
                              <span>{isShiftClosing ? "Resume Closing" : "Start Closing"}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ShiftTableView;
