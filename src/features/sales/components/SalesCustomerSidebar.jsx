import React, { useEffect, useState, useRef, useCallback } from "react";
import { History, ShoppingBag, Loader2, ArrowRight, Users, UserCheck, User } from "lucide-react";
import { cn } from "@/lib/utils";
import invoiceService from "@/features/sales/services/invoiceService";
import { UIInfiniteScroll } from "@/components/ui/UIInfiniteScroll";

const formatCurrency = (val) => `₹${Number(val || 0).toFixed(2)}`;
const PAGE_SIZE = 5;

export const SalesCustomerSidebar = ({ customer, onAddProduct, onSwitchCustomer }) => {
  const [invoices, setInvoices] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const scrollContainerRef = useRef(null);
  const activeFetchIdRef = useRef(0);

  const customerId = customer?.id || customer?._id;

  // Reset member filter to "all" when the active customer changes
  useEffect(() => {
    setSelectedMemberFilter("all");
  }, [customerId]);

  const fetchHistory = useCallback(
    async (targetPage = 1, isAppending = false) => {
      if (!customerId) return;

      const fetchId = ++activeFetchIdRef.current;
      if (isAppending) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = {
          page: targetPage,
          limit: PAGE_SIZE,
          includeFamily: true,
        };

        if (selectedMemberFilter && selectedMemberFilter !== "all") {
          params.memberId = selectedMemberFilter;
        }

        const res = await invoiceService.getCustomerSales(customerId, params);
        if (activeFetchIdRef.current !== fetchId) return;

        const apiResponseData = res.data?.data;
        const invoicesList =
          apiResponseData?.data ||
          apiResponseData?.sales ||
          apiResponseData?.invoices ||
          (Array.isArray(apiResponseData) ? apiResponseData : []);

        const total =
          apiResponseData?.meta?.total ??
          res.data?.meta?.total ??
          invoicesList.length;

        setTotalCount(total);

        if (isAppending) {
          setInvoices((prev) => {
            const seen = new Set(prev.map((i) => i._id));
            const fresh = invoicesList.filter((i) => !seen.has(i._id));
            const merged = [...prev, ...fresh];
            setHasMore(merged.length < total && invoicesList.length === PAGE_SIZE);
            return merged;
          });
        } else {
          setInvoices(invoicesList);
          setHasMore(invoicesList.length < total && invoicesList.length === PAGE_SIZE);
        }

        if (Array.isArray(apiResponseData?.familyMembers)) {
          setFamilyMembers(apiResponseData.familyMembers);
        }
      } catch (err) {
        console.error("Failed to fetch customer history", err);
      } finally {
        if (activeFetchIdRef.current === fetchId) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [customerId, selectedMemberFilter]
  );

  // Trigger initial fetch or re-fetch on customer / filter changes
  useEffect(() => {
    if (!customerId) {
      setInvoices([]);
      setFamilyMembers([]);
      setTotalCount(0);
      setHasMore(false);
      return;
    }

    setPage(1);
    fetchHistory(1, false);
  }, [customerId, selectedMemberFilter, fetchHistory]);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage, true);
  }, [loading, loadingMore, hasMore, page, fetchHistory]);

  if (!customerId) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center text-text-muted">
        <div className="flex flex-col items-center gap-2">
          <History className="size-8 opacity-20" />
          <p className="text-sm">Select a customer to view history</p>
        </div>
      </div>
    );
  }

  const selectedMemberObj =
    selectedMemberFilter !== "all"
      ? familyMembers.find(
          (m) => (m.customerId || m._id)?.toString() === selectedMemberFilter
        )
      : null;

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* ── CUSTOMER & GROUP HEADER ── */}
      <div className="p-3.5 border-b border-border bg-surface-alt/30 shrink-0">
        <div className="flex items-center justify-between gap-1.5 mb-0.5">
          <h3 className="font-bold text-text text-xs line-clamp-1">
            {customer.name || customer.companyName}
          </h3>
          {familyMembers.length > 1 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Users className="size-2.5" />
              {familyMembers.length} Family
            </span>
          )}
        </div>
        {customer.mobile && <p className="text-[11px] text-text-muted">{customer.mobile}</p>}
      </div>

      {/* ── FAMILY MEMBER FILTER TABS (if customer has related members) ── */}
      {familyMembers.length > 1 && (
        <div className="px-3 pt-2 pb-2.5 border-b border-border bg-surface-alt/20 shrink-0">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              Filter by Member
            </span>
            {selectedMemberObj && !selectedMemberObj.isSelf && onSwitchCustomer && (
              <button
                type="button"
                onClick={() => onSwitchCustomer(selectedMemberObj)}
                className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors cursor-pointer"
                title={`Set ${selectedMemberObj.name} as active POS customer`}
              >
                <UserCheck className="size-3" />
                Bill to {selectedMemberObj.name.split(" ")[0]}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedMemberFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition-all cursor-pointer border",
                selectedMemberFilter === "all"
                  ? "bg-primary text-white border-primary shadow-2xs"
                  : "bg-surface text-text-muted hover:text-text border-border hover:bg-surface-hover"
              )}
            >
              All Family Bills
            </button>

            {familyMembers.map((m) => {
              const mId = (m.customerId || m._id)?.toString();
              const isSelected = selectedMemberFilter === mId;
              const shortName = m.name?.split(" ")[0] || m.name;

              return (
                <button
                  key={mId}
                  type="button"
                  onClick={() => setSelectedMemberFilter(mId)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition-all cursor-pointer border flex items-center gap-1",
                    isSelected
                      ? "bg-primary text-white border-primary shadow-2xs"
                      : "bg-surface text-text-muted hover:text-text border-border hover:bg-surface-hover"
                  )}
                  title={`${m.name} (${m.relation})`}
                >
                  <span>{m.isSelf ? "Self" : m.relation}</span>
                  <span className="opacity-75 font-normal truncate max-w-[65px]">
                    · {shortName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BILLS HISTORY LIST WITH INFINITE SCROLL (limit = 5) ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-2 bg-surface-alt/10 min-h-0"
      >
        <div className="px-2 py-2 flex items-center justify-between text-xs font-bold text-text-muted uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <History className="size-3.5" />
            {selectedMemberFilter === "all"
              ? "All Past Purchases"
              : `${selectedMemberObj?.name || "Member"}'s Purchases`}
          </span>
          {!loading && totalCount > 0 && (
            <span className="text-[10px] font-mono lowercase tracking-normal">
              {invoices.length} of {totalCount} {totalCount === 1 ? "bill" : "bills"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 gap-2">
            <Loader2 className="size-5 animate-spin text-primary" />
            <span className="text-xs text-text-muted">Loading bills...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-6 text-center text-xs text-text-muted bg-surface rounded-xl border border-dashed border-border mx-1">
            No past purchases found for {selectedMemberFilter === "all" ? "this family" : "this member"}.
          </div>
        ) : (
          <UIInfiniteScroll
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            isLoading={loadingMore}
            scrollContainerRef={scrollContainerRef}
            rootMargin="100px"
            threshold={0.1}
            loader={
              <div className="py-2 flex items-center justify-center gap-1.5 text-xs text-text-muted font-medium">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>Loading more bills...</span>
              </div>
            }
            endMessage={
              totalCount > PAGE_SIZE ? (
                <div className="py-2 text-center text-[10px] text-text-muted/60 select-none">
                  All {totalCount} bills loaded
                </div>
              ) : null
            }
          >
            <div className="space-y-2.5 p-1">
              {invoices.map((inv) => (
                <div
                  key={inv._id}
                  className="bg-surface border border-border shadow-2xs rounded-xl overflow-hidden transition-all hover:border-border-focus"
                >
                  {/* Invoice Header */}
                  <div className="bg-surface-alt/60 px-3 py-2 border-b border-border">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[10px] font-semibold text-text-muted">
                          {new Date(inv.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {inv.branchName && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-secondary/15 text-text-muted border border-border truncate max-w-[110px]"
                            title={`Branch: ${inv.branchName}`}
                          >
                            {inv.branchName}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-text font-mono">
                        {formatCurrency(inv.grandTotal)}
                      </span>
                    </div>

                    {/* Family Member Tag & Change Member Action */}
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-bold border truncate max-w-[150px]",
                          inv.isSelf
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        )}
                        title={inv.memberName ? `${inv.memberRelation}: ${inv.memberName}` : inv.memberRelation}
                      >
                        {inv.memberRelation || (inv.isSelf ? "Self" : "Family")} · {inv.memberName || "Self"}
                      </span>

                      {!inv.isSelf && onSwitchCustomer && (
                        <button
                          type="button"
                          onClick={() =>
                            onSwitchCustomer(inv.customerId || { name: inv.memberName })
                          }
                          className="text-[9px] font-bold text-primary hover:text-primary/80 shrink-0 flex items-center gap-0.5 transition-colors cursor-pointer"
                          title="Set as active POS customer"
                        >
                          <UserCheck className="size-2.5" />
                          Bill to this
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Items in Invoice */}
                  <div className="divide-y divide-border/50">
                    {(inv.items || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 flex items-start justify-between gap-2 hover:bg-surface-hover group transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-text truncate">
                            {item.name || item.productName || item.productId?.name || "Product"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {item.batch && (
                              <span className="text-[9.5px] font-mono px-1 py-0.2 rounded bg-surface-alt text-text-muted border border-border">
                                {item.batch}
                              </span>
                            )}
                            <p className="text-[10px] text-text-muted truncate font-mono">
                              {item.qty} × {formatCurrency(item.rate || item.price || item.rateC || item.mrp || 0)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onAddProduct && onAddProduct(item.productId, item, inv)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all shrink-0 cursor-pointer bg-primary/10 text-primary hover:bg-primary hover:text-white"
                          title="Reorder this product into current cart"
                        >
                          <ArrowRight className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </UIInfiniteScroll>
        )}
      </div>
    </div>
  );
};

export default SalesCustomerSidebar;
