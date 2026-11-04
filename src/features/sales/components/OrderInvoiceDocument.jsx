// src/features/sales/components/OrderInvoiceDocument.jsx

import React, { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";

/** Safe number parser */
const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

/** Format date string */
const formatDate = (raw) => {
  if (!raw) return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return String(raw);
  }
};

/** Format expiry (e.g. 2027-08 -> 08/27, or preserve 08/27) */
const formatExpiry = (exp) => {
  if (!exp) return "N/A";
  const str = String(exp).trim();
  if (str.includes("/")) return str;
  if (str.includes("-")) {
    const parts = str.split("-");
    if (parts.length >= 2) {
      const year = parts[0].length === 4 ? parts[0].slice(-2) : parts[0];
      const month = parts[1].padStart(2, "0");
      return `${month}/${year}`;
    }
  }
  return str;
};

const formatPaymentMode = (mode) => {
  if (!mode) return "CASH";
  const str = String(mode).trim();
  const lower = str.toLowerCase();
  if (lower === "creditnote" || lower === "credit_note" || lower === "credit note") return "CREDIT NOTE";
  if (lower === "cash") return "CASH";
  if (lower === "upi") return "UPI";
  if (lower === "card") return "CARD";
  if (lower === "credit") return "CREDIT (POST-PAY)";
  if (lower === "advance") return "ADVANCE DEPOSIT";
  if (lower === "split") return "SPLIT PAYMENT";
  return str.toUpperCase();
};

