// src/features/dashboard/hooks/useWorkspaceDashboardData.js

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import dashboardService from "../services/dashboardService";

export const useWorkspaceDashboardData = (timeframe = "This Month", dateRange = null) => {
  const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace);

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const workspaceId = currentWorkspace?._id;

  const fetchWorkspaceDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await dashboardService.getWorkspaceDashboard({
        timeframe,
        dateRange,
        workspaceId,
      });
      setData(res);
    } catch (err) {
      setError(err?.message || "Failed to load workspace dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, dateRange, workspaceId]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const res = await dashboardService.getWorkspaceDashboard({
          timeframe,
          dateRange,
          workspaceId,
        });
        if (active) {
          setData(res);
          setIsLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err?.message || "Failed to load workspace dashboard data");
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [workspaceId, timeframe, dateRange]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchWorkspaceDashboard,
  };
};

export default useWorkspaceDashboardData;
