// src/features/dashboard/components/company/CompanyKpiGrid.jsx

import {
  BarChart3,
  ShoppingCart,
  TrendingUp,
  Smartphone,
  Wallet,
  Landmark,
  ArrowUpRight,
} from "lucide-react";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const CompanyKpiGrid = ({ kpis }) => {
  const cards = [
    {
      id: "sales",
      title: "Total Sales",
      value: kpis?.totalSales ? `₹ ${kpis.totalSales.toLocaleString()}` : "₹ 68,12,430",
      growth: kpis?.totalSalesGrowth || 14.6,
      subtext: "vs last month",
      icon: BarChart3,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50",
    },
    {
      id: "purchases",
      title: "Total Purchases",
      value: kpis?.totalPurchases ? `₹ ${kpis.totalPurchases.toLocaleString()}` : "₹ 42,18,900",
      growth: kpis?.totalPurchasesGrowth || 8.2,
      subtext: "vs last month",
      icon: ShoppingCart,
      iconBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50",
    },
    {
      id: "profit",
      title: "Gross Profit",
      value: kpis?.grossProfit ? `₹ ${kpis.grossProfit.toLocaleString()}` : "₹ 26,48,530",
      growth: kpis?.grossProfitGrowth || 16.3,
      subtext: "vs last month",
      icon: TrendingUp,
      iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50",
    },
    {
      id: "receivables",
      title: "Outstanding Receivables",
      value: kpis?.outstandingReceivables ? `₹ ${kpis.outstandingReceivables.toLocaleString()}` : "₹ 12,28,300",
      growth: kpis?.outstandingReceivablesGrowth || 6.8,
      subtext: "vs last month",
      icon: Smartphone,
      iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50",
    },
    {
      id: "payables",
      title: "Outstanding Payables",
      value: kpis?.outstandingPayables ? `₹ ${kpis.outstandingPayables.toLocaleString()}` : "₹ 18,42,750",
      growth: kpis?.outstandingPayablesGrowth || 11.2,
      subtext: "vs last month",
      icon: Wallet,
      iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50",
    },
    {
      id: "bank",
      title: "Bank Balance",
      value: kpis?.bankBalance ? `₹ ${kpis.bankBalance.toLocaleString()}` : "₹ 48,32,120",
      growth: kpis?.bankBalanceGrowth || 4.1,
      subtext: "vs last month",
      icon: Landmark,
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
            className="p-3.5 rounded-xl border border-border bg-surface shadow-2xs flex flex-col justify-between hover:border-border/80 transition-colors"
          >
            {/* Top row: Icon & Title */}
            <div className="flex items-center gap-2.5">
              <div className={cn("p-2 rounded-lg shrink-0", card.iconBg)}>
                <Icon className="size-4" />
              </div>
              <span className="text-xs font-medium text-text-muted leading-tight truncate">
                {card.title}
              </span>
            </div>

            {/* Middle: Value */}
            <div className="mt-3">
              <span className="text-lg sm:text-xl font-bold font-mono tracking-tight text-text tabular-nums block truncate">
                {card.value}
              </span>
            </div>

            {/* Bottom: Growth Badge */}
            <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3 shrink-0" />
              <span>{card.growth}%</span>
              <span className="text-text-muted font-normal truncate">{card.subtext}</span>
            </div>
          </UICard>
        );
      })}
    </div>
  );
};

export default CompanyKpiGrid;
