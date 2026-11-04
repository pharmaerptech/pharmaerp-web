// src/features/reports/components/ReportStatCards.jsx

import React from "react";
import { cn } from "@/lib/utils";

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatNumber = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0";
  return Number(val).toLocaleString("en-IN");
};

export const ReportStatCards = ({ statCards = [] }) => {
  if (!statCards || statCards.length === 0) return null;

  return (
    <div className="shrink-0">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          let displayVal = stat.value;
          if (stat.type === "currency") {
            displayVal = `₹${formatCurrency(stat.value)}`;
          } else if (stat.type === "number") {
            displayVal = formatNumber(stat.value);
          }
          const valStr = String(displayVal || "");
          const valLen = valStr.length;
          const valSizeClass =
            valLen > 14
              ? "text-[12px] sm:text-[13px]"
              : valLen > 11
              ? "text-[13px] sm:text-[14px]"
              : valLen > 8
              ? "text-sm sm:text-[15px]"
              : "text-base sm:text-[17px]";

          return (
            <div
              key={stat.id}
              className="bg-surface rounded-xl border border-border p-2.5 sm:p-3 flex items-center gap-2.5 shadow-2xs transition-colors min-w-0"
            >
              <div
                className={cn(
                  "size-8.5 sm:size-9 rounded-lg flex items-center justify-center shrink-0 border",
                  stat.bg || "bg-primary-soft",
                  stat.border || "border-primary/20",
                  stat.color || "text-primary"
                )}
              >
                <Icon className="size-4 stroke-[1.8]" />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="text-[10.5px] sm:text-[11px] font-medium text-text-muted truncate">
                  {stat.title}
                </div>
                <div
                  title={valStr}
                  className={cn(
                    "font-bold text-text leading-tight font-mono tabular-nums tracking-tight whitespace-nowrap mt-0.5",
                    valSizeClass
                  )}
                >
                  {displayVal}
                </div>
                <div className="text-[10px] text-text-muted truncate mt-0.5">
                  {stat.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportStatCards;
