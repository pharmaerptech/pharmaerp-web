// src/features/dashboard/components/company/CompanySalesPurchasesChartCard.jsx

import { useState } from "react";
import { TrendingUp, BarChart2 } from "lucide-react";
import { UICard, UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

const formatCompactIndian = (val) => {
  const num = Number(val || 0);
  if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(1)} Cr`;
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(1)} L`;
  if (num >= 1000) return `₹ ${(num / 1000).toFixed(0)} k`;
  return `₹ ${num}`;
};

const formatFullIndian = (val) => `₹ ${Number(val || 0).toLocaleString("en-IN")}`;

export const CompanySalesPurchasesChartCard = ({ chartData, className, isLoading = false }) => {
  const months = chartData?.months || [];
  const [activeMonthIdx, setActiveMonthIdx] = useState(null);

  if (isLoading) {
    return (
      <UICard variant="default" className={cn("p-4 rounded-xl border border-border bg-surface", className)}>
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <UISkeleton className="h-4 w-40" />
          <UISkeleton className="h-6 w-24" />
        </div>
        <div className="pt-4 space-y-3">
          <UISkeleton className="h-36 w-full" />
        </div>
      </UICard>
    );
  }

  // Calculate dynamic max value from data
  const highestVal = Math.max(
    ...months.flatMap((m) => [Number(m.sales || 0), Number(m.purchases || 0)]),
    0
  );
  const maxVal = highestVal > 0 ? Math.ceil(highestVal * 1.18) : 100000;

  // SVG dimensions
  const width = 480;
  const height = 210;
  const paddingLeft = 58;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const yTicks = [
    { label: formatCompactIndian(maxVal), value: maxVal },
    { label: formatCompactIndian(maxVal * 0.75), value: maxVal * 0.75 },
    { label: formatCompactIndian(maxVal * 0.5), value: maxVal * 0.5 },
    { label: formatCompactIndian(maxVal * 0.25), value: maxVal * 0.25 },
    { label: "₹ 0", value: 0 },
  ];

  const count = Math.max(months.length, 1);
  const groupWidth = chartWidth / count;
  const barWidth = 13;
  const barGap = 4;

  const selectedIdx = activeMonthIdx !== null ? activeMonthIdx : months.length > 0 ? months.length - 1 : null;
  const activeItem = selectedIdx !== null ? months[selectedIdx] : null;

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
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm sm:text-base font-bold text-text tracking-tight">
              Sales vs Purchases Trend
            </h2>
          </div>
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

        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-surface-alt/50 text-[11px] font-medium text-text-muted">
          <TrendingUp className="size-3 text-primary" />
          <span>Last 6 Months</span>
        </div>
      </div>

      {/* Clustered Bar Chart Body */}
      <div className="relative my-auto pt-3">
        {months.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <BarChart2 className="size-8 text-text-muted/40 mb-2" />
            <p className="text-xs text-text-muted font-medium">No sales or purchase records found</p>
          </div>
        ) : (
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

              const salesVal = Number(item.sales || 0);
              const purchVal = Number(item.purchases || 0);

              const salesHeight = maxVal > 0 ? (salesVal / maxVal) * chartHeight : 0;
              const salesY = paddingTop + chartHeight - salesHeight;

              const purchHeight = maxVal > 0 ? (purchVal / maxVal) * chartHeight : 0;
              const purchY = paddingTop + chartHeight - purchHeight;

              const isHovered = selectedIdx === idx;

              return (
                <g
                  key={`${item.month}-${idx}`}
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
                    height={Math.max(salesHeight, 0)}
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
                    height={Math.max(purchHeight, 0)}
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
                      "text-[11px] font-medium transition-colors select-none font-mono",
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
        )}

        {/* Dynamic Tooltip */}
        {activeItem && highestVal > 0 && (
          <div className="absolute top-2 right-4 pointer-events-none bg-surface/95 dark:bg-surface border border-border shadow-md rounded-lg px-2.5 py-1.5 text-xs space-y-0.5 backdrop-blur-xs">
            <div className="font-bold text-text text-[11px] border-b border-border/50 pb-0.5">
              {activeItem.month} {activeItem.year || ""}
            </div>
            <div className="flex items-center justify-between gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Sales:
              </span>
              <span className="font-mono font-semibold text-text tabular-nums">
                {formatFullIndian(activeItem.sales)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-sky-500 font-medium">
                <span className="size-1.5 rounded-full bg-sky-400" />
                Purchases:
              </span>
              <span className="font-mono font-semibold text-text tabular-nums">
                {formatFullIndian(activeItem.purchases)}
              </span>
            </div>
          </div>
        )}
      </div>
    </UICard>
  );
};

export default CompanySalesPurchasesChartCard;
