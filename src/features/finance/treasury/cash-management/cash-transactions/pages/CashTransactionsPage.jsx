import React, { useState, useEffect, useCallback } from "react";
import { API_STATUS } from "@/constants";
import { useIsMobile, useBranchFilter } from "@/hooks";
import useCashTransaction from "../hooks/useCashTransaction";
import useBranch from "@/features/branch/hooks/useBranch";
import CashTransactionsDesktopPage from "./desktop/CashTransactionsDesktopPage";
import CashTransactionsMobilePage from "./mobile/CashTransactionsMobilePage";

const CashTransactionsPage = () => {
  const isMobile = useIsMobile();
  const { currentBranch } = useBranch();
  const {
    isCompanyLevel,
    selectedBranchId,
    setSelectedBranchId,
    queryBranchId,
  } = useBranchFilter();
  const activeBranchId = isCompanyLevel ? queryBranchId : (currentBranch?._id || undefined);

  const {
    cashTransactions,
    getCashTransactions,
    getCashTransactionsStatus,
    error,
    clearError,
  } = useCashTransaction();

  const [searchParams, setSearchParams] = useState({
    search: "",
    status: "all",
    transactionType: "all",
    partition: "all",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchTransactionsData = useCallback(async () => {
    if (!isMobile) return;
    try {
      const query = {
        page: currentPage,
        limit: pageSize,
        search: searchParams.search || undefined,
        status: searchParams.status === "all" ? undefined : searchParams.status,
        transactionType:
          searchParams.transactionType === "all" ? undefined : searchParams.transactionType,
        partition: searchParams.partition === "all" ? undefined : searchParams.partition,
        branchId: activeBranchId,
      };
      await getCashTransactions(query);
    } catch (err) {
      console.error("Failed to query cash transactions list:", err);
    }
  }, [isMobile, currentPage, pageSize, searchParams, getCashTransactions, activeBranchId]);

  useEffect(() => {
    fetchTransactionsData();
  }, [fetchTransactionsData]);

  if (!isMobile) {
    return <CashTransactionsDesktopPage />;
  }

  return (
    <CashTransactionsMobilePage
      cashTransactions={cashTransactions || []}
      searchParams={searchParams}
      currentPage={currentPage}
      pageSize={pageSize}
      totalTransactions={cashTransactions?.length || 0}
      isLoading={getCashTransactionsStatus === API_STATUS.LOADING}
      isCompanyLevel={isCompanyLevel}
      selectedBranchId={selectedBranchId}
      setSelectedBranchId={setSelectedBranchId}
      error={error}
      clearError={clearError}
      handleSearchChange={(val) => {
        setSearchParams((prev) => ({ ...prev, search: val }));
        setCurrentPage(1);
      }}
      handleFilterChange={(name, val) => {
        setSearchParams((prev) => ({ ...prev, [name]: val }));
        setCurrentPage(1);
      }}
      handlePageChange={(page) => setCurrentPage(page)}
      handlePageSizeChange={(size) => {
        setPageSize(size);
        setCurrentPage(1);
      }}
      handleRefresh={fetchTransactionsData}
    />
  );
};

export default CashTransactionsPage;
