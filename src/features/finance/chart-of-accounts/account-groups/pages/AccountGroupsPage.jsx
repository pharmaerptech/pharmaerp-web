import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES, API_STATUS } from "@/constants";
import { useIsMobile } from "@/hooks";
import { UIConfirmDialog } from "@/components/ui";

import useAccountGroup from "../hooks/useAccountGroup";
import useAccount from "../../accounts/hooks/useAccount";
import AccountGroupsDesktopPage from "./desktop/AccountGroupsDesktopPage";
import AccountGroupsMobilePage from "./mobile/AccountGroupsMobilePage";
import AccountGroupDialog from "../components/AccountGroupDialog";

const initialFilters = {
  search: "",
  status: "all",
  underGroup: "all",
};

const normalizeText = (val) => String(val || "").trim().toLowerCase();

const AccountGroupsPage = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);

  const {
    accountGroups = [],
    getAccountGroups,
    getAccountGroupsStatus,
    createAccountGroup,
    updateAccountGroup,
    deleteAccountGroup,
    message,
    error,
    clearMessage,
    clearError,
  } = useAccountGroup();

  const {
    accounts = [],
    getAccounts,
    getAccountsStatus,
  } = useAccount();

  const [filters, setFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: "create",
    groupData: null,
  });

  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    groupId: null,
    groupName: "",
    isDeleting: false,
  });

  const fetchGroupsAndAccounts = useCallback(async () => {
    try {
      await Promise.all([
        getAccountGroups(),
        getAccounts(),
      ]);
    } catch (err) {
      console.error("Failed to fetch account groups and accounts", err);
    }
  }, [getAccountGroups, getAccounts]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchGroupsAndAccounts();
  }, [fetchGroupsAndAccounts]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const isLoading =
    getAccountGroupsStatus === API_STATUS.LOADING ||
    getAccountsStatus === API_STATUS.LOADING;

  const hasError = getAccountGroupsStatus === API_STATUS.ERROR;

  // Helper: Get direct and indirect accounts count for a group
  const getGroupAccountsCount = useCallback((groupId) => {
    const getDescendants = (parentId) => {
      let desc = [];
      const children = accountGroups.filter((g) => {
        const parentIdStr = typeof g.parentGroupId === "object" ? g.parentGroupId?._id : g.parentGroupId;
        return parentIdStr === parentId;
      });
      children.forEach((c) => {
        desc.push(c._id);
        desc = desc.concat(getDescendants(c._id));
      });
      return desc;
    };

    const targetGroupIds = [groupId].concat(getDescendants(groupId));
    return accounts.filter((a) => {
      const aGroupId = typeof a.accountGroupId === "object" ? a.accountGroupId?._id : a.accountGroupId;
      return targetGroupIds.includes(aGroupId);
    }).length;
  }, [accountGroups, accounts]);

  // Helper to map parent group name
  const getParentGroupName = useCallback((parentGroupId) => {
    const parentIdStr = typeof parentGroupId === "object" ? parentGroupId?._id : parentGroupId;
    if (!parentIdStr) return "-";
    const parentGroup = accountGroups.find((g) => g._id === parentIdStr);
    return parentGroup ? parentGroup.groupName : "-";
  }, [accountGroups]);

  // Map account groups to include computed hierarchy level, accounts count, parent names, etc.
  const mappedGroups = useMemo(() => {
    // Determine tree depth/level for indenting
    const calculateLevel = (group, depth = 1) => {
      const parentIdStr = typeof group.parentGroupId === "object" ? group.parentGroupId?._id : group.parentGroupId;
      if (!parentIdStr) return depth;
      const parent = accountGroups.find((g) => g._id === parentIdStr);
      if (!parent) return depth;
      return calculateLevel(parent, depth + 1);
    };

    return accountGroups.map((group) => {
      const parentIdStr = typeof group.parentGroupId === "object" ? group.parentGroupId?._id : group.parentGroupId;
      return {
        ...group,
        id: group._id,
        name: group.groupName,
        code: group.groupCode,
        level: calculateLevel(group),
        underGroup: getParentGroupName(group.parentGroupId),
        accountsCount: getGroupAccountsCount(group._id),
        status: group.status || "active",
      };
    });
  }, [accountGroups, getGroupAccountsCount, getParentGroupName]);

  // Apply filters
  const filteredGroups = useMemo(() => {
    const searchVal = normalizeText(filters.search);
    const statusVal = normalizeText(filters.status);
    const underVal = filters.underGroup;

    return mappedGroups.filter((group) => {
      const matchesSearch =
        !searchVal ||
        normalizeText(group.name).includes(searchVal) ||
        normalizeText(group.code).includes(searchVal) ||
        normalizeText(group.description).includes(searchVal);

      const matchesStatus =
        statusVal === "all" ||
        normalizeText(group.status) === statusVal;

      const parentIdStr = typeof group.parentGroupId === "object" ? group.parentGroupId?._id : group.parentGroupId;
      const matchesUnder =
        underVal === "all" ||
        parentIdStr === underVal;

      return matchesSearch && matchesStatus && matchesUnder;
    });
  }, [mappedGroups, filters]);

  const totalCount = filteredGroups.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredGroups.slice(startIndex, startIndex + pageSize);
  }, [filteredGroups, currentPage, pageSize]);

  // Dynamic statistics
  const stats = useMemo(() => {
    const totalGroups = accountGroups.length;
    const rootGroups = accountGroups.filter((g) => !g.parentGroupId).length;
    const underGroups = accountGroups.filter((g) => g.parentGroupId).length;
    const totalAccs = accounts.length;
    const activeGroups = accountGroups.filter((g) => g.status === "active").length;
    const inactiveGroups = accountGroups.filter((g) => g.status === "inactive").length;

    return {
      totalGroups,
      rootGroups,
      underGroups,
      totalAccounts: totalAccs,
      activeGroups,
      inactiveGroups,
      lastUpdated: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
  }, [accountGroups, accounts]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filters.search) {
      chips.push({ key: "search", label: `Search: ${filters.search}` });
    }
    if (filters.status !== "all") {
      chips.push({ key: "status", label: `Status: ${filters.status}` });
    }
    if (filters.underGroup !== "all") {
      const parent = accountGroups.find((g) => g._id === filters.underGroup);
      chips.push({ key: "underGroup", label: `Under: ${parent ? parent.groupName : filters.underGroup}` });
    }
    return chips;
  }, [filters, accountGroups]);

  const handleFilterChange = useCallback((name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleRemoveFilter = useCallback((key) => {
    setFilters((prev) => ({ ...prev, [key]: initialFilters[key] }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const handleCreateGroup = useCallback(() => {
    setDialogState({ isOpen: true, mode: "create", groupData: null });
  }, []);

  const handleViewGroup = useCallback(
    (groupId) => {
      const target = accountGroups.find(
        (g) => g._id === groupId || g.id === groupId
      );
      setDialogState({ isOpen: true, mode: "view", groupData: target || null });
    },
    [accountGroups]
  );

  const handleEditGroup = useCallback(
    (groupId) => {
      const target = accountGroups.find(
        (g) => g._id === groupId || g.id === groupId
      );
      setDialogState({ isOpen: true, mode: "edit", groupData: target || null });
    },
    [accountGroups]
  );

  const handleDeleteGroup = useCallback(
    (groupId) => {
      const target = accountGroups.find(
        (g) => g._id === groupId || g.id === groupId
      );
      setDeleteConfirm({
        isOpen: true,
        groupId,
        groupName: target?.groupName || target?.name || "this account group",
        isDeleting: false,
      });
    },
    [accountGroups]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm.groupId) return;
    setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteAccountGroup(deleteConfirm.groupId);
      setDeleteConfirm({ isOpen: false, groupId: null, groupName: "", isDeleting: false });
      fetchGroupsAndAccounts();
    } catch (err) {
      console.error(err);
      setDeleteConfirm((prev) => ({ ...prev, isDeleting: false }));
    }
  }, [deleteConfirm.groupId, deleteAccountGroup, fetchGroupsAndAccounts]);

  const handleRefresh = useCallback(() => {
    fetchGroupsAndAccounts();
  }, [fetchGroupsAndAccounts]);

  const rootGroupOptions = useMemo(() => {
    const opts = [{ label: "Root/Under Group: All", value: "all" }];
    accountGroups.forEach((g) => {
      opts.push({ label: g.groupName, value: g._id });
    });
    return opts;
  }, [accountGroups]);

  const statusOptions = useMemo(
    () => [
      { label: "Status: All", value: "all" },
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
    []
  );

  const pageProps = {
    accountGroups: paginatedGroups,
    totalCount,
    currentPage,
    pageSize,
    totalPages,
    handlePageChange: setCurrentPage,
    handlePageSizeChange: (size) => {
      setPageSize(size);
      setCurrentPage(1);
    },
    rawGroups: accountGroups,
    stats,
    filters,
    activeFilterChips,
    rootGroupOptions,
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
    handleCreateGroup,
    handleViewGroup,
    handleEditGroup,
    handleDeleteGroup,
    handleRefresh,
    handleBackToCOA: useCallback(() => {
      navigate(ROUTES.FINANCE);
    }, [navigate]),
  };

  return (
    <>
      {isMobile ? (
        <AccountGroupsMobilePage {...pageProps} />
      ) : (
        <AccountGroupsDesktopPage {...pageProps} />
      )}

      <AccountGroupDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        mode={dialogState.mode}
        groupData={dialogState.groupData}
        accountGroups={accountGroups}
        onSubmitCreate={createAccountGroup}
        onSubmitUpdate={updateAccountGroup}
        onSuccess={fetchGroupsAndAccounts}
      />

      <UIConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({
            isOpen: false,
            groupId: null,
            groupName: "",
            isDeleting: false,
          })
        }
        onConfirm={handleConfirmDelete}
        title="Delete Account Group?"
        description={`Are you sure you want to delete ${deleteConfirm.groupName}? Any associated accounts should be migrated first.`}
        intent="danger"
        confirmLabel="Delete Group"
        isLoading={deleteConfirm.isDeleting}
      />
    </>
  );
};

export default AccountGroupsPage;
