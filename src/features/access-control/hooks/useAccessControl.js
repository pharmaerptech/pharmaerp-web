import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createRole,
  getWorkspaceRoles,
  getRoleById,
  updateRole,
  deleteRole,
  assignRoleToMember,
  getAvailablePermissions,
  getWorkspaceMemberAccessList,
  getMemberAccess,
  updateMemberAccess,
  checkCompanyAccess,
  checkBranchAccess,
  getMyAccess,
} from "../store/accessControlThunk";

import {
  clearAccessControlError,
  clearAccessControlMessage,
  clearCurrentRole,
  clearCurrentMemberAccess,
  clearMemberAccessCheck,
  clearMyAccess,
} from "../store/accessControlSlice";

import {
  selectRoles,
  selectCurrentRole,
  selectPermissions,
  selectMemberAccessList,
  selectCurrentMemberAccess,
  selectCompanyAccessCheck,
  selectBranchAccessCheck,
  selectAccessControlStatus,
  selectAccessControlError,
  selectAccessControlMessage,
  selectCreateRoleStatus,
  selectGetWorkspaceRolesStatus,
  selectGetRoleStatus,
  selectUpdateRoleStatus,
  selectDeleteRoleStatus,
  selectAssignRoleToMemberStatus,
  selectGetAvailablePermissionsStatus,
  selectGetWorkspaceMemberAccessListStatus,
  selectGetMemberAccessStatus,
  selectUpdateMemberAccessStatus,
  selectCheckCompanyAccessStatus,
  selectCheckBranchAccessStatus,
  selectMyAccess,
  selectMyWorkAccess,
  selectAllowedWorkModes,
  selectAllowedWorkLevels,
  selectHighestWorkLevel,
  selectGetMyAccessStatus,
} from "../store/accessControlSelector";

