// src/features/access-control/pages/PermissionPage.jsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile } from "@/hooks";
import { parsePermissionKey } from "@/utils/workAccess";

import useAccessControl from "../hooks/useAccessControl";
import { formatTitle, getActionTypeFromKey } from "../utils/roleForm.helper";

import PermissionDesktopPage from "./desktop/PermissionDesktopPage";
import PermissionMobilePage from "./mobile/PermissionMobilePage";

const moduleOptionsBase = [{ label: "All Modules", value: "all" }];

const initialFilters = {
  search: "",
  module: "all",
};

const PRIORITY_MODULE_DESCRIPTIONS = {
  "work-mode":
    "Strict explicit Work Mode access (View Mode & Operation Mode — no hierarchy)",
  "work-level":
    "Hierarchical Work Level clearance (Workspace > Company > Branch)",
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const mapPermissionForView = (permission, index) => {
  const { module: moduleKey, action: actionKey } = parsePermissionKey(permission);
  const actionType = getActionTypeFromKey(actionKey);

  return {
    id: `${permission}-${index}`,
    value: permission,
    moduleKey,
    actionKey,
    actionType,
    isAccessPolicy: moduleKey === "work-mode" || moduleKey === "work-level",
    displayModule: formatTitle(moduleKey) || "General",
    displayAction: formatTitle(actionKey) || permission,
    displayPermission: formatTitle(permission) || permission,
  };
};

const buildPermissionGroups = (permissions) => {
  const groupMap = new Map();

  permissions.forEach((permission) => {
    if (!groupMap.has(permission.moduleKey)) {
      groupMap.set(permission.moduleKey, {
        id: permission.moduleKey,
        moduleKey: permission.moduleKey,
        displayModule: permission.displayModule,
        isAccessPolicy:
          permission.moduleKey === "work-mode" ||
          permission.moduleKey === "work-level",
        description:
          PRIORITY_MODULE_DESCRIPTIONS[permission.moduleKey] ||
          `Operational clearance for ${permission.displayModule} services`,
        permissions: [],
        items: [],
        totalPermissions: 0,
      });
    }

    const group = groupMap.get(permission.moduleKey);
    group.permissions.push(permission.value);
    group.items.push(permission);
    group.totalPermissions += 1;
  });

  const priorityOrder = { "work-mode": 0, "work-level": 1 };

  return Array.from(groupMap.values()).sort((a, b) => {
    const prioA = priorityOrder[a.moduleKey] ?? 99;
    const prioB = priorityOrder[b.moduleKey] ?? 99;
    if (prioA !== prioB) return prioA - prioB;
    return a.displayModule.localeCompare(b.displayModule);
  });
};

const PermissionPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const {
    permissions,
    getAvailablePermissions,
    getAvailablePermissionsStatus,
    error,
    message,
    clearError,
    clearMessage,
  } = useAccessControl();

  const hasFetchedPermissionsRef = useRef(false);
  const [filters, setFilters] = useState(initialFilters);

  const isLoading = getAvailablePermissionsStatus === API_STATUS.LOADING;
  const hasError = getAvailablePermissionsStatus === API_STATUS.ERROR;

  const fetchPermissions = useCallback(async () => {
    try {
      await getAvailablePermissions();
    } catch {
      // Error is stored in slice
    }
  }, [getAvailablePermissions]);

  useEffect(() => {
    clearError();
    return () => {
      clearError();
    };
  }, [clearError]);

  useEffect(() => {
    if (hasFetchedPermissionsRef.current) return;
    hasFetchedPermissionsRef.current = true;
    fetchPermissions();
  }, [fetchPermissions]);

  const rawPermissions = useMemo(() => {
    return Array.isArray(permissions) ? permissions : [];
  }, [permissions]);

  const mappedPermissions = useMemo(() => {
    return rawPermissions.map(mapPermissionForView);
  }, [rawPermissions]);

  const permissionModules = useMemo(() => {
    return buildPermissionGroups(mappedPermissions);
  }, [mappedPermissions]);

  const moduleOptions = useMemo(() => {
    const modules = permissionModules.map((m) => ({
      label: m.displayModule,
      value: m.moduleKey,
    }));
    return [...moduleOptionsBase, ...modules];
  }, [permissionModules]);

  const filteredPermissionModules = useMemo(() => {
    const search = normalizeText(filters.search);

    return permissionModules
      .map((module) => {
        const matchesModule =
          filters.module === "all" || module.moduleKey === filters.module;

        if (!matchesModule) return null;

        if (!search) return module;

        const moduleMatches =
          normalizeText(module.displayModule).includes(search) ||
          normalizeText(module.moduleKey).includes(search);

        const filteredItems = module.items.filter(
          (p) =>
            normalizeText(p.value).includes(search) ||
            normalizeText(p.displayAction).includes(search),
        );

        if (moduleMatches) {
          return module;
        }

        if (filteredItems.length > 0) {
          return {
            ...module,
            items: filteredItems,
            permissions: filteredItems.map((i) => i.value),
            totalPermissions: filteredItems.length,
          };
        }

        return null;
      })
      .filter(Boolean);
  }, [filters, permissionModules]);

  const stats = useMemo(() => {
    const totalModules = permissionModules.length;
    const totalPermissions = rawPermissions.length;

    let viewCount = 0;
    let createCount = 0;
    let manageCount = 0;
    let deleteCount = 0;

    mappedPermissions.forEach((p) => {
      if (p.actionType === "view") viewCount++;
      else if (p.actionType === "create") createCount++;
      else if (p.actionType === "delete") deleteCount++;
      else manageCount++;
    });

    return [
      {
        id: "total",
        title: "Total Capabilities",
        value: totalPermissions,
        description: "Granular permission keys",
        colorVariant: "primary",
      },
      {
        id: "modules",
        title: "System Modules",
        value: totalModules,
        description: "Work policy + domain groups",
        colorVariant: "purple",
      },
      {
        id: "view",
        title: "Read / View Keys",
        value: viewCount,
        description: "Auditing & inspection",
        colorVariant: "info",
      },
      {
        id: "manage",
        title: "Write & Admin Keys",
        value: createCount + manageCount + deleteCount,
        description: `${createCount} Create • ${deleteCount} Delete`,
        colorVariant: "success",
      },
    ];
  }, [mappedPermissions, permissionModules, rawPermissions]);

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

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const handleRefresh = useCallback(() => {
    hasFetchedPermissionsRef.current = false;
    fetchPermissions();
  }, [fetchPermissions]);

  const handleViewRoles = useCallback(() => {
    navigate(ROUTES.ROLES);
  }, [navigate]);

  const handleBackToAccessControl = useCallback(() => {
    navigate(ROUTES.ROLES);
  }, [navigate]);

  const pageProps = {
    permissionModules: filteredPermissionModules,
    allModules: permissionModules,
    stats,

    filters,
    moduleOptions,

    isLoading,
    hasError,
    error,
    message,

    totalPermissionsCount: rawPermissions.length,
    filteredModulesCount: filteredPermissionModules.length,
    hasPermissions: rawPermissions.length > 0,

    handleFilterChange,
    handleSearchChange,
    handleClearFilters,

    handleRefresh,
    handleViewRoles,
    handleBackToAccessControl,

    clearMessage,
  };

  return isMobile ? (
    <PermissionMobilePage {...pageProps} />
  ) : (
    <PermissionDesktopPage {...pageProps} />
  );
};

export default PermissionPage;
