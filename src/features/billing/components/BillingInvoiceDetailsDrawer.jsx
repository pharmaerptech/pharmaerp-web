import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  CreditCard,
  User,
  Trash2,
  Tag,
  Clock,
  ShieldCheck,
  Edit2,
  AlertTriangle,
  Banknote,
  QrCode,
  ArrowLeftRight,
  Layers,
  Receipt,
  Stethoscope,
  Lock,
  Unlock,
  Check,
  Landmark,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { UIModal, UIButton, UIBadge } from "@/components/ui";
import { PermissionGate } from "@/components/common/PermissionGate";
import useBranch from "@/features/branch/hooks/useBranch";
import shiftService from "@/features/operations/shifts/services/shiftService";
import { OrderInvoiceModal } from "@/features/sales/components";
import CancelInvoiceRefundModal from "./CancelInvoiceRefundModal";
import { cn } from "@/lib/utils";

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

const normalizeDenominations = (denoms) => {
  if (!denoms) return [];
  if (Array.isArray(denoms)) {
    return denoms
      .map((d) => {
        const note = Number(d.denomination || d.note || d.val || 0);
        const count = Number(d.quantity || d.count || d.qty || 0);
        return { note, count, total: note * count };
      })
      .filter((d) => d.note > 0 && d.count > 0);
  }
  if (typeof denoms === "object") {
    return Object.entries(denoms)
      .map(([k, v]) => {
        const note = Number(k);
        const count = Number(v);
        return { note, count, total: note * count };
      })
      .filter((d) => d.note > 0 && d.count > 0);
  }
  return [];
};

const resolveUpiAccount = (sourceObj) => {
  if (!sourceObj) return null;
  const qr =
    sourceObj.paymentQr ||
    (typeof sourceObj.paymentQrId === "object" ? sourceObj.paymentQrId : null);

  const bankName =
    qr?.bankName ||
    qr?.bankAccountId?.bankMasterId?.bankName ||
    qr?.bankAccountId?.accountName ||
    sourceObj.bankName ||
    "";

  const label = qr?.label || sourceObj.label || "";
  const upiId = qr?.upiId || sourceObj.upiId || "";
  const provider = qr?.provider || sourceObj.provider || "";

  let mainTitle = "";
  if (bankName && label && !label.toLowerCase().includes(bankName.toLowerCase())) {
    mainTitle = `${bankName} (${label})`;
  } else {
    mainTitle = bankName || label || provider || "UPI Linked Account";
  }

  return {
    bankName,
    label,
    upiId,
    provider,
    mainTitle,
  };
};

// Global in-memory cache for shift statuses across invoice drawer clicks to eliminate network latency
const shiftStatusCache = new Map();

