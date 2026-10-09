// src/features/dashboard/components/branch/BranchLowStockCard.jsx

import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const BranchLowStockCard = ({ items = [], className }) => {
  const navigate = useNavigate();

  const displayItems = items.length > 0 ? items : [
    { id: "1", product: "Augmentin 625", batch: "AUG25A", stock: 12, reorderAt: 50 },
    { id: "2", product: "Paracetamol 500mg", batch: "PAR25B", stock: 28, reorderAt: 100 },
    { id: "3", product: "Azithromycin 500mg", batch: "AZT25C", stock: 32, reorderAt: 100 },
    { id: "4", product: "Pantoprazole 40mg", batch: "PAN25D", stock: 18, reorderAt: 50 },
    { id: "5", product: "Cetirizine 10mg", batch: "CET25E", stock: 24, reorderAt: 50 },
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
          Low Stock Items
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
              <th className="py-1.5 px-2 text-right">Stock</th>
              <th className="py-1.5 px-2 text-right">Reorder At</th>
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
                <td className="py-2 px-2 text-right font-bold font-mono text-red-600 dark:text-red-400 tabular-nums">
                  {item.stock}
                </td>
                <td className="py-2 px-2 text-right text-text-muted font-mono tabular-nums">
                  {item.reorderAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </UICard>
  );
};

export default BranchLowStockCard;
