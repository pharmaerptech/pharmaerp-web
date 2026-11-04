import { ROUTES } from "@/constants";

import { StockMetricsPage, ExpiredScrapItemsPage } from "@/features/stock-metrics";

import {
  WorkspaceProductsPage,
  CreateWorkspaceProductPage,
  EditWorkspaceProductPage,
  WorkspaceProductDetailsPage,
  WorkspaceProductImportPage,
  WorkspaceProductSearchPage,
} from "../pages";

const workspaceProductRoutes = [
  {
    path: ROUTES.STOCK_METRICS,
    element: <StockMetricsPage />,
  },
  {
    path: ROUTES.EXPIRED_SCRAP_ITEMS,
    element: <ExpiredScrapItemsPage />,
  },
  {
    path: "/inventory/expired-scrap",
    element: <ExpiredScrapItemsPage />,
  },
  {
    path: ROUTES.WORKSPACE_PRODUCTS,
    element: <WorkspaceProductsPage />,
  },
  {
    path: ROUTES.CREATE_WORKSPACE_PRODUCT,
    element: <CreateWorkspaceProductPage />,
  },
  {
    path: ROUTES.EDIT_WORKSPACE_PRODUCT,
    element: <EditWorkspaceProductPage />,
  },
  {
    path: ROUTES.WORKSPACE_PRODUCT_DETAILS,
    element: <WorkspaceProductDetailsPage />,
  },
  {
    path: ROUTES.WORKSPACE_PRODUCT_IMPORT,
    element: <WorkspaceProductImportPage />,
  },
  {
    path: ROUTES.WORKSPACE_PRODUCT_SEARCH,
    element: <WorkspaceProductSearchPage />,
  },
];

export default workspaceProductRoutes;
