// src/features/company/pages/CreateCompanyPage.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile } from "@/hooks";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";

import useCompany from "../hooks/useCompany";

import CreateCompanyDesktopPage from "./desktop/CreateCompanyDesktopPage";
import CreateCompanyMobilePage from "./mobile/CreateCompanyMobilePage";

const INITIAL_FORM_DATA = {
  // Step 1: Company Details
  companyName: "",
  companyType: "private_limited",
  companyEmail: "",
  companyPhone: "",
  website: "",
  industry: "",
  companyDescription: "",
  status: "active",
  logo: null,

  // Step 2: Owner Details (PERSON_SCHEMA)
  ownerName: "",
  ownerEmail: "",
  ownerMobile: "",
  ownerAadhaar: "",
  ownerPan: "",

  // Step 3: Address (ADDRESS_SCHEMA)
  addressLine1: "",
  addressLine2: "",
  city: "",
  district: "",
  state: "",
  country: "India",
  pincode: "",

  // Step 4: License Details & Identity (LICENSE_SCHEMA + Root Identifiers)
  gstNumber: "",
  panNumber: "",
  licenseType: "",
  retailLicenseNumber: "",
  wholesaleLicenseNumber: "",
  fssaiNumber: "",
  licenseIssuedAt: "",
  licenseExpiresAt: "",
  licenseStatus: "pending",
  licenseDocument: null,
};

const companyTypeOptions = [
  { label: "Select company type", value: "" },
  { label: "Proprietorship", value: "proprietorship" },
  { label: "Partnership", value: "partnership" },
  { label: "LLP", value: "llp" },
  { label: "Private Limited", value: "private_limited" },
  { label: "Public Limited", value: "public_limited" },
  { label: "OPC", value: "opc" },
  { label: "Trust", value: "trust" },
  { label: "Society", value: "society" },
  { label: "Other", value: "other" },
];

const industryOptions = [
  { label: "Select industry", value: "" },
  { label: "Healthcare & Wellness", value: "healthcare_wellness" },
  { label: "Pharmaceuticals", value: "pharmaceuticals" },
  { label: "Retail Pharmacy", value: "retail_pharmacy" },
  { label: "Wholesale Distribution", value: "wholesale_distribution" },
  { label: "Medical Devices", value: "medical_devices" },
  { label: "Hospital & Clinical", value: "hospital_clinical" },
  { label: "Biotechnology", value: "biotechnology" },
  { label: "Nutraceuticals", value: "nutraceuticals" },
  { label: "Ayurveda & Herbal", value: "ayurveda_herbal" },
  { label: "Other", value: "other" },
];

const licenseStatusOptions = [
  { label: "Pending", value: "pending" },
  { label: "Active", value: "active" },
  { label: "Expired", value: "expired" },
  { label: "Suspended", value: "suspended" },
];

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const PHONE_REGEX = /^[6-9][0-9]{9}$/;
const AADHAAR_REGEX = /^[0-9]{12}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeText = (value) => String(value || "").trim();
const normalizeUpperText = (value) => normalizeText(value).toUpperCase();
const normalizeLowerText = (value) => normalizeText(value).toLowerCase();
const normalizePhone = (value) => normalizeText(value).replace(/\D/g, "");

