// src/hooks/useWorkModeDeepLinkSync.js
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useWorkMode,
  useNavigationPipeline,
  isRouteAllowedForPipeline,
} from "@/contexts";
import usePermission from "@/hooks/usePermission";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import { uiToast } from "@/components/ui";
import {
  normalizeStoredId,
  shouldDeferDeepLinkEvaluation,
} from "@/layouts/app/bootContextPolicy";

/**
 * Enforces strict (currentLevel, workMode) AND backend role access boundaries across the app.
 */
export const useWorkModeDeepLinkSync = ({ isSyncComplete = true } = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { workMode, hasSelectedMode } = useWorkMode();
  const { currentLevel } = useNavigationPipeline();
  const {
    isLoaded: isPermissionsLoaded,
    isOwner,
    allowedWorkLevels,
    allowedWorkModes,
  } = usePermission();
  const {
    isSetupComplete,
    companyCompleted,
    setupStatus,
    isLoading: isSetupLoading,
    workspaceId,
  } = useSetupStatus();
  const { currentCompany } = useCompany();
  const { currentBranch } = useBranch();
  const lastRedirectToastRef = useRef("");

  useEffect(() => {
    if (
      !isPermissionsLoaded ||
      shouldDeferDeepLinkEvaluation({
        isSyncComplete,
        workMode,
        hasSelectedMode,
        isSetupLoading,
        workspaceId,
        setupStatus,
      })
    ) {
      return;
    }

    const pathname = location.pathname;
    const evaluation = isRouteAllowedForPipeline(pathname, {
      currentLevel,
      workMode,
      isSetupComplete,
      companyCompleted,
      hasActiveCompany: Boolean(normalizeStoredId(currentCompany)),
      hasActiveBranch: Boolean(normalizeStoredId(currentBranch)),
      allowedWorkLevels: !isOwner ? allowedWorkLevels : null,
      allowedWorkModes: !isOwner ? allowedWorkModes : null,
    });

    if (!evaluation.allowed && evaluation.redirectTo) {
      const normalizedCurrent = pathname.toLowerCase().replace(/\/+$/, "") || "/";
      const normalizedTarget =
        evaluation.redirectTo.toLowerCase().replace(/\/+$/, "") || "/";

      if (normalizedCurrent !== normalizedTarget) {
        if (
          (evaluation.reason === "level-mismatch" ||
            evaluation.reason === "mode-mismatch" ||
            evaluation.reason === "role-level-denied" ||
            evaluation.reason === "role-mode-denied") &&
          lastRedirectToastRef.current !== `${pathname}:${evaluation.reason}`
        ) {
          lastRedirectToastRef.current = `${pathname}:${evaluation.reason}`;
          const messageMap = {
            "role-mode-denied":
              "Your role does not permit accessing that Work Mode.",
            "role-level-denied":
              "Your role does not permit accessing that Work Level.",
            "mode-mismatch":
              "That page belongs to another Work Mode. Switch mode in the sidebar to access it.",
            "level-mismatch":
              "That page belongs to another level. Change your level in the sidebar to access it.",
          };
          uiToast.info(
            "Route Restricted",
            messageMap[evaluation.reason] || "Access to this route is restricted.",
          );
        }

        navigate(evaluation.redirectTo, { replace: true });
      }
    }
  }, [
    isSyncComplete,
    isPermissionsLoaded,
    isOwner,
    allowedWorkLevels,
    allowedWorkModes,
    location.pathname,
    workMode,
    hasSelectedMode,
    currentLevel,
    isSetupComplete,
    companyCompleted,
    setupStatus,
    isSetupLoading,
    workspaceId,
    currentCompany,
    currentBranch,
    navigate,
  ]);
};

export default useWorkModeDeepLinkSync;
