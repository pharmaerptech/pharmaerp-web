import React, { useState, useEffect, useMemo } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiCopy,
  FiCheck,
  FiEdit2,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiCreditCard,
} from "react-icons/fi";
import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
  UIFormSection,
  UIInput,
  UISelect,
  UIButton,
  UIAlert,
  UIKeyValueList,
  UIBadge,
  UISkeleton,
} from "@/components/ui";

import useBankAccount from "@/features/finance/treasury/bank-management/bank-accounts/hooks/useBankAccount";

const chequeTypeOptions = [
  { label: "Received Cheque (From Customer)", value: "RECEIVED" },
  { label: "Issued Cheque (To Supplier)", value: "ISSUED" },
];

const INITIAL_FORM = {
  chequeNumber: "",
  type: "RECEIVED",
  partyName: "",
  bankAccountId: "",
  amount: "",
  chequeDate: new Date().toISOString().split("T")[0],
  remarks: "",
};

function numberToWordsINR(num) {
  if (!num || isNaN(num) || num <= 0) return "Zero Rupees Only";
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const inWords = (n) => {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + "Hundred ";
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + " " + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str;
  };

  let n = Math.floor(num);
  let crore = Math.floor(n / 10000000);
  n %= 10000000;
  let lakh = Math.floor(n / 100000);
  n %= 100000;
  let thousand = Math.floor(n / 1000);
  n %= 1000;

  let res = "";
  if (crore) res += inWords(crore) + "Crore ";
  if (lakh) res += inWords(lakh) + "Lakh ";
  if (thousand) res += inWords(thousand) + "Thousand ";
  if (n) res += inWords(n);

  return (res.trim() || "Zero") + " Rupees Only";
}

/**
 * Top Realistic Cheque Leaf Preview
 */
