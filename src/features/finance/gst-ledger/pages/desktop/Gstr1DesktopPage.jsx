import React, { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import AppDesktopHeader from "@/layouts/app/desktop/AppDesktopHeader";
import { ROUTES } from "@/constants";
import { useGstLedger } from "../../hooks/useGstLedger";
import { UIInfiniteScroll, UITableScrollArea } from "@/components/ui";
import useCompany from "@/features/company/hooks/useCompany";
import { useCompanyFilter } from "@/hooks";
import { CompanyFilterSelect } from "@/components/shared";
import { calculateGstr1Summary, deduceGstrGroup, isCreditNoteEntry } from "../../utils/gstr1SummaryCalculator";
import {
  FiSearch,
  FiCalendar,
  FiDownload,
  FiRefreshCw,
  FiFileText,
  FiPlus,
  FiEye,
  FiCheckCircle,
  FiX,
  FiLayers,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Gstr1DesktopPage = () => {
  const tableContainerRef = useRef(null);
  const { currentCompany } = useCompany();
  const companyFilter = useCompanyFilter();
  const {
    entries,
    total,
    loading,
    isLoadingMore,
    hasMore,
    loadMore,
    handleTableScroll,
    error,
    filters,
    stats,
    branches = [],
    currentBranch,
    summaryData,
    summaryLoading,
    fetchSummary,
    handleFilterChange,
    handleResetFilters,
    refetch,
    exportToCsv,
    createEntry,
  } = useGstLedger("GSTR-1");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    voucherNumber: "",
    voucherDate: new Date().toISOString().slice(0, 10),
    branchId: currentBranch?._id || "",
    groupDescription: "B2B",
    taxableAmount: "",
    cgst: "",
    sgst: "",
    igst: "",
    narration: "",
  });

  // Fallback frontend summary calculation
  const fallbackSummary = useMemo(() => {
    return calculateGstr1Summary(entries, {
      companyGstin: currentCompany?.gstin || "",
      b2cLargeThreshold: 250000,
    });
  }, [entries, currentCompany?.gstin]);

  const activeSummary = summaryData || fallbackSummary;

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.voucherNumber.trim()) {
      setFormError("Voucher Number is required");
      return;
    }

    setSubmitting(true);
    const result = await createEntry({
      voucherNumber: formData.voucherNumber,
      voucherDate: formData.voucherDate,
      branchId: formData.branchId || undefined,
      groupDescription: formData.groupDescription || "B2B",
      taxableAmount: Number(formData.taxableAmount || 0),
      cgst: Number(formData.cgst || 0),
      sgst: Number(formData.sgst || 0),
      igst: Number(formData.igst || 0),
      narration: formData.narration,
    });

    setSubmitting(false);
    if (result.success) {
      setIsModalOpen(false);
      setFormData({
        voucherNumber: "",
        voucherDate: new Date().toISOString().slice(0, 10),
        branchId: currentBranch?._id || "",
        groupDescription: "B2B",
        taxableAmount: "",
        cgst: "",
        sgst: "",
        igst: "",
        narration: "",
      });
      fetchSummary();
    } else {
      setFormError(result.error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-bg overflow-y-auto transition-colors">
      <AppDesktopHeader
        title="GSTR-1 (Outward Supplies)"
        description="View your outward supplies, sales transactions, tax breakdowns, and GSTR-1 filing records."
      />

      <div className="p-6 space-y-6">
        {/* GST Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-border pb-3">
          <Link
            to={ROUTES.GSTR1}
            className="px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 bg-indigo-600 text-white shadow-xs"
          >
            <FiFileText className="w-4 h-4" />
            GSTR-1 (Sales)
          </Link>
          <Link
            to={ROUTES.GSTR2}
            className="px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 bg-white dark:bg-surface text-slate-700 dark:text-text-muted hover:bg-slate-100 dark:hover:bg-surface-hover border border-slate-200 dark:border-border"
          >
            <FiFileText className="w-4 h-4" />
            GSTR-2 (Purchases)
          </Link>
          <Link
            to={ROUTES.GSTR3B}
            className="px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 bg-white dark:bg-surface text-slate-700 dark:text-text-muted hover:bg-slate-100 dark:hover:bg-surface-hover border border-slate-200 dark:border-border"
          >
            <FiLayers className="w-4 h-4" />
            GSTR-3B (Summary Return)
          </Link>
        </div>

        {/* KPI Metrics Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white dark:bg-surface px-3 py-2 rounded-lg border border-slate-200 dark:border-border shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
              Total Invoices
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold text-slate-900 dark:text-text">{stats.count}</span>
              <span className="p-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded">
                <FiFileText className="w-3.5 h-3.5" />
              </span>
            </div>
            {stats.creditNoteCount > 0 && (
              <span className="text-[10px] text-slate-500 dark:text-text-muted mt-0.5 truncate">
                {stats.invoiceCount || (stats.count - stats.creditNoteCount)} Inv &middot; <span className="text-rose-600 dark:text-rose-400 font-medium">{stats.creditNoteCount} Return{stats.creditNoteCount > 1 ? "s" : ""}</span>
              </span>
            )}
          </div>

          <div className="bg-white dark:bg-surface px-3 py-2 rounded-lg border border-slate-200 dark:border-border shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
              Net Taxable Amount
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-bold text-slate-900 dark:text-text">
                {formatCurrency(stats.totalTaxable)}
              </span>
              <span className="p-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                <FaRupeeSign className="w-3.5 h-3.5" />
              </span>
            </div>
            {stats.creditTaxable > 0 && (
              <span className="text-[10px] text-slate-500 dark:text-text-muted mt-0.5 truncate">
                Gross {formatCurrency(stats.grossTaxable)} &middot; <span className="text-rose-600 dark:text-rose-400 font-medium">-{formatCurrency(stats.creditTaxable)}</span>
              </span>
            )}
          </div>

          <div className="bg-white dark:bg-surface px-3 py-2 rounded-lg border border-slate-200 dark:border-border shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
              Net CGST
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(stats.totalCgst)}
              </span>
              <span className="p-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">
                <FaRupeeSign className="w-3.5 h-3.5" />
              </span>
            </div>
            {stats.creditCgst > 0 && (
              <span className="text-[10px] text-slate-500 dark:text-text-muted mt-0.5 truncate">
                Gross {formatCurrency(stats.grossCgst)} &middot; <span className="text-rose-600 dark:text-rose-400 font-medium">-{formatCurrency(stats.creditCgst)}</span>
              </span>
            )}
          </div>

          <div className="bg-white dark:bg-surface px-3 py-2 rounded-lg border border-slate-200 dark:border-border shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
              Net SGST
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-bold text-teal-600 dark:text-teal-400">
                {formatCurrency(stats.totalSgst)}
              </span>
              <span className="p-1 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded">
                <FaRupeeSign className="w-3.5 h-3.5" />
              </span>
            </div>
            {stats.creditSgst > 0 && (
              <span className="text-[10px] text-slate-500 dark:text-text-muted mt-0.5 truncate">
                Gross {formatCurrency(stats.grossSgst)} &middot; <span className="text-rose-600 dark:text-rose-400 font-medium">-{formatCurrency(stats.creditSgst)}</span>
              </span>
            )}
          </div>

          <div className="bg-white dark:bg-surface px-3 py-2 rounded-lg border border-slate-200 dark:border-border shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
              Net IGST
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-bold text-violet-600 dark:text-violet-400">
                {formatCurrency(stats.totalIgst)}
              </span>
              <span className="p-1 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded">
                <FaRupeeSign className="w-3.5 h-3.5" />
              </span>
            </div>
            {stats.creditIgst > 0 && (
              <span className="text-[10px] text-slate-500 dark:text-text-muted mt-0.5 truncate">
                Gross {formatCurrency(stats.grossIgst)} &middot; <span className="text-rose-600 dark:text-rose-400 font-medium">-{formatCurrency(stats.creditIgst)}</span>
              </span>
            )}
          </div>

          <div className="bg-white dark:bg-surface px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/30 dark:bg-amber-500/10 shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Net GST Liability
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(stats.totalGst)}
              </span>
              <span className="p-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded">
                <FaRupeeSign className="w-3.5 h-3.5" />
              </span>
            </div>
            {stats.creditGst > 0 && (
              <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80 mt-0.5 truncate">
                Gross {formatCurrency(stats.grossGst)} &middot; <span className="text-rose-600 dark:text-rose-400 font-semibold">-{formatCurrency(stats.creditGst)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Filter and Controls Toolbar */}
        <div className="bg-white dark:bg-surface p-4 rounded-xl border border-slate-200 dark:border-border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search voucher # or narration..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-surface-alt border border-slate-200 dark:border-border rounded-lg text-sm text-slate-800 dark:text-text placeholder-slate-400 dark:placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-surface transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="pl-3 pr-3 py-2 bg-slate-50 dark:bg-surface-alt border border-slate-200 dark:border-border rounded-lg text-sm text-slate-800 dark:text-text focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-slate-400 dark:text-text-muted text-xs font-medium">to</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="pl-3 pr-3 py-2 bg-slate-50 dark:bg-surface-alt border border-slate-200 dark:border-border rounded-lg text-sm text-slate-800 dark:text-text focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Workspace Level Company Filter (Zero width/elements at Company level) */}
            <CompanyFilterSelect
              value={companyFilter?.selectedCompanyId || "all"}
              onChange={(val) => {
                companyFilter?.setSelectedCompanyId(val);
                handleFilterChange("companyId", val === "all" ? undefined : val);
              }}
              size="md"
              className="min-w-[180px]"
            />

            {/* Branch Filter Selector */}
            <div className="min-w-[180px]">
              <select
                value={filters.branchId || "all"}
                onChange={(e) => handleFilterChange("branchId", e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-alt border border-slate-200 dark:border-border rounded-lg text-sm text-slate-800 dark:text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-surface transition"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} {b._id === currentBranch?._id ? "(Current)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {(filters.search || filters.startDate || filters.endDate || (filters.branchId && filters.branchId !== currentBranch?._id)) && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-text-muted hover:text-slate-900 dark:hover:text-text bg-slate-100 dark:bg-surface-alt hover:bg-slate-200 dark:hover:bg-surface-hover rounded-lg transition"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.GSTR3B}
              className="px-3.5 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 rounded-lg transition flex items-center gap-1.5 shadow-xs"
            >
              <FiLayers className="w-4 h-4" />
              GSTR-3B Return
            </Link>

            <button
              onClick={() => {
                fetchSummary();
                setIsSummaryModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 rounded-lg transition flex items-center gap-1.5 shadow-xs"
            >
              <FiEye className="w-4 h-4" />
              GSTR-1 Summary
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition flex items-center gap-1.5 shadow-xs"
            >
              <FiPlus className="w-4 h-4" />
              New GSTR-1 Record
            </button>

            <button
              onClick={refetch}
              disabled={loading}
              className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-text-muted bg-white dark:bg-surface border border-slate-200 dark:border-border rounded-lg hover:bg-slate-50 dark:hover:bg-surface-hover transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <button
              onClick={exportToCsv}
              disabled={!entries.length}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-text-muted bg-white dark:bg-surface border border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-surface-hover rounded-lg transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiDownload className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-error-soft border border-red-200 dark:border-error/30 rounded-xl text-sm text-red-700 dark:text-error flex items-center justify-between">
            <span>{error}</span>
            <button onClick={refetch} className="underline font-semibold hover:text-red-900 dark:hover:text-error-hover">
              Retry
            </button>
          </div>
        )}

        {/* Main Data Table */}
        <div className="bg-white dark:bg-surface rounded-xl border border-slate-200 dark:border-border shadow-sm overflow-hidden flex flex-col transition-colors relative">
          {/* Constrained-Height Scroll Container: limited to ~5 visible records */}
          <UITableScrollArea
            containerRef={tableContainerRef}
            onScroll={handleTableScroll}
            className="max-h-[280px] divide-y divide-slate-100 dark:divide-border/60"
          >
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-50 dark:bg-surface-alt shadow-xs">
                <tr className="border-b border-slate-200 dark:border-border text-xs font-semibold text-slate-600 dark:text-text-muted uppercase tracking-wider bg-slate-50 dark:bg-surface-alt">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Voucher No</th>
                  <th className="py-3.5 px-4">Branch</th>
                  <th className="py-3.5 px-4 text-right">Taxable Amount</th>
                  <th className="py-3.5 px-4 text-right">CGST</th>
                  <th className="py-3.5 px-4 text-right">SGST</th>
                  <th className="py-3.5 px-4 text-right">IGST</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4">Narration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border/60 text-sm">
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-surface-alt rounded w-20"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-surface-alt rounded w-28"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-surface-alt rounded w-20"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-surface-alt rounded w-20 ml-auto"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-surface-alt rounded w-16 ml-auto"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-surface-alt rounded w-16 ml-auto"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-surface-alt rounded w-16 ml-auto"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-surface-alt rounded w-24 ml-auto"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-surface-alt rounded w-36"></div></td>
                    </tr>
                  ))
                ) : entries.length > 0 ? (
                  entries.map((entry) => {
                    const isCredit = isCreditNoteEntry(entry);
                    return (
                      <tr
                        key={entry._id}
                        className={
                          isCredit
                            ? "bg-rose-50/25 hover:bg-rose-50/45 dark:bg-rose-500/[0.04] dark:hover:bg-rose-500/[0.08] transition-colors"
                            : "hover:bg-slate-50/80 dark:hover:bg-surface-hover/70 transition-colors"
                        }
                      >
                        <td className="py-3.5 px-4 text-slate-700 dark:text-text-muted font-medium whitespace-nowrap">
                          {formatDate(entry.voucherDate)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-text whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={
                                isCredit
                                  ? "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                                  : "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20"
                              }
                            >
                              {entry.voucherNumber}
                            </span>
                            {(entry.groupDescription || deduceGstrGroup(entry)) && (
                              <span
                                className={
                                  isCredit
                                    ? "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-100/70 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-500/30"
                                    : "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-surface-alt text-slate-700 dark:text-text-muted border border-slate-200/80 dark:border-border"
                                }
                              >
                                {entry.groupDescription || deduceGstrGroup(entry)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-text-muted font-medium whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-surface-alt text-slate-700 dark:text-text-muted border border-slate-200/60 dark:border-border/60">
                            {entry.branchId?.name || "-"}
                          </span>
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-medium whitespace-nowrap ${
                            isCredit
                              ? "text-rose-600 dark:text-rose-400 font-semibold"
                              : "text-slate-800 dark:text-text"
                          }`}
                        >
                          {isCredit ? `-${formatCurrency(entry.taxableAmount)}` : formatCurrency(entry.taxableAmount)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-medium whitespace-nowrap ${
                            isCredit
                              ? "text-rose-600 dark:text-rose-400 font-semibold"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isCredit ? `-${formatCurrency(entry.cgst)}` : formatCurrency(entry.cgst)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-medium whitespace-nowrap ${
                            isCredit
                              ? "text-rose-600 dark:text-rose-400 font-semibold"
                              : "text-teal-600 dark:text-teal-400"
                          }`}
                        >
                          {isCredit ? `-${formatCurrency(entry.sgst)}` : formatCurrency(entry.sgst)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-medium whitespace-nowrap ${
                            isCredit
                              ? "text-rose-600 dark:text-rose-400 font-semibold"
                              : "text-violet-600 dark:text-violet-400"
                          }`}
                        >
                          {entry.igst > 0
                            ? isCredit
                              ? `-${formatCurrency(entry.igst)}`
                              : formatCurrency(entry.igst)
                            : formatCurrency(entry.igst)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${
                            isCredit
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-slate-900 dark:text-text"
                          }`}
                        >
                          {isCredit ? `-${formatCurrency(entry.totalAmount)}` : formatCurrency(entry.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-text-muted max-w-xs truncate">
                          {entry.narration || "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400 dark:text-text-muted">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FiFileText className="w-10 h-10 text-slate-300 dark:text-text-muted/40" />
                        <p className="text-base font-medium text-slate-600 dark:text-text">
                          No GSTR-1 records found
                        </p>
                        <p className="text-xs text-slate-400 dark:text-text-muted">
                          Click "+ New GSTR-1 Record" to record outward sales transactions.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Infinite Scroll Sentinel inside scroll container */}
            {!loading && entries.length > 0 && (
              <UIInfiniteScroll
                onLoadMore={loadMore}
                hasMore={hasMore}
                isLoading={isLoadingMore}
                rootRef={tableContainerRef}
                rootMargin="40px"
                endMessage={
                  !hasMore && entries.length > 0 ? (
                    <span className="font-mono text-[11px] text-slate-400 dark:text-text-muted select-none">
                      ✓ All {total} matching GSTR-1 records loaded
                    </span>
                  ) : null
                }
              />
            )}
          </UITableScrollArea>

          {/* Records Summary Footer */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-surface-alt border-t border-slate-200 dark:border-border flex items-center justify-between transition-colors">
            <span className="text-xs text-slate-500 dark:text-text-muted">
              Loaded <span className="font-semibold text-slate-700 dark:text-text">{entries.length}</span> of{" "}
              <span className="font-semibold text-slate-700 dark:text-text">{total}</span> records
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-text-muted">
              Total Outward Value:{" "}
              <span className="font-semibold text-slate-800 dark:text-text">{formatCurrency(stats.totalAmount)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* New GSTR-1 Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface rounded-2xl shadow-xl border border-slate-200 dark:border-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-text">Create New GSTR-1 Entry</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 dark:text-text-muted hover:text-slate-600 dark:hover:text-text p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-error-soft border border-red-200 dark:border-error/30 rounded-lg text-xs text-red-700 dark:text-error">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-text-muted block mb-1">
                    Voucher Number *
                  </label>
                  <input
                    type="text"
                    name="voucherNumber"
                    required
                    placeholder="e.g. INV-2026-001"
                    value={formData.voucherNumber}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-alt border border-slate-200 dark:border-border rounded-lg text-sm text-slate-900 dark:text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-surface transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-text-muted block mb-1">
                    Voucher Date *
                  </label>
                  <input
                    type="date"
                    name="voucherDate"
                    required
                    value={formData.voucherDate}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-alt border border-slate-200 dark:border-border rounded-lg text-sm text-slate-900 dark:text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-surface transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-text-muted block mb-1">
                  Group Description *
                </label>
                <select
                  name="groupDescription"
                  required
                  value={formData.groupDescription}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-alt border border-slate-200 dark:border-border rounded-lg text-sm text-slate-900 dark:text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-surface transition"
                >
                  <option value="B2B">1. B2B (Registered Recipient)</option>
                  <option value="B2C (Large) Invoice">2. B2C (Large) Invoice</option>
                  <option value="B2C (Small) Invoice">3. B2C (Small) Invoice</option>
                  <option value="Nil Rated">4.1 Nil Rated Supplies</option>
                  <option value="Exempted">4.2 Exempted Supplies</option>
                  <option value="Export Invoices">5. Export Invoices</option>
                  <option value="Tax Liability on Advance">6. Tax Liability on Advance</option>
                  <option value="Set/off Tax on Advance of prior period">7. Set/off Tax on Advance of prior period</option>
                  <option value="Credit Note - Registered">8.1 Credit Note - Registered Parties</option>
                  <option value="Credit Note - Unregistered">8.2 Credit Note - Unregistered Parties</option>
                  <option value="Debit Note - Registered">8.3 Debit Note - Registered Parties</option>
                  <option value="Debit Note - Unregistered">8.4 Debit Note - Unregistered Parties</option>
                  <option value="Refund from Advance">8.5 Refund from Advance</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-text-muted block mb-1">
                  Branch
                </label>
                <select
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-alt border border-slate-200 dark:border-border rounded-lg text-sm text-slate-900 dark:text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-surface transition"
                >
                  <option value="">No Branch / Global</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name} {b._id === currentBranch?._id ? "(Current)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-text-muted block mb-1">
                  Taxable Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="taxableAmount"
                  placeholder="0.00"
                  value={formData.taxableAmount}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-alt border border-slate-200 dark:border-border rounded-lg text-sm text-slate-900 dark:text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-surface transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-text-muted block mb-1">
                    CGST (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="cgst"
                    placeholder="0.00"
                    value={formData.cgst}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-alt border border-slate-200 dark:border-border rounded-lg text-sm text-slate-900 dark:text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-surface transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-text-muted block mb-1">
                    SGST (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="sgst"
                    placeholder="0.00"
                    value={formData.sgst}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-alt border border-slate-200 dark:border-border rounded-lg text-sm text-slate-900 dark:text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-surface transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-text-muted block mb-1">
                    IGST (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="igst"
                    placeholder="0.00"
                    value={formData.igst}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-alt border border-slate-200 dark:border-border rounded-lg text-sm text-slate-900 dark:text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-surface transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-text-muted block mb-1">
                  Narration / Notes
                </label>
                <input
                  type="text"
                  name="narration"
                  placeholder="Optional details or customer info..."
                  value={formData.narration}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-surface-alt border border-slate-200 dark:border-border rounded-lg text-sm text-slate-900 dark:text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-surface transition"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-text-muted hover:text-slate-900 dark:hover:text-text bg-slate-100 dark:bg-surface-alt hover:bg-slate-200 dark:hover:bg-surface-hover rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save GSTR-1 Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GSTR-1 Summary Modal */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-border w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 px-6 border-b border-slate-100 dark:border-border flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-text">
                    GSTR-1 Statutory Summary
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                    Statutory Grouping
                  </span>
                  {summaryLoading && (
                    <span className="text-xs text-indigo-500 animate-pulse font-medium">Calculating database records...</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                  Return Period:{" "}
                  <span className="font-medium text-slate-700 dark:text-text">
                    {filters.startDate || filters.endDate
                      ? `${filters.startDate || "Beginning"} to ${filters.endDate || "Latest"}`
                      : "All Recorded Periods"}
                  </span>
                  {" • "}
                  Branch:{" "}
                  <span className="font-medium text-slate-700 dark:text-text">
                    {filters.branchId && filters.branchId !== "all"
                      ? branches.find((b) => b._id === filters.branchId)?.name || "Selected Branch"
                      : "All Branches"}
                  </span>
                  {currentCompany?.gstin && (
                    <>
                      {" • "}
                      GSTIN:{" "}
                      <span className="font-medium text-slate-700 dark:text-text">
                        {currentCompany.gstin}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="text-slate-400 dark:text-text-muted hover:text-slate-600 dark:hover:text-text p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-hover transition"
                title="Close modal"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto overflow-x-auto flex-1">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-border shadow-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-100 dark:bg-surface-alt text-slate-700 dark:text-text-muted font-semibold sticky top-0 z-10 border-b border-slate-200 dark:border-border">
                    <tr>
                      <th className="px-4 py-3 text-left min-w-[240px]">Description</th>
                      <th className="px-3 py-3 text-right w-16">Count</th>
                      <th className="px-3 py-3 text-right min-w-[100px]">Taxable (₹)</th>
                      <th className="px-3 py-3 text-right min-w-[90px]">SGST (₹)</th>
                      <th className="px-3 py-3 text-right min-w-[90px]">CGST (₹)</th>
                      <th className="px-3 py-3 text-right min-w-[90px]">IGST (₹)</th>
                      <th className="px-3 py-3 text-right min-w-[80px]">Cess (₹)</th>
                      <th className="px-3 py-3 text-right min-w-[105px]">Total Tax (₹)</th>
                      <th className="px-4 py-3 text-right min-w-[115px]">Invoice Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-border/40">
                    {(activeSummary.groups || []).map((group, idx) => {
                      const isTotal = group.isTotal;
                      const isSummaryBox = group.isSummaryBox;
                      const isSub = group.isSubItem;

                      let rowClasses = "transition-colors ";
                      if (isTotal) {
                        rowClasses += "bg-slate-100/90 dark:bg-surface-alt font-bold text-slate-900 dark:text-text border-t-2 border-b-2 border-slate-300 dark:border-border";
                      } else if (isSummaryBox) {
                        rowClasses += "bg-indigo-50/40 dark:bg-indigo-500/5 font-semibold text-slate-800 dark:text-text";
                      } else if (isSub) {
                        rowClasses += "hover:bg-slate-50 dark:hover:bg-surface-hover/50 text-slate-600 dark:text-text-muted text-[11px]";
                      } else {
                        rowClasses += "hover:bg-slate-50 dark:hover:bg-surface-hover/50 text-slate-800 dark:text-text font-medium";
                      }

                      return (
                        <tr key={idx} className={rowClasses}>
                          <td className="px-4 py-2.5">
                            {isSub ? (
                              <div className="pl-6 flex items-center gap-1.5">
                                <span className="text-slate-400 dark:text-text-muted/60">-</span>
                                <span>{group.description}</span>
                              </div>
                            ) : isTotal ? (
                              <span className="font-bold uppercase tracking-wider">{group.description}</span>
                            ) : isSummaryBox ? (
                              <span className="font-semibold text-indigo-700 dark:text-indigo-400">{group.description}</span>
                            ) : (
                              <span>{group.description}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-[11px]">{group.count}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(group.taxable)}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(group.sgst)}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(group.cgst)}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(group.igst)}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{formatCurrency(group.cess)}</td>
                          <td className={`px-3 py-2.5 text-right font-mono ${isTotal ? "text-indigo-700 dark:text-indigo-400 font-bold" : "font-semibold text-slate-900 dark:text-text"}`}>
                            {formatCurrency(group.totalTax)}
                          </td>
                          <td className={`px-4 py-2.5 text-right font-mono ${isTotal ? "text-slate-900 dark:text-text font-bold" : "font-semibold text-slate-900 dark:text-text"}`}>
                            {formatCurrency(group.invoiceValue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 px-6 border-t border-slate-100 dark:border-border bg-slate-50 dark:bg-surface-alt flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 dark:text-text-muted">
                Statutory summary computed across{" "}
                <span className="font-semibold text-slate-700 dark:text-text">{total}</span> total database outward records
              </span>
              <button
                type="button"
                onClick={() => setIsSummaryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gstr1DesktopPage;
