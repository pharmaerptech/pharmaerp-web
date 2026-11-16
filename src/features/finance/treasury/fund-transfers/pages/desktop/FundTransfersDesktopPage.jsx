// src/features/finance/treasury/fund-transfers/pages/desktop/FundTransfersDesktopPage.jsx

import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  ArrowLeftRight,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  Plus,
  MoreVertical,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  Building2,
  Landmark,
  Banknote,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Printer,
  Ban,
  Copy,
  Check,
} from "lucide-react";
import dayjs from "dayjs";
import {
  UIButton,
  UIInput,
  UISelect,
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
  UIConfirmDialog,
  PermissionGate,
  uiToast,
} from "@/components/ui";
import { usePermission } from "@/hooks";
import { CompanyFilterSelect } from "@/components/shared";
import { cn } from "@/lib/utils";

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Posted", value: "POSTED" },
  { label: "Draft", value: "DRAFT" },
  { label: "Cancelled", value: "CANCELLED" },
];

const TRANSFER_TYPE_OPTIONS = [
  { label: "All Transfer Types", value: "all" },
  { label: "Bank to Bank", value: "BANK_TO_BANK" },
  { label: "Cash to Bank (Deposit)", value: "CASH_TO_BANK" },
  { label: "Bank to Cash (Withdrawal)", value: "BANK_TO_CASH" },
  { label: "Cash to Cash", value: "CASH_TO_CASH" },
];

const INITIAL_BATCH = 20;

