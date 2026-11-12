// src/guards/ProtectedRoute.jsx

import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { ROUTES, TOKEN_KEY } from "@/constants";
import { storage } from "@/utils";
import useAuth from "@/features/auth/hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  const { isAuthenticated, clearCredentials } = useAuth();
  const hasStoredToken = Boolean(storage.get(TOKEN_KEY));
  const hasValidSession = Boolean(isAuthenticated && hasStoredToken);

  useEffect(() => {
    if (isAuthenticated && !hasStoredToken) {
      clearCredentials();
    }
  }, [isAuthenticated, hasStoredToken, clearCredentials]);

  if (!hasValidSession) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
