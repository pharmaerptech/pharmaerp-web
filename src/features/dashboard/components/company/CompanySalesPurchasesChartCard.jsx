// src/features/dashboard/components/company/CompanySalesPurchasesChartCard.jsx

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const CompanySalesPurchasesChartCard = ({ chartData, className }) => {
  const [activeMonthIdx, setActiveMonthIdx] = useState(5); // Default Oct (latest)

  const months = chartData?.months || [
    { month: "May", sales: 7200000, purchases: 4800000 },
    { month: "Jun", sales: 8800000, purchases: 6400000 },
    { month: "Jul", sales: 11400000, purchases: 7900000 },
    { month: "Aug", sales: 14500000, purchases: 9600000 },
    { month: "Sep", sales: 13200000, purchases: 8200000 },
    { month: "Oct", sales: 15800000, purchases: 10200000 },
  ];

  const maxVal = 20000000; // 2.0 Cr max scale

  // SVG dimensions
  const width = 480;
  const height = 210;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const yTicks = [
    { label: "₹ 2.0 Cr", value: 20000000 },
    { label: "₹ 1.5 Cr", value: 15000000 },
    { label: "₹ 1.0 Cr", value: 10000000 },
    { label: "₹ 50 L", value: 5000000 },
    { label: "₹ 0", value: 0 },
  ];

  const groupWidth = chartWidth / months.length;
  const barWidth = 14;
  const barGap = 4;

  const activeItem = months[activeMonthIdx] || months[5];

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
        <div>
          <h2 className="text-sm sm:text-base font-bold text-text tracking-tight">
            Sales vs Purchases Trend
          </h2>
          <div className="flex items-center gap-4 mt-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-text-muted text-[11px] font-medium">Sales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-sky-400" />
              <span className="text-text-muted text-[11px] font-medium">Purchases</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface-alt/50 text-xs font-medium text-text hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <span>Last 6 Months</span>
          <ChevronDown className="size-3 text-text-muted" />
        </button>
      </div>

      {/* Clustered Bar Chart Body */}
      <div className="relative my-auto pt-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[220px] select-none overflow-visible"
        >
          {/* Horizontal Grid Lines & Y-Labels */}
          {yTicks.map((tick) => {
            const y = paddingTop + chartHeight - (tick.value / maxVal) * chartHeight;
            return (
              <g key={tick.label}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--app-color-border, #e2e8f0)"
                  strokeDasharray="3 3"
                  strokeOpacity="0.6"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-text-muted text-[10px] font-mono select-none"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Clustered Bars */}
          {months.map((item, idx) => {
            const groupCenterX = paddingLeft + idx * groupWidth + groupWidth / 2;
            const salesBarX = groupCenterX - barWidth - barGap / 2;
            const purchBarX = groupCenterX + barGap / 2;

            const salesHeight = (item.sales / maxVal) * chartHeight;
            const salesY = paddingTop + chartHeight - salesHeight;

            const purchHeight = (item.purchases / maxVal) * chartHeight;
            const purchY = paddingTop + chartHeight - purchHeight;

            const isHovered = activeMonthIdx === idx;

            return (
              <g
                key={item.month}
                className="cursor-pointer"
                onMouseEnter={() => setActiveMonthIdx(idx)}
              >
                {/* Hit area */}
                <rect
                  x={groupCenterX - groupWidth / 2}
                  y={paddingTop}
                  width={groupWidth}
                  height={chartHeight}
                  fill="transparent"
                />

                {/* Sales Bar (Emerald) */}
                <rect
                  x={salesBarX}
                  y={salesY}
                  width={barWidth}
                  height={salesHeight}
                  rx="3"
                  className={cn(
                    "fill-emerald-500 transition-all duration-150",
                    isHovered ? "opacity-100" : "opacity-90 hover:opacity-100"
                  )}
                />

                {/* Purchases Bar (Sky Blue) */}
                <rect
                  x={purchBarX}
                  y={purchY}
                  width={barWidth}
                  height={purchHeight}
                  rx="3"
                  className={cn(
                    "fill-sky-400 transition-all duration-150",
                    isHovered ? "opacity-100" : "opacity-90 hover:opacity-100"
                  )}
                />

                {/* Month Label */}
                <text
                  x={groupCenterX}
                  y={height - paddingBottom + 16}
                  textAnchor="middle"
                  className={cn(
                    "text-[11px] font-medium transition-colors select-none",
                    isHovered
                      ? "fill-text font-bold"
                      : "fill-text-muted"
                  )}
                >
                  {item.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay (matching mockup Oct style) */}
        {activeItem && (
          <div className="absolute top-2 right-4 pointer-events-none bg-surface/95 dark:bg-surface border border-border shadow-md rounded-lg px-2.5 py-1.5 text-xs space-y-0.5 backdrop-blur-xs">
            <div className="font-bold text-text text-[11px] border-b border-border/50 pb-0.5">
              {activeItem.month} 2026
            </div>
            <div className="flex items-center justify-between gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Sales:
              </span>
              <span className="font-mono font-semibold text-text tabular-nums">
                ₹ {(activeItem.sales / 10000000).toFixed(2)} Cr
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-sky-500 font-medium">
                <span className="size-1.5 rounded-full bg-sky-400" />
                Purchases:
              </span>
              <span className="font-mono font-semibold text-text tabular-nums">
                ₹ {(activeItem.purchases / 10000000).toFixed(2)} Cr
              </span>
            </div>
          </div>
        )}
      </div>
    </UICard>
  );
};

export default CompanySalesPurchasesChartCard;
