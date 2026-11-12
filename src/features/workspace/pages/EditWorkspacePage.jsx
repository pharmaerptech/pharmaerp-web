import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS, ROUTES, TOKEN_KEY } from "@/constants";
import { storage } from "@/utils";
import { useIsMobile } from "@/hooks";

import useWorkspace from "../hooks/useWorkspace";

import EditWorkspaceDesktopPage from "./desktop/EditWorkspaceDesktopPage";
import EditWorkspaceMobilePage from "./mobile/EditWorkspaceMobilePage";

const WORKSPACE_TYPE = {
  PHARMACY: "pharmacy",
  CLINIC: "clinic",
  HOSPITAL: "hospital",
  DISTRIBUTOR: "distributor",
  OTHER: "other",
};

const INITIAL_FORM_DATA = {
  name: "",
  type: WORKSPACE_TYPE.PHARMACY,
  email: "",
  phone: "",

  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",

  timezone: "Asia/Kolkata",
  currency: "INR",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12h",

  logoUrl: "",
  logoPublicId: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9][0-9]{9}$/;

const normalizeText = (value) => String(value || "").trim();
const normalizeLowerText = (value) => normalizeText(value).toLowerCase();
const normalizeUpperText = (value) => normalizeText(value).toUpperCase();
const normalizePhone = (value) => normalizeText(value).replace(/\D/g, "");

const getWorkspaceFromItem = (item) => item?.workspace || item || null;

const getEditableWorkspace = (currentWorkspace, workspaces = []) => {
  if (currentWorkspace?._id) return currentWorkspace;

  const firstWorkspaceItem = workspaces[0];

  return getWorkspaceFromItem(firstWorkspaceItem);
};

const mapWorkspaceToFormData = (workspace) => ({
  name: workspace?.name || "",
  type: workspace?.type || WORKSPACE_TYPE.PHARMACY,
  email: workspace?.email || "",
  phone: workspace?.phone || "",

  addressLine1: workspace?.address?.addressLine1 || "",
  addressLine2: workspace?.address?.addressLine2 || "",
  city: workspace?.address?.city || "",
  state: workspace?.address?.state || "",
  country: workspace?.address?.country || "India",
  pincode: workspace?.address?.pincode || "",

  timezone: workspace?.settings?.timezone || "Asia/Kolkata",
  currency: workspace?.settings?.currency || "INR",
  dateFormat: workspace?.settings?.dateFormat || "DD/MM/YYYY",
  timeFormat: workspace?.settings?.timeFormat || "12h",

  logoUrl: workspace?.logo?.url || "",
  logoPublicId: workspace?.logo?.publicId || "",
});

const hasAddress = (formData) =>
  Boolean(
    normalizeText(formData.addressLine1) ||
    normalizeText(formData.addressLine2) ||
    normalizeText(formData.city) ||
    normalizeText(formData.state) ||
    normalizeText(formData.country) ||
    normalizeText(formData.pincode),
  );

const buildAddressPayload = (formData) => {
  if (!hasAddress(formData)) return null;

  return {
    addressLine1: normalizeText(formData.addressLine1) || null,
    addressLine2: normalizeText(formData.addressLine2) || null,
    city: normalizeText(formData.city) || null,
    state: normalizeText(formData.state) || null,
    country: normalizeText(formData.country) || "India",
    pincode: normalizeText(formData.pincode) || null,
  };
};

const buildLogoPayload = (formData) => {
  const url = normalizeText(formData.logoUrl);
  const publicId = normalizeText(formData.logoPublicId);

  if (!url && !publicId) return null;

  if (!url) return null;

  return {
    url,
    publicId: publicId || null,
  };
};

