// src/layouts/app/components/sidebar/filterNavByWorkMode.js
//
// Filters navigation groups and items based on the active Work Mode
// ('operation' vs 'view' vs null for Default/Choose Mode).

import { Settings, HelpCircle } from "lucide-react";
import { ROUTES } from "@/constants";
import { WORK_MODES, getSafeWorkMode } from "@/contexts/WorkModeContext";

/**
 * Filter an individual navigation item by active work mode
 * @param {object} item
 * @param {string|null} currentMode - 'operation' | 'view' | null
 * @returns {object|null}
 */
const filterItemByMode = (item, currentMode) => {
  if (!item) return null;

  // In specific mode: exclude items marked for the other mode
  if (item.workMode && item.workMode !== "both" && item.workMode !== currentMode) {
    return null;
  }

  // If item has children, filter them recursively
  if (Array.isArray(item.children) && item.children.length > 0) {
    const filteredChildren = item.children
      .map((child) => filterItemByMode(child, currentMode))
      .filter(Boolean);

    // If all children were filtered out and this item doesn't have its own path, hide it
    if (filteredChildren.length === 0 && !item.path) {
      return null;
    }

    return {
      ...item,
      children: filteredChildren,
    };
  }

  return item;
};

/**
 * Filter navigation groups by active work mode
 * @param {Array} groups - list of nav groups from sidebarNavConfig
 * @param {string|null} workMode - 'operation' | 'view' | null
 * @returns {Array} filtered nav groups
 */
export const filterNavByWorkMode = (groups = [], workMode = null) => {
  const activeMode = getSafeWorkMode(workMode);

  // In Default / Choose Mode (null): Strictly return ONLY Settings and Help & Support
  // No business operations, products, suppliers, doctors, or reports are visible until mode is chosen.
  if (!activeMode) {
    return [
      {
        id: "general",
        label: "General",
        items: [
          {
            id: "settings",
            label: "Settings",
            path: ROUTES.SETTINGS,
            icon: Settings,
            keywords: ["settings", "preferences", "account"],
          },
          {
            id: "help",
            label: "Help & Support",
            path: ROUTES.HELP_CENTER,
            icon: HelpCircle,
            keywords: ["help", "support", "docs", "assistance"],
          },
        ],
      },
    ];
  }

  return groups
    .filter((group) => {
      if (!group) return false;

      // In specific mode, exclude groups explicitly tagged for the other mode
      if (group.workMode && group.workMode !== "both" && group.workMode !== activeMode) {
        return false;
      }
      return true;
    })
    .map((group) => {
      const filteredItems = (group.items || [])
        .map((item) => filterItemByMode(item, activeMode))
        .filter(Boolean);

      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter((group) => Array.isArray(group.items) && group.items.length > 0);
};

export default filterNavByWorkMode;
