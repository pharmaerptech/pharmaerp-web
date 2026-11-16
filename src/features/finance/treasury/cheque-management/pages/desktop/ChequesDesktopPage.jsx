// src/features/finance/treasury/cheque-management/pages/desktop/ChequesDesktopPage.jsx

import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  Plus,
  MoreVertical,
  Eye,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Building2,
  Landmark,
  Banknote,
  Sparkles,
  Printer,
  Ban,
  Clock,
  Send,
  AlertOctagon,
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
import { ClearChequeModal, BounceChequeModal, CancelChequeModal } from "../../components/ChequeActionModals";

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const CHEQUE_TYPE_OPTIONS = [
  { label: "All Cheque Types", value: "all" },
  { label: "Received Cheques (Customer)", value: "RECEIVED" },
  { label: "Issued Cheques (Supplier)", value: "ISSUED" },
];

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Deposited", value: "DEPOSITED" },
  { label: "Cleared", value: "CLEARED" },
  { label: "Bounced", value: "BOUNCED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const INITIAL_BATCH = 20;

export const ChequesDesktopPage = ({
  cheques = [],
  searchParams = {},
  isLoading = false,
  handleSearchChange,
  handleFilterChange,
  handleDeposit,
  handleClear,
  handleBounce,
  handleCancel,
  handleViewDetails,
  handleCreateNew,
  handleEditCheque,
  handleRefresh,
  companyFilter,
}) => {
  const { can } = usePermission();
  const tableContainerRef = useRef(null);

  // Client-side infinite scroll state
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Action dialogs state
  const [depositTargetCheque, setDepositTargetCheque] = useState(null);
  const [clearModalTarget, setClearModalTarget] = useState(null);
  const [bounceModalTarget, setBounceModalTarget] = useState(null);
  const [cancelModalTarget, setCancelModalTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter cheques by search, type, and status
  const filteredCheques = useMemo(() => {
    const list = Array.isArray(cheques) ? cheques : [];
    const searchToken = String(searchParams.search || "").trim().toLowerCase();
    const statusToken = String(searchParams.status || "all").toUpperCase();
    const typeToken = String(searchParams.chequeType || "all").toUpperCase();

    return list.filter((c) => {
      const chequeNo = String(c.chequeNumber || "").toLowerCase();
      const party = String(c.partyName || "").toLowerCase();
      const bank = String(
        c.bankAccount?.bank ||
        c.bankAccount?.accountName ||
        c.bankAccountId?.accountName ||
        ""
      ).toLowerCase();
      const remarks = String(c.remarks || "").toLowerCase();

      const matchesSearch =
        !searchToken ||
        chequeNo.includes(searchToken) ||
        party.includes(searchToken) ||
        bank.includes(searchToken) ||
        remarks.includes(searchToken);

      const matchesStatus =
        statusToken === "ALL" ||
        String(c.status || "").toUpperCase() === statusToken;

      const matchesType =
        typeToken === "ALL" ||
        String(c.chequeType || c.type || "RECEIVED").toUpperCase() === typeToken;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [cheques, searchParams]);

  // Sliced list for infinite scroll
  const displayedCheques = useMemo(() => {
    return filteredCheques.slice(0, visibleCount);
  }, [filteredCheques, visibleCount]);

  const hasMore = visibleCount < filteredCheques.length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 15, filteredCheques.length));
      setIsLoadingMore(false);
    }, 200);
  }, [isLoadingMore, hasMore, filteredCheques.length]);

  // Dynamic statistics
  const stats = useMemo(() => {
    const list = Array.isArray(cheques) ? cheques : [];
    let totalCheques = list.length;
    let pendingAmt = 0;
    let pendingCount = 0;
    let clearedAmt = 0;
    let clearedCount = 0;
    let bouncedCount = 0;
    let bouncedAmt = 0;

    for (const c of list) {
      const amt = Number(c.amount || 0);
      const isPending = c.status === "PENDING" || c.status === "DEPOSITED" || c.status === "RECEIVED";
      const isCleared = c.status === "CLEARED";
      const isBounced = c.status === "BOUNCED";

      if (isPending) {
        pendingAmt += amt;
        pendingCount++;
      } else if (isCleared) {
        clearedAmt += amt;
        clearedCount++;
      } else if (isBounced) {
        bouncedAmt += amt;
        bouncedCount++;
      }
    }

    return {
      totalCheques,
      pendingAmt,
      pendingCount,
      clearedAmt,
      clearedCount,
      bouncedCount,
      bouncedAmt,
    };
  }, [cheques]);

  const hasActiveFilters = Boolean(
    (searchParams.search && searchParams.search.trim()) ||
    (searchParams.status && searchParams.status !== "all") ||
    (searchParams.chequeType && searchParams.chequeType !== "all")
  );

  const handleClearAllFilters = () => {
    handleSearchChange("");
    handleFilterChange("status", "all");
    handleFilterChange("chequeType", "all");
    setVisibleCount(INITIAL_BATCH);
  };

  const confirmDeposit = async () => {
    if (!depositTargetCheque) return;
    setActionLoading(true);
    try {
      await handleDeposit(depositTargetCheque._id || depositTargetCheque.id);
      uiToast.success(
        "Cheque Deposited",
        `Cheque #${depositTargetCheque.chequeNumber} marked as deposited in bank.`
      );
      setDepositTargetCheque(null);
    } catch (err) {
      uiToast.error("Deposit Failed", typeof err === "string" ? err : err?.message || "Failed to deposit cheque.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmClear = async (clearData) => {
    if (!clearModalTarget) return;
    setActionLoading(true);
    try {
      await handleClear(clearModalTarget._id || clearModalTarget.id, clearData);
      uiToast.success(
        "Cheque Cleared",
        `Cheque #${clearModalTarget.chequeNumber} cleared and funds credited.`
      );
      setClearModalTarget(null);
    } catch (err) {
      uiToast.error("Clearance Failed", typeof err === "string" ? err : err?.message || "Failed to clear cheque.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmBounce = async (bounceData, optionalCharges) => {
    if (!bounceModalTarget) return;
    setActionLoading(true);
    try {
      const reason = typeof bounceData === "object" && bounceData !== null ? bounceData.reason : bounceData;
      const charges = typeof bounceData === "object" && bounceData !== null ? bounceData.bounceCharges : optionalCharges;
      await handleBounce(bounceModalTarget._id || bounceModalTarget.id, reason, charges);
      uiToast.error(
        "Cheque Bounced",
        `Cheque #${bounceModalTarget.chequeNumber} marked as bounced with reason: ${reason || "Unspecified"}`
      );
      setBounceModalTarget(null);
    } catch (err) {
      uiToast.error("Bounce Record Failed", typeof err === "string" ? err : err?.message || "Failed to mark bounced.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmCancel = async (cancelData) => {
    if (!cancelModalTarget) return;
    setActionLoading(true);
    try {
      const reason = typeof cancelData === "object" && cancelData !== null ? cancelData.reason : cancelData;
      await handleCancel(cancelModalTarget._id || cancelModalTarget.id, reason);
      uiToast.warning(
        "Cheque Cancelled",
        `Cheque #${cancelModalTarget.chequeNumber} has been cancelled.`
      );
      setCancelModalTarget(null);
    } catch (err) {
      uiToast.error("Cancellation Failed", typeof err === "string" ? err : err?.message || "Failed to cancel cheque.");
    } finally {
      setActionLoading(false);
    }
  };


  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* ── 1. Compact 4-Card Statistics Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Cheques */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <CreditCard className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400 truncate flex items-center gap-1">
              <Sparkles className="size-3" />
              Cheque Register
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalCheques} Cheques
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {stats.pendingCount} In Transit · {stats.clearedCount} Cleared
            </div>
          </div>
        </div>

        {/* Card 2: Total Pending / In-Transit */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-blue-600 dark:text-blue-400 truncate">
              Pending / In-Transit
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums text-blue-600 dark:text-blue-400">
              ₹{formatCurrency(stats.pendingAmt)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {stats.pendingCount} Cheques awaiting clearance
            </div>
          </div>
        </div>

        {/* Card 3: Cleared Volume */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400 truncate">
              Cleared Volume
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              ₹{formatCurrency(stats.clearedAmt)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {stats.clearedCount} Successfully deposited & cleared
            </div>
          </div>
        </div>

        {/* Card 4: Bounced / Disputed */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-rose-600 dark:text-rose-400 truncate">
              Bounced / Cancelled
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.bouncedCount} Bounced
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              ₹{formatCurrency(stats.bouncedAmt)} Disputed value
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
            placeholder="Search cheque #, party name, bank, or remarks..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange("")}
            className="w-full"
          />
        </div>

        {/* Cheque Type Selector */}
        <div className="w-[180px] sm:w-[210px]">
          <UISelect
            value={searchParams.chequeType || "all"}
            onChange={(val) => handleFilterChange("chequeType", val)}
            options={CHEQUE_TYPE_OPTIONS}
            placeholder="Cheque Type"
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
          title="Refresh Cheques"
        >
          Refresh
        </UIButton>

        {/* Primary Action Button: Record Cheque */}
        <PermissionGate permission="cheque:create">
          <UIButton
            type="button"
            variant="primary"
            size="md"
            startIcon={<Plus className="size-4" />}
            onClick={handleCreateNew}
            className="h-10 px-4 font-bold shadow-xs shrink-0 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
          >
            Record Cheque
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
                  Cheque # & Date
                </UITableHead>
                <UITableHead className="w-[160px] font-bold text-xs">
                  Cheque Type
                </UITableHead>
                <UITableHead className="w-[200px] font-bold text-xs">
                  Party Name
                </UITableHead>
                <UITableHead className="w-[190px] font-bold text-xs">
                  Bank Account
                </UITableHead>
                <UITableHead align="right" className="w-[130px] font-bold text-xs">
                  Amount
                </UITableHead>
                <UITableHead className="w-[140px] font-bold text-xs">
                  Clearance Date
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
              {isLoading && displayedCheques.length === 0 ? (
                <UITableLoading rows={7} columns={8} />
              ) : displayedCheques.length === 0 ? (
                <UITableEmpty
                  colSpan={8}
                  title="No Cheques Found"
                  description={
                    hasActiveFilters
                      ? "No cheques matched your filter criteria. Try adjusting your query or reset filters."
                      : "No bank cheques recorded yet in treasury."
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
                      <PermissionGate permission="cheque:create">
                        <UIButton
                          variant="primary"
                          size="sm"
                          startIcon={<Plus className="size-4" />}
                          onClick={handleCreateNew}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          Record First Cheque
                        </UIButton>
                      </PermissionGate>
                    )
                  }
                />
              ) : (
                displayedCheques.map((c) => {
                  const isReceived = (c.chequeType || c.type) === "RECEIVED";
                  const isPending = c.status === "PENDING" || c.status === "RECEIVED";
                  const isDeposited = c.status === "DEPOSITED";
                  const isCleared = c.status === "CLEARED";
                  const isBounced = c.status === "BOUNCED";
                  const isCancelled = c.status === "CANCELLED";

                  const bankAccount = c.bankAccount || c.bankAccountId || {};
                  const bankName =
                    bankAccount.bank ||
                    bankAccount.accountName ||
                    "Bank Account";

                  return (
                    <UITableRow
                      key={c._id || c.id}
                      onClick={() => handleViewDetails(c)}
                      className="group cursor-pointer transition-colors hover:bg-surface-hover/70 h-13 border-b border-border/60 last:border-b-0"
                    >
                      {/* 1. Cheque # & Date */}
                      <UITableCell className="py-2.5">
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono font-bold text-xs sm:text-sm text-text group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            #{c.chequeNumber || "—"}
                          </span>
                          <span className="text-[11px] text-text-muted mt-0.5">
                            {dayjs(c.chequeDate).format("DD MMM YYYY")}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 2. Type */}
                      <UITableCell className="py-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border",
                            isReceived
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                          )}
                        >
                          {isReceived ? (
                            <ArrowDownLeft className="size-3" />
                          ) : (
                            <ArrowUpRight className="size-3" />
                          )}
                          {isReceived ? "Customer Received" : "Supplier Issued"}
                        </span>
                      </UITableCell>

                      {/* 3. Party Name */}
                      <UITableCell className="py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-text truncate">
                            {c.partyName || "Bearer"}
                          </span>
                          <span className="text-[11px] text-text-muted truncate mt-0.5">
                            {isReceived ? "Drawn By Customer" : "Drawn To Vendor"}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 4. Bank Account */}
                      <UITableCell className="py-2">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-text truncate">
                            {bankName}
                          </span>
                          <span className="text-[11px] font-mono text-text-muted truncate mt-0.5">
                            {bankAccount.accountNumber
                              ? `•••• ${String(bankAccount.accountNumber).slice(-4)}`
                              : "Treasury Account"}
                          </span>
                        </div>
                      </UITableCell>

                      {/* 5. Amount */}
                      <UITableCell
                        align="right"
                        className="whitespace-nowrap font-mono tabular-nums text-xs py-2"
                      >
                        <span className="font-bold text-text text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                          ₹{formatCurrency(c.amount)}
                        </span>
                      </UITableCell>

                      {/* 6. Clearance Date */}
                      <UITableCell className="py-2">
                        {c.clearedAt || c.clearDate || c.clearedDate ? (
                          <span className="font-mono text-xs font-semibold text-text">
                            {dayjs(c.clearedAt || c.clearDate || c.clearedDate).format("DD MMM YYYY")}
                          </span>
                        ) : isCleared ? (
                          <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {c.updatedAt ? dayjs(c.updatedAt).format("DD MMM YYYY") : "Cleared"}
                          </span>
                        ) : isBounced ? (
                          <span className="text-text-muted text-[11px]">Bounced</span>
                        ) : isCancelled ? (
                          <span className="text-text-muted text-[11px]">Cancelled</span>
                        ) : (
                          <span className="text-text-muted text-[11px]">
                            {isDeposited ? "Deposited / In-Transit" : "Awaiting Bank"}
                          </span>
                        )}
                      </UITableCell>

                      {/* 7. Status */}
                      <UITableCell align="center" className="whitespace-nowrap py-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border tracking-wider",
                            isCleared
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : isBounced || isCancelled
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                              : isDeposited
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              isCleared
                                ? "bg-emerald-500"
                                : isBounced || isCancelled
                                ? "bg-rose-500"
                                : isDeposited
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            )}
                          />
                          <span>{c.status || "PENDING"}</span>
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
                          <UIDropdownMenu align="end" className="w-48">
                            <UIDropdownItem
                              icon={<Eye className="size-4 text-text-muted shrink-0" />}
                              onClick={() => handleViewDetails(c)}
                            >
                              View Cheque Leaf
                            </UIDropdownItem>

                            {isPending && (
                              <UIDropdownItem
                                icon={<Edit2 className="size-4 text-text-muted shrink-0" />}
                                onClick={() => handleEditCheque(c)}
                              >
                                Edit Particulars
                              </UIDropdownItem>
                            )}

                            <UIDropdownItem
                              icon={<Printer className="size-4 text-text-muted shrink-0" />}
                              onClick={() => {
                                handleViewDetails(c);
                                setTimeout(() => window.print(), 300);
                              }}
                            >
                              Print Cheque Slip
                            </UIDropdownItem>

                            <UIDropdownDivider />

                            {/* Lifecycle Actions */}
                            {isPending && (
                              <PermissionGate permission="cheque:deposit">
                                <UIDropdownItem
                                  icon={<Send className="size-4 text-blue-600 shrink-0" />}
                                  onClick={() => setDepositTargetCheque(c)}
                                >
                                  Deposit to Bank
                                </UIDropdownItem>
                              </PermissionGate>
                            )}

                            {isDeposited && (
                              <PermissionGate permission="cheque:clear">
                                <UIDropdownItem
                                  icon={<CheckCircle2 className="size-4 text-emerald-600 shrink-0" />}
                                  onClick={() => setClearModalTarget(c)}
                                >
                                  Mark as Cleared
                                </UIDropdownItem>
                              </PermissionGate>
                            )}

                            {(isPending || isDeposited) && (
                              <PermissionGate permission="cheque:bounce">
                                <UIDropdownItem
                                  destructive
                                  icon={<AlertOctagon className="size-4 text-rose-600 shrink-0" />}
                                  onClick={() => setBounceModalTarget(c)}
                                >
                                  Mark as Bounced
                                </UIDropdownItem>
                              </PermissionGate>
                            )}

                            {!isCleared && !isCancelled && !isBounced && (
                              <PermissionGate permission="cheque:cancel">
                                <UIDropdownItem
                                  destructive
                                  icon={<Ban className="size-4 text-rose-600 shrink-0" />}
                                  onClick={() => setCancelModalTarget(c)}
                                >
                                  Cancel Cheque
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

          {!isLoading && displayedCheques.length > 0 && (
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

      {/* ── Deposit Cheque Confirmation Dialog ── */}
      <UIConfirmDialog
        isOpen={Boolean(depositTargetCheque)}
        onClose={() => setDepositTargetCheque(null)}
        onConfirm={confirmDeposit}
        title="Deposit Cheque to Bank?"
        description={
          depositTargetCheque ? (
            <p className="text-xs text-text-muted mt-1">
              Mark Cheque{" "}
              <strong className="text-text font-mono">
                #{depositTargetCheque.chequeNumber}
              </strong>{" "}
              for{" "}
              <strong className="text-text font-mono">
                ₹{formatCurrency(depositTargetCheque.amount)}
              </strong>{" "}
              as deposited into{" "}
              <strong className="text-text">
                {depositTargetCheque.bankAccount?.bank ||
                  depositTargetCheque.bankAccount?.accountName ||
                  "Bank"}
              </strong>
              ?
            </p>
          ) : null
        }
        confirmText="Deposit Cheque"
        cancelText="Cancel"
        intent="primary"
        isLoading={actionLoading}
      />

      {/* ── Action Modals for Clear, Bounce, Cancel ── */}
      <ClearChequeModal
        open={Boolean(clearModalTarget)}
        onClose={() => setClearModalTarget(null)}
        onConfirm={confirmClear}
        isLoading={actionLoading}
        chequeType={clearModalTarget?.type}
      />

      <BounceChequeModal
        open={Boolean(bounceModalTarget)}
        onClose={() => setBounceModalTarget(null)}
        onConfirm={confirmBounce}
        isLoading={actionLoading}
        chequeNumber={bounceModalTarget?.chequeNumber}
        partyName={bounceModalTarget?.partyName}
      />

      <CancelChequeModal
        open={Boolean(cancelModalTarget)}
        onClose={() => setCancelModalTarget(null)}
        onConfirm={confirmCancel}
        isLoading={actionLoading}
        chequeNumber={cancelModalTarget?.chequeNumber}
      />
    </div>
  );
};

export default ChequesDesktopPage;
