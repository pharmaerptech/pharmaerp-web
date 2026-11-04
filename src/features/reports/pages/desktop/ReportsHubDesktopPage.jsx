// src/features/reports/pages/desktop/ReportsHubDesktopPage.jsx

import React, { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ReportsOverviewStatCards,
  ReportsDirectoryGrid,
  ReportDetailView,
} from "../../components";
import {
  REPORTS_OVERVIEW_STATS,
  resolveCategoryAndTab,
} from "../../constants/reportsHubData";

export const ReportsHubDesktopPage = () => {
  const navigate = useNavigate();
  const { category, subReport, reportKey: routeReportKey } = useParams();
  const [searchParams] = useSearchParams();

  // Determine if a specific category / report view is active
  const activeReportContext = useMemo(() => {
    // 1. Path is /reports/:category/:subReport (e.g. /reports/purchase/summary)
    if (category) {
      return resolveCategoryAndTab(category, subReport);
    }

    // 2. Path is /reports/:reportKey (e.g. /reports/sales or /reports/purchase-summary)
    if (routeReportKey) {
      return resolveCategoryAndTab(routeReportKey, null);
    }

    // 3. Query param ?report=...
    const queryReport = searchParams.get("report");
    if (queryReport) {
      return resolveCategoryAndTab(queryReport, null);
    }

    return null;
  }, [category, subReport, routeReportKey, searchParams]);

  // Handle report selection from category cards on the front page directory
  const handleSelectReport = (reportId, categoryId, slug) => {
    const cleanCat = categoryId.replace("-reports", "");
    const tabSlug = slug || reportId.replace(`${cleanCat}-`, "");
    navigate(`/reports/${cleanCat}/${tabSlug}`);
  };

  // Switch tabs inside any report subdivision view (seamless URL + state change)
  const handleTabChange = (tabSlug) => {
    if (activeReportContext) {
      navigate(`/reports/${activeReportContext.catKey}/${tabSlug}`, { replace: true });
    }
  };

  // Back to front page directory
  const handleBackToHub = () => {
    navigate("/reports");
  };

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-3 sm:px-4 md:px-5 pt-0 pb-3 gap-3.5 text-text font-sans transition-colors overflow-hidden">
      {activeReportContext ? (
        /* ── General Report Subdivision & Detail View (All Categories) ─── */
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <ReportDetailView
            categoryKey={activeReportContext.catKey}
            initialTabKey={activeReportContext.tabKey}
            onBackToHub={handleBackToHub}
            onTabChange={handleTabChange}
          />
        </div>
      ) : (
        /* ── Front Page: General Collection of Reports (Image 2) ─────────── */
        <>
          {/* 1. Compact 4-Card Statistics Grid (Top of Page, NO heading) */}
          <div className="shrink-0 pt-1">
            <ReportsOverviewStatCards stats={REPORTS_OVERVIEW_STATS} />
          </div>

          {/* 2. 3x3 Grid of 9 Category Cards (All 45 Reports) - Filter Toolbar Removed */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <ReportsDirectoryGrid
              onSelectReport={handleSelectReport}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsHubDesktopPage;
