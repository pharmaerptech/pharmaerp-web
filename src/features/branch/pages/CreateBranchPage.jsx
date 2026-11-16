// src/features/branch/pages/CreateBranchPage.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile } from "@/hooks";
import useCompany from "@/features/company/hooks/useCompany";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";

import useBranch from "../hooks/useBranch";

import CreateBranchDesktopPage from "./desktop/CreateBranchDesktopPage";
import CreateBranchMobilePage from "./mobile/CreateBranchMobilePage";

const INITIAL_FORM_DATA = {
  // Step 1: Basic Profile Details
  branchName: "",
  branchType: "retail",
  isPrimary: "false",
  branchEmail: "",
  mobile: "",
  whatsapp: "",
  landline: "",

  // Step 2: Address (ADDRESS_SCHEMA)
  addressLine1: "",
  addressLine2: "",
  city: "",
  district: "",
  state: "",
  country: "India",
  pincode: "",
  googleMapLocation: "",

  // Step 3: Licenses (LICENSE_SCHEMA)
  drugLicenseNumber: "",
  drugLicenseType: "",
  fssaiNumber: "",
  licenseExpiresAt: "",

  // Step 4: Compliance Contacts (PHARMACIST_SCHEMA & EMERGENCY_CONTACT_SCHEMA)
  pharmacistName: "",
  pharmacistRegistrationNumber: "",
  pharmacistMobile: "",
  pharmacistEmail: "",
  emergencyContactName: "",
  emergencyContactMobile: "",
  emergencyContactRelationship: "",
};

const branchTypeOptions = [
  { label: "Select branch type", value: "" },
  { label: "Retail", value: "retail" },
  { label: "Wholesale", value: "wholesale" },
  { label: "Warehouse", value: "warehouse" },
  { label: "Clinic Pharmacy", value: "clinic_pharmacy" },
  { label: "Hospital Pharmacy", value: "hospital_pharmacy" },
  { label: "Online", value: "online" },
  { label: "Other", value: "other" },
];

const booleanOptions = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" },
];

