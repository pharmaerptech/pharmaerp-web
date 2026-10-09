// src/features/dashboard/hooks/useBranchDashboardData.js

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import dashboardService from "../services/dashboardService";

export const useBranchDashboardData = (selectedDate = null) => {
  const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace);
  const currentCompany = useSelector((state) => state.company?.currentCompany);
  const currentBranch = useSelector((state) => state.branch?.currentBranch);

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const workspaceId = currentWorkspace?._id;
  const companyId = currentCompany?._id;
  const branchId = currentBranch?._id;

  const fetchBranchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await dashboardService.getBranchDashboard({
        date: selectedDate,
      });
      setData(res);
    } catch (err) {
      setError(err?.message || "Failed to load branch dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const res = await dashboardService.getBranchDashboard({
          date: selectedDate,
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
    currentWorkspace,
    currentCompany,
    currentBranch,
  };
};

export default useBranchDashboardData;
