import { ROUTES } from "@/constants";

import {
  MainDashboardPage,
  BranchDashboardPage,
  CompanyDashboardPage,
  WorkspaceDashboardPage,
} from "../pages";

const dashboardRoutes = [
  {
    path: ROUTES.DASHBOARD,
    element: <MainDashboardPage />,
  },
  {
    path: ROUTES.BRANCH_DASHBOARD,
    element: <BranchDashboardPage />,
  },
  {
    path: ROUTES.COMPANY_DASHBOARD,
    element: <CompanyDashboardPage />,
  },
  {
    path: ROUTES.WORKSPACE_DASHBOARD,
    element: <WorkspaceDashboardPage />,
  },
];

export default dashboardRoutes;
