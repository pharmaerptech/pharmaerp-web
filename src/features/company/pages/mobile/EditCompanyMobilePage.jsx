import { memo, useCallback } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiEdit3,
  FiFileText,
  FiMapPin,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiShield,
  FiUploadCloud,
  FiUser,
} from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { LuStore } from "react-icons/lu";

import {
  AppBox,
  AppButton,
  AppCard,
  AppHeading,
  AppInput,
  AppSelect,
  AppStack,
  AppTag,
  AppText,
} from "@/components";

/* ==========================================================================
   MOBILE SKELETON LOADER
   ========================================================================== */

const EditCompanyMobileSkeleton = () => (
  <section className="relative w-full overflow-hidden bg-bg p-3 select-none animate-pulse space-y-3 font-sans">
    {/* Header Title Block Skeleton */}
    <div className="bg-surface border border-border/80 rounded-2xl p-4 space-y-2">
      <div className="h-3 w-20 bg-surface-alt rounded" />
      <div className="flex items-center justify-between">
        <div className="h-6 w-36 bg-surface-alt rounded" />
        <div className="h-7 w-16 bg-surface-alt rounded-md" />
      </div>
      <div className="h-3 w-56 bg-surface-alt/70 rounded mt-1" />
    </div>

    {/* Stepper Skeleton */}
    <div className="bg-surface border border-border/80 rounded-xl p-3 flex items-center justify-between">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-1.5 flex-1 last:flex-none">
          <div className="size-7 rounded-lg bg-surface-alt shrink-0" />
          {i < 5 && <div className="h-0.5 flex-1 bg-surface-alt" />}
        </div>
      ))}
    </div>

    {/* Form Card Skeleton */}
    <div className="bg-surface border border-border/80 rounded-2xl p-4 space-y-4">
      <div className="h-4 w-36 bg-surface-alt rounded" />
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="h-3 w-24 bg-surface-alt/70 rounded" />
          <div className="h-9 w-full bg-surface-alt/50 rounded-lg border border-border/50" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-20 bg-surface-alt/70 rounded" />
          <div className="h-9 w-full bg-surface-alt/50 rounded-lg border border-border/50" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-28 bg-surface-alt/70 rounded" />
          <div className="h-9 w-full bg-surface-alt/50 rounded-lg border border-border/50" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-32 bg-surface-alt/70 rounded" />
          <div className="h-9 w-full bg-surface-alt/50 rounded-lg border border-border/50" />
        </div>
      </div>
      <div className="pt-3 border-t border-border/60 flex items-center justify-between">
        <div className="h-8 w-20 bg-surface-alt/50 rounded-lg" />
        <div className="h-8 w-24 bg-primary/20 rounded-lg" />
      </div>
    </div>
  </section>
);

