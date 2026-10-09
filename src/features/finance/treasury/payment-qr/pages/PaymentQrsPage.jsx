import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES, API_STATUS } from "@/constants";
import { useIsMobile } from "@/hooks";

import usePaymentQr from "../hooks/usePaymentQr";
import PaymentQrsDesktopPage from "./desktop/PaymentQrsDesktopPage";
import PaymentQrsMobilePage from "./mobile/PaymentQrsMobilePage";

import PaymentQrDialog from "../components/PaymentQrDialog";
import { UIConfirmDialog } from "@/components/ui";

const INITIAL_FILTERS = {
  search: "",
  status: "all",
  provider: "all",
  page: 1,
  limit: 10,
};

const PaymentQrsPage = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: "create",
    entityId: null,
    qrData: null,
  });

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    qrId: null,
  });

  const {
    paymentQrs,
    getPaymentQrsStatus,
    deletePaymentQrStatus,
    setPrimaryPaymentQrStatus,
    error: serverError,
    message: serverMessage,
    getPaymentQrs,
    getPaymentQrById,
    createPaymentQr,
    updatePaymentQr,
    deletePaymentQr,
    setPrimaryPaymentQr,
    clearError,
    clearMessage,
  } = usePaymentQr();

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [totalQrs, setTotalQrs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPaymentQrs = useCallback(
    async (params = {}) => {
      try {
        const queryParams = {
          page: params.page || filters.page,
          limit: params.limit || filters.limit,
          search: params.search !== undefined ? params.search : filters.search,
        };

        if (params.status !== undefined) {
          if (params.status !== "all") queryParams.status = params.status.toUpperCase();
        } else if (filters.status !== "all") {
          queryParams.status = filters.status.toUpperCase();
        }

        if (params.provider !== undefined) {
          if (params.provider !== "all") queryParams.provider = params.provider.toUpperCase();
        } else if (filters.provider !== "all") {
          queryParams.provider = filters.provider.toUpperCase();
        }

        const response = await getPaymentQrs(queryParams);
        if (response) {
          setTotalQrs(response.total || 0);
          setTotalPages(Math.ceil((response.total || 0) / queryParams.limit));
        }
      } catch (err) {
        console.error("Failed to load payment QR database:", err);
      }
    },
    [getPaymentQrs, filters]
  );

  // Initial load & filter changes
  useEffect(() => {
    fetchPaymentQrs();
  }, [filters.page, filters.limit, filters.status, filters.provider]);

  // Handle Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, page: 1 }));
      fetchPaymentQrs({ page: 1 });
    }, 450);

    return () => clearTimeout(handler);
  }, [filters.search]);

  // Clean up notifications on unmount
  useEffect(() => {
    return () => {
      clearError();
      clearMessage();
    };
  }, []);

  const handleFilterChange = useCallback((name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(name !== "page" ? { page: 1 } : {}),
    }));
    clearError();
    clearMessage();
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    clearError();
    clearMessage();
  }, []);

  const handleRemoveChip = useCallback((key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: INITIAL_FILTERS[key],
      page: 1,
    }));
  }, []);

  const handlePageChange = useCallback((newPage) => {
    handleFilterChange("page", newPage);
  }, [handleFilterChange]);

  const handlePageSizeChange = useCallback((newSize) => {
    setFilters((prev) => ({
      ...prev,
      limit: newSize,
      page: 1,
    }));
  }, []);

  const handleRefresh = useCallback(() => {
    clearError();
    clearMessage();
    fetchPaymentQrs();
  }, [fetchPaymentQrs]);

  const handleCreateQr = useCallback(() => {
    setDialogState({
      isOpen: true,
      mode: "create",
      entityId: null,
      qrData: null,
    });
  }, []);

  const handleEditQr = useCallback((qr) => {
    const id = typeof qr === "string" ? qr : qr?._id;
    const data = typeof qr === "object" ? qr : null;
    setDialogState({
      isOpen: true,
      mode: "edit",
      entityId: id,
      qrData: data,
    });
  }, []);

  const handleViewDetails = useCallback((qr) => {
    const id = typeof qr === "string" ? qr : qr?._id;
    const data = typeof qr === "object" ? qr : null;
    setDialogState({
      isOpen: true,
      mode: "view",
      entityId: id,
      qrData: data,
    });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleDeleteQr = useCallback((qr) => {
    const id = typeof qr === "string" ? qr : qr?._id;
    if (!id) return;
    setConfirmState({ isOpen: true, qrId: id });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmState.qrId) return;
    try {
      await deletePaymentQr(confirmState.qrId);
      setConfirmState({ isOpen: false, qrId: null });
      fetchPaymentQrs();
    } catch (err) {
      console.error("Failed to delete QR register:", err);
    }
  }, [confirmState.qrId, deletePaymentQr, fetchPaymentQrs]);

  const handleSetPrimary = useCallback(
    async (id) => {
      try {
        await setPrimaryPaymentQr(id);
        fetchPaymentQrs();
      } catch (err) {
        console.error("Failed to set primary QR register:", err);
      }
    },
    [setPrimaryPaymentQr, fetchPaymentQrs]
  );

  const isLoading =
    getPaymentQrsStatus === API_STATUS.LOADING ||
    deletePaymentQrStatus === API_STATUS.LOADING ||
    setPrimaryPaymentQrStatus === API_STATUS.LOADING;

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filters.status !== "all") {
      chips.push({ key: "status", label: `Status: ${filters.status}` });
    }
    if (filters.provider !== "all") {
      chips.push({ key: "provider", label: `Provider: ${filters.provider}` });
    }
    return chips;
  }, [filters.status, filters.provider]);

  const stats = useMemo(() => {
    const list = paymentQrs || [];
    return {
      totalCount: totalQrs,
      activeCount: list.filter((q) => q.status === "ACTIVE").length,
      primaryCount: list.filter((q) => q.isPrimary).length,
    };
  }, [paymentQrs, totalQrs]);

  const pageProps = {
    filters,
    stats,
    pagedQrs: paymentQrs || [],
    totalQrs,
    currentPage: filters.page,
    totalPages,
    pageSize: filters.limit,
    activeFilterChips,
    isLoading,
    serverError,
    serverMessage,
    handleFilterChange,
    handleRemoveChip,
    handleClearFilters,
    handlePageChange,
    handlePageSizeChange,
    handleRefresh,
    handleCreateQr,
    handleEditQr,
    handleViewDetails,
    handleDeleteQr,
    handleSetPrimary,
    clearError,
    clearMessage,
  };

  return (
    <>
      {isMobile ? (
        <PaymentQrsMobilePage {...pageProps} />
      ) : (
        <PaymentQrsDesktopPage {...pageProps} />
      )}

      <PaymentQrDialog
        isOpen={dialogState.isOpen}
        onClose={handleCloseDialog}
        mode={dialogState.mode}
        entityId={dialogState.entityId}
        qrData={dialogState.qrData}
        onSubmitCreate={createPaymentQr}
        onSubmitUpdate={updatePaymentQr}
        onFetchById={getPaymentQrById}
        onSuccess={fetchPaymentQrs}
      />

      <UIConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, qrId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Payment QR"
        description="Are you sure you want to delete this UPI QR code? This action cannot be undone."
        confirmText="Delete QR"
        variant="danger"
      />
    </>
  );
};

export default PaymentQrsPage;
