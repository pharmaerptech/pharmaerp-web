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
  ChevronRight,
  ChevronDown,
  Layers,
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
  UICheckbox,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  uiToast,
} from "@/components/ui";
import { IncomingItemBadge, GroupByDropdown, groupInventoryItems } from "@/components/common";
import { SupplierSearchBar } from "@/features/parties/suppliers/components/SupplierSearchBar";
import { ReturnBoxLabelModal } from "../../components/ReturnBoxLabelModal";
import purchaseReturnService from "../../services/purchaseReturnService";
import useBranch from "@/features/branch/hooks/useBranch";
import useCompany from "@/features/company/hooks/useCompany";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const cleanBatchNo = (val) =>
  String(val || "")
    .replace(/\s*\[(EXPIRED|BROKEN|SCRAP|FRESH_RETURN|IN|INCOMING)\]/gi, "")
    .trim();

export const CreatePurchaseReturnDesktopPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentBranch, activeBranchId } = useBranch();
  const { currentCompany } = useCompany();

  const isValidSubSupplier = (subName, mainName) => {
    if (!subName) return false;
    const s = String(subName).trim().toLowerCase();
    if (!s) return false;
    const curCompName = String(currentCompany?.name || "").trim().toLowerCase();
    const curCompLegal = String(currentCompany?.legalName || "").trim().toLowerCase();
    if ((curCompName && s === curCompName) || (curCompLegal && s === curCompLegal)) return false;
    const m = String(mainName || "").trim().toLowerCase();
    if (m && s === m) return false;
    return true;
  };

  // Prefilled navigation state (e.g. from Expired & Scrap items page)
  const navState = location.state || {};
  const prefilledItems = navState.prefilledItems || [];
  const initialMotive = navState.returnMotive || "SELLABLE";
  const isCreditNoteMode =
    navState.returnMode === "CREDIT_NOTE" ||
    navState.settlementType === "CREDIT_NOTE";

  const sourceBranchId = navState.sourceBranchId || prefilledItems[0]?.sourceBranchId || null;
  const sourceBranchName = navState.sourceBranchName || prefilledItems[0]?.sourceBranchName || "";
  const sourceTransferOrderId = navState.sourceTransferOrderId || prefilledItems[0]?.sourceTransferOrderId || null;
  const sourceTransferOrderNo = navState.sourceTransferOrderNo || prefilledItems[0]?.sourceTransferOrderNo || "";

  // Form State
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [returnMotive, setReturnMotive] = useState(initialMotive);
  const [settlementType, setSettlementType] = useState(
    isCreditNoteMode ? "CREDIT_NOTE" : (navState.settlementType || "DEBIT_NOTE")
  );
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState(navState.remarks || "");

  // Staged Line Items & Selection
  const [items, setItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  // Group By State
  const [groupBy, setGroupBy] = useState("none");
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

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
        batchNo: cleanBatchNo(p.batchNo),
        expiry: p.expiry || "",
        purchaseBillId: p.purchaseBillId || null,
        purchaseBillNo: p.purchaseBillNo || "",
        sourceBin:
          p.sourceBin ||
          (returnMotive === "SELLABLE"
            ? (p.availableScrapStock > 0 || p.scrapStock > 0 ? "SCRAP_FRESH" : "SELLABLE")
            : returnMotive === "BROKEN"
            ? "SCRAP_BROKEN"
            : "SCRAP_EXPIRED"),
        availableQty: Number(p.availableQty || p.returnQty || 1),
        returnQty: Number(p.returnQty || 1),
        rate: Number(p.rate || 0),
        discountPct: Number(p.discountPct || 0),
        gstPct: Number(5),
        supplier: p.supplier || null,
        supplierId: p.supplierId || p.supplier?._id || null,
        supplierName: p.supplierName || p.supplier?.businessName || "",
        supplierGst: p.supplierGst || p.supplier?.gstNumber || "",
        subSupplier: p.subSupplier || null,
        subSupplierId: isValidSubSupplier(p.subSupplierName, p.supplierName || p.supplier?.businessName)
          ? p.subSupplierId || p.subSupplier?._id || null
          : null,
        subSupplierName: isValidSubSupplier(p.subSupplierName, p.supplierName || p.supplier?.businessName)
          ? p.subSupplierName
          : "",
        subSupplierGst: isValidSubSupplier(p.subSupplierName, p.supplierName || p.supplier?.businessName)
          ? p.subSupplierGst || p.subSupplier?.gstNumber || ""
          : "",
        isIncoming: Boolean(p.isIncoming || isCreditNoteMode),
        sourceBranchId: p.sourceBranchId || sourceBranchId || null,
        sourceBranchName: p.sourceBranchName || sourceBranchName || "",
        sourceBranchCode: p.sourceBranchCode || "",
        sourceTransferOrderId: p.sourceTransferOrderId || sourceTransferOrderId || null,
        sourceTransferOrderNo: p.sourceTransferOrderNo || sourceTransferOrderNo || "",
        category: p.category || (returnMotive === "BROKEN" ? "broken" : returnMotive === "SELLABLE" ? "fresh_return" : "scrap_expired"),
      }));
      setItems(staged);
      setSelectedItemIds(staged.map((i) => i.id));

      // Auto-select supplier immediately from prefilled items if available (Debit Note mode only)
      if (!isCreditNoteMode) {
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
    }
  }, [prefilledItems, isCreditNoteMode, returnMotive, sourceBranchId, sourceBranchName, sourceTransferOrderId, sourceTransferOrderNo]);

  // Auto-resolve supplier for selected items if supplier is not yet set
  useEffect(() => {
    if (isCreditNoteMode) return;
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
      batchNo: cleanBatchNo(b.batchNo),
      expiry: b.expiry,
      purchaseBillId: b.purchaseBillId || null,
      purchaseBillNo: b.purchaseBillNo || "",
      purchaseBillDate: b.purchaseBillDate || "",
      supplier: batchSupplier,
      supplierId: batchSupplier?._id || null,
      supplierName: batchSupplier?.businessName || batchSupplier?.name || "",
      supplierGst: batchSupplier?.gstNumber || "",
      subSupplier: b.subSupplier || null,
      subSupplierId: isValidSubSupplier(b.subSupplierName, batchSupplier?.businessName || batchSupplier?.name)
        ? b.subSupplierId || b.subSupplier?._id || null
        : null,
      subSupplierName: isValidSubSupplier(b.subSupplierName, batchSupplier?.businessName || batchSupplier?.name)
        ? b.subSupplierName
        : "",
      subSupplierGst: isValidSubSupplier(b.subSupplierName, batchSupplier?.businessName || batchSupplier?.name)
        ? b.subSupplierGst || b.subSupplier?.gstNumber || ""
        : "",
      sourceBin:
        returnMotive === "SELLABLE"
          ? (b.availableShelfStock > 0 ? "SELLABLE" : "SCRAP_FRESH")
          : returnMotive === "BROKEN"
          ? "SCRAP_BROKEN"
          : "SCRAP_EXPIRED",
      availableQty: availableStock,
      maxReturnable,
      returnQty: 1,
      rate: Number(b.rate || 0),
      discountPct: 0,
      gstPct: Number(5),
      isIncoming: Boolean(b.isIncoming),
      sourceBranchId: b.sourceBranchId || null,
      sourceBranchName: b.sourceBranchName || "",
      sourceBranchCode: b.sourceBranchCode || "",
      sourceTransferOrderId: b.sourceTransferOrderId || null,
      sourceTransferOrderNo: b.sourceTransferOrderNo || "",
      category: returnMotive === "BROKEN" ? "broken" : returnMotive === "SELLABLE" ? "fresh_return" : "scrap_expired",
    };

    setItems((prev) => [newItem, ...prev]);
    setSelectedItemIds((prev) => [...prev, newItem.id]);
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
    const itemToRemove = items[index];
    if (itemToRemove) {
      setSelectedItemIds((prev) => prev.filter((id) => id !== itemToRemove.id));
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Active items currently checked for return
  const activeItems = useMemo(() => {
    return items.filter((i) => selectedItemIds.includes(i.id));
  }, [items, selectedItemIds]);

  // Calculations
  const calculatedTotals = useMemo(() => {
    let taxableSubtotal = 0;
    let totalGst = 0;

    activeItems.forEach((item) => {
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
  }, [activeItems]);

  // Multi-Supplier Grouping & Partitioning
  const [activeSupplierFilter, setActiveSupplierFilter] = useState("all");

  const supplierGroups = useMemo(() => {
    const groups = {};
    activeItems.forEach((item) => {
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
  }, [activeItems, selectedSupplier]);

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

  // Checkbox selection helpers for staged items
  const isAllSelected =
    displayedItems.length > 0 &&
    displayedItems.every((i) => selectedItemIds.includes(i.id));
  const isSomeSelected =
    displayedItems.some((i) => selectedItemIds.includes(i.id)) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      const displayedItemIds = new Set(displayedItems.map((i) => i.id));
      setSelectedItemIds((prev) => prev.filter((id) => !displayedItemIds.has(id)));
    } else {
      const displayedItemIds = displayedItems.map((i) => i.id);
      setSelectedItemIds((prev) => Array.from(new Set([...prev, ...displayedItemIds])));
    }
  };

  const handleToggleItemSelection = (id) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Submit Purchase Return (Single, Multi-Debit Notes, or Inter-Branch Credit Note)
  const handleSubmitReturn = async () => {
    if (activeItems.length === 0) {
      uiToast.error("Please select at least one item to return.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreditNoteMode) {
        // Inter-Branch Credit Note Workflow
        const payload = {
          branchId: activeBranchId,
          sourceBranchId: sourceBranchId || activeItems[0]?.sourceBranchId || undefined,
          sourceTransferOrderId: sourceTransferOrderId || activeItems[0]?.sourceTransferOrderId || undefined,
          isInterBranch: true,
          returnDate,
          returnMotive,
          settlementType: "CREDIT_NOTE",
          items: activeItems.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            pack: i.pack,
            batchId: i.batchId,
            batchNo: cleanBatchNo(i.batchNo),
            expiry: i.expiry,
            sourceBin: i.sourceBin,
            returnQty: i.returnQty,
            rate: i.rate,
            discountPct: i.discountPct,
            gstPct: i.gstPct,
            isIncoming: Boolean(i.isIncoming),
            sourceBranchId: i.sourceBranchId || undefined,
            sourceTransferOrderNo: i.sourceTransferOrderNo || undefined,
            sourceTransferOrderId: i.sourceTransferOrderId || undefined,
            subSupplierId: isValidSubSupplier(i.subSupplierName, i.supplierName)
              ? i.subSupplierId || i.subSupplier?._id || undefined
              : undefined,
            subSupplierName: isValidSubSupplier(i.subSupplierName, i.supplierName)
              ? i.subSupplierName || i.subSupplier?.businessName || i.subSupplier?.name || undefined
              : undefined,
            subSupplierGst: isValidSubSupplier(i.subSupplierName, i.supplierName)
              ? i.subSupplierGst || i.subSupplier?.gstNumber || undefined
              : undefined,
          })),
          reason: reason || `Inter-branch return of incoming stock (${activeItems.length} items)`,
          remarks,
        };

        const res = await purchaseReturnService.createPurchaseReturn(payload);
        const created = res.data?.data || res.data;
        uiToast.success(
          `Successfully issued Inter-Branch Credit Note #${created?.creditNoteNo || created?.returnNo || "CN"}`
        );
        navigate(ROUTES.PURCHASE_RETURNS);
        return;
      }

      // Standard External Supplier Return (Debit Note)
      // Verify all items have an identified supplier
      const unassignedItem = activeItems.find(
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
            batchNo: cleanBatchNo(i.batchNo),
            expiry: i.expiry,
            purchaseBillId: i.purchaseBillId || undefined,
            purchaseBillNo: i.purchaseBillNo || undefined,
            sourceBin: i.sourceBin,
            returnQty: i.returnQty,
            rate: i.rate,
            discountPct: i.discountPct,
            gstPct: i.gstPct,
            isIncoming: Boolean(i.isIncoming),
            sourceBranchId: i.sourceBranchId || undefined,
            sourceTransferOrderNo: i.sourceTransferOrderNo || undefined,
            sourceTransferOrderId: i.sourceTransferOrderId || undefined,
            subSupplierId: isValidSubSupplier(i.subSupplierName, i.supplierName)
              ? i.subSupplierId || i.subSupplier?._id || undefined
              : undefined,
            subSupplierName: isValidSubSupplier(i.subSupplierName, i.supplierName)
              ? i.subSupplierName || i.subSupplier?.businessName || i.subSupplier?.name || undefined
              : undefined,
            subSupplierGst: isValidSubSupplier(i.subSupplierName, i.supplierName)
              ? i.subSupplierGst || i.subSupplier?.gstNumber || undefined
              : undefined,
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
        title={isCreditNoteMode ? "Create Inter-Branch Credit Note (Incoming 📦 Stock)" : "New Purchase Return"}
        description={
          isCreditNoteMode
            ? "Issue an inter-branch Credit Note for stock received from another store/branch (Atomic destination scrap deduction)"
            : "Issue GST Section 34 Debit Notes to vendors for shelf or quarantined scrap inventory"
        }
        badge={
          isCreditNoteMode ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <span role="img" aria-label="Incoming Box">📦</span>
              Inter-Branch Incoming Stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-soft text-primary border border-primary/20">
              <Building2 className="size-3.5" />
              {currentBranch?.name || "Active Facility"}
            </span>
          )
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
              disabled={isSubmitting || activeItems.length === 0}
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
                : isCreditNoteMode
                ? `Issue Credit Note (${activeItems.length})`
                : isMultiSupplier
                ? `Issue ${supplierList.length} Debit Notes`
                : `Issue Debit Note (${activeItems.length})`}
            </UIButton>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* Sleek Context & Control Strip (Unified 1-Bar) */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Supplier Identity OR Inter-Branch Source Facility */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {isCreditNoteMode ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-400 text-lg">
                  📦
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-text truncate">
                      Originating Facility: {sourceBranchName || "Inter-Branch Originating Store"}
                    </span>
                    <UIBadge variant="soft" color="warning" size="xs">
                      Inter-Branch Counterparty
                    </UIBadge>
                  </div>
                  <span className="text-[11px] text-text-muted block truncate font-mono">
                    {sourceTransferOrderNo ? `Transfer Reference: #${sourceTransferOrderNo}` : "Incoming Quarantined Stock Settlement"}
                  </span>
                </div>
              </div>
            ) : isMultiSupplier ? (
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
                      <span>Batch: <strong className="font-mono text-text">{cleanBatchNo(b.batchNo)}</strong></span>
                      {b.expiry && <span>Exp: {b.expiry}</span>}
                      {b.purchaseBillNo && (
                        <span className="text-primary font-medium">Inflow Bill: #{b.purchaseBillNo}</span>
                      )}
                      {(b.supplierName || b.supplier?.businessName) && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Supplier: {b.supplierName || b.supplier?.businessName}
                        </span>
                      )}
                      {isValidSubSupplier(b.subSupplierName, b.supplierName || b.supplier?.businessName) && (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          Sub: {b.subSupplierName}
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
                {activeItems.length} of {items.length} selected
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Group By Dropdown */}
              <GroupByDropdown
                value={groupBy}
                onChange={setGroupBy}
                size="xs"
                className="w-48 sm:w-56"
              />

              {isMultiSupplier && !isCreditNoteMode && (
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
                  onClick={() => {
                    setItems([]);
                    setSelectedItemIds([]);
                  }}
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
                      <div className="flex items-center justify-center">
                        <UICheckbox
                          checked={isAllSelected}
                          indeterminate={isSomeSelected}
                          onChange={handleSelectAll}
                          size="sm"
                          color="primary"
                          aria-label="Select all return items"
                        />
                      </div>
                    </UITableHead>
                    <UITableHead className="py-2.5 px-3 font-semibold text-text-muted uppercase text-[11px]">
                      Medicine & Pack
                    </UITableHead>
                    <UITableHead className="py-2.5 px-3 font-semibold text-text-muted uppercase text-[11px]">
                      Batch & Expiry
                    </UITableHead>
                    <UITableHead className="py-2.5 px-3 font-semibold text-text-muted uppercase text-[11px]">
                      {isCreditNoteMode ? "Source Facility" : "Supplier / Creditor"}
                    </UITableHead>
                    <UITableHead className="py-2.5 px-3 font-semibold text-text-muted uppercase text-[11px] text-center w-20">
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
                  {(() => {
                    const renderItemRow = (item) => {
                      const isSelected = selectedItemIds.includes(item.id);
                      const originalIdx = items.findIndex((i) => i.id === item.id);
                      const qty = Number(item.returnQty) || 0;
                      const rate = Number(item.rate) || 0;
                      const disc = Number(item.discountPct) || 0;
                      const lineGross = qty * rate;
                      const lineTaxable = lineGross - lineGross * (disc / 100);
                      const lineTotal =
                        lineTaxable + (lineTaxable * (Number(item.gstPct) || 0)) / 100;

                      return (
                        <tr
                          key={item.id}
                          className={cn(
                            "hover:bg-surface-hover/80 transition-colors border-b border-border/40",
                            isSelected ? "bg-surface" : "opacity-60 bg-surface-alt/30"
                          )}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center">
                              <UICheckbox
                                checked={isSelected}
                                onChange={() => handleToggleItemSelection(item.id)}
                                size="sm"
                                color="primary"
                              />
                            </div>
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-text leading-tight">
                                {cleanBatchNo(item.batchNo)}
                              </span>
                              {item.isIncoming && (
                                <IncomingItemBadge
                                  sourceBranchName={item.sourceBranchName || sourceBranchName}
                                  sourceBranchCode={item.sourceBranchCode}
                                  sourceTransferOrderNo={item.sourceTransferOrderNo || sourceTransferOrderNo}
                                />
                              )}
                            </div>
                            {item.expiry && (
                              <span className="text-[11px] font-sans text-text-muted block mt-0.5">
                                Exp: {item.expiry}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {isCreditNoteMode ? (
                              <div>
                                <span className="font-semibold text-xs text-amber-700 dark:text-amber-400 block leading-tight">
                                  {item.sourceBranchName || sourceBranchName || "Inter-Branch Source"}
                                </span>
                                {(item.sourceTransferOrderNo || sourceTransferOrderNo) && (
                                  <span className="font-mono text-[10px] text-text-muted block mt-0.5">
                                    Ref: #{item.sourceTransferOrderNo || sourceTransferOrderNo}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className="font-semibold text-xs text-text block leading-tight">
                                  {item.supplierName || item.supplier?.businessName || selectedSupplier?.businessName || "Supplier"}
                                </span>
                                {isValidSubSupplier(item.subSupplierName, item.supplierName || item.supplier?.businessName || selectedSupplier?.businessName) && (
                                  <span className="text-[11px] font-medium text-primary block mt-0.5 leading-tight">
                                    Sub: {item.subSupplierName}
                                  </span>
                                )}
                                {(item.supplierGst || item.supplier?.gstNumber) && (
                                  <span className="font-mono text-[10px] text-text-muted block mt-0.5">
                                    GST: {item.supplierGst || item.supplier?.gstNumber }
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-xs text-text tabular-nums">
                            {item.returnQty}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) =>
                                handleUpdateItem(originalIdx, "rate", e.target.value)
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
                                handleUpdateItem(originalIdx, "discountPct", e.target.value)
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
                              onClick={() => handleRemoveItem(originalIdx)}
                              className="size-7 inline-flex items-center justify-center rounded-md text-text-muted hover:text-error hover:bg-error-soft/30 transition-colors cursor-pointer"
                              title="Remove Item"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    };

                    if (groupBy === "none") {
                      return displayedItems.map((item) => renderItemRow(item));
                    }

                    const groupedSections = groupInventoryItems(displayedItems, groupBy);
                    return groupedSections.map((group) => {
                      const isCollapsed = collapsedGroups.has(group.key);
                      const groupItemIds = group.items.map((i) => i.id);
                      const isAllGroupSelected =
                        groupItemIds.length > 0 &&
                        groupItemIds.every((id) => selectedItemIds.includes(id));
                      const isSomeGroupSelected =
                        groupItemIds.some((id) => selectedItemIds.includes(id)) &&
                        !isAllGroupSelected;

                      return (
                        <React.Fragment key={group.key}>
                          <UITableRow className="bg-surface-alt/80 hover:bg-surface-alt border-y border-border sticky top-0 z-10">
                            <UITableCell className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center">
                                <UICheckbox
                                  checked={isAllGroupSelected}
                                  indeterminate={isSomeGroupSelected}
                                  onChange={() => {
                                    if (isAllGroupSelected) {
                                      setSelectedItemIds((prev) =>
                                        prev.filter((id) => !groupItemIds.includes(id))
                                      );
                                    } else {
                                      setSelectedItemIds((prev) =>
                                        Array.from(new Set([...prev, ...groupItemIds]))
                                      );
                                    }
                                  }}
                                  size="sm"
                                  color="primary"
                                  aria-label={`Select group ${group.title}`}
                                />
                              </div>
                            </UITableCell>
                            <UITableCell colSpan={9} className="py-2 px-3">
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
                                    {group.itemCount} items • Qty: {group.totalQty}
                                  </span>
                                </div>
                              </div>
                            </UITableCell>
                          </UITableRow>
                          {!isCollapsed && group.items.map((item) => renderItemRow(item))}
                        </React.Fragment>
                      );
                    });
                  })()}
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
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  isCreditNoteMode
                    ? "Add inter-branch transfer notes, receiving facility remarks, or reason..."
                    : "Add courier/transporter details, carton numbers, or return reason..."
                }
                className="w-full p-3 border border-border rounded-xl bg-surface-alt/40 text-xs font-medium text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-hidden resize-none"
              />
            </div>

            {/* Compliance Micro-strip */}
            {isCreditNoteMode ? (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300">
                <ShieldCheck className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>Inter-Branch Inventory Settlement:</strong> Confirming will post an inter-branch Credit Note and deduct destination scrap stock atomically. External vendor ledger and GST Section 34 ITC are safely bypassed.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-primary-soft/40 border border-primary/20 text-xs text-text-muted">
                <ShieldCheck className="size-4 text-primary shrink-0" />
                <span>
                  <strong>GST Section 34 Compliance:</strong> Confirming will post an Accounts Payable Debit Note and generate a negative GSTR-2 ledger entry for Input Tax Credit reversal.
                </span>
              </div>
            )}
          </div>

          <div>
            <UISummaryCard
              title={
                isCreditNoteMode
                  ? "Credit Note Financial Summary"
                  : isMultiSupplier
                  ? `Summary: ${supplierList.length} Debit Notes`
                  : "Debit Note Financial Summary"
              }
              subtitle={
                isCreditNoteMode
                  ? "Inter-Branch Quarantine Stock Settlement"
                  : isMultiSupplier
                  ? "Multi-Vendor Auto-Partitioned"
                  : "Direct Vendor AP Adjustment"
              }
              items={[
                ...(isMultiSupplier && !isCreditNoteMode
                  ? supplierList.map((g, idx) => ({
                      label: `Note ${idx + 1}: ${g.supplierName}`,
                      value: `₹${formatCurrency(g.grandTotal)}`,
                      isHighlight: true,
                    }))
                  : []),
                {
                  label: isMultiSupplier && !isCreditNoteMode ? "Combined Taxable Subtotal" : "Taxable Subtotal",
                  value: formatCurrency(calculatedTotals.taxableSubtotal),
                },
                {
                  label: isCreditNoteMode ? "Total GST (Value Component)" : "Total GST (ITC Reversal)",
                  value: formatCurrency(calculatedTotals.totalGst),
                  isDeduction: !isCreditNoteMode,
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
                label: isCreditNoteMode
                  ? "Net Credit Note Amount"
                  : isMultiSupplier
                  ? "Total Combined Debit"
                  : "Net Debit Amount",
                value: formatCurrency(calculatedTotals.grandTotal),
                subtext: isCreditNoteMode
                  ? `Credit recorded against ${sourceBranchName || "Originating Facility"}`
                  : isMultiSupplier
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
                    disabled={isSubmitting || activeItems.length === 0}
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
                      : isCreditNoteMode
                      ? `Confirm & Issue Credit Note (${activeItems.length})`
                      : isMultiSupplier
                      ? `Confirm & Issue ${supplierList.length} Debit Notes`
                      : `Confirm & Issue Debit Note (${activeItems.length})`}
                  </UIButton>

                  <UIButton
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => setShowBoxLabelModal(true)}
                    disabled={activeItems.length === 0}
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
            items: activeItems.length > 0 ? activeItems : items,
          }}
        />
      )}
    </div>
  );
};

export default CreatePurchaseReturnDesktopPage;
