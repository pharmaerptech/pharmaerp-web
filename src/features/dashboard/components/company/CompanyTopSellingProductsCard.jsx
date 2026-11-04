// src/features/dashboard/components/company/CompanyTopSellingProductsCard.jsx

import { ArrowRight, Pill } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard, UIEmptyState, UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const CompanyTopSellingProductsCard = ({ products = [], className, isLoading = false }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <UICard variant="default" className={cn("p-4 rounded-xl border border-border bg-surface", className)}>
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <UISkeleton className="h-4 w-40" />
          <UISkeleton className="h-4 w-20" />
        </div>
        <div className="py-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <UISkeleton className="h-4 w-28" />
              <UISkeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </UICard>
    );
  }

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
            Top Selling Products
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5">By gross realization</p>
        </div>

        <span className="text-[11px] font-mono font-medium text-text-muted bg-surface-alt px-2 py-0.5 rounded border border-border/50">
          Top {products.length}
        </span>
      </div>

      {/* Table Body */}
      <div className="my-auto py-1 min-w-0">
        {products.length === 0 ? (
          <div className="py-6">
            <UIEmptyState
              icon={<Pill className="size-8 text-text-muted" />}
              title="No Sales In Period"
              description="Prescription and OTC medicines sold during this timeframe will appear here."
              actionText="Record Sale"
              onAction={() => navigate(ROUTES.SALES || "/sales")}
            />
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-text-muted font-medium sticky top-0 bg-surface">
                  <th className="py-2 px-1.5 text-center w-6">#</th>
                  <th className="py-2 px-2">Product</th>
                  <th className="py-2 px-2">Category</th>
                  <th className="py-2 px-2 text-right">Units</th>
                  <th className="py-2 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {products.map((item, idx) => (
                  <tr
                    key={item.id || item.name}
                    className="hover:bg-surface-alt/40 transition-colors"
                  >
                    <td className="py-2 px-1.5 text-center font-mono text-text-muted">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2 font-semibold text-text truncate max-w-[130px]">
                      {item.name}
                    </td>
                    <td className="py-2 px-2 text-text-muted text-[11px] truncate">
                      {item.category}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-medium text-text tabular-nums">
                      {Number(item.unitsSold || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-text tabular-nums whitespace-nowrap">
                      ₹ {Number(item.amount || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer link to real workspace products catalog */}
      <div className="pt-2 border-t border-border/60 flex justify-end">
        <button
          type="button"
          onClick={() => navigate(ROUTES.WORKSPACE_PRODUCTS || "/workspace-products")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View Catalog SKUs</span>
          <ArrowRight className="size-3" />
        </button>
      </div>
    </UICard>
  );
};

export default CompanyTopSellingProductsCard;
