// src/layouts/app/mobile/AppMobileSidebar.jsx

import { useMemo, useState } from "react";
import { LogOut, X } from "lucide-react";
import { ROUTES } from "@/constants";
import useAuth from "@/features/auth/hooks/useAuth";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import { usePermission } from "@/hooks";
import { useWorkMode } from "@/contexts";
import { UIConfirmDialog } from "@/components/ui";

import {
  SIDEBAR_NAV_GROUPS,
  SidebarItem,
  SidebarLevelIndicator,
  SidebarWorkModeSwitcher,
  SidebarUserProfile,
  SidebarScrollArea,
  filterNavByPipeline,
} from "../components/sidebar";
import { filterNavByPermission } from "../components/sidebar/filterNavByPermission";
import {
  useNavigationPipeline,
  PIPELINE_STORAGE_KEYS,
} from "@/contexts/NavigationPipelineContext";
import { clearAllHeldBillsStorage } from "@/features/sales/services/holdBillStorage";

const AppMobileSidebar = ({ open, onClose }) => {
  const { user, logout, clearCredentials } = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { currentCompany } = useCompany();
  const { currentBranch } = useBranch();
  const { isSetupComplete, companyCompleted, branchCompleted } = useSetupStatus();
  const { can, canAny, isOwner } = usePermission();
  const { workMode } = useWorkMode();
  const { currentLevel } = useNavigationPipeline();

  const visibleNavGroups = useMemo(() => {
    const pipelineFiltered = filterNavByPipeline(
      SIDEBAR_NAV_GROUPS,
      currentLevel,
      workMode
    );
    return filterNavByPermission(pipelineFiltered, can, canAny, isOwner, {
      isSetupComplete,
      companyCompleted,
      branchCompleted,
      hasActiveCompany: !!currentCompany,
      hasActiveBranch: !!currentBranch,
    });
  }, [
    currentLevel,
    workMode,
    can,
    canAny,
    isOwner,
    isSetupComplete,
    companyCompleted,
    branchCompleted,
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
      onClose();
      window.location.href = ROUTES.LOGIN;
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={[
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* Slide-out Mobile Sidebar Drawer */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-[275px] max-w-[85vw] border-r border-border bg-surface shadow-[var(--app-shadow-xl)]",
          "transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col justify-between overflow-hidden",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* ── TOP: Brand Header (Choose Mode) OR Level Header ───────────────────── */}
        {!workMode ? (
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
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-text leading-tight truncate">
                  Pahuch ERP
                </div>
                <div className="text-[10px] text-text-muted font-medium truncate">
                  Choose Work Mode
                </div>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sidebar"
                className="ml-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-text-muted transition hover:bg-surface-hover hover:text-text active:scale-[0.95]"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        ) : (
          <SidebarLevelIndicator
            collapsed={false}
            onToggleCollapse={onClose}
            showClose={true}
            onClose={onClose}
          />
        )}

        {/* ── MIDDLE: Navigation Tree ── */}
        <SidebarScrollArea className="px-2 py-2 space-y-3">
          <nav className="space-y-3">
            {visibleNavGroups.map((group) => (
              <div key={group.id} className="space-y-0.5">
                <div className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-text-muted/70">
                  {group.label}
                </div>

                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <SidebarItem
                      key={item.id || item.label}
                      item={item}
                      level={1}
                      collapsed={false}
                      onItemClick={onClose}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </SidebarScrollArea>

        {/* ── BOTTOM: Work Mode Switcher & User Profile ───────────────────────────────────── */}
        <div className="shrink-0">
          <SidebarWorkModeSwitcher collapsed={false} onModeChange={onClose} />
          <SidebarUserProfile
            user={user}
            collapsed={false}
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
    </>
  );
};

export default AppMobileSidebar;
