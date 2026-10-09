// src/features/sales/components/SalesReceiptModal.jsx

import React from "react";
import {
  Printer,
  Download,
  CheckCircle2,
  Share2,
  FileText,
  Building2,
  Calendar,
  CreditCard,
  User,
  Briefcase,
  Store,
} from "lucide-react";
import { UIModal, UIButton, UIBadge } from "@/components/ui";

export const SalesReceiptModal = ({ isOpen, onClose, saleData }) => {
  if (!saleData) return null;

  const {
    invoiceNo = "TAX-INV-2026-0891",
    date: rawDate,
    createdAt: rawCreatedAt,
    customer = { name: "Walk-in Retail Customer", phone: "9876543210" },
    billingMode = "B2C",
    partyType = "retail",
    items = [],
    subtotal = 0,
    discount = 0,
    tax = 0,
    grandTotal = 0,
    paymentMethod = "Cash",
  } = saleData;

  const isB2B = billingMode === "B2B";

  const billDate = rawDate 
    ? new Date(rawDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-IN");

  const actualDate = rawCreatedAt 
    ? new Date(rawCreatedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const handlePrint = () => {
    window.print();
  };

  return (
    <UIModal isOpen={isOpen} onClose={onClose} size="2xl">
      <div className="font-sans">

        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-success-soft text-success flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text tracking-tight">
                  {isB2B ? "Tax Invoice Generated" : "Sale Completed"}
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isB2B
                    ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                    : "bg-success-soft text-success border border-success/20"
                }`}>
                  {isB2B ? "B2B Tax Invoice" : "B2C Retail"}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {invoiceNo} · {billDate}
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-success-soft text-success border border-success/25 text-xs font-bold uppercase tracking-wider">
            PAID &amp; ISSUED
          </span>
        </div>

        {/* ── Receipt Paper ── */}
        <div className="p-6 space-y-0 max-h-[65vh] overflow-y-auto print:p-0 print:max-h-none print:overflow-visible">
          <div id="pos-printable-receipt" className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm print:border-none print:shadow-none">

            {/* Receipt Store Header */}
            <div className="px-5 py-4 border-b border-border flex items-start justify-between bg-surface-alt/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-text tracking-tight">
                    PharmaERP Healthcare &amp; Chemist
                  </h3>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-surface border border-border rounded text-text-muted">
                    {isB2B ? "TAX INVOICE" : "RETAIL INVOICE"}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">DL No: 20B/1429 · GSTIN: 27AABCP1234F1Z9</p>
                <p className="text-[11px] text-text-muted">Main Branch, MG Road, Mumbai 400001</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-text text-sm">{invoiceNo}</span>
                <p className="text-[11px] text-text-muted mt-0.5">Bill Date: {billDate}</p>
                <p className="text-[10px] text-text-muted">Created: {actualDate}</p>
              </div>
            </div>

            {/* Customer & Payment Details */}
            <div className="grid grid-cols-2 gap-4 px-5 py-3.5 border-b border-border/70 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1 mb-1">
                  {isB2B
                    ? <><Building2 className="size-3 text-purple-600" /> B2B Party</>
                    : <><User className="size-3 text-primary" /> Customer</>}
                </span>
                <p className="font-bold text-text text-sm leading-tight">{customer.name}</p>
                {customer.gstin && (
                  <p className="text-purple-600 dark:text-purple-400 font-mono font-bold text-[11px] mt-0.5">
                    GSTIN: {customer.gstin}
                  </p>
                )}
                {customer.dlNo && <p className="text-text-muted font-mono text-[11px]">DL: {customer.dlNo}</p>}
                {customer.phone && <p className="text-text-muted font-mono text-[11px]">{customer.phone}</p>}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center justify-end gap-1 mb-1">
                  <CreditCard className="size-3" /> Payment
                </span>
                <p className="font-bold text-text text-sm leading-tight">{paymentMethod}</p>
                <p className="text-[11px] text-text-muted mt-0.5">Ref: {invoiceNo}-TXN</p>
                {isB2B && customer.paymentTerms && (
                  <p className="text-success font-semibold text-[11px]">{customer.paymentTerms}</p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-[10.5px] font-bold text-text-muted uppercase tracking-wider bg-surface-alt/60">
                    <th className="px-5 py-2.5">Item Name &amp; Brand</th>
                    <th className="px-3 py-2.5">HSN / Batch</th>
                    <th className="px-3 py-2.5 text-right">Qty</th>
                    <th className="px-3 py-2.5 text-right">Rate</th>
                    <th className="px-5 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-5 py-2.5">
                        <span className="font-bold text-text block">{item.name}</span>
                        <span className="text-[10px] text-text-muted">{item.brand}</span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-text-muted text-[10.5px]">
                        {item.hsn || "300490"} · {item.batch}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-right text-text tabular-nums">{item.qty}</td>
                      <td className="px-3 py-2.5 font-mono text-right text-text tabular-nums">₹{item.price?.toFixed(2)}</td>
                      <td className="px-5 py-2.5 font-mono font-bold text-right text-text tabular-nums">
                        ₹{(item.qty * item.price)?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="px-5 py-4 border-t border-border/60 space-y-1 font-mono text-xs bg-surface-alt/30">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span>
                <span>₹{Number(subtotal).toFixed(2)}</span>
              </div>
              {saleData.schemeDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Scheme Discount</span>
                  <span>-₹{Number(saleData.schemeDiscount).toFixed(2)}</span>
                </div>
              )}
              {saleData.extraDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Extra Discount</span>
                  <span>-₹{Number(saleData.extraDiscount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-text-muted pt-1.5 border-t border-border/40">
                <span>Taxable Amount</span>
                <span>₹{Number(saleData.taxableAmount || (grandTotal - tax)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-purple-600 dark:text-purple-400">
                <span>GST Tax</span>
                <span>₹{Number(tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-text pt-2 border-t border-border">
                <span>Grand Total</span>
                <span className="text-primary font-mono text-base">₹{Number(grandTotal).toFixed(2)}</span>
              </div>
            </div>

            {/* GST Slab Breakdown */}
            {Array.isArray(saleData.gstSlabs) && saleData.gstSlabs.length > 0 && (
              <div className="px-5 py-3.5 border-t border-border/60 space-y-2 bg-surface-alt/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">GST Slab Breakdown</span>
                <table className="w-full text-left font-mono text-[10.5px] border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-text-muted">
                      <th className="py-1">Rate</th>
                      <th className="py-1 text-right">Taxable</th>
                      <th className="py-1 text-right">CGST</th>
                      <th className="py-1 text-right">SGST</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {saleData.gstSlabs.map((s) => (
                      <tr key={s.gstPct}>
                        <td className="py-1.5 font-bold text-purple-600 dark:text-purple-400">{s.gstPct}%</td>
                        <td className="py-1.5 text-right text-text">₹{s.taxable?.toFixed(2)}</td>
                        <td className="py-1.5 text-right text-text">₹{s.cgst?.toFixed(2)}</td>
                        <td className="py-1.5 text-right text-text">₹{s.sgst?.toFixed(2)}</td>
                        <td className="py-1.5 text-right font-bold text-text">₹{s.total?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Note */}
            <div className="px-5 py-3 border-t border-border/60 bg-surface-alt/30 text-center">
              <p className="text-[10.5px] text-text-muted font-medium">Thank you for your purchase! · Returns accepted within 7 days with original receipt.</p>
            </div>
          </div>
        </div>

        {/* ── Action Bar ── */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 bg-surface-alt/40 print:hidden">
          <UIButton variant="outline" size="sm" onClick={onClose}>
            New Sale
          </UIButton>

          <div className="flex items-center gap-2">
            <UIButton
              variant="outline"
              size="sm"
              onClick={handlePrint}
              startIcon={<Printer className="size-4" />}
            >
              Print {isB2B ? "Tax Invoice" : "Receipt"}
            </UIButton>

            <UIButton
              variant="primary"
              size="sm"
              onClick={onClose}
              startIcon={<FileText className="size-4" />}
            >
              Done &amp; Save
            </UIButton>
          </div>
        </div>
      </div>
    </UIModal>
  );
};

export default SalesReceiptModal;

