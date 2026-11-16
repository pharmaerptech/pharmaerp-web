// src/features/sales-returns/pages/desktop/SalesReturnDesktopPage.jsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  RotateCcw,
  Search,
  RefreshCw,
  Plus,
  Eye,
  Printer,
  Banknote,
  Wallet,
  Receipt,
  RotateCcw as RotateIcon,
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
} from "@/components/ui";
import useBranch from "@/features/branch/hooks/useBranch";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import { BranchFilterSelect, BranchBadge } from "@/components/shared";
import { useBranchFilter } from "@/hooks";
import { cn } from "@/lib/utils";
import salesReturnService from "../../services/salesReturnService";
import SalesReturnDetailsDrawer from "../../components/SalesReturnDetailsDrawer";
import CreateSalesReturnModal from "../../components/CreateSalesReturnModal";
import { OrderInvoiceModal } from "@/features/sales/components";

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const DATE_RANGE_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last7days" },
  { label: "This Month", value: "thisMonth" },
];

const REFUND_TYPE_OPTIONS = [
  { label: "All Refund Types", value: "all" },
  { label: "Cash Refund", value: "cash_refund" },
  { label: "Advance Balance", value: "advance_credit" },
  { label: "Credit Note", value: "credit_note" },
];

const PAGE_LIMIT = 20;

