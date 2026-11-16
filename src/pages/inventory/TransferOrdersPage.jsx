// src/pages/inventory/TransferOrdersPage.jsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Eye,
  Edit3,
  Check,
  X,
  Building2,
  Ban,
  AlertTriangle,
} from "lucide-react";
import transferOrderService from "../../features/transfer-order/services/transferOrderService";
import useBranch from "../../features/branch/hooks/useBranch";
import { BranchFilterSelect, BranchBadge } from "@/components/shared";
import { useBranchFilter } from "@/hooks";
import {
  UIButton,
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
  UITableScrollArea,
  UIConfirmDialog,
  uiToast as toast,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const PAGE_LIMIT = 20;

const formatDate = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "In Transit", value: "IN_TRANSIT" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const TransferOrdersPage = () => {
  const navigate = useNavigate();
  const tableContainerRef = useRef(null);
  const { isCompanyLevel, selectedBranchId, setSelectedBranchId, queryBranchId } = useBranchFilter();
  const { branches, getCompanyBranches, currentBranch } = useBranch();

  // Core Data & Infinite Scroll states
  const [transferOrders, setTransferOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    status: "all",
    sourceBranchId: "all",
    destinationBranchId: "all",
  });

  // Action Loading & Modal states
  const [receivingId, setReceivingId] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [loadingViewId, setLoadingViewId] = useState(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    getCompanyBranches();
  }, [getCompanyBranches]);

  // Source & Destination Facility options for UISelect
  const branchOptions = useMemo(() => {
    const list = Array.isArray(branches) ? branches : [];
    return [
      { label: "All Facilities", value: "all" },
      ...list.map((b) => ({
        label: b.name || "Branch",
        value: b._id || b.id,
      })),
    ];
  }, [branches]);

  // Initial Fetch
  const fetchInitialOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: 1,
        limit: PAGE_LIMIT,
      };
      if (filters.status !== "all") params.status = filters.status;
      if (filters.sourceBranchId !== "all") params.sourceBranchId = filters.sourceBranchId;
      if (filters.destinationBranchId !== "all") params.destinationBranchId = filters.destinationBranchId;
      if (queryBranchId) params.branchId = queryBranchId;

      const res = await transferOrderService.getTransferOrders(params);
      const data = res?.data?.data || {};
      const list = Array.isArray(data.transferOrders) ? data.transferOrders : [];
      const total = data.total ?? list.length;

      setTransferOrders(list);
      setTotalOrders(total);
      setCurrentPage(1);
      setHasMore(list.length < total);
    } catch (error) {
      toast.error("Failed to load transfer orders");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, queryBranchId]);

  useEffect(() => {
    fetchInitialOrders();
  }, [fetchInitialOrders]);

  // Load More for Infinite Scroll
  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const params = {
        page: nextPage,
        limit: PAGE_LIMIT,
      };
      if (filters.status !== "all") params.status = filters.status;
      if (filters.sourceBranchId !== "all") params.sourceBranchId = filters.sourceBranchId;
      if (filters.destinationBranchId !== "all") params.destinationBranchId = filters.destinationBranchId;
      if (queryBranchId) params.branchId = queryBranchId;

      const res = await transferOrderService.getTransferOrders(params);
      const data = res?.data?.data || {};
      const nextList = Array.isArray(data.transferOrders) ? data.transferOrders : [];
      const total = data.total ?? totalOrders;

      if (nextList.length > 0) {
        setTransferOrders((prev) => {
          const existingIds = new Set(prev.map((o) => o._id || o.id));
          const newRows = nextList.filter((o) => !existingIds.has(o._id || o.id));
          const combined = [...prev, ...newRows];
          setHasMore(combined.length < total);
          return combined;
        });
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.warn("Failed to load more transfer orders:", error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoading, isLoadingMore, filters, queryBranchId, totalOrders]);

  // Receive transfer order
  const handleReceive = async (id) => {
    if (!window.confirm("Are you sure you want to receive this order and update inventory?")) return;

    try {
      setReceivingId(id);
      await transferOrderService.receiveTransferOrder(id);
      toast.success("Transfer order received successfully");
      fetchInitialOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to receive transfer order");
    } finally {
      setReceivingId(null);
    }
  };

  // View order details
  const handleView = async (id) => {
    try {
      setLoadingViewId(id);
      const res = await transferOrderService.getTransferOrderById(id);
      setViewingOrder(res?.data?.data || res?.data);
    } catch (error) {
      toast.error("Failed to load transfer order details");
      console.error(error);
    } finally {
      setLoadingViewId(null);
    }
  };

  // Open cancel warning confirmation dialog
  const handleOpenCancelConfirm = (order) => {
    setOrderToCancel(order);
    setCancelConfirmOpen(true);
  };

  // Execute transfer order cancellation
  const handleCancelOrder = async () => {
    if (!orderToCancel?._id && !orderToCancel?.id) return;
    const targetId = orderToCancel._id || orderToCancel.id;

    try {
      setIsCancelling(true);
      const res = await transferOrderService.cancelTransferOrder(targetId);
      const updatedOrder = res?.data?.data || res?.data;

      toast.success(
        `Transfer Order ${orderToCancel.transferNo || ""} cancelled successfully. Inventory restored.`
      );

      // Update transfer orders table list
      setTransferOrders((prev) =>
        prev.map((o) =>
          (o._id || o.id) === targetId ? { ...o, status: "CANCELLED" } : o
        )
      );

      // If details modal is open for this order, immediately update its view
      if (
        viewingOrder &&
        (viewingOrder._id || viewingOrder.id) === targetId
      ) {
        setViewingOrder(updatedOrder || { ...viewingOrder, status: "CANCELLED" });
      }

      setCancelConfirmOpen(false);
      setOrderToCancel(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to cancel transfer order"
      );
      console.error("Cancel transfer order error:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      status: "all",
      sourceBranchId: "all",
      destinationBranchId: "all",
    });
  };

  // Compute dynamic stats
  const stats = useMemo(() => {
    const total = totalOrders || transferOrders.length;
    let inTransit = 0;
    let completed = 0;
    let cancelled = 0;

    for (const o of transferOrders) {
      const st = String(o.status || "").toUpperCase();
      if (st === "IN_TRANSIT") inTransit += 1;
      else if (st === "COMPLETED") completed += 1;
      else if (st === "CANCELLED") cancelled += 1;
    }

    return { total, inTransit, completed, cancelled };
  }, [totalOrders, transferOrders]);

  const getStatusBadge = (status) => {
    const st = String(status || "").toUpperCase();
    switch (st) {
      case "COMPLETED":
        return <UIBadge variant="soft" color="success">Completed</UIBadge>;
      case "IN_TRANSIT":
        return <UIBadge variant="soft" color="warning">In Transit</UIBadge>;
      case "CANCELLED":
        return <UIBadge variant="soft" color="error">Cancelled</UIBadge>;
      default:
        return <UIBadge variant="soft" color="neutral">{status?.replace("_", " ")}</UIBadge>;
    }
  };

  const isFiltered =
    filters.status !== "all" ||
    filters.sourceBranchId !== "all" ||
    filters.destinationBranchId !== "all";

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* ── 1. Compact 4-Card Statistics Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Transfers */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <ArrowLeftRight className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total Transfers
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.total}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Inter-branch transfers
            </div>
          </div>
        </div>

        {/* Card 2: In Transit */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-warning-soft text-warning flex items-center justify-center shrink-0">
            <Truck className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-warning truncate">
              In Transit
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.inTransit}
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono truncate mt-0.5">
              En route to destination
            </div>
          </div>
        </div>

        {/* Card 3: Completed */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              Completed
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.completed}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate mt-0.5">
              Received & restocked
            </div>
          </div>
        </div>

        {/* Card 4: Cancelled */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-error-soft text-error flex items-center justify-center shrink-0">
            <XCircle className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-error truncate">
              Cancelled
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.cancelled}
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono truncate mt-0.5">
              Terminated orders
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Filter Toolbar ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Branch Filter (Company Level Only) */}
        <BranchFilterSelect
          value={selectedBranchId}
          onChange={setSelectedBranchId}
          size="md"
          className="w-[170px] sm:w-[200px]"
        />

        {/* Status Dropdown */}
        <div className="w-[150px] sm:w-[170px]">
          <UISelect
            value={filters.status}
            onChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
            options={STATUS_OPTIONS}
            placeholder="All Statuses"
            size="md"
          />
        </div>

        {/* Source Facility Dropdown */}
        <div className="w-[170px] sm:w-[200px]">
          <UISelect
            value={filters.sourceBranchId}
            onChange={(val) => setFilters((prev) => ({ ...prev, sourceBranchId: val }))}
            options={branchOptions}
            placeholder="Source Facility"
            size="md"
          />
        </div>

        {/* Destination Facility Dropdown */}
        <div className="w-[170px] sm:w-[200px]">
          <UISelect
            value={filters.destinationBranchId}
            onChange={(val) => setFilters((prev) => ({ ...prev, destinationBranchId: val }))}
            options={branchOptions}
            placeholder="Destination Facility"
            size="md"
          />
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleResetFilters}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
            className="h-10 px-2 text-xs text-text-muted hover:text-text"
            title="Reset filters"
          >
            Reset
          </UIButton>
        )}

        {/* Right-Aligned Action Cluster */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Refresh Button */}
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={fetchInitialOrders}
            className="h-10 w-10 p-0 text-text-muted hover:text-text"
            title="Refresh transfer orders"
          >
            <RefreshCw
              className={cn("size-4 text-text-muted hover:text-primary", isLoading && "animate-spin text-primary")}
            />
          </UIButton>

          {/* New Transfer Button */}
          <UIButton
            type="button"
            variant="primary"
            size="md"
            startIcon={<Plus className="size-3.5" />}
            onClick={() => navigate("/inventory/transfer-orders/create")}
            className="h-10 px-3.5 text-xs font-semibold shadow-xs"
          >
            New Transfer
          </UIButton>
        </div>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ──── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
        <UITableScrollArea containerRef={tableContainerRef} className="divide-y divide-border/60">
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full text-xs font-sans"
          >
            {/* Sticky Table Header */}
            <UITableHeader sticky className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs">
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
                <UITableHead sticky className="min-w-[150px]">Transfer No</UITableHead>
                <UITableHead sticky className="min-w-[200px]">Source Facility</UITableHead>
                <UITableHead sticky className="min-w-[200px]">Destination Facility</UITableHead>
                <UITableHead sticky align="center" className="min-w-[120px]">Status</UITableHead>
                <UITableHead sticky className="min-w-[120px]">Date</UITableHead>
                <UITableHead sticky align="right" className="w-36">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={6} rows={6} />
              ) : transferOrders.length === 0 ? (
                <UITableEmpty
                  colSpan={6}
                  title="No transfer orders found"
                  description={
                    isFiltered
                      ? "No transfers match your filter criteria. Try clearing filters."
                      : "No stock transfer orders recorded between facilities yet."
                  }
                  action={
                    isFiltered ? (
                      <UIButton
                        variant="secondary"
                        size="sm"
                        onClick={handleResetFilters}
                      >
                        Clear Filters
                      </UIButton>
                    ) : undefined
                  }
                />
              ) : (
                transferOrders.map((order) => {
                  const canEdit =
                    order.status === "IN_TRANSIT" &&
                    currentBranch?._id === order.sourceBranchId?._id;
                  const canReceive =
                    order.status === "IN_TRANSIT" &&
                    currentBranch?._id === order.destinationBranchId?._id;

                  return (
                    <UITableRow
                      key={order._id || order.id}
                      onClick={() => handleView(order._id)}
                      className="cursor-pointer hover:bg-surface-hover/70 transition-colors"
                    >
                      {/* Transfer No */}
                      <UITableCell className="whitespace-nowrap">
                        <span className="font-bold text-primary font-mono text-[13px] tracking-tight">
                          {order.transferNo || "-"}
                        </span>
                      </UITableCell>

                      {/* Source Facility */}
                      <UITableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="size-3.5 text-text-muted shrink-0" />
                          <span className="font-medium text-text truncate">
                            {order.sourceBranchId?.name || "Source Facility"}
                          </span>
                        </div>
                      </UITableCell>

                      {/* Destination Facility */}
                      <UITableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="size-3.5 text-text-muted shrink-0" />
                          <span className="font-medium text-text truncate">
                            {order.destinationBranchId?.name || "Destination Facility"}
                          </span>
                        </div>
                      </UITableCell>

                      {/* Status */}
                      <UITableCell align="center" className="whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </UITableCell>

                      {/* Date */}
                      <UITableCell className="whitespace-nowrap text-text-muted font-medium text-xs">
                        {formatDate(order.createdAt)}
                      </UITableCell>

                      {/* Actions */}
                      <UITableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {canReceive && (
                            <UIButton
                              variant="ghost"
                              size="xs"
                              disabled={receivingId === order._id}
                              onClick={() => handleReceive(order._id)}
                              startIcon={<Check className="size-3.5" />}
                              className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold text-xs"
                            >
                              {receivingId === order._id ? "Receiving..." : "Receive"}
                            </UIButton>
                          )}
                          {canEdit && (
                            <Link
                              to={`/inventory/transfer-orders/${order._id}/edit`}
                              className="p-1.5 text-text-muted hover:text-primary rounded-lg transition-colors"
                              title="Edit Transfer"
                            >
                              <Edit3 className="size-3.5" />
                            </Link>
                          )}
                          <UIButton
                            variant="ghost"
                            size="xs"
                            onClick={() => handleView(order._id)}
                            startIcon={
                              loadingViewId === order._id ? (
                                <RefreshCw className="size-3.5 animate-spin" />
                              ) : (
                                <Eye className="size-3.5" />
                              )
                            }
                            className="text-text-muted hover:text-primary"
                          >
                            View
                          </UIButton>
                        </div>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Infinite Scroll Trigger */}
          {!isLoading && transferOrders.length > 0 && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                !hasMore && transferOrders.length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none">
                    ✓ All {totalOrders} matching transfer orders loaded
                  </span>
                ) : null
              }
            />
          )}
        </UITableScrollArea>
      </div>

      {/* ── View Details Modal ──────────────────────────────────────────────── */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden text-text font-sans">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface-alt/50">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-text">Transfer Order Details</h3>
                <p className="text-xs text-primary font-mono font-semibold mt-0.5">{viewingOrder.transferNo}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingOrder(null)}
                className="p-1.5 hover:bg-surface-hover rounded-xl text-text-muted hover:text-text transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-surface-alt/70 p-3 rounded-xl border border-border">
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">Source Facility</p>
                  <p className="text-xs sm:text-sm font-semibold text-text truncate">{viewingOrder.sourceBranchId?.name}</p>
                </div>
                <div className="bg-surface-alt/70 p-3 rounded-xl border border-border">
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">Destination Facility</p>
                  <p className="text-xs sm:text-sm font-semibold text-text truncate">{viewingOrder.destinationBranchId?.name}</p>
                </div>
                <div className="bg-surface-alt/70 p-3 rounded-xl border border-border">
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">Status</p>
                  <div>{getStatusBadge(viewingOrder.status)}</div>
                </div>
                <div className="bg-surface-alt/70 p-3 rounded-xl border border-border">
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">Created At</p>
                  <p className="text-xs font-mono font-medium text-text">{new Date(viewingOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {viewingOrder.status === "CANCELLED" && (
                <div className="bg-error/10 border border-error/20 rounded-xl p-3.5 text-xs text-error flex items-start gap-2.5">
                  <XCircle className="size-4 shrink-0 text-error mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-error">Transfer Order Cancelled</p>
                    <p className="text-[11px] text-error/90 mt-0.5">
                      This order was cancelled and inventory quantities were automatically restored to {viewingOrder.sourceBranchId?.name || "the source facility"}.
                    </p>
                    {viewingOrder.cancelledAt && (
                      <p className="text-[10px] font-mono text-error/75 mt-1">
                        Cancelled on {new Date(viewingOrder.cancelledAt).toLocaleString()}
                        {viewingOrder.cancelledBy?.name ? ` by ${viewingOrder.cancelledBy.name}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {viewingOrder.remarks && (
                <div>
                  <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Remarks</h4>
                  <div className="bg-surface-alt/70 p-3 rounded-xl border border-border text-xs text-text">
                    {viewingOrder.remarks}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-text uppercase tracking-wider mb-2">Transfer Items</h4>
                <div className="border border-border rounded-xl overflow-hidden bg-surface">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-alt/80 border-b border-border text-[11px] text-text-muted uppercase tracking-wider">
                        <th className="p-3 font-semibold">Product</th>
                        <th className="p-3 font-semibold">Batch No</th>
                        <th className="p-3 font-semibold text-right">Transfer Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {viewingOrder.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-surface-hover/50 transition-colors">
                          <td className="p-3 font-medium text-text">{item.product?.name || "Product"}</td>
                          <td className="p-3 text-text-muted font-mono">{item.batchNo}</td>
                          <td className="p-3 text-text font-bold text-right font-mono tabular-nums">{item.transferQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-surface-alt/40 mt-auto">
              <div>
                {(viewingOrder.status === "IN_TRANSIT" || viewingOrder.status === "PENDING") && (
                  <UIButton
                    type="button"
                    variant="destructive"
                    size="sm"
                    startIcon={<Ban className="size-3.5" />}
                    onClick={() => handleOpenCancelConfirm(viewingOrder)}
                    disabled={isCancelling}
                    className="font-semibold shadow-2xs hover:bg-error-hover"
                  >
                    Cancel Transfer Order
                  </UIButton>
                )}
              </div>
              <div className="flex items-center gap-2">
                <UIButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewingOrder(null)}
                >
                  Close
                </UIButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Order Confirmation Warning Dialog ────────────────────────── */}
      <UIConfirmDialog
        isOpen={cancelConfirmOpen}
        onClose={() => {
          if (!isCancelling) {
            setCancelConfirmOpen(false);
            setOrderToCancel(null);
          }
        }}
        onConfirm={handleCancelOrder}
        intent="danger"
        icon={<AlertTriangle className="size-6 text-error" />}
        title="Cancel Transfer Order?"
        description="Are you sure you want to cancel this transfer order? This action cannot be undone. All deducted inventory quantities will be immediately restored back into the source facility's stock."
        itemName={orderToCancel ? `Transfer Order: ${orderToCancel.transferNo}` : undefined}
        itemDetails={
          orderToCancel
            ? `Source Facility: ${orderToCancel.sourceBranchId?.name || "Source Facility"} (${orderToCancel.items?.length || 0} item(s) to restore)`
            : undefined
        }
        confirmText="Yes, Cancel Order"
        cancelText="Keep Order"
        isLoading={isCancelling}
      />
    </div>
  );
};

export default TransferOrdersPage;
