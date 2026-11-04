// src/features/sales/routes/salesRoutes.jsx

import React from "react";
import { ROUTES } from "@/constants";
import SalesPage from "../pages/SalesPage";
import CreditNotesPage from "../credit-notes/pages/CreditNotesPage";

export const salesRoutes = [
  {
    path: ROUTES.SALES,
    element: <SalesPage />,
  },
  {
    path: ROUTES.SALE_EDIT_ROUTE || "/sales/edit/:invoiceId",
    element: <SalesPage />,
  },
  {
    path: "/sale/edit/:invoiceId",
    element: <SalesPage />,
  },
  {
    path: ROUTES.CREDIT_NOTES || "/sales/credit-notes",
    element: <CreditNotesPage />,
  },
];

export default salesRoutes;
