// src/layouts/app/components/header/HeaderWorkModeToggle.jsx

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Eye, ChevronDown, Check, ArrowRight, LayoutGrid, BarChart3, Layers } from "lucide-react";
import { useWorkMode, WORK_MODES } from "@/contexts/WorkModeContext";
import { useNavigationPipeline, PIPELINE_LEVELS } from "@/contexts/NavigationPipelineContext";
import { cn } from "@/lib/utils";

export const HeaderWorkModeToggle = ({ className = "" }) => {
  const { workMode, openModeModal } = useWorkMode();
  const {
    currentLevel,
    isWorkspaceLevel,
    isCompanyLevel,
    isBranchLevel,
    switchLevelMode,
  } = useNavigationPipeline();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const isOp = workMode === WORK_MODES.OPERATION;

  // Global Keyboard Shortcut: Alt + W to toggle work mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === "w" || e.key === "W")) {
        const tag = e.target?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) {
          return;
        }
        e.preventDefault();
        const nextMode = isOp ? WORK_MODES.VIEW : WORK_MODES.OPERATION;
        handleSwitch(nextMode);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOp, currentLevel, switchLevelMode]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSwitch = (newMode) => {
    setIsOpen(false);
    if (newMode === workMode) return;
    switchLevelMode(newMode, currentLevel);
  };

  // Level-specific subtitles for each mode
  const getSubtitles = () => {
    if (isWorkspaceLevel) {
      return {
        op: "Company creation, staff invites & role setup",
        view: "Workspace macro dashboard & reports",
        levelTag: "Workspace Level",
        levelShort: "Workspace",
      };
    }
    if (isCompanyLevel) {
      return {
        op: "Branch setup, customers & vendors",
        view: "Company dashboard, GST reports & P&L",
        levelTag: "Company Level",
        levelShort: "Company",
      };
    }
    return {
      op: "Counter POS billing, shifts & stock",
      view: "Branch sales registers & metrics",
      levelTag: "Branch Level",
      levelShort: "Branch",
    };
  };

  const subtitles = getSubtitles();

  return (
    <div className={cn("relative inline-block", className)} ref={containerRef}>
      {/* ── Active Mode Header Pill Button ───────────────────────────── */}
      <button
        type="button"
        id="header-work-mode-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border text-xs font-bold transition-all shadow-2xs select-none cursor-pointer",
          isOp
            ? "border-purple-500/35 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20"
            : "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
        )}
        title={`Current: ${isOp ? "Operation Mode" : "View Mode"} at ${subtitles.levelTag} (Alt + W)`}
      >
        <div className="flex items-center gap-1.5">
          {isOp ? (
            <div className="size-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Zap className="size-3 fill-current" />
            </div>
          ) : (
            <div className="size-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Eye className="size-3 stroke-[2.5]" />
            </div>
          )}
          <span className="hidden sm:inline font-bold tracking-tight">
            {isOp ? "Operation" : "View"} Mode
          </span>
        </div>

        <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded-md bg-surface text-[10px] font-bold text-text-muted border border-border/70 uppercase tracking-wider">
          {subtitles.levelShort}
        </span>

        <ChevronDown
          className={cn(
            "size-3.5 opacity-60 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* ── Card-Based Dropdown Popover ───────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.96 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 top-full mt-2 w-[350px] sm:w-[380px] rounded-[24px] border border-border bg-surface p-3.5 shadow-2xl z-[70] select-none"
          >
            {/* Popover Header */}
            <div className="px-1.5 pb-2.5 mb-2.5 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-text tracking-tight">
                  Choose Work Mode
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-primary/25 bg-primary/10 text-primary">
                  <Layers className="size-2.5" />
                  {subtitles.levelTag}
                </span>
              </div>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-alt border border-border font-mono text-[10px] text-text-muted">
                Alt+W
              </kbd>
            </div>

            {/* Popover Dual Card Matrix */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* ═══════════ CARD 1: VIEW MODE ═══════════ */}
              <div
                onClick={() => handleSwitch(WORK_MODES.VIEW)}
                className={cn(
                  "relative rounded-[20px] border p-3 flex flex-col justify-between text-center transition-all cursor-pointer group",
                  !isOp
                    ? "border-emerald-500/60 bg-emerald-500/5 ring-1 ring-emerald-500/30 shadow-xs"
                    : "border-border bg-surface-alt/50 hover:bg-surface-hover hover:border-emerald-500/40"
                )}
              >
                {/* Active Indicator Top Right */}
                {!isOp && (
                  <div className="absolute top-2.5 right-2.5 size-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                    <Check className="size-2.5 stroke-[3]" />
                  </div>
                )}

                {/* Cloud + Emblem Illustration */}
                <div className="relative w-20 h-16 mx-auto flex items-center justify-center my-1">
                  <svg
                    viewBox="0 0 150 100"
                    className="absolute inset-0 w-full h-full text-emerald-500/10 dark:text-emerald-400/15"
                    fill="currentColor"
                  >
                    <path d="M 35 70 C 18 70 12 56 18 44 C 24 32 36 30 44 34 C 50 18 68 12 84 18 C 100 24 104 38 102 48 C 114 46 128 54 130 66 C 132 78 122 86 110 86 L 40 86 C 26 86 24 70 35 70 Z" />
                  </svg>
                  <div className="relative z-10">
                    <div className="w-11 h-9 rounded-lg border border-emerald-500/40 bg-surface shadow-2xs flex flex-col items-center justify-center overflow-hidden">
                      <div className="bg-emerald-500 h-2 w-full shrink-0" />
                      <div className="flex-1 flex items-center justify-center">
                        <BarChart3 className="size-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-1 ring-surface shadow-2xs">
                      <Eye className="size-2.5 stroke-[2.5]" />
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="space-y-1 mt-1">
                  <h4 className="text-[13px] font-bold text-text leading-tight group-hover:text-emerald-600 transition-colors">
                    View Mode
                  </h4>
                  <p className="text-[10.5px] text-text-muted leading-tight line-clamp-2">
                    {subtitles.view}
                  </p>
                </div>

                {/* Status Footer */}
                <div className="mt-2.5 pt-2 border-t border-border/50">
                  {!isOp ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                      <Check className="size-3 stroke-[2.5]" /> Current Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-text-muted group-hover:text-emerald-600 inline-flex items-center gap-1 transition-colors">
                      Switch to View <ArrowRight className="size-2.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* ═══════════ CARD 2: OPERATION MODE ═══════════ */}
              <div
                onClick={() => handleSwitch(WORK_MODES.OPERATION)}
                className={cn(
                  "relative rounded-[20px] border p-3 flex flex-col justify-between text-center transition-all cursor-pointer group",
                  isOp
                    ? "border-purple-500/60 bg-purple-500/5 ring-1 ring-purple-500/30 shadow-xs"
                    : "border-border bg-surface-alt/50 hover:bg-surface-hover hover:border-purple-500/40"
                )}
              >
                {/* Active Indicator Top Right */}
                {isOp && (
                  <div className="absolute top-2.5 right-2.5 size-4 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-2xs">
                    <Check className="size-2.5 stroke-[3]" />
                  </div>
                )}

                {/* Cloud + Emblem Illustration */}
                <div className="relative w-20 h-16 mx-auto flex items-center justify-center my-1">
                  <svg
                    viewBox="0 0 150 100"
                    className="absolute inset-0 w-full h-full text-purple-500/10 dark:text-purple-400/15"
                    fill="currentColor"
                  >
                    <path d="M 35 70 C 18 70 12 56 18 44 C 24 32 36 30 44 34 C 50 18 68 12 84 18 C 100 24 104 38 102 48 C 114 46 128 54 130 66 C 132 78 122 86 110 86 L 40 86 C 26 86 24 70 35 70 Z" />
                  </svg>
                  <div className="relative z-10">
                    <div className="w-11 h-9 rounded-lg border border-purple-500/40 bg-surface shadow-2xs flex flex-col items-center justify-center overflow-hidden">
                      <div className="bg-purple-600 h-2 w-full shrink-0" />
                      <div className="flex-1 flex items-center justify-center">
                        <LayoutGrid className="size-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-purple-600 text-white flex items-center justify-center ring-1 ring-surface shadow-2xs">
                      <Zap className="size-2.5 fill-current" />
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="space-y-1 mt-1">
                  <h4 className="text-[13px] font-bold text-text leading-tight group-hover:text-purple-600 transition-colors">
                    Operation Mode
                  </h4>
                  <p className="text-[10.5px] text-text-muted leading-tight line-clamp-2">
                    {subtitles.op}
                  </p>
                </div>

                {/* Status Footer */}
                <div className="mt-2.5 pt-2 border-t border-border/50">
                  {isOp ? (
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 inline-flex items-center gap-1">
                      <Check className="size-3 stroke-[2.5]" /> Current Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-text-muted group-hover:text-purple-600 inline-flex items-center gap-1 transition-colors">
                      Switch to Ops <ArrowRight className="size-2.5" />
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Popover Footer Notice */}
            <div className="border-t border-border mt-3 pt-2 px-1 flex items-center justify-between text-[10.5px] text-text-muted">
              <span>Maintains {subtitles.levelTag} context</span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  openModeModal();
                }}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Preferences
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeaderWorkModeToggle;
