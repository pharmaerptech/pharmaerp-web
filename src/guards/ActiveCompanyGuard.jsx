import { Navigate, Outlet, useLocation } from "react-router-dom";
import useCompany from "@/features/company/hooks/useCompany";
import { useWorkMode, WORK_MODES } from "@/contexts/WorkModeContext";
import {
  useNavigationPipeline,
  reconcilePipelineLevel,
  getPipelineDefaultRoute,
} from "@/contexts/NavigationPipelineContext";
import PremiumAppLoader from "@/layouts/app/components/loader/PremiumAppLoader";
import { AnimatePresence } from "framer-motion";

export const ActiveCompanyGuard = ({ children }) => {
  const location = useLocation();
  const { currentCompany, isLoading } = useCompany();
  const { currentLevel } = useNavigationPipeline();
  const { workMode } = useWorkMode();

  if (isLoading) {
    return (
      <AnimatePresence mode="wait">
        <PremiumAppLoader key="loader" message="Verifying company access..." />
      </AnimatePresence>
    );
  }

  if (!currentCompany) {
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
