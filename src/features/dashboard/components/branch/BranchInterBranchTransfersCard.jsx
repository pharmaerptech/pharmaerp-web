// src/features/dashboard/components/branch/BranchInterBranchTransfersCard.jsx

import React from "react";
import { ArrowRight, ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard, UIBadge, UIEmptyState, UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

export const BranchInterBranchTransfersCard = ({ transfers = [], className, isLoading = false }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <UICard
        variant="default"
        className={cn("p-4 rounded-xl border border-border bg-surface shadow-2xs", className)}
      >
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <UISkeleton className="h-4 w-40" />
          <UISkeleton className="h-4 w-16" />
        </div>
        <div className="py-3 space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <UISkeleton className="h-3.5 w-32" />
              <UISkeleton className="h-3.5 w-12" />
              <UISkeleton className="h-3.5 w-16" />
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
    if (s.includes("cancelled")) return "danger";
    return "secondary";
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
          onClick={() => navigate("/inventory/transfer-orders")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="size-3" />
        </button>
      </div>

      {/* Content */}
      <div className="my-auto py-1 min-w-0">
        {displayTransfers.length === 0 ? (
          <div className="py-6">
            <UIEmptyState
              icon={<ArrowLeftRight className="size-8 text-text-muted" />}
              title="No Inter-Branch Transfers"
              description="Stock transfer orders between this branch and others will appear here."
              variant="inline"
              size="sm"
            />
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
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
                    <td className="py-2 px-2 font-medium text-text truncate max-w-[140px]" title={item.fromTo}>
                      {item.fromTo}
                    </td>
                    <td className="py-2 px-2 text-center font-mono tabular-nums text-text-muted">
                      {item.items}
                    </td>
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      <UIBadge
                        color={getStatusColor(item.status)}
                        size="xs"
                        variant="soft"
                        label={item.status}
                        className="shrink-0"
                      />
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

export default BranchInterBranchTransfersCard;
