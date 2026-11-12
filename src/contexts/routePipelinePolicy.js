// src/contexts/routePipelinePolicy.js
//
// Pure, zero-dependency route policy engine defining which routes belong to each
// (pipelineLevel, workMode) pair, prerequisite reconciliation, and role/permission enforcement.

import {
  clampWorkLevelToAllowed,
  clampWorkModeToAllowed,
} from "../utils/workAccess.js";
// (pipelineLevel, workMode) pair, prerequisite reconciliation, and canonical redirects.

export const PIPELINE_LEVELS = {
  WORKSPACE: "workspace",
  COMPANY: "company",
  BRANCH: "branch",
};

export const WORK_MODES = {
  OPERATION: "operation",
  VIEW: "view",
};

export const PIPELINE_STORAGE_KEYS = {
  ACTIVE_LEVEL: "pahuch_pipeline_level",
  ACTIVE_COMPANY_ID: "pahuch_active_company_id",
  ACTIVE_BRANCH_ID: "pahuch_active_branch_id",
};

const ALL_LEVELS = [
  PIPELINE_LEVELS.WORKSPACE,
  PIPELINE_LEVELS.COMPANY,
  PIPELINE_LEVELS.BRANCH,
];

const BOTH_MODES = [WORK_MODES.VIEW, WORK_MODES.OPERATION];

const normalizePathname = (pathname = "") => {
  const clean = String(pathname || "").trim().toLowerCase();
  if (!clean) return "/";
  if (clean.length > 1 && clean.endsWith("/")) {
    return clean.slice(0, -1);
  }
  return clean;
};

/**
 * Returns default landing route for any (level, mode) combination.
 */
export const getPipelineDefaultRoute = (level, workMode, workAccess = null) => {
  const safeLevel =
    workAccess?.allowedWorkLevels?.length > 0
      ? clampWorkLevelToAllowed(level, workAccess.allowedWorkLevels)
      : level;
  const safeMode =
    workAccess?.allowedWorkModes?.length > 0
      ? clampWorkModeToAllowed(workMode, workAccess.allowedWorkModes)
      : workMode;

  const isOp = safeMode === WORK_MODES.OPERATION;

  switch (safeLevel) {
    case PIPELINE_LEVELS.WORKSPACE:
      return isOp ? "/companies" : "/dashboard/workspace";
    case PIPELINE_LEVELS.COMPANY:
      return isOp ? "/branches" : "/dashboard/company";
    case PIPELINE_LEVELS.BRANCH:
    default:
      return isOp ? "/sales" : "/dashboard/branch";
  }
};

/**
 * Reconciles a requested pipeline level against actual Redux/session prerequisites
 * and role-allowed levels (strictly never promoting above allowedLevels).
 */
export const reconcilePipelineLevel = (
  level,
  { hasActiveCompany = false, hasActiveBranch = false, allowedLevels = null } = {},
) => {
  const hasAllowedList = Array.isArray(allowedLevels) && allowedLevels.length > 0;
  const isAllowed = (target) => !hasAllowedList || allowedLevels.includes(target);

  const candidate = hasAllowedList
    ? clampWorkLevelToAllowed(level, allowedLevels)
    : level;

  if (candidate === PIPELINE_LEVELS.BRANCH) {
    if (!hasActiveCompany) {
      if (isAllowed(PIPELINE_LEVELS.WORKSPACE)) return PIPELINE_LEVELS.WORKSPACE;
      if (isAllowed(PIPELINE_LEVELS.COMPANY)) return PIPELINE_LEVELS.COMPANY;
      return PIPELINE_LEVELS.BRANCH;
    }
    if (!hasActiveBranch) {
      if (isAllowed(PIPELINE_LEVELS.COMPANY)) return PIPELINE_LEVELS.COMPANY;
      return PIPELINE_LEVELS.BRANCH;
    }
    return PIPELINE_LEVELS.BRANCH;
  }

  if (candidate === PIPELINE_LEVELS.COMPANY) {
    if (!hasActiveCompany) {
      if (isAllowed(PIPELINE_LEVELS.WORKSPACE)) return PIPELINE_LEVELS.WORKSPACE;
      return PIPELINE_LEVELS.COMPANY;
    }
    return PIPELINE_LEVELS.COMPANY;
  }

  return isAllowed(PIPELINE_LEVELS.WORKSPACE)
    ? PIPELINE_LEVELS.WORKSPACE
    : clampWorkLevelToAllowed(candidate, allowedLevels);
};

