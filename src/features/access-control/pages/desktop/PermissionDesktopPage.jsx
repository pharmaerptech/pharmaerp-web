// src/features/access-control/pages/desktop/PermissionDesktopPage.jsx

import React from "react";
import {
  FileKey,
  Shield,
  Search,
  RotateCcw,
  Layers,
  ArrowLeft,
  Eye,
  Plus,
  Edit2,
  Trash2,
  Download,
  CheckCircle2,
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
  Sparkles,
} from "lucide-react";

import {
  UIButton,
  UIIconButton,
  UISearchInput,
  UISelect,
  UIBadge,
  UISkeleton,
  UIEmptyState,
  UIAlert,
} from "@/components/ui";
import { cn } from "@/lib/utils";

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
    bg: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: Eye,
    label: "Read",
  },
  create: {
    bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: Plus,
    label: "Create",
  },
  manage: {
    bg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: Edit2,
    label: "Update",
  },
  delete: {
    bg: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    icon: Trash2,
    label: "Delete",
  },
  export: {
    bg: "bg-purple-500/10 text-purple-600 border-purple-500/20",
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
  permissionModules = [],
  allModules = [],
  stats = [],

  filters,
  moduleOptions = [],

  isLoading = false,
  hasError = false,
  error = null,
  message = null,

  totalPermissionsCount = 0,
  filteredModulesCount = 0,
  hasPermissions = false,

  handleFilterChange,
  handleSearchChange,
  handleClearFilters,

  handleRefresh,
  handleViewRoles,
  handleBackToAccessControl,

  clearMessage,
}) {
  return (
    <div className="min-h-screen bg-bg text-text p-3 sm:p-4 lg:p-5 max-w-[1440px] mx-auto space-y-4">
      {/* Feedback Toast */}
      {message && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
          <UIAlert
            intent="success"
            title={message}
            onClose={clearMessage}
            className="shadow-lg"
          />
        </div>
      )}

      {/* 1. Header Banner Card */}
      <div className="bg-surface rounded-2xl p-5 sm:p-6 border border-border/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UIIconButton
            variant="outline"
            size="sm"
            onClick={handleBackToAccessControl}
            aria-label="Back to access control"
          >
            <ArrowLeft className="size-4" />
          </UIIconButton>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shrink-0">
                <FileKey className="size-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
                Permission Catalog
              </h1>
              <UIBadge variant="soft" color="purple" size="sm">
                {totalPermissionsCount} System Capabilities
              </UIBadge>
            </div>
            <p className="text-xs sm:text-sm text-text-muted">
              Live authorization capability matrix supported by the ERP backend engine.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <UIButton
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            startIcon={<RotateCcw className={cn("size-3.5", isLoading && "animate-spin")} />}
          >
            Refresh
          </UIButton>

          <UIButton
            variant="primary"
            size="sm"
            onClick={handleViewRoles}
            startIcon={<Shield className="size-3.5" />}
          >
            Manage Roles
          </UIButton>
        </div>
      </div>

      {/* 2. Stat Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-1"
          >
            <div className="text-xs font-semibold text-text-muted">{stat.title}</div>
            <div className="text-xl sm:text-2xl font-bold text-text font-mono">
              {stat.value}
            </div>
            <div className="text-[11px] text-text-muted">{stat.description}</div>
          </div>
        ))}
      </div>

      {/* 3. Search and Module Filter Bar */}
      <div className="bg-surface rounded-2xl p-3 sm:p-4 border border-border/60 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <UISearchInput
              placeholder="Search capability key or action (e.g. product:create)..."
              value={filters.search}
              onChange={handleSearchChange}
              onClear={() => handleSearchChange({ target: { value: "" } })}
              size="sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-44 sm:w-56">
              <UISelect
                size="sm"
                value={filters.module}
                onChange={(e) => handleFilterChange({ module: e.target.value })}
                options={moduleOptions}
              />
            </div>

            {(filters.search || filters.module !== "all") && (
              <UIButton
                variant="ghost"
                size="xs"
                onClick={handleClearFilters}
                className="text-text-muted hover:text-text"
              >
                Clear Filters
              </UIButton>
            )}
          </div>
        </div>

        {/* Quick Module Tags Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => handleFilterChange({ module: "all" })}
            className={cn(
              "px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border",
              filters.module === "all"
                ? "bg-primary text-text-inverse border-primary shadow-2xs"
                : "bg-surface-alt/40 border-border/60 text-text-muted hover:text-text hover:bg-surface"
            )}
          >
            All Modules ({allModules.length})
          </button>

          {allModules.map((mod) => {
            const isSelected = filters.module === mod.moduleKey;
            return (
              <button
                key={mod.moduleKey}
                type="button"
                onClick={() => handleFilterChange({ module: mod.moduleKey })}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5",
                  isSelected
                    ? "bg-primary text-text-inverse border-primary shadow-2xs"
                    : "bg-surface-alt/40 border-border/60 text-text-muted hover:text-text hover:bg-surface"
                )}
              >
                <span>{mod.displayModule}</span>
                <span className={cn("text-[10.5px] px-1 py-0.2 rounded font-mono", isSelected ? "bg-white/20 text-white" : "bg-surface-alt text-text-muted")}>
                  {mod.totalPermissions}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Module Capabilities Grid */}
      {isLoading && !hasPermissions ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs space-y-3">
              <UISkeleton className="h-6 w-40 rounded" />
              <div className="grid grid-cols-2 gap-2 pt-2">
                <UISkeleton className="h-14 rounded-xl" />
                <UISkeleton className="h-14 rounded-xl" />
                <UISkeleton className="h-14 rounded-xl" />
                <UISkeleton className="h-14 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredModulesCount > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {permissionModules.map((mod) => {
            const Icon = moduleIconMap[mod.moduleKey] || Layers;

            return (
              <div
                key={mod.id}
                className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs hover:border-border transition-all space-y-4"
              >
                {/* Module Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-text truncate">
                        {mod.displayModule}
                      </h2>
                      <span className="text-[10.5px] font-mono text-text-muted block">
                        scope: {mod.moduleKey}
                      </span>
                    </div>
                  </div>

                  
                  <UIBadge variant="soft" color={mod.isAccessPolicy ? "purple" : "primary"} size="xs">
                    {mod.isAccessPolicy ? "Access Policy • " : ""}{mod.totalPermissions} {mod.totalPermissions === 1 ? "Capability" : "Capabilities"}
                  </UIBadge>
                  
                  
                </div>

                {/* Permissions List Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mod.items.map((item) => {
                    const actionMeta = actionColorMap[item.actionType] || actionColorMap.other;
                    const ActionIcon = actionMeta.icon;

                    return (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl border border-border/60 bg-surface-alt/40 hover:bg-surface hover:border-border transition-all flex items-start gap-2.5 select-none"
                      >
                        <div
                          className={cn(
                            "size-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5",
                            actionMeta.bg
                          )}
                        >
                          <ActionIcon className="size-3" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold text-text block truncate">
                            {item.displayAction}
                          </span>
                          <span className="text-[10.5px] font-mono text-text-muted block truncate mt-0.5">
                            {item.value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl p-8 border border-border/60 shadow-2xs text-center space-y-3">
          <UIEmptyState
            icon={<FileKey className="size-10 text-text-muted/60" />}
            title="No Capabilities Found"
            description="No permission keys match your current filter query."
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
