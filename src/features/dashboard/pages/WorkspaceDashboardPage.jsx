// src/features/dashboard/pages/WorkspaceDashboardPage.jsx

import { useState } from "react";
import { useWorkspaceDashboardData } from "../hooks";
import {
  WorkspaceDashboardHeader,
  WorkspaceKpiGrid,
  WorkspaceRevenueProfitTrendCard,
  WorkspaceTopCompaniesCard,
  WorkspaceBranchPerformanceCard,
  WorkspaceCategoryDonutCard,
  WorkspaceStockAlertsCard,
  WorkspaceFinancialSummaryCard,
  WorkspaceRecentActivityCard,
  WorkspaceSubscriptionUsageCard,
} from "../components/workspace";

export const WorkspaceDashboardPage = () => {
  const [timeframe, setTimeframe] = useState("This Month");
  const [dateRange, setDateRange] = useState("Oct 01, 2026 - Oct 31, 2026");

  const { data, isLoading, refresh } = useWorkspaceDashboardData(timeframe, dateRange);

  return (
    <section className="min-h-[100dvh] w-full bg-bg px-3 sm:px-5 py-4 font-sans text-text">
      <div className="max-w-[1600px] mx-auto space-y-3.5">
        {/* ── 1. Header with Title, Date Range Picker & Timeframe Tabs ──── */}
        <WorkspaceDashboardHeader
          workspaceInfo={data?.workspaceInfo}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onRefresh={refresh}
          isLoading={isLoading}
        />

        {/* ── 2. Top 6 KPI Metrics Strip ───────────────────────────── */}
        <WorkspaceKpiGrid kpis={data?.kpis} />

        {/* ── 3. Middle Section Row 1 (Revenue & Profit Trend, Top Companies, Branch Performance) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 items-stretch">
          {/* Revenue & Profit Combo Chart (5 cols) */}
          <div className="md:col-span-2 lg:col-span-5 flex flex-col min-w-0">
            <WorkspaceRevenueProfitTrendCard
              chartData={data?.revenueProfitTrend}
              className="h-full"
            />
          </div>

          {/* Top Companies by Revenue (4 cols) */}
          <div className="md:col-span-1 lg:col-span-4 flex flex-col min-w-0">
            <WorkspaceTopCompaniesCard
              companies={data?.topCompanies}
              className="h-full"
            />
          </div>

          {/* Branch Performance (3 cols) */}
          <div className="md:col-span-1 lg:col-span-3 flex flex-col min-w-0">
            <WorkspaceBranchPerformanceCard
              branches={data?.branchPerformance}
              className="h-full"
            />
          </div>
        </div>

        {/* ── 4. Middle Section Row 2 (Sales by Category, Stock Alerts, Financial Summary) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 items-stretch">
          {/* Sales by Category Donut (4 cols) */}
          <div className="md:col-span-1 lg:col-span-4 flex flex-col min-w-0">
            <WorkspaceCategoryDonutCard
              categoryData={data?.salesByCategory}
              className="h-full"
            />
          </div>

          {/* Stock Alerts (4 cols) */}
          <div className="md:col-span-1 lg:col-span-4 flex flex-col min-w-0">
            <WorkspaceStockAlertsCard
              alerts={data?.stockAlerts}
              className="h-full"
            />
          </div>

          {/* Financial Summary (4 cols) */}
          <div className="md:col-span-2 lg:col-span-4 flex flex-col min-w-0">
            <WorkspaceFinancialSummaryCard
              financialData={data?.financialSummary}
              className="h-full"
            />
          </div>
        </div>

        {/* ── 5. Bottom Section Row 3 (Recent Business Activity & Subscription Usage) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
          {/* Recent Business Activity Table (~60% / 7 cols) */}
          <div className="lg:col-span-7 flex flex-col min-w-0">
            <WorkspaceRecentActivityCard
              activities={data?.recentActivity}
              className="h-full"
            />
          </div>

          {/* Subscription & Usage Panel (~40% / 5 cols) */}
          <div className="lg:col-span-5 flex flex-col min-w-0">
            <WorkspaceSubscriptionUsageCard
              usageData={data?.subscriptionUsage}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkspaceDashboardPage;
