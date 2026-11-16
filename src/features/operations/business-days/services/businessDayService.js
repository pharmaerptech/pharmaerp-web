import { apiClient } from "@/services";

const businessDayService = {
  /** Opens a new Business Day for the branch. */
  openBusinessDay(payload) {
    return apiClient.post("/operations/business-days", payload);
  },

  /** Lists all Business Days with optional filters (date, status, branchId). */
  listBusinessDays(params) {
    return apiClient.get("/operations/business-days", { params });
  },

  /** Gets the currently OPEN Business Day for a branch. Returns 404 if none. */
  getOpenBusinessDay(branchId) {
    return apiClient.get("/operations/business-days/open", {
      params: { branchId },
    });
  },

  /** Gets the suggested businessDate for the next Business Day opening. */
  getSuggestedBusinessDate(args) {
    const params =
      typeof args === "object" && args !== null && !Array.isArray(args)
        ? args
        : { branchId: args };
    return apiClient.get("/operations/business-days/suggested-date", { params });
  },

  /** Gets a Business Day by ID. */
  getBusinessDayById(id) {
    return apiClient.get(`/operations/business-days/${id}`);
  },

  /** Gets a full financial summary for a Business Day. */
  getBusinessDaySummary(id) {
    return apiClient.get(`/operations/business-days/${id}/summary`);
  },

  /** Initiates closing of the Business Day. */
  initiateBusinessDayClose(id) {
    return apiClient.patch(`/operations/business-days/${id}/initiate-close`);
  },

  /** Aborts closing of the Business Day, reverting it back to open. */
  abortBusinessDayClose(id) {
    return apiClient.patch(`/operations/business-days/${id}/abort-close`);
  },

  /** Closes the Business Day and aggregates all shift financial data. */
  closeBusinessDay(id, payload) {
    return apiClient.patch(`/operations/business-days/${id}/close`, payload);
  },

  /** Cancels the Business Day. */
  cancelBusinessDay(id, payload) {
    return apiClient.patch(`/operations/business-days/${id}/cancel`, payload);
  },
};

export default businessDayService;
