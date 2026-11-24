// src/features/purchases/utils/printDebitNote.js

const formatDate = (d) => {
  if (!d) return new Date().toLocaleDateString("en-IN");
  const parsed = new Date(d);
  return isNaN(parsed.getTime())
    ? String(d)
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const formatAddress = (addr) => {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  return [
    addr.addressLine1 || addr.street,
    addr.addressLine2,
    addr.city,
    addr.state,
    addr.pincode,
  ]
    .filter(Boolean)
    .join(", ");
};

/**
 * Open a clean, print-ready GST Section 34 Debit Note / Credit Note voucher window.
 * Supports both persisted PurchaseReturn records and pre-save drafts.
 */
export const printPurchaseReturnDebitNote = (
  purchaseReturn,
  options = {}
) => {
  if (!purchaseReturn) return false;

  const printWin = window.open("", "_blank", "width=900,height=700");
  if (!printWin) {
    alert("Please allow popups to print the Debit Note.");
    return false;
  }

  const supplier =
    purchaseReturn.supplierId && typeof purchaseReturn.supplierId === "object"
      ? purchaseReturn.supplierId
      : purchaseReturn.supplier && typeof purchaseReturn.supplier === "object"
      ? purchaseReturn.supplier
      : {};

  const supplierName =
    supplier.businessName ||
    supplier.name ||
    purchaseReturn.supplierName ||
    "Supplier";
  const supplierGst = supplier.gstNumber || purchaseReturn.supplierGst || "";
  const supplierDl = supplier.drugLicenseNumber || "";
  const supplierAddress = formatAddress(supplier.address);

  const branch =
    (purchaseReturn.branchId && typeof purchaseReturn.branchId === "object"
      ? purchaseReturn.branchId
      : options.originBranch) || {};
  const company =
    (purchaseReturn.companyId && typeof purchaseReturn.companyId === "object"
      ? purchaseReturn.companyId
      : options.originCompany) || {};

  const isInterBranch = Boolean(purchaseReturn.isInterBranch || purchaseReturn.sourceBranchId);
  const isCreditNote =
    options.mode === "CREDIT_NOTE" ||
    (!options.mode && purchaseReturn.settlementType === "CREDIT_NOTE");
  const docTitle = isCreditNote
    ? isInterBranch
      ? "INTER-BRANCH CREDIT NOTE / RETURN"
      : "SUPPLIER CREDIT NOTE / PURCHASE RETURN"
    : "GST DEBIT NOTE / PURCHASE RETURN";
  const docNo =
    (isCreditNote
      ? (purchaseReturn.creditNoteNo || purchaseReturn.debitNoteNo)
      : (purchaseReturn.debitNoteNo || purchaseReturn.creditNoteNo)) ||
    purchaseReturn.returnNo ||
    "DN-DRAFT";

  const items = Array.isArray(purchaseReturn.items) ? purchaseReturn.items : [];

  let computedTaxable = 0;
  let computedGst = 0;

  const itemsRowsHtml = items
    .map((item, idx) => {
      const qty = Number(item.returnQty || 0);
      const rate = Number(item.rate || 0);
      const disc = Number(item.discountPct || 0);
      const gstPct = Number(item.gstPct || 0);

      const lineGross = qty * rate;
      const lineTaxable =
        item.taxableAmount !== undefined
          ? Number(item.taxableAmount)
          : lineGross - lineGross * (disc / 100);
      const lineTax =
        item.totalGst !== undefined
          ? Number(item.totalGst)
          : (lineTaxable * gstPct) / 100;
      const lineTotal =
        item.totalAmount !== undefined
          ? Number(item.totalAmount)
          : lineTaxable + lineTax;

      computedTaxable += lineTaxable;
      computedGst += lineTax;

      return `
        <tr>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
          <td style="padding: 6px; border: 1px solid #ddd; font-weight: bold;">
            ${item.productName || item.name || "Product"}
            ${item.pack ? `<span style="font-size: 11px; font-weight: normal; color: #555;"> (${item.pack})</span>` : ""}
          </td>
          <td style="padding: 6px; border: 1px solid #ddd; font-family: monospace;">${String(item.batchNo || "-").replace(/\s*\[(EXPIRED|BROKEN|SCRAP|FRESH_RETURN|IN|INCOMING)\]/gi, "").trim() || "-"}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${item.expiry || "-"}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${qty}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-family: monospace;">₹${rate.toFixed(2)}</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${gstPct}%</td>
          <td style="padding: 6px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-family: monospace;">₹${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  const taxableSubtotal =
    purchaseReturn.taxableSubtotal !== undefined
      ? Number(purchaseReturn.taxableSubtotal)
      : computedTaxable;
  const totalGst =
    purchaseReturn.totalGst !== undefined
      ? Number(purchaseReturn.totalGst)
      : computedGst;
  const rawGrandTotal = taxableSubtotal + totalGst;
  const grandTotal =
    purchaseReturn.grandTotal !== undefined
      ? Number(purchaseReturn.grandTotal)
      : Math.round(rawGrandTotal);
  const roundOff =
    purchaseReturn.roundOff !== undefined
      ? Number(purchaseReturn.roundOff)
      : grandTotal - rawGrandTotal;

  const shipping = purchaseReturn.shippingDetails || {};
  const courierName = options.courierName ?? shipping.courierName ?? "";
  const trackingNo = options.trackingNo ?? shipping.trackingNo ?? "";
  const boxCount = options.boxCount ?? shipping.boxCount ?? 0;

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${isCreditNote ? "Credit Note" : "Debit Note"} #${docNo}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; color: #111; margin: 20px; }
          .header { border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; }
          .subtitle { font-size: 11px; color: #555; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
          .meta-box { border: 1px solid #ddd; border-radius: 4px; padding: 10px; }
          .meta-box h4 { margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; color: #666; }
          .dispatch-bar { border: 1px dashed #999; background: #fafafa; border-radius: 4px; padding: 8px 10px; margin-bottom: 14px; font-size: 11px; display: flex; flex-wrap: wrap; gap: 16px; }
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
              <div class="title">${docTitle}</div>
              <div class="subtitle">(Issued under Section 34 of the CGST Act, 2017)</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 14px; font-weight: bold; font-family: monospace;">#${docNo}</div>
              <div style="color: #666;">Date: ${formatDate(purchaseReturn.returnDate)}</div>
            </div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-box">
            <h4>Issued To (Supplier / Vendor)</h4>
            <div style="font-size: 13px; font-weight: bold;">${supplierName}</div>
            ${supplierGst ? `<div>GSTIN: <strong>${supplierGst}</strong></div>` : ""}
            ${supplierDl ? `<div>Drug License: ${supplierDl}</div>` : ""}
            ${supplierAddress ? `<div>${supplierAddress}</div>` : ""}
          </div>

          <div class="meta-box">
            <h4>Issued By (Buyer / Dispatch Facility)</h4>
            ${company.name || company.legalName ? `<div style="font-size: 11px; font-weight: 600; color: #444;">${company.name || company.legalName}</div>` : ""}
            <div style="font-size: 13px; font-weight: bold;">${branch.name || "Main Warehouse"}</div>
            ${purchaseReturn.returnNo ? `<div>Return Memo Ref: <strong>${purchaseReturn.returnNo}</strong></div>` : ""}
            <div>Motive: <strong>${purchaseReturn.returnMotive || "EXPIRED"}</strong></div>
            ${purchaseReturn.remarks ? `<div style="color: #666; font-size: 10px;">Remarks: ${purchaseReturn.remarks}</div>` : ""}
          </div>
        </div>

        ${
          courierName || trackingNo || boxCount > 0
            ? `<div class="dispatch-bar">
                ${boxCount > 0 ? `<span><strong>Packed Boxes:</strong> ${boxCount}</span>` : ""}
                ${courierName ? `<span><strong>Courier / Transport:</strong> ${courierName}</span>` : ""}
                ${trackingNo ? `<span><strong>LR / Tracking No:</strong> <span style="font-family: monospace;">${trackingNo}</span></span>` : ""}
              </div>`
            : ""
        }

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
            <span style="font-family: monospace;">₹${taxableSubtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Total GST (ITC Reversal):</span>
            <span style="font-family: monospace;">₹${totalGst.toFixed(2)}</span>
          </div>
          ${
            Math.abs(roundOff) >= 0.005
              ? `<div class="total-row"><span>Round Off:</span><span style="font-family: monospace;">₹${roundOff.toFixed(2)}</span></div>`
              : ""
          }
          <div class="total-row grand-total">
            <span>Total ${isCreditNote ? "Credit" : "Debit"} Amount:</span>
            <span style="font-family: monospace;">₹${grandTotal.toFixed(2)}</span>
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
  return true;
};

export default printPurchaseReturnDebitNote;

