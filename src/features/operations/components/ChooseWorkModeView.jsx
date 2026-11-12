// src/features/operations/components/ChooseWorkModeView.jsx

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Zap, BarChart3, ArrowRight, LayoutGrid, Lock } from "lucide-react";

import { useWorkMode, WORK_MODES } from "@/contexts";
import {
  useNavigationPipeline,
  getPipelineDefaultRoute,
  PIPELINE_LEVELS,
} from "@/contexts/NavigationPipelineContext";
import usePermission from "@/hooks/usePermission";
import { clampWorkLevelToAllowed } from "@/utils/workAccess";

export const ChooseWorkModeView = ({ onSelectMode, isModal = false }) => {
  const navigate = useNavigate();
  const { setWorkMode } = useWorkMode();
  const pipeline = useNavigationPipeline();
  const {
    isLoaded,
    isOwner,
    allowedWorkModes,
    workAccess,
    canWorkMode,
  } = usePermission();

  const canView = !isLoaded || canWorkMode(WORK_MODES.VIEW);
  const canOperation = !isLoaded || canWorkMode(WORK_MODES.OPERATION);

  const rawLevel = pipeline?.currentLevel || PIPELINE_LEVELS.WORKSPACE;
  const currentLevel =
    isLoaded && !isOwner && workAccess?.allowedWorkLevels?.length > 0
      ? clampWorkLevelToAllowed(rawLevel, workAccess.allowedWorkLevels)
      : rawLevel;

  // Single-mode users on standalone /choose-mode skip straight to their allowed landing route
  useEffect(() => {
    if (
      !isModal &&
      isLoaded &&
      !isOwner &&
      Array.isArray(allowedWorkModes) &&
      allowedWorkModes.length === 1
    ) {
      const soleMode = allowedWorkModes[0];
      setWorkMode(soleMode, true);
      const targetRoute = getPipelineDefaultRoute(
        currentLevel,
        soleMode,
        workAccess,
      );
      navigate(targetRoute, { replace: true });
    }
  }, [
    isModal,
    isLoaded,
    isOwner,
    allowedWorkModes,
    currentLevel,
    workAccess,
    setWorkMode,
    navigate,
  ]);

  const handleSelect = (mode) => {
    if (isLoaded && !canWorkMode(mode)) {
      return;
    }

    const isOp = mode === WORK_MODES.OPERATION;
    const modeName = isOp ? "Operation Mode" : "View Mode";
    const modeType = isOp ? "mode-operation" : "mode-view";

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
    const targetRoute = getPipelineDefaultRoute(
      currentLevel,
      mode,
      isLoaded && !isOwner ? workAccess : null,
    );
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
      {/* Page Title */}
      <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-text text-center mb-6 sm:mb-8">
        Choose how you want to work
      </h1>

      {/* Two Gatekeeper Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full max-w-3xl items-stretch justify-center mt-6">
        {/* CARD 1: VIEW MODE */}
        <div
          className={`w-full bg-surface rounded-[28px] border border-border shadow-[var(--app-shadow-xl)] p-6 sm:p-7 text-center flex flex-col justify-between space-y-4.5 animate-in fade-in zoom-in-95 duration-200 transition-all ${
            canView
              ? "hover:shadow-[var(--app-shadow-2xl)] hover:border-border-strong"
              : "opacity-60 grayscale-[30%]"
          }`}
        >
          <div className="space-y-4">
            <div className="relative w-32 h-24 mx-auto flex items-center justify-center">
              <svg
                viewBox="0 0 150 100"
                className="absolute inset-0 w-full h-full text-emerald-500/10 dark:text-emerald-400/15"
                fill="currentColor"
              >
                <path d="M 35 70 C 18 70 12 56 18 44 C 24 32 36 30 44 34 C 50 18 68 12 84 18 C 100 24 104 38 102 48 C 114 46 128 54 130 66 C 132 78 122 86 110 86 L 40 86 C 26 86 24 70 35 70 Z" />
              </svg>

              <div className="relative z-10">
                <div className="w-16 h-14 rounded-xl border-2 border-emerald-500/40 dark:border-emerald-400/50 bg-surface shadow-xs overflow-hidden flex flex-col items-center justify-center">
                  <div className="bg-emerald-500 h-3.5 w-full flex items-center justify-around px-2 shrink-0" />
                  <div className="flex-1 flex items-center justify-center">
                    <BarChart3 className="size-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>

                <div className="absolute -bottom-1.5 -right-1.5 size-6 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-2 ring-surface shadow-xs">
                  {canView ? (
                    <Eye className="size-3.5 stroke-[2.5]" />
                  ) : (
                    <Lock className="size-3.5 stroke-[2.5]" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-[20px] sm:text-[21px] font-bold text-text tracking-tight">
                View Mode
              </h2>
              <p className="text-[12.5px] text-text-muted leading-relaxed max-w-[280px] mx-auto">
                Review performance insights, executive dashboards, and
                multi-level reports across your business.
              </p>
            </div>

            <div className="bg-surface-alt border border-border rounded-2xl p-3 flex items-start gap-2.5 text-left">
              <div className="size-8 rounded-xl bg-surface text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs border border-border mt-0.5">
                {canView ? (
                  <Eye className="size-4 stroke-[2]" />
                ) : (
                  <Lock className="size-4 stroke-[2]" />
                )}
              </div>
              <p className="text-[12px] text-text leading-snug">
                {canView
                  ? "Pure visibility across your permitted levels without modifying operational data."
                  : "Restricted by your assigned role. View Mode permission is required."}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={!canView}
            onClick={() => handleSelect(WORK_MODES.VIEW)}
            className={`w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              canView
                ? "bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white shadow-md shadow-emerald-600/20 cursor-pointer"
                : "bg-surface-muted text-text-muted border border-border cursor-not-allowed"
            }`}
          >
            {canView ? (
              <>
                <Eye className="size-4 stroke-[2]" />
                <span>Open View Mode</span>
                <ArrowRight className="size-4 ml-0.5 opacity-80" />
              </>
            ) : (
              <>
                <Lock className="size-4 stroke-[2]" />
                <span>Restricted by Role</span>
              </>
            )}
          </button>
        </div>

        {/* CARD 2: OPERATION MODE */}
        <div
          className={`w-full bg-surface rounded-[28px] border border-border shadow-[var(--app-shadow-xl)] p-6 sm:p-7 text-center flex flex-col justify-between space-y-4.5 animate-in fade-in zoom-in-95 duration-200 transition-all ${
            canOperation
              ? "hover:shadow-[var(--app-shadow-2xl)] hover:border-border-strong"
              : "opacity-60 grayscale-[30%]"
          }`}
        >
          <div className="space-y-4">
            <div className="relative w-32 h-24 mx-auto flex items-center justify-center">
              <svg
                viewBox="0 0 150 100"
                className="absolute inset-0 w-full h-full text-purple-500/10 dark:text-purple-400/15"
                fill="currentColor"
              >
                <path d="M 35 70 C 18 70 12 56 18 44 C 24 32 36 30 44 34 C 50 18 68 12 84 18 C 100 24 104 38 102 48 C 114 46 128 54 130 66 C 132 78 122 86 110 86 L 40 86 C 26 86 24 70 35 70 Z" />
              </svg>

              <div className="relative z-10">
                <div className="w-16 h-14 rounded-xl border-2 border-purple-500/40 dark:border-purple-400/50 bg-surface shadow-xs overflow-hidden flex flex-col items-center justify-center">
                  <div className="bg-purple-600 h-3.5 w-full flex items-center justify-around px-2 shrink-0" />
                  <div className="flex-1 flex items-center justify-center">
                    <LayoutGrid className="size-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>

                <div className="absolute -bottom-1.5 -right-1.5 size-6 rounded-full bg-purple-600 text-white flex items-center justify-center ring-2 ring-surface shadow-xs">
                  {canOperation ? (
                    <Zap className="size-3.5 fill-current" />
                  ) : (
                    <Lock className="size-3.5 stroke-[2.5]" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-[20px] sm:text-[21px] font-bold text-text tracking-tight">
                Operation Mode
              </h2>
              <p className="text-[12.5px] text-text-muted leading-relaxed max-w-[280px] mx-auto">
                Execute daily counter sales, cashier shifts, purchase bills,
                inventory, and party ledgers.
              </p>
            </div>

            <div className="bg-surface-alt border border-border rounded-2xl p-3 flex items-start gap-2.5 text-left">
              <div className="size-8 rounded-xl bg-surface text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs border border-border mt-0.5">
                {canOperation ? (
                  <Zap className="size-4 stroke-[2]" />
                ) : (
                  <Lock className="size-4 stroke-[2]" />
                )}
              </div>
              <p className="text-[12px] text-text leading-snug">
                {canOperation
                  ? "Fast-paced daily workflow for billing operators, cashiers, and store managers."
                  : "Restricted by your assigned role. Operation Mode permission is required."}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={!canOperation}
            onClick={() => handleSelect(WORK_MODES.OPERATION)}
            className={`w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              canOperation
                ? "bg-purple-600 hover:bg-purple-500 active:scale-[0.99] text-white shadow-md shadow-purple-600/20 cursor-pointer"
                : "bg-surface-muted text-text-muted border border-border cursor-not-allowed"
            }`}
          >
            {canOperation ? (
              <>
                <Zap className="size-4 stroke-[2]" />
                <span>Open Operation Mode</span>
                <ArrowRight className="size-4 ml-0.5 opacity-80" />
              </>
            ) : (
              <>
                <Lock className="size-4 stroke-[2]" />
                <span>Restricted by Role</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChooseWorkModeView;
