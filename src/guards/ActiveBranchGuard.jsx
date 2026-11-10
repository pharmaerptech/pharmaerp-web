import { Navigate, Outlet, useLocation } from "react-router-dom";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import { useWorkMode, WORK_MODES } from "@/contexts/WorkModeContext";
import {
  useNavigationPipeline,
  reconcilePipelineLevel,
  getPipelineDefaultRoute,
} from "@/contexts/NavigationPipelineContext";
import PremiumAppLoader from "@/layouts/app/components/loader/PremiumAppLoader";
import { AnimatePresence } from "framer-motion";

export const ActiveBranchGuard = ({ children }) => {
  const location = useLocation();
  const { currentCompany } = useCompany();
  const { currentBranch, isLoading } = useBranch();
  const { currentLevel } = useNavigationPipeline();
  const { workMode } = useWorkMode();

  if (isLoading) {
    return (
      <AnimatePresence mode="wait">
        <PremiumAppLoader key="loader" message="Verifying branch access..." />
      </AnimatePresence>
    );
  }

  if (!currentBranch) {
    const safeLevel = reconcilePipelineLevel(currentLevel, {
      hasActiveCompany: Boolean(currentCompany?._id),
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
        state={{ from: location, unauthorizedContext: "branch" }}
      />
    );
  }

  return children || <Outlet />;
};

export default ActiveBranchGuard;
