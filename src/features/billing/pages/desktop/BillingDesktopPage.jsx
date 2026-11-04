// src/features/billing/pages/desktop/BillingDesktopPage.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  Receipt,
  Banknote,
  QrCode,
  RotateCcw,
  PauseCircle,
  SlidersHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import {
  UIButton,
  UIInput,
  UISelect,
  UIDatePicker,
  UIBadge,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  UITableEmpty,
  UITableLoading,
  UIInfiniteScroll,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import useBranch from "@/features/branch/hooks/useBranch";
import { useActiveShift } from "@/features/operations/shifts/hooks/useActiveShift";
import invoiceService from "@/features/sales/services/invoiceService";
import usePaymentQr from "@/features/finance/treasury/payment-qr/hooks/usePaymentQr";
import { BillingInvoiceDetailsDrawer } from "../../components/BillingInvoiceDetailsDrawer";
import BillingInvoiceFilterModal from "../../components/BillingInvoiceFilterModal";
import { HeldBillsModal } from "@/features/sales/components";
import { useHoldBills } from "@/features/sales/hooks/useHoldBills";

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (val) => {
  if (!val) return "Today";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "Today";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const DATE_RANGE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "Last 7 Days", value: "last7days" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Month", value: "thisMonth" },
  { label: "Custom Range", value: "custom" },
];

const PAYMENT_TYPE_OPTIONS = [
  { label: "All Payments", value: "all" },
  { label: "Cash", value: "Cash" },
  { label: "UPI", value: "UPI" },
  { label: "Split", value: "Split" },
  { label: "Credit", value: "Credit" },
  { label: "Advance", value: "Advance" },
  { label: "Credit Note", value: "CreditNote" },
];

const STATUS_SELECT_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Paid", value: "Paid" },
  { label: "Pending", value: "Pending" },
  { label: "Overdue", value: "Overdue" },
  { label: "Cancelled", value: "Cancelled" },
];

const SORT_SELECT_OPTIONS = [
  { label: "Date: Newest First", value: "date-desc" },
  { label: "Date: Oldest First", value: "date-asc" },
  { label: "Amount: High to Low", value: "amount-desc" },
  { label: "Amount: Low to High", value: "amount-asc" },
  { label: "Invoice #: Z to A", value: "invoiceNo-desc" },
  { label: "Invoice #: A to Z", value: "invoiceNo-asc" },
];

const PAGE_LIMIT = 10;

