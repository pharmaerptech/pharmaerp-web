// src/features/access-control/pages/mobile/RoleDetailsMobilePage.jsx

import { useMemo } from "react";
import {
  Shield,
  ArrowLeft,
  Edit2,
  Users,
  RotateCcw,
  FileKey,
  Check,
} from "lucide-react";

import {
  UIButton,
  UIIconButton,
  UIBadge,
  UISkeleton,
  UIEmptyState,
} from "@/components/ui";
import { usePermission } from "@/hooks";
import { RoleWorkAccessFields } from "@/features/access-control/components";
import {
  buildWorkAccessDisplaySummary,
  groupModulePermissionStrings,
} from "../../utils/roleForm.helper";

export default function RoleDetailsMobilePage({
  role = null,

  isLoading = false,
  hasError = false,
  hasRole = false,
  error = null,

  handleRefresh,
  handleBackToRoles,
  handleEditRole,
}) {
  const { can } = usePermission();
  const isSystem = Boolean(role?.isSystem);
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
      <div className="min-h-screen bg-bg text-text p-3 space-y-3">
        <UISkeleton className="h-16 w-full rounded-2xl" />
        <UISkeleton className="h-28 w-full rounded-2xl" />
        <UISkeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (hasError && !hasRole) {
    return (
      <div className="min-h-screen bg-bg text-text p-3">
        <div className="bg-surface rounded-2xl p-6 border border-border/60 shadow-2xs text-center space-y-3">
          <UIEmptyState
            icon={<Shield className="size-8 text-destructive/60" />}
            title="Role Not Found"
            description={error || "Could not retrieve role details."}
            action={
              <UIButton variant="outline" size="sm" onClick={handleBackToRoles}>
                Back to Roles
              </UIButton>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text p-3 pb-24 space-y-3.5">
      {/* Header */}
      <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <UIIconButton
            variant="outline"
            size="sm"
            onClick={handleBackToRoles}
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </UIIconButton>
          <div>
            <h1 className="text-base font-bold text-text truncate">
              {role?.displayName || "Role"}
            </h1>
            <span className="text-[11px] text-text-muted">
              {isSystem ? "System Role" : "Custom Role"} • {role?.displayStatus}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <UIIconButton
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            aria-label="Refresh"
          >
            <RotateCcw className="size-3.5 text-text-muted" />
          </UIIconButton>

          {canEdit && (
            <UIButton
              variant="primary"
              size="xs"
              onClick={handleEditRole}
              startIcon={<Edit2 className="size-3" />}
            >
              Edit
            </UIButton>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-surface rounded-2xl p-3.5 border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-text-muted text-[11px]">
            <span>Members</span>
            <Users className="size-3.5 text-primary" />
          </div>
          <div className="text-lg font-bold text-text font-mono">
            {role?.membersCount ?? 0}
          </div>
          <span className="text-[10px] text-text-muted">Assigned staff</span>
        </div>

        <div className="bg-surface rounded-2xl p-3.5 border border-border/60 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-text-muted text-[11px]">
            <span>Module Perms</span>
            <FileKey className="size-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-text font-mono">
            {role?.permissionCount ?? 0}
          </div>
          <span className="text-[10px] text-text-muted">Granted rights</span>
        </div>
      </div>

      {/* Work Modes & Level Hierarchy */}
      <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-2.5">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">
          Work Modes & Level Hierarchy
        </h2>
        <RoleWorkAccessFields
          workModes={workAccessSummary.allowedWorkModes}
          workLevel={workAccessSummary.highestWorkLevel}
          viewOnly
          compact
        />
      </div>

      {/* Description Card */}
      <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-2">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">
          Description
        </h2>
        <p className="text-xs text-text-muted leading-relaxed">
          {role?.displayDescription || "No description provided."}
        </p>
      </div>

      {/* Permissions Groups */}
      <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">
          Granted Capabilities ({role?.permissionCount ?? 0})
        </h2>

        {permissionGroups.length > 0 ? (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {permissionGroups.map((group) => (
              <div
                key={group.key}
                className="p-3 rounded-xl border border-border/60 bg-surface-alt/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text">{group.title}</span>
                  <UIBadge variant="soft" color="neutral" size="xs">
                    {group.permissions.length}
                  </UIBadge>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {group.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-surface border border-border/50 text-text flex items-center gap-1"
                    >
                      <Check className="size-2.5 text-emerald-500" />
                      <span>{perm}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-xs text-text-muted">No module permissions attached.</span>
        )}
      </div>
    </div>
  );
}
