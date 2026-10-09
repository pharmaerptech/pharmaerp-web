// src/features/dashboard/components/workspace/WorkspaceSubscriptionUsageCard.jsx

import { Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const WorkspaceSubscriptionUsageCard = ({ usageData, className }) => {
  const navigate = useNavigate();

  const planName = usageData?.planName || "Growth Plan";
  const validTill = usageData?.validTill || "15 Mar 2027";
  const daysLeft = usageData?.daysLeft || 10;

  const branches = usageData?.branches || { used: 8, max: 15 };
  const staffSeats = usageData?.staffSeats || { used: 24, max: 50 };
  const storageGb = usageData?.storageGb || { used: 62, max: 200 };

  const branchPct = Math.round((branches.used / branches.max) * 100);
  const staffPct = Math.round((staffSeats.used / staffSeats.max) * 100);
  const storagePct = Math.round((storageGb.used / storageGb.max) * 100);

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
        <h2 className="text-sm sm:text-base font-bold text-text tracking-tight">
          Subscription & Usage
        </h2>

        <button
          type="button"
          onClick={() => navigate(ROUTES.SUBSCRIPTION || ROUTES.SETTINGS || "/settings")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface-alt/50 text-xs font-medium text-text hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <span>Manage Plan</span>
        </button>
      </div>

      {/* Body: 2 Sub-panels (Usage meters on left, Countdown card on right) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-auto py-2">
        {/* Left Sub-panel: Quota Meters */}
        <div className="flex-1 w-full space-y-2.5">
          {/* Plan badge & validity */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200/50 shrink-0">
              <Crown className="size-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-text">{planName}</span>
                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                  Active
                </span>
              </div>
              <span className="text-[10px] text-text-muted">
                Valid till {validTill}
              </span>
            </div>
          </div>

          {/* Progress bar 1: Branches */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-muted font-medium">Branches</span>
              <span className="font-mono text-text font-semibold">
                {branches.used} / {branches.max}
              </span>
            </div>
            <div className="w-full h-1.5 bg-surface-alt rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${branchPct}%` }}
              />
            </div>
          </div>

          {/* Progress bar 2: Staff Seats */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-muted font-medium">Staff Seats</span>
              <span className="font-mono text-text font-semibold">
                {staffSeats.used} / {staffSeats.max}
              </span>
            </div>
            <div className="w-full h-1.5 bg-surface-alt rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${staffPct}%` }}
              />
            </div>
          </div>

          {/* Progress bar 3: Storage */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-muted font-medium">Storage</span>
              <span className="font-mono text-text font-semibold">
                {storageGb.used} GB / {storageGb.max} GB
              </span>
            </div>
            <div className="w-full h-1.5 bg-surface-alt rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-300"
                style={{ width: `${storagePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Sub-panel: Days Left & Details button */}
        <div className="shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/25 dark:bg-emerald-950/20 min-w-[124px] text-center space-y-2">
          <div className="flex flex-col items-center">
            <span className="font-mono font-extrabold text-2xl text-emerald-600 dark:text-emerald-400 tabular-nums">
              {daysLeft}
            </span>
            <span className="text-[11px] text-text-muted font-medium">
              Days left
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.SUBSCRIPTION || ROUTES.SETTINGS || "/settings")}
            className="w-full py-1 px-2.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-surface hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer shadow-2xs"
          >
            View Details
          </button>
        </div>
      </div>
    </UICard>
  );
};

export default WorkspaceSubscriptionUsageCard;
