// src/features/workspace/pages/WorkspaceMembersPage.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile } from "@/hooks";
import { resolveRoleWorkAccess } from "@/utils/workAccess";
import { UIConfirmDialog, UI_TOOLBAR_VIEWS } from "@/components/ui";
import { ResetMemberPasswordModal } from "../components";

import useWorkspace from "../hooks/useWorkspace";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";

import WorkspaceMembersDesktopPage from "./desktop/WorkspaceMembersDesktopPage";
import WorkspaceMembersMobilePage from "./mobile/WorkspaceMembersMobilePage";

const statusOptions = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Suspended", value: "suspended" },
];

const roleOptions = [
  { label: "All Roles", value: "all" },
  { label: "Owner", value: "owner" },
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "Pharmacist", value: "pharmacist" },
  { label: "Staff", value: "staff" },
];

const initialFilters = {
  search: "",
  status: "all",
  role: "all",
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRoleName = (role) => {
  const roleName = role?.name || role?.title || role?.code;

  if (!roleName) return "-";

  return String(roleName)
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const getRoleCode = (role) => normalizeText(role?.code || role?.name || "");

const getUser = (member) => member?.userId || member?.user || null;

const getDisplayName = (member) => {
  const user = getUser(member);

  return (
    user?.fullName ||
    user?.name ||
    user?.profile?.fullName ||
    user?.email ||
    "Workspace Member"
  );
};

const getDisplayEmail = (member) => {
  const user = getUser(member);

  return user?.email || "-";
};

const getDisplayPhone = (member) => {
  const user = getUser(member);
  const phone = user?.phone || user?.mobile || user?.profile?.phone;

  return phone ? `+91 ${phone}` : "-";
};

const mapMemberForView = (member) => {
  const user = getUser(member);
  const role = member?.roleId || member?.role || null;
  const displayName = getDisplayName(member);
  const displayEmail = getDisplayEmail(member);
  const displayPhone = getDisplayPhone(member);
  const displayRole = member?.isOwner ? "Owner" : formatRoleName(role);

  return {
    ...member,
    user,
    role,
    displayName,
    displayEmail,
    displayPhone,
    displayRole,
    workAccess: member?.workAccess || resolveRoleWorkAccess(role, { isOwner: Boolean(member?.isOwner) }),
    roleCode: member?.isOwner ? "owner" : getRoleCode(role),
    displayJoinedAt: formatDate(member?.createdAt),
    displayLastActiveAt: formatDateTime(member?.lastActiveAt),
  };
};

const WorkspaceMembersPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const {
    currentWorkspace,
    members,
    getMyWorkspaces,
    getWorkspaceMembers,
    updateWorkspaceMemberStatus,
    removeWorkspaceMember,
    resetMemberPassword,
    getMyWorkspacesStatus,
    getWorkspaceMembersStatus,
    updateWorkspaceMemberStatus: updateMemberStatusStatus,
    removeWorkspaceMemberStatus,
    resetMemberPasswordStatus,
    error,
    message,
    clearError,
    clearMessage,
  } = useWorkspace();

  const {
    companies,
    getWorkspaceCompanies,
  } = useCompany();

  const {
    branches,
    getWorkspaceBranches,
  } = useBranch();

  const hasFetchedCompaniesRef = useRef(false);
  const hasFetchedBranchesRef = useRef(false);

  const hasFetchedWorkspacesRef = useRef(false);
  const hasFetchedMembersRef = useRef(false);

  const hasCompanies = useMemo(
    () =>
      (Array.isArray(companies) ? companies : []).filter(
        (c) => c?.status === "active" && !c?.isDeleted,
      ).length > 0,
    [companies],
  );

  const hasBranches = useMemo(
    () =>
      (Array.isArray(branches) ? branches : []).filter(
        (b) => b?.status === "active" && !b?.isDeleted,
      ).length > 0,
    [branches],
  );

  const [filters, setFilters] = useState(initialFilters);
  const [viewMode, setViewMode] = useState(UI_TOOLBAR_VIEWS.GRID);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const [selectedMember, setSelectedMember] = useState(null);
  const [memberAction, setMemberAction] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetPasswordMember, setResetPasswordMember] = useState(null);

  const workspaceId = currentWorkspace?._id;

  const isLoadingWorkspaces = getMyWorkspacesStatus === API_STATUS.LOADING;
  const isLoadingMembers = getWorkspaceMembersStatus === API_STATUS.LOADING;
  const isUpdatingStatus = updateMemberStatusStatus === API_STATUS.LOADING;
  const isRemovingMember = removeWorkspaceMemberStatus === API_STATUS.LOADING;
  const isResettingPassword =
    resetMemberPasswordStatus === API_STATUS.LOADING;

  const isLoading = isLoadingWorkspaces || isLoadingMembers;
  const isMutating = isUpdatingStatus || isRemovingMember;
  const hasError = getWorkspaceMembersStatus === API_STATUS.ERROR;

  const fetchWorkspaces = useCallback(async () => {
    try {
      await getMyWorkspaces();
    } catch {
      // Error is already stored in workspace slice.
    }
  }, [getMyWorkspaces]);

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return;

    try {
      await getWorkspaceMembers(workspaceId);
    } catch {
      // Error is already stored in workspace slice.
    }
  }, [getWorkspaceMembers, workspaceId]);

  useEffect(() => {
    clearError();

    return () => {
      clearError();
    };
  }, [clearError]);

  useEffect(() => {
    if (workspaceId || hasFetchedWorkspacesRef.current) return;

    hasFetchedWorkspacesRef.current = true;
    fetchWorkspaces();
  }, [fetchWorkspaces, workspaceId]);

  useEffect(() => {
    if (!workspaceId || hasFetchedMembersRef.current) return;

    hasFetchedMembersRef.current = true;
    fetchMembers();
  }, [fetchMembers, workspaceId]);

  useEffect(() => {
    if (!workspaceId || hasFetchedCompaniesRef.current) return;
    hasFetchedCompaniesRef.current = true;
    getWorkspaceCompanies().catch(() => {});
  }, [getWorkspaceCompanies, workspaceId]);

  useEffect(() => {
    if (!workspaceId || hasFetchedBranchesRef.current) return;
    hasFetchedBranchesRef.current = true;
    getWorkspaceBranches().catch(() => {});
  }, [getWorkspaceBranches, workspaceId]);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => {
      clearMessage();
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [message, clearMessage]);

  const mappedMembers = useMemo(
    () => (Array.isArray(members) ? members : []).map(mapMemberForView),
    [members],
  );

  const filteredMembers = useMemo(() => {
    const search = normalizeText(filters.search);

    return mappedMembers.filter((member) => {
      const matchesSearch =
        !search ||
        normalizeText(member.displayName).includes(search) ||
        normalizeText(member.displayEmail).includes(search) ||
        normalizeText(member.displayPhone).includes(search) ||
        normalizeText(member.displayRole).includes(search);

      const matchesStatus =
        filters.status === "all" || member.status === filters.status;
      const matchesRole =
        filters.role === "all" || member.roleCode === filters.role;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [mappedMembers, filters]);

  // Derive Paginated Members
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMembers.slice(startIndex, startIndex + pageSize);
  }, [filteredMembers, currentPage, pageSize]);

  const stats = useMemo(() => {
    const total = mappedMembers.length;
    const active = mappedMembers.filter(
      (item) => item.status === "active",
    ).length;
    const inactive = mappedMembers.filter(
      (item) => item.status === "inactive",
    ).length;
    const suspended = mappedMembers.filter(
      (item) => item.status === "suspended",
    ).length;

    return [
      {
        id: "total",
        title: "Total",
        value: total,
        description: "Members in workspace",
        colorVariant: "primary",
      },
      {
        id: "active",
        title: "Active",
        value: active,
        description: "Full account access",
        colorVariant: "success",
      },
      {
        id: "inactive",
        title: "Inactive",
        value: inactive,
        description: "Pending verification",
        colorVariant: "warning",
      },
      {
        id: "suspended",
        title: "Suspended",
        value: suspended,
        description: "Access blocked",
        colorVariant: "error",
      },
    ];
  }, [mappedMembers]);

  const activeFilterChips = useMemo(() => {
    const chips = [];

    if (filters.search) {
      chips.push({
        key: "search",
        label: `Search: ${filters.search}`,
        value: filters.search,
      });
    }

    if (filters.status !== "all") {
      chips.push({
        key: "status",
        label:
          statusOptions.find((option) => option.value === filters.status)
            ?.label || filters.status,
        value: filters.status,
      });
    }

    if (filters.role !== "all") {
      chips.push({
        key: "role",
        label:
          roleOptions.find((option) => option.value === filters.role)?.label ||
          filters.role,
        value: filters.role,
      });
    }

    return chips;
  }, [filters]);

  const handleFilterChange = useCallback((eventOrValue) => {
    setCurrentPage(1);
    if (eventOrValue?.target) {
      const { name, value } = eventOrValue.target;

      setFilters((prev) => ({
        ...prev,
        [name]: value,
      }));

      return;
    }

    setFilters((prev) => ({
      ...prev,
      ...eventOrValue,
    }));
  }, []);

  const handleSearchChange = useCallback((event) => {
    setCurrentPage(1);
    const value = event?.target?.value ?? event;

    setFilters((prev) => ({
      ...prev,
      search: value,
    }));
  }, []);

  const handleRemoveFilter = useCallback((key) => {
    setCurrentPage(1);
    setFilters((prev) => ({
      ...prev,
      [key]: initialFilters[key],
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setCurrentPage(1);
    setFilters(initialFilters);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    hasFetchedMembersRef.current = false;
    fetchMembers();
  }, [fetchMembers]);

  const handleInviteMember = useCallback(() => {
    navigate(ROUTES.INVITE_WORKSPACE_MEMBER);
  }, [navigate]);

  const handleViewInvitations = useCallback(() => {
    navigate(ROUTES.WORKSPACE_INVITATIONS);
  }, [navigate]);

  const handleBackToWorkspace = useCallback(() => {
    navigate(ROUTES.WORKSPACE);
  }, [navigate]);

  // Export CSV handler
  const handleExportCSV = useCallback(() => {
    if (!filteredMembers.length) return;

    const headers = ["Name", "Email", "Phone", "Role", "Status", "Joined Date"];
    const rows = filteredMembers.map((m) => [
      `"${m.displayName.replace(/"/g, '""')}"`,
      `"${m.displayEmail.replace(/"/g, '""')}"`,
      `"${m.displayPhone.replace(/"/g, '""')}"`,
      `"${m.displayRole.replace(/"/g, '""')}"`,
      `"${m.status || "inactive"}"`,
      `"${m.displayJoinedAt || "-"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `workspace_members_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredMembers]);

  const openConfirm = useCallback((member, action) => {
    if (!member || member.isOwner) return;

    setSelectedMember(member);
    setMemberAction(action);
    setIsConfirmOpen(true);
  }, []);

  const closeConfirm = useCallback(() => {
    if (isMutating) return;

    setIsConfirmOpen(false);
    setSelectedMember(null);
    setMemberAction(null);
  }, [isMutating]);

  const handleChangeMemberStatus = useCallback(
    (member, status) => {
      openConfirm(member, status);
    },
    [openConfirm],
  );

  const handleRemoveMember = useCallback(
    (member) => {
      openConfirm(member, "remove");
    },
    [openConfirm],
  );

  const handleOpenResetPassword = useCallback((member) => {
    if (!member || member.isOwner) return;
    setResetPasswordMember(member);
    setIsResetPasswordOpen(true);
  }, []);

  const handleCloseResetPassword = useCallback(() => {
    if (isResettingPassword) return;
    setIsResetPasswordOpen(false);
    setResetPasswordMember(null);
  }, [isResettingPassword]);

  const handleConfirmResetPassword = useCallback(
    async (newPassword) => {
      if (!workspaceId || !resetPasswordMember) return;
      const memberUserId =
        resetPasswordMember.user?._id ||
        resetPasswordMember.userId?._id ||
        resetPasswordMember._id;

      await resetMemberPassword(workspaceId, memberUserId, newPassword);
    },
    [resetMemberPassword, resetPasswordMember, workspaceId],
  );

  const handleConfirmAction = useCallback(async () => {
    if (!workspaceId || !selectedMember || !memberAction) return;

    const memberUserId =
      selectedMember?.user?._id || selectedMember?.userId?._id;

    if (!memberUserId) return;

    try {
      if (memberAction === "remove") {
        await removeWorkspaceMember(workspaceId, memberUserId);
      } else {
        await updateWorkspaceMemberStatus(
          workspaceId,
          memberUserId,
          memberAction,
        );
      }

      closeConfirm();
    } catch {
      // Error is already stored in workspace slice.
    }
  }, [
    closeConfirm,
    memberAction,
    removeWorkspaceMember,
    selectedMember,
    updateWorkspaceMemberStatus,
    workspaceId,
  ]);

  const confirmConfig = useMemo(() => {
    if (!selectedMember || !memberAction) {
      return {
        title: "",
        description: "",
        confirmText: "",
        intent: "warning",
      };
    }

    if (memberAction === "remove") {
      return {
        title: "Remove Workspace Member",
        description: `Are you sure you want to remove ${selectedMember.displayName} from this workspace? They will immediately lose access to all store facilities and roles.`,
        confirmText: "Remove Member",
        intent: "danger",
      };
    }

    return {
      title: "Update Member Status",
      description: `Change ${selectedMember.displayName}'s status to ${memberAction}? This controls whether the member can log in and access the workspace.`,
      confirmText: "Update Status",
      intent: memberAction === "active" ? "success" : "warning",
    };
  }, [memberAction, selectedMember]);

  const handleManageAccess = useCallback(
    (member) => {
      const memberId = member?._id || member?.userId?._id || member?.user?._id;
      if (memberId) {
        navigate(ROUTES.WORKSPACE_MEMBER_DETAILS(memberId));
      }
    },
    [navigate],
  );

  const handleViewMemberDetails = useCallback(
    (member) => {
      const memberId = member?._id || member?.userId?._id || member?.user?._id;
      if (memberId) {
        navigate(ROUTES.WORKSPACE_MEMBER_DETAILS(memberId));
      }
    },
    [navigate],
  );

  const pageProps = {
    workspace: currentWorkspace,
    members: filteredMembers,
    paginatedMembers,
    stats,

    filters,
    activeFilterChips,
    statusOptions,
    roleOptions,
    viewMode,
    onViewModeChange: setViewMode,

    isLoading,
    isMutating,
    hasError,
    error,
    message,

    totalMembers: mappedMembers.length,
    filteredMembersCount: filteredMembers.length,
    hasMembers: mappedMembers.length > 0,
    hasFilteredMembers: filteredMembers.length > 0,
    hasCompanies,
    hasBranches,

    currentPage,
    pageSize,
    totalPages,

    handlePageChange,
    handlePageSizeChange,
    handleFilterChange,
    handleSearchChange,
    handleRemoveFilter,
    handleClearFilters,
    handleExportCSV,

    handleRefresh,
    handleInviteMember,
    handleViewInvitations,
    handleBackToWorkspace,
    handleViewMemberDetails,
    handleChangeMemberStatus,
    handleRemoveMember,
    handleManageAccess,
    handleOpenResetPassword,

    clearMessage,
  };

  return (
    <>
      {isMobile ? (
        <WorkspaceMembersMobilePage {...pageProps} />
      ) : (
        <WorkspaceMembersDesktopPage {...pageProps} />
      )}

      {/* Modern UIConfirmDialog Primitive */}
      <UIConfirmDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirm}
        onConfirm={handleConfirmAction}
        title={confirmConfig.title}
        description={confirmConfig.description}
        intent={confirmConfig.intent}
        confirmText={confirmConfig.confirmText}
        cancelText="Cancel"
        itemName={selectedMember?.displayName}
        itemDetails={`${selectedMember?.displayRole || "Member"} • ${selectedMember?.displayEmail || ""}`}
        isLoading={isMutating}
      />

      <ResetMemberPasswordModal
        open={isResetPasswordOpen}
        onClose={handleCloseResetPassword}
        onConfirm={handleConfirmResetPassword}
        member={resetPasswordMember}
        isLoading={isResettingPassword}
      />
    </>
  );
};

export default WorkspaceMembersPage;
