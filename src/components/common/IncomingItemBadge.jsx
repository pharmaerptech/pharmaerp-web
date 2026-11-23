// src/components/common/IncomingItemBadge.jsx

import React from "react";
import { Package, ArrowDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { UITooltip } from "@/components/ui";

/**
 * IncomingItemBadge
 * Renders the Box icon (📦) and origin branch details for items received from other branches/stores.
 */
export const IncomingItemBadge = ({
  isIncoming,
  sourceBranchName = "",
  sourceTransferOrderNo = "",
  compact = false,
  showLabel = true,
  className = "",
}) => {
  if (!isIncoming) return null;

  const tooltipContent = (
    <div className="text-xs space-y-0.5">
      <div className="font-semibold text-amber-300 flex items-center gap-1">
        <span>📦</span>
        <span>Incoming Inter-Branch Stock</span>
      </div>
      {sourceBranchName && (
        <div className="text-gray-200">
          Source: <span className="font-medium">{sourceBranchName}</span>
        </div>
      )}
      {sourceTransferOrderNo && (
        <div className="text-gray-400 text-[11px]">
          Ref: #{sourceTransferOrderNo}
        </div>
      )}
    </div>
  );

  const badgeElement = (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium transition-colors select-none",
        compact
          ? "px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
          : "px-2 py-0.5 rounded-md text-xs bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/25",
        className
      )}
    >
      <span className="text-sm leading-none" role="img" aria-label="Incoming Box">
        📦
      </span>
      {showLabel && (
        <span className="truncate max-w-[130px] font-semibold tracking-tight">
          {sourceBranchName ? `From: ${sourceBranchName}` : "Incoming"}
        </span>
      )}
    </span>
  );

  return (
    <UITooltip content={tooltipContent} position="top">
      {badgeElement}
    </UITooltip>
  );
};

export default IncomingItemBadge;

