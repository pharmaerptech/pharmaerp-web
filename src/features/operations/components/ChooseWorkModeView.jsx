// src/features/operations/components/ChooseWorkModeView.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Zap, BarChart3, ArrowRight, LayoutGrid } from "lucide-react";

import { useWorkMode, WORK_MODES } from "@/contexts";
import {
  useNavigationPipeline,
  getPipelineDefaultRoute,
  PIPELINE_LEVELS,
} from "@/contexts/NavigationPipelineContext";

export const ChooseWorkModeView = ({ onSelectMode, isModal = false }) => {
  const navigate = useNavigate();
  const { setWorkMode } = useWorkMode();
  const pipeline = useNavigationPipeline();
  const currentLevel = pipeline?.currentLevel || PIPELINE_LEVELS.WORKSPACE;

  const handleSelect = (mode) => {
    const isOp = mode === WORK_MODES.OPERATION;
    const modeName = isOp ? "Operation Mode" : "View Mode";
    const modeType = isOp ? "mode-operation" : "mode-view";

    // Trigger centered loading transition card
    if (pipeline?.triggerTransition) {
      pipeline.triggerTransition({
        type: modeType,
        title: `Entering ${modeName}`,
        fromName: "Work Mode",
        toName: modeName,
        duration: 750,
      });
    }

    if (pipeline?.setLevel) {
      pipeline.setLevel(currentLevel);
    }

    setWorkMode(mode, true);
    const targetRoute = getPipelineDefaultRoute(currentLevel, mode);
    navigate(targetRoute, { replace: true });

    if (onSelectMode) {
      onSelectMode(mode);
    }
  };

  return (
    <div
      className={`relative flex w-full flex-1 flex-col items-center justify-center p-4 sm:p-6 select-none ${
        isModal ? "py-2" : "min-h-full"
      }`}
    >
      {/* ── Page Title ─────────────────────────────────────────────────── */}
      <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-text text-center mb-6 sm:mb-8">
        Choose how you want to work
      </h1>

      {/* ── Two Compact Gatekeeper Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full max-w-3xl items-stretch justify-center mt-6">
        {/* ═══════════ CARD 1: VIEW MODE ═══════════ */}
        <div className="w-full bg-surface rounded-[28px] border border-border shadow-[var(--app-shadow-xl)] p-6 sm:p-7 text-center flex flex-col justify-between space-y-4.5 animate-in fade-in zoom-in-95 duration-200 transition-all hover:shadow-[var(--app-shadow-2xl)] hover:border-border-strong">
          {/* Top Illustration: Soft Emerald Cloud + BarChart3 + Eye Badge */}
          <div className="space-y-4">
            <div className="relative w-32 h-24 mx-auto flex items-center justify-center">
              {/* Soft Emerald Cloud Background */}
              <svg
                viewBox="0 0 150 100"
                className="absolute inset-0 w-full h-full text-emerald-500/10 dark:text-emerald-400/15"
                fill="currentColor"
              >
                <path d="M 35 70 C 18 70 12 56 18 44 C 24 32 36 30 44 34 C 50 18 68 12 84 18 C 100 24 104 38 102 48 C 114 46 128 54 130 66 C 132 78 122 86 110 86 L 40 86 C 26 86 24 70 35 70 Z" />
              </svg>

              {/* Center Emblem Box */}
              <div className="relative z-10">
                <div className="w-16 h-14 rounded-xl border-2 border-emerald-500/40 dark:border-emerald-400/50 bg-surface shadow-xs overflow-hidden flex flex-col items-center justify-center">
                  <div className="bg-emerald-500 h-3.5 w-full flex items-center justify-around px-2 shrink-0" />
                  <div className="flex-1 flex items-center justify-center">
                    <BarChart3 className="size-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>

                {/* Overlapping Badge */}
                <div className="absolute -bottom-1.5 -right-1.5 size-6 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-2 ring-surface shadow-xs">
                  <Eye className="size-3.5 stroke-[2.5]" />
                </div>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h2 className="text-[20px] sm:text-[21px] font-bold text-text tracking-tight">
                View Mode
              </h2>
              <p className="text-[12.5px] text-text-muted leading-relaxed max-w-[280px] mx-auto">
                Review performance insights, executive dashboards, and
                multi-level reports across your business.
              </p>
            </div>

            {/* Info Callout Box */}
            <div className="bg-surface-alt border border-border rounded-2xl p-3 flex items-start gap-2.5 text-left">
              <div className="size-8 rounded-xl bg-surface text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs border border-border mt-0.5">
                <Eye className="size-4 stroke-[2]" />
              </div>
              <p className="text-[12px] text-text leading-snug">
                Pure visibility across workspace, company, and branch levels
                without modifying operational data.
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => handleSelect(WORK_MODES.VIEW)}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Eye className="size-4 stroke-[2]" />
            <span>Open View Mode</span>
            <ArrowRight className="size-4 ml-0.5 opacity-80" />
          </button>
        </div>

        {/* ═══════════ CARD 2: OPERATION MODE ═══════════ */}
        <div className="w-full bg-surface rounded-[28px] border border-border shadow-[var(--app-shadow-xl)] p-6 sm:p-7 text-center flex flex-col justify-between space-y-4.5 animate-in fade-in zoom-in-95 duration-200 transition-all hover:shadow-[var(--app-shadow-2xl)] hover:border-border-strong">
          {/* Top Illustration: Soft Purple Cloud + LayoutGrid + Zap Badge */}
          <div className="space-y-4">
            <div className="relative w-32 h-24 mx-auto flex items-center justify-center">
              {/* Soft Purple Cloud Background */}
              <svg
                viewBox="0 0 150 100"
                className="absolute inset-0 w-full h-full text-purple-500/10 dark:text-purple-400/15"
                fill="currentColor"
              >
                <path d="M 35 70 C 18 70 12 56 18 44 C 24 32 36 30 44 34 C 50 18 68 12 84 18 C 100 24 104 38 102 48 C 114 46 128 54 130 66 C 132 78 122 86 110 86 L 40 86 C 26 86 24 70 35 70 Z" />
              </svg>

              {/* Center Emblem Box */}
              <div className="relative z-10">
                <div className="w-16 h-14 rounded-xl border-2 border-purple-500/40 dark:border-purple-400/50 bg-surface shadow-xs overflow-hidden flex flex-col items-center justify-center">
                  <div className="bg-purple-600 h-3.5 w-full flex items-center justify-around px-2 shrink-0" />
                  <div className="flex-1 flex items-center justify-center">
                    <LayoutGrid className="size-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>

                {/* Overlapping Badge */}
                <div className="absolute -bottom-1.5 -right-1.5 size-6 rounded-full bg-purple-600 text-white flex items-center justify-center ring-2 ring-surface shadow-xs">
                  <Zap className="size-3.5 fill-current" />
                </div>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h2 className="text-[20px] sm:text-[21px] font-bold text-text tracking-tight">
                Operation Mode
              </h2>
              <p className="text-[12.5px] text-text-muted leading-relaxed max-w-[280px] mx-auto">
                Execute daily counter sales, cashier shifts, purchase bills,
                inventory, and party ledgers.
              </p>
            </div>

            {/* Info Callout Box */}
            <div className="bg-surface-alt border border-border rounded-2xl p-3 flex items-start gap-2.5 text-left">
              <div className="size-8 rounded-xl bg-surface text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs border border-border mt-0.5">
                <Zap className="size-4 stroke-[2]" />
              </div>
              <p className="text-[12px] text-text leading-snug">
                Fast-paced daily workflow for billing operators, cashiers, and
                store managers.
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => handleSelect(WORK_MODES.OPERATION)}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Zap className="size-4 stroke-[2]" />
            <span>Open Operation Mode</span>
            <ArrowRight className="size-4 ml-0.5 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChooseWorkModeView;
