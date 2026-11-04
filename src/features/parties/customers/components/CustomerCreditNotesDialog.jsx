// src/features/parties/customers/components/CustomerCreditNotesDialog.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  UIModal,
  UIButton,
  UIBadge,
  UIAlert,
} from "@/components/ui";
import {
  Receipt,
  RotateCcw,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import creditNoteService from "@/features/sales/credit-notes/services/creditNoteService";

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  return isNaN(d.getTime())
    ? "-"
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const getStatusBadge = (status) => {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
          <CheckCircle2 className="size-3" /> Active
        </span>
      );
    case "PARTIALLY_REDEEMED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
          <Clock className="size-3" /> Partially Used
        </span>
      );
    case "FULLY_REDEEMED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
          <CheckCircle2 className="size-3" /> Fully Redeemed
        </span>
      );
    case "CANCELLED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
          <XCircle className="size-3" /> Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-surface-alt text-text-muted border border-border">
          {status}
        </span>
      );
  }
};

export const CustomerCreditNotesDialog = ({
  isOpen,
  onClose,
  customer,
}) => {
  const rawId = customer?._id || customer?.id || (typeof customer === "string" ? customer : null);
  const customerId = rawId ? String(rawId) : null;
  const customerName = customer?.displayName || customer?.name || customer?.customerName || "Customer";

  const [loading, setLoading] = useState(false);
  const [creditNotes, setCreditNotes] = useState([]);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedNotes, setExpandedNotes] = useState({});

  const fetchCreditNotes = useCallback(async () => {
    if (!customerId || !isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const res = await creditNoteService.getCustomerCreditNotes(customerId);
      const raw = res?.data?.data ?? res?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.creditNotes)
        ? raw.creditNotes
        : Array.isArray(raw?.activeNotes)
        ? raw.activeNotes
        : [];
      setCreditNotes(list);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load customer credit notes.");
    } finally {
      setLoading(false);
    }
  }, [customerId, isOpen]);

  useEffect(() => {
    fetchCreditNotes();
  }, [fetchCreditNotes]);

  const toggleExpand = (id) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Metrics summary
  const summary = useMemo(() => {
    const totalCount = creditNotes.length;
    const totalIssued = creditNotes
      .filter((cn) => cn.status !== "CANCELLED")
      .reduce((sum, cn) => sum + (Number(cn.totalAmount) || 0), 0);
    const totalRedeemed = creditNotes
      .filter((cn) => cn.status !== "CANCELLED")
      .reduce((sum, cn) => sum + (Number(cn.redeemedAmount) || 0), 0);
    const availableBalance = creditNotes
      .filter((cn) => cn.status === "ACTIVE" || cn.status === "PARTIALLY_REDEEMED")
      .reduce((sum, cn) => sum + (Number(cn.balanceAmount !== undefined ? cn.balanceAmount : Math.max(0, (cn.totalAmount || 0) - (cn.redeemedAmount || 0))) || 0), 0);

    return { totalCount, totalIssued, totalRedeemed, availableBalance };
  }, [creditNotes]);

  const filteredNotes = useMemo(() => {
    if (statusFilter === "ALL") return creditNotes;
    if (statusFilter === "ACTIVE_OR_PARTIAL") {
      return creditNotes.filter(
        (cn) => cn.status === "ACTIVE" || cn.status === "PARTIALLY_REDEEMED"
      );
    }
    return creditNotes.filter((cn) => cn.status === statusFilter);
  }, [creditNotes, statusFilter]);

  return (
    <UIModal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className="w-full max-w-4xl h-[88vh] max-h-[90vh] flex flex-col rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden font-sans my-auto"
    >
      <div className="flex flex-col h-full w-full overflow-hidden">
        {/* Pinned Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-border flex items-center justify-between gap-3 shrink-0 pr-14">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
              <Receipt className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-text">
                  Credit Notes — {customerName}
                </h2>
                {customer?.customerCode && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-surface-alt border border-border text-text-muted">
                    {customer.customerCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Active credit notes, available balances, and invoice redemption history.
              </p>
            </div>
          </div>

          <UIButton
            variant="outline"
            size="sm"
            onClick={fetchCreditNotes}
            disabled={loading}
            startIcon={<RefreshCw className={cn("size-3.5", loading && "animate-spin")} />}
          >
            Refresh
          </UIButton>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="p-3 rounded-xl border border-border bg-surface shadow-2xs">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                Total Notes
              </span>
              <span className="text-lg font-bold text-text font-mono mt-0.5 block">
                {summary.totalCount}
              </span>
              <span className="text-[10.5px] text-text-muted">Issued to date</span>
            </div>

            <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 shadow-2xs">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                Total Issued
              </span>
              <span className="text-lg font-bold text-indigo-600 font-mono mt-0.5 block">
                ₹{formatCurrency(summary.totalIssued)}
              </span>
              <span className="text-[10.5px] text-indigo-600/70">From returns & credits</span>
            </div>

            <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 shadow-2xs">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Redeemed
              </span>
              <span className="text-lg font-bold text-blue-600 font-mono mt-0.5 block">
                ₹{formatCurrency(summary.totalRedeemed)}
              </span>
              <span className="text-[10.5px] text-blue-600/70">Used in invoices</span>
            </div>

            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                Available Balance
              </span>
              <span className="text-lg font-bold text-emerald-600 font-mono mt-0.5 block">
                ₹{formatCurrency(summary.availableBalance)}
              </span>
              <span className="text-[10.5px] text-emerald-600/70">Ready to redeem</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap border-b border-border pb-3 shrink-0">
            {[
              { id: "ALL", label: "All Notes" },
              { id: "ACTIVE_OR_PARTIAL", label: "Available Only" },
              { id: "ACTIVE", label: "Active" },
              { id: "PARTIALLY_REDEEMED", label: "Partially Used" },
              { id: "FULLY_REDEEMED", label: "Fully Redeemed" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer",
                  statusFilter === f.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "border-border bg-surface text-text-muted hover:text-text hover:bg-surface-alt"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Error Alert */}
          {error && (
            <UIAlert variant="danger" icon={<AlertCircle className="size-4" />}>
              {error}
            </UIAlert>
          )}

          {/* Credit Notes List */}
          {loading ? (
            <div className="p-12 text-center text-text-muted text-xs">
              <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-primary" />
              Loading credit notes...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl space-y-2">
              <Receipt className="size-8 text-text-muted mx-auto opacity-50" />
              <p className="text-xs font-bold text-text">No Credit Notes Found</p>
              <p className="text-[11px] text-text-muted max-w-sm mx-auto">
                This customer does not have any credit notes matching the selected filter.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 pr-0.5">
              {filteredNotes.map((cnItem) => {
                const isExpanded = Boolean(expandedNotes[cnItem._id]);
                const redemptions = cnItem.redemptions || [];

                return (
                  <div
                    key={cnItem._id}
                    className="rounded-xl border border-border bg-surface hover:border-primary/40 transition-all p-3.5 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Receipt className="size-4 text-indigo-600 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-text">
                              {cnItem.creditNoteNo || cnItem.creditNoteNumber}
                            </span>
                            {getStatusBadge(cnItem.status)}
                          </div>
                          <div className="text-[11px] text-text-muted flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatDate(cnItem.issueDate || cnItem.date || cnItem.createdAt)}
                            </span>
                            {cnItem.salesReturnNo && (
                              <span>• Ret Bill: <strong>{cnItem.salesReturnNo}</strong></span>
                            )}
                            {cnItem.originalInvoiceNo && (
                              <span>• Orig Inv: <strong>{cnItem.originalInvoiceNo}</strong></span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amount Breakdown */}
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-[9.5px] font-bold text-text-muted uppercase block">
                            Total Amount
                          </span>
                          <span className="font-mono font-bold text-xs text-text">
                            ₹{formatCurrency(cnItem.totalAmount)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9.5px] font-bold text-text-muted uppercase block">
                            Redeemed
                          </span>
                          <span className="font-mono font-bold text-xs text-blue-600">
                            ₹{formatCurrency(cnItem.redeemedAmount)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[9.5px] font-bold text-emerald-600 uppercase block">
                            Available
                          </span>
                          <span className="font-mono font-bold text-xs text-emerald-600">
                            ₹{formatCurrency(cnItem.balanceAmount)}
                          </span>
                        </div>

                        {redemptions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(cnItem._id)}
                            className="p-1.5 rounded-lg border border-border hover:bg-surface-alt text-text-muted hover:text-text cursor-pointer transition-all"
                            title="View Redemptions"
                          >
                            {isExpanded ? (
                              <ChevronUp className="size-4" />
                            ) : (
                              <ChevronDown className="size-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notes / Reason */}
                    {cnItem.reason && (
                      <div className="text-[11px] text-text-muted italic bg-surface-alt/50 px-2.5 py-1 rounded-md">
                        Reason: {cnItem.reason}
                      </div>
                    )}

                    {/* Expanded Redemptions History */}
                    {isExpanded && redemptions.length > 0 && (
                      <div className="pt-2 border-t border-border/70 space-y-1.5 animate-in fade-in">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                          Invoice Redemptions History ({redemptions.length}):
                        </div>
                        <div className="space-y-1 bg-surface-alt/40 p-2 rounded-lg border border-border/50">
                          {redemptions.map((red, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded bg-surface border border-border/40 font-mono"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-text-muted">#{idx + 1}</span>
                                <span className="font-bold text-text">{red.invoiceNo}</span>
                                <span className="text-[10.5px] text-text-muted">
                                  ({formatDate(red.redeemedAt || red.date || red.createdAt)})
                                </span>
                              </div>
                              <span className="font-bold text-emerald-600">
                                -₹{formatCurrency(red.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pinned Footer */}
        <div className="p-4 sm:px-6 border-t border-border bg-surface-alt/40 shrink-0 flex items-center justify-between gap-3">
          <div className="text-xs text-text-muted">
            Showing <span className="font-semibold text-text">{filteredNotes.length}</span> of{" "}
            <span className="font-semibold text-text">{summary.totalCount}</span> notes • Available Balance:{" "}
            <span className="font-mono font-bold text-emerald-600">₹{formatCurrency(summary.availableBalance)}</span>
          </div>
          <UIButton variant="outline" size="sm" onClick={onClose}>
            Close
          </UIButton>
        </div>
      </div>
    </UIModal>
  );
};

export default CustomerCreditNotesDialog;

