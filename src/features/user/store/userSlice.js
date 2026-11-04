import { createSlice } from "@reduxjs/toolkit";

import { API_STATUS } from "@/constants";

import {
  getProfile,
  updateProfile,
  updateAvatar,
  deleteAvatar,
  getActiveContext,
  updateActiveContext,
  deactivateAccount,
} from "./userThunk";

const getEmptyActiveContext = () => ({
  workspaceId: null,
  companyId: null,
  branchId: null,
  updatedAt: null,
});

const normalizeActiveContext = (context) => ({
  workspaceId: context?.workspaceId || null,
  companyId: null,
  branchId: null,
  updatedAt: context?.updatedAt || null,
});

const getUserFromPayload = (payload) => {
  return payload?.user || payload || null;
};

const getActiveContextFromUser = (user) => {
  return normalizeActiveContext(user?.activeContext);
};

// CLEANED: Removed initial state loading from USER_STORAGE_KEY
const initialState = {
  user: null,

  activeContext: getEmptyActiveContext(),

  status: API_STATUS.IDLE,
  error: null,
  message: null,

  updateProfileStatus: API_STATUS.IDLE,
  updateAvatarStatus: API_STATUS.IDLE,
  deleteAvatarStatus: API_STATUS.IDLE,

  getActiveContextStatus: API_STATUS.IDLE,
  updateActiveContextStatus: API_STATUS.IDLE,

  deactivateAccountStatus: API_STATUS.IDLE,
};

// CLEANED: Removed storage.set and storage.remove dependencies entirely
const syncUserToState = (state, user) => {
  state.user = user || null;

  if (state.user) {
    state.activeContext = getActiveContextFromUser(state.user);
  } else {
    state.activeContext = getEmptyActiveContext();
  }
};

// CLEANED: Removed active context local storage propagation layers
const syncActiveContextToState = (state, context) => {
  state.activeContext = normalizeActiveContext(context);

  if (state.user) {
    state.user.activeContext = state.activeContext;
  }
};

const userSlice = createSlice({
  name: "user",

  initialState,

  reducers: {
    clearUserError(state) {
      state.error = null;
    },

    clearUserMessage(state) {
      state.message = null;
    },

    setUser(state, action) {
      const user = getUserFromPayload(action.payload);
      syncUserToState(state, user);
    },

    clearUser(state) {
      syncUserToState(state, null);
    },

    setActiveContext(state, action) {
      syncActiveContextToState(state, action.payload);
    },

    clearActiveContext(state) {
      syncActiveContextToState(state, getEmptyActiveContext());
    },
  },

  extraReducers: (builder) => {
    builder
      // GET PROFILE
      .addCase(getProfile.pending, (state) => {
        state.status = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.status = API_STATUS.SUCCESS;

        const user = getUserFromPayload(action.payload);
        syncUserToState(state, user);

        state.message = "Profile fetched successfully";
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.status = API_STATUS.ERROR;
        state.error = action.payload || "Failed to fetch profile";
      })

      // UPDATE PROFILE
      .addCase(updateProfile.pending, (state) => {
        state.updateProfileStatus = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateProfileStatus = API_STATUS.SUCCESS;

        const user = getUserFromPayload(action.payload);
        syncUserToState(state, user || state.user);

        state.message = "Profile updated successfully";
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateProfileStatus = API_STATUS.ERROR;
        state.error = action.payload || "Profile update failed";
      })

      // UPDATE AVATAR
      .addCase(updateAvatar.pending, (state) => {
        state.updateAvatarStatus = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(updateAvatar.fulfilled, (state, action) => {
        state.updateAvatarStatus = API_STATUS.SUCCESS;

        const user = getUserFromPayload(action.payload);
        syncUserToState(state, user || state.user);

        state.message = "Avatar updated successfully";
      })
      .addCase(updateAvatar.rejected, (state, action) => {
        state.updateAvatarStatus = API_STATUS.ERROR;
        state.error = action.payload || "Avatar update failed";
      })

      // DELETE AVATAR
      .addCase(deleteAvatar.pending, (state) => {
        state.deleteAvatarStatus = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(deleteAvatar.fulfilled, (state, action) => {
        state.deleteAvatarStatus = API_STATUS.SUCCESS;

        const user = getUserFromPayload(action.payload);
        syncUserToState(state, user || state.user);

        state.message = "Avatar deleted successfully";
      })
      .addCase(deleteAvatar.rejected, (state, action) => {
        state.deleteAvatarStatus = API_STATUS.ERROR;
        state.error = action.payload || "Avatar delete failed";
      })

      // GET ACTIVE CONTEXT
      .addCase(getActiveContext.pending, (state) => {
        state.getActiveContextStatus = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(getActiveContext.fulfilled, (state, action) => {
        state.getActiveContextStatus = API_STATUS.SUCCESS;

        syncActiveContextToState(state, action.payload);

        state.message = "Active context fetched successfully";
      })
      .addCase(getActiveContext.rejected, (state, action) => {
        state.getActiveContextStatus = API_STATUS.ERROR;
        state.error = action.payload || "Failed to fetch active context";
      })

      // UPDATE ACTIVE CONTEXT
      .addCase(updateActiveContext.pending, (state) => {
        state.updateActiveContextStatus = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(updateActiveContext.fulfilled, (state, action) => {
        state.updateActiveContextStatus = API_STATUS.SUCCESS;

        const user = getUserFromPayload(action.payload);
        syncUserToState(state, user || state.user);

        state.message = "Active context updated successfully";
      })
      .addCase(updateActiveContext.rejected, (state, action) => {
        state.updateActiveContextStatus = API_STATUS.ERROR;
        state.error = action.payload || "Active context update failed";
      })

      // DEACTIVATE ACCOUNT
      .addCase(deactivateAccount.pending, (state) => {
        state.deactivateAccountStatus = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(deactivateAccount.fulfilled, (state, action) => {
        state.deactivateAccountStatus = API_STATUS.SUCCESS;
        state.message =
          action.payload?.message || "Account deactivated successfully";

        syncUserToState(state, null);
      })
      .addCase(deactivateAccount.rejected, (state, action) => {
        state.deactivateAccountStatus = API_STATUS.ERROR;
        state.error = action.payload || "Account deactivation failed";
      });
  },
});

export const {
  clearUserError,
  clearUserMessage,
  setUser,
  clearUser,
  setActiveContext,
  clearActiveContext,
} = userSlice.actions;

export default userSlice.reducer;
