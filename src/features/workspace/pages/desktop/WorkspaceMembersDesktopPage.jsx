// src/features/workspace/pages/desktop/WorkspaceMembersDesktopPage.jsx

import React, { useState } from "react";
import {
  Plus,
  Download,
  MoreHorizontal,
  Mail,
  Phone,
  Key,
  MapPin,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Shield,
  UserMinus,
  Users,
  Search,
  RotateCcw,
  Eye,
  Building2,
  GitBranch,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import {
  UIButton,
  UIPageHeader,
  UIFilterToolbar,
  UI_TOOLBAR_VIEWS,
  UISelect,
  UIPagination,
  UIDropdown,
  UIDropdownTrigger,
  UIDropdownMenu,
  UIDropdownItem,
  UIDropdownDivider,
  UIEmptyState,
  UIAlert,
  UISkeleton,
  PermissionGate,
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
  UIIconButton,
} from "@/components/ui";
import { TopBarStats } from "@/layouts/app/components/header";
import { WorkspaceMembersTableView } from "../../components";
import { usePermission } from "@/hooks";
import { cn } from "@/lib/utils";
import { RoleWorkAccessBadges } from "@/features/access-control/components";

export default function WorkspaceMembersDesktopPage({
  workspace,
  members = [],
  paginatedMembers = [],
  stats = [],
  filters,
  activeFilterChips = [],
  statusOptions = [],
  roleOptions = [],
  companyOptions = [],
  viewMode = UI_TOOLBAR_VIEWS.GRID,
  onViewModeChange,
  isLoading,
  hasError,
  error,
  message,
  totalMembers = 0,
  filteredMembersCount = 0,
  hasMembers,
  hasFilteredMembers,
  hasCompanies = true,
  hasBranches = true,
  currentPage = 1,
  pageSize = 6,
  totalPages = 1,
  handlePageChange,
  handlePageSizeChange,
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
  clearMessage,
}) {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [activeDropdownMemberId, setActiveDropdownMemberId] = useState(null);

  const activeCount =
    stats.find((s) => s.id === "active")?.value ??
    members.filter((m) => m.status === "active").length;
  const inactiveCount = stats.inactiveCount ?? 0;

  const topBarStats = [
    { label: "Total", value: totalMembers, intent: "primary" },
    { label: "Active", value: activeCount, intent: "success" },
    { label: "Inactive", value: inactiveCount, intent: "error" },
  ];

  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);

  // Condition to hide pagination when total records don't exceed single page
  const shouldShowPagination =
    hasFilteredMembers && filteredMembersCount > pageSize;

  return (
    <div className="min-h-screen bg-bg text-text p-3 sm:p-4 lg:p-0 max-w-[1440px] mx-auto space-y-2.5">
      {/* Global Error Banner */}
      {error && !hasError && (
        <UIAlert
          intent="danger"
          title="Something went wrong"
          description={error}
          onClose={clearMessage}
        />
      )}

      {/* Prerequisite Alert Banners for Owner / Member Management */}
      {!hasCompanies && !isLoading && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                <Building2 className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  Operating Company Required
                </h3>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                  Before you can add or invite team members, you must first
                  create at least one company. Staff members require assigned
                  company clearances.
                </p>
              </div>
            </div>
            <UIButton
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigate(ROUTES.CREATE_COMPANY)}
              startIcon={<Building2 className="size-3.5" />}
              className="shrink-0"
            >
              Create Company
            </UIButton>
          </div>
        </div>
      )}

      {hasCompanies && !hasBranches && !isLoading && (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-cyan-900 dark:text-cyan-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-600 dark:text-cyan-400 shrink-0">
                <GitBranch className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  Dispensary Branch Required
                </h3>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                  You have created a company, but you need at least one
                  dispensary branch before adding staff so they can be granted
                  store access.
                </p>
              </div>
            </div>
            <UIButton
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigate(ROUTES.CREATE_BRANCH)}
              startIcon={<GitBranch className="size-3.5" />}
              className="shrink-0"
            >
              Create Branch
            </UIButton>
          </div>
        </div>
      )}

      {/* ── TopBar Stats Teleport ── */}
      <TopBarStats stats={topBarStats} />

      {/* ── 2. Standard UIFilterToolbar Component with View Switcher ── */}
      <UIFilterToolbar
        searchQuery={filters.search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search member name, email or phone..."
        activeFilterChips={activeFilterChips}
        onClearFilters={handleClearFilters}
        showViewSwitcher={true}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        filters={
          <UIButton
            variant="outline"
            size="sm"
            startIcon={<Filter className="size-4" />}
            onClick={() => setIsFilterModalOpen(true)}
            className="w-10 px-0 sm:w-auto sm:px-3 justify-center"
          >
            <span className="hidden sm:inline">Filter</span>
          </UIButton>
        }
        actions={
          <div className="flex items-center gap-2 shrink-0 border-l border-border pl-2 ml-1">
            <UIIconButton
              variant="ghost"
              size="sm"
              className="text-text-muted hover:text-text h-9 w-9"
              onClick={handleRefresh}
              title="Refresh"
            >
              <RotateCcw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            </UIIconButton>

            <UIButton
              type="button"
              variant="outline"
              size="sm"
              startIcon={<Mail className="size-4 text-primary" />}
              onClick={handleViewInvitations}
            >
              Pending Invitations
            </UIButton>

            <UIButton
              type="button"
              variant="outline"
              size="sm"
              startIcon={<Download className="size-4" />}
              onClick={handleExportCSV}
            >
              Export
            </UIButton>

            <PermissionGate permission="workspace-member:create">
              <UIButton
                type="button"
                variant="primary"
                size="sm"
                startIcon={<Plus className="size-4" />}
                onClick={handleInviteMember}
              >
                Add Member
              </UIButton>
            </PermissionGate>
          </div>
        }
      />

      {/* ── Filter Modal ── */}
      <UIModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        className="overflow-visible"
      >
        <UIModalHeader>
          <UIModalTitle>Filter Members</UIModalTitle>
          <UIModalDescription>Select criteria to filter the workspace members list.</UIModalDescription>
        </UIModalHeader>
        <UIModalBody className="overflow-visible">
          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted">Role</label>
              <UISelect
                value={filters.role}
                onChange={(val) => handleFilterChange({ role: val })}
                options={roleOptions}
                placeholder="All Roles"
                size="sm"
              />
            </div>
            {companyOptions.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted">Company</label>
                <UISelect
                  value={filters.company}
                  onChange={(val) => handleFilterChange({ company: val })}
                  options={companyOptions}
                  placeholder="All Companies"
                  size="sm"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted">Status</label>
              <UISelect
                value={filters.status}
                onChange={(val) => handleFilterChange({ status: val })}
                options={statusOptions}
                placeholder="All Status"
                size="sm"
              />
            </div>
          </div>
        </UIModalBody>
        <UIModalFooter>
          <UIButton variant="ghost" onClick={() => handleClearFilters()}>
            Clear Filters
          </UIButton>
          <UIButton variant="primary" onClick={() => setIsFilterModalOpen(false)}>
            Apply Filters
          </UIButton>
        </UIModalFooter>
      </UIModal>

      {/* ── 3. Main Card Grid / Table Stream ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-surface rounded-2xl p-4 flex flex-col items-center space-y-3 shadow-xs border border-border"
            >
              <UISkeleton className="size-18 rounded-full" />
              <UISkeleton className="h-4 w-28 rounded" />
              <UISkeleton className="h-3 w-20 rounded" />
              <div className="w-full pt-3 border-t border-border/30 grid grid-cols-2 gap-3">
                <UISkeleton className="h-6 rounded" />
                <UISkeleton className="h-6 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : !hasMembers ? (
        <div className="py-10 bg-surface rounded-2xl shadow-xs border border-border">
          <UIEmptyState
            icon={<Users className="size-9 text-primary" />}
            title="No workspace members yet"
            description="Start building your pharmacy team roster by adding or inviting members."
            primaryAction={
              <PermissionGate permission="workspace-member:create">
                <UIButton
                  variant="primary"
                  size="sm"
                  startIcon={<Plus className="size-4" />}
                  onClick={handleInviteMember}
                >
                  Add Member
                </UIButton>
              </PermissionGate>
            }
          />
        </div>
      ) : !hasFilteredMembers ? (
        <div className="py-10 bg-surface rounded-2xl shadow-xs border border-border">
          <UIEmptyState
            icon={<Search className="size-9 text-text-muted" />}
            title="No matching members found"
            description="Try changing your search query, status, or role filter criteria."
            primaryAction={
              <UIButton
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
              >
                Clear Filters
              </UIButton>
            }
          />
        </div>
      ) : viewMode === UI_TOOLBAR_VIEWS.LIST ? (
        <WorkspaceMembersTableView
          members={paginatedMembers}
          onViewDetails={handleViewMemberDetails}
          onChangeStatus={handleChangeMemberStatus}
          onRemove={handleRemoveMember}
          onManageAccess={handleManageAccess}
          onResetPassword={handleOpenResetPassword}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {paginatedMembers.map((member) => {
            const isDropdownOpen = activeDropdownMemberId === member._id;
            const hasAnyDropdownOpen = activeDropdownMemberId !== null;

            return (
              <MemberCard
                key={member._id}
                member={member}
                isDropdownOpen={isDropdownOpen}
                hasAnyDropdownOpen={hasAnyDropdownOpen}
                onDropdownOpenChange={(open) => {
                  setActiveDropdownMemberId(open ? member._id : null);
                }}
                onCardClick={() => {
                  if (!hasAnyDropdownOpen) {
                    handleViewMemberDetails?.(member);
                  }
                }}
                onViewDetails={() => {
                  setActiveDropdownMemberId(null);
                  handleViewMemberDetails?.(member);
                }}
                onChangeStatus={(m, status) => {
                  setActiveDropdownMemberId(null);
                  handleChangeMemberStatus(m, status);
                }}
                onRemove={(m) => {
                  setActiveDropdownMemberId(null);
                  handleRemoveMember(m);
                }}
                onManageAccess={(m) => {
                  setActiveDropdownMemberId(null);
                  handleViewMemberDetails?.(m);
                }}
                onResetPassword={(m) => {
                  setActiveDropdownMemberId(null);
                  handleOpenResetPassword(m);
                }}
              />
            );
          })}
        </div>
      )}

      {/* ── 4. Bottom Pagination Module ── */}
      {shouldShowPagination && (
        <div className="bg-surface rounded-xl shadow-xs border border-border overflow-hidden">
          <UIPagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={filteredMembersCount}
            pageSize={pageSize}
            pageSizeOptions={[6, 12, 24, 48]}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            showSummary
            showPageSize
          />
        </div>
      )}
    </div>
  );
}

