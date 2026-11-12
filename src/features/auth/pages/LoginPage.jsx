import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES, API_STATUS } from "@/constants";
import { PIPELINE_STORAGE_KEYS } from "@/contexts";
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

      // Clear prior user entity selections; AppLayout awaits backend access
      // to resolve highest allowed work level & mode cleanly without a workspace lock loop.
      try {
        localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_LEVEL);
        localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID);
        localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
      } catch {}

      navigate(ROUTES.DASHBOARD, { replace: true });
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