const buildPayload = (formData) => {
  const payload = {
    name: normalizeText(formData.name),
    type: formData.type || WORKSPACE_TYPE.PHARMACY,
    email: normalizeLowerText(formData.email) || null,
    phone: normalizePhone(formData.phone) || null,
    address: buildAddressPayload(formData),
    logo: buildLogoPayload(formData),
    settings: {
      timezone: normalizeText(formData.timezone) || "Asia/Kolkata",
      currency: normalizeUpperText(formData.currency) || "INR",
      dateFormat: normalizeText(formData.dateFormat) || "DD/MM/YYYY",
      timeFormat: formData.timeFormat || "12h",
    },
  };

  return payload;
};

const validateForm = (formData) => {
  const errors = {};

  const name = normalizeText(formData.name);
  const email = normalizeLowerText(formData.email);
  const phone = normalizePhone(formData.phone);
  const currency = normalizeUpperText(formData.currency);
  const logoUrl = normalizeText(formData.logoUrl);

  if (!name) {
    errors.name = "Workspace name is required";
  } else if (name.length < 2) {
    errors.name = "Workspace name must be at least 2 characters";
  } else if (name.length > 120) {
    errors.name = "Workspace name cannot exceed 120 characters";
  }

  if (!Object.values(WORKSPACE_TYPE).includes(formData.type)) {
    errors.type = "Select a valid workspace type";
  }

  if (email && !EMAIL_REGEX.test(email)) {
    errors.email = "Enter a valid email address";
  }

  if (phone && !PHONE_REGEX.test(phone)) {
    errors.phone = "Enter a valid 10-digit Indian mobile number";
  }

  if (currency && currency.length !== 3) {
    errors.currency = "Currency must be a 3-letter code";
  }

  if (formData.timeFormat && !["12h", "24h"].includes(formData.timeFormat)) {
    errors.timeFormat = "Select a valid time format";
  }

  if (logoUrl) {
    try {
      const url = new URL(logoUrl);

      if (!["http:", "https:"].includes(url.protocol)) {
        errors.logoUrl = "Enter a valid logo URL";
      }
    } catch {
      errors.logoUrl = "Enter a valid logo URL";
    }
  }

  return errors;
};

const workspaceTypeOptions = [
  { label: "Pharmacy", value: WORKSPACE_TYPE.PHARMACY },
  { label: "Clinic", value: WORKSPACE_TYPE.CLINIC },
  { label: "Hospital", value: WORKSPACE_TYPE.HOSPITAL },
  { label: "Distributor", value: WORKSPACE_TYPE.DISTRIBUTOR },
  { label: "Other", value: WORKSPACE_TYPE.OTHER },
];

const currencyOptions = [
  { label: "INR - Indian Rupee (₹)", value: "INR" },
  { label: "USD - US Dollar ($)", value: "USD" },
];

const timeFormatOptions = [
  { label: "12 Hour", value: "12h" },
  { label: "24 Hour", value: "24h" },
];

const EditWorkspacePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const fetchedWorkspaceIdRef = useRef(null);

  const {
    workspaces,
    currentWorkspace,

    getMyWorkspacesStatus,
    getWorkspaceStatus,
    updateWorkspaceStatus,

    error,

    getMyWorkspaces,
    getWorkspaceById,
    updateWorkspace,

    clearError,
    clearMessage,
    setCurrentWorkspace,
  } = useWorkspace();

  const editableWorkspace = useMemo(
    () => getEditableWorkspace(currentWorkspace, workspaces),
    [currentWorkspace, workspaces],
  );

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState({});

  const isFetchingWorkspaces = getMyWorkspacesStatus === API_STATUS.LOADING;
  const isFetchingWorkspace = getWorkspaceStatus === API_STATUS.LOADING;
  const isUpdating = updateWorkspaceStatus === API_STATUS.LOADING;

  const isLoading = isFetchingWorkspaces || isFetchingWorkspace;
  const isSubmitting = isUpdating;

  useEffect(() => {
    clearError();
    clearMessage();

    return () => {
      clearError();
      clearMessage();
    };
  }, [clearError, clearMessage]);

  useEffect(() => {
    if (
      getMyWorkspacesStatus === API_STATUS.IDLE &&
      Boolean(storage.get(TOKEN_KEY))
    ) {
      getMyWorkspaces().catch(() => {});
    }
  }, [getMyWorkspaces, getMyWorkspacesStatus]);

  useEffect(() => {
    if (editableWorkspace?._id) {
      setFormData(mapWorkspaceToFormData(editableWorkspace));
    }
  }, [editableWorkspace?._id]);

  useEffect(() => {
    if (editableWorkspace?._id && !currentWorkspace?._id) {
      setCurrentWorkspace(editableWorkspace);
    }
  }, [currentWorkspace?._id, editableWorkspace, setCurrentWorkspace]);

  useEffect(() => {
    const workspaceId = currentWorkspace?._id;

    if (!workspaceId) return;
    if (fetchedWorkspaceIdRef.current === workspaceId) return;
    if (getWorkspaceStatus === API_STATUS.LOADING) return;

    fetchedWorkspaceIdRef.current = workspaceId;

    getWorkspaceById(workspaceId).catch(() => {
      fetchedWorkspaceIdRef.current = null;
    });

    // Intentionally excluding getWorkspaceById to prevent repeated fetches
    // when the hook returns a new function reference after Redux updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?._id, getWorkspaceStatus]);

  useEffect(() => {
    if (error) {
      setFormErrors((prev) => ({
        ...prev,
        submit: error,
      }));
    }
  }, [error]);

  const handleChange = useCallback(
    (eventOrName, maybeValue) => {
      const isEvent = Boolean(eventOrName?.target);
      const name = isEvent ? eventOrName.target.name : eventOrName;
      const value = isEvent ? eventOrName.target.value : maybeValue;

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (formErrors[name] || formErrors.submit) {
        setFormErrors((prev) => ({
          ...prev,
          [name]: "",
          submit: "",
        }));
      }

      if (error) {
        clearError();
      }
    },
    [clearError, error, formErrors],
  );

  const handleBack = useCallback(() => {
    navigate(ROUTES.WORKSPACE);
  }, [navigate]);

  const handleViewDetails = useCallback(() => {
    navigate(ROUTES.WORKSPACE_DETAILS);
  }, [navigate]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      clearError();
      clearMessage();

      if (!editableWorkspace?._id) {
        setFormErrors({
          submit: "No workspace selected to update",
        });
        return;
      }

      const validationErrors = validateForm(formData);

      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        return;
      }

      try {
        const updatedWorkspace = await updateWorkspace(
          editableWorkspace._id,
          buildPayload(formData),
        );

        if (updatedWorkspace) {
          setCurrentWorkspace(updatedWorkspace);
        }

        navigate(ROUTES.WORKSPACE_DETAILS, {
          replace: true,
          state: {
            workspaceId: updatedWorkspace?._id || editableWorkspace._id,
            workspace: updatedWorkspace,
          },
        });
      } catch (submitError) {
        setFormErrors((prev) => ({
          ...prev,
          submit:
            typeof submitError === "string"
              ? submitError
              : "Unable to update workspace. Please try again.",
        }));
      }
    },
    [
      clearError,
      clearMessage,
      editableWorkspace,
      formData,
      navigate,
      setCurrentWorkspace,
      updateWorkspace,
    ],
  );

  const pageProps = {
    workspace: editableWorkspace,
    formData,
    formErrors,

    workspaceTypeOptions,
    currencyOptions,
    timeFormatOptions,

    isLoading,
    isSubmitting,

    handleChange,
    handleSubmit,
    handleBack,
    handleViewDetails,
  };

  return isMobile ? (
    <EditWorkspaceMobilePage {...pageProps} />
  ) : (
    <EditWorkspaceDesktopPage {...pageProps} />
  );
};

export default EditWorkspacePage;
