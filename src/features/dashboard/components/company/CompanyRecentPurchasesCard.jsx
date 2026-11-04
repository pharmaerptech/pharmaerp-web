// src/features/dashboard/components/company/CompanyRecentPurchasesCard.jsx

import React from "react";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard, UIBadge, UIButton, UIEmptyState, UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const CompanyRecentPurchasesCard = ({ purchases = [], className, isLoading = false }) => {
  const navigate = useNavigate();

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
              <UISkeleton className="h-4 w-20" />
              <UISkeleton className="h-4 w-28" />
              <UISkeleton className="h-4 w-16" />
              <UISkeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </UICard>
    );
  }

  const displayPurchases = Array.isArray(purchases) ? purchases : [];

  const getStatusColor = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("received") || s.includes("confirmed")) return "success";
    if (s.includes("partial") || s.includes("pending")) return "warning";
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
          Recent Purchases
        </h2>

        <button
          type="button"
          onClick={() => navigate(ROUTES.PURCHASES || "/purchases")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="size-3" />
        </button>
      </div>

      {/* Content */}
      <div className="my-auto py-1 min-w-0">
        {displayPurchases.length === 0 ? (
          <div className="py-6">
            <UIEmptyState
              icon={<ShoppingBag className="size-8 text-text-muted" />}
              title="No Recent Purchases"
              description="Procurement bills entered for this company will be listed here."
              action={
                <UIButton
                  size="xs"
                  variant="outline"
                  onClick={() => navigate(ROUTES.CREATE_PURCHASE_BILL || "/purchases/bills/create")}
                  className="mt-2"
                >
                  New Purchase Bill
                </UIButton>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-text-muted font-medium">
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Supplier</th>
                  <th className="py-2 px-2">Invoice No.</th>
                  <th className="py-2 px-2 text-center">Items</th>
                  <th className="py-2 px-2 text-right">Amount</th>
                  <th className="py-2 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {displayPurchases.map((item) => (
                  <tr
                    key={item.id || item.invoiceNo}
                    className="hover:bg-surface-alt/40 transition-colors"
                  >
                    <td className="py-2 px-2 font-mono text-[11px] text-text-muted whitespace-nowrap">
                      {item.date}
                    </td>
                    <td
                      className="py-2 px-2 font-medium text-text truncate max-w-[130px]"
                      title={item.supplier}
                    >
                      {item.supplier}
                    </td>
                    <td className="py-2 px-2 font-mono text-[11px] text-text-muted whitespace-nowrap">
                      {item.invoiceNo}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-text-muted tabular-nums">
                      {item.items}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-semibold text-text tabular-nums whitespace-nowrap">
                      ₹ {(Number(item.amount) || 0).toLocaleString("en-IN")}
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

export default CompanyRecentPurchasesCard;
