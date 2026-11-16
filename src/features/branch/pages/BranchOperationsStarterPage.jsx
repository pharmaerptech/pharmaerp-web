// src/features/branch/pages/BranchOperationsStarterPage.jsx

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useIsMobile } from "@/hooks";
import useBranch from "../hooks/useBranch";
import { useActiveShift } from "@/features/operations/shifts/hooks/useActiveShift";
import { fetchBranchCash } from "@/features/finance/treasury/cash-management/branch-cash/store/branchCashThunk";
import branchCashService from "@/features/finance/treasury/cash-management/branch-cash/services/branchCashService";
import {
  selectRunningCash,
  selectFrozenCash,
  selectCurrentBranchCash,
  selectAllBranchCash,
} from "@/features/finance/treasury/cash-management/branch-cash/store/branchCashSelector";
import invoiceService from "@/features/sales/services/invoiceService";
import { CreateShiftDialog, CloseShiftDialog } from "@/features/operations/shifts/components";
import CustomerDialog from "@/features/parties/customers/components/CustomerDialog";

import BranchOperationsStarterDesktopPage from "./desktop/BranchOperationsStarterDesktopPage";
import BranchOperationsStarterMobilePage from "./mobile/BranchOperationsStarterMobilePage";

const sumDenoms = (denominations = []) =>
  (Array.isArray(denominations) ? denominations : []).reduce(
    (s, d) => s + (Number(d.denomination) || 0) * (Number(d.quantity) || Number(d.count) || 0),
    0
  );

const resolveCashFromObject = (obj) => {
  if (!obj) return null;

  const runningDenoms =
    obj.denominationBalance?.runningDenominations ||
    obj.balance?.runningDenominations ||
    [];
  const frozenDenoms =
    obj.denominationBalance?.frozenDenominations ||
    obj.balance?.frozenDenominations ||
    [];

  const runningSum = sumDenoms(runningDenoms);
  const frozenSum = sumDenoms(frozenDenoms);

  const running =
    runningSum > 0
      ? runningSum
      : typeof obj.denominationBalance?.runningTotal === "number"
      ? obj.denominationBalance.runningTotal
      : typeof obj.balance?.runningTotal === "number"
      ? obj.balance.runningTotal
      : typeof obj.runningCash === "number"
      ? obj.runningCash
      : typeof obj.runningTotal === "number"
      ? obj.runningTotal
      : typeof obj.runningCashTotal === "number"
      ? obj.runningCashTotal
      : 0;

  const frozen =
    frozenSum > 0
      ? frozenSum
      : typeof obj.denominationBalance?.frozenTotal === "number"
      ? obj.denominationBalance.frozenTotal
      : typeof obj.balance?.frozenTotal === "number"
      ? obj.balance.frozenTotal
      : typeof obj.frozenCash === "number"
      ? obj.frozenCash
      : typeof obj.frozenTotal === "number"
      ? obj.frozenTotal
      : typeof obj.frozenCashTotal === "number"
      ? obj.frozenCashTotal
      : 0;

  const total =
    running + frozen > 0
      ? running + frozen
      : typeof obj.totalVault === "number"
      ? obj.totalVault
      : typeof obj.totalCash === "number"
      ? obj.totalCash
      : 0;

  return {
    running,
    frozen,
    total,
  };
};

