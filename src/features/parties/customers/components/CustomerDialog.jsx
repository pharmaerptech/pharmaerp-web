import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  PlusCircle,
  CheckCircle2,
  Receipt,
  AlertTriangle,
  Users,
  Loader2,
  X,
  Plus,
  Trash2,
  Search,
  Store,
} from "lucide-react";
import customerService from "../services/customerService";

const RELATION_OPTIONS = [
  "Father",
  "Mother",
  "Spouse",
  "Brother",
  "Sister",
  "Son",
  "Daughter",
  "Other",
];

const customerTypeOptions = [
  { label: "Walk-in Customer", value: "walk_in", description: "Default counter walk-in retail sales" },
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
  onReceiveAdvance,
  onSettleCredit,
  onViewCreditNotes,
  onViewTransactions,
  onStatementLedger,
}) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Profile tabs: "overview" | "relations"
  const [activeProfileTab, setActiveProfileTab] = useState("overview");

  // Shared Contact Group relationship controls state
  const [membersList, setMembersList] = useState([]);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [selectedRelation, setSelectedRelation] = useState("Other");
  const [isUpdatingRelation, setIsUpdatingRelation] = useState(false);
  const [relationFeedback, setRelationFeedback] = useState(null);

  // Add Relation modal state
  const [isAddRelationOpen, setIsAddRelationOpen] = useState(false);
  const [addMode, setAddMode] = useState("existing"); // "existing" | "new"
  const [targetCustomerId, setTargetCustomerId] = useState("");
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newGender, setNewGender] = useState("");
  const [newRelation, setNewRelation] = useState("Spouse");
  const [newNotes, setNewNotes] = useState("");
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [addError, setAddError] = useState(null);

  // Delete Relation confirmation state
  const [deletingMember, setDeletingMember] = useState(null);
  const [isDeletingRelation, setIsDeletingRelation] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Active customer state & auto-fetch fresh details
  const [currentCustomer, setCurrentCustomer] = useState(customerData);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const lastLoadedCustIdRef = useRef(null);

  useEffect(() => {
    setCurrentCustomer(customerData);
  }, [customerData]);

  const activeCustomer = currentCustomer || customerData;
  const isWalkInCustomer = Boolean(
    activeCustomer?.isWalkIn ||
    activeCustomer?.customerType === "walk_in" ||
    formData.customerType === "walk_in"
  );

  const populateFormFromCustomer = useCallback((cust) => {
    if (!cust) return;
    const bAddr = cust.billingAddress || {};
    setFormData({
      name: cust.name || cust.customerName || "",
      customerType: cust.customerType || "retail",
      mobile: cust.mobile || cust.phone || "",
      alternateMobile: cust.alternateMobile || "",
      email: cust.email || "",
      status: cust.status || "active",

      billingAddressLine1: bAddr.addressLine1 || cust.address || "",
      billingAddressLine2: bAddr.addressLine2 || "",
      billingCity: bAddr.city || cust.city || "",
      billingState: bAddr.state || cust.state || "",
      billingPincode: bAddr.pincode || cust.pincode || "",

      creditLimit: cust.creditLimit || 0,
      creditDays: cust.creditDays || 0,
      openingBalance: cust.openingBalance || 0,
      openingBalanceType: cust.openingBalanceType || "dr",

      gstNumber: cust.gstNumber || cust.gstin || "",
      panNumber: cust.panNumber || cust.pan || "",
      drugLicenseNumber: cust.drugLicenseNumber || "",
      notes: cust.notes || "",
    });
  }, []);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode, isOpen]);

  // Fetch complete customer profile & relationships from API whenever opened in view/edit mode
  useEffect(() => {
    if (!isOpen) {
      setIsLoadingDetails(false);
      lastLoadedCustIdRef.current = null;
      return;
    }

    const custId = (customerData?._id || customerData?.id)?.toString();
    if (custId && (currentMode === "view" || currentMode === "edit")) {
      let isMounted = true;
      setIsLoadingDetails(true);

      customerService
        .getCustomerById(custId)
        .then((res) => {
          if (!isMounted) return;
          const fullCust = res.data?.data || res.data;
          if (fullCust) {
            setCurrentCustomer(fullCust);
            const rawMembers = fullCust.members || fullCust.sharedContactGroup?.members || [];
            setMembersList(rawMembers);
            // Only populate form if in view mode or not yet populated for this customer
            if (currentMode === "view" || lastLoadedCustIdRef.current !== custId) {
              populateFormFromCustomer(fullCust);
              lastLoadedCustIdRef.current = custId;
            }
          }
        })
        .catch((err) => {
          console.warn("CustomerDialog: Failed to fetch customer details:", err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingDetails(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, currentMode, customerData?._id, customerData?.id, populateFormFromCustomer]);

  useEffect(() => {
    if (isOpen) {
      if ((currentMode === "edit" || currentMode === "view") && activeCustomer) {
        if (currentMode === "view") {
          setActiveProfileTab("overview");
        }
        const rawMembers = activeCustomer.members || activeCustomer.sharedContactGroup?.members || [];
        setMembersList(rawMembers);
        setEditingMemberId(null);
        setRelationFeedback(null);
        setIsAddRelationOpen(false);
        setDeletingMember(null);

        const custId = (activeCustomer._id || activeCustomer.id)?.toString();
        if (lastLoadedCustIdRef.current !== custId) {
          populateFormFromCustomer(activeCustomer);
          lastLoadedCustIdRef.current = custId;
        }
      } else if (currentMode === "create") {
        setFormData(INITIAL_FORM);
        setMembersList([]);
        setEditingMemberId(null);
        setRelationFeedback(null);
        setIsAddRelationOpen(false);
        setDeletingMember(null);
        lastLoadedCustIdRef.current = null;
      }
      setFormErrors({});
      setServerError(null);
    } else {
      setFormData(INITIAL_FORM);
      setFormErrors({});
      setServerError(null);
      setMembersList([]);
      setEditingMemberId(null);
      setRelationFeedback(null);
      setIsAddRelationOpen(false);
      setDeletingMember(null);
      lastLoadedCustIdRef.current = null;
    }
  }, [isOpen, currentMode, activeCustomer, populateFormFromCustomer]);

  // Helper to re-fetch customer relations and update membersList
  const refreshCustomerRelations = async () => {
    const custId = (activeCustomer?._id || activeCustomer?.id || customerData?._id || customerData?.id)?.toString();
    if (!custId) return null;
    try {
      const res = await customerService.getCustomerById(custId);
      const updated = res.data?.data || res.data;
      if (updated) {
        setCurrentCustomer(updated);
        const rawMembers = updated.members || updated.sharedContactGroup?.members || [];
        setMembersList(rawMembers);
        return updated;
      }
    } catch (err) {
      console.warn("Could not reload customer relations:", err);
    }
    return null;
  };

  // Debounced search for existing customers to link
  useEffect(() => {
    if (!isAddRelationOpen || addMode !== "existing") return;
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await customerService.getCustomers({
          search: searchQuery.trim(),
          limit: 8,
        });
        const list =
          res.data?.data?.customers ||
          res.data?.customers ||
          res.data?.data ||
          [];
        const currentCustId = (activeCustomer?._id || activeCustomer?.id || customerData?._id || customerData?.id)?.toString();
        const linkedIds = new Set(
          membersList
            .map((m) => {
              const memObj = m.customerId && typeof m.customerId === "object" ? m.customerId : null;
              return (memObj?._id || m.customerId)?._id || (memObj?._id || m.customerId);
            })
            .filter(Boolean)
            .map((id) => id.toString())
        );
        if (currentCustId) linkedIds.add(currentCustId);

        const filtered = list.filter((c) => {
          const cId = (c._id || c.id)?.toString();
          return cId && !linkedIds.has(cId);
        });
        setSearchResults(filtered);
      } catch (err) {
        console.error("Search customers error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isAddRelationOpen, addMode, activeCustomer, customerData, membersList]);

  const handleUpdateRelationship = async (targetMember, relation) => {
    const custId = activeCustomer?._id || activeCustomer?.id || customerData?._id || customerData?.id;
    if (!custId) return;
    const targetId = targetMember.customerId?._id || targetMember.customerId;
    if (!targetId) return;

    setIsUpdatingRelation(true);
    setRelationFeedback(null);

    try {
      await customerService.updateRelationship(custId, targetId, {
        relationship: relation,
        confirmationStatus: "confirmed",
      });

      setMembersList((prev) =>
        prev.map((m) => {
          const mId = (m.customerId?._id || m.customerId)?.toString();
          if (mId === targetId.toString()) {
            return {
              ...m,
              relation,
              confirmationStatus: "confirmed",
            };
          }
          return m;
        })
      );

      setEditingMemberId(null);
      setRelationFeedback({
        type: "success",
        text: `Relationship with ${targetMember.name || "member"} confirmed as "${relation}".`,
      });
      const refreshed = await refreshCustomerRelations();
      if (onSuccess) onSuccess(refreshed || activeCustomer);
    } catch (err) {
      setRelationFeedback({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to update relationship",
      });
    } finally {
      setIsUpdatingRelation(false);
    }
  };

  const handleAddRelationship = async (e) => {
    if (e) e.preventDefault();
    const custId = activeCustomer?._id || activeCustomer?.id || customerData?._id || customerData?.id;
    if (!custId) return;

    setIsAddingRelation(true);
    setAddError(null);

    try {
      let payload = {
        relationship: newRelation || "Other",
        confirmationStatus: "confirmed",
        notes: newNotes.trim() || null,
      };

      if (addMode === "existing") {
        if (!targetCustomerId) {
          setAddError("Please select a customer to link.");
          setIsAddingRelation(false);
          return;
        }
        payload.targetCustomerId = targetCustomerId;
      } else {
        if (!newName.trim()) {
          setAddError("Customer name is required.");
          setIsAddingRelation(false);
          return;
        }
        payload.name = newName.trim();
        payload.mobile = newMobile.trim() || null;
        payload.gender = newGender || null;
      }

      await customerService.addRelationship(custId, payload);
      const refreshed = await refreshCustomerRelations();
      setIsAddRelationOpen(false);
      setRelationFeedback({
        type: "success",
        text: `Relationship added and confirmed.`,
      });
      if (onSuccess) onSuccess(refreshed || activeCustomer);
    } catch (err) {
      setAddError(
        err.response?.data?.message || err.message || "Failed to add relationship"
      );
    } finally {
      setIsAddingRelation(false);
    }
  };

  const handleConfirmDeleteRelationship = async () => {
    const custId = activeCustomer?._id || activeCustomer?.id || customerData?._id || customerData?.id;
    if (!custId) return;
    if (!deletingMember) return;
    const targetId =
      deletingMember.customerId?._id ||
      deletingMember.customerId ||
      deletingMember._id;

    if (!targetId) return;

    setIsDeletingRelation(true);
    setDeleteError(null);

    try {
      await customerService.deleteRelationship(custId, targetId);
      const refreshed = await refreshCustomerRelations();
      setDeletingMember(null);
      setRelationFeedback({
        type: "success",
        text: `Relationship with ${
          deletingMember.name || deletingMember.customerId?.name || "member"
        } unlinked successfully.`,
      });
      if (onSuccess) onSuccess(refreshed || activeCustomer);
    } catch (err) {
      setDeleteError(
        err.response?.data?.message || err.message || "Failed to remove relationship"
      );
    } finally {
      setIsDeletingRelation(false);
    }
  };

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

    const cleanMobile = formData.mobile
      ? formData.mobile.replace(/[\s\-()]/g, "").replace(/^(\+91|91|0)/, "")
      : "";

    if (cleanMobile && !/^[6-9][0-9]{9}$/.test(cleanMobile)) {
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

    const cleanMobile = formData.mobile
      ? formData.mobile.replace(/[\s\-()]/g, "").replace(/^(\+91|91|0)/, "")
      : "";

    const payload = {
      name: formData.name.trim(),
      customerType: formData.customerType || "retail",
      mobile: cleanMobile || null,
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
      let savedCustomer = null;
      if (currentMode === "create") {
        if (onSubmitCreate) {
          const res = await onSubmitCreate(payload);
          savedCustomer = res;
        } else {
          const res = await customerService.createCustomer(payload);
          savedCustomer = res.data?.data || res.data;
        }
        onSuccess?.(savedCustomer);
        onClose();
      } else if (currentMode === "edit") {
        const targetCustId = (activeCustomer?._id || activeCustomer?.id || customerData?._id || customerData?.id)?.toString();
        if (!targetCustId) {
          throw new Error("Customer ID not found for update");
        }

        if (onSubmitUpdate) {
          const res = await onSubmitUpdate(targetCustId, payload);
          savedCustomer = res;
        } else {
          const res = await customerService.updateCustomer(targetCustId, payload);
          savedCustomer = res.data?.data || res.data;
        }

        // Fetch fresh populated customer data from backend
        try {
          const freshRes = await customerService.getCustomerById(targetCustId);
          const freshCust = freshRes.data?.data || freshRes.data;
          if (freshCust) {
            savedCustomer = freshCust;
          }
        } catch {
          savedCustomer = savedCustomer || { ...activeCustomer, ...payload, _id: targetCustId };
        }

        setCurrentCustomer(savedCustomer);
        populateFormFromCustomer(savedCustomer);
        setCurrentMode("view");
        onSuccess?.(savedCustomer);
      }
    } catch (err) {
      setServerError(typeof err === "string" ? err : err?.response?.data?.message || err?.message || "Failed to save customer.");
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

  const customerInitials = (activeCustomer?.name || activeCustomer?.customerName || "Customer")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <>
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
          {isLoadingDetails && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-text-muted animate-pulse ml-1">
              <Loader2 className="size-3 animate-spin text-primary" /> Updating...
            </span>
          )}
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
        {isView && activeCustomer && (
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
                        {activeCustomer.name || activeCustomer.customerName || "Unnamed Customer"}
                      </h3>
                      {activeCustomer.customerCode && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-surface border border-border px-2 py-0.5 text-xs font-mono font-semibold text-text-muted">
                          <Hash className="size-3" /> {activeCustomer.customerCode}
                        </span>
                      )}
                      <UIBadge
                        variant={activeCustomer.status === "active" ? "success" : activeCustomer.status === "blocked" ? "danger" : "neutral"}
                      >
                        {(activeCustomer.status || "active").toUpperCase()}
                      </UIBadge>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-text-muted flex-wrap">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full">
                        {(activeCustomer.customerType || "retail").toUpperCase()}
                      </span>
                      {activeCustomer.mobile && (
                        <button
                          type="button"
                          onClick={() => handleCopy(activeCustomer.mobile, "mobile")}
                          className="flex items-center gap-1 hover:text-primary transition cursor-pointer font-mono font-medium"
                        >
                          <Phone className="size-3.5" /> {activeCustomer.mobile}
                          {copiedKey === "mobile" ? <Check className="size-3 text-success" /> : <Copy className="size-3 text-text-muted" />}
                        </button>
                      )}
                      {activeCustomer.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(activeCustomer.email, "email")}
                          className="flex items-center gap-1 hover:text-primary transition cursor-pointer font-medium"
                        >
                          <Mail className="size-3.5" /> {activeCustomer.email}
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
                  onClick={() => {
                    populateFormFromCustomer(activeCustomer);
                    setCurrentMode("edit");
                  }}
                  className="shrink-0 self-start md:self-center"
                >
                  Edit Profile
                </UIButton>
              </div>
            </div>

            {/* Profile Tabs Navigation */}
            <div className="flex items-center gap-1 border-b border-border">
              <button
                type="button"
                onClick={() => setActiveProfileTab("overview")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition border-b-2 cursor-pointer ${
                  activeProfileTab === "overview"
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-text hover:border-border"
                }`}
              >
                <FileText className="size-3.5" />
                Overview & Financials
              </button>
              <button
                type="button"
                onClick={() => setActiveProfileTab("relations")}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition border-b-2 cursor-pointer ${
                  activeProfileTab === "relations"
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-text hover:border-border"
                }`}
              >
                <Users className="size-3.5" />
                Relations
                {membersList.length > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      activeProfileTab === "relations"
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-alt text-text-muted"
                    }`}
                  >
                    {membersList.length}
                  </span>
                )}
              </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                TAB 1: OVERVIEW & FINANCIALS
               ══════════════════════════════════════════════════════════════ */}
            {activeProfileTab === "overview" && (
              <div className="space-y-6">
                {isWalkInCustomer && (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
                    <Store className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <span className="font-bold">System Default Walk-in Customer:</span> Used for quick counter sales and anonymous POS transactions. Credit limit, advance balances, and store credit notes are permanently disabled for this profile.
                    </div>
                  </div>
                )}
                {/* 4 Financial & Credit Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                      <span>Credit Outstanding</span>
                      <CreditCard className="size-4 text-red-500" />
                    </div>
                    <div className="mt-1.5 text-base font-bold text-red-600 dark:text-red-400 font-mono">
                      ₹{Number(activeCustomer.creditOutstanding || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    {activeCustomer.overdueCount > 0 ? (
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="size-3" /> {activeCustomer.overdueCount} Overdue Bills
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-text-muted">No overdue credit</div>
                    )}
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                      <span>Advance Held</span>
                      <Wallet className="size-4 text-emerald-600" />
                    </div>
                    <div className="mt-1.5 text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      ₹{Number(activeCustomer.advanceBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-1 text-[11px] text-text-muted">Prepaid deposit balance</div>
                  </div>

                  <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                      <span>Credit Limit</span>
                      <ShieldCheck className="size-4 text-emerald-600" />
                    </div>
                    <div className="mt-1.5 text-base font-bold text-text font-mono">
                      ₹{Number(activeCustomer.creditLimit || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-1 text-[11px] text-text-muted font-mono">
                      Avail: ₹{Number(activeCustomer.availableCredit !== undefined ? activeCustomer.availableCredit : Math.max(0, (activeCustomer.creditLimit || 0) - (activeCustomer.creditOutstanding || 0))).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                      <span>Credit Period</span>
                      <Clock className="size-4 text-amber-500" />
                    </div>
                    <div className="mt-1.5 text-base font-bold text-text font-mono">
                      {activeCustomer.creditDays || 0} <span className="text-xs font-normal text-text-muted">Days</span>
                    </div>
                    <div className="mt-1 text-[11px] text-text-muted">Invoice maturity window</div>
                  </div>

                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                      <span>Credit Note Balance</span>
                      <Receipt className="size-4 text-indigo-600" />
                    </div>
                    <div className="mt-1.5 text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      ₹{Number(activeCustomer.creditNoteBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-text-muted">Return vouchers</span>
                      {Number(activeCustomer.creditNoteBalance || 0) > 0 ? (
                        <button
                          type="button"
                          onClick={() => onViewCreditNotes && onViewCreditNotes(activeCustomer)}
                          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          View Notes →
                        </button>
                      ) : (
                        <span className="text-text-muted/60 font-mono">0 Notes</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Quick Actions Toolbar */}
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-surface-alt/40 flex-wrap">
                  <div className="text-xs font-semibold text-text-muted">Financial Workflows:</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isWalkInCustomer && (
                      <>
                        <UIButton
                          variant="outline"
                          size="sm"
                          startIcon={<PlusCircle className="size-3.5 text-emerald-600" />}
                          onClick={() => onReceiveAdvance && onReceiveAdvance(activeCustomer)}
                        >
                          Receive Advance
                        </UIButton>
                        <UIButton
                          variant="outline"
                          size="sm"
                          startIcon={<CheckCircle2 className="size-3.5 text-blue-600" />}
                          onClick={() => onSettleCredit && onSettleCredit(activeCustomer)}
                        >
                          Settle Credit
                        </UIButton>
                        <UIButton
                          variant="outline"
                          size="sm"
                          startIcon={<Receipt className="size-3.5 text-indigo-600" />}
                          onClick={() => onViewCreditNotes && onViewCreditNotes(activeCustomer)}
                        >
                          Credit Notes
                          {Number(activeCustomer.creditNoteBalance || 0) > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                              ₹{Number(activeCustomer.creditNoteBalance || 0).toFixed(0)}
                            </span>
                          )}
                        </UIButton>
                      </>
                    )}
                    <UIButton
                      variant="outline"
                      size="sm"
                      startIcon={<Receipt className="size-3.5 text-purple-600" />}
                      onClick={() => {
                        const handler = onStatementLedger || onViewTransactions;
                        if (handler) handler(activeCustomer);
                      }}
                    >
                      Statement Ledger
                    </UIButton>
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
                        value: activeCustomer.gstNumber || activeCustomer.gstin || "Unregistered Consumer",
                        copyable: Boolean(activeCustomer.gstNumber || activeCustomer.gstin),
                      },
                      {
                        label: "PAN Number",
                        value: activeCustomer.panNumber || activeCustomer.pan || "N/A",
                        copyable: Boolean(activeCustomer.panNumber || activeCustomer.pan),
                      },
                      {
                        label: "Drug License Number",
                        value: activeCustomer.drugLicenseNumber || "N/A",
                        copyable: Boolean(activeCustomer.drugLicenseNumber),
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
                        value: activeCustomer.alternateMobile || "None",
                      },
                      {
                        label: "Account Remarks",
                        value: activeCustomer.notes || "No special instructions provided",
                      },
                    ]}
                  />
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB 2: RELATIONS & SHARED CONTACT NETWORK
               ══════════════════════════════════════════════════════════════ */}
            {activeProfileTab === "relations" && (
              <div className="rounded-2xl border border-purple-500/20 bg-linear-to-br from-purple-500/5 via-surface to-surface p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/15 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-purple-600 dark:text-purple-400" />
                      <h4 className="text-sm font-bold text-text">
                        Family & Contact Network
                      </h4>
                      {membersList.length > 0 && (
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full font-mono">
                          {membersList.length} {membersList.length === 1 ? "Member" : "Members"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      Manage linked family members and contacts who share this phone number or household account.
                    </p>
                  </div>

                  <UIButton
                    type="button"
                    size="sm"
                    variant="primary"
                    startIcon={<Plus className="size-3.5" />}
                    onClick={() => {
                      setAddMode("existing");
                      setTargetCustomerId("");
                      setSelectedCustomerObj(null);
                      setSearchQuery("");
                      setSearchResults([]);
                      setNewName("");
                      setNewMobile(activeCustomer?.mobile || "");
                      setNewGender("");
                      setNewRelation("Spouse");
                      setNewNotes("");
                      setAddError(null);
                      setIsAddRelationOpen(true);
                    }}
                  >
                    Add Relation
                  </UIButton>
                </div>

                {relationFeedback && (
                  <div
                    className={`text-xs px-3 py-2 rounded-xl flex items-center justify-between gap-2 ${
                      relationFeedback.type === "success"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
                    }`}
                  >
                    <span>{relationFeedback.text}</span>
                    <button
                      type="button"
                      onClick={() => setRelationFeedback(null)}
                      className="text-text-muted hover:text-text cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                )}

                {membersList.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                    <div className="size-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3">
                      <Users className="size-6" />
                    </div>
                    <h5 className="text-sm font-bold text-text">No Relations Linked Yet</h5>
                    <p className="text-xs text-text-muted max-w-sm mt-1 mb-4">
                      Connect family members (Spouse, Child, Parent) or shared phone contacts to manage household billing and shared accounts.
                    </p>
                    <UIButton
                      size="sm"
                      variant="outline"
                      startIcon={<Plus className="size-3.5" />}
                      onClick={() => {
                        setAddMode("existing");
                        setTargetCustomerId("");
                        setSelectedCustomerObj(null);
                        setSearchQuery("");
                        setSearchResults([]);
                        setNewName("");
                        setNewMobile(activeCustomer?.mobile || "");
                        setNewGender("");
                        setNewRelation("Spouse");
                        setNewNotes("");
                        setAddError(null);
                        setIsAddRelationOpen(true);
                      }}
                    >
                      Link or Add Relation
                    </UIButton>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {membersList.map((mem, idx) => {
                      const memObj =
                        mem.customerId && typeof mem.customerId === "object"
                          ? mem.customerId
                          : null;
                      const targetIdStr = (
                        memObj?._id || mem.customerId
                      )?.toString();
                      const currentCustIdStr = (
                        activeCustomer?._id || activeCustomer?.id || customerData?._id || customerData?.id
                      )?.toString();
                      const isCurrent =
                        mem.relation === "Self" || targetIdStr === currentCustIdStr;
                      const memName =
                        mem.name ||
                        memObj?.name ||
                        (isCurrent ? activeCustomer?.name : "Linked Member");
                      const memCode =
                        mem.customerCode || memObj?.customerCode || "";
                      const memPhone =
                        mem.mobile ||
                        memObj?.mobile ||
                        activeCustomer?.mobile ||
                        "";
                      const isConfirmed = mem.confirmationStatus === "confirmed";
                      const isEditing = editingMemberId === targetIdStr;

                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                            isCurrent
                              ? "bg-surface border-purple-500/40 shadow-xs"
                              : "bg-surface/80 border-border/70"
                          }`}
                        >
                          <div className="min-w-0 flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {mem.sequence ? `#${mem.sequence}` : idx + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-text truncate">
                                  {memName}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                                    Current Profile
                                  </span>
                                )}
                                {mem.gender && (
                                  <span className="text-[10px] text-text-muted capitalize">
                                    ({mem.gender})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-text-muted mt-0.5">
                                {memCode && <span className="font-mono">{memCode}</span>}
                                {memCode && memPhone && <span>•</span>}
                                {memPhone && <span>{memPhone}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Relationship badge & controls */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={selectedRelation}
                                  onChange={(e) => setSelectedRelation(e.target.value)}
                                  disabled={isUpdatingRelation}
                                  className="text-xs rounded-lg border border-border bg-surface px-2 py-1 font-medium text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
                                >
                                  {RELATION_OPTIONS.map((rel) => (
                                    <option key={rel} value={rel}>
                                      {rel}
                                    </option>
                                  ))}
                                </select>
                                <UIButton
                                  size="xs"
                                  variant="primary"
                                  disabled={isUpdatingRelation}
                                  onClick={() => handleUpdateRelationship(mem, selectedRelation)}
                                >
                                  {isUpdatingRelation ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : (
                                    "Save"
                                  )}
                                </UIButton>
                                <UIButton
                                  size="xs"
                                  variant="ghost"
                                  disabled={isUpdatingRelation}
                                  onClick={() => setEditingMemberId(null)}
                                >
                                  <X className="size-3" />
                                </UIButton>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    {mem.relation}
                                  </span>
                                  {!isCurrent && (
                                    <span
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                        isConfirmed
                                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                      }`}
                                      title={
                                        isConfirmed
                                          ? "Confirmed relationship"
                                          : "Unconfirmed suggested relationship"
                                      }
                                    >
                                      {isConfirmed ? (
                                        <>
                                          <CheckCircle2 className="size-2.5" />
                                          Confirmed
                                        </>
                                      ) : (
                                        <>
                                          <AlertTriangle className="size-2.5" />
                                          Suggested
                                        </>
                                      )}
                                    </span>
                                  )}
                                </div>

                                {!isCurrent && (
                                  <div className="flex items-center gap-1">
                                    {!isConfirmed && (
                                      <button
                                        type="button"
                                        disabled={isUpdatingRelation}
                                        onClick={() => handleUpdateRelationship(mem, mem.relation)}
                                        className="px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                                        title="Confirm this relationship"
                                      >
                                        <Check className="size-3" />
                                        Confirm
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      disabled={isUpdatingRelation}
                                      onClick={() => {
                                        setEditingMemberId(targetIdStr);
                                        setSelectedRelation(mem.relation || "Other");
                                      }}
                                      className="p-1 rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
                                      title="Edit relationship"
                                    >
                                      <Edit2 className="size-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isUpdatingRelation}
                                      onClick={() => {
                                        setDeletingMember(mem);
                                        setDeleteError(null);
                                      }}
                                      className="p-1 rounded-md text-text-muted hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                                      title="Unlink relationship"
                                    >
                                      <Trash2 className="size-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CREATE / EDIT MODE
           ══════════════════════════════════════════════════════════════════ */}
        {!isView && (
          <form id="customer-dialog-form" onSubmit={handleSubmit} className="space-y-6">
            {isWalkInCustomer && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200">
                <Store className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold">System Default Walk-in Customer:</span> Used for quick counter sales and anonymous POS transactions. Customer type and credit/opening balances are permanently disabled.
                </div>
              </div>
            )}
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
                  disabled={isWalkInCustomer}
                  helperText={isWalkInCustomer ? "System Walk-in Customer type cannot be changed" : undefined}
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
                  disabled={isWalkInCustomer}
                  size="md"
                  helperText={isWalkInCustomer ? "Permanently 0 for Walk-in Customer" : "Maximum allowed outstanding bill balance"}
                />

                <UIInput
                  type="number"
                  label="Credit Grace Period (Days)"
                  placeholder="30"
                  value={formData.creditDays}
                  onChange={(e) => handleFieldChange("creditDays", e.target.value)}
                  disabled={isWalkInCustomer}
                  size="md"
                  helperText={isWalkInCustomer ? "Permanently 0 for Walk-in Customer" : "Days before unpaid invoice flags as overdue"}
                />

                <UIInput
                  type="number"
                  label="Opening Balance (₹)"
                  placeholder="0.00"
                  value={formData.openingBalance}
                  onChange={(e) => handleFieldChange("openingBalance", e.target.value)}
                  disabled={isWalkInCustomer}
                  size="md"
                  helperText={isWalkInCustomer ? "Permanently 0 for Walk-in Customer" : undefined}
                />

                <UISelect
                  label="Opening Balance Type"
                  value={formData.openingBalanceType}
                  onChange={(val) => handleFieldChange("openingBalanceType", val)}
                  options={balanceTypeOptions}
                  disabled={isWalkInCustomer}
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
        <UIButton
          variant="outline"
          onClick={isView ? onClose : () => setCurrentMode("view")}
          disabled={isSubmitting}
        >
          {isView ? "Close" : "Cancel"}
        </UIButton>

        {isView ? (
          <UIButton
            variant="primary"
            startIcon={<Edit2 className="size-4" />}
            onClick={() => {
              populateFormFromCustomer(activeCustomer);
              setCurrentMode("edit");
            }}
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

    {/* ══════════════════════════════════════════════════════════════════
        ADD RELATION MODAL
       ══════════════════════════════════════════════════════════════════ */}
    {isAddRelationOpen && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
          <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="text-base font-bold text-text">Add Customer Relationship</h3>
              <p className="text-xs text-text-muted mt-0.5">
                Link an existing customer or create a new profile linked to {activeCustomer?.name || customerData?.name}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddRelationOpen(false)}
              className="text-text-muted hover:text-text cursor-pointer p-1 rounded-lg hover:bg-surface-hover"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Mode selection tabs */}
          <div className="flex rounded-xl bg-surface-alt/70 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAddMode("existing");
                setAddError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition text-center cursor-pointer ${
                addMode === "existing"
                  ? "bg-surface text-primary shadow-xs font-bold"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Link Existing Customer
            </button>
            <button
              type="button"
              onClick={() => {
                setAddMode("new");
                setAddError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition text-center cursor-pointer ${
                addMode === "new"
                  ? "bg-surface text-primary shadow-xs font-bold"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Create New Contact Profile
            </button>
          </div>

          {addError && (
            <div className="text-xs p-2.5 rounded-lg bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20">
              {addError}
            </div>
          )}

          <form onSubmit={handleAddRelationship} className="space-y-4 text-xs">
            {addMode === "existing" ? (
              <div className="space-y-2">
                <label className="font-semibold text-text block">Select Customer to Link *</label>
                {selectedCustomerObj ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="min-w-0">
                      <div className="font-bold text-text truncate">{selectedCustomerObj.name}</div>
                      <div className="text-[11px] text-text-muted font-mono mt-0.5">
                        {selectedCustomerObj.mobile || "No phone"} • {selectedCustomerObj.customerCode || "No code"}
                      </div>
                    </div>
                    <UIButton
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        setSelectedCustomerObj(null);
                        setTargetCustomerId("");
                      }}
                    >
                      Change
                    </UIButton>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="size-4 text-text-muted absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search customer by name or phone..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-surface text-xs text-text placeholder:text-text-muted focus:outline-hidden focus:ring-1 focus:ring-primary"
                      />
                      {isSearching && (
                        <Loader2 className="size-3.5 text-text-muted animate-spin absolute right-3 top-2.5" />
                      )}
                    </div>

                    {searchResults.length > 0 && (
                      <div className="mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg divide-y divide-border">
                        {searchResults.map((cust) => (
                          <button
                            key={cust._id || cust.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomerObj(cust);
                              setTargetCustomerId(cust._id || cust.id);
                              setSearchResults([]);
                            }}
                            className="w-full text-left p-2.5 hover:bg-surface-hover flex items-center justify-between gap-2 cursor-pointer transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-text truncate">{cust.name}</div>
                              <div className="text-[11px] text-text-muted font-mono">
                                {cust.mobile || "No phone"} • {cust.customerCode || "No code"}
                              </div>
                            </div>
                            <Plus className="size-3.5 text-primary shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                    {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && (
                      <div className="mt-1 text-[11px] text-text-muted italic px-1">
                        No matching unlinked customers found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-text block mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-text block mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={newMobile}
                      onChange={(e) => setNewMobile(e.target.value)}
                      placeholder="Shared mobile number"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-text block mb-1">Gender</label>
                    <select
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Unspecified</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-semibold text-text block mb-1">Relationship to {activeCustomer?.name || customerData?.name} *</label>
                <select
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  {RELATION_OPTIONS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-text block mb-1">Notes / Relationship Remarks</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Optional details"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <UIButton
                type="button"
                variant="outline"
                size="sm"
                disabled={isAddingRelation}
                onClick={() => setIsAddRelationOpen(false)}
              >
                Cancel
              </UIButton>
              <UIButton
                type="submit"
                variant="primary"
                size="sm"
                disabled={
                  isAddingRelation ||
                  (addMode === "existing" && !targetCustomerId) ||
                  (addMode === "new" && !newName.trim())
                }
                startIcon={
                  isAddingRelation ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-3.5" />
                  )
                }
              >
                {isAddingRelation ? "Adding..." : "Add Relationship"}
              </UIButton>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* ══════════════════════════════════════════════════════════════════
        DELETE / UNLINK CONFIRMATION MODAL
       ══════════════════════════════════════════════════════════════════ */}
    {deletingMember && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
          <div className="flex items-center gap-3 text-red-600">
            <div className="size-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <Trash2 className="size-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-text">Unlink Relationship</h4>
              <p className="text-xs text-text-muted">Remove shared contact connection</p>
            </div>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Are you sure you want to remove the relationship link with{" "}
            <strong className="text-text">
              {deletingMember.name || deletingMember.customerId?.name || "this member"}
            </strong>
            ?
            <br />
            <br />
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Note: This only unlinks the relationship and shared contact group. The customer profile, invoices, ledgers, and account balances will not be deleted or modified.
            </span>
          </p>

          {deleteError && (
            <div className="text-xs p-2.5 rounded-lg bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20">
              {deleteError}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <UIButton
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeletingRelation}
              onClick={() => {
                setDeletingMember(null);
                setDeleteError(null);
              }}
            >
              Cancel
            </UIButton>
            <UIButton
              type="button"
              variant="danger"
              size="sm"
              disabled={isDeletingRelation}
              onClick={handleConfirmDeleteRelationship}
            >
              {isDeletingRelation ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Unlinking...
                </>
              ) : (
                "Unlink Relation"
              )}
            </UIButton>
          </div>
        </div>
      </div>
    )}
  </>
  );
}

export default CustomerDialog;
