// src/features/dashboard/hooks/useWorkspaceDashboardData.js

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import dashboardService from "../services/dashboardService";

export const useWorkspaceDashboardData = (timeframe = "This Month", dateRange = null) => {
  const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace);
  const user = useSelector((state) => state.user?.user);

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const workspaceId =
    currentWorkspace?._id ||
    currentWorkspace?.id ||
    user?.activeContext?.workspaceId ||
    user?.workspaces?.[0]?._id;

  const normalizedTimeframe = String(timeframe || "THIS_MONTH")
    .toUpperCase()
    .replace(/\s+/g, "_");

  const fetchWorkspaceDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await dashboardService.getWorkspaceDashboard({
        timeframe: normalizedTimeframe,
        dateRange: dateRange || undefined,
        workspaceId: workspaceId || undefined,
      });
      setData(res);
    } catch (err) {
      setError(err?.message || "Failed to load workspace dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [normalizedTimeframe, dateRange, workspaceId]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await dashboardService.getWorkspaceDashboard({
          timeframe: normalizedTimeframe,
          dateRange: dateRange || undefined,
          workspaceId: workspaceId || undefined,
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
  }, [workspaceId, normalizedTimeframe, dateRange]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchWorkspaceDashboard,
  };
};

export default useWorkspaceDashboardData;
