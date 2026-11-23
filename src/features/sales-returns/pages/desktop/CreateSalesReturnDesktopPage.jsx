// src/features/sales-returns/pages/desktop/CreateSalesReturnDesktopPage.jsx

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
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
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Building2,
  Clock,
  Check,
  ShieldCheck,
  Package,
  Trash2,
  History,
  ShoppingCart,
  Pill,
  Archive,
} from "lucide-react";
import {
  UIButton,
  UIBadge,
  UIInfiniteScroll,
  UITabs,
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

const CURRENCY_DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1];
const BILLS_PAGE_SIZE = 10;

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const CreateSalesReturnDesktopPage = () => {
  const navigate = useNavigate();
  const { currentBranch } = useBranch();
  const { activeShift } = useActiveShift();

  // Active Customer state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  // Customer sales bills & pagination
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [isLoadingBills, setIsLoadingBills] = useState(false);
  const [billsPage, setBillsPage] = useState(1);
  const [hasMoreBills, setHasMoreBills] = useState(false);
  const [totalBillsCount, setTotalBillsCount] = useState(0);
  const [isLoadingMoreBills, setIsLoadingMoreBills] = useState(false);

  const activeBillsFetchIdRef = useRef(0);
  const medicineSearchRef = useRef(null);

  // Bill-wise Pickup Modal state
  const [selectedMedicineForPickup, setSelectedMedicineForPickup] = useState(null);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);

  // Return Cart Items
  const [cart, setCart] = useState([]);

  // Right Sidebar Tab: "summary" | "history"
  const [sidebarTab, setSidebarTab] = useState("summary");

  // Refund Settlement Mode: "Cash" | "Advance" | "Credit"
  const [refundMode, setRefundMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Cash Denominations
  const [cashDenominations, setCashDenominations] = useState({});
  const [showDenomBreakdown, setShowDenomBreakdown] = useState(false);

  // Reusable customer bills fetch
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

        // Query-based fallback if ID lookup returned empty
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
          console.error("Error loading customer bills:", err);
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

  // When customer is selected from B2cCustomerSearchBar
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
    setTimeout(() => {
      medicineSearchRef.current?.focus();
    }, 150);
  };

  const handleLoadMoreBills = () => {
    if (isLoadingMoreBills || !hasMoreBills || !selectedCustomer) return;
    fetchCustomerBills(selectedCustomer, billsPage + 1, true);
  };

  // Compute DISTINCT medicines from customer's previous sales bills
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
            pack: item.pack || item.packaging || "PCS",
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

  // When medicine is picked from search bar, open bill-wise selection modal
  const handleSelectMedicineFromSearch = (medicine) => {
    setSelectedMedicineForPickup(medicine);
    setIsPickupModalOpen(true);
  };

  // Add bill items into return cart
  const handleAddItemsToCart = (itemsToAdd) => {
    setCart((prevCart) => {
      const newCart = [...prevCart];

      for (const item of itemsToAdd) {
        // Unique line key by invoiceId + productId + batch
        const lineKey = `${item.invoiceId}-${item.productId}-${item.batch}`;
        const existingIdx = newCart.findIndex((i) => i.lineKey === lineKey);

        if (existingIdx >= 0) {
          const existing = newCart[existingIdx];
          const newQty = Math.min(
            item.availableQty,
            existing.returnQty + item.returnQty
          );
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

    setSidebarTab("summary");
    uiToast.success("Added to Return Cart", `Added ${itemsToAdd.length} return line(s) to cart.`);
  };

  // 1-Click Return item from Customer History panel
  const handleReturnFromHistory = (item, invoice) => {
    const soldQty = Number(item.qty || 1);
    const returnedQty = Number(item.returnedQty || 0);
    const availableQty = Math.max(0, soldQty - returnedQty);

    if (availableQty <= 0) {
      uiToast.warning("Item Already Returned", "All units from this bill have already been refunded.");
      return;
    }

    const rawPid = item.productId?._id || item.productId || item._id || item.id;
    const prodId = typeof rawPid === "string" && rawPid.includes("-") ? rawPid.split("-")[0] : rawPid;
    const name = item.name || item.productName || "Medicine";
    const batch = item.batch || item.batchNo || "STANDARD";
    const lineKey = `${invoice._id}-${prodId}-${batch}`;

    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.lineKey === lineKey);
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        if (existing.returnQty >= availableQty) {
          uiToast.info("Max Quantity Reached", `Max available units for this bill is ${availableQty}.`);
          return prev;
        }
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

    uiToast.success("Item Added", `Added 1 unit of ${name} from bill #${invoice.invoiceNo}`);
  };

  const handleCartMotiveChange = (lineKey, motive) => {
    setCart((prev) =>
      prev.map((item) => (item.lineKey === lineKey ? { ...item, motive } : item))
    );
  };

  // Adjust quantity in Cart
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

  // Remove single line from Cart
  const handleRemoveFromCart = (lineKey) => {
    setCart((prev) => prev.filter((item) => item.lineKey !== lineKey));
  };

  // Clear entire Cart
  const handleClearCart = () => {
    setCart([]);
  };

  // Calculations
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

  // Submit Sales Return Memo
  const handleSaveReturn = async () => {
    if (cart.length === 0) {
      setSubmitError("Return cart is empty. Please add items to return.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const branchId = currentBranch?._id || currentBranch?.id || cart[0]?.branchId;
      const customerId = selectedCustomer?._id || selectedCustomer?.id;

      // Group or take primary original bill
      const primaryBillId = cart[0]?.originalInvoiceId;
      const primaryBillNo = cart[0]?.originalInvoiceNo;

      const customerGstin = (selectedCustomer?.gstNumber || selectedCustomer?.gstin || "").trim().toUpperCase();
      const hasCustomerGst = customerGstin.length >= 15 && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(customerGstin);
      const originalBillingMode = cart[0]?.billingMode || "B2C";
      const effectiveBillingMode = (hasCustomerGst && String(originalBillingMode).toUpperCase() === "B2B") ? "B2B" : "B2C";

      const payload = {
        branchId,
        date: new Date().toISOString(),
        shiftId: activeShift?._id || null,
        originalInvoiceId: primaryBillId,
        originalInvoiceNo: primaryBillNo,
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
        returnMotive: cart.some((i) => i.motive === "expired" || i.motive === "broken")
          ? cart.some((i) => i.motive === "general")
            ? "mixed"
            : cart.find((i) => i.motive === "expired" || i.motive === "broken")?.motive || "expired"
          : "general",
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
        denominations: Object.entries(cashDenominations)
          .map(([val, qty]) => ({ denomination: Number(val), quantity: Number(qty) }))
          .filter((d) => d.quantity > 0),
      };

      const res = await salesReturnService.recordSalesReturn(payload, customerId);
      const saved = res?.data?.data || res?.data;

      uiToast.success(
        "Sales Return Processed",
        `Return memo #${saved?.returnNo || ""} created successfully.`
      );

      navigate(ROUTES.SALES_RETURNS, {
        state: { printReturn: saved },
      });
    } catch (err) {
      console.error("Save sales return error:", err);
      setSubmitError(err?.response?.data?.message || "Failed to process sales return memo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-surface-alt/40 overflow-hidden select-none">
      {/* ── TOP HEADER STRIP (POS Terminal Style) ── */}
      <header className="shrink-0 bg-surface border-b border-border px-5 py-2.5 shadow-2xs z-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UIButton
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate(ROUTES.SALES_RETURNS)}
            className="cursor-pointer"
          >
            Exit Terminal
          </UIButton>

          <div className="h-5 w-px bg-border" />

          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <RotateCcw className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-text tracking-tight">Sales Return Terminal</h1>
                <UIBadge variant="destructive" size="sm" className="text-[10px]">
                  Return POS
                </UIBadge>
              </div>
              <p className="text-[11px] text-text-muted">
                Search customer, lookup purchased medicines, and issue refunds
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Branch chip */}
          {currentBranch && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-surface-alt text-xs font-semibold text-text">
              <Building2 className="size-3.5 text-text-muted" />
              <span>{currentBranch.name || "Main Branch"}</span>
            </div>
          )}

          {/* Active Shift status */}
          <div className="flex items-center gap-1.5">
            {activeShift ? (
              <UIBadge variant="soft" color="success" className="text-xs flex items-center gap-1">
                <Clock className="size-3" />
                <span>Shift #{activeShift.shiftNumber || activeShift._id?.slice(-4)} Active</span>
              </UIBadge>
            ) : (
              <UIBadge variant="soft" color="warning" className="text-xs flex items-center gap-1">
                <AlertCircle className="size-3" />
                <span>No Active Shift</span>
              </UIBadge>
            )}
          </div>

          {/* Clear Cart button */}
          {cart.length > 0 && (
            <UIButton
              type="button"
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={handleClearCart}
              className="text-error hover:bg-rose-500/10 text-xs cursor-pointer"
            >
              Clear ({cart.length})
            </UIButton>
          )}
        </div>
      </header>

      {/* ── WORKSPACE SPLIT: Left Center (Cart + Search) & Right (Sidebar) ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ── LEFT & CENTER WORKSTATION (POS Terminal) ── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden border-r border-border bg-surface">
          {/* Customer Search Strip */}
          <div className="shrink-0 px-4 py-3 border-b border-border bg-surface-alt/20 space-y-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-[280px]">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                  1. Customer (Search by Name or Mobile) *
                </span>
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

              {selectedCustomer && (
                <div className="flex items-center gap-2 pt-4">
                  <UIButton
                    type="button"
                    variant={sidebarTab === "history" ? "primary" : "outline"}
                    size="sm"
                    icon={History}
                    onClick={() => setSidebarTab(sidebarTab === "history" ? "summary" : "history")}
                    className="cursor-pointer text-xs font-bold"
                  >
                    Bills History ({totalBillsCount})
                  </UIButton>

                  <UIButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearchTerm("");
                      setCustomerInvoices([]);
                      setCart([]);
                    }}
                    className="text-text-muted hover:text-text cursor-pointer text-xs"
                  >
                    Change
                  </UIButton>
                </div>
              )}
            </div>

            {/* Selected Customer Info Strip */}
            {selectedCustomer && (
              <div className="flex items-center gap-4 text-xs pt-1 text-text-muted flex-wrap">
                <span className="font-bold text-text">{selectedCustomer.name}</span>
                {selectedCustomer.mobile && (
                  <span className="font-mono text-[11px]">{selectedCustomer.mobile}</span>
                )}
                {selectedCustomer.gstNumber ? (
                  <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    GST: {selectedCustomer.gstNumber} · Registered
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Unregistered Party
                  </span>
                )}
                {selectedCustomer.advanceBalance > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-mono font-bold text-[10.5px] border border-blue-500/20">
                    Advance Balance: {formatCurrency(selectedCustomer.advanceBalance)}
                  </span>
                )}
                <span className="text-text-muted">
                  Purchased Medicines:{" "}
                  <strong className="text-primary font-bold">
                    {distinctPurchasedMedicines.length} distinct medicines
                  </strong>{" "}
                  across {totalBillsCount} bills
                </span>
              </div>
            )}
          </div>

          {/* Medicine Search Bar (Restricted exclusively to customer's purchased medicines) */}
          <div className="shrink-0 px-4 py-2.5 border-b border-border bg-surface-alt/40 flex items-center justify-between gap-4">
            <div className="w-full max-w-[620px]">
              <CustomerPurchasedMedicineSearchBar
                ref={medicineSearchRef}
                customer={selectedCustomer}
                distinctMedicines={distinctPurchasedMedicines}
                isLoading={isLoadingBills}
                onSelectMedicine={handleSelectMedicineFromSearch}
                placeholder={
                  selectedCustomer
                    ? `Search ${distinctPurchasedMedicines.length} purchased medicines (e.g. Dolo, Pan-D, Augmentin)...`
                    : "Select a customer above to search their purchased medicines..."
                }
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 text-xs text-text-muted font-medium">
              <span className="hidden lg:inline-block">
                {cart.length > 0 ? (
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {cart.length} item{cart.length > 1 ? "s" : ""} in Return Cart
                  </span>
                ) : (
                  <span>Ready to add return items</span>
                )}
              </span>
            </div>
          </div>

          {/* ── RETURN CART TABLE ── */}
          <div className="flex-1 overflow-y-auto">
            {cart.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 shadow-2xs">
                  <tr className="bg-surface-alt/95 backdrop-blur-xs border-b border-border/80 text-[10px] font-bold text-text-muted uppercase tracking-wider select-none">
                    <th className="py-2.5 px-3 text-center w-10">#</th>
                    <th className="py-2.5 px-3 min-w-[120px]">Original Bill</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Medicine / Item</th>
                    <th className="py-2.5 px-2 w-[100px]">Batch</th>
                    <th className="py-2.5 px-2 w-[70px]">Pack</th>
                    <th className="py-2.5 px-2 w-[70px]">Expiry</th>
                    <th className="py-2.5 px-2 w-[70px] font-mono text-center">Avail</th>
                    <th className="py-2.5 px-2 w-[110px] font-mono text-center">Return Qty</th>
                    <th className="py-2.5 px-2 w-[160px] font-mono text-center">Condition / Motive</th>
                    <th className="py-2.5 px-2 w-[85px] font-mono text-right">Rate</th>
                    <th className="py-2.5 px-2 w-[60px] font-mono text-center">GST%</th>
                    <th className="py-2.5 px-3 w-[110px] font-mono text-right">Refund Total</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {cart.map((item, idx) => (
                    <tr
                      key={item.lineKey || idx}
                      className="hover:bg-surface-hover transition-colors group"
                    >
                      {/* Row Index */}
                      <td className="py-2.5 px-3 text-center text-text-muted font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Original Bill # & Date */}
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-primary text-xs">
                          #{item.originalInvoiceNo}
                        </div>
                        {item.invoiceDate && (
                          <div className="text-[10px] text-text-muted">
                            {new Date(item.invoiceDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </div>
                        )}
                      </td>

                      {/* Medicine Name */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-text text-xs leading-snug">
                          {item.name}
                        </div>
                        {item.brand && (
                          <div className="text-[10.5px] text-text-muted">{item.brand}</div>
                        )}
                      </td>

                      {/* Batch */}
                      <td className="py-2.5 px-2">
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-alt border border-border text-text">
                          {item.batch || "STANDARD"}
                        </span>
                      </td>

                      {/* Pack */}
                      <td className="py-2.5 px-2 text-text-muted text-[11px]">
                        {item.pack || "PCS"}
                      </td>

                      {/* Expiry */}
                      <td className="py-2.5 px-2 text-text-muted font-mono text-[11px]">
                        {item.expiry || "—"}
                      </td>

                      {/* Available Qty */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {item.availableQty}
                      </td>

                      {/* Return Qty Stepper */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="inline-flex items-center border border-border rounded-lg overflow-hidden bg-surface shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleCartQtyChange(item.lineKey, -1)}
                            className="p-1 px-2 hover:bg-surface-alt transition-colors cursor-pointer text-text-secondary"
                            title="Decrease return quantity"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-xs text-text">
                            {item.returnQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCartQtyChange(item.lineKey, 1)}
                            disabled={item.returnQty >= item.availableQty}
                            className="p-1 px-2 hover:bg-surface-alt disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed text-text-secondary"
                            title="Increase return quantity"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </td>

                      {/* Condition / Motive Selector */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-border bg-surface-alt/50 text-[10.5px]">
                          <button
                            type="button"
                            onClick={() => handleCartMotiveChange(item.lineKey, "general")}
                            className={cn(
                              "px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer",
                              (item.motive || "general") === "general"
                                ? "bg-emerald-600 text-white shadow-2xs"
                                : "text-text-muted hover:text-text"
                            )}
                            title="General (Resellable) - Restock in current branch"
                          >
                            General
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCartMotiveChange(item.lineKey, "expired")}
                            className={cn(
                              "px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer",
                              item.motive === "expired"
                                ? "bg-amber-600 text-white shadow-2xs"
                                : "text-text-muted hover:text-text"
                            )}
                            title="Expired - Auto-transfer to Scrap Store"
                          >
                            Expired
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCartMotiveChange(item.lineKey, "broken")}
                            className={cn(
                              "px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer",
                              item.motive === "broken"
                                ? "bg-rose-600 text-white shadow-2xs"
                                : "text-text-muted hover:text-text"
                            )}
                            title="Broken / Damaged - Auto-transfer to Scrap Store"
                          >
                            Broken
                          </button>
                        </div>
                      </td>

                      {/* Rate */}
                      <td className="py-2.5 px-2 text-right font-mono text-text">
                        {formatCurrency(item.rate)}
                      </td>

                      {/* GST% */}
                      <td className="py-2.5 px-2 text-center font-mono text-text-muted text-[11px]">
                        {item.tax}%
                      </td>

                      {/* Refund Total */}
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-xs text-rose-600 dark:text-rose-400">
                        {formatCurrency(item.returnQty * item.rate)}
                      </td>

                      {/* Remove Action */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.lineKey)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-error hover:bg-error-soft/30 rounded-md transition-all cursor-pointer"
                          title="Remove item from return cart"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* Empty Cart State */
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-text-muted">
                <div className="size-16 rounded-2xl bg-surface-alt/70 border border-border flex items-center justify-center mb-3 text-text-muted">
                  <RotateCcw className="size-8 opacity-30 text-rose-500" />
                </div>
                <h3 className="font-bold text-text text-sm mb-1">Return Cart is Empty</h3>
                <p className="text-xs text-text-muted max-w-sm">
                  {!selectedCustomer
                    ? "Start by selecting a customer above. Then search their purchased medicines or pick items from their Bills History."
                    : "Search any medicine from the customer's purchase history above, or switch to the Bills History tab on the right to pick items directly."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL (360px): POS Style Sidebar (Summary vs Customer History) ── */}
        <div className="w-[360px] xl:w-[380px] shrink-0 flex flex-col min-h-0 bg-surface">
          {/* Sidebar Segmented Tabs */}
          <div className="p-3 border-b border-border bg-surface shrink-0">
            <div className="flex items-center gap-1 bg-surface-alt rounded-xl p-1 border border-border">
              <button
                type="button"
                onClick={() => setSidebarTab("summary")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  sidebarTab === "summary"
                    ? "bg-surface text-text shadow-2xs border border-border/80"
                    : "text-text-muted hover:text-text"
                )}
              >
                <Receipt className="size-3.5" />
                <span>Return Summary</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab("history")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  sidebarTab === "history"
                    ? "bg-surface text-text shadow-2xs border border-border/80"
                    : "text-text-muted hover:text-text"
                )}
              >
                <History className="size-3.5" />
                <span>Customer History</span>
                {totalBillsCount > 0 && (
                  <span className="size-4.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono flex items-center justify-center">
                    {totalBillsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tab 1: Return Summary & Settlement */}
          {sidebarTab === "summary" ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              <div className="p-4 space-y-4 flex-1">
                {/* Financial Overview Card */}
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2.5">
                  <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider block">
                    Total Refund Payable
                  </span>
                  <div className="font-mono font-black text-2xl text-rose-600 dark:text-rose-400 leading-none">
                    {formatCurrency(grandTotal)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rose-500/15 text-[11px] text-text-muted font-mono">
                    <div>
                      <span>Lines: </span>
                      <strong className="text-text">{cart.length}</strong>
                    </div>
                    <div>
                      <span>Units: </span>
                      <strong className="text-text">
                        {cart.reduce((s, i) => s + i.returnQty, 0)}
                      </strong>
                    </div>
                    <div>
                      <span>Taxable: </span>
                      <strong className="text-text">{formatCurrency(cartSubtotal - cartTotalGst)}</strong>
                    </div>
                    <div>
                      <span>GST Rev: </span>
                      <strong className="text-text">{formatCurrency(cartTotalGst)}</strong>
                    </div>
                  </div>
                </div>

                {/* Scrap Store Auto-Transfer Notice */}
                {hasScrapItems && (
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Archive className="size-4 text-amber-600 shrink-0" />
                      <span>Scrap Store Transfer Notice</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                      <strong>{scrapItemsCount} scrap item(s)</strong> marked as Expired or Broken will be automatically transferred to the <strong>Scrap Store</strong> branch to preserve active branch inventory.
                    </p>
                  </div>
                )}

                {/* Refund Settlement Mode Selection */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-text uppercase tracking-wider block">
                    Refund Settlement Method
                  </span>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setRefundMode("Cash")}
                      className={cn(
                        "p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer",
                        refundMode === "Cash"
                          ? "border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-600 font-bold"
                          : "border-border bg-surface text-text-muted hover:border-text-muted"
                      )}
                    >
                      <div className="size-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Banknote className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-text">Cash Drawer Refund</div>
                        <div className="text-[10.5px] text-text-muted font-normal">Dispense cash from drawer</div>
                      </div>
                      {refundMode === "Cash" && <Check className="size-4 text-emerald-600 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setRefundMode("Advance")}
                      className={cn(
                        "p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer",
                        refundMode === "Advance"
                          ? "border-blue-600 bg-blue-500/10 text-blue-800 dark:text-blue-300 ring-1 ring-blue-600 font-bold"
                          : "border-border bg-surface text-text-muted hover:border-text-muted"
                      )}
                    >
                      <div className="size-8 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Wallet className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-text">Customer Advance Credit</div>
                        <div className="text-[10.5px] text-text-muted font-normal">Credit to customer ledger</div>
                      </div>
                      {refundMode === "Advance" && <Check className="size-4 text-blue-600 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setRefundMode("Credit")}
                      className={cn(
                        "p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer",
                        refundMode === "Credit"
                          ? "border-purple-600 bg-purple-500/10 text-purple-800 dark:text-purple-300 ring-1 ring-purple-600 font-bold"
                          : "border-border bg-surface text-text-muted hover:border-text-muted"
                      )}
                    >
                      <div className="size-8 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Receipt className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-text">Credit Note Voucher</div>
                        <div className="text-[10.5px] text-text-muted font-normal">Issue official voucher</div>
                      </div>
                      {refundMode === "Credit" && <Check className="size-4 text-purple-600 shrink-0" />}
                    </button>
                  </div>
                </div>

                {/* Cash Denominations breakdown */}
                {refundMode === "Cash" && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted font-medium">Currency Notes:</span>
                      <button
                        type="button"
                        onClick={() => setShowDenomBreakdown((prev) => !prev)}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <SlidersHorizontal className="size-3" />
                        {showDenomBreakdown ? "Hide Notes" : "Adjust Notes"}
                      </button>
                    </div>

                    {showDenomBreakdown && (
                      <div className="p-2.5 rounded-xl border border-border bg-surface-alt/30 space-y-2">
                        <div className="text-[10.5px] font-semibold text-text-muted flex justify-between">
                          <span>Dispensed Notes:</span>
                          <span className="font-mono">
                            Sum: <strong className="text-text">{formatCurrency(denomTotal)}</strong>
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {CURRENCY_DENOMINATIONS.map((d) => (
                            <div
                              key={d}
                              className="flex items-center justify-between border border-border rounded-lg p-1 text-xs bg-surface"
                            >
                              <span className="font-bold text-[10px] font-mono text-text">₹{d}</span>
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleDenomChange(d, -1)}
                                  className="size-4 rounded hover:bg-surface-alt flex items-center justify-center font-bold cursor-pointer text-text-secondary"
                                >
                                  -
                                </button>
                                <span className="w-3 text-center font-mono font-bold text-[11px] text-text">
                                  {cashDenominations[d] || 0}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDenomChange(d, 1)}
                                  className="size-4 rounded hover:bg-surface-alt flex items-center justify-center font-bold cursor-pointer text-text-secondary"
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

                {/* Return Reason / Notes */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                    Reason / Return Memo Notes:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Expired, wrong item, prescription adjusted..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-text"
                  />
                </div>

                {submitError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>

              {/* Sticky Bottom Actions */}
              <div className="p-3.5 border-t border-border bg-surface shrink-0 space-y-2">
                <UIButton
                  type="button"
                  variant="destructive"
                  size="lg"
                  icon={RotateCcw}
                  onClick={handleSaveReturn}
                  loading={isSubmitting}
                  disabled={cart.length === 0 || isSubmitting}
                  className="w-full justify-center font-bold text-sm cursor-pointer shadow-sm"
                >
                  Confirm Return & Refund ({formatCurrency(grandTotal)})
                </UIButton>
              </div>
            </div>
          ) : (
            /* Tab 2: Customer History Panel (same container) */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
        </div>
      </div>

      {/* ── BILL-WISE MEDICINE PICKUP MODAL ── */}
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

export default CreateSalesReturnDesktopPage;
