// src/features/auth/pages/ResetPasswordPage.jsx

import React, { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

import { ROUTES, API_STATUS } from "@/constants";
import { UIButton, UIInput, UIAlert } from "@/components/ui";
import DashboardPreview from "../components/DashboardPreview";
import useAuth from "../hooks/useAuth";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const { token: paramToken } = useParams();
  const token = searchParams.get("token") || paramToken || "";

  const navigate = useNavigate();
  const { resetPassword, resetPasswordStatus, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);

  const isLoading = resetPasswordStatus === API_STATUS.LOADING;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (error) clearError();
  };

  const validate = () => {
    const errors = {};
    if (!formData.password) {
      errors.password = "New password is required.";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    } else if (formData.password.length > 128) {
      errors.password = "Password cannot exceed 128 characters.";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    try {
      await resetPassword({
        token,
        password: formData.password,
      });
      setIsSuccess(true);
    } catch {
      // Handled by Redux error state
    }
  };

  return (
    <section className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center bg-bg px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-6 selection:bg-primary-soft selection:text-primary">
      {/* Background ambient glows using theme tokens */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-primary-soft blur-3xl opacity-60" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-info-soft blur-3xl opacity-60" />
      </div>

      {/* Main Outer Container */}
      <motion.div
        initial={{ opacity: 0, transform: "translateY(12px) scale(0.98)" }}
        animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 my-auto grid w-full max-w-[1140px] overflow-hidden rounded-[16px] border border-border bg-surface shadow-[var(--app-shadow-lg)] lg:grid-cols-12"
      >
        {/* ── LEFT PANEL: Form ───── */}
        <div className="flex flex-col justify-between p-6 sm:p-7 lg:p-7 xl:p-8 lg:col-span-6 xl:col-span-5 min-h-[520px]">
          {/* Brand Logo Header */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-8.5 items-center justify-center rounded-[8px] bg-primary text-primary-contrast shadow-xs">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2ZM13 7V11H17V13H13V17H11V13H7V11H11V7H13Z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-text">
              Pharma<span className="text-primary">ERP</span>
            </span>
          </div>

          {/* Form Content */}
          <div className="my-auto mx-auto w-full max-w-[390px] py-4 lg:mx-0">
            {!token ? (
              <div className="space-y-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  <AlertCircle className="size-6" />
                </div>
                <div>
                  <h1 className="text-[23px] font-extrabold tracking-tight text-text leading-tight">
                    Invalid Reset Link
                  </h1>
                  <p className="mt-2 text-sm text-text-muted leading-relaxed">
                    This password reset link is invalid, incomplete, or has expired. Please request a new link.
                  </p>
                </div>
                <div className="pt-2">
                  <Link to={ROUTES.FORGOT_PASSWORD}>
                    <UIButton
                      variant="primary"
                      size="md"
                      fullWidth
                      className="h-[42px] rounded-[8px] text-sm font-bold shadow-xs cursor-pointer"
                    >
                      Request New Reset Link
                    </UIButton>
                  </Link>
                </div>
              </div>
            ) : isSuccess ? (
              <div className="space-y-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <h1 className="text-[24px] font-extrabold tracking-tight text-text leading-tight">
                    Password Reset Complete!
                  </h1>
                  <p className="mt-2 text-sm text-text-muted leading-relaxed">
                    Your password has been successfully updated. You can now log in using your new credentials.
                  </p>
                </div>
                <div className="pt-2">
                  <Link to={ROUTES.LOGIN}>
                    <UIButton
                      variant="primary"
                      size="md"
                      fullWidth
                      className="h-[42px] rounded-[8px] text-sm font-bold shadow-xs cursor-pointer"
                    >
                      Proceed to Login
                    </UIButton>
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div>
                  <h1 className="text-[25px] font-extrabold tracking-tight text-text leading-tight">
                    Set New Password
                  </h1>
                  <p className="mt-1 text-sm text-text-muted leading-[1.5]">
                    Enter a new secure password for your PharmaERP account.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <UIAlert
                    type="error"
                    variant="soft"
                    icon={<ShieldCheck size={16} className="shrink-0 text-error" />}
                    className="mt-3 p-2.5 rounded-[8px] text-xs font-medium"
                  >
                    {error}
                  </UIAlert>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate className="mt-4">
                  <div className="flex flex-col gap-3.5">
                    <UIInput
                      id="reset-password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      placeholder="New Password (min 6 characters)"
                      autoComplete="new-password"
                      required
                      showPasswordToggle={true}
                      size="md"
                      variant="outline"
                      containerClassName="h-[42px] rounded-[10px]"
                      startIcon={<Lock size={16} />}
                      error={formErrors.password}
                    />

                    <UIInput
                      id="reset-confirm-password"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                      placeholder="Confirm New Password"
                      autoComplete="new-password"
                      required
                      showPasswordToggle={true}
                      size="md"
                      variant="outline"
                      containerClassName="h-[42px] rounded-[10px]"
                      startIcon={<Lock size={16} />}
                      error={formErrors.confirmPassword}
                    />

                    <UIButton
                      type="submit"
                      variant="primary"
                      size="md"
                      fullWidth
                      isLoading={isLoading}
                      loadingText="Resetting Password..."
                      className="mt-1 h-[42px] rounded-[8px] text-sm font-bold shadow-xs cursor-pointer"
                    >
                      Reset Password
                    </UIButton>
                  </div>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    to={ROUTES.LOGIN}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted transition-colors hover:text-text hover:underline"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to Login</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Bottom copyright */}
          <div className="mt-2 text-xs text-text-muted/70 leading-[1.5]">
            © {new Date().getFullYear()} PharmaERP. All rights reserved.
          </div>
        </div>

        {/* ── RIGHT PANEL: Hero Card ── */}
        <div className="relative hidden p-3.5 lg:col-span-6 xl:col-span-7 lg:flex">
          <div
            className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[14px] p-5 lg:p-6"
            style={{
              background:
                "linear-gradient(135deg, var(--app-color-primary, #00994a) 0%, var(--app-color-info-hover, #1d4ed8) 100%)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.14),transparent_45%)]" />
            <DashboardPreview />
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ResetPasswordPage;
