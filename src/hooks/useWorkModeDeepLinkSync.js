// src/hooks/useWorkModeDeepLinkSync.js
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useWorkMode,
  WORK_MODES,
  getPipelineDefaultRoute,
  PIPELINE_LEVELS,
  PIPELINE_STORAGE_KEYS,
} from "@/contexts";
import { ROUTES } from "@/constants";

/**
 * Ensures strict mode enforcement:
 * - When in View Mode: If on /sales or /sale, immediately redirects to /dashboard.
 * - When in Operation Mode: If on /dashboard or /, immediately redirects to /sales.
 */
export const useWorkModeDeepLinkSync = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { workMode, hasSelectedMode } = useWorkMode();

  useEffect(() => {
    // If user has not chosen a work mode yet, do nothing (Choose Mode screen handles it)
    if (!workMode || !hasSelectedMode) {
      return;
    }

    const pathname = location.pathname.toLowerCase();

    // Skip choose-mode, auth, or setup screens
    if (
      pathname === "/choose-mode" ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/setup")
    ) {
      return;
    }

    // 1. In View Mode: Disallow operational sales counter (/sales, /sale) -> Go to Dashboard
    if (workMode === WORK_MODES.VIEW) {
      if (
        pathname === "/" ||
        pathname === "/sales" ||
        pathname.startsWith("/sales/") ||
        pathname.startsWith("/sale/") ||
        pathname === "/billing/credit-notes"
      ) {
        navigate(ROUTES.DASHBOARD, { replace: true });
        return;
      }
    }

    // 2. In Operation Mode: Disallow view dashboard routes -> Go to active level landing route
    if (workMode === WORK_MODES.OPERATION) {
      if (
        pathname === "/" ||
        pathname === "/dashboard" ||
        pathname.startsWith("/dashboard/")
      ) {
        let activeLevel = PIPELINE_LEVELS.WORKSPACE;
        try {
          const saved = localStorage.getItem(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL);
          if (
            saved === PIPELINE_LEVELS.WORKSPACE ||
            saved === PIPELINE_LEVELS.COMPANY ||
            saved === PIPELINE_LEVELS.BRANCH
          ) {
            activeLevel = saved;
          }
        } catch {}
        const targetRoute = getPipelineDefaultRoute(activeLevel, WORK_MODES.OPERATION);
        navigate(targetRoute, { replace: true });
        return;
      }
    }
  }, [location.pathname, workMode, hasSelectedMode, navigate]);
};

export default useWorkModeDeepLinkSync;
