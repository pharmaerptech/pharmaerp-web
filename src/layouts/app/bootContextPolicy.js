// src/layouts/app/bootContextPolicy.js
//
// Pure boot hydration & level restoration policy used by AppLayout and deep-link sync.

import {
  PIPELINE_LEVELS,
  getLevelFromPathname,
} from "../../contexts/routePipelinePolicy.js";
import {
  WORK_MODES,
  clampWorkLevelToAllowed,
  clampWorkModeToAllowed,
} from "../../utils/workAccess.js";

const VALID_LEVELS = new Set(Object.values(PIPELINE_LEVELS));

const getWorkspaceFromItem = (item) => item?.workspace || item || null;

export const normalizeStoredId = (value) => {
  if (!value) return null;
  const raw =
    typeof value === "object" ? (value._id ?? value.id ?? null) : value;
  if (raw === null || raw === undefined) return null;

  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return null;
  }
  return trimmed;
};

export const findEntityById = (items, targetId) => {
  const normalizedTarget = normalizeStoredId(targetId);
  if (!normalizedTarget || !Array.isArray(items)) return null;

  return (
    items.find((item) => normalizeStoredId(item) === normalizedTarget) || null
  );
};

export const normalizeArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const resolveBootWorkMode = ({
  storedMode = null,
  wasSelected = false,
  allowedWorkModes = null,
} = {}) => {
  const cleanStored =
    storedMode === WORK_MODES.VIEW || storedMode === WORK_MODES.OPERATION
      ? storedMode
      : null;

  if (!Array.isArray(allowedWorkModes) || allowedWorkModes.length === 0) {
    if (wasSelected && cleanStored) {
      return { workMode: cleanStored, hasSelectedMode: true, autoSelected: false };
    }
    return { workMode: null, hasSelectedMode: false, autoSelected: false };
  }

  if (allowedWorkModes.length === 1) {
    return {
      workMode: allowedWorkModes[0],
      hasSelectedMode: true,
      autoSelected: true,
    };
  }

  if (wasSelected && cleanStored && allowedWorkModes.includes(cleanStored)) {
    return { workMode: cleanStored, hasSelectedMode: true, autoSelected: false };
  }

  if (wasSelected && cleanStored && !allowedWorkModes.includes(cleanStored)) {
    return {
      workMode: clampWorkModeToAllowed(cleanStored, allowedWorkModes),
      hasSelectedMode: true,
      autoSelected: true,
    };
  }

  return { workMode: null, hasSelectedMode: false, autoSelected: false };
};

export const resolveRequestedBootLevel = ({
  savedLevel,
  pathname = "",
  savedCompanyId = null,
  savedBranchId = null,
  allowedWorkLevels = null,
} = {}) => {
  let candidate;

  if (VALID_LEVELS.has(savedLevel)) {
    candidate = savedLevel;
  } else {
    const companyId = normalizeStoredId(savedCompanyId);
    const branchId = normalizeStoredId(savedBranchId);

    const routeLevel = getLevelFromPathname(pathname, {
      companyId,
      branchId,
    });
    if (routeLevel && VALID_LEVELS.has(routeLevel)) {
      candidate = routeLevel;
    } else if (companyId && branchId) {
      candidate = PIPELINE_LEVELS.BRANCH;
    } else if (companyId) {
      candidate = PIPELINE_LEVELS.COMPANY;
    } else {
      candidate = PIPELINE_LEVELS.WORKSPACE;
    }
  }

  if (Array.isArray(allowedWorkLevels) && allowedWorkLevels.length > 0) {
    return clampWorkLevelToAllowed(candidate, allowedWorkLevels);
  }

  return candidate;
};

export const needsContextHydration = ({
  requestedLevel,
  savedCompanyId = null,
  savedBranchId = null,
  currentCompany = null,
  currentBranch = null,
} = {}) => {
  const activeCompanyId = normalizeStoredId(currentCompany);
  const activeBranchId = normalizeStoredId(currentBranch);
  const targetCompanyId = normalizeStoredId(savedCompanyId);
  const targetBranchId = normalizeStoredId(savedBranchId);

  if (requestedLevel === PIPELINE_LEVELS.WORKSPACE) {
    return Boolean(
      activeCompanyId || activeBranchId || targetCompanyId || targetBranchId,
    );
  }

  if (requestedLevel === PIPELINE_LEVELS.COMPANY) {
    if (!activeCompanyId || activeBranchId) return true;
    return Boolean(targetCompanyId && activeCompanyId !== targetCompanyId);
  }

  if (requestedLevel === PIPELINE_LEVELS.BRANCH) {
    if (!activeCompanyId || !activeBranchId) return true;
    if (targetCompanyId && activeCompanyId !== targetCompanyId) return true;
    if (targetBranchId && activeBranchId !== targetBranchId) return true;
    return false;
  }

  return false;
};

