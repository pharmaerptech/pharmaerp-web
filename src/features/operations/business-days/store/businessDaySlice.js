import { createSlice } from "@reduxjs/toolkit";
import { API_STATUS } from "@/constants";
import {
  openBusinessDay,
  listBusinessDays,
  getOpenBusinessDay,
  getSuggestedBusinessDate,
  getBusinessDayById,
  initiateBusinessDayClose,
  abortBusinessDayClose,
  closeBusinessDay,
  cancelBusinessDay,
} from "./businessDayThunk";

const initialState = {
  businessDays: [],
  currentBusinessDay: null,
  /** The currently ACTIVE (open or closing) Business Day for this branch. Null if day is closed or not fetched yet. */
  openBusinessDay: null,
  /** Suggested date for next Business Day opening (today or tomorrow). */
  suggestedBusinessDate: null,

  status: API_STATUS.IDLE,
  error: null,
  message: null,

  openBusinessDayStatus: API_STATUS.IDLE,
  listBusinessDaysStatus: API_STATUS.IDLE,
  getOpenBusinessDayStatus: API_STATUS.IDLE,
  getSuggestedDateStatus: API_STATUS.IDLE,
  getBusinessDayStatus: API_STATUS.IDLE,
  initiateBusinessDayCloseStatus: API_STATUS.IDLE,
  abortBusinessDayCloseStatus: API_STATUS.IDLE,
  closeBusinessDayStatus: API_STATUS.IDLE,
  cancelBusinessDayStatus: API_STATUS.IDLE,
};

