// src/features/dashboard/components/branch/BranchDashboardHeader.jsx

import React from "react";
import { Calendar, RotateCw, Store, Clock } from "lucide-react";
import { UIBadge, UIButton, UITabs } from "@/components/ui";
import { cn } from "@/lib/utils";

const BRANCH_DAY_TABS = [
  { id: "Today", label: "Today" },
  { id: "Yesterday", label: "Yesterday" },
];

export const BranchDashboardHeader = ({
  branchInfo,
  onRefresh,
  isLoading = false,
  selectedDate = "Today",
  onDateChange,
  onDateSelect,
}) => {
  const isDayOpen = (branchInfo?.businessDayStatus || "").toUpperCase() === "OPEN";
  const isShiftActive = branchInfo?.isShiftActive;
  const branchName = branchInfo?.branchName || "Branch Counter";
  const branchCode = branchInfo?.branchCode || "BR";

  const handleTabChange = (tabId) => {
    if (onDateSelect) {
      onDateSelect(tabId);
    } else if (onDateChange) {
      onDateChange(tabId);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-1">
      {/* Title & Metadata Badges */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
            Branch Dashboard
          </h1>

          <UIBadge
            variant="soft"
            color="primary"
            size="sm"
            icon={<Store className="size-3" />}
            label={branchName}
            className="font-semibold shrink-0"
          />

          {branchCode && (
            <UIBadge
              variant="outline"
              color="neutral"
              size="sm"
              label={branchCode}
              className="font-mono text-[11px] hidden md:inline-flex shrink-0"
            />
          )}

          {/* Business Day Operational Badge */}
          {isDayOpen ? (
            <UIBadge
              variant="soft"
              color="success"
              size="sm"
              className="gap-1.5 font-semibold font-mono text-[11px] shrink-0"
            >
              <span className="relative flex size-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full size-1.5 bg-success" />
              </span>
              <span>Day: OPEN</span>
            </UIBadge>
          ) : (
            <UIBadge
              variant="soft"
              color="warning"
              size="sm"
              label="Day: CLOSED"
              className="font-semibold font-mono text-[11px] shrink-0"
            />
          )}

          {/* Live Shift Badge */}
          {isShiftActive ? (
            <UIBadge
              variant="soft"
              color="success"
              size="sm"
              icon={<Clock className="size-3" />}
              label={branchInfo?.shiftName || "Shift Live"}
              className="font-mono text-[11px] hidden sm:inline-flex shrink-0"
            />
          ) : (
            <UIBadge
              variant="soft"
              color="neutral"
              size="sm"
              icon={<Clock className="size-3" />}
              label="Shift Closed"
              className="font-mono text-[11px] hidden sm:inline-flex shrink-0"
            />
          )}
        </div>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5 truncate">
          Live counter billing, active cashier drawer, hourly customer flow, and physical rack stock.
        </p>
      </div>

      {/* Right Controls: UITabs Operational Day Selector & Refresh */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start lg:self-center shrink-0">
        {/* Reusable Segmented Tabs for Today vs Yesterday */}
        <UITabs
          tabs={BRANCH_DAY_TABS}
          activeTab={selectedDate === "Yesterday" ? "Yesterday" : "Today"}
          onChange={handleTabChange}
          variant="segmented"
          size="sm"
          className="shrink-0"
        />

        {/* Date Indicator Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-medium text-text shadow-2xs shrink-0">
          <Calendar className="size-3.5 text-text-muted shrink-0" />
          <span className="font-mono tabular-nums whitespace-nowrap">{selectedDate}</span>
        </div>

        {/* Refresh Action */}
        {onRefresh && (
          <UIButton
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh Dashboard"
            className="gap-1.5 text-xs font-semibold px-2.5 py-1.5 h-auto cursor-pointer shrink-0 rounded-xl"
          >
            <RotateCw className={cn("size-3.5", isLoading && "animate-spin text-primary")} />
            <span className="hidden md:inline">{isLoading ? "Syncing..." : "Refresh"}</span>
          </UIButton>
        )}
      </div>
    </div>
  );
};

export default BranchDashboardHeader;
