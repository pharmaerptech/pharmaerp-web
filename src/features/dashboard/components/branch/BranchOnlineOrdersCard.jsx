// src/features/dashboard/components/branch/BranchOnlineOrdersCard.jsx

import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const BranchOnlineOrdersCard = ({ orders = [], className }) => {
  const navigate = useNavigate();

  const displayOrders = orders.length > 0 ? orders : [
    { id: "1", orderNo: "PO-77821", customer: "Aman Gupta", amount: 1250, status: "Preparing" },
    { id: "2", orderNo: "PO-77820", customer: "Sneha Patel", amount: 890, status: "Packed" },
    { id: "3", orderNo: "PO-77819", customer: "Rohan Mehta", amount: 1480, status: "Out for Delivery" },
    { id: "4", orderNo: "PO-77818", customer: "Kunal Jain", amount: 620, status: "Delivered" },
    { id: "5", orderNo: "PO-77817", customer: "Neha Singh", amount: 980, status: "Cancelled" },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "Preparing":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50";
      case "Packed":
        return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/50";
      case "Out for Delivery":
        return "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200/50";
      case "Delivered":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50";
      case "Cancelled":
        return "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200/50";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200";
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
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
        <h2 className="text-sm font-bold text-text tracking-tight">
          Today's Online Orders (Pahuch)
        </h2>

        <button
          type="button"
          onClick={() => navigate("/marketplace")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="size-3" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto my-auto py-1">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-border/60 text-text-muted font-medium">
              <th className="py-1.5 px-1 w-6">#</th>
              <th className="py-1.5 px-2">Order No.</th>
              <th className="py-1.5 px-2">Customer</th>
              <th className="py-1.5 px-2 text-right">Amount</th>
              <th className="py-1.5 px-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {displayOrders.slice(0, 5).map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-surface-alt/50 transition-colors">
                <td className="py-2 px-1 text-text-muted font-mono">{idx + 1}</td>
                <td className="py-2 px-2 text-text-muted font-mono">{item.orderNo}</td>
                <td className="py-2 px-2 font-medium text-text truncate max-w-[110px]">
                  {item.customer}
                </td>
                <td className="py-2 px-2 text-right font-bold font-mono text-text tabular-nums">
                  ₹ {Number(item.amount).toLocaleString()}
                </td>
                <td className="py-2 px-2 text-center">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold",
                      getStatusBadge(item.status)
                    )}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </UICard>
  );
};

export default BranchOnlineOrdersCard;
