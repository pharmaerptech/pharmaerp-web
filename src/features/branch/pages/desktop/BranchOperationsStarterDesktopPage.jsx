// src/features/branch/pages/desktop/BranchOperationsStarterDesktopPage.jsx

import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Receipt,
  RotateCcw,
  Truck,
  Wallet,
  Clock,
  ArrowRight,
  RefreshCw,
  Lock,
  Store,
  User,
  UserPlus,
  Zap,
} from "lucide-react";

import { ROUTES } from "@/constants";

const formatINR = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

export const BranchOperationsStarterDesktopPage = ({
  branch = {},
  activeShift = null,
  isShiftOpen = false,
  shiftTitle = "No Active Shift",
  cashierName = "Counter Live",
  tillCashBalance = 0,
  runningCash = 0,
  frozenCash = 0,
  todaySalesAmount = 0,
  todayInvoicesCount = 0,
  salesSummary = {},
  isLoading = false,
  onRefresh,
  onOpenCreateShift,
  onOpenCloseShift,
  onOpenCustomerModal,
}) => {
  const navigate = useNavigate();

  const isShiftClosing = activeShift && activeShift.status === "closing";

  // Hotkey listener for counter quick operations (Alt+N, Alt+R, Alt+P, Alt+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!e.altKey) return;
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;

      const key = e.key.toLowerCase();
      if (key === "n") {
        e.preventDefault();
        navigate(ROUTES.SALES);
      } else if (key === "m") {
        e.preventDefault();
        navigate(ROUTES.BILLING);
      } else if (key === "r") {
        e.preventDefault();
        navigate(ROUTES.SALES_RETURNS);
      } else if (key === "p") {
        e.preventDefault();
        navigate(ROUTES.PURCHASES);
      } else if (key === "s") {
        e.preventDefault();
        if (isShiftOpen) {
          onOpenCloseShift?.();
        } else {
          onOpenCreateShift?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, isShiftOpen, onOpenCloseShift, onOpenCreateShift]);

  // Average bill amount calculation
  const avgBillAmount = useMemo(() => {
    if (todayInvoicesCount > 0 && todaySalesAmount > 0) {
      return Math.round(todaySalesAmount / todayInvoicesCount);
    }
    return 0;
  }, [todaySalesAmount, todayInvoicesCount]);

  // Exactly 4 high-frequency counter operations
  const CORE_OPERATIONS = useMemo(
    () => [
      {
        id: "pos-billing",
        title: "Billing (POS Counter)",
        subtitle: "Front Desk Checkout",
        description: "Fast barcode scanning, patient prescription billing, multi-tender payment checkout, and instant thermal printing.",
        icon: ShoppingCart,
        accent: "emerald",
        badge: "Alt + N",
        path: ROUTES.SALES,
        actionLabel: "Open POS Counter",
        isPrimary: true,
      },
      {
        id: "invoices-register",
        title: "Daily Invoices Register",
        subtitle: "Billed Counter Receipts",
        description: "Search, audit, reprint, and inspect completed customer tax bills, GST splits, and payment modes.",
        icon: Receipt,
        accent: "blue",
        badge: "Alt + M",
        path: ROUTES.BILLING,
        actionLabel: "View Invoices",
        isPrimary: false,
      },
      {
        id: "sales-returns",
        title: "Sales Returns & Refunds",
        subtitle: "Customer Returns & Restock",
        description: "Process returned medicines, restock sellable batches into store inventory, and issue customer exchange credit notes.",
        icon: RotateCcw,
        accent: "rose",
        badge: "Alt + R",
        path: ROUTES.SALES_RETURNS,
        actionLabel: "Process Return",
        isPrimary: false,
      },
      {
        id: "purchases-inward",
        title: "Purchase Inward Bills",
        subtitle: "Stock Procurement",
        description: "Inward distributor medicine supplies, verify batch numbers, expiry dates, purchase rates, and GST inputs.",
        icon: Truck,
        accent: "amber",
        badge: "Alt + P",
        path: ROUTES.PURCHASES,
        actionLabel: "Inward Stock",
        isPrimary: false,
      },
    ],
    []
  );

  return (
    <div className="w-full min-h-full flex-1 flex flex-col pt-0 pb-6 px-2 sm:px-3 gap-3 text-text font-sans select-none">
      {/* ── 1. Top 4-Card Real-Time Counter KPI Stat Grid (shrink-0, per UI_STANDARDS.md) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 shrink-0">
        {/* Card 1: Live Shift & Shift Name Status */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs h-[68px] sm:h-[72px]">
          <div
            className={`size-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isShiftOpen
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : isShiftClosing
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : "bg-surface-alt text-text-muted border-border"
            }`}
          >
            {isShiftOpen ? (
              <span className="relative flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-3 bg-emerald-500" />
              </span>
            ) : isShiftClosing ? (
              <Clock className="size-4 animate-spin text-amber-500" />
            ) : (
              <Lock className="size-4 text-text-muted" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block truncate">
                Shift: {isShiftOpen ? shiftTitle : "Shift Status"}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  isShiftOpen
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : isShiftClosing
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    : "bg-surface-alt text-text-muted"
                }`}
              >
                {isShiftOpen ? "OPEN & ACTIVE" : isShiftClosing ? "CLOSING" : "CLOSED"}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1.5 mt-0.5">
              <span className="text-sm font-bold text-text truncate">
                {isShiftOpen ? shiftTitle : isShiftClosing ? "Reconciling Till..." : "No Active Shift"}
              </span>
              {isShiftOpen && (
                <span className="text-[10px] text-text-muted truncate shrink-0">
                  {cashierName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Real Physical Cash in Till / Vault */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs h-[68px] sm:h-[72px]">
          <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Wallet className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block truncate">
                Physical Cash Balance
              </span>
              <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                {frozenCash > 0 ? "Drawer + Vault" : "Till Cash"}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-text leading-tight">
                {formatINR(tillCashBalance)}
              </span>
              <span className="text-[10px] text-text-muted truncate">
                {frozenCash > 0 && runningCash > 0
                  ? `Till: ${formatINR(runningCash)} · Vault: ${formatINR(frozenCash)}`
                  : activeShift?.openingFloat
                  ? `Float: ${formatINR(activeShift.openingFloat)}`
                  : "Physical Drawer"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Today's Real Counter Sales */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs h-[68px] sm:h-[72px]">
          <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShoppingCart className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block truncate">
              Today's Counter Sales
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 leading-tight">
                {formatINR(todaySalesAmount)}
              </span>
              <span className="text-[10px] font-medium text-text-muted">
                {salesSummary.cashSales > 0 ? `Cash: ${formatINR(salesSummary.cashSales)}` : "Live Revenue"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Billed Invoices Count */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs h-[68px] sm:h-[72px]">
          <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Receipt className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block truncate">
              Invoices Billed Today
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-text leading-tight">
                {todayInvoicesCount}
              </span>
              <span className="text-[10px] font-medium text-text-muted">
                {avgBillAmount > 0 ? `Avg ${formatINR(avgBillAmount)}/bill` : "Receipts Generated"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Counter Terminal Command Bar (shrink-0, NO search bar or filters) ── */}
      <div className="shrink-0 flex items-center justify-between gap-3 bg-surface border border-border/90 rounded-xl px-3.5 py-2.5 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Store className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-text truncate">
                {branch?.name || "Retail Counter"}
              </h2>
              {branch?.code && (
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-surface-alt border border-border text-text-muted">
                  {branch.code}
                </span>
              )}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hidden sm:inline-block">
                Front-Desk Counter Floor
              </span>
            </div>
            <p className="text-[11px] text-text-muted truncate mt-0.5">
              Point of Sale checkout, cashier shifts, customer returns, and distributor goods inward
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate(ROUTES.SALES)}
            className="h-8.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <ShoppingCart className="size-3.5" />
            <span>Open POS Counter</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/25 text-[10px] font-mono leading-none">
              Alt + N
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.SALES_RETURNS)}
            className="h-8.5 px-3 rounded-lg bg-surface border border-border text-text hover:bg-surface-alt text-xs font-medium flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="size-3.5 text-text-muted" />
            <span className="hidden sm:inline">Return</span>
            <kbd className="hidden md:inline-block px-1 py-0.5 rounded bg-surface-alt border border-border text-[9px] font-mono leading-none text-text-muted">
              Alt+R
            </kbd>
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="size-8.5 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text transition-all active:scale-[0.98] cursor-pointer"
              title="Refresh Shift & Sales Metrics"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* ── 3. Focused 4-Card Core Operations Launchpad (2x2 Grid) ───────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
        {CORE_OPERATIONS.map((op) => {
          const Icon = op.icon;
          const isEmerald = op.accent === "emerald";
          const isBlue = op.accent === "blue";
          const isRose = op.accent === "rose";

          return (
            <div
              key={op.id}
              onClick={() => navigate(op.path)}
              className={`group relative flex flex-col justify-between p-4 rounded-xl bg-surface border transition-all cursor-pointer shadow-2xs hover:shadow-sm active:scale-[0.99] ${
                op.isPrimary
                  ? "border-emerald-500/40 hover:border-emerald-500/70 bg-gradient-to-br from-emerald-500/[0.03] to-transparent"
                  : "border-border/90 hover:border-primary/50"
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                        isEmerald
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                          : isBlue
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
                          : isRose
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text group-hover:text-primary transition-colors flex items-center gap-2">
                        {op.title}
                        {op.isPrimary && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                            <Zap className="size-2.5" /> Core
                          </span>
                        )}
                      </h3>
                      <span className="text-[11px] font-medium text-text-muted">
                        {op.subtitle}
                      </span>
                    </div>
                  </div>

                  <kbd className="px-2 py-0.5 rounded-md bg-surface-alt border border-border text-[11px] font-mono font-medium text-text-muted">
                    {op.badge}
                  </kbd>
                </div>

                {/* Description */}
                <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-3.5">
                  {op.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="text-xs font-semibold text-text group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <span>{op.actionLabel}</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="text-[10px] text-text-muted">Click to launch</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 4. Live Shift & Till Drawer Management Panel ─────────────────────────── */}
      <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface border border-border/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-surface-alt border border-border flex items-center justify-center shrink-0 text-text-muted">
            <User className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text">Counter Cashier Shift & Handover</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                  isShiftOpen
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : isShiftClosing
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-surface-alt text-text-muted"
                }`}
              >
                {isShiftOpen ? "ACTIVE CASHIER LIVE" : isShiftClosing ? "CLOSING IN PROGRESS" : "NOT STARTED"}
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              {isShiftOpen
                ? `Shift: ${shiftTitle} • Cashier: ${cashierName} • Float: ${formatINR(activeShift?.openingFloat || 0)} • Physical Cash: ${formatINR(tillCashBalance)}`
                : "Open a cashier shift to unlock counter billing, record payment tenders, and audit cash drawer."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onOpenCustomerModal && (
            <button
              type="button"
              onClick={onOpenCustomerModal}
              className="h-8 px-3 rounded-lg bg-surface-alt hover:bg-surface-hover border border-border text-xs font-medium text-text flex items-center gap-1.5 transition-all cursor-pointer"
              title="Quickly Register New Patient / Customer"
            >
              <UserPlus className="size-3.5 text-text-muted" />
              <span>New Customer</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate(ROUTES.BRANCH_CASH)}
            className="h-8 px-3 rounded-lg bg-surface-alt hover:bg-surface-hover border border-border text-xs font-medium text-text flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Wallet className="size-3.5 text-text-muted" />
            <span>Till Ledger</span>
          </button>

          <button
            type="button"
            onClick={isShiftOpen ? onOpenCloseShift : onOpenCreateShift}
            className="h-8 px-3.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <span>{isShiftOpen ? "Close Shift" : "Start Cashier Shift"}</span>
            <kbd className="px-1.5 py-0.2 rounded bg-black/20 text-[10px] font-mono leading-none">
              Alt + S
            </kbd>
          </button>
        </div>
      </div>

      {/* ── 5. Clean Keyboard Legend Strip ────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center justify-center gap-4 py-1 text-[11px] text-text-muted font-mono">
        <span><kbd className="px-1.5 py-0.5 rounded bg-surface border border-border">Alt + N</kbd> POS Billing</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-surface border border-border">Alt + M</kbd> Invoices</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-surface border border-border">Alt + R</kbd> Returns</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-surface border border-border">Alt + P</kbd> Inward Purchase</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-surface border border-border">Alt + S</kbd> Shift Control</span>
      </div>
    </div>
  );
};

export default BranchOperationsStarterDesktopPage;
