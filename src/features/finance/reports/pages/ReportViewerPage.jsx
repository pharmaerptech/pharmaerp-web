import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useIsMobile, useCompanyFilter } from "@/hooks";
import useReports from "../hooks/useReports";
import useAccount from "@/features/finance/chart-of-accounts/accounts/hooks/useAccount";
import useCustomer from "@/features/parties/customers/hooks/useCustomer";
import useSupplier from "@/features/parties/suppliers/hooks/useSupplier";

import ReportViewerDesktopPage from "./desktop/ReportViewerDesktopPage";
import ReportViewerMobilePage from "./mobile/ReportViewerMobilePage";

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getLocalMonthStartString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
};

const ReportViewerPage = () => {
  const { reportType: paramReportType } = useParams();
  const [searchParams] = useSearchParams();
  const reportType =
    (paramReportType === "report-viewer" ? searchParams.get("type") : paramReportType) ||
    paramReportType;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const companyFilter = useCompanyFilter();

  const {
    reportData,
    status,
    error,
    message,
    fetchReport,
    clearError,
    clearMessage,
    clearReport,
  } = useReports();

  // Load lists for filter options
  const { accounts = [], getAccounts } = useAccount();
  const { customers = [], getCustomers } = useCustomer();
  const { suppliers = [], getSuppliers } = useSupplier();

  // Set default filters (pre-fill from URL query params if present)
  const [filters, setFilters] = useState(() => {
    const isAllTime = searchParams.get("allTime") === "true";
    return {
      asOfDate: searchParams.get("asOfDate") || getLocalDateString(),
      startDate: isAllTime ? "" : (searchParams.get("startDate") || getLocalMonthStartString()),
      endDate: isAllTime ? "" : (searchParams.get("endDate") || getLocalDateString()),
      accountId: searchParams.get("accountId") || "",
      customerId: searchParams.get("customerId") || "",
      supplierId: searchParams.get("supplierId") || "",
      gstType: searchParams.get("gstType") || "SUMMARY",
      includeZeroBalances: false,
    };
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sync state if URL query params change
  useEffect(() => {
    const qSupplierId = searchParams.get("supplierId");
    const qAccountId = searchParams.get("accountId");
    const qCustomerId = searchParams.get("customerId");
    if (qSupplierId || qAccountId || qCustomerId) {
      setFilters((prev) => ({
        ...prev,
        supplierId: qSupplierId !== null ? qSupplierId : prev.supplierId,
        accountId: qAccountId !== null ? qAccountId : prev.accountId,
        customerId: qCustomerId !== null ? qCustomerId : prev.customerId,
      }));
    }
  }, [searchParams]);

  // Fetch reference lists on mount
  useEffect(() => {
    getAccounts({ all: true }).catch((err) => console.error("Accounts fetch failed:", err));
    getCustomers({ all: true }).catch((err) => console.error("Customers fetch failed:", err));
    getSuppliers({ all: true }).catch((err) => console.error("Suppliers fetch failed:", err));
  }, []);

  // Clear report data and reset state on report type change
  useEffect(() => {
    clearReport();
    clearError();
    clearMessage();
    setCurrentPage(1);
  }, [reportType, clearReport, clearError, clearMessage]);

  const handleFilterChange = useCallback((name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  }, []);

  const handleFilterPreset = useCallback((preset) => {
    if (preset === "all-time") {
      setFilters((prev) => ({ ...prev, startDate: "", endDate: "" }));
    } else if (preset === "this-month") {
      setFilters((prev) => ({
        ...prev,
        startDate: getLocalMonthStartString(),
        endDate: getLocalDateString(),
      }));
    } else if (preset === "today") {
      setFilters((prev) => ({
        ...prev,
        startDate: getLocalDateString(),
        endDate: getLocalDateString(),
      }));
    }
    setCurrentPage(1);
  }, []);

  const runReport = useCallback(async () => {
    if (!reportType) return;
    const params = {};
    
    if (reportType === "trial-balance") {
      if (filters.asOfDate) params.asOfDate = filters.asOfDate;
      params.includeZeroBalances = filters.includeZeroBalances;
    } else if (reportType === "general-ledger" || reportType === "cash-book" || reportType === "bank-book") {
      if (filters.accountId) params.accountId = filters.accountId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      params.all = true;
    } else if (reportType === "customer-ledger") {
      if (filters.customerId) params.customerId = filters.customerId;
      if (filters.accountId) params.accountId = filters.accountId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      params.all = true;
    } else if (reportType === "supplier-ledger") {
      if (filters.supplierId) params.supplierId = filters.supplierId;
      if (filters.accountId) params.accountId = filters.accountId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      params.all = true;
    } else if (reportType === "profit-loss") {
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
    } else if (reportType === "balance-sheet") {
      if (filters.asOfDate) params.asOfDate = filters.asOfDate;
    } else if (reportType === "gst-report") {
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      params.type = filters.gstType;
    }

    if (companyFilter?.queryCompanyId) {
      params.companyId = companyFilter.queryCompanyId;
    }

    try {
      await fetchReport(reportType, params);
    } catch (err) {
      console.error("Failed to generate report:", err);
    }
  }, [reportType, filters, fetchReport, companyFilter?.queryCompanyId]);

  // Run report automatically on selection or company filter change
  useEffect(() => {
    if (reportType) {
      runReport();
    }
  }, [reportType, companyFilter?.selectedCompanyId]);

  const accountOptions = useMemo(() => {
    return [
      { label: "All Accounts", value: "" },
      ...accounts.map((acc) => ({
        label: `${acc.accountName} (${acc.accountCode})`,
        value: acc._id,
      })),
    ];
  }, [accounts]);

  const customerOptions = useMemo(() => {
    return [
      { label: "Select Customer", value: "" },
      ...customers.map((c) => ({
        label: c.name,
        value: c._id,
      })),
    ];
  }, [customers]);

  const supplierOptions = useMemo(() => {
    return [
      { label: "Select Supplier", value: "" },
      ...suppliers.map((s) => ({
        label: s.businessName || s.name || "Supplier",
        value: s._id,
      })),
    ];
  }, [suppliers]);

  const pageProps = {
    reportType,
    reportData,
    status,
    error,
    message,
    filters,
    companyFilter,
    accountOptions,
    customerOptions,
    supplierOptions,
    handleFilterChange,
    handleFilterPreset,
    runReport,
    handleBackToDashboard: () => navigate("/finance/reports"),
    clearFeedback: () => {
      clearError();
      clearMessage();
    },
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
  };

  return isMobile ? (
    <ReportViewerMobilePage {...pageProps} />
  ) : (
    <ReportViewerDesktopPage {...pageProps} />
  );
};

export default ReportViewerPage;
