// src/features/dashboard/components/branch/BranchRecentSalesCard.jsx

import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const BranchRecentSalesCard = ({ sales = [], className }) => {
  const navigate = useNavigate();

  const displaySales = sales.length > 0 ? sales : [
    { id: "1", time: "02:15 PM", invoiceNo: "INV-10284", customer: "Walk-in", items: 3, amount: 1245, payment: "UPI" },
    { id: "2", time: "01:48 PM", invoiceNo: "INV-10283", customer: "Rajesh Verma", items: 5, amount: 2380, payment: "Card" },
    { id: "3", time: "01:20 PM", invoiceNo: "INV-10282", customer: "Walk-in", items: 2, amount: 560, payment: "Cash" },
    { id: "4", time: "12:55 PM", invoiceNo: "INV-10281", customer: "Priya Sharma", items: 4, amount: 1920, payment: "UPI" },
    { id: "5", time: "12:30 PM", invoiceNo: "INV-10280", customer: "Walk-in", items: 1, amount: 420, payment: "Cash" },
  ];

  const getPaymentBadge = (method) => {
    const m = (method || "Cash").toUpperCase();
    if (m.includes("UPI")) {
      return "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200/50";
    }
    if (m.includes("CARD")) {
      return "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50";
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
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
        <h2 className="text-sm font-bold text-text tracking-tight">
          Today's Recent Sales
        </h2>

        <button
          type="button"
          onClick={() => navigate("/sales")}
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
                <td className="py-2 px-2 font-medium text-text truncate max-w-[100px]">
                  {item.customer}
                </td>
                <td className="py-2 px-1 text-center font-mono tabular-nums text-text-muted">
                  {item.items}
                </td>
                <td className="py-2 px-2 text-right font-bold font-mono text-text tabular-nums">
                  ₹ {Number(item.amount).toLocaleString()}
                </td>
                <td className="py-2 px-2 text-center">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold",
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

export default BranchRecentSalesCard;
