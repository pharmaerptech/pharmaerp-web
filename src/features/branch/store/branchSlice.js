import { createSlice } from "@reduxjs/toolkit";
import { API_STATUS } from "@/constants";
import {
  createBranch,
  getCompanyBranches,
  getWorkspaceBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  getBranchEmployees,
} from "./branchThunk";

const initialState = {
  branches: [],
  workspaceBranches: [],
  currentBranch: null,
  managedBranch: null,
  branchEmployees: {},

  status: API_STATUS.IDLE,
  error: null,
  message: null,

  createBranchStatus: API_STATUS.IDLE,
  getCompanyBranchesStatus: API_STATUS.IDLE,
  getWorkspaceBranchesStatus: API_STATUS.IDLE,
  getBranchStatus: API_STATUS.IDLE,
  updateBranchStatus: API_STATUS.IDLE,
  deleteBranchStatus: API_STATUS.IDLE,
  getBranchEmployeesStatus: {},
};

const branchSlice = createSlice({
  name: "branch",
  initialState,
  reducers: {
    clearBranchError(state) {
      state.error = null;
    },
    clearBranchMessage(state) {
      state.message = null;
    },
    setCurrentBranch(state, action) {
      state.currentBranch = action.payload || null;
    },
    clearCurrentBranch(state) {
      state.currentBranch = null;
    },
    clearBranches(state) {
      state.branches = [];
      state.workspaceBranches = [];
      state.branchEmployees = {};
    },
    clearManagedBranch(state) {
      state.managedBranch = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // CREATE BRANCH
      .addCase(createBranch.pending, (state) => {
        state.createBranchStatus = API_STATUS.LOADING;
        state.error = null;
        state.message = null;
      })
      .addCase(createBranch.fulfilled, (state, action) => {
        state.createBranchStatus = API_STATUS.SUCCESS;
        if (action.payload) {
          state.branches.unshift(action.payload);
          state.workspaceBranches.unshift(action.payload);
          state.currentBranch = action.payload;
        }
        state.message = "Branch created successfully";
      })
      .addCase(createBranch.rejected, (state, action) => {
        state.createBranchStatus = API_STATUS.ERROR;
        state.error = action.payload || "Failed to create branch";
      })

      // GET COMPANY BRANCHES
      .addCase(getCompanyBranches.pending, (state) => {
        state.getCompanyBranchesStatus = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(getCompanyBranches.fulfilled, (state, action) => {
        state.getCompanyBranchesStatus = API_STATUS.SUCCESS;
        state.branches = Array.isArray(action.payload) ? action.payload : [];
        state.currentBranch = state.currentBranch || null;
      })
      .addCase(getCompanyBranches.rejected, (state, action) => {
        state.getCompanyBranchesStatus = API_STATUS.ERROR;
        state.error = action.payload || "Failed to fetch branches";
      })

      // GET WORKSPACE BRANCHES
      .addCase(getWorkspaceBranches.pending, (state) => {
        state.getWorkspaceBranchesStatus = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(getWorkspaceBranches.fulfilled, (state, action) => {
        state.getWorkspaceBranchesStatus = API_STATUS.SUCCESS;
        const list = Array.isArray(action.payload) ? action.payload : [];
        state.workspaceBranches = list;
        state.branches = list;
        state.currentBranch = state.currentBranch || null;
      })
      .addCase(getWorkspaceBranches.rejected, (state, action) => {
        state.getWorkspaceBranchesStatus = API_STATUS.ERROR;
        state.error = action.payload || "Failed to fetch workspace branches";
      })

      // GET BRANCH BY ID
      .addCase(getBranchById.pending, (state) => {
        state.getBranchStatus = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(getBranchById.fulfilled, (state, action) => {
        state.getBranchStatus = API_STATUS.SUCCESS;
        state.managedBranch = action.payload || null;
      })
      .addCase(getBranchById.rejected, (state, action) => {
        state.getBranchStatus = API_STATUS.ERROR;
        state.error = action.payload || "Failed to fetch branch";
      })

      // UPDATE BRANCH
      .addCase(updateBranch.pending, (state) => {
        state.updateBranchStatus = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(updateBranch.fulfilled, (state, action) => {
        state.updateBranchStatus = API_STATUS.SUCCESS;
        const updatedBranch = action.payload;

        state.branches = state.branches.map((branch) =>
          branch._id === updatedBranch?._id ? updatedBranch : branch,
        );
        state.workspaceBranches = state.workspaceBranches.map((branch) =>
          branch._id === updatedBranch?._id ? updatedBranch : branch,
        );
        state.managedBranch = updatedBranch || state.managedBranch;

        if (state.currentBranch?._id === updatedBranch?._id && updatedBranch) {
          state.currentBranch = updatedBranch;
        }
        state.message = "Branch updated successfully";
      })
      .addCase(updateBranch.rejected, (state, action) => {
        state.updateBranchStatus = API_STATUS.ERROR;
        state.error = action.payload || "Failed to update branch";
      })

      // DELETE BRANCH
      .addCase(deleteBranch.pending, (state) => {
        state.deleteBranchStatus = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(deleteBranch.fulfilled, (state, action) => {
        state.deleteBranchStatus = API_STATUS.SUCCESS;
        state.branches = state.branches.filter(
          (branch) => branch?._id !== action.meta.arg,
        );
        state.workspaceBranches = state.workspaceBranches.filter(
          (branch) => branch?._id !== action.meta.arg,
        );
        if (state.managedBranch?._id === action.meta.arg) {
          state.managedBranch = null;
        }
        if (state.currentBranch?._id === action.meta.arg) {
          state.currentBranch = null;
        }
        state.message =
          action.payload?.message || "Branch deleted successfully";
      })
      .addCase(deleteBranch.rejected, (state, action) => {
        state.deleteBranchStatus = API_STATUS.ERROR;
        state.error = action.payload || "Failed to delete branch";
      })

      // GET BRANCH EMPLOYEES
      .addCase(getBranchEmployees.pending, (state, action) => {
        const branchId = action.meta.arg;
        state.getBranchEmployeesStatus[branchId] = API_STATUS.LOADING;
      })
      .addCase(getBranchEmployees.fulfilled, (state, action) => {
        const { branchId, employees } = action.payload || {};
        if (branchId) {
          state.getBranchEmployeesStatus[branchId] = API_STATUS.SUCCESS;
          state.branchEmployees[branchId] = employees || [];
        }
      })
      .addCase(getBranchEmployees.rejected, (state, action) => {
        const branchId = action.meta.arg;
        state.getBranchEmployeesStatus[branchId] = API_STATUS.ERROR;
      });
  },
});

export const {
  clearBranchError,
  clearBranchMessage,
  setCurrentBranch,
  clearCurrentBranch,
  clearBranches,
  clearManagedBranch,
} = branchSlice.actions;

export default branchSlice.reducer;
