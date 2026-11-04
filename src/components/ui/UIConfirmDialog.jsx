import React, { forwardRef, useState, useEffect } from "react";
import {
  AlertTriangle,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { UIButton } from "./UIButton";

/**
 * UIConfirmDialog (#34)
 *
 * Enterprise confirmation dialog for destructive actions, invoice cancellations,
 * batch deletions, and critical irreversible state changes.
 *
 * Features:
 * - Intent presets: "danger" / "destructive" (red), "warning" (amber), "info" (blue), "success" (emerald)
 * - Highlighted target entity box (`itemName`, `itemDetails`)
 * - Safety confirmation verification: requires typing a keyword (e.g. "DELETE" or SKU code) before unlocking CTA
 * - Smooth backdrop-blur and spring scale physics (`stiffness: 500, damping: 30`)
 * - Keyboard listeners: Esc to cancel, Enter to submit when unlocked
 * - Built-in loading state with spinner
 */
export const UIConfirmDialog = forwardRef(
  (
    {
      isOpen = false,
      onClose,
      onConfirm,
      title = "Confirm Action",
      description = "Are you sure you want to proceed? This action cannot be undone.",
      intent = "danger", // "danger" | "warning" | "info" | "success"
      confirmText,
      cancelText = "Cancel",
      itemName,
      itemDetails,
      requireInput = false,
      confirmPhrase = "DELETE",
      inputPlaceholder,
      isLoading = false,
      icon,
      size = "md", // "sm" | "md" | "lg"
      className,
      ...props
    },
    ref
  ) => {
    const [inputValue, setInputValue] = useState("");

    // Reset input value when modal opens/closes
    useEffect(() => {
      if (isOpen) {
        setInputValue("");
      }
    }, [isOpen]);

    // Handle Esc key to close
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === "Escape" && isOpen && !isLoading) {
          onClose?.();
        }
      };
      if (isOpen) {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
      }
    }, [isOpen, isLoading, onClose]);

    const intentConfig = {
      danger: {
        icon: <Trash2 className="size-5 sm:size-6 text-error" />,
        iconBg: "bg-error/15 text-error border border-error/20",
        confirmVariant: "danger",
        defaultConfirmText: "Delete Record",
        defaultPhrase: "DELETE",
      },
      warning: {
        icon: <AlertTriangle className="size-5 sm:size-6 text-warning" />,
        iconBg: "bg-warning/15 text-warning border border-warning/20",
        confirmVariant: "warning",
        defaultConfirmText: "Proceed",
        defaultPhrase: "CONFIRM",
      },
      info: {
        icon: <Info className="size-5 sm:size-6 text-info" />,
        iconBg: "bg-info/15 text-info border border-info/20",
        confirmVariant: "primary",
        defaultConfirmText: "Continue",
        defaultPhrase: "YES",
      },
      success: {
        icon: <CheckCircle2 className="size-5 sm:size-6 text-success" />,
        iconBg: "bg-success/15 text-success border border-success/20",
        confirmVariant: "success",
        defaultConfirmText: "Approve",
        defaultPhrase: "APPROVE",
      },
    };

    const curIntent = intentConfig[intent] || intentConfig.danger;
    const resolvedConfirmText = confirmText || curIntent.defaultConfirmText;
    const targetPhrase = confirmPhrase || curIntent.defaultPhrase;

    const isInputValid = !requireInput || inputValue.trim() === targetPhrase;
    const isConfirmDisabled = isLoading || (requireInput && !isInputValid);

    const handleConfirmSubmit = (e) => {
      e?.preventDefault();
      if (!isConfirmDisabled) {
        onConfirm?.();
      }
    };

    const sizeClasses = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={!isLoading ? onClose : undefined}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Dialog Box */}
            <motion.div
              ref={ref}
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-desc"
              className={cn(
                "relative w-full bg-surface border border-border rounded-2xl shadow-xl z-10 overflow-hidden font-sans",
                sizeClasses[size] || sizeClasses.md,
                className
              )}
              {...props}
            >
              {/* Close ✕ Button */}
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                aria-label="Close dialog"
                className="absolute top-4 right-4 size-8 rounded-lg hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-text transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="size-4" />
              </button>

              <div className="p-6">
                {/* Header: Icon + Title */}
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "size-11 sm:size-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      curIntent.iconBg
                    )}
                  >
                    {icon || curIntent.icon}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h3
                      id="confirm-dialog-title"
                      className="text-base sm:text-lg font-bold text-text leading-snug"
                    >
                      {title}
                    </h3>
                    <p
                      id="confirm-dialog-desc"
                      className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed"
                    >
                      {description}
                    </p>
                  </div>
                </div>

                {/* Highlighted Entity Container (Optional) */}
                {(itemName || itemDetails) && (
                  <div className="mt-4 p-3 rounded-xl bg-surface-alt/70 border border-border/80 text-left">
                    {itemName && (
                      <div className="text-xs sm:text-[13px] font-bold text-text break-words">
                        {itemName}
                      </div>
                    )}
                    {itemDetails && (
                      <div className="text-xs text-text-muted mt-0.5 break-words font-mono">
                        {itemDetails}
                      </div>
                    )}
                  </div>
                )}

                {/* Verification Safety Input (Optional) */}
                {requireInput && (
                  <div className="mt-4 text-left">
                    <label className="block text-xs font-semibold text-text mb-1.5 select-none">
                      To confirm, type{" "}
                      <span className="font-mono font-bold text-primary px-1 py-0.5 bg-primary-soft/40 rounded">
                        {targetPhrase}
                      </span>{" "}
                      below:
                    </label>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={inputPlaceholder || `Type "${targetPhrase}" to verify`}
                      disabled={isLoading}
                      className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-xl font-mono text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-muted/60"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && isInputValid && !isLoading) {
                          handleConfirmSubmit(e);
                        }
                      }}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-border/70">
                  <UIButton
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {cancelText}
                  </UIButton>

                  <UIButton
                    type="button"
                    variant={curIntent.confirmVariant}
                    size="md"
                    onClick={handleConfirmSubmit}
                    disabled={isConfirmDisabled}
                    isLoading={isLoading}
                  >
                    {resolvedConfirmText}
                  </UIButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }
);
UIConfirmDialog.displayName = "UIConfirmDialog";

export default UIConfirmDialog;
