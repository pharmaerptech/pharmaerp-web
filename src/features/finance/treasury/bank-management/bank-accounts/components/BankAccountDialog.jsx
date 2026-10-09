import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
  UIInput,
  UISelect,
  UICheckbox,
  UIButton,
  UIAlert,
  UIBadge,
  UISkeleton,
} from "@/components/ui";
import {
  Building2,
  Landmark,
  CreditCard,
  ShieldCheck,
  Copy,
  Check,
  Hash,
  MapPin,
  Phone,
  User,
  Wallet,
  Sparkles,
  Lock,
  Star,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";

import useBankMaster from "@/features/bank-master/hooks/useBankMaster";

const accountTypeOptions = [
  {
    label: "Current Account",
    value: "CURRENT",
    description: "Standard business operational account with unlimited transactions",
  },
  {
    label: "Savings Account",
    value: "SAVINGS",
    description: "Interest-bearing reserve account for secondary funds",
  },
  {
    label: "Overdraft Account (OD)",
    value: "OVERDRAFT",
    description: "Credit limit backed liquidity facility account",
  },
  {
    label: "Cash Credit Account (CC)",
    value: "CASH_CREDIT",
    description: "Working capital hypothecation credit facility",
  },
];

const openingBalanceTypeOptions = [
  { label: "Debit (Dr) - Positive Asset Balance", value: "dr" },
  { label: "Credit (Cr) - Overdrawn / Negative Balance", value: "cr" },
];

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const INITIAL_FORM = {
  accountName: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  branchName: "",
  branchAddress: "",
  registeredMobile: "",
  accountType: "CURRENT",
  bankMasterId: "",
  isPrimary: false,
  isActive: true,
  openingBalance: 0,
  openingBalanceType: "dr",
};

/**
 * Live Bank Card Visualizer
 * Provides instant tactile feedback for bank corporate credentials
 */
const VirtualBankCard = ({
  bankName,
  accountHolderName,
  accountNumber,
  ifscCode,
  branchName,
  accountType,
  isPrimary,
  accountName,
}) => {
  const formattedNumber = useMemo(() => {
    if (!accountNumber) return "•••• •••• •••• ••••";
    const clean = String(accountNumber).replace(/\s+/g, "");
    if (clean.length <= 4) return `•••• •••• •••• ${clean}`;
    // Show masked with last 4
    return `•••• •••• •••• ${clean.slice(-4)}`;
  }, [accountNumber]);

  const typeLabel = useMemo(() => {
    const match = accountTypeOptions.find((o) => o.value === accountType);
    return match ? match.label.toUpperCase() : "CURRENT ACCOUNT";
  }, [accountType]);

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-5 sm:p-6 text-white shadow-xl border border-white/10 overflow-hidden select-none transition-all">
      {/* Decorative Refractive Sheen Gradients */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 size-48 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-60" />

      {/* Top Row: Bank Info & Primary Badge */}
      <div className="relative z-10 flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
            <Landmark className="size-5 text-indigo-200" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] tracking-widest uppercase font-semibold text-indigo-200/80">
              Corporate Banking
            </div>
            <div className="text-base sm:text-lg font-bold text-white truncate drop-shadow-sm tracking-tight">
              {bankName || "Select Bank Institution"}
            </div>
            {accountName && (
              <div className="text-xs text-white/60 truncate font-medium">
                {accountName}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPrimary && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-300/30 backdrop-blur-md shadow-xs">
              <Star className="size-3 fill-amber-300" />
              PRIMARY
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider bg-white/10 text-white/90 border border-white/15 backdrop-blur-md">
            {typeLabel}
          </span>
        </div>
      </div>

      {/* Middle Row: EMV Chip & Formatted Monospace Number */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          {/* Metallic EMV Chip */}
          <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 border border-amber-300/60 shadow-inner flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[1px] opacity-40 p-[2px]">
              <div className="border-r border-b border-amber-900/60" />
              <div className="border-b border-amber-900/60" />
              <div className="border-r border-amber-900/60" />
              <div />
            </div>
          </div>
          {/* Contactless symbol */}
          <div className="flex flex-col gap-0.5 opacity-60">
            <div className="w-3 h-0.5 bg-white/70 rounded-full" />
            <div className="w-2.5 h-0.5 bg-white/70 rounded-full" />
            <div className="w-2 h-0.5 bg-white/70 rounded-full" />
          </div>
        </div>

        <div className="font-mono text-base sm:text-xl font-bold tracking-[0.18em] text-white/95 drop-shadow-sm">
          {formattedNumber}
        </div>
      </div>

      {/* Bottom Row: Holder Name & IFSC/Branch */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-2 border-t border-white/10">
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-wider text-white/50 font-medium">
            Account Holder
          </div>
          <div className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-white/90 truncate">
            {accountHolderName || "COMPANY / HOLDER NAME"}
          </div>
        </div>

        <div className="sm:text-right shrink-0">
          <div className="text-[9px] uppercase tracking-wider text-white/50 font-medium">
            IFSC & Branch
          </div>
          <div className="text-xs font-mono font-bold text-white/90">
            {ifscCode || "IFSC0000000"}
            {branchName && (
              <span className="font-sans font-normal text-white/70 text-[11px] ml-1.5">
                • {branchName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export function BankAccountDialog({
  isOpen,
  onClose,
  mode = "create",
  entityId = null,
  onSubmitCreate,
  onSubmitUpdate,
  onFetchById,
  onSuccess,
}) {
  const { bankMasters = [], getBankMasters } = useBankMaster();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [accountDetails, setAccountDetails] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const hasFetchedBankMastersRef = useRef(false);

  // Load bank masters list when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!hasFetchedBankMastersRef.current) {
        hasFetchedBankMastersRef.current = true;
        getBankMasters({ page: 1, limit: 100 }).catch(() => {});
      }
    } else {
      hasFetchedBankMastersRef.current = false;
    }
  }, [isOpen, getBankMasters]);

  // Load existing bank account for edit or view
  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_FORM);
      setFormErrors({});
      setServerError(null);
      setAccountDetails(null);
      setCopiedKey(null);
      return;
    }

    if ((mode === "edit" || mode === "view") && entityId) {
      setIsFetching(true);
      setServerError(null);
      onFetchById(entityId)
        .then((data) => {
          setAccountDetails(data);
          if (mode === "edit" && data) {
            setFormData({
              accountName: data.accountName || "",
              accountHolderName: data.accountHolderName || "",
              accountNumber: data.accountNumber || "",
              ifscCode: data.ifscCode || "",
              branchName: data.branchName || "",
              branchAddress: data.branchAddress || "",
              registeredMobile: data.registeredMobile || "",
              accountType: data.accountType || "CURRENT",
              bankMasterId: data.bankMasterId?._id || data.bankMasterId || "",
              isPrimary: Boolean(data.isPrimary),
              isActive: data.isActive !== undefined ? data.isActive : true,
              openingBalance: data.openingBalance || 0,
              openingBalanceType: data.openingBalanceType || "dr",
            });
          }
        })
        .catch((err) => {
          setServerError(
            typeof err === "string" ? err : "Failed to load bank account details."
          );
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [isOpen, mode, entityId, onFetchById]);

  // Formatted bank options for searchable UISelect
  const bankOptions = useMemo(() => {
    return bankMasters.map((b) => ({
      label: b.name || "Unknown Bank",
      value: b._id,
      description: b.code || b.website || "Scheduled Bank",
    }));
  }, [bankMasters]);

  // Resolved Bank Master Object
  const selectedBankMaster = useMemo(() => {
    const id = formData.bankMasterId;
    if (!id) return null;
    return bankMasters.find((b) => b._id === id) || null;
  }, [bankMasters, formData.bankMasterId]);

  // Unified change handler that reliably extracts values from either event or raw value
  const handleFieldChange = useCallback((name, valueOrEvent) => {
    let val = valueOrEvent;
    if (valueOrEvent && typeof valueOrEvent === "object" && "target" in valueOrEvent) {
      val =
        valueOrEvent.target.type === "checkbox"
          ? valueOrEvent.target.checked
          : valueOrEvent.target.value;
    }

    setFormData((prev) => {
      const nextData = { ...prev, [name]: val };

      // Auto-suggest account name when user chooses a bank and hasn't customized the name
      if (name === "bankMasterId" && val) {
        const bank = bankMasters.find((b) => b._id === val);
        if (bank && (!prev.accountName || prev.accountName.endsWith(" Account"))) {
          nextData.accountName = `${bank.name} Account`;
        }
      }

      return nextData;
    });

    setFormErrors((prev) => ({ ...prev, [name]: undefined, submit: undefined }));
  }, [bankMasters]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const validate = () => {
    const errors = {};
    if (mode === "create" && !formData.bankMasterId) {
      errors.bankMasterId = "Select a bank from master catalog";
    }
    if (!formData.accountName.trim()) {
      errors.accountName = "Account nickname is required";
    }
    if (!formData.accountHolderName.trim()) {
      errors.accountHolderName = "Account holder name is required";
    }
    if (mode === "create") {
      if (!formData.accountNumber.trim()) {
        errors.accountNumber = "Account number is required";
      } else if (formData.accountNumber.trim().length < 5) {
        errors.accountNumber = "Account number must be at least 5 digits";
      }
    }

    if (!formData.ifscCode.trim()) {
      errors.ifscCode = "IFSC code is required";
    } else if (!IFSC_REGEX.test(formData.ifscCode.trim().toUpperCase())) {
      errors.ifscCode = "Invalid IFSC format (e.g. HDFC0001234)";
    }

    if (!formData.branchName.trim()) {
      errors.branchName = "Branch name is required";
    }

    if (formData.registeredMobile && formData.registeredMobile.trim()) {
      const cleanMobile = formData.registeredMobile.trim().replace(/[\s-]/g, "");
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(cleanMobile)) {
        errors.registeredMobile = "Invalid mobile number format (e.g. +919876543210)";
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      if (mode === "create") {
        const payload = {
          bankMasterId: formData.bankMasterId,
          accountName: formData.accountName.trim(),
          accountHolderName: formData.accountHolderName.trim(),
          accountNumber: formData.accountNumber.trim(),
          ifscCode: formData.ifscCode.trim().toUpperCase(),
          branchName: formData.branchName.trim(),
          branchAddress: formData.branchAddress.trim() || undefined,
          registeredMobile:
            formData.registeredMobile.trim().replace(/[\s-]/g, "") || undefined,
          accountType: formData.accountType,
          isPrimary: Boolean(formData.isPrimary),
          openingBalance: Number(formData.openingBalance) || 0,
          openingBalanceType: formData.openingBalanceType || "dr",
        };
        await onSubmitCreate(payload);
      } else {
        // Edit mode sends only mutable fields
        const payload = {
          accountName: formData.accountName.trim(),
          accountHolderName: formData.accountHolderName.trim(),
          ifscCode: formData.ifscCode.trim().toUpperCase(),
          branchName: formData.branchName.trim(),
          branchAddress: formData.branchAddress.trim() || undefined,
          registeredMobile:
            formData.registeredMobile.trim().replace(/[\s-]/g, "") || undefined,
          accountType: formData.accountType,
          isActive: Boolean(formData.isActive),
          isPrimary: Boolean(formData.isPrimary),
        };
        await onSubmitUpdate(entityId, payload);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setServerError(
        typeof err === "string" ? err : "Failed to save bank account."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isView = mode === "view";
  const isCreate = mode === "create";
  const isEdit = mode === "edit";

  const title = isCreate
    ? "Register Corporate Bank Account"
    : isView
    ? "Bank Account Details"
    : "Modify Bank Account";

  const subtitle = isCreate
    ? "Add a corporate bank account with routing details and map to the financial ledger."
    : isView
    ? "Complete account overview, balances, and routing configurations."
    : "Update bank account details, branch credentials, and corporate account status.";

  return (
    <UIModal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      mobileSheet
      className="w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden"
    >
      {/* ── Dialog Header ── */}
      <UIModalHeader className="px-6 sm:px-8 pt-6 pb-4 border-b border-border/70 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
              <Landmark className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <UIModalTitle className="text-xl sm:text-2xl font-bold tracking-tight text-text truncate">
                  {title}
                </UIModalTitle>
                <UIBadge
                  variant={isCreate ? "primary" : isView ? "neutral" : "warning"}
                  size="sm"
                  className="uppercase text-[10px] tracking-wider font-bold"
                >
                  {isCreate ? "New Account" : isView ? "Read Only" : "Edit Mode"}
                </UIBadge>
              </div>
              <UIModalDescription className="text-xs sm:text-sm text-text-muted mt-0.5 line-clamp-1">
                {subtitle}
              </UIModalDescription>
            </div>
          </div>
        </div>
      </UIModalHeader>

      {/* ── Dialog Body ── */}
      <UIModalBody className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 space-y-7">
        {isFetching && (
          <div className="space-y-4 py-8">
            <UISkeleton rows={8} />
          </div>
        )}

        {serverError && !isFetching && (
          <UIAlert variant="error" onDismiss={() => setServerError(null)}>
            {serverError}
          </UIAlert>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW MODE
           ══════════════════════════════════════════════════════════════════ */}
        {isView && !isFetching && accountDetails && (
          <div className="space-y-6">
            {/* 1. Hero Card */}
            <VirtualBankCard
              bankName={
                accountDetails.bankMasterId?.name ||
                accountDetails.bankName ||
                "Corporate Bank"
              }
              accountHolderName={accountDetails.accountHolderName}
              accountNumber={accountDetails.accountNumber}
              ifscCode={accountDetails.ifscCode}
              branchName={accountDetails.branchName}
              accountType={accountDetails.accountType}
              isPrimary={accountDetails.isPrimary}
              accountName={accountDetails.accountName}
            />

            {/* 2. Top Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface rounded-2xl border border-border p-4.5 flex items-center gap-3.5 shadow-2xs">
                <div className="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Wallet className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Ledger Balance
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">
                    ₹{" "}
                    {(
                      accountDetails.balance ??
                      accountDetails.currentBalance ??
                      accountDetails.openingBalance ??
                      0
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-2xl border border-border p-4.5 flex items-center gap-3.5 shadow-2xs">
                <div className="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Status
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`size-2 rounded-full ${
                        accountDetails.isActive ? "bg-emerald-500" : "bg-neutral-400"
                      }`}
                    />
                    <span className="text-sm font-bold text-text">
                      {accountDetails.isActive ? "Active Account" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-2xl border border-border p-4.5 flex items-center gap-3.5 shadow-2xs">
                <div className="size-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Star className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Account Role
                  </div>
                  <div className="text-sm font-bold text-text truncate">
                    {accountDetails.isPrimary
                      ? "Primary Corporate Account"
                      : "Secondary Account"}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Detailed Specifications in 2 Spacious Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Credentials & Identifiers */}
              <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2.5 pb-3 border-b border-border/80">
                  <CreditCard className="size-4.5 text-primary" />
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                    Banking Credentials
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-text-muted">Bank Institution</span>
                    <span className="font-semibold text-text">
                      {accountDetails.bankMasterId?.name || accountDetails.bankName || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-text-muted">Account Nickname</span>
                    <span className="font-semibold text-text">
                      {accountDetails.accountName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-text-muted">Account Holder</span>
                    <span className="font-semibold text-text">
                      {accountDetails.accountHolderName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-text-muted">Account Number</span>
                    <div className="flex items-center gap-2 font-mono font-bold text-text">
                      <span>{accountDetails.accountNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(accountDetails.accountNumber, "accNum")}
                        className="p-1 rounded hover:bg-surface-alt text-text-muted hover:text-text transition cursor-pointer"
                        title="Copy Account Number"
                      >
                        {copiedKey === "accNum" ? (
                          <Check className="size-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-text-muted">IFSC Code</span>
                    <div className="flex items-center gap-2 font-mono font-bold text-text">
                      <span>{accountDetails.ifscCode}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(accountDetails.ifscCode, "ifsc")}
                        className="p-1 rounded hover:bg-surface-alt text-text-muted hover:text-text transition cursor-pointer"
                        title="Copy IFSC Code"
                      >
                        {copiedKey === "ifsc" ? (
                          <Check className="size-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-text-muted">Account Type</span>
                    <span className="font-semibold text-text">
                      {accountTypeOptions.find((o) => o.value === accountDetails.accountType)
                        ?.label || accountDetails.accountType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Branch Location & Ledger Record */}
              <div className="bg-surface rounded-2xl border border-border p-5 sm:p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2.5 pb-3 border-b border-border/80">
                  <MapPin className="size-4.5 text-primary" />
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                    Branch & Ledger Mapping
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-text-muted">Branch Name</span>
                    <span className="font-semibold text-text">
                      {accountDetails.branchName || "Main Branch"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-text-muted">Branch Address</span>
                    <span className="font-semibold text-text text-right max-w-[220px] truncate">
                      {accountDetails.branchAddress || "Not provided"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-text-muted">Registered Mobile</span>
                    <span className="font-semibold text-text font-mono">
                      {accountDetails.registeredMobile || "Not provided"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-text-muted">Ledger Account Code</span>
                    <span className="font-mono font-bold text-primary">
                      {accountDetails.ledgerAccountId?.accountCode ||
                        `BNK-${String(accountDetails.accountNumber).slice(-4)}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-text-muted">Registered On</span>
                    <span className="font-semibold text-text">
                      {accountDetails.createdAt
                        ? new Date(accountDetails.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CREATE / EDIT MODE
           ══════════════════════════════════════════════════════════════════ */}
        {!isView && !isFetching && (
          <form id="bank-account-form" onSubmit={handleSubmit} className="space-y-7">
            {/* 1. Live Interactive Digital Card Preview */}
            <VirtualBankCard
              bankName={selectedBankMaster?.name || (isEdit ? accountDetails?.bankName : "")}
              accountHolderName={formData.accountHolderName}
              accountNumber={formData.accountNumber}
              ifscCode={formData.ifscCode}
              branchName={formData.branchName}
              accountType={formData.accountType}
              isPrimary={formData.isPrimary}
              accountName={formData.accountName}
            />

            {/* 2. SECTION 1: Bank Institution & Account Type */}
            <div className="bg-surface-alt/40 dark:bg-surface-alt/20 rounded-2xl border border-border/80 p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                <div className="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                    Bank Institution & Class
                  </h3>
                  <p className="text-xs text-text-muted">
                    Select financial partner and corporate account classification
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {/* Bank Master Dropdown */}
                <div className="space-y-1.5">
                  <UISelect
                    label="Bank Institution"
                    placeholder="Search and select bank from master..."
                    value={formData.bankMasterId}
                    onChange={(val) => handleFieldChange("bankMasterId", val)}
                    options={bankOptions}
                    error={Boolean(formErrors.bankMasterId)}
                    helperText={
                      formErrors.bankMasterId ||
                      (isEdit ? "Bank cannot be changed after registration" : "Select bank entity from master catalog")
                    }
                    isSearchable
                    disabled={isEdit}
                    required
                    size="md"
                  />
                </div>

                {/* Account Type Dropdown */}
                <div className="space-y-1.5">
                  <UISelect
                    label="Account Type"
                    value={formData.accountType}
                    onChange={(val) => handleFieldChange("accountType", val)}
                    options={accountTypeOptions}
                    required
                    size="md"
                    helperText="Operational classification for compliance & ledger"
                  />
                </div>

                {/* Account Nickname */}
                <div className="md:col-span-2 space-y-1.5">
                  <UIInput
                    label="Account Nickname / Display Name"
                    placeholder="e.g. HDFC Main Operating Account"
                    value={formData.accountName}
                    onChange={(e) => handleFieldChange("accountName", e.target.value)}
                    error={Boolean(formErrors.accountName)}
                    helperText={
                      formErrors.accountName ||
                      "Descriptive name shown across payment screens, vouchers, and statements"
                    }
                    startIcon={<Landmark className="size-4 text-text-muted" />}
                    required
                    size="md"
                  />
                </div>
              </div>
            </div>

            {/* 3. SECTION 2: Account Credentials & Routing */}
            <div className="bg-surface-alt/40 dark:bg-surface-alt/20 rounded-2xl border border-border/80 p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <CreditCard className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                    Account Credentials & Routing
                  </h3>
                  <p className="text-xs text-text-muted">
                    Account identifiers and routing codes as documented by the bank
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {/* Account Holder Name */}
                <div className="space-y-1.5">
                  <UIInput
                    label="Account Holder Name"
                    placeholder="e.g. ACME Enterprises Private Limited"
                    value={formData.accountHolderName}
                    onChange={(e) => handleFieldChange("accountHolderName", e.target.value)}
                    error={Boolean(formErrors.accountHolderName)}
                    helperText={
                      formErrors.accountHolderName ||
                      "Must match corporate name in official bank records"
                    }
                    startIcon={<User className="size-4 text-text-muted" />}
                    required
                    size="md"
                  />
                </div>

                {/* Account Number */}
                <div className="space-y-1.5">
                  <UIInput
                    label="Account Number"
                    placeholder="e.g. 50200012345678"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      handleFieldChange(
                        "accountNumber",
                        e.target.value.replace(/[^A-Za-z0-9]/g, "")
                      )
                    }
                    error={Boolean(formErrors.accountNumber)}
                    helperText={
                      formErrors.accountNumber ||
                      (isEdit
                        ? "Account number is immutable for audit integrity"
                        : "Unique account identifier assigned by bank")
                    }
                    startIcon={
                      isEdit ? (
                        <Lock className="size-4 text-amber-500" />
                      ) : (
                        <Hash className="size-4 text-text-muted" />
                      )
                    }
                    disabled={isEdit}
                    required
                    size="md"
                  />
                </div>

                {/* IFSC Code */}
                <div className="space-y-1.5">
                  <UIInput
                    label="IFSC Code"
                    placeholder="e.g. HDFC0001234"
                    value={formData.ifscCode}
                    onChange={(e) =>
                      handleFieldChange(
                        "ifscCode",
                        e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 11)
                      )
                    }
                    error={Boolean(formErrors.ifscCode)}
                    helperText={
                      formErrors.ifscCode ||
                      "11-character alphanumeric code for RTGS/NEFT transfers"
                    }
                    startIcon={<Building2 className="size-4 text-text-muted" />}
                    required
                    size="md"
                  />
                </div>

                {/* Branch Name */}
                <div className="space-y-1.5">
                  <UIInput
                    label="Branch Name"
                    placeholder="e.g. Connaught Place Branch"
                    value={formData.branchName}
                    onChange={(e) => handleFieldChange("branchName", e.target.value)}
                    error={Boolean(formErrors.branchName)}
                    helperText={formErrors.branchName || "Physical branch location"}
                    startIcon={<MapPin className="size-4 text-text-muted" />}
                    required
                    size="md"
                  />
                </div>
              </div>
            </div>

            {/* 4. SECTION 3: Branch Location & Contact Details */}
            <div className="bg-surface-alt/40 dark:bg-surface-alt/20 rounded-2xl border border-border/80 p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                    Branch Location & Contact (Optional)
                  </h3>
                  <p className="text-xs text-text-muted">
                    Postal branch address and corporate notification contact
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {/* Branch Address */}
                <div className="md:col-span-2 space-y-1.5">
                  <UIInput
                    label="Branch Address (Optional)"
                    placeholder="e.g. Building 4B, Barakhamba Road, Connaught Place, New Delhi - 110001"
                    value={formData.branchAddress}
                    onChange={(e) => handleFieldChange("branchAddress", e.target.value)}
                    startIcon={<MapPin className="size-4 text-text-muted" />}
                    size="md"
                    helperText="Complete street address for official banking communications"
                  />
                </div>

                {/* Registered Mobile */}
                <div className="md:col-span-2 space-y-1.5">
                  <UIInput
                    label="Registered Mobile Number (Optional)"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.registeredMobile}
                    onChange={(e) => handleFieldChange("registeredMobile", e.target.value)}
                    error={Boolean(formErrors.registeredMobile)}
                    helperText={
                      formErrors.registeredMobile ||
                      "Mobile number registered with net banking for SMS transaction alerts"
                    }
                    startIcon={<Phone className="size-4 text-text-muted" />}
                    size="md"
                  />
                </div>
              </div>
            </div>

            {/* 5. SECTION 4: Accounting & Settings */}
            <div className="bg-surface-alt/40 dark:bg-surface-alt/20 rounded-2xl border border-border/80 p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                <div className="size-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Layers className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                    Accounting & Account Controls
                  </h3>
                  <p className="text-xs text-text-muted">
                    Opening financial ledger balances and primary account configuration
                  </p>
                </div>
              </div>

              {/* In Create Mode: Opening Balance Inputs */}
              {isCreate && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-1 pb-2 border-b border-border/60">
                  <div className="space-y-1.5">
                    <UIInput
                      label="Opening Balance (₹)"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.openingBalance}
                      onChange={(e) => handleFieldChange("openingBalance", e.target.value)}
                      startIcon={<Wallet className="size-4 text-text-muted" />}
                      helperText="Initial balance when migrating accounts into ERP"
                      size="md"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <UISelect
                      label="Balance Type"
                      value={formData.openingBalanceType}
                      onChange={(val) => handleFieldChange("openingBalanceType", val)}
                      options={openingBalanceTypeOptions}
                      size="md"
                      helperText="Asset standard is Debit (Dr); Overdraft is Credit (Cr)"
                    />
                  </div>
                </div>
              )}

              {/* Primary Corporate Account Card */}
              <div className="rounded-xl border border-border bg-surface p-4 flex items-start gap-4 transition-all">
                <div className="pt-0.5">
                  <UICheckbox
                    id="is-primary-checkbox"
                    checked={formData.isPrimary}
                    onChange={(checked) => handleFieldChange("isPrimary", checked)}
                    color="primary"
                    size="lg"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="is-primary-checkbox"
                    className="text-sm font-bold text-text flex items-center gap-2 cursor-pointer select-none"
                  >
                    <span>Set as Primary Corporate Bank Account</span>
                    {formData.isPrimary && (
                      <UIBadge variant="success" size="sm">
                        Default
                      </UIBadge>
                    )}
                  </label>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    Primary accounts are pre-selected by default across customer invoices,
                    payment QR generators, supplier payouts, and fund transfers.
                  </p>
                </div>
              </div>

              {/* In Edit Mode: Active/Inactive Status Card */}
              {isEdit && (
                <div className="rounded-xl border border-border bg-surface p-4 flex items-start gap-4 transition-all">
                  <div className="pt-0.5">
                    <UICheckbox
                      id="is-active-checkbox"
                      checked={formData.isActive}
                      onChange={(checked) => handleFieldChange("isActive", checked)}
                      color="primary"
                      size="lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor="is-active-checkbox"
                      className="text-sm font-bold text-text flex items-center gap-2 cursor-pointer select-none"
                    >
                      <span>Active Account Status</span>
                      <UIBadge
                        variant={formData.isActive ? "success" : "neutral"}
                        size="sm"
                      >
                        {formData.isActive ? "Active" : "Inactive"}
                      </UIBadge>
                    </label>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                      Deactivating will hide this account from new transaction dropdowns
                      while preserving historical financial records.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </UIModalBody>

      {/* ── Dialog Footer ── */}
      <UIModalFooter className="px-6 sm:px-8 py-4.5 bg-surface-alt/60 border-t border-border shrink-0 flex items-center justify-between">
        <div className="text-xs text-text-muted hidden sm:block">
          {!isView && (
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              All inputs are verified against banking validation standards
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <UIButton
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            size="md"
            className="min-w-[100px]"
          >
            {isView ? "Close" : "Cancel"}
          </UIButton>

          {!isView && (
            <UIButton
              variant="primary"
              type="submit"
              form="bank-account-form"
              isLoading={isSubmitting}
              size="md"
              className="min-w-[140px] shadow-sm"
              icon={isCreate ? <CheckCircle2 className="size-4" /> : undefined}
            >
              {isCreate ? "Register Account" : "Save Changes"}
            </UIButton>
          )}
        </div>
      </UIModalFooter>
    </UIModal>
  );
}

export default BankAccountDialog;