export const BranchOperationsStarterPage = () => {
  const isMobile = useIsMobile();
  const dispatch = useDispatch();

  const { currentBranch } = useBranch();
  const branchId = currentBranch?._id || currentBranch?.id || null;

  // Active shift hook with forced cache invalidation
  const { activeShift, refetch: refetchShift } = useActiveShift(branchId);

  // Redux branch cash state & selectors
  const reduxRunningCash = useSelector(selectRunningCash);
  const reduxFrozenCash = useSelector(selectFrozenCash);
  const currentBranchCash = useSelector(selectCurrentBranchCash);
  const allBranchCash = useSelector(selectAllBranchCash);

  // Direct live branch cash state from API
  const [liveBranchCash, setLiveBranchCash] = useState(null);

  // Real today's invoice stats from API
  const [salesSummary, setSalesSummary] = useState({
    totalSales: 0,
    totalInvoices: 0,
    cashSales: 0,
    upiSales: 0,
    isLoaded: false,
  });
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Operational dialog states
  const [isCreateShiftOpen, setIsCreateShiftOpen] = useState(false);
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Fetch real today's sales & bill count from API (for manual refresh)
  const fetchTodaySalesStats = useCallback(async (bId) => {
    if (!bId) return;
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

      const res = await invoiceService.getAllCustomerSales({
        branchId: bId,
        startDate: start,
        endDate: end,
        limit: 1,
      });

      const resData = res.data?.data || {};
      const summary = resData.summary || {};
      const totalCount = resData.meta?.total ?? (Array.isArray(resData.data) ? resData.data.length : 0);

      setSalesSummary({
        totalSales: Number(summary.totalAmount || 0),
        totalInvoices: Number(summary.totalInvoices ?? totalCount ?? 0),
        cashSales: Number(summary.cashAmount || 0),
        upiSales: Number(summary.upiAmount || 0),
        isLoaded: true,
      });
    } catch {
      setSalesSummary((prev) => ({ ...prev, isLoaded: true }));
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  // Fetch all live operational metrics when branch is available or changed
  useEffect(() => {
    let isSubscribed = true;
    if (branchId) {
      refetchShift();
      dispatch(fetchBranchCash(branchId));

      // Direct branch cash fetch to ensure latest physical cash is immediately available
      branchCashService
        .getBranchCash(branchId)
        .then((res) => {
          if (!isSubscribed) return;
          const data = res?.data?.data ?? res?.data;
          if (data) setLiveBranchCash(data);
        })
        .catch(() => {
          if (!isSubscribed) return;
          // Fallback to all branch cash list if single-branch throws 404
          branchCashService
            .getAllBranchCash()
            .then((res) => {
              if (!isSubscribed) return;
              const list = res?.data?.data ?? res?.data;
              if (Array.isArray(list)) {
                const bIdStr = String(branchId);
                const matched = list.find((b) => {
                  const bId = b.branchId?._id ? String(b.branchId._id) : b.branchId ? String(b.branchId) : null;
                  return bId === bIdStr;
                });
                if (matched) setLiveBranchCash(matched);
              }
            })
            .catch(() => null);
        });

      // Today's sales aggregator
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

      invoiceService
        .getAllCustomerSales({
          branchId,
          startDate: start,
          endDate: end,
          limit: 1,
        })
        .then((res) => {
          if (!isSubscribed) return;
          const resData = res?.data?.data || {};
          const summary = resData.summary || {};
          const totalCount = resData.meta?.total ?? (Array.isArray(resData.data) ? resData.data.length : 0);

          setSalesSummary({
            totalSales: Number(summary.totalAmount || 0),
            totalInvoices: Number(summary.totalInvoices ?? totalCount ?? 0),
            cashSales: Number(summary.cashAmount || 0),
            upiSales: Number(summary.upiAmount || 0),
            isLoaded: true,
          });
        })
        .catch(() => {
          if (!isSubscribed) return;
          setSalesSummary((prev) => ({ ...prev, isLoaded: true }));
        });
    }
    return () => {
      isSubscribed = false;
    };
  }, [branchId, refetchShift, dispatch]);

  const handleRefresh = useCallback(() => {
    if (branchId) {
      setIsLoadingSummary(true);
      refetchShift();
      dispatch(fetchBranchCash(branchId));
      fetchTodaySalesStats(branchId);
      branchCashService
        .getBranchCash(branchId)
        .then((res) => {
          const data = res?.data?.data ?? res?.data;
          if (data) setLiveBranchCash(data);
        })
        .catch(() => null);
    }
  }, [branchId, refetchShift, dispatch, fetchTodaySalesStats]);

  // Priority-resolved real metrics:
  // 1. Live shift status & Shift Name resolution
  const isShiftOpen = Boolean(activeShift && (activeShift.status === "open" || activeShift.status === "closing"));

  const shiftTitle = useMemo(() => {
    if (!activeShift) return "No Active Shift";
    if (activeShift.shiftName && activeShift.shiftName.trim()) {
      return activeShift.shiftName.trim();
    }
    if (activeShift.shiftNo) {
      return `Shift #${activeShift.shiftNo}`;
    }
    const shiftDate = activeShift.openedAt || activeShift.createdAt;
    if (!shiftDate) return "General Shift";
    const hour = new Date(shiftDate).getHours();
    if (hour >= 5 && hour < 12) return "Morning Shift";
    if (hour >= 12 && hour < 17) return "Afternoon Shift";
    if (hour >= 17 && hour < 21) return "Evening Shift";
    return "Night Shift";
  }, [activeShift]);

  const cashierName = useMemo(() => {
    return activeShift?.cashierName || activeShift?.openedBy?.fullName || "Counter Live";
  }, [activeShift]);

  // 2. Real physical cash resolution (Running drawer cash + Frozen vault cash)
  const cashMetrics = useMemo(() => {
    // 1. Live branch cash from direct API call
    const fromLive = resolveCashFromObject(liveBranchCash);
    if (fromLive && (fromLive.total > 0 || fromLive.running > 0)) {
      return fromLive;
    }

    // 2. Current branch cash from Redux
    const fromCurrent = resolveCashFromObject(currentBranchCash);
    if (fromCurrent && (fromCurrent.total > 0 || fromCurrent.running > 0)) {
      return fromCurrent;
    }

    // 3. All branch cash list from Redux
    if (Array.isArray(allBranchCash) && branchId) {
      const bIdStr = String(branchId);
      const matched = allBranchCash.find((b) => {
        const bId = b.branchId?._id ? String(b.branchId._id) : b.branchId ? String(b.branchId) : null;
        return bId === bIdStr;
      });
      const fromAll = resolveCashFromObject(matched);
      if (fromAll && (fromAll.total > 0 || fromAll.running > 0)) {
        return fromAll;
      }
    }

    // 4. Redux selectors
    if (reduxRunningCash > 0 || reduxFrozenCash > 0) {
      return {
        running: reduxRunningCash,
        frozen: reduxFrozenCash,
        total: reduxRunningCash + reduxFrozenCash,
      };
    }

    // 5. Active shift opening float + live cash sales
    if (activeShift?.openingFloat) {
      const floatAmount = Number(activeShift.openingFloat || 0);
      const cashSalesAmount = Number(salesSummary.cashSales || 0);
      const shiftTotal = floatAmount + cashSalesAmount;
      return {
        running: shiftTotal,
        frozen: 0,
        total: shiftTotal,
      };
    }

    return {
      running: 0,
      frozen: 0,
      total: 0,
    };
  }, [
    liveBranchCash,
    currentBranchCash,
    allBranchCash,
    branchId,
    reduxRunningCash,
    reduxFrozenCash,
    activeShift,
    salesSummary.cashSales,
  ]);

  // Physical cash balance shown on the primary stat card
  // If running cash exists, that is primary till drawer cash; if only total/vault exists, show total physical cash
  const tillCashBalance = useMemo(() => {
    if (cashMetrics.running > 0) return cashMetrics.running;
    if (cashMetrics.total > 0) return cashMetrics.total;
    if (activeShift?.openingFloat) {
      return Number(activeShift.openingFloat) + Number(salesSummary.cashSales || 0);
    }
    return 0;
  }, [cashMetrics, activeShift, salesSummary.cashSales]);

  // 3. Real today's sales: from live invoice API summary, or activeShift totalSales
  const todaySalesAmount = useMemo(() => {
    if (salesSummary.isLoaded && salesSummary.totalSales > 0) {
      return salesSummary.totalSales;
    }
    if (activeShift?.totalSales) {
      return Number(activeShift.totalSales);
    }
    return salesSummary.totalSales || 0;
  }, [salesSummary, activeShift]);

  // 4. Real today's invoice count: from live invoice API summary, or activeShift billCount
  const todayInvoicesCount = useMemo(() => {
    if (salesSummary.isLoaded && salesSummary.totalInvoices > 0) {
      return salesSummary.totalInvoices;
    }
    if (activeShift?.billCount !== undefined && activeShift?.billCount !== null) {
      return Number(activeShift.billCount);
    }
    return salesSummary.totalInvoices || 0;
  }, [salesSummary, activeShift]);

  const pageProps = {
    branch: currentBranch,
    activeShift,
    isShiftOpen,
    shiftTitle,
    cashierName,
    tillCashBalance,
    runningCash: cashMetrics.running,
    frozenCash: cashMetrics.frozen,
    totalPhysicalCash: cashMetrics.total,
    todaySalesAmount,
    todayInvoicesCount,
    salesSummary,
    isLoading: isLoadingSummary,
    onRefresh: handleRefresh,
    onOpenCreateShift: () => setIsCreateShiftOpen(true),
    onOpenCloseShift: () => setIsCloseShiftOpen(true),
    onOpenCustomerModal: () => setIsCustomerModalOpen(true),
  };

  return (
    <>
      {isMobile ? (
        <BranchOperationsStarterMobilePage {...pageProps} />
      ) : (
        <BranchOperationsStarterDesktopPage {...pageProps} />
      )}

      <CreateShiftDialog
        isOpen={isCreateShiftOpen}
        onClose={() => {
          setIsCreateShiftOpen(false);
          refetchShift();
          handleRefresh();
        }}
      />

      {activeShift && (
        <CloseShiftDialog
          isOpen={isCloseShiftOpen}
          shift={activeShift}
          onClose={() => {
            setIsCloseShiftOpen(false);
            refetchShift();
            handleRefresh();
          }}
        />
      )}

      <CustomerDialog
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        mode="create"
        customerData={null}
        onSuccess={() => {
          handleRefresh();
        }}
      />
    </>
  );
};

export default BranchOperationsStarterPage;
