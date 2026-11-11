// src/features/workspace/pages/WorkspaceMemberDetailsPage.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile } from "@/hooks";
import { resolveRoleWorkAccess } from "@/utils/workAccess";
import {
  UIConfirmDialog,
  uiToast,
} from "@/components/ui";

import useWorkspace from "../hooks/useWorkspace";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import useAccessControl from "@/features/access-control/hooks/useAccessControl";
import {
  ResetMemberPasswordModal,
  MemberAccessModal,
  AssignMemberRoleModal,
} from "../components";

import { WorkspaceMemberDetailsDesktopPage } from "./desktop";
import { WorkspaceMemberDetailsMobilePage } from "./mobile";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRoleName = (role) => {
  const roleName = role?.name || role?.title || role?.code;
  if (!roleName) return "-";
  return String(roleName)
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function WorkspaceMemberDetailsPage() {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const isMobile = useIsMobile();

  const {
    currentWorkspace,
    members,
    getWorkspaceMembers,
    updateWorkspaceMemberStatus,
    removeWorkspaceMember,
    resetMemberPassword,
    getWorkspaceMembersStatus,
    updateWorkspaceMemberStatus: updateMemberStatusStatus,
    removeWorkspaceMemberStatus,
    resetMemberPasswordStatus,
  } = useWorkspace();

  const { companies, getWorkspaceCompanies } = useCompany();
  const { branches, workspaceBranches, getWorkspaceBranches } = useBranch();
  const {
    roles,
    getWorkspaceRoles,
    getWorkspaceRolesStatus,
    getMemberAccess,
    getMemberAccessStatus,
    updateMemberAccess,
    updateMemberAccessStatus,
    assignRoleToMember,
    assignRoleToMemberStatus,
  } = useAccessControl();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [memberAction, setMemberAction] = useState(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);

  // Access modal state
  const [accessFormData, setAccessFormData] = useState({
    accessAllCompanies: false,
    accessAllBranches: false,
    companyIds: [],
    branchIds: [],
  });

  const workspaceId = currentWorkspace?._id;
  const isLoading = getWorkspaceMembersStatus === API_STATUS.LOADING;
  const isMutating =
    updateMemberStatusStatus === API_STATUS.LOADING ||
    removeWorkspaceMemberStatus === API_STATUS.LOADING;
  const isResettingPassword =
    resetMemberPasswordStatus === API_STATUS.LOADING;
  const isUpdatingAccess =
    updateMemberAccessStatus === API_STATUS.LOADING;
  const isLoadingAccess =
    getMemberAccessStatus === API_STATUS.LOADING;
  const isLoadingRoles =
    getWorkspaceRolesStatus === API_STATUS.LOADING;
  const isAssigningRole =
    assignRoleToMemberStatus === API_STATUS.LOADING;

  const hasFetchedMembersRef = useRef(false);
  const hasFetchedWorkspaceDataRef = useRef(false);
  const fetchedMemberUserIdRef = useRef(null);

  // 1. Fetch workspace members if not present
  useEffect(() => {
    if (workspaceId && !hasFetchedMembersRef.current && (!members || !members.length)) {
      hasFetchedMembersRef.current = true;
      getWorkspaceMembers(workspaceId).catch(() => {});
    }
  }, [workspaceId, members, getWorkspaceMembers]);

  // 2. Fetch workspace metadata (companies, branches, roles) once
  useEffect(() => {
    if (workspaceId && !hasFetchedWorkspaceDataRef.current) {
      hasFetchedWorkspaceDataRef.current = true;
      getWorkspaceCompanies().catch(() => {});
      getWorkspaceBranches().catch(() => {});
      getWorkspaceRoles().catch(() => {});
    }
  }, [workspaceId, getWorkspaceCompanies, getWorkspaceBranches, getWorkspaceRoles]);

  const allWorkspaceBranches = useMemo(() => {
    return workspaceBranches?.length ? workspaceBranches : branches || [];
  }, [workspaceBranches, branches]);

  const member = useMemo(() => {
    if (!members || !members.length || !memberId) return null;
    return members.find(
      (m) =>
        String(m._id) === String(memberId) ||
        String(m.userId?._id) === String(memberId) ||
        String(m.user?._id) === String(memberId)
    );
  }, [members, memberId]);

  const user = member?.userId || member?.user || null;
  const memberUserId = user?._id || member?.userId?._id || member?._id;

  // 3. Load member access data only once per memberUserId
  useEffect(() => {
    if (memberUserId && fetchedMemberUserIdRef.current !== memberUserId) {
      fetchedMemberUserIdRef.current = memberUserId;
      getMemberAccess(memberUserId)
        .then((data) => {
          if (data) {
            setAccessFormData({
              accessAllCompanies: Boolean(data.accessAllCompanies),
              accessAllBranches: Boolean(data.accessAllBranches),
              companyIds: data.companies?.map((c) => String(c._id || c)) || [],
              branchIds: data.branches?.map((b) => String(b._id || b)) || [],
            });
          }
        })
        .catch(() => {});
    }
  }, [memberUserId, getMemberAccess]);

  const displayName =
    user?.fullName ||
    user?.name ||
    user?.profile?.fullName ||
    user?.email ||
    "Workspace Member";
  const displayEmail = user?.email || "-";
  const displayPhone =
    user?.phone || user?.mobile || user?.profile?.phone
      ? `+91 ${user?.phone || user?.mobile || user?.profile?.phone}`
      : "-";
  const displayRole = member?.isOwner
    ? "Owner"
    : formatRoleName(member?.roleId || member?.role);
  const userCode = user?.userCode || "";
  const isOwner = Boolean(member?.isOwner);
  const workAccess = useMemo(
    () =>
      member?.workAccess ||
      resolveRoleWorkAccess(member?.roleId || member?.role, { isOwner }),
    [isOwner, member],
  );
  const status = member?.status || "inactive";
  const joinedDate = formatDate(member?.createdAt);
  const lastActiveFormatted = formatDateTime(member?.lastActiveAt || user?.lastLoginAt);

  const handleBack = useCallback(() => {
    navigate(ROUTES.WORKSPACE_MEMBERS);
  }, [navigate]);

  const openConfirm = useCallback((action) => {
    if (!member || isOwner) return;
    setMemberAction(action);
    setIsConfirmOpen(true);
  }, [member, isOwner]);

  const closeConfirm = useCallback(() => {
    if (isMutating) return;
    setIsConfirmOpen(false);
    setMemberAction(null);
  }, [isMutating]);

  const handleConfirmAction = useCallback(async () => {
    if (!workspaceId || !member || !memberAction || !memberUserId) return;

    try {
      if (memberAction === "remove") {
        await removeWorkspaceMember(workspaceId, memberUserId);
        uiToast.success("Member Removed", `${displayName} was removed from the workspace.`);
        navigate(ROUTES.WORKSPACE_MEMBERS);
      } else {
        await updateWorkspaceMemberStatus(
          workspaceId,
          memberUserId,
          memberAction
        );
        uiToast.success("Status Updated", `${displayName}'s status is now ${memberAction}.`);
      }
      closeConfirm();
    } catch (err) {
      uiToast.error("Action Failed", err?.message || "Failed to update workspace member.");
    }
  }, [
    workspaceId,
    member,
    memberAction,
    memberUserId,
    displayName,
    removeWorkspaceMember,
    updateWorkspaceMemberStatus,
    navigate,
    closeConfirm,
  ]);

  const handleConfirmResetPassword = useCallback(
    async (newPassword) => {
      if (!workspaceId || !member || !memberUserId) return;
      try {
        await resetMemberPassword(workspaceId, memberUserId, newPassword);
        setIsResetPasswordOpen(false);
        uiToast.success("Password Updated", `Password for ${displayName} was reset successfully.`);
      } catch (err) {
        uiToast.error("Reset Failed", err?.message || "Failed to reset password.");
      }
    },
    [resetMemberPassword, member, memberUserId, workspaceId, displayName]
  );

  // Save company and branch access
  const handleSaveAccess = async () => {
    if (!memberUserId) return;
    try {
      const isAllCompanies = Boolean(accessFormData.accessAllCompanies);
      const cleanCompanyIds = isAllCompanies
        ? []
        : (accessFormData.companyIds || []).map((id) => String(id?._id || id).trim());

      const hasCompanyScope = isAllCompanies || cleanCompanyIds.length > 0;
      const isAllBranches = hasCompanyScope && Boolean(accessFormData.accessAllBranches);
      const cleanBranchIds = hasCompanyScope && !isAllBranches
        ? (accessFormData.branchIds || []).map((id) => String(id?._id || id).trim())
        : [];

      const payload = {
        accessAllCompanies: isAllCompanies,
        accessAllBranches: isAllBranches,
        companyIds: cleanCompanyIds,
        branchIds: cleanBranchIds,
      };

      await updateMemberAccess(memberUserId, payload);
      setIsAccessModalOpen(false);
      uiToast.success("Access Updated", `Permissions and branch access updated for ${displayName}.`);
      if (workspaceId) {
        getWorkspaceMembers(workspaceId).catch(() => {});
      }
    } catch (err) {
      uiToast.error("Update Failed", err?.message || "Could not update member access.");
    }
  };

  // Assign security role
  const handleConfirmAssignRole = useCallback(
    async (roleId) => {
      if (!memberUserId || !roleId) return;
      try {
        await assignRoleToMember(memberUserId, { roleId });
        setIsAssignRoleOpen(false);
        uiToast.success("Role Assigned", `Security role updated successfully for ${displayName}.`);
        if (workspaceId) {
          getWorkspaceMembers(workspaceId).catch(() => {});
        }
      } catch (err) {
        uiToast.error("Role Assignment Failed", err?.message || "Could not assign role to member.");
      }
    },
    [assignRoleToMember, memberUserId, workspaceId, displayName, getWorkspaceMembers]
  );

  const assignedCompanies = useMemo(() => {
    if (isOwner || accessFormData.accessAllCompanies) {
      return companies || [];
    }
    const selectedIds = (accessFormData.companyIds || []).map((id) => String(id?._id || id).trim());
    return (companies || []).filter((c) => selectedIds.includes(String(c._id).trim()));
  }, [isOwner, accessFormData.accessAllCompanies, accessFormData.companyIds, companies]);

  const assignedBranches = useMemo(() => {
    if (isOwner || accessFormData.accessAllBranches) {
      return allWorkspaceBranches;
    }
    const selectedIds = (accessFormData.branchIds || []).map((id) => String(id?._id || id).trim());
    return allWorkspaceBranches.filter((b) => selectedIds.includes(String(b._id).trim()));
  }, [isOwner, accessFormData.accessAllBranches, accessFormData.branchIds, allWorkspaceBranches]);

  const accessSummary = useMemo(() => {
    const isAllCompanies = isOwner || accessFormData.accessAllCompanies;
    const isAllBranches = isOwner || accessFormData.accessAllBranches;
    return {
      isAllCompanies,
      isAllBranches,
      companyLabel: isAllCompanies
        ? "All Companies Authorized"
        : assignedCompanies.length === 0
        ? "No Companies Authorized"
        : `${assignedCompanies.length} ${assignedCompanies.length === 1 ? "Company" : "Companies"} Authorized`,
      branchLabel: isAllBranches
        ? "All Branches Authorized"
        : assignedBranches.length === 0
        ? "No Branches Authorized"
        : `${assignedBranches.length} ${assignedBranches.length === 1 ? "Branch" : "Branches"} Authorized`,
    };
  }, [isOwner, accessFormData.accessAllCompanies, accessFormData.accessAllBranches, assignedCompanies.length, assignedBranches.length]);


  const isPrimary = Boolean(member?.isPrimary);
  const emailVerified = Boolean(user?.emailVerified);
  const phoneVerified = Boolean(user?.phoneVerified);
  const notes = member?.notes || null;
  const roleDescription = member?.roleId?.description || member?.role?.description || null;
  const joinedViaInvitationId = member?.joinedViaInvitationId || null;

  const sharedProps = {
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
    assignedCompanies,
    assignedBranches,
    accessSummary,
    isLoading,
    onOpenResetPassword: () => setIsResetPasswordOpen(true),
    onOpenAccessModal: () => {
      getWorkspaceBranches().catch(() => {});
      if (memberUserId) {
        getMemberAccess(memberUserId).catch(() => {});
      }
      setIsAccessModalOpen(true);
    },
    onOpenAssignRole: () => {
      getWorkspaceRoles().catch(() => {});
      setIsAssignRoleOpen(true);
    },
    onToggleStatus: (newStatus) => openConfirm(newStatus),
    onRemoveMember: () => openConfirm("remove"),
  };

  return (
    <>
      {isMobile ? (
        <WorkspaceMemberDetailsMobilePage {...sharedProps} />
      ) : (
        <WorkspaceMemberDetailsDesktopPage {...sharedProps} />
      )}

      {/* Confirmation Dialog */}
      <UIConfirmDialog
        isOpen={isConfirmOpen}
        onClose={closeConfirm}
        onConfirm={handleConfirmAction}
        title={
          memberAction === "remove"
            ? "Remove Member from Workspace"
            : "Update Member Status"
        }
        description={
          memberAction === "remove"
            ? `Remove ${displayName}? They will lose access to all store facilities immediately.`
            : `Change status to "${memberAction}" for ${displayName}?`
        }
        intent={memberAction === "remove" ? "danger" : "warning"}
        confirmText={
          memberAction === "remove" ? "Remove Member" : "Update Status"
        }
        itemName={displayName}
        itemDetails={`${displayRole} • ${displayEmail}`}
        isLoading={isMutating}
      />

      {/* Modern Reset Password Modal */}
      <ResetMemberPasswordModal
        open={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        onConfirm={handleConfirmResetPassword}
        member={member}
        isLoading={isResettingPassword}
      />

      {/* Modern Member Access & Store Clearance Modal */}
      <MemberAccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        onSave={handleSaveAccess}
        displayName={displayName}
        companies={companies || []}
        branches={allWorkspaceBranches}
        accessFormData={accessFormData}
        setAccessFormData={setAccessFormData}
        isLoadingAccess={isLoadingAccess}
        isLoading={isUpdatingAccess}
      />

      {/* Modern Assign Member Role Modal */}
      <AssignMemberRoleModal
        isOpen={isAssignRoleOpen}
        onClose={() => setIsAssignRoleOpen(false)}
        onAssignRole={handleConfirmAssignRole}
        member={member}
        roles={roles || []}
        currentRoleId={member?.roleId?._id || member?.roleId || member?.role?._id || member?.role}
        isLoadingRoles={isLoadingRoles}
        isSubmitting={isAssigningRole}
      />
    </>
  );
}

