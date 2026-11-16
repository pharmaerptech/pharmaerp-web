// src/features/finance/reports/pages/desktop/ReportsDesktopPage.jsx

import React, { useState, useMemo } from "react";
import {
  FileText,
  TrendingUp,
  CalendarDays,
  Clock,
  BookOpen,
  Layers,
  Users,
  Truck,
  Wallet,
  Landmark,
  FileCheck2,
  Search,
  X,
  ArrowRight,
  Download,
  Settings,
  Scale,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

// Lucide icon map for dynamic category & module rendering
const ICON_MAP = {
  Scale,
  BookOpen,
  TrendingUp,
  Layers,
  Users,
  Truck,
  Wallet,
  Landmark,
  FileCheck2,
  FileText,
  CalendarDays,
  Clock,
};

// Color theme styles matching Company and Branch Operations Hubs
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

// Financial report categories
const REPORT_CATEGORIES = [
  {
    id: "all",
    label: "All Statements",
    iconName: "Layers",
  },
  {
    id: "core",
    label: "Core Financials",
    description: "Trial balances, general ledgers, profit & loss, and balance sheets",
    iconName: "Scale",
  },
  {
    id: "ledgers",
    label: "Parties & Ledgers",
    description: "Detailed statements and party reconciliations for customers & suppliers",
    iconName: "Users",
  },
  {
    id: "treasury",
    label: "Cash & Treasury",
    description: "Cash book, bank accounts, and liquidity registers",
    iconName: "Wallet",
  },
  {
    id: "tax",
    label: "GST & Compliance",
    description: "Official GSTR-1, GSTR-2, and statutory compliance filings",
    iconName: "FileCheck2",
  },
];

// 9 Comprehensive financial report modules
const REPORT_MODULES = [
  {
    id: "trial-balance",
    key: "trial-balance",
    categoryId: "core",
    title: "Trial Balance",
    subtitle: "Debit & Credit Parity",
    desc: "Summary of all ledger accounts with debit, credit and closing balances. Total Debits = Total Credits.",
    badge: "Core Statement",
    shortcut: "Alt + T",
    colorVariant: "emerald",
    iconName: "Scale",
    isCore: true,
  },
  {
    id: "general-ledger",
    key: "general-ledger",
    categoryId: "core",
    title: "General Ledger",
    subtitle: "Complete Audit Trail",
    desc: "Comprehensive transaction history for any account within a selected date range with opening & closing balances.",
    badge: "Core Statement",
    shortcut: "Alt + G",
    colorVariant: "blue",
    iconName: "BookOpen",
    isCore: true,
  },
  {
    id: "profit-loss",
    key: "profit-loss",
    categoryId: "core",
    title: "Profit & Loss Statement",
    subtitle: "Net Income & Margin",
    desc: "Detailed summary of revenues, cost of goods sold, and operating expenses to determine Net Operating Profit.",
    badge: "Financial Health",
    shortcut: "Alt + P",
    colorVariant: "amber",
    iconName: "TrendingUp",
    isCore: true,
  },
  {
    id: "balance-sheet",
    key: "balance-sheet",
    categoryId: "core",
    title: "Balance Sheet",
    subtitle: "Assets, Liabilities & Equity",
    desc: "Statement of Assets, Liabilities, and Equity as of a specific date showing financial solvency.",
    badge: "Balance Audit",
    shortcut: "Alt + B",
    colorVariant: "purple",
    iconName: "Layers",
    isCore: true,
  },
  {
    id: "customer-ledger",
    key: "customer-ledger",
    categoryId: "ledgers",
    title: "Customer Ledger",
    subtitle: "Accounts Receivable",
    desc: "Detailed statement for any customer including sales invoices, receipts, debit notes, and running outstanding balances.",
    badge: "Receivables",
    shortcut: "Alt + C",
    colorVariant: "indigo",
    iconName: "Users",
    isCore: false,
  },
  {
    id: "supplier-ledger",
    key: "supplier-ledger",
    categoryId: "ledgers",
    title: "Supplier Ledger",
    subtitle: "Accounts Payable",
    desc: "Detailed vendor statement showing purchase bills, disbursement vouchers, credit notes, and current payable balances.",
    badge: "Payables",
    shortcut: "Alt + S",
    colorVariant: "rose",
    iconName: "Truck",
    isCore: false,
  },
  {
    id: "cash-book",
    key: "cash-book",
    categoryId: "treasury",
    title: "Cash Book",
    subtitle: "Cash Register & Till",
    desc: "All counter cash inflows and outflows. Daily and monthly cash position with running verified balance.",
    badge: "Cash Flow",
    shortcut: "Alt + K",
    colorVariant: "teal",
    iconName: "Wallet",
    isCore: false,
  },
  {
    id: "bank-book",
    key: "bank-book",
    categoryId: "treasury",
    title: "Bank Book",
    subtitle: "Bank Transactions",
    desc: "Bank accounts ledger showing deposits, withdrawals, fund transfers, cheque clearances, and bank charges.",
    badge: "Treasury",
    shortcut: "Alt + N",
    colorVariant: "cyan",
    iconName: "Landmark",
    isCore: false,
  },
  {
    id: "gst-report",
    key: "gst-report",
    categoryId: "tax",
    title: "GST Tax Reports",
    subtitle: "GSTR-1, 2 & Summary",
    desc: "Tax reports including outward supplies (GSTR-1), inward eligible ITC (GSTR-2), and aggregate tax liabilities.",
    badge: "Statutory Tax",
    shortcut: "Alt + X",
    colorVariant: "emerald",
    iconName: "FileCheck2",
    isCore: false,
  },
];

// Mock recent generated reports updated to match 2026 dates
const RECENT_REPORTS = [
  {
    id: "r1",
    name: "Trial Balance Statement",
    type: "PDF",
    date: "06 Jul 2026, 10:30 AM",
    generatedBy: "Admin User",
    reportKey: "trial-balance",
  },
  {
    id: "r2",
    name: "Profit & Loss Statement",
    type: "Excel",
    date: "06 Jul 2026, 06:15 PM",
    generatedBy: "Admin User",
    reportKey: "profit-loss",
  },
  {
    id: "r3",
    name: "Bank Book - HDFC Operating",
    type: "PDF",
    date: "05 Jul 2026, 05:45 PM",
    generatedBy: "Admin User",
    reportKey: "bank-book",
  },
  {
    id: "r4",
    name: "Customer Ledger - Apollo Pharmacy",
    type: "PDF",
    date: "05 Jul 2026, 11:20 AM",
    generatedBy: "Admin User",
    reportKey: "customer-ledger",
  },
  {
    id: "r5",
    name: "Quarterly Balance Sheet",
    type: "Excel",
    date: "04 Jul 2026, 07:10 PM",
    generatedBy: "Admin User",
    reportKey: "balance-sheet",
  },
];

// Quick actions list
const QUICK_ACTIONS = [
  {
    id: "schedule",
    title: "Schedule Automated Report",
    desc: "Automate EOD report generation and email dispatch",
    iconName: "CalendarDays",
    reportKey: "trial-balance",
  },
  {
    id: "export",
    title: "Consolidated Batch Export",
    desc: "Export books in bulk via multi-sheet Excel or ZIP",
    iconName: "Download",
    reportKey: "general-ledger",
  },
  {
    id: "templates",
    title: "Statement Formats & Presets",
    desc: "Customize columns, grouping, and decimal precision",
    iconName: "FileText",
    reportKey: "profit-loss",
  },
  {
    id: "settings",
    title: "Financial Books Settings",
    desc: "Configure account ranges, fiscal year, and closing dates",
    iconName: "Settings",
    reportKey: "trial-balance",
  },
];

export const ReportsDesktopPage = ({ handleReportChange }) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter modules based on selected category and search input
  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return REPORT_MODULES.filter((mod) => {
      // 1. Category Filter
      if (selectedCategory !== "all" && mod.categoryId !== selectedCategory) {
        return false;
      }

      // 2. Search Filter
      if (!query) {
        return true;
      }

      const matchTitle = mod.title.toLowerCase().includes(query);
      const matchSubtitle = mod.subtitle?.toLowerCase().includes(query);
      const matchDesc = mod.desc.toLowerCase().includes(query);
      const matchBadge = mod.badge.toLowerCase().includes(query);

      return matchTitle || matchSubtitle || matchDesc || matchBadge;
    });
  }, [selectedCategory, searchQuery]);

  // Group modules by category for categorized display
  const categorizedSections = useMemo(() => {
    if (selectedCategory !== "all") {
      const cat = REPORT_CATEGORIES.find((c) => c.id === selectedCategory);
      return [
        {
          category: cat,
          modules: filteredModules,
        },
      ];
    }

    return REPORT_CATEGORIES.filter((cat) => cat.id !== "all")
      .map((cat) => ({
        category: cat,
        modules: filteredModules.filter((m) => m.categoryId === cat.id),
      }))
      .filter((sec) => sec.modules.length > 0);
  }, [filteredModules, selectedCategory]);

  return (
    <div className="w-full min-h-full bg-bg px-2 sm:px-3 pt-0 pb-8 text-text font-sans">
      <div className="mx-auto max-w-[1440px] space-y-3.5">
        {/* ── Top Statistics / KPI Bar (4 Sleek Cards) ──────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          {/* Card 1: Available Reports */}
          <div className="p-3.5 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-muted">Available Statements</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold tracking-tight text-text">
                  9 Reports
                </span>
              </div>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                Official financial books
              </p>
            </div>
          </div>

          {/* Card 2: Monthly Generation */}
          <div className="p-3.5 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-muted">Generated (Month)</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold tracking-tight text-text">
                  28 Exports
                </span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium flex items-center gap-1">
                Reconciled & audited exports
              </p>
            </div>
          </div>

          {/* Card 3: Automated Schedules */}
          <div className="p-3.5 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-muted">Scheduled Reports</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold tracking-tight text-text">
                  4 Active
                </span>
              </div>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 mt-0.5 font-medium flex items-center gap-1">
                Auto-generated periodic books
              </p>
            </div>
          </div>

          {/* Card 4: Recent Generation */}
          <div className="p-3.5 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-muted">Last Generated</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-bold tracking-tight text-text">
                  2 hrs ago
                </span>
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium flex items-center gap-1">
                Trial Balance statement
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search financial reports (e.g. trial balance, general ledger, profit loss, balance sheet, gst)..."
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-lg bg-bg border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text rounded-md transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills & Quick Actions */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {REPORT_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
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
              onClick={() => handleReportChange("trial-balance")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-surface-alt/70 border border-border/60 text-text hover:bg-surface-alt hover:border-border/80 transition-colors shadow-2xs cursor-pointer shrink-0"
              title="Report Preferences"
            >
              <Settings className="w-3.5 h-3.5 text-primary" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* ── Empty State If Search Yields Nothing ────────────────────────── */}
        {filteredModules.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-surface border border-dashed border-border/80">
            <div className="w-12 h-12 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-3 text-text-muted">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-text">No reports found</h3>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
              No statement matches &ldquo;{searchQuery}&rdquo;. Try another keyword or clear the search filter.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
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
                  {modules.length} {modules.length === 1 ? "statement" : "statements"}
                </span>
              </div>

              {/* Grid of Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {modules.map((mod) => {
                  const IconComponent = ICON_MAP[mod.iconName] || FileText;
                  const theme = COLOR_STYLES[mod.colorVariant] || COLOR_STYLES.blue;

                  return (
                    <div
                      key={mod.id}
                      onClick={() => handleReportChange(mod.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleReportChange(mod.key);
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
                          {mod.desc}
                        </p>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-medium text-text-muted group-hover:text-primary transition-colors">
                        <span className="text-[11px]">Generate Statement</span>
                        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── Bottom Section: Recent Statements & Quick Actions ───────────── */}
        <div className="pt-2 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          {/* Recent Reports Table */}
          <div className="rounded-xl bg-surface border border-border shadow-2xs overflow-hidden">
            <div className="p-3.5 border-b border-border/60 flex justify-between items-center bg-surface-alt/40">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-text">
                  Recent Generated Statements
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleReportChange("trial-balance")}
                className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-surface-alt/30 text-text-muted font-medium text-[11px]">
                    <th className="py-2.5 px-3.5">Statement Name</th>
                    <th className="py-2.5 px-3.5">Format</th>
                    <th className="py-2.5 px-3.5">Generated On</th>
                    <th className="py-2.5 px-3.5">Operator</th>
                    <th className="py-2.5 px-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_REPORTS.map((report) => {
                    const isPdf = report.type === "PDF";
                    const pillClass = isPdf
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";

                    return (
                      <tr
                        key={report.id}
                        onClick={() => handleReportChange(report.reportKey)}
                        className="border-b border-border/40 hover:bg-surface-alt/50 transition cursor-pointer"
                      >
                        <td className="py-2.5 px-3.5 font-medium text-text">{report.name}</td>
                        <td className="py-2.5 px-3.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${pillClass}`}>
                            {report.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-text-muted font-mono text-[11px]">{report.date}</td>
                        <td className="py-2.5 px-3.5 text-text">{report.generatedBy}</td>
                        <td className="py-2.5 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReportChange(report.reportKey);
                            }}
                            className="w-7 h-7 rounded-lg hover:bg-surface-alt border border-border/60 flex items-center justify-center text-text-muted hover:text-text mx-auto transition cursor-pointer"
                            title="Download statement"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="rounded-xl bg-surface border border-border shadow-2xs overflow-hidden">
            <div className="p-3.5 border-b border-border/60 flex items-center gap-2 bg-surface-alt/40">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-text">
                Quick Actions
              </span>
            </div>

            <div className="p-3 flex flex-col gap-2">
              {QUICK_ACTIONS.map((action) => {
                const ActionIcon = ICON_MAP[action.iconName] || FileText;

                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleReportChange(action.reportKey)}
                    className="w-full text-left p-2.5 border border-border/60 hover:bg-surface-alt/60 hover:border-border rounded-xl flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                        <ActionIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-text leading-tight group-hover:text-primary transition-colors">
                          {action.title}
                        </span>
                        <span className="block text-[11px] text-text-muted truncate mt-0.5">
                          {action.desc}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Bottom Operational Tip Footer ─────────────────────────────────── */}
        <div className="p-3.5 rounded-xl bg-surface-alt/60 border border-border/70 flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>
              All reports are generated following <strong>double-entry bookkeeping</strong> principles with real-time journal & ledger syncing.
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono text-text-muted">
            Financial Statements & Tax Intelligence
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReportsDesktopPage;
