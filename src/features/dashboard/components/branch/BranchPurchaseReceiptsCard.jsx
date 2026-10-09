// src/features/dashboard/components/branch/BranchPurchaseReceiptsCard.jsx

import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const BranchPurchaseReceiptsCard = ({ receipts = [], className }) => {
  const navigate = useNavigate();

  const displayReceipts = receipts.length > 0 ? receipts : [
    { id: "1", supplier: "Sun Pharma", invoiceNo: "SP-10283", items: 24, amount: 124580, status: "Received" },
    { id: "2", supplier: "Mankind Pharma", invoiceNo: "MP-55821", items: 15, amount: 84320, status: "Received" },
    { id: "3", supplier: "Cipla Distributors", invoiceNo: "CP-77810", items: 32, amount: 214500, status: "Pending" },
    { id: "4", supplier: "Abbott Healthcare", invoiceNo: "AB-44128", items: 18, amount: 96420, status: "Received" },
    { id: "5", supplier: "LifeCare Distributors", invoiceNo: "LC-99341", items: 28, amount: 152300, status: "Received" },
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
          Today's Purchase Receipts
        </h2>

        <button
          type="button"
          onClick={() => navigate("/purchases")}
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
              <th className="py-1.5 px-2">Supplier</th>
              <th className="py-1.5 px-2">Invoice No.</th>
              <th className="py-1.5 px-2 text-center">Items</th>
              <th className="py-1.5 px-2 text-right">Amount</th>
              <th className="py-1.5 px-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {displayReceipts.slice(0, 5).map((item, idx) => {
              const isReceived = item.status === "Received";

              return (
                <tr key={item.id || idx} className="hover:bg-surface-alt/50 transition-colors">
                  <td className="py-2 px-1 text-text-muted font-mono">{idx + 1}</td>
                  <td className="py-2 px-2 font-medium text-text truncate max-w-[110px]">
                    {item.supplier}
                  </td>
                  <td className="py-2 px-2 text-text-muted font-mono">{item.invoiceNo}</td>
                  <td className="py-2 px-2 text-center font-mono tabular-nums text-text-muted">
                    {item.items}
                  </td>
                  <td className="py-2 px-2 text-right font-bold font-mono text-text tabular-nums">
                    ₹ {Number(item.amount).toLocaleString()}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold",
                        isReceived
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50"
                      )}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </UICard>
  );
};

export default BranchPurchaseReceiptsCard;
