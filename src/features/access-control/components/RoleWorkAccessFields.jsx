import {
  Building2,
  Check,
  Eye,
  GitBranch,
  Layers,
  Lock,
  ShieldAlert,
  Wrench,
} from "lucide-react";

import { UICheckbox, UIBadge } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  WORK_ACCESS_META,
  WORK_LEVEL_RANK,
  WORK_LEVELS,
  WORK_MODES,
  expandWorkLevelHierarchy,
  normalizeWorkLevel,
  normalizeWorkModes,
  resolveRoleWorkAccess,
} from "@/utils/workAccess";

const MODE_ICON_MAP = {
  [WORK_MODES.VIEW]: Eye,
  [WORK_MODES.OPERATION]: Wrench,
};

const LEVEL_ICON_MAP = {
  [WORK_LEVELS.WORKSPACE]: Layers,
  [WORK_LEVELS.COMPANY]: Building2,
  [WORK_LEVELS.BRANCH]: GitBranch,
};

const LEVEL_BADGE_TONE = {
  [WORK_LEVELS.WORKSPACE]: "primary",
  [WORK_LEVELS.COMPANY]: "info",
  [WORK_LEVELS.BRANCH]: "success",
};

/**
 * Compact badges for Work Modes and Work Level hierarchy (cards, tables, sidebars, modals).
 */
export function RoleWorkAccessBadges({
  role = null,
  workAccess = null,
  workModes = null,
  workLevel = null,
  compact = false,
  showHierarchy = false,
  className = "",
}) {
  const resolved = workAccess?.allowedWorkModes && workAccess?.highestWorkLevel
    ? {
        allowedWorkModes: normalizeWorkModes(workAccess.allowedWorkModes),
        highestWorkLevel:
          normalizeWorkLevel(workAccess.highestWorkLevel) || WORK_LEVELS.BRANCH,
      }
    : workModes || workLevel
      ? resolveRoleWorkAccess({
          ...(role || {}),
          workModes: workModes ?? role?.workModes,
          workLevel: workLevel ?? role?.workLevel,
        })
      : resolveRoleWorkAccess(role);

  const levelMeta = WORK_ACCESS_META.levels.find(
    (item) => item.value === resolved.highestWorkLevel,
  );
  const LevelIcon = LEVEL_ICON_MAP[resolved.highestWorkLevel] || GitBranch;

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {resolved.allowedWorkModes.map((mode) => {
        const ModeIcon = MODE_ICON_MAP[mode] || Eye;
        const isOperation = mode === WORK_MODES.OPERATION;
        return (
          <UIBadge
            key={mode}
            variant="soft"
            color={isOperation ? "warning" : "info"}
            size={compact ? "xs" : "sm"}
            className="gap-1 font-semibold"
          >
            <ModeIcon className="size-3 shrink-0" />
            <span>{isOperation ? "Operation" : "View"}</span>
          </UIBadge>
        );
      })}

      <UIBadge
        variant="soft"
        color={LEVEL_BADGE_TONE[resolved.highestWorkLevel] || "neutral"}
        size={compact ? "xs" : "sm"}
        className="gap-1 font-semibold"
      >
        <LevelIcon className="size-3 shrink-0" />
        <span>
          {compact
            ? levelMeta?.shortLabel || "Branch"
            : levelMeta?.label || "Branch Level"}
        </span>
      </UIBadge>

      {showHierarchy && levelMeta?.inheritsLabel && (
        <span className="text-[11px] font-medium text-text-muted">
          ({levelMeta.inheritsLabel})
        </span>
      )}
    </div>
  );
}

/**
 * Interactive (or read-only via viewOnly) selector for Work Modes (strict, no hierarchy)
 * and Work Level (Workspace > Company > Branch downward hierarchy).
 */
