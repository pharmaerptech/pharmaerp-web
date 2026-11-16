// src/features/branch/pages/mobile/CreateBranchMobilePage.jsx

import { memo } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiEdit3,
  FiFileText,
  FiMapPin,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";

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

const CreateBranchMobilePage = memo(
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
  }) => {
    return (
      <section className="relative w-full overflow-hidden bg-bg">
        <AppBox sx={containerSx}>
          {/* Section 1: Header Title Metadata Block */}
          <AppBox sx={headerTitleBlockSx}>
            <AppText variant="caption" weight={700} sx={stepTrackerLabelSx}>
              Step {currentStep} of 5
            </AppText>
            <AppHeading level={1} weight={800} sx={pageTitleSx}>
              {currentStep === 5 ? "Review & Create" : "Create Branch"}
            </AppHeading>
            <AppText variant="body2" weight={500} sx={pageSubtitleSx}>
              {currentStep === 5
                ? "Please review all your branch details before creating."
                : "Configure operational parameters, addresses, and compliance parameters."}
            </AppText>
          </AppBox>

          {/* Section 2: Progress Timeline Workflow Stepper Component */}
          <MobileWorkflowStepper
            currentStep={currentStep}
            onStepClick={handleStepChange}
          />

          {/* Section 3: Central Step Form Switcher Matrix */}
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
              <MobileStepComplianceDetails
                formData={formData}
                formErrors={formErrors}
                handleChange={handleChange}
                isLoading={isLoading}
              />
            )}

            {currentStep === 5 && (
              <MobileStepReviewAndCreate
                formData={formData}
                branchTypeOptions={branchTypeOptions}
                onEditSection={handleStepChange}
              />
            )}
          </AppBox>

          {/* Section 4: Data Privacy Advisory Banner Section */}
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
                  Your data is safe with us.
                </AppText>
                <AppText variant="body2" weight={500} sx={securityBannerDescSx}>
                  We use advanced security to protect your business information.
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
                  loadingText="Creating Branch..."
                  disabled={isLoading}
                  sx={actionButtonRightSx}
                >
                  Create Branch
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
                  onClick={handleCancel}
                  disabled={isLoading}
                  sx={actionButtonCancelSx}
                >
                  Cancel
                </AppButton>
                <AppButton
                  variant="contained"
                  colorVariant="success"
                  rounded="md"
                  endIcon={<FiArrowRight />}
                  onClick={handleContinue}
                  disabled={isLoading}
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



/* ==========================================================================
   PRESENTATIONAL STEPPER COMPONENT WITH CONSTRICTION RAIL METRICS
   ========================================================================== */

