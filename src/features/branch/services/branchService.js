import { apiClient, ENDPOINTS } from "@/services";

const branchService = {
  createBranch(payload) {
    return apiClient.post(ENDPOINTS.BRANCH.CREATE, payload);
  },

  getCompanyBranches(companyId = null) {
    const headers = companyId ? { "x-company-id": companyId } : {};
    return apiClient.get(ENDPOINTS.BRANCH.LIST, { headers });
  },

  getWorkspaceBranches() {
    return apiClient.get(ENDPOINTS.BRANCH.WORKSPACE_LIST);
  },

  getBranchById(branchId) {
    return apiClient.get(ENDPOINTS.BRANCH.BY_ID(branchId));
  },

  updateBranch(branchId, payload) {
    return apiClient.patch(ENDPOINTS.BRANCH.BY_ID(branchId), payload);
  },

  deleteBranch(branchId) {
    return apiClient.delete(ENDPOINTS.BRANCH.BY_ID(branchId));
  },

  async getBranchEmployees(branchId) {
    try {
      const response = await apiClient.get(
        ENDPOINTS.BRANCH.EMPLOYEES(branchId),
      );
      if (response && (response.data?.data || Array.isArray(response.data))) {
        return response;
      }
    } catch {
      // Fallback through member access query
    }

    try {
      const response = await apiClient.get(ENDPOINTS.BRANCH.MEMBERS(branchId));
      if (response && (response.data?.data || Array.isArray(response.data))) {
        return response;
      }
    } catch {
      // Fallback through member access query
    }

    try {
      const accessResponse = await apiClient.get(
        ENDPOINTS.ACCESS_CONTROL.MEMBER_ACCESS,
      );
      const members = accessResponse?.data?.data || accessResponse?.data || [];
      if (Array.isArray(members)) {
        const filtered = members
          .filter((m) => {
            if (m.isOwner || m.accessAllBranches) return true;
            if (Array.isArray(m.branchIds)) {
              return m.branchIds.some(
                (bId) => String(bId._id || bId) === String(branchId),
              );
            }
            if (Array.isArray(m.branches)) {
              return m.branches.some(
                (b) => String(b._id || b) === String(branchId),
              );
            }
            return false;
          })
          .map((m, idx) => {
            const userObj =
              m.userId && typeof m.userId === "object" ? m.userId : null;
            const roleObj =
              m.workspaceMemberId?.roleId &&
              typeof m.workspaceMemberId.roleId === "object"
                ? m.workspaceMemberId.roleId
                : m.roleId && typeof m.roleId === "object"
                  ? m.roleId
                  : null;

            return {
              _id: m._id || m.workspaceMemberId?._id || `member-${idx}`,
              id: m._id || m.workspaceMemberId?._id || `member-${idx}`,
              user: userObj || m.user || null,
              displayName:
                userObj?.name ||
                userObj?.fullName ||
                m.user?.name ||
                m.name ||
                `Member #${idx + 1}`,
              displayEmail: userObj?.email || m.user?.email || m.email || "-",
              displayPhone:
                userObj?.phone || userObj?.mobile || m.user?.phone || "-",
              role: roleObj || m.role || null,
              roleName:
                m.isOwner || m.workspaceMemberId?.isOwner
                  ? "Owner"
                  : roleObj?.name ||
                    m.roleName ||
                    m.role?.name ||
                    "Staff Member",
              status: m.status || m.workspaceMemberId?.status || "active",
              isOwner: Boolean(m.isOwner || m.workspaceMemberId?.isOwner),
              accessAllBranches: Boolean(m.accessAllBranches || m.isOwner),
            };
          });
        return { data: { data: filtered }, success: true };
      }
    } catch {
      // Regulated by store selectors
    }

    return { data: { data: [] }, success: true };
  },
};

export default branchService;
