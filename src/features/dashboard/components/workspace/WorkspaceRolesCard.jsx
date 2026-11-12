// src/features/dashboard/components/workspace/WorkspaceRolesCard.jsx

import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, ExternalLink, Users } from "lucide-react";
import {
  UICard,
  UIBadge,
  UIButton,
  UIEmptyState,
  UISkeleton,
} from "@/components/ui";
import { ROUTES } from "@/constants";

export const WorkspaceRolesCard = ({ roles = [], isLoading = false }) => {
  const navigate = useNavigate();

  return (
    <UICard
      variant="default"
      padding="none"
      className="h-fit rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border/70 flex items-center justify-between gap-3 bg-surface">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-4.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-text tracking-tight flex items-center gap-2 truncate">
              Roles & Permissions
              <UIBadge variant="soft" color="warning" size="xs">
                {roles.length}
              </UIBadge>
            </h3>
            <p className="text-xs text-text-muted mt-0.5 truncate">
              RBAC access definitions & privilege boundaries
            </p>
          </div>
        </div>

        <UIButton
          variant="ghost"
          size="xs"
          onClick={() => navigate(ROUTES.ROLES)}
          className="text-primary hover:text-primary-hover gap-1 font-semibold"
        >
          View All
          <ArrowRight className="size-3.5" />
        </UIButton>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {isLoading ? (
          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-border/70 bg-surface-alt/30 space-y-2">
              <UISkeleton className="h-4 w-40" />
              <UISkeleton className="h-3 w-56" />
            </div>
            <div className="p-4 rounded-xl border border-border/70 bg-surface-alt/30 space-y-2">
              <UISkeleton className="h-4 w-44" />
              <UISkeleton className="h-3 w-48" />
            </div>
          </div>
        ) : roles.length === 0 ? (
          <UIEmptyState
            title="No Roles Configured"
            description="Define roles with fine-grained permissions for your workspace members."
            icon={<ShieldCheck className="size-6 text-amber-600 dark:text-amber-400" />}
            actionText="Create Role"
            onAction={() => navigate(ROUTES.ROLES)}
            className="py-8"
          />
        ) : (
          <div className="space-y-3 max-h-[460px] overflow-y-auto no-scrollbar">
            {roles.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl border border-border/80 bg-surface-alt/40 hover:bg-surface-alt/80 hover:border-border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Role Info */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-text truncate">
                      {r.name}
                    </span>
                    <UIBadge
                      variant="soft"
                      color={r.isSystem ? "neutral" : "primary"}
                      size="xs"
                      label={r.isSystem ? "System Role" : "Custom Role"}
                      className="shrink-0"
                    />
                    <UIBadge variant="outline" color="neutral" size="xs" label={r.code} className="shrink-0" />
                  </div>

                  <p className="text-xs text-text-muted line-clamp-1">
                    {r.description || "Configured workspace access role"}
                  </p>
                </div>

                {/* Right: Member Count & Manage Link */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-medium text-text">
                    <Users className="size-3.5 text-text-muted shrink-0" />
                    <span>
                      <strong className="font-bold text-text">{r.memberCount}</strong> {r.memberCount === 1 ? "Member" : "Members"}
                    </span>
                  </div>

                  <UIButton
                    variant="outline"
                    size="xs"
                    onClick={() => navigate(ROUTES.ROLES)}
                    className="gap-1 text-xs"
                  >
                    <span>Permissions</span>
                    <ExternalLink className="size-3" />
                  </UIButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UICard>
  );
};

export default WorkspaceRolesCard;