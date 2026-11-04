// src/features/dashboard/pages/BranchDashboardPage.jsx

import { useState } from "react";
import { useBranchDashboardData } from "../hooks";
import {
  BranchDashboardHeader,
  BranchKpiGrid,
  BranchSalesTrendCard,
  BranchPaymentBreakdownCard,
  BranchCurrentShiftCard,
  BranchLowStockCard,
  BranchNearExpiryCard,
  BranchPurchaseReceiptsCard,
  BranchRecentSalesCard,
  BranchInterBranchTransfersCard,
} from "../components/branch";

export const BranchDashboardPage = () => {
  const [selectedDate, setSelectedDate] = useState("Today");
  const { data, isLoading, refresh } = useBranchDashboardData(selectedDate);

  return (
    <section className="min-h-[100dvh] w-full bg-bg px-3 sm:px-5 py-4 font-sans text-text dashboard-no-scrollbar">
      <div className="max-w-[1600px] mx-auto space-y-3.5">
        {/* ── 1. Header with Branch Identity, Business Day & Date Selector ──── */}
        <BranchDashboardHeader
          branchInfo={data?.branchInfo}
          selectedDate={selectedDate}
          onRefresh={refresh}
          isLoading={isLoading}
          onDateSelect={setSelectedDate}
        />

        {/* ── 2. Top 5 Real-Time Operational KPI Cards ───────────────────── */}
        <BranchKpiGrid kpis={data?.kpis} isLoading={isLoading} />

        {/* ── 3. Middle Visuals Grid (Hourly Sales Rush, Payment Modes, Live Shift) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 items-start">
          {/* Hourly Sales Trend Line/Bar Combo (5 cols) */}
          <div className="md:col-span-2 lg:col-span-5 flex flex-col min-w-0">
            <BranchSalesTrendCard
              salesTrend={data?.salesTrend}
              className="h-fit"
              isLoading={isLoading}
            />
          </div>

          {/* Payment Mode Breakdown Donut (4 cols) */}
          <div className="md:col-span-1 lg:col-span-4 flex flex-col min-w-0">
            <BranchPaymentBreakdownCard
              paymentData={data?.paymentModeBreakdown}
              className="h-fit"
              isLoading={isLoading}
            />
          </div>

          {/* Current Active Shift & Cash in Drawer (3 cols) */}
          <div className="md:col-span-1 lg:col-span-3 flex flex-col min-w-0">
            <BranchCurrentShiftCard
              shiftData={data?.currentShift}
              className="h-fit"
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* ── 4. Operational Shortages & Procurement Row ────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start">
          {/* Low Stock Items */}
          <div className="flex flex-col min-w-0">
            <BranchLowStockCard
              items={data?.lowStockItems}
              className="h-fit"
              isLoading={isLoading}
            />
          </div>

          {/* Near Expiry Batches */}
          <div className="flex flex-col min-w-0">
            <BranchNearExpiryCard
              items={data?.nearExpiryItems}
              className="h-fit"
              isLoading={isLoading}
            />
          </div>

          {/* Today's Inward Purchase Bills */}
          <div className="flex flex-col min-w-0">
            <BranchPurchaseReceiptsCard
              receipts={data?.todaysPurchases}
              className="h-fit"
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* ── 5. Operational Activity Streams (Counter Sales & Transfers) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
          {/* Today's Recent Sales Invoices */}
          <div className="flex flex-col min-w-0">
            <BranchRecentSalesCard
              sales={data?.recentSales}
              className="h-fit"
              isLoading={isLoading}
            />
          </div>

          {/* Inter-Branch Stock Transfers */}
          <div className="flex flex-col min-w-0">
            <BranchInterBranchTransfersCard
              transfers={data?.interBranchTransfers}
              className="h-fit"
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BranchDashboardPage;
