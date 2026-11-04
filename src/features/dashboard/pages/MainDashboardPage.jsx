// src/features/dashboard/pages/MainDashboardPage.jsx

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { uiToast } from "@/components/ui";

import { useNavigationPipeline } from "@/contexts/NavigationPipelineContext";
import BranchDashboardPage from "./BranchDashboardPage";
import CompanyDashboardPage from "./CompanyDashboardPage";
import WorkspaceDashboardPage from "./WorkspaceDashboardPage";

export const MainDashboardPage = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
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

  // Contextual Dashboard Resolution based on Elevator Pipeline Level
  if (isWorkspaceLevel) {
    const wsKey = currentWorkspace?._id || currentWorkspace?.id || "ws";
    return <WorkspaceDashboardPage key={`workspace-${wsKey}`} {...props} />;
  }

  if (isCompanyLevel) {
    const compKey = currentCompany?._id || currentCompany?.id || "comp";
    return <CompanyDashboardPage key={`company-${compKey}`} {...props} />;
  }

  const branchKey = currentBranch?._id || currentBranch?.id || "branch";
  return <BranchDashboardPage key={`branch-${branchKey}`} {...props} />;
};

export default MainDashboardPage;