/**
 * MemberCard Component
 * - Displays Companies and Branches assigned to member
 * - Crisp borders with distinct non-blending bottom section
 * - Active dropdown stacking and hover isolation
 */
function MemberCard({
  member,
  isDropdownOpen,
  hasAnyDropdownOpen,
  onDropdownOpenChange,
  onCardClick,
  onViewDetails,
  onChangeStatus,
  onRemove,
  onManageAccess,
  onResetPassword,
}) {
  const { can } = usePermission();
  const isOwner = Boolean(member?.isOwner);
  const status = member?.status || "inactive";

  const getStatusDotColor = () => {
    switch (status) {
      case "active":
        return "bg-success ring-success/20";
      case "suspended":
        return "bg-error ring-error/20";
      default:
        return "bg-warning ring-warning/20";
    }
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

  // Company and Branch Access counts / labels
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
    <div
      onClick={onCardClick}
      className={cn(
        "bg-surface rounded-2xl shadow-xs transition-all duration-200 flex flex-col relative border border-border overflow-hidden",
        isDropdownOpen
          ? "z-50 ring-2 ring-primary/40 shadow-xl"
          : hasAnyDropdownOpen
            ? "z-0"
            : "z-10 hover:z-20 hover:border-border-strong hover:shadow-md cursor-pointer group active:scale-[0.99]",
      )}
    >
      {/* Top Section: Avatar, Name, Role */}
      <div className="bg-surface p-4 pt-3.5 relative flex flex-col items-center text-center">
        {/* Enlarged Three-Dots Context Menu (z-50) */}
        <div
          className="absolute top-3 right-3 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <UIDropdown
            open={isDropdownOpen}
            onOpenChange={onDropdownOpenChange}
            align="right"
            placement="bottom"
            usePortal={true}
          >
            <UIDropdownTrigger asChild>
              <button
                type="button"
                aria-label={`Actions for ${member.displayName}`}
                className={cn(
                  "size-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer border-0",
                  isDropdownOpen
                    ? "bg-primary-soft text-primary"
                    : "text-text-muted hover:text-text hover:bg-surface-hover",
                )}
              >
                <MoreHorizontal className="size-5" />
              </button>
            </UIDropdownTrigger>
            <UIDropdownMenu
              width="w-52"
              className="shadow-2xl border border-border/60"
            >
              <UIDropdownItem
                icon={<Eye className="size-4 text-primary" />}
                onClick={(e) => {
                  e?.stopPropagation?.();
                  onViewDetails?.();
                }}
              >
                View Member Details
              </UIDropdownItem>
              <UIDropdownItem
                icon={<MapPin className="size-4" />}
                onClick={(e) => {
                  e?.stopPropagation?.();
                  onManageAccess?.(member);
                }}
              >
                Manage Access & Roles
              </UIDropdownItem>
              <UIDropdownItem
                icon={<Key className="size-4" />}
                onClick={(e) => {
                  e?.stopPropagation?.();
                  onResetPassword?.(member);
                }}
                disabled={isOwner}
              >
                Reset Password / PIN
              </UIDropdownItem>

              {can("member-access:update") && (
                <>
                  <UIDropdownItem
                    icon={<UserCheck className="size-4 text-success" />}
                    onClick={(e) => {
                      e?.stopPropagation?.();
                      onChangeStatus?.(member, "active");
                    }}
                    disabled={isOwner || status === "active"}
                  >
                    Mark Active
                  </UIDropdownItem>
                  <UIDropdownItem
                    icon={<Clock className="size-4 text-warning" />}
                    onClick={(e) => {
                      e?.stopPropagation?.();
                      onChangeStatus?.(member, "inactive");
                    }}
                    disabled={isOwner || status === "inactive"}
                  >
                    Mark Inactive
                  </UIDropdownItem>
                  <UIDropdownItem
                    icon={<Shield className="size-4 text-error" />}
                    onClick={(e) => {
                      e?.stopPropagation?.();
                      onChangeStatus?.(member, "suspended");
                    }}
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
                  onClick={(e) => {
                    e?.stopPropagation?.();
                    onRemove?.(member);
                  }}
                  disabled={isOwner}
                  destructive
                >
                  Remove Member
                </UIDropdownItem>
              )}
            </UIDropdownMenu>
          </UIDropdown>
        </div>

        {/* Circular Avatar with Status Dot */}
        <div className="relative mt-1">
          {member?.user?.avatar || member?.avatar ? (
            <img
              src={member?.user?.avatar || member?.avatar}
              alt={member.displayName}
              className="size-18 rounded-full object-cover border-2 border-surface shadow-xs"
            />
          ) : (
            <div className="size-18 rounded-full bg-primary-soft text-primary font-extrabold text-lg flex items-center justify-center border-2 border-surface shadow-xs select-none">
              {getInitials(member.displayName)}
            </div>
          )}

          <span
            className={`absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-surface ring-2 ${getStatusDotColor()}`}
            title={`Status: ${status}`}
          />
        </div>

        {/* Member Name & Role */}
        <div className="mt-2.5 space-y-0.5 max-w-full">
          <h3
            className={cn(
              "text-base font-bold text-text tracking-tight truncate px-2 transition-colors",
              !hasAnyDropdownOpen && "group-hover:text-primary",
            )}
          >
            {member.displayName}
          </h3>
          <p className="text-xs text-text-muted font-medium truncate">
            {member.displayRole || "Staff Member"}
          </p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bg-surface border-t border-border/40 p-4 pt-3 space-y-3 text-left flex-1 flex flex-col justify-between">
        {/* Work Modes & Level Ceiling */}
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/40">
          <span className="text-[10.5px] font-bold text-text-muted uppercase tracking-wider shrink-0">
            Access Scope
          </span>
          <RoleWorkAccessBadges
            workAccess={member?.workAccess}
            role={member?.role || member?.roleId}
            compact
          />
        </div>

        {/* 2-Column Metadata Grid: Company Access & Branch Access Tiles */}
        <div className="w-full grid grid-cols-2 gap-2.5 text-left">
          <div className="rounded-xl bg-surface-alt/50 border border-border/40 p-2.5 shadow-2xs transition-colors">
            <span className="block text-[10.5px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="size-3.5 text-primary shrink-0" />
              Companies
            </span>
            <span className="block text-xs font-bold text-text truncate mt-1">
              {companyAccessLabel}
            </span>
          </div>

          <div className="rounded-xl bg-surface-alt/50 border border-border/40 p-2.5 shadow-2xs transition-colors">
            <span className="block text-[10.5px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <GitBranch className="size-3.5 text-primary shrink-0" />
              Branches
            </span>
            <span className="block text-xs font-bold text-text truncate mt-1">
              {branchAccessLabel}
            </span>
          </div>
        </div>

        {/* Contact Details List (Email & Phone) */}
        <div className="w-full space-y-1.5 pt-2 border-t border-border/60 text-left">
          <div className="flex items-center gap-2 text-xs text-text-muted hover:text-text truncate transition-colors">
            <Mail className="size-3.5 shrink-0 text-text-muted" />
            <span className="truncate font-medium">
              {member.displayEmail || "-"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-muted hover:text-text truncate transition-colors">
            <Phone className="size-3.5 shrink-0 text-text-muted" />
            <span className="font-mono tabular-nums font-medium truncate">
              {member.displayPhone || "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
