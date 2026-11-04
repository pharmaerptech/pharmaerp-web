// src/features/dashboard/components/company/CompanyDashboardHeader.jsx

import React from "react";
import { Calendar, RotateCw, Building2, Store } from "lucide-react";
import { UIBadge, UIButton, UITabs } from "@/components/ui";
import { cn } from "@/lib/utils";

const TIMEFRAME_TABS = [
  { id: "Today", label: "Today" },
  { id: "This Month", label: "This Month" },
  { id: "This Quarter", label: "This Quarter" },
  { id: "This Year", label: "This Year" },
];

export const CompanyDashboardHeader = ({
  companyInfo,
  timeframe = "This Month",
  onTimeframeChange,
  dateRange = "Oct 01, 2026 - Oct 31, 2026",
  onRefresh,
  isLoading = false,
}) => {
  const displayDateRange = companyInfo?.dateRangeFormatted || dateRange;
  const companyName = companyInfo?.companyName || "Company Entity";
  const gstin = companyInfo?.gstin;
  const branchesCount = companyInfo?.activeBranchesCount ?? companyInfo?.totalBranchesCount ?? 0;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-1">
      {/* Title & Metadata Badges */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
            Company Dashboard
          </h1>

          <UIBadge
            variant="soft"
            color="primary"
            size="sm"
            icon={<Building2 className="size-3" />}
            label={companyName}
            className="font-semibold shrink-0"
          />

          {gstin && gstin !== "N/A" && (
            <UIBadge
              variant="outline"
              color="neutral"
              size="sm"
              label={`GSTIN: ${gstin}`}
              className="font-mono text-[11px] hidden md:inline-flex shrink-0"
            />
          )}

          <UIBadge
            variant="soft"
            color="success"
            size="sm"
            icon={<Store className="size-3" />}
            label={`${branchesCount} ${branchesCount === 1 ? "Branch" : "Branches"}`}
            className="font-mono text-[11px] shrink-0"
          />
        </div>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5 truncate">
          Corporate treasury, branch network performance, customer receivables, and supplier ledgers.
        </p>
      </div>

      {/* Right Controls: Date Range Display, UITabs Segmented Control & Refresh */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start lg:self-center shrink-0">
        {/* Date Range Display */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-medium text-text shadow-2xs shrink-0">
          <Calendar className="size-3.5 text-text-muted shrink-0" />
          <span className="font-mono tabular-nums whitespace-nowrap">{displayDateRange}</span>
        </div>

        {/* Reusable Segmented Tabs */}
        <UITabs
          tabs={TIMEFRAME_TABS}
          activeTab={timeframe}
          onChange={onTimeframeChange}
          variant="segmented"
          size="sm"
          className="shrink-0"
        />

        {/* Refresh Button */}
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

export default CompanyDashboardHeader;
