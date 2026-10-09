// src/features/dashboard/components/workspace/WorkspaceRecentActivityCard.jsx

import {
  ShoppingCart,
  ArrowLeftRight,
  CreditCard,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const WorkspaceRecentActivityCard = ({ activities = [], className }) => {
  const navigate = useNavigate();

  const displayActivities = activities.length > 0 ? activities : [
    { id: "1", time: "10:24 AM", type: "Sale", description: "Invoice #INV-10284", entity: "Indore - Main", amount: 1245, user: "Rohan S.", iconType: "cart" },
    { id: "2", time: "09:48 AM", type: "Purchase", description: "GRN #GRN-5582", entity: "Traveller Medico", amount: 18420, user: "Amit K.", iconType: "cart" },
    { id: "3", time: "09:15 AM", type: "Transfer", description: "Branch Transfer #TRF-210", entity: "Bhopal → Indore", amount: 5360, user: "Neha P.", iconType: "transfer" },
    { id: "4", time: "08:32 AM", type: "Payment", description: "Supplier Payment", entity: "LifeCare Distributors", amount: 25000, user: "Arjun M.", iconType: "payment" },
    { id: "5", time: "08:12 AM", type: "User", description: "New user invited", entity: "Traveller Medico", amount: null, user: "System", iconType: "user" },
  ];

  const getTypeIcon = (type) => {
    switch (type) {
      case "Sale":
        return { icon: ShoppingCart, bg: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/50" };
      case "Purchase":
        return { icon: ShoppingCart, bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50" };
      case "Transfer":
        return { icon: ArrowLeftRight, bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50" };
      case "Payment":
        return { icon: CreditCard, bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50" };
      case "User":
        return { icon: UserCheck, bg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/50" };
      default:
        return { icon: ShoppingCart, bg: "bg-surface-alt text-text-muted border border-border" };
    }
  };

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
          Recent Business Activity
        </h2>

        <button
          type="button"
          onClick={() => navigate(ROUTES.AUDIT_LOGS || ROUTES.REPORTS || "/reports")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="size-3" />
        </button>
      </div>

      {/* Activity Table Body */}
      <div className="overflow-x-auto my-auto py-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/60 text-text-muted font-medium">
              <th className="py-2 px-2">Time</th>
              <th className="py-2 px-2">Type</th>
              <th className="py-2 px-2">Description</th>
              <th className="py-2 px-2">Company / Branch</th>
              <th className="py-2 px-2 text-right">Amount</th>
              <th className="py-2 px-2 text-right">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {displayActivities.map((item) => {
              const meta = getTypeIcon(item.type);
              const Icon = meta.icon;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-surface-alt/40 transition-colors"
                >
                  <td className="py-2 px-2 font-mono text-[11px] text-text-muted whitespace-nowrap">
                    {item.time}
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 font-medium text-text">
                      <span className={cn("p-1 rounded-md shrink-0", meta.bg)}>
                        <Icon className="size-3" />
                      </span>
                      <span>{item.type}</span>
                    </span>
                  </td>
                  <td className="py-2 px-2 font-medium text-text truncate max-w-[150px]">
                    {item.description}
                  </td>
                  <td className="py-2 px-2 text-text-muted truncate max-w-[140px]">
                    {item.entity}
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-semibold text-text tabular-nums whitespace-nowrap">
                    {item.amount != null ? `₹ ${item.amount.toLocaleString()}` : "-"}
                  </td>
                  <td className="py-2 px-2 text-right text-text-muted whitespace-nowrap">
                    {item.user}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </UICard>
  );
};

export default WorkspaceRecentActivityCard;
