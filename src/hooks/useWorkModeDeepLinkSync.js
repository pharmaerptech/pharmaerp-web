// src/hooks/useWorkModeDeepLinkSync.js
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useWorkMode,
  useNavigationPipeline,
  isRouteAllowedForPipeline,
} from "@/contexts";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import { uiToast } from "@/components/ui";

/**
 * Enforces strict (currentLevel, workMode) route boundaries across the application
 * WITHOUT ever mutating the active level or mode when navigating.
 */
export const useWorkModeDeepLinkSync = ({ isSyncComplete = true } = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { workMode, hasSelectedMode } = useWorkMode();
  const { currentLevel } = useNavigationPipeline();
  const { isSetupComplete, companyCompleted } = useSetupStatus();
  const { currentCompany } = useCompany();
  const { currentBranch } = useBranch();
  const lastRedirectToastRef = useRef("");

  useEffect(() => {
    if (!isSyncComplete || !workMode || !hasSelectedMode) {
      return;
    }

    const pathname = location.pathname;
    const evaluation = isRouteAllowedForPipeline(pathname, {
      currentLevel,
      workMode,
      isSetupComplete,
      companyCompleted,
      hasActiveCompany: Boolean(currentCompany?._id),
      hasActiveBranch: Boolean(currentBranch?._id),
    });

    if (!evaluation.allowed && evaluation.redirectTo) {
      const normalizedCurrent = pathname.toLowerCase().replace(/\/+$/, "") || "/";
      const normalizedTarget =
        evaluation.redirectTo.toLowerCase().replace(/\/+$/, "") || "/";

      if (normalizedCurrent !== normalizedTarget) {
        if (
          (evaluation.reason === "level-mismatch" ||
            evaluation.reason === "mode-mismatch") &&
          lastRedirectToastRef.current !== `${pathname}:${evaluation.reason}`
        ) {
          lastRedirectToastRef.current = `${pathname}:${evaluation.reason}`;
          uiToast.info(
            "Route Restricted",
            evaluation.reason === "mode-mismatch"
              ? "That page belongs to another Work Mode. Switch mode in the sidebar to access it."
              : "That page belongs to another level. Change your level in the sidebar to access it."
          );
        }

        navigate(evaluation.redirectTo, { replace: true });
      }
    }
  }, [
    isSyncComplete,
    location.pathname,
    workMode,
    hasSelectedMode,
    currentLevel,
    isSetupComplete,
    companyCompleted,
    currentCompany?._id,
    currentBranch?._id,
    navigate,
  ]);
};

export default useWorkModeDeepLinkSync;
