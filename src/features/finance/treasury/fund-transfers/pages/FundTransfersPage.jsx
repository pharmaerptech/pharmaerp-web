// src/features/finance/treasury/fund-transfers/pages/FundTransfersPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { API_STATUS } from "@/constants";
import { useIsMobile, useCompanyFilter } from "@/hooks";
import { uiToast } from "@/components/ui";

import useFundTransfer from "../hooks/useFundTransfer";
import FundTransfersDesktopPage from "./desktop/FundTransfersDesktopPage";
import FundTransfersMobilePage from "./mobile/FundTransfersMobilePage";
import FundTransferDialog from "../components/FundTransferDialog";

const FundTransfersPage = () => {
  const isMobile = useIsMobile();
  const [searchParamsUrl, setSearchParamsUrl] = useSearchParams();

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: "create",
    entityId: null,
    transferData: null,
  });

  const {
    fundTransfers,
    getFundTransfers,
    getFundTransfersStatus,
    getFundTransferById,
    createFundTransfer,
    cancelFundTransfer,
    cancelFundTransferStatus,
    error,
    clearError,
    message,
    clearMessage,
  } = useFundTransfer();

  // Check URL query ?action=create
  useEffect(() => {
    if (searchParamsUrl.get("action") === "create") {
      setDialogState({
        isOpen: true,
        mode: "create",
        entityId: null,
        transferData: null,
      });
      const newParams = new URLSearchParams(searchParamsUrl);
      newParams.delete("action");
      setSearchParamsUrl(newParams, { replace: true });
    }
  }, [searchParamsUrl, setSearchParamsUrl]);

  // Reactive feedback via uiToast - strictly for CRUD mutations (create, cancel), never for read/fetch
  useEffect(() => {
    if (message) {
      const isReadOp = /fetch|load|view|retriev|read/i.test(message);
      if (!isReadOp) {
        uiToast.success("Fund Transfer", message);
      }
      clearMessage();
    }
  }, [message, clearMessage]);

  useEffect(() => {
    if (error) {
      uiToast.error("Fund Transfer Error", error);
      clearError();
    }
  }, [error, clearError]);

  const [searchParams, setSearchParams] = useState({
    search: "",
    transferType: "all",
    status: "all",
  });

  const { companyFilter } = useCompanyFilter();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const fetchTransfersData = useCallback(() => {
    const query = {
      page: currentPage,
      limit: pageSize,
      search: searchParams.search || undefined,
      transferType: searchParams.transferType === "all" ? undefined : searchParams.transferType,
      status: searchParams.status === "all" ? undefined : searchParams.status,
      companyId: companyFilter?.queryCompanyId,
    };
    getFundTransfers(query).catch((err) =>
      console.error("Failed to load fund transfers:", err)
    );
  }, [currentPage, pageSize, searchParams, getFundTransfers, companyFilter?.queryCompanyId]);

  useEffect(() => {
    fetchTransfersData();
  }, [fetchTransfersData]);

  const handleRefresh = useCallback(() => {
    fetchTransfersData();
  }, [fetchTransfersData]);

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

  const handleCancelTransfer = useCallback(
    async (fundTransferId, reason = "") => {
      try {
        await cancelFundTransfer(fundTransferId, { reason });
        uiToast.success("Transfer Cancelled", "Fund transfer cancelled successfully.");
        fetchTransfersData();
      } catch (err) {
        uiToast.error(
          "Cancellation Failed",
          typeof err === "string" ? err : err?.message || "Failed to cancel fund transfer."
        );
      }
    },
    [cancelFundTransfer, fetchTransfersData]
  );

  const handleViewDetails = useCallback((fundTransfer) => {
    const id = typeof fundTransfer === "string" ? fundTransfer : fundTransfer?._id || fundTransfer?.id;
    const data = typeof fundTransfer === "object" ? fundTransfer : null;
    setDialogState({
      isOpen: true,
      mode: "view",
      entityId: id,
      transferData: data,
    });
  }, []);

  const handleCreateNew = useCallback(() => {
    setDialogState({
      isOpen: true,
      mode: "create",
      entityId: null,
      transferData: null,
    });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const isLoading =
    getFundTransfersStatus === API_STATUS.LOADING ||
    getFundTransfersStatus === API_STATUS.IDLE;
  const isCancelling = cancelFundTransferStatus === API_STATUS.LOADING;

  const totalTransfers = useMemo(() => {
    return fundTransfers?.length || 0;
  }, [fundTransfers]);

  const pageProps = {
    fundTransfers: fundTransfers || [],
    searchParams,
    currentPage,
    pageSize,
    totalTransfers,
    isLoading,
    isCancelling,
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
    handleCancelTransfer,
    handleViewDetails,
    handleCreateNew,
    handleRefresh,
    companyFilter,
  };

  return (
    <>
      {isMobile ? (
        <FundTransfersMobilePage {...pageProps} />
      ) : (
        <FundTransfersDesktopPage {...pageProps} />
      )}

      {/* ── Fund Transfer Dialog (Create & View) ── */}
      <FundTransferDialog
        isOpen={dialogState.isOpen}
        onClose={handleCloseDialog}
        mode={dialogState.mode}
        transferData={dialogState.transferData}
        entityId={dialogState.entityId}
        onSubmitCreate={createFundTransfer}
        onFetchById={getFundTransferById}
        onCancelTransfer={(id) => {
          handleCloseDialog();
          handleCancelTransfer(id);
        }}
        onSuccess={handleRefresh}
      />
    </>
  );
};

export default FundTransfersPage;
