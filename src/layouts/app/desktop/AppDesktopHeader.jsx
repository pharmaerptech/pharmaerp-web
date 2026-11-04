// src/layouts/app/desktop/AppDesktopHeader.jsx

import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles, Plus, Layers, Command, Settings, HelpCircle } from "lucide-react";

import { ROUTES } from "@/constants";
import { useWorkMode } from "@/contexts";
import { useNavigationPipeline } from "@/contexts/NavigationPipelineContext";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import {
  HeaderSearchBar,
  HeaderNotifications,
  HeaderAppMenu,
  HeaderWorkModeToggle,
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

  // Doctors
  if (pathname.startsWith("/doctors/create")) return "Add Doctor";
  if (pathname.startsWith("/doctors/") && pathname.includes("/edit")) return "Edit Doctor";
  if (pathname.startsWith("/doctors/") && pathname.split("/").length > 2) return "Doctor Details";
  if (pathname.startsWith("/doctors")) return "Doctors";

  // Inventory & Catalog
  if (pathname.startsWith("/inventory/stock-metrics") || pathname.startsWith("/stock-metrics")) return "Stock Metrics";
  if (pathname.startsWith("/workspace-products/create")) return "Add Custom Product";
  if (pathname.startsWith("/workspace-products/") && pathname.includes("/edit")) return "Edit Custom Product";
  if (pathname.startsWith("/workspace-products/") && pathname.split("/").length > 2) return "Custom Product Details";
  if (pathname.startsWith("/workspace-products")) return "Custom Products";

  if (pathname.startsWith("/catalog/hsn-master")) return "HSN Codes Master";
  if (pathname.startsWith("/catalog/manufacturer-master")) return "Manufacturers Master";
  if (pathname.startsWith("/catalog/salt-master")) return "Salt Compositions Master";
  if (pathname.startsWith("/catalog/category-master")) return "Categories Master";
  if (pathname.startsWith("/catalog/product-form-master")) return "Product Forms Master";
  if (pathname.startsWith("/catalog/uom-master")) return "Units of Measure Master";
  if (pathname.startsWith("/catalog/bank-master")) return "Banks Directory";
  if (pathname.startsWith("/catalog")) return "Global Catalog";

  // Sales & POS, Billing, Purchases
  if (pathname.startsWith("/sales/edit") || pathname.startsWith("/sale/edit")) return "Edit Invoice";
  if (pathname.startsWith("/sales") || pathname.startsWith("/sale")) return "POS Billing Terminal";
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
  if (pathname.startsWith("/finance/treasury/branch-cash")) return "Branch Cash";
  if (pathname.startsWith("/operations/shifts")) return "Shifts";
  if (pathname.startsWith("/operations/business-days")) return "Business Days";
  if (pathname.startsWith("/finance/journal-vouchers")) return "Journal Vouchers";
  if (pathname.startsWith("/finance/ledger")) return "General Ledger";
  if (pathname.startsWith("/finance/gst-ledger/gstr-1")) return "GSTR-1 Outward Supplies";
  if (pathname.startsWith("/finance/gst-ledger/gstr-2")) return "GSTR-2 Inward Supplies";
  if (pathname.startsWith("/finance/gst-ledger/gstr-3b")) return "GSTR-3B Summary Return";
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

  // Doctors
  if (pathname === "/doctors" || pathname === ROUTES.DOCTORS) {
    return [root, { label: "Doctors", to: null }];
  }
  if (pathname === "/doctors/create") {
    return [
      root,
      { label: "Doctors", to: ROUTES.DOCTORS },
      { label: "Add Doctor", to: null },
    ];
  }
  if (pathname.startsWith("/doctors/") && pathname.includes("/edit")) {
    return [
      root,
      { label: "Doctors", to: ROUTES.DOCTORS },
      { label: "Edit Doctor", to: null },
    ];
  }
  if (pathname.startsWith("/doctors/")) {
    return [
      root,
      { label: "Doctors", to: ROUTES.DOCTORS },
      { label: "Doctor Details", to: null },
    ];
  }

  // Inventory & Stock
  if (pathname === "/inventory/stock-metrics" || pathname === "/stock-metrics" || pathname === ROUTES.STOCK_METRICS) {
    return [root, { label: "Stock Metrics", to: null }];
  }
  if (pathname === "/workspace-products" || pathname === ROUTES.WORKSPACE_PRODUCTS) {
    return [root, { label: "Custom Products", to: null }];
  }
  if (pathname === "/workspace-products/create") {
    return [
      root,
      { label: "Custom Products", to: ROUTES.WORKSPACE_PRODUCTS },
      { label: "Add Custom Product", to: null },
    ];
  }
  if (pathname.startsWith("/workspace-products/") && pathname.includes("/edit")) {
    return [
      root,
      { label: "Custom Products", to: ROUTES.WORKSPACE_PRODUCTS },
      { label: "Edit Custom Product", to: null },
    ];
  }
  if (pathname.startsWith("/workspace-products/")) {
    return [
      root,
      { label: "Custom Products", to: ROUTES.WORKSPACE_PRODUCTS },
      { label: "Custom Product Details", to: null },
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
  if (pathname.startsWith("/sales/edit") || pathname.startsWith("/sale/edit")) {
    return [
      root,
      { label: "Invoices & Billing", to: ROUTES.BILLING || "/billing" },
      { label: "Edit Invoice", to: null },
    ];
  }
  if (pathname === "/sales" || pathname === ROUTES.SALES || pathname === "/sale") {
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
  if (pathname.startsWith("/finance/gst-ledger/gstr-1")) {
    return [
      root,
      { label: "GST Reports", to: ROUTES.GSTR1 },
      { label: "GSTR-1", to: null },
    ];
  }
  if (pathname.startsWith("/finance/gst-ledger/gstr-2")) {
    return [
      root,
      { label: "GST Reports", to: ROUTES.GSTR2 },
      { label: "GSTR-2", to: null },
    ];
  }
  if (pathname.startsWith("/finance/gst-ledger/gstr-3b")) {
    return [
      root,
      { label: "GST Reports", to: ROUTES.GSTR3B },
      { label: "GSTR-3B", to: null },
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


export const AppDesktopHeader = ({ sidebarCollapsed, sidebarWidth = 240, onOpenShortcuts }) => {
  const effectiveWidth = sidebarWidth ?? (sidebarCollapsed ? 68 : 240);
  const location = useLocation();
  const { isSetupComplete, completedCount } = useSetupStatus();
  const { workMode, isOperationMode } = useWorkMode();
  const { currentLevel, isWorkspaceLevel, isCompanyLevel, isBranchLevel } =
    useNavigationPipeline();

  // State for Stock Matrix dialog
  const [isStockMatrixOpen, setIsStockMatrixOpen] = React.useState(false);



  const pageTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname]);
  const breadcrumbs = useMemo(
    () => getBreadcrumbs(location.pathname, isSetupComplete),
    [location.pathname, isSetupComplete]
  );

  const isEditPage = location.pathname.startsWith("/sales/edit") || location.pathname.startsWith("/sale/edit");
  const isSalesPage = (location.pathname.startsWith("/sales") || location.pathname.startsWith("/sale")) && !isEditPage;

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
          {/* Brand Logo & Subtitle */}
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

          {/* Neutral Actions: Settings & Help & Support */}
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
        {/* ── LEFT: Dynamic Page Title & Stats Portal ─────── */}
        <div className="flex-1 min-w-0 flex items-center gap-3.5">
          <div className="flex flex-col justify-center py-1 shrink-0 min-w-0">
            <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* ── RIGHT: Search Bar, Import Button, Notifications, & Quick Actions ── */}
        <div className="flex shrink-0 items-center justify-end gap-2.5 sm:gap-3 w-auto">
          {/* Search Bar (kept visible on all pages) */}
          {isSetupComplete ? (
            <div className="w-[240px] lg:w-[360px]">
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

          {/* Work Mode Switcher (Contextual per Level) */}
          <HeaderWorkModeToggle />

          {/* Dotted Grid Quick App & Dashboard Menu */}
          <HeaderAppMenu />

          {/* Marg Keyboard Shortcuts Trigger Button */}
          <button
            type="button"
            id="header-shortcuts-btn"
            onClick={onOpenShortcuts}
            className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-surface hover:bg-surface-hover text-text-muted hover:text-primary transition-all shadow-2xs cursor-pointer group"
            title="Marg Shortcuts (Alt + F1 or ?)"
          >
            <Command className="size-4 group-hover:scale-110 transition-transform" />
          </button>

          {isSetupComplete && <HeaderNotifications />}

          {/* Product Facility Table Dialog */}
          <ProductFacilityTableDialog
            open={isStockMatrixOpen}
            onClose={() => setIsStockMatrixOpen(false)}
          />

          {/* Level-Scoped Quick Actions (Operation Mode) */}
          {isOperationMode && isBranchLevel && (
            <Link
              to="/sales"
              className="flex items-center justify-center size-9 rounded-full bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-sm ring-2 ring-primary/20 shrink-0"
              title="POS Billing (Alt + N)"
            >
              <Plus className="size-5 text-white dark:text-white" color="white" />
            </Link>
          )}

          {isOperationMode && isCompanyLevel && (
            <div className="hidden lg:flex items-center gap-1.5 shrink-0">
              <Link
                to="/branches/create"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary transition-all shadow-2xs"
                title="Create Branch in this Company"
              >
                <Plus className="size-3.5" />
                <span>Branch</span>
              </Link>
              <Link
                to="/parties/customers/create"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-hover text-xs font-semibold text-text transition-all shadow-2xs"
                title="Add Direct Customer"
              >
                <Plus className="size-3.5 text-text-muted" />
                <span>Customer</span>
              </Link>
            </div>
          )}

          {isOperationMode && isWorkspaceLevel && (
            <div className="hidden lg:flex items-center gap-1.5 shrink-0">
              <Link
                to="/companies/create"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary transition-all shadow-2xs"
                title="Create Company in Workspace"
              >
                <Plus className="size-3.5" />
                <span>Company</span>
              </Link>
              <Link
                to="/members/invite"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-hover text-xs font-semibold text-text transition-all shadow-2xs"
                title="Invite Staff Member"
              >
                <Plus className="size-3.5 text-text-muted" />
                <span>Invite Staff</span>
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default AppDesktopHeader;
