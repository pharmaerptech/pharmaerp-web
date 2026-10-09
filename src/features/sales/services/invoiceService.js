import { apiClient, ENDPOINTS } from "@/services";

const invoiceService = {
  getAllCustomerSales(params = {}) {
    return apiClient.get(ENDPOINTS.SALES.INVOICES.ALL, { params });
  },

  getCustomerSales(customerId, params = {}) {
    return apiClient.get(ENDPOINTS.SALES.INVOICES.BY_CUSTOMER(customerId), { params });
  },

  recordCustomerSale(customerId, payload) {
    return apiClient.post(ENDPOINTS.SALES.INVOICES.BY_CUSTOMER(customerId), payload);
  },

  updateCustomerSale(customerId, invoiceId, payload) {
    return apiClient.put(`${ENDPOINTS.SALES.INVOICES.BY_CUSTOMER(customerId)}/${invoiceId}`, payload);
  },

  cancelCustomerSale(invoiceId) {
    return apiClient.put(`/sales/invoices/${invoiceId}/cancel`);
  },

};

export default invoiceService;
