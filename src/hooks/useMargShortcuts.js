// pharmaerp-web/src/hooks/useMargShortcuts.js
//
// Global keyboard event handler for Marg ERP shortcut navigation.
// Intercepts hotkeys across the app, verifies user permissions, setup status,
// and active (currentLevel, workMode) pipeline boundaries before routing.

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { usePermission } from "@/hooks";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import {
  useWorkMode,
  useNavigationPipeline,
  isRouteAllowedForPipeline,
} from "@/contexts";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import { ROUTES } from "@/constants";
import { uiToast } from "@/components/ui";
import { MARG_SHORTCUTS } from "@/config/shortcutsConfig";

export const FOCUS_SEARCH_EVENT = "pharma-erp:focus-desktop-search";

export const useMargShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    can,
    canAny,
    isOwner,
    allowedWorkLevels,
    allowedWorkModes,
  } = usePermission();
  const { isSetupComplete, companyCompleted } = useSetupStatus();
  const { workMode } = useWorkMode();
  const { currentLevel } = useNavigationPipeline();
  const { currentCompany } = useCompany();
  const { currentBranch } = useBranch();

  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  const toggleShortcutsModal = useCallback(() => {
    setIsShortcutsModalOpen((prev) => !prev);
  }, []);

  const openShortcutsModal = useCallback(() => {
    setIsShortcutsModalOpen(true);
  }, []);

  const closeShortcutsModal = useCallback(() => {
    setIsShortcutsModalOpen(false);
  }, []);

  const isShortcutAccessible = useCallback(
    (shortcut) => {
      if (shortcut.requireOwner && !isOwner) return false;
      if (shortcut.permissions?.length) {
        return typeof canAny === "function"
          ? canAny(shortcut.permissions)
          : shortcut.permissions.some((p) => can(p));
      }
      if (shortcut.permission) {
        return typeof can === "function" ? can(shortcut.permission) : true;
      }
      return true;
    },
    [can, canAny, isOwner]
  );

  const isShortcutLockedBySetup = useCallback(
    (shortcut) => {
      if (isSetupComplete) return false;

      const path = shortcut.path || "";
      if (
        path === ROUTES.SETUP_CENTER ||
        path === ROUTES.SETTINGS ||
        path === ROUTES.HELP_CENTER ||
        path.startsWith("/companies")
      ) {
        return false;
      }
      if (path.startsWith("/branches")) {
        return !companyCompleted;
      }
      return true;
    },
    [isSetupComplete, companyCompleted]
  );

  const executeShortcut = useCallback(
    (shortcut) => {
      if (shortcut.path === "ACTION_SEARCH") {
        window.dispatchEvent(new CustomEvent(FOCUS_SEARCH_EVENT));
        return;
      }

      if (shortcut.path === "ACTION_SHORTCUTS_MODAL") {
        toggleShortcutsModal();
        return;
      }

      if (!workMode) {
        return;
      }

      if (!isShortcutAccessible(shortcut)) {
        uiToast.error(
          "Access Restricted",
          `You don't have permission to access ${shortcut.label}`
        );
        return;
      }

      if (isShortcutLockedBySetup(shortcut)) {
        uiToast.info(
          "Setup Required",
          `Please complete workspace setup to unlock ${shortcut.label}`
        );
        navigate(ROUTES.SETUP_CENTER);
        return;
      }

      const policyCheck = isRouteAllowedForPipeline(shortcut.path, {
        currentLevel,
        workMode,
        isSetupComplete,
        companyCompleted,
        hasActiveCompany: Boolean(currentCompany?._id),
        hasActiveBranch: Boolean(currentBranch?._id),
        allowedWorkLevels: !isOwner ? allowedWorkLevels : null,
        allowedWorkModes: !isOwner ? allowedWorkModes : null,
      });

      if (!policyCheck.allowed) {
        uiToast.info(
          "Shortcut Unavailable",
          policyCheck.reason === "role-mode-denied" || policyCheck.reason === "role-level-denied"
            ? `${shortcut.label} is restricted by your assigned role.`
            : policyCheck.reason === "mode-mismatch"
              ? `${shortcut.label} requires switching Work Mode in the sidebar.`
              : `${shortcut.label} is not available at your current level.`,
        );
        return;
      }

      if (shortcut.path && location.pathname !== shortcut.path) {
        navigate(shortcut.path);
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
        }
      }
    },
    [
      workMode,
      isShortcutAccessible,
      isShortcutLockedBySetup,
      currentLevel,
      isSetupComplete,
      companyCompleted,
      currentCompany?._id,
      currentBranch?._id,
      isOwner,
      allowedWorkLevels,
      allowedWorkModes,
      location.pathname,
      navigate,
      toggleShortcutsModal,
      isShortcutsModalOpen,
    ]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isTyping =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable ||
          activeEl.getAttribute("role") === "textbox");

      if (e.key === "Escape") {
        if (isShortcutsModalOpen) {
          e.preventDefault();
          setIsShortcutsModalOpen(false);
          return;
        }
      }

      if (!isTyping && e.key === "?" && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleShortcutsModal();
        return;
      }

      const isSearchCombo =
        ((e.ctrlKey || e.metaKey) &&
          (e.code === "KeyK" || e.key.toLowerCase() === "k")) ||
        (e.altKey && (e.code === "Slash" || e.key === "/"));

      if (isSearchCombo) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(FOCUS_SEARCH_EVENT));
        return;
      }

      if (e.altKey && (e.key === "F1" || e.code === "F1")) {
        e.preventDefault();
        toggleShortcutsModal();
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const keyChar = e.key ? e.key.toLowerCase() : "";
        const codeChar = e.code ? e.code.replace("Key", "").toLowerCase() : "";
        const isShift = e.shiftKey;

        const matched = MARG_SHORTCUTS.find((s) => {
          if (
            s.path === "ACTION_SEARCH" ||
            s.path === "ACTION_SHORTCUTS_MODAL"
          ) {
            return false;
          }

          const parts = s.keyCombo.split("+");
          const hasAlt = parts.includes("Alt");
          const hasShift = parts.includes("Shift");
          const keyPart = parts[parts.length - 1];

          if (!hasAlt) return false;
          if (hasShift !== isShift) return false;

          if (keyPart.startsWith("Key")) {
            const letter = keyPart.replace("Key", "").toLowerCase();
            return letter === keyChar || letter === codeChar;
          }

          if (keyPart === "Comma") {
            return keyChar === "," || e.code === "Comma";
          }

          return false;
        });

        if (matched) {
          e.preventDefault();
          executeShortcut(matched);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isShortcutsModalOpen, toggleShortcutsModal, executeShortcut]);

  return {
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    openShortcutsModal,
    closeShortcutsModal,
    toggleShortcutsModal,
    executeShortcut,
    shortcuts: MARG_SHORTCUTS,
  };
};

export default useMargShortcuts;
