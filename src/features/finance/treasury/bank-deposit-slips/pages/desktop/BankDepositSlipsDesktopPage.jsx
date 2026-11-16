// src/features/finance/treasury/bank-deposit-slips/pages/desktop/BankDepositSlipsDesktopPage.jsx

import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  FileText,
  Landmark,
  Clock,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  Plus,
  MoreVertical,
  Eye,
  CheckCircle2,
  Calendar,
  Building2,
  Banknote,
  ShieldCheck,
  Check,
} from "lucide-react";
import dayjs from "dayjs";
import {
  UIButton,
  UIInput,
  UISelect,
  UIDatePicker,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  UITableEmpty,
  UITableLoading,
  UIInfiniteScroll,
  UIDropdown,
  UIDropdownTrigger,
  UIDropdownMenu,
  UIDropdownItem,
  UIDropdownDivider,
  PermissionGate,
  uiToast,
} from "@/components/ui";
import { usePermission } from "@/hooks";
import { cn } from "@/lib/utils";
import { BranchFilterSelect, BranchBadge } from "@/components/shared";

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const STATUS_SELECT_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Prepared / In Transit", value: "PREPARED" },
  { label: "Deposited to Bank", value: "DEPOSITED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const INITIAL_BATCH = 20;

export const BankDepositSlipsDesktopPage = ({
  bankDepositSlips = [],
  searchParams = {},
  isLoading = false,
  isTransitioning = false,
  error = "",
  message = "",
  clearFeedback,
  handleSearchChange,
  handleFilterChange,
  handleConfirmDeposit,
  handleCancelSlip,
  handleViewDetails,
  handleCreateNew,
  canCreateSlip = true,
  handleRefresh,
  isCompanyLevel = false,
  selectedBranchId = "all",
  setSelectedBranchId,
}) => {
  const { can } = usePermission();
  const tableContainerRef = useRef(null);

  // Client-side infinite scroll state
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter bank deposit slips by search and status
  const filteredSlips = useMemo(() => {
    const list = Array.isArray(bankDepositSlips) ? bankDepositSlips : [];
    const searchToken = String(searchParams.search || "").trim().toLowerCase();
    const statusToken = String(searchParams.status || "all").toUpperCase();
    const dateToken = searchParams.date || "";

    return list.filter((slip) => {
      const slipNo = String(slip.slipNumber || "").toLowerCase();
      const bagRef = String(slip.depositBagReference || "").toLowerCase();
      const bank = String(
        slip.toBankAccountId?.bank ||
        slip.toBankAccountId?.accountName ||
        slip.bankAccount?.bank ||
        ""
      ).toLowerCase();
      const branch = String(slip.bankBranchName || slip.branchId?.name || "").toLowerCase();

      const matchesSearch =
        !searchToken ||
        slipNo.includes(searchToken) ||
        bagRef.includes(searchToken) ||
        bank.includes(searchToken) ||
        branch.includes(searchToken);

      const matchesStatus =
        statusToken === "ALL" ||
        String(slip.status || "").toUpperCase() === statusToken;

      const matchesDate =
        !dateToken ||
        dayjs(slip.slipDate).format("YYYY-MM-DD") === dateToken;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bankDepositSlips, searchParams]);

  const isFiltered = Boolean(
    searchParams.search ||
    (searchParams.status && searchParams.status !== "all") ||
    searchParams.date
  );

  const handleClearAllFilters = () => {
    handleSearchChange?.("");
    handleFilterChange?.("status", "all");
    handleFilterChange?.("date", "");
  };

  // Sliced list for infinite scroll
  const displayedSlips = useMemo(() => {
    return filteredSlips.slice(0, visibleCount);
  }, [filteredSlips, visibleCount]);

  const hasMore = visibleCount < filteredSlips.length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 15, filteredSlips.length));
      setIsLoadingMore(false);
    }, 250);
  }, [filteredSlips.length, hasMore, isLoadingMore]);

  // Aggregate stats across all slips
  const stats = useMemo(() => {
    const list = Array.isArray(bankDepositSlips) ? bankDepositSlips : [];
    const totalCount = list.length;
    const preparedSlips = list.filter((s) => s.status === "PREPARED" || s.status === "PENDING");
    const depositedSlips = list.filter((s) => s.status === "DEPOSITED");
    const cancelledCount = list.filter((s) => s.status === "CANCELLED").length;

    const totalDepositedAmount = depositedSlips.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const preparedAmount = preparedSlips.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    return {
      totalCount,
      depositedCount: depositedSlips.length,
      totalDepositedAmount,
      preparedCount: preparedSlips.length,
      preparedAmount,
      cancelledCount,
    };
  }, [bankDepositSlips]);

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* ── 1. Compact 4-Card Statistics Grid (Top of Page) ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Slips */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <FileText className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total Deposit Slips
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalCount}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Vault cash transfer entries
            </div>
          </div>
        </div>

        {/* Card 2: Cash Deposited to Bank */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <Landmark className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              Cash Deposited to Bank
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              ₹{formatCurrency(stats.totalDepositedAmount)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {stats.depositedCount} slips confirmed
            </div>
          </div>
        </div>

        {/* Card 3: Prepared / In-Transit */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400 truncate">
              Prepared / In Transit
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.preparedAmount)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {stats.preparedCount} awaiting acknowledgment
            </div>
          </div>
        </div>

        {/* Card 4: Cancelled Slips */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <XCircle className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-rose-600 dark:text-rose-400 truncate">
              Cancelled Slips
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.cancelledCount}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Reversed back to vault
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Filter Toolbar ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-3.5 shrink-0">
        {/* Branch Filter (Company Level Only) */}
        {isCompanyLevel && (
          <div className="w-[190px] sm:w-[210px] shrink-0">
            <BranchFilterSelect
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              size="md"
              className="w-full"
            />
          </div>
        )}

        {/* Search Input */}
        <div className="w-[220px] sm:w-[260px] lg:w-[290px] shrink-0">
          <UIInput
            type="text"
            value={searchParams.search || ""}
            onChange={(e) => handleSearchChange?.(e.target.value)}
            placeholder="Search slip #, bank, or bag ref..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange?.("")}
            className="w-full"
          />
        </div>

        {/* Status Dropdown */}
        <div className="w-[180px] sm:w-[200px]">
          <UISelect
            value={searchParams.status || "all"}
            onChange={(val) => handleFilterChange?.("status", val)}
            options={STATUS_SELECT_OPTIONS}
            placeholder="Status"
            size="md"
          />
        </div>

        {/* Date Filter */}
        <div className="w-[150px] sm:w-[165px]">
          <UIDatePicker
            value={searchParams.date || ""}
            onChange={(val) => handleFilterChange?.("date", val || "")}
            placeholder="Select date"
            size="md"
            isClearable
          />
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleClearAllFilters}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
            className="h-10 px-2 text-xs text-text-muted hover:text-text"
            title="Reset all filters"
          >
            Reset
          </UIButton>
        )}

        {/* Action Cluster (Right Aligned) */}
        <div className="flex items-center gap-1.5 ml-auto">
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={handleRefresh}
            className="h-10 w-10 p-0 text-text-muted hover:text-text"
            title="Refresh deposit slips"
          >
            <RefreshCw
              className={cn("size-4 text-text-muted hover:text-primary", isLoading && "animate-spin text-primary")}
            />
          </UIButton>

          {canCreateSlip && (
            <PermissionGate permission="bank-deposit-slip:create">
              <UIButton
                type="button"
                variant="primary"
                size="md"
                startIcon={<Plus className="size-3.5" />}
                onClick={handleCreateNew}
                className="h-10 px-3.5 text-xs font-semibold shadow-xs"
              >
                Create Deposit Slip
              </UIButton>
            </PermissionGate>
          )}
        </div>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col">
        <div
          ref={tableContainerRef}
          className="relative overflow-y-auto overflow-x-auto flex-1 min-h-0"
        >
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
                <UITableHead sticky className="min-w-[190px]">Slip # & Date</UITableHead>
                {isCompanyLevel && (
                  <UITableHead sticky className="min-w-[150px]">Branch</UITableHead>
                )}
                <UITableHead sticky className="min-w-[220px]">Destination Bank</UITableHead>
                <UITableHead sticky className="min-w-[160px]">Prepared By</UITableHead>
                <UITableHead sticky align="center" className="min-w-[130px]">Denominations</UITableHead>
                <UITableHead sticky align="right" className="min-w-[140px]">Deposit Amount</UITableHead>
                <UITableHead sticky align="center" className="min-w-[120px]">Status</UITableHead>
                <UITableHead sticky align="right" className="min-w-[80px]">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={isCompanyLevel ? 8 : 7} rows={8} />
              ) : displayedSlips.length === 0 ? (
                <UITableEmpty
                  colSpan={isCompanyLevel ? 8 : 7}
                  title="No bank deposit slips found"
                  description={
                    isFiltered
                      ? "No deposit slips match your active filter criteria. Try clearing search or resetting filters."
                      : "No bank deposit slips prepared yet."
                  }
                  action={
                    isFiltered ? (
                      <UIButton
                        variant="secondary"
                        size="sm"
                        onClick={handleClearAllFilters}
                      >
                        Clear Filters
                      </UIButton>
                    ) : canCreateSlip ? (
                      <PermissionGate permission="bank-deposit-slip:create">
                        <UIButton
                          variant="primary"
                          size="sm"
                          startIcon={<Plus className="size-4" />}
                          onClick={handleCreateNew}
                        >
                          Create First Deposit Slip
                        </UIButton>
                      </PermissionGate>
                    ) : null
                  }
                />
              ) : (
                displayedSlips.map((slip) => {
                  const isPrepared = slip.status === "PREPARED" || slip.status === "PENDING";
                  const isDeposited = slip.status === "DEPOSITED";
                  const isCancelled = slip.status === "CANCELLED";

                  const bankAccount = slip.toBankAccountId || slip.bankAccount || {};
                  const bankName =
                    bankAccount.bank ||
                    bankAccount.bankMasterId?.bankName ||
                    bankAccount.accountName ||
                    "Corporate Bank";

                  const noteCount = (slip.denominations || []).reduce(
                    (sum, d) => sum + (Number(d.quantity) || 0),
                    0
                  );

                  return (
                    <UITableRow
                      key={slip._id}
                      onClick={() => handleViewDetails(slip)}
                      className="group cursor-pointer transition-colors hover:bg-surface-hover/70 h-13 border-b border-border/60 last:border-b-0"
                    >
                      {/* 1. Slip Number & Date */}
                      <UITableCell className="py-2.5">
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono font-bold text-xs sm:text-sm text-text group-hover:text-primary transition-colors">
                            {slip.slipNumber || "—"}
                          </span>
                          <span className="text-[11px] text-text-muted mt-0.5">
                            {dayjs(slip.slipDate).format("DD MMM YYYY")}
                          </span>
                        </div>
                      </UITableCell>

                      {/* Branch (Company Level) */}
                      {isCompanyLevel && (
                        <UITableCell className="py-2">
                          <BranchBadge branch={slip.branchId} />
                        </UITableCell>
                      )}

                      {/* 2. Destination Bank */}
                      <UITableCell className="py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-text truncate">
                            {bankName}
                          </span>
                          <span className="text-[11px] font-mono text-text-muted truncate mt-0.5">
                            {bankAccount.accountNumber
                              ? `•••• ${String(bankAccount.accountNumber).slice(-4)}`
                              : slip.bankBranchName || "—"}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 3. Prepared By / Bag */}
                      <UITableCell className="py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-text truncate">
                            {slip.preparedBy?.fullName || slip.preparedBy?.name || "Cashier"}
                          </span>
                          <span className="text-[11px] text-text-muted font-mono truncate mt-0.5">
                            {slip.depositBagReference ? `Bag: ${slip.depositBagReference}` : "Direct Counter"}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 4. Denominations */}
                      <UITableCell align="center" className="whitespace-nowrap py-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-surface-alt border border-border/70 text-text">
                          <Banknote className="size-3 text-text-muted" />
                          <span>{noteCount} notes</span>
                        </span>
                      </UITableCell>

                      {/* 5. Deposit Amount */}
                      <UITableCell align="right" className="whitespace-nowrap font-mono tabular-nums text-xs py-2">
                        <span className="font-bold text-text text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                          ₹{formatCurrency(slip.amount)}
                        </span>
                      </UITableCell>

                      {/* 6. Status */}
                      <UITableCell align="center" className="whitespace-nowrap py-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase border tracking-wider",
                            isDeposited
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : isCancelled
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              isDeposited
                                ? "bg-emerald-500"
                                : isCancelled
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            )}
                          />
                          <span>{slip.status}</span>
                        </span>
                      </UITableCell>

                      {/* 7. Actions */}
                      <UITableCell align="right" className="py-2" onClick={(e) => e.stopPropagation()}>
                        <UIDropdown>
                          <UIDropdownTrigger asChild>
                            <UIButton
                              variant="ghost"
                              size="sm"
                              className="size-8 p-0 text-text-muted hover:text-text cursor-pointer"
                              title="Actions"
                            >
                              <MoreVertical className="size-4" />
                            </UIButton>
                          </UIDropdownTrigger>
                          <UIDropdownMenu align="end" className="w-44">
                            <UIDropdownItem
                              icon={<Eye className="size-4 text-text-muted shrink-0" />}
                              onClick={() => handleViewDetails(slip)}
                            >
                              View Slip Details
                            </UIDropdownItem>

                            {isPrepared && (
                              <>
                                <UIDropdownItem
                                  icon={<CheckCircle2 className="size-4 text-emerald-600 shrink-0" />}
                                  onClick={() => handleConfirmDeposit(slip)}
                                >
                                  Confirm Deposit
                                </UIDropdownItem>

                                <UIDropdownDivider />
                                <UIDropdownItem
                                  destructive
                                  icon={<XCircle className="size-4 text-error shrink-0" />}
                                  onClick={() => handleCancelSlip(slip)}
                                >
                                  Cancel Slip
                                </UIDropdownItem>
                              </>
                            )}
                          </UIDropdownMenu>
                        </UIDropdown>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Infinite Scroll Sentinel */}
          {!isLoading && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BankDepositSlipsDesktopPage;
