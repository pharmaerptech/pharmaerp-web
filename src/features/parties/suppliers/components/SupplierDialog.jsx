import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  UIBadge,
  UIKeyValueList,
} from "@/components/ui";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  ShieldCheck,
  Landmark,
  Copy,
  Check,
  Edit2,
  Sparkles,
  Clock,
  Wallet,
  Hash,
} from "lucide-react";

const supplierTypeOptions = [
  { label: "Pharmaceutical Distributor", value: "distributor", description: "Regional authorized pharma distributor" },
  { label: "Direct Manufacturer / OEM", value: "manufacturer", description: "Pharma manufacturing laboratory or company" },
  { label: "Wholesaler / Stockist", value: "wholesaler", description: "Bulk C&F agent or super-stockist" },
  { label: "Local Surgical / Vendor", value: "local_vendor", description: "Local surgical or OTC sundries vendor" },
  { label: "Other Supplier", value: "other", description: "Miscellaneous consumable supplier" },
];

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Blocked", value: "blocked" },
];

const balanceTypeOptions = [
  { label: "Credit (Cr - We owe supplier)", value: "cr" },
  { label: "Debit (Dr - Advance paid to supplier)", value: "dr" },
];

const INITIAL_FORM = {
  businessName: "",
  supplierType: "distributor",
  contactPersonName: "",
  mobile: "",
  alternateMobile: "",
  email: "",
  status: "active",

  billingAddressLine1: "",
  billingAddressLine2: "",
  billingCity: "",
  billingState: "",
  billingPincode: "",

  gstNumber: "",
  panNumber: "",
  drugLicenseNumber: "",

  bankName: "",
  bankAccountNumber: "",
  bankIfscCode: "",
  bankBranchName: "",

  creditLimit: 0,
  creditDays: 0,
  openingBalance: 0,
  openingBalanceType: "cr",
  notes: "",
};

// Mini Interactive Live Preview Card for Create/Edit
function SupplierCardPreview({ businessName, supplierType, contactPersonName, mobile, status, gstNumber, bankAccountNumber }) {
  const initials = (businessName || "Supplier")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const typeLabel = supplierTypeOptions.find((t) => t.value === supplierType)?.label || "Distributor";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-linear-to-br from-blue-500/5 via-surface to-surface p-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="size-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            {initials || "S"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-base text-text truncate max-w-[220px] sm:max-w-[320px]">
                {businessName || "Vendor / Pharmaceutical Entity Name"}
              </h4>
              <UIBadge variant={status === "active" ? "success" : status === "blocked" ? "danger" : "neutral"} size="sm">
                {(status || "active").toUpperCase()}
              </UIBadge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-text-muted flex-wrap">
              <span className="font-medium text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                {typeLabel}
              </span>
              {contactPersonName && (
                <span className="flex items-center gap-1 font-medium text-text">
                  <User className="size-3 text-text-muted" /> {contactPersonName}
                </span>
              )}
              {mobile && (
                <span className="flex items-center gap-1 font-mono text-text-muted">
                  <Phone className="size-3 text-text-muted" /> {mobile}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:text-right shrink-0">
          {gstNumber && (
            <div>
              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">GSTIN</div>
              <div className="text-xs font-bold text-text font-mono truncate max-w-[130px]">{gstNumber}</div>
            </div>
          )}
          {bankAccountNumber && (
            <div className="hidden sm:block pl-3 border-l border-border">
              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Settlement A/C</div>
              <div className="text-xs font-bold text-text font-mono">•••• {bankAccountNumber.slice(-4)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SupplierDialog({
  isOpen,
  onClose,
  mode = "create",
  supplierData = null,
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
      if ((currentMode === "edit" || currentMode === "view") && supplierData) {
        const bAddr = supplierData.billingAddress || supplierData.address || {};
        const bank = supplierData.bankDetails || {};
        setFormData({
          businessName: supplierData.businessName || supplierData.name || "",
          supplierType: supplierData.supplierType || supplierData.type || "distributor",
          contactPersonName: supplierData.contactPersonName || supplierData.contactPerson || "",
          mobile: supplierData.mobile || supplierData.phone || "",
          alternateMobile: supplierData.alternateMobile || "",
          email: supplierData.email || "",
          status: supplierData.status || "active",

          billingAddressLine1: bAddr.addressLine1 || supplierData.addressLine1 || "",
          billingAddressLine2: bAddr.addressLine2 || "",
          billingCity: bAddr.city || supplierData.city || "",
          billingState: bAddr.state || supplierData.state || "",
          billingPincode: bAddr.pincode || supplierData.pincode || "",

          gstNumber: supplierData.gstNumber || supplierData.gstin || "",
          panNumber: supplierData.panNumber || supplierData.pan || "",
          drugLicenseNumber: supplierData.drugLicenseNumber || supplierData.dlNumber || "",

          bankName: bank.bankName || supplierData.bankName || "",
          bankAccountNumber: bank.accountNumber || supplierData.bankAccountNumber || "",
          bankIfscCode: bank.ifscCode || supplierData.bankIfscCode || "",
          bankBranchName: bank.branchName || supplierData.bankBranchName || "",

          creditLimit: supplierData.creditLimit || 0,
          creditDays: supplierData.creditDays || 0,
          openingBalance: supplierData.openingBalance || 0,
          openingBalanceType: supplierData.openingBalanceType || "cr",
          notes: supplierData.notes || "",
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
  }, [isOpen, currentMode, supplierData]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFieldChange = (name, valueOrEvent) => {
    let val = valueOrEvent;
    if (valueOrEvent && typeof valueOrEvent === "object" && "target" in valueOrEvent) {
      val = valueOrEvent.target.type === "checkbox" ? valueOrEvent.target.checked : valueOrEvent.target.value;
    }
    setFormData((prev) => ({ ...prev, [name]: val }));
    setFormErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.businessName.trim()) {
      errors.businessName = "Business or Supplier name is required";
    } else if (formData.businessName.trim().length < 2) {
      errors.businessName = "Business name must be at least 2 characters";
    }

    if (formData.mobile && !/^[6-9][0-9]{9}$/.test(formData.mobile.trim())) {
      errors.mobile = "Enter a valid 10-digit Indian mobile number";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Enter a valid email address";
    }

    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(formData.gstNumber.trim().toUpperCase())) {
      errors.gstNumber = "Enter a valid 15-character GSTIN (e.g. 27AAAAA0000A1Z5)";
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
      name: formData.businessName.trim(),
      businessName: formData.businessName.trim(),
      supplierType: formData.supplierType || "distributor",
      contactPersonName: formData.contactPersonName.trim() || null,
      mobile: formData.mobile.trim() || null,
      alternateMobile: formData.alternateMobile.trim() || null,
      email: formData.email.trim().toLowerCase() || null,
      status: formData.status || "active",

      billingAddress: {
        addressLine1: formData.billingAddressLine1.trim() || null,
        addressLine2: formData.billingAddressLine2.trim() || null,
        city: formData.billingCity.trim() || null,
        state: formData.billingState.trim() || null,
        country: "India",
        pincode: formData.billingPincode.trim() || null,
      },

      gstNumber: formData.gstNumber.trim().toUpperCase() || null,
      panNumber: formData.panNumber.trim().toUpperCase() || null,
      drugLicenseNumber: formData.drugLicenseNumber.trim().toUpperCase() || null,

      bankDetails: {
        bankName: formData.bankName.trim() || null,
        accountNumber: formData.bankAccountNumber.trim() || null,
        ifscCode: formData.bankIfscCode.trim().toUpperCase() || null,
        branchName: formData.bankBranchName.trim() || null,
      },

      creditLimit: Number(formData.creditLimit) || 0,
      creditDays: Number(formData.creditDays) || 0,
      openingBalance: Number(formData.openingBalance) || 0,
      openingBalanceType: formData.openingBalanceType || "cr",
      notes: formData.notes.trim() || null,
    };

    try {
      if (currentMode === "create") {
        await onSubmitCreate?.(payload);
      } else if (currentMode === "edit" && supplierData?._id) {
        await onSubmitUpdate?.(supplierData._id, payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setServerError(typeof err === "string" ? err : err?.message || "Failed to save supplier.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isView = currentMode === "view";
  const isEdit = currentMode === "edit";
  const isCreate = currentMode === "create";

  const title = isCreate
    ? "Add Supplier"
    : isEdit
    ? "Edit Supplier"
    : "Supplier Profile";

  const subtitle = isCreate
    ? "Register an authorized distributor or manufacturer for stock procurement."
    : isEdit
    ? "Update vendor contacts, statutory licenses, or bank remittance records."
    : "Consolidated profile showing supplier credentials, payable debt, and banking details.";

  const supplierInitials = (supplierData?.businessName || supplierData?.name || "Supplier")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <UIModal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      mobileSheet
      className="w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden font-sans"
    >
      <UIModalHeader>
        <div className="flex items-center gap-2">
          <UIModalTitle>{title}</UIModalTitle>
          <UIBadge
            variant={isCreate ? "info" : isEdit ? "warning" : "success"}
            size="sm"
          >
            {isCreate ? "NEW VENDOR" : isEdit ? "EDITING" : "VERIFIED"}
          </UIBadge>
        </div>
        <UIModalDescription>{subtitle}</UIModalDescription>
      </UIModalHeader>

      <UIModalBody className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7 space-y-6">
        {serverError && (
          <UIAlert variant="error" onDismiss={() => setServerError(null)}>
            {serverError}
          </UIAlert>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            VIEW MODE
           ══════════════════════════════════════════════════════════════════ */}
        {isView && supplierData && (
          <div className="space-y-6">
            {/* Top Supplier Hero Card */}
            <div className="rounded-2xl border border-border/80 bg-linear-to-br from-blue-500/10 via-surface to-surface-alt/40 p-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="size-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shrink-0">
                    {supplierInitials || "S"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-xl font-bold text-text truncate">
                        {supplierData.businessName || supplierData.name || "Unnamed Supplier"}
                      </h3>
                      {supplierData.supplierCode && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-surface border border-border px-2 py-0.5 text-xs font-mono font-semibold text-text-muted">
                          <Hash className="size-3" /> {supplierData.supplierCode}
                        </span>
                      )}
                      <UIBadge
                        variant={supplierData.status === "active" ? "success" : supplierData.status === "blocked" ? "danger" : "neutral"}
                      >
                        {(supplierData.status || "active").toUpperCase()}
                      </UIBadge>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-text-muted flex-wrap">
                      <span className="font-semibold text-blue-700 dark:text-blue-400 bg-blue-500/15 px-2.5 py-0.5 rounded-full">
                        {(supplierData.supplierType || "distributor").toUpperCase()}
                      </span>
                      {supplierData.contactPersonName && (
                        <span className="font-medium text-text flex items-center gap-1">
                          <User className="size-3.5 text-text-muted" /> {supplierData.contactPersonName}
                        </span>
                      )}
                      {supplierData.mobile && (
                        <button
                          type="button"
                          onClick={() => handleCopy(supplierData.mobile, "mobile")}
                          className="flex items-center gap-1 hover:text-primary transition cursor-pointer font-mono font-medium"
                        >
                          <Phone className="size-3.5" /> {supplierData.mobile}
                          {copiedKey === "mobile" ? <Check className="size-3 text-success" /> : <Copy className="size-3 text-text-muted" />}
                        </button>
                      )}
                      {supplierData.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(supplierData.email, "email")}
                          className="flex items-center gap-1 hover:text-primary transition cursor-pointer font-medium"
                        >
                          <Mail className="size-3.5" /> {supplierData.email}
                          {copiedKey === "email" ? <Check className="size-3 text-success" /> : <Copy className="size-3 text-text-muted" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <UIButton
                  variant="outline"
                  size="sm"
                  startIcon={<Edit2 className="size-3.5" />}
                  onClick={() => setCurrentMode("edit")}
                  className="shrink-0 self-start md:self-center"
                >
                  Edit Profile
                </UIButton>
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <span>Payable Debt / Opening</span>
                  <Wallet className="size-4 text-amber-500" />
                </div>
                <div className="mt-2 text-lg font-bold text-text font-mono">
                  ₹{Number(supplierData.openingBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  <span className="text-xs font-semibold ml-1.5 px-1.5 py-0.5 rounded-sm bg-surface-alt border border-border">
                    {(supplierData.openingBalanceType || "cr").toUpperCase()}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-text-muted">Net starting balance with vendor</div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <span>Settlement Grace</span>
                  <Clock className="size-4 text-blue-600" />
                </div>
                <div className="mt-2 text-lg font-bold text-text font-mono">
                  {supplierData.creditDays || 0} <span className="text-xs font-normal text-text-muted">Days</span>
                </div>
                <div className="mt-1 text-[11px] text-text-muted">Agreed bill credit settlement duration</div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <span>Drug License (DL)</span>
                  <ShieldCheck className="size-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-sm font-bold text-text font-mono truncate">
                  {supplierData.drugLicenseNumber || supplierData.dlNumber || "Not Registered"}
                </div>
                <div className="mt-1 text-[11px] text-text-muted">Authorized wholesale pharma permit</div>
              </div>
            </div>

            {/* Detailed Key Value List */}
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border pb-2.5">
                Statutory, Premises & Settlement Bank
              </h4>
              <UIKeyValueList
                items={[
                  {
                    label: "GST Identification (GSTIN)",
                    value: supplierData.gstNumber || supplierData.gstin || "Unregistered Vendor",
                    copyable: Boolean(supplierData.gstNumber || supplierData.gstin),
                  },
                  {
                    label: "PAN Number",
                    value: supplierData.panNumber || supplierData.pan || "N/A",
                    copyable: Boolean(supplierData.panNumber || supplierData.pan),
                  },
                  {
                    label: "Warehouse / Billing Address",
                    value: [
                      formData.billingAddressLine1,
                      formData.billingAddressLine2,
                      formData.billingCity,
                      formData.billingState,
                      formData.billingPincode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "No address documented",
                  },
                  {
                    label: "Settlement Bank Remittance",
                    value: formData.bankAccountNumber
                      ? `${formData.bankName || "Bank"} — A/C: ${formData.bankAccountNumber} (IFSC: ${formData.bankIfscCode || "N/A"})`
                      : "No bank details on file",
                    copyable: Boolean(formData.bankAccountNumber),
                  },
                  {
                    label: "Branch Office",
                    value: formData.bankBranchName || "Main Branch",
                  },
                  {
                    label: "Vendor Notes / Remarks",
                    value: supplierData.notes || "Standard procurement vendor terms",
                  },
                ]}
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CREATE / EDIT MODE
           ══════════════════════════════════════════════════════════════════ */}
        {!isView && (
          <form id="supplier-dialog-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Live Interactive Card Header */}
            <SupplierCardPreview
              businessName={formData.businessName}
              supplierType={formData.supplierType}
              contactPersonName={formData.contactPersonName}
              mobile={formData.mobile}
              status={formData.status}
              gstNumber={formData.gstNumber}
              bankAccountNumber={formData.bankAccountNumber}
            />

            {/* SECTION 1: Identity & Primary Representative */}
            <div className="rounded-2xl border border-border/80 bg-surface-alt/40 p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                    Vendor Business Identity
                  </h3>
                  <p className="text-xs text-text-muted">Legal enterprise entity name, distribution tier, and contact representative</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <UIInput
                    label="Business / Distributor Name"
                    placeholder="e.g. Cipla Healthcare Laboratories Ltd"
                    value={formData.businessName}
                    onChange={(e) => handleFieldChange("businessName", e.target.value)}
                    error={Boolean(formErrors.businessName)}
                    helperText={formErrors.businessName || "Legal business name printed on inward purchase bills"}
                    required
                    size="md"
                  />
                </div>

                <UISelect
                  label="Supplier Classification"
                  value={formData.supplierType}
                  onChange={(val) => handleFieldChange("supplierType", val)}
                  options={supplierTypeOptions}
                  required
                  size="md"
                />

                <UIInput
                  label="Contact Person / Representative"
                  placeholder="e.g. Ramesh Kulkarni (Sales Manager)"
                  value={formData.contactPersonName}
                  onChange={(e) => handleFieldChange("contactPersonName", e.target.value)}
                  size="md"
                />

                <UIInput
                  label="Mobile Number (Primary)"
                  placeholder="e.g. 9820123456"
                  value={formData.mobile}
                  onChange={(e) => handleFieldChange("mobile", e.target.value)}
                  error={Boolean(formErrors.mobile)}
                  helperText={formErrors.mobile || "10-digit primary phone"}
                  size="md"
                />

                <UIInput
                  label="Alternate Contact Phone"
                  placeholder="e.g. 022-26549870"
                  value={formData.alternateMobile}
                  onChange={(e) => handleFieldChange("alternateMobile", e.target.value)}
                  size="md"
                />

                <div className="sm:col-span-2">
                  <UIInput
                    label="Email Address (Purchase Orders)"
                    placeholder="orders@cipla-distributors.com"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    error={Boolean(formErrors.email)}
                    helperText={formErrors.email}
                    size="md"
                  />
                </div>

                <UISelect
                  label="Account Operational Status"
                  value={formData.status}
                  onChange={(val) => handleFieldChange("status", val)}
                  options={statusOptions}
                  size="md"
                />
              </div>
            </div>

            {/* SECTION 2: Warehouse Premises Address */}
            <div className="rounded-2xl border border-border/80 bg-surface-alt/40 p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                    Warehouse Premises & Billing Address
                  </h3>
                  <p className="text-xs text-text-muted">Registered office or regional dispatch godown address</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UIInput
                  label="Address Line 1"
                  placeholder="Godown No / Industrial Estate, Street"
                  value={formData.billingAddressLine1}
                  onChange={(e) => handleFieldChange("billingAddressLine1", e.target.value)}
                  size="md"
                />

                <UIInput
                  label="Address Line 2 (Optional)"
                  placeholder="Area, Landmark, Extension"
                  value={formData.billingAddressLine2}
                  onChange={(e) => handleFieldChange("billingAddressLine2", e.target.value)}
                  size="md"
                />

                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <UIInput
                    label="City / Hub"
                    placeholder="e.g. Ahmedabad"
                    value={formData.billingCity}
                    onChange={(e) => handleFieldChange("billingCity", e.target.value)}
                    size="md"
                  />
                  <UIInput
                    label="State"
                    placeholder="e.g. Gujarat"
                    value={formData.billingState}
                    onChange={(e) => handleFieldChange("billingState", e.target.value)}
                    size="md"
                  />
                  <UIInput
                    label="Postal Pincode"
                    placeholder="e.g. 380001"
                    value={formData.billingPincode}
                    onChange={(e) => handleFieldChange("billingPincode", e.target.value)}
                    size="md"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Statutory Compliances & Drug Licenses */}
            <div className="rounded-2xl border border-border/80 bg-surface-alt/40 p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                    Statutory & Drug Licensing Identifiers
                  </h3>
                  <p className="text-xs text-text-muted">Mandatory GSTIN, PAN, and Form 20B/21B wholesale drug license</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <UIInput
                  label="GSTIN"
                  placeholder="24AAAAA0000A1Z5"
                  value={formData.gstNumber}
                  onChange={(e) => handleFieldChange("gstNumber", e.target.value.toUpperCase())}
                  error={Boolean(formErrors.gstNumber)}
                  helperText={formErrors.gstNumber || "15-digit alphanumeric GSTIN"}
                  size="md"
                />

                <UIInput
                  label="PAN Number"
                  placeholder="ABCDE1234F"
                  value={formData.panNumber}
                  onChange={(e) => handleFieldChange("panNumber", e.target.value.toUpperCase())}
                  size="md"
                />

                <UIInput
                  label="Drug License (DL No.)"
                  placeholder="e.g. 20B/21B-GJ-1092"
                  value={formData.drugLicenseNumber}
                  onChange={(e) => handleFieldChange("drugLicenseNumber", e.target.value.toUpperCase())}
                  size="md"
                  helperText="Wholesale biological drug license"
                />
              </div>
            </div>

            {/* SECTION 4: Settlement Banking & Remittance Account */}
            <div className="rounded-2xl border border-border/80 bg-surface-alt/40 p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                  <Landmark className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                    Settlement Bank Remittance Account
                  </h3>
                  <p className="text-xs text-text-muted">Vendor bank account for RTGS / NEFT purchase bill settlements</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UIInput
                  label="Bank Name"
                  placeholder="e.g. State Bank of India / HDFC Bank"
                  value={formData.bankName}
                  onChange={(e) => handleFieldChange("bankName", e.target.value)}
                  size="md"
                />

                <UIInput
                  label="Account Number"
                  placeholder="e.g. 50200012345678"
                  value={formData.bankAccountNumber}
                  onChange={(e) => handleFieldChange("bankAccountNumber", e.target.value)}
                  size="md"
                />

                <UIInput
                  label="IFSC Code"
                  placeholder="e.g. SBIN0001234"
                  value={formData.bankIfscCode}
                  onChange={(e) => handleFieldChange("bankIfscCode", e.target.value.toUpperCase())}
                  size="md"
                />

                <UIInput
                  label="Branch Office Name"
                  placeholder="e.g. Nariman Point Branch"
                  value={formData.bankBranchName}
                  onChange={(e) => handleFieldChange("bankBranchName", e.target.value)}
                  size="md"
                />
              </div>
            </div>

            {/* SECTION 5: Credit Terms & Initial Balance */}
            <div className="rounded-2xl border border-border/80 bg-surface-alt/40 p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <Wallet className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                    Payment Terms & Opening Ledger
                  </h3>
                  <p className="text-xs text-text-muted">Standard invoice credit period and opening payable balance</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UIInput
                  type="number"
                  label="Agreed Credit Days"
                  placeholder="21"
                  value={formData.creditDays}
                  onChange={(e) => handleFieldChange("creditDays", e.target.value)}
                  size="md"
                  helperText="Days before inward bill flags for payment"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <UIInput
                    type="number"
                    label="Opening Balance (₹)"
                    placeholder="0.00"
                    value={formData.openingBalance}
                    onChange={(e) => handleFieldChange("openingBalance", e.target.value)}
                    size="md"
                  />

                  <UISelect
                    label="Balance Type"
                    value={formData.openingBalanceType}
                    onChange={(val) => handleFieldChange("openingBalanceType", val)}
                    options={balanceTypeOptions}
                    size="md"
                  />
                </div>

                <div className="sm:col-span-2">
                  <UIInput
                    label="Purchasing Notes / Settlement Remarks"
                    placeholder="e.g. 2% cash discount on 7-day payment, delivery schedule remarks..."
                    value={formData.notes}
                    onChange={(e) => handleFieldChange("notes", e.target.value)}
                    size="md"
                  />
                </div>
              </div>
            </div>
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
            startIcon={<Edit2 className="size-4" />}
            onClick={() => setCurrentMode("edit")}
          >
            Edit Supplier
          </UIButton>
        ) : (
          <UIButton
            variant="primary"
            type="submit"
            form="supplier-dialog-form"
            isLoading={isSubmitting}
            startIcon={isCreate ? <Sparkles className="size-4" /> : <Check className="size-4" />}
          >
            {isCreate ? "Create Supplier" : "Save Changes"}
          </UIButton>
        )}
      </UIModalFooter>
    </UIModal>
  );
}

export default SupplierDialog;
