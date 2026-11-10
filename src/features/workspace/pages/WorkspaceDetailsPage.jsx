// src/features/workspace/pages/WorkspaceDetailsPage.jsx

import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS, ROUTES, TOKEN_KEY } from "@/constants";
import { storage } from "@/utils";
import { useIsMobile } from "@/hooks";

import useWorkspace from "../hooks/useWorkspace";

import WorkspaceDetailsDesktopPage from "./desktop/WorkspaceDetailsDesktopPage";
import WorkspaceDetailsMobilePage from "./mobile/WorkspaceDetailsMobilePage";

const WORKSPACE_TYPE_LABELS = {
  pharmacy: "Pharmacy",
  clinic: "Clinic",
  hospital: "Hospital",
  distributor: "Distributor",
  other: "Other",
};

const getWorkspaceFromItem = (item) => item?.workspace || item || null;

const getSelectedWorkspace = (currentWorkspace, workspaces = []) => {
  if (currentWorkspace?._id) return currentWorkspace;

  return getWorkspaceFromItem(workspaces[0]);
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

const mapWorkspaceForDetails = (workspace) => {
  if (!workspace) return null;

  return {
    ...workspace,
    displayType: formatWorkspaceType(workspace.type),
    displayAddress: formatAddress(workspace.address),
    displayCreatedAt: formatDate(workspace.createdAt),
    displayUpdatedAt: formatDate(workspace.updatedAt),
    displayCreatedAtTime: formatDateTime(workspace.createdAt),
    displayUpdatedAtTime: formatDateTime(workspace.updatedAt),
    displayDeletedAtTime: formatDateTime(workspace.deletedAt),
  };
};

const WorkspaceDetailsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const {
    workspaces,
    currentWorkspace,

    getMyWorkspacesStatus,
    getWorkspaceStatus,
    deleteWorkspaceStatus,

    error,

    getMyWorkspaces,
    getWorkspaceById,
    deleteWorkspace,

    setCurrentWorkspace,
    clearError,
    clearMessage,
  } = useWorkspace();

  const selectedWorkspace = useMemo(
    () => getSelectedWorkspace(currentWorkspace, workspaces),
    [currentWorkspace, workspaces],
  );

  const workspace = useMemo(
    () => mapWorkspaceForDetails(selectedWorkspace),
    [selectedWorkspace],
  );

  const isFetchingWorkspaces = getMyWorkspacesStatus === API_STATUS.LOADING;
  const isFetchingWorkspace = getWorkspaceStatus === API_STATUS.LOADING;
  const isDeleting = deleteWorkspaceStatus === API_STATUS.LOADING;

  const isLoading = isFetchingWorkspaces || isFetchingWorkspace;
  const hasError =
    getMyWorkspacesStatus === API_STATUS.ERROR ||
    getWorkspaceStatus === API_STATUS.ERROR;

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

  useEffect(() => {
    if (selectedWorkspace?._id && !currentWorkspace?._id) {
      setCurrentWorkspace(selectedWorkspace);
    }
  }, [currentWorkspace?._id, selectedWorkspace, setCurrentWorkspace]);

  useEffect(() => {
    if (currentWorkspace?._id) {
      getWorkspaceById(currentWorkspace._id).catch(() => {});
    }
  }, [currentWorkspace?._id, getWorkspaceById]);

  const handleBack = useCallback(() => {
    navigate(ROUTES.WORKSPACE);
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    if (workspace?._id) {
      getWorkspaceById(workspace._id).catch(() => {});
      return;
    }

    getMyWorkspaces().catch(() => {});
  }, [getMyWorkspaces, getWorkspaceById, workspace?._id]);

  const handleEditWorkspace = useCallback(() => {
    if (!workspace?._id) return;

    setCurrentWorkspace(workspace);
    navigate(ROUTES.EDIT_WORKSPACE);
  }, [navigate, setCurrentWorkspace, workspace]);

  const handleManageMembers = useCallback(() => {
    if (!workspace?._id) return;

    setCurrentWorkspace(workspace);
    navigate(ROUTES.WORKSPACE_MEMBERS);
  }, [navigate, setCurrentWorkspace, workspace]);

  const handleManageInvitations = useCallback(() => {
    if (!workspace?._id) return;

    setCurrentWorkspace(workspace);
    navigate(ROUTES.WORKSPACE_INVITATIONS);
  }, [navigate, setCurrentWorkspace, workspace]);

  const handleInviteMember = useCallback(() => {
    if (!workspace?._id) return;

    setCurrentWorkspace(workspace);
    navigate(ROUTES.INVITE_WORKSPACE_MEMBER);
  }, [navigate, setCurrentWorkspace, workspace]);

  const handleDeleteWorkspace = useCallback(async () => {
    if (!workspace?._id || isDeleting) return;

    await deleteWorkspace(workspace._id);
    navigate(ROUTES.WORKSPACE, { replace: true });
  }, [deleteWorkspace, isDeleting, navigate, workspace?._id]);

  const pageProps = {
    workspace,

    isLoading,
    isDeleting,
    hasError,
    error,

    handleBack,
    handleRefresh,
    handleEditWorkspace,
    handleManageMembers,
    handleManageInvitations,
    handleInviteMember,
    handleDeleteWorkspace,
  };

  return isMobile ? (
    <WorkspaceDetailsMobilePage {...pageProps} />
  ) : (
    <WorkspaceDetailsDesktopPage {...pageProps} />
  );
};

export default WorkspaceDetailsPage;
