// src/features/dashboard/components/workspace/WorkspaceSubscriptionCard.jsx

import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck, Gauge, Calendar } from "lucide-react";
import {
  UICard,
  UIBadge,
  UIButton,
  UISkeleton,
} from "@/components/ui";
import { ROUTES } from "@/constants";

export const WorkspaceSubscriptionCard = ({ usageData, compliance, isLoading = false, className }) => {
  const navigate = useNavigate();

  const planName = usageData?.planName || "Enterprise Plan";
  const validTill = usageData?.validTill || "Continuous";
  const daysLeft = usageData?.daysLeft ?? 365;

  const companies = usageData?.companies || { used: 0, max: 1, pct: 0 };
  const branches = usageData?.branches || { used: 0, max: 1, pct: 0 };
  const staffSeats = usageData?.staffSeats || { used: 0, max: 1, pct: 0 };

  const checklist = [
    {
      id: "org",
      label: "Organization Workspace Active",
      passed: compliance?.organizationProfile ?? true,
    },
    {
      id: "comp",
      label: "Legal Companies Registered",
      passed: compliance?.hasActiveCompany ?? (companies.used > 0),
    },
    {
      id: "branch",
      label: "Branch Network Linked",
      passed: compliance?.hasActiveBranch ?? (branches.used > 0),
    },
    {
      id: "staff",
      label: "Team Staff & Roles Assigned",
      passed: compliance?.hasStaffAssigned ?? (staffSeats.used > 0),
    },
  ];

  return (
    <UICard
      variant="default"
      padding="none"
      className="rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border/70 flex items-center justify-between gap-3 bg-surface">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 flex items-center justify-center shrink-0">
            <Sparkles className="size-4.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-text tracking-tight flex items-center gap-2 truncate">
              Subscription Quotas & Governance Health
              <UIBadge variant="soft" color="purple" size="xs">
                {planName}
              </UIBadge>
            </h3>
            <p className="text-xs text-text-muted mt-0.5 truncate flex items-center gap-1.5">
              <Calendar className="size-3 text-text-muted shrink-0" />
              <span>
                {daysLeft > 0 ? `${daysLeft} days remaining • Renews ${validTill}` : `Valid till ${validTill}`}
              </span>
            </p>
          </div>
        </div>

        <UIButton
          variant="outline"
          size="xs"
          onClick={() => navigate(ROUTES.UPGRADE_PLAN)}
          className="text-primary hover:text-primary-hover gap-1 font-semibold"
        >
          Manage Plan
          <ArrowRight className="size-3.5" />
        </UIButton>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <UISkeleton className="h-4 w-32" />
                <UISkeleton className="h-2 w-full rounded-full" />
              </div>
              <div className="space-y-2">
                <UISkeleton className="h-4 w-36" />
                <UISkeleton className="h-2 w-full rounded-full" />
              </div>
              <div className="space-y-2">
                <UISkeleton className="h-4 w-28" />
                <UISkeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
            <div className="space-y-3">
              <UISkeleton className="h-4 w-40" />
              <div className="grid grid-cols-2 gap-2">
                <UISkeleton className="h-10 rounded-lg" />
                <UISkeleton className="h-10 rounded-lg" />
                <UISkeleton className="h-10 rounded-lg" />
                <UISkeleton className="h-10 rounded-lg" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Resource Quota Meters (7 cols on large screens) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-text">
                <Gauge className="size-3.5 text-primary" />
                <span>Resource Allocation & Quota Thresholds</span>
              </div>

              <div className="space-y-3.5 bg-surface-alt/30 p-3.5 rounded-xl border border-border/60">
                {/* Companies Meter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text">Legal Companies</span>
                    <span className="font-mono text-text-muted">
                      <strong className="text-text font-bold">{companies.used}</strong> / {companies.max} ({companies.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border/40">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, companies.pct))}%` }}
                    />
                  </div>
                </div>

                {/* Branches Meter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text">Branches & Facilities</span>
                    <span className="font-mono text-text-muted">
                      <strong className="text-text font-bold">{branches.used}</strong> / {branches.max} ({branches.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border/40">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, branches.pct))}%` }}
                    />
                  </div>
                </div>

                {/* Staff Seats Meter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text">Staff & User Seats</span>
                    <span className="font-mono text-text-muted">
                      <strong className="text-text font-bold">{staffSeats.used}</strong> / {staffSeats.max} ({staffSeats.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border/40">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, staffSeats.pct))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Setup & Governance Compliance (5 cols on large screens) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-text">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-success" />
                  Workspace Setup Checklist
                </span>
                <UIBadge variant="soft" color="success" size="xs">
                  {compliance?.healthScore ?? 100}% Health
                </UIBadge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-alt/40 border border-border/60"
                  >
                    {item.passed ? (
                      <CheckCircle2 className="size-4 text-success shrink-0" />
                    ) : (
                      <AlertCircle className="size-4 text-warning shrink-0" />
                    )}
                    <span className={`text-[11.5px] truncate font-medium ${item.passed ? "text-text" : "text-text-muted"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </UICard>
  );
};

export default WorkspaceSubscriptionCard;