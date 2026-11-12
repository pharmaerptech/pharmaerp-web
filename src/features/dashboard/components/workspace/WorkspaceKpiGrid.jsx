// src/features/dashboard/components/workspace/WorkspaceKpiGrid.jsx

import {
  Building2,
  Store,
  Users,
  ShieldCheck,
  Layers,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UIStatCard } from "@/components/ui";
import { ROUTES } from "@/constants";

export const WorkspaceKpiGrid = ({ kpis, isLoading = false }) => {
  const navigate = useNavigate();

  const totalCompanies = kpis?.totalCompanies ?? 0;
  const totalBranches = kpis?.totalBranches ?? 0;
  const totalStaff = kpis?.totalStaff ?? 0;
  const totalRoles = kpis?.totalRoles ?? 0;

  const cards = [
    {
      id: "companies",
      title: "Registered Companies",
      value: `${totalCompanies} ${totalCompanies === 1 ? "Company" : "Companies"}`,
      subtitle: "Corporate legal entities",
      icon: Building2,
      color: "purple",
      route: ROUTES.COMPANIES,
    },
    {
      id: "branches",
      title: "Branch Network",
      value: `${totalBranches} ${totalBranches === 1 ? "Branch" : "Branches"}`,
      subtitle: "Operating dispensaries",
      icon: Store,
      color: "teal",
      route: null,
    },
    {
      id: "staff",
      title: "Workspace Staff",
      value: `${totalStaff} ${totalStaff === 1 ? "Member" : "Members"}`,
      subtitle: "Assigned staff team",
      icon: Users,
      color: "blue",
      route: ROUTES.WORKSPACE_MEMBERS,
    },
    {
      id: "roles",
      title: "Access Roles",
      value: `${totalRoles} ${totalRoles === 1 ? "Role" : "Roles"}`,
      subtitle: "RBAC security roles",
      icon: ShieldCheck,
      color: "warning",
      route: ROUTES.ROLES,
    },
    {
      id: "plan-tier",
      title: "Subscription Tier",
      value: kpis?.planName || "Enterprise Plan",
      subtitle: `${kpis?.planTier || "PRO"} Tier active`,
      icon: Layers,
      color: "primary",
      route: ROUTES.UPGRADE_PLAN,
    },
    {
      id: "plan-validity",
      title: "Plan Validity",
      value: `${kpis?.daysLeft ?? 365} Days`,
      subtitle: `Till ${kpis?.validTill || "Continuous"}`,
      icon: Sparkles,
      color: "success",
      route: ROUTES.UPGRADE_PLAN,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <UIStatCard
            key={card.id}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={<Icon />}
            color={card.color}
            density="compact"
            variant={card.route ? "interactive" : "default"}
            isLoading={isLoading}
            onClick={card.route ? () => navigate(card.route) : undefined}
          />
        );
      })}
    </div>
  );
};

export default WorkspaceKpiGrid;
