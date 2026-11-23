// src/features/purchases/pages/desktop/CreatePurchaseBillDesktopPage.jsx

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Receipt,
  Building2,
  FileSpreadsheet,
  ArrowLeft,
  X,
  Loader2
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  UICard,
  UIButton,
  WorkspaceProductSearchBar,
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter
} from "@/components";
import { cn } from "@/lib/utils";
import supplierService from "@/features/parties/suppliers/services/supplierService";
import purchaseBillService from "@/features/purchases/services/purchaseBillService";
import { Popover } from "@mui/material";
import { SupplierSearchBar } from "@/components";
import workspaceProductService from "@/features/workspace-products/services/workspaceProductService";
import { PurchaseBillSchemeCheckModal } from "@/features/purchases/components/scheme-check/PurchaseBillSchemeCheckModal";
import { PurchaseBillRateCheckModal } from "@/features/purchases/components/rate-check/PurchaseBillRateCheckModal";
import { computeRateCheckRow } from "@/features/purchases/utils/rateCheckUtils";
import useBranch from "@/features/branch/hooks/useBranch";

const BatchInputWithDropdown = ({ item, updateItemField, currentBranchId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFocus = async (e) => {
    setAnchorEl(e.currentTarget);
    setIsOpen(true);
    if (batches.length === 0 && !isLoading) {
      setIsLoading(true);
      try {
        const res = await workspaceProductService.getProductFacilityBatchesByQueryV2({
          filters: { product: item.productId },
          limit: 20,
        });
        const apiBatches = res.data?.data?.batches || res.data?.batches || res.data?.data || [];
        setBatches(apiBatches);
      } catch (err) {
        console.error("Failed to fetch batches:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setAnchorEl(null);
  };

  const filteredBatches = batches.filter(b => {
    const bNo = b.batchNo || b.batchNumber || b.batch || "";
    return bNo.toLowerCase().includes((item.batch || "").toLowerCase());
  });

  return (
    <>
      <input
        id={`batch-input-${item.id}`}
        type="text"
        value={item.batch || ""}
        onChange={(e) => {
          updateItemField(item.id, "batch", e.target.value);
          setIsOpen(true);
          if (!anchorEl) setAnchorEl(e.currentTarget);
        }}
        onFocus={handleFocus}
        className="w-20 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-text focus:border-primary focus:outline-none"
        placeholder="Batch"
      />

      <Popover
        open={isOpen && Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        disableScrollLock
        PaperProps={{
          sx: {
            mt: 0.5,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            overflow: 'visible'
          }
        }}
      >
        <div className="w-56 bg-surface border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="p-2 text-center text-[10px] text-text-muted flex items-center justify-center gap-2">
              <Loader2 className="size-3 animate-spin text-primary" /> Loading...
            </div>
          ) : filteredBatches.length > 0 ? (
            <div className="py-1">
              {filteredBatches.map(b => {
                const bNo = b.batchNo || b.batchNumber || b.batch;
                const bExp = b.expiry || b.expiryDate || b.expDate || "";
                const bScheme = b.schemeDiscountPercent || 0;
                const bStock = b.stock ?? b.batchQty ?? 0;
                const bBranchId = b.branchId || b.branch_id?._id || b.branch_id;
                const isCurrentBranch = !bBranchId || (currentBranchId && String(bBranchId) === String(currentBranchId));
                const bBranchName = b.branchName || "";

                return (
                  <div
                    key={b.id || b._id || bNo}
                    onClick={() => {
                      updateItemField(item.id, "batch", bNo);
                      updateItemField(item.id, "expiry", bExp);
                      updateItemField(item.id, "schPct", bScheme);
                      handleClose();
                    }}
                    className="px-2 py-1.5 hover:bg-surface-hover cursor-pointer border-b border-border/50 last:border-0"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-xs text-text truncate">{bNo}</span>
                        {!isCurrentBranch && bBranchName && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium whitespace-nowrap">
                            {bBranchName}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-text-muted bg-surface-alt px-1 rounded font-mono shrink-0">
                        {isCurrentBranch ? `Qty: ${bStock}` : `${bStock} (other)`}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-0.5 text-[10px] text-text-muted">
                      <span>Exp: {bExp || "N/A"}</span>
                      {bScheme > 0 && <span className="text-emerald-600 font-semibold">Sch: {bScheme}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-2 text-center text-[10px] text-text-muted">
              {item.batch ? "No matching batches" : "No existing batches"}
            </div>
          )}
        </div>
      </Popover>
    </>
  );
};

const QuickCreateProductModal = ({ open, onClose, defaultName, onSuccess }) => {
  const [name, setName] = useState(defaultName || "");
  const [productType, setProductType] = useState("medicine");
  const [pack, setPack] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setName(defaultName || "");
      setProductType("medicine");
      setPack("");
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
        productType,
        pack: pack.trim(),
        force: true
      };
      const res = await workspaceProductService.createWorkspaceProduct(payload);
      const newProduct = res.data?.data || res.data;
      onSuccess(newProduct);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UIModal isOpen={open} onClose={onClose} className="max-w-md">
      <form onSubmit={handleSubmit}>
        <UIModalHeader>
          <UIModalTitle>Create Quick Product</UIModalTitle>
          <UIModalDescription>Add a new workspace product on the fly.</UIModalDescription>
        </UIModalHeader>
        <UIModalBody className="space-y-4 p-5">
          {error && <div className="text-error text-sm font-semibold">{error}</div>}
          <div>
            <label className="text-xs font-bold text-text-muted">Product Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dolo 650 Tablet" required className="w-full mt-1 h-9 rounded-lg border border-border px-3 text-sm bg-surface-alt text-text" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-text-muted">Product Type *</label>
              <select value={productType} onChange={e => setProductType(e.target.value)} className="w-full mt-1 h-9 rounded-lg border border-border px-3 text-sm bg-surface-alt text-text">
                <option value="medicine">Medicine</option>
                <option value="otc">OTC</option>
                <option value="fmcg">FMCG</option>
                <option value="equipment">Equipment</option>
                <option value="general">General</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted">Pack</label>
              <input type="text" value={pack} onChange={e => setPack(e.target.value)} placeholder="e.g. 10's" className="w-full mt-1 h-9 rounded-lg border border-border px-3 text-sm bg-surface-alt text-text" />
            </div>
          </div>
        </UIModalBody>
        <UIModalFooter>
          <UIButton type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</UIButton>
          <UIButton type="submit" variant="primary" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? "Creating..." : "Create Product"}
          </UIButton>
        </UIModalFooter>
      </form>
    </UIModal>
  );
};

const QuickCreateSupplierModal = ({ open, onClose, defaultName, onSuccess }) => {
  const [businessName, setBusinessName] = useState(defaultName || "");
  const [supplierType, setSupplierType] = useState("distributor");
  const [gstNumber, setGstNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setBusinessName(defaultName || "");
      setSupplierType("distributor");
      setGstNumber("");
      setMobile("");
      setError(null);
    }
  }, [open, defaultName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!businessName.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        businessName: businessName.trim(),
        supplierType,
      };
      if (gstNumber.trim()) payload.gstNumber = gstNumber.trim().toUpperCase();
      if (mobile.trim()) payload.mobile = mobile.trim();

      const res = await supplierService.createSupplier(payload);
      const newSupplier = res.data?.data || res.data;
      onSuccess(newSupplier);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to create supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UIModal isOpen={open} onClose={onClose} className="max-w-md">
      <form onSubmit={handleSubmit}>
        <UIModalHeader>
          <UIModalTitle>Create Quick Supplier</UIModalTitle>
          <UIModalDescription>Add a new supplier on the fly.</UIModalDescription>
        </UIModalHeader>
        <UIModalBody className="space-y-4 p-5">
          {error && <div className="text-error text-sm font-semibold">{error}</div>}
          <div>
            <label className="text-xs font-bold text-text-muted">Business Name *</label>
            <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Lupin Ltd" required className="w-full mt-1 h-9 rounded-lg border border-border px-3 text-sm bg-surface-alt text-text" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-text-muted">Supplier Type *</label>
              <select value={supplierType} onChange={e => setSupplierType(e.target.value)} className="w-full mt-1 h-9 rounded-lg border border-border px-3 text-sm bg-surface-alt text-text">
                <option value="distributor">Distributor</option>
                <option value="wholesaler">Wholesaler</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="cfa">CFA</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted">GST Number</label>
              <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)} placeholder="Optional" className="w-full mt-1 h-9 rounded-lg border border-border px-3 text-sm bg-surface-alt text-text uppercase" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-text-muted">Mobile Number</label>
            <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Optional" className="w-full mt-1 h-9 rounded-lg border border-border px-3 text-sm bg-surface-alt text-text" />
          </div>
        </UIModalBody>
        <UIModalFooter>
          <UIButton type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</UIButton>
          <UIButton type="submit" variant="primary" disabled={isSubmitting || !businessName.trim()}>
            {isSubmitting ? "Creating..." : "Create Supplier"}
          </UIButton>
        </UIModalFooter>
      </form>
    </UIModal>
  );
};

export const CreatePurchaseBillDesktopPage = () => {
  const navigate = useNavigate();
  const { billId } = useParams();
  const { currentBranch } = useBranch();
  const currentBranchId = currentBranch?._id || currentBranch?.id || null;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [cart, setCart] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  // Rate Basis
  const [rateBasis, setRateBasis] = useState("PTS"); // "PTS" or "PTR"

  // Invoice Details
  const [purchaseBillNo, setPurchaseBillNo] = useState("");
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSchemeCheckModalOpen, setIsSchemeCheckModalOpen] = useState(false);
  const [isRateCheckModalOpen, setIsRateCheckModalOpen] = useState(false);
  const [isQuickCreateModalOpen, setIsQuickCreateModalOpen] = useState(false);
  const [quickCreateProductName, setQuickCreateProductName] = useState("");
  const [isQuickCreateSupplierModalOpen, setIsQuickCreateSupplierModalOpen] = useState(false);
  const [quickCreateSupplierName, setQuickCreateSupplierName] = useState("");

  // Extra Discount (applied on taxable subtotal in preview)
  const [extraDiscountPct, setExtraDiscountPct] = useState(0);

  // Amount Paid
  const [amountPaid, setAmountPaid] = useState(0);

  // Submit loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchBarRef = useRef(null);
  const supplierSearchBarRef = useRef(null);
  const previewButtonRef = useRef(null);

  // Load existing bill if billId is present (Edit Mode)
  useEffect(() => {
    const loadBill = async () => {
      if (!billId) return;
      try {
        const res = await purchaseBillService.getPurchaseBillById(billId);
        const bill = res.data?.data;
        if (bill) {
          if (bill.supplierId) {
            setSelectedSupplier({
              ...bill.supplierId,
              id: bill.supplierId._id,
              name: bill.supplierId.businessName
            });
          }
          setPurchaseBillNo(bill.purchaseBillNo || "");
          setSupplierInvoiceNo(bill.supplierInvoiceNo || "");
          setInvoiceDate(bill.invoiceDate || "");
          setRateBasis(bill.rateBasis || "PTS");
          setExtraDiscountPct(bill.extraDiscountPct || 0);
          setAmountPaid(bill.amountPaid || 0);

          if (bill.items && Array.isArray(bill.items)) {
            const loadedCart = bill.items.map(item => ({
              ...item,
              id: item._id || item.id || `${Date.now()}-${Math.random()}`,
            }));
            setCart(loadedCart);
          }
        }
      } catch (err) {
        console.error("Failed to load bill", err);
        setToastMessage("❌ Failed to load purchase bill for editing");
        setTimeout(() => setToastMessage(null), 4000);
      }
    };
    loadBill();
  }, [billId]);

  // Auto-focus handler
  useEffect(() => {
    const handleGlobalTyping = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") return;

      if (e.key && e.key.length === 1) {
        if (!selectedSupplier) {
          supplierSearchBarRef.current?.focus();
        } else {
          searchBarRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalTyping);
    return () => window.removeEventListener("keydown", handleGlobalTyping);
  }, [selectedSupplier]);

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
      qty: 0,
      freeQty: 0,
      schPct: 0,
      disc: 0,
      cRatePct: Number(p.rateCPercentage || p.cRatePct || 0),
      mrp: baseMrp,
      hsn: getHsnCode(p),
      gst: getGstRate(p),
      rate: baseRate,
      retailerMarginPercent: Number(p.retailerMarginPercent || 20),
      stockistMarginPercent: Number(p.stockistMarginPercent || 10),
      workspaceProduct: p,
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
    searchBarRef.current?.clear?.();
    setToastMessage(`✅ Added ${newItem.name} to Purchase Bill.`);

    setTimeout(() => {
      const batchInput = document.getElementById(`batch-input-${newItem.id}`);
      if (batchInput) {
        batchInput.focus();
      } else {
        searchBarRef.current?.focus();
      }
    }, 100);

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

  const handleRemoveItem = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => setCart([]);

  // Calculate item base amount (Qty * Rate)
  const getItemBaseAmount = (item) => {
    const rate = Number(item.rate) || 0;
    const qty = Number(item.qty) || 0;
    return rate * qty;
  };

  // Calculate item scheme discount amount
  const getItemSchemeDiscount = (item) => {
    const base = getItemBaseAmount(item);
    const schPct = Number(item.schPct) || 0;
    return (base * schPct) / 100;
  };

  // Calculate item trade discount amount (calculated after scheme discount)
  const getItemTradeDiscount = (item) => {
    const base = getItemBaseAmount(item);
    const schAmt = getItemSchemeDiscount(item);
    const afterScheme = base - schAmt;
    const discPct = Number(item.disc) || 0;
    return (afterScheme * discPct) / 100;
  };

  // Calculate item taxable amount: (Qty * Rate) - Scheme Disc - Trade Disc
  const getItemTaxableAmount = (item) => {
    const base = getItemBaseAmount(item);
    const schAmt = getItemSchemeDiscount(item);
    const discAmt = getItemTradeDiscount(item);
    return Math.max(0, base - schAmt - discAmt);
  };

  // Legacy/line amount for table line display
  const getItemAmount = (item) => getItemTaxableAmount(item);

  const cartGrossTotal = cart.reduce((acc, item) => acc + getItemBaseAmount(item), 0);
  const cartSchemeDiscount = cart.reduce((acc, item) => acc + getItemSchemeDiscount(item), 0);
  const cartTradeDiscount = cart.reduce((acc, item) => acc + getItemTradeDiscount(item), 0);
  const cartTaxableSubtotal = cart.reduce((acc, item) => acc + getItemTaxableAmount(item), 0);
  const cartSubtotal = cartTaxableSubtotal;

  // Extra Discount on taxable subtotal
  const extraDiscountAmt = (cartTaxableSubtotal * (Number(extraDiscountPct) || 0)) / 100;
  const cartTaxableAfterExtra = Math.max(0, cartTaxableSubtotal - extraDiscountAmt);

  const estTax = cart.reduce((acc, item) => {
    const taxable = getItemTaxableAmount(item);
    const extraDiscFactor = 1 - (Number(extraDiscountPct) || 0) / 100;
    const adjustedTaxable = taxable * extraDiscFactor;
    const gstPct = item.gst !== undefined && item.gst !== null && item.gst !== "" ? Number(item.gst) : 0;
    return acc + (adjustedTaxable * gstPct) / 100;
  }, 0);

  const cartGrandTotal = Math.round(cartTaxableAfterExtra + estTax);
  const cartItemCount = cart.reduce((acc, item) => acc + (Number(item.qty) || 1), 0);
  const amountDue = Number((cartGrandTotal - amountPaid).toFixed(2));

  const getTaxSlabBreakdown = () => {
    const slabs = {};
    cart.forEach((item) => {
      const gstPct = item.gst !== undefined && item.gst !== null && item.gst !== "" ? Number(item.gst) : 0;
      const lineTaxable = getItemTaxableAmount(item);
      const lineTax = (lineTaxable * gstPct) / 100;

      if (!slabs[gstPct]) {
        slabs[gstPct] = {
          gstPct,
          cgstPct: gstPct / 2,
          sgstPct: gstPct / 2,
          taxable: 0,
          cgstAmt: 0,
          sgstAmt: 0,
          totalTax: 0,
        };
      }

      slabs[gstPct].taxable += lineTaxable;
      slabs[gstPct].cgstAmt += lineTax / 2;
      slabs[gstPct].sgstAmt += lineTax / 2;
      slabs[gstPct].totalTax += lineTax;
    });

    return Object.values(slabs).sort((a, b) => a.gstPct - b.gstPct);
  };

  const handleOpenPreview = () => {
    if (!selectedSupplier) {
      setToastMessage("⚠️ Please select a supplier first.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    if (cart.length === 0) {
      setToastMessage("⚠️ Cannot submit an empty purchase bill.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setIsPreviewModalOpen(true);
  };

  const handleRateCheck = () => {
    setIsRateCheckModalOpen(true);
  };

  const handleApplyRateCheck = (editedRows, computedRows = []) => {
    setCart((prev) =>
      prev.map((item) => {
        const pid = String(item.id || item.productId);
        const edit = editedRows[pid];
        const computed = computedRows.find(r => String(r.id || r.productId) === pid);

        if (edit || computed) {
          const newRateB = edit?.rateB ?? computed?.rateB ?? item.rateB;
          const newRateA = edit?.rateA ?? computed?.rateA ?? item.rateA;
          const newRateC = edit?.rateC ?? computed?.rateC ?? item.rateC;
          const derivedRetail = edit?.derivedRetail ?? computed?.retailerMarginPercent ?? item.retailerMarginPercent;
          const rateCPercentage = edit?.rateCPercentage ?? computed?.rateCPercentage ?? item.rateCPercentage;

          const newRate = rateBasis === "PTR" ? (newRateB ?? item.rate) : (newRateA ?? item.rate);
          return {
            ...item,
            rateA: newRateA,
            rateB: newRateB,
            rateC: newRateC,
            retailerMarginPercent: derivedRetail,
            rateCPercentage: rateCPercentage,
            cRatePct: rateCPercentage,
            rate: newRate,
          };
        }
        return item;
      })
    );
  };

  const handleSchemeCheck = () => {
    setIsSchemeCheckModalOpen(true);
  };

  const handleApplySchemeCheck = (updatedSaleSchemesMap) => {
    setCart(prev => prev.map(item => {
      const pid = String(item.id || "").split('-')[0] || String(item.productId);
      if (updatedSaleSchemesMap[pid] !== undefined) {
        return { ...item, saleScheme: updatedSaleSchemesMap[pid] };
      }
      return item;
    }));
    setToastMessage("✅ Sale schemes applied successfully.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;

    if (!selectedSupplier?._id && !selectedSupplier?.id) {
      setToastMessage("⚠️ Please select a supplier before saving.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!supplierInvoiceNo || supplierInvoiceNo.trim() === "") {
      setToastMessage("⚠️ Supplier Invoice No is mandatory.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (!cart || cart.length === 0) {
      setToastMessage("⚠️ Please add at least one item to the bill.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // Validate cart items
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      if (!item.qty || Number(item.qty) < 1) {
        setToastMessage(`⚠️ Item ${item.name} must have at least 1 quantity.`);
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      if (!item.batch || item.batch.trim() === "") {
        setToastMessage(`⚠️ Batch is required for item ${item.name}.`);
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      if (!item.mrp || Number(item.mrp) <= 0) {
        setToastMessage(`⚠️ MRP is required and must be > 0 for item ${item.name}.`);
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
      if (!item.rate || Number(item.rate) <= 0) {
        setToastMessage(`⚠️ Purchase Rate is required and must be > 0 for item ${item.name}.`);
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        branchId: currentBranchId || null,
        supplierId: selectedSupplier?._id || selectedSupplier?.id,
        purchaseBillNo,
        supplierInvoiceNo,
        invoiceDate,
        rateBasis,
        items: cart.map((item) => {
          let rA = Number(item.rateA) || 0;
          let rB = Number(item.rateB) || 0;
          let rC = Number(item.rateC) || 0;
          
          if (!rA || !rB || !rC) {
            const computed = computeRateCheckRow(item, rateBasis);
            if (!rA) rA = computed.rateA || 0;
            if (!rB) rB = computed.rateB || 0;
            if (!rC) rC = computed.rateC || 0;
          }

          return {
            productId: item.productId || null,
            name: item.name,
            pack: item.pack,
            batch: item.batch,
            expiry: item.expiry,
            qty: Number(item.qty) || 0,
            freeQty: Number(item.freeQty) || 0,
            schPct: Number(item.schPct) || 0,
            disc: Number(item.disc) || 0,
            cRatePct: Number(item.cRatePct) || 0,
            mrp: Number(item.mrp) || 0,
            hsn: item.hsn || "",
            gst: item.gst !== undefined && item.gst !== null && item.gst !== "" ? Number(item.gst) : 0,
            rate: Number(item.rate) || 0,
            amount: getItemTaxableAmount(item),
            rateA: rA,
            rateB: rB,
            rateC: rC,
            finalRateA: rA,
            finalRateB: rB,
            finalRateC: rC,
            saleScheme: Number(item.saleScheme) || 0,
          };
        }),
        extraDiscountPct: Number(extraDiscountPct) || 0,
        extraDiscountAmt: extraDiscountAmt,
        grossTotal: cartGrossTotal,
        schemeDiscount: cartSchemeDiscount,
        tradeDiscount: cartTradeDiscount,
        taxableSubtotal: cartTaxableSubtotal,
        taxableAfterExtraDisc: cartTaxableAfterExtra,
        totalGst: estTax,
        grandTotal: cartGrandTotal,
        amountPaid: Number(amountPaid) || 0,
        amountDue,
        gstSlabs: getTaxSlabBreakdown(),
      };

      if (billId) {
        await purchaseBillService.updatePurchaseBill(billId, payload);
      } else {
        await purchaseBillService.createPurchaseBill(payload);
      }



      setIsPreviewModalOpen(false);
      setToastMessage(`✅ Purchase Bill ${purchaseBillNo || "saved"} successfully.`);
      setTimeout(() => {
        setToastMessage(null);
        navigate("/purchases");
      }, 2000);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Failed to save purchase bill";
      setToastMessage(`❌ ${msg}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-[100dvh] w-full bg-bg px-4 sm:px-6 lg:px-2 py-6 font-sans space-y-5">
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 right-8 z-[9999] flex items-center gap-2.5 rounded-2xl border border-primary/30 bg-surface/95 px-4 py-3 text-sm font-semibold text-text shadow-xl backdrop-blur-md"
        >
          <CheckCircle2 className="size-5 text-primary shrink-0" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs">
        <div className="flex items-center gap-3">
          <UIButton
            variant="ghost"
            size="icon"
            className="text-text-muted hover:text-text hover:bg-surface-hover shrink-0"
            onClick={() => navigate("/purchases")}
          >
            <ArrowLeft className="size-5" />
          </UIButton>
          <div>
            <h1 className="text-xl font-bold text-text flex items-center gap-2">
              <Receipt className="size-6 text-primary" />
              {billId ? "Edit Purchase Bill" : "Enter Purchase Bill"}
            </h1>
            <p className="text-xs text-text-muted mt-1">
              {billId ? "Update inwards bill details and items" : "Record inwards stock and purchase details from supplier"}
            </p>
          </div>
        </div>
      </div>

      {/* Details Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-xl">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              Select Supplier
            </span>
            <SupplierSearchBar
              ref={supplierSearchBarRef}
              selectedSupplier={selectedSupplier}
              onSelectSupplier={(cust) => {
                setSelectedSupplier(cust);
                if (cust) {
                  setTimeout(() => {
                    searchBarRef.current?.focus();
                  }, 100);
                }
              }}
              showAddNewAction={true}
              onAddNewSupplier={(name) => {
                setQuickCreateSupplierName(name);
                setIsQuickCreateSupplierModalOpen(true);
              }}
              placeholder="Search supplier by name, GST, or phone..."
              size="sm"
            />
          </div>
          <div className="flex gap-4">
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                Bill Number (Auto)
              </span>
              <input
                type="text"
                className="h-8.5 text-xs px-2.5 rounded-lg border border-border bg-surface-alt w-32 cursor-not-allowed text-text-muted"
                placeholder="Auto-calculated"
                value={purchaseBillNo}
                disabled
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                Supplier Invoice No
              </span>
              <input
                type="text"
                className="h-8.5 text-xs px-2.5 rounded-lg border border-border bg-surface w-32 focus:border-primary focus:outline-none"
                placeholder="Enter Invoice No"
                value={supplierInvoiceNo}
                onChange={(e) => setSupplierInvoiceNo(e.target.value)}
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                Invoice Date
              </span>
              <input
                type="date"
                className="h-8.5 text-xs px-2.5 rounded-lg border border-border bg-surface-alt w-36"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                Rate Basis
              </span>
              <select
                className="h-8.5 text-xs px-2.5 rounded-lg border border-border bg-surface-alt"
                value={rateBasis}
                onChange={(e) => setRateBasis(e.target.value)}
              >
                <option value="PTS">PTS (Stockist)</option>
                <option value="PTR">PTR (Retailer)</option>
              </select>
            </div>
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                Amount Paid
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="h-8.5 text-xs px-2.5 rounded-lg border border-border bg-surface-alt w-28 text-emerald-700 font-bold"
                placeholder="0.00"
                value={amountPaid === 0 ? "" : amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Cart Full Width */}
      <div className="w-full">
        <UICard variant="default" className="p-6 rounded-2xl bg-surface border-border shadow-xs flex flex-col justify-between min-h-[620px] space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-border/70">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <ShoppingCart className="size-5.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-text">Purchase Bill Cart</h2>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-700 px-2.5 py-0.5 text-xs font-extrabold font-mono">
                      {cartItemCount} Items
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5">
                    <span className="font-semibold text-text">Supplier: </span>
                    {selectedSupplier ? (
                      <span className="font-extrabold text-emerald-600">{selectedSupplier.name}</span>
                    ) : (
                      <span className="font-bold text-amber-600">No Supplier Selected</span>
                    )}
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <button type="button" onClick={handleClearCart} className="text-xs font-semibold text-error hover:underline flex items-center gap-1 cursor-pointer">
                  <Trash2 className="size-4" />
                  <span>Clear Cart</span>
                </button>
              )}
            </div>

            <div
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.defaultPrevented &&
                  event.target === searchBarRef.current?.input
                ) {
                  event.preventDefault();
                  previewButtonRef.current?.focus();
                }
              }}
            >
              <WorkspaceProductSearchBar
                ref={searchBarRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSelectProduct={handleSelectWorkspaceProduct}
                onCreateProductClick={(query) => {
                  setQuickCreateProductName(query);
                  setIsQuickCreateModalOpen(true);
                }}
                placeholder="Search product / medicine to add to purchase bill..."
                size="md"
                showDetailsPreview
                showQuickCreateAction
              />
            </div>

            <div
              className="overflow-x-auto overflow-y-auto rounded-xl border border-border bg-surface-alt/30 max-h-[320px]"
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== "ArrowLeft") return;

                const fields = Array.from(
                  event.currentTarget.querySelectorAll("input, select, textarea")
                ).filter((field) => !field.disabled && field.tabIndex !== -1);
                const currentIndex = fields.indexOf(event.target);
                if (currentIndex === -1) return;

                const nextIndex = currentIndex + (event.key === "Enter" ? 1 : -1);
                const nextField = fields[nextIndex];
                if (nextField) {
                  event.preventDefault();
                  nextField.focus();
                } else if (event.key === "Enter" && currentIndex === fields.length - 1) {
                  event.preventDefault();
                  searchBarRef.current?.focus();
                }
              }}
            >
              {cart.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-surface-alt/95 backdrop-blur-sm shadow-sm">
                    <tr className="border-b border-border text-[10.5px] font-bold text-text-muted uppercase tracking-wider select-none whitespace-nowrap">
                      <th className="py-2.5 px-3 min-w-[130px]">Product</th>
                      <th className="py-2.5 px-2 font-mono">Batch</th>
                      <th className="py-2.5 px-2 font-mono">Expiry</th>
                      <th className="py-2.5 px-2 font-mono text-center">Qty</th>
                      <th className="py-2.5 px-2 font-mono text-center">Free</th>
                      <th className="py-2.5 px-2 font-mono text-center">SCH%</th>
                      <th className="py-2.5 px-2 font-mono text-center">Disc%</th>
                      <th className="py-2.5 px-2 font-mono text-right">MRP</th>
                      <th className="py-2.5 px-2 font-mono">HSN</th>
                      <th className="py-2.5 px-2 font-mono text-center">GST%</th>
                      <th className="py-2.5 px-2 font-mono text-right">Rate</th>
                      <th className="py-2.5 px-2 font-mono text-center">CRate%</th>
                      <th className="py-2.5 px-3 font-mono text-right">Amount</th>
                      <th className="py-2.5 px-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {cart.map((item) => {
                      const lineAmt = getItemAmount(item);
                      return (
                        <tr key={item.id} className="hover:bg-surface-hover/80 transition-colors">
                          {/* 1. Product */}
                          <td className="py-2 px-3">
                            <span className="font-bold text-text text-xs block truncate max-w-[130px]" title={item.name}>
                              {item.name}
                            </span>
                            <span className="text-[10px] text-text-muted block">{item.pack || "Pack"}</span>
                          </td>

                          {/* 2. Batch */}
                          <td className="py-2 px-2">
                            <BatchInputWithDropdown
                              item={item}
                              updateItemField={updateItemField}
                              currentBranchId={currentBranchId}
                            />
                          </td>

                          {/* 3. Expiry */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              placeholder="MM/YY"
                              maxLength={5}
                              value={item.expiry || ""}
                              onChange={(e) => updateItemField(item.id, "expiry", formatExpiryInput(e.target.value, item.expiry))}
                              className="w-14 text-center rounded border border-border bg-surface px-1 py-0.5 font-mono text-xs text-text font-semibold outline-none focus:border-primary"
                            />
                          </td>

                          {/* 4. Qty */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.qty === 0 ? "" : (item.qty ?? "")}
                              onChange={(e) => updateItemField(item.id, "qty", e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                              className="w-12 text-center rounded border border-border bg-surface px-1 py-0.5 font-mono font-bold text-xs text-text outline-none focus:border-primary"
                              placeholder="Qty"
                            />
                          </td>

                          {/* 5. Free */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.freeQty === 0 ? "" : (item.freeQty ?? "")}
                              onChange={(e) => updateItemField(item.id, "freeQty", e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
                              onBlur={() => handleFreeBlurOrTab(item)}
                              onKeyDown={(e) => {
                                if (e.key === "Tab" && !e.shiftKey) {
                                  handleFreeBlurOrTab(item);
                                }
                              }}
                              className="w-12 text-center rounded border border-border bg-surface-alt px-1 py-0.5 font-mono text-xs text-text-muted outline-none focus:border-primary"
                              placeholder="Free"
                            />
                          </td>

                          {/* 6. SCH% */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={item.schPct === 0 ? "" : (item.schPct ?? "")}
                              onChange={(e) => updateItemField(item.id, "schPct", e.target.value === "" ? 0 : Number(e.target.value))}
                              onBlur={() => handleSchBlurOrTab(item)}
                              onKeyDown={(e) => {
                                if (e.key === "Tab" && !e.shiftKey) {
                                  handleSchBlurOrTab(item);
                                }
                              }}
                              className="w-12 text-center rounded border border-border bg-surface px-1 py-0.5 font-mono text-xs text-text outline-none focus:border-primary"
                              placeholder="0"
                            />
                          </td>

                          {/* 7. Disc% */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={item.disc === 0 ? "" : (item.disc ?? "")}
                              onChange={(e) => updateItemField(item.id, "disc", e.target.value === "" ? 0 : Number(e.target.value))}
                              className="w-12 text-center rounded border border-border bg-surface px-1 py-0.5 font-mono text-xs text-text outline-none focus:border-primary"
                              placeholder="0"
                            />
                          </td>

                          {/* 8. MRP */}
                          <td className="py-2 px-2 font-mono text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.mrp === 0 ? "" : (item.mrp ?? "")}
                              onChange={(e) => updateItemField(item.id, "mrp", e.target.value === "" ? 0 : Number(e.target.value))}
                              className="w-16 text-right rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-text focus:border-primary focus:outline-none"
                            />
                          </td>

                          {/* 9. HSN */}
                          <td className="py-2 px-2 font-mono text-xs text-text-muted">
                            <input
                              type="text"
                              value={item.hsn || ""}
                              onChange={(e) => updateItemField(item.id, "hsn", e.target.value)}
                              className="w-14 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-text focus:border-primary focus:outline-none"
                              placeholder="HSN"
                            />
                          </td>

                          {/* 10. GST% */}
                          <td className="py-2 px-2 font-mono text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.gst ?? ""}
                              onChange={(e) => updateItemField(item.id, "gst", e.target.value === "" ? "" : Number(e.target.value))}
                              className="w-12 text-center rounded border border-border bg-surface px-1 py-0.5 font-mono text-xs font-bold text-purple-600 focus:border-primary focus:outline-none"
                            />
                          </td>

                          {/* 11. Rate */}
                          <td className="py-2 px-2 font-mono text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate === 0 ? "" : (item.rate ?? "")}
                              onChange={(e) => updateItemField(item.id, "rate", e.target.value === "" ? 0 : Number(e.target.value))}
                              className="w-18 text-right rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-xs font-bold text-text focus:border-primary focus:outline-none"
                            />
                          </td>

                          {/* 12. CRate% */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={item.cRatePct === 0 ? "" : (item.cRatePct ?? "")}
                              onChange={(e) => updateItemField(item.id, "cRatePct", e.target.value === "" ? 0 : Number(e.target.value))}
                              className="w-12 text-center rounded border border-border bg-surface px-1 py-0.5 font-mono text-xs text-text outline-none focus:border-primary"
                              placeholder="0"
                            />
                          </td>

                          {/* 13. Amount */}
                          <td className="py-2 px-3 font-mono text-right font-extrabold text-emerald-600 text-xs tabular-nums">
                            ₹{lineAmt.toFixed(2)}
                          </td>

                          {/* 14. Actions */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-text-muted hover:text-error transition-colors p-1 cursor-pointer rounded hover:bg-error/10"
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
                <div className="py-12 text-center text-text-muted space-y-2">
                  <ShoppingCart className="size-8 mx-auto opacity-40 text-text-muted" />
                  <p className="text-xs font-semibold">Purchase Bill is empty</p>
                  <p className="text-[11px] text-text-muted">
                    Use the search bar above to scan or add medicines to the bill
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Calculation Bar */}
          <div className="pt-4 border-t border-border/70 space-y-3">
            <div className="flex justify-end gap-6 text-sm">
              <div className="text-right space-y-1 text-text-muted">
                <p>Gross Amount (Qty × Rate):</p>
                {cartSchemeDiscount > 0 && <p className="text-amber-600">Scheme Discount:</p>}
                {cartTradeDiscount > 0 && <p className="text-amber-600">Trade Discount (Disc %):</p>}
                <p className="font-semibold text-text">Taxable Subtotal:</p>
                {extraDiscountAmt !== 0 && <p className={extraDiscountAmt > 0 ? "text-orange-600" : "text-emerald-600"}>{extraDiscountAmt > 0 ? "Extra Discount" : "Extra Charge"} ({extraDiscountPct}%):</p>}
                <p className="text-purple-600">Est. GST Tax:</p>
                <p className="text-lg font-bold text-text mt-2">Grand Total:</p>
              </div>
              <div className="text-right space-y-1 font-mono font-medium">
                <p>₹{cartGrossTotal.toFixed(2)}</p>
                {cartSchemeDiscount > 0 && <p className="text-amber-600">-₹{cartSchemeDiscount.toFixed(2)}</p>}
                {cartTradeDiscount > 0 && <p className="text-amber-600">-₹{cartTradeDiscount.toFixed(2)}</p>}
                <p className="font-semibold text-text">₹{cartTaxableSubtotal.toFixed(2)}</p>
                {extraDiscountAmt > 0 && <p className="text-orange-600">-₹{extraDiscountAmt.toFixed(2)}</p>}
                <p className="text-purple-600">+₹{estTax.toFixed(2)}</p>
                <p className="text-lg font-bold text-emerald-600 mt-2">₹{cartGrandTotal.toFixed(2)}</p>
              </div>
            </div>

            <UIButton
              ref={previewButtonRef}
              variant="primary"
              size="md"
              className="w-full justify-center text-sm font-bold shadow-sm"
              disabled={cart.length === 0}
              onClick={handleOpenPreview}
              rightIcon={<Receipt className="size-4" />}
            >
              Preview Purchase Bill (₹{cartGrandTotal})
            </UIButton>
          </div>
        </UICard>
      </div>

      {/* Purchase Bill Preview Modal */}
      <UIModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        size="3xl"
      >
        <UIModalHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <UIModalTitle className="flex items-center gap-2">
                <FileSpreadsheet className="size-5 text-emerald-600" />
                <span>{billId ? "Edit Purchase Bill Preview" : "Purchase Bill Preview"}</span>
              </UIModalTitle>
              <UIModalDescription>
                Review inwards bill details, rates, and scheme discounts before final submission
              </UIModalDescription>
            </div>
            <button
              onClick={() => setIsPreviewModalOpen(false)}
              className="p-1.5 rounded-full text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </UIModalHeader>

        <UIModalBody className="space-y-4">
          {/* Summary Header */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 bg-surface-alt/70 p-3.5 rounded-2xl border border-border text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">Supplier</span>
              <span className="font-extrabold text-emerald-700 block truncate">
                {selectedSupplier?.name || "No Supplier Selected"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">Bill Number</span>
              <span className="font-mono font-bold text-text block">{purchaseBillNo || "Auto-calculated"}</span>
              {supplierInvoiceNo && (
                <span className="text-[9px] font-medium text-text-muted block mt-0.5">Inv: {supplierInvoiceNo}</span>
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">Invoice Date</span>
              <span className="font-mono font-bold text-text block">{invoiceDate || "Today"}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">Rate Basis</span>
              <span className="font-bold text-primary block">{rateBasis}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Amount Paid</span>
              <span className="font-mono font-bold text-emerald-600 block">₹{(amountPaid || 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Amount Due</span>
              <span className="font-mono font-bold text-rose-600 block">₹{(amountDue || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Main Content: Items Table (Left) + Summary & GST Slab (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left: Cart Items Table */}
            <div className="lg:col-span-8 overflow-x-auto rounded-xl border border-border bg-surface max-h-[380px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/80 text-[10px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
                    <th className="py-2 px-2.5">Product</th>
                    <th className="py-2 px-2 font-mono">Batch</th>
                    <th className="py-2 px-2 font-mono">Expiry</th>
                    <th className="py-2 px-2 font-mono text-center">Qty</th>
                    <th className="py-2 px-2 font-mono text-center">Free</th>
                    <th className="py-2 px-2 font-mono text-center">SCH%</th>
                    <th className="py-2 px-2 font-mono text-center">Disc%</th>
                    <th className="py-2 px-2 font-mono text-right">MRP</th>
                    <th className="py-2 px-2 font-mono">HSN</th>
                    <th className="py-2 px-2 font-mono text-center">GST%</th>
                    <th className="py-2 px-2 font-mono text-right">Rate</th>
                    <th className="py-2 px-2 font-mono text-center">CRate%</th>
                    <th className="py-2 px-2.5 font-mono text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {cart.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-hover/50">
                      <td className="py-2 px-2.5 font-bold text-text truncate max-w-[130px]">{item.name}</td>
                      <td className="py-2 px-2 font-mono text-[11px] text-text-muted">{item.batch || "-"}</td>
                      <td className="py-2 px-2 font-mono text-[11px] text-text-muted">{item.expiry || "-"}</td>
                      <td className="py-2 px-2 font-mono text-center font-bold text-text">{item.qty}</td>
                      <td className="py-2 px-2 font-mono text-center text-text-muted">{item.freeQty || 0}</td>
                      <td className="py-2 px-2 font-mono text-center text-text">{item.schPct || 0}%</td>
                      <td className="py-2 px-2 font-mono text-center text-text">{item.disc || 0}%</td>
                      <td className="py-2 px-2 font-mono text-right text-text">₹{Number(item.mrp || 0).toFixed(2)}</td>
                      <td className="py-2 px-2 font-mono text-[11px] text-text-muted">{item.hsn || "-"}</td>
                      <td className="py-2 px-2 font-mono text-center font-bold text-purple-600">{item.gst ?? 0}%</td>
                      <td className="py-2 px-2 font-mono text-right font-bold text-text">₹{Number((rateBasis === "PTR" ? (item.rateB || item.rate) : (item.rateA || item.rate)) || 0).toFixed(2)}</td>
                      <td className="py-2 px-2 font-mono text-center text-text">{item.cRatePct || 0}%</td>
                      <td className="py-2 px-2.5 font-mono text-right font-extrabold text-emerald-600">
                        ₹{getItemBaseAmount(item).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right: Bill Summary + GST Slab */}
            <div className="lg:col-span-4 space-y-4">
              {/* Bill Financial Summary */}
              <div className="space-y-2 flex flex-col justify-between bg-surface-alt/60 p-3.5 rounded-2xl border border-border">
                <span className="text-[11px] font-bold text-text uppercase tracking-wider block border-b border-border/60 pb-1">
                  Bill Financial Summary
                </span>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-text-muted">
                    <span>Gross Total:</span>
                    <span className="font-bold font-mono text-text">₹{cartGrossTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-text-muted ">
                    <span>Scheme Disc:</span>
                    <span className="font-bold font-mono">-₹{cartSchemeDiscount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-text-muted">
                    <span>Trade Disc:</span>
                    <span className="font-bold font-mono">-₹{cartTradeDiscount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-text-muted">
                    <span className="flex items-center gap-1.5">
                      Extra Disc:
                      <input
                        type="number"
                        step="0.1"
                        value={extraDiscountPct === 0 ? "" : extraDiscountPct}
                        onChange={(e) => setExtraDiscountPct(e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-12 text-center rounded-none border-0 border-b border-text-muted bg-transparent px-1 py-0.5 font-mono text-xs font-bold text-text outline-none focus:border-primary"
                      />
                      <span className="text-[10px] font-bold">%</span>
                    </span>
                    <span className="font-bold font-mono">
                      {extraDiscountAmt >= 0 ? "-" : "+"}₹{Math.abs(extraDiscountAmt).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-text font-semibold pt-1 border-t border-border/60">
                    <span>Taxable After Extra Disc:</span>
                    <span className="font-extrabold font-mono">₹{cartTaxableAfterExtra.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-purple-600">
                    <span>Est. GST Tax:</span>
                    <span className="font-bold font-mono">+₹{estTax.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-border flex justify-between items-center">
                    <span className="text-xs font-black text-text">Grand Total:</span>
                    <span className="text-lg font-black font-mono text-emerald-600">
                      ₹{cartGrandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* GST Tax Slab Breakdown */}
              <div className="space-y-1.5 flex flex-col justify-between bg-surface-alt/40 p-3 rounded-2xl border border-border">
                <span className="text-[11px] font-bold text-text uppercase tracking-wider block">
                  GST Tax Slab Breakdown
                </span>
                <div className="overflow-x-auto rounded-xl border border-border bg-surface">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-surface-alt/80 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        <th className="py-2 px-2.5">Slab</th>
                        <th className="py-2 px-2 font-mono text-right">Taxable</th>
                        <th className="py-2 px-2 font-mono text-right">CGST</th>
                        <th className="py-2 px-2 font-mono text-right">SGST</th>
                        <th className="py-2 px-2.5 font-mono text-right">Tax</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                      {getTaxSlabBreakdown().map((slab) => (
                        <tr key={slab.gstPct} className="hover:bg-surface-hover/50">
                          <td className="py-1.5 px-2.5 font-bold text-purple-600 font-sans">
                            {slab.gstPct}%
                          </td>
                          <td className="py-1.5 px-2 text-right font-medium text-text">
                            ₹{slab.taxable.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-right text-text-muted">
                            ₹{slab.cgstAmt.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-right text-text-muted">
                            ₹{slab.sgstAmt.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-bold text-emerald-600">
                            ₹{slab.totalTax.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </UIModalBody>

        <UIModalFooter className="flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <UIButton
              variant="outline"
              size="sm"
              onClick={handleRateCheck}
              className="flex-1 sm:flex-none font-bold text-xs"
            >
              Rate Check
            </UIButton>
            <UIButton
              variant="outline"
              size="sm"
              onClick={handleSchemeCheck}
              className="flex-1 sm:flex-none font-bold text-xs"
            >
              Scheme Check
            </UIButton>
          </div>
          <UIButton
            variant="primary"
            size="sm"
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto font-bold text-xs"
            rightIcon={<CheckCircle2 className="size-4" />}
          >
            {isSubmitting
              ? "Saving..."
              : billId
                ? `Update & Submit (₹${cartGrandTotal.toFixed(2)})`
                : `Confirm & Submit (₹${cartGrandTotal.toFixed(2)})`}
          </UIButton>
        </UIModalFooter>
      </UIModal>

      {/* Scheme Check Modal */}
      <PurchaseBillSchemeCheckModal
        isOpen={isSchemeCheckModalOpen}
        onClose={() => setIsSchemeCheckModalOpen(false)}
        items={cart}
        onApply={handleApplySchemeCheck}
      />

      {/* Rate Check Modal */}
      <PurchaseBillRateCheckModal
        isOpen={isRateCheckModalOpen}
        onClose={() => setIsRateCheckModalOpen(false)}
        items={cart}
        onApply={handleApplyRateCheck}
        purchaseBillNo={purchaseBillNo || "New Bill"}
        supplierName={selectedSupplier?.businessName || "Unknown Supplier"}
        purchaseBillDate={invoiceDate}
        initialRateBasis={rateBasis}
      />

      <QuickCreateProductModal
        open={isQuickCreateModalOpen}
        onClose={() => setIsQuickCreateModalOpen(false)}
        defaultName={quickCreateProductName}
        onSuccess={handleSelectWorkspaceProduct}
      />

      <QuickCreateSupplierModal
        open={isQuickCreateSupplierModalOpen}
        onClose={() => setIsQuickCreateSupplierModalOpen(false)}
        defaultName={quickCreateSupplierName}
        onSuccess={(newSupplier) => {
          setSelectedSupplier(newSupplier);
          setTimeout(() => {
            searchBarRef.current?.focus();
          }, 100);
        }}
      />
    </section>
  );
};

export default CreatePurchaseBillDesktopPage;
