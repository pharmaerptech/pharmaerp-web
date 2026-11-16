import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import AppDesktopHeader from "@/layouts/app/desktop/AppDesktopHeader";
import { ROUTES } from "@/constants";
import { useGstLedger } from "../../hooks/useGstLedger";
import { UIInfiniteScroll, UITableScrollArea } from "@/components/ui";
import { useCompanyFilter } from "@/hooks";
import { CompanyFilterSelect } from "@/components/shared";
import {
  FiSearch,
  FiCalendar,
  FiDownload,
  FiRefreshCw,
  FiFileText,
  FiPlus,
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

const Gstr2DesktopPage = () => {
  const tableContainerRef = useRef(null);
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
    handleFilterChange,
    handleResetFilters,
    refetch,
    exportToCsv,
    createEntry,
  } = useGstLedger("GSTR-2");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    voucherNumber: "",
    voucherDate: new Date().toISOString().slice(0, 10),
    branchId: currentBranch?._id || "",
    taxableAmount: "",
    cgst: "",
    sgst: "",
    igst: "",
    narration: "",
  });

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
        taxableAmount: "",
        cgst: "",
        sgst: "",
        igst: "",
        narration: "",
      });
    } else {
      setFormError(result.error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-bg overflow-y-auto transition-colors">
      <AppDesktopHeader
        title="GSTR-2 (Inward Supplies)"
        description="View your inward supplies, purchase transactions, input tax credits (ITC), and GSTR-2 reconciliation records."
      />

      <div className="p-6 space-y-6">
        {/* GST Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-border pb-3">
          <Link
            to={ROUTES.GSTR1}
            className="px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 bg-white dark:bg-surface text-slate-700 dark:text-text-muted hover:bg-slate-100 dark:hover:bg-surface-hover border border-slate-200 dark:border-border"
          >
            <FiFileText className="w-4 h-4" />
            GSTR-1 (Sales)
          </Link>
          <Link
            to={ROUTES.GSTR2}
            className="px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 bg-indigo-600 text-white shadow-xs"
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
              Total Purchases
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold text-slate-900 dark:text-text">{stats.count}</span>
              <span className="p-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded">
                <FiFileText className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface px-3 py-2 rounded-lg border border-slate-200 dark:border-border shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
              Taxable Amount
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-bold text-slate-900 dark:text-text">
                {formatCurrency(stats.totalTaxable)}
              </span>
              <span className="p-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                <FaRupeeSign className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface px-3 py-2 rounded-lg border border-slate-200 dark:border-border shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
              Input CGST
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(stats.totalCgst)}
              </span>
              <span className="p-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">
                <FaRupeeSign className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface px-3 py-2 rounded-lg border border-slate-200 dark:border-border shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
              Input SGST
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-bold text-teal-600 dark:text-teal-400">
                {formatCurrency(stats.totalSgst)}
              </span>
              <span className="p-1 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded">
                <FaRupeeSign className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface px-3 py-2 rounded-lg border border-slate-200 dark:border-border shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-text-muted uppercase tracking-wider">
              Input IGST
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-bold text-violet-600 dark:text-violet-400">
                {formatCurrency(stats.totalIgst)}
              </span>
              <span className="p-1 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded">
                <FaRupeeSign className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-surface px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50/30 dark:bg-amber-500/10 shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Total Input GST (ITC)
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(stats.totalGst)}
              </span>
              <span className="p-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded">
                <FaRupeeSign className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
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
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition flex items-center gap-1.5 shadow-xs"
            >
              <FiPlus className="w-4 h-4" />
              New GSTR-2 Record
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

        {/* Data Table */}
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
                  <th className="py-3.5 px-4 text-right">Input CGST</th>
                  <th className="py-3.5 px-4 text-right">Input SGST</th>
                  <th className="py-3.5 px-4 text-right">Input IGST</th>
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
                  entries.map((entry) => (
                    <tr key={entry._id} className="hover:bg-slate-50/80 dark:hover:bg-surface-hover/70 transition-colors">
                      <td className="py-3.5 px-4 text-slate-700 dark:text-text-muted font-medium whitespace-nowrap">
                        {formatDate(entry.voucherDate)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-text whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                          {entry.voucherNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-text-muted font-medium whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-surface-alt text-slate-700 dark:text-text-muted border border-slate-200/60 dark:border-border/60">
                          {entry.branchId?.name || "-"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800 dark:text-text whitespace-nowrap">
                        {formatCurrency(entry.taxableAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                        {formatCurrency(entry.cgst)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-teal-600 dark:text-teal-400 font-medium whitespace-nowrap">
                        {formatCurrency(entry.sgst)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-violet-600 dark:text-violet-400 font-medium whitespace-nowrap">
                        {formatCurrency(entry.igst)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-text whitespace-nowrap">
                        {formatCurrency(entry.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-text-muted max-w-xs truncate">
                        {entry.narration || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400 dark:text-text-muted">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FiFileText className="w-10 h-10 text-slate-300 dark:text-text-muted/40" />
                        <p className="text-base font-medium text-slate-600 dark:text-text">
                          No GSTR-2 records found
                        </p>
                        <p className="text-xs text-slate-400 dark:text-text-muted">
                          Click "+ New GSTR-2 Record" to record inward purchase transactions.
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
                      ✓ All {total} matching GSTR-2 records loaded
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
              Total Inward Value:{" "}
              <span className="font-semibold text-slate-800 dark:text-text">{formatCurrency(stats.totalAmount)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* New GSTR-2 Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface rounded-2xl shadow-xl border border-slate-200 dark:border-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-text">Create New GSTR-2 Entry</h3>
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
                    Voucher / Bill Number *
                  </label>
                  <input
                    type="text"
                    name="voucherNumber"
                    required
                    placeholder="e.g. PB-2026-001"
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
                    Input CGST (₹)
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
                    Input SGST (₹)
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
                    Input IGST (₹)
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
                  placeholder="Optional supplier or bill info..."
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
                  {submitting ? "Saving..." : "Save GSTR-2 Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gstr2DesktopPage;
