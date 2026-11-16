// src/features/company-operations/pages/desktop/CompanyOperationsHubDesktopPage.jsx

import React, { useMemo } from "react";
import {
  Building2,
  GitBranch,
  Users,
  Truck,
  Stethoscope,
  Landmark,
  ArrowLeftRight,
  FileText,
  Banknote,
  Layers,
  Boxes,
  CalendarDays,
  BookOpen,
  FileCheck2,
  BarChart3,
  Search,
  X,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const ICON_MAP = {
  Building2,
  GitBranch,
  Users,
  Truck,
  Stethoscope,
  Landmark,
  ArrowLeftRight,
  FileText,
  Banknote,
  Layers,
  Boxes,
  CalendarDays,
  BookOpen,
  FileCheck2,
  BarChart3,
};

const COLOR_STYLES = {
  emerald: {
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    accentHover: "hover:border-emerald-500/40",
  },
  blue: {
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    badgeBg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    accentHover: "hover:border-blue-500/40",
  },
  indigo: {
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    badgeBg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    accentHover: "hover:border-indigo-500/40",
  },
  purple: {
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    badgeBg: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    accentHover: "hover:border-purple-500/40",
  },
  amber: {
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    accentHover: "hover:border-amber-500/40",
  },
  rose: {
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    badgeBg: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    accentHover: "hover:border-rose-500/40",
  },
  teal: {
    iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    badgeBg: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
    accentHover: "hover:border-teal-500/40",
  },
  cyan: {
    iconBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    badgeBg: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
    accentHover: "hover:border-cyan-500/40",
  },
};

export const CompanyOperationsHubDesktopPage = ({
  workspaceName = "Workspace",
  companies = [],
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
  onNavigateCompanies,
}) => {
  const companyCount = companies?.length || 0;

  const categorizedSections = useMemo(() => {
    if (selectedCategory !== "all") {
      const cat = categories.find((c) => c.id === selectedCategory);
      return [
        {
          category: cat,
          modules: filteredModules,
        },
      ];
    }

    return categories
      .filter((cat) => cat.id !== "all")
      .map((cat) => ({
        category: cat,
        modules: filteredModules.filter((m) => m.categoryId === cat.id),
      }))
      .filter((sec) => sec.modules.length > 0);
  }, [categories, filteredModules, selectedCategory]);

  return (
    <div className="w-full min-h-full bg-bg px-2 sm:px-3 pt-0 pb-6 text-text font-sans">
      <div className="mx-auto max-w-[1440px] space-y-3.5">
        {/* ── Top Statistics / KPI Bar (4 Sleek Cards) ──────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          {/* Card 1: Companies Count */}
          <div className="p-3.5 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-muted">Registered Companies</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold tracking-tight text-text">
                  {companyCount} {companyCount === 1 ? "Company" : "Companies"}
                </span>
              </div>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                Active legal entities
              </p>
            </div>
          </div>

          {/* Card 2: Operations Modules */}
          <div className="p-3.5 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-muted">Active Operations</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold tracking-tight text-text">
                  {filteredModules.length} Modules
                </span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium flex items-center gap-1">
                Multi-company filter enabled
              </p>
            </div>
          </div>

          {/* Card 3: Banking & Treasury */}
          <div className="p-3.5 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-muted">Corporate Treasury</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold tracking-tight text-text">
                  Consolidated
                </span>
              </div>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5 font-medium flex items-center gap-1">
                Accounts & fund transfers
              </p>
            </div>
          </div>

          {/* Card 4: Accounting & Tax */}
          <div className="p-3.5 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-muted">Financial Books</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold tracking-tight text-text">
                  Synchronized
                </span>
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium flex items-center gap-1">
                Ledgers, JV & GST returns
              </p>
            </div>
          </div>
        </div>

        {/* ── Search & Filter Controls Toolbar ────────────────────────────── */}
        <div className="p-2.5 rounded-xl bg-surface border border-border shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search company modules (e.g. customers, suppliers, bank, ledger, gst)..."
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-lg bg-bg border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text rounded-md transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills & Quick Actions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategorySelect(cat.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-surface-alt/70 text-text-muted hover:text-text hover:bg-surface-alt border border-border/60"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}

            <div className="h-4 w-px bg-border/60 mx-1 shrink-0" />

            <button
              type="button"
              onClick={onNavigateCompanies}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-surface-alt/70 border border-border/60 text-text hover:bg-surface-alt hover:border-border/80 transition-colors shadow-2xs cursor-pointer shrink-0"
              title="View all companies"
            >
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>Companies ({companyCount})</span>
            </button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-lg bg-surface-alt/70 border border-border/60 text-text hover:bg-surface-alt hover:border-border/80 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 shrink-0"
              title="Refresh modules"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-text-muted ${
                  isLoading ? "animate-spin text-primary" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* ── Empty State If Search Yields Nothing ────────────────────────── */}
        {filteredModules.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-surface border border-dashed border-border/80">
            <div className="w-12 h-12 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-3 text-text-muted">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-text">No company operations found</h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
              No module matches your search query &ldquo;{searchQuery}&rdquo;. Try another keyword or clear the search filter.
            </p>
            <button
              type="button"
              onClick={onClearSearch}
              className="mt-4 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Clear Search Filter
            </button>
          </div>
        )}

        {/* ── Categorized Sections & Module Cards ─────────────────────────── */}
        {categorizedSections.map(({ category, modules }) => {
          if (!category) return null;
          const CategoryIcon = ICON_MAP[category.iconName] || Layers;

          return (
            <div key={category.id} className="space-y-3.5">
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-surface-alt flex items-center justify-center text-text-muted border border-border/50">
                    <CategoryIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-text tracking-tight">
                      {category.label}
                    </h2>
                    {category.description && (
                      <p className="text-[11px] text-text-muted">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-alt text-text-muted border border-border/60">
                  {modules.length} {modules.length === 1 ? "module" : "modules"}
                </span>
              </div>

              {/* Grid of Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {modules.map((mod) => {
                  const IconComponent = ICON_MAP[mod.iconName] || Layers;
                  const theme = COLOR_STYLES[mod.colorVariant] || COLOR_STYLES.blue;

                  return (
                    <div
                      key={mod.id}
                      onClick={() => onSelectModule(mod)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectModule(mod);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      className={`group relative flex flex-col justify-between p-4.5 rounded-xl bg-surface border border-border shadow-2xs hover:shadow-md ${theme.accentHover} hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40`}
                    >
                      {/* Top Row: Icon + Badge */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-lg border ${theme.iconBg} transition-transform group-hover:scale-105 duration-200`}
                          >
                            <IconComponent className="w-5 h-5" />
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${theme.badgeBg}`}
                            >
                              {mod.badge}
                            </span>
                            {mod.shortcut && (
                              <span className="text-[10px] text-text-muted font-mono tracking-tight opacity-75">
                                {mod.shortcut}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Subtitle */}
                        <div className="space-y-0.5">
                          <h3 className="text-sm font-semibold text-text group-hover:text-primary transition-colors flex items-center justify-between">
                            <span>{mod.title}</span>
                          </h3>
                          {mod.subtitle && (
                            <p className="text-[11px] font-medium text-text-muted/80">
                              {mod.subtitle}
                            </p>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-text-muted mt-2 line-clamp-3 leading-relaxed">
                          {mod.description}
                        </p>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-medium text-text-muted group-hover:text-primary transition-colors">
                        <span className="text-[11px]">Open Multi-Company View</span>
                        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── Bottom Operational Tip Footer ─────────────────────────────────── */}
        <div className="p-3.5 rounded-xl bg-surface-alt/60 border border-border/70 flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>
              All modules opened from this hub run in <strong>Workspace Scope</strong> with &ldquo;All Companies&rdquo; pre-selected by default.
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono text-text-muted">
            Workspace: Macro Multi-Entity View
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompanyOperationsHubDesktopPage;
