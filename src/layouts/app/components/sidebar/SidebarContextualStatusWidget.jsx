// src/layouts/app/components/sidebar/SidebarContextualStatusWidget.jsx

import { useLocation, useNavigate } from "react-router-dom";
import { Building2, Crown, Settings } from "lucide-react";
import { ROUTES } from "@/constants";
import useCompany from "@/features/company/hooks/useCompany";

export const SidebarContextualStatusWidget = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentCompany } = useCompany();

  if (collapsed) return null;

  const pathname = location.pathname;
  const isCompanyView = pathname === ROUTES.COMPANY_DASHBOARD || pathname.startsWith("/dashboard/company");
  const isWorkspaceView = pathname === ROUTES.WORKSPACE_DASHBOARD || pathname.startsWith("/dashboard/workspace");

  // 2. Company Dashboard Context Widget (Image 2)
  if (isCompanyView) {
    const companyName = currentCompany?.name || "Traveller Medico Pvt. Ltd.";
    const gstin = currentCompany?.gstin || "23ABCDE1234F1Z5";

    return (
      <div className="mx-2 mb-2 p-2.5 rounded-xl border border-border bg-surface-alt/60 text-xs shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 shrink-0">
            <Building2 className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-text truncate">
              {companyName}
            </div>
            <div className="text-[10px] text-text-muted font-mono truncate">
              GSTIN: {gstin}
            </div>
          </div>
        </div>

        <div className="pt-1.5 border-t border-border/60 space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Branches</span>
            <span className="font-mono font-medium text-text">5 / 8</span>
          </div>
          <div className="w-full h-1.5 bg-border/60 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "62.5%" }} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(ROUTES.SETTINGS)}
          className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-[11px] font-medium text-text transition-colors cursor-pointer shadow-2xs"
        >
          <Settings className="size-3 text-text-muted" />
          <span>Company Settings</span>
        </button>
      </div>
    );
  }

  // 3. Workspace Dashboard Context Widget (Image 3)
  if (isWorkspaceView) {
    return (
      <div className="mx-2 mb-2 p-2.5 rounded-xl border border-border bg-surface-alt/60 text-xs shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 shrink-0">
            <Crown className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Current Plan
            </div>
            <div className="text-xs font-semibold text-text">Growth Plan</div>
            <div className="text-[10px] text-text-muted">Valid till 15 Mar 2027</div>
          </div>
        </div>

        <div className="pt-1.5 border-t border-border/60 space-y-1.5 text-[11px]">
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-text-muted">Branches</span>
              <span className="font-mono text-text">8 / 15</span>
            </div>
            <div className="w-full h-1 bg-border/60 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "53%" }} />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-text-muted">Staff Seats</span>
              <span className="font-mono text-text">24 / 50</span>
            </div>
            <div className="w-full h-1 bg-border/60 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "48%" }} />
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-text-muted">Storage</span>
              <span className="font-mono text-text">62 / 200 GB</span>
            </div>
            <div className="w-full h-1 bg-border/60 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "31%" }} />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(ROUTES.SUBSCRIPTION || ROUTES.SETTINGS)}
          className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-950/40 text-[11px] font-semibold text-amber-700 dark:text-amber-300 transition-colors cursor-pointer shadow-2xs"
        >
          <Crown className="size-3 text-amber-500" />
          <span>Upgrade Plan</span>
        </button>
      </div>
    );
  }

  return null;
};
