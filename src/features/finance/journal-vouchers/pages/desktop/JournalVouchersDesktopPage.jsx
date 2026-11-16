// src/features/finance/journal-vouchers/pages/desktop/JournalVouchersDesktopPage.jsx

import React, { useState, useRef, useMemo } from "react";
import {
  BookOpen,
  Receipt,
  ArrowLeftRight,
  Scale,
  Search,
  RefreshCw,
  RotateCcw,
  Plus,
  Eye,
  Edit3,
  MoreVertical,
  CheckCircle2,
  Calendar,
  FileText,
  Copy,
  Check,
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
  UIDropdown,
  UIDropdownTrigger,
  UIDropdownMenu,
  UIDropdownItem,
  PermissionGate,
  uiToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks";
import { CompanyFilterSelect } from "@/components/shared";

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const typeOptions = [
  { label: "All Voucher Types", value: "all" },
  { label: "Adjustment (JOURNAL)", value: "JOURNAL" },
  { label: "Cash Transfer (CONTRA)", value: "CONTRA" },
  { label: "Payment Made (PAYMENT)", value: "PAYMENT" },
  { label: "Payment Received (RECEIPT)", value: "RECEIPT" },
  { label: "Opening Balance", value: "OPENING_BALANCE" },
];

const statusOptions = [
  { label: "All Status", value: "all" },
  { label: "Posted", value: "POSTED" },
  { label: "Draft", value: "DRAFT" },
  { label: "Cancelled", value: "CANCELLED" },
];

const TYPE_BADGE_MAP = {
  JOURNAL: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
  CONTRA: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  PAYMENT: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  RECEIPT: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  OPENING_BALANCE: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
};

export const JournalVouchersDesktopPage = ({
  journalVouchers = [],
  searchParams = { search: "", voucherType: "all", status: "all" },
  companyFilter,
  currentPage = 1,
  pageSize = 100,
  totalVouchers = 0,
  isLoading = false,
  handleSearchChange,
  handleFilterChange,
  handlePageChange,
  handleRefresh,
  handleCreate,
  handleViewVoucher,
  handleEditVoucher,
}) => {
  const tableContainerRef = useRef(null);
  const { can } = usePermission();
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(String(text));
    setCopiedKey(key);
    uiToast.success("Copied to Clipboard", `${text} copied.`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Stat cards calculation
  const statCards = useMemo(() => {
    const list = Array.isArray(journalVouchers) ? journalVouchers : [];
    let journalCount = 0;
    let paymentReceiptCount = 0;
    let contraCount = 0;

    list.forEach((v) => {
      const type = String(v.voucherType || "").toUpperCase();
      if (type === "JOURNAL") journalCount++;
      else if (type === "PAYMENT" || type === "RECEIPT") paymentReceiptCount++;
      else if (type === "CONTRA") contraCount++;
    });

    return [
      {
        id: "total",
        title: "Total Vouchers",
        value: totalVouchers || list.length,
        subtitle: "Recorded Double-Entries",
        icon: BookOpen,
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
      },
      {
        id: "journals",
        title: "Adjustment Vouchers",
        value: journalCount,
        subtitle: "General Ledger Adjustments",
        icon: Receipt,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      },
      {
        id: "payments-receipts",
        title: "Payments & Receipts",
        value: paymentReceiptCount,
        subtitle: "Cash/Bank Settlements",
        icon: ArrowLeftRight,
        color: "text-sky-600 dark:text-sky-400",
        bg: "bg-sky-500/10",
        border: "border-sky-500/20",
      },
      {
        id: "contra",
        title: "Contra Transfers",
        value: contraCount,
        subtitle: "Internal Bank Transfers",
        icon: Scale,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
      },
    ];
  }, [journalVouchers, totalVouchers]);

  const hasActiveFilters = Boolean(
    searchParams.search ||
    (searchParams.voucherType && searchParams.voucherType !== "all") ||
    (searchParams.status && searchParams.status !== "all")
  );

  const handleClearFilters = () => {
    handleSearchChange("");
    handleFilterChange("voucherType", "all");
    handleFilterChange("status", "all");
  };

  const getVoucherAmount = (voucher) => {
    if (voucher.amount !== undefined && voucher.amount !== null) return voucher.amount;
    if (Array.isArray(voucher.lines)) {
      return voucher.lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
    }
    return 0;
  };

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden select-none">
      {/* ── 1. Compact 4-Card Statistics Grid ───────────────────────────── */}
      <div className="shrink-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors"
              >
                <div
                  className={cn(
                    "size-9 rounded-lg flex items-center justify-center shrink-0 border",
                    stat.bg,
                    stat.border,
                    stat.color
                  )}
                >
                  <Icon className="size-4.5 stroke-[1.8]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11.5px] font-medium text-text-muted truncate">
                    {stat.title}
                  </div>
                  <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-text-muted truncate mt-0.5">
                    {stat.subtitle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Toolbar ────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {/* Search Input */}
        <div className="flex-1 min-w-[240px] sm:min-w-[280px]">
          <UIInput
            type="text"
            value={searchParams.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search voucher number, ref, narration..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange("")}
            className="w-full"
          />
        </div>

        {/* Workspace Level Company Filter (Zero width/elements at Company level) */}
        <CompanyFilterSelect
          value={companyFilter?.selectedCompanyId || "all"}
          onChange={companyFilter?.setSelectedCompanyId}
          size="md"
          className="w-[170px] sm:w-[195px]"
        />

        {/* Voucher Type Select */}
        <div className="w-[180px] sm:w-[210px]">
          <UISelect
            name="voucherType"
            value={searchParams.voucherType || "all"}
            onChange={(val) => handleFilterChange("voucherType", val)}
            options={typeOptions}
            placeholder="All Voucher Types"
            size="md"
          />
        </div>

        {/* Status Select */}
        <div className="w-[125px] sm:w-[140px]">
          <UISelect
            name="status"
            value={searchParams.status || "all"}
            onChange={(val) => handleFilterChange("status", val)}
            options={statusOptions}
            placeholder="All Status"
            size="md"
          />
        </div>

        {/* Quick Reset */}
        {hasActiveFilters && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleClearFilters}
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
            onClick={handleRefresh}
            className="h-10 w-10 p-0 text-text-muted hover:text-text cursor-pointer"
            title="Refresh vouchers"
          >
            <RefreshCw
              className={cn(
                "size-4 text-text-muted hover:text-primary",
                isLoading && "animate-spin text-primary"
              )}
            />
          </UIButton>

          <PermissionGate permission="journal-voucher:create">
            <UIButton
              type="button"
              variant="primary"
              size="md"
              startIcon={<Plus className="size-4" />}
              onClick={handleCreate}
              className="h-10 px-3.5 text-xs font-semibold shadow-xs"
            >
              Create Voucher
            </UIButton>
          </PermissionGate>
        </div>
      </div>

      {/* ── 3. Fixed Table Container with Internal Scroll ────────────────── */}
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
                <UITableHead sticky className="min-w-[170px]">Voucher No / Ref</UITableHead>
                <UITableHead sticky align="center" className="min-w-[130px]">Type</UITableHead>
                <UITableHead sticky className="min-w-[120px]">Date</UITableHead>
                <UITableHead sticky className="min-w-[240px]">Narration / Remarks</UITableHead>
                <UITableHead sticky align="right" className="min-w-[130px]">Amount (₹)</UITableHead>
                <UITableHead sticky align="center" className="min-w-[80px]">Lines</UITableHead>
                <UITableHead sticky align="center" className="min-w-[100px]">Status</UITableHead>
                <UITableHead sticky align="right" className="min-w-[70px]">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading colSpan={8} rows={8} />
              ) : journalVouchers.length === 0 ? (
                <UITableEmpty
                  colSpan={8}
                  title="No vouchers found"
                  description={
                    hasActiveFilters
                      ? "No journal vouchers match your search or filter options. Try resetting filters."
                      : "No double-entry journal vouchers recorded yet."
                  }
                  action={
                    hasActiveFilters ? (
                      <UIButton
                        variant="secondary"
                        size="sm"
                        onClick={handleClearFilters}
                      >
                        Clear Filters
                      </UIButton>
                    ) : (
                      <UIButton
                        variant="primary"
                        size="sm"
                        startIcon={<Plus className="size-4" />}
                        onClick={handleCreate}
                      >
                        Create First Voucher
                      </UIButton>
                    )
                  }
                />
              ) : (
                journalVouchers.map((v) => {
                  const voucherId = v._id || v.id;
                  const voucherNum = v.voucherNumber || v.referenceNumber || "—";
                  const voucherType = String(v.voucherType || "JOURNAL").toUpperCase();
                  const typeClass =
                    TYPE_BADGE_MAP[voucherType] || "bg-surface-alt text-text-muted border-border";
                  const amt = getVoucherAmount(v);
                  const lineCount = (v.lines || []).length;

                  return (
                    <UITableRow
                      key={voucherId}
                      onClick={() => handleViewVoucher(voucherId)}
                      className="group cursor-pointer transition-colors hover:bg-surface-hover/70 h-12.5"
                    >
                      {/* Voucher / Ref No */}
                      <UITableCell className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-text group-hover:text-primary transition-colors">
                            {voucherNum}
                          </span>
                          {voucherNum !== "—" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(voucherNum, `ref-${voucherId}`);
                              }}
                              className="text-text-muted hover:text-text transition-colors p-0.5 cursor-pointer"
                              title="Copy voucher number"
                            >
                              {copiedKey === `ref-${voucherId}` ? (
                                <Check className="size-3 text-emerald-600" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </UITableCell>

                      {/* Voucher Type */}
                      <UITableCell align="center" className="py-2">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold border uppercase",
                            typeClass
                          )}
                        >
                          {voucherType}
                        </span>
                      </UITableCell>

                      {/* Date */}
                      <UITableCell className="py-2 text-xs font-medium text-text">
                        {v.voucherDate
                          ? new Date(v.voucherDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </UITableCell>

                      {/* Narration */}
                      <UITableCell className="py-2">
                        <p className="text-xs text-text-muted truncate max-w-[320px]">
                          {v.narration || "No custom narration"}
                        </p>
                      </UITableCell>

                      {/* Total Amount */}
                      <UITableCell align="right" className="font-mono tabular-nums text-xs py-2 font-black text-emerald-600 dark:text-emerald-400">
                        ₹{formatCurrency(amt)}
                      </UITableCell>

                      {/* Lines Count */}
                      <UITableCell align="center" className="py-2 font-mono text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-surface-alt border border-border text-text-muted text-[11px] font-semibold">
                          {lineCount} Lines
                        </span>
                      </UITableCell>

                      {/* Status */}
                      <UITableCell align="center" className="py-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border",
                            v.status === "POSTED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-surface-alt text-text-muted border-border"
                          )}
                        >
                          <CheckCircle2 className="size-2.5" />
                          <span>{v.status || "POSTED"}</span>
                        </span>
                      </UITableCell>

                      {/* Actions */}
                      <UITableCell align="right" className="py-2">
                        <div
                          className="flex items-center justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <UIDropdown>
                            <UIDropdownTrigger asChild>
                              <button
                                type="button"
                                className="size-7 rounded-md flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt transition-colors cursor-pointer"
                                title="Actions"
                              >
                                <MoreVertical className="size-3.5" />
                              </button>
                            </UIDropdownTrigger>
                            <UIDropdownMenu align="right" className="w-40 shadow-lg">
                              <UIDropdownItem
                                icon={<Eye className="size-4 text-text-muted shrink-0" />}
                                onClick={(e) => {
                                  e?.stopPropagation?.();
                                  handleViewVoucher(voucherId);
                                }}
                              >
                                View Details
                              </UIDropdownItem>
                              {can("journal-voucher:update") && (
                                <UIDropdownItem
                                  icon={<Edit3 className="size-4 text-text-muted shrink-0" />}
                                  onClick={(e) => {
                                    e?.stopPropagation?.();
                                    handleEditVoucher(voucherId);
                                  }}
                                >
                                  Edit Voucher
                                </UIDropdownItem>
                              )}
                            </UIDropdownMenu>
                          </UIDropdown>
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
              onLoadMore={() => handlePageChange?.(currentPage + 1)}
              hasMore={journalVouchers.length < totalVouchers}
              isLoading={isLoading}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                journalVouchers.length >= totalVouchers && journalVouchers.length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none">
                    ✓ All {totalVouchers} matching journal vouchers loaded
                  </span>
                ) : null
              }
            />
          )}
        </UITableScrollArea>
      </div>
    </div>
  );
};

export default JournalVouchersDesktopPage;
