// src/features/operations/shifts/components/CloseShiftDialog.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  UIModal,
  UIButton,
  UIBadge,
  UIAlert,
} from "@/components/ui";
import { updateShiftStatus, listShifts } from "../store/shiftThunk";
import { API_STATUS } from "@/constants";
import { apiClient } from "@/services";
import { useBranchCash } from "@/features/finance/treasury/cash-management/branch-cash/hooks/useBranchCash";
import { useHoldBills } from "@/features/sales/hooks/useHoldBills";
import {
  Lock,
  X,
  Calendar,
  Clock,
  ShoppingCart,
  Wallet,
  Tag,
  Percent,
  BarChart2,
  Banknote,
  Download,
  Landmark,
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Snowflake,
  Zap,
  RotateCcw,
  HandCoins,
  QrCode,
  Receipt,
} from "lucide-react";
import { PostShiftCloseDialog } from "./PostShiftCloseDialog";

const ALL_DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1];

const DENOM_CONFIG = {
  500: { color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20" },
  200: { color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  100: { color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },
  50: { color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  20: { color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
  10: { color: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20" },
  5: { color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20" },
  2: { color: "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20" },
  1: { color: "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20" },
};

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹ ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getInitials = (name) => {
  if (!name || name === "—") return "—";
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const formatDuration = (start, end = new Date()) => {
  if (!start) return "—";
  const s = new Date(start);
  const e = new Date(end);
  const diffMs = Math.max(0, e.getTime() - s.getTime());
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffHours}h ${diffMins}m`;
};

export const CloseShiftDialog = ({
  isOpen,
  onClose,
  shift,
  onOpenNewShift,
  onCreateDayClosing,
}) => {
  const dispatch = useDispatch();
  const { updateShiftStatusStatus, error: shiftError } = useSelector(
    (state) => state.shift
  );

  const [note, setNote] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [showPostClose, setShowPostClose] = useState(false);
  const [closedShiftData, setClosedShiftData] = useState(null);

  const [counts, setCounts] = useState(
    ALL_DENOMINATIONS.reduce((acc, note) => ({ ...acc, [note]: "" }), {})
  );

  const [frozenCounts, setFrozenCounts] = useState(
    ALL_DENOMINATIONS.reduce((acc, note) => ({ ...acc, [note]: "" }), {})
  );

  const {
    fetchBranchCash,
    currentBranchCash,
    runningCash: branchRunningCash,
    runningDenominations,
  } = useBranchCash();

  const {
    heldBills,
    count: heldBillsCount,
    clearAll: clearAllHeldBills,
  } = useHoldBills();

  useEffect(() => {
    if (isOpen && shift?.branchId) {
      fetchBranchCash(shift.branchId);
    }
  }, [isOpen, shift?.branchId, fetchBranchCash]);

  // Load initial summary & populate counts from running denominations
  useEffect(() => {
    if (isOpen && shift?._id) {
      setLoading(true);
      apiClient
        .get(`/operations/shifts/${shift._id}/summary`)
        .then((res) => {
          setSummary(res.data.data);
        })
        .catch((err) => {
          console.error(err);
          setLocalError("Failed to load shift summary details");
        })
        .finally(() => setLoading(false));
    } else {
      setSummary(null);
    }
  }, [isOpen, shift]);

  // Sync denominations when runningDenominations available
  useEffect(() => {
    if (isOpen && runningDenominations?.length > 0) {
      const initial = {};
      ALL_DENOMINATIONS.forEach((d) => {
        const found = runningDenominations.find(
          (x) => Number(x.denomination) === d
        );
        initial[d] = found && found.quantity > 0 ? String(found.quantity) : "";
      });
      setCounts(initial);
    }

    if (!isOpen) {
      setCounts(
        ALL_DENOMINATIONS.reduce((acc, n) => ({ ...acc, [n]: "" }), {})
      );
      setFrozenCounts(
        ALL_DENOMINATIONS.reduce((acc, n) => ({ ...acc, [n]: "" }), {})
      );
      setNote("");
      setLocalError(null);
    }
  }, [isOpen, runningDenominations]);

  const handleCountChange = (denom, val) => {
    const newCount = val === "" ? "" : Math.max(0, parseInt(val, 10) || 0);
    setCounts((prev) => ({
      ...prev,
      [denom]: newCount,
    }));
    // Auto-clamp frozen if user lowers counted notes below existing frozen count
    setFrozenCounts((prev) => {
      const numericCount = Number(newCount) || 0;
      const currentFrozen = Number(prev[denom]) || 0;
      if (currentFrozen > numericCount) {
        return {
          ...prev,
          [denom]: numericCount === 0 ? "" : String(numericCount),
        };
      }
      return prev;
    });
  };

  const handleFrozenChange = (denom, val) => {
    const counted = Number(counts[denom]) || 0;
    if (val === "") {
      setFrozenCounts((prev) => ({ ...prev, [denom]: "" }));
      return;
    }
    const parsed = Math.max(0, parseInt(val, 10) || 0);
    const clamped = Math.min(parsed, counted);
    setFrozenCounts((prev) => ({
      ...prev,
      [denom]: String(clamped),
    }));
  };

  // Quick Freeze Actions
  const handleFreezeHighDenoms = () => {
    setFrozenCounts((prev) => {
      const next = { ...prev };
      [500, 200, 100].forEach((n) => {
        const counted = Number(counts[n]) || 0;
        next[n] = counted > 0 ? String(counted) : "";
      });
      return next;
    });
  };

  const handleFreezeAll = () => {
    setFrozenCounts((prev) => {
      const next = {};
      ALL_DENOMINATIONS.forEach((n) => {
        const counted = Number(counts[n]) || 0;
        next[n] = counted > 0 ? String(counted) : "";
      });
      return next;
    });
  };

  const handleClearFrozen = () => {
    setFrozenCounts(
      ALL_DENOMINATIONS.reduce((acc, n) => ({ ...acc, [n]: "" }), {})
    );
  };

  const handleAutoFill = () => {
    const updated = {};
    ALL_DENOMINATIONS.forEach((d) => {
      const found = runningDenominations?.find(
        (x) => Number(x.denomination) === d
      );
      updated[d] = found && found.quantity > 0 ? String(found.quantity) : "0";
    });
    setCounts(updated);
    // Clamp frozen counts against new autofilled counts
    setFrozenCounts((prev) => {
      const next = { ...prev };
      ALL_DENOMINATIONS.forEach((d) => {
        const counted = Number(updated[d]) || 0;
        const currentFrozen = Number(next[d]) || 0;
        if (currentFrozen > counted) {
          next[d] = counted === 0 ? "" : String(counted);
        }
      });
      return next;
    });
  };

  // Running denomination counts (auto-calculated: counted - frozen)
  const runningCounts = useMemo(() => {
    const result = {};
    ALL_DENOMINATIONS.forEach((n) => {
      const counted = Number(counts[n]) || 0;
      const frozen = Number(frozenCounts[n]) || 0;
      result[n] = Math.max(0, counted - frozen);
    });
    return result;
  }, [counts, frozenCounts]);

  const totalCounted = useMemo(() => {
    return ALL_DENOMINATIONS.reduce((sum, n) => {
      return sum + (Number(counts[n]) || 0) * n;
    }, 0);
  }, [counts]);

  const totalFrozen = useMemo(() => {
    return ALL_DENOMINATIONS.reduce((sum, n) => {
      return sum + (Number(frozenCounts[n]) || 0) * n;
    }, 0);
  }, [frozenCounts]);

  const totalRunning = useMemo(() => {
    return Math.max(0, totalCounted - totalFrozen);
  }, [totalCounted, totalFrozen]);

  const frozenValidation = useMemo(() => {
    const errors = [];
    ALL_DENOMINATIONS.forEach((n) => {
      const counted = Number(counts[n]) || 0;
      const frozen = Number(frozenCounts[n]) || 0;
      if (frozen > counted) {
        errors.push(`₹${n}: Frozen count (${frozen}) exceeds counted notes (${counted})`);
      }
    });
    return errors;
  }, [counts, frozenCounts]);

  // Reconciled Metrics
  // Financial Figures
  const openingFloat = Number(summary?.openingFloatAmount || shift?.openingFloatAmount || 0);
  const cashSales = Number(summary?.cashNet || 0);
  const totalDeposits = Number(summary?.totalDeposits || 0);
  const totalWithdrawals = Number(summary?.totalWithdrawals || 0);

  // Customer Advance & Credit Settlement metrics
  const advanceCashTotal = Number(summary?.advanceCashTotal || shift?.advanceCashTotal || 0);
  const advanceCashCount = Number(summary?.advanceCashCount || shift?.advanceCashCount || 0);
  const advanceUpiTotal = Number(summary?.advanceUpiTotal || shift?.advanceUpiTotal || 0);
  const advanceUpiCount = Number(summary?.advanceUpiCount || shift?.advanceUpiCount || 0);
  const totalAdvanceReceived = Number(
    summary?.totalAdvanceReceived ?? (advanceCashTotal + advanceUpiTotal)
  );
  const totalAdvanceReceivedCount = Number(
    summary?.totalAdvanceReceivedCount ?? (advanceCashCount + advanceUpiCount)
  );

  const creditCashTotal = Number(summary?.creditCashTotal || shift?.creditCashTotal || 0);
  const creditCashCount = Number(summary?.creditCashCount || shift?.creditCashCount || 0);
  const creditUpiTotal = Number(summary?.creditUpiTotal || shift?.creditUpiTotal || 0);
  const creditUpiCount = Number(summary?.creditUpiCount || shift?.creditUpiCount || 0);

  const expectedClosingCash = useMemo(() => {
    if (summary?.expectedClosingCashAmount != null) {
      return Number(summary.expectedClosingCashAmount);
    }
    return openingFloat + cashSales + advanceCashTotal + creditCashTotal + totalDeposits - totalWithdrawals;
  }, [summary, openingFloat, cashSales, advanceCashTotal, creditCashTotal, totalDeposits, totalWithdrawals]);

  const difference = totalCounted - expectedClosingCash;

  // Header & Meta Info
  const shiftNo = shift?.shiftNo || summary?.shiftNo || "SFT-001";
  const shiftName = shift?.shiftName || summary?.shiftName || "Shift Session";
  const businessDateFormatted = useMemo(() => {
    const d = shift?.businessDate || summary?.businessDate || summary?.date || new Date();
    const dateObj = new Date(d);
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [shift, summary]);

  const openedAtFormatted = useMemo(() => {
    const d = shift?.openedAt || summary?.openedAt;
    if (!d) return "—";
    return new Date(d).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, [shift, summary]);

  const cashierName =
    shift?.openedBy?.fullName ||
    shift?.openedBy?.name ||
    summary?.openedBy?.fullName ||
    summary?.openedBy?.name ||
    "Cashier";
  const cashierInitials = getInitials(cashierName);
  const durationText = formatDuration(shift?.openedAt || summary?.openedAt);

  // Top KPIs
  const totalSales = Number(summary?.netSales || summary?.invoiceAmount || 0);
  const totalBills = Number(summary?.invoiceCount || 0);
  const totalCashCollected = Number(summary?.cashNet || 0);
  const cashBillsCount = Number(summary?.cashInvoiceCount || 0);
  const qrNet = Number(summary?.qrNet || 0);
  const upiCount = Number(summary?.paymentQrCount || 0);
  const upiBreakdown = summary?.upiBreakdown || [];
  const splitNet = Number(summary?.splitNet || summary?.splitSalesTotal || 0);
  const splitBillsCount = Number(summary?.splitInvoiceCount || 0);
  const splitCashAmount = Number(summary?.splitCashAmount || 0);
  const splitUpiAmount = Number(summary?.splitUpiAmount || 0);
  const pureCashAmount = Number(summary?.pureCashAmount ?? (totalCashCollected - splitCashAmount));
  const pureUpiAmount = Number(summary?.pureUpiAmount ?? (qrNet - splitUpiAmount));
  const totalUpi = Number(summary?.qrNet || 0);
  const upiBillsCount = Number(summary?.paymentQrCount || 0);
  const creditNoteSalesTotal = Number(summary?.creditNoteSalesTotal ?? shift?.creditNoteSalesTotal ?? 0);
  const creditNoteBillsCount = Number(summary?.creditNoteInvoiceCount ?? shift?.creditNoteInvoiceCount ?? 0);
  const splitCreditNoteAmount = Number(summary?.splitCreditNoteAmount ?? shift?.splitCreditNoteAmount ?? 0);
  const splitCombinations = summary?.splitCombinations || shift?.splitCombinations || [];

  const advanceCreditUpiBreakdown = summary?.advanceCreditUpiBreakdown || shift?.advanceCreditUpiBreakdown || [];

  // Credit & Advance Sales Bills during this Shift
  const creditSalesTotal = Number(summary?.creditSalesTotal ?? shift?.creditSalesTotal ?? 0);
  const creditBillsCount = Number(summary?.creditInvoiceCount ?? shift?.creditInvoiceCount ?? 0);
  const advanceSalesTotal = Number(summary?.advanceSalesTotal ?? shift?.advanceSalesTotal ?? 0);
  const advanceBillsCount = Number(summary?.advanceInvoiceCount ?? shift?.advanceInvoiceCount ?? 0);

  // Cancelled Bills Metrics
  const cancelledBills = Number(summary?.cancelledInvoiceCount ?? shift?.cancelledInvoiceCount ?? 0);
  const cancelledAmount = Number(summary?.cancelledSalesTotal ?? shift?.cancelledSalesTotal ?? 0);
  const cancelledCash = Number(summary?.cancelledCashTotal ?? shift?.cancelledCashTotal ?? 0);
  const cancelledUpi = Number(summary?.cancelledUpiTotal ?? shift?.cancelledUpiTotal ?? 0);
  const cancelledSplit = Number(summary?.cancelledSplitTotal ?? shift?.cancelledSplitTotal ?? 0);

  const totalDiscount = Number(summary?.totalDiscount || summary?.discountAmount || 0);
  const discountPercent = totalSales > 0 ? ((totalDiscount / (totalSales + totalDiscount)) * 100).toFixed(1) : "0.0";

  const totalGst = Number(summary?.totalTax || summary?.taxNet || 0);
  const gstPercent = totalSales > 0 ? ((totalGst / totalSales) * 100).toFixed(1) : "0.0";

  // Branch Cash Values
  const runningCashAfterClosing = totalRunning;
  const currentFrozenCash = Number(currentBranchCash?.frozenCash || 0);
  const projectedFrozenCash = currentFrozenCash + totalFrozen;
  const projectedTotalBranchCash = runningCashAfterClosing + projectedFrozenCash;

  const handleLockShift = async () => {
    setLocalError(null);

    if (heldBillsCount > 0) {
      setLocalError(
        `Active held bills detected (${heldBillsCount}). Please clear all held bills before locking and closing the shift.`
      );
      return;
    }

    if (frozenValidation.length > 0) {
      setLocalError(frozenValidation[0]);
      return;
    }

    const closingDenominations = ALL_DENOMINATIONS.filter(
      (n) => (Number(counts[n]) || 0) > 0
    ).map((n) => ({
      denomination: n,
      count: Number(counts[n]),
      amount: Number(counts[n]) * n,
    }));

    const frozenDenominations = ALL_DENOMINATIONS.filter(
      (n) => (Number(frozenCounts[n]) || 0) > 0
    ).map((n) => ({
      denomination: n,
      quantity: Number(frozenCounts[n]),
    }));

    try {
      const result = await dispatch(
        updateShiftStatus({
          id: shift._id,
          payload: {
            status: "closed",
            actualClosingCashAmount: totalCounted,
            closingDenominations,
            note,
            carryForwardAmount: totalRunning,
            frozenDenominations,
          },
        })
      ).unwrap();

      // Clear any remaining held bills as the shift is officially closed
      clearAllHeldBills();
      dispatch(listShifts());
      setClosedShiftData(result);
      setShowPostClose(true);
    } catch (err) {
      setLocalError(err?.message || "Failed to lock and close shift");
    }
  };

  return (
    <>
      <UIModal
        isOpen={isOpen}
        onClose={onClose}
        showCloseButton={false}
        className="w-[1040px] max-w-[96vw] h-[86vh] max-h-[780px] min-h-[620px] rounded-2xl border border-border bg-surface shadow-2xl flex flex-col overflow-hidden select-none"
      >
        {/* ── 1. Dialog Header (Fixed, shrink-0) ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Lock className="size-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text tracking-tight">
                Lock & Close Shift Session
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Review cash count, reconcile transactions and close this shift
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* ── 2. Modal Body (Scrollable Container, flex-1) ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-3.5">
          {/* Active Error Notice */}
          {(shiftError || localError) && (
            <UIAlert
              intent="danger"
              title="Error"
              description={localError || shiftError}
            />
          )}

          {/* Active Held Bills Gate Notice */}
          {heldBillsCount > 0 && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <span>Active Held Bills Detected</span>
                    <UIBadge variant="soft" intent="warning" className="text-[10px] font-bold py-0 px-1.5">
                      {heldBillsCount} {heldBillsCount === 1 ? "Bill" : "Bills"} on Hold
                    </UIBadge>
                  </div>
                  <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 mt-0.5">
                    You have {heldBillsCount} bill(s) on hold for this branch. A shift cannot be closed with active held bills. Click &quot;Clear All Held Bills&quot; to discard them and proceed with closing the shift.
                  </p>
                </div>
              </div>
              <UIButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  clearAllHeldBills();
                }}
                startIcon={<RotateCcw className="size-3.5" />}
                className="h-8.5 px-3.5 text-xs font-bold border-amber-500/50 text-amber-800 dark:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 shrink-0 cursor-pointer shadow-2xs"
              >
                Clear All Held Bills
              </UIButton>
            </div>
          )}

          {/* ── Meta Information Bar (6 Items) ── */}
          <div className="bg-surface rounded-xl border border-border/80 p-3 grid grid-cols-2 sm:grid-cols-6 gap-3 items-center shadow-xs">
            {/* Shift No */}
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Calendar className="size-4 stroke-[1.8]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-text-muted leading-tight">
                  Shift No.
                </div>
                <div className="text-xs font-bold text-text font-mono mt-0.5 truncate">
                  {shiftNo}
                </div>
              </div>
            </div>

            {/* Shift Name */}
            <div className="min-w-0">
              <div className="text-[10px] font-medium text-text-muted leading-tight">
                Shift Name
              </div>
              <div className="text-xs font-bold text-text mt-0.5 truncate">
                {shiftName}
              </div>
            </div>

            {/* Business Date */}
            <div className="min-w-0">
              <div className="text-[10px] font-medium text-text-muted leading-tight">
                Business Date
              </div>
              <div className="text-xs font-bold text-text mt-0.5 truncate">
                {businessDateFormatted}
              </div>
            </div>

            {/* Opened At */}
            <div className="min-w-0">
              <div className="text-[10px] font-medium text-text-muted leading-tight">
                Opened At
              </div>
              <div className="text-xs font-bold text-text mt-0.5 truncate">
                {openedAtFormatted}
              </div>
            </div>

            {/* Opened By */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-7 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                {cashierInitials}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-text-muted leading-tight">
                  Opened By
                </div>
                <div className="text-xs font-bold text-text truncate">
                  {cashierName}
                </div>
                <div className="text-[9px] text-text-muted leading-none">
                  Cashier
                </div>
              </div>
            </div>

            {/* Duration & Open Badge */}
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                <Clock className="size-3.5 text-text-muted" />
                <span>{durationText}</span>
              </div>
              <UIBadge variant="dot" color="success" className="text-[10px] py-0 px-2 shrink-0">
                Open
              </UIBadge>
            </div>
          </div>

          {/* UPI Collections & Auto-Transfer to Respective Bank Accounts */}
          {(qrNet > 0 || upiBreakdown.length > 0) && (
            <div className="bg-surface rounded-xl border border-purple-500/30 p-3.5 space-y-3 shadow-xs animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <QrCode className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text flex items-center gap-2">
                      UPI Collections Held in Shift
                      <UIBadge variant="soft" intent="info" className="text-[9px] font-bold py-0 px-1.5">
                        Transfers to Banks on Close
                      </UIBadge>
                    </h3>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      Held UPI amounts will be automatically credited to each respective destination bank account upon locking.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">
                    {formatCurrency(qrNet)}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {upiCount} bills total {splitUpiAmount > 0 ? `(${formatCurrency(splitUpiAmount)} from Split)` : ""}
                  </div>
                </div>
              </div>

              {/* Grid of UPI Accounts / Terminals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(upiBreakdown.length > 0
                  ? upiBreakdown
                  : [
                      {
                        paymentQrId: null,
                        upiId: "UPI Direct",
                        label: "Primary Counter QR",
                        bankName: "Primary Bank Account",
                        accountName: "Main Account",
                        accountNumber: "",
                        billCount: upiCount + (splitBillsCount > 0 ? splitBillsCount : 0),
                        pureBillCount: upiCount,
                        splitBillCount: splitBillsCount,
                        totalAmount: qrNet,
                      },
                    ]
                ).map((item, idx) => {
                  const displayBillCount = Number(
                    item.billCount ||
                    ((item.pureBillCount || 0) + (item.splitBillCount || 0)) ||
                    (upiCount + (splitBillsCount > 0 ? splitBillsCount : 0)) ||
                    item.transactionCount ||
                    0
                  );
                  const displaySplitCount = Number(
                    item.splitBillCount !== undefined
                      ? item.splitBillCount
                      : (splitBillsCount > 0 ? splitBillsCount : 0)
                  );
                  const displayPureCount = Number(
                    item.pureBillCount !== undefined
                      ? item.pureBillCount
                      : Math.max(0, displayBillCount - displaySplitCount)
                  );
                  const qrSrc =
                    item.qrImageUrl ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${encodeURIComponent(
                      `upi://pay?pa=${item.upiId || "store@upi"}&pn=${encodeURIComponent(
                        item.label || "Store"
                      )}&cu=INR`
                    )}`;

                  return (
                    <div
                      key={item.paymentQrId || idx}
                      className="p-2.5 rounded-lg border border-border/70 bg-surface-alt/40 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-9 rounded-lg bg-white p-1 border border-border/70 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                          <img src={qrSrc} alt="UPI QR" className="size-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-text text-xs truncate flex items-center gap-1.5">
                            <span>{item.bankName || "Bank Account"}</span>
                            {item.accountNumber && (
                              <span className="font-mono text-[10px] text-text-muted">
                                ({item.accountNumber})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-text-muted truncate mt-0.5 flex items-center gap-1">
                            <span className="font-medium text-text">{item.label || item.upiId}</span>
                            {item.upiId && item.label && item.label !== item.upiId && (
                              <span className="text-[10px] text-text-muted truncate">· {item.upiId}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold font-mono text-text text-xs">
                          {formatCurrency(item.totalAmount)}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                          {displayBillCount} {displayBillCount === 1 ? "bill" : "bills"}{" "}
                          {displaySplitCount > 0 ? `(${displayPureCount} UPI + ${displaySplitCount} Split)` : ""} · Transfer
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customer Advance & Credit UPI Transfer Allocations */}
          {(advanceCreditUpiBreakdown.length > 0 || advanceUpiTotal + creditUpiTotal > 0) && (
            <div className="bg-purple-500/10 border border-purple-500/25 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                    <QrCode className="size-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text">Customer Advance & Credit Settlement UPI Transfers</h4>
                    <p className="text-[10px] text-text-muted">
                      Direct shift-close transfer to respective bank accounts for customer advance & credit receipts
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold font-mono text-xs text-purple-700 dark:text-purple-300">
                    {formatCurrency(advanceUpiTotal + creditUpiTotal)}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {advanceUpiCount + creditUpiCount} receipts total
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {advanceCreditUpiBreakdown.map((item, idx) => (
                  <div
                    key={item.paymentQrId || idx}
                    className="p-2.5 rounded-lg border border-border/70 bg-surface flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-text text-xs truncate">
                        {item.bankName || "Bank Account"}
                        {item.accountNumber && (
                          <span className="font-mono text-[10px] text-text-muted ml-1">
                            ({item.accountNumber})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted truncate">
                        {item.label || item.upiId} · {item.sourceType || "Customer Receipt"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold font-mono text-text text-xs">
                        {formatCurrency(item.totalAmount)}
                      </div>
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                        {item.transactionCount || 1} {item.transactionCount === 1 ? "receipt" : "receipts"} · Transfer
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Counter Receipts (Cash Drawer Addition Notice) */}
          {(advanceCashTotal > 0 || creditCashTotal > 0) && (
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-medium text-text">
                  Customer Counter Receipts: <strong className="font-mono">{formatCurrency(advanceCashTotal + creditCashTotal)}</strong> added to Cash Drawer
                </span>
                <span className="text-text-muted">|</span>
                <div className="flex items-center gap-1.5">
                  {advanceCashTotal > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-[11px]">
                      Advance: {formatCurrency(advanceCashTotal)} ({advanceCashCount} rec)
                    </span>
                  )}
                  {creditCashTotal > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold font-mono text-[11px]">
                      Credit Settled: {formatCurrency(creditCashTotal)} ({creditCashCount} bills)
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider shrink-0">
                Drawer Cash Verified
              </span>
            </div>
          )}

          {/* Split Sales Notice */}
          {splitNet > 0 && (
            <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="size-2 rounded-full bg-indigo-500 shrink-0" />
                <span className="font-medium text-text">
                  Split Payment Bills: <strong className="font-mono">{formatCurrency(splitNet)}</strong> across <strong className="font-mono">{splitBillsCount}</strong> {splitBillsCount === 1 ? "bill" : "bills"}
                </span>
                <span className="text-text-muted">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-[11px]">
                    Cash: {formatCurrency(splitCashAmount)}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold font-mono text-[11px]">
                    UPI: {formatCurrency(splitUpiAmount)}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider shrink-0">
                Split Reconciled
              </span>
            </div>
          )}

          {/* Credit & Advance Sales Notice */}
          {(creditSalesTotal > 0 || advanceSalesTotal > 0) && (
            <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5 animate-in fade-in">
              <div className="flex flex-wrap items-center gap-2">
                <Receipt className="size-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-medium text-text">
                  Credit & Advance Sales: <strong className="font-mono">{formatCurrency(creditSalesTotal + advanceSalesTotal)}</strong> across <strong className="font-mono">{creditBillsCount + advanceBillsCount}</strong> {creditBillsCount + advanceBillsCount === 1 ? "bill" : "bills"}
                </span>
                <span className="text-text-muted">|</span>
                <div className="flex items-center gap-1.5">
                  {creditSalesTotal > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold font-mono text-[11px]">
                      Credit: {formatCurrency(creditSalesTotal)} ({creditBillsCount} {creditBillsCount === 1 ? "bill" : "bills"})
                    </span>
                  )}
                  {advanceSalesTotal > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold font-mono text-[11px]">
                      Advance: {formatCurrency(advanceSalesTotal)} ({advanceBillsCount} {advanceBillsCount === 1 ? "bill" : "bills"})
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider shrink-0">
                Non-Cash Bills
              </span>
            </div>
          )}

          {/* Cancelled Bills Notice */}
          {cancelledBills > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-rose-500 shrink-0" />
                <span className="font-medium text-text">
                  Cancelled Bills: <strong className="font-mono text-rose-600 dark:text-rose-400">{formatCurrency(cancelledAmount)}</strong> ({cancelledBills} bills cancelled
                  {cancelledCash > 0 ? ` · Cash: ${formatCurrency(cancelledCash)}` : ""}
                  {cancelledUpi > 0 ? ` · UPI: ${formatCurrency(cancelledUpi)}` : ""}
                  {cancelledSplit > 0 ? ` · Split: ${formatCurrency(cancelledSplit)}` : ""}
                  )
                </span>
              </div>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider shrink-0">
                Excluded from shift
              </span>
            </div>
          )}

          {/* ── Customer Advance & Credit Note Highlights ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Total Advance Received in Shift */}
            <div className="bg-surface rounded-xl border border-amber-500/30 p-3 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Wallet className="size-4 stroke-[1.8]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-text-muted">
                    Total Advance Received
                  </div>
                  <div className="text-sm font-bold text-text font-mono mt-0.5 truncate">
                    {formatCurrency(totalAdvanceReceived)}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>{totalAdvanceReceivedCount} {totalAdvanceReceivedCount === 1 ? "receipt" : "receipts"}</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Cash Drawer: +{formatCurrency(advanceCashTotal)}
                    </span>
                    <span>•</span>
                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                      UPI: {formatCurrency(advanceUpiTotal)}
                    </span>
                  </div>
                </div>
              </div>
              <UIBadge variant="soft" intent="warning" className="text-[9px] py-0 px-2 shrink-0">
                Advance In
              </UIBadge>
            </div>

            {/* Bills Using Advance (Prepaid customer deduction) */}
            <div className="bg-surface rounded-xl border border-amber-500/30 p-3 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Receipt className="size-4 stroke-[1.8]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-text-muted">
                    Bills Using Advance
                  </div>
                  <div className="text-sm font-bold text-text font-mono mt-0.5 truncate">
                    {advanceBillsCount} {advanceBillsCount === 1 ? "Bill" : "Bills"}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">
                    Deducted: <strong className="font-mono text-amber-600 dark:text-amber-400">{formatCurrency(advanceSalesTotal)}</strong>
                  </div>
                </div>
              </div>
              <UIBadge variant="soft" intent="warning" className="text-[9px] py-0 px-2 shrink-0">
                Prepaid Bills
              </UIBadge>
            </div>

            {/* Bills Using Credit Note */}
            <div className="bg-surface rounded-xl border border-indigo-500/30 p-3 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Receipt className="size-4 stroke-[1.8]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-text-muted">
                    Bills Using Credit Note
                  </div>
                  <div className="text-sm font-bold text-text font-mono mt-0.5 truncate">
                    {creditNoteBillsCount} {creditNoteBillsCount === 1 ? "Bill" : "Bills"}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">
                    Redeemed: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{formatCurrency(creditNoteSalesTotal)}</strong>
                    {splitCreditNoteAmount > 0 ? ` (${formatCurrency(splitCreditNoteAmount)} split)` : ""}
                  </div>
                </div>
              </div>
              <UIBadge variant="soft" intent="info" className="text-[9px] py-0 px-2 shrink-0">
                Credit Note
              </UIBadge>
            </div>
          </div>

          {/* ── 5 Top KPI Stat Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* Total Sales */}
            <div className="bg-surface rounded-xl border border-border/80 p-3 shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="size-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShoppingCart className="size-3.5 stroke-[1.8]" />
                </div>
                <span className="text-[11px] font-medium text-text-muted">Total Sales</span>
              </div>
              <div className="text-sm font-bold text-text font-mono">
                {formatCurrency(totalSales)}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">
                {totalBills} active {creditBillsCount > 0 ? `· ${creditBillsCount} Credit` : ""}{advanceBillsCount > 0 ? ` · ${advanceBillsCount} Adv` : ""} {cancelledBills > 0 ? `(${cancelledBills} cancelled)` : ""}
              </div>
            </div>

            {/* Total Cash Collected */}
            <div className="bg-surface rounded-xl border border-border/80 p-3 shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="size-7 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Wallet className="size-3.5 stroke-[1.8]" />
                </div>
                <span className="text-[11px] font-medium text-text-muted">Total Cash Collected</span>
              </div>
              <div className="text-sm font-bold text-text font-mono">
                {formatCurrency(totalCashCollected)}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">
                {cashBillsCount} cash bills
                {splitCashAmount > 0 && ` (${formatCurrency(splitCashAmount)} from Split)`}
              </div>
            </div>

            {/* Total UPI Collections */}
            <div className="bg-surface rounded-xl border border-border/80 p-3 shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="size-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <QrCode className="size-3.5 stroke-[1.8]" />
                </div>
                <span className="text-[11px] font-medium text-text-muted">Total UPI Collections</span>
              </div>
              <div className="text-sm font-bold text-text font-mono">
                {formatCurrency(totalUpi)}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">
                {upiBillsCount} UPI bills
                {splitUpiAmount > 0 && ` (${formatCurrency(splitUpiAmount)} from Split)`}
              </div>
            </div>

            {/* Total Discount */}
            <div className="bg-surface rounded-xl border border-border/80 p-3 shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="size-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Tag className="size-3.5 stroke-[1.8]" />
                </div>
                <span className="text-[11px] font-medium text-text-muted">Total Discount</span>
              </div>
              <div className="text-sm font-bold text-text font-mono">
                {formatCurrency(totalDiscount)}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">
                {discountPercent}% of sales
              </div>
            </div>

            {/* Total GST */}
            <div className="bg-surface rounded-xl border border-border/80 p-3 shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="size-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Percent className="size-3.5 stroke-[1.8]" />
                </div>
                <span className="text-[11px] font-medium text-text-muted">Total GST</span>
              </div>
              <div className="text-sm font-bold text-text font-mono">
                {formatCurrency(totalGst)}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">
                {gstPercent}% of sales
              </div>
            </div>
          </div>

          {/* Split Payment Combinations (if any) */}
          {(splitBillsCount > 0 || (Array.isArray(splitCombinations) && splitCombinations.length > 0)) && (
            <div className="bg-surface rounded-xl border border-purple-500/30 p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between pb-1 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Receipt className="size-4 text-purple-600 dark:text-purple-400" />
                  <div>
                    <h3 className="text-xs font-bold text-text">
                      Split Payment Combinations
                    </h3>
                    <p className="text-[10.5px] text-text-muted">
                      Multi-tender bills recorded during this shift
                    </p>
                  </div>
                </div>
                <UIBadge variant="soft" color="purple" className="text-[10px] font-bold">
                  {splitBillsCount} Split Bills · {formatCurrency(splitNet)}
                </UIBadge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-0.5">
                {(splitCombinations && splitCombinations.length > 0 ? splitCombinations : [
                  { combination: "Cash + UPI", count: splitBillsCount, totalAmount: splitNet }
                ]).map((comb, cIdx) => (
                  <div
                    key={comb.combination || cIdx}
                    className="p-2 rounded-lg border border-border/70 bg-surface-alt/40 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-text truncate">
                        {comb.combination}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        {comb.count} {comb.count === 1 ? "invoice" : "invoices"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400 block">
                        {formatCurrency(comb.totalAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Middle Row: Expected vs Actual & Denominations Split ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
            {/* Left Column: Expected vs Actual Cash (col-span-5) */}
            <div className="lg:col-span-5 bg-surface rounded-xl border border-border/80 p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                <BarChart2 className="size-4 text-text" />
                <h3 className="text-xs font-bold text-text">
                  Expected vs Actual Cash
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-text-muted font-medium">Opening Float</span>
                  <span className="font-mono font-bold text-text">{formatCurrency(openingFloat)}</span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-text-muted font-medium">Cash Sales</span>
                  <span className="font-mono font-bold text-text">{formatCurrency(cashSales)}</span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-text-muted font-medium">Add: Cash In (Fund Transfer)</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    + {formatCurrency(totalDeposits)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-text-muted font-medium">Less: Cash Out (Fund Transfer)</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    - {formatCurrency(totalWithdrawals)}
                  </span>
                </div>

                {/* Customer Advance Cash */}
                {advanceCashTotal > 0 && (
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-text-muted font-medium">Add: Customer Advance Cash ({advanceCashCount || 1} rec)</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      + {formatCurrency(advanceCashTotal)}
                    </span>
                  </div>
                )}

                {/* Customer Credit Settlement Cash */}
                {creditCashTotal > 0 && (
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-text-muted font-medium">Add: Customer Credit Settled ({creditCashCount || 1} bills)</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      + {formatCurrency(creditCashTotal)}
                    </span>
                  </div>
                )}

                {/* Customer Advance UPI Held */}
                {advanceUpiTotal > 0 && (
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-text-muted font-medium">Customer Advance UPI ({advanceUpiCount || 1} rec · Held in Shift)</span>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(advanceUpiTotal)} (Bank Transfer)
                    </span>
                  </div>
                )}

                {/* Bills Using Advance */}
                {advanceSalesTotal > 0 && (
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-text-muted font-medium">Bills Using Advance ({advanceBillsCount} bills)</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(advanceSalesTotal)} (Prepaid)
                    </span>
                  </div>
                )}

                {/* Expected Closing Cash Row */}
                <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-surface-alt/80 font-bold border border-border/60">
                  <span className="text-text">Expected Closing Cash</span>
                  <span className="font-mono text-text">{formatCurrency(expectedClosingCash)}</span>
                </div>

                {/* Actual Closing Cash Counted */}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-text font-semibold">Actual Closing Cash (Counted)</span>
                  <div className="font-mono font-bold text-sm bg-surface-alt px-3 py-1 rounded-lg border border-border text-text">
                    {formatCurrency(totalCounted)}
                  </div>
                </div>

                {/* Difference */}
                <div className="flex justify-between items-center pt-1 border-t border-border/60">
                  <span className="text-text font-semibold">Difference</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                      difference === 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : difference > 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {difference > 0 ? "+" : ""}
                    {formatCurrency(difference)}
                  </span>
                </div>

                {/* Non-Cash Sales Note */}
                {(creditSalesTotal > 0 || advanceSalesTotal > 0 || creditNoteSalesTotal > 0) && (
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10.5px] text-text-muted">
                    <span>Non-Cash Sales (Excluded from Drawer):</span>
                    <div className="flex items-center gap-1.5 font-mono flex-wrap">
                      {creditSalesTotal > 0 && (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">
                          Credit: {formatCurrency(creditSalesTotal)} ({creditBillsCount} {creditBillsCount === 1 ? "bill" : "bills"})
                        </span>
                      )}
                      {creditSalesTotal > 0 && (advanceSalesTotal > 0 || creditNoteSalesTotal > 0) && <span>·</span>}
                      {advanceSalesTotal > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          Advance: {formatCurrency(advanceSalesTotal)} ({advanceBillsCount} {advanceBillsCount === 1 ? "bill" : "bills"})
                        </span>
                      )}
                      {(creditSalesTotal > 0 || advanceSalesTotal > 0) && creditNoteSalesTotal > 0 && <span>·</span>}
                      {creditNoteSalesTotal > 0 && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                          Credit Note: {formatCurrency(creditNoteSalesTotal)} ({creditNoteBillsCount} {creditNoteBillsCount === 1 ? "bill" : "bills"})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Counted Denominations & Frozen Transfer (col-span-7) */}
            <div className="lg:col-span-7 bg-surface rounded-xl border border-border/80 p-4 space-y-2.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Banknote className="size-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text">
                      Counted Denominations &amp; Cash Split
                    </h3>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <UIButton
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleAutoFill}
                    startIcon={<Download className="size-3" />}
                    className="h-6.5 text-[10px] px-2 font-medium text-text cursor-pointer"
                    title="Fill counts from running cash in drawer"
                  >
                    Auto Fill
                  </UIButton>

                  <button
                    type="button"
                    onClick={handleFreezeHighDenoms}
                    disabled={totalCounted === 0}
                    className="h-6.5 text-[10px] font-semibold px-2 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Transfer all counted ₹500, ₹200, ₹100 notes into Frozen Reserve Vault"
                  >
                    <Zap className="size-3 text-amber-500" />
                    <span>Freeze High</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFreezeAll}
                    disabled={totalCounted === 0}
                    className="h-6.5 text-[10px] font-medium px-2 rounded-md bg-surface border border-border text-text-muted hover:text-text transition flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Transfer all counted cash into Frozen Reserve Vault"
                  >
                    <Snowflake className="size-3 text-sky-500" />
                    <span>Freeze All</span>
                  </button>

                  {totalFrozen > 0 && (
                    <button
                      type="button"
                      onClick={handleClearFrozen}
                      className="h-6.5 text-[10px] font-medium px-1.5 rounded-md text-text-muted hover:text-text transition flex items-center gap-0.5 cursor-pointer"
                      title="Reset frozen counts to 0"
                    >
                      <RotateCcw className="size-2.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Denominations & Freeze Table */}
              <div className="border border-border/80 rounded-xl overflow-hidden bg-surface">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-1.5 px-3 py-2 bg-surface-alt/70 border-b border-border/70 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  <div className="col-span-3">Denom</div>
                  <div className="col-span-3 text-center">Counted (Drawer)</div>
                  <div className="col-span-3 text-center text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                    <Snowflake className="size-2.5" />
                    <span>To Frozen Vault</span>
                  </div>
                  <div className="col-span-3 text-right text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                    <HandCoins className="size-2.5" />
                    <span>Next Shift (Float)</span>
                  </div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-border/50 max-h-[290px] overflow-y-auto">
                  {ALL_DENOMINATIONS.map((note) => {
                    const countVal = counts[note] || "";
                    const frozenVal = frozenCounts[note] || "";
                    const countedNum = Number(countVal) || 0;
                    const frozenNum = Number(frozenVal) || 0;
                    const runningNum = Math.max(0, countedNum - frozenNum);
                    const isOverFrozen = frozenNum > countedNum;
                    const cfg = DENOM_CONFIG[note];

                    return (
                      <div
                        key={note}
                        className={`grid grid-cols-12 items-center gap-1.5 px-3 py-1.5 transition-colors ${
                          isOverFrozen
                            ? "bg-rose-500/10"
                            : frozenNum > 0
                            ? "bg-amber-500/[0.03] hover:bg-amber-500/[0.07]"
                            : "hover:bg-surface-alt/40"
                        }`}
                      >
                        {/* Denomination badge */}
                        <div className="col-span-3 flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${cfg.color}`}
                          >
                            <Banknote className="size-2.5" />
                            <span>₹ {note}</span>
                          </span>
                        </div>

                        {/* Counted in Drawer (input) */}
                        <div className="col-span-3">
                          <input
                            type="number"
                            min="0"
                            value={countVal}
                            onChange={(e) => handleCountChange(note, e.target.value)}
                            placeholder="0"
                            className="w-full text-center font-mono text-xs border border-border/80 bg-surface rounded-md py-1 px-1 outline-none focus:border-primary font-bold text-text transition-colors"
                          />
                        </div>

                        {/* To Frozen Vault (input) */}
                        <div className="col-span-3">
                          <input
                            type="number"
                            min="0"
                            max={countedNum}
                            value={frozenVal}
                            onChange={(e) => handleFrozenChange(note, e.target.value)}
                            placeholder="0"
                            disabled={countedNum === 0}
                            className={`w-full text-center font-mono text-xs border rounded-md py-1 px-1 outline-none transition-colors font-bold ${
                              countedNum === 0
                                ? "bg-surface-alt/30 border-border/40 text-text-muted/30 cursor-not-allowed"
                                : isOverFrozen
                                ? "border-rose-500 bg-rose-500/10 text-rose-600 focus:border-rose-500"
                                : frozenNum > 0
                                ? "border-amber-400 dark:border-amber-500/50 bg-amber-50/70 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 focus:border-amber-500"
                                : "border-border/80 bg-surface text-text focus:border-amber-500 hover:border-amber-300"
                            }`}
                          />
                        </div>

                        {/* Next Shift Running (read-only count + value) */}
                        <div className="col-span-3 text-right">
                          {runningNum > 0 ? (
                            <div className="inline-flex flex-col items-end">
                              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                {runningNum} pcs
                              </span>
                              <span className="text-[10px] font-mono text-text-muted">
                                ₹{(runningNum * note).toLocaleString("en-IN")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono text-text-muted/40">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Split Totals Banner */}
              <div className="bg-surface-alt/70 border border-border/80 rounded-xl p-2.5 px-3.5 grid grid-cols-3 gap-2 divide-x divide-border/60">
                {/* Total Counted */}
                <div className="text-left">
                  <div className="text-[10px] font-medium text-text-muted flex items-center gap-1">
                    <Banknote className="size-3" />
                    <span>Counted in Drawer</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-text mt-0.5 tabular-nums">
                    {formatCurrency(totalCounted)}
                  </div>
                </div>

                {/* To Frozen Reserve */}
                <div className="text-center pl-2">
                  <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                    <Snowflake className="size-3" />
                    <span>To Frozen Vault</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
                    {formatCurrency(totalFrozen)}
                  </div>
                </div>

                {/* Running Next Shift */}
                <div className="text-right pl-2">
                  <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                    <HandCoins className="size-3" />
                    <span>Next Shift (Float)</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
                    {formatCurrency(totalRunning)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Row: 3 Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Card 1: Branch Cash After Closing */}
            <div className="bg-surface rounded-xl border border-border/80 p-3.5 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 pb-1.5 border-b border-border/60">
                <Landmark className="size-4 text-text" />
                <h4 className="text-xs font-bold text-text">
                  Branch Cash After Closing
                </h4>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-text-muted text-[11px] flex items-center gap-1">
                    <HandCoins className="size-3 text-emerald-500" />
                    <span>Running Cash (Next Shift)</span>
                  </span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(runningCashAfterClosing)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-text-muted text-[11px] flex items-center gap-1">
                    <Snowflake className="size-3 text-amber-500" />
                    <span>Frozen Reserve (Vault)</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {totalFrozen > 0 && (
                      <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded">
                        +{formatCurrency(totalFrozen)}
                      </span>
                    )}
                    <span className="font-mono font-semibold text-text">
                      {formatCurrency(projectedFrozenCash)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border/60 font-bold">
                  <span className="text-text">Total Branch Cash</span>
                  <span className="font-mono text-text">
                    {formatCurrency(projectedTotalBranchCash)}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Closing Notes (Optional) */}
            <div className="bg-surface rounded-xl border border-border/80 p-3.5 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 pb-1.5 border-b border-border/60">
                <FileText className="size-4 text-text" />
                <h4 className="text-xs font-bold text-text">
                  Closing Notes (Optional)
                </h4>
              </div>

              <div className="space-y-1">
                <textarea
                  value={note}
                  maxLength={500}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., Shift closed successfully. All transactions verified."
                  rows={2}
                  className="w-full bg-surface-alt/60 border border-border/80 rounded-lg text-xs p-2.5 outline-none focus:border-primary text-text placeholder:text-text-muted resize-none transition-colors"
                />
                <div className="text-[10px] text-text-muted text-right font-mono">
                  {note.length}/500
                </div>
              </div>
            </div>

            {/* Card 3: Warnings & Validation */}
            <div className="bg-surface rounded-xl border border-border/80 p-3.5 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 pb-1.5 border-b border-border/60">
                <AlertTriangle className="size-4 text-rose-500" />
                <h4 className="text-xs font-bold text-text">
                  Warnings & Validation
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                {/* Difference Check */}
                <div className="flex items-start gap-2">
                  {difference !== 0 ? (
                    <div className="size-4 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="size-3" />
                    </div>
                  ) : (
                    <div className="size-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="size-3" />
                    </div>
                  )}
                  <div>
                    <div className={`text-[11px] font-bold ${difference !== 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {difference !== 0
                        ? `Cash difference detected: ${difference > 0 ? "+" : ""}${formatCurrency(difference)}`
                        : "No cash difference detected"}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {difference !== 0
                        ? "Please recheck the counted amount."
                        : "Physical cash matches system expectation."}
                    </div>
                  </div>
                </div>

                {/* Frozen Reserve Split Check */}
                <div className="flex items-start gap-2">
                  {frozenValidation.length > 0 ? (
                    <div className="size-4 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="size-3" />
                    </div>
                  ) : totalFrozen > 0 ? (
                    <div className="size-4 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Snowflake className="size-3" />
                    </div>
                  ) : (
                    <div className="size-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="size-3" />
                    </div>
                  )}
                  <div>
                    <div className={`text-[11px] font-bold ${
                      frozenValidation.length > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : totalFrozen > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {frozenValidation.length > 0
                        ? "Frozen count exceeds counted notes"
                        : totalFrozen > 0
                        ? `${formatCurrency(totalFrozen)} to Frozen Vault`
                        : "All counted cash kept as Running"}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {frozenValidation.length > 0
                        ? frozenValidation[0]
                        : totalFrozen > 0
                        ? `${formatCurrency(totalRunning)} remains in drawer for next shift`
                        : "Zero cash moved to frozen reserve"}
                    </div>
                  </div>
                </div>

                {/* Transaction Data Check */}
                <div className="flex items-start gap-2">
                  <div className="size-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="size-3" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      Transaction data loaded
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {totalBills} bills, {formatCurrency(totalSales)} sales
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Dialog Footer (Fixed, shrink-0) ── */}
        <div className="px-6 py-3.5 border-t border-border/60 bg-surface flex items-center justify-between shrink-0">
          <UIButton
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 px-4 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </UIButton>

          {heldBillsCount > 0 ? (
            <UIButton
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                clearAllHeldBills();
              }}
              startIcon={<RotateCcw className="size-4" />}
              className="h-9 px-5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer"
            >
              Clear {heldBillsCount} Held {heldBillsCount === 1 ? "Bill" : "Bills"} to Close Shift
            </UIButton>
          ) : (
            <UIButton
              type="button"
              variant="danger"
              size="sm"
              onClick={handleLockShift}
              isLoading={updateShiftStatusStatus === API_STATUS.LOADING}
              disabled={frozenValidation.length > 0}
              startIcon={<Lock className="size-4" />}
              className="h-9 px-5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Close Shift
            </UIButton>
          )}
        </div>
      </UIModal>

      <PostShiftCloseDialog
        isOpen={showPostClose}
        frozenAmount={closedShiftData?.frozenAtClose ?? totalFrozen}
        runningAmount={closedShiftData?.carryForwardAmount ?? totalRunning}
        onOpenNewShift={() => {
          setShowPostClose(false);
          onClose();
          if (onOpenNewShift) onOpenNewShift();
        }}
        onCreateDayClosing={() => {
          setShowPostClose(false);
          onClose();
          if (onCreateDayClosing) onCreateDayClosing();
        }}
        onClose={() => {
          setShowPostClose(false);
          onClose();
        }}
      />
    </>
  );
};

export default CloseShiftDialog;
