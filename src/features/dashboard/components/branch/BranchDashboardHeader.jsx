// src/features/dashboard/components/branch/BranchDashboardHeader.jsx

import { Calendar, ChevronDown, RefreshCw } from "lucide-react";
import { UIIconButton } from "@/components/ui";

export const BranchDashboardHeader = ({
  branchInfo,
  onRefresh,
  isLoading,
  selectedDate = "Oct 01, 2026",
  onDateChange,
}) => {
  const isDayOpen = (branchInfo?.businessDayStatus || "OPEN").toUpperCase() === "OPEN";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
          Branch Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5">
          Real-time overview of your pharmacy operations.
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        {/* Date Selector Pill */}
        <button
          type="button"
          onClick={onDateChange}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text shadow-2xs hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <Calendar className="size-3.5 text-text-muted" />
          <span>{selectedDate}</span>
          <ChevronDown className="size-3 text-text-muted ml-0.5" />
        </button>

        {/* Business Day Operational Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-success/30 bg-success-soft text-success text-xs font-semibold shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span>Business Day: {isDayOpen ? "OPEN" : "CLOSED"}</span>
        </div>

        {/* Refresh Action */}
        {onRefresh && (
          <UIIconButton
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh dashboard metrics"
            icon={
              <RefreshCw
                className={`size-3.5 text-text-muted ${isLoading ? "animate-spin text-primary" : ""}`}
              />
            }
          />
        )}
      </div>
    </div>
  );
};

export default BranchDashboardHeader;
