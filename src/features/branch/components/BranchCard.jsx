// src/features/branch/components/BranchCard.jsx

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  GitBranch,
  Eye,
  Edit3,
  MoreHorizontal,
  Users,
  Trash2,
  Layers,
  Cpu,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  HeartPulse,
  Database,
} from "lucide-react";
import {
  UIDropdown,
  UIDropdownTrigger,
  UIDropdownMenu,
  UIDropdownItem,
  UIDropdownDivider,
  UIIconButton,
} from "@/components/ui";

const BRAND_PALETTES = [
  {
    bg: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-500/20",
    icon: GitBranch,
  },
  {
    bg: "from-blue-600 to-cyan-600",
    shadow: "shadow-blue-500/20",
    icon: TrendingUp,
  },
  {
    bg: "from-purple-600 to-indigo-600",
    shadow: "shadow-purple-500/20",
    icon: Layers,
  },
  {
    bg: "from-amber-500 to-orange-600",
    shadow: "shadow-orange-500/20",
    icon: Sparkles,
  },
  {
    bg: "from-teal-500 to-emerald-700",
    shadow: "shadow-teal-500/20",
    icon: HeartPulse,
  },
  {
    bg: "from-violet-600 to-fuchsia-600",
    shadow: "shadow-violet-500/20",
    icon: Cpu,
  },
  {
    bg: "from-slate-800 to-zinc-900",
    shadow: "shadow-slate-500/20",
    icon: ShieldCheck,
  },
  {
    bg: "from-blue-700 to-indigo-900",
    shadow: "shadow-indigo-500/20",
    icon: Database,
  },
];

const getBrandSignature = (name = "", type = "") => {
  const normalized = `${name}-${type}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % BRAND_PALETTES.length;
  return BRAND_PALETTES[index];
};

const formatMemberCount = (branch) => {
  const count = branch?.memberCount ?? branch?.staffCount ?? branch?.membersCount ?? 0;
  return `${count} ${count === 1 ? "Member" : "Members"}`;
};

const formatLocation = (branch) => {
  if (branch?.locationSummary) return branch.locationSummary;
  const parts = [
    branch?.address?.addressLine1 || branch?.addressLine1,
    branch?.address?.city || branch?.city,
    branch?.address?.state || branch?.state,
  ].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return branch?.address?.city || branch?.city || "India";
};

const formatLastInteraction = (branch) => {
  if (branch?.lastInteraction) return branch.lastInteraction;
  if (branch?.updatedAt) {
    const diffHours = Math.round(
      (Date.now() - new Date(branch.updatedAt).getTime()) / (1000 * 60 * 60)
    );
    if (diffHours <= 0) return "Just now";
    if (diffHours < 24) return `About ${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
  }
  return "About 2 hours ago";
};

export const BranchCard = ({
  branch,
  onView,
  onEdit,
  onViewEmployees,
  onDelete,
}) => {
  const brand = useMemo(
    () => getBrandSignature(branch?.displayName || branch?.name, branch?.type),
    [branch?.displayName, branch?.name, branch?.type]
  );

  const BrandIcon = brand.icon || GitBranch;
  const memberCountText = formatMemberCount(branch);
  const locationText = formatLocation(branch);
  const lastInteractionText = formatLastInteraction(branch);
  const branchSubtitle =
    branch?.displayCompany || branch?.companyName || branch?.type || "Retail Pharmacy";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      onClick={() => onView?.(branch)}
      className="group relative flex flex-col justify-between rounded-[16px] border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:border-border-strong hover:shadow-md cursor-pointer select-none"
    >
      {/* ── Top Header: Logo, Name, Subtitle, 3-Dots Menu ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br ${brand.bg} text-white shadow-md ${brand.shadow} transition-transform duration-200 group-hover:scale-105`}
          >
            <BrandIcon className="h-5 w-5 stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-text truncate tracking-tight group-hover:text-primary transition-colors">
              {branch.displayName || branch.name || "Untitled Branch"}
            </h3>
            <p className="text-[12.5px] font-medium text-text-muted truncate capitalize">
              {branchSubtitle}
            </p>
          </div>
        </div>

        {/* Action Menu (stops parent row click) */}
        <div onClick={(e) => e.stopPropagation()}>
          <UIDropdown align="right">
            <UIDropdownTrigger asChild>
              <UIIconButton
                variant="ghost"
                size="sm"
                aria-label={`Actions for ${branch.displayName || "branch"}`}
                className="text-text-muted hover:text-text hover:bg-surface-hover h-8 w-8 rounded-lg"
              >
                <MoreHorizontal className="h-4 w-4" />
              </UIIconButton>
            </UIDropdownTrigger>

            <UIDropdownMenu width="w-44">
              <UIDropdownItem
                icon={<Eye className="w-4 h-4" />}
                onClick={() => onView?.(branch)}
              >
                View Branch
              </UIDropdownItem>
              <UIDropdownItem
                icon={<Edit3 className="w-4 h-4" />}
                onClick={() => onEdit?.(branch)}
              >
                Edit Branch
              </UIDropdownItem>
              {onDelete && (
                <>
                  <UIDropdownDivider />
                  <UIDropdownItem
                    destructive
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => onDelete?.(branch)}
                  >
                    Delete Branch
                  </UIDropdownItem>
                </>
              )}
            </UIDropdownMenu>
          </UIDropdown>
        </div>
      </div>

      {/* ── Middle Divider ── */}
      <div className="my-4 h-[1px] w-full bg-border/60" />

      {/* ── 2x2 Information Grid ── */}
      <div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
        {/* Row 1, Col 1: Type */}
        <div className="min-w-0">
          <p className="text-[11.5px] font-medium text-text-muted">Branch Type</p>
          <p className="text-[13px] font-semibold text-text truncate mt-0.5 capitalize">
            {branch?.type || "Dispensary"}
          </p>
        </div>

        {/* Row 1, Col 2: Last Interaction */}
        <div className="min-w-0">
          <p className="text-[11.5px] font-medium text-text-muted">Last Interaction</p>
          <p className="text-[13px] font-semibold text-text truncate mt-0.5">
            {lastInteractionText}
          </p>
        </div>

        {/* Row 2, Col 1: Members (Interactive) */}
        <div className="min-w-0">
          <p className="text-[11.5px] font-medium text-text-muted">Members Access</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewEmployees?.(branch);
            }}
            title="Click to view team members with access to this branch"
            className="inline-flex items-center gap-1.5 mt-0.5 text-[13px] font-bold text-primary hover:text-primary-hover hover:underline transition-colors font-mono tabular-nums text-left cursor-pointer"
          >
            <Users className="size-3.5 shrink-0" />
            <span>{memberCountText}</span>
          </button>
        </div>

        {/* Row 2, Col 2: Location */}
        <div className="min-w-0">
          <p className="text-[11.5px] font-medium text-text-muted">Location</p>
          <p className="text-[13px] font-semibold text-text truncate mt-0.5" title={locationText}>
            {locationText}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default BranchCard;
