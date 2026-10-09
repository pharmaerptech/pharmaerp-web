import React, { useState, useEffect, useMemo } from "react";
import {
  FiFolder,
  FiEdit2,
  FiCopy,
  FiCheck,
  FiLayers,
  FiGitBranch,
  FiTag,
  FiActivity,
} from "react-icons/fi";
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
  UIButton,
  UIAlert,
  UIKeyValueList,
  UIBadge,
} from "@/components/ui";

const natureOptions = [
  { label: "Select Nature", value: "" },
  { label: "Asset", value: "ASSET" },
  { label: "Liability", value: "LIABILITY" },
  { label: "Income", value: "INCOME" },
  { label: "Expense", value: "EXPENSE" },
  { label: "Equity", value: "EQUITY" },
];

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const INITIAL_FORM = {
  groupName: "",
  groupCode: "",
  parentGroupId: "",
  nature: "",
  description: "",
  status: "active",
};

/**
 * Top Live Preview Card for Account Group
 */
const GroupLiveCard = ({ formData, parentGroupName }) => {
  const natureBadgeVariant = {
    ASSET: "success",
    LIABILITY: "danger",
    INCOME: "info",
    EXPENSE: "warning",
    EQUITY: "purple",
  }[formData.nature] || "neutral";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-muted/60 p-5 shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 font-bold text-base shadow-inner">
            <FiFolder className="text-xl" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-muted border border-border text-text-muted">
                {formData.groupCode || "GRP-AUTO"}
              </span>
              {formData.nature && (
                <UIBadge variant={natureBadgeVariant} size="sm">
                  {formData.nature}
                </UIBadge>
              )}
              <UIBadge
                variant={formData.status === "active" ? "success" : "neutral"}
                size="sm"
              >
                {(formData.status || "active").toUpperCase()}
              </UIBadge>
            </div>
            <h4 className="mt-1 truncate text-base font-bold text-text">
              {formData.groupName || "New Account Group"}
            </h4>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] font-medium text-text-muted block">
            Hierarchy
          </span>
          <span className="text-xs font-bold text-text">
            {formData.parentGroupId ? "Subgroup" : "Primary Group"}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-1.5 truncate">
          <FiGitBranch className="text-primary/70 shrink-0" />
          <span className="truncate">
            Under Group:{" "}
            <strong className="text-text font-semibold">
              {parentGroupName || "None (Root Group)"}
            </strong>
          </span>
        </div>
        <div className="shrink-0 font-medium">
          Nature:{" "}
          <strong className="text-text font-semibold">
            {formData.nature || "Unclassified"}
          </strong>
        </div>
      </div>
    </div>
  );
};

