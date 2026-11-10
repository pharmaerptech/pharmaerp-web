// src/features/purchases/pages/desktop/PurchaseReturnsDesktopPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Package,
  Boxes,
  AlertTriangle,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  UIPageHeader,
  UIStatCard,
  UIFilterBar,
  UITabs,
  UIButton,
  UIIconButton,
  UIInput,
  UISearchInput,
  UISelect,
  UIBadge,
  UIStatusIndicator,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  UITableEmpty,
  UITableLoading,
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

  // KPI Calculations
  const stats = useMemo(() => {
    const totalVal = returns.reduce((acc, r) => acc + (r.grandTotal || 0), 0);
    const taxVal = returns.reduce((acc, r) => acc + (r.totalGst || 0), 0);
    const scrapCount = returns.filter(
      (r) => r.returnMotive === "EXPIRED" || r.returnMotive === "BROKEN"
    ).length;
    const sellableCount = returns.filter(
      (r) => r.returnMotive === "SELLABLE"
    ).length;

    return {
      totalVal,
      taxVal,
      scrapCount,
      sellableCount,
    };
  }, [returns]);

  const motiveTabs = [
    { id: "all", label: "All Returns", icon: <Boxes className="size-3.5" /> },
    { id: "SELLABLE", label: "Sellable Shelf", icon: <Package className="size-3.5" /> },
    { id: "EXPIRED", label: "Expired Scrap", icon: <Trash2 className="size-3.5" /> },
    { id: "BROKEN", label: "Broken Scrap", icon: <AlertTriangle className="size-3.5" /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header (Component #16) */}
      <UIPageHeader
        title="Purchase Returns & Debit Notes"
        description={`Manage vendor returns, issue Section 34 GST Debit Notes, and track stock reversals for ${currentBranch?.name || "Active Facility"}`}
        actions={
          <div className="flex items-center gap-2.5">
            <UIButton
              variant="outline"
              size="sm"
              onClick={() => fetchReturns(1, true)}
              startIcon={<RefreshCw className="size-3.5" />}
              title="Refresh list"
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
        }
      />

      {/* 2. KPI Stat Cards Grid (Component #28) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <UIStatCard
          title="Total Debit Notes"
          value={totalCount}
          subtitle={`Across ${currentBranch?.name || "facility"}`}
          icon={<Undo2 className="size-5" />}
          color="primary"
          variant="default"
          isLoading={isLoading}
        />

        <UIStatCard
          title="Total Debit Value"
          value={formatCurrency(stats.totalVal)}
          prefix="₹"
          subtitle="Direct AP reduction claimed"
          icon={<Receipt className="size-5" />}
          color="success"
          variant="default"
          isLoading={isLoading}
        />

        <UIStatCard
          title="ITC Tax Reversal"
          value={formatCurrency(stats.taxVal)}
          prefix="₹"
          subtitle="GSTR-2 Sec 34 reversal"
          icon={<ShieldCheck className="size-5" />}
          color="purple"
          variant="default"
          isLoading={isLoading}
        />

        <UIStatCard
          title="Scrap Bin Claims"
          value={stats.scrapCount}
          subtitle={`${stats.sellableCount} sellable returns`}
          icon={<Trash2 className="size-5" />}
          color="warning"
          variant="default"
          isLoading={isLoading}
        />
      </div>

      {/* 3. Motive Segmented Tabs & Filters (Components #9 & #26) */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Segmented Motive Tabs */}
          <UITabs
            tabs={motiveTabs}
            activeTab={returnMotive}
            onChange={(tabId) => setReturnMotive(tabId)}
            variant="segmented"
            size="sm"
          />

          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-64 sm:w-72">
              <UISearchInput
                value={search}
                onChange={(val) => setSearch(val)}
                placeholder="Search debit note, memo, supplier..."
                size="sm"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-8.5 px-3 border border-border rounded-lg bg-surface text-xs font-medium text-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border/60">
          <span>
            Showing <strong className="text-text">{returns.length}</strong> of{" "}
            <strong className="text-text">{totalCount}</strong> purchase return records
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Building2 className="size-3.5 text-primary" />
            Facility: <strong className="text-text">{currentBranch?.name || "Active Facility"}</strong>
          </span>
        </div>
      </div>

      {/* 4. Returns Data Table (Component #11) */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
        <UITable>
          <UITableHeader>
            <UITableRow className="bg-surface-alt/60">
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
                Debit Total
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
                description="Click 'New Purchase Return' or return quarantined stock directly from the Expired & Scrap items register."
              />
            ) : (
              returns.map((ret) => {
                const supplier = ret.supplierId || {};
                const itemCount = (ret.items || []).length;

                return (
                  <UITableRow
                    key={ret._id}
                    className="hover:bg-surface-hover transition-colors cursor-pointer"
                    onClick={() => handleOpenPreview(ret)}
                  >
                    <UITableCell className="py-3.5 px-4 font-mono font-bold text-text">
                      <div className="flex items-center gap-1.5">
                        <span>{ret.debitNoteNo || ret.returnNo}</span>
                      </div>
                      {ret.debitNoteNo && ret.returnNo !== ret.debitNoteNo && (
                        <span className="block font-sans text-[11px] font-normal text-text-muted">
                          Memo: {ret.returnNo}
                        </span>
                      )}
                    </UITableCell>

                    <UITableCell className="py-3.5 px-4 text-xs text-text-muted font-medium">
                      {formatDate(ret.returnDate)}
                    </UITableCell>

                    <UITableCell className="py-3.5 px-4">
                      <div className="font-semibold text-xs text-text">
                        {supplier.businessName || "Unknown Supplier"}
                      </div>
                      {supplier.gstNumber && (
                        <div className="text-[11px] text-text-muted font-mono">
                          GST: {supplier.gstNumber}
                        </div>
                      )}
                    </UITableCell>

                    <UITableCell className="py-3.5 px-4">
                      <UIBadge
                        variant="soft"
                        color={
                          ret.returnMotive === "SELLABLE"
                            ? "primary"
                            : ret.returnMotive === "EXPIRED"
                            ? "warning"
                            : "error"
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
                      <UIStatusIndicator
                        status={
                          ret.status === "CONFIRMED"
                            ? "success"
                            : ret.status === "CANCELLED"
                            ? "error"
                            : "draft"
                        }
                        label={ret.status}
                        variant="badge"
                        size="xs"
                        pulse={ret.status === "CONFIRMED"}
                      />
                    </UITableCell>

                    <UITableCell
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
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
          <div className="p-4 border-t border-border flex justify-center">
            <UIButton
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? "Loading more returns..." : "Load More Returns"}
            </UIButton>
          </div>
        )}
      </div>

      {/* 5. Details & Printable Debit Note Modal */}
      <PurchaseReturnDetailsModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        purchaseReturn={selectedReturn}
      />
    </div>
  );
};

export default PurchaseReturnsDesktopPage;
