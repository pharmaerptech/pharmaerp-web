import { createSlice } from "@reduxjs/toolkit";

import { API_STATUS, TOKEN_KEY, USER_STORAGE_KEY } from "@/constants";
import { storage } from "@/utils";
import { clearAllHeldBillsStorage } from "@/features/sales/services/holdBillStorage";

import {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
  sendEmailOtp,
  verifyEmailOtp,
} from "./authThunk";

const initialState = {
  user: storage.get(USER_STORAGE_KEY),
  token: storage.get(TOKEN_KEY),
  workspace: null,
  subscription: null,
  signupData: {
    fullName: "",
    email: "",
    phone: "",
    password: "",
    workspaceName: "",
    workspaceType: "pharmacy",
    planId: null,
  },

  isAuthenticated: Boolean(storage.get(TOKEN_KEY)),

  status: API_STATUS.IDLE,
  error: null,

  forgotPasswordStatus: API_STATUS.IDLE,
  resetPasswordStatus: API_STATUS.IDLE,
  changePasswordStatus: API_STATUS.IDLE,
  sendEmailOtpStatus: API_STATUS.IDLE,
  verifyEmailOtpStatus: API_STATUS.IDLE,

  message: null,
};

const setPending = (state) => {
  state.status = API_STATUS.LOADING;
  state.error = null;
  state.message = null;
};

const setRejected = (state, action) => {
  state.status = API_STATUS.ERROR;
  state.error = action.payload || "Something went wrong";
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    clearAuthError(state) {
      state.error = null;
    },

    clearAuthMessage(state) {
      state.message = null;
    },

    setCredentials(state, action) {
      state.user = action.payload?.user || null;
      state.token = action.payload?.token || null;
      state.isAuthenticated = Boolean(action.payload?.token);

      if (state.token) {
        storage.set(TOKEN_KEY, state.token);
      }

      if (state.user) {
        storage.set(USER_STORAGE_KEY, state.user);
      }
    },

    clearCredentials(state) {
      state.user = null;
      state.token = null;
      state.workspace = null;
      state.subscription = null;
      state.isAuthenticated = false;

      storage.remove(TOKEN_KEY);
      storage.remove(USER_STORAGE_KEY);
      clearAllHeldBillsStorage();
      try {
        localStorage.removeItem("pahuch_work_mode");
        localStorage.removeItem("pahuch_work_mode_selected");
      } catch {}
    },

    setSignupData(state, action) {
      state.signupData = {
        ...state.signupData,
        ...action.payload,
      };
    },

    clearSignupData(state) {
      state.signupData = {
        fullName: "",
        email: "",
        phone: "",
        password: "",
        workspaceName: "",
        workspaceType: "pharmacy",
        planId: null,
      };
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, setPending)
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = API_STATUS.SUCCESS;
        state.user = action.payload?.user || null;
        state.token = action.payload?.token || null;
        state.workspace = action.payload?.workspace || null;
        state.subscription = action.payload?.subscription || null;
        state.isAuthenticated = Boolean(action.payload?.token);
        state.message = "Registration successful. Your workspace and free trial are ready!";
        state.signupData = {
          fullName: "",
          email: "",
          phone: "",
          password: "",
          workspaceName: "",
          workspaceType: "pharmacy",
          planId: null,
        };
      })
      .addCase(registerUser.rejected, setRejected)

      .addCase(loginUser.pending, setPending)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = API_STATUS.SUCCESS;
        state.user = action.payload?.user || null;
        state.token = action.payload?.token || null;
        state.isAuthenticated = Boolean(action.payload?.token);
        state.message = "Login successful";
      })
      .addCase(loginUser.rejected, setRejected)

      .addCase(logoutUser.pending, (state) => {
        state.status = API_STATUS.LOADING;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = API_STATUS.SUCCESS;
        state.user = null;
        state.token = null;
        state.workspace = null;
        state.subscription = null;
        state.isAuthenticated = false;
        state.message = "Logout successful";
        clearAllHeldBillsStorage();
        try {
          localStorage.removeItem("pahuch_work_mode");
          localStorage.removeItem("pahuch_work_mode_selected");
        } catch {}
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.status = API_STATUS.ERROR;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload || "Logout failed";
        clearAllHeldBillsStorage();
      })

      .addCase(forgotPassword.pending, (state) => {
        state.forgotPasswordStatus = API_STATUS.LOADING;
        state.error = null;
        state.message = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.forgotPasswordStatus = API_STATUS.SUCCESS;
        state.message =
          action.payload?.message ||
          "If account exists, reset link has been sent";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotPasswordStatus = API_STATUS.ERROR;
        state.error = action.payload || "Forgot password failed";
      })

      .addCase(resetPassword.pending, (state) => {
        state.resetPasswordStatus = API_STATUS.LOADING;
        state.error = null;
        state.message = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.resetPasswordStatus = API_STATUS.SUCCESS;
        state.message = action.payload?.message || "Password reset successful";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetPasswordStatus = API_STATUS.ERROR;
        state.error = action.payload || "Password reset failed";
      })

      .addCase(changePassword.pending, (state) => {
        state.changePasswordStatus = API_STATUS.LOADING;
        state.error = null;
        state.message = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.changePasswordStatus = API_STATUS.SUCCESS;
        state.message =
          action.payload?.message || "Password changed successfully";
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.changePasswordStatus = API_STATUS.ERROR;
        state.error = action.payload || "Password change failed";
      })

      .addCase(sendEmailOtp.pending, (state) => {
        state.sendEmailOtpStatus = API_STATUS.LOADING;
        state.error = null;
        state.message = null;
      })
      .addCase(sendEmailOtp.fulfilled, (state, action) => {
        state.sendEmailOtpStatus = API_STATUS.SUCCESS;
        state.message = action.payload?.message || "OTP sent successfully";
      })
      .addCase(sendEmailOtp.rejected, (state, action) => {
        state.sendEmailOtpStatus = API_STATUS.ERROR;
        state.error = action.payload || "OTP send failed";
      })

      .addCase(verifyEmailOtp.pending, (state) => {
        state.verifyEmailOtpStatus = API_STATUS.LOADING;
        state.error = null;
        state.message = null;
      })
      .addCase(verifyEmailOtp.fulfilled, (state, action) => {
        state.verifyEmailOtpStatus = API_STATUS.SUCCESS;
        state.user = action.payload?.user || state.user;

        if (action.payload?.user) {
          storage.set(USER_STORAGE_KEY, action.payload.user);
        }

        state.message = "Email verified successfully";
      })
      .addCase(verifyEmailOtp.rejected, (state, action) => {
        state.verifyEmailOtpStatus = API_STATUS.ERROR;
        state.error = action.payload || "Email verification failed";
      });
  },
});

export const {
  clearAuthError,
  clearAuthMessage,
  setCredentials,
  clearCredentials,
  setSignupData,
  clearSignupData,
} = authSlice.actions;

export default authSlice.reducer;
