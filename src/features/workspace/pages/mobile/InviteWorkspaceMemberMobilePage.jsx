// src/features/workspace/pages/mobile/InviteWorkspaceMemberMobilePage.jsx

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
  Eye,
  EyeOff,
  Users,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import {
  UIButton,
  UIIconButton,
  UIInput,
  UISearchInput,
  UISwitch,
  UIBadge,
  UIAlert,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { RoleWorkAccessBadges } from "@/features/access-control/components";
import { isWorkAccessPermissionKey } from "@/utils/workAccess";

export default function InviteWorkspaceMemberMobilePage({
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
  workspaceSummary = { name: "Workspace" },
  roles = [],
  companies = [],
  branches = [],
  hasCompanies = true,
  hasBranches = true,
  canCreateOrInvite = true,

  isLoading = false,
  isInviting = false,

  handleModeChange,
  handleGeneratePassword,
  handleChange,
  handleToggleCompany,
  handleToggleBranchAccess,
  handleSubmit,
  handleBack,
  handleViewInvitations,
}) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const isDirectMode = formData.mode === "direct";

  const selectedCompanyIdSet = useMemo(() => {
    return new Set(
      (formData.companyIds || []).map((id) => String(id?._id || id).trim())
    );
  }, [formData.companyIds]);

  const availableBranches = useMemo(() => {
    const allBranches = branches || [];
    if (formData.accessAllCompanies) return allBranches;
    if (selectedCompanyIdSet.size === 0) return [];
    return allBranches.filter((b) => {
      const compId = String(
        b.companyId?._id || b.companyId || b.company?._id || b.company || ""
      ).trim();
      return selectedCompanyIdSet.has(compId);
    });
  }, [branches, formData.accessAllCompanies, selectedCompanyIdSet]);

  return (
    <div className="min-h-screen bg-bg text-text p-3 pb-24 space-y-3.5">
      {/* Header */}
      <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <UIIconButton
            icon={<ArrowLeft className="size-4" />}
            size="sm"
            variant="ghost"
            onClick={handleBack}
          />
          <div>
            <h1 className="text-sm font-bold text-text leading-tight">
              {isDirectMode ? "Add Staff Member" : "Invite Team Member"}
            </h1>
            <p className="text-[11px] text-text-muted">
              {workspaceSummary.name || "Workspace"}
            </p>
          </div>
        </div>

        <UIButton
          variant="outline"
          size="xs"
          onClick={handleViewInvitations}
          startIcon={<Mail className="size-3" />}
        >
          Invites
        </UIButton>
      </div>

      {/* Prerequisite Alert Banners */}
      {!hasCompanies && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-900 dark:text-amber-200 text-xs space-y-2.5">
          <div className="flex items-center gap-2 font-bold">
            <Building2 className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Company Required</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Please create at least one company first before adding or inviting team members.
          </p>
          <UIButton
            type="button"
            variant="primary"
            size="xs"
            onClick={() => navigate(ROUTES.CREATE_COMPANY)}
            className="w-full"
          >
            Create Company First
          </UIButton>
        </div>
      )}

      {hasCompanies && !hasBranches && (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 text-cyan-900 dark:text-cyan-200 text-xs space-y-2.5">
          <div className="flex items-center gap-2 font-bold">
            <GitBranch className="size-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span>Branch Required</span>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed">
            Please create at least one dispensary branch first so staff can be assigned store access.
          </p>
          <UIButton
            type="button"
            variant="primary"
            size="xs"
            onClick={() => navigate(ROUTES.CREATE_BRANCH)}
            className="w-full"
          >
            Create Branch First
          </UIButton>
        </div>
      )}

      {formErrors.submit && (
        <UIAlert intent="danger" title="Error" description={formErrors.submit} />
      )}

      {/* Mode Switcher */}
      <div className="bg-surface rounded-2xl p-1.5 border border-border/60 shadow-2xs grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => handleModeChange?.("direct")}
          className={cn(
            "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            isDirectMode
              ? "bg-primary text-text-inverse shadow-xs"
              : "text-text-muted hover:text-text hover:bg-surface-alt/70"
          )}
        >
          <Zap className="size-3.5" />
          <span>Direct Add</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange?.("invite")}
          className={cn(
            "py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            !isDirectMode
              ? "bg-primary text-text-inverse shadow-xs"
              : "text-text-muted hover:text-text hover:bg-surface-alt/70"
          )}
        >
          <Mail className="size-3.5" />
          <span>Email Invite</span>
        </button>
      </div>

      {/* Card 1: Identity */}
      <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">
          {isDirectMode ? "1. Staff Identity" : "1. Invitee Email"}
        </h2>

        {isDirectMode ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-text block mb-1">
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
              <label className="text-xs font-semibold text-text block mb-1">
                Mobile Number
              </label>
              <UIInput
                name="phone"
                placeholder="10-digit number"
                value={formData.phone}
                onChange={handleChange}
                error={formErrors.phone}
                size="sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text block mb-1">
                Email Address
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text">
                  Initial Password <span className="text-destructive">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] text-primary font-semibold hover:underline"
                >
                  Auto-Generate
                </button>
              </div>
              <div className="relative">
                <UIInput
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="PIN / Password"
                  value={formData.password}
                  onChange={handleChange}
                  error={formErrors.password}
                  size="sm"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-text block mb-1">
                Invitee Email <span className="text-destructive">*</span>
              </label>
              <UIInput
                name="email"
                type="email"
                placeholder="invitee@email.com"
                value={formData.email}
                onChange={handleChange}
                error={formErrors.email}
                size="sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text block mb-1">
                Message (Optional)
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Welcome to our team..."
                value={formData.notes}
                onChange={handleChange}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text placeholder:text-text-muted/60 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>

      {/* Card 2: Role */}
      <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">
          2. Security Role
        </h2>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {roles.map((role) => {
            const isSelected = String(formData.roleId).trim() === String(role._id).trim();
            return (
              <div
                key={role._id}
                onClick={() => handleChange({ target: { name: "roleId", value: role._id } })}
                className={cn(
                  "p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer",
                  isSelected
                    ? "bg-surface border-primary/50 text-primary font-semibold ring-1 ring-primary/25"
                    : "bg-surface-alt/40 border-border/60 text-text"
                )}
              >
                <div>
                  <span className="text-xs font-bold block">{role.name}</span>
                  <RoleWorkAccessBadges role={role} compact className="mt-1" />
                  <span className="text-[10.5px] text-text-muted block">
                    {(role.permissions || []).filter((p) => !isWorkAccessPermissionKey(p)).length} Module Permissions
                  </span>
                </div>

                {isSelected && <Check className="size-4 text-primary" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Card 3: Company Clearance */}
      <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider">
            3. Companies
          </h2>
          <UISwitch
            checked={formData.accessAllCompanies}
            onChange={(checked) =>
              handleChange({ target: { name: "accessAllCompanies", value: checked, type: "checkbox", checked } })
            }
            label={formData.accessAllCompanies ? "All" : "Custom"}
            size="sm"
          />
        </div>

        {!formData.accessAllCompanies && (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {companies.map((comp) => {
              const isChecked = selectedCompanyIdSet.has(String(comp._id).trim());
              return (
                <div
                  key={comp._id}
                  onClick={() => handleToggleCompany(comp._id)}
                  className="p-2 rounded-xl border border-border/60 bg-surface-alt/40 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-text truncate">{comp.name}</span>
                  <UISwitch
                    checked={isChecked}
                    onChange={() => handleToggleCompany(comp._id)}
                    size="sm"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card 4: Branches */}
      <div className="bg-surface rounded-2xl p-4 border border-border/60 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-text uppercase tracking-wider">
            4. Branches
          </h2>
          <UISwitch
            checked={formData.accessAllBranches}
            onChange={(checked) =>
              handleChange({ target: { name: "accessAllBranches", value: checked, type: "checkbox", checked } })
            }
            label={formData.accessAllBranches ? "All" : "Custom"}
            size="sm"
            disabled={availableBranches.length === 0}
          />
        </div>

        {!formData.accessAllBranches && (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {availableBranches.length === 0 ? (
              <span className="text-[11px] text-text-muted text-center block py-2">
                Select a company above first.
              </span>
            ) : (
              availableBranches.map((branch) => {
                const isChecked = (formData.branchAccess || []).some(
                  (ba) => String(ba.branchId || ba).trim() === String(branch._id).trim()
                );
                return (
                  <div
                    key={branch._id}
                    onClick={() => handleToggleBranchAccess(branch._id, formData.roleId)}
                    className="p-2 rounded-xl border border-border/60 bg-surface-alt/40 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-text truncate">{branch.name}</span>
                    <UISwitch
                      checked={isChecked}
                      onChange={() => handleToggleBranchAccess(branch._id, formData.roleId)}
                      size="sm"
                    />
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-surface/90 backdrop-blur-md border-t border-border/60 flex items-center gap-2 z-30">
        <UIButton
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleBack}
        >
          Cancel
        </UIButton>
        <UIButton
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={handleSubmit}
          isLoading={isLoading || isInviting}
          disabled={!canCreateOrInvite || isLoading || isInviting}
          startIcon={isDirectMode ? <Zap className="size-3.5" /> : <Mail className="size-3.5" />}
        >
          {isDirectMode ? "Add Staff" : "Send Invite"}
        </UIButton>
      </div>
    </div>
  );
}
