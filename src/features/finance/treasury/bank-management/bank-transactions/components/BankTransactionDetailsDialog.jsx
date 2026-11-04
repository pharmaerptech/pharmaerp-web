// src/features/finance/treasury/bank-management/bank-transactions/components/BankTransactionDetailsDialog.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalBody,
  UIModalFooter,
  UIBadge,
  UIButton,
} from "@/components/ui";
import {
  Landmark,
  Copy,
  Check,
  Calendar,
  Clock,
  User,
  ExternalLink,
  Receipt,
  FileText,
  CreditCard,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Ban,
  Building2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    timeZone: "Asia/Kolkata",
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
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const resolveTxTimestamp = (tx) => {
  if (!tx) return null;
  const d = tx.transactionDate ? new Date(tx.transactionDate) : null;
  const isMidnightUTC =
    d &&
    !Number.isNaN(d.getTime()) &&
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0;

  if (isMidnightUTC && (tx.postedAt || tx.createdAt)) {
    return tx.postedAt || tx.createdAt;
  }
  return tx.transactionDate || tx.postedAt || tx.createdAt;
};

export const BankTransactionDetailsDialog = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const [copiedTxnNo, setCopiedTxnNo] = useState(false);
  const [copiedRefNo, setCopiedRefNo] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!transaction) return null;

  const {
    transactionNumber,
    transactionType,
    direction,
    amount,
    bankAccountId,
    transactionDate,
    referenceNumber,
    narration,
    counterpartyAccountId,
    journalVoucherId,
    status,
    cancellationReason,
    createdBy,
    postedBy,
    cancelledBy,
    createdAt,
  } = transaction;

  const effectiveTimestamp = resolveTxTimestamp(transaction);
  const isCredit = String(direction).toUpperCase() === "CREDIT";

  // Bank Account details
  const bankAccount = bankAccountId && typeof bankAccountId === "object" ? bankAccountId : null;
  const bankMaster = bankAccount?.bankMasterId && typeof bankAccount.bankMasterId === "object"
    ? bankAccount.bankMasterId
    : null;
  const bankName = bankMaster?.name || bankAccount?.accountName || "Corporate Bank Account";
  const maskedAccNo = bankAccount?.accountNumber
    ? `•••• ${String(bankAccount.accountNumber).slice(-4)}`
    : "—";

  const handleCopyTxnNo = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(transactionNumber);
    setCopiedTxnNo(true);
    setTimeout(() => setCopiedTxnNo(false), 2000);
  };

  const handleCopyRefNo = (e) => {
    e.stopPropagation();
    if (!referenceNumber) return;
    navigator.clipboard.writeText(referenceNumber);
    setCopiedRefNo(true);
    setTimeout(() => setCopiedRefNo(false), 2000);
  };

  const handleCopySummary = () => {
    const text = [
      `Bank Transaction: ${transactionNumber}`,
      `Type: ${transactionType} (${direction})`,
      `Bank: ${bankName} (${maskedAccNo})`,
      `Amount: ₹${formatCurrency(amount)}`,
      `Date: ${formatDate(effectiveTimestamp)} ${formatTime(effectiveTimestamp)}`,
      referenceNumber ? `Reference/UTR: ${referenceNumber}` : null,
      narration ? `Narration: ${narration}` : null,
      `Status: ${status}`,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const renderStatusBadge = () => {
    switch (status) {
      case "POSTED":
        return (
          <UIBadge
            variant="soft"
            color="success"
            icon={<ShieldCheck className="size-3 shrink-0" />}
            className="font-bold text-xs"
          >
            Posted to Ledger
          </UIBadge>
        );
      case "CANCELLED":
        return (
          <UIBadge
            variant="soft"
            color="error"
            icon={<Ban className="size-3 shrink-0" />}
            className="font-bold text-xs"
          >
            Cancelled
          </UIBadge>
        );
      case "DRAFT":
      default:
        return (
          <UIBadge
            variant="soft"
            color="warning"
            className="font-bold text-xs"
          >
            Draft (Pending)
          </UIBadge>
        );
    }
  };

  return (
    <UIModal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className="p-0 overflow-hidden"
    >
      <div className="flex flex-col max-h-[85vh]">
        {/* ── Modal Header ── */}
        <UIModalHeader className="px-6 py-4.5 border-b border-border bg-surface shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "size-10 rounded-xl flex items-center justify-center shrink-0 border",
              isCredit
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
            )}>
              {isCredit ? (
                <ArrowDownLeft className="size-5 stroke-[2.2]" />
              ) : (
                <ArrowUpRight className="size-5 stroke-[2.2]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <UIModalTitle className="text-base font-bold text-text font-mono">
                  {transactionNumber}
                </UIModalTitle>
                <button
                  type="button"
                  onClick={handleCopyTxnNo}
                  className="p-1 rounded-md hover:bg-surface-alt text-text-muted hover:text-text transition-colors"
                  title="Copy Transaction Number"
                >
                  {copiedTxnNo ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                </button>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Bank transaction journal entry details
              </p>
            </div>
          </div>
          <div>{renderStatusBadge()}</div>
        </UIModalHeader>

        {/* ── Modal Body ── */}
        <UIModalBody className="p-6 overflow-y-auto space-y-5 flex-1 bg-bg">
          {/* Hero Banner: Amount & Direction */}
          <div className="p-4 rounded-2xl border border-border bg-surface shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11.5px] font-semibold uppercase tracking-wider text-text-muted">
                Transaction Value
              </div>
              <div className={cn(
                "text-2xl sm:text-3xl font-extrabold font-mono tabular-nums leading-tight mt-0.5",
                isCredit
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}>
                {isCredit ? "+" : "-"} ₹{formatCurrency(amount)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider",
                isCredit
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              )}>
                {isCredit ? <ArrowDownLeft className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
                {isCredit ? "Credit / Inward" : "Debit / Outward"}
              </span>

              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-alt border border-border/80 text-text">
                {transactionType || "BANK"}
              </span>

              {transaction.paymentMode && (
                <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  Mode: {transaction.paymentMode}
                </span>
              )}

              {transaction.category && (
                <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-surface-alt border border-border/80 text-text">
                  {transaction.category.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>

          {/* Business Day / Shift UPI Settlement Banner */}
          {(transaction.category === "UPI_SETTLEMENT" || transaction.businessDayId || transaction.shiftId) && (
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
                  <Sparkles className="size-4" />
                  {transaction.businessDayId ? "Consolidated Business Day Settlement" : "Consolidated Shift Settlement"}
                </div>
                <div className="flex items-center gap-2.5">
                  <Link
                    to="/operations/business-days"
                    className="text-[11.5px] font-semibold text-text-muted hover:text-text hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Business Days <ExternalLink className="size-3" />
                  </Link>
                  <span className="text-border">•</span>
                  <Link
                    to="/finance/treasury/upi-transactions"
                    className="text-[11.5px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View UPI Bills <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                This transaction is an aggregated batch settlement from an active pharmacy operating day. Individual UPI micro-transactions across all shifts are held in transit clearing and credited to your bank account as a single consolidated entry at day-end.
              </p>
            </div>
          )}

          {/* Core Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Account Particulars */}
            <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                <Landmark className="size-4 text-primary" />
                Bank Account
              </div>
              <div>
                <div className="text-sm font-bold text-text flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-text-muted" />
                  {bankName}
                </div>
                <div className="text-xs font-mono text-text-muted mt-1">
                  Account: {maskedAccNo}
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="p-4 rounded-xl border border-border bg-surface space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                <Calendar className="size-4 text-primary" />
                Timestamp
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-text">
                  {formatDate(effectiveTimestamp)}
                </div>
                <div className="text-xs text-text-muted flex items-center gap-1 font-mono">
                  <Clock className="size-3" />
                  {formatTime(effectiveTimestamp)}
                </div>
              </div>
            </div>

            {/* Reference Number */}
            <div className="p-4 rounded-xl border border-border bg-surface space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Reference / UTR / Cheque #
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-bold text-text">
                  {referenceNumber || "—"}
                </span>
                {referenceNumber && (
                  <button
                    type="button"
                    onClick={handleCopyRefNo}
                    className="p-1 rounded-md hover:bg-surface-alt text-text-muted hover:text-text transition-colors"
                    title="Copy Reference"
                  >
                    {copiedRefNo ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* Counterparty / Offsetting Account */}
            <div className="p-4 rounded-xl border border-border bg-surface space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Counterparty Account
              </div>
              <div>
                <div className="text-sm font-bold text-text">
                  {counterpartyAccountId?.accountName || "—"}
                </div>
                {counterpartyAccountId?.accountCode && (
                  <div className="text-xs font-mono text-text-muted mt-0.5">
                    Code: {counterpartyAccountId.accountCode}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Narration */}
          {narration && (
            <div className="p-4 rounded-xl border border-border bg-surface space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Narration / Remarks
              </div>
              <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                {narration}
              </p>
            </div>
          )}

          {/* Cancellation Alert if Cancelled */}
          {status === "CANCELLED" && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-1 text-rose-600 dark:text-rose-400">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                <Ban className="size-4" />
                Cancellation Particulars
              </div>
              <p className="text-xs leading-relaxed">
                Reason: {cancellationReason || "No cancellation reason recorded."}
              </p>
              {cancelledBy && (
                <p className="text-[11px] opacity-80">
                  Cancelled by: {cancelledBy.name || cancelledBy.email}
                </p>
              )}
            </div>
          )}

          {/* Linked Journal Voucher */}
          {journalVoucherId && (
            <div className="p-4 rounded-xl border border-border bg-surface flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-text">
                    Journal Voucher Linked
                  </div>
                  <div className="text-xs font-mono text-text-muted">
                    {journalVoucherId.voucherNumber || journalVoucherId._id || "Voucher Entry"}
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-alt border border-border text-text">
                {journalVoucherId.status || "POSTED"}
              </span>
            </div>
          )}

          {/* Audit Metadata Footer */}
          <div className="pt-2 border-t border-border/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-muted">
            <div className="flex items-center gap-1.5">
              <User className="size-3.5" />
              <span>Created by: {createdBy?.name || createdBy?.email || "System"}</span>
            </div>
            {createdAt && (
              <div>
                Recorded on: {formatDate(createdAt)} {formatTime(createdAt)}
              </div>
            )}
          </div>
        </UIModalBody>

        {/* ── Modal Footer ── */}
        <UIModalFooter className="px-6 py-3.5 border-t border-border bg-surface shrink-0 flex items-center justify-between">
          <UIButton
            variant="ghost"
            size="sm"
            onClick={handleCopySummary}
            className="text-text-muted hover:text-text gap-1.5"
          >
            {copiedSummary ? (
              <>
                <Check className="size-3.5 text-success" />
                Copied Details
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy Summary
              </>
            )}
          </UIButton>

          <UIButton
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </UIButton>
        </UIModalFooter>
      </div>
    </UIModal>
  );
};

export default BankTransactionDetailsDialog;
