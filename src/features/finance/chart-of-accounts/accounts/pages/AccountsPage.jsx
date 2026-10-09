import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES, API_STATUS } from "@/constants";
import { useIsMobile } from "@/hooks";
import useBranch from "@/features/branch/hooks/useBranch";
import { UIConfirmDialog } from "@/components/ui";

import useAccountGroup from "../../account-groups/hooks/useAccountGroup";
import useAccount from "../hooks/useAccount";
import AccountsDesktopPage from "./desktop/AccountsDesktopPage";
import AccountsMobilePage from "./mobile/AccountsMobilePage";
import AccountDialog from "../components/AccountDialog";

const initialFilters = {
  search: "",
  accountType: "all",
  status: "all",
  accountGroupId: "all",
};

const AccountsPage = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { currentBranch } = useBranch();
  const hasFetchedGroupsRef = useRef(false);

  const {
    accounts,
    totalAccounts,
    getAccounts,
    getAccountsStatus,
    createAccount,
    updateAccount,
    deleteAccount,
    message,
    error,
    clearMessage,
    clearError,
  } = useAccount();

  const { accountGroups, getAccountGroups } = useAccountGroup();

  const [filters, setFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: "create",
    accountData: null,
  });

  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    accountId: null,
    accountName: "",
    isDeleting: false,
  });

  // Fetch account groups once on mount for classification dropdowns
  useEffect(() => {
    if (hasFetchedGroupsRef.current) return;
    hasFetchedGroupsRef.current = true;
    getAccountGroups({ all: true }).catch(() => {});
  }, [getAccountGroups]);

  const fetchAccountsList = useCallback(() => {
    const query = {
      page: currentPage,
      limit: pageSize,
      search: filters.search || undefined,
      accountType: filters.accountType === "all" ? undefined : filters.accountType,
      status: filters.status === "all" ? undefined : filters.status,
      accountGroupId: filters.accountGroupId === "all" ? undefined : filters.accountGroupId,
    };
    getAccounts(query).catch((err) =>
      console.error("Failed to load accounts:", err)
    );
  }, [currentPage, pageSize, filters, getAccounts]);

  useEffect(() => {
    fetchAccountsList();
  }, [fetchAccountsList]);

  const handleFilterChange = useCallback((name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  }, []);

  const handleRemoveFilter = useCallback((key) => {
    setFilters((prev) => ({ ...prev, [key]: initialFilters[key] }));
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
    setCurrentPage(1);
  }, []);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filters.search) chips.push({ key: "search", label: `Search: ${filters.search}` });
    if (filters.accountType !== "all") chips.push({ key: "accountType", label: `Type: ${filters.accountType}` });
    if (filters.status !== "all") chips.push({ key: "status", label: `Status: ${filters.status}` });
    if (filters.accountGroupId !== "all") chips.push({ key: "accountGroupId", label: "Group filtered" });
    return chips;
  }, [filters]);

  const mappedAccounts = useMemo(() => {
    if (!Array.isArray(accounts)) return [];
    return accounts.map((acc) => {
      const gObj = acc.accountGroupId;
      const gName = typeof gObj === "object" ? gObj?.groupName : null;
      const matching = accountGroups.find(
        (g) => (g._id || g.id) === acc.accountGroupId
      );
      return {
        ...acc,
        name: acc.accountName || acc.name || "-",
        code: acc.accountCode || acc.code || "-",
        underGroup: gName || matching?.groupName || "-",
        type: acc.accountNature || acc.type || "-",
        nature: (acc.openingBalanceType || "dr").toUpperCase() === "DR" ? "Debit" : "Credit",
        status: acc.status || "active",
      };
    });
  }, [accounts, accountGroups]);

  const totalCount = totalAccounts || mappedAccounts.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const isLoading = getAccountsStatus === API_STATUS.LOADING;
  const hasError = getAccountsStatus === API_STATUS.ERROR;

  const stats = useMemo(() => {
    const all = Array.isArray(mappedAccounts) ? mappedAccounts : [];
    return {
      totalAccounts: totalCount,
      activeAccounts: all.filter((a) => a.status === "active").length,
      inactiveAccounts: all.filter((a) => a.status === "inactive").length,
    };
  }, [mappedAccounts, totalCount]);

  const handleCreateAccount = useCallback(() => {
    setDialogState({ isOpen: true, mode: "create", accountData: null });
  }, []);

  const handleViewAccount = useCallback(
    (accountId) => {
      const target = accounts.find((a) => a._id === accountId || a.id === accountId);
      setDialogState({ isOpen: true, mode: "view", accountData: target || null });
    },
    [accounts],
  );

  const handleEditAccount = useCallback(
    (accountId) => {
      const target = accounts.find((a) => a._id === accountId || a.id === accountId);
      setDialogState({ isOpen: true, mode: "edit", accountData: target || null });
    },
    [accounts],
  );

  const handleDeleteAccount = useCallback(
    (accountId) => {
      const target = accounts.find((a) => a._id === accountId || a.id === accountId);
      setDeleteConfirm({
        isOpen: true,
        accountId,
        accountName: target?.accountName || target?.name || "this account",
        isDeleting: false,
      });
    },
    [accounts],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm.accountId) return;
    setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteAccount(deleteConfirm.accountId);
      setDeleteConfirm({ isOpen: false, accountId: null, accountName: "", isDeleting: false });
      fetchAccountsList();
    } catch (err) {
      console.error(err);
      setDeleteConfirm((prev) => ({ ...prev, isDeleting: false }));
    }
  }, [deleteConfirm.accountId, deleteAccount, fetchAccountsList]);

  const handleRefresh = useCallback(() => {
    fetchAccountsList();
    getAccountGroups({ all: true }).catch(() => {});
  }, [fetchAccountsList, getAccountGroups]);

  const accountTypeOptions = useMemo(
    () => [
      { label: "Account Type: All", value: "all" },
      { label: "Asset", value: "asset" },
      { label: "Liability", value: "liability" },
      { label: "Equity", value: "equity" },
      { label: "Income", value: "income" },
      { label: "Expense", value: "expense" },
    ],
    [],
  );

  const statusOptions = useMemo(
    () => [
      { label: "Status: All", value: "all" },
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
    [],
  );

  const pageProps = {
    accounts: mappedAccounts,
    totalCount,
    currentPage,
    pageSize,
    totalPages,
    handlePageChange: setCurrentPage,
    handlePageSizeChange: (size) => {
      setPageSize(size);
      setCurrentPage(1);
    },
    stats,
    filters,
    activeFilterChips,
    accountTypeOptions,
    statusOptions,
    isLoading,
    hasError,
    error,
    message,
    clearMessage,
    clearError,
    handleFilterChange,
    handleRemoveFilter,
    handleClearFilters,
    handleCreateAccount,
    handleViewAccount,
    handleEditAccount,
    handleDeleteAccount,
    handleRefresh,
    handleBackToCOA: () => navigate(ROUTES.FINANCE),
  };

  return (
    <>
      {isMobile ? (
        <AccountsMobilePage {...pageProps} />
      ) : (
        <AccountsDesktopPage {...pageProps} />
      )}

      <AccountDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        mode={dialogState.mode}
        accountData={dialogState.accountData}
        accountGroups={accountGroups}
        onSubmitCreate={createAccount}
        onSubmitUpdate={updateAccount}
        onSuccess={() => {
          fetchAccountsList();
          getAccountGroups({ all: true }).catch(() => {});
        }}
      />

      <UIConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, accountId: null, accountName: "", isDeleting: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Account?"
        description={`Are you sure you want to delete ${deleteConfirm.accountName}? This action cannot be undone.`}
        intent="danger"
        confirmLabel="Delete Account"
        isLoading={deleteConfirm.isDeleting}
      />
    </>
  );
};

export default AccountsPage;
