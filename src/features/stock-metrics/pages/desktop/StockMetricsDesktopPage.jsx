// src/features/stock-metrics/pages/desktop/StockMetricsDesktopPage.jsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Search,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Boxes,
  Calendar,
  Clock,
  Check,
} from "lucide-react";

import {
  UIButton,
  UIInput,
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
import useBranch from "@/features/branch/hooks/useBranch";
import useCompany from "@/features/company/hooks/useCompany";
import useUser from "@/features/user/hooks/useUser";
import { BranchFilterSelect, BranchBadge } from "@/components/shared";
import { useBranchFilter } from "@/hooks";
import workspaceProductService from "@/features/workspace-products/services/workspaceProductService";

/**
 * Format currency in Indian locale
 */
const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Helper to reliably parse date string across all browsers/devices,
 * handling MM/YY, MM/YYYY, DD-MMM-YY, YYYY-MM-DD, MM-YY, etc.
 */
const parseDateSafely = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date && !isNaN(dateStr.getTime())) return dateStr;

  const str = String(dateStr).trim();

  // 1) Handle Slash-separated strings (e.g., MM/YY, MM/YYYY, DD/MM/YYYY, YYYY/MM/DD)
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 2) {
      let month = parseInt(parts[0], 10) - 1;
      let year = parseInt(parts[1], 10);
      if (year < 100) year += 2000;
      if (!isNaN(month) && !isNaN(year) && month >= 0 && month < 12) {
        return new Date(year, month, 1);
      }
    } else if (parts.length === 3) {
      let year, month, day;
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
      }
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  // 2) Handle Hyphen-separated strings (e.g., DD-MMM-YY, YYYY-MM-DD, MM-YY, MM-YYYY)
  if (str.includes("-")) {
    const parts = str.split("-");
    if (parts.length === 2) {
      let month = parseInt(parts[0], 10) - 1;
      let year = parseInt(parts[1], 10);
      if (year < 100) year += 2000;
      if (!isNaN(month) && !isNaN(year) && month >= 0 && month < 12) {
        return new Date(year, month, 1);
      }
    } else if (parts.length === 3) {
      let year, month, day;
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;

        const monthStr = parts[1].toLowerCase();
        const months = {
          jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
          jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
        };

        if (months[monthStr.substring(0, 3)] !== undefined) {
          month = months[monthStr.substring(0, 3)];
        } else {
          month = parseInt(parts[1], 10) - 1;
        }
        day = parseInt(parts[0], 10);
      }

      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * Format expiry date into MM/YY string
 */
const formatExpDate = (expiryDate) => {
  if (!expiryDate) return "N/A";
  const dateObj = parseDateSafely(expiryDate);
  if (!dateObj) {
    return String(expiryDate);
  }
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const fullYear = dateObj.getFullYear();
  const y = String(fullYear).padStart(4, "0").slice(-2);
  return `${m}/${y}`;
};

/**
 * Expiry Classification Badge
 */
const HighlightedExpiryBadge = ({ expiryDate }) => {
  const isGarbage =
    typeof expiryDate === "string" &&
    (expiryDate.toLowerCase() === "active" || expiryDate.toLowerCase() === "inactive");
  const actualExpiryDate = isGarbage ? "" : expiryDate;

  const status = useMemo(() => {
    if (!actualExpiryDate) return null;
    const dateObj = parseDateSafely(actualExpiryDate);
    if (!dateObj) return null;

    const expMonth = dateObj.getMonth() + 1;
    const expYear = dateObj.getFullYear();

    const now = new Date();
    const currMonth = now.getMonth() + 1;
    const currYear = now.getFullYear();

    if (expYear < currYear || (expYear === currYear && expMonth < currMonth)) {
      return "expired";
    }
    if (expYear === currYear && expMonth === currMonth) {
      return "thisMonth";
    }

    const diff = (expYear - currYear) * 12 + (expMonth - currMonth);
    if (diff <= 2) return "nearExpiry";

    return "valid";
  }, [actualExpiryDate]);

  if (!status) {
    return <span className="text-xs text-text-muted">{formatExpDate(actualExpiryDate)}</span>;
  }

  if (status === "expired" || status === "thisMonth") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 font-mono">
        <XCircle className="size-3 shrink-0" />
        {formatExpDate(actualExpiryDate)}
      </span>
    );
  }

  if (status === "nearExpiry") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 font-mono">
        <AlertTriangle className="size-3 shrink-0" />
        {formatExpDate(actualExpiryDate)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
      {formatExpDate(actualExpiryDate)}
    </span>
  );
};