const MobileWorkflowStepper = ({ currentStep, onStepClick }) => {
  const stepsMeta = [
    { id: 1, title: "Branch Details" },
    { id: 2, title: "Address" },
    { id: 3, title: "Statutory Info" },
    { id: 4, title: "Compliance" },
    { id: 5, title: "Review & Create" },
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
                {/* Micro Independent Horizontal Connector Line Rails (No-Touch Setup) */}
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
   FORM EDIT SUB-STEPS CONFIGURATION MODULE PANELS (STEPS 1 - 4)
   ========================================================================== */

const MobileStepBranchDetails = ({
  formData,
  formErrors,
  branchTypeOptions,
  booleanOptions,
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
      Branch Core Profile
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Provide branch tracking naming structures and infrastructure channels.
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
        value={formData.branchType || ""}
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
        required
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
        placeholder="Enter WhatsApp communication link"
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
        placeholder="Enter landline number"
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
      Registered Branch Address
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Define office addresses bound to spatial models and print layouts.
    </AppText>

    <AppStack direction="column" gap={1.4} sx={{ mt: 1.8 }}>
      <AppInput
        label="Address Line 1"
        name="addressLine1"
        value={formData.addressLine1 || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Flat/Plot, Building, Corporate complex"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Address Line 2"
        name="addressLine2"
        value={formData.addressLine2 || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Locality, Sector, Landmark parameters"
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
        placeholder="Enter 6-digit PIN tracking code"
        required
        error={Boolean(formErrors.pincode)}
        helperText={formErrors.pincode}
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Country"
        name="country"
        value={formData.country || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="India"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Google Map Location Link"
        name="googleMapLocation"
        value={formData.googleMapLocation || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Paste map coordinate link structures"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
    </AppStack>
  </AppCard>
);

const MobileStepLicenseDetails = ({
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
      Statutory Compliance Licenses
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Configure industry regulatory numbers and license profiles.
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
        placeholder="Retail / Wholesale parameters"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="FSSAI Number"
        name="fssaiNumber"
        value={formData.fssaiNumber || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter 14-digit food authorization code"
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

const MobileStepComplianceDetails = ({
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
      Compliance Contacts Links
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Link accountability governance entities and emergency contact lines.
    </AppText>

    <AppStack direction="column" gap={1.4} sx={{ mt: 1.8 }}>
      <AppText variant="subtitle2" weight={800} sx={inlineSubheadingSx}>
        Pharmacist Parameters
      </AppText>
      <AppInput
        label="Registered Pharmacist Name"
        name="pharmacistName"
        value={formData.pharmacistName || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Full name matching council registration logs"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Pharmacy Registration Number"
        name="pharmacistRegistrationNumber"
        value={formData.pharmacistRegistrationNumber || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="State council index string"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Pharmacist Mobile"
        name="pharmacistMobile"
        value={formData.pharmacistMobile || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Pharmacist phone contact record"
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

      <AppBox
        sx={{
          borderTop: "1px solid var(--app-color-divider)",
          pt: 1.5,
          mt: 0.5,
        }}
      >
        <AppText variant="subtitle2" weight={800} sx={inlineSubheadingSx}>
          Emergency Contact Link
        </AppText>
      </AppBox>
      <AppInput
        label="Contact Name"
        name="emergencyContactName"
        value={formData.emergencyContactName || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Full name"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
      <AppInput
        label="Contact Mobile"
        name="emergencyContactMobile"
        value={formData.emergencyContactMobile || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="10-digit emergency number"
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
        placeholder="e.g., Manager / Supervisor"
        labelSx={mobileLabelSx}
        inputSx={mobileInputSx}
      />
    </AppStack>
  </AppCard>
);

/* ==========================================================================
   STEP 5: AUDIT REVIEW SCREEN PANEL MODULE
   ========================================================================== */

const MobileStepReviewAndCreate = ({
  formData,
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
        <AppHeading
          level={3}
          weight={800}
          sx={{ m: 0, fontSize: "14px", color: "var(--app-color-text)" }}
        >
          Review Your Details
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

      {/* Review Block 1: Branch Core Metadata */}
      <AppBox sx={reviewBlockContainerSx}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <HiOutlineBuildingOffice2 />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Branch Profile Overview
          </AppText>
        </AppStack>
        <AppStack direction="column" gap={0.8}>
          <ReviewGridRow label="Branch Name" value={formData.branchName} />
          <ReviewGridRow label="Branch Type" value={resolvedType} />
          <ReviewGridRow
            label="Primary Flag"
            value={formData.isPrimary === "true" ? "Yes" : "No"}
          />
          <ReviewGridRow label="Email Address" value={formData.branchEmail} />
          <ReviewGridRow
            label="Mobile Number"
            value={formData.mobile ? `+91 ${formData.mobile}` : ""}
          />
          <ReviewGridRow
            label="WhatsApp Comms"
            value={formData.whatsapp ? `+91 ${formData.whatsapp}` : ""}
          />
          <ReviewGridRow label="Landline" value={formData.landline} />
        </AppStack>
      </AppBox>

      {/* Review Block 2: Spatial Locations */}
      <AppBox sx={reviewBlockContainerSx}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <FiMapPin />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Spatial Addresses
          </AppText>
        </AppStack>
        <AppStack direction="column" gap={0.8}>
          <ReviewGridRow
            label="Address"
            value={
              formData.addressLine1
                ? `${formData.addressLine1}${formData.addressLine2 ? `, ${formData.addressLine2}` : ""}`
                : ""
            }
          />
          <ReviewGridRow label="City" value={formData.city} />
          <ReviewGridRow label="District" value={formData.district} />
          <ReviewGridRow label="State" value={formData.state} />
          <ReviewGridRow label="PIN Code" value={formData.pincode} />
          <ReviewGridRow label="Country" value={formData.country} />
          <ReviewGridRow
            label="Maps Location"
            value={formData.googleMapLocation}
          />
        </AppStack>
      </AppBox>

      {/* Review Block 3: Statutory License Indexes */}
      <AppBox sx={reviewBlockContainerSx}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <FiFileText />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Statutory Compliance
          </AppText>
        </AppStack>
        <AppStack direction="column" gap={0.8}>
          <ReviewGridRow
            label="Drug License No"
            value={formData.drugLicenseNumber}
          />
          <ReviewGridRow
            label="License Classification"
            value={formData.drugLicenseType}
          />
          <ReviewGridRow label="FSSAI Code" value={formData.fssaiNumber} />
          <ReviewGridRow
            label="Expiration Date"
            value={formData.licenseExpiresAt}
          />
        </AppStack>
      </AppBox>

      {/* Review Block 4: Linked Practitioners */}
      <AppBox sx={{ pt: 1.25 }}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <FiUser />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Compliance Operators
          </AppText>
        </AppStack>
        <AppStack direction="column" gap={0.8}>
          <ReviewGridRow
            label="Pharmacist Name"
            value={formData.pharmacistName}
          />
          <ReviewGridRow
            label="Council Index"
            value={formData.pharmacistRegistrationNumber}
          />
          <ReviewGridRow
            label="Pharmacist Phone"
            value={
              formData.pharmacistMobile
                ? `+91 ${formData.pharmacistMobile}`
                : ""
            }
          />
          <ReviewGridRow
            label="Pharmacist Email"
            value={formData.pharmacistEmail}
          />
          <ReviewGridRow
            label="Emergency Contact"
            value={formData.emergencyContactName}
          />
          <ReviewGridRow
            label="Emergency Phone"
            value={
              formData.emergencyContactMobile
                ? `+91 ${formData.emergencyContactMobile}`
                : ""
            }
          />
          <ReviewGridRow
            label="Relationship Map"
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
   STYLING DICTIONARY TOKENS (HIGH-DENSITY PRESENTATION LAYER SPECIFICATIONS)
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

const inlineSubheadingSx = {
  m: 0,
  fontSize: "12.5px",
  color: "var(--app-color-primary)",
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

export default CreateBranchMobilePage;
