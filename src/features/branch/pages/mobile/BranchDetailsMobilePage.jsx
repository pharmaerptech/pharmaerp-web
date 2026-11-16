// src/features/branch/pages/mobile/BranchDetailsMobilePage.jsx

import { memo } from "react";
import {
  Calendar,
  Edit3,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Scale,
  Store,
  Trash2,
  Stethoscope,
} from "lucide-react";

import {
  UIAlert,
  UIBadge,
  UIButton,
} from "@/components/ui";

const formatBranchType = (type) => {
  if (!type) return "Retail Pharmacy";
  return String(type)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const BranchDetailsMobileSkeleton = () => (
  <div className="w-full min-h-screen bg-bg pb-12 pt-1 px-3 font-sans select-none animate-pulse space-y-3">
    {/* Hero Card Skeleton */}
    <div className="bg-surface border border-border/90 rounded-2xl p-4 shadow-2xs space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="size-13 rounded-xl border border-border/80 bg-surface-alt/70 shrink-0 flex items-center justify-center">
            <Store className="size-6 text-text-muted/20" />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-surface-alt rounded" />
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="h-4 w-14 bg-surface-alt/80 rounded" />
              <div className="h-4 w-16 bg-primary/10 rounded-full" />
              <div className="h-4 w-12 bg-surface-alt/80 rounded-full" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="h-8 w-14 bg-surface-alt rounded-lg" />
          <div className="h-8 w-14 bg-surface-alt/40 rounded-lg" />
        </div>
      </div>

      <div className="pt-2.5 border-t border-border/60 space-y-2">
        <div className="h-3 w-48 bg-surface-alt/70 rounded" />
        <div className="h-3 w-36 bg-surface-alt/70 rounded" />
        <div className="h-3 w-40 bg-surface-alt/70 rounded" />
      </div>
    </div>

    {/* Section 1: Pharmacist Skeleton */}
    <div className="bg-surface border border-border/90 rounded-2xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center gap-2 pb-2.5 border-b border-border/60">
        <div className="size-6 rounded bg-surface-alt/80 shrink-0" />
        <div className="h-3.5 w-36 bg-surface-alt rounded" />
      </div>
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-alt/40">
        <div className="size-8 rounded-lg bg-primary/20 shrink-0" />
        <div className="space-y-1 flex-1">
          <div className="h-3 w-28 bg-surface-alt rounded" />
          <div className="h-2.5 w-36 bg-surface-alt/60 rounded" />
        </div>
      </div>
      <div className="space-y-2 text-xs">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between py-1">
            <div className="h-3 w-20 bg-surface-alt/60 rounded" />
            <div className="h-3 w-28 bg-surface-alt rounded" />
          </div>
        ))}
      </div>
    </div>

    {/* Section 2: Statutory Licensing Skeleton */}
    <div className="bg-surface border border-border/90 rounded-2xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded bg-surface-alt/80 shrink-0" />
          <div className="h-3.5 w-36 bg-surface-alt rounded" />
        </div>
        <div className="h-4 w-12 bg-emerald-500/10 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/50 space-y-1.5">
            <div className="h-2 w-16 bg-surface-alt/60 rounded" />
            <div className="h-3 w-20 bg-surface-alt rounded" />
          </div>
        ))}
      </div>
    </div>

    {/* Section 3: Registered Facility Skeleton */}
    <div className="bg-surface border border-border/90 rounded-2xl p-4 shadow-2xs space-y-2.5">
      <div className="flex items-center gap-2 pb-2 border-b border-border/60">
        <div className="size-6 rounded bg-surface-alt/80 shrink-0" />
        <div className="h-3.5 w-36 bg-surface-alt rounded" />
      </div>
      <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/50 space-y-2">
        <div className="h-3 w-full bg-surface-alt rounded" />
        <div className="h-3 w-2/3 bg-surface-alt/70 rounded" />
      </div>
    </div>
  </div>
);

