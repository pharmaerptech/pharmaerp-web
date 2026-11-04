// src/services/interceptors.js

import { TOKEN_KEY } from "../constants";
import { storage, getErrorMessage } from "../utils";

export const setupInterceptors = (apiClient, store) => {
  apiClient.interceptors.request.use(
    (config) => {
      // 1. Authentication remains safely handled via tokens
      const token = storage.get(TOKEN_KEY);

      config.headers = config.headers || {};

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 2. FIXED: Extract runtime active contexts straight out of global Redux memory state tree
      if (store) {
        const state = store.getState();

        const workspaceId =
          state.workspace?.currentWorkspace?._id ||
          state.workspace?.currentWorkspace?.id;
        let companyId =
          state.company?.currentCompany?._id ||
          state.company?.currentCompany?.id;
        if (!companyId) {
          try {
            companyId = localStorage.getItem("pahuch_active_company_id") || null;
          } catch {}
        }

        let branchId =
          state.branch?.currentBranch?._id ||
          state.branch?.currentBranch?.id;
        if (!branchId) {
          try {
            branchId = localStorage.getItem("pahuch_active_branch_id") || null;
          } catch {}
        }

        if (workspaceId) {
          config.headers["x-workspace-id"] = workspaceId;
        }

        if (companyId) {
          config.headers["x-company-id"] = companyId;
        }

        if (branchId) {
          config.headers["x-branch-id"] = branchId;
        }
      }

      // 3. Client Local Date for timezone-safe operations (YYYY-MM-DD)
      const now = new Date();
      const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      config.headers["x-client-date"] = localDateStr;
      return config;
    },
    (error) => Promise.reject(error),
  );

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const statusCode = error?.response?.status;

      if (statusCode === 401) {
        storage.remove(TOKEN_KEY);
      }

      error.message = getErrorMessage(error);

      return Promise.reject(error);
    },
  );
};
