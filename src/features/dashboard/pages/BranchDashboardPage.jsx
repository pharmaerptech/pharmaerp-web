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
  BranchOnlineOrdersCard,
  BranchInterBranchTransfersCard,
} from "../components/branch";

export const BranchDashboardPage = () => {
  const [selectedDate, setSelectedDate] = useState("Oct 01, 2026");
  const { data, isLoading, refresh } = useBranchDashboardData(selectedDate);

  return (
    <section className="min-h-[100dvh] w-full bg-bg px-3 sm:px-5 py-4 font-sans text-text">
      <div className="max-w-[1600px] mx-auto space-y-3.5">
        {/* ── 1. Header with Breadcrumb, Date & Business Day Status ──── */}
        <BranchDashboardHeader
          branchInfo={data?.branchInfo}
          selectedDate={selectedDate}
          onRefresh={refresh}
          isLoading={isLoading}
          onDateChange={() => {
            setSelectedDate((prev) =>
              prev === "Oct 01, 2026" ? "Today" : "Oct 01, 2026"
            );
          }}
        />

        {/* ── 2. Top 5 KPI Metrics Strip ───────────────────────────── */}
        <BranchKpiGrid kpis={data?.kpis} />

        {/* ── 3. Middle Visuals Grid (Sales Trend, Payment Modes, Current Shift) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 items-stretch">
          {/* Sales Trend Combo Chart (5 cols on large desktop, full on tablet) */}
          <div className="md:col-span-2 lg:col-span-5 flex flex-col min-w-0">
            <BranchSalesTrendCard
              salesTrend={data?.salesTrend}
              className="h-full"
            />
          </div>

          {/* Payment Mode Breakdown Donut (4 cols on large desktop, half on tablet) */}
          <div className="md:col-span-1 lg:col-span-4 flex flex-col min-w-0">
            <BranchPaymentBreakdownCard
              paymentData={data?.paymentModeBreakdown}
              className="h-full"
            />
          </div>

          {/* Current Shift Card (3 cols on large desktop, half on tablet) */}
          <div className="md:col-span-1 lg:col-span-3 flex flex-col min-w-0">
            <BranchCurrentShiftCard
              shiftData={data?.currentShift}
              className="h-full"
            />
          </div>
        </div>

        {/* ── 4. Operational Tables Row 1 (Low Stock, Near Expiry, Purchase Receipts) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
          <BranchLowStockCard
            items={data?.lowStockItems}
            className="h-full"
          />

          <BranchNearExpiryCard
            items={data?.nearExpiryItems}
            className="h-full"
          />

          <BranchPurchaseReceiptsCard
            receipts={data?.todaysPurchases}
            className="h-full"
          />
        </div>

        {/* ── 5. Operational Tables Row 2 (Recent Sales, Online Orders, Transfers) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
          <BranchRecentSalesCard
            sales={data?.recentSales}
            className="h-full"
          />

          <BranchOnlineOrdersCard
            orders={data?.onlineOrders}
            className="h-full"
          />

          <BranchInterBranchTransfersCard
            transfers={data?.interBranchTransfers}
            className="h-full"
          />
        </div>
      </div>
    </section>
  );
};

export default BranchDashboardPage;
