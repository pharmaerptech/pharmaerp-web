// src/features/reports/pages/ReportsHubPage.jsx

import React from "react";
import { useIsMobile } from "@/hooks";
import ReportsHubDesktopPage from "./desktop/ReportsHubDesktopPage";
import ReportsHubMobilePage from "./mobile/ReportsHubMobilePage";

export const ReportsHubPage = () => {
  const isMobile = useIsMobile();
  return isMobile ? <ReportsHubMobilePage /> : <ReportsHubDesktopPage />;
};

export default ReportsHubPage;
