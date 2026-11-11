// src/features/sales/pages/mobile/SalesMobilePage.jsx

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  User,
  CheckCircle2,
  Store,
  CalendarDays,
  Clock,
  ArrowRight,
  PauseCircle,
} from "lucide-react";
import {
  UICard,
  UIButton,
  UIBadge,
  WorkspaceProductSearchBar,
} from "@/components";
import { PermissionGate } from "@/components/common/PermissionGate";
import { cn } from "@/lib/utils";
import {
  POS_AVAILABLE_MEDICINES,
  POS_DEFAULT_CUSTOMERS,
} from "../../constants/salesData";
import { SalesCheckoutModal } from "../../components/SalesCheckoutModal";
import { OrderInvoiceModal } from "../../components/OrderInvoiceModal";
import { SalesInvoicePreviewModal } from "../../components/SalesInvoicePreviewModal";
import { SalesReceiptModal } from "../../components/SalesReceiptModal";
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
import { API_STATUS, TOKEN_KEY } from "@/constants";
import { storage } from "@/utils";
import { useSelector, useDispatch } from "react-redux";
import useBranch from "@/features/branch/hooks/useBranch";
import { useActiveShift } from "@/features/operations/shifts/hooks/useActiveShift";
import { getOpenBusinessDay } from "@/features/operations/business-days/store/businessDayThunk";
import OpenBusinessDayDialog from "@/features/operations/business-days/components/OpenBusinessDayDialog";
import { CreateShiftDialog } from "@/features/operations/shifts/components/CreateShiftDialog";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import invoiceService from "@/features/sales/services/invoiceService";
import customerService from "@/features/parties/customers/services/customerService";
import { fetchBranchCash } from "@/features/finance/treasury/cash-management/branch-cash/store/branchCashThunk";