const EditCompanyMobilePage = memo(
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
    handleSaveDraft,
    handleReload,
  }) => {
    // Synchronize step and fire structural record reloading hook
    const handleResetAndRefresh = useCallback(() => {
      handleStepChange?.(1);
      if (handleReload) {
        handleReload();
      }
    }, [handleReload, handleStepChange]);

    if (isFetching) {
      return <EditCompanyMobileSkeleton />;
    }

    return (
      <section className="relative w-full overflow-hidden bg-bg">
        <AppBox sx={containerSx}>
          {/* Section 1: Step Status Header Title Area */}
          <AppBox sx={headerTitleBlockSx}>
            <AppText variant="caption" weight={700} sx={stepTrackerLabelSx}>
              Step {currentStep} of 5
            </AppText>
            <AppStack
              direction="row"
              align="center"
              justify="space-between"
              fullWidth
            >
              <AppHeading level={1} weight={800} sx={pageTitleSx}>
                {currentStep === 5 ? "Review Modifications" : "Edit Profile"}
              </AppHeading>

              <AppButton
                variant="outlined"
                colorVariant="neutral"
                size="small"
                rounded="md"
                startIcon={
                  <FiRefreshCw className={isFetching ? "animate-spin" : ""} />
                }
                onClick={handleResetAndRefresh}
                disabled={isLoading || isFetching}
                sx={mobileResetBtnSx}
              >
                Reset
              </AppButton>
            </AppStack>
            <AppText variant="body2" weight={500} sx={pageSubtitleSx}>
              {currentStep === 5
                ? "Review modified records before committing changes to database structures."
                : "Modify structural fields, tracking flags, and metrics associated with this company."}
            </AppText>
          </AppBox>

          {/* Section 2: Progress Timeline Workflow Stepper */}
          <MobileWorkflowStepper
            currentStep={currentStep}
            onStepClick={handleStepChange}
          />

          {/* Section 3: Central High-Density Step Form Switcher */}
          <AppBox sx={{ mt: 1.5 }}>
            {formErrors.submit && (
              <AppText variant="body2" sx={submitErrorTextSx}>
                {formErrors.submit}
              </AppText>
            )}

            <>
              {currentStep === 1 && (
                  <MobileStepCompanyDetails
                    formData={formData}
                    formErrors={formErrors}
                    companyTypeOptions={companyTypeOptions}
                    industryOptions={industryOptions}
                    handleChange={handleChange}
                    isLoading={isLoading}
                  />
                )}

                {currentStep === 2 && (
                  <MobileStepOwnerDetails
                    formData={formData}
                    formErrors={formErrors}
                    handleChange={handleChange}
                    isLoading={isLoading}
                  />
                )}

                {currentStep === 3 && (
                  <MobileStepAddressDetails
                    formData={formData}
                    formErrors={formErrors}
                    handleChange={handleChange}
                    isLoading={isLoading}
                  />
                )}

                {currentStep === 4 && (
                  <MobileStepLicenseDetails
                    formData={formData}
                    formErrors={formErrors}
                    licenseStatusOptions={licenseStatusOptions}
                    handleChange={handleChange}
                    isLoading={isLoading}
                  />
                )}

                {currentStep === 5 && (
                  <MobileStepReviewAndSave
                    formData={formData}
                    companyTypeOptions={companyTypeOptions}
                    industryOptions={industryOptions}
                    onEditSection={handleStepChange}
                  />
                )}
              </>
          </AppBox>

          {/* Section 4: Data Security Privacy Advice Card Block */}
          <AppCard
            variant="soft"
            rounded="lg"
            bordered={false}
            shadow="none"
            padding="none"
            sx={securityFooterBannerSx}
          >
            <AppStack direction="row" align="flex-start" gap={1}>
              <FiShield className="text-[15px] text-success mt-0.5 shrink-0" />
              <AppBox sx={{ minWidth: 0 }}>
                <AppText
                  variant="body2"
                  weight={750}
                  sx={securityBannerTitleSx}
                >
                  Encrypted Statutory Logging
                </AppText>
                <AppText variant="body2" weight={500} sx={securityBannerDescSx}>
                  Altering structural fields marks configurations on strict
                  database audit logs.
                </AppText>
              </AppBox>
            </AppStack>
          </AppCard>

          {/* Section 5: Core Form Bottom Presentational Action Bars */}
          <AppBox sx={bottomStickyActionBarSx}>
            {currentStep === 5 ? (
              <AppStack
                direction="row"
                align="center"
                justify="space-between"
                fullWidth
              >
                <AppButton
                  variant="outlined"
                  colorVariant="neutral"
                  rounded="md"
                  startIcon={<FiArrowLeft />}
                  onClick={handleBack}
                  disabled={isLoading}
                  sx={actionButtonLeftSx}
                >
                  Back
                </AppButton>
                <AppButton
                  variant="contained"
                  colorVariant="success"
                  rounded="md"
                  startIcon={<FiCheckCircle />}
                  onClick={handleSubmit}
                  isLoading={isLoading}
                  loadingText="Saving Changes..."
                  disabled={isLoading || isFetching}
                  sx={actionButtonRightSx}
                >
                  Save Changes
                </AppButton>
              </AppStack>
            ) : (
              <AppStack
                direction="row"
                gap={1.2}
                justify="space-between"
                fullWidth
              >
                <AppButton
                  variant="outlined"
                  colorVariant="neutral"
                  rounded="md"
                  onClick={handleSaveDraft}
                  disabled={isLoading}
                  sx={actionButtonCancelSx}
                >
                  Exit
                </AppButton>
                <AppButton
                  variant="contained"
                  colorVariant="success"
                  rounded="md"
                  endIcon={<FiArrowRight />}
                  onClick={handleContinue}
                  disabled={isLoading || isFetching}
                  sx={actionButtonContinueSx}
                >
                  Save & Continue
                </AppButton>
              </AppStack>
            )}
          </AppBox>
        </AppBox>
      </section>
    );
  },
);

