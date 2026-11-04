// src/layouts/app/components/header/HeaderSearchBar.jsx

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, X, Lock } from "lucide-react";

import { usePermission, FOCUS_SEARCH_EVENT } from "@/hooks";
import { ROUTES } from "@/constants";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import { useWorkMode } from "@/contexts";
import { useNavigationPipeline } from "@/contexts/NavigationPipelineContext";
import { uiToast } from "@/components/ui";
import { getAccessibleSearchCommands } from "./accessibleSearchCommands";

const HeaderSearchBar = ({ className = "" }) => {
  const navigate = useNavigate();
  const { can, canAny, isOwner } = usePermission();
  const { isSetupComplete, companyCompleted } = useSetupStatus();
  const { workMode } = useWorkMode();
  const { currentLevel } = useNavigationPipeline();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchInputRef = useRef(null);
  const containerRef = useRef(null);
  const commandListRef = useRef(null);

  const isMac =
    typeof window !== "undefined" &&
    navigator.platform?.toUpperCase().indexOf("MAC") >= 0;
  const shortcutText = isMac ? "⌘ K" : "Ctrl + K";


  // Compute all commands the current user is permitted to see, scoped by currentLevel
  const accessibleCommands = useMemo(() => {
    return getAccessibleSearchCommands(can, canAny, isOwner, workMode, currentLevel);
  }, [can, canAny, isOwner, workMode, currentLevel]);

  // Tag commands with setup locked status
  const commandsWithLockStatus = useMemo(() => {
    return accessibleCommands.map((cmd) => {
      let isLocked = false;

      if (!isSetupComplete) {
        const path = cmd.path || "";
        const id = cmd.id || "";

        if (
          path === ROUTES.SETUP_CENTER ||
          path === ROUTES.SETTINGS ||
          path === ROUTES.HELP_CENTER ||
          id === "setup-center" ||
          id === "settings" ||
          id === "help"
        ) {
          isLocked = false;
        } else if (id === "companies" || path.startsWith("/companies")) {
          isLocked = false;
        } else if (id === "branches" || path.startsWith("/branches")) {
          isLocked = !companyCompleted;
        } else {
          isLocked = true;
        }
      }

      return {
        ...cmd,
        isLocked,
      };
    });
  }, [accessibleCommands, isSetupComplete, companyCompleted]);

  // Filter commands by user query
  const filteredCommands = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      // Show default top accessible navigation & quick actions
      return commandsWithLockStatus.slice(0, 8);
    }
    return commandsWithLockStatus.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(query) ||
        (cmd.fullLabel && cmd.fullLabel.toLowerCase().includes(query)) ||
        (cmd.category && cmd.category.toLowerCase().includes(query))
    );
  }, [commandsWithLockStatus, searchQuery]);

  // Reset selectedIndex whenever filtered items change or popover opens
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, searchFocused]);

  // Global Keyboard Shortcut (Cmd+K / Ctrl+K / Alt+/) and Custom Focus Event
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const isSearchCombo =
        ((e.metaKey || e.ctrlKey) && (e.key === "f" || e.key === "k" || e.code === "KeyK")) ||
        (e.altKey && (e.key === "/" || e.code === "Slash"));

      if (isSearchCombo) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      }
    };

    const handleFocusSearchEvent = () => {
      searchInputRef.current?.focus();
      setSearchFocused(true);
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener(FOCUS_SEARCH_EVENT, handleFocusSearchEvent);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener(FOCUS_SEARCH_EVENT, handleFocusSearchEvent);
    };
  }, []);


  const handleSelectCommand = (cmd) => {
    if (cmd.isLocked) {
      uiToast.info("Setup Required", `Complete setup to unlock ${cmd.label}`);
      navigate(ROUTES.SETUP_CENTER);
    } else {
      navigate(cmd.path);
    }
    setSearchFocused(false);
    setSearchQuery("");
    searchInputRef.current?.blur();
  };

  // Keyboard navigation within the search input
  const handleInputKeyDown = (e) => {
    if (!searchFocused && (e.key === "ArrowDown" || e.key === "Enter")) {
      setSearchFocused(true);
      return;
    }

    if (!filteredCommands.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelectCommand(filteredCommands[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setSearchFocused(false);
      searchInputRef.current?.blur();
    }
  };

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll highlighted item into view during keyboard navigation (Arrow Up / Down)
  useEffect(() => {
    if (selectedIndex >= 0 && commandListRef.current) {
      const container = commandListRef.current;
      const selectedEl = container.children[selectedIndex];
      if (selectedEl) {
        if (selectedIndex === 0) {
          container.scrollTop = 0;
        } else if (selectedIndex === filteredCommands.length - 1) {
          container.scrollTop = container.scrollHeight;
        } else if (typeof selectedEl.scrollIntoView === "function") {
          selectedEl.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      }
    }
  }, [selectedIndex, filteredCommands.length]);

  return (
    <div
      ref={containerRef}
      className={`group relative flex w-full max-w-[460px] lg:max-w-[540px] items-center ${searchFocused ? "z-[60]" : ""} ${className}`}
    >
      {/* Search Input styled with design system tokens */}
      <div className="relative flex w-full items-center">
        <span className="pointer-events-none absolute left-3 flex items-center text-text-muted transition-colors duration-150 group-focus-within:text-primary">
          <Search className="size-4 shrink-0" />
        </span>

        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search or type a command"
          className="h-10 w-full rounded-[12px] border border-border bg-surface pl-9.5 pr-14 text-sm text-text placeholder:text-text-muted/60 outline-none transition-all duration-150 ease-out hover:border-border-strong focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20 shadow-2xs"
        />

        {/* Clear Button or Keyboard Shortcut Badge */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                searchInputRef.current?.focus();
              }}
              className="flex size-5 cursor-pointer items-center justify-center rounded-full text-text-muted hover:bg-surface-hover hover:text-text"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none flex select-none items-center gap-0.5 rounded-[5px] border border-border/70 bg-surface-alt px-1.5 py-0.5 text-[10px] font-mono font-medium text-text-muted shadow-2xs">
              {shortcutText}
            </kbd>
          )}
        </div>
      </div>

      {/* Floating Command Palette Popover */}
      <AnimatePresence>
        {searchFocused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 w-full sm:min-w-[420px] max-w-[calc(100vw-2rem)] top-[110%] z-[60] overflow-hidden rounded-[14px] border border-border bg-surface p-2 shadow-[var(--app-shadow-xl)]"
          >
            <div className="flex items-center justify-between px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider text-text-muted/70">
              <span>Quick Navigation & Commands</span>
              <span className="text-[10px] font-mono font-normal lowercase">Use ↑ ↓ to navigate, ↵ to select</span>
            </div>

            <div
              ref={commandListRef}
              className="max-h-[260px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-0.5 pt-1"
            >
              {filteredCommands.length ? (
                filteredCommands.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id || cmd.path || cmd.label}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => handleSelectCommand(cmd)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-[8px] px-2.5 py-2 text-left text-xs transition active:scale-[0.98] ${
                        cmd.isLocked ? "opacity-60" : ""
                      } ${
                        isSelected
                          ? "bg-primary-soft/60 text-primary font-bold shadow-2xs"
                          : "text-text hover:bg-surface-hover"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex size-6 shrink-0 items-center justify-center rounded-[5px] transition ${
                            isSelected
                              ? "bg-primary text-white shadow-2xs"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          <Icon className="size-3.5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{cmd.label}</span>
                            {cmd.isLocked && (
                              <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.2 text-[9px] font-semibold bg-surface-alt text-text-muted border border-border/60">
                                <Lock className="size-2" /> Locked
                              </span>
                            )}
                          </div>
                          {cmd.fullLabel && cmd.fullLabel !== cmd.label && (
                            <span className="text-[10px] text-text-muted/70 truncate">
                              {cmd.fullLabel}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        className={`size-3.5 shrink-0 transition-transform ${
                          isSelected ? "text-primary translate-x-0.5" : "text-text-muted/60"
                        }`}
                      />
                    </button>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-text-muted">
                  No matching commands found for &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeaderSearchBar;
