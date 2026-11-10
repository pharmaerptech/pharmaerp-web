// src/features/purchases/pages/desktop/CreatePurchaseReturnDesktopPage.jsx

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Undo2,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Truck,
  Building2,
  Calendar,
  FileText,
  Boxes,
  ShieldCheck,
  Package,
  Receipt,
  X,
  BadgeAlert,
} from "lucide-react";
import {
  UIButton,
  UIBadge,
  uiToast,
} from "@/components/ui";
import { SupplierSearchBar } from "@/features/parties/suppliers/components/SupplierSearchBar";
import purchaseReturnService from "../../services/purchaseReturnService";
import useBranch from "@/features/branch/hooks/useBranch";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const CreatePurchaseReturnDesktopPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentBranch, activeBranchId } = useBranch();

  // Prefilled navigation state (e.g. from Expired & Scrap items page)
  const navState = location.state || {};
  const prefilledItems = navState.prefilledItems || [];
  const initialMotive = navState.returnMotive || "SELLABLE";

  // Form State
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [returnMotive, setReturnMotive] = useState(initialMotive);
  const [settlementType, setSettlementType] = useState("DEBIT_NOTE");
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState(navState.remarks || "");

  // Staged Line Items
  const [items, setItems] = useState([]);

  // Batch Search Autocomplete State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingBatches, setIsSearchingBatches] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize from Prefilled State
  useEffect(() => {
    if (prefilledItems.length > 0) {
      const staged = prefilledItems.map((p, idx) => ({
        id: `prefilled-${idx}-${p.batchId || p.batchNo}`,
        productId: p.productId,
        productName: p.productName || "Product",
        pack: p.pack || "",
        batchId: p.batchId,
        batchNo: p.batchNo,
        expiry: p.expiry || "",
        purchaseBillId: p.purchaseBillId || null,
        purchaseBillNo: p.purchaseBillNo || "",
        sourceBin: p.sourceBin || (returnMotive === "BROKEN" ? "SCRAP_BROKEN" : "SCRAP_EXPIRED"),
        availableQty: Number(p.availableQty || p.returnQty || 1),
        returnQty: Number(p.returnQty || 1),
        rate: Number(p.rate || 0),
        discountPct: Number(p.discountPct || 0),
        gstPct: Number(p.gstPct || 12),
      }));
      setItems(staged);

      // Attempt to auto-set supplier if prefilled items carry supplier info
      if (prefilledItems[0]?.supplierId && !selectedSupplier) {
        setSelectedSupplier({
          _id: prefilledItems[0].supplierId,
          businessName: prefilledItems[0].supplierName || "Supplier",
        });
      }
    }
  }, [prefilledItems]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch batches when searching
  const handleSearchBatches = useCallback(
    async (query) => {
      if (!query || query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearchingBatches(true);
      try {
        const sourceBinFilter =
          returnMotive === "SELLABLE"
            ? "SELLABLE"
            : returnMotive === "EXPIRED"
            ? "EXPIRED"
            : returnMotive === "BROKEN"
            ? "BROKEN"
            : "ALL";

        const res = await purchaseReturnService.getEligibleBatches({
          supplierId: selectedSupplier?._id || undefined,
          branchId: activeBranchId,
          search: query.trim(),
          sourceBin: sourceBinFilter,
          limit: 25,
        });

        const list = res?.data?.data || res?.data || [];
        setSearchResults(list);
        setShowSearchResults(true);
      } catch (err) {
        console.error("Failed to query eligible batches:", err);
      } finally {
        setIsSearchingBatches(false);
      }
    },
    [selectedSupplier, activeBranchId, returnMotive]
  );

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearchBatches(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearchBatches]);

  // Add Batch to Staged Items
  const handleSelectBatch = (b) => {
    // If supplier is not selected yet, auto-select from batch inflow
    if (!selectedSupplier && b.supplier) {
      setSelectedSupplier(b.supplier);
    }

    // Check if batch is already staged
    const existingIndex = items.findIndex((i) => i.batchId === b.batchId);
    if (existingIndex > -1) {
      uiToast.info(`Batch ${b.batchNo} is already in the return list.`);
      setShowSearchResults(false);
      setSearchQuery("");
      return;
    }

    const availableStock =
      returnMotive === "SELLABLE"
        ? b.availableShelfStock
        : returnMotive === "EXPIRED"
        ? b.expiredStock || b.availableScrapStock
        : returnMotive === "BROKEN"
        ? b.brokenStock || b.availableScrapStock
        : b.availableShelfStock || b.availableScrapStock;

    if (availableStock <= 0) {
      uiToast.error(`No stock available in chosen bin for batch ${b.batchNo}.`);
      return;
    }

    const maxReturnable = Math.min(availableStock, b.unreturnedBillQuota || availableStock);

    const newItem = {
      id: `item-${Date.now()}-${b.batchId}`,
      productId: b.productId,
      productName: b.productName,
      pack: b.pack,
      batchId: b.batchId,
      batchNo: b.batchNo,
      expiry: b.expiry,
      purchaseBillId: b.purchaseBillId || null,
      purchaseBillNo: b.purchaseBillNo || "",
      purchaseBillDate: b.purchaseBillDate || "",
      sourceBin:
        returnMotive === "SELLABLE"
          ? "SELLABLE"
          : returnMotive === "BROKEN"
          ? "SCRAP_BROKEN"
          : "SCRAP_EXPIRED",
      availableQty: availableStock,
      maxReturnable,
      returnQty: 1,
      rate: Number(b.rate || 0),
      discountPct: 0,
      gstPct: Number(b.gstPct || 12),
    };

    setItems((prev) => [newItem, ...prev]);
    setSearchQuery("");
    setShowSearchResults(false);
    uiToast.success(`Added ${b.productName} (${b.batchNo}) to return.`);
  };

  // Modify Staged Item
  const handleUpdateItem = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index] };

      if (field === "returnQty") {
        const parsed = parseInt(value, 10);
        item.returnQty = isNaN(parsed) ? 1 : Math.max(1, parsed);
      } else if (field === "rate") {
        item.rate = Math.max(0, parseFloat(value) || 0);
      } else if (field === "discountPct") {
        item.discountPct = Math.min(100, Math.max(0, parseFloat(value) || 0));
      } else if (field === "sourceBin") {
        item.sourceBin = value;
      }

      copy[index] = item;
      return copy;
    });
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedTotals = useMemo(() => {
    let taxableSubtotal = 0;
    let totalGst = 0;

    items.forEach((item) => {
      const qty = Number(item.returnQty) || 0;
      const rate = Number(item.rate) || 0;
      const disc = Number(item.discountPct) || 0;
      const lineGross = qty * rate;
      const lineTaxable = lineGross - lineGross * (disc / 100);
      const lineTax = (lineTaxable * (Number(item.gstPct) || 0)) / 100;

      taxableSubtotal += lineTaxable;
      totalGst += lineTax;
    });

    const rawGrandTotal = taxableSubtotal + totalGst;
    const grandTotal = Math.round(rawGrandTotal);
    const roundOff = grandTotal - rawGrandTotal;

    return {
      taxableSubtotal: Number(taxableSubtotal.toFixed(2)),
      totalGst: Number(totalGst.toFixed(2)),
      roundOff: Number(roundOff.toFixed(2)),
      grandTotal,
    };
  }, [items]);

  // Submit Purchase Return
  const handleSubmitReturn = async () => {
    if (!selectedSupplier?._id) {
      uiToast.error("Please select a supplier to return goods to.");
      return;
    }

    if (items.length === 0) {
      uiToast.error("Please add at least one item to return.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        branchId: activeBranchId,
        supplierId: selectedSupplier._id,
        returnDate,
        returnMotive,
        settlementType,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          pack: i.pack,
          batchId: i.batchId,
          batchNo: i.batchNo,
          expiry: i.expiry,
          purchaseBillId: i.purchaseBillId || undefined,
          purchaseBillNo: i.purchaseBillNo || undefined,
          sourceBin: i.sourceBin,
          returnQty: i.returnQty,
          rate: i.rate,
          discountPct: i.discountPct,
          gstPct: i.gstPct,
        })),
        reason,
        remarks,
      };

      const res = await purchaseReturnService.createPurchaseReturn(payload);
      const created = res.data?.data || res.data;

      uiToast.success(
        `Debit Note #${created?.debitNoteNo || created?.returnNo} issued successfully!`
      );
      navigate(ROUTES.PURCHASE_RETURNS);
    } catch (err) {
      console.error("Failed to create purchase return:", err);
      uiToast.error(
        err.response?.data?.message || err.message || "Failed to create purchase return"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Top Header */}
      <div className="border-b bg-card/90 backdrop-blur sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UIButton
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTES.PURCHASE_RETURNS)}
              startIcon={<ArrowLeft className="size-4" />}
              className="text-text-muted hover:text-text"
            >
              Back
            </UIButton>
            <div className="h-4 w-px bg-border" />
            <div>
              <h1 className="text-lg font-bold text-text flex items-center gap-2">
                <Undo2 className="size-5 text-primary" />
                New Purchase Return & Debit Note
              </h1>
              <p className="text-xs text-text-muted">
                Return purchased stock to vendor and issue GST Section 34 Debit Note
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <UIButton
              variant="outline"
              size="sm"
              onClick={() => navigate(ROUTES.PURCHASE_RETURNS)}
              disabled={isSubmitting}
            >
              Cancel
            </UIButton>
            <UIButton
              variant="primary"
              size="sm"
              onClick={handleSubmitReturn}
              disabled={isSubmitting || items.length === 0}
              startIcon={
                isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )
              }
              className="font-bold shadow-xs"
            >
              {isSubmitting ? "Processing..." : "Confirm & Issue Debit Note"}
            </UIButton>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Section 1: Header Parameters Card */}
        <div className="bg-card border rounded-xl p-5 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Supplier Selector */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Target Supplier *
              </label>
              {selectedSupplier ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-surface/50 border-primary/30">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Truck className="size-4.5" />
                    </div>
                    <div>
                      <div className="font-bold text-text text-sm">
                        {selectedSupplier.businessName || selectedSupplier.name}
                      </div>
                      <div className="text-xs text-text-muted flex items-center gap-2">
                        {selectedSupplier.gstNumber && (
                          <span>GSTIN: {selectedSupplier.gstNumber}</span>
                        )}
                        {selectedSupplier.mobile && (
                          <span>Phone: {selectedSupplier.mobile}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <UIButton
                    variant="ghost"
                    size="xs"
                    onClick={() => setSelectedSupplier(null)}
                    className="text-text-muted hover:text-rose-600"
                  >
                    Change
                  </UIButton>
                </div>
              ) : (
                <SupplierSearchBar
                  selectedSupplier={selectedSupplier}
                  onSelectSupplier={(s) => setSelectedSupplier(s)}
                  placeholder="Type to search supplier by business name or GSTIN..."
                />
              )}
            </div>

            {/* Return Motive Selector */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Return Motive *
              </label>
              <select
                value={returnMotive}
                onChange={(e) => setReturnMotive(e.target.value)}
                className="w-full h-10 px-3 border rounded-lg bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
              >
                <option value="SELLABLE">Sellable Stock (Shelf)</option>
                <option value="EXPIRED">Expired Stock (Scrap Bin)</option>
                <option value="BROKEN">Broken / Damaged (Scrap Bin)</option>
                <option value="MIXED">Mixed Motive</option>
              </select>
            </div>

            {/* Return Date */}
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                Debit Note Date *
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full h-10 px-3 border rounded-lg bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
              />
            </div>
          </div>

          {/* Active Facility Indicator */}
          <div className="pt-2 border-t flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <Building2 className="size-3.5 text-primary" />
              Dispatch Facility: <strong className="text-text">{currentBranch?.name || "Active Facility"}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Receipt className="size-3.5 text-emerald-600" />
              Settlement Mode: <strong>Immediate Supplier AP Debit Note</strong>
            </span>
          </div>
        </div>

        {/* Section 2: Medicine / Batch Fast Search Bar */}
        <div className="bg-card border rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text flex items-center gap-2">
              <Search className="size-4 text-primary" />
              Search & Add Medicines from Facility
            </h2>
            <span className="text-xs text-text-muted">
              Auto-resolves original purchase bill & effective FIFO rate
            </span>
          </div>

          <div ref={searchContainerRef} className="relative">
            <div className="relative">
              <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchResults(true);
                }}
                placeholder="Scan barcode or type medicine name / batch number..."
                className="w-full h-11 pl-10 pr-10 border rounded-lg bg-background text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
              />
              {isSearchingBatches && (
                <Loader2 className="size-4 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 text-primary" />
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-card border rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto divide-y">
                {searchResults.map((b) => (
                  <button
                    key={b.batchId}
                    type="button"
                    onClick={() => handleSelectBatch(b)}
                    className="w-full text-left p-3 hover:bg-surface/80 flex items-center justify-between transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-text text-sm flex items-center gap-2">
                        {b.productName}
                        {b.pack && (
                          <span className="text-xs font-normal text-text-muted">
                            ({b.pack})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted flex items-center gap-3">
                        <span>Batch: <strong className="font-mono text-text">{b.batchNo}</strong></span>
                        {b.expiry && <span>Exp: {b.expiry}</span>}
                        {b.purchaseBillNo && (
                          <span className="text-primary font-medium">Bill: #{b.purchaseBillNo}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-sm font-bold text-text">
                        Rate: {formatCurrency(b.rate)}
                      </div>
                      <div className="text-xs flex items-center gap-1.5 justify-end">
                        <UIBadge variant={b.availableShelfStock > 0 ? "default" : "warning"}>
                          Shelf: {b.availableShelfStock}
                        </UIBadge>
                        {b.availableScrapStock > 0 && (
                          <UIBadge variant="destructive">
                            Scrap: {b.availableScrapStock}
                          </UIBadge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Staged Line Items Table */}
        <div className="bg-card border rounded-xl overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="text-sm font-bold text-text flex items-center gap-2">
              <Boxes className="size-4 text-primary" />
              Return Items List ({items.length})
            </h2>
            {items.length > 0 && (
              <UIButton
                variant="ghost"
                size="xs"
                onClick={() => setItems([])}
                className="text-text-muted hover:text-rose-600"
              >
                Clear All
              </UIButton>
            )}
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center text-text-muted space-y-2">
              <Boxes className="size-10 mx-auto text-text-muted/40 stroke-1" />
              <div className="text-sm font-medium">No medicines added to return yet</div>
              <p className="text-xs max-w-sm mx-auto">
                Search medicines above or pick quarantined batches directly from the Expired & Scrap items register.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y">
                <thead className="bg-surface/50 text-text-muted uppercase font-semibold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Medicine & Pack</th>
                    <th className="py-3 px-4">Batch & Expiry</th>
                    <th className="py-3 px-4">Stock Source</th>
                    <th className="py-3 px-4 text-center">Return Qty</th>
                    <th className="py-3 px-4 text-right">Purchase Rate</th>
                    <th className="py-3 px-4 text-right">Disc %</th>
                    <th className="py-3 px-4 text-right">GST %</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item, idx) => {
                    const qty = Number(item.returnQty) || 0;
                    const rate = Number(item.rate) || 0;
                    const disc = Number(item.discountPct) || 0;
                    const lineGross = qty * rate;
                    const lineTaxable = lineGross - lineGross * (disc / 100);
                    const lineTotal = lineTaxable + (lineTaxable * (Number(item.gstPct) || 0)) / 100;

                    return (
                      <tr key={item.id} className="hover:bg-surface/30">
                        <td className="py-3 px-4 text-text-muted">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-text">
                          {item.productName}
                          {item.pack && (
                            <span className="block text-[11px] font-normal text-text-muted">
                              {item.pack}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {item.batchNo}
                          {item.expiry && (
                            <span className="block text-[11px] font-sans text-text-muted">
                              Exp: {item.expiry}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={item.sourceBin}
                            onChange={(e) =>
                              handleUpdateItem(idx, "sourceBin", e.target.value)
                            }
                            className="h-8 px-2 border rounded bg-background text-xs"
                          >
                            <option value="SELLABLE">Shelf (Sellable)</option>
                            <option value="SCRAP_EXPIRED">Scrap (Expired)</option>
                            <option value="SCRAP_BROKEN">Scrap (Broken)</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.returnQty}
                            onChange={(e) =>
                              handleUpdateItem(idx, "returnQty", e.target.value)
                            }
                            className="w-16 h-8 text-center border rounded bg-background text-xs font-bold"
                          />
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          <input
                            type="number"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) =>
                              handleUpdateItem(idx, "rate", e.target.value)
                            }
                            className="w-20 h-8 text-right px-2 border rounded bg-background text-xs font-mono"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPct}
                            onChange={(e) =>
                              handleUpdateItem(idx, "discountPct", e.target.value)
                            }
                            className="w-14 h-8 text-right px-1.5 border rounded bg-background text-xs font-mono"
                          />
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-text-muted">
                          {item.gstPct}%
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-text font-mono">
                          {formatCurrency(lineTotal)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-text-muted hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 4: Remarks & Final Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-card border rounded-xl p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Notes & Return Remarks
            </h3>
            <textarea
              rows="3"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add courier/transporter notes, reason for return, or supplier claim memo details..."
              className="w-full p-3 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
            />
          </div>

          <div className="bg-card border rounded-xl p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted border-b pb-2">
              Debit Note Financial Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-text-muted">
                <span>Taxable Subtotal:</span>
                <span className="font-mono font-medium text-text">
                  {formatCurrency(calculatedTotals.taxableSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Total GST (ITC Reversal):</span>
                <span className="font-mono font-medium text-text">
                  {formatCurrency(calculatedTotals.totalGst)}
                </span>
              </div>
              {calculatedTotals.roundOff !== 0 && (
                <div className="flex justify-between text-text-muted">
                  <span>Round Off:</span>
                  <span className="font-mono text-text">
                    {calculatedTotals.roundOff > 0 ? "+" : ""}
                    {calculatedTotals.roundOff}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t flex justify-between items-baseline">
                <span className="text-sm font-bold text-text">Total Debit Amount:</span>
                <span className="text-lg font-black text-primary font-mono">
                  {formatCurrency(calculatedTotals.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchaseReturnDesktopPage;

