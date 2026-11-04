export const selectCreditNotes = (state) => state.creditNote.creditNotes;
export const selectCurrentCreditNote = (state) => state.creditNote.currentCreditNote;
export const selectCustomerCreditNotes = (state) => state.creditNote.customerCreditNotes;
export const selectCreditNoteStats = (state) => state.creditNote.stats;

export const selectCreditNoteTotal = (state) => state.creditNote.total;
export const selectCreditNotePage = (state) => state.creditNote.page;
export const selectCreditNoteLimit = (state) => state.creditNote.limit;

export const selectCreditNoteStatus = (state) => state.creditNote.status;
export const selectCreditNoteError = (state) => state.creditNote.error;
export const selectCreditNoteMessage = (state) => state.creditNote.message;

/*
|--------------------------------------------------------------------------
| Action Status Selectors
|--------------------------------------------------------------------------
*/
export const selectGetCreditNotesStatus = (state) => state.creditNote.getCreditNotesStatus;
export const selectGetCreditNoteByIdStatus = (state) => state.creditNote.getCreditNoteByIdStatus;
export const selectGetCustomerCreditNotesStatus = (state) => state.creditNote.getCustomerCreditNotesStatus;
export const selectGetCreditNoteStatsStatus = (state) => state.creditNote.getCreditNoteStatsStatus;
export const selectIssueCreditNoteStatus = (state) => state.creditNote.issueCreditNoteStatus;
export const selectCancelCreditNoteStatus = (state) => state.creditNote.cancelCreditNoteStatus;

