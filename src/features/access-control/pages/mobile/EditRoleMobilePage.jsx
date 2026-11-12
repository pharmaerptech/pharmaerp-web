// src/features/access-control/pages/mobile/EditRoleMobilePage.jsx

import { ArrowLeft, Check } from "lucide-react";

import {
  UIButton,
  UIIconButton,
  UIInput,
  UISearchInput,
  UISelect,
  UISwitch,
  UISkeleton,
  UIAlert,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { RoleWorkAccessFields } from "@/features/access-control/components";

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export default function EditRoleMobilePage({
  formData = {
    name: "",
    code: "",
    description: "",
    workModes: ["view"],
    workLevel: "branch",
    permissions: [],
    status: "active",
  },
  formErrors = {},

  permissionModules = [],
  permissionSearch = "",
  permissionSummary = { total: 0, selected: 0, groups: 0, remaining: 0 },

  actorAllowedWorkModes = null,
  actorHighestWorkLevel = null,
  isRoleLocked = false,
  isOwnerRole = false,

  isUpdating = false,
  isLoadingPermissions = false,

  handleChange,
  handleWorkModesChange,
  handleWorkLevelChange,
  handleTogglePermission,
  handleToggleModule,
  handleSelectAllPermissions,
  handleClearPermissions,
  handleSubmit,
  handleBack,
  handleCancel,

  setPermissionSearch,
}) {
  return (
    <div className="min-h-screen bg-bg text-text p-3 pb-24 space-y-3.5">
      {/* Header */}
      <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <UIIconButton
            variant="outline"
            size="sm"
            onClick={handleBack}
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </UIIconButton>
          <div>
            <h1 className="text-base font-bold text-text">Edit Role</h1>
            <span className="text-[11px] text-text-muted">
              {formData.name || "Custom Role"}
            </span>
          </div>
        </div>

        <UIButton
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          isLoading={isUpdating}
          disabled={isRoleLocked}
          startIcon={<Check className="size-3.5" />}
        >
          Save
        </UIButton>
      </div>

      {formErrors.submit && (
        <UIAlert intent="danger" title="Error" description={formErrors.submit} />
      )}

      {isRoleLocked && (
        <UIAlert
          intent="warning"
          title={isOwnerRole ? "Protected Owner Role" : "Role Locked"}
          description={
            isOwnerRole
              ? "Owner holds full access across all modes and levels."
              : "This role cannot be modified."
          }
        />
      )}

      {/* Role Identity Form */}
      <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">
          Role Details
        </h2>

        <div>
          <label className="text-xs font-semibold text-text block mb-1">
            Role Name <span className="text-destructive">*</span>
          </label>
          <UIInput
            name="name"
            placeholder="e.g. Senior Pharmacist"
            value={formData.name}
            onChange={handleChange}
            error={formErrors.name}
            disabled={isRoleLocked}
            size="sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text block mb-1">
            Status
          </label>
          <UISelect
            size="sm"
            name="status"
            value={formData.status || "active"}
            onChange={handleChange}
            options={statusOptions}
            disabled={isRoleLocked}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text block mb-1">
            Description
          </label>
          <textarea
            name="description"
            rows={2}
            placeholder="Describe role responsibilities..."
            value={formData.description}
            onChange={handleChange}
            disabled={isRoleLocked}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text placeholder:text-text-muted/60 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60"
          />
        </div>
      </div>

      {/* Work Modes & Level Hierarchy */}
      <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-3">
        <RoleWorkAccessFields
          workModes={formData.workModes}
          workLevel={formData.workLevel}
          onChangeWorkModes={handleWorkModesChange}
          onChangeWorkLevel={handleWorkLevelChange}
          allowedActorWorkModes={actorAllowedWorkModes}
          maxActorWorkLevel={actorHighestWorkLevel}
          disabled={isRoleLocked}
          error={formErrors.workAccess}
          compact
        />
      </div>

      {/* Permissions Section */}
      <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-text uppercase tracking-wider">
              Module Permissions
            </h2>
            <span className="text-[11px] text-text-muted">
              {permissionSummary.selected} / {permissionSummary.total} assigned
            </span>
          </div>

          {!isRoleLocked && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllPermissions}
                className="text-xs text-primary font-semibold hover:underline"
              >
                All
              </button>
              <span className="text-border">|</span>
              <button
                type="button"
                onClick={handleClearPermissions}
                className="text-xs text-text-muted font-semibold hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <UISearchInput
          placeholder="Search permissions..."
          value={permissionSearch}
          onChange={(e) => setPermissionSearch(e.target.value)}
          onClear={() => setPermissionSearch("")}
          size="sm"
        />

        {isLoadingPermissions ? (
          <div className="space-y-2">
            <UISkeleton className="h-16 w-full rounded-xl" />
            <UISkeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {permissionModules.map((mod) => {
              const modVals = mod.permissions.map((p) => p.value);
              const selectedCount = modVals.filter((v) =>
                formData.permissions.includes(v),
              ).length;
              const isAll = modVals.length > 0 && selectedCount === modVals.length;

              return (
                <div
                  key={mod.id}
                  className="p-3 rounded-xl border border-border/60 bg-surface-alt/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text">
                      {mod.title} ({selectedCount}/{modVals.length})
                    </span>
                    <UISwitch
                      checked={isAll}
                      onChange={() => !isRoleLocked && handleToggleModule(mod)}
                      disabled={isRoleLocked}
                      size="sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {mod.permissions.map((perm) => {
                      const isChecked = formData.permissions.includes(perm.value);
                      return (
                        <button
                          key={perm.value}
                          type="button"
                          disabled={isRoleLocked}
                          onClick={() => !isRoleLocked && handleTogglePermission(perm.value)}
                          className={cn(
                            "p-1.5 rounded-lg border text-left transition-all flex items-center justify-between text-[11px] disabled:opacity-70",
                            isChecked
                              ? "bg-surface border-primary/50 text-primary font-semibold"
                              : "bg-surface/50 border-border/60 text-text-muted",
                          )}
                        >
                          <span className="truncate">{perm.actionLabel || perm.label}</span>
                          {isChecked && <Check className="size-3 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-surface/90 backdrop-blur-md border-t border-border/60 flex items-center gap-2 z-30">
        <UIButton
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleCancel}
          disabled={isUpdating}
        >
          Cancel
        </UIButton>
        <UIButton
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={handleSubmit}
          isLoading={isUpdating}
          disabled={isRoleLocked}
          startIcon={<Check className="size-3.5" />}
        >
          Save Changes
        </UIButton>
      </div>
    </div>
  );
}
