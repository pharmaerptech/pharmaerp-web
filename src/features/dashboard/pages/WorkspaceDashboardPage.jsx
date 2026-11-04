// src/features/dashboard/pages/WorkspaceDashboardPage.jsx

import { useState } from "react";
import { useWorkspaceDashboardData } from "../hooks";
import {
  WorkspaceDashboardHeader,
  WorkspaceKpiGrid,
  WorkspaceCompaniesCard,
  WorkspaceBranchesCard,
  WorkspaceSubscriptionCard,
  WorkspaceMembersCard,
  WorkspaceRolesCard,
} from "../components/workspace";

export const WorkspaceDashboardPage = () => {
  const [timeframe, setTimeframe] = useState("This Month");
  const { data, isLoading, refresh } = useWorkspaceDashboardData(timeframe);

  return (
    <section className="min-h-[100dvh] w-full bg-bg px-3 sm:px-5 py-4 font-sans text-text dashboard-no-scrollbar">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* ── 1. Workspace Executive Header ─────────────────────────────── */}
        <WorkspaceDashboardHeader
          workspaceInfo={data?.workspaceInfo}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          onRefresh={refresh}
          isLoading={isLoading}
        />

        {/* ── 2. Top 6 Workspace-Level KPI Metric Cards ─────────────────── */}
        <WorkspaceKpiGrid
          kpis={data?.kpis}
          isLoading={isLoading}
        />

        {/* ── 3. Row 1: Legal Companies & Physical Branch Network ───────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Registered Companies (6 cols) */}
          <div className="lg:col-span-6 flex flex-col min-w-0">
            <WorkspaceCompaniesCard
              companies={data?.companies}
              isLoading={isLoading}
            />
          </div>

          {/* Physical Branches (6 cols) */}
          <div className="lg:col-span-6 flex flex-col min-w-0">
            <WorkspaceBranchesCard
              branches={data?.branches}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* ── 4. Row 2: Workspace Staff & Access Control Roles ──────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Workspace Team & Staff Members (7 cols) */}
          <div className="lg:col-span-7 flex flex-col min-w-0">
            <WorkspaceMembersCard
              members={data?.members}
              isLoading={isLoading}
            />
          </div>

          {/* Access Roles & Permissions Master (5 cols) */}
          <div className="lg:col-span-5 flex flex-col min-w-0">
            <WorkspaceRolesCard
              roles={data?.roles}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* ── 5. Row 3: Subscription Limits & Workspace Governance Health ── */}
        <div className="w-full">
          <WorkspaceSubscriptionCard
            usageData={data?.subscriptionUsage}
            compliance={data?.compliance}
            isLoading={isLoading}
          />
        </div>
      </div>
    </section>
  );
};

export default WorkspaceDashboardPage;