import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiList,
  FiBookOpen,
  FiUsers,
  FiTruck,
  FiDollarSign,
  FiBriefcase,
  FiTrendingUp,
  FiLayers,
  FiFileText,
  FiPrinter,
  FiPlay,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowLeft,
} from "react-icons/fi";
import { FaWallet, FaUniversity } from "react-icons/fa";

import {
  AppBreadcrumb,
  AppButton,
  AppCard,
  AppHeading,
  AppInput,
  AppSelect,
  AppText,
  PageHeader,
  AppTablePagination,
  AppBox,
} from "@/components";
import { formatDate } from "@/utils";
import { API_STATUS, ROUTES } from "@/constants";
import { CompanyFilterSelect } from "@/components/shared";

// 9 report modules metadata
const REPORT_MODULES = [
  {
    key: "trial-balance",
    title: "Trial Balance",
    desc: "Summary of all ledger accounts with debit, credit and closing balances. Total Debits = Total Credits.",
    icon: <FiList />,
  },
  {
    key: "general-ledger",
    title: "General Ledger",
    desc: "Complete transaction history for any account within a selected date range.",
    icon: <FiBookOpen />,
  },
  {
    key: "customer-ledger",
    title: "Customer Ledger",
    desc: "Detailed statement for a specific customer including invoices, receipts and outstanding balance.",
    icon: <FiUsers />,
  },
  {
    key: "supplier-ledger",
    title: "Supplier Ledger",
    desc: "Detailed statement for a specific supplier including bills, payments and outstanding balance.",
    icon: <FiTruck />,
  },
  {
    key: "cash-book",
    title: "Cash Book",
    desc: "All cash inflows and outflows. Daily and monthly cash position with running balance.",
    icon: <FaWallet />,
  },
  {
    key: "bank-book",
    title: "Bank Book",
    desc: "All bank transactions including deposits, withdrawals, transfers and cheques.",
    icon: <FaUniversity />,
  },
  {
    key: "profit-loss",
    title: "Profit & Loss Statement",
    desc: "Summary of income and expenses to calculate Net Profit or Loss for a period.",
    icon: <FiTrendingUp />,
  },
  {
    key: "balance-sheet",
    title: "Balance Sheet",
    desc: "Statement of Assets, Liabilities and Equity as on a specific date.",
    icon: <FiLayers />,
  },
  {
    key: "gst-report",
    title: "GST Reports",
    desc: "GST reports including GSTR-1, GSTR-2 and GST Summary for compliance filing.",
    icon: <FiFileText />,
  },
];

