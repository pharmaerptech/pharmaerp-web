// src/features/dashboard/components/company/CompanyBranchPerformanceCard.jsx

import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard, UIEmptyState, UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { useNavigationPipeline } from "@/contexts/NavigationPipelineContext";
import usePermission from "@/hooks/usePermission";

export const CompanyBranchPerformanceCard = ({ branches = [], className, isLoading = false }) => {
  const navigate = useNavigate();
  const { enterBranch } = useNavigationPipeline();
  const { canWorkLevel } = usePermission();
  const canEnterBranch = canWorkLevel("branch");

  if (isLoading) {
    return (
      <UICard variant="default" className={cn("p-4 rounded-xl border border-border bg-surface", className)}>
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <UISkeleton className="h-4 w-36" />
          <UISkeleton className="h-4 w-20" />
        </div>
        <div className="py-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <UISkeleton className="h-4 w-24" />
              <UISkeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </UICard>
    );
  }

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
        <div>
          <h2 className="text-sm sm:text-base font-bold text-text tracking-tight">
            Branch Performance
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5">
            Ranked by gross sales volume
          </p>
        </div>

        <span className="text-[11px] font-mono font-medium text-text-muted bg-surface-alt px-2 py-0.5 rounded border border-border/50">
          {branches.length} {branches.length === 1 ? "Branch" : "Branches"}
        </span>
      </div>

      {/* Table Body or Empty State */}
      <div className="my-auto py-1 min-w-0">
        {branches.length === 0 ? (
          <div className="py-6">
            <UIEmptyState
              icon={<Store className="size-8 text-text-muted" />}
              title="No Branches Configured"
              description="Register physical branches under this company to see live sales rankings."
              actionText="View Branches"
              onAction={() => navigate(ROUTES.BRANCHES || "/branches")}
            />
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-text-muted font-medium sticky top-0 bg-surface">
                  <th className="py-2 px-1.5 text-center w-6">#</th>
                  <th className="py-2 px-2">Branch</th>
                  <th className="py-2 px-2 text-right">Sales</th>
                  <th className="py-2 px-2 text-right">Est. Profit</th>
                  <th className="py-2 px-2 text-right">Growth</th>
                  <th className="py-2 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {branches.map((item, idx) => {
                  const growth = Number(item.growth || 0);
                  const isPositive = growth > 0;
                  const isNegative = growth < 0;

                  return (
                    <tr
                      key={item.id || item.name}
                      onClick={() => canEnterBranch && enterBranch({ _id: item.id, name: item.name })}
                      className={`hover:bg-surface-alt/40 transition-colors group ${canEnterBranch ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <td className="py-2 px-1.5 text-center font-mono text-text-muted">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 font-semibold text-text truncate max-w-[130px]">
                        <span className="block truncate group-hover:text-primary transition-colors">{item.name}</span>
                        {item.code && (
                          <span className="block text-[10px] font-mono text-text-muted font-normal">
                            {item.code}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-medium text-text tabular-nums whitespace-nowrap">
                        ₹ {Number(item.sales || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-medium text-text tabular-nums whitespace-nowrap">
                        ₹ {Number(item.profit || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                        {isPositive ? (
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                            <ArrowUpRight className="size-3" />
                            {growth}%
                          </span>
                        ) : isNegative ? (
                          <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400">
                            <ArrowDownRight className="size-3" />
                            {Math.abs(growth)}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-text-muted">
                            <Minus className="size-3" />
                            0%
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {canEnterBranch ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              enterBranch({ _id: item.id, name: item.name });
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] transition-colors"
                          >
                            <span>Enter</span>
                            <ArrowRight className="size-2.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer link */}
      <div className="pt-2 border-t border-border/60 flex justify-end">
        <button
          type="button"
          onClick={() => navigate(ROUTES.BRANCHES || "/branches")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View All Branches</span>
          <ArrowRight className="size-3" />
        </button>
      </div>
    </UICard>
  );
};

export default CompanyBranchPerformanceCard;
