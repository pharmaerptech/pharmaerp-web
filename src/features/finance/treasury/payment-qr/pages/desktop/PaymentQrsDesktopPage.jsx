// src/features/finance/treasury/payment-qr/pages/desktop/PaymentQrsDesktopPage.jsx

import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  QrCode,
  CheckCircle2,
  Star,
  Landmark,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  Plus,
  Copy,
  Check,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Sparkles,
  Smartphone,
  ExternalLink,
} from "lucide-react";
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
  PermissionGate,
  uiToast,
} from "@/components/ui";
import { usePermission } from "@/hooks";
import { BranchFilterSelect, BranchBadge } from "@/components/shared";
import { cn } from "@/lib/utils";

const PROVIDER_OPTIONS = [
  { label: "All Providers", value: "all" },
  { label: "Google Pay (GPay)", value: "GPAY" },
  { label: "PhonePe for Business", value: "PHONEPE" },
  { label: "Paytm Business", value: "PAYTM" },
  { label: "BHIM / UPI", value: "BHIM" },
  { label: "Razorpay POS", value: "RAZORPAY" },
  { label: "Cashfree", value: "CASHFREE" },
  { label: "Other Providers", value: "OTHER" },
];

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const INITIAL_BATCH = 20;

export const PaymentQrsDesktopPage = ({
  filters = {},
  stats: propStats = {},
  pagedQrs = [],
  totalQrs = 0,
  isLoading = false,
  serverError = null,
  serverMessage = null,
  handleFilterChange,
  handleClearFilters,
  handleRefresh,
  handleCreateQr,
  canCreateQr = true,
  handleEditQr,
  handleViewDetails,
  handleDeleteQr,
  handleSetPrimary,
  clearError,
  clearMessage,
  isCompanyLevel = false,
  selectedBranchId = "all",
  setSelectedBranchId,
}) => {
  const { can } = usePermission();
  const tableContainerRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);

  // Client-side Infinite Scroll state
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleCopyUpiId = (e, qr) => {
    e.stopPropagation();
    if (!qr?.upiId) return;
    navigator.clipboard.writeText(qr.upiId);
    setCopiedId(qr._id);
    uiToast.success("Copied to Clipboard", `UPI ID ${qr.upiId} copied.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getProviderBadge = (provider) => {
    const raw = String(provider || "").toUpperCase();
    let bg = "bg-surface-alt text-text-muted border-border";
    if (raw === "GPAY") bg = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
    else if (raw === "PHONEPE") bg = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
    else if (raw === "PAYTM") bg = "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30";
    else if (raw === "BHIM") bg = "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30";
    else if (raw === "RAZORPAY") bg = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30";
    else if (raw === "CASHFREE") bg = "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30";

    return (
      <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase border tracking-wider", bg)}>
        {raw || "UPI"}
      </span>
    );
  };

  const isFiltered = Boolean(
    filters.search ||
    (filters.provider && filters.provider !== "all") ||
    (filters.status && filters.status !== "all")
  );

  // Sliced list for infinite scroll
  const displayedQrs = useMemo(() => {
    const list = Array.isArray(pagedQrs) ? pagedQrs : [];
    return list.slice(0, visibleCount);
  }, [pagedQrs, visibleCount]);

  const hasMore = visibleCount < (pagedQrs?.length || 0);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 15, pagedQrs.length));
      setIsLoadingMore(false);
    }, 250);
  }, [pagedQrs.length, hasMore, isLoadingMore]);

  // Aggregate stats
  const stats = useMemo(() => {
    const list = Array.isArray(pagedQrs) ? pagedQrs : [];
    const totalCount = totalQrs || list.length;
    const activeCount = list.filter((q) => q.status === "ACTIVE" || q.isActive !== false).length;
    const primaryQr = list.find((q) => q.isPrimary);

    const bankAccountSet = new Set(
      list.map((q) => q.bankAccountId?._id || q.bankAccountId).filter(Boolean)
    );

    return {
      totalCount,
      activeCount,
      primaryQr,
      linkedBankCount: bankAccountSet.size,
    };
  }, [pagedQrs, totalQrs]);

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* ── 1. Compact 4-Card Statistics Grid (Top of Page) ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total QR Codes */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <QrCode className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total QR Registers
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalCount}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Configured counter QR stands
            </div>
          </div>
        </div>

        {/* Card 2: Active Counter QRs */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              Active Counter QRs
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {stats.activeCount}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Available at billing counters
            </div>
          </div>
        </div>

        {/* Card 3: Primary Counter QR */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Star className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400 truncate">
              Primary Standee QR
            </div>
            <div className="text-sm sm:text-base font-bold text-text leading-tight truncate">
              {stats.primaryQr?.label || stats.primaryQr?.upiId || "None"}
            </div>
            <div className="text-[10px] text-text-muted font-mono truncate mt-0.5">
              {stats.primaryQr ? stats.primaryQr.upiId : "No default designated"}
            </div>
          </div>
        </div>

        {/* Card 4: Linked Bank Accounts */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Landmark className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-primary truncate">
              Linked Bank Accounts
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.linkedBankCount}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Receiving merchant accounts
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
        <div className="w-[220px] sm:w-[260px] lg:w-[300px] shrink-0">
          <UIInput
            type="text"
            value={filters.search || ""}
            onChange={(e) => handleFilterChange?.("search", e.target.value)}
            placeholder="Search QR label, UPI ID, merchant..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleFilterChange?.("search", "")}
            className="w-full"
          />
        </div>

        {/* Provider Select */}
        <div className="w-[180px] sm:w-[200px]">
          <UISelect
            value={filters.provider || "all"}
            onChange={(val) => handleFilterChange?.("provider", val)}
            options={PROVIDER_OPTIONS}
            placeholder="Provider"
            size="md"
          />
        </div>

        {/* Status Select */}
        <div className="w-[130px] sm:w-[150px]">
          <UISelect
            value={filters.status || "all"}
            onChange={(val) => handleFilterChange?.("status", val)}
            options={STATUS_OPTIONS}
            placeholder="Status"
            size="md"
          />
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleClearFilters}
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
            title="Refresh payment QR stands"
          >
            <RefreshCw
              className={cn("size-4 text-text-muted hover:text-primary", isLoading && "animate-spin text-primary")}
            />
          </UIButton>

          {canCreateQr && (
            <PermissionGate permission="payment-qr:create">
              <UIButton
                type="button"
                variant="primary"
                size="md"
                startIcon={<Plus className="size-3.5" />}
                onClick={handleCreateQr}
                className="h-10 px-3.5 text-xs font-semibold shadow-xs"
              >
                Add QR Code
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
                <UITableHead sticky className="min-w-[220px]">Standee & Label</UITableHead>
                {isCompanyLevel && (
                  <UITableHead sticky className="min-w-[140px]">Branch</UITableHead>
                )}
                <UITableHead sticky className="min-w-[210px]">UPI Address</UITableHead>
                <UITableHead sticky align="center" className="min-w-[130px]">Provider</UITableHead>
                <UITableHead sticky className="min-w-[190px]">Linked Bank Account</UITableHead>
                <UITableHead sticky align="center" className="min-w-[110px]">Stand Type</UITableHead>
                <UITableHead sticky align="center" className="min-w-[100px]">Status</UITableHead>
                <UITableHead sticky align="right" className="min-w-[80px]">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={isCompanyLevel ? 8 : 7} rows={8} />
              ) : displayedQrs.length === 0 ? (
                <UITableEmpty
                  colSpan={isCompanyLevel ? 8 : 7}
                  title="No payment QR codes found"
                  description={
                    isFiltered
                      ? "No QR stands match your active filter criteria. Try clearing search or resetting filters."
                      : "No UPI payment QR codes configured for this counter yet."
                  }
                  action={
                    isFiltered ? (
                      <UIButton
                        variant="secondary"
                        size="sm"
                        onClick={handleClearFilters}
                      >
                        Clear Filters
                      </UIButton>
                    ) : canCreateQr ? (
                      <PermissionGate permission="payment-qr:create">
                        <UIButton
                          variant="primary"
                          size="sm"
                          startIcon={<Plus className="size-4" />}
                          onClick={handleCreateQr}
                        >
                          Add First QR Code
                        </UIButton>
                      </PermissionGate>
                    ) : null
                  }
                />
              ) : (
                displayedQrs.map((qr) => {
                  const isActive = qr.status === "ACTIVE" || qr.isActive !== false;
                  const isPrimary = Boolean(qr.isPrimary);
                  const bank = qr.bankAccountId || qr.bankAccount || {};
                  const bankName = bank.bank || bank.bankMasterId?.bankName || bank.accountName || "Bank";

                  return (
                    <UITableRow
                      key={qr._id}
                      onClick={() => handleViewDetails(qr)}
                      className="group cursor-pointer transition-colors hover:bg-surface-hover/70 h-13 border-b border-border/60 last:border-b-0"
                    >
                      {/* 1. Standee & Label */}
                      <UITableCell className="py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-8 rounded-lg bg-surface-alt border border-border/80 flex items-center justify-center text-text shrink-0 shadow-2xs">
                            <QrCode className="size-4 text-primary" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-text truncate hover:text-primary transition-colors text-xs sm:text-sm leading-tight">
                                {qr.label || qr.upiId}
                              </span>
                              {isPrimary && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  <Star className="size-2.5 fill-current" />
                                  Primary
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-text-muted truncate mt-0.5">
                              {qr.merchantName || "Counter POS Stand"}
                            </span>
                          </div>
                        </div>
                      </UITableCell>

                      {/* Branch (Company Level) */}
                      {isCompanyLevel && (
                        <UITableCell className="py-2.5">
                          <BranchBadge branch={qr.branchId} />
                        </UITableCell>
                      )}

                      {/* 2. UPI ID with Copy */}
                      <UITableCell className="py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-text tabular-nums tracking-wide">
                            {qr.upiId}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyUpiId(e, qr)}
                            className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-alt transition-colors cursor-pointer"
                            title="Copy UPI ID"
                          >
                            {copiedId === qr._id ? (
                              <Check className="size-3 text-emerald-600" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </UITableCell>

                      {/* 3. Provider */}
                      <UITableCell align="center" className="whitespace-nowrap py-2">
                        {getProviderBadge(qr.provider)}
                      </UITableCell>

                      {/* 4. Linked Bank Account */}
                      <UITableCell className="py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-text truncate">
                            {bank.accountName || bankName}
                          </span>
                          <span className="text-[11px] font-mono text-text-muted truncate mt-0.5">
                            {bank.accountNumber ? `•••• ${String(bank.accountNumber).slice(-4)}` : "Direct Merchant"}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 5. Stand Type */}
                      <UITableCell align="center" className="whitespace-nowrap py-2">
                        {isPrimary ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Star className="size-3 fill-current" />
                            Default
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-alt border border-border/70 text-text-muted">
                            Secondary
                          </span>
                        )}
                      </UITableCell>

                      {/* 6. Status */}
                      <UITableCell align="center" className="whitespace-nowrap py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              isActive ? "bg-emerald-500" : "bg-rose-500"
                            )}
                          />
                          <span
                            className={cn(
                              "text-xs font-semibold capitalize",
                              isActive
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-rose-700 dark:text-rose-400"
                            )}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
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
                          <UIDropdownMenu align="end" className="w-48">
                            <UIDropdownItem
                              icon={<Eye className="size-4 text-text-muted shrink-0" />}
                              onClick={() => handleViewDetails(qr)}
                            >
                              View Standee
                            </UIDropdownItem>

                            {can("payment-qr:update") && (
                              <UIDropdownItem
                                icon={<Edit3 className="size-4 text-text-muted shrink-0" />}
                                onClick={() => handleEditQr(qr)}
                              >
                                Edit QR Stand
                              </UIDropdownItem>
                            )}

                            {!isPrimary && can("payment-qr:update") && (
                              <UIDropdownItem
                                icon={<Star className="size-4 text-amber-500 shrink-0" />}
                                onClick={() => handleSetPrimary(qr._id)}
                              >
                                Set as Primary
                              </UIDropdownItem>
                            )}

                            <UIDropdownItem
                              icon={<Copy className="size-4 text-text-muted shrink-0" />}
                              onClick={(e) => handleCopyUpiId(e, qr)}
                            >
                              Copy UPI ID
                            </UIDropdownItem>

                            {can("payment-qr:delete") && (
                              <>
                                <UIDropdownDivider />
                                <UIDropdownItem
                                  destructive
                                  icon={<Trash2 className="size-4 text-error shrink-0" />}
                                  onClick={() => handleDeleteQr(qr)}
                                >
                                  Delete QR Stand
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

export default PaymentQrsDesktopPage;