export function AccountGroupDialog({
  isOpen,
  onClose,
  mode = "create",
  groupData = null,
  accountGroups = [],
  onSubmitCreate,
  onSubmitUpdate,
  onSuccess,
}) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if ((currentMode === "edit" || currentMode === "view") && groupData) {
        const pId =
          typeof groupData.parentGroupId === "object"
            ? groupData.parentGroupId?._id
            : groupData.parentGroupId || "";

        setFormData({
          groupName: groupData.groupName || groupData.name || "",
          groupCode: groupData.groupCode || groupData.code || "",
          parentGroupId: pId,
          nature: (groupData.nature || "").toUpperCase(),
          description: groupData.description || "",
          status: groupData.status || "active",
        });
      } else {
        setFormData(INITIAL_FORM);
      }
      setFormErrors({});
      setServerError(null);
    } else {
      setFormData(INITIAL_FORM);
      setFormErrors({});
      setServerError(null);
    }
  }, [isOpen, currentMode, groupData]);

  const parentOptions = useMemo(() => {
    const opts = [{ label: "None (Primary / Root Group)", value: "" }];
    accountGroups.forEach((g) => {
      // Don't allow selecting itself as parent
      if (groupData?._id && (g._id === groupData._id || g.id === groupData._id)) return;
      opts.push({ label: g.groupName || g.name, value: g._id || g.id });
    });
    return opts;
  }, [accountGroups, groupData]);

  const parentGroupName = useMemo(() => {
    if (!formData.parentGroupId) return null;
    const parent = accountGroups.find(
      (g) => (g._id || g.id) === formData.parentGroupId
    );
    return parent?.groupName || parent?.name || null;
  }, [accountGroups, formData.parentGroupId]);

  const handleFieldChange = (name, valueOrEvent) => {
    let val = valueOrEvent;
    if (
      valueOrEvent &&
      typeof valueOrEvent === "object" &&
      "target" in valueOrEvent
    ) {
      val =
        valueOrEvent.target.type === "checkbox"
          ? valueOrEvent.target.checked
          : valueOrEvent.target.value;
    }

    setFormData((prev) => {
      const next = { ...prev, [name]: val };
      // If choosing a parent group and nature is empty or can inherit
      if (name === "parentGroupId" && val) {
        const parent = accountGroups.find((g) => (g._id || g.id) === val);
        if (parent?.nature && !next.nature) {
          next.nature = parent.nature.toUpperCase();
        }
      }
      return next;
    });

    setFormErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
  };

  const copyText = (key, text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const validate = () => {
    const errors = {};
    if (!formData.groupName.trim()) {
      errors.groupName = "Group name is required";
    } else if (formData.groupName.trim().length < 2) {
      errors.groupName = "Group name must be at least 2 characters";
    }

    if (!formData.groupCode.trim()) {
      errors.groupCode = "Group code is required";
    }

    if (!formData.nature) {
      errors.nature = "Nature is required";
    }

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

    const payload = {
      groupName: formData.groupName.trim(),
      groupCode: formData.groupCode.trim(),
      parentGroupId: formData.parentGroupId || null,
      nature: formData.nature,
      description: formData.description.trim(),
      status: formData.status || "active",
    };

    try {
      if (currentMode === "create") {
        await onSubmitCreate(payload);
      } else if (currentMode === "edit" && groupData?._id) {
        await onSubmitUpdate(groupData._id, payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setServerError(
        typeof err === "string" ? err : "Failed to save account group."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isView = currentMode === "view";
  const isEdit = currentMode === "edit";
  const isCreate = currentMode === "create";

  const title = isCreate
    ? "Add Account Group"
    : isEdit
    ? "Edit Account Group"
    : "Account Group Details";

  const subtitle = isCreate
    ? "Create a new classification category for general ledger accounts."
    : isEdit
    ? "Modify group properties, hierarchy, or status."
    : "View group hierarchy, nature classification, and associated accounts.";

  const natureBadgeVariantMap = {
    ASSET: "success",
    LIABILITY: "danger",
    INCOME: "info",
    EXPENSE: "warning",
    EQUITY: "purple",
  };

  return (
    <UIModal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      mobileSheet
      className="w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden"
    >
      <UIModalHeader>
        <div className="flex items-center justify-between gap-3 w-full pr-6">
          <div>
            <UIModalTitle>{title}</UIModalTitle>
            <UIModalDescription>{subtitle}</UIModalDescription>
          </div>
          {isView && (
            <UIButton
              variant="outline"
              size="sm"
              startIcon={<FiEdit2 />}
              onClick={() => setCurrentMode("edit")}
              className="shrink-0"
            >
              Edit Group
            </UIButton>
          )}
        </div>
      </UIModalHeader>

      <UIModalBody className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7 space-y-6">
        {serverError && (
          <UIAlert variant="error" onDismiss={() => setServerError(null)}>
            {serverError}
          </UIAlert>
        )}

        {/* Live Card Preview for Create/Edit */}
        {!isView && (
          <GroupLiveCard
            formData={formData}
            parentGroupName={parentGroupName}
          />
        )}

        {/* VIEW MODE */}
        {isView && groupData && (
          <div className="space-y-6">
            {/* Hero Profile Banner */}
            <div className="rounded-2xl border border-border bg-surface-muted/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 font-bold text-xl shadow-inner">
                  {(groupData.groupName || groupData.name || "AG")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-surface border border-border text-text">
                      {groupData.groupCode || groupData.code || "N/A"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          "code",
                          groupData.groupCode || groupData.code
                        )
                      }
                      className="text-text-muted hover:text-text transition-colors p-1"
                      title="Copy Group Code"
                    >
                      {copiedKey === "code" ? (
                        <FiCheck className="text-success text-xs" />
                      ) : (
                        <FiCopy className="text-xs" />
                      )}
                    </button>
                    <UIBadge
                      variant={
                        natureBadgeVariantMap[
                          (groupData.nature || "").toUpperCase()
                        ] || "neutral"
                      }
                    >
                      {(groupData.nature || "ASSET").toUpperCase()}
                    </UIBadge>
                    <UIBadge
                      variant={
                        groupData.status === "active" ? "success" : "neutral"
                      }
                    >
                      {(groupData.status || "active").toUpperCase()}
                    </UIBadge>
                  </div>
                  <h3 className="mt-1 text-xl font-bold text-text">
                    {groupData.groupName || groupData.name}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {groupData.parentGroupId
                      ? `Subgroup of ${parentGroupName || "Parent Group"}`
                      : "Primary Root Group"}
                  </p>
                </div>
              </div>
            </div>

            {/* 3 KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <FiActivity className="text-lg" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-text-muted block">
                    Classification Nature
                  </span>
                  <span className="text-sm font-bold text-text">
                    {(groupData.nature || "ASSET").toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FiGitBranch className="text-lg" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-text-muted block">
                    Hierarchy Level
                  </span>
                  <span className="text-sm font-bold text-text">
                    {groupData.parentGroupId ? "Level 2 Subgroup" : "Level 1 Root"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <FiLayers className="text-lg" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-text-muted block">
                    Linked Accounts
                  </span>
                  <span className="text-sm font-bold text-text">
                    {groupData.accountsCount ?? 0} Accounts
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata details */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">
                Account Group Metadata
              </h4>
              <UIKeyValueList
                items={[
                  {
                    label: "Group Name",
                    value: groupData.groupName || groupData.name || "N/A",
                  },
                  {
                    label: "Group Code",
                    value: groupData.groupCode || groupData.code || "N/A",
                    copyable: true,
                  },
                  {
                    label: "Parent Group",
                    value: parentGroupName || "None (Primary Group)",
                  },
                  {
                    label: "Nature",
                    value: (
                      <UIBadge
                        variant={
                          natureBadgeVariantMap[
                            (groupData.nature || "").toUpperCase()
                          ] || "neutral"
                        }
                      >
                        {(groupData.nature || "N/A").toUpperCase()}
                      </UIBadge>
                    ),
                  },
                  {
                    label: "Status",
                    value: (
                      <UIBadge
                        variant={
                          groupData.status === "active" ? "success" : "neutral"
                        }
                      >
                        {(groupData.status || "active").toUpperCase()}
                      </UIBadge>
                    ),
                  },
                  {
                    label: "Description",
                    value:
                      groupData.description || "No description provided",
                  },
                ]}
              />
            </div>
          </div>
        )}

        {/* CREATE / EDIT MODE */}
        {!isView && (
          <form
            id="account-group-dialog-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <UIFormSection title="Group Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UIInput
                  label="Group Name"
                  placeholder="e.g. Current Assets"
                  value={formData.groupName}
                  onChange={(e) =>
                    handleFieldChange("groupName", e.target.value)
                  }
                  error={Boolean(formErrors.groupName)}
                  helperText={formErrors.groupName}
                  required
                />

                <UIInput
                  label="Group Code"
                  placeholder="e.g. GRP-CA01"
                  value={formData.groupCode}
                  onChange={(e) =>
                    handleFieldChange("groupCode", e.target.value)
                  }
                  error={Boolean(formErrors.groupCode)}
                  helperText={formErrors.groupCode}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UISelect
                  label="Parent / Under Group (Optional)"
                  value={formData.parentGroupId}
                  onChange={(val) => handleFieldChange("parentGroupId", val)}
                  options={parentOptions}
                  helperText="Leave as None to make this a Primary Root Group"
                />

                <UISelect
                  label="Nature"
                  value={formData.nature}
                  onChange={(val) => handleFieldChange("nature", val)}
                  options={natureOptions}
                  error={Boolean(formErrors.nature)}
                  helperText={formErrors.nature}
                  required
                />
              </div>

              <UISelect
                label="Status"
                value={formData.status}
                onChange={(val) => handleFieldChange("status", val)}
                options={statusOptions}
              />

              <UIInput
                label="Description (Optional)"
                placeholder="Description of this account group..."
                value={formData.description}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
              />
            </UIFormSection>
          </form>
        )}
      </UIModalBody>

      <UIModalFooter>
        <UIButton variant="outline" onClick={onClose} disabled={isSubmitting}>
          {isView ? "Close" : "Cancel"}
        </UIButton>

        {isView ? (
          <UIButton
            variant="primary"
            startIcon={<FiEdit2 />}
            onClick={() => setCurrentMode("edit")}
          >
            Edit Group
          </UIButton>
        ) : (
          <UIButton
            variant="primary"
            type="submit"
            form="account-group-dialog-form"
            isLoading={isSubmitting}
          >
            {isCreate ? "Create Group" : "Save Changes"}
          </UIButton>
        )}
      </UIModalFooter>
    </UIModal>
  );
}

export default AccountGroupDialog;
