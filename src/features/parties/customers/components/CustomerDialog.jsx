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
  UIDetailRow,
} from "@/components/ui";
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Building2,
  ShieldCheck,
  Copy,
  Check,
  Edit2,
  Sparkles,
  Clock,
  Wallet,
  ArrowRight,
  Hash,
} from "lucide-react";

const customerTypeOptions = [
  { label: "Retail Customer", value: "retail", description: "Walk-in OTC and consumer retail buyer" },
  { label: "Wholesale Buyer", value: "wholesale", description: "B2B bulk purchaser and local sub-dealers" },
  { label: "Hospital / Institution", value: "hospital", description: "Medical center, nursing home, or emergency room" },
  { label: "Doctor / Clinic", value: "clinic", description: "Practitioner and local clinic facility" },
  { label: "Corporate Account", value: "corporate", description: "Corporate staff healthcare partner" },
  { label: "Other Segment", value: "other", description: "Miscellaneous party accounts" },
];

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Blocked", value: "blocked" },
];

const balanceTypeOptions = [
  { label: "Debit (Dr - Customer owes pharmacy)", value: "dr" },
  { label: "Credit (Cr - Advance credit held)", value: "cr" },
];

const INITIAL_FORM = {
  name: "",
  customerType: "retail",
  mobile: "",
  alternateMobile: "",
  email: "",
  status: "active",

  billingAddressLine1: "",
  billingAddressLine2: "",
  billingCity: "",
  billingState: "",
  billingPincode: "",

  creditLimit: 0,
  creditDays: 0,
  openingBalance: 0,
  openingBalanceType: "dr",

  gstNumber: "",
  panNumber: "",
  drugLicenseNumber: "",
  notes: "",
};

