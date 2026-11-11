// src/features/access-control/pages/RoleDetailsPage.jsx

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile } from "@/hooks";
import {
  isWorkAccessPermissionKey,
  resolveRoleWorkAccess,
} from "@/utils/workAccess";

import useAccessControl from "../hooks/useAccessControl";
import { isRoleEditableByPolicy } from "../utils/roleForm.helper";

import RoleDetailsDesktopPage from "./desktop/RoleDetailsDesktopPage";
import RoleDetailsMobilePage from "./mobile/RoleDetailsMobilePage";

const formatDate = (value) => {
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

const formatUser = (user) => {
  if (!user) return "-";
  if (typeof user === "string") return user;

  return (
    user.fullName ||
    user.name ||
    user.email ||
    user.profile?.fullName ||
    user._id ||
    "-"
  );
};

const normalizeRoleResponse = (response) => {
  if (!response) return null;
  if (response?._id) return response;
  if (response?.data?._id) return response.data;
  if (response?.data?.data?._id) return response.data.data;

  return null;
};

const toTitle = (value) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const mapRoleForView = (role, availablePermissions = []) => {
  if (!role?._id) return null;

  const permissions = Array.isArray(role.permissions) ? role.permissions : [];
  const modulePermissions = permissions.filter(
    (perm) => !isWorkAccessPermissionKey(perm),
  );
  const workAccess = resolveRoleWorkAccess(role);
  const status = String(role.status || "active").toLowerCase();
  const isSystem = Boolean(role.isSystem);
  const isOwnerRole = String(role.code || "").trim().toLowerCase() === "owner";
  const isEditable = isRoleEditableByPolicy(role);

  const totalPermissionCount = Array.isArray(availablePermissions)
    ? availablePermissions.filter((perm) => !isWorkAccessPermissionKey(perm))
        .length
    : 0;

  return {
    ...role,

    _id: role._id,
    workspaceId: role.workspaceId || "-",

    name: role.name || toTitle(role.code) || "Role",
    code: role.code || "-",
    description: role.description || "No description added.",

    permissions: modulePermissions,
    rawPermissions: permissions,
    permissionCount: modulePermissions.length,
    totalPermissionCount,
    workAccess,

    isSystem,
    isOwnerRole,
    isEditable,
    status,

    createdBy: role.createdBy || null,
    createdByText: formatUser(role.createdBy),

    createdAt: role.createdAt || null,
    updatedAt: role.updatedAt || null,
    deletedAt: role.deletedAt || null,
    deletedBy: role.deletedBy || null,

    createdAtText: formatDate(role.createdAt),
    updatedAtText: formatDate(role.updatedAt),
    deletedAtText: formatDate(role.deletedAt),
    deletedByText: formatUser(role.deletedBy),

    displayName: role.name || toTitle(role.code) || "Role",
    displayCode: role.code || "-",
    displayDescription: role.description || "No description added.",
    displayStatus: status,
    displayType: isSystem ? "System Role" : "Custom Role",
    displayEditable: isEditable ? "Editable" : "Locked",
    displayCreatedBy: formatUser(role.createdBy),
    displayCreatedAt: formatDate(role.createdAt),
    displayUpdatedAt: formatDate(role.updatedAt),
    displayDeletedAt: formatDate(role.deletedAt),
    displayDeletedBy: formatUser(role.deletedBy),

    membersCount:
      role.membersCount || role.memberCount || role.members?.length || 0,

    members: Array.isArray(role.members) ? role.members : [],

    recentActivity: Array.isArray(role.recentActivity)
      ? role.recentActivity
      : Array.isArray(role.activities)
        ? role.activities
        : [],

    canEdit: isEditable,
    canDelete: !isSystem,
  };
};

const RoleDetailsPage = () => {
  const navigate = useNavigate();
  const { roleId } = useParams();
  const isMobile = useIsMobile();

  const {
    currentRole,
    permissions,

    getRoleById,
    getAvailablePermissions,

    getRoleStatus,
    getAvailablePermissionsStatus,

    error,
    message,

    clearError,
    clearMessage,
    clearCurrentRole,
  } = useAccessControl();

  const hasFetchedRoleRef = useRef(false);
  const hasFetchedPermissionsRef = useRef(false);

  const isLoading =
    getRoleStatus === API_STATUS.LOADING ||
    getAvailablePermissionsStatus === API_STATUS.LOADING;

  const hasError = getRoleStatus === API_STATUS.ERROR;

  const role = useMemo(() => {
    const normalizedRole = normalizeRoleResponse(currentRole);

    return mapRoleForView(normalizedRole, permissions);
  }, [currentRole, permissions]);

  const hasRole = Boolean(role?._id);

  useEffect(() => {
    clearError();
    clearCurrentRole();

    return () => {
      clearError();
      clearCurrentRole();
    };

    // Keep this mount-only to avoid clearing currentRole repeatedly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!roleId || hasFetchedRoleRef.current) return;

    hasFetchedRoleRef.current = true;

    getRoleById(roleId).catch(() => {
      // Error is stored in access-control slice.
    });

    // getRoleById is recreated by the custom hook, so do not depend on it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId]);

  useEffect(() => {
    if (hasFetchedPermissionsRef.current) return;

    hasFetchedPermissionsRef.current = true;

    getAvailablePermissions().catch(() => {
      // Error is stored in access-control slice.
    });

    // getAvailablePermissions is recreated by the custom hook, so do not depend on it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!message) return undefined;

    const timer = window.setTimeout(() => {
      clearMessage();
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [clearMessage, message]);

  const handleRefresh = useCallback(() => {
    if (!roleId) return;

    hasFetchedRoleRef.current = true;

    getRoleById(roleId).catch(() => {
      // Error is stored in access-control slice.
    });
  }, [getRoleById, roleId]);

  const handleBackToRoles = useCallback(() => {
    navigate(ROUTES.ROLES);
  }, [navigate]);

  const handleBackToAccessControl = useCallback(() => {
    navigate(ROUTES.ROLES);
  }, [navigate]);

  const handleEditRole = useCallback(() => {
    if (!role?._id || !role?.canEdit) return;

    navigate(ROUTES.EDIT_ROLE.replace(":roleId", role._id));
  }, [navigate, role]);

  const handleViewPermissions = useCallback(() => {
    navigate(ROUTES.PERMISSIONS);
  }, [navigate]);

  const pageProps = {
    role,
    roleId,

    isLoading,
    hasError,
    hasRole,
    error,
    message,

    handleRefresh,
    handleBackToRoles,
    handleBackToAccessControl,
    handleEditRole,
    handleViewPermissions,

    clearMessage,
  };

  return isMobile ? (
    <RoleDetailsMobilePage {...pageProps} />
  ) : (
    <RoleDetailsDesktopPage {...pageProps} />
  );
};

export default RoleDetailsPage;
