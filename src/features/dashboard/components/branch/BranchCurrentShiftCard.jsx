// src/features/dashboard/components/branch/BranchCurrentShiftCard.jsx

import { Sun, Moon, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard, UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

export const BranchCurrentShiftCard = ({ shiftData, className, isLoading = false }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <UICard
        variant="default"
        className={cn("p-4 sm:p-4.5 rounded-xl border border-border bg-surface", className)}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
          <UISkeleton className="h-4 w-28" />
          <UISkeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="pt-3 space-y-3">
          <UISkeleton className="h-4 w-3/4" />
          <UISkeleton className="h-4 w-full" />
          <UISkeleton className="h-4 w-2/3" />
        </div>
      </UICard>
    );
  }

  const isLive = Boolean(shiftData?.isLive);
  const cashier = shiftData?.cashier || (isLive ? "Staff Cashier" : "Unassigned");
  const counter = shiftData?.counter || "Counter 1";
  const salesAmount = Number(shiftData?.salesAmount || 0);
  const invoices = Number(shiftData?.invoices || 0);
  const cashInDrawer = Number(shiftData?.cashInDrawer || 0);
  const shiftName = shiftData?.shiftName || (isLive ? "Shift #1" : "No Active Shift");
  const shiftTime = shiftData?.shiftTime || (isLive ? "Active" : "Closed");

  return (
    <UICard
      variant="default"
      className={cn(
        "p-4 sm:p-4.5 rounded-xl border border-border bg-surface shadow-2xs flex flex-col justify-between",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
        <h2 className="text-sm sm:text-base font-bold text-text tracking-tight">
          Current Shift
        </h2>

        {isLive ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border bg-surface-alt text-text-muted text-[10px] font-medium">
            <span className="size-1.5 rounded-full bg-text-muted/50" />
            <span>Closed</span>
          </span>
        )}
      </div>

      {/* Subheader: Shift Name & Hours */}
      <div className="flex items-center justify-between gap-2 pt-2 pb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "size-6 rounded-md flex items-center justify-center shrink-0",
              isLive
                ? "bg-amber-500/10 text-amber-500"
                : "bg-surface-alt text-text-muted"
            )}
          >
            {isLive ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </div>
          <span className="text-xs font-bold text-text truncate">{shiftName}</span>
        </div>
        <span className="text-[10px] text-text-muted font-mono shrink-0">
          {shiftTime}
        </span>
      </div>

      {/* Metadata Key-Value List */}
      <div className="divide-y divide-border/50 py-1 my-auto">
        <div className="flex items-center justify-between gap-2 py-1.5 text-xs">
          <span className="text-text-muted text-[11px] shrink-0">Cashier</span>
          <span className="font-semibold text-text truncate text-right">{cashier}</span>
        </div>

        <div className="flex items-center justify-between gap-2 py-1.5 text-xs">
          <span className="text-text-muted text-[11px] shrink-0">Counter</span>
          <span className="font-semibold text-text truncate text-right">{counter}</span>
        </div>

        <div className="flex items-center justify-between gap-2 py-1.5 text-xs">
          <span className="text-text-muted text-[11px] shrink-0">Sales Amount</span>
          <span className="font-bold font-mono tabular-nums text-text shrink-0">
            ₹ {salesAmount.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 py-1.5 text-xs">
          <span className="text-text-muted text-[11px] shrink-0">Invoices</span>
          <span className="font-bold font-mono tabular-nums text-text shrink-0">
            {invoices}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 py-1.5 text-xs">
          <span className="text-text-muted text-[11px] shrink-0">Cash in Drawer</span>
          <span className="font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
            ₹ {cashInDrawer.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
        <span className="text-[10px] text-text-muted">
          {isLive ? "Shift is ongoing" : "No cashier logged in"}
        </span>
        <button
          type="button"
          onClick={() => navigate("/operations/shifts")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>{isLive ? "View Shift" : "Open Shift"}</span>
          <ArrowRight className="size-3" />
        </button>
      </div>
    </UICard>
  );
};

export default BranchCurrentShiftCard;
