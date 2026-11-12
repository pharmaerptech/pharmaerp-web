// src/guards/PipelineLevelGuard.jsx

import { Navigate, Outlet, useLocation } from "react-router-dom";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import usePermission from "@/hooks/usePermission";
import { useWorkMode, WORK_MODES } from "@/contexts/WorkModeContext";
import {
  useNavigationPipeline,
  PIPELINE_LEVELS,
  getPipelineDefaultRoute,
  reconcilePipelineLevel,
} from "@/contexts/NavigationPipelineContext";
import { clampWorkModeToAllowed } from "@/utils/workAccess";
import AccessDeniedPage from "@/pages/AccessDeniedPage";

export const PipelineLevelGuard = ({
  requiredLevel = null,
  allowedLevels = null,
  allowedModes = null,
  allowDuringOnboarding = false,
  children,
}) => {
  const location = useLocation();
  const { currentCompany } = useCompany();
  const { currentBranch } = useBranch();
  const { currentLevel } = useNavigationPipeline();
  const { workMode } = useWorkMode();
  const { isSetupComplete } = useSetupStatus();
  const {
    isLoaded,
    isOwner,
    allowedWorkLevels,
    allowedWorkModes,
    workAccess,
    canWorkLevel,
    canWorkMode,
  } = usePermission();

  if (!isLoaded) {
    return null;
  }

  if (allowDuringOnboarding && !isSetupComplete && canWorkLevel(PIPELINE_LEVELS.WORKSPACE)) {
    return children || <Outlet />;
  }

  const levels = Array.isArray(allowedLevels)
    ? allowedLevels
    : requiredLevel
      ? [requiredLevel]
      : null;

  const hasActiveCompany = Boolean(currentCompany?._id || currentCompany?.id);
  const hasActiveBranch = Boolean(currentBranch?._id || currentBranch?.id);

  const enforcedLevels = !isOwner ? allowedWorkLevels : null;
  const enforcedModes = !isOwner ? allowedWorkModes : null;

  const effectiveLevel = reconcilePipelineLevel(currentLevel, {
    hasActiveCompany,
    hasActiveBranch,
    allowedLevels: enforcedLevels,
  });

  const effectiveMode = enforcedModes
    ? clampWorkModeToAllowed(workMode, enforcedModes)
    : workMode || WORK_MODES.VIEW;

  const safeRedirect = getPipelineDefaultRoute(
    effectiveLevel,
    effectiveMode,
    !isOwner ? workAccess : null,
  );

  // Enforce role level boundary
  if (levels && !isOwner && !levels.some((lvl) => canWorkLevel(lvl))) {
    if (location.pathname === safeRedirect) {
      return <AccessDeniedPage denialType="level" requiredLevels={levels} />;
    }
    return <Navigate to={safeRedirect} replace state={{ from: location }} />;
  }

  // Enforce role work mode boundary (strict — no hierarchy)
  if (
    Array.isArray(allowedModes) &&
    !isOwner &&
    !allowedModes.some((mode) => canWorkMode(mode))
  ) {
    if (location.pathname === safeRedirect) {
      return <AccessDeniedPage denialType="mode" requiredModes={allowedModes} />;
    }
    return <Navigate to={safeRedirect} replace state={{ from: location }} />;
  }

  // Check entity prerequisites if branch or company level is strictly required
  if (levels?.length === 1) {
    const targetLevel = levels[0];
    if (
      targetLevel === PIPELINE_LEVELS.BRANCH &&
      (!hasActiveCompany || !hasActiveBranch)
    ) {
      if (location.pathname === safeRedirect) {
        return (
          <AccessDeniedPage
            denialType="context"
            message="No assigned branch is currently selected or accessible for your account."
          />
        );
      }
      return (
        <Navigate
          to={safeRedirect}
          replace
          state={{
            from: location,
            unauthorizedContext: !hasActiveCompany ? "company" : "branch",
          }}
        />
      );
    }
    if (targetLevel === PIPELINE_LEVELS.COMPANY && !hasActiveCompany) {
      if (location.pathname === safeRedirect) {
        return (
          <AccessDeniedPage
            denialType="context"
            message="No assigned company is currently selected or accessible for your account."
          />
        );
      }
      return (
        <Navigate
          to={safeRedirect}
          replace
          state={{ from: location, unauthorizedContext: "company" }}
        />
      );
    }
  }

  // Enforce active pipeline level boundary
  if (levels && !levels.includes(effectiveLevel)) {
    return <Navigate to={safeRedirect} replace state={{ from: location }} />;
  }

  // Enforce active work mode boundary
  if (workMode && Array.isArray(allowedModes) && !allowedModes.includes(workMode)) {
    return <Navigate to={safeRedirect} replace state={{ from: location }} />;
  }

  return children || <Outlet />;
};

export default PipelineLevelGuard;
