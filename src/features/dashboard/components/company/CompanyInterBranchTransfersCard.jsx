// src/features/dashboard/components/company/CompanyInterBranchTransfersCard.jsx

import { ArrowLeftRight } from "lucide-react";
import { UICard, UIBadge, UIEmptyState, UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

export const CompanyInterBranchTransfersCard = ({ transfers = [], className, isLoading = false }) => {

  if (isLoading) {
    return (
      <UICard
        variant="default"
        className={cn("p-4 rounded-xl border border-border bg-surface shadow-2xs", className)}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
          <UISkeleton className="h-4 w-36" />
          <UISkeleton className="h-4 w-16" />
        </div>
        <div className="py-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <UISkeleton className="h-4 w-16" />
              <UISkeleton className="h-4 w-32" />
              <UISkeleton className="h-4 w-12" />
              <UISkeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
      </UICard>
    );
  }

  const displayTransfers = Array.isArray(transfers) ? transfers : [];

  const getStatusColor = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("completed")) return "success";
    if (s.includes("transit")) return "info";
    if (s.includes("pending")) return "warning";
    if (s.includes("cancelled")) return "error";
    return "neutral";
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
      </div>

      {/* Content */}
      <div className="my-auto py-1 min-w-0">
        {displayTransfers.length === 0 ? (
          <div className="py-6">
            <UIEmptyState
              icon={<ArrowLeftRight className="size-8 text-text-muted" />}
              title="No Inter-Branch Transfers"
              description="Stock transfer orders between company branches will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
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
                    <td
                      className="py-2 px-2 font-semibold text-text truncate max-w-[140px]"
                      title={item.fromTo}
                    >
                      {item.fromTo}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-medium text-text tabular-nums">
                      {item.items}
                    </td>
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      <UIBadge color={getStatusColor(item.status)} size="xs" variant="soft" label={item.status} className="shrink-0" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </UICard>
  );
};

export default CompanyInterBranchTransfersCard;
