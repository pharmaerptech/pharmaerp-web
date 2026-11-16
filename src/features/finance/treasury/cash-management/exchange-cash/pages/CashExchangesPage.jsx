// src/features/finance/treasury/cash-management/exchange-cash/pages/CashExchangesPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { API_STATUS } from "@/constants";
import { useIsMobile, useBranchFilter } from "@/hooks";
import useBranch from "@/features/branch/hooks/useBranch";
import useActiveShift from "@/features/operations/shifts/hooks/useActiveShift";
import { uiToast } from "@/components/ui";

import useCashExchange from "../hooks/useCashExchange";
import {
  CreateCashExchangeModal,
  ViewCashExchangeModal,
} from "../components";
import CashExchangesDesktopPage from "./desktop/CashExchangesDesktopPage";
import CashExchangesMobilePage from "./mobile/CashExchangesMobilePage";

const CashExchangesPage = () => {
  const isMobile = useIsMobile();
  const [searchParamsUrl, setSearchParamsUrl] = useSearchParams();
  const { currentBranch } = useBranch();
  const {
    isCompanyLevel,
    selectedBranchId,
    setSelectedBranchId,
    queryBranchId,
  } = useBranchFilter();
  const activeBranchId = isCompanyLevel ? queryBranchId : (currentBranch?._id || undefined);

  const { activeShift } = useActiveShift(activeBranchId);
  const isShiftActive = Boolean(activeShift);

  const {
    cashExchanges,
    getCashExchanges,
    getCashExchangesStatus,
    error,
    clearError,
    message,
    clearMessage,
  } = useCashExchange();

  // Dialog states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewModalState, setViewModalState] = useState({
    isOpen: false,
    exchange: null,
    exchangeId: null,
  });

  // Automatically open create dialog if ?action=create is present
  useEffect(() => {
    if (searchParamsUrl.get("action") === "create") {
      setIsCreateModalOpen(true);
      // Clean query parameter from URL without page reload
      const newParams = new URLSearchParams(searchParamsUrl);
      newParams.delete("action");
      setSearchParamsUrl(newParams, { replace: true });
    }
  }, [searchParamsUrl, setSearchParamsUrl]);

  // Reactive feedback via uiToast - strictly for CRUD mutations (create, swap), never for read/fetch
  useEffect(() => {
    if (message) {
      const isReadOp = /fetch|load|view|retriev|read/i.test(message);
      if (!isReadOp) {
        uiToast.success("Cash Exchange", message);
      }
      clearMessage();
    }
  }, [message, clearMessage]);

  useEffect(() => {
    if (error) {
      uiToast.error("Cash Exchange Error", error);
      clearError();
    }
  }, [error, clearError]);

  const [searchParams, setSearchParams] = useState({
    search: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const buildQuery = useCallback(
    () => ({
      page: currentPage,
      limit: pageSize,
      search: searchParams.search || undefined,
      branchId: activeBranchId,
    }),
    [currentPage, pageSize, searchParams.search, activeBranchId]
  );

  const fetchData = useCallback(() => {
    getCashExchanges(buildQuery()).catch((err) =>
      console.error("Failed to load cash exchanges:", err)
    );
  }, [getCashExchanges, buildQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => fetchData(), [fetchData]);

  const handleSearchChange = useCallback((value) => {
    setSearchParams((prev) => ({ ...prev, search: value }));
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((name, value) => {
    setSearchParams((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => setCurrentPage(page), []);

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleViewDetails = useCallback((exchangeOrId) => {
    if (typeof exchangeOrId === "object" && exchangeOrId !== null) {
      setViewModalState({
        isOpen: true,
        exchange: exchangeOrId,
        exchangeId: exchangeOrId._id || exchangeOrId.id,
      });
    } else {
      setViewModalState({
        isOpen: true,
        exchange: null,
        exchangeId: exchangeOrId,
      });
    }
  }, []);

  const handleCreateNew = useCallback(() => {
    if (!isShiftActive) {
      uiToast.warning("Active Shift Required", "An active cashier shift is required to record cash exchanges.");
      return;
    }
    setIsCreateModalOpen(true);
  }, [isShiftActive]);

  const isLoading =
    getCashExchangesStatus === API_STATUS.LOADING ||
    getCashExchangesStatus === API_STATUS.IDLE;

  const totalExchanges = useMemo(
    () => cashExchanges?.length || 0,
    [cashExchanges]
  );

  const pageProps = {
    cashExchanges: cashExchanges || [],
    searchParams,
    currentPage,
    pageSize,
    totalExchanges,
    isLoading,
    error,
    message,
    clearFeedback: () => {
      clearError();
      clearMessage();
    },
    handleSearchChange,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    handleViewDetails,
    handleCreateNew,
    handleRefresh,
    isCompanyLevel,
    canCreateExchange: !isCompanyLevel,
    selectedBranchId,
    setSelectedBranchId,
  };

  return (
    <>
      {isMobile ? (
        <CashExchangesMobilePage {...pageProps} />
      ) : (
        <CashExchangesDesktopPage {...pageProps} />
      )}

      {/* ── Dialogs ── */}
      <CreateCashExchangeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <ViewCashExchangeModal
        isOpen={viewModalState.isOpen}
        onClose={() =>
          setViewModalState({ isOpen: false, exchange: null, exchangeId: null })
        }
        exchangeId={viewModalState.exchangeId}
        initialData={viewModalState.exchange}
      />
    </>
  );
};

export default CashExchangesPage;
