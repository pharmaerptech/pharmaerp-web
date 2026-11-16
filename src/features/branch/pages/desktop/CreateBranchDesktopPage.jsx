// src/features/branch/pages/desktop/CreateBranchDesktopPage.jsx

import { memo, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  CheckCircle2,
  Edit3,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Building2,
  Scale,
  Sparkles,
  Stethoscope,
  User,
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
    title: "Branch Profile",
    subtitle: "Branch identity, type & contact channels",
    icon: Building2,
  },
  {
    id: 2,
    title: "Registered Address",
    subtitle: "Physical location, district & PIN code",
    icon: MapPin,
  },
  {
    id: 3,
    title: "Statutory Licenses",
    subtitle: "Drug controller & FSSAI licenses",
    icon: Scale,
  },
  {
    id: 4,
    title: "Compliance Contacts",
    subtitle: "Registered pharmacist & emergency contact",
    icon: Stethoscope,
  },
  {
    id: 5,
    title: "Review & Create",
    subtitle: "Final verification & branch initialization",
    icon: CheckCircle2,
  },
];

const CreateBranchDesktopPage = memo(
  ({
    formData,
    formErrors = {},
    isLoading = false,
    currentStep = 1,

    branchTypeOptions = [],
    booleanOptions = [],

    handleChange,
    handleSubmit,
    handleBack,
    handleContinue,
    handleStepChange,
    handleCancel,
    handleResetAndRefresh,
  }) => {
    // Auto-scroll to the top of the form area when navigating between steps
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentStep]);

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
                      Create Branch
                    </h2>
                    <p className="text-[11px] text-text-muted truncate">
                      Physical branch & pharmacy unit setup
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
                    loading={isLoading}
                    disabled={isLoading}
                    startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
                    className="h-8 px-2.5 text-xs font-medium text-text-muted hover:text-text cursor-pointer w-full justify-center"
                  >
                    Reset Form
                  </UIButton>
                </div>
              </div>

              {/* Informational Guidance Badge */}
              <div className="p-3.5 rounded-xl bg-surface border border-border/80 shadow-2xs flex items-start gap-2.5">
                <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Branch statutory records and drug licenses are verified under state pharmacy council regulations.
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
                      <BranchDetailsForm
                        formData={formData}
                        formErrors={formErrors}
                        branchTypeOptions={branchTypeOptions}
                        booleanOptions={booleanOptions}
                        handleChange={handleChange}
                        handleCancel={handleCancel}
                        handleContinue={handleContinue}
                      />
                    )}

                    {currentStep === 2 && (
                      <AddressForm
                        formData={formData}
                        formErrors={formErrors}
                        handleChange={handleChange}
                        handleBack={handleBack}
                        handleContinue={handleContinue}
                      />
                    )}

                    {currentStep === 3 && (
                      <LicenseForm
                        formData={formData}
                        formErrors={formErrors}
                        handleChange={handleChange}
                        handleBack={handleBack}
                        handleContinue={handleContinue}
                      />
                    )}

                    {currentStep === 4 && (
                      <ComplianceContactsForm
                        formData={formData}
                        formErrors={formErrors}
                        handleChange={handleChange}
                        handleBack={handleBack}
                        handleContinue={handleContinue}
                      />
                    )}

                    {currentStep === 5 && (
                      <ReviewAndCreateStep
                        formData={formData}
                        branchTypeOptions={branchTypeOptions}
                        isCreating={isLoading}
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

CreateBranchDesktopPage.displayName = "CreateBranchDesktopPage";

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
   STEP 1: BRANCH DETAILS FORM
   ========================================================================== */

const BranchDetailsForm = ({
  formData,
  formErrors,
  branchTypeOptions,
  booleanOptions,
  handleChange,
  handleCancel,
  handleContinue,
}) => (
  <div className="space-y-6">
    {/* Section 1: Core Profile */}
    <div>
      <FormSectionHeader
        title="Branch Core Profile"
        description="Provide naming structures, operation type, and primary location mapping."
        icon={Building2}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        <div className="md:col-span-2">
          <UIInput
            label="Branch Name"
            name="branchName"
            value={formData.branchName || ""}
            onChange={handleChange}
            placeholder="e.g. MedPlus Pharmacy - Andheri West"
            required
            error={formErrors.branchName}
          />
        </div>

        <UISelect
          label="Branch Type"
          name="branchType"
          value={formData.branchType || ""}
          onChange={(val) =>
            handleChange({ target: { name: "branchType", value: val } })
          }
          options={branchTypeOptions}
          required
          error={formErrors.branchType}
        />

        <UISelect
          label="Primary Headquarters / Main Branch Flag"
          name="isPrimary"
          value={formData.isPrimary || "false"}
          onChange={(val) =>
            handleChange({ target: { name: "isPrimary", value: val } })
          }
          options={booleanOptions}
          required
          error={formErrors.isPrimary}
        />
      </div>
    </div>

    {/* Section 2: Contact Details */}
    <div>
      <FormSectionHeader
        title="Contact & Communication Details"
        description="Official communication channels for this specific branch unit."
        icon={Phone}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        <div className="md:col-span-2">
          <UIInput
            label="Branch Email Address"
            name="branchEmail"
            value={formData.branchEmail || ""}
            onChange={handleChange}
            placeholder="branch@company.com"
            error={formErrors.branchEmail}
            startIcon={<Mail className="text-text-muted size-4" />}
          />
        </div>

        <UIInput
          label="Mobile Number"
          name="mobile"
          value={formData.mobile || ""}
          onChange={handleChange}
          placeholder="10-digit mobile number"
          required
          error={formErrors.mobile}
          startIcon={<Phone className="text-text-muted size-4" />}
        />

        <UIInput
          label="WhatsApp Number"
          name="whatsapp"
          value={formData.whatsapp || ""}
          onChange={handleChange}
          placeholder="WhatsApp contact"
          error={formErrors.whatsapp}
          startIcon={<Phone className="text-text-muted size-4" />}
        />

        <div className="md:col-span-2">
          <UIInput
            label="Landline Number (Optional)"
            name="landline"
            value={formData.landline || ""}
            onChange={handleChange}
            placeholder="e.g. 022-26789123"
          />
        </div>
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
   STEP 2: ADDRESS FORM
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
        title="Registered Branch Address"
        description="Physical location bound to invoices, delivery consignments, and tax reporting."
        icon={MapPin}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        <div className="md:col-span-2">
          <UIInput
            label="Address Line 1"
            name="addressLine1"
            value={formData.addressLine1 || ""}
            onChange={handleChange}
            placeholder="Shop/Unit No, Building, Street name"
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
            placeholder="Locality, Sector, Landmark"
          />
        </div>

        <UIInput
          label="City / Town"
          name="city"
          value={formData.city || ""}
          onChange={handleChange}
          placeholder="Enter City"
          required
          error={formErrors.city}
        />

        <UIInput
          label="District"
          name="district"
          value={formData.district || ""}
          onChange={handleChange}
          placeholder="Enter District"
          required
          error={formErrors.district}
        />

        <UIInput
          label="State"
          name="state"
          value={formData.state || ""}
          onChange={handleChange}
          placeholder="Enter State"
          required
          error={formErrors.state}
        />

        <UIInput
          label="PIN Code"
          name="pincode"
          value={formData.pincode || ""}
          onChange={handleChange}
          placeholder="6-digit postal index"
          required
          error={formErrors.pincode}
        />

        <UIInput
          label="Country"
          name="country"
          value={formData.country || "India"}
          onChange={handleChange}
          placeholder="India"
          disabled
        />

        <UIInput
          label="Google Map Location Link (Optional)"
          name="googleMapLocation"
          value={formData.googleMapLocation || ""}
          onChange={handleChange}
          placeholder="https://maps.google.com/..."
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
   STEP 3: STATUTORY LICENSES FORM
   ========================================================================== */

const LicenseForm = ({
  formData,
  formErrors,
  handleChange,
  handleBack,
  handleContinue,
}) => (
  <div className="space-y-6">
    <div>
      <FormSectionHeader
        title="Statutory Compliance Licenses"
        description="Configure trackable pharmacy compliance licenses and regulatory credentials."
        icon={Scale}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        <UIInput
          label="Drug License Number"
          name="drugLicenseNumber"
          value={formData.drugLicenseNumber || ""}
          onChange={handleChange}
          placeholder="Form 20 / Form 21 identifiers"
          error={formErrors.drugLicenseNumber}
        />

        <UIInput
          label="Drug License Classification"
          name="drugLicenseType"
          value={formData.drugLicenseType || ""}
          onChange={handleChange}
          placeholder="e.g. Retail / Wholesale"
          error={formErrors.drugLicenseType}
        />

        <UIInput
          label="FSSAI License Number"
          name="fssaiNumber"
          value={formData.fssaiNumber || ""}
          onChange={handleChange}
          placeholder="14-digit food safety registration"
          error={formErrors.fssaiNumber}
        />

        <UIInput
          label="License Expiry Date"
          name="licenseExpiresAt"
          type="date"
          value={formData.licenseExpiresAt || ""}
          onChange={handleChange}
          error={formErrors.licenseExpiresAt}
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
   STEP 4: COMPLIANCE CONTACTS FORM
   ========================================================================== */

const ComplianceContactsForm = ({
  formData,
  formErrors,
  handleChange,
  handleBack,
  handleContinue,
}) => (
  <div className="space-y-6">
    {/* Pharmacist Parameters */}
    <div>
      <FormSectionHeader
        title="Registered Pharmacist"
        description="Designated licensed practitioner accountable for prescription dispensing and drug storage."
        icon={Stethoscope}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        <UIInput
          label="Registered Pharmacist Name"
          name="pharmacistName"
          value={formData.pharmacistName || ""}
          onChange={handleChange}
          placeholder="Full name matching council records"
          error={formErrors.pharmacistName}
        />

        <UIInput
          label="Pharmacy Council Reg Number"
          name="pharmacistRegistrationNumber"
          value={formData.pharmacistRegistrationNumber || ""}
          onChange={handleChange}
          placeholder="State council registration index"
          error={formErrors.pharmacistRegistrationNumber}
        />

        <UIInput
          label="Pharmacist Mobile"
          name="pharmacistMobile"
          value={formData.pharmacistMobile || ""}
          onChange={handleChange}
          placeholder="Pharmacist phone number"
          error={formErrors.pharmacistMobile}
          startIcon={<Phone className="text-text-muted size-4" />}
        />

        <UIInput
          label="Pharmacist Email"
          name="pharmacistEmail"
          value={formData.pharmacistEmail || ""}
          onChange={handleChange}
          placeholder="pharmacist@company.com"
          error={formErrors.pharmacistEmail}
          startIcon={<Mail className="text-text-muted size-4" />}
        />
      </div>
    </div>

    {/* Emergency Contact */}
    <div>
      <FormSectionHeader
        title="Emergency Contact Link"
        description="Backup emergency contact for operational incidents and facility access."
        icon={User}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
        <div className="md:col-span-2">
          <UIInput
            label="Emergency Contact Name"
            name="emergencyContactName"
            value={formData.emergencyContactName || ""}
            onChange={handleChange}
            placeholder="Full legal name"
            error={formErrors.emergencyContactName}
          />
        </div>

        <UIInput
          label="Contact Mobile"
          name="emergencyContactMobile"
          value={formData.emergencyContactMobile || ""}
          onChange={handleChange}
          placeholder="10-digit emergency phone"
          error={formErrors.emergencyContactMobile}
          startIcon={<Phone className="text-text-muted size-4" />}
        />

        <UIInput
          label="Relationship / Role"
          name="emergencyContactRelationship"
          value={formData.emergencyContactRelationship || ""}
          onChange={handleChange}
          placeholder="e.g. Branch Manager / Assistant"
          error={formErrors.emergencyContactRelationship}
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
        Continue to Review
      </UIButton>
    </div>
  </div>
);

/* ==========================================================================
   STEP 5: REVIEW AND CREATE SUMMARY
   ========================================================================== */

const ReviewAndCreateStep = ({
  formData,
  branchTypeOptions,
  isCreating,
  onBack,
  onSubmit,
  onEditSection,
}) => {
  const resolvedTypeLabel =
    branchTypeOptions.find((opt) => opt.value === formData.branchType)?.label ||
    formData.branchType ||
    "Not provided";

  return (
    <div className="space-y-5">
      {/* 1. Branch Overview Summary Card */}
      <div className="p-4.5 rounded-xl border border-border bg-surface-alt/30">
        <ReviewSectionHeader
          title="Branch Overview"
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
                {formData.branchName || "Unnamed Branch"}
              </h4>
              <UIBadge variant="primary">{resolvedTypeLabel}</UIBadge>
              {formData.isPrimary === "true" && (
                <UIBadge variant="success">Primary Branch</UIBadge>
              )}
            </div>

            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-muted">
              <div className="flex items-center gap-2 truncate">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{formData.branchEmail || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0" />
                <span>{formData.mobile ? `+91 ${formData.mobile}` : "Not provided"}</span>
              </div>
              {formData.whatsapp && (
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0" />
                  <span>WhatsApp: {formData.whatsapp}</span>
                </div>
              )}
              {formData.landline && (
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0" />
                  <span>Landline: {formData.landline}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Registered Address & Statutory Licenses Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Address Card */}
        <div className="p-4 rounded-xl border border-border bg-surface-alt/30">
          <ReviewSectionHeader
            title="Registered Address"
            stepId={2}
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

        {/* Licenses Card */}
        <div className="p-4 rounded-xl border border-border bg-surface-alt/30">
          <ReviewSectionHeader
            title="Statutory Licenses"
            stepId={3}
            onEdit={onEditSection}
          />
          <div className="mt-3.5 space-y-2 text-xs">
            <ReviewRowData label="Drug License" value={formData.drugLicenseNumber || "-"} />
            <ReviewRowData label="License Type" value={formData.drugLicenseType || "-"} />
            <ReviewRowData label="FSSAI Code" value={formData.fssaiNumber || "-"} />
            <ReviewRowData label="Expiry Date" value={formData.licenseExpiresAt || "-"} />
          </div>
        </div>
      </div>

      {/* 3. Compliance Contacts Card */}
      <div className="p-4.5 rounded-xl border border-border bg-surface-alt/30">
        <ReviewSectionHeader
          title="Compliance & Emergency Contacts"
          stepId={4}
          onEdit={onEditSection}
        />
        <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs">
          <ReviewRowData label="Pharmacist Name" value={formData.pharmacistName || "-"} />
          <ReviewRowData label="Registration Number" value={formData.pharmacistRegistrationNumber || "-"} />
          <ReviewRowData label="Pharmacist Mobile" value={formData.pharmacistMobile || "-"} />
          <ReviewRowData label="Pharmacist Email" value={formData.pharmacistEmail || "-"} />
          <ReviewRowData label="Emergency Contact" value={formData.emergencyContactName || "-"} />
          <ReviewRowData label="Emergency Mobile" value={formData.emergencyContactMobile || "-"} />
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="pt-5 border-t border-border/80 flex items-center justify-between">
        <UIButton
          type="button"
          variant="outline"
          startIcon={<ArrowLeft className="size-4" />}
          onClick={onBack}
          disabled={isCreating}
          className="cursor-pointer"
        >
          Back
        </UIButton>
        <UIButton
          type="button"
          variant="primary"
          startIcon={<CheckCircle className="size-4" />}
          onClick={onSubmit}
          isLoading={isCreating}
          loadingText="Creating Branch..."
          disabled={isCreating}
          className="cursor-pointer font-bold shadow-xs px-5"
        >
          Create Branch
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

export default CreateBranchDesktopPage;
