// src/features/branch-operations/pages/BranchOperationsHubPage.jsx

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import {
  OPERATION_CATEGORIES,
  BRANCH_OPERATIONS_MODULES,
} from "../constants/branchOperationsData";
import BranchOperationsHubDesktopPage from "./desktop/BranchOperationsHubDesktopPage";
import BranchOperationsHubMobilePage from "./mobile/BranchOperationsHubMobilePage";

export const BranchOperationsHubPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentCompany } = useCompany();
  const { branches, fetchCompanyBranches } = useBranch();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load branches if not yet present
  useEffect(() => {
    const companyId = currentCompany?._id || currentCompany?.id;
    if (companyId && (!branches || branches.length === 0)) {
      fetchCompanyBranches(companyId).catch(() => {});
    }
  }, [currentCompany, branches, fetchCompanyBranches]);

  // Filter modules based on selected category and search input
  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return BRANCH_OPERATIONS_MODULES.filter((mod) => {
      // 1. Category Filter
      if (selectedCategory !== "all" && mod.categoryId !== selectedCategory) {
        return false;
      }

      // 2. Search Filter
      if (!query) {
        return true;
      }

      const matchTitle = mod.title.toLowerCase().includes(query);
      const matchSubtitle = mod.subtitle?.toLowerCase().includes(query);
      const matchDesc = mod.description.toLowerCase().includes(query);
      const matchBadge = mod.badge.toLowerCase().includes(query);
      const matchKeywords = mod.keywords?.some((k) => k.toLowerCase().includes(query));

      return (
        matchTitle ||
        matchSubtitle ||
        matchDesc ||
        matchBadge ||
        matchKeywords
      );
    });
  }, [selectedCategory, searchQuery]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const companyId = currentCompany?._id || currentCompany?.id;
      if (companyId) {
        await fetchCompanyBranches(companyId);
      }
    } catch {
      // ignore
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, [currentCompany, fetchCompanyBranches]);

  const handleSelectModule = useCallback(
    (mod) => {
      if (mod?.path) {
        navigate(mod.path);
      }
    },
    [navigate],
  );

  const handleNavigateBranches = useCallback(() => {
    navigate("/branches");
  }, [navigate]);

  const pageProps = {
    companyName: currentCompany?.name || currentCompany?.legalName || "Company",
    branches: branches || [],
    categories: OPERATION_CATEGORIES,
    filteredModules,
    selectedCategory,
    searchQuery,
    isLoading,
    onCategorySelect: setSelectedCategory,
    onSearchChange: setSearchQuery,
    onClearSearch: () => setSearchQuery(""),
    onRefresh: handleRefresh,
    onSelectModule: handleSelectModule,
    onNavigateBranches: handleNavigateBranches,
  };

  return isMobile ? (
    <BranchOperationsHubMobilePage {...pageProps} />
  ) : (
    <BranchOperationsHubDesktopPage {...pageProps} />
  );
};

export default BranchOperationsHubPage;
