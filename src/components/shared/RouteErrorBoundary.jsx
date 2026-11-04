// src/components/shared/RouteErrorBoundary.jsx

import React from "react";
import { useRouteError, useNavigate } from "react-router-dom";
import { AlertTriangle, RotateCw, Home, ArrowLeft } from "lucide-react";
import { UICard, UIButton, UIBadge } from "@/components/ui";
import { ROUTES } from "@/constants";

export const RouteErrorBoundary = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  const errorMessage =
    error?.statusText ||
    error?.message ||
    (typeof error === "string" ? error : "An unexpected error occurred while rendering this section.");

  const errorStack = error?.stack || null;

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-4 bg-bg font-sans text-text">
      <UICard
        variant="default"
        padding="none"
        className="max-w-xl w-full rounded-2xl border border-border bg-surface shadow-md overflow-hidden text-center p-6 sm:p-8 space-y-5"
      >
        {/* Icon */}
        <div className="size-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 flex items-center justify-center mx-auto shadow-2xs">
          <AlertTriangle className="size-7" />
        </div>

        {/* Title & Message */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
              Something went wrong
            </h2>
            <UIBadge variant="soft" color="error" size="xs">
              {error?.status || "Application Error"}
            </UIBadge>
          </div>
          <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
            {errorMessage}
          </p>
        </div>

        {/* Stack Trace (folded in details) */}
        {errorStack && (
          <details className="text-left text-xs bg-surface-alt/70 border border-border/80 rounded-xl p-3.5 overflow-hidden">
            <summary className="font-semibold text-text-muted cursor-pointer hover:text-text select-none">
              Technical Details
            </summary>
            <pre className="mt-2 text-[11px] font-mono text-rose-700 dark:text-rose-400 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
              {errorStack}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <UIButton
            variant="primary"
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-1.5 font-semibold"
          >
            <RotateCw className="size-4" />
            <span>Reload Page</span>
          </UIButton>

          <UIButton
            variant="outline"
            size="sm"
            onClick={() => navigate(ROUTES.DASHBOARD || "/")}
            className="gap-1.5 font-semibold"
          >
            <Home className="size-4" />
            <span>Go to Dashboard</span>
          </UIButton>

          <UIButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1.5 text-text-muted hover:text-text"
          >
            <ArrowLeft className="size-4" />
            <span>Go Back</span>
          </UIButton>
        </div>
      </UICard>
    </div>
  );
};

export default RouteErrorBoundary;