const ChequeLeafCard = ({ formData, bankAccount }) => {
  const isReceived = formData.type === "RECEIVED";
  const numAmt = parseFloat(formData.amount) || 0;
  const words = numberToWordsINR(numAmt);

  const formattedDate = formData.chequeDate
    ? new Date(formData.chequeDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "DD/MM/YYYY";

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 via-surface to-teal-50/30 dark:from-emerald-950/20 dark:via-surface dark:to-teal-950/20 p-5 sm:p-6 shadow-md transition-all font-sans">
      {/* Decorative watermark pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold tracking-wider text-text uppercase">
              {bankAccount?.bankMasterId?.name ||
                bankAccount?.accountName ||
                "TREASURY BANK"}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-muted">
              IFSC: {bankAccount?.ifscCode || "IFSC0000123"}
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">
            Branch: {bankAccount?.branchName || "Main Commercial Branch"}
          </p>
        </div>

        {/* Date Box */}
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[10px] font-bold text-text-muted tracking-wider uppercase mb-0.5">
            Date
          </span>
          <div className="px-3 py-1 rounded-lg border border-border bg-surface font-mono text-xs font-bold text-text shadow-xs">
            {formattedDate}
          </div>
        </div>
      </div>

      {/* Payee Line */}
      <div className="mt-4 pt-3 border-t border-border/80 flex items-baseline gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted shrink-0">
          PAY:
        </span>
        <div className="flex-1 border-b border-dashed border-border/90 pb-1 font-semibold text-sm text-text truncate">
          {formData.partyName || "CASH / BEARER"}
        </div>
        <span className="text-[10px] font-semibold text-text-muted shrink-0">
          OR BEARER
        </span>
      </div>

      {/* Amount in words and Amount box */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0 flex items-baseline gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted shrink-0">
            RUPEES:
          </span>
          <div className="flex-1 border-b border-dashed border-border/90 pb-1 font-medium text-xs text-text italic truncate">
            {words}
          </div>
        </div>

        {/* Amount Box */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-text-muted">₹</span>
          <div className="min-w-[120px] px-3 py-1.5 rounded-xl border-2 border-primary/40 bg-surface text-right font-mono text-base font-extrabold text-primary shadow-xs">
            {numAmt.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span className="text-xs ml-1 text-text-muted font-normal">/-</span>
          </div>
        </div>
      </div>

      {/* Bottom Cheque Details Row */}
      <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <UIBadge variant={isReceived ? "info" : "warning"} size="sm">
            {isReceived ? "CUSTOMER CHEQUE (RECEIVED)" : "SUPPLIER CHEQUE (ISSUED)"}
          </UIBadge>
          <span className="font-mono text-xs font-bold text-text-muted">
            NO: {formData.chequeNumber || "000000"}
          </span>
        </div>

        <div className="text-right">
          <div className="h-6 w-28 border-b border-border/90 ml-auto" />
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block mt-0.5">
            Authorized Signatory
          </span>
        </div>
      </div>
    </div>
  );
};

export function ChequeDialog({
  isOpen,
  onClose,
  mode = "create",
  entityId = null,
  chequeData = null,
  onSubmitCreate,
  onSubmitUpdate,
  onFetchById,
  onDepositCheque,
  onClearCheque,
  onBounceCheque,
  onCancelCheque,
  onSuccess,
}) {
  const { bankAccounts = [], getBankAccounts } = useBankAccount();

  const [currentMode, setCurrentMode] = useState(mode);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [details, setDetails] = useState(chequeData);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode, isOpen]);

  // Load bank accounts list when modal opens
  useEffect(() => {
    if (isOpen) {
      getBankAccounts().catch(() => {});
    }
  }, [isOpen, getBankAccounts]);

  // Load cheque details
  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_FORM);
      setFormErrors({});
      setServerError(null);
      setDetails(null);
      return;
    }

    if (currentMode === "view" || currentMode === "edit") {
      if (chequeData) {
        setDetails(chequeData);
        setFormData({
          chequeNumber: chequeData.chequeNumber || "",
          type: chequeData.type || "RECEIVED",
          partyName: chequeData.partyName || "",
          bankAccountId:
            typeof chequeData.bankAccountId === "object"
              ? chequeData.bankAccountId?._id
              : chequeData.bankAccountId || "",
          amount: String(chequeData.amount || ""),
          chequeDate: chequeData.chequeDate
            ? new Date(chequeData.chequeDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          remarks: chequeData.remarks || "",
        });
      } else if (entityId && onFetchById) {
        setIsFetching(true);
        setServerError(null);
        onFetchById(entityId)
          .then((data) => {
            setDetails(data);
            setFormData({
              chequeNumber: data.chequeNumber || "",
              type: data.type || "RECEIVED",
              partyName: data.partyName || "",
              bankAccountId:
                typeof data.bankAccountId === "object"
                  ? data.bankAccountId?._id
                  : data.bankAccountId || "",
              amount: String(data.amount || ""),
              chequeDate: data.chequeDate
                ? new Date(data.chequeDate).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
              remarks: data.remarks || "",
            });
          })
          .catch((err) =>
            setServerError(
              typeof err === "string" ? err : "Failed to load cheque details."
            )
          )
          .finally(() => setIsFetching(false));
      }
    } else {
      setFormData(INITIAL_FORM);
      setFormErrors({});
      setServerError(null);
    }
  }, [isOpen, currentMode, entityId, chequeData, onFetchById]);

  const bankOptions = useMemo(() => {
    return bankAccounts.map((acc) => ({
      label: `${acc.accountName} (${acc.accountNumber})`,
      value: acc._id,
    }));
  }, [bankAccounts]);

  const selectedBank = useMemo(() => {
    return bankAccounts.find((b) => b._id === formData.bankAccountId);
  }, [bankAccounts, formData.bankAccountId]);

  const handleFieldChange = (name, valueOrEvent) => {
    let val = valueOrEvent;
    if (
      valueOrEvent &&
      typeof valueOrEvent === "object" &&
      "target" in valueOrEvent
    ) {
      val =
        valueOrEvent.target.type === "checkbox"
          ? valueOrEvent.target.checked
          : valueOrEvent.target.value;
    }
    setFormData((prev) => ({ ...prev, [name]: val }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const copyText = (key, text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const validate = () => {
    const errors = {};
    if (!formData.chequeNumber.trim())
      errors.chequeNumber = "Cheque number is required";
    if (!formData.partyName.trim())
      errors.partyName = "Party name is required";
    if (!formData.bankAccountId)
      errors.bankAccountId = "Select bank account";

    const numAmt = parseFloat(formData.amount);
    if (!formData.amount || isNaN(numAmt) || numAmt <= 0) {
      errors.amount = "Enter a valid amount (> 0)";
    }

    if (!formData.chequeDate) errors.chequeDate = "Cheque date is required";
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

    const payload = {
      chequeNumber: formData.chequeNumber.trim(),
      type: formData.type,
      partyName: formData.partyName.trim(),
      bankAccountId: formData.bankAccountId,
      amount: parseFloat(formData.amount),
      chequeDate: new Date(formData.chequeDate).toISOString(),
      remarks: formData.remarks.trim() || undefined,
    };

    try {
      if (currentMode === "create") {
        await onSubmitCreate?.(payload);
      } else if (currentMode === "edit" && (entityId || details?._id)) {
        await onSubmitUpdate?.(entityId || details._id, payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setServerError(
        typeof err === "string" ? err : "Failed to register cheque."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAction = async (actionFn, ...args) => {
    const targetId = entityId || details?._id;
    if (!targetId || !actionFn) return;
    setIsSubmitting(true);
    setServerError(null);
    try {
      await actionFn(targetId, ...args);
      onSuccess?.();
      onClose();
    } catch (err) {
      setServerError(typeof err === "string" ? err : "Action failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isView = currentMode === "view";
  const isEdit = currentMode === "edit";
  const isCreate = currentMode === "create";

  const title = isCreate
    ? "Register Cheque"
    : isEdit
    ? "Edit Cheque"
    : "Cheque Details";

  const subtitle = isCreate
    ? "Record a received or issued bank cheque into treasury."
    : isEdit
    ? "Modify cheque particulars or linked party details."
    : "Review status, bank clearance timeline, and remittance details.";

  const statusVariantMap = {
    RECEIVED: "info",
    DEPOSITED: "warning",
    CLEARED: "success",
    BOUNCED: "danger",
    CANCELLED: "neutral",
  };

  const activeCheque = details || (isView ? null : formData);

  return (
    <UIModal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      mobileSheet
      className="w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden"
    >
      <UIModalHeader>
        <div className="flex items-center justify-between gap-3 w-full pr-6">
          <div>
            <UIModalTitle>{title}</UIModalTitle>
            <UIModalDescription>{subtitle}</UIModalDescription>
          </div>
          {isView && details && details.status === "RECEIVED" && (
            <UIButton
              variant="outline"
              size="sm"
              startIcon={<FiEdit2 />}
              onClick={() => setCurrentMode("edit")}
              className="shrink-0"
            >
              Edit Cheque
            </UIButton>
          )}
        </div>
      </UIModalHeader>

      <UIModalBody className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7 space-y-6">
        {isFetching && <UISkeleton rows={5} />}

        {serverError && !isFetching && (
          <UIAlert variant="error" onDismiss={() => setServerError(null)}>
            {serverError}
          </UIAlert>
        )}

        {/* Top Interactive Cheque Leaf Preview */}
        {!isFetching && (
          <ChequeLeafCard
            formData={isView && details ? details : formData}
            bankAccount={
              selectedBank ||
              details?.bankAccount ||
              details?.bankAccountId ||
              null
            }
          />
        )}

        {/* VIEW MODE */}
        {isView && !isFetching && details && (
          <div className="space-y-6">
            {/* 3 KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FiDollarSign className="text-lg" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-text-muted block">
                    Cheque Amount
                  </span>
                  <span className="text-sm font-bold text-text">
                    ₹
                    {Number(details.amount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {details.type === "RECEIVED" ? (
                    <FiArrowDownLeft className="text-lg" />
                  ) : (
                    <FiArrowUpRight className="text-lg" />
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-medium text-text-muted block">
                    Cheque Type
                  </span>
                  <span className="text-sm font-bold text-text">
                    {details.type === "RECEIVED" ? "Customer Inflow" : "Supplier Outflow"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <FiCalendar className="text-lg" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-text-muted block">
                    Current Status
                  </span>
                  <UIBadge
                    variant={statusVariantMap[details.status] || "neutral"}
                    size="sm"
                  >
                    {details.status || "RECEIVED"}
                  </UIBadge>
                </div>
              </div>
            </div>

            {/* Read-only Key Value Details */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">
                Remittance & Instrument Details
              </h4>
              <UIKeyValueList
                items={[
                  {
                    label: "Cheque Number",
                    value: details.chequeNumber,
                    copyable: true,
                  },
                  {
                    label: "Party Name",
                    value: details.partyName,
                  },
                  {
                    label: "Bank Account",
                    value:
                      details.bankAccount?.accountName ||
                      details.bankAccountId?.accountName ||
                      selectedBank?.accountName ||
                      "Primary Bank Account",
                  },
                  {
                    label: "Amount",
                    value: `₹ ${(details.amount || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}`,
                  },
                  {
                    label: "Cheque Date",
                    value: details.chequeDate
                      ? new Date(details.chequeDate).toLocaleDateString("en-IN")
                      : "N/A",
                  },
                  {
                    label: "Clearance Status",
                    value: (
                      <UIBadge
                        variant={statusVariantMap[details.status] || "neutral"}
                      >
                        {details.status || "RECEIVED"}
                      </UIBadge>
                    ),
                  },
                  {
                    label: "Remarks",
                    value: details.remarks || "No remarks noted",
                  },
                ]}
              />
            </div>
          </div>
        )}

        {/* CREATE / EDIT MODE */}
        {!isView && (
          <form
            id="cheque-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <UIFormSection title="Cheque Details & Party">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UIInput
                  label="Cheque Number"
                  placeholder="e.g. 000123"
                  value={formData.chequeNumber}
                  onChange={(e) =>
                    handleFieldChange("chequeNumber", e.target.value)
                  }
                  error={Boolean(formErrors.chequeNumber)}
                  helperText={formErrors.chequeNumber}
                  required
                />

                <UISelect
                  label="Cheque Type"
                  value={formData.type}
                  onChange={(val) => handleFieldChange("type", val)}
                  options={chequeTypeOptions}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UIInput
                  label="Party Name (Customer / Supplier)"
                  placeholder="Enter party name"
                  value={formData.partyName}
                  onChange={(e) =>
                    handleFieldChange("partyName", e.target.value)
                  }
                  error={Boolean(formErrors.partyName)}
                  helperText={formErrors.partyName}
                  required
                />

                <UISelect
                  label="Bank Account"
                  value={formData.bankAccountId}
                  onChange={(val) => handleFieldChange("bankAccountId", val)}
                  options={bankOptions}
                  error={Boolean(formErrors.bankAccountId)}
                  helperText={formErrors.bankAccountId}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UIInput
                  type="number"
                  label="Amount (₹)"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    handleFieldChange("amount", e.target.value)
                  }
                  error={Boolean(formErrors.amount)}
                  helperText={formErrors.amount}
                  required
                />

                <UIInput
                  type="date"
                  label="Cheque Date"
                  value={formData.chequeDate}
                  onChange={(e) =>
                    handleFieldChange("chequeDate", e.target.value)
                  }
                  error={Boolean(formErrors.chequeDate)}
                  helperText={formErrors.chequeDate}
                  required
                />
              </div>

              <UIInput
                label="Remarks (Optional)"
                placeholder="Additional narration or payment reference..."
                value={formData.remarks}
                onChange={(e) =>
                  handleFieldChange("remarks", e.target.value)
                }
              />
            </UIFormSection>
          </form>
        )}
      </UIModalBody>

      <UIModalFooter>
        <UIButton variant="outline" onClick={onClose} disabled={isSubmitting}>
          {isView ? "Close" : "Cancel"}
        </UIButton>

        {/* View Mode Lifecycle Action Buttons */}
        {isView && details && details.status !== "CLEARED" && details.status !== "BOUNCED" && details.status !== "CANCELLED" && (
          <div className="flex items-center gap-2 flex-wrap">
            {details.status === "RECEIVED" && onDepositCheque && (
              <UIButton
                variant="primary"
                onClick={() => handleAction(onDepositCheque)}
                isLoading={isSubmitting}
              >
                Deposit to Bank
              </UIButton>
            )}

            {onClearCheque && (
              <UIButton
                variant="success"
                onClick={() => handleAction(onClearCheque)}
                isLoading={isSubmitting}
              >
                Clear Cheque
              </UIButton>
            )}

            {onBounceCheque && (
              <UIButton
                variant="danger"
                onClick={() => handleAction(onBounceCheque)}
                isLoading={isSubmitting}
              >
                Mark Bounced
              </UIButton>
            )}

            {onCancelCheque && (
              <UIButton
                variant="outline"
                onClick={() => handleAction(onCancelCheque)}
                isLoading={isSubmitting}
              >
                Cancel Cheque
              </UIButton>
            )}
          </div>
        )}

        {!isView && (
          <UIButton
            variant="primary"
            type="submit"
            form="cheque-form"
            isLoading={isSubmitting}
          >
            {isCreate ? "Register Cheque" : "Save Changes"}
          </UIButton>
        )}
      </UIModalFooter>
    </UIModal>
  );
}

export default ChequeDialog;