export const BillingInvoiceDetailsDrawer = ({
  invoice,
  isOpen,
  onClose,
  onCancelInvoice,
}) => {
  const navigate = useNavigate();
  const reduxActiveShift = useSelector((state) => state.shift?.activeShift);
  const { currentBranch } = useBranch();

  const [shiftData, setShiftData] = useState(null);
  const [isCheckingShift, setIsCheckingShift] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const invShiftId = invoice?.shiftId?._id || invoice?.shift?._id || invoice?.shiftId;

  // Immediate synchronous determination (0ms frame-0 resolution)
  const immediateShiftStatus = useMemo(() => {
    if (!invoice) return null;
    if (invoice.shiftStatus) return invoice.shiftStatus;
    if (invoice.shift?.status) return invoice.shift.status;
    if (invShiftId && shiftStatusCache.has(String(invShiftId))) {
      return shiftStatusCache.get(String(invShiftId)).status;
    }
    if (reduxActiveShift) {
      if (invShiftId && String(invShiftId) === String(reduxActiveShift._id)) {
        return reduxActiveShift.status || "open";
      }
      if (invShiftId && reduxActiveShift._id && String(invShiftId) !== String(reduxActiveShift._id)) {
        return "closed";
      }
    }
    return null;
  }, [invoice, invShiftId, reduxActiveShift]);

  const resolvedShiftStatus = shiftData?.status || immediateShiftStatus || null;
  const isShiftOpen = resolvedShiftStatus === "open";
  const canEditOrCancel = invoice && invoice.status !== "Cancelled" && isShiftOpen;

  // Background shift fetch only if status is not already resolved
  useEffect(() => {
    setIsCancelling(false);
    setShowConfirmCancel(false);

    if (!isOpen || !invoice) {
      setShiftData(null);
      return;
    }

    if (!invShiftId) {
      setShiftData(null);
      return;
    }

    if (immediateShiftStatus) {
      const entry = { status: immediateShiftStatus, _id: invShiftId };
      shiftStatusCache.set(String(invShiftId), entry);
      setShiftData(entry);
      return;
    }

    if (shiftStatusCache.has(String(invShiftId))) {
      setShiftData(shiftStatusCache.get(String(invShiftId)));
      return;
    }

    let isSubscribed = true;
    setIsCheckingShift(true);

    shiftService
      .getShiftById(invShiftId)
      .then((res) => {
        if (!isSubscribed) return;
        const s = res.data?.data;
        const entry = s ? { status: s.status || "closed", _id: invShiftId } : { status: "closed", _id: invShiftId };
        shiftStatusCache.set(String(invShiftId), entry);
        setShiftData(entry);
      })
      .catch(() => {
        if (!isSubscribed) return;
        const fallback = { status: "closed", _id: invShiftId };
        shiftStatusCache.set(String(invShiftId), fallback);
        setShiftData(fallback);
      })
      .finally(() => {
        if (isSubscribed) setIsCheckingShift(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, invoice?.id, invShiftId, immediateShiftStatus]);

  const handleConfirmCancel = async (cancelData = {}) => {
    if (isCancelling || !invoice?.id) return;
    setIsCancelling(true);
    try {
      await onCancelInvoice(invoice.id, cancelData);
      setShowConfirmCancel(false);
    } catch (err) {
      console.error("Cancel invoice error:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return <UIBadge variant="soft" color="success">Paid</UIBadge>;
      case "Pending":
        return <UIBadge variant="soft" color="warning">Pending</UIBadge>;
      case "Overdue":
        return <UIBadge variant="soft" color="error">Overdue</UIBadge>;
      case "Cancelled":
        return <UIBadge variant="soft" color="error">Cancelled</UIBadge>;
      default:
        return <UIBadge variant="soft" color="neutral">{status}</UIBadge>;
    }
  };

  // Parse detailed payment breakdown & denominations once per invoice
  const paymentBreakdown = useMemo(() => {
    if (!invoice) {
      return {
        isB2B: false,
        items: [],
        cashTotal: 0,
        upiTotal: 0,
        creditNoteTotal: 0,
        advanceTotal: 0,
        creditTotal: 0,
        cardTotal: 0,
        otherTotal: 0,
        cashDenoms: [],
        returnedDenoms: [],
        upiDetails: [],
        creditNoteAllocations: [],
        isSplit: false,
        cashTendered: 0,
        changeDue: 0,
        paymentMethodUpper: "",
      };
    }

    const isB2B = invoice.billingMode === "B2B";
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const paymentMethodUpper = String(invoice.paymentMode || invoice.paymentMethod || "").trim().toUpperCase();
    const rawPayments = Array.isArray(invoice.payments) ? invoice.payments : [];

    let cashTotal = 0;
    let upiTotal = 0;
    let creditNoteTotal = Number(invoice.creditNoteTotal || 0);
    let advanceTotal = 0;
    let creditTotal = 0;
    let cardTotal = 0;
    let otherTotal = 0;
    let cashDenoms = normalizeDenominations(invoice.denominations);
    let returnedDenoms = normalizeDenominations(invoice.returnedDenominations);
    const upiDetails = [];
    let creditNoteAllocations = Array.isArray(invoice.creditNoteAllocations) ? invoice.creditNoteAllocations : [];

    const invoiceQrAccount = resolveUpiAccount(invoice);

    if (rawPayments.length > 0) {
      for (const p of rawPayments) {
        const type = String(p.paymentType || p.paymentMode || p.type || "").toUpperCase().replace(/[\s_-]/g, "");
        const amt = Number(p.amount || 0);
        if (type.includes("UPI") || type.includes("QR")) {
          upiTotal += amt;
          const pQrAccount = resolveUpiAccount(p) || invoiceQrAccount;
          upiDetails.push({
            amount: amt,
            ref: p.txnRefNo || p.referenceNo || p.transactionId || null,
            account: pQrAccount,
          });
        } else if (type.includes("CASH")) {
          cashTotal += amt;
          if (p.denominations && p.denominations.length > 0 && cashDenoms.length === 0) {
            cashDenoms = normalizeDenominations(p.denominations);
          }
          if (p.returnedDenominations && p.returnedDenominations.length > 0 && returnedDenoms.length === 0) {
            returnedDenoms = normalizeDenominations(p.returnedDenominations);
          }
        } else if (type.includes("CREDITNOTE")) {
          creditNoteTotal += amt;
          if (Array.isArray(p.creditNoteAllocations) && p.creditNoteAllocations.length > 0) {
            creditNoteAllocations = p.creditNoteAllocations;
          }
        } else if (type.includes("ADVANCE")) {
          advanceTotal += amt;
        } else if (type.includes("CREDIT") || type.includes("UDHAR")) {
          creditTotal += amt;
        } else if (type.includes("CARD")) {
          cardTotal += amt;
        } else {
          otherTotal += amt;
        }
      }
    } else if (paymentMethodUpper === "SPLIT") {
      const grand = Number(invoice.amount || 0);
      const tendered = Number(invoice.cashTendered || 0);
      if (tendered > 0) {
        cashTotal = Math.min(grand, tendered);
        upiTotal = Math.max(0, grand - cashTotal);
      }
      if (upiTotal > 0) {
        upiDetails.push({
          amount: upiTotal,
          ref: invoice.txnRefNo || invoice.referenceNo || null,
          account: invoiceQrAccount,
        });
      }
    } else if (paymentMethodUpper === "UPI") {
      upiTotal = Number(invoice.amount || 0);
      upiDetails.push({
        amount: upiTotal,
        ref: invoice.txnRefNo || invoice.referenceNo || null,
        account: invoiceQrAccount,
      });
    } else if (paymentMethodUpper === "CASH") {
      cashTotal = Number(invoice.amount || 0);
    } else if (paymentMethodUpper.replace(/[\s_-]/g, "") === "CREDITNOTE") {
      creditNoteTotal = Number(invoice.amount || 0);
    } else if (paymentMethodUpper === "ADVANCE") {
      advanceTotal = Number(invoice.amount || 0);
    } else if (paymentMethodUpper === "CREDIT") {
      creditTotal = Number(invoice.amount || 0);
    } else if (paymentMethodUpper === "CARD") {
      cardTotal = Number(invoice.amount || 0);
    } else {
      otherTotal = Number(invoice.amount || 0);
    }

    if (upiTotal > 0 && upiDetails.length === 0) {
      upiDetails.push({
        amount: upiTotal,
        ref: invoice.txnRefNo || invoice.referenceNo || null,
        account: invoiceQrAccount,
      });
    }

    const activeModes = [cashTotal, upiTotal, creditNoteTotal, advanceTotal, creditTotal, cardTotal, otherTotal].filter(a => a > 0);
    const isSplit = paymentMethodUpper === "SPLIT" || rawPayments.length > 1 || activeModes.length > 1;

    const cashTendered = Number(invoice.cashTendered || invoice.paidAmount || (cashTotal > 0 ? cashTotal : 0));
    const changeDue = Number(invoice.changeDue || 0);

    return {
      isB2B,
      items,
      cashTotal,
      upiTotal,
      creditNoteTotal,
      advanceTotal,
      creditTotal,
      cardTotal,
      otherTotal,
      cashDenoms,
      returnedDenoms,
      upiDetails,
      creditNoteAllocations,
      isSplit,
      cashTendered,
      changeDue,
      paymentMethodUpper,
    };
  }, [invoice]);

  const {
    isB2B,
    items,
    cashTotal,
    upiTotal,
    creditNoteTotal,
    advanceTotal,
    creditTotal,
    cardTotal,
    otherTotal,
    cashDenoms,
    returnedDenoms,
    upiDetails,
    creditNoteAllocations,
    isSplit,
    cashTendered,
    changeDue,
    paymentMethodUpper,
  } = paymentBreakdown;

  // Memoize GST tax slab calculations
  const gstSlabEntries = useMemo(() => {
    if (!items || items.length === 0) return [];
    const slabs = {};
    for (const item of items) {
      const gstRate = Number(item.gst) || 5;
      const lineSubtotal = Number(item.qty || 1) * Number(item.price || 0);
      const lineTax = (lineSubtotal * gstRate) / 100;
      if (!slabs[gstRate]) {
        slabs[gstRate] = { taxableAmount: 0, taxAmount: 0 };
      }
      slabs[gstRate].taxableAmount += lineSubtotal;
      slabs[gstRate].taxAmount += lineTax;
    }
    return Object.entries(slabs);
  }, [items]);

  // Normalize linked return bills
  const returnList = useMemo(() => {
    if (!invoice) return [];
    if (Array.isArray(invoice.returnInvoices) && invoice.returnInvoices.length > 0) {
      return invoice.returnInvoices;
    }
    if (Array.isArray(invoice.returns) && invoice.returns.length > 0) {
      return invoice.returns;
    }
    if (Array.isArray(invoice.returnInvoiceIds) && invoice.returnInvoiceIds.length > 0) {
      return invoice.returnInvoiceIds.map((item, idx) => {
        if (typeof item === "object" && item !== null) {
          return {
            returnNo: item.returnNo || item.invoiceNo || `RET-${idx + 1}`,
            date: item.date || item.createdAt,
            returnAmount: Number(item.grandTotal || item.netRefundAmount || item.totalAmount || item.returnAmount || 0),
            returnType: item.returnType || item.refundMethod || "cash_refund",
          };
        }
        return {
          returnNo: String(item),
          date: null,
          returnAmount: Number(invoice.totalReturnedAmount || 0),
          returnType: "cash_refund",
        };
      });
    }
    return [];
  }, [invoice]);

  const totalReturnedAmount = useMemo(() => {
    if (!invoice) return 0;
    if (Number(invoice.totalReturnedAmount) > 0) {
      return Number(invoice.totalReturnedAmount);
    }
    return returnList.reduce((sum, r) => sum + (Number(r.returnAmount || r.grandTotal || r.netRefundAmount || 0)), 0);
  }, [invoice, returnList]);

  if (!isOpen || !invoice) return null;

  return (
    <>
      <UIModal
        isOpen={isOpen}
        onClose={isCancelling ? undefined : onClose}
        closeOnBackdrop={!isCancelling}
        closeOnEsc={!isCancelling}
        showCloseButton={!isCancelling}
        size="xl"
      >
        <div className="p-6 font-sans space-y-5 max-h-[88vh] overflow-y-auto">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                <Receipt className="size-5.5 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-mono tracking-tight text-text">
                    {invoice.invoiceNo}
                  </h2>
                  <UIBadge
                    variant="soft"
                    color={isB2B ? "info" : "success"}
                    className="text-[10px] font-bold uppercase tracking-wider"
                  >
                    {isB2B ? "B2B Tax Invoice" : "B2C Retail Bill"}
                  </UIBadge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mt-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="size-3 text-text-muted" /> {invoice.issueDate}
                  </span>
                  {invoice.createdAt && (
                    <span className="font-mono text-[11px] text-text-muted">
                      • {new Date(invoice.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </span>
                  )}
                  {invoice.updatedAt && invoice.createdAt && (new Date(invoice.updatedAt).getTime() - new Date(invoice.createdAt).getTime() > 2000) && (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold text-[10.5px]">
                      • Edited: {new Date(invoice.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(invoice.status)}
              {invoice.isFullyReturned || invoice.returnStatus === "FULL" ? (
                <UIBadge variant="soft" color="error">Returned (Full)</UIBadge>
              ) : invoice.isReturned || invoice.returnStatus === "PARTIAL" ? (
                <UIBadge variant="soft" color="warning">Partially Returned</UIBadge>
              ) : null}
            </div>
          </div>

          {/* Clean Business Metadata Grid (No Technical IDs) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-surface-alt/40 border border-border/70 text-xs">
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <User className="size-3 text-primary" /> Customer
              </span>
              <p className="font-bold text-text text-sm mt-0.5 truncate">{invoice.customer}</p>
              <p className="text-text-muted font-mono text-[11px]">{invoice.phone}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <Building2 className="size-3 text-purple-600 dark:text-purple-400" /> Branch
              </span>
              <p className="font-bold text-text mt-0.5 truncate">{invoice.branchName || "Main Branch"}</p>
              <span className="text-[10.5px] text-text-muted">Retail Facility</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" /> Billed By
              </span>
              <p className="font-bold text-text mt-0.5 truncate">
                {invoice.createdByName
                  ? (invoice.createdByName.includes("@") ? invoice.createdByName.split("@")[0] : invoice.createdByName)
                  : "Cashier"}
              </p>
              <span className="text-[10.5px] text-text-muted truncate block">POS Terminal</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <Clock className="size-3 text-amber-600 dark:text-amber-400" /> Shift Session
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                {isShiftOpen ? (
                  <UIBadge variant="dot" color="success" className="text-[10.5px] font-semibold">
                    Shift Open
                  </UIBadge>
                ) : (
                  <UIBadge variant="dot" color="neutral" className="text-[10.5px] font-semibold">
                    Shift Closed
                  </UIBadge>
                )}
              </div>
            </div>
          </div>

          {/* Returns Related Bills Section */}
          {returnList.length > 0 && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-surface border border-rose-500/20 text-rose-600 dark:text-rose-400">
                    <RotateCcw className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-text">
                      Returns Related Bills ({returnList.length})
                    </h3>
                    <span className="text-[11px] text-text-muted font-medium">
                      Return bills issued against this sale invoice
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-text-muted block">Total Refunded</span>
                  <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                    {formatCurrency(totalReturnedAmount)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {returnList.map((ret, rIdx) => {
                  const retNo = ret.returnNo || ret.invoiceNo || (typeof ret === "string" ? ret : `Return-${rIdx + 1}`);
                  const retDate = ret.date || ret.createdAt;
                  const retFormattedDate = retDate
                    ? new Date(retDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : null;
                  const method =
                    ret.returnType === "advance_credit" || ret.refundMethod === "ADVANCE"
                      ? "Advance Deposit"
                      : ret.returnType === "credit_note" || ret.refundMethod === "CREDIT_NOTE"
                      ? "Credit Note"
                      : "Cash Refund";
                  const retAmount = Number(ret.returnAmount || ret.grandTotal || ret.netRefundAmount || 0);

                  return (
                    <div
                      key={rIdx}
                      className="p-3 rounded-xl bg-surface border border-border/80 flex items-center justify-between gap-3 text-xs shadow-2xs hover:border-rose-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                        <span className="text-text-muted text-[11px] font-medium">Return Bill:</span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs sm:text-[13px]">
                          #{retNo}
                        </span>
                        <UIBadge variant="soft" color="error" className="text-[9.5px] font-bold">
                          {method}
                        </UIBadge>
                        {retFormattedDate && (
                          <span className="text-text-muted font-mono text-[11px]">
                            • {retFormattedDate}
                          </span>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-text-muted block">Refund Amount</span>
                        <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400 tabular-nums">
                          {formatCurrency(retAmount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Related Original Bill (When Viewing a Sales Return) */}
          {(invoice.isReturn || invoice.originalInvoiceNo) && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-surface border border-rose-500/20 text-rose-600 dark:text-rose-400">
                    <RotateCcw className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-text">
                      Original Sale Bill Reference
                    </h3>
                    <span className="text-[11px] text-text-muted font-medium">
                      Sale invoice against which this return was processed
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-text-muted block">Refund Amount</span>
                  <span className="text-base font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                    {formatCurrency(invoice.amount || invoice.grandTotal || 0)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border/80 flex items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <span className="text-text-muted text-[11px] font-medium">Original Sale Bill:</span>
                  <span className="font-mono font-bold text-primary text-xs sm:text-[13px]">
                    #{invoice.originalInvoiceNo || "Original Bill"}
                  </span>
                  {invoice.originalInvoiceDate && (
                    <span className="text-text-muted font-mono text-[11px]">
                      {new Date(invoice.originalInvoiceDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-text-muted block">Bill Total</span>
                  <span className="font-mono font-bold text-sm text-text tabular-nums">
                    {formatCurrency(invoice.originalInvoiceGrandTotal || invoice.originalGrandTotal || invoice.amount || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Dedicated Payment & Denominations Breakdown Section */}
          <div className="rounded-xl border border-border bg-surface-alt/30 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-surface border border-border">
                  {isSplit ? (
                    <ArrowLeftRight className="size-4 text-amber-600 dark:text-amber-400" />
                  ) : paymentMethodUpper === "UPI" ? (
                    <QrCode className="size-4 text-sky-600 dark:text-sky-400" />
                  ) : (
                    <Banknote className="size-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </span>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-text">
                    {isSplit ? "Split Payment Allocation" : "Payment & Settlement Details"}
                  </h3>
                  <span className="text-[11px] text-text-muted font-medium">
                    Method: <strong className="text-text">{isSplit ? "Split (Multi-Mode)" : invoice.paymentMode}</strong>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10.5px] text-text-muted block">Settled Amount</span>
                <span className="text-base font-bold font-mono text-primary tabular-nums">
                  {formatCurrency(invoice.amount)}
                </span>
              </div>
            </div>

            {/* If Split Payment: Show Amount-wise Breakdown */}
            {isSplit ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Cash Portion Card */}
                  {cashTotal > 0 && (
                    <div className="p-3 rounded-xl bg-surface border border-emerald-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <Banknote className="size-4" /> Cash Portion
                        </div>
                        <span className="font-mono font-bold text-sm text-text tabular-nums">
                          {formatCurrency(cashTotal)}
                        </span>
                      </div>

                      {/* Cash Denomination List */}
                      {cashDenoms.length > 0 ? (
                        <div className="pt-2 border-t border-border/60 space-y-1.5">
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                            Cash Denominations Captured
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {cashDenoms.map((d, i) => {
                              const config = DENOM_CONFIG[d.note] || { label: `₹${d.note}`, color: "text-text bg-surface-alt border-border" };
                              return (
                                <div
                                  key={i}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-mono font-medium shadow-2xs",
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
                      ) : cashTendered > 0 ? (
                        <div className="text-[11px] text-text-muted font-mono pt-1">
                          Tendered: {formatCurrency(cashTendered)}
                          {changeDue > 0 && <span className="ml-2 text-amber-600 font-semibold">• Change: {formatCurrency(changeDue)}</span>}
                        </div>
                      ) : null}

                      {/* Returned Denominations if any */}
                      {returnedDenoms.length > 0 && (
                        <div className="pt-1.5 border-t border-border/60">
                          <span className="text-[9.5px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
                            Change Returned Denominations
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {returnedDenoms.map((d, i) => (
                              <div
                                key={i}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10.5px] font-mono"
                              >
                                <span>₹{d.note} × {d.count} = ₹{d.total}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* UPI Portion Card */}
                  {upiTotal > 0 && (
                    <div className="p-3 rounded-xl bg-surface border border-sky-500/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                          <QrCode className="size-4" /> UPI / QR Portion
                        </div>
                        <span className="font-mono font-bold text-sm text-text tabular-nums">
                          {formatCurrency(upiTotal)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-border/60 space-y-2">
                        {upiDetails.length > 0 ? (
                          upiDetails.map((u, i) => {
                            const acc = u.account;
                            return (
                              <div
                                key={i}
                                className="p-2.5 rounded-lg bg-surface-alt/70 border border-border/60 space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Landmark className="size-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                                    <span className="font-semibold text-text truncate">
                                      {acc?.mainTitle || "UPI Merchant QR"}
                                    </span>
                                  </div>
                                  {u.amount && u.amount !== upiTotal && (
                                    <span className="font-mono font-bold text-text shrink-0">
                                      {formatCurrency(u.amount)}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono text-text-muted pt-1 border-t border-border/40">
                                  {acc?.upiId ? (
                                    <div className="truncate">
                                      UPI ID: <span className="text-text font-medium">{acc.upiId}</span>
                                    </div>
                                  ) : (
                                    <div className="truncate text-text-muted">Dynamic QR Scan</div>
                                  )}
                                  {u.ref ? (
                                    <div className="truncate">
                                      Txn Ref: <span className="text-text font-bold">{u.ref}</span>
                                    </div>
                                  ) : (
                                    <div>Settlement: <span className="text-emerald-600 font-medium">Reconciled</span></div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-[11px] text-text-muted font-mono">
                            Digital UPI reconciliation complete
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Credit Note Portion Card */}
                  {creditNoteTotal > 0 && (
                    <div className="p-3 rounded-xl bg-surface border border-indigo-500/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          <Receipt className="size-4" /> Credit Note Portion
                        </div>
                        <span className="font-mono font-bold text-sm text-text tabular-nums">
                          {formatCurrency(creditNoteTotal)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-border/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                          Redeemed Credit Notes {creditNoteAllocations.length > 0 ? `(${creditNoteAllocations.length})` : ""}
                        </span>
                        {creditNoteAllocations.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {creditNoteAllocations.map((cn, i) => (
                              <div
                                key={i}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[11px] font-mono font-medium shadow-2xs"
                              >
                                <span className="font-bold">{cn.creditNoteNumber || cn.creditNoteNo || `CN #${i + 1}`}</span>
                                <span className="text-text-muted font-sans">:</span>
                                <span className="font-bold">{formatCurrency(cn.amountApplied || cn.amount || 0)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-text-muted font-mono">
                            Redeemed from customer credit note balance
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Customer Advance Portion Card */}
                  {advanceTotal > 0 && (
                    <div className="p-3 rounded-xl bg-surface border border-amber-500/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                          <Wallet className="size-4" /> Customer Advance Portion
                        </div>
                        <span className="font-mono font-bold text-sm text-text tabular-nums">
                          {formatCurrency(advanceTotal)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-border/60 text-[11px] text-text-muted font-mono">
                        Adjusted from customer prepaid advance balance
                      </div>
                    </div>
                  )}

                  {/* Credit (Udhar) Portion Card */}
                  {creditTotal > 0 && (
                    <div className="p-3 rounded-xl bg-surface border border-rose-500/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                          <CreditCard className="size-4" /> Credit (Udhar) Portion
                        </div>
                        <span className="font-mono font-bold text-sm text-text tabular-nums">
                          {formatCurrency(creditTotal)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                        <span className="text-text-muted font-mono">
                          {invoice.creditDueDate
                            ? `Due: ${new Date(invoice.creditDueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
                            : "Account receivable recorded"}
                        </span>
                        <UIBadge variant="soft" color="warning" size="xs">
                          Pending Receivable
                        </UIBadge>
                      </div>
                    </div>
                  )}

                  {/* Card / Other Portion */}
                  {(cardTotal > 0 || otherTotal > 0) && (
                    <div className="p-3 rounded-xl bg-surface border border-border space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                          <CreditCard className="size-4 text-primary" /> Card / Other Portion
                        </div>
                        <span className="font-mono font-bold text-sm text-text tabular-nums">
                          {formatCurrency(cardTotal || otherTotal)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-border/60 text-[11px] text-text-muted font-mono">
                        Processed via standard electronic payment
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : paymentMethodUpper === "CASH" ? (
              /* If Pure Cash: Show Full Tendered, Change & Denomination List */
              <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-text-muted uppercase">Bill Amount</span>
                      <p className="font-mono font-bold text-text text-sm">{formatCurrency(invoice.amount)}</p>
                    </div>
                    <div className="h-6 w-px bg-border" />
                    <div>
                      <span className="text-[10px] font-bold text-text-muted uppercase">Cash Tendered</span>
                      <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(cashTendered)}
                      </p>
                    </div>
                    {changeDue > 0 && (
                      <>
                        <div className="h-6 w-px bg-border" />
                        <div>
                          <span className="text-[10px] font-bold text-amber-600 uppercase">Change Returned</span>
                          <p className="font-mono font-bold text-amber-600 text-sm">{formatCurrency(changeDue)}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Received Denominations List */}
                {cashDenoms.length > 0 ? (
                  <div className="pt-2.5 border-t border-border space-y-1.5">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                      Received Currency Denominations
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {cashDenoms.map((d, i) => {
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
                    Standard cash tender recorded without individual note counts.
                  </div>
                )}

                {/* Returned Denominations if change was given */}
                {returnedDenoms.length > 0 && (
                  <div className="pt-2 border-t border-border space-y-1">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                      Change Returned Denominations
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {returnedDenoms.map((d, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-mono"
                        >
                          <span className="font-bold">₹{d.note}</span>
                          <span>×</span>
                          <span>{d.count}</span>
                          <span>=</span>
                          <span className="font-bold">₹{d.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : paymentMethodUpper === "UPI" || (upiTotal > 0 && cashTotal === 0 && creditNoteTotal === 0 && advanceTotal === 0 && creditTotal === 0) ? (
              /* Pure UPI Settlement with exact Bank / QR Account */
              <div className="p-3.5 rounded-xl bg-surface border border-sky-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold">
                    <div className="size-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                      <QrCode className="size-4.5 stroke-[2]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text">UPI Digital Payment</div>
                      <span className="text-[10px] font-medium text-text-muted">
                        Dynamic QR Settlement
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-text-muted uppercase">Amount Paid</span>
                    <p className="font-mono font-bold text-text text-base">
                      {formatCurrency(invoice.amount || upiTotal)}
                    </p>
                  </div>
                </div>

                {/* Specific UPI Account & Bank Details */}
                <div className="pt-2.5 border-t border-border/80">
                  {upiDetails.length > 0 ? (
                    upiDetails.map((u, i) => {
                      const acc = u.account;
                      return (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-surface-alt/70 border border-border/70 space-y-2 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                                <Landmark className="size-4" />
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-text-muted uppercase block">
                                  UPI Account / Bank
                                </span>
                                <p className="font-bold text-text text-sm">
                                  {acc?.mainTitle || "UPI Linked Bank Account"}
                                </p>
                              </div>
                            </div>
                            <UIBadge variant="soft" color="success" size="sm">
                              Verified & Reconciled
                            </UIBadge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-border/50">
                            {acc?.upiId && (
                              <div className="flex items-center justify-between sm:justify-start gap-2 bg-surface p-1.5 rounded-lg border border-border/40">
                                <span className="text-text-muted text-[10.5px]">UPI ID:</span>
                                <span className="font-semibold text-text truncate">{acc.upiId}</span>
                              </div>
                            )}
                            {u.ref ? (
                              <div className="flex items-center justify-between sm:justify-start gap-2 bg-surface p-1.5 rounded-lg border border-border/40">
                                <span className="text-text-muted text-[10.5px]">Txn Ref:</span>
                                <span className="font-bold text-text truncate">{u.ref}</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between sm:justify-start gap-2 bg-surface p-1.5 rounded-lg border border-border/40">
                                <span className="text-text-muted text-[10.5px]">Mode:</span>
                                <span className="font-medium text-emerald-600">Dynamic QR Scan</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 rounded-xl bg-surface-alt/70 border border-border/70 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Landmark className="size-4 text-sky-500" />
                        <div>
                          <div className="font-semibold text-text">UPI Merchant Settlement</div>
                          <div className="text-[10.5px] text-text-muted">Digital reconciliation completed</div>
                        </div>
                      </div>
                      <UIBadge variant="soft" color="success" size="sm">
                        Verified
                      </UIBadge>
                    </div>
                  )}
                </div>
              </div>
            ) : paymentMethodUpper.replace(/[\s_-]/g, "") === "CREDITNOTE" || (creditNoteTotal > 0 && cashTotal === 0 && upiTotal === 0 && advanceTotal === 0 && creditTotal === 0) ? (
              /* Pure Credit Note Settlement Card */
              <div className="p-3.5 rounded-xl bg-surface border border-indigo-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                    <div className="size-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Receipt className="size-4.5 stroke-[2]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text">Credit Note Redemption</div>
                      <span className="text-[10px] font-medium text-text-muted">Settled via customer credit balance</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-text-muted uppercase">Amount Settled</span>
                    <p className="font-mono font-bold text-text text-base">
                      {formatCurrency(invoice.amount || creditNoteTotal)}
                    </p>
                  </div>
                </div>
                {creditNoteAllocations.length > 0 && (
                  <div className="pt-2.5 border-t border-border/80">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                      Applied Credit Notes
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {creditNoteAllocations.map((cn, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-mono"
                        >
                          <span className="font-bold">{cn.creditNoteNumber || cn.creditNoteNo || `CN #${i + 1}`}</span>
                          <span>:</span>
                          <span className="font-bold">{formatCurrency(cn.amountApplied || cn.amount || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : paymentMethodUpper === "ADVANCE" || (advanceTotal > 0 && cashTotal === 0 && upiTotal === 0 && creditNoteTotal === 0 && creditTotal === 0) ? (
              /* Pure Customer Advance Settlement Card */
              <div className="p-3.5 rounded-xl bg-amber-500/[0.08] dark:bg-amber-500/[0.12] border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Wallet className="size-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                      Customer Advance
                    </span>
                    <p className="font-bold text-text text-sm">Prepaid Balance Utilized</p>
                  </div>
                </div>
                <div className="font-mono text-right">
                  <span className="text-[10px] text-text-muted block">Settled Amount</span>
                  <span className="text-base font-bold text-text">{formatCurrency(invoice.amount || advanceTotal)}</span>
                </div>
              </div>
            ) : String(invoice.paymentMode || "").toUpperCase() === "CREDIT" || invoice.creditDueDate || (creditTotal > 0 && cashTotal === 0 && upiTotal === 0) ? (
              /* Credit Sale Settlement Card */
              <div className="p-3.5 rounded-xl bg-amber-500/[0.08] dark:bg-amber-500/[0.12] border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Calendar className="size-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                      Credit Sale • Due Date
                    </span>
                    <p className="font-mono font-bold text-text text-sm">
                      {invoice.creditDueDate
                        ? new Date(invoice.creditDueDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Term not specified"}
                    </p>
                  </div>
                </div>
                <div className="font-mono text-right">
                  <span className="text-[10px] text-text-muted block">Settlement Status</span>
                  <UIBadge variant="soft" color="warning" size="sm" className="font-semibold">
                    Credit Outstanding
                  </UIBadge>
                </div>
              </div>
            ) : (
              /* Other (Card / Other) */
              <div className="p-3.5 rounded-xl bg-surface border border-border flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10.5px] font-bold text-text-muted uppercase">Digital Settlement</span>
                  <p className="font-semibold text-text mt-0.5">
                    {invoice.paymentMode || "Standard Payment"}
                  </p>
                </div>
                <div className="font-mono text-right">
                  <span className="text-[10px] text-text-muted">Status</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">Verified & Reconciled</p>
                </div>
              </div>
            )}
          </div>
          {/* Purchased Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-text-muted">
                Purchased Medicines & Products ({items.length})
              </h3>
              <span className="text-[11.5px] text-text-muted font-mono">
                {items.reduce((sum, item) => sum + Number(item.qty || 1), 0)} Total Units
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/70 text-[10.5px] font-bold text-text-muted uppercase select-none">
                    <th className="py-2.5 px-3">Item Name & Brand</th>
                    <th className="py-2.5 px-2 font-mono">Batch</th>
                    <th className="py-2.5 px-2 font-mono">Expiry</th>
                    <th className="py-2.5 px-2 font-mono text-center">GST %</th>
                    <th className="py-2.5 px-2 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.length > 0 ? (
                    items.map((item, idx) => {
                      const returnedQty = Number(item.returnedQty || 0);
                      const soldQty = Number(item.qty || 1);
                      const isFullRet = returnedQty >= soldQty;
                      const isPartRet = returnedQty > 0 && returnedQty < soldQty;

                      return (
                        <tr key={idx} className="hover:bg-surface-hover/50">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={cn("font-bold block", isFullRet ? "text-text-muted line-through" : "text-text")}>
                                {item.name}
                              </span>
                              {isFullRet ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 shrink-0">
                                  <RotateCcw className="size-2.5" /> Returned ({returnedQty}/{soldQty})
                                </span>
                              ) : isPartRet ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                                  <RotateCcw className="size-2.5" /> Partially Returned ({returnedQty}/{soldQty})
                                </span>
                              ) : null}
                            </div>
                            <span className="text-[10px] text-text-muted">{item.brand || "Pharma"} • {item.category || "Medicine"}</span>
                          </td>
                          <td className="py-2.5 px-2 font-mono text-[11px] text-text-muted font-semibold">{item.batch || "—"}</td>
                          <td className="py-2.5 px-2 font-mono text-[11px] text-text-muted">{item.expiry || "—"}</td>
                          <td className="py-2.5 px-2 font-mono text-center font-bold text-purple-600 dark:text-purple-400">{item.gst || 5}%</td>
                          <td className="py-2.5 px-2 font-mono text-right font-bold text-text tabular-nums">
                            {soldQty}
                            {returnedQty > 0 && (
                              <span className="block text-[10px] font-normal text-rose-600 dark:text-rose-400">
                                Ret: {returnedQty}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-right text-text-muted tabular-nums">₹{Number(item.price || 0).toFixed(2)}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-right text-primary tabular-nums">₹{(soldQty * Number(item.price || 0)).toFixed(2)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-text-muted">
                        No line items recorded for this invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic GST Tax Slab Breakdown Table */}
          {gstSlabEntries.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-text-muted">
                GST Tax Slab Breakdown
              </h3>
              <div className="overflow-x-auto rounded-xl border border-border bg-surface-alt/20">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-alt/70 text-[10.5px] font-bold text-text-muted uppercase select-none">
                      <th className="py-2 px-3">GST Rate Slab</th>
                      <th className="py-2 px-3 text-right">Taxable Amount</th>
                      <th className="py-2 px-3 text-right font-mono">CGST</th>
                      <th className="py-2 px-3 text-right font-mono">SGST</th>
                      <th className="py-2 px-3 text-right">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {gstSlabEntries.map(([rate, data]) => {
                      const halfTax = data.taxAmount / 2;
                      return (
                        <tr key={rate} className="hover:bg-surface-hover/30">
                          <td className="py-2 px-3 font-bold text-purple-600 dark:text-purple-400">{rate}% Slab</td>
                          <td className="py-2 px-3 text-right font-mono text-text">₹{data.taxableAmount.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-mono text-text-muted">₹{halfTax.toFixed(2)} ({Number(rate) / 2}%)</td>
                          <td className="py-2 px-3 text-right font-mono text-text-muted">₹{halfTax.toFixed(2)} ({Number(rate) / 2}%)</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400">₹{data.taxAmount.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Financial Calculation Summary Box */}
          <div className="p-4 rounded-xl border border-border bg-surface-alt/40 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-text">
              <span className="text-text-muted font-sans font-medium">Subtotal Amount:</span>
              <span className="font-bold">₹{Number(invoice.subtotal || invoice.amount || 0).toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span className="font-sans font-medium">Total Discount Applied:</span>
                <span>-₹{Number(invoice.discount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-purple-600 dark:text-purple-400">
              <span className="font-sans font-medium">GST Tax Included:</span>
              <span>₹{Number(invoice.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-text pt-2 border-t border-border">
              <span className="font-sans">Grand Total:</span>
              <span className="text-primary font-mono text-base font-bold">
                ₹{Number(invoice.amount || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
            {/* Left side actions */}
            <div className="flex flex-wrap items-center gap-2">
              <UIButton
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={isCancelling}
                startIcon={<Printer className="size-4" />}
              >
                Print Invoice
              </UIButton>

              {/* Shift Audit Status Indicator */}
              {isShiftOpen ? (
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                  <Unlock className="size-3.5 text-emerald-600" /> Shift Open (Editable)
                </span>
              ) : invoice.status === "Cancelled" ? (
                <span className="text-[11px] text-error font-medium flex items-center gap-1.5 bg-error-soft px-2.5 py-1.5 rounded-lg border border-error/30">
                  <AlertCircle className="size-3.5 text-error" /> Bill Cancelled
                </span>
              ) : (
                <span className="text-[11px] text-text-muted italic flex items-center gap-1.5 bg-surface-alt px-2.5 py-1.5 rounded-lg border border-border/60">
                  <Lock className="size-3.5 text-text-muted" /> Shift closed (Edit & Cancel locked)
                </span>
              )}
            </div>

            {/* Right side actions */}
            <div className="flex flex-wrap items-center gap-2">
              {canEditOrCancel && (
                <>
                  <PermissionGate permission="bill:update">
                    <UIButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const targetId = invoice._id || invoice.id || invoice.invoiceNo;
                        navigate(`/sales/edit/${targetId}`, { state: { invoice } });
                      }}
                      disabled={isCancelling}
                      startIcon={<Edit2 className="size-4 text-primary" />}
                    >
                      Edit Bill
                    </UIButton>
                  </PermissionGate>

                  <PermissionGate permission="bill:delete">
                    <UIButton
                      variant="outline"
                      size="sm"
                      onClick={() => setShowConfirmCancel(true)}
                      disabled={isCancelling}
                      isLoading={isCancelling}
                      loadingText="Cancelling..."
                      className="text-error hover:bg-error-soft hover:border-error/30"
                      startIcon={<Trash2 className="size-4" />}
                    >
                      Cancel Bill
                    </UIButton>
                  </PermissionGate>
                </>
              )}


              <UIButton variant="outline" size="sm" onClick={onClose} disabled={isCancelling}>
                Close
              </UIButton>
            </div>
          </div>
        </div>
      </UIModal>

      {/* Cancel Bill Confirmation Dialog */}
      {/* ── Cancel Sale & Cash Refund Dialog ── */}
      {showConfirmCancel && (
        <CancelInvoiceRefundModal
          isOpen={showConfirmCancel}
          onClose={() => !isCancelling && setShowConfirmCancel(false)}
          onConfirm={handleConfirmCancel}
          invoice={invoice}
          isCancelling={isCancelling}
        />
      )}

      {/* Print Document Modal */}
      {isPrintModalOpen && (
        <OrderInvoiceModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          saleData={invoice}
        />
      )}
    </>
  );
};

export default BillingInvoiceDetailsDrawer;



