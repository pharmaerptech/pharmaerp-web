// src/features/workspace/pages/desktop/WorkspaceOperationsStarterDesktopPage.jsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  ShieldCheck,
  Boxes,
  Plus,
  ArrowRight,
  RefreshCw,
  ChevronRight,
  Layers,
  ArrowUpRight,
  Zap,
} from "lucide-react";

import { ROUTES } from "@/constants";
import { useNavigationPipeline, WORK_MODES } from "@/contexts";
import usePermission from "@/hooks/usePermission";

export const WorkspaceOperationsStarterDesktopPage = ({
  workspace = {},
  companies = [],
  membersCount = 0,
  productsCount = 0,
  subscription = {},
  isLoading = false,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const { enterCompany } = useNavigationPipeline();
  const { can, isOwner } = usePermission();

  const canCreateCompany = isOwner || can("company:create");
  const canInviteMember = isOwner || can("workspace-member:create");

  // Exactly 4 high-frequency operations for Workspace Level
  const CORE_OPERATIONS = useMemo(
    () => [
      {
        id: "company-directory",
        title: "Companies Directory",
        subtitle: "Enterprise Legal Entities",
        description: "Manage registered pharmaceutical companies, tax registrations, and jump directly into company operations.",
        icon: Building2,
        accent: "blue",
        badge: "Alt + C",
        path: ROUTES.COMPANIES,
        actionLabel: "Manage Companies",
        isPrimary: true,
      },
      {
        id: "staff-directory",
        title: "Staff & Team Members",
        subtitle: "Organization Roster & Invites",
        description: "Audit active operators, manage workspace invitations, and assign staff members to companies and branches.",
        icon: Users,
        accent: "emerald",
        badge: "Alt + U",
        path: ROUTES.WORKSPACE_MEMBERS,
        actionLabel: "View Staff",
        isPrimary: false,
      },
      {
        id: "workspace-products",
        title: "Custom Products Master",
        subtitle: "Global Formulation Catalog",
        description: "Centralized medicine formulations, packaging specifications, bulk CSV imports, and workspace items.",
        icon: Boxes,
        accent: "amber",
        badge: "Alt + I",
        path: ROUTES.WORKSPACE_PRODUCTS,
        actionLabel: "Manage Catalog",
        isPrimary: false,
      },
      {
        id: "roles-permissions",
        title: "Roles & Access Control",
        subtitle: "RBAC Security Matrix",
        description: "Define granular operational permissions, assign role profiles, and configure security access levels.",
        icon: ShieldCheck,
        accent: "purple",
        badge: "Alt + R",
        path: ROUTES.ROLES,
        actionLabel: "Configure Roles",
        isPrimary: false,
      },
    ],
    []
  );

  return (
    <div className="w-full min-h-full flex-1 flex flex-col pt-0 pb-6 px-2 sm:px-3 gap-3 text-text font-sans select-none">
      {/* ── 1. Top 4-Card KPI Stat Grid (shrink-0, per UI_STANDARDS.md) ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 shrink-0">
        {/* Card 1: Companies */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs h-[68px] sm:h-[72px]">
          <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Building2 className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block truncate">
              Registered Companies
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-text leading-tight">
                {companies.length}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Active Entities
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Staff & Members */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs h-[68px] sm:h-[72px]">
          <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Users className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block truncate">
              Team Staff & Members
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-text leading-tight">
                {membersCount || 1}
              </span>
              <span className="text-[10px] font-medium text-text-muted">
                Assigned Operators
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Custom Formulations */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs h-[68px] sm:h-[72px]">
          <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Boxes className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block truncate">
              Custom Products Master
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-text leading-tight">
                {productsCount}
              </span>
              <span className="text-[10px] font-medium text-text-muted">
                Catalog Formulations
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Plan & Subscription */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs h-[68px] sm:h-[72px]">
          <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block truncate">
              Subscription Plan
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-text leading-tight truncate">
                {subscription?.planName || "Enterprise"}
              </span>
              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                Active Tier
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Workspace Command Header (shrink-0, NO search bar or filters) ─────── */}
      <div className="shrink-0 flex items-center justify-between gap-3 bg-surface border border-border/90 rounded-xl px-3.5 py-2.5 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Layers className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-text truncate">
                {workspace?.name || "Workspace Operations"}
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20 hidden sm:inline-block">
                Organization Floor 1
              </span>
            </div>
            <p className="text-[11px] text-text-muted truncate mt-0.5">
              Organization governance, legal company management, staff onboarding, and global catalog
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {canCreateCompany && (
            <button
              type="button"
              onClick={() => navigate(ROUTES.CREATE_COMPANY)}
              className="h-8.5 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add Company</span>
            </button>
          )}

          {canInviteMember && (
            <button
              type="button"
              onClick={() => navigate(ROUTES.INVITE_WORKSPACE_MEMBER)}
              className="h-8.5 px-3 rounded-lg bg-surface border border-border text-text hover:bg-surface-alt text-xs font-medium flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Users className="size-3.5 text-text-muted" />
              <span className="hidden sm:inline">Invite Staff</span>
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="size-8.5 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text transition-all active:scale-[0.98] cursor-pointer"
              title="Refresh Workspace Data"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* ── 3. Focused Core Operations Launchpad (2x2 Grid) ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
        {CORE_OPERATIONS.map((op) => {
          const Icon = op.icon;
          const isBlue = op.accent === "blue";
          const isEmerald = op.accent === "emerald";
          const isAmber = op.accent === "amber";

          return (
            <div
              key={op.id}
              onClick={() => navigate(op.path)}
              className={`group relative flex flex-col justify-between p-4 rounded-xl bg-surface border transition-all cursor-pointer shadow-2xs hover:shadow-sm active:scale-[0.99] ${
                op.isPrimary
                  ? "border-blue-500/40 hover:border-blue-500/70 bg-gradient-to-br from-blue-500/[0.03] to-transparent"
                  : "border-border/90 hover:border-primary/50"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                        isBlue
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
                          : isEmerald
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                          : isAmber
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                          : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25"
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text group-hover:text-primary transition-colors flex items-center gap-2">
                        {op.title}
                        {op.isPrimary && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                            <Zap className="size-2.5" /> Core
                          </span>
                        )}
                      </h3>
                      <span className="text-[11px] font-medium text-text-muted">
                        {op.subtitle}
                      </span>
                    </div>
                  </div>

                  <kbd className="px-2 py-0.5 rounded-md bg-surface-alt border border-border text-[11px] font-mono font-medium text-text-muted">
                    {op.badge}
                  </kbd>
                </div>

                <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-3.5">
                  {op.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="text-xs font-semibold text-text group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <span>{op.actionLabel}</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="text-[10px] text-text-muted">Click to open</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 4. Registered Companies Quick Jump Section ─────────────────────────────── */}
      <div className="shrink-0 flex flex-col gap-2.5 p-3.5 rounded-xl bg-surface border border-border/90 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            <span className="text-xs font-bold text-text">Registered Companies & Entity Switcher</span>
            <span className="text-[10px] text-text-muted font-medium">
              ({companies.length} {companies.length === 1 ? "legal entity" : "legal entities"})
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.COMPANIES)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Manage All Companies</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        {companies.length === 0 ? (
          <div className="p-4 rounded-lg bg-surface-alt/60 border border-border/60 text-center">
            <p className="text-xs text-text-muted mb-2">No companies registered yet in this workspace.</p>
            {canCreateCompany && (
              <button
                type="button"
                onClick={() => navigate(ROUTES.CREATE_COMPANY)}
                className="h-7.5 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="size-3" />
                <span>Add First Company</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {companies.slice(0, 6).map((comp) => (
              <div
                key={comp._id || comp.id}
                className="p-3 rounded-xl bg-surface-alt/50 border border-border/80 hover:border-primary/40 flex items-center justify-between gap-2.5 transition-all group"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors">
                    {comp.name}
                  </h4>
                  <span className="text-[10px] text-text-muted truncate block">
                    {comp.code || "Company"} {comp.gstin ? `• GST: ${comp.gstin.slice(0, 8)}...` : ""}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => enterCompany(comp, WORK_MODES.OPERATION)}
                  className="h-7 px-2.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-semibold flex items-center gap-1 shrink-0 shadow-2xs active:scale-[0.98] cursor-pointer"
                  title="Enter this company in Operation Mode"
                >
                  <span>Enter</span>
                  <ArrowUpRight className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceOperationsStarterDesktopPage;
