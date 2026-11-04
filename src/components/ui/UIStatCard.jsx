// src/components/ui/UIStatCard.jsx

import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UISkeleton } from "./UISkeleton";

const iconBgMap = {
  primary: "bg-primary-soft text-primary border-primary/20",
  success: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50",
  warning: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50",
  error: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/50",
  info: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200/50 dark:border-sky-800/50",
  purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/50",
  teal: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200/50 dark:border-teal-800/50",
  blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50",
  neutral: "bg-surface-alt text-text-muted border-border",
};

const trendColorMap = {
  up: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  down: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  neutral: "text-text-muted bg-surface-alt border-border",
};

/**
 * Calibrated value font scaling: Compact, proportional, and guaranteed to fit
 * in dense ERP 5-card and 6-card dashboard strips without wrapping or truncation.
 */
const getCalibratedValueSize = (valStr, customClass) => {
  if (customClass) return customClass;
  const len = String(valStr ?? "").length;
  if (len > 14) return "text-[12px] sm:text-[13px] xl:text-[13.5px]";
  if (len > 11) return "text-[13px] sm:text-[14px] xl:text-[15px]";
  if (len > 8) return "text-sm sm:text-[14.5px] xl:text-base";
  return "text-[15px] sm:text-base xl:text-[17px]";
};

/**
 * ============================================================================
 * UIStatCard (#28 Primary Component)
 * ============================================================================
 * High-impact, production-ready KPI metric card for ERP dashboards.
 * Designed with compact typography, auto-scaling numbers, trend indicators,
 * subtle hover states, and zero-shift loading skeletons.
 */
