import { createAsyncThunk } from "@reduxjs/toolkit";

import branchService from "../services/branchService";

import { getErrorMessage } from "@/utils";
import { invalidateSetupStatus } from "@/features/workspace/store/workspaceSlice";

export const createBranch = createAsyncThunk(
  "branch/createBranch",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await branchService.createBranch(payload);
      dispatch(invalidateSetupStatus()); // bump → Setup Center refetches
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const getCompanyBranches = createAsyncThunk(
  "branch/getCompanyBranches",
  async (targetCompanyId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const companyId =
        targetCompanyId ||
        state.company?.currentCompany?._id ||
        null;

      const response = await branchService.getCompanyBranches(companyId);

      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const getWorkspaceBranches = createAsyncThunk(
  "branch/getWorkspaceBranches",
  async (_, { rejectWithValue }) => {
    try {
      const response = await branchService.getWorkspaceBranches();

      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const getBranchById = createAsyncThunk(
  "branch/getBranchById",
  async (branchId, { rejectWithValue }) => {
    try {
      const response = await branchService.getBranchById(branchId);

      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateBranch = createAsyncThunk(
  "branch/updateBranch",
  async ({ branchId, payload }, { rejectWithValue }) => {
    try {
      const response = await branchService.updateBranch(branchId, payload);

      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const deleteBranch = createAsyncThunk(
  "branch/deleteBranch",
  async (branchId, { rejectWithValue }) => {
    try {
      const response = await branchService.deleteBranch(branchId);

      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const getBranchEmployees = createAsyncThunk(
  "branch/getBranchEmployees",
  async (branchId, { rejectWithValue }) => {
    try {
      const response = await branchService.getBranchEmployees(branchId);
      const employees = response.data?.data || response.data || response || [];
      return { branchId, employees: Array.isArray(employees) ? employees : [] };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);