EditCompanyMobilePage.displayName = "EditCompanyMobilePage";

/* ==========================================================================
   PRESENTATIONAL STEPPER COMPONENT WITH VERY SHORT LINES (NO-TOUCH DESIGN)
   ========================================================================== */

const MobileWorkflowStepper = ({ currentStep, onStepClick }) => {
  const stepsMeta = [
    { id: 1, title: "Company Details" },
    { id: 2, title: "Business Info" },
    { id: 3, title: "Address" },
    { id: 4, title: "Additional Info" },
    { id: 5, title: "Review & Save" },
  ];

  return (
    <AppBox sx={stepperOuterBoundarySx}>
      <AppBox sx={stepperInnerTrackSx}>
        <AppStack
          direction="row"
          align="center"
          justify="space-between"
          sx={{ width: "100%" }}
        >
          {stepsMeta.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center flex-1 relative"
              >
                {/* Micro Independent Horizontal Connector Line Rails */}
                {idx > 0 && (
                  <div
                    className="absolute"
                    style={{
                      height: "2px",
                      width: "35%",
                      left: "-17.5%",
                      top: "13px",
                      zIndex: 1,
                      backgroundColor:
                        isCompleted || isActive
                          ? "var(--app-color-success, #10b981)"
                          : "var(--app-color-border, #e2e8f0)",
                    }}
                  />
                )}

                <button
                  type="button"
                  onClick={() => onStepClick?.(step.id)}
                  className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all outline-none border-0"
                  style={{
                    backgroundColor: isActive
                      ? "var(--app-color-success, #10b981)"
                      : isCompleted
                        ? "var(--app-color-success-soft, #e6f4ea)"
                        : "var(--app-color-surface-alt, #f8fafc)",
                    color: isActive
                      ? "var(--app-color-text-inverse, #ffffff)"
                      : isCompleted || isActive
                        ? "var(--app-color-success, #10b981)"
                        : "var(--app-color-text-muted, #94a3b8)",
                    border:
                      isCompleted || isActive
                        ? "none"
                        : "1px solid var(--app-color-border, #e2e8f0)",
                  }}
                >
                  {isCompleted ? <FiCheck className="text-[13px]" /> : step.id}
                </button>

                <AppText
                  variant="caption"
                  weight={isActive ? 750 : 550}
                  sx={{
                    ...stepperTitleTextSx,
                    color: isActive
                      ? "var(--app-color-text)"
                      : "var(--app-color-text-muted)",
                  }}
                >
                  {step.title}
                </AppText>
              </div>
            );
          })}
        </AppStack>
      </AppBox>
    </AppBox>
  );
};

/* ==========================================================================
   SUB-MODULE FORMS STEPS (1 - 4 COMPACT RENDER VIEWS)
   ========================================================================== */

