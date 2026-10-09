// src/features/dashboard/components/company/CompanyDashboardHeader.jsx

import { Calendar, ChevronDown, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

const TIMEFRAMES = ["Today", "This Month", "This Quarter", "This Year"];

export const CompanyDashboardHeader = ({
  companyInfo,
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
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
            Company Dashboard
          </h1>
          {companyInfo?.companyName && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md border border-border bg-surface-alt/60 text-xs font-medium text-text-muted">
              {companyInfo.companyName}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5">
          Overview of your company&apos;s performance across all branches.
        </p>
      </div>

      {/* Right Controls: Date Range Dropdown & Timeframe Tabs */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* Date Range Selector */}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text hover:bg-surface-hover transition-colors shadow-2xs cursor-pointer"
        >
          <Calendar className="size-3.5 text-text-muted" />
          <span className="font-mono tabular-nums">{dateRange}</span>
          <ChevronDown className="size-3 text-text-muted" />
        </button>

        {/* Timeframe Segmented Control */}
        <div className="inline-flex items-center p-0.5 rounded-lg border border-border bg-surface-alt/70 text-xs shadow-2xs">
          {TIMEFRAMES.map((tf) => {
            const isActive = timeframe === tf;
            return (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange?.(tf)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold shadow-2xs border border-emerald-500/30"
                    : "text-text-muted hover:text-text hover:bg-surface/50"
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

export default CompanyDashboardHeader;
