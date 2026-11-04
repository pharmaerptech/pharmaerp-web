// src/features/sales/credit-notes/pages/mobile/CreditNotesMobilePage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Receipt,
  Search,
  RefreshCw,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
} from "lucide-react";
import {
  UIButton,
  UISelect,
  UIInfiniteScroll,
  UIBadge,
} from "@/components/ui";
import useBranch from "@/features/branch/hooks/useBranch";
import creditNoteService from "../../services/creditNoteService";
import CreditNoteDetailsDialog from "../../components/CreditNoteDetailsDialog";
import { cn } from "@/lib/utils";

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

const getStatusBadge = (status) => {
  switch (status) {
    case "ACTIVE":
      return (
        <UIBadge variant="soft" color="success" className="font-semibold text-[10.5px] px-2 py-0.5">
          Active
        </UIBadge>
      );
    case "PARTIALLY_REDEEMED":
      return (
        <UIBadge variant="soft" color="warning" className="font-semibold text-[10.5px] px-2 py-0.5">
          Partially Used
        </UIBadge>
      );
    case "FULLY_REDEEMED":
      return (
        <UIBadge variant="soft" color="info" className="font-semibold text-[10.5px] px-2 py-0.5">
          Fully Redeemed
        </UIBadge>
      );
    case "CANCELLED":
      return (
        <UIBadge variant="soft" color="error" className="font-semibold text-[10.5px] px-2 py-0.5">
          Cancelled
        </UIBadge>
      );
    default:
      return (
        <UIBadge variant="soft" color="neutral" className="font-semibold text-[10.5px] px-2 py-0.5">
          {status || "—"}
        </UIBadge>
      );
  }
};

const PAGE_LIMIT = 20;

