// src/features/operations/business-days/components/CloseBusinessDayDialog.jsx

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeBusinessDay } from "../store/businessDayThunk";
import { clearBusinessDayError, resetCloseBusinessDayStatus } from "../store/businessDaySlice";
import businessDayService from "../services/businessDayService";
import { API_STATUS } from "@/constants";
import {
  UIModal,
  UIButton,
  UIBadge,
  UIEmptyState,
} from "@/components/ui";
import {
  Lock,
  LockKeyhole,
  X,
  Calendar,
  CalendarDays,
  Building2,
  Copy,
  Check,
  AlertTriangle,
  Banknote,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  Eye,
  Plus,
  Minus,
  FileText,
  CheckSquare,
  Users,
  Landmark,
  Sparkles,
} from "lucide-react";
import { ViewShiftDialog } from "../../shifts/components/ViewShiftDialog";
import useBranch from "@/features/branch/hooks/useBranch";

const fmt = (n) =>
  (Number(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

const formatFullDate = (d) => {
  if (!d) return "—";
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return String(d);
  const weekday = parsed.toLocaleDateString("en-US", { weekday: "long" });
  const day = parsed.getDate();
  const month = parsed.toLocaleDateString("en-US", { month: "long" });
  const year = parsed.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
};

export const CloseBusinessDayDialog = ({ isOpen, onClose, businessDay }) => {
  const dispatch = useDispatch();
  const { closeBusinessDayStatus, error } = useSelector((state) => state.businessDay);
  const { currentBranch, branches } = useBranch();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [viewShift, setViewShift] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && businessDay?._id) {
      setLoading(true);
      setNote("");
      setConfirmed(false);
      businessDayService
        .getBusinessDaySummary(businessDay._id)
        .then((res) => {
          setSummary(res.data?.data || res.data);
        })
        .catch(() => setSummary(null))
        .finally(() => setLoading(false));
    } else {
      setSummary(null);
      setNote("");
      setConfirmed(false);
    }
  }, [isOpen, businessDay?._id]);

  useEffect(() => {
    if (closeBusinessDayStatus === API_STATUS.SUCCESS) {
      dispatch(resetCloseBusinessDayStatus());
      onClose();
    }
  }, [closeBusinessDayStatus, dispatch, onClose]);

  const bd = summary || businessDay || {};

  const handleCopyNo = () => {
    if (bd.businessDayNo) {
      navigator.clipboard.writeText(bd.businessDayNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Branch resolution
  const branchObj =
    (typeof bd.branchId === "object" && bd.branchId !== null ? bd.branchId : null) ||
    (typeof bd.branch === "object" && bd.branch !== null ? bd.branch : null);

  const rawBranchId =
    (typeof bd.branchId === "string" ? bd.branchId : bd.branchId?._id) ||
    (typeof bd.branch === "string" ? bd.branch : bd.branch?._id);

  const matchedBranchFromStore =
    branches?.find((b) => String(b._id || b.id) === String(rawBranchId)) ||
    (currentBranch && String(currentBranch._id || currentBranch.id) === String(rawBranchId) ? currentBranch : null);

  const branchName =
    branchObj?.name ||
    branchObj?.branchName ||
    branchObj?.displayName ||
    bd.branchName ||
    matchedBranchFromStore?.name ||
    matchedBranchFromStore?.displayName ||
    currentBranch?.name ||
    "—";

  // Shift processing
  const rawShifts = bd.shifts || [];
  const shiftSummaries = bd.shiftSummaries || [];
  const shifts = rawShifts.map((shift, idx) => {
    const sSummary = shiftSummaries.find((s) => s.shiftId === shift._id) || {};
    const cashier =
      shift.openedBy?.fullName ||
      shift.openedBy?.name ||
      shift.openedBy?.email ||
      shift.cashier?.fullName ||
      shift.cashierName ||
      "—";

    const shiftDeposits =
      Number(sSummary.totalFundDeposits) ||
      Number(shift.totalFundDeposits) ||
      (Array.isArray(shift.manualDeposits)
        ? shift.manualDeposits.reduce((acc, d) => acc + (Number(d.amount) || 0), 0)
        : 0);

    const shiftWithdrawals =
      Number(sSummary.totalFundWithdrawals) ||
      Number(shift.totalFundWithdrawals) ||
      (Array.isArray(shift.manualWithdrawals)
        ? shift.manualWithdrawals.reduce((acc, w) => acc + (Number(w.amount) || 0), 0)
        : 0);

    const openingFloat = Number(shift.openingFloatAmount) || 0;
    const cashSales = Number(sSummary.cashNet || shift.cashNet || shift.netSales || 0);

    const expectedCash =
      Number(sSummary.expectedClosingCashAmount || shift.expectedClosingCashAmount) ||
      (openingFloat + cashSales + shiftDeposits - shiftWithdrawals);

    const actualCash =
      Number(shift.actualClosingCashAmount) ||
      (shift.status === "closed" ? expectedCash : expectedCash);

    return {
      ...shift,
      ...sSummary,
      shiftNo: shift.shiftNo || `SFT-${String(idx + 1).padStart(3, "0")}`,
      shiftName: shift.shiftName || `Shift ${idx + 1}`,
      cashierName: cashier,
      cashierInitials: getInitials(cashier),
      openingFloat,
      cashSales,
      deposits: shiftDeposits,
      withdrawals: shiftWithdrawals,
      netTransfer: shiftDeposits - shiftWithdrawals,
      expectedCash,
      actualCash,
    };
  });

  const openShifts = shifts.filter((s) => s.status === "open");
  const hasOpenShifts = openShifts.length > 0;

  // Financial figures
  const totalSales =
    Number(bd.totalNetSales) ||
    shifts.reduce((acc, s) => acc + (Number(s.netSales) || Number(s.cashSales) || 0), 0);

  const totalCash =
    Number(bd.totalCashNet) ||
    shifts.reduce((acc, s) => acc + Number(s.cashSales || 0), 0);

  const totalDeposits =
    Number(bd.totalDeposits) ||
    shifts.reduce((acc, s) => acc + Number(s.deposits || 0), 0);

  const totalWithdrawals =
    Number(bd.totalWithdrawals) ||
    shifts.reduce((acc, s) => acc + Number(s.withdrawals || 0), 0);

  const upiBankSummary = bd.upiBankSummary || [];
  const totalSettlementUpiAmount =
    Number(bd.totalSettlementUpiAmount) ||
    upiBankSummary.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);
  const totalSettlementUpiCount =
    Number(bd.totalSettlementUpiCount) ||
    upiBankSummary.reduce((acc, b) => acc + (Number(b.transactionCount) || 0), 0);

  const isLoading = closeBusinessDayStatus === API_STATUS.LOADING;

  const handleClose = () => {
    if (!businessDay?._id || !confirmed || hasOpenShifts) return;
    const lastShift = shifts.length > 0 ? shifts[shifts.length - 1] : null;
    const lastShiftActual = lastShift
      ? (lastShift.actualClosingCashAmount ?? lastShift.actualCash ?? lastShift.expectedClosingCashAmount ?? lastShift.expectedCash)
      : undefined;

    dispatch(
      closeBusinessDay({
        id: businessDay._id,
        payload: {
          ...(lastShiftActual !== undefined ? { actualClosingCashAmount: Number(lastShiftActual) } : {}),
          note,
        },
      })
    );
  };

  if (!businessDay) return null;

  return (
    <>
      <UIModal
        isOpen={isOpen}
        onClose={onClose}
        showCloseButton={false}
        className="w-[960px] sm:w-[1000px] lg:w-[1020px] max-w-[95vw] h-[84vh] max-h-[760px] min-h-[540px] rounded-2xl border border-border bg-surface shadow-2xl p-4 sm:p-5 flex flex-col overflow-hidden select-none"
      >
        {/* ── 1. Dialog Header (Fixed, shrink-0) ────────────────────────────── */}
        <div className="flex items-center justify-between w-full shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="size-9 sm:size-9.5 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs ring-1 ring-amber-500/20">
              <Lock className="size-4.5 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-base sm:text-[17px] font-bold text-text tracking-tight leading-none">
                Close Business Day Session
              </h3>
              <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 leading-tight">
                Review summary and finalize the business day
              </p>
            </div>
          </div>

          {/* Circular Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="size-7 sm:size-7.5 rounded-full bg-surface-alt hover:bg-surface-hover text-text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="size-3.5 sm:size-4" />
          </button>
        </div>

        {/* ── 2. Scrollable Body Content (Flex-1) ─────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 my-2 space-y-2.5">
          {/* 2.1 Session Metadata Strip (3 cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Card 1: Business Day No. */}
            <div className="bg-surface border border-border rounded-xl px-3 py-2 flex items-center gap-2.5 shadow-2xs">
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Calendar className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-text-muted font-medium block leading-none">
                  Business Day No.
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono font-bold text-xs text-text truncate">
                    {bd.businessDayNo || "—"}
                  </span>
                  {bd.businessDayNo && (
                    <button
                      type="button"
                      onClick={handleCopyNo}
                      className="text-text-muted hover:text-text transition-colors cursor-pointer"
                      title="Copy session number"
                    >
                      {copied ? (
                        <Check className="size-3 text-emerald-600" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Business Date */}
            <div className="bg-surface border border-border rounded-xl px-3 py-2 flex items-center gap-2.5 shadow-2xs">
              <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Calendar className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-text-muted font-medium block leading-none">
                  Business Date
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 truncate">
                  <span className="font-bold text-xs text-text truncate">
                    {formatFullDate(bd.businessDate)}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    Today
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Branch */}
            <div className="bg-surface border border-border rounded-xl px-3 py-2 flex items-center gap-2.5 shadow-2xs">
              <div className="size-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Building2 className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-text-muted font-medium block leading-none">
                  Branch
                </span>
                <div className="flex items-center gap-1 mt-0.5 text-xs font-bold text-text truncate">
                  <span className="truncate">{branchName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2.2 Warning Notice Banner */}
          <div
            className={`rounded-xl p-2.5 sm:p-3 flex items-start gap-2.5 border transition-all ${
              hasOpenShifts
                ? "bg-rose-500/[0.08] dark:bg-rose-500/10 border-rose-500/25"
                : "bg-amber-500/[0.08] dark:bg-amber-500/10 border-amber-500/25"
            }`}
          >
            <AlertTriangle
              className={`size-4.5 shrink-0 mt-0.5 ${
                hasOpenShifts
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            />
            <div className="min-w-0">
              <h4
                className={`text-xs font-bold leading-tight ${
                  hasOpenShifts
                    ? "text-rose-900 dark:text-rose-200"
                    : "text-amber-900 dark:text-amber-200"
                }`}
              >
                {hasOpenShifts
                  ? `Active Shift Blocker: ${openShifts.length} shift${openShifts.length > 1 ? "s are" : " is"} still open!`
                  : "You are about to close this business day."}
              </h4>
              <p
                className={`text-[11px] leading-tight mt-0.5 ${
                  hasOpenShifts
                    ? "text-rose-800/90 dark:text-rose-300/90"
                    : "text-amber-800/90 dark:text-amber-300/90"
                }`}
              >
                {hasOpenShifts
                  ? "You cannot close the business day session while cashier shifts are active. Please close all active cashier shifts first."
                  : "Please ensure all cashier shifts are closed and all transactions, deposits, and withdrawals are completed."}
              </p>
            </div>
          </div>

          {/* 2.3 Financial Stat Cards (4 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Card 1: Total Sales */}
            <div className="bg-surface border border-border/80 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs">
              <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Banknote className="size-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-text-muted block leading-none">
                  Total Sales
                </span>
                <span className="text-sm font-bold text-text font-mono block mt-1 leading-none truncate">
                  ₱ {fmt(totalSales)}
                </span>
                <span className="text-[9px] text-text-muted block mt-0.5 truncate">
                  All payment methods
                </span>
              </div>
            </div>

            {/* Card 2: Total Cash */}
            <div className="bg-surface border border-border/80 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs">
              <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Wallet className="size-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-text-muted block leading-none">
                  Total Cash
                </span>
                <span className="text-sm font-bold text-text font-mono block mt-1 leading-none truncate">
                  ₱ {fmt(totalCash)}
                </span>
                <span className="text-[9px] text-text-muted block mt-0.5 truncate">
                  Cash sales collected
                </span>
              </div>
            </div>

            {/* Card 3: Total Deposits */}
            <div className="bg-surface border border-border/80 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs">
              <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <ArrowDownToLine className="size-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-text-muted block leading-none">
                  Total Deposits
                </span>
                <span className="text-sm font-bold text-text font-mono block mt-1 leading-none truncate">
                  ₱ {fmt(totalDeposits)}
                </span>
                <span className="text-[9px] text-text-muted block mt-0.5 truncate">
                  Bank slip & manual deposits
                </span>
              </div>
            </div>

            {/* Card 4: Total Withdrawals */}
            <div className="bg-surface border border-border/80 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs">
              <div className="size-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <ArrowUpFromLine className="size-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-text-muted block leading-none">
                  Total Withdrawals
                </span>
                <span className="text-sm font-bold text-text font-mono block mt-1 leading-none truncate">
                  ₱ {fmt(totalWithdrawals)}
                </span>
                <span className="text-[9px] text-text-muted block mt-0.5 truncate">
                  Manual fund withdrawals
                </span>
              </div>
            </div>
          </div>

          {/* 2.4 Shift Status Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                <Clock className="size-3.5 text-text-muted" />
                <span>Shift Status ({shifts.length})</span>
              </div>
            </div>

            <div className="border border-border/80 rounded-xl overflow-hidden bg-surface shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-alt/50 text-[10px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
                      <th className="py-2.5 px-3">Shift Name</th>
                      <th className="py-2.5 px-3">Cashier</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Opening Float</th>
                      <th className="py-2.5 px-3 text-right">Cash Sales</th>
                      <th className="py-2.5 px-3 text-right">Net Transfers</th>
                      <th className="py-2.5 px-3 text-right">Expected Cash</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-text-muted text-xs">
                          Loading shifts data...
                        </td>
                      </tr>
                    ) : shifts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center">
                          <UIEmptyState
                            icon={<Clock className="size-5" />}
                            title="No shifts recorded"
                            description="No cashier shifts were opened under this session."
                            variant="inline"
                            size="sm"
                          />
                        </td>
                      </tr>
                    ) : (
                      shifts.map((row, idx) => {
                        const isRowOpen = row.status === "open";
                        const deposits = Number(row.deposits) || 0;
                        const withdrawals = Number(row.withdrawals) || 0;
                        const netTransfer = deposits - withdrawals;

                        return (
                          <tr
                            key={row._id || idx}
                            className={`transition-colors ${
                              isRowOpen ? "bg-rose-500/[0.04]" : "hover:bg-surface-alt/30"
                            }`}
                          >
                            <td className="py-2.5 px-3 font-semibold text-text whitespace-nowrap">
                              {row.shiftName}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <div className="size-5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                                  {row.cashierInitials}
                                </div>
                                <span className="text-text font-medium text-[10.5px] truncate max-w-[120px]">
                                  {row.cashierName}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold capitalize ${
                                  isRowOpen
                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                }`}
                              >
                                {isRowOpen ? "Open" : "Closed"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-text whitespace-nowrap">
                              ₱ {fmt(row.openingFloat)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-text whitespace-nowrap">
                              ₱ {fmt(row.cashSales)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                              {netTransfer > 0 ? (
                                <span className="inline-flex items-center justify-end gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                  <Plus className="size-3 stroke-[2.5]" />
                                  ₱ {fmt(netTransfer)}
                                </span>
                              ) : netTransfer < 0 ? (
                                <span className="inline-flex items-center justify-end gap-0.5 text-rose-600 dark:text-rose-400 font-bold">
                                  <Minus className="size-3 stroke-[2.5]" />
                                  ₱ {fmt(Math.abs(netTransfer))}
                                </span>
                              ) : (
                                <span className="text-text-muted font-medium">₱ 0.00</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-text whitespace-nowrap font-bold">
                              ₱ {fmt(row.expectedCash)}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setViewShift(row)}
                                className="size-6.5 rounded-lg bg-surface-alt hover:bg-surface-hover text-text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer mx-auto border border-border/60 shadow-2xs"
                                title="View Shift Details"
                                aria-label={`View details for ${row.shiftName}`}
                              >
                                <Eye className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 2.5 Consolidated UPI Settlement Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400" />
                <span>Consolidated UPI Bank Settlement ({upiBankSummary.length} {upiBankSummary.length === 1 ? "Bank" : "Banks"})</span>
              </div>
              {totalSettlementUpiAmount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-mono">
                  Total: ₹ {fmt(totalSettlementUpiAmount)} ({totalSettlementUpiCount} payments)
                </span>
              )}
            </div>

            <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/[0.03] space-y-2">
              <p className="text-[11px] text-text-muted leading-relaxed">
                Upon closing this Business Day, all intra-day UPI collections across all shifts will be consolidated into <strong className="text-text font-semibold">exactly 1 clean Bank Transaction per bank</strong> in Treasury.
              </p>

              {upiBankSummary.length === 0 ? (
                <div className="py-2 text-center text-xs text-text-muted italic">
                  No UPI collections were recorded for this business day.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {upiBankSummary.map((bank, bIdx) => (
                    <div
                      key={bank.bankAccountId || bIdx}
                      className="bg-surface border border-border/80 rounded-lg p-2.5 flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Landmark className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-text truncate">
                            {bank.bankName || "Primary Bank"}
                          </div>
                          <div className="text-[10px] text-text-muted font-mono truncate">
                            {bank.accountNumber ? `A/C: ••••${bank.accountNumber.slice(-4)}` : "Direct Account"} • {bank.transactionCount || 0} payments
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-mono font-bold text-xs text-purple-700 dark:text-purple-300">
                        ₹ {fmt(bank.totalAmount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2.6 Closing Note (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-text">
              <FileText className="size-3.5 text-text-muted" />
              <span>Closing Note (Optional)</span>
            </div>

            <div className="relative">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                placeholder="e.g., Day closed successfully. All deposits done. No pending transactions..."
                rows={2}
                className="w-full bg-surface border border-border/80 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none outline-none text-text placeholder:text-text-muted/60"
              />
              <span className="absolute bottom-2 right-2.5 text-[9.5px] font-mono text-text-muted pointer-events-none">
                {note.length}/500
              </span>
            </div>
          </div>

          {/* 2.7 Confirmation Checkbox Card */}
          <div
            onClick={() => setConfirmed(!confirmed)}
            className={`border rounded-xl p-3 flex items-start gap-3 cursor-pointer select-none transition-all ${
              confirmed
                ? "bg-emerald-500/[0.05] border-emerald-500/30"
                : "bg-surface border-border/80 hover:bg-surface-alt/40"
            }`}
          >
            <div
              className={`size-5 rounded-md flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                confirmed
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "border border-border bg-surface"
              }`}
            >
              {confirmed && <Check className="size-3.5 stroke-[2.8]" />}
            </div>

            <div className="min-w-0">
              <span className="text-xs font-bold text-text leading-tight block">
                I confirm that:
              </span>
              <ul className="space-y-1 text-[10.5px] text-text-muted mt-1 leading-tight">
                <li className="flex items-start gap-1.5">
                  <span className="size-1 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                  <span>All cashier shifts have been closed</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="size-1 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                  <span>All deposits and withdrawals are recorded</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="size-1 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                  <span>All transactions for this business day are complete</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="size-1 rounded-full bg-purple-600 shrink-0 mt-1.5" />
                  <span>
                    Consolidated UPI bank transactions will be posted to Treasury for each receiving bank.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="size-1 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                  <span>
                    I understand that once closed, no new shifts, sales, or transactions can be linked to this business day.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs rounded-xl p-2.5 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => dispatch(clearBusinessDayError())}
                className="text-rose-600 hover:text-rose-700 font-bold ml-2"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* ── 3. Dialog Footer (Fixed, shrink-0) ─────────────────────────────── */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60 shrink-0">
          <UIButton
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8.5 px-4 text-xs font-medium rounded-lg"
          >
            Cancel
          </UIButton>

          <UIButton
            type="button"
            size="sm"
            onClick={handleClose}
            disabled={!confirmed || hasOpenShifts || isLoading}
            isLoading={isLoading}
            startIcon={<LockKeyhole className="size-3.5" />}
            className="h-8.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium border-none shadow-xs text-xs rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            Close Business Day
          </UIButton>
        </div>
      </UIModal>

      {/* Shift details overlay */}
      {viewShift && (
        <ViewShiftDialog
          isOpen={!!viewShift}
          onClose={() => setViewShift(null)}
          shift={viewShift}
        />
      )}
    </>
  );
};

export default CloseBusinessDayDialog;


