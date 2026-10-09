// src/features/dashboard/components/company/CompanyInterBranchTransfersCard.jsx

import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const CompanyInterBranchTransfersCard = ({ transfers = [], className }) => {
  const navigate = useNavigate();

  const displayTransfers = transfers.length > 0 ? transfers : [
    { id: "1", date: "Oct 27", fromTo: "Central → Indore", items: 12, status: "In Transit" },
    { id: "2", date: "Oct 26", fromTo: "Indore → Bhopal", items: 8, status: "Completed" },
    { id: "3", date: "Oct 24", fromTo: "Dewas → Ujjain", items: 15, status: "Pending" },
    { id: "4", date: "Oct 22", fromTo: "Bhopal → Indore", items: 10, status: "Completed" },
    { id: "5", date: "Oct 20", fromTo: "Indore → Dewas", items: 6, status: "Cancelled" },
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
        return "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/50";
      default:
        return "bg-surface-alt text-text-muted border border-border";
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
          Inter-Branch Transfers
        </h2>

        <button
          type="button"
          onClick={() => navigate(ROUTES.TRANSFERS || "/transfers")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="size-3" />
        </button>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto my-auto py-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/60 text-text-muted font-medium">
              <th className="py-2 px-2">Date</th>
              <th className="py-2 px-2">From → To</th>
              <th className="py-2 px-2 text-center">Items</th>
              <th className="py-2 px-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {displayTransfers.map((item) => (
              <tr
                key={item.id || item.fromTo}
                className="hover:bg-surface-alt/40 transition-colors"
              >
                <td className="py-2 px-2 font-mono text-[11px] text-text-muted whitespace-nowrap">
                  {item.date}
                </td>
                <td className="py-2 px-2 font-semibold text-text truncate max-w-[140px]">
                  {item.fromTo}
                </td>
                <td className="py-2 px-2 text-center font-mono font-medium text-text tabular-nums">
                  {item.items}
                </td>
                <td className="py-2 px-2 text-center whitespace-nowrap">
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 rounded text-[10px] font-medium",
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

export default CompanyInterBranchTransfersCard;
