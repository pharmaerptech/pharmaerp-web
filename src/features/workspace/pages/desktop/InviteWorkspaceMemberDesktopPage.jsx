// src/features/workspace/pages/desktop/InviteWorkspaceMemberDesktopPage.jsx

import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Zap,
  Mail,
  UserPlus,
  Key,
  Shield,
  Building2,
  GitBranch,
  Check,
  RotateCcw,
  Store,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Users,
  Info,
  Layers,
  Lock,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
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
  uiToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { RoleWorkAccessBadges } from "@/features/access-control/components";
import { isWorkAccessPermissionKey } from "@/utils/workAccess";

export default function InviteWorkspaceMemberDesktopPage({
  formData = {
    mode: "direct",
    fullName: "",
    phone: "",
    email: "",
    password: "",
    roleId: "",
    accessAllCompanies: false,
    accessAllBranches: false,
    companyIds: [],
    branchAccess: [],
    notes: "",
  },
  formErrors = {},
  workspaceSummary = { name: "Workspace", code: "-", type: "-", email: "-", phone: "-" },
  roles = [],
  companies = [],
  branches = [],
  hasCompanies = true,
  hasBranches = true,
  canCreateOrInvite = true,

  isLoading = false,
  isCheckingWorkspace = false,
  isFetchingRoles = false,
  isFetchingCompanies = false,
  isFetchingBranches = false,
  isInviting = false,
  error = null,
  message = null,

  handleModeChange,
  handleGeneratePassword,
  handleChange,
  handleToggleCompany,
  handleToggleBranchAccess,
  handleBranchRoleChange,
  handleBranchMarketplaceToggle,
  handleSubmit,
  handleReset,
  handleBack,
  handleViewInvitations,
  handleViewMembers,
}) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");

  const isDirectMode = formData.mode === "direct";

  // Selected company IDs
  const selectedCompanyIdSet = useMemo(() => {
    return new Set(
      (formData.companyIds || []).map((id) => String(id?._id || id).trim())
    );
  }, [formData.companyIds]);

  // Dynamic available branches based on ANY selected company (or all branches if accessAllCompanies)
  const availableBranches = useMemo(() => {
    const allBranches = branches || [];
    if (formData.accessAllCompanies) {
      return allBranches;
    }
    if (selectedCompanyIdSet.size === 0) {
      return [];
    }
    return allBranches.filter((b) => {
      const compId = String(
        b.companyId?._id || b.companyId || b.company?._id || b.company || ""
      ).trim();
      return selectedCompanyIdSet.has(compId);
    });
  }, [branches, formData.accessAllCompanies, selectedCompanyIdSet]);

  // Filtered branches by search
  const filteredBranches = useMemo(() => {
    const q = branchSearch.trim().toLowerCase();
    if (!q) return availableBranches;
    return availableBranches.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.code?.toLowerCase().includes(q) ||
        b.branchType?.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q)
    );
  }, [availableBranches, branchSearch]);

  // Filtered roles by search
  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return roles || [];
    return (roles || []).filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.code?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }, [roles, roleSearch]);

  // Selected role object
  const selectedRole = useMemo(() => {
    return (roles || []).find(
      (r) => String(r._id).trim() === String(formData.roleId).trim()
    );
  }, [roles, formData.roleId]);

  const assignedBranchCount = formData.accessAllBranches
    ? availableBranches.length
    : (formData.branchAccess || []).length;

  const assignedCompanyCount = formData.accessAllCompanies
    ? companies.length
    : (formData.companyIds || []).length;

  return (
    <div className="min-h-screen bg-bg text-text p-3 sm:p-4 lg:p-5 max-w-[1440px] mx-auto space-y-4">
      {/* Feedback Alerts */}
      {formErrors.submit && (
        <UIAlert
          intent="danger"
          title="Submission Error"
          description={formErrors.submit}
        />
      )}

      {/* 1. Header Bar */}
      <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/60 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <UIIconButton
            variant="outline"
            size="sm"
            onClick={handleBack}
            aria-label="Back to members"
          >
            <ArrowLeft className="size-4" />
          </UIIconButton>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text">
                Add Workspace Member
              </h1>
              <UIBadge variant="soft" color="primary" size="xs">
                {workspaceSummary.name}
              </UIBadge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Provision member credentials, assign operational roles, and grant branch clearances.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <UIButton
            variant="outline"
            size="sm"
            onClick={handleViewInvitations}
            startIcon={<Mail className="size-3.5 text-text-muted" />}
          >
            Pending Invitations
          </UIButton>
          <UIButton
            variant="outline"
            size="sm"
            onClick={handleViewMembers}
            startIcon={<Users className="size-3.5 text-text-muted" />}
          >
            View Members
          </UIButton>
        </div>
      </div>

      {/* Prerequisite Alert Banners */}
      {!hasCompanies && !isFetchingCompanies && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                <Building2 className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Operating Company Required</h3>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                  Before you can add or invite team members, you must first create at least one operating company. Staff members require company clearances.
                </p>
              </div>
            </div>
            <UIButton
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigate(ROUTES.CREATE_COMPANY)}
              startIcon={<Building2 className="size-3.5" />}
              className="shrink-0"
            >
              Create Company First
            </UIButton>
          </div>
        </div>
      )}

      {hasCompanies && !hasBranches && !isFetchingBranches && (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-cyan-900 dark:text-cyan-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-600 dark:text-cyan-400 shrink-0">
                <GitBranch className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Dispensary Branch Required</h3>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                  You have created a company, but you must create at least one branch before adding staff so they can be assigned dispensary store privileges.
                </p>
              </div>
            </div>
            <UIButton
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigate(ROUTES.CREATE_BRANCH)}
              startIcon={<GitBranch className="size-3.5" />}
              className="shrink-0"
            >
              Create Branch First
            </UIButton>
          </div>
        </div>
      )}

      {/* 2. Mode Selector Pill (Segmented Elevated Switch) */}
      <div className="bg-surface rounded-2xl p-2 border border-border/60 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleModeChange?.("direct")}
            className={cn(
              "py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer select-none",
              isDirectMode
                ? "bg-primary text-text-inverse shadow-xs ring-1 ring-primary/30"
                : "text-text-muted hover:text-text hover:bg-surface-alt/70"
            )}
          >
            <Zap className={cn("size-4", isDirectMode ? "text-amber-300" : "text-text-muted")} />
            <div className="text-left">
              <span className="block leading-tight">Direct Add Staff</span>
              <span className={cn("text-[10px] font-normal block", isDirectMode ? "text-white/80" : "text-text-muted")}>
                Instant account creation with one-time credentials
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange?.("invite")}
            className={cn(
              "py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer select-none",
              !isDirectMode
                ? "bg-primary text-text-inverse shadow-xs ring-1 ring-primary/30"
                : "text-text-muted hover:text-text hover:bg-surface-alt/70"
            )}
          >
            <Mail className={cn("size-4", !isDirectMode ? "text-cyan-200" : "text-text-muted")} />
            <div className="text-left">
              <span className="block leading-tight">Send Email Invitation Link</span>
              <span className={cn("text-[10px] font-normal block", !isDirectMode ? "text-white/80" : "text-text-muted")}>
                Send email invite for self-registration
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Main Dual Column Form & Blueprint Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 cols): Step Cards */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card 1: Member Identity & Authentication */}
          <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/40">
              <UserPlus className="size-4 text-primary shrink-0" />
              <h2 className="text-sm font-bold text-text">
                {isDirectMode ? "1. Staff Identity & Credentials" : "1. Invitee Email & Message"}
              </h2>
            </div>

            {isDirectMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text block mb-1.5">
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <UIInput
                      name="fullName"
                      placeholder="e.g. Rajesh Kumar"
                      value={formData.fullName}
                      onChange={handleChange}
                      error={formErrors.fullName}
                      size="sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text block mb-1.5">
                      Mobile Number <span className="text-text-muted text-[11px]">(Login identifier)</span>
                    </label>
                    <UIInput
                      name="phone"
                      placeholder="10-digit mobile number"
                      value={formData.phone}
                      onChange={handleChange}
                      error={formErrors.phone}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text block mb-1.5">
                      Email Address <span className="text-text-muted text-[11px]">(Optional)</span>
                    </label>
                    <UIInput
                      name="email"
                      type="email"
                      placeholder="staff@pharmacy.com"
                      value={formData.email}
                      onChange={handleChange}
                      error={formErrors.email}
                      size="sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-text">
                        Initial Password / PIN <span className="text-destructive">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="size-3" />
                        <span>Auto-Generate</span>
                      </button>
                    </div>

                    <div className="relative">
                      <UIInput
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter 6+ character PIN or password"
                        value={formData.password}
                        onChange={handleChange}
                        error={formErrors.password}
                        size="sm"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text block mb-1.5">
                    Invitee Email Address <span className="text-destructive">*</span>
                  </label>
                  <UIInput
                    name="email"
                    type="email"
                    placeholder="invitee@organization.com"
                    value={formData.email}
                    onChange={handleChange}
                    error={formErrors.email}
                    size="sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text block mb-1.5">
                    Invitation Note <span className="text-text-muted text-[11px]">(Optional)</span>
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Add a welcome message or special instructions..."
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text placeholder:text-text-muted/60 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Security Role Designation */}
          <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-primary shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-text">2. Assign Security Role</h2>
                  <p className="text-[11px] text-text-muted">
                    Assign the operational authority and permission set for this member.
                  </p>
                </div>
              </div>

              {roles.length > 3 && (
                <div className="w-full sm:w-48">
                  <UISearchInput
                    placeholder="Search roles..."
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    onClear={() => setRoleSearch("")}
                    size="sm"
                  />
                </div>
              )}
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {filteredRoles.map((role) => {
                const isSelected = String(formData.roleId).trim() === String(role._id).trim();
                const permCount = role.permissionCount ?? (Array.isArray(role.permissions) ? role.permissions.filter((p) => !isWorkAccessPermissionKey(p)).length : 0);

                return (
                  <div
                    key={role._id}
                    onClick={() => handleChange({ target: { name: "roleId", value: role._id } })}
                    className={cn(
                      "p-3 rounded-xl border transition-all flex items-start justify-between gap-2.5 cursor-pointer select-none",
                      isSelected
                        ? "bg-surface border-primary/50 ring-1 ring-primary/25 shadow-xs"
                        : "bg-surface-alt/40 border-border/60 hover:bg-surface hover:border-border"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-text truncate">
                          {role.name}
                        </span>
                        {role.isSystem && (
                          <span className="text-[10px] text-text-muted font-medium bg-surface-alt px-1.5 py-0.2 rounded">
                            System
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                        {role.description || "Workspace operational role."}
                      </p>
                      <RoleWorkAccessBadges role={role} compact className="mt-1.5" />
                      <span className="text-[10.5px] text-primary font-medium block mt-1.5">
                        {permCount} Permissions
                      </span>
                    </div>

                    <div
                      className={cn(
                        "size-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-[10px]",
                        isSelected
                          ? "bg-primary text-text-inverse border-primary"
                          : "border-border"
                      )}
                    >
                      {isSelected && <Check className="size-2.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
            {formErrors.roleId && (
              <span className="text-xs text-destructive">{formErrors.roleId}</span>
            )}
          </div>

          {/* Card 3: Corporate Entity Clearance */}
          <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-primary shrink-0" />
                  <h2 className="text-sm font-bold text-text">3. Company Clearance</h2>
                  <UIBadge variant="soft" color="primary" size="xs">
                    {assignedCompanyCount} / {companies.length} Selected
                  </UIBadge>
                </div>
                <p className="text-[11.5px] text-text-muted">
                  Authorize multi-entity clearance or pick specific pharmacy companies.
                </p>
              </div>

              <div className="shrink-0">
                <UISwitch
                  checked={formData.accessAllCompanies}
                  onChange={(checked) =>
                    handleChange({ target: { name: "accessAllCompanies", value: checked, type: "checkbox", checked } })
                  }
                  label={formData.accessAllCompanies ? "All Companies" : "Custom Scope"}
                  size="sm"
                />
              </div>
            </div>

            {!formData.accessAllCompanies && (
              <div className="space-y-2.5 pt-0.5">
                {companies.length > 3 && (
                  <UISearchInput
                    placeholder="Search companies..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    onClear={() => setCompanySearch("")}
                    size="sm"
                  />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {companies
                    .filter((c) => !companySearch || c.name?.toLowerCase().includes(companySearch.toLowerCase()))
                    .map((comp) => {
                      const isChecked = selectedCompanyIdSet.has(String(comp._id).trim());
                      return (
                        <div
                          key={comp._id}
                          onClick={() => handleToggleCompany(comp._id)}
                          className={cn(
                            "p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer select-none",
                            isChecked
                              ? "bg-surface border-primary/50 ring-1 ring-primary/25 shadow-xs"
                              : "bg-surface-alt/40 border-border/60 hover:bg-surface hover:border-border"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-text truncate block">
                              {comp.name}
                            </span>
                            <span className="text-[10.5px] text-text-muted font-mono truncate block mt-0.5">
                              {comp.code || comp.taxNumber || "Active Company"}
                            </span>
                          </div>

                          <UISwitch
                            checked={isChecked}
                            onChange={() => handleToggleCompany(comp._id)}
                            size="sm"
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Card 4: Physical Branch & Dispensary Scope */}
          <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <GitBranch className="size-4 text-primary shrink-0" />
                  <h2 className="text-sm font-bold text-text">4. Dispensary & Branch Operations</h2>
                  <UIBadge variant="soft" color="success" size="xs">
                    {assignedBranchCount} / {availableBranches.length} Selected
                  </UIBadge>
                </div>
                <p className="text-[11.5px] text-text-muted">
                  Authorize point-of-sale checkout and dispensary counters.
                </p>
              </div>

              <div className="shrink-0">
                <UISwitch
                  checked={formData.accessAllBranches}
                  onChange={(checked) =>
                    handleChange({ target: { name: "accessAllBranches", value: checked, type: "checkbox", checked } })
                  }
                  label={formData.accessAllBranches ? "All Branches" : "Custom Selection"}
                  size="sm"
                  disabled={availableBranches.length === 0}
                />
              </div>
            </div>

            {!formData.accessAllBranches && (
              <div className="space-y-2.5 pt-0.5">
                {availableBranches.length === 0 ? (
                  <div className="py-7 px-4 text-center bg-surface-alt/30 rounded-xl border border-dashed border-border/80">
                    <Store className="size-7 text-text-muted/60 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-text block">
                      No Company Selected
                    </span>
                    <span className="text-[11px] text-text-muted block mt-0.5 max-w-sm mx-auto">
                      Switch on at least one company above to populate its branch locations.
                    </span>
                  </div>
                ) : (
                  <>
                    {availableBranches.length > 3 && (
                      <UISearchInput
                        placeholder="Search branches..."
                        value={branchSearch}
                        onChange={(e) => setBranchSearch(e.target.value)}
                        onClear={() => setBranchSearch("")}
                        size="sm"
                      />
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                      {filteredBranches.map((branch) => {
                        const isChecked = (formData.branchAccess || []).some(
                          (ba) => String(ba.branchId || ba).trim() === String(branch._id).trim()
                        );
                        return (
                          <div
                            key={branch._id}
                            onClick={() => handleToggleBranchAccess(branch._id, formData.roleId)}
                            className={cn(
                              "p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer select-none",
                              isChecked
                                ? "bg-surface border-primary/50 ring-1 ring-primary/25 shadow-xs"
                                : "bg-surface-alt/40 border-border/60 hover:bg-surface hover:border-border"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-text truncate block">
                                {branch.name}
                              </span>
                              <span className="text-[10px] text-text-muted font-medium bg-surface-alt px-1.5 py-0.5 rounded inline-block mt-0.5">
                                {branch.branchType || "Dispensary"}
                              </span>
                            </div>

                            <UISwitch
                              checked={isChecked}
                              onChange={() => handleToggleBranchAccess(branch._id, formData.roleId)}
                              size="sm"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Rail (4 cols): Sticky Blueprint & Actions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="sticky top-4 space-y-4">
            {/* Live Access Blueprint Capsule */}
            <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                <Sparkles className="size-4 text-primary shrink-0" />
                <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                  Member Access Blueprint
                </h3>
              </div>

              {/* Identity Capsule */}
              <div className="p-3.5 rounded-xl bg-surface-alt/60 border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-text truncate">
                    {isDirectMode ? formData.fullName || "New Staff Member" : formData.email || "Invitee"}
                  </span>
                  <UIBadge variant="soft" color={isDirectMode ? "amber" : "info"} size="xs">
                    {isDirectMode ? "Instant Active" : "Invite Link"}
                  </UIBadge>
                </div>
                {isDirectMode && formData.phone && (
                  <div className="text-[11px] font-mono text-text-muted">
                    Mobile: +91 {formData.phone}
                  </div>
                )}
                {selectedRole && (
                  <div className="text-xs font-semibold text-primary flex items-center gap-1.5 pt-0.5">
                    <Shield className="size-3.5" />
                    <span>{selectedRole.name}</span>
                  </div>
                )}
                {selectedRole && (
                  <div>
                    <RoleWorkAccessBadges role={selectedRole} showHierarchy compact className="pt-1" />
                  </div>
                )}
              </div>

              {/* Clearance Summary Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/30">
                  <span className="text-text-muted">Workspace</span>
                  <span className="font-semibold text-text">{workspaceSummary.name}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/30">
                  <span className="text-text-muted">Company Clearance</span>
                  <span className="font-bold text-text font-mono">
                    {formData.accessAllCompanies ? "All Entities" : `${assignedCompanyCount} Companies`}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/30">
                  <span className="text-text-muted">Dispensary Access</span>
                  <span className="font-bold text-text font-mono">
                    {formData.accessAllBranches ? "All Branches" : `${assignedBranchCount} Branches`}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-text-muted">Role Status</span>
                  <span className="font-bold text-success">
                    {selectedRole ? "Authorized" : "Not Selected"}
                  </span>
                </div>
              </div>

              {/* Submit / Reset Actions */}
              <div className="pt-2 space-y-2">
                <UIButton
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isLoading || isInviting}
                  disabled={!canCreateOrInvite || isLoading || isInviting}
                  startIcon={isDirectMode ? <Zap className="size-4" /> : <Mail className="size-4" />}
                >
                  {isDirectMode ? "Create Staff & Grant Access" : "Send Workspace Invitation"}
                </UIButton>

                <UIButton
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleReset}
                  disabled={isLoading || isInviting}
                  startIcon={<RotateCcw className="size-3.5" />}
                >
                  Reset Form
                </UIButton>
              </div>
            </div>

            {/* Security Notice Card */}
            <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Info className="size-4 shrink-0" />
                <span>Security & Credential Delivery</span>
              </div>
              <p className="text-[11.5px] text-text-muted leading-relaxed">
                {isDirectMode
                  ? "Upon creation, temporary credentials will be shown in a modal for 1-click copying or instant WhatsApp transmission to the staff member."
                  : "The invitee will receive a secure tokenized email link to register their account and confirm workspace onboarding."}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
