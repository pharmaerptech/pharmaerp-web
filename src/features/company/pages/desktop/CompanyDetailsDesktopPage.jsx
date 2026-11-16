// src/features/company/pages/desktop/CompanyDetailsDesktopPage.jsx

import { memo, useState, useCallback } from "react";
import {
  Building2,
  Calendar,
  Check,
  Clock,
  Copy,
  Edit3,
  ExternalLink,
  FileCheck,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
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

/* ==========================================================================
   SKELETON LOADER COMPONENT (Exact 1:1 Layout Mirror, Zero Shift)
   ========================================================================== */

const CompanyDetailsSkeleton = () => (
  <div className="w-full min-h-full flex-1 overflow-y-auto pt-1 pb-10 px-2 sm:px-4 lg:px-6 font-sans select-none animate-pulse">
    <div className="mx-auto w-full max-w-7xl space-y-4">
      {/* ── 1. Hero Dossier Banner Skeleton ── */}
      <section className="bg-surface border border-border/90 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Entity Branding & Identity Skeleton */}
          <div className="flex items-start sm:items-center gap-4.5 min-w-0">
            <div className="size-16 sm:size-20 rounded-2xl border border-border/80 bg-surface-alt/70 flex items-center justify-center shrink-0">
              <Building2 className="size-8 sm:size-10 text-text-muted/20" />
            </div>

            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="h-7 w-64 sm:w-80 bg-surface-alt rounded-lg" />
                <div className="h-6 w-20 bg-surface-alt/80 rounded-md border border-border/60" />
                <div className="h-6 w-24 bg-primary/10 rounded-full border border-primary/20" />
                <div className="h-6 w-16 bg-surface-alt/80 rounded-full" />
              </div>

              <div className="mt-2.5 flex items-center gap-4 flex-wrap">
                <div className="h-4 w-36 bg-surface-alt/70 rounded-md" />
                <div className="h-4 w-28 bg-surface-alt/70 rounded-md" />
                <div className="h-4 w-32 bg-surface-alt/70 rounded-md" />
                <div className="h-4 w-36 bg-surface-alt/70 rounded-md" />
              </div>
            </div>
          </div>

          {/* Integrated Actions Skeleton in Top Right */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 pt-2 md:pt-0">
            <div className="h-9 w-16 bg-surface-alt/50 rounded-xl" />
            <div className="h-9 w-28 bg-surface-alt rounded-xl border border-border/60" />
            <div className="h-9 w-20 bg-surface-alt/40 rounded-xl" />
          </div>
        </div>

        {/* Quick Stat Ticker Strip Skeleton (4 Cards) */}
        <div className="mt-5 pt-4 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/40 space-y-1.5">
            <div className="h-2.5 w-14 bg-surface-alt/70 rounded" />
            <div className="h-4 w-28 bg-surface-alt rounded" />
          </div>
          <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/40 space-y-1.5">
            <div className="h-2.5 w-20 bg-surface-alt/70 rounded" />
            <div className="h-4 w-32 bg-emerald-500/10 rounded" />
          </div>
          <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/40 space-y-1.5">
            <div className="h-2.5 w-24 bg-surface-alt/70 rounded" />
            <div className="h-4 w-28 bg-surface-alt rounded" />
          </div>
          <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/40 space-y-1.5">
            <div className="h-2.5 w-20 bg-surface-alt/70 rounded" />
            <div className="h-4 w-24 bg-surface-alt rounded" />
          </div>
        </div>
      </section>

      {/* ── 2. Asymmetric 2-Column Corporate Dossier Skeleton ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT COLUMN (5 cols / 40%): Corporate Governance & Owner KYC ── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Executive Ownership Profile Skeleton */}
          <div className="bg-surface border border-border/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-border/60">
              <div className="size-8 rounded-lg bg-surface-alt/80 shrink-0" />
              <div className="space-y-1">
                <div className="h-3 w-40 bg-surface-alt rounded" />
                <div className="h-2.5 w-52 bg-surface-alt/60 rounded" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-alt/40 border border-border/40">
                <div className="size-10 rounded-xl bg-primary/20 shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 bg-surface-alt rounded" />
                  <div className="h-2.5 w-44 bg-surface-alt/60 rounded" />
                </div>
              </div>

              <div className="divide-y divide-border/40 text-xs">
                <div className="py-2 flex items-center justify-between gap-3">
                  <div className="h-3 w-24 bg-surface-alt/60 rounded" />
                  <div className="h-3.5 w-36 bg-surface-alt rounded" />
                </div>
                <div className="py-2 flex items-center justify-between gap-3">
                  <div className="h-3 w-20 bg-surface-alt/60 rounded" />
                  <div className="h-3.5 w-28 bg-surface-alt rounded" />
                </div>
                <div className="py-2 flex items-center justify-between gap-3">
                  <div className="h-3 w-24 bg-surface-alt/60 rounded" />
                  <div className="h-3.5 w-28 bg-surface-alt rounded" />
                </div>
                <div className="py-2 flex items-center justify-between gap-3">
                  <div className="h-3 w-24 bg-surface-alt/60 rounded" />
                  <div className="h-3.5 w-32 bg-surface-alt rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* Direct Communications & Channels Hub Skeleton */}
          <div className="bg-surface border border-border/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-border/60">
              <div className="size-8 rounded-lg bg-surface-alt/80 shrink-0" />
              <div className="space-y-1">
                <div className="h-3 w-40 bg-surface-alt rounded" />
                <div className="h-2.5 w-48 bg-surface-alt/60 rounded" />
              </div>
            </div>

            <div className="space-y-2">
              {[
                { labelW: "w-20", valW: "w-36" },
                { labelW: "w-24", valW: "w-28" },
                { labelW: "w-28", valW: "w-28" },
                { labelW: "w-24", valW: "w-32" },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-surface-alt/30 border border-border/40 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="size-3.5 rounded bg-surface-alt/60" />
                    <div className={`h-3 ${row.labelW} bg-surface-alt/60 rounded`} />
                  </div>
                  <div className={`h-3.5 ${row.valW} bg-surface-alt rounded`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (7 cols / 60%): Operational Footprint & Statutory Licenses ── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Executive Overview & Scope Skeleton */}
          <div className="bg-surface border border-border/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-border/60">
              <div className="size-4 bg-primary/20 rounded" />
              <div className="h-3 w-44 bg-surface-alt rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-surface-alt/60 rounded" />
              <div className="h-3 w-11/12 bg-surface-alt/60 rounded" />
              <div className="h-3 w-3/4 bg-surface-alt/60 rounded" />
            </div>
          </div>

          {/* Statutory Licensing Matrix Skeleton */}
          <div className="bg-surface border border-border/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-surface-alt/80 shrink-0" />
                <div className="space-y-1">
                  <div className="h-3 w-40 bg-surface-alt rounded" />
                  <div className="h-2.5 w-56 bg-surface-alt/60 rounded" />
                </div>
              </div>
              <div className="h-5 w-16 bg-emerald-500/10 rounded-full border border-emerald-500/20" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { titleW: "w-24", badgeW: "w-16", valW: "w-36" },
                { titleW: "w-28", badgeW: "w-18", valW: "w-36" },
                { titleW: "w-28", badgeW: "w-16", valW: "w-32" },
                { titleW: "w-20", badgeW: "w-10", valW: "w-36" },
              ].map((tile, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-surface-alt/40 border border-border/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className={`h-2.5 ${tile.titleW} bg-surface-alt/60 rounded`} />
                    <div className={`h-4 ${tile.badgeW} bg-surface-alt/80 rounded`} />
                  </div>
                  <div className={`h-4 ${tile.valW} bg-surface-alt rounded`} />
                </div>
              ))}
            </div>

            {/* Validity Timeline Skeleton */}
            <div className="mt-4 pt-3.5 border-t border-border/60 flex items-center justify-between">
              <div className="h-3 w-36 bg-surface-alt/60 rounded" />
              <div className="h-3 w-40 bg-surface-alt/60 rounded" />
            </div>
          </div>

          {/* Commercial Tax Credentials Skeleton */}
          <div className="bg-surface border border-border/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-border/60">
              <div className="size-8 rounded-lg bg-surface-alt/80 shrink-0" />
              <div className="space-y-1">
                <div className="h-3 w-36 bg-surface-alt rounded" />
                <div className="h-2.5 w-60 bg-surface-alt/60 rounded" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl bg-surface-alt/40 border border-border/60 flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-2.5 w-32 bg-surface-alt/60 rounded" />
                  <div className="h-4 w-36 bg-surface-alt rounded" />
                </div>
                <div className="size-7 rounded-lg bg-surface-alt/60" />
              </div>
              <div className="p-3.5 rounded-xl bg-surface-alt/40 border border-border/60 flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-2.5 w-32 bg-surface-alt/60 rounded" />
                  <div className="h-4 w-28 bg-surface-alt rounded" />
                </div>
                <div className="size-7 rounded-lg bg-surface-alt/60" />
              </div>
            </div>
          </div>

          {/* Registered Office Headquarters Skeleton */}
          <div className="bg-surface border border-border/90 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-border/60">
              <div className="size-8 rounded-lg bg-surface-alt/80 shrink-0" />
              <div className="space-y-1">
                <div className="h-3 w-44 bg-surface-alt rounded" />
                <div className="h-2.5 w-64 bg-surface-alt/60 rounded" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-alt/40 border border-border/60 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="size-4 rounded bg-primary/20 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-full bg-surface-alt rounded" />
                  <div className="h-3.5 w-3/4 bg-surface-alt/80 rounded" />
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-2 w-12 bg-surface-alt/60 rounded" />
                    <div className="h-3 w-16 bg-surface-alt rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ==========================================================================
   MAIN COMPONENT: COMPANY DETAILS DESKTOP PAGE
   ========================================================================== */

const CompanyDetailsDesktopPage = memo(
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
    const [copiedField, setCopiedField] = useState(null);

    const handleCopy = useCallback((text, field) => {
      if (!text || text === "-") return;
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    }, []);

    // Error State
    if (hasError && !company) {
      return (
        <div className="w-full min-h-full flex-1 overflow-y-auto pt-4 pb-10 px-2 sm:px-4 lg:px-6 font-sans">
          <div className="mx-auto w-full max-w-7xl space-y-4">
            <UIAlert
              intent="danger"
              title="Profile Extraction Failure"
              description={error || "The server could not process the company identifier."}
            />
            <div className="flex gap-3">
              <UIButton variant="outline" onClick={handleBack} startIcon={<RotateCcw className="size-4" />}>
                Back to Companies
              </UIButton>
              <UIButton variant="primary" onClick={handleRefresh} startIcon={<RotateCcw className="size-4" />}>
                Retry Pipeline
              </UIButton>
            </div>
          </div>
        </div>
      );
    }

    // Always render high-fidelity skeleton when company is resolving (never show an empty state)
    if (!company || isLoading) {
      return <CompanyDetailsSkeleton />;
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
      <div className="w-full min-h-full flex-1 overflow-y-auto pt-1 pb-10 px-2 sm:px-4 lg:px-6 font-sans select-none text-text">
        <div className="mx-auto w-full max-w-7xl space-y-4">
          {/* ── 1. Modern Corporate Hero Dossier Banner (Starts at Very Top) ── */}
          <section className="bg-surface border border-border/90 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              {/* Entity Branding & Identity */}
              <div className="flex items-start sm:items-center gap-4.5 min-w-0">
                <div className="size-16 sm:size-20 rounded-2xl border border-border/80 bg-primary/10 text-primary flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                  {logo?.url ? (
                    <img src={logo.url} alt={name || "Company Logo"} className="size-full object-cover" />
                  ) : (
                    <Building2 className="size-8 sm:size-10" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-text truncate">
                      {name || "Unnamed Corporate Entity"}
                    </h1>
                    {companyCode && (
                      <button
                        type="button"
                        onClick={() => handleCopy(companyCode, "code")}
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold text-text-muted hover:text-text bg-surface-alt px-2 py-0.5 rounded-md border border-border/80 transition-colors cursor-pointer"
                        title="Click to copy Company Code"
                      >
                        <span>{companyCode}</span>
                        {copiedField === "code" ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-2.5 opacity-60" />
                        )}
                      </button>
                    )}
                    <UIBadge variant="primary" className="text-xs font-semibold">
                      {displayType}
                    </UIBadge>
                    {industry && (
                      <UIBadge variant="success" className="text-xs font-semibold capitalize">
                        {industry.replace(/_/g, " ")}
                      </UIBadge>
                    )}
                    <UIBadge
                      variant={status === "active" ? "success" : "neutral"}
                      className="capitalize text-xs font-semibold"
                    >
                      {status || "Active"}
                    </UIBadge>
                  </div>

                  <div className="mt-2 flex items-center gap-4 flex-wrap text-xs text-text-muted">
                    {email && (
                      <a
                        href={`mailto:${email}`}
                        className="inline-flex items-center gap-1.5 hover:text-primary transition-colors truncate max-w-[220px]"
                      >
                        <Mail className="size-3.5 shrink-0" />
                        <span className="truncate">{email}</span>
                      </a>
                    )}
                    {phones.mobile && (
                      <a
                        href={`tel:${phones.mobile}`}
                        className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <Phone className="size-3.5 shrink-0" />
                        <span>+91 {phones.mobile}</span>
                      </a>
                    )}
                    {address.city && address.state && (
                      <div className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0" />
                        <span>{address.city}, {address.state}</span>
                      </div>
                    )}
                    {createdAt && (
                      <div className="inline-flex items-center gap-1.5">
                        <Calendar className="size-3.5 shrink-0" />
                        <span>Incorporated {formatDate(createdAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Integrated Primary Actions in Top Right of Hero */}
              <div className="flex items-center gap-2 self-start md:self-auto shrink-0 pt-2 md:pt-0">
                <UIButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
                  className="h-9 px-3 text-xs font-semibold cursor-pointer text-text-muted hover:text-text"
                >
                  Sync
                </UIButton>
                <UIButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  startIcon={<Edit3 className="size-3.5" />}
                  className="h-9 px-3.5 text-xs font-bold cursor-pointer"
                >
                  Edit Profile
                </UIButton>
                {handleDelete && (
                  <UIButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    startIcon={<Trash2 className="size-3.5 text-error" />}
                    className="h-9 px-3 text-xs font-semibold text-error hover:bg-error/10 cursor-pointer"
                  >
                    Delete
                  </UIButton>
                )}
              </div>
            </div>

            {/* Quick Stat Ticker Strip */}
            <div className="mt-5 pt-4 border-t border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/40">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
                  Tax Status
                </span>
                <span className="font-mono text-xs font-bold text-text mt-0.5 block truncate">
                  {gstin ? "GST Registered" : "Exempt / Pending"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/40">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
                  Drug Controller
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block truncate flex items-center gap-1">
                  <ShieldCheck className="size-3.5" />
                  <span>{isLicenseActive ? "Compliant & Active" : "Pending Verification"}</span>
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/40">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
                  Governance Entity
                </span>
                <span className="text-xs font-bold text-text mt-0.5 block truncate">
                  {owner.name || "Designated Proprietor"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-alt/40 border border-border/40">
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">
                  Audit Timestamp
                </span>
                <span className="text-xs font-mono font-medium text-text mt-0.5 block truncate">
                  {formatDate(updatedAt || createdAt)}
                </span>
              </div>
            </div>
          </section>

          {/* ── 2. Asymmetric 2-Column Corporate Dossier Architecture ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* ── LEFT COLUMN (5 cols / 40%): Corporate Governance & Owner KYC ── */}
            <div className="lg:col-span-5 space-y-4">
              {/* Executive Ownership Profile */}
              <div className="bg-surface border border-border/90 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-border/60">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <User className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                      Ownership & Executive KYC
                    </h3>
                    <p className="text-[11px] text-text-muted">
                      Designated director / proprietor profile
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-alt/40 border border-border/40">
                    <div className="size-10 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {owner.name ? owner.name.charAt(0).toUpperCase() : "O"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-text truncate">
                        {owner.name || "Not Designated"}
                      </p>
                      <p className="text-[11px] text-text-muted truncate">
                        Authorized Signatory & Managing Partner
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-border/40 text-xs">
                    <div className="py-2 flex items-center justify-between gap-3">
                      <span className="text-text-muted">Executive Email</span>
                      <span className="font-semibold text-text truncate max-w-[210px]">
                        {owner.email || "-"}
                      </span>
                    </div>

                    <div className="py-2 flex items-center justify-between gap-3">
                      <span className="text-text-muted">Direct Mobile</span>
                      <span className="font-semibold text-text">
                        {owner.mobile ? `+91 ${owner.mobile}` : "-"}
                      </span>
                    </div>

                    <div className="py-2 flex items-center justify-between gap-3">
                      <span className="text-text-muted">Individual PAN</span>
                      {owner.pan ? (
                        <button
                          type="button"
                          onClick={() => handleCopy(owner.pan, "ownerPan")}
                          className="font-mono font-bold text-text hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                          title="Copy Owner PAN"
                        >
                          <span>{owner.pan}</span>
                          {copiedField === "ownerPan" ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-2.5 opacity-50" />
                          )}
                        </button>
                      ) : (
                        <span className="font-semibold text-text-muted">-</span>
                      )}
                    </div>

                    <div className="py-2 flex items-center justify-between gap-3">
                      <span className="text-text-muted">Aadhaar (UID)</span>
                      <span className="font-mono font-semibold text-text">
                        {owner.aadhaar || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Communications & Channels Hub */}
              <div className="bg-surface border border-border/90 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-border/60">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                      Communication Endpoints
                    </h3>
                    <p className="text-[11px] text-text-muted">
                      Official communication routing channels
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-surface-alt/30 border border-border/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="size-3.5 text-text-muted shrink-0" />
                      <span className="text-text-muted">Official Email</span>
                    </div>
                    <span className="font-semibold text-text truncate max-w-[190px]">
                      {email || "-"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-alt/30 border border-border/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Phone className="size-3.5 text-text-muted shrink-0" />
                      <span className="text-text-muted">Primary Phone</span>
                    </div>
                    <span className="font-semibold text-text font-mono">
                      {phones.mobile ? `+91 ${phones.mobile}` : "-"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-alt/30 border border-border/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Phone className="size-3.5 text-text-muted shrink-0" />
                      <span className="text-text-muted">WhatsApp Dispatch</span>
                    </div>
                    <span className="font-semibold text-text font-mono">
                      {phones.whatsapp ? `+91 ${phones.whatsapp}` : "-"}
                    </span>
                  </div>

                  {phones.landline && (
                    <div className="p-2.5 rounded-xl bg-surface-alt/30 border border-border/40 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone className="size-3.5 text-text-muted shrink-0" />
                        <span className="text-text-muted">Landline</span>
                      </div>
                      <span className="font-semibold text-text font-mono">
                        {phones.landline}
                      </span>
                    </div>
                  )}

                  {website && (
                    <div className="p-2.5 rounded-xl bg-surface-alt/30 border border-border/40 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="size-3.5 text-text-muted shrink-0" />
                        <span className="text-text-muted">Corporate Portal</span>
                      </div>
                      <a
                        href={website.startsWith("http") ? website : `https://${website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline truncate max-w-[180px]"
                      >
                        <span className="truncate">{website}</span>
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN (7 cols / 60%): Operational Footprint & Statutory Licenses ── */}
            <div className="lg:col-span-7 space-y-4">
              {/* Executive Summary / Description */}
              {displayDescription && (
                <div className="bg-surface border border-border/90 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center gap-2.5 pb-2.5 mb-3 border-b border-border/60">
                    <Sparkles className="size-4 text-primary" />
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                      Executive Overview & Scope
                    </h3>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed font-sans">
                    {displayDescription}
                  </p>
                </div>
              )}

              {/* Statutory Licenses & Drug Regulatory Credentials Matrix */}
              <div className="bg-surface border border-border/90 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Scale className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                        Statutory Licensing Matrix
                      </h3>
                      <p className="text-[11px] text-text-muted">
                        Drug Controller and Food Safety Authority credentials
                      </p>
                    </div>
                  </div>
                  {license.status && (
                    <UIBadge variant={isLicenseActive ? "success" : "outline"} className="capitalize text-xs">
                      {license.status}
                    </UIBadge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Retail Drug License */}
                  <div className="p-3.5 rounded-xl bg-surface-alt/40 border border-border/60 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span>Retail Drug License</span>
                      <span className="text-[10px] font-bold uppercase bg-surface px-1.5 py-0.2 rounded border border-border/60">
                        Form 20 / 21
                      </span>
                    </div>
                    <div className="font-mono text-xs font-bold text-text pt-1">
                      {license.retailLicenseNumber || "Not Registered"}
                    </div>
                  </div>

                  {/* Wholesale Drug License */}
                  <div className="p-3.5 rounded-xl bg-surface-alt/40 border border-border/60 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span>Wholesale Drug License</span>
                      <span className="text-[10px] font-bold uppercase bg-surface px-1.5 py-0.2 rounded border border-border/60">
                        Form 20B / 21B
                      </span>
                    </div>
                    <div className="font-mono text-xs font-bold text-text pt-1">
                      {license.wholesaleLicenseNumber || "Not Registered"}
                    </div>
                  </div>

                  {/* FSSAI Registration */}
                  <div className="p-3.5 rounded-xl bg-surface-alt/40 border border-border/60 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span>FSSAI Food Safety Reg</span>
                      <span className="text-[10px] font-bold uppercase bg-surface px-1.5 py-0.2 rounded border border-border/60">
                        14-Digit Token
                      </span>
                    </div>
                    <div className="font-mono text-xs font-bold text-text pt-1">
                      {license.fssaiNumber || "Not Registered"}
                    </div>
                  </div>

                  {/* License Classification */}
                  <div className="p-3.5 rounded-xl bg-surface-alt/40 border border-border/60 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span>Classification</span>
                      <FileCheck className="size-3.5 text-primary" />
                    </div>
                    <div className="text-xs font-bold text-text pt-1">
                      {license.licenseType || "Standard Pharmaceutical"}
                    </div>
                  </div>
                </div>

                {/* Validity Period Timeline Bar */}
                {(license.issuedAt || license.expiresAt) && (
                  <div className="mt-4 pt-3.5 border-t border-border/60 flex items-center justify-between text-xs text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-text-muted" />
                      <span>Issued: <strong className="text-text font-mono">{formatDate(license.issuedAt)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-text-muted" />
                      <span>Valid Thru: <strong className="text-text font-mono">{formatDate(license.expiresAt)}</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Commercial Tax Credentials */}
              <div className="bg-surface border border-border/90 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-border/60">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                      Tax & Fiscal Identifiers
                    </h3>
                    <p className="text-[11px] text-text-muted">
                      Goods and Services Tax (GSTIN) and Income Tax Corporate PAN
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl bg-surface-alt/40 border border-border/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-text-muted block">
                        Goods & Services Tax (GSTIN)
                      </span>
                      <span className="font-mono text-xs font-bold text-text mt-0.5 block">
                        {gstin || "Not Registered"}
                      </span>
                    </div>
                    {gstin && (
                      <button
                        type="button"
                        onClick={() => handleCopy(gstin, "gstin")}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
                        title="Copy GSTIN"
                      >
                        {copiedField === "gstin" ? (
                          <Check className="size-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-alt/40 border border-border/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-text-muted block">
                        Permanent Account Number (PAN)
                      </span>
                      <span className="font-mono text-xs font-bold text-text mt-0.5 block">
                        {pan || "Not Registered"}
                      </span>
                    </div>
                    {pan && (
                      <button
                        type="button"
                        onClick={() => handleCopy(pan, "pan")}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
                        title="Copy PAN"
                      >
                        {copiedField === "pan" ? (
                          <Check className="size-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Registered Corporate Headquarters (Physical Spatial Location) */}
              <div className="bg-surface border border-border/90 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-border/60">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                      Registered Office Headquarters
                    </h3>
                    <p className="text-[11px] text-text-muted">
                      Physical spatial mapping bound to invoices and delivery consignments
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-alt/40 border border-border/60 space-y-2.5">
                  <div className="flex items-start gap-2.5 text-xs">
                    <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                    <p className="font-semibold text-text leading-relaxed">
                      {fullAddress || "Physical address not recorded"}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-text-muted block">City / Town</span>
                      <span className="font-semibold text-text">{address.city || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">District</span>
                      <span className="font-semibold text-text">{address.district || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">State</span>
                      <span className="font-semibold text-text">{address.state || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">PIN Code</span>
                      <span className="font-semibold font-mono text-text">{address.pincode || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

CompanyDetailsDesktopPage.displayName = "CompanyDetailsDesktopPage";

export default CompanyDetailsDesktopPage;
