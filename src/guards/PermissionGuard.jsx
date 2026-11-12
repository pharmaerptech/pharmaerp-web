// src/guards/PermissionGuard.jsx

import { Outlet, Navigate, useLocation } from "react-router-dom";
import usePermission from "@/hooks/usePermission";
import { useWorkMode, WORK_MODES } from "@/contexts/WorkModeContext";
import {
  useNavigationPipeline,
  getPipelineDefaultRoute,
} from "@/contexts/NavigationPipelineContext";
import { ROUTES } from "@/constants";

const PermissionGuard = ({
  permission,
  permissions,
  requiredWorkMode = null,
  requiredWorkLevel = null,
  requireOwner = false,
  fallback,
  children,
}) => {
  const location = useLocation();
  const {
    can,
    canAny,
    canWorkMode,
    canWorkLevel,
    isOwner,
    isLoaded,
    workAccess,
  } = usePermission();
  const { currentLevel } = useNavigationPipeline();
  const { workMode } = useWorkMode();

  if (!isLoaded) {
    return null;
  }

  let hasAccess = true;

  if (requireOwner) {
    hasAccess = Boolean(isOwner);
  } else if (requiredWorkLevel && !canWorkLevel(requiredWorkLevel)) {
    hasAccess = false;
  } else if (requiredWorkMode && !canWorkMode(requiredWorkMode)) {
    hasAccess = false;
  } else if (permissions?.length) {
    hasAccess = canAny(permissions);
  } else if (permission) {
    hasAccess = can(permission);
  }

  if (!hasAccess) {
    const safeTarget =
      getPipelineDefaultRoute(
        workAccess?.highestWorkLevel || currentLevel,
        workMode || workAccess?.defaultWorkMode || WORK_MODES.VIEW,
        !isOwner ? workAccess : null,
      ) || ROUTES.DASHBOARD;

    if (location.pathname === safeTarget && fallback) {
      return fallback;
    }

    return (
      fallback || (
        <Navigate
          to={safeTarget}
          replace
          state={{ unauthorizedPermission: true }}
        />
      )
    );
  }

  return children || <Outlet />;
};

export default PermissionGuard;
