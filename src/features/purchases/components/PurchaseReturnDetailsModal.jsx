// src/features/purchases/components/PurchaseReturnDetailsModal.jsx

import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Printer,
  X,
  Building2,
  Truck,
  Calendar,
  Receipt,
  ShieldCheck,
  Package,
  Boxes,
  FileText,
  ArrowRight,
} from "lucide-react";
import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
  UIInfoCard,
  UISummaryCard,
  UIButton,
  UIIconButton,
  UIBadge,
  UIStatusIndicator,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
} from "@/components/ui";
import { ReturnBoxLabelModal } from "./ReturnBoxLabelModal";
import useBranch from "@/features/branch/hooks/useBranch";
import { ROUTES } from "@/constants";

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
  const navigate = useNavigate();
  const { currentBranch } = useBranch();
  const [showBoxLabelModal, setShowBoxLabelModal] = useState(false);

  if (!isOpen || !purchaseReturn) return null;

  const handleTransferToBranch = () => {
    if (!purchaseReturn) return;
    const items = purchaseReturn.items || [];
    const supplier = purchaseReturn.supplierId || {};

    navigate(ROUTES.CREATE_TRANSFER_ORDER, {
      state: {
        transferType: purchaseReturn.returnMotive === "SELLABLE" ? "STANDARD" : "SCRAP",
        sourceBranchId: purchaseReturn.branchId?._id || currentBranch?._id,
        prefilledItems: items.map((item) => ({
          product: item.productId?._id || item.productId,
          productName: item.productName,
          batch: item.batchId?._id || item.batchId,
          batchNo: item.batchNo,
          originalBatchNo: item.batchNo,
          transferQty: item.returnQty,
          availableQty: item.returnQty,
          scrapType: item.sourceBin?.includes("BROKEN") ? "BROKEN" : "EXPIRED",
          isScrap: item.sourceBin !== "SELLABLE",
        })),
        remarks: `Inter-branch transfer of Debit Note #${purchaseReturn.debitNoteNo || purchaseReturn.returnNo} for supplier ${supplier.businessName || ""}`,
      },
    });
    onClose();
  };

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
    <>
      <UIModal isOpen={isOpen} onClose={onClose} size="xl">
      <UIModalHeader className="border-b border-border pb-4">
        <div className="flex items-center justify-between w-full pr-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <UIModalTitle className="text-lg font-bold text-text">
                Debit Note #{purchaseReturn.debitNoteNo || purchaseReturn.returnNo}
              </UIModalTitle>
              <UIStatusIndicator
                status={
                  purchaseReturn.status === "CONFIRMED"
                    ? "success"
                    : purchaseReturn.status === "CANCELLED"
                    ? "error"
                    : "draft"
                }
                label={purchaseReturn.status}
                variant="badge"
                size="xs"
              />
              <UIBadge
                variant="soft"
                color={
                  purchaseReturn.returnMotive === "SELLABLE"
                    ? "primary"
                    : "warning"
                }
              >
                {purchaseReturn.returnMotive}
              </UIBadge>
            </div>
            <UIModalDescription className="text-xs text-text-muted">
              Issued on {formatDate(purchaseReturn.returnDate)} • Reference Memo: {purchaseReturn.returnNo}
            </UIModalDescription>
          </div>
        </div>
      </UIModalHeader>

      <UIModalBody className="space-y-5 py-5 max-h-[75vh] overflow-y-auto">
        {/* Info Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UIInfoCard
            title={supplier.businessName || "Supplier"}
            description="Creditor Details"
            icon={<Truck className="size-4.5" />}
            color="primary"
            variant="accent"
            items={[
              { label: "GSTIN", value: supplier.gstNumber || "Unregistered" },
              { label: "Phone", value: supplier.mobile || "—" },
              { label: "Drug License", value: supplier.drugLicenseNumber || "—" },
            ]}
          />

          <UIInfoCard
            title={branch.name || "Main Warehouse"}
            description="Dispatch Facility & Accounting"
            icon={<Building2 className="size-4.5" />}
            color="success"
            variant="accent"
            items={[
              { label: "Settlement Status", value: purchaseReturn.settlementStatus || "PENDING" },
              { label: "Remarks", value: purchaseReturn.remarks || "No remarks" },
            ]}
          />
        </div>

        {/* Line Items Table */}
        <div className="border border-border rounded-2xl overflow-hidden shadow-xs">
          <UITable>
            <UITableHeader>
              <UITableRow className="bg-surface-alt/60">
                <UITableHead className="py-2.5 px-3 text-center text-[11px] uppercase font-semibold text-text-muted w-10">
                  #
                </UITableHead>
                <UITableHead className="py-2.5 px-3 text-[11px] uppercase font-semibold text-text-muted">
                  Medicine & Pack
                </UITableHead>
                <UITableHead className="py-2.5 px-3 text-[11px] uppercase font-semibold text-text-muted font-mono">
                  Batch
                </UITableHead>
                <UITableHead className="py-2.5 px-3 text-center text-[11px] uppercase font-semibold text-text-muted">
                  Expiry
                </UITableHead>
                <UITableHead className="py-2.5 px-3 text-center text-[11px] uppercase font-semibold text-text-muted">
                  Qty
                </UITableHead>
                <UITableHead className="py-2.5 px-3 text-right text-[11px] uppercase font-semibold text-text-muted">
                  Rate
                </UITableHead>
                <UITableHead className="py-2.5 px-3 text-right text-[11px] uppercase font-semibold text-text-muted">
                  GST %
                </UITableHead>
                <UITableHead className="py-2.5 px-3 text-right text-[11px] uppercase font-semibold text-text-muted">
                  Amount
                </UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {(purchaseReturn.items || []).map((item, idx) => (
                <UITableRow key={idx} className="hover:bg-surface-hover transition-colors">
                  <td className="py-2.5 px-3 text-center text-text-muted font-medium text-xs">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-text text-xs">
                    {item.productName}
                    {item.pack && (
                      <span className="block text-[11px] text-text-muted font-normal">
                        {item.pack}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-medium text-xs">
                    {item.batchNo}
                  </td>
                  <td className="py-2.5 px-3 text-center text-text-muted text-xs">
                    {item.expiry || "-"}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-xs">
                    {item.returnQty}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-xs">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-text-muted text-xs">
                    {item.gstPct}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-text text-xs">
                    {formatCurrency(item.totalAmount)}
                  </td>
                </UITableRow>
              ))}
            </UITableBody>
          </UITable>
        </div>

        {/* Financial Calculation Breakdown */}
        <div className="flex justify-end">
          <div className="w-80">
            <UISummaryCard
              title="Debit Note Summary"
              items={[
                {
                  label: "Taxable Subtotal",
                  value: formatCurrency(purchaseReturn.taxableSubtotal),
                },
                {
                  label: "Total GST (ITC Reversal)",
                  value: formatCurrency(purchaseReturn.totalGst),
                  isDeduction: true,
                },
                ...(purchaseReturn.roundOff
                  ? [
                      {
                        label: "Round Off",
                        value: formatCurrency(purchaseReturn.roundOff),
                      },
                    ]
                  : []),
              ]}
              total={{
                label: "Grand Total Debit",
                value: formatCurrency(purchaseReturn.grandTotal),
              }}
              variant="compact"
            />
          </div>
        </div>
      </UIModalBody>

      <UIModalFooter className="border-t border-border pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <UIButton
              variant="outline"
              size="sm"
              onClick={handleTransferToBranch}
              startIcon={<Truck className="size-4 text-primary" />}
              className="font-medium"
            >
              Transfer to Other Branch
            </UIButton>

            <UIButton
              variant="outline"
              size="sm"
              onClick={() => setShowBoxLabelModal(true)}
              startIcon={<Package className="size-4 text-primary" />}
              className="font-medium"
            >
              Transport Label
            </UIButton>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <UIButton variant="outline" size="sm" onClick={onClose}>
              Close
            </UIButton>
            <UIButton
              variant="primary"
              size="sm"
              onClick={handlePrint}
              startIcon={<Printer className="size-4" />}
              className="font-bold shadow-xs"
            >
              Print Debit Note Voucher
            </UIButton>
          </div>
        </div>
      </UIModalFooter>
    </UIModal>

    {/* Transport Box Labels Generator Modal */}
    {showBoxLabelModal && (
      <ReturnBoxLabelModal
        isOpen={showBoxLabelModal}
        onClose={() => setShowBoxLabelModal(false)}
        returnRecord={purchaseReturn}
      />
    )}
  </>
  );
};

export default PurchaseReturnDetailsModal;
