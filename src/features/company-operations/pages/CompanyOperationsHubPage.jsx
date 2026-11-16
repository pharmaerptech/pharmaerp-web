// src/features/company-operations/pages/CompanyOperationsHubPage.jsx

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import useCompany from "@/features/company/hooks/useCompany";
import {
  COMPANY_OPERATION_CATEGORIES,
  COMPANY_OPERATIONS_MODULES,
} from "../constants/companyOperationsData";
import CompanyOperationsHubDesktopPage from "./desktop/CompanyOperationsHubDesktopPage";
import CompanyOperationsHubMobilePage from "./mobile/CompanyOperationsHubMobilePage";

export const CompanyOperationsHubPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentWorkspace } = useWorkspace();
  const { companies, fetchWorkspaceCompanies } = useCompany();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load companies if not yet present
  useEffect(() => {
    if (!companies || companies.length === 0) {
      fetchWorkspaceCompanies().catch(() => {});
    }
  }, [companies, fetchWorkspaceCompanies]);

  // Filter modules based on category and search query
  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return COMPANY_OPERATIONS_MODULES.filter((mod) => {
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
      await fetchWorkspaceCompanies();
    } catch {
      // ignore
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }, [fetchWorkspaceCompanies]);

  const handleSelectModule = useCallback(
    (mod) => {
      if (mod?.path) {
        navigate(mod.path);
      }
    },
    [navigate],
  );

  const handleNavigateCompanies = useCallback(() => {
    navigate("/companies");
  }, [navigate]);

  const pageProps = {
    workspaceName: currentWorkspace?.name || "Workspace",
    companies: companies || [],
    categories: COMPANY_OPERATION_CATEGORIES,
    filteredModules,
    selectedCategory,
    searchQuery,
    isLoading,
    onCategorySelect: setSelectedCategory,
    onSearchChange: setSearchQuery,
    onClearSearch: () => setSearchQuery(""),
    onRefresh: handleRefresh,
    onSelectModule: handleSelectModule,
    onNavigateCompanies: handleNavigateCompanies,
  };

  return isMobile ? (
    <CompanyOperationsHubMobilePage {...pageProps} />
  ) : (
    <CompanyOperationsHubDesktopPage {...pageProps} />
  );
};

export default CompanyOperationsHubPage;
