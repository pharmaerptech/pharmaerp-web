// src/features/reports/components/ReportsOverviewStatCards.jsx

import React from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { REPORTS_OVERVIEW_STATS } from "../constants/reportsHubData";

export const ReportsOverviewStatCards = ({ stats = REPORTS_OVERVIEW_STATS, className }) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 shrink-0",
        className
      )}
    >
      {stats.map((stat, idx) => {
        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
            className="bg-surface rounded-2xl border border-border/80 p-4 sm:p-4.5 shadow-2xs hover:shadow-xs hover:border-border transition-all duration-200 flex items-center justify-between gap-3 group"
          >
            {/* Left: Icon & Metric Text */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={cn(
                  "size-11 sm:size-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-2xs",
                  stat.iconBg
                )}
              >
                <Icon className="size-5 sm:size-5.5 stroke-[2]" />
              </div>

              <div className="min-w-0">
                <div className="text-xs font-medium text-text-muted truncate">
                  {stat.title}
                </div>
                <div className="text-xl sm:text-[22px] font-bold text-text font-mono tracking-tight leading-tight mt-0.5">
                  {stat.value}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11.5px] truncate">
                  <span className="inline-flex items-center font-semibold text-emerald-600 dark:text-emerald-400">
                    <ArrowUp className="size-3 stroke-[2.5] mr-0.5" />
                    {stat.trend}
                  </span>
                  <span className="text-text-muted truncate font-normal">
                    {stat.trendLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Curved SVG Sparkline */}
            <div className="shrink-0 pl-1 self-center">
              <svg
                width="84"
                height="34"
                viewBox="0 0 100 36"
                className="overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id={`sparkline-grad-${stat.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stat.sparklineColor} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={stat.sparklineColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={`${stat.sparklinePath} L 100,36 L 0,36 Z`}
                  fill={`url(#sparkline-grad-${stat.id})`}
                />
                <path
                  d={stat.sparklinePath}
                  fill="none"
                  stroke={stat.sparklineColor}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ReportsOverviewStatCards;

