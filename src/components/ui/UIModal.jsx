import React, { forwardRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const modalSizes = {
  sm: "max-w-md", // ~448px
  md: "max-w-lg", // ~512px (default)
  lg: "max-w-2xl", // ~672px
  xl: "max-w-4xl", // ~896px
  "2xl": "max-w-5xl", // ~1024px
  "3xl": "max-w-7xl", // ~1280px
  full: "max-w-[calc(100vw-2rem)] min-h-[calc(100vh-2rem)]",
};

let openModalCount = 0;

export const UIModal = forwardRef(
  (
    {
      isOpen: controlledIsOpen,
      open,
      onClose,
      size = "md",
      closeOnBackdrop = true,
      closeOnEsc = true,
      showCloseButton = true,
      mobileSheet = false,
      title,
      description,
      badge,
      footer,
      children,
      className,
      overlayClassName,
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
    // Body scroll lock
    useEffect(() => {
      if (isOpen) {
        openModalCount++;
        document.body.style.overflow = "hidden";
        
        return () => {
          openModalCount--;
          if (openModalCount <= 0) {
            openModalCount = 0;
            document.body.style.overflow = "";
          }
        };
      }
    }, [isOpen]);

    // Esc key listener
    useEffect(() => {
      if (!isOpen || !closeOnEsc) return;

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose?.();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, closeOnEsc, onClose]);

    const appliedSize = modalSizes[size] || modalSizes.md;

    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <div
            className={cn(
              "fixed inset-0 z-[100] flex p-4 sm:p-6 overflow-y-auto",
              mobileSheet ? "items-end sm:items-center justify-center" : "items-center justify-center"
            )}
          >
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={closeOnBackdrop ? onClose : undefined}
              className={cn(
                "fixed inset-0 bg-neutral-950/50 dark:bg-neutral-950/70 backdrop-blur-sm",
                overlayClassName
              )}
            />

            {/* Modal Dialog Card with Spring Physics */}
            <motion.div
              ref={ref}
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95, y: mobileSheet ? 20 : 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: mobileSheet ? 20 : 10 }}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 28,
              }}
              className={cn(
                "relative w-full bg-surface border border-border shadow-2xl overflow-hidden z-10 flex flex-col font-sans",
                mobileSheet ? "rounded-t-3xl sm:rounded-3xl" : "rounded-3xl",
                appliedSize,
                className
              )}
              {...props}
            >
              {/* Optional Drag Handle for Mobile Sheets */}
              {mobileSheet && (
                <div className="flex justify-center pt-2.5 pb-0.5 sm:hidden">
                  <div className="w-10 h-1 rounded-full bg-border/80" />
                </div>
              )}
              {/* Optional Top-Right Close Button */}
              {showCloseButton && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  className="absolute top-4.5 right-4.5 p-1.5 rounded-xl text-text-muted hover:text-text hover:bg-surface-hover transition-colors z-20 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              )}

              {/* Optional Direct Header from title prop */}
              {(title || description || badge) && (
                <div className="p-5 sm:p-6 border-b border-border flex items-start justify-between gap-4 shrink-0">
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2">
                      {title && (
                        <div className="text-base sm:text-lg font-bold text-text">
                          {title}
                        </div>
                      )}
                      {badge && <div className="shrink-0">{badge}</div>}
                    </div>
                    {description && (
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Scrollable Body Content */}
              {title || footer ? (
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                  {children}
                </div>
              ) : (
                children
              )}

              {/* Optional Direct Footer from footer prop */}
              {footer && (
                <div className="p-4 sm:p-5 border-t border-border bg-surface-alt/40 shrink-0 flex items-center justify-end gap-2.5">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  }
);
UIModal.displayName = "UIModal";

export const UIModalHeader = forwardRef(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-6 pt-6 pb-2 flex flex-col space-y-1 pr-12", className)}
      {...props}
    >
      {children}
    </div>
  )
);
UIModalHeader.displayName = "UIModalHeader";

export const UIModalTitle = forwardRef(
  ({ children, as: Tag = "h2", className, ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn("text-lg sm:text-xl font-bold tracking-tight text-text leading-tight", className)}
      {...props}
    >
      {children}
    </Tag>
  )
);
UIModalTitle.displayName = "UIModalTitle";

export const UIModalDescription = forwardRef(
  ({ children, className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-xs sm:text-sm text-text-muted leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  )
);
UIModalDescription.displayName = "UIModalDescription";

export const UIModalBody = forwardRef(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-6 overflow-y-auto overflow-x-hidden max-h-[70vh] space-y-4 text-sm text-text", className)}
      {...props}
    >
      {children}
    </div>
  )
);
UIModalBody.displayName = "UIModalBody";

export const UIModalFooter = forwardRef(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-6 py-4 bg-surface-alt/60 border-t border-border/80 flex items-center justify-end gap-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
UIModalFooter.displayName = "UIModalFooter";

export default UIModal;
