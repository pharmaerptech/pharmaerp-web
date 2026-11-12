// src/layouts/app/components/sidebar/SidebarWorkModeSwitcher.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Eye, Lock, Zap } from "lucide-react";

import { UIConfirmDialog } from "@/components/ui";
import { useWorkMode, WORK_MODES } from "@/contexts/WorkModeContext";
import { useNavigationPipeline } from "@/contexts/NavigationPipelineContext";
import usePermission from "@/hooks/usePermission";
import { cn } from "@/lib/utils";

export const SidebarWorkModeSwitcher = ({
  collapsed = false,
  onModeChange,
  onConfirmOpenChange,
}) => {
  const { workMode } = useWorkMode();
  const { currentLevel, switchLevelMode } = useNavigationPipeline();
  const { canSwitchWorkMode, canWorkMode } = usePermission();

  const [tooltipPos, setTooltipPos] = useState(null);
  const [pendingMode, setPendingMode] = useState(null);
  const btnRef = useRef(null);

  const isOp = workMode === WORK_MODES.OPERATION;
  const isConfirmOpen = Boolean(
    canSwitchWorkMode && pendingMode && pendingMode !== workMode,
  );

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
      if (!canSwitchWorkMode || !canWorkMode(nextMode)) return;
      if (!workMode || nextMode === workMode) return;
      setTooltipPos(null);
      setPendingMode(nextMode);
    },
    [canSwitchWorkMode, canWorkMode, workMode],
  );

  const handleCancelSwitch = useCallback(() => {
    setPendingMode(null);
  }, []);

  const handleConfirmSwitch = useCallback(() => {
    if (!canSwitchWorkMode || !pendingMode || pendingMode === workMode) {
      setPendingMode(null);
      return;
    }
    const targetMode = pendingMode;
    setPendingMode(null);
    switchLevelMode(targetMode, currentLevel);
    onModeChange?.();
  }, [canSwitchWorkMode, pendingMode, workMode, switchLevelMode, currentLevel, onModeChange]);

  useEffect(() => {
    if (!workMode || isConfirmOpen || !canSwitchWorkMode) return;

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
  }, [workMode, isOp, isConfirmOpen, canSwitchWorkMode, handleRequestModeChange]);

  if (!workMode) return null;

  const isSwitchingToOp = pendingMode === WORK_MODES.OPERATION;
  const confirmDialog =
    typeof document !== "undefined" && canSwitchWorkMode
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
          document.body,
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
            disabled={!canSwitchWorkMode}
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
            aria-label={`Work Mode: ${isOp ? "Operation" : "View"}${canSwitchWorkMode ? " (Click to switch)" : " (Locked by role)"}`}
            className={cn(
              "relative flex size-9 items-center justify-center rounded-[9px] border transition-all shadow-2xs",
              canSwitchWorkMode ? "cursor-pointer active:scale-[0.95]" : "cursor-default opacity-90",
              isOp
                ? "border-purple-500/35 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                : "border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              canSwitchWorkMode &&
                (isOp ? "hover:bg-purple-500/20" : "hover:bg-emerald-500/20"),
            )}
          >
            {isOp ? (
              <Zap className="size-4 fill-current" />
            ) : (
              <Eye className="size-4 stroke-[2.3]" />
            )}
            {!canSwitchWorkMode && (
              <Lock className="size-2.5 absolute -bottom-0.5 -right-0.5 bg-surface rounded-full p-0.2 text-text-muted" />
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
                <span className="text-text-muted">
                  {canSwitchWorkMode ? "• Switch (Alt+W)" : "• Locked by Role"}
                </span>
              </div>,
              document.body,
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
          {canSwitchWorkMode ? (
            <span className="text-[10px] font-mono text-text-muted/70">Alt+W</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-text-muted/80">
              <Lock className="size-2.5" />
              Role Locked
            </span>
          )}
        </div>

        {canSwitchWorkMode ? (
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
                  : "text-text-muted hover:text-text hover:bg-surface-hover/70",
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
                  : "text-text-muted hover:text-text hover:bg-surface-hover/70",
              )}
            >
              <Zap className={cn("size-3.5 shrink-0", isOp && "fill-current")} />
              <span>Operation</span>
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center justify-between rounded-[10px] border px-2.5 py-2 text-[11.5px] font-semibold",
              isOp
                ? "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            )}
          >
            <div className="flex items-center gap-1.5">
              {isOp ? (
                <Zap className="size-3.5 fill-current shrink-0" />
              ) : (
                <Eye className="size-3.5 stroke-[2.2] shrink-0" />
              )}
              <span>{isOp ? "Operation Mode" : "View Mode"}</span>
            </div>
            <Lock className="size-3 opacity-70" />
          </div>
        )}
      </div>
      {confirmDialog}
    </>
  );
};

export default SidebarWorkModeSwitcher;
