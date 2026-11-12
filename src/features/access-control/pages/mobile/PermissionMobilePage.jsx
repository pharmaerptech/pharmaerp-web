// src/features/access-control/pages/mobile/PermissionMobilePage.jsx

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
} from "lucide-react";

import {
  UIButton,
  UIIconButton,
  UISearchInput,
  UISelect,
  UIBadge,
  UIEmptyState,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const actionColorMap = {
  view: { bg: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Eye },
  create: { bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Plus },
  manage: { bg: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Edit2 },
  delete: { bg: "bg-rose-500/10 text-rose-600 border-rose-500/20", icon: Trash2 },
  export: { bg: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Download },
  other: { bg: "bg-surface-alt text-text-muted border-border/50", icon: FileKey },
};

export default function PermissionMobilePage({
  permissionModules = [],
  allModules = [],
  stats = [],

  filters,
  moduleOptions = [],

  isLoading = false,
  hasError = false,

  totalPermissionsCount = 0,
  filteredModulesCount = 0,

  handleFilterChange,
  handleSearchChange,
  handleClearFilters,
  handleRefresh,
  handleBackToAccessControl,
}) {
  return (
    <div className="min-h-screen bg-bg text-text p-3 pb-24 space-y-3.5">
      {/* Header */}
      <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UIIconButton
              variant="outline"
              size="sm"
              onClick={handleBackToAccessControl}
              aria-label="Back"
            >
              <ArrowLeft className="size-4" />
            </UIIconButton>
            <div>
              <h1 className="text-base font-bold text-text">Permissions</h1>
              <span className="text-[11px] text-text-muted">
                {totalPermissionsCount} System Capabilities
              </span>
            </div>
          </div>

          <UIIconButton
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            aria-label="Refresh"
          >
            <RotateCcw className="size-3.5 text-text-muted" />
          </UIIconButton>
        </div>

        {/* Search & Filter */}
        <div className="space-y-2 pt-1 border-t border-border/40">
          <UISearchInput
            placeholder="Search capability key..."
            value={filters.search}
            onChange={handleSearchChange}
            onClear={() => handleSearchChange({ target: { value: "" } })}
            size="sm"
          />

          <UISelect
            size="sm"
            value={filters.module}
            onChange={(e) => handleFilterChange({ module: e.target.value })}
            options={moduleOptions}
          />
        </div>
      </div>

      {/* Modules List */}
      {filteredModulesCount > 0 ? (
        <div className="space-y-3">
          {permissionModules.map((mod) => (
            <div
              key={mod.id}
              className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/30">
                <span className="text-xs font-bold text-text">{mod.displayModule}</span>
                <UIBadge variant="soft" color={mod.isAccessPolicy ? "purple" : "primary"} size="xs">
                  {mod.isAccessPolicy ? `Access Policy • ${mod.totalPermissions}` : mod.totalPermissions}
                </UIBadge>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {mod.items.map((item) => {
                  const actionMeta = actionColorMap[item.actionType] || actionColorMap.other;
                  const ActionIcon = actionMeta.icon;

                  return (
                    <div
                      key={item.id}
                      className="p-2 rounded-xl border border-border/50 bg-surface-alt/40 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn("size-5 rounded border flex items-center justify-center shrink-0", actionMeta.bg)}>
                          <ActionIcon className="size-2.5" />
                        </div>
                        <span className="font-semibold text-text truncate">
                          {item.displayAction}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-text-muted shrink-0">
                        {item.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl p-6 border border-border/60 shadow-2xs text-center space-y-3">
          <UIEmptyState
            icon={<FileKey className="size-8 text-text-muted/60" />}
            title="No Permissions Found"
            description="No permission keys match your search or filter."
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
