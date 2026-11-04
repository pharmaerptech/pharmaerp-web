// src/features/reports/components/ReportsDirectoryGrid.jsx

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { REPORT_DIRECTORY_CATEGORIES } from "../constants/reportsHubData";

export const ReportsDirectoryGrid = ({
  searchQuery = "",
  selectedCategory = "all",
  onSelectReport,
  className,
}) => {
  // Filter categories and reports based on search query and category selector
  const filteredCategories = React.useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();

    return REPORT_DIRECTORY_CATEGORIES.map((category) => {
      // Check if category itself is excluded by category filter
      if (selectedCategory !== "all" && category.id !== selectedCategory) {
        return null;
      }

      // If no search query, return full category
      if (!q) return category;

      // Filter items matching query
      const categoryMatches =
        category.title.toLowerCase().includes(q) ||
        category.subtitle.toLowerCase().includes(q);

      const matchingItems = category.items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          categoryMatches
      );

      if (matchingItems.length > 0 || categoryMatches) {
        return {
          ...category,
          items: matchingItems.length > 0 ? matchingItems : category.items,
        };
      }

      return null;
    }).filter(Boolean);
  }, [searchQuery, selectedCategory]);

  if (filteredCategories.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 text-center bg-surface rounded-2xl border border-border/80 p-8 shadow-2xs">
        <div className="size-14 rounded-2xl bg-surface-alt flex items-center justify-center text-text-muted mb-3">
          <SearchX className="size-7" />
        </div>
        <h3 className="text-base font-bold text-text">No reports found</h3>
        <p className="text-sm text-text-muted max-w-sm mt-1">
          No reports match your search query "{searchQuery}". Try searching for terms like "sales", "stock", "tax", or "customer".
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4.5 pb-2",
        className
      )}
    >
      {filteredCategories.map((category, catIdx) => {
        const CategoryIcon = category.icon;

        return (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: catIdx * 0.04 }}
            className="bg-surface rounded-2xl border border-border/80 shadow-2xs overflow-hidden flex flex-col transition-all duration-200 hover:shadow-xs hover:border-border"
          >
            {/* ── Category Header ────────────────────────────────────────── */}
            <div
              className={cn(
                "px-4 py-3 sm:py-3.5 flex items-center gap-3 border-b transition-colors",
                category.theme.headerBg,
                category.theme.headerBorder
              )}
            >
              <div
                className={cn(
                  "size-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200",
                  category.theme.iconBg
                )}
              >
                {category.badgeText ? (
                  <span className="text-xs font-black tracking-tight font-mono">
                    {category.badgeText}
                  </span>
                ) : (
                  <CategoryIcon className="size-5 stroke-[2]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-bold text-text leading-tight truncate">
                  {category.title}
                </div>
                <div className="text-[11.5px] text-text-muted leading-tight mt-0.5 truncate">
                  {category.subtitle}
                </div>
              </div>
            </div>

            {/* ── 5 Report Items inside ─────────────────────────────────── */}
            <div className="p-2 sm:p-2.5 flex flex-col divide-y divide-border/30">
              {category.items.map((item) => {
                const ItemIcon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectReport?.(item.id, category.id, item.slug)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-surface-hover/80 active:bg-surface-active transition-all duration-150 text-left group cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-primary/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-7 rounded-lg bg-surface-alt/70 text-text-muted group-hover:text-primary group-hover:bg-primary-soft transition-colors flex items-center justify-center shrink-0">
                        <ItemIcon className="size-3.5 stroke-[1.8]" />
                      </div>

                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-text group-hover:text-primary transition-colors leading-tight truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-text-muted leading-tight mt-0.5 truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="size-4 text-text-muted/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ReportsDirectoryGrid;

