// src/features/workspace/components/WorkspaceMembersTableView.jsx

import {
  MoreHorizontal,
  Mail,
  Phone,
  Key,
  MapPin,
  UserCheck,
  Clock,
  Shield,
  UserMinus,
  Eye,
  Building2,
  GitBranch,
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
import { RoleWorkAccessBadges } from "@/features/access-control/components";

const STATUS_COLOR_MAP = {
  active: "success",
  inactive: "warning",
  suspended: "error",
};

const getInitials = (name) => {
  return String(name || "M")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
};

export const WorkspaceMembersTableView = ({
  members = [],
  onViewDetails,
  onChangeStatus,
  onRemove,
  onManageAccess,
  onResetPassword,
}) => {
  const { can } = usePermission();

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto rounded-2xl">
        <UITable>
          <UITableHeader>
            <UITableRow className="bg-surface-alt/60">
              <UITableHead className="min-w-[240px]">Member</UITableHead>
              <UITableHead className="min-w-[200px]">Role &amp; Work Access</UITableHead>
              <UITableHead className="min-w-[140px]">Company Access</UITableHead>
              <UITableHead className="min-w-[140px]">Branch Access</UITableHead>
              <UITableHead className="min-w-[140px]">Contact</UITableHead>
              <UITableHead className="min-w-[100px]">Status</UITableHead>
              <UITableHead className="w-16 text-right">Actions</UITableHead>
            </UITableRow>
          </UITableHeader>

          <UITableBody>
            {members.map((member) => {
              const name = member.displayName || member.user?.name || "Staff Member";
              const email = member.displayEmail || member.user?.email || member.email;
              const phone = member.displayPhone || member.phone;
              const roleName = member.displayRole || member.role?.name || "Staff Member";
              const isOwner = Boolean(member?.isOwner);
              const status = member?.status || "inactive";

              const companyAccessLabel = isOwner
                ? "All Companies"
                : member?.accessAllCompanies
                  ? "All Companies"
                  : member?.companyCount === 0 ||
                      member?.companies?.length === 0 ||
                      member?.companyIds?.length === 0
                    ? "No Companies"
                    : member?.companyCount !== undefined
                      ? `${member.companyCount} ${member.companyCount === 1 ? "Company" : "Companies"}`
                      : member?.companies?.length !== undefined
                        ? `${member.companies.length} ${member.companies.length === 1 ? "Company" : "Companies"}`
                        : member?.companyIds?.length !== undefined
                          ? `${member.companyIds.length} ${member.companyIds.length === 1 ? "Company" : "Companies"}`
                          : "No Companies";

              const branchAccessLabel = isOwner
                ? "All Branches"
                : member?.accessAllBranches
                  ? "All Branches"
                  : member?.branchCount === 0 ||
                      member?.branches?.length === 0 ||
                      member?.branchIds?.length === 0
                    ? "No Branches"
                    : member?.branchCount !== undefined
                      ? `${member.branchCount} ${member.branchCount === 1 ? "Branch" : "Branches"}`
                      : member?.branches?.length !== undefined
                        ? `${member.branches.length} ${member.branches.length === 1 ? "Branch" : "Branches"}`
                        : member?.branchIds?.length !== undefined
                          ? `${member.branchIds.length} ${member.branchIds.length === 1 ? "Branch" : "Branches"}`
                          : "No Branches";

              return (
                <UITableRow
                  key={member._id}
                  onClick={() => onViewDetails?.(member)}
                  className="cursor-pointer hover:bg-surface-hover/60 transition-colors"
                >
                  {/* Member Name & Avatar */}
                  <UITableCell>
                    <div className="flex items-center gap-3 min-w-0">
                      {member?.user?.avatar || member?.avatar ? (
                        <img
                          src={member?.user?.avatar || member?.avatar}
                          alt={name}
                          className="size-9 rounded-full object-cover border border-border shrink-0"
                        />
                      ) : (
                        <div className="size-9 rounded-full bg-primary-soft text-primary font-extrabold text-xs flex items-center justify-center border border-primary/20 shrink-0 select-none">
                          {getInitials(name)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="font-bold text-text text-[13.5px] truncate">
                          {name}
                        </p>
                        {email && (
                          <p className="text-xs text-text-muted truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{email}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </UITableCell>

                  {/* Role & Work Access */}
                  <UITableCell>
                    <div className="space-y-1.5">
                      <UIBadge
                        variant="soft"
                        color={isOwner ? "primary" : "neutral"}
                        size="sm"
                        icon={<Shield className="size-3.5 shrink-0" />}
                        className="whitespace-nowrap font-semibold capitalize"
                      >
                        {roleName}
                      </UIBadge>
                      <RoleWorkAccessBadges
                        workAccess={member?.workAccess}
                        role={member?.role || member?.roleId}
                        compact
                      />
                    </div>
                  </UITableCell>

                  {/* Company Access */}
                  <UITableCell>
                    <p className="text-xs font-semibold text-text truncate flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 shrink-0 text-text-muted" />
                      <span className="truncate">{companyAccessLabel}</span>
                    </p>
                  </UITableCell>

                  {/* Branch Access */}
                  <UITableCell>
                    <p className="text-xs font-semibold text-text truncate flex items-center gap-1">
                      <GitBranch className="w-3.5 h-3.5 shrink-0 text-text-muted" />
                      <span className="truncate">{branchAccessLabel}</span>
                    </p>
                  </UITableCell>

                  {/* Contact */}
                  <UITableCell>
                    <p className="text-xs font-mono tabular-nums text-text truncate flex items-center gap-1">
                      {phone ? (
                        <>
                          <Phone className="w-3 h-3 shrink-0 text-text-muted" />
                          <span>{phone}</span>
                        </>
                      ) : (
                        <span className="text-text-muted">-</span>
                      )}
                    </p>
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

                  {/* Actions (Portaled) */}
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

                      <UIDropdownMenu width="w-52">
                        <UIDropdownItem
                          icon={<Eye className="size-4 text-primary" />}
                          onClick={() => onViewDetails?.(member)}
                        >
                          View Member Details
                        </UIDropdownItem>
                        <UIDropdownItem
                          icon={<MapPin className="size-4" />}
                          onClick={() => onManageAccess?.(member)}
                        >
                          Manage Access &amp; Roles
                        </UIDropdownItem>
                        <UIDropdownItem
                          icon={<Key className="size-4" />}
                          onClick={() => onResetPassword?.(member)}
                          disabled={isOwner}
                        >
                          Reset Password / PIN
                        </UIDropdownItem>

                        {can("member-access:update") && (
                          <>
                            <UIDropdownItem
                              icon={<UserCheck className="size-4 text-success" />}
                              onClick={() => onChangeStatus?.(member, "active")}
                              disabled={isOwner || status === "active"}
                            >
                              Mark Active
                            </UIDropdownItem>
                            <UIDropdownItem
                              icon={<Clock className="size-4 text-warning" />}
                              onClick={() => onChangeStatus?.(member, "inactive")}
                              disabled={isOwner || status === "inactive"}
                            >
                              Mark Inactive
                            </UIDropdownItem>
                            <UIDropdownItem
                              icon={<Shield className="size-4 text-error" />}
                              onClick={() => onChangeStatus?.(member, "suspended")}
                              disabled={isOwner || status === "suspended"}
                            >
                              Suspend Member
                            </UIDropdownItem>
                            <UIDropdownDivider />
                          </>
                        )}

                        {can("workspace-member:delete") && (
                          <UIDropdownItem
                            icon={<UserMinus className="size-4 text-error" />}
                            onClick={() => onRemove?.(member)}
                            disabled={isOwner}
                            destructive
                          >
                            Remove Member
                          </UIDropdownItem>
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

export default WorkspaceMembersTableView;
