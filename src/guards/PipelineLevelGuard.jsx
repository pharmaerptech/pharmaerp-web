// src/guards/PipelineLevelGuard.jsx

import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import { PIPELINE_LEVELS } from "@/contexts/NavigationPipelineContext";
import { ROUTES } from "@/constants";

export const PipelineLevelGuard = ({ requiredLevel = PIPELINE_LEVELS.COMPANY, children }) => {
  const location = useLocation();
  const { currentCompany } = useCompany();
  const { currentBranch } = useBranch();

  if (requiredLevel === PIPELINE_LEVELS.BRANCH) {
    if (!currentCompany) {
      return (
        <Navigate
          to={ROUTES.WORKSPACE_DASHBOARD}
          replace
          state={{ from: location, unauthorizedContext: "company" }}
        />
      );
    }
    if (!currentBranch) {
      return (
        <Navigate
          to={ROUTES.COMPANY_DASHBOARD}
          replace
          state={{ from: location, unauthorizedContext: "branch" }}
        />
      );
    }
  }

  if (requiredLevel === PIPELINE_LEVELS.COMPANY) {
    if (!currentCompany) {
      return (
        <Navigate
          to={ROUTES.WORKSPACE_DASHBOARD}
          replace
          state={{ from: location, unauthorizedContext: "company" }}
        />
      );
    }
  }

  return children || <Outlet />;
};

export default PipelineLevelGuard;

