import React from "react";
import { useIsMobile } from "@/hooks";
import CreateSalesReturnDesktopPage from "./desktop/CreateSalesReturnDesktopPage";
import CreateSalesReturnMobilePage from "./mobile/CreateSalesReturnMobilePage";

export const CreateSalesReturnPage = () => {
  const isMobile = useIsMobile();

  return isMobile ? <CreateSalesReturnMobilePage /> : <CreateSalesReturnDesktopPage />;
};

export default CreateSalesReturnPage;
