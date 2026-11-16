// src/hooks/useBranchFilter.js

import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigationPipeline, PIPELINE_LEVELS } from "@/contexts/NavigationPipelineContext";
import useBranch from "@/features/branch/hooks/useBranch";
import useCompany from "@/features/company/hooks/useCompany";

/**
 * Hook to manage multi-branch filtering when at Company level,
 * automatically yielding undefined query filter when at Branch level or when "all" is selected.
 */
export const useBranchFilter = (defaultBranchId = "all") => {
  const { currentLevel } = useNavigationPipeline();
  const { currentCompany } = useCompany();
  const { branches = [], fetchCompanyBranches } = useBranch();
  const [selectedBranchId, setSelectedBranchId] = useState(defaultBranchId);

  const isCompanyLevel = currentLevel === PIPELINE_LEVELS.COMPANY || currentLevel === "company";

  // Automatically fetch branches for current company if not yet loaded
  useEffect(() => {
    if (isCompanyLevel && currentCompany?._id && (!branches || branches.length === 0)) {
      fetchCompanyBranches(currentCompany._id).catch(() => {});
    }
  }, [isCompanyLevel, currentCompany?._id, branches, fetchCompanyBranches]);

  const branchOptions = useMemo(() => {
    const list = [
      { label: "All Branches", value: "all", branchCode: "ALL" },
      ...(branches || []).map((b) => ({
        label: b.name || "Unnamed Branch",
        value: b._id,
        branchCode: b.branchCode || "",
        address: b.address?.city || "",
      })),
    ];
    return list;
  }, [branches]);

  const selectedBranch = useMemo(() => {
    if (!selectedBranchId || selectedBranchId === "all") return null;
    return (branches || []).find((b) => String(b._id) === String(selectedBranchId)) || null;
  }, [branches, selectedBranchId]);

  // Query branch ID: only pass to API if company level AND a specific branch is selected
  const queryBranchId = useMemo(() => {
    if (!isCompanyLevel) return undefined;
    if (!selectedBranchId || selectedBranchId === "all") return undefined;
    return selectedBranchId;
  }, [isCompanyLevel, selectedBranchId]);

  const handleBranchChange = useCallback((newBranchId) => {
    setSelectedBranchId(newBranchId || "all");
  }, []);

  return {
    isCompanyLevel,
    currentLevel,
    selectedBranchId,
    setSelectedBranchId: handleBranchChange,
    queryBranchId,
    branchOptions,
    branches,
    selectedBranch,
  };
};

export default useBranchFilter;
