// src/features/branch/pages/BranchesPage.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS } from "@/constants";
import { useIsMobile } from "@/hooks";
import { UIConfirmDialog, UI_TOOLBAR_VIEWS } from "@/components/ui";
import { useNavigationPipeline, PIPELINE_LEVELS } from "@/contexts/NavigationPipelineContext";
import { useCompanyFilter } from "@/hooks";

import useBranch from "../hooks/useBranch";
import useCompany from "@/features/company/hooks/useCompany";
import { BranchesMobilePage } from "./mobile";
import { BranchesDesktopPage } from "./desktop";

const statusOptions = [
  { label: "Status: All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Suspended", value: "suspended" },
];

const branchTypeOptions = [
  { label: "Type: All", value: "all" },
  { label: "Retail / Pharmacy", value: "retail" },
  { label: "Hospital / Clinical", value: "hospital" },
  { label: "Wholesale / Distribution", value: "wholesale" },
  { label: "Warehouse", value: "warehouse" },
  { label: "Dispensary", value: "dispensary" },
  { label: "Other", value: "other" },
];

const initialFilters = {
  search: "",
  status: "all",
  company: "all",
  type: "all",
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const slugify = (value) =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatBranchAddress = (address) => {
  if (!address) return { line1: "", summary: "" };

  const line1Parts = [address.addressLine1, address.addressLine2].filter(
    Boolean,
  );
  const line1 = line1Parts.join(", ") || "";

  const cityStr = address.city || "";
  const pinStr = address.pincode ? ` ${address.pincode}` : "";
  const summary = `${cityStr}${pinStr}`.trim();

  return { line1, summary };
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const mapBranchForView = (branch) => {
  const addressBlock = formatBranchAddress(branch?.address);
  const companyNameStr = branch?.companyId?.name || branch?.companyName || "";

  return {
    ...branch,
    displayName: branch?.name || "",
    displayCompany: companyNameStr,
    companySlug: slugify(companyNameStr),
    displayCode: branch?.branchCode || "",
    addressLine1: addressBlock.line1,
    locationSummary: addressBlock.summary,
    displayManager: branch?.pharmacist?.name || branch?.manager?.name || "",
    displayManagerRole: branch?.pharmacist?.name ? "Pharmacist" : "Manager",
    displayStatus: branch?.status || "active",
    memberCount:
      branch?.memberCount ?? branch?.staffCount ?? branch?.membersCount ?? 0,
    displayCreatedAt: formatDate(branch?.createdAt),
    displayUpdatedAt: formatDate(branch?.updatedAt),
  };
};

const BranchesPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const hasFetchedRef = useRef(false);

  const { currentLevel } = useNavigationPipeline();
  const isWorkspaceLevel =
    currentLevel === PIPELINE_LEVELS.WORKSPACE || currentLevel === "workspace";
  const companyFilter = useCompanyFilter();

  const { currentCompany } = useCompany();

  const {
    branches,
    getCompanyBranches,
    getWorkspaceBranches,
    deleteBranch,
    getCompanyBranchesStatus,
    getWorkspaceBranchesStatus,
    deleteBranchStatus,
    error,
    message,
    clearError,
    clearMessage,
  } = useBranch();

  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState("name_asc");
  const [viewMode, setViewMode] = useState(UI_TOOLBAR_VIEWS.GRID);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBranchForEmployees, setSelectedBranchForEmployees] = useState(null);
  const [isEmployeeDrawerOpen, setIsEmployeeDrawerOpen] = useState(false);

  const isLoading = isWorkspaceLevel
    ? getWorkspaceBranchesStatus === API_STATUS.LOADING ||
      getCompanyBranchesStatus === API_STATUS.LOADING
    : getCompanyBranchesStatus === API_STATUS.LOADING || !currentCompany?._id;
  const isDeleting = deleteBranchStatus === API_STATUS.LOADING;
  const hasError = isWorkspaceLevel
    ? getWorkspaceBranchesStatus === API_STATUS.ERROR
    : getCompanyBranchesStatus === API_STATUS.ERROR;

  const fetchBranches = useCallback(async () => {
    if (isWorkspaceLevel) {
      try {
        if (!companyFilter.selectedCompanyId || companyFilter.selectedCompanyId === "all") {
          await getWorkspaceBranches();
        } else {
          await getCompanyBranches(companyFilter.selectedCompanyId);
        }
      } catch {
        // Regulated by store selectors
      }
      return;
    }

    if (!currentCompany?._id) return;

    try {
      await getCompanyBranches();
    } catch {
      // Regulated by store selectors
    }
  }, [
    isWorkspaceLevel,
    companyFilter.selectedCompanyId,
    getWorkspaceBranches,
    getCompanyBranches,
    currentCompany?._id,
  ]);

  useEffect(() => {
    if (isWorkspaceLevel) {
      fetchBranches();
      return;
    }

    if (!currentCompany?._id) return;
    if (hasFetchedRef.current === currentCompany._id) return;

    hasFetchedRef.current = currentCompany._id;
    fetchBranches();
  }, [isWorkspaceLevel, companyFilter.selectedCompanyId, currentCompany?._id, fetchBranches]);

  const mappedBranches = useMemo(
    () => (Array.isArray(branches) ? branches : []).map(mapBranchForView),
    [branches],
  );

  const companyOptions = useMemo(() => {
    const options = [{ label: "Company: All", value: "all" }];
    const uniqueCompanies = new Map();

    mappedBranches.forEach((branch) => {
      if (branch.displayCompany && branch.companySlug) {
        uniqueCompanies.set(branch.companySlug, branch.displayCompany);
      }
    });

    uniqueCompanies.forEach((name, slug) => {
      options.push({ label: name, value: slug });
    });

    return options;
  }, [mappedBranches]);

  const filteredAndSortedBranches = useMemo(() => {
    const search = normalizeText(filters.search);

    const filtered = mappedBranches.filter((branch) => {
      const matchesSearch =
        !search ||
        normalizeText(branch.displayName).includes(search) ||
        normalizeText(branch.displayCode).includes(search) ||
        normalizeText(branch.displayManager).includes(search) ||
        normalizeText(branch.addressLine1).includes(search) ||
        normalizeText(branch.locationSummary).includes(search) ||
        normalizeText(branch.displayCompany).includes(search);

      const matchesStatus =
        filters.status === "all" || branch.displayStatus === filters.status;

      const matchesCompany =
        filters.company === "all" || branch.companySlug === filters.company;

      const matchesType =
        filters.type === "all" || normalizeText(branch.type) === filters.type;

      return matchesSearch && matchesStatus && matchesCompany && matchesType;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return (a.displayName || "").localeCompare(b.displayName || "");
        case "name_desc":
          return (b.displayName || "").localeCompare(a.displayName || "");
        case "newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "oldest":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "members":
          return (b.memberCount || 0) - (a.memberCount || 0);
        default:
          return 0;
      }
    });
  }, [mappedBranches, filters, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedBranches.length / pageSize)
  );

  const paginatedBranches = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredAndSortedBranches.slice(startIdx, startIdx + pageSize);
  }, [filteredAndSortedBranches, currentPage, pageSize]);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const stats = useMemo(() => {
    const total = mappedBranches.length;
    const active = mappedBranches.filter(
      (b) => b.displayStatus === "active",
    ).length;
    const inactive = mappedBranches.filter(
      (b) => b.displayStatus === "inactive",
    ).length;
    const suspended = mappedBranches.filter(
      (b) => b.displayStatus === "suspended",
    ).length;

    return [
      {
        id: "total",
        title: "Total Branches",
        value: total,
        description: "All Locations",
        colorVariant: "primary",
      },
      {
        id: "active",
        title: "Active Locations",
        value: active,
        description: "Operational units",
        colorVariant: "success",
      },
      {
        id: "inactive",
        title: "Inactive Units",
        value: inactive,
        description: "Temporarily closed",
        colorVariant: "warning",
      },
      {
        id: "suspended",
        title: "Suspended",
        value: suspended,
        description: "Compliance hold",
        colorVariant: "danger",
      },
    ];
  }, [mappedBranches]);

  const activeFilterChips = useMemo(() => {
    const chips = [];

    if (filters.search) {
      chips.push({ key: "search", label: `Search: ${filters.search}` });
    }
    if (filters.status !== "all") {
      chips.push({
        key: "status",
        label:
          statusOptions.find((o) => o.value === filters.status)?.label ||
          filters.status,
      });
    }
    if (filters.company !== "all") {
      chips.push({
        key: "company",
        label:
          companyOptions.find((o) => o.value === filters.company)?.label ||
          filters.company,
      });
    }
    if (filters.type !== "all") {
      chips.push({
        key: "type",
        label:
          branchTypeOptions.find((o) => o.value === filters.type)?.label ||
          filters.type,
      });
    }

    return chips;
  }, [filters, companyOptions]);

  const handleFilterChange = useCallback((eventOrValue) => {
    setCurrentPage(1);
    if (eventOrValue?.target) {
      const { name, value } = eventOrValue.target;
      setFilters((prev) => ({ ...prev, [name]: value }));
      return;
    }
    setFilters((prev) => ({ ...prev, ...eventOrValue }));
  }, []);

  const handleSearchChange = useCallback((value) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, search: value ?? "" }));
  }, []);

  const handleRemoveFilter = useCallback((key) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [key]: initialFilters[key] }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setCurrentPage(1);
    setFilters(initialFilters);
  }, []);

  const handleCreateBranch = useCallback(() => {
    navigate("/branches/create");
  }, [navigate]);

  const handleViewBranch = useCallback(
    (branch) => {
      if (!branch?._id) return;
      navigate(`/branches/${branch._id}`);
    },
    [navigate],
  );

  const handleEditBranch = useCallback(
    (branch) => {
      if (!branch?._id) return;
      navigate(`/branches/${branch._id}/edit`);
    },
    [navigate],
  );

  const handleOpenSettings = useCallback(
    (branch) => {
      if (!branch?._id) return;
      navigate(`/branches/${branch._id}/settings`);
    },
    [navigate],
  );

  const handleOpenEmployeesDrawer = useCallback((branch) => {
    setSelectedBranchForEmployees(branch || null);
    setIsEmployeeDrawerOpen(true);
  }, []);

  const handleCloseEmployeesDrawer = useCallback(() => {
    setIsEmployeeDrawerOpen(false);
    setSelectedBranchForEmployees(null);
  }, []);

  const handleRequestDeleteBranch = useCallback((branch) => {
    if (mappedBranches.length <= 1) return;
    setSelectedBranch(branch || null);
    setIsDeleteModalOpen(true);
  }, [mappedBranches.length]);

  const handleCloseDeleteModal = useCallback(() => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setSelectedBranch(null);
  }, [isDeleting]);

  const handleConfirmDeleteBranch = useCallback(async () => {
    if (!selectedBranch?._id) return;
    try {
      await deleteBranch(selectedBranch._id);
      setIsDeleteModalOpen(false);
      setSelectedBranch(null);
      fetchBranches();
    } catch {
      // Managed gracefully by standard slice errors
    }
  }, [deleteBranch, fetchBranches, selectedBranch]);

  const handleRefresh = useCallback(() => {
    hasFetchedRef.current = false;
    clearError();
    clearMessage();
    fetchBranches();
  }, [clearError, clearMessage, fetchBranches]);

  const pageProps = {
    branches: filteredAndSortedBranches,
    paginatedBranches,
    allBranches: mappedBranches,
    stats,

    filters,
    sortBy,
    onSortChange: (val) => {
      setSortBy(val);
      setCurrentPage(1);
    },
    viewMode,
    onViewModeChange: setViewMode,

    currentPage,
    pageSize,
    totalPages,
    handlePageChange,
    handlePageSizeChange,

    activeFilterChips,
    statusOptions,
    companyOptions,
    branchTypeOptions,
    companyFilter,

    isLoading,
    isDeleting,
    hasError,
    error,
    message,

    totalBranches: mappedBranches.length,
    filteredBranchesCount: filteredAndSortedBranches.length,
    hasBranches: mappedBranches.length > 0,
    hasFilteredBranches: filteredAndSortedBranches.length > 0,
    isWorkspaceLevel,
    canCreateBranch: !isWorkspaceLevel,
    canDeleteBranch: mappedBranches.length > 1,

    handleFilterChange,
    handleSearchChange,
    handleRemoveFilter,
    handleClearFilters,

    handleCreateBranch,
    handleViewBranch,
    handleEditBranch,
    handleOpenSettings,
    handleViewEmployees: handleOpenEmployeesDrawer,
    handleDeleteBranch: handleRequestDeleteBranch,
    handleRefresh,

    selectedBranchForEmployees,
    isEmployeeDrawerOpen,
    handleCloseEmployeesDrawer,

    clearMessage,
  };

  return (
    <>
      {isMobile ? (
        <BranchesMobilePage {...pageProps} />
      ) : (
        <BranchesDesktopPage {...pageProps} />
      )}

      <UIConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteBranch}
        title="Delete Branch Record"
        description={
          selectedBranch
            ? `Are you sure you want to delete ${selectedBranch.displayName || "this branch"}? Active stocks will be locked.`
            : "Are you sure you want to delete this branch location?"
        }
        confirmText="Delete Branch"
        cancelText="Keep Branch"
        variant="destructive"
        loading={isDeleting}
      />
    </>
  );
};

export default BranchesPage;
