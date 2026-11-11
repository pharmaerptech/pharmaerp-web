// scripts/testBootLevelHydration.mjs
/* global console */
import assert from "node:assert/strict";
import { PIPELINE_LEVELS, WORK_MODES } from "../src/contexts/routePipelinePolicy.js";
import {
  normalizeStoredId,
  findEntityById,
  normalizeArrayPayload,
  resolveRequestedBootLevel,
  needsContextHydration,
  hydrateBootContext,
  shouldDeferDeepLinkEvaluation,
} from "../src/layouts/app/bootContextPolicy.js";

// ─── 1. ID Normalization & Lookup ─────────────────────────────────────────────
assert.equal(normalizeStoredId("comp_1"), "comp_1");
assert.equal(normalizeStoredId({ _id: "comp_2" }), "comp_2");
assert.equal(normalizeStoredId({ id: "comp_3" }), "comp_3");
assert.equal(normalizeStoredId(""), null);
assert.equal(normalizeStoredId("null"), null);
assert.equal(normalizeStoredId("undefined"), null);
assert.equal(normalizeStoredId(null), null);

const sampleCompanies = [
  { _id: "c1", name: "Alpha Pharma" },
  { id: "c2", name: "Beta Pharma" },
];
assert.equal(findEntityById(sampleCompanies, "c1")?.name, "Alpha Pharma");
assert.equal(findEntityById(sampleCompanies, "c2")?.name, "Beta Pharma");
assert.equal(findEntityById(sampleCompanies, "c999"), null);

assert.deepEqual(normalizeArrayPayload([{ _id: "1" }]), [{ _id: "1" }]);
assert.deepEqual(normalizeArrayPayload({ items: [{ _id: "2" }] }), [{ _id: "2" }]);
assert.deepEqual(normalizeArrayPayload({ data: [{ _id: "3" }] }), [{ _id: "3" }]);
assert.deepEqual(normalizeArrayPayload(null), []);

// ─── 2. Requested Boot Level Resolution ───────────────────────────────────────
assert.equal(
  resolveRequestedBootLevel({
    savedLevel: "branch",
    pathname: "/sales",
    savedCompanyId: "c1",
    savedBranchId: "b1",
  }),
  PIPELINE_LEVELS.BRANCH
);

assert.equal(
  resolveRequestedBootLevel({
    savedLevel: "company",
    pathname: "/branches",
    savedCompanyId: "c1",
    savedBranchId: null,
  }),
  PIPELINE_LEVELS.COMPANY
);

assert.equal(
  resolveRequestedBootLevel({
    savedLevel: "branch",
    pathname: "/settings", // universal route preserves stored branch level
    savedCompanyId: "c1",
    savedBranchId: "b1",
  }),
  PIPELINE_LEVELS.BRANCH
);

assert.equal(
  resolveRequestedBootLevel({
    savedLevel: null,
    pathname: "/settings",
    savedCompanyId: "c1",
    savedBranchId: "b1",
  }),
  PIPELINE_LEVELS.BRANCH
);

assert.equal(
  resolveRequestedBootLevel({
    savedLevel: null,
    pathname: "/settings",
    savedCompanyId: "c1",
    savedBranchId: null,
  }),
  PIPELINE_LEVELS.COMPANY
);

assert.equal(
  resolveRequestedBootLevel({
    savedLevel: "workspace",
    pathname: "/companies",
    savedCompanyId: null,
    savedBranchId: null,
  }),
  PIPELINE_LEVELS.WORKSPACE
);

// ─── 3. Needs Context Hydration (Regression: WorkspaceRequiredRoute pre-sets currentWorkspace) ───
// On refresh, WorkspaceRequiredRoute sets currentWorkspace BEFORE AppLayout mounts.
// Hydration MUST still be required whenever company/branch context isn't hydrated yet!
assert.equal(
  needsContextHydration({
    requestedLevel: PIPELINE_LEVELS.COMPANY,
    savedCompanyId: "c1",
    savedBranchId: null,
    currentCompany: null,
    currentBranch: null,
  }),
  true
);

assert.equal(
  needsContextHydration({
    requestedLevel: PIPELINE_LEVELS.BRANCH,
    savedCompanyId: "c1",
    savedBranchId: "b1",
    currentCompany: null,
    currentBranch: null,
  }),
  true
);

assert.equal(
  needsContextHydration({
    requestedLevel: PIPELINE_LEVELS.BRANCH,
    savedCompanyId: "c1",
    savedBranchId: "b1",
    currentCompany: { _id: "c1" },
    currentBranch: null,
  }),
  true
);

