// src/features/reports/components/ReportDetailView.jsx

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Building2,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  SlidersHorizontal,
  MoreVertical,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Tag,
  FileText,
  TrendingUp,
  Percent,
  ShoppingCart,
  BarChart2,
  Eye,
  Check,
  AlertTriangle,
  RotateCcw,
  Boxes,
  Wallet,
  QrCode,
  CreditCard,
  UserCheck,
  Receipt,
  Users,
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
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalBody,
  UIModalFooter,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import useBranch from "@/features/branch/hooks/useBranch";
import pharmacyReportsService from "../services/pharmacyReportsService";
import {
  MASTER_CATEGORIES_DATA,
  resolveCategoryAndTab,
} from "../constants/reportsHubData";

const DATE_RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

const FILTER_MODE_OPTIONS = [
  { value: "all", label: "All Payment Modes" },
  { value: "Cash", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "Split", label: "Split" },
  { value: "Credit", label: "Credit" },
  { value: "Card", label: "Card / Bank" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "RECEIVED", label: "Received / Verified" },
  { value: "PAID", label: "Paid / Completed" },
  { value: "Pending", label: "Pending" },
  { value: "Cancelled", label: "Cancelled / Returned" },
];

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatShortCurrency = (val) => {
  const num = Number(val || 0);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
  return `₹${Math.round(num)}`;
};

const BATCH_SIZE = 25;

/**
 * Calculates start and end ISO strings based on calendar preset
 */
