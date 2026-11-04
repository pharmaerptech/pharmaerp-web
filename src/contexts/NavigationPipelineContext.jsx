// src/contexts/NavigationPipelineContext.jsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { ROUTES } from "@/constants";
import { useWorkMode, WORK_MODES } from "./WorkModeContext";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import { ContextSwitchLoader } from "@/components/ui";

export const PIPELINE_LEVELS = {
  WORKSPACE: "workspace",
  COMPANY: "company",
  BRANCH: "branch",
};

export const PIPELINE_STORAGE_KEYS = {
  ACTIVE_LEVEL: "pahuch_pipeline_level",
  ACTIVE_COMPANY_ID: "pahuch_active_company_id",
  ACTIVE_BRANCH_ID: "pahuch_active_branch_id",
};

/**
 * Maps a URL pathname to its intrinsic pipeline level.
 * Returns null if the route is neutral (e.g. /settings, /help-center, /).
 */
export const getLevelFromPathname = (pathname = "", currentContext = {}) => {
  if (!pathname) return null;
  const path = pathname.toLowerCase();

  // Root generic dashboard or home route: resolve contextually
  if (path === "/dashboard" || path === "/dashboard/" || path === "/") {
    if (!currentContext?.companyId) return PIPELINE_LEVELS.WORKSPACE;
    if (currentContext?.companyId && !currentContext?.branchId) return PIPELINE_LEVELS.COMPANY;
    return PIPELINE_LEVELS.BRANCH;
  }

  // 1. Workspace Level Routes
  if (
    path === "/dashboard/workspace" ||
    path === ROUTES.WORKSPACE_DASHBOARD ||
    path.startsWith("/companies") ||
    path.startsWith("/members") ||
    path.startsWith("/access-control") ||
    path.startsWith("/roles") ||
    path.startsWith("/subscription") ||
    path.startsWith("/setup-center")
  ) {
    return PIPELINE_LEVELS.WORKSPACE;
  }

  // 2. Company Level Routes
  if (
    path === "/dashboard/company" ||
    path === ROUTES.COMPANY_DASHBOARD ||
    path.startsWith("/branches") ||
    path.startsWith("/parties/customers") ||
    path.startsWith("/customers") ||
    path.startsWith("/parties/suppliers") ||
    path.startsWith("/suppliers") ||
    path.startsWith("/doctors") ||
    path.startsWith("/finance") ||
    path.startsWith("/treasury/bank-accounts") ||
    path.startsWith("/bank-accounts")
  ) {
    return PIPELINE_LEVELS.COMPANY;
  }

  // 3. Branch Level Routes
  if (
    path === "/dashboard/branch" ||
    path === ROUTES.BRANCH_DASHBOARD ||
    path.startsWith("/sales") ||
    path.startsWith("/sale") ||
    path.startsWith("/billing") ||
    path.startsWith("/credit-notes") ||
    path.startsWith("/purchases") ||
    path.startsWith("/workspace-products") ||
    path.startsWith("/inventory") ||
    path.startsWith("/stock-metrics") ||
    path.startsWith("/operations/shifts") ||
    path.startsWith("/operations/business-days") ||
    path.startsWith("/finance/treasury/cash-management/branch-cash") ||
    path.startsWith("/payment-qrs") ||
    path.startsWith("/upi-transactions") ||
    path.startsWith("/cash-transactions") ||
    path.startsWith("/cash-counter")
  ) {
    return PIPELINE_LEVELS.BRANCH;
  }

  // Neutral routes (like /reports-hub when accessed directly, /settings, /help-center)
  if (path.startsWith("/reports")) {
    return PIPELINE_LEVELS.BRANCH;
  }

  return null;
};

/**
 * Returns default landing route for any (level, mode) combination
 */
export const getPipelineDefaultRoute = (level, workMode) => {
  const isOp = workMode === WORK_MODES.OPERATION;

  switch (level) {
    case PIPELINE_LEVELS.WORKSPACE:
      return isOp ? "/companies" : ROUTES.WORKSPACE_DASHBOARD;
    case PIPELINE_LEVELS.COMPANY:
      return isOp ? "/branches" : ROUTES.COMPANY_DASHBOARD;
    case PIPELINE_LEVELS.BRANCH:
    default:
      return isOp ? ROUTES.SALES : ROUTES.BRANCH_DASHBOARD;
  }
};

const NavigationPipelineContext = createContext(null);

