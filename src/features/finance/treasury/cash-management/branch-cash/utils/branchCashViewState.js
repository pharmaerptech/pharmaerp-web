// src/features/finance/treasury/cash-management/branch-cash/utils/branchCashViewState.js

import { API_STATUS } from "../../../../../../constants/statuses.js";

const sumDenoms = (denominations = []) =>
  (Array.isArray(denominations) ? denominations : []).reduce(
    (s, d) => s + (Number(d.denomination) || 0) * (Number(d.quantity) || Number(d.count) || 0),
    0
  );

/**
 * Derive consistent loading, branch-matched data, initialization, and error state
 * for BranchCashPage so uninitialized branches (404 -> null, fetchStatus === API_STATUS.SUCCESS)
 * never hang in an infinite skeleton state.
 */
export const deriveBranchCashViewState = ({
  branchId,
  currentBranchCash,
  fetchStatus,
  error,
}) => {
  const normalizedBranchId = branchId ? String(branchId) : null;
  const cashBranchId = currentBranchCash?.branchId?._id
    ? String(currentBranchCash.branchId._id)
    : currentBranchCash?.branchId
    ? String(currentBranchCash.branchId)
    : null;

  const activeBranchCash =
    normalizedBranchId && currentBranchCash && (!cashBranchId || cashBranchId === normalizedBranchId)
      ? currentBranchCash
      : null;

  const isLoading =
    fetchStatus === API_STATUS.LOADING ||
    (Boolean(normalizedBranchId) &&
      !activeBranchCash &&
      fetchStatus === API_STATUS.IDLE &&
      !error);

  const runningDenominations =
    activeBranchCash?.denominationBalance?.runningDenominations || [];
  const frozenDenominations =
    activeBranchCash?.denominationBalance?.frozenDenominations ||
    activeBranchCash?.balance?.frozenDenominations ||
    [];

  const runningTotal = sumDenoms(runningDenominations);
  const frozenTotal = sumDenoms(frozenDenominations);

  const isInitialized = Boolean(
    activeBranchCash &&
      (activeBranchCash.isInitialized === true ||
        runningTotal > 0 ||
        frozenTotal > 0 ||
        (activeBranchCash.createdAt && !activeBranchCash.isUninitialized))
  );

  const hasError = Boolean(error) && fetchStatus === API_STATUS.ERROR;

  return {
    activeBranchCash,
    isLoading,
    isInitialized,
    hasError,
  };
};

export default deriveBranchCashViewState;

