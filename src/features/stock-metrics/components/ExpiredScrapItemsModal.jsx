// src/features/stock-metrics/components/ExpiredScrapItemsModal.jsx

import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertOctagon,
  Search,
  RefreshCw,
  RotateCcw,
  Download,
  Printer,
  Boxes,
  Trash2,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Building2,
  Truck,
  Archive,
  Undo2,
  Package,
  PackagePlus,
  Sparkles,
  FileText,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
  UIButton,
  UIInput,
  UISelect,
  UISwitch,
  UIDatePicker,
  UICheckbox,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  UITableEmpty,
  UITableLoading,
  UIConfirmDialog,
  UIInfiniteScroll,
  UITooltip,
} from "@/components/ui";
import { IncomingItemBadge, GroupByDropdown, groupInventoryItems } from "@/components/common";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import useBranch from "@/features/branch/hooks/useBranch";
import useUser from "@/features/user/hooks/useUser";
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
 * Helper to reliably parse date string across all browsers/devices
 */
const parseDateSafely = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date && !isNaN(dateStr.getTime())) return dateStr;

  const str = String(dateStr).trim();

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
          jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
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
  if (!dateObj) return String(expiryDate);
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const fullYear = dateObj.getFullYear();
  const y = String(fullYear).padStart(4, "0").slice(-2);
  return `${m}/${y}`;
};

/**
 * Check if expiry date is actually expired (strictly in past or current month)
 */
const isExpiredDate = (rawExp) => {
  if (!rawExp) return false;
  const dateObj = parseDateSafely(rawExp);
  if (!dateObj) return false;
  const expMonth = dateObj.getMonth() + 1;
  const expYear = dateObj.getFullYear();
  const now = new Date();
  const currMonth = now.getMonth() + 1;
  const currYear = now.getFullYear();
  return expYear < currYear || (expYear === currYear && expMonth <= currMonth);
};

const EXPIRY_PRESET_OPTIONS = [
  { label: "All Expiry Dates", value: "all" },
  { label: "Expired This Month", value: "this_month" },
  { label: "Expired in Last 30 Days", value: "last_30_days" },
  { label: "Expired in Last 90 Days", value: "last_90_days" },
  { label: "Expired > 180 Days Ago", value: "past_180_days" },
  { label: "Custom Date Range", value: "custom" },
];

/**
 * Expired & Scrap Items Modal
 * Displays all shelf-expired batches and branch-level scrap bin items (broken and expired returns)
 * with multi-select checkboxes, search, filters, CSV export, and printable disposal manifest.
 */
