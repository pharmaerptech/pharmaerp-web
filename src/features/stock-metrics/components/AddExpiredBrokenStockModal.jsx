// src/features/stock-metrics/components/AddExpiredBrokenStockModal.jsx

import { useState, useRef, useCallback } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Package,
  X,
  Loader2,
  Building2,
  PackageMinus,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
  UIButton,
  UIInput,
  UIBadge,
} from "@/components/ui";
import { WorkspaceProductSearchBar } from "@/components";
import { cn } from "@/lib/utils";
import useBranch from "@/features/branch/hooks/useBranch";
import useUser from "@/features/user/hooks/useUser";
import workspaceProductService from "@/features/workspace-products/services/workspaceProductService";

/**
 * Format expiry date into MM/YY display
 */
const formatExpDisplay = (raw) => {
  if (!raw) return "N/A";
  const str = String(raw).trim();
  if (!str) return "N/A";
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 2) {
      const m = parts[0].padStart(2, "0");
      let y = parts[1];
      if (y.length === 4) y = y.slice(-2);
      return `${m}/${y}`;
    }
    return str;
  }
  if (str.includes("-")) {
    const parts = str.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[1].padStart(2, "0")}/${parts[0].slice(-2)}`;
      }
    }
    return str;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const y = String(d.getFullYear()).slice(-2);
    return `${m}/${y}`;
  }
  return str;
};

/**
 * Format currency in Indian locale
 */
const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Extract Mongo ID safely
 */
const extractId = (val) => {
  if (!val) return "";
  if (typeof val === "object") {
    return String(val._id || val.id || "").trim();
  }
  return String(val).trim();
};

export const AddExpiredBrokenStockModal = ({
  open,
  isOpen: controlledIsOpen,
  onClose,
  onSuccess,
}) => {
  const isModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : open;

  const { currentBranch } = useBranch();
  const { activeBranchId: userBranchId, activeCompanyId } = useUser();
  const activeBranchId = currentBranch?._id || currentBranch?.id || userBranchId;
  const currentBranchName = currentBranch?.name || "Active Facility";

  // Form states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [batches, setBatches] = useState([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [reason, setReason] = useState("EXPIRED"); // "EXPIRED" | "BROKEN" | "FRESH_RETURN"
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchBarRef = useRef(null);

  // Clean form reset & close
  const handleClose = useCallback(() => {
    setSelectedProduct(null);
    setBatches([]);
    setSelectedBatch(null);
    setReason("EXPIRED");
    setQuantity("");
    setRemarks("");
    setError(null);
    setIsSubmitting(false);
    onClose?.();
  }, [onClose]);

  // Fetch batches when a product is selected
  const fetchBatchesForProduct = useCallback(
    async (prod) => {
      if (!prod) return;
      setIsLoadingBatches(true);
      setSelectedBatch(null);
      setQuantity("");
      setError(null);

      try {
        const prodId = extractId(prod._id || prod.id);
        const branchFilter = extractId(activeBranchId);

        const res = await workspaceProductService.getProductFacilityBatchesByQueryV2({
          filters: {
            product: prodId,
            ...(branchFilter ? { facility: branchFilter } : {}),
            inStockOnly: false, // Include all active batches so fresh returns can restock empty batches
          },
          companyId: activeCompanyId,
          limit: 50,
        });

        const rawList =
          res.data?.data?.batches ||
          res.data?.batches ||
          res.data?.data ||
          [];

        // Only keep batches that are regular shelf batches (not scrap batches)
        const validShelfBatches = rawList.filter((b) => {
          const isScrap = b.scrapType && b.scrapType !== "NONE";
          return !isScrap;
        });

        // Sort with positive shelf stock first
        validShelfBatches.sort((a, b) => {
          const qtyA = Number(a.batchQty ?? a.stock ?? a.qoh ?? 0);
          const qtyB = Number(b.batchQty ?? b.stock ?? b.qoh ?? 0);
          return qtyB - qtyA;
        });

        setBatches(validShelfBatches);

        // If only 1 batch exists, auto-select it for efficiency
        if (validShelfBatches.length === 1) {
          setSelectedBatch(validShelfBatches[0]);
        }
      } catch (err) {
        console.error("Failed to load batches for product:", err);
        setError("Failed to load batches for this product in current branch.");
      } finally {
        setIsLoadingBatches(false);
      }
    },
    [activeBranchId, activeCompanyId]
  );

  const handleSelectProduct = (prod, details) => {
    const targetProduct = details || prod;
    if (!targetProduct) return;
    setSelectedProduct(targetProduct);
    fetchBatchesForProduct(targetProduct);
  };

  const handleClearSelectedProduct = () => {
    setSelectedProduct(null);
    setBatches([]);
    setSelectedBatch(null);
    setQuantity("");
    setError(null);
    setTimeout(() => {
      searchBarRef.current?.focus?.();
    }, 100);
  };

  const handleSelectBatch = (batch) => {
    setSelectedBatch(batch);
    setQuantity("");
    setError(null);
  };

  const isFreshReturn = reason === "FRESH_RETURN";

  const numQuantity = Number(quantity) || 0;
  const availableBatchQty = selectedBatch
    ? Number(selectedBatch.batchQty ?? selectedBatch.stock ?? selectedBatch.qoh ?? 0)
    : 0;

  const isQtyExceeded = numQuantity > availableBatchQty;

  const isValidForm =
    Boolean(selectedProduct) &&
    Boolean(selectedBatch) &&
    numQuantity > 0 &&
    !isQtyExceeded &&
    !isSubmitting;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedProduct) {
      setError("Please select a product first.");
      return;
    }
    if (!selectedBatch) {
      setError("Please select a batch from the available batches.");
      return;
    }
    if (numQuantity <= 0) {
      setError("Please enter a valid quantity greater than 0.");
      return;
    }
    if (isQtyExceeded) {
      setError(
        `Quantity (${numQuantity}) exceeds available stock (${availableBatchQty}) in batch ${selectedBatch.batchNo}.`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const prodId = extractId(selectedProduct._id || selectedProduct.id);
      const batchId = extractId(selectedBatch._id || selectedBatch.id);

      const res = await workspaceProductService.addExpiredBrokenStock({
        branchId: activeBranchId,
        productId: prodId,
        batchId: batchId,
        quantity: numQuantity,
        reason: reason,
        destination: "SCRAP",
        deductFromShelf: true,
        remarks: remarks.trim(),
      });

      const responseData = res.data?.data || res.data;

      onSuccess?.({
        product: selectedProduct,
        batch: selectedBatch,
        quantity: numQuantity,
        reason,
        destination: "SCRAP",
        response: responseData,
      });

      handleClose();
    } catch (err) {
      console.error("Stock adjustment failed:", err);
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to mark stock. Please verify the entered details and try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UIModal
      open={isModalOpen}
      onClose={isSubmitting ? undefined : handleClose}
      size="xl"
      className="max-w-2xl"
    >
      <UIModalHeader>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "size-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
              reason === "BROKEN"
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                : reason === "FRESH_RETURN"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            )}
          >
            <PackageMinus className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <UIModalTitle className="text-base sm:text-lg font-bold text-text">
                Add Expired / Broken / Return Stock
              </UIModalTitle>
              <UIBadge
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex items-center gap-1 border-border/70 text-[10.5px]"
              >
                <Building2 className="size-3 text-text-muted" />
                {currentBranchName}
              </UIBadge>
            </div>
            <UIModalDescription className="text-xs text-text-muted mt-0.5">
              Record stock adjustments: quarantine damaged or expired stock, or ingest fresh returned medicine directly into inventory.
            </UIModalDescription>
          </div>
        </div>
      </UIModalHeader>

      <UIModalBody className="space-y-4 max-h-[75vh] overflow-y-auto px-5 py-4">
        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-error-soft text-error border border-error/20 flex items-start gap-2.5 text-xs">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{error}</div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-error/70 hover:text-error transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* ── STEP 1: PRODUCT SEARCH & SELECTION ────────────────────────── */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text flex items-center justify-between">
            <span>
              1. Search & Select Product <span className="text-rose-500">*</span>
            </span>
            {selectedProduct && (
              <button
                type="button"
                onClick={handleClearSelectedProduct}
                className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <RefreshCw className="size-3" />
                Change Product
              </button>
            )}
          </label>

          {!selectedProduct ? (
            <div className="relative h-54">
              <WorkspaceProductSearchBar
                ref={searchBarRef}
                branchId={activeBranchId}
                onSelectProduct={handleSelectProduct}
                placeholder="Scan barcode or search medicine by name, brand, SKU..."
                size="md"
                autoFocus
                showDetailsPreview
              />
              <p className="text-[11px] text-text-muted mt-1.5 flex items-center gap-1">
                <Package className="size-3 text-text-muted/70" />
                Type product name to search across the catalog with branch batches.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-lg bg-surface border border-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Package className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs sm:text-sm text-text truncate">
                    {typeof selectedProduct.name === "object"
                      ? selectedProduct.name?.name
                      : selectedProduct.name || selectedProduct.displayName}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-text-muted truncate mt-0.5">
                    {selectedProduct.sku && (
                      <span className="font-mono">{selectedProduct.sku}</span>
                    )}
                    {selectedProduct.manufacturer && (
                      <span>
                        •{" "}
                        {typeof selectedProduct.manufacturer === "object"
                          ? selectedProduct.manufacturer?.name
                          : selectedProduct.manufacturer}
                      </span>
                    )}
                    {selectedProduct.pack && (
                      <span>• {selectedProduct.pack}</span>
                    )}
                  </div>
                </div>
              </div>
              <UIButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSelectedProduct}
                className="h-8 px-2 text-xs text-text-muted hover:text-text shrink-0"
              >
                <X className="size-3.5 mr-1" />
                Change
              </UIButton>
            </div>
          )}
        </div>

        {/* ── STEP 2: BATCH SELECTION ──────────────────────────────────── */}
        {selectedProduct && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text">
                2. Select Batch <span className="text-rose-500">*</span>
              </label>
              {batches.length > 0 && (
                <span className="text-[11px] text-text-muted font-mono">
                  {batches.length} registered {batches.length === 1 ? "batch" : "batches"}
                </span>
              )}
            </div>

            {isLoadingBatches ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-text-muted">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="text-xs">Fetching facility batches...</span>
              </div>
            ) : batches.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border bg-surface-alt/30 text-center text-xs text-text-muted space-y-1">
                <AlertTriangle className="size-5 text-amber-500 mx-auto" />
                <div className="font-medium text-text">No registered shelf batch found</div>
                <div>There are currently no active batches registered for this product in {currentBranchName}.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                {batches.map((batch) => {
                  const bId = extractId(batch._id || batch.id);
                  const isSelected = selectedBatch && extractId(selectedBatch._id || selectedBatch.id) === bId;
                  const qty = Number(batch.batchQty ?? batch.stock ?? batch.qoh ?? 0);
                  const mrpValue = batch.mrp ?? batch.MRP ?? 0;

                  return (
                    <button
                      key={bId || batch.batchNo}
                      type="button"
                      onClick={() => handleSelectBatch(batch)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5",
                        isSelected
                          ? "border-primary bg-primary/10 text-text ring-1 ring-primary/40 shadow-2xs"
                          : "border-border bg-surface hover:bg-surface-alt/60 text-text"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs truncate">
                            {batch.batchNo}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px] text-text-muted mt-0.5">
                          <span>
                            Exp:{" "}
                            <strong className="text-text font-mono font-normal">
                              {formatExpDisplay(batch.expiryDate)}
                            </strong>
                          </span>
                          {mrpValue > 0 && (
                            <span>
                              MRP: ₹{formatCurrency(mrpValue)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-text-muted block">Available</span>
                        <span
                          className={cn(
                            "text-xs font-mono font-bold",
                            qty > 0 ? "text-primary" : "text-text-muted"
                          )}
                        >
                          {qty} units
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: STOCK CLASSIFICATION & ROUTING ────────────────────── */}
        {selectedBatch && (
          <div className="space-y-4 pt-2 border-t border-border">
            {/* Classification Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                3. Stock Classification <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Expired Stock */}
                <button
                  type="button"
                  onClick={() => setReason("EXPIRED")}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5",
                    reason === "EXPIRED"
                      ? "border-amber-500/80 bg-amber-500/10 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500/20 shadow-2xs"
                      : "border-border bg-surface hover:bg-surface-alt text-text opacity-80"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Calendar className="size-4 text-amber-600 dark:text-amber-400" />
                      <span>Expired Stock</span>
                    </div>
                    {reason === "EXPIRED" && (
                      <CheckCircle2 className="size-4 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <p className="text-[10.5px] text-text-muted leading-tight">
                    Stock past expiry date to quarantine in scrap depot.
                  </p>
                </button>

                {/* 2. Broken / Damaged */}
                <button
                  type="button"
                  onClick={() => setReason("BROKEN")}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5",
                    reason === "BROKEN"
                      ? "border-rose-500/80 bg-rose-500/10 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/20 shadow-2xs"
                      : "border-border bg-surface hover:bg-surface-alt text-text opacity-80"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />
                      <span>Broken / Damaged</span>
                    </div>
                    {reason === "BROKEN" && (
                      <CheckCircle2 className="size-4 text-rose-600 dark:text-rose-400" />
                    )}
                  </div>
                  <p className="text-[10.5px] text-text-muted leading-tight">
                    Physically broken, leaking or ruined containers.
                  </p>
                </button>

                {/* 3. General Fresh Return */}
                <button
                  type="button"
                  onClick={() => setReason("FRESH_RETURN")}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5",
                    reason === "FRESH_RETURN"
                      ? "border-emerald-500/80 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20 shadow-2xs"
                      : "border-border bg-surface hover:bg-surface-alt text-text opacity-80"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
                      <span>General Fresh Return</span>
                    </div>
                    {reason === "FRESH_RETURN" && (
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <p className="text-[10.5px] text-text-muted leading-tight">
                    Intact, fresh returned medicine to quarantine in scrap depot.
                  </p>
                </button>
              </div>
            </div>

            {/* Quantity Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text">
                  4. Quantity to Quarantine into Scrap Bin <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-text-muted">
                  Batch available:{" "}
                  <strong className="text-text font-mono font-bold">
                    {availableBatchQty}
                  </strong>{" "}
                  units
                </span>
              </div>
              <div className="flex items-center gap-2">
                <UIInput
                  type="number"
                  min="1"
                  max={availableBatchQty}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity to scrap"
                  className={cn(
                    "font-mono text-sm",
                    isQtyExceeded && "border-rose-500 focus:ring-rose-500"
                  )}
                />
                {availableBatchQty > 0 && (
                  <UIButton
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setQuantity(String(availableBatchQty))}
                    className="h-10 text-xs px-3 font-medium whitespace-nowrap shrink-0"
                  >
                    Max ({availableBatchQty})
                  </UIButton>
                )}
              </div>
              {isQtyExceeded && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="size-3" />
                  Quantity cannot exceed available stock ({availableBatchQty} units).
                </p>
              )}
            </div>

            {/* Optional Remarks */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-muted">
                Audit Remarks / Note (Optional)
              </label>
              <UIInput
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  reason === "FRESH_RETURN"
                    ? "e.g. Customer returned sealed medicine for return"
                    : "e.g. Found damaged during shelf stocktaking"
                }
                size="sm"
                className="text-xs"
              />
            </div>

            {/* Summary Review Card */}
            {numQuantity > 0 && !isQtyExceeded && (
              <div className="p-3.5 rounded-xl border border-border bg-surface-alt/40 space-y-2.5 transition-all">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                  <span className="text-text-muted">Adjustment Summary</span>
                  <UIBadge
                    variant={
                      reason === "BROKEN"
                        ? "error"
                        : reason === "FRESH_RETURN"
                        ? "success"
                        : "warning"
                    }
                    size="sm"
                  >
                    {reason === "FRESH_RETURN" ? "FRESH RETURN" : reason}
                  </UIBadge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="text-[10.5px] text-text-muted">Batch No</div>
                    <div className="font-bold font-mono text-text truncate">
                      {selectedBatch.batchNo}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] text-text-muted">Expiry</div>
                    <div className="font-semibold font-mono text-text">
                      {formatExpDisplay(selectedBatch.expiryDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] text-text-muted">Units to Scrap</div>
                    <div className="font-bold font-mono text-primary">
                      {numQuantity} units
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] text-text-muted">Estimated Loss</div>
                    <div className="font-bold font-mono text-text">
                      ₹
                      {formatCurrency(
                        Number(selectedBatch.mrp || selectedBatch.rate || 0) *
                          numQuantity
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-text-muted">
                  <span>Target Scrap Batch:</span>
                  <span className="font-mono font-semibold text-text">
                    {selectedBatch.batchNo} [{reason === "FRESH_RETURN" ? "FRESH_RETURN" : reason}]
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </UIModalBody>

      <UIModalFooter className="flex items-center justify-end gap-2 px-5 py-3">
        <UIButton
          type="button"
          variant="outline"
          size="md"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </UIButton>

        <UIButton
          type="button"
          variant={reason === "BROKEN" ? "error" : "primary"}
          size="md"
          onClick={handleSubmit}
          disabled={!isValidForm}
          isLoading={isSubmitting}
          startIcon={<CheckCircle2 className="size-4" />}
        >
          Confirm & Move to Scrap
        </UIButton>
      </UIModalFooter>
    </UIModal>
  );
};

export default AddExpiredBrokenStockModal;
