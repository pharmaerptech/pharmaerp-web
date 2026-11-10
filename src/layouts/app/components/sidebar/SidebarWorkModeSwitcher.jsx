// src/layouts/app/components/sidebar/SidebarWorkModeSwitcher.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Eye, Zap } from "lucide-react";

import { UIConfirmDialog } from "@/components/ui";
import { useWorkMode, WORK_MODES } from "@/contexts/WorkModeContext";
import { useNavigationPipeline } from "@/contexts/NavigationPipelineContext";
import { cn } from "@/lib/utils";

export const SidebarWorkModeSwitcher = ({
  collapsed = false,
  onModeChange,
  onConfirmOpenChange,
}) => {
  const { workMode } = useWorkMode();
  const { currentLevel, switchLevelMode } = useNavigationPipeline();

  const [tooltipPos, setTooltipPos] = useState(null);
  const [pendingMode, setPendingMode] = useState(null);
  const btnRef = useRef(null);

  const isOp = workMode === WORK_MODES.OPERATION;
  const isConfirmOpen = Boolean(pendingMode && pendingMode !== workMode);

  // Notify parent layout while confirmation dialog is open so auto-close pauses
  useEffect(() => {
    onConfirmOpenChange?.(isConfirmOpen);
    return () => {
      if (isConfirmOpen) {
        onConfirmOpenChange?.(false);
      }
    };
  }, [isConfirmOpen, onConfirmOpenChange]);

  const handleRequestModeChange = useCallback(
    (nextMode) => {
      if (!workMode || nextMode === workMode) return;
      setTooltipPos(null);
      setPendingMode(nextMode);
    },
    [workMode]
  );

  const handleCancelSwitch = useCallback(() => {
    setPendingMode(null);
  }, []);

  const handleConfirmSwitch = useCallback(() => {
    if (!pendingMode || pendingMode === workMode) {
      setPendingMode(null);
      return;
    }
    const targetMode = pendingMode;
    setPendingMode(null);
    switchLevelMode(targetMode, currentLevel);
    onModeChange?.();
  }, [pendingMode, workMode, switchLevelMode, currentLevel, onModeChange]);

  // Global Alt + W shortcut prompts confirmation to toggle Work Mode
  useEffect(() => {
    if (!workMode || isConfirmOpen) return;

    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === "w" || e.key === "W")) {
        const tag = e.target?.tagName?.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          e.target?.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        const nextMode = isOp ? WORK_MODES.VIEW : WORK_MODES.OPERATION;
        handleRequestModeChange(nextMode);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [workMode, isOp, isConfirmOpen, handleRequestModeChange]);

  if (!workMode) return null;

  const isSwitchingToOp = pendingMode === WORK_MODES.OPERATION;
  const confirmDialog =
    typeof document !== "undefined"
      ? createPortal(
          <UIConfirmDialog
            isOpen={isConfirmOpen}
            onClose={handleCancelSwitch}
            onConfirm={handleConfirmSwitch}
            title={
              isSwitchingToOp
                ? "Switch to Operation Mode?"
                : "Switch to View Mode?"
            }
            description={
              isSwitchingToOp
                ? "You are switching to Operation Mode for live workflows such as POS billing, stock entry, and operational vouchers. You will be routed to this level's Operation home."
                : "You are switching to View Mode for dashboards, reports, ledgers, and configuration. You will be routed to this level's View home."
            }
            intent="warning"
            confirmText={
              isSwitchingToOp ? "Switch to Operation" : "Switch to View"
            }
            cancelText="Cancel"
            icon={
              isSwitchingToOp ? (
                <Zap className="size-5 sm:size-6 text-purple-600 dark:text-purple-400" />
              ) : (
                <Eye className="size-5 sm:size-6 text-emerald-600 dark:text-emerald-400" />
              )
            }
          />,
          document.body
        )
      : null;

  if (collapsed) {
    const nextMode = isOp ? WORK_MODES.VIEW : WORK_MODES.OPERATION;
    return (
      <>
        <div className="relative flex justify-center border-t border-border/70 px-2 py-2">
          <button
            ref={btnRef}
            type="button"
            onClick={() => handleRequestModeChange(nextMode)}
            onMouseEnter={() => {
              if (!btnRef.current) return;
              const rect = btnRef.current.getBoundingClientRect();
              setTooltipPos({
                top: rect.top + rect.height / 2,
                left: rect.right + 10,
              });
            }}
            onMouseLeave={() => setTooltipPos(null)}
            aria-label={`Work Mode: ${isOp ? "Operation" : "View"} (Click to switch)`}
            className={cn(
              "flex size-9 cursor-pointer items-center justify-center rounded-[9px] border transition-all active:scale-[0.95] shadow-2xs",
              isOp
                ? "border-purple-500/35 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20"
                : "border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
            )}
          >
            {isOp ? (
              <Zap className="size-4 fill-current" />
            ) : (
              <Eye className="size-4 stroke-[2.3]" />
            )}
          </button>

          {tooltipPos &&
            createPortal(
              <div
                style={{
                  position: "fixed",
                  top: tooltipPos.top,
                  left: tooltipPos.left,
                  transform: "translateY(-50%)",
                  zIndex: 9999,
                }}
                className="pointer-events-none rounded-[6px] border border-border bg-surface px-2.5 py-1.5 text-[11px] font-medium text-text shadow-[var(--app-shadow-lg)] whitespace-nowrap"
              >
                <span className="font-bold">
                  {isOp ? "Operation Mode" : "View Mode"}
                </span>{" "}
                <span className="text-text-muted">• Switch (Alt+W)</span>
              </div>,
              document.body
            )}
        </div>
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <div className="border-t border-border/70 px-2.5 py-2">
        <div className="mb-1.5 flex items-center justify-between px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted/80">
            Work Mode
          </span>
          <span className="text-[10px] font-mono text-text-muted/70">Alt+W</span>
        </div>

        <div
          role="group"
          aria-label="Work Mode Switcher"
          className="grid grid-cols-2 gap-1 rounded-[10px] border border-border/80 bg-surface-alt/70 p-1"
        >
          <button
            type="button"
            onClick={() => handleRequestModeChange(WORK_MODES.VIEW)}
            aria-pressed={!isOp}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-[7px] px-2 py-1.5 text-[11.5px] font-semibold transition-all cursor-pointer",
              !isOp
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-text-muted hover:text-text hover:bg-surface-hover/70"
            )}
          >
            <Eye className="size-3.5 shrink-0 stroke-[2.2]" />
            <span>View</span>
          </button>

          <button
            type="button"
            onClick={() => handleRequestModeChange(WORK_MODES.OPERATION)}
            aria-pressed={isOp}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-[7px] px-2 py-1.5 text-[11.5px] font-semibold transition-all cursor-pointer",
              isOp
                ? "bg-purple-600 text-white shadow-2xs"
                : "text-text-muted hover:text-text hover:bg-surface-hover/70"
            )}
          >
            <Zap className={cn("size-3.5 shrink-0", isOp && "fill-current")} />
            <span>Operation</span>
          </button>
        </div>
      </div>
      {confirmDialog}
    </>
  );
};

export default SidebarWorkModeSwitcher;