const businessDaySlice = createSlice({
  name: "businessDay",
  initialState,
  reducers: {
    clearBusinessDayError(state) {
      state.error = null;
    },
    clearBusinessDayMessage(state) {
      state.message = null;
    },
    resetOpenBusinessDayStatus(state) {
      state.openBusinessDayStatus = API_STATUS.IDLE;
    },
    resetCloseBusinessDayStatus(state) {
      state.closeBusinessDayStatus = API_STATUS.IDLE;
    },
  },
  extraReducers: (builder) => {
    builder
      // OPEN (create new Business Day)
      .addCase(openBusinessDay.pending, (state) => {
        state.openBusinessDayStatus = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(openBusinessDay.fulfilled, (state, action) => {
        state.openBusinessDayStatus = API_STATUS.SUCCESS;
        if (action.payload) {
          state.businessDays.unshift(action.payload);
          state.openBusinessDay = action.payload;
        }
        state.message = "Business Day opened successfully";
      })
      .addCase(openBusinessDay.rejected, (state, action) => {
        state.openBusinessDayStatus = API_STATUS.ERROR;
        state.error = action.payload || "Failed to open Business Day";
      })

      // LIST
      .addCase(listBusinessDays.pending, (state) => {
        state.listBusinessDaysStatus = API_STATUS.LOADING;
      })
      .addCase(listBusinessDays.fulfilled, (state, action) => {
        state.listBusinessDaysStatus = API_STATUS.SUCCESS;
        state.businessDays = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(listBusinessDays.rejected, (state, action) => {
        state.listBusinessDaysStatus = API_STATUS.ERROR;
        state.error = action.payload;
      })

      // GET OPEN
      .addCase(getOpenBusinessDay.pending, (state) => {
        state.getOpenBusinessDayStatus = API_STATUS.LOADING;
      })
      .addCase(getOpenBusinessDay.fulfilled, (state, action) => {
        state.getOpenBusinessDayStatus = API_STATUS.SUCCESS;
        state.openBusinessDay = action.payload; // null if no day is open
      })
      .addCase(getOpenBusinessDay.rejected, (state, action) => {
        state.getOpenBusinessDayStatus = API_STATUS.ERROR;
        state.openBusinessDay = null;
        state.error = action.payload;
      })

      // GET SUGGESTED DATE
      .addCase(getSuggestedBusinessDate.pending, (state) => {
        state.getSuggestedDateStatus = API_STATUS.LOADING;
      })
      .addCase(getSuggestedBusinessDate.fulfilled, (state, action) => {
        state.getSuggestedDateStatus = API_STATUS.SUCCESS;
        state.suggestedBusinessDate = action.payload;
      })
      .addCase(getSuggestedBusinessDate.rejected, (state, action) => {
        state.getSuggestedDateStatus = API_STATUS.ERROR;
        state.error = action.payload;
      })

      // GET BY ID
      .addCase(getBusinessDayById.pending, (state) => {
        state.getBusinessDayStatus = API_STATUS.LOADING;
      })
      .addCase(getBusinessDayById.fulfilled, (state, action) => {
        state.getBusinessDayStatus = API_STATUS.SUCCESS;
        state.currentBusinessDay = action.payload;
      })
      .addCase(getBusinessDayById.rejected, (state, action) => {
        state.getBusinessDayStatus = API_STATUS.ERROR;
        state.error = action.payload;
      })

      // INITIATE CLOSE
      .addCase(initiateBusinessDayClose.pending, (state) => {
        state.initiateBusinessDayCloseStatus = API_STATUS.LOADING;
      })
      .addCase(initiateBusinessDayClose.fulfilled, (state, action) => {
        state.initiateBusinessDayCloseStatus = API_STATUS.SUCCESS;
        const updated = action.payload;
        if (updated) {
          state.businessDays = state.businessDays.map((d) =>
            d._id === updated._id ? updated : d
          );
          state.openBusinessDay = updated;
        }
      })
      .addCase(initiateBusinessDayClose.rejected, (state, action) => {
        state.initiateBusinessDayCloseStatus = API_STATUS.ERROR;
        state.error = action.payload;
      })

      // ABORT CLOSE
      .addCase(abortBusinessDayClose.pending, (state) => {
        state.abortBusinessDayCloseStatus = API_STATUS.LOADING;
      })
      .addCase(abortBusinessDayClose.fulfilled, (state, action) => {
        state.abortBusinessDayCloseStatus = API_STATUS.SUCCESS;
        const updated = action.payload;
        if (updated) {
          state.businessDays = state.businessDays.map((d) =>
            d._id === updated._id ? updated : d
          );
          state.openBusinessDay = updated;
        }
      })
      .addCase(abortBusinessDayClose.rejected, (state, action) => {
        state.abortBusinessDayCloseStatus = API_STATUS.ERROR;
        state.error = action.payload;
      })

      // CLOSE
      .addCase(closeBusinessDay.pending, (state) => {
        state.closeBusinessDayStatus = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(closeBusinessDay.fulfilled, (state, action) => {
        state.closeBusinessDayStatus = API_STATUS.SUCCESS;
        const updated = action.payload;
        if (updated) {
          state.businessDays = state.businessDays.map((d) =>
            d._id === updated._id ? updated : d
          );
          if (state.currentBusinessDay?._id === updated._id) {
            state.currentBusinessDay = updated;
          }
          // Clear open business day since it's now closed
          if (state.openBusinessDay?._id === updated._id) {
            state.openBusinessDay = null;
          }
        }
        state.message = "Business Day closed successfully";
      })
      .addCase(closeBusinessDay.rejected, (state, action) => {
        state.closeBusinessDayStatus = API_STATUS.ERROR;
        state.error = action.payload || "Failed to close Business Day";
      })

      // CANCEL
      .addCase(cancelBusinessDay.pending, (state) => {
        state.cancelBusinessDayStatus = API_STATUS.LOADING;
      })
      .addCase(cancelBusinessDay.fulfilled, (state, action) => {
        state.cancelBusinessDayStatus = API_STATUS.SUCCESS;
        const updated = action.payload;
        if (updated) {
          state.businessDays = state.businessDays.map((d) =>
            d._id === updated._id ? updated : d
          );
          if (state.openBusinessDay?._id === updated._id) {
            state.openBusinessDay = null;
          }
        }
        state.message = "Business Day cancelled";
      })
      .addCase(cancelBusinessDay.rejected, (state, action) => {
        state.cancelBusinessDayStatus = API_STATUS.ERROR;
        state.error = action.payload;
      });
  },
});

export const {
  clearBusinessDayError,
  clearBusinessDayMessage,
  resetOpenBusinessDayStatus,
  resetCloseBusinessDayStatus,
} = businessDaySlice.actions;

export default businessDaySlice.reducer;
