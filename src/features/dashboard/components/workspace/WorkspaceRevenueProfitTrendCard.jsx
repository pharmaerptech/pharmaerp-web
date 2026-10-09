// src/features/dashboard/components/workspace/WorkspaceRevenueProfitTrendCard.jsx

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const WorkspaceRevenueProfitTrendCard = ({ chartData, className }) => {
  const [activeMonthIdx, setActiveMonthIdx] = useState(5); // Default Oct (latest)

  const months = chartData?.months || [
    { month: "May", revenue: 9500000, purchases: 5800000, profit: 3700000 },
    { month: "Jun", revenue: 11800000, purchases: 7200000, profit: 4600000 },
    { month: "Jul", revenue: 13900000, purchases: 8400000, profit: 5500000 },
    { month: "Aug", revenue: 16800000, purchases: 10200000, profit: 6600000 },
    { month: "Sep", revenue: 14200000, purchases: 8900000, profit: 5300000 },
    { month: "Oct", revenue: 14832450, purchases: 9214300, profit: 5618150 },
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

  // Profit overlay line points
  const profitLinePoints = months
    .map((item, idx) => {
      const cx = paddingLeft + idx * groupWidth + groupWidth / 2;
      const cy = paddingTop + chartHeight - (item.profit / maxVal) * chartHeight;
      return `${cx},${cy}`;
    })
    .join(" ");

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
            Revenue & Profit Trend
          </h2>
          <div className="flex items-center gap-3.5 mt-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-text-muted text-[11px] font-medium">Sales Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-sky-400" />
              <span className="text-text-muted text-[11px] font-medium">Purchases</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-amber-500" />
              <span className="text-text-muted text-[11px] font-medium">Gross Profit</span>
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

      {/* Combo Clustered Bar + Overlay Line Chart Body */}
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
            const revBarX = groupCenterX - barWidth - barGap / 2;
            const purchBarX = groupCenterX + barGap / 2;

            const revHeight = (item.revenue / maxVal) * chartHeight;
            const revY = paddingTop + chartHeight - revHeight;

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

                {/* Revenue Bar (Emerald) */}
                <rect
                  x={revBarX}
                  y={revY}
                  width={barWidth}
                  height={revHeight}
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

          {/* Overlay Gross Profit Line */}
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={profitLinePoints}
          />

          {/* Overlay Nodes on Profit Line */}
          {months.map((item, idx) => {
            const cx = paddingLeft + idx * groupWidth + groupWidth / 2;
            const cy = paddingTop + chartHeight - (item.profit / maxVal) * chartHeight;
            const isHovered = activeMonthIdx === idx;

            return (
              <circle
                key={`node-${item.month}`}
                cx={cx}
                cy={cy}
                r={isHovered ? "4.5" : "3.5"}
                className={cn(
                  "fill-surface stroke-amber-500 stroke-2 transition-all cursor-pointer",
                  isHovered && "fill-amber-500 stroke-surface stroke-2"
                )}
                onMouseEnter={() => setActiveMonthIdx(idx)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay (matching mockup Oct style) */}
        {activeItem && (
          <div className="absolute top-4 right-5 pointer-events-none bg-surface/95 dark:bg-surface border border-border/80 shadow-md rounded-xl p-2.5 text-xs space-y-1.5 backdrop-blur-xs min-w-[130px]">
            <div className="font-bold text-text text-xs border-b border-border/50 pb-1">
              {activeItem.month} 2026
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-text-muted font-medium">
                <span className="size-2 rounded-full bg-emerald-500" />
                Revenue
              </span>
              <span className="font-mono font-bold text-text tabular-nums">
                ₹ {(activeItem.revenue / 10000000).toFixed(2)} Cr
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-text-muted font-medium">
                <span className="size-2 rounded-full bg-sky-400" />
                Purchases
              </span>
              <span className="font-mono font-bold text-text tabular-nums">
                ₹ {(activeItem.purchases / 100000).toFixed(2)} L
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-text-muted font-medium">
                <span className="size-2 rounded-full bg-amber-500" />
                Profit
              </span>
              <span className="font-mono font-bold text-text tabular-nums">
                ₹ {(activeItem.profit / 100000).toFixed(2)} L
              </span>
            </div>
          </div>
        )}
      </div>
    </UICard>
  );
};

export default WorkspaceRevenueProfitTrendCard;
