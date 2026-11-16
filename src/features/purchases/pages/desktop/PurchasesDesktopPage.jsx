// src/features/purchases/pages/desktop/PurchasesDesktopPage.jsx

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  Eye,
  FileSpreadsheet,
  RefreshCw,
  RotateCcw,
  Receipt,
  CreditCard,
} from "lucide-react";
import {
  UIButton,
  UIInput,
  UISelect,
  UIBadge,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  UITableEmpty,
  UITableLoading,
  UIInfiniteScroll,
  UITableScrollArea,
  PermissionGate,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { PurchaseBillPreviewModal } from "../../components/PurchaseBillPreviewModal";
import { MakePaymentModal } from "../../components/MakePaymentModal";
import { BulkPaymentModal } from "../../components/BulkPaymentModal";
import { BranchFilterSelect, BranchBadge } from "@/components/shared";
import { useBranchFilter } from "@/hooks";
import purchaseBillService from "../../services/purchaseBillService";

const PAGE_LIMIT = 20;

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const STATUS_SELECT_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Received", value: "RECEIVED" },
  { label: "Paid", value: "PAID" },
  { label: "Partially Paid", value: "PARTIALLY_PAID" },
  { label: "Draft", value: "DRAFT" },
  { label: "Cancelled", value: "CANCELLED" },
];

