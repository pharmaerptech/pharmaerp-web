// src/features/workspace/pages/desktop/WorkspaceMemberDetailsDesktopPage.jsx

import React, { useState } from "react";
import {
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  Key,
  UserCheck,
  UserMinus,
  Building2,
  GitBranch,
  Settings,
  Copy,
  Check,
  CheckCircle2,
  FileText,
  User,
  MoreVertical,
} from "lucide-react";
import {
  UIButton,
  UIIconButton,
  UIBadge,
  UISkeleton,
  UIDropdown,
  UIDropdownTrigger,
  UIDropdownMenu,
  UIDropdownItem,
  UIDropdownDivider,
  uiToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  RoleWorkAccessBadges,
  RoleWorkAccessFields,
} from "@/features/access-control/components";

export default function WorkspaceMemberDetailsDesktopPage({
  member,
  user,
  displayName,
  displayEmail,
  emailVerified,
  displayPhone,
  phoneVerified,
  displayRole,
  roleDescription,
  workAccess,
  userCode,
  isOwner,
  isPrimary,
  status,
  joinedDate,
  lastActiveFormatted,
  notes,
  joinedViaInvitationId,
  assignedCompanies = [],
  assignedBranches = [],
  accessSummary,
  isLoading,
  onOpenResetPassword,
  onOpenAssignRole,
  onOpenAccessModal,
  onToggleStatus,
  onRemoveMember,
}) {
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key, label) => {
    if (!text || text === "-") return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    uiToast.success("Copied to clipboard", `${label || "Value"} copied.`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getInitials = (name) => {
    return String(name || "M")
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");
  };

  if (isLoading && !member) {
    return (
      <div className="min-h-screen bg-bg text-text p-3 sm:p-4 lg:p-5 max-w-[1440px] mx-auto space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 space-y-4">
            <UISkeleton className="h-72 rounded-2xl" />
            <UISkeleton className="h-44 rounded-2xl" />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <UISkeleton className="h-48 rounded-2xl" />
            <UISkeleton className="h-48 rounded-2xl" />
            <UISkeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text p-3 sm:p-4 lg:p-5 max-w-[1440px] mx-auto space-y-5">
      {/* 1. Main Dual-Column Blueprint Grid (No Separate Page Header) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Profile Identity, Actions Dropdown, Membership Status (~33%) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Avatar, Identity & Actions in Top-Right Corner */}
          <div className="bg-surface rounded-2xl p-5 relative flex flex-col items-center text-center space-y-4 shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            {/* Top Bar inside Profile Card: Badges (Left) & Actions Dropdown (Right) */}
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <UIBadge
                  variant="soft"
                  color={
                    status === "active"
                      ? "success"
                      : status === "suspended"
                      ? "error"
                      : "warning"
                  }
                >
                  <span className="capitalize">{status}</span>
                </UIBadge>

                {isOwner && (
                  <UIBadge variant="soft" color="primary">
                    Owner
                  </UIBadge>
                )}
              </div>

              {/* Actions Dropdown in Top Right Corner */}
              <UIDropdown align="right" placement="bottom">
                <UIDropdownTrigger asChild>
                  <button
                    type="button"
                    className="size-8 rounded-xl bg-surface-alt hover:bg-surface-hover text-text-muted hover:text-text flex items-center justify-center transition-all border border-border/40 cursor-pointer active:scale-95"
                    title="Member Actions"
                    aria-label="Member Actions"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </UIDropdownTrigger>
                <UIDropdownMenu width="w-52">
                  <UIDropdownItem
                    icon={<Key className="size-4" />}
                    onClick={onOpenResetPassword}
                    disabled={isOwner}
                  >
                    Reset Password
                  </UIDropdownItem>
                  <UIDropdownItem
                    icon={<Shield className="size-4" />}
                    onClick={onOpenAssignRole}
                    disabled={isOwner}
                  >
                    Change Role
                  </UIDropdownItem>
                  <UIDropdownItem
                    icon={<Settings className="size-4" />}
                    onClick={onOpenAccessModal}
                    disabled={isOwner}
                  >
                    Manage Access
                  </UIDropdownItem>
                  <UIDropdownDivider />
                  {status === "active" ? (
                    <UIDropdownItem
                      icon={<Clock className="size-4 text-warning" />}
                      onClick={() => onToggleStatus("inactive")}
                      disabled={isOwner}
                    >
                      Deactivate Member
                    </UIDropdownItem>
                  ) : (
                    <UIDropdownItem
                      icon={<UserCheck className="size-4 text-success" />}
                      onClick={() => onToggleStatus("active")}
                      disabled={isOwner}
                    >
                      Activate Member
                    </UIDropdownItem>
                  )}
                  <UIDropdownItem
                    icon={<UserMinus className="size-4" />}
                    destructive
                    onClick={onRemoveMember}
                    disabled={isOwner}
                  >
                    Remove Member
                  </UIDropdownItem>
                </UIDropdownMenu>
              </UIDropdown>
            </div>

            {/* Centered Large Circular Avatar */}
            <div className="relative mt-1">
              {user?.avatar?.url ? (
                <img
                  src={user.avatar.url}
                  alt={displayName}
                  className="size-24 rounded-full object-cover border-4 border-surface shadow-sm"
                />
              ) : (
                <div className="size-24 rounded-full bg-primary-soft text-primary font-extrabold text-3xl flex items-center justify-center border-4 border-surface shadow-sm select-none">
                  {getInitials(displayName)}
                </div>
              )}
              <span
                className={cn(
                  "absolute bottom-1 right-1 size-4 rounded-full border-2 border-surface ring-2",
                  status === "active"
                    ? "bg-success ring-success/20"
                    : status === "suspended"
                    ? "bg-error ring-error/20"
                    : "bg-warning ring-warning/20"
                )}
                title={`Status: ${status}`}
              />
            </div>

            {/* Name & Role Designation */}
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-text tracking-tight">
                {displayName}
              </h2>
              <p className="text-xs text-text-muted font-medium">
                {displayRole}
              </p>
              {userCode && (
                <div className="pt-0.5">
                  <span className="inline-block font-mono text-[11px] font-semibold tabular-nums text-text-muted bg-surface-alt px-2.5 py-0.5 rounded-full border border-border/40">
                    #USR-{userCode}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Action Icons: Email, Phone */}
            <div className="flex items-center justify-center gap-3 pt-1 w-full">
              <button
                type="button"
                onClick={() => copyToClipboard(displayEmail, "email", "Email")}
                className="flex-1 py-2 px-3 rounded-xl bg-surface-alt hover:bg-surface-hover transition-all flex items-center justify-center gap-1.5 text-xs font-medium text-text-muted hover:text-text cursor-pointer border border-border/40 active:scale-95"
                title={`Copy Email: ${displayEmail}`}
              >
                {copiedKey === "email" ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <Mail className="size-3.5" />
                )}
                <span>Email</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(displayPhone, "phone", "Phone")}
                className="flex-1 py-2 px-3 rounded-xl bg-surface-alt hover:bg-surface-hover transition-all flex items-center justify-center gap-1.5 text-xs font-medium text-text-muted hover:text-text cursor-pointer border border-border/40 active:scale-95"
                title={`Copy Phone: ${displayPhone}`}
              >
                {copiedKey === "phone" ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <Phone className="size-3.5" />
                )}
                <span>Phone</span>
              </button>
            </div>

            {/* Manage Access CTA */}
            <UIButton
              variant="primary"
              size="md"
              className="w-full justify-center shadow-xs py-2.5 font-semibold mt-1"
              onClick={onOpenAccessModal}
              disabled={isOwner}
            >
              Manage Access & Stores
            </UIButton>
          </div>

          {/* Card 2: Workspace Membership Metadata */}
          <div className="bg-surface rounded-2xl p-4.5 shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] space-y-3">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider">
              Membership Overview
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Account Type</span>
                <span className="font-semibold text-text">
                  {isOwner ? "Workspace Owner" : "Staff Member"}
                </span>
              </div>

              <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                <span className="text-text-muted">Primary Account</span>
                <span className="font-semibold text-text">
                  {isPrimary ? "Yes" : "No"}
                </span>
              </div>

              <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                <span className="text-text-muted">Joined Date</span>
                <span className="font-mono tabular-nums font-semibold text-text">
                  {joinedDate}
                </span>
              </div>

              <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                <span className="text-text-muted">Last Active Session</span>
                <span className="font-mono tabular-nums font-semibold text-text">
                  {lastActiveFormatted}
                </span>
              </div>

              <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                <span className="text-text-muted">Onboarding Origin</span>
                <span className="font-medium text-text">
                  {joinedViaInvitationId ? "Invited by Email" : "Direct Creation"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Real Backend Fields (Info, Role Scope, Store Access) (~67%) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card 1: Contact & User Information */}
          <div className="bg-surface rounded-2xl p-5 sm:p-6 shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <div className="flex items-center gap-2">
                <User className="size-4 text-primary" />
                <h2 className="text-sm font-bold text-text tracking-tight">
                  User Profile Information
                </h2>
              </div>
              {userCode && (
                <span className="font-mono text-xs font-semibold tabular-nums text-text-muted">
                  #USR-{userCode}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider block">
                  Full Name
                </span>
                <span className="font-semibold text-text text-sm block">
                  {displayName}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider block">
                  Email Address
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text truncate">
                    {displayEmail}
                  </span>
                  {emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-success font-semibold">
                      <CheckCircle2 className="size-3" /> Verified
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider block">
                  Phone Number
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono tabular-nums font-semibold text-text">
                    {displayPhone}
                  </span>
                  {phoneVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-success font-semibold">
                      <CheckCircle2 className="size-3" /> Verified
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider block">
                  Account Status
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-bold capitalize flex items-center gap-1.5",
                      status === "active"
                        ? "text-success"
                        : status === "suspended"
                        ? "text-error"
                        : "text-warning"
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        status === "active"
                          ? "bg-success"
                          : status === "suspended"
                          ? "bg-error"
                          : "bg-warning"
                      )}
                    />
                    {status}
                  </span>
                </div>
              </div>

              {notes && (
                <div className="sm:col-span-2 space-y-1 pt-2 border-t border-border/30">
                  <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider block">
                    Notes
                  </span>
                  <p className="text-text font-normal leading-relaxed">
                    {notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Security Role & Authorization Scope */}
          <div className="bg-surface rounded-2xl p-5 sm:p-6 shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-primary" />
                <h2 className="text-sm font-bold text-text tracking-tight">
                  Security Role & Permissions
                </h2>
              </div>
              {!isOwner && (
                <UIButton
                  variant="ghost"
                  size="xs"
                  onClick={onOpenAssignRole}
                  className="text-primary hover:text-primary-hover font-semibold"
                >
                  Change Role
                </UIButton>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider block">
                    Assigned Role
                  </span>
                  <span className="font-bold text-text text-sm mt-0.5 block">
                    {displayRole}
                  </span>
                </div>
                <UIBadge variant="soft" color="primary">
                  {isOwner ? "Administrative Owner" : "Assigned Role"}
                </UIBadge>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-alt/70 border border-border/40">
                <span className="text-[11px] text-text-muted font-medium block mb-1">
                  Role Description & Scope:
                </span>
                <p className="text-text font-normal leading-relaxed">
                  {roleDescription ||
                    (isOwner
                      ? "Full administrative authority over workspace settings, operating companies, dispensary branches, and team member clearances."
                      : "Standard operational access configured for assigned companies and branches.")}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2B: Work Modes & Level Hierarchy */}
          {workAccess && (
            <div className="bg-surface rounded-2xl p-5 sm:p-6 shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] space-y-4">
              <div className="flex items-center justify-between border-b border-border/30 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-primary" />
                  <h2 className="text-sm font-bold text-text tracking-tight">
                    Work Modes &amp; Level Hierarchy
                  </h2>
                </div>
                <RoleWorkAccessBadges workAccess={workAccess} compact />
              </div>

              <RoleWorkAccessFields
                workModes={workAccess.allowedWorkModes}
                workLevel={workAccess.highestWorkLevel}
                viewOnly
                compact
              />
            </div>
          )}

          {/* Card 3: Authorized Store Facilities & Branch Access */}
          <div className="bg-surface rounded-2xl p-5 sm:p-6 shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                <h2 className="text-sm font-bold text-text tracking-tight">
                  Authorized Companies & Branches
                </h2>
              </div>
              <UIButton
                variant="ghost"
                size="xs"
                onClick={onOpenAccessModal}
                disabled={isOwner}
                className="text-primary hover:text-primary-hover font-semibold"
              >
                Edit Clearance
              </UIButton>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Authorized Companies Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-muted uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-text-muted" />
                    Companies ({assignedCompanies.length || (isOwner || accessSummary?.isAllCompanies ? "All" : 0)})
                  </span>
                  <span className="text-[11px] font-semibold text-primary">
                    {accessSummary?.companyLabel || "Authorized"}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {isOwner || accessSummary?.isAllCompanies ? (
                    <div className="p-2.5 rounded-xl bg-surface-alt/60 border border-border/40 text-xs text-text flex items-center justify-between">
                      <span className="font-medium">All Workspace Companies</span>
                      <UIBadge variant="soft" color="success" size="xs">All Access</UIBadge>
                    </div>
                  ) : assignedCompanies.length > 0 ? (
                    assignedCompanies.map((comp) => (
                      <div
                        key={comp._id || comp}
                        className="p-2 rounded-lg bg-surface-alt/60 border border-border/30 text-xs text-text flex items-center justify-between"
                      >
                        <span className="font-medium truncate">{comp.name || comp}</span>
                        <UIBadge variant="soft" color="primary" size="xs">Company</UIBadge>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 rounded-lg bg-surface-alt/40 text-xs text-text-muted text-center">
                      No specific companies assigned
                    </div>
                  )}
                </div>
              </div>

              {/* Authorized Branches Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-text-muted uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <GitBranch className="size-3.5 text-text-muted" />
                    Branches ({assignedBranches.length || (isOwner || accessSummary?.isAllBranches ? "All" : 0)})
                  </span>
                  <span className="text-[11px] font-semibold text-primary">
                    {accessSummary?.branchLabel || "Authorized"}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {isOwner || accessSummary?.isAllBranches ? (
                    <div className="p-2.5 rounded-xl bg-surface-alt/60 border border-border/40 text-xs text-text flex items-center justify-between">
                      <span className="font-medium">All Operating Branches</span>
                      <UIBadge variant="soft" color="success" size="xs">All Access</UIBadge>
                    </div>
                  ) : assignedBranches.length > 0 ? (
                    assignedBranches.map((br) => (
                      <div
                        key={br._id || br}
                        className="p-2 rounded-lg bg-surface-alt/60 border border-border/30 text-xs text-text flex items-center justify-between"
                      >
                        <span className="font-medium truncate">{br.name || br}</span>
                        <UIBadge variant="soft" color="neutral" size="xs">Branch</UIBadge>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 rounded-lg bg-surface-alt/40 text-xs text-text-muted text-center">
                      No specific branches assigned
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