const toDateOrNull = (value) => {
  const trimmedValue = normalizeText(value);
  if (!trimmedValue) return null;
  const parsedDate = new Date(trimmedValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
};

const buildCompanyPayload = (formData) => {
  return {
    name: normalizeText(formData.companyName),
    type: formData.companyType || "private_limited",
    industry: formData.industry || null,
    description: normalizeText(formData.companyDescription) || null,
    status: formData.status || "active",
    logo: formData.logo || null,
    email: normalizeLowerText(formData.companyEmail) || null,
    website: normalizeLowerText(formData.website) || null,
    gstin: normalizeUpperText(formData.gstNumber) || null,
    pan: normalizeUpperText(formData.panNumber) || null,

    phones: {
      mobile: normalizePhone(formData.companyPhone) || null,
    },

    address: {
      addressLine1: normalizeText(formData.addressLine1) || null,
      addressLine2: normalizeText(formData.addressLine2) || null,
      city: normalizeText(formData.city) || null,
      district: normalizeText(formData.district) || null,
      state: normalizeText(formData.state) || null,
      country: normalizeText(formData.country) || "India",
      pincode: normalizeText(formData.pincode) || null,
    },

    owner: {
      name: normalizeText(formData.ownerName) || null,
      email: normalizeLowerText(formData.ownerEmail) || null,
      mobile: normalizePhone(formData.ownerMobile) || null,
      aadhaar: normalizeText(formData.ownerAadhaar) || null,
      pan: normalizeUpperText(formData.ownerPan) || null,
    },

    license: {
      licenseType: normalizeText(formData.licenseType) || null,
      retailLicenseNumber:
        normalizeUpperText(formData.retailLicenseNumber) || null,
      wholesaleLicenseNumber:
        normalizeUpperText(formData.wholesaleLicenseNumber) || null,
      fssaiNumber: normalizeText(formData.fssaiNumber) || null,
      issuedAt: toDateOrNull(formData.licenseIssuedAt),
      expiresAt: toDateOrNull(formData.licenseExpiresAt),
      status: formData.licenseStatus || "pending",
      document: formData.licenseDocument || null,
    },
  };
};

const validateStepData = (step, formData) => {
  const errors = {};

  if (step === 1) {
    const companyName = normalizeText(formData.companyName);
    const companyEmail = normalizeLowerText(formData.companyEmail);
    const companyPhone = normalizePhone(formData.companyPhone);

    if (!companyName) {
      errors.companyName = "Company name is required";
    } else if (companyName.length < 2) {
      errors.companyName = "Company name must be at least 2 characters";
    } else if (companyName.length > 160) {
      errors.companyName = "Company name cannot exceed 160 characters";
    }

    if (!formData.companyType) {
      errors.companyType = "Company type is required";
    }

    if (!companyEmail) {
      errors.companyEmail = "Email address is required";
    } else if (!EMAIL_REGEX.test(companyEmail)) {
      errors.companyEmail = "Enter a valid email address";
    }

    if (!companyPhone) {
      errors.companyPhone = "Phone number is required";
    } else if (!PHONE_REGEX.test(companyPhone)) {
      errors.companyPhone = "Invalid phone number";
    }

    if (!formData.industry) {
      errors.industry = "Industry selection is required";
    }
  }

  if (step === 2) {
    const ownerEmail = normalizeLowerText(formData.ownerEmail);
    const ownerMobile = normalizePhone(formData.ownerMobile);
    const ownerAadhaar = normalizeText(formData.ownerAadhaar);
    const ownerPan = normalizeUpperText(formData.ownerPan);

    if (ownerEmail && !EMAIL_REGEX.test(ownerEmail)) {
      errors.ownerEmail = "Enter a valid owner email";
    }
    if (ownerMobile && !PHONE_REGEX.test(ownerMobile)) {
      errors.ownerMobile = "Invalid owner mobile number";
    }
    if (ownerAadhaar && !AADHAAR_REGEX.test(ownerAadhaar)) {
      errors.ownerAadhaar = "Invalid Aadhaar number (must be 12 digits)";
    }
    if (ownerPan && !PAN_REGEX.test(ownerPan)) {
      errors.ownerPan = "Invalid owner PAN number";
    }
  }

  if (step === 3) {
    const pincode = normalizeText(formData.pincode);
    if (pincode && pincode.length !== 6) {
      errors.pincode = "Pincode must be exactly 6 digits";
    }
  }

  if (step === 4) {
    const gstNumber = normalizeUpperText(formData.gstNumber);
    const panNumber = normalizeUpperText(formData.panNumber);

    if (gstNumber && !GSTIN_REGEX.test(gstNumber)) {
      errors.gstNumber = "Invalid GSTIN format";
    }
    if (panNumber && !PAN_REGEX.test(panNumber)) {
      errors.panNumber = "Invalid PAN format";
    }
  }

  return errors;
};

const CreateCompanyPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isSetupComplete, companyCompleted } = useSetupStatus();

  // Enforce Sequential Setup: Cannot create second company until branch setup is complete
  useEffect(() => {
    if (!isSetupComplete && companyCompleted) {
      navigate(ROUTES.SETUP_CENTER, { replace: true });
    }
  }, [isSetupComplete, companyCompleted, navigate]);

  const {
    createCompany,
    createCompanyStatus,
    error: companyError,
    clearError,
  } = useCompany();

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  const isLoading = createCompanyStatus === API_STATUS.LOADING;

  const handleFieldChange = useCallback(
    (nameOrEvent, maybeValue) => {
      const isEvent = Boolean(nameOrEvent?.target);
      const name = isEvent ? nameOrEvent.target.name : nameOrEvent;
      const value = isEvent ? nameOrEvent.target.value : maybeValue;

      setFormData((prev) => ({ ...prev, [name]: value }));

      if (formErrors[name] || formErrors.submit) {
        setFormErrors((prev) => ({
          ...prev,
          [name]: "",
          submit: "",
        }));
      }

      if (companyError) {
        clearError();
      }
    },
    [clearError, companyError, formErrors],
  );

  const handleBackToCompanies = useCallback(() => {
    if (!isSetupComplete) {
      navigate(ROUTES.SETUP_CENTER);
    } else {
      navigate("/companies");
    }
  }, [navigate, isSetupComplete]);

  const handleStepChange = useCallback(
    (step) => {
      if (step <= currentStep) {
        setCurrentStep(step);
        return;
      }

      for (let i = 1; i < step; i++) {
        const stepErrors = validateStepData(i, formData);
        if (Object.keys(stepErrors).length > 0) {
          setFormErrors(stepErrors);
          setCurrentStep(i);
          return;
        }
      }
      setCurrentStep(step);
    },
    [currentStep, formData],
  );

  const handleContinue = useCallback(() => {
    const stepErrors = validateStepData(currentStep, formData);

    if (Object.keys(stepErrors).length > 0) {
      setFormErrors(stepErrors);
      return;
    }

    setFormErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  }, [currentStep, formData]);

  const handleBackStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      handleBackToCompanies();
    }
  }, [currentStep, handleBackToCompanies]);

  const handleSaveDraft = useCallback(() => {
    setFormErrors({});
    if (!isSetupComplete) {
      navigate(ROUTES.SETUP_CENTER);
    } else {
      navigate("/companies");
    }
  }, [navigate, isSetupComplete]);

  const handleResetAndRefresh = useCallback(() => {
    setCurrentStep(1);
    setFormErrors({});
    setFormData(INITIAL_FORM_DATA);
    clearError();
  }, [clearError]);

  const handleSubmit = useCallback(
    async (event) => {
      if (event) event.preventDefault();

      let structuralErrors = {};
      for (let i = 1; i <= 4; i++) {
        structuralErrors = {
          ...structuralErrors,
          ...validateStepData(i, formData),
        };
      }

      if (Object.keys(structuralErrors).length > 0) {
        setFormErrors(structuralErrors);
        if (
          structuralErrors.companyName ||
          structuralErrors.companyType ||
          structuralErrors.companyEmail ||
          structuralErrors.companyPhone ||
          structuralErrors.industry
        ) {
          setCurrentStep(1);
        } else if (
          structuralErrors.ownerEmail ||
          structuralErrors.ownerMobile ||
          structuralErrors.ownerAadhaar ||
          structuralErrors.ownerPan
        ) {
          setCurrentStep(2);
        } else if (structuralErrors.pincode) {
          setCurrentStep(3);
        } else {
          setCurrentStep(4);
        }
        return;
      }

      try {
        const payload = buildCompanyPayload(formData);
        await createCompany(payload);
        if (!isSetupComplete) {
          navigate(ROUTES.SETUP_CENTER, { replace: true });
        } else {
          navigate("/companies", { replace: true });
        }
      } catch (error) {
        setFormErrors({
          submit:
            typeof error === "string"
              ? error
              : "Unable to create company. Please try again.",
        });
      }
    },
    [createCompany, formData, navigate, isSetupComplete],
  );

  const pageProps = useMemo(
    () => ({
      formData,
      formErrors,
      isLoading,
      currentStep,

      companyTypeOptions,
      industryOptions,
      licenseStatusOptions,

      handleChange: handleFieldChange,
      handleSubmit,
      handleBack: handleBackStep,
      handleContinue,
      handleStepChange,
      handleSaveDraft,
      handleCancel: handleBackToCompanies,
      handleResetAndRefresh,
    }),
    [
      formData,
      formErrors,
      isLoading,
      currentStep,
      handleFieldChange,
      handleSubmit,
      handleBackStep,
      handleContinue,
      handleStepChange,
      handleSaveDraft,
      handleBackToCompanies,
      handleResetAndRefresh,
    ],
  );

  return isMobile ? (
    <CreateCompanyMobilePage {...pageProps} />
  ) : (
    <CreateCompanyDesktopPage {...pageProps} />
  );
};

export default CreateCompanyPage;
