import { apiClient, ENDPOINTS } from "@/services";

const creditNoteService = {
  getCreditNotes(params = {}) {
    return apiClient.get(ENDPOINTS.SALES.CREDIT_NOTES.LIST, { params });
  },

  getCreditNoteStats(params = {}) {
    return apiClient.get(ENDPOINTS.SALES.CREDIT_NOTES.STATS, { params });
  },

  getCreditNoteById(id) {
    return apiClient.get(ENDPOINTS.SALES.CREDIT_NOTES.BY_ID(id));
  },

  getCustomerCreditNotes(customerId) {
    return apiClient.get(ENDPOINTS.SALES.CREDIT_NOTES.BY_CUSTOMER(customerId));
  },

  issueCreditNote(payload) {
    return apiClient.post(ENDPOINTS.SALES.CREDIT_NOTES.CREATE, payload);
  },

  cancelCreditNote(id, reason) {
    return apiClient.post(ENDPOINTS.SALES.CREDIT_NOTES.CANCEL(id), { reason });
  },
};

export default creditNoteService;

