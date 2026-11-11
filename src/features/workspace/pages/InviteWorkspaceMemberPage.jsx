// src/features/workspace/pages/InviteWorkspaceMemberPage.jsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_STATUS, ROUTES } from "@/constants";
import { useIsMobile, usePermission } from "@/hooks";
import { canActorAssignRole } from "@/features/access-control/utils/roleForm.helper";

import useWorkspace from "../hooks/useWorkspace";
import useAccessControl from "@/features/access-control/hooks/useAccessControl";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import { CredentialSuccessModal } from "../components";

import InviteWorkspaceMemberDesktopPage from "./desktop/InviteWorkspaceMemberDesktopPage";
import InviteWorkspaceMemberMobilePage from "./mobile/InviteWorkspaceMemberMobilePage";

const INITIAL_FORM_DATA = {
  mode: "direct", // "direct" (Direct Add Staff) | "invite" (Email Link)
  fullName: "",
  phone: "",
  email: "",
  password: "",
  roleId: "",
  accessAllCompanies: false,
  accessAllBranches: false,
  companyIds: [],
  branchAccess: [], // [{ branchId, roleId, canOperateMarketplaceStore }]
  notes: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9][0-9]{9}$/;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const normalizeText = (value) => String(value || "").trim();
const normalizeLowerText = (value) => normalizeText(value).toLowerCase();

const generateRandomPassword = () => {
  const num = Math.floor(100 + Math.random() * 900);
  return `Staff@${num}`;
};

const InviteWorkspaceMemberPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isOwner: isOwnerActor, workAccess: actorWorkAccess } = usePermission();

  const {
    currentWorkspace,
    getMyWorkspaces,
    inviteWorkspaceMember,
    directCreateWorkspaceMember,
    getMyWorkspacesStatus,
    inviteWorkspaceMemberStatus,
    directCreateWorkspaceMemberStatus,
    error,
    message,
    clearError,
    clearMessage,
  } = useWorkspace();

  const { roles, getWorkspaceRoles, getWorkspaceRolesStatus } =
    useAccessControl();

  const {
    companies,
    getWorkspaceCompanies,
    getWorkspaceCompaniesStatus,
  } = useCompany();

  const {
    branches,
    getWorkspaceBranches,
    getWorkspaceBranchesStatus,
  } = useBranch();

  const hasFetchedWorkspacesRef = useRef(false);
  const hasFetchedRolesRef = useRef(false);
  const hasFetchedCompaniesRef = useRef(false);
  const hasFetchedBranchesRef = useRef(false);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState({});
  const [successCredentials, setSuccessCredentials] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const workspaceId = currentWorkspace?._id;

  const isCheckingWorkspace = getMyWorkspacesStatus === API_STATUS.LOADING;
  const isFetchingRoles = getWorkspaceRolesStatus === API_STATUS.LOADING;
  const isFetchingCompanies = getWorkspaceCompaniesStatus === API_STATUS.LOADING;
  const isFetchingBranches = getWorkspaceBranchesStatus === API_STATUS.LOADING;
  const isInviting = inviteWorkspaceMemberStatus === API_STATUS.LOADING;
  const isDirectCreating =
    directCreateWorkspaceMemberStatus === API_STATUS.LOADING;

  const isLoading =
    isCheckingWorkspace ||
    isFetchingRoles ||
    isFetchingCompanies ||
    isFetchingBranches ||
    isInviting ||
    isDirectCreating;

  const activeRoles = useMemo(
    () =>
      (Array.isArray(roles) ? roles : []).filter(
        (role) => role?.status === "active" && !role?.isDeleted && canActorAssignRole(role, { isOwner: isOwnerActor, actorWorkAccess }),
      ),
    [actorWorkAccess, isOwnerActor, roles],
  );

  const activeCompanies = useMemo(
    () =>
      (Array.isArray(companies) ? companies : []).filter(
        (c) => c?.status === "active" && !c?.isDeleted,
      ),
    [companies],
  );

  const activeBranches = useMemo(
    () =>
      (Array.isArray(branches) ? branches : []).filter(
        (b) => b?.status === "active" && !b?.isDeleted,
      ),
    [branches],
  );

  const workspaceSummary = useMemo(
    () => ({
      name: currentWorkspace?.name || "Workspace",
      code: currentWorkspace?.workspaceCode || "-",
      type: currentWorkspace?.type || "-",
      email: currentWorkspace?.email || "-",
      phone: currentWorkspace?.phone ? `+91 ${currentWorkspace.phone}` : "-",
    }),
    [currentWorkspace],
  );

  useEffect(() => {
    clearError();
    clearMessage();

    return () => {
      clearError();
      clearMessage();
    };
  }, []);

  useEffect(() => {
    if (workspaceId || hasFetchedWorkspacesRef.current) return;
    hasFetchedWorkspacesRef.current = true;
    getMyWorkspaces().catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || hasFetchedRolesRef.current) return;
    hasFetchedRolesRef.current = true;
    getWorkspaceRoles().catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || hasFetchedCompaniesRef.current) return;
    hasFetchedCompaniesRef.current = true;
    getWorkspaceCompanies().catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || hasFetchedBranchesRef.current) return;
    hasFetchedBranchesRef.current = true;
    getWorkspaceBranches().catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    if (!error) return;
    setFormErrors((prev) => ({
      ...prev,
      submit: error,
    }));
  }, [error]);

  const handleModeChange = useCallback((newMode) => {
    setFormErrors({});
    setFormData((prev) => ({
      ...prev,
      mode: newMode,
      password: newMode === "direct" && !prev.password ? generateRandomPassword() : prev.password,
    }));
  }, []);

  const handleGeneratePassword = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      password: generateRandomPassword(),
    }));
  }, []);

  const hasCompanies = activeCompanies.length > 0;
  const hasBranches = activeBranches.length > 0;
  const canCreateOrInvite = hasCompanies && hasBranches;

  const validateForm = useCallback(() => {
    const errors = {};
    const mode = formData.mode;
    const fullName = normalizeText(formData.fullName);
    const phone = normalizeText(formData.phone);
    const email = normalizeLowerText(formData.email);
    const password = normalizeText(formData.password);
    const roleId = normalizeText(formData.roleId);
    const notes = normalizeText(formData.notes);

    if (!hasCompanies) {
      errors.submit = "Please create at least one operating company before adding or inviting team members.";
      return errors;
    }

    if (!hasBranches) {
      errors.submit = "Please create at least one dispensary branch before adding or inviting team members.";
      return errors;
    }

    if (mode === "direct") {
      if (!fullName) {
        errors.fullName = "Staff full name is required";
      } else if (fullName.length < 2) {
        errors.fullName = "Full name must be at least 2 characters";
      }

      if (!phone && !email) {
        errors.phone = "Please provide at least a 10-digit mobile number or email";
      }

      if (phone && !PHONE_REGEX.test(phone)) {
        errors.phone = "Enter a valid 10-digit Indian mobile number (e.g. 9876543210)";
      }

      if (email && !EMAIL_REGEX.test(email)) {
        errors.email = "Enter a valid email address";
      }

      if (!password) {
        errors.password = "Initial password or PIN is required";
      } else if (password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }
    } else {
      // Invite Link Mode
      if (!email) {
        errors.email = "Email address is required to send invitation";
      } else if (!EMAIL_REGEX.test(email)) {
        errors.email = "Enter a valid email address";
      }
    }

    if (roleId && !OBJECT_ID_REGEX.test(roleId)) {
      errors.roleId = "Enter a valid role id";
    }

    if (notes.length > 500) {
      errors.notes = "Notes cannot exceed 500 characters";
    }

    if (!workspaceId) {
      errors.submit = "Workspace is not ready. Please refresh and try again.";
    }

    return errors;
  }, [formData, hasBranches, hasCompanies, workspaceId]);

  const handleChange = useCallback(
    (event) => {
      const { name, value, type, checked } = event.target;

      if (error) clearError();

      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
        submit: "",
      }));

      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    },
    [clearError, error],
  );

  const handleToggleCompany = useCallback((companyId) => {
    setFormData((prev) => {
      const exists = prev.companyIds.includes(companyId);
      const updatedCompanyIds = exists
        ? prev.companyIds.filter((id) => id !== companyId)
        : [...prev.companyIds, companyId];

      return {
        ...prev,
        companyIds: updatedCompanyIds,
      };
    });
  }, []);

  const handleToggleBranchAccess = useCallback((branchId, defaultRoleId = "") => {
    setFormData((prev) => {
      const existingIndex = prev.branchAccess.findIndex(
        (ba) => ba.branchId === branchId,
      );

      if (existingIndex > -1) {
        return {
          ...prev,
          branchAccess: prev.branchAccess.filter((ba) => ba.branchId !== branchId),
        };
      } else {
        return {
          ...prev,
          branchAccess: [
            ...prev.branchAccess,
            {
              branchId,
              roleId: defaultRoleId || prev.roleId || null,
              canOperateMarketplaceStore: false,
            },
          ],
        };
      }
    });
  }, []);

  const handleBranchRoleChange = useCallback((branchId, roleId) => {
    setFormData((prev) => ({
      ...prev,
      branchAccess: prev.branchAccess.map((ba) =>
        ba.branchId === branchId ? { ...ba, roleId: roleId || null } : ba,
      ),
    }));
  }, []);

  const handleBranchMarketplaceToggle = useCallback((branchId) => {
    setFormData((prev) => ({
      ...prev,
      branchAccess: prev.branchAccess.map((ba) =>
        ba.branchId === branchId
          ? { ...ba, canOperateMarketplaceStore: !ba.canOperateMarketplaceStore }
          : ba,
      ),
    }));
  }, []);

  const handleReset = useCallback(() => {
    if (isLoading) return;

    clearError();
    clearMessage();
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
  }, [clearError, clearMessage, isLoading]);

  const handleBack = useCallback(() => {
    navigate(ROUTES.WORKSPACE_MEMBERS);
  }, [navigate]);

  const handleViewInvitations = useCallback(() => {
    navigate(ROUTES.WORKSPACE_INVITATIONS);
  }, [navigate]);

  const handleViewMembers = useCallback(() => {
    navigate(ROUTES.WORKSPACE_MEMBERS);
  }, [navigate]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      clearError();
      clearMessage();

      const validationErrors = validateForm();

      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        return;
      }

      if (formData.mode === "direct") {
        try {
          const res = await directCreateWorkspaceMember(workspaceId, {
            fullName: normalizeText(formData.fullName),
            phone: normalizeText(formData.phone) || null,
            email: normalizeLowerText(formData.email) || null,
            password: formData.password,
            roleId: normalizeText(formData.roleId) || null,
            companyIds: formData.companyIds,
            branchAccess: formData.branchAccess,
            accessAllCompanies: Boolean(formData.accessAllCompanies),
            accessAllBranches: Boolean(formData.accessAllBranches),
          });

          if (res?.credentials) {
            setSuccessCredentials(res.credentials);
            setIsSuccessModalOpen(true);
          } else {
            navigate(ROUTES.WORKSPACE_MEMBERS, { replace: true });
          }
        } catch (submitError) {
          setFormErrors((prev) => ({
            ...prev,
            submit:
              submitError ||
              "Unable to create staff member. Please check details and try again.",
          }));
        }
      } else {
        // Invite Link Mode
        try {
          await inviteWorkspaceMember(workspaceId, {
            email: normalizeLowerText(formData.email),
            roleId: normalizeText(formData.roleId) || null,
            companyIds: formData.companyIds,
            branchAccess: formData.branchAccess,
            accessAllCompanies: Boolean(formData.accessAllCompanies),
            accessAllBranches: Boolean(formData.accessAllBranches),
            notes: normalizeText(formData.notes) || undefined,
          });
          navigate(ROUTES.WORKSPACE_INVITATIONS, { replace: true });
        } catch (submitError) {
          setFormErrors((prev) => ({
            ...prev,
            submit:
              submitError ||
              "Unable to invite workspace member. Please try again.",
          }));
        }
      }
    },
    [
      clearError,
      clearMessage,
      directCreateWorkspaceMember,
      formData,
      inviteWorkspaceMember,
      navigate,
      validateForm,
      workspaceId,
    ],
  );

  const pageProps = {
    formData,
    formErrors,

    workspace: currentWorkspace,
    workspaceSummary,
    roles: activeRoles,
    companies: activeCompanies,
    branches: activeBranches,
    hasCompanies,
    hasBranches,
    canCreateOrInvite,

    isLoading,
    isCheckingWorkspace,
    isFetchingRoles,
    isFetchingCompanies,
    isFetchingBranches,
    isInviting: isInviting || isDirectCreating,

    error,
    message,

    handleModeChange,
    handleGeneratePassword,
    handleChange,
    handleToggleCompany,
    handleToggleBranchAccess,
    handleBranchRoleChange,
    handleBranchMarketplaceToggle,
    handleSubmit,
    handleReset,
    handleBack,
    handleViewInvitations,
    handleViewMembers,
  };

  return (
    <>
      {isMobile ? (
        <InviteWorkspaceMemberMobilePage {...pageProps} />
      ) : (
        <InviteWorkspaceMemberDesktopPage {...pageProps} />
      )}

      <CredentialSuccessModal
        open={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          navigate(ROUTES.WORKSPACE_MEMBERS, { replace: true });
        }}
        credentials={successCredentials}
        workspaceName={currentWorkspace?.name}
      />
    </>
  );
};

export default InviteWorkspaceMemberPage;
