// scripts/testRoutePipelinePolicy.mjs
/* global console */
import assert from "node:assert/strict";
import {
  PIPELINE_LEVELS,
  WORK_MODES,
  getLevelFromPathname,
  getPipelineDefaultRoute,
  reconcilePipelineLevel,
  isRouteAllowedForPipeline,
  filterNavForCollapsedRail,
} from "../src/contexts/routePipelinePolicy.js";
import { getHeaderBreadcrumbs } from "../src/layouts/app/components/header/headerBreadcrumbs.js";

const SIDEBAR_CONTEXT_EXPECTATIONS = {
  // 1. Workspace + View
  "workspace:view": [
    "/dashboard/workspace",
    "/companies",
    "/members",
    "/roles-permissions",
    "/settings",
    "/help-center",
  ],
  // 2. Workspace + Operation
  "workspace:operation": [
    "/companies",
    "/companies/create",
    "/members",
    "/members/invite",
    "/roles-permissions",
    "/roles-permissions/create",
    "/setup",
    "/settings",
    "/help-center",
  ],
  // 3. Company + View
  "company:view": [
    "/dashboard/company",
    "/branches",
    "/parties/customers",
    "/parties/suppliers",
    "/doctors",
    "/finance/treasury/bank-accounts",
    "/finance/gst-ledger/gstr-1",
    "/finance/gst-ledger/gstr-2",
    "/finance/gst-ledger/gstr-3b",
    "/finance/reports",
    "/finance/ledger",
    "/finance/account-balances",
    "/catalog",
    "/settings",
    "/help-center",
  ],
  // 4. Company + Operation
  "company:operation": [
    "/branches",
    "/branches/create",
    "/parties/customers",
    "/parties/suppliers",
    "/doctors",
    "/finance/treasury/bank-accounts",
    "/finance/chart-of-accounts/accounts",
    "/finance/journal-vouchers",
    "/finance/chart-of-accounts/account-groups",
    "/finance/financial-periods",
    "/finance/treasury/bank-deposit-slips",
    "/settings",
    "/help-center",
  ],
  // 5. Branch + View
  "branch:view": [
    "/dashboard/branch",
    "/reports",
    "/reports/sales",
    "/reports/customer",
    "/reports/product",
    "/reports/purchase",
    "/reports/inventory",
    "/inventory/stock-metrics",
    "/settings",
    "/help-center",
  ],
  // 6. Branch + Operation
  "branch:operation": [
    "/sales",
    "/billing",
    "/sales-returns",
    "/sales/credit-notes",
    "/purchases",
    "/workspace-products",
    "/inventory/stock-metrics",
    "/inventory/transfer-orders",
    "/operations/shifts",
    "/operations/business-days",
    "/finance/treasury/branch-cash",
    "/finance/treasury/payment-qrs",
    "/finance/treasury/upi-transactions",
    "/finance/treasury/cash-transactions",
    "/finance/treasury/cash-exchanges",
    "/settings",
    "/help-center",
  ],
};

