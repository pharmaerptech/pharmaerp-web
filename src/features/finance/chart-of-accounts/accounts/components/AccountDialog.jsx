import React, { useState, useEffect, useMemo } from "react";
import {
  FiLayers,
  FiEdit2,
  FiCopy,
  FiCheck,
  FiDollarSign,
  FiFolder,
  FiActivity,
  FiCheckCircle,
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
} from "@/components/ui";

const ALL_CATEGORY_OPTIONS = [
  { label: "Customer Ledger Account", value: "CUSTOMER" },
  { label: "Supplier Ledger Account", value: "SUPPLIER" },
  { label: "Bank Account", value: "BANK" },
  { label: "Cash Account", value: "CASH" },
  { label: "Stock / Inventory Account", value: "INVENTORY" },
  { label: "Purchase Account", value: "PURCHASE" },
  { label: "Sales Account", value: "SALES" },
  { label: "GST / Tax Account", value: "GST" },
  { label: "Expense Account", value: "EXPENSE" },
  { label: "Income Account", value: "INCOME" },
  { label: "Shop & Fixed Assets", value: "FIXED_ASSET" },
  { label: "Other Liability", value: "LIABILITY" },
  { label: "Capital / Owner's Equity", value: "EQUITY" },
];

const CATEGORY_MAP_BY_NATURE = {
  ASSET: ["CASH", "BANK", "CUSTOMER", "INVENTORY", "FIXED_ASSET"],
  LIABILITY: ["SUPPLIER", "GST", "LIABILITY"],
  INCOME: ["SALES", "INCOME"],
  EXPENSE: ["PURCHASE", "EXPENSE"],
  EQUITY: ["EQUITY"],
};

const balanceTypeOptions = [
  { label: "Debit (Dr)", value: "dr" },
  { label: "Credit (Cr)", value: "cr" },
];

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const INITIAL_FORM = {
  accountName: "",
  accountCode: "",
  accountGroupId: "",
  accountNature: "",
  accountCategory: "",
  openingBalance: 0,
  openingBalanceType: "dr",
  description: "",
  status: "active",
};

/**
 * Top live preview card for the GL Account
 */
