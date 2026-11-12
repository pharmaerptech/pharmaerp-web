import { createAsyncThunk } from "@reduxjs/toolkit";

import authService from "../services/authService";

import { TOKEN_KEY, USER_STORAGE_KEY } from "@/constants";
import { getErrorMessage, storage } from "@/utils";
import { clearAllHeldBillsStorage } from "@/features/sales/services/holdBillStorage";

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.register(payload);
      const data = response.data?.data;

      if (data?.token) {
        storage.set(TOKEN_KEY, data.token);
      }

      if (data?.user) {
        storage.set(USER_STORAGE_KEY, data.user);
      }

      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.login(payload);
      const data = response.data?.data;

      if (data?.token) {
        storage.set(TOKEN_KEY, data.token);
      }

      if (data?.user) {
        storage.set(USER_STORAGE_KEY, data.user);
      }

      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();

      storage.remove(TOKEN_KEY);
      storage.remove(USER_STORAGE_KEY);
      clearAllHeldBillsStorage();

      return true;
    } catch (error) {
      storage.remove(TOKEN_KEY);
      storage.remove(USER_STORAGE_KEY);
      clearAllHeldBillsStorage();

      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const sendEmailOtp = createAsyncThunk(
  "auth/sendEmailOtp",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.sendEmailOtp(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const verifyEmailOtp = createAsyncThunk(
  "auth/verifyEmailOtp",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authService.verifyEmailOtp(payload);
      const data = response.data?.data;

      if (data?.user) {
        storage.set(USER_STORAGE_KEY, data.user);
      }

      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);
