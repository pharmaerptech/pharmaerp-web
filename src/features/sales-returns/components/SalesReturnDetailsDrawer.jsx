// src/features/sales-returns/components/SalesReturnDetailsDrawer.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
  Printer,
  CheckCircle2,
  Archive,
  Sparkles,
  Loader2,
  Package,
  Boxes,
  Truck,
} from "lucide-react";
import {
  UIModal,
  UIButton,
  UIBadge,
  uiToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { OrderInvoiceModal } from "@/features/sales/components";
import useBranch from "@/features/branch/hooks/useBranch";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import salesReturnService from "../services/salesReturnService";

const DENOM_CONFIG = {
  500: { label: "₹500", color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20" },
  200: { label: "₹200", color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  100: { label: "₹100", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" },
  50: { label: "₹50", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  20: { label: "₹20", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
  10: { label: "₹10", color: "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20" },
  5: { label: "₹5", color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20" },
  2: { label: "₹2", color: "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20" },
  1: { label: "₹1", color: "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20" },
};

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Robustly resolves the return condition ("general", "expired", or "broken")
 * for a line item from any schema variant, scrap bin type, or batch markers.
 */
export const resolveItemCondition = (item, parentMotive = null) => {
  if (!item) return "general";

  // 1. Direct explicit motive string (case-insensitive)
  const rawMotive = String(
    item.motive || item.condition || item.itemMotive || item.returnMotive || ""
  )
    .toLowerCase()
    .trim();
  if (rawMotive === "expired" || rawMotive.includes("expir")) return "expired";
  if (rawMotive === "broken" || rawMotive.includes("broke") || rawMotive.includes("damag")) return "broken";
  if (rawMotive === "general" || rawMotive === "resellable" || rawMotive === "fresh") return "general";

  // 2. Check scrapType (e.g. "BROKEN", "EXPIRED", "FRESH_RETURN", "SCRAP")
  const rawScrapType = String(item.scrapType || "").toUpperCase().trim();
  if (rawScrapType === "BROKEN" || rawScrapType.includes("BROKE")) return "broken";
  if (rawScrapType === "EXPIRED" || rawScrapType.includes("EXPIR")) return "expired";
  if (rawScrapType === "FRESH_RETURN" || rawScrapType === "NONE") return "general";

  // 3. Check sourceBin (e.g. from purchase return projection)
  const rawSourceBin = String(item.sourceBin || "").toUpperCase().trim();
  if (rawSourceBin.includes("BROKEN")) return "broken";
  if (rawSourceBin.includes("EXPIRED")) return "expired";
  if (rawSourceBin.includes("FRESH") || rawSourceBin === "SELLABLE") return "general";

  // 4. Check category / reason / remarks
  const extraText = String(
    item.category || item.returnReason || item.reason || item.remarks || ""
  ).toLowerCase();
  if (extraText.includes("broke") || extraText.includes("damag")) return "broken";
  if (extraText.includes("expir")) return "expired";

  // 5. Check batch number markers e.g. "BATCH123 [BROKEN]" or "BATCH123 [EXPIRED]"
  const batchStr = String(
    item.batchNo ||
      item.batchNumber ||
      (typeof item.batch === "string" ? item.batch : item.batch?.batchNumber) ||
      ""
  ).toUpperCase();
  if (batchStr.includes("[BROKEN]") || batchStr.includes("BROKEN")) return "broken";
  if (batchStr.includes("[EXPIRED]") || batchStr.includes("EXPIRED")) return "expired";

  // 6. Fallback to parent returnMotive if homogeneous (not "mixed")
  const normalizedParentMotive = String(parentMotive || "").toLowerCase().trim();
  if (normalizedParentMotive === "broken") return "broken";
  if (normalizedParentMotive === "expired") return "expired";
  if (normalizedParentMotive === "general" || normalizedParentMotive === "sellable") return "general";

  // 7. If parent is "mixed", check if item has an expiry date that is past
  const expDateStr = item.expiry || item.expDate || item.expiryDate;
  if (expDateStr && expDateStr !== "—") {
    try {
      let expTime = null;
      if (typeof expDateStr === "string" && expDateStr.includes("/")) {
        const parts = expDateStr.split("/");
        if (parts.length === 2) {
          const month = parseInt(parts[0], 10);
          let year = parseInt(parts[1], 10);
          if (year < 100) year += 2000;
          expTime = new Date(year, month, 0).getTime();
        }
      } else {
        const parsed = new Date(expDateStr).getTime();
        if (!isNaN(parsed)) expTime = parsed;
      }
      if (expTime && expTime < Date.now()) {
        return "expired";
      }
    } catch {}
  }

  return "general";
};

/**
 * Resolves the box partition and labels for an item in a return consignment.
 * Supports:
 * 1. Direct explicit item.boxNo or item.boxLabel
 * 2. Hierarchical / Sub-Supplier boxes (grouping by item.subSupplierName or item.subSupplier)
 * 3. Manual boxCount (partitioning items across shippingDetails.boxCount)
 * 4. Default: Box 1
 */
export const resolveItemBox = (item, idx, allItems = [], shippingDetails = null) => {
  if (!item) {
    return {
      boxKey: "box-1",
      boxNo: 1,
      boxLabel: "Box 1",
      boxShortLabel: "Box 1",
      subSupplierName: "",
    };
  }

  const rawSubName = (
    item.subSupplierName ||
    item.subSupplier?.businessName ||
    item.subSupplier?.name ||
    ""
  ).trim();

  // 1. Direct explicit boxNo or boxLabel
  const rawBoxNo = item.boxNo ?? item.packageNo ?? item.boxIndex ?? null;
  if (rawBoxNo !== null && rawBoxNo !== undefined) {
    const num = Number(String(rawBoxNo).replace(/[^0-9]/g, "")) || 1;
    const label = item.boxLabel || (rawSubName ? `Box ${num}: ${rawSubName}` : `Box ${num}`);
    return {
      boxKey: `box-${num}`,
      boxNo: num,
      boxLabel: label,
      boxShortLabel: `Box ${num}`,
      subSupplierName: rawSubName,
    };
  }
  if (item.boxLabel) {
    const sanitizedKey = String(item.boxLabel).toLowerCase().replace(/\s+/g, "-");
    return {
      boxKey: `box-${sanitizedKey}`,
      boxNo: 1,
      boxLabel: item.boxLabel,
      boxShortLabel: item.boxLabel,
      subSupplierName: rawSubName,
    };
  }

  // 2. Check if distinct sub-suppliers exist across items
  const distinctSubSuppliers = Array.from(
    new Set(
      allItems
        .map((it) => (it.subSupplierName || it.subSupplier?.businessName || it.subSupplier?.name || "").trim())
        .filter(Boolean)
    )
  );

  const hasMultipleSubs =
    distinctSubSuppliers.length > 1 ||
    (distinctSubSuppliers.length === 1 &&
      allItems.some(
        (it) => !(it.subSupplierName || it.subSupplier?.businessName || it.subSupplier?.name)
      ));

  if (hasMultipleSubs) {
    const subIdx = rawSubName ? distinctSubSuppliers.indexOf(rawSubName) : distinctSubSuppliers.length;
    const boxNum = (subIdx >= 0 ? subIdx : distinctSubSuppliers.length) + 1;
    const boxLabel = rawSubName ? `Box ${boxNum}: ${rawSubName}` : `Box ${boxNum}: Direct Stock`;
    return {
      boxKey: `box-${boxNum}`,
      boxNo: boxNum,
      boxLabel,
      boxShortLabel: `Box ${boxNum}`,
      subSupplierName: rawSubName,
    };
  }

  // 3. Manual boxCount in shippingDetails
  const boxCount = Math.max(1, Number(shippingDetails?.boxCount) || 1);
  if (boxCount > 1) {
    const itemsPerBox = Math.max(1, Math.ceil(allItems.length / boxCount));
    const boxNum = Math.min(boxCount, Math.floor(idx / itemsPerBox) + 1);
    return {
      boxKey: `box-${boxNum}`,
      boxNo: boxNum,
      boxLabel: `Box ${boxNum} of ${boxCount}`,
      boxShortLabel: `Box ${boxNum}`,
      subSupplierName: rawSubName,
    };
  }

  // 4. Default fallback: Box 1
  return {
    boxKey: "box-1",
    boxNo: 1,
    boxLabel: rawSubName ? `Box 1: ${rawSubName}` : "Box 1",
    boxShortLabel: "Box 1",
    subSupplierName: rawSubName,
  };
};

export const SalesReturnDetailsDrawer = ({
  open,
  isOpen: propIsOpen,
  onClose,
  returnItem,
  onUpdated,
}) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [showIngestConfirm, setShowIngestConfirm] = useState(false);
  const [isQuarantining, setIsQuarantining] = useState(false);
  const [showScrapConfirm, setShowScrapConfirm] = useState(false);
  const [selectedBoxFilter, setSelectedBoxFilter] = useState("ALL");
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const { currentBranch } = useBranch();
  const { currentCompany } = useWorkspace();

  const isVisible = Boolean(open ?? propIsOpen);

  // Preserve item data during close animation
  const [activeItem, setActiveItem] = useState(returnItem);

  useEffect(() => {
    setSelectedBoxFilter("ALL");
  }, [returnItem?._id, returnItem?.id, returnItem?.returnNo]);

  useEffect(() => {
    if (returnItem) {
      setActiveItem(returnItem);
      const returnId = returnItem._id || returnItem.id;
      if (returnId) {
        setIsLoadingDetail(true);
        salesReturnService
          .getSalesReturnById(returnId)
          .then((res) => {
            const data = res?.data?.data || res?.data;
            if (data) setActiveItem(data);
          })
          .catch(() => {})
          .finally(() => {
            setIsLoadingDetail(false);
          });
      }
    } else {
      setIsLoadingDetail(false);
    }
  }, [returnItem]);

  // Keyboard shortcut listener: Enter to Print, Esc to Close
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
        e.preventDefault();
        setIsPrintModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onClose]);

  const itemToDisplay = activeItem || returnItem;
  const returnNo = itemToDisplay?.returnNo || itemToDisplay?.invoiceNo || "RET-MEMO";
  let originalInvoiceNo = itemToDisplay?.originalInvoiceNo || itemToDisplay?.originalInvoiceId?.invoiceNo;
  if (!originalInvoiceNo || originalInvoiceNo === returnNo || originalInvoiceNo.startsWith("RET-")) {
    const itOrig = Array.isArray(itemToDisplay?.items)
      ? itemToDisplay.items.find((it) => it.originalInvoiceNo && !it.originalInvoiceNo.startsWith("RET-"))
      : null;
    if (itOrig) originalInvoiceNo = itOrig.originalInvoiceNo;
  }
  originalInvoiceNo = originalInvoiceNo || "—";
  const debitNoteNo =
    itemToDisplay?.debitNoteNo ||
    itemToDisplay?.debitNo ||
    (itemToDisplay?.isInterCompany ? itemToDisplay?.returnNo : null) ||
    null;
  const isApproved = Boolean(itemToDisplay?.isApproved || itemToDisplay?.status === "Approved");
  const creditNoteNo =
    itemToDisplay?.creditNoteNo ||
    (itemToDisplay?.returnType === "credit_note"
      ? (typeof itemToDisplay?.creditNoteId === "object"
          ? itemToDisplay?.creditNoteId?.creditNoteNo
          : itemToDisplay?.returnNo)
      : null);

  const returnDate = itemToDisplay?.date
    ? new Date(itemToDisplay.date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
  const returnTime = itemToDisplay?.date
    ? new Date(itemToDisplay.date).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  const customerName =
    itemToDisplay?.customerId?.name ||
    itemToDisplay?.customerName ||
    itemToDisplay?.customer?.name ||
    "Walk-in Customer";
  const customerMobile =
    itemToDisplay?.customerId?.mobile ||
    itemToDisplay?.customerId?.phone ||
    itemToDisplay?.customerPhone ||
    itemToDisplay?.customer?.phone ||
    "";
  const customerGstin = itemToDisplay?.customerId?.gstin || itemToDisplay?.customerGstin || "";

  const branchName =
    itemToDisplay?.branchName ||
    itemToDisplay?.branchId?.name ||
    currentBranch?.name ||
    "Main Branch";

  const cashierName =
    itemToDisplay?.createdByName ||
    (itemToDisplay?.createdByEmail ? itemToDisplay.createdByEmail.split("@")[0] : null) ||
    itemToDisplay?.createdBy?.name ||
    "Cashier";

  const isB2B = itemToDisplay?.billingMode === "B2B";
  const rawItems = Array.isArray(itemToDisplay?.items) ? itemToDisplay.items : [];

  // Calculate row details
  const calculatedItems = useMemo(() => {
    return rawItems.map((item, idx) => {
      const qty = Math.max(1, Number(item.qty || item.quantity || 1));
      const mrp = Number(item.mrp || item.price || item.rate || 0);
      const rate = Number(item.rate || item.price || item.unitPrice || mrp);
      const grossTotal = mrp * qty;

      let itemDisc = Number(item.disc || item.discount || item.itemDiscount || 0);
      let discAmount = 0;
      if (itemDisc > 0 && itemDisc <= 100 && !item.discAmount) {
        discAmount = (grossTotal * itemDisc) / 100;
      } else if (item.discAmount) {
        discAmount = Number(item.discAmount);
      } else if (mrp > rate) {
        discAmount = (mrp - rate) * qty;
      }

      const taxable = Math.max(0, grossTotal - discAmount);
      const gstRate = Number(item.gst || item.gstRate || item.hsnTaxpercent || 0);
      const gstAmt = (taxable * gstRate) / 100;
      const finalAmt = Number(item.total || item.amount || (itemToDisplay?.billingMode === "B2B" ? taxable + gstAmt : grossTotal - discAmount));

      const batchNo =
        item.batch ||
        item.batchNo ||
        (typeof item.batch === "object" ? item.batch?.batchNumber : null) ||
        "—";
      const expDate = item.expiry || item.expDate || item.expiryDate || "—";
      const pack = item.pack || item.packSize || item.workspaceProduct?.pack || "";
      const rack = item.rack || item.workspaceProduct?.rack || "";
      const originalInv = item.originalInvoiceNo && !item.originalInvoiceNo.startsWith("RET-") ? item.originalInvoiceNo : "";
      const maxQty = item.originalSoldQty || item.maxReturnQty || null;

      return {
        sr: idx + 1,
        id: item.id || `item-${idx}`,
        name: item.name || item.productName || item.displayName || "Pharma Product",
        brand: item.brand || item.manufacturer || item.workspaceProduct?.brand || "",
        category: item.category || item.workspaceProduct?.category || "",
        batch: batchNo,
        expiry: expDate,
        pack,
        rack,
        hsn: item.hsn || item.hsnCode || "3004",
        mrp,
        rate,
        discPct: itemDisc,
        discAmount,
        qty,
        taxable,
        gstRate,
        gstAmt,
        finalAmt,
        isReturnItem: true,
        originalInvoiceNo: originalInv,
        originalSoldQty: maxQty,
        motive: resolveItemCondition(item, itemToDisplay?.returnMotive),
        condition: resolveItemCondition(item, itemToDisplay?.returnMotive),
        boxKey: resolveItemBox(item, idx, rawItems, itemToDisplay?.shippingDetails).boxKey,
        boxNo: resolveItemBox(item, idx, rawItems, itemToDisplay?.shippingDetails).boxNo,
        boxLabel: resolveItemBox(item, idx, rawItems, itemToDisplay?.shippingDetails).boxLabel,
        boxShortLabel: resolveItemBox(item, idx, rawItems, itemToDisplay?.shippingDetails).boxShortLabel,
        subSupplierName: resolveItemBox(item, idx, rawItems, itemToDisplay?.shippingDetails).subSupplierName,
      };
    });
  }, [rawItems, itemToDisplay?.billingMode, itemToDisplay?.returnMotive, itemToDisplay?.shippingDetails]);

  // Group items by physical/sub-supplier box
  const boxGroups = useMemo(() => {
    const map = new Map();
    calculatedItems.forEach((it) => {
      const key = it.boxKey || `box-${it.boxNo || 1}`;
      if (!map.has(key)) {
        map.set(key, {
          boxKey: key,
          boxNo: it.boxNo || 1,
          boxLabel: it.boxLabel || `Box ${it.boxNo || 1}`,
          boxShortLabel: it.boxShortLabel || `Box ${it.boxNo || 1}`,
          subSupplierName: it.subSupplierName || "",
          items: [],
          totalQty: 0,
        });
      }
      const group = map.get(key);
      group.items.push(it);
      group.totalQty += Number(it.qty) || 0;
    });
    return Array.from(map.values()).sort((a, b) => a.boxNo - b.boxNo);
  }, [calculatedItems]);

  // Filter items by selected box tab
  const displayedItems = useMemo(() => {
    if (selectedBoxFilter === "ALL") return calculatedItems;
    return calculatedItems.filter((it) => it.boxKey === selectedBoxFilter);
  }, [calculatedItems, selectedBoxFilter]);

  const displayedUnits = useMemo(() => {
    return displayedItems.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
  }, [displayedItems]);

  // Overall financial totals
  const totalMrp = useMemo(() => {
    return calculatedItems.reduce((acc, it) => acc + (it.mrp * it.qty), 0);
  }, [calculatedItems]);

  const discount = Math.abs(Number(itemToDisplay?.discount || 0));
  const totalDiscount = useMemo(() => {
    if (discount > 0) return discount;
    return calculatedItems.reduce((acc, it) => acc + it.discAmount, 0);
  }, [calculatedItems, discount]);

  const subtotal = Math.abs(Number(itemToDisplay?.subtotal || 0));
  const totalTaxable = useMemo(() => {
    if (subtotal > 0) return subtotal;
    return calculatedItems.reduce((acc, it) => acc + it.taxable, 0);
  }, [calculatedItems, subtotal]);

  const tax = Math.abs(Number(itemToDisplay?.tax || 0));
  const totalGst = useMemo(() => {
    if (tax > 0) return tax;
    return calculatedItems.reduce((acc, it) => acc + it.gstAmt, 0);
  }, [calculatedItems, tax]);

  const grandTotal = Math.abs(Number(itemToDisplay?.grandTotal || itemToDisplay?.returnAmount || 0));
  const payableTotal = useMemo(() => {
    if (grandTotal > 0) return grandTotal;
    return calculatedItems.reduce((acc, it) => acc + it.finalAmt, 0);
  }, [grandTotal, calculatedItems]);

  const totalUnits = useMemo(() => {
    return calculatedItems.reduce((acc, it) => acc + it.qty, 0);
  }, [calculatedItems]);

  // Dynamic GST slabs breakdown
  const gstSlabs = useMemo(() => {
    const map = {};
    calculatedItems.forEach((it) => {
      const r = it.gstRate;
      if (!map[r]) {
        map[r] = { rate: r, taxable: 0, totalTax: 0 };
      }
      map[r].taxable += it.taxable;
      map[r].totalTax += it.gstAmt;
    });

    return Object.values(map).map((entry) => ({
      rate: entry.rate,
      taxable: entry.taxable,
      cgst: entry.totalTax / 2,
      sgst: entry.totalTax / 2,
      totalTax: entry.totalTax,
    }));
  }, [calculatedItems]);

  const returnType = String(itemToDisplay?.returnType || itemToDisplay?.refundMethod || "").toLowerCase();
  const isAdvance = returnType.includes("advance");
  const isCredit = returnType.includes("credit");

  const rawDenoms = Array.isArray(itemToDisplay?.refundDenominations) && itemToDisplay.refundDenominations.length > 0
    ? itemToDisplay.refundDenominations
    : (Array.isArray(itemToDisplay?.denominations) ? itemToDisplay.denominations : []);

  const denoms = rawDenoms
    .map((d) => ({
      note: Number(d.denomination || d.note || 0),
      count: Number(d.quantity || d.count || 0),
      total: Number(d.denomination || d.note || 0) * Number(d.quantity || d.count || 0),
    }))
    .filter((d) => d.note > 0 && d.count > 0);

  const isInterCompany = Boolean(
    itemToDisplay?.isInterCompany ||
      itemToDisplay?.isOriginalPurchaseReturn ||
      itemToDisplay?.originCompany
  );

  const freshItems = useMemo(() => {
    return calculatedItems.filter(
      (it) => it.motive === "general" || it.condition === "general"
    );
  }, [calculatedItems]);

  const hasFreshItems = freshItems.length > 0;
  const totalFreshQty = useMemo(() => {
    return freshItems.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
  }, [freshItems]);

  const isAlreadyIngested = Boolean(itemToDisplay?.ingestionDetails?.ingestedToStore);

  const handleIngestFreshStock = async () => {
    const returnId = itemToDisplay?._id || itemToDisplay?.id;
    if (!returnId) return;

    setIsIngesting(true);
    try {
      const targetBranchId =
        currentBranch?._id || currentBranch?.id || itemToDisplay?.branchId;
      const res = await salesReturnService.ingestFreshStockToStore(
        returnId,
        targetBranchId
      );
      const updated = res?.data?.data || res?.data;
      uiToast.success(
        "Stock Ingested Successfully",
        `Imported ${totalFreshQty} fresh unit(s) into Stock Matrix shelf inventory.`
      );
      setShowIngestConfirm(false);

      if (updated) {
        setActiveItem(updated);
      } else {
        const refreshed = await salesReturnService.getSalesReturnById(returnId);
        const refData = refreshed?.data?.data || refreshed?.data;
        if (refData) setActiveItem(refData);
      }
      onUpdated?.();
    } catch (err) {
      console.error("Failed to ingest fresh stock into store:", err);
      uiToast.error(
        "Ingestion Failed",
        err?.response?.data?.message ||
          err?.message ||
          "Failed to import fresh stock into Stock Matrix."
      );
    } finally {
      setIsIngesting(false);
    }
  };

  const scrapItems = useMemo(() => {
    return calculatedItems.filter(
      (it) =>
        it.motive === "broken" ||
        it.motive === "expired" ||
        it.condition === "broken" ||
        it.condition === "expired"
    );
  }, [calculatedItems]);

  const hasScrapItems = scrapItems.length > 0;
  const totalScrapQty = useMemo(() => {
    return scrapItems.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
  }, [scrapItems]);

  const totalBrokenQty = useMemo(() => {
    return scrapItems
      .filter((it) => it.motive === "broken" || it.condition === "broken")
      .reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
  }, [scrapItems]);

  const totalExpiredQty = useMemo(() => {
    return scrapItems
      .filter((it) => it.motive === "expired" || it.condition === "expired")
      .reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
  }, [scrapItems]);

  const isScrapQuarantined = Boolean(itemToDisplay?.scrapDetails?.quarantined);

  const handleQuarantineScrap = async () => {
    const returnId = itemToDisplay?._id || itemToDisplay?.id;
    if (!returnId) return;

    setIsQuarantining(true);
    try {
      const targetBranchId =
        currentBranch?._id || currentBranch?.id || itemToDisplay?.branchId;
      const res = await salesReturnService.quarantineScrapToStore(
        returnId,
        targetBranchId
      );
      const updated = res?.data?.data || res?.data;
      uiToast.success(
        "Scrap Quarantined Successfully",
        `Moved ${totalScrapQty} broken/expired unit(s) into non-sellable Scrap Bin.`
      );
      setShowScrapConfirm(false);

      if (updated) {
        setActiveItem(updated);
      } else {
        const refreshed = await salesReturnService.getSalesReturnById(returnId);
        const refData = refreshed?.data?.data || refreshed?.data;
        if (refData) setActiveItem(refData);
      }
      onUpdated?.();
    } catch (err) {
      console.error("Failed to quarantine scrap stock:", err);
      uiToast.error(
        "Quarantine Failed",
        err?.response?.data?.message ||
          err?.message ||
          "Failed to move damaged/expired stock to Scrap Bin."
      );
    } finally {
      setIsQuarantining(false);
    }
  };

  const handleApproveReturn = async () => {
    const returnId = itemToDisplay?._id || itemToDisplay?.id;
    if (!returnId) return;

    setIsApproving(true);
    try {
      const res = await salesReturnService.approveSalesReturn(returnId, {
        note: approvalNote,
      });
      const updated = res?.data?.data || res?.data;
      uiToast.success(
        "Return Approved Successfully",
        "The sales return has been approved and notes synchronized to the credit note."
      );
      setShowApproveModal(false);
      setApprovalNote("");

      if (updated) {
        setActiveItem(updated);
      } else {
        const refreshed = await salesReturnService.getSalesReturnById(returnId);
        const refData = refreshed?.data?.data || refreshed?.data;
        if (refData) setActiveItem(refData);
      }
      onUpdated?.();
    } catch (err) {
      console.error("Failed to approve sales return:", err);
      uiToast.error(
        "Approval Failed",
        err?.response?.data?.message ||
          err?.message ||
          "Failed to approve sales return."
      );
    } finally {
      setIsApproving(false);
    }
  };

  // Early return strictly after all hooks have been declared
  if (!isVisible || !itemToDisplay) return null;

  return (
    <>
      <UIModal
        isOpen={isVisible}
        onClose={onClose}
        closeOnBackdrop={true}
        closeOnEsc={true}
        showCloseButton={true}
        size="xl"
      >
        <div className="p-5 sm:p-6 font-sans space-y-4 max-h-[88vh] overflow-y-auto">
          {/* Sleek Top Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3.5 border-b border-border">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold font-mono tracking-tight text-text">
                  {returnNo}
                </span>
                <UIBadge
                  variant="soft"
                  color={isB2B ? "info" : "error"}
                  className="text-[10px] font-bold uppercase tracking-wider"
                >
                  {isB2B ? "B2B" : "B2C"}
                </UIBadge>
                {isInterCompany && isApproved && (
                  <UIBadge
                    variant="soft"
                    color="success"
                    className="text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  >
                    <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                    Approved
                  </UIBadge>
                )}
                {itemToDisplay?.isInterCompany && (
                  <UIBadge
                    variant="outline"
                    color="purple"
                    className="px-1.5 py-0.5 inline-flex items-center justify-center bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                    title="Inter-Company Consignment"
                  >
                    <Truck className="size-3.5" />
                  </UIBadge>
                )}
                {itemToDisplay?.returnMotive && itemToDisplay.returnMotive !== "general" && (
                  <UIBadge
                    variant="soft"
                    color={
                      itemToDisplay.returnMotive === "expired"
                        ? "warning"
                        : itemToDisplay.returnMotive === "broken"
                        ? "error"
                        : "purple"
                    }
                    className="text-[10px] font-bold uppercase tracking-wider"
                  >
                    {itemToDisplay.returnMotive === "expired"
                      ? "Expired"
                      : itemToDisplay.returnMotive === "broken"
                      ? "Broken"
                      : "Mixed"}
                  </UIBadge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                <span>{returnDate}{returnTime ? ` • ${returnTime}` : ""}</span>
                {debitNoteNo ? (
                  <span className="text-primary font-medium">
                    • Debit Note #{debitNoteNo}
                  </span>
                ) : originalInvoiceNo && originalInvoiceNo !== "—" ? (
                  <span className="text-primary font-medium">
                    • Bill #{originalInvoiceNo}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Right side refund header */}
            <div className="text-right flex flex-col items-end">
              <span className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
                <CheckCircle2 className="size-3 text-emerald-600" />
                {isAdvance ? "Advance Credit" : isCredit ? "Credit Note" : "Cash Refund"}
              </span>
              <span className="text-xl font-extrabold font-mono text-error tabular-nums tracking-tight">
                {formatCurrency(payableTotal)}
              </span>
            </div>
          </div>

          {/* Minimalist 1-Line Context Strip */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 py-2.5 px-3.5 rounded-lg bg-surface-alt/40 border border-border/60 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted text-[11px]">Customer:</span>
              <strong className="text-text font-semibold">{customerName}</strong>
              {customerMobile && <span className="text-text-muted font-mono text-[11px]">({customerMobile})</span>}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted text-[11px]">Branch:</span>
              <strong className="text-text font-semibold">{branchName}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted text-[11px]">Cashier:</span>
              <span className="text-text font-medium">{cashierName}</span>
            </div>
          </div>

          {/* Approved status & note strip */}
          {isInterCompany && isApproved && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Return Approved
                  {itemToDisplay?.approvedByName ? ` by ${itemToDisplay.approvedByName}` : ""}
                  {itemToDisplay?.approvedAt
                    ? ` • ${new Date(itemToDisplay.approvedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}`
                    : ""}
                  {itemToDisplay?.approvalNote ? `: "${itemToDisplay.approvalNote}"` : ""}
                </span>
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Authorized
              </span>
            </div>
          )}

          {/* Scrap Transfer notice (if applicable) */}
          {itemToDisplay?.transferOrderNo && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <Archive className="size-3.5" /> Scrap Transfer Order: <strong>#{itemToDisplay.transferOrderNo}</strong>
              </span>
              <span className="text-[10.5px] text-amber-700/80 dark:text-amber-400">Scrap Bin Isolated</span>
            </div>
          )}

          {/* Fresh Stock Ingestion notice (if already ingested) */}
          {isAlreadyIngested && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Fresh Stock Ingested into{" "}
                  <strong>
                    {itemToDisplay?.ingestionDetails?.ingestedBranchId?.name ||
                      currentBranch?.name ||
                      "Stock Matrix"}
                  </strong>
                  {itemToDisplay?.ingestionDetails?.ingestedAt
                    ? ` • ${new Date(itemToDisplay.ingestionDetails.ingestedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}`
                    : ""}
                  {itemToDisplay?.ingestionDetails?.ingestedBy?.name
                    ? ` by ${itemToDisplay.ingestionDetails.ingestedBy.name}`
                    : ""}
                </span>
              </span>
              <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Stock Matrix Active
              </span>
            </div>
          )}

          {/* Scrap Quarantined notice (if already moved to scrap bin) */}
          {isScrapQuarantined && hasScrapItems && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <Archive className="size-3.5 text-amber-600 dark:text-amber-400" />
                <span>
                  Damaged/Expired Stock Quarantined in Scrap Depot (
                  {totalScrapQty} units)
                  {itemToDisplay?.scrapDetails?.quarantinedAt
                    ? ` • ${new Date(itemToDisplay.scrapDetails.quarantinedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}`
                    : ""}
                </span>
              </span>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Scrap Bin Isolated
              </span>
            </div>
          )}

          {/* Returned Line Items Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Returned Items ({displayedItems.length}
                {displayedItems.length !== calculatedItems.length ? ` of ${calculatedItems.length}` : ""}
                )
              </span>
              <span className="font-mono">
                {isLoadingDetail && calculatedItems.length === 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-text-muted text-[11px]">
                    <Loader2 className="size-3 animate-spin text-primary" /> Loading items...
                  </span>
                ) : (
                  `${displayedUnits} units`
                )}
              </span>
            </div>

            {/* Box Partitioning & Filter Bar (for Inter-Company Returns) */}
            {isInterCompany && boxGroups.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-surface-alt/40 border border-border/70 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1 mr-1">
                    <Boxes className="size-3.5 text-primary" /> Box Filter:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedBoxFilter("ALL")}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                      selectedBoxFilter === "ALL"
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "bg-surface hover:bg-surface-hover text-text-muted border border-border/60"
                    )}
                  >
                    <span>All Items</span>
                    <span
                      className={cn(
                        "text-[10px] px-1 rounded font-mono",
                        selectedBoxFilter === "ALL"
                          ? "bg-white/20 text-white"
                          : "bg-surface-alt text-text-muted"
                      )}
                    >
                      {calculatedItems.length}
                    </span>
                  </button>
                  {boxGroups.map((box) => (
                    <button
                      key={box.boxKey}
                      type="button"
                      onClick={() => setSelectedBoxFilter(box.boxKey)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5",
                        selectedBoxFilter === box.boxKey
                          ? "bg-purple-600 text-white font-semibold shadow-2xs"
                          : "bg-surface hover:bg-surface-hover text-text-muted border border-border/60"
                      )}
                      title={box.boxLabel}
                    >
                      <span className="font-semibold">📦 {box.boxLabel}</span>
                      <span
                        className={cn(
                          "text-[10px] px-1 rounded font-mono",
                          selectedBoxFilter === box.boxKey
                            ? "bg-purple-700/60 text-white"
                            : "bg-surface-alt text-text-muted"
                        )}
                      >
                        {box.items.length} ({box.totalQty}u)
                      </span>
                    </button>
                  ))}
                </div>
                <span className="text-[10.5px] text-text-muted hidden sm:inline font-medium">
                  Showing {displayedItems.length} of {calculatedItems.length} items
                </span>
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/60 text-[10.5px] font-bold text-text-muted uppercase select-none">
                    <th className="py-2.5 px-3">Medicine</th>
                    {isInterCompany && <th className="py-2.5 px-2 text-center">Box</th>}
                    <th className="py-2.5 px-2 font-mono">Batch</th>
                    <th className="py-2.5 px-2 font-mono">Expiry</th>
                    <th className="py-2.5 px-2 text-center">Condition</th>
                    <th className="py-2.5 px-2 font-mono text-center">GST</th>
                    <th className="py-2.5 px-2 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-right">Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoadingDetail && displayedItems.length === 0 ? (
                    <tr>
                      <td colSpan={isInterCompany ? 9 : 8} className="py-8 text-center text-text-muted">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="size-5 animate-spin text-primary" />
                          <span className="text-xs font-medium">Loading item details...</span>
                        </div>
                      </td>
                    </tr>
                  ) : displayedItems.length > 0 ? (
                    displayedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-hover/50">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-text block leading-tight">{item.name}</span>
                          <span className="text-[10px] text-text-muted">
                            {[item.brand, item.pack ? `Pk:${item.pack}` : null].filter(Boolean).join(" • ")}
                          </span>
                        </td>
                        {isInterCompany && (
                          <td className="py-2.5 px-2 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                                📦 {item.boxShortLabel || `Box ${item.boxNo || 1}`}
                              </span>
                              {item.subSupplierName && (
                                <span
                                  className="text-[9px] text-text-muted truncate max-w-28 block mt-0.5"
                                  title={item.subSupplierName}
                                >
                                  {item.subSupplierName}
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="py-2.5 px-2 font-mono text-[11px] text-text-muted">{item.batch || "—"}</td>
                        <td className="py-2.5 px-2 font-mono text-[11px] text-text-muted">{item.expiry || "—"}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={cn(
                              "inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                              item.motive === "expired"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                                : item.motive === "broken"
                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                            )}
                          >
                            {item.motive === "expired" ? "Expired" : item.motive === "broken" ? "Broken" : "General"}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-center text-text-muted">{item.gstRate}%</td>
                        <td className="py-2.5 px-2 font-mono text-right font-bold text-error">
                          {item.qty}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-text-muted">₹{item.rate.toFixed(2)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-error tabular-nums">-₹{item.finalAmt.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isInterCompany ? 9 : 8} className="py-6 text-center text-text-muted">
                        No line items found for the selected box.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sleek Integrated Settlement & Totals Strip */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-lg bg-surface-alt/30 border border-border/60 text-xs">
            {/* Left: Settlement details & compact denomination chips */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-text-muted">Settlement:</span>
                <span className="font-semibold text-text">
                  {isAdvance ? "Customer Advance Credit" : isCredit ? "Credit Note Ledger" : "Cash Refund"}
                </span>
                {creditNoteNo && (
                  <span className="text-[10.5px] font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 border border-purple-500/25 px-1.5 py-0.5 rounded">
                    CN #{creditNoteNo} {isApproved ? "• Approved" : ""}
                  </span>
                )}
              </div>
              {denoms.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-text-muted font-medium uppercase mr-1">Notes:</span>
                  {denoms.map((d, i) => {
                    const config = DENOM_CONFIG[d.note] || { label: `₹${d.note}`, color: "text-text bg-surface-alt border-border" };
                    return (
                      <span
                        key={i}
                        className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10.5px] font-mono",
                          config.color
                        )}
                      >
                        <span className="font-bold">{config.label}</span>
                        <span className="text-text-muted">×</span>
                        <span>{d.count}</span>
                      </span>
                    );
                  })}
                </div>
              )}
              {gstSlabs.length > 0 && (
                <div className="text-[11px] text-text-muted flex items-center gap-2 pt-0.5">
                  <span>GST Reversal:</span>
                  <span className="font-mono text-text">
                    {gstSlabs.map((s) => `${s.rate}%: ₹${s.totalTax.toFixed(2)}`).join(" • ")}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Clean Financial Summary */}
            <div className="w-full sm:w-auto font-mono text-xs space-y-1 sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60">
              <div className="flex justify-between sm:justify-end sm:gap-6 text-text-muted">
                <span className="font-sans">Subtotal:</span>
                <span>₹{totalTaxable.toFixed(2)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between sm:justify-end sm:gap-6 text-emerald-600 dark:text-emerald-400">
                  <span className="font-sans">Discount:</span>
                  <span>-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between sm:justify-end sm:gap-6 text-text-muted">
                <span className="font-sans">GST Reversal:</span>
                <span>-₹{totalGst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-6 text-sm font-bold text-text pt-1 border-t border-border/60">
                <span className="font-sans">Total Refund:</span>
                <span className="text-error font-mono text-base font-bold tabular-nums">
                  ₹{payableTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Simple Sleek Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <UIButton
                variant="outline"
                size="sm"
                onClick={() => setIsPrintModalOpen(true)}
                startIcon={<Printer className="size-4" />}
              >
                Print Memo
              </UIButton>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Button 1: Fresh Stock to Stock Matrix (only after approval) */}
              {isInterCompany && isApproved && hasFreshItems && !isAlreadyIngested && (
                <UIButton
                  variant="primary"
                  size="sm"
                  onClick={() => setShowIngestConfirm(true)}
                  disabled={isIngesting || isQuarantining}
                  startIcon={
                    isIngesting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )
                  }
                  className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  Import Fresh Stock to Matrix
                </UIButton>
              )}

              {isInterCompany && isApproved && isAlreadyIngested && (
                <span className="hidden sm:inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="size-3.5" /> Ingested to Matrix
                </span>
              )}

              {/* Button 2: Broken & Expired to Scrap Bin (only after approval) */}
              {isInterCompany && isApproved && hasScrapItems && !isScrapQuarantined && (
                <UIButton
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScrapConfirm(true)}
                  disabled={isIngesting || isQuarantining}
                  startIcon={
                    isQuarantining ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Archive className="size-3.5 text-amber-600 dark:text-amber-400" />
                    )
                  }
                  className="font-bold border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 shadow-xs"
                >
                  Move Broken & Expired to Scrap Bin
                </UIButton>
              )}

              {isInterCompany && isApproved && hasScrapItems && isScrapQuarantined && (
                <span className="hidden sm:inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                  <Archive className="size-3.5 text-amber-600 dark:text-amber-400" /> Scrap Bin Isolated
                </span>
              )}

              {/* Approval Button or Approved Indicator (Inter-Company only) */}
              {isInterCompany && (
                !isApproved ? (
                  <UIButton
                    variant="primary"
                    size="sm"
                    onClick={() => setShowApproveModal(true)}
                    disabled={isApproving || isIngesting || isQuarantining}
                    startIcon={
                      isApproving ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-3.5" />
                      )
                    }
                    className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    Approve Return
                  </UIButton>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="size-3.5" /> Approved
                  </span>
                )
              )}

              <UIButton variant="ghost" size="sm" onClick={onClose}>
                Close
              </UIButton>
            </div>
          </div>
        </div>
      </UIModal>

      {/* Confirmation Modal for Importing Fresh General Stock */}
      {showIngestConfirm && (
        <UIModal
          isOpen={showIngestConfirm}
          onClose={() => !isIngesting && setShowIngestConfirm(false)}
          size="md"
        >
          <div className="p-5 font-sans space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border">
              <div className="size-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="size-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text">
                  Import Fresh Stock into Stock Matrix
                </h3>
                <p className="text-xs text-text-muted">
                  Add resellable items directly into active store shelf inventory
                </p>
              </div>
            </div>

            <div className="p-3 bg-surface-alt/40 border border-border/70 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-text-muted">Target Facility:</span>
                <strong className="text-text font-semibold">
                  {currentBranch?.name || branchName || "Active Facility"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Fresh General Items:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {freshItems.length} {freshItems.length === 1 ? "item" : "items"} ({totalFreshQty} units)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Return Ref:</span>
                <span className="font-mono text-text">#{returnNo}</span>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/70 text-[10.5px] font-bold text-text-muted uppercase select-none">
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-2 font-mono">Batch</th>
                    <th className="py-2 px-2 font-mono text-center">Expiry</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {freshItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-hover/40">
                      <td className="py-2 px-3 font-medium text-text">
                        <span>{item.name}</span>
                        {item.pack && <span className="text-[10px] text-text-muted block">Pk: {item.pack}</span>}
                      </td>
                      <td className="py-2 px-2 font-mono text-[11px] text-text-muted">{item.batch || "—"}</td>
                      <td className="py-2 px-2 font-mono text-[11px] text-center text-text-muted">{item.expiry || "—"}</td>
                      <td className="py-2 px-3 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400">
                        +{item.qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-text-muted leading-relaxed">
              These fresh return units will be credited directly to the facility&apos;s Stock Matrix shelf inventory and immediately become available for sales billing.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <UIButton
                variant="outline"
                size="sm"
                onClick={() => setShowIngestConfirm(false)}
                disabled={isIngesting}
              >
                Cancel
              </UIButton>
              <UIButton
                variant="primary"
                size="sm"
                onClick={handleIngestFreshStock}
                disabled={isIngesting}
                startIcon={
                  isIngesting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )
                }
                className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                {isIngesting ? "Importing..." : "Confirm & Import to Matrix"}
              </UIButton>
            </div>
          </div>
        </UIModal>
      )}

      {/* Confirmation Modal for Moving Broken & Expired Stock to Scrap Bin */}
      {showScrapConfirm && (
        <UIModal
          isOpen={showScrapConfirm}
          onClose={() => !isQuarantining && setShowScrapConfirm(false)}
          size="md"
        >
          <div className="p-5 font-sans space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border">
              <div className="size-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Archive className="size-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text">
                  Move Damaged & Expired Items to Scrap Bin
                </h3>
                <p className="text-xs text-text-muted">
                  Quarantine items into non-sellable Scrap Bin (SCRAP_BROKEN / SCRAP_EXPIRED)
                </p>
              </div>
            </div>

            <div className="p-3 bg-surface-alt/40 border border-border/70 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-text-muted">Target Facility:</span>
                <strong className="text-text font-semibold">
                  {currentBranch?.name || branchName || "Active Facility"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Eligible Scrap Items:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {scrapItems.length} {scrapItems.length === 1 ? "item" : "items"} ({totalScrapQty} units)
                  {totalBrokenQty > 0 && ` • ${totalBrokenQty} broken`}
                  {totalExpiredQty > 0 && ` • ${totalExpiredQty} expired`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Return Ref:</span>
                <span className="font-mono text-text">#{returnNo}</span>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/70 text-[10.5px] font-bold text-text-muted uppercase select-none">
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-2 font-mono">Batch</th>
                    <th className="py-2 px-2 text-center">Condition</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {scrapItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-hover/40">
                      <td className="py-2 px-3 font-medium text-text">
                        <span>{item.name}</span>
                        {item.pack && <span className="text-[10px] text-text-muted block">Pk: {item.pack}</span>}
                      </td>
                      <td className="py-2 px-2 font-mono text-[11px] text-text-muted">
                        <div className="flex items-center gap-1">
                          <span role="img" aria-label="Incoming Box" className="text-xs">📦</span>
                          <span>{item.batch || "—"}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span
                          className={cn(
                            "inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            item.motive === "broken" || item.condition === "broken"
                              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          )}
                        >
                          {item.motive === "broken" || item.condition === "broken" ? "Broken" : "Expired"}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-right text-amber-600 dark:text-amber-400">
                        {item.qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-text-muted leading-relaxed">
              These units will be credited into the facility&apos;s non-sellable quarantine scrap batches (marked with 📦 incoming box badge). They are isolated from active shelves and cannot be sold in POS billing.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <UIButton
                variant="outline"
                size="sm"
                onClick={() => setShowScrapConfirm(false)}
                disabled={isQuarantining}
              >
                Cancel
              </UIButton>
              <UIButton
                variant="primary"
                size="sm"
                onClick={handleQuarantineScrap}
                disabled={isQuarantining}
                startIcon={
                  isQuarantining ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Archive className="size-3.5" />
                  )
                }
                className="font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
              >
                {isQuarantining ? "Quarantining..." : "Confirm & Move to Scrap Bin"}
              </UIButton>
            </div>
          </div>
        </UIModal>
      )}

      {/* Approval Confirmation Modal */}
      {showApproveModal && (
        <UIModal
          isOpen={showApproveModal}
          onClose={() => !isApproving && setShowApproveModal(false)}
          size="md"
        >
          <div className="p-5 font-sans space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border">
              <div className="size-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-4.5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text">
                  Approve Sales Return
                </h3>
                <p className="text-xs text-text-muted">
                  Confirm approval for memo #{returnNo} ({formatCurrency(payableTotal)})
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-text-secondary leading-relaxed">
                Approving this return verifies the return memo and synchronizes the approval
                status and note to the associated Credit Note voucher.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  Approval Note / Remarks:
                </label>
                <textarea
                  rows={3}
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Add approval note (e.g., Goods inspected & approved by manager)..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <UIButton
                variant="outline"
                size="sm"
                onClick={() => setShowApproveModal(false)}
                disabled={isApproving}
              >
                Cancel
              </UIButton>
              <UIButton
                variant="primary"
                size="sm"
                onClick={handleApproveReturn}
                disabled={isApproving}
                startIcon={
                  isApproving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )
                }
                className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                {isApproving ? "Approving..." : "Confirm Approval"}
              </UIButton>
            </div>
          </div>
        </UIModal>
      )}

      {/* Printable Receipt Modal */}
      {itemToDisplay && (
        <OrderInvoiceModal
          isOpen={isPrintModalOpen}
          open={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          saleData={{
            ...itemToDisplay,
            isReturn: true,
            invoiceNo: returnNo,
            customer: itemToDisplay.customerId || { name: customerName, mobile: customerMobile },
          }}
          branch={currentBranch}
          company={currentCompany}
        />
      )}
    </>
  );
};

export default SalesReturnDetailsDrawer;
