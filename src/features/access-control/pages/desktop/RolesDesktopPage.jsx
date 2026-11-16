// src/features/access-control/pages/desktop/RolesDesktopPage.jsx

import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  Shield,
  Plus,
  RotateCcw,
  RefreshCw,
  Download,
  MoreVertical,
  Edit2,
  Trash2,
  Users,
  Lock,
  Sliders,
  FileKey,
  Search,
  Eye,
} from "lucide-react";

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

export default function RolesDesktopPage({
  roles = [],
  stats = [],
  filters = {
    search: "",
    status: "all",
    type: "all",
    workMode: "all",
    workLevel: "all",
  },
  statusOptions = [],
  typeOptions = [],
  workModeOptions = [],
  workLevelOptions = [],
  isLoading = false,
  message = null,
  handleFilterChange,
  handleSearchChange,
  handleClearFilters,
  handleRefresh,
  handleCreateRole,
  handleViewPermissions,
  handleExportRoles,
  handleViewRole,
  handleEditRole,
  handleDeleteRole,
  clearMessage,
}) {
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
  }, [
    filters.search,
    filters.status,
    filters.type,
    filters.workMode,
    filters.workLevel,
  ]);

  const displayedRoles = useMemo(() => {
    return (roles || []).slice(0, visibleCount);
  }, [roles, visibleCount]);

  const hasMore = visibleCount < (roles || []).length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + PAGE_LIMIT, (roles || []).length)
      );
      setIsLoadingMore(false);
    }, 120);
  }, [isLoadingMore, hasMore, roles]);

  const totalRolesCount = roles.length;
  const customRolesCount = roles.filter((r) => !r.isSystem).length;
  const systemRolesCount = roles.filter((r) => r.isSystem).length;
  const totalAssignedMembers = roles.reduce(
    (sum, r) => sum + (r.membersCount || 0),
    0
  );

  const statCards = useMemo(
    () => [
      {
        id: "total_roles",
        title: "Total Roles",
        value: totalRolesCount,
        subtitle: "Active workspace roles",
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
        icon: Shield,
      },
      {
        id: "custom_roles",
        title: "Custom Roles",
        value: customRolesCount,
        subtitle: "Configured permissions",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        icon: Sliders,
      },
      {
        id: "system_roles",
        title: "System Defaults",
        value: systemRolesCount,
        subtitle: "Protected baseline roles",
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        icon: Lock,
      },
      {
        id: "assigned_members",
        title: "Assigned Staff",
        value: totalAssignedMembers,
        subtitle: "Members holding roles",
        color: "text-sky-600 dark:text-sky-400",
        bg: "bg-sky-500/10",
        border: "border-sky-500/20",
        icon: Users,
      },
    ],
    [totalRolesCount, customRolesCount, systemRolesCount, totalAssignedMembers]
  );

  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.status && filters.status !== "all") ||
      (filters.type && filters.type !== "all") ||
      (filters.workMode && filters.workMode !== "all") ||
      (filters.workLevel && filters.workLevel !== "all")
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
        <div className="flex-1 min-w-[200px] sm:min-w-[240px]">
          <UIInput
            type="text"
            value={filters.search || ""}
            onChange={handleSearchChange}
            placeholder="Search roles by title, mode, permissions..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange?.({ target: { value: "" } })}
            className="w-full"
          />
        </div>

        {/* Status Select */}
        <div className="w-[125px] sm:w-[140px]">
          <UISelect
            value={filters.status || "all"}
            onChange={(val) => handleFilterChange?.({ status: val })}
            options={statusOptions}
            placeholder="All Status"
            size="md"
          />
        </div>

        {/* Type Select */}
        <div className="w-[120px] sm:w-[135px]">
          <UISelect
            value={filters.type || "all"}
            onChange={(val) => handleFilterChange?.({ type: val })}
            options={typeOptions}
            placeholder="All Types"
            size="md"
          />
        </div>

        {/* Work Mode Select */}
        <div className="w-[135px] sm:w-[155px]">
          <UISelect
            value={filters.workMode || "all"}
            onChange={(val) => handleFilterChange?.({ workMode: val })}
            options={workModeOptions}
            placeholder="Work Mode"
            size="md"
          />
        </div>

        {/* Work Level Select */}
        <div className="w-[135px] sm:w-[155px]">
          <UISelect
            value={filters.workLevel || "all"}
            onChange={(val) => handleFilterChange?.({ workLevel: val })}
            options={workLevelOptions}
            placeholder="Work Level"
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
            title="Refresh roles"
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
            startIcon={<Download className="size-4" />}
            onClick={handleExportRoles}
            className="h-10 px-3 text-xs"
          >
            Export
          </UIButton>

          <UIButton
            type="button"
            variant="outline"
            size="md"
            startIcon={<FileKey className="size-4 text-primary" />}
            onClick={handleViewPermissions}
            className="h-10 px-3 text-xs"
          >
            Catalog
          </UIButton>

          <PermissionGate permission="role:create">
            <UIButton
              type="button"
              variant="primary"
              size="md"
              startIcon={<Plus className="size-4" />}
              onClick={handleCreateRole}
              className="h-10 px-3.5 text-xs font-semibold shadow-xs"
            >
              Create Role
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
                <UITableHead sticky className="min-w-[200px]">Role</UITableHead>
                <UITableHead sticky className="min-w-[100px]">Type</UITableHead>
                <UITableHead sticky className="min-w-[210px]">Work Mode &amp; Level</UITableHead>
                <UITableHead sticky className="min-w-[220px]">Description</UITableHead>
                <UITableHead sticky align="center" className="min-w-[110px]">Permissions</UITableHead>
                <UITableHead sticky align="center" className="min-w-[100px]">Members</UITableHead>
                <UITableHead sticky align="center" className="min-w-[100px]">Status</UITableHead>
                <UITableHead sticky align="right" className="min-w-[70px]">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={8} rows={8} />
              ) : displayedRoles.length === 0 ? (
                <UITableEmpty
                  colSpan={8}
                  title="No roles found"
                  description={
                    hasActiveFilters
                      ? "Try adjusting search or filters to find defined roles."
                      : "Create custom roles to configure specific permission clearances."
                  }
                />
              ) : (
                displayedRoles.map((role) => {
                  const isSystem = Boolean(role.isSystem);
                  const memberCount = role.membersCount || 0;
                  const permissionCount =
                    role.permissionCount ?? role.permissions?.length ?? 0;
                  const status = role.displayStatus || "inactive";

                  return (
                    <UITableRow
                      key={role._id}
                      onClick={() => handleViewRole?.(role)}
                      className="cursor-pointer hover:bg-surface-alt/50 transition-colors"
                    >
                      {/* Role Name */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 bg-primary/10 rounded-lg text-primary shrink-0">
                            <Shield className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-text text-xs truncate flex items-center gap-1.5">
                              {role.displayName}
                              {isSystem && (
                                <Lock
                                  className="size-3 text-text-muted shrink-0"
                                  title="System Default Role"
                                />
                              )}
                            </p>
                          </div>
                        </div>
                      </UITableCell>

                      {/* Type */}
                      <UITableCell className="py-2.5 px-3">
                        <UIBadge
                          variant="soft"
                          color={isSystem ? "primary" : "neutral"}
                          size="sm"
                          className="whitespace-nowrap font-semibold capitalize text-[10.5px]"
                        >
                          {role.displayType || (isSystem ? "System" : "Custom")}
                        </UIBadge>
                      </UITableCell>

                      {/* Work Mode & Level */}
                      <UITableCell className="py-2.5 px-3">
                        <RoleWorkAccessBadges
                          workAccess={role.workAccess}
                          size="xs"
                        />
                      </UITableCell>

                      {/* Description */}
                      <UITableCell className="py-2.5 px-3">
                        <p className="text-xs text-text-muted truncate max-w-[240px]">
                          {role.description || "—"}
                        </p>
                      </UITableCell>

                      {/* Permissions */}
                      <UITableCell align="center" className="py-2.5 px-3">
                        <span className="font-mono text-xs font-semibold text-text">
                          {permissionCount}
                        </span>
                      </UITableCell>

                      {/* Members */}
                      <UITableCell align="center" className="py-2.5 px-3">
                        <span className="font-mono text-xs font-semibold text-text">
                          {memberCount}
                        </span>
                      </UITableCell>

                      {/* Status */}
                      <UITableCell align="center" className="py-2.5 px-3">
                        <UIBadge
                          variant="soft"
                          color={status === "active" ? "success" : "neutral"}
                          size="sm"
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
                            <UIDropdownMenu align="end" className="w-44">
                              <UIDropdownItem
                                icon={<Eye className="size-4 text-text-muted" />}
                                onClick={() => handleViewRole?.(role)}
                              >
                                View Details
                              </UIDropdownItem>
                              {can("role:update") && role.canEdit && (
                                <UIDropdownItem
                                  icon={<Edit2 className="size-4 text-text-muted" />}
                                  onClick={() => handleEditRole?.(role)}
                                >
                                  Edit Role
                                </UIDropdownItem>
                              )}
                              {can("role:delete") && !isSystem && (
                                <>
                                  <UIDropdownDivider />
                                  <UIDropdownItem
                                    variant="danger"
                                    icon={<Trash2 className="size-4 text-error" />}
                                    onClick={() => handleDeleteRole?.(role)}
                                  >
                                    Delete Role
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
                !hasMore && (roles || []).length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none">
                    ✓ All {(roles || []).length} roles loaded
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
