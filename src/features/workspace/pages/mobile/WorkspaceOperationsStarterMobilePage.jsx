// src/features/workspace/pages/mobile/WorkspaceOperationsStarterMobilePage.jsx

import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  ShieldCheck,
  Boxes,
  Plus,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

import { ROUTES } from "@/constants";
import { useNavigationPipeline, WORK_MODES } from "@/contexts";
import usePermission from "@/hooks/usePermission";

export const WorkspaceOperationsStarterMobilePage = ({
  companies = [],
  membersCount = 0,
  productsCount = 0,
  subscription = {},
}) => {
  const navigate = useNavigate();
  const { enterCompany } = useNavigationPipeline();
  const { can, isOwner } = usePermission();

  const canCreateCompany = isOwner || can("company:create");
  const canInviteMember = isOwner || can("workspace-member:create");

  // Exactly 4 high-frequency operations
  const CORE_OPERATIONS = [
    {
      id: "company-directory",
      title: "Companies Directory",
      subtitle: "Legal Entities & Operations",
      icon: Building2,
      color: "blue",
      path: ROUTES.COMPANIES,
    },
    {
      id: "staff-directory",
      title: "Staff & Team Members",
      subtitle: "Organization Roster & Invites",
      icon: Users,
      color: "emerald",
      path: ROUTES.WORKSPACE_MEMBERS,
    },
    {
      id: "workspace-products",
      title: "Custom Products Master",
      subtitle: "Global Formulations Catalog",
      icon: Boxes,
      color: "amber",
      path: ROUTES.WORKSPACE_PRODUCTS,
    },
    {
      id: "roles-permissions",
      title: "Roles & Access Control",
      subtitle: "RBAC Security Matrix",
      icon: ShieldCheck,
      color: "purple",
      path: ROUTES.ROLES,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-3 p-2.5 font-sans pb-24 select-none">
      {/* ── 1. 2x2 Stat Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-surface border border-border shadow-2xs">
          <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mb-1">
            <Building2 className="size-3.5" />
          </div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">Companies</span>
          <span className="text-base font-bold font-mono text-text">{companies.length}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-surface border border-border shadow-2xs">
          <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1">
            <Users className="size-3.5" />
          </div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">Staff</span>
          <span className="text-base font-bold font-mono text-text">{membersCount || 1}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-surface border border-border shadow-2xs">
          <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center mb-1">
            <Boxes className="size-3.5" />
          </div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">Products</span>
          <span className="text-base font-bold font-mono text-text">{productsCount}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-surface border border-border shadow-2xs">
          <div className="size-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center mb-1">
            <ShieldCheck className="size-3.5" />
          </div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">Plan</span>
          <span className="text-xs font-bold font-mono text-text truncate block">
            {subscription?.planName || "Enterprise"}
          </span>
        </div>
      </div>

      {/* ── 2. Quick Action Buttons ───────────────────────────── */}
      <div className="flex items-center gap-2">
        {canCreateCompany && (
          <button
            type="button"
            onClick={() => navigate(ROUTES.CREATE_COMPANY)}
            className="flex-1 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98]"
          >
            <Plus className="size-3.5" />
            <span>Add Company</span>
          </button>
        )}

        {canInviteMember && (
          <button
            type="button"
            onClick={() => navigate(ROUTES.INVITE_WORKSPACE_MEMBER)}
            className="flex-1 h-9 px-3 rounded-lg bg-surface border border-border text-text text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <Users className="size-3.5 text-text-muted" />
            <span>Invite Staff</span>
          </button>
        )}
      </div>

      {/* ── 3. Core Workspace Operations ──────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider px-0.5">
          Workspace Operations
        </span>

        {CORE_OPERATIONS.map((op) => {
          const Icon = op.icon;
          return (
            <div
              key={op.id}
              onClick={() => navigate(op.path)}
              className="p-3 rounded-xl bg-surface border border-border hover:border-primary/50 shadow-2xs flex items-center justify-between active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                    op.color === "blue"
                      ? "bg-blue-500/10 text-blue-600"
                      : op.color === "emerald"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : op.color === "amber"
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-purple-500/10 text-purple-600"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text">{op.title}</h4>
                  <p className="text-[10px] text-text-muted">{op.subtitle}</p>
                </div>
              </div>
              <ArrowRight className="size-3.5 text-text-muted" />
            </div>
          );
        })}
      </div>

      {/* ── 4. Registered Companies Jump List ──────────────────── */}
      {companies.length > 0 && (
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Companies & Entity Jump
            </span>
            <span className="text-[10px] text-text-muted">({companies.length})</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {companies.slice(0, 4).map((comp) => (
              <div
                key={comp._id || comp.id}
                className="p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-text truncate">{comp.name}</h5>
                  <span className="text-[10px] text-text-muted">{comp.code || "Company"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => enterCompany(comp, WORK_MODES.OPERATION)}
                  className="h-7 px-2.5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold flex items-center gap-1 shrink-0"
                >
                  <span>Enter</span>
                  <ArrowUpRight className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceOperationsStarterMobilePage;
