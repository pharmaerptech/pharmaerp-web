// src/features/dashboard/components/branch/BranchLowStockCard.jsx

import { ArrowRight, PackageCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard, UIEmptyState, UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const BranchLowStockCard = ({ items = [], className, isLoading = false }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <UICard
        variant="default"
        className={cn("p-4 rounded-xl border border-border bg-surface shadow-2xs", className)}
      >
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <UISkeleton className="h-4 w-32" />
          <UISkeleton className="h-4 w-16" />
        </div>
        <div className="py-3 space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <UISkeleton className="h-3.5 w-24" />
              <UISkeleton className="h-3.5 w-16" />
              <UISkeleton className="h-3.5 w-10" />
            </div>
          ))}
        </div>
      </UICard>
    );
  }

  const displayItems = Array.isArray(items) ? items : [];

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
          Low Stock Items
        </h2>

        <button
          type="button"
          onClick={() => navigate(ROUTES.STOCK_METRICS)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="size-3" />
        </button>
      </div>

      {/* Content */}
      <div className="my-auto py-1 min-w-0">
        {displayItems.length === 0 ? (
          <div className="py-6">
            <UIEmptyState
              icon={<PackageCheck className="size-8 text-emerald-500" />}
              title="All Products In Stock"
              description="No inventory items are below their reorder threshold in this branch."
            />
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-border/60 text-text-muted font-medium">
                  <th className="py-1.5 px-1 w-6">#</th>
                  <th className="py-1.5 px-2">Product</th>
                  <th className="py-1.5 px-2">SKU / Batch</th>
                  <th className="py-1.5 px-2 text-right">Stock</th>
                  <th className="py-1.5 px-2 text-right">Reorder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {displayItems.slice(0, 5).map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-surface-alt/50 transition-colors">
                    <td className="py-2 px-1 text-text-muted font-mono">{idx + 1}</td>
                    <td className="py-2 px-2 font-medium text-text truncate max-w-[120px]" title={item.product}>
                      {item.product}
                    </td>
                    <td className="py-2 px-2 text-text-muted font-mono text-[10px] truncate max-w-[90px]">
                      {item.sku || item.batch}
                    </td>
                    <td className="py-2 px-2 text-right font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                      {item.stock}
                    </td>
                    <td className="py-2 px-2 text-right text-text-muted font-mono tabular-nums">
                      {item.reorderAt ?? 10}
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

export default BranchLowStockCard;
