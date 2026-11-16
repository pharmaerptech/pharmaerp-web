import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  primary:
    "bg-primary text-primary-contrast hover:bg-primary-hover shadow-sm hover:shadow active:scale-[0.98] border border-primary/20",
  secondary:
    "bg-surface-alt text-text hover:bg-surface-hover border border-border hover:border-border-strong shadow-xs active:scale-[0.98]",
  outline:
    "border border-border bg-transparent text-text hover:bg-surface-hover hover:border-border-strong active:scale-[0.98]",
  ghost:
    "bg-transparent text-text hover:bg-surface-hover text-text-muted hover:text-text active:scale-[0.98]",
  destructive:
    "bg-error text-error-contrast hover:bg-error-hover shadow-sm hover:shadow active:scale-[0.98] border border-error/20",
  danger:
    "bg-error text-error-contrast hover:bg-error-hover shadow-sm hover:shadow active:scale-[0.98] border border-error/20",
  error:
    "bg-error text-error-contrast hover:bg-error-hover shadow-sm hover:shadow active:scale-[0.98] border border-error/20",
  soft:
    "bg-primary-soft text-primary hover:bg-primary/15 border border-primary/10 active:scale-[0.98]",
  success:
    "bg-success text-success-contrast hover:bg-success-hover shadow-sm hover:shadow active:scale-[0.98] border border-success/20",
  warning:
    "bg-warning text-warning-contrast hover:bg-warning-hover shadow-sm hover:shadow active:scale-[0.98] border border-warning/20",
  link:
    "text-primary underline-offset-4 hover:underline p-0 h-auto font-medium hover:text-primary-hover active:opacity-80 shadow-none border-0",
};

const buttonSizes = {
  xs: "h-7 px-2.5 text-[11.5px] font-medium gap-1.5 rounded-md",
  sm: "h-8.5 px-3 text-[13px] font-medium gap-2 rounded-lg",
  md: "h-10 px-4 text-sm font-semibold gap-2 rounded-lg",
  lg: "h-11.5 px-5 text-[15px] font-semibold gap-2.5 rounded-xl",
  xl: "h-13 px-6 text-base font-bold gap-3 rounded-xl",
};

const iconSizes = {
  xs: "size-3.5",
  sm: "size-4",
  md: "size-4",
  lg: "size-4.5",
  xl: "size-5",
};

const roundedMap = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export const UIButton = forwardRef(
  (
    {
      children,
      type = "button",
      variant = "primary",
      size = "md",
      rounded,
      isLoading = false,
      loading = false,
      loadingText,
      startIcon,
      endIcon,
      fullWidth = false,
      disabled = false,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const isSpinnerLoading = Boolean(isLoading || loading);
    const isLink = variant === "link";
    const appliedSize = isLink ? "" : (buttonSizes[size] || buttonSizes.md);
    const appliedVariant = buttonVariants[variant] || buttonVariants.primary;
    const appliedRounded = rounded ? roundedMap[rounded] || rounded : "";
    const currentIconSize = iconSizes[size] || iconSizes.md;

    const isDisabled = disabled || isSpinnerLoading;

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isSpinnerLoading}
        whileTap={!isDisabled && !isLink ? { scale: 0.97 } : undefined}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        onClick={isDisabled ? undefined : onClick}
        className={cn(
          "inline-flex flex-row flex-nowrap items-center justify-center font-sans tracking-tight select-none cursor-pointer whitespace-nowrap",
          "[&_svg]:shrink-0 [&_svg]:inline-block [&_svg]:align-middle [&_svg]:self-center [&_span]:whitespace-nowrap",
          "transition-colors duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
          "disabled:opacity-50 disabled:shadow-none",
          appliedVariant,
          appliedSize,
          appliedRounded,
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isSpinnerLoading ? (
          <span className="inline-flex flex-row flex-nowrap items-center justify-center gap-2 whitespace-nowrap shrink-0">
            <Loader2 className={cn("animate-spin shrink-0 self-center", currentIconSize)} />
            <span className="whitespace-nowrap shrink-0 self-center">{loadingText || children}</span>
          </span>
        ) : (
          <>
            {startIcon && (
              <span className={cn("inline-flex shrink-0 items-center justify-center self-center", currentIconSize)}>
                {startIcon}
              </span>
            )}
            {children && (
              typeof children === "string" || typeof children === "number" ? (
                <span className="whitespace-nowrap shrink-0 self-center">{children}</span>
              ) : (
                <span className="inline-flex flex-row flex-nowrap items-center justify-center gap-1.5 whitespace-nowrap shrink-0 self-center">
                  {children}
                </span>
              )
            )}
            {endIcon && (
              <span className={cn("inline-flex shrink-0 items-center justify-center self-center", currentIconSize)}>
                {endIcon}
              </span>
            )}
          </>
        )}
      </motion.button>
    );
  }
);

UIButton.displayName = "UIButton";
export default UIButton;
