// src/features/dashboard/components/branch/BranchKpiGrid.jsx

import { motion } from "framer-motion";
import { ShoppingCart, FileText, Users, CreditCard, Package } from "lucide-react";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const BranchKpiGrid = ({ kpis, className }) => {
  const cards = [
    {
      id: "todays-sales",
      title: "Today's Sales",
      value: `₹ ${(kpis?.todaysSales ?? 124580).toLocaleString()}`,
      growth: kpis?.todaysSalesGrowth ?? 12.6,
      icon: ShoppingCart,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-800/50",
    },
    {
      id: "total-invoices",
      title: "Total Invoices",
      value: (kpis?.totalInvoices ?? 218).toLocaleString(),
      growth: kpis?.totalInvoicesGrowth ?? 8.2,
      icon: FileText,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/50 dark:border-blue-800/50",
    },
    {
      id: "new-customers",
      title: "New Customers",
      value: (kpis?.newCustomers ?? 32).toLocaleString(),
      growth: kpis?.newCustomersGrowth ?? 28.0,
      icon: Users,
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200/50 dark:border-purple-800/50",
    },
    {
      id: "avg-bill-value",
      title: "Avg. Bill Value",
      value: `₹ ${(kpis?.avgBillValue ?? 572).toLocaleString()}`,
      growth: kpis?.avgBillValueGrowth ?? 4.5,
      icon: CreditCard,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-800/50",
    },
    {
      id: "items-sold",
      title: "Items Sold",
      value: (kpis?.itemsSold ?? 1842).toLocaleString(),
      growth: kpis?.itemsSoldGrowth ?? 10.1,
      icon: Package,
      iconColor: "text-rose-600 dark:text-rose-400",
      iconBg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/50 dark:border-rose-800/50",
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-3.5", className)}>
      {cards.map((card, index) => {
        const IconComponent = card.icon;

        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
          >
            <UICard
              variant="default"
              className="p-3.5 sm:p-4 rounded-xl border border-border bg-surface shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] sm:text-xs font-medium text-text-muted">
                    {card.title}
                  </span>
                  <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-text">
                    {card.value}
                  </div>
                </div>

                <div
                  className={cn(
                    "size-9 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs",
                    card.iconBg,
                    card.iconColor
                  )}
                >
                  <IconComponent className="size-4.5" />
                </div>
              </div>

              {/* Trend Pill */}
              <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-border/50 text-[11px]">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5">
                  <span>▲</span>
                  <span>{Math.abs(card.growth)}%</span>
                </span>
                <span className="text-text-muted">vs yesterday</span>
              </div>
            </UICard>
          </motion.div>
        );
      })}
    </div>
  );
};

export default BranchKpiGrid;
