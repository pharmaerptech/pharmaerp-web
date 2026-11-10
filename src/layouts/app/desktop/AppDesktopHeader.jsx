// src/layouts/app/desktop/AppDesktopHeader.jsx

import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Plus, Settings, HelpCircle } from "lucide-react";

import { ROUTES } from "@/constants";
import { useWorkMode } from "@/contexts";
import { useNavigationPipeline } from "@/contexts/NavigationPipelineContext";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import {
  HeaderSearchBar,
  HeaderNotifications,
  HeaderBreadcrumbTrail,
  getHeaderBreadcrumbs,
} from "@/layouts/app/components/header";

/**
 * Route-to-Title Dictionary & Formatter
 */
const getPageTitle = (pathname) => {
  if (pathname === "/dashboard/branch" || pathname === ROUTES.BRANCH_DASHBOARD)
    return "Branch Dashboard";
  if (pathname === "/dashboard/company" || pathname === ROUTES.COMPANY_DASHBOARD)
    return "Company Dashboard";
  if (pathname === "/dashboard/workspace" || pathname === ROUTES.WORKSPACE_DASHBOARD)
    return "Workspace Dashboard";
  if (
    !pathname ||
    pathname === "/" ||
    pathname === ROUTES.HOME ||
    pathname.startsWith("/dashboard")
  ) {
    return "Dashboard";
  }

  // Members & Staff
  if (pathname.startsWith("/members/invite")) return "Invite Staff Member";
  if (pathname.startsWith("/members/invitations")) return "Staff Invitations";
  if (pathname.startsWith("/members/") && pathname.includes("/settings"))
    return "Member Settings";
  if (pathname.startsWith("/members/") && pathname.split("/").length > 2)
    return "Member Details";
  if (pathname.startsWith("/members")) return "Staff & Members";

  // Organization
  if (pathname.startsWith("/companies/create")) return "Create Company";
  if (pathname.startsWith("/companies/") && pathname.includes("/edit"))
    return "Edit Company";
  if (pathname.startsWith("/companies/") && pathname.includes("/settings"))
    return "Company Settings";
  if (pathname.startsWith("/companies/") && pathname.split("/").length > 2)
    return "Company Details";
  if (pathname.startsWith("/companies")) return "Companies";

  if (pathname.startsWith("/branches/create")) return "Create Branch";
  if (pathname.startsWith("/branches/") && pathname.includes("/edit"))
    return "Edit Branch";
  if (pathname.startsWith("/branches/") && pathname.includes("/settings"))
    return "Branch Settings";
  if (pathname.startsWith("/branches/") && pathname.split("/").length > 2)
    return "Branch Details";
  if (pathname.startsWith("/branches")) return "Branches";

  // Roles & Permissions
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
    return "Permission Catalog";
  }
  if (
    (pathname.startsWith("/roles-permissions/") &&
      pathname.split("/").filter(Boolean).length > 1) ||
    (pathname.startsWith("/access-control/roles/") &&
      pathname.split("/").filter(Boolean).length > 2)
  ) {
    return "Role Details";
  }
  if (
    pathname.startsWith("/roles-permissions") ||
    pathname.startsWith("/access-control")
  ) {
    return "Roles & Permissions";
  }

  // Parties
  if (pathname.startsWith("/parties/customers/settlements"))
    return "Customer Settlements";
  if (pathname.startsWith("/parties/customers/create")) return "Add Customer";
  if (pathname.startsWith("/parties/customers/") && pathname.includes("/edit"))
    return "Edit Customer";
  if (pathname.startsWith("/parties/customers/") && pathname.split("/").length > 3)
    return "Customer Details";
  if (pathname.startsWith("/parties/customers")) return "Customers";

  if (pathname.startsWith("/parties/suppliers/create")) return "Add Supplier";
  if (pathname.startsWith("/parties/suppliers/") && pathname.includes("/edit"))
    return "Edit Supplier";
  if (pathname.startsWith("/parties/suppliers/") && pathname.split("/").length > 3)
    return "Supplier Details";
  if (pathname.startsWith("/parties/suppliers")) return "Suppliers";

  if (pathname.startsWith("/parties")) return "All Parties";

  // Doctors
  if (pathname.startsWith("/doctors/create")) return "Add Doctor";
  if (pathname.startsWith("/doctors/") && pathname.includes("/edit"))
    return "Edit Doctor";
  if (pathname.startsWith("/doctors/") && pathname.split("/").length > 2)
    return "Doctor Details";
  if (pathname.startsWith("/doctors")) return "Doctors";

  // Inventory & Catalog
  if (
    pathname.startsWith("/inventory/stock-metrics") ||
    pathname.startsWith("/stock-metrics")
  ) {
    return "Stock Metrics";
  }
  if (pathname.startsWith("/inventory/transfer-orders")) return "Transfer Orders";
  if (pathname.startsWith("/workspace-products/create")) return "Add Custom Product";
  if (pathname.startsWith("/workspace-products/") && pathname.includes("/edit"))
    return "Edit Custom Product";
  if (pathname.startsWith("/workspace-products/") && pathname.split("/").length > 2)
    return "Custom Product Details";
  if (pathname.startsWith("/workspace-products")) return "Custom Products";

  if (pathname.startsWith("/catalog/hsn-master")) return "HSN Codes Master";
  if (pathname.startsWith("/catalog/manufacturer-master"))
    return "Manufacturers Master";
  if (pathname.startsWith("/catalog/salt-master")) return "Salt Compositions Master";
  if (pathname.startsWith("/catalog/category-master")) return "Categories Master";
  if (pathname.startsWith("/catalog/product-form-master"))
    return "Product Forms Master";
  if (pathname.startsWith("/catalog/uom-master")) return "Units of Measure Master";
  if (pathname.startsWith("/catalog/bank-master")) return "Banks Directory";
  if (pathname.startsWith("/catalog")) return "Global Catalog";

  // Sales & POS, Billing, Purchases
  if (pathname.startsWith("/sales/credit-notes")) return "Credit Notes";
  if (pathname.startsWith("/sales/edit") || pathname.startsWith("/sale/edit"))
    return "Edit Invoice";
  if (pathname.startsWith("/sales-returns")) return "Sales Returns";
  if (pathname.startsWith("/sales") || pathname.startsWith("/sale"))
    return "POS Billing Terminal";
  if (pathname.startsWith("/billing")) return "Invoices & Billing Hub";
  if (pathname.startsWith("/purchases")) return "Purchases & Procurement";

  // Reports Hub
  if (pathname.startsWith("/reports")) return "Branch Reports Hub";

  // Marketplace
  if (pathname.startsWith("/marketplace/stores")) return "Marketplace Stores";
  if (pathname.startsWith("/marketplace/products")) return "Marketplace Products";
  if (pathname.startsWith("/marketplace")) return "Marketplace";

  // Finance & Treasury
  if (pathname.startsWith("/finance/chart-of-accounts/account-groups"))
    return "Account Groups";
  if (pathname.startsWith("/finance/chart-of-accounts/accounts"))
    return "Chart of Accounts";
  if (pathname.startsWith("/finance/account-balances")) return "Account Balances";
  if (pathname.startsWith("/finance/treasury/bank-accounts"))
    return "Bank Accounts";
  if (pathname.startsWith("/finance/treasury/bank-transactions"))
    return "Bank Transactions";
  if (pathname.startsWith("/finance/treasury/bank-deposit-slips"))
    return "Bank Deposit Slips";
  if (pathname.startsWith("/finance/treasury/cash-in-transit"))
    return "Cash in Transit";
  if (pathname.startsWith("/finance/treasury/fund-transfers"))
    return "Fund Transfers";
  if (pathname.startsWith("/finance/treasury/cash-exchanges"))
    return "Cash Exchanges";
  if (pathname.startsWith("/finance/treasury/cheque-management"))
    return "Cheque Management";
  if (pathname.startsWith("/finance/treasury/payment-qrs"))
    return "Counter UPI & QR";
  if (pathname.startsWith("/finance/treasury/upi-transactions"))
    return "UPI Transactions";
  if (pathname.startsWith("/finance/treasury/cash-transactions"))
    return "Cash Transactions";
  if (pathname.startsWith("/finance/treasury/branch-cash"))
    return "Cash Counter (Till)";
  if (pathname.startsWith("/operations/shifts")) return "Shifts";
  if (pathname.startsWith("/operations/day-closings")) return "Day Closings";
  if (pathname.startsWith("/operations/business-days")) return "Business Days";
  if (pathname.startsWith("/finance/journal-vouchers")) return "Journal Vouchers";
  if (pathname.startsWith("/finance/ledger")) return "General Ledger";
  if (pathname.startsWith("/finance/financial-periods")) return "Financial Periods";
  if (pathname.startsWith("/finance/gst-ledger/gstr-1"))
    return "GSTR-1 Outward Supplies";
  if (pathname.startsWith("/finance/gst-ledger/gstr-2"))
    return "GSTR-2 Inward Supplies";
  if (pathname.startsWith("/finance/gst-ledger/gstr-3b"))
    return "GSTR-3B Summary Return";
  if (pathname.startsWith("/finance/reports")) return "Financial Reports";
  if (pathname.startsWith("/finance/treasury")) return "Treasury";
  if (pathname.startsWith("/finance")) return "Finance";

  // Subscription, Setup, Settings, User
  if (pathname.startsWith("/subscription")) return "Subscription & Plans";
  if (pathname.startsWith("/setup")) return "Setup Center";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/help-center")) return "Help & Support Center";
  if (pathname.startsWith("/me") || pathname.startsWith("/profile"))
    return "My Profile";

  const segment = pathname.split("/").filter(Boolean).pop() || "Dashboard";
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const AppDesktopHeader = ({ sidebarCollapsed, sidebarWidth = 240 }) => {
  const effectiveWidth = sidebarWidth ?? (sidebarCollapsed ? 68 : 240);
  const location = useLocation();
  const { isSetupComplete, completedCount } = useSetupStatus();
  const { workMode, isOperationMode } = useWorkMode();
  const { isBranchLevel } = useNavigationPipeline();

  const pageTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname]);
  const breadcrumbs = useMemo(
    () => getHeaderBreadcrumbs(location.pathname),
    [location.pathname]
  );

  // ── Neutral Default Header (When workMode is null / Choose Mode screen) ──
  if (!workMode) {
    return (
      <header
        className="fixed top-0 z-[60] h-[62px] border-b border-border bg-surface/95 backdrop-blur-md transition-[left] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          left: effectiveWidth,
          right: 0,
        }}
      >
        <div className="flex h-full w-full items-center justify-between px-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2ZM13 7V11H17V13H13V17H11V13H7V11H11V7H13Z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-text leading-tight">
                Pahuch <span className="text-primary font-bold">ERP</span>
              </div>
              <div className="text-[11px] font-medium text-text-muted leading-tight">
                Pharmacy Management System
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 w-auto">
            <Link
              to={ROUTES.SETTINGS}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-hover text-xs font-semibold text-text shadow-2xs transition-all"
              title="Settings"
            >
              <Settings className="size-3.5 text-text-muted" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            <Link
              to={ROUTES.HELP_CENTER}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-hover text-xs font-semibold text-text shadow-2xs transition-all"
              title="Help & Support"
            >
              <HelpCircle className="size-3.5 text-text-muted" />
              <span className="hidden sm:inline">Help & Support</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className="fixed top-0 z-[60] h-[62px] border-b border-border bg-surface/95 backdrop-blur-md transition-[left] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
      style={{
        left: effectiveWidth,
        right: 0,
      }}
    >
      <div className="flex h-full w-full items-center px-6 gap-4">
        {/* ── LEFT: Always show Page Title & Breadcrumbs (open and collapsed sidebar) ── */}
        <div className="flex-1 min-w-0 flex items-center gap-3.5">
          <div className="flex flex-col justify-center py-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={pageTitle}
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 2 }}
                  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                  className="truncate text-base lg:text-[16px] font-bold tracking-tight text-text leading-tight"
                >
                  {pageTitle}
                </motion.h1>
              </AnimatePresence>
              <div id="header-stats-portal" className="flex items-center shrink-0"></div>
            </div>

            <HeaderBreadcrumbTrail breadcrumbs={breadcrumbs} />
          </div>
        </div>

        {/* ── RIGHT: Search Bar, Notifications & Branch-Op POS (+) ── */}
        <div className="flex shrink-0 items-center justify-end gap-2.5 sm:gap-3 w-auto">
          {isSetupComplete ? (
            <div className="w-[240px] lg:w-[360px]">
              <HeaderSearchBar />
            </div>
          ) : (
            <Link
              to={ROUTES.SETUP_CENTER}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition-all shadow-xs"
            >
              <Sparkles className="size-3.5" />
              <span>Workspace Setup ({completedCount}/2)</span>
            </Link>
          )}

          {isSetupComplete && <HeaderNotifications />}

          {isOperationMode && isBranchLevel && (
            <Link
              to={ROUTES.SALES}
              className="flex items-center justify-center size-9 rounded-full bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-sm ring-2 ring-primary/20 shrink-0"
              title="POS Billing (Alt + N)"
              aria-label="Open POS Billing"
            >
              <Plus className="size-5 text-white dark:text-white" color="white" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppDesktopHeader;
