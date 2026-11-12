// scripts/testBranchCashViewState.mjs
/* global console */
import assert from "node:assert/strict";
import { API_STATUS } from "../src/constants/statuses.js";
import { deriveBranchCashViewState } from "../src/features/finance/treasury/cash-management/branch-cash/utils/branchCashViewState.js";

const run = () => {
  // 1. Uninitialized branch (404 returns null -> fetchStatus === API_STATUS.SUCCESS)
  const uninitState = deriveBranchCashViewState({
    branchId: "branch-1",
    currentBranchCash: null,
    fetchStatus: API_STATUS.SUCCESS,
    error: null,
  });
  assert.equal(uninitState.isLoading, false);
  assert.equal(uninitState.isInitialized, false);
  assert.equal(uninitState.activeBranchCash, null);

  // 2. Initial loading state (IDLE or LOADING before response)
  const loadingState = deriveBranchCashViewState({
    branchId: "branch-1",
    currentBranchCash: null,
    fetchStatus: API_STATUS.LOADING,
    error: null,
  });
  assert.equal(loadingState.isLoading, true);

  const idleWithBranch = deriveBranchCashViewState({
    branchId: "branch-1",
    currentBranchCash: null,
    fetchStatus: API_STATUS.IDLE,
    error: null,
  });
  assert.equal(idleWithBranch.isLoading, true);

  // 3. No active branch selected yet should NOT spin indefinitely
  const noBranch = deriveBranchCashViewState({
    branchId: null,
    currentBranchCash: null,
    fetchStatus: API_STATUS.IDLE,
    error: null,
  });
  assert.equal(noBranch.isLoading, false);

  // 4. Zero-initialized branch cash (runningTotal = 0, frozenTotal = 0)
  const zeroInitialized = deriveBranchCashViewState({
    branchId: "branch-1",
    currentBranchCash: {
      branchId: "branch-1",
      isInitialized: true,
      runningCash: 0,
      frozenCash: 0,
      denominationBalance: { runningDenominations: [], frozenDenominations: [] },
      createdAt: "2026-11-10T10:00:00Z",
    },
    fetchStatus: API_STATUS.SUCCESS,
    error: null,
  });
  assert.equal(zeroInitialized.isLoading, false);
  assert.equal(zeroInitialized.isInitialized, true);
  assert.ok(zeroInitialized.activeBranchCash);

  // 5. Switching from initialized Branch 1 to Branch 2 while Branch 2 is loading
  const switchingBranch = deriveBranchCashViewState({
    branchId: "branch-2",
    currentBranchCash: {
      branchId: "branch-1",
      isInitialized: true,
      runningCash: 5000,
    },
    fetchStatus: API_STATUS.LOADING,
    error: null,
  });
  assert.equal(switchingBranch.isLoading, true);
  assert.equal(switchingBranch.activeBranchCash, null);

  // 6. API error state stops loading
  const errorState = deriveBranchCashViewState({
    branchId: "branch-1",
    currentBranchCash: null,
    fetchStatus: API_STATUS.ERROR,
    error: "Server unavailable",
  });
  assert.equal(errorState.isLoading, false);
  assert.equal(errorState.hasError, true);

  console.log("All branchCashViewState tests passed!");
};

run();

