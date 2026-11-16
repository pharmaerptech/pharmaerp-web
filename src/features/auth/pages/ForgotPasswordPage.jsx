// src/features/auth/pages/ForgotPasswordPage.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2, ShieldCheck, ExternalLink } from "lucide-react";

import { ROUTES, API_STATUS } from "@/constants";
import { UIButton, UIInput, UIAlert } from "@/components/ui";
import DashboardPreview from "../components/DashboardPreview";
import useAuth from "../hooks/useAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordPage = () => {
  const { forgotPassword, forgotPasswordStatus, error, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState(null);
  const [deliveryWarning, setDeliveryWarning] = useState(null);

  const isLoading = forgotPasswordStatus === API_STATUS.LOADING;

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (formError) setFormError("");
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setFormError("Please enter your registered email address.");
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    try {
      const response = await forgotPassword({ email: cleanEmail });
      setIsSubmitted(true);
      const url = response?.data?.resetUrl || response?.resetUrl;
      if (url) {
        setDevResetUrl(url);
      }
      const warn = response?.data?.warning || response?.warning;
      if (warn) {
        setDeliveryWarning(warn);
      }
    } catch {
      // Error handled by Redux state
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
            {isSubmitted ? (
              <div className="space-y-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 className="size-6" />
                </div>

                <div>
                  <h1 className="text-[24px] font-extrabold tracking-tight text-text leading-tight">
                    Check your inbox.
                  </h1>
                  <p className="mt-2 text-sm text-text-muted leading-relaxed">
                    If an account exists for <span className="font-semibold text-text">{email}</span>, we have sent instructions to reset your password.
                  </p>
                </div>

                {deliveryWarning && (
                  <UIAlert
                    type="warning"
                    variant="soft"
                    className="p-2.5 rounded-[8px] text-xs font-medium"
                  >
                    Email service notice: {deliveryWarning}. In local development, you can use the direct link below.
                  </UIAlert>
                )}

                {devResetUrl && (() => {
                  let relativePath = devResetUrl;
                  try {
                    const parsed = new URL(devResetUrl);
                    relativePath = `${parsed.pathname}${parsed.search}`;
                  } catch {
                    relativePath = devResetUrl.replace(/^https?:\/\/[^/]+/, "");
                  }
                  return (
                    <div className="p-3 rounded-xl bg-primary-soft/40 border border-primary/20 text-xs text-text space-y-1.5">
                      <div className="font-bold text-primary flex items-center gap-1.5">
                        <ExternalLink className="size-3.5" />
                        <span>Direct Reset Link:</span>
                      </div>
                      <Link
                        to={relativePath}
                        className="text-primary underline hover:text-primary-hover break-all font-mono text-[11px]"
                      >
                        {devResetUrl}
                      </Link>
                    </div>
                  );
                })()}

                <div className="pt-2">
                  <Link to={ROUTES.LOGIN}>
                    <UIButton
                      variant="primary"
                      size="md"
                      fullWidth
                      startIcon={<ArrowLeft className="size-4" />}
                      className="h-[42px] rounded-[8px] text-sm font-bold shadow-xs cursor-pointer"
                    >
                      Back to Login
                    </UIButton>
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div>
                  <h1 className="text-[25px] font-extrabold tracking-tight text-text leading-tight">
                    Forgot Password?
                  </h1>
                  <p className="mt-1 text-sm text-text-muted leading-[1.5]">
                    Enter your registered email address and we will send you a link to reset your password.
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
                      id="forgot-email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={handleEmailChange}
                      disabled={isLoading}
                      placeholder="Registered Email Address"
                      autoComplete="email"
                      required
                      size="md"
                      variant="outline"
                      containerClassName="h-[42px] rounded-[10px]"
                      startIcon={<Mail size={16} />}
                      error={formError}
                    />

                    <UIButton
                      type="submit"
                      variant="primary"
                      size="md"
                      fullWidth
                      isLoading={isLoading}
                      loadingText="Sending Reset Link..."
                      className="mt-1 h-[42px] rounded-[8px] text-sm font-bold shadow-xs cursor-pointer"
                    >
                      Send Reset Link
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

export default ForgotPasswordPage;
