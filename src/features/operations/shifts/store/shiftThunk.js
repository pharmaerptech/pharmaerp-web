import { createAsyncThunk } from "@reduxjs/toolkit";
import shiftService from "../services/shiftService";
import { getErrorMessage } from "@/utils";
import { clearBranchHeldBills } from "@/features/sales/services/holdBillStorage";

export const createShift = createAsyncThunk(
  "shift/createShift",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await shiftService.createShift(payload);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const listShifts = createAsyncThunk(
  "shift/listShifts",
  async (params, { rejectWithValue }) => {
    try {
      const response = await shiftService.listShifts(params);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const getOpenShift = createAsyncThunk(
  "shift/getOpenShift",
  async (params, { rejectWithValue }) => {
    try {
      const response = await shiftService.getOpenShift(params);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateShiftStatus = createAsyncThunk(
  "shift/updateShiftStatus",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await shiftService.updateShiftStatus(id, payload);
      const updated = response.data?.data;
      if (payload?.status === "closed" && updated?.branchId) {
        clearBranchHeldBills(
          updated.workspaceId,
          updated.companyId,
          updated.branchId
        );
      }
      return updated;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const cancelShift = createAsyncThunk(
  "shift/cancelShift",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await shiftService.cancelShift(id, payload);
      const updated = response.data?.data;
      if (updated?.branchId) {
        clearBranchHeldBills(
          updated.workspaceId,
          updated.companyId,
          updated.branchId
        );
      }
      return updated;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);
