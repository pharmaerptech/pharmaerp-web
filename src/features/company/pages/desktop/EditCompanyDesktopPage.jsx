// src/features/company/pages/desktop/EditCompanyDesktopPage.jsx

import React, { memo, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  CheckCircle2,
  Edit3,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  CloudUpload,
  User,
  Building2,
  Scale,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import {
  UIAlert,
  UIButton,
  UIInput,
  UISelect,
  UIBadge,
} from "@/components/ui";

const STEPS_CONFIG = [
  {
    id: 1,
    title: "Company Profile",
    subtitle: "Legal name, type, contact & logo",
    icon: Building2,
  },
  {
    id: 2,
    title: "Ownership & KYC",
    subtitle: "Owner identity, PAN & Aadhaar",
    icon: User,
  },
  {
    id: 3,
    title: "Registered Office",
    subtitle: "Physical address, state & PIN code",
    icon: MapPin,
  },
  {
    id: 4,
    title: "Licenses & Tax",
    subtitle: "GSTIN, PAN & pharmaceutical licenses",
    icon: Scale,
  },
  {
    id: 5,
    title: "Review & Update",
    subtitle: "Final verification & save updates",
    icon: CheckCircle2,
  },
];

/* ==========================================================================
   SKELETON LOADER COMPONENT (Exact 1:1 Two-Column Edit Page Mirror)
   ========================================================================== */

const EditCompanySkeleton = () => (
  <div className="w-full min-h-full flex-1 overflow-y-auto pt-2 pb-10 px-2 sm:px-4 lg:px-6 font-sans select-none animate-pulse text-text">
    <div className="mx-auto w-full max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: Stepper Sidebar Skeleton (4 cols) ───────── */}
        <aside className="lg:col-span-4 xl:col-span-4 space-y-3.5">
          {/* Stepper Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border/90 shadow-2xs">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border/60">
              <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Building2 className="size-5 text-primary/40" />
              </div>
              <div className="min-w-0 space-y-1.5 flex-1">
                <div className="h-4 w-32 bg-surface-alt rounded" />
                <div className="h-3 w-48 bg-surface-alt/70 rounded" />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-24 bg-surface-alt/70 rounded" />
                <div className="h-2.5 w-8 bg-surface-alt/70 rounded" />
              </div>
              <div className="h-1.5 w-full bg-surface-alt rounded-full overflow-hidden border border-border/40">
                <div className="h-full bg-primary/30 w-1/5 rounded-full" />
              </div>
            </div>

            {/* Stepper Steps (5 items mirroring STEPS_CONFIG) */}
            <div className="space-y-1">
              {[
                { titleW: "w-28", subW: "w-44", active: true },
                { titleW: "w-32", subW: "w-48", active: false },
                { titleW: "w-30", subW: "w-52", active: false },
                { titleW: "w-28", subW: "w-48", active: false },
                { titleW: "w-32", subW: "w-40", active: false },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl ${
                    step.active
                      ? "bg-primary/[0.08] border border-primary/30 shadow-2xs"
                      : "border border-transparent"
                  }`}
                >
                  <div
                    className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
                      step.active
                        ? "bg-primary/20 border border-primary/30"
                        : "bg-surface-alt border border-border"
                    }`}
                  />
                  <div className="min-w-0 flex-1 pt-0.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className={`h-3.5 ${step.titleW} bg-surface-alt rounded`} />
                      {step.active && (
                        <div className="h-3 w-10 bg-primary/20 rounded-full" />
                      )}
                    </div>
                    <div className={`h-2.5 ${step.subW} bg-surface-alt/60 rounded`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Reset Button Placeholder */}
            <div className="pt-4 mt-4 border-t border-border/60">
              <div className="h-8 w-full bg-surface-alt/50 rounded-xl" />
            </div>
          </div>

          {/* Guidance Info Card */}
          <div className="p-3.5 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-start gap-2.5">
            <Sparkles className="size-4 text-primary/40 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-full bg-surface-alt/70 rounded" />
              <div className="h-3 w-4/5 bg-surface-alt/70 rounded" />
            </div>
          </div>
        </aside>

        {/* ── RIGHT COLUMN: Form Canvas Skeleton (8 cols) ─────────── */}
        <main className="lg:col-span-8 xl:col-span-8 min-w-0">
          <div className="bg-surface border border-border/90 rounded-2xl shadow-xs overflow-hidden">
            {/* Form Canvas Header */}
            <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-border/60 bg-surface-alt/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="h-5 w-48 bg-surface-alt rounded" />
                <div className="h-3.5 w-64 bg-surface-alt/70 rounded" />
              </div>
              <div className="h-6 w-24 bg-surface-alt rounded-full self-start sm:self-auto" />
            </div>

            {/* Form Canvas Body */}
            <div className="p-5 sm:p-7 space-y-6">
              {/* Section 1: Corporate Identifiers Skeleton */}
              <div>
                <div className="flex items-start gap-3 pb-3 mb-4 border-b border-border/60">
                  <div className="size-8 rounded-lg bg-surface-alt/80 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <div className="h-3.5 w-36 bg-surface-alt rounded" />
                    <div className="h-2.5 w-60 bg-surface-alt/60 rounded" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                  {/* Company Name (full width) */}
                  <div className="md:col-span-2 space-y-1.5">
                    <div className="h-3.5 w-28 bg-surface-alt/70 rounded" />
                    <div className="h-10 w-full bg-surface-alt/50 rounded-xl border border-border/60" />
                  </div>

                  {/* Company Type */}
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 bg-surface-alt/70 rounded" />
                    <div className="h-10 w-full bg-surface-alt/50 rounded-xl border border-border/60" />
                  </div>

                  {/* Industry */}
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-20 bg-surface-alt/70 rounded" />
                    <div className="h-10 w-full bg-surface-alt/50 rounded-xl border border-border/60" />
                  </div>

                  {/* Company Description */}
                  <div className="md:col-span-2 space-y-1.5">
                    <div className="h-3.5 w-44 bg-surface-alt/70 rounded" />
                    <div className="h-20 w-full bg-surface-alt/50 rounded-xl border border-border/60" />
                  </div>
                </div>
              </div>

              {/* Section 2: Communication Channels Skeleton */}
              <div>
                <div className="flex items-start gap-3 pb-3 mb-4 border-b border-border/60">
                  <div className="size-8 rounded-lg bg-surface-alt/80 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <div className="h-3.5 w-44 bg-surface-alt rounded" />
                    <div className="h-2.5 w-72 bg-surface-alt/60 rounded" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-36 bg-surface-alt/70 rounded" />
                    <div className="h-10 w-full bg-surface-alt/50 rounded-xl border border-border/60" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-3.5 w-36 bg-surface-alt/70 rounded" />
                    <div className="flex gap-2.5">
                      <div className="h-10 w-[110px] bg-surface-alt/50 rounded-xl border border-border/60 shrink-0" />
                      <div className="h-10 flex-1 bg-surface-alt/50 rounded-xl border border-border/60" />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <div className="h-3.5 w-40 bg-surface-alt/70 rounded" />
                    <div className="h-10 w-full bg-surface-alt/50 rounded-xl border border-border/60" />
                  </div>
                </div>
              </div>

              {/* Section 3: Brand Assets Skeleton */}
              <div>
                <div className="flex items-start gap-3 pb-3 mb-4 border-b border-border/60">
                  <div className="size-8 rounded-lg bg-surface-alt/80 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <div className="h-3.5 w-36 bg-surface-alt rounded" />
                    <div className="h-2.5 w-64 bg-surface-alt/60 rounded" />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-border/80 bg-surface-alt/40">
                  <div className="size-16 shrink-0 rounded-xl border border-border bg-surface-alt/60" />
                  <div className="flex-1 space-y-1.5 text-center sm:text-left">
                    <div className="h-3.5 w-40 bg-surface-alt rounded" />
                    <div className="h-2.5 w-60 bg-surface-alt/60 rounded" />
                  </div>
                  <div className="h-8 w-24 bg-surface-alt/80 rounded-xl shrink-0" />
                </div>
              </div>

              {/* Action Footer Skeleton */}
              <div className="pt-5 border-t border-border/80 flex items-center justify-between">
                <div className="h-9 w-20 bg-surface-alt/50 rounded-xl" />
                <div className="h-9 w-32 bg-primary/20 rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
);

const EditCompanyDesktopPage = memo(
  ({
    formData,
    formErrors = {},
    isLoading = false,
    isFetching = false,
    currentStep = 1,

    companyTypeOptions = [],
    industryOptions = [],
    licenseStatusOptions = [],

    handleChange,
    handleSubmit,
    handleBack,
    handleContinue,
    handleStepChange,
    handleCancel,
    handleReload,
  }) => {
    const handleResetAndRefresh = React.useCallback(() => {
      handleStepChange?.(1);
      if (handleReload) handleReload();
    }, [handleReload, handleStepChange]);

    // Auto-scroll to the top of the form area when navigating between steps
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentStep]);

    if (isFetching) {
      return <EditCompanySkeleton />;
    }

    const progressPercent = Math.round(((currentStep - 1) / (STEPS_CONFIG.length - 1)) * 100);

    return (
      <div className="w-full min-h-full flex-1 overflow-y-auto pt-2 pb-10 px-2 sm:px-4 lg:px-6 font-sans select-none text-text">
        <div className="mx-auto w-full max-w-7xl">
          {/* ── Two-Column Layout: Left Stepper Sidebar + Right Form Canvas ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── LEFT COLUMN: Vertical Stepper Sidebar (4 cols) ───────── */}
            <aside className="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-2 space-y-3.5">
              {/* Stepper Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border/90 shadow-2xs">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border/60">
                  <div className="size-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <Building2 className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-text truncate">
                      Update Company
                    </h2>
                    <p className="text-[11px] text-text-muted truncate">
                      Legal entity & compliance configuration
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-text-muted uppercase tracking-wider text-[10px]">
                      Setup Progress
                    </span>
                    <span className="font-mono font-bold text-primary">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-alt rounded-full overflow-hidden border border-border/40">
                    <div
                      className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                      style={{ width: `${Math.max(progressPercent, 4)}%` }}
                    />
                  </div>
                </div>

                {/* Vertical Stepper List */}
                <nav aria-label="Registration Steps" className="space-y-1 relative">
                  {STEPS_CONFIG.map((step, idx) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    const isClickable = isCompleted || isActive;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.id} className="relative">
                        {/* Connecting vertical line */}
                        {idx < STEPS_CONFIG.length - 1 && (
                          <div
                            className={`absolute left-[17px] top-[34px] w-[2px] h-[calc(100%-8px)] transition-colors duration-200 z-0 ${
                              currentStep > step.id ? "bg-primary" : "bg-border/70"
                            }`}
                          />
                        )}

                        <button
                          type="button"
                          disabled={!isClickable}
                          onClick={() => isClickable && handleStepChange?.(step.id)}
                          className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all relative z-10 ${
                            isActive
                              ? "bg-primary/[0.08] border border-primary/30 shadow-2xs"
                              : isCompleted
                              ? "hover:bg-surface-alt/70 border border-transparent cursor-pointer"
                              : "opacity-60 border border-transparent cursor-not-allowed"
                          }`}
                        >
                          {/* Step Indicator Circle */}
                          <div
                            className={`size-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold font-mono transition-all ${
                              isCompleted
                                ? "bg-emerald-500 text-white shadow-2xs"
                                : isActive
                                ? "bg-primary text-primary-foreground shadow-xs ring-4 ring-primary/15"
                                : "bg-surface-alt text-text-muted border border-border"
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="size-4 stroke-[2.5]" />
                            ) : (
                              <StepIcon className="size-4" />
                            )}
                          </div>

                          {/* Step Content */}
                          <div className="min-w-0 flex-1 pt-0.5">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold truncate block transition-colors ${
                                  isActive
                                    ? "text-primary"
                                    : isCompleted
                                    ? "text-text"
                                    : "text-text-muted"
                                }`}
                              >
                                {step.title}
                              </span>
                              {isActive && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary/15 text-primary shrink-0">
                                  Current
                                </span>
                              )}
                              {isCompleted && (
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                  Done
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-text-muted block truncate mt-0.5">
                              {step.subtitle}
                            </span>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </nav>

                {/* Sidebar Utility Actions */}
                <div className="pt-4 mt-4 border-t border-border/60 flex items-center">
                  <UIButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetAndRefresh}
                    loading={isLoading || isFetching}
                    disabled={isLoading || isFetching}
                    startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
                    className="h-8 px-2.5 text-xs font-medium text-text-muted hover:text-text cursor-pointer w-full justify-center"
                  >
                    Reset & Reload Form
                  </UIButton>
                </div>
              </div>

              {/* Informational Guidance Badge */}
              <div className="p-3.5 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-start gap-2.5">
                <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Your inputs are securely validated in compliance with the Drug and Cosmetics Act & Indian Corporate Law.
                </p>
              </div>
            </aside>

            {/* ── RIGHT COLUMN: Form Content Canvas (8 cols) ─────────── */}
            <main className="lg:col-span-8 xl:col-span-8 min-w-0">
              {formErrors.submit && (
                <div className="mb-4">
                  <UIAlert
                    intent="danger"
                    title="Submission Error"
                    description={formErrors.submit}
                  />
                </div>
              )}

              <div className="bg-surface border border-border/90 rounded-2xl shadow-xs overflow-hidden">
                {/* Form Canvas Header */}
                <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-border/60 bg-surface-alt/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-text">
                        {STEPS_CONFIG[currentStep - 1].title}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {STEPS_CONFIG[currentStep - 1].subtitle}
                      </p>
                    </div>
                    <UIBadge variant={currentStep === 5 ? "success" : "outline"} className="self-start sm:self-auto">
                      Step {currentStep} of {STEPS_CONFIG.length}
                    </UIBadge>
                  </div>

                  {/* Form Fields Canvas Body */}
                  <div className="p-5 sm:p-7">
                    <form onSubmit={(e) => e.preventDefault()} className="w-full">
                      {currentStep === 1 && (
                        <CompanyDetailsForm
                          formData={formData}
                          formErrors={formErrors}
                          companyTypeOptions={companyTypeOptions}
                          industryOptions={industryOptions}
                          handleChange={handleChange}
                          handleCancel={handleCancel}
                          handleContinue={handleContinue}
                        />
                      )}

                      {currentStep === 2 && (
                        <OwnerDetailsForm
                          formData={formData}
                          formErrors={formErrors}
                          handleChange={handleChange}
                          handleBack={handleBack}
                          handleContinue={handleContinue}
                        />
                      )}

                      {currentStep === 3 && (
                        <AddressForm
                          formData={formData}
                          formErrors={formErrors}
                          handleChange={handleChange}
                          handleBack={handleBack}
                          handleContinue={handleContinue}
                        />
                      )}

                      {currentStep === 4 && (
                        <LicenseAndIdentityForm
                          formData={formData}
                          formErrors={formErrors}
                          licenseStatusOptions={licenseStatusOptions}
                          handleChange={handleChange}
                          handleBack={handleBack}
                          handleContinue={handleContinue}
                        />
                      )}

                      {currentStep === 5 && (
                        <ReviewAndUpdateStep
                          formData={formData}
                          companyTypeOptions={companyTypeOptions}
                          industryOptions={industryOptions}
                          isUpdating={isLoading}
                          onBack={handleBack}
                          onSubmit={handleSubmit}
                          onEditSection={handleStepChange}
                        />
                      )}
                    </form>
                  </div>
                </div>
            </main>
          </div>
        </div>
      </div>
    );
  },
);

EditCompanyDesktopPage.displayName = "EditCompanyDesktopPage";

/* ==========================================================================
   SUB-COMPONENT: SECTION HEADER
   ========================================================================== */

const FormSectionHeader = ({ title, description, icon: Icon }) => (
  <div className="flex items-start gap-3 pb-3 mb-4 border-b border-border/60">
    {Icon && (
      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="size-4" />
      </div>
    )}
    <div className="min-w-0">
      <h4 className="text-sm font-bold text-text">{title}</h4>
      {description && (
        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  </div>
);

/* ==========================================================================
   STEP 1: COMPANY DETAILS FORM
   ========================================================================== */

const CompanyDetailsForm = ({
  formData,
  formErrors,
  companyTypeOptions,
  industryOptions,
  handleChange,
  handleCancel,
  handleContinue,
}) => (
  <div className="space-y-6">
    {/* Section 1: Basic Identifiers */}
    <div>
      <FormSectionHeader
        title="Corporate Identifiers"
        description="Enter the legal entity name and primary business classification."
        icon={Building2}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        <div className="md:col-span-2">
          <UIInput
            label="Company Name"
            name="companyName"
            value={formData.companyName || ""}
            onChange={handleChange}
            placeholder="e.g. MedPlus Healthcare Pvt. Ltd."
            required
            error={formErrors.companyName}
          />
        </div>

        <UISelect
          label="Company Type"
          name="companyType"
          value={formData.companyType || ""}
          onChange={(val) =>
            handleChange({ target: { name: "companyType", value: val } })
          }
          options={companyTypeOptions}
          required
          error={formErrors.companyType}
        />

        <UISelect
          label="Industry"
          name="industry"
          value={formData.industry || ""}
          onChange={(val) =>
            handleChange({ target: { name: "industry", value: val } })
          }
          options={industryOptions}
          required
          error={formErrors.industry}
        />

        <div className="md:col-span-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-text">
              Company Description (Optional)
            </label>
            <textarea
              name="companyDescription"
              value={formData.companyDescription || ""}
              onChange={handleChange}
              placeholder="Describe your pharmaceutical or retail operations briefly..."
              rows={3}
              className="w-full rounded-xl border border-border bg-surface-alt px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y transition-colors hover:border-border-hover"
            />
          </div>
        </div>
      </div>
    </div>

    {/* Section 2: Contact Channels */}
    <div>
      <FormSectionHeader
        title="Communication Channels"
        description="Official corporate email and phone number for legal dispatch and notifications."
        icon={Mail}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        <UIInput
          label="Company Email Address"
          name="companyEmail"
          value={formData.companyEmail || ""}
          onChange={handleChange}
          placeholder="contact@company.com"
          required
          error={formErrors.companyEmail}
          startIcon={<Mail className="text-text-muted size-4" />}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-text">
            Official Phone Number <span className="text-error">*</span>
          </label>
          <div className="flex gap-2.5">
            <div className="w-[110px] shrink-0">
              <UISelect
                name="countryCode"
                value="India (+91)"
                options={[{ label: "🇮🇳 +91", value: "India (+91)" }]}
                disabled
              />
            </div>
            <div className="flex-1">
              <UIInput
                name="companyPhone"
                value={formData.companyPhone || ""}
                onChange={handleChange}
                placeholder="10-digit mobile"
                error={formErrors.companyPhone}
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <UIInput
            label="Corporate Website (Optional)"
            name="website"
            value={formData.website || ""}
            onChange={handleChange}
            placeholder="https://www.company.com"
            startIcon={<Globe className="text-text-muted size-4" />}
          />
        </div>
      </div>
    </div>

    {/* Section 3: Brand Assets */}
    <div>
      <FormSectionHeader
        title="Brand Assets & Logo"
        description="Upload corporate logo. Used for patient billing receipts, invoices, and letterheads."
        icon={CloudUpload}
      />
      <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-border/80 bg-surface-alt/40">
        <div className="size-16 shrink-0 rounded-xl border border-border bg-primary/5 text-primary flex items-center justify-center">
          <Building2 className="size-7" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs font-semibold text-text">PNG, JPG, or SVG up to 2MB</p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Recommended dimensions 400x400px. High-contrast square format displays best on invoices.
          </p>
        </div>
        <UIButton
          type="button"
          variant="outline"
          size="sm"
          startIcon={<CloudUpload className="size-3.5" />}
          className="shrink-0 text-xs font-medium cursor-pointer"
        >
          Choose File
        </UIButton>
      </div>
    </div>

    {/* Action Footer */}
    <div className="pt-5 border-t border-border/80 flex items-center justify-between">
      <UIButton
        type="button"
        variant="ghost"
        onClick={handleCancel}
        className="cursor-pointer"
      >
        Cancel
      </UIButton>
      <UIButton
        type="button"
        variant="primary"
        onClick={handleContinue}
        endIcon={<ArrowRight className="size-4" />}
        className="cursor-pointer font-bold shadow-xs px-5"
      >
        Save & Continue
      </UIButton>
    </div>
  </div>
);

/* ==========================================================================
   STEP 2: OWNER DETAILS FORM
   ========================================================================== */

const OwnerDetailsForm = ({
  formData,
  formErrors,
  handleChange,
  handleBack,
  handleContinue,
}) => (
  <div className="space-y-6">
    <div>
      <FormSectionHeader
        title="Primary Ownership Profile"
        description="Designated director, managing partner, or proprietor holding ultimate operating authority."
        icon={User}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        <div className="md:col-span-2">
          <UIInput
            label="Owner / Managing Director Full Name"
            name="ownerName"
            value={formData.ownerName || ""}
            onChange={handleChange}
            placeholder="As per Government PAN database"
            required
            error={formErrors.ownerName}
          />
        </div>

        <UIInput
          label="Direct Email Address"
          name="ownerEmail"
          value={formData.ownerEmail || ""}
          onChange={handleChange}
          placeholder="owner@company.com"
          required
          error={formErrors.ownerEmail}
          startIcon={<Mail className="text-text-muted size-4" />}
        />

        <UIInput
          label="Direct Mobile Number"
          name="ownerMobile"
          value={formData.ownerMobile || ""}
          onChange={handleChange}
          placeholder="10-digit mobile number"
          required
          error={formErrors.ownerMobile}
          startIcon={<Phone className="text-text-muted size-4" />}
        />
      </div>
    </div>

    <div>
      <FormSectionHeader
        title="Personal KYC Identifiers"
        description="Required under statutory corporate guidelines and drug control directives."
        icon={ShieldCheck}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        <UIInput
          label="Individual PAN Card"
          name="ownerPan"
          value={formData.ownerPan || ""}
          onChange={handleChange}
          placeholder="ABCDE1234F"
          error={formErrors.ownerPan}
        />

        <UIInput
          label="Aadhaar Number (UID)"
          name="ownerAadhaar"
          value={formData.ownerAadhaar || ""}
          onChange={handleChange}
          placeholder="12-digit UID"
          error={formErrors.ownerAadhaar}
        />
      </div>
    </div>

    <div className="pt-5 border-t border-border/80 flex items-center justify-between">
      <UIButton
        type="button"
        variant="outline"
        onClick={handleBack}
        startIcon={<ArrowLeft className="size-4" />}
        className="cursor-pointer"
      >
        Back
      </UIButton>
      <UIButton
        type="button"
        variant="primary"
        onClick={handleContinue}
        endIcon={<ArrowRight className="size-4" />}
        className="cursor-pointer font-bold shadow-xs px-5"
      >
        Save & Continue
      </UIButton>
    </div>
  </div>
);

/* ==========================================================================
   STEP 3: ADDRESS FORM
   ========================================================================== */

const AddressForm = ({
  formData,
  formErrors,
  handleChange,
  handleBack,
  handleContinue,
}) => (
  <div className="space-y-6">
    <div>
      <FormSectionHeader
        title="Registered Office Address"
        description="Physical location listed on GST registration and pharmaceutical licenses."
        icon={MapPin}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        <div className="md:col-span-2">
          <UIInput
            label="Address Line 1"
            name="addressLine1"
            value={formData.addressLine1 || ""}
            onChange={handleChange}
            placeholder="Premises name, Building No, Road"
            required
            error={formErrors.addressLine1}
          />
        </div>

        <div className="md:col-span-2">
          <UIInput
            label="Address Line 2 (Optional)"
            name="addressLine2"
            value={formData.addressLine2 || ""}
            onChange={handleChange}
            placeholder="Floor, Suite, Landmark, Sector"
          />
        </div>

        <UIInput
          label="City / Town"
          name="city"
          value={formData.city || ""}
          onChange={handleChange}
          placeholder="e.g. Mumbai"
          required
          error={formErrors.city}
        />

        <UIInput
          label="District"
          name="district"
          value={formData.district || ""}
          onChange={handleChange}
          placeholder="e.g. Mumbai Suburban"
          required
          error={formErrors.district}
        />

        <UIInput
          label="State"
          name="state"
          value={formData.state || ""}
          onChange={handleChange}
          placeholder="e.g. Maharashtra"
          required
          error={formErrors.state}
        />

        <UIInput
          label="Postal PIN Code"
          name="pincode"
          value={formData.pincode || ""}
          onChange={handleChange}
          placeholder="6-digit postal code"
          required
          error={formErrors.pincode}
        />

        <div className="md:col-span-2">
          <UIInput
            label="Country"
            name="country"
            value={formData.country || "India"}
            onChange={handleChange}
            disabled
          />
        </div>
      </div>
    </div>

    <div className="pt-5 border-t border-border/80 flex items-center justify-between">
      <UIButton
        type="button"
        variant="outline"
        onClick={handleBack}
        startIcon={<ArrowLeft className="size-4" />}
        className="cursor-pointer"
      >
        Back
      </UIButton>
      <UIButton
        type="button"
        variant="primary"
        onClick={handleContinue}
        endIcon={<ArrowRight className="size-4" />}
        className="cursor-pointer font-bold shadow-xs px-5"
      >
        Save & Continue
      </UIButton>
    </div>
  </div>
);

/* ==========================================================================
   STEP 4: LICENSES AND IDENTITY FORM
   ========================================================================== */

const LicenseAndIdentityForm = ({
  formData,
  formErrors,
  licenseStatusOptions,
  handleChange,
  handleBack,
  handleContinue,
}) => (
  <div className="space-y-6">
    <div>
      <FormSectionHeader
        title="Corporate Tax Identification"
        description="Statutory tax tokens issued by GSTN and Income Tax Department."
        icon={Scale}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        <UIInput
          label="Goods and Services Tax (GSTIN)"
          name="gstNumber"
          value={formData.gstNumber || ""}
          onChange={handleChange}
          placeholder="15-character GSTIN identifier"
          required
          error={formErrors.gstNumber}
        />

        <UIInput
          label="Permanent Account Number (Entity PAN)"
          name="panNumber"
          value={formData.panNumber || ""}
          onChange={handleChange}
          placeholder="10-character corporate PAN"
          required
          error={formErrors.panNumber}
        />
      </div>
    </div>

    <div>
      <FormSectionHeader
        title="Trade & Pharmaceutical Licenses"
        description="Drug controller authorizations for pharmaceutical storage, distribution, and trade."
        icon={FileText}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        <UISelect
          label="License Operational Status"
          name="licenseStatus"
          value={formData.licenseStatus || "active"}
          onChange={(val) =>
            handleChange({ target: { name: "licenseStatus", value: val } })
          }
          options={licenseStatusOptions}
          required
        />

        <UIInput
          label="License Classification Type"
          name="licenseType"
          value={formData.licenseType || ""}
          onChange={handleChange}
          placeholder="e.g. Retail / Wholesale / Manufacturing"
          required
        />

        <UIInput
          label="FSSAI Food License Number"
          name="fssaiNumber"
          value={formData.fssaiNumber || ""}
          onChange={handleChange}
          placeholder="14-digit FSSAI number"
        />

        <UIInput
          label="Retail Drug License (Form 20 / 21)"
          name="retailLicenseNumber"
          value={formData.retailLicenseNumber || ""}
          onChange={handleChange}
          placeholder="e.g. MH-MZ1-123456"
        />

        <div className="md:col-span-2">
          <UIInput
            label="Wholesale Drug License (Form 20B / 21B)"
            name="wholesaleLicenseNumber"
            value={formData.wholesaleLicenseNumber || ""}
            onChange={handleChange}
            placeholder="e.g. MH-MZ1-654321"
          />
        </div>

        <UIInput
          label="License Effective Date"
          name="licenseIssuedAt"
          type="date"
          value={formData.licenseIssuedAt || ""}
          onChange={handleChange}
        />

        <UIInput
          label="License Renewal / Expiry Date"
          name="licenseExpiresAt"
          type="date"
          value={formData.licenseExpiresAt || ""}
          onChange={handleChange}
        />
      </div>
    </div>

    <div className="pt-5 border-t border-border/80 flex items-center justify-between">
      <UIButton
        type="button"
        variant="outline"
        onClick={handleBack}
        startIcon={<ArrowLeft className="size-4" />}
        className="cursor-pointer"
      >
        Back
      </UIButton>
      <UIButton
        type="button"
        variant="primary"
        onClick={handleContinue}
        endIcon={<ArrowRight className="size-4" />}
        className="cursor-pointer font-bold shadow-xs px-5"
      >
        Save & Continue
      </UIButton>
    </div>
  </div>
);

/* ==========================================================================
   STEP 5: REVIEW AND UPDATE SUMMARY
   ========================================================================== */

const ReviewAndUpdateStep = ({
  formData,
  companyTypeOptions,
  industryOptions,
  isUpdating,
  onBack,
  onSubmit,
  onEditSection,
}) => {
  const resolvedTypeLabel =
    companyTypeOptions.find((opt) => opt.value === formData.companyType)?.label ||
    formData.companyType ||
    "Not provided";

  const resolvedIndustryLabel =
    industryOptions.find((opt) => opt.value === formData.industry)?.label ||
    formData.industry ||
    "Not provided";

  return (
    <div className="space-y-5">
      {/* 1. Company Overview Summary Card */}
      <div className="p-4.5 rounded-xl border border-border bg-surface-alt/30">
        <ReviewSectionHeader
          title="Company Overview"
          stepId={1}
          onEdit={onEditSection}
        />

        <div className="mt-4 flex flex-col sm:flex-row items-start gap-4">
          <div className="size-14 shrink-0 rounded-xl border border-border bg-primary/10 text-primary flex items-center justify-center">
            <Building2 className="size-7" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4 className="text-base font-bold text-text truncate">
                {formData.companyName || "Unnamed Company"}
              </h4>
              <UIBadge variant="success">{resolvedIndustryLabel}</UIBadge>
              <UIBadge variant="primary">{resolvedTypeLabel}</UIBadge>
              {formData.status && (
                <UIBadge variant={formData.status === "active" ? "success" : "outline"} className="capitalize">
                  {formData.status}
                </UIBadge>
              )}
            </div>

            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-muted">
              <div className="flex items-center gap-2 truncate">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{formData.companyEmail || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0" />
                <span>{formData.companyPhone ? `+91 ${formData.companyPhone}` : "Not provided"}</span>
              </div>
              {formData.website && (
                <div className="flex items-center gap-2 sm:col-span-2 truncate">
                  <Globe className="size-3.5 shrink-0" />
                  <span className="truncate">{formData.website}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Owner & Address Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ownership Card */}
        <div className="p-4 rounded-xl border border-border bg-surface-alt/30">
          <ReviewSectionHeader
            title="Ownership & KYC"
            stepId={2}
            onEdit={onEditSection}
          />
          <div className="mt-3.5 space-y-2 text-xs">
            <ReviewRowData label="Owner Full Name" value={formData.ownerName || "-"} />
            <ReviewRowData label="Direct Email" value={formData.ownerEmail || "-"} />
            <ReviewRowData label="Direct Mobile" value={formData.ownerMobile ? `+91 ${formData.ownerMobile}` : "-"} />
            <ReviewRowData label="Owner PAN" value={formData.ownerPan || "-"} />
            <ReviewRowData label="Aadhaar (UID)" value={formData.ownerAadhaar || "-"} />
          </div>
        </div>

        {/* Registered Address Card */}
        <div className="p-4 rounded-xl border border-border bg-surface-alt/30">
          <ReviewSectionHeader
            title="Registered Office"
            stepId={3}
            onEdit={onEditSection}
          />
          <div className="mt-3.5 space-y-2 text-xs">
            <ReviewRowData
              label="Address"
              value={`${formData.addressLine1 || "-"} ${formData.addressLine2 || ""}`.trim()}
            />
            <ReviewRowData label="City / District" value={`${formData.city || "-"}, ${formData.district || "-"}`} />
            <ReviewRowData label="State & PIN" value={`${formData.state || "-"} - ${formData.pincode || "-"}`} />
            <ReviewRowData label="Country" value={formData.country || "India"} />
          </div>
        </div>
      </div>

      {/* 3. Statutory Licenses & Tax */}
      <div className="p-4.5 rounded-xl border border-border bg-surface-alt/30">
        <ReviewSectionHeader
          title="Licenses & Statutory Parameters"
          stepId={4}
          onEdit={onEditSection}
        />
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs">
          <ReviewRowData label="Corporate GSTIN" value={formData.gstNumber || "-"} />
          <ReviewRowData label="Entity PAN" value={formData.panNumber || "-"} />
          <ReviewRowData label="License Type" value={formData.licenseType || "-"} />
          <ReviewRowData label="FSSAI Code" value={formData.fssaiNumber || "-"} />
          <ReviewRowData label="Retail License (20/21)" value={formData.retailLicenseNumber || "-"} />
          <ReviewRowData label="Wholesale License (20B/21B)" value={formData.wholesaleLicenseNumber || "-"} />
          <ReviewRowData label="Issued Date" value={formData.licenseIssuedAt || "-"} />
          <ReviewRowData label="Expiry Date" value={formData.licenseExpiresAt || "-"} />
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="pt-5 border-t border-border/80 flex items-center justify-between">
        <UIButton
          type="button"
          variant="outline"
          startIcon={<ArrowLeft className="size-4" />}
          onClick={onBack}
          disabled={isUpdating}
          className="cursor-pointer"
        >
          Back
        </UIButton>
        <UIButton
          type="button"
          variant="primary"
          startIcon={<CheckCircle className="size-4" />}
          onClick={onSubmit}
          isLoading={isUpdating}
          loadingText="Saving Changes..."
          disabled={isUpdating}
          className="cursor-pointer font-bold shadow-xs px-5"
        >
          Save Changes
        </UIButton>
      </div>
    </div>
  );
};

const ReviewSectionHeader = ({ title, stepId, onEdit }) => (
  <div className="flex items-center justify-between pb-2.5 border-b border-border/60">
    <h4 className="text-xs font-bold text-text uppercase tracking-wider">{title}</h4>
    <button
      type="button"
      onClick={() => onEdit(stepId)}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
    >
      <Edit3 className="size-3" />
      <span>Edit</span>
    </button>
  </div>
);

const ReviewRowData = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-text-muted shrink-0">{label}</span>
    <span className="font-semibold text-text text-right truncate max-w-[240px]">{value}</span>
  </div>
);

export default EditCompanyDesktopPage;
