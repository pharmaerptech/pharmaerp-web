// src/features/sales/pages/desktop/SalesDesktopPage.jsx

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  Barcode,
  CheckCircle2,
  RefreshCw,
  Receipt,
  Sparkles,
  Percent,
  Building2,
  Users,
  Briefcase,
  Store,
  FileCheck,
  CreditCard,
  ShieldCheck,
  Tag,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  UICard,
  UIButton,
  UIIconButton,
  UIBadge,
  UISearchInput,
  WorkspaceProductSearchBar,
  WorkspaceProductBatchSelectorModal,
  B2cCustomerSearchBar,
  B2bCustomerSearchBar,
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
} from "@/components";
import { PermissionGate } from "@/components/common/PermissionGate";
import { cn } from "@/lib/utils";
import {
  POS_AVAILABLE_MEDICINES,
  POS_DEFAULT_CUSTOMERS,
  POS_B2B_PARTIES,
} from "../../constants/salesData";
import { SalesCheckoutModal } from "../../components/SalesCheckoutModal";
import { SalesReceiptModal } from "../../components/SalesReceiptModal";
import { SalesCustomerSidebar } from "../../components/SalesCustomerSidebar";
import { SalesCustomerDoctorInfo } from "../../components/SalesCustomerDoctorInfo";
import { POSSessionGatekeeperCard } from "../../components/POSSessionGatekeeperCard";
import OpenBusinessDayDialog from "@/features/operations/business-days/components/OpenBusinessDayDialog";
import { CreateShiftDialog } from "@/features/operations/shifts/components/CreateShiftDialog";

import customerService from "@/features/parties/customers/services/customerService";
import invoiceService from "@/features/sales/services/invoiceService";
import workspaceProductService from "@/features/workspace-products/services/workspaceProductService";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import useBranch from "@/features/branch/hooks/useBranch";
import { useActiveShift } from "@/features/operations/shifts/hooks/useActiveShift";

/** Safe number parser */
const safeNum = (v) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

/**
 * Compute scheme discount for a given qty and scheme %.
 * Applies schemePercent as a direct discount (no free qty).
 * Uses quarter/half/full threshold tiers.
 */
const computeSchemeDiscount = (qty, schemePercent) => {
  const normalizedQty = safeNum(qty);
  const normalizedScheme = safeNum(schemePercent);
  if (normalizedQty <= 0 || normalizedScheme <= 0) {
    return { freeQty: 0, schemeDiscountPercent: 0, finalDiscountPercent: 0, schemeApply: false };
  }

  // Special case: 50% scheme — apply full discount directly when qty >= 2
  if (normalizedScheme === 50) {
    if (normalizedQty < 2) {
      return { freeQty: 0, schemeDiscountPercent: 0, finalDiscountPercent: 0, schemeApply: false };
    }
    return { freeQty: 0, schemeDiscountPercent: normalizedScheme, finalDiscountPercent: normalizedScheme, schemeApply: true };
  }

  const fullFreeQty = (normalizedQty * normalizedScheme) / (100 - normalizedScheme);
  const quarterThreshold = (normalizedScheme / (100 - normalizedScheme)) / 0.4;
  const halfThreshold = quarterThreshold * 2;
  const fullThreshold = quarterThreshold * 4;

  let discountFraction = 0;
  let schemeApply = false;

  if (fullFreeQty >= fullThreshold) {
    discountFraction = 1;
    schemeApply = true;
  } else if (fullFreeQty >= halfThreshold) {
    discountFraction = 0.5;
    schemeApply = true;
  } else if (fullFreeQty >= quarterThreshold) {
    discountFraction = 0.25;
    schemeApply = true;
  }

  const finalDiscountPercent = schemeApply ? normalizedScheme * discountFraction : 0;

  return {
    freeQty: 0,
    schemeDiscountPercent: finalDiscountPercent,
    finalDiscountPercent,
    schemeApply,
  };
};

const QuickCreateCustomerModal = ({ open, onClose, defaultName, customerType, billingMode = "B2C", onSuccess }) => {
  const [name, setName] = useState(defaultName || "");
  const [mobile, setMobile] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      const trimmed = (defaultName || "").trim();
      // If the default string contains mostly digits (and optional spaces/pluses), assume it's a phone number
      const isProbablyPhone = /^[\d\s\+\-]{6,}$/.test(trimmed) || /^\d+$/.test(trimmed);
      
      if (isProbablyPhone) {
        setName("");
        setMobile(trimmed);
      } else {
        setName(trimmed);
        setMobile("");
      }
      setGstNumber("");
      setError(null);
    }
  }, [open, defaultName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        customerType: customerType,
      };
      if (mobile.trim()) payload.mobile = mobile.trim();
      if (gstNumber.trim() && billingMode === "B2B") payload.gstNumber = gstNumber.trim().toUpperCase();

      const res = await customerService.createCustomer(payload);
      const newCustomer = res.data?.data || res.data;
      onSuccess(newCustomer);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UIModal isOpen={open} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit}>
        <UIModalHeader>
          <UIModalTitle>
            Add {billingMode === "B2C" ? "Retail Customer" : "B2B Party"}
          </UIModalTitle>
          <UIModalDescription>
            Create a quick customer record to proceed with billing.
          </UIModalDescription>
        </UIModalHeader>
        <UIModalBody className="space-y-4 p-5">
          {error && (
            <div className="p-3 rounded-xl bg-error-soft/60 border border-error/30 text-error text-xs font-semibold">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
              {billingMode === "B2C" ? "Patient / Customer Name" : "Party / Business Name"} *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={billingMode === "B2C" ? "e.g. John Doe" : "e.g. Acme Medical Corp"}
              required
              autoFocus
              className="w-full h-9 rounded-lg border border-border px-3 text-sm bg-surface text-text focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
            />
          </div>
          <div className={cn("grid gap-4", billingMode === "B2B" ? "grid-cols-2" : "grid-cols-1")}>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">Mobile</label>
              <input
                type="text"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="Optional"
                className="w-full h-9 rounded-lg border border-border px-3 text-sm bg-surface text-text focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
              />
            </div>
            {billingMode === "B2B" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">GST Number</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={e => setGstNumber(e.target.value)}
                  placeholder="Optional"
                  className="w-full h-9 rounded-lg border border-border px-3 text-sm bg-surface text-text uppercase focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                />
              </div>
            )}
          </div>
        </UIModalBody>
        <UIModalFooter>
          <UIButton type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</UIButton>
          <UIButton type="submit" variant="primary" isLoading={isSubmitting} loadingText="Creating..." disabled={isSubmitting || !name.trim()}>
            Create {billingMode === "B2C" ? "Customer" : "Party"}
          </UIButton>
        </UIModalFooter>
      </form>
    </UIModal>
  );
};

