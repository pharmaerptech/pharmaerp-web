// src/hooks/useCompanyFilter.js

import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigationPipeline, PIPELINE_LEVELS } from "@/contexts/NavigationPipelineContext";
import useCompany from "@/features/company/hooks/useCompany";

/**
 * Hook to manage multi-company filtering when at Workspace level,
 * automatically yielding undefined query filter when at Company or Branch level or when "all" is selected.
 */
export const useCompanyFilter = (defaultCompanyId = "all") => {
  const { currentLevel } = useNavigationPipeline();
  const { companies = [], fetchWorkspaceCompanies } = useCompany();
  const [selectedCompanyId, setSelectedCompanyId] = useState(defaultCompanyId);

  const isWorkspaceLevel =
    currentLevel === PIPELINE_LEVELS.WORKSPACE || currentLevel === "workspace";

  // Automatically fetch companies for workspace if not yet loaded
  useEffect(() => {
    if (isWorkspaceLevel && (!companies || companies.length === 0)) {
      fetchWorkspaceCompanies().catch(() => {});
    }
  }, [isWorkspaceLevel, companies, fetchWorkspaceCompanies]);

  const companyOptions = useMemo(() => {
    const list = [
      { label: "All Companies", value: "all", companyCode: "ALL" },
      ...(companies || []).map((c) => ({
        label: c.name || c.legalName || "Unnamed Company",
        value: c._id,
        companyCode: c.code || "",
        status: c.status || "active",
      })),
    ];
    return list;
  }, [companies]);

  const selectedCompany = useMemo(() => {
    if (!selectedCompanyId || selectedCompanyId === "all") return null;
    return (
      (companies || []).find((c) => String(c._id) === String(selectedCompanyId)) ||
      null
    );
  }, [companies, selectedCompanyId]);

  // Query company ID: only pass to API if workspace level AND a specific company is selected
  const queryCompanyId = useMemo(() => {
    if (!isWorkspaceLevel) return undefined;
    if (!selectedCompanyId || selectedCompanyId === "all") return undefined;
    return selectedCompanyId;
  }, [isWorkspaceLevel, selectedCompanyId]);

  const handleCompanyChange = useCallback((newCompanyId) => {
    setSelectedCompanyId(newCompanyId || "all");
  }, []);

  return {
    isWorkspaceLevel,
    currentLevel,
    selectedCompanyId,
    setSelectedCompanyId: handleCompanyChange,
    queryCompanyId,
    companyOptions,
    companies,
    selectedCompany,
  };
};

export default useCompanyFilter;
