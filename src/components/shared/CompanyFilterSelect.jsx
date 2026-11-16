// src/components/shared/CompanyFilterSelect.jsx

import React, { useMemo } from "react";
import { Building2 } from "lucide-react";
import { UISelect } from "@/components/ui";
import { useNavigationPipeline, PIPELINE_LEVELS } from "@/contexts/NavigationPipelineContext";
import useCompany from "@/features/company/hooks/useCompany";
import { cn } from "@/lib/utils";

/**
 * CompanyFilterSelect - Appears strictly at Workspace level to allow filtering table
 * modules across all companies or by a specific company.
 * Returns null at Company or Branch level so company/branch pages remain 100% untouched.
 */
export const CompanyFilterSelect = ({
  value = "all",
  onChange,
  size = "sm",
  className = "w-full",
  triggerClassName,
  placeholder = "All Companies",
  label,
  showLabel = false,
  isSearchable = true,
  disabled = false,
}) => {
  const { currentLevel } = useNavigationPipeline();
  const { companies = [] } = useCompany();

  const isWorkspaceLevel =
    currentLevel === PIPELINE_LEVELS.WORKSPACE || currentLevel === "workspace";

  const options = useMemo(() => {
    const list = [
      {
        value: "all",
        label: "All Companies",
        description: "Workspace-wide (All Entities)",
        icon: Building2,
      },
      ...(companies || []).map((c) => ({
        value: c._id,
        label: c.name || c.legalName || "Company",
        description: c.code ? `[${c.code}]` : (c.businessType || ""),
        icon: Building2,
      })),
    ];
    return list;
  }, [companies]);

  // If user is at company or branch level, render NOTHING to preserve UI completely
  if (!isWorkspaceLevel) {
    return null;
  }

  return (
    <div className={cn("inline-flex flex-col min-w-0 w-full", className)}>
      {showLabel && (
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
          <Building2 className="size-3 text-primary" />
          {label || "Company Scope"}
        </span>
      )}
      <UISelect
        size={size}
        value={value || "all"}
        onChange={(val) => onChange?.(val)}
        options={options}
        placeholder={placeholder}
        isSearchable={isSearchable && options.length > 4}
        disabled={disabled}
        triggerClassName={cn(
          "bg-surface border-border hover:border-border-focus font-medium",
          value !== "all" && "border-primary/50 bg-primary/5 text-primary",
          triggerClassName
        )}
      />
    </div>
  );
};

/**
 * CompanyBadge - Helper component to display company identity badge on table rows
 * when viewed from Workspace level.
 */
export const CompanyBadge = ({
  company,
  companyId,
  companyName,
  companyCode,
  className,
}) => {
  const resolvedName =
    companyName ||
    company?.name ||
    (typeof companyId === "object" ? companyId?.name : null);

  const resolvedCode =
    companyCode ||
    company?.code ||
    (typeof companyId === "object" ? companyId?.code : null);

  if (!resolvedName && !resolvedCode) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0 max-w-[140px] truncate",
        className
      )}
      title={resolvedName ? `${resolvedName} (${resolvedCode || "N/A"})` : resolvedCode}
    >
      <Building2 className="size-3 shrink-0 opacity-70" />
      <span className="truncate">{resolvedName || resolvedCode}</span>
    </span>
  );
};

export default CompanyFilterSelect;
