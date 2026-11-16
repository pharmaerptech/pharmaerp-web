// src/features/company/routes/companyRoutes.jsx

import { ROUTES } from "@/constants";

import {
  CompaniesPage,
  CreateCompanyPage,
  EditCompanyPage,
  CompanyDetailsPage,
} from "../pages";

export const createCompanyRoutes = [
  {
    path: ROUTES.CREATE_COMPANY,
    element: <CreateCompanyPage />,
  },
];

export const existingCompanyRoutes = [
  {
    path: ROUTES.COMPANIES,
    element: <CompaniesPage />,
  },
  {
    path: ROUTES.EDIT_COMPANY,
    element: <EditCompanyPage />,
  },
  {
    path: ROUTES.COMPANY_DETAILS,
    element: <CompanyDetailsPage />,
  },
];

const companyRoutes = [...createCompanyRoutes, ...existingCompanyRoutes];

export default companyRoutes;