/**
 * Ordered from MOST SPECIFIC to LEAST SPECIFIC.
 * Critical: Branch treasury routes (/finance/treasury/branch-cash, payment-qrs,
 * upi-transactions, cash-transactions, cash-exchanges) MUST appear BEFORE
 * generic Company /finance routes!
 */
export const ROUTE_POLICY_RULES = [
  // ── 0. Universal Routes (Allowed in ALL levels & BOTH modes) ───────────────
  {
    id: "choose-mode",
    match: (p) => p === "/choose-mode",
    levels: ALL_LEVELS,
    modes: BOTH_MODES,
    universal: true,
  },
  {
    id: "settings",
    match: (p) => p === "/settings" || p.startsWith("/settings/"),
    levels: ALL_LEVELS,
    modes: BOTH_MODES,
    universal: true,
  },
  {
    id: "help-center",
    match: (p) => p === "/help-center" || p.startsWith("/help-center/"),
    levels: ALL_LEVELS,
    modes: BOTH_MODES,
    universal: true,
  },
  {
    id: "profile",
    match: (p) => p === "/me" || p === "/profile",
    levels: ALL_LEVELS,
    modes: BOTH_MODES,
    universal: true,
  },
  {
    id: "setup-center",
    match: (p) => p === "/setup" || p.startsWith("/setup/"),
    levels: [PIPELINE_LEVELS.WORKSPACE],
    modes: [WORK_MODES.OPERATION],
    allowDuringIncompleteSetup: true,
  },

  // ── 1. Workspace Level Routes (Floor 1) ──────────────────────────────────
  {
    id: "workspace-dashboard",
    match: (p) => p === "/dashboard/workspace",
    levels: [PIPELINE_LEVELS.WORKSPACE],
    modes: [WORK_MODES.VIEW],
  },
  {
    id: "companies-mutate",
    match: (p) =>
      p === "/companies/create" ||
      /^\/companies\/[^/]+\/(edit|settings)(\/|$)/.test(p),
    levels: [PIPELINE_LEVELS.WORKSPACE],
    modes: [WORK_MODES.OPERATION],
    allowDuringIncompleteSetup: true,
  },
  {
    id: "companies-read",
    match: (p) => p === "/companies" || p.startsWith("/companies/"),
    levels: [PIPELINE_LEVELS.WORKSPACE],
    modes: BOTH_MODES,
    allowDuringIncompleteSetup: true,
  },
  {
    id: "members-invite",
    match: (p) => p === "/members/invite",
    levels: [PIPELINE_LEVELS.WORKSPACE],
    modes: [WORK_MODES.OPERATION],
  },
  {
    id: "members-read",
    match: (p) => p === "/members" || p.startsWith("/members/"),
    levels: [PIPELINE_LEVELS.WORKSPACE],
    modes: BOTH_MODES,
  },
  {
    id: "roles-mutate",
    match: (p) =>
      p === "/roles-permissions/create" ||
      p === "/access-control/roles/create" ||
      /^\/roles-permissions\/[^/]+\/edit(\/|$)/.test(p) ||
      /^\/access-control\/roles\/[^/]+\/edit(\/|$)/.test(p),
    levels: [PIPELINE_LEVELS.WORKSPACE],
    modes: [WORK_MODES.OPERATION],
  },
  {
    id: "roles-read",
    match: (p) =>
      p === "/roles-permissions" ||
      p.startsWith("/roles-permissions/") ||
      p === "/access-control" ||
      p.startsWith("/access-control/"),
    levels: [PIPELINE_LEVELS.WORKSPACE],
    modes: BOTH_MODES,
  },
  {
    id: "subscription",
    match: (p) => p === "/subscription" || p.startsWith("/subscription/"),
    levels: [PIPELINE_LEVELS.WORKSPACE],
    modes: BOTH_MODES,
  },

  // ── 2. Branch Level Routes (Floor 3) — BEFORE Company /finance ───────────
  {
    id: "branch-dashboard",
    match: (p) => p === "/dashboard/branch",
    levels: [PIPELINE_LEVELS.BRANCH],
    modes: [WORK_MODES.VIEW],
  },
  {
    id: "branch-reports-hub",
    match: (p) => p === "/reports" || p.startsWith("/reports/"),
    levels: [PIPELINE_LEVELS.BRANCH],
    modes: [WORK_MODES.VIEW],
  },
  {
    id: "branch-stock-metrics",
    match: (p) =>
      p === "/inventory/stock-metrics" ||
      p.startsWith("/inventory/stock-metrics/") ||
      p === "/stock-metrics" ||
      p.startsWith("/stock-metrics/"),
    levels: [PIPELINE_LEVELS.BRANCH],
    modes: BOTH_MODES,
  },
  {
    id: "branch-inventory-ops",
    match: (p) => p === "/inventory" || p.startsWith("/inventory/"),
    levels: [PIPELINE_LEVELS.BRANCH],
    modes: [WORK_MODES.OPERATION],
  },
  {
    id: "branch-sales-pos",
    match: (p) =>
      p === "/sales" ||
      p.startsWith("/sales/") ||
      p === "/sale" ||
      p.startsWith("/sale/"),
    levels: [PIPELINE_LEVELS.BRANCH],
    modes: [WORK_MODES.OPERATION],
  },
  {
    id: "branch-billing",
    match: (p) => p === "/billing" || p.startsWith("/billing/"),
    levels: [PIPELINE_LEVELS.BRANCH],
    modes: [WORK_MODES.OPERATION],
  },
  {
    id: "branch-sales-returns",
    match: (p) => p === "/sales-returns" || p.startsWith("/sales-returns/"),
    levels: [PIPELINE_LEVELS.BRANCH],
    modes: [WORK_MODES.OPERATION],
  },
  {
    id: "branch-purchases",
    match: (p) => p === "/purchases" || p.startsWith("/purchases/"),
    levels: [PIPELINE_LEVELS.BRANCH],
    modes: [WORK_MODES.OPERATION],
  },
  {
    id: "branch-workspace-products",
    match: (p) =>
      p === "/workspace-products" || p.startsWith("/workspace-products/"),
    levels: [PIPELINE_LEVELS.BRANCH],
    modes: [WORK_MODES.OPERATION],
  },
  {
    id: "branch-operations",
    match: (p) => p === "/operations" || p.startsWith("/operations/"),
    levels: [PIPELINE_LEVELS.BRANCH],
    modes: [WORK_MODES.OPERATION],
  },
  {
    id: "branch-treasury-ops",
    match: (p) =>
      p === "/finance/treasury/branch-cash" ||
      p.startsWith("/finance/treasury/branch-cash/") ||
      p === "/finance/treasury/payment-qrs" ||
      p.startsWith("/finance/treasury/payment-qrs/") ||
      p === "/finance/treasury/upi-transactions" ||
      p.startsWith("/finance/treasury/upi-transactions/") ||
      p === "/finance/treasury/cash-transactions" ||
      p.startsWith("/finance/treasury/cash-transactions/") ||
      p === "/finance/treasury/cash-exchanges" ||
      p.startsWith("/finance/treasury/cash-exchanges/"),
    levels: [PIPELINE_LEVELS.BRANCH],
    modes: [WORK_MODES.OPERATION],
  },
  {
    id: "branch-marketplace",
    match: (p) => p === "/marketplace" || p.startsWith("/marketplace/"),
    levels: [PIPELINE_LEVELS.BRANCH],
    modes: BOTH_MODES,
  },

  // ── 3. Company Level Routes (Floor 2) ────────────────────────────────────
  {
    id: "company-dashboard",
    match: (p) => p === "/dashboard/company",
    levels: [PIPELINE_LEVELS.COMPANY],
    modes: [WORK_MODES.VIEW],
  },
  {
    id: "branches-mutate",
    match: (p) =>
      p === "/branches/create" ||
      /^\/branches\/[^/]+\/(edit|settings)(\/|$)/.test(p),
    levels: [PIPELINE_LEVELS.COMPANY],
    modes: [WORK_MODES.OPERATION],
    allowDuringCompanySetup: true,
  },
  {
    id: "branches-read",
    match: (p) => p === "/branches" || p.startsWith("/branches/"),
    levels: [PIPELINE_LEVELS.COMPANY],
    modes: BOTH_MODES,
    allowDuringCompanySetup: true,
  },
  {
    id: "company-parties",
    match: (p) =>
      p === "/parties" ||
      p.startsWith("/parties/") ||
      p === "/customers" ||
      p.startsWith("/customers/") ||
      p === "/suppliers" ||
      p.startsWith("/suppliers/"),
    levels: [PIPELINE_LEVELS.COMPANY],
    modes: BOTH_MODES,
  },
  {
    id: "company-doctors",
    match: (p) => p === "/doctors" || p.startsWith("/doctors/"),
    levels: [PIPELINE_LEVELS.COMPANY],
    modes: BOTH_MODES,
  },
  {
    id: "company-finance-view",
    match: (p) =>
      p.startsWith("/finance/gst-ledger/") ||
      p === "/finance/reports" ||
      p.startsWith("/finance/reports/") ||
      p === "/finance/ledger" ||
      p.startsWith("/finance/ledger/") ||
      p === "/finance/account-balances" ||
      p.startsWith("/finance/account-balances/"),
    levels: [PIPELINE_LEVELS.COMPANY],
    modes: [WORK_MODES.VIEW],
  },
  {
    id: "company-bank-accounts",
    match: (p) =>
      p === "/finance/treasury/bank-accounts" ||
      p.startsWith("/finance/treasury/bank-accounts/") ||
      p === "/bank-accounts" ||
      p.startsWith("/bank-accounts/"),
    levels: [PIPELINE_LEVELS.COMPANY],
    modes: BOTH_MODES,
  },
  {
    id: "company-finance-ops",
    match: (p) =>
      p.startsWith("/finance/chart-of-accounts") ||
      p.startsWith("/finance/journal-vouchers") ||
      p.startsWith("/finance/financial-periods") ||
      p.startsWith("/finance/treasury/bank-transactions") ||
      p.startsWith("/finance/treasury/fund-transfers") ||
      p.startsWith("/finance/treasury/cheque-management") ||
      p.startsWith("/finance/treasury/bank-deposit-slips") ||
      p.startsWith("/finance/treasury/cash-in-transit"),
    levels: [PIPELINE_LEVELS.COMPANY],
    modes: [WORK_MODES.OPERATION],
  },
  {
    id: "company-finance-hub",
    match: (p) => p === "/finance" || p === "/finance/treasury",
    levels: [PIPELINE_LEVELS.COMPANY],
    modes: BOTH_MODES,
  },

  // ── 4. Shared Company/Branch Catalog Masters ─────────────────────────────
  {
    id: "catalog-masters",
    match: (p) => p === "/catalog" || p.startsWith("/catalog/"),
    levels: [PIPELINE_LEVELS.COMPANY, PIPELINE_LEVELS.BRANCH],
    modes: BOTH_MODES,
  },
];

