// src/features/workspace/pages/mobile/WorkspaceMembersMobilePage.jsx

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
  Clock,
  Shield,
  UserMinus,
  Users,
  Search,
  RotateCcw,
  Eye,
  Building2,
  GitBranch,
  LayoutGrid,
  List,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import {
  UIButton,
  UISearchInput,
  UISelect,
  UIPagination,
  UI_TOOLBAR_VIEWS,
  UIDropdown,
  UIDropdownTrigger,
  UIDropdownMenu,
  UIDropdownItem,
  UIDropdownDivider,
  UIEmptyState,
  UISkeleton,
  UIAlert,
  PermissionGate,
} from "@/components/ui";
import { WorkspaceMembersTableView } from "../../components";
import { cn } from "@/lib/utils";
import { RoleWorkAccessBadges } from "@/features/access-control/components";

export default function WorkspaceMembersMobilePage({
  workspace,
  members = [],
  paginatedMembers = [],
  stats = [],
  filters,
  activeFilterChips = [],
  statusOptions = [],
  roleOptions = [],
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
  const [activeDropdownMemberId, setActiveDropdownMemberId] = useState(null);

  const activeCount =
    stats.find((s) => s.id === "active")?.value ??
    members.filter((m) => m.status === "active").length;
  const inactiveCount =
    (stats.find((s) => s.id === "inactive")?.value || 0) +
    (stats.find((s) => s.id === "suspended")?.value || 0);

  // Condition to hide pagination when total records don't exceed single page
  const shouldShowPagination =
    hasFilteredMembers && filteredMembersCount > pageSize;

  return (
    <div className="w-full bg-bg text-text p-2.5 sm:p-3 pb-16 space-y-2.5 max-w-[480px] mx-auto">
      {/* Global Error Banner */}
      {error && !hasError && (
        <UIAlert
          intent="danger"
          title="Error"
          description={error}
          onClose={clearMessage}
        />
      )}

      {/* Prerequisite Alert Banners for Owner / Member Management */}
      {!hasCompanies && !isLoading && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-900 dark:text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <Building2 className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Operating Company Required</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Please create at least one company before adding or inviting team members.
          </p>
          <UIButton
            type="button"
            variant="primary"
            size="xs"
            onClick={() => navigate(ROUTES.CREATE_COMPANY)}
            className="w-full"
          >
            Create Company
          </UIButton>
        </div>
      )}

      {hasCompanies && !hasBranches && !isLoading && (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 text-cyan-900 dark:text-cyan-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <GitBranch className="size-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span>Dispensary Branch Required</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Please create at least one dispensary branch before adding staff members.
          </p>
          <UIButton
            type="button"
            variant="primary"
            size="xs"
            onClick={() => navigate(ROUTES.CREATE_BRANCH)}
            className="w-full"
          >
            Create Branch
          </UIButton>
        </div>
      )}

      {/* ── 1. Header Area with Minimal Padding ── */}
      <div className="flex flex-col gap-2 pt-0.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-text tracking-tight flex items-center gap-1.5">
              <span className="font-mono tabular-nums">{totalMembers}</span> Members
            </h1>
            <div className="flex items-center gap-3 text-xs font-semibold mt-0.5">
              <span className="inline-flex items-center gap-1 text-text">
                <span className="size-2 rounded-full bg-success ring-2 ring-success/20" />
                Active{" "}
                <strong className="font-mono tabular-nums text-text font-bold">
                  {activeCount}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1 text-text">
                <span className="size-2 rounded-full bg-error ring-2 ring-error/20" />
                Inactive{" "}
                <strong className="font-mono tabular-nums text-text font-bold">
                  {inactiveCount}
                </strong>
              </span>
            </div>
          </div>

          <PermissionGate permission="workspace-member:create">
            <UIButton
              type="button"
              variant="primary"
              size="sm"
              startIcon={<Plus className="size-3.5" />}
              onClick={handleInviteMember}
            >
              Add Member
            </UIButton>
          </PermissionGate>
        </div>

        {/* Action Toolbar */}
        <div className="grid grid-cols-3 gap-1.5">
          <UIButton
            type="button"
            variant="outline"
            size="xs"
            fullWidth
            startIcon={
              <RotateCcw
                className={`size-3 text-text-muted ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            }
            onClick={handleRefresh}
          >
            Refresh
          </UIButton>

          <UIButton
            type="button"
            variant="outline"
            size="xs"
            fullWidth
            startIcon={<Mail className="size-3 text-primary" />}
            onClick={handleViewInvitations}
          >
            Invitations
          </UIButton>

          <UIButton
            type="button"
            variant="outline"
            size="xs"
            fullWidth
            startIcon={<Download className="size-3 text-text-muted" />}
            onClick={handleExportCSV}
          >
            Export
          </UIButton>
        </div>
      </div>

      {/* ── 2. Compact Search, Filter & View Switcher Toolbar ── */}
      <div className="bg-surface border border-border/60 rounded-xl p-2.5 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <UISearchInput
              placeholder="Search members..."
              value={filters.search}
              onChange={handleSearchChange}
              onClear={() => handleSearchChange("")}
              size="sm"
            />
          </div>

          {/* Segmented View Switcher */}
          <div className="flex items-center rounded-lg border border-border bg-surface-alt/60 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange?.(UI_TOOLBAR_VIEWS.GRID)}
              aria-label="Grid view"
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === UI_TOOLBAR_VIEWS.GRID
                  ? "bg-surface text-primary shadow-xs"
                  : "text-text-muted hover:text-text"
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange?.(UI_TOOLBAR_VIEWS.LIST)}
              aria-label="List view"
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === UI_TOOLBAR_VIEWS.LIST
                  ? "bg-surface text-primary shadow-xs"
                  : "text-text-muted hover:text-text"
              )}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <UISelect
            value={filters.role}
            onChange={(val) => handleFilterChange({ role: val })}
            options={roleOptions}
            placeholder="All Roles"
            size="sm"
          />
          <UISelect
            value={filters.status}
            onChange={(val) => handleFilterChange({ status: val })}
            options={statusOptions}
            placeholder="All Status"
            size="sm"
          />
        </div>

        {activeFilterChips.length > 0 && (
          <div className="flex justify-end">
            <UIButton
              type="button"
              variant="ghost"
              size="xs"
              startIcon={<RotateCcw className="size-3 text-text-muted" />}
              onClick={handleClearFilters}
            >
              Reset Filters
            </UIButton>
          </div>
        )}
      </div>

      {/* ── 3. Member Cards / Table Stream ── */}
      {isLoading && !hasMembers ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-surface rounded-2xl p-4 flex flex-col items-center space-y-2.5 shadow-xs border border-border"
            >
              <UISkeleton className="size-16 rounded-full" />
              <UISkeleton className="h-4 w-28 rounded" />
              <UISkeleton className="h-3 w-20 rounded" />
              <div className="w-full pt-2.5 border-t border-border/30 grid grid-cols-2 gap-2">
                <UISkeleton className="h-6 rounded" />
                <UISkeleton className="h-6 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : !hasMembers ? (
        <div className="py-8 bg-surface rounded-2xl shadow-xs border border-border">
          <UIEmptyState
            icon={<Users className="size-8 text-primary" />}
            title="No workspace members yet"
            description="Start building your pharmacy team roster by adding or inviting members."
            primaryAction={
              <PermissionGate permission="workspace-member:create">
                <UIButton
                  variant="primary"
                  size="sm"
                  startIcon={<Plus className="size-3.5" />}
                  onClick={handleInviteMember}
                >
                  Add Member
                </UIButton>
              </PermissionGate>
            }
          />
        </div>
      ) : !hasFilteredMembers ? (
        <div className="py-8 bg-surface rounded-2xl shadow-xs border border-border">
          <UIEmptyState
            icon={<Search className="size-8 text-text-muted" />}
            title="No matching members"
            description="Try changing your search keywords or active filters."
            primaryAction={
              <UIButton variant="outline" size="sm" onClick={handleClearFilters}>
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
        <div className="space-y-2.5">
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

      {/* ── 4. Bottom Pagination ── */}
      {shouldShowPagination && (
        <div className="bg-surface rounded-xl shadow-xs border border-border overflow-hidden">
          <UIPagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={filteredMembersCount}
            pageSize={pageSize}
            pageSizeOptions={[6, 12, 24]}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            showSummary
            showPageSize={false}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Mobile MemberCard Component
 * - Distinct high contrast bottom card section
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

  const companyAccessLabel = isOwner
    ? "All Companies"
    : member?.accessAllCompanies
    ? "All Companies"
    : (member?.companyCount === 0 || member?.companies?.length === 0 || member?.companyIds?.length === 0)
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
    : (member?.branchCount === 0 || member?.branches?.length === 0 || member?.branchIds?.length === 0)
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
        "bg-surface rounded-2xl shadow-xs transition-all duration-150 flex flex-col relative border border-border overflow-hidden cursor-pointer active:scale-[0.99]",
        isDropdownOpen
          ? "z-50 ring-2 ring-primary/40 shadow-xl"
          : hasAnyDropdownOpen
          ? "z-0"
          : "z-10 hover:border-border-strong hover:shadow-md group"
      )}
    >
      {/* Top Section */}
      <div className="bg-surface p-3.5 pt-3 relative flex flex-col items-center text-center">
        {/* Three-Dots Menu */}
        <div
          className="absolute top-2.5 right-2.5 z-50"
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
                  "size-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer border-0",
                  isDropdownOpen
                    ? "bg-primary-soft text-primary"
                    : "text-text-muted hover:text-text hover:bg-surface-hover"
                )}
              >
                <MoreHorizontal className="size-5" />
              </button>
            </UIDropdownTrigger>
            <UIDropdownMenu width="w-48" className="shadow-2xl border border-border/60">
              <UIDropdownItem
                icon={<Eye className="size-4 text-primary" />}
                onClick={(e) => {
                  e?.stopPropagation?.();
                  onViewDetails?.();
                }}
              >
                View Details
              </UIDropdownItem>
              <UIDropdownItem
                icon={<MapPin className="size-4" />}
                onClick={(e) => {
                  e?.stopPropagation?.();
                  onManageAccess?.(member);
                }}
              >
                Manage Access
              </UIDropdownItem>
              <UIDropdownItem
                icon={<Key className="size-4" />}
                onClick={(e) => {
                  e?.stopPropagation?.();
                  onResetPassword?.(member);
                }}
                disabled={isOwner}
              >
                Reset PIN
              </UIDropdownItem>

              <UIDropdownDivider />

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
                Suspend
              </UIDropdownItem>

              <UIDropdownDivider />

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
            </UIDropdownMenu>
          </UIDropdown>
        </div>

        {/* Avatar with Status Dot */}
        <div className="relative mt-0.5">
          {member?.user?.avatar || member?.avatar ? (
            <img
              src={member?.user?.avatar || member?.avatar}
              alt={member.displayName}
              className="size-16 rounded-full object-cover border-2 border-surface shadow-xs"
            />
          ) : (
            <div className="size-16 rounded-full bg-primary-soft text-primary font-extrabold text-lg flex items-center justify-center border-2 border-surface shadow-xs select-none">
              {getInitials(member.displayName)}
            </div>
          )}

          <span
            className={`absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-surface ring-2 ${getStatusDotColor()}`}
          />
        </div>

        {/* Name & Role */}
        <div className="mt-2 space-y-0.5 max-w-full">
          <h3
            className={cn(
              "text-base font-bold text-text tracking-tight truncate px-2 transition-colors",
              !hasAnyDropdownOpen && "group-hover:text-primary"
            )}
          >
            {member.displayName}
          </h3>
          <p className="text-xs text-text-muted font-medium truncate">
            {member.displayRole || "Staff Member"}
          </p>
        </div>
      </div>

      {/* Bottom Section: Theme-Native Elevated Strip (Adapts cleanly to all color themes and dark mode) */}
      <div className="bg-surface-alt/60 border-t border-border/70 p-3 space-y-2 text-left">
        {/* Work Modes & Level Ceiling */}
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/50">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider shrink-0">
            Access
          </span>
          <RoleWorkAccessBadges
            workAccess={member?.workAccess}
            role={member?.role || member?.roleId}
            compact
          />
        </div>

        {/* 2-Column Metadata Grid: Company & Branch Tiles */}
        <div className="w-full grid grid-cols-2 gap-2 text-left">
          <div className="rounded-xl bg-surface/90 border border-border/70 p-2 shadow-2xs transition-colors">
            <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Building2 className="size-3 text-primary shrink-0" />
              Companies
            </span>
            <span className="block text-xs font-bold text-text truncate mt-0.5">
              {companyAccessLabel}
            </span>
          </div>

          <div className="rounded-xl bg-surface/90 border border-border/70 p-2 shadow-2xs transition-colors">
            <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <GitBranch className="size-3 text-primary shrink-0" />
              Branches
            </span>
            <span className="block text-xs font-bold text-text truncate mt-0.5">
              {branchAccessLabel}
            </span>
          </div>
        </div>

        {/* Contact Details List */}
        <div className="w-full space-y-1 pt-1.5 border-t border-border/60 text-left">
          <div className="flex items-center gap-2 text-xs text-text-muted hover:text-text truncate transition-colors">
            <Mail className="size-3.5 shrink-0 text-text-muted" />
            <span className="truncate font-medium">{member.displayEmail || "-"}</span>
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
