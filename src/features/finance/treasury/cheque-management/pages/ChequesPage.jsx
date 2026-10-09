import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile } from "@/hooks";

import useCheque from "../hooks/useCheque";
import ChequesDesktopPage from "./desktop/ChequesDesktopPage";
import ChequesMobilePage from "./mobile/ChequesMobilePage";

import ChequeDialog from "../components/ChequeDialog";

const ChequesPage = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: "create",
    entityId: null,
    chequeData: null,
  });

  const {
    cheques,
    getCheques,
    getChequesStatus,
    getChequeById,
    createCheque,
    depositCheque,
    clearCheque,
    bounceCheque,
    cancelCheque,
    status: apiStatus,
    error,
    clearError,
    message,
    clearMessage,
  } = useCheque();

  const [searchParams, setSearchParams] = useState({
    search: "",
    chequeType: "all",
    status: "all",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const fetchChequesData = useCallback(async () => {
    try {
      const query = {
        page: currentPage,
        limit: pageSize,
        search: searchParams.search || undefined,
        chequeType: searchParams.chequeType === "all" ? undefined : searchParams.chequeType,
        status: searchParams.status === "all" ? undefined : searchParams.status,
      };
      await getCheques(query);
    } catch (err) {
      console.error("Failed to load cheques:", err);
    }
  }, [currentPage, pageSize, searchParams, getCheques]);

  useEffect(() => {
    fetchChequesData();
  }, [fetchChequesData]);

  const handleRefresh = useCallback(() => {
    fetchChequesData();
  }, [fetchChequesData]);

  useEffect(() => {
    return () => {
      clearError();
      clearMessage();
    };
  }, [clearError, clearMessage]);

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

  const handleDeposit = useCallback(
    async (chequeId) => {
      setActionError("");
      setActionMessage("");
      try {
        await depositCheque(chequeId);
        setActionMessage("Cheque deposited to bank successfully.");
        fetchChequesData();
      } catch (err) {
        setActionError(typeof err === "string" ? err : "Failed to deposit cheque.");
      }
    },
    [depositCheque, fetchChequesData]
  );

  const handleClear = useCallback(
    async (chequeId, clearDate = "") => {
      setActionError("");
      setActionMessage("");
      try {
        await clearCheque(chequeId, { clearDate: clearDate || undefined });
        setActionMessage("Cheque cleared by the bank successfully.");
        fetchChequesData();
      } catch (err) {
        setActionError(typeof err === "string" ? err : "Failed to clear cheque.");
      }
    },
    [clearCheque, fetchChequesData]
  );

  const handleBounce = useCallback(
    async (chequeId, reason = "", bounceCharges = 0) => {
      setActionError("");
      setActionMessage("");
      try {
        await bounceCheque(chequeId, { reason, bounceCharges: Number(bounceCharges) || 0 });
        setActionMessage("Cheque marked as bounced successfully.");
        fetchChequesData();
      } catch (err) {
        setActionError(typeof err === "string" ? err : "Failed to bounce cheque.");
      }
    },
    [bounceCheque, fetchChequesData]
  );

  const handleCancel = useCallback(
    async (chequeId, reason = "") => {
      setActionError("");
      setActionMessage("");
      try {
        await cancelCheque(chequeId, { reason });
        setActionMessage("Cheque cancelled successfully.");
        fetchChequesData();
      } catch (err) {
        setActionError(typeof err === "string" ? err : "Failed to cancel cheque.");
      }
    },
    [cancelCheque, fetchChequesData]
  );

  const handleViewDetails = useCallback(
    (chequeId) => {
      const target = cheques?.find(
        (c) => c._id === chequeId || c.id === chequeId
      );
      setDialogState({
        isOpen: true,
        mode: "view",
        entityId: chequeId,
        chequeData: target || null,
      });
    },
    [cheques]
  );

  const handleCreateNew = useCallback(() => {
    setDialogState({
      isOpen: true,
      mode: "create",
      entityId: null,
      chequeData: null,
    });
  }, []);

  const handleEditCheque = useCallback(
    (chequeId) => {
      const target = cheques?.find(
        (c) => c._id === chequeId || c.id === chequeId
      );
      setDialogState({
        isOpen: true,
        mode: "edit",
        entityId: chequeId,
        chequeData: target || null,
      });
    },
    [cheques]
  );

  const isLoading = getChequesStatus === API_STATUS.LOADING;

  const totalCheques = useMemo(() => {
    return cheques?.length || 0;
  }, [cheques]);

  const pageProps = {
    cheques: cheques || [],
    searchParams,
    currentPage,
    pageSize,
    totalCheques,
    isLoading,
    error: error || actionError,
    message: message || actionMessage,
    clearFeedback: () => {
      clearError();
      clearMessage();
      setActionError("");
      setActionMessage("");
    },
    handleSearchChange,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    handleDeposit,
    handleClear,
    handleBounce,
    handleCancel,
    handleViewDetails,
    handleCreateNew,
    handleEditCheque,
    handleRefresh,
  };

  return (
    <>
      {isMobile ? (
        <ChequesMobilePage {...pageProps} />
      ) : (
        <ChequesDesktopPage {...pageProps} />
      )}

      <ChequeDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        mode={dialogState.mode}
        entityId={dialogState.entityId}
        chequeData={dialogState.chequeData}
        onSubmitCreate={createCheque}
        onDepositCheque={handleDeposit}
        onClearCheque={handleClear}
        onBounceCheque={handleBounce}
        onCancelCheque={handleCancel}
        onSuccess={() => {
          fetchChequesData();
          setDialogState((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </>
  );
};

export default ChequesPage;