assert.equal(
  needsContextHydration({
    requestedLevel: PIPELINE_LEVELS.BRANCH,
    savedCompanyId: "c1",
    savedBranchId: "b1",
    currentCompany: { _id: "c1" },
    currentBranch: { _id: "b1" },
  }),
  false
);

assert.equal(
  needsContextHydration({
    requestedLevel: PIPELINE_LEVELS.WORKSPACE,
    savedCompanyId: null,
    savedBranchId: null,
    currentCompany: null,
    currentBranch: null,
  }),
  false
);

// Stale active company/branch while saved level is workspace requires cleanup hydration
assert.equal(
  needsContextHydration({
    requestedLevel: PIPELINE_LEVELS.WORKSPACE,
    savedCompanyId: "c1",
    savedBranchId: null,
    currentCompany: { _id: "c1" },
    currentBranch: null,
  }),
  true
);

// ─── 4. Full Async Boot Context Hydration Flows ───────────────────────────────
{
  // Company level refresh: restores saved Company c2 cleanly (not Workspace, not c1)
  const companies = [
    { _id: "c1", name: "First Co" },
    { _id: "c2", name: "Second Co" },
  ];
  let fetchedBranchCompanyId = null;

  const result = await hydrateBootContext({
    savedLevel: "company",
    savedCompanyId: "c2",
    savedBranchId: null,
    pathname: "/dashboard/company",
    workspaces: [{ workspace: { _id: "ws1", name: "Main WS" } }],
    currentWorkspace: { _id: "ws1", name: "Main WS" }, // pre-set by WorkspaceRequiredRoute
    fetchWorkspaces: async () => [],
    fetchCompanies: async () => companies,
    fetchBranches: async (companyId) => {
      fetchedBranchCompanyId = companyId;
      return [{ _id: "b1", name: "Main Branch" }];
    },
  });

  assert.equal(result.effectiveLevel, PIPELINE_LEVELS.COMPANY);
  assert.equal(result.company?._id, "c2");
  assert.equal(result.branch, null);
  assert.equal(fetchedBranchCompanyId, "c2");
  assert.deepEqual(result.storageUpdates, {
    activeLevel: "company",
    activeCompanyId: "c2",
    activeBranchId: null,
  });
}

{
  // Branch level refresh: restores saved Company c2 AND Branch b3 cleanly
  const companies = [
    { _id: "c1", name: "First Co" },
    { _id: "c2", name: "Second Co" },
  ];
  const branchesByCompany = {
    c1: [{ _id: "b1", companyId: "c1", name: "C1 Branch" }],
    c2: [
      { _id: "b2", companyId: "c2", name: "C2 Branch 1" },
      { _id: "b3", companyId: "c2", name: "C2 Branch 2" },
    ],
  };

  const result = await hydrateBootContext({
    savedLevel: "branch",
    savedCompanyId: "c2",
    savedBranchId: "b3",
    pathname: "/sales",
    workspaces: [{ workspace: { _id: "ws1", name: "Main WS" } }],
    currentWorkspace: { _id: "ws1", name: "Main WS" },
    fetchWorkspaces: async () => [],
    fetchCompanies: async () => companies,
    fetchBranches: async (companyId) => branchesByCompany[companyId] || [],
  });

  assert.equal(result.effectiveLevel, PIPELINE_LEVELS.BRANCH);
  assert.equal(result.company?._id, "c2");
  assert.equal(result.branch?._id, "b3");
  assert.deepEqual(result.storageUpdates, {
    activeLevel: "branch",
    activeCompanyId: "c2",
    activeBranchId: "b3",
  });
}

{
  // Branch level refresh when savedBranchId is valid under c2 even if savedCompanyId was missing
  const companies = [
    { _id: "c1", name: "First Co" },
    { _id: "c2", name: "Second Co" },
  ];
  const branchesByCompany = {
    c1: [{ _id: "b1", companyId: "c1", name: "C1 Branch" }],
    c2: [{ _id: "b3", companyId: "c2", name: "C2 Branch 2" }],
  };

  const result = await hydrateBootContext({
    savedLevel: "branch",
    savedCompanyId: null,
    savedBranchId: "b3",
    pathname: "/sales",
    workspaces: [{ _id: "ws1", name: "Main WS" }],
    currentWorkspace: { _id: "ws1", name: "Main WS" },
    fetchWorkspaces: async () => [],
    fetchCompanies: async () => companies,
    fetchBranches: async (companyId) => branchesByCompany[companyId] || [],
    fetchBranchById: async (branchId) =>
      branchId === "b3" ? { _id: "b3", companyId: "c2", name: "C2 Branch 2" } : null,
  });

  assert.equal(result.effectiveLevel, PIPELINE_LEVELS.BRANCH);
  assert.equal(result.company?._id, "c2");
  assert.equal(result.branch?._id, "b3");
  assert.deepEqual(result.storageUpdates, {
    activeLevel: "branch",
    activeCompanyId: "c2",
    activeBranchId: "b3",
  });
}

