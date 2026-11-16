// src/features/workspace/pages/WorkspaceOperationsStarterPage.jsx

import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useIsMobile } from "@/hooks";
import useWorkspace from "../hooks/useWorkspace";
import useCompany from "@/features/company/hooks/useCompany";
import workspaceProductService from "@/features/workspace-products/services/workspaceProductService";

import WorkspaceOperationsStarterDesktopPage from "./desktop/WorkspaceOperationsStarterDesktopPage";
import WorkspaceOperationsStarterMobilePage from "./mobile/WorkspaceOperationsStarterMobilePage";

export const WorkspaceOperationsStarterPage = () => {
  const isMobile = useIsMobile();

  const { currentWorkspace, getWorkspaceMembers, members } = useWorkspace();
  const {
    companies,
    getWorkspaceCompanies,
    getWorkspaceCompaniesStatus,
  } = useCompany();

  const workspaceId = currentWorkspace?._id || currentWorkspace?.id;

  const [productsTotal, setProductsTotal] = useState(0);
  const [isProductsLoaded, setIsProductsLoaded] = useState(false);

  const reduxProductsCount = useSelector(
    (state) =>
      state.workspaceProduct?.products?.length ||
      state.workspaceProduct?.total ||
      0
  );

  const subscription = useSelector(
    (state) => state.subscription?.subscription || {}
  );

  const fetchRealProductsCount = useCallback(async () => {
    try {
      const res = await workspaceProductService.getWorkspaceProducts({ limit: 1 });
      const d = res.data?.data || res.data || {};
      const total = d.meta?.total ?? d.total ?? (Array.isArray(d.data) ? d.data.length : (Array.isArray(d) ? d.length : 0));
      setProductsTotal(Number(total || 0));
      setIsProductsLoaded(true);
    } catch {
      setProductsTotal(reduxProductsCount);
      setIsProductsLoaded(true);
    }
  }, [reduxProductsCount]);

  useEffect(() => {
    let isSubscribed = true;
    if (typeof getWorkspaceCompanies === "function") {
      getWorkspaceCompanies().catch(() => null);
    }
    if (workspaceId && typeof getWorkspaceMembers === "function") {
      getWorkspaceMembers(workspaceId).catch(() => null);
    }
    workspaceProductService
      .getWorkspaceProducts({ limit: 1 })
      .then((res) => {
        if (!isSubscribed) return;
        const d = res.data?.data || res.data || {};
        const total = d.meta?.total ?? d.total ?? (Array.isArray(d.data) ? d.data.length : (Array.isArray(d) ? d.length : 0));
        setProductsTotal(Number(total || 0));
        setIsProductsLoaded(true);
      })
      .catch(() => {
        if (!isSubscribed) return;
        setProductsTotal(reduxProductsCount);
        setIsProductsLoaded(true);
      });

    return () => {
      isSubscribed = false;
    };
  }, [workspaceId, getWorkspaceCompanies, getWorkspaceMembers, reduxProductsCount]);

  const handleRefresh = useCallback(() => {
    if (typeof getWorkspaceCompanies === "function") {
      getWorkspaceCompanies().catch(() => null);
    }
    if (workspaceId && typeof getWorkspaceMembers === "function") {
      getWorkspaceMembers(workspaceId).catch(() => null);
    }
    fetchRealProductsCount();
  }, [workspaceId, getWorkspaceCompanies, getWorkspaceMembers, fetchRealProductsCount]);

  const membersCount = Array.isArray(members) && members.length > 0 ? members.length : 1;
  const productsCount = isProductsLoaded ? productsTotal : reduxProductsCount;

  const pageProps = {
    workspace: currentWorkspace,
    companies: companies || [],
    membersCount,
    productsCount,
    subscription,
    isLoading: getWorkspaceCompaniesStatus === "loading",
    onRefresh: handleRefresh,
  };

  return isMobile ? (
    <WorkspaceOperationsStarterMobilePage {...pageProps} />
  ) : (
    <WorkspaceOperationsStarterDesktopPage {...pageProps} />
  );
};

export default WorkspaceOperationsStarterPage;
