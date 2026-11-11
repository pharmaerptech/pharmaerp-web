// src/utils/workAccess.js

export const WORK_MODES = Object.freeze({
  VIEW: "view",
  OPERATION: "operation",
});

export const VALID_WORK_MODES = Object.freeze([
  WORK_MODES.VIEW,
  WORK_MODES.OPERATION,
]);

export const WORK_LEVELS = Object.freeze({
  WORKSPACE: "workspace",
  COMPANY: "company",
  BRANCH: "branch",
});

export const WORK_LEVEL_RANK = Object.freeze({
  [WORK_LEVELS.BRANCH]: 1,
  [WORK_LEVELS.COMPANY]: 2,
  [WORK_LEVELS.WORKSPACE]: 3,
});

export const WORK_ACCESS_PERMISSIONS = Object.freeze({
  WORK_MODE_VIEW: "work-mode:view",
  WORK_MODE_OPERATION: "work-mode:operation",
  WORK_LEVEL_WORKSPACE: "work-level:workspace",
  WORK_LEVEL_COMPANY: "work-level:company",
  WORK_LEVEL_BRANCH: "work-level:branch",
});

export const WORK_MODE_TO_PERMISSION = Object.freeze({
  [WORK_MODES.VIEW]: WORK_ACCESS_PERMISSIONS.WORK_MODE_VIEW,
  [WORK_MODES.OPERATION]: WORK_ACCESS_PERMISSIONS.WORK_MODE_OPERATION,
});

export const PERMISSION_TO_WORK_MODE = Object.freeze({
  [WORK_ACCESS_PERMISSIONS.WORK_MODE_VIEW]: WORK_MODES.VIEW,
  [WORK_ACCESS_PERMISSIONS.WORK_MODE_OPERATION]: WORK_MODES.OPERATION,
});

export const WORK_LEVEL_TO_PERMISSION = Object.freeze({
  [WORK_LEVELS.WORKSPACE]: WORK_ACCESS_PERMISSIONS.WORK_LEVEL_WORKSPACE,
  [WORK_LEVELS.COMPANY]: WORK_ACCESS_PERMISSIONS.WORK_LEVEL_COMPANY,
  [WORK_LEVELS.BRANCH]: WORK_ACCESS_PERMISSIONS.WORK_LEVEL_BRANCH,
});

export const PERMISSION_TO_WORK_LEVEL = Object.freeze({
  [WORK_ACCESS_PERMISSIONS.WORK_LEVEL_WORKSPACE]: WORK_LEVELS.WORKSPACE,
  [WORK_ACCESS_PERMISSIONS.WORK_LEVEL_COMPANY]: WORK_LEVELS.COMPANY,
  [WORK_ACCESS_PERMISSIONS.WORK_LEVEL_BRANCH]: WORK_LEVELS.BRANCH,
});

export const WORK_ACCESS_META = Object.freeze({
  modes: [
    {
      value: WORK_MODES.VIEW,
      label: "View Mode",
      shortLabel: "View",
      permission: WORK_ACCESS_PERMISSIONS.WORK_MODE_VIEW,
      description:
        "Read dashboards, reports, ledgers, and analytics without operational edits.",
    },
    {
      value: WORK_MODES.OPERATION,
      label: "Operation Mode",
      shortLabel: "Operation",
      permission: WORK_ACCESS_PERMISSIONS.WORK_MODE_OPERATION,
      description:
        "Execute POS billing, inventory updates, shifts, entries, and operational CRUD.",
    },
  ],
  levels: [
    {
      value: WORK_LEVELS.WORKSPACE,
      label: "Workspace Level",
      shortLabel: "Workspace",
      permission: WORK_ACCESS_PERMISSIONS.WORK_LEVEL_WORKSPACE,
      inheritsLabel: "Workspace + Company + Branch",
      description:
        "Highest tier: accesses Workspace settings, Roles, Companies, and Branches.",
    },
    {
      value: WORK_LEVELS.COMPANY,
      label: "Company Level",
      shortLabel: "Company",
      permission: WORK_ACCESS_PERMISSIONS.WORK_LEVEL_COMPANY,
      inheritsLabel: "Company + Branch",
      description:
        "Middle tier: manages assigned Companies and their Branches (cannot open Workspace tier).",
    },
    {
      value: WORK_LEVELS.BRANCH,
      label: "Branch Level",
      shortLabel: "Branch",
      permission: WORK_ACCESS_PERMISSIONS.WORK_LEVEL_BRANCH,
      inheritsLabel: "Branch Only",
      description:
        "Store tier: operates inside assigned Branches only (cannot ascend to Company or Workspace).",
    },
  ],
});

const WORK_ACCESS_PERMISSION_SET = new Set(Object.values(WORK_ACCESS_PERMISSIONS));

export const isWorkAccessPermissionKey = (permission) =>
  WORK_ACCESS_PERMISSION_SET.has(String(permission || "").trim());

