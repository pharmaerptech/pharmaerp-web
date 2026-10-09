// src/features/dashboard/components/workspace/WorkspaceFinancialSummaryCard.jsx

import {
  Wallet,
  Landmark,
  CreditCard,
  FileSpreadsheet,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const WorkspaceFinancialSummaryCard = ({ financialData, className }) => {
  const cashInBranches = financialData?.cashInBranches || 1248500;
  const bankAccountBalance = financialData?.bankAccountBalance || 4832120;
  const pendingCustomerReceivables = financialData?.pendingCustomerReceivables || 1821300;
  const pendingSupplierPayables = financialData?.pendingSupplierPayables || 3218450;
  const netGstPayable = financialData?.netGstPayable || 682100;

  const items = [
    {
      id: "cash-branches",
      label: "Cash in Branches",
      value: `₹ ${cashInBranches.toLocaleString()}`,
      icon: Wallet,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50",
    },
    {
      id: "bank-balance",
      label: "Bank Account Balance",
      value: `₹ ${bankAccountBalance.toLocaleString()}`,
      icon: Landmark,
      iconBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50",
    },
    {
      id: "receivables",
      label: "Pending Customer Receivables",
      value: `₹ ${pendingCustomerReceivables.toLocaleString()}`,
      icon: CreditCard,
      iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50",
    },
    {
      id: "payables",
      label: "Pending Supplier Payables",
      value: `₹ ${pendingSupplierPayables.toLocaleString()}`,
      icon: FileSpreadsheet,
      iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50",
    },
    {
      id: "gst",
      label: "Net GST Payable (Est.)",
      value: `₹ ${netGstPayable.toLocaleString()}`,
      icon: AlertCircle,
      iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50",
    },
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
          Financial Summary
        </h2>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface-alt/50 text-xs font-medium text-text hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <span>This Month</span>
          <ChevronDown className="size-3 text-text-muted" />
        </button>
      </div>

      {/* 5 Financial Metric Rows */}
      <div className="py-1 space-y-2 my-auto">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between py-1.5 px-1 hover:bg-surface-alt/40 rounded transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn("p-1.5 rounded-md shrink-0", item.iconBg)}>
                  <Icon className="size-3.5" />
                </div>
                <span className="text-xs font-medium text-text truncate">
                  {item.label}
                </span>
              </div>

              <span className="font-mono font-bold text-xs text-text tabular-nums shrink-0 ml-2">
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </UICard>
  );
};

export default WorkspaceFinancialSummaryCard;
