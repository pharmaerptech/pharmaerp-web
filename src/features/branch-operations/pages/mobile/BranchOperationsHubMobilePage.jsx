// src/features/branch-operations/pages/mobile/BranchOperationsHubMobilePage.jsx

import React from "react";
import {
  Receipt,
  RotateCcw,
  FileText,
  Truck,
  ArrowLeftRight,
  Boxes,
  Layers,
  Wallet,
  QrCode,
  Smartphone,
  Banknote,
  FileUp,
  Clock,
  CalendarDays,
  Store,
  Building2,
  Search,
  X,
  ChevronRight,
  RefreshCw,
  GitBranch,
} from "lucide-react";

const ICON_MAP = {
  Receipt,
  RotateCcw,
  FileText,
  Truck,
  ArrowLeftRight,
  Boxes,
  Layers,
  Wallet,
  QrCode,
  Smartphone,
  Banknote,
  FileUp,
  Clock,
  CalendarDays,
  Store,
  Building2,
};

const COLOR_STYLES = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
};

export const BranchOperationsHubMobilePage = ({
  companyName = "Company",
  branches = [],
  categories = [],
  filteredModules = [],
  selectedCategory = "all",
  searchQuery = "",
  isLoading = false,
  onCategorySelect,
  onSearchChange,
  onClearSearch,
  onRefresh,
  onSelectModule,
  onNavigateBranches,
}) => {
  const branchCount = branches?.length || 0;

  return (
    <div className="w-full min-h-screen bg-bg px-3.5 py-4 pb-16 text-text font-sans space-y-4">
      {/* ── Mobile Top Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Store className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text leading-tight">
              Branch Operations
            </h1>
            <p className="text-[11px] text-text-muted">
              {companyName} • {branchCount} {branchCount === 1 ? "Branch" : "Branches"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-surface border border-border text-text hover:bg-surface-alt transition-colors active:scale-95 disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw
            className={`w-4 h-4 text-text-muted ${
              isLoading ? "animate-spin text-primary" : ""
            }`}
          />
        </button>
      </div>

      {/* ── Compact 2x2 Stats Summary ────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-lg bg-surface border border-border/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-text-muted font-medium">Store Network</span>
            <Store className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-lg font-bold text-text">{branchCount}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Active Branches
          </p>
        </div>

        <div className="p-3 rounded-lg bg-surface border border-border/80 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-text-muted font-medium">Operations</span>
            <Layers className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-lg font-bold text-text">{filteredModules.length}</p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
            Available Modules
          </p>
        </div>
      </div>

      {/* ── Search Bar ───────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search operations modules..."
          className="w-full pl-9 pr-8 py-2 text-xs rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={onClearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Category Chips Carousel ──────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategorySelect(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap active:scale-95 transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-surface text-text-muted border border-border/80"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Empty State ─────────────────────────────────────────────────── */}
      {filteredModules.length === 0 && (
        <div className="p-8 text-center rounded-xl bg-surface border border-dashed border-border/80">
          <Search className="w-6 h-6 text-text-muted mx-auto mb-2" />
          <p className="text-xs font-medium text-text">No modules matched &ldquo;{searchQuery}&rdquo;</p>
          <button
            type="button"
            onClick={onClearSearch}
            className="mt-3 px-3 py-1 text-xs font-medium rounded-md bg-primary text-primary-foreground"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* ── Touch Cards List ────────────────────────────────────────────── */}
      <div className="space-y-2">
        {filteredModules.map((mod) => {
          const IconComponent = ICON_MAP[mod.iconName] || Layers;
          const iconStyle = COLOR_STYLES[mod.colorVariant] || COLOR_STYLES.blue;

          return (
            <div
              key={mod.id}
              onClick={() => onSelectModule(mod)}
              className="p-3.5 rounded-xl bg-surface border border-border shadow-2xs active:bg-surface-alt/70 transition-colors flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg border ${iconStyle} shrink-0`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-text truncate">
                      {mod.title}
                    </h3>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-surface-alt text-text-muted border border-border/60">
                      {mod.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted truncate mt-0.5">
                    {mod.subtitle || mod.description}
                  </p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BranchOperationsHubMobilePage;
