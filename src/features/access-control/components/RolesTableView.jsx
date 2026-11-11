// src/features/access-control/components/RolesTableView.jsx

import {
  MoreHorizontal,
  Edit2,
  Trash2,
  Lock,
  Users,
  Shield,
  Eye,
} from "lucide-react";
import {
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  UIBadge,
  UIDropdown,
  UIDropdownTrigger,
  UIDropdownMenu,
  UIDropdownItem,
  UIDropdownDivider,
  UIIconButton,
} from "@/components/ui";
import { usePermission } from "@/hooks";
import { RoleWorkAccessBadges } from "./RoleWorkAccessFields";

const STATUS_COLOR_MAP = {
  active: "success",
  inactive: "warning",
  suspended: "error",
};

export const RolesTableView = ({
  roles = [],
  onViewRole,
  onEditRole,
  onDeleteRole,
}) => {
  const { can } = usePermission();

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto rounded-2xl">
        <UITable>
          <UITableHeader>
            <UITableRow className="bg-surface-alt/60">
              <UITableHead className="min-w-[190px]">Role</UITableHead>
              <UITableHead className="min-w-[110px]">Type</UITableHead>
              <UITableHead className="min-w-[220px]">Work Mode &amp; Level</UITableHead>
              <UITableHead className="min-w-[240px]">Description</UITableHead>
              <UITableHead className="min-w-[120px]">Permissions</UITableHead>
              <UITableHead className="min-w-[110px]">Members</UITableHead>
              <UITableHead className="min-w-[100px]">Status</UITableHead>
              <UITableHead className="w-16 text-right">Actions</UITableHead>
            </UITableRow>
          </UITableHeader>

          <UITableBody>
            {roles.map((role) => {
              const isSystem = Boolean(role.isSystem);
              const memberCount = role.membersCount || 0;
              const permissionCount =
                role.permissionCount ?? role.permissions?.length ?? 0;
              const status = role.displayStatus || "inactive";

              return (
                <UITableRow
                  key={role._id}
                  onClick={() => onViewRole?.(role)}
                  className="cursor-pointer hover:bg-surface-hover/60 transition-colors"
                >
                  {/* Role Name */}
                  <UITableCell>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                        <Shield className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-text text-[13.5px] truncate flex items-center gap-1.5">
                          {role.displayName}
                          {isSystem && (
                            <Lock className="size-3 text-text-muted" title="System Default Role" />
                          )}
                        </p>
                      </div>
                    </div>
                  </UITableCell>

                  {/* Type */}
                  <UITableCell>
                    <UIBadge
                      variant="soft"
                      color={isSystem ? "primary" : "neutral"}
                      size="sm"
                      className="whitespace-nowrap font-semibold capitalize"
                    >
                      {role.displayType || (isSystem ? "System" : "Custom")}
                    </UIBadge>
                  </UITableCell>

                  {/* Work Mode & Level */}
                  <UITableCell>
                    <RoleWorkAccessBadges
                      workAccess={role.workAccess}
                      role={role}
                      compact
                    />
                  </UITableCell>

                  {/* Description */}
                  <UITableCell>
                    <p className="text-xs text-text-muted truncate max-w-[240px]">
                      {role.displayDescription || "No description provided."}
                    </p>
                  </UITableCell>

                  {/* Permissions Count */}
                  <UITableCell>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-surface-alt border border-border">
                      {permissionCount}
                    </span>
                  </UITableCell>

                  {/* Members Count */}
                  <UITableCell>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-alt border border-border gap-1 text-text-muted">
                      <Users className="size-3 text-text-muted/80" />
                      {memberCount}
                    </span>
                  </UITableCell>

                  {/* Status */}
                  <UITableCell>
                    <UIBadge
                      variant="soft"
                      color={STATUS_COLOR_MAP[status] || "neutral"}
                      className="text-xs capitalize font-semibold"
                    >
                      {status}
                    </UIBadge>
                  </UITableCell>

                  {/* Actions */}
                  <UITableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <UIDropdown align="right" usePortal={true}>
                      <UIDropdownTrigger asChild>
                        <UIIconButton
                          variant="ghost"
                          size="sm"
                          aria-label="Row actions"
                          className="h-8 w-8 text-text-muted hover:text-text hover:bg-surface-hover"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </UIIconButton>
                      </UIDropdownTrigger>

                      <UIDropdownMenu width="w-48">
                        <UIDropdownItem
                          icon={<Eye className="size-4 text-primary" />}
                          onClick={() => onViewRole?.(role)}
                        >
                          View Details
                        </UIDropdownItem>

                        {can("role:update") && (
                          <UIDropdownItem
                            icon={<Edit2 className="size-4" />}
                            onClick={() => onEditRole?.(role)}
                            disabled={!role.canEdit}
                          >
                            Edit Permissions
                          </UIDropdownItem>
                        )}

                        {can("role:delete") && (
                          <>
                            <UIDropdownDivider />
                            <UIDropdownItem
                              icon={<Trash2 className="size-4 text-error" />}
                              onClick={() => onDeleteRole?.(role)}
                              disabled={!role.canDelete}
                              destructive
                            >
                              Delete Role
                            </UIDropdownItem>
                          </>
                        )}
                      </UIDropdownMenu>
                    </UIDropdown>
                  </UITableCell>
                </UITableRow>
              );
            })}
          </UITableBody>
        </UITable>
      </div>
    </div>
  );
};

export default RolesTableView;
