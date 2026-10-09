// src/features/billing/pages/mobile/BillingMobilePage.jsx

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Receipt,
  Eye,
  CheckCircle2,
} from "lucide-react";
import {
  UICard,
  UIButton,
  UIBadge,
  UIStatCard,
} from "@/components/ui";
import { PermissionGate } from "@/components/common/PermissionGate";
import { cn } from "@/lib/utils";
import invoiceService from "@/features/sales/services/invoiceService";
import { BILLING_STATS, INVOICE_RECORDS } from "../../constants/billingData";
import { BillingCreateInvoiceModal } from "../../components/BillingCreateInvoiceModal";
import { BillingInvoiceDetailsDrawer } from "../../components/BillingInvoiceDetailsDrawer";

export const BillingMobilePage = () => {
  const [invoices, setInvoices] = useState(INVOICE_RECORDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const statusTabs = ["all", "Paid", "Pending", "Overdue"];

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" || inv.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, selectedStatus]);

  const handleCreateSuccess = (newInv) => {
    setInvoices([newInv, ...invoices]);
    setToastMessage(`✅ Invoice "${newInv.invoiceNo}" created.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMarkPaid = (invId) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invId
          ? { ...inv, status: "Paid", paidAmount: inv.amount, balance: 0 }
          : inv
      )
    );
    if (selectedInvoice && selectedInvoice.id === invId) {
      setSelectedInvoice((prev) => ({
        ...prev,
        status: "Paid",
        paidAmount: prev.amount,
        balance: 0,
      }));
    }
  };

  const handleCancelInvoice = (invId) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invId ? { ...inv, status: "Cancelled", balance: 0 } : inv
      )
    );
    if (selectedInvoice && selectedInvoice.id === invId) {
      setSelectedInvoice((prev) => ({ ...prev, status: "Cancelled", balance: 0 }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return <UIBadge variant="soft" intent="success">Paid</UIBadge>;
      case "Pending":
        return <UIBadge variant="soft" intent="warning">Pending</UIBadge>;
      case "Overdue":
        return <UIBadge variant="soft" intent="error">Overdue</UIBadge>;
      default:
        return <UIBadge variant="soft" intent="info">{status}</UIBadge>;
    }
  };

  return (
    <section className="min-h-[100dvh] w-full bg-bg px-3.5 pt-3 pb-24 font-sans space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-[9999] flex items-center gap-2 rounded-xl border border-primary/30 bg-surface/95 p-3 text-xs font-semibold text-text shadow-xl backdrop-blur-md">
          <CheckCircle2 className="size-4 text-primary shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-text tracking-tight">Billing & Invoices</h1>
          <p className="text-xs text-text-muted">{invoices.length} invoices recorded</p>
        </div>

        <PermissionGate permission="bill:create">
          <UIButton
            variant="primary"
            size="xs"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="size-3.5" />}
          >
            Create
          </UIButton>
        </PermissionGate>
      </div>

      {/* Mini Stats Carousel */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl border border-border bg-surface shadow-2xs">
          <p className="text-[11px] text-text-muted font-medium">Total Invoiced</p>
          <p className="text-base font-extrabold font-mono text-text mt-0.5">₹3,42,800</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-surface shadow-2xs">
          <p className="text-[11px] text-text-muted font-medium">Collected</p>
          <p className="text-base font-extrabold font-mono text-success mt-0.5">₹2,98,400</p>
        </div>
      </div>

      {/* Search and Status Chips */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoices..."
            className="w-full rounded-xl border border-border bg-surface-alt/70 pl-9 pr-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedStatus(tab)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap",
                selectedStatus === tab
                  ? "bg-primary text-primary-contrast shadow-2xs"
                  : "bg-surface-alt text-text-muted border border-border/70"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Card List */}
      <div className="space-y-2.5">
        {filteredInvoices.map((inv) => (
          <div
            key={inv.id}
            onClick={() => setSelectedInvoice(inv)}
            className="p-3.5 rounded-xl border border-border bg-surface shadow-2xs space-y-2 cursor-pointer hover:border-primary/40 active:scale-[0.99] transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono font-bold text-primary text-xs">{inv.invoiceNo}</span>
                <p className="font-bold text-xs text-text mt-0.5">{inv.customer}</p>
              </div>
              {getStatusBadge(inv.status)}
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
              <span className="text-text-muted text-[11px]">{inv.issueDate}</span>
              <span className="font-mono font-extrabold text-text">
                ₹{inv.amount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <BillingCreateInvoiceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreateSuccess}
      />

      {/* Details Drawer */}
      <BillingInvoiceDetailsDrawer
        invoice={selectedInvoice}
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        onMarkPaid={handleMarkPaid}
        onCancelInvoice={handleCancelInvoice}
      />
    </section>
  );
};

export default BillingMobilePage;
