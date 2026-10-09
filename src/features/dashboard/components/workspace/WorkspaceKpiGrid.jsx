// src/features/dashboard/components/workspace/WorkspaceKpiGrid.jsx

import {
  BarChart3,
  ShoppingCart,
  TrendingUp,
  Building2,
  Store,
  Users,
} from "lucide-react";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const WorkspaceKpiGrid = ({ kpis }) => {
  const cards = [
    {
      id: "revenue",
      title: "Total Revenue",
      value: kpis?.totalRevenue ? `₹ ${kpis.totalRevenue.toLocaleString()}` : "₹ 1,48,32,450",
      valueColor: "text-emerald-700 dark:text-emerald-400",
      growth: 12.5,
      subtext: "vs last month",
      icon: BarChart3,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50",
    },
    {
      id: "purchases",
      title: "Total Purchases",
      value: kpis?.totalPurchases ? `₹ ${kpis.totalPurchases.toLocaleString()}` : "₹ 92,14,300",
      valueColor: "text-text",
      growth: 8.3,
      subtext: "vs last month",
      icon: ShoppingCart,
      iconBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50",
    },
    {
      id: "profit",
      title: "Gross Profit",
      value: kpis?.grossProfit ? `₹ ${kpis.grossProfit.toLocaleString()}` : "₹ 56,18,150",
      valueColor: "text-emerald-700 dark:text-emerald-400",
      growth: 18.2,
      subtext: "vs last month",
      icon: TrendingUp,
      iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50",
    },
    {
      id: "companies",
      title: "Active Companies",
      value: kpis?.activeCompanies ? `${kpis.activeCompanies} / ${kpis.activeCompaniesMax || 3}` : "3 / 3",
      valueColor: "text-text",
      growth: 0,
      subtext: "vs last month",
      icon: Building2,
      iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50",
    },
    {
      id: "branches",
      title: "Active Branches",
      value: kpis?.activeBranches ? `${kpis.activeBranches} / ${kpis.activeBranchesMax || 15}` : "12 / 15",
      valueColor: "text-text",
      growth: 20,
      subtext: "vs last month",
      icon: Store,
      iconBg: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/50",
    },
    {
      id: "staff",
      title: "Total Staff",
      value: kpis?.totalStaff ? `${kpis.totalStaff} / ${kpis.totalStaffMax || 50}` : "38 / 50",
      valueColor: "text-blue-600 dark:text-blue-400",
      growth: 11,
      subtext: "vs last month",
      icon: Users,
      iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <UICard
            key={card.id}
            variant="default"
            className="p-3.5 rounded-xl border border-border bg-surface shadow-2xs flex items-center gap-3.5 hover:border-border/80 transition-colors"
          >
            {/* Left: Square Icon Box */}
            <div className={cn("size-11 rounded-xl flex items-center justify-center shrink-0", card.iconBg)}>
              <Icon className="size-5" />
            </div>

            {/* Right: Stacked Title, Value, Growth */}
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-text-muted leading-none block truncate">
                {card.title}
              </span>

              <span className={cn("text-base sm:text-lg font-bold font-mono tracking-tight tabular-nums block truncate mt-1", card.valueColor)}>
                {card.value}
              </span>

              <div className="mt-1 flex items-center gap-1 text-[11px] leading-none">
                {card.growth > 0 ? (
                  <>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      ▲ {card.growth}%
                    </span>
                    <span className="text-text-muted truncate">{card.subtext}</span>
                  </>
                ) : (
                  <span className="text-text-muted truncate">
                    0% {card.subtext}
                  </span>
                )}
              </div>
            </div>
          </UICard>
        );
      })}
    </div>
  );
};

export default WorkspaceKpiGrid;
