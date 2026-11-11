import { useState, useEffect, useMemo } from "react";
import { FiCheck, FiArrowRight, FiRotateCcw } from "react-icons/fi";
import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
  UIFormSection,
  UIInput,
  UISelect,
  UICheckbox,
  UIButton,
  UIAlert,
  UIKeyValueList,
  UIBadge,
} from "@/components/ui";
import { usePermission } from "@/hooks";
import {
  WORK_LEVELS,
  WORK_MODES,
  clampWorkLevelToAllowed,
  clampWorkModeToAllowed,
  isWorkAccessPermissionKey,
  normalizeWorkLevel,
  normalizeWorkModes,
  resolveRoleWorkAccess,
  syncPermissionsWithWorkAccess,
} from "@/utils/workAccess";

import { PHARMACY_ROLE_TEMPLATES } from "../constants/pharmacyRoleTemplates.constant";
import {
  extractPermissionOptions,
  formatTitle,
  groupPermissionOptionsByModule,
  validateWorkAccessSelection,
} from "../utils/roleForm.helper";
import { RoleWorkAccessBadges, RoleWorkAccessFields } from "./RoleWorkAccessFields";

const formatPermissionLabel = (permission) => {
  if (!permission) return "Permission";
  return formatTitle(permission) || String(permission);
};

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const INITIAL_FORM = {
  name: "",
  code: "",
  description: "",
  status: "active",
  workModes: [WORK_MODES.VIEW],
  workLevel: WORK_LEVELS.BRANCH,
  permissions: [],
};

