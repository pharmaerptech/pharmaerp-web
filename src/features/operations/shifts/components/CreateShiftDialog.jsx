// src/features/operations/shifts/components/CreateShiftDialog.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalBody,
  UIModalFooter,
  UIButton,
  UIAlert,
  UIBadge,
  UIInput,
} from "@/components/ui";
import {
  Clock,
  Calendar,
  Building2,
  Copy,
  Check,
  Banknote,
  Play,
  Info,
} from "lucide-react";
import { createShift, listShifts, getOpenShift } from "../store/shiftThunk";
import { API_STATUS } from "@/constants";
import useBranchCash from "@/features/finance/treasury/cash-management/branch-cash/hooks/useBranchCash";
import useBranch from "@/features/branch/hooks/useBranch";
import { getOpenBusinessDay } from "@/features/operations/business-days/store/businessDayThunk";

const DENOMINATIONS = [
  { note: 500, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
  { note: 200, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" },
  { note: 100, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  { note: 50,  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  { note: 20,  color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  { note: 10,  color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
  { note: 5,   color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800" },
  { note: 2,   color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700" },
  { note: 1,   color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700" },
];

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "₹ 0.00";
  return `₹ ${Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatFullDate = (val) => {
  if (!val) return "Wednesday, 30 April 2025";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "Wednesday, 30 April 2025";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatShortDate = (val) => {
  if (!val) return "30 Apr 2025";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "30 Apr 2025";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const CreateShiftDialog = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { createShiftStatus, error, shifts, activeShift } = useSelector(
    (state) => state.shift
  );
  const { openBusinessDay } = useSelector((state) => state.businessDay);
  const { currentBranch } = useBranch();

  // Check if another shift or business day is currently open or closing
  const isDayClosing = Boolean(
    openBusinessDay && String(openBusinessDay.status || "").toLowerCase() === "closing"
  );
  const isShiftClosing = Boolean(
    (activeShift && String(activeShift.status || "").toLowerCase() === "closing") ||
    (Array.isArray(shifts) && shifts.some((s) => s.status === "closing"))
  );
  const hasOpenShift = Boolean(
    (activeShift && String(activeShift.status || "").toLowerCase() === "open") ||
    (Array.isArray(shifts) && shifts.some((s) => s.status === "open"))
  );

  // Auto Shift Suggestion
  const hour = new Date().getHours();
  const autoShiftName =
    hour < 12
      ? "Morning Shift"
      : hour < 17
      ? "Afternoon Shift"
      : "Evening Shift";

  const currentTimeStr = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const [shiftName, setShiftName] = useState(autoShiftName);
  const [shiftDate, setShiftDate] = useState("");
  const [startTime, setStartTime] = useState(currentTimeStr);
  const [copied, setCopied] = useState(false);

  const {
    currentBranchCash: branchCash,
    runningDenominations,
    fetchBranchCash: getBranchCash,
  } = useBranchCash();
  const [loadingCash, setLoadingCash] = useState(false);

  // Denominations State - Immutable from branch cash
  const [counts, setCounts] = useState(
    DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d.note]: 0 }), {})
  );

  useEffect(() => {
    if (isOpen) {
      const h = new Date().getHours();
      const suggested =
        h < 12 ? "Morning Shift" : h < 17 ? "Afternoon Shift" : "Evening Shift";
      const timeStr = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setShiftName(suggested);
      setStartTime(timeStr);
      if (currentBranch?._id) {
        setLoadingCash(true);
        getBranchCash(currentBranch._id).finally(() => setLoadingCash(false));
      }
    }
  }, [isOpen, currentBranch?._id]);

  const activeDenoms = useMemo(() => {
    return (
      branchCash?.denominationBalance?.runningDenominations ||
      branchCash?.balance?.runningDenominations ||
      runningDenominations ||
      []
    );
  }, [branchCash, runningDenominations]);

  // Sync Shift Date with Open Business Day date
  useEffect(() => {
    if (openBusinessDay?.businessDate) {
      setShiftDate(formatShortDate(openBusinessDay.businessDate));
    } else {
      setShiftDate(formatShortDate(new Date()));
    }
  }, [openBusinessDay]);

  // Load immutable counts directly from branch cash drawer
  useEffect(() => {
    const newCounts = DENOMINATIONS.reduce(
      (acc, d) => ({ ...acc, [d.note]: 0 }),
      {}
    );
    if (activeDenoms.length > 0) {
      activeDenoms.forEach((d) => {
        const note = Number(d.denomination);
        const qty = Number(d.quantity ?? d.count) || 0;
        if (DENOMINATIONS.some((denom) => denom.note === note)) {
          newCounts[note] = qty;
        }
      });
    }
    setCounts(newCounts);
  }, [activeDenoms]);

  const totalAmount = useMemo(() => {
    return DENOMINATIONS.reduce((sum, d) => {
      const cnt = Number(counts[d.note]) || 0;
      return sum + cnt * d.note;
    }, 0);
  }, [counts]);

  const handleCopyBusinessDay = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async () => {
    if (hasOpenShift) return;

    const openingDenominations = DENOMINATIONS.map((d) => ({
      denomination: d.note,
      count: Number(counts[d.note]) || 0,
      amount: (Number(counts[d.note]) || 0) * d.note,
    })).filter((d) => d.count > 0);

    try {
      await dispatch(
        createShift({
          shiftName: shiftName || autoShiftName,
          openingFloatAmount: totalAmount,
          openingDenominations,
        })
      ).unwrap();
      dispatch(listShifts());
      onClose();
    } catch {
      // Handled by Redux slice error
    }
  };

  const businessDayCode =
    openBusinessDay?.code ||
    openBusinessDay?.businessDayNo ||
    openBusinessDay?._id?.slice(-8).toUpperCase() ||
    "BD-20250430-01";

  const businessDayFullDate = formatFullDate(
    openBusinessDay?.businessDate || new Date()
  );

  const branchDisplayName =
    currentBranch?.name ||
    openBusinessDay?.branch?.name ||
    openBusinessDay?.branchName ||
    "Makati Branch";

  return (
    <UIModal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      className="w-[960px] max-w-[95vw] h-[82vh] max-h-[740px] min-h-[600px] flex flex-col overflow-hidden select-none"
    >
      {/* ── Modal Header: Rounded Green Icon + Title & Subtitle ── */}
      <UIModalHeader className="py-4 px-6 border-b border-border/60 shrink-0">
        <UIModalTitle>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Clock className="size-5.5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text tracking-tight">
                Initialize POS Shift & Cash Drawer
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Create a new cashier shift for the current business day
              </p>
            </div>
          </div>
        </UIModalTitle>
      </UIModalHeader>

      <UIModalBody className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
        {/* ── Active Shift Detected Alert Banner ── */}
        {isShiftClosing && (
          <UIAlert
            intent="danger"
            title="A shift is currently in the closing process."
            description="The current shift is being reconciled and closed on another device. You must wait for it to be completely closed before starting a new shift."
          />
        )}

        {hasOpenShift && !isShiftClosing && (
          <UIAlert
            intent="danger"
            title="Another shift is open so you cannot create a new shift."
            description="A cashier shift is currently active. You must close the active shift before opening a new shift session."
          />
        )}

        {isDayClosing && (
          <UIAlert
            intent="danger"
            title="Business Day Closing in Progress"
            description="The current Business Day is in the process of being closed. Cannot open any new shifts."
          />
        )}

        {!openBusinessDay && !hasOpenShift && !isShiftClosing && !isDayClosing && (
          <UIAlert
            intent="warning"
            title="No Open Business Day"
            description="You must open a business day from Operations > Business Days before you can start a shift."
          />
        )}

        {!branchCash && !loadingCash && openBusinessDay && !hasOpenShift && (
          <UIAlert
            intent="warning"
            title="Branch Cash Not Initialized"
            description="Branch Cash has not been initialized for this branch. Please initialize it in Finance > Treasury > Branch Cash before starting a shift."
          />
        )}

        {error && (
          <UIAlert intent="danger" title="Error" description={error} />
        )}

        {/* ── Top Row: 3 Meta Information Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Business Day No. */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-xs transition-colors">
            <div className="size-9 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Calendar className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-text-muted leading-tight">
                Business Day No.
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-text text-xs font-mono truncate">
                  {businessDayCode}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyBusinessDay(businessDayCode)}
                  className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer shrink-0"
                  title="Copy code"
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Business Date */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-xs transition-colors">
            <div className="size-9 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Calendar className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-text-muted leading-tight">
                Business Date
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="font-semibold text-text text-xs truncate">
                  {businessDayFullDate}
                </span>
                <UIBadge variant="dot" color="success" className="text-[9px] py-0 px-1.5 shrink-0">
                  Open
                </UIBadge>
              </div>
            </div>
          </div>

          {/* Card 3: Branch */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-xs transition-colors">
            <div className="size-9 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Building2 className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-text-muted leading-tight">
                Branch
              </div>
              <div className="font-semibold text-text text-xs mt-0.5 truncate">
                {branchDisplayName}
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-Column Main Content ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* LEFT COLUMN: Shift Details Only */}
          <div className="md:col-span-5 space-y-3.5">
            <div className="bg-surface rounded-xl border border-border p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-text">
                <Clock className="size-4 text-text" />
                <span>Shift Details</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Shift Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-text">
                    Shift Name <span className="text-red-500">*</span>
                  </label>
                  <UIInput
                    type="text"
                    value={shiftName}
                    onChange={(e) => setShiftName(e.target.value)}
                    placeholder="Morning Shift"
                    size="sm"
                    className="h-8.5 text-xs font-medium"
                  />
                </div>

                {/* Shift No. (Auto generated) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-text-muted">
                    Shift No.
                  </label>
                  <UIInput
                    type="text"
                    value="Auto-generated on save"
                    disabled
                    readOnly
                    size="sm"
                    className="h-8.5 text-xs text-text-muted bg-surface-alt/60 cursor-not-allowed font-medium"
                  />
                </div>

                {/* Shift Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-text">
                    Shift Date <span className="text-red-500">*</span>
                  </label>
                  <UIInput
                    type="text"
                    value={shiftDate}
                    readOnly
                    size="sm"
                    startIcon={<Calendar className="size-3.5 text-text-muted" />}
                    className="h-8.5 text-xs font-medium cursor-default"
                  />
                </div>

                {/* Expected Start Time */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-text-muted">
                    Expected Start Time
                  </label>
                  <UIInput
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    size="sm"
                    startIcon={<Clock className="size-3.5 text-text-muted" />}
                    className="h-8.5 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Auto Shift Name Callout */}
              <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/80 rounded-xl p-3 flex items-start gap-2.5">
                <div className="size-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    Auto Shift Name
                  </div>
                  <div className="text-[11px] text-blue-700/90 dark:text-blue-300/90 mt-0.5 leading-snug">
                    We've suggested "{autoShiftName}" based on current time.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Opening Cash Float Denominations (Immutable Count) */}
          <div className="md:col-span-7 bg-surface rounded-xl border border-border p-4 space-y-3 shadow-xs">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Banknote className="size-4" />
              </div>
              <h3 className="text-xs font-bold text-text">
                Opening Cash Float
              </h3>
            </div>

            {/* Denomination Table (Immutable Count Display) */}
            <div className="overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-alt/70 border-b border-border/60 text-text font-semibold select-none text-[11px]">
                    <th className="py-2 px-3.5 w-36">Denomination</th>
                    <th className="py-2 px-3.5 text-center">Count</th>
                    <th className="py-2 px-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {DENOMINATIONS.map(({ note, color }) => {
                    const countVal = counts[note] || 0;
                    const amountVal = countVal * note;

                    return (
                      <tr key={note} className="hover:bg-surface-hover/40 transition-colors">
                        {/* Denomination Badge */}
                        <td className="py-1.5 px-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold border ${color}`}
                          >
                            <Banknote className="size-3" />
                            <span>₹ {note}</span>
                          </span>
                        </td>

                        {/* Count (Immutable) */}
                        <td className="py-1.5 px-3.5 text-center">
                          <span className="inline-block min-w-[46px] py-1 px-2 rounded bg-surface-alt/60 border border-border/40 font-mono text-[11px] font-bold text-text tabular-nums">
                            {countVal}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-1.5 px-3.5 text-right">
                          <span className="inline-block min-w-[85px] font-mono text-[11px] font-semibold tabular-nums text-text bg-surface-alt/50 py-1 px-2.5 rounded border border-border/30">
                            {formatCurrency(amountVal)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Opening Float Card */}
            <div className="bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Banknote className="size-4" />
                </div>
                <span className="text-xs font-bold text-text">
                  Total Opening Float
                </span>
              </div>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                {loadingCash ? "Loading..." : formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </UIModalBody>

      {/* ── Modal Footer: Cancel & Create Shift ── */}
      <UIModalFooter className="border-t border-border/60 py-3.5 px-6 flex items-center justify-end gap-2.5 shrink-0">
        <UIButton
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          className="h-9 px-4 text-xs font-semibold"
        >
          Cancel
        </UIButton>

        <UIButton
          type="button"
          variant="primary"
          size="sm"
          onClick={handleCreate}
          isLoading={createShiftStatus === API_STATUS.LOADING}
          disabled={hasOpenShift || isShiftClosing || isDayClosing || !branchCash || loadingCash || !openBusinessDay || openBusinessDay?.status !== "open"}
          startIcon={<Play className="size-3.5 fill-current" />}
          className="h-9 px-4.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Shift
        </UIButton>
      </UIModalFooter>
    </UIModal>
  );
};

export default CreateShiftDialog;
