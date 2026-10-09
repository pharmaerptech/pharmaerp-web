// src/features/dashboard/components/branch/BranchPaymentBreakdownCard.jsx

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const BranchPaymentBreakdownCard = ({ paymentData, className }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const items = paymentData?.breakdown || [
    { mode: "Cash", percentage: 42.3, amount: 52697, color: "#16a34a" },
    { mode: "UPI", percentage: 28.6, amount: 35630, color: "#2563eb" },
    { mode: "Card", percentage: 18.4, amount: 22923, color: "#f59e0b" },
    { mode: "Credit (Khata)", percentage: 7.2, amount: 8970, color: "#dc2626" },
    { mode: "Others", percentage: 3.5, amount: 4360, color: "#64748b" },
  ];

  const totalFormatted = paymentData?.totalSalesFormatted || "₹ 1.24 L";

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

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface-alt/50 text-xs font-medium text-text hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <span>Today</span>
          <ChevronDown className="size-3 text-text-muted" />
        </button>
      </div>

      {/* Body: Donut Chart on Left, Legend on Right */}
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
              stroke="var(--app-color-surface-alt, #f1f5f9)"
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
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-sm font-bold font-mono text-text tabular-nums">
              {totalFormatted}
            </span>
            <span className="text-[10px] text-text-muted font-medium">
              Total Sales
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-1.5 pl-1">
          {items.map((item, idx) => {
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={item.mode}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "flex items-center justify-between text-xs py-0.5 px-1.5 rounded transition-colors cursor-pointer",
                  isHovered ? "bg-surface-alt/70 font-semibold" : "text-text"
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

                <span className="font-mono text-[11px] font-semibold text-text tabular-nums shrink-0">
                  {item.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </UICard>
  );
};

export default BranchPaymentBreakdownCard;
