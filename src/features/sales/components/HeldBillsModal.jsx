// src/features/sales/components/HeldBillsModal.jsx

import React, { useState, useMemo } from "react";
import {
  PauseCircle,
  Search,
  Trash2,
  Play,
  Clock,
  User,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Building2,
  Stethoscope,
  X,
  RotateCcw,
} from "lucide-react";
import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
  UIButton,
  UIIconButton,
  UIBadge,
  UIInput,
} from "@/components";
import { cn } from "@/lib/utils";
import { HOLD_TYPE, getBillHoldType } from "../services/holdBillStorage";

/**
 * Format relative elapsed time from an ISO timestamp
 */
const formatElapsedTime = (isoString) => {
  if (!isoString) return "just now";
  const date = new Date(isoString);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const formatTimeExact = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const HeldBillsModal = ({
  isOpen,
  onClose,
  heldBills = [],
  onResume,
  onDiscard,
  onClearAll,
  branchName = "Active Branch",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBillId, setExpandedBillId] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Filter bills by search query
  const filteredBills = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return heldBills;
    return heldBills.filter((bill) => {
      const isAuto = getBillHoldType(bill) === HOLD_TYPE.AUTO;
      const matchType = (isAuto ? "auto hold priority" : "manual hold").includes(q);
      const matchToken = (bill.holdNumber || "").toLowerCase().includes(q);
      const matchCust = (bill.customerName || "").toLowerCase().includes(q);
      const matchPhone = (bill.customerPhone || "").toLowerCase().includes(q);
      const matchNote = (bill.note || "").toLowerCase().includes(q);
      const matchDoc = (bill.doctorName || "").toLowerCase().includes(q);
      const matchItem = bill.cart?.some((item) =>
        (item.name || "").toLowerCase().includes(q)
      );
      return (
        matchType ||
        matchToken ||
        matchCust ||
        matchPhone ||
        matchNote ||
        matchDoc ||
        matchItem
      );
    });
  }, [heldBills, searchQuery]);

  const toggleExpand = (id) => {
    setExpandedBillId((prev) => (prev === id ? null : id));
  };

  const handleDiscardClick = (id) => {
    if (deletingId === id) {
      onDiscard(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => {
        setDeletingId((curr) => (curr === id ? null : curr));
      }, 4000);
    }
  };

  const handleClearAllClick = () => {
    if (confirmClearAll) {
      onClearAll();
      setConfirmClearAll(false);
    } else {
      setConfirmClearAll(true);
      setTimeout(() => {
        setConfirmClearAll(false);
      }, 4000);
    }
  };

  return (
    <UIModal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex flex-col max-h-[85vh]">
        {/* Header */}
        <UIModalHeader className="border-b border-border pb-3 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <PauseCircle className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <UIModalTitle className="text-base font-bold text-text">
                    Held Bills Queue
                  </UIModalTitle>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    {heldBills.length} Active
                  </span>
                </div>
                <UIModalDescription className="text-xs text-text-muted">
                  Saved on this device for <span className="font-semibold text-text">{branchName}</span>
                </UIModalDescription>
              </div>
            </div>

            {/* Search Input */}
            <div className="w-56 sm:w-64">
              <UIInput
                type="text"
                size="sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search token, customer, item..."
                startIcon={<Search className="size-3.5 text-text-muted" />}
                isClearable
                onClear={() => setSearchQuery("")}
              />
            </div>
          </div>
        </UIModalHeader>

        {/* Body: List of Held Bills */}
        <UIModalBody className="p-4 overflow-y-auto space-y-3 flex-1 min-h-[300px]">
          {filteredBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="size-14 rounded-2xl bg-surface-alt border border-border flex items-center justify-center text-text-muted">
                <PauseCircle className="size-7 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-text">
                  {searchQuery ? "No matching held bills" : "No held bills in this branch"}
                </p>
                <p className="text-xs text-text-muted max-w-sm">
                  {searchQuery
                    ? "Try searching with a different customer name, phone, or token."
                    : "In-progress POS bills are automatically held when you leave the Sales page, or press F6 to hold manually."}
                </p>
              </div>
            </div>
          ) : (
            filteredBills.map((bill) => {
              const isExpanded = expandedBillId === bill.id;
              const isDeleting = deletingId === bill.id;
              const isAutoHold = getBillHoldType(bill) === HOLD_TYPE.AUTO;
              const displayName = bill.customerName || "Walk-in Customer";
              const itemCount = bill.itemCount || bill.cart?.length || 0;
              const grandTotal = bill.grandTotal || 0;

              return (
                <div
                  key={bill.id}
                  className={cn(
                    "rounded-xl border transition-all shadow-2xs overflow-hidden",
                    isAutoHold
                      ? "border-primary/40 bg-primary/5 hover:border-primary/60"
                      : "border-border bg-surface hover:border-border-strong"
                  )}
                >
                  {/* Card Main Row */}
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Token, Time, Customer & Notes */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Hold Token Badge */}
                        <span
                          className={cn(
                            "font-mono text-xs font-bold px-2 py-0.5 rounded-md border",
                            isAutoHold
                              ? "bg-primary/15 text-primary border-primary/30"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                          )}
                        >
                          {bill.holdNumber}
                        </span>

                        {/* Hold Type Badge (Auto vs Manual) */}
                        <UIBadge
                          variant="soft"
                          color={isAutoHold ? "primary" : "warning"}
                          className="text-[10px] uppercase font-bold"
                        >
                          {isAutoHold ? "Auto Hold · Priority" : "Manual"}
                        </UIBadge>

                        {/* Mode badge */}
                        <UIBadge
                          variant="soft"
                          color={bill.billingMode === "B2B" ? "warning" : "primary"}
                          className="text-[10px] uppercase font-bold"
                        >
                          {bill.billingMode === "B2B" ? "B2B" : "B2C"}
                        </UIBadge>

                        {/* Time elapsed */}
                        <span className="flex items-center gap-1 text-[11px] text-text-muted">
                          <Clock className="size-3" />
                          <span>{formatElapsedTime(bill.heldAt)}</span>
                          <span className="text-[10px] text-text-muted/60">
                            ({formatTimeExact(bill.heldAt)})
                          </span>
                        </span>
                      </div>

                      {/* Customer & Doctor details */}
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <div className="flex items-center gap-1 font-semibold text-text">
                          <User className="size-3.5 text-text-muted" />
                          <span>{displayName}</span>
                        </div>
                        {bill.customerPhone && (
                          <span className="text-text-muted font-mono text-[11px]">
                            • {bill.customerPhone}
                          </span>
                        )}
                        {bill.doctorName && (
                          <span className="text-text-muted flex items-center gap-1 text-[11px]">
                            • <Stethoscope className="size-3 text-primary/70" /> {bill.doctorName}
                          </span>
                        )}
                      </div>

                      {/* Remark / Note pill if any */}
                      {bill.note && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-alt border border-border/80 text-[11.5px] text-amber-800 dark:text-amber-200">
                          <FileText className="size-3 text-amber-600 shrink-0" />
                          <span className="font-medium truncate max-w-md">{bill.note}</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-xs text-text-muted flex items-center gap-1 sm:justify-end">
                          <ShoppingCart className="size-3" />
                          <span>{itemCount} units ({bill.cart?.length || 0} items)</span>
                        </div>
                        <div className="font-mono font-bold text-base text-text tabular-nums">
                          ₹{Number(grandTotal).toLocaleString("en-IN")}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <UIButton
                          variant="ghost"
                          size="xs"
                          onClick={() => toggleExpand(bill.id)}
                          className="text-xs font-semibold"
                          title="View items"
                        >
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </UIButton>

                        {/* Discard button */}
                        <UIButton
                          variant={isDeleting ? "danger" : "ghost"}
                          size="xs"
                          onClick={() => handleDiscardClick(bill.id)}
                          className={cn(
                            "cursor-pointer text-xs font-semibold transition-all",
                            isDeleting
                              ? "bg-error text-white font-bold"
                              : "text-text-muted hover:text-error hover:bg-error-soft/30"
                          )}
                          title={isDeleting ? "Click again to confirm discard" : "Discard this held bill"}
                        >
                          {isDeleting ? "Confirm Discard" : <Trash2 className="size-3.5" />}
                        </UIButton>

                        {/* Resume button */}
                        <UIButton
                          variant="primary"
                          size="xs"
                          onClick={() => onResume(bill)}
                          startIcon={<Play className="size-3.5 fill-current" />}
                          className="font-bold cursor-pointer"
                        >
                          Resume
                        </UIButton>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Line Items Preview */}
                  {isExpanded && (
                    <div className="border-t border-border bg-surface-alt/40 p-3 text-xs space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted pb-1 border-b border-border/50 flex justify-between">
                        <span>Line Item Details</span>
                        <span>Rate × Qty</span>
                      </div>
                      {bill.cart?.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="flex items-center justify-between py-1 text-xs text-text border-b border-border/30 last:border-b-0"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold">{item.name}</span>
                            <div className="text-[10.5px] text-text-muted font-mono flex items-center gap-2">
                              {item.batch && <span>Batch: <strong className="text-text font-bold">{item.batch}</strong></span>}
                              {item.expiry && <span>Exp: {item.expiry}</span>}
                              {item.rack && <span>Rack: {item.rack}</span>}
                            </div>
                          </div>
                          <div className="font-mono tabular-nums text-right shrink-0">
                            <span className="text-text-muted">
                              ₹{Number(item.price || 0).toFixed(0)} × {item.qty}
                            </span>
                            <span className="font-bold text-text ml-2">
                              = ₹{(Number(item.price || 0) * Number(item.qty || 1)).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </UIModalBody>

        {/* Footer */}
        <UIModalFooter className="flex items-center justify-between border-t border-border px-5 py-3 shrink-0">
          <div>
            {heldBills.length > 0 && (
              <UIButton
                variant={confirmClearAll ? "danger" : "ghost"}
                size="sm"
                onClick={handleClearAllClick}
                className={cn(
                  "text-xs transition-all",
                  confirmClearAll
                    ? "bg-error text-white font-bold"
                    : "text-error hover:bg-error-soft/30"
                )}
              >
                {confirmClearAll ? "Confirm Clear All Bills" : "Clear All Held Bills"}
              </UIButton>
            )}
          </div>
          <UIButton variant="ghost" size="sm" onClick={onClose}>
            Close
          </UIButton>
        </UIModalFooter>
      </div>
    </UIModal>
  );
};

export default HeldBillsModal;
