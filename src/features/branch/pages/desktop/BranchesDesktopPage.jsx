// src/features/branch/pages/desktop/BranchesDesktopPage.jsx

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  GitBranch,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  MapPin,
  Edit3,
  Trash2,
  MoreVertical,
  Eye,
  Store,
  Warehouse,
  Hospital,
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
import { CompanyFilterSelect } from "@/components/shared";
import useBranch from "@/features/branch/hooks/useBranch";
import { cn } from "@/lib/utils";
import { BranchEmployeesDrawer } from "../../components";

const PAGE_LIMIT = 20;

const formatBranchTypeLabel = (type) => {
  if (!type) return "Retail Pharmacy";
  return String(type)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getBranchTypeIcon = (type) => {
  const lower = String(type || "").toLowerCase();
  if (lower.includes("hospital")) return Hospital;
  if (lower.includes("warehouse") || lower.includes("depot")) return Warehouse;
  return Store;
};

const statusBadgeVariant = (status) => {
  switch (status) {
    case "active":
      return { variant: "soft", color: "success", label: "Active" };
    case "inactive":
      return { variant: "soft", color: "neutral", label: "Inactive" };
    case "suspended":
      return { variant: "soft", color: "danger", label: "Suspended" };
    default:
      return { variant: "soft", color: "neutral", label: status || "Unknown" };
  }
};

export const BranchesDesktopPage = ({
  branches = [],
  allBranches = [],
  stats = [],

  filters = { search: "", status: "all", company: "all", type: "all" },
  statusOptions = [],
  branchTypeOptions = [],
  companyFilter,

  isLoading = false,

  handleFilterChange,
  handleSearchChange,
  handleClearFilters,
  canCreateBranch = true,
  canDeleteBranch = true,

  handleRefresh,
  handleCreateBranch,
  handleViewBranch,
  handleEditBranch,
  handleDeleteBranch,

  selectedBranchForEmployees,
  isEmployeeDrawerOpen,
  handleCloseEmployeesDrawer,
}) => {
  const tableContainerRef = useRef(null);
  const { currentBranch } = useBranch();

  // Infinite Scroll state - incremental client-side batches
  const [visibleCount, setVisibleCount] = useState(PAGE_LIMIT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Reset visible count and scroll to top on filter change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(PAGE_LIMIT);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [filters.search, filters.status, filters.company, filters.type]);

  const displayedBranches = useMemo(() => {
    return (branches || []).slice(0, visibleCount);
  }, [branches, visibleCount]);

  const hasMore = visibleCount < (branches || []).length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + PAGE_LIMIT, (branches || []).length)
      );
      setIsLoadingMore(false);
    }, 120);
  }, [isLoadingMore, hasMore, branches]);

  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.status && filters.status !== "all") ||
      (filters.type && filters.type !== "all") ||
      (filters.company && filters.company !== "all")
  );

  // 4 Top Stat Cards
  const statCards = useMemo(() => {
    const list = allBranches.length ? allBranches : branches;
    const total = list.length;
    const active = list.filter((b) => b.displayStatus === "active").length;
    const inactive = list.filter((b) => b.displayStatus === "inactive").length;
    const suspended = list.filter((b) => b.displayStatus === "suspended").length;

    return [
      {
        id: "total",
        title: "Total Branches",
        value: stats.find((s) => s.id === "total")?.value ?? total,
        subtitle: "Operating store locations",
        icon: GitBranch,
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
      },
      {
        id: "active",
        title: "Active Outlets",
        value: stats.find((s) => s.id === "active")?.value ?? active,
        subtitle: "Live dispensing counters",
        icon: CheckCircle2,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      },
      {
        id: "inactive",
        title: "Inactive Outlets",
        value: stats.find((s) => s.id === "inactive")?.value ?? inactive,
        subtitle: "Dormant or temporary off",
        icon: Clock,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      },
      {
        id: "suspended",
        title: "Suspended",
        value: stats.find((s) => s.id === "suspended")?.value ?? suspended,
        subtitle: "Regulatory audit holds",
        icon: AlertTriangle,
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
      },
    ];
  }, [allBranches, branches, stats]);

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
            onChange={(e) => handleSearchChange?.(e.target.value)}
            placeholder="Search branch by name, code, manager, city..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange?.("")}
            className="w-full"
          />
        </div>

        {/* Company Filter (Workspace Level Only - zero width at Company level) */}
        <CompanyFilterSelect
          value={companyFilter?.selectedCompanyId || "all"}
          onChange={companyFilter?.setSelectedCompanyId}
          size="md"
          className="w-[170px] sm:w-[195px]"
        />

        {/* Branch Type Select */}
        <div className="w-[150px] sm:w-[170px]">
          <UISelect
            value={filters.type || "all"}
            onChange={(val) => handleFilterChange?.({ type: val })}
            options={branchTypeOptions}
            placeholder="All Types"
            size="md"
          />
        </div>

        {/* Status Select */}
        <div className="w-[130px] sm:w-[145px]">
          <UISelect
            value={filters.status || "all"}
            onChange={(val) => handleFilterChange?.({ status: val })}
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
            title="Refresh branch records"
          >
            <RefreshCw
              className={cn(
                "size-4 text-text-muted hover:text-primary",
                isLoading && "animate-spin text-primary"
              )}
            />
          </UIButton>

          {canCreateBranch && (
            <PermissionGate permission="branch:create">
              <UIButton
                type="button"
                variant="primary"
                size="md"
                startIcon={<Plus className="size-4" />}
                onClick={handleCreateBranch}
                className="h-10 px-3.5 text-xs font-semibold shadow-xs"
              >
                Add Branch
              </UIButton>
            </PermissionGate>
          )}
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
                <UITableHead sticky className="min-w-[280px]">Branch Outlet &amp; Code</UITableHead>
                <UITableHead sticky className="min-w-[150px]">Company Scope</UITableHead>
                <UITableHead sticky className="min-w-[140px]">Branch Type</UITableHead>
                <UITableHead sticky className="min-w-[170px]">Manager / Pharmacist</UITableHead>
                <UITableHead sticky className="min-w-[210px]">Location &amp; City</UITableHead>
                <UITableHead sticky align="center" className="min-w-[90px]">Status</UITableHead>
                <UITableHead sticky align="right" className="w-14 min-w-[56px] text-right">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading && displayedBranches.length === 0 ? (
                <UITableLoading colSpan={7} rows={8} />
              ) : displayedBranches.length === 0 ? (
                <UITableEmpty
                  colSpan={7}
                  title="No branches found"
                  description={
                    hasActiveFilters
                      ? "No branch outlets match your active search or filter criteria."
                      : "Register physical dispensing stores, hospital counters, or warehouse locations."
                  }
                  action={
                    hasActiveFilters ? (
                      <UIButton variant="outline" size="sm" onClick={handleClearFilters}>
                        Clear Filters
                      </UIButton>
                    ) : canCreateBranch ? (
                      <PermissionGate permission="branch:create">
                        <UIButton
                          variant="primary"
                          size="sm"
                          onClick={handleCreateBranch}
                          startIcon={<Plus className="size-4" />}
                        >
                          Register First Branch
                        </UIButton>
                      </PermissionGate>
                    ) : null
                  }
                />
              ) : (
                displayedBranches.map((branch) => {
                  const isCurrent = currentBranch?._id === branch._id;
                  const name = branch.displayName || branch.name || "Untitled Branch";
                  const code = branch.displayCode || branch.branchCode || "N/A";
                  const typeLabel = formatBranchTypeLabel(branch.type);
                  const TypeIcon = getBranchTypeIcon(branch.type);
                  const companyName = branch.displayCompany || "Company";
                  const manager = branch.displayManager || "Unassigned";
                  const managerRole = branch.displayManagerRole || "Manager";
                  const location =
                    branch.locationSummary ||
                    branch.addressLine1 ||
                    [branch.address?.city, branch.address?.state].filter(Boolean).join(", ") ||
                    "Location Not Set";
                  const statusMeta = statusBadgeVariant(branch.displayStatus);

                  return (
                    <UITableRow
                      key={branch._id}
                      onClick={() => handleViewBranch?.(branch)}
                      className={cn(
                        "hover:bg-surface-alt/50 transition-colors cursor-pointer",
                        isCurrent && "bg-primary/[0.03]"
                      )}
                    >
                      {/* Branch Name & Code */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs">
                            <TypeIcon className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                onClick={() => handleViewBranch?.(branch)}
                                className="font-bold text-xs text-text hover:text-primary transition-colors cursor-pointer truncate"
                                title={name}
                              >
                                {name}
                              </span>
                              <span className="font-mono text-[10.5px] font-bold px-1.5 py-0.2 rounded bg-surface-alt border border-border text-text-muted">
                                {code}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {isCurrent ? (
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active Store
                                </span>
                              ) : (
                                <span className="text-[10.5px] text-text-muted">
                                  {branch.memberCount ? `${branch.memberCount} Staff Assigned` : "Physical Dispensing Unit"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </UITableCell>

                      {/* Company Scope */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 text-xs text-text truncate max-w-[140px]" title={companyName}>
                          <Building2 className="size-3 text-text-muted shrink-0" />
                          <span className="font-medium truncate">{companyName}</span>
                        </div>
                      </UITableCell>

                      {/* Branch Type */}
                      <UITableCell className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-alt border border-border/60 text-text">
                          <TypeIcon className="size-3 text-primary shrink-0" />
                          <span>{typeLabel}</span>
                        </span>
                      </UITableCell>

                      {/* Manager / Pharmacist */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="space-y-0.5 text-xs">
                          <span className="font-medium text-text block truncate max-w-[150px]">
                            {manager}
                          </span>
                          <span className="text-[10.5px] text-text-muted block">
                            {managerRole}
                          </span>
                        </div>
                      </UITableCell>

                      {/* Location & City */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 text-xs text-text-muted max-w-[200px] truncate" title={location}>
                          <MapPin className="size-3 text-text-muted shrink-0" />
                          <span className="truncate">{location}</span>
                        </div>
                      </UITableCell>

                      {/* Status */}
                      <UITableCell align="center" className="py-2.5 px-3">
                        <UIBadge
                          variant={statusMeta.variant}
                          color={statusMeta.color}
                          size="xs"
                        >
                          {statusMeta.label}
                        </UIBadge>
                      </UITableCell>

                      {/* Actions */}
                      <UITableCell
                        align="right"
                        className="py-2.5 px-3 w-14 min-w-[56px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end">
                          {/* Overflow Menu */}
                          <UIDropdown>
                            <UIDropdownTrigger asChild>
                              <UIButton
                                type="button"
                                variant="ghost"
                                size="xs"
                                className="size-7 p-0 text-text-muted hover:text-text cursor-pointer"
                                title="More options"
                              >
                                <MoreVertical className="size-3.5" />
                              </UIButton>
                            </UIDropdownTrigger>
                            <UIDropdownMenu align="end" className="w-44">
                              <UIDropdownItem
                                icon={<Eye className="size-4" />}
                                onClick={() => handleViewBranch?.(branch)}
                              >
                                View Branch
                              </UIDropdownItem>
                              <UIDropdownItem
                                icon={<Edit3 className="size-4" />}
                                onClick={() => handleEditBranch?.(branch)}
                              >
                                Edit Branch
                              </UIDropdownItem>
                              {canDeleteBranch && (
                                <>
                                  <UIDropdownDivider />
                                  <UIDropdownItem
                                    destructive
                                    icon={<Trash2 className="size-4" />}
                                    onClick={() => handleDeleteBranch?.(branch)}
                                  >
                                    Delete Branch
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

          {/* Infinite Scroll sentinel */}
          <UIInfiniteScroll
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onLoadMore={handleLoadMore}
            scrollThreshold={0.8}
          />
        </UITableScrollArea>
      </div>

      {/* ── Slide-over Branch Employees & Access Drawer ── */}
      <BranchEmployeesDrawer
        isOpen={isEmployeeDrawerOpen}
        onClose={handleCloseEmployeesDrawer}
        branch={selectedBranchForEmployees}
      />
    </div>
  );
};

export default BranchesDesktopPage;
