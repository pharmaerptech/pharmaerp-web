import React, { forwardRef } from "react";
import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { UIButton } from "./UIButton";

/**
 * ============================================================================
 * UIEmptyState (#24 Component)
 * ============================================================================
 * Clean, composable empty state for empty tables, search results, and records.
 */
const UIEmptyState = forwardRef(
  (
    {
      icon = <PackageOpen className="size-6" />,
      iconColor = "primary",
      title = "No Records Found",
      description = "There is no data to display right now. Create a new item or adjust your search filters.",
      actionText,
      actionLabel,
      onAction,
      actionVariant = "primary",
      actionIcon,
      secondaryText,
      onSecondaryAction,
      variant = "card",
      size = "md",
      children,
      className,
      ...props
    },
    ref
  ) => {
    const iconColors = {
      primary: "bg-primary-soft text-primary border-primary/20",
      success: "bg-success-soft text-success border-success/20",
      warning: "bg-warning-soft text-warning border-warning/20",
      error: "bg-error-soft text-error border-error/20",
      neutral: "bg-surface-alt text-text-muted border-border",
    };

    const variantClasses = {
      card: "p-8 sm:p-12 rounded-2xl border border-border bg-surface shadow-xs",
      dashed: "p-8 sm:p-12 rounded-2xl border border-dashed border-border/90 bg-surface/50",
      inline: "p-6 sm:p-8 bg-transparent",
    };

    const sizeClasses = {
      sm: {
        wrapper: "py-6 px-4",
        iconBox: "size-10 rounded-xl",
        iconSize: "size-5",
        title: "text-sm font-bold",
        desc: "text-xs",
      },
      md: {
        wrapper: "py-8 sm:py-12 px-6",
        iconBox: "size-12 rounded-2xl",
        iconSize: "size-6",
        title: "text-base sm:text-lg font-bold",
        desc: "text-xs sm:text-sm",
      },
      lg: {
        wrapper: "py-12 sm:py-16 px-8",
        iconBox: "size-16 rounded-3xl",
        iconSize: "size-8",
        title: "text-lg sm:text-xl font-bold",
        desc: "text-sm sm:text-[15px]",
      },
    };

    const curSize = sizeClasses[size] || sizeClasses.md;
    const effectiveActionText = actionText || actionLabel;

    return (
      <div
        ref={ref}
        className={cn(
          "w-full flex flex-col items-center justify-center text-center font-sans select-none",
          variantClasses[variant] || variantClasses.card,
          curSize.wrapper,
          className
        )}
        {...props}
      >
        {/* Visual Icon Badge */}
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center mb-4 border shadow-2xs transition-transform duration-200 hover:scale-105",
              curSize.iconBox,
              iconColors[iconColor] || iconColors.primary
            )}
          >
            {React.isValidElement(icon)
              ? icon
              : typeof icon === "function" ||
                (typeof icon === "object" && icon !== null && "$$typeof" in icon)
              ? React.createElement(icon, { className: curSize.iconSize })
              : icon}
          </div>
        )}

        {/* Title */}
        {title && (
          <h4
            className={cn(
              "tracking-tight text-text leading-tight",
              curSize.title
            )}
          >
            {title}
          </h4>
        )}

        {/* Description */}
        {description && (
          <p
            className={cn(
              "text-text-muted mt-1.5 max-w-md leading-relaxed",
              curSize.desc
            )}
          >
            {description}
          </p>
        )}

        {/* Custom Body or Actions */}
        {(effectiveActionText || secondaryText || children) && (
          <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-3">
            {effectiveActionText && (
              <UIButton
                variant={actionVariant}
                size={size === "sm" ? "xs" : "sm"}
                startIcon={actionIcon}
                onClick={onAction}
              >
                {effectiveActionText}
              </UIButton>
            )}

            {secondaryText && (
              <UIButton
                variant="outline"
                size={size === "sm" ? "xs" : "sm"}
                onClick={onSecondaryAction}
              >
                {secondaryText}
              </UIButton>
            )}

            {children}
          </div>
        )}
      </div>
    );
  }
);
UIEmptyState.displayName = "UIEmptyState";

export { UIEmptyState };
export default UIEmptyState;
