// src/features/company/pages/CompaniesPage.jsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile } from "@/hooks";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import { UIConfirmDialog, UI_TOOLBAR_VIEWS } from "@/components/ui";

import useCompany from "../hooks/useCompany";
import { CompaniesMobilePage } from "./mobile";
import { CompaniesDesktopPage } from "./desktop";

const statusOptions = [
  { label: "Status: All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Suspended", value: "suspended" },
];

const companyTypeOptions = [
  { label: "Type: All", value: "all" },
  { label: "Proprietorship", value: "proprietorship" },
  { label: "Partnership", value: "partnership" },
  { label: "LLP", value: "llp" },
  { label: "Private Limited", value: "private_limited" },
  { label: "Public Limited", value: "public_limited" },
  { label: "OPC", value: "opc" },
  { label: "Trust", value: "trust" },
  { label: "Society", value: "society" },
  { label: "Other", value: "other" },
];

const initialFilters = {
  search: "",
  status: "all",
  type: "all",
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const formatCompanyType = (type) => {
  if (!type) return "";
  return String(type)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatAddressBlock = (address) => {
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

const mapCompanyForView = (company) => {
  const addressBlock = formatAddressBlock(company?.address);

  return {
    ...company,
    displayName: company?.name || "",
    displayType: formatCompanyType(company?.type),
    addressLine1: addressBlock.line1,
    locationSummary: addressBlock.summary,
    displayCreatedAt: formatDate(company?.createdAt),
    displayUpdatedAt: formatDate(company?.updatedAt),
    displayPhone:
      company?.phones?.mobile ||
      company?.phones?.whatsapp ||
      company?.phones?.landline ||
      "",
    displayEmail: company?.email || "",
    displayWebsite: company?.website || "",
    displayGstin: company?.gstin || "",
    displayPan: company?.pan || "",
    displayOwnerName: company?.owner?.name || "",
    displayOwnerContact: company?.owner?.mobile || company?.owner?.email || "",
  };
};

const CompaniesPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const hasFetchedRef = useRef(false);
  const { isSetupComplete, companyCompleted } = useSetupStatus();

  // Enforce Sequential Setup: Cannot create another company before initial branch setup is complete
  const canCreateCompany = isSetupComplete || !companyCompleted;

  const {
    companies,
    getWorkspaceCompanies,
    deleteCompany,
    getWorkspaceCompaniesStatus,
    deleteCompanyStatus,
    error,
    message,
    clearError,
    clearMessage,
  } = useCompany();

  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState("name_asc");
  const [viewMode, setViewMode] = useState(UI_TOOLBAR_VIEWS.GRID);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCompanyForEmployees, setSelectedCompanyForEmployees] = useState(null);
  const [isEmployeeDrawerOpen, setIsEmployeeDrawerOpen] = useState(false);

  const isLoading = getWorkspaceCompaniesStatus === API_STATUS.LOADING;
  const isDeleting = deleteCompanyStatus === API_STATUS.LOADING;
  const hasError = getWorkspaceCompaniesStatus === API_STATUS.ERROR;

  const fetchCompanies = useCallback(async () => {
    try {
      await getWorkspaceCompanies();
    } catch {
      // Regulated by store selectors
    }
  }, [getWorkspaceCompanies]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => {
      clearMessage();
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [message, clearMessage]);

  const mappedCompanies = useMemo(
    () => (Array.isArray(companies) ? companies : []).map(mapCompanyForView),
    [companies],
  );

  const filteredAndSortedCompanies = useMemo(() => {
    const search = normalizeText(filters.search);

    const filtered = mappedCompanies.filter((company) => {
      const matchesSearch =
        !search ||
        normalizeText(company.displayName).includes(search) ||
        normalizeText(company.companyCode).includes(search) ||
        normalizeText(company.displayEmail).includes(search) ||
        normalizeText(company.displayGstin).includes(search) ||
        normalizeText(company.displayPan).includes(search) ||
        normalizeText(company.displayOwnerName).includes(search) ||
        normalizeText(company.addressLine1).includes(search) ||
        normalizeText(company.locationSummary).includes(search);

      const matchesStatus =
        filters.status === "all" || company.status === filters.status;

      const matchesType =
        filters.type === "all" || company.type === filters.type;

      return matchesSearch && matchesStatus && matchesType;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "name_asc") {
        return (a.displayName || "").localeCompare(b.displayName || "");
      }
      if (sortBy === "name_desc") {
        return (b.displayName || "").localeCompare(a.displayName || "");
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === "members") {
        const countA = a.memberCount ?? a.membersCount ?? 0;
        const countB = b.memberCount ?? b.membersCount ?? 0;
        return countB - countA;
      }
      return 0;
    });
  }, [mappedCompanies, filters, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedCompanies.length / pageSize) || 1;

  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedCompanies.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedCompanies, currentPage, pageSize]);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(Number(newSize));
    setCurrentPage(1);
  }, []);

  const stats = useMemo(() => {
    const total = mappedCompanies.length;
    const active = mappedCompanies.filter((c) => c.status === "active").length;
    const inactive = mappedCompanies.filter(
      (c) => c.status === "inactive",
    ).length;
    const suspended = mappedCompanies.filter(
      (c) => c.status === "suspended",
    ).length;

    return [
      {
        id: "total",
        title: "Total Companies",
        value: total,
        description: "Registered profiles",
        colorVariant: "primary",
      },
      {
        id: "active",
        title: "Active Profiles",
        value: active,
        description: "Live operational states",
        colorVariant: "success",
      },
      {
        id: "inactive",
        title: "Inactive Profiles",
        value: inactive,
        description: "Disabled modules",
        colorVariant: "warning",
      },
      {
        id: "suspended",
        title: "Suspended",
        value: suspended,
        description: "Compliance locks",
        colorVariant: "danger",
      },
    ];
  }, [mappedCompanies]);

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
    if (filters.type !== "all") {
      chips.push({
        key: "type",
        label:
          companyTypeOptions.find((o) => o.value === filters.type)?.label ||
          filters.type,
      });
    }

    return chips;
  }, [filters]);

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

  const handleCreateCompany = useCallback(() => {
    if (!canCreateCompany) {
      navigate(ROUTES.SETUP_CENTER);
      return;
    }
    navigate("/companies/create");
  }, [canCreateCompany, navigate]);

  const handleViewCompany = useCallback(
    (company) => {
      if (!company?._id) return;
      navigate(`/companies/${company._id}`);
    },
    [navigate],
  );

  const handleEditCompany = useCallback(
    (company) => {
      if (!company?._id) return;
      navigate(`/companies/${company._id}/edit`);
    },
    [navigate],
  );

  const handleOpenEmployeesDrawer = useCallback((company) => {
    setSelectedCompanyForEmployees(company || null);
    setIsEmployeeDrawerOpen(true);
  }, []);

  const handleCloseEmployeesDrawer = useCallback(() => {
    setIsEmployeeDrawerOpen(false);
    setSelectedCompanyForEmployees(null);
  }, []);

  const handleRequestDeleteCompany = useCallback((company) => {
    if (mappedCompanies.length <= 1) return;
    setSelectedCompany(company || null);
    setIsDeleteModalOpen(true);
  }, [mappedCompanies.length]);

  const handleCloseDeleteModal = useCallback(() => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setSelectedCompany(null);
  }, [isDeleting]);

  const handleConfirmDeleteCompany = useCallback(async () => {
    if (!selectedCompany?._id) return;
    try {
      await deleteCompany(selectedCompany._id);
      setIsDeleteModalOpen(false);
      setSelectedCompany(null);
    } catch {
      // Managed gracefully by standard slice errors
    }
  }, [deleteCompany, selectedCompany]);

  const handleRefresh = useCallback(() => {
    hasFetchedRef.current = false;
    clearError();
    clearMessage();
    fetchCompanies();
  }, [clearError, clearMessage, fetchCompanies]);

  const pageProps = {
    companies: filteredAndSortedCompanies,
    paginatedCompanies,
    allCompanies: mappedCompanies,
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
    companyTypeOptions,

    isLoading,
    isDeleting,
    hasError,
    error,
    message,

    totalCompanies: mappedCompanies.length,
    filteredCompaniesCount: filteredAndSortedCompanies.length,
    hasCompanies: mappedCompanies.length > 0,
    hasFilteredCompanies: filteredAndSortedCompanies.length > 0,
    canCreateCompany,
    canDeleteCompany: mappedCompanies.length > 1,

    handleFilterChange,
    handleSearchChange,
    handleRemoveFilter,
    handleClearFilters,

    handleCreateCompany,
    handleViewCompany,
    handleEditCompany,
    handleViewEmployees: handleOpenEmployeesDrawer,
    handleDeleteCompany: handleRequestDeleteCompany,
    handleRefresh,

    selectedCompanyForEmployees,
    isEmployeeDrawerOpen,
    handleCloseEmployeesDrawer,

    clearMessage,
  };

  return (
    <>
      {isMobile ? (
        <CompaniesMobilePage {...pageProps} />
      ) : (
        <CompaniesDesktopPage {...pageProps} />
      )}

      <UIConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDeleteCompany}
        title="Delete Company Record"
        description={
          selectedCompany
            ? `Are you sure you want to delete ${selectedCompany.displayName}? This will remove the company from active workspaces.`
            : "Are you sure you want to delete this company profile?"
        }
        confirmText="Delete Company"
        cancelText="Keep Profile"
        variant="destructive"
        loading={isDeleting}
      />
    </>
  );
};

export default CompaniesPage;
