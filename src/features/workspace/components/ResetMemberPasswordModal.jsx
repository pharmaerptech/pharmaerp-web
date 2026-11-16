// src/features/workspace/components/ResetMemberPasswordModal.jsx

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  KeyRound,
  RefreshCw,
  User,
  Phone,
  Mail,
  Check,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Sparkles,
} from "lucide-react";

import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
  UIButton,
  UIInput,
  UIAlert,
  UIBadge,
  uiToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const generateSecurePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const nums = "23456789";
  const syms = "@#$!";
  const p1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const p2 = Array.from({ length: 3 }, () => nums[Math.floor(Math.random() * nums.length)]).join("");
  const p3 = syms[Math.floor(Math.random() * syms.length)];
  return `Staff${p3}${p1.slice(0, 2)}${p2}`;
};

const getPasswordStrength = (pwd) => {
  if (!pwd || pwd.length < 6) return { score: 1, label: "Weak", color: "bg-error", text: "text-error" };
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd);
  const criteria = [hasUpper, hasNumber, hasSymbol].filter(Boolean).length;

  if (pwd.length >= 8 && criteria >= 2) {
    return { score: 3, label: "Strong", color: "bg-success", text: "text-success" };
  }
  if (pwd.length >= 6 && criteria >= 1) {
    return { score: 2, label: "Good", color: "bg-warning", text: "text-warning" };
  }
  return { score: 1, label: "Weak", color: "bg-error", text: "text-error" };
};

const ResetMemberPasswordModal = ({
  open,
  onClose,
  onConfirm,
  member,
  isLoading,
}) => {
  const [password, setPassword] = useState(() => generateSecurePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [isRotating, setIsRotating] = useState(false);

  // Generate a fresh secure password whenever the modal opens
  useEffect(() => {
    if (open) {
      setPassword(generateSecurePassword());
      setError("");
      setCopied(false);
      setShowPassword(false);
    }
  }, [open]);

  const handleGenerate = () => {
    setIsRotating(true);
    const newPwd = generateSecurePassword();
    setPassword(newPwd);
    setError("");
    setTimeout(() => setIsRotating(false), 350);
  };

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    uiToast.success("Copied", "Password copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setError("");
      await onConfirm(password);
    } catch (err) {
      setError(typeof err === "string" ? err : err?.message || "Failed to reset password");
    }
  };

  if (!open && !member) return null;

  const displayName =
    member?.displayName ||
    member?.user?.fullName ||
    member?.userId?.fullName ||
    member?.name ||
    "Staff Member";
  const loginIdentifier =
    member?.displayPhone ||
    member?.displayEmail ||
    member?.user?.phone ||
    member?.user?.email ||
    member?.userId?.phone ||
    member?.userId?.email;
  const userCode = member?.userCode || member?.user?.userCode || member?.userId?.userCode;
  const roleName = member?.displayRole || member?.roleName || member?.role?.name || "Staff";
  const initials =
    String(displayName)
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "ST";

  const strength = getPasswordStrength(password);

  return (
    <UIModal
      isOpen={open}
      onClose={onClose}
      size="sm"
      className="max-w-[460px]"
    >
      {/* Header */}
      <UIModalHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <KeyRound className="size-5" />
          </div>
          <div>
            <UIModalTitle className="text-base sm:text-lg">
              Reset Security Credential
            </UIModalTitle>
            <UIModalDescription className="text-xs mt-0.5">
              Generate or assign a new login password / PIN for this staff member.
            </UIModalDescription>
          </div>
        </div>
      </UIModalHeader>

      <form onSubmit={handleSubmit}>
        <UIModalBody className="space-y-4 py-4 max-h-[70vh]">
          {/* Member Profile Identity Capsule */}
          <div className="p-3.5 rounded-2xl bg-surface-alt/75 border border-border/60 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-text text-xs sm:text-sm block truncate">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-text-muted font-mono block truncate">
                    {loginIdentifier || "No phone/email linked"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <UIBadge variant="soft" color="primary" size="xs">
                  {roleName}
                </UIBadge>
                {userCode && (
                  <span className="text-[10px] font-mono text-text-muted font-medium">
                    #USR-{userCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <UIAlert intent="danger" title="Validation Error" description={error} />
          )}

          {/* Password Input Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text flex items-center gap-1.5">
                <Lock className="size-3.5 text-primary" /> New Security Password / PIN
              </label>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="text-[11.5px] font-semibold text-primary hover:text-primary-hover flex items-center gap-1.5 cursor-pointer transition-colors active:scale-95 select-none"
              >
                <RefreshCw className={cn("size-3", isRotating && "animate-spin text-primary")} />
                Auto-Generate
              </button>
            </div>

            {/* Input with embedded actions */}
            <div className="relative flex items-center">
              <UIInput
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Min 6 characters (e.g. Staff@842)"
                prefixIcon={<KeyRound className="size-4 text-text-muted" />}
                required
                size="md"
                disabled={isLoading}
                className="font-mono text-sm pr-20"
                autoFocus
              />

              {/* Action buttons inside input right edge */}
              <div className="absolute right-2 flex items-center gap-1 text-text-muted">
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy password"
                  className="p-1.5 rounded-lg hover:bg-surface-hover hover:text-text transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="size-3.5 text-success" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="p-1.5 rounded-lg hover:bg-surface-hover hover:text-text transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Strength Visual Meter */}
            <div className="pt-1 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted font-medium">Strength:</span>
                <span className={cn("font-bold", strength.text)}>
                  {strength.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
                <div
                  className={cn(
                    "rounded-full transition-colors duration-300",
                    strength.score >= 1 ? strength.color : "bg-border/60"
                  )}
                />
                <div
                  className={cn(
                    "rounded-full transition-colors duration-300",
                    strength.score >= 2 ? strength.color : "bg-border/60"
                  )}
                />
                <div
                  className={cn(
                    "rounded-full transition-colors duration-300",
                    strength.score >= 3 ? strength.color : "bg-border/60"
                  )}
                />
              </div>
            </div>

            <p className="text-[11px] text-text-muted leading-relaxed pt-0.5">
              The member can log into the POS terminal and back-office portal immediately with this credential.
            </p>
          </div>
        </UIModalBody>

        {/* Footer */}
        <UIModalFooter className="bg-surface-alt/40 border-t border-border/40 py-3.5">
          <UIButton
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </UIButton>

          <UIButton
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
            startIcon={<Check className="size-4" />}
          >
            Update Password
          </UIButton>
        </UIModalFooter>
      </form>
    </UIModal>
  );
};

export default ResetMemberPasswordModal;
