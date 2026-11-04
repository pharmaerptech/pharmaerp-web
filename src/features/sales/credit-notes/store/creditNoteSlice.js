import { createSlice } from "@reduxjs/toolkit";
import { API_STATUS } from "@/constants";
import {
  getCreditNotes,
  getCreditNoteById,
  getCustomerCreditNotes,
  getCreditNoteStats,
  issueCreditNote,
  cancelCreditNote,
} from "./creditNoteThunk";

const initialState = {
  creditNotes: [],
  currentCreditNote: null,
  customerCreditNotes: [],
  stats: null,

  total: 0,
  page: 1,
  limit: 20,

  status: API_STATUS.IDLE,
  error: null,
  message: null,

  getCreditNotesStatus: API_STATUS.IDLE,
  getCreditNoteByIdStatus: API_STATUS.IDLE,
  getCustomerCreditNotesStatus: API_STATUS.IDLE,
  getCreditNoteStatsStatus: API_STATUS.IDLE,
  issueCreditNoteStatus: API_STATUS.IDLE,
  cancelCreditNoteStatus: API_STATUS.IDLE,
};

const creditNoteSlice = createSlice({
  name: "creditNote",
  initialState,

  reducers: {
    clearCreditNoteError(state) {
      state.error = null;
    },

    clearCreditNoteMessage(state) {
      state.message = null;
    },

    setCurrentCreditNote(state, action) {
      state.currentCreditNote = action.payload;
    },

    clearCustomerCreditNotes(state) {
      state.customerCreditNotes = [];
    },
  },

  extraReducers: (builder) => {
    /*
    |--------------------------------------------------------------------------
    | getCreditNotes
    |--------------------------------------------------------------------------
    */
    builder
      .addCase(getCreditNotes.pending, (state) => {
        state.getCreditNotesStatus = API_STATUS.PENDING;
        state.error = null;
      })
      .addCase(getCreditNotes.fulfilled, (state, action) => {
        state.getCreditNotesStatus = API_STATUS.FULFILLED;
        state.creditNotes = action.payload?.creditNotes || action.payload?.items || action.payload || [];
        state.total = action.payload?.total || state.creditNotes.length;
        state.page = action.payload?.page || 1;
        state.limit = action.payload?.limit || 20;
      })
      .addCase(getCreditNotes.rejected, (state, action) => {
        state.getCreditNotesStatus = API_STATUS.REJECTED;
        state.error = action.payload;
      });

    /*
    |--------------------------------------------------------------------------
    | getCreditNoteById
    |--------------------------------------------------------------------------
    */
    builder
      .addCase(getCreditNoteById.pending, (state) => {
        state.getCreditNoteByIdStatus = API_STATUS.PENDING;
        state.error = null;
      })
      .addCase(getCreditNoteById.fulfilled, (state, action) => {
        state.getCreditNoteByIdStatus = API_STATUS.FULFILLED;
        state.currentCreditNote = action.payload;
      })
      .addCase(getCreditNoteById.rejected, (state, action) => {
        state.getCreditNoteByIdStatus = API_STATUS.REJECTED;
        state.error = action.payload;
      });

    /*
    |--------------------------------------------------------------------------
    | getCustomerCreditNotes
    |--------------------------------------------------------------------------
    */
    builder
      .addCase(getCustomerCreditNotes.pending, (state) => {
        state.getCustomerCreditNotesStatus = API_STATUS.PENDING;
        state.error = null;
      })
      .addCase(getCustomerCreditNotes.fulfilled, (state, action) => {
        state.getCustomerCreditNotesStatus = API_STATUS.FULFILLED;
        const payload = action.payload;
        state.customerCreditNotes = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.creditNotes)
          ? payload.creditNotes
          : Array.isArray(payload?.activeNotes)
          ? payload.activeNotes
          : [];
      })
      .addCase(getCustomerCreditNotes.rejected, (state, action) => {
        state.getCustomerCreditNotesStatus = API_STATUS.REJECTED;
        state.error = action.payload;
      });

    /*
    |--------------------------------------------------------------------------
    | getCreditNoteStats
    |--------------------------------------------------------------------------
    */
    builder
      .addCase(getCreditNoteStats.pending, (state) => {
        state.getCreditNoteStatsStatus = API_STATUS.PENDING;
        state.error = null;
      })
      .addCase(getCreditNoteStats.fulfilled, (state, action) => {
        state.getCreditNoteStatsStatus = API_STATUS.FULFILLED;
        state.stats = action.payload;
      })
      .addCase(getCreditNoteStats.rejected, (state, action) => {
        state.getCreditNoteStatsStatus = API_STATUS.REJECTED;
        state.error = action.payload;
      });

    /*
    |--------------------------------------------------------------------------
    | issueCreditNote
    |--------------------------------------------------------------------------
    */
    builder
      .addCase(issueCreditNote.pending, (state) => {
        state.issueCreditNoteStatus = API_STATUS.PENDING;
        state.error = null;
      })
      .addCase(issueCreditNote.fulfilled, (state, action) => {
        state.issueCreditNoteStatus = API_STATUS.FULFILLED;
        if (action.payload) {
          state.creditNotes.unshift(action.payload);
          state.total += 1;
        }
      })
      .addCase(issueCreditNote.rejected, (state, action) => {
        state.issueCreditNoteStatus = API_STATUS.REJECTED;
        state.error = action.payload;
      });

    /*
    |--------------------------------------------------------------------------
    | cancelCreditNote
    |--------------------------------------------------------------------------
    */
    builder
      .addCase(cancelCreditNote.pending, (state) => {
        state.cancelCreditNoteStatus = API_STATUS.PENDING;
        state.error = null;
      })
      .addCase(cancelCreditNote.fulfilled, (state, action) => {
        state.cancelCreditNoteStatus = API_STATUS.FULFILLED;
        const updated = action.payload;
        if (updated && updated._id) {
          const index = state.creditNotes.findIndex((cn) => cn._id === updated._id);
          if (index !== -1) {
            state.creditNotes[index] = updated;
          }
          if (state.currentCreditNote?._id === updated._id) {
            state.currentCreditNote = updated;
          }
        }
      })
      .addCase(cancelCreditNote.rejected, (state, action) => {
        state.cancelCreditNoteStatus = API_STATUS.REJECTED;
        state.error = action.payload;
      });
  },
});

export const {
  clearCreditNoteError,
  clearCreditNoteMessage,
  setCurrentCreditNote,
  clearCustomerCreditNotes,
} = creditNoteSlice.actions;

export default creditNoteSlice.reducer;

