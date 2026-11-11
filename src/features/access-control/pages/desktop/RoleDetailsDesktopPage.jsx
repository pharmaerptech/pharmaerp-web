// src/features/access-control/pages/desktop/RoleDetailsDesktopPage.jsx

import { useMemo } from "react";
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
import {
  RoleWorkAccessBadges,
  RoleWorkAccessFields,
} from "@/features/access-control/components";
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
  const isSystem = Boolean(role?.isSystem);
  const isOwnerRole = Boolean(role?.isOwnerRole);
  const canEdit = Boolean(role?.canEdit) && can("role:update");

  const workAccessSummary = useMemo(
    () => buildWorkAccessDisplaySummary(role?.workAccess || role),
    [role],
  );

  const permissionGroups = useMemo(() => {
    const source = role?.rawPermissions || role?.permissions;
    if (!source) return [];
    return groupModulePermissionStrings(source);
  }, [role?.permissions, role?.rawPermissions]);

  if (isLoading && !hasRole) {
    return (
      <div className="min-h-screen bg-bg text-text p-3 sm:p-4 lg:p-5 max-w-[1440px] mx-auto space-y-4">
        <div className="bg-surface rounded-2xl p-6 border border-border/60 shadow-2xs space-y-4">
          <UISkeleton className="h-6 w-48 rounded" />
          <UISkeleton className="h-4 w-96 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-2">
              <UISkeleton className="h-3 w-20 rounded" />
              <UISkeleton className="h-6 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hasError && !hasRole) {
    return (
      <div className="min-h-screen bg-bg text-text p-3 sm:p-4 lg:p-5 max-w-[1440px] mx-auto">
        <div className="bg-surface rounded-2xl p-8 border border-border/60 shadow-2xs text-center space-y-3">
          <UIEmptyState
            icon={<Shield className="size-10 text-destructive/60" />}
            title="Role Not Found"
            description={error || "Could not retrieve role details. The role may have been deleted."}
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
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text p-3 sm:p-4 lg:p-5 max-w-[1440px] mx-auto space-y-4">
      {/* Feedback Toast */}
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

      {/* 1. Header Navigation & Actions Bar */}
      <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <UIIconButton
            variant="outline"
            size="sm"
            onClick={handleBackToRoles}
            aria-label="Back to roles"
          >
            <ArrowLeft className="size-4" />
          </UIIconButton>

          <div className="space-y-1">
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
              {isSystem && (
                <UIBadge variant="soft" color="primary" size="xs">
                  System Default
                </UIBadge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-text-muted">
                Code: <span className="font-mono">{role?.displayCode}</span> • Scope:{" "}
                {isSystem ? "Organization" : "Workspace"}
              </p>
              <RoleWorkAccessBadges workAccess={workAccessSummary} compact />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <UIButton
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
          >
            Refresh
          </UIButton>

          {canEdit && (
            <UIButton
              variant="primary"
              size="sm"
              onClick={handleEditRole}
              startIcon={<Edit2 className="size-3.5" />}
            >
              Edit Role
            </UIButton>
          )}
        </div>
      </div>

      {/* 2. Top Metric Stat Capsules */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>Assigned Members</span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-text font-mono">
            {role?.membersCount ?? 0}
          </div>
          <span className="text-[11px] text-text-muted">Active staff using this role</span>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>Module Permissions</span>
            <FileKey className="size-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-text font-mono">
            {role?.permissionCount ?? 0}
          </div>
          <span className="text-[11px] text-text-muted">Capabilities granted</span>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>Level Ceiling</span>
            <Layers className="size-4 text-purple-500" />
          </div>
          <div className="text-base font-bold text-text truncate">
            {workAccessSummary.levelLabel}
          </div>
          <span className="text-[11px] text-text-muted">
            {workAccessSummary.hierarchyLabel}
          </span>
        </div>

        <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span>Role Status</span>
            <CheckCircle2 className="size-4 text-success" />
          </div>
          <div className="text-base font-bold text-success capitalize">
            {role?.displayStatus || "Active"}
          </div>
          <span className="text-[11px] text-text-muted">
            Modes: {workAccessSummary.modeShortText}
          </span>
        </div>
      </div>

      {/* 3. Main Dual-Column Blueprint Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 cols): Description, Work Access & Permissions Matrix */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card 1: Description & Role Overview */}
          <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold text-text uppercase tracking-wider">
              Role Overview & Responsibilities
            </h2>
            <p className="text-xs sm:text-sm text-text leading-relaxed">
              {role?.displayDescription || "No description provided for this role."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40 text-xs">
              <div>
                <span className="text-text-muted block text-[11px]">System Code</span>
                <span className="font-mono font-semibold text-text">{role?.displayCode}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Created By</span>
                <span className="font-semibold text-text">{role?.displayCreatedBy || "System Admin"}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Created Date</span>
                <span className="font-semibold text-text">{role?.displayCreatedAt || "-"}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Last Updated</span>
                <span className="font-semibold text-text">{role?.displayUpdatedAt || "-"}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Work Modes & Level Hierarchy */}
          <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <h2 className="text-sm font-bold text-text">
                  Work Modes & Level Hierarchy
                </h2>
              </div>
              <RoleWorkAccessBadges workAccess={workAccessSummary} compact />
            </div>

            <RoleWorkAccessFields
              workModes={workAccessSummary.allowedWorkModes}
              workLevel={workAccessSummary.highestWorkLevel}
              viewOnly
            />
          </div>

          {/* Card 3: Granted Permissions Matrix */}
          <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <FileKey className="size-4 text-primary" />
                <h2 className="text-sm font-bold text-text">
                  Allocated Capabilities ({role?.permissionCount ?? 0})
                </h2>
              </div>
              <UIButton
                variant="ghost"
                size="xs"
                onClick={handleViewPermissions}
                className="text-primary hover:text-primary-hover"
              >
                View Full Matrix
              </UIButton>
            </div>

            {permissionGroups.length > 0 ? (
              <div className="space-y-3">
                {permissionGroups.map((group) => (
                  <div
                    key={group.key}
                    className="p-3.5 rounded-xl border border-border/60 bg-surface-alt/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="size-3.5 text-primary" />
                        <span className="text-xs font-bold text-text">{group.title}</span>
                      </div>
                      <UIBadge variant="soft" color="neutral" size="xs">
                        {group.permissions.length} Granted
                      </UIBadge>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {group.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="px-2.5 py-1 rounded-lg text-xs bg-surface border border-border/50 text-text font-medium flex items-center gap-1.5 shadow-2xs"
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
              <div className="py-6 text-center text-xs text-text-muted bg-surface-alt/30 rounded-xl border border-dashed border-border/80">
                No individual module permissions attached to this role.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Governance Rail & Information */}
        <div className="lg:col-span-4 space-y-4">
          {/* Security & Governance Capsule */}
          <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Shield className="size-4 text-primary" />
              <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                Security Governance
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border/30">
                <span className="text-text-muted">Role Type</span>
                <span className="font-semibold text-text">
                  {isSystem ? "System Default" : "Custom Role"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/30">
                <span className="text-text-muted">Modification Status</span>
                <span className="font-semibold text-text">
                  {isOwnerRole
                    ? "Locked (Owner Protection)"
                    : role?.canEdit
                      ? "Editable"
                      : "Locked / Protected"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border/30">
                <span className="text-text-muted">Deletion Safeguard</span>
                <span className="font-semibold text-text">
                  {role?.canDelete ? "Can be deleted" : "Protected from deletion"}
                </span>
              </div>
            </div>

            <p className="text-[11.5px] text-text-muted leading-relaxed pt-1">
              {isOwnerRole
                ? "The Owner role automatically holds full View & Operation access across Workspace, Company, and Branch levels and cannot be restricted."
                : isSystem
                  ? "This is a default system role. Owners and permitted admins can customize its Work Modes, Work Level hierarchy, and module permissions, while deletion remains protected."
                  : "This custom role can be configured, updated with new Work Modes/Levels or permissions, and reassigned across your staff."}
            </p>
          </div>

          {/* Quick Actions Rail */}
          <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {canEdit && (
                <UIButton
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={handleEditRole}
                  startIcon={<Edit2 className="size-3.5" />}
                >
                  Edit Role Configuration
                </UIButton>
              )}
              <UIButton
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleBackToRoles}
                startIcon={<ArrowLeft className="size-3.5" />}
              >
                Back to All Roles
              </UIButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