const resolveWorkspaceForBoot = async ({
  workspaces,
  currentWorkspace,
  fetchWorkspaces,
}) => {
  if (normalizeStoredId(currentWorkspace)) {
    return currentWorkspace;
  }

  const existingItem = Array.isArray(workspaces) ? workspaces[0] : null;
  if (existingItem) {
    return getWorkspaceFromItem(existingItem);
  }

  if (typeof fetchWorkspaces !== "function") return null;
  const fetched = normalizeArrayPayload(await fetchWorkspaces().catch(() => []));
  return getWorkspaceFromItem(fetched[0]);
};

const resolveCompanyForBranchBoot = async ({
  companyItems,
  targetCompanyId,
  targetBranchId,
  fetchCompanyById,
  fetchBranchById,
}) => {
  let company = findEntityById(companyItems, targetCompanyId);
  if (company) return company;

  if (targetCompanyId && typeof fetchCompanyById === "function") {
    const directCompany = await fetchCompanyById(targetCompanyId).catch(
      () => null,
    );
    if (normalizeStoredId(directCompany)) return directCompany;
  }

  if (!targetCompanyId && targetBranchId && typeof fetchBranchById === "function") {
    const directBranch = await fetchBranchById(targetBranchId).catch(
      () => null,
    );
    const branchCompanyId = normalizeStoredId(directBranch?.companyId);
    company = findEntityById(companyItems, branchCompanyId);
    if (company) return company;
  }

  if (!targetCompanyId && companyItems.length === 1) {
    return companyItems[0];
  }

  return null;
};

