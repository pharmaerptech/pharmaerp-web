import { apiClient, ENDPOINTS } from "@/services";

const purchaseReturnService = {
  createPurchaseReturn(payload) {
    return apiClient.post(ENDPOINTS.PURCHASE_RETURN.CREATE, payload);
  },

  getPurchaseReturns(params = {}) {
    return apiClient.get(ENDPOINTS.PURCHASE_RETURN.LIST, { params });
  },

  getPurchaseReturnById(returnId) {
    return apiClient.get(ENDPOINTS.PURCHASE_RETURN.BY_ID(returnId));
  },

  getEligibleBatches(params = {}) {
    return apiClient.get(ENDPOINTS.PURCHASE_RETURN.ELIGIBLE_BATCHES, { params });
  },

  cancelPurchaseReturn(returnId, payload = {}) {
    return apiClient.post(ENDPOINTS.PURCHASE_RETURN.CANCEL(returnId), payload);
  },
};

export default purchaseReturnService;

