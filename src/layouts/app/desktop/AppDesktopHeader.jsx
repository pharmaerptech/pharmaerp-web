// src/layouts/app/desktop/AppDesktopHeader.jsx

import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles, Plus, Layers } from "lucide-react";

import { ROUTES } from "@/constants";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import {
  HeaderSearchBar,
  HeaderNotifications,
  HeaderAppMenu,
} from "@/layouts/app/components/header";

/**
 * Route-to-Title Dictionary & Formatter
 */
const getPageTitle = (pathname) => {
  if (pathname === "/dashboard/branch" || pathname === ROUTES.BRANCH_DASHBOARD) return "Branch Dashboard";
  if (pathname === "/dashboard/company" || pathname === ROUTES.COMPANY_DASHBOARD) return "Company Dashboard";
  if (pathname === "/dashboard/workspace" || pathname === ROUTES.WORKSPACE_DASHBOARD) return "Workspace Dashboard";
  if (!pathname || pathname === "/" || pathname === ROUTES.HOME || pathname.startsWith("/dashboard")) {
    return "Dashboard";
  }

  // Members & Staff
  if (pathname.startsWith("/members/invite")) return "Invite Staff Member";
  if (pathname.startsWith("/members/invitations")) return "Staff Invitations";
  if (pathname.startsWith("/members/") && pathname.includes("/settings")) return "Member Settings";
  if (pathname.startsWith("/members/") && pathname.split("/").length > 2) return "Member Details";
  if (pathname.startsWith("/members")) return "Staff & Members";

  // Organization
  if (pathname.startsWith("/companies/create")) return "Create Company";
  if (pathname.startsWith("/companies/") && pathname.includes("/edit")) return "Edit Company";
  if (pathname.startsWith("/companies/") && pathname.split("/").length > 2) return "Company Details";
  if (pathname.startsWith("/companies")) return "Companies";

  if (pathname.startsWith("/branches/create")) return "Create Branch";
  if (pathname.startsWith("/branches/") && pathname.includes("/edit")) return "Edit Branch";
  if (pathname.startsWith("/branches/") && pathname.split("/").length > 2) return "Branch Details";
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
  if (pathname.startsWith("/parties/customers/create")) return "Add Customer";
  if (pathname.startsWith("/parties/customers/") && pathname.includes("/edit")) return "Edit Customer";
  if (pathname.startsWith("/parties/customers/") && pathname.split("/").length > 3) return "Customer Details";
  if (pathname.startsWith("/parties/customers")) return "Customers";

  if (pathname.startsWith("/parties/suppliers/create")) return "Add Supplier";
  if (pathname.startsWith("/parties/suppliers/") && pathname.includes("/edit")) return "Edit Supplier";
  if (pathname.startsWith("/parties/suppliers/") && pathname.split("/").length > 3) return "Supplier Details";
  if (pathname.startsWith("/parties/suppliers")) return "Suppliers";

  if (pathname.startsWith("/parties")) return "All Parties";

  // Inventory & Catalog
  if (pathname.startsWith("/workspace-products/create")) return "Add Medicine";
  if (pathname.startsWith("/workspace-products/") && pathname.includes("/edit")) return "Edit Medicine";
  if (pathname.startsWith("/workspace-products/") && pathname.split("/").length > 2) return "Medicine Details";
  if (pathname.startsWith("/workspace-products")) return "Pharmacy Stock";

  if (pathname.startsWith("/catalog/hsn-master")) return "HSN Codes Master";
  if (pathname.startsWith("/catalog/manufacturer-master")) return "Manufacturers Master";
  if (pathname.startsWith("/catalog/salt-master")) return "Salt Compositions Master";
  if (pathname.startsWith("/catalog/category-master")) return "Categories Master";
  if (pathname.startsWith("/catalog/product-form-master")) return "Product Forms Master";
  if (pathname.startsWith("/catalog/uom-master")) return "Units of Measure Master";
  if (pathname.startsWith("/catalog/bank-master")) return "Banks Directory";
  if (pathname.startsWith("/catalog")) return "Global Catalog";

  // Sales & POS, Billing, Purchases
  if (pathname.startsWith("/sales")) return "POS Billing Terminal";
  if (pathname.startsWith("/billing")) return "Invoices & Billing Hub";
  if (pathname.startsWith("/purchases")) return "Purchases & Procurement";

  // Marketplace
  if (pathname.startsWith("/marketplace/stores")) return "Marketplace Stores";
  if (pathname.startsWith("/marketplace/products")) return "Marketplace Products";
  if (pathname.startsWith("/marketplace")) return "Marketplace";

  // Finance
  if (pathname.startsWith("/finance/chart-of-accounts/account-groups")) return "Account Groups";
  if (pathname.startsWith("/finance/chart-of-accounts/accounts")) return "Accounts List";
  if (pathname.startsWith("/finance/account-balances")) return "Account Balances";
  if (pathname.startsWith("/finance/treasury/bank-accounts")) return "Bank Accounts";

  if (pathname.startsWith("/finance/treasury/fund-transfers")) return "Fund Transfers";
  if (pathname.startsWith("/finance/treasury/cash-exchanges")) return "Cash Exchanges";
  if (pathname.startsWith("/finance/treasury/cheque-management")) return "Cheque Management";
  if (pathname.startsWith("/finance/treasury/payment-qr")) return "UPI & Payment QR";
  if (pathname.startsWith("/finance/treasury/cash-denominations")) return "Cash Denominations";
  if (pathname.startsWith("/finance/treasury/branch-cash")) return "Branch Cash";
  if (pathname.startsWith("/operations/shifts")) return "Shifts";
  if (pathname.startsWith("/operations/business-days")) return "Business Days";
  if (pathname.startsWith("/finance/journal-vouchers")) return "Journal Vouchers";
  if (pathname.startsWith("/finance/ledger")) return "General Ledger";
  if (pathname.startsWith("/finance/financial-periods")) return "Financial Periods";
  if (pathname.startsWith("/finance/reports")) return "Financial Reports";
  if (pathname.startsWith("/finance")) return "Finance";

  // Setup, Settings, User
  if (pathname.startsWith("/setup")) return "Setup Center";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/help-center")) return "Help & Support Center";
  if (pathname.startsWith("/me") || pathname.startsWith("/profile")) return "My Profile";

  const segment = pathname.split("/").filter(Boolean).pop() || "Dashboard";
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Route-to-Traversible-Breadcrumbs Generator
 * Strictly produces only traversible, registered routes and excludes "workspace"
 */
const getBreadcrumbs = (pathname, isSetupComplete = false) => {
  if (!pathname || pathname === "/" || pathname === ROUTES.HOME || pathname.startsWith("/dashboard")) {
    return [{ label: "Dashboard", to: null }];
  }

  const root = { label: "Dashboard", to: isSetupComplete ? ROUTES.DASHBOARD : null };

  // Setup Center
  if (pathname.startsWith("/setup")) {
    return [{ label: "Workspace", to: null }, { label: "Setup Center", to: null }];
  }

  // Members & Staff
  if (pathname === "/members" || pathname === ROUTES.WORKSPACE_MEMBERS) {
    return [root, { label: "Staff & Members", to: null }];
  }
  if (pathname === "/members/invite") {
    return [
      root,
      { label: "Staff & Members", to: ROUTES.WORKSPACE_MEMBERS },
      { label: "Invite Member", to: null },
    ];
  }
  if (pathname === "/members/invitations") {
    return [
      root,
      { label: "Staff & Members", to: ROUTES.WORKSPACE_MEMBERS },
      { label: "Invitations", to: null },
    ];
  }
  if (pathname.startsWith("/members/") && pathname.includes("/settings")) {
    return [
      root,
      { label: "Staff & Members", to: ROUTES.WORKSPACE_MEMBERS },
      { label: "Member Settings", to: null },
    ];
  }
  if (pathname.startsWith("/members/")) {
    return [
      root,
      { label: "Staff & Members", to: ROUTES.WORKSPACE_MEMBERS },
      { label: "Member Details", to: null },
    ];
  }

  // Companies
  if (pathname === "/companies" || pathname === ROUTES.COMPANIES) {
    return [root, { label: "Companies", to: null }];
  }
  if (pathname === "/companies/create") {
    return [
      root,
      { label: "Companies", to: ROUTES.COMPANIES },
      { label: "Create Company", to: null },
    ];
  }
  if (pathname.startsWith("/companies/") && pathname.includes("/edit")) {
    return [
      root,
      { label: "Companies", to: ROUTES.COMPANIES },
      { label: "Edit Company", to: null },
    ];
  }
  if (pathname.startsWith("/companies/")) {
    return [
      root,
      { label: "Companies", to: ROUTES.COMPANIES },
      { label: "Company Details", to: null },
    ];
  }

  // Branches
  if (pathname === "/branches" || pathname === ROUTES.BRANCHES) {
    return [root, { label: "Branches", to: null }];
  }
  if (pathname === "/branches/create") {
    return [
      root,
      { label: "Branches", to: ROUTES.BRANCHES },
      { label: "Create Branch", to: null },
    ];
  }
  if (pathname.startsWith("/branches/") && pathname.includes("/edit")) {
    return [
      root,
      { label: "Branches", to: ROUTES.BRANCHES },
      { label: "Edit Branch", to: null },
    ];
  }
  if (pathname.startsWith("/branches/")) {
    return [
      root,
      { label: "Branches", to: ROUTES.BRANCHES },
      { label: "Branch Details", to: null },
    ];
  }

  // Roles & Permissions
  if (pathname === "/roles-permissions" || pathname === ROUTES.ROLES) {
    return [root, { label: "Roles & Permissions", to: null }];
  }
  if (
    pathname.startsWith("/roles-permissions/create") ||
    pathname.startsWith("/access-control/roles/create")
  ) {
    return [
      root,
      { label: "Roles & Permissions", to: ROUTES.ROLES },
      { label: "Create Role", to: null },
    ];
  }
  if (
    pathname.includes("/edit") &&
    (pathname.startsWith("/roles-permissions") ||
      pathname.startsWith("/access-control"))
  ) {
    return [
      root,
      { label: "Roles & Permissions", to: ROUTES.ROLES },
      { label: "Edit Role", to: null },
    ];
  }
  if (
    pathname.startsWith("/roles-permissions/permissions") ||
    pathname.startsWith("/access-control/permissions") ||
    pathname === ROUTES.PERMISSIONS
  ) {
    return [
      root,
      { label: "Roles & Permissions", to: ROUTES.ROLES },
      { label: "Permission Catalog", to: null },
    ];
  }
  if (
    pathname.startsWith("/roles-permissions/") ||
    pathname.startsWith("/access-control/roles/")
  ) {
    return [
      root,
      { label: "Roles & Permissions", to: ROUTES.ROLES },
      { label: "Role Details", to: null },
    ];
  }
  if (
    pathname.startsWith("/roles-permissions") ||
    pathname.startsWith("/access-control")
  ) {
    return [root, { label: "Roles & Permissions", to: null }];
  }

  // Parties: Customers & Suppliers
  if (pathname === "/parties" || pathname === ROUTES.PARTIES) {
    return [root, { label: "All Parties", to: null }];
  }
  if (pathname === "/parties/customers" || pathname === ROUTES.CUSTOMERS) {
    return [
      root,
      { label: "All Parties", to: ROUTES.PARTIES },
      { label: "Customers", to: null },
    ];
  }
  if (pathname === "/parties/customers/create") {
    return [
      root,
      { label: "Customers", to: ROUTES.CUSTOMERS },
      { label: "Add Customer", to: null },
    ];
  }
  if (pathname.startsWith("/parties/customers/") && pathname.includes("/edit")) {
    return [
      root,
      { label: "Customers", to: ROUTES.CUSTOMERS },
      { label: "Edit Customer", to: null },
    ];
  }
  if (pathname.startsWith("/parties/customers/")) {
    return [
      root,
      { label: "Customers", to: ROUTES.CUSTOMERS },
      { label: "Customer Details", to: null },
    ];
  }

  if (pathname === "/parties/suppliers" || pathname === ROUTES.SUPPLIERS) {
    return [
      root,
      { label: "All Parties", to: ROUTES.PARTIES },
      { label: "Suppliers", to: null },
    ];
  }
  if (pathname === "/parties/suppliers/create") {
    return [
      root,
      { label: "Suppliers", to: ROUTES.SUPPLIERS },
      { label: "Add Supplier", to: null },
    ];
  }
  if (pathname.startsWith("/parties/suppliers/") && pathname.includes("/edit")) {
    return [
      root,
      { label: "Suppliers", to: ROUTES.SUPPLIERS },
      { label: "Edit Supplier", to: null },
    ];
  }
  if (pathname.startsWith("/parties/suppliers/")) {
    return [
      root,
      { label: "Suppliers", to: ROUTES.SUPPLIERS },
      { label: "Supplier Details", to: null },
    ];
  }

  // Inventory & Stock
  if (pathname === "/workspace-products" || pathname === ROUTES.WORKSPACE_PRODUCTS) {
    return [root, { label: "Pharmacy Stock", to: null }];
  }
  if (pathname === "/workspace-products/create") {
    return [
      root,
      { label: "Pharmacy Stock", to: ROUTES.WORKSPACE_PRODUCTS },
      { label: "Add Medicine", to: null },
    ];
  }
  if (pathname.startsWith("/workspace-products/") && pathname.includes("/edit")) {
    return [
      root,
      { label: "Pharmacy Stock", to: ROUTES.WORKSPACE_PRODUCTS },
      { label: "Edit Medicine", to: null },
    ];
  }
  if (pathname.startsWith("/workspace-products/")) {
    return [
      root,
      { label: "Pharmacy Stock", to: ROUTES.WORKSPACE_PRODUCTS },
      { label: "Medicine Details", to: null },
    ];
  }

  // Catalog Master Data
  if (pathname === "/catalog" || pathname === ROUTES.CATALOG) {
    return [root, { label: "Global Catalog", to: null }];
  }
  if (pathname === "/catalog/hsn-master") {
    return [
      root,
      { label: "Global Catalog", to: ROUTES.CATALOG },
      { label: "HSN Codes", to: null },
    ];
  }
  if (pathname === "/catalog/manufacturer-master") {
    return [
      root,
      { label: "Global Catalog", to: ROUTES.CATALOG },
      { label: "Manufacturers", to: null },
    ];
  }
  if (pathname === "/catalog/salt-master") {
    return [
      root,
      { label: "Global Catalog", to: ROUTES.CATALOG },
      { label: "Salt Compositions", to: null },
    ];
  }
  if (pathname === "/catalog/category-master") {
    return [
      root,
      { label: "Global Catalog", to: ROUTES.CATALOG },
      { label: "Categories", to: null },
    ];
  }
  if (pathname === "/catalog/product-form-master") {
    return [
      root,
      { label: "Global Catalog", to: ROUTES.CATALOG },
      { label: "Product Forms", to: null },
    ];
  }
  if (pathname === "/catalog/uom-master") {
    return [
      root,
      { label: "Global Catalog", to: ROUTES.CATALOG },
      { label: "Units of Measure", to: null },
    ];
  }
  if (pathname === "/catalog/bank-master") {
    return [
      root,
      { label: "Global Catalog", to: ROUTES.CATALOG },
      { label: "Banks Directory", to: null },
    ];
  }

  // Sales & POS, Billing, Purchases
  if (pathname === "/sales" || pathname === ROUTES.SALES) {
    return [root, { label: "POS Billing", to: null }];
  }
  if (pathname === "/billing" || pathname === ROUTES.BILLING) {
    return [root, { label: "Invoices & Billing", to: null }];
  }
  if (pathname === "/purchases" || pathname === ROUTES.PURCHASES) {
    return [root, { label: "Purchases", to: null }];
  }

  // Marketplace
  if (pathname.startsWith("/marketplace/stores")) {
    return [
      root,
      { label: "Marketplace Stores", to: null },
    ];
  }
  if (pathname.startsWith("/marketplace/products")) {
    return [
      root,
      { label: "Marketplace Products", to: null },
    ];
  }

  // Finance
  if (pathname.startsWith("/finance/chart-of-accounts/account-groups")) {
    return [
      root,
      { label: "Finance", to: ROUTES.FINANCE },
      { label: "Account Groups", to: null },
    ];
  }
  if (pathname.startsWith("/finance/chart-of-accounts/accounts")) {
    return [
      root,
      { label: "Finance", to: ROUTES.FINANCE },
      { label: "Accounts", to: null },
    ];
  }
  if (pathname.startsWith("/finance/account-balances")) {
    return [
      root,
      { label: "Finance", to: ROUTES.ACCOUNTS },
      { label: "Account Balances", to: null },
    ];
  }
  if (pathname.startsWith("/finance/treasury/bank-accounts")) {
    return [
      root,
      { label: "Treasury", to: ROUTES.BANK_ACCOUNTS },
      { label: "Bank Accounts", to: null },
    ];
  }

  if (pathname.startsWith("/finance/treasury/fund-transfers")) {
    return [
      root,
      { label: "Treasury", to: ROUTES.BANK_ACCOUNTS },
      { label: "Fund Transfers", to: null },
    ];
  }
  if (pathname.startsWith("/finance/treasury/cash-exchanges")) {
    return [
      root,
      { label: "Treasury", to: ROUTES.BANK_ACCOUNTS },
      { label: "Cash Exchanges", to: null },
    ];
  }
  if (pathname.startsWith("/finance/treasury/cheque-management")) {
    return [
      root,
      { label: "Treasury", to: ROUTES.BANK_ACCOUNTS },
      { label: "Cheques", to: null },
    ];
  }
  if (pathname.startsWith("/finance/treasury/payment-qr")) {
    return [
      root,
      { label: "Treasury", to: ROUTES.BANK_ACCOUNTS },
      { label: "UPI / QR", to: null },
    ];
  }
  if (pathname.startsWith("/finance/treasury/cash-denominations")) {
    return [
      root,
      { label: "Treasury", to: ROUTES.BANK_ACCOUNTS },
      { label: "Cash Denominations", to: null },
    ];
  }
  if (pathname.startsWith("/finance/treasury/branch-cash")) {
    return [root, { label: "Branch Cash", to: null }];
  }
  if (pathname.startsWith("/operations/shifts")) {
    return [root, { label: "Shifts", to: null }];
  }
  if (pathname.startsWith("/operations/business-days")) {
    return [root, { label: "Business Days", to: null }];
  }
  if (pathname.startsWith("/finance/journal-vouchers")) {
    return [
      root,
      { label: "Finance", to: ROUTES.JOURNAL_VOUCHERS },
      { label: "Journal Vouchers", to: null },
    ];
  }
  if (pathname.startsWith("/finance/ledger")) {
    return [
      root,
      { label: "Finance", to: ROUTES.LEDGER },
      { label: "General Ledger", to: null },
    ];
  }
  if (pathname.startsWith("/finance/financial-periods")) {
    return [
      root,
      { label: "Finance", to: ROUTES.FINANCIAL_PERIODS },
      { label: "Financial Periods", to: null },
    ];
  }
  if (pathname.startsWith("/finance/reports")) {
    return [
      root,
      { label: "Finance", to: ROUTES.REPORTS },
      { label: "Financial Reports", to: null },
    ];
  }

  // Settings, Profile, Help
  if (pathname.startsWith("/settings")) {
    return [root, { label: "Settings", to: null }];
  }
  if (pathname.startsWith("/help-center")) {
    return [root, { label: "Help & Support", to: null }];
  }
  if (pathname.startsWith("/me") || pathname.startsWith("/profile")) {
    return [root, { label: "My Profile", to: null }];
  }

  // Fallback: segment title
  const finalSegment = pathname.split("/").filter(Boolean).pop() || "Page";
  return [
    root,
    {
      label: finalSegment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      to: null,
    },
  ];
};


import { ProductFacilityTableDialog } from "@/components";


export const AppDesktopHeader = ({ sidebarCollapsed, sidebarWidth = 240 }) => {
  const effectiveWidth = sidebarWidth ?? (sidebarCollapsed ? 68 : 240);
  const location = useLocation();
  const { isSetupComplete, completedCount } = useSetupStatus();

  // State for Stock Matrix dialog
  const [isStockMatrixOpen, setIsStockMatrixOpen] = React.useState(false);



  const pageTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname]);
  const breadcrumbs = useMemo(
    () => getBreadcrumbs(location.pathname, isSetupComplete),
    [location.pathname, isSetupComplete]
  );

  // Global Keyboard Shortcut: Shift + I -> Open Existing Inventory Upload
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && (e.key === "I" || e.key === "i")) {
        // Prevent typing Shift+I inside input / textarea fields
        const targetTag = e.target?.tagName?.toLowerCase();
        if (targetTag === "input" || targetTag === "textarea" || e.target?.isContentEditable) {
          return;
        }
        e.preventDefault();
        const uploadBtn = document.getElementById("header-upload-inventory-btn");
        if (uploadBtn) {
          uploadBtn.click();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header
      className="fixed top-0 z-30 h-[62px] border-b border-border bg-surface/95 backdrop-blur-md transition-[left] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
      style={{
        left: effectiveWidth,
        right: 0,
      }}
    >
      <div className="flex h-full w-full items-center px-6 gap-4">
        {/* ── LEFT: Dynamic Page Title & Traversible Breadcrumbs ─────── */}
        <div className="flex-1 min-w-0 shrink-0 flex flex-col justify-center py-1">
          <div className="flex items-center gap-3">
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
            <div id="header-stats-portal" className="flex items-center"></div>
          </div>

          {/* TopBar Traversible Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] text-text-muted mt-0.5 select-none">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="size-3 text-text-muted/40 shrink-0" />}
                {crumb.to ? (
                  <Link
                    to={crumb.to}
                    className="hover:text-primary transition-colors truncate max-w-[130px] font-medium"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-text font-semibold truncate max-w-[150px]">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* ── RIGHT: Search Bar, Import Button, Notifications, & POS Button ── */}
        <div className="flex shrink-0 items-center justify-end gap-3 w-auto">
          {isSetupComplete ? (
            <div className="w-[280px] lg:w-[400px]">
              <HeaderSearchBar />
            </div>
          ) : (
            <Link
              to={ROUTES.SETUP_CENTER}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15 transition-all shadow-xs mr-2"
            >
              <Sparkles className="size-3.5" />
              <span>Workspace Setup ({completedCount}/2)</span>
            </Link>
          )}

          {/* Product Facility Stock Matrix Button */}
          <button
            type="button"
            id="header-facility-matrix-btn"
            onClick={() => setIsStockMatrixOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 shadow-2xs transition-all"
            title="Stock Matrix (Shift + I)"
          >
            <Layers className="size-3.5 text-primary-600" />
            <span>Stock Matrix</span>
          </button>

          {/* Dotted Grid Quick App & Dashboard Menu */}
          <HeaderAppMenu />

          {isSetupComplete && <HeaderNotifications />}

          {/* Product Facility Table Dialog */}
          <ProductFacilityTableDialog
            open={isStockMatrixOpen}
            onClose={() => setIsStockMatrixOpen(false)}
          />



          {/* POS Billing Plus Button */}
          <Link
            to="/sales"
            className="flex items-center justify-center size-9 rounded-full bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-sm ring-2 ring-primary/20"
            title="POS Billing"
          >
            <Plus className="size-5 text-white dark:text-white" color="white" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default AppDesktopHeader;
