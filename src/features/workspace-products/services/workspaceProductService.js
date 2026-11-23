// src/features/workspace-products/services/workspaceProductService.js

import { apiClient, ENDPOINTS } from "@/services";

const workspaceProductService = {
  /**
   * Search Before Create
   * GET /catalog/products/search
   *
   * Query Params:
   * {
   *   name,
   *   productType
   * }
   */
  searchBeforeCreateWorkspaceProduct(params = {}) {
    return apiClient.get(ENDPOINTS.WORKSPACE_PRODUCTS.SEARCH_BEFORE_CREATE, {
      params,
    });
  },

  /**
   * Create Workspace Product
   * POST /catalog/products
   */
  createWorkspaceProduct(payload) {
    return apiClient.post(ENDPOINTS.WORKSPACE_PRODUCTS.CREATE, payload);
  },

  /**
   * Get Workspace Products
   * GET /catalog/products
   *
   * Query Params:
   * {
   *   status,
   *   productType,
   *   search,
   *   page,
   *   limit
   * }
   */
  getWorkspaceProducts(params = {}) {
    return apiClient.get(ENDPOINTS.WORKSPACE_PRODUCTS.LIST, {
      params,
    });
  },

  /**
   * Get Workspace Product By Id
   * GET /catalog/products/:productId
   */
  getWorkspaceProductById(productId) {
    return apiClient.get(ENDPOINTS.WORKSPACE_PRODUCTS.BY_ID(productId));
  },

  /**
   * Get Workspace Product By Code
   * GET /catalog/products/code/:productCode
   */
  getWorkspaceProductByCode(productCode) {
    return apiClient.get(ENDPOINTS.WORKSPACE_PRODUCTS.BY_CODE(productCode));
  },

  /**
   * Update Workspace Product
   * PATCH /catalog/products/:productId
   */
  updateWorkspaceProduct(productId, payload) {
    return apiClient.patch(
      ENDPOINTS.WORKSPACE_PRODUCTS.BY_ID(productId),
      payload,
    );
  },

  /**
   * Delete Workspace Product
   * DELETE /catalog/products/:productId
   */
  deleteWorkspaceProduct(productId) {
    return apiClient.delete(ENDPOINTS.WORKSPACE_PRODUCTS.BY_ID(productId));
  },

  /**
   * Detect Inventory File & Brand Mappings
   * POST /catalog/products/detect
   */
  detectInventoryProducts(file) {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post("/catalog/products/detect", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 300000, // 5 mins
    });
  },

  importWorkspaceProducts(payload) {
    if (payload instanceof FormData) {
      return apiClient.post(ENDPOINTS.WORKSPACE_PRODUCTS.IMPORT, payload, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000,
      });
    }
    if (payload?.file) {
      const formData = new FormData();
      formData.append("file", payload.file);
      if (payload.branchId) formData.append("branchId", payload.branchId);
      return apiClient.post(ENDPOINTS.WORKSPACE_PRODUCTS.IMPORT, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000,
      });
    }
    return apiClient.post(ENDPOINTS.WORKSPACE_PRODUCTS.IMPORT, payload, { timeout: 300000 });
  },

  importWorkspaceProductsGst(payload) {
    if (payload instanceof FormData) {
      return apiClient.post(ENDPOINTS.WORKSPACE_PRODUCTS.IMPORT_GST, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    if (payload?.file) {
      const formData = new FormData();
      formData.append("file", payload.file);
      return apiClient.post(ENDPOINTS.WORKSPACE_PRODUCTS.IMPORT_GST, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return apiClient.post(ENDPOINTS.WORKSPACE_PRODUCTS.IMPORT_GST, payload);
  },
  /**
   * Get Product Facility Batches By Query V2
   * POST /catalog/products/workspace-product/batches/query
   */
  getProductFacilityBatchesByQueryV2(payload = {}) {
    return apiClient.post(ENDPOINTS.WORKSPACE_PRODUCTS.BATCHES_QUERY, payload);
  },

  /**
   * Move shelf-expired batches to branch scrap bin
   * POST /catalog/products/workspace-product/batches/move-to-scrap-bin
   */
  moveToScrapBin(payload = {}) {
    return apiClient.post(ENDPOINTS.WORKSPACE_PRODUCTS.MOVE_TO_SCRAP_BIN, payload);
  },

  /**
   * Add expired or broken stock adjustment
   * POST /catalog/products/workspace-product/stock-adjustments/expired-broken
   */
  addExpiredBrokenStock(payload = {}) {
    return apiClient.post(ENDPOINTS.WORKSPACE_PRODUCTS.ADD_EXPIRED_BROKEN_STOCK, payload);
  },
};

export default workspaceProductService;
