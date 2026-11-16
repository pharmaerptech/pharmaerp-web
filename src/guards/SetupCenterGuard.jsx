// src/guards/SetupCenterGuard.jsx

import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import PremiumAppLoader from "@/layouts/app/components/loader/PremiumAppLoader";
import { AnimatePresence } from "framer-motion";

/**
 * SetupCenterGuard
 *
 * Protects operational application routes (Dashboard, Inventory, POS Sales,
 * Billing, Purchases, Finance, Reports, Marketplace, etc.).
 *
 * If the workspace setup is not 100% complete (both Company and Branch are required),
 * it intercepts the direct URL navigation and redirects the user directly to the Setup Center (/setup-center).
 */
export const SetupCenterGuard = ({ children }) => {
  const location = useLocation();
  const { isSetupComplete, isLoading, setupStatus, workspaceId, companyCompleted } =
    useSetupStatus();

  // If workspace is present and status hasn't hydrated yet (either loading or about to load)
  if (!setupStatus && workspaceId) {
    return (
      <AnimatePresence mode="wait">
        <PremiumAppLoader key="loader" message="Checking workspace setup status..." />
      </AnimatePresence>
    );
  }

  // If setup is incomplete, redirect to the Setup Center
  // Exception: Allow Company Operations Starter (/company/operations), Branches (/branches, /branches/create),
  // and company-level operations when Step 1 (Company) is complete,
  // allowing the user to enter the company level to create branches and launch operations.
  if (!isSetupComplete) {
    if (
      companyCompleted &&
      (location.pathname.startsWith("/company/operations") ||
       location.pathname.startsWith("/branches") ||
       location.pathname.startsWith("/company-operations") ||
       location.pathname.startsWith("/branch-operations"))
    ) {
      return children || <Outlet />;
    }

    return (
      <Navigate
        to={ROUTES.SETUP_CENTER}
        replace
        state={{ from: location, redirectedFromGuard: true }}
      />
    );
  }

  return children || <Outlet />;
};

/**
 * CompanyRequiredGuard
 *
 * Guards Branch routes (/branches, /branches/create, etc.).
 * If the user has not created a Company yet (Step 1 incomplete), they cannot access or create branches.
 * Redirects directly to the Setup Center.
 */
export const CompanyRequiredGuard = ({ children }) => {
  const location = useLocation();
  const { companyCompleted, isLoading, setupStatus, workspaceId } =
    useSetupStatus();

  // If workspace is present and status hasn't hydrated yet (either loading or about to load)
  if (!setupStatus && workspaceId) {
    return (
      <AnimatePresence mode="wait">
        <PremiumAppLoader key="loader" message="Verifying company prerequisite..." />
      </AnimatePresence>
    );
  }

  // If Company is NOT created yet, redirect to Setup Center
  if (!companyCompleted) {
    return (
      <Navigate
        to={ROUTES.SETUP_CENTER}
        replace
        state={{ from: location, prerequisiteMissing: "company" }}
      />
    );
  }

  return children || <Outlet />;
};

export default SetupCenterGuard;
