import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  RotateCcw,
  Search,
  RefreshCw,
  Plus,
  Eye,
  Printer,
  Calendar,
  Banknote,
  Wallet,
  Receipt,
  Boxes,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  X,
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
} from "@/components/ui";
import useBranch from "@/features/branch/hooks/useBranch";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import salesReturnService from "../../services/salesReturnService";
import SalesReturnDetailsDrawer from "../../components/SalesReturnDetailsDrawer";
import { OrderInvoiceModal } from "@/features/sales/components";
import { ROUTES } from "@/constants";

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

export const SalesReturnDesktopPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentBranch } = useBranch();
  const { currentCompany } = useWorkspace();

  const [returns, setReturns] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [refundType, setRefundType] = useState("all");
  const [billingMode, setBillingMode] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 25;

  // Debounce search query by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page to 1 whenever any filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateRange, refundType, billingMode, currentBranch]);

  // Selected for Details Drawer
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Print Modal
  const [printReturn, setPrintReturn] = useState(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Fetch Returns
  const fetchReturns = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit,
        branchId: currentBranch?._id || currentBranch?.id || undefined,
        search: debouncedSearch || undefined,
        returnType: refundType !== "all" ? refundType : undefined,
        billingMode: billingMode !== "all" ? billingMode : undefined,
      };

      // Date range calculation with accurate start and end boundaries
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

      const res = await salesReturnService.getAllSalesReturns(params);
      const data = res?.data?.data || res?.data;

      setReturns(data?.returns || []);
      setTotalCount(data?.meta?.total || 0);
    } catch (err) {
      console.error("Failed to fetch sales returns:", err);
      setError("Unable to load sales returns. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, [currentBranch, debouncedSearch, dateRange, refundType, billingMode, page]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

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
    setPage(1);
  };

  const handleOpenDrawer = (item) => {
    setSelectedReturn(item);
    setIsDrawerOpen(true);
  };

  const handleOpenPrint = useCallback((item, e) => {
    if (e) e.stopPropagation();
    setPrintReturn(item);
    setIsPrintOpen(true);
  }, []);

  // If navigated from create page with a new return memo to print
  useEffect(() => {
    if (location.state?.printReturn) {
      handleOpenPrint(location.state.printReturn);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, handleOpenPrint]);

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-alt/30 overflow-hidden">
      {/* Top Banner / Actions */}
      <div className="shrink-0 px-6 py-4 bg-surface border-b border-border flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Sales Returns</h1>
            <UIBadge variant="destructive" size="sm">
              Credit Notes
            </UIBadge>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Process customer medicine returns, restock inventory, and issue cash refunds or advance credit.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <UIButton
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchReturns}
            loading={isLoading}
          >
            Refresh
          </UIButton>
          <UIButton
            variant="destructive"
            size="sm"
            icon={Plus}
            onClick={() => navigate(ROUTES.CREATE_SALES_RETURN)}
          >
            New Sales Return
          </UIButton>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="shrink-0 px-6 py-3 border-b border-border bg-surface grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-border bg-surface-alt/30">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Returns</span>
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-mono font-extrabold text-text-primary">
            {metrics.count}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border bg-surface-alt/30">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Refund Value</span>
            <Receipt className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-mono font-extrabold text-rose-600 dark:text-rose-400">
            {formatCurrency(metrics.totalRefundAmt)}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border bg-surface-alt/30">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cash Disbursed</span>
            <Banknote className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(metrics.cashRefundAmt)}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border bg-surface-alt/30">
          <div className="flex items-center justify-between text-text-muted mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Advance Credited</span>
            <Wallet className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-mono font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(metrics.advanceRefundAmt)}
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="shrink-0 px-6 py-2.5 bg-surface border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Return No, Bill No, Customer name/phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-border bg-surface-alt/40 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5 rounded"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <UISelect
            value={dateRange}
            onChange={(val) => setDateRange(val?.target ? val.target.value : val)}
            options={DATE_RANGE_OPTIONS}
            className="w-36 text-xs h-8"
          />

          <UISelect
            value={refundType}
            onChange={(val) => setRefundType(val?.target ? val.target.value : val)}
            options={REFUND_TYPE_OPTIONS}
            className="w-40 text-xs h-8"
          />

          <UISelect
            value={billingMode}
            onChange={(val) => setBillingMode(val?.target ? val.target.value : val)}
            options={[
              { label: "All Modes", value: "all" },
              { label: "B2C Retail", value: "B2C" },
              { label: "B2B Commercial", value: "B2B" },
            ]}
            className="w-32 text-xs h-8"
          />

          {hasActiveFilters && (
            <UIButton
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 whitespace-nowrap"
            >
              Reset
            </UIButton>
          )}
        </div>
      </div>

      {/* Returns Data Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="border border-border rounded-xl bg-surface overflow-hidden shadow-sm">
          <UITable>
            <UITableHeader>
              <UITableRow className="bg-surface-alt/40 border-b border-border">
                <UITableHead className="py-2.5 px-3 text-[10.5px] uppercase font-bold text-text-muted">
                  Return Date
                </UITableHead>
                <UITableHead className="py-2.5 px-3 text-[10.5px] uppercase font-bold text-text-muted">
                  Return Memo No
                </UITableHead>
                <UITableHead className="py-2.5 px-3 text-[10.5px] uppercase font-bold text-text-muted">
                  Original Invoice
                </UITableHead>
                <UITableHead className="py-2.5 px-3 text-[10.5px] uppercase font-bold text-text-muted">
                  Customer
                </UITableHead>
                <UITableHead className="py-2.5 px-3 text-[10.5px] uppercase font-bold text-text-muted">
                  Refund Mode
                </UITableHead>
                <UITableHead className="py-2.5 px-3 text-right text-[10.5px] uppercase font-bold text-text-muted">
                  Taxable
                </UITableHead>
                <UITableHead className="py-2.5 px-3 text-right text-[10.5px] uppercase font-bold text-text-muted">
                  GST Adj.
                </UITableHead>
                <UITableHead className="py-2.5 px-3 text-right text-[10.5px] uppercase font-bold text-text-muted">
                  Total Refund
                </UITableHead>
                <UITableHead className="py-2.5 px-3 text-center text-[10.5px] uppercase font-bold text-text-muted">
                  Actions
                </UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={9} text="Loading sales return memos..." />
              ) : returns.length === 0 ? (
                <UITableEmpty
                  colSpan={9}
                  title="No sales return records found"
                  description="When items are returned, credit memos and refund transactions appear here."
                />
              ) : (
                returns.map((item) => {
                  const returnNo = item.returnNo || item.invoiceNo || "RET-MEMO";
                  let origBill = item.originalInvoiceNo || item.originalInvoiceId?.invoiceNo;
                  if (!origBill || origBill === returnNo || origBill.startsWith("RET-")) {
                    const itOrig = Array.isArray(item.items)
                      ? item.items.find((it) => it.originalInvoiceNo && !it.originalInvoiceNo.startsWith("RET-"))
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
                      key={item._id}
                      onClick={() => handleOpenDrawer(item)}
                      className="cursor-pointer hover:bg-surface-alt/40 transition-colors border-b border-border"
                    >
                      {/* Date */}
                      <UITableCell className="py-2.5 px-3 text-xs">
                        <div className="font-semibold text-text-primary">{formatDate(item.date)}</div>
                        <div className="text-[10px] text-text-muted font-mono">{formatTime(item.date)}</div>
                      </UITableCell>

                      {/* Memo No */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                          {returnNo}
                        </div>
                        <div className="text-[10px] text-text-muted">{item.billingMode || "B2C"}</div>
                      </UITableCell>

                      {/* Original Invoice */}
                      <UITableCell className="py-2.5 px-3 font-mono text-xs font-semibold text-primary">
                        {origBill}
                      </UITableCell>

                      {/* Customer */}
                      <UITableCell className="py-2.5 px-3 text-xs">
                        <div className="font-semibold text-text-primary truncate max-w-[140px]">{cName}</div>
                        {cPhone && (
                          <div className="text-[10px] text-text-muted font-mono">{cPhone}</div>
                        )}
                      </UITableCell>

                      {/* Refund Mode */}
                      <UITableCell className="py-2.5 px-3">
                        {isAdv ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                            <Wallet className="w-3 h-3" /> Advance
                          </span>
                        ) : isCred ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                            <Receipt className="w-3 h-3" /> Credit Note
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            <Banknote className="w-3 h-3" /> Cash
                          </span>
                        )}
                      </UITableCell>

                      {/* Taxable */}
                      <UITableCell className="py-2.5 px-3 text-right font-mono text-xs text-text-muted">
                        {formatCurrency(sub)}
                      </UITableCell>

                      {/* GST */}
                      <UITableCell className="py-2.5 px-3 text-right font-mono text-xs text-text-muted">
                        {formatCurrency(tax)}
                      </UITableCell>

                      {/* Grand Total */}
                      <UITableCell className="py-2.5 px-3 text-right font-mono font-extrabold text-sm text-rose-600 dark:text-rose-400">
                        {formatCurrency(gTotal)}
                      </UITableCell>

                      {/* Actions */}
                      <UITableCell className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <UIButton
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-surface-alt/70"
                            title="Inspect Details"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDrawer(item);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5 text-text-muted hover:text-text-primary" />
                          </UIButton>
                          <UIButton
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-surface-alt/70"
                            title="Print Return Memo"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPrint(item, e);
                            }}
                          >
                            <Printer className="w-3.5 h-3.5 text-text-muted hover:text-text-primary" />
                          </UIButton>
                        </div>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>
        </div>
      </div>

      {/* Pagination Bar */}
      <div className="shrink-0 px-6 py-2.5 bg-surface border-t border-border flex items-center justify-between text-xs text-text-muted">
        <div>
          Showing {returns.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
          {Math.min(page * limit, totalCount)} of {totalCount} records
        </div>
        <div className="flex items-center gap-2">
          <UIButton
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </UIButton>
          <span className="font-mono text-xs text-text-primary px-2">
            Page {page} of {Math.max(1, Math.ceil(totalCount / limit))}
          </span>
          <UIButton
            variant="outline"
            size="sm"
            disabled={page * limit >= totalCount || isLoading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </UIButton>
        </div>
      </div>

      {/* Details Slide-Over Drawer */}
      <SalesReturnDetailsDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        returnItem={selectedReturn}
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
