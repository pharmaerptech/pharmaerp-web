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
  ArrowLeft,
  Sparkles,
  Lock,
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
  handleBack,
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

  // ── High-Fidelity Profile Loading Skeleton ──────────────────────────────────
  if (isLoading && !member) {
    return (
      <div className="w-full min-h-full bg-bg text-text px-2 sm:px-3 pt-0 pb-12 font-sans overflow-y-auto">
        <div className="max-w-[1440px] mx-auto space-y-4">
          {/* Skeleton Header Bar */}
          <div className="p-4 rounded-xl bg-surface border border-border/70 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <UISkeleton className="size-9 rounded-lg" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <UISkeleton className="h-5 w-44 rounded" />
                  <UISkeleton className="h-4 w-16 rounded-full" />
                </div>
                <UISkeleton className="h-3.5 w-60 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UISkeleton className="h-8 w-24 rounded-md" />
              <UISkeleton className="h-8 w-28 rounded-md" />
            </div>
          </div>

          {/* Skeleton 4-Stat Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] p-3 rounded-xl bg-surface border border-border/70 shadow-2xs flex items-center gap-3"
              >
                <UISkeleton className="size-9 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <UISkeleton className="h-3 w-20 rounded" />
                  <UISkeleton className="h-5 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton Dual Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-xl bg-surface border border-border/70 space-y-4 text-center flex flex-col items-center">
                <UISkeleton className="size-20 rounded-full" />
                <UISkeleton className="h-5 w-32 rounded" />
                <UISkeleton className="h-3.5 w-40 rounded" />
                <div className="flex gap-2 w-full pt-2">
                  <UISkeleton className="h-8 flex-1 rounded-md" />
                  <UISkeleton className="h-8 flex-1 rounded-md" />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border/70 space-y-2">
                <UISkeleton className="h-4 w-28 rounded" />
                <UISkeleton className="h-3 w-full rounded" />
                <UISkeleton className="h-3 w-3/4 rounded" />
              </div>
            </div>
            <div className="lg:col-span-8 space-y-4">
              <div className="p-5 rounded-xl bg-surface border border-border/70 space-y-3">
                <UISkeleton className="h-4 w-40 rounded" />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <UISkeleton className="h-10 rounded-md" />
                  <UISkeleton className="h-10 rounded-md" />
                </div>
              </div>
              <div className="p-5 rounded-xl bg-surface border border-border/70 space-y-3">
                <UISkeleton className="h-4 w-48 rounded" />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <UISkeleton className="h-16 rounded-lg" />
                  <UISkeleton className="h-16 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-bg text-text px-2 sm:px-3 pt-0 pb-12 font-sans overflow-y-auto select-text">
      <div className="max-w-[1440px] mx-auto space-y-4">
        {/* ── 1. Top Header Navigation Bar ──────────────────────────────────── */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-surface border border-border/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {handleBack && (
              <UIIconButton
                variant="outline"
                size="sm"
                onClick={handleBack}
                aria-label="Back to staff list"
                className="size-8 rounded-lg shrink-0"
              >
                <ArrowLeft className="size-4" />
              </UIIconButton>
            )}

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text">
                  {displayName}
                </h1>
                <UIBadge
                  variant="soft"
                  color={
                    status === "active"
                      ? "success"
                      : status === "suspended"
                      ? "error"
                      : "warning"
                  }
                  size="xs"
                >
                  <span className="capitalize">{status}</span>
                </UIBadge>
                {isOwner && (
                  <UIBadge variant="soft" color="primary" size="xs">
                    Primary Owner
                  </UIBadge>
                )}
                {userCode && (
                  <span className="font-mono text-[11px] font-semibold text-text-muted bg-surface-alt px-2 py-0.5 rounded border border-border/40">
                    #USR-{userCode}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
                <span>
                  Role: <strong className="text-text">{displayRole}</strong>
                </span>
                <span>•</span>
                <span>
                  Email: <span className="font-mono text-text">{displayEmail}</span>
                </span>
                <span>•</span>
                <span>
                  Joined: <span>{joinedDate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs in Header */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <UIButton
              variant="outline"
              size="sm"
              onClick={onOpenResetPassword}
              startIcon={<Key className="size-3.5 text-primary" />}
              className="h-8 text-xs font-semibold"
            >
              Reset Password
            </UIButton>

            <UIButton
              variant="primary"
              size="sm"
              onClick={onOpenAccessModal}
              disabled={isOwner}
              startIcon={<Settings className="size-3.5" />}
              className="h-8 text-xs font-semibold"
            >
              Manage Access
            </UIButton>

            {/* Overflow Dropdown for Secondary Actions */}
            <UIDropdown align="right" placement="bottom">
              <UIDropdownTrigger asChild>
                <button
                  type="button"
                  className="size-8 rounded-lg bg-surface-alt hover:bg-surface-hover text-text-muted hover:text-text flex items-center justify-center transition-all border border-border/60 cursor-pointer active:scale-95"
                  title="More Options"
                  aria-label="More Options"
                >
                  <MoreVertical className="size-3.5" />
                </button>
              </UIDropdownTrigger>
              <UIDropdownMenu width="w-48">
                <UIDropdownItem
                  icon={<Key className="size-4 text-text-muted" />}
                  onClick={onOpenResetPassword}
                >
                  Reset Password
                </UIDropdownItem>
                <UIDropdownItem
                  icon={<Shield className="size-4 text-text-muted" />}
                  onClick={onOpenAssignRole}
                  disabled={isOwner}
                >
                  Change Role
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
        </div>

        {/* ── 2. Top Metric Stat Capsules (Standard 4-Card Grid) ────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Stat 1: Assigned Role */}
          <div className="h-[72px] p-3 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3">
            <div className="size-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Shield className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block">
                Assigned Role
              </span>
              <div className="text-sm font-bold text-text truncate mt-0.5">
                {displayRole}
              </div>
            </div>
          </div>

          {/* Stat 2: Operating Companies */}
          <div className="h-[72px] p-3 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3">
            <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Building2 className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block">
                Companies
              </span>
              <div className="text-sm font-bold text-text truncate mt-0.5">
                {accessSummary?.companyLabel || "Authorized"}
              </div>
            </div>
          </div>

          {/* Stat 3: Branch Clearances */}
          <div className="h-[72px] p-3 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3">
            <div className="size-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
              <GitBranch className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block">
                Stores / Branches
              </span>
              <div className="text-sm font-bold text-text truncate mt-0.5">
                {accessSummary?.branchLabel || "Authorized"}
              </div>
            </div>
          </div>

          {/* Stat 4: Account Status & Activity */}
          <div className="h-[72px] p-3 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-center gap-3">
            <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <UserCheck className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block">
                Account Status
              </span>
              <div className="text-sm font-bold text-text capitalize mt-0.5 flex items-center gap-1.5">
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
                <span>{status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Main Dual-Column Content Grid ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* ================================================================= */}
          {/* LEFT COLUMN: Profile Identity, Contact & Membership Info (4 cols) */}
          {/* ================================================================= */}
          <div className="lg:col-span-4 space-y-4">
            {/* Profile Avatar & Identity Card */}
            <div className="bg-surface rounded-xl p-5 relative flex flex-col items-center text-center space-y-3.5 border border-border/80 shadow-2xs">
              <div className="relative mt-1">
                {user?.avatar?.url ? (
                  <img
                    src={user.avatar.url}
                    alt={displayName}
                    className="size-20 rounded-full object-cover border-2 border-border shadow-2xs"
                  />
                ) : (
                  <div className="size-20 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center border border-primary/25 shadow-2xs select-none">
                    {getInitials(displayName)}
                  </div>
                )}
                <span
                  className={cn(
                    "absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-surface",
                    status === "active" ? "bg-success" : status === "suspended" ? "bg-error" : "bg-warning"
                  )}
                  title={`Status: ${status}`}
                />
              </div>

              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-text tracking-tight">
                  {displayName}
                </h2>
                <p className="text-xs text-text-muted font-medium">
                  {displayRole}
                </p>
              </div>

              {/* Quick Communication Copy Buttons */}
              <div className="flex items-center gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={() => copyToClipboard(displayEmail, "email", "Email")}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-surface-alt/70 hover:bg-surface-alt transition-colors flex items-center justify-center gap-1.5 text-xs font-medium text-text-muted hover:text-text border border-border/60 cursor-pointer"
                  title={`Copy: ${displayEmail}`}
                >
                  {copiedKey === "email" ? (
                    <Check className="size-3 text-success" />
                  ) : (
                    <Mail className="size-3 text-text-muted" />
                  )}
                  <span className="truncate">Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard(displayPhone, "phone", "Phone")}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-surface-alt/70 hover:bg-surface-alt transition-colors flex items-center justify-center gap-1.5 text-xs font-medium text-text-muted hover:text-text border border-border/60 cursor-pointer"
                  title={`Copy: ${displayPhone}`}
                >
                  {copiedKey === "phone" ? (
                    <Check className="size-3 text-success" />
                  ) : (
                    <Phone className="size-3 text-text-muted" />
                  )}
                  <span className="truncate">Phone</span>
                </button>
              </div>

              {/* Action Buttons in Profile Card */}
              <div className="flex flex-col gap-2 w-full pt-1">
                <UIButton
                  variant="outline"
                  size="sm"
                  className="w-full justify-center text-xs h-8.5 font-semibold"
                  onClick={onOpenResetPassword}
                  startIcon={<Key className="size-3.5 text-primary" />}
                >
                  Reset Password / PIN
                </UIButton>

                <UIButton
                  variant="primary"
                  size="sm"
                  className="w-full justify-center text-xs h-8.5 font-semibold"
                  onClick={onOpenAccessModal}
                  disabled={isOwner}
                  startIcon={<Settings className="size-3.5" />}
                >
                  Manage Access & Stores
                </UIButton>
              </div>
            </div>

            {/* Membership Metadata Overview */}
            <div className="bg-surface rounded-xl p-4.5 border border-border/80 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                Membership Details
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-text-muted">Account Type</span>
                  <span className="font-semibold text-text">
                    {isOwner ? "Workspace Owner" : "Staff Member"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-text-muted">Primary Contact</span>
                  <span className="font-semibold text-text">
                    {isPrimary ? "Yes" : "No"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-text-muted">Joined Date</span>
                  <span className="font-mono tabular-nums font-semibold text-text">
                    {joinedDate}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-text-muted">Last Active</span>
                  <span className="font-mono tabular-nums font-semibold text-text">
                    {lastActiveFormatted}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-text-muted">Onboarding Origin</span>
                  <span className="font-medium text-text">
                    {joinedViaInvitationId ? "Email Invitation" : "Direct Onboarding"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* RIGHT COLUMN: Profile Info, Role Scope & Store Clearances (8 cols) */}
          {/* ================================================================= */}
          <div className="lg:col-span-8 space-y-4">
            {/* Card 1: User Profile Information */}
            <div className="bg-surface rounded-xl p-4 sm:p-5 border border-border/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-primary" />
                  <h2 className="text-sm font-bold text-text tracking-tight">
                    Personal Information
                  </h2>
                </div>
                {userCode && (
                  <span className="font-mono text-xs text-text-muted">
                    #USR-{userCode}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider block">
                    Full Name
                  </span>
                  <span className="font-semibold text-text text-xs sm:text-sm block">
                    {displayName}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider block">
                    Email Address
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-text font-mono truncate">
                      {displayEmail}
                    </span>
                    {emailVerified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-success font-semibold">
                        <CheckCircle2 className="size-3" /> Verified
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider block">
                    Phone Number
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono tabular-nums font-semibold text-text">
                      {displayPhone}
                    </span>
                    {phoneVerified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-success font-semibold">
                        <CheckCircle2 className="size-3" /> Verified
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider block">
                    Status
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold capitalize text-text">
                      {status}
                    </span>
                  </div>
                </div>

                {notes && (
                  <div className="sm:col-span-2 space-y-0.5 pt-2 border-t border-border/40">
                    <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider block">
                      Notes
                    </span>
                    <p className="text-text-muted leading-relaxed">
                      {notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Security Role & Work Access */}
            <div className="bg-surface rounded-xl p-4 sm:p-5 border border-border/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-primary" />
                  <h2 className="text-sm font-bold text-text tracking-tight">
                    Security Role & Scope
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

              <div className="space-y-2.5 text-xs">
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

                <div className="p-3 rounded-lg bg-surface-alt/60 border border-border/50">
                  <span className="text-[11px] text-text-muted font-medium block mb-0.5">
                    Scope Description:
                  </span>
                  <p className="text-text leading-relaxed">
                    {roleDescription ||
                      (isOwner
                        ? "Full administrative authority over workspace settings, operating companies, retail branches, and team member clearances."
                        : "Operational access configured for assigned companies and branches.")}
                  </p>
                </div>
              </div>

              {workAccess && (
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-semibold text-text">
                      Work Modes & Level Ceiling
                    </span>
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
            </div>

            {/* Card 3: Authorized Operating Companies & Branches */}
            <div className="bg-surface rounded-xl p-4 sm:p-5 border border-border/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Authorized Companies Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-text-muted uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-text-muted" />
                      Companies ({assignedCompanies.length || (isOwner || accessSummary?.isAllCompanies ? "All" : 0)})
                    </span>
                    <span className="text-[11px] font-semibold text-primary">
                      {accessSummary?.companyLabel || "Authorized"}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {isOwner || accessSummary?.isAllCompanies ? (
                      <div className="p-2.5 rounded-lg bg-surface-alt/60 border border-border/40 text-xs text-text flex items-center justify-between">
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-text-muted uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <GitBranch className="size-3.5 text-text-muted" />
                      Branches ({assignedBranches.length || (isOwner || accessSummary?.isAllBranches ? "All" : 0)})
                    </span>
                    <span className="text-[11px] font-semibold text-primary">
                      {accessSummary?.branchLabel || "Authorized"}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {isOwner || accessSummary?.isAllBranches ? (
                      <div className="p-2.5 rounded-lg bg-surface-alt/60 border border-border/40 text-xs text-text flex items-center justify-between">
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
    </div>
  );
}
