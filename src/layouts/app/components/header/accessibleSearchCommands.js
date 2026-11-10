// src/layouts/app/components/header/accessibleSearchCommands.js
//
// Extracts all searchable navigation routes and quick actions,
// and filters them strictly based on current work mode, pipeline level, and user permissions.

import {
  Layers,
  Building2,
  GitBranch,
  Users,
  ShieldAlert,
  User,
  Truck,
  FileText,
  Palette,
  Lock,
  CreditCard,
  Store,
  QrCode,
} from "lucide-react";

import { ROUTES } from "@/constants";
import { SIDEBAR_NAV_GROUPS } from "../sidebar/sidebarNavConfig";
import { filterNavByPipeline } from "../sidebar/filterNavByPipeline";
import { getSafeWorkMode } from "@/contexts/WorkModeContext";
import {
  PIPELINE_LEVELS,
  isRouteAllowedForPipeline,
} from "@/contexts/routePipelinePolicy";

/**
 * Recursively flattens sidebar nav items into searchable commands.
 */
const flattenNavItems = (items, prefix = "") => {
  let result = [];
  if (!Array.isArray(items)) return result;

  items.forEach((item) => {
    if (item.path) {
      result.push({
        id: item.id || item.path,
        label: item.label,
        fullLabel: prefix ? `${prefix} › ${item.label}` : item.label,
        path: item.path,
        icon: item.icon || Layers,
        permission: item.permission,
        permissions: item.permissions,
        level: item.level || "all",
        workMode: item.workMode || "both",
        keywords: item.keywords || [],
        category: prefix || "Navigation",
      });
    }

    if (item.children && Array.isArray(item.children)) {
      result = result.concat(
        flattenNavItems(item.children, prefix ? `${prefix} › ${item.label}` : item.label)
      );
    }
  });

  return result;
};

/**
 * Additional direct quick actions with explicit permission, level & workMode requirements.
 */
const QUICK_ACTIONS = [
  {
    id: "nav-branch-dashboard",
    label: "Branch Dashboard",
    fullLabel: "Dashboards › Branch Dashboard",
    path: ROUTES.BRANCH_DASHBOARD,
    icon: Store,
    category: "Dashboards",
    level: "branch",
    workMode: "view",
    keywords: ["branch dashboard", "daily sales", "registers", "shift dashboard"],
  },
  {
    id: "nav-company-dashboard",
    label: "Company Dashboard",
    fullLabel: "Dashboards › Company Dashboard",
    path: ROUTES.COMPANY_DASHBOARD,
    icon: Building2,
    category: "Dashboards",
    level: "company",
    workMode: "view",
    keywords: ["company dashboard", "financials", "multi branch", "gst overview"],
  },
  {
    id: "nav-workspace-dashboard",
    label: "Workspace Dashboard",
    fullLabel: "Dashboards › Workspace Dashboard",
    path: ROUTES.WORKSPACE_DASHBOARD,
    icon: Layers,
    category: "Dashboards",
    level: "workspace",
    workMode: "view",
    keywords: ["workspace dashboard", "organization", "plan", "quota", "usage"],
  },
  {
    id: "nav-upi-transactions",
    label: "UPI Transactions",
    fullLabel: "Treasury › UPI Transactions",
    path: ROUTES.UPI_TRANSACTIONS,
    icon: QrCode,
    permission: "payment-qr:view",
    category: "Treasury",
    level: "branch",
    workMode: "operation",
    keywords: [
      "upi tally",
      "upi reconciliation",
      "upi transactions",
      "google pay",
      "phonepe",
      "paytm",
      "digital collections",
      "online payments",
      "qr payments",
    ],
  },
  {
    id: "action-create-company",
    label: "Create Company",
    fullLabel: "Quick Actions › Create Company",
    path: ROUTES.CREATE_COMPANY,
    icon: Building2,
    permission: "company:create",
    category: "Organization",
    level: "workspace",
    workMode: "operation",
  },
  {
    id: "action-create-branch",
    label: "Create Branch",
    fullLabel: "Quick Actions › Create Branch",
    path: ROUTES.CREATE_BRANCH,
    icon: GitBranch,
    permission: "branch:create",
    category: "Organization",
    level: "company",
    workMode: "operation",
  },
  {
    id: "action-invite-member",
    label: "Invite Staff Member",
    fullLabel: "Quick Actions › Invite Staff",
    path: ROUTES.INVITE_WORKSPACE_MEMBER,
    icon: Users,
    permission: "workspace-member:create",
    category: "Organization",
    level: "workspace",
    workMode: "operation",
  },
  {
    id: "action-create-role",
    label: "Create Custom Role",
    fullLabel: "Quick Actions › Create Role",
    path: ROUTES.CREATE_ROLE,
    icon: ShieldAlert,
    permission: "role:create",
    category: "Access Control",
    level: "workspace",
    workMode: "operation",
  },
  {
    id: "action-create-customer",
    label: "Add New Customer",
    fullLabel: "Quick Actions › Add Customer",
    path: ROUTES.CUSTOMERS,
    icon: User,
    permission: "customer:create",
    category: "Parties",
    level: "company",
    workMode: "operation",
  },
  {
    id: "action-create-supplier",
    label: "Add New Supplier",
    fullLabel: "Quick Actions › Add Supplier",
    path: ROUTES.SUPPLIERS,
    icon: Truck,
    permission: "supplier:create",
    category: "Parties",
    level: "company",
    workMode: "operation",
  },
  {
    id: "action-create-voucher",
    label: "New Journal Voucher",
    fullLabel: "Quick Actions › New Journal Voucher",
    path: ROUTES.CREATE_JOURNAL_VOUCHER,
    icon: FileText,
    permission: "journal-voucher:create",
    category: "Finance",
    level: "company",
    workMode: "operation",
  },
  {
    id: "action-settings-profile",
    label: "My Profile Settings",
    fullLabel: "Settings › Profile",
    path: "/settings/profile",
    icon: User,
    permission: null,
    category: "Settings",
    level: "all",
    workMode: "both",
  },
  {
    id: "action-settings-appearance",
    label: "Appearance & Theme",
    fullLabel: "Settings › Appearance",
    path: "/settings/appearance",
    icon: Palette,
    permission: null,
    category: "Settings",
    level: "all",
    workMode: "both",
  },
  {
    id: "action-settings-security",
    label: "Security & Passwords",
    fullLabel: "Settings › Security",
    path: "/settings/security",
    icon: Lock,
    permission: null,
    category: "Settings",
    level: "all",
    workMode: "both",
  },
  {
    id: "action-settings-billing",
    label: "Billing & Plans",
    fullLabel: "Settings › Billing",
    path: "/settings/billing",
    icon: CreditCard,
    permission: "subscription:view",
    category: "Settings",
    level: "workspace",
    workMode: "both",
  },
];