const BranchDetailsMobilePage = memo(
  ({
    branch,
    isLoading = false,
    hasError = false,
    error,
    handleBack,
    handleEdit,
    handleDelete,
    handleRefresh,
  }) => {
    if (hasError && !branch) {
      return (
        <div className="w-full min-h-screen bg-bg p-4 space-y-4 font-sans">
          <UIAlert
            intent="danger"
            title="Location Extraction Failure"
            description={error || "The server could not process the branch identifier."}
          />
          <div className="flex gap-2">
            <UIButton variant="outline" size="sm" onClick={handleBack} className="flex-1">
              Back to Branches
            </UIButton>
            <UIButton variant="primary" size="sm" onClick={handleRefresh} className="flex-1">
              Retry
            </UIButton>
          </div>
        </div>
      );
    }

    if (!branch || isLoading) {
      return <BranchDetailsMobileSkeleton />;
    }

    const {
      name,
      branchCode,
      type,
      isPrimary,
      status,
      email,
      phones = {},
      address = {},
      license = {},
      pharmacist = {},
      emergencyContact = {},
      createdAt,
    } = branch;

    const displayType = formatBranchType(type);
    const fullAddress = [
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.district,
      address.state ? `${address.state} - ${address.pincode || ""}` : address.pincode,
      address.country || "India",
    ]
      .filter(Boolean)
      .join(", ");

    return (
      <div className="w-full min-h-screen bg-bg pb-12 pt-1 px-3 font-sans select-none text-text space-y-3">
        {/* Mobile Hero Card with Integrated Actions */}
        <div className="bg-surface border border-border/90 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="size-13 rounded-xl border border-border/80 bg-primary/10 text-primary flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                <Store className="size-6" />
              </div>

              <div className="min-w-0">
                <h1 className="text-base font-bold text-text truncate">
                  {name || "Unnamed Branch"}
                </h1>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {branchCode && (
                    <UIBadge variant="outline" className="font-mono text-[10px] px-1.5 py-0.2">
                      {branchCode}
                    </UIBadge>
                  )}
                  <UIBadge variant="primary" className="text-[10px] px-1.5 py-0.2">
                    {displayType}
                  </UIBadge>
                  {isPrimary && (
                    <UIBadge variant="outline" className="text-[10px] px-1.5 py-0.2 border-primary/30 text-primary">
                      Primary
                    </UIBadge>
                  )}
                  <UIBadge
                    variant={status === "active" ? "success" : "neutral"}
                    className="capitalize text-[10px] px-1.5 py-0.2"
                  >
                    {status || "Active"}
                  </UIBadge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <UIButton
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEdit}
                startIcon={<Edit3 className="size-3.5" />}
                className="h-8 px-2 text-xs font-semibold cursor-pointer"
              >
                Edit
              </UIButton>
              {handleDelete && (
                <UIButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  startIcon={<Trash2 className="size-3.5 text-error" />}
                  className="h-8 px-2 text-xs text-error hover:bg-error/10 cursor-pointer"
                >
                  Delete
                </UIButton>
              )}
            </div>
          </div>

          {/* Quick contact list */}
          <div className="pt-2.5 border-t border-border/60 space-y-1.5 text-xs text-text-muted">
            {email && (
              <div className="flex items-center gap-2 truncate">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {phones.mobile && (
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0" />
                <span>+91 {phones.mobile}</span>
              </div>
            )}
            {address.city && address.state && (
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 shrink-0" />
                <span>{address.city}, {address.state}</span>
              </div>
            )}
            {createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="size-3.5 shrink-0" />
                <span>Registered {formatDate(createdAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 1: Pharmacist Leadership Card */}
        <div className="bg-surface border border-border/90 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-border/60">
            <Stethoscope className="size-4 text-primary" />
            <h2 className="text-xs font-bold text-text uppercase tracking-wider">
              Pharmacist In-Charge
            </h2>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-alt/40 border border-border/40">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0">
              {pharmacist.name ? pharmacist.name.charAt(0).toUpperCase() : "P"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-text truncate">
                {pharmacist.name || "Unassigned"}
              </p>
              <p className="text-[11px] text-text-muted truncate">
                Registered Pharmacist (RPh)
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/40 text-xs">
            <div className="py-1.5 flex justify-between">
              <span className="text-text-muted">Council Reg</span>
              <span className="font-mono font-bold text-text">
                {pharmacist.registrationNumber || "-"}
              </span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-text-muted">Direct Mobile</span>
              <span className="font-semibold text-text font-mono">
                {pharmacist.mobile ? `+91 ${pharmacist.mobile}` : "-"}
              </span>
            </div>
            <div className="py-1.5 flex justify-between">
              <span className="text-text-muted">Emergency Dispatch</span>
              <span className="font-semibold text-text truncate max-w-[170px]">
                {emergencyContact.name
                  ? `${emergencyContact.name} (${emergencyContact.relationship || "Contact"})`
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Statutory Licensing Matrix */}
        <div className="bg-surface border border-border/90 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Scale className="size-4 text-primary" />
              <h2 className="text-xs font-bold text-text uppercase tracking-wider">
                Statutory Licenses
              </h2>
            </div>
            <UIBadge variant="success" className="text-[10px] px-1.5 py-0.2">
              Active
            </UIBadge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/50 space-y-1">
              <span className="text-[10px] text-text-muted block">Drug License</span>
              <span className="font-mono font-bold text-text block truncate">
                {license.drugLicenseNumber || "Form 20/21"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/50 space-y-1">
              <span className="text-[10px] text-text-muted block">Classification</span>
              <span className="font-semibold text-text block truncate">
                {license.drugLicenseType || "Retail Dispensing"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/50 space-y-1">
              <span className="text-[10px] text-text-muted block">FSSAI Safety</span>
              <span className="font-mono font-bold text-text block truncate">
                {license.fssaiNumber || "Not Registered"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/50 space-y-1">
              <span className="text-[10px] text-text-muted block">Validity</span>
              <span className="font-mono font-semibold text-text block truncate">
                {license.expiresAt ? formatDate(license.expiresAt) : "Active"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Registered Facility Location */}
        <div className="bg-surface border border-border/90 rounded-2xl p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <MapPin className="size-4 text-primary" />
            <h2 className="text-xs font-bold text-text uppercase tracking-wider">
              Facility Address
            </h2>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/50 space-y-2">
            <div className="flex items-start gap-2 text-xs">
              <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
              <p className="font-medium text-text leading-relaxed">
                {fullAddress || "Physical address not recorded"}
              </p>
            </div>
            {address.googleMapLocation && (
              <a
                href={address.googleMapLocation.startsWith("http") ? address.googleMapLocation : `https://${address.googleMapLocation}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline pt-1"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  },
);

BranchDetailsMobilePage.displayName = "BranchDetailsMobilePage";

export default BranchDetailsMobilePage;
