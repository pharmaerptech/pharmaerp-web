import { useState, useEffect, useMemo, useRef } from "react";
import {
  Banknote,
  QrCode,
  CreditCard,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Percent,
  PlusCircle,
  MinusCircle,
  Calculator,
  Trash2,
  Receipt,
  User
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { UIModal, UIButton, UIIconButton, UISelect } from "@/components/ui";
import { PermissionGate } from "@/components/common/PermissionGate";
import usePaymentQr from "@/features/finance/treasury/payment-qr/hooks/usePaymentQr";
import { useBranchCash } from "@/features/finance/treasury/cash-management/branch-cash/hooks/useBranchCash";
import useBranch from "@/features/branch/hooks/useBranch";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import { CashBreakdownModal, decomposeAmount } from "./CashBreakdownModal";

/** Safe number parser */
const safeNum = (v) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

/** Compute scheme discount threshold check. */
const computeSchemeDiscount = (qty, schemePercent) => {
  const normalizedQty = safeNum(qty);
  const normalizedScheme = safeNum(schemePercent);
  if (normalizedQty <= 0 || normalizedScheme <= 0) {
    return { schemeApply: false, finalDiscountPercent: 0 };
  }
  if (normalizedScheme === 50) {
    if (normalizedQty < 2) return { schemeApply: false, finalDiscountPercent: 0 };
    return { schemeApply: true, finalDiscountPercent: normalizedScheme };
  }
  const fullFreeQty = (normalizedQty * normalizedScheme) / (100 - normalizedScheme);
  const quarterThreshold = (normalizedScheme / (100 - normalizedScheme)) / 0.4;
  if (fullFreeQty >= quarterThreshold) {
    return { schemeApply: true, finalDiscountPercent: normalizedScheme };
  }
  return { schemeApply: false, finalDiscountPercent: 0 };
};

/** Stable empty default so the payments-init effect doesn't re-run every render */
const EMPTY_PAYMENTS = [];

/** Convert a denominations array [{denomination, quantity}] into a {denom: qty} map + total */
const denomsToMap = (list = []) => {
  const map = {};
  let total = 0;
  list.forEach((d) => {
    const qty = Number(d?.quantity) || 0;
    const denom = Number(d?.denomination) || 0;
    if (qty > 0 && denom > 0) {
      map[denom] = (map[denom] || 0) + qty;
      total += denom * qty;
    }
  });
  return { map, total };
};

/** Map payments saved on an invoice back into checkout-modal row state */
const buildPaymentMethodLabel = (paymentRows = []) => {
  const unique = [...new Set(
    paymentRows
      .map((row) => String(row?.paymentType || row?.paymentMode || "").trim())
      .filter(Boolean)
  )];

  if (unique.length === 0) return "Cash";
  if (unique.length === 1) return unique[0];
  return unique.join(", ");
};

const mapSavedPayments = (saved, rootDenoms = [], rootReturnedDenoms = []) => {
  let cashRowCount = 0;
  return saved.map((p, idx) => {
    let paymentType = p.paymentType || p.paymentMode || "Cash";
    // Normalize to exact UI casing for display
    if (String(paymentType).toLowerCase() === "cash") paymentType = "Cash";
    if (String(paymentType).toLowerCase() === "upi") paymentType = "UPI";
    
    let cashDetails = p.cashDetails || null;
    
    if (paymentType === "Cash") {
      cashRowCount++;
      let denoms = Array.isArray(p.denominations) && p.denominations.length > 0 ? p.denominations : [];
      let retDenoms = Array.isArray(p.returnedDenominations) && p.returnedDenominations.length > 0 ? p.returnedDenominations : [];
      
      if (cashRowCount === 1) {
        if (denoms.length === 0 && Array.isArray(rootDenoms) && rootDenoms.length > 0) denoms = rootDenoms;
        if (retDenoms.length === 0 && Array.isArray(rootReturnedDenoms) && rootReturnedDenoms.length > 0) retDenoms = rootReturnedDenoms;
      }

      if (!cashDetails && (denoms.length > 0 || retDenoms.length > 0)) {
        const rec = denomsToMap(denoms);
        const ret = denomsToMap(retDenoms);
        cashDetails = {
          received: rec.map,
          receivedTotal: rec.total,
          returned: ret.map,
          returnedTotal: ret.total,
          netApplied: rec.total - ret.total,
        };
      }
    }
    
    return {
      ...p,
      id: p.id || p._id || `saved-${idx}`,
      paymentType,
      amount: Number(p.amount) || 0,
      cashDetails,
    };
  });
};

const PAYMENT_TYPE_OPTIONS = [
  { value: "Cash", label: "Cash", icon: <Banknote className="size-4 text-emerald-600" /> },
  { value: "UPI", label: "UPI / QR", icon: <QrCode className="size-4 text-purple-600" /> },
  { value: "Card", label: "Card", icon: <CreditCard className="size-4 text-blue-600" /> },
  { value: "Wallet", label: "Wallet / Advance", icon: <Wallet className="size-4 text-amber-600" /> },
  { value: "Credit", label: "Credit / Ledger", icon: <Receipt className="size-4 text-rose-600" /> },
];

export const SalesCheckoutModal = ({
  isOpen,
  onClose,
  customer,
  customerPhone,
  doctor,
  saleDate,
  billingMode = "B2C",
  cartSummary = {},
  initialPayments = EMPTY_PAYMENTS,
  initialDenominations = [],
  initialReturnedDenominations = [],
  onCompleteSale,
  activeShift: activeShiftProp,
}) => {
  const navigate = useNavigate();
  const { currentBranch } = useBranch();
  const { paymentQrs, getPaymentQrs } = usePaymentQr();
  const { fetchBranchCash, runningCash, runningDenominations } = useBranchCash();
  const reduxActiveShift = useSelector((state) => state.shift?.activeShift);
  const activeShift = activeShiftProp ?? reduxActiveShift;

  useEffect(() => {
    if (isOpen && currentBranch?._id) {
      getPaymentQrs({});
      fetchBranchCash(currentBranch._id);
    }
  }, [isOpen, currentBranch?._id, getPaymentQrs, fetchBranchCash]);

  // Main operating cash counter (Branch Running Cash)
  const availableCash = useMemo(() => {
    return runningCash || 0;
  }, [runningCash]);

  // Primary QR — pre-selected for UPI payments (zero friction for cashier)
  const primaryQr = useMemo(() => {
    if (!paymentQrs || paymentQrs.length === 0) return null;
    return paymentQrs.find((q) => q.isPrimary && q.status === "ACTIVE") ||
           paymentQrs.find((q) => q.status === "ACTIVE") ||
           paymentQrs[0] || null;
  }, [paymentQrs]);

  const upiOptions = useMemo(() => {
    const activeList = (paymentQrs || []).filter((q) => q.status === "ACTIVE");
    if (activeList.length === 0) {
      return [{ value: "", label: "No active UPI QR configured", disabled: true }];
    }
    return activeList.map((qr) => ({
      value: String(qr._id),
      label: qr.label ? `${qr.label} (${qr.upiId})${qr.isPrimary ? " ★" : ""}` : qr.upiId,
      icon: <QrCode className="size-3.5 text-purple-600" />,
    }));
  }, [paymentQrs]);

  const [discountPercent, setDiscountPercent] = useState(customer?.defaultDiscount || 0);
  const [notes, setNotes] = useState("");

  // Detailed Billing & Tax Calculations
  const items = cartSummary?.items || [];
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * Math.max(1, Number(item.qty) || 1), 0);
  const isB2B = billingMode === "B2B";

  const itemDiscount = items.reduce((sum, item) => {
    return sum + ((Number(item.price) || 0) * Math.max(1, Number(item.qty) || 1) * (Number(item.disc) || 0)) / 100;
  }, 0);

  const schemeDiscount = isB2B ? items.reduce((sum, item) => {
    if (!item?.schemeDiscountPercent) return sum;
    const rate = Number(item.price) || 0;
    const qty = Math.max(1, Number(item.qty) || 1);
    const schemePct = Number(item.schemeDiscountPercent) || 0;
    const schemeCheck = computeSchemeDiscount(qty, schemePct);
    if (!schemeCheck.schemeApply) return sum;
    return sum + (rate * qty * schemePct) / 100;
  }, 0) : 0;

  const subtotalAfterDiscounts = subtotal - itemDiscount - schemeDiscount;
  const extraDiscountAmt = (subtotalAfterDiscounts * (Number(discountPercent) || 0)) / 100;

  const gstSlabMap = {};
  items.forEach((item) => {
    const rate = Number(item.price) || 0;
    const qty = Math.max(1, Number(item.qty) || 1);
    const discPct = Number(item.disc) || 0;
    const rawSchemePct = isB2B ? (Number(item.schemeDiscountPercent) || 0) : 0;
    const schemeCheck = computeSchemeDiscount(qty, rawSchemePct);
    const schemePct = schemeCheck.schemeApply ? rawSchemePct : 0;
    const lineSubtotal = rate * qty * (1 - discPct / 100) * (1 - schemePct / 100);
    const lineFinal = lineSubtotal * (1 - (Number(discountPercent) || 0) / 100);
    const gstPct = Number(item.gst !== undefined && item.gst !== null ? item.gst : 5);

    let taxable, taxAmt;
    if (isB2B) {
      taxable = lineFinal;
      taxAmt = lineFinal * (gstPct / 100);
    } else {
      taxable = lineFinal / (1 + gstPct / 100);
      taxAmt = lineFinal - taxable;
    }
    const halfTax = taxAmt / 2;
    if (!gstSlabMap[gstPct]) gstSlabMap[gstPct] = { gstPct, taxable: 0, cgst: 0, sgst: 0, total: 0 };
    gstSlabMap[gstPct].taxable += taxable;
    gstSlabMap[gstPct].cgst += halfTax;
    gstSlabMap[gstPct].sgst += halfTax;
    gstSlabMap[gstPct].total += taxAmt;
  });

  const gstSlabs = Object.values(gstSlabMap).sort((a, b) => a.gstPct - b.gstPct);
  const totalTaxable = gstSlabs.reduce((acc, s) => acc + s.taxable, 0);
  const totalGst = gstSlabs.reduce((acc, s) => acc + s.total, 0);
  const exactGrandTotal = Math.max(0, totalTaxable + totalGst);
  const grandTotal = Math.round(exactGrandTotal);
  const roundOff = grandTotal - exactGrandTotal;

  // Multi-Row Payments State
  const [payments, setPayments] = useState([]);
  
  // Initialize payments ONLY when the modal transitions closed -> open.
  // Guarded by a ref so unstable prop/selector references can never cause a setState loop.
  const wasOpenRef = useRef(false);
  const hasSavedPayments = Array.isArray(initialPayments) && initialPayments.length > 0;
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (!justOpened) return;

    if (hasSavedPayments) {
      setPayments(mapSavedPayments(initialPayments, initialDenominations, initialReturnedDenominations));
    } else {
      setPayments([
        {
          id: Date.now(),
          paymentType: "Cash",
          amount: grandTotal,
          branchId: currentBranch?._id || "",
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // New bills: keep the single default cash row in sync when grandTotal changes (e.g. extra discount).
  // Functional update returns `prev` when nothing changes, so this can't loop.
  useEffect(() => {
    if (!isOpen || hasSavedPayments) return;
    setPayments((prev) => {
      if (prev.length !== 1) return prev;
      const row = prev[0];
      if (row.paymentType !== "Cash" || Number(row.amount) === grandTotal) return prev;
      return [{ ...row, amount: grandTotal, cashDetails: null }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grandTotal]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const [cashBreakdownTarget, setCashBreakdownTarget] = useState(null); // index of row

  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0), [payments]);
  const shortfall = Math.max(0, grandTotal - totalPaid);

  const handleUpdate = (index, field, value) => {
    const next = [...payments];
    const updated = { ...next[index], [field]: value };
    if (field === "paymentType" && value === "Cash") {
      updated.branchId = currentBranch?._id || "";
      delete updated.paymentQrId;
    }
    // Auto-select primary QR when switching to UPI
    if (field === "paymentType" && (value === "UPI")) {
      if (!updated.paymentQrId && primaryQr?._id) {
        updated.paymentQrId = String(primaryQr._id);
      }
    }
    if (field === "paymentType" && value !== "Cash") {
      delete updated.cashDetails;
    }
    if (field === "amount" && updated.paymentType === "Cash" && updated.cashDetails) {
      if (Number(value) !== Number(next[index].amount)) {
        updated.cashDetails = null;
      }
    }
    next[index] = updated;
    setPayments(next);
  };

  const hasUncapturedCash = useMemo(() => {
    return payments.some((p) => {
      if (p.paymentType !== "Cash") return false;
      const target = Number(p.amount) || 0;
      if (target <= 0) return false;
      if (!p.cashDetails) return true;
      const received = Number(p.cashDetails.receivedTotal) || 0;
      const returned = Number(p.cashDetails.returnedTotal) || 0;
      const expectedChange = Math.max(0, received - target);
      return received < target || returned !== expectedChange;
    });
  }, [payments]);

  const handleAddRow = () => {
    setPayments([
      ...payments,
      {
        id: Date.now(),
        paymentType: "Cash",
        amount: shortfall,
        branchId: currentBranch?._id || "",
        paymentQrId: undefined,
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    const next = [...payments];
    next.splice(index, 1);
    if (next.length === 0) next.push({ id: Date.now(), paymentType: "Cash", amount: grandTotal });
    setPayments(next);
  };

  const handleConfirmCashBreakdown = (data) => {
    if (cashBreakdownTarget !== null) {
      handleUpdate(cashBreakdownTarget, 'cashDetails', data);
      setCashBreakdownTarget(null);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleProcessSale = async () => {
    if (totalPaid < grandTotal) {
      setErrorMessage(`Cannot process sale. Collected amount (₹${totalPaid.toFixed(2)}) is less than Grand Total (₹${grandTotal.toFixed(2)}).`);
      return;
    }

    if (hasUncapturedCash) {
      setErrorMessage("Please capture the exact cash denominations given by the customer for all cash payments.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const prefix = isB2B ? "TAX-INV" : "RET-INV";
      const salePayload = {
        invoiceNo: `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        customer: customerPhone ? { ...customer, phone: customerPhone } : customer,
        doctor: doctor || null,
        date: saleDate ? new Date(saleDate).toISOString() : new Date().toISOString(),
        billingMode,
        partyType: isB2B ? customer?.partyType || "wholesaler" : "retail_consumer",
        items,
        subtotal,
        itemDiscount,
        schemeDiscount,
        extraDiscount: extraDiscountAmt,
        taxableAmount: totalTaxable,
        tax: totalGst,
        roundOff,
        grandTotal,
        gstSlabs,
        paymentMethod: buildPaymentMethodLabel(payments),
        cashTendered: payments.reduce((sum, p) => p.paymentType === "Cash" ? sum + (p.cashDetails?.receivedTotal || Number(p.amount)) : sum, 0),
        changeDue: payments.reduce((sum, p) => p.paymentType === "Cash" ? sum + (p.cashDetails?.returnedTotal || 0) : sum, 0),
        denominations: [],
        payments: payments.map(p => ({
          paymentType: p.paymentType,
          amount: Number(p.amount),
          paymentQrId: p.paymentQrId,
          txnRefNo: p.txnRefNo,
          branchId: p.paymentType === "Cash" ? currentBranch?._id : undefined,
          cashPartition: p.paymentType === "Cash" ? "running" : undefined,
          denominations: p.cashDetails?.received 
            ? Object.entries(p.cashDetails.received).map(([val, qty]) => ({ denomination: Number(val), quantity: qty }))
            : [],
          returnedDenominations: p.cashDetails?.returned 
            ? Object.entries(p.cashDetails.returned).map(([val, qty]) => ({ denomination: Number(val), quantity: qty }))
            : [],
        })),
        notes,
      };

      await onCompleteSale(salePayload);
    } catch (err) {
      console.error("Sale invoice creation error:", err);
      setErrorMessage(err?.response?.data?.message || err.message || "Failed to create invoice in backend");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UIModal isOpen={isOpen} onClose={onClose} size="2xl" title="Sale Preview & Checkout" showCloseButton={false}>
      <div className="p-0 font-sans flex flex-col md:flex-row h-[84vh] max-h-[660px] overflow-hidden">

        {/* ── LEFT: Receipt Preview (Balanced width, ~48%) ── */}
        <div className="w-full md:w-[48%] shrink-0 border-r border-border bg-surface-alt/10 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
            {/* Receipt Paper */}
            <div className="w-full max-w-sm bg-surface shadow-md border border-border rounded-xl overflow-hidden">
              {/* Receipt Header Band */}
              <div className="bg-primary px-5 py-3 text-primary-contrast text-center">
                <h2 className="text-[12.5px] font-black uppercase tracking-widest">
                  {isB2B ? "Tax Invoice" : "Retail Receipt"}
                </h2>
                <p className="text-[10px] opacity-75 mt-0.5">
                  {new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Billed To */}
              <div className="px-4 py-2.5 border-b border-dashed border-border/70">
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-text-muted mb-0.5">Billed To</div>
                <p className="font-bold text-xs text-text leading-tight">{customer?.name || "Walk-in Customer"}</p>
                {customer?.mobile && <p className="text-[10.5px] text-text-muted font-mono mt-0.5">{customer.mobile}</p>}
                {customer?.gstin && <p className="text-[10px] text-text-muted font-mono">GSTIN: {customer.gstin}</p>}
              </div>

              {/* Items list (compact) */}
              <div className="px-4 py-2.5 border-b border-dashed border-border/70">
                <div className="flex justify-between text-[9px] font-bold uppercase text-text-muted mb-1.5">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                <div className="space-y-1 font-mono text-[10.5px]">
                  {items.slice(0, 6).map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-text-muted truncate max-w-[170px]">
                        {item.name} <span className="text-[9.5px]">×{item.qty}</span>
                      </span>
                      <span className="font-bold text-text tabular-nums">
                        ₹{((Number(item.price) || 0) * Math.max(1, Number(item.qty) || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {items.length > 6 && (
                    <div className="text-text-muted text-[9.5px] italic">+{items.length - 6} more items…</div>
                  )}
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="px-4 py-2.5 space-y-1 font-mono text-[10.5px]">
                <div className="flex justify-between">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="text-text">₹{subtotal.toFixed(2)}</span>
                </div>
                {itemDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Item Disc.</span>
                    <span>-₹{itemDiscount.toFixed(2)}</span>
                  </div>
                )}
                {schemeDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Scheme Disc.</span>
                    <span>-₹{schemeDiscount.toFixed(2)}</span>
                  </div>
                )}
                {extraDiscountAmt > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Extra Disc. ({discountPercent}%)</span>
                    <span>-₹{extraDiscountAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-dotted border-border/60">
                  <span className="text-text-muted">Taxable</span>
                  <span className="text-text">₹{totalTaxable.toFixed(2)}</span>
                </div>
                {gstSlabs.map((slab) => (
                  <div key={slab.gstPct} className="flex justify-between text-purple-600 dark:text-purple-400 text-[10px]">
                    <span>GST {slab.gstPct}%</span>
                    <span className="font-bold">₹{slab.total.toFixed(2)}</span>
                  </div>
                ))}
                {roundOff !== 0 && (
                  <div className="flex justify-between text-text-muted text-[10px]">
                    <span>Round Off</span>
                    <span>{roundOff > 0 ? "+" : "-"}₹{Math.abs(roundOff).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Grand Total Bar */}
              <div className="px-4 py-2.5 bg-primary text-primary-contrast flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Grand Total</span>
                <span className="text-lg font-black font-mono tabular-nums">₹{grandTotal.toFixed(2)}</span>
              </div>

              {/* Extra Discount Controls */}
              <div className="px-4 py-2.5 border-t border-dashed border-border/60 bg-surface-alt/50 space-y-1.5">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">
                  Extra Discount Preset (%)
                </label>
                <div className="flex gap-1 flex-wrap items-center">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercent(pct)}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all border cursor-pointer",
                        Number(discountPercent) === pct
                          ? "bg-primary text-primary-contrast border-primary/20 shadow-xs"
                          : "border-border bg-surface text-text hover:bg-surface-hover"
                      )}
                    >
                      {pct}%
                    </button>
                  ))}
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-14 h-[26px] rounded-md border border-border bg-surface px-1.5 text-[10px] font-mono font-bold text-center focus:border-primary focus:outline-none"
                    placeholder="Custom"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Payment Collection (Balanced width, ~52%, 2-Column fields) ── */}
        <div className="w-full md:w-[52%] flex-1 flex flex-col min-h-0 bg-surface overflow-hidden">

          {/* Amount to Collect Header Bar */}
          <div className="px-5 py-3 border-b border-border bg-surface-alt/40 shrink-0 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Amount to Collect</p>
              <p className="text-2xl font-black text-text tabular-nums font-mono leading-none mt-0.5">
                ₹{grandTotal.toFixed(2)}
              </p>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-xl text-xs font-bold border transition-all",
              shortfall === 0
                ? "bg-success-soft text-success border-success/30"
                : "bg-warning-soft text-warning border-warning/30"
            )}>
              {shortfall === 0 ? "✓ Balanced" : `Short ₹${shortfall.toFixed(2)}`}
            </div>
          </div>

          {/* Payment Methods (2-column grid layout, fits without scrolling) */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
            {payments.map((row, index) => (
              <div key={row.id} className="p-3.5 rounded-xl border border-border bg-surface shadow-xs space-y-2.5">

                {/* 2-Column: Payment Type (Col 1) + Amount (Col 2) */}
                <div className="grid grid-cols-2 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                      Payment Method
                    </label>
                    <UISelect
                      value={row.paymentType}
                      onChange={(val) => handleUpdate(index, "paymentType", val)}
                      options={PAYMENT_TYPE_OPTIONS}
                      size="sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                        Amount (₹)
                      </label>
                      {payments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(index)}
                          className="text-text-muted hover:text-error transition-colors p-0.5 cursor-pointer rounded"
                          title="Remove payment row"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={row.amount}
                        onChange={(e) => handleUpdate(index, "amount", e.target.value)}
                        className="w-full h-8 rounded-lg border border-border bg-surface-alt text-xs font-mono font-bold text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 px-2.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>

                {/* If UPI: 2-Column layout for UPI Account & Txn Ref */}
                {row.paymentType === "UPI" && (
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/50 animate-in fade-in">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                        UPI Account
                      </label>
                      <UISelect
                        value={row.paymentQrId || (primaryQr?._id ? String(primaryQr._id) : "")}
                        onChange={(val) => handleUpdate(index, "paymentQrId", val)}
                        options={upiOptions}
                        size="sm"
                        placeholder="Select UPI Account"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                        Txn Ref No (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UPI Ref / Txn ID"
                        value={row.txnRefNo || ""}
                        onChange={(e) => handleUpdate(index, "txnRefNo", e.target.value)}
                        className="w-full h-8 rounded-lg border border-border bg-surface-alt text-xs focus:border-primary focus:outline-none px-2.5"
                      />
                    </div>
                  </div>
                )}

                {/* If Cash: 2-Column layout for Drawer Info & Denominations Action */}
                {row.paymentType === "Cash" && (
                  <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-border/50 items-center">
                    {/* Col 1: Cash Drawer Available */}
                    <div className="p-2 rounded-lg border border-success/20 bg-success-soft/10 flex items-center gap-2">
                      <Wallet className="size-3.5 text-success shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[9.5px] font-bold text-text-muted uppercase block leading-none">
                          {activeShift ? "Shift Drawer" : "Running Cash"}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-success truncate block">
                          ₹{Number(availableCash).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Col 2: Notes / Denominations Stepper Button */}
                    <div className="flex items-center gap-1.5">
                      {!row.cashDetails && (
                        <UIButton
                          variant="outline"
                          size="xs"
                          type="button"
                          onClick={() => {
                            const amt = Number(row.amount) || 0;
                            const exactMap = decomposeAmount(amt);
                            handleUpdate(index, "cashDetails", {
                              received: exactMap,
                              returned: {},
                              receivedTotal: amt,
                              returnedTotal: 0,
                              netApplied: amt,
                            });
                          }}
                          className="h-8 text-[10.5px] font-bold border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 shrink-0"
                          title="Instantly accept exact cash notes"
                        >
                          Exact ₹{Math.round(Number(row.amount) || 0)}
                        </UIButton>
                      )}
                      <UIButton
                        variant={row.cashDetails ? "soft" : "outline"}
                        size="xs"
                        fullWidth={!!row.cashDetails}
                        onClick={() => setCashBreakdownTarget(index)}
                        startIcon={<Calculator className="size-3" />}
                        className={cn(
                          "h-8 text-[11px] font-bold flex-1",
                          !row.cashDetails ? "border-amber-400/60 text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20" : ""
                        )}
                      >
                        {row.cashDetails ? "Edit Notes" : "Drawer Notes *"}
                      </UIButton>
                    </div>
                  </div>
                )}

                {/* Cash: Captured Denominations Summary (2-column badges) */}
                {row.paymentType === "Cash" && row.cashDetails && (() => {
                  const receivedMap = row.cashDetails.received || {};
                  const returnedMap = row.cashDetails.returned || {};
                  const receivedEntries = Object.entries(receivedMap).filter(([, qty]) => Number(qty) > 0).sort(([a], [b]) => Number(b) - Number(a));
                  const returnedEntries = Object.entries(returnedMap).filter(([, qty]) => Number(qty) > 0).sort(([a], [b]) => Number(b) - Number(a));

                  return (
                    <div className="p-2 rounded-lg border border-success/30 bg-success-soft/10 text-[10.5px] font-mono space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between text-[10px] font-bold text-success">
                        <span>Notes Received: ₹{Number(row.cashDetails.receivedTotal).toLocaleString("en-IN")}</span>
                        <span>Net: ₹{Number(row.cashDetails.netApplied || row.amount).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {receivedEntries.map(([denom, qty]) => (
                          <span key={`rec-${denom}`} className="px-1.5 py-0.5 rounded bg-surface border border-success/30 text-[10px] font-bold text-text">
                            ₹{denom}×{qty}
                          </span>
                        ))}
                      </div>
                      {Number(row.cashDetails.returnedTotal) > 0 && (
                        <div className="pt-1 border-t border-success/20 flex items-center justify-between text-[10px] text-warning font-bold">
                          <span>Change Returned:</span>
                          <span>₹{Number(row.cashDetails.returnedTotal).toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Cash: warning if denominations missing */}
                {row.paymentType === "Cash" && !row.cashDetails && (
                  <div className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center gap-1.5 text-[10.5px] text-amber-700 dark:text-amber-300 font-medium">
                    <AlertCircle className="size-3.5 text-amber-600 shrink-0" />
                    <span>Exact currency denominations required for this cash payment.</span>
                  </div>
                )}
              </div>
            ))}

            {/* Compact Add Split Payment */}
            <button
              type="button"
              onClick={handleAddRow}
              className="w-full py-2 rounded-lg border border-dashed border-primary/40 text-primary text-xs font-bold bg-primary-soft/5 hover:bg-primary-soft/15 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="size-3.5" />
              Add Split Payment Method
            </button>
          </div>

          {/* Footer: Compact, Shorter Confirm Button (Fit) */}
          <div className="px-4 py-2.5 border-t border-border bg-surface shrink-0 flex items-center justify-between gap-3">
            <div className="min-w-0">
              {errorMessage ? (
                <span className="text-[11px] font-semibold text-error truncate block">
                  {errorMessage}
                </span>
              ) : hasUncapturedCash ? (
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 truncate block">
                  ⚠️ Select cash denominations to continue
                </span>
              ) : (
                <span className="text-[11px] text-text-muted truncate block">
                  {items.length} item{items.length !== 1 ? "s" : ""} · {isB2B ? "B2B Invoice" : "B2C Receipt"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <UIButton variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </UIButton>
              <PermissionGate
                permission="pos:create"
                fallback={
                  <UIButton variant="primary" size="sm" disabled>
                    Permission Required
                  </UIButton>
                }
              >
                <UIButton
                  variant="success"
                  size="sm"
                  className="px-5 font-bold"
                  isLoading={isSubmitting}
                  loadingText="Processing..."
                  disabled={isSubmitting || shortfall > 0 || hasUncapturedCash}
                  onClick={handleProcessSale}
                  startIcon={<CheckCircle2 className="size-4" />}
                >
                  Confirm Sale
                </UIButton>
              </PermissionGate>
            </div>
          </div>

        </div>
      </div>

      {(() => {
        return (
          <CashBreakdownModal
            isOpen={cashBreakdownTarget !== null}
            onClose={() => setCashBreakdownTarget(null)}
            onConfirm={handleConfirmCashBreakdown}
            targetAmount={cashBreakdownTarget !== null ? Number(payments[cashBreakdownTarget]?.amount || 0) : 0}
            initialReceived={cashBreakdownTarget !== null ? payments[cashBreakdownTarget]?.cashDetails?.received : {}}
            initialReturned={cashBreakdownTarget !== null ? payments[cashBreakdownTarget]?.cashDetails?.returned : {}}
            availableDenominations={runningDenominations || []}
            availableBalance={runningCash || 0}
            cashAccountName="Branch Cash (Running)"
          />
        );
      })()}
    </UIModal>
  );
};

export default SalesCheckoutModal;
