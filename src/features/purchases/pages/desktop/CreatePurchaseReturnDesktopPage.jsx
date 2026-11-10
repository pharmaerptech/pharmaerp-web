// src/features/purchases/pages/desktop/CreatePurchaseReturnDesktopPage.jsx

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Undo2,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Truck,
  Building2,
  Calendar,
  FileText,
  Boxes,
  ShieldCheck,
  Package,
  Receipt,
  X,
  BadgeAlert,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  UIPageHeader,
  UISectionHeader,
  UIInfoCard,
  UISummaryCard,
  UIAlert,
  UITabs,
  UIButton,
  UIIconButton,
  UIInput,
  UISearchInput,
  UIBadge,
  UIEmptyState,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  uiToast,
} from "@/components/ui";
import { SupplierSearchBar } from "@/features/parties/suppliers/components/SupplierSearchBar";
import { ReturnBoxLabelModal } from "../../components/ReturnBoxLabelModal";
import purchaseReturnService from "../../services/purchaseReturnService";
import useBranch from "@/features/branch/hooks/useBranch";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const CreatePurchaseReturnDesktopPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentBranch, activeBranchId } = useBranch();

  // Prefilled navigation state (e.g. from Expired & Scrap items page)
  const navState = location.state || {};
  const prefilledItems = navState.prefilledItems || [];
  const initialMotive = navState.returnMotive || "SELLABLE";

  // Form State
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [returnMotive, setReturnMotive] = useState(initialMotive);
  const [settlementType, setSettlementType] = useState("DEBIT_NOTE");
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState(navState.remarks || "");

  // Staged Line Items
  const [items, setItems] = useState([]);

  // Batch Search Autocomplete State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingBatches, setIsSearchingBatches] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBoxLabelModal, setShowBoxLabelModal] = useState(false);

  // Initialize from Prefilled State
  useEffect(() => {
    if (prefilledItems.length > 0) {
      const staged = prefilledItems.map((p, idx) => ({
        id: `prefilled-${idx}-${p.batchId || p.batchNo}`,
        productId: p.productId,
        productName: p.productName || "Product",
        pack: p.pack || "",
        batchId: p.batchId,
        batchNo: p.batchNo,
        expiry: p.expiry || "",
        purchaseBillId: p.purchaseBillId || null,
        purchaseBillNo: p.purchaseBillNo || "",
        sourceBin: p.sourceBin || (returnMotive === "BROKEN" ? "SCRAP_BROKEN" : "SCRAP_EXPIRED"),
        availableQty: Number(p.availableQty || p.returnQty || 1),
        returnQty: Number(p.returnQty || 1),
        rate: Number(p.rate || 0),
        discountPct: Number(p.discountPct || 0),
        gstPct: Number(p.gstPct || 12),
        supplier: p.supplier || null,
        supplierId: p.supplierId || p.supplier?._id || null,
        supplierName: p.supplierName || p.supplier?.businessName || "",
      }));
      setItems(staged);

      // Auto-select supplier immediately from prefilled items if available
      const firstWithSupplier = prefilledItems.find((p) => p.supplier || p.supplierId);
      if (firstWithSupplier) {
        const sup = firstWithSupplier.supplier || {
          _id: firstWithSupplier.supplierId,
          businessName: firstWithSupplier.supplierName || "Supplier",
          gstNumber: firstWithSupplier.supplierGst || "",
          mobile: firstWithSupplier.supplierMobile || "",
        };
        setSelectedSupplier(sup);
      }
    }
  }, [prefilledItems]);

  // Auto-resolve supplier for selected items if supplier is not yet set
  useEffect(() => {
    if (items.length > 0 && !selectedSupplier) {
      const itemWithSupplier = items.find((i) => i.supplier || i.supplierId);
      if (itemWithSupplier?.supplier) {
        setSelectedSupplier(itemWithSupplier.supplier);
        return;
      }
      if (itemWithSupplier?.supplierId) {
        setSelectedSupplier({
          _id: itemWithSupplier.supplierId,
          businessName: itemWithSupplier.supplierName || "Supplier",
          gstNumber: itemWithSupplier.supplierGst || "",
          mobile: itemWithSupplier.supplierMobile || "",
        });
        return;
      }

      // Query backend for the first batch to deduce its supplier
      const firstItem = items[0];
      if (firstItem?.batchNo) {
        purchaseReturnService
          .getEligibleBatches({
            branchId: activeBranchId,
            search: firstItem.batchNo,
            limit: 5,
          })
          .then((res) => {
            const list = res?.data?.data || res?.data || [];
            const matched =
              list.find(
                (b) =>
                  (firstItem.batchId && String(b.batchId) === String(firstItem.batchId)) ||
                  b.batchNo === firstItem.batchNo
              ) || list[0];
            if (matched?.supplier) {
              setSelectedSupplier(matched.supplier);
              uiToast.success(`Supplier auto-selected: ${matched.supplier.businessName || matched.supplier.name}`);
            }
          })
          .catch((err) => console.warn("Failed to auto-resolve supplier:", err));
      }
    }
  }, [items, selectedSupplier, activeBranchId]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch batches when searching
  const handleSearchBatches = useCallback(
    async (query) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearchingBatches(true);
      try {
        const sourceBinFilter =
          returnMotive === "SELLABLE"
            ? "SELLABLE"
            : returnMotive === "EXPIRED"
            ? "EXPIRED"
            : returnMotive === "BROKEN"
            ? "BROKEN"
            : "ALL";

        const res = await purchaseReturnService.getEligibleBatches({
          supplierId: selectedSupplier?._id || undefined,
          branchId: activeBranchId,
          search: query.trim(),
          sourceBin: sourceBinFilter,
          limit: 25,
        });

        const list = res?.data?.data || res?.data || [];
        setSearchResults(list);
        setShowSearchResults(true);
      } catch (err) {
        console.error("Failed to query eligible batches:", err);
      } finally {
        setIsSearchingBatches(false);
      }
    },
    [selectedSupplier, activeBranchId, returnMotive]
  );

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearchBatches(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearchBatches]);

  // Add Batch to Staged Items
  const handleSelectBatch = (b) => {
    const batchSupplier =
      b.supplier ||
      (b.supplierId
        ? {
            _id: b.supplierId,
            businessName: b.supplierName,
            gstNumber: b.supplierGst || "",
            mobile: b.supplierMobile || "",
          }
        : null);

    if (batchSupplier) {
      if (!selectedSupplier) {
        setSelectedSupplier(batchSupplier);
        uiToast.success(
          `Supplier auto-selected: ${batchSupplier.businessName || batchSupplier.name || "Supplier"}`
        );
      } else if (String(selectedSupplier._id) !== String(batchSupplier._id)) {
        uiToast.warning(
          `Note: "${b.productName}" was purchased from ${batchSupplier.businessName || "another supplier"}. Debit notes are supplier-specific.`
        );
      }
    }

    const existingIndex = items.findIndex((i) => i.batchId === b.batchId);
    if (existingIndex > -1) {
      uiToast.info(`Batch ${b.batchNo} is already in the return list.`);
      setShowSearchResults(false);
      setSearchQuery("");
      return;
    }

    const availableStock =
      returnMotive === "SELLABLE"
        ? b.availableShelfStock
        : returnMotive === "EXPIRED"
        ? b.expiredStock || b.availableScrapStock
        : returnMotive === "BROKEN"
        ? b.brokenStock || b.availableScrapStock
        : b.availableShelfStock || b.availableScrapStock;

    if (availableStock <= 0) {
      uiToast.error(`No stock available in chosen bin for batch ${b.batchNo}.`);
      return;
    }

    const maxReturnable = Math.min(
      availableStock,
      b.unreturnedBillQuota || availableStock
    );

    const newItem = {
      id: `item-${Date.now()}-${b.batchId}`,
      productId: b.productId,
      productName: b.productName,
      pack: b.pack,
      batchId: b.batchId,
      batchNo: b.batchNo,
      expiry: b.expiry,
      purchaseBillId: b.purchaseBillId || null,
      purchaseBillNo: b.purchaseBillNo || "",
      purchaseBillDate: b.purchaseBillDate || "",
      supplier: batchSupplier,
      supplierId: batchSupplier?._id || null,
      supplierName: batchSupplier?.businessName || batchSupplier?.name || "",
      sourceBin:
        returnMotive === "SELLABLE"
          ? "SELLABLE"
          : returnMotive === "BROKEN"
          ? "SCRAP_BROKEN"
          : "SCRAP_EXPIRED",
      availableQty: availableStock,
      maxReturnable,
      returnQty: 1,
      rate: Number(b.rate || 0),
      discountPct: 0,
      gstPct: Number(b.gstPct || 12),
    };

    setItems((prev) => [newItem, ...prev]);
    setSearchQuery("");
    setShowSearchResults(false);
    uiToast.success(`Added ${b.productName} (${b.batchNo}) to return.`);
  };

  // Modify Staged Item
  const handleUpdateItem = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index] };

      if (field === "returnQty") {
        const parsed = parseInt(value, 10);
        item.returnQty = isNaN(parsed) ? 1 : Math.max(1, parsed);
      } else if (field === "rate") {
        item.rate = Math.max(0, parseFloat(value) || 0);
      } else if (field === "discountPct") {
        item.discountPct = Math.min(100, Math.max(0, parseFloat(value) || 0));
      } else if (field === "sourceBin") {
        item.sourceBin = value;
      }

      copy[index] = item;
      return copy;
    });
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedTotals = useMemo(() => {
    let taxableSubtotal = 0;
    let totalGst = 0;

    items.forEach((item) => {
      const qty = Number(item.returnQty) || 0;
      const rate = Number(item.rate) || 0;
      const disc = Number(item.discountPct) || 0;
      const lineGross = qty * rate;
      const lineTaxable = lineGross - lineGross * (disc / 100);
      const lineTax = (lineTaxable * (Number(item.gstPct) || 0)) / 100;

      taxableSubtotal += lineTaxable;
      totalGst += lineTax;
    });

    const rawGrandTotal = taxableSubtotal + totalGst;
    const grandTotal = Math.round(rawGrandTotal);
    const roundOff = grandTotal - rawGrandTotal;

    return {
      taxableSubtotal: Number(taxableSubtotal.toFixed(2)),
      totalGst: Number(totalGst.toFixed(2)),
      roundOff: Number(roundOff.toFixed(2)),
      grandTotal,
    };
  }, [items]);

  // Multi-Supplier Grouping & Partitioning
  const [activeSupplierFilter, setActiveSupplierFilter] = useState("all");

  const supplierGroups = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      const supId =
        item.supplierId ||
        item.supplier?._id ||
        (selectedSupplier?._id ? selectedSupplier._id : "unknown");
      const supName =
        item.supplierName ||
        item.supplier?.businessName ||
        item.supplier?.name ||
        (supId === selectedSupplier?._id
          ? selectedSupplier?.businessName || selectedSupplier?.name
          : "Unassigned Supplier");
      const supGst =
        item.supplierGst ||
        item.supplier?.gstNumber ||
        (supId === selectedSupplier?._id ? selectedSupplier?.gstNumber : "");

      if (!groups[supId]) {
        groups[supId] = {
          supplierId: supId,
          supplier:
            item.supplier ||
            (supId === selectedSupplier?._id
              ? selectedSupplier
              : { _id: supId, businessName: supName, gstNumber: supGst }),
          supplierName: supName,
          supplierGst: supGst,
          items: [],
          taxableSubtotal: 0,
          totalGst: 0,
          grandTotal: 0,
        };
      }
      groups[supId].items.push(item);

      const qty = Number(item.returnQty) || 0;
      const rate = Number(item.rate) || 0;
      const disc = Number(item.discountPct) || 0;
      const lineGross = qty * rate;
      const lineTaxable = lineGross - lineGross * (disc / 100);
      const lineTax = (lineTaxable * (Number(item.gstPct) || 0)) / 100;

      groups[supId].taxableSubtotal += lineTaxable;
      groups[supId].totalGst += lineTax;
    });

    Object.values(groups).forEach((g) => {
      g.taxableSubtotal = Number(g.taxableSubtotal.toFixed(2));
      g.totalGst = Number(g.totalGst.toFixed(2));
      g.grandTotal = Math.round(g.taxableSubtotal + g.totalGst);
    });

    return groups;
  }, [items, selectedSupplier]);

  const supplierList = useMemo(() => Object.values(supplierGroups), [supplierGroups]);
  const isMultiSupplier = supplierList.length > 1;

  // Items to display based on supplier filter tab
  const displayedItems = useMemo(() => {
    if (activeSupplierFilter === "all") return items;
    return items.filter((item) => {
      const itemSupId =
        item.supplierId ||
        item.supplier?._id ||
        (selectedSupplier?._id ? selectedSupplier._id : "unknown");
      return itemSupId === activeSupplierFilter;
    });
  }, [items, activeSupplierFilter, selectedSupplier]);

  // Submit Purchase Return (Single or Multi-Debit Notes)
  const handleSubmitReturn = async () => {
    if (items.length === 0) {
      uiToast.error("Please add at least one item to return.");
      return;
    }

    // Verify all items have an identified supplier
    const unassignedItem = items.find(
      (i) => !i.supplierId && !i.supplier?._id && !selectedSupplier?._id
    );
    if (unassignedItem) {
      uiToast.error(`Please select a supplier for "${unassignedItem.productName}".`);
      return;
    }

    // Determine target groups (either all suppliers or selected supplier tab)
    const targetsToSubmit =
      activeSupplierFilter === "all"
        ? supplierList
        : supplierList.filter((g) => g.supplierId === activeSupplierFilter);

    setIsSubmitting(true);
    try {
      const createdNotes = [];
      const failedSuppliers = [];

      for (const group of targetsToSubmit) {
        const payload = {
          branchId: activeBranchId,
          supplierId: group.supplierId !== "unknown" ? group.supplierId : selectedSupplier._id,
          returnDate,
          returnMotive,
          settlementType,
          items: group.items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            pack: i.pack,
            batchId: i.batchId,
            batchNo: i.batchNo,
            expiry: i.expiry,
            purchaseBillId: i.purchaseBillId || undefined,
            purchaseBillNo: i.purchaseBillNo || undefined,
            sourceBin: i.sourceBin,
            returnQty: i.returnQty,
            rate: i.rate,
            discountPct: i.discountPct,
            gstPct: i.gstPct,
          })),
          reason,
          remarks,
        };

        try {
          const res = await purchaseReturnService.createPurchaseReturn(payload);
          const created = res.data?.data || res.data;
          createdNotes.push(
            `#${created?.debitNoteNo || created?.returnNo} (${group.supplierName})`
          );
        } catch (subErr) {
          console.error(`Failed to create return for ${group.supplierName}:`, subErr);
          failedSuppliers.push(group.supplierName);
        }
      }

      if (createdNotes.length > 0) {
        uiToast.success(
          `Successfully issued ${createdNotes.length} Debit Note${createdNotes.length > 1 ? "s" : ""}: ${createdNotes.join(", ")}`
        );
        navigate(ROUTES.PURCHASE_RETURNS);
      } else {
        uiToast.error(`Failed to issue Debit Notes for: ${failedSuppliers.join(", ")}`);
      }
    } catch (err) {
      console.error("Failed to create purchase return:", err);
      uiToast.error(
        err.response?.data?.message || err.message || "Failed to create purchase return"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const motiveTabs = [
    { id: "SELLABLE", label: "Sellable (Shelf)", icon: <Package className="size-3.5" /> },
    { id: "EXPIRED", label: "Expired Scrap", icon: <Trash2 className="size-3.5" /> },
    { id: "BROKEN", label: "Broken Scrap", icon: <AlertTriangle className="size-3.5" /> },
    { id: "MIXED", label: "Mixed", icon: <Boxes className="size-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-bg pb-20 font-sans">
      {/* 1. Sleek Sticky Header */}
      <UIPageHeader
        sticky
        backButton={{
          onClick: () => navigate(ROUTES.PURCHASE_RETURNS),
          label: "Returns",
        }}
        title="New Purchase Return"
        description="Issue GST Section 34 Debit Notes to vendors for shelf or quarantined scrap inventory"
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-soft text-primary border border-primary/20">
            <Building2 className="size-3.5" />
            {currentBranch?.name || "Active Facility"}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <UIButton
              variant="outline"
              size="sm"
              onClick={() => setShowBoxLabelModal(true)}
              disabled={items.length === 0}
              startIcon={<Package className="size-3.5" />}
              className="font-medium"
            >
              Transport Label
            </UIButton>

            <UIButton
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.PURCHASE_RETURNS)}
              disabled={isSubmitting}
            >
              Cancel
            </UIButton>

            <UIButton
              variant="primary"
              size="sm"
              onClick={handleSubmitReturn}
              disabled={isSubmitting || items.length === 0}
              startIcon={
                isSubmitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="size-3.5" />
                )
              }
              className="font-bold shadow-xs px-4"
            >
              {isSubmitting
                ? "Processing..."
                : isMultiSupplier
                ? `Issue ${supplierList.length} Debit Notes`
                : "Issue Debit Note"}
            </UIButton>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Sleek Context & Control Strip (Unified 1-Bar) */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Supplier Identity */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {isMultiSupplier ? (
              <div className="flex items-center gap-2 flex-wrap">
                <UIBadge variant="soft" color="warning" className="px-2.5 py-1 text-xs font-bold gap-1.5">
                  <Building2 className="size-3.5" />
                  {supplierList.length} Suppliers Detected
                </UIBadge>
                <span className="text-xs text-text-muted">
                  Auto-partitions into {supplierList.length} separate GST Debit Notes
                </span>
              </div>
            ) : selectedSupplier ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-xl bg-primary-soft border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                  <Truck className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-text truncate">
                      {selectedSupplier.businessName || selectedSupplier.name}
                    </span>
                    {selectedSupplier.gstNumber && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-alt border border-border text-text-muted font-medium">
                        GST: {selectedSupplier.gstNumber}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-text-muted block truncate">
                    {selectedSupplier.mobile ? `Phone: ${selectedSupplier.mobile}` : "Auto-selected creditor"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSupplier(null)}
                  className="text-xs text-primary hover:text-primary-hover font-semibold underline underline-offset-2 ml-1 cursor-pointer shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="flex-1 max-w-md">
                <SupplierSearchBar
                  selectedSupplier={selectedSupplier}
                  onSelectSupplier={(s) => setSelectedSupplier(s)}
                  placeholder="Select supplier (or search medicines below to auto-select)..."
                />
              </div>
            )}
          </div>

          {/* Right: Motive Segmented Tabs & Return Date */}
          <div className="flex items-center gap-3 shrink-0">
            <UITabs
              tabs={motiveTabs}
              activeTab={returnMotive}
              onChange={(tabId) => setReturnMotive(tabId)}
              variant="segmented"
              size="xs"
            />

            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              aria-label="Return Date"
              className="h-8 px-2.5 border border-border rounded-lg bg-surface text-xs font-mono font-medium text-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
            />
          </div>
        </div>

        {/* 3. Spotlight Medicine & Batch Fast Search Bar */}
        <div ref={searchContainerRef} className="relative">
          <div className="relative">
            <UISearchInput
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              placeholder="Scan barcode or type medicine name / batch number to stage for return..."
              size="lg"
            />
            {isSearchingBatches && (
              <Loader2 className="size-4 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 text-primary" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto divide-y divide-border/60">
              {searchResults.map((b) => (
                <button
                  key={b.batchId}
                  type="button"
                  onClick={() => handleSelectBatch(b)}
                  className="w-full text-left p-3.5 hover:bg-surface-hover flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div className="space-y-1 min-w-0 pr-4">
                    <div className="font-semibold text-text text-sm flex items-center gap-2">
                      <span className="truncate">{b.productName}</span>
                      {b.pack && (
                        <span className="text-xs font-normal text-text-muted shrink-0">
                          ({b.pack})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-3 flex-wrap">
                      <span>Batch: <strong className="font-mono text-text">{b.batchNo}</strong></span>
                      {b.expiry && <span>Exp: {b.expiry}</span>}
                      {b.purchaseBillNo && (
                        <span className="text-primary font-medium">Inflow Bill: #{b.purchaseBillNo}</span>
                      )}
                      {(b.supplierName || b.supplier?.businessName) && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Supplier: {b.supplierName || b.supplier?.businessName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-1 shrink-0">
                    <div className="text-sm font-bold text-text font-mono tabular-nums">
                      {formatCurrency(b.rate)}
                    </div>
                    <div className="text-xs flex items-center gap-1.5 justify-end">
                      <UIBadge variant={b.availableShelfStock > 0 ? "soft" : "outline"} color="primary" size="sm">
                        Shelf: {b.availableShelfStock}
                      </UIBadge>
                      {b.availableScrapStock > 0 && (
                        <UIBadge variant="soft" color="warning" size="sm">
                          Scrap: {b.availableScrapStock}
                        </UIBadge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Staged Line Items Table */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Boxes className="size-4 text-primary" />
              <h3 className="text-sm font-bold text-text">Return Line Items</h3>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-surface-alt text-text-muted border border-border">
                {items.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isMultiSupplier && (
                <div className="flex items-center gap-1 bg-surface-alt p-0.5 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setActiveSupplierFilter("all")}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors",
                      activeSupplierFilter === "all"
                        ? "bg-surface text-text shadow-xs"
                        : "text-text-muted hover:text-text"
                    )}
                  >
                    All ({supplierList.length} Notes)
                  </button>
                  {supplierList.map((g) => (
                    <button
                      key={g.supplierId}
                      type="button"
                      onClick={() => setActiveSupplierFilter(g.supplierId)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors",
                        activeSupplierFilter === g.supplierId
                          ? "bg-surface text-text shadow-xs"
                          : "text-text-muted hover:text-text"
                      )}
                    >
                      {g.supplierName} ({g.items.length})
                    </button>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <UIButton
                  variant="ghost"
                  size="xs"
                  onClick={() => setItems([])}
                  className="text-text-muted hover:text-error"
                >
                  Clear All
                </UIButton>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-12">
              <UIEmptyState
                icon={<Boxes className="size-8" />}
                title="No medicines staged for return"
                description="Search medicines above or select quarantined items directly from the Expired & Scrap items page."
                variant="dashed"
                size="md"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <UITable>
                <UITableHeader>
                  <UITableRow className="bg-surface-alt/60">
                    <UITableHead className="py-2.5 px-3 font-semibold text-text-muted uppercase text-[11px] text-center w-10">
                      #
                    </UITableHead>
                    <UITableHead className="py-2.5 px-3 font-semibold text-text-muted uppercase text-[11px]">
                      Medicine & Pack
                    </UITableHead>
                    <UITableHead className="py-2.5 px-3 font-semibold text-text-muted uppercase text-[11px]">
                      Batch & Expiry
                    </UITableHead>
                    <UITableHead className="py-2.5 px-3 font-semibold text-text-muted uppercase text-[11px]">
                      Supplier / Creditor
                    </UITableHead>
                    <UITableHead className="py-2.5 px-3 font-semibold text-text-muted uppercase text-[11px]">
                      Stock Bin
                    </UITableHead>
                    <UITableHead className="py-2.5 px-3 font-semibold text-text-muted uppercase text-[11px] text-center w-28">
                      Return Qty
                    </UITableHead>
                    <UITableHead className="py-2.5 px-3 font-semibold text-text-muted uppercase text-[11px] text-right w-24">
                      Rate (₹)
                    </UITableHead>
                    <UITableHead className="py-2.5 px-3 font-semibold text-text-muted uppercase text-[11px] text-right w-18">
                      Disc %
                    </UITableHead>
                    <UITableHead className="py-2.5 px-3 font-semibold text-text-muted uppercase text-[11px] text-right w-16">
                      GST %
                    </UITableHead>
                    <UITableHead className="py-2.5 px-3 font-semibold text-text-muted uppercase text-[11px] text-right w-28">
                      Total
                    </UITableHead>
                    <UITableHead className="py-2.5 px-3 font-semibold text-text-muted uppercase text-[11px] text-center w-12">
                      Action
                    </UITableHead>
                  </UITableRow>
                </UITableHeader>

                <UITableBody>
                  {displayedItems.map((item, idx) => {
                    const qty = Number(item.returnQty) || 0;
                    const rate = Number(item.rate) || 0;
                    const disc = Number(item.discountPct) || 0;
                    const lineGross = qty * rate;
                    const lineTaxable = lineGross - lineGross * (disc / 100);
                    const lineTotal =
                      lineTaxable + (lineTaxable * (Number(item.gstPct) || 0)) / 100;

                    return (
                      <tr key={item.id} className="hover:bg-surface-hover/80 transition-colors border-b border-border/40">
                        <td className="py-2.5 px-3 text-center text-text-muted font-mono text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-text text-xs block leading-tight">
                            {item.productName}
                          </span>
                          {item.pack && (
                            <span className="text-[11px] font-normal text-text-muted block mt-0.5">
                              Pack: {item.pack}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          <span className="font-semibold text-text block leading-tight">
                            {item.batchNo}
                          </span>
                          {item.expiry && (
                            <span className="text-[11px] font-sans text-text-muted block mt-0.5">
                              Exp: {item.expiry}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-xs text-text block leading-tight">
                            {item.supplierName || item.supplier?.businessName || selectedSupplier?.businessName || "Supplier"}
                          </span>
                          {(item.supplierGst || item.supplier?.gstNumber) && (
                            <span className="font-mono text-[10px] text-text-muted block mt-0.5">
                              GST: {item.supplierGst || item.supplier?.gstNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={item.sourceBin}
                            onChange={(e) =>
                              handleUpdateItem(idx, "sourceBin", e.target.value)
                            }
                            aria-label="Stock Bin"
                            className="h-7 px-2 border border-border/80 rounded-md bg-surface-alt/60 hover:bg-surface text-xs font-medium text-text focus:ring-1 focus:ring-primary focus:border-primary outline-hidden cursor-pointer"
                          >
                            <option value="SELLABLE">Shelf (Sellable)</option>
                            <option value="SCRAP_EXPIRED">Scrap (Expired)</option>
                            <option value="SCRAP_BROKEN">Scrap (Broken)</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItem(
                                  idx,
                                  "returnQty",
                                  Math.max(1, (Number(item.returnQty) || 1) - 1)
                                )
                              }
                              className="size-7 rounded-md border border-border bg-surface hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-text transition-colors cursor-pointer"
                              title="Decrease quantity"
                            >
                              <Minus className="size-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.returnQty}
                              onChange={(e) =>
                                handleUpdateItem(idx, "returnQty", e.target.value)
                              }
                              aria-label="Return Quantity"
                              className="w-12 h-7 text-center border border-border rounded-md bg-surface text-xs font-mono font-bold text-text focus:ring-1 focus:ring-primary focus:border-primary outline-hidden tabular-nums"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItem(
                                  idx,
                                  "returnQty",
                                  (Number(item.returnQty) || 0) + 1
                                )
                              }
                              className="size-7 rounded-md border border-border bg-surface hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-text transition-colors cursor-pointer"
                              title="Increase quantity"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) =>
                              handleUpdateItem(idx, "rate", e.target.value)
                            }
                            aria-label="Purchase Rate"
                            className="w-20 h-7 text-right px-2 border border-border/80 rounded-md bg-surface-alt/60 hover:bg-surface text-xs font-mono font-bold text-text focus:ring-1 focus:ring-primary focus:border-primary outline-hidden tabular-nums"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPct}
                            onChange={(e) =>
                              handleUpdateItem(idx, "discountPct", e.target.value)
                            }
                            aria-label="Discount Percentage"
                            className="w-14 h-7 text-right px-1.5 border border-border/80 rounded-md bg-surface-alt/60 hover:bg-surface text-xs font-mono text-text focus:ring-1 focus:ring-primary focus:border-primary outline-hidden tabular-nums"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs text-text-muted tabular-nums">
                          {item.gstPct}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-text font-mono text-xs tabular-nums">
                          {formatCurrency(lineTotal)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="size-7 inline-flex items-center justify-center rounded-md text-text-muted hover:text-error hover:bg-error-soft/30 transition-colors cursor-pointer"
                            title="Remove Item"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </UITableBody>
              </UITable>
            </div>
          )}
        </div>

        {/* 5. Notes & Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-2">
              <label className="text-xs font-bold text-text uppercase tracking-wider block">
                Reason & Transporter Notes
              </label>
              <textarea
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add courier/transporter details, carton numbers, or return reason..."
                className="w-full p-3 border border-border rounded-xl bg-surface-alt/40 text-xs font-medium text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-hidden resize-none"
              />
            </div>

            {/* GST Compliance Micro-strip */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-primary-soft/40 border border-primary/20 text-xs text-text-muted">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span>
                <strong>GST Section 34 Compliance:</strong> Confirming will post an Accounts Payable Debit Note and generate a negative GSTR-2 ledger entry for Input Tax Credit reversal.
              </span>
            </div>
          </div>

          <div>
            <UISummaryCard
              title={
                isMultiSupplier
                  ? `Summary: ${supplierList.length} Debit Notes`
                  : "Debit Note Financial Summary"
              }
              subtitle={
                isMultiSupplier
                  ? "Multi-Vendor Auto-Partitioned"
                  : "Direct Vendor AP Adjustment"
              }
              items={[
                ...(isMultiSupplier
                  ? supplierList.map((g, idx) => ({
                      label: `Note ${idx + 1}: ${g.supplierName}`,
                      value: `₹${formatCurrency(g.grandTotal)}`,
                      isHighlight: true,
                    }))
                  : []),
                {
                  label: isMultiSupplier ? "Combined Taxable Subtotal" : "Taxable Subtotal",
                  value: formatCurrency(calculatedTotals.taxableSubtotal),
                },
                {
                  label: "Total GST (ITC Reversal)",
                  value: formatCurrency(calculatedTotals.totalGst),
                  isDeduction: true,
                },
                ...(calculatedTotals.roundOff !== 0
                  ? [
                      {
                        label: "Round Off",
                        value: `${calculatedTotals.roundOff > 0 ? "+" : ""}${calculatedTotals.roundOff}`,
                      },
                    ]
                  : []),
              ]}
              total={{
                label: isMultiSupplier ? "Total Combined Debit" : "Net Debit Amount",
                value: formatCurrency(calculatedTotals.grandTotal),
                subtext: isMultiSupplier
                  ? `Will generate ${supplierList.length} GST Debit Notes`
                  : "Credited to Supplier Balance",
              }}
              variant="card"
              footer={
                <div className="space-y-2 mt-2">
                  <UIButton
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={handleSubmitReturn}
                    disabled={isSubmitting || items.length === 0}
                    startIcon={
                      isSubmitting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="size-4" />
                      )
                    }
                    className="font-bold shadow-xs"
                  >
                    {isSubmitting
                      ? "Processing..."
                      : isMultiSupplier
                      ? `Confirm & Issue ${supplierList.length} Debit Notes`
                      : "Confirm & Issue Debit Note"}
                  </UIButton>

                  <UIButton
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => setShowBoxLabelModal(true)}
                    disabled={items.length === 0}
                    startIcon={<Package className="size-3.5" />}
                    className="font-medium"
                  >
                    Create Transport Box Label
                  </UIButton>
                </div>
              }
            />
          </div>
        </div>
      </div>

      {/* Transport Box Labels Generator Modal */}
      {showBoxLabelModal && (
        <ReturnBoxLabelModal
          isOpen={showBoxLabelModal}
          onClose={() => setShowBoxLabelModal(false)}
          returnRecord={{
            debitNoteNo: isMultiSupplier ? `DN-MULTI (${supplierList.length} Notes)` : "DN-STAGED",
            returnNo: "PR-PENDING",
            returnDate,
            returnMotive,
            supplier: selectedSupplier || (supplierList[0] ? { businessName: supplierList[0].supplierName, gstNumber: supplierList[0].supplierGst } : null),
            branch: currentBranch,
            items,
          }}
        />
      )}
    </div>
  );
};

export default CreatePurchaseReturnDesktopPage;
