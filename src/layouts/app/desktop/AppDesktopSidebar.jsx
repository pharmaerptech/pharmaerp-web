// src/layouts/app/desktop/AppDesktopSidebar.jsx

import { useMemo, useState, useRef, useEffect } from "react";
import {
  LogOut,
  ChevronLeft,
  Sparkles,
  Building2,
  Store,
  Settings,
  HelpCircle,
} from "lucide-react";
import { ROUTES } from "@/constants";
import useAuth from "@/features/auth/hooks/useAuth";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import { usePermission } from "@/hooks";
import { useWorkMode } from "@/contexts";
import { UIConfirmDialog } from "@/components/ui";
import { cn } from "@/lib/utils";

import {
  SIDEBAR_NAV_GROUPS,
  SidebarItem,
  SidebarLevelIndicator,
  SidebarWorkModeSwitcher,
  SidebarUserProfile,
  SidebarScrollArea,
  filterNavByPipeline,
  filterNavForCollapsedRail,
} from "../components/sidebar";
import { filterNavByPermission } from "../components/sidebar/filterNavByPermission";
import {
  useNavigationPipeline,
  PIPELINE_STORAGE_KEYS,
} from "@/contexts/NavigationPipelineContext";
import { clearAllHeldBillsStorage } from "@/features/sales/services/holdBillStorage";

const SIDEBAR_EXPANDED_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 68;
const AUTO_CLOSE_DELAY_MS = 1500;

