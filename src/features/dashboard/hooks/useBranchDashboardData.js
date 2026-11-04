// src/features/dashboard/hooks/useBranchDashboardData.js

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import dashboardService from "../services/dashboardService";

export const useBranchDashboardData = (selectedDate = null) => {
  const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace);
  const currentCompany = useSelector((state) => state.company?.currentCompany);
  const currentBranch = useSelector((state) => state.branch?.currentBranch);
  const user = useSelector((state) => state.user?.user);

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const workspaceId =
    currentWorkspace?._id ||
    currentWorkspace?.id ||
    user?.activeContext?.workspaceId;
  const companyId =
    currentCompany?._id ||
    currentCompany?.id ||
    user?.activeContext?.companyId;
  const branchId =
    currentBranch?._id ||
    currentBranch?.id ||
    user?.activeContext?.branchId;

  const fetchBranchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await dashboardService.getBranchDashboard({
        branchId: branchId || undefined,
        companyId: companyId || undefined,
        date: selectedDate && selectedDate !== "Today" ? selectedDate : undefined,
      });
      setData(res);
    } catch (err) {
      setError(err?.message || "Failed to load branch dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [branchId, companyId, selectedDate]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await dashboardService.getBranchDashboard({
          branchId: branchId || undefined,
          companyId: companyId || undefined,
          date: selectedDate && selectedDate !== "Today" ? selectedDate : undefined,
        });
        if (active) {
          setData(res);
          setIsLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err?.message || "Failed to load branch dashboard data");
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [workspaceId, companyId, branchId, selectedDate]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchBranchDashboard,
  };
};

export default useBranchDashboardData;
