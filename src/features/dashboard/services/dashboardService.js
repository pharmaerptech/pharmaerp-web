import { apiClient, ENDPOINTS } from "@/services";

const dashboardService = {
  async getDashboardOverview() {
    const response = await apiClient.get(ENDPOINTS.DASHBOARD.OVERVIEW);
    return response.data?.data || null;
  },

  async getBranchDashboard(params = {}) {
    const response = await apiClient.get(ENDPOINTS.DASHBOARD.BRANCH, { params });
    return response.data?.data || null;
  },

  async getCompanyDashboard(params = {}) {
    const response = await apiClient.get(ENDPOINTS.DASHBOARD.COMPANY, { params });
    return response.data?.data || null;
  },

  async getWorkspaceDashboard(params = {}) {
    const response = await apiClient.get(ENDPOINTS.DASHBOARD.WORKSPACE, { params });
    return response.data?.data || null;
  },
};

export default dashboardService;
