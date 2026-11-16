import { memo, useCallback } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiEdit3,
  FiFileText,
  FiMapPin,
  FiRefreshCw,
  FiShield,
  FiUser,
} from "react-icons/fi";

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

const EditBranchMobileSkeleton = () => (
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

const EditBranchMobilePage = memo(
  ({
    formData,
    formErrors = {},
    isLoading = false,
    isDataFetching = false,
    isFetching = false,
    currentStep = 1,
    branchCode = "",

    branchTypeOptions = [],
    booleanOptions = [],
    statusOptions = [],

    handleChange,
    handleSubmit,
    handleBack,
    handleContinue,
    handleStepChange,
    handleSaveDraft,
    handleReload,
  }) => {
    const isBusyFetching = isDataFetching || isFetching;

    // Reset wizard sequence and trigger live record reloading handler
    const handleResetAndRefresh = useCallback(() => {
      handleStepChange?.(1);
      if (handleReload) {
        handleReload();
      }
    }, [handleReload, handleStepChange]);

    if (isBusyFetching) {
      return <EditBranchMobileSkeleton />;
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
                {currentStep === 5 ? "Review & Deploy" : "Edit Branch"}
              </AppHeading>

              <AppButton
                variant="outlined"
                colorVariant="neutral"
                size="small"
                rounded="md"
                startIcon={
                  <FiRefreshCw
                    className={isDataFetching ? "animate-spin" : ""}
                  />
                }
                onClick={handleResetAndRefresh}
                disabled={isLoading || isDataFetching}
                sx={mobileResetBtnSx}
              >
                Reset
              </AppButton>
            </AppStack>
            <AppText variant="body2" weight={500} sx={pageSubtitleSx}>
              {currentStep === 5
                ? "Review updated parameters, status tags, and structural boundaries before updating."
                : "Modify spatial addresses, drug/food statutory logs, and live operational properties."}
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

            {currentStep === 1 && (
              <MobileStepBranchDetails
                formData={formData}
                formErrors={formErrors}
                branchTypeOptions={branchTypeOptions}
                booleanOptions={booleanOptions}
                statusOptions={statusOptions}
                handleChange={handleChange}
                isLoading={isLoading}
              />
            )}

            {currentStep === 2 && (
              <MobileStepAddressDetails
                formData={formData}
                formErrors={formErrors}
                handleChange={handleChange}
                isLoading={isLoading}
              />
            )}

            {currentStep === 3 && (
              <MobileStepLicenseDetails
                formData={formData}
                formErrors={formErrors}
                handleChange={handleChange}
                isLoading={isLoading}
              />
            )}

            {currentStep === 4 && (
              <MobileStepComplianceContacts
                formData={formData}
                formErrors={formErrors}
                handleChange={handleChange}
                isLoading={isLoading}
              />
            )}

            {currentStep === 5 && (
              <MobileStepReviewAndDeploy
                formData={formData}
                branchCode={branchCode}
                branchTypeOptions={branchTypeOptions}
                onEditSection={handleStepChange}
              />
            )}
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
                  Database Mutator Logging Active
                </AppText>
                <AppText variant="body2" weight={500} sx={securityBannerDescSx}>
                  Executing configuration updates commits structured change
                  tracking delta onto governance history files.
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
                  loadingText="Updating Branch..."
                  disabled={isLoading || isDataFetching}
                  sx={actionButtonRightSx}
                >
                  Update Branch
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
                  disabled={isLoading || isDataFetching}
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

EditBranchMobilePage.displayName = "EditBranchMobilePage";

/* ==========================================================================
   PRESENTATIONAL STEPPER COMPONENT WITH VERY SHORT LINES (NO-TOUCH DESIGN)
   ========================================================================== */

const MobileWorkflowStepper = ({ currentStep, onStepClick }) => {
  const stepsMeta = [
    { id: 1, title: "Branch Profile" },
    { id: 2, title: "Address Space" },
    { id: 3, title: "Licenses" },
    { id: 4, title: "Supervision" },
    { id: 5, title: "Audit & Deploy" },
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

const MobileStepBranchDetails = ({
  formData,
  formErrors,
  branchTypeOptions,
  booleanOptions,
  statusOptions,
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
      Branch Profile Overview
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Adjust layout parameters, operations types, and live tracking routes.
    </AppText>

    <AppStack direction="column" gap={1.4} sx={{ mt: 1.8 }}>
      <AppInput
        label="Branch Name"
        name="branchName"
        value={formData.branchName || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter branch name"
        required
        error={Boolean(formErrors.branchName)}
        helperText={formErrors.branchName}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />

      <AppSelect
        label="Branch Type"
        name="branchType"
        value={formData.branchType || "retail"}
        onChange={handleChange}
        disabled={isLoading}
        options={branchTypeOptions}
        required
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />

      <AppSelect
        label="Primary Location Flag"
        name="isPrimary"
        value={formData.isPrimary || "false"}
        onChange={handleChange}
        disabled={isLoading}
        options={booleanOptions}
        required
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />

      <AppSelect
        label="Operational Status"
        name="status"
        value={formData.status || "active"}
        onChange={handleChange}
        disabled={isLoading}
        options={statusOptions}
        required
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />

      <AppInput
        label="Branch Email Address"
        name="branchEmail"
        value={formData.branchEmail || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="branch@company.com"
        error={Boolean(formErrors.branchEmail)}
        helperText={formErrors.branchEmail}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />

      <AppInput
        label="Mobile Number"
        name="mobile"
        value={formData.mobile || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter 10-digit mobile number"
        error={Boolean(formErrors.mobile)}
        helperText={formErrors.mobile}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />

      <AppInput
        label="WhatsApp Number"
        name="whatsapp"
        value={formData.whatsapp || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter WhatsApp link contact"
        error={Boolean(formErrors.whatsapp)}
        helperText={formErrors.whatsapp}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />

      <AppInput
        label="Landline Number (Optional)"
        name="landline"
        value={formData.landline || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter landline parameters"
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
      Registered Address Space
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Adjust geographic boundary tracks linked to invoice outputs.
    </AppText>

    <AppStack direction="column" gap={1.4} sx={{ mt: 1.8 }}>
      <AppInput
        label="Address Line 1"
        name="addressLine1"
        value={formData.addressLine1 || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Flat/Plot, Unit, Street info"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Address Line 2"
        name="addressLine2"
        value={formData.addressLine2 || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Locality, Sector, Landmark tracks"
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
        placeholder="Country space"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Google Map Location Link"
        name="googleMapLocation"
        value={formData.googleMapLocation || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="https://maps.google.com/..."
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
    </AppStack>
  </AppCard>
);

const MobileStepLicenseDetails = ({
  formData,
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
      Compliance Licenses Logs
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Manage state pharmaceutical registration records and expirations.
    </AppText>

    <AppStack direction="column" gap={1.4} sx={{ mt: 1.8 }}>
      <AppInput
        label="Drug License Number"
        name="drugLicenseNumber"
        value={formData.drugLicenseNumber || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Form 20 / Form 21 identifiers"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Drug License Type"
        name="drugLicenseType"
        value={formData.drugLicenseType || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Retail / Wholesale descriptor mapping"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="FSSAI Number"
        name="fssaiNumber"
        value={formData.fssaiNumber || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter 14-digit food authority token"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="License Expiry Date"
        name="licenseExpiresAt"
        type="date"
        value={formData.licenseExpiresAt || ""}
        onChange={handleChange}
        disabled={isLoading}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
    </AppStack>
  </AppCard>
);

const MobileStepComplianceContacts = ({
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
      Supervising Authorities
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Configure practitioner profiles and core escalation triggers.
    </AppText>

    <AppStack direction="column" gap={1.4} sx={{ mt: 1.6 }}>
      <AppText sx={subSectionDividerLabelSx}>Pharmacist Parameters</AppText>

      <AppInput
        label="Registered Pharmacist Name"
        name="pharmacistName"
        value={formData.pharmacistName || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Full name matching council indices"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Pharmacy Registration Number"
        name="pharmacistRegistrationNumber"
        value={formData.pharmacistRegistrationNumber || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="State council index logging key"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Pharmacist Mobile"
        name="pharmacistMobile"
        value={formData.pharmacistMobile || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Pharmacist phone mapping"
        error={Boolean(formErrors.pharmacistMobile)}
        helperText={formErrors.pharmacistMobile}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Pharmacist Email"
        name="pharmacistEmail"
        value={formData.pharmacistEmail || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="pharmacist@company.com"
        error={Boolean(formErrors.pharmacistEmail)}
        helperText={formErrors.pharmacistEmail}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />

      <AppText sx={{ ...subSectionDividerLabelSx, pt: 0.8 }}>
        Emergency Escalation Link
      </AppText>

      <AppInput
        label="Contact Name"
        name="emergencyContactName"
        value={formData.emergencyContactName || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Full backup proxy name"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Contact Mobile"
        name="emergencyContactMobile"
        value={formData.emergencyContactMobile || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="10-digit primary number"
        error={Boolean(formErrors.emergencyContactMobile)}
        helperText={formErrors.emergencyContactMobile}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Relationship Mapping"
        name="emergencyContactRelationship"
        value={formData.emergencyContactRelationship || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="e.g. Director / Manager"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
    </AppStack>
  </AppCard>
);

/* ==========================================================================
   STEP 5: HIGH-DENSITY AUDIT REVIEW MODULE (PERSISTENT DATA FIELDS RENDER)
   ========================================================================== */

const MobileStepReviewAndDeploy = ({
  formData,
  branchCode,
  branchTypeOptions,
  onEditSection,
}) => {
  const resolvedType =
    branchTypeOptions.find((opt) => opt.value === formData.branchType)?.label ||
    formData.branchType ||
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
        <AppBox>
          <AppHeading
            level={3}
            weight={800}
            sx={{ m: 0, fontSize: "14px", color: "var(--app-color-text)" }}
          >
            Delta Verification Manifest
          </AppHeading>
          {branchCode && (
            <AppText
              variant="caption"
              sx={{ color: "var(--app-color-text-muted)", fontSize: "10px" }}
            >
              Active Branch Identity Block: {branchCode}
            </AppText>
          )}
        </AppBox>
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

      {/* Review Block 1: Core Operational Flags */}
      <AppBox sx={reviewBlockContainerSx}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <FiBriefcase />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Branch Profile Overview
          </AppText>
          <AppStack direction="row" gap={0.5} sx={{ ml: "auto" }}>
            {formData.isPrimary === "true" && (
              <AppTag
                label="Primary Core"
                variant="soft"
                colorVariant="success"
                rounded="md"
                sx={{ height: 16, fontSize: "9px", px: 0.5 }}
              />
            )}
            <AppTag
              label={formData.status || "active"}
              variant="soft"
              colorVariant={formData.status === "active" ? "success" : "error"}
              rounded="md"
              sx={{
                height: 16,
                fontSize: "9px",
                px: 0.5,
                textTransform: "capitalize",
              }}
            />
          </AppStack>
        </AppStack>
        <AppStack direction="column" gap={0.8}>
          <ReviewGridRow label="Branch Name" value={formData.branchName} />
          <ReviewGridRow label="Infrastructure Mapping" value={resolvedType} />
          <ReviewGridRow label="Comms Email" value={formData.branchEmail} />
          <ReviewGridRow
            label="Mobile Vector"
            value={formData.mobile ? `+91 ${formData.mobile}` : ""}
          />
          <ReviewGridRow
            label="WhatsApp Gateway"
            value={formData.whatsapp ? `+91 ${formData.whatsapp}` : ""}
          />
          <ReviewGridRow label="Landline Number" value={formData.landline} />
        </AppStack>
      </AppBox>

      {/* Review Block 2: Geographic Workplace Mappings */}
      <AppBox sx={reviewBlockContainerSx}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <FiMapPin />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Spatial Properties Delta
          </AppText>
        </AppStack>
        <AppStack direction="column" gap={0.8}>
          <ReviewGridRow
            label="Physical Block"
            value={
              formData.addressLine1
                ? `${formData.addressLine1}${formData.addressLine2 ? `, ${formData.addressLine2}` : ""}`
                : ""
            }
          />
          <ReviewGridRow label="City Workspace" value={formData.city} />
          <ReviewGridRow label="District Boundary" value={formData.district} />
          <ReviewGridRow label="State Code" value={formData.state} />
          <ReviewGridRow label="Postal PIN Index" value={formData.pincode} />
          <ReviewGridRow label="Country Scope" value={formData.country} />
          <ReviewGridRow
            label="Google Maps Link"
            value={formData.googleMapLocation}
          />
        </AppStack>
      </AppBox>

      {/* Review Block 3: Statutory Licensing Records */}
      <AppBox sx={reviewBlockContainerSx}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <FiFileText />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Compliance Parameters Audit
          </AppText>
        </AppStack>
        <AppStack direction="column" gap={0.8}>
          <ReviewGridRow
            label="Drug License Tracker"
            value={formData.drugLicenseNumber}
          />
          <ReviewGridRow
            label="Drug Distribution"
            value={formData.drugLicenseType}
          />
          <ReviewGridRow
            label="FSSAI Token Identity"
            value={formData.fssaiNumber}
          />
          <ReviewGridRow
            label="Expiration Sequence"
            value={formData.licenseExpiresAt}
          />
        </AppStack>
      </AppBox>

      {/* Review Block 4: Supervision Accountability Profiles */}
      <AppBox sx={{ pt: 1.25 }}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <FiUser />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Supervising Practitioner Profiles
          </AppText>
        </AppStack>
        <AppStack direction="column" gap={0.8}>
          <ReviewGridRow
            label="Supervising Pharmacist"
            value={formData.pharmacistName}
          />
          <ReviewGridRow
            label="Council Index Key"
            value={formData.pharmacistRegistrationNumber}
          />
          <ReviewGridRow
            label="Pharmacist Phone"
            value={formData.pharmacistMobile}
          />
          <ReviewGridRow
            label="Comms Routing"
            value={formData.pharmacistEmail}
          />
          <ReviewGridRow
            label="Emergency Proxy"
            value={formData.emergencyContactName}
          />
          <ReviewGridRow
            label="Proxy Mobile Link"
            value={formData.emergencyContactMobile}
          />
          <ReviewGridRow
            label="Corporate Role"
            value={formData.emergencyContactRelationship}
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

const subSectionDividerLabelSx = {
  fontSize: "12.2px",
  fontWeight: 800,
  color: "var(--app-color-primary)",
  borderBottom: "1px solid var(--app-color-border)",
  pb: 0.4,
  mb: 0.2,
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

export default EditBranchMobilePage;