export const BillingDesktopPage = () => {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const { currentBranch } = useBranch();

  // ── Hold Bill System ──
  const {
    heldBills,
    count: heldBillsCount,
    discardBill,
    clearAll: clearAllHeldBills,
  } = useHoldBills();
  const [isHeldBillsModalOpen, setIsHeldBillsModalOpen] = useState(false);

  const handleResumeFromBilling = (heldBill) => {
    setIsHeldBillsModalOpen(false);
    navigate(ROUTES.SALES || "/sales", {
      state: { resumeHeldBill: heldBill },
    });
  };
  useActiveShift(currentBranch?._id);
  const reduxActiveShift = useSelector((state) => state.shift?.activeShift);
  const tableContainerRef = useRef(null);

  // Invoices & Pagination / Infinite Scroll states
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Global Statistics (independent of pagination)
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    cashAmount: 0,
    upiAmount: 0,
    creditAmount: 0,
    advanceAmount: 0,
    creditNoteAmount: 0,
    pureCashInvoices: 0,
    pureUpiInvoices: 0,
    pureSplitInvoices: 0,
    pureCreditInvoices: 0,
    pureAdvanceInvoices: 0,
    pureCreditNoteInvoices: 0,
    pureCashAmount: 0,
    splitCashAmount: 0,
    pureUpiAmount: 0,
    splitUpiAmount: 0,
    pureCreditAmount: 0,
    splitCreditAmount: 0,
    pureAdvanceAmount: 0,
    splitAdvanceAmount: 0,
    pureCreditNoteAmount: 0,
    splitCreditNoteAmount: 0,
    matchingSplitInvoices: 0,
  });

  // Filters state (Default date range: "today")
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("all");
  const [selectedPaymentQr, setSelectedPaymentQr] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortOption, setSortOption] = useState("date-desc");
  const [fromInvoice, setFromInvoice] = useState("");
  const [toInvoice, setToInvoice] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Compute active count for filters inside the Filter Modal
  const modalActiveFiltersCount = useMemo(() => {
    let count = 0;
    if (fromInvoice.trim()) count++;
    if (toInvoice.trim()) count++;
    if (selectedStatus && selectedStatus !== "all") count++;
    if (sortOption && sortOption !== "date-desc") count++;
    return count;
  }, [fromInvoice, toInvoice, selectedStatus, sortOption]);

  // Load branch UPI QR codes for UPI sub-filter
  const { paymentQrs, getPaymentQrs } = usePaymentQr();

  useEffect(() => {
    if (currentWorkspace) {
      getPaymentQrs({
        branchId: currentBranch?._id || undefined,
        status: "ACTIVE",
      });
    }
  }, [currentWorkspace, currentBranch?._id, getPaymentQrs]);

  // Construct options for branch UPI QR sub-filter
  const upiQrOptions = useMemo(() => {
    const list = (paymentQrs || []).filter((q) => {
      if (q.status && q.status !== "ACTIVE") return false;
      if (!currentBranch?._id) return true;
      const qBranchId = q.branchId?._id || q.branchId;
      return !qBranchId || String(qBranchId) === String(currentBranch._id);
    });
    return [
      { label: "All UPI QR Codes", value: "all" },
      ...list.map((qr) => {
        const bankName =
          qr.bankAccountId?.bankMasterId?.bankName ||
          qr.bankAccountId?.accountName ||
          qr.bankAccountId?.accountHolderName ||
          "";
        const labelText = qr.label
          ? `${qr.label}${bankName ? ` (${bankName})` : ""}`
          : bankName
          ? `${bankName} (${qr.upiId})`
          : qr.upiId;
        return {
          label: labelText,
          value: String(qr._id),
        };
      }),
    ];
  }, [paymentQrs, currentBranch?._id]);

  const handlePaymentTypeChange = (val) => {
    setSelectedPaymentType(val);
    if (val !== "UPI") {
      setSelectedPaymentQr("all");
    }
  };

  // Derive sort column and direction
  const [sortBy, sortOrder] = useMemo(() => {
    const parts = sortOption.split("-");
    return [parts[0] || "date", parts[1] || "desc"];
  }, [sortOption]);

  const handleHeaderSort = (field) => {
    const [currentField, currentOrder] = sortOption.split("-");
    let nextOrder = "desc";
    if (currentField === field) {
      nextOrder = currentOrder === "desc" ? "asc" : "desc";
    }
    setSortOption(`${field}-${nextOrder}`);
  };

  // Drawer & Feedback
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Helper to construct exact calendar date boundaries
  const buildDateParams = useCallback(() => {
    const params = {};
    const now = new Date();

    if (selectedDateRange === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      params.startDate = start.toISOString();
      params.endDate = end.toISOString();
    } else if (selectedDateRange === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const start = new Date(yesterday);
      start.setHours(0, 0, 0, 0);
      const end = new Date(yesterday);
      end.setHours(23, 59, 59, 999);
      params.startDate = start.toISOString();
      params.endDate = end.toISOString();
    } else if (selectedDateRange === "tomorrow") {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const start = new Date(tomorrow);
      start.setHours(0, 0, 0, 0);
      const end = new Date(tomorrow);
      end.setHours(23, 59, 59, 999);
      params.startDate = start.toISOString();
      params.endDate = end.toISOString();
    } else if (selectedDateRange === "last7days") {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      params.startDate = sevenDaysAgo.toISOString();
      params.endDate = end.toISOString();
    } else if (selectedDateRange === "thisWeek") {
      const dayOfWeek = now.getDay();
      const firstDayOfWeek = new Date(now);
      firstDayOfWeek.setDate(now.getDate() - dayOfWeek);
      firstDayOfWeek.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      params.startDate = firstDayOfWeek.toISOString();
      params.endDate = end.toISOString();
    } else if (selectedDateRange === "thisMonth") {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      params.startDate = firstDayOfMonth.toISOString();
      params.endDate = lastDayOfMonth.toISOString();
    } else if (selectedDateRange === "custom") {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        params.startDate = start.toISOString();
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        params.endDate = end.toISOString();
      }
    }

    return params;
  }, [selectedDateRange, customStartDate, customEndDate]);

  // Transform raw backend invoice document into standardized UI format with thorough phone resolution
  const formatInvoiceRow = (s) => {
    // Check all possible customer phone paths
    const cust = s.customerId && typeof s.customerId === "object" ? s.customerId : {};
    const rawPhone =
      s.customerPhone ||
      s.customerMobile ||
      s.phone ||
      cust.mobile ||
      cust.phone ||
      cust.alternateMobile ||
      cust.contactNumber ||
      cust.contact ||
      "";

    const cleanPhone =
      rawPhone && String(rawPhone).trim() !== "null" && String(rawPhone).trim() !== "undefined"
        ? String(rawPhone).trim()
        : "—";

    const shiftObj =
      s.shift && typeof s.shift === "object"
        ? s.shift
        : s.shiftId && typeof s.shiftId === "object"
        ? s.shiftId
        : {};

    const shiftNo =
      shiftObj.shiftNo ||
      shiftObj.shiftNumber ||
      s.shiftNo ||
      s.shiftNumber ||
      null;

    const shiftName =
      shiftObj.shiftName ||
      s.shiftName ||
      (shiftObj.openPeriod
        ? `${shiftObj.openPeriod.charAt(0).toUpperCase() + shiftObj.openPeriod.slice(1)} Shift`
        : null);

    const rawShiftId = (s.shiftId && typeof s.shiftId === "object")
      ? s.shiftId._id
      : (s.shiftId || (s.shift && typeof s.shift === "object" ? s.shift._id : s.shift) || null);

    let resolvedShiftStatus = shiftObj.status || s.shiftStatus || null;
    if (!resolvedShiftStatus && reduxActiveShift) {
      if (rawShiftId && String(rawShiftId) === String(reduxActiveShift._id)) {
        resolvedShiftStatus = reduxActiveShift.status || "open";
      } else if (rawShiftId && reduxActiveShift._id && String(rawShiftId) !== String(reduxActiveShift._id)) {
        resolvedShiftStatus = "closed";
      }
    }

    // Precompute split breakdown once so table render never lags
    let splitCash = 0;
    let splitUpi = 0;
    const rawPayments = Array.isArray(s.payments) ? s.payments : [];
    if (rawPayments.length > 0) {
      for (const p of rawPayments) {
        const type = String(p.paymentType || p.paymentMode || p.type || p.mode || "").toUpperCase();
        const amt = Number(p.amount || 0);
        if (type.includes("UPI") || type.includes("QR")) {
          splitUpi += amt;
        } else if (type.includes("CASH")) {
          splitCash += amt;
        }
      }
    } else if (String(s.paymentMethod || s.paymentMode || "").toUpperCase() === "SPLIT") {
      const grand = Number(s.grandTotal || s.totalAmount || 0);
      const tendered = Number(s.cashTendered || 0);
      if (tendered > 0) {
        splitCash = Math.min(grand, tendered);
        splitUpi = Math.max(0, grand - splitCash);
      }
    }

    const isSplit =
      String(s.paymentMethod || s.paymentMode || "").toUpperCase() === "SPLIT" ||
      rawPayments.length > 1 ||
      (splitCash > 0 && splitUpi > 0);

    return {
      id: s._id || s.id || `inv-${Date.now()}-${Math.random()}`,
      shiftId: rawShiftId,
      shift: shiftObj._id ? shiftObj : (s.shift || null),
      shiftNo,
      shiftName,
      shiftStatus: resolvedShiftStatus,
      split: { cash: splitCash, upi: splitUpi },
      isSplit,
      createdAt: s.createdAt || null,
      updatedAt: s.updatedAt || null,
      branchId: s.branchId || null,
      branchName: s.branchName || "Main Branch",
      invoiceNo: s.invoiceNo || `RET-INV-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: s.customerId?._id || s.customerId || null,
      customerObj: cust._id ? cust : (typeof s.customerId === "object" ? s.customerId : null),
      customer: s.customerName || cust.name || "Walk-in Retail Customer",
      customerName: s.customerName || cust.name || "Walk-in Retail Customer",
      phone: cleanPhone,
      customerPhone: cleanPhone,
      doctorId: s.doctorId?._id || s.doctorId || null,
      doctorObj: typeof s.doctorId === "object" ? s.doctorId : null,
      doctor: s.doctor || s.doctorName || null,
      doctorName: s.doctor || s.doctorName || null,
      issueDate: formatDate(s.date || s.createdAt),
      rawDate: s.date ? new Date(s.date) : new Date(),
      amount: Number(s.grandTotal || s.totalAmount || s.subtotal || 0),
      subtotal: Number(s.subtotal || 0),
      discount: Number(s.discount || 0),
      tax: Number(s.tax || 0),
      cashTendered: Number(s.cashTendered || 0),
      changeDue: Number(s.changeDue || 0),
      paidAmount: Number(s.cashTendered || s.grandTotal || 0),
      balance: Math.max(0, Number(s.grandTotal || 0) - Number(s.cashTendered || s.grandTotal || 0)),
      status: s.status || "Paid",
      paymentMode: s.paymentMethod || s.paymentMode || "Cash",
      creditDueDate: s.creditDueDate || s.dueDate || (Array.isArray(s.payments) ? s.payments.find((p) => p.creditDueDate)?.creditDueDate : null) || null,
      billingMode: s.billingMode || "B2C",
      createdByName: s.createdByName || (s.createdByEmail ? s.createdByEmail.split("@")[0] : "System User"),
      createdByEmail: s.createdByEmail || null,
      items: s.items || [],
      payments: Array.isArray(s.payments) ? s.payments : [],
      denominations: s.denominations || [],
      returnedDenominations: s.returnedDenominations || [],
      returnInvoices: Array.isArray(s.returnInvoices) ? s.returnInvoices : [],
      returnInvoiceIds: s.returnInvoiceIds || [],
      returnStatus: s.returnStatus || "NONE",
      totalReturnedAmount: Number(s.totalReturnedAmount || 0),
      isReturned: Boolean(s.isReturned),
      isFullyReturned: Boolean(s.isFullyReturned),
      isReturn: Boolean(s.isReturn),
      originalInvoiceNo: s.originalInvoiceNo || null,
      originalInvoiceId: s.originalInvoiceId || null,
    };
  };

  // Fetch initial batch (Page 1) or refresh
  const fetchInvoices = useCallback(async () => {
    if (!currentWorkspace) return;
    setIsLoading(true);
    try {
      const dateParams = buildDateParams();
      const [sBy, sOrder] = sortOption.split("-");
      const params = {
        page: 1,
        limit: PAGE_LIMIT,
        search: debouncedSearch || undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        paymentMethod: selectedPaymentType !== "all" ? selectedPaymentType : undefined,
        paymentQrId: (selectedPaymentType === "UPI" && selectedPaymentQr !== "all") ? selectedPaymentQr : undefined,
        sortBy: sBy,
        sortOrder: sOrder,
        fromInvoice: fromInvoice.trim() || undefined,
        toInvoice: toInvoice.trim() || undefined,
        ...dateParams,
      };

      const res = await invoiceService.getAllCustomerSales(params);
      const resData = res.data?.data || {};
      const salesList = Array.isArray(resData.data) ? resData.data : [];
      const total = resData.meta?.total ?? salesList.length;

      // Extract backend aggregated summary (strictly independent of pagination)
      if (resData.summary) {
        setStats({
          totalInvoices: resData.summary.totalInvoices ?? total,
          totalAmount: resData.summary.totalAmount ?? 0,
          cashAmount: resData.summary.cashAmount ?? 0,
          upiAmount: resData.summary.upiAmount ?? 0,
          creditAmount: resData.summary.creditAmount ?? 0,
          advanceAmount: resData.summary.advanceAmount ?? 0,
          creditNoteAmount: resData.summary.creditNoteAmount ?? 0,
          pureCashInvoices: resData.summary.pureCashInvoices ?? 0,
          pureUpiInvoices: resData.summary.pureUpiInvoices ?? 0,
          pureSplitInvoices: resData.summary.pureSplitInvoices ?? 0,
          pureCreditInvoices: resData.summary.pureCreditInvoices ?? 0,
          pureAdvanceInvoices: resData.summary.pureAdvanceInvoices ?? 0,
          pureCreditNoteInvoices: resData.summary.pureCreditNoteInvoices ?? 0,
          pureCashAmount: resData.summary.pureCashAmount ?? 0,
          splitCashAmount: resData.summary.splitCashAmount ?? 0,
          pureUpiAmount: resData.summary.pureUpiAmount ?? 0,
          splitUpiAmount: resData.summary.splitUpiAmount ?? 0,
          pureCreditAmount: resData.summary.pureCreditAmount ?? 0,
          splitCreditAmount: resData.summary.splitCreditAmount ?? 0,
          pureAdvanceAmount: resData.summary.pureAdvanceAmount ?? 0,
          splitAdvanceAmount: resData.summary.splitAdvanceAmount ?? 0,
          pureCreditNoteAmount: resData.summary.pureCreditNoteAmount ?? 0,
          splitCreditNoteAmount: resData.summary.splitCreditNoteAmount ?? 0,
          matchingSplitInvoices: resData.summary.matchingSplitInvoices ?? 0,
        });
      } else {
        const calcTotalAmount = salesList.reduce((acc, i) => acc + Number(i.grandTotal || 0), 0);
        setStats({
          totalInvoices: total,
          totalAmount: calcTotalAmount,
          cashAmount: 0,
          upiAmount: 0,
          creditAmount: 0,
          advanceAmount: 0,
          creditNoteAmount: 0,
          pureCashInvoices: 0,
          pureUpiInvoices: 0,
          pureSplitInvoices: 0,
          pureCreditInvoices: 0,
          pureAdvanceInvoices: 0,
          pureCreditNoteInvoices: 0,
          pureCashAmount: 0,
          splitCashAmount: 0,
          pureUpiAmount: 0,
          splitUpiAmount: 0,
          pureCreditAmount: 0,
          splitCreditAmount: 0,
          pureAdvanceAmount: 0,
          splitAdvanceAmount: 0,
          pureCreditNoteAmount: 0,
          splitCreditNoteAmount: 0,
          matchingSplitInvoices: 0,
        });
      }

      setInvoices(salesList.map(formatInvoiceRow));
      setTotalInvoices(total);
      setCurrentPage(1);
      setHasMore(salesList.length < total);

      // Scroll container to top on fresh search / filter change
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.warn("Failed to fetch invoices:", err);
      setInvoices([]);
      setTotalInvoices(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentWorkspace,
    debouncedSearch,
    selectedStatus,
    selectedPaymentType,
    selectedPaymentQr,
    sortOption,
    fromInvoice,
    toInvoice,
    buildDateParams,
  ]);

  // Load next batch via Infinite Scroll
  const handleLoadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore || !currentWorkspace) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const dateParams = buildDateParams();
      const [sBy, sOrder] = sortOption.split("-");
      const params = {
        page: nextPage,
        limit: PAGE_LIMIT,
        search: debouncedSearch || undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        paymentMethod: selectedPaymentType !== "all" ? selectedPaymentType : undefined,
        paymentQrId: (selectedPaymentType === "UPI" && selectedPaymentQr !== "all") ? selectedPaymentQr : undefined,
        sortBy: sBy,
        sortOrder: sOrder,
        fromInvoice: fromInvoice.trim() || undefined,
        toInvoice: toInvoice.trim() || undefined,
        ...dateParams,
      };

      const res = await invoiceService.getAllCustomerSales(params);
      const resData = res.data?.data || {};
      const salesList = Array.isArray(resData.data) ? resData.data : [];
      const total = resData.meta?.total ?? totalInvoices;

      if (salesList.length > 0) {
        setInvoices((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const newRows = salesList
            .map(formatInvoiceRow)
            .filter((i) => !existingIds.has(i.id));
          const combined = [...prev, ...newRows];
          setHasMore(combined.length < total);
          return combined;
        });
        setCurrentPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn("Failed to load more invoices:", err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    currentPage,
    hasMore,
    isLoading,
    isLoadingMore,
    currentWorkspace,
    debouncedSearch,
    selectedStatus,
    selectedPaymentType,
    selectedPaymentQr,
    sortOption,
    fromInvoice,
    toInvoice,
    buildDateParams,
    totalInvoices,
  ]);

  // Trigger re-fetch on filter changes
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDateRange("today");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedPaymentType("all");
    setSelectedPaymentQr("all");
    setSelectedStatus("all");
    setSortOption("date-desc");
    setFromInvoice("");
    setToInvoice("");
  };

  // Cancellation handler

  const handleCancelInvoice = async (invId, cancelPayload = {}) => {
    try {
      await invoiceService.cancelCustomerSale(invId, cancelPayload);
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invId ? { ...inv, status: "Cancelled", balance: 0 } : inv
        )
      );
      if (selectedInvoice && selectedInvoice.id === invId) {
        setSelectedInvoice((prev) => ({ ...prev, status: "Cancelled", balance: 0 }));
      }
      setToastMessage("✅ Invoice cancelled successfully.");
      fetchInvoices();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to cancel invoice.";
      setToastMessage(`❌ ${msg}`);
      throw error;
    } finally {
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return (
          <UIBadge variant="dot" color="success">
            Paid
          </UIBadge>
        );
      case "Pending":
        return (
          <UIBadge variant="dot" color="warning">
            Pending
          </UIBadge>
        );
      case "Overdue":
        return (
          <UIBadge variant="dot" color="error">
            Overdue
          </UIBadge>
        );
      case "Cancelled":
        return (
          <UIBadge variant="dot" color="neutral">
            Cancelled
          </UIBadge>
        );
      default:
        return (
          <UIBadge variant="dot" color="primary">
            {status}
          </UIBadge>
        );
    }
  };

  // Render Payment Type Badge
  const renderPaymentTypeBadge = (paymentMode, isSplitHighlighted = false, creditDueDate = null) => {
    const mode = String(paymentMode || "").trim();
    const modeUpper = mode.toUpperCase();
    if (modeUpper === "CASH") {
      return (
        <UIBadge variant="soft" color="success" className="font-semibold text-xs">
          Cash
        </UIBadge>
      );
    }
    if (modeUpper === "UPI") {
      return (
        <UIBadge variant="soft" color="info" className="font-semibold text-xs">
          UPI
        </UIBadge>
      );
    }
    if (modeUpper === "SPLIT") {
      return (
        <div className="inline-flex flex-col items-center gap-0.5">
          <UIBadge
            variant="soft"
            color="warning"
            className={cn(
              "font-semibold text-xs transition-all",
              isSplitHighlighted && "ring-1 ring-amber-500/50 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold"
            )}
          >
            Split
          </UIBadge>
          {isSplitHighlighted && (
            <span className="text-[9.5px] font-medium text-amber-600 dark:text-amber-400">
              Allocated
            </span>
          )}
        </div>
      );
    }
        if (modeUpper === "CREDITNOTE" || modeUpper === "CREDIT_NOTE" || modeUpper === "CREDIT NOTE") {
      return (
        <UIBadge variant="soft" color="info" className="font-semibold text-xs border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 bg-indigo-500/10">
          Credit Note
        </UIBadge>
      );
    }
    if (modeUpper === "CREDIT") {
      return (
        <div className="inline-flex flex-col items-center gap-0.5">
          <UIBadge variant="soft" color="warning" className="font-semibold text-xs border border-amber-500/30">
            Credit
          </UIBadge>
          {creditDueDate && (
            <span className="text-[9.5px] font-bold text-amber-600 dark:text-amber-400 font-mono tracking-tight">
              Due: {formatDate(creditDueDate)}
            </span>
          )}
        </div>
      );
    }
    if (modeUpper === "ADVANCE") {
      return (
        <UIBadge variant="soft" color="primary" className="font-semibold text-xs border border-primary/30">
          Advance
        </UIBadge>
      );
    }
    return (
      <UIBadge variant="soft" color="neutral" className="font-semibold text-xs">
        {mode || "Cash"}
      </UIBadge>
    );
  };

  // Extract split payment breakdown across all payment methods
  const getSplitBreakdown = (inv) => {
    let cash = 0;
    let upi = 0;
    let creditNote = 0;
    let advance = 0;
    let credit = 0;
    let card = 0;
    const payments = Array.isArray(inv?.payments) ? inv.payments : [];
    if (payments.length > 0) {
      for (const p of payments) {
        const type = String(p.paymentType || p.paymentMode || p.type || p.mode || "").toUpperCase();
        const amt = Number(p.amount || 0);
        if (type.includes("UPI") || type.includes("QR")) {
          upi += amt;
        } else if (type.includes("CREDIT_NOTE") || type.includes("CREDITNOTE")) {
          creditNote += amt;
        } else if (type.includes("CREDIT")) {
          credit += amt;
        } else if (type.includes("ADVANCE") || type.includes("WALLET")) {
          advance += amt;
        } else if (type.includes("CASH")) {
          cash += amt;
        } else if (type.includes("CARD")) {
          card += amt;
        } else {
          cash += amt;
        }
      }
    } else {
      if (Number(inv?.creditNoteTotal || 0) > 0) {
        creditNote = Number(inv.creditNoteTotal);
      }
      const pMethod = String(inv?.paymentMode || inv?.paymentMethod || "").toUpperCase();
      const grand = Number(inv?.amount || inv?.grandTotal || 0);
      if (pMethod === "SPLIT") {
        const tendered = Number(inv?.paidAmount || inv?.cashTendered || 0);
        cash = Math.min(grand, tendered);
        upi = Math.max(0, grand - cash - creditNote);
      }
    }
    return { cash, upi, creditNote, advance, credit, card };
  };

  // Determine dynamic stats cards based on active payment filter
  const renderDynamicStatsCards = () => {
    if (selectedPaymentType === "Cash") {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Pure Cash Bills */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
              <Receipt className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-success truncate">
                Cash Bills
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                {stats.pureCashInvoices}
              </div>
              {stats.matchingSplitInvoices > 0 && (
                <div className="text-[10px] text-text-muted truncate mt-0.5">
                  + {stats.matchingSplitInvoices} Split bills included
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Cash Amount (Pure + Split) */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
              <Banknote className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-text-muted truncate">
                Cash Amount
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.cashAmount)}
              </div>
              {stats.splitCashAmount > 0 && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono truncate mt-0.5">
                  ₹{formatCurrency(stats.splitCashAmount)} from Split
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Pure Cash Portion */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Receipt className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-text-muted truncate">
                Pure Cash
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.pureCashAmount)}
              </div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                From pure Cash bills
              </div>
            </div>
          </div>

          {/* Card 4: Split Cash Portion */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Banknote className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400 truncate">
                Split Cash
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.splitCashAmount)}
              </div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                From {stats.matchingSplitInvoices} Split bills
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (selectedPaymentType === "UPI") {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Pure UPI Bills */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Receipt className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-indigo-500 dark:text-indigo-400 truncate">
                UPI Bills
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                {stats.pureUpiInvoices}
              </div>
              {stats.matchingSplitInvoices > 0 && (
                <div className="text-[10px] text-text-muted truncate mt-0.5">
                  + {stats.matchingSplitInvoices} Split bills included
                </div>
              )}
            </div>
          </div>

          {/* Card 2: UPI Amount (Pure + Split) */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <QrCode className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-text-muted truncate">
                UPI Amount
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.upiAmount)}
              </div>
              {stats.splitUpiAmount > 0 && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono truncate mt-0.5">
                  ₹{formatCurrency(stats.splitUpiAmount)} from Split
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Pure UPI Portion */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Receipt className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-text-muted truncate">
                Pure UPI
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.pureUpiAmount)}
              </div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                From pure UPI bills
              </div>
            </div>
          </div>

          {/* Card 4: Split UPI Portion */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <QrCode className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400 truncate">
                Split UPI
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.splitUpiAmount)}
              </div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                From {stats.matchingSplitInvoices} Split bills
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (selectedPaymentType === "Credit") {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Pure Credit Bills */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Receipt className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-rose-600 dark:text-rose-400 truncate">
                Credit Bills
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                {stats.pureCreditInvoices}
              </div>
              {stats.matchingSplitInvoices > 0 && (
                <div className="text-[10px] text-text-muted truncate mt-0.5">
                  + {stats.matchingSplitInvoices} Split bills included
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Total Credit Amount (Pure + Split) */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Banknote className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-text-muted truncate">
                Credit Amount
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.creditAmount)}
              </div>
              {stats.splitCreditAmount > 0 && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono truncate mt-0.5">
                  ₹{formatCurrency(stats.splitCreditAmount)} from Split
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Pure Credit Portion */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Receipt className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-text-muted truncate">
                Pure Credit
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.pureCreditAmount)}
              </div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                From pure Credit bills
              </div>
            </div>
          </div>

          {/* Card 4: Split Credit Portion */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Banknote className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400 truncate">
                Split Credit
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.splitCreditAmount)}
              </div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                From {stats.matchingSplitInvoices} Split bills
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (selectedPaymentType === "Advance") {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Pure Advance Bills */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Receipt className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400 truncate">
                Advance Bills
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                {stats.pureAdvanceInvoices}
              </div>
              {stats.matchingSplitInvoices > 0 && (
                <div className="text-[10px] text-text-muted truncate mt-0.5">
                  + {stats.matchingSplitInvoices} Split bills included
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Total Advance Amount (Pure + Split) */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Wallet className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-text-muted truncate">
                Advance Amount
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.advanceAmount)}
              </div>
              {stats.splitAdvanceAmount > 0 && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono truncate mt-0.5">
                  ₹{formatCurrency(stats.splitAdvanceAmount)} from Split
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Pure Advance Portion */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Receipt className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-text-muted truncate">
                Pure Advance
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.pureAdvanceAmount)}
              </div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                From pure Advance bills
              </div>
            </div>
          </div>

          {/* Card 4: Split Advance Portion */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Wallet className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400 truncate">
                Split Advance
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.splitAdvanceAmount)}
              </div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                From {stats.matchingSplitInvoices} Split bills
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (selectedPaymentType === "CreditNote" || selectedPaymentType === "creditnote") {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Pure Credit Note Bills */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Receipt className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-indigo-600 dark:text-indigo-400 truncate">
                Credit Note Bills
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                {stats.pureCreditNoteInvoices}
              </div>
              {stats.matchingSplitInvoices > 0 && (
                <div className="text-[10px] text-text-muted truncate mt-0.5">
                  + {stats.matchingSplitInvoices} Split bills included
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Total Credit Note Amount (Pure + Split) */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Receipt className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-text-muted truncate">
                Credit Note Amount
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.creditNoteAmount)}
              </div>
              {stats.splitCreditNoteAmount > 0 && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono truncate mt-0.5">
                  ₹{formatCurrency(stats.splitCreditNoteAmount)} from Split
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Pure Credit Note Portion */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Receipt className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-text-muted truncate">
                Pure Credit Note
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.pureCreditNoteAmount)}
              </div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                From pure Credit Note bills
              </div>
            </div>
          </div>

          {/* Card 4: Split Credit Note Portion */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Receipt className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-amber-600 dark:text-amber-400 truncate">
                Split Credit Note
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.splitCreditNoteAmount)}
              </div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                From {stats.matchingSplitInvoices} Split bills
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (selectedPaymentType === "Split") {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Split Bills */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-warning-soft text-warning flex items-center justify-center shrink-0">
              <Receipt className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-warning truncate">
                Split Bills
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                {stats.pureSplitInvoices}
              </div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                Total split invoices
              </div>
            </div>
          </div>

          {/* Card 2: Total Split Amount */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Receipt className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-text-muted truncate">
                Total Split
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.totalAmount)}
              </div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                Reconciled value
              </div>
            </div>
          </div>

          {/* Card 3: Cash in Split */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
              <Banknote className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-success truncate">
                Cash Portion
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.splitCashAmount)}
              </div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                In split payments
              </div>
            </div>
          </div>

          {/* Card 4: UPI in Split */}
          <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
            <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <QrCode className="size-4.5 stroke-[1.8]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11.5px] font-medium text-indigo-500 dark:text-indigo-400 truncate">
                UPI Portion
              </div>
              <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                ₹{formatCurrency(stats.splitUpiAmount)}
              </div>
              <div className="text-[10px] text-text-muted truncate mt-0.5">
                In split payments
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default: All Payments
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Stat 1: Total Invoices */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <Receipt className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total Invoices
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {stats.totalInvoices}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              {stats.pureCashInvoices} Cash · {stats.pureUpiInvoices} UPI · {stats.pureSplitInvoices} Split
            </div>
          </div>
        </div>

        {/* Stat 2: Total Amount */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Receipt className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total Amount
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.totalAmount)}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Active sales
            </div>
          </div>
        </div>

        {/* Stat 3: Cash Amount */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <Banknote className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-success truncate">
              Cash Amount
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.cashAmount)}
            </div>
            {stats.splitCashAmount > 0 && (
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono truncate mt-0.5">
                (₹{formatCurrency(stats.splitCashAmount)} from Split)
              </div>
            )}
          </div>
        </div>

        {/* Stat 4: UPI Amount */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <QrCode className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-indigo-500 dark:text-indigo-400 truncate">
              UPI Amount
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              ₹{formatCurrency(stats.upiAmount)}
            </div>
            {stats.splitUpiAmount > 0 && (
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono truncate mt-0.5">
                (₹{formatCurrency(stats.splitUpiAmount)} from Split)
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 right-8 z-[9999] flex items-center gap-2.5 rounded-2xl border border-primary/30 bg-surface/95 px-4 py-3 text-sm font-semibold text-text shadow-xl backdrop-blur-md"
        >
          <CheckCircle2 className="size-5 text-primary shrink-0" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* ── 1. Compact 4-Card Statistics Grid (Independent of pagination) ───────── */}
      <div className="shrink-0">
        {renderDynamicStatsCards()}
      </div>

      {/* ── 2. Table Filter Toolbar (Using Reusable UI Components) ───────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {/* Search Input */}
        <div className="flex-1 min-w-[240px] sm:min-w-[280px]">
          <UIInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, customer or mobile..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => setSearchQuery("")}
            className="w-full"
          />
        </div>

        {/* Date Range Selector */}
        <div className="w-[150px] sm:w-[160px]">
          <UISelect
            value={selectedDateRange}
            onChange={(val) => setSelectedDateRange(val)}
            options={DATE_RANGE_OPTIONS}
            placeholder="Date Range"
            size="md"
          />
        </div>

        {/* Custom Date Pickers (Shown if Custom Range selected) */}
        {selectedDateRange === "custom" && (
          <div className="flex items-center gap-2 animate-in fade-in-50 duration-200">
            <div className="w-[140px]">
              <UIDatePicker
                value={customStartDate}
                onChange={(val) => setCustomStartDate(val || "")}
                placeholder="From date"
                size="md"
                isClearable
              />
            </div>
            <span className="text-xs text-text-muted">to</span>
            <div className="w-[140px]">
              <UIDatePicker
                value={customEndDate}
                onChange={(val) => setCustomEndDate(val || "")}
                placeholder="To date"
                size="md"
                isClearable
              />
            </div>
          </div>
        )}

        {/* Payment Type Selector */}
        <div className="w-[145px]">
          <UISelect
            value={selectedPaymentType}
            onChange={handlePaymentTypeChange}
            options={PAYMENT_TYPE_OPTIONS}
            placeholder="All Payments"
            size="md"
          />
        </div>

        {/* UPI QR Sub-Filter (shown only when UPI selected) */}
        {selectedPaymentType === "UPI" && (
          <div className="w-[180px] sm:w-[210px] animate-in fade-in-50 duration-200">
            <UISelect
              value={selectedPaymentQr}
              onChange={(val) => setSelectedPaymentQr(val)}
              options={upiQrOptions}
              placeholder="All UPI QRs"
              size="md"
            />
          </div>
        )}

        {/* Advanced Filter Modal Button (with active badge count) */}
        <UIButton
          type="button"
          variant={modalActiveFiltersCount > 0 ? "primary" : "secondary"}
          size="md"
          onClick={() => setIsFilterModalOpen(true)}
          startIcon={<SlidersHorizontal className="size-4" />}
          className={cn(
            "h-10 px-3.5 shrink-0 transition-all",
            modalActiveFiltersCount > 0 && "font-bold shadow-xs"
          )}
          title="Open Advanced Filters"
        >
          <span>Filters</span>
          {modalActiveFiltersCount > 0 && (
            <span className="size-5 rounded-full bg-white/25 text-white font-mono text-[10.5px] font-bold flex items-center justify-center shrink-0 ml-1">
              {modalActiveFiltersCount}
            </span>
          )}
        </UIButton>

        {/* Refresh Button */}
        <UIButton
          type="button"
          variant="secondary"
          size="md"
          disabled={isLoading}
          onClick={fetchInvoices}
          startIcon={
            <RefreshCw
              className={cn("size-4 text-primary", isLoading && "animate-spin")}
            />
          }
          className="h-10 px-3.5 shrink-0"
          title="Refresh Invoices"
        >
          Refresh
        </UIButton>

        {/* Reset Filters Button */}
        <UIButton
          type="button"
          variant="ghost"
          size="md"
          onClick={handleResetFilters}
          startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
          className="h-10 px-3 text-text-muted hover:text-text shrink-0"
          title="Reset All Filters"
        >
          Reset
        </UIButton>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ────── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col">
        {/* Internal Vertical Scroll Container: The definitive scroll parent */}
        <div
          ref={tableContainerRef}
          className="relative overflow-y-auto overflow-x-auto flex-1 min-h-0 divide-y divide-border/60"
        >
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full"
          >
            {/* Sticky Header: pinned to top of tableContainerRef with solid surface background */}
            <UITableHeader sticky className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs">
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
                <UITableHead
                  sticky
                  sortable
                  sortDirection={sortBy === "invoiceNo" ? sortOrder : null}
                  onSort={() => handleHeaderSort("invoiceNo")}
                  className="min-w-[150px]"
                >
                  Invoice No
                </UITableHead>
                <UITableHead sticky className="min-w-[220px]">Customer / Patient</UITableHead>
                <UITableHead
                  sticky
                  sortable
                  sortDirection={sortBy === "date" ? sortOrder : null}
                  onSort={() => handleHeaderSort("date")}
                  className="min-w-[140px]"
                >
                  Date
                </UITableHead>
                <UITableHead sticky align="center" className="min-w-[120px]">Payment Type</UITableHead>
                <UITableHead
                  sticky
                  sortable
                  align="right"
                  sortDirection={sortBy === "amount" ? sortOrder : null}
                  onSort={() => handleHeaderSort("amount")}
                  className="min-w-[180px]"
                >
                  Amount
                </UITableHead>
                <UITableHead sticky align="center" className="min-w-[100px]">Status</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading ? (
                <UITableLoading columns={6} rows={6} />
              ) : invoices.length === 0 ? (
                <UITableEmpty
                  colSpan={6}
                  title="No invoices found"
                  description={
                    debouncedSearch || selectedPaymentType !== "all" || selectedStatus !== "all"
                      ? "No invoices match your selected filter criteria. Try clearing filters."
                      : "No invoices recorded for the selected date range."
                  }
                  action={
                    (debouncedSearch || selectedPaymentType !== "all" || selectedStatus !== "all" || selectedDateRange !== "today") ? (
                      <UIButton
                        variant="secondary"
                        size="sm"
                        onClick={handleResetFilters}
                      >
                        Clear Filters
                      </UIButton>
                    ) : undefined
                  }
                />
              ) : (
                invoices.map((inv) => {
                  const split = inv.split || getSplitBreakdown(inv);
                  const isSplit = inv.isSplit ?? (
                    String(inv.paymentMode || inv.paymentMethod || "").trim().toUpperCase() === "SPLIT" ||
                    (Array.isArray(inv.payments) && inv.payments.length > 1) ||
                    [split.cash > 0, split.upi > 0, split.creditNote > 0, split.advance > 0, split.credit > 0, split.card > 0].filter(Boolean).length > 1
                  );
                  const isSplitUnderCash = selectedPaymentType === "Cash" && isSplit && split.cash > 0;
                  const isSplitUnderUpi = selectedPaymentType === "UPI" && isSplit && split.upi > 0;
                  const isSplitUnderCreditNote = (selectedPaymentType === "CreditNote" || selectedPaymentType === "creditnote") && isSplit && split.creditNote > 0;
                  const isSplitUnderCredit = selectedPaymentType === "Credit" && isSplit && split.credit > 0;
                  const isSplitUnderAdvance = selectedPaymentType === "Advance" && isSplit && split.advance > 0;
                  const isSplitUnderSingleFilter = isSplitUnderCash || isSplitUnderUpi || isSplitUnderCreditNote || isSplitUnderCredit || isSplitUnderAdvance;

                  return (
                    <UITableRow
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isSplitUnderCash
                          ? "bg-emerald-500/[0.05] dark:bg-emerald-500/[0.10] hover:bg-emerald-500/[0.09] dark:hover:bg-emerald-500/[0.15] border-l-[3.5px] border-l-emerald-500"
                          : isSplitUnderUpi
                            ? "bg-sky-500/[0.05] dark:bg-sky-500/[0.10] hover:bg-sky-500/[0.09] dark:hover:bg-sky-500/[0.15] border-l-[3.5px] border-l-sky-500"
                            : isSplitUnderCreditNote
                              ? "bg-indigo-500/[0.05] dark:bg-indigo-500/[0.10] hover:bg-indigo-500/[0.09] dark:hover:bg-indigo-500/[0.15] border-l-[3.5px] border-l-indigo-500"
                              : isSplitUnderCredit
                                ? "bg-rose-500/[0.05] dark:bg-rose-500/[0.10] hover:bg-rose-500/[0.09] dark:hover:bg-rose-500/[0.15] border-l-[3.5px] border-l-rose-500"
                                : isSplitUnderAdvance
                                  ? "bg-amber-500/[0.05] dark:bg-amber-500/[0.10] hover:bg-amber-500/[0.09] dark:hover:bg-amber-500/[0.15] border-l-[3.5px] border-l-amber-500"
                                  : "hover:bg-surface-hover/70"
                      )}
                    >
                      {/* Invoice No & Shift */}
                      <UITableCell className="whitespace-nowrap">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-primary font-mono text-[13px] tracking-tight">
                            {inv.invoiceNo}
                          </span>
                          <span className="text-[11px] text-text-muted font-mono truncate">
                            {inv.shiftNo
                              ? `Shift: ${inv.shiftNo}${inv.shiftName ? ` (${inv.shiftName})` : ""}`
                              : (inv.shiftName ? `Shift: ${inv.shiftName}` : "Shift: —")}
                          </span>
                        </div>
                      </UITableCell>

                      {/* Customer / Patient */}
                      <UITableCell>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text truncate">
                            {inv.customer}
                          </span>
                          <span className="text-[13px] font-bold text-text/90 font-mono tracking-tight truncate">
                            {inv.phone || "—"}
                          </span>
                        </div>
                      </UITableCell>

                      {/* Date & Time */}
                      <UITableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-text text-xs">
                            {inv.issueDate}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono">
                            {formatTime(inv.createdAt || inv.rawDate)}
                          </span>
                          {inv.updatedAt &&
                            inv.createdAt &&
                            new Date(inv.updatedAt).getTime() - new Date(inv.createdAt).getTime() > 2000 && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 w-max">
                                Edited: {formatTime(inv.updatedAt)}
                              </span>
                            )}
                        </div>
                      </UITableCell>

                      {/* Payment Type */}
                      <UITableCell align="center" className="whitespace-nowrap">
                        {renderPaymentTypeBadge(inv.paymentMode, isSplitUnderSingleFilter, inv.creditDueDate)}
                      </UITableCell>

                      {/* Amount with Split Breakdown & Dynamic Blurring */}
                      <UITableCell align="right">
                        <div className="flex flex-col items-end">
                          {isSplit ? (
                            selectedPaymentType === "Cash" ? (
                              <div className="flex flex-col items-end">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Cash:</span>
                                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums text-sm">
                                    ₹{formatCurrency(split.cash)}
                                  </span>
                                </div>
                                {(split.upi > 0 || split.creditNote > 0 || split.advance > 0 || split.credit > 0) && (
                                  <div
                                    className="flex flex-col items-end gap-0.5 mt-0.5 filter blur-[2px] opacity-40 select-none transition-all cursor-not-allowed"
                                    title="Other split amounts (blurred in Cash view)"
                                  >
                                    {split.creditNote > 0 && <span className="font-mono text-[10px] text-text-muted">CN: ₹{formatCurrency(split.creditNote)}</span>}
                                    {split.upi > 0 && <span className="font-mono text-[10px] text-text-muted">UPI: ₹{formatCurrency(split.upi)}</span>}
                                    {split.advance > 0 && <span className="font-mono text-[10px] text-text-muted">Adv: ₹{formatCurrency(split.advance)}</span>}
                                    {split.credit > 0 && <span className="font-mono text-[10px] text-text-muted">Credit: ₹{formatCurrency(split.credit)}</span>}
                                  </div>
                                )}
                                <span className="text-[9.5px] text-text-muted/70 font-mono mt-0.5">
                                  Total: ₹{formatCurrency(inv.amount)}
                                </span>
                              </div>
                            ) : selectedPaymentType === "UPI" ? (
                              <div className="flex flex-col items-end">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">UPI:</span>
                                  <span className="font-mono font-bold text-sky-600 dark:text-sky-400 tabular-nums text-sm">
                                    ₹{formatCurrency(split.upi)}
                                  </span>
                                </div>
                                {(split.cash > 0 || split.creditNote > 0 || split.advance > 0 || split.credit > 0) && (
                                  <div
                                    className="flex flex-col items-end gap-0.5 mt-0.5 filter blur-[2px] opacity-40 select-none transition-all cursor-not-allowed"
                                    title="Other split amounts (blurred in UPI view)"
                                  >
                                    {split.creditNote > 0 && <span className="font-mono text-[10px] text-text-muted">CN: ₹{formatCurrency(split.creditNote)}</span>}
                                    {split.cash > 0 && <span className="font-mono text-[10px] text-text-muted">Cash: ₹{formatCurrency(split.cash)}</span>}
                                    {split.advance > 0 && <span className="font-mono text-[10px] text-text-muted">Adv: ₹{formatCurrency(split.advance)}</span>}
                                    {split.credit > 0 && <span className="font-mono text-[10px] text-text-muted">Credit: ₹{formatCurrency(split.credit)}</span>}
                                  </div>
                                )}
                                <span className="text-[9.5px] text-text-muted/70 font-mono mt-0.5">
                                  Total: ₹{formatCurrency(inv.amount)}
                                </span>
                              </div>
                            ) : (selectedPaymentType === "CreditNote" || selectedPaymentType === "creditnote") ? (
                              <div className="flex flex-col items-end">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Credit Note:</span>
                                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums text-sm">
                                    ₹{formatCurrency(split.creditNote)}
                                  </span>
                                </div>
                                {(split.cash > 0 || split.upi > 0 || split.advance > 0 || split.credit > 0) && (
                                  <div
                                    className="flex flex-col items-end gap-0.5 mt-0.5 filter blur-[2px] opacity-40 select-none transition-all cursor-not-allowed"
                                    title="Other split amounts (blurred in Credit Note view)"
                                  >
                                    {split.cash > 0 && <span className="font-mono text-[10px] text-text-muted">Cash: ₹{formatCurrency(split.cash)}</span>}
                                    {split.upi > 0 && <span className="font-mono text-[10px] text-text-muted">UPI: ₹{formatCurrency(split.upi)}</span>}
                                    {split.advance > 0 && <span className="font-mono text-[10px] text-text-muted">Adv: ₹{formatCurrency(split.advance)}</span>}
                                    {split.credit > 0 && <span className="font-mono text-[10px] text-text-muted">Credit: ₹{formatCurrency(split.credit)}</span>}
                                  </div>
                                )}
                                <span className="text-[9.5px] text-text-muted/70 font-mono mt-0.5">
                                  Total: ₹{formatCurrency(inv.amount)}
                                </span>
                              </div>
                            ) : selectedPaymentType === "Credit" ? (
                              <div className="flex flex-col items-end">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Credit:</span>
                                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums text-sm">
                                    ₹{formatCurrency(split.credit)}
                                  </span>
                                </div>
                                {(split.cash > 0 || split.upi > 0 || split.creditNote > 0 || split.advance > 0) && (
                                  <div
                                    className="flex flex-col items-end gap-0.5 mt-0.5 filter blur-[2px] opacity-40 select-none transition-all cursor-not-allowed"
                                    title="Other split amounts (blurred in Credit view)"
                                  >
                                    {split.creditNote > 0 && <span className="font-mono text-[10px] text-text-muted">CN: ₹{formatCurrency(split.creditNote)}</span>}
                                    {split.cash > 0 && <span className="font-mono text-[10px] text-text-muted">Cash: ₹{formatCurrency(split.cash)}</span>}
                                    {split.upi > 0 && <span className="font-mono text-[10px] text-text-muted">UPI: ₹{formatCurrency(split.upi)}</span>}
                                    {split.advance > 0 && <span className="font-mono text-[10px] text-text-muted">Adv: ₹{formatCurrency(split.advance)}</span>}
                                  </div>
                                )}
                                <span className="text-[9.5px] text-text-muted/70 font-mono mt-0.5">
                                  Total: ₹{formatCurrency(inv.amount)}
                                </span>
                              </div>
                            ) : selectedPaymentType === "Advance" ? (
                              <div className="flex flex-col items-end">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Advance:</span>
                                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums text-sm">
                                    ₹{formatCurrency(split.advance)}
                                  </span>
                                </div>
                                {(split.cash > 0 || split.upi > 0 || split.creditNote > 0 || split.credit > 0) && (
                                  <div
                                    className="flex flex-col items-end gap-0.5 mt-0.5 filter blur-[2px] opacity-40 select-none transition-all cursor-not-allowed"
                                    title="Other split amounts (blurred in Advance view)"
                                  >
                                    {split.creditNote > 0 && <span className="font-mono text-[10px] text-text-muted">CN: ₹{formatCurrency(split.creditNote)}</span>}
                                    {split.cash > 0 && <span className="font-mono text-[10px] text-text-muted">Cash: ₹{formatCurrency(split.cash)}</span>}
                                    {split.upi > 0 && <span className="font-mono text-[10px] text-text-muted">UPI: ₹{formatCurrency(split.upi)}</span>}
                                    {split.credit > 0 && <span className="font-mono text-[10px] text-text-muted">Credit: ₹{formatCurrency(split.credit)}</span>}
                                  </div>
                                )}
                                <span className="text-[9.5px] text-text-muted/70 font-mono mt-0.5">
                                  Total: ₹{formatCurrency(inv.amount)}
                                </span>
                              </div>
                            ) : (
                              // Standard view (All Payments / Split)
                              <div className="flex flex-col items-end">
                                <span className="font-mono font-bold text-text tabular-nums text-sm">
                                  ₹{formatCurrency(inv.amount)}
                                </span>
                                <div className="mt-0.5 flex flex-col items-end text-[10.5px] font-mono leading-tight gap-0.5">
                                  {split.creditNote > 0 && (
                                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                      CN: ₹{formatCurrency(split.creditNote)}
                                    </span>
                                  )}
                                  {split.cash > 0 && (
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                      Cash: ₹{formatCurrency(split.cash)}
                                    </span>
                                  )}
                                  {split.upi > 0 && (
                                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                                      UPI: ₹{formatCurrency(split.upi)}
                                    </span>
                                  )}
                                  {split.advance > 0 && (
                                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                                      Adv: ₹{formatCurrency(split.advance)}
                                    </span>
                                  )}
                                  {split.credit > 0 && (
                                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                                      Credit: ₹{formatCurrency(split.credit)}
                                    </span>
                                  )}
                                  {split.card > 0 && (
                                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                                      Card: ₹{formatCurrency(split.card)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          ) : (
                            // Regular non-split invoices
                            <span className="font-mono font-bold text-text tabular-nums text-sm">
                              ₹{formatCurrency(inv.amount)}
                            </span>
                          )}
                        </div>
                      </UITableCell>

                      {/* Status */}
                      <UITableCell align="center" className="whitespace-nowrap">
                        {renderStatusBadge(inv.status)}
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Reusable UIInfiniteScroll Component */}
          {!isLoading && invoices.length > 0 && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              rootRef={tableContainerRef}
              rootMargin="160px"
              endMessage={
                !hasMore && invoices.length > 0 ? (
                  <span className="font-mono text-[11px] text-text-muted select-none">
                    ✓ All {totalInvoices} matching invoices loaded
                  </span>
                ) : null
              }
            />
          )}
        </div>
      </div>

      {/* Invoice Details Drawer */}
      <BillingInvoiceDetailsDrawer
        invoice={selectedInvoice}
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        onCancelInvoice={handleCancelInvoice}
      />

      {/* ── Advanced Invoice Filters Dialog ── */}
      <BillingInvoiceFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        initialFilters={{
          fromInvoice,
          toInvoice,
          status: selectedStatus,
          sortBy: sortOption,
        }}
        onApply={(newFilters) => {
          setFromInvoice(newFilters.fromInvoice || "");
          setToInvoice(newFilters.toInvoice || "");
          setSelectedStatus(newFilters.status || "all");
          setSortOption(newFilters.sortBy || "date-desc");
        }}
        onReset={() => {
          setFromInvoice("");
          setToInvoice("");
          setSelectedStatus("all");
          setSortOption("date-desc");
        }}
        statusOptions={STATUS_SELECT_OPTIONS}
        sortOptions={SORT_SELECT_OPTIONS}
      />
    </div>
  );
};

export default BillingDesktopPage;

