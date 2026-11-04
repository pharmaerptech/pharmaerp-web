// src/features/sales-returns/components/CreateSalesReturnModal.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  RotateCcw,
  Boxes,
  Banknote,
  Wallet,
  Receipt,
  AlertCircle,
  Plus,
  Minus,
  SlidersHorizontal,
  User,
  Phone,
  FileText,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { UIModal, UIButton, UIBadge, UIInfiniteScroll } from "@/components/ui";
import { B2cCustomerSearchBar } from "@/features/parties/customers/components/B2cCustomerSearchBar";
import invoiceService from "@/features/sales/services/invoiceService";
import salesReturnService from "../services/salesReturnService";
import useBranch from "@/features/branch/hooks/useBranch";
import { useActiveShift } from "@/features/operations/shifts/hooks/useActiveShift";
import { cn } from "@/lib/utils";

const CURRENCY_DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1];
const BILLS_PAGE_SIZE = 10;

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const CreateSalesReturnModal = ({ open, isOpen, onClose, onSuccess }) => {
  const { currentBranch } = useBranch();
  const { activeShift } = useActiveShift();

  const isModalOpen = Boolean(open ?? isOpen);

  // Search Mode: "customer" (Name/Phone via POS search) or "invoice" (Invoice No)
  const [searchMode, setSearchMode] = useState("customer");

  // Customer search states (POS Terminal search bar integration)
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [isLoadingCustomerBills, setIsLoadingCustomerBills] = useState(false);

  // Infinite scrolling & pagination for customer bills (Limit = 10)
  const [billsPage, setBillsPage] = useState(1);
  const [hasMoreBills, setHasMoreBills] = useState(false);
  const [totalBillsCount, setTotalBillsCount] = useState(0);
  const [isLoadingMoreBills, setIsLoadingMoreBills] = useState(false);
  const [activeSearchTarget, setActiveSearchTarget] = useState(null);

  const billsContainerRef = useRef(null);
  const activeBillsFetchIdRef = useRef(0);

  // Invoice # search states
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Active / Selected Original Invoice
  const [originalInvoice, setOriginalInvoice] = useState(null);

  // Step 2: Selected items to return
  const [selectedItems, setSelectedItems] = useState([]);

  // Step 3: Refund Settlement Mode
  const [refundMode, setRefundMode] = useState("Cash"); // "Cash" | "Credit"
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const isWalkInReturn = useMemo(() => {
    const cust = originalInvoice?.customerId || selectedCustomer;
    const custType = typeof cust === "object" ? cust?.customerType : null;
    const isWalk = typeof cust === "object" ? (cust?.isWalkIn || cust?.type === "walk_in") : null;
    const name = (typeof cust === "object" ? cust?.name : originalInvoice?.customerName) || "";
    return Boolean(
      isWalk ||
      custType === "walk_in" ||
      name.toLowerCase().includes("walk-in")
    );
  }, [originalInvoice, selectedCustomer]);

  useEffect(() => {
    if (isWalkInReturn && refundMode !== "Cash") {
      setRefundMode("Cash");
    }
  }, [isWalkInReturn, refundMode]);

  // Cash Denominations
  const [cashDenominations, setCashDenominations] = useState({});
  const [showDenomBreakdown, setShowDenomBreakdown] = useState(false);

  // Reset modal state on open
  useEffect(() => {
    if (isModalOpen) {
      setSearchMode("customer");
      setSelectedCustomer(null);
      setCustomerSearchTerm("");
      setCustomerInvoices([]);
      setIsLoadingCustomerBills(false);
      setBillsPage(1);
      setHasMoreBills(false);
      setTotalBillsCount(0);
      setIsLoadingMoreBills(false);
      setActiveSearchTarget(null);
      setSearchQuery("");
      setSearchError(null);
      setOriginalInvoice(null);
      setSelectedItems([]);
      setRefundMode("Cash");
      setNotes("");
      setSubmitError(null);
      setCashDenominations({});
      setShowDenomBreakdown(false);
    }
  }, [isModalOpen]);

  // Load an invoice into the return work area
  const handleSelectInvoice = (inv) => {
    if (!inv || !inv.invoiceNo) return;
    setOriginalInvoice(inv);
    setSearchError(null);

    const initialItems = (inv.items || []).map((it, idx) => {
      const soldQty = Number(it.qty || 1);
      const returnedQty = Number(it.returnedQty || 0);
      const availableQty = Math.max(0, soldQty - returnedQty);
      const isFullyReturned = availableQty <= 0;
      const isPartiallyReturned = returnedQty > 0 && availableQty > 0;

      return {
        id: it._id || `item-${idx}`,
        productId: it.productId || it.product_id || it.workspaceProductId || it.id,
        name: it.name || it.productName || "Product",
        brand: it.brand || it.manufacturer || "",
        category: it.category || "",
        batch: it.batch || it.batchNo || "STANDARD",
        batchId: it.batchId || it.batch_id || undefined,
        pack: it.pack || "PCS",
        rack: it.rack || "",
        expiry: it.expiry || it.expiryDate || "—",
        mrp: Number(it.mrp || 0),
        price: Number(it.price || it.rate || 0),
        tax: Number(it.tax || it.gst || 5),
        soldQty,
        returnedQty,
        availableQty,
        isFullyReturned,
        isPartiallyReturned,
        returnQty: 0,
        isSelected: false,
      };
    });

    setSelectedItems(initialItems);
  };

  // Reusable Paginated Fetch for Bills (limit = 10, infinite scrolling)
  const fetchBills = async (target, targetPage = 1, isAppending = false) => {
    if (!target) {
      setCustomerInvoices([]);
      setHasMoreBills(false);
      setTotalBillsCount(0);
      return;
    }

    const fetchId = ++activeBillsFetchIdRef.current;
    setActiveSearchTarget(target);

    if (isAppending) {
      setIsLoadingMoreBills(true);
    } else {
      setIsLoadingCustomerBills(true);
      setSearchError(null);
    }

    try {
      let invoices = [];
      let total = 0;

      const isCustomerObj = typeof target === "object" && target !== null;
      const custId = isCustomerObj ? (target._id || target.id) : null;

      if (isCustomerObj && custId && custId !== "walkin") {
        try {
          const res = await invoiceService.getCustomerSales(custId, {
            page: targetPage,
            limit: BILLS_PAGE_SIZE,
          });
          const apiData = res?.data?.data || res?.data;
          invoices = apiData?.data || apiData?.sales || apiData?.invoices || (Array.isArray(apiData) ? apiData : []);
          total = apiData?.meta?.total ?? res?.data?.meta?.total ?? invoices.length;
        } catch (e) {
          console.warn("Failed fetching customer sales by ID, falling back to query search:", e);
        }
      }

      // Query-based fallback or search query
      if (invoices.length === 0) {
        const queryTerm = isCustomerObj
          ? (target.phone || target.mobile || target.name)
          : String(target).trim();

        if (queryTerm) {
          const res = await invoiceService.getAllCustomerSales({
            search: queryTerm,
            page: targetPage,
            limit: BILLS_PAGE_SIZE,
          });
          const apiData = res?.data?.data || res?.data;
          const list = apiData?.sales || apiData?.data || (Array.isArray(apiData) ? apiData : []);
          invoices = Array.isArray(list) ? list : (list.data || []);
          total = apiData?.meta?.total ?? res?.data?.meta?.total ?? invoices.length;
        }
      }

      if (activeBillsFetchIdRef.current !== fetchId) return;

      setBillsPage(targetPage);
      setTotalBillsCount(total);

      if (isAppending) {
        setCustomerInvoices((prev) => {
          const existingIds = new Set(prev.map((i) => i._id || i.invoiceNo));
          const fresh = invoices.filter((i) => !existingIds.has(i._id || i.invoiceNo));
          const merged = [...prev, ...fresh];
          setHasMoreBills(merged.length < total && invoices.length === BILLS_PAGE_SIZE);
          return merged;
        });
      } else {
        setCustomerInvoices(invoices);
        setHasMoreBills(invoices.length < total && invoices.length === BILLS_PAGE_SIZE);

        if (invoices.length === 0) {
          const targetName = isCustomerObj ? (target.name || "this customer") : `"${target}"`;
          setSearchError(`No past sales bills found for ${targetName}.`);
        } else if (invoices.length === 1 && targetPage === 1 && isCustomerObj) {
          handleSelectInvoice(invoices[0]);
        }
      }
    } catch (err) {
      if (activeBillsFetchIdRef.current === fetchId) {
        console.error("Error loading bills:", err);
        setSearchError("Failed to fetch bills. Please check connection and try again.");
      }
    } finally {
      if (activeBillsFetchIdRef.current === fetchId) {
        setIsLoadingCustomerBills(false);
        setIsLoadingMoreBills(false);
      }
    }
  };

  const handleLoadMoreBills = () => {
    if (isLoadingMoreBills || !hasMoreBills || !activeSearchTarget) return;
    fetchBills(activeSearchTarget, billsPage + 1, true);
  };

  // When a customer is picked from the POS search bar, fetch their sales invoices
  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setOriginalInvoice(null);
    setSelectedItems([]);
    setSearchError(null);

    if (!cust) {
      setCustomerInvoices([]);
      setActiveSearchTarget(null);
      setHasMoreBills(false);
      setTotalBillsCount(0);
      return;
    }

    fetchBills(cust, 1, false);
  };

  // Direct search by invoiceNo or customer name/phone in manual search box
  const handleSearchInvoice = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);
    setOriginalInvoice(null);
    setSelectedItems([]);
    setCustomerInvoices([]);

    try {
      // 1. Try exact lookup by invoiceNo / ID
      let matchedInv = null;
      try {
        const res = await invoiceService.getInvoiceById(query);
        const inv = res?.data?.data || res?.data;
        if (inv && inv.invoiceNo) {
          matchedInv = inv;
        }
      } catch (err) {
        // Not an exact ID/invoiceNo, proceed to multi-criteria search
      }

      if (matchedInv) {
        handleSelectInvoice(matchedInv);
        return;
      }

      // 2. Multi-criteria search across invoiceNo, customer name, and customer phone (limit = 10)
      fetchBills(query, 1, false);
    } catch (err) {
      console.error("Search invoice error:", err);
      setSearchError(err?.response?.data?.message || `Invoice "${query}" not found.`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleItem = (index) => {
    setSelectedItems((prev) => {
      const copy = [...prev];
      const item = copy[index];
      if (item.isFullyReturned || item.availableQty <= 0) return prev;
      const nextSelected = !item.isSelected;
      const defaultQty = Math.min(item.availableQty, 1);
      copy[index] = {
        ...item,
        isSelected: nextSelected,
        returnQty: nextSelected && item.returnQty === 0 ? defaultQty : (nextSelected ? Math.min(item.returnQty, item.availableQty) : 0),
      };
      return copy;
    });
  };

  const handleQtyChange = (index, delta) => {
    setSelectedItems((prev) => {
      const copy = [...prev];
      const item = copy[index];
      if (item.isFullyReturned || item.availableQty <= 0) return prev;
      const maxVal = item.availableQty ?? item.soldQty;
      const nextQty = Math.max(0, Math.min(maxVal, item.returnQty + delta));
      copy[index] = {
        ...item,
        returnQty: nextQty,
        isSelected: nextQty > 0,
      };
      return copy;
    });
  };

  // Check if current original invoice is completely fully returned
  const isInvoiceFullyReturned = useMemo(() => {
    if (!originalInvoice) return false;
    if (originalInvoice.isFullyReturned || originalInvoice.returnStatus === "FULL") return true;
    if (selectedItems.length > 0 && selectedItems.every((it) => it.isFullyReturned || it.availableQty <= 0)) return true;
    return false;
  }, [originalInvoice, selectedItems]);

  // Calculations for items to return
  const activeReturnItems = useMemo(
    () => selectedItems.filter((i) => i.isSelected && i.returnQty > 0),
    [selectedItems]
  );

  const subtotal = useMemo(
    () => activeReturnItems.reduce((sum, i) => sum + i.price * i.returnQty, 0),
    [activeReturnItems]
  );

  const totalGst = useMemo(() => {
    return activeReturnItems.reduce((sum, i) => {
      const itemTotal = i.price * i.returnQty;
      const rate = Number(i.tax) || 0;
      return sum + (itemTotal * rate) / (100 + rate);
    }, 0);
  }, [activeReturnItems]);

  const grandTotal = Math.round(subtotal);

  // Auto-decompose denominations when Cash mode and total changes
  useEffect(() => {
    if (refundMode === "Cash" && grandTotal > 0) {
      let rem = grandTotal;
      const autoDenoms = {};
      for (const d of CURRENCY_DENOMINATIONS) {
        if (rem >= d) {
          const count = Math.floor(rem / d);
          autoDenoms[d] = count;
          rem -= count * d;
        }
      }
      setCashDenominations(autoDenoms);
    }
  }, [refundMode, grandTotal]);

  const handleDenomChange = (val, delta) => {
    setCashDenominations((prev) => {
      const current = Number(prev[val] || 0);
      const next = Math.max(0, current + delta);
      return { ...prev, [val]: next };
    });
  };

  const denomTotal = useMemo(() => {
    return Object.entries(cashDenominations).reduce(
      (sum, [val, qty]) => sum + Number(val) * (Number(qty) || 0),
      0
    );
  }, [cashDenominations]);

  const handleSaveReturn = async () => {
    if (refundMode === "Credit" && !originalInvoice?.customerId) {
      setSubmitError("Issuing a Credit Note requires a registered customer on the original bill.");
      return;
    }

    if (activeReturnItems.length === 0) {
      setSubmitError("Please select at least one item and quantity to return.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const branchId = currentBranch?._id || currentBranch?.id || originalInvoice?.branchId;
      const customerId = originalInvoice?.customerId?._id || originalInvoice?.customerId;

      const payload = {
        branchId,
        date: new Date().toISOString(),
        shiftId: activeShift?._id || null,
        originalInvoiceId: originalInvoice?._id,
        originalInvoiceNo: originalInvoice?.invoiceNo,
        billingMode: originalInvoice?.billingMode || "B2C",
        subtotal,
        tax: totalGst,
        grandTotal,
        returnType: refundMode === "Credit" ? "credit_note" : "cash_refund",
        paymentMethod: refundMode === "Credit" ? "Credit Note" : "Cash",
        refundMethod: refundMode === "Credit" ? "Credit Note" : "Cash",
        notes: notes || `Returned from bill #${originalInvoice?.invoiceNo}`,
        items: activeReturnItems.map((i) => ({
          productId: i.productId,
          batchId: i.batchId,
          batchNo: i.batch,
          name: i.name,
          pack: i.pack,
          expiry: i.expiry,
          price: i.price,
          rate: i.price,
          mrp: i.mrp,
          qty: i.returnQty,
          gst: i.tax,
          total: i.price * i.returnQty,
        })),
        denominations: Object.entries(cashDenominations)
          .map(([val, qty]) => ({ denomination: Number(val), quantity: Number(qty) }))
          .filter((d) => d.quantity > 0),
      };

      const res = await salesReturnService.recordSalesReturn(payload, customerId);
      const saved = res?.data?.data || res?.data;

      if (onSuccess) {
        onSuccess(saved);
      }
      onClose();
    } catch (err) {
      console.error("Save sales return error:", err);
      setSubmitError(err?.response?.data?.message || "Failed to record sales return memo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UIModal
      isOpen={isModalOpen}
      open={isModalOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <RotateCcw className="size-4" />
          </div>
          <div>
            <div className="font-bold text-base text-text">New Sales Return</div>
            <div className="text-[11px] text-text-muted">
              Search by customer or original bill, select items, and process refund
            </div>
          </div>
        </div>
      }
      size="xl"
      className="min-h-[640px] max-h-[90vh] flex flex-col"
      footer={
        <div className="flex items-center justify-between w-full">
          <UIButton variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </UIButton>
          <div className="flex items-center gap-2">
            {grandTotal > 0 && (
              <div className="text-right mr-2">
                <div className="text-[10px] uppercase font-bold text-text-muted">Total Refund</div>
                <div className="text-sm font-mono font-extrabold text-rose-600 dark:text-rose-400">
                  {formatCurrency(grandTotal)}
                </div>
              </div>
            )}
            <UIButton
              variant="destructive"
              size="sm"
              icon={RotateCcw}
              onClick={handleSaveReturn}
              loading={isSubmitting}
              disabled={activeReturnItems.length === 0 || isSubmitting || isInvoiceFullyReturned}
            >
              Confirm Return & Refund
            </UIButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-1 min-h-[480px] flex flex-col">
        {/* Step 1: Look up Original Sale Bill */}
        {!originalInvoice ? (
          <div className="p-3.5 rounded-xl border border-border bg-surface-alt/30 space-y-3 min-h-[400px]">
            {/* Search Mode Tabs */}
            <div className="flex items-center justify-between pb-1">
              <label className="text-xs font-bold text-text">
                1. Look Up Original Sale Bill *
              </label>
              <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5 border border-border">
                <button
                  type="button"
                  onClick={() => {
                    setSearchMode("customer");
                    setSearchError(null);
                  }}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer",
                    searchMode === "customer"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-text-muted hover:text-text"
                  )}
                >
                  <User className="size-3.5" />
                  <span>Search Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchMode("invoice");
                    setSearchError(null);
                  }}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer",
                    searchMode === "invoice"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-text-muted hover:text-text"
                  )}
                >
                  <Receipt className="size-3.5" />
                  <span>Search Bill #</span>
                </button>
              </div>
            </div>

            {/* Mode A: Customer Search via POS Terminal Search Bar */}
            {searchMode === "customer" ? (
              <div className="space-y-2">
                <div className="relative">
                  <B2cCustomerSearchBar
                    value={customerSearchTerm}
                    selectedCustomer={selectedCustomer}
                    onSelectCustomer={handleSelectCustomer}
                    onInputChange={(val) => {
                      setCustomerSearchTerm(val);
                      if (selectedCustomer) setSelectedCustomer(null);
                    }}
                    placeholder="Search customer by name or phone (e.g. Rahul, 98765...)..."
                    size="sm"
                    showAddNewAction={false}
                    className="w-full"
                    dropdownClassName="max-h-[300px] shadow-2xl"
                  />
                </div>
                <p className="text-[11px] text-text-muted">
                  Type 2+ characters of customer name or mobile number to pick recent bills.
                </p>
              </div>
            ) : (
              /* Mode B: Manual Invoice # or Phone Search */
              <form onSubmit={handleSearchInvoice} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="size-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Enter Invoice No or phone (e.g. SRT-2627-0001, 98765...)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary font-mono text-text"
                  />
                </div>
                <UIButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isSearching}
                  disabled={!searchQuery.trim() || isSearching}
                >
                  Find Bill
                </UIButton>
              </form>
            )}

            {/* Error message */}
            {searchError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1.5">
                <AlertCircle className="size-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Loading Indicator for Customer Bills */}
            {isLoadingCustomerBills && (
              <div className="py-4 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Fetching previous sales bills...</span>
              </div>
            )}

            {/* Customer Past Bills List (When Multiple Bills Match or Customer Selected) */}
            {!isLoadingCustomerBills && customerInvoices.length > 0 && !originalInvoice && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text uppercase tracking-wider text-[11px]">
                    Select Bill to Return ({totalBillsCount ? `${customerInvoices.length} of ${totalBillsCount}` : customerInvoices.length} found):
                  </span>
                  {selectedCustomer && (
                    <span className="text-text-muted font-medium">
                      Customer: <strong className="text-text">{selectedCustomer.name}</strong>
                    </span>
                  )}
                </div>

                <div
                  ref={billsContainerRef}
                  className="space-y-2 max-h-[250px] overflow-y-auto pr-1"
                >
                  <UIInfiniteScroll
                    onLoadMore={handleLoadMoreBills}
                    hasMore={hasMoreBills}
                    isLoading={isLoadingMoreBills}
                    scrollContainerRef={billsContainerRef}
                    rootMargin="80px"
                    threshold={0.1}
                    loader={
                      <div className="py-2.5 flex items-center justify-center gap-2 text-xs text-text-muted font-medium">
                        <Loader2 className="size-3.5 animate-spin text-primary" />
                        <span>Loading more bills...</span>
                      </div>
                    }
                    endMessage={
                      totalBillsCount > BILLS_PAGE_SIZE ? (
                        <div className="py-2 text-center text-[10.5px] text-text-muted select-none font-mono opacity-70">
                          All {totalBillsCount} bills loaded
                        </div>
                      ) : null
                    }
                  >
                    <div className="space-y-2">
                      {customerInvoices.map((inv) => {
                        const invNo = inv.invoiceNo || "INV";
                        const invDate = inv.date || inv.createdAt;
                        const dateFormatted = invDate
                          ? new Date(invDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—";
                        const billAmt = Number(inv.grandTotal || inv.amount || 0);
                        const custName = inv.customerId?.name || inv.customerName || "Customer";
                        const custPhone = inv.customerId?.phone || inv.customerId?.mobile || inv.customerPhone;
                        const itemsSummary = (inv.items || [])
                          .slice(0, 2)
                          .map((it) => it.name)
                          .join(", ");
                        const hasMoreItems = (inv.items || []).length > 2;

                        return (
                          <div
                            key={inv._id || invNo}
                            className="p-3 rounded-xl border border-border bg-surface hover:border-primary/50 transition-all flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-xs sm:text-sm text-text">
                                  #{invNo}
                                </span>
                                <UIBadge variant="soft" color="primary" className="text-[9.5px] font-bold">
                                  {inv.billingMode || "B2C"}
                                </UIBadge>
                                {inv.isFullyReturned || inv.returnStatus === "FULL" ? (
                                  <UIBadge variant="soft" color="error" className="text-[9.5px] font-bold">
                                    Fully Returned
                                  </UIBadge>
                                ) : inv.isReturned || inv.returnStatus === "PARTIAL" ? (
                                  <UIBadge variant="soft" color="warning" className="text-[9.5px] font-bold">
                                    Partially Returned
                                  </UIBadge>
                                ) : null}
                                <span className="text-xs text-text-muted font-medium">
                                  {dateFormatted}
                                </span>
                              </div>
                              <div className="text-[11.5px] text-text-muted truncate">
                                <span className="font-semibold text-text">{custName}</span>
                                {custPhone && (
                                  <span className="font-mono text-[10.5px] ml-1">
                                    ({custPhone})
                                  </span>
                                )}
                                {itemsSummary && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <span>{itemsSummary}{hasMoreItems ? "..." : ""}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0 flex items-center gap-3">
                              <div className="font-mono font-bold text-sm text-text tabular-nums">
                                {formatCurrency(billAmt)}
                              </div>
                              <UIButton
                                type="button"
                                size="sm"
                                variant="primary"
                                onClick={() => handleSelectInvoice(inv)}
                                className="cursor-pointer font-bold text-xs"
                              >
                                Select Bill
                              </UIButton>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </UIInfiniteScroll>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Selected Original Invoice Info Strip */
          <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-primary" />
                Original Sale Bill Selected
              </span>
              <UIButton
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  setOriginalInvoice(null);
                  setSelectedItems([]);
                }}
                className="text-xs text-text-muted hover:text-text cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="size-3" />
                Change Bill
              </UIButton>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-primary/15">
              <div>
                <span className="text-[10px] uppercase font-bold text-text-muted block">Bill No</span>
                <div className="font-mono font-bold text-primary text-sm mt-0.5">
                  #{originalInvoice.invoiceNo}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-text-muted block">Bill Date</span>
                <div className="font-semibold text-text mt-0.5">
                  {new Date(originalInvoice.date || originalInvoice.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-text-muted block">Customer</span>
                <div className="font-semibold text-text truncate mt-0.5">
                  {originalInvoice.customerId?.name || originalInvoice.customerName || "Walk-in Customer"}
                </div>
                {(originalInvoice.customerId?.phone || originalInvoice.customerId?.mobile || originalInvoice.customerPhone) && (
                  <div className="font-mono text-[10.5px] text-text-muted">
                    {originalInvoice.customerId?.phone || originalInvoice.customerId?.mobile || originalInvoice.customerPhone}
                  </div>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-text-muted block">Original Total</span>
                <div className="font-mono font-extrabold text-text text-sm mt-0.5">
                  {formatCurrency(originalInvoice.grandTotal || originalInvoice.amount)}
                </div>
              </div>
            </div>

            {/* Existing Return Invoices Mention / Audit */}
            {Array.isArray(originalInvoice.returnInvoices) && originalInvoice.returnInvoices.length > 0 && (
              <div className="pt-2 border-t border-primary/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap text-text-muted">
                  <RotateCcw className="size-3 text-rose-500 shrink-0" />
                  <span className="font-bold text-text">Return Memos Issued:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {originalInvoice.returnInvoices.map((r, rIdx) => (
                      <span
                        key={rIdx}
                        className="inline-flex items-center gap-1 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                      >
                        #{r.returnNo || r.invoiceNo}
                        <span className="text-[10px] text-text-muted font-normal">
                          ({formatCurrency(r.returnAmount)})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="font-mono text-[11px] text-rose-600 dark:text-rose-400 font-bold shrink-0">
                  Total Refunded: {formatCurrency(originalInvoice.totalReturnedAmount || originalInvoice.returnInvoices.reduce((s, r) => s + (Number(r.returnAmount) || 0), 0))}
                </div>
              </div>
            )}

            {/* Banner if entire invoice is fully returned */}
            {isInvoiceFullyReturned && (
              <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 mt-1">
                <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span className="font-medium">
                  All items from bill #{originalInvoice.invoiceNo} have already been fully returned. No further returns can be created against this bill.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Items to Return */}
        {originalInvoice && (
          <div className="border border-border rounded-xl overflow-hidden bg-surface space-y-0 shadow-2xs">
            <div className="px-3.5 py-2.5 bg-surface-alt/60 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold text-text flex items-center gap-1.5">
                <Boxes className="size-4 text-text-muted" />
                2. Select Items to Return ({activeReturnItems.length} selected)
              </span>
              <span className="text-[11px] text-text-muted font-medium">
                Adjust quantity to return
              </span>
            </div>

            <div className="divide-y divide-border max-h-[220px] overflow-y-auto">
              {selectedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className={cn(
                    "p-2.5 flex items-center justify-between gap-3 text-xs transition-colors",
                    item.isFullyReturned
                      ? "bg-surface-alt/20 opacity-70"
                      : item.isSelected
                      ? "bg-rose-500/5"
                      : "hover:bg-surface-alt/30"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={item.isSelected}
                      onChange={() => handleToggleItem(idx)}
                      disabled={item.isFullyReturned}
                      className={cn(
                        "rounded border-border size-4 transition-colors",
                        item.isFullyReturned
                          ? "opacity-30 cursor-not-allowed"
                          : "text-rose-600 focus:ring-rose-500 cursor-pointer"
                      )}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn("font-semibold truncate", item.isFullyReturned ? "text-text-muted line-through" : "text-text")}>
                          {item.name}
                        </span>
                        {item.isFullyReturned ? (
                          <UIBadge variant="soft" color="error" className="text-[9px] py-0 px-1 font-bold">
                            Already Returned ({item.returnedQty}/{item.soldQty})
                          </UIBadge>
                        ) : item.isPartiallyReturned ? (
                          <UIBadge variant="soft" color="warning" className="text-[9px] py-0 px-1 font-bold">
                            Partially Returned ({item.returnedQty}/{item.soldQty}) · {item.availableQty} left
                          </UIBadge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 text-[10.5px] text-text-muted font-mono mt-0.5">
                        <span>Batch: {item.batch}</span>
                        <span>·</span>
                        <span>Sold: {item.soldQty}</span>
                        {item.returnedQty > 0 && <span>· Returned: {item.returnedQty}</span>}
                        <span>·</span>
                        <span className={item.isFullyReturned ? "text-rose-500 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                          Avail: {item.availableQty}
                        </span>
                        <span>·</span>
                        <span>Rate: {formatCurrency(item.price)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-border rounded-lg overflow-hidden bg-surface">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(idx, -1)}
                        disabled={item.returnQty <= 0 || item.isFullyReturned}
                        className="p-1 px-2 hover:bg-surface-alt disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Minus className="size-3 text-text-secondary" />
                      </button>
                      <span className={cn("w-8 text-center font-mono font-bold text-xs", item.isFullyReturned ? "text-text-muted" : "text-text")}>
                        {item.returnQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(idx, 1)}
                        disabled={item.returnQty >= item.availableQty || item.isFullyReturned}
                        className="p-1 px-2 hover:bg-surface-alt disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Plus className="size-3 text-text-secondary" />
                      </button>
                    </div>

                    <div className="w-20 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(item.price * item.returnQty)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Refund Settlement */}
        {activeReturnItems.length > 0 && (
          <div className="p-3.5 rounded-xl border border-border bg-surface-alt/30 space-y-3">
            <label className="text-xs font-bold text-text">
              3. Refund Settlement Method
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRefundMode("Cash")}
                className={cn(
                  "p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer",
                  refundMode === "Cash"
                    ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-600 shadow-2xs"
                    : "border-border bg-surface text-text-muted hover:border-text-muted"
                )}
              >
                <Banknote className="size-4.5 text-emerald-600" />
                <span>Cash Drawer Refund</span>
                <span className="text-[10px] font-normal opacity-80">Dispense cash to customer immediately</span>
              </button>

              <button
                type="button"
                disabled={isWalkInReturn}
                onClick={() => !isWalkInReturn && setRefundMode("Credit")}
                title={isWalkInReturn ? "Credit Notes cannot be issued for Walk-in Customers" : undefined}
                className={cn(
                  "p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all",
                  isWalkInReturn
                    ? "border-border bg-surface-alt/50 text-text-muted/50 cursor-not-allowed opacity-60"
                    : refundMode === "Credit"
                    ? "border-indigo-600 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600 shadow-2xs cursor-pointer"
                    : "border-border bg-surface text-text-muted hover:border-text-muted cursor-pointer"
                )}
              >
                <Receipt className="size-4.5 text-indigo-600" />
                <span>Issue Credit Note</span>
                <span className="text-[10px] font-normal opacity-80">
                  {isWalkInReturn ? "Requires registered customer" : "Generate return voucher for future bills"}
                </span>
              </button>
            </div>

            {isWalkInReturn && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <Banknote className="size-4 text-emerald-600 shrink-0" />
                <span>Walk-in Customer return: Settled immediately via Cash Drawer refund. Credit notes require a registered phone number.</span>
              </div>
            )}

            {refundMode === "Cash" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-700 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Banknote className="size-4" />
                    <span>Cash will be deducted from drawer:</span>
                    <span className="font-mono font-bold">{formatCurrency(grandTotal)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDenomBreakdown((prev) => !prev)}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <SlidersHorizontal className="size-3" />
                    {showDenomBreakdown ? "Hide Notes" : "Adjust Notes"}
                  </button>
                </div>

                {/* Inline Denominations Note Counter */}
                {showDenomBreakdown && (
                  <div className="p-2.5 rounded-lg border border-border bg-surface space-y-2">
                    <div className="text-[11px] font-semibold text-text-muted flex justify-between">
                      <span>Specify notes dispensed:</span>
                      <span className="font-mono">
                        Notes Sum: <strong>{formatCurrency(denomTotal)}</strong>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {CURRENCY_DENOMINATIONS.map((d) => (
                        <div
                          key={d}
                          className="flex items-center justify-between border border-border rounded-lg p-1 px-1.5 text-xs bg-surface-alt/30"
                        >
                          <span className="font-bold text-[11px] font-mono">₹{d}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDenomChange(d, -1)}
                              className="w-5 h-5 rounded hover:bg-surface flex items-center justify-center font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-4 text-center font-mono font-bold text-xs">
                              {cashDenominations[d] || 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDenomChange(d, 1)}
                              className="w-5 h-5 rounded hover:bg-surface flex items-center justify-center font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {refundMode === "Credit" && (
              <div className="p-2.5 rounded-lg border border-purple-500/20 bg-purple-500/5 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <Receipt className="size-4 shrink-0" />
                <span>
                  An official <strong>Credit Note</strong> of{" "}
                  <strong>{formatCurrency(grandTotal)}</strong> will be issued to{" "}
                  <strong>{originalInvoice?.customerId?.name || originalInvoice?.customerName || "Customer"}</strong>.
                  This Credit Note can be redeemed against future purchases.
                </span>
              </div>
            )}

            

            <div>
              <input
                type="text"
                placeholder="Optional notes or reason for return (e.g. Expired / Wrong medicine)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-text"
              />
            </div>
          </div>
        )}

        {submitError && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}
      </div>
    </UIModal>
  );
};

export default CreateSalesReturnModal;
