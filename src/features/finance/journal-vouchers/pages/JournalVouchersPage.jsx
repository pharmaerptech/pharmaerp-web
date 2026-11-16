import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

import { API_STATUS } from "@/constants";
import { useIsMobile, useCompanyFilter } from "@/hooks";

import useJournalVoucher from "../hooks/useJournalVoucher";
import useAccount from "@/features/finance/chart-of-accounts/accounts/hooks/useAccount";
import JournalVouchersDesktopPage from "./desktop/JournalVouchersDesktopPage";
import JournalVouchersMobilePage from "./mobile/JournalVouchersMobilePage";
import JournalVoucherDialog from "../components/JournalVoucherDialog";

const JournalVouchersPage = () => {
  const isMobile = useIsMobile();
  const companyFilter = useCompanyFilter();
  const hasFetchedAccountsRef = useRef(false);

  const {
    journalVouchers,
    getJournalVouchers,
    getJournalVouchersStatus,
    createJournalVoucher,
    updateJournalVoucher,
    error,
    clearError,
  } = useJournalVoucher();

  const { accounts = [], getAccounts } = useAccount();

  const [searchParams, setSearchParams] = useState({
    search: "",
    status: "all",
    voucherType: "all",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: "create",
    voucherData: null,
  });

  // Pre-fetch accounts for dialog selectors
  useEffect(() => {
    if (hasFetchedAccountsRef.current) return;
    hasFetchedAccountsRef.current = true;
    getAccounts({ all: true }).catch((err) =>
      console.error("Failed to load accounts for journal dialog:", err)
    );
  }, [getAccounts]);

  // Trigger query load when dependencies alter
  useEffect(() => {
    const loadVouchers = async () => {
      try {
        const query = {
          page: currentPage,
          limit: pageSize,
          search: searchParams.search || undefined,
          status: searchParams.status === "all" ? undefined : searchParams.status,
          voucherType: searchParams.voucherType === "all" ? undefined : searchParams.voucherType,
          companyId: companyFilter?.queryCompanyId,
        };
        await getJournalVouchers(query);
      } catch (err) {
        console.error("Failed to query journal vouchers list:", err);
      }
    };
    loadVouchers();
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

  const handleRefresh = useCallback(async () => {
    try {
      const query = {
        page: currentPage,
        limit: pageSize,
        search: searchParams.search || undefined,
        status: searchParams.status === "all" ? undefined : searchParams.status,
        voucherType: searchParams.voucherType === "all" ? undefined : searchParams.voucherType,
      };
      await getJournalVouchers(query);
    } catch (err) {
      console.error("Failed to refresh journal vouchers:", err);
    }
  }, [getJournalVouchers, currentPage, pageSize, searchParams]);

  const handleCreateVoucher = useCallback(() => {
    setDialogState({ isOpen: true, mode: "create", voucherData: null });
  }, []);

  const handleViewVoucher = useCallback(
    (voucherId) => {
      const target = (journalVouchers || []).find((v) => v._id === voucherId || v.id === voucherId);
      setDialogState({ isOpen: true, mode: "view", voucherData: target || null });
    },
    [journalVouchers]
  );

  const handleEditVoucher = useCallback(
    (voucherId) => {
      const target = (journalVouchers || []).find((v) => v._id === voucherId || v.id === voucherId);
      setDialogState({ isOpen: true, mode: "edit", voucherData: target || null });
    },
    [journalVouchers]
  );

  const totalVouchers = useMemo(() => {
    return journalVouchers?.length || 0;
  }, [journalVouchers]);

  const isLoading = getJournalVouchersStatus === API_STATUS.LOADING;

  const pageProps = {
    journalVouchers: journalVouchers || [],
    searchParams,
    companyFilter,
    currentPage,
    pageSize,
    totalVouchers,
    isLoading,
    error,
    clearError,
    handleSearchChange,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    handleRefresh,
    handleCreate: handleCreateVoucher,
    handleCreateVoucher,
    handleViewVoucher,
    handleEditVoucher,
  };

  return (
    <>
      {isMobile ? (
        <JournalVouchersMobilePage {...pageProps} />
      ) : (
        <JournalVouchersDesktopPage {...pageProps} />
      )}

      <JournalVoucherDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        mode={dialogState.mode}
        voucherData={dialogState.voucherData}
        accounts={accounts}
        onSubmitCreate={createJournalVoucher}
        onSubmitUpdate={updateJournalVoucher}
        onSuccess={handleRefresh}
      />
    </>
  );
};

export default JournalVouchersPage;

