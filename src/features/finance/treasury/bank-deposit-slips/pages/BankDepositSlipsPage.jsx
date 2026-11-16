// src/features/finance/treasury/bank-deposit-slips/pages/BankDepositSlipsPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { API_STATUS } from "@/constants";
import { useIsMobile, useBranchFilter } from "@/hooks";
import { uiToast } from "@/components/ui";
import useBranch from "@/features/branch/hooks/useBranch";

import useBankDepositSlip from "../hooks/useBankDepositSlip";
import BankDepositSlipsDesktopPage from "./desktop/BankDepositSlipsDesktopPage";
import BankDepositSlipsMobilePage from "./mobile/BankDepositSlipsMobilePage";
import CreateBankDepositSlipDialog from "../components/CreateBankDepositSlipDialog";
import ViewBankDepositSlipDialog from "../components/ViewBankDepositSlipDialog";

const BankDepositSlipsPage = () => {
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

  const {
    bankDepositSlips,
    getBankDepositSlips,
    getBankDepositSlipsStatus,
    confirmDeposit,
    confirmDepositStatus,
    cancelBankDepositSlip,
    cancelBankDepositSlipStatus,
    error,
    clearError,
    message,
    clearMessage,
  } = useBankDepositSlip();

  const [searchParams, setSearchParams] = useState({
    search: "",
    status: "all",
    date: "",
  });

  // Ephemeral toast feedback for operations from Redux - strictly for CRUD mutations (create, confirm, cancel)
  useEffect(() => {
    if (message) {
      const isReadOp = /fetch|load|view|retriev|read/i.test(message);
      if (!isReadOp) {
        uiToast.success("Bank Deposit Slip", message);
      }
      clearMessage();
    }
  }, [clearMessage, message]);

  useEffect(() => {
    if (error) {
      uiToast.error("Deposit Slip Error", error);
      clearError();
    }
  }, [clearError, error]);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSlipForView, setSelectedSlipForView] = useState(null);

  // Check URL query parameters for action=create or dayClosingId
  const urlAction = searchParamsUrl.get("action");
  const prefillDayClosingId = searchParamsUrl.get("dayClosingId");

  useEffect(() => {
    if (urlAction === "create") {
      setIsCreateOpen(true);
    }
  }, [urlAction]);

  const fetchSlipsData = useCallback(async () => {
    try {
      const query = {
        page: 1,
        limit: 100, // Fetch comprehensive dataset for infinite scroll
        search: searchParams.search || undefined,
        status: searchParams.status === "all" ? undefined : searchParams.status,
        branchId: activeBranchId,
      };
      await getBankDepositSlips(query);
    } catch (err) {
      console.error("Failed to load bank deposit slips:", err);
    }
  }, [searchParams, activeBranchId, getBankDepositSlips]);

  useEffect(() => {
    fetchSlipsData();
  }, [fetchSlipsData]);

  const handleRefresh = useCallback(() => {
    fetchSlipsData();
  }, [fetchSlipsData]);

  const handleSearchChange = useCallback((value) => {
    setSearchParams((prev) => ({ ...prev, search: value }));
  }, []);

  const handleFilterChange = useCallback((name, value) => {
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleConfirmDeposit = useCallback(
    async (slipIdOrSlip, payload = {}) => {
      const slipId = typeof slipIdOrSlip === "object" ? slipIdOrSlip._id : slipIdOrSlip;
      try {
        await confirmDeposit(slipId, payload);
        uiToast.success("Deposit Confirmed", "Bank deposit slip confirmed and credited to ledger.");
        fetchSlipsData();
      } catch (err) {
        const msg = typeof err === "string" ? err : err?.message || "Failed to confirm bank deposit slip.";
        uiToast.error("Confirmation Failed", msg);
        throw err;
      }
    },
    [confirmDeposit, fetchSlipsData]
  );

  const handleCancelSlip = useCallback(
    async (slipIdOrSlip, payload = {}) => {
      const slipId = typeof slipIdOrSlip === "object" ? slipIdOrSlip._id : slipIdOrSlip;
      try {
        await cancelBankDepositSlip(slipId, payload);
        uiToast.warning("Deposit Slip Cancelled", "Bank deposit slip cancelled and vault cash restored.");
        fetchSlipsData();
      } catch (err) {
        const msg = typeof err === "string" ? err : err?.message || "Failed to cancel bank deposit slip.";
        uiToast.error("Cancellation Failed", msg);
        throw err;
      }
    },
    [cancelBankDepositSlip, fetchSlipsData]
  );

  const handleViewDetails = useCallback((slip) => {
    setSelectedSlipForView(slip);
  }, []);

  const handleCreateNew = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const handleCloseCreate = useCallback(() => {
    setIsCreateOpen(false);
    // Clean up url parameters if present
    if (searchParamsUrl.get("action")) {
      const nextParams = new URLSearchParams(searchParamsUrl);
      nextParams.delete("action");
      nextParams.delete("dayClosingId");
      setSearchParamsUrl(nextParams, { replace: true });
    }
  }, [searchParamsUrl, setSearchParamsUrl]);

  const isLoading = getBankDepositSlipsStatus === API_STATUS.LOADING;
  const isTransitioning =
    confirmDepositStatus === API_STATUS.LOADING ||
    cancelBankDepositSlipStatus === API_STATUS.LOADING;

  const pageProps = {
    bankDepositSlips: bankDepositSlips || [],
    searchParams,
    totalSlips: bankDepositSlips?.length || 0,
    isLoading,
    isTransitioning,
    error,
    message,
    clearFeedback: () => {
      clearError();
      clearMessage();
    },
    handleSearchChange,
    handleFilterChange,
    handleConfirmDeposit,
    handleCancelSlip,
    handleViewDetails,
    handleCreateNew,
    handleRefresh,
    isCompanyLevel,
    canCreateSlip: !isCompanyLevel,
    selectedBranchId,
    setSelectedBranchId,
  };

  return (
    <>
      {isMobile ? (
        <BankDepositSlipsMobilePage {...pageProps} />
      ) : (
        <BankDepositSlipsDesktopPage {...pageProps} />
      )}

      {/* Cash Counter Styled Create Bank Deposit Slip Dialog */}
      <CreateBankDepositSlipDialog
        isOpen={isCreateOpen}
        onClose={handleCloseCreate}
        onSuccess={() => {
          fetchSlipsData();
          setActionMessage("Bank deposit slip created successfully.");
        }}
        prefillDayClosingId={prefillDayClosingId}
        defaultBranchId={isCompanyLevel && selectedBranchId !== "all" ? selectedBranchId : undefined}
      />

      {/* In-Dialog View Slip Details */}
      <ViewBankDepositSlipDialog
        isOpen={Boolean(selectedSlipForView)}
        onClose={() => setSelectedSlipForView(null)}
        slip={selectedSlipForView}
        onConfirmDeposit={handleConfirmDeposit}
        onCancelSlip={handleCancelSlip}
      />
    </>
  );
};

export default BankDepositSlipsPage;
