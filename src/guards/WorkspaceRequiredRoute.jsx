// src/guards/WorkspaceRequiredRoute.jsx

import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AlertCircle, LogOut, RotateCcw } from "lucide-react";

import { ROUTES, API_STATUS, TOKEN_KEY } from "@/constants";
import { storage } from "@/utils";
import useAuth from "@/features/auth/hooks/useAuth";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import { UIButton } from "@/components/ui";
import PremiumAppLoader from "@/layouts/app/components/loader/PremiumAppLoader";
import { AnimatePresence } from "framer-motion";

const WorkspaceRequiredRoute = ({ children }) => {
  const location = useLocation();

  const { clearCredentials } = useAuth();
  const {
    workspaces,
    currentWorkspace,
    getMyWorkspacesStatus,
    getMyWorkspaces,
    error,
  } = useWorkspace();

  const isLoading = getMyWorkspacesStatus === API_STATUS.LOADING;
  const isError = getMyWorkspacesStatus === API_STATUS.ERROR;
  const hasFetched = getMyWorkspacesStatus === API_STATUS.SUCCESS;
  const hasStoredToken = Boolean(storage.get(TOKEN_KEY));
  const hasWorkspace =
    Boolean(currentWorkspace) || Boolean(workspaces && workspaces.length > 0);

  useEffect(() => {
    if (getMyWorkspacesStatus === API_STATUS.IDLE && hasStoredToken) {
      getMyWorkspaces().catch(() => {});
    }
  }, [getMyWorkspacesStatus, getMyWorkspaces, hasStoredToken]);

  if (!hasStoredToken) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (isError && !hasWorkspace) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-bg px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg text-center space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-danger/10 text-danger border border-danger/20">
            <AlertCircle className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-text">
              Unable to load workspace
            </h2>
            <p className="text-xs text-text-muted">
              {error || "Please check your connection and try again."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <UIButton
              type="button"
              variant="primary"
              size="sm"
              startIcon={<RotateCcw className="size-3.5" />}
              onClick={() => getMyWorkspaces().catch(() => {})}
            >
              Retry
            </UIButton>
            <UIButton
              type="button"
              variant="outline"
              size="sm"
              startIcon={<LogOut className="size-3.5" />}
              onClick={() => clearCredentials()}
            >
              Sign In Again
            </UIButton>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !hasFetched) {
    return (
      <AnimatePresence mode="wait">
        <PremiumAppLoader key="loader" message="Loading workspace..." />
      </AnimatePresence>
    );
  }

  if (!hasWorkspace) {
    return (
      <Navigate
        to={ROUTES.CREATE_WORKSPACE}
        replace
        state={{ from: location }}
      />
    );
  }

  return children || <Outlet />;
};

export default WorkspaceRequiredRoute;