export const UIStatCard = forwardRef(
  (
    {
      title,
      value,
      prefix,
      suffix,
      subtitle,
      icon,
      trend, // { value: "+12.4%", direction: "up" | "down" | "neutral", label?: "vs last month" }
      growth, // numeric shorthand for trend: +5.2 or -3.1
      growthLabel = "vs prior period",
      color = "primary",
      variant = "default", // "default" | "elevated" | "flat" | "interactive"
      density = "compact", // "compact" | "normal"
      badge,
      sparklineData, // Array<number> for mini SVG trendline
      progress, // { value: number (0-100), label?: string }
      isLoading = false,
      onClick,
      className,
      valueClassName,
      ...props
    },
    ref
  ) => {
    const isInteractive = variant === "interactive" || Boolean(onClick);
    const isCompact = density === "compact";

    // Normalize growth shorthand into trend object if trend not explicitly provided
    let activeTrend = trend;
    if (!activeTrend && growth !== undefined && growth !== null) {
      const gNum = Number(growth);
      activeTrend = {
        value: `${gNum > 0 ? "+" : ""}${gNum}%`,
        direction: gNum > 0 ? "up" : gNum < 0 ? "down" : "neutral",
        label: growthLabel,
      };
    }

    const variantClasses = {
      default:
        "bg-surface border border-border rounded-xl shadow-2xs hover:border-border/80 transition-all duration-200",
      elevated:
        "bg-surface border border-border/80 rounded-xl shadow-xs hover:shadow-sm transition-all duration-200",
      flat:
        "bg-surface-alt/60 border border-border/70 rounded-xl transition-colors",
      interactive:
        "bg-surface border border-border rounded-xl shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.99] group",
    };

    if (isLoading) {
      return (
        <div
          ref={ref}
          className={cn(
            "rounded-xl border border-border bg-surface shadow-2xs font-sans",
            isCompact ? "p-3 sm:p-3.5 space-y-2.5" : "p-4 sm:p-5 space-y-3",
            className
          )}
          {...props}
        >
          <div className="flex items-center justify-between gap-2">
            <UISkeleton className="h-3 w-20" />
            <UISkeleton className={cn("rounded-lg shrink-0", isCompact ? "size-7 sm:size-7.5" : "size-8.5 sm:size-9")} />
          </div>
          <div className="space-y-1">
            <UISkeleton className={cn("w-28", isCompact ? "h-5 sm:h-5.5" : "h-6 sm:h-7")} />
            <UISkeleton className="h-2.5 w-16" />
          </div>
        </div>
      );
    }

    // Mini SVG sparkline generator
    const renderSparkline = () => {
      if (!Array.isArray(sparklineData) || sparklineData.length < 2) return null;
      const min = Math.min(...sparklineData);
      const max = Math.max(...sparklineData);
      const range = max - min || 1;
      const height = isCompact ? 20 : 26;
      const width = isCompact ? 50 : 68;

      const points = sparklineData
        .map((d, i) => {
          const x = (i / (sparklineData.length - 1)) * width;
          const y = height - ((d - min) / range) * (height - 4) - 2;
          return `${x},${y}`;
        })
        .join(" ");

      const strokeColor =
        activeTrend?.direction === "down"
          ? "var(--color-error, #ef4444)"
          : "var(--color-primary, #0ea5e9)";

      return (
        <svg
          width={width}
          height={height}
          className="overflow-visible shrink-0 ml-auto"
          aria-hidden="true"
        >
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      );
    };

    const CardTag = isInteractive ? motion.div : "div";
    const motionProps = isInteractive
      ? {
          whileHover: { y: -1.5 },
          whileTap: { scale: 0.985 },
          transition: { type: "spring", stiffness: 450, damping: 25 },
        }
      : {};

    const formattedValueSize = getCalibratedValueSize(value, valueClassName);

    return (
      <CardTag
        ref={ref}
        onClick={onClick}
        className={cn(
          "relative font-sans text-text flex flex-col justify-between overflow-hidden",
          isCompact ? "p-3 sm:p-3.5" : "p-4 sm:p-5",
          variantClasses[isInteractive ? "interactive" : variant] || variantClasses.default,
          className
        )}
        {...motionProps}
        {...props}
      >
        {/* Top Row: Title + Icon Container */}
        <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
          <div className="flex flex-col min-w-0 pr-0.5">
            <span className="text-[11px] sm:text-[11.5px] font-semibold text-text-muted tracking-tight truncate select-none leading-tight">
              {title}
            </span>
            {badge && <div className="mt-0.5">{badge}</div>}
          </div>

          {icon && (
            <div
              className={cn(
                "rounded-lg border flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 select-none",
                isCompact ? "size-7.5 sm:size-8" : "size-9 sm:size-9.5",
                isInteractive && "group-hover:scale-105",
                iconBgMap[color] || iconBgMap.primary
              )}
            >
              {React.isValidElement(icon)
                ? React.cloneElement(icon, {
                    className: cn(isCompact ? "size-3.5 sm:size-4" : "size-4 sm:size-4.5", icon.props.className),
                  })
                : typeof icon === "function"
                ? React.createElement(icon, { className: isCompact ? "size-3.5 sm:size-4" : "size-4 sm:size-4.5" })
                : icon}
            </div>
          )}
        </div>

        {/* Middle Row: Calibrated Metric Value + Sparkline */}
        <div className="flex items-baseline justify-between gap-1.5 my-0.5 min-w-0">
          <div className="flex items-baseline gap-1 min-w-0 overflow-hidden">
            {prefix && (
              <span className="text-xs sm:text-[13px] font-bold text-text-muted/80 font-mono select-none shrink-0">
                {prefix}
              </span>
            )}
            <span
              className={cn(
                "font-bold font-mono tracking-tight text-text tabular-nums whitespace-nowrap block truncate leading-tight",
                formattedValueSize
              )}
              title={typeof value === "string" || typeof value === "number" ? String(value) : undefined}
            >
              {value}
            </span>
            {suffix && (
              <span className="text-[10.5px] sm:text-[11px] font-medium text-text-muted ml-0.5 select-none truncate shrink-0">
                {suffix}
              </span>
            )}
          </div>

          {renderSparkline()}
        </div>

        {/* Progress Bar (Optional) */}
        {progress && (
          <div className="mt-1.5 space-y-0.5">
            {progress.label && (
              <div className="flex justify-between text-[10px] text-text-muted font-medium">
                <span>{progress.label}</span>
                <span className="font-mono">{progress.value}%</span>
              </div>
            )}
            <div className="h-1 w-full bg-surface-alt rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress.value))}%` }}
              />
            </div>
          </div>
        )}

        {/* Bottom Row: Trend Badge + Subtitle */}
        {(activeTrend || subtitle) && (
          <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-border/50 text-[10.5px] select-none min-w-0 overflow-hidden">
            {activeTrend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border tabular-nums shrink-0 leading-none",
                  trendColorMap[activeTrend.direction] || trendColorMap.neutral
                )}
              >
                {activeTrend.direction === "up" ? (
                  <ArrowUpRight className="size-2.5 stroke-[2.5]" />
                ) : activeTrend.direction === "down" ? (
                  <ArrowDownRight className="size-2.5 stroke-[2.5]" />
                ) : (
                  <Minus className="size-2.5 stroke-[2.5]" />
                )}
                <span>{activeTrend.value}</span>
              </span>
            )}

            {subtitle && (
              <span
                className="text-text-muted text-[10.5px] truncate font-medium"
                title={typeof subtitle === "string" ? subtitle : undefined}
              >
                {subtitle}
              </span>
            )}

            {activeTrend?.label && !subtitle && (
              <span
                className="text-text-muted text-[10px] truncate font-normal"
                title={activeTrend.label}
              >
                {activeTrend.label}
              </span>
            )}
          </div>
        )}
      </CardTag>
    );
  }
);

UIStatCard.displayName = "UIStatCard";

export default UIStatCard;
