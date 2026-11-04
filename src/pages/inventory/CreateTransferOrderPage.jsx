// src/pages/inventory/CreateTransferOrderPage.jsx

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Building2,
  Lock,
  Package,
  Boxes,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Search,
  RefreshCw,
  FileText,
  Truck,
  Plus,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { uiToast as toast } from "@/components/ui";
import useBranch from "../../features/branch/hooks/useBranch";
import useCompany from "../../features/company/hooks/useCompany";
import transferOrderService from "../../features/transfer-order/services/transferOrderService";
import workspaceProductService from "../../features/workspace-products/services/workspaceProductService";

import {
  WorkspaceProductSearchBar,
  WorkspaceProductBatchSelectorModal,
} from "@/features/workspace-products/components";

const CreateTransferOrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const prefilledState = location.state || null;
  const isPrefilledScrap = prefilledState?.transferType === "SCRAP";
  const [isScrapOrder, setIsScrapOrder] = useState(isPrefilledScrap);

  const { currentCompany } = useCompany();
  const { currentBranch, branches = [], getCompanyBranches } = useBranch();

  const [loadingOrder, setLoadingOrder] = useState(isEditMode);
  const [existingOrder, setExistingOrder] = useState(null);

  // Source facility is strictly locked to current active branch (or source branch of existing order)
  const sourceBranchId = existingOrder?.sourceBranchId?._id || currentBranch?._id || "";
  const [destinationBranchId, setDestinationBranchId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  // Prefill items from location.state (e.g. from Expired & Scrap Register)
  const prefilledLoadedRef = useRef(false);
  useEffect(() => {
    if (!isEditMode && prefilledState?.prefilledItems && !prefilledLoadedRef.current) {
      prefilledLoadedRef.current = true;
      if (
        prefilledState.sourceBranchId &&
        currentBranch?._id &&
        String(prefilledState.sourceBranchId) !== String(currentBranch._id)
      ) {
        toast.error(
          "Items were prefilled for another branch. Transfer orders can only be created from your current active branch."
        );
        navigate("/inventory/transfer-orders");
        return;
      }
      setItems(prefilledState.prefilledItems);
      if (prefilledState.transferType === "SCRAP") {
        setIsScrapOrder(true);
        setRemarks(prefilledState.remarks || "Quarantined scrap & expired stock transfer to store");
      }
      toast.info(`Prefilled ${prefilledState.prefilledItems.length} quarantined items for transfer.`);
    }
  }, [isEditMode, prefilledState, currentBranch?._id, navigate]);

  // Search & Batch Modal State
  const [searchQuery, setSearchQuery] = useState("");
  const searchBarRef = useRef(null);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [selectedProductForBatches, setSelectedProductForBatches] = useState(null);

  // Fetch branches on mount
  useEffect(() => {
    if (getCompanyBranches) {
      getCompanyBranches().catch(() => {});
    }
  }, [getCompanyBranches]);

  // Load existing order if in edit mode
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const loadOrder = async () => {
      try {
        setLoadingOrder(true);
        const res = await transferOrderService.getTransferOrderById(id);
        const order = res?.data?.data || res?.data;
        if (!isMounted) return;

        if (!order) {
          toast.error("Transfer order not found");
          navigate("/inventory/transfer-orders");
          return;
        }

        if (order.status !== "IN_TRANSIT" && order.status !== "PENDING") {
          toast.error(`Cannot edit a transfer order with status: ${order.status}`);
          navigate("/inventory/transfer-orders");
          return;
        }

        setExistingOrder(order);
        setIsScrapOrder(order.transferType === "SCRAP");
        setDestinationBranchId(
          order.destinationBranchId?._id || order.destinationBranchId || ""
        );
        setRemarks(order.remarks || "");

        const mappedItems = (order.items || []).map((item) => ({
          product: item.product?._id || item.product,
          productName: item.product?.name || "Product",
          batch: item.batch?._id || item.batch,
          batchNo: item.batchNo,
          originalBatchNo: item.originalBatchNo || item.batchNo,
          scrapType: item.scrapType || (order.transferType === "SCRAP" ? "EXPIRED" : "NONE"),
          isScrap: order.transferType === "SCRAP" || (item.scrapType && item.scrapType !== "NONE"),
          transferQty: item.transferQty,
          availableQty: 99999,
        }));
        setItems(mappedItems);
      } catch (err) {
        console.error("Failed to load transfer order:", err);
        toast.error("Failed to load transfer order details");
        navigate("/inventory/transfer-orders");
      } finally {
        if (isMounted) setLoadingOrder(false);
      }
    };

    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  // Destination facilities: strictly EXCLUDE current active branch
  const destinationBranches = useMemo(() => {
    if (!branches || !Array.isArray(branches)) return [];
    return branches.filter(
      (b) => b._id !== sourceBranchId && b.status !== "inactive"
    );
  }, [branches, sourceBranchId]);

  // If destination matches current branch, clear it
  useEffect(() => {
    if (destinationBranchId && destinationBranchId === sourceBranchId) {
      setDestinationBranchId("");
    }
  }, [destinationBranchId, sourceBranchId]);

  // If user switches active branch from top header while drafting new order, reset items & destination
  const prevBranchRef = useRef(currentBranch?._id);
  useEffect(() => {
    if (!isEditMode && prevBranchRef.current && prevBranchRef.current !== currentBranch?._id) {
      setItems([]);
      setDestinationBranchId("");
      toast.info("Active facility changed. Staged products were reset to match new facility.");
    }
    prevBranchRef.current = currentBranch?._id;
  }, [currentBranch?._id, isEditMode]);

  const destinationBranch = useMemo(() => {
    return destinationBranches.find((b) => b._id === destinationBranchId);
  }, [destinationBranches, destinationBranchId]);

  // Total metrics
  const totalItemsCount = items.length;
  const totalUnitsCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.transferQty) || 0), 0);
  }, [items]);

  const handleSelectWorkspaceProduct = async (prod, details) => {
    const p = details || prod;
    if (!sourceBranchId) {
      toast.error("Active facility not detected. Please select a facility first.");
      setSearchQuery("");
      searchBarRef.current?.clear?.();
      return;
    }

    // Fetch batches for this product specifically from the source branch
    try {
      const prodId = p._id || p.id;
      const res = await workspaceProductService.getProductFacilityBatchesByQueryV2({
        page: 1,
        limit: 50,
        filters: { facility: sourceBranchId, inStockOnly: true, product: prodId },
      });
      const fetchedBatches =
        res?.data?.data?.batches || res?.data?.batches || res?.data?.data || [];

      if (fetchedBatches.length === 0) {
        toast.error(`No stock available for "${p.name || p.displayName}" in ${currentBranch?.name || "current facility"}.`);
        setSearchQuery("");
        searchBarRef.current?.clear?.();
        return;
      }

      // Ensure properties align with what the BatchSelectorModal expects
      const mappedBatches = fetchedBatches.map((b) => ({
        ...b,
        productId: prodId,
        productName: p.name || p.displayName,
        stock: b.qty || b.stock,
      }));

      setSelectedProductForBatches({ ...p, facilityBatches: mappedBatches });
      setIsBatchModalOpen(true);
      setSearchQuery("");
      searchBarRef.current?.clear?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to load batches for the selected product.");
    }
  };

  const handleConfirmAddBatchToCart = (itemsToAdd) => {
    const list = Array.isArray(itemsToAdd) ? itemsToAdd : [itemsToAdd];
    if (list.length === 0) return;

    setItems((prev) => {
      let updatedItems = [...prev];
      list.forEach((item) => {
        // Prevent duplicate batches
        if (updatedItems.find((i) => i.batch === item.batchId)) {
          toast.error(`Batch ${item.batch || item.batchNo} is already in the transfer list`);
          return;
        }
        updatedItems.push({
          product: item.productId,
          productName: item.name || item.productName || "Unknown Product",
          batch: item.batchId,
          batchNo: item.batch || item.batchNo,
          availableQty: item.stock || item.qty || 0,
          transferQty: item.qty || 1,
        });
      });
      return updatedItems;
    });
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllItems = () => {
    if (window.confirm("Remove all staged products from this transfer order?")) {
      setItems([]);
    }
  };

  const handleQtyChange = (index, val) => {
    const newItems = [...items];
    const qty = parseInt(val, 10) || 0;
    if (newItems[index].availableQty && qty > newItems[index].availableQty) {
      toast.error(`Transfer quantity cannot exceed available stock (${newItems[index].availableQty})`);
      newItems[index].transferQty = newItems[index].availableQty;
    } else {
      newItems[index].transferQty = qty;
    }
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceBranchId) {
      return toast.error("Active facility not identified. Please refresh or select a facility.");
    }
    if (currentBranch?._id && String(sourceBranchId) !== String(currentBranch._id)) {
      return toast.error("Transfer orders can only be dispatched from your current active branch.");
    }
    if (!destinationBranchId) {
      return toast.error("Please select a destination facility.");
    }
    if (sourceBranchId === destinationBranchId) {
      return toast.error("Source and destination facility cannot be the same.");
    }
    if (items.length === 0) {
      return toast.error("Add at least one product batch to transfer.");
    }

    if (items.some((i) => !i.transferQty || i.transferQty <= 0)) {
      return toast.error("All item quantities must be greater than 0.");
    }

    try {
      setSubmitting(true);
      const payload = {
        destinationBranchId,
        transferType: isScrapOrder ? "SCRAP" : "STANDARD",
        remarks: remarks.trim(),
        items: items.map((i) => ({
          product: i.product,
          batch: i.batch,
          batchNo: i.batchNo,
          originalBatchNo: i.originalBatchNo || i.batchNo,
          scrapType: i.scrapType || (isScrapOrder ? "EXPIRED" : "NONE"),
          transferQty: i.transferQty,
        })),
      };

      if (isEditMode) {
        await transferOrderService.updateTransferOrder(id, payload);
        toast.success("Transfer order updated successfully!");
      } else {
        await transferOrderService.createTransferOrder({
          companyId: currentCompany?._id,
          branchId: sourceBranchId,
          sourceBranchId,
          ...payload,
        });
        toast.success(
          isScrapOrder
            ? "Quarantined scrap transfer order dispatched successfully!"
            : "Transfer order created successfully!"
        );
      }

      navigate("/inventory/transfer-orders");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          (isEditMode
            ? "Failed to update transfer order"
            : "Failed to create transfer order")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3 text-text-muted font-sans">
        <RefreshCw className="size-7 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading transfer order details...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-bg min-h-full px-4 sm:px-6 py-6 space-y-6 text-text font-sans transition-colors">
      {/* ── 1. Top Header & Navigation ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/inventory/transfer-orders")}
            className="p-2 rounded-xl border border-border bg-surface hover:bg-surface-hover text-text-muted hover:text-text transition-colors shadow-2xs"
            title="Back to Transfer Orders"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-text">
                {isEditMode
                  ? `Edit Transfer Order ${existingOrder?.transferNo ? `(${existingOrder.transferNo})` : ""}`
                  : isScrapOrder
                  ? "Dispatch Scrap Stock Transfer"
                  : "Create Transfer Order"}
              </h1>
              {isScrapOrder ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <Trash2 className="size-3" />
                  Quarantined Scrap Mode
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  <Truck className="size-3" />
                  {isEditMode ? "Edit Mode" : "Inter-Facility"}
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {isEditMode
                ? "Modify destination branch, remarks, or transfer quantities"
                : isScrapOrder
                ? "Dispatch damaged or expired scrap inventory directly to target branch's scrap bin"
                : "Dispatch inventory batches from your current facility to a target branch"}
            </p>
          </div>
        </div>

        {/* Quick summary status badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-text-muted shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Origin: <strong className="text-text font-semibold">{currentBranch?.name || "Active Facility"}</strong></span>
          </div>
        </div>
      </div>

      {/* ── 2. Visual Transfer Route Card ─────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Source Facility (LOCKED to Current Branch) */}
          <div className="flex-1 bg-surface-alt/70 dark:bg-surface-alt/40 rounded-xl p-3.5 border border-border flex items-start gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Building2 className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Source Facility (Origin)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
                  <Lock className="size-2.5" />
                  Active Branch Only
                </span>
              </div>
              <div className="text-base font-bold text-text truncate mt-1">
                {currentBranch?.name || "Active Facility"}
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                <span className="px-1.5 py-0.2 rounded bg-surface border border-border text-[11px]">
                  {currentBranch?.type || "Facility"}
                </span>
                {currentBranch?.code && (
                  <span className="font-mono text-[11px]">Code: {currentBranch.code}</span>
                )}
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  • Dispatches Outward
                </span>
              </div>
            </div>
          </div>

          {/* Directional Indicator */}
          <div className="flex items-center justify-center shrink-0 py-1 lg:py-0">
            <div className="size-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-2xs">
              <ArrowRight className="size-4.5" />
            </div>
          </div>

          {/* Destination Facility (Dropdown with Current Branch Removed) */}
          <div className="flex-1 bg-surface-alt/70 dark:bg-surface-alt/40 rounded-xl p-3.5 border border-border flex items-start gap-3">
            <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Truck className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="destinationBranchSelect"
                  className="text-[11px] font-bold text-text-muted uppercase tracking-wider block"
                >
                  Destination Facility (Target) *
                </label>
              </div>

              {destinationBranches.length > 0 ? (
                <div className="mt-1">
                  <select
                    id="destinationBranchSelect"
                    value={destinationBranchId}
                    onChange={(e) => setDestinationBranchId(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm font-semibold text-text bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer"
                  >
                    <option value="" className="text-text-muted">
                      -- Select Target Branch --
                    </option>
                    {destinationBranches.map((b) => (
                      <option key={b._id} value={b._id} className="text-text">
                        {b.name} {b.type ? `(${b.type})` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-text-muted mt-1">
                    Current branch ({currentBranch?.name}) is excluded to prevent circular transfers.
                  </p>
                </div>
              ) : (
                <div className="mt-1 p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>No other facilities available in this company to receive inventory.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quarantined Scrap Notice Banner */}
      {isScrapOrder && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="size-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-amber-900 dark:text-amber-100">
              Quarantined Stock Transfer Mode
            </div>
            <p className="leading-relaxed text-text-muted">
              These items are drawn from your current branch's quarantined scrap bin or shelf-expired inventory.
              Upon dispatch and receipt at the destination store, they will be credited strictly to the destination facility's
              <strong> scrap bin</strong> and remain isolated from sellable stock.
            </p>
          </div>
        </div>
      )}

      {/* ── 3. Main Form Section (2-Column Grid) ─────────────────────────── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Search & Staged Items Table (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Product Search Card */}
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-text flex items-center gap-2">
                  <Package className="size-4 text-primary" />
                  Select Products to Transfer
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {isScrapOrder
                    ? "Items prefilled from Expired & Scrap Register. Search below if you need to add more items."
                    : `Search medicines and inventory available at ${currentBranch?.name || "current facility"}`}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-alt border border-border text-text">
                {totalItemsCount} {totalItemsCount === 1 ? "batch" : "batches"} staged
              </span>
            </div>

            <div className="relative">
              <WorkspaceProductSearchBar
                ref={searchBarRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSelectProduct={handleSelectWorkspaceProduct}
                branchId={sourceBranchId || null}
                placeholder="Search catalog by medicine name, barcode, salt, or SKU..."
              />
            </div>
          </div>

          {/* Staged Transfer Items Table Card */}
          <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs transition-colors">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Boxes className="size-4.5 text-primary" />
                <h3 className="text-sm font-bold text-text">
                  Transfer Manifest Items
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {totalItemsCount}
                </span>
              </div>

              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllItems}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  Clear List
                </button>
              )}
            </div>

            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-alt border-b border-border text-[11px] font-bold text-text-muted uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Batch Number</th>
                      {isScrapOrder && <th className="py-3 px-4">Quarantine Type</th>}
                      <th className="py-3 px-4 text-right">Available Stock</th>
                      <th className="py-3 px-4 text-right w-36">Transfer Qty</th>
                      <th className="py-3 px-4 text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs text-text">
                    {items.map((item, index) => (
                      <tr key={item.batch} className="hover:bg-surface-hover/60 transition-colors">
                        <td className="py-3.5 px-4 text-center text-text-muted font-mono font-medium">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-text text-sm">
                            {item.productName}
                          </div>
                          <div className="text-[11px] text-text-muted mt-0.5">
                            Batch ID: <span className="font-mono">{item.batch?.slice(-6) || "-"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-surface-alt border border-border text-text">
                            {item.batchNo}
                          </span>
                        </td>
                        {isScrapOrder && (
                          <td className="py-3.5 px-4">
                            {item.scrapType === "BROKEN" || item.category === "broken" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                                Broken Return
                              </span>
                            ) : item.scrapType === "EXPIRED" || item.category === "scrap_expired" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                Expired Return
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                                Shelf Expired
                              </span>
                            )}
                          </td>
                        )}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-semibold text-text font-mono">
                            {item.availableQty}
                          </span>
                          <span className="text-[11px] text-text-muted ml-1">units</span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              min="1"
                              max={item.availableQty}
                              value={item.transferQty}
                              onChange={(e) => handleQtyChange(index, e.target.value)}
                              className="w-24 px-2.5 py-1.5 text-right font-bold text-sm font-mono border border-border bg-surface text-text rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                            />
                            <button
                              type="button"
                              onClick={() => handleQtyChange(index, item.availableQty)}
                              title="Set to max available stock"
                              className="px-1.5 py-1 text-[10px] font-bold text-primary hover:bg-primary/10 rounded transition-colors"
                            >
                              MAX
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                <div className="size-14 rounded-2xl bg-surface-alt border border-border flex items-center justify-center text-text-muted mb-3 shadow-2xs">
                  <Boxes className="size-7 stroke-[1.5]" />
                </div>
                <h4 className="text-sm font-bold text-text">No Products Staged for Transfer</h4>
                <p className="text-xs text-text-muted max-w-sm mt-1">
                  Use the product search bar above to look up medicines and select batches available at {currentBranch?.name || "this branch"}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Details, Notes & Submit (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5 sticky top-24">
          <div className="bg-surface rounded-2xl border border-border p-5 shadow-xs transition-colors space-y-4">
            <h3 className="text-sm font-bold text-text flex items-center gap-2 pb-3 border-b border-border">
              <FileText className="size-4 text-primary" />
              Transfer Summary
            </h3>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface-alt border border-border">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                  Total Items
                </span>
                <span className="text-xl font-bold font-mono text-text mt-0.5 block">
                  {totalItemsCount}
                </span>
                <span className="text-[10px] text-text-muted">Unique Batches</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-alt border border-border">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                  Total Units
                </span>
                <span className="text-xl font-bold font-mono text-primary mt-0.5 block">
                  {totalUnitsCount}
                </span>
                <span className="text-[10px] text-text-muted">Stock Quantity</span>
              </div>
            </div>

            {/* Route Summary */}
            <div className="p-3 rounded-xl bg-surface-alt/70 border border-border text-xs space-y-2">
              <div className="flex items-center justify-between text-text-muted">
                <span>From (Origin):</span>
                <strong className="text-text">{currentBranch?.name || "Active Facility"}</strong>
              </div>
              <div className="flex items-center justify-between text-text-muted">
                <span>To (Target):</span>
                <strong className={destinationBranch ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-amber-600"}>
                  {destinationBranch ? destinationBranch.name : "Not selected"}
                </strong>
              </div>
            </div>

            {/* Remarks / Notes */}
            <div className="space-y-1.5">
              <label htmlFor="transferRemarks" className="text-xs font-semibold text-text block">
                Transfer Remarks & Notes
              </label>
              <textarea
                id="transferRemarks"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g., Stock rebalancing request, urgent store replenishment, etc."
                className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none text-text placeholder:text-text-muted/60"
              />
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={submitting || items.length === 0 || !destinationBranchId}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  <span>
                    {isEditMode
                      ? "Updating Transfer Order..."
                      : isScrapOrder
                      ? "Dispatching Scrap Transfer..."
                      : "Creating Transfer Order..."}
                  </span>
                </>
              ) : (
                <>
                  <ArrowRight className="size-4" />
                  <span>
                    {isEditMode
                      ? "Save Changes"
                      : isScrapOrder
                      ? "Dispatch Scrap Transfer"
                      : "Dispatch Transfer Order"}
                  </span>
                </>
              )}
            </button>

            {/* Helper tips */}
            <div className="flex items-start gap-2 pt-2 text-[11px] text-text-muted">
              <ShieldCheck className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {isEditMode
                  ? "Changes to items will automatically recalculate and adjust inventory stock in the source facility."
                  : "Inventory will be placed in transit status and deducted from origin stock upon order creation."}
              </span>
            </div>
          </div>
        </div>
      </form>

      {/* Batch Selection Modal (Reused from Sales POS) */}
      <WorkspaceProductBatchSelectorModal
        open={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        product={selectedProductForBatches}
        billingMode={"B2B"}
        branchName={currentBranch?.name || "Current Facility"}
        onConfirmAddToCart={handleConfirmAddBatchToCart}
      />
    </div>
  );
};

export default CreateTransferOrderPage;
