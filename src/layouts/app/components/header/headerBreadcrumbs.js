// src/layouts/app/components/header/headerBreadcrumbs.js
//
// Pure helper returning hierarchical breadcrumbs ONLY for routes that have a real
// parent route in the same (level, mode). Single/top-level routes return [].

const normalize = (pathname = "") => {
  const clean = String(pathname || "").trim().toLowerCase();
  if (!clean) return "/";
  return clean.length > 1 && clean.endsWith("/") ? clean.slice(0, -1) : clean;
};

const toTitleCase = (segment = "") =>
  segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getHeaderBreadcrumbs = (pathname = "") => {
  const path = normalize(pathname);

  // 1. Standalone / top-level routes -> NO breadcrumbs
  if (
    path === "/" ||
    path === "/choose-mode" ||
    path === "/setup" ||
    path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    path === "/companies" ||
    path === "/branches" ||
    path === "/members" ||
    path === "/roles-permissions" ||
    path === "/subscription/upgrade-plan" ||
    path === "/parties/customers" ||
    path === "/parties/suppliers" ||
    path === "/doctors" ||
    path === "/finance" ||
    path === "/sales" ||
    path === "/billing" ||
    path === "/sales-returns" ||
    path === "/sales/credit-notes" ||
    path === "/purchases" ||
    path === "/workspace-products" ||
    path === "/inventory/stock-metrics" ||
    path === "/stock-metrics" ||
    path === "/inventory/transfer-orders" ||
    path === "/operations/shifts" ||
    path === "/operations/business-days" ||
    path === "/operations/day-closings" ||
    path === "/finance/treasury/branch-cash" ||
    path === "/finance/treasury/payment-qrs" ||
    path === "/finance/treasury/upi-transactions" ||
    path === "/finance/treasury/cash-transactions" ||
    path === "/finance/treasury/cash-exchanges" ||
    path === "/reports" ||
    path === "/catalog" ||
    path === "/marketplace" ||
    path === "/settings" ||
    path.startsWith("/settings/") ||
    path === "/help-center" ||
    path === "/me" ||
    path === "/profile"
  ) {
    return [];
  }

  // 2. Companies subroutes
  if (path === "/companies/create") {
    return [
      { label: "Companies", to: "/companies" },
      { label: "Create Company", to: null },
    ];
  }
  if (/^\/companies\/[^/]+\/edit$/.test(path)) {
    return [
      { label: "Companies", to: "/companies" },
      { label: "Edit Company", to: null },
    ];
  }
  if (/^\/companies\/[^/]+\/settings$/.test(path)) {
    return [
      { label: "Companies", to: "/companies" },
      { label: "Company Settings", to: null },
    ];
  }
  if (path.startsWith("/companies/")) {
    return [
      { label: "Companies", to: "/companies" },
      { label: "Company Details", to: null },
    ];
  }

  // 3. Branches subroutes
  if (path === "/branches/create") {
    return [
      { label: "Branches", to: "/branches" },
      { label: "Create Branch", to: null },
    ];
  }
  if (/^\/branches\/[^/]+\/edit$/.test(path)) {
    return [
      { label: "Branches", to: "/branches" },
      { label: "Edit Branch", to: null },
    ];
  }
  if (/^\/branches\/[^/]+\/settings$/.test(path)) {
    return [
      { label: "Branches", to: "/branches" },
      { label: "Branch Settings", to: null },
    ];
  }
  if (path.startsWith("/branches/")) {
    return [
      { label: "Branches", to: "/branches" },
      { label: "Branch Details", to: null },
    ];
  }

  // 4. Members subroutes
  if (path === "/members/invite") {
    return [
      { label: "Staff & Members", to: "/members" },
      { label: "Invite Staff Member", to: null },
    ];
  }
  if (path === "/members/invitations") {
    return [
      { label: "Staff & Members", to: "/members" },
      { label: "Staff Invitations", to: null },
    ];
  }
  if (path.startsWith("/members/")) {
    return [
      { label: "Staff & Members", to: "/members" },
      { label: "Member Details", to: null },
    ];
  }

  // 5. Roles & Permissions subroutes
  if (
    path === "/roles-permissions/create" ||
    path === "/access-control/roles/create"
  ) {
    return [
      { label: "Roles & Permissions", to: "/roles-permissions" },
      { label: "Create Role", to: null },
    ];
  }
  if (
    path === "/roles-permissions/permissions" ||
    path === "/access-control/permissions"
  ) {
    return [
      { label: "Roles & Permissions", to: "/roles-permissions" },
      { label: "Permission Catalog", to: null },
    ];
  }
  if (/^\/roles-permissions\/[^/]+\/edit$/.test(path)) {
    return [
      { label: "Roles & Permissions", to: "/roles-permissions" },
      { label: "Edit Role", to: null },
    ];
  }
  if (path.startsWith("/roles-permissions/")) {
    return [
      { label: "Roles & Permissions", to: "/roles-permissions" },
      { label: "Role Details", to: null },
    ];
  }

  // 6. Subscription subroutes
  if (path === "/subscription/checkout") {
    return [
      { label: "Subscription Plans", to: "/subscription/upgrade-plan" },
      { label: "Checkout", to: null },
    ];
  }

  // 7. Parties & Doctors subroutes
  if (path === "/parties/customers/settlements") {
    return [
      { label: "Customers", to: "/parties/customers" },
      { label: "Customer Settlements", to: null },
    ];
  }
  if (path === "/parties/customers/create") {
    return [
      { label: "Customers", to: "/parties/customers" },
      { label: "Add Customer", to: null },
    ];
  }
  if (/^\/parties\/customers\/[^/]+\/edit$/.test(path)) {
    return [
      { label: "Customers", to: "/parties/customers" },
      { label: "Edit Customer", to: null },
    ];
  }
  if (path.startsWith("/parties/customers/")) {
    return [
      { label: "Customers", to: "/parties/customers" },
      { label: "Customer Details", to: null },
    ];
  }
  if (path === "/parties/suppliers/create") {
    return [
      { label: "Suppliers", to: "/parties/suppliers" },
      { label: "Add Supplier", to: null },
    ];
  }
  if (/^\/parties\/suppliers\/[^/]+\/edit$/.test(path)) {
    return [
      { label: "Suppliers", to: "/parties/suppliers" },
      { label: "Edit Supplier", to: null },
    ];
  }
  if (path.startsWith("/parties/suppliers/")) {
    return [
      { label: "Suppliers", to: "/parties/suppliers" },
      { label: "Supplier Details", to: null },
    ];
  }
  if (path === "/doctors/create") {
    return [
      { label: "Doctors", to: "/doctors" },
      { label: "Add Doctor", to: null },
    ];
  }
  if (/^\/doctors\/[^/]+\/edit$/.test(path)) {
    return [
      { label: "Doctors", to: "/doctors" },
      { label: "Edit Doctor", to: null },
    ];
  }
  if (path.startsWith("/doctors/")) {
    return [
      { label: "Doctors", to: "/doctors" },
      { label: "Doctor Details", to: null },
    ];
  }

  // 8. Branch Treasury detail subroutes
  if (path.startsWith("/finance/treasury/cash-exchanges/")) {
    return [
      { label: "Cash Exchanges", to: "/finance/treasury/cash-exchanges" },
      { label: "Exchange Details", to: null },
    ];
  }

  // 9. Company Finance & Treasury hierarchy
  if (path === "/finance/ledger") {
    return [
      { label: "Finance", to: "/finance" },
      { label: "General Ledger", to: null },
    ];
  }
  if (path === "/finance/account-balances") {
    return [
      { label: "Finance", to: "/finance" },
      { label: "Account Balances", to: null },
    ];
  }
  if (path === "/finance/reports") {
    return [
      { label: "Finance", to: "/finance" },
      { label: "Financial Reports", to: null },
    ];
  }
  if (path.startsWith("/finance/reports/")) {
    return [
      { label: "Finance", to: "/finance" },
      { label: "Financial Reports", to: "/finance/reports" },
      { label: "Report Viewer", to: null },
    ];
  }
  if (path === "/finance/gst-ledger/gstr-1") {
    return [
      { label: "Finance", to: "/finance" },
      { label: "GST Reports", to: null },
      { label: "GSTR-1", to: null },
    ];
  }
  if (path === "/finance/gst-ledger/gstr-2") {
    return [
      { label: "Finance", to: "/finance" },
      { label: "GST Reports", to: null },
      { label: "GSTR-2", to: null },
    ];
  }
  if (path === "/finance/gst-ledger/gstr-3b") {
    return [
      { label: "Finance", to: "/finance" },
      { label: "GST Reports", to: null },
      { label: "GSTR-3B", to: null },
    ];
  }
  if (path === "/finance/chart-of-accounts/accounts") {
    return [
      { label: "Finance", to: "/finance" },
      { label: "Chart of Accounts", to: null },
    ];
  }
  if (path === "/finance/chart-of-accounts/account-groups") {
    return [
      { label: "Finance", to: "/finance" },
      { label: "Account Groups", to: null },
    ];
  }
  if (path === "/finance/journal-vouchers") {
    return [
      { label: "Finance", to: "/finance" },
      { label: "Journal Vouchers", to: null },
    ];
  }
  if (path === "/finance/journal-vouchers/create") {
    return [
      { label: "Finance", to: "/finance" },
      { label: "Journal Vouchers", to: "/finance/journal-vouchers" },
      { label: "Create Voucher", to: null },
    ];
  }
  if (/^\/finance\/journal-vouchers\/[^/]+\/edit$/.test(path)) {
    return [
      { label: "Finance", to: "/finance" },
      { label: "Journal Vouchers", to: "/finance/journal-vouchers" },
      { label: "Edit Voucher", to: null },
    ];
  }
  if (path.startsWith("/finance/journal-vouchers/")) {
    return [
      { label: "Finance", to: "/finance" },
      { label: "Journal Vouchers", to: "/finance/journal-vouchers" },
      { label: "Voucher Details", to: null },
    ];
  }
  if (path === "/finance/financial-periods") {
    return [
      { label: "Finance", to: "/finance" },
      { label: "Financial Periods", to: null },
    ];
  }
  if (path === "/finance/financial-periods/create") {
    return [
      { label: "Finance", to: "/finance" },
      { label: "Financial Periods", to: "/finance/financial-periods" },
      { label: "Create Period", to: null },
    ];
  }
  if (path === "/finance/treasury") {
    return [
      { label: "Finance", to: "/finance" },
      { label: "Treasury", to: null },
    ];
  }
  if (path === "/finance/treasury/bank-accounts") {
    return [
      { label: "Treasury", to: "/finance/treasury" },
      { label: "Bank Accounts", to: null },
    ];
  }
  if (path === "/finance/treasury/bank-transactions") {
    return [
      { label: "Treasury", to: "/finance/treasury" },
      { label: "Bank Transactions", to: null },
    ];
  }
  if (path.startsWith("/finance/treasury/bank-transactions/")) {
    return [
      { label: "Treasury", to: "/finance/treasury" },
      { label: "Bank Transactions", to: "/finance/treasury/bank-transactions" },
      { label: "Transaction Details", to: null },
    ];
  }
  if (path === "/finance/treasury/fund-transfers") {
    return [
      { label: "Treasury", to: "/finance/treasury" },
      { label: "Fund Transfers", to: null },
    ];
  }
  if (path === "/finance/treasury/fund-transfers/create") {
    return [
      { label: "Treasury", to: "/finance/treasury" },
      { label: "Fund Transfers", to: "/finance/treasury/fund-transfers" },
      { label: "New Transfer", to: null },
    ];
  }
  if (path.startsWith("/finance/treasury/fund-transfers/")) {
    return [
      { label: "Treasury", to: "/finance/treasury" },
      { label: "Fund Transfers", to: "/finance/treasury/fund-transfers" },
      { label: "Transfer Details", to: null },
    ];
  }
  if (path === "/finance/treasury/cheque-management") {
    return [
      { label: "Treasury", to: "/finance/treasury" },
      { label: "Cheque Management", to: null },
    ];
  }
  if (path === "/finance/treasury/bank-deposit-slips") {
    return [
      { label: "Treasury", to: "/finance/treasury" },
      { label: "Bank Deposit Slips", to: null },
    ];
  }
  if (path === "/finance/treasury/cash-in-transit") {
    return [
      { label: "Treasury", to: "/finance/treasury" },
      { label: "Bank Deposit Slips", to: "/finance/treasury/bank-deposit-slips" },
      { label: "Cash in Transit", to: null },
    ];
  }
  if (path.startsWith("/finance/treasury/bank-deposit-slips/")) {
    return [
      { label: "Treasury", to: "/finance/treasury" },
      { label: "Bank Deposit Slips", to: "/finance/treasury/bank-deposit-slips" },
      { label: "Slip Details", to: null },
    ];
  }

  // 10. Sales, Purchases, Custom Products, Transfer Orders
  if (path.startsWith("/sales/edit/") || path.startsWith("/sale/edit/")) {
    return [
      { label: "Sale Invoices", to: "/billing" },
      { label: "Edit Invoice", to: null },
    ];
  }
  if (path === "/purchases/bills/create") {
    return [
      { label: "Purchases", to: "/purchases" },
      { label: "New Purchase Bill", to: null },
    ];
  }
  if (/^\/purchases\/bills\/[^/]+\/edit$/.test(path)) {
    return [
      { label: "Purchases", to: "/purchases" },
      { label: "Edit Purchase Bill", to: null },
    ];
  }
  if (path === "/workspace-products/create") {
    return [
      { label: "Custom Products", to: "/workspace-products" },
      { label: "Add Custom Product", to: null },
    ];
  }
  if (path === "/workspace-products/import") {
    return [
      { label: "Custom Products", to: "/workspace-products" },
      { label: "Import Products", to: null },
    ];
  }
  if (path === "/workspace-products/search") {
    return [
      { label: "Custom Products", to: "/workspace-products" },
      { label: "Search Products", to: null },
    ];
  }
  if (/^\/workspace-products\/[^/]+\/edit$/.test(path)) {
    return [
      { label: "Custom Products", to: "/workspace-products" },
      { label: "Edit Custom Product", to: null },
    ];
  }
  if (path.startsWith("/workspace-products/")) {
    return [
      { label: "Custom Products", to: "/workspace-products" },
      { label: "Product Details", to: null },
    ];
  }
  if (path === "/inventory/transfer-orders/create") {
    return [
      { label: "Transfer Orders", to: "/inventory/transfer-orders" },
      { label: "Create Transfer", to: null },
    ];
  }
  if (/^\/inventory\/transfer-orders\/[^/]+\/edit$/.test(path)) {
    return [
      { label: "Transfer Orders", to: "/inventory/transfer-orders" },
      { label: "Edit Transfer", to: null },
    ];
  }

  // 11. Reports Hub subroutes
  if (path.startsWith("/reports/")) {
    const parts = path.replace(/^\/reports\//, "").split("/").filter(Boolean);
    if (parts.length === 1) {
      return [
        { label: "Reports Hub", to: "/reports" },
        { label: toTitleCase(parts[0]), to: null },
      ];
    }
    if (parts.length >= 2) {
      return [
        { label: "Reports Hub", to: "/reports" },
        { label: toTitleCase(parts[0]), to: `/reports/${parts[0]}` },
        { label: toTitleCase(parts[1]), to: null },
      ];
    }
  }

  // 12. Marketplace subroutes
  if (path === "/marketplace/stores") {
    return [
      { label: "Marketplace", to: "/marketplace" },
      { label: "Stores", to: null },
    ];
  }
  if (path === "/marketplace/stores/create") {
    return [
      { label: "Marketplace", to: "/marketplace" },
      { label: "Stores", to: "/marketplace/stores" },
      { label: "Create Store", to: null },
    ];
  }
  if (/^\/marketplace\/stores\/[^/]+\/edit$/.test(path)) {
    return [
      { label: "Marketplace", to: "/marketplace" },
      { label: "Stores", to: "/marketplace/stores" },
      { label: "Edit Store", to: null },
    ];
  }
  if (path.startsWith("/marketplace/stores/")) {
    return [
      { label: "Marketplace", to: "/marketplace" },
      { label: "Stores", to: "/marketplace/stores" },
      { label: "Store Details", to: null },
    ];
  }
  if (path === "/marketplace/products") {
    return [
      { label: "Marketplace", to: "/marketplace" },
      { label: "Products", to: null },
    ];
  }
  if (path === "/marketplace/products/create") {
    return [
      { label: "Marketplace", to: "/marketplace" },
      { label: "Products", to: "/marketplace/products" },
      { label: "Add Product", to: null },
    ];
  }

  // 13. Catalog Masters subroutes
  if (path === "/catalog/global-products") {
    return [
      { label: "Global Catalog", to: "/catalog" },
      { label: "Global Products", to: null },
    ];
  }
  if (path.startsWith("/catalog/global-products/")) {
    return [
      { label: "Global Catalog", to: "/catalog" },
      { label: "Global Products", to: "/catalog/global-products" },
      { label: "Product Details", to: null },
    ];
  }
  if (path === "/catalog/hsn-master") {
    return [
      { label: "Global Catalog", to: "/catalog" },
      { label: "HSN Codes Master", to: null },
    ];
  }
  if (path === "/catalog/manufacturer-master") {
    return [
      { label: "Global Catalog", to: "/catalog" },
      { label: "Manufacturers Master", to: null },
    ];
  }
  if (path === "/catalog/salt-master") {
    return [
      { label: "Global Catalog", to: "/catalog" },
      { label: "Salt Compositions Master", to: null },
    ];
  }
  if (path === "/catalog/category-master") {
    return [
      { label: "Global Catalog", to: "/catalog" },
      { label: "Categories Master", to: null },
    ];
  }
  if (path === "/catalog/product-form-master") {
    return [
      { label: "Global Catalog", to: "/catalog" },
      { label: "Product Forms Master", to: null },
    ];
  }
  if (path === "/catalog/uom-master") {
    return [
      { label: "Global Catalog", to: "/catalog" },
      { label: "Units of Measure Master", to: null },
    ];
  }
  if (path === "/catalog/bank-master") {
    return [
      { label: "Global Catalog", to: "/catalog" },
      { label: "Banks Directory", to: null },
    ];
  }
  if (path.startsWith("/catalog/")) {
    const slug = path.replace(/^\/catalog\//, "").split("/")[0];
    return [
      { label: "Global Catalog", to: "/catalog" },
      { label: toTitleCase(slug), to: null },
    ];
  }

  return [];
};

export default getHeaderBreadcrumbs;