const MobileStepCompanyDetails = ({
  formData,
  formErrors,
  companyTypeOptions,
  industryOptions = [],
  handleChange,
  isLoading,
}) => (
  <AppCard
    variant="default"
    rounded="lg"
    bordered
    shadow="none"
    padding="none"
    sx={formCardContainerSx}
  >
    <AppHeading level={3} weight={800} sx={formCardSectionHeaderSx}>
      Company Profile Parameters
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Modify core identifiers and root communications metrics.
    </AppText>

    <AppStack direction="column" gap={1.4} sx={{ mt: 1.8 }}>
      <AppInput
        label="Company Name"
        name="companyName"
        value={formData.companyName || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter company name"
        required
        error={Boolean(formErrors.companyName)}
        helperText={formErrors.companyName}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />

      <AppSelect
        label="Company Type"
        name="companyType"
        value={formData.companyType || ""}
        onChange={handleChange}
        disabled={isLoading}
        options={companyTypeOptions}
        required
        error={Boolean(formErrors.companyType)}
        helperText={formErrors.companyType}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />

      <AppSelect
        label="Industry"
        name="industry"
        value={formData.industry || ""}
        onChange={handleChange}
        disabled={isLoading}
        options={industryOptions}
        required
        error={Boolean(formErrors.industry)}
        helperText={formErrors.industry}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />

      <AppInput
        label="Email Address"
        name="companyEmail"
        value={formData.companyEmail || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter email address"
        error={Boolean(formErrors.companyEmail)}
        helperText={formErrors.companyEmail}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />

      <AppBox>
        <AppStack
          direction="row"
          align="center"
          justify="space-between"
          fullWidth
        >
          <AppText sx={mobileLabelSx}>Phone Number</AppText>
        </AppStack>
        <AppStack direction="row" gap={0.8} sx={{ mt: 0.45 }}>
          <AppBox sx={{ width: 85 }}>
            <AppSelect
              name="countryCode"
              value="India (+91)"
              options={[{ label: "🇮🇳 +91", value: "India (+91)" }]}
              disabled
              inputSx={mobileInputSx}
            />
          </AppBox>
          <AppBox sx={{ flex: 1 }}>
            <AppInput
              name="companyPhone"
              value={formData.companyPhone || ""}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Enter phone number"
              error={Boolean(formErrors.companyPhone)}
              helperText={formErrors.companyPhone}
              inputSx={mobileInputSx}
            />
          </AppBox>
        </AppStack>
      </AppBox>

      <AppInput
        label="Website (Optional)"
        name="website"
        value={formData.website || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="https://www.company.com"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />

      <AppBox sx={{ mt: 0.25 }}>
        <AppText sx={mobileLabelSx}>Company Logo (Optional)</AppText>
        <AppBox sx={logoUploadContainerSx}>
          <AppStack
            direction="row"
            align="center"
            justify="space-between"
            fullWidth
          >
            <AppStack direction="row" align="center" gap={1}>
              <FiUploadCloud className="text-[20px] text-text-muted shrink-0" />
              <AppBox>
                <AppText
                  variant="body2"
                  weight={750}
                  sx={{ fontSize: "11.5px", color: "var(--app-color-text)" }}
                >
                  Replace company logo
                </AppText>
                <AppText
                  variant="caption"
                  sx={{
                    fontSize: "10px",
                    color: "var(--app-color-text-muted)",
                  }}
                >
                  PNG, JPG or SVG (Max. 2MB)
                </AppText>
              </AppBox>
            </AppStack>
            <div className="flex items-center gap-2">
              <AppBox sx={logoIconDisplayBoxSx}>
                <LuStore />
              </AppBox>
            </div>
          </AppStack>
        </AppBox>
      </AppBox>
    </AppStack>
  </AppCard>
);

const MobileStepOwnerDetails = ({
  formData,
  formErrors,
  handleChange,
  isLoading,
}) => (
  <AppCard
    variant="default"
    rounded="lg"
    bordered
    shadow="none"
    padding="none"
    sx={formCardContainerSx}
  >
    <AppHeading level={3} weight={800} sx={formCardSectionHeaderSx}>
      Individual Accountability Indicators
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Configure unique owner fields mapping background entity models.
    </AppText>

    <AppStack direction="column" gap={1.4} sx={{ mt: 1.8 }}>
      <AppInput
        label="Owner Name"
        name="ownerName"
        value={formData.ownerName || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter operator/owner full name"
        startIcon={<FiUser />}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Owner Email"
        name="ownerEmail"
        value={formData.ownerEmail || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="owner@company.com"
        error={Boolean(formErrors.ownerEmail)}
        helperText={formErrors.ownerEmail}
        startIcon={<FiMail />}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Owner Mobile"
        name="ownerMobile"
        value={formData.ownerMobile || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter 10-digit mobile number"
        error={Boolean(formErrors.ownerMobile)}
        helperText={formErrors.ownerMobile}
        startIcon={<FiPhone />}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Owner Aadhaar"
        name="ownerAadhaar"
        value={formData.ownerAadhaar || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter 12-digit UIDAI record"
        error={Boolean(formErrors.ownerAadhaar)}
        helperText={formErrors.ownerAadhaar}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Owner PAN"
        name="ownerPan"
        value={formData.ownerPan || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter uppercase account card code"
        error={Boolean(formErrors.ownerPan)}
        helperText={formErrors.ownerPan}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
    </AppStack>
  </AppCard>
);

const MobileStepAddressDetails = ({
  formData,
  formErrors,
  handleChange,
  isLoading,
}) => (
  <AppCard
    variant="default"
    rounded="lg"
    bordered
    shadow="none"
    padding="none"
    sx={formCardContainerSx}
  >
    <AppHeading level={3} weight={800} sx={formCardSectionHeaderSx}>
      Registered Spatial Boundaries
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Define localized coordinate points required for transaction prints.
    </AppText>

    <AppStack direction="column" gap={1.4} sx={{ mt: 1.8 }}>
      <AppInput
        label="Address Line 1"
        name="addressLine1"
        value={formData.addressLine1 || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Flat/Plot, Building, Street name"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Address Line 2"
        name="addressLine2"
        value={formData.addressLine2 || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Locality, Sector, Landmark (Optional)"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="City"
        name="city"
        value={formData.city || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter city"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="District"
        name="district"
        value={formData.district || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter district"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="State"
        name="state"
        value={formData.state || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter state"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Pincode"
        name="pincode"
        value={formData.pincode || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter 6-digit postal code"
        error={Boolean(formErrors.pincode)}
        helperText={formErrors.pincode}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Country"
        name="country"
        value={formData.country || "India"}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Country name"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
    </AppStack>
  </AppCard>
);

const MobileStepLicenseDetails = ({
  formData,
  formErrors,
  licenseStatusOptions,
  handleChange,
  isLoading,
}) => (
  <AppCard
    variant="default"
    rounded="lg"
    bordered
    shadow="none"
    padding="none"
    sx={formCardContainerSx}
  >
    <AppHeading level={3} weight={800} sx={formCardSectionHeaderSx}>
      Statutory Registry Fields
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Configure industry legal tracking parameters and verification targets.
    </AppText>

    <AppStack direction="column" gap={1.4} sx={{ mt: 1.8 }}>
      <AppInput
        label="GSTIN"
        name="gstNumber"
        value={formData.gstNumber || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter 15-digit corporate GSTIN"
        error={Boolean(formErrors.gstNumber)}
        helperText={formErrors.gstNumber}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="PAN Number"
        name="panNumber"
        value={formData.panNumber || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter 10-character root PAN"
        error={Boolean(formErrors.panNumber)}
        helperText={formErrors.panNumber}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="License Type"
        name="licenseType"
        value={formData.licenseType || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="e.g. Drug License"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="FSSAI Number"
        name="fssaiNumber"
        value={formData.fssaiNumber || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter 14-digit FSSAI record"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Retail License Number"
        name="retailLicenseNumber"
        value={formData.retailLicenseNumber || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Form 20 / Form 21 identifiers"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Wholesale License Number"
        name="wholesaleLicenseNumber"
        value={formData.wholesaleLicenseNumber || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Form 20B / Form 21B identifiers"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Issued At"
        name="licenseIssuedAt"
        value={formData.licenseIssuedAt || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="YYYY-MM-DD"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Expires At"
        name="licenseExpiresAt"
        value={formData.licenseExpiresAt || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="YYYY-MM-DD"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppSelect
        label="License Status"
        name="licenseStatus"
        value={formData.licenseStatus || ""}
        onChange={handleChange}
        disabled={isLoading}
        options={licenseStatusOptions}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
    </AppStack>
  </AppCard>
);

/* ==========================================================================
   STEP 5: HIGH-DENSITY AUDIT REVIEW MODULE (PERSISTENT DATA FIELDS RENDER)
   ========================================================================== */

const MobileStepReviewAndSave = ({
  formData,
  companyTypeOptions,
  industryOptions = [],
  onEditSection,
}) => {
  const resolvedType =
    companyTypeOptions.find((opt) => opt.value === formData.companyType)
      ?.label ||
    formData.companyType ||
    "";

  const resolvedIndustry =
    industryOptions.find((opt) => opt.value === formData.industry)?.label ||
    formData.industry ||
    "";

  return (
    <AppCard
      variant="default"
      rounded="lg"
      bordered
      shadow="none"
      padding="none"
      sx={formCardContainerSx}
    >
      <AppStack
        direction="row"
        align="center"
        justify="space-between"
        fullWidth
        sx={{ borderBottom: "1px solid var(--app-color-border)", pb: 1 }}
      >
        <AppHeading
          level={3}
          weight={800}
          sx={{ m: 0, fontSize: "14px", color: "var(--app-color-text)" }}
        >
          Audit Changes Summary
        </AppHeading>
        <AppButton
          variant="outlined"
          colorVariant="neutral"
          size="small"
          rounded="md"
          startIcon={<FiEdit3 />}
          onClick={() => onEditSection?.(1)}
          sx={editReviewSectionBtnSx}
        >
          Edit
        </AppButton>
      </AppStack>

      {/* Review Block 1: Company Profile Summary */}
      <AppBox sx={reviewBlockContainerSx}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <HiOutlineBuildingOffice2 />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Company Core Details
          </AppText>
          <AppTag
            label={formData.status || "active"}
            variant="soft"
            colorVariant="warning"
            rounded="md"
            sx={{ height: 16, fontSize: "9px", px: 0.5, ml: "auto" }}
          />
        </AppStack>
        <AppStack direction="column" gap={0.8}>
          <ReviewGridRow label="Company Name" value={formData.companyName} />
          <ReviewGridRow label="Company Type" value={resolvedType} />
          <ReviewGridRow label="Industry" value={resolvedIndustry} />
          <ReviewGridRow label="Email Address" value={formData.companyEmail} />
          <ReviewGridRow
            label="Phone Number"
            value={formData.companyPhone ? `+91 ${formData.companyPhone}` : ""}
          />
          <ReviewGridRow label="Website" value={formData.website} />
        </AppStack>
      </AppBox>

      {/* Review Block 2: Individual Accountability Details */}
      <AppBox sx={reviewBlockContainerSx}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <FiUser />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Ownership Records
          </AppText>
        </AppStack>
        <AppStack direction="column" gap={0.8}>
          <ReviewGridRow label="Owner Full Name" value={formData.ownerName} />
          <ReviewGridRow label="Owner Email" value={formData.ownerEmail} />
          <ReviewGridRow label="Owner Mobile" value={formData.ownerMobile} />
          <ReviewGridRow label="Owner Aadhaar" value={formData.ownerAadhaar} />
          <ReviewGridRow label="Owner PAN" value={formData.ownerPan} />
        </AppStack>
      </AppBox>

      {/* Review Block 3: Spatial Workplace Parameters */}
      <AppBox sx={reviewBlockContainerSx}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <FiMapPin />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Registered Workplace spatial
          </AppText>
        </AppStack>
        <AppStack direction="column" gap={0.8}>
          <ReviewGridRow
            label="Address Coordinates"
            value={
              formData.addressLine1
                ? `${formData.addressLine1}${formData.addressLine2 ? `, ${formData.addressLine2}` : ""}`
                : ""
            }
          />
          <ReviewGridRow label="City Index" value={formData.city} />
          <ReviewGridRow label="District Record" value={formData.district} />
          <ReviewGridRow label="State Code" value={formData.state} />
          <ReviewGridRow label="PIN Code" value={formData.pincode} />
          <ReviewGridRow label="Country Boundary" value={formData.country} />
        </AppStack>
      </AppBox>

      {/* Review Block 4: Statutory Operational Tracking */}
      <AppBox sx={reviewBlockContainerSx}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <FiFileText />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Licenses compliance Indexes
          </AppText>
        </AppStack>
        <AppStack direction="column" gap={0.8}>
          <ReviewGridRow label="GSTIN Code" value={formData.gstNumber} />
          <ReviewGridRow label="Root PAN Card" value={formData.panNumber} />
          <ReviewGridRow label="License Scheme" value={formData.licenseType} />
          <ReviewGridRow label="FSSAI Code" value={formData.fssaiNumber} />
          <ReviewGridRow
            label="Retail Reference"
            value={formData.retailLicenseNumber}
          />
          <ReviewGridRow
            label="Wholesale Reference"
            value={formData.wholesaleLicenseNumber}
          />
          <ReviewGridRow
            label="Issued At Date"
            value={formData.licenseIssuedAt}
          />
          <ReviewGridRow
            label="Expires At Date"
            value={formData.licenseExpiresAt}
          />
          <ReviewGridRow
            label="License Status"
            value={
              <span className="uppercase text-success font-bold">
                {formData.licenseStatus}
              </span>
            }
          />
        </AppStack>
      </AppBox>
    </AppCard>
  );
};

const ReviewGridRow = ({ label, value }) => {
  const resolvedValue =
    value === undefined || value === null ? "" : String(value);
  return (
    <div className="grid grid-cols-[135px_1fr] items-start gap-1 text-[11.8px] leading-normal">
      <span className="text-text-muted font-semibold whitespace-nowrap">
        {label}
      </span>
      <span className="text-text font-bold text-left px-0.5 break-words">
        {resolvedValue}
      </span>
    </div>
  );
};

/* ==========================================================================
   STYLE TOKEN DICTIONARY DEFINITIONS (HIGH-DENSITY COMPACT BLUEPRINT)
   ========================================================================== */

const containerSx = {
  width: "100%",
  maxWidth: { xs: 430, sm: 460 },
  mx: "auto",
  px: 0,
  pt: 0,
  pb: 0,
};

const headerTitleBlockSx = {
  pt: 1.2,
  pb: 0.5,
};

const stepTrackerLabelSx = {
  fontSize: "11px",
  color: "var(--app-color-success, #10b981)",
  textTransform: "uppercase",
  letterSpacing: "0.2px",
};

const pageTitleSx = {
  m: 0,
  mt: 0.25,
  fontSize: "21px",
  fontWeight: 800,
  lineHeight: 1.2,
  letterSpacing: "-0.5px",
  color: "var(--app-color-text)",
};

const pageSubtitleSx = {
  mt: 0.4,
  fontSize: "11.5px",
  lineHeight: "16px",
  color: "var(--app-color-text-muted)",
};

const mobileResetBtnSx = {
  height: 26,
  px: 1,
  fontSize: "10.5px",
  fontWeight: 700,
  borderColor: "var(--app-color-border)",
};

const stepperOuterBoundarySx = {
  mt: 1.6,
  mb: 1.4,
  width: "100%",
  display: "flex",
  justifyContent: "center",
};

const stepperInnerTrackSx = {
  width: "100%",
};

const stepperTitleTextSx = {
  mt: 0.6,
  fontSize: "8.5px",
  textAlign: "center",
  lineHeight: 1.1,
  whiteSpace: "nowrap",
};

const submitErrorTextSx = {
  mb: 1,
  fontSize: "11.5px",
  fontWeight: 700,
  color: "var(--app-color-error)",
};

const formCardContainerSx = {
  p: 1.4,
  bgcolor: "var(--app-color-surface)",
  border: "1px solid var(--app-color-border)",
};

const formCardSectionHeaderSx = {
  m: 0,
  fontSize: "13.5px",
  color: "var(--app-color-text)",
};

const formCardSectionDescSx = {
  mt: 0.25,
  fontSize: "11px",
  color: "var(--app-color-text-muted)",
};

const mobileLabelSx = {
  mb: 0.45,
  fontSize: "11.8px",
  fontWeight: 750,
  color: "var(--app-color-text)",
};

const mobileInputSx = {
  height: 40,
  fontSize: "12px",
  bgcolor: "var(--app-color-surface)",
  color: "var(--app-color-text)",
  "& input::placeholder": {
    fontSize: "12px",
  },
};

const logoUploadContainerSx = {
  mt: 0.4,
  p: 0.85,
  borderRadius: "8px",
  border: "1px dashed var(--app-color-border)",
  bgcolor: "var(--app-color-surface-alt)",
};

const logoIconDisplayBoxSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 38,
  height: 38,
  borderRadius: "8px",
  bgcolor: "var(--app-color-success-soft)",
  color: "var(--app-color-success)",
  fontSize: "18px",
};

const securityFooterBannerSx = {
  mt: 1.5,
  p: 1,
  bgcolor: "var(--app-color-readonly-bg, #f8fafc)",
  border: "1px dashed var(--app-color-border)",
};

const securityBannerTitleSx = {
  fontSize: "11px",
  color: "var(--app-color-text)",
  lineHeight: 1.2,
};

const securityBannerDescSx = {
  mt: 0.15,
  fontSize: "10px",
  color: "var(--app-color-text-muted)",
  lineHeight: 1.3,
};

const reviewBlockContainerSx = {
  borderBottom: "1px solid var(--app-color-divider)",
  py: 1.25,
};

const editReviewSectionBtnSx = {
  height: 25,
  fontSize: "10.5px",
  px: 1,
  fontWeight: 700,
  borderColor: "var(--app-color-border)",
};

const reviewHeaderIconTrackSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 25,
  height: 25,
  borderRadius: "50%",
  bgcolor: "var(--app-color-primary-soft)",
  color: "var(--app-color-primary)",
  fontSize: "12px",
};

const reviewBlockHeaderTitleSx = {
  m: 0,
  fontSize: "12px",
  color: "var(--app-color-text)",
};

const bottomStickyActionBarSx = {
  mt: 2.2,
  mb: 1.5,
  width: "100%",
};

const actionButtonCancelSx = {
  height: 40,
  flex: 0.3,
  fontSize: "12px",
  fontWeight: 700,
};

const actionButtonContinueSx = {
  height: 40,
  flex: 0.7,
  fontSize: "12px",
  fontWeight: 750,
  boxShadow: "none",
};

const actionButtonLeftSx = {
  height: 40,
  width: "auto",
  px: 2.2,
  fontSize: "12px",
  fontWeight: 700,
};

const actionButtonRightSx = {
  height: 40,
  width: "auto",
  px: 2.2,
  fontSize: "12px",
  fontWeight: 750,
  boxShadow: "none",
};

export default EditCompanyMobilePage;