const AccountLiveCard = ({ formData, derivedNature, groupName }) => {
  const natureBadgeVariant = {
    ASSET: "success",
    LIABILITY: "danger",
    INCOME: "info",
    EXPENSE: "warning",
    EQUITY: "purple",
  }[derivedNature] || "neutral";

  const numBalance = Number(formData.openingBalance || 0);
  const formattedBalance = `₹${numBalance.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-muted/60 p-5 shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 font-bold text-base shadow-inner">
            <FiLayers className="text-xl" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-muted border border-border text-text-muted">
                {formData.accountCode || "CODE-AUTO"}
              </span>
              {derivedNature && (
                <UIBadge variant={natureBadgeVariant} size="sm">
                  {derivedNature}
                </UIBadge>
              )}
              <UIBadge
                variant={formData.status === "active" ? "success" : "neutral"}
                size="sm"
              >
                {(formData.status || "active").toUpperCase()}
              </UIBadge>
            </div>
            <h4 className="mt-1 truncate text-base font-bold text-text">
              {formData.accountName || "New General Ledger Account"}
            </h4>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] font-medium text-text-muted block">
            Opening Balance
          </span>
          <span className="text-sm font-bold text-text">
            {formattedBalance}{" "}
            <span className="text-xs text-text-muted uppercase">
              ({formData.openingBalanceType || "dr"})
            </span>
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-1.5 truncate">
          <FiFolder className="text-primary/70 shrink-0" />
          <span className="truncate">
            Under Group:{" "}
            <strong className="text-text font-semibold">
              {groupName || "Not Selected"}
            </strong>
          </span>
        </div>
        <div className="shrink-0 font-medium">
          Category:{" "}
          <strong className="text-text font-semibold">
            {formData.accountCategory || "None"}
          </strong>
        </div>
      </div>
    </div>
  );
};

export function AccountDialog({
  isOpen,
  onClose,
  mode = "create",
  accountData = null,
  accountGroups = [],
  onSubmitCreate,
  onSubmitUpdate,
  onSuccess,
}) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if ((currentMode === "edit" || currentMode === "view") && accountData) {
        const groupObj = accountData.accountGroupId;
        const groupId =
          typeof groupObj === "object" ? groupObj?._id : groupObj || "";

        setFormData({
          accountName: accountData.accountName || accountData.name || "",
          accountCode: accountData.accountCode || accountData.code || "",
          accountGroupId: groupId,
          accountNature: accountData.accountNature || accountData.nature || "",
          accountCategory: accountData.accountCategory || accountData.category || "",
          openingBalance: accountData.openingBalance || 0,
          openingBalanceType: accountData.openingBalanceType || "dr",
          description: accountData.description || "",
          status: accountData.status || "active",
        });
      } else {
        setFormData(INITIAL_FORM);
      }
      setFormErrors({});
      setServerError(null);
    } else {
      setFormData(INITIAL_FORM);
      setFormErrors({});
      setServerError(null);
    }
  }, [isOpen, currentMode, accountData]);

  const groupOptions = useMemo(() => {
    const opts = [{ label: "Select account group", value: "" }];
    accountGroups.forEach((g) => {
      opts.push({ label: g.groupName || g.name, value: g._id || g.id });
    });
    return opts;
  }, [accountGroups]);

  const selectedGroupObj = useMemo(() => {
    return accountGroups.find(
      (g) => (g._id || g.id) === formData.accountGroupId
    );
  }, [accountGroups, formData.accountGroupId]);

  // Derived nature from selected group
  const derivedNature = useMemo(() => {
    if (!formData.accountGroupId) return formData.accountNature || "";
    return selectedGroupObj?.nature
      ? selectedGroupObj.nature.toUpperCase()
      : formData.accountNature || "";
  }, [formData.accountGroupId, formData.accountNature, selectedGroupObj]);

  // Filtered categories based on nature
  const categoryOptions = useMemo(() => {
    let allowedCategories = [];
    if (derivedNature) {
      allowedCategories = CATEGORY_MAP_BY_NATURE[derivedNature] || [];
    }

    if (allowedCategories.length === 0) {
      return [{ label: "Select Category", value: "" }, ...ALL_CATEGORY_OPTIONS];
    }

    const filtered = ALL_CATEGORY_OPTIONS.filter((opt) =>
      allowedCategories.includes(opt.value)
    );
    return [{ label: "Select Category", value: "" }, ...filtered];
  }, [derivedNature]);

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

    setFormData((prev) => {
      const nextData = { ...prev, [name]: val };

      if (name === "accountGroupId") {
        const group = accountGroups.find((g) => (g._id || g.id) === val);
        if (group && group.nature) {
          const nat = group.nature.toUpperCase();
          nextData.accountNature = nat;

          // Auto-select category guess based on group name if not set
          const groupNameNorm = String(group.groupName || "").toLowerCase();
          if (groupNameNorm.includes("bank")) nextData.accountCategory = "BANK";
          else if (groupNameNorm.includes("cash")) nextData.accountCategory = "CASH";
          else if (
            groupNameNorm.includes("customer") ||
            groupNameNorm.includes("debtor")
          )
            nextData.accountCategory = "CUSTOMER";
          else if (
            groupNameNorm.includes("supplier") ||
            groupNameNorm.includes("creditor")
          )
            nextData.accountCategory = "SUPPLIER";
          else if (
            groupNameNorm.includes("inventory") ||
            groupNameNorm.includes("stock")
          )
            nextData.accountCategory = "INVENTORY";
          else if (groupNameNorm.includes("purchase"))
            nextData.accountCategory = "PURCHASE";
          else if (groupNameNorm.includes("sale"))
            nextData.accountCategory = "SALES";
          else if (groupNameNorm.includes("tax") || groupNameNorm.includes("gst"))
            nextData.accountCategory = "GST";
          else nextData.accountCategory = nat === "ASSET" ? "FIXED_ASSET" : nat;
        }
      }

      return nextData;
    });

    setFormErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
  };

  const copyText = (key, text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const validate = () => {
    const errors = {};
    if (!formData.accountName.trim()) {
      errors.accountName = "Account name is required";
    } else if (formData.accountName.trim().length < 2) {
      errors.accountName = "Account name must be at least 2 characters";
    }

    if (!formData.accountCode.trim()) {
      errors.accountCode = "Account code is required";
    }

    if (!formData.accountGroupId) {
      errors.accountGroupId = "Account group is required";
    }

    if (!formData.accountCategory) {
      errors.accountCategory = "Account category is required";
    }

    if (Number(formData.openingBalance) < 0) {
      errors.openingBalance = "Opening balance cannot be negative";
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

    const payload = {
      accountName: formData.accountName.trim(),
      accountCode: formData.accountCode.trim(),
      accountGroupId: formData.accountGroupId,
      accountNature: derivedNature,
      accountCategory: formData.accountCategory,
      openingBalance: Number(formData.openingBalance) || 0,
      openingBalanceType: formData.openingBalanceType || "dr",
      description: formData.description.trim(),
      status: formData.status || "active",
    };

    try {
      if (currentMode === "create") {
        await onSubmitCreate(payload);
      } else if (currentMode === "edit" && accountData?._id) {
        await onSubmitUpdate(accountData._id, payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setServerError(typeof err === "string" ? err : "Failed to save account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isView = currentMode === "view";
  const isEdit = currentMode === "edit";
  const isCreate = currentMode === "create";

  const title = isCreate
    ? "Add Account (COA)"
    : isEdit
    ? "Edit Account"
    : "Account Details";

  const subtitle = isCreate
    ? "Create a new general ledger account for financial accounting."
    : isEdit
    ? "Modify account properties, classification, or status."
    : "View account metadata, classification nature, and opening balance.";

  const natureBadgeVariantMap = {
    ASSET: "success",
    LIABILITY: "danger",
    INCOME: "info",
    EXPENSE: "warning",
    EQUITY: "purple",
  };

  return (
    <UIModal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      mobileSheet
      className="w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden"
    >
      <UIModalHeader>
        <div className="flex items-center justify-between gap-3 w-full pr-6">
          <div>
            <UIModalTitle>{title}</UIModalTitle>
            <UIModalDescription>{subtitle}</UIModalDescription>
          </div>
          {isView && (
            <UIButton
              variant="outline"
              size="sm"
              startIcon={<FiEdit2 />}
              onClick={() => setCurrentMode("edit")}
              className="shrink-0"
            >
              Edit Account
            </UIButton>
          )}
        </div>
      </UIModalHeader>

      <UIModalBody className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7 space-y-6">
        {serverError && (
          <UIAlert variant="error" onDismiss={() => setServerError(null)}>
            {serverError}
          </UIAlert>
        )}

        {/* Live Card Preview for Create/Edit */}
        {!isView && (
          <AccountLiveCard
            formData={formData}
            derivedNature={derivedNature}
            groupName={selectedGroupObj?.groupName}
          />
        )}

        {/* VIEW MODE */}
        {isView && accountData && (
          <div className="space-y-6">
            {/* Hero Profile Banner */}
            <div className="rounded-2xl border border-border bg-surface-muted/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 font-bold text-xl shadow-inner">
                  {(accountData.accountName || accountData.name || "GL")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-surface border border-border text-text">
                      {accountData.accountCode || accountData.code || "N/A"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          "code",
                          accountData.accountCode || accountData.code
                        )
                      }
                      className="text-text-muted hover:text-text transition-colors p-1"
                      title="Copy Account Code"
                    >
                      {copiedKey === "code" ? (
                        <FiCheck className="text-success text-xs" />
                      ) : (
                        <FiCopy className="text-xs" />
                      )}
                    </button>
                    <UIBadge
                      variant={
                        natureBadgeVariantMap[derivedNature] || "neutral"
                      }
                    >
                      {derivedNature || "ASSET"}
                    </UIBadge>
                    <UIBadge
                      variant={
                        accountData.status === "active" ? "success" : "neutral"
                      }
                    >
                      {(accountData.status || "active").toUpperCase()}
                    </UIBadge>
                  </div>
                  <h3 className="mt-1 text-xl font-bold text-text">
                    {accountData.accountName || accountData.name}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {accountData.accountCategory || "General"} Account
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-xs font-medium text-text-muted block">
                  Opening Balance
                </span>
                <span className="text-2xl font-bold text-text">
                  ₹
                  {Number(accountData.openingBalance || 0).toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
                <span className="text-xs font-semibold text-text-muted uppercase block">
                  {(accountData.openingBalanceType || "dr") === "dr"
                    ? "Debit (Dr)"
                    : "Credit (Cr)"}
                </span>
              </div>
            </div>

            {/* 3 KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FiDollarSign className="text-lg" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-text-muted block">
                    Opening Balance
                  </span>
                  <span className="text-sm font-bold text-text">
                    ₹
                    {Number(accountData.openingBalance || 0).toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <FiActivity className="text-lg" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-text-muted block">
                    Classification Nature
                  </span>
                  <span className="text-sm font-bold text-text">
                    {derivedNature || "ASSET"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <FiFolder className="text-lg" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-text-muted block">
                    Account Group
                  </span>
                  <span className="text-sm font-bold text-text truncate max-w-[150px] block">
                    {typeof accountData.accountGroupId === "object"
                      ? accountData.accountGroupId?.groupName
                      : selectedGroupObj?.groupName || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Read-only Key Value Details */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">
                Ledger Account Metadata
              </h4>
              <UIKeyValueList
                items={[
                  {
                    label: "Account Name",
                    value: accountData.accountName || accountData.name || "N/A",
                  },
                  {
                    label: "Account Code",
                    value: accountData.accountCode || accountData.code || "N/A",
                    copyable: true,
                  },
                  {
                    label: "Account Group",
                    value:
                      typeof accountData.accountGroupId === "object"
                        ? accountData.accountGroupId?.groupName
                        : selectedGroupObj?.groupName || "N/A",
                  },
                  {
                    label: "Nature",
                    value: (
                      <UIBadge
                        variant={
                          natureBadgeVariantMap[derivedNature] || "neutral"
                        }
                      >
                        {derivedNature || "N/A"}
                      </UIBadge>
                    ),
                  },
                  {
                    label: "Category",
                    value:
                      accountData.accountCategory ||
                      accountData.category ||
                      "N/A",
                  },
                  {
                    label: "Status",
                    value: (
                      <UIBadge
                        variant={
                          accountData.status === "active"
                            ? "success"
                            : "neutral"
                        }
                      >
                        {(accountData.status || "active").toUpperCase()}
                      </UIBadge>
                    ),
                  },
                  {
                    label: "System Account",
                    value: accountData.isSystemAccount ? "Yes (Protected)" : "No",
                  },
                  {
                    label: "Description",
                    value:
                      accountData.description || "No description provided",
                  },
                ]}
              />
            </div>
          </div>
        )}

        {/* CREATE / EDIT MODE */}
        {!isView && (
          <form
            id="account-dialog-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <UIFormSection title="Classification & Group">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UISelect
                  label="Account Group"
                  value={formData.accountGroupId}
                  onChange={(val) => handleFieldChange("accountGroupId", val)}
                  options={groupOptions}
                  error={Boolean(formErrors.accountGroupId)}
                  helperText={formErrors.accountGroupId}
                  required
                />

                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">
                    Nature (Auto-derived from Group)
                  </label>
                  <div className="h-10 px-3 flex items-center bg-surface-muted/50 border border-border rounded-xl">
                    {derivedNature ? (
                      <UIBadge
                        variant={
                          natureBadgeVariantMap[derivedNature] || "neutral"
                        }
                      >
                        {derivedNature}
                      </UIBadge>
                    ) : (
                      <span className="text-xs text-text-muted">
                        Select group first
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <UISelect
                label="Account Category"
                value={formData.accountCategory}
                onChange={(val) => handleFieldChange("accountCategory", val)}
                options={categoryOptions}
                error={Boolean(formErrors.accountCategory)}
                helperText={
                  formErrors.accountCategory ||
                  "Filtered based on selected Group Nature"
                }
                required
              />
            </UIFormSection>

            <UIFormSection title="Account Identity">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UIInput
                  label="Account Name"
                  placeholder="e.g. HDFC Bank Current Account"
                  value={formData.accountName}
                  onChange={(e) =>
                    handleFieldChange("accountName", e.target.value)
                  }
                  error={Boolean(formErrors.accountName)}
                  helperText={formErrors.accountName}
                  required
                />

                <UIInput
                  label="Account Code"
                  placeholder="e.g. ACC-1001"
                  value={formData.accountCode}
                  onChange={(e) =>
                    handleFieldChange("accountCode", e.target.value)
                  }
                  error={Boolean(formErrors.accountCode)}
                  helperText={formErrors.accountCode}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UIInput
                  type="number"
                  label="Opening Balance (₹)"
                  placeholder="0.00"
                  value={formData.openingBalance}
                  onChange={(e) =>
                    handleFieldChange("openingBalance", e.target.value)
                  }
                  error={Boolean(formErrors.openingBalance)}
                  helperText={formErrors.openingBalance}
                  disabled={isEdit} // Opening balance locked after creation
                />

                <UISelect
                  label="Balance Type"
                  value={formData.openingBalanceType}
                  onChange={(val) =>
                    handleFieldChange("openingBalanceType", val)
                  }
                  options={balanceTypeOptions}
                  disabled={isEdit}
                />
              </div>

              <UISelect
                label="Status"
                value={formData.status}
                onChange={(val) => handleFieldChange("status", val)}
                options={statusOptions}
              />

              <UIInput
                label="Description (Optional)"
                placeholder="Notes or details about this ledger account..."
                value={formData.description}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
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

        {isView ? (
          <UIButton
            variant="primary"
            startIcon={<FiEdit2 />}
            onClick={() => setCurrentMode("edit")}
          >
            Edit Account
          </UIButton>
        ) : (
          <UIButton
            variant="primary"
            type="submit"
            form="account-dialog-form"
            isLoading={isSubmitting}
          >
            {isCreate ? "Create Account" : "Save Changes"}
          </UIButton>
        )}
      </UIModalFooter>
    </UIModal>
  );
}

export default AccountDialog;
