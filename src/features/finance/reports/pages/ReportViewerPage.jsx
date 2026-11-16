import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useIsMobile, useCompanyFilter } from "@/hooks";
import useReports from "../hooks/useReports";
import useAccount from "@/features/finance/chart-of-accounts/accounts/hooks/useAccount";
import useCustomer from "@/features/parties/customers/hooks/useCustomer";
import useSupplier from "@/features/parties/suppliers/hooks/useSupplier";

import ReportViewerDesktopPage from "./desktop/ReportViewerDesktopPage";
import ReportViewerMobilePage from "./mobile/ReportViewerMobilePage";

const ReportViewerPage = () => {
  const { reportType } = useParams();
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

  // Set default filters
  const [filters, setFilters] = useState({
    asOfDate: new Date().toISOString().split("T")[0],
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    accountId: "",
    customerId: "",
    supplierId: "",
    gstType: "SUMMARY",
    includeZeroBalances: false,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  const runReport = useCallback(async () => {
    if (!reportType) return;
    const params = {};
    
    if (reportType === "trial-balance") {
      if (filters.asOfDate) params.asOfDate = new Date(filters.asOfDate).toISOString();
      params.includeZeroBalances = filters.includeZeroBalances;
    } else if (reportType === "general-ledger" || reportType === "cash-book" || reportType === "bank-book") {
      if (filters.accountId) params.accountId = filters.accountId;
      if (filters.startDate) params.startDate = new Date(filters.startDate).toISOString();
      if (filters.endDate) params.endDate = new Date(filters.endDate).toISOString();
      params.all = true;
    } else if (reportType === "customer-ledger") {
      if (filters.customerId) params.customerId = filters.customerId;
      if (filters.accountId) params.accountId = filters.accountId;
      if (filters.startDate) params.startDate = new Date(filters.startDate).toISOString();
      if (filters.endDate) params.endDate = new Date(filters.endDate).toISOString();
      params.all = true;
    } else if (reportType === "supplier-ledger") {
      if (filters.supplierId) params.supplierId = filters.supplierId;
      if (filters.accountId) params.accountId = filters.accountId;
      if (filters.startDate) params.startDate = new Date(filters.startDate).toISOString();
      if (filters.endDate) params.endDate = new Date(filters.endDate).toISOString();
      params.all = true;
    } else if (reportType === "profit-loss") {
      if (filters.startDate) params.startDate = new Date(filters.startDate).toISOString();
      if (filters.endDate) params.endDate = new Date(filters.endDate).toISOString();
    } else if (reportType === "balance-sheet") {
      if (filters.asOfDate) params.asOfDate = new Date(filters.asOfDate).toISOString();
    } else if (reportType === "gst-report") {
      if (filters.startDate) params.startDate = new Date(filters.startDate).toISOString();
      if (filters.endDate) params.endDate = new Date(filters.endDate).toISOString();
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
        label: s.name,
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