const useAccessControl = () => {
  const dispatch = useDispatch();

  const roles = useSelector(selectRoles);
  const currentRole = useSelector(selectCurrentRole);
  const permissions = useSelector(selectPermissions);

  const memberAccessList = useSelector(selectMemberAccessList);
  const currentMemberAccess = useSelector(selectCurrentMemberAccess);

  const companyAccessCheck = useSelector(selectCompanyAccessCheck);
  const branchAccessCheck = useSelector(selectBranchAccessCheck);

  const status = useSelector(selectAccessControlStatus);
  const error = useSelector(selectAccessControlError);
  const message = useSelector(selectAccessControlMessage);

  const createRoleStatus = useSelector(selectCreateRoleStatus);
  const getWorkspaceRolesStatus = useSelector(selectGetWorkspaceRolesStatus);
  const getRoleStatus = useSelector(selectGetRoleStatus);
  const updateRoleStatus = useSelector(selectUpdateRoleStatus);
  const deleteRoleStatus = useSelector(selectDeleteRoleStatus);
  const assignRoleToMemberStatus = useSelector(selectAssignRoleToMemberStatus);
  const getAvailablePermissionsStatus = useSelector(
    selectGetAvailablePermissionsStatus,
  );

  const getWorkspaceMemberAccessListStatus = useSelector(
    selectGetWorkspaceMemberAccessListStatus,
  );
  const getMemberAccessStatus = useSelector(selectGetMemberAccessStatus);
  const updateMemberAccessStatus = useSelector(selectUpdateMemberAccessStatus);

  const checkCompanyAccessStatus = useSelector(selectCheckCompanyAccessStatus);
  const checkBranchAccessStatus = useSelector(selectCheckBranchAccessStatus);

  const myAccess = useSelector(selectMyAccess);
  const myWorkAccess = useSelector(selectMyWorkAccess);
  const allowedWorkModes = useSelector(selectAllowedWorkModes);
  const allowedWorkLevels = useSelector(selectAllowedWorkLevels);
  const highestWorkLevel = useSelector(selectHighestWorkLevel);
  const getMyAccessStatus = useSelector(selectGetMyAccessStatus);

  const submitCreateRole = useCallback(
    (payload) => dispatch(createRole(payload)).unwrap(),
    [dispatch],
  );

  const fetchWorkspaceRoles = useCallback(
    () => dispatch(getWorkspaceRoles()).unwrap(),
    [dispatch],
  );

  const fetchRoleById = useCallback(
    (roleId) => dispatch(getRoleById(roleId)).unwrap(),
    [dispatch],
  );

  const submitUpdateRole = useCallback(
    (roleId, payload) => dispatch(updateRole({ roleId, payload })).unwrap(),
    [dispatch],
  );

  const submitDeleteRole = useCallback(
    (roleId) => dispatch(deleteRole(roleId)).unwrap(),
    [dispatch],
  );

  const submitAssignRoleToMember = useCallback(
    (memberUserId, payload) =>
      dispatch(assignRoleToMember({ memberUserId, payload })).unwrap(),
    [dispatch],
  );

  const fetchAvailablePermissions = useCallback(
    () => dispatch(getAvailablePermissions()).unwrap(),
    [dispatch],
  );

  const fetchWorkspaceMemberAccessList = useCallback(
    () => dispatch(getWorkspaceMemberAccessList()).unwrap(),
    [dispatch],
  );

  const fetchMemberAccess = useCallback(
    (memberUserId) => dispatch(getMemberAccess(memberUserId)).unwrap(),
    [dispatch],
  );

  const submitUpdateMemberAccess = useCallback(
    (memberUserId, payload) =>
      dispatch(updateMemberAccess({ memberUserId, payload })).unwrap(),
    [dispatch],
  );

  const verifyCompanyAccess = useCallback(
    (companyId) => dispatch(checkCompanyAccess(companyId)).unwrap(),
    [dispatch],
  );

  const verifyBranchAccess = useCallback(
    (branchId) => dispatch(checkBranchAccess(branchId)).unwrap(),
    [dispatch],
  );

  const fetchMyAccess = useCallback(
    () => dispatch(getMyAccess()).unwrap(),
    [dispatch],
  );

  const clearError = useCallback(() => {
    dispatch(clearAccessControlError());
  }, [dispatch]);

  const clearMessage = useCallback(() => {
    dispatch(clearAccessControlMessage());
  }, [dispatch]);

  const removeCurrentRole = useCallback(() => {
    dispatch(clearCurrentRole());
  }, [dispatch]);

  const removeCurrentMemberAccess = useCallback(() => {
    dispatch(clearCurrentMemberAccess());
  }, [dispatch]);

  const removeMemberAccessCheck = useCallback(() => {
    dispatch(clearMemberAccessCheck());
  }, [dispatch]);

  const resetMyAccess = useCallback(() => {
    dispatch(clearMyAccess());
  }, [dispatch]);

  return {
    roles,
    currentRole,
    permissions,

    memberAccessList,
    currentMemberAccess,

    companyAccessCheck,
    branchAccessCheck,

    status,
    error,
    message,

    createRoleStatus,
    getWorkspaceRolesStatus,
    getRoleStatus,
    updateRoleStatus,
    deleteRoleStatus,
    assignRoleToMemberStatus,
    getAvailablePermissionsStatus,

    getWorkspaceMemberAccessListStatus,
    getMemberAccessStatus,
    updateMemberAccessStatus,
    checkCompanyAccessStatus,
    checkBranchAccessStatus,

    myAccess,
    myWorkAccess,
    allowedWorkModes,
    allowedWorkLevels,
    highestWorkLevel,
    getMyAccessStatus,

    createRole: submitCreateRole,
    getWorkspaceRoles: fetchWorkspaceRoles,
    getRoleById: fetchRoleById,
    updateRole: submitUpdateRole,
    deleteRole: submitDeleteRole,
    assignRoleToMember: submitAssignRoleToMember,
    getAvailablePermissions: fetchAvailablePermissions,

    getWorkspaceMemberAccessList: fetchWorkspaceMemberAccessList,
    getMemberAccess: fetchMemberAccess,
    updateMemberAccess: submitUpdateMemberAccess,

    checkCompanyAccess: verifyCompanyAccess,
    checkBranchAccess: verifyBranchAccess,
    getMyAccess: fetchMyAccess,

    clearError,
    clearMessage,
    clearCurrentRole: removeCurrentRole,
    clearCurrentMemberAccess: removeCurrentMemberAccess,
    clearMemberAccessCheck: removeMemberAccessCheck,
    clearMyAccess: resetMyAccess,
  };
};

export default useAccessControl;