export const ExpiredScrapItemsModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { activeBranchId: userBranchId, activeCompanyId } = useUser();
  const { currentBranch, branches = [], getCompanyBranches } = useBranch();
  const activeBranchId = currentBranch?._id || currentBranch?.id || userBranchId;

  // Branch initialization
  const [selectedBranch, setSelectedBranch] = useState(activeBranchId || "all");
  const branchInitializedRef = useRef(false);

  useEffect(() => {
    if (!branchInitializedRef.current && activeBranchId) {
      setSelectedBranch(activeBranchId);
      branchInitializedRef.current = true;
    }
  }, [activeBranchId]);

  // Load company branches if not loaded
  useEffect(() => {
    if (getCompanyBranches && (!branches || branches.length === 0)) {
      getCompanyBranches();
    }
  }, [getCompanyBranches, branches]);

  // Branch options
  const branchOptions = useMemo(() => {
    const opts = [{ label: "All Branches", value: "all" }];
    if (Array.isArray(branches)) {
      branches.forEach((b) => {
        const bId = b._id || b.id;
        if (bId) {
          opts.push({
            label: b.name + (b.code ? ` (${b.code})` : ""),
            value: bId,
          });
        }
      });
    }
    if (currentBranch) {
      const cId = currentBranch._id || currentBranch.id;
      if (cId && !opts.some((o) => o.value === cId)) {
        opts.push({
          label: currentBranch.name + (currentBranch.code ? ` (${currentBranch.code})` : ""),
          value: cId,
        });
      }
    }
    return opts;
  }, [branches, currentBranch]);

  // Data states & pagination
  const PAGE_LIMIT = 20;
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    freshReturn: 0,
    shelfExpired: 0,
    scrapExpired: 0,
    broken: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterMotive, setFilterMotive] = useState("all"); // 'all' | 'shelf_expired' | 'scrap_expired' | 'broken'
  const [selectedIds, setSelectedIds] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const modalBodyRef = useRef(null);

  // Search query debounce (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Expiry date filter states
  const [expiryPreset, setExpiryPreset] = useState("all");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

  // Incoming stock visibility & Group By states
  const [showIncomingItems, setShowIncomingItems] = useState(true);
  const [groupBy, setGroupBy] = useState("none");
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  // Move to scrap bin modal and operation state
  const [isMoveConfirmOpen, setIsMoveConfirmOpen] = useState(false);
  const [isMovingToScrap, setIsMovingToScrap] = useState(false);

  // Standardize batch row
  const formatBatchRow = useCallback((b, idx) => {
    const pName = typeof b.name === "object" ? b.name?.name : (b.name || b.productName || "Unknown");
    const pCode = b.productCode || b.workspaceProductCode || b.code || "—";
    const mfg = typeof b.manufacturer === "object" ? b.manufacturer?.name : (b.manufacturer || b.marketer || "—");
    const pack = typeof b.pack === "object" ? b.pack?.name : (b.pack || "PCS");

    const shelfStock = Number(b.batchQty || b.qty || 0);
    const scrapStock = Number(b.scrapQty || 0);
    const brokenStock = Number(b.brokenQty || 0);
    const expReturnStock = Number(b.expiredQty || 0);

    const hasScrap = scrapStock > 0 || brokenStock > 0 || expReturnStock > 0;
    const mrp = Number(b.mrp || b.MRP || 0);
    const rateA = Number(b.rateA || b.rate || 0);
    const affectedQty = hasScrap ? (scrapStock || (brokenStock + expReturnStock)) : shelfStock;
    const lossValue = affectedQty * mrp;

    const isScrapFresh =
      b.scrapType === "FRESH_RETURN" ||
      b.scrapType === "SCRAP" ||
      (b.batchNo && (b.batchNo.includes("[FRESH_RETURN]") || b.batchNo.includes("[SCRAP]")));

    const isScrapBroken =
      brokenStock > 0 ||
      b.scrapType === "BROKEN" ||
      (b.batchNo && b.batchNo.includes("[BROKEN]"));

    const isScrapExpired =
      expReturnStock > 0 ||
      b.scrapType === "EXPIRED" ||
      (b.batchNo && b.batchNo.includes("[EXPIRED]"));

    let category = "shelf_expired";
    if (isScrapFresh) {
      category = "fresh_return";
    } else if (isScrapBroken) {
      category = "broken";
    } else if (isScrapExpired) {
      category = "scrap_expired";
    } else if (hasScrap) {
      category = "fresh_return";
    } else {
      // Retail shelf batch
      const isExpired = isExpiredDate(b.expiryDate);
      category = isExpired ? "shelf_expired" : "fresh_return";
    }

    const displayBatchNo =
      b.originalBatchNo ||
      (b.batchNo
        ? b.batchNo.replace(/\s*\[(EXPIRED|BROKEN|SCRAP|FRESH_RETURN)\]/gi, "").trim()
        : "N/A");

    const rowBranchName =
      b.branchName ||
      (branches.find((br) => (br._id || br.id) === (b.branch_id?._id || b.branch_id || b.branchId))?.name) ||
      currentBranch?.name ||
      "Main Branch";

    return {
      ...b,
      uniqueRowId: b._id || `${b.batchNo || "b"}-${category}-${idx}`,
      productName: pName,
      productCode: pCode,
      manufacturer: mfg,
      pack,
      batchNo: displayBatchNo,
      rawBatchNo: b.batchNo,
      expiryDate: b.expiryDate || "",
      shelfStock,
      scrapStock,
      brokenStock,
      expReturnStock,
      affectedQty,
      mrp,
      rateA,
      lossValue,
      category,
      branchName: rowBranchName,
      isIncoming: Boolean(b.isIncoming),
      sourceBranchId: b.sourceBranchId?._id || b.sourceBranchId || null,
      sourceBranchName:
        b.sourceBranchName ||
        b.sourceBranchId?.name ||
        branches.find((br) => (br._id || br.id) === (b.sourceBranchId?._id || b.sourceBranchId))?.name ||
        "",
      sourceBranchCode:
        b.sourceBranchCode ||
        b.sourceBranchId?.branchCode ||
        b.sourceBranchId?.code ||
        "",
      sourceTransferOrderNo: b.sourceTransferOrderNo || "",
      sourceTransferOrderId: b.sourceTransferOrderId || null,
    };
  }, [branches, currentBranch]);

  // Fetch expired and scrap items with server-side pagination
  const fetchExpiredItems = useCallback(
    async (pageToFetch = 1, isReset = true) => {
      if (!isOpen) return;

      const safePage =
        typeof pageToFetch === "number" && !isNaN(pageToFetch) && pageToFetch > 0
          ? pageToFetch
          : 1;
      const safeReset = typeof isReset === "boolean" ? isReset : true;

      if (safeReset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const payload = {
          page: safePage,
          limit: PAGE_LIMIT,
          companyId: activeCompanyId,
          search: debouncedSearch || undefined,
          filters: {
            ...(selectedBranch && selectedBranch !== "all" ? { facility: selectedBranch } : {}),
            motive: filterMotive,
          },
        };

        const res = await workspaceProductService.getProductFacilityBatchesByQueryV2(payload);
        const resData = res?.data?.data || {};
        const rawBatches = Array.isArray(resData.batches) ? resData.batches : [];
        const total = typeof resData.total === "number" ? resData.total : rawBatches.length;

        if (resData.counts) {
          setTabCounts({
            all: Number(resData.counts.all || 0),
            freshReturn: Number(resData.counts.freshReturn || 0),
            shelfExpired: Number(resData.counts.shelfExpired || 0),
            scrapExpired: Number(resData.counts.scrapExpired || 0),
            broken: Number(resData.counts.broken || 0),
          });
        }

        const newRows = rawBatches.map((b, idx) => formatBatchRow(b, idx));

        if (isReset) {
          setItems(newRows);
          setTotalCount(total);
          setCurrentPage(1);
          setHasMore(newRows.length < total);
          setSelectedIds([]);
          if (modalBodyRef.current) {
            modalBodyRef.current.scrollTop = 0;
          }
        } else {
          setItems((prev) => {
            const existingIds = new Set(prev.map((i) => i.uniqueRowId));
            const fresh = newRows.filter((i) => !existingIds.has(i.uniqueRowId));
            const combined = [...prev, ...fresh];
            setHasMore(combined.length < total);
            return combined;
          });
          setCurrentPage(pageToFetch);
        }
      } catch (err) {
        console.error("Failed to fetch expired & scrap items in modal:", err);
        if (isReset) {
          setItems([]);
          setTotalCount(0);
          setHasMore(false);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [isOpen, activeCompanyId, selectedBranch, debouncedSearch, filterMotive, formatBatchRow]
  );

  useEffect(() => {
    if (isOpen) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      fetchExpiredItems(1, true);
    }
  }, [isOpen, fetchExpiredItems]);

  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    const nextPage = currentPage + 1;
    await fetchExpiredItems(nextPage, false);
  }, [isLoading, isLoadingMore, hasMore, currentPage, fetchExpiredItems]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dedicated refresh handler for the refresh button
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setSelectedIds([]);
    try {
      await fetchExpiredItems(1, true);
      setToastMessage("Scrap register refreshed successfully.");
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setToastMessage("Failed to refresh scrap register.");
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchExpiredItems]);

  // Filtered list
  const filteredItems = useMemo(() => {
    let result = items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          i.productCode.toLowerCase().includes(q) ||
          i.manufacturer.toLowerCase().includes(q) ||
          i.batchNo.toLowerCase().includes(q) ||
          (i.branchName && i.branchName.toLowerCase().includes(q)) ||
          (i.sourceBranchName && i.sourceBranchName.toLowerCase().includes(q))
      );
    }

    // Incoming Items Visibility Switch (Default: ON)
    if (!showIncomingItems) {
      result = result.filter((i) => !i.isIncoming);
    }

    if (filterMotive === "shelf_expired") {
      result = result.filter((i) => i.category === "shelf_expired");
    } else if (filterMotive === "scrap_expired") {
      result = result.filter((i) => i.category === "scrap_expired");
    } else if (filterMotive === "broken") {
      result = result.filter((i) => i.category === "broken");
    } else if (filterMotive === "fresh_return") {
      result = result.filter((i) => i.category === "fresh_return");
    } else {
      // filterMotive === "all": exclude shelf-expired items
      result = result.filter((i) => i.category !== "shelf_expired");
    }

    // Expiry Date Range
    if (expiryPreset !== "all") {
      const now = new Date();
      const currYear = now.getFullYear();
      const currMonth = now.getMonth();

      result = result.filter((item) => {
        const d = parseDateSafely(item.expiryDate);
        if (!d) return false;

        if (expiryPreset === "this_month") {
          return d.getFullYear() === currYear && d.getMonth() === currMonth;
        }

        if (expiryPreset === "last_30_days") {
          const diffTime = now.getTime() - d.getTime();
          const diffDays = diffTime / (1000 * 3600 * 24);
          return diffDays >= 0 && diffDays <= 30;
        }

        if (expiryPreset === "last_90_days") {
          const diffTime = now.getTime() - d.getTime();
          const diffDays = diffTime / (1000 * 3600 * 24);
          return diffDays >= 0 && diffDays <= 90;
        }

        if (expiryPreset === "past_180_days") {
          const diffTime = now.getTime() - d.getTime();
          const diffDays = diffTime / (1000 * 3600 * 24);
          return diffDays > 180;
        }

        if (expiryPreset === "custom") {
          let match = true;
          if (customFromDate) {
            const from = new Date(customFromDate + "T00:00:00");
            if (!isNaN(from.getTime())) {
              match = match && d >= from;
            }
          }
          if (customToDate) {
            const to = new Date(customToDate + "T23:59:59");
            if (!isNaN(to.getTime())) {
              match = match && d <= to;
            }
          }
          return match;
        }

        return true;
      });
    }

    return result;
  }, [
    items,
    searchQuery,
    showIncomingItems,
    filterMotive,
    expiryPreset,
    customFromDate,
    customToDate,
  ]);

  // Checkbox Selection
  const isAllSelected =
    filteredItems.length > 0 && selectedIds.length === filteredItems.length;
  const isSomeSelected =
    selectedIds.length > 0 && selectedIds.length < filteredItems.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.uniqueRowId));
    }
  };

  const handleToggleRow = (rowId) => {
    setSelectedIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  // Selected items stats
  const selectedItems = useMemo(() => {
    const set = new Set(selectedIds);
    return filteredItems.filter((i) => set.has(i.uniqueRowId));
  }, [filteredItems, selectedIds]);

  const selectedStats = useMemo(() => {
    let totalQty = 0;
    let totalLoss = 0;
    selectedItems.forEach((i) => {
      totalQty += Number(i.affectedQty || 0);
      totalLoss += Number(i.lossValue || 0);
    });
    return { totalQty, totalLoss };
  }, [selectedItems]);

  const selectedShelfItems = useMemo(
    () => selectedItems.filter((i) => i.category === "shelf_expired"),
    [selectedItems]
  );
  const selectedScrapItems = useMemo(
    () => selectedItems.filter((i) => i.category !== "shelf_expired"),
    [selectedItems]
  );
  // Group A: Current Branch Items (Debit Note)
  const selectedCurrentBranchItems = useMemo(
    () => selectedScrapItems.filter((i) => !i.isIncoming),
    [selectedScrapItems]
  );
  // Group B: Incoming Items (Credit Note)
  const selectedIncomingItems = useMemo(
    () => selectedScrapItems.filter((i) => i.isIncoming),
    [selectedScrapItems]
  );
  const hasShelfSelected = selectedShelfItems.length > 0;
  const hasScrapSelected = selectedScrapItems.length > 0;

  // Overall statistics for KPI cards
  const overallStats = useMemo(() => {
    let shelfExpiredCount = 0;
    let shelfExpiredQty = 0;
    let scrapBinCount = 0;
    let scrapBinQty = 0;
    let totalLossValue = 0;

    items.forEach((i) => {
      if (i.category === "shelf_expired") {
        shelfExpiredCount += 1;
        shelfExpiredQty += i.shelfStock;
      } else {
        scrapBinCount += 1;
        scrapBinQty += i.affectedQty;
      }
      totalLossValue += i.lossValue;
    });

    return {
      totalBatches: totalCount,
      shelfExpiredCount,
      shelfExpiredQty,
      scrapBinCount,
      scrapBinQty,
      totalLossValue,
    };
  }, [items, totalCount]);

  // Active filter count and reset
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      filterMotive !== "all" ||
      (selectedBranch !== "all" && selectedBranch !== (activeBranchId || "all")) ||
      expiryPreset !== "all" ||
      customFromDate ||
      customToDate
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterMotive("all");
    setSelectedBranch(activeBranchId || "all");
    setExpiryPreset("all");
    setCustomFromDate("");
    setCustomToDate("");
  };

  // Branch label for title
  const currentBranchLabel = useMemo(() => {
    if (selectedBranch === "all") return "All Branches";
    const found = branchOptions.find((b) => b.value === selectedBranch);
    return found ? found.label : (currentBranch?.name || "Current Branch");
  }, [selectedBranch, branchOptions, currentBranch]);

  // CSV Export
  const handleExportCSV = () => {
    const listToExport = selectedItems.length > 0 ? selectedItems : filteredItems;
    if (listToExport.length === 0) return;

    const headers = [
      "Product Name",
      "Item Code",
      "Branch",
      "Manufacturer / Marketer",
      "Pack",
      "Batch No",
      "Expiry Date",
      "Quarantine Reason",
      "Affected Qty",
      "MRP (INR)",
      "Rate A (INR)",
      "Total Loss Valuation (INR)",
    ];

    const rows = listToExport.map((i) => [
      `"${(i.productName || "").replace(/"/g, '""')}"`,
      `"${i.productCode || ""}"`,
      `"${(i.branchName || "").replace(/"/g, '""')}"`,
      `"${(i.manufacturer || "").replace(/"/g, '""')}"`,
      `"${i.pack || ""}"`,
      `"${i.batchNo || ""}"`,
      `"${formatExpDate(i.expiryDate)}"`,
      `"${
        i.category === "fresh_return"
          ? (i.scrapStock > 0 ? "Scrap Bin: Fresh Return" : "Stock Matrix: Fresh Return")
          : i.category === "broken"
          ? "Scrap Bin: Broken / Damaged Return"
          : i.category === "scrap_expired"
          ? "Scrap Bin: Expired Return"
          : "Shelf Expired Stock"
      }"`,
      i.affectedQty,
      i.mrp.toFixed(2),
      i.rateA.toFixed(2),
      i.lossValue.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `PharmaERP_Expired_Scrap_Register_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage(`Exported ${listToExport.length} items to CSV.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Print Disposal Manifest
  const handlePrintManifest = () => {
    const listToPrint = selectedItems.length > 0 ? selectedItems : filteredItems;
    if (listToPrint.length === 0) return;

    const printWin = window.open("", "_blank", "width=900,height=700");
    if (!printWin) return;

    const branchName = currentBranchLabel;
    const dateStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const rowsHtml = listToPrint
      .map(
        (i, idx) => `
        <tr>
          <td style="padding:6px;border:1px solid #ddd;text-align:center;">${idx + 1}</td>
          <td style="padding:6px;border:1px solid #ddd;font-weight:600;">${i.productName}</td>
          <td style="padding:6px;border:1px solid #ddd;font-size:11px;">${i.branchName}</td>
          <td style="padding:6px;border:1px solid #ddd;">${i.manufacturer}</td>
          <td style="padding:6px;border:1px solid #ddd;">${i.pack}</td>
          <td style="padding:6px;border:1px solid #ddd;font-family:monospace;">${i.batchNo}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center;">${formatExpDate(i.expiryDate)}</td>
          <td style="padding:6px;border:1px solid #ddd;font-size:11px;">
            ${
              i.category === "broken"
                ? "Scrap Bin: Broken"
                : i.category === "scrap_expired"
                ? "Scrap Bin: Expired"
                : "Shelf Expired"
            }
          </td>
          <td style="padding:6px;border:1px solid #ddd;text-align:right;font-weight:bold;">${i.affectedQty}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:right;">₹${i.mrp.toFixed(2)}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:right;font-weight:bold;">₹${i.lossValue.toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const totalQty = listToPrint.reduce((acc, i) => acc + i.affectedQty, 0);
    const totalLoss = listToPrint.reduce((acc, i) => acc + i.lossValue, 0);

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Scrap & Expired Items Disposal Manifest - ${branchName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; color: #111; margin: 20px; }
            h1 { font-size: 18px; margin: 0 0 4px 0; }
            .header-meta { font-size: 12px; color: #555; margin-bottom: 16px; border-bottom: 2px solid #222; padding-bottom: 8px; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th { background: #f3f4f6; padding: 6px; border: 1px solid #ccc; text-align: left; }
            .totals-row td { font-weight: bold; background: #fafafa; border-top: 2px solid #333; }
            .signatures { margin-top: 40px; display: flex; justify-content: space-between; }
            .sign-box { border-top: 1px solid #888; width: 200px; text-align: center; padding-top: 6px; font-size: 11px; }
          </style>
        </head>
        <body>
          <h1>PHARMAERP — SCRAP & EXPIRED INVENTORY DISPOSAL MANIFEST</h1>
          <div class="header-meta">
            <div><strong>Scope:</strong> ${branchName} | <strong>Date:</strong> ${dateStr}</div>
            <div><strong>Items:</strong> ${listToPrint.length} | <strong>Status:</strong> Quarantined for Write-off</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:30px;text-align:center;">#</th>
                <th>Product Name</th>
                <th>Branch</th>
                <th>Brand / Marketer</th>
                <th>Pack</th>
                <th>Batch No</th>
                <th style="text-align:center;">Expiry</th>
                <th>Type / Source</th>
                <th style="text-align:right;">Qty</th>
                <th style="text-align:right;">MRP</th>
                <th style="text-align:right;">Loss Value</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="totals-row">
                <td colspan="8" style="padding:8px;text-align:right;">TOTAL QUARANTINED:</td>
                <td style="padding:8px;text-align:right;">${totalQty}</td>
                <td></td>
                <td style="padding:8px;text-align:right;">₹${totalLoss.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="signatures">
            <div class="sign-box">Pharmacist Signature & Date</div>
            <div class="sign-box">Inventory Auditor Signature</div>
            <div class="sign-box">Store Manager Approval</div>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  // Current branch check: only allow creating transfer orders for items in active branch
  const isCurrentBranchSelected = useMemo(() => {
    if (!selectedBranch || selectedBranch === "all") return false;
    return String(selectedBranch) === String(activeBranchId);
  }, [selectedBranch, activeBranchId]);

  // Jump to Transfer Order creation with selected quarantined items prefilled
  const handleCreateTransferOrder = () => {
    if (!isCurrentBranchSelected) {
      setToastMessage(
        `Transfer orders can only be created when your current branch (${currentBranch?.name || "Active Facility"}) is selected. Please switch branch filter to your current branch.`
      );
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const listToTransfer = selectedScrapItems.length > 0 ? selectedScrapItems : selectedItems.filter((i) => i.category !== "shelf_expired");
    if (listToTransfer.length === 0) {
      if (selectedShelfItems.length > 0) {
        setToastMessage("Shelf-expired items are on shelves and must first be moved to the scrap bin before transferring.");
      } else {
        setToastMessage("Please select at least one scrap bin batch to transfer.");
      }
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    // Verify all selected batches belong strictly to current branch
    const foreignBranchItem = listToTransfer.find((i) => {
      const itemBranchId = i.branch_id?._id || i.branch_id || i.branchId;
      return itemBranchId && String(itemBranchId) !== String(activeBranchId);
    });
    if (foreignBranchItem) {
      setToastMessage(
        `Cannot transfer stock from "${foreignBranchItem.branchName || "another branch"}". You can only transfer stock belonging to your current branch (${currentBranch?.name || "Active Facility"}).`
      );
      setTimeout(() => setToastMessage(null), 4500);
      return;
    }

    const sourceBranch = activeBranchId;

    const prefilledItems = listToTransfer.map((item) => ({
      product:
        item.productId ||
        item.product_id ||
        item.product?._id ||
        item.product ||
        item._id,
      productName: item.productName || item.name || "Product",
      batch: item._id || item.batchId || item.batch,
      batchNo: item.rawBatchNo || item.batchNo,
      originalBatchNo: item.originalBatchNo || item.batchNo,
      availableQty: Number(
        item.affectedQty || item.scrapStock || item.shelfStock || 1
      ),
      transferQty: Number(
        item.affectedQty || item.scrapStock || item.shelfStock || 1
      ),
      scrapType:
        item.category === "broken"
          ? "BROKEN"
          : item.category === "fresh_return"
          ? "FRESH_RETURN"
          : "EXPIRED",
      category: item.category,
      mrp: item.mrp,
      isScrap: true,
    }));

    if (onClose) onClose();

    navigate(ROUTES.CREATE_TRANSFER_ORDER, {
      state: {
        transferType: "SCRAP",
        sourceBranchId: sourceBranch,
        prefilledItems,
        remarks: `Quarantined stock transfer (${listToTransfer.length} batches)`,
      },
    });
  };

  // Create Debit Note for Selected Scrap Items (both current branch and incoming 📦)
  const handleCreateDebitNote = () => {
    if (!isCurrentBranchSelected) {
      setToastMessage(
        `Debit notes can only be created when your current branch (${currentBranch?.name || "Active Facility"}) is selected. Please switch branch filter.`
      );
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    if (selectedScrapItems.length === 0) {
      if (selectedShelfItems.length > 0) {
        setToastMessage("Shelf-expired items are currently on retail shelves and must first be moved to the scrap bin before creating a Debit Note.");
      } else {
        setToastMessage("Please select at least one scrap batch to create a Debit Note.");
      }
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    const sourceBranch = activeBranchId;
    const prefilledItems = selectedScrapItems.map((item) => {
      const cleanBatch =
        item.originalBatchNo ||
        (item.batchNo
          ? item.batchNo.replace(/\s*\[(EXPIRED|BROKEN|SCRAP|FRESH_RETURN)\]/gi, "").trim()
          : "N/A");
      return {
        productId: item.productId || item.product_id || item.product?._id || item.product || item._id,
        productName: item.productName || item.name || "Product",
        pack: item.pack || "",
        batchId: item._id || item.batchId || item.batch,
        batchNo: cleanBatch,
        rawBatchNo: item.rawBatchNo || item.batchNo,
        originalBatchNo: cleanBatch,
        expiry: item.expiryDate || "",
        availableQty: Number(item.affectedQty || item.scrapStock || item.shelfStock || 1),
        returnQty: Number(item.affectedQty || item.scrapStock || item.shelfStock || 1),
        sourceBin:
          item.category === "broken"
            ? "SCRAP_BROKEN"
            : item.category === "fresh_return"
            ? (item.scrapStock > 0 || !item.shelfStock ? "SCRAP_FRESH" : "SELLABLE")
            : "SCRAP_EXPIRED",
        category: item.category,
        rate: Number(item.pts || item.rate || 0),
        mrp: item.mrp || 0,
        gstPct: item.hsnTaxpercent || 12,
        supplier: item.supplier || null,
        supplierId: item.supplierId || item.supplier?._id || null,
        supplierName: item.supplierName || item.supplier?.businessName || item.supplier?.name || "",
        supplierGst: item.supplierGst || item.supplier?.gstNumber || "",
        supplierMobile: item.supplierMobile || item.supplier?.mobile || item.supplier?.phone || "",
        subSupplier: item.subSupplier || null,
        subSupplierId: item.subSupplierId || item.subSupplier?._id || null,
        subSupplierName: item.subSupplierName || item.subSupplier?.businessName || item.subSupplier?.name || "",
        subSupplierGst: item.subSupplierGst || item.subSupplier?.gstNumber || "",
        purchaseBillId: item.purchaseBillId || null,
        purchaseBillNo: item.purchaseBillNo || "",
        isIncoming: Boolean(item.isIncoming),
        sourceBranchId: item.sourceBranchId || null,
        sourceBranchName: item.sourceBranchName || "",
        sourceBranchCode: item.sourceBranchCode || "",
        sourceTransferOrderId: item.sourceTransferOrderId || null,
        sourceTransferOrderNo: item.sourceTransferOrderNo || "",
      };
    });

    if (onClose) onClose();

    navigate(ROUTES.CREATE_PURCHASE_RETURN, {
      state: {
        returnMode: "DEBIT_NOTE",
        returnMotive: selectedScrapItems.some((i) => i.category === "fresh_return")
          ? "SELLABLE"
          : selectedScrapItems.some((i) => i.category === "broken")
          ? "BROKEN"
          : "EXPIRED",
        sourceBranchId: sourceBranch,
        prefilledItems,
        remarks: `Return to supplier from scrap bin (${selectedScrapItems.length} batches)`,
      },
    });
  };

  // Create Credit Note for Incoming Items only (Group B - 📦)
  const handleCreateCreditNote = () => {
    if (selectedIncomingItems.length === 0) {
      setToastMessage("Please select at least one incoming (📦) scrap batch to create a Credit Note.");
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    const prefilledItems = selectedIncomingItems.map((item) => {
      const cleanBatch =
        item.originalBatchNo ||
        (item.batchNo
          ? item.batchNo.replace(/\s*\[(EXPIRED|BROKEN|SCRAP|FRESH_RETURN)\]/gi, "").trim()
          : "N/A");
      return {
        productId: item.productId || item.product_id || item.product?._id || item.product || item._id,
        productName: item.productName || item.name || "Product",
        pack: item.pack || "",
        batchId: item._id || item.batchId || item.batch,
        batchNo: cleanBatch,
        rawBatchNo: item.rawBatchNo || item.batchNo,
        originalBatchNo: cleanBatch,
        expiry: item.expiryDate || "",
        availableQty: Number(item.affectedQty || item.scrapStock || item.shelfStock || 1),
        returnQty: Number(item.affectedQty || item.scrapStock || item.shelfStock || 1),
        sourceBin:
          item.category === "broken"
            ? "SCRAP_BROKEN"
            : item.category === "fresh_return"
            ? (item.scrapStock > 0 || !item.shelfStock ? "SCRAP_FRESH" : "SELLABLE")
            : "SCRAP_EXPIRED",
        category: item.category,
        rate: Number(item.pts || item.rate || 0),
        mrp: item.mrp || 0,
        gstPct: item.hsnTaxpercent || 12,
        isIncoming: true,
        sourceBranchId: item.sourceBranchId || null,
        sourceBranchName: item.sourceBranchName || "",
        sourceTransferOrderId: item.sourceTransferOrderId || null,
        sourceTransferOrderNo: item.sourceTransferOrderNo || "",
        supplier: item.supplier || null,
        supplierId: item.supplierId || item.supplier?._id || null,
        supplierName: item.sourceBranchName ? `Inter-Branch: ${item.sourceBranchName}` : (item.supplierName || "Inter-Branch Source"),
        purchaseBillId: item.purchaseBillId || null,
        purchaseBillNo: item.purchaseBillNo || "",
      };
    });

    if (onClose) onClose();

    navigate(ROUTES.CREATE_PURCHASE_RETURN, {
      state: {
        returnMode: "CREDIT_NOTE",
        returnMotive: selectedIncomingItems.some((i) => i.category === "fresh_return")
          ? "SELLABLE"
          : selectedIncomingItems.some((i) => i.category === "broken")
          ? "BROKEN"
          : "EXPIRED",
        sourceBranchId: selectedIncomingItems[0]?.sourceBranchId || null,
        sourceBranchName: selectedIncomingItems[0]?.sourceBranchName || "",
        sourceTransferOrderId: selectedIncomingItems[0]?.sourceTransferOrderId || null,
        sourceTransferOrderNo: selectedIncomingItems[0]?.sourceTransferOrderNo || "",
        prefilledItems,
        remarks: `Inter-branch credit note for incoming stock (${selectedIncomingItems.length} batches)`,
      },
    });
  };

  const handleReturnToSupplier = handleCreateDebitNote;

  // Handle moving selected shelf-expired items to branch scrap bin
  const handleConfirmMoveToScrapBin = async () => {
    if (!isCurrentBranchSelected) {
      setToastMessage(
        `Stock can only be moved to the scrap bin of your active branch (${currentBranch?.name || "Active Facility"}). Please switch branch filter to your current branch.`
      );
      setTimeout(() => setToastMessage(null), 4000);
      setIsMoveConfirmOpen(false);
      return;
    }

    const itemsToMove = selectedShelfItems
      .map((item) => ({
        batchId: item._id || item.batchId || item.batch,
        productId:
          item.productId ||
          item.product_id ||
          item.product?._id ||
          item.product,
        qty: Number(item.shelfStock || item.affectedQty || item.batchQty || 0),
        batchNo: item.rawBatchNo || item.batchNo,
        originalBatchNo: item.originalBatchNo || item.batchNo,
      }))
      .filter((i) => i.batchId && i.qty > 0);

    if (itemsToMove.length === 0) {
      setToastMessage("No valid shelf-expired items selected to move.");
      setTimeout(() => setToastMessage(null), 3000);
      setIsMoveConfirmOpen(false);
      return;
    }

    try {
      setIsMovingToScrap(true);
      await workspaceProductService.moveToScrapBin({
        branchId: activeBranchId,
        items: itemsToMove,
      });

      setToastMessage(
        `Successfully moved ${itemsToMove.length} item(s) to ${currentBranch?.name || "Branch"} scrap bin.`
      );
      setTimeout(() => setToastMessage(null), 4000);
      setIsMoveConfirmOpen(false);
      setSelectedIds([]);
      await fetchExpiredItems(1, true);
    } catch (err) {
      console.error("Failed to move batches to scrap bin:", err);
      setToastMessage(
        `Error moving to scrap bin: ${err?.response?.data?.message || err?.message || "Failed to move stock"}`
      );
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsMovingToScrap(false);
    }
  };

  const MOTIVE_TABS = [
    { id: "all", label: "All Expired & Scrap" },
    { id: "shelf_expired", label: "Shelf Expired" },
    { id: "scrap_expired", label: "Scrap: Expired" },
    { id: "broken", label: "Scrap: Broken" },
  ];

  return (
    <>
      <UIModal
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        size="5xl"
        className="p-0 overflow-hidden max-h-[92vh] flex flex-col"
      >
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-alt border border-primary/30 shadow-lg text-text text-xs font-semibold"
          >
            <CheckCircle2 className="size-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Header ──────────────────────────────────────────── */}
      <UIModalHeader className="px-5 py-3.5 border-b border-border bg-surface shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <Trash2 className="size-4.5 stroke-[1.8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <UIModalTitle className="text-base font-bold text-text">
                  Expired & Scrap Items Register
                </UIModalTitle>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-alt border border-border text-text-muted">
                  {currentBranchLabel}
                </span>
              </div>
              <UIModalDescription className="text-xs text-text-muted mt-0.5">
                Audit shelf-expired stock and customer-returned scrap goods (expired & broken) quarantined across branch bins.
              </UIModalDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <UIButton
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredItems.length === 0}
              startIcon={<FileSpreadsheet className="size-3.5" />}
              className="h-8 text-xs font-semibold"
            >
              Export CSV
            </UIButton>
            <UIButton
              variant="outline"
              size="sm"
              onClick={handlePrintManifest}
              disabled={filteredItems.length === 0}
              startIcon={<Printer className="size-3.5" />}
              className="h-8 text-xs font-semibold"
            >
              Print Manifest
            </UIButton>
            <UIButton
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="h-8 w-8 p-0 text-text-muted"
            >
              <RefreshCw
                className={cn(
                  "size-3.5",
                  (isLoading || isRefreshing) && "animate-spin text-primary"
                )}
              />
            </UIButton>
          </div>
        </div>
      </UIModalHeader>

      {/* ── 4-Card Summary Strip ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-5 py-2.5 bg-surface-alt/40 border-b border-border shrink-0">
        <div className="bg-surface rounded-xl border border-border p-2.5 flex items-center gap-2.5 shadow-2xs">
          <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <Calendar className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-text-muted truncate">
              Shelf Expired
            </div>
            <div className="text-base sm:text-lg font-bold text-rose-600 font-mono tabular-nums leading-tight">
              {overallStats.shelfExpiredQty}{" "}
              <span className="text-[10px] font-normal text-text-muted">
                ({overallStats.shelfExpiredCount} lines)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-2.5 flex items-center gap-2.5 shadow-2xs">
          <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Trash2 className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-amber-600 truncate">
              Branch Scrap Bin
            </div>
            <div className="text-base sm:text-lg font-bold text-amber-600 font-mono tabular-nums leading-tight">
              {overallStats.scrapBinQty}{" "}
              <span className="text-[10px] font-normal text-text-muted">
                ({overallStats.scrapBinCount} returns)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-2.5 flex items-center gap-2.5 shadow-2xs">
          <div className="size-8 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <Boxes className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-text-muted truncate">
              Total Quarantined
            </div>
            <div className="text-base sm:text-lg font-bold text-text font-mono tabular-nums leading-tight">
              {overallStats.shelfExpiredQty + overallStats.scrapBinQty}{" "}
              <span className="text-[10px] font-normal text-text-muted">units</span>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-2.5 flex items-center gap-2.5 shadow-2xs">
          <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <AlertOctagon className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-text-muted truncate">
              Estimated Loss (MRP)
            </div>
            <div className="text-base sm:text-lg font-bold text-text font-mono tabular-nums leading-tight">
              ₹{formatCurrency(overallStats.totalLossValue)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Toolbar ────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 px-5 py-2.5 bg-surface border-b border-border shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="w-[180px] sm:w-[220px]">
            <UIInput
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expired item, batch..."
              startIcon={<Search className="size-3.5 text-text-muted" />}
              size="sm"
              variant="outline"
              isClearable
              onClear={() => setSearchQuery("")}
              className="w-full h-8.5 text-xs"
            />
          </div>

          {/* Branch Select */}
          <div className="w-[160px] sm:w-[190px]">
            <UISelect
              value={selectedBranch}
              onChange={(val) => setSelectedBranch(val?.target ? val.target.value : val)}
              options={branchOptions}
              startIcon={<Building2 className="size-3.5 text-text-muted" />}
              size="sm"
              placeholder="Select Branch"
            />
          </div>

          {/* Expiry Date Filter Select */}
          <div className="w-[165px] sm:w-[190px]">
            <UISelect
              value={expiryPreset}
              onChange={(val) => {
                const nextVal = val?.target ? val.target.value : val;
                setExpiryPreset(nextVal);
                if (nextVal !== "custom") {
                  setCustomFromDate("");
                  setCustomToDate("");
                }
              }}
              options={EXPIRY_PRESET_OPTIONS}
              startIcon={<Calendar className="size-3.5 text-text-muted" />}
              size="sm"
              placeholder="Expiry Date Filter"
            />
          </div>

          {/* Custom Date Pickers */}
          {expiryPreset === "custom" && (
            <div className="flex items-center gap-1.5 animate-in fade-in-50 duration-200">
              <div className="w-[125px]">
                <UIDatePicker
                  value={customFromDate}
                  onChange={(val) => setCustomFromDate(val || "")}
                  placeholder="From Expiry"
                  size="sm"
                  isClearable
                />
              </div>
              <span className="text-xs text-text-muted font-medium">to</span>
              <div className="w-[125px]">
                <UIDatePicker
                  value={customToDate}
                  onChange={(val) => setCustomToDate(val || "")}
                  placeholder="To Expiry"
                  size="sm"
                  isClearable
                />
              </div>
            </div>
          )}

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <UIButton
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleResetFilters}
              startIcon={<RotateCcw className="size-3 text-text-muted" />}
              className="h-8.5 px-2 text-xs text-text-muted hover:text-text rounded-md border border-border/60"
              title="Reset filters"
            >
              Reset
            </UIButton>
          )}

          {/* Incoming Items Visibility Switch (Default: ON) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/70 bg-surface text-xs font-semibold select-none h-8.5 shadow-2xs">
            <span className="text-sm" role="img" aria-label="Incoming Box">📦</span>
            <span className="text-xs font-medium text-text">Incoming</span>
            <UISwitch
              size="sm"
              checked={showIncomingItems}
              onChange={(e) => setShowIncomingItems(typeof e === "boolean" ? e : e?.target?.checked)}
              color="primary"
              aria-label="Toggle incoming stock visibility"
            />
          </div>

          {/* Group By Dropdown */}
          <div className="w-[170px] sm:w-[190px]">
            <GroupByDropdown
              value={groupBy}
              onChange={setGroupBy}
              size="sm"
              className="w-full"
            />
          </div>
        </div>

        {/* Motive Filter Tabs */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center p-0.5 rounded-lg bg-surface-alt border border-border/80 gap-1 overflow-x-auto select-none">
            {MOTIVE_TABS.map((tab) => {
              const isSelected = filterMotive === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterMotive(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-semibold transition-all whitespace-nowrap",
                    isSelected
                      ? "bg-surface text-text shadow-2xs border border-border/60"
                      : "text-text-muted hover:text-text"
                  )}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-text-muted font-medium font-mono hidden md:block">
            Showing <strong className="text-text">{filteredItems.length}</strong> of{" "}
            <strong>{items.length}</strong> items
          </div>
        </div>
      </div>

      {/* ── Selection Action Strip (When rows are checked) ────────── */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center justify-between px-5 py-2 bg-rose-500/10 border-b border-rose-500/20 text-xs shrink-0 select-none"
        >
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-rose-700 dark:text-rose-400 font-mono">
              {selectedIds.length} batch{selectedIds.length > 1 ? "es" : ""} selected
            </span>
            <span className="text-text-muted">•</span>
            <span className="text-text-muted">
              Total Units: <strong className="text-text">{selectedStats.totalQty}</strong>
            </span>
            <span className="text-text-muted">•</span>
            <span className="text-text-muted">
              Loss Value: <strong className="text-text">₹{formatCurrency(selectedStats.totalLoss)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isCurrentBranchSelected && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mr-1">
                <AlertCircle className="size-3.5 shrink-0" />
                Select {currentBranch?.name || "current branch"} only to take action
              </span>
            )}
            {hasShelfSelected && (
              <UIButton
                variant="warning"
                size="xs"
                onClick={() => setIsMoveConfirmOpen(true)}
                disabled={!isCurrentBranchSelected}
                startIcon={<Archive className="size-3" />}
                className={cn(
                  "h-7 text-[11px] font-bold shadow-xs",
                  !isCurrentBranchSelected && "opacity-50 cursor-not-allowed"
                )}
                title={
                  !isCurrentBranchSelected
                    ? `Select current branch (${currentBranch?.name || "Active Facility"}) only to move to scrap bin`
                    : "Move selected shelf-expired items to branch scrap bin"
                }
              >
                Move Selected to Scrap Bin ({selectedShelfItems.length})
              </UIButton>
            )}
            {(!hasShelfSelected || hasScrapSelected) && (
              <UIButton
                variant="primary"
                size="xs"
                onClick={handleCreateTransferOrder}
                disabled={!isCurrentBranchSelected || !hasScrapSelected}
                startIcon={<Truck className="size-3" />}
                className={cn(
                  "h-7 text-[11px] font-bold shadow-xs",
                  (!isCurrentBranchSelected || !hasScrapSelected) && "opacity-50 cursor-not-allowed"
                )}
                title={
                  !isCurrentBranchSelected
                    ? `Select current branch (${currentBranch?.name || "Active Facility"}) only to transfer`
                    : !hasScrapSelected
                    ? "Shelf-expired items must first be moved to scrap bin before transferring"
                    : "Transfer selected scrap items to store / branch"
                }
              >
                Transfer Selected to Store {hasScrapSelected ? `(${selectedScrapItems.length})` : ""}
              </UIButton>
            )}
            {/* Create Debit Note for Selected Scrap Items */}
            {(!hasShelfSelected || hasScrapSelected) && (
              <UIButton
                variant="outline"
                size="xs"
                onClick={handleCreateDebitNote}
                disabled={!isCurrentBranchSelected || selectedScrapItems.length === 0}
                startIcon={<FileText className="size-3 text-primary" />}
                className={cn(
                  "h-7 text-[11px] font-bold shadow-xs",
                  (!isCurrentBranchSelected || selectedScrapItems.length === 0) && "opacity-50 cursor-not-allowed"
                )}
                title="Create Debit Note for selected scrap items"
              >
                Create Debit Note ({selectedScrapItems.length})
              </UIButton>
            )}

            {/* Create Credit Note for Incoming Items (📦) */}
            {(!hasShelfSelected || hasScrapSelected) && (
              <UIButton
                variant="default"
                size="xs"
                onClick={handleCreateCreditNote}
                disabled={selectedIncomingItems.length === 0}
                startIcon={<span className="text-[10px]">📦</span>}
                className={cn(
                  "h-7 text-[11px] font-bold shadow-xs",
                  selectedIncomingItems.length > 0
                    ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
                    : "opacity-50 cursor-not-allowed"
                )}
                title="Create Inter-Branch Credit Note for incoming items"
              >
                Create Credit Note ({selectedIncomingItems.length})
              </UIButton>
            )}
            <UIButton
              variant="outline"
              size="xs"
              onClick={handleExportCSV}
              startIcon={<Download className="size-3" />}
              className="h-7 text-[11px] font-semibold"
            >
              Export Selected
            </UIButton>
            <UIButton
              variant="outline"
              size="xs"
              onClick={handlePrintManifest}
              startIcon={<Printer className="size-3" />}
              className="h-7 text-[11px] font-semibold"
            >
              Print Selected
            </UIButton>
            <UIButton
              variant="ghost"
              size="xs"
              onClick={() => setSelectedIds([])}
              className="h-7 text-[11px] text-text-muted hover:text-text"
            >
              Deselect All
            </UIButton>
          </div>
        </motion.div>
      )}

      {/* ── Data Table with Row Checkboxes ────────────────────────── */}
      <UIModalBody ref={modalBodyRef} className="p-0 flex-1 min-h-[300px] max-h-[55vh] overflow-y-auto overflow-x-auto bg-surface">
        <UITable stickyHeader className="w-full">
          <UITableHeader sticky className="sticky top-0 z-10 bg-surface-alt border-b border-border">
            <UITableRow className="h-9 text-[11px] font-semibold text-text-muted uppercase tracking-wider bg-surface-alt">
              <UITableHead sticky className="w-10 text-center p-2">
                <div className="flex items-center justify-center">
                  <UICheckbox
                    checked={isAllSelected}
                    indeterminate={isSomeSelected}
                    onChange={handleSelectAll}
                    size="sm"
                    color="primary"
                    aria-label="Select all expired items"
                  />
                </div>
              </UITableHead>
              <UITableHead sticky className="min-w-[200px]">Product</UITableHead>
              {selectedBranch === "all" && (
                <UITableHead sticky className="min-w-[120px]">Branch</UITableHead>
              )}
              <UITableHead sticky className="min-w-[130px]">Brand / Marketer</UITableHead>
              <UITableHead sticky className="min-w-[80px]">Pack</UITableHead>
              <UITableHead sticky className="min-w-[100px]">Batch No</UITableHead>
              <UITableHead sticky align="center" className="min-w-[90px]">Expiry</UITableHead>
              <UITableHead sticky className="min-w-[140px]">Source / Type</UITableHead>
              <UITableHead sticky align="right" className="min-w-[80px]">Quarantine Qty</UITableHead>
              <UITableHead sticky align="right" className="min-w-[80px]">MRP</UITableHead>
              <UITableHead sticky align="right" className="min-w-[90px]">Loss Value</UITableHead>
            </UITableRow>
          </UITableHeader>

          <UITableBody>
            {isLoading ? (
              <UITableLoading colSpan={selectedBranch === "all" ? 11 : 10} rows={8} />
            ) : filteredItems.length === 0 ? (
              <UITableEmpty
                colSpan={selectedBranch === "all" ? 11 : 10}
                title="No expired or scrap items found"
                description={
                  hasActiveFilters
                    ? "No items match your active search or filters. Try clearing filters."
                    : "Excellent! There are no expired shelf batches or scrap bin items in this branch."
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
              (() => {
                const renderRow = (row) => {
                  const isSelected = selectedIds.includes(row.uniqueRowId);

                  return (
                    <UITableRow
                      key={row.uniqueRowId}
                      onClick={() => handleToggleRow(row.uniqueRowId)}
                      className={cn(
                        "h-11 transition-colors cursor-pointer border-b border-border/60 hover:bg-surface-hover/70 last:border-b-0",
                        isSelected && "bg-rose-500/5 dark:bg-rose-500/10"
                      )}
                    >
                      {/* Checkbox */}
                      <UITableCell
                        className="p-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center">
                          <UICheckbox
                            checked={isSelected}
                            onChange={() => handleToggleRow(row.uniqueRowId)}
                            size="sm"
                            color="primary"
                          />
                        </div>
                      </UITableCell>

                      {/* Product Name & Code */}
                      <UITableCell className="py-1.5">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text truncate text-xs">
                            {row.productName}
                          </span>
                          <span className="text-[10.5px] font-mono text-text-muted truncate">
                            {row.productCode}
                          </span>
                        </div>
                      </UITableCell>

                      {/* Branch when viewing All Branches */}
                      {selectedBranch === "all" && (
                        <UITableCell className="py-1.5">
                          <span className="px-1.5 py-0.2 rounded text-[10.5px] font-semibold bg-surface-alt border border-border text-text-muted truncate inline-block max-w-[120px]">
                            {row.branchName}
                          </span>
                        </UITableCell>
                      )}

                      {/* Brand */}
                      <UITableCell className="text-xs text-text-muted truncate">
                        {row.manufacturer}
                      </UITableCell>

                      {/* Pack */}
                      <UITableCell className="text-xs text-text-muted">
                        {row.pack}
                      </UITableCell>

                      {/* Batch No with Incoming 📦 icon after */}
                      <UITableCell className="font-mono text-xs text-text font-medium whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span>{row.batchNo}</span>
                          {row.isIncoming && (
                            <UITooltip
                              content={
                                <div className="text-xs space-y-0.5">
                                  <div className="font-semibold text-amber-300 flex items-center gap-1">
                                    <span>📦</span>
                                    <span>Incoming Inter-Branch Stock</span>
                                  </div>
                                  {row.sourceBranchName && (
                                    <div className="text-gray-200">
                                      Source: <span className="font-medium">{row.sourceBranchName}</span>
                                    </div>
                                  )}
                                  {row.sourceTransferOrderNo && (
                                    <div className="text-gray-400 text-[11px]">
                                      Ref: #{row.sourceTransferOrderNo}
                                    </div>
                                  )}
                                </div>
                              }
                              position="top"
                            >
                              <span
                                role="img"
                                aria-label="Incoming Box"
                                className="text-xs shrink-0 cursor-help select-none"
                              >
                                📦
                              </span>
                            </UITooltip>
                          )}
                        </div>
                      </UITableCell>

                      {/* Expiry */}
                      <UITableCell align="center">
                        {isExpiredDate(row.expiryDate) ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 text-[10.5px] font-bold text-rose-600 dark:text-rose-400 font-mono">
                            <XCircle className="size-3 shrink-0" />
                            {formatExpDate(row.expiryDate)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            <CheckCircle2 className="size-3 shrink-0" />
                            {formatExpDate(row.expiryDate)}
                          </span>
                        )}
                      </UITableCell>

                      {/* Type Badge */}
                      <UITableCell>
                        {row.category === "fresh_return" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <Sparkles className="size-3" />
                            {row.scrapStock > 0 ? "Scrap: Fresh Return" : "Stock Matrix: Fresh Return"}
                          </span>
                        ) : row.category === "broken" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            <AlertTriangle className="size-3" />
                            Scrap: Broken
                          </span>
                        ) : row.category === "scrap_expired" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            <Trash2 className="size-3" />
                            Scrap: Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                            <Calendar className="size-3" />
                            Shelf Expired
                          </span>
                        )}
                      </UITableCell>

                      {/* Affected Qty */}
                      <UITableCell align="right" className="font-bold text-xs font-mono">
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold">
                          {row.affectedQty}
                        </span>
                      </UITableCell>

                      {/* MRP */}
                      <UITableCell align="right" className="text-xs text-text font-medium font-mono tabular-nums">
                        ₹{formatCurrency(row.mrp)}
                      </UITableCell>

                      {/* Loss Value */}
                      <UITableCell align="right" className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                        ₹{formatCurrency(row.lossValue)}
                      </UITableCell>
                    </UITableRow>
                  );
                };

                if (groupBy === "none") {
                  return filteredItems.map((row) => renderRow(row));
                }

                const groupedSections = groupInventoryItems(filteredItems, groupBy);
                return groupedSections.map((group) => {
                  const isCollapsed = collapsedGroups.has(group.key);
                  const groupRowIds = group.items.map((i) => i.uniqueRowId);
                  const isAllGroupSelected =
                    groupRowIds.length > 0 && groupRowIds.every((id) => selectedIds.includes(id));
                  const isSomeGroupSelected =
                    groupRowIds.some((id) => selectedIds.includes(id)) && !isAllGroupSelected;

                  return (
                    <Fragment key={group.key}>
                      {/* Group Header Row */}
                      <UITableRow className="bg-surface-alt/75 hover:bg-surface-alt border-y border-border/80 sticky top-10 z-10 transition-colors">
                        <UITableCell className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center">
                            <UICheckbox
                              checked={isAllGroupSelected}
                              indeterminate={isSomeGroupSelected}
                              onChange={() => {
                                if (isAllGroupSelected) {
                                  setSelectedIds((prev) =>
                                    prev.filter((id) => !groupRowIds.includes(id))
                                  );
                                } else {
                                  setSelectedIds((prev) =>
                                    Array.from(new Set([...prev, ...groupRowIds]))
                                  );
                                }
                              }}
                              size="sm"
                              color="primary"
                              aria-label={`Select group ${group.title}`}
                            />
                          </div>
                        </UITableCell>
                        <UITableCell colSpan={selectedBranch === "all" ? 10 : 9} className="py-2 px-3">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                setCollapsedGroups((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(group.key)) next.delete(group.key);
                                  else next.add(group.key);
                                  return next;
                                });
                              }}
                              className="flex items-center gap-2 font-bold text-xs text-text hover:text-primary transition-colors select-none text-left"
                            >
                              <ChevronRight
                                className={cn(
                                  "size-3.5 transition-transform duration-200 shrink-0",
                                  !isCollapsed && "rotate-90"
                                )}
                              />
                              <span>{group.title}</span>
                              {group.subtitle && (
                                <span className="text-[10.5px] font-normal text-text-muted">
                                  ({group.subtitle})
                                </span>
                              )}
                            </button>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono font-medium text-text-muted bg-surface px-2 py-0.5 rounded-full border border-border">
                                {group.itemCount} items • Total Qty: {group.totalQty}
                              </span>
                            </div>
                          </div>
                        </UITableCell>
                      </UITableRow>
                      {!isCollapsed && group.items.map((row) => renderRow(row))}
                    </Fragment>
                  );
                });
              })()
            )}
          </UITableBody>
        </UITable>

        {/* Infinite Scroll loader */}
        {!isLoading && filteredItems.length > 0 && (
          <UIInfiniteScroll
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            isLoading={isLoadingMore}
            rootRef={modalBodyRef}
            rootMargin="160px"
          />
        )}
      </UIModalBody>

      {/* ── Modal Footer ──────────────────────────────────────────── */}
      <UIModalFooter className="px-5 py-3 border-t border-border bg-surface-alt/50 flex items-center justify-between shrink-0">
        <div className="text-xs text-text-muted">
          Showing <strong className="text-text">{filteredItems.length}</strong> of{" "}
          <strong className="text-text">{totalCount}</strong> quarantined batches
        </div>

        <div className="flex items-center gap-2">
          <UIButton variant="outline" size="sm" onClick={onClose}>
            Close Register
          </UIButton>
        </div>
      </UIModalFooter>
    </UIModal>

    {/* Confirmation Dialog for Moving Shelf-Expired Items to Scrap Bin */}
    <UIConfirmDialog
      isOpen={isMoveConfirmOpen}
      onClose={() => setIsMoveConfirmOpen(false)}
      onConfirm={handleConfirmMoveToScrapBin}
      intent="warning"
      title="Move Shelf-Expired Items to Scrap Bin"
      description="Are you sure you want to move the selected shelf-expired batches to the quarantine scrap bin of this branch? This will remove them from sellable inventory."
      confirmText={isMovingToScrap ? "Moving..." : "Move to Scrap Bin"}
      isLoading={isMovingToScrap}
      itemName={`${selectedShelfItems.length} Batch(es) to Quarantine`}
      itemDetails={
        <div className="flex flex-col gap-1.5 text-xs text-text">
          <div className="flex justify-between items-center py-0.5 border-b border-border/40">
            <span className="text-text-muted">Target Branch:</span>
            <span className="font-semibold">{currentBranch?.name || "Active Facility"}</span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-border/40">
            <span className="text-text-muted">Total Units to Quarantine:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
              {selectedShelfItems.reduce((acc, i) => acc + (i.shelfStock || i.affectedQty || 0), 0)} units
            </span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-b border-border/40">
            <span className="text-text-muted">Total Valuation:</span>
            <span className="font-bold font-mono">
              ₹{formatCurrency(selectedShelfItems.reduce((acc, i) => acc + (i.lossValue || 0), 0))}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 leading-relaxed">
            Note: Shelf batch quantities will be zeroed out and converted into branch scrap bin stock marked with [EXPIRED].
          </div>
        </div>
      }
    />
  </>
  );
};

export default ExpiredScrapItemsModal;
