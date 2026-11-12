// src/services/interceptors.js

import { TOKEN_KEY, USER_STORAGE_KEY } from "../constants";
import { storage, getErrorMessage } from "../utils";
import { clearAllHeldBillsStorage } from "@/features/sales/services/holdBillStorage";

const activeInterceptors = new WeakMap();

const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/send-email-otp",
  "/auth/verify-email-otp",
  "/auth/verify-email",
  "/platform/",
];

const isPublicAuthRequest = (url = "") =>
  PUBLIC_AUTH_PATHS.some((path) => url.includes(path));

export const setupInterceptors = (apiClient, store) => {
  const existing = activeInterceptors.get(apiClient);
  if (existing) {
    apiClient.interceptors.request.eject(existing.requestId);
    apiClient.interceptors.response.eject(existing.responseId);
  }

  const requestId = apiClient.interceptors.request.use(
    (config) => {
      const token = storage.get(TOKEN_KEY);

      config.headers = config.headers || {};

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

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

      // Attach fast localStorage active work mode & work level headers
      try {
        const workMode = localStorage.getItem("pahuch_work_mode");
        const workLevel = localStorage.getItem("pahuch_pipeline_level");
        if (workMode) {
          config.headers["x-work-mode"] = workMode;
        }
        if (workLevel) {
          config.headers["x-work-level"] = workLevel;
        }
      } catch {}

      const now = new Date();
      const localDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      config.headers["x-client-date"] = localDateStr;
      return config;
    },
    (error) => Promise.reject(error),
  );

  const responseId = apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const statusCode = error?.response?.status;
      const requestUrl = error?.config?.url || "";

      if (statusCode === 401 && !isPublicAuthRequest(requestUrl)) {
        storage.remove(TOKEN_KEY);
        storage.remove(USER_STORAGE_KEY);
        clearAllHeldBillsStorage();

        if (store && store.getState()?.auth?.isAuthenticated) {
          store.dispatch({ type: "auth/clearCredentials" });
        }
      }

      if (error?.response?.data?.code) {
        error.code = error.response.data.code;
      }

      error.message = getErrorMessage(error);

      return Promise.reject(error);
    },
  );

  activeInterceptors.set(apiClient, { requestId, responseId });
};
