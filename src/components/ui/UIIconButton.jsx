import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const iconButtonVariants = {
  ghost:
    "bg-transparent text-text-muted hover:text-text hover:bg-surface-hover active:bg-surface-active",
  soft: "bg-primary-soft text-primary hover:bg-primary/15 border border-primary/10",
  outline:
    "border border-border bg-transparent text-text hover:bg-surface-hover hover:border-border-strong",
  primary:
    "bg-primary text-primary-contrast hover:bg-primary-hover shadow-xs hover:shadow border border-primary/20",
  secondary:
    "bg-surface-alt text-text hover:bg-surface-hover border border-border",
  destructive:
    "bg-error/10 text-error hover:bg-error hover:text-error-contrast border border-error/20",
  success:
    "bg-success/10 text-success hover:bg-success hover:text-success-contrast border border-success/20",
  warning:
    "bg-warning/10 text-warning hover:bg-warning hover:text-warning-contrast border border-warning/20",
};

const iconButtonSizes = {
  xs: "size-7 text-xs",
  sm: "size-8.5 text-sm",
  md: "size-10 text-base",
  lg: "size-11.5 text-lg",
  xl: "size-13 text-xl",
};

const innerIconSizes = {
  xs: "size-3.5",
  sm: "size-4",
  md: "size-4.5",
  lg: "size-5",
  xl: "size-6",
};

const shapeMap = {
  square: "rounded-md",
  rounded: "rounded-lg",
  circle: "rounded-full",
};

const badgeColorMap = {
  error: "bg-error text-error-contrast",
  primary: "bg-primary text-primary-contrast",
  warning: "bg-warning text-warning-contrast",
  success: "bg-success text-success-contrast",
};

export const UIIconButton = forwardRef(
  (
    {
      icon,
      children,
      variant = "ghost",
      size = "md",
      shape = "rounded",
      badge,
      badgeColor = "error",
      isLoading = false,
      disabled = false,
      tooltip,
      "aria-label": ariaLabel,
      className,
      onClick,
      ...props
    },
    ref,
  ) => {
    const appliedVariant =
      iconButtonVariants[variant] || iconButtonVariants.ghost;
    const appliedSize = iconButtonSizes[size] || iconButtonSizes.md;
    const appliedShape = shapeMap[shape] || shapeMap.rounded;
    const currentIconSize = innerIconSizes[size] || innerIconSizes.md;

    const isDisabled = disabled || isLoading;
    const accessibleLabel =
      ariaLabel ||
      tooltip ||
      (typeof children === "string" ? children : undefined);

    const renderContent = () => {
      if (isLoading) {
        return <Loader2 className={cn("animate-spin", currentIconSize)} />;
      }
      if (icon) {
        return React.isValidElement(icon)
          ? React.cloneElement(icon, {
              className: cn(currentIconSize, icon.props.className),
            })
          : icon;
      }
      return children;
    };

    return (
      <motion.button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-label={accessibleLabel}
        title={tooltip || accessibleLabel}
        whileTap={!isDisabled ? { scale: 0.92 } : undefined}
        transition={{ type: "spring", stiffness: 600, damping: 25 }}
        onClick={isDisabled ? undefined : onClick}
        className={cn(
          "group relative inline-flex items-center justify-center shrink-0 cursor-pointer select-none",
          "transition-colors duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
          "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:shadow-none",
          appliedVariant,
          appliedSize,
          appliedShape,
          className,
        )}
        {...props}
      >
        {renderContent()}

        {badge !== undefined && badge !== null && badge !== false && (
          <span
            className={cn(
              "absolute -top-1 -right-1 flex items-center justify-center font-mono tabular-nums font-bold tracking-tight rounded-full ring-2 ring-surface",
              typeof badge === "boolean"
                ? "size-2.5 p-0"
                : "min-w-4.5 h-4.5 px-1 text-[10px]",
              badgeColorMap[badgeColor] || badgeColorMap.error,
            )}
          >
            {typeof badge !== "boolean" ? badge : null}
          </span>
        )}
      </motion.button>
    );
  },
);

UIIconButton.displayName = "UIIconButton";
export default UIIconButton;
