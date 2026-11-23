// src/features/purchases/routes/purchasesRoutes.jsx

import React from "react";
import { ROUTES } from "@/constants";
import PurchasesPage from "../pages/PurchasesPage";
import CreatePurchaseBillPage from "../pages/CreatePurchaseBillPage";
import PurchaseReturnsPage from "../pages/PurchaseReturnsPage";
import CreatePurchaseReturnPage from "../pages/CreatePurchaseReturnPage";

export const purchasesRoutes = [
  {
    path: ROUTES.PURCHASES,
    element: <PurchasesPage />,
  },
  {
    path: ROUTES.CREATE_PURCHASE_BILL,
    element: <CreatePurchaseBillPage />,
  },
  {
    path: ROUTES.EDIT_PURCHASE_BILL(),
    element: <CreatePurchaseBillPage />,
  },
  {
    path: ROUTES.PURCHASE_RETURNS,
    element: <PurchaseReturnsPage />,
  },
  {
    path: ROUTES.CREATE_PURCHASE_RETURN,
    element: <CreatePurchaseReturnPage />,
  },
];

export default purchasesRoutes;
