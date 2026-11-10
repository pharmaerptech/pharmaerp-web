import React from "react";
import { useIsMobile } from "@/hooks";
import PurchaseReturnsDesktopPage from "./desktop/PurchaseReturnsDesktopPage";
import PurchaseReturnsMobilePage from "./mobile/PurchaseReturnsMobilePage";

export const PurchaseReturnsPage = () => {
  const isMobile = useIsMobile();
  return isMobile ? <PurchaseReturnsMobilePage /> : <PurchaseReturnsDesktopPage />;
};

export default PurchaseReturnsPage;

