// src/features/purchases/pages/desktop/PurchaseReturnsDesktopPage.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Undo2,
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  Building2,
  Truck,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";
import {
  UIButton,
  UIInput,
  UISelect,
  UIBadge,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  UITableEmpty,
  UITableLoading,
  UIInfiniteScroll,
  uiToast,
} from "@/components/ui";
import purchaseReturnService from "../../services/purchaseReturnService";
import { PurchaseReturnDetailsModal } from "../../components/PurchaseReturnDetailsModal";
import useBranch from "@/features/branch/hooks/useBranch";
import { ROUTES } from "@/constants";

const PAGE_LIMIT = 25;

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
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const PurchaseReturnsDesktopPage = () => {
  const navigate = useNavigate();
  const { currentBranch, activeBranchId } = useBranch();

  // Filters State
  const [search, setSearch] = useState("");
  const [returnMotive, setReturnMotive] = useState("all");
  const [status, setStatus] = useState("all");

  // Data & Pagination State
  const [returns, setReturns] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch Returns
  const fetchReturns = useCallback(
    async (pageToFetch = 1, isInitial = false) => {
      if (isInitial) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const params = {
          page: pageToFetch,
          limit: PAGE_LIMIT,
          branchId: activeBranchId,
          search: search.trim() || undefined,
          returnMotive: returnMotive !== "all" ? returnMotive : undefined,
          status: status !== "all" ? status : undefined,
        };

        const res = await purchaseReturnService.getPurchaseReturns(params);
        const data = res.data?.data || res.data || {};
        const list = data.data || [];
        const total = data.total || 0;

        if (pageToFetch === 1) {
          setReturns(list);
        } else {
          setReturns((prev) => [...prev, ...list]);
        }

        setTotalCount(total);
        setHasMore(pageToFetch * PAGE_LIMIT < total);
        setPage(pageToFetch);
      } catch (err) {
        console.error("Failed to fetch purchase returns:", err);
        uiToast.error("Failed to load purchase returns");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeBranchId, search, returnMotive, status]
  );

  useEffect(() => {
    fetchReturns(1, true);
  }, [fetchReturns]);

  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore) {
      fetchReturns(page + 1, false);
    }
  };

  const handleOpenPreview = (ret) => {
    setSelectedReturn(ret);
    setIsPreviewOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            <Undo2 className="size-6 text-primary" />
            Purchase Returns & Debit Notes
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Manage vendor returns, issue Section 34 Debit Notes, and track stock deductions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <UIButton
            variant="outline"
            size="sm"
            onClick={() => fetchReturns(1, true)}
            startIcon={<RefreshCw className="size-3.5" />}
          >
            Refresh
          </UIButton>

          <UIButton
            variant="primary"
            size="sm"
            onClick={() => navigate(ROUTES.CREATE_PURCHASE_RETURN)}
            startIcon={<Plus className="size-3.5" />}
            className="font-bold shadow-xs"
          >
            New Purchase Return
          </UIButton>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card border rounded-xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by debit note #, return memo #, or supplier..."
              className="w-full h-9 pl-9 pr-3 border rounded-lg bg-background text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
            />
          </div>

          <div>
            <select
              value={returnMotive}
              onChange={(e) => setReturnMotive(e.target.value)}
              className="w-full h-9 px-3 border rounded-lg bg-background text-xs font-medium"
            >
              <option value="all">All Motives</option>
              <option value="SELLABLE">Sellable Stock</option>
              <option value="EXPIRED">Expired Stock</option>
              <option value="BROKEN">Broken / Damaged</option>
              <option value="MIXED">Mixed Motives</option>
            </select>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 px-3 border rounded-lg bg-background text-xs font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t">
          <span>
            Showing <strong className="text-text">{returns.length}</strong> of{" "}
            <strong className="text-text">{totalCount}</strong> purchase returns
          </span>
          <span>
            Facility: <strong className="text-text">{currentBranch?.name || "Active Facility"}</strong>
          </span>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-2xs">
        <UITable>
          <UITableHeader>
            <UITableRow className="bg-surface/50">
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px]">
                Debit Note #
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px]">
                Date
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px]">
                Supplier
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px]">
                Motive
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-center">
                Items
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-right">
                Taxable Subtotal
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-right">
                Total GST
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-right">
                Grand Total
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-center">
                Status
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-center">
                Action
              </UITableHead>
            </UITableRow>
          </UITableHeader>

          <UITableBody>
            {isLoading ? (
              <UITableLoading colSpan={10} />
            ) : returns.length === 0 ? (
              <UITableEmpty
                colSpan={10}
                title="No purchase returns found"
                description="Create a return above or select quarantined batches from the Expired & Scrap items register."
              />
            ) : (
              returns.map((ret) => {
                const supplier = ret.supplierId || {};
                const itemCount = (ret.items || []).length;

                return (
                  <UITableRow
                    key={ret._id}
                    className="hover:bg-surface/40 transition-colors"
                  >
                    <UITableCell className="py-3.5 px-4 font-mono font-bold text-text">
                      {ret.debitNoteNo || ret.returnNo}
                      {ret.debitNoteNo && ret.returnNo !== ret.debitNoteNo && (
                        <span className="block font-sans text-[11px] font-normal text-text-muted">
                          Memo: {ret.returnNo}
                        </span>
                      )}
                    </UITableCell>

                    <UITableCell className="py-3.5 px-4 text-xs text-text-muted">
                      {formatDate(ret.returnDate)}
                    </UITableCell>

                    <UITableCell className="py-3.5 px-4">
                      <div className="font-semibold text-xs text-text">
                        {supplier.businessName || "Unknown Supplier"}
                      </div>
                      {supplier.gstNumber && (
                        <div className="text-[11px] text-text-muted font-mono">
                          {supplier.gstNumber}
                        </div>
                      )}
                    </UITableCell>

                    <UITableCell className="py-3.5 px-4">
                      <UIBadge
                        variant={
                          ret.returnMotive === "SELLABLE"
                            ? "default"
                            : ret.returnMotive === "EXPIRED"
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {ret.returnMotive}
                      </UIBadge>
                    </UITableCell>

                    <UITableCell className="py-3.5 px-4 text-center font-bold text-xs">
                      {itemCount}
                    </UITableCell>

                    <UITableCell className="py-3.5 px-4 text-right font-mono text-xs">
                      ₹{formatCurrency(ret.taxableSubtotal)}
                    </UITableCell>

                    <UITableCell className="py-3.5 px-4 text-right font-mono text-xs text-text-muted">
                      ₹{formatCurrency(ret.totalGst)}
                    </UITableCell>

                    <UITableCell className="py-3.5 px-4 text-right font-mono font-bold text-xs text-primary">
                      ₹{formatCurrency(ret.grandTotal)}
                    </UITableCell>

                    <UITableCell className="py-3.5 px-4 text-center">
                      <UIBadge
                        variant={
                          ret.status === "CONFIRMED"
                            ? "default"
                            : ret.status === "CANCELLED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {ret.status}
                      </UIBadge>
                    </UITableCell>

                    <UITableCell className="py-3.5 px-4 text-center">
                      <UIButton
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenPreview(ret)}
                        startIcon={<Eye className="size-3.5" />}
                        title="View & Print Debit Note"
                      >
                        View
                      </UIButton>
                    </UITableCell>
                  </UITableRow>
                );
              })
            )}
          </UITableBody>
        </UITable>

        {hasMore && (
          <div className="p-4 border-t flex justify-center">
            <UIButton
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? "Loading more..." : "Load More Returns"}
            </UIButton>
          </div>
        )}
      </div>

      {/* Details & Print Modal */}
      <PurchaseReturnDetailsModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        purchaseReturn={selectedReturn}
      />
    </div>
  );
};

export default PurchaseReturnsDesktopPage;
