// src/contexts/NavigationPipelineContext.jsx
/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { useWorkMode, WORK_MODES } from "./WorkModeContext";
import usePermission from "@/hooks/usePermission";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import { ContextSwitchLoader, uiToast } from "@/components/ui";
import { clampWorkLevelToAllowed, clampWorkModeToAllowed } from "@/utils/workAccess";
import {
  PIPELINE_LEVELS,
  PIPELINE_STORAGE_KEYS,
  getLevelFromPathname,
  getPipelineDefaultRoute,
  reconcilePipelineLevel,
  isRouteAllowedForPipeline,
  resolveRoutePolicy,
} from "./routePipelinePolicy";

export {
  PIPELINE_LEVELS,
  PIPELINE_STORAGE_KEYS,
  getLevelFromPathname,
  getPipelineDefaultRoute,
  reconcilePipelineLevel,
  isRouteAllowedForPipeline,
  resolveRoutePolicy,
};

const NavigationPipelineContext = createContext(null);

const readStoredLevel = (fallbackPathname = "") => {
  try {
    const saved = localStorage.getItem(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL);
    if (
      saved === PIPELINE_LEVELS.WORKSPACE ||
      saved === PIPELINE_LEVELS.COMPANY ||
      saved === PIPELINE_LEVELS.BRANCH
    ) {
      return saved;
    }
  } catch {
    // ignore storage errors
  }

  const routeLevel = getLevelFromPathname(fallbackPathname);
  if (routeLevel) return routeLevel;

  return PIPELINE_LEVELS.WORKSPACE;
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

export const NavigationPipelineProvider = ({
  children,
  isSyncComplete = true,
}) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { workMode, setWorkMode } = useWorkMode();
  const {
    isOwner,
    isLoaded: isPermissionsLoaded,
    allowedWorkLevels,
    allowedWorkModes,
    highestWorkLevel,
    canWorkLevel,
    canWorkMode,
    workAccess,
  } = usePermission();

  const { currentWorkspace } = useWorkspace();
  const { currentCompany, setCurrentCompany, clearCurrentCompany } = useCompany();
  const {
    currentBranch,
    setCurrentBranch,
    clearCurrentBranch,
    getCompanyBranches,
  } = useBranch();

  const [transitionState, setTransitionState] = useState({
    isOpen: false,
    type: "workspace",
    title: "",
    fromName: "",
    toName: "",
  });

  const [activeLevel, setActiveLevelState] = useState(() =>
    readStoredLevel(location.pathname),
  );

  // Clamp activeLevel once boot hydration & role permissions settle
  const currentLevel = useMemo(() => {
    if (!isSyncComplete) return activeLevel;
    const enforcedLevels =
      isPermissionsLoaded && !isOwner ? allowedWorkLevels : null;

    return reconcilePipelineLevel(activeLevel, {
      hasActiveCompany: Boolean(currentCompany?._id || currentCompany?.id),
      hasActiveBranch: Boolean(currentBranch?._id || currentBranch?.id),
      allowedLevels: enforcedLevels,
    });
  }, [
    isSyncComplete,
    activeLevel,
    isPermissionsLoaded,
    isOwner,
    allowedWorkLevels,
    currentCompany?._id,
    currentCompany?.id,
    currentBranch?._id,
    currentBranch?.id,
  ]);

  useEffect(() => {
    if (!isSyncComplete) return;
    safeSetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL, currentLevel);
  }, [isSyncComplete, currentLevel]);

  const setLevel = useCallback(
    (newLevel) => {
      if (!Object.values(PIPELINE_LEVELS).includes(newLevel)) return;
      const safeLevel =
        isPermissionsLoaded && !isOwner && Array.isArray(allowedWorkLevels)
          ? clampWorkLevelToAllowed(newLevel, allowedWorkLevels)
          : newLevel;
      setActiveLevelState(safeLevel);
      safeSetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL, safeLevel);
    },
    [isPermissionsLoaded, isOwner, allowedWorkLevels],
  );

  const triggerTransition = useCallback(
    ({
      type = "company",
      title = "",
      fromName = "",
      toName = "",
      duration = 650,
    }) => {
      setTransitionState({
        isOpen: true,
        type,
        title,
        fromName,
        toName,
      });

      return new Promise((resolve) => {
        setTimeout(() => {
          setTransitionState((prev) => ({ ...prev, isOpen: false }));
          resolve();
        }, duration);
      });
    },
    [],
  );

  const resolvePermittedMode = useCallback(
    (requestedMode, fallbackDefault = WORK_MODES.VIEW) => {
      const candidate = requestedMode || workMode || fallbackDefault;
      if (isPermissionsLoaded && !isOwner && Array.isArray(allowedWorkModes)) {
        return clampWorkModeToAllowed(candidate, allowedWorkModes);
      }
      return candidate;
    },
    [workMode, isPermissionsLoaded, isOwner, allowedWorkModes],
  );

  const ascendToWorkspace = useCallback(() => {
    if (isPermissionsLoaded && !canWorkLevel(PIPELINE_LEVELS.WORKSPACE)) {
      uiToast.warning(
        "Workspace Level Restricted",
        "Your role does not permit Workspace level access.",
      );
      return;
    }

    const from =
      currentCompany?.name || currentBranch?.name || "Company Level";
    const to = currentWorkspace?.name || "Workspace Level";

    setTransitionState({
      isOpen: true,
      type: "workspace",
      title: "Moving up to Workspace Level",
      fromName: from,
      toName: to,
    });

    dispatch({ type: "APP/RESET_STATE" });
    clearCurrentBranch();
    clearCurrentCompany();

    safeRemoveStorage(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID);
    safeRemoveStorage(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);

    setLevel(PIPELINE_LEVELS.WORKSPACE);
    const effectiveMode = resolvePermittedMode(workMode, WORK_MODES.VIEW);
    const targetRoute = getPipelineDefaultRoute(
      PIPELINE_LEVELS.WORKSPACE,
      effectiveMode,
      isPermissionsLoaded && !isOwner ? workAccess : null,
    );
    navigate(targetRoute);

    setTimeout(() => {
      setTransitionState((prev) => ({ ...prev, isOpen: false }));
    }, 650);
  }, [
    isPermissionsLoaded,
    canWorkLevel,
    currentCompany,
    currentBranch,
    currentWorkspace,
    dispatch,
    clearCurrentBranch,
    clearCurrentCompany,
    setLevel,
    resolvePermittedMode,
    workMode,
    isOwner,
    workAccess,
    navigate,
  ]);

  const ascendToCompany = useCallback(() => {
    if (isPermissionsLoaded && !canWorkLevel(PIPELINE_LEVELS.COMPANY)) {
      uiToast.warning(
        "Company Level Restricted",
        "Your role is restricted to Branch level only.",
      );
      return;
    }

    const from = currentBranch?.name || "Branch Level";
    const to = currentCompany?.name || "Company Level";

    setTransitionState({
      isOpen: true,
      type: "company",
      title: "Moving up to Company Level",
      fromName: from,
      toName: to,
    });

    dispatch({ type: "APP/RESET_STATE" });
    clearCurrentBranch();

    safeRemoveStorage(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);

    setLevel(PIPELINE_LEVELS.COMPANY);
    const effectiveMode = resolvePermittedMode(workMode, WORK_MODES.VIEW);
    const targetRoute = getPipelineDefaultRoute(
      PIPELINE_LEVELS.COMPANY,
      effectiveMode,
      isPermissionsLoaded && !isOwner ? workAccess : null,
    );
    navigate(targetRoute);

    setTimeout(() => {
      setTransitionState((prev) => ({ ...prev, isOpen: false }));
    }, 650);
  }, [
    isPermissionsLoaded,
    canWorkLevel,
    currentBranch,
    currentCompany,
    dispatch,
    clearCurrentBranch,
    setLevel,
    resolvePermittedMode,
    workMode,
    isOwner,
    workAccess,
    navigate,
  ]);

  const enterCompany = useCallback(
    (company, targetMode = null) => {
      if (isPermissionsLoaded && !canWorkLevel(PIPELINE_LEVELS.COMPANY)) {
        uiToast.warning(
          "Company Level Restricted",
          "Your role does not permit Company level access.",
        );
        return;
      }

      if (targetMode && isPermissionsLoaded && !canWorkMode(targetMode)) {
        uiToast.warning(
          "Work Mode Restricted",
          `Your role does not permit ${targetMode === WORK_MODES.OPERATION ? "Operation" : "View"} Mode.`,
        );
        targetMode = null;
      }

      const from = currentWorkspace?.name || "Workspace Level";
      const to = company?.name || currentCompany?.name || "Company Level";

      setTransitionState({
        isOpen: true,
        type: "company",
        title: "Entering Company Level",
        fromName: from,
        toName: to,
      });

      const companyId = company?._id || company?.id;
      if (companyId) {
        setCurrentCompany(company);
        clearCurrentBranch();
        safeSetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID, String(companyId));
        safeRemoveStorage(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
        getCompanyBranches(companyId).catch(() => null);
      }
      setLevel(PIPELINE_LEVELS.COMPANY);
      const effectiveMode = resolvePermittedMode(targetMode || workMode, WORK_MODES.VIEW);
      if (effectiveMode && effectiveMode !== workMode) {
        setWorkMode(effectiveMode, true);
      }
      const targetRoute = getPipelineDefaultRoute(
        PIPELINE_LEVELS.COMPANY,
        effectiveMode,
        isPermissionsLoaded && !isOwner ? workAccess : null,
      );
      navigate(targetRoute);

      setTimeout(() => {
        setTransitionState((prev) => ({ ...prev, isOpen: false }));
      }, 650);
    },
    [
      isPermissionsLoaded,
      canWorkLevel,
      canWorkMode,
      currentWorkspace,
      currentCompany,
      setCurrentCompany,
      clearCurrentBranch,
      getCompanyBranches,
      setLevel,
      resolvePermittedMode,
      workMode,
      setWorkMode,
      isOwner,
      workAccess,
      navigate,
    ],
  );

  const enterBranch = useCallback(
    (branch, targetMode = null) => {
      if (isPermissionsLoaded && !canWorkLevel(PIPELINE_LEVELS.BRANCH)) {
        uiToast.warning(
          "Branch Level Restricted",
          "Your role does not permit Branch level access.",
        );
        return;
      }

      if (targetMode && isPermissionsLoaded && !canWorkMode(targetMode)) {
        uiToast.warning(
          "Work Mode Restricted",
          `Your role does not permit ${targetMode === WORK_MODES.OPERATION ? "Operation" : "View"} Mode.`,
        );
        targetMode = null;
      }

      const from = currentCompany?.name || "Company Level";
      const to = branch?.name || currentBranch?.name || "Branch Level";

      setTransitionState({
        isOpen: true,
        type: "branch",
        title: "Entering Branch Level",
        fromName: from,
        toName: to,
      });

      const activeCompanyId =
        currentCompany?._id ||
        currentCompany?.id ||
        branch?.companyId?._id ||
        branch?.companyId;
      if (activeCompanyId) {
        safeSetStorage(
          PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID,
          String(activeCompanyId),
        );
      }

      const branchId = branch?._id || branch?.id;
      if (branchId) {
        setCurrentBranch(branch);
        safeSetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID, String(branchId));
      }
      setLevel(PIPELINE_LEVELS.BRANCH);
      const effectiveMode = resolvePermittedMode(
        targetMode || workMode,
        WORK_MODES.OPERATION,
      );
      if (effectiveMode && effectiveMode !== workMode) {
        setWorkMode(effectiveMode, true);
      }
      const targetRoute = getPipelineDefaultRoute(
        PIPELINE_LEVELS.BRANCH,
        effectiveMode,
        isPermissionsLoaded && !isOwner ? workAccess : null,
      );
      navigate(targetRoute);

      setTimeout(() => {
        setTransitionState((prev) => ({ ...prev, isOpen: false }));
      }, 650);
    },
    [
      isPermissionsLoaded,
      canWorkLevel,
      canWorkMode,
      currentCompany,
      currentBranch,
      setCurrentBranch,
      setLevel,
      resolvePermittedMode,
      workMode,
      setWorkMode,
      isOwner,
      workAccess,
      navigate,
    ],
  );

  const switchLevelMode = useCallback(
    (newMode, targetLevel = null) => {
      if (isPermissionsLoaded && !canWorkMode(newMode)) {
        uiToast.warning(
          "Work Mode Restricted",
          `Your role does not allow switching to ${newMode === WORK_MODES.OPERATION ? "Operation" : "View"} Mode.`,
        );
        return;
      }

      const effectiveMode = resolvePermittedMode(newMode, WORK_MODES.VIEW);
      const requestedTargetLevel =
        targetLevel || currentLevel || PIPELINE_LEVELS.WORKSPACE;

      if (
        isPermissionsLoaded &&
        !isOwner &&
        !canWorkLevel(requestedTargetLevel)
      ) {
        uiToast.warning(
          "Level Restricted",
          `Your role does not permit "${requestedTargetLevel}" level access.`,
        );
      }

      const enforcedLevels =
        isPermissionsLoaded && !isOwner ? allowedWorkLevels : null;

      const effectiveLevel = reconcilePipelineLevel(requestedTargetLevel, {
        hasActiveCompany: Boolean(currentCompany?._id || currentCompany?.id),
        hasActiveBranch: Boolean(currentBranch?._id || currentBranch?.id),
        allowedLevels: enforcedLevels,
      });

      const isOp = effectiveMode === WORK_MODES.OPERATION;
      const prevName =
        workMode === WORK_MODES.OPERATION ? "Operation Mode" : "View Mode";
      const newName = isOp ? "Operation Mode" : "View Mode";
      const modeType = isOp ? "mode-operation" : "mode-view";

      setLevel(effectiveLevel);

      setTransitionState({
        isOpen: true,
        type: modeType,
        title: `Switching to ${newName}`,
        fromName: prevName,
        toName: newName,
      });

      setWorkMode(effectiveMode, true);
      const targetRoute = getPipelineDefaultRoute(
        effectiveLevel,
        effectiveMode,
        isPermissionsLoaded && !isOwner ? workAccess : null,
      );
      navigate(targetRoute);

      setTimeout(() => {
        setTransitionState((prev) => ({ ...prev, isOpen: false }));
      }, 700);
    },
    [
      isPermissionsLoaded,
      canWorkMode,
      canWorkLevel,
      resolvePermittedMode,
      currentLevel,
      isOwner,
      allowedWorkLevels,
      currentCompany?._id,
      currentCompany?.id,
      currentBranch?._id,
      currentBranch?.id,
      workMode,
      setLevel,
      setWorkMode,
      workAccess,
      navigate,
    ],
  );

  const canAscendToWorkspace = isPermissionsLoaded
    ? canWorkLevel(PIPELINE_LEVELS.WORKSPACE)
    : true;
  const canAscendToCompany = isPermissionsLoaded
    ? canWorkLevel(PIPELINE_LEVELS.COMPANY)
    : true;

  const value = useMemo(
    () => ({
      currentLevel,
      setLevel,
      isWorkspaceLevel: currentLevel === PIPELINE_LEVELS.WORKSPACE,
      isCompanyLevel: currentLevel === PIPELINE_LEVELS.COMPANY,
      isBranchLevel: currentLevel === PIPELINE_LEVELS.BRANCH,

      canDescendToCompany: Boolean(currentCompany?._id || currentCompany?.id),
      canDescendToBranch: Boolean(currentBranch?._id || currentBranch?.id),

      canAscendToWorkspace,
      canAscendToCompany,
      allowedWorkLevels,
      allowedWorkModes,
      highestWorkLevel,

      ascendToWorkspace,
      ascendToCompany,
      enterCompany,
      enterBranch,
      switchLevelMode,
      triggerTransition,
      getPipelineDefaultRoute,
    }),
    [
      currentLevel,
      setLevel,
      currentCompany,
      currentBranch,
      canAscendToWorkspace,
      canAscendToCompany,
      allowedWorkLevels,
      allowedWorkModes,
      highestWorkLevel,
      ascendToWorkspace,
      ascendToCompany,
      enterCompany,
      enterBranch,
      switchLevelMode,
      triggerTransition,
    ],
  );

  return (
    <NavigationPipelineContext.Provider value={value}>
      {children}
      <ContextSwitchLoader
        isOpen={transitionState.isOpen}
        type={transitionState.type}
        title={transitionState.title}
        fromName={transitionState.fromName}
        toName={transitionState.toName}
      />
    </NavigationPipelineContext.Provider>
  );
};

export const useNavigationPipeline = () => {
  const context = useContext(NavigationPipelineContext);
  if (!context) {
    throw new Error(
      "useNavigationPipeline must be used within a NavigationPipelineProvider",
    );
  }
  return context;
};

export default NavigationPipelineContext;
