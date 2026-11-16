// src/components/shared/BranchFilterSelect.jsx

import React, { useMemo } from "react";
import { Building2, Store, GitBranch, MapPin } from "lucide-react";
import { UISelect } from "@/components/ui";
import { useNavigationPipeline, PIPELINE_LEVELS } from "@/contexts/NavigationPipelineContext";
import useBranch from "@/features/branch/hooks/useBranch";
import useCompany from "@/features/company/hooks/useCompany";
import { cn } from "@/lib/utils";

/**
 * BranchFilterSelect - Appears strictly at Company level to allow filtering table
 * modules across all branches or by a specific branch.
 * Returns null at Branch level so branch pages remain 100% untouched.
 */
export const BranchFilterSelect = ({
  value = "all",
  onChange,
  size = "sm",
  className = "w-full",
  triggerClassName,
  placeholder = "All Branches",
  label,
  showLabel = false,
  isSearchable = true,
  disabled = false,
}) => {
  const { currentLevel } = useNavigationPipeline();
  const { currentCompany } = useCompany();
  const { branches = [] } = useBranch();

  const isCompanyLevel = currentLevel === PIPELINE_LEVELS.COMPANY || currentLevel === "company";

  const options = useMemo(() => {
    const list = [
      {
        value: "all",
        label: "All Branches",
        description: currentCompany?.name ? `Across ${currentCompany.name}` : "Company-wide",
        icon: Store,
      },
      ...(branches || []).map((b) => ({
        value: b._id,
        label: b.name || "Branch",
        description: b.branchCode ? `[${b.branchCode}]` : (b.address?.city || ""),
        icon: Building2,
      })),
    ];
    return list;
  }, [branches, currentCompany?.name]);

  // If user is at branch level, render NOTHING to preserve branch UI completely
  if (!isCompanyLevel) {
    return null;
  }

  return (
    <div className={cn("inline-flex flex-col min-w-0 w-full", className)}>
      {showLabel && (
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1">
          <GitBranch className="size-3 text-primary" />
          {label || "Branch Scope"}
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
 * BranchBadge - Helper component to display branch identity badge on table rows
 * when viewed from Company level.
 */
export const BranchBadge = ({ branch, branchId, branchName, branchCode, className }) => {
  const resolvedName =
    branchName ||
    branch?.name ||
    (typeof branchId === "object" ? branchId?.name : null);

  const resolvedCode =
    branchCode ||
    branch?.branchCode ||
    (typeof branchId === "object" ? branchId?.branchCode : null);

  if (!resolvedName && !resolvedCode) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20",
        className
      )}
      title={resolvedCode ? `${resolvedName} (${resolvedCode})` : resolvedName}
    >
      <Building2 className="size-3 shrink-0 opacity-70" />
      <span className="truncate max-w-[120px]">{resolvedName || resolvedCode}</span>
      {resolvedCode && resolvedName && (
        <span className="text-[9px] opacity-75 font-mono">[{resolvedCode}]</span>
      )}
    </span>
  );
};

export default BranchFilterSelect;
