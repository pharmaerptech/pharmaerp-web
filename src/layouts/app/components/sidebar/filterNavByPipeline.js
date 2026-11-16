// src/layouts/app/components/sidebar/filterNavByPipeline.js
//
// Filters navigation groups and items based on BOTH:
// 1. activeLevel: 'workspace' | 'company' | 'branch'
// 2. workMode: 'operation' | 'view' | null

import { HelpCircle } from "lucide-react";
import { ROUTES } from "@/constants";
import { getSafeWorkMode } from "@/contexts/WorkModeContext";
import { PIPELINE_LEVELS } from "@/contexts/NavigationPipelineContext";

/**
 * Checks whether an item/group level configuration matches the active level
 */
const matchesLevel = (targetLevelConfig, activeLevel) => {
  if (!targetLevelConfig || targetLevelConfig === "all") return true;
  if (Array.isArray(targetLevelConfig)) {
    return targetLevelConfig.includes(activeLevel);
  }
  return targetLevelConfig === activeLevel;
};

/**
 * Filter a single item by level and workMode
 */
const filterItemByPipeline = (item, activeLevel, activeMode) => {
  if (!item) return null;

  // 1. Level Check: Item level must match activeLevel or be "all" / array containing activeLevel
  if (!matchesLevel(item.level, activeLevel)) {
    return null;
  }

  // 2. Mode Check: Item workMode must match activeMode or be "both"
  if (
    item.workMode &&
    item.workMode !== "both" &&
    item.workMode !== activeMode
  ) {
    return null;
  }

  // 3. Children Recursion
  if (Array.isArray(item.children) && item.children.length > 0) {
    const filteredChildren = item.children
      .map((child) => filterItemByPipeline(child, activeLevel, activeMode))
      .filter(Boolean);

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
 * Filter groups by pipeline level and active work mode
 */
export const filterNavByPipeline = (
  groups = [],
  currentLevel = PIPELINE_LEVELS.WORKSPACE,
  workMode = null
) => {
  const activeMode = getSafeWorkMode(workMode);
  const activeLevel = currentLevel || PIPELINE_LEVELS.WORKSPACE;

  // In Choose Mode (null): Strictly return ONLY Help & Support
  if (!activeMode) {
    return [
      {
        id: "general",
        label: "General",
        items: [
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

      // Group level check
      if (!matchesLevel(group.level, activeLevel)) {
        return false;
      }

      // Group mode check
      if (
        group.workMode &&
        group.workMode !== "both" &&
        group.workMode !== activeMode
      ) {
        return false;
      }

      return true;
    })
    .map((group) => {
      const filteredItems = (group.items || [])
        .map((item) => filterItemByPipeline(item, activeLevel, activeMode))
        .filter(Boolean);

      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter((group) => Array.isArray(group.items) && group.items.length > 0);
};

/**
 * Curates the closed/collapsed sidebar rail so it never overflows or congests.
 */
export { filterNavForCollapsedRail } from "@/contexts/routePipelinePolicy";

export default filterNavByPipeline;

