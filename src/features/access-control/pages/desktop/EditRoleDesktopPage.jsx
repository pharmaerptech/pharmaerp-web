// src/features/access-control/pages/desktop/EditRoleDesktopPage.jsx

import {
  Shield,
  ArrowLeft,
  Check,
  Layers,
  Sparkles,
  FileKey,
} from "lucide-react";

import {
  UIButton,
  UIIconButton,
  UIInput,
  UISearchInput,
  UISelect,
  UISwitch,
  UIBadge,
  UISkeleton,
  UIAlert,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  RoleWorkAccessBadges,
  RoleWorkAccessFields,
} from "@/features/access-control/components";
import { buildWorkAccessDisplaySummary } from "../../utils/roleForm.helper";

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export default function EditRoleDesktopPage({
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
  moduleOptions = [],
  moduleFilter = "all",
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
  setModuleFilter,
}) {
  const workAccessSummary = buildWorkAccessDisplaySummary({
    workModes: formData.workModes,
    workLevel: formData.workLevel,
  });

  return (
    <div className="min-h-screen bg-bg text-text p-3 sm:p-4 lg:p-5 max-w-[1440px] mx-auto space-y-4">
      {/* Feedback Alert */}
      {formErrors.submit && (
        <UIAlert
          intent="danger"
          title="Role Update Error"
          description={formErrors.submit}
        />
      )}

      {isRoleLocked && (
        <UIAlert
          intent="warning"
          title={isOwnerRole ? "Protected Owner Role" : "Role Editing Locked"}
          description={
            isOwnerRole
              ? "The workspace Owner role automatically holds full View & Operation access at Workspace level and cannot be restricted."
              : "This role is locked from modification."
          }
        />
      )}

      {/* Header Bar */}
      <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <UIIconButton
            variant="outline"
            size="sm"
            onClick={handleBack}
            aria-label="Back to roles"
          >
            <ArrowLeft className="size-4" />
          </UIIconButton>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text">
                Edit Role: {formData.name || "Role"}
              </h1>
              <UIBadge
                variant="soft"
                color={formData.status === "active" ? "success" : "neutral"}
                size="xs"
              >
                {formData.status}
              </UIBadge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Update role attributes, Work Modes, Work Level hierarchy, and assigned permissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <UIButton
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isUpdating}
          >
            Cancel
          </UIButton>

          <UIButton
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isUpdating}
            disabled={isRoleLocked}
            startIcon={<Check className="size-4" />}
          >
            Save Changes
          </UIButton>
        </div>
      </div>

      {/* Dual Column Layout: Form & Matrix (Left) + Live Blueprint (Right) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 cols): Identity, Work Access & Permission Matrix */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card 1: Role Identity & Basics */}
          <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/40">
              <Shield className="size-4 text-primary shrink-0" />
              <h2 className="text-sm font-bold text-text">1. Role Identity & Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-text block mb-1.5">
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
                <label className="text-xs font-semibold text-text block mb-1.5">
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
            </div>

            <div>
              <label className="text-xs font-semibold text-text block mb-1.5">
                Role Description & Scope
              </label>
              <textarea
                name="description"
                rows={2}
                placeholder="Describe role responsibilities..."
                value={formData.description}
                onChange={handleChange}
                disabled={isRoleLocked}
                className={cn(
                  "w-full rounded-xl border bg-surface px-3 py-2 text-xs text-text placeholder:text-text-muted/60 transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60",
                  formErrors.description ? "border-destructive" : "border-border",
                )}
              />
            </div>
          </div>

          {/* Card 2: Work Modes & Level Hierarchy */}
          <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/40">
              <Layers className="size-4 text-primary shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-text">
                  2. Work Modes & Level Hierarchy
                </h2>
                <p className="text-[11px] text-text-muted">
                  Assign explicit modes (View / Operation) and hierarchical level ceiling (Workspace &gt; Company &gt; Branch).
                </p>
              </div>
            </div>

            <RoleWorkAccessFields
              workModes={formData.workModes}
              workLevel={formData.workLevel}
              onChangeWorkModes={handleWorkModesChange}
              onChangeWorkLevel={handleWorkLevelChange}
              allowedActorWorkModes={actorAllowedWorkModes}
              maxActorWorkLevel={actorHighestWorkLevel}
              disabled={isRoleLocked}
              error={formErrors.workAccess}
            />
          </div>

          {/* Card 3: Permissions Matrix & Allocation */}
          <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <FileKey className="size-4 text-primary shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-text">
                    3. Allocate Module Permissions
                  </h2>
                  <p className="text-[11px] text-text-muted">
                    {permissionSummary.selected} of {permissionSummary.total} capabilities assigned
                  </p>
                </div>
              </div>

              {!isRoleLocked && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-border">|</span>
                  <button
                    type="button"
                    onClick={handleClearPermissions}
                    className="text-xs text-text-muted hover:text-text font-semibold hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Matrix Filter & Search Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <UISearchInput
                placeholder="Search permissions or modules..."
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                onClear={() => setPermissionSearch("")}
                size="sm"
              />

              <UISelect
                size="sm"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                options={moduleOptions}
              />
            </div>

            {/* Permission Modules List */}
            {isLoadingPermissions ? (
              <div className="space-y-3 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-border/60 bg-surface-alt/40 space-y-2"
                  >
                    <UISkeleton className="h-4 w-32 rounded" />
                    <UISkeleton className="h-8 w-full rounded" />
                  </div>
                ))}
              </div>
            ) : permissionModules.length > 0 ? (
              <div className="space-y-3 pt-1 max-h-[520px] overflow-y-auto pr-1">
                {permissionModules.map((mod) => {
                  const modPermissionValues = mod.permissions.map((p) => p.value);
                  const selectedCount = modPermissionValues.filter((v) =>
                    formData.permissions.includes(v),
                  ).length;
                  const isAllSelected =
                    modPermissionValues.length > 0 &&
                    selectedCount === modPermissionValues.length;

                  return (
                    <div
                      key={mod.id}
                      className="p-3.5 rounded-xl border border-border/60 bg-surface-alt/40 space-y-3 transition-colors hover:bg-surface-alt/70"
                    >
                      {/* Module Header with Batch Switch */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Layers className="size-3.5 text-primary" />
                          <span className="text-xs font-bold text-text">
                            {mod.title}
                          </span>
                          <UIBadge variant="soft" color="neutral" size="xs">
                            {selectedCount} / {modPermissionValues.length}
                          </UIBadge>
                        </div>

                        <UISwitch
                          checked={isAllSelected}
                          onChange={() => !isRoleLocked && handleToggleModule(mod)}
                          disabled={isRoleLocked}
                          size="sm"
                          label={isAllSelected ? "Enabled" : "Toggle All"}
                        />
                      </div>

                      {/* Individual Permission Chips */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {mod.permissions.map((perm) => {
                          const isChecked = formData.permissions.includes(perm.value);
                          return (
                            <button
                              key={perm.value}
                              type="button"
                              disabled={isRoleLocked}
                              onClick={() => !isRoleLocked && handleTogglePermission(perm.value)}
                              className={cn(
                                "p-2 rounded-lg border text-left transition-all flex items-center justify-between gap-1.5 select-none text-xs disabled:opacity-70",
                                isChecked
                                  ? "bg-surface border-primary/50 text-primary font-semibold shadow-2xs ring-1 ring-primary/20"
                                  : "bg-surface/60 border-border/60 text-text-muted hover:bg-surface hover:text-text",
                              )}
                            >
                              <span className="truncate">
                                {perm.actionLabel || perm.label}
                              </span>
                              <div
                                className={cn(
                                  "size-3.5 rounded-full border flex items-center justify-center shrink-0 text-[9px]",
                                  isChecked
                                    ? "bg-primary text-text-inverse border-primary"
                                    : "border-border",
                                )}
                              >
                                {isChecked && <Check className="size-2.5 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center bg-surface-alt/30 rounded-xl border border-dashed border-border/80">
                <span className="text-xs text-text-muted">
                  No permissions matching "{permissionSearch}"
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Rail (4 cols): Sticky Blueprint & Live Summary */}
        <div className="lg:col-span-4 space-y-4">
          <div className="sticky top-4 space-y-4">
            {/* Live Role Preview Card */}
            <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                <Sparkles className="size-4 text-primary shrink-0" />
                <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                  Role Blueprint Preview
                </h3>
              </div>

              {/* Role Capsule */}
              <div className="p-3.5 rounded-xl bg-surface-alt/60 border border-border/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-text">
                    {formData.name || "Untitled Role"}
                  </span>
                  <UIBadge
                    variant="soft"
                    color={formData.status === "active" ? "success" : "neutral"}
                    size="xs"
                  >
                    {formData.status}
                  </UIBadge>
                </div>
                <div className="text-[11px] font-mono text-text-muted truncate">
                  code: {formData.code || "-"}
                </div>
                <RoleWorkAccessBadges
                  workModes={formData.workModes}
                  workLevel={formData.workLevel}
                  compact
                />
                <p className="text-xs text-text-muted line-clamp-2">
                  {formData.description || "No description provided."}
                </p>
              </div>

              {/* Permission Metrics Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/30">
                  <span className="text-text-muted">Allowed Work Modes</span>
                  <span className="font-semibold text-text">
                    {workAccessSummary.modeShortText || "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/30">
                  <span className="text-text-muted">Level Hierarchy</span>
                  <span className="font-semibold text-text">
                    {workAccessSummary.hierarchyLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/30">
                  <span className="text-text-muted">Total Assigned</span>
                  <span className="font-bold text-text font-mono">
                    {permissionSummary.selected} / {permissionSummary.total}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/30">
                  <span className="text-text-muted">Modules Covered</span>
                  <span className="font-bold text-text font-mono">
                    {
                      permissionModules.filter((m) =>
                        m.permissions.some((p) => formData.permissions.includes(p.value)),
                      ).length
                    }{" "}
                    Modules
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <UIButton
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isUpdating}
                  disabled={isRoleLocked}
                  startIcon={<Check className="size-4" />}
                >
                  Save Role Changes
                </UIButton>

                <UIButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  Cancel
                </UIButton>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
