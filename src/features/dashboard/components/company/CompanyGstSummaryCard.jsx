// src/features/dashboard/components/company/CompanyGstSummaryCard.jsx

import { ChevronDown } from "lucide-react";
import { UICard } from "@/components/ui";
import { cn } from "@/lib/utils";

export const CompanyGstSummaryCard = ({ gstData, className }) => {
  const outputGst = gstData?.outputGst || 1028450;
  const itc = gstData?.itc || 682310;
  const netGstPayable = gstData?.netGstPayable || 346140;

  const breakdown = gstData?.breakdown || [
    { label: "CGST", amount: 173070, color: "bg-emerald-500", barHeightPct: 75 },
    { label: "SGST", amount: 173070, color: "bg-blue-500", barHeightPct: 75 },
    { label: "IGST", amount: 104000, color: "bg-purple-500", barHeightPct: 45 },
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
          GST Summary
        </h2>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface-alt/50 text-xs font-medium text-text hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <span>This Month</span>
          <ChevronDown className="size-3 text-text-muted" />
        </button>
      </div>

      {/* Summary Rows */}
      <div className="divide-y divide-border/50 py-1 space-y-1 my-auto">
        <div className="flex items-center justify-between py-1.5 text-xs">
          <span className="text-text-muted text-[11px]">Output GST (Collected)</span>
          <span className="font-bold font-mono text-text tabular-nums">
            ₹ {outputGst.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 text-xs">
          <span className="text-text-muted text-[11px]">Input Tax Credit (ITC)</span>
          <span className="font-bold font-mono text-text tabular-nums">
            ₹ {itc.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 text-xs">
          <span className="text-text-muted text-[11px]">Net GST Payable (Est.)</span>
          <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            ₹ {netGstPayable.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Mini Bar Chart Breakdown */}
      <div className="pt-2 border-t border-border/60">
        <div className="grid grid-cols-3 gap-2 items-end pt-1">
          {breakdown.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1.5">
              {/* Bar */}
              <div className="w-full max-w-[42px] h-14 bg-surface-alt/50 rounded-t-md flex items-end p-0.5">
                <div
                  className={cn("w-full rounded-t-sm transition-all duration-300", item.color)}
                  style={{ height: `${item.barHeightPct}%` }}
                />
              </div>

              {/* Label & Amount */}
              <div className="text-center">
                <span className="block text-[10px] font-semibold text-text-muted uppercase">
                  {item.label}
                </span>
                <span className="block text-[10px] font-mono font-bold text-text tabular-nums">
                  ₹ {item.amount.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </UICard>
  );
};

export default CompanyGstSummaryCard;