/**
 * Returns all accessible commands and navigation links for the current user, work mode, and pipeline level.
 */
export const getAccessibleSearchCommands = (
  can,
  canAny,
  isOwner = false,
  workMode = null,
  currentLevel = null
) => {
  const activeMode = getSafeWorkMode(workMode);

  // Filter sidebar groups according to the current pipeline level & work mode
  const filteredNavGroups = filterNavByPipeline(SIDEBAR_NAV_GROUPS, currentLevel, activeMode);

  const allNavItems = filteredNavGroups.flatMap((group) =>
    flattenNavItems(group.items, group.label)
  );

  // Filter quick actions based on currentLevel and workMode
  const filteredQuickActions = QUICK_ACTIONS.filter((action) => {
    if (!activeMode) {
      return action.category === "Settings" || action.workMode === "both";
    }

    // Level check
    if (currentLevel && action.level && action.level !== "all" && action.level !== currentLevel) {
      return false;
    }

    // Mode check
    if (action.workMode && action.workMode !== "both" && action.workMode !== activeMode) {
      return false;
    }

    return true;
  });

  const existingPaths = new Set(allNavItems.map((n) => n.path));
  const uniqueQuickActions = filteredQuickActions.filter((a) => !existingPaths.has(a.path));

  const allItems = [...allNavItems, ...uniqueQuickActions];
  const effectiveLevel = currentLevel || PIPELINE_LEVELS.WORKSPACE;

  // Return only items the user has permission to access and that satisfy current (level, mode) policy
  return allItems.filter((item) => {
    if (activeMode) {
      const check = isRouteAllowedForPipeline(item.path, {
        currentLevel: effectiveLevel,
        workMode: activeMode,
        isSetupComplete: true,
        hasActiveCompany: effectiveLevel !== PIPELINE_LEVELS.WORKSPACE,
        hasActiveBranch: effectiveLevel === PIPELINE_LEVELS.BRANCH,
      });
      if (!check.allowed) return false;
    }

    if (item.requireOwner && !isOwner) return false;
    if (item.permissions?.length) {
      return typeof canAny === "function"
        ? canAny(item.permissions)
        : item.permissions.some((p) => can(p));
    }
    if (!item.permission) return true;
    return typeof can === "function" ? can(item.permission) : true;
  });
};

export default getAccessibleSearchCommands;
