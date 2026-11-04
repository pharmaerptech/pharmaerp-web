// src/features/dashboard/components/workspace/WorkspaceBranchesCard.jsx

import { useNavigate } from "react-router-dom";
import {
  Store,
  ArrowRight,
  ExternalLink,
  MapPin,
  Phone,
  UserCheck,
  Calendar,
} from "lucide-react";
import {
  UICard,
  UIBadge,
  UIButton,
  UIEmptyState,
  UISkeleton,
} from "@/components/ui";
import { ROUTES } from "@/constants";

export const WorkspaceBranchesCard = ({ branches = [], isLoading = false, className }) => {
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
          <div className="size-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/50 flex items-center justify-center shrink-0">
            <Store className="size-4.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-text tracking-tight flex items-center gap-2 truncate">
              Branch Network
              <UIBadge variant="soft" color="primary" size="xs">
                {branches.length}
              </UIBadge>
            </h3>
            <p className="text-xs text-text-muted mt-0.5 truncate">
              Operating physical dispensaries & warehouses
            </p>
          </div>
        </div>

        <UIButton
          variant="ghost"
          size="xs"
          onClick={() => navigate(ROUTES.BRANCHES)}
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
              <UISkeleton className="h-3 w-50" />
            </div>
          </div>
        ) : branches.length === 0 ? (
          <UIEmptyState
            title="No Branches Configured"
            description="Create retail counters or pharmacy store branches under your registered legal companies."
            icon={<Store className="size-6 text-teal-600 dark:text-teal-400" />}
            actionText="Add Branch"
            onAction={() => navigate(ROUTES.CREATE_BRANCH)}
            className="py-8"
          />
        ) : (
          <div className="space-y-3 max-h-[460px] overflow-y-auto no-scrollbar">
            {branches.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl border border-border/80 bg-surface-alt/40 hover:bg-surface-alt/80 hover:border-border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                {/* Left: Branch Info */}
                <div className="min-w-0 space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-text truncate">
                      {b.name}
                    </span>
                    <UIBadge variant="outline" color="neutral" size="xs" label={b.code} className="shrink-0" />
                    <UIBadge variant="soft" color="purple" size="xs" label={b.companyName} className="shrink-0" />
                    <UIBadge
                      variant="soft"
                      color={b.status === "ACTIVE" ? "success" : "neutral"}
                      size="xs"
                      label={b.status}
                      className="shrink-0"
                    />
                  </div>

                  {/* Branch metadata */}
                  <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-text-muted">
                    {b.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3 text-text-muted/80 shrink-0" />
                        <span>{b.city}{b.state ? `, ${b.state}` : ""}</span>
                      </span>
                    )}
                    {b.manager && (
                      <span className="inline-flex items-center gap-1">
                        <UserCheck className="size-3 text-text-muted/80 shrink-0" />
                        <span>Manager: <strong className="font-medium text-text">{b.manager}</strong></span>
                      </span>
                    )}
                    {b.phone && (
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Phone className="size-3 text-text-muted/80 shrink-0" />
                        <span>{b.phone}</span>
                      </span>
                    )}
                    {b.createdAtFormatted && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3 text-text-muted/80 shrink-0" />
                        <span>Configured: {b.createdAtFormatted}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Direct Manage Button */}
                <div className="shrink-0 self-end sm:self-center">
                  <UIButton
                    variant="outline"
                    size="xs"
                    onClick={() => navigate(`/branches/${b.id}`)}
                    className="gap-1 text-xs"
                  >
                    <span>Manage</span>
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

export default WorkspaceBranchesCard;