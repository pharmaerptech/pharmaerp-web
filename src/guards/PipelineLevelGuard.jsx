// src/guards/PipelineLevelGuard.jsx

import { Navigate, Outlet, useLocation } from "react-router-dom";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import { useWorkMode, WORK_MODES } from "@/contexts/WorkModeContext";
import {
  useNavigationPipeline,
  PIPELINE_LEVELS,
  getPipelineDefaultRoute,
  reconcilePipelineLevel,
} from "@/contexts/NavigationPipelineContext";

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

  if (allowDuringOnboarding && !isSetupComplete) {
    return children || <Outlet />;
  }

  const levels = Array.isArray(allowedLevels)
    ? allowedLevels
    : requiredLevel
      ? [requiredLevel]
      : null;

  const hasActiveCompany = Boolean(currentCompany?._id);
  const hasActiveBranch = Boolean(currentBranch?._id);

  const effectiveLevel = reconcilePipelineLevel(currentLevel, {
    hasActiveCompany,
    hasActiveBranch,
  });

  const safeRedirect = getPipelineDefaultRoute(
    effectiveLevel,
    workMode || WORK_MODES.VIEW
  );

  // Check entity prerequisites if branch or company level is strictly required
  if (levels?.length === 1) {
    const targetLevel = levels[0];
    if (targetLevel === PIPELINE_LEVELS.BRANCH && (!hasActiveCompany || !hasActiveBranch)) {
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
      return (
        <Navigate
          to={safeRedirect}
          replace
          state={{ from: location, unauthorizedContext: "company" }}
        />
      );
    }
  }

  // Enforce active pipeline level boundary (never change level silently on route jump)
  if (levels && !levels.includes(effectiveLevel)) {
    return <Navigate to={safeRedirect} replace state={{ from: location }} />;
  }

  // Enforce work mode boundary when specified
  if (workMode && Array.isArray(allowedModes) && !allowedModes.includes(workMode)) {
    return <Navigate to={safeRedirect} replace state={{ from: location }} />;
  }

  return children || <Outlet />;
};

export default PipelineLevelGuard;
