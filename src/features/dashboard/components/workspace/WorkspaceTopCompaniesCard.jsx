// src/features/dashboard/components/workspace/WorkspaceTopCompaniesCard.jsx

import { ChevronDown } from "lucide-react";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const WorkspaceTopCompaniesCard = ({ companies = [], className }) => {
  const displayCompanies = companies.length > 0 ? companies : [
    { id: "1", rank: 1, name: "Traveller Medico Pvt. Ltd.", code: "TRV-01", revenue: 6812430, growth: 14, progressPct: 75, badgeBg: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400", barColor: "bg-emerald-500" },
    { id: "2", rank: 2, name: "LifeCare Distributors", code: "LCD-01", revenue: 5218920, growth: 10, progressPct: 60, badgeBg: "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400", barColor: "bg-teal-500" },
    { id: "3", rank: 3, name: "HealthPlus Retail", code: "HPR-01", revenue: 2801100, growth: 8, progressPct: 40, badgeBg: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400", barColor: "bg-emerald-500" },
  ];

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
          Top Companies by Revenue
        </h2>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface-alt/50 text-xs font-medium text-text hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <span>This Month</span>
          <ChevronDown className="size-3 text-text-muted" />
        </button>
      </div>

      {/* Ranked Company Items */}
      <div className="space-y-3.5 my-auto py-2">
        {displayCompanies.map((comp) => (
          <div key={comp.id || comp.code} className="space-y-1.5">
            {/* Top row: Rank badge + Name + Code + Revenue + Growth */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={cn(
                    "size-5.5 rounded-full flex items-center justify-center font-bold font-mono text-xs shrink-0",
                    comp.badgeBg || "bg-emerald-100 text-emerald-700"
                  )}
                >
                  {comp.rank}
                </span>

                <div className="min-w-0">
                  <div className="text-xs font-bold text-text truncate">
                    {comp.name}
                  </div>
                  <div className="text-[10px] text-text-muted font-mono">
                    {comp.code}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-mono font-bold text-xs text-text tabular-nums">
                  ₹ {comp.revenue.toLocaleString()}
                </div>
                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  ▲ {comp.growth}%
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-surface-alt rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-300", comp.barColor || "bg-emerald-500")}
                style={{ width: `${comp.progressPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </UICard>
  );
};

export default WorkspaceTopCompaniesCard;
