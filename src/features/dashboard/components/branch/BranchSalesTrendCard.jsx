// src/features/dashboard/components/branch/BranchSalesTrendCard.jsx

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const BranchSalesTrendCard = ({ salesTrend, className }) => {
  const [activePoint, setActivePoint] = useState(3); // default index 3 is 2:00 PM as shown in Image 1

  const hourlyData = salesTrend?.hourlyData || [
    { time: "8 AM", sales: 25000, invoices: 45 },
    { time: "10 AM", sales: 48000, invoices: 82 },
    { time: "12 PM", sales: 72000, invoices: 130 },
    { time: "2 PM", sales: 124580, invoices: 218 },
    { time: "4 PM", sales: 65000, invoices: 115 },
    { time: "6 PM", sales: 88000, invoices: 160 },
    { time: "8 PM", sales: 105000, invoices: 190 },
    { time: "10 PM", sales: 124580, invoices: 218 },
  ];

  const maxSales = 200000;
  const maxInvoices = 250;

  // SVG viewBox coordinates
  const width = 500;
  const height = 180;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const stepX = chartWidth / (hourlyData.length - 1);

  // Line points string for invoices
  const linePoints = hourlyData
    .map((item, index) => {
      const x = paddingLeft + index * stepX;
      const y = paddingTop + chartHeight - (item.invoices / maxInvoices) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const activeItem = hourlyData[activePoint] || hourlyData[3];
  const activeX = paddingLeft + activePoint * stepX;

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
            Sales Trend
          </h2>
        </div>

        {/* Timeframe Dropdown */}
        <div className="relative inline-block">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface-alt/50 text-xs font-medium text-text hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <span>Today</span>
            <ChevronDown className="size-3 text-text-muted" />
          </button>
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
          {/* Horizontal Gridlines & Y-Axis Labels */}
          {[
            { label: "₹ 2.0 L", val: 200000 },
            { label: "₹ 1.5 L", val: 150000 },
            { label: "₹ 1.0 L", val: 100000 },
            { label: "₹ 50 K", val: 50000 },
            { label: "₹ 0", val: 0 },
          ].map((grid, idx) => {
            const y = paddingTop + (idx / 4) * chartHeight;
            return (
              <g key={grid.label}>
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
            const barHeight = Math.max(4, (item.sales / maxSales) * chartHeight);
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
            const y = paddingTop + chartHeight - (item.invoices / maxInvoices) * chartHeight;
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

        {/* Interactive Floating Tooltip (matching Image 1 at 2:00 PM) */}
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
              <span>Sales: ₹{activeItem.sales.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
              <span className="size-1.5 rounded-full bg-blue-500" />
              <span>Invoices: {activeItem.invoices}</span>
            </div>
          </div>
        )}
      </div>
    </UICard>
  );
};

export default BranchSalesTrendCard;
