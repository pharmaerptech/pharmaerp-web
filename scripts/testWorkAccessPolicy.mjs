// scripts/testWorkAccessPolicy.mjs
/* global console */
import assert from "node:assert/strict";
import {
  WORK_MODES,
  WORK_LEVELS,
  expandWorkLevelHierarchy,
  resolveRoleWorkAccess,
  resolveMyWorkAccess,
  isWorkModeAllowed,
  isWorkLevelAllowed,
  clampWorkLevelToAllowed,
  clampWorkModeToAllowed,
  syncPermissionsWithWorkAccess,
  parsePermissionKey,
} from "../src/utils/workAccess.js";
import {
  PIPELINE_LEVELS,
  isRouteAllowedForPipeline,
  reconcilePipelineLevel,
} from "../src/contexts/routePipelinePolicy.js";
import {
  resolveBootWorkMode,
  resolveRequestedBootLevel,
  hydrateBootContext,
} from "../src/layouts/app/bootContextPolicy.js";

// 1. Level hierarchy expansion
assert.deepEqual(expandWorkLevelHierarchy(WORK_LEVELS.WORKSPACE), [
  "workspace",
  "company",
  "branch",
]);
assert.deepEqual(expandWorkLevelHierarchy(WORK_LEVELS.COMPANY), [
  "company",
  "branch",
]);
assert.deepEqual(expandWorkLevelHierarchy(WORK_LEVELS.BRANCH), ["branch"]);

// 2. Strict work mode isolation (even at workspace level)
const wsViewOnly = resolveMyWorkAccess({
  isOwner: false,
  role: {
    code: "auditor",
    workModes: ["view"],
    workLevel: "workspace",
    permissions: ["work-mode:view", "work-level:workspace", "dashboard:view"],
  },
});

assert.equal(isWorkLevelAllowed(wsViewOnly, "workspace"), true);
assert.equal(isWorkLevelAllowed(wsViewOnly, "company"), true);
assert.equal(isWorkLevelAllowed(wsViewOnly, "branch"), true);
assert.equal(isWorkModeAllowed(wsViewOnly, "view"), true);
assert.equal(isWorkModeAllowed(wsViewOnly, "operation"), false);

// Workspace view-only user cannot open /companies/create (operation) or /sales (operation)
const wsOpCheck = isRouteAllowedForPipeline("/companies/create", {
  currentLevel: PIPELINE_LEVELS.WORKSPACE,
  workMode: WORK_MODES.OPERATION,
  hasActiveCompany: false,
  hasActiveBranch: false,
  allowedWorkLevels: wsViewOnly.allowedWorkLevels,
  allowedWorkModes: wsViewOnly.allowedWorkModes,
});
assert.equal(wsOpCheck.allowed, false);
assert.equal(wsOpCheck.reason, "role-mode-denied");
assert.equal(wsOpCheck.redirectTo, "/dashboard/workspace");

// 3. Branch-only operation user clamping & auto-hydration
const cashier = resolveRoleWorkAccess({
  code: "cashier",
  workModes: ["operation"],
  workLevel: "branch",
  permissions: ["work-mode:operation", "work-level:branch", "sale:create"],
});
assert.deepEqual(cashier.allowedWorkModes, ["operation"]);
assert.deepEqual(cashier.allowedWorkLevels, ["branch"]);
assert.equal(clampWorkLevelToAllowed("workspace", cashier.allowedWorkLevels), "branch");
assert.equal(clampWorkModeToAllowed("view", cashier.allowedWorkModes), "operation");

assert.equal(
  reconcilePipelineLevel(PIPELINE_LEVELS.WORKSPACE, {
    hasActiveCompany: false,
    hasActiveBranch: false,
    allowedLevels: cashier.allowedWorkLevels,
  }),
  PIPELINE_LEVELS.BRANCH,
);

const bootMode = resolveBootWorkMode({
  storedMode: "view",
  wasSelected: true,
  allowedWorkModes: cashier.allowedWorkModes,
});
assert.equal(bootMode.workMode, WORK_MODES.OPERATION);
assert.equal(bootMode.hasSelectedMode, true);
assert.equal(bootMode.autoSelected, true);

assert.equal(
  resolveRequestedBootLevel({
    savedLevel: "workspace",
    pathname: "/dashboard/workspace",
    allowedWorkLevels: cashier.allowedWorkLevels,
  }),
  PIPELINE_LEVELS.BRANCH,
);

// Async boot hydration auto-selects first permitted company & branch for branch-only staff
const hydratedBranchStaff = await hydrateBootContext({
  savedLevel: "workspace",
  savedCompanyId: null,
  savedBranchId: null,
  pathname: "/dashboard/workspace",
  workspaces: [{ workspace: { _id: "ws1", name: "Main WS" } }],
  allowedWorkLevels: cashier.allowedWorkLevels,
  fetchCompanies: async () => [{ _id: "comp_1", name: "Apollo Med" }],
  fetchBranches: async (companyId) =>
    companyId === "comp_1"
      ? [{ _id: "br_1", name: "MG Road Branch", companyId: "comp_1" }]
      : [],
});
assert.equal(hydratedBranchStaff.effectiveLevel, PIPELINE_LEVELS.BRANCH);
assert.equal(hydratedBranchStaff.company?._id, "comp_1");
assert.equal(hydratedBranchStaff.branch?._id, "br_1");

// 4. Company-level user cannot enter workspace routes
const companyMgr = resolveRoleWorkAccess({
  code: "manager",
  workModes: ["view", "operation"],
  workLevel: "company",
});
assert.deepEqual(companyMgr.allowedWorkLevels, ["company", "branch"]);
const mgrWsCheck = isRouteAllowedForPipeline("/roles-permissions", {
  currentLevel: PIPELINE_LEVELS.COMPANY,
  workMode: WORK_MODES.VIEW,
  hasActiveCompany: true,
  hasActiveBranch: false,
  allowedWorkLevels: companyMgr.allowedWorkLevels,
  allowedWorkModes: companyMgr.allowedWorkModes,
});
assert.equal(mgrWsCheck.allowed, false);
assert.equal(mgrWsCheck.reason, "role-level-denied");
assert.equal(mgrWsCheck.redirectTo, "/dashboard/company");

// 5. Permission parsing for hyphenated modules & sync helper
assert.deepEqual(parsePermissionKey("work-mode:operation"), {
  module: "work-mode",
  action: "operation",
});
assert.deepEqual(parsePermissionKey("workspace-member:view"), {
  module: "workspace-member",
  action: "view",
});
const synced = syncPermissionsWithWorkAccess({
  permissions: ["work-mode:view", "work-level:workspace", "sale:create"],
  workModes: ["operation"],
  workLevel: "branch",
});
assert.deepEqual(synced.workModes, ["operation"]);
assert.equal(synced.workLevel, "branch");
assert.ok(synced.permissions.includes("work-mode:operation"));
assert.ok(synced.permissions.includes("work-level:branch"));
assert.ok(!synced.permissions.includes("work-mode:view"));
assert.ok(!synced.permissions.includes("work-level:workspace"));

console.log("✅ All Work Access Policy tests passed!");

