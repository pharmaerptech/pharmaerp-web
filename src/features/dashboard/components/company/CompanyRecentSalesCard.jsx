// src/features/dashboard/components/company/CompanyRecentSalesCard.jsx

import { ArrowRight, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard, UIBadge, UIEmptyState, UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const CompanyRecentSalesCard = ({ sales = [], className, isLoading = false }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <UICard
        variant="default"
        className={cn("p-4 rounded-xl border border-border bg-surface shadow-2xs", className)}
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
          <UISkeleton className="h-4 w-40" />
          <UISkeleton className="h-4 w-16" />
        </div>
        <div className="py-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <UISkeleton className="h-4 w-16" />
              <UISkeleton className="h-4 w-28" />
              <UISkeleton className="h-4 w-16" />
              <UISkeleton className="h-4 w-12" />
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
    if (m.includes("CREDIT")) return "warning";
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
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
        <h2 className="text-sm sm:text-base font-bold text-text tracking-tight">
          Recent Sales (All Branches)
        </h2>

        <button
          type="button"
          onClick={() => navigate(ROUTES.GSTR1)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View GSTR-1</span>
          <ArrowRight className="size-3" />
        </button>
      </div>

      {/* Content */}
      <div className="my-auto py-1 min-w-0">
        {displaySales.length === 0 ? (
          <div className="py-6">
            <UIEmptyState
              icon={<Receipt className="size-8 text-text-muted" />}
              title="No Recent Sales"
              description="Invoices created at retail POS or billing counters will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-text-muted font-medium">
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Branch</th>
                  <th className="py-2 px-2">Invoice No.</th>
                  <th className="py-2 px-2 text-right">Amount</th>
                  <th className="py-2 px-2 text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {displaySales.map((item) => (
                  <tr
                    key={item.id || item.invoiceNo}
                    className="hover:bg-surface-alt/40 transition-colors"
                  >
                    <td className="py-2 px-2 font-mono text-[11px] text-text-muted whitespace-nowrap">
                      {item.date}
                    </td>
                    <td
                      className="py-2 px-2 font-semibold text-text truncate max-w-[130px]"
                      title={item.branch}
                    >
                      {item.branch}
                    </td>
                    <td className="py-2 px-2 font-mono text-[11px] text-text-muted whitespace-nowrap">
                      {item.invoiceNo}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-text tabular-nums whitespace-nowrap">
                      ₹ {(Number(item.amount) || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      <UIBadge color={getPaymentColor(item.payment)} size="xs" variant="soft" label={item.payment} className="shrink-0" />
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

export default CompanyRecentSalesCard;