export const hydrateBootContext = async ({
  savedLevel,
  savedCompanyId,
  savedBranchId,
  pathname = "",
  workspaces = [],
  currentWorkspace = null,
  allowedWorkLevels = null,
  fetchWorkspaces,
  fetchCompanies,
  fetchBranches,
  fetchCompanyById,
  fetchBranchById,
} = {}) => {
  const cleanCompanyId = normalizeStoredId(savedCompanyId);
  const cleanBranchId = normalizeStoredId(savedBranchId);

  const canAccessWorkspace =
    !Array.isArray(allowedWorkLevels) ||
    allowedWorkLevels.length === 0 ||
    allowedWorkLevels.includes(PIPELINE_LEVELS.WORKSPACE);
  const canAccessCompany =
    !Array.isArray(allowedWorkLevels) ||
    allowedWorkLevels.length === 0 ||
    allowedWorkLevels.includes(PIPELINE_LEVELS.COMPANY);

  let effectiveLevel = resolveRequestedBootLevel({
    savedLevel,
    pathname,
    savedCompanyId: cleanCompanyId,
    savedBranchId: cleanBranchId,
    allowedWorkLevels,
  });

  const workspace = await resolveWorkspaceForBoot({
    workspaces,
    currentWorkspace,
    fetchWorkspaces,
  });

  if (
    effectiveLevel === PIPELINE_LEVELS.WORKSPACE ||
    !normalizeStoredId(workspace)
  ) {
    const clampedFallback =
      Array.isArray(allowedWorkLevels) && allowedWorkLevels.length > 0
        ? clampWorkLevelToAllowed(PIPELINE_LEVELS.WORKSPACE, allowedWorkLevels)
        : PIPELINE_LEVELS.WORKSPACE;

    return {
      effectiveLevel: clampedFallback,
      workspace,
      company: null,
      branch: null,
      storageUpdates: {
        activeLevel: clampedFallback,
        activeCompanyId: null,
        activeBranchId: null,
      },
    };
  }

  const companyItems =
    typeof fetchCompanies === "function"
      ? normalizeArrayPayload(await fetchCompanies().catch(() => []))
      : [];

  if (effectiveLevel === PIPELINE_LEVELS.COMPANY) {
    let selectedCompany = findEntityById(companyItems, cleanCompanyId);
    if (
      !selectedCompany &&
      cleanCompanyId &&
      typeof fetchCompanyById === "function"
    ) {
      selectedCompany = await fetchCompanyById(cleanCompanyId).catch(() => null);
    }

    // Company-restricted roles with no stored company auto-select their first permitted company
    if (!selectedCompany && !canAccessWorkspace && companyItems.length > 0) {
      selectedCompany = companyItems[0];
    }

    const resolvedCompanyId = normalizeStoredId(selectedCompany);
    if (resolvedCompanyId) {
      if (typeof fetchBranches === "function") {
        await fetchBranches(resolvedCompanyId).catch(() => []);
      }
      return {
        effectiveLevel: PIPELINE_LEVELS.COMPANY,
        workspace,
        company: selectedCompany,
        branch: null,
        storageUpdates: {
          activeLevel: PIPELINE_LEVELS.COMPANY,
          activeCompanyId: resolvedCompanyId,
          activeBranchId: null,
        },
      };
    }

    const fallbackLevel = canAccessWorkspace
      ? PIPELINE_LEVELS.WORKSPACE
      : PIPELINE_LEVELS.COMPANY;

    return {
      effectiveLevel: fallbackLevel,
      workspace,
      company: null,
      branch: null,
      missingEntity: !canAccessWorkspace ? "company" : null,
      storageUpdates: {
        activeLevel: fallbackLevel,
        activeCompanyId: null,
        activeBranchId: null,
      },
    };
  }

  // Branch level restoration
  let selectedCompany = await resolveCompanyForBranchBoot({
    companyItems,
    targetCompanyId: cleanCompanyId,
    targetBranchId: cleanBranchId,
    fetchCompanyById,
    fetchBranchById,
  });

  let resolvedCompanyId = normalizeStoredId(selectedCompany);
  let branchItems =
    resolvedCompanyId && typeof fetchBranches === "function"
      ? normalizeArrayPayload(
          await fetchBranches(resolvedCompanyId).catch(() => []),
        )
      : [];

  // Branch-restricted staff without stored company/branch search across accessible companies
  if (!resolvedCompanyId && !canAccessWorkspace && companyItems.length > 0) {
    for (const candidateComp of companyItems) {
      const candidateCompId = normalizeStoredId(candidateComp);
      if (!candidateCompId || typeof fetchBranches !== "function") continue;
      const candidateBranches = normalizeArrayPayload(
        await fetchBranches(candidateCompId).catch(() => []),
      );
      if (candidateBranches.length > 0) {
        selectedCompany = candidateComp;
        resolvedCompanyId = candidateCompId;
        branchItems = candidateBranches;
        break;
      }
    }
    if (!resolvedCompanyId) {
      selectedCompany = companyItems[0];
      resolvedCompanyId = normalizeStoredId(selectedCompany);
      if (resolvedCompanyId && typeof fetchBranches === "function") {
        branchItems = normalizeArrayPayload(
          await fetchBranches(resolvedCompanyId).catch(() => []),
        );
      }
    }
  }

  if (!resolvedCompanyId) {
    const fallbackLevel = canAccessWorkspace
      ? PIPELINE_LEVELS.WORKSPACE
      : canAccessCompany
        ? PIPELINE_LEVELS.COMPANY
        : PIPELINE_LEVELS.BRANCH;

    return {
      effectiveLevel: fallbackLevel,
      workspace,
      company: null,
      branch: null,
      missingEntity: !canAccessWorkspace ? "company" : null,
      storageUpdates: {
        activeLevel: fallbackLevel,
        activeCompanyId: null,
        activeBranchId: null,
      },
    };
  }

  let selectedBranch = findEntityById(branchItems, cleanBranchId);
  if (
    !selectedBranch &&
    cleanBranchId &&
    typeof fetchBranchById === "function"
  ) {
    const directBranch = await fetchBranchById(cleanBranchId).catch(() => null);
    const ownerCompanyId = normalizeStoredId(directBranch?.companyId);
    if (
      normalizeStoredId(directBranch) &&
      (!ownerCompanyId || ownerCompanyId === resolvedCompanyId)
    ) {
      selectedBranch = directBranch;
    }
  }

  // Branch-restricted roles auto-select their first accessible branch
  if (!selectedBranch && !canAccessCompany && branchItems.length > 0) {
    selectedBranch = branchItems[0];
  }

  const resolvedBranchId = normalizeStoredId(selectedBranch);
  if (resolvedBranchId) {
    return {
      effectiveLevel: PIPELINE_LEVELS.BRANCH,
      workspace,
      company: selectedCompany,
      branch: selectedBranch,
      storageUpdates: {
        activeLevel: PIPELINE_LEVELS.BRANCH,
        activeCompanyId: resolvedCompanyId,
        activeBranchId: resolvedBranchId,
      },
    };
  }

  if (canAccessCompany) {
    return {
      effectiveLevel: PIPELINE_LEVELS.COMPANY,
      workspace,
      company: selectedCompany,
      branch: null,
      storageUpdates: {
        activeLevel: PIPELINE_LEVELS.COMPANY,
        activeCompanyId: resolvedCompanyId,
        activeBranchId: null,
      },
    };
  }

  return {
    effectiveLevel: PIPELINE_LEVELS.BRANCH,
    workspace,
    company: selectedCompany,
    branch: null,
    missingEntity: "branch",
    storageUpdates: {
      activeLevel: PIPELINE_LEVELS.BRANCH,
      activeCompanyId: resolvedCompanyId,
      activeBranchId: null,
    },
  };
};

export const shouldDeferDeepLinkEvaluation = ({
  isSyncComplete,
  workMode,
  hasSelectedMode,
  isSetupLoading,
  workspaceId,
  setupStatus,
} = {}) => {
  if (!isSyncComplete || !workMode || !hasSelectedMode) {
    return true;
  }
  if (isSetupLoading || (Boolean(workspaceId) && !setupStatus)) {
    return true;
  }
  return false;
};
