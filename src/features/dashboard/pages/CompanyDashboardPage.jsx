// src/features/dashboard/pages/CompanyDashboardPage.jsx

import { useState } from "react";
import { useCompanyDashboardData } from "../hooks";
import {
  CompanyDashboardHeader,
  CompanyKpiGrid,
  CompanySalesPurchasesChartCard,
  CompanyBranchPerformanceCard,
  CompanyCategoryDonutCard,
  CompanyTopSellingProductsCard,
  CompanyGstSummaryCard,
  CompanyInventoryAlertsCard,
  CompanyRecentPurchasesCard,
  CompanyRecentSalesCard,
  CompanyInterBranchTransfersCard,
} from "../components/company";

export const CompanyDashboardPage = () => {
  const [timeframe, setTimeframe] = useState("This Month");
  const [dateRange, setDateRange] = useState("Oct 01, 2026 - Oct 31, 2026");

  const { data, isLoading, refresh } = useCompanyDashboardData(timeframe, dateRange);

  return (
    <section className="min-h-[100dvh] w-full bg-bg px-3 sm:px-5 py-4 font-sans text-text">
      <div className="max-w-[1600px] mx-auto space-y-3.5">
        {/* ── 1. Header with Title, Date Range Picker & Timeframe Tabs ──── */}
        <CompanyDashboardHeader
          companyInfo={data?.companyInfo}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onRefresh={refresh}
          isLoading={isLoading}
        />

        {/* ── 2. Top 6 KPI Metrics Strip ───────────────────────────── */}
        <CompanyKpiGrid kpis={data?.kpis} />

        {/* ── 3. Middle Section Row 1 (Sales vs Purchases, Branch Leaderboard, Category Donut) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 items-stretch">
          {/* Sales vs Purchases Clustered Bar Trend (5 cols) */}
          <div className="md:col-span-2 lg:col-span-5 flex flex-col min-w-0">
            <CompanySalesPurchasesChartCard
              chartData={data?.salesVsPurchasesTrend}
              className="h-full"
            />
          </div>

          {/* Branch Performance Leaderboard (4 cols) */}
          <div className="md:col-span-1 lg:col-span-4 flex flex-col min-w-0">
            <CompanyBranchPerformanceCard
              branches={data?.branchPerformance}
              className="h-full"
            />
          </div>

          {/* Sales by Product Category Donut (3 cols) */}
          <div className="md:col-span-1 lg:col-span-3 flex flex-col min-w-0">
            <CompanyCategoryDonutCard
              categoryData={data?.salesByCategory}
              className="h-full"
            />
          </div>
        </div>

        {/* ── 4. Middle Section Row 2 (Top Selling Products, GST Summary, Inventory Alerts) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 items-stretch">
          {/* Top Selling Products (5 cols) */}
          <div className="md:col-span-2 lg:col-span-5 flex flex-col min-w-0">
            <CompanyTopSellingProductsCard
              products={data?.topSellingProducts}
              className="h-full"
            />
          </div>

          {/* GST Summary & Mini-Bars (4 cols) */}
          <div className="md:col-span-1 lg:col-span-4 flex flex-col min-w-0">
            <CompanyGstSummaryCard
              gstData={data?.gstSummary}
              className="h-full"
            />
          </div>

          {/* Inventory Alerts All Branches (3 cols) */}
          <div className="md:col-span-1 lg:col-span-3 flex flex-col min-w-0">
            <CompanyInventoryAlertsCard
              alerts={data?.inventoryAlerts}
              className="h-full"
            />
          </div>
        </div>

        {/* ── 5. Bottom Section Row 3 (Recent Purchases, Recent Sales, Inter-Branch Transfers) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 items-stretch">
          {/* Recent Purchases (5 cols) */}
          <div className="md:col-span-2 lg:col-span-5 flex flex-col min-w-0">
            <CompanyRecentPurchasesCard
              purchases={data?.recentPurchases}
              className="h-full"
            />
          </div>

          {/* Recent Sales Across All Branches (4 cols) */}
          <div className="md:col-span-1 lg:col-span-4 flex flex-col min-w-0">
            <CompanyRecentSalesCard
              sales={data?.recentSales}
              className="h-full"
            />
          </div>

          {/* Inter-Branch Transfers (3 cols) */}
          <div className="md:col-span-1 lg:col-span-3 flex flex-col min-w-0">
            <CompanyInterBranchTransfersCard
              transfers={data?.interBranchTransfers}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanyDashboardPage;
