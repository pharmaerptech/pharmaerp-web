import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile, useCompanyFilter } from "@/hooks";

import useFinancialPeriod from "../hooks/useFinancialPeriod";
import FinancialPeriodsDesktopPage from "./desktop/FinancialPeriodsDesktopPage";
import FinancialPeriodsMobilePage from "./mobile/FinancialPeriodsMobilePage";
import FinancialPeriodDialog from "../components/FinancialPeriodDialog";

const FinancialPeriodsPage = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const companyFilter = useCompanyFilter();
  const hasFetchedRef = useRef(false);

  const {
    financialPeriods,
    getFinancialPeriods,
    getFinancialPeriodsStatus,
    updateFinancialPeriodStatus,
    updateFinancialPeriodStatusStatus,
    createFinancialPeriod,
    error,
    clearError,
  } = useFinancialPeriod();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchParams, setSearchParams] = useState({
    search: "",
    periodType: "all",
    status: "all",
  });
  const [actionError, setActionError] = useState("");

  // Dialog state
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: "create",
    periodData: null,
  });

  const openCreateDialog = useCallback(() => {
    setDialogState({ isOpen: true, mode: "create", periodData: null });
  }, []);

  const openViewDialog = useCallback((period) => {
    setDialogState({ isOpen: true, mode: "view", periodData: period });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Trigger list query
  useEffect(() => {
    const executeQuery = async () => {
      try {
        const query = {
          page: currentPage,
          limit: pageSize,
          search: searchParams.search || undefined,
          periodType: searchParams.periodType === "all" ? undefined : searchParams.periodType,
          status: searchParams.status === "all" ? undefined : searchParams.status,
          companyId: companyFilter?.queryCompanyId,
        };
        await getFinancialPeriods(query);
      } catch (err) {
        console.error("Failed to load financial periods:", err);
      }
    };
    executeQuery();
  }, [currentPage, pageSize, searchParams, companyFilter?.queryCompanyId]);

  const handleSearchChange = useCallback((value) => {
    setSearchParams((prev) => ({ ...prev, search: value }));
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((name, value) => {
    setSearchParams((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Update status (Lock, Close, Open)
  const handleUpdateStatus = useCallback(
    async (periodId, newStatus) => {
      setActionError("");
      try {
        await updateFinancialPeriodStatus(periodId, { status: newStatus });
        const query = {
          page: currentPage,
          limit: pageSize,
          search: searchParams.search || undefined,
          periodType: searchParams.periodType === "all" ? undefined : searchParams.periodType,
          status: searchParams.status === "all" ? undefined : searchParams.status,
        };
        getFinancialPeriods(query);
      } catch (err) {
        setActionError(typeof err === "string" ? err : "Failed to update financial period status.");
        throw err;
      }
    },
    [updateFinancialPeriodStatus, getFinancialPeriods, currentPage, pageSize, searchParams]
  );

  const handleRefresh = useCallback(async () => {
    try {
      const query = {
        page: currentPage,
        limit: pageSize,
        search: searchParams.search || undefined,
        periodType: searchParams.periodType === "all" ? undefined : searchParams.periodType,
        status: searchParams.status === "all" ? undefined : searchParams.status,
      };
      await getFinancialPeriods(query);
    } catch (err) {
      console.error("Failed to refresh financial periods:", err);
    }
  }, [getFinancialPeriods, currentPage, pageSize, searchParams]);

  const totalPeriods = useMemo(() => {
    return financialPeriods?.length || 0;
  }, [financialPeriods]);

  const isLoading = getFinancialPeriodsStatus === API_STATUS.LOADING;
  const isUpdating = updateFinancialPeriodStatusStatus === API_STATUS.LOADING;

  const pageProps = {
    financialPeriods: financialPeriods || [],
    searchParams,
    companyFilter,
    currentPage,
    pageSize,
    totalPeriods,
    isLoading,
    isUpdating,
    error: error || actionError,
    clearError: () => {
      clearError();
      setActionError("");
    },
    handleSearchChange,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    handleUpdateStatus,
    handleCreate: openCreateDialog,
    handleView: openViewDialog,
    handleRefresh,
  };

  return (
    <>
      {isMobile ? (
        <FinancialPeriodsMobilePage {...pageProps} />
      ) : (
        <FinancialPeriodsDesktopPage {...pageProps} />
      )}

      <FinancialPeriodDialog
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        mode={dialogState.mode}
        periodData={dialogState.periodData}
        onSubmitCreate={createFinancialPeriod}
        onUpdateStatus={handleUpdateStatus}
      />
    </>
  );
};

export default FinancialPeriodsPage;
