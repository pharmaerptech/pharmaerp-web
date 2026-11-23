// src/features/purchases/pages/mobile/CreatePurchaseReturnMobilePage.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Undo2,
  Trash2,
  Plus,
  Minus,
  Loader2,
  Truck,
  Building2,
  Boxes,
  ShieldCheck,
  Package,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  UIButton,
  UIBadge,
  UICheckbox,
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

export const CreatePurchaseReturnMobilePage = () => {
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

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [returnMotive, setReturnMotive] = useState(initialMotive);
  const [settlementType, setSettlementType] = useState(
    isCreditNoteMode ? "CREDIT_NOTE" : "DEBIT_NOTE"
  );
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [remarks, setRemarks] = useState(navState.remarks || "");

  const [items, setItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [groupBy, setGroupBy] = useState("none");
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingBatches, setIsSearchingBatches] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBoxLabelModal, setShowBoxLabelModal] = useState(false);

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
        gstPct: Number(p.gstPct || 12),
        supplier: p.supplier || null,
        supplierId: p.supplierId || p.supplier?._id || null,
        supplierName: p.supplierName || p.supplier?.businessName || "",
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

  // Auto-resolve supplier for selected items if not yet set
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
        });
        return;
      }

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
          .catch((err) => console.warn(err));
      }
    }
  }, [items, selectedSupplier, activeBranchId]);

  const handleSearchBatches = async (query) => {
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
        limit: 20,
      });
      setSearchResults(res?.data?.data || res?.data || []);
      setShowSearchResults(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingBatches(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) handleSearchBatches(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

    if (batchSupplier && !selectedSupplier) {
      setSelectedSupplier(batchSupplier);
      uiToast.success(
        `Supplier auto-selected: ${batchSupplier.businessName || batchSupplier.name || "Supplier"}`
      );
    }
    const existingIndex = items.findIndex((i) => i.batchId === b.batchId);
    if (existingIndex > -1) {
      uiToast.info(`Batch ${b.batchNo} is already added.`);
      setShowSearchResults(false);
      return;
    }

    const availableStock =
      returnMotive === "SELLABLE"
        ? b.availableShelfStock
        : b.expiredStock || b.availableScrapStock;

    setItems((prev) => [
      {
        id: `item-${Date.now()}-${b.batchId}`,
        productId: b.productId,
        productName: b.productName,
        pack: b.pack,
        batchId: b.batchId,
        batchNo: cleanBatchNo(b.batchNo),
        expiry: b.expiry,
        purchaseBillId: b.purchaseBillId || null,
        purchaseBillNo: b.purchaseBillNo || "",
        sourceBin:
          returnMotive === "SELLABLE"
            ? (b.availableShelfStock > 0 ? "SELLABLE" : "SCRAP_FRESH")
            : returnMotive === "BROKEN"
            ? "SCRAP_BROKEN"
            : "SCRAP_EXPIRED",
        availableQty: availableStock,
        returnQty: 1,
        rate: Number(b.rate || 0),
        discountPct: 0,
        gstPct: Number(b.gstPct || 12),
        supplier: b.supplier || null,
        supplierId: b.supplierId || b.supplier?._id || null,
        supplierName: b.supplierName || b.supplier?.businessName || b.supplier?.name || "",
        subSupplier: b.subSupplier || null,
        subSupplierId: isValidSubSupplier(b.subSupplierName, b.supplierName || b.supplier?.businessName || b.supplier?.name)
          ? b.subSupplierId || b.subSupplier?._id || null
          : null,
        subSupplierName: isValidSubSupplier(b.subSupplierName, b.supplierName || b.supplier?.businessName || b.supplier?.name)
          ? b.subSupplierName
          : "",
        subSupplierGst: isValidSubSupplier(b.subSupplierName, b.supplierName || b.supplier?.businessName || b.supplier?.name)
          ? b.subSupplierGst || b.subSupplier?.gstNumber || ""
          : "",
        isIncoming: Boolean(b.isIncoming),
        sourceBranchId: b.sourceBranchId || null,
        sourceBranchName: b.sourceBranchName || "",
        sourceBranchCode: b.sourceBranchCode || "",
        sourceTransferOrderId: b.sourceTransferOrderId || null,
        sourceTransferOrderNo: b.sourceTransferOrderNo || "",
        category: returnMotive === "BROKEN" ? "broken" : "scrap_expired",
      },
      ...prev,
    ]);
    setSelectedItemIds((prev) => [...prev, `item-${Date.now()}-${b.batchId}`]);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleSetQty = (index, rawValue) => {
    setItems((prev) => {
      const copy = [...prev];
      const parsed = parseInt(rawValue, 10);
      const newQty = isNaN(parsed) ? 1 : Math.max(1, parsed);
      copy[index] = { ...copy[index], returnQty: newQty };
      return copy;
    });
  };

  const handleRemoveItem = (index) => {
    const itemToRemove = items[index];
    if (itemToRemove) {
      setSelectedItemIds((prev) => prev.filter((id) => id !== itemToRemove.id));
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleItemSelection = (id) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Active items currently selected
  const activeItems = useMemo(() => {
    return items.filter((i) => selectedItemIds.includes(i.id));
  }, [items, selectedItemIds]);

  const calculatedTotals = useMemo(() => {
    let taxable = 0;
    let tax = 0;
    activeItems.forEach((i) => {
      const gross = (i.returnQty || 0) * (i.rate || 0);
      const lineTaxable = gross - gross * ((i.discountPct || 0) / 100);
      taxable += lineTaxable;
      tax += (lineTaxable * (i.gstPct || 0)) / 100;
    });
    return {
      taxable,
      tax,
      grandTotal: Math.round(taxable + tax),
    };
  }, [activeItems]);

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
          : "Supplier");

      if (!groups[supId]) {
        groups[supId] = {
          supplierId: supId,
          supplierName: supName,
          items: [],
          grandTotal: 0,
        };
      }
      groups[supId].items.push(item);
    });
    return groups;
  }, [activeItems, selectedSupplier]);

  const supplierList = useMemo(() => Object.values(supplierGroups), [supplierGroups]);
  const isMultiSupplier = supplierList.length > 1;

  const handleSubmitReturn = async () => {
    if (activeItems.length === 0) {
      uiToast.error("Add at least one item to return.");
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
          remarks,
        };

        const res = await purchaseReturnService.createPurchaseReturn(payload);
        const created = res.data?.data || res.data;
        uiToast.success(`Issued Inter-Branch Credit Note #${created?.creditNoteNo || created?.returnNo || "CN"}`);
        navigate(ROUTES.PURCHASE_RETURNS);
        return;
      }

      // Standard External Supplier Return
      const createdNotes = [];
      const failedSuppliers = [];

      for (const group of supplierList) {
        const payload = {
          branchId: activeBranchId,
          supplierId: group.supplierId !== "unknown" ? group.supplierId : selectedSupplier?._id,
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
          remarks,
        };

        try {
          const res = await purchaseReturnService.createPurchaseReturn(payload);
          const created = res.data?.data || res.data;
          createdNotes.push(
            `#${created?.debitNoteNo || created?.returnNo} (${group.supplierName})`
          );
        } catch (subErr) {
          failedSuppliers.push(group.supplierName);
        }
      }

      if (createdNotes.length > 0) {
        uiToast.success(`Issued ${createdNotes.length} Debit Notes: ${createdNotes.join(", ")}`);
        navigate(ROUTES.PURCHASE_RETURNS);
      } else {
        uiToast.error(`Failed to issue notes for: ${failedSuppliers.join(", ")}`);
      }
    } catch (err) {
      console.error(err);
      uiToast.error(err.response?.data?.message || err.message || "Failed to create return");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render individual item card
  const renderItemCard = (item) => {
    const isSelected = selectedItemIds.includes(item.id);
    const originalIdx = items.findIndex((i) => i.id === item.id);

    return (
      <div
        key={item.id}
        className={cn(
          "bg-card border rounded-xl p-3 shadow-2xs space-y-2 transition-colors",
          isSelected ? "bg-card" : "opacity-60 bg-surface/30"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="pt-0.5">
              <UICheckbox
                checked={isSelected}
                onChange={() => handleToggleItemSelection(item.id)}
                size="sm"
                color="primary"
              />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-text truncate">{item.productName}</div>
              <div className="text-[11px] text-text-muted flex items-center gap-1.5 flex-wrap">
                <span>Batch: <strong className="font-mono">{cleanBatchNo(item.batchNo)}</strong></span>
                {item.isIncoming && (
                  <IncomingItemBadge
                    sourceBranchName={item.sourceBranchName || sourceBranchName}
                    sourceBranchCode={item.sourceBranchCode}
                    sourceTransferOrderNo={item.sourceTransferOrderNo || sourceTransferOrderNo}
                  />
                )}
                {item.expiry && <span>Exp: {item.expiry}</span>}
              </div>
              {!isCreditNoteMode && (item.supplierName || selectedSupplier?.businessName || item.subSupplierName) && (
                <div className="mt-1 text-[11px] leading-tight">
                  <span className="font-semibold text-text">
                    {item.supplierName || item.supplier?.businessName || selectedSupplier?.businessName || "Supplier"}
                  </span>
                  {isValidSubSupplier(item.subSupplierName, item.supplierName || item.supplier?.businessName || selectedSupplier?.businessName) && (
                    <span className="block text-[10.5px] font-medium text-primary mt-0.5">
                      Sub: {item.subSupplierName}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleRemoveItem(originalIdx)}
            className="p-1 text-text-muted hover:text-rose-600 shrink-0"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <div>
            <div className="text-text-muted text-[11px]">Purchase Rate</div>
            <div className="font-mono font-bold">{formatCurrency(item.rate)}</div>
          </div>

          {/* Read-only Return Qty */}
          <div className="flex flex-col items-center">
            <div className="text-text-muted text-[11px]">Return Qty</div>
            <div className="font-mono font-bold text-text tabular-nums">
              {item.returnQty}
            </div>
          </div>

          <div className="text-right">
            <div className="text-text-muted text-[11px]">Total</div>
            <div className="font-mono font-bold text-primary">
              {formatCurrency(item.returnQty * item.rate * (1 + (item.gstPct || 0) / 100))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(ROUTES.PURCHASE_RETURNS)}
            className="p-1 rounded-md text-text-muted hover:text-text"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-text flex items-center gap-1.5">
              <Undo2 className="size-4 text-primary" />
              {isCreditNoteMode ? "Inter-Branch Credit Note" : "New Purchase Return"}
            </h1>
            <p className="text-[11px] text-text-muted">
              {isCreditNoteMode ? "Incoming 📦 Stock Return" : "Issue Supplier Debit Note"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Supplier / Originating Facility Picker Card */}
        <div className="bg-card border rounded-xl p-3.5 space-y-3">
          <label className="text-xs font-bold text-text-muted uppercase">
            {isCreditNoteMode ? "Originating Store / Branch" : "Supplier *"}
          </label>
          {isCreditNoteMode ? (
            <div className="flex items-center gap-3 p-2.5 border border-amber-500/30 rounded-lg bg-amber-500/10">
              <span className="text-2xl" role="img" aria-label="Incoming Box">📦</span>
              <div className="min-w-0">
                <div className="font-bold text-sm text-amber-900 dark:text-amber-300 truncate">
                  Origin: {sourceBranchName || "Inter-Branch Source Facility"}
                </div>
                <div className="text-[11px] text-text-muted font-mono truncate">
                  {sourceTransferOrderNo ? `Transfer Ref: #${sourceTransferOrderNo}` : "Incoming Branch Quarantine Stock"}
                </div>
              </div>
            </div>
          ) : selectedSupplier ? (
            <div className="flex items-center justify-between p-2.5 border rounded-lg bg-surface/50">
              <div>
                <div className="font-bold text-sm text-text">
                  {selectedSupplier.businessName || selectedSupplier.name}
                </div>
                {selectedSupplier.gstNumber && (
                  <div className="text-[11px] text-text-muted">GST: {selectedSupplier.gstNumber}</div>
                )}
              </div>
              <UIButton variant="ghost" size="xs" onClick={() => setSelectedSupplier(null)}>
                Change
              </UIButton>
            </div>
          ) : (
            <SupplierSearchBar
              selectedSupplier={selectedSupplier}
              onSelectSupplier={(s) => setSelectedSupplier(s)}
              placeholder="Search supplier..."
            />
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div>
              <label className="text-[11px] font-semibold text-text-muted">Motive</label>
              <select
                value={returnMotive}
                onChange={(e) => setReturnMotive(e.target.value)}
                className="w-full h-9 px-2 border rounded-lg bg-background text-xs font-medium"
              >
                <option value="SELLABLE">Sellable Stock</option>
                <option value="EXPIRED">Expired Scrap</option>
                <option value="BROKEN">Broken Scrap</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-text-muted">Date</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full h-9 px-2 border rounded-lg bg-background text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* Batch Search Input */}
        <div className="bg-card border rounded-xl p-3.5 space-y-2">
          <label className="text-xs font-bold text-text-muted uppercase">Search Medicine / Batch</label>
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Scan or type medicine / batch..."
              className="w-full h-10 pl-9 pr-9 border rounded-lg bg-background text-xs"
            />
            {isSearchingBatches && (
              <Loader2 className="size-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-primary" />
            )}
          </div>

          {showSearchResults && searchResults.length > 0 && (
            <div className="border rounded-lg max-h-56 overflow-y-auto divide-y mt-2 bg-background">
              {searchResults.map((b) => (
                <button
                  key={b.batchId}
                  type="button"
                  onClick={() => handleSelectBatch(b)}
                  className="w-full text-left p-2.5 text-xs hover:bg-surface/50 flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-text">{b.productName}</div>
                    <div className="text-[11px] text-text-muted">
                      Batch: <strong className="font-mono">{cleanBatchNo(b.batchNo)}</strong> | Exp: {b.expiry}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-text">{formatCurrency(b.rate)}</div>
                    <div className="text-[10px] text-text-muted">Avail: {b.availableShelfStock || b.availableScrapStock}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Staged Items Card List & Group By */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap px-1">
            <span className="text-xs font-bold text-text-muted uppercase">
              Return Items ({activeItems.length}/{items.length})
            </span>
            <div className="flex items-center gap-2">
              <GroupByDropdown
                value={groupBy}
                onChange={setGroupBy}
                size="xs"
                className="w-36"
              />
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setItems([]);
                    setSelectedItemIds([]);
                  }}
                  className="text-rose-600 text-xs font-normal"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-xl text-xs text-text-muted">
              No medicines staged for return.
            </div>
          ) : groupBy === "none" ? (
            items.map((item) => renderItemCard(item))
          ) : (
            groupInventoryItems(items, groupBy).map((group) => {
              const isCollapsed = collapsedGroups.has(group.key);
              const groupItemIds = group.items.map((i) => i.id);
              const isAllGroupSelected =
                groupItemIds.length > 0 &&
                groupItemIds.every((id) => selectedItemIds.includes(id));

              return (
                <div key={group.key} className="space-y-1.5 border border-border/80 rounded-xl overflow-hidden bg-surface-alt/20 p-2">
                  <div className="flex items-center justify-between py-1 px-1">
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
                      className="flex items-center gap-1.5 font-bold text-xs text-text hover:text-primary text-left"
                    >
                      <ChevronRight
                        className={cn(
                          "size-3.5 transition-transform duration-200",
                          !isCollapsed && "rotate-90"
                        )}
                      />
                      <span>{group.title}</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-medium text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border">
                        {group.itemCount} items
                      </span>
                      <button
                        type="button"
                        onClick={() => {
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
                        className="text-[10px] font-semibold text-primary underline"
                      >
                        {isAllGroupSelected ? "Deselect" : "Select"}
                      </button>
                    </div>
                  </div>
                  {!isCollapsed && (
                    <div className="space-y-2 pt-1">
                      {group.items.map((item) => renderItemCard(item))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Bottom Summary & Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 z-40 shadow-xl space-y-2.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-text-muted">
            {isCreditNoteMode ? "Total Credit Note Amount:" : "Total Debit Note Amount:"}
          </span>
          <span className="text-lg font-black text-primary font-mono">
            {formatCurrency(calculatedTotals.grandTotal)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <UIButton
            variant="outline"
            size="md"
            onClick={() => setShowBoxLabelModal(true)}
            disabled={activeItems.length === 0}
            startIcon={<Package className="size-4" />}
            className="flex-1 font-semibold"
          >
            Box Label
          </UIButton>
          <UIButton
            variant="primary"
            size="md"
            onClick={handleSubmitReturn}
            disabled={isSubmitting || activeItems.length === 0}
            className="flex-2 font-bold shadow-md"
          >
            {isSubmitting
              ? "Issuing..."
              : isCreditNoteMode
              ? `Issue Credit Note (${activeItems.length})`
              : isMultiSupplier
              ? `Issue ${supplierList.length} Notes`
              : `Confirm Return (${activeItems.length})`}
          </UIButton>
        </div>
      </div>

      {/* Transport Box Labels Generator Modal */}
      {showBoxLabelModal && (
        <ReturnBoxLabelModal
          isOpen={showBoxLabelModal}
          onClose={() => setShowBoxLabelModal(false)}
          returnRecord={{
            debitNoteNo: isCreditNoteMode
              ? "CN-PENDING"
              : isMultiSupplier
              ? `DN-MULTI (${supplierList.length} Notes)`
              : "DN-STAGED",
            returnNo: "PR-PENDING",
            returnDate,
            returnMotive,
            supplier: isCreditNoteMode
              ? { businessName: sourceBranchName || "Inter-Branch Source" }
              : selectedSupplier || (supplierList[0] ? { businessName: supplierList[0].supplierName, gstNumber: supplierList[0].supplierGst } : null),
            branch: currentBranch,
            items: activeItems,
          }}
        />
      )}
    </div>
  );
};

export default CreatePurchaseReturnMobilePage;

