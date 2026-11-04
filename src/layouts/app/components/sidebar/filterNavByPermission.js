// src/layouts/app/components/sidebar/filterNavByPermission.js
//
// Pure utility that recursively filters sidebar nav groups/items
// based on user permissions, owner status, and workspace setup completion.

/**
 * Filter a single nav item (and its children) by permission and granular setup completion.
 * @param {object} item - nav item from sidebarNavConfig
 * @param {function} canFn - can(permissionKey) -> boolean
 * @param {function} [canAnyFn] - canAny(permissionKeys) -> boolean
 * @param {boolean} [isOwner=false] - whether current user is owner
 * @param {object|boolean} [setupOpts={}] - { isSetupComplete, companyCompleted, branchCompleted } or boolean
 * @returns {object|null} filtered item or null if access denied
 */
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
  } = typeof setupOpts === "boolean"
    ? { isSetupComplete: setupOpts }
    : (setupOpts || {});

  // ── Hide Setup Center completely from sidebar once setup is 100% complete ──
  if (isSetupComplete && item.id === "setup-center") {
    return null;
  }

  // ── Setup Center Guarding: Progressive reveal of Organization items during setup ──
  if (!isSetupComplete) {
    // 1. Hide dashboard until setup is 100% complete
    if (item.id === "dashboard") {
      return null;
    }

    // 2. If company is NOT created yet (!companyCompleted):
    //    Hide Organization completely (along with companies and branches)
    if (!companyCompleted) {
      if (
        item.id === "organization" ||
        item.id === "companies" ||
        item.id === "branches" ||
        item.id === "members" ||
        item.id === "roles-permissions" ||
        item.id === "access-control"
      ) {
        return null;
      }
    }

    // 3. If company IS created, but branch is NOT created yet (companyCompleted && !branchCompleted):
    //    Inside Organization, ONLY show Companies. Hide Branches, Members, Access Control.
    if (companyCompleted && !branchCompleted) {
      if (
        item.id === "branches" ||
        item.id === "members" ||
        item.id === "roles-permissions" ||
        item.id === "access-control"
      ) {
        return null;
      }
    }

    // 4. Allowed navigation items during setup onboarding:
    // - Setup Center
    // - Organization (only when companyCompleted is true)
    // - Companies (only when companyCompleted is true)
    // - Settings
    // - Help & Support
    const allowedIdsInSetup = [
      "setup-center",
      "organization",
      "companies",
      "branches",
      "settings",
      "help",
    ];

    if (!allowedIdsInSetup.includes(item.id)) {
      return null;
    }
  }

  // Check owner-only items
  if (item.requireOwner && !isOwner) {
    return null;
  }

  // Enforce Active Contexts for Non-Owners on Operational Routes
  if (!isOwner) {
    const COMPANY_DEPENDENT_NAV_IDS = [
      "billing",
      "purchases",
      "pharmacy-stock",
      "stock-metrics",
      "expired-scrap",
      "customers",
      "suppliers",
      "cash-counter",
      "bank-accounts",
      "bank-deposit-slips",
      "more-treasury",
      "bank-transactions",
      "cash-transactions",
      "cash-exchanges",
      "transfers",
      "payment-qrs",
      "cheques",
      "transfer-orders",
      "catalog",
      "master-data",
      "marketplace",
      "more-finance",
      "accounts",
      "chart-of-accounts",
      "chart-of-accounts-hub",
      "account-groups",
      "accounts-ledger",
      "ledger",
      "account-balances",
      "vouchers",
      "gst-ledger",
      "reports",
      "periods",
    ];
    
    const BRANCH_DEPENDENT_NAV_IDS = [
      "billing",
      "purchases",
      "pharmacy-stock",
      "stock-metrics",
      "expired-scrap",
      "cash-counter",
      "bank-deposit-slips",
      "more-treasury",
      "bank-transactions",
      "cash-transactions",
      "cash-exchanges",
      "payment-qrs",
      "cheques",
    ];

    if (!hasActiveCompany && COMPANY_DEPENDENT_NAV_IDS.includes(item.id)) {
      return null;
    }

    if (!hasActiveBranch && BRANCH_DEPENDENT_NAV_IDS.includes(item.id)) {
      return null;
    }
  }

  // Check array of permissions (user needs ANY one)
  if (item.permissions?.length) {
    const hasAny =
      typeof canAnyFn === "function"
        ? canAnyFn(item.permissions)
        : item.permissions.some((p) => canFn(p));
    if (!hasAny) return null;
  }
  // Check single permission key
  else if (item.permission && !canFn(item.permission)) {
    return null;
  }

  // If the item has children, filter them recursively
  if (item.children?.length) {
    const visibleChildren = item.children
      .map((child) =>
        filterItem(child, canFn, canAnyFn, isOwner, setupOpts),
      )
      .filter(Boolean);

    // If all children are hidden and parent had no independent action, hide parent
    if (visibleChildren.length === 0) {
      return null;
    }

    return { ...item, children: visibleChildren };
  }

  return item;
};

/**
 * Filter the full SIDEBAR_NAV_GROUPS structure by permission and setup completion.
 * @param {object[]} groups - array of nav group objects
 * @param {function} canFn - can(permissionKey) -> boolean
 * @param {function} [canAnyFn] - canAny(permissionKeys) -> boolean
 * @param {boolean} [isOwner=false] - whether current user is owner
 * @param {object|boolean} [setupOpts=true] - { isSetupComplete, companyCompleted, branchCompleted, hasActiveCompany, hasActiveBranch } or boolean
 * @returns {object[]} filtered groups (empty groups are removed)
 */
export const filterNavByPermission = (
  groups,
  canFn,
  canAnyFn,
  isOwner = false,
  setupOpts = true,
) => {
  return groups
    .map((group) => {
      const visibleItems = group.items
        .map((item) =>
          filterItem(item, canFn, canAnyFn, isOwner, setupOpts),
        )
        .filter(Boolean);

      if (visibleItems.length === 0) return null;

      return { ...group, items: visibleItems };
    })
    .filter(Boolean);
};

export default filterNavByPermission;
