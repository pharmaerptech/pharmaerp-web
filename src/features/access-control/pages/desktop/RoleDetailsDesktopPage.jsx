// src/features/access-control/pages/desktop/RoleDetailsDesktopPage.jsx

import React, { useMemo, useState } from "react";
import {
  Shield,
  ArrowLeft,
  Edit2,
  Users,
  RotateCcw,
  CheckCircle2,
  Layers,
  FileKey,
  Check,
  Search,
  Sparkles,
  Lock,
  ExternalLink,
  Info,
} from "lucide-react";

import {
  UIButton,
  UIIconButton,
  UIBadge,
  UISkeleton,
  UIEmptyState,
  UIAlert,
} from "@/components/ui";
import { usePermission } from "@/hooks";
import { RoleWorkAccessBadges } from "@/features/access-control/components";
import {
  buildWorkAccessDisplaySummary,
  groupModulePermissionStrings,
} from "../../utils/roleForm.helper";

export default function RoleDetailsDesktopPage({
  role = null,
  isLoading = false,
  hasError = false,
  hasRole = false,
  error = null,
  message = null,

  handleRefresh,
  handleBackToRoles,
  handleEditRole,
  handleViewPermissions,
  clearMessage,
}) {
  const { can } = usePermission();
  const [permSearch, setPermSearch] = useState("");

  const isSystem = Boolean(role?.isSystem);
  const isOwnerRole = Boolean(role?.isOwnerRole);
  const canEdit = Boolean(role?.canEdit) && can("role:update");

  const workAccessSummary = useMemo(
    () => buildWorkAccessDisplaySummary(role?.workAccess || role),
    [role]
  );

  const permissionGroups = useMemo(() => {
    const source = role?.rawPermissions || role?.permissions;
    if (!source) return [];
    return groupModulePermissionStrings(source);
  }, [role?.permissions, role?.rawPermissions]);

  const filteredPermissionGroups = useMemo(() => {
    if (!permSearch.trim()) return permissionGroups;
    const query = permSearch.toLowerCase().trim();

    return permissionGroups
      .map((group) => {
        const matchesGroup = group.title.toLowerCase().includes(query);
        const matchedPerms = group.permissions.filter((p) =>
          p.toLowerCase().includes(query)
        );

        if (matchesGroup) {
          return group;
        }

        if (matchedPerms.length > 0) {
          return {
            ...group,
            permissions: matchedPerms,
          };
        }

        return null;
      })
      .filter(Boolean);
  }, [permissionGroups, permSearch]);

  // ── High-Fidelity Loading Skeleton ──────────────────────────────────────────
  if (isLoading && !hasRole) {
    return (
      <div className="w-full min-h-full bg-bg text-text px-2 sm:px-3 pt-0 pb-12 font-sans overflow-y-auto">
        <div className="max-w-[1440px] mx-auto space-y-4">
          {/* Skeleton Header Bar */}
          <div className="p-4 rounded-xl bg-surface border border-border/70 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <UISkeleton className="size-9 rounded-lg" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <UISkeleton className="h-5 w-40 rounded" />
                  <UISkeleton className="h-4 w-16 rounded-full" />
                </div>
                <UISkeleton className="h-3.5 w-60 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UISkeleton className="h-8 w-20 rounded-md" />
              <UISkeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>

          {/* Skeleton 4-Stat Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] p-3 rounded-xl bg-surface border border-border/70 shadow-2xs flex items-center gap-3"
              >
                <UISkeleton className="size-9 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <UISkeleton className="h-3 w-20 rounded" />
                  <UISkeleton className="h-5 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton Content Dual Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-4">
              <div className="p-5 rounded-xl bg-surface border border-border/70 space-y-3">
                <UISkeleton className="h-4 w-32 rounded" />
                <UISkeleton className="h-3.5 w-full rounded" />
                <UISkeleton className="h-3.5 w-3/4 rounded" />
              </div>
              <div className="p-5 rounded-xl bg-surface border border-border/70 space-y-3">
                <UISkeleton className="h-4 w-44 rounded" />
                <div className="space-y-2 pt-2">
                  <UISkeleton className="h-16 w-full rounded-lg" />
                  <UISkeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-xl bg-surface border border-border/70 space-y-3">
                <UISkeleton className="h-4 w-32 rounded" />
                <UISkeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="p-5 rounded-xl bg-surface border border-border/70 space-y-2">
                <UISkeleton className="h-8 w-full rounded-md" />
                <UISkeleton className="h-8 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────────────
  if (hasError && !hasRole) {
    return (
      <div className="w-full min-h-full bg-bg text-text px-2 sm:px-3 pt-0 pb-12 font-sans overflow-y-auto">
        <div className="max-w-[1440px] mx-auto py-8">
          <div className="bg-surface rounded-xl p-8 border border-border/80 shadow-2xs text-center max-w-lg mx-auto">
            <UIEmptyState
              icon={<Shield className="size-10 text-destructive/70" />}
              title="Role Not Found"
              description={error || "Could not retrieve role details. The role may have been modified or deleted."}
              action={
                <UIButton
                  variant="outline"
                  size="sm"
                  onClick={handleBackToRoles}
                  startIcon={<ArrowLeft className="size-4" />}
                >
                  Back to Roles
                </UIButton>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-bg text-text px-2 sm:px-3 pt-0 pb-12 font-sans overflow-y-auto select-text">
      <div className="max-w-[1440px] mx-auto space-y-4">
        {/* Toast Feedback */}
        {message && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
            <UIAlert
              intent="success"
              title={message}
              onClose={clearMessage}
              className="shadow-lg"
            />
          </div>
        )}

        {/* ── 1. Header Navigation & Actions Bar ────────────────────────────── */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-surface border border-border/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <UIIconButton
              variant="outline"
              size="sm"
              onClick={handleBackToRoles}
              aria-label="Back to roles"
              className="size-8 rounded-lg shrink-0"
            >
              <ArrowLeft className="size-4" />
            </UIIconButton>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text">
                  {role?.displayName || "Role Details"}
                </h1>
                <UIBadge
                  variant="soft"
                  color={role?.displayStatus === "active" ? "success" : "neutral"}
                  size="xs"
                >
                  {role?.displayStatus || "active"}
                </UIBadge>
                {isOwnerRole ? (
                  <UIBadge variant="soft" color="primary" size="xs">
                    Primary Owner
                  </UIBadge>
                ) : isSystem ? (
                  <UIBadge variant="soft" color="neutral" size="xs">
                    System Default
                  </UIBadge>
                ) : (
                  <UIBadge variant="soft" color="secondary" size="xs">
                    Custom Role
                  </UIBadge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
                <span>
                  Code: <strong className="font-mono text-text">{role?.displayCode}</strong>
                </span>
                <span>•</span>
                <span>
                  Ceiling: <strong className="text-text">{workAccessSummary.levelLabel}</strong>
                </span>
                <span>•</span>
                <RoleWorkAccessBadges workAccess={workAccessSummary} compact />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <UIButton
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
              className="h-8 text-xs"
            >
              Refresh
            </UIButton>

            {canEdit && (
              <UIButton
                variant="primary"
                size="sm"
                onClick={handleEditRole}
                startIcon={<Edit2 className="size-3.5" />}
                className="h-8 text-xs"
              >
                Edit Role
              </UIButton>
            )}
          </div>
        </div>

        {/* ── 2. Top Metric Stat Capsules (Standard 4-Card Grid) ────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Stat 1: Assigned Members */}
          <div className="h-[72px] p-3 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3">
            <div className="size-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Users className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block">
                Assigned Staff
              </span>
              <div className="text-lg font-bold font-mono text-text leading-tight mt-0.5">
                {role?.membersCount ?? 0}
              </div>
            </div>
          </div>

          {/* Stat 2: Module Permissions */}
          <div className="h-[72px] p-3 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3">
            <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <FileKey className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block">
                Capabilities
              </span>
              <div className="text-lg font-bold font-mono text-text leading-tight mt-0.5">
                {role?.permissionCount ?? 0}
              </div>
            </div>
          </div>

          {/* Stat 3: Level Hierarchy */}
          <div className="h-[72px] p-3 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3">
            <div className="size-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Layers className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block">
                Work Ceiling
              </span>
              <div className="text-sm font-bold text-text truncate mt-0.5">
                {workAccessSummary.levelLabel}
              </div>
            </div>
          </div>

          {/* Stat 4: Operational Modes */}
          <div className="h-[72px] p-3 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3">
            <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block">
                Work Modes
              </span>
              <div className="text-sm font-bold text-text truncate mt-0.5">
                {workAccessSummary.modeShortText}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Main Dual-Column Content Grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT COLUMN: Overview & Permissions Matrix (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Description & Overview */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface border border-border/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text uppercase tracking-wider">
                  Role Description & Scope
                </span>
                <span className="text-[11px] text-text-muted font-mono">
                  {role?.displayCode}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                {role?.displayDescription || "No description configured for this role."}
              </p>
            </div>

            {/* Allocated Capabilities & Permissions Matrix */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface border border-border/80 shadow-2xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <FileKey className="size-4 text-primary" />
                  <h2 className="text-sm font-bold text-text">
                    Granted Permissions ({role?.permissionCount ?? 0})
                  </h2>
                </div>

                {/* Filter search inside permissions */}
                <div className="relative max-w-xs w-full sm:w-60">
                  <Search className="size-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                    placeholder="Search capabilities..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md bg-bg border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {filteredPermissionGroups.length > 0 ? (
                <div className="space-y-3">
                  {filteredPermissionGroups.map((group) => (
                    <div
                      key={group.key}
                      className="p-3 rounded-lg border border-border/70 bg-surface-alt/40 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text">
                          {group.title}
                        </span>
                        <UIBadge variant="soft" color="neutral" size="xs">
                          {group.permissions.length} Granted
                        </UIBadge>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {group.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="px-2 py-1 rounded-md text-[11px] bg-surface border border-border/60 text-text font-medium flex items-center gap-1.5 shadow-2xs"
                          >
                            <Check className="size-3 text-emerald-500 stroke-[3]" />
                            <span>{perm}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-text-muted bg-surface-alt/20 rounded-lg border border-dashed border-border/80">
                  {permSearch ? `No permissions matching "${permSearch}"` : "No individual capabilities assigned."}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Work Modes, Hierarchy & Governance (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Work Access Blueprint */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface border border-border/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Layers className="size-4 text-primary" />
                <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                  Work Access Framework
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-text-muted">Work Level Ceiling</span>
                  <span className="font-semibold text-text">
                    {workAccessSummary.levelLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-text-muted">Supported Modes</span>
                  <span className="font-semibold text-text">
                    {workAccessSummary.modeShortText}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-text-muted">Hierarchy Scope</span>
                  <span className="font-semibold text-text">
                    {workAccessSummary.hierarchyLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Security & Governance */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface border border-border/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Shield className="size-4 text-primary" />
                <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                  Governance
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-text-muted">Role Category</span>
                  <span className="font-semibold text-text">
                    {isOwnerRole ? "Primary Owner" : isSystem ? "System Default" : "Custom Defined"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-text-muted">Editable</span>
                  <span className="font-semibold text-text">
                    {canEdit ? "Yes (Permitted)" : "Protected"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-text-muted">Deletion Protection</span>
                  <span className="font-semibold text-text">
                    {role?.canDelete ? "Can be deleted" : "Protected"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Rail */}
            <div className="p-4 sm:p-5 rounded-xl bg-surface border border-border/80 shadow-2xs space-y-2.5">
              <span className="text-xs font-bold text-text uppercase tracking-wider block">
                Quick Actions
              </span>
              <div className="space-y-2">
                {canEdit && (
                  <UIButton
                    variant="primary"
                    size="sm"
                    className="w-full text-xs h-8"
                    onClick={handleEditRole}
                    startIcon={<Edit2 className="size-3.5" />}
                  >
                    Edit Role
                  </UIButton>
                )}
                <UIButton
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8"
                  onClick={handleBackToRoles}
                  startIcon={<ArrowLeft className="size-3.5" />}
                >
                  Back to Roles
                </UIButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
