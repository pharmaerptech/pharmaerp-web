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
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import { ContextSwitchLoader } from "@/components/ui";
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

  // Explicit user-controlled level state (never mutated passively on route changes)
  const [activeLevel, setActiveLevelState] = useState(() =>
    readStoredLevel(location.pathname)
  );

  // Derive safe currentLevel once boot hydration completes
  const currentLevel = useMemo(() => {
    if (!isSyncComplete) return activeLevel;
    return reconcilePipelineLevel(activeLevel, {
      hasActiveCompany: Boolean(currentCompany?._id),
      hasActiveBranch: Boolean(currentBranch?._id),
    });
  }, [isSyncComplete, activeLevel, currentCompany?._id, currentBranch?._id]);

  // Persist currentLevel to localStorage cleanly
  useEffect(() => {
    if (!isSyncComplete) return;
    safeSetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL, currentLevel);
  }, [isSyncComplete, currentLevel]);

  // Explicit Level Setter
  const setLevel = useCallback((newLevel) => {
    if (!Object.values(PIPELINE_LEVELS).includes(newLevel)) return;
    setActiveLevelState(newLevel);
    safeSetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL, newLevel);
  }, []);

  // Programmatic Transition Trigger helper
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
    []
  );

  // Ascend to Workspace Level (Floor 1)
  const ascendToWorkspace = useCallback(() => {
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
    const targetRoute = getPipelineDefaultRoute(
      PIPELINE_LEVELS.WORKSPACE,
      workMode || WORK_MODES.VIEW
    );
    navigate(targetRoute);

    setTimeout(() => {
      setTransitionState((prev) => ({ ...prev, isOpen: false }));
    }, 650);
  }, [
    currentCompany,
    currentBranch,
    currentWorkspace,
    dispatch,
    clearCurrentBranch,
    clearCurrentCompany,
    setLevel,
    workMode,
    navigate,
  ]);

  // Ascend to Company Level (Floor 2)
  const ascendToCompany = useCallback(() => {
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
    const targetRoute = getPipelineDefaultRoute(
      PIPELINE_LEVELS.COMPANY,
      workMode || WORK_MODES.VIEW
    );
    navigate(targetRoute);

    setTimeout(() => {
      setTransitionState((prev) => ({ ...prev, isOpen: false }));
    }, 650);
  }, [
    currentBranch,
    currentCompany,
    dispatch,
    clearCurrentBranch,
    setLevel,
    workMode,
    navigate,
  ]);

  // Enter a specific company (Floor 1 -> Floor 2)
  const enterCompany = useCallback(
    (company, targetMode = null) => {
      const from = currentWorkspace?.name || "Workspace Level";
      const to = company?.name || currentCompany?.name || "Company Level";

      setTransitionState({
        isOpen: true,
        type: "company",
        title: "Entering Company Level",
        fromName: from,
        toName: to,
      });

      if (company?._id) {
        setCurrentCompany(company);
        clearCurrentBranch();
        safeSetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID, company._id);
        safeRemoveStorage(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
        getCompanyBranches(company._id).catch(() => null);
      }
      setLevel(PIPELINE_LEVELS.COMPANY);
      const effectiveMode = targetMode || workMode || WORK_MODES.VIEW;
      if (targetMode && targetMode !== workMode) {
        setWorkMode(targetMode, true);
      }
      const targetRoute = getPipelineDefaultRoute(
        PIPELINE_LEVELS.COMPANY,
        effectiveMode
      );
      navigate(targetRoute);

      setTimeout(() => {
        setTransitionState((prev) => ({ ...prev, isOpen: false }));
      }, 650);
    },
    [
      currentWorkspace,
      currentCompany,
      setCurrentCompany,
      clearCurrentBranch,
      getCompanyBranches,
      setLevel,
      workMode,
      setWorkMode,
      navigate,
    ]
  );

  // Enter a specific branch (Floor 2 -> Floor 3)
  const enterBranch = useCallback(
    (branch, targetMode = null) => {
      const from = currentCompany?.name || "Company Level";
      const to = branch?.name || currentBranch?.name || "Branch Level";

      setTransitionState({
        isOpen: true,
        type: "branch",
        title: "Entering Branch Level",
        fromName: from,
        toName: to,
      });

      if (branch?._id) {
        setCurrentBranch(branch);
        safeSetStorage(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID, branch._id);
      }
      setLevel(PIPELINE_LEVELS.BRANCH);
      const effectiveMode = targetMode || workMode || WORK_MODES.OPERATION;
      if (targetMode && targetMode !== workMode) {
        setWorkMode(targetMode, true);
      }
      const targetRoute = getPipelineDefaultRoute(
        PIPELINE_LEVELS.BRANCH,
        effectiveMode
      );
      navigate(targetRoute);

      setTimeout(() => {
        setTransitionState((prev) => ({ ...prev, isOpen: false }));
      }, 650);
    },
    [
      currentCompany,
      currentBranch,
      setCurrentBranch,
      setLevel,
      workMode,
      setWorkMode,
      navigate,
    ]
  );

  // Level-aware Mode Switcher: Strictly preserves active level
  const switchLevelMode = useCallback(
    (newMode, targetLevel = null) => {
      const isOp = newMode === WORK_MODES.OPERATION;
      const prevName =
        workMode === WORK_MODES.OPERATION ? "Operation Mode" : "View Mode";
      const newName = isOp ? "Operation Mode" : "View Mode";
      const modeType = isOp ? "mode-operation" : "mode-view";

      const effectiveLevel = reconcilePipelineLevel(
        targetLevel || currentLevel || PIPELINE_LEVELS.WORKSPACE,
        {
          hasActiveCompany: Boolean(currentCompany?._id),
          hasActiveBranch: Boolean(currentBranch?._id),
        }
      );

      setLevel(effectiveLevel);

      setTransitionState({
        isOpen: true,
        type: modeType,
        title: `Switching to ${newName}`,
        fromName: prevName,
        toName: newName,
      });

      setWorkMode(newMode, true);
      const targetRoute = getPipelineDefaultRoute(effectiveLevel, newMode);
      navigate(targetRoute);

      setTimeout(() => {
        setTransitionState((prev) => ({ ...prev, isOpen: false }));
      }, 700);
    },
    [
      currentLevel,
      workMode,
      currentCompany?._id,
      currentBranch?._id,
      setLevel,
      setWorkMode,
      navigate,
    ]
  );

  const value = useMemo(
    () => ({
      currentLevel,
      setLevel,
      isWorkspaceLevel: currentLevel === PIPELINE_LEVELS.WORKSPACE,
      isCompanyLevel: currentLevel === PIPELINE_LEVELS.COMPANY,
      isBranchLevel: currentLevel === PIPELINE_LEVELS.BRANCH,

      canDescendToCompany: Boolean(currentCompany?._id),
      canDescendToBranch: Boolean(currentBranch?._id),

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
      ascendToWorkspace,
      ascendToCompany,
      enterCompany,
      enterBranch,
      switchLevelMode,
      triggerTransition,
    ]
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
      "useNavigationPipeline must be used within a NavigationPipelineProvider"
    );
  }
  return context;
};

export default NavigationPipelineContext;
