import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Store, Layers, ArrowRight, Eye, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const ContextSwitchLoader = ({
  isOpen,
  type = "company",
  fromName,
  toName,
  title,
}) => {
  if (!isOpen) return null;

  const isModeView = type === "mode-view";
  const isModeOp = type === "mode-operation";
  const isWorkspace = type === "workspace" || type === "level-workspace";
  const isCompany = type === "company" || type === "level-company";

  const Icon = isModeView
    ? Eye
    : isModeOp
    ? Zap
    : isWorkspace
    ? Layers
    : isCompany
    ? Building2
    : Store;

  const colorStyles = isModeView
    ? {
        spinner: "border-emerald-500/20 border-t-emerald-600 dark:border-t-emerald-400",
        iconBox: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        progressBar: "via-emerald-500/60",
        toText: "text-emerald-600 dark:text-emerald-400",
      }
    : isModeOp || isWorkspace
    ? {
        spinner: "border-purple-500/20 border-t-purple-600 dark:border-t-purple-400",
        iconBox: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
        progressBar: "via-purple-500/60",
        toText: "text-purple-600 dark:text-purple-400",
      }
    : isCompany
    ? {
        spinner: "border-primary/20 border-t-primary",
        iconBox: "bg-primary-soft text-primary border border-primary/20",
        progressBar: "via-primary/60",
        toText: "text-primary",
      }
    : {
        spinner: "border-emerald-500/20 border-t-emerald-600 dark:border-t-emerald-400",
        iconBox: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        progressBar: "via-emerald-500/60",
        toText: "text-emerald-600 dark:text-emerald-400",
      };

  const displayTitle =
    title ||
    (isModeView
      ? "Entering View Mode"
      : isModeOp
      ? "Entering Operation Mode"
      : isWorkspace
      ? "Switching to Workspace"
      : isCompany
      ? "Switching Company"
      : "Switching Branch");

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto bg-surface/60"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center justify-center p-8 max-w-sm w-full mx-4 bg-surface rounded-[24px] border border-border shadow-[var(--app-shadow-2xl)]"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.18)",
            }}
          >
            {/* Animated Icon & Spinner */}
            <div className="relative flex items-center justify-center size-16 mb-5">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.8, ease: "linear", repeat: Infinity }}
                className={cn(
                  "absolute inset-0 rounded-full border-2",
                  colorStyles.spinner
                )}
              />
              <div
                className={cn(
                  "flex items-center justify-center size-10 rounded-full shadow-2xs",
                  colorStyles.iconBox
                )}
              >
                <Icon className="size-5" />
              </div>
            </div>

            {/* Dynamic Title & Breadcrumbs */}
            <div className="text-center space-y-2">
              <h3 className="text-[17px] font-bold text-text tracking-tight">
                {displayTitle}
              </h3>

              <div className="flex items-center justify-center gap-2 text-[13px] font-medium text-text-muted">
                {fromName ? (
                  <>
                    <span className="truncate max-w-[130px]" title={fromName}>
                      {fromName}
                    </span>
                    <ArrowRight className="size-3.5 shrink-0 opacity-40" />
                  </>
                ) : null}
                <span
                  className={cn("truncate max-w-[140px] font-bold", colorStyles.toText)}
                  title={toName}
                >
                  {toName || (isModeView ? "View Mode" : isModeOp ? "Operation Mode" : "Next")}
                </span>
              </div>
            </div>

            {/* Progress Bar with Contextual Gradient */}
            <div className="w-full h-1 mt-6 bg-surface-hover rounded-full overflow-hidden relative">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
                className={cn(
                  "absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent to-transparent",
                  colorStyles.progressBar
                )}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ContextSwitchLoader;
