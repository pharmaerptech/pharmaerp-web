import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createAccountGroup,
  getAccountGroups,
  getAccountGroupById,
  updateAccountGroup,
  deleteAccountGroup,
} from "../store/accountGroupThunk";

import {
  clearAccountGroupError,
  clearAccountGroupMessage,
  setCurrentAccountGroup,
  clearCurrentAccountGroup,
  clearAccountGroups,
  clearManagedAccountGroup,
} from "../store/accountGroupSlice";

import {
  selectAccountGroups,
  selectCurrentAccountGroup,
  selectManagedAccountGroup,
  selectAccountGroupStatus,
  selectAccountGroupError,
  selectAccountGroupMessage,
  selectCreateAccountGroupStatus,
  selectGetAccountGroupsStatus,
  selectGetAccountGroupStatus,
  selectUpdateAccountGroupStatus,
  selectDeleteAccountGroupStatus,
} from "../store/accountGroupSelector";

const useAccountGroup = () => {
  const dispatch = useDispatch();

  const accountGroups = useSelector(selectAccountGroups);
  const currentAccountGroup = useSelector(selectCurrentAccountGroup);
  const managedAccountGroup = useSelector(selectManagedAccountGroup);

  const status = useSelector(selectAccountGroupStatus);
  const error = useSelector(selectAccountGroupError);
  const message = useSelector(selectAccountGroupMessage);

  const createAccountGroupStatus = useSelector(selectCreateAccountGroupStatus);

  const getAccountGroupsStatus = useSelector(selectGetAccountGroupsStatus);

  const getAccountGroupStatus = useSelector(selectGetAccountGroupStatus);

  const updateAccountGroupStatus = useSelector(selectUpdateAccountGroupStatus);

  const deleteAccountGroupStatus = useSelector(selectDeleteAccountGroupStatus);

  const submitCreateAccountGroup = useCallback((payload) => {
    return dispatch(createAccountGroup(payload)).unwrap();
  }, [dispatch]);

  const fetchAccountGroups = useCallback((params = {}) => {
    return dispatch(getAccountGroups(params)).unwrap();
  }, [dispatch]);

  const fetchAccountGroupById = useCallback((accountGroupId) => {
    return dispatch(getAccountGroupById(accountGroupId)).unwrap();
  }, [dispatch]);

  const submitUpdateAccountGroup = useCallback((accountGroupId, payload) => {
    return dispatch(
      updateAccountGroup({
        accountGroupId,
        payload,
      }),
    ).unwrap();
  }, [dispatch]);

  const submitDeleteAccountGroup = useCallback((accountGroupId) => {
    return dispatch(deleteAccountGroup(accountGroupId)).unwrap();
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearAccountGroupError());
  }, [dispatch]);

  const clearMessage = useCallback(() => {
    dispatch(clearAccountGroupMessage());
  }, [dispatch]);

  const saveCurrentAccountGroup = useCallback((payload) => {
    dispatch(setCurrentAccountGroup(payload));
  }, [dispatch]);

  const removeCurrentAccountGroup = useCallback(() => {
    dispatch(clearCurrentAccountGroup());
  }, [dispatch]);

  const removeAccountGroups = useCallback(() => {
    dispatch(clearAccountGroups());
  }, [dispatch]);

  const removeManagedAccountGroup = useCallback(() => {
    dispatch(clearManagedAccountGroup());
  }, [dispatch]);

  return {
    accountGroups,
    currentAccountGroup,
    managedAccountGroup,

    status,
    error,
    message,

    createAccountGroupStatus,
    getAccountGroupsStatus,
    getAccountGroupStatus,
    updateAccountGroupStatus,
    deleteAccountGroupStatus,

    createAccountGroup: submitCreateAccountGroup,
    getAccountGroups: fetchAccountGroups,
    getAccountGroupById: fetchAccountGroupById,
    updateAccountGroup: submitUpdateAccountGroup,
    deleteAccountGroup: submitDeleteAccountGroup,

    clearError,
    clearMessage,

    setCurrentAccountGroup: saveCurrentAccountGroup,
    clearCurrentAccountGroup: removeCurrentAccountGroup,
    clearAccountGroups: removeAccountGroups,
    clearManagedAccountGroup: removeManagedAccountGroup,
  };
};

export default useAccountGroup;