const ReportViewerDesktopPage = ({
  reportType,
  reportData,
  status,
  error,
  message,
  filters,
  companyFilter,
  accountOptions = [],
  customerOptions = [],
  supplierOptions = [],
  handleFilterChange,
  runReport,
  handleBackToDashboard,
  clearFeedback,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
}) => {
  const navigate = useNavigate();

  const currentReportInfo = useMemo(() => {
    return REPORT_MODULES.find((r) => r.key === reportType);
  }, [reportType]);

  const navigateToReport = (key) => {
    window.location.pathname = `/finance/reports/${key}`;
  };

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    const formatted = Math.abs(num).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `₹ ${formatted}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const isLoading = status === API_STATUS.LOADING;
  const isError = status === API_STATUS.ERROR;
  const activeReportTitle = currentReportInfo?.title || "Financial Report";

  return (
    <section className="min-h-[calc(100vh-58px)] bg-bg px-6 py-5">
      {/* Dynamic Printing CSS */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          section {
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }
          nav, header, button, .no-print, [role="button"], .breadcrumb-container, .filters-container, .sidebar-container {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1400px]">
        {/* Page Header */}
        <div className="no-print">
          <PageHeader
            title={activeReportTitle}
            subtitle={currentReportInfo?.desc}
            extra={
              <AppBreadcrumb
                size="small"
                variant="text"
                items={[
                  {
                    label: "Dashboard",
                    onClick: () => navigate(ROUTES.DASHBOARD),
                  },
                  {
                    label: "Finance & Accounting",
                    onClick: () => navigate(ROUTES.FINANCE),
                  },
                  { label: "Reports", onClick: handleBackToDashboard },
                  { label: activeReportTitle, current: true },
                ]}
                sx={breadcrumbSx}
                itemSx={breadcrumbItemSx}
                currentItemSx={breadcrumbCurrentSx}
              />
            }
            actions={
              <AppButton
                variant="outlined"
                colorVariant="neutral"
                size="small"
                rounded="md"
                startIcon={<FiArrowLeft />}
                onClick={handleBackToDashboard}
                sx={backBtnSx}
              >
                Back to Reports
              </AppButton>
            }
            align="flex-start"
            justify="space-between"
            sx={pageHeaderSx}
            contentSx={pageHeaderContentSx}
          />
        </div>

        {/* Feedback Alert */}
        {(error || message) && (
          <div
            className={`mt-4 p-3 text-[12.5px] font-semibold rounded-md flex justify-between items-center no-print ${
              error
                ? "bg-danger-soft text-danger"
                : "bg-success-soft text-success"
            }`}
          >
            <span>{error || message}</span>
            <button
              onClick={clearFeedback}
              className={`font-bold hover:underline ${error ? "text-danger" : "text-success"}`}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mt-5 print-full-width">
          {/* Filters */}
          <div className="no-print mb-4">
            <AppCard variant="default" rounded="lg" bordered shadow="sm">
              <div className="p-4 flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-wrap items-end gap-3">
                  {/* Workspace Level Company Filter (Zero width/elements at Company level) */}
                  <CompanyFilterSelect
                    value={companyFilter?.selectedCompanyId || "all"}
                    onChange={companyFilter?.setSelectedCompanyId}
                    size="sm"
                    label="Company Scope"
                    showLabel
                    className="w-[180px]"
                  />

                  {/* Trial Balance & Balance Sheet Date */}
                  {(reportType === "trial-balance" ||
                    reportType === "balance-sheet") && (
                    <AppInput
                      type="date"
                      label="As Of Date"
                      name="asOfDate"
                      value={filters.asOfDate}
                      onChange={(e) =>
                        handleFilterChange("asOfDate", e.target.value)
                      }
                      size="small"
                      formControlSx={{ width: 160 }}
                      inputSx={compactFilterInputSx}
                      labelSx={filterLabelSx}
                    />
                  )}

                  {/* include zero balance checkbox */}
                  {reportType === "trial-balance" && (
                    <div className="flex items-center h-8 mb-0.5">
                      <label className="flex items-center gap-2 text-[11.5px] font-semibold text-text cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          checked={filters.includeZeroBalances}
                          onChange={(e) =>
                            handleFilterChange(
                              "includeZeroBalances",
                              e.target.checked,
                            )
                          }
                        />
                        Include Zero Balances
                      </label>
                    </div>
                  )}

                  {/* Date Ranges */}
                  {reportType !== "trial-balance" &&
                    reportType !== "balance-sheet" && (
                      <>
                        <AppInput
                          type="date"
                          label="From Date"
                          name="startDate"
                          value={filters.startDate}
                          onChange={(e) =>
                            handleFilterChange("startDate", e.target.value)
                          }
                          size="small"
                          formControlSx={{ width: 160 }}
                          inputSx={compactFilterInputSx}
                          labelSx={filterLabelSx}
                        />
                        <AppInput
                          type="date"
                          label="To Date"
                          name="endDate"
                          value={filters.endDate}
                          onChange={(e) =>
                            handleFilterChange("endDate", e.target.value)
                          }
                          size="small"
                          formControlSx={{ width: 160 }}
                          inputSx={compactFilterInputSx}
                          labelSx={filterLabelSx}
                        />
                      </>
                    )}

                  {/* Account Selector */}
                  {(reportType === "general-ledger" ||
                    reportType === "cash-book" ||
                    reportType === "bank-book" ||
                    reportType === "customer-ledger" ||
                    reportType === "supplier-ledger") && (
                    <AppSelect
                      label="Account Filter"
                      name="accountId"
                      value={filters.accountId}
                      onChange={(e) =>
                        handleFilterChange("accountId", e.target.value)
                      }
                      options={accountOptions}
                      size="small"
                      variant="bordered"
                      rounded="md"
                      formControlSx={{ width: 200 }}
                      inputSx={compactFilterInputSx}
                      labelSx={filterLabelSx}
                    />
                  )}

                  {/* Customer Selector */}
                  {reportType === "customer-ledger" && (
                    <AppSelect
                      label="Select Customer"
                      name="customerId"
                      value={filters.customerId}
                      onChange={(e) =>
                        handleFilterChange("customerId", e.target.value)
                      }
                      options={customerOptions}
                      size="small"
                      variant="bordered"
                      rounded="md"
                      formControlSx={{ width: 200 }}
                      inputSx={compactFilterInputSx}
                      labelSx={filterLabelSx}
                    />
                  )}

                  {/* Supplier Selector */}
                  {reportType === "supplier-ledger" && (
                    <AppSelect
                      label="Select Supplier"
                      name="supplierId"
                      value={filters.supplierId}
                      onChange={(e) =>
                        handleFilterChange("supplierId", e.target.value)
                      }
                      options={supplierOptions}
                      size="small"
                      variant="bordered"
                      rounded="md"
                      formControlSx={{ width: 200 }}
                      inputSx={compactFilterInputSx}
                      labelSx={filterLabelSx}
                    />
                  )}

                  {/* GST Type Selector */}
                  {reportType === "gst-report" && (
                    <AppSelect
                      label="GST Report Type"
                      name="gstType"
                      value={filters.gstType}
                      onChange={(e) =>
                        handleFilterChange("gstType", e.target.value)
                      }
                      options={[
                        { label: "GST Summary", value: "SUMMARY" },
                        { label: "GSTR-1 (Sales)", value: "GSTR1" },
                        { label: "GSTR-2 (Purchases)", value: "GSTR2" },
                      ]}
                      size="small"
                      variant="bordered"
                      rounded="md"
                      formControlSx={{ width: 180 }}
                      inputSx={compactFilterInputSx}
                      labelSx={filterLabelSx}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <AppButton
                    variant="contained"
                    colorVariant="primary"
                    size="small"
                    rounded="md"
                    startIcon={<FiPlay />}
                    onClick={runReport}
                    disabled={isLoading}
                    loading={isLoading}
                    sx={actionBtnSx}
                  >
                    Run Report
                  </AppButton>
                  <AppButton
                    variant="outlined"
                    colorVariant="primary"
                    size="small"
                    rounded="md"
                    startIcon={<FiPrinter />}
                    onClick={handlePrint}
                    disabled={isLoading || !reportData}
                    sx={actionBtnSx}
                  >
                    Print
                  </AppButton>
                </div>
              </div>
            </AppCard>
          </div>

          {/* Content Area */}
          <AppCard
            variant="default"
            rounded="lg"
            bordered
            shadow="sm"
            padding="none"
            className="print-full-width"
          >
            <div id="printable-report-area" className="p-6">
              {/* Professional ERP Header Grid */}
              <div className="border border-border/80 rounded-md p-4 bg-surface-hover/5 mb-6 text-[11.5px] text-text">
                <div className="flex justify-between items-start border-b border-border/50 pb-2 mb-3">
                  <div>
                    <h1 className="text-[14px] font-black tracking-tight text-text uppercase">
                      ERP ENTERPRISE SYSTEMS LTD.
                    </h1>
                    <h2 className="text-[12px] font-bold text-text-muted mt-0.5 uppercase tracking-wide">
                      {activeReportTitle}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary-soft text-primary text-[9.5px] font-bold uppercase tracking-wider">
                      Official Statement
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-x-4 gap-y-2">
                  <div>
                    <span className="text-text-muted block text-[9.5px] font-bold uppercase">
                      Statement Period
                    </span>
                    <span className="font-bold text-text mt-0.5 block">
                      {filters.startDate && filters.endDate
                        ? `${formatDate(filters.startDate)} to ${formatDate(filters.endDate)}`
                        : filters.asOfDate
                          ? `As of ${formatDate(filters.asOfDate)}`
                          : "All-time"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[9.5px] font-bold uppercase">
                      Currency
                    </span>
                    <span className="font-bold text-text mt-0.5 block">
                      INR (₹)
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[9.5px] font-bold uppercase">
                      Run Date & Time
                    </span>
                    <span className="font-bold text-text mt-0.5 block">
                      {formatDate(new Date())}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[9.5px] font-bold uppercase">
                      Report Status
                    </span>
                    <span className="font-bold text-[#2b8a3e] mt-0.5 block flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2b8a3e] inline-block"></span>
                      Reconciled
                    </span>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                  <AppText
                    variant="body2"
                    sx={{
                      color: "var(--app-color-text-muted)",
                      fontWeight: 650,
                    }}
                  >
                    Loading report data...
                  </AppText>
                </div>
              ) : isError ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <FiAlertCircle className="text-[36px] text-danger mb-3" />
                  <AppHeading
                    level={3}
                    weight={600}
                    sx={{
                      m: 0,
                      fontSize: "14px",
                      color: "var(--app-color-text)",
                    }}
                  >
                    Report Error
                  </AppHeading>
                  <AppText
                    variant="body2"
                    sx={{ color: "var(--app-color-text-muted)", mt: 0.5 }}
                  >
                    {error ||
                      "An error occurred while compiling ledger accounts."}
                  </AppText>
                </div>
              ) : !reportData ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <FiPlay className="text-[36px] text-text-muted/40 mb-3" />
                  <AppHeading
                    level={3}
                    weight={600}
                    sx={{
                      m: 0,
                      fontSize: "14px",
                      color: "var(--app-color-text)",
                    }}
                  >
                    No Data Selected
                  </AppHeading>
                  <AppText
                    variant="body2"
                    sx={{ color: "var(--app-color-text-muted)", mt: 0.5 }}
                  >
                    Select filter parameters above and click "Run Report" to
                    populate.
                  </AppText>
                </div>
              ) : (
                <div>
                  {reportType === "trial-balance" && (
                    <TrialBalanceView
                      data={reportData}
                      formatCurrency={formatCurrency}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      pageSize={pageSize}
                      setPageSize={setPageSize}
                    />
                  )}
                  {(reportType === "general-ledger" ||
                    reportType === "customer-ledger" ||
                    reportType === "supplier-ledger" ||
                    reportType === "cash-book" ||
                    reportType === "bank-book") && (
                    <LedgerBookView
                      data={reportData}
                      formatCurrency={formatCurrency}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      pageSize={pageSize}
                      setPageSize={setPageSize}
                    />
                  )}
                  {reportType === "profit-loss" && (
                    <ProfitLossView
                      data={reportData}
                      formatCurrency={formatCurrency}
                    />
                  )}
                  {reportType === "balance-sheet" && (
                    <BalanceSheetView
                      data={reportData}
                      formatCurrency={formatCurrency}
                    />
                  )}
                  {reportType === "gst-report" && (
                    <GstReportView
                      data={reportData}
                      gstType={filters.gstType}
                      formatCurrency={formatCurrency}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      pageSize={pageSize}
                      setPageSize={setPageSize}
                    />
                  )}
                </div>
              )}
            </div>
          </AppCard>
        </div>
      </div>
    </section>
  );
};

/* Child View Tables identical to ReportsDesktopPage */
const TrialBalanceView = ({
  data,
  formatCurrency,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
}) => {
  const rows = data.rows || [];
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, currentPage, pageSize]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-[11.5px] border border-border/40">
        <thead>
          <tr className="border-b border-border/40 bg-surface-hover/10 text-text font-bold uppercase tracking-wider">
            <th className="py-2.5 px-3 font-bold text-[10px] w-24">Code</th>
            <th className="py-2.5 px-3 font-bold text-[10px]">Account Name</th>
            <th className="py-2.5 px-3 font-bold text-[10px]">Nature</th>
            <th className="py-2.5 px-3 font-bold text-[10px]">Category</th>
            <th className="py-2.5 px-3 text-right font-bold text-[10px]">
              Debit Total (Dr)
            </th>
            <th className="py-2.5 px-3 text-right font-bold text-[10px]">
              Credit Total (Cr)
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, idx) => (
            <tr
              key={row.accountId || idx}
              className="border-b border-border/30 hover:bg-surface-hover/5 transition"
            >
              <td className="py-2 px-3 font-mono font-bold text-text-muted">
                {row.accountCode}
              </td>
              <td className="py-2 px-3 font-semibold text-text">
                {row.accountName}
              </td>
              <td className="py-2 px-3 text-text-muted">{row.accountNature}</td>
              <td className="py-2 px-3 text-text-muted">
                {row.accountCategory}
              </td>
              <td className="py-2 px-3 text-right font-mono font-semibold text-[#2b8a3e]">
                {row.debitTotal > 0 ? (
                  formatCurrency(row.debitTotal)
                ) : (
                  <span className="text-text-muted/40 font-normal">₹0.00</span>
                )}
              </td>
              <td className="py-2 px-3 text-right font-mono font-semibold text-[#c92a2a]">
                {row.creditTotal > 0 ? (
                  formatCurrency(row.creditTotal)
                ) : (
                  <span className="text-text-muted/40 font-normal">₹0.00</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-b-4 border-double border-text bg-surface-hover/10 font-bold text-text">
            <td colSpan={4} className="py-3 px-3 text-right font-bold">
              Total Balances
            </td>
            <td className="py-3 px-3 text-right font-mono font-black text-[#2b8a3e]">
              {formatCurrency(data.totalDebit)}
            </td>
            <td className="py-3 px-3 text-right font-mono font-black text-[#c92a2a]">
              {formatCurrency(data.totalCredit)}
            </td>
          </tr>
        </tfoot>
      </table>
      {rows.length > pageSize && (
        <AppBox sx={paginationFooterWrapperSx} className="no-print">
          <AppTablePagination
            page={currentPage}
            pageSize={pageSize}
            totalItems={rows.length}
            onPageChange={(e, newPage) => setCurrentPage(newPage)}
            onPageSizeChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          />
        </AppBox>
      )}
      <div className="mt-5 p-4 rounded-lg flex items-center justify-between border no-print bg-surface-hover/5 border-border/80">
        <div className="flex items-center gap-3">
          {data.isBalanced ? (
            <FiCheckCircle className="text-[20px] text-[#2b8a3e]" />
          ) : (
            <FiAlertCircle className="text-[20px] text-[#c92a2a]" />
          )}
          <div>
            <span className="block text-[12.5px] font-bold text-text">
              Statement Status:{" "}
              {data.isBalanced ? "Balanced & Reconciled" : "Out of Balance"}
            </span>
            <span className="block text-[11px] text-text-muted mt-0.5">
              Automated debit-credit equation check.
            </span>
          </div>
        </div>
        <div>
          <span
            className={`text-[15px] font-black font-mono ${data.isBalanced ? "text-[#2b8a3e]" : "text-[#c92a2a]"}`}
          >
            {formatCurrency(Math.abs(data.totalDebit - data.totalCredit))}
          </span>
        </div>
      </div>
    </div>
  );
};

const LedgerBookView = ({
  data,
  formatCurrency,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
}) => {
  const entries = data.entries || [];
  const openingBalance = data.openingBalance || 0;
  const openingBalanceType = data.openingBalanceType || "DR";
  const totals = data.totals || {
    debit: 0,
    credit: 0,
    closingBalance: 0,
    closingBalanceType: "DR",
  };

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return entries.slice(start, start + pageSize);
  }, [entries, currentPage, pageSize]);

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-5 no-print">
        <div className="border border-border/80 p-3 bg-surface rounded-lg shadow-sm">
          <span className="text-[9px] font-bold uppercase text-text-muted block tracking-wider">
            Opening Balance
          </span>
          <span className="text-[14px] font-extrabold text-text mt-1 block font-mono">
            {formatCurrency(openingBalance)}{" "}
            <span className="text-[9.5px] text-text-muted font-black">
              {openingBalanceType}
            </span>
          </span>
        </div>
        <div className="border border-border/80 p-3 bg-surface rounded-lg shadow-sm">
          <span className="text-[9px] font-bold uppercase text-text-muted block tracking-wider">
            Total Debits
          </span>
          <span className="text-[14px] font-extrabold text-[#2b8a3e] mt-1 block font-mono">
            {formatCurrency(totals.debit)}
          </span>
        </div>
        <div className="border border-border/80 p-3 bg-surface rounded-lg shadow-sm">
          <span className="text-[9px] font-bold uppercase text-text-muted block tracking-wider">
            Total Credits
          </span>
          <span className="text-[14px] font-extrabold text-[#c92a2a] mt-1 block font-mono">
            {formatCurrency(totals.credit)}
          </span>
        </div>
        <div className="border border-border/80 p-3 bg-surface rounded-lg shadow-sm">
          <span className="text-[9px] font-bold uppercase text-text-muted block tracking-wider">
            Closing Balance
          </span>
          <span className="text-[14px] font-extrabold text-primary mt-1 block font-mono">
            {formatCurrency(totals.closingBalance)}{" "}
            <span className="text-[9.5px] text-text-muted font-black">
              {totals.closingBalanceType}
            </span>
          </span>
        </div>
      </div>

      <table className="w-full text-left border-collapse text-[11.5px] border border-border/40">
        <thead>
          <tr className="border-b border-border/40 bg-surface-hover/10 font-bold text-text uppercase tracking-wider">
            <th className="py-2.5 px-3 font-bold text-[10px] w-24">Date</th>
            <th className="py-2.5 px-3 font-bold text-[10px] w-28">
              Voucher No
            </th>
            <th className="py-2.5 px-3 font-bold text-[10px]">Account Name</th>
            <th className="py-2.5 px-3 font-bold text-[10px]">Narration</th>
            <th className="py-2.5 px-3 text-right font-bold text-[10px] w-28">
              Debit (Dr)
            </th>
            <th className="py-2.5 px-3 text-right font-bold text-[10px] w-28">
              Credit (Cr)
            </th>
            <th className="py-2.5 px-3 text-right font-bold text-[10px] w-32">
              Running Balance
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border/30 bg-surface-hover/5">
            <td colSpan={4} className="py-2 px-3 text-text-muted italic">
              Opening balance carried forward
            </td>
            <td className="py-2 px-3 text-right font-mono font-semibold text-[#2b8a3e]">
              {openingBalanceType === "DR" ? (
                formatCurrency(openingBalance)
              ) : (
                <span className="text-text-muted/40 font-normal">₹0.00</span>
              )}
            </td>
            <td className="py-2 px-3 text-right font-mono font-semibold text-[#c92a2a]">
              {openingBalanceType === "CR" ? (
                formatCurrency(openingBalance)
              ) : (
                <span className="text-text-muted/40 font-normal">₹0.00</span>
              )}
            </td>
            <td className="py-2 px-3 text-right font-mono font-black text-text">
              {formatCurrency(openingBalance)}
            </td>
          </tr>
          {paginatedEntries.map((e, idx) => (
            <tr
              key={e._id || idx}
              className="border-b border-border/30 hover:bg-surface-hover/5 transition"
            >
              <td className="py-2 px-3 text-text-muted">
                {formatDate(e.voucherDate)}
              </td>
              <td className="py-2 px-3 text-text font-bold font-mono">
                {e.voucherNumber || e.voucherId?.voucherNumber || "JV-ADJ"}
              </td>
              <td className="py-2 px-3 font-semibold text-text">
                {e.accountId?.accountName || "Self"}
              </td>
              <td className="py-2 px-3 text-text-muted">
                {e.narration || "N/A"}
              </td>
              <td className="py-2 px-3 text-right font-mono font-semibold text-[#2b8a3e]">
                {e.debit > 0 ? (
                  formatCurrency(e.debit)
                ) : (
                  <span className="text-text-muted/40 font-normal">₹0.00</span>
                )}
              </td>
              <td className="py-2 px-3 text-right font-mono font-semibold text-[#c92a2a]">
                {e.credit > 0 ? (
                  formatCurrency(e.credit)
                ) : (
                  <span className="text-text-muted/40 font-normal">₹0.00</span>
                )}
              </td>
              <td className="py-2 px-3 text-right font-mono font-black text-text">
                {formatCurrency(Math.abs(e.runningBalance))}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-b-4 border-double border-text bg-surface-hover/10 font-bold text-text">
            <td colSpan={4} className="py-3 px-3 text-right font-bold">
              Total Operations & Closing
            </td>
            <td className="py-3 px-3 text-right font-mono font-black text-[#2b8a3e]">
              {formatCurrency(totals.debit)}
            </td>
            <td className="py-3 px-3 text-right font-mono font-black text-[#c92a2a]">
              {formatCurrency(totals.credit)}
            </td>
            <td className="py-3 px-3 text-right font-mono font-black text-primary">
              {formatCurrency(totals.closingBalance)}{" "}
              <span className="text-[9px] text-text-muted font-bold">
                {totals.closingBalanceType}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
      {entries.length > pageSize && (
        <AppBox sx={paginationFooterWrapperSx} className="no-print">
          <AppTablePagination
            page={currentPage}
            pageSize={pageSize}
            totalItems={entries.length}
            onPageChange={(e, newPage) => setCurrentPage(newPage)}
            onPageSizeChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          />
        </AppBox>
      )}
    </div>
  );
};

const ProfitLossView = ({ data, formatCurrency }) => {
  return (
    <div>
      <div className="grid grid-cols-2 gap-8 mt-4">
        <div>
          <h3 className="text-[12px] font-black text-text border-b border-border pb-1.5 uppercase tracking-wide">
            Revenue & Inflows
          </h3>
          <table className="w-full text-left mt-2 text-[11.5px] border border-border/40">
            <thead>
              <tr className="border-b border-border/40 bg-surface-hover/10 text-text font-bold uppercase tracking-wider">
                <th className="py-2 px-3 font-bold text-[10px] w-24">Code</th>
                <th className="py-2 px-3 font-bold text-[10px]">
                  Account Name
                </th>
                <th className="py-2 px-3 text-right font-bold text-[10px] w-32">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.income?.map((item, idx) => (
                <tr
                  key={item.accountId || idx}
                  className="border-b border-border/30 hover:bg-surface-hover/5 transition"
                >
                  <td className="py-2 px-3 font-mono text-[11px] text-text-muted">
                    {item.accountCode}
                  </td>
                  <td className="py-2 px-3 font-semibold text-text">
                    {item.accountName}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#2b8a3e]">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-b-4 border-double border-text bg-surface-hover/10 font-bold text-text">
                <td colSpan={2} className="py-2.5 px-3 text-right font-bold">
                  Total Revenue
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-black text-[#2b8a3e]">
                  {formatCurrency(data.totalIncome)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div>
          <h3 className="text-[12px] font-black text-text border-b border-border pb-1.5 uppercase tracking-wide">
            Operating Expenses
          </h3>
          <table className="w-full text-left mt-2 text-[11.5px] border border-border/40">
            <thead>
              <tr className="border-b border-border/40 bg-surface-hover/10 text-text font-bold uppercase tracking-wider">
                <th className="py-2 px-3 font-bold text-[10px] w-24">Code</th>
                <th className="py-2 px-3 font-bold text-[10px]">
                  Account Name
                </th>
                <th className="py-2 px-3 text-right font-bold text-[10px] w-32">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {data.expenses?.map((item, idx) => (
                <tr
                  key={item.accountId || idx}
                  className="border-b border-border/30 hover:bg-surface-hover/5 transition"
                >
                  <td className="py-2 px-3 font-mono text-[11px] text-text-muted">
                    {item.accountCode}
                  </td>
                  <td className="py-2 px-3 font-semibold text-text">
                    {item.accountName}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#c92a2a]">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-b-4 border-double border-text bg-surface-hover/10 font-bold text-text">
                <td colSpan={2} className="py-2.5 px-3 text-right font-bold">
                  Total Expenses
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-black text-[#c92a2a]">
                  {formatCurrency(data.totalExpenses)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div className="mt-8 p-5 rounded-lg flex items-center justify-between border border-primary/20 bg-primary-soft">
        <div>
          <span className="block text-[13.5px] font-black text-text uppercase">
            Net Result ({data.isProfit ? "Net Profit" : "Net Loss"})
          </span>
          <span className="block text-[11px] text-text-muted mt-0.5 font-semibold">
            Total Revenue minus Total Operating Expenses.
          </span>
        </div>
        <span
          className={`text-[19px] font-black font-mono ${data.isProfit ? "text-[#2b8a3e]" : "text-[#c92a2a]"}`}
        >
          {formatCurrency(data.netProfit)}
        </span>
      </div>
    </div>
  );
};

const BalanceSheetView = ({ data, formatCurrency }) => {
  return (
    <div>
      <div className="grid grid-cols-2 gap-8 mt-4">
        <div>
          <h3 className="text-[12px] font-black text-text border-b border-border pb-1.5 uppercase tracking-wide">
            Assets
          </h3>
          <table className="w-full text-left mt-2 text-[11.5px] border border-border/40">
            <thead>
              <tr className="border-b border-border/40 bg-surface-hover/10 text-text font-bold uppercase tracking-wider">
                <th className="py-2 px-3 font-bold text-[10px] w-24">Code</th>
                <th className="py-2 px-3 font-bold text-[10px]">
                  Account Name
                </th>
                <th className="py-2 px-3 text-right font-bold text-[10px] w-32">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {data.assets?.map((item, idx) => (
                <tr
                  key={item.accountId || idx}
                  className="border-b border-border/30 hover:bg-surface-hover/5 transition"
                >
                  <td className="py-2 px-3 font-mono text-[11px] text-text-muted">
                    {item.accountCode}
                  </td>
                  <td className="py-2 px-3 font-semibold text-text">
                    {item.accountName}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-text">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-b-4 border-double border-text bg-surface-hover/10 font-bold text-text">
                <td colSpan={2} className="py-2.5 px-3 text-right font-bold">
                  Total Assets
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-black text-primary">
                  {formatCurrency(data.totalAssets)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div>
          <h3 className="text-[12px] font-black text-text border-b border-border pb-1.5 uppercase tracking-wide">
            Liabilities & Owner Equity
          </h3>
          <table className="w-full text-left mt-2 text-[11.5px] border border-border/40">
            <thead>
              <tr className="border-b border-border/40 bg-surface-hover/10 text-text font-bold uppercase tracking-wider">
                <th className="py-2 px-3 font-bold text-[10px] w-24">Code</th>
                <th className="py-2 px-3 font-bold text-[10px]">
                  Account Name
                </th>
                <th className="py-2 px-3 text-right font-bold text-[10px] w-32">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-surface-hover/10">
                <td
                  colSpan={3}
                  className="py-1 px-3 text-[9px] font-black text-text uppercase tracking-wider"
                >
                  Liabilities
                </td>
              </tr>
              {data.liabilities?.map((item, idx) => (
                <tr
                  key={item.accountId || idx}
                  className="border-b border-border/30 hover:bg-surface-hover/5 transition"
                >
                  <td className="py-2 px-3 font-mono text-[11px] text-text-muted">
                    {item.accountCode}
                  </td>
                  <td className="py-2 px-3 font-semibold text-text">
                    {item.accountName}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-text">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
              <tr className="bg-surface-hover/10">
                <td
                  colSpan={3}
                  className="py-1 px-3 text-[9px] font-black text-text uppercase tracking-wider"
                >
                  Equity
                </td>
              </tr>
              {data.equity?.map((item, idx) => (
                <tr
                  key={item.accountId || idx}
                  className="border-b border-border/30 hover:bg-surface-hover/5 transition"
                >
                  <td className="py-2 px-3 font-mono text-[11px] text-text-muted">
                    {item.accountCode}
                  </td>
                  <td className="py-2 px-3 font-semibold text-text">
                    {item.accountName}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-text">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
              <tr className="border-b border-border/30 hover:bg-surface-hover/5 transition">
                <td className="py-2 px-3 font-mono text-[11px] text-text-muted">
                  -
                </td>
                <td className="py-2 px-3 font-semibold text-text italic">
                  Retained Earnings (Net Profit)
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold text-[#2b8a3e]">
                  {formatCurrency(data.retainedEarnings)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t border-b-4 border-double border-text bg-surface-hover/10 font-bold text-text">
                <td colSpan={2} className="py-2.5 px-3 text-right font-bold">
                  Total Liabilities & Equity
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-black text-primary">
                  {formatCurrency(data.totalLiabilitiesAndEquity)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div className="mt-8 p-4 rounded-lg flex items-center justify-between border no-print bg-surface-hover/5 border-border/80">
        <div className="flex items-center gap-3">
          {data.isBalanced ? (
            <FiCheckCircle className="text-[20px] text-[#2b8a3e]" />
          ) : (
            <FiAlertCircle className="text-[20px] text-[#c92a2a]" />
          )}
          <div>
            <span className="block text-[12.5px] font-bold text-text">
              Statement Balance:{" "}
              {data.isBalanced ? "Balanced" : "Out of Balance"}
            </span>
            <span className="block text-[11px] text-text-muted mt-0.5 font-semibold">
              Accounting Rule Assets = Liabilities + Equity check.
            </span>
          </div>
        </div>
        <span
          className={`text-[15px] font-black font-mono ${data.isBalanced ? "text-[#2b8a3e]" : "text-[#c92a2a]"}`}
        >
          {formatCurrency(
            Math.abs(data.totalAssets - data.totalLiabilitiesAndEquity),
          )}
        </span>
      </div>
    </div>
  );
};

const GstReportView = ({ data, gstType, formatCurrency }) => {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-5 no-print">
        <div className="border border-border/80 p-3 bg-surface rounded-lg shadow-sm">
          <span className="text-[9px] font-bold uppercase text-text-muted block tracking-wider">
            Total Output GST
          </span>
          <span className="text-[14px] font-extrabold text-[#c92a2a] mt-1 block font-mono">
            {formatCurrency(data.totalOutputGst)}
          </span>
        </div>
        <div className="border border-border/80 p-3 bg-surface rounded-lg shadow-sm">
          <span className="text-[9px] font-bold uppercase text-text-muted block tracking-wider">
            Total Input GST
          </span>
          <span className="text-[14px] font-extrabold text-[#2b8a3e] mt-1 block font-mono">
            {formatCurrency(data.totalInputGst)}
          </span>
        </div>
        <div className="border border-border/80 p-3 bg-surface rounded-lg shadow-sm">
          <span className="text-[9px] font-bold uppercase text-text-muted block tracking-wider">
            Net GST {data.netGstPayableType}
          </span>
          <span
            className={`text-[14px] font-extrabold mt-1 block font-mono ${Number(data.netGstPayable) >= 0 ? "text-[#c92a2a]" : "text-[#2b8a3e]"}`}
          >
            {formatCurrency(Math.abs(data.netGstPayable))}
          </span>
        </div>
      </div>

      {gstType !== "GSTR2" && (
        <div className="mb-8">
          <h3 className="text-[12px] font-black text-text border-b border-border pb-1.5 uppercase tracking-wide">
            Output tax (Sales)
          </h3>
          <table className="w-full text-left mt-2 text-[11.5px] border border-border/40">
            <thead>
              <tr className="border-b border-border/40 bg-surface-hover/10 font-bold text-text uppercase tracking-wider">
                <th className="py-2.5 px-3 font-bold text-[10px]">Account</th>
                <th className="py-2.5 px-3 font-bold text-[10px] w-24">Code</th>
                <th className="py-2.5 px-3 text-right font-bold text-[10px] w-28">
                  Total Debits
                </th>
                <th className="py-2.5 px-3 text-right font-bold text-[10px] w-28">
                  Total Credits
                </th>
                <th className="py-2.5 px-3 text-right font-bold text-[10px] w-32">
                  Net Liability
                </th>
              </tr>
            </thead>
            <tbody>
              {data.outputGst?.map((summary, idx) => (
                <tr
                  key={summary.accountId || idx}
                  className="border-b border-border/30 hover:bg-surface-hover/5 transition"
                >
                  <td className="py-2 px-3 font-semibold text-text">
                    {summary.accountName}
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-text-muted">
                    {summary.accountCode}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-text-muted">
                    {formatCurrency(summary.totalDebit)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-text-muted">
                    {formatCurrency(summary.totalCredit)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#c92a2a]">
                    {formatCurrency(summary.netAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {gstType !== "GSTR1" && (
        <div>
          <h3 className="text-[12px] font-black text-text border-b border-border pb-1.5 uppercase tracking-wide">
            Input tax (Purchases)
          </h3>
          <table className="w-full text-left mt-2 text-[11.5px] border border-border/40">
            <thead>
              <tr className="border-b border-border/40 bg-surface-hover/10 font-bold text-text uppercase tracking-wider">
                <th className="py-2.5 px-3 font-bold text-[10px]">Account</th>
                <th className="py-2.5 px-3 font-bold text-[10px] w-24">Code</th>
                <th className="py-2.5 px-3 text-right font-bold text-[10px] w-28">
                  Total Debits
                </th>
                <th className="py-2.5 px-3 text-right font-bold text-[10px] w-28">
                  Total Credits
                </th>
                <th className="py-2.5 px-3 text-right font-bold text-[10px] w-32">
                  Net ITC Claimable
                </th>
              </tr>
            </thead>
            <tbody>
              {data.inputGst?.map((summary, idx) => (
                <tr
                  key={summary.accountId || idx}
                  className="border-b border-border/30 hover:bg-surface-hover/5 transition"
                >
                  <td className="py-2 px-3 font-semibold text-text">
                    {summary.accountName}
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] text-text-muted">
                    {summary.accountCode}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-text-muted">
                    {formatCurrency(summary.totalDebit)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-text-muted">
                    {formatCurrency(summary.totalCredit)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#2b8a3e]">
                    {formatCurrency(summary.netAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* Style vars */
const breadcrumbSx = { mt: 0 };
const breadcrumbItemSx = {
  fontSize: "12px",
  color: "var(--app-color-text-muted)",
  cursor: "pointer",
  "&:hover": { color: "var(--app-color-primary)" },
};
const breadcrumbCurrentSx = {
  fontSize: "12px",
  fontWeight: 650,
  color: "var(--app-color-text)",
};

const pageHeaderSx = { width: "100%" };
const pageHeaderContentSx = {
  minWidth: 0,
  "& h1, & h2, & h3, & h4": {
    m: 0,
    fontSize: "23px",
    lineHeight: 1.15,
    letterSpacing: "-0.4px",
    color: "var(--app-color-text)",
  },
};

const compactFilterInputSx = {
  height: 32,
  fontSize: "11.5px",
  bgcolor: "var(--app-color-surface)",
};

const filterLabelSx = {
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--app-color-text-muted)",
  mb: 0.5,
};

const actionBtnSx = {
  height: 32,
  fontSize: "11px",
  fontWeight: 600,
};

const backBtnSx = {
  height: 32,
  fontSize: "11px",
  fontWeight: 600,
};

const paginationFooterWrapperSx = {
  px: 0,
  pt: 2,
  pb: 2,
  display: "flex",
  justifyContent: "center",
  width: "100%",
  "& > div": {
    width: "100%",
    display: "flex !important",
    justifyContent: "center !important",
    alignItems: "center",
    "& .MuiPagination-ul": {
      justifyContent: "center !important",
    },
    "& .MuiPagination-root": {
      display: "flex !important",
      justifyContent: "center !important",
    },
  },
};

export default ReportViewerDesktopPage;
