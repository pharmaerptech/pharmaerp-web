// src/features/workspace/pages/mobile/WorkspaceMemberDetailsMobilePage.jsx

import React, { useState } from "react";
import {
  Mail,
  Phone,
  Calendar,
  Clock,
  Key,
  Shield,
  UserCheck,
  UserMinus,
  Building2,
  GitBranch,
  Settings,
  Copy,
  Check,
  CheckCircle2,
  User,
  MoreVertical,
} from "lucide-react";
import {
  UIButton,
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
import { RoleWorkAccessFields } from "@/features/access-control/components";

export default function WorkspaceMemberDetailsMobilePage({
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
  const [activeTab, setActiveTab] = useState("overview"); // overview, role, access
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
      <div className="min-h-screen bg-bg text-text p-3 space-y-4 pb-24">
        <UISkeleton className="h-56 rounded-2xl" />
        <UISkeleton className="h-44 rounded-2xl" />
        <UISkeleton className="h-44 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text p-3 sm:p-4 space-y-3.5 pb-28 max-w-lg mx-auto">
      {/* 1. Mobile Profile Hero Card with Top Corner Badges & Actions Dropdown */}
      <div className="bg-surface rounded-2xl p-4.5 relative flex flex-col items-center text-center space-y-3 shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
        {/* Top Row: Badges (Left) & Actions Menu (Right) */}
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
              size="xs"
            >
              <span className="capitalize">{status}</span>
            </UIBadge>

            {isOwner && (
              <UIBadge variant="soft" color="primary" size="xs">
                Owner
              </UIBadge>
            )}
          </div>

          {/* Action Menu Dropdown */}
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

        {/* Circular Avatar */}
        <div className="relative mt-0.5">
          {user?.avatar?.url ? (
            <img
              src={user.avatar.url}
              alt={displayName}
              className="size-20 rounded-full object-cover border-3 border-surface shadow-xs"
            />
          ) : (
            <div className="size-20 rounded-full bg-primary-soft text-primary font-extrabold text-2xl flex items-center justify-center border-3 border-surface shadow-xs select-none">
              {getInitials(displayName)}
            </div>
          )}
          <span
            className={cn(
              "absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-surface ring-2",
              status === "active"
                ? "bg-success ring-success/20"
                : status === "suspended"
                ? "bg-error ring-error/20"
                : "bg-warning ring-warning/20"
            )}
          />
        </div>

        <div className="space-y-0.5">
          <h1 className="text-base font-bold text-text tracking-tight">
            {displayName}
          </h1>
          <p className="text-xs text-text-muted font-medium">
            {displayRole} • Joined {joinedDate}
          </p>
          {userCode && (
            <div className="pt-1">
              <span className="font-mono text-[10.5px] font-semibold tabular-nums text-text-muted bg-surface-alt px-2.5 py-0.5 rounded-full border border-border/40">
                #USR-{userCode}
              </span>
            </div>
          )}
        </div>

        {/* Quick Contact Action Buttons */}
        <div className="flex items-center justify-center gap-2 pt-1 w-full">
          <button
            type="button"
            onClick={() => copyToClipboard(displayEmail, "m_email", "Email")}
            className="flex-1 py-2 px-3 rounded-xl bg-surface-alt hover:bg-surface-hover flex items-center justify-center gap-1.5 text-xs font-semibold text-text border border-border/40 active:scale-95 transition-all min-h-[44px]"
          >
            {copiedKey === "m_email" ? (
              <Check className="size-3.5 text-success" />
            ) : (
              <Mail className="size-3.5 text-text-muted" />
            )}
            <span>Email</span>
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(displayPhone, "m_phone", "Phone")}
            className="flex-1 py-2 px-3 rounded-xl bg-surface-alt hover:bg-surface-hover flex items-center justify-center gap-1.5 text-xs font-semibold text-text border border-border/40 active:scale-95 transition-all min-h-[44px]"
          >
            {copiedKey === "m_phone" ? (
              <Check className="size-3.5 text-success" />
            ) : (
              <Phone className="size-3.5 text-text-muted" />
            )}
            <span>Call</span>
          </button>
        </div>
      </div>

      {/* 2. Segmented Tab Selector */}
      <div className="flex items-center bg-surface-alt p-1 rounded-xl border border-border/40">
        {[
          { key: "overview", label: "Details" },
          { key: "role", label: "Security & Role" },
          { key: "access", label: "Store Access" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center min-h-[38px]",
              activeTab === tab.key
                ? "bg-surface text-text shadow-xs"
                : "text-text-muted hover:text-text"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-3.5">
          {/* General & Contact Info Card */}
          <div className="bg-surface rounded-2xl p-4 shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] space-y-3">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider">
              Profile & Contact Information
            </h3>
            <div className="space-y-2.5 text-xs divide-y divide-border/30">
              <div className="pt-1 first:pt-0 flex items-center justify-between">
                <span className="text-text-muted">Full Name</span>
                <span className="font-semibold text-text">{displayName}</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-text-muted">Email</span>
                <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                  <span className="font-medium text-text truncate">{displayEmail}</span>
                  {emailVerified && <CheckCircle2 className="size-3 text-success shrink-0" />}
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-text-muted">Phone</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono tabular-nums font-semibold text-text">{displayPhone}</span>
                  {phoneVerified && <CheckCircle2 className="size-3 text-success shrink-0" />}
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-text-muted">User Code</span>
                <span className="font-mono tabular-nums font-semibold text-text">
                  {userCode ? `#USR-${userCode}` : "-"}
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-text-muted">Account Type</span>
                <span className="font-semibold text-text">
                  {isOwner ? "Workspace Owner" : "Staff Member"}
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-text-muted">Primary Account</span>
                <span className="font-semibold text-text">{isPrimary ? "Yes" : "No"}</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-text-muted">Joined Date</span>
                <span className="font-mono tabular-nums font-semibold text-text">{joinedDate}</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-text-muted">Last Active</span>
                <span className="font-mono tabular-nums font-semibold text-text">{lastActiveFormatted}</span>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-text-muted">Onboarding Origin</span>
                <span className="font-medium text-text">
                  {joinedViaInvitationId ? "Invited by Email" : "Direct Creation"}
                </span>
              </div>
              {notes && (
                <div className="pt-2 space-y-1">
                  <span className="text-text-muted block">Notes</span>
                  <p className="text-text font-normal leading-relaxed">{notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "role" && (
        <div className="space-y-3.5">
          <div className="bg-surface rounded-2xl p-4 shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                Security Role Scope
              </h3>
              {!isOwner && (
                <button
                  type="button"
                  onClick={onOpenAssignRole}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Change Role
                </button>
              )}
            </div>

            <div className="space-y-2.5 text-xs divide-y divide-border/30">
              <div className="pt-1 first:pt-0 flex items-center justify-between">
                <span className="text-text-muted">Assigned Role</span>
                <span className="font-bold text-text">{displayRole}</span>
              </div>

              <div className="pt-2 space-y-1">
                {workAccess && (
                  <div className="pb-2.5">
                    <RoleWorkAccessFields
                      workModes={workAccess.allowedWorkModes}
                      workLevel={workAccess.highestWorkLevel}
                      viewOnly
                      compact
                    />
                  </div>
                )}
                <span className="text-text-muted block">Role Description</span>
                <p className="text-text font-normal leading-relaxed text-[11.5px]">
                  {roleDescription ||
                    (isOwner
                      ? "Full administrative authority over workspace settings, operating companies, branches, and member clearances."
                      : "Standard operational role clearance.")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "access" && (
        <div className="space-y-3.5">
          <div className="bg-surface rounded-2xl p-4 shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                Store & Branch Clearance
              </h3>
              <UIButton
                variant="outline"
                size="xs"
                onClick={onOpenAccessModal}
                disabled={isOwner}
              >
                Edit
              </UIButton>
            </div>

            <div className="space-y-2.5 text-xs divide-y divide-border/30">
              <div className="pt-1 first:pt-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted flex items-center gap-1">
                    <Building2 className="size-3.5" /> Company Access
                  </span>
                  <span className="font-semibold text-primary">
                    {accessSummary?.companyLabel || "Authorized"}
                  </span>
                </div>
                <div className="space-y-1">
                  {isOwner || accessSummary?.isAllCompanies ? (
                    <div className="p-2 rounded-lg bg-surface-alt/60 text-[11px] text-text">
                      All Workspace Companies
                    </div>
                  ) : assignedCompanies.length > 0 ? (
                    assignedCompanies.map((c) => (
                      <div
                        key={c._id || c}
                        className="p-1.5 px-2 rounded-lg bg-surface-alt/60 text-[11px] text-text flex items-center justify-between"
                      >
                        <span className="truncate">{c.name || c}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-1.5 text-[11px] text-text-muted">
                      No specific companies assigned
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted flex items-center gap-1">
                    <GitBranch className="size-3.5" /> Branch Access
                  </span>
                  <span className="font-semibold text-primary">
                    {accessSummary?.branchLabel || "Authorized"}
                  </span>
                </div>
                <div className="space-y-1">
                  {isOwner || accessSummary?.isAllBranches ? (
                    <div className="p-2 rounded-lg bg-surface-alt/60 text-[11px] text-text">
                      All Operating Branches
                    </div>
                  ) : assignedBranches.length > 0 ? (
                    assignedBranches.map((b) => (
                      <div
                        key={b._id || b}
                        className="p-1.5 px-2 rounded-lg bg-surface-alt/60 text-[11px] text-text flex items-center justify-between"
                      >
                        <span className="truncate">{b.name || b}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-1.5 text-[11px] text-text-muted">
                      No specific branches assigned
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Fixed Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-surface/90 backdrop-blur-md border-t border-border/60 z-40 flex items-center gap-2 max-w-lg mx-auto">
        <UIButton
          variant="primary"
          size="md"
          className="flex-1 justify-center min-h-[44px] font-semibold"
          onClick={onOpenAccessModal}
          disabled={isOwner}
        >
          Manage Access
        </UIButton>

        {status === "active" ? (
          <UIButton
            variant="outline"
            size="md"
            className="min-h-[44px]"
            onClick={() => onToggleStatus("inactive")}
            disabled={isOwner}
          >
            Deactivate
          </UIButton>
        ) : (
          <UIButton
            variant="outline"
            size="md"
            className="min-h-[44px]"
            onClick={() => onToggleStatus("active")}
            disabled={isOwner}
          >
            Activate
          </UIButton>
        )}

        <UIButton
          variant="destructive"
          size="md"
          className="min-h-[44px] px-3"
          onClick={onRemoveMember}
          disabled={isOwner}
          aria-label="Remove member"
        >
          <UserMinus className="size-4" />
        </UIButton>
      </div>
    </div>
  );
}
