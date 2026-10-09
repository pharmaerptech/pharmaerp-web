// src/features/dashboard/components/company/CompanyRecentSalesCard.jsx

import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const CompanyRecentSalesCard = ({ sales = [], className }) => {
  const navigate = useNavigate();

  const displaySales = sales.length > 0 ? sales : [
    { id: "1", date: "Oct 28, 2026", branch: "Indore - Main", invoiceNo: "INV-10284", amount: 1245, payment: "UPI" },
    { id: "2", date: "Oct 28, 2026", branch: "Bhopal - MP Nagar", invoiceNo: "INV-10283", amount: 3860, payment: "Card" },
    { id: "3", date: "Oct 28, 2026", branch: "Ujjain", invoiceNo: "INV-10282", amount: 2145, payment: "Cash" },
    { id: "4", date: "Oct 27, 2026", branch: "Dewas", invoiceNo: "INV-10281", amount: 5230, payment: "UPI" },
    { id: "5", date: "Oct 27, 2026", branch: "Indore - Vijay Nagar", invoiceNo: "INV-10280", amount: 1980, payment: "Cash" },
  ];

  const getPaymentBadge = (method) => {
    const m = (method || "Cash").toUpperCase();
    if (m.includes("UPI")) {
      return "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200/50";
    }
    if (m.includes("CARD")) {
      return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/50";
    }
    return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50";
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
          onClick={() => navigate(ROUTES.SALES || "/sales")}
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
                <td className="py-2 px-2 font-semibold text-text truncate max-w-[130px]">
                  {item.branch}
                </td>
                <td className="py-2 px-2 font-mono text-[11px] text-text-muted whitespace-nowrap">
                  {item.invoiceNo}
                </td>
                <td className="py-2 px-2 text-right font-mono font-bold text-text tabular-nums whitespace-nowrap">
                  ₹ {item.amount.toLocaleString()}
                </td>
                <td className="py-2 px-2 text-center whitespace-nowrap">
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 rounded text-[10px] font-medium",
                      getPaymentBadge(item.payment)
                    )}
                  >
                    {item.payment}
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

export default CompanyRecentSalesCard;
