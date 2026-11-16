// src/features/branch/pages/mobile/BranchOperationsStarterMobilePage.jsx

import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Receipt,
  RotateCcw,
  Truck,
  Wallet,
  Clock,
  ArrowRight,
  Lock,
  CheckCircle2,
  UserPlus,
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

export const BranchOperationsStarterMobilePage = ({
  activeShift = null,
  isShiftOpen = false,
  shiftTitle = "No Active Shift",
  cashierName = "Counter Live",
  tillCashBalance = 0,
  todaySalesAmount = 0,
  todayInvoicesCount = 0,
  onOpenCreateShift,
  onOpenCloseShift,
  onOpenCustomerModal,
}) => {
  const navigate = useNavigate();
  const isShiftClosing = activeShift && activeShift.status === "closing";

  // Exactly 4 high-frequency operations
  const CORE_OPERATIONS = [
    {
      id: "pos-billing",
      title: "Billing (POS Counter)",
      subtitle: "Front Desk Checkout",
      icon: ShoppingCart,
      color: "emerald",
      badge: "Alt + N",
      path: ROUTES.SALES,
      isPrimary: true,
    },
    {
      id: "invoices-register",
      title: "Daily Invoices Register",
      subtitle: "Billed Receipts & Reprints",
      icon: Receipt,
      color: "blue",
      badge: "Alt + M",
      path: ROUTES.BILLING,
    },
    {
      id: "sales-returns",
      title: "Sales Returns & Refunds",
      subtitle: "Customer Returns & Restock",
      icon: RotateCcw,
      color: "rose",
      badge: "Alt + R",
      path: ROUTES.SALES_RETURNS,
    },
    {
      id: "purchases-inward",
      title: "Purchase Inward Bills",
      subtitle: "Distributor Inward Stock",
      icon: Truck,
      color: "amber",
      badge: "Alt + P",
      path: ROUTES.PURCHASES,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-3 p-2.5 font-sans pb-24 select-none">
      {/* ── 1. Shift Status Banner ────────────────────────────── */}
      <div className="p-3 rounded-xl bg-surface border border-border/90 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`size-9 rounded-lg flex items-center justify-center shrink-0 border ${
              isShiftOpen
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                : isShiftClosing
                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                : "bg-surface-alt text-text-muted border-border"
            }`}
          >
            {isShiftOpen ? (
              <CheckCircle2 className="size-4" />
            ) : isShiftClosing ? (
              <Clock className="size-4 animate-spin" />
            ) : (
              <Lock className="size-4" />
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-text">
              {isShiftOpen ? shiftTitle : isShiftClosing ? "Closing Shift..." : "No Active Shift"}
            </h4>
            <span className="text-[10px] text-text-muted">
              {isShiftOpen
                ? `${cashierName} • Shift Open`
                : "Open shift to enable billing"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={isShiftOpen ? onOpenCloseShift : onOpenCreateShift}
          className="h-7 px-3 rounded-lg bg-surface-alt hover:bg-surface-hover border border-border text-[11px] font-semibold text-text active:scale-[0.98]"
        >
          {isShiftOpen ? "Close" : "Start"}
        </button>
      </div>

      {/* ── Quick Patient / Customer Action (Dialog) ──────────── */}
      {onOpenCustomerModal && (
        <button
          type="button"
          onClick={onOpenCustomerModal}
          className="w-full h-8 px-3 rounded-lg bg-surface border border-border text-xs font-medium text-text flex items-center justify-center gap-1.5 active:scale-[0.98]"
        >
          <UserPlus className="size-3.5 text-text-muted" />
          <span>New Customer Registration</span>
        </button>
      )}

      {/* ── 2. 2x2 Counter Stats Grid ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs">
          <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1">
            <ShoppingCart className="size-3.5" />
          </div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">Today's Sales</span>
          <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatINR(todaySalesAmount)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs">
          <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mb-1">
            <Receipt className="size-3.5" />
          </div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">Billed Bills</span>
          <span className="text-base font-bold font-mono text-text">{todayInvoicesCount}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs">
          <div className="size-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-1">
            <Wallet className="size-3.5" />
          </div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">Physical Cash</span>
          <span className="text-base font-bold font-mono text-text">
            {formatINR(tillCashBalance)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs">
          <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center mb-1">
            <Clock className="size-3.5" />
          </div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">Till Float</span>
          <span className="text-base font-bold font-mono text-text">
            {formatINR(activeShift?.openingFloat || 0)}
          </span>
        </div>
      </div>

      {/* ── 3. Prominent Hero POS Button ──────────────────────── */}
      <button
        type="button"
        onClick={() => navigate(ROUTES.SALES)}
        className="w-full h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xs active:scale-[0.98]"
      >
        <ShoppingCart className="size-4" />
        <span>Open POS Billing Counter</span>
        <span className="text-[10px] font-mono opacity-80">(Alt+N)</span>
      </button>

      {/* ── 4. Core Counter Operations ────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider px-0.5">
          Counter Operations
        </span>

        {CORE_OPERATIONS.map((op) => {
          const Icon = op.icon;
          return (
            <div
              key={op.id}
              onClick={() => navigate(op.path)}
              className="p-3 rounded-xl bg-surface border border-border/90 hover:border-primary/50 shadow-2xs flex items-center justify-between active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                    op.color === "emerald"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : op.color === "blue"
                      ? "bg-blue-500/10 text-blue-600"
                      : op.color === "rose"
                      ? "bg-rose-500/10 text-rose-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text">{op.title}</h4>
                  <p className="text-[10px] text-text-muted">{op.subtitle}</p>
                </div>
              </div>
              <ArrowRight className="size-3.5 text-text-muted" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BranchOperationsStarterMobilePage;
