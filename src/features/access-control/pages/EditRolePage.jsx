import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile, usePermission } from "@/hooks";
import {
  WORK_LEVELS,
  WORK_MODES,
  isWorkAccessPermissionKey,
  resolveRoleWorkAccess,
  syncPermissionsWithWorkAccess,
} from "@/utils/workAccess";

import useAccessControl from "../hooks/useAccessControl";
import {
  buildRoleMatrixViewModel,
  buildWorkAccessDisplaySummary,
  normalizeLowerText,
  normalizeText,
  validateWorkAccessSelection,
} from "../utils/roleForm.helper";

import EditRoleDesktopPage from "./desktop/EditRoleDesktopPage";
import EditRoleMobilePage from "./mobile/EditRoleMobilePage";

const INITIAL_FORM_DATA = {
  name: "",
  code: "",
  description: "",
  workModes: [WORK_MODES.VIEW],
  workLevel: WORK_LEVELS.BRANCH,
  permissions: [],
  status: "active",
};

const hydrateRoleToFormData = (role) => {
  const workAccess = resolveRoleWorkAccess(role);
  const modulePermissions = (
    Array.isArray(role?.permissions) ? role.permissions : []
  ).filter((permission) => !isWorkAccessPermissionKey(permission));

  return {
    name: role?.name || "",
    code: role?.code || "",
    description: role?.description || "",
    workModes: workAccess.allowedWorkModes,
    workLevel: workAccess.highestWorkLevel,
    permissions: modulePermissions,
    status: role?.status || "active",
  };
};

const buildUpdateRolePayload = (formData) => {
  const synced = syncPermissionsWithWorkAccess({
    permissions: formData.permissions,
    workModes: formData.workModes,
    workLevel: formData.workLevel,
  });

  const payload = {
    name: normalizeText(formData.name),
    description: normalizeText(formData.description),
    workModes: synced.workModes,
    workLevel: synced.workLevel,
    permissions: synced.permissions,
    status: formData.status || "active",
  };

  if (!payload.description) {
    payload.description = "";
  }

  return payload;
};

const EditRolePage = () => {
  const navigate = useNavigate();
  const { roleId } = useParams();
  const isMobile = useIsMobile();

  const {
    isOwner: isOwnerActor,
    allowedWorkModes: actorAllowedWorkModes,
    highestWorkLevel: actorHighestWorkLevel,
  } = usePermission();

  const {
    currentRole,
    permissions,

    getRoleById,
    updateRole,
    getAvailablePermissions,

    getRoleStatus,
    updateRoleStatus,
    getAvailablePermissionsStatus,

    error,
    message,

    clearError,
    clearMessage,
    clearCurrentRole,
  } = useAccessControl();

  const hasFetchedRoleRef = useRef(false);
  const hasFetchedPermissionsRef = useRef(false);
  const hasHydratedFormRef = useRef(false);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const isUpdating = updateRoleStatus === API_STATUS.LOADING;
  const isLoadingRole = getRoleStatus === API_STATUS.LOADING;
  const isLoadingPermissions =
    getAvailablePermissionsStatus === API_STATUS.LOADING;

  const isLoading = isUpdating || isLoadingRole || isLoadingPermissions;

  const hasRoleError = getRoleStatus === API_STATUS.ERROR;
  const hasPermissionError = getAvailablePermissionsStatus === API_STATUS.ERROR;

  const isOwnerRole =
    normalizeLowerText(currentRole?.code || currentRole?.roleCode) === "owner";
  const isRoleLocked = Boolean(
    currentRole && (isOwnerRole || currentRole.isEditable === false),
  );

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
    const name = normalizeText(formData.name) || "Role";
    const code = normalizeLowerText(formData.code) || "role";
    const description =
      normalizeText(formData.description) ||
      "Workspace role with selected permissions.";

    return {
      ...(currentRole || {}),
      name,
      code,
      description,
      workModes: formData.workModes,
      workLevel: formData.workLevel,
      workAccess: buildWorkAccessDisplaySummary({
        workModes: formData.workModes,
        workLevel: formData.workLevel,
      }),
      permissionsCount: selectedPermissionOptions.length,
      status: formData.status || "active",
      type: currentRole?.isSystem ? "System Role" : "Custom Role",
      isSystem: Boolean(currentRole?.isSystem),
      isEditable: currentRole?.isEditable !== false && !isOwnerRole,
    };
  }, [currentRole, formData, isOwnerRole, selectedPermissionOptions.length]);

  const fetchRole = useCallback(async () => {
    if (!roleId) return;

    try {
      await getRoleById(roleId);
    } catch {
      // Error is stored in slice context.
    }
  }, [getRoleById, roleId]);

  const fetchPermissions = useCallback(async () => {
    try {
      await getAvailablePermissions();
    } catch {
      // Error is stored in slice context.
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
    if (hasFetchedRoleRef.current) return;

    hasFetchedRoleRef.current = true;
    fetchRole();
  }, [fetchRole]);

  useEffect(() => {
    if (hasFetchedPermissionsRef.current) return;

    hasFetchedPermissionsRef.current = true;
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    if (!currentRole || hasHydratedFormRef.current) return;

    hasHydratedFormRef.current = true;
    setFormData(hydrateRoleToFormData(currentRole));
  }, [currentRole]);

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

    if (description.length > 500) {
      errors.description = "Description cannot exceed 500 characters";
    }

    if (!["active", "inactive"].includes(formData.status)) {
      errors.status = "Invalid role status";
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

        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));

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
    [clearError, error],
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
    if (isLoading || !currentRole) return;

    clearError();
    clearMessage();

    setFormData(hydrateRoleToFormData(currentRole));
    setFormErrors({});
    setCurrentStep(1);
    setPermissionSearch("");
    setModuleFilter("all");
  }, [clearError, clearMessage, currentRole, isLoading]);

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

  const handleRefreshRole = useCallback(async () => {
    hasHydratedFormRef.current = false;
    await fetchRole();
  }, [fetchRole]);

  const handleSubmit = useCallback(
    async (event) => {
      if (event) event.preventDefault();
      if (isRoleLocked) return;

      clearError();
      clearMessage();

      const validationErrors = validateForm();

      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);

        setCurrentStep(
          validationErrors.name ||
            validationErrors.description ||
            validationErrors.status ||
            validationErrors.workAccess
            ? 1
            : 2,
        );

        return;
      }

      try {
        await updateRole(roleId, buildUpdateRolePayload(formData));
        navigate(ROUTES.ROLES, { replace: true });
      } catch (submitError) {
        setFormErrors((prev) => ({
          ...prev,
          submit: submitError || "Unable to update role. Please try again.",
        }));
      }
    },
    [
      clearError,
      clearMessage,
      formData,
      isRoleLocked,
      navigate,
      roleId,
      updateRole,
      validateForm,
    ],
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
    isRoleLocked,
    isOwnerRole,

    previewRole,
    currentStep,

    isLoading,
    isUpdating,
    isLoadingRole,
    isLoadingPermissions,
    hasRoleError,
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
    handleRefreshPermissions: fetchPermissions,
    handleRefreshRole,

    setPermissionSearch,
    setModuleFilter,
  };

  return isMobile ? (
    <EditRoleMobilePage {...pageProps} />
  ) : (
    <EditRoleDesktopPage {...pageProps} />
  );
};

export default EditRolePage;
