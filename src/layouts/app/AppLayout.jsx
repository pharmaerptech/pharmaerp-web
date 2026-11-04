// src/layouts/app/AppLayout.jsx

import { useEffect, useRef, useState } from "react";

import { useIsMobile, useWorkModeDeepLinkSync } from "@/hooks";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import useUser from "@/features/user/hooks/useUser";
import useAccessControl from "@/features/access-control/hooks/useAccessControl";
import {
  useWorkMode,
  NavigationPipelineProvider,
  PIPELINE_LEVELS,
  PIPELINE_STORAGE_KEYS,
  getLevelFromPathname,
} from "@/contexts";
import { ChooseWorkModeModal } from "@/features/operations/components/ChooseWorkModeModal";
import { ScrollToTop } from "@/components";
import { UIToastContainer } from "@/components/ui";
import { AnimatePresence } from "framer-motion";

import AppDesktopLayout from "./desktop/AppDesktopLayout";
import AppMobileLayout from "./mobile/AppMobileLayout";
import PremiumAppLoader from "./components/loader/PremiumAppLoader";

const getWorkspaceFromItem = (item) => {
  return item?.workspace || item || null;
};

const AppLayout = () => {
  const isMobile = useIsMobile();
  useWorkModeDeepLinkSync();

  const { user } = useUser();
  const { workspaces, currentWorkspace, getMyWorkspaces, setCurrentWorkspace } =
    useWorkspace();
  const {
    companies,
    currentCompany,
    getWorkspaceCompanies,
    setCurrentCompany,
    clearCurrentCompany,
  } = useCompany();
  const {
    branches,
    currentBranch,
    getCompanyBranches,
    setCurrentBranch,
    clearCurrentBranch,
  } = useBranch();
  const { getMyAccess } = useAccessControl();
  const { hasSelectedMode, openModeModal } = useWorkMode();

  // STRATEGY: If workspace is populated in Redux, skip initialization. If empty, reload session.
  const isHardRefresh = !currentWorkspace?._id;
  const [isSyncComplete, setIsSyncComplete] = useState(!isHardRefresh);

  const initializedRef = useRef(false);

  // ONE SINGLE EFFECT TO HYDRATE CORE CONTEXT IN PERFECT SEQUENTIAL ORDER
  useEffect(() => {
    // If we are navigating or already booted this session, unlock instantly and exit
    if (!isHardRefresh || initializedRef.current) {
      setIsSyncComplete(true);
      return;
    }

    initializedRef.current = true;

    const bootApplicationContext = async () => {
      try {
        // STEP 1: Determine active floor level from URL route or localStorage
        const routeLevel = getLevelFromPathname(window.location.pathname);
        let effectiveLevel = routeLevel;
        if (!effectiveLevel) {
          try {
            effectiveLevel = localStorage.getItem(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL);
          } catch {}
        }
        if (
          !effectiveLevel ||
          !Object.values(PIPELINE_LEVELS).includes(effectiveLevel)
        ) {
          effectiveLevel = PIPELINE_LEVELS.WORKSPACE;
        }

        // Read locally stored company and branch identifiers (NO database fetch)
        let savedCompanyId = null;
        let savedBranchId = null;
        try {
          savedCompanyId = localStorage.getItem(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID);
          savedBranchId = localStorage.getItem(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
        } catch {}

        // STEP 2: Resolve Workspace Array
        const workspaceItems = workspaces?.length
          ? workspaces
          : await getMyWorkspaces();
        const selectedWorkspaceItem = workspaceItems?.[0];
        const selectedWorkspace = getWorkspaceFromItem(selectedWorkspaceItem);

        if (selectedWorkspace?._id) {
          setCurrentWorkspace(selectedWorkspace);
        }

        // STEP 3: Always fetch available Workspace Companies so the list is ready in Redux
        let companyItems = [];
        if (selectedWorkspace?._id) {
          companyItems = await getWorkspaceCompanies().catch(() => []);
        }

        // STEP 4: Strict Level Context Hydration
        if (effectiveLevel === PIPELINE_LEVELS.WORKSPACE) {
          // At Workspace level: both active company & active branch MUST remain null!
          clearCurrentCompany();
          clearCurrentBranch();
          try {
            localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID);
            localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
          } catch {}
        } else if (effectiveLevel === PIPELINE_LEVELS.COMPANY) {
          // At Company level: branch MUST remain null!
          clearCurrentBranch();
          try {
            localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
          } catch {}

          const selectedCompany =
            companyItems?.find((company) => company?._id === savedCompanyId) ||
            null;

          if (selectedCompany?._id) {
            setCurrentCompany(selectedCompany);
            // Pre-fetch branches for this active company
            await getCompanyBranches(selectedCompany._id).catch(() => null);
          } else {
            clearCurrentCompany();
            try {
              localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID);
            } catch {}
          }
        } else if (effectiveLevel === PIPELINE_LEVELS.BRANCH) {
          // At Branch level: resolve both company and branch strictly
          const selectedCompany =
            companyItems?.find((company) => company?._id === savedCompanyId) ||
            companyItems?.[0] ||
            null;

          if (selectedCompany?._id) {
            setCurrentCompany(selectedCompany);

            const branchItems = await getCompanyBranches(selectedCompany._id).catch(() => []);
            const selectedBranch =
              branchItems?.find((branch) => branch?._id === savedBranchId) ||
              null;

            if (selectedBranch?._id) {
              setCurrentBranch(selectedBranch);
            } else {
              clearCurrentBranch();
              try {
                localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
              } catch {}
            }
          } else {
            clearCurrentCompany();
            clearCurrentBranch();
            try {
              localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID);
              localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
            } catch {}
          }
        }

        // UNLOCK GATE: Everything resolved in sequential order safely!
        // Load the current user's permissions (non-blocking — errors fail silently)
        getMyAccess().catch(() => null);

        setIsSyncComplete(true);
      } catch (error) {
        console.error(
          "Critical failure during layout initialization sync:",
          error,
        );
        setIsSyncComplete(true); // Fail-safe to prevent hard UI freezes
      }
    };

    bootApplicationContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHardRefresh]);

  return (
    <NavigationPipelineProvider>
      <ScrollToTop />
      <UIToastContainer position="bottom-right" />
      <AnimatePresence mode="wait">
        {!isSyncComplete ? (
          <PremiumAppLoader key="loader" />
        ) : (
          isMobile ? <AppMobileLayout key="mobile" /> : <AppDesktopLayout key="desktop" />
        )}
      </AnimatePresence>
    </NavigationPipelineProvider>
  );
};

export default AppLayout;
