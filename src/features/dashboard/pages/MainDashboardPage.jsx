// src/features/dashboard/pages/MainDashboardPage.jsx

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { uiToast } from "@/components/ui";

import { useNavigationPipeline } from "@/contexts/NavigationPipelineContext";
import { useWorkMode, WORK_MODES } from "@/contexts/WorkModeContext";
import BranchDashboardPage from "./BranchDashboardPage";
import CompanyDashboardPage from "./CompanyDashboardPage";
import WorkspaceDashboardPage from "./WorkspaceDashboardPage";
import { WorkspaceOperationsStarterPage } from "@/features/workspace/pages";
import { CompanyOperationsStarterPage } from "@/features/company/pages";
import { BranchOperationsStarterPage } from "@/features/branch/pages";

export const MainDashboardPage = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { workMode } = useWorkMode();
  const { isWorkspaceLevel, isCompanyLevel, isBranchLevel } =
    useNavigationPipeline();

  const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace);
  const currentCompany = useSelector((state) => state.company?.currentCompany);
  const currentBranch = useSelector((state) => state.branch?.currentBranch);

  useEffect(() => {
    if (location.state?.unauthorizedContext) {
      const ctx = location.state.unauthorizedContext;
      uiToast.error("Access Denied", `You need an active ${ctx} to access that page.`);

      const state = { ...location.state };
      delete state.unauthorizedContext;
      navigate(location.pathname, { replace: true, state });
    } else if (location.state?.unauthorizedPermission) {
      uiToast.error("Access Denied", "You don't have permission to view that page.");

      const state = { ...location.state };
      delete state.unauthorizedPermission;
      navigate(location.pathname, { replace: true, state });
    }
  }, [location, navigate]);

  const isOp = workMode === WORK_MODES.OPERATION;

  // Contextual Dashboard Resolution based on Elevator Pipeline Level & Work Mode
  if (isWorkspaceLevel) {
    const wsKey = currentWorkspace?._id || currentWorkspace?.id || "ws";
    return isOp ? (
      <WorkspaceOperationsStarterPage key={`workspace-op-${wsKey}`} {...props} />
    ) : (
      <WorkspaceDashboardPage key={`workspace-view-${wsKey}`} {...props} />
    );
  }

  if (isCompanyLevel) {
    const compKey = currentCompany?._id || currentCompany?.id || "comp";
    return isOp ? (
      <CompanyOperationsStarterPage key={`company-op-${compKey}`} {...props} />
    ) : (
      <CompanyDashboardPage key={`company-view-${compKey}`} {...props} />
    );
  }

  const branchKey = currentBranch?._id || currentBranch?.id || "branch";
  return isOp ? (
    <BranchOperationsStarterPage key={`branch-op-${branchKey}`} {...props} />
  ) : (
    <BranchDashboardPage key={`branch-view-${branchKey}`} {...props} />
  );
};

export default MainDashboardPage;
