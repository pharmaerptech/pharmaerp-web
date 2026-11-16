import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { API_STATUS } from "@/constants";
import { useIsMobile } from "@/hooks";

import useCompany from "../hooks/useCompany";

import EditCompanyDesktopPage from "./desktop/EditCompanyDesktopPage";
import EditCompanyMobilePage from "./mobile/EditCompanyMobilePage";

const INITIAL_FORM_DATA = {
  // Step 1: Company Details
  companyName: "",
  companyType: "private_limited",
  industry: "",
  companyEmail: "",
  companyPhone: "",
  website: "",
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

const formatIsoToYmd = (isoString) => {
  if (!isoString) return "";
  return isoString.split("T")[0];
};

const buildCompanyPayload = (formData) => {
  return {
    name: normalizeText(formData.companyName),
    type: formData.companyType || "private_limited",
    industry: formData.industry || null,
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

    if (!formData.industry) {
      errors.industry = "Industry selection is required";
    }

    if (companyEmail && !EMAIL_REGEX.test(companyEmail)) {
      errors.companyEmail = "Enter a valid email address";
    }

    if (companyPhone && !PHONE_REGEX.test(companyPhone)) {
      errors.companyPhone = "Invalid phone number";
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

const EditCompanyPage = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const {
    getCompanyById,
    updateCompany,
    updateCompanyStatus,
    getCompanyStatus,
    clearManagedCompany,
    error: companyError,
    clearError,
  } = useCompany();

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [loadedCompanyId, setLoadedCompanyId] = useState(null);

  const isLoading = updateCompanyStatus === API_STATUS.LOADING;
  const isFetching = getCompanyStatus === API_STATUS.LOADING || loadedCompanyId !== companyId;

  const loadCompanyData = useCallback(async () => {
    if (!companyId) return;

    try {
      const data = await getCompanyById(companyId);
      if (data) {
        setFormData({
          // Step 1: Company Profile Parameters
          companyName: data.name || "",
          companyType: data.type || "private_limited",
          industry: data.industry || "",
          companyEmail: data.email || "",
          companyPhone: data.phones?.mobile || "",
          website: data.website || "",
          status: data.status || "active",
          logo: data.logo || null,

          // Step 2: Individual Accountability Metrics
          ownerName: data.owner?.name || "",
          ownerEmail: data.owner?.email || "",
          ownerMobile: data.owner?.mobile || "",
          ownerAadhaar: data.owner?.aadhaar || "",
          ownerPan: data.owner?.pan || "",

          // Step 3: Location Properties
          addressLine1: data.address?.addressLine1 || "",
          addressLine2: data.address?.addressLine2 || "",
          city: data.address?.city || "",
          district: data.address?.district || "",
          state: data.address?.state || "",
          country: data.address?.country || "India",
          pincode: data.address?.pincode || "",

          // Step 4: Statutory Compliance Identifiers
          gstNumber: data.gstin || "",
          panNumber: data.pan || "",
          licenseType: data.license?.licenseType || "",
          retailLicenseNumber:
            data.license?.retailLicenseNumber || "",
          wholesaleLicenseNumber:
            data.license?.wholesaleLicenseNumber || "",
          fssaiNumber: data.license?.fssaiNumber || "",
          licenseIssuedAt: formatIsoToYmd(data.license?.issuedAt),
          licenseExpiresAt: formatIsoToYmd(data.license?.expiresAt),
          licenseStatus: data.license?.status || "pending",
          licenseDocument: data.license?.document || null,
        });
        setLoadedCompanyId(companyId);
      }
    } catch {
      setLoadedCompanyId(companyId);
      setFormErrors({
        submit: "Unable to retrieve company records. Returning to dashboard.",
      });
      setTimeout(() => {
        navigate("/companies");
      }, 2500);
    }
  }, [companyId, getCompanyById, navigate]);

  // Trigger load action on companyId parameter shifting
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCompanyData();
  }, [companyId, loadCompanyData]);

  // FIXED: Separated clean-up effect block to fire only when unmounting page layout view
  useEffect(() => {
    return () => {
      clearManagedCompany();
    };
  }, [clearManagedCompany]);

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
    navigate("/companies");
  }, [navigate]);

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

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
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
    navigate("/companies");
  }, [navigate]);

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
          structuralErrors.industry ||
          structuralErrors.companyEmail ||
          structuralErrors.companyPhone
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
        await updateCompany(companyId, payload);
        navigate("/companies", { replace: true });
      } catch (error) {
        setFormErrors({
          submit:
            typeof error === "string"
              ? error
              : "Unable to update company record modifications. Please retry.",
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companyId, formData, navigate],
  );

  const handleReload = useCallback(() => {
    setLoadedCompanyId(null);
    loadCompanyData();
  }, [loadCompanyData]);

  const desktopProps = useMemo(
    () => ({
      formData,
      formErrors,
      isLoading,
      isFetching,
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
      handleReload,
    }),
    [
      formData,
      formErrors,
      isLoading,
      isFetching,
      currentStep,
      handleFieldChange,
      handleSubmit,
      handleBackStep,
      handleContinue,
      handleStepChange,
      handleSaveDraft,
      handleBackToCompanies,
      handleReload,
    ],
  );

  return isMobile ? (
    <EditCompanyMobilePage {...desktopProps} />
  ) : (
    <EditCompanyDesktopPage {...desktopProps} />
  );
};
export default EditCompanyPage;
