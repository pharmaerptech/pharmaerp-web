// src/features/workspace/pages/WorkspacePage.jsx

import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS, ROUTES, TOKEN_KEY } from "@/constants";
import { storage } from "@/utils";
import { useIsMobile } from "@/hooks";

import useWorkspace from "../hooks/useWorkspace";

import WorkspaceDesktopPage from "./desktop/WorkspaceDesktopPage";
import WorkspaceMobilePage from "./mobile/WorkspaceMobilePage";

const getWorkspaceFromItem = (item) => item?.workspace || item || null;

const WORKSPACE_TYPE_LABELS = {
  pharmacy: "Pharmacy",
  clinic: "Clinic",
  hospital: "Hospital",
  distributor: "Distributor",
  other: "Other",
};

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

const formatWorkspaceType = (type) => {
  if (!type) return "-";

  return WORKSPACE_TYPE_LABELS[type] || String(type).replaceAll("_", " ");
};

const formatAddress = (address) => {
  if (!address) return "-";

  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.pincode,
    address.country,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "-";
};

const mapWorkspaceForDisplay = (item) => {
  const workspace = getWorkspaceFromItem(item);
  const member = item?.member || null;

  if (!workspace) return null;

  return {
    ...workspace,
    member,
    id: workspace._id,
    displayType: formatWorkspaceType(workspace.type),
    displayAddress: formatAddress(workspace.address),
    displayCreatedAt: formatDate(workspace.createdAt),
    displayUpdatedAt: formatDate(workspace.updatedAt),
    memberStatus: member?.status || "-",
    roleName: member?.roleId?.name || member?.roleId?.title || "-",
    isOwner: Boolean(member?.isOwner),
  };
};

const WorkspacePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const {
    workspaces,
    currentWorkspace,

    getMyWorkspacesStatus,
    deleteWorkspaceStatus,

    error,

    getMyWorkspaces,
    setCurrentWorkspace,
    deleteWorkspace,

    clearError,
    clearMessage,
  } = useWorkspace();

  const isLoading = getMyWorkspacesStatus === API_STATUS.LOADING;
  const isDeleting = deleteWorkspaceStatus === API_STATUS.LOADING;
  const hasError = getMyWorkspacesStatus === API_STATUS.ERROR;

  useEffect(() => {
    clearError();
    clearMessage();

    return () => {
      clearError();
      clearMessage();
    };
  }, [clearError, clearMessage]);

  useEffect(() => {
    if (
      getMyWorkspacesStatus === API_STATUS.IDLE &&
      Boolean(storage.get(TOKEN_KEY))
    ) {
      getMyWorkspaces().catch(() => {});
    }
  }, [getMyWorkspaces, getMyWorkspacesStatus]);

  const workspaceRows = useMemo(
    () => (workspaces || []).map(mapWorkspaceForDisplay).filter(Boolean),
    [workspaces],
  );

  const selectedWorkspace = useMemo(() => {
    if (currentWorkspace?._id) {
      return (
        workspaceRows.find(
          (workspace) => workspace._id === currentWorkspace._id,
        ) || mapWorkspaceForDisplay(currentWorkspace)
      );
    }

    return workspaceRows[0] || null;
  }, [currentWorkspace, workspaceRows]);

  const stats = useMemo(() => {
    const activeCount = workspaceRows.filter(
      (workspace) => workspace.status === "active",
    ).length;

    const ownerCount = workspaceRows.filter(
      (workspace) => workspace.isOwner,
    ).length;

    const memberCount = workspaceRows.length - ownerCount;

    return [
      {
        id: "total",
        title: "Total Workspaces",
        value: workspaceRows.length,
        description: "Workspaces linked to your account",
        colorVariant: "primary",
      },
      {
        id: "active",
        title: "Active",
        value: activeCount,
        description: "Currently available workspaces",
        colorVariant: "success",
      },
      {
        id: "owner",
        title: "Owned",
        value: ownerCount,
        description: "Workspaces where you are owner",
        colorVariant: "info",
      },
      {
        id: "member",
        title: "Member",
        value: memberCount,
        description: "Workspaces joined as team member",
        colorVariant: "warning",
      },
    ];
  }, [workspaceRows]);

  const handleRefresh = useCallback(() => {
    getMyWorkspaces().catch(() => {});
  }, [getMyWorkspaces]);

  const handleCreateWorkspace = useCallback(() => {
    navigate(ROUTES.CREATE_WORKSPACE);
  }, [navigate]);

  const handleEditWorkspace = useCallback(
    (workspace = selectedWorkspace) => {
      if (!workspace?._id) return;

      setCurrentWorkspace(workspace);
      navigate(ROUTES.EDIT_WORKSPACE);
    },
    [navigate, selectedWorkspace, setCurrentWorkspace],
  );

  const handleViewWorkspace = useCallback(
    (workspace = selectedWorkspace) => {
      if (!workspace?._id) return;

      setCurrentWorkspace(workspace);
      navigate(ROUTES.WORKSPACE_DETAILS);
    },
    [navigate, selectedWorkspace, setCurrentWorkspace],
  );

  const handleManageMembers = useCallback(
    (workspace = selectedWorkspace) => {
      if (!workspace?._id) return;

      setCurrentWorkspace(workspace);
      navigate(ROUTES.WORKSPACE_MEMBERS);
    },
    [navigate, selectedWorkspace, setCurrentWorkspace],
  );

  const handleManageInvitations = useCallback(
    (workspace = selectedWorkspace) => {
      if (!workspace?._id) return;

      setCurrentWorkspace(workspace);
      navigate(ROUTES.WORKSPACE_INVITATIONS);
    },
    [navigate, selectedWorkspace, setCurrentWorkspace],
  );

  const handleInviteMember = useCallback(
    (workspace = selectedWorkspace) => {
      if (!workspace?._id) return;

      setCurrentWorkspace(workspace);
      navigate(ROUTES.INVITE_WORKSPACE_MEMBER);
    },
    [navigate, selectedWorkspace, setCurrentWorkspace],
  );

  const handleSelectWorkspace = useCallback(
    (workspace) => {
      if (!workspace?._id) return;

      setCurrentWorkspace(workspace);
    },
    [setCurrentWorkspace],
  );

  const handleDeleteWorkspace = useCallback(
    async (workspace = selectedWorkspace) => {
      if (!workspace?._id || isDeleting) return;

      await deleteWorkspace(workspace._id);
      await getMyWorkspaces().catch(() => {});
    },
    [deleteWorkspace, getMyWorkspaces, isDeleting, selectedWorkspace],
  );

  const pageProps = {
    workspaces: workspaceRows,
    currentWorkspace: selectedWorkspace,
    stats,

    isLoading,
    isDeleting,
    hasError,
    error,

    handleRefresh,
    handleCreateWorkspace,
    handleEditWorkspace,
    handleViewWorkspace,
    handleManageMembers,
    handleManageInvitations,
    handleInviteMember,
    handleSelectWorkspace,
    handleDeleteWorkspace,
  };

  return isMobile ? (
    <WorkspaceMobilePage {...pageProps} />
  ) : (
    <WorkspaceDesktopPage {...pageProps} />
  );
};

export default WorkspacePage;
