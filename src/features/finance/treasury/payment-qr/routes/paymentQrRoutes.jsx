import React from "react";
import { ROUTES } from "@/constants";

import { PaymentQrsPage } from "../pages";

const paymentQrRoutes = [
  {
    path: ROUTES.PAYMENT_QRS,
    element: <PaymentQrsPage />,
  },
];

export default paymentQrRoutes;
