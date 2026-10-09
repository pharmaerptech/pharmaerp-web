// src/features/dashboard/components/branch/BranchInterBranchTransfersCard.jsx

import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const BranchInterBranchTransfersCard = ({ transfers = [], className }) => {
  const navigate = useNavigate();

  const displayTransfers = transfers.length > 0 ? transfers : [
    { id: "1", fromTo: "Central → Indore", items: 50, status: "In Transit" },
    { id: "2", fromTo: "Indore → Bhopal", items: 20, status: "Completed" },
    { id: "3", fromTo: "Indore → Ujjain", items: 15, status: "Pending" },
    { id: "4", fromTo: "Dewas → Indore", items: 30, status: "Pending" },
    { id: "5", fromTo: "Bhopal → Indore", items: 12, status: "Cancelled" },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "In Transit":
        return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/50";
      case "Completed":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50";
      case "Pending":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50";
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
          Inter-Branch Transfers
        </h2>

        <button
          type="button"
          onClick={() => navigate("/transfer-order")}
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
              <th className="py-1.5 px-2">From → To</th>
              <th className="py-1.5 px-2 text-center">Items</th>
              <th className="py-1.5 px-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {displayTransfers.slice(0, 5).map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-surface-alt/50 transition-colors">
                <td className="py-2 px-1 text-text-muted font-mono">{idx + 1}</td>
                <td className="py-2 px-2 font-medium text-text truncate max-w-[140px]">
                  {item.fromTo}
                </td>
                <td className="py-2 px-2 text-center font-mono tabular-nums text-text-muted">
                  {item.items}
                </td>
                <td className="py-2 px-2 text-center">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap",
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

export default BranchInterBranchTransfersCard;
