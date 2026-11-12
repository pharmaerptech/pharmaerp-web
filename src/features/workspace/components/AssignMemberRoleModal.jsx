// src/features/workspace/components/AssignMemberRoleModal.jsx

import { useState, useMemo } from "react";
import {
  ShieldCheck,
  Shield,
  Check,
  Lock,
} from "lucide-react";

import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
  UIButton,
  UIBadge,
  UISearchInput,
  UISkeleton,
} from "@/components/ui";
import { usePermission } from "@/hooks";
import { cn } from "@/lib/utils";
import { RoleWorkAccessBadges } from "@/features/access-control/components";
import { canActorAssignRole } from "@/features/access-control/utils/roleForm.helper";
import { isWorkAccessPermissionKey } from "@/utils/workAccess";

export default function AssignMemberRoleModal({
  isOpen,
  onClose,
  onAssignRole,
  member,
  roles = [],
  currentRoleId,
  isLoadingRoles = false,
  isSubmitting = false,
}) {
  const { isOwner: isOwnerActor, workAccess: actorWorkAccess } = usePermission();
  const propRoleId = String(
    currentRoleId ||
      (typeof member?.roleId === "string" ? member.roleId : member?.roleId?._id) ||
      (typeof member?.role === "string" ? member.role : member?.role?._id) ||
      "",
  );
  const modalSessionKey = `${isOpen}-${member?._id || ""}-${propRoleId}`;
  const [draftState, setDraftState] = useState(() => ({
    key: modalSessionKey,
    roleId: propRoleId,
    search: "",
  }));

  const isSameSession = draftState.key === modalSessionKey;
  const selectedRoleId = isSameSession ? draftState.roleId : propRoleId;
  const searchQuery = isSameSession ? draftState.search : "";

  const setSearchQuery = (nextSearch) => {
    setDraftState({
      key: modalSessionKey,
      roleId: selectedRoleId,
      search: nextSearch,
    });
  };

  const user = member?.userId || member?.user || null;
  const displayName =
    user?.fullName ||
    user?.name ||
    user?.profile?.fullName ||
    user?.email ||
    "Member";
  const displayEmail = user?.email || "-";
  const isOwner = Boolean(member?.isOwner);



  // Filter out Owner role and roles exceeding the current actor's work mode / level ceiling
  const assignableRoles = useMemo(() => {
    return (roles || []).filter(
      (r) =>
        r.status !== "inactive" &&
        canActorAssignRole(r, { isOwner: isOwnerActor, actorWorkAccess }),
    );
  }, [actorWorkAccess, isOwnerActor, roles]);

  // Filter roles based on user search
  const filteredRoles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return assignableRoles;
    return assignableRoles.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.code?.toLowerCase().includes(q),
    );
  }, [assignableRoles, searchQuery]);

  const selectedRoleObject = useMemo(
    () =>
      (roles || []).find((r) => String(r._id) === String(selectedRoleId)) || null,
    [roles, selectedRoleId],
  );

  const handleSelectRole = (roleId) => {
    if (isSubmitting) return;
    setDraftState({
      key: modalSessionKey,
      roleId: String(roleId),
      search: searchQuery,
    });
  };

  const handleSave = () => {
    if (!selectedRoleId || isSubmitting) return;
    onAssignRole(selectedRoleId);
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

  const isRoleChanged = Boolean(
    selectedRoleId &&
      String(selectedRoleId) !==
        String(
          currentRoleId ||
            (typeof member?.roleId === "string" ? member.roleId : member?.roleId?._id) ||
            "",
        ),
  );

  return (
    <UIModal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      className="max-w-[560px]"
    >
      {/* Modal Header */}
      <UIModalHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <UIModalTitle className="text-base sm:text-lg">
              Assign Member Role
            </UIModalTitle>
            <UIModalDescription className="text-xs mt-0.5">
              Select a role — Work Modes and Work Level hierarchy apply automatically.
            </UIModalDescription>
          </div>
        </div>
      </UIModalHeader>

      {/* Modal Body */}
      <UIModalBody className="space-y-4 py-4 max-h-[68vh] overflow-y-auto">
        {/* 1. Member Context Pill Card */}
        <div className="bg-surface-alt/70 rounded-2xl p-3 sm:p-3.5 border border-border/60 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.avatar?.url ? (
              <img
                src={user.avatar.url}
                alt={displayName}
                className="size-9 rounded-full object-cover border border-border/60 shrink-0 shadow-2xs"
              />
            ) : (
              <div className="size-9 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center border border-border/60 shrink-0 shadow-2xs select-none">
                {getInitials(displayName)}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-xs font-bold text-text truncate block">
                {displayName}
              </span>
              <span className="text-[11px] text-text-muted truncate block">
                {displayEmail}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <UIBadge variant="soft" color="primary" size="sm">
              {isOwner ? "Workspace Owner" : "Active Member"}
            </UIBadge>
          </div>
        </div>

        {/* 2. Role Selection Stream */}
        {isLoadingRoles ? (
          <div className="space-y-3 pt-1">
            <UISkeleton className="h-9 w-full rounded-xl" />
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-surface rounded-xl p-3.5 border border-border/50 flex items-center justify-between gap-3"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <UISkeleton className="h-4 w-28 rounded" />
                      <UISkeleton className="h-4 w-14 rounded-full" />
                    </div>
                    <UISkeleton className="h-3 w-4/5 rounded" />
                  </div>
                  <UISkeleton className="size-5 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {assignableRoles.length > 4 && (
              <UISearchInput
                placeholder="Search security roles or permissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery("")}
                size="sm"
              />
            )}

            {filteredRoles.length === 0 ? (
              <div className="py-8 px-4 text-center bg-surface/75 rounded-2xl border border-dashed border-border/80 space-y-1">
                <Shield className="size-7 text-text-muted/60 mx-auto mb-1.5" />
                <span className="text-xs font-semibold text-text block">
                  No Matching Roles
                </span>
                <span className="text-[11px] text-text-muted block max-w-xs mx-auto">
                  {searchQuery
                    ? "Try adjusting your search keywords."
                    : "No assignable roles within your permission clearance."}
                </span>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredRoles.map((role) => {
                  const isSelected = String(role._id) === String(selectedRoleId);
                  const permissionsCount = Array.isArray(role.permissions)
                    ? role.permissions.filter((p) => !isWorkAccessPermissionKey(p)).length
                    : 0;

                  return (
                    <div
                      key={role._id}
                      onClick={() => handleSelectRole(role._id)}
                      className={cn(
                        "p-3 sm:p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer select-none group",
                        isSelected
                          ? "bg-surface border-primary/60 ring-1 ring-primary/30 shadow-xs"
                          : "bg-surface/75 border-border/60 hover:bg-surface hover:border-border",
                      )}
                    >
                      {/* Role Info */}
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-text">
                            {role.name}
                          </span>
                          {role.isSystem && (
                            <UIBadge variant="soft" color="neutral" size="xs">
                              System
                            </UIBadge>
                          )}
                          {permissionsCount > 0 && (
                            <span className="text-[10.5px] font-medium text-text-muted">
                              • {permissionsCount} module perms
                            </span>
                          )}
                        </div>

                        <RoleWorkAccessBadges role={role} compact />

                        {role.description && (
                          <p className="text-[11.5px] text-text-muted line-clamp-2 leading-relaxed">
                            {role.description}
                          </p>
                        )}
                      </div>

                      {/* Radio Selection Indicator */}
                      <div className="pt-0.5 shrink-0">
                        <div
                          className={cn(
                            "size-5 rounded-full border flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-primary border-primary text-primary-contrast shadow-2xs"
                              : "border-border/80 group-hover:border-primary/50 bg-surface",
                          )}
                        >
                          {isSelected && <Check className="size-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedRoleObject && (
              <div className="p-3 rounded-xl border border-border/60 bg-surface-alt/50 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted">
                  <span>Selected Role Hierarchy Preview</span>
                  {!isOwnerActor && (
                    <span className="inline-flex items-center gap-1">
                      <Lock className="size-3" /> Clamped to your clearance
                    </span>
                  )}
                </div>
                <RoleWorkAccessBadges
                  role={selectedRoleObject}
                  showHierarchy
                  compact
                />
              </div>
            )}
          </div>
        )}
      </UIModalBody>

      {/* Modal Footer */}
      <UIModalFooter className="pt-3 border-t border-border/40 flex items-center justify-between gap-2.5">
        <span className="text-[11.5px] text-text-muted hidden sm:inline-block">
          {isRoleChanged ? "Role selection modified" : "Choose a role to update"}
        </span>

        <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
          <UIButton
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none justify-center"
          >
            Cancel
          </UIButton>
          <UIButton
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!selectedRoleId || isSubmitting || !isRoleChanged}
            isLoading={isSubmitting}
            className="flex-1 sm:flex-none justify-center min-w-[120px]"
          >
            Save Role
          </UIButton>
        </div>
      </UIModalFooter>
    </UIModal>
  );
}
