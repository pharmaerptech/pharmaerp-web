// src/hooks/usePermission.js
//
// Core permission + work-mode/work-level hook for the ERP frontend.

import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";

import {
  selectMyAccess,
  selectMyWorkAccess,
  selectGetMyAccessStatus,
} from "@/features/access-control/store/accessControlSelector";
import { selectWorkspaces, selectCurrentWorkspace } from "@/features/workspace/store/workspaceSelector";
import { selectUserProfile } from "@/features/user/store/userSelector";
import { API_STATUS } from "@/constants";
import {
  WORK_MODES,
  isWorkLevelAllowed,
  isWorkModeAllowed,
  resolveMyWorkAccess,
} from "@/utils/workAccess";

const usePermission = () => {
  const myAccess = useSelector(selectMyAccess);
  const storedWorkAccess = useSelector(selectMyWorkAccess);
  const getMyAccessStatus = useSelector(selectGetMyAccessStatus);
  const workspaces = useSelector(selectWorkspaces);
  const currentWorkspace = useSelector(selectCurrentWorkspace);
  const userProfile = useSelector(selectUserProfile);

  const isOwner = useMemo(() => {
    if (userProfile?.isOwner || myAccess?.isOwner || myAccess?.member?.isOwner) {
      return true;
    }

    if (!currentWorkspace?._id || !workspaces?.length) {
      return Boolean(userProfile?.isOwner || myAccess?.isOwner || myAccess?.member?.isOwner);
    }

    const matchingItem = workspaces.find((item) => {
      const ws = item?.workspace || item;
      return ws?._id === currentWorkspace._id;
    });

    if (!matchingItem) {
      return Boolean(userProfile?.isOwner || myAccess?.isOwner || myAccess?.member?.isOwner);
    }

    const member = matchingItem?.member || null;
    return Boolean(member?.isOwner || matchingItem?.isOwner || matchingItem?.isOwnerWorkspace);
  }, [workspaces, currentWorkspace, userProfile, myAccess]);

  const permissionSet = useMemo(() => {
    if (!myAccess) return new Set();
    const perms = myAccess?.permissions || myAccess?.role?.permissions || [];
    return new Set(Array.isArray(perms) ? perms : []);
  }, [myAccess]);

  const workAccess = useMemo(() => {
    if (isOwner) {
      return resolveMyWorkAccess(myAccess, { isOwnerOverride: true });
    }
    return storedWorkAccess || resolveMyWorkAccess(myAccess, { isOwnerOverride: false });
  }, [isOwner, myAccess, storedWorkAccess]);

  const allowedWorkModes = useMemo(
    () => workAccess?.allowedWorkModes || null,
    [workAccess],
  );

  const allowedWorkLevels = useMemo(
    () => workAccess?.allowedWorkLevels || null,
    [workAccess],
  );

  const highestWorkLevel = workAccess?.highestWorkLevel || null;

  const isLoaded =
    isOwner ||
    getMyAccessStatus === API_STATUS.SUCCESS ||
    getMyAccessStatus === API_STATUS.ERROR;

  const can = useCallback(
    (permissionKey) => {
      if (isOwner) return true;
      if (!permissionKey) return true;
      return permissionSet.has(permissionKey);
    },
    [isOwner, permissionSet],
  );

  const canAny = useCallback(
    (permissionKeys) => {
      if (isOwner) return true;
      if (!permissionKeys?.length) return true;
      return permissionKeys.some((key) => permissionSet.has(key));
    },
    [isOwner, permissionSet],
  );

  const canAll = useCallback(
    (permissionKeys) => {
      if (isOwner) return true;
      if (!permissionKeys?.length) return true;
      return permissionKeys.every((key) => permissionSet.has(key));
    },
    [isOwner, permissionSet],
  );

  const canWorkMode = useCallback(
    (mode) => {
      if (isOwner) return true;
      if (!workAccess) return false;
      return isWorkModeAllowed(workAccess, mode);
    },
    [isOwner, workAccess],
  );

  const canWorkLevel = useCallback(
    (level) => {
      if (isOwner) return true;
      if (!workAccess) return false;
      return isWorkLevelAllowed(workAccess, level);
    },
    [isOwner, workAccess],
  );

  return {
    can,
    canAny,
    canAll,
    canWorkMode,
    canWorkLevel,
    canViewMode: canWorkMode(WORK_MODES.VIEW),
    canOperationMode: canWorkMode(WORK_MODES.OPERATION),
    canSwitchWorkMode: Boolean(isOwner || (allowedWorkModes && allowedWorkModes.length > 1)),
    isOwner,
    isLoaded,
    myAccess,
    permissionSet,
    workAccess,
    allowedWorkModes,
    allowedWorkLevels,
    highestWorkLevel,
  };
};

export default usePermission;
