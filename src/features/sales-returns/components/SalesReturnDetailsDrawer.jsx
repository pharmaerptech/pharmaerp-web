// src/features/sales-returns/components/SalesReturnDetailsDrawer.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
  Printer,
  Calendar,
  User,
  RotateCcw,
  Banknote,
  Receipt,
  FileText,
  Building2,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  X,
  Archive,
} from "lucide-react";
import {
  UIModal,
  UIButton,
  UIBadge,
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

export const SalesReturnDetailsDrawer = ({ open, isOpen: propIsOpen, onClose, returnItem }) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const { currentBranch } = useBranch();
  const { currentCompany } = useWorkspace();

  const isVisible = Boolean(open ?? propIsOpen);

  // Preserve item data during close animation
  const [activeItem, setActiveItem] = useState(returnItem);

  useEffect(() => {
    if (returnItem) {
      setActiveItem(returnItem);
      const returnId = returnItem._id || returnItem.id;
      if (returnId && (!returnItem.items || returnItem.items.length === 0)) {
        salesReturnService
          .getSalesReturnById(returnId)
          .then((res) => {
            const data = res?.data?.data || res?.data;
            if (data) setActiveItem(data);
          })
          .catch(() => {});
      }
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

  const itemToDisplay = returnItem || activeItem;
  const returnNo = itemToDisplay?.returnNo || itemToDisplay?.invoiceNo || "RET-MEMO";
  let originalInvoiceNo = itemToDisplay?.originalInvoiceNo || itemToDisplay?.originalInvoiceId?.invoiceNo;
  if (!originalInvoiceNo || originalInvoiceNo === returnNo || originalInvoiceNo.startsWith("RET-")) {
    const itOrig = Array.isArray(itemToDisplay?.items)
      ? itemToDisplay.items.find((it) => it.originalInvoiceNo && !it.originalInvoiceNo.startsWith("RET-"))
      : null;
    if (itOrig) originalInvoiceNo = itOrig.originalInvoiceNo;
  }
  originalInvoiceNo = originalInvoiceNo || "—";

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
        motive: item.motive || (itemToDisplay?.returnMotive && itemToDisplay?.returnMotive !== "mixed" ? itemToDisplay?.returnMotive : "general"),
      };
    });
  }, [rawItems, itemToDisplay?.billingMode]);

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
        <div className="p-6 font-sans space-y-5 max-h-[88vh] overflow-y-auto">
          {/* Header (Matching BillingInvoiceDetailsDrawer.jsx) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-error/10 text-error flex items-center justify-center font-bold shrink-0">
                <RotateCcw className="size-5.5 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-mono tracking-tight text-text">
                    {returnNo}
                  </h2>
                  <UIBadge
                    variant="soft"
                    color={isB2B ? "info" : "error"}
                    className="text-[10px] font-bold uppercase tracking-wider"
                  >
                    {isB2B ? "B2B Sales Return" : "B2C Sales Return"}
                  </UIBadge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mt-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="size-3 text-text-muted" /> {returnDate}
                  </span>
                  {returnTime && (
                    <span className="font-mono text-[11px] text-text-muted">
                      • {returnTime}
                    </span>
                  )}
                  {originalInvoiceNo && originalInvoiceNo !== "—" && (
                    <span className="text-primary font-semibold text-[10.5px]">
                      • Against Bill: #{originalInvoiceNo}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <UIBadge
                variant="soft"
                color={isAdvance ? "warning" : isCredit ? "info" : "success"}
                className="text-xs font-semibold px-2.5 py-1 flex items-center gap-1.5"
              >
                <CheckCircle2 className="size-3.5" />
                {isAdvance ? "Advance Credited" : isCredit ? "Credit Note" : "Refund Disbursed"}
              </UIBadge>
            </div>
          </div>

          {/* Clean Business Metadata Grid (Matching BillingInvoiceDetailsDrawer.jsx) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-surface-alt/40 border border-border/70 text-xs">
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <User className="size-3 text-primary" /> Customer
              </span>
              <p className="font-bold text-text text-sm mt-0.5 truncate">{customerName}</p>
              <p className="text-text-muted font-mono text-[11px]">{customerMobile || "No contact"}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <Building2 className="size-3 text-purple-600 dark:text-purple-400" /> Branch
              </span>
              <p className="font-bold text-text mt-0.5 truncate">{branchName}</p>
              <span className="text-[10.5px] text-text-muted">Retail Facility</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" /> Processed By
              </span>
              <p className="font-bold text-text mt-0.5 truncate">
                {cashierName}
              </p>
              <span className="text-[10.5px] text-text-muted truncate block">POS Terminal</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <FileText className="size-3 text-amber-600 dark:text-amber-400" /> Original Bill
              </span>
              <p className="font-bold text-text mt-0.5 font-mono truncate">
                {originalInvoiceNo && originalInvoiceNo !== "—" ? `#${originalInvoiceNo}` : "Direct Return"}
              </p>
              <span className="text-[10.5px] text-text-muted truncate block">Reference Memo</span>
            </div>
          </div>

          {/* Automatic Scrap Store Transfer Order Card */}
          {itemToDisplay?.transferOrderNo && (
            <div className="p-3.5 rounded-xl bg-amber-500/[0.08] dark:bg-amber-500/[0.12] border border-amber-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Archive className="size-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                    Automatic Scrap Store Transfer
                  </span>
                  <p className="font-bold text-text text-sm flex items-center gap-2">
                    <span>Transfer Order #{itemToDisplay.transferOrderNo}</span>
                  </p>
                  <span className="text-[10.5px] text-text-muted">
                    Expired/broken items isolated to Scrap Store branch
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-text-muted block">Destination</span>
                <UIBadge variant="soft" color="warning" size="sm" className="font-semibold">
                  Scrap Store
                </UIBadge>
              </div>
            </div>
          )}

          {/* Dedicated Payment & Denominations Breakdown Section (Matching L489-L570 of BillingInvoiceDetailsDrawer.jsx) */}
          <div className="rounded-xl border border-border bg-surface-alt/30 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-surface border border-border">
                  {isAdvance ? (
                    <CreditCard className="size-4 text-amber-600 dark:text-amber-400" />
                  ) : isCredit ? (
                    <FileText className="size-4 text-sky-600 dark:text-sky-400" />
                  ) : (
                    <Banknote className="size-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </span>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-text">
                    Refund & Settlement Details
                  </h3>
                  <span className="text-[11px] text-text-muted font-medium">
                    Method: <strong className="text-text">{isAdvance ? "Customer Advance Credit" : isCredit ? "Credit Note Ledger" : "Cash Refund Disbursed"}</strong>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10.5px] text-text-muted block">Refund Amount</span>
                <span className="text-base font-bold font-mono text-error tabular-nums">
                  {formatCurrency(payableTotal)}
                </span>
              </div>
            </div>

            {/* If Pure Cash Refund: Show Disbursed Denominations Breakdown */}
            {!isAdvance && !isCredit && (
              <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-text-muted uppercase">Return Memo Amount</span>
                      <p className="font-mono font-bold text-text text-sm">{formatCurrency(payableTotal)}</p>
                    </div>
                    <div className="h-6 w-px bg-border" />
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Cash Disbursed from Drawer</span>
                      <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(payableTotal)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Disbursed Denominations List */}
                {denoms.length > 0 ? (
                  <div className="pt-2.5 border-t border-border space-y-1.5">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                      Disbursed Currency Denominations
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {denoms.map((d, i) => {
                        const config = DENOM_CONFIG[d.note] || { label: `₹${d.note}`, color: "text-text bg-surface-alt border-border" };
                        return (
                          <div
                            key={i}
                            className={cn(
                              "inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium shadow-2xs",
                              config.color
                            )}
                          >
                            <span className="font-bold">{config.label}</span>
                            <span className="text-text-muted">×</span>
                            <span className="font-bold text-text">{d.count}</span>
                            <span className="text-text-muted font-sans">=</span>
                            <span className="font-bold text-text">₹{d.total.toLocaleString("en-IN")}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-text-muted font-mono pt-1">
                    Standard cash refund disbursed without individual note counts recorded.
                  </div>
                )}
              </div>
            )}

            {/* If Customer Advance Deposit */}
            {isAdvance && (
              <div className="p-3.5 rounded-xl bg-amber-500/[0.08] dark:bg-amber-500/[0.12] border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <CreditCard className="size-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                      Customer Advance Deposit
                    </span>
                    <p className="font-bold text-text text-sm">
                      Credited to customer wallet balance
                    </p>
                  </div>
                </div>
                <div className="font-mono text-right">
                  <span className="text-[10px] text-text-muted block">Settlement Status</span>
                  <UIBadge variant="soft" color="warning" size="sm" className="font-semibold">
                    Advance Credited
                  </UIBadge>
                </div>
              </div>
            )}

            {/* If Credit Note */}
            {isCredit && (
              <div className="p-3.5 rounded-xl bg-sky-500/[0.08] dark:bg-sky-500/[0.12] border border-sky-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider block">
                      GSTR-1 Credit Note Ledger
                    </span>
                    <p className="font-bold text-text text-sm">
                      Adjustable against future B2B purchases
                    </p>
                  </div>
                </div>
                <div className="font-mono text-right">
                  <span className="text-[10px] text-text-muted block">Settlement Status</span>
                  <UIBadge variant="soft" color="info" size="sm" className="font-semibold">
                    Credit Note Issued
                  </UIBadge>
                </div>
              </div>
            )}
          </div>

          {/* Returned Line Items Table (Matching L871-L921 of BillingInvoiceDetailsDrawer.jsx) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-text-muted">
                Returned Medicines & Products ({calculatedItems.length})
              </h3>
              <span className="text-[11.5px] text-text-muted font-mono">
                {totalUnits} Total Units Returned
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/70 text-[10.5px] font-bold text-text-muted uppercase select-none">
                    <th className="py-2.5 px-3">Item Name & Brand</th>
                    <th className="py-2.5 px-2 font-mono">Batch</th>
                    <th className="py-2.5 px-2 font-mono">Expiry</th>
                    <th className="py-2.5 px-2 text-center">Condition</th>
                    <th className="py-2.5 px-2 font-mono text-center">GST %</th>
                    <th className="py-2.5 px-2 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Refund Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {calculatedItems.length > 0 ? (
                    calculatedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-hover/50">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-text block">{item.name}</span>
                          <span className="text-[10px] text-text-muted">
                            {[item.brand || "Pharma", item.category || "Medicine", item.pack ? `Pk:${item.pack}` : null, item.rack ? `Rk:${item.rack}` : null]
                              .filter(Boolean)
                              .join(" • ")}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-[11px] text-text-muted font-semibold">{item.batch || "—"}</td>
                        <td className="py-2.5 px-2 font-mono text-[11px] text-text-muted">{item.expiry || "—"}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={cn(
                              "inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
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
                        <td className="py-2.5 px-2 font-mono text-center font-bold text-purple-600 dark:text-purple-400">{item.gstRate}%</td>
                        <td className="py-2.5 px-2 font-mono text-right font-bold text-error tabular-nums">
                          <span className="inline-block px-1.5 py-0.5 rounded border bg-error-soft/40 border-error/30 text-error font-bold">
                            {item.qty} (Ret)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-text-muted tabular-nums">₹{item.rate.toFixed(2)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-error tabular-nums">-₹{item.finalAmt.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-text-muted">
                        No line items recorded for this return memo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic GST Tax Slab Reversal Breakdown (Matching L923-L957 of BillingInvoiceDetailsDrawer.jsx) */}
          {gstSlabs.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-text-muted">
                GST Tax Slab Reversal Breakdown
              </h3>
              <div className="overflow-x-auto rounded-xl border border-border bg-surface-alt/20">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-alt/70 text-[10.5px] font-bold text-text-muted uppercase select-none">
                      <th className="py-2 px-3">GST Rate Slab</th>
                      <th className="py-2 px-3 text-right">Taxable Amount</th>
                      <th className="py-2 px-3 text-right font-mono">CGST</th>
                      <th className="py-2 px-3 text-right font-mono">SGST</th>
                      <th className="py-2 px-3 text-right">Total Tax Reversal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {gstSlabs.map((s, idx) => (
                      <tr key={idx} className="hover:bg-surface-hover/30">
                        <td className="py-2 px-3 font-bold text-purple-600 dark:text-purple-400">{s.rate}% Slab</td>
                        <td className="py-2 px-3 text-right font-mono text-text">₹{s.taxable.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono text-text-muted">₹{s.cgst.toFixed(2)} ({Number(s.rate) / 2}%)</td>
                        <td className="py-2 px-3 text-right font-mono text-text-muted">₹{s.sgst.toFixed(2)} ({Number(s.rate) / 2}%)</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400">₹{s.totalTax.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Financial Calculation Summary Box (Matching L959-L981 of BillingInvoiceDetailsDrawer.jsx) */}
          <div className="p-4 rounded-xl border border-border bg-surface-alt/40 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-text">
              <span className="text-text-muted font-sans font-medium">Subtotal Amount:</span>
              <span className="font-bold">₹{totalTaxable.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span className="font-sans font-medium">Total Discount Reversed:</span>
                <span>-₹{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-purple-600 dark:text-purple-400">
              <span className="font-sans font-medium">GST Tax Reversed:</span>
              <span>-₹{totalGst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-text pt-2 border-t border-border">
              <span className="font-sans">Total Refund Amount:</span>
              <span className="text-error font-mono text-base font-bold">
                ₹{payableTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Footer Action Bar (Matching L983-L1054 of BillingInvoiceDetailsDrawer.jsx) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
            {/* Left side actions */}
            <div className="flex flex-wrap items-center gap-2">
              <UIButton
                variant="outline"
                size="sm"
                onClick={() => setIsPrintModalOpen(true)}
                startIcon={<Printer className="size-4" />}
              >
                Print Return Memo
              </UIButton>

              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="size-3.5 text-emerald-600" /> Restocked & Reconciled
              </span>

              {itemToDisplay?.transferOrderNo && (
                <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                  <Archive className="size-3.5 text-amber-600" /> Scrap Transfer #{itemToDisplay.transferOrderNo}
                </span>
              )}
            </div>

            {/* Right side actions */}
            <div className="flex flex-wrap items-center gap-2">
              <UIButton variant="outline" size="sm" onClick={onClose}>
                Close
              </UIButton>
            </div>
          </div>
        </div>
      </UIModal>

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
