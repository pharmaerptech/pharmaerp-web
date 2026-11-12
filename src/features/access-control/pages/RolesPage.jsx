import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile } from "@/hooks";
import { UIConfirmDialog, UI_TOOLBAR_VIEWS } from "@/components/ui";
import {
  WORK_LEVELS,
  WORK_MODES,
  isWorkAccessPermissionKey,
  resolveRoleWorkAccess,
} from "@/utils/workAccess";

import useAccessControl from "../hooks/useAccessControl";
import { isRoleEditableByPolicy } from "../utils/roleForm.helper";

import RolesDesktopPage from "./desktop/RolesDesktopPage";
import RolesMobilePage from "./mobile/RolesMobilePage";

const statusOptions = [
  { label: "Status: All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const typeOptions = [
  { label: "Type: All", value: "all" },
  { label: "System", value: "system" },
  { label: "Custom", value: "custom" },
];

const workModeOptions = [
  { label: "Work Mode: All", value: "all" },
  { label: "View Mode", value: WORK_MODES.VIEW },
  { label: "Operation Mode", value: WORK_MODES.OPERATION },
];

const workLevelOptions = [
  { label: "Work Level: All", value: "all" },
  { label: "Workspace Level", value: WORK_LEVELS.WORKSPACE },
  { label: "Company Level", value: WORK_LEVELS.COMPANY },
  { label: "Branch Level", value: WORK_LEVELS.BRANCH },
];

const initialFilters = {
  search: "",
  status: "all",
  type: "all",
  workMode: "all",
  workLevel: "all",
};

const dummyRoles = [
  {
    _id: "dummy-pharmacist",
    name: "Pharmacist",
    code: "pharmacist",
    description: "Full access to pharmacy operations and inventory",
    subtitle: "Manage medicines, prescriptions and inventory",
    status: "active",
    isSystem: true,
    isEditable: true,
    workModes: [WORK_MODES.VIEW, WORK_MODES.OPERATION],
    workLevel: WORK_LEVELS.BRANCH,
    membersCount: 4,
    permissions: ["inventory:view", "sale:create", "purchase:view"],
  },
  {
    _id: "dummy-manager",
    name: "Manager",
    code: "manager",
    description: "Access to reports, billing, users and settings",
    subtitle: "Manage overall operations and reports",
    status: "active",
    isSystem: true,
    isEditable: true,
    workModes: [WORK_MODES.VIEW, WORK_MODES.OPERATION],
    workLevel: WORK_LEVELS.COMPANY,
    membersCount: 2,
    permissions: ["report:view", "bill:create", "workspace-member:view"],
  },
  {
    _id: "dummy-cashier",
    name: "Cashier",
    code: "cashier",
    description: "Process sales, returns and payments",
    subtitle: "Handle sales and billing",
    status: "active",
    isSystem: true,
    isEditable: true,
    workModes: [WORK_MODES.OPERATION],
    workLevel: WORK_LEVELS.BRANCH,
    membersCount: 5,
    permissions: ["sale:create", "sales-return:create", "pos:create"],
  },
  {
    _id: "dummy-staff",
    name: "Staff",
    code: "staff",
    description: "View-only access to assigned branch operations",
    subtitle: "Read-only branch visibility",
    status: "active",
    isSystem: true,
    isEditable: true,
    workModes: [WORK_MODES.VIEW],
    workLevel: WORK_LEVELS.BRANCH,
    membersCount: 3,
    permissions: ["product:view", "inventory:view", "sale:view"],
  },
];

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const formatRoleName = (value) => {
  if (!value) return "-";

  return String(value)
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const getUserName = (user) =>
  user?.fullName || user?.name || user?.profile?.fullName || user?.email || "-";

const getMembersCount = (role) => {
  if (typeof role?.membersCount === "number") return role.membersCount;
  if (typeof role?.memberCount === "number") return role.memberCount;
  if (Array.isArray(role?.members)) return role.members.length;
  if (Array.isArray(role?.users)) return role.users.length;
  return 0;
};

const mapRoleForView = (role) => {
  const permissions = Array.isArray(role?.permissions) ? role.permissions : [];
  const modulePermissions = permissions.filter(
    (p) => !isWorkAccessPermissionKey(p),
  );
  const workAccess = resolveRoleWorkAccess(role);
  const createdBy = role?.createdBy || null;
  const isEditable = isRoleEditableByPolicy(role);

  return {
    ...role,
    permissions,
    modulePermissions,
    workAccess,
    createdBy,
    displayName: role?.name || formatRoleName(role?.code) || "Role",
    displayCode: role?.code || "-",
    displayDescription: role?.description || "No description added.",
    displaySubtitle:
      role?.subtitle ||
      role?.shortDescription ||
      role?.description ||
      "Role access and permission management",
    displayStatus: role?.status || "inactive",
    displayType: role?.isSystem ? "System" : "Custom",
    displayEditable: isEditable ? "Editable" : "Locked",
    displayCreatedBy: getUserName(createdBy),
    membersCount: getMembersCount(role),
    permissionCount: modulePermissions.length,
    canEdit: isEditable,
    canDelete: !role?.isSystem,
  };
};

const RolesPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const {
    roles,
    getWorkspaceRoles,
    getAvailablePermissions,
    deleteRole,

    getWorkspaceRolesStatus,
    deleteRoleStatus,

    error,
    message,

    clearError,
    clearMessage,
    clearCurrentRole,
  } = useAccessControl();

  const hasFetchedRolesRef = useRef(false);

  const [filters, setFilters] = useState(initialFilters);
  const [viewMode, setViewMode] = useState(UI_TOOLBAR_VIEWS.GRID);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isLoadingRoles = getWorkspaceRolesStatus === API_STATUS.LOADING;
  const isDeletingRole = deleteRoleStatus === API_STATUS.LOADING;
  const isLoading = isLoadingRoles;
  const hasError = getWorkspaceRolesStatus === API_STATUS.ERROR;

  const fetchRoles = useCallback(async () => {
    try {
      await Promise.all([
        getWorkspaceRoles(),
        getAvailablePermissions && getAvailablePermissions(),
      ]);
    } catch {
      // Error stored in slice.
    }
  }, [getWorkspaceRoles, getAvailablePermissions]);

  useEffect(() => {
    clearError();
    clearCurrentRole();

    return () => {
      clearError();
    };
  }, [clearCurrentRole, clearError]);

  useEffect(() => {
    if (hasFetchedRolesRef.current) return;

    hasFetchedRolesRef.current = true;
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (!message) return undefined;

    const timer = window.setTimeout(() => {
      clearMessage();
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [clearMessage, message]);

  const mappedRoles = useMemo(() => {
    const sourceRoles =
      Array.isArray(roles) && roles.length ? roles : dummyRoles;
    const mapped = sourceRoles.map(mapRoleForView);

    // Sort by highest member count first (descending)
    return mapped.sort((a, b) => {
      const countA = a.membersCount ?? 0;
      const countB = b.membersCount ?? 0;
      if (countB !== countA) return countB - countA;
      if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
      return String(a.displayName).localeCompare(String(b.displayName));
    });
  }, [roles]);

  const filteredRoles = useMemo(() => {
    const search = normalizeText(filters.search);

    return mappedRoles.filter((role) => {
      const matchesSearch =
        !search ||
        normalizeText(role.displayName).includes(search) ||
        normalizeText(role.displayCode).includes(search) ||
        normalizeText(role.displayDescription).includes(search) ||
        normalizeText(role.displaySubtitle).includes(search) ||
        normalizeText(role.displayStatus).includes(search) ||
        normalizeText(role.displayType).includes(search) ||
        normalizeText(role.workAccess?.highestWorkLevel).includes(search) ||
        (role.workAccess?.allowedWorkModes || []).some((m) =>
          normalizeText(m).includes(search),
        ) ||
        role.permissions.some((permission) =>
          normalizeText(permission).includes(search),
        );

      const matchesStatus =
        filters.status === "all" || role.displayStatus === filters.status;

      const matchesType =
        filters.type === "all" ||
        (filters.type === "system" && role.isSystem) ||
        (filters.type === "custom" && !role.isSystem);

      const matchesWorkMode =
        filters.workMode === "all" ||
        (role.workAccess?.allowedWorkModes || []).includes(filters.workMode);

      const matchesWorkLevel =
        filters.workLevel === "all" ||
        role.workAccess?.highestWorkLevel === filters.workLevel;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesWorkMode &&
        matchesWorkLevel
      );
    });
  }, [filters, mappedRoles]);

  const stats = useMemo(() => {
    const total = mappedRoles.length;
    const system = mappedRoles.filter((role) => role.isSystem).length;
    const custom = mappedRoles.filter((role) => !role.isSystem).length;
    const inactive = mappedRoles.filter(
      (role) => role.displayStatus !== "active",
    ).length;

    return [
      {
        id: "total",
        label: "Total",
        value: total,
        intent: "primary",
      },
      {
        id: "system",
        label: "System",
        value: system,
        intent: "success",
      },
      {
        id: "custom",
        label: "Custom",
        value: custom,
        intent: "default",
      },
      {
        id: "inactive",
        label: "Inactive",
        value: inactive,
        intent: "warning",
      },
    ];
  }, [mappedRoles]);

  const activeFilterChips = useMemo(() => {
    const chips = [];

    if (filters.search) {
      chips.push({ key: "search", label: `Search: ${filters.search}` });
    }

    if (filters.status !== "all") {
      chips.push({
        key: "status",
        label:
          statusOptions.find((option) => option.value === filters.status)
            ?.label || filters.status,
      });
    }

    if (filters.type !== "all") {
      chips.push({
        key: "type",
        label:
          typeOptions.find((option) => option.value === filters.type)?.label ||
          filters.type,
      });
    }

    if (filters.workMode !== "all") {
      chips.push({
        key: "workMode",
        label:
          workModeOptions.find((option) => option.value === filters.workMode)
            ?.label || filters.workMode,
      });
    }

    if (filters.workLevel !== "all") {
      chips.push({
        key: "workLevel",
        label:
          workLevelOptions.find((option) => option.value === filters.workLevel)
            ?.label || filters.workLevel,
      });
    }

    return chips;
  }, [filters]);

  const roleHelp = useMemo(
    () => ({
      aboutPoints: [
        "Create custom roles for your team",
        "Configure explicit Work Modes (View / Operation) & Work Level tiers",
        "Add members and assign roles",
        "Manage access across workspace, company & branch",
      ],
      systemDescription:
        "Default roles created by the system. Non-Owner default roles can be tuned while deletion remains protected.",
      customDescription:
        "Custom roles created for your workspace. You can edit, update or delete these roles as per your requirements.",
    }),
    [],
  );

  const handleFilterChange = useCallback((eventOrValue) => {
    if (eventOrValue?.target) {
      const { name, value } = eventOrValue.target;

      setFilters((prev) => ({ ...prev, [name]: value }));
      return;
    }

    setFilters((prev) => ({ ...prev, ...eventOrValue }));
  }, []);

  const handleSearchChange = useCallback((event) => {
    const value = event?.target?.value ?? event;

    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  const handleRemoveFilter = useCallback((key) => {
    setFilters((prev) => ({ ...prev, [key]: initialFilters[key] }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const handleRefresh = useCallback(() => {
    hasFetchedRolesRef.current = false;
    fetchRoles();
  }, [fetchRoles]);

  const handleBackToAccessControl = useCallback(() => {
    navigate(ROUTES.ROLES);
  }, [navigate]);

  const handleCreateRole = useCallback(() => {
    navigate(ROUTES.CREATE_ROLE);
  }, [navigate]);

  const handleViewPermissions = useCallback(() => {
    navigate(ROUTES.PERMISSIONS);
  }, [navigate]);

  const handleExportRoles = useCallback(() => {
    // Wire this to your export API when available.
  }, []);

  const handleViewRole = useCallback(
    (role) => {
      if (!role?._id || String(role._id).startsWith("dummy-")) return;
      navigate(ROUTES.ROLE_DETAILS.replace(":roleId", role._id));
    },
    [navigate],
  );

  const handleEditRole = useCallback(
    (role) => {
      if (
        !role?._id ||
        !role?.canEdit ||
        String(role._id).startsWith("dummy-")
      ) {
        return;
      }

      navigate(ROUTES.EDIT_ROLE.replace(":roleId", role._id));
    },
    [navigate],
  );

  const handleDeleteRole = useCallback((role) => {
    if (
      !role?._id ||
      !role?.canDelete ||
      String(role._id).startsWith("dummy-")
    ) {
      return;
    }

    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    if (isDeletingRole) return;

    setIsDeleteModalOpen(false);
    setSelectedRole(null);
  }, [isDeletingRole]);

  const handleConfirmDeleteRole = useCallback(async () => {
    if (!selectedRole?._id) return;

    try {
      await deleteRole(selectedRole._id);
      closeDeleteModal();
      fetchRoles();
    } catch {
      // Error is already stored in access control slice.
    }
  }, [closeDeleteModal, deleteRole, selectedRole, fetchRoles]);

  const pageProps = {
    roles: filteredRoles,
    stats,
    roleHelp,

    filters,
    activeFilterChips,
    statusOptions,
    typeOptions,
    workModeOptions,
    workLevelOptions,

    viewMode,
    onViewModeChange: setViewMode,

    isLoading,
    hasError,
    error,
    message,

    totalRoles: mappedRoles.length,
    filteredRolesCount: filteredRoles.length,
    hasRoles: mappedRoles.length > 0,
    hasFilteredRoles: filteredRoles.length > 0,

    handleFilterChange,
    handleSearchChange,
    handleRemoveFilter,
    handleClearFilters,

    handleRefresh,
    handleBackToAccessControl,
    handleCreateRole,
    handleViewPermissions,
    handleExportRoles,
    handleViewRole,
    handleEditRole,
    handleDeleteRole,

    clearMessage,
  };

  return (
    <>
      {isMobile ? (
        <RolesMobilePage {...pageProps} />
      ) : (
        <RolesDesktopPage {...pageProps} />
      )}

      <UIConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDeleteRole}
        title="Delete Role"
        description={`Are you sure you want to delete "${selectedRole?.displayName || "this role"}"? Workspace members currently assigned to this role will lose associated permissions.`}
        intent="danger"
        confirmText="Delete Role"
        cancelText="Keep Role"
        itemName={selectedRole?.displayName}
        itemDetails={`${selectedRole?.displayType || "Custom"} Role • ${selectedRole?.permissionCount || 0} Permissions`}
        isLoading={isDeletingRole}
      />
    </>
  );
};

export default RolesPage;
