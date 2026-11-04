import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES, API_STATUS } from "@/constants";
import { WORK_MODES, WORK_MODE_STORAGE_KEYS } from "@/contexts";
import { validateLoginForm } from "@/utils";
import { useIsMobile } from "@/hooks";

import useAuth from "../hooks/useAuth";
import LoginDesktopPage from "./desktop/LoginDesktopPage";
import LoginMobilePage from "./mobile/LoginMobilePage";

const LoginPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { login, status, error, clearError } = useAuth();

  const [rememberMe, setRememberMe] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const isLoading = status === API_STATUS.LOADING;

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (error) clearError();

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRememberMeChange = (event) => {
    setRememberMe(event.target.checked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const rawInput = formData.email.trim();
    const payload = {
      email: rawInput.toLowerCase(),
      identifier: rawInput,
      password: formData.password,
    };

    const validationErrors = validateLoginForm(payload);

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    try {
      await login(payload);

      const hasSelected = localStorage.getItem(WORK_MODE_STORAGE_KEYS.MODE_SELECTED) === "true";
      const currentMode = localStorage.getItem(WORK_MODE_STORAGE_KEYS.WORK_MODE);

      // On login, pipeline elevator starts fresh at Workspace floor
      try {
        localStorage.setItem("pahuch_pipeline_level", "workspace");
      } catch {}

      if (!hasSelected) {
        navigate(ROUTES.CHOOSE_MODE, { replace: true });
      } else if (currentMode === WORK_MODES.VIEW) {
        navigate(ROUTES.WORKSPACE_DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.COMPANIES, { replace: true });
      }
    } catch {
      // Error handled in auth state
    }
  };

  const pageProps = {
    formData,
    formErrors,
    rememberMe,
    isLoading,
    error,
    handleChange,
    handleRememberMeChange,
    handleSubmit,
  };

  return isMobile ? (
    <LoginMobilePage {...pageProps} />
  ) : (
    <LoginDesktopPage {...pageProps} />
  );
};

export default LoginPage;
