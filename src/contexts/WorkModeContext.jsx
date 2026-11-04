import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

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
  const [workMode, setWorkModeState] = useState(() => {
    try {
      const savedMode = localStorage.getItem(WORK_MODE_STORAGE_KEYS.WORK_MODE);
      const isSelected = localStorage.getItem(WORK_MODE_STORAGE_KEYS.MODE_SELECTED) === "true";
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
      const isSelected = localStorage.getItem(WORK_MODE_STORAGE_KEYS.MODE_SELECTED) === "true";
      return Boolean(isSelected && savedMode);
    } catch {
      return false;
    }
  });

  const [isModeModalOpen, setIsModeModalOpen] = useState(false);

  const setWorkMode = useCallback((newMode, markSelected = true) => {
    const safeMode = getSafeWorkMode(newMode);
    if (!safeMode) return;

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
  }, []);

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
    setWorkModeState((prev) => {
      const nextMode = prev === WORK_MODES.VIEW ? WORK_MODES.OPERATION : WORK_MODES.VIEW;
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
  }, []);

  const openModeModal = useCallback(() => {
    setIsModeModalOpen(true);
  }, []);

  const closeModeModal = useCallback(() => {
    setIsModeModalOpen(false);
  }, []);

  const resetModeSelection = useCallback(() => {
    clearWorkMode();
  }, [clearWorkMode]);

  // Sync dataset on document root
  useEffect(() => {
    if (workMode) {
      document.documentElement.dataset.workMode = workMode;
    } else {
      delete document.documentElement.dataset.workMode;
    }
  }, [workMode]);

  // Synchronize across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === WORK_MODE_STORAGE_KEYS.WORK_MODE) {
        const safeMode = getSafeWorkMode(e.newValue);
        setWorkModeState(safeMode);
        if (safeMode) {
          document.documentElement.dataset.workMode = safeMode;
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
  }, []);

  const value = useMemo(
    () => ({
      workMode,
      isOperationMode: workMode === WORK_MODES.OPERATION,
      isViewMode: workMode === WORK_MODES.VIEW,
      hasSelectedMode,
      isModeModalOpen,
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
      setWorkMode,
      clearWorkMode,
      toggleWorkMode,
      openModeModal,
      closeModeModal,
      resetModeSelection,
    ]
  );

  return <WorkModeContext.Provider value={value}>{children}</WorkModeContext.Provider>;
};

export const useWorkMode = () => {
  const context = useContext(WorkModeContext);
  if (!context) {
    throw new Error("useWorkMode must be used within a WorkModeProvider");
  }
  return context;
};

export default WorkModeContext;
