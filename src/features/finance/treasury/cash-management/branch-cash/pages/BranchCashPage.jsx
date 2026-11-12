// src/features/finance/treasury/cash-management/branch-cash/pages/BranchCashPage.jsx

import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  UIButton,
  UIAlert,
  UISkeleton,
} from "@/components/ui";
import { useBranchCash } from "../hooks/useBranchCash";
import { deriveBranchCashViewState } from "../utils/branchCashViewState";
import useBranch from "@/features/branch/hooks/useBranch";
import useActiveShift from "@/features/operations/shifts/hooks/useActiveShift";
import { getOpenBusinessDay } from "@/features/operations/business-days/store/businessDayThunk";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  Lock,
  Wallet,
  Banknote,
  Coins,
  Clock,
  ArrowDownToLine,
  ArrowUpFromLine,
  Tag,
  Shield,
  BarChart3,
  Layers,
  BarChart2,
  Table as TableIcon,
} from "lucide-react";
import InitializeBranchCashModal from "../components/InitializeBranchCashModal";
import DepositModal from "../components/DepositModal";
import WithdrawModal from "../components/WithdrawModal";

const DENOMINATIONS_CONFIG = [
  { note: 500, label: "₹ 500", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800", icon: "P" },
  { note: 200, label: "₹ 200", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800", icon: "P" },
  { note: 100, label: "₹ 100", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800", icon: "P" },
  { note: 50,  label: "₹ 50",  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", icon: "P" },
  { note: 20,  label: "₹ 20",  color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800", icon: "P" },
  { note: 10,  label: "₹ 10",  color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800", icon: "P" },
  { note: 5,   label: "₹ 5",   color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200 dark:border-pink-800", icon: "P" },
  { note: 2,   label: "₹ 2",   color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700", icon: "i" },
  { note: 1,   label: "₹ 1",   color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700", icon: "i" },
];

const formatCurrency = (val) =>
  `₹ ${Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const sumDenominations = (denominations = []) =>
  (denominations || []).reduce(
    (s, d) => s + (Number(d.denomination) || 0) * (Number(d.quantity) || Number(d.count) || 0),
    0
  );

const countNotes = (denominations = []) =>
  (denominations || []).reduce(
    (s, d) => s + (Number(d.quantity) || Number(d.count) || 0),
    0
  );

export const BranchCashPage = () => {
  const dispatch = useDispatch();
  const { currentBranch } = useBranch();
  const { currentBranchCash, fetchBranchCash, fetchStatus, error } = useBranchCash();
  const { activeShift, refetch: refetchActiveShift } = useActiveShift(currentBranch?._id);
  const { openBusinessDay } = useSelector((state) => state.businessDay || {});

  const [activeTab, setActiveTab] = useState("drawers"); // "drawers" | "matrix"
  const [matrixViewMode, setMatrixViewMode] = useState("matrix"); // "matrix" | "chart"
  const [isInitModalOpen, setIsInitModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  useEffect(() => {
    if (currentBranch?._id) {
      fetchBranchCash(currentBranch._id);
      dispatch(getOpenBusinessDay(currentBranch._id));
      refetchActiveShift?.();
    }
  }, [currentBranch?._id, fetchBranchCash, dispatch, refetchActiveShift]);

  const {
    activeBranchCash,
    isLoading,
    isInitialized,
    hasError,
  } = deriveBranchCashViewState({
    branchId: currentBranch?._id,
    currentBranchCash,
    fetchStatus,
    error,
  });

  // Denominations lists
  const runningDenominations =
    activeBranchCash?.denominationBalance?.runningDenominations || [];
  const frozenDenominations =
    activeBranchCash?.denominationBalance?.frozenDenominations ||
    activeBranchCash?.balance?.frozenDenominations ||
    [];

  const runningTotal = sumDenominations(runningDenominations);
  const frozenTotal = sumDenominations(frozenDenominations);
  const totalVault = runningTotal + frozenTotal;

  const runningNotesCount = countNotes(runningDenominations);
  const frozenNotesCount = countNotes(frozenDenominations);
  const totalNotesCount = runningNotesCount + frozenNotesCount;

  const runningDenomsCount = runningDenominations.filter(
    (d) => (Number(d.quantity) || Number(d.count) || 0) > 0
  ).length;
  const frozenDenomsCount = frozenDenominations.filter(
    (d) => (Number(d.quantity) || Number(d.count) || 0) > 0
  ).length;

  // Initialization state is derived safely in deriveBranchCashViewState

  // Real Shift & Business Day Info (No hardcoded dummy fallbacks)
  const effectiveShift = activeShift || openBusinessDay?.currentOpenShift || null;
  const isShiftActive = Boolean(
    effectiveShift &&
      (effectiveShift.status === "open" || effectiveShift.status === undefined)
  );
  const isBusinessDayOpen = Boolean(
    openBusinessDay &&
      (openBusinessDay.status === "open" || openBusinessDay.businessDate)
  );

  const realShiftTitle = useMemo(() => {
    if (!effectiveShift) return null;
    const name = effectiveShift.shiftName?.trim();
    const no = effectiveShift.shiftNo;
    if (name && no) {
      if (name.toLowerCase().includes("shift")) {
        return name;
      }
      return `Shift #${no} • ${name}`;
    }
    if (name) return name;
    if (no) return `Shift #${no}`;
    if (effectiveShift.openPeriod) {
      const period =
        effectiveShift.openPeriod.charAt(0).toUpperCase() +
        effectiveShift.openPeriod.slice(1);
      return `${period} Shift`;
    }
    return "Active Shift";
  }, [effectiveShift]);

  const realShiftSubtext = useMemo(() => {
    if (!effectiveShift) return null;
    const cashier =
      effectiveShift.openedBy?.fullName ||
      effectiveShift.openedBy?.name ||
      effectiveShift.openedBy?.email;
    if (cashier) return `Cashier: ${cashier}`;
    if (effectiveShift.openedAt) {
      try {
        const timeStr = new Date(effectiveShift.openedAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        return `Opened at ${timeStr}`;
      } catch {
        // ignore
      }
    }
    return "Active Shift Session";
  }, [effectiveShift]);

  const realBusinessDateDisplay = useMemo(() => {
    if (!openBusinessDay?.businessDate) return null;
    try {
      const d = new Date(openBusinessDay.businessDate);
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return String(openBusinessDay.businessDate);
    }
  }, [openBusinessDay]);

  const businessDateDisplay = realBusinessDateDisplay || "Today";

  const branchName = currentBranch?.name || "Makati Branch";


  // Denomination Matrix Rows
  const matrixRows = useMemo(() => {
    return DENOMINATIONS_CONFIG.map((d) => {
      const rItem = runningDenominations.find((item) => Number(item.denomination) === d.note);
      const fItem = frozenDenominations.find((item) => Number(item.denomination) === d.note);

      const rCount = rItem ? Number(rItem.quantity ?? rItem.count ?? 0) : 0;
      const rAmount = rCount * d.note;

      const fCount = fItem ? Number(fItem.quantity ?? fItem.count ?? 0) : 0;
      const fAmount = fCount * d.note;

      const totalCount = rCount + fCount;
      const totalAmount = rAmount + fAmount;

      const pct = totalVault > 0 ? ((totalAmount / totalVault) * 100).toFixed(1) : "0.0";

      return {
        ...d,
        rCount,
        rAmount,
        fCount,
        fAmount,
        totalCount,
        totalAmount,
        pct: Number(pct),
      };
    });
  }, [runningDenominations, frozenDenominations, totalVault]);

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans select-none overflow-hidden">
      {/* ── 1. Compact 4-Card Statistics Grid (Directly at Top of Page) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Vault */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <Wallet className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">Total Branch Vault</div>
            <div className="text-xl sm:text-[22px] font-bold font-mono text-text leading-tight tabular-nums">
              {formatCurrency(totalVault)}
            </div>
            <div className="text-[10px] text-text-muted mt-0.5 truncate">
              Running + Frozen Vault
            </div>
          </div>
        </div>

        {/* Card 2: Running Cash Drawer */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <Banknote className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">Running Drawer</div>
            <div className="text-xl sm:text-[22px] font-bold font-mono text-emerald-600 dark:text-emerald-400 leading-tight tabular-nums">
              {formatCurrency(runningTotal)}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 truncate">
              {runningDenomsCount} active denominations
            </div>
          </div>
        </div>

        {/* Card 3: Frozen Reserve Vault */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs">
          <div className="size-9 rounded-lg bg-warning-soft text-warning flex items-center justify-center shrink-0">
            <Lock className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">Frozen Reserve</div>
            <div className="text-xl sm:text-[22px] font-bold font-mono text-amber-700 dark:text-amber-400 leading-tight tabular-nums">
              {formatCurrency(frozenTotal)}
            </div>
            <div className="text-[10px] text-text-muted mt-0.5 truncate">
              Locked & secured
            </div>
          </div>
        </div>

        {/* Card 4: Shift & Business Day (Live Real Status) */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs">
          <div
            className={cn(
              "size-9 rounded-lg flex items-center justify-center shrink-0",
              isShiftActive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : isBusinessDayOpen
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-surface-alt text-text-muted"
            )}
          >
            <Clock className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-medium text-text-muted truncate flex items-center justify-between gap-1">
              <span>Shift & Business Day</span>
              {isBusinessDayOpen && realBusinessDateDisplay ? (
                <span className="text-[10px] font-semibold text-primary px-1.5 py-0.2 rounded bg-primary/10 truncate font-mono">
                  {realBusinessDateDisplay}
                </span>
              ) : null}
            </div>
            <div className="text-sm sm:text-base font-bold text-text leading-tight flex items-center gap-1.5 truncate mt-0.5">
              <span
                className={cn(
                  "size-2 rounded-full shrink-0",
                  isShiftActive
                    ? "bg-emerald-500 animate-pulse"
                    : isBusinessDayOpen
                    ? "bg-amber-500"
                    : "bg-slate-400"
                )}
              />
              <span className="truncate">
                {isShiftActive
                  ? realShiftTitle
                  : isBusinessDayOpen
                  ? "Shift Closed"
                  : "Business Day Closed"}
              </span>
            </div>
            <div className="text-[10px] text-text-muted mt-0.5 truncate">
              {isShiftActive
                ? realShiftSubtext || (realBusinessDateDisplay ? `Day: ${realBusinessDateDisplay}` : "Shift Active")
                : isBusinessDayOpen
                ? `Business Day Open${openBusinessDay?.shifts?.length ? ` • ${openBusinessDay.shifts.length} shift${openBusinessDay.shifts.length === 1 ? "" : "s"} today` : " • Ready for shift"}`
                : "No active business day"}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Toolbar: Navigation Tabs & Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Navigation Tabs */}
        {isInitialized ? (
          <div className="flex items-center gap-1 bg-surface-alt/80 p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setActiveTab("drawers")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "drawers"
                  ? "bg-surface text-primary shadow-2xs border border-border/80"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <Wallet className="size-3.5" />
              Visual Drawers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("matrix")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "matrix"
                  ? "bg-surface text-primary shadow-2xs border border-border/80"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <TableIcon className="size-3.5" />
              Vault Denomination Matrix
            </button>
          </div>
        ) : (
          <div className="text-xs font-bold text-text-muted">Branch Cash Overview</div>
        )}

        {/* Action Buttons Cluster */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Refresh Button */}
          <UIButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (currentBranch?._id) {
                fetchBranchCash(currentBranch._id);
                dispatch(getOpenBusinessDay(currentBranch._id));
                refetchActiveShift?.();
              }
            }}
            disabled={isLoading}
            startIcon={<RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-primary" : "text-text-muted"}`} />}
            className="h-9 px-3 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-alt shadow-2xs border-border text-text cursor-pointer"
            title="Refresh Vault Cash"
          >
            Refresh
          </UIButton>

          {/* Initialize Cash button: Only show when NOT initialized */}
          {!isInitialized && (
            <UIButton
              type="button"
              size="sm"
              onClick={() => setIsInitModalOpen(true)}
              startIcon={<Lock className="size-3.5" />}
              className="h-9 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-xs cursor-pointer"
            >
              Initialize Cash
            </UIButton>
          )}

          {/* Deposit & Withdraw Buttons: Only shown when initialized and shift is active */}
          {isInitialized && isShiftActive && (
            <>
              <UIButton
                type="button"
                size="sm"
                onClick={() => setIsDepositModalOpen(true)}
                disabled={isLoading}
                startIcon={<ArrowDownToLine className="size-3.5" />}
                className="h-9 px-3.5 rounded-xl text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white shadow-xs cursor-pointer transition"
              >
                Deposit
              </UIButton>

              <UIButton
                type="button"
                size="sm"
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={isLoading}
                startIcon={<ArrowUpFromLine className="size-3.5" />}
                className="h-9 px-3.5 rounded-xl text-xs font-bold bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-xs cursor-pointer transition"
              >
                Withdraw
              </UIButton>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading && !activeBranchCash ? (
        activeTab === "drawers" ? (
          /* SKELETON FOR TAB 1: VISUAL DRAWERS */
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch overflow-hidden animate-pulse">
            {/* Card 1 Skeleton: Running Cash Drawer */}
            <div className="lg:col-span-4 bg-surface rounded-xl border border-border p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-surface-alt" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 bg-surface-alt rounded" />
                      <div className="h-3 w-44 bg-surface-alt rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-14 bg-surface-alt rounded-full" />
                </div>
                <div className="pt-2 space-y-1.5">
                  <div className="h-3 w-20 bg-surface-alt rounded" />
                  <div className="h-7 w-36 bg-surface-alt rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-24 bg-surface-alt rounded-md" />
                  <div className="h-5 w-20 bg-surface-alt rounded-md" />
                </div>
                <div className="space-y-2 pt-2 border-t border-border/50">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <div className="h-5 w-14 bg-surface-alt rounded-md" />
                      <div className="h-4 w-12 bg-surface-alt rounded" />
                      <div className="h-4 w-16 bg-surface-alt rounded" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-border/60">
                <div className="h-8 w-full bg-surface-alt rounded-xl" />
              </div>
            </div>

            {/* Card 2 Skeleton: Frozen Reserve Vault */}
            <div className="lg:col-span-4 bg-surface rounded-xl border border-border p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-surface-alt" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 bg-surface-alt rounded" />
                      <div className="h-3 w-44 bg-surface-alt rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-14 bg-surface-alt rounded-full" />
                </div>
                <div className="pt-2 space-y-1.5">
                  <div className="h-3 w-20 bg-surface-alt rounded" />
                  <div className="h-7 w-36 bg-surface-alt rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-24 bg-surface-alt rounded-md" />
                  <div className="h-5 w-20 bg-surface-alt rounded-md" />
                </div>
                <div className="space-y-2 pt-2 border-t border-border/50">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <div className="h-5 w-14 bg-surface-alt rounded-md" />
                      <div className="h-4 w-12 bg-surface-alt rounded" />
                      <div className="h-4 w-16 bg-surface-alt rounded" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-border/60">
                <div className="h-8 w-full bg-surface-alt rounded-xl" />
              </div>
            </div>

            {/* Card 3 Skeleton: Combined Summary */}
            <div className="lg:col-span-4 bg-surface rounded-xl border border-border p-3.5 sm:p-4 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-surface-alt" />
                <div className="h-4 w-36 bg-surface-alt rounded" />
              </div>
              <div className="space-y-2 py-2">
                <div className="flex justify-between">
                  <div className="h-3.5 w-32 bg-surface-alt rounded" />
                  <div className="h-3.5 w-20 bg-surface-alt rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3.5 w-32 bg-surface-alt rounded" />
                  <div className="h-3.5 w-20 bg-surface-alt rounded" />
                </div>
              </div>
              <div className="border-t border-border/80 pt-2.5 flex justify-between items-center">
                <div className="h-4 w-28 bg-surface-alt rounded" />
                <div className="h-6 w-28 bg-surface-alt rounded" />
              </div>
              <div className="border-t border-border/80 pt-2.5 space-y-2.5">
                <div className="flex justify-between">
                  <div className="h-3.5 w-24 bg-surface-alt rounded" />
                  <div className="h-3.5 w-16 bg-surface-alt rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3.5 w-24 bg-surface-alt rounded" />
                  <div className="h-3.5 w-28 bg-surface-alt rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3.5 w-20 bg-surface-alt rounded" />
                  <div className="h-3.5 w-24 bg-surface-alt rounded" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SKELETON FOR TAB 2: VAULT DENOMINATION MATRIX */
          <div className="flex-1 min-h-0 bg-surface rounded-xl border border-border shadow-2xs overflow-hidden flex flex-col animate-pulse">
            {/* Header Bar */}
            <div className="shrink-0 px-4 py-2.5 border-b border-border flex items-center justify-between gap-2 bg-surface">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-surface-alt" />
                <div className="h-4 w-40 bg-surface-alt rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-36 bg-surface-alt rounded-lg" />
                <div className="h-7 w-24 bg-surface-alt rounded-lg" />
              </div>
            </div>
            {/* Table */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-alt/70">
                  <tr className="border-b border-border/80">
                    <th className="py-2.5 px-3 w-28"><div className="h-3.5 w-20 bg-surface-alt rounded" /></th>
                    <th colSpan={2} className="py-2.5 px-3 border-x border-border/60 text-center"><div className="h-3.5 w-32 bg-surface-alt rounded mx-auto" /></th>
                    <th colSpan={2} className="py-2.5 px-3 border-r border-border/60 text-center"><div className="h-3.5 w-32 bg-surface-alt rounded mx-auto" /></th>
                    <th colSpan={2} className="py-2.5 px-3 border-r border-border/60 text-center"><div className="h-3.5 w-20 bg-surface-alt rounded mx-auto" /></th>
                    <th className="py-2.5 px-3 text-left"><div className="h-3.5 w-16 bg-surface-alt rounded" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/40">
                      <td className="py-2.5 px-3"><div className="h-5 w-16 bg-surface-alt rounded-md" /></td>
                      <td className="py-2.5 px-3 border-l border-border/40 text-center"><div className="h-4 w-10 bg-surface-alt rounded mx-auto" /></td>
                      <td className="py-2.5 px-3 text-right"><div className="h-4 w-16 bg-surface-alt rounded ml-auto" /></td>
                      <td className="py-2.5 px-3 border-l border-border/40 text-center"><div className="h-4 w-10 bg-surface-alt rounded mx-auto" /></td>
                      <td className="py-2.5 px-3 text-right"><div className="h-4 w-16 bg-surface-alt rounded ml-auto" /></td>
                      <td className="py-2.5 px-3 border-l border-border/40 text-center"><div className="h-4 w-10 bg-surface-alt rounded mx-auto" /></td>
                      <td className="py-2.5 px-3 text-right"><div className="h-4 w-16 bg-surface-alt rounded ml-auto" /></td>
                      <td className="py-2.5 px-3"><div className="h-3 w-16 bg-surface-alt rounded" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : hasError && !activeBranchCash ? (
        <div className="flex-1 min-h-0 flex items-center justify-center p-4">
          <div className="w-full max-w-lg space-y-3">
            <UIAlert
              intent="danger"
              title="Unable to Load Branch Cash"
              description={
                typeof error === "string"
                  ? error
                  : "Failed to load branch cash details. Please try refreshing."
              }
            />
            <div className="flex justify-end">
              <UIButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => currentBranch?._id && fetchBranchCash(currentBranch._id)}
                startIcon={<RefreshCw className="size-3.5" />}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Retry
              </UIButton>
            </div>
          </div>
        </div>
      ) : !isInitialized ? (
        /* ══════════════════════════════════════════════════════════════════
           SCREEN 4: BEFORE-INITIALIZATION SCREEN (Compact)
           ══════════════════════════════════════════════════════════════════ */
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3">
          {/* Center Hero Card */}
          <div className="bg-surface rounded-2xl border border-border py-6 px-6 sm:py-8 sm:px-8 text-center shadow-xs flex flex-col items-center justify-center">
            {/* Cash Box Illustration with coins & warning badge */}
            <div className="relative w-32 h-24 sm:w-36 sm:h-28 mb-3 flex items-center justify-center">
              <svg
                viewBox="0 0 200 160"
                className="w-full h-full drop-shadow-sm"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Soft backdrop blur ellipse */}
                <ellipse cx="100" cy="120" rx="80" ry="24" fill="#e2e8f0" fillOpacity="0.45" />

                {/* Cash drawer back lid */}
                <path
                  d="M48 68 L72 38 L148 38 L124 68 Z"
                  fill="#cbd5e1"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />

                {/* Cash drawer main open box */}
                <path
                  d="M38 70 L136 70 L122 118 L24 118 Z"
                  fill="#e2e8f0"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M136 70 L174 70 L160 118 L122 118 Z"
                  fill="#cbd5e1"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />

                {/* Drawer front face */}
                <path
                  d="M24 118 L160 118 L152 136 L16 136 Z"
                  fill="#94a3b8"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* Drawer handle */}
                <rect x="76" y="124" width="32" height="4" rx="2" fill="#f8fafc" />

                {/* Coins Stacks on Left */}
                <ellipse cx="42" cy="112" rx="14" ry="5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                <ellipse cx="42" cy="108" rx="14" ry="5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
                <ellipse cx="42" cy="104" rx="14" ry="5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                <ellipse cx="42" cy="100" rx="14" ry="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />

                <ellipse cx="58" cy="116" rx="12" ry="4.5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                <ellipse cx="58" cy="112" rx="12" ry="4.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Orange circular warning badge with exclamation mark */}
                <g filter="url(#dropShadow)">
                  <circle cx="140" cy="98" r="24" fill="#f59e0b" />
                  <circle cx="140" cy="98" r="21" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
                  <path
                    d="M140 86 L140 98"
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="140" cy="106" r="2.2" fill="#ffffff" />
                </g>

                <defs>
                  <filter id="dropShadow" x="110" y="70" width="60" height="60" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
                  </filter>
                </defs>
              </svg>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-text tracking-tight mb-1.5">
              Branch Cash Not Initialized
            </h2>

            <div className="max-w-lg text-xs text-text-muted space-y-1 leading-relaxed mb-4">
              <p>Branch cash has not been initialized for this branch yet.</p>
              <p>
                Set the initial cash balance (opening denominations) before starting cashier operations, sales, or deposits.
              </p>
            </div>

            <UIButton
              type="button"
              onClick={() => setIsInitModalOpen(true)}
              startIcon={<Coins className="size-4" />}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Initialize Branch Cash
            </UIButton>
          </div>

          {/* 4 Bottom Benefit Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Feature 1 */}
            <div className="bg-surface rounded-2xl border border-border p-3.5 flex items-start gap-3 shadow-xs">
              <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Tag className="size-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-bold text-text truncate">Set Opening Balance</div>
                <p className="text-[11px] text-text-muted leading-snug">
                  Enter denomination-wise opening cash available in branch.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-surface rounded-2xl border border-border p-3.5 flex items-start gap-3 shadow-xs">
              <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Shield className="size-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-bold text-text truncate">Enable Cash Operations</div>
                <p className="text-[11px] text-text-muted leading-snug">
                  Process POS sales, drawer exchanges, deposits & withdrawals.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-surface rounded-2xl border border-border p-3.5 flex items-start gap-3 shadow-xs">
              <div className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <BarChart3 className="size-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-bold text-text truncate">Track Cash Accuracy</div>
                <p className="text-[11px] text-text-muted leading-snug">
                  Maintain accurate records with note-level breakdown.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-surface rounded-2xl border border-border p-3.5 flex items-start gap-3 shadow-xs">
              <div className="size-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Lock className="size-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs font-bold text-text truncate">Secure & Controlled</div>
                <p className="text-[11px] text-text-muted leading-snug">
                  Ensure strict compliance with full shift audit trail.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "drawers" ? (
        /* ══════════════════════════════════════════════════════════════════
           SCREEN 1 - TAB 1: VISUAL DRAWERS (Image 1 - Top)
           ══════════════════════════════════════════════════════════════════ */
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch overflow-hidden">
          {/* ── CARD 1: Running Cash Drawer (4 Cols) ── */}
          <div className="lg:col-span-4 bg-surface rounded-xl border border-border p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs overflow-y-auto">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                    <Banknote className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-text">Running Cash Drawer</h3>
                    <p className="text-[10px] sm:text-[11px] text-text-muted">Used for daily transactions (POS, sales, etc.)</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 shrink-0">
                  Active
                </span>
              </div>

              {/* Balance */}
              <div>
                <div className="text-[10px] sm:text-[11px] font-medium text-text-muted">Current Balance</div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(runningTotal)}
                </div>
              </div>

              {/* Metrics: Denominations & Total Notes */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-surface-alt/70 border border-border/80 rounded-xl p-2.5 flex items-center gap-2">
                  <Wallet className="size-3.5 text-text-muted shrink-0" />
                  <div>
                    <div className="text-[10px] text-text-muted">Denominations</div>
                    <div className="text-xs font-black font-mono text-text">
                      {runningDenomsCount} / 9
                    </div>
                  </div>
                </div>
                <div className="bg-surface-alt/70 border border-border/80 rounded-xl p-2.5 flex items-center gap-2">
                  <Coins className="size-3.5 text-text-muted shrink-0" />
                  <div>
                    <div className="text-[10px] text-text-muted">Total Notes/Coins</div>
                    <div className="text-xs font-black font-mono text-text">
                      {runningNotesCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions: Only show when shift is active */}
            {isShiftActive && (
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-border/60 mt-3">
                <UIButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDepositModalOpen(true)}
                  startIcon={<ArrowDownToLine className="size-3.5 text-emerald-600" />}
                  className="w-full rounded-xl text-xs font-bold border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                >
                  Deposit Cash
                </UIButton>
                <UIButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWithdrawModalOpen(true)}
                  startIcon={<ArrowUpFromLine className="size-3.5 text-rose-600" />}
                  className="w-full rounded-xl text-xs font-bold border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  Withdraw Cash
                </UIButton>
              </div>
            )}
          </div>

          {/* ── CARD 2: Frozen Reserve Vault (4 Cols) ── */}
          <div className="lg:col-span-4 bg-surface rounded-xl border border-border p-3.5 sm:p-4 flex flex-col justify-between shadow-2xs overflow-y-auto">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                    <Lock className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-text">Frozen Reserve Vault</h3>
                    <p className="text-[10px] sm:text-[11px] text-text-muted">Reserved cash for security and future use</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 shrink-0">
                  Locked
                </span>
              </div>

              {/* Balance */}
              <div>
                <div className="text-[10px] sm:text-[11px] font-medium text-text-muted">Current Balance</div>
                <div className="text-xl sm:text-2xl font-black font-mono text-amber-700 dark:text-amber-400">
                  {formatCurrency(frozenTotal)}
                </div>
              </div>

              {/* Metrics: Denominations & Total Notes */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-surface-alt/70 border border-border/80 rounded-xl p-2.5 flex items-center gap-2">
                  <Wallet className="size-3.5 text-text-muted shrink-0" />
                  <div>
                    <div className="text-[10px] text-text-muted">Denominations</div>
                    <div className="text-xs font-black font-mono text-text">
                      {frozenDenomsCount} / 9
                    </div>
                  </div>
                </div>
                <div className="bg-surface-alt/70 border border-border/80 rounded-xl p-2.5 flex items-center gap-2">
                  <Coins className="size-3.5 text-text-muted shrink-0" />
                  <div>
                    <div className="text-[10px] text-text-muted">Total Notes/Coins</div>
                    <div className="text-xs font-black font-mono text-text">
                      {frozenNotesCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="pt-3 border-t border-border/60 mt-3">
              <UIButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("matrix")}
                startIcon={<Lock className="size-3.5 text-amber-600" />}
                className="w-full rounded-xl text-xs font-bold border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
              >
                View Vault Details
              </UIButton>
            </div>
          </div>

          {/* ── CARD 3: Combined Summary (4 Cols) ── */}
          <div className="lg:col-span-4 bg-surface rounded-xl border border-border p-3.5 sm:p-4 space-y-3 shadow-2xs overflow-y-auto">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Layers className="size-4.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-text">Combined Summary</h3>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Running Cash (Drawer)</span>
                <span className="font-mono font-bold text-text">{formatCurrency(runningTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Frozen Cash (Vault)</span>
                <span className="font-mono font-bold text-text">{formatCurrency(frozenTotal)}</span>
              </div>
            </div>

            <div className="border-t border-border/80 pt-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-text">Total Branch Cash</span>
              <span className="text-base sm:text-lg font-black font-mono text-blue-600 dark:text-blue-400">
                {formatCurrency(totalVault)}
              </span>
            </div>

            <div className="border-t border-border/80 pt-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Shift Status</span>
                <span className="font-semibold text-text flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${isShiftActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {isShiftActive ? "Active" : "Closed"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Business Day</span>
                <div className="flex items-center gap-1.5 font-semibold text-text">
                  <span>{businessDateDisplay}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    isBusinessDayOpen
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-surface-alt text-text-muted"
                  )}>
                    {isBusinessDayOpen ? "Open" : "Closed"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Branch</span>
                <span className="font-semibold text-text truncate max-w-[160px]">{branchName}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════
           SCREEN 1 - TAB 2: VAULT DENOMINATION MATRIX (Image 1 - Bottom)
           ══════════════════════════════════════════════════════════════════ */
        <div className="flex-1 min-h-0 bg-surface rounded-xl border border-border overflow-hidden shadow-2xs flex flex-col">
          {/* Header Bar */}
          <div className="shrink-0 px-4 py-2.5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-text-muted flex items-center justify-center shrink-0">
                <Lock className="size-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-text">Denomination Breakdown</h3>
            </div>

            {/* Toggle Buttons: Denomination Matrix vs Chart View */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMatrixViewMode("matrix")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  matrixViewMode === "matrix"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-surface-alt text-text-muted hover:text-text border border-border"
                }`}
              >
                <TableIcon className="size-3.5" />
                Denomination Matrix
              </button>
              <button
                type="button"
                onClick={() => setMatrixViewMode("chart")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  matrixViewMode === "chart"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-surface-alt text-text-muted hover:text-text border border-border"
                }`}
              >
                <BarChart2 className="size-3.5" />
                Chart View
              </button>
            </div>
          </div>

          {matrixViewMode === "matrix" ? (
            /* Table View */
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-surface-alt/95 backdrop-blur-xs shadow-2xs">
                  {/* Super Header */}
                  <tr className="border-b border-border/80 text-[11px] font-bold text-text">
                    <th className="py-2 px-3 bg-surface-alt/60">Denomination</th>
                    <th colSpan={2} className="py-2 px-3 text-center bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-x border-border/60">
                      Running Cash Drawer
                    </th>
                    <th colSpan={2} className="py-2 px-3 text-center bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-r border-border/60">
                      Frozen Reserve Vault
                    </th>
                    <th colSpan={2} className="py-2 px-3 text-center bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-r border-border/60">
                      Total
                    </th>
                    <th className="py-2 px-3 bg-surface-alt/60 text-left">% of Total</th>
                  </tr>
                  {/* Sub Header */}
                  <tr className="border-b border-border text-[10px] font-bold text-text-muted uppercase tracking-wider bg-surface-alt/40">
                    <th className="py-1.5 px-3"></th>
                    <th className="py-1.5 px-2.5 text-center border-l border-border/60">Count</th>
                    <th className="py-1.5 px-3 text-right">Amount</th>
                    <th className="py-1.5 px-2.5 text-center border-l border-border/60">Count</th>
                    <th className="py-1.5 px-3 text-right">Amount</th>
                    <th className="py-1.5 px-2.5 text-center border-l border-border/60">Count</th>
                    <th className="py-1.5 px-3 text-right">Amount</th>
                    <th className="py-1.5 px-3 border-l border-border/60"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/50">
                  {matrixRows.map((row) => (
                    <tr key={row.note} className="hover:bg-surface-alt/30 transition">
                      {/* Denomination badge */}
                      <td className="py-2 px-3 font-bold text-text">
                        <div className="flex items-center gap-2">
                          <span className={`size-5 rounded flex items-center justify-center text-[9px] font-bold border ${row.color}`}>
                            {row.icon}
                          </span>
                          <span>{row.label}</span>
                        </div>
                      </td>

                      {/* Running Count */}
                      <td className="py-2 px-2.5 text-center font-mono font-semibold text-text border-l border-border/40">
                        {row.rCount}
                      </td>
                      {/* Running Amount */}
                      <td className="py-2 px-3 text-right font-mono font-semibold text-text">
                        {formatCurrency(row.rAmount)}
                      </td>

                      {/* Frozen Count */}
                      <td className="py-2 px-2.5 text-center font-mono font-semibold text-text border-l border-border/40">
                        {row.fCount}
                      </td>
                      {/* Frozen Amount */}
                      <td className="py-2 px-3 text-right font-mono font-semibold text-text">
                        {formatCurrency(row.fAmount)}
                      </td>

                      {/* Total Count */}
                      <td className="py-2 px-2.5 text-center font-mono font-bold text-text border-l border-border/40">
                        {row.totalCount}
                      </td>
                      {/* Total Amount */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-text">
                        {formatCurrency(row.totalAmount)}
                      </td>

                      {/* % of Total & Progress Bar */}
                      <td className="py-2 px-3 border-l border-border/40 min-w-[180px]">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 text-right font-mono font-semibold text-text-muted">
                            {row.pct.toFixed(1)}%
                          </span>
                          <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, row.pct))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Footer Totals Row */}
                <tfoot className="sticky bottom-0 z-10 bg-surface-alt/95 backdrop-blur-xs shadow-2xs border-t-2 border-border">
                  <tr className="font-bold text-xs">
                    <td className="py-2.5 px-3 font-black text-text">Total</td>
                    {/* Running Totals */}
                    <td className="py-2.5 px-2.5 text-center font-mono font-black text-emerald-700 dark:text-emerald-400 border-l border-border/40 bg-emerald-50/40 dark:bg-emerald-950/10">
                      {runningNotesCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/10">
                      {formatCurrency(runningTotal)}
                    </td>

                    {/* Frozen Totals */}
                    <td className="py-2.5 px-2.5 text-center font-mono font-black text-amber-700 dark:text-amber-400 border-l border-border/40 bg-amber-50/40 dark:bg-amber-950/10">
                      {frozenNotesCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-amber-700 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/10">
                      {formatCurrency(frozenTotal)}
                    </td>

                    {/* Grand Totals */}
                    <td className="py-2.5 px-2.5 text-center font-mono font-black text-blue-700 dark:text-blue-400 border-l border-border/40 bg-blue-50/40 dark:bg-blue-950/10">
                      {totalNotesCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-blue-700 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/10">
                      {formatCurrency(totalVault)}
                    </td>

                    {/* 100% Bar */}
                    <td className="py-2.5 px-3 border-l border-border/40">
                      <div className="flex items-center gap-2.5">
                        <span className="w-9 text-right font-mono font-black text-text">
                          {totalVault > 0 ? "100%" : "0%"}
                        </span>
                        <div
                          className={cn(
                            "flex-1 h-2 rounded-full",
                            totalVault > 0 ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"
                          )}
                        />
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            /* Chart View */
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
              <div className="text-xs font-semibold text-text-muted mb-1">
                Denomination Value Distribution (Running vs Frozen Reserve)
              </div>
              <div className="space-y-2.5">
                {matrixRows.map((row) => (
                  <div key={row.note} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-text">{row.label}</span>
                      <span className="font-mono text-text-muted">
                        {formatCurrency(row.totalAmount)} ({row.pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-3.5 rounded-lg bg-surface-alt overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{
                          width: `${totalVault > 0 ? (row.rAmount / totalVault) * 100 : 0}%`,
                        }}
                        title={`Running: ${formatCurrency(row.rAmount)}`}
                      />
                      <div
                        className="bg-amber-500 h-full transition-all duration-300"
                        style={{
                          width: `${totalVault > 0 ? (row.fAmount / totalVault) * 100 : 0}%`,
                        }}
                        title={`Frozen: ${formatCurrency(row.fAmount)}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Dialog Modals ── */}
      <InitializeBranchCashModal
        isOpen={isInitModalOpen}
        onClose={() => {
          setIsInitModalOpen(false);
          if (currentBranch?._id) fetchBranchCash(currentBranch._id);
        }}
      />
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => {
          setIsDepositModalOpen(false);
          if (currentBranch?._id) fetchBranchCash(currentBranch._id);
        }}
      />
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => {
          setIsWithdrawModalOpen(false);
          if (currentBranch?._id) fetchBranchCash(currentBranch._id);
        }}
      />
    </div>
  );
};

export default BranchCashPage;
