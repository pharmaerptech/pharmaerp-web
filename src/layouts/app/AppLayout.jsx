// src/layouts/app/AppLayout.jsx

import { useEffect, useState } from "react";

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
  useWorkMode,
} from "@/contexts";
import { resolveMyWorkAccess } from "@/utils/workAccess";
import { ScrollToTop } from "@/components";
import { UIToastContainer } from "@/components/ui";
import { AnimatePresence } from "framer-motion";

import AppDesktopLayout from "./desktop/AppDesktopLayout";
import AppMobileLayout from "./mobile/AppMobileLayout";
import PremiumAppLoader from "./components/loader/PremiumAppLoader";
import {
  hydrateBootContext,
  needsContextHydration,
  normalizeArrayPayload,
  normalizeStoredId,
  resolveBootWorkMode,
  resolveRequestedBootLevel,
} from "./bootContextPolicy";

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

const readBootStorage = () => ({
  savedLevel: safeGetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL),
  savedCompanyId: safeGetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID),
  savedBranchId: safeGetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID),
});

const applyBootStorageUpdates = ({
  activeLevel,
  activeCompanyId,
  activeBranchId,
}) => {
  safeSetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL, activeLevel);

  if (activeCompanyId) {
    safeSetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID, activeCompanyId);
  } else {
    safeRemoveStorage(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID);
  }

  if (activeBranchId) {
    safeSetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID, activeBranchId);
  } else {
    safeRemoveStorage(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
  }
};

const AppLayout = () => {
  const { workspaces, currentWorkspace, getMyWorkspaces, setCurrentWorkspace } =
    useWorkspace();
  const {
    currentCompany,
    getWorkspaceCompanies,
    getCompanyById,
    setCurrentCompany,
    clearCurrentCompany,
  } = useCompany();
  const {
    currentBranch,
    getCompanyBranches,
    getBranchById,
    setCurrentBranch,
    clearCurrentBranch,
  } = useBranch();
  const { getMyAccess } = useAccessControl();
  const { setWorkMode } = useWorkMode();

  const [isSyncComplete, setIsSyncComplete] = useState(() => {
    if (!storage.get(TOKEN_KEY)) return true;
    return false;
  });

  useEffect(() => {
    let isCancelled = false;

    const bootApplicationContext = async () => {
      try {
        if (!storage.get(TOKEN_KEY)) {
          if (!isCancelled) setIsSyncComplete(true);
          return;
        }

        // Ensure currentWorkspace exists before querying workspace-scoped access
        let activeWorkspace = currentWorkspace;
        if (!normalizeStoredId(activeWorkspace)) {
          const existingItem = Array.isArray(workspaces) ? workspaces[0] : null;
          activeWorkspace = existingItem?.workspace || existingItem || null;
          if (!normalizeStoredId(activeWorkspace)) {
            const fetchedWs = normalizeArrayPayload(
              await getMyWorkspaces().catch(() => []),
            );
            activeWorkspace =
              fetchedWs[0]?.workspace || fetchedWs[0] || null;
          }
          if (normalizeStoredId(activeWorkspace)) {
            setCurrentWorkspace(activeWorkspace);
          }
        }

        if (isCancelled) return;

        // Await authoritative backend permissions BEFORE resolving boot level or mode
        const myAccessPayload = await getMyAccess().catch(() => null);
        if (isCancelled) return;

        const resolvedWorkAccess = resolveMyWorkAccess(myAccessPayload);
        const allowedWorkLevels = resolvedWorkAccess?.allowedWorkLevels || null;
        const allowedWorkModes = resolvedWorkAccess?.allowedWorkModes || null;

        // Clamp/auto-resolve Work Mode according to role
        const bootMode = resolveBootWorkMode({
          storedMode: safeGetStorage("pahuch_work_mode"),
          wasSelected: safeGetStorage("pahuch_work_mode_selected") === "true",
          allowedWorkModes,
        });
        if (bootMode.workMode && (bootMode.autoSelected || bootMode.hasSelectedMode)) {
          setWorkMode(bootMode.workMode, true);
        }

        const { savedLevel, savedCompanyId, savedBranchId } = readBootStorage();
        const requestedLevel = resolveRequestedBootLevel({
          savedLevel,
          pathname: window.location.pathname,
          savedCompanyId,
          savedBranchId,
          allowedWorkLevels,
        });

        const shouldHydrate = needsContextHydration({
          requestedLevel,
          savedCompanyId,
          savedBranchId,
          currentCompany,
          currentBranch,
        });

        if (!shouldHydrate) {
          applyBootStorageUpdates({
            activeLevel: requestedLevel,
            activeCompanyId:
              requestedLevel === PIPELINE_LEVELS.WORKSPACE
                ? null
                : normalizeStoredId(currentCompany),
            activeBranchId:
              requestedLevel === PIPELINE_LEVELS.BRANCH
                ? normalizeStoredId(currentBranch)
                : null,
          });
          if (requestedLevel === PIPELINE_LEVELS.WORKSPACE) {
            getWorkspaceCompanies().catch(() => null);
          }
          if (!isCancelled) setIsSyncComplete(true);
          return;
        }

        const result = await hydrateBootContext({
          savedLevel,
          savedCompanyId,
          savedBranchId,
          pathname: window.location.pathname,
          workspaces,
          currentWorkspace: activeWorkspace,
          allowedWorkLevels,
          fetchWorkspaces: getMyWorkspaces,
          fetchCompanies: getWorkspaceCompanies,
          fetchBranches: getCompanyBranches,
          fetchCompanyById: getCompanyById,
          fetchBranchById: getBranchById,
        });

        if (isCancelled) return;

        if (
          normalizeStoredId(result.workspace) &&
          !normalizeStoredId(currentWorkspace)
        ) {
          setCurrentWorkspace(result.workspace);
        }

        if (result.company) {
          setCurrentCompany(result.company);
        } else {
          clearCurrentCompany();
        }

        if (result.branch) {
          setCurrentBranch(result.branch);
        } else {
          clearCurrentBranch();
        }

        applyBootStorageUpdates(result.storageUpdates);

        if (!isCancelled) setIsSyncComplete(true);
      } catch (error) {
        console.error(
          "Critical failure during layout initialization sync:",
          error,
        );
        if (!isCancelled) setIsSyncComplete(true);
      }
    };

    bootApplicationContext();

    return () => {
      isCancelled = true;
    };
    // Run once per AppLayout mount; StrictMode cleanup cancels Mount #1 so Mount #2 commits cleanly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