export function RoleDialog({
  isOpen,
  onClose,
  mode = "create",
  roleData = null,
  allPermissions = [],
  onSubmitCreate,
  onSubmitUpdate,
  onSuccess,
}) {
  const {
    isOwner: isOwnerActor,
    allowedWorkModes: actorAllowedWorkModes,
    allowedWorkLevels: actorAllowedWorkLevels,
    highestWorkLevel: actorHighestWorkLevel,
  } = usePermission();

  const [currentStep, setCurrentStep] = useState(1); // 1 = Template, 2 = Form/Permissions
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("CUSTOM");
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [permissionFilter, setPermissionFilter] = useState("");

  // Extract normalized module permission options (work-mode/work-level handled via RoleWorkAccessFields)
  const permissionOptions = useMemo(
    () => extractPermissionOptions(allPermissions, { excludeWorkAccess: true }),
    [allPermissions],
  );

  const permissionsList = useMemo(
    () => permissionOptions.map((opt) => opt.value),
    [permissionOptions],
  );

  // Group available permissions by parsed module
  const groupedPermissions = useMemo(() => {
    const groups = {};
    for (const group of groupPermissionOptionsByModule(permissionOptions)) {
      groups[group.title] = group.permissions.map((opt) => opt.value);
    }
    return groups;
  }, [permissionOptions]);

  useEffect(() => {
    if (isOpen) {
      if ((mode === "edit" || mode === "view") && roleData) {
        setCurrentStep(2);
        const permList = (roleData.permissions || [])
          .map((p) => (typeof p === "object" ? p.value || p.name || p.id : String(p)))
          .filter((p) => p && !isWorkAccessPermissionKey(p));

        const resolvedAccess = resolveRoleWorkAccess(roleData);

        setFormData({
          name: roleData.name || roleData.roleName || "",
          code: roleData.code || roleData.roleCode || "",
          description: roleData.description || "",
          status: roleData.status || "active",
          workModes: resolvedAccess.allowedWorkModes,
          workLevel: resolvedAccess.highestWorkLevel,
          permissions: permList,
        });
      } else {
        setCurrentStep(1);
        setSelectedTemplateKey("CUSTOM");
        const defaultModes = isOwnerActor
          ? [WORK_MODES.VIEW]
          : [clampWorkModeToAllowed(WORK_MODES.VIEW, actorAllowedWorkModes)];
        const defaultLevel = isOwnerActor
          ? WORK_LEVELS.BRANCH
          : clampWorkLevelToAllowed(WORK_LEVELS.BRANCH, actorAllowedWorkLevels);

        setFormData({
          ...INITIAL_FORM,
          workModes: defaultModes,
          workLevel: normalizeWorkLevel(defaultLevel) || WORK_LEVELS.BRANCH,
        });
      }
      setFormErrors({});
      setServerError(null);
      setPermissionFilter("");
    } else {
      setFormData(INITIAL_FORM);
      setFormErrors({});
      setServerError(null);
    }
  }, [actorAllowedWorkLevels, actorAllowedWorkModes, isOpen, isOwnerActor, mode, roleData]);

  const handleSelectTemplate = (templateKey) => {
    setSelectedTemplateKey(templateKey);
    const tmpl = PHARMACY_ROLE_TEMPLATES[templateKey];
    if (!tmpl) return;

    let initialPerms = [];
    if (tmpl.defaultPermissions.includes("*")) {
      initialPerms = [...permissionsList];
    } else {
      initialPerms = permissionsList.filter((perm) =>
        tmpl.defaultPermissions.some((pattern) => {
          if (pattern.endsWith(":*")) {
            const prefix = pattern.replace(":*", "");
            return perm.startsWith(`${prefix}:`);
          }
          return perm === pattern;
        }),
      );
    }

    const templateModes = normalizeWorkModes(tmpl.workModes || [WORK_MODES.VIEW]);
    const cappedModes = isOwnerActor
      ? templateModes
      : templateModes.filter((m) => actorAllowedWorkModes.includes(m));
    const nextModes =
      cappedModes.length > 0
        ? cappedModes
        : [clampWorkModeToAllowed(WORK_MODES.VIEW, actorAllowedWorkModes)];

    const templateLevel = normalizeWorkLevel(tmpl.workLevel) || WORK_LEVELS.BRANCH;
    const nextLevel = isOwnerActor
      ? templateLevel
      : clampWorkLevelToAllowed(templateLevel, actorAllowedWorkLevels);

    setFormData((prev) => ({
      ...prev,
      name: tmpl.key !== "CUSTOM" ? tmpl.label : prev.name,
      code: tmpl.key !== "CUSTOM" ? tmpl.defaultCode || tmpl.key.toLowerCase() : prev.code,
      description: tmpl.description,
      workModes: nextModes,
      workLevel: nextLevel,
      permissions: initialPerms,
    }));
  };

  const handleFieldChange = (name, valueOrEvent) => {
    let val = valueOrEvent;
    if (valueOrEvent && typeof valueOrEvent === "object" && "target" in valueOrEvent) {
      val =
        valueOrEvent.target.type === "checkbox"
          ? valueOrEvent.target.checked
          : valueOrEvent.target.value;
    }
    setFormData((prev) => ({ ...prev, [name]: val }));
    setFormErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
  };

  const handleWorkModesChange = (nextModes) => {
    setFormData((prev) => ({ ...prev, workModes: nextModes }));
    setFormErrors((prev) => ({ ...prev, workAccess: "", submit: "" }));
  };

  const handleWorkLevelChange = (nextLevel) => {
    setFormData((prev) => ({ ...prev, workLevel: nextLevel }));
    setFormErrors((prev) => ({ ...prev, workAccess: "", submit: "" }));
  };

  const handleTogglePermission = (perm) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== perm)
          : [...prev.permissions, perm],
      };
    });
  };

  const handleToggleModulePermissions = (moduleName) => {
    const modulePerms = groupedPermissions[moduleName] || [];
    setFormData((prev) => {
      const allSelected = modulePerms.every((p) => prev.permissions.includes(p));
      const nextPerms = allSelected
        ? prev.permissions.filter((p) => !modulePerms.includes(p))
        : Array.from(new Set([...prev.permissions, ...modulePerms]));
      return { ...prev, permissions: nextPerms };
    });
  };

  const handleSelectAll = () => {
    setFormData((prev) => ({ ...prev, permissions: [...permissionsList] }));
  };

  const handleClearAll = () => {
    setFormData((prev) => ({ ...prev, permissions: [] }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Role name is required";
    if (!formData.code.trim()) errors.code = "Role code is required";

    const workAccessError = validateWorkAccessSelection({
      workModes: formData.workModes,
      workLevel: formData.workLevel,
      isOwnerActor,
      actorAllowedWorkModes,
      actorHighestWorkLevel,
    });
    if (workAccessError) errors.workAccess = workAccessError;

    return errors;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    const synced = syncPermissionsWithWorkAccess({
      permissions: formData.permissions,
      workModes: formData.workModes,
      workLevel: formData.workLevel,
    });

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toLowerCase(),
      description: formData.description.trim(),
      status: formData.status || "active",
      workModes: synced.workModes,
      workLevel: synced.workLevel,
      permissions: synced.permissions,
    };

    try {
      if (mode === "create") {
        await onSubmitCreate(payload);
      } else if (mode === "edit" && roleData?._id) {
        await onSubmitUpdate(roleData._id, payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setServerError(typeof err === "string" ? err : "Failed to save role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  const title = isCreate
    ? currentStep === 1
      ? "Select Role Template"
      : "Configure New Role"
    : isEdit
      ? "Edit Role & Permissions"
      : "Role Details";

  const subtitle = isCreate
    ? currentStep === 1
      ? "Pick a pre-configured pharmacy role template or start from scratch."
      : "Define role details, Work Modes, Work Level hierarchy, and module permissions."
    : isEdit
      ? "Update role description, Work Modes, Work Level tier, and assigned permissions."
      : "View role Work Modes, Work Level hierarchy, and module permission assignments.";

  const filteredModuleKeys = Object.keys(groupedPermissions).filter((moduleName) => {
    if (!permissionFilter.trim()) return true;
    const query = permissionFilter.toLowerCase();
    if (moduleName.toLowerCase().includes(query)) return true;
    return groupedPermissions[moduleName].some((p) => p.toLowerCase().includes(query));
  });

  return (
    <UIModal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      mobileSheet
      className="w-full max-w-5xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden"
    >
      <UIModalHeader>
        <UIModalTitle>{title}</UIModalTitle>
        <UIModalDescription>{subtitle}</UIModalDescription>
      </UIModalHeader>

      <UIModalBody className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7 space-y-6">
        {serverError && (
          <UIAlert variant="error" onDismiss={() => setServerError(null)}>
            {serverError}
          </UIAlert>
        )}

        {/* STEP 1: TEMPLATE SELECTION (CREATE MODE ONLY) */}
        {isCreate && currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(PHARMACY_ROLE_TEMPLATES).map((tmpl) => {
                const isSelected = selectedTemplateKey === tmpl.key;
                return (
                  <div
                    key={tmpl.key}
                    onClick={() => handleSelectTemplate(tmpl.key)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all space-y-2.5 ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md text-primary"
                        : "border-border bg-surface hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{tmpl.icon}</span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                          <FiCheck size={12} />
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text mb-1">{tmpl.label}</h4>
                      <p className="text-xs text-text-muted line-clamp-2">{tmpl.description}</p>
                    </div>
                    <RoleWorkAccessBadges
                      workModes={tmpl.workModes}
                      workLevel={tmpl.workLevel}
                      compact
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW MODE */}
        {isView && roleData && (
          <div className="space-y-6">
            <UIKeyValueList
              items={[
                { label: "Role Name", value: roleData.name || roleData.roleName || "N/A" },
                { label: "Role Code", value: roleData.code || roleData.roleCode || "N/A", copyable: true },
                {
                  label: "Status",
                  value: (
                    <UIBadge variant={roleData.status === "active" ? "success" : "neutral"}>
                      {(roleData.status || "active").toUpperCase()}
                    </UIBadge>
                  ),
                },
                {
                  label: "Module Permissions",
                  value: `${(formData.permissions || []).length} assigned module permissions`,
                },
                { label: "Description", value: roleData.description || "No description provided" },
              ]}
            />

            <RoleWorkAccessFields
              workModes={formData.workModes}
              workLevel={formData.workLevel}
              viewOnly
              compact
            />

            <div>
              <h4 className="text-sm font-semibold text-text mb-3">Assigned Permissions by Module</h4>
              <div className="space-y-3">
                {Object.keys(groupedPermissions).map((moduleName) => {
                  const assignedInModule = groupedPermissions[moduleName].filter((p) =>
                    formData.permissions.includes(p),
                  );
                  if (assignedInModule.length === 0) return null;

                  return (
                    <div key={moduleName} className="p-3 border border-border rounded-xl bg-surface-muted/30">
                      <h5 className="text-xs font-bold text-text mb-2">{moduleName}</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {assignedInModule.map((p) => (
                          <UIBadge key={p} variant="neutral" size="sm">
                            {formatPermissionLabel(p)}
                          </UIBadge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CREATE / EDIT FORM & PERMISSIONS */}
        {!isView && (isEdit || currentStep === 2) && (
          <form id="role-dialog-form" onSubmit={handleSubmit} className="space-y-5">
            <UIFormSection title="Role Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UIInput
                  label="Role Name"
                  placeholder="e.g. Senior Pharmacist"
                  value={formData.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  error={Boolean(formErrors.name)}
                  helperText={formErrors.name}
                  required
                />

                <UIInput
                  label="Role Code"
                  placeholder="e.g. senior_pharmacist"
                  value={formData.code}
                  onChange={(e) => handleFieldChange("code", e.target.value)}
                  error={Boolean(formErrors.code)}
                  helperText={formErrors.code}
                  disabled={isEdit}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UISelect
                  label="Status"
                  value={formData.status}
                  onChange={(val) => handleFieldChange("status", val)}
                  options={statusOptions}
                />

                <UIInput
                  label="Description"
                  placeholder="Responsibilities and access scope..."
                  value={formData.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                />
              </div>
            </UIFormSection>

            <UIFormSection title="Work Mode & Level Hierarchy">
              <RoleWorkAccessFields
                workModes={formData.workModes}
                workLevel={formData.workLevel}
                onChangeWorkModes={handleWorkModesChange}
                onChangeWorkLevel={handleWorkLevelChange}
                allowedActorWorkModes={isOwnerActor ? null : actorAllowedWorkModes}
                maxActorWorkLevel={isOwnerActor ? null : actorHighestWorkLevel}
                error={formErrors.workAccess}
                compact
              />
            </UIFormSection>

            <UIFormSection title="Module Permissions Checklist">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <UIInput
                  placeholder="Filter permissions..."
                  value={permissionFilter}
                  onChange={(e) => setPermissionFilter(e.target.value)}
                  className="max-w-xs"
                />

                <div className="flex items-center gap-2">
                  <UIButton type="button" variant="outline" size="small" onClick={handleSelectAll}>
                    Select All ({permissionsList.length})
                  </UIButton>
                  <UIButton type="button" variant="outline" size="small" onClick={handleClearAll}>
                    Clear All
                  </UIButton>
                </div>
              </div>

              <div className="space-y-3 max-h-[36vh] overflow-y-auto pr-1">
                {filteredModuleKeys.map((moduleName) => {
                  const modulePerms = groupedPermissions[moduleName] || [];
                  const isAllModuleSelected = modulePerms.every((p) =>
                    formData.permissions.includes(p),
                  );

                  return (
                    <div
                      key={moduleName}
                      className="p-3.5 border border-border rounded-xl bg-surface-muted/20 space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <span className="text-xs font-bold text-text uppercase tracking-wide">
                          {moduleName} ({modulePerms.filter((p) => formData.permissions.includes(p)).length}/{modulePerms.length})
                        </span>
                        <UIButton
                          type="button"
                          variant="ghost"
                          size="small"
                          onClick={() => handleToggleModulePermissions(moduleName)}
                        >
                          {isAllModuleSelected ? "Deselect Group" : "Select Group"}
                        </UIButton>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {modulePerms.map((perm) => {
                          const checked = formData.permissions.includes(perm);
                          return (
                            <UICheckbox
                              key={perm}
                              label={formatPermissionLabel(perm)}
                              checked={checked}
                              onChange={() => handleTogglePermission(perm)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </UIFormSection>
          </form>
        )}
      </UIModalBody>

      <UIModalFooter>
        {isCreate && currentStep === 1 ? (
          <>
            <UIButton variant="outline" onClick={onClose}>
              Cancel
            </UIButton>
            <UIButton variant="primary" onClick={() => setCurrentStep(2)} endIcon={<FiArrowRight />}>
              Configure Role Details
            </UIButton>
          </>
        ) : (
          <>
            {isCreate && currentStep === 2 && (
              <UIButton variant="outline" onClick={() => setCurrentStep(1)} startIcon={<FiRotateCcw />}>
                Back to Templates
              </UIButton>
            )}
            <UIButton variant="outline" onClick={onClose} disabled={isSubmitting}>
              {isView ? "Close" : "Cancel"}
            </UIButton>
            {!isView && (
              <UIButton variant="primary" type="submit" form="role-dialog-form" isLoading={isSubmitting}>
                {isCreate ? "Create Role" : "Save Changes"}
              </UIButton>
            )}
          </>
        )}
      </UIModalFooter>
    </UIModal>
  );
}

export default RoleDialog;
