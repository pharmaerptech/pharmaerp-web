import { apiClient } from "@/services";

const shiftService = {
  createShift(payload) {
    return apiClient.post("/operations/shifts", payload);
  },
  listShifts(params) {
    return apiClient.get("/operations/shifts", { params });
  },
  getOpenShift(params) {
    return apiClient.get("/operations/shifts/open", { params });
  },
  getShiftById(id) {
    return apiClient.get(`/operations/shifts/${id}`);
  },
  updateShiftStatus(id, payload) {
    return apiClient.patch(`/operations/shifts/${id}/status`, payload);
  },
  initiateShiftClose(id) {
    return apiClient.patch(`/operations/shifts/${id}/initiate-close`);
  },
  abortShiftClose(id) {
    return apiClient.patch(`/operations/shifts/${id}/abort-close`);
  },
  cancelShift(id, payload) {
    return apiClient.patch(`/operations/shifts/${id}/cancel`, payload);
  },
};

export default shiftService;
