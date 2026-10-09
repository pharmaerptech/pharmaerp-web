// src/layouts/app/components/header/accessibleSearchCommands.js
//
// Extracts all searchable navigation routes and quick actions,
// and filters them strictly based on current user permissions.

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
} from "lucide-react";

import { ROUTES } from "@/constants";
import { SIDEBAR_NAV_GROUPS } from "../sidebar/sidebarNavConfig";

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
 * Additional direct quick actions with explicit permission requirements.
 */
const QUICK_ACTIONS = [
  {
    id: "action-create-company",
    label: "Create Company",
    fullLabel: "Quick Actions › Create Company",
    path: ROUTES.CREATE_COMPANY,
    icon: Building2,
    permission: "company:create",
    category: "Organization",
  },
  {
    id: "action-create-branch",
    label: "Create Branch",
    fullLabel: "Quick Actions › Create Branch",
    path: ROUTES.CREATE_BRANCH,
    icon: GitBranch,
    permission: "branch:create",
    category: "Organization",
  },
  {
    id: "action-invite-member",
    label: "Invite Staff Member",
    fullLabel: "Quick Actions › Invite Staff",
    path: ROUTES.INVITE_WORKSPACE_MEMBER,
    icon: Users,
    permission: "workspace-member:create",
    category: "Organization",
  },
  {
    id: "action-create-role",
    label: "Create Custom Role",
    fullLabel: "Quick Actions › Create Role",
    path: "/access-control/roles/create",
    icon: ShieldAlert,
    permission: "role:create",
    category: "Access Control",
  },
  {
    id: "action-create-customer",
    label: "Add New Customer",
    fullLabel: "Quick Actions › Add Customer",
    path: ROUTES.CUSTOMERS,
    icon: User,
    permission: "customer:create",
    category: "Parties",
  },
  {
    id: "action-create-supplier",
    label: "Add New Supplier",
    fullLabel: "Quick Actions › Add Supplier",
    path: ROUTES.SUPPLIERS,
    icon: Truck,
    permission: "supplier:create",
    category: "Parties",
  },
  {
    id: "action-create-voucher",
    label: "New Journal Voucher",
    fullLabel: "Quick Actions › New Journal Voucher",
    path: ROUTES.CREATE_JOURNAL_VOUCHER,
    icon: FileText,
    permission: "journal-voucher:create",
    category: "Finance",
  },
  {
    id: "action-settings-profile",
    label: "My Profile Settings",
    fullLabel: "Settings › Profile",
    path: "/settings/profile",
    icon: User,
    permission: null,
    category: "Settings",
  },
  {
    id: "action-settings-appearance",
    label: "Appearance & Theme",
    fullLabel: "Settings › Appearance",
    path: "/settings/appearance",
    icon: Palette,
    permission: null,
    category: "Settings",
  },
  {
    id: "action-settings-security",
    label: "Security & Passwords",
    fullLabel: "Settings › Security",
    path: "/settings/security",
    icon: Lock,
    permission: null,
    category: "Settings",
  },
  {
    id: "action-settings-billing",
    label: "Billing & Plans",
    fullLabel: "Settings › Billing",
    path: "/settings/billing",
    icon: CreditCard,
    permission: "subscription:view",
    category: "Settings",
  },
];

/**
 * Returns all accessible commands and navigation links for the current user.
 * @param {Function} can - Permission checking function from usePermission()
 * @param {Function} [canAny] - Permission checking function for any from usePermission()
 * @returns {Array} List of commands accessible to the user
 */
export const getAccessibleSearchCommands = (can, canAny, isOwner = false) => {
  const allNavItems = SIDEBAR_NAV_GROUPS.flatMap((group) =>
    flattenNavItems(group.items, group.label)
  );

  const existingPaths = new Set(allNavItems.map((n) => n.path));
  const uniqueQuickActions = QUICK_ACTIONS.filter((a) => !existingPaths.has(a.path));

  const allItems = [...allNavItems, ...uniqueQuickActions];

  // Return only items the user has permission to access
  return allItems.filter((item) => {
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