export const PurchasesDesktopPage = () => {
  const navigate = useNavigate();
  const { isCompanyLevel, selectedBranchId, setSelectedBranchId, queryBranchId } = useBranchFilter();
  const tableContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Core Data & Infinite Scroll states
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBills, setTotalBills] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modals & Feedback
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentBill, setPaymentBill] = useState(null);
  const [isBulkPaymentOpen, setIsBulkPaymentOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initial Fetch & Filter Application
  const fetchInitialBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: 1,
        limit: PAGE_LIMIT,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (queryBranchId) params.branchId = queryBranchId;

      const res = await purchaseBillService.getPurchaseBills(params);
      const data = res.data?.data || {};
      const list = Array.isArray(data.bills) ? data.bills : [];
      const total = data.total ?? list.length;

      setBills(list);
      setTotalBills(total);
      setCurrentPage(1);
      setHasMore(list.length < total);
    } catch (err) {
      console.error("Failed to fetch purchase bills", err);
      setToastMessage("❌ Failed to load purchase bills");
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedStatus, queryBranchId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInitialBills();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchInitialBills]);

  // Load More for Infinite Scroll
  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const params = {
        page: nextPage,
        limit: PAGE_LIMIT,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (queryBranchId) params.branchId = queryBranchId;

      const res = await purchaseBillService.getPurchaseBills(params);
      const data = res.data?.data || {};
      const nextList = Array.isArray(data.bills) ? data.bills : [];
      const total = data.total ?? totalBills;

      if (nextList.length > 0) {
        setBills((prev) => {
          const existingIds = new Set(prev.map((b) => b._id || b.id));
          const newRows = nextList.filter((b) => !existingIds.has(b._id || b.id));
          const combined = [...prev, ...newRows];
          setHasMore(combined.length < total);
          return combined;
        });
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn("Failed to load more purchase bills:", err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoading, isLoadingMore, searchQuery, selectedStatus, queryBranchId, totalBills]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
  };

  // Excel Legacy Bills Import
  const handleImportLegacyBills = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setToastMessage("⏳ Importing legacy bills...");
      const formData = new FormData();
      formData.append("file", file);

      const res = await purchaseBillService.importLegacyBills(formData);
      setToastMessage(`✅ ${res.data?.message || "Imported successfully!"}`);
      setTimeout(() => setToastMessage(null), 3500);
      fetchInitialBills();
    } catch (err) {
      console.error("Failed to import legacy bills", err);
      setToastMessage("❌ Failed to import legacy bills");
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Calculate high-density dynamic stats
  const stats = useMemo(() => {
    const count = totalBills || bills.length;
    let received = 0;
    let draft = 0;
    let totalValue = 0;

    for (const b of bills) {
      const st = String(b.status || "").toUpperCase();
      if (st === "RECEIVED" || st === "CONFIRMED") received += 1;
      if (st === "DRAFT") draft += 1;
      totalValue += Number(b.grandTotal || 0);
    }

    return {
      total: count,
      received,
      draft,
      totalValue,
    };
  }, [totalBills, bills]);

  const getStatusBadge = (status) => {
    const st = String(status || "").toUpperCase();
    switch (st) {
      case "CONFIRMED":
        return <UIBadge variant="soft" color="success">Confirmed</UIBadge>;
      case "RECEIVED":
        return <UIBadge variant="solid" color="success">Received</UIBadge>;
      case "PAID":
        return <UIBadge variant="solid" color="primary">Paid</UIBadge>;
      case "PARTIALLY_PAID":
        return <UIBadge variant="soft" color="warning">Partially Paid</UIBadge>;
      case "DRAFT":
        return <UIBadge variant="soft" color="neutral">Draft</UIBadge>;
      case "CANCELLED":
        return <UIBadge variant="soft" color="error">Cancelled</UIBadge>;
      default:
        return <UIBadge variant="soft" color="info">{status}</UIBadge>;
    }
  };

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
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
      </AnimatePresence>

      {/* ── 1. Compact 4-Card Statistics Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Purchase Bills */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <Receipt className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total Bills
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.total}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Procurement orders
            </div>
          </div>
        </div>

        {/* Card 2: Received / Confirmed */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              Goods Received
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.received}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate mt-0.5">
              Confirmed stock receipts
            </div>
          </div>
        </div>

        {/* Card 3: Draft / Processing */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-warning-soft text-warning flex items-center justify-center shrink-0">
            <Clock className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-warning truncate">
              Draft / Pending
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.draft}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Awaiting confirmation
            </div>
          </div>
        </div>

        {/* Card 4: Total Purchase Value */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <CreditCard className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-primary truncate">
              Purchase Value
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.totalValue)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Active bill grand total
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Filter Toolbar ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Search Input */}
        <div className="w-[240px] sm:w-[280px] lg:w-[320px]">
          <UIInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bill #, invoice # or supplier..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => setSearchQuery("")}
            className="w-full"
          />
        </div>

        {/* Branch Filter (Company Level Only) */}
        <BranchFilterSelect
          value={selectedBranchId}
          onChange={setSelectedBranchId}
          size="md"
          className="w-[180px] sm:w-[200px]"
        />

        {/* Status Dropdown */}
        <div className="w-[160px] sm:w-[180px]">
          <UISelect
            value={selectedStatus}
            onChange={(val) => setSelectedStatus(val)}
            options={STATUS_SELECT_OPTIONS}
            placeholder="All Statuses"
            size="md"
          />
        </div>

        {/* Reset Filter Button */}
        {(searchQuery || selectedStatus !== "all") && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleResetFilters}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
            className="h-10 px-2 text-xs text-text-muted hover:text-text"
            title="Reset filters"
          >
            Reset
          </UIButton>
        )}

        {/* Right-Aligned Action Cluster */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Refresh Button */}
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={fetchInitialBills}
            className="h-10 w-10 p-0 text-text-muted hover:text-text"
            title="Refresh purchase bills"
          >
            <RefreshCw
              className={cn("size-4 text-text-muted hover:text-primary", isLoading && "animate-spin text-primary")}
            />
          </UIButton>

          {/* Import Legacy Bills */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".xlsx,.xls,.csv"
            onChange={handleImportLegacyBills}
          />
          <UIButton
            type="button"
            variant="outline"
            size="md"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-3 text-xs font-semibold hidden sm:inline-flex border-border hover:bg-surface-alt"
            title="Import Excel legacy bills"
          >
            Import
          </UIButton>

          {/* Bulk Payment Button */}
          <UIButton
            type="button"
            variant="outline"
            size="md"
            onClick={() => setIsBulkPaymentOpen(true)}
            className="h-10 px-3 text-xs font-semibold border-emerald-600/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            Bulk Payment
          </UIButton>

          {/* Enter Purchase Bill Button */}
          <PermissionGate
            permission="purchase:create"
            fallback={
              <UIButton variant="primary" size="md" disabled className="h-10 px-3.5 text-xs font-semibold">
                Enter Bill
              </UIButton>
            }
          >
            <UIButton
              type="button"
              variant="primary"
              size="md"
              startIcon={<Plus className="size-3.5" />}
              onClick={() => navigate("/purchases/bills/create")}
              className="h-10 px-3.5 text-xs font-semibold shadow-xs"
            >
              Enter Bill
            </UIButton>
          </PermissionGate>
        </div>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ──── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
        <UITableScrollArea containerRef={tableContainerRef} className="divide-y divide-border/60">
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full text-xs font-sans"
          >
            {/* Sticky Table Header */}
            <UITableHeader sticky className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs">
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
                <UITableHead sticky className="min-w-[150px]">Bill Number</UITableHead>
                {isCompanyLevel && (
                  <UITableHead sticky className="min-w-[130px]">Branch</UITableHead>
                )}
                <UITableHead sticky className="min-w-[220px]">Supplier</UITableHead>
                <UITableHead sticky className="min-w-[120px]">Bill Date</UITableHead>
                <UITableHead sticky className="min-w-[100px]">Rate Basis</UITableHead>
                <UITableHead sticky align="center" className="min-w-[90px]">Items</UITableHead>
                <UITableHead sticky align="right" className="min-w-[150px]">Bill Total</UITableHead>
                <UITableHead sticky align="center" className="min-w-[120px]">Status</UITableHead>
                <UITableHead sticky align="right" className="w-36">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={isCompanyLevel ? 9 : 8} rows={6} />
              ) : bills.length === 0 ? (
                <UITableEmpty
                  colSpan={isCompanyLevel ? 9 : 8}
                  title="No purchase bills found"
                  description={
                    searchQuery || selectedStatus !== "all"
                      ? "No bills match your active filter criteria. Try clearing filters."
                      : "No purchase bills recorded yet."
                  }
                  action={
                    (searchQuery || selectedStatus !== "all") ? (
                      <UIButton
                        variant="secondary"
                        size="sm"
                        onClick={handleResetFilters}
                      >
                        Clear Filters
                      </UIButton>
                    ) : undefined
                  }
                />
              ) : (
                bills.map((bill) => (
                  <UITableRow
                    key={bill._id || bill.id}
                    onClick={() => setSelectedBill(bill)}
                    className="cursor-pointer hover:bg-surface-hover/70 transition-colors"
                  >
                    {/* Bill Number */}
                    <UITableCell className="whitespace-nowrap">
                      <span className="font-bold text-primary font-mono text-[13px] tracking-tight">
                        {bill.purchaseBillNo || "-"}
                      </span>
                    </UITableCell>

                    {/* Branch Badge (Only at Company Level) */}
                    {isCompanyLevel && (
                      <UITableCell className="whitespace-nowrap">
                        <BranchBadge branch={bill.branchId} />
                      </UITableCell>
                    )}

                    {/* Supplier */}
                    <UITableCell>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-text truncate">
                          {bill.supplierId?.businessName || "-"}
                        </span>
                        {bill.supplierInvoiceNo && (
                          <span className="text-[10px] text-text-muted font-mono font-medium truncate mt-0.5">
                            Inv: {bill.supplierInvoiceNo}
                          </span>
                        )}
                      </div>
                    </UITableCell>

                    {/* Bill Date */}
                    <UITableCell className="whitespace-nowrap text-text-muted font-medium text-xs">
                      {formatDate(bill.invoiceDate || bill.createdAt)}
                    </UITableCell>

                    {/* Rate Basis */}
                    <UITableCell className="whitespace-nowrap text-text-muted font-mono text-xs">
                      {bill.rateBasis || "PTS"}
                    </UITableCell>

                    {/* Items Count */}
                    <UITableCell align="center" className="font-mono font-semibold text-text tabular-nums">
                      {bill.items?.length || 0}
                    </UITableCell>

                    {/* Grand Total */}
                    <UITableCell align="right" className="font-mono font-bold text-text tabular-nums text-sm">
                      ₹{formatCurrency(bill.grandTotal)}
                    </UITableCell>

                    {/* Status Badge */}
                    <UITableCell align="center" className="whitespace-nowrap">
                      {getStatusBadge(bill.status)}
                    </UITableCell>

                    {/* Actions */}
                    <UITableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {bill.amountDue > 0 && bill.status !== "CANCELLED" && (
                          <UIButton
                            variant="ghost"
                            size="xs"
                            onClick={() => setPaymentBill(bill)}
                            className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold text-xs"
                          >
                            Pay
                          </UIButton>
                        )}
                        <UIButton
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedBill(bill)}
                          startIcon={<Eye className="size-3.5" />}
                          className="text-text-muted hover:text-primary"
                        >
                          View
                        </UIButton>
                      </div>
                    </UITableCell>
                  </UITableRow>
                ))
              )}
            </UITableBody>
          </UITable>

          {/* Infinite Scroll Trigger */}
          {!isLoading && bills.length > 0 && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                !hasMore && bills.length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none">
                    ✓ All {totalBills} matching bills loaded
                  </span>
                ) : null
              }
            />
          )}
        </UITableScrollArea>
      </div>

      {/* Details Preview Modal */}
      <PurchaseBillPreviewModal
        bill={selectedBill}
        isOpen={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
        onRefresh={fetchInitialBills}
      />

      {/* Make Payment Modal */}
      <MakePaymentModal
        bill={paymentBill}
        isOpen={Boolean(paymentBill)}
        onClose={() => setPaymentBill(null)}
        onRefresh={() => {
          fetchInitialBills();
          setToastMessage("✅ Payment recorded successfully!");
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      {/* Bulk Payment Modal */}
      <BulkPaymentModal
        isOpen={isBulkPaymentOpen}
        onClose={() => setIsBulkPaymentOpen(false)}
        onRefresh={() => {
          fetchInitialBills();
          setToastMessage("✅ Bulk payment allocated successfully!");
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />
    </div>
  );
};

export default PurchasesDesktopPage;
