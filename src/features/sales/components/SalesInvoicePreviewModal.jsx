// src/features/sales/components/SalesInvoicePreviewModal.jsx

import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Receipt,
  ArrowLeft,
  CreditCard,
  User,
  Calendar,
  Stethoscope,
  AlertCircle,
  Percent,
  RotateCcw,
  Lock,
} from "lucide-react";
import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIButton,
  UIBadge,
} from "@/components";
import { cn } from "@/lib/utils";
import useBranch from "@/features/branch/hooks/useBranch";
import useCompany from "@/features/company/hooks/useCompany";

export const SalesInvoicePreviewModal = ({
  isOpen,
  onClose,
  onProceedToCheckout,
  cart = [],
  customer = null,
  customerName = "",
  customerPhone = "",
  doctorName = "",
  saleDate = "",
  billingMode = "B2C",
  branch: branchProp,
  company: companyProp,
  cartGrandTotal = 0,
  isReturn: isReturnProp = false,
  isReturnInvoice = false,
  activeShift: activeShiftProp,
  openBusinessDay: openBusinessDayProp,
}) => {
  const isReturn = Boolean(isReturnInvoice || isReturnProp);
  const { currentBranch } = useBranch();
  const { currentCompany } = useCompany();

  const activeBranch = branchProp || currentBranch;
  const activeCompany = companyProp || currentCompany;

  const storeShift = useSelector((state) => state.shift?.activeShift);
  const storeBusinessDay = useSelector((state) => state.businessDay?.openBusinessDay);
  const activeShift = activeShiftProp ?? storeShift;
  const openBusinessDay = openBusinessDayProp ?? storeBusinessDay;

  const isShiftOpen = activeShift?.status === "open";
  const isDayOpen = openBusinessDay?.status === "open";
  const isBillingBlocked = !isShiftOpen || !isDayOpen;
  const billingBlockReason = !isShiftOpen
    ? `Shift is currently ${activeShift?.status || "closed"}. Billing is locked.`
    : `Business Day is currently ${openBusinessDay?.status || "closed"}. Billing is locked.`;

  // Keyboard shortcut listener: Enter to Checkout, Esc to Cancel Edit
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
        e.preventDefault();
        if (!isBillingBlocked) {
          onProceedToCheckout?.();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onProceedToCheckout, isBillingBlocked]);

  // Format date once
  const formattedDate = useMemo(() => {
    try {
      const d = saleDate ? new Date(saleDate) : new Date();
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Today";
    }
  }, [saleDate]);

  // Resolved Customer Name and Phone
  const resolvedCustomerName =
    billingMode === "B2C"
      ? (customerName || customer?.name || "Counter Retail Customer")
      : (customer?.name || "B2B Commercial Party");

  const resolvedCustomerPhone =
    billingMode === "B2C"
      ? (customerPhone || customer?.phone || customer?.mobile || "")
      : (customer?.phone || customer?.mobile || "");

  // Normalize and calculate row details once
  const calculatedItems = useMemo(() => {
    return (cart || []).map((item, idx) => {
      const qty = Math.max(1, Number(item.qty) || 1);
      const mrp = Number(item.mrp || item.price || 0);
      const rate = Number(item.price || item.unitPrice || mrp);
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

      const schemePct = Number(item.schemeDiscountPercent || item.schemePercent || 0);
      if (schemePct > 0) {
        discAmount += (grossTotal * schemePct) / 100;
      }

      const taxable = Math.max(0, grossTotal - discAmount);
      const gstRate = Number(item.gst || item.gstRate || 12);
      const gstAmt = (taxable * gstRate) / 100;
      const finalAmt = billingMode === "B2B" ? taxable + gstAmt : grossTotal - discAmount;

      return {
        sr: idx + 1,
        id: item.id || `item-${idx}`,
        name: item.name || "Pharma Product",
        brand: item.brand || item.manufacturer || "",
        category: item.category || "",
        batch: item.batch || item.batchNo || "—",
        expiry: item.expiry || item.expiryDate || item.expDate || "—",
        pack: item.pack || item.packSize || "",
        rack: item.rack || "",
        hsn: item.hsn || item.hsnCode || "300490",
        mrp,
        rate,
        discPct: itemDisc,
        discAmount,
        qty,
        taxable,
        gstRate,
        gstAmt,
        finalAmt,
      };
    });
  }, [cart, billingMode]);

  // Overall financial totals
  const totalMrp = useMemo(() => {
    return calculatedItems.reduce((acc, it) => acc + (it.mrp * it.qty), 0);
  }, [calculatedItems]);

  const totalDiscount = useMemo(() => {
    return calculatedItems.reduce((acc, it) => acc + it.discAmount, 0);
  }, [calculatedItems]);

  const totalTaxable = useMemo(() => {
    return calculatedItems.reduce((acc, it) => acc + it.taxable, 0);
  }, [calculatedItems]);

  const totalGst = useMemo(() => {
    return calculatedItems.reduce((acc, it) => acc + it.gstAmt, 0);
  }, [calculatedItems]);

  const payableTotal = useMemo(() => {
    if (cartGrandTotal > 0) return Number(cartGrandTotal);
    return Math.round(calculatedItems.reduce((acc, it) => acc + it.finalAmt, 0));
  }, [cartGrandTotal, calculatedItems]);

  const totalUnits = useMemo(() => {
    return calculatedItems.reduce((acc, it) => acc + it.qty, 0);
  }, [calculatedItems]);

  // Dynamic GST slabs breakdown (grouped)
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

  if (!isOpen) return null;

  return (
    <UIModal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      size="3xl"
      className="max-w-[1380px] w-[96vw] h-[86vh] max-h-[820px] overflow-hidden p-0 rounded-2xl flex flex-col shadow-2xl"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* ── HEADER STRIP: CUSTOMER + ORDER INFO SHOWN ONCE (NO CLOSE BUTTON) ── */}
        <UIModalHeader className="px-5 py-3 border-b border-border bg-surface-alt/70 shrink-0 pr-5">
          <div className="flex items-center justify-between w-full gap-4">
            {/* Title & Bill Badge */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 rounded-lg border flex items-center justify-center shrink-0 bg-primary/10 border-primary/20 text-primary">
                <Receipt className="size-4.5" />
              </div>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <UIModalTitle className="text-base font-bold text-text truncate">
                  Sale Invoice Preview
                </UIModalTitle>
                <UIBadge
                  variant="outline"
                  className={cn(
                    "text-[9.5px] uppercase font-bold py-0.5",
                    billingMode === "B2B"
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  {billingMode === "B2B" ? "B2B Commercial" : "B2C Retail"}
                </UIBadge>
                <span className="text-[9.5px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25">
                  <AlertCircle className="size-3" />
                  Draft · Unpaid
                </span>
              </div>
            </div>

            {/* Essential Customer Info & Date (Shown Once in Header Strip) */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-text-muted min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <User className="size-3.5 text-primary shrink-0" />
                <span className="font-bold text-text truncate max-w-[180px]">
                  {resolvedCustomerName}
                </span>
                {resolvedCustomerPhone && (
                  <span className="font-mono text-[11px] text-text-muted">
                    ({resolvedCustomerPhone})
                  </span>
                )}
                {customer?.gstin && (
                  <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400">
                    GSTIN: {customer.gstin}
                  </span>
                )}
              </div>

              {doctorName && (
                <div className="hidden md:flex items-center gap-1 min-w-0">
                  <Stethoscope className="size-3 text-text-muted shrink-0" />
                  <span className="font-medium text-text truncate max-w-[120px]">
                    Dr. {doctorName}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1 font-mono text-[11px] shrink-0">
                <Calendar className="size-3 text-text-muted" />
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Item & Unit Count Pill */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono px-3 py-1 rounded-lg bg-surface border border-border text-text font-bold">
                {calculatedItems.length} {calculatedItems.length === 1 ? "Item" : "Items"} · {totalUnits} Units
              </span>
            </div>
          </div>
        </UIModalHeader>

        {/* ── Billing Locked Barrier Strip ── */}
        {isBillingBlocked && (
          <div className="mx-4 sm:mx-5 mt-3 bg-amber-500/15 border border-amber-500/35 rounded-xl px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <Lock className="size-4 text-amber-600 shrink-0" />
              <div className="font-semibold truncate">
                <span className="font-bold">Billing Locked: </span>
                {billingBlockReason}
              </div>
            </div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
              Checkout Blocked
            </span>
          </div>
        )}

        {/* ── TWO-COLUMN BODY: ZERO DIALOG SCROLLING ── */}
        <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-hidden grid grid-cols-12 gap-5">
          {/* ════════════════════════════════════════════════════════════════════
              LEFT COLUMN (8 cols): CLEAN PRODUCT ROWS TABLE WITH INTERNAL SCROLL
          ════════════════════════════════════════════════════════════════════ */}
          <div className="col-span-12 md:col-span-7 lg:col-span-8 flex flex-col h-full min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 rounded-xl border border-border overflow-hidden bg-surface shadow-2xs flex flex-col">
              <div className="flex-1 overflow-x-auto overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 shadow-2xs">
                    <tr className="bg-surface-alt/95 backdrop-blur-xs border-b border-border/80 text-[10.5px] font-bold text-text-muted uppercase tracking-wider select-none">
                      <th className="py-2.5 px-2.5 text-center w-9">#</th>
                      <th className="py-2.5 px-3 min-w-[180px]">Item / Medicine</th>
                      <th className="py-2.5 px-2.5 min-w-[90px] w-[100px]">Batch</th>
                      <th className="py-2.5 px-2 w-[68px]">Exp</th>
                      <th className="py-2.5 px-2 w-[64px] font-mono text-center">Qty</th>
                      <th className="py-2.5 px-2.5 w-[72px] font-mono text-right">MRP</th>
                      <th className="py-2.5 px-2.5 w-[75px] font-mono text-right">Rate</th>
                      <th className="py-2.5 px-2 w-[58px] font-mono text-center">Disc%</th>
                      <th className="py-2.5 px-2 w-[58px] font-mono text-center">GST%</th>
                      <th className="py-2.5 px-3 min-w-[95px] w-[105px] font-mono text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 text-[11.5px]">
                    {calculatedItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-surface-hover/60 transition-colors"
                      >
                        {/* # */}
                        <td className="py-2 px-2.5 text-center text-text-muted font-mono text-[10.5px]">
                          {item.sr}
                        </td>

                        {/* Name & secondary specs */}
                        <td className="py-2 px-3">
                          <span className="font-bold text-text block leading-snug truncate max-w-[240px] text-xs sm:text-[12px]">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-text-muted block truncate mt-0.5">
                            {[item.brand || item.category, item.pack ? `Pk:${item.pack}` : null, item.rack ? `Rk:${item.rack}` : null]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </td>

                        {/* Batch */}
                        <td className="py-2 px-2.5 min-w-[90px]">
                          <span className="font-mono text-xs sm:text-[12px] font-bold text-text tracking-wide truncate block">
                            {item.batch || "—"}
                          </span>
                        </td>

                        {/* Expiry */}
                        <td className="py-2 px-2 font-mono text-[11px] text-text-muted truncate">
                          {item.expiry}
                        </td>

                        {/* Qty */}
                        <td className="py-2 px-2 font-mono text-center text-[11px] font-bold text-text">
                          <span className="inline-block px-1.5 py-0.5 rounded border bg-surface-alt border-border/80">
                            {item.qty}
                          </span>
                        </td>

                        {/* MRP */}
                        <td className="py-2 px-2.5 font-mono text-right text-[11px] text-text-muted tabular-nums">
                          ₹{item.mrp.toFixed(2)}
                        </td>

                        {/* Unit Rate */}
                        <td className="py-2 px-2.5 font-mono text-right text-xs sm:text-[12px] font-bold text-text tabular-nums">
                          ₹{item.rate.toFixed(2)}
                        </td>

                        {/* Disc % */}
                        <td className="py-2 px-2 font-mono text-center text-[10.5px]">
                          {item.discPct > 0 ? (
                            <span className="text-success font-bold">
                              {item.discPct}%
                            </span>
                          ) : (
                            <span className="text-text-muted/50">—</span>
                          )}
                        </td>

                        {/* GST % */}
                        <td className="py-2 px-2 font-mono text-center text-[10.5px] font-bold text-purple-600 dark:text-purple-400">
                          {item.gstRate}%
                        </td>

                        {/* Amount */}
                        <td className="py-2 px-3 font-mono text-right text-[13px] sm:text-[14px] font-black tabular-nums text-primary">
                          ₹{item.finalAmt.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Bar */}
              <div className="px-3.5 py-2 border-t border-border bg-surface-alt/40 flex items-center justify-between text-xs text-text-muted font-mono shrink-0">
                <span>
                  {calculatedItems.length} Products Listed
                </span>
                <span className="text-text font-bold">
                  Total Units: <span className="text-primary">{totalUnits}</span>
                </span>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              RIGHT COLUMN (4 cols): PRICE / COST AMOUNT BOX & ACTIONS
          ════════════════════════════════════════════════════════════════════ */}
          <div className="col-span-12 md:col-span-5 lg:col-span-4 flex flex-col justify-between h-full min-h-0 bg-surface-alt/30 border border-border/80 rounded-xl p-4.5">
            <div className="space-y-4">
              {/* Header Label */}
              <div className="flex items-center justify-between pb-2 border-b border-border/70">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Amount & Tax Summary
                </span>
                <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400">
                  GST Included
                </span>
              </div>

              {/* Price / Cost Totals Breakdown (Shown Once) */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-surface space-y-2 font-mono text-xs">
                <div className="flex justify-between text-text-muted">
                  <span className="font-sans">Total MRP Value:</span>
                  <span className="text-text">₹{totalMrp.toFixed(2)}</span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-success font-semibold">
                    <span className="font-sans">Total Discount:</span>
                    <span>-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-text-muted pt-1.5 border-t border-border/60">
                  <span className="font-sans">Taxable Subtotal:</span>
                  <span className="text-text font-bold">₹{totalTaxable.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-purple-600 dark:text-purple-400">
                  <span className="font-sans">Total GST Tax:</span>
                  <span className="font-bold">+₹{totalGst.toFixed(2)}</span>
                </div>

                {/* Compact GST Slabs Pills */}
                {gstSlabs.length > 0 && (
                  <div className="pt-2 border-t border-border/50 flex flex-wrap gap-1.5">
                    {gstSlabs.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md border bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                      >
                        {s.rate}% GST: ₹{s.totalTax.toFixed(2)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Highlighted Big Payable Amount Box */}
              <div className="border-2 rounded-xl p-4 flex items-center justify-between shadow-2xs bg-primary/10 border-primary/30">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider font-sans block text-primary">
                    Total Payable Amount
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-text font-mono tracking-tight leading-none mt-1 block">
                    ₹{payableTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg bg-surface border inline-block border-primary/25 text-primary">
                    {totalUnits} Units
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Checkout + Cancel Edit */}
            <div className="space-y-2.5 pt-4">
              {isBillingBlocked ? (
                <div className="w-full p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 flex items-center justify-center gap-2 text-xs font-bold shadow-xs text-center">
                  <Lock className="size-4 text-amber-600 shrink-0" />
                  <span>Checkout Disabled · {billingBlockReason}</span>
                </div>
              ) : (
                <UIButton
                  type="button"
                  variant={isReturn ? "destructive" : "primary"}
                  size="lg"
                  onClick={onProceedToCheckout}
                  endIcon={
                    isReturn ? (
                      <RotateCcw className="size-4.5" />
                    ) : (
                      <CreditCard className="size-4.5" />
                    )
                  }
                  className={cn(
                    "w-full h-11.5 text-white font-bold text-sm shadow-md cursor-pointer rounded-xl flex items-center justify-center gap-2",
                    isReturn
                      ? "bg-error hover:bg-error-hover"
                      : "bg-primary hover:bg-primary-hover"
                  )}
                  title={
                    isReturn
                      ? "Proceed to refund / credit settlement (Enter)"
                      : "Proceed to checkout and collect payment (Enter)"
                  }
                >
                  <span>
                    {isReturn ? "Process Return · Refund" : "Checkout"} · ₹{payableTotal.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] opacity-75 font-mono px-1.5 py-0.5 rounded bg-white/20">
                    Enter ↵
                  </span>
                </UIButton>
              )}

              <UIButton
                type="button"
                variant="outline"
                size="md"
                onClick={onClose}
                startIcon={<ArrowLeft className="size-4" />}
                className="w-full h-9 text-xs font-semibold cursor-pointer rounded-xl flex items-center justify-center gap-1.5"
                title="Back to cart to modify items (Esc)"
              >
                <span>Cancel Edit</span>
                <span className="text-[10px] text-text-muted font-mono opacity-80">
                  [Esc]
                </span>
              </UIButton>
            </div>
          </div>
        </div>
      </div>
    </UIModal>
  );
};

export default SalesInvoicePreviewModal;

