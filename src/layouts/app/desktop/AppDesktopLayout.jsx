// src/layouts/app/desktop/AppDesktopLayout.jsx

import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import { cn } from "@/lib/utils";
import { useMargShortcuts } from "@/hooks";
import { useWorkMode } from "@/contexts";
import { KeyboardShortcutsModal } from "@/components/ui";
import ChooseWorkModeView from "@/features/operations/components/ChooseWorkModeView";

import AppDesktopHeader from "./AppDesktopHeader";
import AppDesktopSidebar from "./AppDesktopSidebar";


const SIDEBAR_EXPANDED_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 68;

const AppDesktopLayout = () => {
  const location = useLocation();
  const { workMode } = useWorkMode();
  // Collapsed state (false = expanded 240px, true = collapsed icon rail 68px)
  const [collapsed, setCollapsed] = useState(false);
  const { currentCompany } = useCompany();
  const { currentBranch } = useBranch();

  // Global Marg ERP Shortcuts hook & modal state
  const {
    isShortcutsModalOpen,
    closeShortcutsModal,
    executeShortcut,
  } = useMargShortcuts();


  const isFixedViewportPage =
    location.pathname.startsWith("/sales") ||
    location.pathname.startsWith("/sale") ||
    location.pathname.startsWith("/billing") ||
    location.pathname.startsWith("/parties/customers") ||
    location.pathname.startsWith("/customers") ||
    location.pathname.startsWith("/parties/suppliers") ||
    location.pathname.startsWith("/suppliers") ||
    location.pathname.startsWith("/doctors") ||
    (location.pathname === "/purchases") ||
    location.pathname.startsWith("/inventory/transfer-orders") ||
    location.pathname.startsWith("/inventory/stock-metrics") ||
    location.pathname.startsWith("/stock-metrics") ||
    location.pathname === "/workspace-products" ||
    location.pathname.startsWith("/operations/business-days") ||
    location.pathname.startsWith("/operations/shifts") ||
    (location.pathname === "/companies" || location.pathname === "/companies/") ||
    (location.pathname === "/branches" || location.pathname === "/branches/") ||
    location.pathname.startsWith("/reports") ||
    location.pathname.startsWith("/finance");
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  return (
    <div className="flex min-h-[100dvh] w-full bg-bg text-text">
      {/* Redesigned Multi-level Desktop Sidebar */}
      <AppDesktopSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        onExpand={() => setCollapsed(false)}
        onCollapse={() => setCollapsed(true)}
      />

      {/* Main Content Area smoothly adjusting to sidebar width */}
      <div
        className="flex min-w-0 flex-1 flex-col transition-[margin-left] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ marginLeft: 0 }}
      >
        <AppDesktopHeader
          sidebarCollapsed={collapsed}
          sidebarWidth={sidebarWidth}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
        />

        <main
          className={cn(
            "mt-[62px] min-w-0 flex-1 flex flex-col",
            !workMode
              ? "min-h-[calc(100dvh-62px)] overflow-y-auto p-0"
              : isFixedViewportPage
              ? "h-[calc(100dvh-62px)] max-h-[calc(100dvh-62px)] overflow-hidden py-2 sm:py-2.5 px-3 sm:px-5"
              : "min-h-[calc(100dvh-62px)] overflow-y-auto py-3 sm:py-4 px-3 sm:px-5"
          )}
        >
          {!workMode ? (
            <ChooseWorkModeView />
          ) : (
            <Outlet key={`${currentCompany?._id}-${currentBranch?._id}`} />
          )}
        </main>
      </div>

      {/* Global Marg ERP Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={closeShortcutsModal}
        onSelectShortcut={executeShortcut}
      />
    </div>
  );
};


export default AppDesktopLayout;
