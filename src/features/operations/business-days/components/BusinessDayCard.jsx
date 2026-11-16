// src/features/operations/business-days/components/BusinessDayCard.jsx

import React from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Info,
  LockKeyhole,
  Clock,
  Banknote,
  TrendingUp,
  Layers,
} from "lucide-react";
import {
  UIBadge,
  UIIconButton,
  UIButton,
} from "@/components/ui";
import { BranchBadge } from "@/components/shared";

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const BusinessDayCard = ({
  businessDay,
  onView,
  onCloseDay,
}) => {
  const isOpen = businessDay?.status === "open";
  const isClosing = businessDay?.status === "closing";
  const isClosed = businessDay?.status === "closed";
  const dayNo = businessDay?.businessDayNo || "Business Session";
  const formattedDate = formatDate(businessDay?.businessDate);
  const openedTime = formatTime(businessDay?.actualOpenedAt || businessDay?.createdAt);

  const openedByStaff =
    businessDay?.createdBy?.fullName ||
    businessDay?.createdBy?.name ||
    businessDay?.createdBy?.email ||
    "System User";

  const shiftsCount = businessDay?.shifts?.length || 0;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      onClick={() => onView?.(businessDay)}
      className={`group relative flex flex-col justify-between rounded-[16px] p-5 shadow-sm transition-all duration-200 cursor-pointer select-none ${
        isOpen
          ? "border-2 border-emerald-500/80 dark:border-emerald-500/70 shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] via-surface to-surface hover:border-emerald-500 hover:shadow-emerald-500/20"
          : isClosing
          ? "border-2 border-amber-500/80 dark:border-amber-500/70 shadow-lg shadow-amber-500/15 ring-2 ring-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] via-surface to-surface hover:border-amber-500 hover:shadow-amber-500/20"
          : "border border-border bg-surface hover:border-border-strong hover:shadow-md"
      }`}
    >
      {/* ── Active Session Banner ── */}
      {isOpen && (
        <div className="flex items-center justify-between gap-2 mb-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-2.5 py-1 text-emerald-600 dark:text-emerald-400">
          <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            Active Business Day Session
          </span>
          <span className="text-[10px] font-bold font-mono">LIVE DAY</span>
        </div>
      )}
      {isClosing && (
        <div className="flex items-center justify-between gap-2 mb-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1 text-amber-700 dark:text-amber-300">
          <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase">
            <span className="size-2 rounded-full bg-amber-500 animate-ping shrink-0" />
            Closing in Progress (RECONCILING)
          </span>
          <span className="text-[10px] font-bold font-mono">RECONCILING</span>
        </div>
      )}

      {/* ── Header Row: Icon, Day No, Date, Badge & Direct "i" Info Button ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${
              isOpen
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 ring-4 ring-emerald-500/30 shadow-lg shadow-emerald-500/30"
                : isClosing
                ? "bg-gradient-to-br from-amber-500 to-amber-600 ring-4 ring-amber-500/30 shadow-lg shadow-amber-500/30"
                : "bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md shadow-blue-500/20"
            } text-white transition-transform duration-200 group-hover:scale-105`}
          >
            <CalendarDays className="h-5.5 w-5.5 stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold text-text truncate tracking-tight group-hover:text-primary transition-colors font-mono">
                {dayNo}
              </h3>
              {businessDay?.branchId && (
                <BranchBadge branch={businessDay.branchId} />
              )}
            </div>
            <p className="text-[12.5px] font-medium text-text-muted truncate mt-0.5">
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Status Badge, Direct "i" Info Button & Lock Icon Button */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isClosing ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs uppercase font-bold tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              Closing
            </span>
          ) : (
            <UIBadge
              variant="soft"
              color={isOpen ? "success" : isClosed ? "neutral" : "error"}
              className={`text-xs uppercase font-bold tracking-wider ${
                isOpen ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : ""
              }`}
            >
              {businessDay?.status || "open"}
            </UIBadge>
          )}

          <UIIconButton
            variant="ghost"
            size="sm"
            aria-label={`View summary for ${dayNo}`}
            title="View Business Day Details"
            onClick={() => onView?.(businessDay)}
            className="text-text-muted hover:text-primary hover:bg-primary/10 h-8 w-8 rounded-lg transition-colors"
          >
            <Info className="h-4 w-4" />
          </UIIconButton>

          {(isOpen || isClosing) && (
            <UIIconButton
              variant="ghost"
              size="sm"
              aria-label={isClosing ? `Resume Closing Business Day ${dayNo}` : `Start Closing Business Day ${dayNo}`}
              title={isClosing ? "Resume Closing Business Day" : "Start Closing Business Day"}
              onClick={() => onCloseDay?.(businessDay)}
              className={`h-8 w-8 rounded-lg transition-colors ${
                isClosing
                  ? "text-amber-700 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40"
                  : "text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/30"
              }`}
            >
              <LockKeyhole className="h-4 w-4" />
            </UIIconButton>
          )}
        </div>
      </div>

      {/* ── Middle Divider ── */}
      <div className="my-3.5 h-[1px] w-full bg-border/60" />

      {/* ── 2x2 Metadata Grid ── */}
      <div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
        {/* Opened At & Staff */}
        <div className="min-w-0">
          <p className="text-[11.5px] font-medium text-text-muted flex items-center gap-1">
            <Clock className="size-3 shrink-0 text-primary" />
            Opened At
          </p>
          <p className="text-[13px] font-bold text-text truncate mt-0.5 font-mono">
            {openedTime}
          </p>
          <p className="text-[11.5px] text-text-muted truncate mt-0.5" title={openedByStaff}>
            By {openedByStaff}
          </p>
        </div>

        {/* Total Shifts */}
        <div className="min-w-0">
          <p className="text-[11.5px] font-medium text-text-muted flex items-center gap-1">
            <Layers className="size-3 shrink-0 text-primary" />
            Shifts Run
          </p>
          <p className="text-[13.5px] font-bold text-text font-mono tabular-nums mt-0.5">
            {shiftsCount} {shiftsCount === 1 ? "Shift" : "Shifts"}
          </p>
        </div>

        {/* Opening Float */}
        <div className="min-w-0">
          <p className="text-[11.5px] font-medium text-text-muted flex items-center gap-1">
            <Banknote className="size-3 shrink-0 text-emerald-600" />
            Opening Float
          </p>
          <p className="text-[13.5px] font-bold text-text font-mono tabular-nums mt-0.5">
            {formatCurrency(businessDay?.openingFloatAmount)}
          </p>
        </div>

        {/* Closing Cash */}
        <div className="min-w-0">
          <p className="text-[11.5px] font-medium text-text-muted flex items-center gap-1">
            <TrendingUp className="size-3 shrink-0 text-primary" />
            Closing Cash
          </p>
          {isClosed ? (
            <p className="text-[13.5px] font-bold text-primary font-mono tabular-nums mt-0.5">
              {formatCurrency(businessDay?.actualClosingCashAmount)}
            </p>
          ) : isClosing ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              Closing in Progress
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Day
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BusinessDayCard;
