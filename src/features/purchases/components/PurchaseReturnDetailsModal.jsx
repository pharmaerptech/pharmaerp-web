// src/features/purchases/components/PurchaseReturnDetailsModal.jsx

import React, { useRef } from "react";
import {
  Printer,
  X,
  Building2,
  Truck,
  Calendar,
  Receipt,
  ShieldCheck,
  Package,
} from "lucide-react";
import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIButton,
  UIBadge,
} from "@/components/ui";

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const PurchaseReturnDetailsModal = ({
  isOpen,
  onClose,
  purchaseReturn,
}) => {
  const printAreaRef = useRef(null);

  if (!isOpen || !purchaseReturn) return null;

  const handlePrint = () => {
    const printWin = window.open("", "_blank", "width=900,height=700");
    if (!printWin) return;

    const supplier = purchaseReturn.supplierId || {};
    const branch = purchaseReturn.branchId || {};

    const itemsRowsHtml = (purchaseReturn.items || [])
      .map(
        (item, idx) => `
        <tr>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
          <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold;">
            ${item.productName || "Product"}
            ${item.pack ? `<span style="font-size: 11px; font-weight: normal; color: #555;"> (${item.pack})</span>` : ""}
          </td>
          <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace;">${item.batchNo}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${item.expiry || "-"}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${item.returnQty}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">₹${Number(item.rate || 0).toFixed(2)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${item.gstPct || 0}%</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-family: monospace;">₹${Number(item.totalAmount || 0).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Debit Note #${purchaseReturn.debitNoteNo || purchaseReturn.returnNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; color: #111; margin: 20px; }
            .header { border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
            .title { font-size: 18px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; }
            .subtitle { font-size: 11px; color: #555; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
            .meta-box { border: 1px solid #ddd; border-radius: 4px; padding: 10px; }
            .meta-box h4 { margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th { background: #f4f4f4; padding: 6px; border: 1px solid #ddd; text-align: left; }
            .totals { margin-top: 16px; float: right; width: 280px; }
            .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
            .grand-total { font-size: 14px; font-weight: bold; border-top: 2px solid #111; border-bottom: 2px solid #111; padding: 6px 0; margin-top: 6px; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div class="title">GST DEBIT NOTE / PURCHASE RETURN</div>
                <div class="subtitle">(Issued under Section 34 of the CGST Act, 2017)</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 14px; font-weight: bold; font-family: monospace;">#${purchaseReturn.debitNoteNo || purchaseReturn.returnNo}</div>
                <div style="color: #666;">Date: ${formatDate(purchaseReturn.returnDate)}</div>
              </div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-box">
              <h4>Issued To (Supplier / Vendor)</h4>
              <div style="font-size: 13px; font-weight: bold;">${supplier.businessName || "Supplier"}</div>
              ${supplier.gstNumber ? `<div>GSTIN: <strong>${supplier.gstNumber}</strong></div>` : ""}
              ${supplier.drugLicenseNumber ? `<div>Drug License: ${supplier.drugLicenseNumber}</div>` : ""}
              ${supplier.address?.addressLine1 ? `<div>${supplier.address.addressLine1}, ${supplier.address.city || ""}</div>` : ""}
            </div>

            <div class="meta-box">
              <h4>Issued By (Buyer / Dispatch Facility)</h4>
              <div style="font-size: 13px; font-weight: bold;">${branch.name || "Main Warehouse"}</div>
              <div>Return Memo Ref: <strong>${purchaseReturn.returnNo}</strong></div>
              <div>Motive: <strong>${purchaseReturn.returnMotive}</strong></div>
              ${purchaseReturn.remarks ? `<div style="color: #666; font-size: 10px;">Remarks: ${purchaseReturn.remarks}</div>` : ""}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th>Medicine & Pack</th>
                <th>Batch</th>
                <th style="text-align: center;">Expiry</th>
                <th style="width: 50px; text-align: center;">Qty</th>
                <th style="width: 80px; text-align: right;">Purchase Rate</th>
                <th style="width: 50px; text-align: right;">GST %</th>
                <th style="width: 90px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Taxable Subtotal:</span>
              <span style="font-family: monospace;">₹${Number(purchaseReturn.taxableSubtotal || 0).toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Total GST (ITC Reversal):</span>
              <span style="font-family: monospace;">₹${Number(purchaseReturn.totalGst || 0).toFixed(2)}</span>
            </div>
            ${
              purchaseReturn.roundOff
                ? `<div class="total-row"><span>Round Off:</span><span style="font-family: monospace;">₹${Number(purchaseReturn.roundOff).toFixed(2)}</span></div>`
                : ""
            }
            <div class="total-row grand-total">
              <span>Total Debit Amount:</span>
              <span style="font-family: monospace;">₹${Number(purchaseReturn.grandTotal || 0).toFixed(2)}</span>
            </div>
          </div>

          <div style="clear: both; margin-top: 40px; padding-top: 20px; display: flex; justify-content: space-between; font-size: 11px;">
            <div>Prepared By: ___________________</div>
            <div>Authorised Signatory: ___________________</div>
          </div>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const supplier = purchaseReturn.supplierId || {};
  const branch = purchaseReturn.branchId || {};

  return (
    <UIModal open={isOpen} onOpenChange={onClose} size="3xl">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-text">
                Debit Note #{purchaseReturn.debitNoteNo || purchaseReturn.returnNo}
              </h2>
              <UIBadge
                variant={
                  purchaseReturn.status === "CONFIRMED"
                    ? "default"
                    : purchaseReturn.status === "CANCELLED"
                    ? "destructive"
                    : "secondary"
                }
              >
                {purchaseReturn.status}
              </UIBadge>
              <UIBadge variant="outline">
                {purchaseReturn.returnMotive}
              </UIBadge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Issued on {formatDate(purchaseReturn.returnDate)} • Memo: {purchaseReturn.returnNo}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <UIButton
              variant="outline"
              size="sm"
              onClick={handlePrint}
              startIcon={<Printer className="size-4" />}
            >
              Print Debit Note
            </UIButton>
            <UIButton variant="ghost" size="sm" onClick={onClose}>
              <X className="size-4" />
            </UIButton>
          </div>
        </div>

        {/* Metadata Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 border rounded-xl bg-surface/40 space-y-1">
            <div className="font-bold text-text-muted uppercase text-[10px]">
              Supplier Details
            </div>
            <div className="font-bold text-sm text-text">
              {supplier.businessName || "Supplier"}
            </div>
            {supplier.gstNumber && (
              <div className="text-text-muted">GSTIN: {supplier.gstNumber}</div>
            )}
            {supplier.mobile && (
              <div className="text-text-muted">Phone: {supplier.mobile}</div>
            )}
            {supplier.drugLicenseNumber && (
              <div className="text-text-muted">DL: {supplier.drugLicenseNumber}</div>
            )}
          </div>

          <div className="p-3.5 border rounded-xl bg-surface/40 space-y-1">
            <div className="font-bold text-text-muted uppercase text-[10px]">
              Facility & Accounting
            </div>
            <div className="font-bold text-sm text-text">
              {branch.name || "Main Warehouse"}
            </div>
            <div className="text-text-muted">
              Settlement Status: <strong className="text-text">{purchaseReturn.settlementStatus}</strong>
            </div>
            {purchaseReturn.remarks && (
              <div className="text-text-muted text-[11px] mt-1">
                Remarks: {purchaseReturn.remarks}
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="border rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left divide-y">
            <thead className="bg-surface/60 font-semibold text-text-muted uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 text-center">#</th>
                <th className="py-2.5 px-3">Medicine & Pack</th>
                <th className="py-2.5 px-3 font-mono">Batch</th>
                <th className="py-2.5 px-3 text-center">Expiry</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-right">GST %</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(purchaseReturn.items || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-surface/30">
                  <td className="py-2.5 px-3 text-center text-text-muted">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-text">
                    {item.productName}
                    {item.pack && (
                      <span className="block text-[11px] text-text-muted font-normal">
                        {item.pack}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium">
                    {item.batchNo}
                  </td>
                  <td className="py-2.5 px-3 text-center text-text-muted">
                    {item.expiry || "-"}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold">
                    {item.returnQty}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-text-muted">
                    {item.gstPct}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-text">
                    {formatCurrency(item.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-text-muted">
              <span>Taxable Subtotal:</span>
              <span className="font-mono font-medium text-text">
                {formatCurrency(purchaseReturn.taxableSubtotal)}
              </span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Total GST (ITC Reversal):</span>
              <span className="font-mono font-medium text-text">
                {formatCurrency(purchaseReturn.totalGst)}
              </span>
            </div>
            {purchaseReturn.roundOff !== 0 && (
              <div className="flex justify-between text-text-muted">
                <span>Round Off:</span>
                <span className="font-mono text-text">
                  {formatCurrency(purchaseReturn.roundOff)}
                </span>
              </div>
            )}
            <div className="pt-2 border-t flex justify-between items-baseline font-bold">
              <span className="text-sm text-text">Grand Total Debit:</span>
              <span className="text-lg font-black text-primary font-mono">
                {formatCurrency(purchaseReturn.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </UIModal>
  );
};

export default PurchaseReturnDetailsModal;

