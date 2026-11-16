import { createSlice } from "@reduxjs/toolkit";
import { API_STATUS } from "@/constants";
import {
  createShift,
  listShifts,
  getOpenShift,
  updateShiftStatus,
  initiateShiftClose,
  abortShiftClose,
  cancelShift,
} from "./shiftThunk";

const initialState = {
  shifts: [],
  activeShift: null,
  status: API_STATUS.IDLE,
  error: null,
  message: null,

  createShiftStatus: API_STATUS.IDLE,
  listShiftsStatus: API_STATUS.IDLE,
  getOpenShiftStatus: API_STATUS.IDLE,
  updateShiftStatusStatus: API_STATUS.IDLE,
  initiateShiftCloseStatus: API_STATUS.IDLE,
  abortShiftCloseStatus: API_STATUS.IDLE,
};

const shiftSlice = createSlice({
  name: "shift",
  initialState,
  reducers: {
    clearShiftError(state) {
      state.error = null;
    },
    clearShiftMessage(state) {
      state.message = null;
    },
    clearActiveShift(state) {
      state.activeShift = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // CREATE
      .addCase(createShift.pending, (state) => {
        state.createShiftStatus = API_STATUS.LOADING;
        state.error = null;
      })
      .addCase(createShift.fulfilled, (state, action) => {
        state.createShiftStatus = API_STATUS.SUCCESS;
        if (action.payload) {
          state.shifts.unshift(action.payload);
          state.activeShift = action.payload;
        }
        state.message = "Shift created successfully";
      })
      .addCase(createShift.rejected, (state, action) => {
        state.createShiftStatus = API_STATUS.ERROR;
        state.error = action.payload || "Failed to create shift";
      })
      // LIST
      .addCase(listShifts.pending, (state) => {
        state.listShiftsStatus = API_STATUS.LOADING;
      })
      .addCase(listShifts.fulfilled, (state, action) => {
        state.listShiftsStatus = API_STATUS.SUCCESS;
        state.shifts = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(listShifts.rejected, (state, action) => {
        state.listShiftsStatus = API_STATUS.ERROR;
        state.error = action.payload;
      })
      // GET OPEN SHIFT
      .addCase(getOpenShift.pending, (state) => {
        state.getOpenShiftStatus = API_STATUS.LOADING;
      })
      .addCase(getOpenShift.fulfilled, (state, action) => {
        state.getOpenShiftStatus = API_STATUS.SUCCESS;
        state.activeShift = action.payload;
      })
      .addCase(getOpenShift.rejected, (state, action) => {
        state.getOpenShiftStatus = API_STATUS.ERROR;
        state.activeShift = null;
      })
      // UPDATE STATUS
      .addCase(updateShiftStatus.pending, (state) => {
        state.updateShiftStatusStatus = API_STATUS.LOADING;
      })
      .addCase(updateShiftStatus.fulfilled, (state, action) => {
        state.updateShiftStatusStatus = API_STATUS.SUCCESS;
        const updated = action.payload;
        state.shifts = state.shifts.map((s) => (s._id === updated._id ? updated : s));
        if (state.activeShift?._id === updated._id) {
          if (updated.status === "closed") {
            state.activeShift = null;
          } else {
            state.activeShift = updated;
          }
        }
        state.message = "Shift updated successfully";
      })
      .addCase(updateShiftStatus.rejected, (state, action) => {
        state.updateShiftStatusStatus = API_STATUS.ERROR;
        state.error = action.payload;
      })
      // INITIATE SHIFT CLOSE
      .addCase(initiateShiftClose.pending, (state) => {
        state.initiateShiftCloseStatus = API_STATUS.LOADING;
      })
      .addCase(initiateShiftClose.fulfilled, (state, action) => {
        state.initiateShiftCloseStatus = API_STATUS.SUCCESS;
        const updated = action.payload;
        if (updated) {
          state.shifts = state.shifts.map((s) => (s._id === updated._id ? updated : s));
          state.activeShift = updated;
        }
      })
      .addCase(initiateShiftClose.rejected, (state, action) => {
        state.initiateShiftCloseStatus = API_STATUS.ERROR;
        state.error = action.payload;
      })
      // ABORT SHIFT CLOSE
      .addCase(abortShiftClose.pending, (state) => {
        state.abortShiftCloseStatus = API_STATUS.LOADING;
      })
      .addCase(abortShiftClose.fulfilled, (state, action) => {
        state.abortShiftCloseStatus = API_STATUS.SUCCESS;
        const updated = action.payload;
        if (updated) {
          state.shifts = state.shifts.map((s) => (s._id === updated._id ? updated : s));
          state.activeShift = updated;
        }
      })
      .addCase(abortShiftClose.rejected, (state, action) => {
        state.abortShiftCloseStatus = API_STATUS.ERROR;
        state.error = action.payload;
      });
  },
});

export const { clearShiftError, clearShiftMessage, clearActiveShift } = shiftSlice.actions;
export default shiftSlice.reducer;
