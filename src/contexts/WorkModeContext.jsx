import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import usePermission from "@/hooks/usePermission";
import { clampWorkModeToAllowed } from "@/utils/workAccess";
import { uiToast } from "@/components/ui";

export const WORK_MODES = {
  OPERATION: "operation",
  VIEW: "view",
};

export const WORK_MODE_STORAGE_KEYS = {
  WORK_MODE: "pahuch_work_mode",
  MODE_SELECTED: "pahuch_work_mode_selected",
};

const WorkModeContext = createContext(null);

export const getSafeWorkMode = (mode) => {
  if (mode === WORK_MODES.VIEW) return WORK_MODES.VIEW;
  if (mode === WORK_MODES.OPERATION) return WORK_MODES.OPERATION;
  return null;
};

export const WorkModeProvider = ({ children }) => {
  const { allowedWorkModes, isOwner, isLoaded } = usePermission();

  const [workMode, setWorkModeState] = useState(() => {
    try {
      const savedMode = localStorage.getItem(WORK_MODE_STORAGE_KEYS.WORK_MODE);
      const isSelected =
        localStorage.getItem(WORK_MODE_STORAGE_KEYS.MODE_SELECTED) === "true";
      if (isSelected && savedMode) {
        return getSafeWorkMode(savedMode);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [hasSelectedMode, setHasSelectedMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem(WORK_MODE_STORAGE_KEYS.WORK_MODE);
      const isSelected =
        localStorage.getItem(WORK_MODE_STORAGE_KEYS.MODE_SELECTED) === "true";
      return Boolean(isSelected && savedMode);
    } catch {
      return false;
    }
  });

  const [isModeModalOpen, setIsModeModalOpen] = useState(false);

  const canSwitchWorkMode = useMemo(() => {
    if (isOwner) return true;
    if (!isLoaded || !Array.isArray(allowedWorkModes)) return true;
    return allowedWorkModes.length > 1;
  }, [isOwner, isLoaded, allowedWorkModes]);

  // Enforce strict Work Mode permissions once access profile loads
  useEffect(() => {
    if (!isLoaded || isOwner || !Array.isArray(allowedWorkModes) || allowedWorkModes.length === 0) {
      return;
    }

    if (allowedWorkModes.length === 1) {
      const soleMode = allowedWorkModes[0];
      if (workMode !== soleMode || !hasSelectedMode) {
        try {
          localStorage.setItem(WORK_MODE_STORAGE_KEYS.WORK_MODE, soleMode);
          localStorage.setItem(WORK_MODE_STORAGE_KEYS.MODE_SELECTED, "true");
        } catch {}
        setWorkModeState(soleMode);
        setHasSelectedMode(true);
        document.documentElement.dataset.workMode = soleMode;
      }
      return;
    }

    if (workMode && !allowedWorkModes.includes(workMode)) {
      const clamped = clampWorkModeToAllowed(workMode, allowedWorkModes);
      try {
        localStorage.setItem(WORK_MODE_STORAGE_KEYS.WORK_MODE, clamped);
        localStorage.setItem(WORK_MODE_STORAGE_KEYS.MODE_SELECTED, "true");
      } catch {}
      setWorkModeState(clamped);
      setHasSelectedMode(true);
      document.documentElement.dataset.workMode = clamped;
    }
  }, [isLoaded, isOwner, allowedWorkModes, workMode, hasSelectedMode]);

  const setWorkMode = useCallback(
    (newMode, markSelected = true) => {
      const safeMode = getSafeWorkMode(newMode);
      if (!safeMode) return false;

      if (
        isLoaded &&
        !isOwner &&
        Array.isArray(allowedWorkModes) &&
        allowedWorkModes.length > 0 &&
        !allowedWorkModes.includes(safeMode)
      ) {
        uiToast.warning(
          "Work Mode Restricted",
          `Your role does not permit ${safeMode === WORK_MODES.OPERATION ? "Operation" : "View"} Mode.`,
        );
        return false;
      }

      try {
        localStorage.setItem(WORK_MODE_STORAGE_KEYS.WORK_MODE, safeMode);
        if (markSelected) {
          localStorage.setItem(WORK_MODE_STORAGE_KEYS.MODE_SELECTED, "true");
          setHasSelectedMode(true);
        }
      } catch (err) {
        console.warn("Unable to save work mode to localStorage:", err);
      }

      setWorkModeState(safeMode);
      document.documentElement.dataset.workMode = safeMode;
      setIsModeModalOpen(false);
      return true;
    },
    [isLoaded, isOwner, allowedWorkModes],
  );

  const clearWorkMode = useCallback(() => {
    try {
      localStorage.removeItem(WORK_MODE_STORAGE_KEYS.WORK_MODE);
      localStorage.removeItem(WORK_MODE_STORAGE_KEYS.MODE_SELECTED);
    } catch (err) {
      console.warn("Unable to clear work mode in localStorage:", err);
    }
    setWorkModeState(null);
    setHasSelectedMode(false);
    delete document.documentElement.dataset.workMode;
  }, []);

  const toggleWorkMode = useCallback(() => {
    if (
      isLoaded &&
      !isOwner &&
      Array.isArray(allowedWorkModes) &&
      allowedWorkModes.length <= 1
    ) {
      uiToast.warning(
        "Work Mode Locked",
        "Your role is restricted to a single Work Mode.",
      );
      return;
    }

    setWorkModeState((prev) => {
      const nextMode =
        prev === WORK_MODES.VIEW ? WORK_MODES.OPERATION : WORK_MODES.VIEW;
      try {
        localStorage.setItem(WORK_MODE_STORAGE_KEYS.WORK_MODE, nextMode);
        localStorage.setItem(WORK_MODE_STORAGE_KEYS.MODE_SELECTED, "true");
        setHasSelectedMode(true);
      } catch (err) {
        console.warn("Unable to update work mode in localStorage:", err);
      }
      document.documentElement.dataset.workMode = nextMode;
      return nextMode;
    });
  }, [isLoaded, isOwner, allowedWorkModes]);

  const openModeModal = useCallback(() => {
    if (!canSwitchWorkMode) {
      uiToast.info(
        "Single Mode Role",
        "Your role only grants access to your current Work Mode.",
      );
      return;
    }
    setIsModeModalOpen(true);
  }, [canSwitchWorkMode]);

  const closeModeModal = useCallback(() => {
    setIsModeModalOpen(false);
  }, []);

  const resetModeSelection = useCallback(() => {
    clearWorkMode();
  }, [clearWorkMode]);

  useEffect(() => {
    if (workMode) {
      document.documentElement.dataset.workMode = workMode;
    } else {
      delete document.documentElement.dataset.workMode;
    }
  }, [workMode]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === WORK_MODE_STORAGE_KEYS.WORK_MODE) {
        const safeMode = getSafeWorkMode(e.newValue);
        const clamped =
          isLoaded && !isOwner && Array.isArray(allowedWorkModes) && safeMode
            ? clampWorkModeToAllowed(safeMode, allowedWorkModes)
            : safeMode;
        setWorkModeState(clamped);
        if (clamped) {
          document.documentElement.dataset.workMode = clamped;
        } else {
          delete document.documentElement.dataset.workMode;
        }
      }
      if (e.key === WORK_MODE_STORAGE_KEYS.MODE_SELECTED) {
        setHasSelectedMode(e.newValue === "true");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isLoaded, isOwner, allowedWorkModes]);

  const value = useMemo(
    () => ({
      workMode,
      isOperationMode: workMode === WORK_MODES.OPERATION,
      isViewMode: workMode === WORK_MODES.VIEW,
      hasSelectedMode,
      isModeModalOpen,
      allowedWorkModes,
      canSwitchWorkMode,
      setWorkMode,
      clearWorkMode,
      toggleWorkMode,
      openModeModal,
      closeModeModal,
      resetModeSelection,
    }),
    [
      workMode,
      hasSelectedMode,
      isModeModalOpen,
      allowedWorkModes,
      canSwitchWorkMode,
      setWorkMode,
      clearWorkMode,
      toggleWorkMode,
      openModeModal,
      closeModeModal,
      resetModeSelection,
    ],
  );

  return (
    <WorkModeContext.Provider value={value}>
      {children}
    </WorkModeContext.Provider>
  );
};

export const useWorkMode = () => {
  const context = useContext(WorkModeContext);
  if (!context) {
    throw new Error("useWorkMode must be used within a WorkModeProvider");
  }
  return context;
};

export default WorkModeContext;
