// src/features/access-control/pages/mobile/RolesMobilePage.jsx

import {
  Shield,
  Plus,
  MoreHorizontal,
  Trash2,
  Users,
  Lock,
  FileKey,
} from "lucide-react";

import {
  UIButton,
  UIIconButton,
  UISearchInput,
  UISelect,
  UIEmptyState,
  UIDropdown,
  UIDropdownTrigger,
  UIDropdownMenu,
  UIDropdownItem,
  PermissionGate,
} from "@/components/ui";
import { usePermission } from "@/hooks";
import { RoleWorkAccessBadges } from "@/features/access-control/components";

export default function RolesMobilePage({
  roles = [],
  filters = {
    search: "",
    status: "all",
    type: "all",
    workMode: "all",
    workLevel: "all",
  },
  statusOptions = [],
  typeOptions = [],
  totalRoles = 0,
  hasFilteredRoles = false,
  handleFilterChange,
  handleSearchChange,
  handleClearFilters,
  handleCreateRole,
  handleViewPermissions,
  handleViewRole,
  handleEditRole,
  handleDeleteRole,
}) {
  const { can } = usePermission();

  return (
    <div className="min-h-screen bg-bg text-text p-3 pb-24 space-y-3.5">
      {/* Header Bar */}
      <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Shield className="size-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-text">Roles & Permissions</h1>
              <span className="text-[11px] text-text-muted">
                {totalRoles} {totalRoles === 1 ? "Role" : "Roles"} Configured
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <UIButton
              variant="outline"
              size="xs"
              onClick={handleViewPermissions}
              startIcon={<FileKey className="size-3 text-primary" />}
            >
              Permissions
            </UIButton>

            <PermissionGate permission="role:create">
              <UIButton
                variant="primary"
                size="xs"
                onClick={handleCreateRole}
                startIcon={<Plus className="size-3" />}
              >
                Add
              </UIButton>
            </PermissionGate>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="space-y-2 pt-1 border-t border-border/40">
          <UISearchInput
            placeholder="Search roles, modes or levels..."
            value={filters.search}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange({ target: { value: "" } })}
            size="sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <UISelect
              size="sm"
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value })}
              options={statusOptions}
            />

            <UISelect
              size="sm"
              value={filters.type}
              onChange={(e) => handleFilterChange({ type: e.target.value })}
              options={typeOptions}
            />
          </div>
        </div>
      </div>

      {/* Role Cards List */}
      {hasFilteredRoles ? (
        <div className="space-y-3">
          {roles.map((role) => {
            const isSystem = Boolean(role.isSystem);
            const memberCount = role.membersCount || 0;
            const permissionCount =
              role.permissionCount ?? role.permissions?.length ?? 0;
            const canUpdateThisRole = can("role:update") && role.canEdit;

            return (
              <div
                key={role._id}
                className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-2.5"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-text truncate">
                        {role.displayName}
                      </h3>
                      {isSystem && <Lock className="size-3 text-text-muted shrink-0" />}
                    </div>
                    <span className="text-[11px] text-text-muted block mt-0.5">
                      Scope: {isSystem ? "Organization" : "Workspace"} • {permissionCount} Permissions
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-alt border border-border/50 text-text-muted shrink-0 flex items-center gap-1">
                    <Users className="size-2.5" />
                    <span>{memberCount}</span>
                  </span>
                </div>

                {/* Work Mode & Level Pills */}
                <RoleWorkAccessBadges
                  workAccess={role.workAccess}
                  role={role}
                  compact
                />

                {/* Description */}
                <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                  {role.displayDescription || "Role access and permission configuration."}
                </p>

                {/* Footer Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/40">
                  <UIButton
                    variant="outline"
                    size="xs"
                    onClick={() => handleViewRole(role)}
                  >
                    View Details
                  </UIButton>

                  <div className="flex items-center gap-1.5">
                    {canUpdateThisRole && (
                      <UIButton
                        variant="outline"
                        size="xs"
                        onClick={() => handleEditRole(role)}
                        className="text-primary hover:text-primary-hover hover:border-primary/40"
                      >
                        Edit
                      </UIButton>
                    )}

                    {can("role:delete") && role.canDelete && (
                      <UIDropdown>
                        <UIDropdownTrigger asChild>
                          <UIIconButton variant="ghost" size="xs" aria-label="More actions">
                            <MoreHorizontal className="size-3.5 text-text-muted" />
                          </UIIconButton>
                        </UIDropdownTrigger>
                        <UIDropdownMenu align="end" className="w-36">
                          <UIDropdownItem
                            icon={<Trash2 className="size-3.5 text-destructive" />}
                            onClick={() => handleDeleteRole(role)}
                            className="text-destructive font-medium focus:text-destructive"
                          >
                            Delete
                          </UIDropdownItem>
                        </UIDropdownMenu>
                      </UIDropdown>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Dashed Create New Role Card */}
          <PermissionGate permission="role:create">
            <div
              onClick={handleCreateRole}
              className="border-2 border-dashed border-border/80 hover:border-primary/60 bg-surface/30 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer shadow-2xs active:bg-surface"
            >
              <div className="size-9 rounded-full bg-surface-alt flex items-center justify-center text-primary">
                <Plus className="size-4" />
              </div>
              <span className="text-xs font-bold text-text">Create New Role</span>
              <span className="text-[10.5px] text-text-muted">
                Tap to configure Work Modes, level &amp; permissions
              </span>
            </div>
          </PermissionGate>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl p-6 border border-border/60 shadow-2xs text-center space-y-3">
          <UIEmptyState
            icon={<Shield className="size-8 text-text-muted/60" />}
            title="No Roles Found"
            description="No roles match your search or filter criteria."
            action={
              <UIButton variant="outline" size="sm" onClick={handleClearFilters}>
                Reset Filters
              </UIButton>
            }
          />
        </div>
      )}
    </div>
  );
}
