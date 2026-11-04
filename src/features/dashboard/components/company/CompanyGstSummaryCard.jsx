// src/features/dashboard/components/company/CompanyGstSummaryCard.jsx

import { Receipt, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UICard, UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const CompanyGstSummaryCard = ({ gstData, className, isLoading = false }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <UICard variant="default" className={cn("p-4 rounded-xl border border-border bg-surface", className)}>
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <UISkeleton className="h-4 w-32" />
        </div>
        <div className="py-4 space-y-3">
          <UISkeleton className="h-4 w-full" />
          <UISkeleton className="h-4 w-full" />
          <UISkeleton className="h-4 w-full" />
        </div>
      </UICard>
    );
  }

  const outputGst = Number(gstData?.outputGst ?? 0);
  const itc = Number(gstData?.itc ?? 0);
  const netGstPayable = Number(gstData?.netGstPayable ?? Math.max(0, outputGst - itc));

  const breakdown = gstData?.breakdown || [
    { label: "CGST", amount: Math.round(outputGst * 0.5), color: "bg-emerald-500", barHeightPct: 50 },
    { label: "SGST", amount: Math.round(outputGst * 0.5), color: "bg-blue-500", barHeightPct: 50 },
    { label: "IGST", amount: 0, color: "bg-purple-500", barHeightPct: 0 },
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
        <div>
          <h2 className="text-sm sm:text-base font-bold text-text tracking-tight">
            GST & Tax Summary
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5">GSTR-3B tax projection</p>
        </div>

        <div className="p-1 rounded bg-surface-alt text-text-muted">
          <Receipt className="size-3.5" />
        </div>
      </div>

      {/* Summary Rows */}
      <div className="divide-y divide-border/50 py-1 space-y-1 my-auto">
        <div className="flex items-center justify-between py-1.5 text-xs">
          <span className="text-text-muted text-[11px]">Output GST (Collected)</span>
          <span className="font-bold font-mono text-text tabular-nums">
            ₹ {outputGst.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 text-xs">
          <span className="text-text-muted text-[11px]">Input Tax Credit (ITC)</span>
          <span className="font-bold font-mono text-text tabular-nums">
            ₹ {itc.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 text-xs">
          <span className="text-text-muted text-[11px] font-semibold text-text">
            Net GST Payable (Est.)
          </span>
          <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            ₹ {netGstPayable.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Mini Bar Chart Breakdown */}
      <div className="pt-2 border-t border-border/60">
        <div className="grid grid-cols-3 gap-2 items-end pt-1">
          {breakdown.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1.5">
              {/* Bar */}
              <div className="w-full max-w-[42px] h-12 bg-surface-alt/50 rounded-t-md flex items-end p-0.5">
                <div
                  className={cn("w-full rounded-t-sm transition-all duration-300", item.color)}
                  style={{ height: `${Math.max(item.barHeightPct || 0, item.amount > 0 ? 8 : 2)}%` }}
                />
              </div>

              {/* Label & Amount */}
              <div className="text-center">
                <span className="block text-[10px] font-semibold text-text-muted uppercase">
                  {item.label}
                </span>
                <span className="block text-[10px] font-mono font-bold text-text tabular-nums">
                  ₹ {Number(item.amount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer link to GSTR reports */}
      <div className="pt-2 border-t border-border/60 flex justify-end">
        <button
          type="button"
          onClick={() => navigate(ROUTES.GSTR3B || "/finance/gst-ledger/gstr-3b")}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          <span>View GSTR-3B</span>
          <ArrowRight className="size-3" />
        </button>
      </div>
    </UICard>
  );
};

export default CompanyGstSummaryCard;