export function RoleWorkAccessFields({
  workModes = [WORK_MODES.VIEW],
  workLevel = WORK_LEVELS.BRANCH,
  onChangeWorkModes,
  onChangeWorkLevel,
  allowedActorWorkModes = null,
  maxActorWorkLevel = null,
  disabled = false,
  viewOnly = false,
  error = "",
  compact = false,
}) {
  const activeModes = normalizeWorkModes(workModes);
  const activeLevel = normalizeWorkLevel(workLevel) || WORK_LEVELS.BRANCH;
  const accessibleLevels = expandWorkLevelHierarchy(activeLevel);

  const actorModesSet = Array.isArray(allowedActorWorkModes)
    ? new Set(normalizeWorkModes(allowedActorWorkModes))
    : null;
  const actorMaxRank = maxActorWorkLevel
    ? WORK_LEVEL_RANK[normalizeWorkLevel(maxActorWorkLevel)] || 3
    : 3;

  const handleToggleMode = (mode) => {
    if (disabled || viewOnly || !onChangeWorkModes) return;
    if (actorModesSet && !actorModesSet.has(mode) && !activeModes.includes(mode)) {
      return;
    }

    const exists = activeModes.includes(mode);
    const next = exists
      ? activeModes.filter((m) => m !== mode)
      : [...activeModes, mode];

    onChangeWorkModes(normalizeWorkModes(next));
  };

  const handleSelectLevel = (level) => {
    if (disabled || viewOnly || !onChangeWorkLevel) return;
    const rank = WORK_LEVEL_RANK[level] || 1;
    if (rank > actorMaxRank && level !== activeLevel) {
      return;
    }
    onChangeWorkLevel(level);
  };

  const activeLevelMeta = WORK_ACCESS_META.levels.find(
    (item) => item.value === activeLevel,
  );

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* 1. Work Modes Section (Strict - No Hierarchy) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-xs font-bold text-text uppercase tracking-wider">
              Work Modes
            </h3>
            <p className="text-[11.5px] text-text-muted">
              Explicit assignment only — View Mode never unlocks Operation Mode, and Operation never grants View.
            </p>
          </div>
          <UIBadge variant="soft" color="neutral" size="xs">
            No Hierarchy
          </UIBadge>
        </div>

        <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", compact && "gap-2.5")}>
          {WORK_ACCESS_META.modes.map((modeMeta) => {
            const checked = activeModes.includes(modeMeta.value);
            const Icon = MODE_ICON_MAP[modeMeta.value] || Eye;
            const restrictedByActor = Boolean(
              !viewOnly && actorModesSet && !actorModesSet.has(modeMeta.value),
            );
            const isCardDisabled = disabled || viewOnly || (restrictedByActor && !checked);

            return (
              <div
                key={modeMeta.value}
                role={!viewOnly ? "button" : undefined}
                tabIndex={!isCardDisabled ? 0 : undefined}
                onClick={() => !isCardDisabled && handleToggleMode(modeMeta.value)}
                onKeyDown={(e) => {
                  if (!isCardDisabled && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleToggleMode(modeMeta.value);
                  }
                }}
                className={cn(
                  "rounded-xl border p-3.5 transition-all text-left",
                  compact && "p-3",
                  checked
                    ? "border-primary/60 bg-primary/5 shadow-2xs"
                    : "border-border/70 bg-surface-alt/30",
                  !viewOnly && !isCardDisabled && "cursor-pointer hover:border-primary/40",
                  isCardDisabled && !viewOnly && "opacity-60 cursor-not-allowed",
                )}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "size-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5",
                        checked
                          ? modeMeta.value === WORK_MODES.OPERATION
                            ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                            : "bg-blue-500/15 text-blue-600 border-blue-500/30"
                          : "bg-surface text-text-muted border-border/60",
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-text">
                          {modeMeta.label}
                        </span>
                        {restrictedByActor && (
                          <UIBadge variant="soft" color="neutral" size="xs" className="gap-1">
                            <Lock className="size-2.5" />
                            <span>Locked</span>
                          </UIBadge>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted leading-snug mt-0.5">
                        {modeMeta.description}
                      </p>
                    </div>
                  </div>

                  {viewOnly ? (
                    <UIBadge
                      variant="soft"
                      color={checked ? "success" : "neutral"}
                      size="xs"
                      className="shrink-0"
                    >
                      {checked ? "Allowed" : "Blocked"}
                    </UIBadge>
                  ) : (
                    <div
                      className="shrink-0 pt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <UICheckbox
                        checked={checked}
                        disabled={isCardDisabled}
                        onChange={() => handleToggleMode(modeMeta.value)}
                        aria-label={modeMeta.label}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Work Level Hierarchy Section (Workspace > Company > Branch) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-xs font-bold text-text uppercase tracking-wider">
              Work Level Tier
            </h3>
            <p className="text-[11.5px] text-text-muted">
              Downward hierarchy — Workspace includes Company & Branch; Company includes Branch; Branch stays in Branch only.
            </p>
          </div>
          <UIBadge variant="soft" color="primary" size="xs">
            Hierarchical
          </UIBadge>
        </div>

        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-2.5", compact && "gap-2")}>
          {WORK_ACCESS_META.levels.map((levelMeta) => {
            const selected = activeLevel === levelMeta.value;
            const inheritedOnly = !selected && accessibleLevels.includes(levelMeta.value);
            const Icon = LEVEL_ICON_MAP[levelMeta.value] || GitBranch;
            const rank = WORK_LEVEL_RANK[levelMeta.value] || 1;
            const restrictedByActor = Boolean(!viewOnly && rank > actorMaxRank);
            const isCardDisabled = disabled || viewOnly || (restrictedByActor && !selected);

            return (
              <div
                key={levelMeta.value}
                role={!viewOnly ? "button" : undefined}
                tabIndex={!isCardDisabled ? 0 : undefined}
                onClick={() => !isCardDisabled && handleSelectLevel(levelMeta.value)}
                onKeyDown={(e) => {
                  if (!isCardDisabled && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleSelectLevel(levelMeta.value);
                  }
                }}
                className={cn(
                  "rounded-xl border p-3.5 transition-all text-left flex flex-col justify-between gap-2",
                  compact && "p-3",
                  selected
                    ? "border-primary bg-primary/5 shadow-2xs"
                    : inheritedOnly
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-border/70 bg-surface-alt/30",
                  !viewOnly && !isCardDisabled && "cursor-pointer hover:border-primary/50",
                  isCardDisabled && !viewOnly && "opacity-55 cursor-not-allowed",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        "size-7 rounded-lg border flex items-center justify-center shrink-0",
                        selected
                          ? "bg-primary text-white border-primary"
                          : inheritedOnly
                            ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                            : "bg-surface text-text-muted border-border/60",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-text block truncate">
                        {levelMeta.label}
                      </span>
                      <span className="text-[10.5px] font-medium text-text-muted block">
                        {levelMeta.inheritsLabel}
                      </span>
                    </div>
                  </div>

                  {selected ? (
                    <span className="size-4 rounded-full bg-primary text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="size-2.5 stroke-[3]" />
                    </span>
                  ) : restrictedByActor ? (
                    <Lock className="size-3.5 text-text-muted shrink-0 mt-0.5" />
                  ) : (
                    <span
                      className={cn(
                        "size-4 rounded-full border shrink-0 mt-0.5",
                        inheritedOnly ? "border-emerald-500/60 bg-emerald-500/15" : "border-border",
                      )}
                    />
                  )}
                </div>

                <p className="text-[11px] text-text-muted leading-snug">
                  {levelMeta.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Live Inheritance & Policy Summary Strip */}
      <div className="rounded-xl border border-border/60 bg-surface-alt/40 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-text">Effective Access:</span>
          {accessibleLevels.map((lvl) => {
            const label =
              lvl === WORK_LEVELS.WORKSPACE
                ? "Workspace"
                : lvl === WORK_LEVELS.COMPANY
                  ? "Company"
                  : "Branch";
            return (
              <span
                key={lvl}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold"
              >
                <Check className="size-2.5 stroke-[3]" />
                <span>{label}</span>
              </span>
            );
          })}
          {[WORK_LEVELS.WORKSPACE, WORK_LEVELS.COMPANY, WORK_LEVELS.BRANCH]
            .filter((lvl) => !accessibleLevels.includes(lvl))
            .map((lvl) => {
              const label =
                lvl === WORK_LEVELS.WORKSPACE
                  ? "Workspace"
                  : lvl === WORK_LEVELS.COMPANY
                    ? "Company"
                    : "Branch";
              return (
                <span
                  key={lvl}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-border/50 text-text-muted text-[11px]"
                >
                  <Lock className="size-2.5" />
                  <span>{label} Locked</span>
                </span>
              );
            })}
        </div>

        <span className="text-[11px] text-text-muted font-medium">
          {activeLevelMeta?.label}:{" "}
          {activeModes.length > 0
            ? activeModes
                .map((m) => (m === WORK_MODES.OPERATION ? "Operation" : "View"))
                .join(" & ")
            : "None"}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <ShieldAlert className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default RoleWorkAccessFields;

