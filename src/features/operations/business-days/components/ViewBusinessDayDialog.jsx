// src/features/operations/business-days/components/ViewBusinessDayDialog.jsx

import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/services";
import {
  UIModal,
  UIButton,
  UIBadge,
  UIEmptyState,
  UISearchInput,
} from "@/components/ui";
import {
  CalendarDays,
  Calendar,
  Clock,
  ArrowLeftRight,
  Copy,
  Check,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  X,
  Banknote,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Percent,
  BarChart2,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  LockKeyhole,
  Plus,
  Minus,
  Eye,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Info,
  CheckSquare,
  Landmark,
  ExternalLink,
} from "lucide-react";
import { ViewShiftDialog } from "../../shifts/components/ViewShiftDialog";
import { CloseBusinessDayDialog } from "./CloseBusinessDayDialog";
import useBranch from "@/features/branch/hooks/useBranch";
import { useBranchCash } from "@/features/finance/treasury/cash-management/branch-cash/hooks/useBranchCash";

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

const formatShortDate = (d) => {
  if (!d) return "—";
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return String(d);
  const weekday = parsed.toLocaleDateString("en-US", { weekday: "short" });
  const day = parsed.getDate();
  const month = parsed.toLocaleDateString("en-US", { month: "short" });
  const year = parsed.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
};

