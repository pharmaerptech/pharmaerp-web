// src/features/dashboard/components/workspace/WorkspaceDashboardHeader.jsx

import React from "react";
import { RotateCw, Layers } from "lucide-react";
import { UIBadge, UIButton, UITabs } from "@/components/ui";
import { cn } from "@/lib/utils";

const WORKSPACE_TIMEFRAME_TABS = [
  { id: "This Month", label: "This Month" },
  { id: "This Quarter", label: "This Quarter" },
  { id: "This Year", label: "This Year" },
];

export const WorkspaceDashboardHeader = ({
  workspaceInfo,
  timeframe = "This Month",
  onTimeframeChange,
  onRefresh,
  isLoading = false,
}) => {
  const wsName = workspaceInfo?.name || "Healthcare Pharmacy Workspace";
  const wsCode = workspaceInfo?.code || "WS";

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-1">
      {/* Title & Organization Identity */}
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
            Workspace Dashboard
          </h1>

          <UIBadge
            variant="soft"
            color="primary"
            size="sm"
            icon={<Layers className="size-3" />}
            label={wsCode}
            className="font-mono font-bold shrink-0"
          />

          <UIBadge
            variant="soft"
            color="purple"
            size="sm"
            label={wsName}
            className="hidden sm:inline-flex font-semibold shrink-0"
          />
        </div>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5 truncate">
          Executive organization governance, legal entities, branch network, and staff access control.
        </p>
      </div>

      {/* Right Controls: Reusable UITabs, Live Sync & Refresh */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start lg:self-center shrink-0">
        {onTimeframeChange && (
          <UITabs
            tabs={WORKSPACE_TIMEFRAME_TABS}
            activeTab={timeframe}
            onChange={onTimeframeChange}
            variant="segmented"
            size="sm"
            className="shrink-0"
          />
        )}

        <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface text-xs text-text-muted font-medium shadow-2xs shrink-0">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="whitespace-nowrap">Live Workspace Sync</span>
        </div>

        {onRefresh && (
          <UIButton
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh Workspace Dashboard"
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

export default WorkspaceDashboardHeader;
