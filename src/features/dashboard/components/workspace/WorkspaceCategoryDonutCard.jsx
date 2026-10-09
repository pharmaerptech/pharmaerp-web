// src/features/dashboard/components/workspace/WorkspaceCategoryDonutCard.jsx

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const WorkspaceCategoryDonutCard = ({ categoryData, className }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const categories = categoryData?.categories || [
    { name: "Allopathic Medicines", percentage: 54.2, color: "#10b981" },
    { name: "Generics", percentage: 18.6, color: "#0ea5e9" },
    { name: "OTC Products", percentage: 12.3, color: "#f59e0b" },
    { name: "Health & Wellness", percentage: 7.8, color: "#ec4899" },
    { name: "Personal Care", percentage: 4.1, color: "#8b5cf6" },
    { name: "Others", percentage: 3.0, color: "#94a3b8" },
  ];

  const totalFormatted = categoryData?.totalSalesFormatted || "₹ 1.48 Cr";

  // Donut geometry
  const size = 132;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Pure slice offsets computation
  const slices = categories.map((item, index) => {
    const priorOffsetPct = categories
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
        "p-4 rounded-xl border border-border bg-surface shadow-2xs flex flex-col justify-between",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
        <h2 className="text-sm sm:text-base font-bold text-text tracking-tight">
          Sales by Category
        </h2>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface-alt/50 text-xs font-medium text-text hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <span>This Month</span>
          <ChevronDown className="size-3 text-text-muted" />
        </button>
      </div>

      {/* Body: Donut on Left, Legend on Right */}
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
                  key={slice.name}
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
            <span className="text-sm font-bold font-mono text-text tabular-nums leading-tight">
              {totalFormatted}
            </span>
            <span className="text-[10px] text-text-muted font-medium leading-tight">
              Total Sales
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-1.5 pl-1 min-w-0">
          {categories.map((item, idx) => {
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={item.name}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "flex items-center justify-between text-xs py-0.5 px-1.5 rounded transition-colors cursor-pointer",
                  isHovered ? "bg-surface-alt/70 font-semibold" : "text-text"
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] font-medium text-text truncate">
                    {item.name}
                  </span>
                </div>

                <span className="font-mono text-[11px] font-semibold text-text tabular-nums shrink-0 ml-1.5">
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

export default WorkspaceCategoryDonutCard;
