// src/features/branch/pages/BranchDetailsPage.jsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { API_STATUS } from "@/constants";
import { useIsMobile } from "@/hooks";
import { UIConfirmDialog } from "@/components/ui";

import useBranch from "../hooks/useBranch";
import BranchDetailsDesktopPage from "./desktop/BranchDetailsDesktopPage";
import BranchDetailsMobilePage from "./mobile/BranchDetailsMobilePage";

const BranchDetailsPage = () => {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const isMobile = useIsMobile();
  const hasFetchedRef = useRef(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const {
    managedBranch,
    branches,
    getWorkspaceBranches,
    getBranchById,
    getBranchStatus,
    deleteBranch,
    deleteBranchStatus,
    error,
    clearError,
    clearManagedBranch,
  } = useBranch();

  useEffect(() => {
    if ((!branches || branches.length === 0) && typeof getWorkspaceBranches === "function") {
      getWorkspaceBranches().catch(() => null);
    }
  }, [branches, getWorkspaceBranches]);

  const canDelete = Array.isArray(branches) && branches.length > 1;

  const hasError = getBranchStatus === API_STATUS.ERROR;
  const isLoading = getBranchStatus === API_STATUS.LOADING || (!managedBranch && !hasError);
  const isDeleting = deleteBranchStatus === API_STATUS.LOADING;

  const fetchBranchData = useCallback(async () => {
    if (!branchId) return;
    try {
      await getBranchById(branchId);
    } catch {
      // Regulated gracefully by state error hooks
    }
  }, [branchId, getBranchById]);

  useEffect(() => {
    if (hasFetchedRef.current === branchId) return;
    hasFetchedRef.current = branchId;

    fetchBranchData();

    return () => {
      clearError();
      clearManagedBranch();
    };
  }, [branchId, fetchBranchData, clearError, clearManagedBranch]);

  const handleBack = useCallback(() => {
    navigate("/branches");
  }, [navigate]);

  const handleEdit = useCallback(() => {
    if (!branchId) return;
    navigate(`/branches/${branchId}/edit`);
  }, [branchId, navigate]);

  const handleRefresh = useCallback(() => {
    clearError();
    fetchBranchData();
  }, [clearError, fetchBranchData]);

  const handleRequestDelete = useCallback(() => {
    if (!canDelete) return;
    setIsDeleteModalOpen(true);
  }, [canDelete]);

  const handleCloseDeleteModal = useCallback(() => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
  }, [isDeleting]);

  const handleConfirmDelete = useCallback(async () => {
    if (!branchId || !canDelete) return;
    try {
      await deleteBranch(branchId);
      setIsDeleteModalOpen(false);
      navigate("/branches", { replace: true });
    } catch {
      // Regulated by store error
    }
  }, [branchId, canDelete, deleteBranch, navigate]);

  const pageProps = useMemo(
    () => ({
      branch: managedBranch,
      branchId,
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
      managedBranch,
      branchId,
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
        <BranchDetailsMobilePage {...pageProps} />
      ) : (
        <BranchDetailsDesktopPage {...pageProps} />
      )}

      <UIConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Branch Record"
        description={
          managedBranch?.name
            ? `Are you sure you want to delete ${managedBranch.name}? This will remove the branch outlet from your active workspaces.`
            : "Are you sure you want to delete this branch location profile?"
        }
        confirmText="Delete Branch"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting}
      />
    </>
  );
};

export default BranchDetailsPage;
