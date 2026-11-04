// src/features/dashboard/hooks/useCompanyDashboardData.js

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import dashboardService from "../services/dashboardService";

export const useCompanyDashboardData = (timeframe = "This Month", dateRange = null) => {
  const currentWorkspace = useSelector((state) => state.workspace?.currentWorkspace);
  const currentCompany = useSelector((state) => state.company?.currentCompany);
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

  const normalizedTimeframe = String(timeframe || "THIS_MONTH")
    .toUpperCase()
    .replace(/\s+/g, "_");

  let startDate = null;
  let endDate = null;
  if (dateRange && typeof dateRange === "object") {
    startDate = dateRange.startDate || null;
    endDate = dateRange.endDate || null;
  }

  const fetchCompanyDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await dashboardService.getCompanyDashboard({
        timeframe: normalizedTimeframe,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        companyId: companyId || undefined,
      });
      setData(res);
    } catch (err) {
      setError(err?.message || "Failed to load company dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [normalizedTimeframe, startDate, endDate, companyId]);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await dashboardService.getCompanyDashboard({
          timeframe: normalizedTimeframe,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          companyId: companyId || undefined,
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
  }, [workspaceId, companyId, normalizedTimeframe, startDate, endDate]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchCompanyDashboard,
  };
};

export default useCompanyDashboardData;
