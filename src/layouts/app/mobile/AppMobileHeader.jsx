// src/layouts/app/mobile/AppMobileHeader.jsx

import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Search, X, ChevronRight, Plus } from "lucide-react";

import { ROUTES } from "@/constants";
import { usePermission } from "@/hooks";
import { useWorkMode } from "@/contexts";
import { useNavigationPipeline } from "@/contexts/NavigationPipelineContext";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import {
  HeaderNotifications,
  HeaderProfileDropdown,
  HeaderBreadcrumbTrail,
  getHeaderBreadcrumbs,
} from "@/layouts/app/components/header";
import { getAccessibleSearchCommands } from "@/layouts/app/components/header/accessibleSearchCommands";
import { UIIconButton } from "@/components/ui";

const getPageTitle = (pathname) => {
  if (pathname === "/dashboard/branch" || pathname === ROUTES.BRANCH_DASHBOARD)
    return "Branch Dashboard";
  if (pathname === "/dashboard/company" || pathname === ROUTES.COMPANY_DASHBOARD)
    return "Company Dashboard";
  if (pathname === "/dashboard/workspace" || pathname === ROUTES.WORKSPACE_DASHBOARD)
    return "Workspace Dashboard";
  if (!pathname || pathname === "/" || pathname === ROUTES.HOME || pathname.startsWith("/dashboard"))
    return "Dashboard";
  if (pathname.startsWith("/sales/credit-notes")) return "Credit Notes";
  if (pathname.startsWith("/sales/edit") || pathname.startsWith("/sale/edit")) return "Edit Invoice";
  if (pathname.startsWith("/sales-returns")) return "Sales Returns";
  if (pathname.startsWith("/sales") || pathname.startsWith("/sale")) return "POS Billing";
  if (pathname.startsWith("/billing")) return "Sale Invoices";
  if (pathname.startsWith("/purchases")) return "Purchases";
  if (pathname.startsWith("/reports")) return "Reports Hub";
  if (pathname.startsWith("/operations/shifts")) return "Shifts";
  if (pathname.startsWith("/operations/business-days")) return "Business Days";
  if (pathname.startsWith("/inventory/stock-metrics") || pathname.startsWith("/stock-metrics"))
    return "Stock Metrics";
  if (pathname.startsWith("/inventory/transfer-orders")) return "Transfer Orders";
  if (pathname.startsWith("/workspace-products")) return "Custom Products";
  if (pathname.startsWith("/catalog/global-products")) return "Global Catalog";
  if (pathname.startsWith("/catalog")) return "Catalog";
  if (pathname.startsWith("/parties/customers")) return "Customers";
  if (pathname.startsWith("/parties/suppliers")) return "Suppliers";
  if (pathname.startsWith("/parties")) return "Parties";
  if (pathname.startsWith("/doctors")) return "Doctors";
  if (pathname.startsWith("/finance/treasury/branch-cash")) return "Cash Counter";
  if (pathname.startsWith("/finance/treasury/payment-qrs")) return "Counter QR";
  if (pathname.startsWith("/finance/treasury/upi-transactions")) return "UPI Transactions";
  if (pathname.startsWith("/finance/treasury/cash-transactions")) return "Cash Transactions";
  if (pathname.startsWith("/finance/treasury/bank-accounts")) return "Bank Accounts";
  if (pathname.startsWith("/finance/gst-ledger/gstr-1")) return "GSTR-1";
  if (pathname.startsWith("/finance/gst-ledger/gstr-2")) return "GSTR-2";
  if (pathname.startsWith("/finance/gst-ledger/gstr-3b")) return "GSTR-3B";
  if (pathname.startsWith("/finance/treasury")) return "Treasury";
  if (pathname.startsWith("/finance")) return "Finance";
  if (pathname.startsWith("/marketplace")) return "Marketplace";
  if (
    pathname.startsWith("/roles-permissions/create") ||
    pathname.startsWith("/access-control/roles/create")
  ) {
    return "Create Role";
  }
  if (
    pathname.includes("/edit") &&
    (pathname.startsWith("/roles-permissions") ||
      pathname.startsWith("/access-control"))
  ) {
    return "Edit Role";
  }
  if (
    pathname.startsWith("/roles-permissions/permissions") ||
    pathname.startsWith("/access-control/permissions")
  ) {
    return "Permissions";
  }
  if (
    pathname.startsWith("/roles-permissions/") ||
    pathname.startsWith("/access-control/roles/")
  ) {
    return "Role Details";
  }
  if (
    pathname.startsWith("/roles-permissions") ||
    pathname.startsWith("/access-control")
  ) {
    return "Roles & Permissions";
  }
  if (pathname.startsWith("/members")) return "Staff & Members";
  if (pathname.startsWith("/branches")) return "Branches";
  if (pathname.startsWith("/companies")) return "Companies";
  if (pathname.startsWith("/workspace")) return "Workspace";
  if (pathname.startsWith("/setup")) return "Setup Center";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/help-center")) return "Help & Support";
  if (pathname.startsWith("/me") || pathname.startsWith("/profile")) return "My Profile";

  const segment = pathname.split("/").filter(Boolean).pop() || "Dashboard";
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const AppMobileHeader = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { can, canAny, isOwner, workAccess, canWorkMode, canWorkLevel } = usePermission();
  const { isSetupComplete } = useSetupStatus();
  const { workMode, isOperationMode } = useWorkMode();
  const { currentLevel, isBranchLevel } = useNavigationPipeline();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef(null);

  const pageTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname]);
  const breadcrumbs = useMemo(
    () => getHeaderBreadcrumbs(location.pathname),
    [location.pathname]
  );

  const accessibleCommands = useMemo(() => {
    return getAccessibleSearchCommands(can, canAny, isOwner, workMode, currentLevel, workAccess);
  }, [can, canAny, isOwner, workMode, currentLevel, workAccess]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const filteredCommands = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return accessibleCommands.slice(0, 6);
    }
    return accessibleCommands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(query) ||
        (cmd.fullLabel && cmd.fullLabel.toLowerCase().includes(query)) ||
        (cmd.category && cmd.category.toLowerCase().includes(query))
    );
  }, [accessibleCommands, searchQuery]);

  if (!workMode) {
    return (
      <header className="sticky top-0 z-[60] border-b border-border bg-surface/95 backdrop-blur-md">
        <div className="flex h-13 items-center justify-between px-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <UIIconButton
              type="button"
              onClick={onMenuClick}
              aria-label="Open navigation menu"
              variant="ghost"
              size="sm"
            >
              <Menu className="size-5" />
            </UIIconButton>

            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2ZM13 7V11H17V13H13V17H11V13H7V11H11V7H13Z" />
                </svg>
              </div>
              <span className="text-sm font-bold tracking-tight text-text">
                Pahuch <span className="text-primary font-bold">ERP</span>
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <HeaderProfileDropdown />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-[60] border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="flex h-13 items-center justify-between px-3">
        {/* Left: Menu, Title & Subroute Breadcrumbs (kept visible when drawer opens) */}
        <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
          <UIIconButton
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            variant="ghost"
            size="sm"
            className="shrink-0"
          >
            <Menu className="size-5" />
          </UIIconButton>

          <div className="flex min-w-0 flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.h1
                key={pageTitle}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 2 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                className="truncate text-[15px] font-extrabold tracking-tight text-text leading-tight"
              >
                {pageTitle}
              </motion.h1>
            </AnimatePresence>
            <HeaderBreadcrumbTrail breadcrumbs={breadcrumbs} compact />
          </div>
        </div>

        {/* Right: Search, Notifications, Branch-Op POS (+), Profile */}
        <div className="flex shrink-0 items-center gap-1.5">
          {isSetupComplete && (
            <>
              <UIIconButton
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
                variant={searchOpen ? "secondary" : "ghost"}
                size="sm"
                className="rounded-full"
              >
                <Search className="size-4" />
              </UIIconButton>

              <HeaderNotifications />
            </>
          )}

          {isOperationMode &&
            isBranchLevel &&
            canWorkLevel("branch") &&
            canWorkMode("operation") && (
            <Link
              to={ROUTES.SALES}
              aria-label="Open POS Billing"
              title="POS Billing"
              className="flex size-8 items-center justify-center rounded-full bg-primary text-white shadow-xs active:scale-95 transition"
            >
              <Plus className="size-4" />
            </Link>
          )}

          <HeaderProfileDropdown />
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden border-t border-border bg-surface px-3 py-2"
          >
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3 flex items-center text-text-muted">
                <Search className="size-3.5" />
              </span>

              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or type a command..."
                className="h-9 w-full rounded-[10px] border border-border bg-surface pl-8.5 pr-8 text-xs text-text placeholder:text-text-muted/60 outline-none transition-all duration-150 ease-out hover:border-border-strong focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 flex size-4 cursor-pointer items-center justify-center rounded-full text-text-muted hover:text-text"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {searchQuery && (
              <div className="mt-2 max-h-[180px] overflow-y-auto space-y-0.5">
                {filteredCommands.length ? (
                  filteredCommands.map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id || cmd.path || cmd.label}
                        type="button"
                        onClick={() => {
                          navigate(cmd.path);
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex w-full items-center justify-between rounded-[6px] px-2 py-1.5 text-xs text-text hover:bg-surface-hover"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                            <Icon className="size-3" />
                          </div>
                          <span className="truncate">{cmd.label}</span>
                        </div>
                        <ChevronRight className="size-3 shrink-0 text-text-muted" />
                      </button>
                    );
                  })
                ) : (
                  <div className="py-2 text-center text-xs text-text-muted">
                    No matching commands
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default AppMobileHeader;