const PAGE_LIMIT = 25;

export const StockMetricsDesktopPage = () => {
  const tableContainerRef = useRef(null);
  const { isCompanyLevel, selectedBranchId, setSelectedBranchId, queryBranchId } = useBranchFilter("all");
  const { activeBranchId: userBranchId, activeCompanyId } = useUser();
  const { currentCompany } = useCompany();
  const { currentBranch } = useBranch();
  const effectiveCompanyId = currentCompany?._id || currentCompany?.id || activeCompanyId;
  const resolvedFacility = isCompanyLevel
    ? queryBranchId
    : (currentBranch?._id || currentBranch?.id || userBranchId);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [expiryFilter, setExpiryFilter] = useState("all");

  // Data states
  const [rawBatches, setRawBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Flatten raw items from API into individual batch rows
  const flattenBatchList = useCallback((productsList = []) => {
    const list = [];
    productsList.forEach((p, pIdx) => {
      const productName = typeof p.name === "object" ? p.name?.name : (p.name || p.displayName || "Unknown Product");
      const productCode = p.workspaceProductCode || p.code || p.sku || "—";
      const manufacturer =
        typeof p.manufacturer === "object"
          ? p.manufacturer?.name
          : p.manufacturer ||
            (typeof p.marketer === "object" ? p.marketer?.name : p.marketer) ||
            "—";
      const pack = typeof p.pack === "object" ? p.pack?.name : p.pack || p.productForm?.name || p.productForm || "—";

      if (Array.isArray(p.batches) && p.batches.length > 0) {
        p.batches.forEach((b, bIdx) => {
          list.push({
            ...p,
            ...b,
            productName,
            productCode,
            manufacturer,
            pack,
            uniqueRowId: `${p._id || p.id || pIdx}-${b.batchNo || bIdx}`,
            batchQty: b.qoh ?? b.qty ?? b.batchQty ?? 0,
            expiryDate: b.expiryDate || b.exp || null,
            mrp: b.mrp ?? p.mrp ?? 0,
            rateA: b.rateA ?? p.rateA ?? 0,
            rateB: b.rateB ?? p.rateB ?? 0,
            rateC: b.rateC ?? p.rateC ?? 0,
          });
        });
      } else {
        list.push({
          ...p,
          productName,
          productCode,
          manufacturer,
          pack,
          uniqueRowId: p._id || p.id || String(pIdx),
          batchNo: p.batchNo || "N/A",
          expiryDate: p.expiryDate || p.exp || null,
          batchQty: p.qty || p.qoh || p.totalStock || 0,
          mrp: p.mrp ?? 0,
          rateA: p.rateA ?? 0,
          rateB: p.rateB ?? 0,
          rateC: p.rateC ?? 0,
        });
      }
    });
    return list;
  }, []);

  // Fetch Page 1 Data (locked to current branch)
  const fetchBatches = useCallback(
    async (resetPage = true) => {
      if (resetPage) {
        setIsLoading(true);
      }
      try {
        const payload = {
          page: 1,
          limit: PAGE_LIMIT,
          companyId: effectiveCompanyId,
          filters: { inStockOnly: true },
        };
        // Scoped to facility if selected or branch level
        if (resolvedFacility) {
          payload.filters.facility = resolvedFacility;
        }
        if (lowStockFilter) {
          payload.filters.lowStock = true;
        }
        if (debouncedSearch) {
          payload.search = debouncedSearch;
        }

        const res = await workspaceProductService.getProductFacilityBatchesByQueryV2(payload);
        const items = res?.data?.data?.batches || [];
        const total = res?.data?.data?.total || items.length;

        const flattened = flattenBatchList(items);
        setRawBatches(flattened);
        setTotalCount(total);
        setCurrentPage(1);
        setHasMore(items.length >= PAGE_LIMIT && flattened.length < total);
      } catch (err) {
        console.error("Failed to load stock metrics:", err);
        setRawBatches([]);
        setTotalCount(0);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [effectiveCompanyId, resolvedFacility, lowStockFilter, debouncedSearch, flattenBatchList]
  );

  // Load More (Infinite Scroll)
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const payload = {
        page: nextPage,
        limit: PAGE_LIMIT,
        companyId: activeCompanyId,
        filters: { inStockOnly: true },
      };
      if (resolvedFacility) {
        payload.filters.facility = resolvedFacility;
      }
      if (lowStockFilter) {
        payload.filters.lowStock = true;
      }
      if (debouncedSearch) {
        payload.search = debouncedSearch;
      }

      const res = await workspaceProductService.getProductFacilityBatchesByQueryV2(payload);
      const items = res?.data?.data?.batches || [];
      const total = res?.data?.data?.total || totalCount;

      if (items.length > 0) {
        const newFlattened = flattenBatchList(items);
        setRawBatches((prev) => {
          const existingIds = new Set(prev.map((b) => b.uniqueRowId));
          const uniqueRows = newFlattened.filter((b) => !existingIds.has(b.uniqueRowId));
          const combined = [...prev, ...uniqueRows];
          setHasMore(combined.length < total && items.length >= PAGE_LIMIT);
          return combined;
        });
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn("Failed to load more stock metrics:", err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    hasMore,
    currentPage,
    activeCompanyId,
    resolvedFacility,
    lowStockFilter,
    debouncedSearch,
    totalCount,
    flattenBatchList,
  ]);

  // Initial and reactive fetch on filter changes
  useEffect(() => {
    fetchBatches(true);
  }, [fetchBatches]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchBatches(true);
    setToastMessage("Stock metrics refreshed.");
    setTimeout(() => setToastMessage(null), 2500);
  }, [fetchBatches]);

  // Reset filters handler
  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearch("");
    setLowStockFilter(false);
    setExpiryFilter("all");
  }, []);

  // Filtered rows for client-side expiry filter and strict low stock isolation
  const displayedRows = useMemo(() => {
    let result = rawBatches;

    // 1. Strict Low Stock Filter (never display quantity >= 10 when lowStock is active)
    if (lowStockFilter) {
      result = result.filter((row) => Number(row.batchQty || 0) < 10);
    }

    // 2. Expiry Tab Filter
    if (expiryFilter === "expired") {
      result = result.filter((row) => {
        const dateObj = parseDateSafely(row.expiryDate);
        if (!dateObj) return false;
        const expMonth = dateObj.getMonth() + 1;
        const expYear = dateObj.getFullYear();
        const now = new Date();
        const currMonth = now.getMonth() + 1;
        const currYear = now.getFullYear();
        return expYear < currYear || (expYear === currYear && expMonth <= currMonth);
      });
    } else if (expiryFilter === "nearExpiry") {
      result = result.filter((row) => {
        const dateObj = parseDateSafely(row.expiryDate);
        if (!dateObj) return false;
        const expMonth = dateObj.getMonth() + 1;
        const expYear = dateObj.getFullYear();
        const now = new Date();
        const currMonth = now.getMonth() + 1;
        const currYear = now.getFullYear();
        const diff = (expYear - currYear) * 12 + (expMonth - currMonth);
        return diff <= 2;
      });
    } else if (expiryFilter === "valid") {
      result = result.filter((row) => {
        const dateObj = parseDateSafely(row.expiryDate);
        if (!dateObj) return true;
        const expMonth = dateObj.getMonth() + 1;
        const expYear = dateObj.getFullYear();
        const now = new Date();
        const currMonth = now.getMonth() + 1;
        const currYear = now.getFullYear();
        const diff = (expYear - currYear) * 12 + (expMonth - currMonth);
        return diff > 2 && !(expYear < currYear || (expYear === currYear && expMonth <= currMonth));
      });
    }

    return result;
  }, [rawBatches, lowStockFilter, expiryFilter]);

  // Dynamic Statistics computed from loaded batches
  const stats = useMemo(() => {
    let totalQty = 0;
    let nearExpiryOrExpiredCount = 0;
    let lowStockCount = 0;

    rawBatches.forEach((row) => {
      const qty = Number(row.batchQty || 0);
      totalQty += qty;

      if (qty < 10) {
        lowStockCount++;
      }

      const dateObj = parseDateSafely(row.expiryDate);
      if (dateObj) {
        const expMonth = dateObj.getMonth() + 1;
        const expYear = dateObj.getFullYear();
        const now = new Date();
        const currMonth = now.getMonth() + 1;
        const currYear = now.getFullYear();
        const diff = (expYear - currYear) * 12 + (expMonth - currMonth);
        if (diff <= 2 || expYear < currYear || (expYear === currYear && expMonth < currMonth)) {
          nearExpiryOrExpiredCount++;
        }
      }
    });

    return {
      totalQty,
      totalBatches: rawBatches.length,
      nearExpiryOrExpiredCount,
      lowStockCount,
    };
  }, [rawBatches]);

  // Tab counts for the Expiry tabs
  const tabCounts = useMemo(() => {
    let all = 0;
    let nearExpiry = 0;
    let expired = 0;
    let valid = 0;

    rawBatches.forEach((row) => {
      if (lowStockFilter && Number(row.batchQty || 0) >= 10) return;

      all++;
      const dateObj = parseDateSafely(row.expiryDate);
      if (!dateObj) {
        valid++;
        return;
      }

      const expMonth = dateObj.getMonth() + 1;
      const expYear = dateObj.getFullYear();
      const now = new Date();
      const currMonth = now.getMonth() + 1;
      const currYear = now.getFullYear();

      const isExp = expYear < currYear || (expYear === currYear && expMonth < currMonth);
      const isThisMo = expYear === currYear && expMonth === currMonth;
      const diff = (expYear - currYear) * 12 + (expMonth - currMonth);

      if (isExp || isThisMo) {
        expired++;
      } else if (diff <= 2) {
        nearExpiry++;
      } else {
        valid++;
      }
    });

    return { all, nearExpiry, expired, valid };
  }, [rawBatches, lowStockFilter]);

  const EXPIRY_TABS = [
    { id: "all", label: "All Batches", count: tabCounts.all, activeBadgeClass: "bg-primary text-white" },
    {
      id: "nearExpiry",
      label: "Near Expiry (≤60d)",
      count: tabCounts.nearExpiry,
      activeBadgeClass: "bg-amber-600 text-white",
    },
    { id: "expired", label: "Expired", count: tabCounts.expired, activeBadgeClass: "bg-rose-600 text-white" },
    { id: "valid", label: "Valid Stock", count: tabCounts.valid, activeBadgeClass: "bg-emerald-600 text-white" },
  ];

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    lowStockFilter ||
    expiryFilter !== "all";

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-alt border border-primary/30 shadow-lg text-text text-xs sm:text-sm font-medium"
          >
            <CheckCircle2 className="size-4.5 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Compact 4-Card Statistics Grid ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Stock QOH */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <Boxes className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total Stock QOH
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalQty.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Current branch inventory
            </div>
          </div>
        </div>

        {/* Card 2: Batches Tracked */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Layers className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-primary truncate">
              Batches Tracked
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalBatches}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Active facility batch lines
            </div>
          </div>
        </div>

        {/* Card 3: Near Expiry / Expired */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Calendar className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400 truncate">
              Near Expiry / Expired
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.nearExpiryOrExpiredCount}
            </div>
            <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-mono truncate mt-0.5">
              Within 60 days or expired
            </div>
          </div>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-error-soft text-error flex items-center justify-center shrink-0">
            <AlertTriangle className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-error truncate">
              Low Stock Items
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.lowStockCount}
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono truncate mt-0.5">
              QOH below 10 units
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Toolbar with Tabs & Low Stock Switch ────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {/* Compact Search Input */}
        <div className="w-[220px] sm:w-[260px] lg:w-[290px]">
          <UIInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search product, marketer, batch..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => setSearchQuery("")}
            className="w-full"
          />
        </div>

        {/* Branch Filter (Company Level Only) */}
        <BranchFilterSelect
          value={selectedBranchId}
          onChange={setSelectedBranchId}
          size="md"
          className="w-[180px] sm:w-[200px]"
        />

        {/* Expiry Segmented Clickable Tabs */}
        <div className="flex items-center p-0.5 rounded-xl bg-surface-alt border border-border/80 gap-1 select-none overflow-x-auto">
          {EXPIRY_TABS.map((tab) => {
            const isSelected = expiryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setExpiryFilter(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                  isSelected
                    ? "bg-surface text-text shadow-2xs border border-border/60"
                    : "text-text-muted hover:text-text hover:bg-surface/50"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono transition-colors",
                    isSelected
                      ? tab.activeBadgeClass
                      : "bg-surface-alt/80 text-text-muted"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Reset */}
        {hasActiveFilters && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleResetFilters}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
            className="h-10 px-2 text-xs text-text-muted hover:text-text"
            title="Reset all filters"
          >
            Reset
          </UIButton>
        )}

        {/* Right-Aligned Cluster: Low Stock Switch & Refresh Button */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Low Stock Modern Toggle Switch */}
          <label
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer select-none",
              lowStockFilter
                ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 shadow-2xs"
                : "bg-surface border-border text-text-muted hover:bg-surface-alt hover:text-text"
            )}
            title="Toggle Low Stock Items Only (< 10 units)"
          >
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-zinc-200 peer-focus:outline-hidden rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-3.5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-rose-600"></div>
            </div>
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <AlertTriangle
                className={cn(
                  "size-3.5",
                  lowStockFilter ? "text-rose-600 dark:text-rose-400" : "text-text-muted"
                )}
              />
              <span>Low Stock</span>
              {stats.lowStockCount > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ml-0.5",
                    lowStockFilter
                      ? "bg-rose-600 text-white"
                      : "bg-surface-alt text-text-muted"
                  )}
                >
                  {stats.lowStockCount}
                </span>
              )}
            </span>
          </label>

          {/* Refresh Button */}
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={handleRefresh}
            className="h-10 w-10 p-0 text-text-muted hover:text-text"
            title="Refresh stock metrics"
          >
            <RefreshCw
              className={cn(
                "size-4 text-text-muted hover:text-primary",
                isLoading && "animate-spin text-primary"
              )}
            />
          </UIButton>
        </div>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ────── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
        <UITableScrollArea containerRef={tableContainerRef}>
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full"
          >
            {/* Sticky Table Header */}
            <UITableHeader
              sticky
              className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs border-b border-border"
            >
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text-muted uppercase tracking-wider bg-surface-alt/70 h-10">
                <UITableHead sticky className="min-w-[220px]">Product</UITableHead>
                <UITableHead sticky className="min-w-[140px]">Marketer / Brand</UITableHead>
                <UITableHead sticky className="min-w-[100px]">Pack</UITableHead>
                <UITableHead sticky className="min-w-[110px]">Batch No</UITableHead>
                <UITableHead sticky align="center" className="min-w-[100px]">Expiry</UITableHead>
                <UITableHead sticky align="right" className="min-w-[95px]">QOH</UITableHead>
                <UITableHead sticky align="right" className="min-w-[95px]">MRP</UITableHead>
                <UITableHead sticky align="right" className="min-w-[95px]">Rate A</UITableHead>
                <UITableHead sticky align="right" className="min-w-[95px]">Rate B</UITableHead>
                <UITableHead sticky align="right" className="min-w-[95px]">Rate C</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={10} rows={10} />
              ) : displayedRows.length === 0 ? (
                <UITableEmpty
                  colSpan={10}
                  title="No stock records found"
                  description={
                    hasActiveFilters
                      ? "No inventory batches match your active filters. Try clearing your search or switching expiry tabs."
                      : "No inventory stock registered in the system yet."
                  }
                  action={
                    hasActiveFilters ? (
                      <UIButton
                        variant="secondary"
                        size="sm"
                        onClick={handleResetFilters}
                      >
                        Clear Filters
                      </UIButton>
                    ) : null
                  }
                />
              ) : (
                displayedRows.map((row) => {
                  const qty = Number(row.batchQty || 0);
                  const isLow = qty < 10;

                  return (
                    <UITableRow
                      key={row.uniqueRowId}
                      className="last:border-b-0 group transition-colors hover:bg-surface-hover/70 h-12"
                    >
                      {/* Product Name & Code */}
                      <UITableCell className="py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text truncate text-xs sm:text-sm leading-tight">
                            {row.productName}
                          </span>
                          <span className="text-[11px] font-mono text-text-muted truncate mt-0.5">
                            {row.productCode}
                          </span>
                        </div>
                      </UITableCell>

                      {/* Manufacturer / Marketer */}
                      <UITableCell className="py-2">
                        <span className="text-xs text-text-muted truncate block max-w-[160px]">
                          {row.manufacturer}
                        </span>
                      </UITableCell>

                      {/* Pack */}
                      <UITableCell className="py-2">
                        <span className="text-xs text-text-muted font-mono truncate block">
                          {row.pack}
                        </span>
                      </UITableCell>

                      {/* Batch No */}
                      <UITableCell className="py-2">
                        <span className="inline-block px-1.5 py-0.5 rounded-md bg-surface-alt border border-border/70 text-xs font-mono font-semibold text-text">
                          {row.batchNo}
                        </span>
                      </UITableCell>

                      {/* Expiry Date */}
                      <UITableCell align="center" className="py-2">
                        <HighlightedExpiryBadge expiryDate={row.expiryDate} />
                      </UITableCell>

                      {/* QOH / Stock */}
                      <UITableCell align="right" className="py-2 font-mono font-bold">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded-md text-xs font-bold",
                            isLow
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                          )}
                        >
                          {qty}
                        </span>
                      </UITableCell>

                      {/* MRP */}
                      <UITableCell align="right" className="py-2 font-mono font-medium text-xs text-text">
                        ₹{formatCurrency(row.mrp)}
                      </UITableCell>

                      {/* Rate A */}
                      <UITableCell align="right" className="py-2 font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                        ₹{formatCurrency(row.rateA)}
                      </UITableCell>

                      {/* Rate B */}
                      <UITableCell align="right" className="py-2 font-mono font-semibold text-xs text-blue-600 dark:text-blue-400">
                        ₹{formatCurrency(row.rateB)}
                      </UITableCell>

                      {/* Rate C */}
                      <UITableCell align="right" className="py-2 font-mono font-semibold text-xs text-amber-600 dark:text-amber-400">
                        ₹{formatCurrency(row.rateC)}
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Infinite Scroll Trigger */}
          {!isLoading && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
            />
          )}
        </UITableScrollArea>
      </div>
    </div>
  );
};

export default StockMetricsDesktopPage;
