// src/features/billing/pages/POSTerminalPage.jsx

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  Building2,
  CreditCard,
  Banknote,
  Smartphone,
  Landmark,
  Receipt,
  X,
  Check,
  ChevronDown,
  Package,
  Hash,
  Loader2,
  Keyboard,
  Clock,
  Percent,
  IndianRupee,
  BadgePercent,
  ArrowLeft,
  FileText,
  Zap,
  Store,
  Plus,
  Info,
} from "lucide-react";
import CustomerDialog from "@/features/parties/customers/components/CustomerDialog";
import { cn } from "@/lib/utils";
import customerService from "@/features/parties/customers/services/customerService";
import invoiceService from "@/features/sales/services/invoiceService";
import workspaceProductService from "@/features/workspace-products/services/workspaceProductService";
import branchCashService from "@/features/finance/treasury/cash-management/branch-cash/services/branchCashService";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useActiveShift } from "@/features/operations/shifts/hooks/useActiveShift";
import useBranch from "@/features/branch/hooks/useBranch";
import { API_STATUS } from "@/constants";
import { getOpenBusinessDay } from "@/features/operations/business-days/store/businessDayThunk";
import OpenBusinessDayDialog from "@/features/operations/business-days/components/OpenBusinessDayDialog";
import { CreateShiftDialog } from "@/features/operations/shifts/components/CreateShiftDialog";
import { POSCashDenominationModal } from "../components/POSCashDenominationModal";
import { UIBadge, UIButton } from "@/components/ui";
import { CalendarDays, ArrowRight, Sparkles } from "lucide-react";
/* ─────────────── CONSTANTS ─────────────── */
const BILLING_MODES = [
  { id: "B2C", label: "B2C · Retail", icon: User, description: "Walk-in customers" },
  { id: "B2B", label: "B2B · Party", icon: Building2, description: "Wholesale / Retailers" },
];

const PAYMENT_METHODS = [
  { id: "Cash", label: "Cash", icon: Banknote, color: "text-emerald-500" },
  { id: "UPI", label: "UPI", icon: Smartphone, color: "text-violet-500" },
  { id: "Card", label: "Card", icon: CreditCard, color: "text-blue-500" },
  { id: "Bank Transfer", label: "Bank", icon: Landmark, color: "text-amber-500" },
  { id: "Credit", label: "Credit", icon: FileText, color: "text-rose-500" },
];

const B2B_CUSTOMER_TYPES = ["wholesale", "hospital", "clinic", "corporate", "other"];

