// src/features/sales-returns/pages/mobile/CreateSalesReturnMobilePage.jsx

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RotateCcw,
  Banknote,
  Wallet,
  Receipt,
  AlertCircle,
  Plus,
  Minus,
  SlidersHorizontal,
  User,
  Search,
  CheckCircle2,
  ChevronRight,
  Loader2,
  RefreshCw,
  Clock,
  Check,
  History,
  Trash2,
  Archive,
} from "lucide-react";
import {
  UIButton,
  UIBadge,
  UIInfiniteScroll,
  uiToast,
} from "@/components/ui";
import { B2cCustomerSearchBar } from "@/features/parties/customers/components/B2cCustomerSearchBar";
import CustomerPurchasedMedicineSearchBar from "../../components/CustomerPurchasedMedicineSearchBar";
import BillWiseMedicinePickupModal from "../../components/BillWiseMedicinePickupModal";
import SalesReturnCustomerHistory from "../../components/SalesReturnCustomerHistory";
import invoiceService from "@/features/sales/services/invoiceService";
import salesReturnService from "../../services/salesReturnService";
import useBranch from "@/features/branch/hooks/useBranch";
import { useActiveShift } from "@/features/operations/shifts/hooks/useActiveShift";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

const BILLS_PAGE_SIZE = 10;

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const CreateSalesReturnMobilePage = () => {
  const navigate = useNavigate();
  const { currentBranch } = useBranch();
  const { activeShift } = useActiveShift();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [isLoadingBills, setIsLoadingBills] = useState(false);
  const [billsPage, setBillsPage] = useState(1);
  const [hasMoreBills, setHasMoreBills] = useState(false);
  const [totalBillsCount, setTotalBillsCount] = useState(0);
  const [isLoadingMoreBills, setIsLoadingMoreBills] = useState(false);

  const [activeTab, setActiveTab] = useState("cart"); // "cart" | "history"

  const [selectedMedicineForPickup, setSelectedMedicineForPickup] = useState(null);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);

  const [cart, setCart] = useState([]);
  const [refundMode, setRefundMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const activeBillsFetchIdRef = useRef(0);

  const fetchCustomerBills = useCallback(
    async (targetCust, targetPage = 1, isAppending = false) => {
      const custId = targetCust?._id || targetCust?.id;
      if (!custId && !targetCust?.name && !targetCust?.mobile && !targetCust?.phone) {
        setCustomerInvoices([]);
        setHasMoreBills(false);
        setTotalBillsCount(0);
        return;
      }

      const fetchId = ++activeBillsFetchIdRef.current;
      if (isAppending) {
        setIsLoadingMoreBills(true);
      } else {
        setIsLoadingBills(true);
      }

      try {
        let invoices = [];
        let total = 0;

        if (custId && custId !== "walkin") {
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

        if (invoices.length === 0) {
          const queryTerm = targetCust.phone || targetCust.mobile || targetCust.name;
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
        }
      } catch (err) {
        if (activeBillsFetchIdRef.current === fetchId) {
          console.error("Error loading bills:", err);
        }
      } finally {
        if (activeBillsFetchIdRef.current === fetchId) {
          setIsLoadingBills(false);
          setIsLoadingMoreBills(false);
        }
      }
    },
    []
  );

  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setCart([]);
    setSubmitError(null);

    if (!cust) {
      setCustomerInvoices([]);
      setTotalBillsCount(0);
      setHasMoreBills(false);
      return;
    }

    fetchCustomerBills(cust, 1, false);
  };

  const handleLoadMoreBills = () => {
    if (isLoadingMoreBills || !hasMoreBills || !selectedCustomer) return;
    fetchCustomerBills(selectedCustomer, billsPage + 1, true);
  };

  const distinctPurchasedMedicines = useMemo(() => {
    if (!customerInvoices || customerInvoices.length === 0) return [];

    const map = new Map();

    for (const inv of customerInvoices) {
      for (const item of (inv.items || [])) {
        const rawPid = item.productId?._id || item.productId || item._id || item.id;
        const prodId = typeof rawPid === "string" && rawPid.includes("-") ? rawPid.split("-")[0] : rawPid;
        const name = item.name || item.productName || item.productId?.name || "Product";
        const key = `${prodId || ""}-${name.toLowerCase().trim()}`;

        const soldQty = Number(item.qty || 1);
        const returnedQty = Number(item.returnedQty || 0);
        const availableQty = Math.max(0, soldQty - returnedQty);

        if (!map.has(key)) {
          map.set(key, {
            key,
            productId: prodId,
            name,
            brand: item.brand || item.manufacturer || item.productId?.brand || "",
            category: item.category || item.productId?.category || "",
            pack: item.pack || "PCS",
            totalSoldQty: 0,
            totalReturnedQty: 0,
            totalAvailableQty: 0,
            bills: [],
          });
        }

        const entry = map.get(key);
        entry.totalSoldQty += soldQty;
        entry.totalReturnedQty += returnedQty;
        entry.totalAvailableQty += availableQty;

        entry.bills.push({
          invoiceId: inv._id,
          invoiceNo: inv.invoiceNo,
          date: inv.date || inv.createdAt,
          billingMode: inv.billingMode || "B2C",
          productId: prodId,
          name,
          batch: item.batch || item.batchNo || "STANDARD",
          batchId: item.batchId || item.batch_id,
          expiry: item.expiry || item.expiryDate || "—",
          pack: item.pack || entry.pack,
          rack: item.rack || "",
          mrp: Number(item.mrp || 0),
          rate: Number(item.rate || item.price || 0),
          tax: Number(item.tax || item.gst || 5),
          soldQty,
          returnedQty,
          availableQty,
          isFullyReturned: availableQty <= 0,
        });
      }
    }

    return Array.from(map.values());
  }, [customerInvoices]);

  const handleSelectMedicineFromSearch = (medicine) => {
    setSelectedMedicineForPickup(medicine);
    setIsPickupModalOpen(true);
  };

  const handleAddItemsToCart = (itemsToAdd) => {
    setCart((prevCart) => {
      const newCart = [...prevCart];
      for (const item of itemsToAdd) {
        const itemMotive = item.motive || "general";
        const lineKey = `${item.invoiceId}-${item.productId}-${item.batch}-${itemMotive}`;
        const existingIdx = newCart.findIndex((i) => i.lineKey === lineKey);
        if (existingIdx >= 0) {
          const existing = newCart[existingIdx];
          const newQty = Math.min(item.availableQty, existing.returnQty + item.returnQty);
          newCart[existingIdx] = {
            ...existing,
            returnQty: newQty,
            refundAmount: newQty * existing.rate,
          };
        } else {
          newCart.push({
            lineKey,
            originalInvoiceId: item.invoiceId,
            originalInvoiceNo: item.invoiceNo,
            invoiceDate: item.date,
            billingMode: item.billingMode,
            productId: item.productId,
            name: item.name,
            batch: item.batch,
            batchId: item.batchId,
            expiry: item.expiry,
            pack: item.pack,
            rack: item.rack,
            mrp: item.mrp,
            rate: item.rate,
            tax: item.tax,
            soldQty: item.soldQty,
            returnedQty: item.returnedQty,
            availableQty: item.availableQty,
            returnQty: item.returnQty,
            motive: item.motive || "general",
            refundAmount: item.refundAmount || item.returnQty * item.rate,
          });
        }
      }
      return newCart;
    });

    setActiveTab("cart");
    uiToast.success("Added to Cart", `Added ${itemsToAdd.length} item(s)`);
  };

  const handleReturnFromHistory = (item, invoice) => {
    const soldQty = Number(item.qty || 1);
    const returnedQty = Number(item.returnedQty || 0);
    const availableQty = Math.max(0, soldQty - returnedQty);

    if (availableQty <= 0) {
      uiToast.warning("Item Returned", "Units from this bill have already been refunded.");
      return;
    }

    const rawPid = item.productId?._id || item.productId || item._id || item.id;
    const prodId = typeof rawPid === "string" && rawPid.includes("-") ? rawPid.split("-")[0] : rawPid;
    const name = item.name || item.productName || "Medicine";
    const batch = item.batch || item.batchNo || "STANDARD";
    const lineKey = `${invoice._id}-${prodId}-${batch}-general`;

    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.lineKey === lineKey);
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        if (existing.returnQty >= availableQty) return prev;
        const updated = [...prev];
        const nextQty = existing.returnQty + 1;
        updated[existingIdx] = {
          ...existing,
          returnQty: nextQty,
          refundAmount: nextQty * existing.rate,
        };
        return updated;
      }

      return [
        ...prev,
        {
          lineKey,
          originalInvoiceId: invoice._id,
          originalInvoiceNo: invoice.invoiceNo,
          invoiceDate: invoice.date || invoice.createdAt,
          billingMode: invoice.billingMode || "B2C",
          productId: prodId,
          name,
          batch,
          batchId: item.batchId || item.batch_id,
          expiry: item.expiry || item.expiryDate || "—",
          pack: item.pack || "PCS",
          rack: item.rack || "",
          mrp: Number(item.mrp || 0),
          rate: Number(item.rate || item.price || 0),
          tax: Number(item.tax || item.gst || 5),
          soldQty,
          returnedQty,
          availableQty,
          returnQty: 1,
          motive: "general",
          refundAmount: Number(item.rate || item.price || 0),
        },
      ];
    });

    uiToast.success("Added", `1 unit of ${name}`);
  };

  const handleCartMotiveChange = (lineKey, motive) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.lineKey !== lineKey) return item;
        const newLineKey = `${item.originalInvoiceId}-${item.productId}-${item.batch}-${motive}`;
        return { ...item, motive, lineKey: newLineKey };
      })
    );
  };

  const handleCartQtyChange = (lineKey, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.lineKey !== lineKey) return item;
          const nextQty = Math.max(0, Math.min(item.availableQty, item.returnQty + delta));
          return {
            ...item,
            returnQty: nextQty,
            refundAmount: nextQty * item.rate,
          };
        })
        .filter((item) => item.returnQty > 0)
    );
  };

  const handleRemoveFromCart = (lineKey) => {
    setCart((prev) => prev.filter((item) => item.lineKey !== lineKey));
  };

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.rate * i.returnQty, 0),
    [cart]
  );

  const cartTotalGst = useMemo(() => {
    return cart.reduce((sum, i) => {
      const itemTotal = i.rate * i.returnQty;
      const rate = Number(i.tax) || 0;
      return sum + (itemTotal * rate) / (100 + rate);
    }, 0);
  }, [cart]);

  const grandTotal = Math.round(cartSubtotal);

  const hasScrapItems = useMemo(
    () => cart.some((i) => i.motive === "expired" || i.motive === "broken"),
    [cart]
  );

  const scrapItemsCount = useMemo(
    () =>
      cart
        .filter((i) => i.motive === "expired" || i.motive === "broken")
        .reduce((sum, i) => sum + i.returnQty, 0),
    [cart]
  );

  const handleSaveReturn = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const branchId = currentBranch?._id || currentBranch?.id || cart[0]?.branchId;
      const customerId = selectedCustomer?._id || selectedCustomer?.id;

      const customerGstin = (selectedCustomer?.gstNumber || selectedCustomer?.gstin || "").trim().toUpperCase();
      const hasCustomerGst = customerGstin.length >= 15 && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(customerGstin);
      const originalBillingMode = cart[0]?.billingMode || "B2C";
      const effectiveBillingMode = (hasCustomerGst && String(originalBillingMode).toUpperCase() === "B2B") ? "B2B" : "B2C";

      const payload = {
        branchId,
        date: new Date().toISOString(),
        shiftId: activeShift?._id || null,
        originalInvoiceId: cart[0]?.originalInvoiceId,
        originalInvoiceNo: cart[0]?.originalInvoiceNo,
        billingMode: effectiveBillingMode,
        customerGstin: customerGstin || undefined,
        subtotal: cartSubtotal,
        tax: cartTotalGst,
        grandTotal,
        returnType:
          refundMode === "Advance"
            ? "advance_credit"
            : refundMode === "Credit"
            ? "credit_note"
            : "cash_refund",
        paymentMethod: refundMode,
        refundMethod: refundMode,
        notes: notes || `Sales return memo for ${selectedCustomer?.name || "Customer"}`,
        returnMotive: (() => {
          const distinctMotives = new Set(cart.map((i) => i.motive || "general"));
          return distinctMotives.size > 1
            ? "mixed"
            : (distinctMotives.values().next().value || "general");
        })(),
        items: cart.map((i) => ({
          originalInvoiceId: i.originalInvoiceId,
          originalInvoiceNo: i.originalInvoiceNo,
          productId: i.productId,
          batchId: i.batchId,
          batchNo: i.batch,
          name: i.name,
          pack: i.pack,
          expiry: i.expiry,
          price: i.rate,
          rate: i.rate,
          mrp: i.mrp,
          qty: i.returnQty,
          gst: i.tax,
          total: i.rate * i.returnQty,
          motive: i.motive || "general",
        })),
      };

      const res = await salesReturnService.recordSalesReturn(payload, customerId);
      const saved = res?.data?.data || res?.data;

      uiToast.success(
        "Sales Return Processed",
        `Return memo #${saved?.returnNo || ""} created.`
      );

      navigate(ROUTES.SALES_RETURNS, {
        state: { printReturn: saved },
      });
    } catch (err) {
      console.error("Save return error:", err);
      setSubmitError(err?.response?.data?.message || "Failed to process return.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-alt/40 flex flex-col pb-28">
      {/* Mobile Top Header */}
      <div className="sticky top-0 z-20 px-4 py-3 bg-surface border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(ROUTES.SALES_RETURNS)}
            className="p-1 -ml-1 text-text-muted hover:text-text cursor-pointer"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-text">Return Terminal</h1>
            <p className="text-[11px] text-text-muted">POS Customer Returns</p>
          </div>
        </div>

        {selectedCustomer && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "cart" ? "history" : "cart")}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-border bg-surface-alt text-primary flex items-center gap-1"
            >
              <History className="size-3.5" />
              <span>{activeTab === "cart" ? `Bills (${totalBillsCount})` : "Cart"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-3 space-y-3">
        {/* Customer Search */}
        <div className="p-3 rounded-xl border border-border bg-surface space-y-2 shadow-2xs">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
            Customer
          </span>
          <B2cCustomerSearchBar
            value={customerSearchTerm}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={handleSelectCustomer}
            onInputChange={(val) => {
              setCustomerSearchTerm(val);
              if (selectedCustomer) setSelectedCustomer(null);
            }}
            placeholder="Search customer by name or phone..."
            size="sm"
            showAddNewAction={false}
            className="w-full"
          />

          {selectedCustomer && (
            <div className="text-[11px] text-text-muted flex justify-between pt-1">
              <span className="font-bold text-text">{selectedCustomer.name}</span>
              <span>{distinctPurchasedMedicines.length} distinct medicines</span>
            </div>
          )}
        </div>

        {/* Medicine Search Bar */}
        {selectedCustomer && activeTab === "cart" && (
          <div className="space-y-1">
            <CustomerPurchasedMedicineSearchBar
              customer={selectedCustomer}
              distinctMedicines={distinctPurchasedMedicines}
              isLoading={isLoadingBills}
              onSelectMedicine={handleSelectMedicineFromSearch}
              placeholder="Search purchased medicines..."
            />
          </div>
        )}

        {/* Cart View or History View */}
        {activeTab === "cart" ? (
          <div className="space-y-3">
            {/* Cart Items */}
            {cart.length > 0 ? (
              <div className="p-3 rounded-xl border border-border bg-surface space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-text uppercase">
                  <span>Return Cart ({cart.length})</span>
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-error font-semibold text-[11px]"
                  >
                    Clear All
                  </button>
                </div>

                <div className="divide-y divide-border/60">
                  {cart.map((item) => (
                    <div key={item.lineKey} className="py-2.5 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-text truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-text-muted font-mono flex items-center gap-1.5">
                            <span className="text-primary font-bold">#{item.originalInvoiceNo}</span>
                            <span>•</span>
                            <span>Batch: {item.batch}</span>
                            <span>•</span>
                            <span>Avail: {item.availableQty}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.lineKey)}
                          className="p-1 text-text-muted hover:text-error"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-border rounded-lg bg-surface">
                          <button
                            type="button"
                            onClick={() => handleCartQtyChange(item.lineKey, -1)}
                            className="p-1 px-2 text-text-secondary"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-xs text-text">
                            {item.returnQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCartQtyChange(item.lineKey, 1)}
                            disabled={item.returnQty >= item.availableQty}
                            className="p-1 px-2 text-text-secondary disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>

                        {/* Motive Selector */}
                        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-border bg-surface-alt/40 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleCartMotiveChange(item.lineKey, "general")}
                            className={cn(
                              "px-1.5 py-0.5 rounded font-semibold transition-all",
                              (item.motive || "general") === "general"
                                ? "bg-emerald-600 text-white"
                                : "text-text-muted hover:text-text"
                            )}
                          >
                            General
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCartMotiveChange(item.lineKey, "expired")}
                            className={cn(
                              "px-1.5 py-0.5 rounded font-semibold transition-all",
                              item.motive === "expired"
                                ? "bg-amber-600 text-white"
                                : "text-text-muted hover:text-text"
                            )}
                          >
                            Expired
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCartMotiveChange(item.lineKey, "broken")}
                            className={cn(
                              "px-1.5 py-0.5 rounded font-semibold transition-all",
                              item.motive === "broken"
                                ? "bg-rose-600 text-white"
                                : "text-text-muted hover:text-text"
                            )}
                          >
                            Broken
                          </button>
                        </div>

                        <div className="font-mono font-bold text-xs text-rose-600">
                          {formatCurrency(item.returnQty * item.rate)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Scrap Store Auto-Transfer Notice */}
                {hasScrapItems && (
                  <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Archive className="size-3.5 text-amber-600 shrink-0" />
                      <span>Scrap Store Transfer ({scrapItemsCount} items)</span>
                    </div>
                    <p className="text-[10.5px] leading-snug text-amber-800/90 dark:text-amber-300/90">
                      Expired/broken medicines will be transferred to <strong>Scrap Store</strong> branch.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-text-muted bg-surface rounded-xl border border-dashed border-border">
                {selectedCustomer
                  ? "Search purchased medicines above or pick from customer bills."
                  : "Select a customer to begin."}
              </div>
            )}

            {/* Refund Settlement Mode */}
            {cart.length > 0 && (
              <div className="p-3 rounded-xl border border-border bg-surface space-y-2.5 shadow-2xs">
                <span className="text-[11px] font-bold text-text uppercase tracking-wider block">
                  Refund Method
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundMode("Cash")}
                    className={cn(
                      "p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1",
                      refundMode === "Cash"
                        ? "border-emerald-600 bg-emerald-500/10 text-emerald-700"
                        : "border-border text-text-muted"
                    )}
                  >
                    <Banknote className="size-4" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundMode("Advance")}
                    className={cn(
                      "p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1",
                      refundMode === "Advance"
                        ? "border-blue-600 bg-blue-500/10 text-blue-700"
                        : "border-border text-text-muted"
                    )}
                  >
                    <Wallet className="size-4" />
                    <span>Advance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundMode("Credit")}
                    className={cn(
                      "p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1",
                      refundMode === "Credit"
                        ? "border-purple-600 bg-purple-500/10 text-purple-700"
                        : "border-border text-text-muted"
                    )}
                  >
                    <Receipt className="size-4" />
                    <span>Credit Note</span>
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Optional notes or return reason..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-border bg-surface"
                />
              </div>
            )}
          </div>
        ) : (
          /* Customer History View */
          <div className="rounded-xl border border-border bg-surface overflow-hidden min-h-[400px]">
            <SalesReturnCustomerHistory
              customer={selectedCustomer}
              invoices={customerInvoices}
              loading={isLoadingBills}
              loadingMore={isLoadingMoreBills}
              hasMore={hasMoreBills}
              totalCount={totalBillsCount}
              onLoadMore={handleLoadMoreBills}
              onReturnItem={handleReturnFromHistory}
            />
          </div>
        )}

        {submitError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-surface border-t border-border flex items-center justify-between gap-3 shadow-lg">
        <div>
          <div className="text-[10px] uppercase font-bold text-text-muted">Total Refund</div>
          <div className="text-base font-mono font-extrabold text-rose-600">
            {formatCurrency(grandTotal)}
          </div>
        </div>

        <UIButton
          type="button"
          variant="destructive"
          size="md"
          icon={RotateCcw}
          onClick={handleSaveReturn}
          loading={isSubmitting}
          disabled={cart.length === 0 || isSubmitting}
          className="font-bold text-xs"
        >
          Confirm Return
        </UIButton>
      </div>

      {/* Bill-wise Pickup Modal */}
      {selectedMedicineForPickup && (
        <BillWiseMedicinePickupModal
          open={isPickupModalOpen}
          isOpen={isPickupModalOpen}
          medicine={selectedMedicineForPickup}
          onClose={() => {
            setIsPickupModalOpen(false);
            setSelectedMedicineForPickup(null);
          }}
          onAddItemsToCart={handleAddItemsToCart}
        />
      )}
    </div>
  );
};

export default CreateSalesReturnMobilePage;
