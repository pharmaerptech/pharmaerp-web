// src/features/access-control/pages/desktop/PermissionDesktopPage.jsx

import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  FileKey,
  Shield,
  ShieldCheck,
  Search,
  RotateCcw,
  RefreshCw,
  Layers,
  Eye,
  Plus,
  Edit2,
  Trash2,
  Download,
  Lock,
  Building2,
  GitBranch,
  Package,
  Boxes,
  ShoppingCart,
  Receipt,
  Users,
  BarChart3,
  Settings,
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
} from "@/components/ui";
import { cn } from "@/lib/utils";

const PAGE_LIMIT = 25;

const moduleIconMap = {
  workspace: Shield,
  "work-mode": Eye,
  "work-level": Layers,
  "workspace-member": Users,
  company: Building2,
  branch: GitBranch,
  role: Lock,
  product: Package,
  category: Layers,
  inventory: Boxes,
  stock: Boxes,
  purchase: ShoppingCart,
  "purchase-return": ShoppingCart,
  sale: Receipt,
  "sales-return": Receipt,
  customer: Users,
  supplier: Users,
  bill: Receipt,
  pos: Receipt,
  reports: BarChart3,
  settings: Settings,
};

const actionColorMap = {
  view: {
    bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: Eye,
    label: "Read",
  },
  create: {
    bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: Plus,
    label: "Create",
  },
  manage: {
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Edit2,
    label: "Update",
  },
  delete: {
    bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    icon: Trash2,
    label: "Delete",
  },
  export: {
    bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    icon: Download,
    label: "Export",
  },
  other: {
    bg: "bg-surface-alt text-text-muted border-border/50",
    icon: FileKey,
    label: "Action",
  },
};

