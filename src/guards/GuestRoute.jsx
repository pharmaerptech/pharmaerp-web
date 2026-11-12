// src/guards/GuestRoute.jsx

import { Navigate, Outlet } from "react-router-dom";

import { ROUTES, TOKEN_KEY } from "@/constants";
import { storage } from "@/utils";
import useAuth from "../features/auth/hooks/useAuth";

const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const hasValidSession = Boolean(isAuthenticated && storage.get(TOKEN_KEY));

  if (hasValidSession) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return children || <Outlet />;
};

export default GuestRoute;
