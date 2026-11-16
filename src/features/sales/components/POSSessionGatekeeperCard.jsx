// src/features/sales/components/POSSessionGatekeeperCard.jsx

import React from "react";
import { Calendar, Play, X, Lock, Unlock, Clock, RotateCw, AlertTriangle } from "lucide-react";

const formatDayDate = (d) => {
  if (!d) return "—";
  const dateObj = new Date(d);
  if (Number.isNaN(dateObj.getTime())) return String(d);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString("en-GB", { month: "long" });
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * POSSessionGatekeeperCard
 * Displays the required pre-requisite gate card on POS Billing:
 * - Screen 1: "Business Day is Not Open" when no business day is active
 * - Screen 2: "No Active Shift" when business day is active but cashier shift is closed
 * - Screen 3: "Shift Closing in Progress" when shift closing has been initiated on another device
 * - Screen 4: "Business Day Closing in Progress" when day closing has been initiated
 */
export const POSSessionGatekeeperCard = ({
  isDayOpen = false,
  isDayClosing = false,
  isShiftClosing = false,
  activeShift = null,
  openBusinessDay = null,
  currentBranch = null,
  onOpenBusinessDay,
  onStartShift,
  onRefresh,
  onResumeClosing,
  onAbortClosing,
  onResumeBusinessDayClosing,
  onAbortBusinessDayClosing,
}) => {
  const branchName =
    currentBranch?.name ||
    openBusinessDay?.branch?.name ||
    openBusinessDay?.branchName ||
    "Main Branch";

  const businessDateFormatted = formatDayDate(
    openBusinessDay?.businessDate || new Date()
  );

  const closingInitiatorName =
    activeShift?.closingInitiatedBy?.fullName ||
    activeShift?.closingInitiatedBy?.firstName ||
    activeShift?.closingInitiatedBy?.name ||
    openBusinessDay?.closingInitiatedBy?.fullName ||
    "Staff / Manager";

  const closingTimeFormatted = activeShift?.closingInitiatedAt
    ? new Date(activeShift.closingInitiatedAt).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })
    : null;

  return (
    <div className="w-full max-w-[430px] bg-surface rounded-[28px] border border-border shadow-[var(--app-shadow-xl)] p-7 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200 select-none">
      {/* ══════════ SCREEN 4: BUSINESS DAY CLOSING IN PROGRESS ══════════ */}
      {isDayClosing ? (
        <>
          <div className="relative w-36 h-28 mx-auto flex items-center justify-center">
            <svg
              viewBox="0 0 150 100"
              className="absolute inset-0 w-full h-full text-amber-500/10 dark:text-amber-400/15"
              fill="currentColor"
            >
              <path d="M 35 70 C 18 70 12 56 18 44 C 24 32 36 30 44 34 C 50 18 68 12 84 18 C 100 24 104 38 102 48 C 114 46 128 54 130 66 C 132 78 122 86 110 86 L 40 86 C 26 86 24 70 35 70 Z" />
            </svg>
            <div className="relative z-10">
              <div className="w-16 h-14 rounded-xl border-2 border-amber-500/40 dark:border-amber-400/50 bg-surface shadow-xs overflow-hidden flex flex-col items-center justify-center">
                <div className="bg-amber-500 h-4 w-full flex items-center justify-around px-2.5 relative shrink-0">
                  <div className="w-1.5 h-2 bg-surface rounded-full -mt-1 shadow-2xs" />
                  <div className="w-1.5 h-2 bg-surface rounded-full -mt-1 shadow-2xs" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <Lock className="size-5 text-amber-500" />
                </div>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 size-6 rounded-full bg-amber-500 text-white flex items-center justify-center ring-2 ring-surface shadow-xs">
                <Clock className="size-3.5 stroke-[2.5] animate-spin" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-[21px] font-bold text-text tracking-tight">
              Business Day Closing in Progress
            </h2>
            <p className="text-[13px] text-text-muted leading-relaxed max-w-[310px] mx-auto">
              Business Day is currently being audited and reconciled. Billing, sales, and shift creation are temporarily locked on all devices.
            </p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-3 text-left">
            <div className="size-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs border border-amber-500/30 mt-0.5">
              <AlertTriangle className="size-4 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[12.5px] text-text">
                  Business Date: {businessDateFormatted}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Closing
                </span>
              </div>
              <div className="text-[11.5px] text-text-muted mt-0.5 truncate">
                Branch: {branchName}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {onResumeBusinessDayClosing && (
              <button
                type="button"
                onClick={onResumeBusinessDayClosing}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Lock className="size-4 stroke-[2]" />
                <span>Resume Closing</span>
              </button>
            )}
            {onAbortBusinessDayClosing && (
              <button
                type="button"
                onClick={onAbortBusinessDayClosing}
                className="w-full py-3 px-4 rounded-xl bg-surface-alt hover:bg-surface-hover active:scale-[0.99] text-text font-bold text-sm border border-border shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Unlock className="size-4 stroke-[2] text-amber-600 dark:text-amber-400" />
                <span>Unlock Session (Abort Closing)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onRefresh}
              className="w-full py-2.5 px-3 rounded-lg text-text-muted hover:text-text font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCw className="size-3.5 stroke-[2]" />
              <span>Check Status & Refresh</span>
            </button>
          </div>
        </>
      ) : !isDayOpen ? (
        /* ══════════ SCREEN 1: WHEN BUSINESS DAY IS CLOSED ══════════ */
        <>
          <div className="relative w-36 h-28 mx-auto flex items-center justify-center">
            <svg
              viewBox="0 0 150 100"
              className="absolute inset-0 w-full h-full text-rose-500/10 dark:text-rose-400/15"
              fill="currentColor"
            >
              <path d="M 35 70 C 18 70 12 56 18 44 C 24 32 36 30 44 34 C 50 18 68 12 84 18 C 100 24 104 38 102 48 C 114 46 128 54 130 66 C 132 78 122 86 110 86 L 40 86 C 26 86 24 70 35 70 Z" />
            </svg>

            <div className="relative z-10">
              <div className="w-16 h-14 rounded-xl border-2 border-rose-500/40 dark:border-rose-400/50 bg-surface shadow-xs overflow-hidden flex flex-col">
                <div className="bg-rose-500 h-4 w-full flex items-center justify-around px-2.5 relative shrink-0">
                  <div className="w-1.5 h-2 bg-surface rounded-full -mt-1 shadow-2xs" />
                  <div className="w-1.5 h-2 bg-surface rounded-full -mt-1 shadow-2xs" />
                </div>
                <div className="flex-1 p-1.5 grid grid-cols-3 gap-1.5 items-center justify-center">
                  <div className="size-2 rounded-xs bg-rose-500/25 dark:bg-rose-400/30" />
                  <div className="size-2 rounded-xs bg-rose-500/25 dark:bg-rose-400/30" />
                  <div className="size-2 rounded-xs bg-rose-500/25 dark:bg-rose-400/30" />
                  <div className="size-2 rounded-xs bg-rose-500/25 dark:bg-rose-400/30" />
                  <div className="size-2 rounded-xs bg-rose-500/25 dark:bg-rose-400/30" />
                  <div className="size-2 rounded-xs bg-rose-500/25 dark:bg-rose-400/30" />
                </div>
              </div>

              <div className="absolute -bottom-1.5 -right-1.5 size-6 rounded-full bg-rose-500 text-white flex items-center justify-center ring-2 ring-surface shadow-xs">
                <X className="size-3.5 stroke-[3]" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-[21px] font-bold text-text tracking-tight">
              Business Day is Not Open
            </h2>
            <p className="text-[13px] text-text-muted leading-relaxed max-w-[280px] mx-auto">
              You need to open a business day before you can start making sales.
            </p>
          </div>

          <div className="bg-surface-alt border border-border rounded-2xl p-3.5 flex items-start gap-3 text-left">
            <div className="size-8 rounded-xl bg-surface text-primary flex items-center justify-center shrink-0 shadow-2xs border border-border mt-0.5">
              <Calendar className="size-4 stroke-[2]" />
            </div>
            <p className="text-[12.5px] text-text leading-snug">
              A business day must be opened first to record all transactions, deposits, and withdrawals for the day.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenBusinessDay}
            className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.99] text-primary-contrast font-bold text-sm shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Calendar className="size-4 stroke-[2]" />
            <span>Open Business Day</span>
          </button>
        </>
      ) : isShiftClosing ? (
        /* ══════════ SCREEN 3: SHIFT CLOSING IN PROGRESS ══════════ */
        <>
          <div className="relative w-36 h-28 mx-auto flex items-center justify-center">
            <svg
              viewBox="0 0 150 100"
              className="absolute inset-0 w-full h-full text-amber-500/10 dark:text-amber-400/15"
              fill="currentColor"
            >
              <path d="M 35 70 C 18 70 12 56 18 44 C 24 32 36 30 44 34 C 50 18 68 12 84 18 C 100 24 104 38 102 48 C 114 46 128 54 130 66 C 132 78 122 86 110 86 L 40 86 C 26 86 24 70 35 70 Z" />
            </svg>

            <div className="relative z-10">
              <div className="size-14 rounded-full border-3 border-amber-500/50 dark:border-amber-400/60 bg-surface shadow-xs flex items-center justify-center relative">
                <Lock className="size-6 text-amber-500 stroke-[2.2]" />
              </div>
              <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-amber-500 text-white flex items-center justify-center ring-2 ring-surface shadow-xs">
                <Clock className="size-3.5 stroke-[2.5]" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-[21px] font-bold text-text tracking-tight">
              Shift Closing in Progress
            </h2>
            <p className="text-[13px] text-text-muted leading-relaxed max-w-[320px] mx-auto">
              Shift #{activeShift?.shiftNo || activeShift?.shiftNumber || "1"} is currently being reconciled and closed by {closingInitiatorName}. Billing is locked on all devices.
            </p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-3 text-left">
            <div className="size-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs border border-amber-500/30 mt-0.5">
              <Clock className="size-4 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[12.5px] text-text">
                  Shift #{activeShift?.shiftNo || activeShift?.shiftNumber || "1"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Closing Initiated {closingTimeFormatted ? `at ${closingTimeFormatted}` : ""}
                </span>
              </div>
              <div className="text-[11.5px] text-text-muted mt-0.5 truncate">
                Initiated by: {closingInitiatorName} • Branch: {branchName}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {onResumeClosing && (
              <button
                type="button"
                onClick={onResumeClosing}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Lock className="size-4 stroke-[2]" />
                <span>Resume Closing</span>
              </button>
            )}
            {onAbortClosing && (
              <button
                type="button"
                onClick={onAbortClosing}
                className="w-full py-3 px-4 rounded-xl bg-surface-alt hover:bg-surface-hover active:scale-[0.99] text-text font-bold text-sm border border-border shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Unlock className="size-4 stroke-[2] text-amber-600 dark:text-amber-400" />
                <span>Unlock Session (Abort Closing)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onRefresh}
              className="w-full py-2.5 px-3 rounded-lg text-text-muted hover:text-text font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCw className="size-3.5 stroke-[2]" />
              <span>Check Status & Refresh</span>
            </button>
          </div>
        </>
      ) : (
        /* ══════════ SCREEN 2: WHEN DAY IS OPEN BUT SHIFT IS CLOSED ══════════ */
        <>
          <div className="relative w-36 h-28 mx-auto flex items-center justify-center">
            <svg
              viewBox="0 0 150 100"
              className="absolute inset-0 w-full h-full text-amber-500/10 dark:text-amber-400/15"
              fill="currentColor"
            >
              <path d="M 35 70 C 18 70 12 56 18 44 C 24 32 36 30 44 34 C 50 18 68 12 84 18 C 100 24 104 38 102 48 C 114 46 128 54 130 66 C 132 78 122 86 110 86 L 40 86 C 26 86 24 70 35 70 Z" />
            </svg>

            <div className="relative z-10">
              <div className="size-14 rounded-full border-3 border-amber-500/50 dark:border-amber-400/60 bg-surface shadow-xs flex items-center justify-center relative">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0.5 h-3.5 bg-amber-500 rounded-full origin-bottom" />
                <div className="absolute top-1/2 left-1/2 w-2.5 h-0.5 bg-amber-500 rounded-full origin-left rotate-45" />
                <div className="size-1.5 rounded-full bg-amber-500 z-10" />
              </div>

              <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-amber-500 text-white flex items-center justify-center ring-2 ring-surface shadow-xs font-bold text-xs leading-none">
                !
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-[21px] font-bold text-text tracking-tight">
              No Active Shift
            </h2>
            <p className="text-[13px] text-text-muted leading-relaxed max-w-[310px] mx-auto">
              Business day is open, but no cashier shift is active. Please start a new shift to begin making sales.
            </p>
          </div>

          <div className="bg-surface-alt border border-border rounded-2xl p-3.5 flex items-start gap-3 text-left">
            <div className="size-8 rounded-xl bg-surface text-primary flex items-center justify-center shrink-0 shadow-2xs border border-border mt-0.5">
              <Calendar className="size-4 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[12.5px] text-text">
                  Business Day: {businessDateFormatted}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-success-soft text-success border border-success/30">
                  Open
                </span>
              </div>
              <div className="text-[11.5px] text-text-muted mt-0.5 truncate">
                Branch: {branchName}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartShift}
            className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.99] text-primary-contrast font-bold text-sm shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Play className="size-4 fill-primary-contrast stroke-none" />
            <span>Start New Shift</span>
          </button>
        </>
      )}
    </div>
  );
};

export default POSSessionGatekeeperCard;

