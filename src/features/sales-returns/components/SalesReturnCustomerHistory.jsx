// src/features/sales-returns/components/SalesReturnCustomerHistory.jsx

import React, { useRef, useCallback } from "react";
import { History, RotateCcw, Loader2, ArrowRight, CheckCircle2, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { UIInfiniteScroll } from "@/components/ui/UIInfiniteScroll";

const formatCurrency = (val) => `₹${Number(val || 0).toFixed(2)}`;

export const SalesReturnCustomerHistory = ({
  customer,
  invoices = [],
  loading = false,
  loadingMore = false,
  hasMore = false,
  totalCount = 0,
  onLoadMore,
  onReturnItem,
  onReturnAllBillItems,
}) => {
  const scrollContainerRef = useRef(null);

  if (!customer || (!customer._id && !customer.id && !customer.name)) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center text-text-muted">
        <div className="flex flex-col items-center gap-2">
          <History className="size-8 opacity-20" />
          <p className="text-xs">Select a customer above to view past bills & purchase history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Customer Header */}
      <div className="p-3.5 border-b border-border bg-surface-alt/30 shrink-0">
        <div className="flex items-center justify-between gap-1.5 mb-0.5">
          <h3 className="font-bold text-text text-xs line-clamp-1">
            {customer.name || "Customer"}
          </h3>
          {customer.mobile && (
            <span className="text-[11px] font-mono text-text-muted">{customer.mobile}</span>
          )}
        </div>
        <p className="text-[10.5px] text-text-muted">
          Pick medicines directly from past bills to return
        </p>
      </div>

      {/* Bills List Header */}
      <div className="px-3 py-2 border-b border-border bg-surface-alt/10 flex items-center justify-between text-xs font-bold text-text-muted uppercase tracking-wider shrink-0">
        <span className="flex items-center gap-1.5">
          <History className="size-3.5" />
          Past Sales Bills
        </span>
        {!loading && totalCount > 0 && (
          <span className="text-[10px] font-mono lowercase tracking-normal">
            {invoices.length} of {totalCount} {totalCount === 1 ? "bill" : "bills"}
          </span>
        )}
      </div>

      {/* Scrollable Bills Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-2 bg-surface-alt/10 min-h-0"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 gap-2">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span className="text-xs text-text-muted">Loading customer bills...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-muted bg-surface rounded-xl border border-dashed border-border mx-1">
            No past purchase bills found for this customer.
          </div>
        ) : (
          <UIInfiniteScroll
            onLoadMore={onLoadMore}
            hasMore={hasMore}
            isLoading={loadingMore}
            scrollContainerRef={scrollContainerRef}
            rootMargin="80px"
            threshold={0.1}
            loader={
              <div className="py-2.5 flex items-center justify-center gap-1.5 text-xs text-text-muted font-medium">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>Loading more bills...</span>
              </div>
            }
          >
            <div className="space-y-2.5 p-1">
              {invoices.map((inv) => {
                const invDate = inv.date || inv.createdAt;
                const dateFormatted = invDate
                  ? new Date(invDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";

                return (
                  <div
                    key={inv._id || inv.invoiceNo}
                    className="bg-surface border border-border shadow-2xs rounded-xl overflow-hidden transition-all hover:border-border-focus"
                  >
                    {/* Invoice Card Top */}
                    <div className="bg-surface-alt/60 px-3 py-2 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-xs text-text">
                          #{inv.invoiceNo}
                        </span>
                        <span className="text-[10px] text-text-muted">•</span>
                        <span className="text-[10.5px] text-text-muted font-medium">
                          {dateFormatted}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-text font-mono">
                        {formatCurrency(inv.grandTotal || inv.amount)}
                      </span>
                    </div>

                    {/* Invoice Items with Return Actions */}
                    <div className="divide-y divide-border/50">
                      {(inv.items || []).map((item, idx) => {
                        const soldQty = Number(item.qty || 1);
                        const returnedQty = Number(item.returnedQty || 0);
                        const availableQty = Math.max(0, soldQty - returnedQty);
                        const isFullyReturned = availableQty <= 0;

                        return (
                          <div
                            key={idx}
                            className={cn(
                              "p-2.5 flex items-start justify-between gap-2 transition-colors group",
                              isFullyReturned
                                ? "bg-surface-alt/20 opacity-60"
                                : "hover:bg-surface-hover"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs font-semibold truncate", isFullyReturned ? "line-through text-text-muted" : "text-text")}>
                                {item.name || item.productName || "Medicine"}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-text-muted font-mono flex-wrap">
                                {item.batch && (
                                  <span className="px-1 py-0.2 rounded bg-surface-alt border border-border text-[9px]">
                                    {item.batch}
                                  </span>
                                )}
                                {(item.expiry || item.expiryDate) && (
                                  <>
                                    <span>•</span>
                                    <span>Exp: {item.expiry || item.expiryDate}</span>
                                  </>
                                )}
                                <span>Sold: {soldQty}</span>
                                {returnedQty > 0 && <span>• Returned: {returnedQty}</span>}
                                <span>•</span>
                                <span className={isFullyReturned ? "text-rose-500 font-bold" : "text-emerald-600 font-bold"}>
                                  Avail: {availableQty}
                                </span>
                                <span>•</span>
                                <span>{formatCurrency(item.rate || item.price || 0)}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isFullyReturned}
                              onClick={() => onReturnItem && onReturnItem(item, inv)}
                              className={cn(
                                "p-1.5 px-2 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer",
                                isFullyReturned
                                  ? "opacity-30 cursor-not-allowed bg-surface-alt text-text-muted"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white"
                              )}
                              title={isFullyReturned ? "Already returned" : "Return this item"}
                            >
                              <RotateCcw className="size-3" />
                              <span>Return</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </UIInfiniteScroll>
        )}
      </div>
    </div>
  );
};

export default SalesReturnCustomerHistory;