export const OrderInvoiceDocument = ({
  saleData,
  branch,
  company,
  className = "",
  showPaidStamp = true,
}) => {
  if (!saleData) return null;

  // ── Normalize Company & Branch Data ──────────────────────────────────────
  const companyName = company?.legalName || company?.name || "ANKW PHARMA RETAIL PRIVATE LIMITED";
  const branchName = branch?.name || company?.name || "Main Retail Hub";
  
  const branchAddress = useMemo(() => {
    const addr = branch?.address || company?.address;
    if (!addr) return "C-39, Basement, Block-5, Okhla Industrial Area-2, New Delhi Tughlakabad, South East Delhi-110020";
    const parts = [
      addr.addressLine1 || addr.line1 || addr.street,
      addr.addressLine2 || addr.line2,
      addr.city,
      addr.district,
      addr.state,
      addr.pincode || addr.zipCode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Okhla Industrial Area-2, New Delhi-110020";
  }, [branch, company]);

  const supplierGstin =
    branch?.license?.gstin ||
    branch?.gstin ||
    company?.gstin ||
    "07ABBCA6074H1ZP";

  const drugLicense =
    branch?.license?.drugLicense ||
    branch?.drugLicense ||
    company?.license?.drugLicense ||
    company?.drugLicense ||
    "RLF20DL2025000227, RLF21DL2025000227";

  const fssaiLicense =
    branch?.license?.fssai ||
    company?.license?.fssai ||
    company?.fssai ||
    "13325010000032";

  const cinNumber = company?.cin || "U47720MH2024PTC434474";

  const placeOfSupply = useMemo(() => {
    const state = branch?.address?.state || company?.address?.state || "Delhi";
    return state;
  }, [branch, company]);

  // ── Normalize Customer / Billed-To Data ──────────────────────────────────
  const customerObj = saleData.customer || saleData.customerId || {};
  const customerName =
    customerObj.name ||
    saleData.customerName ||
    saleData.b2cName ||
    "Walk-in Retail Customer";

  const patientName =
    saleData.patientName ||
    saleData.patient ||
    customerObj.patientName ||
    customerName;

  const customerPhone =
    customerObj.phone ||
    customerObj.mobile ||
    saleData.customerPhone ||
    saleData.mobile ||
    "";

  const customerAddress = useMemo(() => {
    const addr = customerObj.address;
    if (typeof addr === "string" && addr.trim()) return addr;
    if (addr && typeof addr === "object") {
      const parts = [addr.line1, addr.city, addr.state, addr.pincode].filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
    return customerPhone ? `Phone: +91 ${customerPhone}` : "Counter Sale / Walk-in Customer";
  }, [customerObj, customerPhone]);

  const customerGstin = customerObj.gstin || customerObj.gstNumber || saleData.customerGstin || null;
  const doctorObj = typeof saleData.doctorId === "object" && saleData.doctorId !== null ? saleData.doctorId : null;
  const rawDocName = doctorObj?.name || saleData.doctor || customerObj.doctor;
  const doctorName = rawDocName
    ? (/^Dr\.?\s*/i.test(rawDocName) ? rawDocName : `Dr. ${rawDocName}`)
    : "Dr. Satya Narayan";

  // ── Invoice Metadata ─────────────────────────────────────────────────────
  const invoiceNo = saleData.invoiceNo || "INV1925-01007034";
  const invoiceDate = formatDate(saleData.date || saleData.createdAt);
  const orderId = saleData.orderId || saleData._id?.slice(-8)?.toUpperCase() || invoiceNo.replace(/[^0-9]/g, "").slice(-8) || "20322451";
  const isB2B = saleData.billingMode === "B2B";
  const isPaid = saleData.status !== "Pending" && saleData.status !== "Cancelled" && saleData.creditStatus !== "PENDING";
  const isCredit = saleData.paymentMethod === "Credit" || saleData.creditStatus === "PENDING" || saleData.status === "Pending";

  // ── Normalize Items & Compute Accurate Columns (Manufacturer removed) ─────
  const rawItems = Array.isArray(saleData.items) ? saleData.items : [];

  const items = useMemo(() => {
    return rawItems.map((item, index) => {
      const qty = safeNum(item.qty || item.quantity, 1);
      const mrp = safeNum(item.mrp || item.price || item.unitPrice, 0);
      const unitRate = safeNum(item.price || item.rate || item.unitPrice, mrp);
      const grossTotal = mrp * qty;

      // Discount calculation
      let itemDisc = safeNum(item.disc || item.discount || item.itemDiscount, 0);
      let discAmount = 0;
      if (itemDisc > 0 && itemDisc <= 100 && !item.discAmount) {
        discAmount = (grossTotal * itemDisc) / 100;
      } else if (item.discAmount) {
        discAmount = safeNum(item.discAmount);
      } else if (mrp > unitRate) {
        discAmount = (mrp - unitRate) * qty;
      }

      // Add scheme discount if present
      const schemePct = safeNum(item.schemeDiscountPercent || item.schemePercent, 0);
      if (schemePct > 0) {
        discAmount += (grossTotal * schemePct) / 100;
      }

      const netTaxable = Math.max(0, grossTotal - discAmount);
      const gstPct = safeNum(item.gst || item.gstRate || item.taxRate, 12);
      const gstAmt = (netTaxable * gstPct) / 100;
      const finalAmt = isB2B ? netTaxable + gstAmt : grossTotal - discAmount;

      return {
        sr: index + 1,
        name: item.name || item.displayName || item.productName || "Pharma Product",
        hsn: item.hsn || item.hsnCode || "30049074",
        batch: item.batch || item.batchNo || "I404626",
        expiry: formatExpiry(item.expiry || item.expDate || item.expiryDate),
        mrp,
        qty,
        totalAmt: grossTotal,
        discount: discAmount,
        taxableAmt: netTaxable,
        gstPct,
        gstAmt,
        finalAmt,
      };
    });
  }, [rawItems, isB2B]);

  // ── Financial Totals ─────────────────────────────────────────────────────
  const totalGross = useMemo(() => {
    return items.reduce((sum, it) => sum + it.totalAmt, 0);
  }, [items]);

  const totalDiscount = useMemo(() => {
    const linesDisc = items.reduce((sum, it) => sum + it.discount, 0);
    const extraDisc = safeNum(saleData.extraDiscount || saleData.discount, 0);
    return Math.max(linesDisc, linesDisc + extraDisc);
  }, [items, saleData]);

  const totalTaxable = useMemo(() => {
    if (saleData.taxableAmount !== undefined && saleData.taxableAmount !== null) {
      return safeNum(saleData.taxableAmount);
    }
    return items.reduce((sum, it) => sum + it.taxableAmt, 0);
  }, [items, saleData]);

  const totalGst = useMemo(() => {
    if (saleData.tax !== undefined && saleData.tax !== null) {
      return safeNum(saleData.tax);
    }
    return items.reduce((sum, it) => sum + it.gstAmt, 0);
  }, [items, saleData]);

  const grandTotal = useMemo(() => {
    if (saleData.grandTotal !== undefined && saleData.grandTotal !== null) {
      return safeNum(saleData.grandTotal);
    }
    if (saleData.amount !== undefined && saleData.amount !== null) {
      return safeNum(saleData.amount);
    }
    return items.reduce((sum, it) => sum + it.finalAmt, 0);
  }, [saleData, items]);

  // ── Dynamic GST Slabs Breakdown ──────────────────────────────────────────
  const gstBreakdown = useMemo(() => {
    if (Array.isArray(saleData.gstSlabs) && saleData.gstSlabs.length > 0) {
      return saleData.gstSlabs.map((s) => ({
        rate: safeNum(s.gstPct || s.rate),
        taxable: safeNum(s.taxable || s.taxableAmount),
        cgst: safeNum(s.cgst, (safeNum(s.total || s.tax) / 2)),
        sgst: safeNum(s.sgst, (safeNum(s.total || s.tax) / 2)),
        totalTax: safeNum(s.total || s.tax),
      }));
    }

    const map = {};
    items.forEach((it) => {
      const r = it.gstPct;
      if (!map[r]) {
        map[r] = { rate: r, taxable: 0, totalTax: 0 };
      }
      map[r].taxable += it.taxableAmt;
      map[r].totalTax += it.gstAmt;
    });

    return Object.values(map).map((entry) => ({
      rate: entry.rate,
      taxable: entry.taxable,
      cgst: entry.totalTax / 2,
      sgst: entry.totalTax / 2,
      totalTax: entry.totalTax,
    }));
  }, [saleData.gstSlabs, items]);

  // ── UPI / Verification QR Payload ─────────────────────────────────────────
  const qrPayload = useMemo(() => {
    const upiTarget = saleData.paymentQr?.upiId || branch?.upiId || "pharmacy@upi";
    return `upi://pay?pa=${encodeURIComponent(upiTarget)}&pn=${encodeURIComponent(
      companyName
    )}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Invoice%20${encodeURIComponent(invoiceNo)}`;
  }, [saleData, branch, companyName, grandTotal, invoiceNo]);

  return (
    <div
      id="pharma-printable-invoice"
      className={`bg-white text-slate-900 font-sans p-6 sm:p-8 w-full max-w-[210mm] mx-auto text-[10.5px] leading-normal antialiased select-none print:select-text print:p-0 print:m-0 print:w-full print:max-w-none print:min-h-0 print:text-[10px] ${className}`}
      style={{
        boxSizing: "border-box",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════════
          1. TOP HEADER BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 gap-4">
          {/* Brand & Document Type */}
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-black text-lg tracking-tighter shrink-0 print:bg-teal-700">
              Rx
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-teal-800 uppercase">
                  {companyName.split(" ")[0]}
                </span>
                <span className="text-slate-400 font-light">|</span>
                <span className="text-base font-bold text-slate-800 uppercase tracking-wide">
                  {saleData.isReturn ? "Credit Note / Sales Return" : "Tax Invoice"}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Licensed Pharmaceutical Dispensary</p>
            </div>
          </div>

          {/* Invoice Number, Order ID & Date */}
          <div className="text-right text-[11px] font-semibold text-slate-700 space-y-0.5">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-slate-500 font-normal">{saleData.isReturn ? "Return Memo:" : "Invoice No:"}</span>
              <span className="font-mono font-bold text-slate-900">{invoiceNo}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-slate-500 font-normal">Order ID:</span>
              <span className="font-mono text-slate-800">{orderId}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-slate-500 font-normal">{saleData.isReturn ? "Return Date:" : "Invoice Date:"}</span>
              <span className="font-mono text-slate-900">{invoiceDate}</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            2. BILL FROM / ORDER PLACED BY / QR CODE (THREE COLUMNS)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-12 gap-3 py-3 border-b border-slate-300 text-[10px] leading-snug">
          {/* BILL FROM (5 cols) */}
          <div className="col-span-5 pr-2 border-r border-slate-200">
            <div className="font-extrabold uppercase text-[9px] tracking-wider text-slate-500 mb-1">
              B I L L &nbsp; F R O M
            </div>
            <div className="font-bold text-slate-900 text-[11px]">
              {companyName}
            </div>
            <p className="text-slate-600 mt-0.5 leading-relaxed">
              {branchAddress}
            </p>
            <div className="mt-2 space-y-0.5 text-slate-600">
              <p><span className="text-slate-500">Supplier GSTIN:</span> <span className="font-mono font-semibold text-slate-800">{supplierGstin}</span></p>
              <p><span className="text-slate-500">DL No:</span> <span className="font-mono text-slate-800">{drugLicense}</span></p>
              {fssaiLicense && (
                <p><span className="text-slate-500">FSSAI License:</span> <span className="font-mono text-slate-800">{fssaiLicense}</span></p>
              )}
              {cinNumber && (
                <p><span className="text-slate-500">CIN:</span> <span className="font-mono text-slate-800">{cinNumber}</span></p>
              )}
              <p><span className="text-slate-500">Place of Supply:</span> <span className="font-semibold text-slate-800">{placeOfSupply}</span></p>
            </div>
          </div>

          {/* ORDER PLACED BY & PATIENT (5 cols) */}
          <div className="col-span-5 px-2 border-r border-slate-200">
            <div className="font-extrabold uppercase text-[9px] tracking-wider text-slate-500 mb-1">
              ORDER PLACED BY: <span className="text-slate-900 font-bold">{customerName}</span>
            </div>
            <div className="font-extrabold uppercase text-[9px] tracking-wider text-slate-500 mb-1">
              PATIENT NAME: <span className="text-slate-900 font-bold">{patientName}</span>
            </div>
            <p className="text-slate-600 leading-relaxed mt-0.5">
              {customerAddress}
            </p>
            <div className="mt-2 space-y-0.5 text-slate-600">
              {customerGstin && (
                <p><span className="text-purple-700 font-bold">Party GSTIN:</span> <span className="font-mono font-bold text-slate-900">{customerGstin}</span></p>
              )}
              <p><span className="text-slate-500">Doctor:</span> <span className="font-semibold text-slate-800">{doctorName}</span></p>
              <p><span className="text-slate-500">Customer Mobile:</span> <span className="font-mono text-slate-800">{customerPhone || "Not specified"}</span></p>
              {isCredit && (
                <p className="text-rose-700 font-semibold">
                  Payment Due Date: {formatDate(saleData.creditDueDate || saleData.dueDate)}
                </p>
              )}
            </div>
          </div>

          {/* QR CODE & VERIFICATION (2 cols) */}
          <div className="col-span-2 flex flex-col items-center justify-center text-center pl-1">
            <div className="p-1.5 bg-white border border-slate-300 rounded shadow-2xs">
              <QRCodeSVG value={qrPayload} size={70} level="M" />
            </div>
            <span className="text-[8.5px] text-slate-500 font-medium mt-1.5 leading-tight">
              Scan QR to verify or pay via UPI
            </span>
            <span className="text-[7.5px] text-slate-400 mt-0.5">T&amp;C Apply*</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            3. ITEMS TABLE (FULL A4 WIDTH - MANUFACTURER REMOVED)
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="mt-3 overflow-hidden border border-slate-300 rounded-xs">
          <table className="w-full text-left border-collapse text-[9.5px]">
            <thead>
              <tr className="bg-sky-50/80 text-slate-800 border-b border-slate-300 font-bold text-[9px] uppercase tracking-tight print:bg-slate-100">
                <th className="py-1.5 px-2 text-center border-r border-slate-200 w-8">Sr.</th>
                <th className="py-1.5 px-3 border-r border-slate-200">Item Name</th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-center">HSN</th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-center font-bold">Batch No.</th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-center">Exp. Date</th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-right">MRP</th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-center">Qty</th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-right">Total Amt.</th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-right">Discount</th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-right">Taxable Amt.</th>
                <th className="py-1.5 px-1.5 border-r border-slate-200 text-center">GST%</th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-right">GST Amt.</th>
                <th className="py-1.5 px-3 text-right font-bold">Final Amt.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {items.map((it) => (
                <tr key={it.sr} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                  <td className="py-1.5 px-2 text-center border-r border-slate-200 font-medium text-slate-500">
                    {it.sr}
                  </td>
                  <td className="py-1.5 px-3 border-r border-slate-200 font-semibold text-slate-900">
                    {it.name}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono text-slate-600">
                    {it.hsn}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono font-bold text-slate-900 text-[10px]">
                    {it.batch}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono text-slate-600">
                    {it.expiry}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-200 text-right font-mono tabular-nums">
                    {it.mrp.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-200 text-center font-mono font-bold text-slate-900">
                    {it.qty}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-200 text-right font-mono tabular-nums text-slate-600">
                    {it.totalAmt.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-200 text-right font-mono tabular-nums text-emerald-700 font-medium">
                    {it.discount > 0 ? it.discount.toFixed(2) : "0.00"}
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-200 text-right font-mono tabular-nums font-medium text-slate-800">
                    {it.taxableAmt.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-1.5 border-r border-slate-200 text-center font-mono text-slate-600">
                    {it.gstPct}%
                  </td>
                  <td className="py-1.5 px-2 border-r border-slate-200 text-right font-mono tabular-nums text-slate-600">
                    {it.gstAmt.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-black text-slate-900 tabular-nums text-[10.5px]">
                    ₹{it.finalAmt.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4. BOTTOM SECTION: TAX SLABS & PAID STAMP (LEFT) + TOTALS (RIGHT)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4 mt-3 pt-3 border-t border-slate-300">
        {/* Left Side: Tax Breakdown & Stamp (7 cols) */}
        <div className="col-span-7 flex flex-col justify-between pr-2">
          <div>
            <div className="text-[9.5px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              GST Slab Summary
            </div>
            <table className="w-full text-[9px] border border-slate-300 border-collapse text-slate-700 font-mono">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                  <th className="py-1 px-2 text-left">Taxable Amt</th>
                  <th className="py-1 px-1.5 text-center">CGST</th>
                  <th className="py-1 px-1.5 text-center">SGST</th>
                  <th className="py-1 px-2 text-right">Total GST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {gstBreakdown.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-1 px-2 text-left">₹{row.taxable.toFixed(2)}</td>
                    <td className="py-1 px-1.5 text-center">
                      {(row.rate / 2)}% ({row.cgst.toFixed(2)})
                    </td>
                    <td className="py-1 px-1.5 text-center">
                      {(row.rate / 2)}% ({row.sgst.toFixed(2)})
                    </td>
                    <td className="py-1 px-2 text-right font-bold text-slate-900">
                      ₹{row.totalTax.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paid Stamp & Legal Disclaimer */}
          <div className="mt-3 flex items-center justify-between gap-4">
            {/* Authentic Stamp Seal */}
            {showPaidStamp && (
              <div className="shrink-0 select-none">
                {isCredit ? (
                  <div className="inline-block border-2 border-amber-600 text-amber-700 font-black uppercase text-xs px-3 py-1 rounded-sm rotate-[-8deg] tracking-widest bg-amber-50/50 print:bg-transparent">
                    ★ CREDIT BILL ★
                  </div>
                ) : isPaid ? (
                  <div
                    className="inline-flex items-center justify-center border-3 border-emerald-600 text-emerald-700 font-black uppercase text-base px-4 py-1 rounded-full tracking-widest bg-emerald-50/40 print:bg-transparent transform -rotate-10 shadow-2xs"
                    style={{
                      letterSpacing: "0.2em",
                      textShadow: "0 0 1px rgba(16, 185, 129, 0.2)",
                    }}
                  >
                    PAID
                  </div>
                ) : (
                  <div className="inline-block border-2 border-slate-500 text-slate-600 font-black uppercase text-xs px-3 py-1 rounded-sm rotate-[-8deg] tracking-wider">
                    PENDING
                  </div>
                )}
              </div>
            )}

            {/* Note text */}
            <div className="text-[8.5px] text-slate-500 space-y-0.5 leading-snug">
              <p className="font-semibold text-slate-600">
                Note: This is a computer generated invoice, signature not required.
              </p>
              <p>Returns accepted within 7 days with original invoice.</p>
              <p>Goods once sold cannot be returned without verified batch match.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Totals Summary (5 cols) */}
        <div className="col-span-5 pl-2 border-l border-slate-200 text-[10px]">
          <div className="space-y-1 font-mono text-slate-600">
            <div className="flex justify-between">
              <span className="font-sans text-slate-500">Total MRP Amount:</span>
              <span className="text-slate-800">₹{totalGross.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-emerald-700">
              <span className="font-sans">Discount Amount:</span>
              <span className="font-bold">-₹{totalDiscount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="font-sans text-slate-500">Taxable Amount:</span>
              <span className="text-slate-800">₹{totalTaxable.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-sans text-slate-500">GST (CGST + SGST):</span>
              <span className="text-slate-800">₹{totalGst.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-[9px] text-slate-500">
              <span className="font-sans">Packaging &amp; Handling:</span>
              <span>₹0.00</span>
            </div>

            <div className="flex justify-between text-[9px] text-slate-500">
              <span className="font-sans">Delivery Charges:</span>
              <span>₹0.00</span>
            </div>

            {saleData.roundOff !== undefined && saleData.roundOff !== 0 && (
              <div className="flex justify-between text-[9px] text-slate-500">
                <span className="font-sans">Round Off:</span>
                <span>{saleData.roundOff > 0 ? `+₹${saleData.roundOff.toFixed(2)}` : `-₹${Math.abs(saleData.roundOff).toFixed(2)}`}</span>
              </div>
            )}

            {safeNum(saleData.creditNoteTotal) > 0 && (
              <div className="flex justify-between text-[9.5px] text-indigo-700 font-semibold">
                <span className="font-sans">Credit Note Adjusted:</span>
                <span>-₹{safeNum(saleData.creditNoteTotal).toFixed(2)}</span>
              </div>
            )}

            {/* Payable Amount Highlight */}
            <div className="flex justify-between items-baseline pt-2 mt-1 border-t-2 border-slate-900 text-slate-900">
              <span className="font-sans font-extrabold text-xs uppercase tracking-tight">
                Payable Amount:
              </span>
              <span className="text-base font-black text-slate-900 tracking-tight">
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="mt-2.5 pt-2 border-t border-slate-200 bg-slate-50 p-2 rounded text-[9.5px] text-slate-700 font-sans print:bg-transparent print:p-0">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Payment Mode:</span>
              <span className="font-bold text-slate-900 uppercase">
                {saleData.paymentMethod || "Cash"}
              </span>
            </div>

            {/* Split breakdown or payment details */}
            {Array.isArray(saleData.payments) && saleData.payments.length > 0 && (
              <div className="mt-1 space-y-0.5 border-t border-slate-200/60 pt-1 font-mono text-[9px]">
                {saleData.payments.map((p, pIdx) => (
                  <div key={pIdx} className="flex justify-between text-slate-600">
                    <span>{formatPaymentMode(p.paymentType || p.mode)}:</span>
                    <span className="font-semibold text-slate-900">
                      ₹{safeNum(p.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Credit Notes Redeemed */}
            {Array.isArray(saleData.creditNoteAllocations) && saleData.creditNoteAllocations.length > 0 && (
              <div className="mt-1 pt-1 border-t border-slate-200/60 font-mono text-[8.5px] text-indigo-700">
                <span className="font-bold block text-[8px] uppercase tracking-wider text-indigo-800">Credit Notes Redeemed:</span>
                {saleData.creditNoteAllocations.map((cna, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{cna.creditNoteNumber || cna.creditNoteNo || "CN"}:</span>
                    <span className="font-bold">₹{safeNum(cna.amountApplied || cna.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Cash Tendered & Change */}
            {saleData.cashTendered > 0 && saleData.cashTendered >= grandTotal && (
              <div className="mt-1 pt-1 border-t border-slate-200/60 flex justify-between font-mono text-[8.5px] text-slate-500">
                <span>Tendered: ₹{safeNum(saleData.cashTendered).toFixed(2)}</span>
                <span>Change: ₹{safeNum(saleData.changeDue).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderInvoiceDocument;