const run = () => {
  // 1. Every route in each of the 6 contexts must be allowed inside its own context
  // AND must keep its level invariant (never infer a different level!)
  for (const [key, paths] of Object.entries(SIDEBAR_CONTEXT_EXPECTATIONS)) {
    const [level, mode] = key.split(":");
    for (const path of paths) {
      const check = isRouteAllowedForPipeline(path, {
        currentLevel: level,
        workMode: mode,
        isSetupComplete: true,
        hasActiveCompany: level !== PIPELINE_LEVELS.WORKSPACE,
        hasActiveBranch: level === PIPELINE_LEVELS.BRANCH,
      });
      assert.equal(
        check.allowed,
        true,
        `Expected ${path} to be allowed in ${key}, got blocked (${check.reason} -> ${check.redirectTo})`
      );

      const inferred = getLevelFromPathname(path);
      if (inferred !== null && path !== "/catalog") {
        assert.equal(
          inferred,
          level,
          `Expected getLevelFromPathname(${path}) to equal ${level}, got ${inferred}`
        );
      }
    }
  }

  // 2. Branch treasury routes must NOT leak to Company level
  for (const path of [
    "/finance/treasury/branch-cash",
    "/finance/treasury/payment-qrs",
    "/finance/treasury/upi-transactions",
    "/finance/treasury/cash-transactions",
    "/finance/treasury/cash-exchanges",
  ]) {
    const blockedInCompany = isRouteAllowedForPipeline(path, {
      currentLevel: PIPELINE_LEVELS.COMPANY,
      workMode: WORK_MODES.OPERATION,
      isSetupComplete: true,
      hasActiveCompany: true,
      hasActiveBranch: false,
    });
    assert.equal(blockedInCompany.allowed, false);
    assert.equal(blockedInCompany.redirectTo, "/branches");
  }

  // 3. Company treasury routes must NOT leak to Branch level
  for (const path of [
    "/finance/treasury/bank-accounts",
    "/finance/treasury/bank-deposit-slips",
    "/finance/treasury/fund-transfers",
    "/finance/treasury/cheque-management",
  ]) {
    const branchBlocked = isRouteAllowedForPipeline(path, {
      currentLevel: PIPELINE_LEVELS.BRANCH,
      workMode: WORK_MODES.OPERATION,
      isSetupComplete: true,
      hasActiveCompany: true,
      hasActiveBranch: true,
    });
    assert.equal(branchBlocked.allowed, false);
    assert.equal(branchBlocked.redirectTo, "/sales");
  }

  // 4. Cross-mode blocking without changing level
  const viewSalesCheck = isRouteAllowedForPipeline("/sales", {
    currentLevel: PIPELINE_LEVELS.BRANCH,
    workMode: WORK_MODES.VIEW,
    isSetupComplete: true,
    hasActiveCompany: true,
    hasActiveBranch: true,
  });
  assert.equal(viewSalesCheck.allowed, false);
  assert.equal(viewSalesCheck.redirectTo, "/dashboard/branch");

  const viewCreateCompany = isRouteAllowedForPipeline("/companies/create", {
    currentLevel: PIPELINE_LEVELS.WORKSPACE,
    workMode: WORK_MODES.VIEW,
    isSetupComplete: true,
  });
  assert.equal(viewCreateCompany.allowed, false);
  assert.equal(viewCreateCompany.redirectTo, "/dashboard/workspace");

  const opCompanyDash = isRouteAllowedForPipeline("/dashboard/company", {
    currentLevel: PIPELINE_LEVELS.COMPANY,
    workMode: WORK_MODES.OPERATION,
    isSetupComplete: true,
    hasActiveCompany: true,
  });
  assert.equal(opCompanyDash.allowed, false);
  assert.equal(opCompanyDash.redirectTo, "/branches");

  // 5. Generic /dashboard resolves cleanly per active (level, mode)
  assert.equal(
    isRouteAllowedForPipeline("/dashboard", {
      currentLevel: PIPELINE_LEVELS.COMPANY,
      workMode: WORK_MODES.VIEW,
      isSetupComplete: true,
      hasActiveCompany: true,
    }).redirectTo,
    "/dashboard/company"
  );
  assert.equal(
    isRouteAllowedForPipeline("/dashboard", {
      currentLevel: PIPELINE_LEVELS.BRANCH,
      workMode: WORK_MODES.OPERATION,
      isSetupComplete: true,
      hasActiveCompany: true,
      hasActiveBranch: true,
    }).redirectTo,
    "/sales"
  );

  // 6. Reconcile level safely when active company/branch missing
  assert.equal(
    reconcilePipelineLevel(PIPELINE_LEVELS.BRANCH, {
      hasActiveCompany: true,
      hasActiveBranch: false,
    }),
    PIPELINE_LEVELS.COMPANY
  );
  assert.equal(
    reconcilePipelineLevel(PIPELINE_LEVELS.BRANCH, {
      hasActiveCompany: false,
      hasActiveBranch: false,
    }),
    PIPELINE_LEVELS.WORKSPACE
  );

  // 7. Incomplete setup exemptions
  assert.equal(
    isRouteAllowedForPipeline("/companies/create", {
      currentLevel: PIPELINE_LEVELS.WORKSPACE,
      workMode: WORK_MODES.VIEW,
      isSetupComplete: false,
      companyCompleted: false,
    }).allowed,
    true
  );
  assert.equal(
    isRouteAllowedForPipeline("/branches/create", {
      currentLevel: PIPELINE_LEVELS.WORKSPACE,
      workMode: WORK_MODES.VIEW,
      isSetupComplete: false,
      companyCompleted: true,
    }).allowed,
    true
  );
  assert.equal(
    getPipelineDefaultRoute(PIPELINE_LEVELS.WORKSPACE, WORK_MODES.OPERATION),
    "/companies"
  );

  // 8. Standalone / single top-level routes MUST NOT render breadcrumbs
  for (const standalonePath of [
    "/",
    "/choose-mode",
    "/setup",
    "/dashboard",
    "/dashboard/workspace",
    "/dashboard/company",
    "/dashboard/branch",
    "/companies",
    "/branches",
    "/members",
    "/roles-permissions",
    "/subscription/upgrade-plan",
    "/parties/customers",
    "/parties/suppliers",
    "/doctors",
    "/finance",
    "/sales",
    "/billing",
    "/sales-returns",
    "/sales/credit-notes",
    "/purchases",
    "/workspace-products",
    "/inventory/stock-metrics",
    "/stock-metrics",
    "/inventory/transfer-orders",
    "/operations/shifts",
    "/operations/business-days",
    "/operations/day-closings",
    "/finance/treasury/branch-cash",
    "/finance/treasury/payment-qrs",
    "/finance/treasury/upi-transactions",
    "/finance/treasury/cash-transactions",
    "/finance/treasury/cash-exchanges",
    "/reports",
    "/catalog",
    "/marketplace",
    "/settings",
    "/settings/appearance",
    "/help-center",
    "/me",
    "/profile",
  ]) {
    assert.deepEqual(
      getHeaderBreadcrumbs(standalonePath),
      [],
      `Expected no breadcrumbs on top-level route ${standalonePath}`
    );
  }

  // 9. Subroutes & indirect-parent routes MUST render parent breadcrumbs
  assert.deepEqual(getHeaderBreadcrumbs("/companies/create"), [
    { label: "Companies", to: "/companies" },
    { label: "Create Company", to: null },
  ]);
  assert.deepEqual(getHeaderBreadcrumbs("/companies/create/"), [
    { label: "Companies", to: "/companies" },
    { label: "Create Company", to: null },
  ]);
  assert.deepEqual(getHeaderBreadcrumbs("/branches/create"), [
    { label: "Branches", to: "/branches" },
    { label: "Create Branch", to: null },
  ]);
  assert.deepEqual(getHeaderBreadcrumbs("/members/invite"), [
    { label: "Staff & Members", to: "/members" },
    { label: "Invite Staff Member", to: null },
  ]);
  assert.deepEqual(getHeaderBreadcrumbs("/roles-permissions/permissions"), [
    { label: "Roles & Permissions", to: "/roles-permissions" },
    { label: "Permission Catalog", to: null },
  ]);
  assert.deepEqual(getHeaderBreadcrumbs("/parties/customers/settlements"), [
    { label: "Customers", to: "/parties/customers" },
    { label: "Customer Settlements", to: null },
  ]);
  assert.deepEqual(getHeaderBreadcrumbs("/finance/ledger"), [
    { label: "Finance", to: "/finance" },
    { label: "General Ledger", to: null },
  ]);
  assert.deepEqual(getHeaderBreadcrumbs("/finance/gst-ledger/gstr-1"), [
    { label: "Finance", to: "/finance" },
    { label: "GST Reports", to: null },
    { label: "GSTR-1", to: null },
  ]);
  assert.deepEqual(getHeaderBreadcrumbs("/finance/journal-vouchers/create"), [
    { label: "Finance", to: "/finance" },
    { label: "Journal Vouchers", to: "/finance/journal-vouchers" },
    { label: "Create Voucher", to: null },
  ]);
  assert.deepEqual(getHeaderBreadcrumbs("/finance/treasury"), [
    { label: "Finance", to: "/finance" },
    { label: "Treasury", to: null },
  ]);
  assert.deepEqual(getHeaderBreadcrumbs("/finance/treasury/bank-accounts"), [
    { label: "Treasury", to: "/finance/treasury" },
    { label: "Bank Accounts", to: null },
  ]);
  assert.deepEqual(getHeaderBreadcrumbs("/finance/treasury/cash-exchanges/ex-1"), [
    { label: "Cash Exchanges", to: "/finance/treasury/cash-exchanges" },
    { label: "Exchange Details", to: null },
  ]);
  assert.deepEqual(getHeaderBreadcrumbs("/sales/edit/inv-123"), [
    { label: "Sale Invoices", to: "/billing" },
    { label: "Edit Invoice", to: null },
  ]);
  assert.deepEqual(getHeaderBreadcrumbs("/purchases/bills/create"), [
    { label: "Purchases", to: "/purchases" },
    { label: "New Purchase Bill", to: null },
  ]);
  assert.deepEqual(getHeaderBreadcrumbs("/reports/sales/daily"), [
    { label: "Reports Hub", to: "/reports" },
    { label: "Sales", to: "/reports/sales" },
    { label: "Daily", to: null },
  ]);
  assert.deepEqual(getHeaderBreadcrumbs("/catalog/hsn-master"), [
    { label: "Global Catalog", to: "/catalog" },
    { label: "HSN Codes Master", to: null },
  ]);

  // 10. Collapsed sidebar rail curates only essential items & drops empty groups
  const sampleGroups = [
    {
      id: "branch-sales-billing",
      items: [
        { id: "billing", collapsedRail: true },
        { id: "sale-invoices", collapsedRail: true },
        { id: "sales-returns" },
        { id: "credit-notes" },
      ],
    },
    {
      id: "empty-after-rail-filter",
      items: [{ id: "help" }],
    },
  ];
  const curatedRail = filterNavForCollapsedRail(sampleGroups);
  assert.equal(curatedRail.length, 1);
  assert.deepEqual(
    curatedRail[0].items.map((item) => item.id),
    ["billing", "sale-invoices"]
  );

  console.log("All routePipelinePolicy tests passed!");
};

run();
