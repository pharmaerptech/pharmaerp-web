// src/features/dashboard/components/branch/BranchPaymentBreakdownCard.jsx

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { UICard, UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

export const BranchPaymentBreakdownCard = ({ paymentData, className, isLoading = false }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (isLoading) {
    return (
      <UICard
        variant="default"
        className={cn("p-4 sm:p-4.5 rounded-xl border border-border bg-surface", className)}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
          <UISkeleton className="h-4 w-36" />
          <UISkeleton className="h-5 w-16" />
        </div>
        <div className="pt-4 flex items-center justify-between gap-4">
          <UISkeleton className="size-32 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <UISkeleton className="h-4 w-full" />
            <UISkeleton className="h-4 w-4/5" />
            <UISkeleton className="h-4 w-3/5" />
          </div>
        </div>
      </UICard>
    );
  }

  const items = paymentData?.breakdown || [];
  const totalSales = Number(paymentData?.totalSales || 0);
  const totalFormatted =
    paymentData?.totalSalesFormatted || `₹ ${totalSales.toLocaleString("en-IN")}`;

  // Donut geometry - balanced diameter and ring thickness
  const size = 132;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Pure slice offsets computation
  const slices = items.map((item, index) => {
    const priorOffsetPct = items
      .slice(0, index)
      .reduce((sum, curr) => sum + (curr.percentage || 0), 0);
    const pct = Math.max(0, Math.min(100, item.percentage || 0));
    const strokeDasharray = `${(pct / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((priorOffsetPct / 100) * circumference);
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

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
          Payment Mode Breakdown
        </h2>

        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border bg-surface-alt/60 text-xs font-medium text-text-muted">
          <span>Today</span>
        </div>
      </div>

      {/* Body: Donut Chart on Left, Legend on Right */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center my-auto">
          <div className="size-10 rounded-full bg-surface-alt flex items-center justify-center text-text-muted mb-2">
            <CreditCard className="size-5 opacity-60" />
          </div>
          <p className="text-xs font-medium text-text-muted">No sales transactions today</p>
          <span className="text-[11px] text-text-muted/70 font-mono">₹ 0 collected</span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 sm:gap-4 my-auto py-2 min-w-0">
          {/* SVG Donut */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="transform -rotate-90 select-none overflow-visible"
            >
              {/* Background track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="var(--border)"
                strokeOpacity={0.4}
                strokeWidth={strokeWidth}
              />

              {/* Slices */}
              {slices.map((slice, idx) => {
                const isHovered = hoveredIndex === idx;

                return (
                  <circle
                    key={slice.mode}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-150 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
              <span className="text-xs sm:text-sm font-bold font-mono text-text tabular-nums leading-tight truncate max-w-[90px]">
                {totalFormatted}
              </span>
              <span className="text-[10px] text-text-muted font-medium mt-0.5">
                Total Sales
              </span>
            </div>
          </div>

          {/* Legend List */}
          <div className="flex-1 space-y-1.5 pl-1 min-w-0">
            {items.map((item, idx) => {
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={item.mode}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={cn(
                    "flex items-center justify-between text-xs py-0.5 px-1.5 rounded transition-colors cursor-pointer",
                    isHovered ? "bg-surface-alt font-semibold" : "text-text"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[11px] font-medium text-text truncate">
                      {item.mode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-text-muted tabular-nums">
                      ₹ {Number(item.amount || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-text tabular-nums w-10 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </UICard>
  );
};

export default BranchPaymentBreakdownCard;