const formatDateTime = (d) => {
  if (!d) return "—";
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return String(d);
  const day = parsed.getDate();
  const month = parsed.toLocaleDateString("en-US", { month: "short" });
  const year = parsed.getFullYear();
  const time = parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${day} ${month} ${year}, ${time}`;
};

const TABS = [
  { id: "overview", label: "Overview", icon: CalendarDays },
  { id: "shifts", label: "Shifts", icon: Clock },
  { id: "transfers", label: "Fund Transfers", icon: ArrowLeftRight },
];

export const ViewBusinessDayDialog = ({
  isOpen,
  onClose,
  businessDay,
  onRequestCloseDay,
}) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [viewShift, setViewShift] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isCloseDayModalOpen, setIsCloseDayModalOpen] = useState(false);

  const { currentBranch, branches } = useBranch();
  const { currentBranchCash, fetchBranchCash } = useBranchCash();

  // Fund Transfers tab state
  const [transferFilter, setTransferFilter] = useState("all");
  const [transferSearch, setTransferSearch] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const bd = summary || businessDay || {};

  const rawBranchId =
    (typeof bd.branchId === "string" ? bd.branchId : bd.branchId?._id) ||
    (typeof bd.branch === "string" ? bd.branch : bd.branch?._id) ||
    (typeof businessDay?.branchId === "string" ? businessDay.branchId : businessDay?.branchId?._id);

  useEffect(() => {
    if (isOpen && rawBranchId) {
      fetchBranchCash(rawBranchId);
    }
  }, [isOpen, rawBranchId, fetchBranchCash]);

  useEffect(() => {
    if (isOpen && businessDay?._id) {
      setLoading(true);
      setActiveTab("overview");
      apiClient
        .get(`/operations/business-days/${businessDay._id}/summary`)
        .then((res) => {
          const data = res.data?.data || res.data;
          setSummary(data);

          const deposits = (data?.deposits || []).map((t, idx) => ({
            ...t,
            type: "Deposit",
            transferType: "deposit",
            refNo: t.transferNumber || t.referenceNo || `DEP-${String(idx + 1).padStart(3, "0")}`,
            date: t.transferDate || t.createdAt || data.businessDate,
          }));
          const withdrawals = (data?.withdrawals || []).map((t, idx) => ({
            ...t,
            type: "Withdrawal",
            transferType: "withdrawal",
            refNo: t.transferNumber || t.referenceNo || `WDL-${String(idx + 1).padStart(3, "0")}`,
            date: t.transferDate || t.createdAt || data.businessDate,
          }));
          const slips = (data?.bankSlips || []).map((b, idx) => ({
            ...b,
            type: "Bank Slip",
            transferType: "bank_slip",
            refNo: b.slipNumber || b.referenceNo || `BDS-${String(idx + 1).padStart(3, "0")}`,
            date: b.slipDate || b.createdAt || data.businessDate,
            amount: Number(b.amount) || 0,
            toAccountName: b.toBankAccountId?.accountName || b.bankName || "Bank Account",
          }));
          const all = [...deposits, ...withdrawals, ...slips].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );
          if (all.length > 0) {
            setSelectedTransfer(all[0]);
          }
        })
        .catch(() => setSummary(null))
        .finally(() => setLoading(false));
    } else {
      setSummary(null);
      setSelectedTransfer(null);
    }
  }, [isOpen, businessDay]);

  const isOpen_ = bd.status === "open";
  const isClosed = bd.status === "closed";

  const handleCopyNo = () => {
    if (bd.businessDayNo) {
      navigator.clipboard.writeText(bd.businessDayNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Real "Opened By" user details
  const openedByName =
    bd.createdBy?.fullName ||
    bd.createdBy?.name ||
    bd.createdBy?.email ||
    "—";
  const openedByRole = bd.createdBy?.role || "Staff";
  const openedByInitials = getInitials(openedByName);

  // Real Shifts
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
    return {
      ...shift,
      ...sSummary,
      totalFundDeposits: shiftDeposits,
      totalFundWithdrawals: shiftWithdrawals,
      shiftNo: shift.shiftNo || `SFT-${String(idx + 1).padStart(3, "0")}`,
      shiftName: shift.shiftName || `Shift ${idx + 1}`,
      cashierName: cashier,
      cashierInitials: getInitials(cashier),
    };
  });

  const totalShiftsCount = shifts.length;
  const closedShiftsCount = shifts.filter((s) => s.status === "closed").length;
  const openShiftsCount = shifts.filter((s) => s.status === "open").length;
  const cancelledShiftsCount = shifts.filter((s) => s.status === "cancelled").length;

  // Real Shift Totals
  const totalShiftFloat = shifts.reduce((acc, s) => acc + (Number(s.openingFloatAmount) || 0), 0);
  const totalShiftSales = shifts.reduce((acc, s) => acc + (Number(s.cashNet) || Number(s.netSales) || 0), 0);
  const totalShiftDeposits = shifts.reduce((acc, s) => acc + (Number(s.totalFundDeposits) || 0), 0);
  const totalShiftWithdrawals = shifts.reduce((acc, s) => acc + (Number(s.totalFundWithdrawals) || 0), 0);

  // Real Financial figures from backend session aggregation
  const totalSales = Number(bd.totalNetSales) || 0;
  const totalCash = Number(bd.totalCashNet) || 0;
  const totalDeposits = Number(bd.totalDeposits) || totalShiftDeposits || 0;
  const totalWithdrawals = Number(bd.totalWithdrawals) || totalShiftWithdrawals || 0;

  const upiSettlementStatus = bd.upiSettlementStatus || "PENDING";
  const isUpiSettled = upiSettlementStatus === "SETTLED" || (Array.isArray(bd.upiBankBreakdown) && bd.upiBankBreakdown.length > 0);
  const upiBankBreakdown = (Array.isArray(bd.upiBankBreakdown) && bd.upiBankBreakdown.length > 0)
    ? bd.upiBankBreakdown
    : (Array.isArray(bd.upiBankSummary) ? bd.upiBankSummary : []);
  const totalSettlementUpiAmount =
    Number(bd.totalUpiAmount) ||
    Number(bd.totalSettlementUpiAmount) ||
    upiBankBreakdown.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const totalSettlementUpiCount =
    Number(bd.totalUpiTransactions) ||
    Number(bd.totalSettlementUpiCount) ||
    upiBankBreakdown.reduce((sum, b) => sum + (Number(b.transactionCount) || 0), 0);

  // Real Bank Deposit Slips data
  const rawBankSlipsList = bd.bankSlips || [];
  const rawBankSlips = rawBankSlipsList.map((b, i) => {
    const creator =
      b.createdBy?.fullName ||
      b.createdBy?.name ||
      b.createdBy?.email ||
      b.createdBy ||
      "—";
    const toAccount =
      b.toBankAccountId?.accountName ||
      b.toBankAccountId?.bankName ||
      b.bankName ||
      "Bank Account";
    const accNumber = b.toBankAccountId?.accountNumber
      ? `(${b.toBankAccountId.accountNumber})`
      : "";
    return {
      ...b,
      id: b._id || `slip-${i}`,
      type: "Bank Slip",
      transferType: "bank_slip",
      refNo: b.slipNumber || b.referenceNo || `BDS-${String(i + 1).padStart(3, "0")}`,
      amount: Number(b.amount) || 0,
      date: b.slipDate || b.createdAt || bd.businessDate,
      shiftName: "Branch Vault",
      creatorName: creator,
      creatorRole: b.createdBy?.role || "Staff",
      creatorInitials: getInitials(creator),
      toAccountName: `${toAccount} ${accNumber}`.trim(),
      notes:
        b.narration ||
        b.remarks ||
        b.notes ||
        "Bank deposit slip created from branch vault reserve",
    };
  });

  const totalBankSlipsAmount =
    Number(bd.totalBankSlipsAmount) ||
    rawBankSlips.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const bankSlipsCount =
    Number(bd.bankSlipsCount) ||
    rawBankSlips.length;

  // Live Branch Cash (drawer & vault)
  const liveRunningCash =
    bd.branchCash?.runningCash ??
    currentBranchCash?.runningCash ??
    0;
  const liveFrozenCash =
    bd.branchCash?.frozenCash ??
    currentBranchCash?.frozenCash ??
    0;
  const liveTotalCash = liveRunningCash + liveFrozenCash;

  const expectedClosingCash =
    Number(bd.expectedClosingCashAmount) ||
    (Number(bd.openingFloatAmount || totalShiftFloat) + totalCash + totalDeposits - totalWithdrawals);
  const actualClosingCash = Number(bd.actualClosingCashAmount) || 0;
  const cashDifference = isClosed ? actualClosingCash - expectedClosingCash : totalDeposits - totalWithdrawals;

  // Real Branch resolution
  const branchObj =
    (typeof bd.branchId === "object" && bd.branchId !== null ? bd.branchId : null) ||
    (typeof bd.branch === "object" && bd.branch !== null ? bd.branch : null);

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
    matchedBranchFromStore?.branchName ||
    currentBranch?.name ||
    currentBranch?.displayName ||
    currentBranch?.branchName ||
    "—";

  const branchCode =
    branchObj?.branchCode ||
    matchedBranchFromStore?.branchCode ||
    currentBranch?.branchCode ||
    null;

  // Real Fund Transfers data
  const rawDeposits = (bd.deposits || []).map((d, i) => {
    const creator =
      d.createdBy?.fullName ||
      d.createdBy?.name ||
      d.createdBy ||
      "—";
    return {
      ...d,
      id: d._id || `dep-${i}`,
      type: "Deposit",
      refNo: d.transferNumber || d.referenceNo || `DEP-${String(i + 1).padStart(3, "0")}`,
      amount: Number(d.amount) || 0,
      date: d.transferDate || d.createdAt || bd.businessDate,
      shiftName: d.shiftName || (d.shiftId ? `Shift ${d.shiftId}` : "—"),
      creatorName: creator,
      creatorRole: d.createdBy?.role || "Staff",
      creatorInitials: getInitials(creator),
      notes: d.narration || d.notes || d.remarks || "—",
    };
  });

  const rawWithdrawals = (bd.withdrawals || []).map((w, i) => {
    const creator =
      w.createdBy?.fullName ||
      w.createdBy?.name ||
      w.createdBy ||
      "—";
    return {
      ...w,
      id: w._id || `wdl-${i}`,
      type: "Withdrawal",
      refNo: w.transferNumber || w.referenceNo || `WDL-${String(i + 1).padStart(3, "0")}`,
      amount: Number(w.amount) || 0,
      date: w.transferDate || w.createdAt || bd.businessDate,
      shiftName: w.shiftName || (w.shiftId ? `Shift ${w.shiftId}` : "—"),
      creatorName: creator,
      creatorRole: w.createdBy?.role || "Staff",
      creatorInitials: getInitials(creator),
      notes: w.narration || w.notes || w.remarks || "—",
    };
  });

  const allTransfers = useMemo(() => {
    return [...rawDeposits, ...rawWithdrawals, ...rawBankSlips].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [rawDeposits, rawWithdrawals, rawBankSlips]);

  const filteredTransfers = useMemo(() => {
    return allTransfers.filter((t) => {
      if (transferFilter === "deposit" && t.type !== "Deposit") return false;
      if (transferFilter === "withdrawal" && t.type !== "Withdrawal") return false;
      if (transferFilter === "bank_slip" && t.type !== "Bank Slip") return false;
      if (transferSearch.trim()) {
        const q = transferSearch.toLowerCase();
        const matchesRef = t.refNo?.toLowerCase().includes(q);
        const matchesType = t.type?.toLowerCase().includes(q);
        const matchesCreator = t.creatorName?.toLowerCase().includes(q);
        const matchesAccount = t.toAccountName?.toLowerCase().includes(q);
        if (!matchesRef && !matchesType && !matchesCreator && !matchesAccount) return false;
      }
      return true;
    });
  }, [allTransfers, transferFilter, transferSearch]);

  const activeTransferItem =
    selectedTransfer || (filteredTransfers.length > 0 ? filteredTransfers[0] : null);

  const netTransferAmount = totalDeposits - totalWithdrawals;

  return (
    <>
      <UIModal
        isOpen={isOpen && !!businessDay}
        onClose={onClose}
        showCloseButton={false}
        className="w-[960px] sm:w-[1000px] lg:w-[1020px] max-w-[95vw] h-[82vh] max-h-[700px] min-h-[580px] rounded-2xl border border-border bg-surface shadow-2xl p-4 sm:p-5 flex flex-col overflow-hidden select-none"
      >
        {/* ── 1. Dialog Header (Fixed, shrink-0) ────────────────────────────── */}
        <div className="flex items-center justify-between w-full shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="size-9 sm:size-9.5 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs ring-1 ring-emerald-500/20">
              <CalendarDays className="size-4.5 stroke-[2]" />
            </div>

            <div>
              <h3 className="text-base sm:text-[17px] font-bold text-text tracking-tight leading-none">
                Business Day Details
              </h3>
              <p className="text-[11px] sm:text-xs text-text-muted mt-0.5 leading-tight">
                Complete session information, financial summary and related activities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Status Live Pill Box */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-xl border transition-all ${
                isOpen_
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400"
                  : isClosed
                  ? "bg-surface-alt border-border text-text"
                  : "bg-rose-500/10 border-rose-500/25 text-rose-600"
              }`}
            >
              <div
                className={`size-2 rounded-full ${
                  isOpen_
                    ? "bg-emerald-500 animate-pulse ring-2 ring-emerald-500/20"
                    : "bg-text-muted"
                }`}
              />
              <div className="text-left">
                <span className="text-xs font-bold leading-none block">
                  {isOpen_ ? "Open" : isClosed ? "Closed" : bd.status || "—"}
                </span>
                <span className="text-[9.5px] text-text-muted leading-none block mt-0.5">
                  {isOpen_ ? "Live Session" : "Session Closed"}
                </span>
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
        </div>

        {/* ── 2. Session Metadata Strip (Fixed, shrink-0) ───────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-2.5 shrink-0">
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
                {bd.businessDate && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    Session
                  </span>
                )}
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
                {branchCode && (
                  <span className="text-[10px] font-mono text-text-muted font-normal shrink-0">
                    ({branchCode})
                  </span>
                )}
                <ChevronRight className="size-3.5 text-text-muted shrink-0 ml-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Tabs Navigation Bar (Full Width Grid, Centered Tabs) ───────── */}
        <div className="grid grid-cols-3 w-full border-b border-border/70 shrink-0 mb-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-center gap-2 pb-2 text-xs font-semibold cursor-pointer transition-all border-b-2 -mb-[1px] w-full text-center ${
                activeTab === id
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400"
                  : "border-transparent text-text-muted hover:text-text"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── 4. Tab Content Area (Flex-1, Scrollable, Non-Jumping Container) ─── */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-16 text-center text-text-muted space-y-2">
              <div className="size-6 border-2 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium">Loading session details...</p>
            </div>
          ) : (
            <>
              {/* ════════ TAB 1: OVERVIEW ════════ */}
              {activeTab === "overview" && (
                <div className="space-y-2.5">
                  {/* Two-Column Grid: Session Information + Financial Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    {/* Left Column (5/12): Session Information */}
                    <div className="lg:col-span-5 bg-surface border border-border/80 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-text mb-2.5">
                          <Calendar className="size-3.5 text-text-muted" />
                          <span>Session Information</span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-text-muted text-[11px]">Status</span>
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              {isOpen_ ? "Open" : isClosed ? "Closed" : bd.status || "—"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-text-muted text-[11px]">Branch</span>
                            <span className="font-semibold text-text text-[11.5px] truncate max-w-[200px]">
                              {branchName} {branchCode ? `(${branchCode})` : ""}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-text-muted text-[11px]">Business Day No.</span>
                            <span className="font-mono font-bold text-text text-[11.5px]">
                              {bd.businessDayNo || "—"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-text-muted text-[11px]">Business Date</span>
                            <span className="font-medium text-text text-[11.5px]">
                              {formatShortDate(bd.businessDate)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-text-muted text-[11px]">Actual Opened At</span>
                            <span className="font-medium text-text text-[11px]">
                              {formatDateTime(bd.actualOpenedAt)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-text-muted text-[11px]">Actual Closed At</span>
                            <span className="font-medium text-text text-[11px]">
                              {bd.actualClosedAt ? formatDateTime(bd.actualClosedAt) : "—"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-0.5">
                            <span className="text-text-muted text-[11px]">Opened By</span>
                            <div className="flex items-center gap-1.5">
                              <div className="size-5.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[9.5px] font-bold flex items-center justify-center shrink-0">
                                {openedByInitials}
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-text text-[11px] block leading-none">
                                  {openedByName}
                                </span>
                                <span className="text-[9.5px] text-text-muted block leading-none mt-0.5 capitalize">
                                  {openedByRole}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start justify-between pt-1 border-t border-border/50">
                            <span className="text-text-muted text-[11px] shrink-0">Note</span>
                            <span className="text-[11px] text-text text-right max-w-[200px] truncate leading-tight">
                              {bd.note || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (7/12): Financial Summary */}
                    <div className="lg:col-span-7 bg-surface border border-border/80 rounded-xl p-3 shadow-2xs">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                          <BarChart2 className="size-3.5 text-text-muted" />
                          <span>Financial Summary</span>
                        </div>
                        <UIButton
                          variant="outline"
                          size="xs"
                          onClick={() => setActiveTab("shifts")}
                          className="h-6 px-2 text-[10.5px] rounded-md font-medium"
                        >
                          View Details
                        </UIButton>
                      </div>

                      {/* Live Branch Cash Balances Strip */}
                      <div className="bg-emerald-500/[0.05] border border-emerald-500/20 rounded-xl p-2 mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="size-6.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Landmark className="size-3.5" />
                          </div>
                          <div className="min-w-0 truncate">
                            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider block leading-none truncate">
                              Branch Cash Balances
                            </span>
                            <span className="text-[9px] text-text-muted mt-0.5 block leading-none truncate">
                              Live drawer and vault reserve
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-right font-mono shrink-0">
                          <div>
                            <span className="text-[8.5px] text-text-muted block leading-none">Running Drawer</span>
                            <span className="font-bold text-[10.5px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                              ₱ {fmt(liveRunningCash)}
                            </span>
                          </div>
                          <div className="h-4.5 w-px bg-border/80" />
                          <div>
                            <span className="text-[8.5px] text-text-muted block leading-none">Frozen Vault</span>
                            <span className="font-bold text-[10.5px] text-blue-600 dark:text-blue-400 block mt-0.5">
                              ₱ {fmt(liveFrozenCash)}
                            </span>
                          </div>
                          <div className="h-4.5 w-px bg-border/80" />
                          <div>
                            <span className="text-[8.5px] text-text-muted block leading-none">Total Cash</span>
                            <span className="font-bold text-[10.5px] text-text block mt-0.5">
                              ₱ {fmt(liveTotalCash)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 8 Real Metric Stat Cards Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* 1. Total Sales */}
                        <div className="bg-surface-alt/40 border border-border/60 rounded-xl p-2 flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Banknote className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-text-muted font-medium block leading-none">
                              Total Sales
                            </span>
                            <span className="font-bold text-xs text-text font-mono block mt-0.5 truncate">
                              ₱ {fmt(totalSales)}
                            </span>
                          </div>
                        </div>

                        {/* 2. Total Cash */}
                        <div className="bg-surface-alt/40 border border-border/60 rounded-xl p-2 flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Wallet className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-text-muted font-medium block leading-none">
                              Total Cash
                            </span>
                            <span className="font-bold text-xs text-text font-mono block mt-0.5 truncate">
                              ₱ {fmt(totalCash)}
                            </span>
                          </div>
                        </div>

                        {/* 3. Total Deposits */}
                        <div className="bg-surface-alt/40 border border-border/60 rounded-xl p-2 flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <ArrowDownToLine className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-text-muted font-medium block leading-none">
                              Total Deposits ({rawDeposits.length})
                            </span>
                            <span className="font-bold text-xs text-text font-mono block mt-0.5 truncate">
                              ₱ {fmt(totalDeposits)}
                            </span>
                          </div>
                        </div>

                        {/* 4. Total Withdrawals */}
                        <div className="bg-surface-alt/40 border border-border/60 rounded-xl p-2 flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                            <ArrowUpFromLine className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-text-muted font-medium block leading-none">
                              Total Withdrawals ({rawWithdrawals.length})
                            </span>
                            <span className="font-bold text-xs text-text font-mono block mt-0.5 truncate">
                              ₱ {fmt(totalWithdrawals)}
                            </span>
                          </div>
                        </div>

                        {/* 5. Net Transfers */}
                        <div className="bg-surface-alt/40 border border-border/60 rounded-xl p-2 flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <ArrowLeftRight className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-text-muted font-medium block leading-none">
                              Net Transfers
                            </span>
                            <span
                              className={`font-bold text-xs font-mono block mt-0.5 truncate ${
                                netTransferAmount > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : netTransferAmount < 0
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-text"
                              }`}
                            >
                              {netTransferAmount > 0 ? "+" : ""}{netTransferAmount < 0 ? "- " : ""}₱ {fmt(Math.abs(netTransferAmount))}
                            </span>
                          </div>
                        </div>

                        {/* 6. Bank Deposit Slips */}
                        <div className="bg-surface-alt/40 border border-border/60 rounded-xl p-2 flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <Landmark className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-text-muted font-medium block leading-none">
                              Bank Slips ({bankSlipsCount})
                            </span>
                            <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400 font-mono block mt-0.5 truncate">
                              ₱ {fmt(totalBankSlipsAmount)}
                            </span>
                          </div>
                        </div>

                        {/* 7. Expected Closing Cash */}
                        <div className="bg-surface-alt/40 border border-border/60 rounded-xl p-2 flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                            <Percent className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-text-muted font-medium block leading-none">
                              Expected Closing Cash
                            </span>
                            <span className="font-bold text-xs text-text font-mono block mt-0.5 truncate">
                              ₱ {fmt(expectedClosingCash)}
                            </span>
                          </div>
                        </div>

                        {/* 8. Cash Difference */}
                        <div className="bg-surface-alt/40 border border-border/60 rounded-xl p-2 flex items-center gap-2">
                          <div className="size-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <Percent className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-text-muted font-medium block leading-none">
                              Cash Difference
                            </span>
                            <span
                              className={`font-bold text-xs font-mono block mt-0.5 truncate ${
                                cashDifference < 0 ? "text-rose-600" : "text-emerald-600"
                              }`}
                            >
                              {cashDifference < 0 ? "- " : ""}₱ {fmt(Math.abs(cashDifference))}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Day-End Summary Info Banner */}
                      <div className="bg-blue-500/[0.06] border border-blue-500/15 rounded-xl p-2 flex items-start gap-2 mt-2">
                        <div className="size-4.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Info className="size-3" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-[11px] font-bold text-text leading-tight">
                            Day-End Summary
                          </h5>
                          <p className="text-[10px] text-text-muted leading-tight mt-0.5">
                            Final financial totals will be calculated when this business day is closed after all shifts are completed.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Consolidated UPI Bank Settlement Card */}
                  <div className="bg-surface border border-border/80 rounded-xl p-3 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-6.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                          <Sparkles className="size-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-text flex items-center gap-2">
                            <span>Consolidated UPI Bank Settlement</span>
                            <span
                              className={`text-[9.5px] font-bold px-2 py-0.2 rounded-full border ${
                                isUpiSettled
                                  ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {isUpiSettled ? "Settled in Treasury" : "Pending Day Close"}
                            </span>
                          </div>
                          <span className="text-[10px] text-text-muted">
                            {isUpiSettled
                              ? `All intra-day UPI collections settled into exactly 1 bank transaction per bank.`
                              : `Intra-day UPI held in clearing. Will be consolidated into 1 bank transaction per bank upon Day Close.`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {totalSettlementUpiAmount > 0 && (
                          <div className="text-right font-mono font-bold text-xs text-purple-700 dark:text-purple-300">
                            ₹ {fmt(totalSettlementUpiAmount)}
                            <span className="text-[10px] text-text-muted font-normal block">
                              {totalSettlementUpiCount} payments
                            </span>
                          </div>
                        )}
                        <Link
                          to={`/finance/treasury/bank-transactions${bd._id ? `?businessDayId=${bd._id}` : ""}`}
                          className="h-7 px-2.5 text-[11px] font-medium rounded-lg border border-border/80 bg-surface-alt hover:bg-surface-hover text-text flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="Open Treasury Bank Transactions"
                        >
                          Treasury <ExternalLink className="size-3" />
                        </Link>
                      </div>
                    </div>

                    {upiBankBreakdown.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 border-t border-border/50">
                        {upiBankBreakdown.map((bank, bIdx) => (
                          <div
                            key={bank.bankAccountId || bIdx}
                            className="bg-surface-alt/40 border border-border/60 rounded-lg p-2.5 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="size-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                <Landmark className="size-3.5" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-text block truncate">
                                  {bank.bankName || "Bank Account"}
                                </span>
                                <span className="text-[10px] text-text-muted font-mono truncate block">
                                  {bank.accountNumber ? `••••${bank.accountNumber.slice(-4)}` : "Direct"} • {bank.transactionCount || 0} payments
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0 font-mono font-bold text-xs text-text">
                              ₹ {fmt(bank.totalAmount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-xs text-text-muted italic border-t border-border/50">
                        No UPI collections recorded under this session.
                      </div>
                    )}
                  </div>

                  {/* Bottom Workflow & Rules Strip */}
                  <div className="bg-emerald-500/[0.03] dark:bg-surface-alt/30 border border-border/80 rounded-xl p-2.5 sm:p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="size-5.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Sparkles className="size-3" />
                      </div>
                      <h4 className="text-xs font-bold text-text leading-tight">
                        Session Workflow & Rules
                      </h4>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div className="flex items-start gap-2">
                        <div className="size-5.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Clock className="size-3" />
                        </div>
                        <div>
                          <h5 className="text-[11px] font-bold text-text leading-tight">Cashier Shifts</h5>
                          <p className="text-[9.5px] text-text-muted leading-tight mt-0.5">
                            All cashier shifts created today automatically link to this Business Day.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="size-5.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Stethoscope className="size-3" />
                        </div>
                        <div>
                          <h5 className="text-[11px] font-bold text-text leading-tight">Sales & Deposits</h5>
                          <p className="text-[9.5px] text-text-muted leading-tight mt-0.5">
                            Sales, treasury deposits, and bank slip transfers track under this date.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="size-5.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldCheck className="size-3" />
                        </div>
                        <div>
                          <h5 className="text-[11px] font-bold text-text leading-tight">Day-end Closing</h5>
                          <p className="text-[9.5px] text-text-muted leading-tight mt-0.5">
                            Day-end closing locks financial records after all shifts complete.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════ TAB 2: SHIFTS ════════ */}
              {activeTab === "shifts" && (
                <div className="space-y-2.5">
                  {/* Header row: Cashier Shifts (count) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                      <Clock className="size-3.5 text-text-muted" />
                      <span>Cashier Shifts ({totalShiftsCount})</span>
                    </div>
                  </div>

                  {/* 4 Mini Stat Summary Cards */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-surface border border-border/80 rounded-xl p-2 flex items-center gap-2.5 shadow-2xs">
                      <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Users className="size-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-text block leading-none">
                          {totalShiftsCount}
                        </span>
                        <span className="text-[10px] text-text-muted block leading-none mt-1">
                          Total Shifts
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface border border-border/80 rounded-xl p-2 flex items-center gap-2.5 shadow-2xs">
                      <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckSquare className="size-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-text block leading-none">
                          {closedShiftsCount}
                        </span>
                        <span className="text-[10px] text-text-muted block leading-none mt-1">
                          Closed Shifts
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface border border-border/80 rounded-xl p-2 flex items-center gap-2.5 shadow-2xs">
                      <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Clock className="size-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-text block leading-none">
                          {openShiftsCount}
                        </span>
                        <span className="text-[10px] text-text-muted block leading-none mt-1">
                          Open Shift
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface border border-border/80 rounded-xl p-2 flex items-center gap-2.5 shadow-2xs">
                      <div className="size-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <XCircle className="size-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-rose-600 block leading-none">
                          {cancelledShiftsCount}
                        </span>
                        <span className="text-[10px] text-rose-600 block leading-none mt-1">
                          Cancelled Shifts
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cashier Shifts Data Table */}
                  <div className="border border-border/80 rounded-xl overflow-hidden bg-surface shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="border-b border-border bg-surface-alt/50 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            <th className="py-2 px-3">Shift Name</th>
                            <th className="py-2 px-3">Cashier</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Timeline</th>
                            <th className="py-2 px-3 text-right">Opening Float</th>
                            <th className="py-2 px-3 text-right">Cash Sales</th>
                            <th className="py-2 px-3 text-right">Net Transfers</th>
                            <th className="py-2 px-3 text-right">Expected Cash</th>
                            <th className="py-2 px-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {shifts.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-10 text-center">
                                <UIEmptyState
                                  icon={<Clock className="size-5" />}
                                  title="No shifts recorded"
                                  description="No cashier shifts have been created under this business day yet."
                                  variant="inline"
                                  size="sm"
                                />
                              </td>
                            </tr>
                          ) : (
                            shifts.map((row, idx) => {
                              const isRowOpen = row.status === "open";
                              const openTime = row.openedAt
                                ? new Date(row.openedAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—";
                              const closeTime = row.closedAt
                                ? new Date(row.closedAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : isRowOpen
                                ? "Active"
                                : "—";

                              const deposits = Number(row.totalFundDeposits) || 0;
                              const withdrawals = Number(row.totalFundWithdrawals) || 0;
                              const netTransfer = deposits - withdrawals;

                              return (
                                <tr key={row._id || idx} className="hover:bg-surface-alt/30 transition-colors">
                                  <td className="py-2 px-3 font-semibold text-text whitespace-nowrap">
                                    {row.shiftName}
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="flex items-center gap-1.5">
                                      <div className="size-5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                                        {row.cashierInitials}
                                      </div>
                                      <span className="text-text truncate max-w-[100px] font-medium">
                                        {row.cashierName}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3">
                                    <span
                                      className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9.5px] font-bold capitalize ${
                                        isRowOpen
                                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                      }`}
                                    >
                                      {row.status}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 font-mono text-[9.5px] text-text-muted leading-tight whitespace-nowrap">
                                    <div>{openTime}</div>
                                    <div className={isRowOpen ? "text-blue-600 dark:text-blue-400 font-medium" : ""}>{closeTime}</div>
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-text whitespace-nowrap">
                                    ₱ {fmt(row.openingFloatAmount || 0)}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-text whitespace-nowrap">
                                    ₱ {fmt(row.cashNet || row.netSales || 0)}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono whitespace-nowrap">
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
                                  <td className="py-2 px-3 text-right font-mono text-text font-bold whitespace-nowrap">
                                    ₱ {fmt(row.expectedCashAmount || row.expectedClosingCashAmount || 0)}
                                  </td>
                                  <td className="py-2 px-3 text-center whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => setViewShift(row)}
                                      className="size-6.5 rounded-lg bg-surface-alt hover:bg-surface-hover text-text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer mx-auto border border-border/60 shadow-2xs"
                                      title="View shift details"
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

                  {/* Bottom Split: Shift Summary + Shift Rules */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Left (6/12): Shift Summary */}
                    <div className="sm:col-span-6 bg-surface border border-border/80 rounded-xl p-2.5 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-text mb-2">
                        <BarChart2 className="size-3.5 text-text-muted" />
                        <span>Shift Summary</span>
                      </div>

                      <div className="grid grid-cols-5 gap-1 text-center">
                        <div className="bg-surface-alt/40 border border-border/50 rounded-lg p-1.5">
                          <div className="size-5 rounded-full bg-blue-500/10 text-blue-600 mx-auto flex items-center justify-center mb-1">
                            <Banknote className="size-3" />
                          </div>
                          <span className="font-mono font-bold text-[10px] text-text block leading-none truncate">
                            ₱ {fmt(bd.openingFloatAmount || totalShiftFloat)}
                          </span>
                          <span className="text-[8px] text-text-muted block mt-0.5 leading-tight truncate">
                            Total Float
                          </span>
                        </div>

                        <div className="bg-surface-alt/40 border border-border/50 rounded-lg p-1.5">
                          <div className="size-5 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center mb-1">
                            <Wallet className="size-3" />
                          </div>
                          <span className="font-mono font-bold text-[10px] text-text block leading-none truncate">
                            ₱ {fmt(bd.totalCashNet || totalShiftSales)}
                          </span>
                          <span className="text-[8px] text-text-muted block mt-0.5 leading-tight truncate">
                            Total Sales
                          </span>
                        </div>

                        <div className="bg-surface-alt/40 border border-border/50 rounded-lg p-1.5">
                          <div className="size-5 rounded-full bg-purple-500/10 text-purple-600 mx-auto flex items-center justify-center mb-1">
                            <ArrowDownToLine className="size-3" />
                          </div>
                          <span className="font-mono font-bold text-[10px] text-text block leading-none truncate">
                            ₱ {fmt(totalDeposits)}
                          </span>
                          <span className="text-[8px] text-text-muted block mt-0.5 leading-tight truncate">
                            Deposits
                          </span>
                        </div>

                        <div className="bg-surface-alt/40 border border-border/50 rounded-lg p-1.5">
                          <div className="size-5 rounded-full bg-orange-500/10 text-orange-600 mx-auto flex items-center justify-center mb-1">
                            <ArrowUpFromLine className="size-3" />
                          </div>
                          <span className="font-mono font-bold text-[10px] text-text block leading-none truncate">
                            ₱ {fmt(totalWithdrawals)}
                          </span>
                          <span className="text-[8px] text-text-muted block mt-0.5 leading-tight truncate">
                            Withdraw
                          </span>
                        </div>

                        <div className="bg-surface-alt/40 border border-border/50 rounded-lg p-1.5">
                          <div className="size-5 rounded-full bg-indigo-500/10 text-indigo-600 mx-auto flex items-center justify-center mb-1">
                            <Landmark className="size-3" />
                          </div>
                          <span className="font-mono font-bold text-[10px] text-indigo-600 dark:text-indigo-400 block leading-none truncate">
                            ₱ {fmt(totalBankSlipsAmount)}
                          </span>
                          <span className="text-[8px] text-text-muted block mt-0.5 leading-tight truncate">
                            Bank Slips
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right (6/12): Shift Rules */}
                    <div className="sm:col-span-6 bg-emerald-500/[0.03] dark:bg-surface-alt/30 border border-border/80 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-text mb-1.5">
                        <ShieldCheck className="size-3.5 text-emerald-600" />
                        <span>Shift Rules</span>
                      </div>

                      <ul className="space-y-1 text-[10px] text-text-muted leading-tight">
                        <li className="flex items-start gap-1.5">
                          <span className="size-1 rounded-full bg-emerald-600 shrink-0 mt-1" />
                          <span>All cashier shifts created today automatically link to this Business Day.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="size-1 rounded-full bg-emerald-600 shrink-0 mt-1" />
                          <span>Cannot close the Business Day while any shift is still open.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="size-1 rounded-full bg-emerald-600 shrink-0 mt-1" />
                          <span>Each shift's cash sales, deposits, and withdrawals are included in the final summary.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="size-1 rounded-full bg-emerald-600 shrink-0 mt-1" />
                          <span>Shifts cannot be deleted once transactions exist.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════ TAB 3: FUND TRANSFERS ════════ */}
              {activeTab === "transfers" && (
                <div className="space-y-2.5">
                  {/* 4 Metric Cards Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Card 1: Total Deposits */}
                    <div className="bg-surface border border-border/80 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs">
                      <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <ArrowDownToLine className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block leading-none">
                          Total Deposits ({rawDeposits.length})
                        </span>
                        <span className="text-sm font-bold text-text font-mono block mt-1 leading-none truncate">
                          ₱ {fmt(totalDeposits)}
                        </span>
                        <span className="text-[9px] text-text-muted block mt-0.5 truncate">
                          Added to drawer
                        </span>
                      </div>
                    </div>

                    {/* Card 2: Total Withdrawals */}
                    <div className="bg-surface border border-border/80 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs">
                      <div className="size-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <ArrowUpFromLine className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block leading-none">
                          Total Withdrawals ({rawWithdrawals.length})
                        </span>
                        <span className="text-sm font-bold text-text font-mono block mt-1 leading-none truncate">
                          ₱ {fmt(totalWithdrawals)}
                        </span>
                        <span className="text-[9px] text-text-muted block mt-0.5 truncate">
                          Taken from branch
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Net Transfer */}
                    <div className="bg-surface border border-border/80 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs">
                      <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <ArrowLeftRight className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-text-muted block leading-none">
                          Net Transfer
                        </span>
                        <span
                          className={`text-sm font-bold font-mono block mt-1 leading-none truncate ${
                            netTransferAmount > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : netTransferAmount < 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-text"
                          }`}
                        >
                          {netTransferAmount > 0 ? "+" : ""}{netTransferAmount < 0 ? "- " : ""}₱ {fmt(Math.abs(netTransferAmount))}
                        </span>
                        <span className="text-[9px] text-text-muted block mt-0.5 truncate">
                          Deposits − Withdraw
                        </span>
                      </div>
                    </div>

                    {/* Card 4: Bank Deposit Slips */}
                    <div className="bg-surface border border-border/80 rounded-xl p-2.5 flex items-center gap-2.5 shadow-2xs">
                      <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Landmark className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block leading-none">
                          Bank Slips ({bankSlipsCount})
                        </span>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono block mt-1 leading-none truncate">
                          ₱ {fmt(totalBankSlipsAmount)}
                        </span>
                        <span className="text-[9px] text-text-muted block mt-0.5 truncate">
                          Vault to bank deposit
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Branch Cash Balances Strip */}
                  <div className="bg-emerald-500/[0.04] border border-border/80 rounded-xl px-3 py-1.5 flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Landmark className="size-3" />
                      </div>
                      <div>
                        <span className="text-[10.5px] font-bold text-text leading-tight block">
                          Branch Cash Status
                        </span>
                        <span className="text-[9px] text-text-muted leading-tight block">
                          Live drawer cash and frozen vault reserve
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 text-xs font-mono">
                      <div>
                        <span className="text-[8.5px] text-text-muted block leading-none">Running Drawer</span>
                        <span className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          ₱ {fmt(liveRunningCash)}
                        </span>
                      </div>
                      <div className="h-4.5 w-px bg-border/80" />
                      <div>
                        <span className="text-[8.5px] text-text-muted block leading-none">Frozen Vault</span>
                        <span className="font-bold text-[11px] text-blue-600 dark:text-blue-400 block mt-0.5">
                          ₱ {fmt(liveFrozenCash)}
                        </span>
                      </div>
                      <div className="h-4.5 w-px bg-border/80" />
                      <div>
                        <span className="text-[8.5px] text-text-muted block leading-none">Total Branch Cash</span>
                        <span className="font-bold text-[11px] text-text block mt-0.5">
                          ₱ {fmt(liveTotalCash)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Filter and Search Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <UIButton
                        variant={transferFilter === "all" ? "primary" : "outline"}
                        size="xs"
                        onClick={() => setTransferFilter("all")}
                        className={transferFilter === "all" ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold" : ""}
                      >
                        All ({allTransfers.length})
                      </UIButton>
                      <UIButton
                        variant={transferFilter === "deposit" ? "primary" : "outline"}
                        size="xs"
                        onClick={() => setTransferFilter("deposit")}
                        className={transferFilter === "deposit" ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold" : ""}
                      >
                        Deposits ({rawDeposits.length})
                      </UIButton>
                      <UIButton
                        variant={transferFilter === "withdrawal" ? "primary" : "outline"}
                        size="xs"
                        onClick={() => setTransferFilter("withdrawal")}
                        className={transferFilter === "withdrawal" ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold" : ""}
                      >
                        Withdrawals ({rawWithdrawals.length})
                      </UIButton>
                      <UIButton
                        variant={transferFilter === "bank_slip" ? "primary" : "outline"}
                        size="xs"
                        onClick={() => setTransferFilter("bank_slip")}
                        className={transferFilter === "bank_slip" ? "bg-indigo-600 hover:bg-indigo-700 text-white font-bold" : ""}
                      >
                        Bank Slips ({rawBankSlips.length})
                      </UIButton>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-56 sm:w-64">
                        <UISearchInput
                          value={transferSearch}
                          onChange={(e) => setTransferSearch(e.target.value)}
                          placeholder="Search date, type, reference..."
                          size="sm"
                          shortcut=""
                        />
                      </div>

                      <div className="h-8.5 px-2.5 bg-surface border border-border rounded-lg flex items-center gap-1.5 text-xs text-text">
                        <Calendar className="size-3 text-text-muted" />
                        <span className="text-[11px]">{formatShortDate(bd.businessDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Split Table (Left 65%) and Details Drawer (Right 35%) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Left (8/12): Transfer Table */}
                    <div className="sm:col-span-8 border border-border/80 rounded-xl overflow-hidden bg-surface shadow-2xs flex flex-col justify-between min-h-[220px]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-border bg-surface-alt/50 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                              <th className="py-1.5 px-2">#</th>
                              <th className="py-1.5 px-2">Date & Time</th>
                              <th className="py-1.5 px-2">Type</th>
                              <th className="py-1.5 px-2">Reference No.</th>
                              <th className="py-1.5 px-2 text-right">Amount (₱)</th>
                              <th className="py-1.5 px-2">Shift / Destination</th>
                              <th className="py-1.5 px-2">Created By</th>
                              <th className="py-1.5 px-2 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {filteredTransfers.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="py-8 text-center">
                                  <UIEmptyState
                                    icon={<ArrowLeftRight className="size-5" />}
                                    title="No fund transfers"
                                    description={
                                      allTransfers.length === 0
                                        ? "No deposits, withdrawals, or bank slips recorded for this session."
                                        : "No transfers match your search or filter."
                                    }
                                    variant="inline"
                                    size="sm"
                                  />
                                </td>
                              </tr>
                            ) : (
                              filteredTransfers.map((item, idx) => {
                                const isSelected = activeTransferItem?.refNo === item.refNo;
                                const isDeposit = item.type === "Deposit";
                                const isWithdrawal = item.type === "Withdrawal";
                                const isBankSlip = item.type === "Bank Slip";
                                return (
                                  <tr
                                    key={item.id || idx}
                                    onClick={() => setSelectedTransfer(item)}
                                    className={`cursor-pointer transition-colors ${
                                      isSelected
                                        ? "bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12]"
                                        : "hover:bg-surface-alt/30"
                                    }`}
                                  >
                                    <td className="py-1.5 px-2 font-mono text-text-muted">{idx + 1}</td>
                                    <td className="py-1.5 px-2 font-mono text-[10px] text-text-muted leading-tight">
                                      {formatDateTime(item.date)}
                                    </td>
                                    <td className="py-1.5 px-2">
                                      <span
                                        className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[9.5px] font-bold ${
                                          isDeposit
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                            : isWithdrawal
                                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                                        }`}
                                      >
                                        {item.type}
                                      </span>
                                    </td>
                                    <td className="py-1.5 px-2 font-mono text-[10.5px] text-text font-medium">
                                      {item.refNo}
                                    </td>
                                    <td className="py-1.5 px-2 text-right font-mono font-bold text-text">
                                      {fmt(item.amount)}
                                    </td>
                                    <td className="py-1.5 px-2 text-text text-[10.5px] truncate max-w-[120px]">
                                      {isBankSlip ? (item.toAccountName || "Bank Account") : item.shiftName}
                                    </td>
                                    <td className="py-1.5 px-2">
                                      <div className="flex items-center gap-1.5">
                                        <div className="size-5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                                          {item.creatorInitials}
                                        </div>
                                        <span className="text-text text-[10.5px] truncate max-w-[80px]">
                                          {item.creatorName}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-1.5 px-2 text-center">
                                      <button
                                        type="button"
                                        className="p-1 rounded text-text-muted hover:text-text cursor-pointer transition-colors"
                                      >
                                        <MoreVertical className="size-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Table Pagination Footer */}
                      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/60 bg-surface-alt/20 text-[10px] text-text-muted">
                        <span>
                          Showing {filteredTransfers.length} of {allTransfers.length} entries
                        </span>
                      </div>
                    </div>

                    {/* Right (4/12): Transfer Details Panel */}
                    <div className="sm:col-span-4 bg-surface border border-border/80 rounded-xl p-3 shadow-2xs flex flex-col justify-between min-h-[220px]">
                      {activeTransferItem ? (
                        <div>
                          {/* Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-border/60">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                              <Calendar className="size-3.5 text-text-muted" />
                              <span>Transfer Details</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedTransfer(null)}
                              className="size-5 rounded-full hover:bg-surface-alt text-text-muted hover:text-text flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <X className="size-3" />
                            </button>
                          </div>

                          {/* Large Highlight Box */}
                          <div className="flex items-center gap-2.5 py-2.5 border-b border-border/60">
                            <div
                              className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                                activeTransferItem.type === "Withdrawal"
                                  ? "bg-rose-500/10 text-rose-600"
                                  : activeTransferItem.type === "Bank Slip"
                                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                  : "bg-emerald-500/10 text-emerald-600"
                              }`}
                            >
                              {activeTransferItem.type === "Withdrawal" ? (
                                <ArrowUpFromLine className="size-4.5" />
                              ) : activeTransferItem.type === "Bank Slip" ? (
                                <Landmark className="size-4.5" />
                              ) : (
                                <ArrowDownToLine className="size-4.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-text leading-tight">
                                  {activeTransferItem.type === "Withdrawal"
                                    ? "Withdrawal Transfer"
                                    : activeTransferItem.type === "Bank Slip"
                                    ? "Bank Deposit Slip"
                                    : "Deposit Transfer"}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                    activeTransferItem.type === "Withdrawal"
                                      ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                      : activeTransferItem.type === "Bank Slip"
                                      ? "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
                                      : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                  }`}
                                >
                                  {activeTransferItem.type}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-sm text-text block leading-none mt-1">
                                ₱ {fmt(activeTransferItem.amount)}
                              </span>
                              <span className="text-[9.5px] text-text-muted block mt-0.5">
                                {formatDateTime(activeTransferItem.date)}
                              </span>
                            </div>
                          </div>

                          {/* Detail Key-Value Rows */}
                          <div className="space-y-1.5 text-xs pt-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-text-muted">Reference No.</span>
                              <span className="font-mono font-bold text-text">
                                {activeTransferItem.refNo}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-text-muted">Type</span>
                              <span className="font-medium text-text">
                                {activeTransferItem.type}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-text-muted">Amount</span>
                              <span className="font-mono font-bold text-text">
                                ₱ {fmt(activeTransferItem.amount)}
                              </span>
                            </div>

                            {activeTransferItem.type === "Bank Slip" ? (
                              <>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-text-muted">Bank Account</span>
                                  <span className="font-medium text-text truncate max-w-[140px] text-right">
                                    {activeTransferItem.toAccountName}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-text-muted">Source Partition</span>
                                  <span className="font-medium text-text">
                                    Branch Vault (Frozen)
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-text-muted">Status</span>
                                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-indigo-500/10 text-indigo-600 capitalize">
                                    {activeTransferItem.status || "Prepared"}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-text-muted">Shift</span>
                                  <span className="font-medium text-text">
                                    {activeTransferItem.shiftName}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-text-muted">Target Drawer</span>
                                  <span className="font-medium text-text">
                                    Branch Cash Drawer
                                  </span>
                                </div>
                              </>
                            )}

                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-text-muted">Created By</span>
                              <div className="flex items-center gap-1.5">
                                <div className="size-4.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[8.5px] font-bold flex items-center justify-center">
                                  {activeTransferItem.creatorInitials}
                                </div>
                                <div className="text-right">
                                  <span className="font-medium text-text text-[10.5px] block leading-none">
                                    {activeTransferItem.creatorName}
                                  </span>
                                  <span className="text-[9px] text-text-muted block leading-none mt-0.5 capitalize">
                                    {activeTransferItem.creatorRole}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-1.5 border-t border-border/50">
                              <span className="text-text-muted text-[10.5px] block mb-0.5">Notes</span>
                              <p className="text-[10.5px] text-text-muted leading-snug">
                                {activeTransferItem.notes}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-12 text-center my-auto">
                          <UIEmptyState
                            icon={<ArrowLeftRight className="size-5" />}
                            title="No Transfer Selected"
                            description="Select a transfer or bank slip row from the table to view its full details."
                            variant="inline"
                            size="sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── 5. Dialog Footer (Fixed, shrink-0) ─────────────────────────────── */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60 shrink-0">
          <UIButton
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8.5 px-4 text-xs font-medium rounded-lg"
          >
            Close
          </UIButton>

          {isOpen_ && (
            <UIButton
              type="button"
              size="sm"
              onClick={() => {
                const targetDay = bd || businessDay;
                if (onRequestCloseDay) {
                  onClose();
                  onRequestCloseDay(targetDay);
                } else {
                  setIsCloseDayModalOpen(true);
                }
              }}
              startIcon={<LockKeyhole className="size-3.5" />}
              className="h-8.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium border-none shadow-xs text-xs rounded-lg transition-all cursor-pointer"
            >
              Close Business Day
            </UIButton>
          )}
        </div>
      </UIModal>

      {/* Shift detail overlay dialog */}
      {viewShift && (
        <ViewShiftDialog
          isOpen={!!viewShift}
          onClose={() => setViewShift(null)}
          shift={viewShift}
        />
      )}

      {/* Close Business Day overlay dialog */}
      {isCloseDayModalOpen && (
        <CloseBusinessDayDialog
          isOpen={isCloseDayModalOpen}
          onClose={() => {
            setIsCloseDayModalOpen(false);
            onClose();
          }}
          businessDay={bd || businessDay}
        />
      )}
    </>
  );
};

export default ViewBusinessDayDialog;
