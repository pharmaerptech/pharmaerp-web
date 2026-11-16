// src/features/operations/shifts/components/PostShiftCloseDialog.jsx

import React from "react";
import {
  UIModal,
  UIButton,
  UIBadge,
} from "@/components/ui";
import {
  CheckCircle2,
  Clock,
  FileCheck,
  Banknote,
  Snowflake,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹ ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * PostShiftCloseDialog
 * Displayed immediately after a shift session is successfully locked and closed.
 * Offers the user immediate workflow transitions: Start Next Shift or Close Business Day.
 */
export const PostShiftCloseDialog = ({
  isOpen,
  onClose,
  onOpenNewShift,
  onCreateDayClosing,
  frozenAmount = 0,
  runningAmount = 0,
}) => {
  return (
    <UIModal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      className="w-[560px] max-w-[95vw] rounded-2xl border border-border bg-surface shadow-2xl flex flex-col overflow-hidden select-none"
    >
      {/* ── 1. Dialog Header (Fixed) ── */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <CheckCircle2 className="size-5.5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text tracking-tight">
              Shift Session Successfully Locked
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Register session finalized and treasury updated
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
        >
          <X className="size-4.5" />
        </button>
      </div>

      {/* ── 2. Dialog Body ── */}
      <div className="px-6 py-5 space-y-4.5">
        {/* Treasury Balances Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Carry Forward (Drawer) */}
          <div className="bg-surface rounded-xl border border-border/80 p-3.5 shadow-xs flex items-center gap-3">
            <div className="size-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Banknote className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-text-muted leading-tight">
                Carry Forward (Drawer)
              </div>
              <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                {formatCurrency(runningAmount)}
              </div>
              <div className="text-[10px] text-text-muted leading-tight mt-0.5">
                Float in cash drawer
              </div>
            </div>
          </div>

          {/* Card 2: Frozen Reserve */}
          <div className="bg-surface rounded-xl border border-border/80 p-3.5 shadow-xs flex items-center gap-3">
            <div className="size-9 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Snowflake className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-text-muted leading-tight">
                Frozen Reserve
              </div>
              <div className="text-base font-bold font-mono text-sky-600 dark:text-sky-400 mt-0.5 truncate">
                {formatCurrency(frozenAmount)}
              </div>
              <div className="text-[10px] text-text-muted leading-tight mt-0.5">
                Awaiting bank deposit
              </div>
            </div>
          </div>
        </div>

        {/* Section Prompt */}
        <div className="pt-1">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              Choose your next workflow action:
            </span>
          </div>

          {/* Workflow Cards */}
          <div className="space-y-2.5">
            {/* Action 1: Start Next Shift (Recommended) */}
            <button
              type="button"
              onClick={onOpenNewShift}
              className="w-full p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all duration-150 flex items-center justify-between group cursor-pointer text-left shadow-xs hover:shadow-sm"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <Clock className="size-5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-text group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Start Next Shift
                    </span>
                    <UIBadge variant="soft" color="success" className="text-[9px] font-bold py-0 px-1.5">
                      Recommended
                    </UIBadge>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    Open a new register shift session with carry-forward float
                  </p>
                </div>
              </div>

              <div className="size-8 rounded-lg bg-surface border border-border/80 flex items-center justify-center text-text-muted group-hover:text-emerald-600 group-hover:border-emerald-500/40 group-hover:translate-x-0.5 transition-all shrink-0 ml-3">
                <ArrowRight className="size-4" />
              </div>
            </button>

            {/* Action 2: Go to Business Day Page */}
            <button
              type="button"
              onClick={onCreateDayClosing}
              className="w-full p-4 rounded-xl border border-border/80 bg-surface hover:bg-surface-alt/70 hover:border-border transition-all duration-150 flex items-center justify-between group cursor-pointer text-left shadow-xs hover:shadow-sm"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="size-10 rounded-xl bg-surface-alt border border-border text-text-muted flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:scale-105 transition-all shadow-xs">
                  <FileCheck className="size-5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-sm text-text group-hover:text-primary transition-colors">
                    Go to Business Day Page
                  </span>
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    Navigate to Business Days page to audit and close the day
                  </p>
                </div>
              </div>

              <div className="size-8 rounded-lg bg-surface-alt border border-border/60 flex items-center justify-center text-text-muted group-hover:text-primary group-hover:border-primary/40 group-hover:translate-x-0.5 transition-all shrink-0 ml-3">
                <ArrowRight className="size-4" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Dialog Footer (Fixed) ── */}
      <div className="px-6 py-3.5 border-t border-border/60 bg-surface flex items-center justify-between shrink-0">
        <span className="text-[11px] text-text-muted">
          You can always start a new shift later from the Shifts page.
        </span>

        <UIButton
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          className="h-9 px-4 text-xs font-semibold"
        >
          Dismiss
        </UIButton>
      </div>
    </UIModal>
  );
};

export default PostShiftCloseDialog;
