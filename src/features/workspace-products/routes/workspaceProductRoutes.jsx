import { ROUTES } from "@/constants";

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