export const SalesDesktopPage = () => {
  const location = useLocation();
  const initialInvoice = location.state?.invoice;
  const isEditMode = Boolean(initialInvoice);

  const [billingMode, setBillingMode] = useState(initialInvoice?.billingMode || "B2C"); // "B2C" | "B2B"
  const [b2bPartyType, setB2bPartyType] = useState("all"); // "all" | "wholesaler" | "retailer"

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [selectedB2cCustomer, setSelectedB2cCustomer] = useState(
    initialInvoice?.billingMode !== "B2B" && (initialInvoice?.customerId || initialInvoice?.customer)
      ? { id: initialInvoice.customerId || "legacy", _id: initialInvoice.customerId || "legacy", name: initialInvoice.customer || "Walk-in Customer", mobile: initialInvoice.phone }
      : null
  );
  const [selectedB2bParty, setSelectedB2bParty] = useState(
    initialInvoice?.billingMode === "B2B" && (initialInvoice?.customerId || initialInvoice?.customer)
      ? { id: initialInvoice.customerId || "legacy", _id: initialInvoice.customerId || "legacy", name: initialInvoice.customer, mobile: initialInvoice.phone }
      : null
  );
  const [b2bPartiesFromBackend, setB2bPartiesFromBackend] = useState([]);

  const [isQuickCreateCustomerModalOpen, setIsQuickCreateCustomerModalOpen] = useState(false);
  const [quickCreateCustomerName, setQuickCreateCustomerName] = useState("");
  const [quickCreateCustomerType, setQuickCreateCustomerType] = useState("retail");

  const [cart, setCart] = useState(() => {
    if (!initialInvoice?.items) return [];
    return initialInvoice.items.map(item => ({
      ...item,
      id: item.productId || item.id || `legacy-${Math.random()}`,
      name: item.name,
      brand: item.brand || item.manufacturer,
      category: item.category ,
      batch: item.batch || item.batchNo,
      pack: item.pack || item.packSize,
      rack: item.rack ,
      hsn: item.hsn,
      gst: item.gst || item.gstRate || 0,
      ratePct: item.ratePct || (item.rateCPercentage !== undefined ? `${item.rateCPercentage}%` : "-"),
      rateCPercentage: item.rateCPercentage,
      expiry: item.expiry || null,
      stock: item.stock ,
      mrp: item.mrp || item.price || 0,
      price: item.price || 0,
      disc: item.disc || item.itemDiscount || 0,
      qty: item.qty || 1,
      schemeDiscountPercent: item.schemeDiscountPercent || 0,
    }));
  });

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [customerName, setCustomerName] = useState(
    initialInvoice?.billingMode !== "B2B" ? (initialInvoice?.customer || "") : ""
  );
  const [doctorName, setDoctorName] = useState(initialInvoice?.doctorName || "");
  const [customerPhone, setCustomerPhone] = useState(
    initialInvoice?.billingMode !== "B2B" ? (initialInvoice?.phone || "") : ""
  );

  const { currentBranch } = useBranch();
  const { activeShift, status: shiftStatus } = useActiveShift(currentBranch?._id);
  const navigate = useNavigate();

  const { openBusinessDay, getOpenBusinessDayStatus } = useSelector((state) => state.businessDay);
  const [isBusinessDayModalOpen, setIsBusinessDayModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const dispatch = useDispatch();

  const handleCloseBusinessDayModal = () => setIsBusinessDayModalOpen(false);
  const handleCloseShiftModal = () => setIsShiftModalOpen(false);

  const getLocalDateString = (dateObj) => {
    const d = dateObj ? new Date(dateObj) : new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const [saleDate, setSaleDate] = useState(
    activeShift?.date ? getLocalDateString(activeShift.date) : getLocalDateString()
  );

  useEffect(() => {
    if (activeShift?.date) {
      setSaleDate(getLocalDateString(activeShift.date));
    }
  }, [activeShift]);

  // Workspace Product Batch Selector Modal state
  const [selectedProductForBatches, setSelectedProductForBatches] = useState(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [showCustomerHistory, setShowCustomerHistory] = useState(false);

  const activeCustomer = billingMode === "B2C" ? selectedB2cCustomer : selectedB2bParty;

  const searchBarRef = useRef(null);
  const customerSearchBarRef = useRef(null);
  const b2bCustomerSearchBarRef = useRef(null);

  // Auto-focus handler: focuses Customer Search Bar first if customer not selected, else Product Search Bar
  useEffect(() => {
    const handleGlobalTyping = (e) => {
      // Ignore if a modal is open
      if (isBatchModalOpen || isCheckoutOpen || isReceiptOpen) return;
      // Ignore if modifier keys are pressed
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") return;

      // Single printable character keypress
      if (e.key && e.key.length === 1) {
        if (billingMode === "B2C" && !selectedB2cCustomer) {
          customerSearchBarRef.current?.focus();
        } else if (billingMode === "B2B" && !selectedB2bParty) {
          b2bCustomerSearchBarRef.current?.focus();
        } else {
          searchBarRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalTyping);
    return () => window.removeEventListener("keydown", handleGlobalTyping);
  }, [isBatchModalOpen, isCheckoutOpen, isReceiptOpen, billingMode, selectedB2cCustomer, selectedB2bParty]);

  /* if (shiftStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4 p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-text-muted">Loading POS...</p>
      </div>
    );
  } */

  /* if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4 p-8">
        <Store className="size-16 text-text-muted" />
        <h2 className="text-2xl font-bold text-text">No open shift is present</h2>
        <p className="text-text-muted">You must open a shift before you can access POS billing.</p>
        <UIButton variant="primary" onClick={() => navigate("/operations/shifts")}>Go to Shifts</UIButton>
      </div>
    );
  } */

  const handleProceedToCheckout = () => {
    if (billingMode === "B2C" && (!selectedB2cCustomer || !selectedB2cCustomer.name || selectedB2cCustomer.name.trim() === "")) {
      setToastMessage("Please enter a customer name before creating the bill.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    if (billingMode === "B2B" && (!selectedB2bParty || !selectedB2bParty.name || selectedB2bParty.name.trim() === "")) {
      setToastMessage("Please select a B2B party before creating the bill.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setIsCheckoutOpen(true);
  };

  // Ctrl + Enter (or Cmd + Enter) keyboard shortcut to Proceed to Checkout
  useEffect(() => {
    const handleCtrlEnter = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd && e.key === "Enter") {
        e.preventDefault();
        if (cart.length > 0) {
          handleProceedToCheckout();
        }
      }
    };

    window.addEventListener("keydown", handleCtrlEnter);
    return () => window.removeEventListener("keydown", handleCtrlEnter);
  }, [cart, billingMode, selectedB2cCustomer, selectedB2bParty]);

  useEffect(() => {
    const fetchB2bParties = async () => {
      try {
        const types = b2bPartyType === "all" ? "retail,wholesale" : (b2bPartyType === "wholesaler" ? "wholesale" : "retail");
        const res = await customerService.getCustomers({
          status: "active",
          customerType: types,
          limit: 100,
        });
        const customers = res.data?.data?.customers || res.data?.customers || [];
        const mapped = customers.map((c) => ({
          ...c,
          id: c._id || c.id,
          name: c.name,
          companyName: c.companyName || c.name,
          gstin: c.gstNumber || "N/A",
          partyType: c.customerType,
          creditLimit: c.creditLimit || 0,
          creditDays: c.creditDays || 0,
        }));
        setB2bPartiesFromBackend(mapped);

        if (mapped.length > 0) {
          setSelectedB2bParty(prev => {
            if (!prev) return null;
            const match = mapped.find(m => m.id === prev.id || m.id === prev._id || (prev.id === "legacy" && m.name === prev.name));
            return match || prev;
          });
        } else {
          setSelectedB2bParty(null);
        }
      } catch (err) {
        console.error("Failed to fetch B2B parties:", err);
      }
    };
    if (billingMode === "B2B") {
      fetchB2bParties();
    }
  }, [b2bPartyType, billingMode]);

  const categories = ["all", "Tablet", "Capsule", "Syrup", "Injection"];

  const filteredMedicines = POS_AVAILABLE_MEDICINES.filter((item) => {
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hsn.includes(searchQuery);

    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  const filteredB2bParties = b2bPartiesFromBackend;

  const getGstRate = (p) => {
    if (!p) return 5;
    const val =
      p.globalProduct?.gstRate ??
      p.globalProduct?.hsnMaster?.gstRate ??
      p.globalProduct?.hsnMaster?.gst ??
      p.globalProduct?.hsnTaxpercent ??
      p.globalProduct?.HsnMaster?.gstRate ??
      p.hsnTaxpercent ??
      p.gstRate ??
      p.taxRate ??
      p.gst ??
      p.gstPercentage ??
      p.taxPercentage ??
      p.gstPct ??
      p.HsnMaster?.gstRate ??
      p.HsnMaster?.gst ??
      p.hsnMaster?.gstRate ??
      p.hsnMaster?.gst;
    if (val !== undefined && val !== null && val !== "") {
      return Number(val);
    }
    return 5;
  };

  const getHsnCode = (p) => {
    if (!p) return "3004";
    const val =
      p.globalProduct?.hsn ||
      p.globalProduct?.hsnCode ||
      p.globalProduct?.hsnMaster?.code ||
      p.globalProduct?.HsnMaster?.code ||
      p.hsn ||
      p.hsnCode ||
      p.HsnMaster?.code ||
      p.hsnMaster?.code;
    return val ? String(val) : "3004";
  };

  const getExpiryString = (p) => {
    if (!p) return "11/32";
    const raw = p.expiry || p.expDate || p.expiryDate || p.displayExpDate || p.batchExpiry || p.exp_date;
    if (raw) return String(raw);
    if (p.createdAt) {
      const d = new Date(p.createdAt);
      d.setFullYear(d.getFullYear() + 2);
      return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
    }
    return "11/32";
  };

  const handleAddToCart = (medicine) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === medicine.id);
      if (existing) {
        return prev.map((item) =>
          item.id === medicine.id
            ? { ...item, qty: Math.min(medicine.stock || 999, item.qty + 1) }
            : item
        );
      }

      let basePrice = Number(medicine.price ?? 134.4);
      if (billingMode === "B2B") {
        basePrice = Number(medicine.rateB || medicine.rateb || (medicine.price ?? 134.4));
        if (selectedB2bParty?.defaultDiscount) {
          basePrice = Math.round(basePrice * (1 - selectedB2bParty.defaultDiscount / 100));
        }
      }

      return [
        ...prev,
        {
          id: medicine.id || `item-${Date.now()}`,
          name: medicine.name || medicine.displayName || "VB7 BLACK TAB 10S",
          brand: medicine.brand || medicine.displayManufacturer || medicine.manufacturer || "Pharma",
          category: medicine.category || medicine.displayCategory || "Tablet",
          batch: medicine.batch || medicine.displaySku || medicine.sku || "bbbbb",
          pack: medicine.pack || medicine.packaging || medicine.displayDosageForm || "10S",
          rack: medicine.rack || medicine.shelfLocation || "F1/AE2",
          hsn: getHsnCode(medicine),
          gst: getGstRate(medicine),
          ratePct: medicine.rateCPercentage !== undefined && medicine.rateCPercentage !== null ? `${medicine.rateCPercentage}%` : (medicine.ratePct || medicine.marginPct || "16%"),
          rateCPercentage: medicine.rateCPercentage,
          expiry: getExpiryString(medicine),
          stock: medicine.stock ?? 100,
          mrp: Number(medicine.mrp ?? 160.0),
          price: basePrice,
          disc: Number(medicine.disc ?? 0),
          qty: medicine.qty || 1,
          schemeDiscountPercent: medicine.schemeDiscountPercent || 0
        },
      ];
    });
  };

  const handleAddFromHistory = async (productId) => {
    try {
      if (!productId) return;
      const res = await workspaceProductService.getWorkspaceProductById(productId);
      const product = res.data?.data || res.data;
      if (product) {
        handleSelectWorkspaceProduct(product);
      }
    } catch (err) {
      console.error("Failed to fetch past product details:", err);
    }
  };

  const handleSelectWorkspaceProduct = (prod, details) => {
    const p = details || prod;
    setSelectedProductForBatches(p);
    setIsBatchModalOpen(true);
    setSearchQuery("");
    searchBarRef.current?.clear?.();
  };

  const handleConfirmAddBatchToCart = (itemsToAdd) => {
    const itemsList = Array.isArray(itemsToAdd) ? itemsToAdd : [itemsToAdd];
    if (itemsList.length === 0) return;

    setCart((prev) => {
      let updatedCart = [...prev];

      itemsList.forEach((item) => {
        let basePrice = item.price;
        if (billingMode === "B2B") {
          // Use rateB for B2B billing if available
          basePrice = Number(item.rateB || item.rateb || item.price || 0);

          if (selectedB2bParty?.defaultDiscount) {
            basePrice = Math.round(basePrice * (1 - selectedB2bParty.defaultDiscount / 100));
          }
        }

        const finalItem = {
          ...item,
          price: basePrice,
        };

        const existingIdx = updatedCart.findIndex((i) => i.id === finalItem.id);
        if (existingIdx >= 0) {
          const maxStock = Number(updatedCart[existingIdx].stock ?? 999999);
          const nextQty = Math.min(maxStock, updatedCart[existingIdx].qty + finalItem.qty);
          updatedCart[existingIdx] = {
            ...updatedCart[existingIdx],
            qty: nextQty,
          };
        } else {
          const maxStock = Number(finalItem.stock ?? 999999);
          updatedCart.push({
            ...finalItem,
            qty: Math.min(maxStock, finalItem.qty),
          });
        }
      });

      return updatedCart;
    });

    const totalAddedQty = itemsList.reduce((acc, i) => acc + (i.qty || 1), 0);
    setToastMessage(`Added ${itemsList.length} batch(es) (${totalAddedQty} items) for "${itemsList[0].name}" to cart.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const current = Number(item.qty) || 1;
            const maxStock = Number(item.stock ?? 999999);
            const newQty = Math.min(maxStock, current + delta);
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const handleSetQty = (id, qtyVal) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const num = parseInt(qtyVal, 10);
          const maxStock = Number(item.stock ?? 999999);
          if (!isNaN(num) && num > maxStock) {
            return { ...item, qty: maxStock };
          }
          return { ...item, qty: qtyVal };
        }
        return item;
      })
    );
  };

  const handleBlurQty = (id, qtyVal) => {
    const num = parseInt(qtyVal, 10);
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const maxStock = Number(item.stock ?? 999999);
          const finalQty = isNaN(num) || num < 1 ? 1 : Math.min(maxStock, num);
          return { ...item, qty: finalQty };
        }
        return item;
      })
    );
  };

  const handleUpdateItemDisc = (id, discVal) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, disc: discVal } : item))
    );
  };

  const handleBlurItemDisc = (id, discVal) => {
    const num = parseFloat(discVal);
    const finalDisc = isNaN(num) || num < 0 ? 0 : Math.min(100, num);
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, disc: finalDisc } : item))
    );
  };

  const handleRemoveItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Line item amount calculation
  // B2B: Rate * Qty (no disc deducted here — all discounts applied in Invoice Preview)
  // B2C: Rate * Qty * (1 - Disc/100)
  const getItemAmount = (item) => {
    const rate = Number(item.price) || 0;
    const qty = Math.max(1, Number(item.qty) || 1);
    if (billingMode === "B2B") {
      return rate * qty;
    }
    const disc = Math.max(0, Math.min(100, Number(item.disc) || 0));
    return rate * qty * (1 - disc / 100);
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + getItemAmount(item), 0);
  const cartItemCount = cart.reduce((acc, item) => acc + (Number(item.qty) || 1), 0);
  const estTax = cart.reduce((acc, item) => {
    const lineAmt = getItemAmount(item);
    const gstPct = Number(item.gst) || 5;

    // B2B tax is exclusive (added on top), B2C is inclusive (already in lineAmt, we just extract it for display if needed)
    // Actually, in the footer we show "estTax" that gets added to Subtotal ONLY if it's exclusive.
    return billingMode === "B2B" ? acc + (lineAmt * gstPct) / 100 : acc;
  }, 0);

  // For B2C, cartSubtotal already includes tax. For B2B, it doesn't.
  const cartGrandTotal = Math.round(cartSubtotal + estTax);

  const handleCompleteSale = async (saleData) => {
    let targetCustomerId = activeCustomer?.id || activeCustomer?._id;

    // Fallback: If no customer explicitly selected (e.g. walk-in B2C), fetch or use first customer from backend
    if (!targetCustomerId || targetCustomerId === "legacy") {
      try {
        const cRes = await customerService.getCustomers({ limit: 1 });
        const cList = cRes.data?.data?.customers || cRes.data?.customers || cRes.data?.data || [];
        if (cList.length > 0) {
          targetCustomerId = cList[0]._id || cList[0].id;
        }
      } catch (cErr) {
        console.warn("Could not fetch fallback customer for sale:", cErr);
      }
    }

    // Post to backend API
    if (targetCustomerId) {
      const activeBranchId = saleData.items?.[0]?.branchId || saleData.items?.[0]?.facilityId || null;
      const payload = {
        invoiceNo: saleData.invoiceNo,
        billingMode,
        branchId: activeBranchId,
        subtotal: saleData.subtotal || saleData.subTotal,
        discount: saleData.extraDiscount || saleData.discount || saleData.totalDiscount,
        tax: saleData.tax || saleData.taxAmount,
        grandTotal: saleData.grandTotal,
        roundOff: saleData.roundOff,
        paymentMethod: saleData.paymentMethod,
        payments: saleData.payments,
        items: saleData.items,
        date: activeShift?.date ? new Date(activeShift.date).toISOString() : new Date().toISOString(),
      };

      if (isEditMode && initialInvoice?.id) {
        await invoiceService.updateCustomerSale(targetCustomerId, initialInvoice.id, payload);
      } else {
        await invoiceService.recordCustomerSale(targetCustomerId, payload);
      }
    }

    // On confirmed backend success, close checkout, set completed sale state, open receipt, and clear cart
    setIsCheckoutOpen(false);
    setCompletedSale({
      ...saleData,
      date: activeShift?.date ? new Date(activeShift.date).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString(),
      billingMode,
      partyType: billingMode === "B2B" ? selectedB2bParty?.partyType || "wholesaler" : "retail",
    });
    setIsReceiptOpen(true);
    setCart([]);
    setSelectedB2cCustomer(null);
    setSelectedB2bParty(null);
    setCustomerName("");
    setCustomerPhone("");
    setDoctorName("");
    setShowCustomerHistory(false);
    customerSearchBarRef.current?.clear?.();
    b2bCustomerSearchBarRef.current?.clear?.();
    setToastMessage(`✅ ${billingMode} Invoice ${saleData.invoiceNo} created & saved in backend.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (shiftStatus === "loading" && !activeShift) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4 p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-text-muted">Loading POS...</p>
      </div>
    );
  }

  if (!activeShift) {
    const isDayOpen = Boolean(openBusinessDay);

    return (
      <div className="relative min-h-[calc(100vh-80px)] w-full flex items-center justify-center p-6 bg-slate-50/80 dark:bg-neutral-950 overflow-hidden font-sans">
        {/* Blurred realistic POS background mockup to mirror the exact uploaded design */}
        <div className="absolute inset-0 filter blur-[5px] opacity-35 dark:opacity-15 pointer-events-none select-none scale-102 flex flex-col bg-bg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-surface border-b border-border">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-text">POS Billing</h1>
              <p className="text-xs text-text-muted">Scan products, add to cart and create sale</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold">Recall Bill</span>
              <span className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold">Hold Bill</span>
              <span className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold">+ New Bill</span>
            </div>
          </div>
          {/* Content grid preview */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 p-4 space-y-4">
              <div className="h-10 bg-surface rounded-xl border border-border" />
              <div className="flex gap-2">
                {["All", "Prescription", "OTC", "Healthcare", "Personal Care", "Vitamins", "Devices"].map((t) => (
                  <span key={t} className="px-3 py-1 rounded-full bg-surface border border-border text-xs">{t}</span>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-36 rounded-xl bg-surface border border-border p-3 space-y-2">
                    <div className="h-16 bg-surface-alt rounded-lg" />
                    <div className="h-3 w-3/4 bg-surface-alt rounded" />
                    <div className="h-3 w-1/2 bg-surface-alt rounded" />
                  </div>
                ))}
              </div>
            </div>
            <div className="w-80 border-l border-border bg-surface p-4 space-y-3">
              <div className="h-5 w-24 bg-surface-alt rounded" />
              <div className="h-40 bg-surface-alt/40 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Soft backdrop scrim */}
        <div className="absolute inset-0 bg-slate-900/10 dark:bg-black/40 backdrop-blur-[2px] pointer-events-none" />

        {/* Reusable Pre-Session Gatekeeper Card */}
        <div className="relative z-10">
          <POSSessionGatekeeperCard
            isDayOpen={isDayOpen}
            openBusinessDay={openBusinessDay}
            currentBranch={currentBranch}
            onOpenBusinessDay={() => setIsBusinessDayModalOpen(true)}
            onStartShift={() => setIsShiftModalOpen(true)}
          />
        </div>

        <OpenBusinessDayDialog isOpen={isBusinessDayModalOpen} onClose={handleCloseBusinessDayModal} />
        <CreateShiftDialog isOpen={isShiftModalOpen} onClose={handleCloseShiftModal} />
      </div>
    );
  }

  return (
    <section className="-m-6 h-[calc(100dvh-58px)] max-h-[calc(100dvh-58px)] w-[calc(100%+3rem)] bg-bg flex flex-col font-sans overflow-hidden">

      {/* ── TOAST NOTIFICATION ───────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 rounded-2xl border border-primary/25 bg-surface/98 px-5 py-2.5 text-sm font-semibold text-text shadow-xl backdrop-blur-md whitespace-nowrap pointer-events-none"
          >
            <CheckCircle2 className="size-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP BAR ────────────────────────────────────── */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 gap-4 bg-surface border-b border-border z-20">
        {/* Left: Brand + Shift indicator */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="size-2 rounded-full bg-success animate-pulse shrink-0" />
          <h1 className="text-[15px] font-extrabold text-text tracking-tight whitespace-nowrap">
            POS Billing
          </h1>
          <span
            className={cn(
              "px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border whitespace-nowrap shrink-0",
              billingMode === "B2B"
                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                : "bg-primary/10 text-primary border-primary/20"
            )}
          >
            {billingMode === "B2B" ? "B2B Commercial" : "B2C Retail"}
          </span>
          {activeShift?.date && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-text-muted bg-surface-alt px-2.5 py-1 rounded-lg border border-border shrink-0">
              <RefreshCw className="size-3 text-primary" />
              {new Date(activeShift.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          )}
        </div>

        {/* Center: B2C / B2B Mode Toggle */}
        <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-border shrink-0">
          <button
            type="button"
            onClick={() => setBillingMode("B2C")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              billingMode === "B2C"
                ? "bg-surface text-primary shadow-xs border border-border"
                : "text-text-muted hover:text-text"
            )}
          >
            <User className="size-3.5" />
            <span>B2C Retail</span>
          </button>
          <button
            type="button"
            onClick={() => { setBillingMode("B2B"); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              billingMode === "B2B"
                ? "bg-surface text-purple-600 dark:text-purple-400 shadow-xs border border-border"
                : "text-text-muted hover:text-text"
            )}
          >
            <Building2 className="size-3.5" />
            <span>B2B Commercial</span>
          </button>
        </div>

        {/* Right: History toggle + shortcut hint */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:flex items-center gap-1 text-[10.5px] text-text-muted bg-surface-alt px-2 py-1 rounded-lg border border-border font-mono select-none">
            <kbd className="font-bold text-text">Ctrl</kbd>+<kbd className="font-bold text-text">↵</kbd>
            <span className="font-sans ml-0.5">Checkout</span>
          </span>
          <UIIconButton
            icon={<History className="size-4" />}
            variant={showCustomerHistory ? "soft" : "ghost"}
            size="sm"
            title="Toggle Customer History"
            onClick={() => setShowCustomerHistory(!showCustomerHistory)}
          />
        </div>
      </div>

      {/* ── MAIN BODY ───────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── LEFT PANEL: Customer strip + Search + Cart ── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Customer Strip */}
          <div className="shrink-0 border-b border-border bg-surface">
            {billingMode === "B2C" ? (
              <div className="px-4 py-2.5">
                <SalesCustomerDoctorInfo
                  customerSearchBarRef={customerSearchBarRef}
                  selectedCustomer={selectedB2cCustomer}
                  onSelectCustomer={setSelectedB2cCustomer}
                  customerName={customerName}
                  onChangeCustomerName={setCustomerName}
                  customerPhone={customerPhone}
                  onChangeCustomerPhone={setCustomerPhone}
                  doctorName={doctorName}
                  onChangeDoctorName={setDoctorName}
                  saleDate={saleDate}
                  onChangeSaleDate={setSaleDate}
                  onAddNewCustomer={(name) => {
                    setQuickCreateCustomerName(name);
                    setQuickCreateCustomerType("other");
                    setIsQuickCreateCustomerModalOpen(true);
                  }}
                />
              </div>
            ) : (
              /* B2B Party Strip */
              <div className="px-4 py-2.5 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <B2bCustomerSearchBar
                      ref={b2bCustomerSearchBarRef}
                      selectedCustomer={selectedB2bParty}
                      onSelectCustomer={(party) => {
                        setSelectedB2bParty(party);
                        setTimeout(() => searchBarRef.current?.focus(), 80);
                      }}
                      b2bPartyType={b2bPartyType}
                      showAddNewAction={true}
                      onAddNewCustomer={(name) => {
                        setQuickCreateCustomerName(name);
                        setQuickCreateCustomerType(b2bPartyType === "wholesaler" ? "wholesale" : "retail");
                        setIsQuickCreateCustomerModalOpen(true);
                      }}
                      placeholder="Search B2B party by name, GST, or phone..."
                      size="sm"
                    />
                  </div>
                  {/* Party type filter chips */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {[
                      { value: "all", label: "All", icon: null },
                      { value: "wholesaler", label: "Wholesaler", icon: <Briefcase className="size-3" /> },
                      { value: "retailer", label: "Retailer", icon: <Store className="size-3" /> },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setB2bPartyType(opt.value)}
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer",
                          b2bPartyType === opt.value
                            ? "bg-purple-600 text-white shadow-xs"
                            : "bg-surface-alt text-text-muted hover:text-text border border-border"
                        )}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* B2B selected party credit info */}
                {selectedB2bParty && (
                  <div className="flex items-center gap-3 text-[11px] flex-wrap">
                    <span className="font-bold text-text">{selectedB2bParty.name}</span>
                    {((selectedB2bParty.outstandingAmount || selectedB2bParty.openingBalance) > 0) && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-error-soft/50 border border-error/20 font-mono font-bold text-error">
                        Credit: {(selectedB2bParty.outstandingAmount || selectedB2bParty.openingBalance || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })} {(selectedB2bParty.balanceType || selectedB2bParty.openingBalanceType || "DR").toUpperCase()}
                      </span>
                    )}
                    {(selectedB2bParty.creditLimit > 0) && (
                      <span className="text-text-muted">
                        Limit: <span className="font-bold text-text">{selectedB2bParty.creditLimit.toLocaleString("en-IN", { style: "currency", currency: "INR" })}</span>
                      </span>
                    )}
                    {(selectedB2bParty.creditDays > 0) && (
                      <span className="text-text-muted">
                        Days: <span className="font-bold text-text">{selectedB2bParty.creditDays}d</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Search Bar */}
          <div className="shrink-0 px-3 py-2.5 border-b border-border bg-surface-alt/30">
            <WorkspaceProductSearchBar
              ref={searchBarRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSelectProduct={handleSelectWorkspaceProduct}
              branchId={currentBranch?._id || currentBranch?.id || null}
              placeholder="Scan barcode or search product / medicine by name, SKU, brand..."
              size="md"
              showDetailsPreview
            />
          </div>

          {/* ── CART TABLE — only this section scrolls ── */}
          <div className="flex-1 overflow-y-auto">
            {cart.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-neutral-100/98 dark:bg-neutral-800/98 border-b border-border text-[10px] font-bold text-text-muted uppercase tracking-wider select-none">
                    <th className="py-2 px-2 text-center w-8">#</th>
                    <th className="py-2 px-2 min-w-[160px]">Item</th>
                    <th className="py-2 px-2 w-[72px]">Batch</th>
                    <th className="py-2 px-1.5 w-[48px]">Pack</th>
                    <th className="py-2 px-1.5 w-[52px]">Rack</th>
                    <th className="py-2 px-1.5 w-[48px] font-mono">HSN</th>
                    <th className="py-2 px-1.5 w-[48px] font-mono">GST%</th>
                    {billingMode === "B2C" ? (
                      <th className="py-2 px-1.5 w-[48px] font-mono">Rate%</th>
                    ) : cart.some((i) => Number(i.schemeDiscountPercent) > 0) && (
                      <th className="py-2 px-1.5 w-[56px] font-mono">Schm%</th>
                    )}
                    <th className="py-2 px-1.5 w-[64px] font-mono text-right">MRP</th>
                    <th className="py-2 px-1.5 w-[64px] font-mono text-right">Rate</th>
                    {billingMode !== "B2C" && <th className="py-2 px-1.5 w-[52px] font-mono text-center">Disc%</th>}
                    <th className="py-2 px-1.5 w-[100px] font-mono text-center">Qty</th>
                    <th className="py-2 px-1.5 w-[52px] font-mono">Expiry</th>
                    <th className="py-2 px-2 w-[72px] font-mono text-right">Amount</th>
                    <th className="py-2 px-1.5 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {cart.map((item, idx) => {
                    const lineAmt = getItemAmount(item);
                    return (
                      <tr key={item.id} className="hover:bg-surface-hover/60 transition-colors group">
                        {/* # */}
                        <td className="py-1.5 px-2 text-center text-text-muted font-mono text-[10px]">{idx + 1}</td>

                        {/* Item Name */}
                        <td className="py-1.5 px-2">
                          <span className="font-bold text-text block truncate text-[11px] leading-tight">{item.name}</span>
                          <span className="text-[10px] text-text-muted block truncate">{item.brand} · {item.category}</span>
                        </td>

                        {/* Batch */}
                        <td className="py-1.5 px-2 font-mono text-[10.5px] text-text-muted font-semibold truncate">{item.batch}</td>

                        {/* Pack */}
                        <td className="py-1.5 px-1.5 text-[10.5px] text-text-muted truncate">{item.pack}</td>

                        {/* Rack */}
                        <td className="py-1.5 px-1.5 font-mono text-[10.5px] text-primary font-bold truncate">{item.rack}</td>

                        {/* HSN */}
                        <td className="py-1.5 px-1.5 font-mono text-[10.5px] text-text-muted">{item.hsn}</td>

                        {/* GST % */}
                        <td className="py-1.5 px-1.5 font-mono text-[10.5px] font-bold text-purple-600 dark:text-purple-400">
                          {item.gst !== undefined && item.gst !== null ? `${item.gst}%` : `${getGstRate(item)}%`}
                        </td>

                        {/* Rate % (B2C) / Scheme % (B2B) */}
                        {billingMode === "B2C" ? (
                          <td className="py-1.5 px-1.5 font-mono text-[10.5px] text-success font-semibold">
                            {item.rateCPercentage !== undefined && item.rateCPercentage !== null ? `${item.rateCPercentage}%` : item.ratePct}
                          </td>
                        ) : cart.some((i) => Number(i.schemeDiscountPercent) > 0) && (() => {
                          const schemeCheck = computeSchemeDiscount(Number(item.qty) || 1, Number(item.schemeDiscountPercent) || 0);
                          return (
                            <td className="py-1.5 px-1.5 font-mono text-[10.5px] text-success font-semibold">
                              {schemeCheck.schemeApply ? item.schemeDiscountPercent : "—"}
                            </td>
                          );
                        })()}

                        {/* MRP */}
                        <td className="py-1.5 px-1.5 font-mono text-right text-[10.5px] text-text-muted">
                          ₹{Number(item.mrp).toFixed(2)}
                        </td>

                        {/* Rate */}
                        <td className="py-1.5 px-1.5 font-mono text-right text-[10.5px] font-bold text-text">
                          ₹{Number(item.price).toFixed(2)}
                        </td>

                        {/* Disc % (B2B only) */}
                        {billingMode !== "B2C" && (
                          <td className="py-1.5 px-1.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.disc ?? 0}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleUpdateItemDisc(item.id, e.target.value)}
                              onBlur={(e) => handleBlurItemDisc(item.id, e.target.value)}
                              className="w-11 text-center rounded border border-border bg-surface px-1 py-0.5 font-mono text-[10.5px] text-text focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                        )}

                        {/* Qty Stepper */}
                        <td className="py-1.5 px-1.5 text-center">
                          <div className="inline-flex items-center gap-0.5 bg-surface-alt rounded-lg border border-border p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.id, -1)}
                              className="size-5 rounded flex items-center justify-center hover:bg-surface-hover text-text-muted hover:text-text cursor-pointer transition-colors"
                            >
                              <Minus className="size-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleSetQty(item.id, e.target.value)}
                              onBlur={(e) => handleBlurQty(item.id, e.target.value)}
                              className="w-9 text-center bg-transparent border-0 font-mono font-bold text-[11px] text-text outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              disabled={Number(item.qty) >= Number(item.stock ?? 999999)}
                              onClick={() => handleUpdateQty(item.id, 1)}
                              className={cn(
                                "size-5 rounded flex items-center justify-center transition-colors",
                                Number(item.qty) >= Number(item.stock ?? 999999)
                                  ? "opacity-30 cursor-not-allowed text-text-muted"
                                  : "hover:bg-surface-hover text-text-muted hover:text-text cursor-pointer"
                              )}
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                        </td>

                        {/* Expiry */}
                        <td className="py-1.5 px-1.5 font-mono text-[10.5px] text-text font-semibold">
                          {item.expiry || item.expDate || item.expiryDate || "—"}
                        </td>

                        {/* Amount */}
                        <td className="py-1.5 px-2 font-mono text-right font-extrabold text-primary text-[11px] tabular-nums">
                          ₹{lineAmt.toFixed(2)}
                        </td>

                        {/* Remove */}
                        <td className="py-1.5 px-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-text-muted hover:text-error transition-colors p-1 cursor-pointer rounded opacity-0 group-hover:opacity-100"
                            title="Remove item"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full py-16 gap-4">
                <div className="size-16 rounded-2xl bg-surface-alt flex items-center justify-center border border-border">
                  <Barcode className="size-8 text-text-muted opacity-40" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-text-muted">Cart is empty</p>
                  <p className="text-xs text-text-muted/70">
                    Search or scan a product to add it to the bill
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL (Fixed 340px Width, Never Shifts Left Section) ── */}
        <div className="w-[340px] shrink-0 h-full max-h-full flex flex-col border-l border-border bg-surface overflow-hidden">
          {!showCustomerHistory ? (
            /* Order Summary */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Billed To Header */}
              <div className="px-4 pt-3.5 pb-2.5 border-b border-border/70 shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Billed To</span>
                  <UIBadge
                    className={cn(
                      "text-[10px] font-bold border",
                      billingMode === "B2B"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        : "bg-primary/10 text-primary border-primary/20"
                    )}
                  >
                    {billingMode}
                  </UIBadge>
                </div>
                <div className="space-y-0.5">
                  <p className={cn(
                    "font-extrabold text-sm leading-tight",
                    activeCustomer ? "text-text" : "text-text-muted/60 italic text-xs"
                  )}>
                    {billingMode === "B2C"
                      ? (customerName || activeCustomer?.name || "No customer selected")
                      : (activeCustomer?.name || "No party selected")}
                  </p>
                  {(billingMode === "B2C" ? (customerPhone || activeCustomer?.phone) : activeCustomer?.phone) && (
                    <p className="text-[11px] font-mono text-text-muted">
                      {billingMode === "B2C" ? (customerPhone || activeCustomer?.phone) : activeCustomer?.phone}
                    </p>
                  )}
                  {billingMode === "B2C" && doctorName && (
                    <p className="text-[11px] text-text-muted">Dr. {doctorName}</p>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="flex-1 overflow-y-auto min-h-0 px-4 py-2.5 space-y-1.5">
                {/* Items count row */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-text-muted flex items-center gap-1.5">
                    <ShoppingCart className="size-3.5" />
                    Items in cart
                  </span>
                  <span className="text-xs font-bold text-text font-mono">{cartItemCount}</span>
                </div>

                <div className="border-t border-border/60" />

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-text-muted">Subtotal</span>
                  <span className="text-xs font-bold text-text font-mono tabular-nums">₹{cartSubtotal.toFixed(2)}</span>
                </div>

                {billingMode === "B2B" && estTax > 0 && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs text-text-muted">Est. GST</span>
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 font-mono tabular-nums">+₹{estTax.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-border/60 my-1" />

                {/* Grand Total highlight */}
                <div className="bg-primary/8 rounded-xl border border-primary/15 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70">Grand Total</p>
                    <p className="text-2xl font-black text-text tabular-nums font-mono leading-none mt-0.5">
                      ₹{cartGrandTotal.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Receipt className="size-5 text-primary" />
                  </div>
                </div>

                {/* Cart Items Quick Preview */}
                {cart.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">Cart Items</p>
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-[11px] py-0.5">
                        <span className="text-text-muted truncate max-w-[190px]">
                          {item.name} <span className="font-mono text-text-muted">×{item.qty}</span>
                        </span>
                        <span className="font-mono font-bold text-text tabular-nums shrink-0 ml-2">₹{getItemAmount(item).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Customer History Panel in the SAME EXACT 340px container */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-surface">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-primary" />
                  <span className="text-sm font-bold text-text">Customer History</span>
                </div>
                <UIButton
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowCustomerHistory(false)}
                  startIcon={<ChevronLeft className="size-3.5" />}
                  className="text-xs font-bold text-primary cursor-pointer"
                >
                  Summary
                </UIButton>
              </div>
              <div className="flex-1 overflow-y-auto bg-surface-alt/40 min-h-0">
                <SalesCustomerSidebar
                  customer={billingMode === 'B2C' ? (activeCustomer || { name: customerName, phone: customerPhone }) : activeCustomer}
                  onAddProduct={handleAddFromHistory}
                />
              </div>
            </div>
          )}

          {/* ── PERMANENT BOTTOM CTA: Checkout + Clear Cart Side-by-Side ── */}
          <div className="p-3 border-t border-border/70 bg-surface shrink-0 sticky bottom-0 z-10">
            <div className="flex items-center gap-2">
              <PermissionGate
                permission="pos:create"
                fallback={
                  <UIButton variant="primary" size="lg" className="flex-1" disabled>
                    Checkout (pos:create required)
                  </UIButton>
                }
              >
                <UIButton
                  variant="primary"
                  size="lg"
                  disabled={cart.length === 0}
                  onClick={handleProceedToCheckout}
                  endIcon={<Receipt className="size-4.5" />}
                  className="flex-1 h-11 text-sm font-bold"
                >
                  {cart.length === 0
                    ? "Add items to checkout"
                    : `Checkout · ₹${cartGrandTotal.toLocaleString("en-IN")}`}
                </UIButton>
              </PermissionGate>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className="h-11 px-3 rounded-xl border border-error/30 bg-error-soft/30 hover:bg-error-soft/60 text-error flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Clear Cart"
                  aria-label="Clear Cart"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ─────────────────────────────────────── */}
      <SalesCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        customer={activeCustomer}
        customerPhone={customerPhone}
        doctor={doctorName}
        saleDate={saleDate}
        billingMode={billingMode}
        activeShift={activeShift}
        cartSummary={{ items: cart, subtotal: cartSubtotal }}
        initialPayments={initialInvoice?.payments}
        initialDenominations={initialInvoice?.denominations}
        initialReturnedDenominations={initialInvoice?.returnedDenominations}
        onCompleteSale={handleCompleteSale}
      />

      <SalesReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setTimeout(() => {
            if (billingMode === "B2C") {
              customerSearchBarRef.current?.focus?.();
            } else {
              b2bCustomerSearchBarRef.current?.focus?.();
            }
          }, 100);
        }}
        saleData={completedSale}
      />

      <WorkspaceProductBatchSelectorModal
        open={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        product={selectedProductForBatches}
        billingMode={billingMode}
        onConfirmAddToCart={handleConfirmAddBatchToCart}
      />

      <QuickCreateCustomerModal
        open={isQuickCreateCustomerModalOpen}
        onClose={() => setIsQuickCreateCustomerModalOpen(false)}
        defaultName={quickCreateCustomerName}
        customerType={quickCreateCustomerType}
        billingMode={billingMode}
        onSuccess={(newCustomer) => {
          if (billingMode === "B2C") {
            setSelectedB2cCustomer(newCustomer);
          } else {
            setSelectedB2bParty(newCustomer);
          }
        }}
      />
    </section>
  );
};

export default SalesDesktopPage;