const AppDesktopSidebar = ({
  collapsed = false,
  onToggleCollapse,
  onExpand,
  onCollapse,
}) => {
  const { user, logout, clearCredentials } = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isModeDialogOpen, setIsModeDialogOpen] = useState(false);
  const autoCloseTimerRef = useRef(null);
  const { currentCompany } = useCompany();
  const { currentBranch } = useBranch();
  const { currentWorkspace, activeWorkspace } = useWorkspace();
  const workspaceName = currentWorkspace?.name || activeWorkspace?.name || "Pahuch ERP";
  const { isSetupComplete, companyCompleted, branchCompleted, completedCount } = useSetupStatus();
  const { can, canAny, isOwner, workAccess } = usePermission();
  const { workMode } = useWorkMode();
  const { currentLevel } = useNavigationPipeline();

  // Clear timer when sidebar collapses or component unmounts
  useEffect(() => {
    if (collapsed && autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, [collapsed]);

  useEffect(() => {
    if ((isCompanyDropdownOpen || isModeDialogOpen || isLogoutDialogOpen) && autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, [isCompanyDropdownOpen, isModeDialogOpen, isLogoutDialogOpen]);

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (collapsed || isLogoutDialogOpen || isCompanyDropdownOpen || isModeDialogOpen) return;
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    autoCloseTimerRef.current = setTimeout(() => {
      if (!isLogoutDialogOpen && !isCompanyDropdownOpen && !isModeDialogOpen) {
        if (onCollapse) {
          onCollapse();
        } else if (onToggleCollapse) {
          onToggleCollapse();
        }
      }
    }, AUTO_CLOSE_DELAY_MS);
  };

  // Filter nav groups by active pipeline level and workMode first, then by permissions,
  // and finally apply curated essential rail filtering when the sidebar is collapsed.
  const visibleNavGroups = useMemo(() => {
    if (!isSetupComplete) {
      const onboardingGroups = [
        {
          id: "setup-flow",
          label: "Workspace Setup",
          items: [
            {
              id: "setup-center",
              label: "Setup Center",
              path: ROUTES.SETUP_CENTER,
              icon: Sparkles,
              badge: `${completedCount}/2`,
              collapsedRail: true,
            },
            {
              id: "companies",
              label: companyCompleted ? "Manage Companies" : "1. Create Company",
              path: companyCompleted ? ROUTES.COMPANIES : ROUTES.CREATE_COMPANY,
              icon: Building2,
              collapsedRail: true,
            },
            {
              id: "branches",
              label: branchCompleted ? "Manage Branches" : "2. Create Branch",
              path: branchCompleted ? ROUTES.BRANCHES : ROUTES.CREATE_BRANCH,
              icon: Store,
              disabled: !companyCompleted,
              collapsedRail: true,
            },
          ],
        },
        {
          id: "general-support",
          label: "Support",
          items: [
            {
              id: "settings",
              label: "Settings",
              path: ROUTES.SETTINGS,
              icon: Settings,
              collapsedRail: true,
            },
            {
              id: "help",
              label: "Help Center",
              path: ROUTES.HELP_CENTER,
              icon: HelpCircle,
              collapsedRail: true,
            },
          ],
        },
      ];

      return collapsed
        ? filterNavForCollapsedRail(onboardingGroups)
        : onboardingGroups;
    }

    const pipelineFiltered = filterNavByPipeline(SIDEBAR_NAV_GROUPS, currentLevel, workMode);
    const permissionFiltered = filterNavByPermission(
      pipelineFiltered,
      can,
      canAny,
      isOwner,
      {
        isSetupComplete,
        companyCompleted,
        branchCompleted,
        hasActiveCompany: !!currentCompany,
        hasActiveBranch: !!currentBranch,
        workAccess,
      },
    );
    return collapsed
      ? filterNavForCollapsedRail(permissionFiltered)
      : permissionFiltered;
  }, [
    collapsed,
    currentLevel,
    workMode,
    can,
    canAny,
    isOwner,
    workAccess,
    isSetupComplete,
    companyCompleted,
    branchCompleted,
    completedCount,
    currentCompany,
    currentBranch,
  ]);

  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      clearCredentials();
      clearAllHeldBillsStorage();
      try {
        localStorage.removeItem("pahuch_work_mode");
        localStorage.removeItem("pahuch_work_mode_selected");
        localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL);
        localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID);
        localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
      } catch {
        // ignore storage errors
      }
      setIsLogoutDialogOpen(false);
      window.location.href = ROUTES.LOGIN;
    }
  };

  const handleSidebarExpand = () => {
    if (onExpand) {
      onExpand();
    } else if (collapsed && onToggleCollapse) {
      onToggleCollapse();
    }
  };

  /**
   * When the sidebar drawer is closed/collapsed, clicking any non-interactive empty space
   * in the sidebar opens/expands the drawer. Clicking an icon/menu item/button performs
   * its own action and does NOT expand the drawer.
   */
  const handleSidebarClick = (e) => {
    if (!collapsed) return;

    // Check if the user clicked an interactive icon, button, link, or menu item
    const interactive = e.target.closest(
      "button, a, [role='button'], input, select, textarea, [data-sidebar-item]"
    );

    // If an icon or menu item or control was clicked:
    if (interactive) {
      // If it's explicitly marked to expand the sidebar (like the top level indicator icon or arrow button):
      if (
        interactive.dataset.sidebarExpand === "true" ||
        interactive.closest("[data-sidebar-expand='true']")
      ) {
        handleSidebarExpand();
      }
      return;
    }

    // User clicked empty space anywhere in the sidebar -> open the drawer
    handleSidebarExpand();
  };

  const currentWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  return (
    <div
      className="relative shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
      style={{ width: currentWidth }}
    >
      <aside
        onClick={handleSidebarClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "fixed left-0 top-0 z-30 h-[100dvh] border-r border-border bg-surface shadow-xs transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden flex flex-col justify-between",
          collapsed && "cursor-ew-resize select-none"
        )}
        style={{ width: currentWidth }}
      >
        {/* ── TOP: Setup Header OR Brand Header (Choose Mode) OR Level Indicator ── */}
        {!isSetupComplete ? (
          <div className="relative flex h-13 shrink-0 items-center justify-between border-b border-border px-3 bg-surface">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-7.5 shrink-0 items-center justify-center rounded-[8px] bg-primary/10 border border-primary/20 text-primary shadow-2xs">
                <Sparkles className="size-4" />
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-text leading-tight truncate">
                    {workspaceName}
                  </div>
                  <div className="text-[10px] text-primary font-semibold truncate">
                    Workspace Setup ({completedCount}/2)
                  </div>
                </div>
              )}
            </div>
            {!collapsed && onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="ml-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-text-muted transition hover:bg-surface-hover hover:text-text active:scale-[0.95]"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
          </div>
        ) : !workMode ? (
          <div className="relative flex h-13 shrink-0 items-center justify-between border-b border-border px-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-7.5 shrink-0 items-center justify-center rounded-[8px] bg-primary/10 border border-primary/20 text-primary shadow-2xs">
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="6" height="6" x="9" y="3" rx="1.5" />
                  <rect width="6" height="6" x="9" y="15" rx="1.5" />
                  <rect width="6" height="6" x="3" y="9" rx="1.5" />
                  <rect width="6" height="6" x="15" y="9" rx="1.5" />
                </svg>
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-text leading-tight truncate">
                    Pahuch ERP
                  </div>
                  <div className="text-[10px] text-text-muted font-medium truncate">
                    Choose Work Mode
                  </div>
                </div>
              )}
            </div>
            {!collapsed && onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="ml-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-text-muted transition hover:bg-surface-hover hover:text-text active:scale-[0.95]"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
          </div>
        ) : (
          <SidebarLevelIndicator
            collapsed={collapsed}
            onToggleCollapse={onToggleCollapse}
            onExpand={handleSidebarExpand}
            onOpenChange={setIsCompanyDropdownOpen}
          />
        )}

        {/* ── MIDDLE: Multi-Level Navigation Tree (WhatsApp-Style Auto-Hiding Scrollbar) ── */}
        <SidebarScrollArea className={collapsed ? "px-2 py-2 space-y-1.5" : "px-2 py-2 space-y-3"}>
          <nav className={collapsed ? "space-y-1.5" : "space-y-3"}>
            {visibleNavGroups.map((group) => (
              <div key={group.id} className="space-y-0.5">
                {/* Subtle Group Label (11px uppercase) */}
                {!collapsed && (
                  <div className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-text-muted/70">
                    {group.label}
                  </div>
                )}

                {/* Group Tree Items */}
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <SidebarItem
                      key={item.id || item.label}
                      item={item}
                      level={1}
                      collapsed={collapsed}
                      onExpand={handleSidebarExpand}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </SidebarScrollArea>

        {/* ── BOTTOM: Work Mode Switcher & User Profile ───────────── */}
        <div className="shrink-0">
          {isSetupComplete && (
            <SidebarWorkModeSwitcher
              collapsed={collapsed}
              onConfirmOpenChange={setIsModeDialogOpen}
            />
          )}
          <SidebarUserProfile
            user={user}
            collapsed={collapsed}
            onLogout={handleLogoutClick}
          />
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <UIConfirmDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Sign out"
        description="Are you sure you want to sign out of your account?"
        intent="danger"
        confirmText="Sign out"
        cancelText="Cancel"
        isLoading={isLoggingOut}
        icon={<LogOut className="size-5 sm:size-6 text-error" />}
      />
    </div>
  );
};

export default AppDesktopSidebar;