export const FundTransfersDesktopPage = ({
  fundTransfers = [],
  searchParams = {},
  isLoading = false,
  isCancelling = false,
  handleSearchChange,
  handleFilterChange,
  handleCancelTransfer,
  handleViewDetails,
  handleCreateNew,
  handleRefresh,
  companyFilter,
}) => {
  const { can } = usePermission();
  const tableContainerRef = useRef(null);

  // Client-side infinite scroll state
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Cancel dialog state
  const [cancelTargetTransfer, setCancelTargetTransfer] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key, e) => {
    if (e) e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    uiToast.success("Copied to Clipboard", `${text} copied.`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filter transfers by search, transferType, and status
  const filteredTransfers = useMemo(() => {
    const list = Array.isArray(fundTransfers) ? fundTransfers : [];
    const searchToken = String(searchParams.search || "").trim().toLowerCase();
    const statusToken = String(searchParams.status || "all").toUpperCase();
    const typeToken = String(searchParams.transferType || "all").toUpperCase();

    return list.filter((item) => {
      const transferNo = String(item.transferNumber || "").toLowerCase();
      const refNo = String(item.referenceNumber || "").toLowerCase();
      const narration = String(item.narration || "").toLowerCase();
      const fromName = String(
        item.fromAccount?.accountName ||
        item.fromAccount?.bank ||
        item.fromAccountId?.accountName ||
        ""
      ).toLowerCase();
      const toName = String(
        item.toAccount?.accountName ||
        item.toAccount?.bank ||
        item.toAccountId?.accountName ||
        ""
      ).toLowerCase();

      const matchesSearch =
        !searchToken ||
        transferNo.includes(searchToken) ||
        refNo.includes(searchToken) ||
        narration.includes(searchToken) ||
        fromName.includes(searchToken) ||
        toName.includes(searchToken);

      const matchesStatus =
        statusToken === "ALL" ||
        String(item.status || "").toUpperCase() === statusToken;

      const matchesType =
        typeToken === "ALL" ||
        String(item.transferType || "BANK_TO_BANK").toUpperCase() === typeToken;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [fundTransfers, searchParams]);

  // Sliced list for infinite scroll
  const displayedTransfers = useMemo(() => {
    return filteredTransfers.slice(0, visibleCount);
  }, [filteredTransfers, visibleCount]);

  const hasMore = visibleCount < filteredTransfers.length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 15, filteredTransfers.length));
      setIsLoadingMore(false);
    }, 200);
  }, [isLoadingMore, hasMore, filteredTransfers.length]);

  // Dynamic statistics
  const stats = useMemo(() => {
    const list = Array.isArray(fundTransfers) ? fundTransfers : [];
    let totalTransfers = list.length;
    let postedCount = 0;
    let draftCount = 0;
    let cancelledCount = 0;
    let totalVolume = 0;
    let b2bVolume = 0;
    let b2bCount = 0;
    let otherVolume = 0;
    let otherCount = 0;

    for (const item of list) {
      const isPosted = item.status === "POSTED" || item.status === "COMPLETED";
      const isDraft = item.status === "DRAFT";
      const isCancelled = item.status === "CANCELLED";
      const amt = Number(item.amount || 0);
      const isB2B = (item.transferType || "BANK_TO_BANK") === "BANK_TO_BANK";

      if (isPosted) {
        postedCount++;
        totalVolume += amt;
        if (isB2B) {
          b2bVolume += amt;
          b2bCount++;
        } else {
          otherVolume += amt;
          otherCount++;
        }
      } else if (isDraft) {
        draftCount++;
      } else if (isCancelled) {
        cancelledCount++;
      }
    }

    return {
      totalTransfers,
      postedCount,
      draftCount,
      cancelledCount,
      totalVolume,
      b2bVolume,
      b2bCount,
      otherVolume,
      otherCount,
    };
  }, [fundTransfers]);

  const hasActiveFilters = Boolean(
    (searchParams.search && searchParams.search.trim()) ||
    (searchParams.status && searchParams.status !== "all") ||
    (searchParams.transferType && searchParams.transferType !== "all")
  );

  const handleClearAllFilters = () => {
    handleSearchChange("");
    handleFilterChange("status", "all");
    handleFilterChange("transferType", "all");
    setVisibleCount(INITIAL_BATCH);
  };

  const handleOpenCancel = (transfer) => {
    setCancelTargetTransfer(transfer);
    setCancelReason("");
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetTransfer) return;
    const transferId = cancelTargetTransfer._id || cancelTargetTransfer.id;
    try {
      await handleCancelTransfer(transferId, cancelReason);
      uiToast.warning(
        "Fund Transfer Cancelled",
        `Transfer #${cancelTargetTransfer.transferNumber || ""} cancelled. Ledger entries reverted.`
      );
      setCancelTargetTransfer(null);
      setCancelReason("");
    } catch (err) {
      uiToast.error(
        "Cancellation Failed",
        typeof err === "string" ? err : err?.message || "Failed to cancel fund transfer."
      );
    }
  };

  const getTransferTypeBadge = (type = "BANK_TO_BANK") => {
    switch (type) {
      case "BANK_TO_BANK":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
            <Landmark className="size-3" />
            Bank to Bank
          </span>
        );
      case "CASH_TO_BANK":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <ArrowDownLeft className="size-3" />
            Cash to Bank
          </span>
        );
      case "BANK_TO_CASH":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
            <ArrowUpRight className="size-3" />
            Bank to Cash
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-alt border border-border text-text-muted">
            <ArrowLeftRight className="size-3" />
            {type}
          </span>
        );
    }
  };

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* ── 1. Compact 4-Card Statistics Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Transfers */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-indigo-600 dark:text-indigo-400 truncate flex items-center gap-1">
              <Sparkles className="size-3" />
              Fund Transfers
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalTransfers} Transfers
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {stats.postedCount} Posted · {stats.draftCount} Drafts · {stats.cancelledCount} Cancelled
            </div>
          </div>
        </div>

        {/* Card 2: Total Volume Transferred */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Banknote className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400 truncate">
              Volume Transferred
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              ₹{formatCurrency(stats.totalVolume)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Net posted inter-account volume
            </div>
          </div>
        </div>

        {/* Card 3: Bank to Bank Transfers */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Landmark className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-blue-600 dark:text-blue-400 truncate">
              Bank to Bank
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.b2bVolume)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {stats.b2bCount} Interbank transfers
            </div>
          </div>
        </div>

        {/* Card 4: Other / Counter Adjustments */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Wallet className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-purple-600 dark:text-purple-400 truncate">
              Cash / Bank Adjustments
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.otherVolume)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {stats.otherCount} Cash ↔ Bank transfers
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Table Filter Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Search Input */}
        <div className="flex-1 min-w-[220px] sm:min-w-[260px]">
          <UIInput
            type="text"
            value={searchParams.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search transfer #, UTR, bank account, or narration..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange("")}
            className="w-full"
          />
        </div>

        {/* Transfer Type Selector */}
        <div className="w-[180px] sm:w-[200px]">
          <UISelect
            value={searchParams.transferType || "all"}
            onChange={(val) => handleFilterChange("transferType", val)}
            options={TRANSFER_TYPE_OPTIONS}
            placeholder="Transfer Type"
            size="md"
          />
        </div>

        {/* Workspace Company Filter */}
        <CompanyFilterSelect
          companyFilter={companyFilter}
          className="w-[180px] sm:w-[200px]"
        />

        {/* Status Selector */}
        <div className="w-[150px]">
          <UISelect
            value={searchParams.status || "all"}
            onChange={(val) => handleFilterChange("status", val)}
            options={STATUS_OPTIONS}
            placeholder="Status"
            size="md"
          />
        </div>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <UIButton
            type="button"
            variant="secondary"
            size="md"
            onClick={handleClearAllFilters}
            startIcon={<RotateCcw className="size-4 text-text-muted" />}
            className="h-10 px-3.5 shrink-0"
            title="Reset Filters"
          >
            Reset
          </UIButton>
        )}

        {/* Refresh Button */}
        <UIButton
          type="button"
          variant="secondary"
          size="md"
          disabled={isLoading}
          onClick={handleRefresh}
          startIcon={
            <RefreshCw
              className={cn("size-4 text-primary", isLoading && "animate-spin")}
            />
          }
          className="h-10 px-3.5 shrink-0"
          title="Refresh Fund Transfers"
        >
          Refresh
        </UIButton>

        {/* Primary Action Button: New Fund Transfer */}
        <PermissionGate permission="fund-transfer:create">
          <UIButton
            type="button"
            variant="primary"
            size="md"
            startIcon={<Plus className="size-4" />}
            onClick={handleCreateNew}
            className="h-10 px-4 font-bold shadow-xs shrink-0 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            New Fund Transfer
          </UIButton>
        </PermissionGate>
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
            <UITableHeader>
              <UITableRow className="h-10 hover:bg-transparent border-b border-border bg-surface-alt/75 backdrop-blur-xs">
                <UITableHead className="w-[170px] font-bold text-xs">
                  Transfer # & Date
                </UITableHead>
                <UITableHead className="w-[200px] font-bold text-xs">
                  Source Account (From)
                </UITableHead>
                <UITableHead className="w-[200px] font-bold text-xs">
                  Destination Account (To)
                </UITableHead>
                <UITableHead className="w-[150px] font-bold text-xs">
                  Type
                </UITableHead>
                <UITableHead align="right" className="w-[130px] font-bold text-xs">
                  Amount
                </UITableHead>
                <UITableHead className="w-[140px] font-bold text-xs">
                  Reference / UTR
                </UITableHead>
                <UITableHead align="center" className="w-[110px] font-bold text-xs">
                  Status
                </UITableHead>
                <UITableHead align="right" className="w-[60px] font-bold text-xs">
                  Actions
                </UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading && displayedTransfers.length === 0 ? (
                <UITableLoading rows={7} columns={8} />
              ) : displayedTransfers.length === 0 ? (
                <UITableEmpty
                  colSpan={8}
                  title="No Fund Transfers Found"
                  description={
                    hasActiveFilters
                      ? "No transfers matched your filter criteria. Try broadening your search or reset filters."
                      : "No internal fund transfers recorded yet."
                  }
                  action={
                    hasActiveFilters ? (
                      <UIButton
                        variant="secondary"
                        size="sm"
                        onClick={handleClearAllFilters}
                      >
                        Clear Filters
                      </UIButton>
                    ) : (
                      <PermissionGate permission="fund-transfer:create">
                        <UIButton
                          variant="primary"
                          size="sm"
                          startIcon={<Plus className="size-4" />}
                          onClick={handleCreateNew}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Record First Fund Transfer
                        </UIButton>
                      </PermissionGate>
                    )
                  }
                />
              ) : (
                displayedTransfers.map((item) => {
                  const isPosted = item.status === "POSTED" || item.status === "COMPLETED";
                  const isDraft = item.status === "DRAFT";
                  const isCancelled = item.status === "CANCELLED";

                  const fromName =
                    item.fromAccount?.bank ||
                    item.fromAccount?.accountName ||
                    item.fromAccountId?.accountName ||
                    "Source Account";

                  const fromAccNo =
                    item.fromAccount?.accountNumber ||
                    item.fromAccountId?.accountNumber;

                  const toName =
                    item.toAccount?.bank ||
                    item.toAccount?.accountName ||
                    item.toAccountId?.accountName ||
                    "Destination Account";

                  const toAccNo =
                    item.toAccount?.accountNumber ||
                    item.toAccountId?.accountNumber;

                  return (
                    <UITableRow
                      key={item._id || item.id}
                      onClick={() => handleViewDetails(item)}
                      className="group cursor-pointer transition-colors hover:bg-surface-hover/70 h-13 border-b border-border/60 last:border-b-0"
                    >
                      {/* 1. Transfer # & Date */}
                      <UITableCell className="py-2.5">
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono font-bold text-xs sm:text-sm text-text group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {item.transferNumber || "—"}
                          </span>
                          <span className="text-[11px] text-text-muted mt-0.5">
                            {dayjs(item.transferDate || item.createdAt).format("DD MMM YYYY")}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 2. Source Account (Debited) */}
                      <UITableCell className="py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-text truncate">
                            {fromName}
                          </span>
                          <span className="text-[11px] font-mono text-text-muted truncate mt-0.5">
                            {fromAccNo ? `•••• ${String(fromAccNo).slice(-4)}` : "Debited"}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 3. Destination Account (Credited) */}
                      <UITableCell className="py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-text truncate">
                            {toName}
                          </span>
                          <span className="text-[11px] font-mono text-text-muted truncate mt-0.5">
                            {toAccNo ? `•••• ${String(toAccNo).slice(-4)}` : "Credited"}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 4. Type */}
                      <UITableCell className="py-2">
                        {getTransferTypeBadge(item.transferType)}
                      </UITableCell>

                      {/* 5. Amount */}
                      <UITableCell
                        align="right"
                        className="whitespace-nowrap font-mono tabular-nums text-xs py-2"
                      >
                        <span className="font-bold text-text text-xs sm:text-sm text-indigo-600 dark:text-indigo-400">
                          ₹{formatCurrency(item.amount)}
                        </span>
                      </UITableCell>

                      {/* 6. Reference / UTR */}
                      <UITableCell className="py-2">
                        {item.referenceNumber ? (
                          <div
                            onClick={(e) => handleCopy(item.referenceNumber, item._id, e)}
                            className="inline-flex items-center gap-1 font-mono text-xs text-text hover:text-indigo-600 cursor-pointer transition"
                            title="Click to copy UTR"
                          >
                            <span>{item.referenceNumber}</span>
                            {copiedKey === item._id ? (
                              <Check className="size-3 text-emerald-600" />
                            ) : (
                              <Copy className="size-3 text-text-muted opacity-70" />
                            )}
                          </div>
                        ) : (
                          <span className="text-text-muted text-[11px]">—</span>
                        )}
                      </UITableCell>

                      {/* 7. Status */}
                      <UITableCell align="center" className="whitespace-nowrap py-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border tracking-wider",
                            isPosted
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : isCancelled
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              isPosted
                                ? "bg-emerald-500"
                                : isCancelled
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            )}
                          />
                          <span>{item.status || "POSTED"}</span>
                        </span>
                      </UITableCell>

                      {/* 8. Actions */}
                      <UITableCell
                        align="right"
                        className="py-2"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                              onClick={() => handleViewDetails(item)}
                            >
                              View Details
                            </UIDropdownItem>
                            <UIDropdownItem
                              icon={<Printer className="size-4 text-text-muted shrink-0" />}
                              onClick={() => {
                                handleViewDetails(item);
                                setTimeout(() => window.print(), 300);
                              }}
                            >
                              Print Voucher
                            </UIDropdownItem>

                            {isPosted && (
                              <PermissionGate permission="fund-transfer:cancel">
                                <UIDropdownDivider />
                                <UIDropdownItem
                                  destructive
                                  icon={<Ban className="size-4 text-danger shrink-0" />}
                                  onClick={() => handleOpenCancel(item)}
                                >
                                  Cancel Transfer
                                </UIDropdownItem>
                              </PermissionGate>
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

          {!isLoading && displayedTransfers.length > 0 && (
            <UIInfiniteScroll
              hasMore={hasMore}
              isLoading={isLoadingMore}
              onLoadMore={handleLoadMore}
              rootRef={tableContainerRef}
              threshold={0.8}
            />
          )}
        </div>
      </div>

      {/* ── Cancel Transfer Confirmation Dialog ── */}
      <UIConfirmDialog
        isOpen={Boolean(cancelTargetTransfer)}
        onClose={() => setCancelTargetTransfer(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Fund Transfer?"
        description={
          cancelTargetTransfer ? (
            <div className="space-y-2 mt-2">
              <p className="text-xs text-text-muted">
                Are you sure you want to cancel fund transfer{" "}
                <strong className="text-text font-mono">
                  #{cancelTargetTransfer.transferNumber}
                </strong>{" "}
                of{" "}
                <strong className="text-text font-mono">
                  ₹{formatCurrency(cancelTargetTransfer.amount)}
                </strong>
                ? Debited and credited accounts will be reversed in the ledger.
              </p>
              <div className="mt-3">
                <label className="text-xs font-medium text-text block mb-1">
                  Cancellation Reason (Optional)
                </label>
                <UIInput
                  type="text"
                  placeholder="e.g., Wrong bank selected, duplicate entry..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  size="sm"
                />
              </div>
            </div>
          ) : null
        }
        confirmText="Cancel Transfer"
        cancelText="Keep Transfer"
        intent="danger"
        isLoading={isCancelling}
      />
    </div>
  );
};

export default FundTransfersDesktopPage;