// Mini Interactive Live Preview Card for Create/Edit
function CustomerCardPreview({ name, customerType, mobile, email, status, gstNumber, creditLimit }) {
  const initials = (name || "Customer")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const typeLabel = customerTypeOptions.find((t) => t.value === customerType)?.label || "Retail";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-linear-to-br from-emerald-500/5 via-surface to-surface p-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="size-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            {initials || "C"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-base text-text truncate max-w-[220px] sm:max-w-[320px]">
                {name || "Customer Full Name"}
              </h4>
              <UIBadge variant={status === "active" ? "success" : status === "blocked" ? "danger" : "neutral"} size="sm">
                {(status || "active").toUpperCase()}
              </UIBadge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
              <span className="font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                {typeLabel}
              </span>
              {mobile && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="size-3 text-text-muted" /> {mobile}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:text-right shrink-0">
          <div>
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Credit Cap</div>
            <div className="text-sm font-bold text-text font-mono">
              ₹{Number(creditLimit || 0).toLocaleString("en-IN")}
            </div>
          </div>
          {gstNumber && (
            <div className="hidden sm:block pl-3 border-l border-border">
              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">GSTIN</div>
              <div className="text-xs font-bold text-text font-mono truncate max-w-[120px]">{gstNumber}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CustomerDialog({
  isOpen,
  onClose,
  mode = "create",
  customerData = null,
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
      if ((currentMode === "edit" || currentMode === "view") && customerData) {
        const bAddr = customerData.billingAddress || {};
        setFormData({
          name: customerData.name || customerData.customerName || "",
          customerType: customerData.customerType || "retail",
          mobile: customerData.mobile || customerData.phone || "",
          alternateMobile: customerData.alternateMobile || "",
          email: customerData.email || "",
          status: customerData.status || "active",

          billingAddressLine1: bAddr.addressLine1 || customerData.address || "",
          billingAddressLine2: bAddr.addressLine2 || "",
          billingCity: bAddr.city || customerData.city || "",
          billingState: bAddr.state || customerData.state || "",
          billingPincode: bAddr.pincode || customerData.pincode || "",

          creditLimit: customerData.creditLimit || 0,
          creditDays: customerData.creditDays || 0,
          openingBalance: customerData.openingBalance || 0,
          openingBalanceType: customerData.openingBalanceType || "dr",

          gstNumber: customerData.gstNumber || customerData.gstin || "",
          panNumber: customerData.panNumber || customerData.pan || "",
          drugLicenseNumber: customerData.drugLicenseNumber || "",
          notes: customerData.notes || "",
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
  }, [isOpen, currentMode, customerData]);

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
    if (!formData.name.trim()) {
      errors.name = "Customer name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Customer name must be at least 2 characters";
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
      name: formData.name.trim(),
      customerType: formData.customerType || "retail",
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

      creditLimit: Number(formData.creditLimit) || 0,
      creditDays: Number(formData.creditDays) || 0,
      openingBalance: Number(formData.openingBalance) || 0,
      openingBalanceType: formData.openingBalanceType || "dr",

      gstNumber: formData.gstNumber.trim().toUpperCase() || null,
      panNumber: formData.panNumber.trim().toUpperCase() || null,
      drugLicenseNumber: formData.drugLicenseNumber.trim().toUpperCase() || null,
      notes: formData.notes.trim() || null,
    };

    try {
      if (currentMode === "create") {
        await onSubmitCreate?.(payload);
      } else if (currentMode === "edit" && customerData?._id) {
        await onSubmitUpdate?.(customerData._id, payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setServerError(typeof err === "string" ? err : err?.message || "Failed to save customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isView = currentMode === "view";
  const isEdit = currentMode === "edit";
  const isCreate = currentMode === "create";

  const title = isCreate
    ? "Add Customer"
    : isEdit
    ? "Edit Customer"
    : "Customer Profile";

  const subtitle = isCreate
    ? "Add a new customer profile for prescription billing and ledger management."
    : isEdit
    ? "Update customer identity, credit privileges, or address parameters."
    : "Comprehensive view of customer identity, statutory tax details, and credit standing.";

  const customerInitials = (customerData?.name || customerData?.customerName || "Customer")
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
            {isCreate ? "NEW RECORD" : isEdit ? "EDITING" : "VERIFIED"}
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
        {isView && customerData && (
          <div className="space-y-6">
            {/* Top Customer Hero Card */}
            <div className="rounded-2xl border border-border/80 bg-linear-to-br from-emerald-500/10 via-surface to-surface-alt/40 p-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="size-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shrink-0">
                    {customerInitials || "C"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-xl font-bold text-text truncate">
                        {customerData.name || customerData.customerName || "Unnamed Customer"}
                      </h3>
                      {customerData.customerCode && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-surface border border-border px-2 py-0.5 text-xs font-mono font-semibold text-text-muted">
                          <Hash className="size-3" /> {customerData.customerCode}
                        </span>
                      )}
                      <UIBadge
                        variant={customerData.status === "active" ? "success" : customerData.status === "blocked" ? "danger" : "neutral"}
                      >
                        {(customerData.status || "active").toUpperCase()}
                      </UIBadge>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-text-muted flex-wrap">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full">
                        {(customerData.customerType || "retail").toUpperCase()}
                      </span>
                      {customerData.mobile && (
                        <button
                          type="button"
                          onClick={() => handleCopy(customerData.mobile, "mobile")}
                          className="flex items-center gap-1 hover:text-primary transition cursor-pointer font-mono font-medium"
                        >
                          <Phone className="size-3.5" /> {customerData.mobile}
                          {copiedKey === "mobile" ? <Check className="size-3 text-success" /> : <Copy className="size-3 text-text-muted" />}
                        </button>
                      )}
                      {customerData.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(customerData.email, "email")}
                          className="flex items-center gap-1 hover:text-primary transition cursor-pointer font-medium"
                        >
                          <Mail className="size-3.5" /> {customerData.email}
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
                  <span>Credit Limit</span>
                  <CreditCard className="size-4 text-emerald-600" />
                </div>
                <div className="mt-2 text-lg font-bold text-text font-mono">
                  ₹{Number(customerData.creditLimit || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <div className="mt-1 text-[11px] text-text-muted">Maximum authorized ledger debt</div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <span>Opening Balance</span>
                  <Wallet className="size-4 text-info" />
                </div>
                <div className="mt-2 text-lg font-bold text-text font-mono">
                  ₹{Number(customerData.openingBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  <span className="text-xs font-semibold ml-1.5 px-1.5 py-0.5 rounded-sm bg-surface-alt border border-border">
                    {(customerData.openingBalanceType || "dr").toUpperCase()}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-text-muted">Initial migrated baseline</div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold text-text-muted uppercase tracking-wider">
                  <span>Credit Period</span>
                  <Clock className="size-4 text-amber-500" />
                </div>
                <div className="mt-2 text-lg font-bold text-text font-mono">
                  {customerData.creditDays || 0} <span className="text-xs font-normal text-text-muted">Days</span>
                </div>
                <div className="mt-1 text-[11px] text-text-muted">Standard invoice maturity term</div>
              </div>
            </div>

            {/* Detailed Key Value List */}
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border pb-2.5">
                Statutory & Location Profile
              </h4>
              <UIKeyValueList
                items={[
                  {
                    label: "GST Identification (GSTIN)",
                    value: customerData.gstNumber || customerData.gstin || "Unregistered Consumer",
                    copyable: Boolean(customerData.gstNumber || customerData.gstin),
                  },
                  {
                    label: "PAN Number",
                    value: customerData.panNumber || customerData.pan || "N/A",
                    copyable: Boolean(customerData.panNumber || customerData.pan),
                  },
                  {
                    label: "Drug License Number",
                    value: customerData.drugLicenseNumber || "N/A",
                    copyable: Boolean(customerData.drugLicenseNumber),
                  },
                  {
                    label: "Billing Address",
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
                    label: "Alternate Contact",
                    value: customerData.alternateMobile || "None",
                  },
                  {
                    label: "Account Remarks",
                    value: customerData.notes || "No special instructions provided",
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
          <form id="customer-dialog-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Live Interactive Card Header */}
            <CustomerCardPreview
              name={formData.name}
              customerType={formData.customerType}
              mobile={formData.mobile}
              email={formData.email}
              status={formData.status}
              gstNumber={formData.gstNumber}
              creditLimit={formData.creditLimit}
            />

            {/* SECTION 1: Identity & Primary Contact */}
            <div className="rounded-2xl border border-border/80 bg-surface-alt/40 p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <User className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                    Customer Identity & Contact
                  </h3>
                  <p className="text-xs text-text-muted">Primary name, segmentation class, and active contact numbers</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <UIInput
                    label="Customer Full Name"
                    placeholder="e.g. Dr. Rajesh Sharma / Apollo Hospital"
                    value={formData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    error={Boolean(formErrors.name)}
                    helperText={formErrors.name || "Legal name shown on retail cash receipts and GST tax invoices"}
                    required
                    size="md"
                  />
                </div>

                <UISelect
                  label="Customer Type"
                  value={formData.customerType}
                  onChange={(val) => handleFieldChange("customerType", val)}
                  options={customerTypeOptions}
                  required
                  size="md"
                />

                <UIInput
                  label="Mobile Number (Primary)"
                  placeholder="e.g. 9876543210"
                  value={formData.mobile}
                  onChange={(e) => handleFieldChange("mobile", e.target.value)}
                  error={Boolean(formErrors.mobile)}
                  helperText={formErrors.mobile || "10-digit mobile for instant SMS billing & receipts"}
                  size="md"
                />

                <UIInput
                  label="Alternate Phone (Optional)"
                  placeholder="e.g. 022-28765432"
                  value={formData.alternateMobile}
                  onChange={(e) => handleFieldChange("alternateMobile", e.target.value)}
                  size="md"
                />

                <UIInput
                  label="Email Address (Optional)"
                  placeholder="rajesh.clinic@gmail.com"
                  value={formData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  error={Boolean(formErrors.email)}
                  helperText={formErrors.email}
                  size="md"
                />

                <div className="sm:col-span-3">
                  <UISelect
                    label="Operational Status"
                    value={formData.status}
                    onChange={(val) => handleFieldChange("status", val)}
                    options={statusOptions}
                    size="md"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Billing & Delivery Address */}
            <div className="rounded-2xl border border-border/80 bg-surface-alt/40 p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                    Premises & Delivery Address
                  </h3>
                  <p className="text-xs text-text-muted">Dispatch location and address registered for tax invoicing</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UIInput
                  label="Address Line 1"
                  placeholder="Flat/Shop No, Building Name, Street"
                  value={formData.billingAddressLine1}
                  onChange={(e) => handleFieldChange("billingAddressLine1", e.target.value)}
                  size="md"
                />

                <UIInput
                  label="Address Line 2 (Optional)"
                  placeholder="Landmark, Area, Extension"
                  value={formData.billingAddressLine2}
                  onChange={(e) => handleFieldChange("billingAddressLine2", e.target.value)}
                  size="md"
                />

                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <UIInput
                    label="City / District"
                    placeholder="e.g. Mumbai"
                    value={formData.billingCity}
                    onChange={(e) => handleFieldChange("billingCity", e.target.value)}
                    size="md"
                  />
                  <UIInput
                    label="State"
                    placeholder="e.g. Maharashtra"
                    value={formData.billingState}
                    onChange={(e) => handleFieldChange("billingState", e.target.value)}
                    size="md"
                  />
                  <UIInput
                    label="Postal Pincode"
                    placeholder="e.g. 400001"
                    value={formData.billingPincode}
                    onChange={(e) => handleFieldChange("billingPincode", e.target.value)}
                    size="md"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: GST, PAN & Statutory Compliances */}
            <div className="rounded-2xl border border-border/80 bg-surface-alt/40 p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                    Statutory & Tax Compliance
                  </h3>
                  <p className="text-xs text-text-muted">GSTIN, PAN number, and medical drug retail licenses</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <UIInput
                  label="GSTIN (Optional for Retail)"
                  placeholder="27AAAAA0000A1Z5"
                  value={formData.gstNumber}
                  onChange={(e) => handleFieldChange("gstNumber", e.target.value.toUpperCase())}
                  error={Boolean(formErrors.gstNumber)}
                  helperText={formErrors.gstNumber || "15-digit alphanumeric GST identifier"}
                  size="md"
                />

                <UIInput
                  label="PAN Number (Optional)"
                  placeholder="ABCDE1234F"
                  value={formData.panNumber}
                  onChange={(e) => handleFieldChange("panNumber", e.target.value.toUpperCase())}
                  size="md"
                />

                <UIInput
                  label="Drug License (DL No.)"
                  placeholder="e.g. DL-20B-12345"
                  value={formData.drugLicenseNumber}
                  onChange={(e) => handleFieldChange("drugLicenseNumber", e.target.value.toUpperCase())}
                  size="md"
                />
              </div>
            </div>

            {/* SECTION 4: Credit Facility & Initial Ledger Balance */}
            <div className="rounded-2xl border border-border/80 bg-surface-alt/40 p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3 pb-3 border-b border-border/80">
                <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <Wallet className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                    Credit Limits & Opening Ledger
                  </h3>
                  <p className="text-xs text-text-muted">Allowed credit threshold, payment grace days, and opening balance</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UIInput
                  type="number"
                  label="Credit Limit Amount (₹)"
                  placeholder="0.00"
                  value={formData.creditLimit}
                  onChange={(e) => handleFieldChange("creditLimit", e.target.value)}
                  size="md"
                  helperText="Maximum allowed outstanding bill balance"
                />

                <UIInput
                  type="number"
                  label="Credit Grace Period (Days)"
                  placeholder="30"
                  value={formData.creditDays}
                  onChange={(e) => handleFieldChange("creditDays", e.target.value)}
                  size="md"
                  helperText="Days before unpaid invoice flags as overdue"
                />

                <UIInput
                  type="number"
                  label="Opening Balance (₹)"
                  placeholder="0.00"
                  value={formData.openingBalance}
                  onChange={(e) => handleFieldChange("openingBalance", e.target.value)}
                  size="md"
                />

                <UISelect
                  label="Opening Balance Type"
                  value={formData.openingBalanceType}
                  onChange={(val) => handleFieldChange("openingBalanceType", val)}
                  options={balanceTypeOptions}
                  size="md"
                />

                <div className="sm:col-span-2">
                  <UIInput
                    label="Special Notes / Instructions"
                    placeholder="e.g. Deliver only after 5 PM, cash discount agreement..."
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
            Edit Customer
          </UIButton>
        ) : (
          <UIButton
            variant="primary"
            type="submit"
            form="customer-dialog-form"
            isLoading={isSubmitting}
            startIcon={isCreate ? <Sparkles className="size-4" /> : <Check className="size-4" />}
          >
            {isCreate ? "Create Customer" : "Save Changes"}
          </UIButton>
        )}
      </UIModalFooter>
    </UIModal>
  );
}

export default CustomerDialog;
