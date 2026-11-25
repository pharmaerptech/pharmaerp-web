// src/features/purchases/pages/mobile/CreatePurchaseBillMobilePage.jsx

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  CheckCircle2,
  FileSpreadsheet,
  ArrowLeft,
  Loader2,
  Sparkles,
  X
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  UICard,
  UIButton,
  WorkspaceProductSearchBar,
  WorkspaceProductBatchSelectorModal
} from "@/components";
import { cn } from "@/lib/utils";
import { SupplierSearchBar } from "@/components";
import purchaseBillService from "@/features/purchases/services/purchaseBillService";
import { ImportPurchaseBillModal } from "@/features/purchases/components/ImportPurchaseBillModal";

export const CreatePurchaseBillMobilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("details"); // "details" | "catalog" | "cart"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [cart, setCart] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [purchaseBillNo, setPurchaseBillNo] = useState("");
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [rateBasis, setRateBasis] = useState("PTS");

  // Inter-Company Sale Bill Auto-fill
  const [matchingSaleBills, setMatchingSaleBills] = useState([]);
  const [isSearchingSaleBills, setIsSearchingSaleBills] = useState(false);
  const [showSaleBillDropdown, setShowSaleBillDropdown] = useState(false);
  const [originSaleInvoiceId, setOriginSaleInvoiceId] = useState(null);
  const [originCompanyId, setOriginCompanyId] = useState(null);
  const [originCompanyName, setOriginCompanyName] = useState("");

  useEffect(() => {
    const trimmed = (supplierInvoiceNo || "").trim();
    if (!trimmed || trimmed.length < 1) {
      setMatchingSaleBills([]);
      setShowSaleBillDropdown(false);
      return;
    }

    if (originSaleInvoiceId) return;

    const timer = setTimeout(async () => {
      setIsSearchingSaleBills(true);
      try {
        const res = await purchaseBillService.getIncomingConsignments({
          search: trimmed,
          status: "PENDING",
          limit: 5,
        });
        const raw = res.data?.data;
        const bills = Array.isArray(raw) ? raw : (raw?.data || []);
        setMatchingSaleBills(bills);
        setShowSaleBillDropdown(bills.length > 0);
      } catch (err) {
        console.error("Failed to search matching sale bills on mobile:", err);
      } finally {
        setIsSearchingSaleBills(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [supplierInvoiceNo, originSaleInvoiceId]);

  const handleSelectMatchingSaleBill = (bill) => {
    if (!bill) return;

    setSupplierInvoiceNo(bill.invoiceNo);

    if (bill.supplier) {
      setSelectedSupplier({
        ...bill.supplier,
        id: bill.supplier._id || bill.supplier.id,
        name: bill.supplier.businessName || bill.supplier.name,
      });
    }

    if (bill.date) {
      const d = new Date(bill.date);
      if (!isNaN(d.getTime())) {
        setInvoiceDate(d.toISOString().split("T")[0]);
      }
    }

    const rawItems = (bill.cartItems && bill.cartItems.length > 0)
      ? bill.cartItems
      : (bill.items || []);

    const itemsToLoad = rawItems.map((it) => {
      const qty = Number(it.qty || it.quantity || 0);
      const freeQty = Number(it.freeQty || 0);
      const rate = Number(it.rate || it.unitPrice || it.price || 0);
      const mrp = Number(it.mrp || rate);
      const gst = Number(it.gst !== undefined && it.gst !== null ? it.gst : (it.gstRate || it.hsnTaxpercent || 0));
      const disc = Number(it.disc || it.discount || it.itemDiscount || 0);
      const calculatedSch = (qty > 0 && freeQty > 0)
        ? Number(((freeQty / (qty + freeQty)) * 100).toFixed(2))
        : 0;
      const resolvedScheme = Number(
        it.schPct !== undefined && it.schPct !== null && it.schPct !== "" && Number(it.schPct) > 0
          ? it.schPct
          : (it.saleScheme || it.schemeDiscountPercent || it.schemePercent || it.schemeDisc || it.scheme || calculatedSch || 0)
      );

      return {
        id: it.id || `${it.productId || it._id || Date.now()}-${Math.random()}`,
        productId: it.productId || it.product_id || it.workspaceProductId || null,
        name: it.name || it.productName || it.displayName || "Medicine",
        pack: it.pack || it.packSize || "",
        batch: it.batch || it.batchNo || "",
        expiry: it.expiry || it.expDate || it.expiryDate || "",
        qty,
        freeQty,
        schPct: resolvedScheme,
        saleScheme: resolvedScheme,
        schemeDiscountPercent: resolvedScheme,
        disc,
        mrp,
        hsn: it.hsn ? String(it.hsn).trim() : (it.hsnCode ? String(it.hsnCode).trim() : "3004"),
        gst,
        rate,
      };
    });

    setCart(itemsToLoad);
    setOriginSaleInvoiceId(bill._id);
    setOriginCompanyId(bill.originCompany?._id || bill.originCompany?.id);
    setOriginCompanyName(bill.originCompany?.name || "Sister Company");

    setShowSaleBillDropdown(false);
    setToastMessage(`⚡ Auto-filled ${itemsToLoad.length} items from ${bill.originCompany?.name || "Sale Bill"}`);
    setActiveTab("cart");
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getGstRate = (p) => {
    if (!p) return 0;
    const val = p.globalProduct?.gstRate ?? p.hsnTaxpercent ?? p.gstRate ?? p.gst ?? p.taxRate;
    return val !== undefined && val !== null && val !== "" ? Number(val) : 0;
  };

  const getHsnCode = (p) => {
    if (!p) return "3004";
    const val = p.globalProduct?.hsn || p.hsn || p.hsnCode;
    return val ? String(val) : "3004";
  };

  const formatExpiryInput = (val, prevVal = "") => {
    if (!val) return "";

    // Handle single-character backspace from end
    if (prevVal && prevVal.startsWith(val) && val.length === prevVal.length - 1) {
      if (prevVal.endsWith("/")) {
        const prefix = val.slice(0, -1);
        return prefix === "0" ? "" : prefix;
      }
      return val;
    }

    // If user typed slash or has slash
    if (val.includes("/")) {
      const parts = val.split("/");
      const rawMonth = parts[0].replace(/\D/g, "");
      const rawYear = parts.slice(1).join("").replace(/\D/g, "").slice(0, 2);

      if (rawMonth.length === 0) return "";
      if (rawMonth.length === 1) {
        if (rawMonth === "0") return "0";
        const m = `0${rawMonth}`;
        return rawYear ? `${m}/${rawYear}` : `${m}/`;
      }
      const monthNum = parseInt(rawMonth.slice(0, 2), 10);
      if (monthNum >= 1 && monthNum <= 12) {
        const m = String(monthNum).padStart(2, "0");
        return rawYear ? `${m}/${rawYear}` : `${m}/`;
      }
      return `12/${rawYear}`;
    }

    // Only digits entered without slash
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length === 0) return "";

    if (digits.length === 1) {
      if (digits >= "2") {
        return `0${digits}/`;
      }
      return digits;
    }

    if (digits.length === 2) {
      if (digits[0] === "0") {
        if (digits[1] >= "1") return `${digits}/`;
        return "0";
      }
      if (digits[0] === "1") {
        if (digits[1] <= "2") return `${digits}/`;
        return `01/${digits[1]}`;
      }
      return `0${digits[0]}/${digits[1]}`;
    }

    if (digits.length === 3) {
      if (digits[0] === "0") {
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
      }
      if (digits[0] === "1") {
        if (Number(digits.slice(0, 2)) <= 12) {
          return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        }
        return `01/${digits.slice(1, 3)}`;
      }
      return `0${digits[0]}/${digits.slice(1, 3)}`;
    }

    // 4 digits
    if (digits[0] === "0") {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    if (digits[0] === "1") {
      if (Number(digits.slice(0, 2)) <= 12) {
        return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
      }
      return `01/${digits.slice(1, 3)}`;
    }
    return `0${digits[0]}/${digits.slice(1, 3)}`;
  };

  const applyImportedPrefillData = (data) => {
    if (!data) return;

    // 1. Supplier
    if (data.matchedSupplier) {
      setSelectedSupplier({
        ...data.matchedSupplier,
        id: data.matchedSupplier._id || data.matchedSupplier.id,
        name: data.matchedSupplier.businessName || data.matchedSupplier.name,
      });
    } else if (data.suggestedSupplier) {
      setSelectedSupplier({
        _id: null,
        id: null,
        businessName: data.suggestedSupplier.businessName,
        name: data.suggestedSupplier.businessName,
        gstNumber: data.suggestedSupplier.gstNumber,
        mobile: data.suggestedSupplier.mobile,
      });
    }

    // 2. Invoice Details
    if (data.invoice?.invoiceNo) {
      setSupplierInvoiceNo(data.invoice.invoiceNo);
    }
    if (data.invoice?.date) {
      setInvoiceDate(data.invoice.date);
    }

    // 3. Cart Items
    if (data.items && Array.isArray(data.items)) {
      const itemsToLoad = data.items.map((it, idx) => {
        const qty = Number(it.qty || 1);
        const freeQty = Number(it.freeQty || 0);
        const rate = Number(it.rate || it.pts || 0);
        const mrp = Number(it.mrp || rate);
        const gst = Number(it.gst !== undefined ? it.gst : 5);
        const disc = Number(it.disc || 0);
        const schPct = Number(it.schPct || 0);

        return {
          id: it.id || `${it.productId || idx}-${Date.now()}-${Math.random()}`,
          productId: it.productId || null,
          name: it.name || it.rawName || "Medicine",
          pack: it.pack || "10's",
          hsn: it.hsn ? String(it.hsn) : "3004",
          batch: it.batch || "",
          expiry: it.expiry ? formatExpiryInput(it.expiry) : "",
          qty,
          freeQty,
          schPct,
          disc,
          mrp,
          gst,
          rate,
        };
      });

      setCart(itemsToLoad);
      setActiveTab("cart");
      setToastMessage(
        `⚡ Loaded ${itemsToLoad.length} items from imported bill (${data.invoice?.invoiceNo || "Invoice"})`
      );
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  useEffect(() => {
    if (location.state?.prefillData) {
      applyImportedPrefillData(location.state.prefillData);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSelectWorkspaceProduct = (prod, details) => {
    const p = details || prod;
    if (!p) return;

    const baseRate = Number(p.ptr || p.price || p.purchaseRate || p.rate || 0);
    const baseMrp = Number(p.mrp || p.MRP || 0);

    const newItem = {
      id: `${p._id || p.id || Date.now()}-${Date.now()}`,
      productId: p._id || p.id,
      name: p.name || p.productName || "Product",
      pack: p.pack || p.packaging || "Pack",
      batch: p.batchNo || p.batch || "",
      expiry: p.expiryDate || p.expiry || "",
      qty: 1,
      freeQty: 0,
      schPct: 0,
      disc: 0,
      cRatePct: 0,
      mrp: baseMrp,
      hsn: getHsnCode(p),
      gst: getGstRate(p),
      rate: baseRate,
      retailerMarginPercent: Number(p.retailerMarginPercent || 20),
      stockistMarginPercent: Number(p.stockistMarginPercent || 10),
    };

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) => (i.productId === newItem.productId || i.id === newItem.id) && (!i.batch || i.batch === newItem.batch)
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          qty: updated[existingIdx].qty + 1,
        };
        return updated;
      }
      return [...prev, newItem];
    });

    setSearchQuery("");
    setToastMessage(`Added ${newItem.name} to cart.`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const updateItemField = (id, field, value) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleFreeBlurOrTab = (item) => {
    const qty = Number(item.qty) || 0;
    const freeQty = Number(item.freeQty) || 0;
    if (qty > 0 && freeQty > 0) {
      const calculatedSch = Number(((freeQty / (qty + freeQty)) * 100).toFixed(2));
      updateItemField(item.id, "schPct", calculatedSch);
    }
  };

  const handleSchBlurOrTab = (item) => {
    const schPct = Number(item.schPct) || 0;
    const freeQty = Number(item.freeQty) || 0;
    const currentQty = Number(item.qty) || 0;

    if (schPct > 0 && freeQty > 0) {
      setCart((prev) =>
        prev.map((i) => {
          if (i.id === item.id) {
            return {
              ...i,
              qty: currentQty + freeQty,
              freeQty: 0,
            };
          }
          return i;
        })
      );
    }
  };

  const handleUpdateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const handleRemoveItem = (id) => setCart((prev) => prev.filter((item) => item.id !== id));

  const getItemBaseAmount = (item) => {
    const rate = Number(item.rate) || 0;
    const qty = Number(item.qty) || 0;
    return rate * qty;
  };

  const getItemSchemeDiscount = (item) => {
    const base = getItemBaseAmount(item);
    const schPct = Number(item.schPct) || 0;
    return (base * schPct) / 100;
  };

  const getItemTradeDiscount = (item) => {
    const base = getItemBaseAmount(item);
    const schAmt = getItemSchemeDiscount(item);
    const afterScheme = base - schAmt;
    const discPct = Number(item.disc) || 0;
    return (afterScheme * discPct) / 100;
  };

  const getItemTaxableAmount = (item) => {
    const base = getItemBaseAmount(item);
    const schAmt = getItemSchemeDiscount(item);
    const discAmt = getItemTradeDiscount(item);
    return Math.max(0, base - schAmt - discAmt);
  };

  // Line amount for table line display: Gross Amount (Rate * Qty), discounts applied in summary
  const getItemAmount = (item) => getItemBaseAmount(item);

  const cartGrossTotal = cart.reduce((acc, item) => acc + getItemBaseAmount(item), 0);
  const cartSchemeDiscount = cart.reduce((acc, item) => acc + getItemSchemeDiscount(item), 0);
  const cartTradeDiscount = cart.reduce((acc, item) => acc + getItemTradeDiscount(item), 0);
  const cartTaxableSubtotal = cart.reduce((acc, item) => acc + getItemTaxableAmount(item), 0);
  const cartSubtotal = cartTaxableSubtotal;
  const estTax = cart.reduce((acc, item) => acc + (getItemTaxableAmount(item) * (item.gst !== undefined && item.gst !== null && item.gst !== "" ? Number(item.gst) : 0)) / 100, 0);
  const cartGrandTotal = Math.round(cartTaxableSubtotal + estTax);
  const cartItemCount = cart.reduce((acc, item) => acc + (Number(item.qty) || 1), 0);

  const handleSubmit = () => {
    if (!selectedSupplier?._id && !selectedSupplier?.id) {
      setToastMessage("⚠️ Please select a supplier before saving.");
      setActiveTab("details");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!supplierInvoiceNo || supplierInvoiceNo.trim() === "") {
      setToastMessage("⚠️ Supplier Invoice No is mandatory.");
      setActiveTab("details");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!cart || cart.length === 0) {
      setToastMessage("⚠️ Please add at least one item to the bill.");
      setActiveTab("catalog");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // Validate cart items
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      if (!item.qty || Number(item.qty) < 1) {
        setToastMessage(`⚠️ Item ${item.name} must have at least 1 quantity.`);
        setActiveTab("cart");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      if (!item.batch || item.batch.trim() === "") {
        setToastMessage(`⚠️ Batch is required for item ${item.name}.`);
        setActiveTab("cart");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      if (!item.mrp || Number(item.mrp) <= 0) {
        setToastMessage(`⚠️ MRP is required and must be > 0 for item ${item.name}.`);
        setActiveTab("cart");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      if (!item.rate || Number(item.rate) <= 0) {
        setToastMessage(`⚠️ Purchase Rate is required and must be > 0 for item ${item.name}.`);
        setActiveTab("cart");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
    }

    try {
      const payload = {
        supplierId: selectedSupplier?._id || selectedSupplier?.id,
        purchaseBillNo,
        supplierInvoiceNo,
        invoiceDate,
        rateBasis,
        isInterCompany: Boolean(originSaleInvoiceId),
        originSaleInvoiceId: originSaleInvoiceId || null,
        originCompanyId: originCompanyId || null,
        items: cart.map((item) => {
          const qty = Number(item.qty) || 0;
          const freeQty = Number(item.freeQty) || 0;
          const calculatedFreeScheme = (qty > 0 && freeQty > 0)
            ? Number(((freeQty / (qty + freeQty)) * 100).toFixed(2))
            : 0;
          const resolvedScheme = Number(
            item.saleScheme !== undefined && item.saleScheme !== null && item.saleScheme !== "" && Number(item.saleScheme) > 0
              ? item.saleScheme
              : (item.schPct || calculatedFreeScheme || 0)
          );

          return {
            productId: item.productId || null,
            name: item.name,
            pack: item.pack,
            batch: item.batch,
            expiry: item.expiry,
            qty,
            freeQty,
            schPct: Number(item.schPct) || resolvedScheme,
            saleScheme: resolvedScheme,
            schemeDiscountPercent: resolvedScheme,
            disc: Number(item.disc) || 0,
            mrp: Number(item.mrp) || 0,
            hsn: item.hsn ? String(item.hsn).trim() : "3004",
            gst: Number(item.gst) || 0,
            rate: Number(item.rate) || 0,
            amount: getItemAmount(item),
          };
        }),
        grossTotal: cartGrossTotal,
        schemeDiscount: cartSchemeDiscount,
        tradeDiscount: cartTradeDiscount,
        taxableSubtotal: cartSubtotal,
        totalGst: estTax,
        grandTotal: cartGrandTotal,
      };

      purchaseBillService.createPurchaseBill(payload)
        .then(() => {
          setToastMessage(`✅ Purchase Bill submitted successfully.`);
          setTimeout(() => {
            setToastMessage(null);
            navigate("/purchases");
          }, 1500);
        })
        .catch((err) => {
          console.error("Failed to create purchase bill:", err);
          setToastMessage(`❌ ${err?.response?.data?.message || err?.message || "Failed to submit"}`);
          setTimeout(() => setToastMessage(null), 3500);
        });
    } catch (err) {
      console.error("Failed to submit:", err);
    }
  };

  return (
    <section className="min-h-[100dvh] w-full bg-bg px-3.5 pt-3 pb-24 font-sans space-y-4">
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-[9999] flex items-center gap-2 rounded-xl border border-primary/30 bg-surface/95 p-3 text-xs font-semibold text-text shadow-xl backdrop-blur-md">
          <CheckCircle2 className="size-4 text-primary shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg bg-surface-alt border border-border">
              <ArrowLeft className="size-4 text-text-muted" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-text tracking-tight flex items-center gap-1.5">
                 Purchase Bill
              </h1>
            </div>
          </div>
          <UIButton
            type="button"
            variant="outline"
            size="sm"
            startIcon={<Sparkles className="size-3 text-emerald-600" />}
            onClick={() => setIsImportModalOpen(true)}
            className="h-8 px-2.5 text-xs font-semibold border-emerald-600/40 text-emerald-600"
          >
            Import
          </UIButton>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-surface-alt p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab("details")}
            className={cn("py-2 rounded-lg text-xs font-bold transition-all text-center", activeTab === "details" ? "bg-surface text-primary shadow-xs" : "text-text-muted hover:text-text")}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            className={cn("py-2 rounded-lg text-xs font-bold transition-all text-center", activeTab === "catalog" ? "bg-surface text-primary shadow-xs" : "text-text-muted hover:text-text")}
          >
            Catalog
          </button>
          <button
            onClick={() => setActiveTab("cart")}
            className={cn("py-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5", activeTab === "cart" ? "bg-surface text-primary shadow-xs" : "text-text-muted hover:text-text")}
          >
            <ShoppingCart className="size-3.5" /> ({cartItemCount})
          </button>
        </div>
      </div>

      {activeTab === "details" && (
        <div className="space-y-4">
          <UICard variant="default" className="p-4 rounded-2xl bg-surface border-border shadow-xs space-y-4">
             <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                  Supplier
                </span>
                <SupplierSearchBar
                  selectedSupplier={selectedSupplier}
                  onSelectSupplier={(cust) => setSelectedSupplier(cust)}
                  placeholder="Search supplier..."
                  size="md"
                />
             </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Bill Number (Auto)
                  </span>
                  <input
                    type="text"
                    className="h-10 text-sm w-full px-3 rounded-xl border border-border bg-surface-alt cursor-not-allowed text-text-muted"
                    placeholder="Auto"
                    value={purchaseBillNo}
                    disabled
                  />
               </div>
               <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                      Supplier Inv No
                    </span>
                    {originSaleInvoiceId && (
                      <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-500/10 px-1 rounded flex items-center gap-0.5">
                        <Sparkles className="size-2.5" /> Inter-Co
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      className={cn(
                        "h-10 text-sm w-full px-3 rounded-xl border bg-surface-alt font-mono",
                        originSaleInvoiceId
                          ? "border-emerald-500/50 bg-emerald-500/5 focus:border-emerald-500"
                          : "border-border focus:border-primary"
                      )}
                      placeholder="INV-001"
                      value={supplierInvoiceNo}
                      onChange={(e) => {
                        setSupplierInvoiceNo(e.target.value);
                        if (originSaleInvoiceId) {
                          setOriginSaleInvoiceId(null);
                          setOriginCompanyId(null);
                          setOriginCompanyName("");
                        }
                      }}
                      onFocus={() => {
                        if (matchingSaleBills.length > 0) setShowSaleBillDropdown(true);
                      }}
                    />
                    {isSearchingSaleBills && (
                      <Loader2 className="size-3.5 animate-spin absolute right-3 top-3 text-primary pointer-events-none" />
                    )}
                  </div>

                  {/* Matching Dropdown for Mobile */}
                  {showSaleBillDropdown && matchingSaleBills.length > 0 && (
                    <div className="absolute right-0 left-[-80px] top-full mt-1.5 z-50 bg-surface rounded-xl border border-primary/40 shadow-2xl overflow-hidden animate-in fade-in duration-150">
                      <div className="bg-primary/10 px-3 py-1.5 border-b border-primary/20 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                          <Sparkles className="size-3.5 text-primary" />
                          <span>Matching Sale Bill Found</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSaleBillDropdown(false)}
                          className="text-text-muted hover:text-text p-0.5"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                      <div className="p-1 divide-y divide-border/40 max-h-52 overflow-y-auto">
                        {matchingSaleBills.map((bill) => (
                          <div
                            key={bill._id}
                            onClick={() => handleSelectMatchingSaleBill(bill)}
                            className="p-2 hover:bg-primary/5 active:bg-primary/10 cursor-pointer rounded-lg text-left space-y-0.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-xs text-text">{bill.invoiceNo}</span>
                              <span className="text-[10px] font-bold text-emerald-600">
                                ₹{Number(bill.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="text-[10px] text-text-muted flex items-center justify-between">
                              <span>From: {bill.originCompany?.name || "Sister Co"}</span>
                              <span>{bill.itemCount || (bill.items || []).length} items</span>
                            </div>
                            <div className="text-[9px] font-semibold text-primary pt-0.5">
                              👉 Tap to auto-fill items & rates
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
               </div>
             </div>
             <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                  Invoice Date
                </span>
                <input
                  type="date"
                  className="h-10 text-sm w-full px-3 rounded-xl border border-border bg-surface-alt"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
             </div>
             <UIButton variant="primary" className="w-full justify-center" onClick={() => setActiveTab("catalog")}>Continue to Products</UIButton>
          </UICard>
        </div>
      )}

      {activeTab === "catalog" && (
        <div className="space-y-3">
          <WorkspaceProductSearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSelectProduct={handleSelectWorkspaceProduct}
            placeholder="Search products..."
            size="md"
            showDetailsPreview
          />
          <div className="text-center text-text-muted py-8 px-4 text-xs bg-surface rounded-xl border border-border shadow-xs">
             Type above to search and add items to your purchase bill.
          </div>
        </div>
      )}

      {activeTab === "cart" && (
        <div className="space-y-4">
          {cart.length > 0 ? (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="bg-surface border border-border rounded-xl p-3 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-text">{item.name}</h3>
                      {!item.productId && (
                        <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-1 py-0.2 rounded border border-amber-300">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted font-mono mt-0.5">Batch: {item.batch} | Exp: {item.expiry}</p>
                    <p className="text-xs font-bold text-emerald-600 mt-1">Rate: ₹{item.rate} x {item.qty}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => handleRemoveItem(item.id)} className="text-error/80 hover:text-error p-1">
                      <Trash2 className="size-4" />
                    </button>
                    <div className="flex items-center gap-2 bg-surface-alt rounded-lg border border-border p-1">
                      <button onClick={() => handleUpdateQty(item.id, -1)} className="size-6 flex items-center justify-center rounded hover:bg-surface-hover">
                        <Minus className="size-3" />
                      </button>
                      <span className="text-xs font-bold font-mono w-4 text-center">{item.qty}</span>
                      <button onClick={() => handleUpdateQty(item.id, 1)} className="size-6 flex items-center justify-center rounded hover:bg-surface-hover">
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="bg-surface p-4 rounded-xl border border-border space-y-2 mt-4">
                <div className="flex justify-between text-xs text-text-muted"><p>Gross Amount (Qty × Rate)</p><p>₹{cartGrossTotal.toFixed(2)}</p></div>
                {cartSchemeDiscount > 0 && <div className="flex justify-between text-xs text-amber-600"><p>Scheme Discount</p><p>-₹{cartSchemeDiscount.toFixed(2)}</p></div>}
                {cartTradeDiscount > 0 && <div className="flex justify-between text-xs text-amber-600"><p>Trade Discount</p><p>-₹{cartTradeDiscount.toFixed(2)}</p></div>}
                <div className="flex justify-between text-xs text-text"><p className="font-semibold">Taxable Subtotal</p><p className="font-semibold">₹{cartTaxableSubtotal.toFixed(2)}</p></div>
                <div className="flex justify-between text-xs text-purple-600"><p>GST Tax</p><p>+₹{estTax.toFixed(2)}</p></div>
                <div className="flex justify-between text-sm font-bold text-text pt-2 border-t border-border/70"><p>Grand Total</p><p className="text-emerald-600">₹{cartGrandTotal.toFixed(2)}</p></div>
              </div>
              
              <UIButton variant="primary" className="w-full justify-center" onClick={handleSubmit} disabled={cart.length === 0} rightIcon={<Receipt className="size-4" />}>
                Submit Bill
              </UIButton>
            </div>
          ) : (
            <div className="text-center text-text-muted py-12 px-4 bg-surface rounded-xl border border-border">
              <ShoppingCart className="size-10 mx-auto opacity-30 mb-3" />
              <p className="text-sm font-bold">Cart is empty</p>
              <p className="text-xs mt-1">Go to Catalog to add items</p>
            </div>
          )}
        </div>
      )}

      {/* Import Purchase Bill (OCR) Modal */}
      <ImportPurchaseBillModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onApplyPrefill={applyImportedPrefillData}
      />
    </section>
  );
};

export default CreatePurchaseBillMobilePage;
