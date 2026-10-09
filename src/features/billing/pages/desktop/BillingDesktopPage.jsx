// src/features/billing/pages/desktop/BillingDesktopPage.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Store,
} from "lucide-react";
import {
  UICard,
  UIButton,
  UIBadge,
  UIStatCard,
} from "@/components/ui";
import { PermissionGate } from "@/components/common/PermissionGate";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";

import invoiceService from "@/features/sales/services/invoiceService";
import { INVOICE_RECORDS } from "../../constants/billingData";
import { BillingCreateInvoiceModal } from "../../components/BillingCreateInvoiceModal";
import { BillingInvoiceDetailsDrawer } from "../../components/BillingInvoiceDetailsDrawer";

const statIconMap = {
  Receipt: <Receipt className="size-5" />,
  CheckCircle2: <CheckCircle2 className="size-5" />,
  Clock: <Clock className="size-5" />,
  AlertTriangle: <AlertTriangle className="size-5" />,
};

export const BillingDesktopPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);

  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    if (currentWorkspace) {
      fetchInvoicesFromBackend();
    }
  }, [currentPage, currentWorkspace]);

  const fetchInvoicesFromBackend = async () => {
    setIsLoading(true);
    try {
      const salesRes = await invoiceService.getAllCustomerSales({ page: currentPage, limit: 5 });
      const result = salesRes.data?.data || {};
      const salesData = result.data || [];
      const salesList = Array.isArray(salesData) ? salesData : [];

      if (result.meta && result.meta.total && result.meta.limit) {
        setTotalPages(Math.ceil(result.meta.total / result.meta.limit));
        setTotalInvoices(result.meta.total);
      }

      let allInvoices = [];
      salesList.forEach((s) => {
        allInvoices.push({
          id: s._id || s.id || `inv-${Date.now()}-${Math.random()}`,
          branchId: s.branchId || null,
          branchName: s.branchName || "Main Branch",
          invoiceNo: s.invoiceNo || `RET-INV-${Math.floor(1000 + Math.random() * 9000)}`,
          customer: s.customerName || "Walk-in Retail Customer",
          phone: s.customerPhone || "9876543210",
          doctor: s.doctor || "Dr. Self",
          issueDate: s.date ? new Date(s.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Today",
          dueDate: s.dueDate ? new Date(s.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Today",
          itemCount: Array.isArray(s.items) ? s.items.length : 1,
          amount: Number(s.grandTotal || s.totalAmount || s.subtotal || 0),
          subtotal: Number(s.subtotal || 0),
          discount: Number(s.discount || 0),
          tax: Number(s.tax || 0),
          paidAmount: Number(s.cashTendered || s.grandTotal || 0),
          balance: Math.max(0, Number(s.grandTotal || 0) - Number(s.cashTendered || s.grandTotal || 0)),
          status: s.status || "Paid",
          paymentMode: s.paymentMethod || s.paymentMode || "Cash",
          billingMode: s.billingMode || "B2C",
          createdByName: s.createdByName || (s.createdByEmail ? s.createdByEmail.split("@")[0] : "System User"),
          createdByEmail: s.createdByEmail || null,
          items: s.items || [],
          payments: s.payments || [],
          denominations: s.denominations || [],
          returnedDenominations: s.returnedDenominations || [],
        });
      });

      setInvoices(allInvoices);
    } catch (err) {
      console.warn("Backend invoices fetch error:", err);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const statusTabs = ["all", "Paid", "Pending", "Overdue", "Cancelled"];

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.phone.includes(searchQuery);

      const matchesStatus =
        selectedStatus === "all" || inv.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, selectedStatus]);

  const handleCreateSuccess = (newInv) => {
    setInvoices([newInv, ...invoices]);
    setToastMessage(`✅ Invoice "${newInv.invoiceNo}" created successfully.`);
    setTimeout(() => setToastMessage(null), 4000);
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
    setToastMessage("✅ Invoice marked as Paid.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCancelInvoice = async (invId) => {
    try {
      await invoiceService.cancelCustomerSale(invId);
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invId ? { ...inv, status: "Cancelled", balance: 0 } : inv
        )
      );
      if (selectedInvoice && selectedInvoice.id === invId) {
        setSelectedInvoice((prev) => ({ ...prev, status: "Cancelled", balance: 0 }));
      }
      setToastMessage("✅ Invoice cancelled successfully.");
    } catch (error) {
      console.error(error);
      setToastMessage("❌ Failed to cancel invoice.");
    }
    setTimeout(() => setToastMessage(null), 3000);
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

  return (
    <section className="min-h-[100dvh] w-full bg-bg px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Toast Notification */}
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

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              Invoices & Billing Hub
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              Track customer tax invoices, receivables, settlement statuses and payment history
            </p>
          </div>

          <div className="flex items-center gap-2">
            <UIButton
              variant="outline"
              size="md"
              onClick={() => navigate(ROUTES.POS_TERMINAL)}
              leftIcon={<Store className="size-4" />}
            >
              POS Terminal
            </UIButton>

            <UIButton
              variant="outline"
              size="md"
              disabled={isLoading}
              onClick={() => { setCurrentPage(1); fetchInvoicesFromBackend(); }}
              leftIcon={<RefreshCw className={cn("size-4", isLoading && "animate-spin text-primary")} />}
            >
              Refresh
            </UIButton>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2 mt-2">
              <UIButton
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              >
                ‹ Prev
              </UIButton>
              <span className="text-sm">Page {currentPage} of {totalPages}</span>
              <UIButton
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              >
                Next ›
              </UIButton>
            </div>

            <PermissionGate
              permission="bill:create"
              fallback={
                <UIButton variant="primary" size="md" disabled>
                  Create Invoice (Requires bill:create)
                </UIButton>
              }
            >
              <UIButton
                variant="primary"
                size="md"
                onClick={() => setIsCreateOpen(true)}
                leftIcon={<Plus className="size-4" />}
              >
                Create New Invoice
              </UIButton>
            </PermissionGate>
          </div>
        </div>

        {/* 4 Financial Stat Cards */}
        {(() => {
          const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);
          const collectedRevenue = invoices.filter(inv => inv.status === "Paid").reduce((acc, inv) => acc + (inv.amount || 0), 0);
          const pendingDues = invoices.filter(inv => inv.status === "Pending").reduce((acc, inv) => acc + (inv.amount || 0), 0);
          const overdueAmount = invoices.filter(inv => inv.status === "Overdue").reduce((acc, inv) => acc + (inv.amount || 0), 0);

          const liveStats = [
            {
              id: "total-invoiced",
              title: "Total Invoiced",
              value: `₹${totalInvoiced.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
              subtitle: `${invoices.length} invoices generated`,
              trend: { value: "Live sync", direction: "up", label: "Realtime" },
              color: "primary",
              iconName: "Receipt",
            },
            {
              id: "paid-collected",
              title: "Collected Revenue",
              value: `₹${collectedRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
              subtitle: `${invoices.filter(i => i.status === "Paid").length} settled bills`,
              trend: { value: "Paid", direction: "up", label: "Settled" },
              color: "success",
              iconName: "CheckCircle2",
            },
            {
              id: "pending-dues",
              title: "Pending Receivables",
              value: `₹${pendingDues.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
              subtitle: `${invoices.filter(i => i.status === "Pending").length} pending`,
              trend: { value: "Pending", direction: "down", label: "Unpaid" },
              color: "warning",
              iconName: "Clock",
            },
            {
              id: "overdue-amount",
              title: "Overdue Invoices",
              value: `₹${overdueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
              subtitle: `${invoices.filter(i => i.status === "Overdue").length} overdue`,
              trend: { value: "Overdue", direction: "down", label: "Action" },
              color: "error",
              iconName: "AlertTriangle",
            },
          ];

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {liveStats.map((stat) => (
                <UIStatCard
                  key={stat.id}
                  title={stat.title}
                  value={stat.value}
                  subtitle={stat.subtitle}
                  trend={stat.trend}
                  color={stat.color}
                  icon={statIconMap[stat.iconName]}
                />
              ))}
            </div>
          );
        })()}

        {/* Invoices Master Table Card */}
        <UICard variant="default" className="p-5 sm:p-6 rounded-2xl bg-surface border-border shadow-xs space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border/70">
            {/* Search Input */}
            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by invoice #, customer or phone..."
                className="w-full rounded-xl border border-border bg-surface-alt/70 pl-9 pr-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-primary focus:bg-surface focus:outline-none"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-border">
              {statusTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedStatus(tab)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer",
                    selectedStatus === tab
                      ? "bg-surface text-primary shadow-xs"
                      : "text-text-muted hover:text-text"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-text-muted uppercase tracking-wider bg-surface-alt/30">
                  <th className="py-3 px-4 font-semibold">Invoice No</th>
                  <th className="py-3 px-4 font-semibold">Customer / Patient</th>
                  <th className="py-3 px-3 font-semibold">Date</th>
                  <th className="py-3 px-3 font-semibold">Due Date</th>
                  <th className="py-3 px-3 font-semibold text-center">Items</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                  <th className="py-3 px-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-text-muted space-y-2">
                      <Loader2 className="size-7 mx-auto animate-spin text-primary" />
                      <p className="text-xs font-semibold">Loading live invoices from backend...</p>
                    </td>
                  </tr>
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="group hover:bg-surface-hover/70 transition-colors"
                    >
                      {/* Invoice No */}
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {inv.invoiceNo}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-text">{inv.customer}</span>
                          <span className="text-[11px] text-text-muted font-mono">{inv.phone}</span>
                        </div>
                      </td>

                      {/* Issue Date */}
                      <td className="py-3 px-3 text-text-muted font-medium">
                        {inv.issueDate}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 text-text-muted font-medium">
                        {inv.dueDate}
                      </td>

                      {/* Items Count */}
                      <td className="py-3 px-3 text-center font-mono text-text">
                        {inv.itemCount}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-text tabular-nums">
                        ₹{inv.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(inv.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <UIButton
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedInvoice(inv)}
                          leftIcon={<Eye className="size-3.5" />}
                        >
                          View
                        </UIButton>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-text-muted">
                      No invoices found matching &ldquo;{searchQuery}&rdquo;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/70 text-xs text-text-muted">
            <span className="font-mono tabular-nums">
              Showing {totalInvoices} of {invoices.length} invoices
            </span>
            <div className="flex items-center gap-2 mt-2">
              <UIButton
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              >
                ‹ Prev
              </UIButton>
              <span className="text-sm">Page {currentPage} of {totalPages}</span>
              <UIButton
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              >
                Next ›
              </UIButton>
            </div>
          </div>
        </UICard>
      </div>

      {/* Create Invoice Modal */}
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

export default BillingDesktopPage;
