// src/features/dashboard/components/branch/BranchCurrentShiftCard.jsx

import { Sun, MoreVertical, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard, UIIconButton } from "@/components/ui";
import { cn } from "@/lib/utils";

export const BranchCurrentShiftCard = ({ shiftData, className }) => {
  const navigate = useNavigate();

  const cashier = shiftData?.cashier || "Rohit Sharma";
  const counter = shiftData?.counter || "Counter 1";
  const salesAmount = shiftData?.salesAmount || 124580;
  const invoices = shiftData?.invoices || 218;
  const cashInDrawer = shiftData?.cashInDrawer || 18250;
  const shiftName = shiftData?.shiftName || "Morning Shift";
  const shiftTime = shiftData?.shiftTime || "08:00 AM - 02:00 PM";

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

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-success/30 bg-success-soft text-success text-[10px] font-bold">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            <span>Live</span>
          </span>

          <UIIconButton
            variant="ghost"
            size="xs"
            aria-label="Shift options"
            icon={<MoreVertical className="size-3.5 text-text-muted" />}
          />
        </div>
      </div>

      {/* Subheader: Shift Name & Hours */}
      <div className="flex items-center justify-between gap-2 pt-2 pb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-6 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
            <Sun className="size-3.5" />
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
            ₹ {salesAmount.toLocaleString()}
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
            ₹ {cashInDrawer.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-2 border-t border-border/60 flex justify-end">
        <button
          type="button"
          onClick={() => navigate("/operations/shifts")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View Details</span>
          <ArrowRight className="size-3" />
        </button>
      </div>
    </UICard>
  );
};

export default BranchCurrentShiftCard;
