import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getOpenShift } from "../store/shiftThunk";
import { API_STATUS } from "@/constants";

// Module-level trackers to prevent duplicate concurrent network calls across any components
const inFlightRequests = new Set();
const lastFetchedByBranch = new Map();
const CACHE_TTL_MS = 6000; // 6 seconds TTL

export const useActiveShift = (branchId) => {
  const dispatch = useDispatch();
  const { activeShift, getOpenShiftStatus, error } = useSelector((state) => state.shift);
  const branchIdStr = branchId ? String(branchId) : null;

  const refetch = useCallback(() => {
    if (!branchIdStr) return;
    inFlightRequests.delete(branchIdStr);
    lastFetchedByBranch.delete(branchIdStr);
    inFlightRequests.add(branchIdStr);
    lastFetchedByBranch.set(branchIdStr, Date.now());
    return dispatch(getOpenShift({ branchId: branchIdStr })).finally(() => {
      inFlightRequests.delete(branchIdStr);
    });
  }, [branchIdStr, dispatch]);

  useEffect(() => {
    if (!branchIdStr) return;

    // Check if current activeShift in Redux already belongs to this branch
    const activeShiftBranchId = activeShift?.branchId?._id
      ? String(activeShift.branchId._id)
      : activeShift?.branchId
      ? String(activeShift.branchId)
      : null;

    const isAlreadyLoaded =
      Boolean(activeShift) &&
      activeShiftBranchId === branchIdStr &&
      getOpenShiftStatus === API_STATUS.SUCCESS;

    const lastFetchedAt = lastFetchedByBranch.get(branchIdStr) || 0;
    const isFresh = (Date.now() - lastFetchedAt) < CACHE_TTL_MS;

    // Don't fire if:
    // 1. A request for this branch is currently in-flight
    // 2. getOpenShiftStatus is currently LOADING
    // 3. Shift is already successfully loaded for this branch AND fetched recently (< 6s)
    if (
      inFlightRequests.has(branchIdStr) ||
      getOpenShiftStatus === API_STATUS.LOADING ||
      (isAlreadyLoaded && isFresh)
    ) {
      return;
    }

    inFlightRequests.add(branchIdStr);
    lastFetchedByBranch.set(branchIdStr, Date.now());

    dispatch(getOpenShift({ branchId: branchIdStr })).finally(() => {
      inFlightRequests.delete(branchIdStr);
    });
  }, [branchIdStr, dispatch, getOpenShiftStatus, activeShift]);

  return { activeShift, status: getOpenShiftStatus, error, refetch };
};

export default useActiveShift;
