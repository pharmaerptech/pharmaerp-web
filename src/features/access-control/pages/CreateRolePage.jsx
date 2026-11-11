import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile, usePermission } from "@/hooks";
import {
  WORK_LEVELS,
  WORK_MODES,
  clampWorkLevelToAllowed,
  clampWorkModeToAllowed,
  isWorkAccessPermissionKey,
  normalizeWorkLevel,
  syncPermissionsWithWorkAccess,
} from "@/utils/workAccess";

import useAccessControl from "../hooks/useAccessControl";
import {
  buildRoleMatrixViewModel,
  buildWorkAccessDisplaySummary,
  createCodeFromName,
  normalizeLowerText,
  normalizeText,
  validateWorkAccessSelection,
} from "../utils/roleForm.helper";

import CreateRoleDesktopPage from "./desktop/CreateRoleDesktopPage";
import CreateRoleMobilePage from "./mobile/CreateRoleMobilePage";

const INITIAL_FORM_DATA = {
  name: "",
  code: "",
  description: "",
  workModes: [WORK_MODES.VIEW],
  workLevel: WORK_LEVELS.BRANCH,
  permissions: [],
};

const CODE_REGEX = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

const buildCreateRolePayload = (formData) => {
  const synced = syncPermissionsWithWorkAccess({
    permissions: formData.permissions,
    workModes: formData.workModes,
    workLevel: formData.workLevel,
  });

  const payload = {
    name: normalizeText(formData.name),
    workModes: synced.workModes,
    workLevel: synced.workLevel,
    permissions: synced.permissions,
  };

  const code = normalizeLowerText(formData.code);
  const description = normalizeText(formData.description);

  if (code) payload.code = code;
  if (description) payload.description = description;

  return payload;
};

const CreateRolePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const {
    isOwner: isOwnerActor,
    allowedWorkModes: actorAllowedWorkModes,
    allowedWorkLevels: actorAllowedWorkLevels,
    highestWorkLevel: actorHighestWorkLevel,
  } = usePermission();

  const {
    permissions,

    createRole,
    getAvailablePermissions,

    createRoleStatus,
    getAvailablePermissionsStatus,

    error,
    message,

    clearError,
    clearMessage,
    clearCurrentRole,
  } = useAccessControl();

  const hasFetchedPermissionsRef = useRef(false);

  const defaultActorInitialForm = useMemo(() => {
    if (isOwnerActor) return INITIAL_FORM_DATA;
    const defaultMode = clampWorkModeToAllowed(
      WORK_MODES.VIEW,
      actorAllowedWorkModes,
    );
    const defaultLevel =
      normalizeWorkLevel(
        clampWorkLevelToAllowed(WORK_LEVELS.BRANCH, actorAllowedWorkLevels),
      ) || WORK_LEVELS.BRANCH;
    return {
      ...INITIAL_FORM_DATA,
      workModes: [defaultMode],
      workLevel: defaultLevel,
    };
  }, [actorAllowedWorkLevels, actorAllowedWorkModes, isOwnerActor]);

  const [formData, setFormData] = useState(defaultActorInitialForm);
  const [formErrors, setFormErrors] = useState({});
  const [autoCodeEnabled, setAutoCodeEnabled] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const isCreating = createRoleStatus === API_STATUS.LOADING;
  const isLoadingPermissions =
    getAvailablePermissionsStatus === API_STATUS.LOADING;
  const isLoading = isCreating || isLoadingPermissions;
  const hasPermissionError = getAvailablePermissionsStatus === API_STATUS.ERROR;

  const {
    permissionOptions,
    selectedPermissionOptions,
    permissionModules,
    moduleOptions,
    permissionSummary,
  } = useMemo(
    () =>
      buildRoleMatrixViewModel({
        permissions,
        selectedPermissions: formData.permissions,
        permissionSearch,
        moduleFilter,
      }),
    [formData.permissions, moduleFilter, permissionSearch, permissions],
  );

  const previewRole = useMemo(() => {
    const name = normalizeText(formData.name) || "New Role";
    const code = normalizeLowerText(formData.code) || createCodeFromName(name);
    const description =
      normalizeText(formData.description) ||
      "Custom workspace role with selected permissions.";

    return {
      name,
      code: code || "new_role",
      description,
      workModes: formData.workModes,
      workLevel: formData.workLevel,
      workAccess: buildWorkAccessDisplaySummary({
        workModes: formData.workModes,
        workLevel: formData.workLevel,
      }),
      permissionsCount: selectedPermissionOptions.length,
      status: "active",
      type: "Custom Role",
      isSystem: false,
      isEditable: true,
    };
  }, [formData, selectedPermissionOptions.length]);

  const fetchPermissions = useCallback(async () => {
    try {
      await getAvailablePermissions();
    } catch {
      // Error is already stored in access-control slice.
    }
  }, [getAvailablePermissions]);

  useEffect(() => {
    clearError();
    clearMessage();
    clearCurrentRole();

    return () => {
      clearError();
      clearMessage();
      clearCurrentRole();
    };
  }, [clearCurrentRole, clearError, clearMessage]);

  useEffect(() => {
    if (hasFetchedPermissionsRef.current) return;

    hasFetchedPermissionsRef.current = true;
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    if (!error) return;

    setFormErrors((prev) => ({
      ...prev,
      submit: error,
    }));
  }, [error]);

  const validateForm = useCallback(() => {
    const errors = {};
    const name = normalizeText(formData.name);
    const code = normalizeLowerText(formData.code);
    const description = normalizeText(formData.description);

    const selectedPermissions = (
      Array.isArray(formData.permissions) ? formData.permissions : []
    ).filter((p) => !isWorkAccessPermissionKey(p));

    if (!name) {
      errors.name = "Role name is required";
    } else if (name.length < 2) {
      errors.name = "Role name must be at least 2 characters";
    } else if (name.length > 80) {
      errors.name = "Role name cannot exceed 80 characters";
    }

    if (code === "owner") {
      errors.code = 'Role code "owner" is reserved';
    } else if (code && !CODE_REGEX.test(code)) {
      errors.code =
        "Role code can only contain lowercase letters, numbers and underscores";
    } else if (code.length > 100) {
      errors.code = "Role code cannot exceed 100 characters";
    }

    if (description.length > 500) {
      errors.description = "Description cannot exceed 500 characters";
    }

    const workAccessError = validateWorkAccessSelection({
      workModes: formData.workModes,
      workLevel: formData.workLevel,
      isOwnerActor,
      actorAllowedWorkModes,
      actorHighestWorkLevel,
    });
    if (workAccessError) {
      errors.workAccess = workAccessError;
    }

    const availablePermissionValues = new Set(
      permissionOptions.map((option) => option.value),
    );

    const hasInvalidPermission =
      availablePermissionValues.size > 0 &&
      selectedPermissions.some(
        (permission) => !availablePermissionValues.has(permission),
      );

    if (hasInvalidPermission) {
      errors.permissions = "One or more selected permissions are invalid";
    }

    return errors;
  }, [
    actorAllowedWorkModes,
    actorHighestWorkLevel,
    formData,
    isOwnerActor,
    permissionOptions,
  ]);

  const validateStepOne = useCallback(() => {
    const errors = validateForm();
    delete errors.permissions;
    return errors;
  }, [validateForm]);

  const handleChange = useCallback(
    (eventOrValue) => {
      if (error) clearError();

      if (eventOrValue?.target) {
        const { name, value } = eventOrValue.target;

        setFormErrors((prev) => ({
          ...prev,
          [name]: "",
          submit: "",
        }));

        setFormData((prev) => {
          const next = {
            ...prev,
            [name]: value,
          };

          if (name === "name" && autoCodeEnabled) {
            next.code = createCodeFromName(value);
          }

          if (name === "code") {
            next.code = normalizeLowerText(value);
          }

          return next;
        });

        if (name === "code") {
          setAutoCodeEnabled(false);
        }

        return;
      }

      setFormErrors((prev) => ({
        ...prev,
        submit: "",
      }));

      setFormData((prev) => ({
        ...prev,
        ...eventOrValue,
      }));
    },
    [autoCodeEnabled, clearError, error],
  );

  const handleWorkModesChange = useCallback(
    (nextModes) => {
      if (error) clearError();
      setFormErrors((prev) => ({
        ...prev,
        workAccess: "",
        submit: "",
      }));
      setFormData((prev) => ({
        ...prev,
        workModes: nextModes,
      }));
    },
    [clearError, error],
  );

  const handleWorkLevelChange = useCallback(
    (nextLevel) => {
      if (error) clearError();
      setFormErrors((prev) => ({
        ...prev,
        workAccess: "",
        submit: "",
      }));
      setFormData((prev) => ({
        ...prev,
        workLevel: nextLevel,
      }));
    },
    [clearError, error],
  );

  const handlePermissionsChange = useCallback(
    (eventOrValue) => {
      if (error) clearError();

      const value = eventOrValue?.target?.value ?? eventOrValue ?? [];
      const cleanValues = (Array.isArray(value) ? value : []).filter(
        (p) => !isWorkAccessPermissionKey(p),
      );

      setFormErrors((prev) => ({
        ...prev,
        permissions: "",
        submit: "",
      }));

      setFormData((prev) => ({
        ...prev,
        permissions: cleanValues,
      }));
    },
    [clearError, error],
  );

  const handleTogglePermission = useCallback((permission) => {
    setFormErrors((prev) => ({
      ...prev,
      permissions: "",
      submit: "",
    }));

    setFormData((prev) => {
      const exists = prev.permissions.includes(permission);

      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((item) => item !== permission)
          : [...prev.permissions, permission],
      };
    });
  }, []);

  const handleToggleModule = useCallback((module) => {
    const values = module.permissions.map((permission) => permission.value);

    setFormErrors((prev) => ({
      ...prev,
      permissions: "",
      submit: "",
    }));

    setFormData((prev) => {
      const hasAll = values.every((value) => prev.permissions.includes(value));

      const next = hasAll
        ? prev.permissions.filter((value) => !values.includes(value))
        : Array.from(new Set([...prev.permissions, ...values]));

      return {
        ...prev,
        permissions: next,
      };
    });
  }, []);

  const handleSelectAllPermissions = useCallback(() => {
    setFormErrors((prev) => ({
      ...prev,
      permissions: "",
      submit: "",
    }));

    setFormData((prev) => ({
      ...prev,
      permissions: permissionOptions.map((option) => option.value),
    }));
  }, [permissionOptions]);

  const handleClearPermissions = useCallback(() => {
    setFormErrors((prev) => ({
      ...prev,
      permissions: "",
      submit: "",
    }));

    setFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  }, []);

  const handleReset = useCallback(() => {
    if (isLoading) return;

    clearError();
    clearMessage();
    setFormData(defaultActorInitialForm);
    setFormErrors({});
    setAutoCodeEnabled(true);
    setCurrentStep(1);
    setPermissionSearch("");
    setModuleFilter("all");
  }, [clearError, clearMessage, defaultActorInitialForm, isLoading]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((step) => step - 1);
      return;
    }

    navigate(ROUTES.ROLES);
  }, [currentStep, navigate]);

  const handleCancel = useCallback(() => {
    navigate(ROUTES.ROLES);
  }, [navigate]);

  const handleViewPermissions = useCallback(() => {
    navigate(ROUTES.PERMISSIONS);
  }, [navigate]);

  const handleStepChange = useCallback(
    (step) => {
      if (step <= currentStep) {
        setCurrentStep(step);
        return;
      }

      if (step >= 2) {
        const stepErrors = validateStepOne();

        if (Object.keys(stepErrors).length > 0) {
          setFormErrors(stepErrors);
          setCurrentStep(1);
          return;
        }
      }

      setCurrentStep(step);
    },
    [currentStep, validateStepOne],
  );

  const handleContinue = useCallback(() => {
    if (currentStep === 1) {
      const stepErrors = validateStepOne();

      if (Object.keys(stepErrors).length > 0) {
        setFormErrors(stepErrors);
        return;
      }

      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      setCurrentStep(3);
    }
  }, [currentStep, validateStepOne]);

  const handleSaveDraft = useCallback(() => {
    setFormErrors({});
    navigate(ROUTES.ROLES);
  }, [navigate]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      clearError();
      clearMessage();

      const validationErrors = validateForm();

      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);

        setCurrentStep(
          validationErrors.name ||
            validationErrors.code ||
            validationErrors.description ||
            validationErrors.workAccess
            ? 1
            : 2,
        );

        return;
      }

      try {
        await createRole(buildCreateRolePayload(formData));
        navigate(ROUTES.ROLES, { replace: true });
      } catch (submitError) {
        setFormErrors((prev) => ({
          ...prev,
          submit: submitError || "Unable to create role. Please try again.",
        }));
      }
    },
    [clearError, clearMessage, createRole, formData, navigate, validateForm],
  );

  const pageProps = {
    formData,
    formErrors,

    permissionOptions,
    selectedPermissionOptions,
    permissionModules,
    moduleOptions,
    moduleFilter,
    permissionSearch,
    permissionSummary,

    actorAllowedWorkModes: isOwnerActor ? null : actorAllowedWorkModes,
    actorHighestWorkLevel: isOwnerActor ? null : actorHighestWorkLevel,

    previewRole,
    currentStep,

    isLoading,
    isCreating,
    isLoadingPermissions,
    hasPermissionError,
    error,
    message,

    handleChange,
    handleWorkModesChange,
    handleWorkLevelChange,
    handlePermissionsChange,
    handleTogglePermission,
    handleToggleModule,
    handleSelectAllPermissions,
    handleClearPermissions,
    handleSubmit,
    handleReset,
    handleBack,
    handleCancel,
    handleContinue,
    handleStepChange,
    handleSaveDraft,
    handleViewPermissions,
    handleRefreshPermissions: fetchPermissions,

    setPermissionSearch,
    setModuleFilter,
  };

  return isMobile ? (
    <CreateRoleMobilePage {...pageProps} />
  ) : (
    <CreateRoleDesktopPage {...pageProps} />
  );
};

export default CreateRolePage;
