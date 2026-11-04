// src/features/stock-metrics/pages/mobile/ExpiredScrapItemsMobilePage.jsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Trash2,
  Calendar,
  AlertTriangle,
  Download,
  CheckCircle2,
  RotateCcw,
  Building2,
  Filter,
  Truck,
} from "lucide-react";

import {
  UIButton,
  UIInput,
  UISelect,
  UIDatePicker,
  UICheckbox,
  UILoadingState,
} from "@/components/ui";
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

const EXPIRY_PRESET_OPTIONS = [
  { label: "All Expiry Dates", value: "all" },
  { label: "Expired This Month", value: "this_month" },
  { label: "Expired in Last 30 Days", value: "last_30_days" },
  { label: "Expired in Last 90 Days", value: "last_90_days" },
  { label: "Expired > 180 Days Ago", value: "past_180_days" },
  { label: "Custom Date Range", value: "custom" },
];

export const ExpiredScrapItemsMobilePage = () => {
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

  // Data states
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMotive, setFilterMotive] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Expiry date filter states
  const [expiryPreset, setExpiryPreset] = useState("all");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

  // Show / Hide filter controls drawer/section
  const [showFilters, setShowFilters] = useState(false);

  // Fetch expired and scrap items
  const fetchExpiredItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = {
        page: 1,
        limit: 300,
        companyId: activeCompanyId,
        filters: {
          ...(selectedBranch && selectedBranch !== "all" ? { facility: selectedBranch } : {}),
          expiredOnly: true,
        },
      };

      const res = await workspaceProductService.getProductFacilityBatchesByQueryV2(payload);
      const rawList = res?.data?.data?.batches || [];

      const parsedList = [];
      const now = new Date();
      const currMonth = now.getMonth() + 1;
      const currYear = now.getFullYear();

      rawList.forEach((b, idx) => {
        const pName = typeof b.name === "object" ? b.name?.name : (b.name || b.productName || "Unknown");
        const pCode = b.productCode || b.workspaceProductCode || b.code || "—";
        const mfg = typeof b.manufacturer === "object" ? b.manufacturer?.name : (b.manufacturer || b.marketer || "—");
        const pack = typeof b.pack === "object" ? b.pack?.name : (b.pack || "PCS");

        const shelfStock = Number(b.batchQty || b.qty || 0);
        const scrapStock = Number(b.scrapQty || 0);
        const brokenStock = Number(b.brokenQty || 0);
        const expReturnStock = Number(b.expiredQty || 0);

        const dObj = parseDateSafely(b.expiryDate);
        let isDateExpired = false;
        if (dObj) {
          const expM = dObj.getMonth() + 1;
          const expY = dObj.getFullYear();
          isDateExpired = expY < currYear || (expY === currYear && expM <= currMonth);
        }

        const hasScrap = scrapStock > 0 || brokenStock > 0 || expReturnStock > 0;
        const hasShelfExpired = isDateExpired && shelfStock > 0;

        if (hasScrap || hasShelfExpired) {
          const mrp = Number(b.mrp || b.MRP || 0);
          const rateA = Number(b.rateA || b.rate || 0);
          const affectedQty = hasScrap ? scrapStock : shelfStock;
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

          parsedList.push({
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
          });
        }
      });

      setItems(parsedList);
      setSelectedIds([]);
    } catch (err) {
      console.error("Failed to fetch expired items mobile:", err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeCompanyId, selectedBranch, branches, currentBranch]);

  useEffect(() => {
    fetchExpiredItems();
  }, [fetchExpiredItems]);

  // Filtered list (Search, Motive Tab & Expiry Date Range)
  const filteredItems = useMemo(() => {
    let result = items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          i.productCode.toLowerCase().includes(q) ||
          i.batchNo.toLowerCase().includes(q) ||
          (i.branchName && i.branchName.toLowerCase().includes(q))
      );
    }

    if (filterMotive === "shelf_expired") {
      result = result.filter((i) => i.category === "shelf_expired");
    } else if (filterMotive === "scrap_expired") {
      result = result.filter((i) => i.category === "scrap_expired");
    } else if (filterMotive === "broken") {
      result = result.filter((i) => i.category === "broken");
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
  }, [items, searchQuery, filterMotive, expiryPreset, customFromDate, customToDate]);

  const handleToggleRow = (rowId) => {
    setSelectedIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  // Active filter state
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
    const listToExport =
      selectedIds.length > 0
        ? items.filter((i) => selectedIds.includes(i.uniqueRowId))
        : filteredItems;
    if (listToExport.length === 0) return;

    const headers = [
      "Product Name",
      "Item Code",
      "Branch",
      "Manufacturer",
      "Pack",
      "Batch No",
      "Expiry Date",
      "Quarantine Reason",
      "Affected Qty",
      "MRP (INR)",
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
      `"${i.category}"`,
      i.affectedQty,
      i.mrp.toFixed(2),
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
      `PharmaERP_Expired_Register_Mobile_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage(`Exported ${listToExport.length} items to CSV.`);
    setTimeout(() => setToastMessage(null), 2500);
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
        `Select current branch (${currentBranch?.name || "Active Facility"}) only to create transfer order.`
      );
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    const listToTransfer = selectedItems.length > 0 ? selectedItems : [];
    if (listToTransfer.length === 0) {
      setToastMessage("Please select at least one expired or scrap batch to transfer.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const foreignBranchItem = listToTransfer.find((i) => {
      const itemBranchId = i.branch_id?._id || i.branch_id || i.branchId;
      return itemBranchId && String(itemBranchId) !== String(activeBranchId);
    });
    if (foreignBranchItem) {
      setToastMessage(
        `Cannot transfer stock from "${foreignBranchItem.branchName || "another branch"}". Select current branch only.`
      );
      setTimeout(() => setToastMessage(null), 4000);
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

  const MOTIVE_TABS = [
    { id: "all", label: "All Items", count: items.length },
    {
      id: "shelf_expired",
      label: "Shelf Expired",
      count: items.filter((i) => i.category === "shelf_expired").length,
    },
    {
      id: "scrap_expired",
      label: "Scrap Returns",
      count: items.filter((i) => i.category === "scrap_expired").length,
    },
    {
      id: "broken",
      label: "Broken",
      count: items.filter((i) => i.category === "broken").length,
    },
  ];

  return (
    <div className="w-full min-h-[100dvh] flex flex-col bg-bg text-text pb-20 select-none">
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 left-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-alt border border-primary/30 shadow-lg text-text text-xs font-semibold"
          >
            <CheckCircle2 className="size-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile Header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-surface border-b border-border shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => navigate(ROUTES.STOCK_METRICS)}
            className="size-9 rounded-lg border border-border flex items-center justify-center text-text-muted hover:text-text shrink-0 active:scale-95 transition-all"
            aria-label="Back to Stock Matrix"
          >
            <ArrowLeft className="size-4.5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-text truncate leading-tight">
              Expired & Scrap Items
            </h1>
            <p className="text-[10.5px] text-text-muted truncate">
              {currentBranchLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <UIButton
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters((prev) => !prev)}
            className={cn(
              "size-9 p-0 border rounded-lg",
              showFilters || hasActiveFilters
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border text-text-muted"
            )}
            title="Toggle Filters"
          >
            <Filter className="size-4" />
          </UIButton>

          <UIButton
            variant="ghost"
            size="sm"
            onClick={fetchExpiredItems}
            disabled={isLoading}
            className="size-9 p-0 text-text-muted border border-border rounded-lg"
            title="Refresh"
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin text-primary")} />
          </UIButton>
        </div>
      </div>

      {/* ── Search & Filter Controls ──────────────────────────────────── */}
      <div className="p-3 flex flex-col gap-2.5 bg-surface border-b border-border">
        {/* Search Input */}
        <UIInput
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search product, code, or batch..."
          startIcon={<Search className="size-4 text-text-muted" />}
          size="sm"
          variant="outline"
          isClearable
          onClear={() => setSearchQuery("")}
          className="w-full h-9.5 text-xs"
        />

        {/* Collapsible / Expandable Branch & Expiry Filters */}
        <AnimatePresence>
          {(showFilters || hasActiveFilters) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col gap-2 pt-1 overflow-hidden"
            >
              {/* Branch Select */}
              <div className="w-full">
                <UISelect
                  value={selectedBranch}
                  onChange={(val) => setSelectedBranch(val?.target ? val.target.value : val)}
                  options={branchOptions}
                  startIcon={<Building2 className="size-3.5 text-text-muted" />}
                  size="sm"
                  placeholder="Select Branch"
                />
              </div>

              {/* Expiry Preset Select */}
              <div className="w-full">
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
                <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in-50 duration-200">
                  <UIDatePicker
                    value={customFromDate}
                    onChange={(val) => setCustomFromDate(val || "")}
                    placeholder="From Expiry"
                    size="sm"
                    isClearable
                  />
                  <UIDatePicker
                    value={customToDate}
                    onChange={(val) => setCustomToDate(val || "")}
                    placeholder="To Expiry"
                    size="sm"
                    isClearable
                  />
                </div>
              )}

              {/* Reset Active Filters Button */}
              {hasActiveFilters && (
                <div className="flex justify-end pt-0.5">
                  <UIButton
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleResetFilters}
                    startIcon={<RotateCcw className="size-3 text-text-muted" />}
                    className="h-7 text-[11px] text-text-muted hover:text-text"
                  >
                    Reset all filters
                  </UIButton>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Motive Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {MOTIVE_TABS.map((tab) => {
            const isSelected = filterMotive === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMotive(tab.id)}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all min-h-[36px]",
                  isSelected
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                    : "bg-surface-alt border-border text-text-muted"
                )}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono font-bold">({tab.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Mobile Card List ──────────────────────────────────────── */}
      <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-y-auto">
        {isLoading ? (
          <UILoadingState text="Loading quarantined items..." />
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-text-muted">
            <Trash2 className="size-10 mx-auto text-text-muted/40 mb-2 stroke-[1.5]" />
            <div className="text-sm font-semibold text-text">No expired items found</div>
            <div className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
              {hasActiveFilters
                ? "No items match your active filters. Try clearing or relaxing filters."
                : "There are no expired shelf batches or scrap bin returns in this branch."}
            </div>
            {hasActiveFilters && (
              <UIButton
                variant="secondary"
                size="sm"
                onClick={handleResetFilters}
                className="mt-3 mx-auto"
              >
                Clear Filters
              </UIButton>
            )}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = selectedIds.includes(item.uniqueRowId);

            return (
              <div
                key={item.uniqueRowId}
                onClick={() => handleToggleRow(item.uniqueRowId)}
                className={cn(
                  "p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2",
                  isSelected
                    ? "bg-rose-500/10 border-rose-500/30 shadow-xs"
                    : "bg-surface border-border hover:bg-surface-alt/60 shadow-2xs"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className="pt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <UICheckbox
                      checked={isSelected}
                      onChange={() => handleToggleRow(item.uniqueRowId)}
                      size="sm"
                      color="primary"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-text truncate leading-tight">
                      {item.productName}
                    </div>
                    <div className="text-[11px] text-text-muted truncate mt-0.5">
                      {item.manufacturer} • {item.pack}
                    </div>
                    {selectedBranch === "all" && item.branchName && (
                      <div className="mt-1">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-surface-alt border border-border text-text-muted inline-block">
                          {item.branchName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono">
                      {item.affectedQty} units
                    </span>
                    <div className="text-[10px] text-text-muted font-mono mt-0.5">
                      ₹{formatCurrency(item.lossValue)}
                    </div>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="flex items-center justify-between pt-1.5 border-t border-border/60 text-[11px]">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-text-muted">Batch:</span>
                    <strong className="text-text">{item.batchNo}</strong>
                  </div>

                  <div className="flex items-center gap-1 font-mono">
                    <span className="text-text-muted">Exp:</span>
                    <span className="text-rose-600 font-bold">{formatExpDate(item.expiryDate)}</span>
                  </div>

                  <div>
                    {item.category === "broken" ? (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-700 border border-rose-500/20">
                        Broken
                      </span>
                    ) : item.category === "scrap_expired" ? (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                        Scrap Return
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-700 border border-purple-500/20">
                        Shelf Expired
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Sticky Bottom Selection Actions Bar ─────────────────────── */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-surface/95 backdrop-blur-md border-t border-border shadow-lg flex items-center justify-between gap-2"
        >
          <div className="text-xs">
            <span className="font-bold text-rose-600 font-mono">{selectedIds.length}</span>{" "}
            <span className="text-text-muted">selected</span>
          </div>

          <div className="flex items-center gap-2">
            <UIButton
              variant="primary"
              size="sm"
              onClick={handleCreateTransferOrder}
              disabled={!isCurrentBranchSelected}
              startIcon={<Truck className="size-3.5" />}
              className={cn(
                "h-8.5 text-xs font-bold",
                !isCurrentBranchSelected && "opacity-50 cursor-not-allowed"
              )}
              title={
                !isCurrentBranchSelected
                  ? `Select current branch (${currentBranch?.name || "Active Facility"}) only to transfer`
                  : "Transfer selected items"
              }
            >
              Transfer
            </UIButton>
            <UIButton
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              startIcon={<Download className="size-3.5" />}
              className="h-8.5 text-xs font-semibold"
            >
              Export
            </UIButton>
            <UIButton
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="h-8.5 text-xs text-text-muted"
            >
              Clear
            </UIButton>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ExpiredScrapItemsMobilePage;