/**
 * Matches a pathname against ROUTE_POLICY_RULES.
 */
export const resolveRoutePolicy = (pathname = "") => {
  const path = normalizePathname(pathname);
  return ROUTE_POLICY_RULES.find((rule) => rule.match(path)) || null;
};

/**
 * Infers intrinsic pipeline level for a URL pathname.
 * Used ONLY for initial boot hydration when no explicit ACTIVE_LEVEL is saved.
 * Returns null for universal/neutral routes.
 */
export const getLevelFromPathname = (pathname = "", currentContext = {}) => {
  const path = normalizePathname(pathname);

  if (path === "/dashboard" || path === "/") {
    if (!currentContext?.companyId) return PIPELINE_LEVELS.WORKSPACE;
    if (!currentContext?.branchId) return PIPELINE_LEVELS.COMPANY;
    return PIPELINE_LEVELS.BRANCH;
  }

  const rule = resolveRoutePolicy(path);
  if (!rule || rule.universal) return null;

  return rule.levels[0] || null;
};

/**
 * Evaluates whether `pathname` is permitted for the active `(currentLevel, workMode)`
 * and prerequisites. Never mutates state; returns a deterministic redirect target when blocked.
 */
export const isRouteAllowedForPipeline = (
  pathname = "",
  {
    currentLevel = PIPELINE_LEVELS.WORKSPACE,
    workMode = null,
    isSetupComplete = true,
    companyCompleted = false,
    hasActiveCompany = false,
    hasActiveBranch = false,
    allowedWorkLevels = null,
    allowedWorkModes = null,
  } = {},
) => {
  const path = normalizePathname(pathname);

  if (!workMode) {
    return { allowed: true, redirectTo: null, reason: null };
  }

  // Skip public / auth / invitation routes
  if (
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/invitations/")
  ) {
    return { allowed: true, redirectTo: null, reason: null };
  }

  const effectiveMode =
    Array.isArray(allowedWorkModes) && allowedWorkModes.length > 0
      ? clampWorkModeToAllowed(workMode, allowedWorkModes)
      : workMode;

  const effectiveLevel = reconcilePipelineLevel(currentLevel, {
    hasActiveCompany,
    hasActiveBranch,
    allowedLevels: allowedWorkLevels,
  });

  const fallbackRoute = getPipelineDefaultRoute(effectiveLevel, effectiveMode, {
    allowedWorkLevels,
    allowedWorkModes,
  });

  // Generic root /dashboard always resolves to the current (level, mode) landing route
  if (path === "/" || path === "/dashboard") {
    const canWorkspaceSetup =
      !Array.isArray(allowedWorkLevels) ||
      allowedWorkLevels.length === 0 ||
      allowedWorkLevels.includes(PIPELINE_LEVELS.WORKSPACE);

    return {
      allowed: false,
      redirectTo: isSetupComplete || !canWorkspaceSetup ? fallbackRoute : "/setup",
      reason: "canonical-dashboard",
    };
  }

  const rule = resolveRoutePolicy(path);

  // Unknown route -> let React Router handle 404 or keep current page
  if (!rule) {
    return { allowed: true, redirectTo: null, reason: null };
  }

  // Universal routes are always allowed
  if (rule.universal) {
    return { allowed: true, redirectTo: null, reason: null };
  }

  // Enforce Role Work Level ceiling first
  if (
    Array.isArray(allowedWorkLevels) &&
    allowedWorkLevels.length > 0 &&
    !rule.levels.some((lvl) => allowedWorkLevels.includes(lvl))
  ) {
    return {
      allowed: false,
      redirectTo: fallbackRoute,
      reason: "role-level-denied",
      requiredLevels: rule.levels,
    };
  }

  // Enforce Role Work Mode assignment (strict — no hierarchy)
  if (
    Array.isArray(allowedWorkModes) &&
    allowedWorkModes.length > 0 &&
    !rule.modes.some((mode) => allowedWorkModes.includes(mode))
  ) {
    return {
      allowed: false,
      redirectTo: fallbackRoute,
      reason: "role-mode-denied",
      requiredModes: rule.modes,
    };
  }

  // During initial setup onboarding, allow setup-exempt routes cleanly
  if (!isSetupComplete) {
    if (rule.allowDuringIncompleteSetup) {
      return { allowed: true, redirectTo: null, reason: null };
    }
    if (rule.allowDuringCompanySetup && companyCompleted) {
      return { allowed: true, redirectTo: null, reason: null };
    }
    const canWorkspaceSetup =
      !Array.isArray(allowedWorkLevels) ||
      allowedWorkLevels.length === 0 ||
      allowedWorkLevels.includes(PIPELINE_LEVELS.WORKSPACE);
    return {
      allowed: false,
      redirectTo: canWorkspaceSetup ? "/setup" : fallbackRoute,
      reason: "setup-incomplete",
    };
  }

  // Level restriction check
  if (!rule.levels.includes(effectiveLevel)) {
    return {
      allowed: false,
      redirectTo: fallbackRoute,
      reason: "level-mismatch",
      requiredLevels: rule.levels,
    };
  }

  // Mode restriction check
  if (!rule.modes.includes(effectiveMode)) {
    return {
      allowed: false,
      redirectTo: fallbackRoute,
      reason: "mode-mismatch",
      requiredModes: rule.modes,
    };
  }

  return { allowed: true, redirectTo: null, reason: null };
};

/**
 * Curates navigation groups for the closed/collapsed sidebar icon rail
 * so only essential top-level icons are rendered without overflow.
 */
export const filterNavForCollapsedRail = (groups = []) => {
  return (groups || [])
    .map((group) => ({
      ...group,
      items: (group.items || []).filter((item) => Boolean(item?.collapsedRail)),
    }))
    .filter((group) => group.items.length > 0);
};


