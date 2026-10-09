// src/features/dashboard/components/workspace/WorkspaceDashboardHeader.jsx

import { Calendar, ChevronDown, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

const TIMEFRAMES = ["Today", "This Month", "This Quarter", "This Year"];

export const WorkspaceDashboardHeader = ({
  timeframe = "This Month",
  onTimeframeChange,
  dateRange = "Oct 01, 2026 - Oct 31, 2026",
  onRefresh,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
          Workspace Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5">
          Overview of your entire organization across all companies and branches.
        </p>
      </div>

      {/* Right Controls: Date Range Dropdown & Timeframe Tabs */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* Date Range Selector */}
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text hover:bg-surface-hover transition-colors shadow-2xs cursor-pointer"
        >
          <Calendar className="size-3.5 text-text-muted" />
          <span className="font-mono tabular-nums">{dateRange}</span>
          <ChevronDown className="size-3 text-text-muted" />
        </button>

        {/* Timeframe Segmented Control (Discrete pills matching mockup) */}
        <div className="inline-flex items-center gap-1.5 text-xs">
          {TIMEFRAMES.map((tf) => {
            const isActive = timeframe === tf;
            return (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange?.(tf)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-2xs",
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-300/80 dark:border-emerald-700/80"
                    : "bg-surface border border-border text-text-muted hover:text-text hover:bg-surface-hover"
                )}
              >
                {tf}
              </button>
            );
          })}
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh Dashboard"
            className="p-1.5 rounded-lg border border-border bg-surface text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RotateCw className={cn("size-3.5", isLoading && "animate-spin text-primary")} />
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkspaceDashboardHeader;
