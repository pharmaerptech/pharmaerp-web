// src/features/setup/constants/setupSteps.js
// 2 core setup steps for PharmaERP onboarding (Company & Branch)

import { ROUTES } from "@/constants";

export const setupSteps = [
  {
    id: "company",
    stepNumber: "01",
    category: "WORKSPACE LEVEL",
    level: "workspace",
    title: "Create Company",
    subtitle: "Legal entity & tax registration",
    description: "Register your legal pharmaceutical business entity, GSTIN, PAN, and drug licenses to establish your enterprise foundation at the workspace level.",
    actionText: "Create Company",
    completedActionText: "Manage Companies",
    route: ROUTES.CREATE_COMPANY,
    completedRoute: ROUTES.COMPANIES,
    completed: false,
    disabled: false,
    requiredFields: [],
    estimatedTime: "2 mins",
    colorVariant: "primary",
    checklist: [
      "Legal Business Name & Pharmacy Type",
      "GSTIN, PAN & Tax Profile Details",
      "Drug License (Form 20B/21B) & FSSAI",
      "Registered Head Office Address & Contact",
    ],
    highlights: [
      "Mandatory for all accounting and tax compliance",
      "Created at workspace level; supports multi-company hierarchy",
    ],
  },
  {
    id: "branch",
    stepNumber: "02",
    category: "WORKSPACE SETUP",
    level: "workspace",
    title: "Create Branch",
    subtitle: "Store location & POS billing counter",
    description: "Set up your first physical pharmacy outlet, store counter, or warehouse under your registered company for daily sales, stock management, and POS billing.",
    actionText: "Create Branch",
    completedActionText: "Manage Branches",
    route: ROUTES.CREATE_BRANCH,
    completedRoute: ROUTES.BRANCHES,
    completed: false,
    disabled: true,
    requiredFields: ["company"],
    estimatedTime: "2 mins",
    colorVariant: "info",
    checklist: [
      "Physical Outlet / Store Address & Contact",
      "POS Billing Register & Invoicing Series Prefix",
      "Local Inventory, Batch & Stock Storage Point",
      "Branch Operating Schedule & Staff Assignment",
    ],
    highlights: [
      "Created under your registered company entity",
      "Unlocks daily POS billing, till operations, and counter checkout",
    ],
  },
];

export default setupSteps;