export const SalesReturnDesktopPage = () => {
  const tableContainerRef = useRef(null);
  const { currentBranch } = useBranch();
  const { currentCompany } = useWorkspace();
  const { isCompanyLevel, selectedBranchId, setSelectedBranchId, queryBranchId } = useBranchFilter();

  const [returns, setReturns] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [refundType, setRefundType] = useState("all");
  const [billingMode, setBillingMode] = useState("all");

  // Debounce search query by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Selected for Details Drawer
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Print Modal
  const [printReturn, setPrintReturn] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Create Return Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const buildQueryParams = useCallback(
    (targetPage = 1) => {
      const activeBranchId = isCompanyLevel
        ? queryBranchId
        : currentBranch?._id || currentBranch?.id || undefined;

      const params = {
        page: targetPage,
        limit: PAGE_LIMIT,
        branchId: activeBranchId,
        search: debouncedSearch || undefined,
        returnType: refundType !== "all" ? refundType : undefined,
        billingMode: billingMode !== "all" ? billingMode : undefined,
      };

      const now = new Date();
      if (dateRange === "today") {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        params.dateFrom = start.toISOString();
        params.dateTo = end.toISOString();
      } else if (dateRange === "yesterday") {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        params.dateFrom = start.toISOString();
        params.dateTo = end.toISOString();
      } else if (dateRange === "last7days") {
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        params.dateFrom = start.toISOString();
        params.dateTo = end.toISOString();
      } else if (dateRange === "thisMonth") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        params.dateFrom = start.toISOString();
        params.dateTo = end.toISOString();
      }

      return params;
    },
    [isCompanyLevel, queryBranchId, currentBranch, debouncedSearch, refundType, billingMode, dateRange],
  );

  // Fetch initial batch (Page 1)
  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = buildQueryParams(1);
      const res = await salesReturnService.getAllSalesReturns(params);
      const data = res?.data?.data || res?.data;

      setReturns(data?.returns || []);
      setTotalCount(data?.meta?.total || 0);
      setPage(1);

      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.error("Failed to fetch sales returns:", err);
      setError("Unable to load sales returns. Please refresh.");
      setReturns([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryParams]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  // Load more items via infinite scroll
  const hasMore = returns.length < totalCount;

  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const params = buildQueryParams(nextPage);
      const res = await salesReturnService.getAllSalesReturns(params);
      const data = res?.data?.data || res?.data;
      const nextBatch = data?.returns || [];

      setReturns((prev) => [...prev, ...nextBatch]);
      setPage(nextPage);
      setTotalCount(data?.meta?.total || totalCount);
    } catch (err) {
      console.error("Failed to load more returns:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, hasMore, page, buildQueryParams, totalCount]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalRefundAmt = 0;
    let cashRefundAmt = 0;
    let advanceRefundAmt = 0;
    let creditNoteAmt = 0;

    returns.forEach((r) => {
      const amt = Math.abs(Number(r.grandTotal || r.returnAmount || 0));
      totalRefundAmt += amt;
      const rType = String(r.returnType || "").toLowerCase();
      if (rType.includes("advance")) {
        advanceRefundAmt += amt;
      } else if (rType.includes("credit")) {
        creditNoteAmt += amt;
      } else {
        cashRefundAmt += amt;
      }
    });

    return {
      count: totalCount || returns.length,
      totalRefundAmt,
      cashRefundAmt,
      advanceRefundAmt,
      creditNoteAmt,
    };
  }, [returns, totalCount]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      dateRange !== "all" ||
      refundType !== "all" ||
      billingMode !== "all"
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setDateRange("all");
    setRefundType("all");
    setBillingMode("all");
  };

  const handleOpenDrawer = (item) => {
    setSelectedReturn(item);
    setIsDrawerOpen(true);
  };

  const handleOpenPrint = (item, e) => {
    if (e) e.stopPropagation();
    setPrintReturn(item);
    setIsPrintOpen(true);
  };

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden select-none">
      {/* ── 1. Compact 4-Card Statistics Grid (Matches Billing/Sales Invoice Page) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Returns */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
            <RotateIcon className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total Returns
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {metrics.count}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Sales return memos
            </div>
          </div>
        </div>

        {/* Card 2: Total Refund Value */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
            <Receipt className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total Refund Value
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-rose-600 dark:text-rose-400 leading-tight font-mono tabular-nums">
              {formatCurrency(metrics.totalRefundAmt)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Cumulative refund amount
            </div>
          </div>
        </div>

        {/* Card 3: Cash Disbursed */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Banknote className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400 truncate">
              Cash Disbursed
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-emerald-600 dark:text-emerald-400 leading-tight font-mono tabular-nums">
              {formatCurrency(metrics.cashRefundAmt)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Cash refunds settled
            </div>
          </div>
        </div>

        {/* Card 4: Advance & Credit Notes */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
            <Wallet className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-sky-600 dark:text-sky-400 truncate">
              Advance & Credit Notes
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-sky-600 dark:text-sky-400 leading-tight font-mono tabular-nums">
              {formatCurrency(metrics.advanceRefundAmt + metrics.creditNoteAmt)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Reconciled customer credit
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Filter Toolbar ────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {/* Search Input */}
        <div className="flex-1 min-w-[220px] sm:min-w-[260px]">
          <UIInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search return memo #, bill #, customer..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => setSearchQuery("")}
            className="w-full"
          />
        </div>

        {/* Branch Filter (Only renders at Company Level) */}
        {isCompanyLevel && (
          <BranchFilterSelect
            value={selectedBranchId}
            onChange={setSelectedBranchId}
            size="md"
            className="w-[180px] sm:w-[200px]"
          />
        )}

        {/* Date Range Selector */}
        <div className="w-[130px] sm:w-[150px]">
          <UISelect
            value={dateRange}
            onChange={(val) => setDateRange(val)}
            options={DATE_RANGE_OPTIONS}
            placeholder="Date Range"
            size="md"
          />
        </div>

        {/* Refund Type Selector */}
        <div className="w-[140px] sm:w-[160px]">
          <UISelect
            value={refundType}
            onChange={(val) => setRefundType(val)}
            options={REFUND_TYPE_OPTIONS}
            placeholder="Refund Type"
            size="md"
          />
        </div>

        {/* Billing Mode Selector */}
        <div className="w-[120px] sm:w-[140px]">
          <UISelect
            value={billingMode}
            onChange={(val) => setBillingMode(val)}
            options={[
              { label: "All Modes", value: "all" },
              { label: "B2C Retail", value: "B2C" },
              { label: "B2B Commercial", value: "B2B" },
            ]}
            placeholder="Billing Mode"
            size="md"
          />
        </div>

        {/* Quick Reset */}
        {hasActiveFilters && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleResetFilters}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
            className="h-10 px-2.5 text-xs text-text-muted hover:text-text"
            title="Reset all filters"
          >
            Reset
          </UIButton>
        )}

        {/* Action Cluster (Right) */}
        <div className="flex items-center gap-1.5 ml-auto">
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={fetchReturns}
            className="h-10 w-10 p-0 text-text-muted hover:text-text cursor-pointer"
            title="Refresh returns"
          >
            <RefreshCw
              className={cn(
                "size-4 text-text-muted hover:text-primary",
                isLoading && "animate-spin text-primary"
              )}
            />
          </UIButton>

          <UIButton
            type="button"
            variant="primary"
            size="md"
            startIcon={<Plus className="size-4" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 px-3.5 text-xs font-semibold shadow-xs"
          >
            New Sales Return
          </UIButton>
        </div>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
        <UITableScrollArea containerRef={tableContainerRef} className="divide-y divide-border/60">
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full"
          >
            {/* Sticky Table Header */}
            <UITableHeader
              sticky
              className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs"
            >
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
                <UITableHead sticky className="min-w-[130px]">Return Date</UITableHead>
                <UITableHead sticky className="min-w-[140px]">Return Memo No</UITableHead>
                {isCompanyLevel && (
                  <UITableHead sticky className="min-w-[130px]">Branch</UITableHead>
                )}
                <UITableHead sticky className="min-w-[140px]">Original Invoice</UITableHead>
                <UITableHead sticky className="min-w-[180px]">Customer</UITableHead>
                <UITableHead sticky align="center" className="min-w-[130px]">Refund Mode</UITableHead>
                <UITableHead sticky align="right" className="min-w-[100px]">Taxable</UITableHead>
                <UITableHead sticky align="right" className="min-w-[90px]">GST Adj.</UITableHead>
                <UITableHead sticky align="right" className="min-w-[110px]">Total Refund</UITableHead>
                <UITableHead sticky align="center" className="min-w-[80px]">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={isCompanyLevel ? 10 : 9} rows={8} />
              ) : returns.length === 0 ? (
                <UITableEmpty
                  colSpan={isCompanyLevel ? 10 : 9}
                  title="No sales return records found"
                  description="When items are returned, credit memos and refund transactions appear here."
                />
              ) : (
                returns.map((item) => {
                  const returnNo = item.returnNo || item.invoiceNo || "RET-MEMO";
                  let origBill = item.originalInvoiceNo || item.originalInvoiceId?.invoiceNo;
                  if (!origBill || origBill === returnNo || origBill.startsWith("RET-")) {
                    const itOrig = Array.isArray(item.items)
                      ? item.items.find(
                          (it) => it.originalInvoiceNo && !it.originalInvoiceNo.startsWith("RET-")
                        )
                      : null;
                    if (itOrig) origBill = itOrig.originalInvoiceNo;
                  }
                  origBill = origBill || "—";
                  const cName =
                    item.customerId?.name ||
                    item.customerName ||
                    item.customer?.name ||
                    "Walk-in Customer";
                  const cPhone = item.customerId?.mobile || item.customerPhone || "";
                  const rType = String(item.returnType || "").toLowerCase();
                  const isAdv = rType.includes("advance");
                  const isCred = rType.includes("credit");
                  const gTotal = Math.abs(Number(item.grandTotal || item.returnAmount || 0));
                  const tax = Math.abs(Number(item.tax || 0));
                  const sub = Math.abs(Number(item.subtotal || gTotal - tax));

                  return (
                    <UITableRow
                      key={item._id || item.id}
                      onClick={() => handleOpenDrawer(item)}
                      className="cursor-pointer hover:bg-surface-alt/50 transition-colors"
                    >
                      {/* Date & Time */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="font-mono text-xs font-semibold text-text">
                          {formatDate(item.createdAt || item.date)}
                        </div>
                        <div className="text-[10px] text-text-muted font-mono">
                          {formatTime(item.createdAt || item.date)}
                        </div>
                      </UITableCell>

                      {/* Return Memo Number */}
                      <UITableCell className="py-2.5 px-3 font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                        {returnNo}
                      </UITableCell>

                      {/* Branch Badge (Only Company Level) */}
                      {isCompanyLevel && (
                        <UITableCell className="py-2.5 px-3">
                          <BranchBadge
                            branch={item.branchId}
                            name={item.branchName || item.branchId?.name}
                            code={item.branchCode || item.branchId?.branchCode}
                            size="xs"
                          />
                        </UITableCell>
                      )}

                      {/* Original Invoice Reference */}
                      <UITableCell className="py-2.5 px-3 font-mono text-xs text-text-muted">
                        {origBill}
                      </UITableCell>

                      {/* Customer Name & Phone */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="font-semibold text-xs text-text truncate max-w-[200px]">
                          {cName}
                        </div>
                        {cPhone && (
                          <div className="text-[10.5px] text-text-muted font-mono truncate">
                            {cPhone}
                          </div>
                        )}
                      </UITableCell>

                      {/* Refund Mode Badge */}
                      <UITableCell align="center" className="py-2.5 px-3">
                        {isAdv ? (
                          <UIBadge variant="soft" color="info" className="text-[10px] font-semibold">
                            Advance Credit
                          </UIBadge>
                        ) : isCred ? (
                          <UIBadge variant="soft" color="warning" className="text-[10px] font-semibold">
                            Credit Note
                          </UIBadge>
                        ) : (
                          <UIBadge variant="soft" color="success" className="text-[10px] font-semibold">
                            Cash Refund
                          </UIBadge>
                        )}
                      </UITableCell>

                      {/* Taxable */}
                      <UITableCell align="right" className="py-2.5 px-3 font-mono text-xs text-text-muted">
                        {formatCurrency(sub)}
                      </UITableCell>

                      {/* GST */}
                      <UITableCell align="right" className="py-2.5 px-3 font-mono text-xs text-text-muted">
                        {formatCurrency(tax)}
                      </UITableCell>

                      {/* Grand Total */}
                      <UITableCell align="right" className="py-2.5 px-3 font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                        {formatCurrency(gTotal)}
                      </UITableCell>

                      {/* Actions */}
                      <UITableCell align="center" className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <UIButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-text-muted hover:text-text cursor-pointer"
                            title="Inspect Details"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDrawer(item);
                            }}
                          >
                            <Eye className="size-3.5" />
                          </UIButton>
                          <UIButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-text-muted hover:text-text cursor-pointer"
                            title="Print Return Memo"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPrint(item, e);
                            }}
                          >
                            <Printer className="size-3.5" />
                          </UIButton>
                        </div>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Infinite Scroll trigger */}
          {!isLoading && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                returns.length >= totalCount && returns.length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none">
                    ✓ All {totalCount} sales return memos loaded
                  </span>
                ) : null
              }
            />
          )}
        </UITableScrollArea>
      </div>

      {/* Details Slide-Over Drawer */}
      <SalesReturnDetailsDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        returnItem={selectedReturn}
      />

      {/* Create Sales Return Modal */}
      <CreateSalesReturnModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(saved) => {
          fetchReturns();
          if (saved) {
            handleOpenPrint(saved);
          }
        }}
      />

      {/* Printable Receipt Modal */}
      {printReturn && (
        <OrderInvoiceModal
          open={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          saleData={{
            ...printReturn,
            isReturn: true,
            invoiceNo: printReturn.returnNo || printReturn.invoiceNo,
            customer: printReturn.customerId || {
              name: printReturn.customerName,
              mobile: printReturn.customerPhone,
            },
          }}
          branch={currentBranch}
          company={currentCompany}
        />
      )}
    </div>
  );
};

export default SalesReturnDesktopPage;
