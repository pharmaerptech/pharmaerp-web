// src/features/dashboard/components/branch/BranchRecentSalesCard.jsx

import { ArrowRight, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard, UIBadge, UIEmptyState, UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const BranchRecentSalesCard = ({ sales = [], className, isLoading = false }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <UICard
        variant="default"
        className={cn("p-4 rounded-xl border border-border bg-surface shadow-2xs", className)}
      >
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <UISkeleton className="h-4 w-36" />
          <UISkeleton className="h-4 w-16" />
        </div>
        <div className="py-3 space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <UISkeleton className="h-3.5 w-14" />
              <UISkeleton className="h-3.5 w-20" />
              <UISkeleton className="h-3.5 w-24" />
              <UISkeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      </UICard>
    );
  }

  const displaySales = Array.isArray(sales) ? sales : [];

  const getPaymentColor = (method) => {
    const m = String(method || "Cash").toUpperCase();
    if (m.includes("UPI")) return "purple";
    if (m.includes("CARD")) return "info";
    if (m.includes("CREDIT") || m.includes("KHATA")) return "warning";
    if (m.includes("SPLIT")) return "primary";
    return "success";
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
          Today's Recent Sales
        </h2>

        <button
          type="button"
          onClick={() => navigate(ROUTES.REPORTS_SALES)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View Sales Report</span>
          <ArrowRight className="size-3" />
        </button>
      </div>

      {/* Content */}
      <div className="my-auto py-1 min-w-0">
        {displaySales.length === 0 ? (
          <div className="py-6">
            <UIEmptyState
              icon={<ShoppingCart className="size-8 text-text-muted" />}
              title="No Sales Recorded Today"
              description="Completed counter sales invoices will stream here in real time."
              variant="inline"
              size="sm"
            />
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-border/60 text-text-muted font-medium">
                  <th className="py-1.5 px-1">Time</th>
                  <th className="py-1.5 px-2">Invoice No.</th>
                  <th className="py-1.5 px-2">Customer</th>
                  <th className="py-1.5 px-1 text-center">Items</th>
                  <th className="py-1.5 px-2 text-right">Amount</th>
                  <th className="py-1.5 px-2 text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {displaySales.slice(0, 5).map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-surface-alt/50 transition-colors">
                    <td className="py-2 px-1 text-text-muted font-mono whitespace-nowrap">
                      {item.time}
                    </td>
                    <td className="py-2 px-2 text-text-muted font-mono">{item.invoiceNo}</td>
                    <td className="py-2 px-2 font-medium text-text truncate max-w-[110px]" title={item.customer}>
                      {item.customer}
                    </td>
                    <td className="py-2 px-1 text-center font-mono tabular-nums text-text-muted">
                      {item.items}
                    </td>
                    <td className="py-2 px-2 text-right font-bold font-mono text-text tabular-nums whitespace-nowrap">
                      ₹ {Number(item.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      <UIBadge
                        color={getPaymentColor(item.payment)}
                        size="xs"
                        variant="soft"
                        label={item.payment}
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

export default BranchRecentSalesCard;
