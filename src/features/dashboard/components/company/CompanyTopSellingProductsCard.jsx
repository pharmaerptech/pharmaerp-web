// src/features/dashboard/components/company/CompanyTopSellingProductsCard.jsx

import { ChevronDown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const CompanyTopSellingProductsCard = ({ products = [], className }) => {
  const navigate = useNavigate();

  const displayProducts = products.length > 0 ? products : [
    { id: "1", name: "Paracetamol 500mg", category: "Allopathic", unitsSold: 12450, amount: 124500 },
    { id: "2", name: "Augmentin 625", category: "Allopathic", unitsSold: 8320, amount: 208000 },
    { id: "3", name: "Azithromycin 500mg", category: "Allopathic", unitsSold: 6890, amount: 172250 },
    { id: "4", name: "Pantoprazole 40mg", category: "Generics", unitsSold: 6120, amount: 122400 },
    { id: "5", name: "Vitamin D3 60K", category: "Health & Wellness", unitsSold: 5480, amount: 98640 },
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
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
        <h2 className="text-sm sm:text-base font-bold text-text tracking-tight">
          Top Selling Products
        </h2>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface-alt/50 text-xs font-medium text-text hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <span>This Month</span>
          <ChevronDown className="size-3 text-text-muted" />
        </button>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto my-auto py-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/60 text-text-muted font-medium">
              <th className="py-2 px-1.5 text-center w-6">#</th>
              <th className="py-2 px-2">Product</th>
              <th className="py-2 px-2">Category</th>
              <th className="py-2 px-2 text-right">Units Sold</th>
              <th className="py-2 px-2 text-right">Sales Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {displayProducts.map((item, idx) => (
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
                  {item.unitsSold.toLocaleString()}
                </td>
                <td className="py-2 px-2 text-right font-mono font-bold text-text tabular-nums">
                  ₹ {item.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer link */}
      <div className="pt-2 border-t border-border/60 flex justify-end">
        <button
          type="button"
          onClick={() => navigate(ROUTES.PRODUCTS || "/products")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View All Products</span>
          <ArrowRight className="size-3" />
        </button>
      </div>
    </UICard>
  );
};

export default CompanyTopSellingProductsCard;
