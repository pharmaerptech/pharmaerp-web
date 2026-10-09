// src/features/dashboard/components/company/CompanyInventoryAlertsCard.jsx

import {
  PackageX,
  AlertTriangle,
  Clock,
  CalendarX,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const CompanyInventoryAlertsCard = ({ alerts, className }) => {
  const navigate = useNavigate();

  const outOfStock = alerts?.outOfStock || 58;
  const lowStock = alerts?.lowStock || 142;
  const nearExpiry = alerts?.nearExpiry || 46;
  const expired = alerts?.expired || 18;

  const alertItems = [
    {
      id: "out-of-stock",
      label: "Out of Stock Items",
      count: outOfStock,
      countColor: "text-rose-600 dark:text-rose-400",
      icon: PackageX,
      iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50",
      path: ROUTES.INVENTORY || "/inventory",
    },
    {
      id: "low-stock",
      label: "Low Stock Items",
      count: lowStock,
      countColor: "text-amber-600 dark:text-amber-400",
      icon: AlertTriangle,
      iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50",
      path: ROUTES.INVENTORY || "/inventory",
    },
    {
      id: "near-expiry",
      label: "Near Expiry (< 30 days)",
      count: nearExpiry,
      countColor: "text-orange-600 dark:text-orange-400",
      icon: Clock,
      iconBg: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200/50",
      path: ROUTES.INVENTORY || "/inventory",
    },
    {
      id: "expired",
      label: "Expired Items",
      count: expired,
      countColor: "text-rose-600 dark:text-rose-400",
      icon: CalendarX,
      iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50",
      path: ROUTES.INVENTORY || "/inventory",
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
        <h2 className="text-sm sm:text-base font-bold text-text tracking-tight">
          Inventory Alerts (All Branches)
        </h2>

        <button
          type="button"
          onClick={() => navigate(ROUTES.INVENTORY || "/inventory")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="size-3" />
        </button>
      </div>

      {/* 4 Interactive Rows */}
      <div className="divide-y divide-border/50 py-1 space-y-1 my-auto">
        {alertItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex items-center justify-between py-2 px-1 hover:bg-surface-alt/50 rounded-lg transition-colors cursor-pointer group"
            >
              {/* Icon & Count */}
              <div className="flex items-center gap-3">
                <div className={cn("p-1.5 rounded-lg shrink-0", item.iconBg)}>
                  <Icon className="size-4" />
                </div>
                <span className={cn("font-bold font-mono text-sm tabular-nums w-8", item.countColor)}>
                  {item.count}
                </span>
                <span className="text-xs font-medium text-text group-hover:text-primary transition-colors">
                  {item.label}
                </span>
              </div>

              {/* Chevron */}
              <ChevronRight className="size-3.5 text-text-muted group-hover:text-text transition-colors" />
            </div>
          );
        })}
      </div>
    </UICard>
  );
};

export default CompanyInventoryAlertsCard;
