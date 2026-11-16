// src/features/company/pages/mobile/CreateCompanyMobilePage.jsx

import { memo } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBriefcase,
  FiCheck,
  FiCheckCircle,
  FiEdit3,
  FiFileText,
  FiGlobe,
  FiMapPin,
  FiMail,
  FiPhone,
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

const CreateCompanyMobilePage = memo(
  ({
    formData,
    formErrors = {},
    isLoading = false,
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
  }) => {
    return (
      <section className="relative w-full overflow-hidden bg-bg">
        <AppBox sx={containerSx}>
          {/* Section 1: Step Status Header Title Area */}
          <AppBox sx={headerTitleBlockSx}>
            <AppText variant="caption" weight={700} sx={stepTrackerLabelSx}>
              Step {currentStep} of 5
            </AppText>
            <AppHeading level={1} weight={800} sx={pageTitleSx}>
              {currentStep === 5 ? "Review & Create" : "Create Company"}
            </AppHeading>
            <AppText variant="body2" weight={500} sx={pageSubtitleSx}>
              {currentStep === 5
                ? "Please review all your company details before creating."
                : "Add your company details and set up your business profile."}
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
              <MobileStepReviewAndCreate
                formData={formData}
                companyTypeOptions={companyTypeOptions}
                industryOptions={industryOptions}
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
                  loadingText="Creating Company..."
                  disabled={isLoading}
                  sx={actionButtonRightSx}
                >
                  Create Company
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

CreateCompanyMobilePage.displayName = "CreateCompanyMobilePage";

/* ==========================================================================
   PRESENTATIONAL STEPPER COMPONENT WITH VERY SHORT LINES (NO-TOUCH DESIGN)
   ========================================================================== */

const MobileWorkflowStepper = ({ currentStep, onStepClick }) => {
  const stepsMeta = [
    { id: 1, title: "Company Details" },
    { id: 2, title: "Business Info" },
    { id: 3, title: "Address" },
    { id: 4, title: "Additional Info" },
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
                {/* Micro Independent Horizontal Connector Line Rails */}
                {idx > 0 && (
                  <div
                    className="absolute"
                    style={{
                      height: "2px",
                      width: "35%", // Short layout constraints to isolate tracks away from circles
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
  industryOptions,
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
      Company Details
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Enter the basic information about your company.
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

      <AppInput
        label="Email Address"
        name="companyEmail"
        value={formData.companyEmail || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter email address"
        required
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
          <AppText sx={mobileLabelSx}>
            Phone Number <span className="text-error">*</span>
          </AppText>
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
        label="Company Description (Optional)"
        name="companyDescription"
        value={formData.companyDescription || ""}
        onChange={handleChange}
        disabled={isLoading}
        placeholder="Enter a brief description about your company"
        labelSx={mobileLabelSx}
        inputSx={mobileTextareaSx}
        multiline
        rows={3}
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
                  Upload company logo
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
            <AppBox sx={logoIconDisplayBoxSx}>
              <LuStore />
            </AppBox>
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
      Business Owner Info
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Configure personal ownership indicators mapping root profiles.
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
      Registered Office Address
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Define spatial boundaries required for default invoicing outputs.
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
      Statutory Licenses Info
    </AppHeading>
    <AppText variant="body2" sx={formCardSectionDescSx}>
      Configure industry regulatory indexes and local state tax targets.
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

const MobileStepReviewAndCreate = ({
  formData,
  companyTypeOptions,
  industryOptions,
  onEditSection,
}) => {
  const resolvedType =
    companyTypeOptions.find((opt) => opt.value === formData.companyType)
      ?.label ||
    formData.companyType ||
    "";
  const resolvedIndustry =
    industryOptions.find((opt) => opt.value === formData.industry)?.label || "";

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

      {/* Review Block 1: Company Profile */}
      <AppBox sx={reviewBlockContainerSx}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <HiOutlineBuildingOffice2 />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Company Details
          </AppText>
        </AppStack>
        <AppStack direction="column" gap={0.8}>
          <ReviewGridRow label="Company Name" value={formData.companyName} />
          <ReviewGridRow label="Company Type" value={resolvedType} />
          <ReviewGridRow label="Email Address" value={formData.companyEmail} />
          <ReviewGridRow
            label="Phone Number"
            value={formData.companyPhone ? `+91 ${formData.companyPhone}` : ""}
          />
          <ReviewGridRow label="Website" value={formData.website} />
        </AppStack>
      </AppBox>

      {/* Review Block 2: Business Core Context */}
      <AppBox sx={reviewBlockContainerSx}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <FiBriefcase />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Business Information
          </AppText>
        </AppStack>
        <AppStack direction="column" gap={0.8}>
          <ReviewGridRow label="Industry" value={resolvedIndustry} />
          <ReviewGridRow
            label="Company Description"
            value={formData.companyDescription}
          />
        </AppStack>
      </AppBox>

      {/* Review Block 3: Registered Office Address */}
      <AppBox sx={reviewBlockContainerSx}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <FiMapPin />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Registered Address
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
          <ReviewGridRow label="State" value={formData.state} />
          <ReviewGridRow label="PIN Code" value={formData.pincode} />
          <ReviewGridRow label="Country" value={formData.country} />
        </AppStack>
      </AppBox>

      {/* Review Block 4: Statutory Parameters */}
      <AppBox sx={reviewBlockContainerSx}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <FiFileText />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Additional Information
          </AppText>
        </AppStack>
        <AppStack direction="column" gap={0.8}>
          <ReviewGridRow label="GST Number" value={formData.gstNumber} />
          <ReviewGridRow label="PAN Number" value={formData.panNumber} />
          <ReviewGridRow label="License Type" value={formData.licenseType} />
          <ReviewGridRow label="FSSAI Number" value={formData.fssaiNumber} />
          <ReviewGridRow
            label="Retail License"
            value={formData.retailLicenseNumber}
          />
          <ReviewGridRow
            label="Wholesale License"
            value={formData.wholesaleLicenseNumber}
          />
        </AppStack>
      </AppBox>

      {/* Review Block 5: File Attachments Profile summary */}
      <AppBox sx={{ pt: 1.25 }}>
        <AppStack direction="row" gap={0.75} align="center" sx={{ mb: 1 }}>
          <AppBox sx={reviewHeaderIconTrackSx}>
            <FiBriefcase />
          </AppBox>
          <AppText variant="body2" weight={800} sx={reviewBlockHeaderTitleSx}>
            Company Logo
          </AppText>
        </AppStack>
        <AppBox sx={reviewFileTrackRowSx}>
          <AppStack direction="row" align="center" gap={0.6}>
            <HiOutlineBuildingOffice2 className="text-[15px] text-success" />
            <AppText
              variant="caption"
              weight={700}
              sx={{ color: "var(--app-color-text)", fontSize: "11px" }}
            >
              {formData.logo?.name || ""}
            </AppText>
          </AppStack>
        </AppBox>
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

const stepperOuterBoundarySx = {
  mt: 1.6,
  mb: 1.4,
  width: "100%",
  display: "flex",
  justifyContent: "center",
};

const stepperInnerTrackSx = {
  width: "100%", // 🔥 Spans full width edge-to-edge
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

const mobileTextareaSx = {
  fontSize: "12px",
  bgcolor: "var(--app-color-surface)",
  color: "var(--app-color-text)",
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

const reviewFileTrackRowSx = {
  mt: 0.5,
  p: 0.6,
  borderRadius: "6px",
  border: "1px dashed var(--app-color-success)",
  bgcolor: "var(--app-color-success-soft)",
  display: "inline-block",
  minWidth: 120,
  minHeight: 24,
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
  width: "auto", // 🔥 Width configured to fit-content bounds on extreme right
  px: 2.2,
  fontSize: "12px",
  fontWeight: 750,
  boxShadow: "none",
};

export default CreateCompanyMobilePage;
