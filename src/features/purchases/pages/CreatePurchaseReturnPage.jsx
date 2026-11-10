import React from "react";
import { useIsMobile } from "@/hooks";
import CreatePurchaseReturnDesktopPage from "./desktop/CreatePurchaseReturnDesktopPage";
import CreatePurchaseReturnMobilePage from "./mobile/CreatePurchaseReturnMobilePage";

export const CreatePurchaseReturnPage = () => {
  const isMobile = useIsMobile();
  return isMobile ? <CreatePurchaseReturnMobilePage /> : <CreatePurchaseReturnDesktopPage />;
};

export default CreatePurchaseReturnPage;

