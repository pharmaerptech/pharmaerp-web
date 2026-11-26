import { apiClient } from "@/services";

const salesReturnService = {
  getAllSalesReturns(params = {}) {
    return apiClient.get("/sales/returns", { params });
  },

  getSalesReturnById(returnId) {
    return apiClient.get(`/sales/returns/${returnId}`);
  },

  recordSalesReturn(payload, customerId = null) {
    const url = customerId ? `/sales/returns/customer/${customerId}` : "/sales/returns";
    return apiClient.post(url, payload);
  },

  getNextReturnNumber(params = {}) {
    return apiClient.get("/sales/returns/next-number", { params });
  },

  async ingestFreshStockToStore(returnId, branchId) {
    try {
      return await apiClient.post(`/sales/returns/${returnId}/ingest-to-store`, { branchId });
    } catch (err) {
      if (err?.response?.status === 404) {
        return await apiClient.post(`/catalog/purchase-returns/${returnId}/ingest-to-store`, { branchId });
      }
      throw err;
    }
  },

  async quarantineScrapToStore(returnId, branchId) {
    try {
      return await apiClient.post(`/sales/returns/${returnId}/quarantine-scrap`, { branchId });
    } catch (err) {
      if (err?.response?.status === 404) {
        return await apiClient.post(`/catalog/purchase-returns/${returnId}/receive-box`, { branchId });
      }
      throw err;
    }
  },

  async approveSalesReturn(returnId, payload = {}) {
    try {
      return await apiClient.put(`/sales/returns/${returnId}/approve`, payload);
    } catch (err) {
      if (err?.response?.status === 404) {
        return await apiClient.post(`/sales/returns/${returnId}/approve`, payload);
      }
      throw err;
    }
  },
};

export default salesReturnService;
