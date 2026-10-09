// src/features/dashboard/components/company/CompanyRecentPurchasesCard.jsx

import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const CompanyRecentPurchasesCard = ({ purchases = [], className }) => {
  const navigate = useNavigate();

  const displayPurchases = purchases.length > 0 ? purchases : [
    { id: "1", date: "Oct 28, 2026", supplier: "Sun Pharma Distributors", invoiceNo: "SP-10283", items: 24, amount: 124580, status: "Received" },
    { id: "2", date: "Oct 26, 2026", supplier: "Mankind Pharma", invoiceNo: "MP-55821", items: 15, amount: 84320, status: "Received" },
    { id: "3", date: "Oct 22, 2026", supplier: "Cipla Distributors", invoiceNo: "CP-77810", items: 32, amount: 214500, status: "Received" },
    { id: "4", date: "Oct 20, 2026", supplier: "Abbott Healthcare", invoiceNo: "AB-44128", items: 18, amount: 96420, status: "Partial" },
    { id: "5", date: "Oct 18, 2026", supplier: "LifeCare Distributors", invoiceNo: "LC-99341", items: 28, amount: 152300, status: "Received" },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "Received":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50";
      case "Partial":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50";
      default:
        return "bg-surface-alt text-text-muted border border-border";
    }
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
          onClick={() => navigate(ROUTES.PURCHASE || "/purchases")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight className="size-3" />
        </button>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto my-auto py-1">
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
                <td className="py-2 px-2 font-medium text-text truncate max-w-[130px]">
                  {item.supplier}
                </td>
                <td className="py-2 px-2 font-mono text-[11px] text-text-muted whitespace-nowrap">
                  {item.invoiceNo}
                </td>
                <td className="py-2 px-2 text-center font-mono text-text-muted">
                  {item.items}
                </td>
                <td className="py-2 px-2 text-right font-mono font-semibold text-text tabular-nums whitespace-nowrap">
                  ₹ {item.amount.toLocaleString()}
                </td>
                <td className="py-2 px-2 text-center whitespace-nowrap">
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 rounded text-[10px] font-medium",
                      getStatusBadge(item.status)
                    )}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </UICard>
  );
};

export default CompanyRecentPurchasesCard;
