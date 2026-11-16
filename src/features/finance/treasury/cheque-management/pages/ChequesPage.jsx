// src/features/finance/treasury/cheque-management/pages/ChequesPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { API_STATUS } from "@/constants";
import { useIsMobile, useCompanyFilter } from "@/hooks";
import { uiToast } from "@/components/ui";

import useCheque from "../hooks/useCheque";
import ChequesDesktopPage from "./desktop/ChequesDesktopPage";
import ChequesMobilePage from "./mobile/ChequesMobilePage";
import ChequeDialog from "../components/ChequeDialog";

const ChequesPage = () => {
  const isMobile = useIsMobile();
  const [searchParamsUrl, setSearchParamsUrl] = useSearchParams();

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
    updateCheque,
    depositCheque,
    clearCheque,
    bounceCheque,
    cancelCheque,
    error,
    clearError,
    message,
    clearMessage,
  } = useCheque();

  // Check URL query ?action=create
  useEffect(() => {
    if (searchParamsUrl.get("action") === "create") {
      setDialogState({
        isOpen: true,
        mode: "create",
        entityId: null,
        chequeData: null,
      });
      const newParams = new URLSearchParams(searchParamsUrl);
      newParams.delete("action");
      setSearchParamsUrl(newParams, { replace: true });
    }
  }, [searchParamsUrl, setSearchParamsUrl]);

  // Reactive feedback via uiToast - strictly for CRUD mutations (create, edit, delete, status transitions)
  useEffect(() => {
    if (message) {
      const isReadOp = /fetch|load|view|retriev|read/i.test(message);
      if (!isReadOp) {
        uiToast.success("Cheque Management", message);
      }
      clearMessage();
    }
  }, [message, clearMessage]);

  useEffect(() => {
    if (error) {
      uiToast.error("Cheque Error", error);
      clearError();
    }
  }, [error, clearError]);

  const [searchParams, setSearchParams] = useState({
    search: "",
    chequeType: "all",
    status: "all",
  });

  const { companyFilter } = useCompanyFilter();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const fetchChequesData = useCallback(async () => {
    try {
      const query = {
        page: currentPage,
        limit: pageSize,
        search: searchParams.search || undefined,
        chequeType: searchParams.chequeType === "all" ? undefined : searchParams.chequeType,
        status: searchParams.status === "all" ? undefined : searchParams.status,
        companyId: companyFilter?.queryCompanyId,
      };
      await getCheques(query);
    } catch (err) {
      console.error("Failed to load cheques:", err);
    }
  }, [currentPage, pageSize, searchParams, getCheques, companyFilter?.queryCompanyId]);

  useEffect(() => {
    fetchChequesData();
  }, [fetchChequesData]);

  const handleRefresh = useCallback(() => {
    fetchChequesData();
  }, [fetchChequesData]);

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
      try {
        const res = await depositCheque(chequeId);
        fetchChequesData();
        return res;
      } catch (err) {
        throw err;
      }
    },
    [depositCheque, fetchChequesData]
  );

  const handleClear = useCallback(
    async (chequeId, clearData = "") => {
      try {
        let payload = {};
        if (typeof clearData === "object" && clearData !== null) {
          const rawDate = clearData.clearDate;
          payload = {
            clearDate: rawDate && typeof rawDate === "string" && rawDate.trim()
              ? new Date(rawDate).toISOString()
              : undefined,
            narration: clearData.narration ? String(clearData.narration).trim() : undefined,
          };
        } else if (typeof clearData === "string" && clearData.trim()) {
          payload = { clearDate: new Date(clearData).toISOString() };
        }
        const res = await clearCheque(chequeId, payload);
        fetchChequesData();
        return res;
      } catch (err) {
        throw err;
      }
    },
    [clearCheque, fetchChequesData]
  );

  const handleBounce = useCallback(
    async (chequeId, reasonOrPayload = "", bounceCharges = 0) => {
      try {
        let payload = {};
        if (typeof reasonOrPayload === "object" && reasonOrPayload !== null) {
          payload = {
            reason: reasonOrPayload.reason || "",
            bounceCharges: Number(reasonOrPayload.bounceCharges) || 0,
          };
        } else {
          payload = {
            reason: String(reasonOrPayload || ""),
            bounceCharges: Number(bounceCharges) || 0,
          };
        }
        const res = await bounceCheque(chequeId, payload);
        fetchChequesData();
        return res;
      } catch (err) {
        throw err;
      }
    },
    [bounceCheque, fetchChequesData]
  );

  const handleCancel = useCallback(
    async (chequeId, reasonOrPayload = "") => {
      try {
        let payload = {};
        if (typeof reasonOrPayload === "object" && reasonOrPayload !== null) {
          payload = { reason: reasonOrPayload.reason || "" };
        } else {
          payload = { reason: String(reasonOrPayload || "") };
        }
        const res = await cancelCheque(chequeId, payload);
        fetchChequesData();
        return res;
      } catch (err) {
        throw err;
      }
    },
    [cancelCheque, fetchChequesData]
  );


  const handleViewDetails = useCallback(
    (chequeOrId) => {
      const id = typeof chequeOrId === "object" ? (chequeOrId._id || chequeOrId.id) : chequeOrId;
      const target = typeof chequeOrId === "object" ? chequeOrId : cheques?.find((c) => (c._id || c.id) === id);
      setDialogState({
        isOpen: true,
        mode: "view",
        entityId: id,
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
    (chequeOrId) => {
      const id = typeof chequeOrId === "object" ? (chequeOrId._id || chequeOrId.id) : chequeOrId;
      const target = typeof chequeOrId === "object" ? chequeOrId : cheques?.find((c) => (c._id || c.id) === id);
      setDialogState({
        isOpen: true,
        mode: "edit",
        entityId: id,
        chequeData: target || null,
      });
    },
    [cheques]
  );

  const isLoading =
    getChequesStatus === API_STATUS.LOADING ||
    getChequesStatus === API_STATUS.IDLE;

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
    handleDeposit,
    handleClear,
    handleBounce,
    handleCancel,
    handleViewDetails,
    handleCreateNew,
    handleEditCheque,
    handleRefresh,
    companyFilter,
  };

  return (
    <>
      {isMobile ? (
        <ChequesMobilePage {...pageProps} />
      ) : (
        <ChequesDesktopPage {...pageProps} />
      )}

      {/* ── Cheque Form / Details Dialog ── */}
      <ChequeDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        mode={dialogState.mode}
        entityId={dialogState.entityId}
        chequeData={dialogState.chequeData}
        onSubmitCreate={createCheque}
        onSubmitUpdate={(id, payload) => updateCheque ? updateCheque(id, payload) : Promise.resolve()}
        onDepositCheque={async (id) => {
          try {
            await handleDeposit(id);
            uiToast.success("Cheque Deposited", "Cheque marked as deposited to bank.");
            setDialogState((prev) => ({ ...prev, isOpen: false }));
          } catch (err) {
            uiToast.error("Deposit Failed", typeof err === "string" ? err : err?.message || "Failed to deposit cheque.");
          }
        }}
        onClearCheque={async (id, date) => {
          try {
            await handleClear(id, date);
            uiToast.success("Cheque Cleared", "Cheque cleared and funds updated.");
            setDialogState((prev) => ({ ...prev, isOpen: false }));
          } catch (err) {
            uiToast.error("Clearance Failed", typeof err === "string" ? err : err?.message || "Failed to clear cheque.");
          }
        }}
        onBounceCheque={async (id, reason, charges) => {
          try {
            await handleBounce(id, reason, charges);
            uiToast.error("Cheque Bounced", "Cheque marked as bounced.");
            setDialogState((prev) => ({ ...prev, isOpen: false }));
          } catch (err) {
            uiToast.error("Bounce Failed", typeof err === "string" ? err : err?.message || "Failed to bounce cheque.");
          }
        }}
        onCancelCheque={async (id, reason) => {
          try {
            await handleCancel(id, reason);
            uiToast.warning("Cheque Cancelled", "Cheque has been cancelled.");
            setDialogState((prev) => ({ ...prev, isOpen: false }));
          } catch (err) {
            uiToast.error("Cancellation Failed", typeof err === "string" ? err : err?.message || "Failed to cancel cheque.");
          }
        }}

        onSuccess={() => {
          fetchChequesData();
          setDialogState((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </>
  );
};

export default ChequesPage;
