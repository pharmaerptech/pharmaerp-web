// src/features/dashboard/components/branch/BranchPurchaseReceiptsCard.jsx

import { ArrowRight, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard, UIBadge, UIEmptyState, UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const BranchPurchaseReceiptsCard = ({ receipts = [], className, isLoading = false }) => {
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
              <UISkeleton className="h-3.5 w-24" />
              <UISkeleton className="h-3.5 w-16" />
              <UISkeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      </UICard>
    );
  }

  const displayReceipts = Array.isArray(receipts) ? receipts : [];

  const getStatusColor = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("received") || s.includes("confirmed")) return "success";
    if (s.includes("draft")) return "secondary";
    if (s.includes("pending")) return "warning";
    return "primary";
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
          Today's Purchase Receipts
        </h2>

        <button
          type="button"
          onClick={() => navigate(ROUTES.REPORTS_PURCHASE)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="size-3" />
        </button>
      </div>

      {/* Content */}
      <div className="my-auto py-1 min-w-0">
        {displayReceipts.length === 0 ? (
          <div className="py-6">
            <UIEmptyState
              icon={<Package className="size-8 text-text-muted" />}
              title="No Inward Purchases Today"
              description="Purchase bills inwarded at this branch today will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-border/60 text-text-muted font-medium">
                  <th className="py-1.5 px-1 w-6">#</th>
                  <th className="py-1.5 px-2">Supplier</th>
                  <th className="py-1.5 px-2">Bill / Inv No.</th>
                  <th className="py-1.5 px-2 text-center">Items</th>
                  <th className="py-1.5 px-2 text-right">Amount</th>
                  <th className="py-1.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {displayReceipts.slice(0, 5).map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-surface-alt/50 transition-colors">
                    <td className="py-2 px-1 text-text-muted font-mono">{idx + 1}</td>
                    <td className="py-2 px-2 font-medium text-text truncate max-w-[110px]" title={item.supplier}>
                      {item.supplier}
                    </td>
                    <td className="py-2 px-2 text-text-muted font-mono text-[10px] truncate max-w-[90px]">
                      {item.invoiceNo}
                    </td>
                    <td className="py-2 px-2 text-center font-mono tabular-nums text-text-muted">
                      {item.items}
                    </td>
                    <td className="py-2 px-2 text-right font-bold font-mono text-text tabular-nums whitespace-nowrap">
                      ₹ {Number(item.amount || 0).toLocaleString("en-IN")}
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

export default BranchPurchaseReceiptsCard;
