// src/features/company/pages/CompanyDetailsPage.jsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { API_STATUS } from "@/constants";
import { useIsMobile } from "@/hooks";
import { UIConfirmDialog } from "@/components/ui";

import useCompany from "../hooks/useCompany";
import CompanyDetailsDesktopPage from "./desktop/CompanyDetailsDesktopPage";
import CompanyDetailsMobilePage from "./mobile/CompanyDetailsMobilePage";

const CompanyDetailsPage = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const isMobile = useIsMobile();
  const hasFetchedRef = useRef(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const {
    managedCompany,
    companies,
    getCompanies,
    getCompanyById,
    getCompanyStatus,
    deleteCompany,
    deleteCompanyStatus,
    error,
    clearError,
    clearManagedCompany,
  } = useCompany();

  useEffect(() => {
    if ((!companies || companies.length === 0) && typeof getCompanies === "function") {
      getCompanies().catch(() => null);
    }
  }, [companies, getCompanies]);

  const canDelete = Array.isArray(companies) && companies.length > 1;

  const hasError = getCompanyStatus === API_STATUS.ERROR;
  const isLoading = getCompanyStatus === API_STATUS.LOADING || (!managedCompany && !hasError);
  const isDeleting = deleteCompanyStatus === API_STATUS.LOADING;

  const fetchCompany = useCallback(async () => {
    if (!companyId) return;
    try {
      await getCompanyById(companyId);
    } catch {
      // Regulated gracefully by state error hooks
    }
  }, [companyId, getCompanyById]);

  useEffect(() => {
    if (hasFetchedRef.current === companyId) return;
    hasFetchedRef.current = companyId;

    fetchCompany();

    return () => {
      clearError();
      clearManagedCompany();
    };
  }, [companyId, fetchCompany, clearError, clearManagedCompany]);

  const handleBack = useCallback(() => {
    navigate("/companies");
  }, [navigate]);

  const handleEdit = useCallback(() => {
    if (!companyId) return;
    navigate(`/companies/${companyId}/edit`);
  }, [companyId, navigate]);

  const handleRefresh = useCallback(() => {
    clearError();
    fetchCompany();
  }, [clearError, fetchCompany]);

  const handleRequestDelete = useCallback(() => {
    if (!canDelete) return;
    setIsDeleteModalOpen(true);
  }, [canDelete]);

  const handleCloseDeleteModal = useCallback(() => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
  }, [isDeleting]);

  const handleConfirmDelete = useCallback(async () => {
    if (!companyId || !canDelete) return;
    try {
      await deleteCompany(companyId);
      setIsDeleteModalOpen(false);
      navigate("/companies", { replace: true });
    } catch {
      // Regulated by store error
    }
  }, [companyId, canDelete, deleteCompany, navigate]);

  const pageProps = useMemo(
    () => ({
      company: managedCompany,
      companyId,
      isLoading,
      hasError,
      error,
      canDelete,
      handleBack,
      handleEdit,
      handleDelete: canDelete ? handleRequestDelete : undefined,
      handleRefresh,
    }),
    [
      managedCompany,
      companyId,
      isLoading,
      hasError,
      error,
      canDelete,
      handleBack,
      handleEdit,
      handleRequestDelete,
      handleRefresh,
    ],
  );

  return (
    <>
      {isMobile ? (
        <CompanyDetailsMobilePage {...pageProps} />
      ) : (
        <CompanyDetailsDesktopPage {...pageProps} />
      )}

      <UIConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Company Record"
        description={
          managedCompany?.name
            ? `Are you sure you want to delete ${managedCompany.name}? This will remove the company entity from your active workspaces.`
            : "Are you sure you want to delete this company profile?"
        }
        confirmText="Delete Company"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting}
      />
    </>
  );
};

export default CompanyDetailsPage;
