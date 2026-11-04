import { createAsyncThunk } from "@reduxjs/toolkit";
import creditNoteService from "../services/creditNoteService";
import { getErrorMessage } from "@/utils";

/*
|--------------------------------------------------------------------------
| Credit Note Thunks
|--------------------------------------------------------------------------
*/

export const getCreditNotes = createAsyncThunk(
  "creditNote/getCreditNotes",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await creditNoteService.getCreditNotes(params);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const getCreditNoteById = createAsyncThunk(
  "creditNote/getCreditNoteById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await creditNoteService.getCreditNoteById(id);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const getCustomerCreditNotes = createAsyncThunk(
  "creditNote/getCustomerCreditNotes",
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await creditNoteService.getCustomerCreditNotes(customerId);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const getCreditNoteStats = createAsyncThunk(
  "creditNote/getCreditNoteStats",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await creditNoteService.getCreditNoteStats(params);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const issueCreditNote = createAsyncThunk(
  "creditNote/issueCreditNote",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await creditNoteService.issueCreditNote(payload);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const cancelCreditNote = createAsyncThunk(
  "creditNote/cancelCreditNote",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await creditNoteService.cancelCreditNote(id, reason);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

