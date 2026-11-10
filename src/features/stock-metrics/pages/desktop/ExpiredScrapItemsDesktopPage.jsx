// src/features/stock-metrics/pages/desktop/ExpiredScrapItemsDesktopPage.jsx

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  RotateCcw,
  FileSpreadsheet,
  Printer,
  Trash2,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Boxes,
  AlertOctagon,
  Download,
  Building2,
  Truck,
  Archive,
  Plus,
  Undo2,
} from "lucide-react";

import {
  UIButton,
  UIInput,
  UISelect,
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
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import useBranch from "@/features/branch/hooks/useBranch";
import useUser from "@/features/user/hooks/useUser";
import workspaceProductService from "@/features/workspace-products/services/workspaceProductService";
import AddExpiredBrokenStockModal from "../../components/AddExpiredBrokenStockModal";

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

const EXPIRY_PRESET_OPTIONS = [
  { label: "All Expiry Dates", value: "all" },
  { label: "Expired This Month", value: "this_month" },
  { label: "Expired in Last 30 Days", value: "last_30_days" },
  { label: "Expired in Last 90 Days", value: "last_90_days" },
  { label: "Expired > 180 Days Ago", value: "past_180_days" },
  { label: "Custom Date Range", value: "custom" },
];

export const ExpiredScrapItemsDesktopPage = () => {
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

  // Load branches if not loaded yet
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
  const PAGE_LIMIT = 25;
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    shelfExpired: 0,
    scrapExpired: 0,
    broken: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterMotive, setFilterMotive] = useState("all"); // 'all' | 'shelf_expired' | 'scrap_expired' | 'broken'
  const [selectedIds, setSelectedIds] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const tableContainerRef = useRef(null);

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

  // Move to scrap bin modal and operation state
  const [isMoveConfirmOpen, setIsMoveConfirmOpen] = useState(false);
  const [isMovingToScrap, setIsMovingToScrap] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);

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

    let category = "shelf_expired";
    if (brokenStock > 0 || b.scrapType === "BROKEN" || (b.batchNo && b.batchNo.includes("[BROKEN]"))) {
      category = "broken";
    } else if (expReturnStock > 0 || b.scrapType === "EXPIRED" || (b.batchNo && b.batchNo.includes("[EXPIRED]")) || hasScrap) {
      category = "scrap_expired";
    }

    const displayBatchNo =
      b.originalBatchNo || (b.batchNo ? b.batchNo.replace(/\s*\[(EXPIRED|BROKEN|SCRAP)\]/gi, "").trim() : "N/A");

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
    };
  }, [branches, currentBranch]);

  // Fetch expired and scrap items with server-side pagination
  const fetchExpiredItems = useCallback(
    async (pageToFetch = 1, isReset = true) => {
      if (isReset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const payload = {
          page: pageToFetch,
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
          if (tableContainerRef.current) {
            tableContainerRef.current.scrollTop = 0;
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
        console.error("Failed to fetch expired & scrap items:", err);
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
    [activeCompanyId, selectedBranch, debouncedSearch, filterMotive, formatBatchRow]
  );

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    fetchExpiredItems(1, true);
  }, [fetchExpiredItems]);

  // Load more via infinite scroll
  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    const nextPage = currentPage + 1;
    await fetchExpiredItems(nextPage, false);
  }, [isLoading, isLoadingMore, hasMore, currentPage, fetchExpiredItems]);

  // Filtered Items (Search, Motive Tab & Expiry Date Range)
  const filteredItems = useMemo(() => {
    let result = items;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          i.productCode.toLowerCase().includes(q) ||
          i.manufacturer.toLowerCase().includes(q) ||
          i.batchNo.toLowerCase().includes(q) ||
          (i.branchName && i.branchName.toLowerCase().includes(q))
      );
    }

    // Motive filter: in the "All Expired & Scrap" tab, do not include shelf-expired items
    if (filterMotive === "shelf_expired") {
      result = result.filter((i) => i.category === "shelf_expired");
    } else if (filterMotive === "scrap_expired") {
      result = result.filter((i) => i.category === "scrap_expired");
    } else if (filterMotive === "broken") {
      result = result.filter((i) => i.category === "broken");
    } else {
      // filterMotive === "all": exclude shelf-expired items (scrap bin items only)
      result = result.filter((i) => i.category !== "shelf_expired");
    }

    // Expiry Date Filtering
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
  }, [items, searchQuery, filterMotive, expiryPreset, customFromDate, customToDate]);

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

  // Selected Items aggregate calculation
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
  const hasShelfSelected = selectedShelfItems.length > 0;
  const hasScrapSelected = selectedScrapItems.length > 0;

  // Overall statistics for KPI cards
  const overallStats = useMemo(() => {
    let shelfExpiredCount = tabCounts.shelfExpired;
    let shelfExpiredQty = 0;
    let scrapBinCount = tabCounts.all;
    let scrapBinQty = 0;
    let totalLossValue = 0;

    items.forEach((i) => {
      if (i.category === "shelf_expired") {
        shelfExpiredQty += i.shelfStock;
      } else {
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
  }, [items, tabCounts, totalCount]);

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

  // Branch label for page header
  const currentBranchLabel = useMemo(() => {
    if (selectedBranch === "all") return "All Branches";
    const found = branchOptions.find((b) => b.value === selectedBranch);
    return found ? found.label : (currentBranch?.name || "Current Branch");
  }, [selectedBranch, branchOptions, currentBranch]);

  // CSV Export Handler
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
        i.category === "broken"
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

  // Print Disposal Manifest Handler
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
        setToastMessage("Shelf-expired items are currently on retail shelves and must first be moved to the scrap bin before transferring.");
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
          : item.category === "scrap_expired"
          ? "EXPIRED"
          : "EXPIRED",
      category: item.category,
      mrp: item.mrp,
      isScrap: true,
    }));

    navigate(ROUTES.CREATE_TRANSFER_ORDER, {
      state: {
        transferType: "SCRAP",
        sourceBranchId: sourceBranch,
        prefilledItems,
        remarks: `Quarantined stock transfer (${listToTransfer.length} batches)`,
      },
    });
  };

  // Jump to Purchase Return creation with selected quarantined items prefilled
  const handleReturnToSupplier = () => {
    if (!isCurrentBranchSelected) {
      setToastMessage(
        `Purchase returns can only be created when your current branch (${currentBranch?.name || "Active Facility"}) is selected. Please switch branch filter to your current branch.`
      );
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const listToReturn = selectedScrapItems.length > 0 ? selectedScrapItems : selectedItems.filter((i) => i.category !== "shelf_expired");
    if (listToReturn.length === 0) {
      if (selectedShelfItems.length > 0) {
        setToastMessage("Shelf-expired items are currently on retail shelves and must first be moved to the scrap bin before returning to supplier.");
      } else {
        setToastMessage("Please select at least one scrap bin batch to return.");
      }
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    // Verify all selected batches belong strictly to current branch
    const foreignBranchItem = listToReturn.find((i) => {
      const itemBranchId = i.branch_id?._id || i.branch_id || i.branchId;
      return itemBranchId && String(itemBranchId) !== String(activeBranchId);
    });
    if (foreignBranchItem) {
      setToastMessage(
        `Cannot return stock from "${foreignBranchItem.branchName || "another branch"}". You can only return stock belonging to your current branch.`
      );
      setTimeout(() => setToastMessage(null), 4500);
      return;
    }

    const sourceBranch = activeBranchId;

    const prefilledItems = listToReturn.map((item) => ({
      productId:
        item.productId ||
        item.product_id ||
        item.product?._id ||
        item.product ||
        item._id,
      productName: item.productName || item.name || "Product",
      pack: item.pack || "",
      batchId: item._id || item.batchId || item.batch,
      batchNo: item.rawBatchNo || item.batchNo,
      expiry: item.expiryDate || "",
      availableQty: Number(
        item.affectedQty || item.scrapStock || item.shelfStock || 1
      ),
      returnQty: Number(
        item.affectedQty || item.scrapStock || item.shelfStock || 1
      ),
      sourceBin:
        item.category === "broken"
          ? "SCRAP_BROKEN"
          : "SCRAP_EXPIRED",
      rate: Number(item.pts || item.rate || 0),
      mrp: item.mrp || 0,
      gstPct: item.hsnTaxpercent || 12,
      supplier: item.supplier || null,
      supplierId: item.supplierId || item.supplier?._id || null,
      supplierName: item.supplierName || item.supplier?.businessName || item.supplier?.name || "",
      supplierGst: item.supplierGst || item.supplier?.gstNumber || "",
      supplierMobile: item.supplierMobile || item.supplier?.mobile || item.supplier?.phone || "",
      purchaseBillId: item.purchaseBillId || null,
      purchaseBillNo: item.purchaseBillNo || "",
    }));

    navigate(ROUTES.CREATE_PURCHASE_RETURN, {
      state: {
        returnMotive: listToReturn.some((i) => i.category === "broken") ? "BROKEN" : "EXPIRED",
        sourceBranchId: sourceBranch,
        prefilledItems,
        remarks: `Return to supplier from scrap bin (${listToReturn.length} batches)`,
      },
    });
  };

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
        `Successfully moved ${itemsToMove.length} item(s) from shelf to ${currentBranch?.name || "Branch"} scrap bin.`
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
    { id: "all", label: "All Expired & Scrap", count: tabCounts.all },
    {
      id: "shelf_expired",
      label: "Shelf Expired",
      count: tabCounts.shelfExpired,
    },
    {
      id: "scrap_expired",
      label: "Scrap Bin: Expired Returns",
      count: tabCounts.scrapExpired,
    },
    {
      id: "broken",
      label: "Scrap Bin: Broken Returns",
      count: tabCounts.broken,
    },
  ];

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* Toast Notification */}
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
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <Calendar className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Shelf Expired Stock
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-rose-600 leading-tight font-mono tabular-nums">
              {overallStats.shelfExpiredQty}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {overallStats.shelfExpiredCount} batch lines on shelf
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Trash2 className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-amber-600 truncate">
              Branch Scrap Bin
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-amber-600 leading-tight font-mono tabular-nums">
              {overallStats.scrapBinQty}
            </div>
            <div className="text-[10px] text-amber-600/80 font-mono truncate mt-0.5">
              {overallStats.scrapBinCount} returns quarantined
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <Boxes className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total Units Quarantined
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {overallStats.shelfExpiredQty + overallStats.scrapBinQty}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Non-sellable inventory
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <AlertOctagon className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Estimated Loss (MRP)
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(overallStats.totalLossValue)}
            </div>
            <div className="text-[10px] text-emerald-600/80 font-mono truncate mt-0.5">
              Valuation at retail MRP
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Toolbar with Search, Branch, Expiry & Motive ────── */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Back to Matrix Navigation */}
          {/* <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={() => navigate(ROUTES.STOCK_METRICS)}
            startIcon={<ArrowLeft className="size-4" />}
            className="h-10 px-3 text-xs font-semibold text-text-muted hover:text-text rounded-lg border border-border/60"
            title="Back to Stock Matrix"
          >
            Back to Matrix
          </UIButton> */}

          {/* Search */}
          <div className="w-[180px] sm:w-[220px]">
            <UIInput
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search item, code, batch..."
              startIcon={<Search className="size-4 text-text-muted" />}
              size="md"
              variant="outline"
              isClearable
              onClear={() => setSearchQuery("")}
              className="w-full"
            />
          </div>

          {/* Branch Select */}
          <div className="w-[160px] sm:w-[190px]">
            <UISelect
              value={selectedBranch}
              onChange={(val) => setSelectedBranch(val?.target ? val.target.value : val)}
              options={branchOptions}
              startIcon={<Building2 className="size-4 text-text-muted" />}
              size="md"
              placeholder="Select Branch"
            />
          </div>

          {/* Expiry Date Filter Select */}
          <div className="w-[175px] sm:w-[200px]">
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
              startIcon={<Calendar className="size-4 text-text-muted" />}
              size="md"
              placeholder="Expiry Filter"
            />
          </div>

          {/* Custom Date Pickers when custom is selected */}
          {expiryPreset === "custom" && (
            <div className="flex items-center gap-1.5 animate-in fade-in-50 duration-200">
              <div className="w-[130px]">
                <UIDatePicker
                  value={customFromDate}
                  onChange={(val) => setCustomFromDate(val || "")}
                  placeholder="From Expiry"
                  size="md"
                  isClearable
                />
              </div>
              <span className="text-xs text-text-muted font-medium">to</span>
              <div className="w-[130px]">
                <UIDatePicker
                  value={customToDate}
                  onChange={(val) => setCustomToDate(val || "")}
                  placeholder="To Expiry"
                  size="md"
                  isClearable
                />
              </div>
            </div>
          )}

          {/* Reset button */}
          {hasActiveFilters && (
            <UIButton
              type="button"
              variant="ghost"
              size="md"
              onClick={handleResetFilters}
              startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
              className="h-10 px-2.5 text-xs text-text-muted hover:text-text rounded-lg border border-border/60"
              title="Reset all filters"
            >
              Reset
            </UIButton>
          )}

          {/* Right-aligned Actions */}
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {filterMotive === "shelf_expired" || (hasShelfSelected && !hasScrapSelected) ? (
              <UIButton
                variant={isCurrentBranchSelected && hasShelfSelected ? "warning" : "secondary"}
                size="sm"
                onClick={() => {
                  if (!hasShelfSelected) {
                    setToastMessage("Please select at least one shelf-expired item to move to scrap bin.");
                    setTimeout(() => setToastMessage(null), 3000);
                    return;
                  }
                  setIsMoveConfirmOpen(true);
                }}
                disabled={!isCurrentBranchSelected || selectedShelfItems.length === 0}
                startIcon={<Archive className="size-3.5" />}
                className={cn(
                  "h-10 text-xs font-semibold",
                  (!isCurrentBranchSelected || selectedShelfItems.length === 0) && "opacity-60 cursor-not-allowed"
                )}
                title={
                  !isCurrentBranchSelected
                    ? `Select current branch (${currentBranch?.name || "Active Facility"}) only to move to scrap bin`
                    : hasShelfSelected
                    ? `Move ${selectedShelfItems.length} selected shelf item(s) to scrap bin`
                    : "Select shelf-expired items below to move to scrap bin"
                }
              >
                Move to Scrap Bin {hasShelfSelected && isCurrentBranchSelected ? `(${selectedShelfItems.length})` : ""}
              </UIButton>
            ) : hasShelfSelected && hasScrapSelected ? (
              <>
                <UIButton
                  variant="warning"
                  size="sm"
                  onClick={() => setIsMoveConfirmOpen(true)}
                  disabled={!isCurrentBranchSelected}
                  startIcon={<Archive className="size-3.5" />}
                  className={cn(
                    "h-10 text-xs font-semibold",
                    !isCurrentBranchSelected && "opacity-60 cursor-not-allowed"
                  )}
                  title="Move selected shelf-expired items to scrap bin"
                >
                  Move to Bin ({selectedShelfItems.length})
                </UIButton>
                <UIButton
                  variant={isCurrentBranchSelected ? "primary" : "secondary"}
                  size="sm"
                  onClick={handleCreateTransferOrder}
                  disabled={!isCurrentBranchSelected}
                  startIcon={<Truck className="size-3.5" />}
                  className={cn(
                    "h-10 text-xs font-semibold",
                    !isCurrentBranchSelected && "opacity-60 cursor-not-allowed"
                  )}
                  title="Transfer selected scrap items to store"
                >
                  Transfer to Store ({selectedScrapItems.length})
                </UIButton>
                <UIButton
                  variant={isCurrentBranchSelected ? "outline" : "secondary"}
                  size="sm"
                  onClick={handleReturnToSupplier}
                  disabled={!isCurrentBranchSelected}
                  startIcon={<Undo2 className="size-3.5" />}
                  className={cn(
                    "h-10 text-xs font-semibold",
                    !isCurrentBranchSelected && "opacity-60 cursor-not-allowed"
                  )}
                  title="Return selected scrap items to supplier (Debit Note)"
                >
                  Return to Supplier ({selectedScrapItems.length})
                </UIButton>
              </>
            ) : (
              <>
                <UIButton
                  variant={isCurrentBranchSelected ? "primary" : "secondary"}
                  size="sm"
                  onClick={handleCreateTransferOrder}
                  disabled={!isCurrentBranchSelected}
                  startIcon={<Truck className="size-3.5" />}
                  className={cn(
                    "h-10 text-xs font-semibold",
                    !isCurrentBranchSelected && "opacity-60 cursor-not-allowed"
                  )}
                  title={
                    !isCurrentBranchSelected
                      ? `Select current branch (${currentBranch?.name || "Active Facility"}) only to create transfer order`
                      : selectedIds.length > 0
                      ? `Create transfer order for ${selectedIds.length} selected batches`
                      : "Select items below and create transfer order"
                  }
                >
                  Create Transfer Order {selectedIds.length > 0 && isCurrentBranchSelected ? `(${selectedIds.length})` : ""}
                </UIButton>
                <UIButton
                  variant={isCurrentBranchSelected ? "outline" : "secondary"}
                  size="sm"
                  onClick={handleReturnToSupplier}
                  disabled={!isCurrentBranchSelected}
                  startIcon={<Undo2 className="size-3.5" />}
                  className={cn(
                    "h-10 text-xs font-semibold",
                    !isCurrentBranchSelected && "opacity-60 cursor-not-allowed"
                  )}
                  title="Return selected scrap items to supplier (Debit Note)"
                >
                  Return to Supplier {selectedIds.length > 0 && isCurrentBranchSelected ? `(${selectedIds.length})` : ""}
                </UIButton>
              </>
            )}

            {/* Add Expired / Broken Stock Button */}
            <UIButton
              variant="default"
              size="sm"
              onClick={() => setIsAddStockModalOpen(true)}
              startIcon={<Plus className="size-3.5" />}
              className="h-10 text-xs font-semibold bg-primary text-white hover:bg-primary/90 shadow-2xs"
              title="Add Expired or Broken Stock adjustment for current branch"
            >
              Add Expired / Broken Stock
            </UIButton>

            <UIButton
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredItems.length === 0}
              startIcon={<FileSpreadsheet className="size-3.5" />}
              className="h-10 text-xs font-semibold"
            >
              Export CSV
            </UIButton>

            <UIButton
              variant="outline"
              size="sm"
              onClick={handlePrintManifest}
              disabled={filteredItems.length === 0}
              startIcon={<Printer className="size-3.5" />}
              className="h-10 text-xs font-semibold"
            >
              Print Manifest
            </UIButton>

            <UIButton
              variant="ghost"
              size="sm"
              onClick={fetchExpiredItems}
              disabled={isLoading}
              className="h-10 w-10 p-0 text-text-muted hover:text-text rounded-lg border border-border/60"
              title="Refresh register"
            >
              <RefreshCw
                className={cn("size-3.5", isLoading && "animate-spin text-primary")}
              />
            </UIButton>
          </div>
        </div>

        {/* Motive Filter Tabs & Count */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center p-0.5 rounded-xl bg-surface-alt border border-border/80 gap-1 select-none overflow-x-auto">
            {MOTIVE_TABS.map((tab) => {
              const isSelected = filterMotive === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterMotive(tab.id)}
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
                        ? "bg-rose-600 text-white"
                        : "bg-surface-alt/80 text-text-muted"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-text-muted font-medium font-mono hidden md:block">
            Showing <strong className="text-text">{filteredItems.length}</strong> of{" "}
            <strong>{totalCount}</strong> items
          </div>
        </div>
      </div>

      {/* ── 4. Dynamic Selection Action Strip ─────────────────────── */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center justify-between px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs shrink-0 select-none shadow-2xs"
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
              Valuation: <strong className="text-text">₹{formatCurrency(selectedStats.totalLoss)}</strong>
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
            {(!hasShelfSelected || hasScrapSelected) && (
              <UIButton
                variant="outline"
                size="xs"
                onClick={handleReturnToSupplier}
                disabled={!isCurrentBranchSelected || !hasScrapSelected}
                startIcon={<Undo2 className="size-3" />}
                className={cn(
                  "h-7 text-[11px] font-bold shadow-xs",
                  (!isCurrentBranchSelected || !hasScrapSelected) && "opacity-50 cursor-not-allowed"
                )}
                title={
                  !isCurrentBranchSelected
                    ? `Select current branch (${currentBranch?.name || "Active Facility"}) only to return`
                    : !hasScrapSelected
                    ? "Shelf-expired items must first be moved to scrap bin before returning"
                    : "Return selected scrap items to supplier (Debit Note)"
                }
              >
                Return to Supplier {hasScrapSelected ? `(${selectedScrapItems.length})` : ""}
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

      {/* ── 5. Full-Width Data Table with Sticky Header ──────────── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col">
        <div
          ref={tableContainerRef}
          className="relative overflow-y-auto overflow-x-auto flex-1 min-h-0 divide-y divide-border/60"
        >
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full text-xs font-sans"
          >
            <UITableHeader
              sticky
              className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs border-b border-border"
            >
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
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
                <UITableHead sticky className="min-w-[130px]">Marketer / Brand</UITableHead>
                <UITableHead sticky className="min-w-[80px]">Pack</UITableHead>
                <UITableHead sticky className="min-w-[110px]">Batch No</UITableHead>
                <UITableHead sticky align="center" className="min-w-[95px]">Expiry</UITableHead>
                <UITableHead sticky className="min-w-[140px]">Source / Type</UITableHead>
                <UITableHead sticky align="right" className="min-w-[95px]">Quarantine Qty</UITableHead>
                <UITableHead sticky align="right" className="min-w-[90px]">MRP</UITableHead>
                <UITableHead sticky align="right" className="min-w-[100px]">Loss Value</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={selectedBranch === "all" ? 11 : 10} rows={10} />
              ) : filteredItems.length === 0 ? (
                <UITableEmpty
                  colSpan={selectedBranch === "all" ? 11 : 10}
                  title="No expired or scrap items found"
                  description={
                    hasActiveFilters
                      ? "No quarantined items match your active search or filters. Try clearing filters."
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
                filteredItems.map((row) => {
                  const isSelected = selectedIds.includes(row.uniqueRowId);

                  return (
                    <UITableRow
                      key={row.uniqueRowId}
                      onClick={() => handleToggleRow(row.uniqueRowId)}
                      className={cn(
                        "h-12 transition-colors cursor-pointer border-b border-border/60 hover:bg-surface-hover/70 last:border-b-0",
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

                      {/* Branch Name when viewing All Branches */}
                      {selectedBranch === "all" && (
                        <UITableCell className="py-2">
                          <span className="px-2 py-0.5 rounded-md bg-surface-alt border border-border text-[11px] font-semibold text-text-muted truncate inline-block max-w-[130px]">
                            {row.branchName}
                          </span>
                        </UITableCell>
                      )}

                      {/* Manufacturer */}
                      <UITableCell className="text-xs text-text-muted truncate">
                        {row.manufacturer}
                      </UITableCell>

                      {/* Pack */}
                      <UITableCell className="text-xs text-text-muted">
                        {row.pack}
                      </UITableCell>

                      {/* Batch No */}
                      <UITableCell className="font-mono text-xs text-text font-medium">
                        {row.batchNo}
                      </UITableCell>

                      {/* Expiry */}
                      <UITableCell align="center">
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 font-mono">
                          <XCircle className="size-3 shrink-0" />
                          {formatExpDate(row.expiryDate)}
                        </span>
                      </UITableCell>

                      {/* Source / Type Badge */}
                      <UITableCell>
                        {row.category === "broken" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            <AlertTriangle className="size-3" />
                            Scrap Bin: Broken
                          </span>
                        ) : row.category === "scrap_expired" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            <Trash2 className="size-3" />
                            Scrap Bin: Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                            <Calendar className="size-3" />
                            Shelf Expired Stock
                          </span>
                        )}
                      </UITableCell>

                      {/* Quarantined Qty */}
                      <UITableCell align="right" className="font-bold text-xs sm:text-sm font-mono">
                        <span className="px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold">
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
                })
              )}
            </UITableBody>
          </UITable>

          {/* Infinite Scroll loader */}
          {!isLoading && filteredItems.length > 0 && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                !hasMore && filteredItems.length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none">
                    ✓ All {totalCount} matching batches loaded
                  </span>
                ) : null
              }
            />
          )}
        </div>

        {/* Table Bottom Status Strip */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/70 bg-surface-alt/50 text-xs text-text-muted shrink-0">
          <div>
            Showing <strong className="text-text">{filteredItems.length}</strong> of{" "}
            <strong className="text-text">{totalCount}</strong> quarantined batches
          </div>

          <div className="flex items-center gap-2">
            <UIButton
              variant="ghost"
              size="xs"
              onClick={() => navigate(ROUTES.STOCK_METRICS)}
              startIcon={<ArrowLeft className="size-3" />}
              className="text-text-muted hover:text-text h-7"
            >
              Return to Stock Matrix
            </UIButton>
          </div>
        </div>
      </div>

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

      {/* Add Expired / Broken Stock Modal */}
      <AddExpiredBrokenStockModal
        open={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
        onSuccess={({ product, quantity, reason }) => {
          const prodName =
            typeof product?.name === "object"
              ? product.name?.name
              : product?.name || "Product";
          setToastMessage(
            `Successfully marked ${quantity} unit(s) of ${prodName} as ${reason} stock.`
          );
          setTimeout(() => setToastMessage(null), 4000);
          fetchExpiredItems(1, true);
        }}
      />
    </div>
  );
};

export default ExpiredScrapItemsDesktopPage;