const CUSTOMER_TYPE_BADGES = {
  wholesale: { label: "Wholesale", color: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
  hospital: { label: "Hospital", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  clinic: { label: "Clinic", color: "bg-teal-500/15 text-teal-400 border-teal-500/20" },
  corporate: { label: "Corporate", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  other: { label: "Other", color: "bg-neutral-500/15 text-neutral-400 border-neutral-500/20" },
  retail: { label: "Retail", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
};

/* ─────────────── HELPERS ─────────────── */
const generateInvoiceNo = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `POS-${yy}${mm}-${seq}`;
};

const formatCurrency = (val) =>
  `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatTime = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

const formatDate = () =>
  new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

/* ─────────────── DEBOUNCE HOOK ─────────────── */
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────── */
export const POSTerminalPage = () => {
  const dispatch = useDispatch();
  const { currentBranch } = useBranch();
  const { activeShift, status: shiftStatus } = useActiveShift(currentBranch?._id);
  const { openBusinessDay } = useSelector((state) => state.businessDay);
  const navigate = useNavigate();
  const location = useLocation();
  const initialInvoice = location.state?.invoice;
  const invoiceId = initialInvoice?._id || initialInvoice?.id;
  const isEditMode = Boolean(initialInvoice);

  const [isBusinessDayModalOpen, setIsBusinessDayModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  useEffect(() => {
    if (currentBranch?._id) {
      dispatch(getOpenBusinessDay(currentBranch._id));
    }
  }, [currentBranch?._id, dispatch]);

  /* ── Clock ── */
  const [currentTime, setCurrentTime] = useState(formatTime());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(formatTime()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Invoice ── */
  const [invoiceNo] = useState(() => initialInvoice?.invoiceNo || generateInvoiceNo());

  /* ── Billing Mode ── */
  const [billingMode, setBillingMode] = useState(initialInvoice?.billingMode || "B2C");

  /* ── Customer (B2C) ── */
  const [b2cName, setB2cName] = useState(initialInvoice?.billingMode !== "B2B" ? (initialInvoice?.customer || "") : "");
  const [b2cPhone, setB2cPhone] = useState(initialInvoice?.billingMode !== "B2B" ? (initialInvoice?.phone || "") : "");

  /* ── Customer (B2B) ── */
  const [b2bSearchQuery, setB2bSearchQuery] = useState(initialInvoice?.billingMode === "B2B" ? (initialInvoice?.customer || "") : "");
  const [b2bResults, setB2bResults] = useState([]);
  const [b2bSearching, setB2bSearching] = useState(false);
  const [b2bDropdownOpen, setB2bDropdownOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState(initialInvoice?.billingMode === "B2B" ? { name: initialInvoice?.customer, mobile: initialInvoice?.phone, _id: initialInvoice?.customerId || "legacy" } : null);
  const [customerViewDialogOpen, setCustomerViewDialogOpen] = useState(false);
  const debouncedB2bQuery = useDebounce(b2bSearchQuery, 300);
  const b2bInputRef = useRef(null);
  const b2bDropdownRef = useRef(null);

  /* ── Product Search ── */
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [productSearching, setProductSearching] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const debouncedProductQuery = useDebounce(productQuery, 300);
  const productInputRef = useRef(null);
  const productDropdownRef = useRef(null);

  /* ── Cart ── */
  const [cartItems, setCartItems] = useState(() => {
    if (!initialInvoice?.items) return [];
    return initialInvoice.items.map(item => ({
      productId: item.productId || item.id || `legacy-${Math.random()}`,
      name: item.name,
      productCode: item.productCode || "",
      batchNo: item.batch || item.batchNo || "",
      expiryDate: item.expiry || null,
      qty: item.qty || 1,
      mrp: item.price || 0,
      rate: item.price || 0,
      ptr: 0,
      gstRate: item.gst || item.gstRate || 0,
      itemDiscount: item.itemDiscount || 0,
      manufacturer: item.manufacturer || "",
      pack: item.pack || "",
    }));
  });
  const [discount, setDiscount] = useState(initialInvoice?.discount || 0);
  const [discountType, setDiscountType] = useState(initialInvoice?.discount > 0 ? "flat" : "percent"); // "percent" | "flat"

  /* ── Payment ── */
  const [paymentMethod, setPaymentMethod] = useState(initialInvoice?.paymentMode || "Cash");
  const [cashTendered, setCashTendered] = useState(initialInvoice?.amount ? String(initialInvoice.amount) : "");

  /* ── Cash Account (branch-scoped) ── */
  const [systemDefaultAccount, setSystemDefaultAccount] = useState(null);

  /* ── Cash Denomination Modal ── */
  const [isDenominationModalOpen, setIsDenominationModalOpen] = useState(false);
  const [invoiceDenominations, setInvoiceDenominations] = useState(initialInvoice?.denominations || []);
  const [invoiceReturnedDenominations, setInvoiceReturnedDenominations] = useState(initialInvoice?.returnedDenominations || []);

  useEffect(() => {
    if (!currentBranch?._id) return;
    branchCashService
      .getBranchCash(currentBranch._id)
      .then((res) => {
        setSystemDefaultAccount(res.data?.data);
      })
      .catch((err) => console.warn("[POS] Could not fetch branch cash:", err));
  }, [currentBranch?._id]);

  /* ── UI State ── */
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  if (!activeShift && (shiftStatus === API_STATUS.LOADING || shiftStatus === API_STATUS.IDLE || shiftStatus === "LOADING" || shiftStatus === "IDLE")) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4 p-8">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-text-muted font-medium">Checking active shift...</p>
      </div>
    );
  }

  if (!activeShift) {
    const isDayOpen = Boolean(openBusinessDay);
    const dayDate = openBusinessDay?.businessDate
      ? new Date(openBusinessDay.businessDate).toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6 bg-background relative overflow-hidden">
          {/* Ambient Background Blur Elements */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-xl w-full bg-surface/90 border border-border/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl space-y-6 relative z-10 text-center">
            {/* Top Status Pill */}
            <div className="flex justify-center">
              <UIBadge
                variant="soft"
                color={isDayOpen ? "success" : "warning"}
                className="text-xs font-bold uppercase tracking-wider py-1 px-3.5"
              >
                {isDayOpen ? "BUSINESS DAY OPEN · SHIFT CLOSED" : "NO BUSINESS DAY OPEN"}
              </UIBadge>
            </div>

            {/* Icon Header */}
            <div className="flex justify-center">
              <div className={`p-4 rounded-2xl shadow-lg ${
                isDayOpen
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20"
                  : "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20"
              }`}>
                {isDayOpen ? (
                  <Clock className="size-10 stroke-[2.2]" />
                ) : (
                  <CalendarDays className="size-10 stroke-[2.2]" />
                )}
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-text tracking-tight">
                {isDayOpen ? "Start Cashier Register Shift" : "Start Business Day Session"}
              </h2>
              <p className="text-xs text-text-muted leading-relaxed max-w-md mx-auto">
                {isDayOpen
                  ? `Business Day #${openBusinessDay.businessDayNo} is active for ${dayDate}. Start a register shift session to open your cash drawer and enable counter billing.`
                  : "Initialize today's pharmacy business day to enable register shifts, track counter sales, and manage treasury accounts."}
              </p>
            </div>

            {/* Quick Context Stat Cards */}
            <div className="grid grid-cols-2 gap-3 text-left pt-2">
              <div className="bg-surface-alt/70 border border-border/70 rounded-2xl p-3.5">
                <span className="text-[10px] font-bold uppercase text-text-muted block">Scheduled Date</span>
                <span className="font-mono font-bold text-xs text-text block mt-0.5">
                  {isDayOpen ? dayDate : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="bg-surface-alt/70 border border-border/70 rounded-2xl p-3.5">
                <span className="text-[10px] font-bold uppercase text-text-muted block">Current Branch</span>
                <span className="font-bold text-xs text-text truncate block mt-0.5">
                  {currentBranch?.name || "Active Branch"}
                </span>
              </div>
            </div>

            {/* 3-Step Workflow Visualizer */}
            <div className="bg-surface-alt/40 border border-border/60 rounded-2xl p-4 text-xs space-y-2 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                Operational Terminal Sequence
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className={`p-2 rounded-xl border text-center ${isDayOpen ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold" : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold"}`}>
                  1. Open Day {isDayOpen ? "✓" : ""}
                </div>
                <div className={`p-2 rounded-xl border text-center ${isDayOpen ? "bg-primary/10 border-primary/30 text-primary font-bold animate-pulse" : "bg-surface border-border text-text-muted"}`}>
                  2. Start Shift
                </div>
                <div className="p-2 rounded-xl border text-center bg-surface border-border text-text-muted opacity-60">
                  3. POS Billing
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {isDayOpen ? (
                <UIButton
                  variant="primary"
                  size="lg"
                  startIcon={<Clock className="size-4.5" />}
                  endIcon={<ArrowRight className="size-4 opacity-70" />}
                  className="w-full sm:w-auto px-8 font-extrabold shadow-md hover:shadow-lg transition-all"
                  onClick={() => setIsShiftModalOpen(true)}
                >
                  Start Shift
                </UIButton>
              ) : (
                <UIButton
                  variant="primary"
                  size="lg"
                  startIcon={<CalendarDays className="size-4.5" />}
                  endIcon={<ArrowRight className="size-4 opacity-70" />}
                  className="w-full sm:w-auto px-8 font-extrabold shadow-md hover:shadow-lg transition-all"
                  onClick={() => setIsBusinessDayModalOpen(true)}
                >
                  Start Business Day
                </UIButton>
              )}

              <UIButton
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-6 font-semibold"
                onClick={() => navigate("/operations/business-days")}
              >
                <span>View Shifts & Days</span>
              </UIButton>
            </div>
          </div>
        </div>

        {/* Modal Triggers */}
        <OpenBusinessDayDialog
          isOpen={isBusinessDayModalOpen}
          onClose={() => {
            setIsBusinessDayModalOpen(false);
            if (currentBranch?._id) dispatch(getOpenBusinessDay(currentBranch._id));
          }}
        />
        <CreateShiftDialog
          isOpen={isShiftModalOpen}
          onClose={() => {
            setIsShiftModalOpen(false);
            if (currentBranch?._id) dispatch(getOpenBusinessDay(currentBranch._id));
          }}
        />
      </>
    );
  }

  /* ────────────────── B2B SEARCH ────────────────── */
  useEffect(() => {
    if (billingMode !== "B2B") {
      setB2bResults([]);
      return;
    }
    let cancelled = false;

    const search = async () => {
      setB2bSearching(true);
      try {
        const res = await customerService.getCustomers({
          search: debouncedB2bQuery || undefined,
          limit: 15,
          status: "active",
          customerType: "retail,wholesale",
        });
        if (!cancelled) {
          const customers = res.data?.data?.customers || res.data?.customers || [];
          setB2bResults(customers);
          if (debouncedB2bQuery.length > 0) {
            setB2bDropdownOpen(customers.length > 0);
          }
        }
      } catch (err) {
        console.warn("B2B search error:", err);
        if (!cancelled) setB2bResults([]);
      } finally {
        if (!cancelled) setB2bSearching(false);
      }
    };
    search();
    return () => { cancelled = true; };
  }, [debouncedB2bQuery, billingMode]);

  /* ────────────────── PRODUCT SEARCH ────────────────── */
  useEffect(() => {
    let cancelled = false;

    const search = async () => {
      setProductSearching(true);
      try {
        const res = await workspaceProductService.getWorkspaceProducts({
          search: debouncedProductQuery || undefined,
          limit: 15,
          status: "active",
        });
        if (!cancelled) {
          const products =
            res.data?.data?.products ||
            res.data?.products ||
            res.data?.data ||
            [];
          setProductResults(Array.isArray(products) ? products : []);
          if (debouncedProductQuery.length > 0) {
            setProductDropdownOpen(products.length > 0);
          }
        }
      } catch (err) {
        console.warn("Product search error:", err);
        if (!cancelled) setProductResults([]);
      } finally {
        if (!cancelled) setProductSearching(false);
      }
    };
    search();
    return () => { cancelled = true; };
  }, [debouncedProductQuery]);

  /* ────────────────── CLICK OUTSIDE ────────────────── */
  useEffect(() => {
    const handleClick = (e) => {
      if (b2bDropdownRef.current && !b2bDropdownRef.current.contains(e.target) &&
        b2bInputRef.current && !b2bInputRef.current.contains(e.target)) {
        setB2bDropdownOpen(false);
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target) &&
        productInputRef.current && !productInputRef.current.contains(e.target)) {
        setProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ────────────────── KEYBOARD SHORTCUTS ────────────────── */
  useEffect(() => {
    const handler = (e) => {
      // F2 — Focus product search (new item)
      if (e.key === "F2") {
        e.preventDefault();
        productInputRef.current?.focus();
      }
      // F5 — Focus cash tendered
      if (e.key === "F5") {
        e.preventDefault();
        document.getElementById("pos-cash-tendered")?.focus();
      }
      // Escape — Clear search fields
      if (e.key === "Escape") {
        setProductQuery("");
        setProductDropdownOpen(false);
        setB2bDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ────────────────── B2B PARTY SELECT ────────────────── */
  const handleSelectParty = useCallback((party) => {
    setSelectedParty(party);
    setB2bSearchQuery(party.name || "");
    setB2bDropdownOpen(false);
  }, []);

  const handleClearParty = useCallback(() => {
    setSelectedParty(null);
    setB2bSearchQuery("");
    setB2bResults([]);
    setTimeout(() => b2bInputRef.current?.focus(), 50);
  }, []);

  /* ────────────────── PRODUCT ADD TO CART ────────────────── */
  const getSafeStr = (val) => {
    if (!val) return "";
    if (typeof val === "object" && val !== null) {
      return val.name || val.productName || val.category || "";
    }
    return String(val);
  };

  const handleAddProduct = useCallback((product) => {
    const pid = product._id || product.id;
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.productId === pid);
      if (existing) {
        return prev.map((ci) =>
          ci.productId === pid ? { ...ci, qty: ci.qty + 1 } : ci
        );
      }

      // Determine price from product structure
      const mrp = Number(product.mrp || product.sellingPrice || product.price || 0);
      const ptr = Number(product.ptr || product.purchasePrice || 0);
      const gstRate = Number(product.gstRate || product.gstPercentage || 0);

      return [
        ...prev,
        {
          productId: pid,
          name: getSafeStr(product.name) || getSafeStr(product.productName) || "Unknown Product",
          productCode: getSafeStr(product.productCode) || "",
          batchNo: getSafeStr(product.batchNumber) || getSafeStr(product.batchNo) || "",
          expiryDate: typeof product.expiryDate === "object" ? null : (product.expiryDate || null),
          qty: 1,
          mrp,
          rate: mrp,
          ptr,
          gstRate,
          itemDiscount: 0,
          manufacturer: getSafeStr(product.manufacturer) || getSafeStr(product.manufacturerName) || "",
          pack: getSafeStr(product.pack) || getSafeStr(product.packSize) || "",
        },
      ];
    });
    setProductQuery("");
    setProductDropdownOpen(false);
    setTimeout(() => productInputRef.current?.focus(), 50);
  }, []);

  /* ────────────────── CART OPERATIONS ────────────────── */
  const updateCartItem = useCallback((productId, field, value) => {
    setCartItems((prev) =>
      prev.map((ci) =>
        ci.productId === productId ? { ...ci, [field]: value } : ci
      )
    );
  }, []);

  const removeCartItem = useCallback((productId) => {
    setCartItems((prev) => prev.filter((ci) => ci.productId !== productId));
  }, []);

  const incrementQty = useCallback((productId) => {
    setCartItems((prev) =>
      prev.map((ci) =>
        ci.productId === productId ? { ...ci, qty: ci.qty + 1 } : ci
      )
    );
  }, []);

  const decrementQty = useCallback((productId) => {
    setCartItems((prev) =>
      prev.map((ci) =>
        ci.productId === productId
          ? { ...ci, qty: Math.max(1, ci.qty - 1) }
          : ci
      )
    );
  }, []);

  /* ────────────────── CALCULATIONS ────────────────── */
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalGst = 0;
    let totalItemDiscount = 0;

    cartItems.forEach((ci) => {
      const lineTotal = ci.qty * ci.rate;
      const lineItemDiscount = ci.itemDiscount || 0;
      const lineTaxable = lineTotal - lineItemDiscount;
      const lineGst = lineTaxable * (ci.gstRate / 100);

      subtotal += lineTotal;
      totalGst += lineGst;
      totalItemDiscount += lineItemDiscount;
    });

    const taxableAmount = subtotal - totalItemDiscount;
    let billDiscount = 0;
    if (discountType === "percent") {
      billDiscount = (taxableAmount + totalGst) * (discount / 100);
    } else {
      billDiscount = Number(discount) || 0;
    }

    const grandTotal = Math.round(taxableAmount + totalGst - billDiscount);
    const cashTenderedNum = Number(cashTendered) || 0;
    const changeReturn = Math.max(0, cashTenderedNum - grandTotal);

    return {
      subtotal,
      totalItemDiscount,
      taxableAmount,
      totalGst,
      billDiscount,
      grandTotal,
      changeReturn,
      totalItems: cartItems.reduce((sum, ci) => sum + ci.qty, 0),
    };
  }, [cartItems, discount, discountType, cashTendered]);

  /* ────────────────── SUBMIT BILL ────────────────── */
  const handleSubmitBill = () => {
    if (cartItems.length === 0) {
      setToast({ type: "error", message: "Add at least one product to the cart." });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (paymentMethod === "Cash") {
      setIsDenominationModalOpen(true);
    } else {
      finalizeBill([], []);
    }
  };

  const handleDenominationSubmit = (denominations, returnedDenominations) => {
    setInvoiceDenominations(denominations);
    setInvoiceReturnedDenominations(returnedDenominations);
    setIsDenominationModalOpen(false);
    finalizeBill(denominations, returnedDenominations);
  };
  const finalizeBill = async (finalDenominations = [], finalReturnedDenominations = []) => {

    if (cartItems.length === 0) {
      setToast({ type: "error", message: "Add at least one product to the cart." });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setSubmitting(true);
    try {
      // Determine customer
      let customerId = null;
      let customerName = "Walk-in Customer";

      if (billingMode === "B2B" && selectedParty) {
        customerId = selectedParty._id || selectedParty.id;
        customerName = selectedParty.name;
      } else if (billingMode === "B2C") {
        customerName = b2cName || "Walk-in Customer";
        // If in edit mode, try to reuse the existing customerId
        if (isEditMode && initialInvoice?.customerId) {
          customerId = initialInvoice.customerId;
        }
      }

      const salePayload = {
        invoiceNo,
        billingMode,
        branchId: currentBranch?._id || null,
        date: new Date().toISOString(),
        items: cartItems.map((ci) => ({
          productId: ci.productId,
          name: ci.name,
          productCode: ci.productCode,
          batchNo: ci.batchNo,
          qty: ci.qty,
          mrp: ci.mrp,
          rate: ci.rate,
          gstRate: ci.gstRate,
          itemDiscount: ci.itemDiscount,
          total: ci.qty * ci.rate,
        })),
        subtotal: calculations.subtotal,
        discount: calculations.billDiscount + calculations.totalItemDiscount,
        tax: calculations.totalGst,
        grandTotal: calculations.grandTotal,
        paymentMethod,
        cashTendered: Number(cashTendered) || calculations.grandTotal,
        customerName,
        customerPhone: billingMode === "B2C" ? b2cPhone : (selectedParty?.mobile || ""),
        // Always use system default cash account — no user selection
        payments: paymentMethod === "Cash"
          ? [{
              paymentType: "cash",
              amount: calculations.grandTotal,
              denominations: finalDenominations,
              returnedDenominations: finalReturnedDenominations
            }]
          : paymentMethod === "UPI"
          ? [{ paymentType: "upi", amount: calculations.grandTotal }]
          : [],
        denominations: finalDenominations,
        returnedDenominations: finalReturnedDenominations
      };

      if (customerId) {
        // B2B — record or update sale against the existing customer
        if (isEditMode) {
          await invoiceService.updateCustomerSale(customerId, invoiceId, salePayload);
        } else {
          await invoiceService.recordCustomerSale(customerId, salePayload);
        }
      } else if (billingMode === "B2C" && b2cName) {
        // For B2C with a named customer, create the customer first, then record
        try {
          const createRes = await customerService.createCustomer({
            name: b2cName || "Walk-in Customer",
            mobile: b2cPhone || null,
            customerType: "retail",
          });
          const newCustomer = createRes.data?.data || createRes.data;
          const newId = newCustomer?._id || newCustomer?.id;
          if (newId) {
            if (isEditMode) {
              await invoiceService.updateCustomerSale(newId, invoiceId, salePayload);
            } else {
              await invoiceService.recordCustomerSale(newId, salePayload);
            }
          }
        } catch (createErr) {
          console.warn("B2C customer creation skipped:", createErr);
        }
      } else {
        // Fallback for B2C without a name
        try {
          const createRes = await customerService.createCustomer({
            name: "Walk-in Customer",
            mobile: null,
            customerType: "retail",
          });
          const newCustomer = createRes.data?.data || createRes.data;
          const newId = newCustomer?._id || newCustomer?.id;
          if (newId) {
            if (isEditMode) {
              await invoiceService.updateCustomerSale(newId, invoiceId, salePayload);
            } else {
              await invoiceService.recordCustomerSale(newId, salePayload);
            }
          }
        } catch (createErr) {
          console.warn("B2C default customer creation skipped:", createErr);
        }
      }

      setToast({ type: "success", message: `✅ Invoice ${invoiceNo} ${isEditMode ? "updated" : "billed"} successfully! Grand Total: ${formatCurrency(calculations.grandTotal)}` });
      setTimeout(() => {
        setToast(null);
        if (isEditMode) {
          navigate("/billing");
        } else {
          window.location.reload();
        }
      }, 3000);
    } catch (err) {
      console.error("Submit bill error:", err);
      setToast({ type: "error", message: "❌ Failed to submit bill. Please try again." });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  /* ────────────────── NEW BILL (RESET) ────────────────── */
  const handleNewBill = () => {
    window.location.reload();
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg font-sans overflow-hidden">
      {/* ──────────── TOAST ──────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            className={cn(
              "fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl border backdrop-blur-xl",
              toast.type === "success"
                ? "bg-success-soft/90 text-success border-success/30"
                : "bg-error-soft/90 text-error border-error/30"
            )}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────── TOP BAR ──────────── */}
      <header className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-surface/80 backdrop-blur-sm shrink-0">
        {/* Left — Logo & Invoice */}
        <div className="flex items-center gap-4">
          <a
            href="/billing"
            className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors group"
          >
            <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-semibold">Back</span>
          </a>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-md">
              <Store className="size-4 text-primary-contrast" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-text tracking-tight leading-none">
                POS Terminal
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono font-bold text-primary">
                  {invoiceNo}
                </span>
                <span className="text-[10px] text-text-muted">·</span>
                <span className="text-[10px] text-text-muted">{formatDate()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center — Billing Mode Toggle */}
        <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-border">
          {BILLING_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                setBillingMode(mode.id);
                setSelectedParty(null);
                setB2bSearchQuery("");
                setB2bResults([]);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                billingMode === mode.id
                  ? "bg-surface text-primary shadow-sm border border-primary/20"
                  : "text-text-muted hover:text-text"
              )}
            >
              <mode.icon className="size-3.5" />
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        {/* Right — Clock & Shortcuts */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-text-muted">
            <Clock className="size-3.5" />
            <span className="text-xs font-mono font-semibold tabular-nums">{currentTime}</span>
          </div>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded-md bg-surface-alt border border-border text-[9px] font-mono font-bold text-text-muted">F2</kbd>
            <span className="text-[9px] text-text-muted">Search</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded-md bg-surface-alt border border-border text-[9px] font-mono font-bold text-text-muted">F5</kbd>
            <span className="text-[9px] text-text-muted">Pay</span>
          </div>
        </div>
      </header>

      {/* ──────────── MAIN BODY (Split View) ──────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ═══════════ LEFT PANEL — Products & Cart ═══════════ */}
        <div className="flex flex-col flex-1 border-r border-border overflow-hidden">
          {/* Product Search Bar */}
          <div className="p-4 pb-3 border-b border-border/50 bg-surface/40 shrink-0">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
              {productSearching && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-primary animate-spin" />
              )}
              <input
                ref={productInputRef}
                id="pos-product-search"
                type="text"
                value={productQuery}
                onChange={(e) => {
                  setProductQuery(e.target.value);
                  setProductDropdownOpen(true);
                }}
                onFocus={() => { setProductDropdownOpen(true); }}
                placeholder="Search products by name, code, or barcode... (F2)"
                autoComplete="off"
                className="w-full rounded-xl border border-border bg-surface pl-10 pr-10 py-3 text-sm text-text placeholder:text-text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all"
              />

              {/* Product Dropdown */}
              <AnimatePresence>
                {productDropdownOpen && productResults.length > 0 && (
                  <motion.div
                    ref={productDropdownRef}
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-border bg-surface shadow-2xl z-50 max-h-[320px] overflow-y-auto"
                  >
                    {productResults.map((product, idx) => {
                      const pid = product._id || product.id;
                      const name = getSafeStr(product.name) || getSafeStr(product.productName) || "Unnamed";
                      const code = getSafeStr(product.productCode) || "";
                      const manufacturer = getSafeStr(product.manufacturer) || getSafeStr(product.manufacturerName) || "";
                      const mrp = Number(product.mrp || product.sellingPrice || product.price || 0);
                      const pack = getSafeStr(product.pack) || getSafeStr(product.packSize) || "";

                      return (
                        <button
                          key={pid || idx}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleAddProduct(product)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover/70 transition-colors text-left cursor-pointer border-b border-border/30 last:border-b-0"
                        >
                          <div className="size-9 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
                            <Package className="size-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-text truncate">{name}</span>
                              {pack && (
                                <span className="text-[10px] font-mono text-text-muted bg-surface-alt px-1.5 py-0.5 rounded-md border border-border/50 shrink-0">{pack}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {code && (
                                <span className="text-[10px] font-mono text-primary/70">{code}</span>
                              )}
                              {manufacturer && (
                                <span className="text-[10px] text-text-muted truncate">· {manufacturer}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-extrabold text-text font-mono">{formatCurrency(mrp)}</div>
                            <div className="text-[10px] text-text-muted">MRP</div>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Cart Table */}
          <div className="flex-1 overflow-y-auto">
            {cartItems.length === 0 ? (
              /* Empty Cart State */
              <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted">
                <div className="size-20 rounded-2xl bg-surface-alt/70 border border-border flex items-center justify-center">
                  <ShoppingCart className="size-10 text-text-muted/40" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-text/60">Cart is empty</p>
                  <p className="text-xs text-text-muted mt-1">
                    Search and add products to start billing
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <kbd className="px-2 py-1 rounded-lg bg-surface-alt border border-border text-[10px] font-mono font-bold text-text-muted">F2</kbd>
                  <span className="text-[10px] text-text-muted">to quick-search products</span>
                </div>
              </div>
            ) : (
              /* Cart Items Table */
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-surface-alt/80 backdrop-blur-sm border-b border-border text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    <th className="py-2.5 px-4 font-bold">#</th>
                    <th className="py-2.5 px-3 font-bold">Product</th>
                    <th className="py-2.5 px-3 text-center font-bold">Qty</th>
                    <th className="py-2.5 px-3 text-right font-bold">Rate</th>
                    <th className="py-2.5 px-3 text-right font-bold">GST%</th>
                    <th className="py-2.5 px-3 text-right font-bold">Amount</th>
                    <th className="py-2.5 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <AnimatePresence>
                    {cartItems.map((ci, idx) => {
                      const lineTotal = ci.qty * ci.rate;
                      const lineGst = (lineTotal - (ci.itemDiscount || 0)) * (ci.gstRate / 100);
                      const lineAmount = lineTotal - (ci.itemDiscount || 0) + lineGst;

                      return (
                        <motion.tr
                          key={ci.productId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="group hover:bg-surface-hover/40 transition-colors"
                        >
                          {/* # */}
                          <td className="py-3 px-4 text-xs font-mono text-text-muted">{idx + 1}</td>

                          {/* Product */}
                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-text leading-tight">{ci.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {ci.productCode && (
                                  <span className="text-[10px] font-mono text-primary/70">{getSafeStr(ci.productCode)}</span>
                                )}
                                {ci.manufacturer && (
                                  <span className="text-[10px] text-text-muted truncate">· {getSafeStr(ci.manufacturer)}</span>
                                )}
                                {ci.batchNo && (
                                  <span className="text-[10px] text-text-muted">Batch: {getSafeStr(ci.batchNo)}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Qty */}
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => decrementQty(ci.productId)}
                                className="size-6 rounded-lg border border-border bg-surface-alt flex items-center justify-center hover:bg-surface-hover transition-colors cursor-pointer"
                              >
                                <Minus className="size-3 text-text-muted" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={ci.qty}
                                onChange={(e) => updateCartItem(ci.productId, "qty", Math.max(1, Number(e.target.value) || 1))}
                                className="w-12 text-center rounded-lg border border-border bg-surface py-1 text-xs font-bold text-text font-mono focus:border-primary focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => incrementQty(ci.productId)}
                                className="size-6 rounded-lg border border-border bg-surface-alt flex items-center justify-center hover:bg-surface-hover transition-colors cursor-pointer"
                              >
                                <Plus className="size-3 text-text-muted" />
                              </button>
                            </div>
                          </td>

                          {/* Rate */}
                          <td className="py-3 px-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={ci.rate}
                              onChange={(e) => updateCartItem(ci.productId, "rate", Number(e.target.value) || 0)}
                              className="w-20 text-right rounded-lg border border-border bg-surface py-1 px-2 text-xs font-bold text-text font-mono focus:border-primary focus:outline-none"
                            />
                          </td>

                          {/* GST% */}
                          <td className="py-3 px-3 text-right">
                            <span className="text-xs font-mono text-text-muted">{ci.gstRate}%</span>
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-3 text-right">
                            <span className="text-xs font-extrabold text-text font-mono tabular-nums">
                              {formatCurrency(lineAmount)}
                            </span>
                          </td>

                          {/* Remove */}
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeCartItem(ci.productId)}
                              className="size-7 rounded-lg flex items-center justify-center text-text-muted hover:text-error hover:bg-error-soft/50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          {/* Cart Footer Summary Bar */}
          {cartItems.length > 0 && (
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-border bg-surface-alt/50 shrink-0">
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span>
                  <span className="font-bold text-text">{cartItems.length}</span> items
                </span>
                <span>·</span>
                <span>
                  <span className="font-bold text-text">{calculations.totalItems}</span> qty
                </span>
              </div>
              <div className="text-sm font-extrabold text-primary font-mono tabular-nums">
                {formatCurrency(calculations.grandTotal)}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════ RIGHT PANEL — Customer, Payment, Submit ═══════════ */}
        <div className="w-[380px] xl:w-[420px] flex flex-col bg-surface/50 overflow-y-auto shrink-0">
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* ─── Customer Card ─── */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center gap-2">
                {billingMode === "B2C" ? (
                  <User className="size-4 text-primary" />
                ) : (
                  <Building2 className="size-4 text-primary" />
                )}
                <span className="text-xs font-bold text-text uppercase tracking-wider">
                  {billingMode === "B2C" ? "Customer Details" : "Party Details (B2B)"}
                </span>
              </div>

              {billingMode === "B2C" ? (
                /* ── B2C: Manual Name Entry ── */
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Customer Name</label>
                    <input
                      type="text"
                      value={b2cName}
                      onChange={(e) => setB2cName(e.target.value)}
                      placeholder="Walk-in Customer"
                      className="w-full rounded-lg border border-border bg-surface-alt/50 px-3 py-2 text-xs text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      value={b2cPhone}
                      onChange={(e) => setB2cPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full rounded-lg border border-border bg-surface-alt/50 px-3 py-2 text-xs text-text font-mono placeholder:text-text-muted/50 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              ) : (
                /* ── B2B: Autocomplete Party Search ── */
                <div className="space-y-2.5">
                  {/* Selected Party Display */}
                  {selectedParty ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-xl border border-primary/20 bg-primary-soft/30 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-text">{selectedParty.name}</span>
                            {selectedParty.customerType && CUSTOMER_TYPE_BADGES[selectedParty.customerType] && (
                              <span className={cn(
                                "px-1.5 py-0.5 rounded-md text-[9px] font-bold border",
                                CUSTOMER_TYPE_BADGES[selectedParty.customerType].color
                              )}>
                                {CUSTOMER_TYPE_BADGES[selectedParty.customerType].label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {selectedParty.customerCode && (
                              <span className="text-[10px] font-mono text-primary">{selectedParty.customerCode}</span>
                            )}
                            {selectedParty.mobile && (
                              <span className="text-[10px] text-text-muted font-mono">{selectedParty.mobile}</span>
                            )}
                          </div>
                          {selectedParty.gstNumber && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] text-text-muted">GST:</span>
                              <span className="text-[10px] font-mono font-semibold text-text">{selectedParty.gstNumber}</span>
                            </div>
                          )}
                          {selectedParty.billingAddress?.city && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] text-text-muted">
                                {[selectedParty.billingAddress.city, selectedParty.billingAddress.state].filter(Boolean).join(", ")}
                              </span>
                            </div>
                          )}
                          {(selectedParty.creditLimit > 0 || selectedParty.creditDays > 0 || (selectedParty.outstandingAmount || selectedParty.openingBalance) > 0) && (
                            <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-border/50">
                              {(selectedParty.outstandingAmount || selectedParty.openingBalance) > 0 && (
                                <span className="text-[10px] text-text-muted">
                                  Outstanding: <span className="font-bold text-danger">{formatCurrency(selectedParty.outstandingAmount || selectedParty.openingBalance)} {(selectedParty.balanceType || selectedParty.openingBalanceType || 'DR').toUpperCase()}</span>
                                </span>
                              )}
                              {selectedParty.creditLimit > 0 && (
                                <span className="text-[10px] text-text-muted">
                                  Limit: <span className="font-bold text-text">{formatCurrency(selectedParty.creditLimit)}</span>
                                </span>
                              )}
                              {selectedParty.creditDays > 0 && (
                                <span className="text-[10px] text-text-muted">
                                  Days: <span className="font-bold text-text">{selectedParty.creditDays}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setCustomerViewDialogOpen(true)}
                            title="View Customer Details"
                            className="size-6 rounded-lg flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary-soft/30 transition-all cursor-pointer"
                          >
                            <Info className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleClearParty}
                            className="size-6 rounded-lg flex items-center justify-center text-text-muted hover:text-error hover:bg-error-soft/30 transition-all cursor-pointer"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    /* B2B Search Input */
                    <div className="relative">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Search Party</label>
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-text-muted" />
                          {b2bSearching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-primary animate-spin" />
                          )}
                          <input
                            ref={b2bInputRef}
                            type="text"
                            value={b2bSearchQuery}
                            onChange={(e) => {
                              setB2bSearchQuery(e.target.value);
                              setB2bDropdownOpen(true);
                            }}
                            onFocus={() => { setB2bDropdownOpen(true); }}
                            placeholder="Type party name, code, or mobile..."
                            autoComplete="off"
                            className="w-full rounded-lg border border-border bg-surface-alt/50 pl-9 pr-9 py-2 text-xs text-text placeholder:text-text-muted/50 focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                      {/* B2B Dropdown */}
                      <AnimatePresence>
                        {b2bDropdownOpen && b2bResults.length > 0 && (
                          <motion.div
                            ref={b2bDropdownRef}
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-border bg-surface shadow-2xl z-50 max-h-[240px] overflow-y-auto"
                          >
                            {b2bResults.map((party) => {
                              const pid = party._id || party.id;
                              const badge = CUSTOMER_TYPE_BADGES[party.customerType] || CUSTOMER_TYPE_BADGES.other;

                              return (
                                <button
                                  key={pid}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleSelectParty(party)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover/70 transition-colors text-left cursor-pointer border-b border-border/30 last:border-b-0"
                                >
                                  <div className="size-8 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
                                    <Building2 className="size-3.5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-text truncate">{party.name}</span>
                                      <span className={cn(
                                        "px-1.5 py-0.5 rounded-md text-[9px] font-bold border shrink-0",
                                        badge.color
                                      )}>
                                        {badge.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {party.customerCode && (
                                        <span className="text-[10px] font-mono text-primary/70">{party.customerCode}</span>
                                      )}
                                      {party.mobile && (
                                        <span className="text-[10px] font-mono text-text-muted">· {party.mobile}</span>
                                      )}
                                      {party.gstNumber && (
                                        <span className="text-[10px] font-mono text-text-muted">· GST: {party.gstNumber}</span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Fallback: No match message */}
                  {!selectedParty && b2bSearchQuery.length >= 2 && !b2bSearching && b2bResults.length === 0 && (
                    <div className="text-[10px] text-text-muted bg-warning-soft/30 border border-warning/20 rounded-lg px-3 py-2">
                      No B2B parties found for "{b2bSearchQuery}". Create a new party from the Parties module.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── Bill Summary ─── */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-2.5">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <Receipt className="size-4 text-primary" />
                <span className="text-xs font-bold text-text uppercase tracking-wider">Bill Summary</span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-text-muted">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(calculations.subtotal)}</span>
                </div>
                {calculations.totalItemDiscount > 0 && (
                  <div className="flex justify-between text-text-muted">
                    <span>Item Discounts</span>
                    <span className="tabular-nums text-error">-{formatCurrency(calculations.totalItemDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-text-muted">
                  <span>GST</span>
                  <span className="tabular-nums">{formatCurrency(calculations.totalGst)}</span>
                </div>

                {/* Bill Discount */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-text-muted text-xs flex-shrink-0">Discount</span>
                  <div className="flex items-center gap-1 flex-1 justify-end">
                    <button
                      type="button"
                      onClick={() => setDiscountType(discountType === "percent" ? "flat" : "percent")}
                      className="size-6 rounded-md border border-border bg-surface-alt flex items-center justify-center hover:bg-surface-hover transition-colors cursor-pointer"
                      title={discountType === "percent" ? "Percentage discount" : "Flat discount"}
                    >
                      {discountType === "percent" ? (
                        <Percent className="size-3 text-text-muted" />
                      ) : (
                        <IndianRupee className="size-3 text-text-muted" />
                      )}
                    </button>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className="w-16 text-right rounded-md border border-border bg-surface-alt/50 py-1 px-2 text-xs font-mono text-text focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                {calculations.billDiscount > 0 && (
                  <div className="flex justify-between text-error">
                    <span>Bill Discount</span>
                    <span className="tabular-nums">-{formatCurrency(calculations.billDiscount)}</span>
                  </div>
                )}

                {/* Grand Total */}
                <div className="flex justify-between pt-2 mt-1 border-t border-border text-sm font-extrabold text-text">
                  <span>Grand Total</span>
                  <span className="text-primary tabular-nums">{formatCurrency(calculations.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* ─── Payment Method ─── */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <CreditCard className="size-4 text-primary" />
                <span className="text-xs font-bold text-text uppercase tracking-wider">Payment</span>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer",
                      paymentMethod === pm.id
                        ? "bg-primary-soft/40 border-primary/30 text-primary shadow-sm"
                        : "bg-surface-alt/30 border-border text-text-muted hover:border-primary/20 hover:text-text"
                    )}
                  >
                    <pm.icon className={cn("size-4", paymentMethod === pm.id ? "text-primary" : pm.color)} />
                    <span>{pm.label}</span>
                  </button>
                ))}
              </div>

              {/* Cash Tendered */}
              {paymentMethod === "Cash" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2 pt-1"
                >
                  {/* System default cash drawer info */}
                  {systemDefaultAccount && (
                    <div className="flex items-center gap-2 text-xs bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3 py-1.5">
                      <Banknote className="size-3 text-emerald-500 shrink-0" />
                      <span className="text-text-muted truncate">Running Cash</span>
                      <span className="ml-auto font-mono font-bold text-emerald-500 tabular-nums shrink-0">
                        ₹{(systemDefaultAccount.balance?.runningAmount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Cash Tendered (F5)</label>
                    <input
                      id="pos-cash-tendered"
                      type="number"
                      min="0"
                      step="1"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder={String(calculations.grandTotal)}
                      className="w-full rounded-lg border border-border bg-surface-alt/50 px-3 py-2 text-sm text-text font-mono font-bold placeholder:text-text-muted/40 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  {calculations.changeReturn > 0 && (
                    <div className="flex justify-between items-center bg-success-soft/30 border border-success/20 rounded-lg px-3 py-2">
                      <span className="text-xs font-semibold text-success">Change Return</span>
                      <span className="text-sm font-extrabold text-success font-mono tabular-nums">
                        {formatCurrency(calculations.changeReturn)}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* ─── Action Buttons (sticky bottom) ─── */}
          <div className="p-4 border-t border-border bg-surface/80 backdrop-blur-sm space-y-2 shrink-0">
            <button
              type="button"
              onClick={handleSubmitBill}
              disabled={submitting || cartItems.length === 0}
              className={cn(
                "w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-extrabold transition-all cursor-pointer",
                cartItems.length > 0 && !submitting
                  ? "bg-gradient-to-r from-primary to-primary-hover text-primary-contrast shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                  : "bg-surface-alt text-text-disabled border border-border cursor-not-allowed"
              )}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Zap className="size-4" />
              )}
              <span>
                {submitting
                  ? "Processing..."
                  : cartItems.length > 0
                    ? `Bill ${formatCurrency(calculations.grandTotal)}`
                    : "Add items to bill"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleNewBill}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-text-muted bg-surface-alt/50 border border-border hover:bg-surface-hover hover:text-text transition-all cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>New Bill</span>
            </button>
          </div>
        </div>
      </div>
      <CustomerDialog
        isOpen={customerViewDialogOpen}
        onClose={() => setCustomerViewDialogOpen(false)}
        mode="view"
        customerData={selectedParty}
      />

      <POSCashDenominationModal
        isOpen={isDenominationModalOpen}
        onClose={() => setIsDenominationModalOpen(false)}
        onSubmit={handleDenominationSubmit}
        initialDenominations={invoiceDenominations}
        initialReturnedDenominations={invoiceReturnedDenominations}
        requiredAmount={calculations.grandTotal}
      />
    </div>
  );
};

export default POSTerminalPage;
