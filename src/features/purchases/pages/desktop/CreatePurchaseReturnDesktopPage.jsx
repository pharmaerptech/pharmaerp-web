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
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  UIPageHeader,
  UISectionHeader,
  UIInfoCard,
  UISummaryCard,
  UIAlert,
  UITabs,
  UIButton,
  UIIconButton,
  UIInput,
  UISearchInput,
  UIBadge,
  UIEmptyState,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
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
    if (!selectedSupplier && b.supplier) {
      setSelectedSupplier(b.supplier);
    }

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

    const maxReturnable = Math.min(
      availableStock,
      b.unreturnedBillQuota || availableStock
    );

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

  const motiveTabs = [
    { id: "SELLABLE", label: "Sellable (Shelf)", icon: Package },
    { id: "EXPIRED", label: "Expired Scrap", icon: Trash2 },
    { id: "BROKEN", label: "Broken Scrap", icon: AlertTriangle },
    { id: "MIXED", label: "Mixed", icon: Boxes },
  ];

  return (
    <div className="min-h-screen bg-bg pb-20 font-sans">
      {/* 1. Sticky Glass Page Header (Component #16) */}
      <UIPageHeader
        sticky
        glass
        backButton
        onBack={() => navigate(ROUTES.PURCHASE_RETURNS)}
        title="New Purchase Return & Debit Note"
        description="Return purchased medicine stock to vendor and issue GST Section 34 Debit Note"
        actions={
          <div className="flex items-center gap-2.5">
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
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 2. Top Context Grid (Supplier InfoCard, Motive Tabs, Facility Meta) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Supplier InfoCard (Component #30) */}
          <div className="lg:col-span-2">
            {selectedSupplier ? (
              <UIInfoCard
                title={selectedSupplier.businessName || selectedSupplier.name}
                subtitle="Target Supplier / Creditor"
                icon={<Truck className="size-5" />}
                color="primary"
                variant="accent"
                action={
                  <UIButton
                    variant="ghost"
                    size="xs"
                    onClick={() => setSelectedSupplier(null)}
                    className="text-text-muted hover:text-error"
                  >
                    Change Supplier
                  </UIButton>
                }
                fields={[
                  {
                    label: "GSTIN",
                    value: selectedSupplier.gstNumber || "Unregistered",
                    copyable: !!selectedSupplier.gstNumber,
                  },
                  {
                    label: "Phone",
                    value: selectedSupplier.mobile || selectedSupplier.phone || "—",
                  },
                  {
                    label: "Drug License",
                    value: selectedSupplier.drugLicenseNumber || "—",
                  },
                  {
                    label: "City / State",
                    value: selectedSupplier.address?.city || selectedSupplier.address?.state || "India",
                  },
                ]}
              />
            ) : (
              <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text uppercase tracking-wider">
                    Select Target Supplier *
                  </label>
                  <span className="text-[11px] text-text-muted">
                    Search from master parties
                  </span>
                </div>
                <SupplierSearchBar
                  selectedSupplier={selectedSupplier}
                  onSelectSupplier={(s) => setSelectedSupplier(s)}
                  placeholder="Type to search supplier by business name, phone, or GST..."
                />
              </div>
            )}
          </div>

          {/* Motive & Date Parameters Card */}
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3.5 flex flex-col justify-between">
            <div className="space-y-3">
              <label className="text-xs font-bold text-text uppercase tracking-wider block">
                Stock Motive *
              </label>
              <UITabs
                tabs={motiveTabs}
                activeTab={returnMotive}
                onChange={(tabId) => setReturnMotive(tabId)}
                variant="segmented"
                size="xs"
                fullWidth
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
              <div>
                <label className="text-[11px] font-semibold text-text-muted block mb-1">
                  Debit Note Date
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full h-8.5 px-2.5 border border-border rounded-lg bg-surface text-xs font-medium text-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-text-muted block mb-1">
                  Dispatch Facility
                </label>
                <div className="h-8.5 px-2.5 border border-border rounded-lg bg-surface-alt flex items-center gap-1.5 text-xs font-medium text-text truncate">
                  <Building2 className="size-3 text-primary shrink-0" />
                  <span className="truncate">{currentBranch?.name || "Active Facility"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Medicine / Batch Fast Search Bar (Component #4 & Autocomplete) */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-3">
          <UISectionHeader
            title="Search & Add Batches from Facility"
            description="Scans inventory, checks bin stock, and auto-resolves original purchase rates via FIFO"
            icon={<Search className="size-4" />}
          />

          <div ref={searchContainerRef} className="relative">
            <div className="relative">
              <UISearchInput
                value={searchQuery}
                onChange={(val) => setSearchQuery(val)}
                placeholder="Scan barcode or type medicine name / batch number..."
                size="lg"
              />
              {isSearchingBatches && (
                <Loader2 className="size-4 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 text-primary" />
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-border rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto divide-y divide-border/60">
                {searchResults.map((b) => (
                  <button
                    key={b.batchId}
                    type="button"
                    onClick={() => handleSelectBatch(b)}
                    className="w-full text-left p-3.5 hover:bg-surface-hover flex items-center justify-between transition-colors font-sans"
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
                          <span className="text-primary font-medium">Inflow Bill: #{b.purchaseBillNo}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-sm font-bold text-text font-mono">
                        Rate: {formatCurrency(b.rate)}
                      </div>
                      <div className="text-xs flex items-center gap-1.5 justify-end">
                        <UIBadge variant={b.availableShelfStock > 0 ? "soft" : "outline"} color="primary">
                          Shelf: {b.availableShelfStock}
                        </UIBadge>
                        {b.availableScrapStock > 0 && (
                          <UIBadge variant="soft" color="warning">
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

        {/* 4. Staged Line Items Table (Component #11) */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <UISectionHeader
              title={`Return Line Items (${items.length})`}
              description="Review quantities, purchase rates, tax slabs, and bin origins"
              icon={<Boxes className="size-4" />}
            />
            {items.length > 0 && (
              <UIButton
                variant="ghost"
                size="xs"
                onClick={() => setItems([])}
                className="text-text-muted hover:text-error"
              >
                Clear All
              </UIButton>
            )}
          </div>

          {items.length === 0 ? (
            <div className="p-12">
              <UIEmptyState
                icon={<Boxes className="size-8" />}
                title="No medicines staged for return"
                description="Search medicines above or select quarantined items directly from the Expired & Scrap items page."
                variant="dashed"
                size="md"
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <UITable>
                <UITableHeader>
                  <UITableRow className="bg-surface-alt/60">
                    <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-center w-12">
                      #
                    </UITableHead>
                    <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px]">
                      Medicine & Pack
                    </UITableHead>
                    <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px]">
                      Batch & Expiry
                    </UITableHead>
                    <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px]">
                      Stock Bin
                    </UITableHead>
                    <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-center">
                      Return Qty
                    </UITableHead>
                    <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-right">
                      Purchase Rate
                    </UITableHead>
                    <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-right">
                      Disc %
                    </UITableHead>
                    <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-right">
                      GST %
                    </UITableHead>
                    <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-right">
                      Total Amount
                    </UITableHead>
                    <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-center">
                      Action
                    </UITableHead>
                  </UITableRow>
                </UITableHeader>

                <UITableBody>
                  {items.map((item, idx) => {
                    const qty = Number(item.returnQty) || 0;
                    const rate = Number(item.rate) || 0;
                    const disc = Number(item.discountPct) || 0;
                    const lineGross = qty * rate;
                    const lineTaxable = lineGross - lineGross * (disc / 100);
                    const lineTotal =
                      lineTaxable + (lineTaxable * (Number(item.gstPct) || 0)) / 100;

                    return (
                      <tr key={item.id} className="hover:bg-surface-hover transition-colors">
                        <td className="py-3 px-4 text-center text-text-muted font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-text">
                          {item.productName}
                          {item.pack && (
                            <span className="block text-[11px] font-normal text-text-muted">
                              ({item.pack})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium">
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
                            className="h-7.5 px-2 border border-border rounded-lg bg-surface text-xs font-medium text-text"
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
                            className="w-16 h-8 text-center border border-border rounded-lg bg-surface text-xs font-bold text-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
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
                            className="w-20 h-8 text-right px-2 border border-border rounded-lg bg-surface text-xs font-mono font-bold text-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
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
                            className="w-14 h-8 text-right px-1.5 border border-border rounded-lg bg-surface text-xs font-mono text-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
                          />
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-text-muted">
                          {item.gstPct}%
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-text font-mono">
                          {formatCurrency(lineTotal)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <UIIconButton
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(idx)}
                            icon={<Trash2 className="size-4 text-text-muted hover:text-error" />}
                            tooltip="Remove Item"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </UITableBody>
              </UITable>
            </div>
          )}
        </div>

        {/* 5. Notes & Financial Summary (Component #29 UISummaryCard) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-2.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider block">
                Reason & Transporter Notes
              </label>
              <textarea
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add courier/transporter details, carton numbers, or return reason..."
                className="w-full p-3 border border-border rounded-xl bg-surface text-xs font-medium text-text focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
              />
            </div>

            {/* GST Compliance Alert Banner (Component #36) */}
            <UIAlert
              variant="info"
              title="GST Section 34 Compliance & ITC Reversal"
              description="Confirming this return will automatically post an Accounts Payable Debit Note and generate a negative GSTR-2 ledger entry for Input Tax Credit reversal."
              icon={<ShieldCheck className="size-4.5" />}
            />
          </div>

          <div>
            <UISummaryCard
              title="Debit Note Financial Summary"
              subtitle="Direct Vendor AP Adjustment"
              items={[
                {
                  label: "Taxable Subtotal",
                  value: formatCurrency(calculatedTotals.taxableSubtotal),
                },
                {
                  label: "Total GST (ITC Reversal)",
                  value: formatCurrency(calculatedTotals.totalGst),
                  isDeduction: true,
                },
                ...(calculatedTotals.roundOff !== 0
                  ? [
                      {
                        label: "Round Off",
                        value: `${calculatedTotals.roundOff > 0 ? "+" : ""}${calculatedTotals.roundOff}`,
                      },
                    ]
                  : []),
              ]}
              total={{
                label: "Net Debit Amount",
                value: formatCurrency(calculatedTotals.grandTotal),
                subtext: "Credited to Supplier Balance",
              }}
              variant="card"
              footer={
                <UIButton
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={handleSubmitReturn}
                  disabled={isSubmitting || items.length === 0}
                  startIcon={
                    isSubmitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="size-4" />
                    )
                  }
                  className="font-bold shadow-xs mt-2"
                >
                  {isSubmitting ? "Processing..." : "Confirm & Issue Debit Note"}
                </UIButton>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePurchaseReturnDesktopPage;
