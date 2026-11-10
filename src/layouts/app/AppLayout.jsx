// src/layouts/app/AppLayout.jsx

import { useEffect, useRef, useState } from "react";

import { TOKEN_KEY } from "@/constants";
import { storage } from "@/utils";
import { useIsMobile, useWorkModeDeepLinkSync } from "@/hooks";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import useAccessControl from "@/features/access-control/hooks/useAccessControl";
import {
  NavigationPipelineProvider,
  PIPELINE_LEVELS,
  PIPELINE_STORAGE_KEYS,
  getLevelFromPathname,
} from "@/contexts";
import { ScrollToTop } from "@/components";
import { UIToastContainer } from "@/components/ui";
import { AnimatePresence } from "framer-motion";

import AppDesktopLayout from "./desktop/AppDesktopLayout";
import AppMobileLayout from "./mobile/AppMobileLayout";
import PremiumAppLoader from "./components/loader/PremiumAppLoader";

const getWorkspaceFromItem = (item) => {
  return item?.workspace || item || null;
};

const safeGetStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
};

const safeRemoveStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore storage errors
  }
};

const AppLayoutContent = ({ isSyncComplete }) => {
  const isMobile = useIsMobile();
  useWorkModeDeepLinkSync({ isSyncComplete });

  return (
    <>
      <ScrollToTop />
      <UIToastContainer position="bottom-right" />
      <AnimatePresence mode="wait">
        {!isSyncComplete ? (
          <PremiumAppLoader key="loader" />
        ) : isMobile ? (
          <AppMobileLayout key="mobile" />
        ) : (
          <AppDesktopLayout key="desktop" />
        )}
      </AnimatePresence>
    </>
  );
};

const AppLayout = () => {
  const { workspaces, currentWorkspace, getMyWorkspaces, setCurrentWorkspace } =
    useWorkspace();
  const { getWorkspaceCompanies, setCurrentCompany, clearCurrentCompany } =
    useCompany();
  const { getCompanyBranches, setCurrentBranch, clearCurrentBranch } =
    useBranch();
  const { getMyAccess } = useAccessControl();

  const isHardRefresh = !currentWorkspace?._id;
  const [isSyncComplete, setIsSyncComplete] = useState(!isHardRefresh);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isHardRefresh || initializedRef.current) {
      setIsSyncComplete(true);
      return;
    }

    initializedRef.current = true;

    const bootApplicationContext = async () => {
      try {
        if (!storage.get(TOKEN_KEY)) {
          setIsSyncComplete(true);
          return;
        }

        const savedLevel = safeGetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL);
        const savedCompanyId = safeGetStorage(
          PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID,
        );
        const savedBranchId = safeGetStorage(
          PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID,
        );

        const validLevels = Object.values(PIPELINE_LEVELS);
        let effectiveLevel = validLevels.includes(savedLevel)
          ? savedLevel
          : getLevelFromPathname(window.location.pathname);

        if (!effectiveLevel || !validLevels.includes(effectiveLevel)) {
          effectiveLevel = PIPELINE_LEVELS.WORKSPACE;
        }

        const workspaceItems = workspaces?.length
          ? workspaces
          : await getMyWorkspaces().catch(() => []);
        const selectedWorkspaceItem = workspaceItems?.[0];
        const selectedWorkspace = getWorkspaceFromItem(selectedWorkspaceItem);

        if (selectedWorkspace?._id) {
          setCurrentWorkspace(selectedWorkspace);
        }

        let companyItems = [];
        if (selectedWorkspace?._id) {
          companyItems = await getWorkspaceCompanies().catch(() => []);
        }

        if (effectiveLevel === PIPELINE_LEVELS.WORKSPACE) {
          clearCurrentCompany();
          clearCurrentBranch();
          safeRemoveStorage(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID);
          safeRemoveStorage(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
        } else if (effectiveLevel === PIPELINE_LEVELS.COMPANY) {
          clearCurrentBranch();
          safeRemoveStorage(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);

          const selectedCompany =
            companyItems?.find((company) => company?._id === savedCompanyId) ||
            null;

          if (selectedCompany?._id) {
            setCurrentCompany(selectedCompany);
            await getCompanyBranches(selectedCompany._id).catch(() => null);
          } else {
            effectiveLevel = PIPELINE_LEVELS.WORKSPACE;
            clearCurrentCompany();
            safeRemoveStorage(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID);
          }
        } else if (effectiveLevel === PIPELINE_LEVELS.BRANCH) {
          const selectedCompany =
            companyItems?.find((company) => company?._id === savedCompanyId) ||
            companyItems?.[0] ||
            null;

          if (selectedCompany?._id) {
            setCurrentCompany(selectedCompany);
            safeSetStorage(
              PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID,
              selectedCompany._id,
            );

            const branchItems = await getCompanyBranches(
              selectedCompany._id,
            ).catch(() => []);
            const selectedBranch =
              branchItems?.find((branch) => branch?._id === savedBranchId) ||
              null;

            if (selectedBranch?._id) {
              setCurrentBranch(selectedBranch);
            } else {
              effectiveLevel = PIPELINE_LEVELS.COMPANY;
              clearCurrentBranch();
              safeRemoveStorage(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
            }
          } else {
            effectiveLevel = PIPELINE_LEVELS.WORKSPACE;
            clearCurrentCompany();
            clearCurrentBranch();
            safeRemoveStorage(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID);
            safeRemoveStorage(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
          }
        }

        safeSetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL, effectiveLevel);

        getMyAccess().catch(() => null);
        setIsSyncComplete(true);
      } catch (error) {
        console.error(
          "Critical failure during layout initialization sync:",
          error,
        );
        setIsSyncComplete(true);
      }
    };

    bootApplicationContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHardRefresh]);

  return (
    <NavigationPipelineProvider
      key={isSyncComplete ? "pipeline-ready" : "pipeline-boot"}
      isSyncComplete={isSyncComplete}
    >
      <AppLayoutContent isSyncComplete={isSyncComplete} />
    </NavigationPipelineProvider>
  );
};

export default AppLayout;