export const NavigationPipelineProvider = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { workMode, setWorkMode } = useWorkMode();

  const { currentWorkspace } = useWorkspace();
  const { currentCompany, setCurrentCompany, clearCurrentCompany } = useCompany();
  const { currentBranch, setCurrentBranch, clearCurrentBranch, getCompanyBranches } = useBranch();

  // Centralized Level Transition Loader State
  const [transitionState, setTransitionState] = useState({
    isOpen: false,
    type: "workspace",
    title: "",
    fromName: "",
    toName: "",
  });

  // Resolve initial level based on stored preference or route or fallback
  const [activeLevel, setActiveLevelState] = useState(() => {
    const routeLevel = getLevelFromPathname(location.pathname);
    if (routeLevel) return routeLevel;

    try {
      const saved = localStorage.getItem(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL);
      if (
        saved === PIPELINE_LEVELS.WORKSPACE ||
        saved === PIPELINE_LEVELS.COMPANY ||
        saved === PIPELINE_LEVELS.BRANCH
      ) {
        return saved;
      }
    } catch {}

    // Default entry floor is WORKSPACE
    return PIPELINE_LEVELS.WORKSPACE;
  });

  const prevPathRef = useRef(location.pathname);

  // Keep activeLevel in sync whenever user navigates directly to a route
  useEffect(() => {
    // If an elevator transition is in progress, do not let route sync fight it
    if (transitionState.isOpen) {
      prevPathRef.current = location.pathname;
      return;
    }

    // Only sync if the URL pathname actually changed
    if (prevPathRef.current === location.pathname) {
      return;
    }
    prevPathRef.current = location.pathname;

    const routeLevel = getLevelFromPathname(location.pathname, {
      companyId: currentCompany?._id,
      branchId: currentBranch?._id,
    });

    if (routeLevel && routeLevel !== activeLevel) {
      setActiveLevelState(routeLevel);
      try {
        localStorage.setItem(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL, routeLevel);
      } catch {}
    }
  }, [
    location.pathname,
    activeLevel,
    transitionState.isOpen,
    currentCompany?._id,
    currentBranch?._id,
  ]);

  // Explicit Level Setter
  const setLevel = useCallback((newLevel) => {
    if (!Object.values(PIPELINE_LEVELS).includes(newLevel)) return;
    setActiveLevelState(newLevel);
    try {
      localStorage.setItem(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL, newLevel);
    } catch {}
  }, []);

  // Programmatic Transition Trigger helper
  const triggerTransition = useCallback(
    ({ type = "company", title = "", fromName = "", toName = "", duration = 650 }) => {
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
    const from = currentCompany?.name || currentBranch?.name || "Company Level";
    const to = currentWorkspace?.name || "Workspace Level";

    setTransitionState({
      isOpen: true,
      type: "workspace",
      title: "Moving up to Workspace Level",
      fromName: from,
      toName: to,
    });

    // 1. Immediately clear both company & branch context in Redux and reset slice state
    dispatch({ type: "APP/RESET_STATE" });
    clearCurrentBranch();
    clearCurrentCompany();

    // 2. Clear company & branch context in local storage
    try {
      localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID);
      localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
    } catch {}

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

    // 1. Immediately clear branch context in Redux and reset branch slice state
    dispatch({ type: "APP/RESET_STATE" });
    clearCurrentBranch();

    // 2. Clear branch context in local storage
    try {
      localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
    } catch {}

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
        try {
          localStorage.setItem(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID, company._id);
          localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
        } catch {}
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
        try {
          localStorage.setItem(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID, branch._id);
        } catch {}
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
    [currentCompany, currentBranch, setCurrentBranch, setLevel, workMode, setWorkMode, navigate]
  );

  // Level-aware Mode Switcher: Strictly preserves active level
  const switchLevelMode = useCallback(
    (newMode, targetLevel = null) => {
      const isOp = newMode === WORK_MODES.OPERATION;
      const prevName = workMode === WORK_MODES.OPERATION ? "Operation Mode" : "View Mode";
      const newName = isOp ? "Operation Mode" : "View Mode";
      const modeType = isOp ? "mode-operation" : "mode-view";

      // Strictly maintain the active level (or targetLevel if explicitly provided)
      const effectiveLevel = targetLevel || activeLevel || PIPELINE_LEVELS.WORKSPACE;

      // Lock level explicitly in state & storage
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
    [activeLevel, workMode, setLevel, setWorkMode, navigate]
  );

  const value = useMemo(
    () => ({
      currentLevel: activeLevel,
      setLevel,
      isWorkspaceLevel: activeLevel === PIPELINE_LEVELS.WORKSPACE,
      isCompanyLevel: activeLevel === PIPELINE_LEVELS.COMPANY,
      isBranchLevel: activeLevel === PIPELINE_LEVELS.BRANCH,

      // Capabilities & Guards
      canDescendToCompany: Boolean(currentCompany?._id),
      canDescendToBranch: Boolean(currentBranch?._id),

      // Elevator Navigation Actions
      ascendToWorkspace,
      ascendToCompany,
      enterCompany,
      enterBranch,
      switchLevelMode,
      triggerTransition,
      getPipelineDefaultRoute,
    }),
    [
      activeLevel,
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
