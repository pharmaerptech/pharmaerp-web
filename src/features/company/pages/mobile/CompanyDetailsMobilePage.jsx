// src/features/company/pages/mobile/CompanyDetailsMobilePage.jsx

import { memo } from "react";
import {
  Building2,
  Calendar,
  Edit3,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Scale,
  Trash2,
  User,
} from "lucide-react";

import {
  UIAlert,
  UIBadge,
  UIButton,
} from "@/components/ui";

const formatCompanyType = (type) => {
  if (!type) return "Proprietorship";
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

const CompanyDetailsMobileSkeleton = () => (
  <div className="w-full min-h-screen bg-bg pb-12 pt-1 px-3 font-sans select-none animate-pulse space-y-3">
    {/* Hero Card Skeleton */}
    <div className="bg-surface border border-border/90 rounded-2xl p-4 shadow-2xs space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="size-13 rounded-xl border border-border/80 bg-surface-alt/70 shrink-0 flex items-center justify-center">
            <Building2 className="size-6 text-text-muted/20" />
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

    {/* Section 1: Ownership Skeleton */}
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

    {/* Section 3: Tax Identifiers Skeleton */}
    <div className="bg-surface border border-border/90 rounded-2xl p-4 shadow-2xs space-y-3">
      <div className="flex items-center gap-2 pb-2.5 border-b border-border/60">
        <div className="size-6 rounded bg-surface-alt/80 shrink-0" />
        <div className="h-3.5 w-32 bg-surface-alt rounded" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/50 space-y-1.5">
          <div className="h-2 w-14 bg-surface-alt/60 rounded" />
          <div className="h-3 w-24 bg-surface-alt rounded" />
        </div>
        <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/50 space-y-1.5">
          <div className="h-2 w-14 bg-surface-alt/60 rounded" />
          <div className="h-3 w-20 bg-surface-alt rounded" />
        </div>
      </div>
    </div>

    {/* Section 4: Registered Office Skeleton */}
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

const CompanyDetailsMobilePage = memo(
  ({
    company,
    isLoading = false,
    hasError = false,
    error,
    handleBack,
    handleEdit,
    handleDelete,
    handleRefresh,
  }) => {
    if (hasError && !company) {
      return (
        <div className="w-full min-h-screen bg-bg p-4 space-y-4">
          <UIAlert
            intent="danger"
            title="Profile Extraction Failure"
            description={error || "The server could not process the company identifier."}
          />
          <div className="flex gap-2">
            <UIButton variant="outline" size="sm" onClick={handleBack} className="flex-1">
              Back to Companies
            </UIButton>
            <UIButton variant="primary" size="sm" onClick={handleRefresh} className="flex-1">
              Retry
            </UIButton>
          </div>
        </div>
      );
    }

    if (!company || isLoading) {
      return <CompanyDetailsMobileSkeleton />;
    }

    const {
      name,
      companyCode,
      type,
      industry,
      status,
      email,
      phones = {},
      website,
      companyDescription,
      description,
      address = {},
      gstin,
      pan,
      owner = {},
      license = {},
      createdAt,
      updatedAt,
      logo,
    } = company;

    const displayType = formatCompanyType(type);
    const displayDescription = companyDescription || description;
    const isLicenseActive = license.status === "active";

    return (
      <div className="w-full min-h-screen bg-bg pb-12 pt-1 px-3 font-sans select-none text-text space-y-3">
        {/* Mobile Hero Card with Integrated Actions */}
        <div className="bg-surface border border-border/90 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="size-13 rounded-xl border border-border/80 bg-primary/10 text-primary flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                {logo?.url ? (
                  <img src={logo.url} alt={name || "Logo"} className="size-full object-cover" />
                ) : (
                  <Building2 className="size-6" />
                )}
              </div>

              <div className="min-w-0">
                <h1 className="text-base font-bold text-text truncate">
                  {name || "Unnamed Entity"}
                </h1>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {companyCode && (
                    <UIBadge variant="outline" className="font-mono text-[10px] px-1.5 py-0.2">
                      {companyCode}
                    </UIBadge>
                  )}
                  <UIBadge variant="primary" className="text-[10px] px-1.5 py-0.2">
                    {displayType}
                  </UIBadge>
                  {industry && (
                    <UIBadge variant="success" className="capitalize text-[10px] px-1.5 py-0.2">
                      {industry.replace(/_/g, " ")}
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
                <span>Incorporated {formatDate(createdAt)}</span>
              </div>
            )}
          </div>

          {displayDescription && (
            <p className="text-[11px] text-text-muted leading-relaxed pt-2 border-t border-border/60">
              {displayDescription}
            </p>
          )}
        </div>

        {/* 1. Corporate Identifiers */}
        <div className="bg-surface border border-border/90 rounded-2xl p-4 shadow-2xs">
          <MobileSectionHeader title="Corporate Identifiers" icon={Building2} />
          <div className="space-y-2 text-xs">
            <MobileRow label="Legal Name" value={name || "-"} />
            <MobileRow label="Entity Classification" value={displayType} />
            <MobileRow label="Industry" value={industry ? industry.replace(/_/g, " ") : "-"} />
            <MobileRow label="Entity Identifier" value={companyCode || "-"} isMono />
            <MobileRow label="Official Email" value={email || "-"} />
            <MobileRow label="Mobile Phone" value={phones.mobile ? `+91 ${phones.mobile}` : "-"} />
            <MobileRow label="WhatsApp" value={phones.whatsapp ? `+91 ${phones.whatsapp}` : "-"} />
            {phones.landline && <MobileRow label="Landline" value={phones.landline} />}
            {website && (
              <MobileRow
                label="Corporate Portal"
                value={
                  <a
                    href={website.startsWith("http") ? website : `https://${website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <span className="truncate max-w-[140px]">{website}</span>
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                }
              />
            )}
          </div>
        </div>

        {/* 2. Executive Ownership */}
        <div className="bg-surface border border-border/90 rounded-2xl p-4 shadow-2xs">
          <MobileSectionHeader title="Executive Ownership" icon={User} />
          <div className="space-y-2 text-xs">
            <MobileRow label="Director / Owner" value={owner.name || "-"} />
            <MobileRow label="Executive Email" value={owner.email || "-"} />
            <MobileRow label="Direct Mobile" value={owner.mobile ? `+91 ${owner.mobile}` : "-"} />
            <MobileRow label="Individual PAN" value={owner.pan || "-"} isMono />
            <MobileRow label="Aadhaar (UID)" value={owner.aadhaar || "-"} isMono />
          </div>
        </div>

        {/* 3. Registered Office Location */}
        <div className="bg-surface border border-border/90 rounded-2xl p-4 shadow-2xs">
          <MobileSectionHeader title="Registered Location" icon={MapPin} />
          <div className="space-y-2 text-xs">
            <MobileRow label="Premises Line 1" value={address.addressLine1 || "-"} />
            {address.addressLine2 && <MobileRow label="Premises Line 2" value={address.addressLine2} />}
            <MobileRow label="City & District" value={`${address.city || "-"}, ${address.district || "-"}`} />
            <MobileRow label="State & PIN" value={`${address.state || "-"} - ${address.pincode || "-"}`} isMono />
            <MobileRow label="Country" value={address.country || "India"} />
          </div>
        </div>

        {/* 4. Statutory Licenses & Tax Matrix */}
        <div className="bg-surface border border-border/90 rounded-2xl p-4 shadow-2xs">
          <MobileSectionHeader title="Compliance & Tax" icon={Scale} />
          <div className="space-y-2 text-xs">
            <MobileRow label="GSTIN" value={gstin || "-"} isMono />
            <MobileRow label="Entity PAN" value={pan || "-"} isMono />
            <MobileRow
              label="License Status"
              value={
                license.status ? (
                  <UIBadge
                    variant={isLicenseActive ? "success" : "outline"}
                    className="capitalize text-[10px] px-1.5 py-0.2"
                  >
                    {license.status}
                  </UIBadge>
                ) : (
                  "-"
                )
              }
            />
            <MobileRow label="Classification" value={license.licenseType || "-"} />
            <MobileRow label="FSSAI Token" value={license.fssaiNumber || "-"} isMono />
            <MobileRow label="Retail (Form 20/21)" value={license.retailLicenseNumber || "-"} isMono />
            <MobileRow label="Wholesale (Form 20B/21B)" value={license.wholesaleLicenseNumber || "-"} isMono />
            <MobileRow label="Issued Date" value={formatDate(license.issuedAt)} />
            <MobileRow label="Expiry Date" value={formatDate(license.expiresAt)} />
            <MobileRow label="Audit Update" value={formatDate(updatedAt)} />
          </div>
        </div>
      </div>
    );
  },
);

CompanyDetailsMobilePage.displayName = "CompanyDetailsMobilePage";

const MobileSectionHeader = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-2 pb-2 mb-2.5 border-b border-border/60">
    {Icon && (
      <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="size-3.5" />
      </div>
    )}
    <h3 className="text-xs font-bold text-text uppercase tracking-wider">{title}</h3>
  </div>
);

const MobileRow = ({ label, value, isMono = false }) => (
  <div className="flex items-start justify-between gap-3 py-0.5">
    <span className="text-text-muted shrink-0">{label}</span>
    <span className={`font-semibold text-text text-right truncate max-w-[190px] ${isMono ? "font-mono" : ""}`}>
      {value}
    </span>
  </div>
);

export default CompanyDetailsMobilePage;
