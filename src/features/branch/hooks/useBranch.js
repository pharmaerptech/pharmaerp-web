import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  createBranch,
  getCompanyBranches,
  getWorkspaceBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  getBranchEmployees,
} from "../store/branchThunk";

import {
  clearBranchError,
  clearBranchMessage,
  setCurrentBranch,
  clearCurrentBranch,
  clearBranches,
  clearManagedBranch,
} from "../store/branchSlice";

import {
  selectBranches,
  selectWorkspaceBranches,
  selectCurrentBranch,
  selectManagedBranch,
  selectBranchEmployees,
  selectBranchStatus,
  selectBranchError,
  selectBranchMessage,
  selectCreateBranchStatus,
  selectGetCompanyBranchesStatus,
  selectGetWorkspaceBranchesStatus,
  selectGetBranchStatus,
  selectUpdateBranchStatus,
  selectDeleteBranchStatus,
} from "../store/branchSelector";

const useBranch = () => {
  const dispatch = useDispatch();

  const branches = useSelector(selectBranches);
  const workspaceBranches = useSelector(selectWorkspaceBranches);
  const currentBranch = useSelector(selectCurrentBranch);
  const managedBranch = useSelector(selectManagedBranch);
  const branchEmployees = useSelector(selectBranchEmployees);

  const status = useSelector(selectBranchStatus);
  const error = useSelector(selectBranchError);
  const message = useSelector(selectBranchMessage);

  const createBranchStatus = useSelector(selectCreateBranchStatus);
  const getCompanyBranchesStatus = useSelector(selectGetCompanyBranchesStatus);
  const getWorkspaceBranchesStatus = useSelector(
    selectGetWorkspaceBranchesStatus,
  );
  const getBranchStatus = useSelector(selectGetBranchStatus);
  const updateBranchStatus = useSelector(selectUpdateBranchStatus);
  const deleteBranchStatus = useSelector(selectDeleteBranchStatus);

  const submitCreateBranch = useCallback(
    (payload) => dispatch(createBranch(payload)).unwrap(),
    [dispatch],
  );

  const fetchCompanyBranches = useCallback(
    (targetCompanyId) => dispatch(getCompanyBranches(targetCompanyId)).unwrap(),
    [dispatch],
  );

  const fetchWorkspaceBranches = useCallback(
    () => dispatch(getWorkspaceBranches()).unwrap(),
    [dispatch],
  );

  const fetchBranchById = useCallback(
    (branchId) => dispatch(getBranchById(branchId)).unwrap(),
    [dispatch],
  );

  const submitUpdateBranch = useCallback(
    (branchId, payload) =>
      dispatch(
        updateBranch({
          branchId,
          payload,
        }),
      ).unwrap(),
    [dispatch],
  );

  const submitDeleteBranch = useCallback(
    (branchId) => dispatch(deleteBranch(branchId)).unwrap(),
    [dispatch],
  );

  const fetchBranchEmployees = useCallback(
    (branchId) => dispatch(getBranchEmployees(branchId)).unwrap(),
    [dispatch],
  );

  const clearError = useCallback(() => {
    dispatch(clearBranchError());
  }, [dispatch]);

  const clearMessage = useCallback(() => {
    dispatch(clearBranchMessage());
  }, [dispatch]);

    const saveCurrentBranch = useCallback(
    (payload) => {
      dispatch(setCurrentBranch(payload));
      try {
        if (payload?._id) {
          localStorage.setItem("pahuch_active_branch_id", payload._id);
        } else {
          localStorage.removeItem("pahuch_active_branch_id");
        }
      } catch {}
    },
    [dispatch],
  );

  const removeCurrentBranch = useCallback(() => {
    dispatch(clearCurrentBranch());
    try {
      localStorage.removeItem("pahuch_active_branch_id");
    } catch {}
  }, [dispatch]);

  const removeBranches = useCallback(() => {
    dispatch(clearBranches());
  }, [dispatch]);

  const removeManagedBranch = useCallback(() => {
    dispatch(clearManagedBranch());
  }, [dispatch]);

  return {
    branches,
    workspaceBranches,
    currentBranch,
    managedBranch,
    branchEmployees,

    status,
    error,
    message,

    createBranchStatus,
    getCompanyBranchesStatus,
    getWorkspaceBranchesStatus,
    getBranchStatus,
    updateBranchStatus,
    deleteBranchStatus,

    createBranch: submitCreateBranch,
    getCompanyBranches: fetchCompanyBranches,
    getWorkspaceBranches: fetchWorkspaceBranches,
    getBranchById: fetchBranchById,
    updateBranch: submitUpdateBranch,
    deleteBranch: submitDeleteBranch,
    getBranchEmployees: fetchBranchEmployees,

    clearError,
    clearMessage,

    setCurrentBranch: saveCurrentBranch,
    clearCurrentBranch: removeCurrentBranch,
    clearBranches: removeBranches,
    clearManagedBranch: removeManagedBranch,
  };
};

export default useBranch;
