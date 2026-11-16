// src/features/branch/routes/branchRoutes.js

import { ROUTES } from "@/constants";

import {
  BranchesPage,
  CreateBranchPage,
  EditBranchPage,
  BranchDetailsPage,
  BranchSettingsPage,
} from "../pages";

export const createBranchRoutes = [
  {
    path: ROUTES.CREATE_BRANCH,
    element: <CreateBranchPage />,
  },
];

export const existingBranchRoutes = [
  {
    path: ROUTES.BRANCHES,
    element: <BranchesPage />,
  },
  {
    path: ROUTES.EDIT_BRANCH,
    element: <EditBranchPage />,
  },
  {
    path: ROUTES.BRANCH_DETAILS,
    element: <BranchDetailsPage />,
  },
  {
    path: ROUTES.BRANCH_SETTINGS,
    element: <BranchSettingsPage />,
  },
];

const branchRoutes = [...createBranchRoutes, ...existingBranchRoutes];

export default branchRoutes;
