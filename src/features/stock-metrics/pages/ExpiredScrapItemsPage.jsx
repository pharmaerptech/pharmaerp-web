// src/features/stock-metrics/pages/ExpiredScrapItemsPage.jsx

import React from "react";
import { useIsMobile } from "@/hooks";
import ExpiredScrapItemsDesktopPage from "./desktop/ExpiredScrapItemsDesktopPage";
import ExpiredScrapItemsMobilePage from "./mobile/ExpiredScrapItemsMobilePage";

const ExpiredScrapItemsPage = () => {
  const isMobile = useIsMobile();
  return isMobile ? <ExpiredScrapItemsMobilePage /> : <ExpiredScrapItemsDesktopPage />;
};

export default ExpiredScrapItemsPage;

