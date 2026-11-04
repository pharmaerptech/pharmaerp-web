// src/features/sales/credit-notes/components/CreditNoteDetailsDialog.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  RotateCcw,
  Calendar,
  User,
  Phone,
  Building2,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  Hash,
  Package,
  Layers,
  Percent,
} from "lucide-react";
import {
  UIModal,
  UIButton,
  UIBadge,
  UIInput,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import creditNoteService from "../services/creditNoteService";

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getStatusBadge = (status) => {
  switch (status) {
    case "ACTIVE":
      return (
        <UIBadge variant="soft" color="success" className="font-semibold text-xs flex items-center gap-1">
          <CheckCircle2 className="size-3" /> Active
        </UIBadge>
      );
    case "PARTIALLY_REDEEMED":
      return (
        <UIBadge variant="soft" color="warning" className="font-semibold text-xs flex items-center gap-1">
          <Clock className="size-3" /> Partially Used
        </UIBadge>
      );
    case "FULLY_REDEEMED":
      return (
        <UIBadge variant="soft" color="info" className="font-semibold text-xs flex items-center gap-1">
          <CheckCircle2 className="size-3" /> Fully Redeemed
        </UIBadge>
      );
    case "CANCELLED":
      return (
        <UIBadge variant="soft" color="error" className="font-semibold text-xs flex items-center gap-1">
          <XCircle className="size-3" /> Cancelled
        </UIBadge>
      );
    default:
      return (
        <UIBadge variant="soft" color="neutral" className="font-semibold text-xs">
          {status || "UNKNOWN"}
        </UIBadge>
      );
  }
};

export const CreditNoteDetailsDialog = ({
  isOpen,
  open,
  onClose,
  creditNote,
  creditNoteId,
  onCancelSuccess,
}) => {
  const isVisible = Boolean(isOpen ?? open);
  const resolvedId = creditNoteId || creditNote?._id || creditNote?.id;

  const [activeItem, setActiveItem] = useState(creditNote || null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Cancellation State
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchFullDetails = useCallback(async () => {
    if (!resolvedId || !isVisible) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await creditNoteService.getCreditNoteById(resolvedId);
      const data = res?.data?.data || res?.data;
      if (data) {
        setActiveItem(data);
      }
    } catch (err) {
      console.error("Failed to load credit note details:", err);
      // If we already have initial creditNote prop, keep it
      if (!activeItem && creditNote) {
        setActiveItem(creditNote);
      }
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Failed to load complete details.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [resolvedId, isVisible]);

  useEffect(() => {
    if (isVisible) {
      if (creditNote) setActiveItem(creditNote);
      fetchFullDetails();
    } else {
      setActiveItem(null);
      setFeedback(null);
      setIsCancelConfirmOpen(false);
      setCancelReason("");
    }
  }, [isVisible, resolvedId]);

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmCancel = async () => {
    if (!resolvedId || !cancelReason.trim()) return;
    setIsCancelling(true);
    setFeedback(null);
    try {
      const res = await creditNoteService.cancelCreditNote(resolvedId, cancelReason.trim());
      const updated = res?.data?.data || res?.data;
      if (updated) {
        setActiveItem(updated);
      }
      setFeedback({
        type: "success",
        message: "Credit note has been successfully cancelled and reversed.",
      });
      setIsCancelConfirmOpen(false);
      setCancelReason("");
      if (typeof onCancelSuccess === "function") {
        onCancelSuccess(resolvedId);
      }
    } catch (err) {
      console.error("Failed to cancel credit note:", err);
      setFeedback({
        type: "error",
        message: err.response?.data?.message || err.message || "Failed to cancel credit note.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isVisible) return null;

  const item = activeItem || {};
  const noteNo = item.creditNoteNo || "Credit Note";
  const status = item.status || "ACTIVE";
  const issueTimestamp = item.issueDate || item.date || item.createdAt;

  const totalAmount = Number(item.totalAmount || 0);
  const redeemedAmount = Number(item.redeemedAmount || 0);
  const balanceAmount = Number(item.balanceAmount || 0);
  const isFullyRedeemed = status === "FULLY_REDEEMED";
  const isCancelled = status === "CANCELLED";
  const canCancel = (status === "ACTIVE" || status === "PARTIALLY_REDEEMED") && redeemedAmount === 0 && !isCancelled;

  const customer = item.customerId;
  const customerName = typeof customer === "object" ? customer?.name : (item.customerName || "Walk-in Retail Customer");
  const customerPhone = typeof customer === "object" ? (customer?.mobile || customer?.phone) : (item.customerPhone || "—");
  const customerCode = typeof customer === "object" ? (customer?.customerCode || customer?.code) : "—";
  const customerGst = typeof customer === "object" ? (customer?.gstNumber || customer?.gst) : (item.customerGst || "—");

  const branch = item.branchId;
  const branchName = typeof branch === "object" ? branch?.name : "Main Branch";

  const redemptions = Array.isArray(item.redemptions) ? item.redemptions : [];
  const items = Array.isArray(item.items) ? item.items : [];

  return (
    <UIModal
      isOpen={isVisible}
      onClose={isCancelling ? undefined : onClose}
      closeOnBackdrop={!isCancelling}
      closeOnEsc={!isCancelling}
      showCloseButton={!isCancelling}
      size="xl"
    >
      <div className="p-5 sm:p-6 font-sans space-y-5 max-h-[88vh] overflow-y-auto">
        {/* ── 1. Header ───────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <Receipt className="size-5.5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight font-mono text-text">
                  {noteNo}
                </h2>
                {getStatusBadge(status)}
                {item.billingMode && (
                  <UIBadge variant="soft" color="neutral" className="font-semibold text-xs">
                    {item.billingMode}
                  </UIBadge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                <button
                  type="button"
                  onClick={() => handleCopyCode(noteNo)}
                  className="text-text-muted hover:text-text transition-colors flex items-center gap-1 text-[11px] font-medium"
                  title="Copy Credit Note Number"
                >
                  {copiedCode ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copiedCode ? "Copied" : "Copy Number"}</span>
                </button>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {formatDate(issueTimestamp)} at {formatTime(issueTimestamp)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <UIButton
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              startIcon={<Printer className="size-3.5" />}
              className="text-xs h-9 px-3"
            >
              Print Slip
            </UIButton>
          </div>
        </div>

        {/* ── 2. Feedback Alert ─────────────────────────────────────────── */}
        {feedback && (
          <div
            className={cn(
              "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold animate-in fade-in",
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
            )}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* ── 3. Cancellation Details Banner ────────────────────────────── */}
        {isCancelled && (
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-3">
            <XCircle className="size-4.5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Credit Note Cancelled</span>
              <p className="text-[11.5px] opacity-90">
                Reason: <span className="font-medium italic">{item.cancelReason || "No reason specified"}</span>
              </p>
              {item.cancelledAt && (
                <p className="text-[10.5px] opacity-75">
                  Cancelled on {formatDate(item.cancelledAt)} at {formatTime(item.cancelledAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── 4. Key Metrics 4-Card Grid ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Issued Value */}
          <div className="p-3.5 rounded-xl border border-border bg-surface-alt/40 shadow-2xs">
            <span className="text-[11px] font-medium text-text-muted block">
              Total Credit Note Value
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-text mt-1 tabular-nums">
              ₹{formatCurrency(totalAmount)}
            </div>
            <span className="text-[10px] text-text-muted mt-0.5 block">
              Credited from return/adjustment
            </span>
          </div>

          {/* Redeemed Amount */}
          <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 shadow-2xs">
            <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300 block">
              Redeemed in Invoices
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-blue-700 dark:text-blue-300 mt-1 tabular-nums">
              ₹{formatCurrency(redeemedAmount)}
            </div>
            <span className="text-[10px] text-blue-600/80 dark:text-blue-400 mt-0.5 block">
              {totalAmount > 0
                ? `${Math.round((redeemedAmount / totalAmount) * 100)}% utilized`
                : "No redemptions"}
            </span>
          </div>

          {/* Available Balance */}
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-2xs">
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 block">
              Usable Balance
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1 tabular-nums">
              ₹{formatCurrency(balanceAmount)}
            </div>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400 mt-0.5 block">
              {balanceAmount > 0 ? "Available for checkout" : "Fully consumed"}
            </span>
          </div>

          {/* Expiry Date */}
          <div className="p-3.5 rounded-xl border border-border bg-surface-alt/40 shadow-2xs">
            <span className="text-[11px] font-medium text-text-muted block">
              Validity
            </span>
            <div className="text-sm sm:text-base font-bold font-mono text-text mt-1 truncate">
              {item.expiryDate ? formatDate(item.expiryDate) : "No Expiry"}
            </div>
            <span className="text-[10px] text-text-muted mt-0.5 block">
              {item.expiryDate ? "Valid until date" : "Permanent credit balance"}
            </span>
          </div>
        </div>

        {/* ── 5. Customer & Source Reference Information ────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Customer Card */}
          <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-2.5">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 pb-1.5 border-b border-border/60">
              <User className="size-3.5 text-primary" />
              <span>Customer Details</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-text-muted block">Name:</span>
                <span className="font-semibold text-text">{customerName}</span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted block">Phone:</span>
                <span className="font-mono font-medium text-text">{customerPhone}</span>
              </div>
              {customerCode !== "—" && (
                <div>
                  <span className="text-[11px] text-text-muted block">Customer Code:</span>
                  <span className="font-mono text-text">{customerCode}</span>
                </div>
              )}
              {customerGst !== "—" && (
                <div>
                  <span className="text-[11px] text-text-muted block">GST Number:</span>
                  <span className="font-mono text-text">{customerGst}</span>
                </div>
              )}
            </div>
          </div>

          {/* Source Reference Card */}
          <div className="p-4 rounded-xl border border-border bg-surface shadow-2xs space-y-2.5">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5 pb-1.5 border-b border-border/60">
              <RotateCcw className="size-3.5 text-indigo-600" />
              <span>Source & Origin</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[11px] text-text-muted block">Origin:</span>
                <span className="font-semibold text-text">
                  {item.source === "MANUAL_ADJUSTMENT" || item.source === "MANUAL"
                    ? "Manual Adjustment"
                    : "Sales Return"}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted block">Branch:</span>
                <span className="font-medium text-text">{branchName}</span>
              </div>
              {item.sourceReturnNo && (
                <div>
                  <span className="text-[11px] text-text-muted block">Return Voucher #:</span>
                  <span className="font-mono font-bold text-primary">{item.sourceReturnNo}</span>
                </div>
              )}
              {item.originalInvoiceNo && (
                <div>
                  <span className="text-[11px] text-text-muted block">Original Invoice #:</span>
                  <span className="font-mono text-text">{item.originalInvoiceNo}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 6. Returned Items Table (If Any) ─────────────────────────── */}
        {items.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Package className="size-3.5 text-primary" />
                Returned Items Breakdown ({items.length})
              </span>
            </div>
            <div className="rounded-xl border border-border overflow-hidden bg-surface shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-alt/70 text-[11px] font-semibold text-text-muted uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Item / Product</th>
                    <th className="py-2.5 px-3">Batch & Exp</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">GST %</th>
                    <th className="py-2.5 px-3 text-right">Net Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.map((it, idx) => (
                    <tr key={it._id || idx} className="hover:bg-surface-alt/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-text">
                        {it.productName || it.name || "Product Item"}
                      </td>
                      <td className="py-2.5 px-3 text-text-muted font-mono text-[11px]">
                        {it.batchNumber || it.batch || "—"}
                        {it.expiryDate ? ` (${formatDate(it.expiryDate)})` : ""}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-text">
                        {it.quantity || it.qty || 1}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-text">
                        ₹{formatCurrency(it.unitPrice || it.rate || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-text-muted">
                        {it.gstRate || it.taxRate || 0}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-text">
                        ₹{formatCurrency(it.totalAmount || it.total || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 7. Redemption History Timeline ────────────────────────────── */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="size-3.5 text-blue-600" />
            Invoice Redemption History ({redemptions.length})
          </span>
          <div className="rounded-xl border border-border overflow-hidden bg-surface shadow-2xs">
            {redemptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-text-muted">
                No redemptions logged yet. Full balance is active and available for upcoming sales.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-alt/70 text-[11px] font-semibold text-text-muted uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Redeemed Against Invoice</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3 text-right">Amount Redeemed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {redemptions.map((r, i) => (
                    <tr key={r._id || i} className="hover:bg-surface-alt/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">
                        {r.invoiceNo || "Invoice"}
                      </td>
                      <td className="py-2.5 px-3 text-text-muted font-mono text-[11px]">
                        {formatDate(r.redeemedAt)} {formatTime(r.redeemedAt)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700 dark:text-blue-300">
                        ₹{formatCurrency(r.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── 8. Cancel Confirmation Sub-Panel ─────────────────────────── */}
        {isCancelConfirmOpen && (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold">
              <AlertCircle className="size-4 shrink-0" />
              <span>Confirm Credit Note Cancellation</span>
            </div>
            <p className="text-xs text-text-muted">
              Cancelling this credit note will reverse its balance and subtract ₹{formatCurrency(balanceAmount)} from
              the customer&apos;s available credit note balance. This action cannot be undone.
            </p>
            <UIInput
              type="text"
              placeholder="Reason for cancellation (required)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              size="sm"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <UIButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCancelConfirmOpen(false)}
                disabled={isCancelling}
                className="text-xs"
              >
                Abort
              </UIButton>
              <UIButton
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmCancel}
                disabled={isCancelling || !cancelReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                startIcon={isCancelling ? <RefreshCw className="size-3 animate-spin" /> : <XCircle className="size-3.5" />}
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </UIButton>
            </div>
          </div>
        )}

        {/* ── 9. Modal Footer ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            {canCancel && !isCancelConfirmOpen && (
              <UIButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCancelConfirmOpen(true)}
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-300 text-xs font-semibold"
                startIcon={<XCircle className="size-3.5" />}
              >
                Cancel Credit Note
              </UIButton>
            )}
          </div>
          <div className="flex items-center gap-2">
            <UIButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold px-4"
            >
              Close
            </UIButton>
          </div>
        </div>
      </div>
    </UIModal>
  );
};

export default CreditNoteDetailsDialog;