{
  // Branch deleted on server: gracefully stays at Company level instead of jumping to Workspace
  const companies = [{ _id: "c2", name: "Second Co" }];
  const result = await hydrateBootContext({
    savedLevel: "branch",
    savedCompanyId: "c2",
    savedBranchId: "b_deleted",
    pathname: "/sales",
    workspaces: [{ _id: "ws1", name: "Main WS" }],
    currentWorkspace: { _id: "ws1", name: "Main WS" },
    fetchWorkspaces: async () => [],
    fetchCompanies: async () => companies,
    fetchBranches: async () => [{ _id: "b2", companyId: "c2", name: "Other Branch" }],
  });

  assert.equal(result.effectiveLevel, PIPELINE_LEVELS.COMPANY);
  assert.equal(result.company?._id, "c2");
  assert.equal(result.branch, null);
  assert.deepEqual(result.storageUpdates, {
    activeLevel: "company",
    activeCompanyId: "c2",
    activeBranchId: null,
  });
}

{
  // Company deleted on server: gracefully falls back to Workspace
  const result = await hydrateBootContext({
    savedLevel: "company",
    savedCompanyId: "c_deleted",
    savedBranchId: null,
    pathname: "/dashboard/company",
    workspaces: [{ _id: "ws1", name: "Main WS" }],
    currentWorkspace: { _id: "ws1", name: "Main WS" },
    fetchWorkspaces: async () => [],
    fetchCompanies: async () => [{ _id: "c1", name: "Other Co" }],
    fetchBranches: async () => [],
  });

  assert.equal(result.effectiveLevel, PIPELINE_LEVELS.WORKSPACE);
  assert.equal(result.company, null);
  assert.equal(result.branch, null);
  assert.deepEqual(result.storageUpdates, {
    activeLevel: "workspace",
    activeCompanyId: null,
    activeBranchId: null,
  });
}

{
  // Workspace level refresh clears stale IDs
  const result = await hydrateBootContext({
    savedLevel: "workspace",
    savedCompanyId: "stale_c",
    savedBranchId: "stale_b",
    pathname: "/companies",
    workspaces: [{ _id: "ws1", name: "Main WS" }],
    currentWorkspace: { _id: "ws1", name: "Main WS" },
    fetchWorkspaces: async () => [],
    fetchCompanies: async () => [{ _id: "c1", name: "Co" }],
    fetchBranches: async () => [],
  });

  assert.equal(result.effectiveLevel, PIPELINE_LEVELS.WORKSPACE);
  assert.equal(result.company, null);
  assert.equal(result.branch, null);
  assert.deepEqual(result.storageUpdates, {
    activeLevel: "workspace",
    activeCompanyId: null,
    activeBranchId: null,
  });
}

// ─── 5. Deep Link Sync Readiness Guard (Prevents premature /setup redirect) ──
assert.equal(
  shouldDeferDeepLinkEvaluation({
    isSyncComplete: false,
    workMode: WORK_MODES.OPERATION,
    hasSelectedMode: true,
    isSetupLoading: false,
    workspaceId: "ws1",
    setupStatus: { progress: { percentage: 100 } },
  }),
  true
);

assert.equal(
  shouldDeferDeepLinkEvaluation({
    isSyncComplete: true,
    workMode: WORK_MODES.OPERATION,
    hasSelectedMode: true,
    isSetupLoading: false,
    workspaceId: "ws1",
    setupStatus: null, // Setup status hasn't arrived yet after F5!
  }),
  true
);

assert.equal(
  shouldDeferDeepLinkEvaluation({
    isSyncComplete: true,
    workMode: WORK_MODES.OPERATION,
    hasSelectedMode: true,
    isSetupLoading: true,
    workspaceId: "ws1",
    setupStatus: { progress: { percentage: 100 } },
  }),
  true
);

assert.equal(
  shouldDeferDeepLinkEvaluation({
    isSyncComplete: true,
    workMode: WORK_MODES.OPERATION,
    hasSelectedMode: true,
    isSetupLoading: false,
    workspaceId: "ws1",
    setupStatus: { steps: { company: { completed: true }, branch: { completed: true } } },
  }),
  false
);

console.log("testBootLevelHydration passed: all refresh level & ID hydration checks green.");

