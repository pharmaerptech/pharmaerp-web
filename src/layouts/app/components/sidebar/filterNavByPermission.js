// src/layouts/app/components/sidebar/filterNavByPermission.js

import { isWorkLevelAllowed, isWorkModeAllowed } from "@/utils/workAccess";

const SETUP_CENTER_IDS = new Set(["setup-center", "workspace-setup-center"]);
const COMPANY_SETUP_IDS = new Set([
  "companies",
  "manage-companies",
  "workspace-companies-view",
]);
const BRANCH_SETUP_IDS = new Set([
  "branches",
  "company-branches",
  "company-branches-view",
]);

const isItemAllowedByRoleWorkScope = (item, workAccess, isOwner) => {
  if (isOwner || !workAccess) return true;

  if (item.level && item.level !== "all" && !isWorkLevelAllowed(workAccess, item.level)) {
    return false;
  }

  if (
    item.workMode &&
    item.workMode !== "both" &&
    !isWorkModeAllowed(workAccess, item.workMode)
  ) {
    return false;
  }

  return true;
};

const filterItem = (
  item,
  canFn,
  canAnyFn,
  isOwner = false,
  setupOpts = {},
) => {
  const {
    isSetupComplete = true,
    companyCompleted = false,
    branchCompleted = false,
    hasActiveCompany = true,
    hasActiveBranch = true,
    workAccess = null,
  } =
    typeof setupOpts === "boolean"
      ? { isSetupComplete: setupOpts }
      : setupOpts || {};

  if (!isItemAllowedByRoleWorkScope(item, workAccess, isOwner)) {
    return null;
  }

  // Hide Setup Center completely from sidebar once setup is 100% complete
  if (isSetupComplete && SETUP_CENTER_IDS.has(item.id)) {
    return null;
  }

  // Progressive reveal of navigation items during incomplete onboarding
  if (!isSetupComplete) {
    if (
      item.id === "dashboard" ||
      item.id === "workspace-dashboard" ||
      item.id === "company-dashboard" ||
      item.id === "branch-dashboard"
    ) {
      return null;
    }

    if (!companyCompleted) {
      if (
        COMPANY_SETUP_IDS.has(item.id) ||
        BRANCH_SETUP_IDS.has(item.id) ||
        item.id === "organization" ||
        item.id === "members" ||
        item.id === "manage-members" ||
        item.id === "workspace-members-view" ||
        item.id === "roles-permissions" ||
        item.id === "manage-roles" ||
        item.id === "workspace-roles-view" ||
        item.id === "access-control"
      ) {
        return null;
      }
    }

    if (companyCompleted && !branchCompleted) {
      if (
        BRANCH_SETUP_IDS.has(item.id) ||
        item.id === "members" ||
        item.id === "manage-members" ||
        item.id === "workspace-members-view" ||
        item.id === "roles-permissions" ||
        item.id === "manage-roles" ||
        item.id === "workspace-roles-view" ||
        item.id === "access-control"
      ) {
        return null;
      }
    }

    const isAllowedInSetup =
      SETUP_CENTER_IDS.has(item.id) ||
      COMPANY_SETUP_IDS.has(item.id) ||
      BRANCH_SETUP_IDS.has(item.id) ||
      item.id === "organization" ||
      item.id === "settings" ||
      item.id === "help";

    if (!isAllowedInSetup) {
      return null;
    }
  }

  if (item.requireOwner && !isOwner) {
    return null;
  }

  if (!isOwner) {
    const COMPANY_DEPENDENT_NAV_IDS = new Set([
      "company-dashboard",
      "company-branches-view",
      "company-branches",
      "company-customers-view",
      "company-customers",
      "company-suppliers-view",
      "company-suppliers",
      "company-doctors-view",
      "company-doctors",
      "company-bank-accounts-view",
      "company-bank-accounts",
      "view-gst-reports",
      "view-gstr-1",
      "view-gstr-2",
      "view-gstr-3b",
      "view-financial-reports",
      "view-general-ledger",
      "view-account-balances",
      "company-accounts",
      "company-vouchers",
      "company-account-groups",
      "company-periods",
      "company-deposit-slips",
      "billing",
      "sale-invoices",
      "sales-returns",
      "credit-notes",
      "purchases",
      "pharmacy-stock",
      "stock-metrics",
      "transfer-orders",
      "shifts",
      "business-days",
      "cash-counter",
      "payment-qrs",
      "upi-transactions",
      "cash-transactions",
      "branch-dashboard",
      "branch-reports-hub",
      "branch-stock-metrics-view",
    ]);

    const BRANCH_DEPENDENT_NAV_IDS = new Set([
      "branch-dashboard",
      "branch-reports-hub",
      "branch-stock-metrics-view",
      "billing",
      "sale-invoices",
      "sales-returns",
      "credit-notes",
      "purchases",
      "pharmacy-stock",
      "stock-metrics",
      "transfer-orders",
      "shifts",
      "business-days",
      "cash-counter",
      "payment-qrs",
      "upi-transactions",
      "cash-transactions",
    ]);

    if (!hasActiveCompany && COMPANY_DEPENDENT_NAV_IDS.has(item.id)) {
      return null;
    }

    if (!hasActiveBranch && BRANCH_DEPENDENT_NAV_IDS.has(item.id)) {
      return null;
    }
  }

  if (item.permissions?.length) {
    const hasAny =
      typeof canAnyFn === "function"
        ? canAnyFn(item.permissions)
        : item.permissions.some((p) => canFn(p));
    if (!hasAny) return null;
  } else if (item.permission && !canFn(item.permission)) {
    return null;
  }

  if (item.children?.length) {
    const visibleChildren = item.children
      .map((child) =>
        filterItem(child, canFn, canAnyFn, isOwner, setupOpts),
      )
      .filter(Boolean);

    if (visibleChildren.length === 0) {
      return null;
    }

    return { ...item, children: visibleChildren };
  }

  return item;
};

export const filterNavByPermission = (
  groups,
  canFn,
  canAnyFn,
  isOwner = false,
  setupOpts = true,
) => {
  const workAccess =
    typeof setupOpts === "object" ? setupOpts?.workAccess || null : null;

  return groups
    .map((group) => {
      if (!isItemAllowedByRoleWorkScope(group, workAccess, isOwner)) {
        return null;
      }

      const visibleItems = group.items
        .map((item) => filterItem(item, canFn, canAnyFn, isOwner, setupOpts))
        .filter(Boolean);

      if (visibleItems.length === 0) return null;

      return { ...group, items: visibleItems };
    })
    .filter(Boolean);
};

export default filterNavByPermission;
