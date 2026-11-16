import React from "react";
import { Link } from "react-router-dom";
import AppDesktopHeader from "@/layouts/app/desktop/AppDesktopHeader";
import { ROUTES } from "@/constants";
import { useGstr3b } from "../../hooks/useGstr3b";
import Gstr3bDrillDownModal from "../../components/Gstr3bDrillDownModal";
import { CompanyFilterSelect } from "@/components/shared";
import {
  FiCalendar,
  FiDownload,
  FiRefreshCw,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiLayers,
  FiExternalLink,
  FiPrinter,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const Gstr3bDesktopPage = () => {
  const {
    financialYears,
    selectedFy,
    setSelectedFy,
    returnPeriods,
    selectedPeriod,
    setSelectedPeriod,
    activePeriodObj,
    branches,
    branchId,
    setBranchId,
    companyId,
    setCompanyId,
    currentBranch,
    summaryData,
    loading,
    error,
    refetch,
    drillDownData,
    isDrillDownOpen,
    openDrillDown,
    closeDrillDown,
    exportToExcel,
    exportToPdf,
  } = useGstr3b();

  const cards = summaryData?.summaryCards;
  const sec31 = summaryData?.section31;
  const sec4 = summaryData?.section4;
  const taxLiab = summaryData?.taxLiability;
  const recon = summaryData?.reconciliation;

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-background text-slate-900 dark:text-text transition-colors overflow-hidden">
      {/* 1. Desktop App Header */}
      <AppDesktopHeader />

      {/* 2. Top Banner / Page Title & Controls */}
      <div className="shrink-0 bg-white dark:bg-surface border-b border-slate-200 dark:border-border px-6 py-4 space-y-4 transition-colors">
        {/* GST Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-border/60 pb-3">
          <Link
            to={ROUTES.GSTR1}
            className="px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 bg-slate-100 dark:bg-surface-alt text-slate-700 dark:text-text-muted hover:bg-slate-200 dark:hover:bg-surface-hover border border-slate-200 dark:border-border"
          >
            <FiFileText className="w-4 h-4" />
            GSTR-1 (Sales)
          </Link>
          <Link
            to={ROUTES.GSTR2}
            className="px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 bg-slate-100 dark:bg-surface-alt text-slate-700 dark:text-text-muted hover:bg-slate-200 dark:hover:bg-surface-hover border border-slate-200 dark:border-border"
          >
            <FiFileText className="w-4 h-4" />
            GSTR-2 (Purchases)
          </Link>
          <Link
            to={ROUTES.GSTR3B}
            className="px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 bg-indigo-600 text-white shadow-xs"
          >
            <FiLayers className="w-4 h-4" />
            GSTR-3B (Summary Return)
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-11 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-500/20">
              <FiLayers className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-text">
                  GSTR-3B
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                  GST Summary Return
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                Monthly self-declaration of outward supplies, input tax credit, and tax liability
              </p>
            </div>
          </div>

          {/* Period and Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Financial Year Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-surface-alt px-3 py-1.5 rounded-xl border border-slate-200 dark:border-border">
              <span className="text-[11px] font-bold text-slate-500 dark:text-text-muted uppercase">FY:</span>
              <select
                value={selectedFy}
                onChange={(e) => setSelectedFy(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-text focus:outline-none cursor-pointer"
              >
                {financialYears.map((fy) => (
                  <option key={fy} value={fy} className="bg-white dark:bg-surface text-slate-900 dark:text-text">
                    {fy}
                  </option>
                ))}
              </select>
            </div>

            {/* Return Period Month Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-surface-alt px-3 py-1.5 rounded-xl border border-slate-200 dark:border-border">
              <FiCalendar className="size-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-[11px] font-bold text-slate-500 dark:text-text-muted uppercase">Period:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-text focus:outline-none cursor-pointer"
              >
                {returnPeriods.map((p) => (
                  <option key={p.key} value={p.key} className="bg-white dark:bg-surface text-slate-900 dark:text-text">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Workspace Level Company Filter (Zero width/elements at Company level) */}
            <CompanyFilterSelect
              value={companyId || "all"}
              onChange={(val) => setCompanyId(val || "all")}
              size="sm"
              className="w-[170px] sm:w-[195px]"
            />

            {/* Branch Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-surface-alt px-3 py-1.5 rounded-xl border border-slate-200 dark:border-border">
              <select
                value={branchId || "all"}
                onChange={(e) => setBranchId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-900 dark:text-text focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="all" className="bg-white dark:bg-surface text-slate-900 dark:text-text">
                  All Branches
                </option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id} className="bg-white dark:bg-surface text-slate-900 dark:text-text">
                    {b.name} {b._id === currentBranch?._id ? "(Current)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={refetch}
              disabled={loading}
              title="Refresh return calculations"
              className="p-2 text-slate-600 dark:text-text-muted hover:text-slate-900 dark:hover:text-text bg-slate-100 dark:bg-surface-alt hover:bg-slate-200 dark:hover:bg-surface-hover rounded-xl border border-slate-200 dark:border-border transition-colors cursor-pointer"
            >
              <FiRefreshCw className={`size-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>

            {/* Export Excel */}
            <button
              type="button"
              onClick={exportToExcel}
              disabled={loading || !summaryData}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <FiDownload className="size-3.5" />
              <span>Export Excel</span>
            </button>

            {/* Export PDF / Print */}
            <button
              type="button"
              onClick={exportToPdf}
              disabled={loading || !summaryData}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <FiPrinter className="size-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-3">
            <FiAlertCircle className="size-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── SUMMARY CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Total Taxable Outward */}
          <div className="bg-white dark:bg-surface p-3.5 rounded-2xl border border-slate-200 dark:border-border shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-bold text-slate-500 dark:text-text-muted uppercase tracking-wider">
              Total Taxable Outward
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900 dark:text-text font-mono">
                {formatCurrency(cards?.totalTaxableOutward?.value || 0)}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-border/60 text-[10px] text-slate-500 dark:text-text-muted flex justify-between font-mono">
              <span>Tax: {formatCurrency(cards?.totalTaxableOutward?.totalTax || 0)}</span>
              <span>IGST: {formatCurrency(cards?.totalTaxableOutward?.igst || 0)}</span>
            </div>
          </div>

          {/* Card 2: Output GST */}
          <div className="bg-white dark:bg-surface p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-500/5 shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              Output GST Liability
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {formatCurrency(cards?.outputGst?.value || 0)}
              </span>
              <span className="p-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-md">
                <FaRupeeSign className="size-3" />
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-indigo-100 dark:border-border/60 text-[10px] text-indigo-700/80 dark:text-indigo-300/80 flex justify-between font-mono">
              <span>C: {formatCurrency(cards?.outputGst?.cgst || 0)}</span>
              <span>S: {formatCurrency(cards?.outputGst?.sgst || 0)}</span>
            </div>
          </div>

          {/* Card 3: Eligible ITC */}
          <div className="bg-white dark:bg-surface p-3.5 rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/20 dark:bg-blue-500/5 shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
              Eligible ITC
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
                {formatCurrency(cards?.eligibleItc?.value || 0)}
              </span>
              <span className="p-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-md">
                <FaRupeeSign className="size-3" />
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-blue-100 dark:border-border/60 text-[10px] text-blue-700/80 dark:text-blue-300/80 flex justify-between font-mono">
              <span>C: {formatCurrency(cards?.eligibleItc?.cgst || 0)}</span>
              <span>S: {formatCurrency(cards?.eligibleItc?.sgst || 0)}</span>
            </div>
          </div>

          {/* Card 4: ITC Reversal */}
          <div className="bg-white dark:bg-surface p-3.5 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50/20 dark:bg-rose-500/5 shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              ITC Reversal
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                {formatCurrency(cards?.itcReversal?.value || 0)}
              </span>
              <span className="p-1 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-md">
                <FaRupeeSign className="size-3" />
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-rose-100 dark:border-border/60 text-[10px] text-rose-700/80 dark:text-rose-300/80 flex justify-between font-mono">
              <span>C: {formatCurrency(cards?.itcReversal?.cgst || 0)}</span>
              <span>S: {formatCurrency(cards?.itcReversal?.sgst || 0)}</span>
            </div>
          </div>

          {/* Card 5: Net ITC */}
          <div className="bg-white dark:bg-surface p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-500/5 shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Net ITC Available
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(cards?.netItc?.value || 0)}
              </span>
              <span className="p-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-md">
                <FaRupeeSign className="size-3" />
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-emerald-100 dark:border-border/60 text-[10px] text-emerald-700/80 dark:text-emerald-300/80 flex justify-between font-mono">
              <span>C: {formatCurrency(cards?.netItc?.cgst || 0)}</span>
              <span>S: {formatCurrency(cards?.netItc?.sgst || 0)}</span>
            </div>
          </div>

          {/* Card 6: Net GST Liability */}
          <div className="bg-white dark:bg-surface p-3.5 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/30 dark:bg-amber-500/10 shadow-xs flex flex-col justify-between transition-colors">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
              Net GST Liability (Cash)
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatCurrency(cards?.netGstLiability?.value || 0)}
              </span>
              <span className="p-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-md">
                <FaRupeeSign className="size-3" />
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-amber-100 dark:border-border/60 text-[10px] text-amber-800/80 dark:text-amber-300/80 flex justify-between font-mono">
              <span>C: {formatCurrency(cards?.netGstLiability?.cgst || 0)}</span>
              <span>S: {formatCurrency(cards?.netGstLiability?.sgst || 0)}</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 3.1: OUTWARD SUPPLIES ── */}
        <div className="bg-white dark:bg-surface rounded-2xl border border-slate-200 dark:border-border shadow-xs overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-border bg-slate-50/60 dark:bg-surface-alt/40 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-text">
                3.1 Details of outward supplies and inward supplies liable to reverse charge
              </h2>
              <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                Aggregated from existing sales invoices, exports, nil/exempt classifications, and RCM inward supplies
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-text-muted">
              {sec31?.total?.voucherCount || 0} vouchers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-surface-alt/80 text-slate-500 dark:text-text-muted border-b border-slate-200 dark:border-border font-bold">
                <tr>
                  <th className="py-3 px-4 w-[80px]">Code</th>
                  <th className="py-3 px-4 min-w-[280px]">Nature of Supplies</th>
                  <th className="py-3 px-4 text-right font-mono">Taxable Value (₹)</th>
                  <th className="py-3 px-4 text-right font-mono">IGST (₹)</th>
                  <th className="py-3 px-4 text-right font-mono">CGST (₹)</th>
                  <th className="py-3 px-4 text-right font-mono">SGST/UTGST (₹)</th>
                  <th className="py-3 px-4 text-right font-mono">Cess (₹)</th>
                  <th className="py-3 px-4 text-right font-mono">Total Tax (₹)</th>
                  <th className="py-3 px-4 text-center w-[90px]">Drill-Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border/60">
                {(sec31?.rows || []).map((row) => (
                  <tr
                    key={row.code}
                    className="hover:bg-slate-50/80 dark:hover:bg-surface-hover/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-text-muted">
                      {row.code}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-text">
                      {row.description}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-text">
                      {formatCurrency(row.taxable)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      {formatCurrency(row.igst)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-text">
                      {formatCurrency(row.cgst)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-text">
                      {formatCurrency(row.sgst)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-text">
                      {formatCurrency(row.cess)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-text">
                      {formatCurrency(row.totalTax)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => openDrillDown(row)}
                        title="Inspect underlying vouchers"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 transition-colors cursor-pointer"
                      >
                        <span>{row.voucherCount || 0}</span>
                        <FiExternalLink className="size-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-surface-alt/90 font-bold border-t-2 border-slate-300 dark:border-border text-slate-900 dark:text-text">
                <tr>
                  <td className="py-3 px-4 font-mono">{sec31?.total?.code || "Total"}</td>
                  <td className="py-3 px-4">{sec31?.total?.description || "Total"}</td>
                  <td className="py-3 px-4 text-right font-mono text-sm">{formatCurrency(sec31?.total?.taxable || 0)}</td>
                  <td className="py-3 px-4 text-right font-mono text-indigo-600 dark:text-indigo-400">{formatCurrency(sec31?.total?.igst || 0)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(sec31?.total?.cgst || 0)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(sec31?.total?.sgst || 0)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(sec31?.total?.cess || 0)}</td>
                  <td className="py-3 px-4 text-right font-mono text-sm font-black">{formatCurrency(sec31?.total?.totalTax || 0)}</td>
                  <td className="py-3 px-4 text-center font-mono text-xs text-slate-500 dark:text-text-muted">{sec31?.total?.voucherCount || 0}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── SECTION 4: ELIGIBLE ITC ── */}
        <div className="bg-white dark:bg-surface rounded-2xl border border-slate-200 dark:border-border shadow-xs overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-border bg-slate-50/60 dark:bg-surface-alt/40 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-text">
                4. Eligible Input Tax Credit (ITC)
              </h2>
              <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                Details of ITC available, ITC reversed, and Net ITC as per purchase bills and GSTR-2 ledgers
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              Net ITC: {formatCurrency(sec4?.netItc?.totalItc || 0)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-surface-alt/80 text-slate-500 dark:text-text-muted border-b border-slate-200 dark:border-border font-bold">
                <tr>
                  <th className="py-3 px-4 w-[90px]">Code</th>
                  <th className="py-3 px-4 min-w-[320px]">Details</th>
                  <th className="py-3 px-4 text-right font-mono">IGST (₹)</th>
                  <th className="py-3 px-4 text-right font-mono">CGST (₹)</th>
                  <th className="py-3 px-4 text-right font-mono">SGST/UTGST (₹)</th>
                  <th className="py-3 px-4 text-right font-mono">Cess (₹)</th>
                  <th className="py-3 px-4 text-right font-mono">Total ITC (₹)</th>
                  <th className="py-3 px-4 text-center w-[90px]">Drill-Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border/60">
                {/* 4(A) Header */}
                <tr className="bg-slate-50/60 dark:bg-surface-alt/30 font-bold text-slate-800 dark:text-text">
                  <td colSpan={8} className="py-2.5 px-4 text-xs">
                    (A) ITC Available (whether in full or part)
                  </td>
                </tr>
                {(sec4?.available?.rows || []).map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50/80 dark:hover:bg-surface-hover/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-700 dark:text-text-muted pl-6">
                      {row.code}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-text">
                      {row.description}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      {formatCurrency(row.igst)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-text">
                      {formatCurrency(row.cgst)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-text">
                      {formatCurrency(row.sgst)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-text">
                      {formatCurrency(row.cess)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-text">
                      {formatCurrency(row.totalItc)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => openDrillDown(row)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 transition-colors cursor-pointer"
                      >
                        <span>{row.voucherCount || 0}</span>
                        <FiExternalLink className="size-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {/* 4(A) Subtotal */}
                <tr className="bg-blue-50/40 dark:bg-blue-500/5 font-bold border-t border-blue-200 dark:border-border text-blue-900 dark:text-blue-300">
                  <td className="py-2.5 px-4 font-mono">{sec4?.available?.total?.code || "4(A)"}</td>
                  <td className="py-2.5 px-4">{sec4?.available?.total?.description || "Subtotal (A)"}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{formatCurrency(sec4?.available?.total?.igst || 0)}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{formatCurrency(sec4?.available?.total?.cgst || 0)}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{formatCurrency(sec4?.available?.total?.sgst || 0)}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{formatCurrency(sec4?.available?.total?.cess || 0)}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black">{formatCurrency(sec4?.available?.total?.totalItc || 0)}</td>
                  <td></td>
                </tr>

                {/* 4(B) Header */}
                <tr className="bg-slate-50/60 dark:bg-surface-alt/30 font-bold text-slate-800 dark:text-text">
                  <td colSpan={8} className="py-2.5 px-4 text-xs">
                    (B) ITC Reversed
                  </td>
                </tr>
                {(sec4?.reversed?.rows || []).map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50/80 dark:hover:bg-surface-hover/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-700 dark:text-text-muted pl-6">
                      {row.code}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-text">
                      {row.description}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold">
                      {formatCurrency(row.igst)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-text">
                      {formatCurrency(row.cgst)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-text">
                      {formatCurrency(row.sgst)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700 dark:text-text">
                      {formatCurrency(row.cess)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(row.totalItc)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => openDrillDown(row)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/20 transition-colors cursor-pointer"
                      >
                        <span>{row.voucherCount || 0}</span>
                        <FiExternalLink className="size-3" />
                      </button>
                    </td>
                  </tr>
                ))}
                {/* 4(B) Subtotal */}
                <tr className="bg-rose-50/40 dark:bg-rose-500/5 font-bold border-t border-rose-200 dark:border-border text-rose-900 dark:text-rose-300">
                  <td className="py-2.5 px-4 font-mono">{sec4?.reversed?.total?.code || "4(B)"}</td>
                  <td className="py-2.5 px-4">{sec4?.reversed?.total?.description || "Subtotal (B)"}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{formatCurrency(sec4?.reversed?.total?.igst || 0)}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{formatCurrency(sec4?.reversed?.total?.cgst || 0)}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{formatCurrency(sec4?.reversed?.total?.sgst || 0)}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{formatCurrency(sec4?.reversed?.total?.cess || 0)}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black">{formatCurrency(sec4?.reversed?.total?.totalItc || 0)}</td>
                  <td></td>
                </tr>

                {/* 4(C) NET ITC AVAILABLE */}
                <tr className="bg-emerald-50 dark:bg-emerald-500/10 font-bold border-t-2 border-emerald-300 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-300">
                  <td className="py-3 px-4 font-mono text-sm">{sec4?.netItc?.code || "4(C)"}</td>
                  <td className="py-3 px-4 text-sm">{sec4?.netItc?.description || "(C) Net ITC Available (A) - (B)"}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(sec4?.netItc?.igst || 0)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(sec4?.netItc?.cgst || 0)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(sec4?.netItc?.sgst || 0)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(sec4?.netItc?.cess || 0)}</td>
                  <td className="py-3 px-4 text-right font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(sec4?.netItc?.totalItc || 0)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── TAX LIABILITY & STATUTORY UTILIZATION MATRIX ── */}
        <div className="bg-white dark:bg-surface rounded-2xl border border-slate-200 dark:border-border shadow-xs overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-border bg-slate-50/60 dark:bg-surface-alt/40 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-text">
                5 / 6. Tax Liability and Set-Off Matrix
              </h2>
              <p className="text-xs text-slate-500 dark:text-text-muted mt-0.5">
                Output liability offset with Net Eligible ITC following GST statutory utilization rules (Rule 88A)
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 font-mono">
              Cash Payable: {formatCurrency(taxLiab?.cashPayable?.total || 0)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-surface-alt/80 text-slate-500 dark:text-text-muted border-b border-slate-200 dark:border-border font-bold">
                <tr>
                  <th className="py-3 px-4 min-w-[280px]">Description</th>
                  <th className="py-3 px-4 text-right font-mono">IGST (₹)</th>
                  <th className="py-3 px-4 text-right font-mono">CGST (₹)</th>
                  <th className="py-3 px-4 text-right font-mono">SGST/UTGST (₹)</th>
                  <th className="py-3 px-4 text-right font-mono">Cess (₹)</th>
                  <th className="py-3 px-4 text-right font-mono">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border/60">
                {/* 1. Output Tax Liability */}
                <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-hover/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-text">
                    Output Tax Liability (Section 3.1 a + b)
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                    {formatCurrency(taxLiab?.outputTax?.igst || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-text">
                    {formatCurrency(taxLiab?.outputTax?.cgst || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-text">
                    {formatCurrency(taxLiab?.outputTax?.sgst || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-text">
                    {formatCurrency(taxLiab?.outputTax?.cess || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-text">
                    {formatCurrency(taxLiab?.outputTax?.total || 0)}
                  </td>
                </tr>

                {/* 2. RCM Liability */}
                <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-hover/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-text">
                    + Inward Supplies Liable to Reverse Charge (RCM)
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                    {formatCurrency(taxLiab?.rcmTax?.igst || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-text">
                    {formatCurrency(taxLiab?.rcmTax?.cgst || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-text">
                    {formatCurrency(taxLiab?.rcmTax?.sgst || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-text">
                    {formatCurrency(taxLiab?.rcmTax?.cess || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-text">
                    {formatCurrency(taxLiab?.rcmTax?.total || 0)}
                  </td>
                </tr>

                {/* 3. Total Gross Liability */}
                <tr className="bg-slate-50 dark:bg-surface-alt/40 font-bold border-t border-slate-200 dark:border-border text-slate-900 dark:text-text">
                  <td className="py-3 px-4">Total Tax Liability (Gross)</td>
                  <td className="py-3 px-4 text-right font-mono text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(taxLiab?.totalLiability?.igst || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(taxLiab?.totalLiability?.cgst || 0)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(taxLiab?.totalLiability?.sgst || 0)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(taxLiab?.totalLiability?.cess || 0)}</td>
                  <td className="py-3 px-4 text-right font-mono text-sm font-black">
                    {formatCurrency(taxLiab?.totalLiability?.total || 0)}
                  </td>
                </tr>

                {/* 4. Less: Paid Through ITC */}
                <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-hover/60 transition-colors text-emerald-700 dark:text-emerald-400">
                  <td className="py-3 px-4 font-semibold">
                    - Less: Paid Through ITC (Rule 88A)
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">
                    {formatCurrency(taxLiab?.itcUtilized?.igst || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">
                    {formatCurrency(taxLiab?.itcUtilized?.cgst || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">
                    {formatCurrency(taxLiab?.itcUtilized?.sgst || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">
                    {formatCurrency(taxLiab?.itcUtilized?.cess || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {formatCurrency(taxLiab?.itcUtilized?.total || 0)}
                  </td>
                </tr>

                {/* 5. Net Tax Payable in Cash */}
                <tr className="bg-amber-50/70 dark:bg-amber-500/10 font-bold border-t-2 border-amber-300 dark:border-amber-500/30 text-amber-950 dark:text-amber-300">
                  <td className="py-3.5 px-4 text-sm">
                    = Net Tax Payable in Cash
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-indigo-700 dark:text-indigo-400 font-black">
                    {formatCurrency(taxLiab?.cashPayable?.igst || 0)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black">
                    {formatCurrency(taxLiab?.cashPayable?.cgst || 0)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black">
                    {formatCurrency(taxLiab?.cashPayable?.sgst || 0)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black">
                    {formatCurrency(taxLiab?.cashPayable?.cess || 0)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-base font-black text-amber-600 dark:text-amber-400">
                    {formatCurrency(taxLiab?.cashPayable?.total || 0)}
                  </td>
                </tr>

                {/* 6. Closing ITC Balance Carried Forward */}
                <tr className="bg-slate-50/40 dark:bg-surface-alt/20 text-slate-500 dark:text-text-muted text-[11px]">
                  <td className="py-2.5 px-4 italic">
                    Closing ITC Balance (Carried Forward to Next Period)
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {formatCurrency(taxLiab?.closingItcBalance?.igst || 0)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {formatCurrency(taxLiab?.closingItcBalance?.cgst || 0)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {formatCurrency(taxLiab?.closingItcBalance?.sgst || 0)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {formatCurrency(taxLiab?.closingItcBalance?.cess || 0)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-text">
                    {formatCurrency(taxLiab?.closingItcBalance?.total || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── RECONCILIATION SUMMARY ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Outward Tax Reconciliation */}
          <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-slate-200 dark:border-border shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-text">
                Outward Tax Reconciliation
              </span>
              {recon?.outward?.isMatched ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <FiCheckCircle className="size-3.5" /> Matched
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                  <FiAlertCircle className="size-3.5" /> Difference
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-border/60">
                <span className="text-slate-500 dark:text-text-muted">GSTR-1 Outward Tax:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-text">
                  {formatCurrency(recon?.outward?.gstr1TotalTax || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-border/60">
                <span className="text-slate-500 dark:text-text-muted">GSTR-3B Outward Tax:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-text">
                  {formatCurrency(recon?.outward?.gstr3bTotalTax || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1 pt-2 font-bold">
                <span className="text-slate-700 dark:text-text">Variance / Difference:</span>
                <span className={`font-mono ${recon?.outward?.isMatched ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400 font-bold"}`}>
                  {formatCurrency(recon?.outward?.difference || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* ITC Reconciliation */}
          <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-slate-200 dark:border-border shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-text">
                Purchase ITC Reconciliation
              </span>
              {recon?.itc?.isMatched ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <FiCheckCircle className="size-3.5" /> Matched
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                  <FiAlertCircle className="size-3.5" /> Difference
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-border/60">
                <span className="text-slate-500 dark:text-text-muted">GSTR-2 Purchase ITC:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-text">
                  {formatCurrency(recon?.itc?.gstr2TotalItc || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-border/60">
                <span className="text-slate-500 dark:text-text-muted">GSTR-3B Net ITC:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-text">
                  {formatCurrency(recon?.itc?.gstr3bNetItc || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1 pt-2 font-bold">
                <span className="text-slate-700 dark:text-text">Variance / Difference:</span>
                <span className={`font-mono ${recon?.itc?.isMatched ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400 font-bold"}`}>
                  {formatCurrency(recon?.itc?.difference || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Drill-Down Voucher Inspection Modal */}
      <Gstr3bDrillDownModal
        isOpen={isDrillDownOpen}
        onClose={closeDrillDown}
        data={drillDownData}
      />
    </div>
  );
};

export default Gstr3bDesktopPage;
