// src/features/workspace/pages/desktop/WorkspaceMembersDesktopPage.jsx

import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  Users,
  UserCheck,
  UserMinus,
  Shield,
  Search,
  RotateCcw,
  RefreshCw,
  Plus,
  Mail,
  Download,
  MoreVertical,
  Eye,
  Key,
  Clock,
  Phone,
  Building2,
  GitBranch,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import {
  UIButton,
  UIInput,
  UISelect,
  UIBadge,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  UITableEmpty,
  UITableLoading,
  UIInfiniteScroll,
  UITableScrollArea,
  UIDropdown,
  UIDropdownTrigger,
  UIDropdownMenu,
  UIDropdownItem,
  UIDropdownDivider,
  PermissionGate,
} from "@/components/ui";
import { usePermission } from "@/hooks";
import { cn } from "@/lib/utils";
import { RoleWorkAccessBadges } from "@/features/access-control/components";

const PAGE_LIMIT = 20;

const getInitials = (name) => {
  return String(name || "M")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
};

export default function WorkspaceMembersDesktopPage({
  workspace,
  members = [],
  stats = [],
  filters = { search: "", status: "all", role: "all" },
  statusOptions = [],
  roleOptions = [],
  isLoading = false,
  totalMembers = 0,
  hasCompanies = true,
  hasBranches = true,
  handleFilterChange,
  handleSearchChange,
  handleClearFilters,
  handleRefresh,
  handleInviteMember,
  handleViewInvitations,
  handleViewMemberDetails,
  handleExportCSV,
  handleChangeMemberStatus,
  handleRemoveMember,
  handleManageAccess,
  handleOpenResetPassword,
}) {
  const navigate = useNavigate();
  const { can } = usePermission();
  const tableContainerRef = useRef(null);

  // Infinite Scroll state - incremental batches
  const [visibleCount, setVisibleCount] = useState(PAGE_LIMIT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Reset visible count and scroll to top on filter change
  useEffect(() => {
    setVisibleCount(PAGE_LIMIT);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [filters.search, filters.status, filters.role]);

  const displayedMembers = useMemo(() => {
    return (members || []).slice(0, visibleCount);
  }, [members, visibleCount]);

  const hasMore = visibleCount < (members || []).length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + PAGE_LIMIT, (members || []).length)
      );
      setIsLoadingMore(false);
    }, 120);
  }, [isLoadingMore, hasMore, members]);

  const activeCount = useMemo(() => {
    const fromStats = stats.find?.((s) => s.id === "active")?.value;
    if (fromStats !== undefined) return fromStats;
    return members.filter((m) => m.status === "active").length;
  }, [stats, members]);

  const inactiveCount = useMemo(() => {
    const fromStats = stats.find?.((s) => s.id === "inactive")?.value;
    if (fromStats !== undefined) return fromStats;
    return members.filter((m) => m.status !== "active").length;
  }, [stats, members]);

  const statCards = useMemo(
    () => [
      {
        id: "total",
        title: "Total Members",
        value: totalMembers || members.length,
        subtitle: "Workspace team directory",
        icon: Users,
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
      },
      {
        id: "active",
        title: "Active Staff",
        value: activeCount,
        subtitle: "Can log in & operate",
        icon: UserCheck,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      },
      {
        id: "inactive",
        title: "Inactive / Suspended",
        value: inactiveCount,
        subtitle: "Access restricted",
        icon: UserMinus,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      },
      {
        id: "roles",
        title: "Staff Roles",
        value: (roleOptions || []).filter((r) => r.value !== "all").length || "5+",
        subtitle: "Configured access roles",
        icon: Shield,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
      },
    ],
    [totalMembers, members.length, activeCount, inactiveCount, roleOptions]
  );

  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.status && filters.status !== "all") ||
      (filters.role && filters.role !== "all")
  );

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden select-none">
      {/* ── 1. Compact 4-Card Statistics Grid (Matches Sales/Customer Pages) ── */}
      <div className="shrink-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors"
              >
                <div
                  className={cn(
                    "size-9 rounded-lg flex items-center justify-center shrink-0 border",
                    stat.bg,
                    stat.border,
                    stat.color
                  )}
                >
                  <Icon className="size-4.5 stroke-[1.8]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11.5px] font-medium text-text-muted truncate">
                    {stat.title}
                  </div>
                  <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-text-muted truncate mt-0.5">
                    {stat.subtitle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Toolbar ────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {/* Search Input */}
        <div className="flex-1 min-w-[220px] sm:min-w-[260px]">
          <UIInput
            type="text"
            value={filters.search || ""}
            onChange={handleSearchChange}
            placeholder="Search member name, email or phone..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange?.({ target: { value: "" } })}
            className="w-full"
          />
        </div>

        {/* Role Select */}
        <div className="w-[140px] sm:w-[160px]">
          <UISelect
            value={filters.role || "all"}
            onChange={(val) => handleFilterChange?.("role", val)}
            options={roleOptions}
            placeholder="All Roles"
            size="md"
          />
        </div>

        {/* Status Select */}
        <div className="w-[130px] sm:w-[150px]">
          <UISelect
            value={filters.status || "all"}
            onChange={(val) => handleFilterChange?.("status", val)}
            options={statusOptions}
            placeholder="All Status"
            size="md"
          />
        </div>

        {/* Quick Reset */}
        {hasActiveFilters && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleClearFilters}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
            className="h-10 px-2.5 text-xs text-text-muted hover:text-text"
            title="Reset all filters"
          >
            Reset
          </UIButton>
        )}

        {/* Action Cluster (Right) */}
        <div className="flex items-center gap-1.5 ml-auto">
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={handleRefresh}
            className="h-10 w-10 p-0 text-text-muted hover:text-text cursor-pointer"
            title="Refresh members"
          >
            <RefreshCw
              className={cn(
                "size-4 text-text-muted hover:text-primary",
                isLoading && "animate-spin text-primary"
              )}
            />
          </UIButton>

          <UIButton
            type="button"
            variant="outline"
            size="md"
            startIcon={<Mail className="size-4 text-primary" />}
            onClick={handleViewInvitations}
            className="h-10 px-3 text-xs"
          >
            Invitations
          </UIButton>

          <UIButton
            type="button"
            variant="outline"
            size="md"
            startIcon={<Download className="size-4" />}
            onClick={handleExportCSV}
            className="h-10 px-3 text-xs"
          >
            Export
          </UIButton>

          <PermissionGate permission="workspace-member:create">
            <UIButton
              type="button"
              variant="primary"
              size="md"
              startIcon={<Plus className="size-4" />}
              onClick={handleInviteMember}
              className="h-10 px-3.5 text-xs font-semibold shadow-xs"
            >
              Add Member
            </UIButton>
          </PermissionGate>
        </div>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
        <UITableScrollArea containerRef={tableContainerRef} className="divide-y divide-border/60">
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full"
          >
            {/* Sticky Table Header */}
            <UITableHeader
              sticky
              className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs"
            >
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
                <UITableHead sticky className="min-w-[220px]">Member</UITableHead>
                <UITableHead sticky className="min-w-[200px]">Role &amp; Work Access</UITableHead>
                <UITableHead sticky className="min-w-[130px]">Company Access</UITableHead>
                <UITableHead sticky className="min-w-[130px]">Branch Access</UITableHead>
                <UITableHead sticky className="min-w-[140px]">Contact</UITableHead>
                <UITableHead sticky align="center" className="min-w-[100px]">Status</UITableHead>
                <UITableHead sticky align="right" className="min-w-[80px]">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={7} rows={8} />
              ) : displayedMembers.length === 0 ? (
                <UITableEmpty
                  colSpan={7}
                  title="No team members found"
                  description={
                    hasActiveFilters
                      ? "Try clearing filters to find team members."
                      : "Invite staff members to grant them access to companies and branches."
                  }
                />
              ) : (
                displayedMembers.map((member) => {
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
                      key={member._id || member.id}
                      onClick={() => handleViewMemberDetails?.(member)}
                      className="cursor-pointer hover:bg-surface-alt/50 transition-colors"
                    >
                      {/* Member Info */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                            {getInitials(name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-text truncate max-w-[170px]">
                              {name}
                            </div>
                            <div className="text-[11px] text-text-muted truncate max-w-[170px]">
                              {email || "—"}
                            </div>
                          </div>
                        </div>
                      </UITableCell>

                      {/* Role & Work Access Badges */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-text">
                              {roleName}
                            </span>
                            {isOwner && (
                              <UIBadge variant="soft" color="primary" className="text-[9.5px] px-1 py-0">
                                Owner
                              </UIBadge>
                            )}
                          </div>
                          <RoleWorkAccessBadges
                            workAccess={member.workAccess}
                            size="xs"
                          />
                        </div>
                      </UITableCell>

                      {/* Company Access */}
                      <UITableCell className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                          <Building2 className="size-3 text-text-muted/70 shrink-0" />
                          <span className="truncate max-w-[120px]">{companyAccessLabel}</span>
                        </span>
                      </UITableCell>

                      {/* Branch Access */}
                      <UITableCell className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                          <GitBranch className="size-3 text-text-muted/70 shrink-0" />
                          <span className="truncate max-w-[120px]">{branchAccessLabel}</span>
                        </span>
                      </UITableCell>

                      {/* Contact */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="text-xs font-mono text-text truncate max-w-[140px]">
                          {phone || email || "—"}
                        </div>
                      </UITableCell>

                      {/* Status */}
                      <UITableCell align="center" className="py-2.5 px-3">
                        <UIBadge
                          variant="soft"
                          color={
                            status === "active"
                              ? "success"
                              : status === "suspended"
                              ? "error"
                              : "warning"
                          }
                          className="capitalize text-[10.5px] font-semibold"
                        >
                          {status}
                        </UIBadge>
                      </UITableCell>

                      {/* Actions */}
                      <UITableCell align="right" className="py-2.5 px-3">
                        <div
                          className="flex items-center justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <UIDropdown>
                            <UIDropdownTrigger asChild>
                              <UIButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-text-muted hover:text-text cursor-pointer"
                              >
                                <MoreVertical className="size-3.5" />
                              </UIButton>
                            </UIDropdownTrigger>
                            <UIDropdownMenu align="end" className="w-48">
                              <UIDropdownItem
                                icon={<Eye className="size-4 text-text-muted" />}
                                onClick={() => handleViewMemberDetails?.(member)}
                              >
                                View Details
                              </UIDropdownItem>
                              {handleOpenResetPassword && (
                                <UIDropdownItem
                                  icon={<Key className="size-4 text-text-muted" />}
                                  onClick={() => handleOpenResetPassword?.(member)}
                                >
                                  Reset Password
                                </UIDropdownItem>
                              )}
                              {!isOwner && handleChangeMemberStatus && (
                                <>
                                  <UIDropdownDivider />
                                  <UIDropdownItem
                                    icon={<UserCheck className="size-4 text-text-muted" />}
                                    onClick={() =>
                                      handleChangeMemberStatus?.(
                                        member,
                                        status === "active" ? "inactive" : "active"
                                      )
                                    }
                                  >
                                    {status === "active" ? "Deactivate" : "Activate"}
                                  </UIDropdownItem>
                                </>
                              )}
                              {!isOwner && handleRemoveMember && (
                                <>
                                  <UIDropdownDivider />
                                  <UIDropdownItem
                                    variant="danger"
                                    icon={<UserMinus className="size-4 text-error" />}
                                    onClick={() => handleRemoveMember?.(member)}
                                  >
                                    Remove Member
                                  </UIDropdownItem>
                                </>
                              )}
                            </UIDropdownMenu>
                          </UIDropdown>
                        </div>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Infinite Scroll trigger */}
          {!isLoading && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                !hasMore && (members || []).length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none">
                    ✓ All {(members || []).length} team members loaded
                  </span>
                ) : null
              }
            />
          )}
        </UITableScrollArea>
      </div>
    </div>
  );
}
