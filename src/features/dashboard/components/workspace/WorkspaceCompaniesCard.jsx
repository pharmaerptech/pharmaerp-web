// src/features/dashboard/components/workspace/WorkspaceCompaniesCard.jsx

import { useNavigate } from "react-router-dom";
import {
  Building2,
  ArrowRight,
  ExternalLink,
  GitBranch,
  MapPin,
  Mail,
  Phone,
  FileText,
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
import { useNavigationPipeline } from "@/contexts/NavigationPipelineContext";
import usePermission from "@/hooks/usePermission";

export const WorkspaceCompaniesCard = ({ companies = [], isLoading = false, className }) => {
  const navigate = useNavigate();
  const { enterCompany } = useNavigationPipeline();
  const { canWorkLevel } = usePermission();
  const canEnterCompany = canWorkLevel("company");

  return (
    <UICard
      variant="default"
      padding="none"
      className="h-fit rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border/70 flex items-center justify-between gap-3 bg-surface">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 flex items-center justify-center shrink-0">
            <Building2 className="size-4.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-text tracking-tight flex items-center gap-2 truncate">
              Registered Companies
              <UIBadge variant="soft" color="purple" size="xs">
                {companies.length}
              </UIBadge>
            </h3>
            <p className="text-xs text-text-muted mt-0.5 truncate">
              Distinct legal entities & licensing books
            </p>
          </div>
        </div>

        <UIButton
          variant="ghost"
          size="xs"
          onClick={() => navigate(ROUTES.COMPANIES)}
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
              <UISkeleton className="h-3 w-60" />
            </div>
            <div className="p-4 rounded-xl border border-border/70 bg-surface-alt/30 space-y-2">
              <UISkeleton className="h-4 w-48" />
              <UISkeleton className="h-3 w-52" />
            </div>
          </div>
        ) : companies.length === 0 ? (
          <UIEmptyState
            title="No Companies Registered"
            description="Add your first legal company entity to begin setting up your pharmacy branches."
            icon={<Building2 className="size-6 text-purple-600 dark:text-purple-400" />}
            actionText="Add Company"
            onAction={() => navigate(ROUTES.CREATE_COMPANY)}
            className="py-8"
          />
        ) : (
          <div className="space-y-3 max-h-[460px] overflow-y-auto no-scrollbar">
            {companies.map((comp) => {
              const activeLicenses = [
                comp.retailLicense && `Retail: ${comp.retailLicense}`,
                comp.wholesaleLicense && `Wholesale: ${comp.wholesaleLicense}`,
                comp.fssaiNumber && `FSSAI: ${comp.fssaiNumber}`,
              ].filter(Boolean);

              return (
                <div
                  key={comp.id}
                  className="p-3.5 rounded-xl border border-border/80 bg-surface-alt/40 hover:bg-surface-alt/80 hover:border-border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                >
                  {/* Left: Company Details */}
                  <div className="min-w-0 space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-text truncate">
                        {comp.name}
                      </span>
                      <UIBadge variant="soft" color="purple" size="xs" label={comp.code} className="shrink-0" />
                      <UIBadge
                        variant="soft"
                        color={comp.status === "ACTIVE" ? "success" : "neutral"}
                        size="xs"
                        label={comp.status}
                        className="shrink-0"
                      />
                    </div>

                    {/* Legal metadata */}
                    <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-text-muted">
                      {comp.gstin && (
                        <span>
                          GSTIN: <span className="font-mono text-text font-medium">{comp.gstin}</span>
                        </span>
                      )}
                      {comp.pan && comp.pan !== "N/A" && (
                        <span>
                          PAN: <span className="font-mono text-text font-medium">{comp.pan}</span>
                        </span>
                      )}
                      {comp.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3 text-text-muted/80 shrink-0" />
                          <span className="text-text font-medium">{comp.city}{comp.state ? `, ${comp.state}` : ""}</span>
                        </span>
                      )}
                    </div>

                    {/* Contact details if available */}
                    <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[11.5px] text-text-muted">
                      {comp.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="size-3 text-text-muted/80 shrink-0" />
                          <span>{comp.email}</span>
                        </span>
                      )}
                      {comp.phone && (
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Phone className="size-3 text-text-muted/80 shrink-0" />
                          <span>{comp.phone}</span>
                        </span>
                      )}
                      {comp.createdAtFormatted && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3 text-text-muted/80 shrink-0" />
                          <span>Registered: {comp.createdAtFormatted}</span>
                        </span>
                      )}
                    </div>

                    {/* Drug Licenses info */}
                    {activeLicenses.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-text-muted/90 pt-0.5">
                        <FileText className="size-3 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span className="font-medium text-text-secondary">Licenses:</span>
                        <span className="truncate">{activeLicenses.join(" • ")}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Branch Count & Direct Link */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 self-stretch sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-medium text-text">
                      <GitBranch className="size-3.5 text-primary" />
                      <span>
                        <strong className="font-bold text-text">{comp.branchCount}</strong> {comp.branchCount === 1 ? "Branch" : "Branches"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {canEnterCompany && (
                        <UIButton
                          variant="primary"
                          size="xs"
                          onClick={() => enterCompany({ _id: comp.id, name: comp.name })}
                          className="gap-1 text-xs font-semibold shadow-2xs"
                        >
                          <span>Enter Company</span>
                          <ArrowRight className="size-3" />
                        </UIButton>
                      )}

                      <UIButton
                        variant="ghost"
                        size="xs"
                        onClick={() => navigate(`/companies/${comp.id}`)}
                        className="gap-1 text-xs text-text-muted hover:text-text"
                        title="Company Settings"
                      >
                        <ExternalLink className="size-3" />
                      </UIButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </UICard>
  );
};

export default WorkspaceCompaniesCard;