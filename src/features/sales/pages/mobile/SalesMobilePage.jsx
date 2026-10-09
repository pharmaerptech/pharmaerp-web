// src/features/sales/pages/mobile/SalesMobilePage.jsx

import React, { useState, useEffect } from "react";
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
import { SalesReceiptModal } from "../../components/SalesReceiptModal";
import { POSSessionGatekeeperCard } from "../../components/POSSessionGatekeeperCard";
import { useSelector, useDispatch } from "react-redux";
import useBranch from "@/features/branch/hooks/useBranch";
import { useActiveShift } from "@/features/operations/shifts/hooks/useActiveShift";
import { getOpenBusinessDay } from "@/features/operations/business-days/store/businessDayThunk";
import OpenBusinessDayDialog from "@/features/operations/business-days/components/OpenBusinessDayDialog";
import { CreateShiftDialog } from "@/features/operations/shifts/components/CreateShiftDialog";
import { API_STATUS } from "@/constants";

export const SalesMobilePage = () => {
  const [activeTab, setActiveTab] = useState("catalog"); // "catalog" | "cart"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(POS_DEFAULT_CUSTOMERS[0]);
  const [cart, setCart] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const { currentBranch } = useBranch();
  const { activeShift, status: shiftStatus, refetch: refetchActiveShift } = useActiveShift(currentBranch?._id);
  const dispatch = useDispatch();
  const { openBusinessDay, getOpenBusinessDayStatus } = useSelector((state) => state.businessDay);
  
  const [isBusinessDayModalOpen, setIsBusinessDayModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    if (shiftStatus !== "loading") {
      setInitialCheckDone(true);
    }
  }, [shiftStatus]);

  useEffect(() => {
    if (!activeShift && currentBranch?._id && getOpenBusinessDayStatus === API_STATUS.IDLE) {
      dispatch(getOpenBusinessDay(currentBranch._id));
    }
  }, [activeShift, currentBranch?._id, dispatch, getOpenBusinessDayStatus]);

  const handleCloseBusinessDayModal = () => {
    setIsBusinessDayModalOpen(false);
    if (currentBranch?._id) {
      dispatch(getOpenBusinessDay(currentBranch._id));
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

  const handleCompleteSale = (saleData) => {
    setIsCheckoutOpen(false);
    setCompletedSale(saleData);
    setIsReceiptOpen(true);
    setCart([]);
    setToastMessage(`✅ Sale completed (${saleData.invoiceNo})`);
    setTimeout(() => setToastMessage(null), 3500);
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
    const isDayOpen = Boolean(openBusinessDay);

    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 bg-slate-50/80 dark:bg-neutral-950 font-sans relative">
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
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-text tracking-tight">POS Terminal</h1>
          <span className="text-xs font-mono font-bold text-primary bg-primary-soft px-2.5 py-1 rounded-full">
            {cartItemCount} in Cart
          </span>
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

            <PermissionGate permission="pos:create">
              <UIButton
                variant="primary"
                size="md"
                className="w-full justify-center text-xs font-bold mt-2"
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutOpen(true)}
              >
                Proceed to Checkout (₹{cartGrandTotal})
              </UIButton>
            </PermissionGate>
          </div>
        </div>
      )}

      {/* Modals */}
      <SalesCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        customer={selectedCustomer}
        cartSummary={{ items: cart, subtotal: cartSubtotal }}
        onCompleteSale={handleCompleteSale}
      />

      <SalesReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        saleData={completedSale}
      />
    </section>
  );
};

export default SalesMobilePage;
