// src/layouts/app/desktop/AppDesktopSidebar.jsx

import { useMemo, useState, useRef, useEffect } from "react";
import { LogOut } from "lucide-react";
import { ROUTES } from "@/constants";
import useAuth from "@/features/auth/hooks/useAuth";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import { usePermission } from "@/hooks";
import { UIConfirmDialog } from "@/components/ui";

import {
  SIDEBAR_NAV_GROUPS,
  SidebarItem,
  SidebarCompanySelector,
  SidebarUserProfile,
  SidebarScrollArea,
  SidebarContextualStatusWidget,
} from "../components/sidebar";
import { filterNavByPermission } from "../components/sidebar/filterNavByPermission";

const SIDEBAR_EXPANDED_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 68;
const AUTO_CLOSE_DELAY_MS = 1500;

const AppDesktopSidebar = ({
  collapsed = false,
  onToggleCollapse,
  onExpand,
  onCollapse,
  onClose,
}) => {
  const { user, logout, clearCredentials } = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const autoCloseTimerRef = useRef(null);
  const { currentCompany } = useCompany();
  const { currentBranch } = useBranch();
  const { isSetupComplete, companyCompleted, branchCompleted } = useSetupStatus();
  const { can, canAny, isOwner } = usePermission();

  // Clear timer when sidebar collapses or component unmounts
  useEffect(() => {
    if (collapsed && autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, [collapsed]);

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
    if (collapsed || isLogoutDialogOpen || isCompanyDropdownOpen) return;
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
    }
    autoCloseTimerRef.current = setTimeout(() => {
      if (!isLogoutDialogOpen && !isCompanyDropdownOpen) {
        if (onCollapse) {
          onCollapse();
        } else if (onToggleCollapse) {
          onToggleCollapse();
        }
      }
    }, AUTO_CLOSE_DELAY_MS);
  };

  // Filter nav groups by permissions, owner status, and setup completion
  const visibleNavGroups = useMemo(
    () =>
      filterNavByPermission(
        SIDEBAR_NAV_GROUPS,
        can,
        canAny,
        isOwner,
        { 
          isSetupComplete, 
          companyCompleted, 
          branchCompleted, 
          hasActiveCompany: !!currentCompany, 
          hasActiveBranch: !!currentBranch 
        },
      ),
    [can, canAny, isOwner, isSetupComplete, companyCompleted, branchCompleted, currentCompany, currentBranch],
  );

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

  const currentWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  return (
    <div
      className="relative shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
      style={{ width: currentWidth }}
    >
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="fixed left-0 top-0 z-30 h-[100dvh] border-r border-border bg-surface shadow-xs transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden flex flex-col justify-between"
        style={{ width: currentWidth }}
      >
        {/* ── TOP: Company & Branch Tabbed Selector ───────────────────── */}
        <SidebarCompanySelector
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          onClose={onClose}
          onOpenChange={setIsCompanyDropdownOpen}
        />

        {/* ── MIDDLE: Multi-Level Navigation Tree (WhatsApp-Style Auto-Hiding Scrollbar) ── */}
        <SidebarScrollArea className="px-2 py-2 space-y-3">
          <nav className="space-y-3">
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

        {/* ── BOTTOM: Context Status Widget & User Profile ───────────── */}
        <div className="shrink-0">
          <SidebarContextualStatusWidget collapsed={collapsed} />
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
