import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  UIAlert,
} from "@/components/ui";
import {
  CreditCard,
  AlertTriangle,
  Search,
  CheckCircle2,
  Phone,
  RefreshCw,
  Users,
  ShieldAlert,
  ArrowLeft,
  RotateCcw,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import customerService from "../../services/customerService";
import CustomerSettlementDialog from "../../components/CustomerSettlementDialog";

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getInitials = (name) => {
  if (!name) return "CU";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const FILTER_MODE_OPTIONS = [
  { value: "all", label: "All Debtors" },
  { value: "overdue", label: "Overdue Only" },
];

const SORT_OPTIONS = [
  { value: "outstanding", label: "Highest Debt" },
  { value: "oldestDue", label: "Oldest Due Date" },
  { value: "name", label: "Customer Name: A-Z" },
];

const PAGE_SIZE = 20;

export default function CustomerSettlementsPage() {
  const navigate = useNavigate();
  const tableContainerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ stats: {}, customers: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'overdue'
  const [sortBy, setSortBy] = useState("outstanding"); // 'outstanding' | 'oldestDue' | 'name'
  const [error, setError] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);

  // Settlement dialog
  const [settlingCustomer, setSettlingCustomer] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerService.getAllPendingCredits();
      setData(res?.data?.data || res?.data || { stats: {}, customers: [] });
    } catch (err) {
      console.error("Failed to load customer settlements:", err);
      setError("Failed to fetch pending credit settlements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const stats = data.stats || {};
  const customers = data.customers || [];
  const now = new Date();

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.customerName?.toLowerCase().includes(term) ||
          c.customerCode?.toLowerCase().includes(term) ||
          c.mobile?.includes(term)
      );
    }

    if (filterMode === "overdue") {
      list = list.filter((c) =>
        c.invoices?.some((inv) => inv.dueDate && new Date(inv.dueDate) < now)
      );
    }

    if (sortBy === "outstanding") {
      list.sort((a, b) => (b.totalOutstanding || 0) - (a.totalOutstanding || 0));
    } else if (sortBy === "oldestDue") {
      list.sort((a, b) => new Date(a.oldestDueDate || 0) - new Date(b.oldestDueDate || 0));
    } else if (sortBy === "name") {
      list.sort((a, b) => (a.customerName || "").localeCompare(b.customerName || ""));
    }

    return list;
  }, [customers, debouncedSearch, filterMode, sortBy, now]);

  // Reset display limit and scroll on filter change
  useEffect(() => {
    setDisplayLimit(PAGE_SIZE);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [debouncedSearch, filterMode, sortBy]);

  const displayedCustomers = useMemo(() => {
    return filteredCustomers.slice(0, displayLimit);
  }, [filteredCustomers, displayLimit]);

  const hasMore = displayedCustomers.length < filteredCustomers.length;

  const handleLoadMore = useCallback(() => {
    if (hasMore) {
      setDisplayLimit((prev) => prev + PAGE_SIZE);
    }
  }, [hasMore]);

  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setDebouncedSearch("");
    setFilterMode("all");
    setSortBy("outstanding");
  }, []);

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {error && <UIAlert variant="danger">{error}</UIAlert>}

      {/* ── 1. Compact 4-Card Statistics Grid (Top of Page) ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Receivables Debt */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-error-soft text-error flex items-center justify-center shrink-0">
            <CreditCard className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-error truncate">
              Total Receivables Debt
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.grandTotalOutstanding)}
            </div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono truncate mt-0.5">
              Unpaid customer credit invoices
            </div>
          </div>
        </div>

        {/* Card 2: Overdue Amount */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-warning-soft text-warning flex items-center justify-center shrink-0">
            <ShieldAlert className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-warning truncate">
              Overdue Amount
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.overdueAmount)}
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono truncate mt-0.5">
              Past agreed credit maturity
            </div>
          </div>
        </div>

        {/* Card 3: Overdue Invoices */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Receipt className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-primary truncate">
              Overdue Invoices
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.overdueInvoicesCount || 0} Bills
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Require collection follow-up
            </div>
          </div>
        </div>

        {/* Card 4: Debtor Customers */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <Users className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Debtor Accounts
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalCustomers || customers.length || 0}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Customers with balance due
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Toolbar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Compact Search Input (Decreased Width, Not Stretching Full Width) */}
        <div className="w-[240px] sm:w-[280px] lg:w-[320px]">
          <UIInput
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer name, code, phone..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => setSearchTerm("")}
            className="w-full"
          />
        </div>

        {/* Upfront Debtor Filter Selector (UISelect) */}
        <div className="w-[160px] sm:w-[180px]">
          <UISelect
            value={filterMode}
            onChange={(val) => setFilterMode(val)}
            options={FILTER_MODE_OPTIONS}
            placeholder="Debtor Filter"
            size="md"
          />
        </div>

        {/* Upfront Sort Selector (UISelect) */}
        <div className="w-[170px] sm:w-[190px]">
          <UISelect
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            options={SORT_OPTIONS}
            placeholder="Sort By"
            size="md"
          />
        </div>

        {/* Quick Reset Button */}
        {(searchTerm || filterMode !== "all" || sortBy !== "outstanding") && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleResetFilters}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
            className="h-10 px-2 text-xs text-text-muted hover:text-text"
            title="Reset all filters"
          >
            Reset
          </UIButton>
        )}

        {/* Toolbar Action Cluster */}
        <div className="flex items-center gap-1.5 ml-auto">
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={loading}
            onClick={fetchSettlements}
            className="h-10 w-10 p-0 text-text-muted hover:text-text"
            title="Refresh settlements list"
          >
            <RefreshCw
              className={cn("size-4 text-text-muted hover:text-primary", loading && "animate-spin text-primary")}
            />
          </UIButton>

          <UIButton
            type="button"
            variant="outline"
            size="md"
            startIcon={<ArrowLeft className="size-3.5" />}
            onClick={() => navigate(ROUTES.CUSTOMERS || "/parties/customers")}
            className="h-10 px-3 text-xs font-semibold"
            title="Back to Customers Directory"
          >
            Customers
          </UIButton>
        </div>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ────── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
        <UITableScrollArea containerRef={tableContainerRef} className="divide-y divide-border/60">
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full"
          >
            <UITableHeader
              sticky
              className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs border-b border-border"
            >
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text-muted uppercase tracking-wider bg-surface-alt/70 h-10">
                <UITableHead sticky className="min-w-[220px]">Customer</UITableHead>
                <UITableHead sticky className="min-w-[130px]">Contact</UITableHead>
                <UITableHead sticky align="center" className="min-w-[110px]">Unpaid Bills</UITableHead>
                <UITableHead sticky align="right" className="min-w-[140px]">Total Debt Due</UITableHead>
                <UITableHead sticky className="min-w-[130px]">Oldest Due Date</UITableHead>
                <UITableHead sticky align="right" className="min-w-[120px]">Credit Limit</UITableHead>
                <UITableHead sticky align="center" className="min-w-[110px]">Aging Status</UITableHead>
                <UITableHead sticky align="right" className="min-w-[100px]">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {loading ? (
                <UITableLoading colSpan={8} rows={8} />
              ) : displayedCustomers.length === 0 ? (
                <UITableEmpty
                  colSpan={8}
                  title="No debtor accounts found"
                  description={
                    debouncedSearch || filterMode !== "all"
                      ? "No customer accounts match your active filter criteria. Try clearing search or filters."
                      : "No pending credit accounts registered at this time."
                  }
                  action={
                    debouncedSearch || filterMode !== "all" ? (
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
                displayedCustomers.map((c) => {
                  const isOverdue = c.oldestDueDate && new Date(c.oldestDueDate) < now;

                  return (
                    <UITableRow
                      key={c.customerId}
                      className="group transition-colors hover:bg-surface-hover/70 h-13"
                    >
                      {/* Customer Initials & Name */}
                      <UITableCell className="py-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-8 rounded-lg bg-surface-alt border border-border/80 text-text flex items-center justify-center font-bold text-xs shrink-0 select-none">
                            {getInitials(c.customerName)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-text truncate text-xs sm:text-sm leading-tight">
                              {c.customerName}
                            </span>
                            {c.customerCode && (
                              <span className="text-[11px] text-text-muted font-mono truncate mt-0.5">
                                {c.customerCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </UITableCell>

                      {/* Contact */}
                      <UITableCell className="py-2">
                        {c.mobile ? (
                          <div className="font-mono text-text flex items-center gap-1 text-xs">
                            <Phone className="size-3 text-text-muted shrink-0" />
                            <span className="font-bold text-text/90 font-mono text-[13px]">{c.mobile}</span>
                          </div>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </UITableCell>

                      {/* Unpaid Bills */}
                      <UITableCell align="center" className="py-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-alt border border-border/60 text-text-muted">
                          {c.invoiceCount} Bills
                        </span>
                      </UITableCell>

                      {/* Total Debt Due */}
                      <UITableCell align="right" className="py-2">
                        <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-xs sm:text-sm tabular-nums">
                          ₹{formatCurrency(c.totalOutstanding)}
                        </span>
                      </UITableCell>

                      {/* Oldest Due Date */}
                      <UITableCell className="py-2 font-mono text-xs">
                        {c.oldestDueDate ? (
                          <div className="flex items-center gap-1">
                            <span
                              className={cn(
                                isOverdue
                                  ? "text-amber-600 dark:text-amber-400 font-bold"
                                  : "text-text-muted"
                              )}
                            >
                              {new Date(c.oldestDueDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            {isOverdue && <AlertTriangle className="size-3 text-amber-500 shrink-0" />}
                          </div>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </UITableCell>

                      {/* Credit Limit */}
                      <UITableCell align="right" className="py-2 font-mono text-xs tabular-nums text-text">
                        ₹{formatCurrency(c.creditLimit)}
                      </UITableCell>

                      {/* Aging Status */}
                      <UITableCell align="center" className="py-2">
                        <UIBadge
                          variant="soft"
                          color={isOverdue ? "warning" : "error"}
                          className="font-semibold text-xs"
                        >
                          {isOverdue ? "OVERDUE" : "ACTIVE DEBT"}
                        </UIBadge>
                      </UITableCell>

                      {/* Actions */}
                      <UITableCell align="right" className="py-2">
                        <div className="flex items-center justify-end">
                          <UIButton
                            type="button"
                            variant="primary"
                            size="sm"
                            startIcon={<CheckCircle2 className="size-3.5" />}
                            onClick={() =>
                              setSettlingCustomer({
                                _id: c.customerId,
                                name: c.customerName,
                                customerCode: c.customerCode,
                              })
                            }
                            className="h-8 px-3 text-xs font-semibold shadow-2xs"
                          >
                            Settle
                          </UIButton>
                        </div>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Reusable UIInfiniteScroll Component */}
          {!loading && displayedCustomers.length > 0 && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={false}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                !hasMore && filteredCustomers.length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none py-2 block text-center">
                    ✓ All {filteredCustomers.length} debtor customer accounts loaded
                  </span>
                ) : null
              }
            />
          )}
        </UITableScrollArea>
      </div>

      {/* Settle Dialog Modal */}
      {settlingCustomer && (
        <CustomerSettlementDialog
          isOpen={Boolean(settlingCustomer)}
          onClose={() => setSettlingCustomer(null)}
          customer={settlingCustomer}
          onSuccess={() => {
            fetchSettlements();
          }}
        />
      )}
    </div>
  );
}