export const SalesMobilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { invoiceId: routeInvoiceId } = useParams();
  const initialInvoice = location.state?.invoice;
  const initialResumeHeldBill = location.state?.resumeHeldBill;
  const [editInvoiceData, setEditInvoiceData] = useState(initialInvoice || null);
  const isEditMode = Boolean(routeInvoiceId || initialInvoice);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(!initialInvoice && Boolean(routeInvoiceId));

  const [activeTab, setActiveTab] = useState("catalog"); // "catalog" | "cart"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [defaultWalkInCustomer, setDefaultWalkInCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(
    initialResumeHeldBill?.customer || null
  );
  const [cart, setCart] = useState(
    Array.isArray(initialResumeHeldBill?.cart) ? initialResumeHeldBill.cart : []
  );
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

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
            phone: wCust.mobile || wCust.phone || "",
            isWalkIn: true,
          };
          setDefaultWalkInCustomer(mapped);
        }
      })
      .catch((err) => {
        console.warn("Mobile walk-in customer fetch error:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [isEditMode]);

  const { currentBranch } = useBranch();
  const branchId = currentBranch?._id || currentBranch?.id || null;
  const { activeShift, status: shiftStatus, refetch: refetchActiveShift } = useActiveShift(branchId);
  const dispatch = useDispatch();
  const { openBusinessDay, getOpenBusinessDayStatus } = useSelector((state) => state.businessDay);
  
  const [isBusinessDayModalOpen, setIsBusinessDayModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // ── Hold Bill System ──
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

  const hasInitializedAutoHoldRef = useRef(false);
  const pendingExplicitResumeRef = useRef(initialResumeHeldBill || null);

  const currentMobileDraft = {
    workspaceId: holdWorkspaceId,
    companyId: holdCompanyId,
    branchId,
    activeShift,
    isEditMode,
    billingMode: "B2C",
    selectedCustomer,
    customerName: selectedCustomer?.name || "",
    customerPhone: selectedCustomer?.phone || selectedCustomer?.mobile || "",
    cart,
  };
  const latestDraftRef = useRef(currentMobileDraft);
  useEffect(() => {
    latestDraftRef.current = currentMobileDraft;
  });

  const hydrateMobileDraft = (targetBill) => {
    if (!targetBill) return;
    const resolvedCustomer =
      targetBill.customer ||
      (targetBill.customerName
        ? {
            name: targetBill.customerName,
            phone: targetBill.customerPhone || "",
            mobile: targetBill.customerPhone || "",
          }
        : null);
    const resolvedCart = Array.isArray(targetBill.cart) ? targetBill.cart : [];

    setSelectedCustomer(resolvedCustomer);
    setCart(resolvedCart);
    latestDraftRef.current = {
      ...latestDraftRef.current,
      selectedCustomer: resolvedCustomer,
      customerName: resolvedCustomer?.name || "",
      customerPhone: resolvedCustomer?.phone || resolvedCustomer?.mobile || "",
      cart: resolvedCart,
    };
  };

  const clearMobileDraftState = () => {
    setCart([]);
    setSelectedCustomer(null);
    latestDraftRef.current = {
      ...latestDraftRef.current,
      selectedCustomer: null,
      customerName: "",
      customerPhone: "",
      cart: [],
    };
  };

  const activeShiftId = activeShift?._id || activeShift?.id || null;

  useEffect(() => {
    if (isEditMode || !branchId || !activeShiftId || hasInitializedAutoHoldRef.current) {
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
          hydrateMobileDraft(restoredAuto);
        }
        setPendingResumeBill(pendingResume);
        setIsResumeConflictOpen(true);
      } else {
        if (existingAuto && existingAuto.id === pendingResume.id) {
          consumeAutoHold();
        } else {
          resumeBill(pendingResume.id);
        }
        hydrateMobileDraft(pendingResume);
        setToastMessage(`▶️ Resumed held bill ${pendingResume.holdNumber || ""}.`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } else if (existingAuto) {
      const restoredAuto = consumeAutoHold();
      if (restoredAuto) {
        hydrateMobileDraft(restoredAuto);
        setToastMessage("🔄 Auto-held bill restored.");
        setTimeout(() => setToastMessage(null), 3000);
      }
    }

    return () => {
      hasInitializedAutoHoldRef.current = false;
    };
  }, [branchId, activeShiftId, isEditMode, getAutoHold, consumeAutoHold, resumeBill]);

  useEffect(() => {
    const persistAutoHoldIfEligible = () => {
      const draft = latestDraftRef.current;
      if (!draft || draft.isEditMode) return;
      if (!draft.branchId || !draft.activeShift) return;
      if (!storage.get(TOKEN_KEY)) return;
      if (!hasMeaningfulSalesDraft(draft)) return;

      saveAutoHeldBill({
        workspaceId: draft.workspaceId,
        companyId: draft.companyId,
        branchId: draft.branchId,
        billingMode: "B2C",
        customer: draft.selectedCustomer,
        customerName: draft.selectedCustomer?.name || draft.customerName || "",
        customerPhone:
          draft.selectedCustomer?.phone ||
          draft.selectedCustomer?.mobile ||
          draft.customerPhone ||
          "",
        saleDate: new Date().toISOString(),
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

  useEffect(() => {
    if (shiftStatus !== "loading") {
      setInitialCheckDone(true);
    }
  }, [shiftStatus]);

  useEffect(() => {
    if (!activeShift && branchId && getOpenBusinessDayStatus === API_STATUS.IDLE) {
      dispatch(getOpenBusinessDay(branchId));
    }
  }, [activeShift, branchId, dispatch, getOpenBusinessDayStatus]);

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
  };

  const categories = ["all", "Tablet", "Capsule", "Syrup", "Injection"];

  const filteredMedicines = POS_AVAILABLE_MEDICINES.filter((item) => {
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  const handleAddToCart = (med) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === med.id);
      if (existing) {
        return prev.map((item) =>
          item.id === med.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...med, qty: 1 }];
    });
  };

  const handleUpdateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const estTax = cartSubtotal * 0.12;
  const cartGrandTotal = Math.round(cartSubtotal + estTax);

  // ── Hold & Resume Handlers ──
  const handleOpenHoldModal = () => {
    if (cart.length === 0) return;
    setIsHoldModalOpen(true);
  };

  const handleConfirmHoldBill = (note) => {
    const held = holdBill({
      billingMode: "B2C",
      customer: selectedCustomer,
      customerName: selectedCustomer?.name || "",
      customerPhone: selectedCustomer?.phone || selectedCustomer?.mobile || "",
      doctorName: "",
      saleDate: new Date().toISOString(),
      cart,
      note,
    });

    removeAutoHold();
    clearMobileDraftState();
    setIsHoldModalOpen(false);
    setToastMessage(`⏸️ Bill ${held?.holdNumber || ""} held successfully.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const executeResumeBill = (targetBill) => {
    if (!targetBill) return;
    hydrateMobileDraft(targetBill);
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
      billingMode: "B2C",
      customer: selectedCustomer,
      customerName: selectedCustomer?.name || "",
      customerPhone: selectedCustomer?.phone || "",
      doctorName: "",
      saleDate: new Date().toISOString(),
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
    if (!routeInvoiceId) return;
    let isMounted = true;
    const fetchInvoice = async () => {
      if (!initialInvoice) setIsLoadingInvoice(true);
      try {
        const res = await invoiceService.getInvoiceById(routeInvoiceId);
        const inv = res?.data?.data || res?.data || null;
        if (!inv || !isMounted) return;
        setEditInvoiceData(inv);
        if (inv.customerId) {
          const cust = typeof inv.customerId === "object" ? inv.customerId : { _id: inv.customerId, name: inv.customerName || inv.customer };
          setSelectedCustomer({
            ...cust,
            id: cust._id || cust.id,
            name: cust.name || inv.customerName || inv.customer,
            phone: cust.mobile || cust.phone || inv.customerPhone || inv.phone || "",
          });
        }
        if (Array.isArray(inv.items)) {
          setCart(inv.items.map((i) => ({
            ...i,
            id: i.productId || i._id || i.id,
            qty: i.qty || 1,
            price: i.price || 0,
          })));
        }
      } catch (err) {
        console.warn("Mobile invoice fetch error:", err);
      } finally {
        if (isMounted) setIsLoadingInvoice(false);
      }
    };
    fetchInvoice();
    return () => { isMounted = false; };
  }, [routeInvoiceId]);

  const handleCompleteSale = async (saleData) => {
    setIsCheckoutOpen(false);
    let savedSale = null;
    try {
      const targetCustomerId =
        saleData.customer?._id ||
        saleData.customer?.id ||
        selectedCustomer?._id ||
        selectedCustomer?.id ||
        editInvoiceData?.customerId?._id ||
        editInvoiceData?.customerId;

      const targetInvoiceId =
        editInvoiceData?._id ||
        editInvoiceData?.id ||
        initialInvoice?.id ||
        initialInvoice?._id ||
        routeInvoiceId;

      if (targetCustomerId) {
        if (isEditMode && targetInvoiceId) {
          const res = await invoiceService.updateCustomerSale(targetCustomerId, targetInvoiceId, saleData);
          savedSale = res?.data?.data || res?.data || null;
        } else if (saleData.isReturn) {
          const res = await invoiceService.recordCustomerReturn(targetCustomerId, {
            ...saleData,
            isReturn: true,
            returnType: saleData.returnType,
            originalInvoiceNo: saleData.originalInvoiceNo || saleData.invoiceNo,
          });
          savedSale = res?.data?.data || res?.data || null;
        } else {
          const res = await invoiceService.recordCustomerSale(targetCustomerId, saleData);
          savedSale = res?.data?.data || res?.data || null;
        }
      }
    } catch (err) {
      console.warn("Mobile sale record/update error:", err);
      throw err;
    }

    if (branchId) {
      dispatch(fetchBranchCash(branchId));
    }

    const finalData = savedSale ? { ...saleData, ...savedSale } : saleData;
    setCompletedSale(finalData);
    setIsReceiptOpen(true);
    removeAutoHold();
    clearMobileDraftState();
  };

  const handleSelectWorkspaceProduct = (prod, details) => {
    const p = details || prod;
    const hsnCode =
      p.globalProduct?.hsn ||
      p.globalProduct?.hsnCode ||
      p.globalProduct?.hsnMaster?.code ||
      p.globalProduct?.HsnMaster?.code ||
      p.hsnCode ||
      p.hsn ||
      p.HsnMaster?.code ||
      "30049099";

    const gstRate =
      p.globalProduct?.gstRate ??
      p.globalProduct?.hsnMaster?.gstRate ??
      p.globalProduct?.hsnMaster?.gst ??
      p.globalProduct?.hsnTaxpercent ??
      p.globalProduct?.HsnMaster?.gstRate ??
      p.hsnTaxpercent ??
      p.gstRate ??
      p.taxRate ??
      p.gst ??
      p.HsnMaster?.gstRate ??
      5;

    const formattedItem = {
      id: p._id || p.id || `ws-${Date.now()}`,
      name: p.displayName || p.name || "Workspace Product",
      brand: p.displayManufacturer || p.manufacturer || p.brand || "Workspace",
      category: p.displayCategory || p.category || "General",
      batch: p.batch || p.displaySku || p.sku || "BATCH-2026",
      expDate: p.expDate || "12/28",
      hsn: hsnCode,
      gst: gstRate,
      stock: p.stock ?? 100,
      mrp: Number(p.mrp ?? p.price ?? 100),
      price: Number(p.price ?? p.mrp ?? 90),
    };
    handleAddToCart(formattedItem);
    setToastMessage(`Added "${formattedItem.name}" to cart.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!initialCheckDone && shiftStatus === "loading" && !activeShift && !isShiftModalOpen && !isBusinessDayModalOpen) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] space-y-4 p-8 bg-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-text-muted">Loading POS...</p>
      </div>
    );
  }

  if (!activeShift) {
    const isDayOpen = Boolean(openBusinessDay && String(openBusinessDay.status || "").toLowerCase() === "open");

    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 bg-bg font-sans relative">
        <POSSessionGatekeeperCard
          isDayOpen={isDayOpen}
          openBusinessDay={openBusinessDay}
          currentBranch={currentBranch}
          onOpenBusinessDay={() => setIsBusinessDayModalOpen(true)}
          onStartShift={() => setIsShiftModalOpen(true)}
        />

        <OpenBusinessDayDialog isOpen={isBusinessDayModalOpen} onClose={handleCloseBusinessDayModal} />
        <CreateShiftDialog isOpen={isShiftModalOpen} onClose={handleCloseShiftModal} />
      </div>
    );
  }

  return (
    <section className="min-h-[100dvh] w-full bg-bg px-3.5 pt-3 pb-24 font-sans space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-[9999] flex items-center gap-2 rounded-xl border border-primary/30 bg-surface/95 p-3 text-xs font-semibold text-text shadow-xl backdrop-blur-md">
          <CheckCircle2 className="size-4 text-primary shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Mode Switcher */}
      <div className="space-y-2">
        {isEditMode && (
          <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider">
                Editing
              </span>
              <span className="text-xs font-bold text-text font-mono">
                {editInvoiceData?.invoiceNo || initialInvoice?.invoiceNo || routeInvoiceId}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/billing")}
              className="text-xs font-semibold text-text-muted hover:text-text"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-text tracking-tight">
            {isEditMode ? "Edit Invoice" : "POS Terminal"}
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsHeldBillsModalOpen(true)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer",
                heldBillsCount > 0
                  ? "bg-amber-500/15 border-amber-500/35 text-amber-700 dark:text-amber-300"
                  : "bg-surface-alt border-border text-text-muted"
              )}
            >
              <PauseCircle className="size-3 text-amber-500 shrink-0" />
              <span>Held ({heldBillsCount})</span>
            </button>
            <span className="text-xs font-mono font-bold text-primary bg-primary-soft px-2.5 py-1 rounded-full">
              {cartItemCount} in Cart
            </span>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="grid grid-cols-2 gap-1 bg-surface-alt p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={cn(
              "py-2 rounded-lg text-xs font-bold transition-all text-center",
              activeTab === "catalog"
                ? "bg-surface text-primary shadow-xs"
                : "text-text-muted hover:text-text"
            )}
          >
            Catalog ({filteredMedicines.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cart")}
            className={cn(
              "py-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5",
              activeTab === "cart"
                ? "bg-surface text-primary shadow-xs"
                : "text-text-muted hover:text-text"
            )}
          >
            <ShoppingCart className="size-3.5" />
            <span>Cart (₹{cartGrandTotal})</span>
          </button>
        </div>
      </div>

      {activeTab === "catalog" ? (
        <div className="space-y-3">
          {/* Workspace Product Search Bar */}
          <div>
            <WorkspaceProductSearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSelectProduct={handleSelectWorkspaceProduct}
              branchId={currentBranch?._id || currentBranch?.id || null}
              placeholder="Search workspace product..."
              size="sm"
              showDetailsPreview
            />
          </div>

          {/* Medicines List */}
          <div className="space-y-2">
            {filteredMedicines.map((med) => {
              const inCart = cart.find((c) => c.id === med.id);

              return (
                <div
                  key={med.id}
                  className="p-3 rounded-xl border border-border bg-surface shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-text truncate">{med.name}</p>
                    <p className="text-[11px] text-text-muted">
                      {med.category} • Batch {med.batch}
                    </p>
                    <p className="text-xs font-mono font-bold text-primary mt-0.5">
                      ₹{med.price.toFixed(2)}
                    </p>
                  </div>

                  <PermissionGate permission="pos:create">
                    <UIButton
                      variant={inCart ? "secondary" : "primary"}
                      size="xs"
                      onClick={() => handleAddToCart(med)}
                    >
                      {inCart ? `+1 (${inCart.qty})` : "Add"}
                    </UIButton>
                  </PermissionGate>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Cart View */
        <div className="space-y-4">
          <div className="divide-y divide-border/60 rounded-xl border border-border bg-surface p-3">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-text truncate">{item.name}</p>
                    <p className="font-mono text-primary font-bold">
                      ₹{item.price.toFixed(2)} × {item.qty} = ₹{(item.price * item.qty).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.id, -1)}
                      className="size-6 flex items-center justify-center text-text-muted"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="font-mono font-bold w-4 text-center">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQty(item.id, 1)}
                      className="size-6 flex items-center justify-center text-text-muted"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-text-muted">Cart is empty.</p>
            )}
          </div>

          {/* Sticky Mobile Pay Bar */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <div className="flex justify-between text-xs font-mono text-text-muted">
              <span>Subtotal:</span>
              <span>₹{cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-text pt-2 border-t border-border">
              <span>Payable Total:</span>
              <span className="text-primary font-mono">₹{cartGrandTotal.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <PermissionGate permission="pos:create">
                <UIButton
                  variant="primary"
                  size="md"
                  className="flex-1 justify-center text-xs font-bold"
                  disabled={cart.length === 0}
                  onClick={() => setIsInvoicePreviewOpen(true)}
                >
                  Proceed (₹{cartGrandTotal})
                </UIButton>
              </PermissionGate>

              <UIButton
                type="button"
                variant="outline"
                size="md"
                disabled={cart.length === 0}
                onClick={handleOpenHoldModal}
                className="px-3 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 font-bold text-xs shrink-0 cursor-pointer"
                title="Hold Bill"
              >
                <PauseCircle className="size-4" />
              </UIButton>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SalesInvoicePreviewModal
        isOpen={isInvoicePreviewOpen}
        onClose={() => setIsInvoicePreviewOpen(false)}
        onProceedToCheckout={() => {
          setIsInvoicePreviewOpen(false);
          setIsCheckoutOpen(true);
        }}
        cart={cart}
        customer={selectedCustomer}
        customerName={selectedCustomer?.name}
        customerPhone={selectedCustomer?.phone}
        billingMode="B2C"
        cartGrandTotal={cartGrandTotal}
      />

      <SalesCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        customer={selectedCustomer}
        cartSummary={{ items: cart, subtotal: cartSubtotal }}
        existingInvoiceNo={editInvoiceData?.invoiceNo || initialInvoice?.invoiceNo}
        onCompleteSale={handleCompleteSale}
      />

      <OrderInvoiceModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          if (isEditMode) navigate("/billing");
        }}
        onNewSale={() => {
          setIsReceiptOpen(false);
          if (isEditMode) navigate("/billing");
        }}
        saleData={completedSale}
      />

      {/* ── HOLD BILL MODALS ── */}
      <HoldBillModal
        isOpen={isHoldModalOpen}
        onClose={() => setIsHoldModalOpen(false)}
        onConfirmHold={handleConfirmHoldBill}
        cartSummary={{
          items: cart,
          itemCount: cartItemCount,
          grandTotal: cartGrandTotal,
          customerName: selectedCustomer?.name || "",
          customerPhone: selectedCustomer?.phone || "",
          billingMode: "B2C",
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
        currentCustomerName={selectedCustomer?.name || "Walk-in Customer"}
        onHoldCurrentAndResume={handleHoldCurrentAndResume}
        onDiscardCurrentAndResume={handleDiscardCurrentAndResume}
      />
    </section>
  );
};

export default SalesMobilePage;
