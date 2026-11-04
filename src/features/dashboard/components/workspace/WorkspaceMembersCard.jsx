// src/features/dashboard/components/workspace/WorkspaceMembersCard.jsx

import { useNavigate } from "react-router-dom";
import { Users, ArrowRight, ExternalLink, Crown, Mail, Phone, Clock } from "lucide-react";
import {
  UICard,
  UIBadge,
  UIButton,
  UIEmptyState,
  UISkeleton,
} from "@/components/ui";
import { ROUTES } from "@/constants";

export const WorkspaceMembersCard = ({ members = [], isLoading = false, className }) => {
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <UICard
      variant="default"
      padding="none"
      className="h-fit rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border/70 flex items-center justify-between gap-3 bg-surface">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200/50 flex items-center justify-center shrink-0">
            <Users className="size-4.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-text tracking-tight flex items-center gap-2 truncate">
              Workspace Team & Staff
              <UIBadge variant="soft" color="info" size="xs">
                {members.length}
              </UIBadge>
            </h3>
            <p className="text-xs text-text-muted mt-0.5 truncate">
              Active staff members & assigned permissions
            </p>
          </div>
        </div>

        <UIButton
          variant="ghost"
          size="xs"
          onClick={() => navigate(ROUTES.WORKSPACE_MEMBERS)}
          className="text-primary hover:text-primary-hover gap-1 font-semibold"
        >
          Manage Team
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
        ) : members.length === 0 ? (
          <UIEmptyState
            title="No Staff Members Found"
            description="Invite pharmacists, cashiers, and managers to join your workspace."
            icon={<Users className="size-6 text-sky-600 dark:text-sky-400" />}
            actionText="Invite Member"
            onAction={() => navigate(ROUTES.INVITE_WORKSPACE_MEMBER || ROUTES.WORKSPACE_MEMBERS)}
            className="py-8"
          />
        ) : (
          <div className="space-y-3 max-h-[460px] overflow-y-auto no-scrollbar">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border border-border/80 bg-surface-alt/40 hover:bg-surface-alt/80 hover:border-border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Member Identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                    {getInitials(m.name)}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-text truncate">
                        {m.name}
                      </span>
                      {m.isOwner && (
                        <UIBadge
                          variant="soft"
                          color="warning"
                          size="xs"
                          icon={<Crown className="size-2.5 fill-warning text-warning" />}
                          label="Owner"
                          className="shrink-0"
                        />
                      )}
                      <UIBadge
                        variant="soft"
                        color="primary"
                        size="xs"
                        label={m.roleName}
                        className="shrink-0"
                      />
                      <UIBadge
                        variant="soft"
                        color={m.status === "Active" ? "success" : "neutral"}
                        size="xs"
                        label={m.status}
                        className="shrink-0"
                      />
                    </div>

                    <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-text-muted">
                      {m.email && m.email !== "N/A" && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="size-3 text-text-muted/80 shrink-0" />
                          <span className="truncate">{m.email}</span>
                        </span>
                      )}
                      {m.phone && (
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Phone className="size-3 text-text-muted/80 shrink-0" />
                          <span>{m.phone}</span>
                        </span>
                      )}
                      {m.lastActiveFormatted && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3 text-text-muted/80 shrink-0" />
                          <span>Active: {m.lastActiveFormatted}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Direct Member Link */}
                <div className="shrink-0 self-end sm:self-center">
                  <UIButton
                    variant="outline"
                    size="xs"
                    onClick={() => navigate(ROUTES.WORKSPACE_MEMBERS)}
                    className="gap-1 text-xs"
                  >
                    <span>Profile</span>
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

export default WorkspaceMembersCard;