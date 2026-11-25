import { apiClient, ENDPOINTS } from "@/services";

const purchaseBillService = {
  createPurchaseBill(payload) {
    return apiClient.post(ENDPOINTS.PURCHASE_BILL.CREATE, payload);
  },

  getPurchaseBills(params = {}) {
    return apiClient.get(ENDPOINTS.PURCHASE_BILL.LIST, { params });
  },

  getPurchaseBillById(billId) {
    return apiClient.get(ENDPOINTS.PURCHASE_BILL.BY_ID(billId));
  },

  updatePurchaseBill(billId, payload) {
    return apiClient.put(ENDPOINTS.PURCHASE_BILL.BY_ID(billId), payload);
  },

  ingestPurchaseBill(billId) {
    return apiClient.post(`${ENDPOINTS.PURCHASE_BILL.BY_ID(billId)}/ingest`);
  },

  payPurchaseBill(billId, payload) {
    return apiClient.post(`${ENDPOINTS.PURCHASE_BILL.BY_ID(billId)}/pay`, payload);
  },

  bulkPayPurchaseBills(payload) {
    return apiClient.post(`/catalog/purchase-bills/bulk/pay`, payload);
  },

  importLegacyBills(formData) {
    return apiClient.post(`/catalog/purchase-bills/import/legacy-bills`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getIncomingConsignments(params = {}) {
    return apiClient.get(`/catalog/purchase-bills/incoming-consignments`, { params });
  },

  acceptIncomingConsignment(invoiceId, payload = {}) {
    return apiClient.post(`/catalog/purchase-bills/incoming-consignments/${invoiceId}/accept`, payload);
  },

  parsePurchaseBillImport(data) {
    if (data instanceof FormData) {
      return apiClient.post(`/catalog/purchase-bills/parse-import`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }
    return apiClient.post(`/catalog/purchase-bills/parse-import`, data);
  },
};

export default purchaseBillService;
