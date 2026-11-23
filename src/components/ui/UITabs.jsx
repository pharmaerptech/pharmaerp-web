import React, { forwardRef, useState, useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const tabSizes = {
  xs: {
    tab: "px-2 py-1 text-[11px] font-medium gap-1",
    iconSize: "size-3",
    badge: "text-[9px] px-1 py-0.2",
  },
  sm: {
    tab: "px-3 py-1.5 text-xs gap-1.5",
    iconSize: "size-3.5",
    badge: "text-[10px] px-1.5 py-0.5",
  },
  md: {
    tab: "px-4 py-2 text-sm gap-2",
    iconSize: "size-4",
    badge: "text-[11px] px-2 py-0.5",
  },
  lg: {
    tab: "px-5 py-2.5 text-[15px] gap-2.5",
    iconSize: "size-4.5",
    badge: "text-xs px-2.5 py-0.5",
  },
};

export const UITabs = forwardRef(
  (
    {
      tabs = [],
      activeTab: controlledActiveTab,
      defaultTab,
      onChange,
      variant = "pill",
      size = "md",
      fullWidth = false,
      layoutId: customLayoutId,
      className,
      tabClassName,
      ...props
    },
    ref
  ) => {
    const rawId = useId();
    const generatedId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
    const layoutId = customLayoutId || `tabs-indicator-${generatedId}`;

    const isControlled = controlledActiveTab !== undefined;
    const [internalTab, setInternalTab] = useState(defaultTab || tabs[0]?.id || "");
    const activeTabId = isControlled ? controlledActiveTab : internalTab;

    const currentSize = tabSizes[size] || tabSizes.md;

    const handleTabClick = (tab) => {
      if (tab.disabled) return;
      if (!isControlled) {
        setInternalTab(tab.id);
      }
      if (onChange) {
        onChange(tab.id, tab);
      }
    };

    const handleKeyDown = (e) => {
      const enabledTabs = tabs.filter((t) => !t.disabled);
      const currentIndex = enabledTabs.findIndex((t) => t.id === activeTabId);
      if (currentIndex === -1) return;

      let nextIndex = -1;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % enabledTabs.length;
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = enabledTabs.length - 1;
      }

      if (nextIndex !== -1) {
        handleTabClick(enabledTabs[nextIndex]);
      }
    };

    return (
      <div
        ref={ref}
        role="tablist"
        onKeyDown={handleKeyDown}
        className={cn(
          "relative inline-flex items-center select-none font-sans isolate",
          // Container styling with safe internal padding & overflow protection
          variant === "pill" &&
            "p-1.5 bg-surface-alt rounded-2xl border border-border/80 gap-1.5 overflow-hidden",
          variant === "segmented" &&
            (size === "xs"
              ? "p-0.5 bg-surface-alt rounded-lg gap-0.5 shadow-2xs overflow-hidden"
              : "p-1 bg-surface-alt rounded-xl gap-1 shadow-2xs overflow-hidden"),
          variant === "underline" &&
            "border-b border-border gap-4 sm:gap-6 pb-px overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden no-scrollbar",
          fullWidth && "w-full flex",
          className
        )}
        {...props}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;

          return (
            <motion.button
              key={String(tab.id)}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              disabled={tab.disabled}
              whileTap={!tab.disabled ? { scale: 0.96 } : undefined}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "relative inline-flex items-center justify-center font-medium cursor-pointer whitespace-nowrap",
                "transition-colors duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
                currentSize.tab,
                fullWidth && "flex-1",

                variant === "pill" && [
                  "rounded-xl",
                  isActive
                    ? "text-primary font-bold"
                    : "text-text-muted hover:text-text",
                ],

                variant === "segmented" && [
                  size === "xs" ? "rounded-md" : "rounded-lg",
                  isActive
                    ? "text-text font-bold"
                    : "text-text-muted hover:text-text",
                ],

                variant === "underline" && [
                  "rounded-none pb-2.5 pt-1.5",
                  isActive
                    ? "text-primary font-bold"
                    : "text-text-muted hover:text-text",
                ],

                tab.disabled &&
                  "opacity-40 cursor-not-allowed pointer-events-none",
                tabClassName
              )}
            >
              {/* Ultra-Fluid Spring Sliding Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId={layoutId}
                  className={cn(
                    "absolute pointer-events-none z-0",
                    variant === "pill" &&
                      "inset-0 bg-surface rounded-xl shadow-xs border border-border/80",
                    variant === "segmented" &&
                      (size === "xs"
                        ? "inset-0 bg-surface rounded-md shadow-2xs"
                        : "inset-0 bg-surface rounded-lg shadow-xs"),
                    variant === "underline" &&
                      "bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  )}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30, // Optimal fluid motion without boundary overshoot
                    mass: 0.8,
                  }}
                />
              )}

              {/* Tab Contents (Positioned Above Sliding Indicator) */}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                {tab.icon && (
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center justify-center transition-colors",
                      isActive ? "text-primary" : "text-text-muted",
                      currentSize.iconSize
                    )}
                  >
                    {React.isValidElement(tab.icon)
                      ? tab.icon
                      : typeof tab.icon === "function" || typeof tab.icon === "object"
                      ? React.createElement(tab.icon, { className: "size-full" })
                      : tab.icon}
                  </span>
                )}

                <span>{tab.label}</span>

                {tab.badge !== undefined && tab.badge !== null && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full font-mono tabular-nums font-bold tracking-tight shrink-0 transition-colors",
                      isActive
                        ? "bg-primary text-primary-contrast"
                        : "bg-surface-hover text-text-muted border border-border/70",
                      currentSize.badge
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  }
);

UITabs.displayName = "UITabs";
export default UITabs;
