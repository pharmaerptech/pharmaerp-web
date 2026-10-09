// src/features/dashboard/hooks/useCompanyDashboardData.js

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import dashboardService from "../services/dashboardService";

export const useCompanyDashboardData = (timeframe = "This Month", dateRange = null) => {
  const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace);
  const currentCompany = useSelector((state) => state.company?.currentCompany);

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const workspaceId = currentWorkspace?._id;
  const companyId = currentCompany?._id;

  const fetchCompanyDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await dashboardService.getCompanyDashboard({
        timeframe,
        dateRange,
        companyId,
      });
      setData(res);
    } catch (err) {
      setError(err?.message || "Failed to load company dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, dateRange, companyId]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const res = await dashboardService.getCompanyDashboard({
          timeframe,
          dateRange,
          companyId,
        });
        if (active) {
          setData(res);
          setIsLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err?.message || "Failed to load company dashboard data");
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [workspaceId, companyId, timeframe, dateRange]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchCompanyDashboard,
  };
};

export default useCompanyDashboardData;