export default function PermissionDesktopPage({
  permissions = [],
  allModules = [],
  stats = [],

  filters = { search: "", module: "all", actionType: "all" },
  moduleOptions = [],
  actionOptions = [],

  isLoading = false,
  totalPermissionsCount = 0,

  handleFilterChange,
  handleSearchChange,
  handleClearFilters,
  handleRefresh,
  handleViewRoles,
}) {
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
  }, [filters.search, filters.module, filters.actionType]);

  const displayedPermissions = useMemo(() => {
    return (permissions || []).slice(0, visibleCount);
  }, [permissions, visibleCount]);

  const hasMore = visibleCount < (permissions || []).length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + PAGE_LIMIT, (permissions || []).length)
      );
      setIsLoadingMore(false);
    }, 120);
  }, [isLoadingMore, hasMore, permissions]);

  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.module && filters.module !== "all") ||
      (filters.actionType && filters.actionType !== "all")
  );

  // 4 Top Stat Cards
  const statCards = useMemo(() => {
    const totalCaps = totalPermissionsCount || permissions.length;
    const viewStat = stats.find((s) => s.id === "view")?.value ?? 0;
    const manageStat = stats.find((s) => s.id === "manage")?.value ?? 0;
    const moduleCount = allModules.length;

    return [
      {
        id: "total_caps",
        title: "Total Capabilities",
        value: totalCaps,
        subtitle: "Granular system keys",
        icon: FileKey,
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
      },
      {
        id: "modules",
        title: "System Modules",
        value: moduleCount,
        subtitle: "Policy & domain modules",
        icon: Layers,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
      },
      {
        id: "view_keys",
        title: "Read / View Keys",
        value: viewStat,
        subtitle: "Auditing & inspection",
        icon: Eye,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
      },
      {
        id: "manage_keys",
        title: "Write & Admin Keys",
        value: manageStat,
        subtitle: "Create, update, delete",
        icon: ShieldCheck,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      },
    ];
  }, [allModules, permissions, stats, totalPermissionsCount]);

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden select-none">
      {/* ── 1. Top Stat Cards Grid ───────────────────────────────────────── */}
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
                <div className="min-w-0 flex-1">
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
            placeholder="Search capability, key, or module (e.g. product:create)..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange?.({ target: { value: "" } })}
            className="w-full"
          />
        </div>

        {/* Module Filter Select */}
        <div className="w-[160px] sm:w-[190px]">
          <UISelect
            value={filters.module || "all"}
            onChange={(val) => handleFilterChange?.({ module: val })}
            options={moduleOptions}
            placeholder="All Modules"
            size="md"
          />
        </div>

        {/* Action Type Select */}
        {actionOptions?.length > 0 && (
          <div className="w-[135px] sm:w-[155px]">
            <UISelect
              value={filters.actionType || "all"}
              onChange={(val) => handleFilterChange?.({ actionType: val })}
              options={actionOptions}
              placeholder="All Actions"
              size="md"
            />
          </div>
        )}

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
            title="Refresh permissions catalog"
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
            variant="primary"
            size="md"
            startIcon={<Shield className="size-4" />}
            onClick={handleViewRoles}
            className="h-10 px-3.5 text-xs font-semibold shadow-xs"
          >
            Manage Roles
          </UIButton>
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
                <UITableHead sticky className="min-w-[220px]">Capability &amp; Action</UITableHead>
                <UITableHead sticky className="min-w-[220px]">Permission Key</UITableHead>
                <UITableHead sticky className="min-w-[150px]">Module Scope</UITableHead>
                <UITableHead sticky align="center" className="min-w-[110px]">Action Type</UITableHead>
                <UITableHead sticky className="min-w-[140px]">Clearance Policy</UITableHead>
                <UITableHead sticky className="min-w-[240px]">Operational Scope</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading && displayedPermissions.length === 0 ? (
                <UITableLoading colSpan={6} rows={8} />
              ) : displayedPermissions.length === 0 ? (
                <UITableEmpty
                  colSpan={6}
                  title="No capabilities found"
                  description={
                    hasActiveFilters
                      ? "No permission keys match your active filter criteria."
                      : "No system permissions available in catalog."
                  }
                  action={
                    hasActiveFilters ? (
                      <UIButton variant="outline" size="sm" onClick={handleClearFilters}>
                        Clear Filters
                      </UIButton>
                    ) : null
                  }
                />
              ) : (
                displayedPermissions.map((perm) => {
                  const actionMeta = actionColorMap[perm.actionType] || actionColorMap.other;
                  const ActionIcon = actionMeta.icon;
                  const ModuleIcon = moduleIconMap[perm.moduleKey] || Layers;

                  return (
                    <UITableRow
                      key={perm.id}
                      className="hover:bg-surface-alt/50 transition-colors"
                    >
                      {/* Capability & Action */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              "p-1.5 rounded-lg border shrink-0",
                              actionMeta.bg
                            )}
                          >
                            <ActionIcon className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-text block truncate">
                              {perm.displayAction}
                            </span>
                            <span className="text-[10.5px] text-text-muted block truncate">
                              {perm.displayPermission}
                            </span>
                          </div>
                        </div>
                      </UITableCell>

                      {/* Permission Key */}
                      <UITableCell className="py-2.5 px-3">
                        <code className="text-xs font-mono font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md select-all">
                          {perm.value}
                        </code>
                      </UITableCell>

                      {/* Module Scope */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <ModuleIcon className="size-3.5 text-text-muted shrink-0" />
                          <span className="text-xs font-medium text-text">
                            {perm.displayModule}
                          </span>
                        </div>
                      </UITableCell>

                      {/* Action Type */}
                      <UITableCell align="center" className="py-2.5 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border",
                            actionMeta.bg
                          )}
                        >
                          <ActionIcon className="size-3" />
                          {actionMeta.label}
                        </span>
                      </UITableCell>

                      {/* Clearance Policy */}
                      <UITableCell className="py-2.5 px-3">
                        {perm.isAccessPolicy ? (
                          <UIBadge variant="soft" color="purple" size="xs">
                            Work Access Policy
                          </UIBadge>
                        ) : (
                          <UIBadge variant="soft" color="neutral" size="xs">
                            Resource Domain
                          </UIBadge>
                        )}
                      </UITableCell>

                      {/* Operational Scope */}
                      <UITableCell className="py-2.5 px-3">
                        <span className="text-xs text-text-muted line-clamp-1">
                          {perm.isAccessPolicy
                            ? perm.moduleKey === "work-mode"
                              ? "Strict explicit Work Mode policy (View & Operation modes)"
                              : "Hierarchical Work Level clearance (Workspace > Company > Branch)"
                            : `Granular access authorization for ${perm.displayModule} operations`}
                        </span>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Infinite Scroll sentinel */}
          <UIInfiniteScroll
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onLoadMore={handleLoadMore}
            scrollThreshold={0.8}
          />
        </UITableScrollArea>
      </div>
    </div>
  );
}
