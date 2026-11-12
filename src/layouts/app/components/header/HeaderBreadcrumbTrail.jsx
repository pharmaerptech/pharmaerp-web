// src/layouts/app/components/header/HeaderBreadcrumbTrail.jsx

import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Renders hierarchical parent links beneath the header page title for subroutes.
 */
export const HeaderBreadcrumbTrail = ({ breadcrumbs = [], compact = false }) => {
  if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-1 leading-tight text-text-muted min-w-0 truncate",
        compact ? "text-[10.5px]" : "mt-0.5 text-[11px]"
      )}
    >
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <span
            key={`${crumb.label}-${index}`}
            className="inline-flex items-center gap-1 min-w-0"
          >
            {index > 0 && (
              <ChevronRight
                className={cn(
                  "shrink-0 text-text-muted/60",
                  compact ? "size-2.5" : "size-3"
                )}
              />
            )}
            {crumb.to && !isLast ? (
              <Link
                to={crumb.to}
                className="truncate font-medium hover:text-primary transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? "truncate font-semibold text-text/80"
                    : "truncate font-medium"
                }
              >
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default HeaderBreadcrumbTrail;

