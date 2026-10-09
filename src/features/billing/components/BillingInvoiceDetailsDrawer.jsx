import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  CreditCard,
  User,
  Trash2,
  Tag,
  MapPin,
  Clock,
  ShieldCheck,
  Edit2,
} from "lucide-react";
import { UIModal, UIButton, UIBadge } from "@/components/ui";
import { PermissionGate } from "@/components/common/PermissionGate";

export const BillingInvoiceDetailsDrawer = ({
  invoice,
  isOpen,
  onClose,
  onMarkPaid,
  onCancelInvoice,
}) => {
  const navigate = useNavigate();
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return <UIBadge variant="soft" intent="success">Paid</UIBadge>;
      case "Pending":
        return <UIBadge variant="soft" intent="warning">Pending</UIBadge>;
      case "Overdue":
        return <UIBadge variant="soft" intent="error">Overdue</UIBadge>;
      case "Cancelled":
        return <UIBadge variant="soft" intent="error">Cancelled</UIBadge>;
      default:
        return <UIBadge variant="soft" intent="info">{status}</UIBadge>;
    }
  };

  const isB2B = invoice.billingMode === "B2B";
  const items = Array.isArray(invoice.items) ? invoice.items : [];

  return (
    <UIModal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6 font-sans space-y-5 max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-bold">
              <FileText className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text">{invoice.invoiceNo}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isB2B
                      ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                      : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  }`}
                >
                  {isB2B ? "B2B TAX INVOICE" : "B2C RETAIL SALE"}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Issue Date: {invoice.issueDate} • Due Date: {invoice.dueDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(invoice.status)}
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-surface-alt/50 border border-border/70 text-xs">
          <div>
            <span className="text-[10.5px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <User className="size-3 text-primary" /> Customer Info
            </span>
            <p className="font-bold text-text text-sm mt-0.5">{invoice.customer}</p>
            <p className="text-text-muted font-mono">{invoice.phone}</p>
          </div>

          <div>
            <span className="text-[10.5px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Building2 className="size-3 text-purple-600" /> Branch & Facility
            </span>
            <p className="font-bold text-text mt-0.5">{invoice.branchName || "Main Branch"}</p>
            <p className="text-text-muted font-mono text-[11px]">ID: {invoice.branchId || "N/A"}</p>
          </div>

          <div>
            <span className="text-[10.5px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-600" /> Billed By (Creator)
            </span>
            <p className="font-bold text-text mt-0.5">
              {invoice.createdByName
                ? (invoice.createdByName.includes("@") ? invoice.createdByName.split("@")[0] : invoice.createdByName)
                : "System User"}
            </p>
            <p className="text-text-muted font-mono text-[11px] truncate">
              {invoice.createdByEmail || invoice.paymentMode}
            </p>
          </div>
        </div>

        {/* Medicine Line Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-text-muted">
              Purchased Line Items ({items.length})
            </h3>
            <span className="text-xs text-text-muted font-mono">Payment Method: <strong>{invoice.paymentMode}</strong></span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-surface-alt/20">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-alt/70 text-[10.5px] font-bold text-text-muted uppercase">
                  <th className="py-2.5 px-3">Item Name & Brand</th>
                  <th className="py-2.5 px-2 font-mono">Batch</th>
                  <th className="py-2.5 px-2 font-mono">HSN</th>
                  <th className="py-2.5 px-2 font-mono">Expiry</th>
                  <th className="py-2.5 px-2 font-mono text-center">GST %</th>
                  <th className="py-2.5 px-2 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.length > 0 ? (
                  items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-surface-hover/50">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-text block">{item.name}</span>
                        <span className="text-[10px] text-text-muted">{item.brand || "Pharma"} • {item.category || "Medicine"}</span>
                      </td>
                      <td className="py-2.5 px-2 font-mono text-[11px] text-text-muted font-semibold">{item.batch || "N/A"}</td>
                      <td className="py-2.5 px-2 font-mono text-[11px] text-text-muted">{item.hsn || "3004"}</td>
                      <td className="py-2.5 px-2 font-mono text-[11px] text-text-muted">{item.expiry || "N/A"}</td>
                      <td className="py-2.5 px-2 font-mono text-center font-bold text-purple-600">{item.gst || 5}%</td>
                      <td className="py-2.5 px-2 font-mono text-right font-bold text-text tabular-nums">{item.qty}</td>
                      <td className="py-2.5 px-3 font-mono text-right text-text-muted tabular-nums">₹{Number(item.price || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-right text-primary tabular-nums">₹{(Number(item.qty || 1) * Number(item.price || 0)).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-text-muted">
                      No line items recorded for this invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic GST Tax Slab Breakdown Table */}
        {(() => {
          const gstSlabs = {};
          items.forEach((item) => {
            const gstRate = Number(item.gst) || 5;
            const lineSubtotal = Number(item.qty || 1) * Number(item.price || 0);
            const lineTax = (lineSubtotal * gstRate) / 100;
            if (!gstSlabs[gstRate]) {
              gstSlabs[gstRate] = { taxableAmount: 0, taxAmount: 0 };
            }
            gstSlabs[gstRate].taxableAmount += lineSubtotal;
            gstSlabs[gstRate].taxAmount += lineTax;
          });

          const slabEntries = Object.entries(gstSlabs);
          if (slabEntries.length === 0) return null;

          return (
            <div className="space-y-1.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-text-muted">
                GST Tax Slab Breakdown
              </h3>
              <div className="overflow-x-auto rounded-xl border border-border bg-surface-alt/30">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-alt/70 text-[10.5px] font-bold text-text-muted uppercase">
                      <th className="py-2 px-3">GST Rate Slab</th>
                      <th className="py-2 px-3 text-right">Taxable Amount</th>
                      <th className="py-2 px-3 text-right font-mono">CGST</th>
                      <th className="py-2 px-3 text-right font-mono">SGST</th>
                      <th className="py-2 px-3 text-right">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {slabEntries.map(([rate, data]) => {
                      const halfTax = data.taxAmount / 2;
                      return (
                        <tr key={rate} className="hover:bg-surface-hover/30">
                          <td className="py-2 px-3 font-bold text-purple-600">{rate}% Slab</td>
                          <td className="py-2 px-3 text-right font-mono text-text">₹{data.taxableAmount.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-mono text-text-muted">₹{halfTax.toFixed(2)} ({Number(rate) / 2}%)</td>
                          <td className="py-2 px-3 text-right font-mono text-text-muted">₹{halfTax.toFixed(2)} ({Number(rate) / 2}%)</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-purple-600">₹{data.taxAmount.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Calculation Summary Box */}
        <div className="p-4 rounded-xl border border-border bg-surface-alt/40 space-y-2 text-xs font-mono">
          <div className="flex justify-between text-text">
            <span className="text-text-muted font-sans font-medium">Subtotal Amount:</span>
            <span className="font-bold">₹{Number(invoice.subtotal || invoice.amount || 0).toFixed(2)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span className="font-sans font-medium">Total Discount Applied:</span>
              <span>-₹{Number(invoice.discount || 0).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-purple-600 dark:text-purple-400">
            <span className="font-sans font-medium">GST Tax Included:</span>
            <span>₹{Number(invoice.tax || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-extrabold text-text pt-2 border-t border-border">
            <span className="font-sans">Grand Total:</span>
            <span className="text-primary font-mono text-base">₹{Number(invoice.amount || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <UIButton
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="size-4" />}
            >
              Print Invoice
            </UIButton>

            {invoice.status !== "Cancelled" && (
              <PermissionGate permission="bill:update">
                <UIButton
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/sales", { state: { invoice } })}
                  leftIcon={<Edit2 className="size-4" />}
                >
                  Edit Bill
                </UIButton>
              </PermissionGate>
            )}

            {invoice.status !== "Cancelled" && (
              <PermissionGate permission="bill:delete">
                <UIButton
                  variant="outline"
                  size="sm"
                  onClick={() => onCancelInvoice(invoice.id)}
                  className="text-error hover:bg-error-soft hover:border-error/30"
                  leftIcon={<Trash2 className="size-4" />}
                >
                  Cancel Bill
                </UIButton>
              </PermissionGate>
            )}
          </div>

          <div className="flex items-center gap-2">
            {invoice.status !== "Paid" && invoice.status !== "Cancelled" && (
              <PermissionGate permission="bill:update">
                <UIButton
                  variant="primary"
                  size="sm"
                  onClick={() => onMarkPaid(invoice.id)}
                  leftIcon={<CheckCircle2 className="size-4" />}
                >
                  Mark as Paid
                </UIButton>
              </PermissionGate>
            )}

            <UIButton variant="outline" size="sm" onClick={onClose}>
              Close
            </UIButton>
          </div>
        </div>
      </div>
    </UIModal>
  );
};

export default BillingInvoiceDetailsDrawer;
