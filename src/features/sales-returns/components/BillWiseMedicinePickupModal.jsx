// src/features/sales-returns/components/BillWiseMedicinePickupModal.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
  RotateCcw,
  Receipt,
  Boxes,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  X,
} from "lucide-react";
import { UIModal, UIButton, UIBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const BillWiseMedicinePickupModal = ({
  open,
  isOpen,
  medicine,
  onClose,
  onAddItemsToCart,
}) => {
  const isModalOpen = Boolean(open ?? isOpen);

  // Map of bill index -> returnQty
  const [returnQuantities, setReturnQuantities] = useState({});
  // Map of bill index -> return motive ("general" | "expired" | "broken")
  const [returnMotives, setReturnMotives] = useState({});

  // Reset or initialize quantities and motives when medicine changes
  useEffect(() => {
    if (!medicine || !Array.isArray(medicine.bills)) {
      setReturnQuantities({});
      setReturnMotives({});
      return;
    }

    const initialQty = {};
    const initialMotive = {};
    medicine.bills.forEach((bill, idx) => {
      // If there's only 1 bill with available quantity, auto-select 1 unit
      if (medicine.bills.length === 1 && bill.availableQty > 0) {
        initialQty[idx] = 1;
      } else {
        initialQty[idx] = 0;
      }
      initialMotive[idx] = "general";
    });
    setReturnQuantities(initialQty);
    setReturnMotives(initialMotive);
  }, [medicine]);

  const handleQtyChange = (idx, delta, maxAvailable) => {
    setReturnQuantities((prev) => {
      const current = Number(prev[idx] || 0);
      const next = Math.max(0, Math.min(maxAvailable, current + delta));
      return { ...prev, [idx]: next };
    });
  };

  const handleSetMax = (idx, maxAvailable) => {
    setReturnQuantities((prev) => ({
      ...prev,
      [idx]: maxAvailable,
    }));
  };

  const handleMotiveChange = (idx, motive) => {
    setReturnMotives((prev) => ({
      ...prev,
      [idx]: motive,
    }));
  };

  // Compute totals
  const { totalUnits, totalRefund, itemsToAdd } = useMemo(() => {
    if (!medicine || !Array.isArray(medicine.bills)) {
      return { totalUnits: 0, totalRefund: 0, itemsToAdd: [] };
    }

    let units = 0;
    let refund = 0;
    const items = [];

    medicine.bills.forEach((bill, idx) => {
      const qty = Number(returnQuantities[idx] || 0);
      if (qty > 0) {
        const motive = returnMotives[idx] || "general";
        units += qty;
        refund += qty * bill.rate;
        items.push({
          ...bill,
          returnQty: qty,
          motive,
          refundAmount: qty * bill.rate,
        });
      }
    });

    return { totalUnits: units, totalRefund: refund, itemsToAdd: items };
  }, [medicine, returnQuantities, returnMotives]);

  const handleConfirmAdd = () => {
    if (itemsToAdd.length === 0) return;
    if (onAddItemsToCart) {
      onAddItemsToCart(itemsToAdd);
    }
    if (onClose) {
      onClose();
    }
  };

  if (!medicine) return null;

  return (
    <UIModal
      isOpen={isModalOpen}
      open={isModalOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <RotateCcw className="size-4" />
          </div>
          <div>
            <div className="font-bold text-base text-text">{medicine.name}</div>
            <div className="text-[11px] text-text-muted">
              Select original sale bill & quantity to return
            </div>
          </div>
        </div>
      }
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <UIButton variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
            Cancel
          </UIButton>

          <div className="flex items-center gap-3">
            {totalUnits > 0 && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-text-muted block">
                  Refund ({totalUnits} {totalUnits === 1 ? "unit" : "units"})
                </span>
                <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                  {formatCurrency(totalRefund)}
                </span>
              </div>
            )}

            <UIButton
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleConfirmAdd}
              disabled={totalUnits === 0}
              className="font-bold cursor-pointer"
            >
              Add to Return Cart
            </UIButton>
          </div>
        </div>
      }
    >
      <div className="space-y-3.5 py-1">
        {/* Info Strip */}
        <div className="p-3 rounded-xl border border-border bg-surface-alt/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap text-text-muted">
            {medicine.brand && <span>Brand: <strong className="text-text">{medicine.brand}</strong></span>}
            {medicine.pack && (
              <>
                <span>•</span>
                <span>Pack: <strong className="text-text">{medicine.pack}</strong></span>
              </>
            )}
            <span>•</span>
            <span>
              Total Purchased: <strong className="text-text">{medicine.totalSoldQty}</strong> units across{" "}
              <strong className="text-text">{medicine.bills?.length || 1}</strong> bills
            </span>
          </div>

          <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
            {medicine.totalAvailableQty} available to return
          </div>
        </div>

        {/* Bill-Wise Breakdown List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          <span className="text-[11px] font-bold text-text uppercase tracking-wider block">
            Purchased in Bills ({medicine.bills?.length || 0}):
          </span>

          {medicine.bills?.map((bill, idx) => {
            const dateFormatted = bill.date
              ? new Date(bill.date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—";

            const isFullyReturned = bill.availableQty <= 0;
            const currentQty = returnQuantities[idx] || 0;

            return (
              <div
                key={bill.invoiceId ? `${bill.invoiceId}-${idx}` : idx}
                className={cn(
                  "p-3.5 rounded-xl border transition-all space-y-2.5",
                  isFullyReturned
                    ? "border-border bg-surface-alt/20 opacity-65"
                    : currentQty > 0
                    ? "border-rose-500/40 bg-rose-500/5 shadow-2xs"
                    : "border-border bg-surface hover:border-primary/40"
                )}
              >
                {/* Header row: Bill #, Mode, Date, Status */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs text-text">
                      #{bill.invoiceNo}
                    </span>
                    <UIBadge variant="soft" color="primary" className="text-[9.5px] font-bold">
                      {bill.billingMode || "B2C"}
                    </UIBadge>
                    <span className="text-xs text-text-muted flex items-center gap-1 font-medium">
                      <Calendar className="size-3 text-text-muted" />
                      {dateFormatted}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isFullyReturned ? (
                      <UIBadge variant="soft" color="error" className="text-[9.5px] font-bold">
                        Already Returned ({bill.returnedQty}/{bill.soldQty})
                      </UIBadge>
                    ) : bill.returnedQty > 0 ? (
                      <UIBadge variant="soft" color="warning" className="text-[9.5px] font-bold">
                        Partially Returned ({bill.returnedQty}/{bill.soldQty})
                      </UIBadge>
                    ) : (
                      <UIBadge variant="soft" color="success" className="text-[9.5px] font-bold">
                        Available ({bill.availableQty} units)
                      </UIBadge>
                    )}
                  </div>
                </div>

                {/* Details Row: Batch, Expiry, Rate, Quantities */}
                <div className="flex items-center justify-between gap-3 text-xs pt-2 border-t border-border/70 flex-wrap">
                  <div className="flex items-center gap-2 text-text-muted font-mono flex-wrap">
                    <span>Batch: <strong className="text-text font-normal">{bill.batch}</strong></span>
                    <span>•</span>
                    <span>Exp: {bill.expiry}</span>
                    <span>•</span>
                    <span>Rate: <strong className="text-text font-normal">{formatCurrency(bill.rate)}</strong></span>
                    <span>•</span>
                    <span>Sold: {bill.soldQty}</span>
                    {bill.returnedQty > 0 && <span>• Returned: {bill.returnedQty}</span>}
                  </div>

                  {/* Quantity Stepper (if available) */}
                  {!isFullyReturned ? (
                    <div className="flex items-center gap-3 shrink-0 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleSetMax(idx, bill.availableQty)}
                        className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        Max ({bill.availableQty})
                      </button>

                      <div className="flex items-center border border-border rounded-lg overflow-hidden bg-surface shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(idx, -1, bill.availableQty)}
                          disabled={currentQty <= 0}
                          className="p-1 px-2 hover:bg-surface-alt disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Minus className="size-3 text-text-secondary" />
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-xs text-text">
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(idx, 1, bill.availableQty)}
                          disabled={currentQty >= bill.availableQty}
                          className="p-1 px-2 hover:bg-surface-alt disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Plus className="size-3 text-text-secondary" />
                        </button>
                      </div>

                      <div className="w-20 text-right font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                        {formatCurrency(currentQty * bill.rate)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-text-muted italic">
                      No units available to return on this bill
                    </span>
                  )}
                </div>

                {/* Motive Selector for this line */}
                {!isFullyReturned && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-[11px] bg-surface-alt/40 -mx-3.5 -mb-2.5 p-2 px-3 rounded-b-xl flex-wrap">
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <span className="font-semibold text-text">Return Motive:</span>
                      <span className="text-[10px] text-text-muted">
                        {returnMotives[idx] === "general"
                          ? "Restocks into active branch stock"
                          : "Auto-transfers to Scrap Store via Transfer Order"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMotiveChange(idx, "general")}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer border",
                          (returnMotives[idx] || "general") === "general"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : "bg-surface text-text-muted border-border hover:text-text"
                        )}
                      >
                        General (Resellable)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMotiveChange(idx, "expired")}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer border",
                          returnMotives[idx] === "expired"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                            : "bg-surface text-text-muted border-border hover:text-text"
                        )}
                      >
                        Expired
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMotiveChange(idx, "broken")}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer border",
                          returnMotives[idx] === "broken"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                            : "bg-surface text-text-muted border-border hover:text-text"
                        )}
                      >
                        Broken / Damaged
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </UIModal>
  );
};

export default BillWiseMedicinePickupModal;
