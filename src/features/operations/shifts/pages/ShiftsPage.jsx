import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { API_STATUS } from "@/constants";
import { useIsMobile } from "@/hooks";
import { UI_TOOLBAR_VIEWS } from "@/components/ui";

import { listShifts } from "../store/shiftThunk";
import { clearShiftError, clearShiftMessage } from "../store/shiftSlice";
import useBranch from "@/features/branch/hooks/useBranch";
import { useBranchFilter } from "@/hooks";
import {
  getOpenBusinessDay,
  listBusinessDays,
} from "@/features/operations/business-days/store/businessDayThunk";

import { ShiftsMobilePage } from "./mobile";
import { ShiftsDesktopPage } from "./desktop";

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

const formatDateString = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput).slice(0, 10);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const ShiftsPage = () => {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();

  const { shifts, listShiftsStatus, error, message } = useSelector(
    (state) => state.shift
  );
  const { currentBranch } = useBranch();
  const { isCompanyLevel, selectedBranchId, setSelectedBranchId, queryBranchId } = useBranchFilter();
  const { openBusinessDay, businessDays } = useSelector((state) => state.businessDay);

  const [filters, setFilters] = useState(initialFilters);
  const [dateUserSelected, setDateUserSelected] = useState(false);
  const [sortBy, setSortBy] = useState("desc");
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewShift, setViewShift] = useState(null);
  const [closeShift, setCloseShift] = useState(null);
  const [isCloseBusinessDayOpen, setIsCloseBusinessDayOpen] = useState(false);

  const isLoading =
    listShiftsStatus === API_STATUS.LOADING ||
    listShiftsStatus === API_STATUS.IDLE;
  const hasError = listShiftsStatus === API_STATUS.ERROR;

  // Fetch open business day and business day history for default date calculation
  useEffect(() => {
    if (currentBranch?._id) {
      dispatch(getOpenBusinessDay(currentBranch._id));
      dispatch(listBusinessDays({ branchId: currentBranch._id }));
    }
  }, [dispatch, currentBranch?._id]);

  // Set default shift filter date: Open Business Day -> Last Business Day -> Today
  useEffect(() => {
    if (dateUserSelected) return;

    let defaultDate = "";
    if (openBusinessDay?.businessDate) {
      defaultDate = formatDateString(openBusinessDay.businessDate);
    } else if (Array.isArray(businessDays) && businessDays.length > 0) {
      const sorted = [...businessDays].sort(
        (a, b) =>
          new Date(b.businessDate || b.createdAt).getTime() -
          new Date(a.businessDate || a.createdAt).getTime()
      );
      if (sorted[0]?.businessDate) {
        defaultDate = formatDateString(sorted[0].businessDate);
      }
    } else {
      defaultDate = formatDateString(new Date());
    }

    if (defaultDate) {
      setFilters((prev) => ({ ...prev, date: defaultDate }));
    }
  }, [openBusinessDay, businessDays, dateUserSelected]);

  const fetchShiftsData = useCallback(() => {
    const params = {};
    const activeBranchId = isCompanyLevel ? queryBranchId : (currentBranch?._id || undefined);
    if (activeBranchId) params.branchId = activeBranchId;
    if (filters.date) params.date = filters.date;
    if (filters.status !== "all") params.status = filters.status;
    params.sort = sortBy;
    dispatch(listShifts(params));
  }, [dispatch, isCompanyLevel, queryBranchId, currentBranch?._id, filters.date, filters.status, sortBy]);

  useEffect(() => {
    fetchShiftsData();
  }, [fetchShiftsData]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => {
      dispatch(clearShiftMessage());
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [message, dispatch]);

  const mappedShifts = useMemo(
    () => (Array.isArray(shifts) ? shifts : []),
    [shifts]
  );

  const filteredAndSortedShifts = useMemo(() => {
    const search = normalizeText(filters.search);

    const filtered = mappedShifts.filter((shift) => {
      const staffName =
        shift.openedBy?.fullName ||
        shift.openedBy?.name ||
        shift.openedBy?.email ||
        "";
      const shiftNo = shift.shiftNo || "";
      const shiftName = shift.shiftName || "";

      const matchesSearch =
        !search ||
        normalizeText(shiftNo).includes(search) ||
        normalizeText(shiftName).includes(search) ||
        normalizeText(staffName).includes(search);

      const matchesStatus =
        filters.status === "all" || shift.status === filters.status;

      let matchesDate = !filters.date;
      if (filters.date) {
        // 1. Check if shift belongs to openBusinessDay for this date
        if (
          openBusinessDay &&
          formatDateString(openBusinessDay.businessDate) === filters.date
        ) {
          const bDayId =
            shift.businessDayId?._id ||
            shift.businessDayId ||
            shift.businessDay?._id ||
            shift.businessDay;
          if (bDayId && String(bDayId) === String(openBusinessDay._id)) {
            matchesDate = true;
          }
        }

        if (!matchesDate) {
          const shiftBusinessDateStr = formatDateString(shift.businessDate);
          const shiftDateStr = formatDateString(shift.date);
          const shiftOpenedAtStr = formatDateString(shift.openedAt);

          matchesDate =
            shiftBusinessDateStr === filters.date ||
            shiftDateStr === filters.date ||
            shiftOpenedAtStr === filters.date ||
            (shift.date && String(shift.date).startsWith(filters.date)) ||
            (shift.openedAt && String(shift.openedAt).startsWith(filters.date)) ||
            (shift.businessDate && String(shift.businessDate).startsWith(filters.date));
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    return filtered.sort((a, b) => {
      const timeA = new Date(a.openedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.openedAt || b.createdAt || 0).getTime();
      return sortBy === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [mappedShifts, filters, sortBy, openBusinessDay]);

  const totalPages = Math.ceil(filteredAndSortedShifts.length / pageSize) || 1;

  const paginatedShifts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedShifts.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedShifts, currentPage, pageSize]);

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(Number(newSize));
    setCurrentPage(1);
  }, []);

  const stats = useMemo(() => {
    const total = mappedShifts.length;
    const openCount = mappedShifts.filter((s) => s.status === "open").length;
    const closedCount = mappedShifts.filter((s) => s.status === "closed").length;

    return [
      {
        id: "total",
        title: "Total Shifts",
        value: total,
        colorVariant: "primary",
      },
      {
        id: "open",
        title: "Open Shifts",
        value: openCount,
        colorVariant: "success",
      },
      {
        id: "closed",
        title: "Closed Shifts",
        value: closedCount,
        colorVariant: "neutral",
      },
    ];
  }, [mappedShifts]);

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
      if (name === "date") setDateUserSelected(true);
      setFilters((prev) => ({ ...prev, [name]: value }));
      return;
    }
    if (eventOrValue?.date !== undefined) {
      setDateUserSelected(true);
    }
    setFilters((prev) => ({ ...prev, ...eventOrValue }));
  }, []);

  const handleSearchChange = useCallback((value) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, search: value ?? "" }));
  }, []);

  const handleRemoveFilter = useCallback((key) => {
    setCurrentPage(1);
    if (key === "date") setDateUserSelected(false);
    setFilters((prev) => ({ ...prev, [key]: initialFilters[key] }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setCurrentPage(1);
    setDateUserSelected(false);
    setFilters(initialFilters);
  }, []);

  const handleRefresh = useCallback(() => {
    dispatch(clearShiftError());
    dispatch(clearShiftMessage());
    fetchShiftsData();
  }, [dispatch, fetchShiftsData]);

  const pageProps = {
    shifts: filteredAndSortedShifts,
    paginatedShifts,
    allShifts: mappedShifts,
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

    totalShifts: mappedShifts.length,
    filteredShiftsCount: filteredAndSortedShifts.length,
    hasShifts: mappedShifts.length > 0,
    hasFilteredShifts: filteredAndSortedShifts.length > 0,

    handleFilterChange,
    handleSearchChange,
    handleRemoveFilter,
    handleClearFilters,
    handleRefresh,
    clearMessage: () => dispatch(clearShiftMessage()),

    // Branch filter state (Company Level Only)
    isCompanyLevel,
    selectedBranchId,
    setSelectedBranchId,

    // Dialog state handlers
    openBusinessDay,
    isCreateOpen,
    setIsCreateOpen,
    viewShift,
    setViewShift,
    closeShift,
    setCloseShift,
    isCloseBusinessDayOpen,
    setIsCloseBusinessDayOpen,
  };

  return isMobile ? (
    <ShiftsMobilePage {...pageProps} />
  ) : (
    <ShiftsDesktopPage {...pageProps} />
  );
};

export default ShiftsPage;

