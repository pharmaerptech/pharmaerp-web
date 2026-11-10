// src/features/dashboard/components/company/CompanyInventoryAlertsCard.jsx

import {
  PackageX,
  AlertTriangle,
  Clock,
  CalendarX,
} from "lucide-react";
import { UICard, UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

export const CompanyInventoryAlertsCard = ({ alerts, className, isLoading = false }) => {

  if (isLoading) {
    return (
      <UICard variant="default" className={cn("p-4 rounded-xl border border-border bg-surface", className)}>
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <UISkeleton className="h-4 w-36" />
          <UISkeleton className="h-4 w-16" />
        </div>
        <div className="py-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <UISkeleton className="h-8 w-8 rounded-lg" />
              <UISkeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </UICard>
    );
  }

  const outOfStock = alerts?.outOfStock ?? 0;
  const lowStock = alerts?.lowStock ?? 0;
  const nearExpiry = alerts?.nearExpiry ?? 0;
  const expired = alerts?.expired ?? 0;

  const alertItems = [
    {
      id: "out-of-stock",
      label: "Out of Stock Items",
      count: outOfStock,
      countColor: outOfStock > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-text-muted",
      icon: PackageX,
      iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50",
    },
    {
      id: "low-stock",
      label: "Low Stock Items",
      count: lowStock,
      countColor: lowStock > 0 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-text-muted",
      icon: AlertTriangle,
      iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50",
    },
    {
      id: "near-expiry",
      label: "Near Expiry (< 30 days)",
      count: nearExpiry,
      countColor: nearExpiry > 0 ? "text-orange-600 dark:text-orange-400 font-bold" : "text-text-muted",
      icon: Clock,
      iconBg: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/50",
    },
    {
      id: "expired",
      label: "Expired Batches",
      count: expired,
      countColor: expired > 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-text-muted",
      icon: CalendarX,
      iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50",
    },
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
        <div>
          <h2 className="text-sm sm:text-base font-bold text-text tracking-tight">
            Inventory Shortages
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5">Aggregated across all branches</p>
        </div>
      </div>

      {/* 4 Summary Rows */}
      <div className="divide-y divide-border/50 py-1 space-y-1 my-auto">
        {alertItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between py-2 px-1 rounded-lg"
            >
              {/* Icon & Count */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("p-1.5 rounded-lg shrink-0", item.iconBg)}>
                  <Icon className="size-4" />
                </div>
                <span className={cn("font-mono text-sm tabular-nums w-8 text-center shrink-0", item.countColor)}>
                  {item.count}
                </span>
                <span className="text-xs font-medium text-text truncate">
                  {item.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </UICard>
  );
};

export default CompanyInventoryAlertsCard;
