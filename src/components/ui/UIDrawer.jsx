import React, { forwardRef, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * UIDrawer Suite (#39)
 *
 * Slide-over side panel for fast forms, detail views, batch inspections,
 * and quick edits without leaving page context.
 *
 * Features:
 * - Positions: "right" (default) | "left" | "bottom" | "top"
 * - Sizes: "sm" (380px), "md" (480px), "lg" (640px), "xl" (800px), "full"
 * - Smooth spring physics (`stiffness: 400, damping: 35`)
 * - Sub-components: `UIDrawer`, `UIDrawerHeader`, `UIDrawerTitle`, `UIDrawerDescription`, `UIDrawerBody`, `UIDrawerFooter`
 */

let openDrawerCount = 0;

export const UIDrawer = forwardRef(
  (
    {
      isOpen: controlledIsOpen,
      open,
      onClose,
      position = "right", // "right" | "left" | "bottom" | "top"
      size = "md", // "sm" | "md" | "lg" | "xl" | "full"
      title,
      description,
      badge,
      footer,
      closeOnBackdrop = true,
      closeOnEsc = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isOpen =
      controlledIsOpen !== undefined
        ? Boolean(controlledIsOpen)
        : open !== undefined
        ? Boolean(open)
        : false;
    // Keyboard Esc listener
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === "Escape" && isOpen && closeOnEsc) {
          onClose?.();
        }
      };
      if (isOpen) {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
      }
    }, [isOpen, closeOnEsc, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
      if (isOpen) {
        openDrawerCount++;
        document.body.style.overflow = "hidden";
        
        return () => {
          openDrawerCount--;
          if (openDrawerCount <= 0) {
            openDrawerCount = 0;
            document.body.style.overflow = "";
          }
        };
      }
    }, [isOpen]);

    const sizeClasses = {
      sm: position === "bottom" || position === "top" ? "max-h-[40vh]" : "max-w-sm sm:max-w-[380px]",
      md: position === "bottom" || position === "top" ? "max-h-[60vh]" : "max-w-md sm:max-w-[480px]",
      lg: position === "bottom" || position === "top" ? "max-h-[80vh]" : "max-w-lg sm:max-w-[640px]",
      xl: position === "bottom" || position === "top" ? "max-h-[90vh]" : "max-w-xl sm:max-w-[800px]",
      full: "max-w-full max-h-full",
    };

    const motionVariants = {
      right: {
        initial: { x: "100%", opacity: 0.4 },
        animate: { x: 0, opacity: 1 },
        exit: { x: "100%", opacity: 0 },
        container: "right-0 top-0 bottom-0 border-l",
      },
      left: {
        initial: { x: "-100%", opacity: 0.4 },
        animate: { x: 0, opacity: 1 },
        exit: { x: "-100%", opacity: 0 },
        container: "left-0 top-0 bottom-0 border-r",
      },
      bottom: {
        initial: { y: "100%", opacity: 0.4 },
        animate: { y: 0, opacity: 1 },
        exit: { y: "100%", opacity: 0 },
        container: "bottom-0 left-0 right-0 border-t rounded-t-2xl",
      },
      top: {
        initial: { y: "-100%", opacity: 0.4 },
        animate: { y: 0, opacity: 1 },
        exit: { y: "-100%", opacity: 0 },
        container: "top-0 left-0 right-0 border-b rounded-b-2xl",
      },
    };

    const curMotion = motionVariants[position] || motionVariants.right;

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] overflow-hidden font-sans">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeOnBackdrop ? onClose : undefined}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Slide-over Drawer Panel */}
            <motion.div
              ref={ref}
              initial={curMotion.initial}
              animate={curMotion.animate}
              exit={curMotion.exit}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              role="dialog"
              aria-modal="true"
              className={cn(
                "fixed bg-surface border-border shadow-2xl flex flex-col w-full h-full z-10 overflow-hidden",
                curMotion.container,
                sizeClasses[size] || sizeClasses.md,
                className
              )}
              {...props}
            >
              {/* Header */}
              {(title || description || badge) && (
                <div className="p-5 sm:p-6 border-b border-border flex items-start justify-between gap-4 shrink-0">
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2">
                      {title && (
                        <h2 className="text-base sm:text-lg font-bold text-text truncate">
                          {title}
                        </h2>
                      )}
                      {badge && <div className="shrink-0">{badge}</div>}
                    </div>
                    {description && (
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        {description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close drawer"
                    className="size-8 rounded-lg hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-text transition-colors cursor-pointer shrink-0 -mr-1"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}

              {/* Scrollable Body Content */}
              <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
                {children}
              </div>

              {/* Action Footer */}
              {footer && (
                <div className="p-4 sm:p-5 border-t border-border bg-surface-alt/40 shrink-0 flex items-center justify-end gap-2.5">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }
);
UIDrawer.displayName = "UIDrawer";

export default UIDrawer;