export const CreditNotesMobilePage = () => {
  const { currentBranch } = useBranch();
  const branchId = currentBranch?._id || currentBranch?.id;
  const scrollContainerRef = useRef(null);

  const [creditNotes, setCreditNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchCreditNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        branchId: branchId || undefined,
        page: 1,
        limit: PAGE_LIMIT,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      };

      const [notesRes, statsRes] = await Promise.all([
        creditNoteService.getCreditNotes(params),
        creditNoteService.getCreditNoteStats({ branchId: branchId || undefined }),
      ]);

      const notesData = notesRes?.data?.data || notesRes?.data || {};
      const noteList = Array.isArray(notesData.creditNotes)
        ? notesData.creditNotes
        : Array.isArray(notesData)
        ? notesData
        : [];
      const total = notesData.meta?.total ?? notesData.total ?? noteList.length;

      setCreditNotes(noteList);
      setTotalCount(total);
      setCurrentPage(1);
      setHasMore(noteList.length < total);
      setStats(statsRes?.data?.data || statsRes?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load credit notes.");
    } finally {
      setIsLoading(false);
    }
  }, [branchId, statusFilter, searchQuery]);

  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    try {
      const params = {
        branchId: branchId || undefined,
        page: nextPage,
        limit: PAGE_LIMIT,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      };
      const res = await creditNoteService.getCreditNotes(params);
      const resData = res?.data?.data || res?.data || {};
      const noteList = Array.isArray(resData.creditNotes)
        ? resData.creditNotes
        : Array.isArray(resData)
        ? resData
        : [];
      const total = resData.meta?.total ?? resData.total ?? totalCount;

      if (noteList.length > 0) {
        setCreditNotes((prev) => {
          const existingIds = new Set(prev.map((c) => c._id));
          const newRows = noteList.filter((c) => !existingIds.has(c._id));
          const combined = [...prev, ...newRows];
          setHasMore(combined.length < total);
          return combined;
        });
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn("Mobile load more error:", err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoading, isLoadingMore, branchId, statusFilter, searchQuery, totalCount]);

  useEffect(() => {
    fetchCreditNotes();
  }, [fetchCreditNotes]);

  return (
    <div ref={scrollContainerRef} className="p-3 sm:p-4 space-y-3.5 max-w-full overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Receipt className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text">Credit Notes</h1>
            <p className="text-[11px] text-text-muted">Return vouchers & customer balance</p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchCreditNotes}
          disabled={isLoading}
          className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text cursor-pointer"
        >
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl border border-primary/20 bg-primary/5">
          <span className="text-[10px] font-bold text-primary uppercase block">Total Credit</span>
          <span className="text-base font-bold text-primary font-mono mt-0.5 block">
            {formatCurrency(stats?.totalIssuedAmount ?? 0)}
          </span>
        </div>
        <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <span className="text-[10px] font-bold text-emerald-600 uppercase block">Active Balance</span>
          <span className="text-base font-bold text-emerald-600 font-mono mt-0.5 block">
            {formatCurrency(stats?.totalActiveBalance ?? 0)}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search CN#, customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-surface text-text"
        />
      </div>

      {/* Status Filter Scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {[
          { id: "all", label: "All" },
          { id: "ACTIVE", label: "Active" },
          { id: "PARTIALLY_REDEEMED", label: "Partial" },
          { id: "FULLY_REDEEMED", label: "Redeemed" },
          { id: "CANCELLED", label: "Cancelled" },
        ].map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => setStatusFilter(st.id)}
            className={cn(
              "px-3 py-1 rounded-lg font-bold border shrink-0 cursor-pointer text-xs",
              statusFilter === st.id
                ? "bg-primary text-white border-primary"
                : "border-border bg-surface text-text-muted"
            )}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Card List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-text-muted">
          <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-primary" />
          Loading credit notes...
        </div>
      ) : creditNotes.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-border rounded-xl">
          <Receipt className="size-6 text-text-muted mx-auto opacity-50 mb-1" />
          <p className="text-xs font-bold text-text">No Credit Notes Found</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {creditNotes.map((cnItem) => {
            const cust = cnItem.customerId;
            const custName = typeof cust === "object" ? cust?.name : (cnItem.customerName || "Customer");
            const issueTimestamp = cnItem.issueDate || cnItem.date || cnItem.createdAt;

            return (
              <div
                key={cnItem._id}
                onClick={() => {
                  setSelectedCreditNote(cnItem);
                  setIsDialogOpen(true);
                }}
                className="p-3.5 rounded-xl border border-border bg-surface active:bg-surface-alt/60 transition-all space-y-2 cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono font-bold text-xs text-text">
                      {cnItem.creditNoteNo}
                    </span>
                    {(cnItem.sourceReturnNo || cnItem.originalInvoiceNo) && (
                      <span className="text-[10px] font-mono text-primary truncate">
                        {cnItem.sourceReturnNo ? `Ret: ${cnItem.sourceReturnNo}` : `Inv: ${cnItem.originalInvoiceNo}`}
                      </span>
                    )}
                  </div>
                  {getStatusBadge(cnItem.status)}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-text truncate max-w-[180px]">{custName}</span>
                  <span className="font-mono text-text-muted text-[11px]">{formatDate(issueTimestamp)}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
                  <div>
                    <span className="text-[10px] text-text-muted block">Total: ₹{Number(cnItem.totalAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-600 block">
                      Bal: ₹{Number(cnItem.balanceAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          <UIInfiniteScroll
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            isLoading={isLoadingMore}
            rootRef={scrollContainerRef}
            rootMargin="160px"
            endMessage={
              !hasMore && creditNotes.length > 0 ? (
                <span className="font-mono text-[11px] text-text-muted select-none py-2 block text-center">
                  ✓ All {totalCount} credit notes loaded
                </span>
              ) : null
            }
          />
        </div>
      )}

      {/* Details Dialog */}
      <CreditNoteDetailsDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedCreditNote(null);
        }}
        creditNote={selectedCreditNote}
        creditNoteId={selectedCreditNote?._id}
        onCancelSuccess={fetchCreditNotes}
      />
    </div>
  );
};

export default CreditNotesMobilePage;
