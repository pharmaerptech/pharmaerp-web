import { ROUTES } from "@/constants";
import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";

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
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ROUTES.BRANCH_DASHBOARD,
    element: <BranchDashboardPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ROUTES.COMPANY_DASHBOARD,
    element: <CompanyDashboardPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ROUTES.WORKSPACE_DASHBOARD,
    element: <WorkspaceDashboardPage />,
    errorElement: <RouteErrorBoundary />,
  },
];

export default dashboardRoutes;
