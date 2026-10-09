import { createSlice } from "@reduxjs/toolkit";

import { API_STATUS } from "@/constants";

import {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
} from "./accountThunk";

const initialState = {
  accounts: [],
  totalAccounts: 0,
  currentAccount: null,
  managedAccount: null,

  status: API_STATUS.IDLE,
  error: null,
  message: null,

  createAccountStatus: API_STATUS.IDLE,
  getAccountsStatus: API_STATUS.IDLE,
  getAccountStatus: API_STATUS.IDLE,
  updateAccountStatus: API_STATUS.IDLE,
  deleteAccountStatus: API_STATUS.IDLE,
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

const accountSlice = createSlice({
  name: "account",
  initialState,

  reducers: {
    clearAccountError(state) {
      state.error = null;
    },

    clearAccountMessage(state) {
      state.message = null;
    },

    setCurrentAccount(state, action) {
      state.currentAccount = action.payload || null;
    },

    clearCurrentAccount(state) {
      state.currentAccount = null;
    },

    clearAccounts(state) {
      state.accounts = [];
    },

    clearManagedAccount(state) {
      state.managedAccount = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // CREATE ACCOUNT
      .addCase(createAccount.pending, (state) => {
        state.createAccountStatus = API_STATUS.LOADING;
        state.error = null;
        state.message = null;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.createAccountStatus = API_STATUS.SUCCESS;

        state.currentAccount = action.payload || null;

        if (action.payload) {
          state.accounts.unshift(action.payload);
        }

        state.message = "Account created successfully";
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.createAccountStatus = API_STATUS.ERROR;
        state.error = action.payload || "Account creation failed";
      })

      // GET ACCOUNTS
      .addCase(getAccounts.pending, (state) => {
        state.getAccountsStatus = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(getAccounts.fulfilled, (state, action) => {
        state.getAccountsStatus = API_STATUS.SUCCESS;

        state.accounts = action.payload?.accounts || [];
        state.totalAccounts = action.payload?.total ?? (action.payload?.accounts?.length || 0);

        state.message = "Accounts fetched successfully";
      })
      .addCase(getAccounts.rejected, (state, action) => {
        state.getAccountsStatus = API_STATUS.ERROR;
        state.error = action.payload || "Failed to fetch accounts";
      })

      // GET ACCOUNT BY ID
      .addCase(getAccountById.pending, setPending)
      .addCase(getAccountById.fulfilled, (state, action) => {
        state.status = API_STATUS.SUCCESS;
        state.getAccountStatus = API_STATUS.SUCCESS;

        state.managedAccount = action.payload || null;

        state.message = "Account fetched successfully";
      })
      .addCase(getAccountById.rejected, (state, action) => {
        setRejected(state, action);
        state.getAccountStatus = API_STATUS.ERROR;
      })

      // UPDATE ACCOUNT
      .addCase(updateAccount.pending, (state) => {
        state.updateAccountStatus = API_STATUS.LOADING;
        state.error = null;
        state.message = null;
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        state.updateAccountStatus = API_STATUS.SUCCESS;

        state.accounts = state.accounts.map((account) =>
          account?._id === action.payload?._id ? action.payload : account,
        );

        state.managedAccount = action.payload || state.managedAccount;

        if (
          state.currentAccount?._id === action.payload?._id &&
          action.payload
        ) {
          state.currentAccount = action.payload;
        }

        state.message = "Account updated successfully";
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.updateAccountStatus = API_STATUS.ERROR;
        state.error = action.payload || "Account update failed";
      })

      // DELETE ACCOUNT
      .addCase(deleteAccount.pending, (state) => {
        state.deleteAccountStatus = API_STATUS.LOADING;
        state.error = null;
        state.message = null;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.deleteAccountStatus = API_STATUS.SUCCESS;

        state.accounts = state.accounts.filter(
          (account) => account?._id !== action.meta.arg,
        );

        if (state.managedAccount?._id === action.meta.arg) {
          state.managedAccount = null;
        }

        if (state.currentAccount?._id === action.meta.arg) {
          state.currentAccount = null;
        }

        state.message = "Account deleted successfully";
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.deleteAccountStatus = API_STATUS.ERROR;
        state.error = action.payload || "Account delete failed";
      });
  },
});

export const {
  clearAccountError,
  clearAccountMessage,
  setCurrentAccount,
  clearCurrentAccount,
  clearAccounts,
  clearManagedAccount,
} = accountSlice.actions;

export default accountSlice.reducer;
