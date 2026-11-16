// src/features/operations/business-days/pages/BusinessDaysPage.jsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { API_STATUS } from "@/constants";
import { useIsMobile, useBranchFilter } from "@/hooks";
import { UI_TOOLBAR_VIEWS } from "@/components/ui";

import {
  listBusinessDays,
  getOpenBusinessDay,
} from "../store/businessDayThunk";
import {
  clearBusinessDayError,
  clearBusinessDayMessage,
} from "../store/businessDaySlice";
import useBranch from "@/features/branch/hooks/useBranch";

import { BusinessDaysMobilePage } from "./mobile";
import { BusinessDaysDesktopPage } from "./desktop";

const statusOptions = [
  { label: "Status: All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Closed", value: "closed" },
  { label: "Cancelled", value: "cancelled" },
];

const initialFilters = {
  search: "",
  date: "",
  status: "all",
};

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const BusinessDaysPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isMobile = useIsMobile();

  const { businessDays, openBusinessDay, listBusinessDaysStatus, error, message } =
    useSelector((state) => state.businessDay);
  const { currentBranch } = useBranch();
  const {
    isCompanyLevel,
    selectedBranchId,
    setSelectedBranchId,
    queryBranchId,
  } = useBranchFilter();

  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState("desc");
  const [viewMode, setViewMode] = useState(UI_TOOLBAR_VIEWS.GRID);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog states
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogType, setDialogType] = useState(null); // 'view' | 'close'

  const isLoading =
    listBusinessDaysStatus === API_STATUS.LOADING ||
    listBusinessDaysStatus === API_STATUS.IDLE;
  const hasError = listBusinessDaysStatus === API_STATUS.ERROR;

  const fetchBusinessDaysData = useCallback(() => {
    const params = {};
    const activeBranchId = isCompanyLevel ? queryBranchId : currentBranch?._id;
    if (activeBranchId) {
      params.branchId = activeBranchId;
      dispatch(getOpenBusinessDay(activeBranchId));
    }
    if (filters.date) params.date = filters.date;
    if (filters.status !== "all") params.status = filters.status;
    params.sort = sortBy;
    dispatch(listBusinessDays(params));
  }, [dispatch, isCompanyLevel, queryBranchId, currentBranch?._id, filters.date, filters.status, sortBy]);

  useEffect(() => {
    fetchBusinessDaysData();
  }, [fetchBusinessDaysData]);

  useEffect(() => {
    if (location.state?.openBusinessDay) {
      setIsOpenDialogOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => {
      dispatch(clearBusinessDayMessage());
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [message, dispatch]);

  const handleOpenDialog = useCallback((day, type) => {
    setSelectedDay(day);
    setDialogType(type);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedDay(null);
    setDialogType(null);
  }, []);

  const mappedBusinessDays = useMemo(
    () => (Array.isArray(businessDays) ? businessDays : []),
    [businessDays]
  );

  const filteredAndSortedBusinessDays = useMemo(() => {
    const search = normalizeText(filters.search);

    const filtered = mappedBusinessDays.filter((bd) => {
      const staffName =
        bd.createdBy?.fullName ||
        bd.createdBy?.name ||
        bd.createdBy?.email ||
        "";
      const dayNo = bd.businessDayNo || "";

      const matchesSearch =
        !search ||
        normalizeText(dayNo).includes(search) ||
        normalizeText(staffName).includes(search);

      const matchesStatus =
        filters.status === "all" || bd.status === filters.status;

      const matchesDate =
        !filters.date ||
        (bd.businessDate && bd.businessDate.startsWith(filters.date)) ||
        (bd.actualOpenedAt && bd.actualOpenedAt.startsWith(filters.date));

      return matchesSearch && matchesStatus && matchesDate;
    });

    return filtered.sort((a, b) => {
      const timeA = new Date(a.businessDate || a.createdAt || 0).getTime();
      const timeB = new Date(b.businessDate || b.createdAt || 0).getTime();
      return sortBy === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [mappedBusinessDays, filters, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedBusinessDays.length / pageSize) || 1;

  const paginatedBusinessDays = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedBusinessDays.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedBusinessDays, currentPage, pageSize]);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(Number(newSize));
    setCurrentPage(1);
  }, []);

  const stats = useMemo(() => {
    const total = mappedBusinessDays.length;
    const openCount = mappedBusinessDays.filter((d) => d.status === "open").length;
    const closedCount = mappedBusinessDays.filter((d) => d.status === "closed").length;

    return [
      {
        id: "total",
        title: "Total Days",
        value: total,
        colorVariant: "primary",
      },
      {
        id: "open",
        title: "Open Days",
        value: openCount,
        colorVariant: "success",
      },
      {
        id: "closed",
        title: "Closed Days",
        value: closedCount,
        colorVariant: "neutral",
      },
    ];
  }, [mappedBusinessDays]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filters.search) {
      chips.push({ key: "search", label: `Search: ${filters.search}` });
    }
    if (filters.date) {
      chips.push({ key: "date", label: `Date: ${filters.date}` });
    }
    if (filters.status !== "all") {
      chips.push({
        key: "status",
        label:
          statusOptions.find((o) => o.value === filters.status)?.label ||
          filters.status,
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

  const handleRefresh = useCallback(() => {
    dispatch(clearBusinessDayError());
    dispatch(clearBusinessDayMessage());
    fetchBusinessDaysData();
  }, [dispatch, fetchBusinessDaysData]);

  const pageProps = {
    businessDays: filteredAndSortedBusinessDays,
    paginatedBusinessDays,
    allBusinessDays: mappedBusinessDays,
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

    isLoading,
    hasError,
    error,
    message,

    totalBusinessDays: mappedBusinessDays.length,
    filteredBusinessDaysCount: filteredAndSortedBusinessDays.length,
    hasBusinessDays: mappedBusinessDays.length > 0,
    hasFilteredBusinessDays: filteredAndSortedBusinessDays.length > 0,

    handleFilterChange,
    handleSearchChange,
    handleRemoveFilter,
    handleClearFilters,
    handleRefresh,
    clearMessage: () => dispatch(clearBusinessDayMessage()),

    // Branch filter state (Company Level Only)
    isCompanyLevel,
    selectedBranchId,
    setSelectedBranchId,

    // Dialog state handlers
    openBusinessDay,
    isOpenDialogOpen,
    setIsOpenDialogOpen,
    selectedDay,
    setSelectedDay,
    dialogType,
    setDialogType,
    handleOpenDialog,
    handleCloseDialog,
  };

  return isMobile ? (
    <BusinessDaysMobilePage {...pageProps} />
  ) : (
    <BusinessDaysDesktopPage {...pageProps} />
  );
};

export default BusinessDaysPage;
