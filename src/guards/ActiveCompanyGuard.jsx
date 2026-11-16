import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useCompany from "@/features/company/hooks/useCompany";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import { useWorkMode, WORK_MODES } from "@/contexts/WorkModeContext";
import {
  useNavigationPipeline,
  PIPELINE_LEVELS,
  reconcilePipelineLevel,
  getPipelineDefaultRoute,
} from "@/contexts/NavigationPipelineContext";
import PremiumAppLoader from "@/layouts/app/components/loader/PremiumAppLoader";
import { AnimatePresence } from "framer-motion";

export const ActiveCompanyGuard = ({ children }) => {
  const location = useLocation();
  const { currentCompany, companies, setCurrentCompany, isLoading } = useCompany();
  const { isSetupComplete } = useSetupStatus();
  const { currentLevel } = useNavigationPipeline();
  const { workMode } = useWorkMode();

  // Auto-hydrate company if companies list is available but currentCompany not set
  useEffect(() => {
    if (!currentCompany && Array.isArray(companies) && companies.length > 0) {
      setCurrentCompany(companies[0]);
    }
  }, [currentCompany, companies, setCurrentCompany]);

  if (isLoading) {
    return (
      <AnimatePresence mode="wait">
        <PremiumAppLoader key="loader" message="Verifying company access..." />
      </AnimatePresence>
    );
  }

  // During onboarding, pass through without forcing single active company
  if (!isSetupComplete) {
    return children || <Outlet />;
  }

  // If active pipeline level is workspace, pass through without forcing single active company
  if (currentLevel === PIPELINE_LEVELS.WORKSPACE || currentLevel === "workspace") {
    return children || <Outlet />;
  }

  if (!currentCompany && (!companies || companies.length === 0)) {
    const safeLevel = reconcilePipelineLevel(currentLevel, {
      hasActiveCompany: false,
      hasActiveBranch: false,
    });
    const fallbackRoute = getPipelineDefaultRoute(
      safeLevel,
      workMode || WORK_MODES.VIEW
    );
    return (
      <Navigate
        to={fallbackRoute}
        replace
        state={{ from: location, unauthorizedContext: "company" }}
      />
    );
  }

  return children || <Outlet />;
};

export default ActiveCompanyGuard;
