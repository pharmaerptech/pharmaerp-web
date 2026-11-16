// src/components/ui/UIDropdown.jsx

import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  createContext,
  useContext,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const UIDropdownContext = createContext(null);

export const UIDropdown = forwardRef(
  (
    {
      children,
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      placement = "auto", // "auto" | "bottom" | "top"
      align = "auto", // "auto" | "right" | "left"
      usePortal = true, // Render via portal with fixed coords by default to avoid overflow clipping
      className,
      ...props
    },
    ref
  ) => {
    const isControlled = controlledOpen !== undefined;
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

    const setIsOpen = (valueOrUpdater) => {
      const nextOpen =
        typeof valueOrUpdater === "function"
          ? valueOrUpdater(isOpen)
          : valueOrUpdater;
      if (nextOpen && containerRef.current) {
        setTriggerRect(containerRef.current.getBoundingClientRect());
      }
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    };

    const [resolvedPlacement, setResolvedPlacement] = useState("bottom");
    const [resolvedAlign, setResolvedAlign] = useState("right");
    const [triggerRect, setTriggerRect] = useState(null);
    const containerRef = useRef(null);
    const menuRef = useRef(null);

    // Smart 4-Way Viewport & Boundary Collision Detection
    const calculatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setTriggerRect(rect);

      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth =
        window.innerWidth || document.documentElement.clientWidth;

      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const spaceRight = viewportWidth - rect.right;
      const spaceLeft = rect.left;

      const estimatedHeight = 220; // Safe threshold for dropdown menus
      const estimatedWidth = 200; // Safe width threshold

      // 1. Vertical Auto-Flipping
      if (placement === "top") {
        if (spaceAbove < estimatedHeight && spaceBelow > spaceAbove) {
          setResolvedPlacement("bottom");
        } else {
          setResolvedPlacement("top");
        }
      } else if (placement === "bottom") {
        if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
          setResolvedPlacement("top");
        } else {
          setResolvedPlacement("bottom");
        }
      } else {
        // placement === "auto"
        if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
          setResolvedPlacement("top");
        } else {
          setResolvedPlacement("bottom");
        }
      }

      // 2. Horizontal Auto-Flipping
      if (align === "left" || align === "start") {
        if (spaceRight < estimatedWidth && spaceLeft > spaceRight) {
          setResolvedAlign("right");
        } else {
          setResolvedAlign("left");
        }
      } else if (align === "right" || align === "end") {
        if (spaceLeft < estimatedWidth && spaceRight > spaceLeft) {
          setResolvedAlign("left");
        } else {
          setResolvedAlign("right");
        }
      } else {
        // align === "auto"
        if (spaceRight >= estimatedWidth) {
          setResolvedAlign("left");
        } else {
          setResolvedAlign("right");
        }
      }
    };

    // Recalculate on open, window resize, and scroll
    useLayoutEffect(() => {
      if (isOpen) {
        calculatePosition();
        window.addEventListener("resize", calculatePosition, { passive: true });
        window.addEventListener("scroll", calculatePosition, {
          passive: true,
          capture: true,
        });
        return () => {
          window.removeEventListener("resize", calculatePosition);
          window.removeEventListener("scroll", calculatePosition, true);
        };
      }
    }, [isOpen, placement, align]);

    // Outside click detection
    useEffect(() => {
      if (!isOpen) return;

      const handleOutsideClick = (e) => {
        const target = e.target;
        if (
          containerRef.current &&
          !containerRef.current.contains(target) &&
          menuRef.current &&
          !menuRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [isOpen]);

    return (
      <UIDropdownContext.Provider
        value={{
          isOpen,
          setIsOpen,
          placement: resolvedPlacement,
          align: resolvedAlign,
          triggerRect,
          usePortal,
          menuRef,
        }}
      >
        <div
          ref={(node) => {
            containerRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          className={cn("relative inline-flex font-sans", className)}
          {...props}
        >
          {children}
        </div>
      </UIDropdownContext.Provider>
    );
  }
);
UIDropdown.displayName = "UIDropdown";

export const UIDropdownTrigger = forwardRef(
  ({ children, asChild = false, className, ...props }, ref) => {
    const context = useContext(UIDropdownContext);
    const isOpen = context?.isOpen ?? false;
    const setIsOpen = context?.setIsOpen;

    const handleClick = (e) => {
      e.stopPropagation();
      setIsOpen?.((prev) => !prev);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ref,
        onClick: (e) => {
          children.props.onClick?.(e);
          handleClick(e);
        },
        "aria-expanded": isOpen,
        "aria-haspopup": "menu",
      });
    }

    return (
      <div
        ref={ref}
        onClick={handleClick}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn("cursor-pointer inline-flex items-center", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
UIDropdownTrigger.displayName = "UIDropdownTrigger";

export const UIDropdownMenu = forwardRef(
  (
    {
      children,
      align: explicitAlign,
      placement: explicitPlacement,
      width = "w-52",
      usePortal: explicitUsePortal,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const context = useContext(UIDropdownContext);
    const isOpen = context?.isOpen ?? false;
    const triggerRect = context?.triggerRect;
    const menuRef = context?.menuRef;
    const usePortal = explicitUsePortal ?? context?.usePortal ?? true;

    const appliedPlacement =
      explicitPlacement || context?.placement || "bottom";
    const appliedAlign = explicitAlign || context?.align || "right";

    const viewportHeight =
      typeof window !== "undefined"
        ? window.innerHeight || document.documentElement.clientHeight || 768
        : 768;
    const spaceBelow = triggerRect ? viewportHeight - triggerRect.bottom : 300;
    const spaceAbove = triggerRect ? triggerRect.top : 300;
    const isTop =
      appliedPlacement === "top" ||
      (appliedPlacement !== "bottom" && spaceBelow < 240 && spaceAbove > spaceBelow);

    // Fixed Positioning for Portal Mode with Viewport Edge Clamping
    const getPortalStyle = () => {
      if (!triggerRect) return { display: "none" };

      const viewportWidth =
        window.innerWidth || document.documentElement.clientWidth || 1024;

      const isRightAligned =
        appliedAlign === "right" ||
        appliedAlign === "end" ||
        (appliedAlign !== "left" && appliedAlign !== "start" && viewportWidth - triggerRect.right < 210);

      const computedStyle = {
        position: "fixed",
        zIndex: 9999,
        maxWidth: "calc(100vw - 16px)",
        ...style,
      };

      if (isTop) {
        computedStyle.bottom = Math.max(8, viewportHeight - triggerRect.top + 6);
        computedStyle.maxHeight = Math.min(360, Math.max(120, spaceAbove - 16));
      } else {
        computedStyle.top = Math.max(8, triggerRect.bottom + 6);
        computedStyle.maxHeight = Math.min(360, Math.max(120, spaceBelow - 16));
      }

      if (isRightAligned) {
        // Anchor to right edge of trigger, safely clamped at least 8px from viewport edge
        computedStyle.right = Math.max(8, viewportWidth - triggerRect.right);
      } else {
        // Anchor to left edge of trigger, safely clamped inside viewport
        computedStyle.left = Math.max(8, Math.min(triggerRect.left, viewportWidth - 210));
      }

      return computedStyle;
    };

    const content = (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={(node) => {
              if (menuRef) menuRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: isTop ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: isTop ? 6 : -6 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            style={usePortal ? getPortalStyle() : style}
            className={cn(
              "bg-surface border border-border/80 rounded-2xl shadow-2xl p-1.5 space-y-0.5 overflow-hidden backdrop-blur-sm",
              !usePortal &&
                (isTop ? "bottom-full mb-1.5" : "top-full mt-1.5"),
              !usePortal && (appliedAlign === "right" ? "right-0" : "left-0"),
              !usePortal && "absolute z-50",
              width,
              className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );

    if (usePortal && typeof document !== "undefined") {
      return createPortal(content, document.body);
    }

    return content;
  }
);
UIDropdownMenu.displayName = "UIDropdownMenu";

export const UIDropdownItem = forwardRef(
  (
    {
      children,
      icon,
      shortcut,
      destructive = false,
      disabled = false,
      closeOnSelect = true,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const context = useContext(UIDropdownContext);
    const setIsOpen = context?.setIsOpen;

    const handleClick = (e) => {
      if (disabled) return;
      if (closeOnSelect) {
        setIsOpen?.(false);
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        role="menuitem"
        type="button"
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "flex flex-row items-center justify-between w-full px-3 py-2 text-xs sm:text-[13px] font-medium rounded-xl cursor-pointer select-none whitespace-nowrap",
          "transition-colors duration-100 ease-out",
          destructive
            ? "text-error hover:bg-error/10 active:bg-error/20"
            : "text-text hover:bg-surface-hover hover:text-text active:bg-surface-active",
          disabled && "opacity-40 cursor-not-allowed pointer-events-none",
          className
        )}
        {...props}
      >
        <div className="flex flex-row items-center gap-2.5 min-w-0 flex-1 whitespace-nowrap text-left">
          {icon && (
            <span
              className={cn(
                "shrink-0 size-4 inline-flex items-center justify-center",
                destructive ? "text-error" : "text-text-muted"
              )}
            >
              {icon}
            </span>
          )}
          <span className="truncate inline-flex items-center gap-2 whitespace-nowrap leading-none">
            {children}
          </span>
        </div>

        {shortcut && (
          <span className="shrink-0 ml-2 font-mono text-[10px] font-semibold text-text-muted uppercase tracking-wider bg-surface-alt px-1.5 py-0.5 rounded border border-border/60">
            {shortcut}
          </span>
        )}
      </button>
    );
  }
);
UIDropdownItem.displayName = "UIDropdownItem";

export const UIDropdownDivider = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("h-px bg-border/80 my-1 -mx-1.5", className)}
    {...props}
  />
));
UIDropdownDivider.displayName = "UIDropdownDivider";

export const UIDropdownLabel = forwardRef(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted select-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
UIDropdownLabel.displayName = "UIDropdownLabel";

export default UIDropdown;
