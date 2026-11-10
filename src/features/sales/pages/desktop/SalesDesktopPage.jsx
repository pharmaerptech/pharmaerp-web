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
  PauseCircle,
  Play,
  AlertCircle,
  ArrowLeft,
  RotateCcw,
  Calendar,
} from "lucide-react";
import {
  UICard,
  UIButton,
  UIIconButton,
  UITabs,
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
import { OrderInvoiceModal } from "../../components/OrderInvoiceModal";
import { SalesInvoicePreviewModal } from "../../components/SalesInvoicePreviewModal";
import { SalesReceiptModal } from "../../components/SalesReceiptModal";
import { SalesCustomerSidebar } from "../../components/SalesCustomerSidebar";
import { SalesCustomerDoctorInfo } from "../../components/SalesCustomerDoctorInfo";
import { POSSessionGatekeeperCard } from "../../components/POSSessionGatekeeperCard";
import {
  HoldBillModal,
  HeldBillsModal,
  ResumeConflictDialog,
} from "../../components";
import { useHoldBills } from "../../hooks/useHoldBills";
import {
  saveAutoHeldBill,
  hasMeaningfulSalesDraft,
} from "../../services/holdBillStorage";
import { TOKEN_KEY } from "@/constants";
import { storage } from "@/utils";
import OpenBusinessDayDialog from "@/features/operations/business-days/components/OpenBusinessDayDialog";
import { getOpenBusinessDay } from "@/features/operations/business-days/store/businessDayThunk";
import { CreateShiftDialog } from "@/features/operations/shifts/components/CreateShiftDialog";
import { QuickCreateDoctorModal } from "@/features/doctors/components/QuickCreateDoctorModal";

import customerService from "@/features/parties/customers/services/customerService";
import invoiceService from "@/features/sales/services/invoiceService";
import workspaceProductService from "@/features/workspace-products/services/workspaceProductService";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import useBranch from "@/features/branch/hooks/useBranch";
import useCompany from "@/features/company/hooks/useCompany";
import { useActiveShift } from "@/features/operations/shifts/hooks/useActiveShift";
import { fetchBranchCash } from "@/features/finance/treasury/cash-management/branch-cash/store/branchCashThunk";

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
  const [address, setAddress] = useState("");
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
      setAddress("");
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
      if (address.trim()) {
        payload.billingAddress = {
          addressLine1: address.trim(),
        };
        payload.address = address.trim();
      }
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
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 123 Health Ave, Clinic Road (Optional)"
              className="w-full h-9 rounded-lg border border-border px-3 text-sm bg-surface text-text focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
            />
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
  const { invoiceId: routeInvoiceId } = useParams();
  const initialInvoice = location.state?.invoice;
  const initialResumeHeldBill = location.state?.resumeHeldBill;
  const [editInvoiceData, setEditInvoiceData] = useState(initialInvoice || null);
  const isEditMode = Boolean(routeInvoiceId || initialInvoice);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(!initialInvoice && Boolean(routeInvoiceId));
  const [loadInvoiceError, setLoadInvoiceError] = useState(null);

  const [billingMode, setBillingMode] = useState(
    initialResumeHeldBill?.billingMode || initialInvoice?.billingMode || "B2C"
  ); // "B2C" | "B2B"
  const [b2bPartyType, setB2bPartyType] = useState(
    initialResumeHeldBill?.b2bPartyType || "all"
  ); // "all" | "wholesaler" | "retailer"

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [selectedB2cCustomer, setSelectedB2cCustomer] = useState(() => {
    if (initialResumeHeldBill && initialResumeHeldBill.billingMode !== "B2B") {
      return initialResumeHeldBill.customer || null;
    }
    const inv = initialInvoice;
    if (inv?.billingMode !== "B2B" && (inv?.customerId || inv?.customer || inv?.customerObj)) {
      const cObj = inv.customerObj || (typeof inv.customerId === "object" ? inv.customerId : null);
      return {
        id: cObj?._id || inv.customerId || "legacy",
        _id: cObj?._id || inv.customerId || "legacy",
        name: inv.customerName || inv.customer || cObj?.name || "Walk-in Customer",
        mobile: inv.customerPhone || inv.phone || cObj?.mobile || "",
        ...(cObj || {}),
      };
    }
    return null;
  });

  const [selectedB2bParty, setSelectedB2bParty] = useState(() => {
    if (initialResumeHeldBill && initialResumeHeldBill.billingMode === "B2B") {
      return initialResumeHeldBill.customer || null;
    }
    const inv = initialInvoice;
    if (inv?.billingMode === "B2B" && (inv?.customerId || inv?.customer || inv?.customerObj)) {
      const cObj = inv.customerObj || (typeof inv.customerId === "object" ? inv.customerId : null);
      return {
        id: cObj?._id || inv.customerId || "legacy",
        _id: cObj?._id || inv.customerId || "legacy",
        name: inv.customerName || inv.customer || cObj?.name,
        mobile: inv.customerPhone || inv.phone || cObj?.mobile,
        ...(cObj || {}),
      };
    }
    return null;
  });
  const [defaultWalkInCustomer, setDefaultWalkInCustomer] = useState(null);
  const [b2bPartiesFromBackend, setB2bPartiesFromBackend] = useState([]);

  // Auto-fetch singleton Walk-in Customer for counter POS sales
  useEffect(() => {
    let isMounted = true;
    customerService
      .getWalkInCustomer()
      .then((res) => {
        if (!isMounted) return;
        const wCust = res.data?.data || res.data;
        if (wCust) {
          const mapped = {
            ...wCust,
            id: wCust._id || wCust.id,
            name: wCust.name || "Walk-in Customer",
            mobile: wCust.mobile || wCust.phone || "",
            isWalkIn: true,
          };
          setDefaultWalkInCustomer(mapped);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch default Walk-in Customer:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const [isQuickCreateCustomerModalOpen, setIsQuickCreateCustomerModalOpen] = useState(false);
  const [quickCreateCustomerName, setQuickCreateCustomerName] = useState("");
  const [quickCreateCustomerType, setQuickCreateCustomerType] = useState("retail");

  const [cart, setCart] = useState(() => {
    if (Array.isArray(initialResumeHeldBill?.cart) && initialResumeHeldBill.cart.length > 0) {
      return initialResumeHeldBill.cart;
    }
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

  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [customerName, setCustomerName] = useState(() => {
    if (initialResumeHeldBill && initialResumeHeldBill.billingMode !== "B2B") {
      return initialResumeHeldBill.customerName || "";
    }
    return initialInvoice?.billingMode !== "B2B" ? (initialInvoice?.customer || "") : "";
  });
  const [doctorName, setDoctorName] = useState(
    initialResumeHeldBill?.doctorName || initialInvoice?.doctorName || ""
  );
  const [selectedDoctor, setSelectedDoctor] = useState(() => {
    if (initialResumeHeldBill?.doctorId) {
      return { id: initialResumeHeldBill.doctorId, _id: initialResumeHeldBill.doctorId, name: initialResumeHeldBill.doctorName };
    }
    if (initialInvoice?.doctorId) {
      return { id: initialInvoice.doctorId, _id: initialInvoice.doctorId, name: initialInvoice.doctor || initialInvoice.doctorName };
    }
    return null;
  });
  const [isQuickCreateDoctorModalOpen, setIsQuickCreateDoctorModalOpen] = useState(false);
  const [quickCreateDoctorName, setQuickCreateDoctorName] = useState("");
  const [customerPhone, setCustomerPhone] = useState(() => {
    if (initialResumeHeldBill && initialResumeHeldBill.billingMode !== "B2B") {
      return initialResumeHeldBill.customerPhone || "";
    }
    return initialInvoice?.billingMode !== "B2B" ? (initialInvoice?.phone || "") : "";
  });

  const { currentBranch } = useBranch();
  const { currentCompany } = useCompany();
  const branchId = currentBranch?._id || currentBranch?.id || null;
  const { activeShift, status: shiftStatus, refetch: refetchActiveShift } = useActiveShift(branchId);
  const navigate = useNavigate();

  // ── Route-based Invoice Hydration (Edit Invoice Mode & Refresh Support) ──
  useEffect(() => {
    if (!routeInvoiceId) return;

    let isMounted = true;
    const loadInvoice = async () => {
      if (!initialInvoice) {
        setIsLoadingInvoice(true);
      }
      try {
        const res = await invoiceService.getInvoiceById(routeInvoiceId);
        const inv = res?.data?.data || res?.data || null;
        if (!inv || !isMounted) return;

        setEditInvoiceData(inv);

        if (inv.status === "Cancelled") {
          setLoadInvoiceError("This invoice has been cancelled and cannot be edited.");
          return;
        }

        const bMode = inv.billingMode || "B2C";
        setBillingMode(bMode);

        const custObj = inv.customerId && typeof inv.customerId === "object" ? inv.customerId : null;
        const custName = custObj?.name || inv.customerName || inv.customer || "Walk-in Customer";
        const custPhone = custObj?.mobile || custObj?.phone || inv.customerPhone || inv.phone || "";

        const fullCust = {
          ...(custObj || {}),
          id: custObj?._id || inv.customerId || "walkin",
          _id: custObj?._id || inv.customerId || "walkin",
          name: custName,
          mobile: custPhone,
        };

        if (bMode === "B2B") {
          setSelectedB2bParty(fullCust);
          setSelectedB2cCustomer(null);
        } else {
          setSelectedB2cCustomer(fullCust);
          setSelectedB2bParty(null);
          setCustomerName(custName);
          setCustomerPhone(custPhone);
        }

        const docObj = inv.doctorId && typeof inv.doctorId === "object" ? inv.doctorId : null;
        const dName = docObj?.name || inv.doctor || inv.doctorName || "";
        setDoctorName(dName);
        if (docObj) {
          setSelectedDoctor({
            ...docObj,
            id: docObj._id || docObj.id,
            name: dName,
          });
        } else if (inv.doctorId) {
          setSelectedDoctor({
            id: inv.doctorId,
            _id: inv.doctorId,
            name: dName,
          });
        } else if (dName) {
          setSelectedDoctor({ name: dName });
        }

        if (inv.date) {
          setSaleDate(getLocalDateString(inv.date));
        }

        if (Array.isArray(inv.items)) {
          const mappedItems = inv.items.map((item) => ({
            ...item,
            id: item.productId || item._id || item.id || `item-${Math.random()}`,
            name: item.name,
            brand: item.brand || item.manufacturer,
            category: item.category,
            batch: item.batch || item.batchNo,
            pack: item.pack || item.packSize,
            rack: item.rack,
            hsn: item.hsn,
            gst: item.gst || item.gstRate || 0,
            ratePct: item.ratePct || (item.rateCPercentage !== undefined ? `${item.rateCPercentage}%` : "-"),
            rateCPercentage: item.rateCPercentage,
            expiry: item.expiry || null,
            stock: item.stock !== undefined ? item.stock : 999999,
            mrp: item.mrp || item.price || 0,
            price: item.price || 0,
            disc: item.disc || item.itemDiscount || 0,
            qty: item.qty || 1,
            schemeDiscountPercent: item.schemeDiscountPercent || 0,
          }));
          setCart(mappedItems);
        }
      } catch (err) {
        console.error("Failed to load invoice for editing:", err);
        if (isMounted) {
          setLoadInvoiceError(err?.response?.data?.message || err?.message || "Failed to load invoice for editing.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingInvoice(false);
        }
      }
    };

    loadInvoice();

    return () => {
      isMounted = false;
    };
  }, [routeInvoiceId]);

  // ── Hold Bill System ─────────────────────────────
  const {
    heldBills,
    count: heldBillsCount,
    holdBill,
    getAutoHold,
    consumeAutoHold,
    removeAutoHold,
    resumeBill,
    discardBill,
    clearAll: clearAllHeldBills,
    workspaceId: holdWorkspaceId,
    companyId: holdCompanyId,
  } = useHoldBills();

  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [isHeldBillsModalOpen, setIsHeldBillsModalOpen] = useState(false);
  const [pendingResumeBill, setPendingResumeBill] = useState(null);
  const [isResumeConflictOpen, setIsResumeConflictOpen] = useState(false);
  const [isReturnInvoice, setIsReturnInvoice] = useState(
    Boolean(initialResumeHeldBill?.isReturnInvoice)
  );

  const { openBusinessDay, getOpenBusinessDayStatus } = useSelector((state) => state.businessDay);
  const [isBusinessDayModalOpen, setIsBusinessDayModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (branchId) {
      dispatch(getOpenBusinessDay(branchId));
    }
  }, [branchId, dispatch]);

  const handleCloseBusinessDayModal = () => {
    setIsBusinessDayModalOpen(false);
    if (branchId) {
      dispatch(getOpenBusinessDay(branchId));
    }
  };

  const handleCloseShiftModal = () => {
    setIsShiftModalOpen(false);
    if (typeof refetchActiveShift === "function") {
      refetchActiveShift();
    }
    if (branchId) {
      dispatch(getOpenBusinessDay(branchId));
    }
  };

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

  const hasInitializedAutoHoldRef = useRef(false);
  const pendingExplicitResumeRef = useRef(initialResumeHeldBill || null);

  const currentDraftSnapshot = {
    workspaceId: holdWorkspaceId,
    companyId: holdCompanyId,
    branchId,
    activeShift,
    isEditMode,
    billingMode,
    b2bPartyType,
    selectedB2cCustomer,
    selectedB2bParty,
    customerName,
    customerPhone,
    doctorName,
    selectedDoctor,
    saleDate,
    isReturnInvoice,
    cart,
  };

  const latestDraftRef = useRef(currentDraftSnapshot);
  useEffect(() => {
    latestDraftRef.current = currentDraftSnapshot;
  });

  const hydrateFormFromHeldBill = (targetBill) => {
    if (!targetBill) return;
    const mode = targetBill.billingMode === "B2B" ? "B2B" : "B2C";
    const resolvedB2c = mode === "B2B" ? null : targetBill.customer || null;
    const resolvedB2b = mode === "B2B" ? targetBill.customer || null : null;
    const resolvedName =
      mode === "B2B"
        ? ""
        : targetBill.customerName || targetBill.customer?.name || "";
    const resolvedPhone =
      mode === "B2B"
        ? ""
        : targetBill.customerPhone ||
          targetBill.customer?.mobile ||
          targetBill.customer?.phone ||
          "";
    const resolvedDoctorName = targetBill.doctorName || "";
    const resolvedDoctor = targetBill.doctorId
      ? {
          id: targetBill.doctorId,
          _id: targetBill.doctorId,
          name: resolvedDoctorName,
        }
      : resolvedDoctorName
      ? { name: resolvedDoctorName }
      : null;
    const resolvedSaleDate = targetBill.saleDate
      ? String(targetBill.saleDate).split("T")[0]
      : latestDraftRef.current.saleDate;
    const resolvedReturn = Boolean(targetBill.isReturnInvoice);
    const resolvedCart = Array.isArray(targetBill.cart) ? targetBill.cart : [];
    const resolvedPartyType =
      targetBill.b2bPartyType || latestDraftRef.current.b2bPartyType || "all";

    setBillingMode(mode);
    setB2bPartyType(resolvedPartyType);
    setSelectedB2bParty(resolvedB2b);
    setSelectedB2cCustomer(resolvedB2c);
    setCustomerName(resolvedName);
    setCustomerPhone(resolvedPhone);
    setDoctorName(resolvedDoctorName);
    setSelectedDoctor(resolvedDoctor);
    setSaleDate(resolvedSaleDate);
    setIsReturnInvoice(resolvedReturn);
    setCart(resolvedCart);

    // Keep ref synchronously aligned for StrictMode / immediate unmount
    latestDraftRef.current = {
      ...latestDraftRef.current,
      billingMode: mode,
      b2bPartyType: resolvedPartyType,
      selectedB2cCustomer: resolvedB2c,
      selectedB2bParty: resolvedB2b,
      customerName: resolvedName,
      customerPhone: resolvedPhone,
      doctorName: resolvedDoctorName,
      selectedDoctor: resolvedDoctor,
      saleDate: resolvedSaleDate,
      isReturnInvoice: resolvedReturn,
      cart: resolvedCart,
    };
  };

  const clearFormDraftState = () => {
    setCart([]);
    setSelectedB2cCustomer(null);
    setSelectedB2bParty(null);
    setCustomerName("");
    setCustomerPhone("");
    setDoctorName("");
    setSelectedDoctor(null);
    setShowCustomerHistory(false);
    setIsReturnInvoice(false);
    customerSearchBarRef.current?.clear?.();
    b2bCustomerSearchBarRef.current?.clear?.();

    latestDraftRef.current = {
      ...latestDraftRef.current,
      selectedB2cCustomer: null,
      selectedB2bParty: null,
      customerName: "",
      customerPhone: "",
      doctorName: "",
      selectedDoctor: null,
      isReturnInvoice: false,
      cart: [],
    };
  };

  // Auto-load priority automatic hold on return / refresh (or resolve explicit resume from Billing)
  useEffect(() => {
    if (isEditMode || !branchId || !activeShift || hasInitializedAutoHoldRef.current) {
      return;
    }
    hasInitializedAutoHoldRef.current = true;

    const pendingResume = pendingExplicitResumeRef.current;
    pendingExplicitResumeRef.current = null;
    const existingAuto = getAutoHold();

    if (pendingResume?.id) {
      window.history.replaceState({}, document.title);

      if (
        existingAuto &&
        existingAuto.id !== pendingResume.id &&
        Array.isArray(existingAuto.cart) &&
        existingAuto.cart.length > 0
      ) {
        const restoredAuto = consumeAutoHold();
        if (restoredAuto) {
          hydrateFormFromHeldBill(restoredAuto);
        }
        setPendingResumeBill(pendingResume);
        setIsResumeConflictOpen(true);
        return;
      }

      if (existingAuto && existingAuto.id === pendingResume.id) {
        consumeAutoHold();
      } else {
        resumeBill(pendingResume.id);
      }
      hydrateFormFromHeldBill(pendingResume);
      setToastMessage(`▶️ Resumed held bill ${pendingResume.holdNumber || ""}.`);
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    if (existingAuto) {
      const restoredAuto = consumeAutoHold();
      if (restoredAuto) {
        hydrateFormFromHeldBill(restoredAuto);
        setToastMessage("🔄 Auto-held bill restored.");
        setTimeout(() => setToastMessage(null), 3000);
      }
    }
  }, [branchId, activeShift, isEditMode, getAutoHold, consumeAutoHold, resumeBill]);

  // Persist current POS work as an automatic hold on route leave or browser refresh/unload
  useEffect(() => {
    const persistAutoHoldIfEligible = () => {
      const draft = latestDraftRef.current;
      if (!draft || draft.isEditMode) return;
      if (!draft.branchId || !draft.activeShift) return;
      if (!storage.get(TOKEN_KEY)) return;
      if (!hasMeaningfulSalesDraft(draft)) return;

      const draftCustomer =
        draft.billingMode === "B2C" ? draft.selectedB2cCustomer : draft.selectedB2bParty;

      saveAutoHeldBill({
        workspaceId: draft.workspaceId,
        companyId: draft.companyId,
        branchId: draft.branchId,
        billingMode: draft.billingMode,
        b2bPartyType: draft.b2bPartyType,
        customer: draftCustomer,
        customerName:
          draft.billingMode === "B2C"
            ? draftCustomer?.name || draft.customerName
            : draftCustomer?.name || "",
        customerPhone:
          draft.billingMode === "B2C"
            ? draftCustomer?.mobile || draftCustomer?.phone || draft.customerPhone
            : draftCustomer?.mobile || draftCustomer?.phone || "",
        doctorName: draft.doctorName,
        doctorId: draft.selectedDoctor?._id || draft.selectedDoctor?.id || null,
        saleDate: draft.saleDate,
        isReturnInvoice: draft.isReturnInvoice,
        cart: draft.cart,
      });
    };

    window.addEventListener("beforeunload", persistAutoHoldIfEligible);
    window.addEventListener("pagehide", persistAutoHoldIfEligible);
    return () => {
      window.removeEventListener("beforeunload", persistAutoHoldIfEligible);
      window.removeEventListener("pagehide", persistAutoHoldIfEligible);
      persistAutoHoldIfEligible();
    };
  }, []);

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

  const handleProceedToPreview = () => {
    if (cart.length === 0) {
      setToastMessage("Cart is empty. Add items to proceed.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    if (billingMode === "B2C") {
      let currentCustomer = selectedB2cCustomer;
      if (!currentCustomer || (!currentCustomer.name && !customerName)) {
        setToastMessage("Please select or enter a customer name (or choose Walk-in) before creating the bill.");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
    }
    if (billingMode === "B2B" && (!selectedB2bParty || !selectedB2bParty.name || selectedB2bParty.name.trim() === "")) {
      setToastMessage("Please select a B2B party before creating the bill.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setIsInvoicePreviewOpen(true);
  };

  const handleProceedFromPreviewToCheckout = () => {
    setIsInvoicePreviewOpen(false);
    setIsCheckoutOpen(true);
  };

  // Ctrl + Enter (or Cmd + Enter) keyboard shortcut to Proceed
  useEffect(() => {
    const handleCtrlEnter = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd && e.key === "Enter") {
        e.preventDefault();
        if (cart.length > 0) {
          handleProceedToPreview();
        }
      }
    };

    window.addEventListener("keydown", handleCtrlEnter);
    return () => window.removeEventListener("keydown", handleCtrlEnter);
  }, [cart, billingMode, selectedB2cCustomer, selectedB2bParty]);

  // F6 (Hold Bill) and F7 (Held Bills Queue) keyboard shortcuts
  useEffect(() => {
    const handleFKeys = (e) => {
      if (isBatchModalOpen || isInvoicePreviewOpen || isCheckoutOpen || isReceiptOpen || isHoldModalOpen || isResumeConflictOpen) return;
      if (e.key === "F6") {
        e.preventDefault();
        handleOpenHoldModal();
      } else if (e.key === "F7") {
        e.preventDefault();
        setIsHeldBillsModalOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleFKeys);
    return () => window.removeEventListener("keydown", handleFKeys);
  }, [cart.length, isBatchModalOpen, isInvoicePreviewOpen, isCheckoutOpen, isReceiptOpen, isHoldModalOpen, isResumeConflictOpen]);

  // ── Hold Bill Handlers ────────────────────────────
  const handleOpenHoldModal = () => {
    if (cart.length === 0) {
      setToastMessage("Cart is empty. Add items to hold a bill.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setIsHoldModalOpen(true);
  };

  const handleConfirmHoldBill = (note) => {
    const held = holdBill({
      billingMode,
      b2bPartyType,
      customer: activeCustomer,
      customerName:
        billingMode === "B2C"
          ? activeCustomer?.name || customerName
          : activeCustomer?.name || "",
      customerPhone:
        billingMode === "B2C"
          ? activeCustomer?.mobile || activeCustomer?.phone || customerPhone
          : activeCustomer?.mobile || "",
      doctorName,
      doctorId: selectedDoctor?._id || selectedDoctor?.id || null,
      saleDate,
      isReturnInvoice,
      cart,
      note,
    });

    removeAutoHold();
    clearFormDraftState();
    setIsHoldModalOpen(false);

    setToastMessage(`⏸️ Bill ${held?.holdNumber || ""} held successfully.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const executeResumeBill = (targetBill) => {
    if (!targetBill) return;

    hydrateFormFromHeldBill(targetBill);
    resumeBill(targetBill.id);

    setIsResumeConflictOpen(false);
    setIsHeldBillsModalOpen(false);
    setPendingResumeBill(null);

    setToastMessage(`▶️ Bill ${targetBill.holdNumber || ""} resumed.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRequestResumeBill = (heldBill) => {
    if (cart.length > 0) {
      setPendingResumeBill(heldBill);
      setIsResumeConflictOpen(true);
    } else {
      executeResumeBill(heldBill);
    }
  };

  const handleHoldCurrentAndResume = () => {
    if (!pendingResumeBill) return;

    holdBill({
      billingMode,
      b2bPartyType,
      customer: activeCustomer,
      customerName:
        billingMode === "B2C"
          ? activeCustomer?.name || customerName
          : activeCustomer?.name || "",
      customerPhone:
        billingMode === "B2C"
          ? activeCustomer?.mobile || activeCustomer?.phone || customerPhone
          : activeCustomer?.mobile || "",
      doctorName,
      doctorId: selectedDoctor?._id || selectedDoctor?.id || null,
      saleDate,
      isReturnInvoice,
      cart,
      note: `Swapped while resuming ${pendingResumeBill.holdNumber}`,
    });

    executeResumeBill(pendingResumeBill);
  };

  const handleDiscardCurrentAndResume = () => {
    if (!pendingResumeBill) return;
    executeResumeBill(pendingResumeBill);
  };

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

  const handleAddFromHistory = async (productId, historyItem, invoice) => {
    try {
      // 1. Normal sales mode (selling from warehouse stock):
      // Opens batch selector modal so user can pick which inventory batch to sell
      if (!isReturnInvoice || !historyItem) {
        if (!productId) return;
        const actualProdId = typeof productId === "object" ? (productId._id || productId.id) : productId;
        const res = await workspaceProductService.getWorkspaceProductById(actualProdId);
        const product = res.data?.data || res.data;
        if (product) {
          handleSelectWorkspaceProduct(product);
        }
        return;
      }

      // 2. Return Invoice mode:
      // Directly pick up item and all details present in the customer's purchase history without opening batch modal
      const actualProdId = typeof productId === "object"
        ? (productId._id || productId.id)
        : (productId || historyItem.productId);

      let productMeta = null;
      if (actualProdId) {
        try {
          const res = await workspaceProductService.getWorkspaceProductById(actualProdId);
          productMeta = res.data?.data || res.data;
        } catch {
          // Gracefully fallback to historyItem fields
        }
      }

      const soldBatch = historyItem.batch || "STANDARD";
      const soldPrice = Number(historyItem.price ?? historyItem.rate ?? 0);
      const soldMrp = Number(historyItem.mrp ?? productMeta?.mrp ?? soldPrice);
      const soldQty = Number(historyItem.qty) || 1;
      const soldDisc = Number(historyItem.disc ?? 0);
      const rawBatchId = historyItem.batchId || historyItem.batch_id || (historyItem.batch && typeof historyItem.batch === 'object' && (historyItem.batch._id || historyItem.batch.id)) || (typeof historyItem.batch === 'string' && historyItem.batch.length === 24 ? historyItem.batch : undefined);
      const branchIdForReturn = invoice?.branchId || currentBranch?._id || currentBranch?.id || undefined;

      const returnItem = {
        id: `return-${invoice?.invoiceNo || 'inv'}-${actualProdId}-${soldBatch}`,
        productId: actualProdId,
        batchId: rawBatchId,
        batchNo: soldBatch,
        branchId: branchIdForReturn,
        name: historyItem.name || historyItem.productName || productMeta?.displayName || productMeta?.name || "Product",
        brand: historyItem.brand || productMeta?.brand || productMeta?.displayManufacturer || productMeta?.manufacturer || "Pharma",
        category: historyItem.category || productMeta?.category || productMeta?.displayCategory || "Tablet",
        batch: soldBatch,
        pack: historyItem.pack || productMeta?.pack || productMeta?.packaging || productMeta?.displayDosageForm || "10S",
        rack: historyItem.rack || productMeta?.rack || productMeta?.shelfLocation || "—",
        hsn: historyItem.hsn || getHsnCode(productMeta),
        gst: historyItem.gst ?? (productMeta ? getGstRate(productMeta) : 5),
        ratePct: historyItem.ratePct || (productMeta?.rateCPercentage !== undefined && productMeta.rateCPercentage !== null ? `${productMeta.rateCPercentage}%` : "16%"),
        rateCPercentage: historyItem.rateCPercentage ?? productMeta?.rateCPercentage,
        expiry: historyItem.expiry || historyItem.expiryDate || getExpiryString(productMeta),
        stock: soldQty, // Capped at the exact quantity sold on this invoice
        maxReturnQty: soldQty,
        originalSoldQty: soldQty,
        mrp: soldMrp,
        price: soldPrice,
        rate: soldPrice,
        disc: soldDisc,
        qty: 1, // Default 1, user can increment up to soldQty
        originalInvoiceNo: invoice?.invoiceNo,
        originalInvoiceId: invoice?._id || invoice?.id,
        originalInvoiceDate: invoice?.date,
        isReturnItem: true,
        workspaceProduct: productMeta,
      };

      setCart((prev) => {
        const existingIdx = prev.findIndex((i) => i.id === returnItem.id);
        if (existingIdx >= 0) {
          const currentQty = Number(prev[existingIdx].qty) || 1;
          const maxQty = Number(returnItem.maxReturnQty || returnItem.originalSoldQty || 999);
          if (currentQty >= maxQty) {
            setToastMessage(`Cannot return more than purchased quantity (${maxQty}) from Bill #${invoice?.invoiceNo || ""}`);
            setTimeout(() => setToastMessage(null), 3000);
            return prev;
          }
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            qty: currentQty + 1,
          };
          return updated;
        }
        return [...prev, returnItem];
      });

      setToastMessage(
        `Returned item "${returnItem.name}" (Batch: ${returnItem.batch}) picked from Bill #${invoice?.invoiceNo || ""}`
      );
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Failed to pick return item from history:", err);
      setToastMessage("Failed to pick return item details");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleSwitchCustomerFromHistory = (targetMember) => {
    if (!targetMember) return;
    const mapped = {
      id: targetMember._id || targetMember.customerId || targetMember.id,
      _id: targetMember._id || targetMember.customerId || targetMember.id,
      name: targetMember.name,
      phone: targetMember.mobile || targetMember.phone || "",
      mobile: targetMember.mobile || targetMember.phone || "",
      gender: targetMember.gender || null,
      billingType: "B2C",
      ...targetMember,
    };
    setSelectedB2cCustomer(mapped);
    if (mapped.name) setCustomerName(mapped.name);
    if (mapped.phone) setCustomerPhone(mapped.phone);
    setToastMessage(`Switched billing to ${mapped.name}`);
    setTimeout(() => setToastMessage(null), 2500);
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
          isReturnItem: Boolean(isReturnInvoice || item.isReturnItem),
          branchId: item.branchId || currentBranch?._id || currentBranch?.id || undefined,
          batchNo: item.batchNo || (typeof item.batch === 'string' ? item.batch : undefined),
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
    removeAutoHold();
    clearFormDraftState();
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

    const targetInvoiceId =
      editInvoiceData?._id ||
      editInvoiceData?.id ||
      initialInvoice?.id ||
      initialInvoice?._id ||
      routeInvoiceId;

    if (isEditMode && (!targetCustomerId || targetCustomerId === "legacy" || targetCustomerId === "walkin")) {
      targetCustomerId =
        editInvoiceData?.customerId?._id ||
        editInvoiceData?.customerId?.id ||
        (typeof editInvoiceData?.customerId === "string" ? editInvoiceData.customerId : null) ||
        initialInvoice?.customerId ||
        initialInvoice?.customerObj?._id ||
        null;
    }

    // Fallback: ONLY if NOT in edit mode and no customer explicitly selected (e.g. walk-in B2C), fetch or use walk-in customer from backend
    if (!isEditMode && (!targetCustomerId || targetCustomerId === "legacy")) {
      try {
        const cRes = await customerService.getWalkInCustomer();
        const walkIn = cRes.data?.data || cRes.data;
        if (walkIn?._id || walkIn?.id) {
          targetCustomerId = walkIn._id || walkIn.id;
        } else {
          const fallbackRes = await customerService.getCustomers({ limit: 1 });
          const cList = fallbackRes.data?.data?.customers || fallbackRes.data?.customers || fallbackRes.data?.data || [];
          if (cList.length > 0) {
            targetCustomerId = cList[0]._id || cList[0].id;
          }
        }
      } catch (cErr) {
        console.warn("Could not fetch fallback walk-in customer for sale:", cErr);
      }
    }

    // Post to backend API
    let savedSaleResult = null;
    if (targetCustomerId) {
      const activeBranchId = saleData.branchId || branchId || saleData.items?.[0]?.branchId || saleData.items?.[0]?.facilityId || null;
      const targetInvoiceNo = editInvoiceData?.invoiceNo || initialInvoice?.invoiceNo || saleData.invoiceNo;
      const firstOrigItem = (saleData.items || cart || []).find((it) => it.originalInvoiceNo && !it.originalInvoiceNo.startsWith("RET-"));
      const resolvedOrigInvoiceNo = saleData.originalInvoiceNo || firstOrigItem?.originalInvoiceNo || (targetInvoiceNo?.startsWith("RET-") ? null : targetInvoiceNo);
      const resolvedOrigInvoiceId = saleData.originalInvoiceId || firstOrigItem?.originalInvoiceId || null;

      const payload = {
        customerId: targetCustomerId,
        invoiceNo: targetInvoiceNo,
        billingMode,
        branchId: activeBranchId,
        subtotal: saleData.subtotal || saleData.subTotal,
        discount: saleData.extraDiscount || saleData.discount || saleData.totalDiscount,
        tax: saleData.tax || saleData.taxAmount,
        grandTotal: saleData.grandTotal,
        roundOff: saleData.roundOff,
        paymentMethod: saleData.paymentMethod,
        payments: saleData.payments,
        creditDueDate: saleData.creditDueDate,
        creditStatus: saleData.creditStatus,
        items: saleData.items,
        doctor: doctorName || saleData.doctor || null,
        doctorId: selectedDoctor?._id || selectedDoctor?.id || saleData.doctorId || null,
        date: activeShift?.date ? new Date(activeShift.date).toISOString() : new Date().toISOString(),
        shiftId: activeShift?._id || saleData.shiftId || null,
        isReturn: Boolean(isReturnInvoice || saleData.isReturn),
        returnType: saleData.returnType || (isReturnInvoice ? (saleData.payments?.[0]?.paymentType === "Advance" ? "advance_credit" : (saleData.payments?.[0]?.paymentType === "Credit" ? "credit_note" : "cash_refund")) : undefined),
        originalInvoiceNo: resolvedOrigInvoiceNo,
        originalInvoiceId: resolvedOrigInvoiceId,
      };

      if (isEditMode && targetInvoiceId) {
        const res = await invoiceService.updateCustomerSale(targetCustomerId, targetInvoiceId, payload);
        savedSaleResult = res?.data?.data || res?.data || null;
      } else if (isReturnInvoice || saleData.isReturn) {
        const returnPayload = {
          ...payload,
          isReturn: true,
          returnType: saleData.returnType || (saleData.payments?.[0]?.paymentType === "Advance" ? "advance_credit" : (saleData.payments?.[0]?.paymentType === "Credit" ? "credit_note" : "cash_refund")),
          originalInvoiceNo: resolvedOrigInvoiceNo,
          originalInvoiceId: resolvedOrigInvoiceId,
        };
        const res = await invoiceService.recordCustomerReturn(targetCustomerId, returnPayload);
        savedSaleResult = res?.data?.data || res?.data || null;
      } else {
        const res = await invoiceService.recordCustomerSale(targetCustomerId, payload);
        savedSaleResult = res?.data?.data || res?.data || null;
      }
    }

    const actualInvoiceNo = savedSaleResult?.invoiceNo || saleData.invoiceNo;

    // Refresh cash counter balance in Redux immediately
    if (currentBranch?._id || currentBranch?.id) {
      dispatch(fetchBranchCash(currentBranch._id || currentBranch.id));
    }

    // On confirmed backend success, close checkout, set completed sale state, open receipt, and clear cart
    setIsCheckoutOpen(false);
    setCompletedSale({
      ...saleData,
      isReturn: Boolean(isReturnInvoice || saleData.isReturn),
      returnType: saleData.returnType || (saleData.payments?.[0]?.paymentType === "Advance" ? "advance_credit" : (saleData.payments?.[0]?.paymentType === "Credit" ? "credit_note" : "cash_refund")),
      customer: activeCustomer || saleData.customer,
      customerName: activeCustomer?.name || customerName || saleData.customerName,
      customerPhone: activeCustomer?.mobile || activeCustomer?.phone || customerPhone || saleData.customerPhone,
      invoiceNo: actualInvoiceNo,
      date: activeShift?.date ? new Date(activeShift.date).toISOString() : new Date().toISOString(),
      createdAt: savedSaleResult?.createdAt || new Date().toISOString(),
      updatedAt: savedSaleResult?.updatedAt || null,
      billingMode,
      partyType: billingMode === "B2B" ? selectedB2bParty?.partyType || "wholesaler" : "retail",
    });
    setIsReceiptOpen(true);
    removeAutoHold();
    clearFormDraftState();
  };

  if (isLoadingInvoice) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4 p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm font-semibold text-text">Loading invoice for editing...</p>
        <p className="text-xs text-text-muted">Fetching line items, customer, and pricing</p>
      </div>
    );
  }

  if (loadInvoiceError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4 p-8">
        <div className="w-full max-w-md p-6 bg-surface border border-error/30 rounded-2xl text-center space-y-3 shadow-lg">
          <div className="size-12 rounded-full bg-error-soft text-error flex items-center justify-center mx-auto">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-text">Cannot Edit Invoice</h2>
          <p className="text-sm text-text-muted">{loadInvoiceError}</p>
          <UIButton variant="primary" onClick={() => navigate("/billing")} className="mt-2">
            Back to Invoices Hub
          </UIButton>
        </div>
      </div>
    );
  }

  if ((shiftStatus === "loading" || getOpenBusinessDayStatus === "loading") && !activeShift) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4 p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-text-muted">Loading POS...</p>
      </div>
    );
  }

  if (!activeShift) {
    const isDayOpen = Boolean(
      openBusinessDay && String(openBusinessDay.status || "").toLowerCase() === "open"
    );

    return (
      <div className="relative min-h-[calc(100vh-80px)] w-full flex items-center justify-center p-6 bg-bg overflow-hidden font-sans">
        {/* Blurred realistic POS background mockup to mirror the exact uploaded design */}
        <div className="absolute inset-0 filter blur-[5px] opacity-35 dark:opacity-15 pointer-events-none select-none scale-102 flex flex-col bg-bg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-surface border-b border-border">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-text">POS Billing</h1>
              <p className="text-xs text-text-muted">Scan products, add to cart and create sale</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text">Recall Bill</span>
              <span className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text">Hold Bill</span>
              <span className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-contrast text-xs font-semibold">+ New Bill</span>
            </div>
          </div>
          {/* Content grid preview */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 p-4 space-y-4">
              <div className="h-10 bg-surface rounded-xl border border-border" />
              <div className="flex gap-2">
                {["All", "Prescription", "OTC", "Healthcare", "Personal Care", "Vitamins", "Devices"].map((t) => (
                  <span key={t} className="px-3 py-1 rounded-full bg-surface border border-border text-xs text-text-muted">{t}</span>
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
        <div className="absolute inset-0 bg-bg/40 backdrop-blur-[2px] pointer-events-none" />

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
    <section className="w-full h-full max-h-full bg-surface rounded-2xl border border-border shadow-2xs flex flex-col font-sans overflow-hidden">

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

      {/* ── MAIN BODY ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* ── POS BILLING PAGE HEADER (Extra Header) ───────────── */}
        <div className="shrink-0 px-4 py-2.5 border-b border-border bg-surface-alt/40 flex items-center justify-between gap-3 flex-wrap">
          {/* Left: Terminal Title & Live Register metadata */}
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs">
              <Store className="size-4.5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-text tracking-tight leading-tight">
                  {isEditMode ? "Edit Sales Invoice" : "POS Billing Terminal"}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Register
                </span>
                {isEditMode && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {editInvoiceData?.invoiceNo || initialInvoice?.invoiceNo || routeInvoiceId}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-text-muted mt-0.5 font-sans">
                <span>{currentBranch?.name || "Branch Terminal"}</span>
                <span>•</span>
                <span>Shift #{activeShift?.shiftNumber || "1"}</span>
                {activeShift?.cashierName && (
                  <>
                    <span>•</span>
                    <span>Cashier: {activeShift.cashierName}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Action Controls (Mode Switch, Hold Bill, Recall Queue, Clear Cart) */}
          <div className="flex items-center gap-2">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border shadow-2xs">
              <button
                type="button"
                onClick={() => setBillingMode("B2C")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  billingMode === "B2C"
                    ? "bg-primary text-white shadow-xs"
                    : "text-text-muted hover:text-text hover:bg-surface-hover"
                )}
              >
                <User className="size-3.5" />
                <span>B2C Retail</span>
              </button>
              <button
                type="button"
                onClick={() => setBillingMode("B2B")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  billingMode === "B2B"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-text-muted hover:text-text hover:bg-surface-hover"
                )}
              >
                <Building2 className="size-3.5" />
                <span>B2B Commercial</span>
              </button>
            </div>

            {/* Hold Bill Button (F6) */}
            <UIButton
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenHoldModal}
              disabled={cart.length === 0}
              className="gap-1.5 font-semibold text-xs text-text hover:text-primary"
              title="Hold Current Bill (F6)"
            >
              <PauseCircle className="size-3.5 text-amber-500" />
              <span>Hold Bill</span>
              <kbd className="hidden sm:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-surface-alt border border-border/80 text-text-muted">
                F6
              </kbd>
            </UIButton>

            {/* Recall / Held Bills Button (F7) */}
            <UIButton
              type="button"
              variant={heldBillsCount > 0 ? "secondary" : "outline"}
              size="sm"
              onClick={() => setIsHeldBillsModalOpen(true)}
              className={cn(
                "gap-1.5 font-semibold text-xs relative",
                heldBillsCount > 0 && "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
              )}
              title="Recall Held Bills (F7)"
            >
              <History className="size-3.5" />
              <span>Recall Bill</span>
              {heldBillsCount > 0 && (
                <span className="size-4.5 rounded-full bg-amber-500 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                  {heldBillsCount}
                </span>
              )}
              <kbd className="hidden sm:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-surface-alt border border-border/80 text-text-muted">
                F7
              </kbd>
            </UIButton>

            {/* Clear Cart Button */}
            {cart.length > 0 && (
              <UIButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearCart}
                className="text-error hover:bg-error-soft/30 gap-1 text-xs"
                title="Clear current cart"
              >
                <Trash2 className="size-3.5" />
                <span>Clear</span>
              </UIButton>
            )}

            {/* Cancel Edit Button if Edit Mode */}
            {isEditMode && (
              <UIButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate("/billing")}
                className="text-text-muted hover:text-text gap-1 text-xs"
              >
                <ArrowLeft className="size-3.5" />
                <span>Exit Edit</span>
              </UIButton>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── LEFT PANEL: Customer strip + Search + Cart ── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Customer Strip */}
          <div className="relative z-25 shrink-0 border-b border-border bg-surface">
            {billingMode === "B2C" ? (
              <div className="px-4 pt-3.5 pb-2.5">
                <SalesCustomerDoctorInfo
                  customerSearchBarRef={customerSearchBarRef}
                  selectedCustomer={selectedB2cCustomer}
                  walkInCustomer={defaultWalkInCustomer}
                  onSelectCustomer={setSelectedB2cCustomer}
                  customerName={customerName}
                  onChangeCustomerName={setCustomerName}
                  customerPhone={customerPhone}
                  onChangeCustomerPhone={setCustomerPhone}
                  selectedDoctor={selectedDoctor}
                  onSelectDoctor={setSelectedDoctor}
                  doctorName={doctorName}
                  onChangeDoctorName={setDoctorName}
                  saleDate={saleDate}
                  onChangeSaleDate={setSaleDate}
                  onAddNewCustomer={(name) => {
                    setQuickCreateCustomerName(name);
                    setQuickCreateCustomerType("other");
                    setIsQuickCreateCustomerModalOpen(true);
                  }}
                  onAddNewDoctor={(name) => {
                    setQuickCreateDoctorName(name);
                    setIsQuickCreateDoctorModalOpen(true);
                  }}
                />
              </div>
            ) : (
              /* B2B Party Strip */
              <div className="px-4 pt-3.5 pb-2.5 space-y-2">
                <div className="flex items-end gap-3 flex-wrap">
                  <div className="flex-1 min-w-[220px] space-y-0.5">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                      Party / Business Name *
                    </span>
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
                  <div className="space-y-0.5 shrink-0">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                      Party Type
                    </span>
                    <div className="flex items-center gap-1.5 h-[34px]">
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
                            "flex items-center gap-1 px-2.5 h-full rounded-lg text-[11px] font-bold transition-all cursor-pointer",
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

                  {/* Sale Date (read-only chip matching B2C) */}
                  <div className="w-[130px] shrink-0 space-y-0.5">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                      Sale Date
                    </span>
                    <div className="relative">
                      <input
                        type="date"
                        value={saleDate}
                        readOnly
                        disabled
                        className="w-full h-[34px] rounded-lg border border-border pl-7 pr-2 text-[12px] bg-surface-alt text-text-muted cursor-not-allowed outline-none"
                      />
                      <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-text-muted pointer-events-none" />
                    </div>
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
          <div className="relative z-20 shrink-0 px-4 py-2 border-b border-border bg-surface-alt/30 flex items-center justify-between gap-4">
            <div className="w-full max-w-[540px]">
              <WorkspaceProductSearchBar
                ref={searchBarRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSelectProduct={handleSelectWorkspaceProduct}
                branchId={branchId}
                placeholder="Scan barcode or search product / medicine by name, SKU, brand..."
                size="md"
                showDetailsPreview
              />
            </div>
            {/* Mode Toggle Tab: B2C Retail / B2B Commercial & Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <UITabs
                tabs={[
                  {
                    id: "B2C",
                    label: "B2C",
                    icon: <User className="size-3.5" />,
                  },
                  {
                    id: "B2B",
                    label: "B2B",
                    icon: <Building2 className="size-3.5" />,
                  },
                ]}
                activeTab={billingMode}
                onChange={(modeId) => {
                  setBillingMode(modeId);
                  if (modeId === "B2C") {
                    setSelectedB2bParty(null);
                  }
                }}
                variant="segmented"
                size="sm"
                className="border border-border/80 shadow-2xs"
              />

              {/* Return Invoice Button (created with UI primitives and semantic tokens) */}
              <UIIconButton
                icon={
                  <RotateCcw
                    className={cn(
                      "size-4 transition-transform duration-200",
                      isReturnInvoice && "-rotate-45"
                    )}
                  />
                }
                variant={isReturnInvoice ? "destructive" : "outline"}
                size="md"
                badge={isReturnInvoice ? true : undefined}
                badgeColor="error"
                aria-label="Return Invoice"
                onClick={() => {
                  setIsReturnInvoice((prev) => {
                    const next = !prev;
                    if (next && (activeCustomer || customerName)) {
                      setShowCustomerHistory(true);
                    }
                    setToastMessage(
                      next
                        ? "Return Invoice mode active — pick items from customer history"
                        : "Switched to normal sales billing mode"
                    );
                    setTimeout(() => setToastMessage(null), 3000);
                    return next;
                  });
                }}
                className={cn(
                  "transition-all cursor-pointer",
                  isReturnInvoice
                    ? "ring-2 ring-error/30 border-error/50 shadow-xs"
                    : "hover:border-border-strong hover:text-text"
                )}
              />

              {/* Hold Bill Button */}
              <UIIconButton
                icon={
                  <PauseCircle
                    className={cn(
                      "size-4 transition-colors",
                      cart.length > 0 || heldBillsCount > 0
                        ? "text-warning"
                        : "text-text-muted"
                    )}
                  />
                }
                variant={heldBillsCount > 0 ? "warning" : "outline"}
                size="md"
                badge={heldBillsCount > 0 ? heldBillsCount : undefined}
                badgeColor="warning"
                aria-label="Hold Bill"
                onClick={() => {
                  if (cart.length > 0) {
                    handleOpenHoldModal();
                  } else if (heldBillsCount > 0) {
                    setIsHeldBillsModalOpen(true);
                  } else {
                    handleOpenHoldModal();
                  }
                }}
                className="cursor-pointer"
              />
            </div>
          </div>

          {/* ── CART TABLE — only this section scrolls ── */}
          <div className="flex-1 overflow-y-auto">
            {cart.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 shadow-2xs">
                  <tr className="bg-surface-alt/95 backdrop-blur-xs border-b border-border/80 text-[10px] font-bold text-text-muted uppercase tracking-wider select-none">
                    <th className="py-2 px-2 text-center w-8">#</th>
                    <th className="py-2 px-2 min-w-[160px]">Item</th>
                    <th className="py-2 px-2 min-w-[85px] w-[95px]">Batch</th>
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
                    <th className="py-2 px-1.5 w-[70px] font-mono text-right">Rate</th>
                    {billingMode !== "B2C" && <th className="py-2 px-1.5 w-[52px] font-mono text-center">Disc%</th>}
                    <th className="py-2 px-1.5 w-[100px] font-mono text-center">Qty</th>
                    <th className="py-2 px-1.5 w-[52px] font-mono">Expiry</th>
                    <th className="py-2 px-2 min-w-[85px] w-[95px] font-mono text-right">Amount</th>
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-text block truncate text-xs sm:text-[12px] leading-tight">{item.name}</span>
                            {item.isReturnItem && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-error-soft/60 text-error border border-error/30 shrink-0">
                                <RotateCcw className="size-2.5" />
                                Return · #{item.originalInvoiceNo}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-text-muted block truncate">{item.brand} · {item.category}</span>
                        </td>

                        {/* Batch */}
                        <td className="py-1.5 px-2 min-w-[85px]">
                          <span className="font-mono text-xs sm:text-[12px] font-bold text-text tracking-wide truncate block">
                            {item.batch || "—"}
                          </span>
                          {item.isReturnItem && item.originalSoldQty && (
                            <span className="block text-[9px] text-text-muted/70 font-sans font-normal">
                              max {item.originalSoldQty}
                            </span>
                          )}
                        </td>

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
                        <td className="py-1.5 px-1.5 font-mono text-right text-xs sm:text-[12px] font-bold text-text tabular-nums">
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
                        <td className="py-1.5 px-2 font-mono text-right font-black text-primary text-[13px] sm:text-[14px] tabular-nums">
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

        {/* ── RIGHT PANEL (Fixed 285px Width, Compact & Space-Saving) ── */}
        <div className="w-[285px] shrink-0 h-full max-h-full flex flex-col border-l border-border bg-surface overflow-hidden">
          {!showCustomerHistory ? (
            /* Order Summary */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Billed To Header */}
              <div className="px-4 pt-3.5 pb-2.5 border-b border-border/70 shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Billed To</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowCustomerHistory(true)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer border bg-surface-alt hover:bg-surface-hover text-primary border-border shadow-2xs"
                      title="View Customer Purchase History"
                    >
                      <History className="size-3" />
                      <span>History</span>
                    </button>
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
                    <p className="text-[13px] font-bold font-mono text-text/90">
                      {billingMode === "B2C" ? (customerPhone || activeCustomer?.phone) : activeCustomer?.phone}
                    </p>
                  )}
                  {billingMode === "B2C" && doctorName && (
                    <p className="text-[11px] text-text-muted">{doctorName}</p>
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
                        <span className="text-text-muted truncate max-w-[145px]">
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
                  onSwitchCustomer={billingMode === 'B2C' ? handleSwitchCustomerFromHistory : undefined}
                  isReturnInvoice={isReturnInvoice}
                />
              </div>
            </div>
          )}

          {/* ── PERMANENT BOTTOM CTA: Checkout + Clear Cart ── */}
          <div className="p-3 border-t border-border/70 bg-surface shrink-0 sticky bottom-0 z-10">
            <div className="flex items-center gap-2">
              <PermissionGate
                permission="pos:create"
                fallback={
                  <UIButton variant="primary" size="lg" className="flex-1" disabled>
                    Proceed (pos:create required)
                  </UIButton>
                }
              >
                <UIButton
                  variant="primary"
                  size="lg"
                  disabled={cart.length === 0}
                  onClick={handleProceedToPreview}
                  endIcon={<Receipt className="size-4.5" />}
                  className="flex-1 h-11 text-sm font-bold"
                >
                  {cart.length === 0
                    ? "Add items to proceed"
                    : isEditMode
                    ? `Update Bill · ₹${cartGrandTotal.toLocaleString("en-IN")}`
                    : `Proceed · ₹${cartGrandTotal.toLocaleString("en-IN")}`}
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
    </div>

      {/* ── MODALS ─────────────────────────────────────── */}
      <SalesInvoicePreviewModal
        isOpen={isInvoicePreviewOpen}
        onClose={() => setIsInvoicePreviewOpen(false)}
        onProceedToCheckout={handleProceedFromPreviewToCheckout}
        cart={cart}
        customer={activeCustomer}
        customerName={customerName}
        customerPhone={customerPhone}
        doctorName={doctorName}
        saleDate={saleDate}
        billingMode={billingMode}
        branch={currentBranch}
        company={currentCompany}
        cartGrandTotal={cartGrandTotal}
        isReturnInvoice={isReturnInvoice}
      />

      <SalesCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        customer={activeCustomer}
        customerPhone={customerPhone}
        doctor={doctorName}
        doctorId={selectedDoctor?._id || selectedDoctor?.id || null}
        saleDate={saleDate}
        billingMode={billingMode}
        activeShift={activeShift}
        shiftId={activeShift?._id}
        existingInvoiceNo={editInvoiceData?.invoiceNo || initialInvoice?.invoiceNo}
        cartSummary={{ items: cart, subtotal: cartSubtotal }}
        onCompleteSale={handleCompleteSale}
        isReturnInvoice={isReturnInvoice}
      />

      <OrderInvoiceModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          if (isEditMode) {
            navigate("/billing");
          } else {
            setTimeout(() => {
              if (billingMode === "B2C") {
                customerSearchBarRef.current?.focus?.();
              } else {
                b2bCustomerSearchBarRef.current?.focus?.();
              }
            }, 100);
          }
        }}
        onNewSale={() => {
          setIsReceiptOpen(false);
          if (isEditMode) {
            navigate("/billing");
          } else {
            setTimeout(() => {
              if (billingMode === "B2C") {
                customerSearchBarRef.current?.focus?.();
              } else {
                b2bCustomerSearchBarRef.current?.focus?.();
              }
            }, 100);
          }
        }}
        saleData={completedSale}
        branch={currentBranch}
        company={currentCompany}
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

      <QuickCreateDoctorModal
        open={isQuickCreateDoctorModalOpen}
        onClose={() => setIsQuickCreateDoctorModalOpen(false)}
        defaultName={quickCreateDoctorName}
        onSuccess={(newDoc) => {
          setSelectedDoctor(newDoc);
          setDoctorName(newDoc.name);
        }}
      />

      {/* ── HOLD BILL MODALS ───────────────────────────── */}
      <HoldBillModal
        isOpen={isHoldModalOpen}
        onClose={() => setIsHoldModalOpen(false)}
        onConfirmHold={handleConfirmHoldBill}
        onOpenQueue={() => {
          setIsHoldModalOpen(false);
          setIsHeldBillsModalOpen(true);
        }}
        heldBillsCount={heldBillsCount}
        cartSummary={{
          items: cart,
          itemCount: cartItemCount,
          grandTotal: cartGrandTotal,
          customerName:
            billingMode === "B2C"
              ? activeCustomer?.name || customerName
              : activeCustomer?.name || "",
          customerPhone:
            billingMode === "B2C"
              ? activeCustomer?.mobile || activeCustomer?.phone || customerPhone
              : activeCustomer?.mobile || "",
          billingMode,
        }}
      />

      <HeldBillsModal
        isOpen={isHeldBillsModalOpen}
        onClose={() => setIsHeldBillsModalOpen(false)}
        heldBills={heldBills}
        branchName={currentBranch?.name || "Active Branch"}
        onResume={handleRequestResumeBill}
        onDiscard={discardBill}
        onClearAll={clearAllHeldBills}
      />

      <ResumeConflictDialog
        isOpen={isResumeConflictOpen}
        onClose={() => {
          setIsResumeConflictOpen(false);
          setPendingResumeBill(null);
        }}
        targetHeldBill={pendingResumeBill}
        currentCartCount={cartItemCount}
        currentCartTotal={cartGrandTotal}
        currentCustomerName={
          billingMode === "B2C"
            ? activeCustomer?.name || customerName || "Walk-in Customer"
            : activeCustomer?.name || "B2B Party"
        }
        onHoldCurrentAndResume={handleHoldCurrentAndResume}
        onDiscardCurrentAndResume={handleDiscardCurrentAndResume}
      />
    </section>
  );
};

export default SalesDesktopPage;
