// src/features/dashboard/components/branch/BranchNearExpiryCard.jsx

import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const BranchNearExpiryCard = ({ items = [], className }) => {
  const navigate = useNavigate();

  const displayItems = items.length > 0 ? items : [
    { id: "1", product: "Dolo 650", batch: "DOL25A", expiry: "Nov 2026", stock: 120 },
    { id: "2", product: "Amoxicillin 500mg", batch: "AMX24F", expiry: "Nov 2026", stock: 85 },
    { id: "3", product: "Cetirizine 10mg", batch: "CET24G", expiry: "Dec 2026", stock: 60 },
    { id: "4", product: "Omeprazole 20mg", batch: "OME24H", expiry: "Dec 2026", stock: 45 },
    { id: "5", product: "Vitamin D3 60K", batch: "VIT24I", expiry: "Jan 2027", stock: 32 },
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
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
        <h2 className="text-sm font-bold text-text tracking-tight">
          Near Expiry Items (≤ 60 days)
        </h2>

        <button
          type="button"
          onClick={() => navigate("/workspace-products")}
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
              <th className="py-1.5 px-2">Product</th>
              <th className="py-1.5 px-2">Batch</th>
              <th className="py-1.5 px-2">Expiry</th>
              <th className="py-1.5 px-2 text-right">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {displayItems.slice(0, 5).map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-surface-alt/50 transition-colors">
                <td className="py-2 px-1 text-text-muted font-mono">{idx + 1}</td>
                <td className="py-2 px-2 font-medium text-text truncate max-w-[120px]">
                  {item.product}
                </td>
                <td className="py-2 px-2 text-text-muted font-mono">{item.batch}</td>
                <td className="py-2 px-2 font-semibold font-mono text-amber-600 dark:text-amber-400">
                  {item.expiry}
                </td>
                <td className="py-2 px-2 text-right font-mono font-medium text-text tabular-nums">
                  {item.stock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </UICard>
  );
};

export default BranchNearExpiryCard;
