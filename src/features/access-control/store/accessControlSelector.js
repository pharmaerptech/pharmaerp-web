export const selectAccessControl = (state) => state.accessControl;

export const selectRoles = (state) => state.accessControl.roles;

export const selectCurrentRole = (state) => state.accessControl.currentRole;

export const selectPermissions = (state) => state.accessControl.permissions;

export const selectMemberAccessList = (state) =>
  state.accessControl.memberAccessList;

export const selectCurrentMemberAccess = (state) =>
  state.accessControl.currentMemberAccess;

export const selectCompanyAccessCheck = (state) =>
  state.accessControl.companyAccessCheck;

export const selectBranchAccessCheck = (state) =>
  state.accessControl.branchAccessCheck;

export const selectAccessControlStatus = (state) => state.accessControl.status;

export const selectAccessControlError = (state) => state.accessControl.error;

export const selectAccessControlMessage = (state) =>
  state.accessControl.message;

export const selectCreateRoleStatus = (state) =>
  state.accessControl.createRoleStatus;

export const selectGetWorkspaceRolesStatus = (state) =>
  state.accessControl.getWorkspaceRolesStatus;

export const selectGetRoleStatus = (state) => state.accessControl.getRoleStatus;

export const selectUpdateRoleStatus = (state) =>
  state.accessControl.updateRoleStatus;

export const selectDeleteRoleStatus = (state) =>
  state.accessControl.deleteRoleStatus;

export const selectAssignRoleToMemberStatus = (state) =>
  state.accessControl.assignRoleToMemberStatus;

export const selectGetAvailablePermissionsStatus = (state) =>
  state.accessControl.getAvailablePermissionsStatus;

export const selectGetWorkspaceMemberAccessListStatus = (state) =>
  state.accessControl.getWorkspaceMemberAccessListStatus;

export const selectGetMemberAccessStatus = (state) =>
  state.accessControl.getMemberAccessStatus;

export const selectUpdateMemberAccessStatus = (state) =>
  state.accessControl.updateMemberAccessStatus;

export const selectCheckCompanyAccessStatus = (state) =>
  state.accessControl.checkCompanyAccessStatus;

export const selectCheckBranchAccessStatus = (state) =>
  state.accessControl.checkBranchAccessStatus;

export const selectMyAccess = (state) => state.accessControl.myAccess;

export const selectMyWorkAccess = (state) => state.accessControl.myWorkAccess;

export const selectAllowedWorkModes = (state) =>
  state.accessControl.myWorkAccess?.allowedWorkModes || null;

export const selectAllowedWorkLevels = (state) =>
  state.accessControl.myWorkAccess?.allowedWorkLevels || null;

export const selectHighestWorkLevel = (state) =>
  state.accessControl.myWorkAccess?.highestWorkLevel || null;

export const selectGetMyAccessStatus = (state) =>
  state.accessControl.getMyAccessStatus;
