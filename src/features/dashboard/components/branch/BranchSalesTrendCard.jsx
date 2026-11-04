// src/features/dashboard/components/branch/BranchSalesTrendCard.jsx

import { useState } from "react";
import { UICard, UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

const formatCompactIndian = (val) => {
  const num = Number(val || 0);
  if (num >= 10000000) return `₹ ${(num / 10000000).toFixed(1)} Cr`;
  if (num >= 100000) return `₹ ${(num / 100000).toFixed(1)} L`;
  if (num >= 1000) return `₹ ${(num / 1000).toFixed(0)} k`;
  return `₹ ${num}`;
};

export const BranchSalesTrendCard = ({ salesTrend, className, isLoading = false }) => {
  const [activePoint, setActivePoint] = useState(null);

  if (isLoading) {
    return (
      <UICard
        variant="default"
        className={cn("p-4 sm:p-4.5 rounded-xl border border-border bg-surface", className)}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
          <UISkeleton className="h-4 w-32" />
          <UISkeleton className="h-5 w-16" />
        </div>
        <div className="pt-4 space-y-3">
          <UISkeleton className="h-40 w-full" />
        </div>
      </UICard>
    );
  }

  const hourlyData = salesTrend?.hourlyData || [
    { time: "8 AM", sales: 0, invoices: 0 },
    { time: "10 AM", sales: 0, invoices: 0 },
    { time: "12 PM", sales: 0, invoices: 0 },
    { time: "2 PM", sales: 0, invoices: 0 },
    { time: "4 PM", sales: 0, invoices: 0 },
    { time: "6 PM", sales: 0, invoices: 0 },
    { time: "8 PM", sales: 0, invoices: 0 },
    { time: "10 PM", sales: 0, invoices: 0 },
  ];

  const highestSales = Math.max(...hourlyData.map((h) => Number(h.sales || 0)), 0);
  const maxSales = highestSales > 0 ? Math.ceil(highestSales * 1.25) : 10000;

  const highestInvoices = Math.max(...hourlyData.map((h) => Number(h.invoices || 0)), 0);
  const maxInvoices = highestInvoices > 0 ? Math.ceil(highestInvoices * 1.25) : 10;

  // SVG viewBox coordinates
  const width = 500;
  const height = 180;
  const paddingLeft = 52;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const stepX = hourlyData.length > 1 ? chartWidth / (hourlyData.length - 1) : chartWidth;

  // Line points string for invoices
  const linePoints = hourlyData
    .map((item, index) => {
      const x = paddingLeft + index * stepX;
      const invoiceRatio = maxInvoices > 0 ? Number(item.invoices || 0) / maxInvoices : 0;
      const y = paddingTop + chartHeight - invoiceRatio * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const yTicks = [
    { label: formatCompactIndian(maxSales), val: maxSales },
    { label: formatCompactIndian(maxSales * 0.75), val: maxSales * 0.75 },
    { label: formatCompactIndian(maxSales * 0.5), val: maxSales * 0.5 },
    { label: formatCompactIndian(maxSales * 0.25), val: maxSales * 0.25 },
    { label: "₹ 0", val: 0 },
  ];

  const activeItem = activePoint !== null ? hourlyData[activePoint] : null;
  const activeX = activePoint !== null ? paddingLeft + activePoint * stepX : 0;

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
        <div>
          <h2 className="text-sm sm:text-base font-bold text-text tracking-tight">
            Hourly Sales Trend
          </h2>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-border bg-surface-alt/60 text-xs font-medium text-text-muted">
          <span>{salesTrend?.timeframe || "Today"}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 text-[11px] text-text-muted font-medium">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>Sales Amount (₹)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-blue-500" />
          <span>Invoices</span>
        </div>
      </div>

      {/* Responsive Chart Container */}
      <div className="relative w-full pt-1 pb-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Horizontal Gridlines & Dynamic Y-Axis Labels */}
          {yTicks.map((grid, idx) => {
            const y = paddingTop + (idx / 4) * chartHeight;
            return (
              <g key={grid.label + idx}>
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-text-muted text-[9px] font-mono select-none"
                >
                  {grid.label}
                </text>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray={idx === 4 ? "0" : "2,3"}
                  strokeOpacity={0.5}
                />
              </g>
            );
          })}

          {/* Bar elements for Sales Amount */}
          {hourlyData.map((item, idx) => {
            const barWidth = 14;
            const x = paddingLeft + idx * stepX - barWidth / 2;
            const salesNum = Number(item.sales || 0);
            const barHeight = salesNum > 0 ? Math.max(4, (salesNum / maxSales) * chartHeight) : 0;
            const y = paddingTop + chartHeight - barHeight;
            const isActive = idx === activePoint;

            return (
              <rect
                key={item.time}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={2.5}
                className={cn(
                  "cursor-pointer transition-all duration-150",
                  isActive
                    ? "fill-emerald-500"
                    : "fill-emerald-400/80 hover:fill-emerald-500"
                )}
                onMouseEnter={() => setActivePoint(idx)}
                onMouseLeave={() => setActivePoint(null)}
              />
            );
          })}

          {/* Line & Curve for Invoices */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={linePoints}
          />

          {/* Points for line */}
          {hourlyData.map((item, idx) => {
            const x = paddingLeft + idx * stepX;
            const invoiceRatio = maxInvoices > 0 ? Number(item.invoices || 0) / maxInvoices : 0;
            const y = paddingTop + chartHeight - invoiceRatio * chartHeight;
            const isActive = idx === activePoint;

            return (
              <circle
                key={`dot-${item.time}`}
                cx={x}
                cy={y}
                r={isActive ? 4 : 2.5}
                className={cn(
                  "cursor-pointer transition-all",
                  isActive ? "fill-blue-600 stroke-white stroke-2" : "fill-blue-500"
                )}
                onMouseEnter={() => setActivePoint(idx)}
                onMouseLeave={() => setActivePoint(null)}
              />
            );
          })}

          {/* X-Axis Labels */}
          {hourlyData.map((item, idx) => {
            const x = paddingLeft + idx * stepX;
            return (
              <text
                key={`label-${item.time}`}
                x={x}
                y={height - 5}
                textAnchor="middle"
                className="fill-text-muted text-[9px] font-mono select-none"
              >
                {item.time}
              </text>
            );
          })}
        </svg>

        {/* Interactive Floating Tooltip */}
        {activeItem && (
          <div
            className="absolute pointer-events-none rounded-lg border border-border bg-surface/95 px-2.5 py-1.5 shadow-md backdrop-blur-sm text-[11px] font-sans z-10 transition-all duration-150"
            style={{
              left: `${(activeX / width) * 100}%`,
              top: "15%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="font-bold text-text mb-0.5">{activeItem.time}</div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>Sales: ₹ {Number(activeItem.sales || 0).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
              <span className="size-1.5 rounded-full bg-blue-500" />
              <span>Invoices: {activeItem.invoices || 0}</span>
            </div>
          </div>
        )}
      </div>
    </UICard>
  );
};

export default BranchSalesTrendCard;
