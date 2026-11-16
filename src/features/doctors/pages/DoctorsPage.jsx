// src/features/doctors/pages/DoctorsPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks";
import { UIConfirmDialog } from "@/components/ui";
import { useNavigationPipeline, PIPELINE_LEVELS } from "@/contexts/NavigationPipelineContext";
import { useCompanyFilter } from "@/hooks";
import useCompany from "@/features/company/hooks/useCompany";
import doctorService from "../services/doctorService";
import useDoctor from "../hooks/useDoctor";
import DoctorsDesktopPage from "./desktop/DoctorsDesktopPage";
import DoctorsMobilePage from "./mobile/DoctorsMobilePage";
import DoctorDialog from "../components/DoctorDialog";

const INITIAL_FILTERS = {
  search: "",
  specialty: "all",
  status: "all",
  sort: "createdAt-desc",
};

export const DoctorsPage = () => {
  const isMobile = useIsMobile();
  const { currentLevel } = useNavigationPipeline();
  const isWorkspaceLevel =
    currentLevel === PIPELINE_LEVELS.WORKSPACE || currentLevel === "workspace";
  const companyFilter = useCompanyFilter();

  const { currentCompany } = useCompany();
  const companyId = currentCompany?._id;

  const { createDoctor, updateDoctor, deleteDoctor } = useDoctor();

  const [doctors, setDoctors] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    hospitalsCount: 0,
    specialtiesCount: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch((filters.search || "").trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Dialog State: { isOpen, mode: 'create' | 'edit' | 'view', doctorData }
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: "create",
    doctorData: null,
  });

  // Delete Confirm State
  const [deleteConfirmState, setDeleteConfirmState] = useState({
    isOpen: false,
    doctor: null,
    isDeleting: false,
  });

  const fetchBatch = useCallback(
    async (pageToLoad = 1, isAppend = false) => {
      if (!isWorkspaceLevel && !companyId) return;

      if (isAppend) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const params = {
        page: pageToLoad,
        limit: 20,
        sort: filters.sort || "createdAt-desc",
      };

      if (isWorkspaceLevel && companyFilter.queryCompanyId) {
        params.companyId = companyFilter.queryCompanyId;
      }

      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.specialty && filters.specialty !== "all") {
        params.specialty = filters.specialty;
      }
      if (filters.status && filters.status !== "all") {
        params.status = filters.status;
      }

      try {
        const res = await doctorService.getDoctors(params);
        const data = res.data?.data || {};
        const rawList = Array.isArray(data.doctors)
          ? data.doctors
          : Array.isArray(data)
          ? data
          : [];
        const totalCount = Number(data.total ?? rawList.length);

        if (data.summary) {
          setSummary(data.summary);
        }
        setTotal(totalCount);
        setCurrentPage(pageToLoad);

        if (isAppend) {
          setDoctors((prev) => {
            const next = [...prev, ...rawList];
            setHasMore(next.length < totalCount);
            return next;
          });
        } else {
          setDoctors(rawList);
          setHasMore(rawList.length < totalCount);
        }
      } catch (err) {
        console.error("Failed to load doctors:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      companyId,
      isWorkspaceLevel,
      companyFilter.queryCompanyId,
      debouncedSearch,
      filters.specialty,
      filters.status,
      filters.sort,
    ]
  );

  // Initial load and filter change trigger (resets to page 1)
  useEffect(() => {
    fetchBatch(1, false);
  }, [fetchBatch, companyFilter.selectedCompanyId]);

  // Infinite scroll load more handler
  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore) return;
    fetchBatch(currentPage + 1, true);
  }, [hasMore, isLoading, isLoadingMore, currentPage, fetchBatch]);

  // Handlers for toolbar
  const handleSearchChange = (val) => {
    setFilters((prev) => ({ ...prev, search: val }));
  };

  const handleSpecialtyChange = (val) => {
    setFilters((prev) => ({ ...prev, specialty: val }));
  };

  const handleStatusChange = (val) => {
    setFilters((prev) => ({ ...prev, status: val }));
  };

  const handleSortChange = (val) => {
    setFilters((prev) => ({ ...prev, sort: val }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleRefresh = () => {
    fetchBatch(1, false);
  };

  // Dialog triggers
  const handleOpenCreateDialog = () => {
    setDialogState({ isOpen: true, mode: "create", doctorData: null });
  };

  const handleOpenEditDialog = (doctor) => {
    setDialogState({ isOpen: true, mode: "edit", doctorData: doctor });
  };

  const handleOpenViewDialog = (doctor) => {
    setDialogState({ isOpen: true, mode: "view", doctorData: doctor });
  };

  const handleCloseDialog = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  // Delete handlers
  const handleOpenDeleteConfirm = (doctor) => {
    setDeleteConfirmState({ isOpen: true, doctor, isDeleting: false });
  };

  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmState({ isOpen: false, doctor: null, isDeleting: false });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmState.doctor) return;
    const id = deleteConfirmState.doctor._id || deleteConfirmState.doctor.id;
    setDeleteConfirmState((prev) => ({ ...prev, isDeleting: true }));

    try {
      await deleteDoctor(id);
      handleCloseDeleteConfirm();
      fetchBatch(1, false);
    } catch (err) {
      setDeleteConfirmState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const pageProps = {
    doctors,
    total,
    page: currentPage,
    hasMore,
    summary,
    isLoading,
    isLoadingMore,
    filters,
    onSearchChange: handleSearchChange,
    onSpecialtyChange: handleSpecialtyChange,
    onStatusChange: handleStatusChange,
    onSortChange: handleSortChange,
    onResetFilters: handleResetFilters,
    onRefresh: handleRefresh,
    onLoadMore: handleLoadMore,
    onPageChange: (newPage) => fetchBatch(newPage, false),
    onOpenCreateDialog: handleOpenCreateDialog,
    onOpenEditDialog: handleOpenEditDialog,
    onOpenViewDialog: handleOpenViewDialog,
    onOpenDeleteConfirm: handleOpenDeleteConfirm,
    companyFilter,
  };

  return (
    <>
      {isMobile ? (
        <DoctorsMobilePage {...pageProps} />
      ) : (
        <DoctorsDesktopPage {...pageProps} />
      )}

      {/* Unified Doctor Dialog */}
      <DoctorDialog
        isOpen={dialogState.isOpen}
        onClose={handleCloseDialog}
        mode={dialogState.mode}
        doctorData={dialogState.doctorData}
        onSubmitCreate={createDoctor}
        onSubmitUpdate={updateDoctor}
        onSuccess={() => fetchBatch(1, false)}
      />

      {/* Delete Confirmation Modal */}
      <UIConfirmDialog
        isOpen={deleteConfirmState.isOpen}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Doctor Record"
        description={`Are you sure you want to delete "${deleteConfirmState.doctor?.name}"? This doctor will no longer appear in POS billing suggestions.`}
        confirmText="Delete Doctor"
        confirmVariant="danger"
        isLoading={deleteConfirmState.isDeleting}
      />
    </>
  );
};

export default DoctorsPage;