const PHONE_REGEX = /^[6-9][0-9]{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeText = (value) => String(value || "").trim();
const normalizeUpperText = (value) => normalizeText(value).toUpperCase();
const normalizeLowerText = (value) => normalizeText(value).toLowerCase();
const normalizePhone = (value) => normalizeText(value).replace(/\D/g, "");
const toBoolean = (value) => value === true || value === "true";

const toDateOrNull = (value) => {
  const trimmedValue = normalizeText(value);
  if (!trimmedValue) return null;
  const parsedDate = new Date(trimmedValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
};

const buildBranchPayload = (formData) => {
  return {
    name: normalizeText(formData.branchName),
    type: formData.branchType || "retail",
    isPrimary: toBoolean(formData.isPrimary),
    email: normalizeLowerText(formData.branchEmail) || null,

    phones: {
      mobile: normalizePhone(formData.mobile) || null,
      whatsapp: normalizePhone(formData.whatsapp) || null,
      landline: normalizeText(formData.landline) || null,
    },

    address: {
      addressLine1: normalizeText(formData.addressLine1) || null,
      addressLine2: normalizeText(formData.addressLine2) || null,
      city: normalizeText(formData.city) || null,
      district: normalizeText(formData.district) || null,
      state: normalizeText(formData.state) || null,
      country: normalizeText(formData.country) || "India",
      pincode: normalizeText(formData.pincode) || null,
      googleMapLocation: normalizeText(formData.googleMapLocation) || null,
    },

    license: {
      drugLicenseNumber: normalizeUpperText(formData.drugLicenseNumber) || null,
      drugLicenseType: normalizeText(formData.drugLicenseType) || null,
      fssaiNumber: normalizeText(formData.fssaiNumber) || null,
      expiresAt: toDateOrNull(formData.licenseExpiresAt),
    },

    pharmacist: {
      name: normalizeText(formData.pharmacistName) || null,
      registrationNumber:
        normalizeUpperText(formData.pharmacistRegistrationNumber) || null,
      mobile: normalizePhone(formData.pharmacistMobile) || null,
      email: normalizeLowerText(formData.pharmacistEmail) || null,
    },

    emergencyContact: {
      name: normalizeText(formData.emergencyContactName) || null,
      mobile: normalizePhone(formData.emergencyContactMobile) || null,
      relationship:
        normalizeText(formData.emergencyContactRelationship) || null,
    },
  };
};

const validateStepData = (step, formData) => {
  const errors = {};

  if (step === 1) {
    const branchName = normalizeText(formData.branchName);
    const branchEmail = normalizeLowerText(formData.branchEmail);
    const mobile = normalizePhone(formData.mobile);
    const whatsapp = normalizePhone(formData.whatsapp);

    if (!branchName) {
      errors.branchName = "Branch name is required";
    } else if (branchName.length < 2) {
      errors.branchName = "Branch name must be at least 2 characters";
    } else if (branchName.length > 160) {
      errors.branchName = "Branch name cannot exceed 160 characters";
    }

    if (!formData.branchType) {
      errors.branchType = "Branch type selection is required";
    }
    if (branchEmail && !EMAIL_REGEX.test(branchEmail)) {
      errors.branchEmail = "Enter a valid branch email address";
    }
    if (!mobile) {
      errors.mobile = "Mobile number is required";
    } else if (!PHONE_REGEX.test(mobile)) {
      errors.mobile = "Invalid mobile number";
    }
    if (whatsapp && !PHONE_REGEX.test(whatsapp)) {
      errors.whatsapp = "Invalid WhatsApp number";
    }
  }

  if (step === 2) {
    const pincode = normalizeText(formData.pincode);
    if (!pincode) {
      errors.pincode = "Pincode is required";
    } else if (pincode.length !== 6) {
      errors.pincode = "Pincode must be exactly 6 digits";
    }
  }

  if (step === 4) {
    const pharmacistMobile = normalizePhone(formData.pharmacistMobile);
    const pharmacistEmail = normalizeLowerText(formData.pharmacistEmail);
    const emergencyContactMobile = normalizePhone(
      formData.emergencyContactMobile,
    );

    if (pharmacistEmail && !EMAIL_REGEX.test(pharmacistEmail)) {
      errors.pharmacistEmail = "Enter a valid pharmacist email";
    }
    if (pharmacistMobile && !PHONE_REGEX.test(pharmacistMobile)) {
      errors.pharmacistMobile = "Invalid pharmacist mobile number";
    }
    if (emergencyContactMobile && !PHONE_REGEX.test(emergencyContactMobile)) {
      errors.emergencyContactMobile = "Invalid emergency contact mobile number";
    }
  }

  return errors;
};

const CreateBranchPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isSetupComplete } = useSetupStatus();
  const { currentCompany, companies, setCurrentCompany, getCompanies } = useCompany();

  const {
    createBranch,
    createBranchStatus,
    error: branchError,
    clearError,
  } = useBranch();

  useEffect(() => {
    if ((!companies || companies.length === 0) && typeof getCompanies === "function") {
      getCompanies().catch(() => null);
    }
  }, [companies, getCompanies]);

  useEffect(() => {
    if (!currentCompany && Array.isArray(companies) && companies.length > 0) {
      setCurrentCompany(companies[0]);
    }
  }, [currentCompany, companies, setCurrentCompany]);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);

  const isLoading = createBranchStatus === API_STATUS.LOADING;

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

      if (branchError) {
        clearError();
      }
    },
    [clearError, branchError, formErrors],
  );

  const handleBackToBranches = useCallback(() => {
    if (!isSetupComplete) {
      navigate(ROUTES.SETUP_CENTER);
    } else {
      navigate("/branches");
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
      handleBackToBranches();
    }
  }, [currentStep, handleBackToBranches]);

  const handleSaveDraft = useCallback(() => {
    setFormErrors({});
    if (!isSetupComplete) {
      navigate(ROUTES.SETUP_CENTER);
    } else {
      navigate("/branches");
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
          structuralErrors.branchName ||
          structuralErrors.branchType ||
          structuralErrors.branchEmail ||
          structuralErrors.mobile ||
          structuralErrors.whatsapp
        ) {
          setCurrentStep(1);
        } else if (structuralErrors.pincode) {
          setCurrentStep(2);
        } else if (
          structuralErrors.pharmacistEmail ||
          structuralErrors.pharmacistMobile ||
          structuralErrors.emergencyContactMobile
        ) {
          setCurrentStep(4);
        } else {
          setCurrentStep(3);
        }
        return;
      }

      try {
        const payload = buildBranchPayload(formData);
        const targetCompanyId =
          currentCompany?._id ||
          currentCompany?.id ||
          companies?.[0]?._id ||
          companies?.[0]?.id ||
          (() => {
            try {
              return localStorage.getItem("pahuch_active_company_id");
            } catch {
              return null;
            }
          })();

        await createBranch({
          ...payload,
          ...(targetCompanyId ? { companyId: targetCompanyId } : {}),
        });

        if (!isSetupComplete) {
          navigate(ROUTES.SETUP_CENTER, { replace: true });
        } else {
          navigate("/branches", { replace: true });
        }
      } catch (error) {
        setFormErrors({
          submit:
            typeof error === "string"
              ? error
              : "Unable to create branch. Please try again.",
        });
      }
    },
    [createBranch, formData, navigate, currentCompany, companies, isSetupComplete],
  );

  const pageProps = useMemo(
    () => ({
      formData,
      formErrors,
      isLoading,
      currentStep,

      branchTypeOptions,
      booleanOptions,

      handleChange: handleFieldChange,
      handleSubmit,
      handleBack: handleBackStep,
      handleContinue,
      handleStepChange,
      handleSaveDraft,
      handleCancel: handleBackToBranches,
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
      handleBackToBranches,
      handleResetAndRefresh,
    ],
  );

  return isMobile ? (
    <CreateBranchMobilePage {...pageProps} />
  ) : (
    <CreateBranchDesktopPage {...pageProps} />
  );
};

export default CreateBranchPage;