export const parsePermissionKey = (permission = "") => {
  const raw = String(permission || "").trim();
  if (!raw) return { module: "other", action: "other" };

  if (raw.includes(":")) {
    const [mod, action] = raw.split(":");
    return {
      module: (mod || "other").toLowerCase(),
      action: (action || "other").toLowerCase().replace(/^edit$/, "update"),
    };
  }

  const parts = raw.toLowerCase().replace(/\bedit\b/g, "update").split(".").filter(Boolean);
  return {
    module: parts[0] || "other",
    action: parts[1] || "other",
  };
};

export const normalizeWorkModes = (workModes = []) => {
  const list = Array.isArray(workModes)
    ? workModes
    : workModes
      ? [workModes]
      : [];
  const set = new Set(
    list
      .map((item) => String(item || "").trim().toLowerCase())
      .filter((item) => item === WORK_MODES.VIEW || item === WORK_MODES.OPERATION),
  );
  return VALID_WORK_MODES.filter((mode) => set.has(mode));
};

export const normalizeWorkLevel = (level) => {
  const clean = String(level || "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(WORK_LEVEL_RANK, clean)
    ? clean
    : null;
};

export const expandWorkLevelHierarchy = (highestLevel) => {
  const level = normalizeWorkLevel(highestLevel);
  if (!level) return [];
  const rank = WORK_LEVEL_RANK[level];
  return [WORK_LEVELS.WORKSPACE, WORK_LEVELS.COMPANY, WORK_LEVELS.BRANCH].filter(
    (candidate) => WORK_LEVEL_RANK[candidate] <= rank,
  );
};

export const extractWorkModesFromPermissions = (permissions = []) => {
  const set = new Set(Array.isArray(permissions) ? permissions : []);
  return VALID_WORK_MODES.filter((mode) => set.has(WORK_MODE_TO_PERMISSION[mode]));
};

export const extractWorkLevelFromPermissions = (permissions = []) => {
  let highest = null;
  let maxRank = 0;

  for (const permission of Array.isArray(permissions) ? permissions : []) {
    const lvl = PERMISSION_TO_WORK_LEVEL[permission];
    if (lvl && WORK_LEVEL_RANK[lvl] > maxRank) {
      maxRank = WORK_LEVEL_RANK[lvl];
      highest = lvl;
    }
  }

  return highest;
};

export const resolveRoleWorkAccess = (role = null, { isOwner = false } = {}) => {
  const roleCode = String(role?.code || "").trim().toLowerCase();
  if (isOwner || roleCode === "owner") {
    return {
      allowedWorkModes: [WORK_MODES.VIEW, WORK_MODES.OPERATION],
      highestWorkLevel: WORK_LEVELS.WORKSPACE,
      allowedWorkLevels: expandWorkLevelHierarchy(WORK_LEVELS.WORKSPACE),
      defaultWorkMode: WORK_MODES.VIEW,
      defaultWorkLevel: WORK_LEVELS.WORKSPACE,
      isOwner: true,
    };
  }

  const perms = Array.isArray(role?.permissions) ? role.permissions : [];
  const explicitModes = normalizeWorkModes(role?.workModes || role?.workAccess?.allowedWorkModes);
  const permModes = extractWorkModesFromPermissions(perms);
  const allowedWorkModes =
    explicitModes.length > 0
      ? explicitModes
      : permModes.length > 0
        ? permModes
        : [WORK_MODES.VIEW];

  const explicitLevel = normalizeWorkLevel(
    role?.workLevel || role?.workAccess?.highestWorkLevel,
  );
  const permLevel = extractWorkLevelFromPermissions(perms);
  const highestWorkLevel = explicitLevel || permLevel || WORK_LEVELS.BRANCH;
  const allowedWorkLevels = expandWorkLevelHierarchy(highestWorkLevel);

  return {
    allowedWorkModes,
    highestWorkLevel,
    allowedWorkLevels,
    defaultWorkMode: allowedWorkModes.includes(WORK_MODES.VIEW)
      ? WORK_MODES.VIEW
      : allowedWorkModes[0] || WORK_MODES.OPERATION,
    defaultWorkLevel: highestWorkLevel,
    isOwner: false,
  };
};

export const resolveMyWorkAccess = (
  myAccess = null,
  { isOwnerOverride = false } = {},
) => {
  const isOwner = Boolean(
    isOwnerOverride || myAccess?.isOwner || myAccess?.member?.isOwner,
  );

  if (isOwner) {
    return resolveRoleWorkAccess(null, { isOwner: true });
  }

  if (!myAccess) {
    return null;
  }

  if (myAccess.workAccess) {
    const wa = myAccess.workAccess;
    const allowedWorkModes = normalizeWorkModes(wa.allowedWorkModes);
    const highestWorkLevel = normalizeWorkLevel(wa.highestWorkLevel);
    if (allowedWorkModes.length > 0 && highestWorkLevel) {
      return {
        allowedWorkModes,
        highestWorkLevel,
        allowedWorkLevels: expandWorkLevelHierarchy(highestWorkLevel),
        defaultWorkMode: allowedWorkModes.includes(WORK_MODES.VIEW)
          ? WORK_MODES.VIEW
          : allowedWorkModes[0],
        defaultWorkLevel: highestWorkLevel,
        isOwner: false,
      };
    }
  }

  return resolveRoleWorkAccess(
    {
      ...(myAccess.role || {}),
      permissions: myAccess.permissions || myAccess.role?.permissions || [],
    },
    { isOwner: false },
  );
};

export const isWorkModeAllowed = (workAccess, targetMode) => {
  if (!workAccess) return true;
  if (workAccess.isOwner) return true;
  const clean = String(targetMode || "").trim().toLowerCase();
  if (!clean) return true;
  if (clean === "both") {
    return (
      workAccess.allowedWorkModes?.includes(WORK_MODES.VIEW) ||
      workAccess.allowedWorkModes?.includes(WORK_MODES.OPERATION)
    );
  }
  return Boolean(workAccess.allowedWorkModes?.includes(clean));
};

export const isWorkLevelAllowed = (workAccess, targetLevel) => {
  if (!workAccess) return true;
  if (workAccess.isOwner) return true;
  const clean = normalizeWorkLevel(targetLevel);
  if (!clean) return false;
  return Boolean(workAccess.allowedWorkLevels?.includes(clean));
};

export const clampWorkLevelToAllowed = (
  requestedLevel,
  allowedLevels = null,
) => {
  if (!Array.isArray(allowedLevels) || allowedLevels.length === 0) {
    return normalizeWorkLevel(requestedLevel) || WORK_LEVELS.BRANCH;
  }

  const normalizedAllowed = [
    WORK_LEVELS.WORKSPACE,
    WORK_LEVELS.COMPANY,
    WORK_LEVELS.BRANCH,
  ].filter((lvl) => allowedLevels.includes(lvl));

  if (normalizedAllowed.length === 0) {
    return WORK_LEVELS.BRANCH;
  }

  const reqClean = normalizeWorkLevel(requestedLevel);
  if (reqClean && normalizedAllowed.includes(reqClean)) {
    return reqClean;
  }

  // Clamp to highest permitted level for this user
  return normalizedAllowed[0];
};

export const clampWorkModeToAllowed = (
  requestedMode,
  allowedModes = null,
) => {
  if (!Array.isArray(allowedModes) || allowedModes.length === 0) {
    return requestedMode || WORK_MODES.VIEW;
  }

  const normalized = normalizeWorkModes(allowedModes);
  if (normalized.length === 0) {
    return WORK_MODES.VIEW;
  }

  const cleanReq = String(requestedMode || "").trim().toLowerCase();
  if (cleanReq && normalized.includes(cleanReq)) {
    return cleanReq;
  }

  return normalized.includes(WORK_MODES.VIEW) ? WORK_MODES.VIEW : normalized[0];
};

export const syncPermissionsWithWorkAccess = ({
  permissions = [],
  workModes = [WORK_MODES.VIEW],
  workLevel = WORK_LEVELS.BRANCH,
} = {}) => {
  const cleanModes = normalizeWorkModes(workModes);
  const resolvedModes = cleanModes.length > 0 ? cleanModes : [WORK_MODES.VIEW];
  const resolvedLevel = normalizeWorkLevel(workLevel) || WORK_LEVELS.BRANCH;

  const basePermissions = (Array.isArray(permissions) ? permissions : []).filter(
    (p) => typeof p === "string" && p.trim() && !isWorkAccessPermissionKey(p),
  );

  const accessKeys = [
    ...resolvedModes.map((mode) => WORK_MODE_TO_PERMISSION[mode]),
    WORK_LEVEL_TO_PERMISSION[resolvedLevel],
  ].filter(Boolean);

  return {
    workModes: resolvedModes,
    workLevel: resolvedLevel,
    permissions: Array.from(new Set([...accessKeys, ...basePermissions])),
  };
};

export default {
  WORK_MODES,
  VALID_WORK_MODES,
  WORK_LEVELS,
  WORK_LEVEL_RANK,
  WORK_ACCESS_PERMISSIONS,
  WORK_ACCESS_META,
  isWorkAccessPermissionKey,
  parsePermissionKey,
  normalizeWorkModes,
  normalizeWorkLevel,
  expandWorkLevelHierarchy,
  extractWorkModesFromPermissions,
  extractWorkLevelFromPermissions,
  resolveRoleWorkAccess,
  resolveMyWorkAccess,
  isWorkModeAllowed,
  isWorkLevelAllowed,
  clampWorkLevelToAllowed,
  clampWorkModeToAllowed,
  syncPermissionsWithWorkAccess,
};