const getCalendarDateRange = (preset, customStart, customEnd) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (preset === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "yesterday") {
    start.setDate(now.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(now.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "last7days") {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "thisMonth") {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (preset === "custom" && customStart && customEnd) {
    start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
  } else {
    // Default fallback to this month
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

export const ReportDetailView = ({
  categoryKey = "sales",
  initialTabKey = "summary",
  onBackToHub,
  onTabChange,
}) => {
  const tableContainerRef = useRef(null);
  const { currentBranch } = useBranch();

  // Resolve category and tab configuration dynamically
  const resolved = useMemo(
    () => resolveCategoryAndTab(categoryKey, initialTabKey),
    [categoryKey, initialTabKey]
  );

  const [activeTabSlug, setActiveTabSlug] = useState(resolved.tabKey);
  const [selectedDateRange, setSelectedDateRange] = useState("thisMonth");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedModeFilter, setSelectedModeFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [previewRecord, setPreviewRecord] = useState(null);

  // Live API data state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [liveRows, setLiveRows] = useState([]);
  const [apiSummary, setApiSummary] = useState(null);
  const [apiChart, setApiChart] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync state if categoryKey or initialTabKey changes from route params
  useEffect(() => {
    setActiveTabSlug(resolved.tabKey);
    setSearchQuery("");
    setCurrentPage(1);
  }, [categoryKey, initialTabKey, resolved.tabKey]);

  const categoryData = resolved.categoryData;

  // Active tab configuration from static template
  const activeConfig = useMemo(() => {
    return (
      categoryData.tabs[activeTabSlug] ||
      categoryData.tabs[categoryData.items.find((i) => i.slug === activeTabSlug || i.id === activeTabSlug)?.slug] ||
      Object.values(categoryData.tabs)[0]
    );
  }, [categoryData, activeTabSlug]);

  const CategoryIcon = categoryData.icon;

  // Date boundaries for active range
  const { startDate, endDate } = useMemo(() => {
    return getCalendarDateRange(selectedDateRange, customStartDate, customEndDate);
  }, [selectedDateRange, customStartDate, customEndDate]);

  // Main data fetching function for live reports
  const fetchReportData = useCallback(
    async (pageToLoad = 1, isAppend = false) => {
      if (categoryKey !== "sales" && categoryKey !== "purchase") {
        setIsLoading(false);
        return;
      }

      if (isAppend) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const params = {
          startDate,
          endDate,
          branchId: currentBranch?._id || undefined,
          search: debouncedSearch || undefined,
          paymentMethod: selectedModeFilter !== "all" ? selectedModeFilter : undefined,
          status: selectedStatusFilter !== "all" ? selectedStatusFilter : undefined,
          page: pageToLoad,
          limit: BATCH_SIZE,
        };

        const res = await pharmacyReportsService.getReport(activeTabSlug, params, categoryKey);
        const data = res?.data?.data || res?.data || {};

        if (isAppend) {
          setLiveRows((prev) => [...prev, ...(data.rows || [])]);
        } else {
          setLiveRows(data.rows || []);
          setApiSummary(data.summary || null);
          setApiChart(data.chart || null);
        }

        const totalCount = Number(data.total || 0);
        setTotalRecords(totalCount);

        const currentLoaded = isAppend
          ? liveRows.length + (data.rows || []).length
          : (data.rows || []).length;
        setHasMore(currentLoaded < totalCount);
      } catch (err) {
        console.error("Failed to load report data:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      categoryKey,
      activeTabSlug,
      startDate,
      endDate,
      currentBranch?._id,
      debouncedSearch,
      selectedModeFilter,
      selectedStatusFilter,
      liveRows.length,
    ]
  );

  // Trigger fetch when tab, date range, filters, or search change
  useEffect(() => {
    setCurrentPage(1);
    fetchReportData(1, false);
  }, [
    categoryKey,
    activeTabSlug,
    startDate,
    endDate,
    currentBranch?._id,
    debouncedSearch,
    selectedModeFilter,
    selectedStatusFilter,
  ]);

  // Infinite scroll load more handler
  const handleLoadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchReportData(nextPage, true);
  }, [isLoading, isLoadingMore, hasMore, currentPage, fetchReportData]);

  // Tab switch handler
  const handleSelectTab = (tabItem) => {
    setActiveTabSlug(tabItem.slug);
    setSearchQuery("");
    setCurrentPage(1);
    if (onTabChange) {
      onTabChange(tabItem.slug);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedModeFilter("all");
    setSelectedStatusFilter("all");
    setSelectedDateRange("thisMonth");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  // Compute live 4 stat cards merging API summary with config metadata
  const computedStatCards = useMemo(() => {
    const baseStats = activeConfig.stats || [];
    if (!apiSummary) return baseStats;

    return baseStats.map((st) => {
      if (!st.dataKey) return st;
      const rawVal = apiSummary[st.dataKey];
      let displayVal = "—";

      if (rawVal !== undefined && rawVal !== null) {
        if (st.isCurrency || typeof rawVal === "number" && (st.dataKey.includes("Sales") || st.dataKey.includes("Billing") || st.dataKey.includes("Revenue") || st.dataKey.includes("Spend") || st.dataKey.includes("Discounts") || st.dataKey.includes("Refund") || st.dataKey.includes("Value"))) {
          displayVal = `₹${formatCurrency(rawVal)}`;
        } else if (typeof rawVal === "number") {
          displayVal = Number(rawVal).toLocaleString("en-IN");
        } else {
          displayVal = String(rawVal);
        }
      }

      return {
        ...st,
        value: displayVal,
      };
    });
  }, [activeConfig.stats, apiSummary]);

  // Trend Chart data
  const chartConfig = useMemo(() => {
    const rawChart = apiChart || activeConfig.chart || {};
    const chartData = rawChart.data || [];
    const maxVal = Math.max(
      ...chartData.map((d) =>
        Math.max(Number(d.metric1 || d.sales || 0), Number(d.metric2 || d.profit || 0))
      ),
      100
    );

    return {
      title: rawChart.title || activeConfig.chart.title,
      metric1Label: rawChart.metric1Label || activeConfig.chart.metric1Label,
      metric2Label: rawChart.metric2Label || activeConfig.chart.metric2Label,
      metric1Color: activeConfig.chart.metric1Color || "#10b981",
      metric2Color: activeConfig.chart.metric2Color || "#0284c7",
      data: chartData,
      maxVal,
    };
  }, [apiChart, activeConfig.chart]);

  return (
    <div className="flex-1 flex flex-col gap-3.5 sm:gap-4 min-h-0 text-text font-sans">
      {/* ── 1. Upper Split Section: Left Tabs & Right Stats/Graph ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 shrink-0 items-start">
        {/* Left Side: Category Card with 5 Tabs (~310px) */}
        <div className="lg:col-span-4 xl:col-span-3.5 flex flex-col">
          <div className="bg-surface rounded-2xl border border-border/80 shadow-2xs overflow-hidden flex flex-col">
            {/* Category Header */}
            <div
              className={cn(
                "px-4 py-3 flex items-center gap-3 border-b transition-colors",
                categoryData.theme.headerBg,
                categoryData.theme.headerBorder
              )}
            >
              <div
                className={cn(
                  "size-9.5 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
                  categoryData.theme.iconBg
                )}
              >
                {categoryData.badgeText ? (
                  <span className="text-xs font-black tracking-tight font-mono">
                    {categoryData.badgeText}
                  </span>
                ) : (
                  <CategoryIcon className="size-5 stroke-[2]" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-text leading-tight truncate">
                  {categoryData.title}
                </div>
                <div className="text-[11px] text-text-muted leading-tight mt-0.5 truncate">
                  {categoryData.subtitle}
                </div>
              </div>
            </div>

            {/* Category Items List (Tabs) */}
            <div className="p-2 flex flex-col gap-1">
              {categoryData.items.map((item) => {
                const ItemIcon = item.icon;
                const isActive =
                  item.slug === activeTabSlug || item.id === activeTabSlug;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer group",
                      isActive
                        ? cn("font-semibold border shadow-2xs", categoryData.theme.activeTabBg)
                        : "hover:bg-surface-hover/80 active:bg-surface-active text-text"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "size-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          isActive
                            ? categoryData.theme.activeIconBg
                            : "bg-surface-alt/70 text-text-muted group-hover:text-primary group-hover:bg-primary-soft"
                        )}
                      >
                        <ItemIcon className="size-3.5 stroke-[1.8]" />
                      </div>

                      <div className="min-w-0">
                        <div
                          className={cn(
                            "text-[13px] leading-tight truncate",
                            isActive ? "font-bold" : "font-medium text-text group-hover:text-primary"
                          )}
                        >
                          {item.title}
                        </div>
                        <div className="text-[11px] text-text-muted leading-tight mt-0.5 truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      className={cn(
                        "size-4 shrink-0 ml-2 transition-transform",
                        isActive
                          ? "opacity-90"
                          : "text-text-muted/40 group-hover:text-primary group-hover:translate-x-0.5"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: 4 Stat Cards + Trend Graph */}
        <div className="lg:col-span-8 xl:col-span-8.5 flex flex-col gap-3 sm:gap-3.5">
          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {computedStatCards.map((stat) => {
              const Icon = stat.icon || Tag;
              const valStr = String(stat.value || "");
              const valLen = valStr.length;
              const valSizeClass =
                valLen > 14
                  ? "text-[12px] sm:text-[13px]"
                  : valLen > 11
                  ? "text-[13px] sm:text-[14px]"
                  : valLen > 8
                  ? "text-sm sm:text-[15px]"
                  : "text-base sm:text-[17px]";

              return (
                <div
                  key={stat.id}
                  className="bg-surface rounded-2xl border border-border/80 p-2.5 sm:p-3 shadow-2xs flex items-center gap-2.5 transition-colors min-w-0"
                >
                  <div
                    className={cn(
                      "size-8.5 sm:size-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs",
                      stat.iconBg
                    )}
                  >
                    <Icon className="size-4 stroke-[2]" />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="text-[10.5px] sm:text-[11px] font-medium text-text-muted truncate">
                      {stat.title}
                    </div>
                    <div
                      title={valStr}
                      className={cn(
                        "font-bold text-text font-mono tabular-nums tracking-tight leading-tight mt-0.5 whitespace-nowrap",
                        valSizeClass
                      )}
                    >
                      {isLoading && !apiSummary ? (
                        <span className="inline-block w-16 h-4 bg-border/40 rounded animate-pulse" />
                      ) : (
                        stat.value
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] truncate">
                      <span className="text-text-muted font-normal truncate">
                        {stat.trendLabel || "for selected period"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trend Bar Chart Card */}
          <div className="bg-surface rounded-2xl border border-border/80 p-4 shadow-2xs flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm sm:text-base font-bold text-text truncate">
                {chartConfig.title}
              </h3>

              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                {/* Legend */}
                <div className="flex items-center gap-3 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{ backgroundColor: chartConfig.metric1Color }}
                      className="size-2.5 rounded-full"
                    />
                    <span className="text-text-muted">
                      {chartConfig.metric1Label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      style={{ backgroundColor: chartConfig.metric2Color }}
                      className="size-2.5 rounded-full"
                    />
                    <span className="text-text-muted">
                      {chartConfig.metric2Label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Bar Chart Visualization */}
            <div className="h-38 sm:h-42 w-full pt-1 flex flex-col justify-end">
              <div className="relative flex-1 flex items-end justify-between gap-1 sm:gap-1.5 px-3 sm:px-6 pb-2 border-b border-border/60">
                {/* Grid guidelines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9.5px] text-text-muted font-mono pr-2">
                  <div className="w-full flex items-center justify-between border-b border-border/30">
                    <span className="-translate-y-2">
                      {formatShortCurrency(chartConfig.maxVal)}
                    </span>
                  </div>
                  <div className="w-full flex items-center justify-between border-b border-border/30">
                    <span className="-translate-y-2">
                      {formatShortCurrency(chartConfig.maxVal * 0.66)}
                    </span>
                  </div>
                  <div className="w-full flex items-center justify-between border-b border-border/30">
                    <span className="-translate-y-2">
                      {formatShortCurrency(chartConfig.maxVal * 0.33)}
                    </span>
                  </div>
                  <div className="w-full flex items-center justify-between">
                    <span className="-translate-y-2">0</span>
                  </div>
                </div>

                {/* Dual Bars */}
                {chartConfig.data.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-text-muted italic">
                    {isLoading ? "Loading trend data..." : "No trend data recorded for selected date range"}
                  </div>
                ) : (
                  chartConfig.data.map((item, idx) => {
                    const isHovered = hoveredBarIndex === idx;
                    const val1 = Number(item.metric1 || item.sales || 0);
                    const val2 = Number(item.metric2 || item.profit || 0);

                    const m1Height = Math.min(
                      100,
                      Math.max(6, (val1 / chartConfig.maxVal) * 100)
                    );
                    const m2Height = Math.min(
                      100,
                      Math.max(6, (val2 / chartConfig.maxVal) * 100)
                    );

                    return (
                      <div
                        key={item.date || idx}
                        className="relative z-10 flex-1 flex items-end justify-center gap-0.5 sm:gap-1 h-full group cursor-pointer"
                        onMouseEnter={() => setHoveredBarIndex(idx)}
                        onMouseLeave={() => setHoveredBarIndex(null)}
                      >
                        {/* Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface text-text border border-border px-2 py-0.5 rounded-md shadow-md text-[10px] font-mono whitespace-nowrap z-20 pointer-events-none">
                            <span
                              style={{ color: chartConfig.metric1Color }}
                              className="font-bold"
                            >
                              ₹{formatCurrency(val1)}
                            </span>
                            <span className="text-text-muted mx-1">|</span>
                            <span
                              style={{ color: chartConfig.metric2Color }}
                              className="font-bold"
                            >
                              {val2.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}

                        {/* Metric 1 Bar */}
                        <div
                          style={{
                            height: `${m1Height}%`,
                            backgroundColor: chartConfig.metric1Color,
                          }}
                          className={cn(
                            "w-1 sm:w-1.5 rounded-t-xs transition-all duration-150",
                            isHovered && "brightness-110 scale-y-105"
                          )}
                        />

                        {/* Metric 2 Bar */}
                        <div
                          style={{
                            height: `${m2Height}%`,
                            backgroundColor: chartConfig.metric2Color,
                          }}
                          className={cn(
                            "w-1 sm:w-1.5 rounded-t-xs transition-all duration-150",
                            isHovered && "brightness-110 scale-y-105"
                          )}
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {/* X Axis Date Labels */}
              <div className="flex items-center justify-between px-3 sm:px-6 pt-1 text-[10px] text-text-muted font-mono overflow-hidden">
                {chartConfig.data.length > 0 ? (
                  <>
                    <span>{chartConfig.data[0]?.date}</span>
                    {chartConfig.data.length > 2 && (
                      <span>
                        {chartConfig.data[Math.floor(chartConfig.data.length / 2)]?.date}
                      </span>
                    )}
                    <span>
                      {chartConfig.data[chartConfig.data.length - 1]?.date}
                    </span>
                  </>
                ) : (
                  <span>Selected Date Range</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Lower Section: FULL WIDTH Toolbar & Data Table ─────────────────── */}
      <div className="w-full flex flex-col gap-3 shrink-0">
        {/* Full-width Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Search Bar */}
          <div className="flex-1 min-w-[260px] sm:min-w-[300px]">
            <UIInput
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeConfig.filterPlaceholder}
              startIcon={<Search className="size-4 text-text-muted" />}
              size="md"
              isClearable
              onClear={() => setSearchQuery("")}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Calendar Date Range Dropdown */}
            <div className="w-[140px]">
              <UISelect
                value={selectedDateRange}
                onChange={setSelectedDateRange}
                options={DATE_RANGE_OPTIONS}
                size="md"
              />
            </div>

            {/* Custom Date Inputs if Custom selected */}
            {selectedDateRange === "custom" && (
              <div className="flex items-center gap-1.5 bg-surface rounded-xl border border-border px-2 py-1 shadow-2xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-xs text-text border-none focus:outline-none"
                />
                <span className="text-text-muted text-xs">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-xs text-text border-none focus:outline-none"
                />
              </div>
            )}

            {/* Payment Mode Filter */}
            <div className="w-[160px]">
              <UISelect
                value={selectedModeFilter}
                onChange={setSelectedModeFilter}
                options={FILTER_MODE_OPTIONS}
                size="md"
              />
            </div>

            {/* Status Filter */}
            <div className="w-[150px]">
              <UISelect
                value={selectedStatusFilter}
                onChange={setSelectedStatusFilter}
                options={STATUS_FILTER_OPTIONS}
                size="md"
              />
            </div>

            {(searchQuery ||
              selectedModeFilter !== "all" ||
              selectedStatusFilter !== "all" ||
              selectedDateRange !== "thisMonth") && (
              <UIButton
                type="button"
                variant="ghost"
                size="md"
                onClick={handleResetFilters}
                startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
                className="h-10 px-3 text-text-muted hover:text-text shrink-0"
                title="Reset Filters"
              >
                Reset
              </UIButton>
            )}

            {/* Record Counter Badge */}
            <div className="px-2.5 py-2 rounded-xl bg-surface-alt/70 border border-border/60 text-[11px] font-mono text-text-muted select-none flex items-center gap-1.5 shadow-2xs">
              <span className="font-bold text-text">{liveRows.length}</span>
              <span className="text-text-muted/60">/</span>
              <span>{totalRecords} records</span>
            </div>
          </div>
        </div>

        {/* Full-width Data Table with Infinite Scrolling */}
        <div className="w-full bg-surface rounded-2xl border border-border/80 shadow-2xs overflow-hidden flex flex-col">
          <div
            ref={tableContainerRef}
            className="relative max-h-[520px] overflow-y-auto overflow-x-auto flex-1 min-h-0 divide-y divide-border/60"
          >
            <UITable
              stickyHeader
              containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
              className="w-full"
            >
              <UITableHeader
                sticky
                className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs"
              >
                <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
                  {(activeConfig.columns || []).map((col) => (
                    <UITableHead
                      key={col.key}
                      sticky
                      align={col.align || "left"}
                      className="whitespace-nowrap px-3.5 py-3"
                    >
                      {col.label}
                    </UITableHead>
                  ))}
                  <UITableHead sticky align="center" className="min-w-[80px]">
                    Action
                  </UITableHead>
                </UITableRow>
              </UITableHeader>

              <UITableBody className="divide-y divide-border/40 text-[12.5px]">
                {isLoading && liveRows.length === 0 ? (
                  <UITableLoading
                    columns={(activeConfig.columns?.length || 5) + 1}
                    rows={6}
                  />
                ) : liveRows.length === 0 ? (
                  <UITableEmpty
                    colSpan={(activeConfig.columns?.length || 5) + 1}
                    title="No records found in this report"
                    description="No entries matched your search query or filters for the selected date range. Try clearing filters."
                    action={
                      searchQuery ||
                      selectedModeFilter !== "all" ||
                      selectedStatusFilter !== "all" ||
                      selectedDateRange !== "thisMonth" ? (
                        <UIButton
                          variant="secondary"
                          size="sm"
                          onClick={handleResetFilters}
                        >
                          Clear Filters
                        </UIButton>
                      ) : undefined
                    }
                  />
                ) : (
                  liveRows.map((row) => (
                    <UITableRow
                      key={row.id || row._id}
                      className="hover:bg-surface-hover/70 transition-colors"
                    >
                      {(activeConfig.columns || []).map((col) => {
                        const val = row[col.key];

                        if (col.isStatus) {
                          const s = String(val || "").toLowerCase();
                          const isSuccess =
                            s === "paid" ||
                            s === "completed" ||
                            s === "confirmed" ||
                            s === "passed" ||
                            s === "verified";
                          const isInfo = s === "received";
                          const isDanger = s === "cancelled" || s === "rejected";
                          return (
                            <UITableCell
                              key={col.key}
                              align={col.align || "center"}
                            >
                              <span className="inline-flex items-center gap-1.5 text-xs text-text font-medium">
                                <span
                                  className={cn(
                                    "size-2 rounded-full",
                                    isSuccess
                                      ? "bg-[#10b981]"
                                      : isInfo
                                      ? "bg-[#0284c7]"
                                      : isDanger
                                      ? "bg-rose-500"
                                      : "bg-amber-500"
                                  )}
                                />
                                <span>{String(val || "Completed")}</span>
                              </span>
                            </UITableCell>
                          );
                        }

                        if (col.isCurrency) {
                          return (
                            <UITableCell
                              key={col.key}
                              align={col.align || "right"}
                              className={cn(
                                "font-mono tabular-nums",
                                col.highlight
                                  ? "font-bold text-text"
                                  : "text-text"
                              )}
                            >
                              ₹{formatCurrency(val)}
                            </UITableCell>
                          );
                        }

                        return (
                          <UITableCell
                            key={col.key}
                            align={col.align || "left"}
                            className={cn(
                              "whitespace-nowrap px-3.5 py-2.5",
                              col.highlight
                                ? "font-bold text-text"
                                : "text-text"
                            )}
                          >
                            {String(val ?? "—")}
                          </UITableCell>
                        );
                      })}

                      <UITableCell align="center">
                        <UIButton
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewRecord(row)}
                          className="h-7 px-2 text-xs font-semibold text-text hover:bg-surface-alt"
                        >
                          View
                        </UIButton>
                      </UITableCell>
                    </UITableRow>
                  ))
                )}
              </UITableBody>
            </UITable>

            {/* Infinite Scroll trigger */}
            {liveRows.length > 0 && (
              <UIInfiniteScroll
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isLoading={isLoadingMore}
                rootRef={tableContainerRef}
                scrollContainerRef={tableContainerRef}
                rootMargin="160px"
                endMessage={
                  !hasMore && liveRows.length > 0 ? (
                    <div className="py-3 text-center border-t border-border/40 bg-surface-alt/30 select-none">
                      <span className="font-mono text-[11px] text-text-muted">
                        ✓ All {totalRecords} report records loaded
                      </span>
                    </div>
                  ) : null
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Universal Report Record Quick Preview Modal */}
      {previewRecord && (
        <UIModal
          isOpen={Boolean(previewRecord)}
          onClose={() => setPreviewRecord(null)}
          size="md"
        >
          <UIModalHeader>
            <UIModalTitle>
              {previewRecord.invoiceNo ||
                previewRecord.returnNo ||
                previewRecord.customer ||
                previewRecord.name ||
                "Report Record Details"}
            </UIModalTitle>
          </UIModalHeader>
          <UIModalBody className="space-y-3 font-sans text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(previewRecord)
                .filter(([k]) => k !== "id" && k !== "_id" && k !== "invoiceId")
                .map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-surface-alt/50">
                    <span className="text-text-muted capitalize block text-[11px]">
                      {k.replace(/([A-Z])/g, " $1")}:
                    </span>
                    <span className="font-semibold text-text mt-0.5 block">
                      {typeof v === "number" && (k.toLowerCase().includes("amount") || k.toLowerCase().includes("price") || k.toLowerCase().includes("total") || k.toLowerCase().includes("discount") || k.toLowerCase().includes("tax") || k.toLowerCase().includes("revenue"))
                        ? `₹${formatCurrency(v)}`
                        : String(v ?? "—")}
                    </span>
                  </div>
                ))}
            </div>
          </UIModalBody>
          <UIModalFooter>
            <UIButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewRecord(null)}
            >
              Close
            </UIButton>
          </UIModalFooter>
        </UIModal>
      )}
    </div>
  );
};

export default ReportDetailView;
