import {
  WORK_LEVEL_RANK,
  WORK_LEVELS,
  WORK_MODES,
  expandWorkLevelHierarchy,
  isWorkAccessPermissionKey,
  normalizeWorkLevel,
  normalizeWorkModes,
  parsePermissionKey,
  resolveRoleWorkAccess,
} from "@/utils/workAccess";

export const normalizeText = (value) => String(value ?? "").trim();

export const normalizeLowerText = (value) =>
  normalizeText(value).toLowerCase();

export const formatTitle = (value) => {
  const cleaned = normalizeText(value).replace(/[_:.-]+/g, " ");
  if (!cleaned) return "";

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const createCodeFromName = (name) =>
  normalizeText(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

export const getActionTypeFromKey = (action) => {
  const clean = normalizeLowerText(action);
  if (["view", "read", "list", "get"].includes(clean)) return "view";
  if (["create", "add", "invite"].includes(clean)) return "create";
  if (
    ["update", "edit", "manage", "assign", "post", "close", "reopen"].includes(
      clean,
    )
  ) {
    return "manage";
  }
  if (["delete", "remove"].includes(clean)) return "delete";
  if (["export", "download", "print", "import"].includes(clean)) return "export";
  return "other";
};

export const buildPermissionOption = (permission) => {
  if (typeof permission === "string") {
    const value = normalizeText(permission);
    const { module, action } = parsePermissionKey(value);

    return {
      value,
      label: formatTitle(action) || value,
      description: "",
      module,
      action,
      actionType: getActionTypeFromKey(action),
      displayModule: formatTitle(module) || "General",
    };
  }

  const value = normalizeText(
    permission?.key || permission?.code || permission?.name || permission?.value,
  );
  const parsed = parsePermissionKey(value);
  const module = normalizeLowerText(permission?.module) || parsed.module;
  const action = parsed.action;

  return {
    value,
    label: normalizeText(permission?.label || permission?.name) || formatTitle(action) || value,
    description: normalizeText(permission?.description),
    module,
    action,
    actionType: getActionTypeFromKey(action),
    displayModule: formatTitle(module) || "General",
  };
};

export const extractPermissionOptions = (
  permissions = [],
  { excludeWorkAccess = true } = {},
) => {
  if (!Array.isArray(permissions)) return [];

  const seen = new Set();
  const options = [];

  for (const item of permissions) {
    const opt = buildPermissionOption(item);
    if (!opt.value || seen.has(opt.value)) continue;
    if (excludeWorkAccess && isWorkAccessPermissionKey(opt.value)) continue;
    seen.add(opt.value);
    options.push(opt);
  }

  return options.sort((a, b) => a.value.localeCompare(b.value));
};

export const groupPermissionOptionsByModule = (permissionOptions = []) => {
  const groupsMap = new Map();

  for (const option of permissionOptions) {
    const moduleKey = option.module || "general";
    if (!groupsMap.has(moduleKey)) {
      groupsMap.set(moduleKey, {
        key: moduleKey,
        title: option.displayModule || formatTitle(moduleKey) || "General",
        permissions: [],
      });
    }
    groupsMap.get(moduleKey).permissions.push(option);
  }

  return Array.from(groupsMap.values()).sort((a, b) =>
    a.title.localeCompare(b.title),
  );
};

export const groupModulePermissionStrings = (permissions = []) => {
  const options = extractPermissionOptions(permissions, {
    excludeWorkAccess: true,
  });
  return groupPermissionOptionsByModule(options).map((group) => ({
    key: group.key,
    title: group.title,
    permissions: group.permissions.map((opt) => opt.value),
  }));
};

export const normalizeRoleResponse = (response) => {
  if (!response) return null;
  if (response.data && !Array.isArray(response.data)) {
    return response.data.role || response.data;
  }
  return response.role || response;
};

export const buildWorkAccessDisplaySummary = (
  roleOrWorkAccess = null,
  { isOwner = false } = {},
) => {
  const resolved = roleOrWorkAccess?.allowedWorkModes && roleOrWorkAccess?.highestWorkLevel
    ? {
        allowedWorkModes: normalizeWorkModes(roleOrWorkAccess.allowedWorkModes),
        highestWorkLevel:
          normalizeWorkLevel(roleOrWorkAccess.highestWorkLevel) ||
          WORK_LEVELS.BRANCH,
        allowedWorkLevels: expandWorkLevelHierarchy(
          roleOrWorkAccess.highestWorkLevel || WORK_LEVELS.BRANCH,
        ),
        isOwner: Boolean(isOwner || roleOrWorkAccess.isOwner),
      }
    : resolveRoleWorkAccess(roleOrWorkAccess, { isOwner });

  const modeLabels = resolved.allowedWorkModes.map((m) =>
    m === WORK_MODES.OPERATION ? "Operation Mode" : "View Mode",
  );
  const levelLabelMap = {
    [WORK_LEVELS.WORKSPACE]: "Workspace Level",
    [WORK_LEVELS.COMPANY]: "Company Level",
    [WORK_LEVELS.BRANCH]: "Branch Level",
  };
  const hierarchyLabelMap = {
    [WORK_LEVELS.WORKSPACE]: "Workspace → Company → Branch",
    [WORK_LEVELS.COMPANY]: "Company → Branch",
    [WORK_LEVELS.BRANCH]: "Branch Only",
  };

  return {
    ...resolved,
    modeLabels,
    modeShortText: resolved.allowedWorkModes
      .map((m) => (m === WORK_MODES.OPERATION ? "Operation" : "View"))
      .join(" + "),
    levelLabel: levelLabelMap[resolved.highestWorkLevel] || "Branch Level",
    hierarchyLabel:
      hierarchyLabelMap[resolved.highestWorkLevel] || "Branch Only",
  };
};

export const isRoleEditableByPolicy = (role) => {
  if (!role) return false;
  const code = normalizeLowerText(role.code || role.roleCode);
  if (code === "owner") return false;
  return role.isEditable !== false;
};

export const canActorAssignRole = (
  role,
  { isOwner = false, actorWorkAccess = null } = {},
) => {
  if (!role) return false;
  const code = normalizeLowerText(role.code || role.roleCode);
  if (code === "owner") return false;
  if (isOwner || !actorWorkAccess || actorWorkAccess.isOwner) return true;

  const target = resolveRoleWorkAccess(role);
  const actorModes = new Set(actorWorkAccess.allowedWorkModes || []);
  const modesAllowed = target.allowedWorkModes.every((m) => actorModes.has(m));
  if (!modesAllowed) return false;

  const targetRank = WORK_LEVEL_RANK[target.highestWorkLevel] || 1;
  const actorRank = WORK_LEVEL_RANK[actorWorkAccess.highestWorkLevel] || 1;
  return targetRank <= actorRank;
};

const ROLE_ACTION_LABELS = {
  view: "View",
  create: "Create",
  update: "Update",
  delete: "Delete",
};

export const buildRoleMatrixViewModel = ({
  permissions = [],
  selectedPermissions = [],
  permissionSearch = "",
  moduleFilter = "all",
} = {}) => {
  const options = extractPermissionOptions(permissions, {
    excludeWorkAccess: true,
  }).map((opt) => ({
    ...opt,
    group: opt.displayModule,
    moduleKey: opt.module,
    actionLabel:
      ROLE_ACTION_LABELS[opt.action] || formatTitle(opt.action) || "Other",
  }));

  const selectedSet = new Set(
    Array.isArray(selectedPermissions) ? selectedPermissions : [],
  );
  const selectedPermissionOptions = options.filter((opt) =>
    selectedSet.has(opt.value),
  );

  const grouped = {};
  for (const option of options) {
    if (!grouped[option.group]) {
      grouped[option.group] = {
        id: option.moduleKey || option.group.toLowerCase(),
        title: option.group,
        permissions: [],
        actions: {},
      };
    }
    grouped[option.group].permissions.push(option);
    if (ROLE_ACTION_LABELS[option.action]) {
      grouped[option.group].actions[option.action] = option;
    }
  }

  const query = normalizeLowerText(permissionSearch);
  const permissionModules = Object.values(grouped)
    .filter((module) => {
      const matchesModule =
        moduleFilter === "all" || module.id === moduleFilter;
      const matchesSearch =
        !query ||
        module.title.toLowerCase().includes(query) ||
        module.permissions.some(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.value.toLowerCase().includes(query),
        );
      return matchesModule && matchesSearch;
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  const moduleOptions = [
    { label: "Module: All", value: "all" },
    ...Object.values(
      options.reduce((acc, option) => {
        acc[option.moduleKey] = {
          label: `Module: ${option.group}`,
          value: option.moduleKey,
        };
        return acc;
      }, {}),
    ).sort((a, b) => a.label.localeCompare(b.label)),
  ];

  const total = options.length;
  const selected = selectedPermissionOptions.length;

  return {
    permissionOptions: options,
    selectedPermissionOptions,
    permissionModules,
    moduleOptions,
    permissionSummary: {
      total,
      selected,
      groups: new Set(options.map((opt) => opt.group)).size,
      remaining: Math.max(total - selected, 0),
    },
  };
};

export const validateWorkAccessSelection = ({
  workModes = [],
  workLevel = "",
  isOwnerActor = true,
  actorAllowedWorkModes = null,
  actorHighestWorkLevel = null,
} = {}) => {
  const cleanModes = normalizeWorkModes(workModes);
  const cleanLevel = normalizeWorkLevel(workLevel);

  if (cleanModes.length === 0) {
    return "Select at least one work mode (View or Operation).";
  }

  if (!cleanLevel) {
    return "Select a valid work level (Workspace, Company, or Branch).";
  }

  if (!isOwnerActor && Array.isArray(actorAllowedWorkModes)) {
    const actorSet = new Set(actorAllowedWorkModes);
    const hasBlockedMode = cleanModes.some((m) => !actorSet.has(m));
    if (hasBlockedMode) {
      return "You cannot grant a work mode that your own role does not possess.";
    }
  }

  if (!isOwnerActor && actorHighestWorkLevel) {
    const selectedRank = WORK_LEVEL_RANK[cleanLevel] || 1;
    const actorRank = WORK_LEVEL_RANK[actorHighestWorkLevel] || 1;
    if (selectedRank > actorRank) {
      return "You cannot assign a work level higher than your own ceiling.";
    }
  }

  return "";
};
