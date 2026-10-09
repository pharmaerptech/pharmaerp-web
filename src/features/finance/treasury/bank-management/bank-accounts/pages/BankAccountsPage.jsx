import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile } from "@/hooks";

import useBankAccount from "../hooks/useBankAccount";
import BankAccountsDesktopPage from "./desktop/BankAccountsDesktopPage";
import BankAccountsMobilePage from "./mobile/BankAccountsMobilePage";

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const formatStringTitle = (value) => {
  if (!value) return "-";
  return String(value)
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const mapBankAccountForView = (account) => {
  const accountName = account?.accountName || "-";
  const accountNumber = account?.accountNumber || "-";
  const accountHolderName = account?.accountHolderName || "-";
  const ifscCode = account?.ifscCode || "-";
  const branchName = account?.branchName || "-";
  const accountType = account?.accountType || "CURRENT";
  const isPrimary = account?.isPrimary || false;
  const isActive = account?.isActive !== false;
  const bankName =
    account?.bank ||
    account?.bankMasterId?.bankName ||
    account?.bankMasterId?.name ||
    (accountName.includes("HDFC")
      ? "HDFC Bank"
      : accountName.includes("ICICI")
        ? "ICICI Bank"
        : accountName.includes("Axis")
          ? "Axis Bank"
          : accountName.includes("SBI")
            ? "State Bank of India"
            : accountName.includes("Yes")
              ? "Yes Bank"
              : accountName.includes("Kotak")
                ? "Kotak Mahindra Bank"
                : accountName.includes("Canara")
                  ? "Canara Bank"
                  : accountName.includes("Baroda")
                    ? "Bank of Baroda"
                    : "Bank");

  const balance = account?.balance || 0;

  return {
    ...account,
    displayName: accountName,
    displayAccountNumber: accountNumber,
    displayHolderName: accountHolderName,
    displayIfsc: ifscCode,
    displayBranch: branchName,
    displayType: accountType === "CURRENT" ? "Current Account" : accountType === "SAVINGS" ? "Savings Account" : formatStringTitle(accountType),
    displayStatus: isActive ? "active" : "inactive",
    displayBank: bankName,
    balance,
    isPrimary,
  };
};

import BankAccountDialog from "../components/BankAccountDialog";
import { UIConfirmDialog } from "@/components/ui";

const BankAccountsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const hasFetchedRef = useRef(false);

  const [filters, setFilters] = useState({
    search: "",
    bank: "all",
    accountType: "all",
    status: "all",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog state for create/edit/view
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: "create",
    entityId: null,
  });

  // Confirm delete state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    accountId: null,
  });

  const {
    bankAccounts,
    getBankAccountsStatus,
    deleteBankAccountStatus,
    setPrimaryBankAccountStatus,
    error,
    message,
    getBankAccounts,
    getBankAccountById,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    setPrimaryBankAccount,
    clearError,
    clearMessage,
  } = useBankAccount();

  const isLoading =
    getBankAccountsStatus === API_STATUS.LOADING ||
    deleteBankAccountStatus === API_STATUS.LOADING ||
    setPrimaryBankAccountStatus === API_STATUS.LOADING;

  const hasError = getBankAccountsStatus === API_STATUS.ERROR;

  const fetchAccountsData = useCallback(async () => {
    try {
      await getBankAccounts();
    } catch (err) {
      console.error("Failed to fetch bank accounts:", err);
    }
  }, [getBankAccounts]);

  useEffect(() => {
    clearError();
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchAccountsData();
    }
    return () => {
      clearError();
    };
  }, [clearError, fetchAccountsData]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => {
      clearMessage();
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [clearMessage, message]);

  const activeAccountsList = useMemo(() => {
    return Array.isArray(bankAccounts) ? bankAccounts : [];
  }, [bankAccounts]);

  const mappedAccounts = useMemo(() => {
    return activeAccountsList.map(mapBankAccountForView);
  }, [activeAccountsList]);

  // Compute unique list of banks for the dropdown filter
  const uniqueBanks = useMemo(() => {
    const banks = mappedAccounts.map((a) => a.displayBank).filter(Boolean);
    return ["all", ...Array.from(new Set(banks))];
  }, [mappedAccounts]);

  const filteredAccounts = useMemo(() => {
    const searchToken = normalizeText(filters.search);
    const typeToken = normalizeText(filters.accountType);
    const statusToken = normalizeText(filters.status);
    const bankToken = normalizeText(filters.bank);

    return mappedAccounts.filter((acc) => {
      const matchesSearch =
        !searchToken ||
        normalizeText(acc.displayName).includes(searchToken) ||
        normalizeText(acc.displayAccountNumber).includes(searchToken) ||
        normalizeText(acc.displayHolderName).includes(searchToken) ||
        normalizeText(acc.displayIfsc).includes(searchToken) ||
        normalizeText(acc.displayBranch).includes(searchToken) ||
        normalizeText(acc.displayBank).includes(searchToken);

      const matchesType =
        filters.accountType === "all" ||
        normalizeText(acc.accountType) === typeToken;

      const matchesStatus =
        filters.status === "all" ||
        normalizeText(acc.displayStatus) === statusToken;

      const matchesBank =
        filters.bank === "all" ||
        normalizeText(acc.displayBank) === bankToken;

      return matchesSearch && matchesType && matchesStatus && matchesBank;
    });
  }, [filters, mappedAccounts]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filters.search) {
      chips.push({ key: "search", label: `Search: ${filters.search}` });
    }
    if (filters.bank !== "all") {
      chips.push({
        key: "bank",
        label: `Bank: ${filters.bank}`,
      });
    }
    if (filters.accountType !== "all") {
      chips.push({
        key: "accountType",
        label: `Type: ${formatStringTitle(filters.accountType)}`,
      });
    }
    if (filters.status !== "all") {
      chips.push({
        key: "status",
        label: `Status: ${formatStringTitle(filters.status)}`,
      });
    }
    return chips;
  }, [filters]);

  const dashboardStats = useMemo(() => {
    const totalCount = mappedAccounts.length;
    const activeCount = mappedAccounts.filter((a) => a.displayStatus === "active").length;
    const inactiveCount = mappedAccounts.filter((a) => a.displayStatus === "inactive").length;
    const totalBalanceVal = mappedAccounts.reduce((sum, item) => sum + (item.balance || 0), 0);

    return [
      {
        id: "total_accounts",
        title: "Total Bank Accounts",
        value: totalCount,
        description: "Active Accounts",
        colorVariant: "success",
      },
      {
        id: "total_balance",
        title: "Total Balance",
        value: `₹ ${totalBalanceVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        description: "Across All Accounts",
        colorVariant: "info",
      },
      {
        id: "active_accounts",
        title: "Active Accounts",
        value: activeCount,
        description: "Available for Transactions",
        colorVariant: "purple",
      },
      {
        id: "inactive_accounts",
        title: "Inactive Accounts",
        value: inactiveCount,
        description: "Not in Use",
        colorVariant: "warning",
      },
    ];
  }, [mappedAccounts]);

  const handleFilterChange = useCallback(
    (eventOrValue) => {
      if (eventOrValue?.target) {
        const { name, value } = eventOrValue.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
      } else {
        setFilters((prev) => ({ ...prev, ...eventOrValue }));
      }
      setCurrentPage(1);
    },
    [],
  );

  const handleSearchChange = useCallback(
    (event) => {
      const value = event?.target?.value ?? event;
      setFilters((prev) => ({ ...prev, search: value }));
      setCurrentPage(1);
    },
    [],
  );

  const handleRemoveFilter = useCallback(
    (key) => {
      setFilters((prev) => ({ ...prev, [key]: "all" }));
      setCurrentPage(1);
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: "",
      bank: "all",
      accountType: "all",
      status: "all",
    });
    setCurrentPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchAccountsData();
  }, [fetchAccountsData]);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(Math.max(1, newPage));
  }, []);

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const handleAddAccount = useCallback(() => {
    setDialogState({ isOpen: true, mode: "create", entityId: null });
  }, []);

  const handleEditAccount = useCallback((account) => {
    if (!account?._id) return;
    setDialogState({ isOpen: true, mode: "edit", entityId: account._id });
  }, []);

  const handleViewDetails = useCallback((account) => {
    if (!account?._id) return;
    setDialogState({ isOpen: true, mode: "view", entityId: account._id });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleSetPrimary = useCallback(
    async (account) => {
      if (!account?._id) return;
      try {
        await setPrimaryBankAccount(account._id);
        fetchAccountsData();
      } catch (err) {
        console.error("Failed to set primary bank account:", err);
      }
    },
    [setPrimaryBankAccount, fetchAccountsData],
  );

  const handleDeleteAccount = useCallback((account) => {
    if (!account?._id) return;
    setConfirmState({ isOpen: true, accountId: account._id });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmState.accountId) return;
    try {
      await deleteBankAccount(confirmState.accountId);
      setConfirmState({ isOpen: false, accountId: null });
      fetchAccountsData();
    } catch (err) {
      console.error("Failed to delete bank account:", err);
    }
  }, [confirmState.accountId, deleteBankAccount, fetchAccountsData]);

  const pageProps = {
    accounts: filteredAccounts,
    dashboardStats,
    filters,
    activeFilterChips,
    uniqueBanks,
    isLoading,
    hasError,
    error,
    message,
    totalAccounts: filteredAccounts.length,
    currentPage,
    pageSize,
    totalPages: Math.ceil(filteredAccounts.length / pageSize) || 1,
    hasAccounts: mappedAccounts.length > 0,
    hasFilteredAccounts: filteredAccounts.length > 0,
    handleFilterChange,
    handleSearchChange,
    handleRemoveFilter,
    handleClearFilters,
    handleRefresh,
    handlePageChange,
    handlePageSizeChange,
    handleAddAccount,
    handleEditAccount,
    handleViewDetails,
    handleSetPrimary,
    handleDeleteAccount,
    clearMessage,
  };

  return (
    <>
      {isMobile ? (
        <BankAccountsMobilePage {...pageProps} />
      ) : (
        <BankAccountsDesktopPage {...pageProps} />
      )}

      <BankAccountDialog
        isOpen={dialogState.isOpen}
        onClose={handleCloseDialog}
        mode={dialogState.mode}
        entityId={dialogState.entityId}
        onSubmitCreate={createBankAccount}
        onSubmitUpdate={updateBankAccount}
        onFetchById={getBankAccountById}
        onSuccess={fetchAccountsData}
      />

      <UIConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, accountId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Bank Account"
        description="Are you sure you want to delete this bank account? This action cannot be undone."
        confirmText="Delete Account"
        variant="danger"
      />
    </>
  );
};

export default BankAccountsPage;
