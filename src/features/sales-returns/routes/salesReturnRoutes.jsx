import React from "react";
import { ROUTES } from "@/constants";
import SalesReturnPage from "../pages/SalesReturnPage";
import CreateSalesReturnPage from "../pages/CreateSalesReturnPage";

export const salesReturnRoutes = [
  {
    path: ROUTES.SALES_RETURNS,
    element: <SalesReturnPage />,
  },
  {
    path: ROUTES.CREATE_SALES_RETURN,
    element: <CreateSalesReturnPage />,
  },
];

export default salesReturnRoutes;
