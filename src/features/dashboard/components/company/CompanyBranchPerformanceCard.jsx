// src/features/dashboard/components/company/CompanyBranchPerformanceCard.jsx

import { ChevronDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const CompanyBranchPerformanceCard = ({ branches = [], className }) => {
  const navigate = useNavigate();

  const displayBranches = branches.length > 0 ? branches : [
    { id: "1", name: "Indore - Main", sales: 1824300, profit: 712400, growth: 16 },
    { id: "2", name: "Bhopal - MP Nagar", sales: 1492100, profit: 548210, growth: 12 },
    { id: "3", name: "Ujjain", sales: 1218450, profit: 423110, growth: 8 },
    { id: "4", name: "Dewas", sales: 1082300, profit: 376540, growth: 6 },
    { id: "5", name: "Indore - Vijay Nagar", sales: 1021800, profit: 388270, growth: 5 },
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
          Branch Performance
        </h2>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface-alt/50 text-xs font-medium text-text hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <span>This Month</span>
          <ChevronDown className="size-3 text-text-muted" />
        </button>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto my-auto py-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/60 text-text-muted font-medium">
              <th className="py-2 px-1.5 text-center w-6">#</th>
              <th className="py-2 px-2">Branch</th>
              <th className="py-2 px-2 text-right">Sales</th>
              <th className="py-2 px-2 text-right">Profit</th>
              <th className="py-2 px-2 text-right">Growth</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {displayBranches.map((item, idx) => (
              <tr
                key={item.id || item.name}
                className="hover:bg-surface-alt/40 transition-colors"
              >
                <td className="py-2 px-1.5 text-center font-mono text-text-muted">
                  {idx + 1}
                </td>
                <td className="py-2 px-2 font-semibold text-text truncate max-w-[140px]">
                  {item.name}
                </td>
                <td className="py-2 px-2 text-right font-mono font-medium text-text tabular-nums">
                  ₹ {item.sales.toLocaleString()}
                </td>
                <td className="py-2 px-2 text-right font-mono font-medium text-text tabular-nums">
                  ₹ {item.profit.toLocaleString()}
                </td>
                <td className="py-2 px-2 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  <span className="inline-flex items-center gap-0.5">
                    <ArrowUpRight className="size-3" />
                    {item.growth}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
