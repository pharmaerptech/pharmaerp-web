// src/features/purchases/pages/mobile/CreatePurchaseReturnMobilePage.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Undo2,
  Trash2,
  Plus,
  Minus,
  Loader2,
  Truck,
  Building2,
  Boxes,
  ShieldCheck,
  Package,
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

export const CreatePurchaseReturnMobilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentBranch, activeBranchId } = useBranch();

  const navState = location.state || {};
  const prefilledItems = navState.prefilledItems || [];
  const initialMotive = navState.returnMotive || "SELLABLE";

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [returnMotive, setReturnMotive] = useState(initialMotive);
  const [settlementType, setSettlementType] = useState("DEBIT_NOTE");
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [remarks, setRemarks] = useState(navState.remarks || "");

  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingBatches, setIsSearchingBatches] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      if (prefilledItems[0]?.supplierId && !selectedSupplier) {
        setSelectedSupplier({
          _id: prefilledItems[0].supplierId,
          businessName: prefilledItems[0].supplierName || "Supplier",
        });
      }
    }
  }, [prefilledItems]);

  const handleSearchBatches = async (query) => {
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
        limit: 20,
      });
      setSearchResults(res?.data?.data || res?.data || []);
      setShowSearchResults(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingBatches(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) handleSearchBatches(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectBatch = (b) => {
    if (!selectedSupplier && b.supplier) setSelectedSupplier(b.supplier);
    const existingIndex = items.findIndex((i) => i.batchId === b.batchId);
    if (existingIndex > -1) {
      uiToast.info(`Batch ${b.batchNo} is already added.`);
      setShowSearchResults(false);
      return;
    }

    const availableStock =
      returnMotive === "SELLABLE"
        ? b.availableShelfStock
        : b.expiredStock || b.availableScrapStock;

    setItems((prev) => [
      {
        id: `item-${Date.now()}-${b.batchId}`,
        productId: b.productId,
        productName: b.productName,
        pack: b.pack,
        batchId: b.batchId,
        batchNo: b.batchNo,
        expiry: b.expiry,
        purchaseBillId: b.purchaseBillId || null,
        purchaseBillNo: b.purchaseBillNo || "",
        sourceBin: returnMotive === "SELLABLE" ? "SELLABLE" : "SCRAP_EXPIRED",
        availableQty: availableStock,
        returnQty: 1,
        rate: Number(b.rate || 0),
        discountPct: 0,
        gstPct: Number(b.gstPct || 12),
      },
      ...prev,
    ]);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleUpdateQty = (index, delta) => {
    setItems((prev) => {
      const copy = [...prev];
      const newQty = Math.max(1, (copy[index].returnQty || 1) + delta);
      copy[index] = { ...copy[index], returnQty: newQty };
      return copy;
    });
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculatedTotals = useMemo(() => {
    let taxable = 0;
    let tax = 0;
    items.forEach((i) => {
      const gross = (i.returnQty || 0) * (i.rate || 0);
      const lineTaxable = gross - gross * ((i.discountPct || 0) / 100);
      taxable += lineTaxable;
      tax += (lineTaxable * (i.gstPct || 0)) / 100;
    });
    return {
      taxable,
      tax,
      grandTotal: Math.round(taxable + tax),
    };
  }, [items]);

  const handleSubmitReturn = async () => {
    if (!selectedSupplier?._id) {
      uiToast.error("Select a supplier to return goods to.");
      return;
    }
    if (items.length === 0) {
      uiToast.error("Add at least one item to return.");
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
        remarks,
      };

      const res = await purchaseReturnService.createPurchaseReturn(payload);
      uiToast.success("Purchase return debit note issued successfully!");
      navigate(ROUTES.PURCHASE_RETURNS);
    } catch (err) {
      console.error(err);
      uiToast.error(err.response?.data?.message || err.message || "Failed to create return");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(ROUTES.PURCHASE_RETURNS)}
            className="p-1 rounded-md text-text-muted hover:text-text"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-text flex items-center gap-1.5">
              <Undo2 className="size-4 text-primary" />
              New Purchase Return
            </h1>
            <p className="text-[11px] text-text-muted">Issue Supplier Debit Note</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Supplier Picker Card */}
        <div className="bg-card border rounded-xl p-3.5 space-y-3">
          <label className="text-xs font-bold text-text-muted uppercase">Supplier *</label>
          {selectedSupplier ? (
            <div className="flex items-center justify-between p-2.5 border rounded-lg bg-surface/50">
              <div>
                <div className="font-bold text-sm text-text">
                  {selectedSupplier.businessName || selectedSupplier.name}
                </div>
                {selectedSupplier.gstNumber && (
                  <div className="text-[11px] text-text-muted">GST: {selectedSupplier.gstNumber}</div>
                )}
              </div>
              <UIButton variant="ghost" size="xs" onClick={() => setSelectedSupplier(null)}>
                Change
              </UIButton>
            </div>
          ) : (
            <SupplierSearchBar
              selectedSupplier={selectedSupplier}
              onSelectSupplier={(s) => setSelectedSupplier(s)}
              placeholder="Search supplier..."
            />
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div>
              <label className="text-[11px] font-semibold text-text-muted">Motive</label>
              <select
                value={returnMotive}
                onChange={(e) => setReturnMotive(e.target.value)}
                className="w-full h-9 px-2 border rounded-lg bg-background text-xs font-medium"
              >
                <option value="SELLABLE">Sellable Stock</option>
                <option value="EXPIRED">Expired Scrap</option>
                <option value="BROKEN">Broken Scrap</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-text-muted">Date</label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full h-9 px-2 border rounded-lg bg-background text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* Batch Search Input */}
        <div className="bg-card border rounded-xl p-3.5 space-y-2">
          <label className="text-xs font-bold text-text-muted uppercase">Search Medicine / Batch</label>
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Scan or type medicine / batch..."
              className="w-full h-10 pl-9 pr-9 border rounded-lg bg-background text-xs"
            />
            {isSearchingBatches && (
              <Loader2 className="size-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-primary" />
            )}
          </div>

          {showSearchResults && searchResults.length > 0 && (
            <div className="border rounded-lg max-h-56 overflow-y-auto divide-y mt-2 bg-background">
              {searchResults.map((b) => (
                <button
                  key={b.batchId}
                  type="button"
                  onClick={() => handleSelectBatch(b)}
                  className="w-full text-left p-2.5 text-xs hover:bg-surface/50 flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-text">{b.productName}</div>
                    <div className="text-[11px] text-text-muted">
                      Batch: <strong className="font-mono">{b.batchNo}</strong> | Exp: {b.expiry}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-text">{formatCurrency(b.rate)}</div>
                    <div className="text-[10px] text-text-muted">Avail: {b.availableShelfStock || b.availableScrapStock}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Staged Items Card List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-text-muted uppercase px-1">
            <span>Return Items ({items.length})</span>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setItems([])}
                className="text-rose-600 text-xs font-normal"
              >
                Clear
              </button>
            )}
          </div>

          {items.map((item, idx) => (
            <div key={item.id} className="bg-card border rounded-xl p-3 shadow-2xs space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-sm text-text">{item.productName}</div>
                  <div className="text-[11px] text-text-muted flex items-center gap-2">
                    <span>Batch: <strong className="font-mono">{item.batchNo}</strong></span>
                    {item.expiry && <span>Exp: {item.expiry}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1 text-text-muted hover:text-rose-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <div>
                  <div className="text-text-muted text-[11px]">Purchase Rate</div>
                  <div className="font-mono font-bold">{formatCurrency(item.rate)}</div>
                </div>

                {/* Qty Stepper */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(idx, -1)}
                    className="size-7 rounded border flex items-center justify-center text-text"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm">{item.returnQty}</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(idx, 1)}
                    className="size-7 rounded border flex items-center justify-center text-text"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>

                <div className="text-right">
                  <div className="text-text-muted text-[11px]">Total</div>
                  <div className="font-mono font-bold text-primary">
                    {formatCurrency(item.returnQty * item.rate * (1 + (item.gstPct || 0) / 100))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Bottom Summary & Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 z-40 shadow-xl space-y-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-text-muted">Total Debit Note Amount:</span>
          <span className="text-lg font-black text-primary font-mono">
            {formatCurrency(calculatedTotals.grandTotal)}
          </span>
        </div>
        <UIButton
          variant="primary"
          size="lg"
          onClick={handleSubmitReturn}
          disabled={isSubmitting || items.length === 0}
          className="w-full font-bold shadow-md"
        >
          {isSubmitting ? "Issuing Debit Note..." : "Confirm & Issue Debit Note"}
        </UIButton>
      </div>
    </div>
  );
};

export default CreatePurchaseReturnMobilePage;

