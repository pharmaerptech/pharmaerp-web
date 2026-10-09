import React from "react";
import { ROUTES } from "@/constants";

import { ChequesPage } from "../pages";

const chequeRoutes = [
  {
    path: ROUTES.CHEQUES,
    element: <ChequesPage />,
  },
];

export default chequeRoutes;
