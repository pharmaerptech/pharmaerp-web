// src/features/finance/treasury/bank-deposit-slips/components/CreateBankDepositSlipDialog.jsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalBody,
  UIModalFooter,
  UIButton,
  UIAlert,
  UISelect,
  uiToast,
} from "@/components/ui";
import {
  ArrowDownToLine,
  Building2,
  Wallet,
  Lock,
  Landmark,
  Banknote,
  FileText,
  Info,
  Calendar,
  Tag,
  Coins,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import useBranch from "@/features/branch/hooks/useBranch";
import useBankAccount from "@/features/finance/treasury/bank-management/bank-accounts/hooks/useBankAccount";
import { useBranchCash } from "@/features/finance/treasury/cash-management/branch-cash/hooks/useBranchCash";
import useBankDepositSlip from "../hooks/useBankDepositSlip";

const DENOMINATIONS_CONFIG = [
  { note: 500, label: "₹ 500", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800", icon: "₹" },
  { note: 200, label: "₹ 200", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800", icon: "₹" },
  { note: 100, label: "₹ 100", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800", icon: "₹" },
  { note: 50,  label: "₹ 50",  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", icon: "₹" },
  { note: 20,  label: "₹ 20",  color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800", icon: "₹" },
  { note: 10,  label: "₹ 10",  color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800", icon: "₹" },
  { note: 5,   label: "₹ 5",   color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200 dark:border-pink-800", icon: "₹" },
  { note: 2,   label: "₹ 2",   color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700", icon: "•" },
  { note: 1,   label: "₹ 1",   color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700", icon: "•" },
];

const formatCurrency = (val) =>
  `₹ ${Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const CreateBankDepositSlipDialog = ({
  isOpen,
  onClose,
  onSuccess,
  prefillDayClosingId = null,
  defaultBranchId = null,
}) => {
  const { currentBranch, branches = [] } = useBranch();
  const [selectedBranchId, setSelectedBranchId] = useState(defaultBranchId || "");
  const activeBranchId = currentBranch?._id || selectedBranchId || (branches.length > 0 ? branches[0]._id : "");

  const { bankAccounts = [], getBankAccounts } = useBankAccount();
  const { fetchBranchCash, currentBranchCash, frozenDenominations, frozenCash } = useBranchCash();
  const {
    createBankDepositSlip,
    createBankDepositSlipStatus,
    error: apiError,
    clearError,
  } = useBankDepositSlip();

  const [toBankAccountId, setToBankAccountId] = useState("");
  const [slipDate, setSlipDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [depositBagReference, setDepositBagReference] = useState("");
  const [bankBranchName, setBankBranchName] = useState("");
  const [narration, setNarration] = useState("");
  const [dayClosingId, setDayClosingId] = useState(prefillDayClosingId || "");

  const [counts, setCounts] = useState(
    DENOMINATIONS_CONFIG.reduce((acc, d) => ({ ...acc, [d.note]: 0 }), {})
  );
  const [validationError, setValidationError] = useState("");

  const isSubmitting = createBankDepositSlipStatus === "loading";

  // Load bank accounts and branch cash on open
  useEffect(() => {
    if (isOpen) {
      const bId = currentBranch?._id || defaultBranchId || (branches.length > 0 ? branches[0]._id : "");
      if (bId) {
        setSelectedBranchId(bId);
        fetchBranchCash(bId);
        getBankAccounts({ all: true, isActive: true }).catch((err) =>
          console.error("Failed to load bank accounts:", err)
        );
      }
      setCounts(DENOMINATIONS_CONFIG.reduce((acc, d) => ({ ...acc, [d.note]: 0 }), {}));
      setSlipDate(new Date().toISOString().split("T")[0]);
      setDepositBagReference("");
      setBankBranchName("");
      setNarration("");
      setDayClosingId(prefillDayClosingId || "");
      setValidationError("");
      if (typeof clearError === "function") clearError();
    }
  }, [isOpen, currentBranch?._id, defaultBranchId, branches, fetchBranchCash, getBankAccounts, prefillDayClosingId, clearError]);

  // Map available denominations in frozen vault
  const availableDenominationsMap = useMemo(() => {
    const map = new Map();
    const vaultList =
      frozenDenominations ||
      currentBranchCash?.denominationBalance?.frozenDenominations ||
      currentBranchCash?.balance?.frozenDenominations ||
      [];

    for (const d of vaultList) {
      const noteVal = Number(d.denomination || 0);
      const qty = Number(d.quantity ?? d.count ?? 0);
      map.set(noteVal, qty);
    }
    return map;
  }, [frozenDenominations, currentBranchCash]);

  // Current available frozen cash
  const availableFrozenCash = useMemo(() => {
    if (frozenCash !== undefined && frozenCash !== null) return Number(frozenCash);
    return Number(currentBranchCash?.frozenCash || 0);
  }, [frozenCash, currentBranchCash]);

  // Total deposit amount calculated from live note counts
  const totalDepositAmount = useMemo(() => {
    return DENOMINATIONS_CONFIG.reduce((sum, d) => {
      const qty = Number(counts[d.note]) || 0;
      return sum + d.note * qty;
    }, 0);
  }, [counts]);

  // Projected remaining vault cash after this deposit
  const projectedRemainingVault = availableFrozenCash - totalDepositAmount;

  // Bank account select options
  const bankAccountOptions = useMemo(() => {
    return (bankAccounts || []).map((acc) => {
      const bankName = acc.bank || acc.bankMasterId?.bankName || acc.accountName || "Bank";
      const accNum = acc.accountNumber ? ` • ${String(acc.accountNumber).slice(-4)}` : "";
      return {
        label: `${acc.accountName || bankName} (${bankName}${accNum})`,
        value: acc._id,
      };
    });
  }, [bankAccounts]);

  // Select primary account by default if not yet selected
  useEffect(() => {
    if (isOpen && bankAccounts?.length > 0 && !toBankAccountId) {
      const primary = bankAccounts.find((a) => a.isPrimary) || bankAccounts[0];
      if (primary?._id) {
        setToBankAccountId(primary._id);
        if (primary.branchName) setBankBranchName(primary.branchName);
      }
    }
  }, [isOpen, bankAccounts, toBankAccountId]);

  // Auto-fill bank branch if selected account changes
  const handleBankAccountChange = (accId) => {
    setToBankAccountId(accId);
    const selected = bankAccounts.find((a) => a._id === accId);
    if (selected?.branchName) {
      setBankBranchName(selected.branchName);
    }
  };

  const handleCountChange = (note, rawVal) => {
    const cleaned = String(rawVal).replace(/\D/g, "");
    const qty = cleaned === "" ? 0 : Math.max(0, parseInt(cleaned, 10));
    setCounts((prev) => ({ ...prev, [note]: qty }));
  };

  const handleStep = (note, delta) => {
    setCounts((prev) => {
      const current = Number(prev[note]) || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [note]: next };
    });
  };

  const handleSetMaxForDenom = (note) => {
    const maxQty = availableDenominationsMap.get(note) || 0;
    setCounts((prev) => ({ ...prev, [note]: maxQty }));
  };

  const handleFillAllAvailable = () => {
    const nextCounts = {};
    for (const d of DENOMINATIONS_CONFIG) {
      nextCounts[d.note] = availableDenominationsMap.get(d.note) || 0;
    }
    setCounts(nextCounts);
  };

  const handleResetCounts = () => {
    setCounts(DENOMINATIONS_CONFIG.reduce((acc, d) => ({ ...acc, [d.note]: 0 }), {}));
  };

  const validateForm = () => {
    setValidationError("");

    if (!toBankAccountId) {
      setValidationError("Please select a destination bank account.");
      return false;
    }
    if (!slipDate) {
      setValidationError("Please select a slip date.");
      return false;
    }
    if (totalDepositAmount <= 0) {
      setValidationError("Deposit amount must be greater than ₹0.00. Enter denomination note counts.");
      return false;
    }
    if (totalDepositAmount > availableFrozenCash) {
      setValidationError(`Total deposit (${formatCurrency(totalDepositAmount)}) exceeds available frozen vault cash (${formatCurrency(availableFrozenCash)}).`);
      return false;
    }

    // Check each note against available note quantity
    for (const d of DENOMINATIONS_CONFIG) {
      const count = Number(counts[d.note]) || 0;
      const available = availableDenominationsMap.get(d.note) || 0;
      if (count > available) {
        setValidationError(`Cannot deposit ${count} notes of ${d.label}. Only ${available} available in frozen vault.`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!validateForm()) return;

    const filteredDenominations = DENOMINATIONS_CONFIG
      .map((d) => ({
        denomination: d.note,
        quantity: Number(counts[d.note]) || 0,
      }))
      .filter((d) => d.quantity > 0);

    const payload = {
      branchId: activeBranchId,
      toBankAccountId,
      slipDate,
      depositBagReference: depositBagReference.trim() || undefined,
      bankBranchName: bankBranchName.trim() || undefined,
      narration: narration.trim() || undefined,
      dayClosingId: dayClosingId || null,
      amount: totalDepositAmount,
      denominations: filteredDenominations,
    };

    try {
      const res = await createBankDepositSlip(payload);
      uiToast.success(
        "Deposit Slip Created",
        `Bank deposit slip #${res?.slipNumber || "entry"} for ₹${totalDepositAmount.toLocaleString("en-IN")} submitted.`
      );
      onClose();
      if (typeof onSuccess === "function") onSuccess();
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.message || "Failed to create bank deposit slip.";
      setValidationError(msg);
      uiToast.error("Creation Failed", msg);
    }
  };

  const selectedBranchObj = (branches || []).find((b) => b._id === activeBranchId);
  const branchName = currentBranch?.name || selectedBranchObj?.name || "Main Branch";
  const branchCode = currentBranch?.code || selectedBranchObj?.branchCode || "BR-01";

  return (
    <UIModal
      isOpen={isOpen}
      onClose={isSubmitting ? undefined : onClose}
      size="2xl"
      className="w-[980px] max-w-[96vw] max-h-[92vh] flex flex-col overflow-hidden select-none"
    >
      {/* ── Modal Header: Matching Cash Counter Deposit/Withdraw Header ── */}
      <UIModalHeader className="border-b border-border/80 px-6 py-4.5 bg-surface shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <ArrowDownToLine className="size-5" />
          </div>
          <div>
            <UIModalTitle className="text-xl font-bold text-text tracking-tight flex items-center gap-2">
              <span>Create Bank Deposit Slip</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Cash Vault → Bank
              </span>
            </UIModalTitle>
            <p className="text-xs text-text-muted mt-0.5">
              Record physical cash transfer from frozen vault to corporate bank account.
            </p>
          </div>
        </div>
      </UIModalHeader>

      <UIModalBody className="p-6 overflow-y-auto space-y-4 bg-bg flex-1">
        {/* Error Alert */}
        {(validationError || apiError) && (
          <UIAlert
            intent="danger"
            title="Deposit Slip Error"
            description={validationError || apiError}
            onClose={() => {
              setValidationError("");
              if (typeof clearError === "function") clearError();
            }}
          />
        )}

        {/* ── 2-Column Main Section (Matching Branch Cash Counter) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ══════════ LEFT COLUMN: Branch, Vault Balance, Bank, Details (5 Cols) ══════════ */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* Card 1: Branch */}
            <div className="bg-surface rounded-2xl border border-border p-3.5 space-y-2 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-surface-alt text-text-muted flex items-center justify-center shrink-0">
                  <Building2 className="size-5 text-text-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium text-text-muted">Branch</div>
                  {currentBranch?._id ? (
                    <>
                      <div className="text-sm font-bold text-text truncate">{branchName}</div>
                      <div className="text-[11px] text-text-muted font-mono">{branchCode}</div>
                    </>
                  ) : (
                    <UISelect
                      size="sm"
                      value={selectedBranchId || activeBranchId}
                      onChange={(val) => {
                        setSelectedBranchId(val);
                        if (val) fetchBranchCash(val);
                      }}
                      options={(branches || []).map((b) => ({
                        value: b._id,
                        label: b.name || "Branch",
                        description: b.branchCode ? `[${b.branchCode}]` : "",
                      }))}
                      placeholder="Select Branch"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Frozen Vault Balance (Source of Cash) */}
            <div className="bg-surface rounded-2xl border border-border p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Lock className="size-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-text-muted">
                    Available Frozen Vault Cash
                  </div>
                  <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                    {formatCurrency(availableFrozenCash)}
                  </div>
                </div>
              </div>

              {/* Informational Callout */}
              <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-2.5 flex items-start gap-2">
                <Info className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900/90 dark:text-amber-300/80 leading-relaxed">
                  Only locked cash stored in the frozen vault is eligible for bank deposit slips.
                </p>
              </div>
            </div>

            {/* Card 3: Destination Bank Account */}
            <div className="bg-surface rounded-2xl border border-border p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-text">
                <Landmark className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Destination Bank Account *</span>
              </div>
              <UISelect
                value={toBankAccountId}
                onChange={handleBankAccountChange}
                options={bankAccountOptions}
                placeholder="Select Corporate Bank Account"
                size="md"
                className="w-full"
              />
            </div>

            {/* Card 4: Slip Date, Bag Ref, and Narration */}
            <div className="bg-surface rounded-2xl border border-border p-3.5 space-y-3 shadow-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-text mb-1 block">
                    Slip Date *
                  </label>
                  <input
                    type="date"
                    value={slipDate}
                    onChange={(e) => setSlipDate(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full text-xs bg-surface border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary text-text font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-text mb-1 block">
                    Deposit Bag / Ref #
                  </label>
                  <input
                    type="text"
                    value={depositBagReference}
                    onChange={(e) => setDepositBagReference(e.target.value)}
                    placeholder="e.g. BAG-8921"
                    disabled={isSubmitting}
                    className="w-full text-xs bg-surface border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary text-text"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-text mb-1 block">
                  Bank Branch Name
                </label>
                <input
                  type="text"
                  value={bankBranchName}
                  onChange={(e) => setBankBranchName(e.target.value)}
                  placeholder="e.g. MG Road Branch"
                  disabled={isSubmitting}
                  className="w-full text-xs bg-surface border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary text-text"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-text">
                    Narration / Remarks
                  </label>
                  <span className="text-[10px] text-text-muted font-mono">
                    {narration.length}/300
                  </span>
                </div>
                <textarea
                  value={narration}
                  onChange={(e) => setNarration(e.target.value.slice(0, 300))}
                  placeholder="Enter remarks or cashier notes for this deposit slip..."
                  disabled={isSubmitting}
                  rows={2}
                  className="w-full text-xs bg-surface border border-border rounded-lg p-2.5 outline-none focus:border-primary transition resize-none text-text placeholder:text-text-muted/60"
                />
              </div>
            </div>
          </div>

          {/* ══════════ RIGHT COLUMN: Denominations Stepper Table (7 Cols) ══════════ */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
              {/* Header with Title and Quick Fill Actions */}
              <div className="px-4 py-3 border-b border-border bg-surface-alt/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-text">Denominations Breakdown</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFillAllAvailable}
                    disabled={isSubmitting || availableFrozenCash <= 0}
                    className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    title="Fill all available notes from vault"
                  >
                    <Sparkles className="size-3" />
                    <span>Fill All from Vault</span>
                  </button>
                  <span className="text-border">|</span>
                  <button
                    type="button"
                    onClick={handleResetCounts}
                    disabled={isSubmitting || totalDepositAmount <= 0}
                    className="text-[11px] font-medium text-text-muted hover:text-text transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    title="Reset all counts to 0"
                  >
                    <RotateCcw className="size-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Table Headers */}
              <div className="grid grid-cols-12 px-4 py-2 border-b border-border/80 text-[11px] font-bold text-text-muted uppercase tracking-wider bg-surface-alt/30">
                <div className="col-span-4">Denomination</div>
                <div className="col-span-2 text-center">In Vault</div>
                <div className="col-span-3 text-center">Deposit Qty</div>
                <div className="col-span-3 text-right">Subtotal</div>
              </div>

              {/* Denomination Rows */}
              <div className="divide-y divide-border/50">
                {DENOMINATIONS_CONFIG.map((d) => {
                  const count = Number(counts[d.note]) || 0;
                  const available = availableDenominationsMap.get(d.note) || 0;
                  const subtotal = d.note * count;
                  const isExceeded = count > available;

                  return (
                    <div
                      key={d.note}
                      className={`grid grid-cols-12 px-4 py-2 items-center hover:bg-surface-alt/30 transition text-xs ${
                        isExceeded ? "bg-rose-500/10" : ""
                      }`}
                    >
                      {/* Denomination Pill */}
                      <div className="col-span-4 flex items-center gap-2">
                        <span
                          className={`size-6 rounded-md flex items-center justify-center text-[10px] font-bold border ${d.color}`}
                        >
                          {d.icon}
                        </span>
                        <span className="font-bold text-text">{d.label}</span>
                      </div>

                      {/* In Vault Count */}
                      <div className="col-span-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleSetMaxForDenom(d.note)}
                          disabled={isSubmitting || available === 0}
                          className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-alt hover:bg-surface-hover text-text-muted hover:text-primary transition-colors cursor-pointer disabled:cursor-default disabled:opacity-50"
                          title={`Set max (${available})`}
                        >
                          {available}
                        </button>
                      </div>

                      {/* Stepper Count Input */}
                      <div className="col-span-3 flex items-center justify-center">
                        <div
                          className={`flex items-center border rounded-lg bg-surface shadow-2xs overflow-hidden w-24 ${
                            isExceeded ? "border-rose-500" : "border-border"
                          }`}
                        >
                          <input
                            type="text"
                            inputMode="numeric"
                            value={count === 0 ? "0" : count}
                            onChange={(e) => handleCountChange(d.note, e.target.value)}
                            disabled={isSubmitting}
                            className="w-full text-center font-mono font-semibold text-xs py-1.5 px-1 bg-transparent outline-none text-text"
                          />
                          <div className="flex flex-col border-l border-border shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStep(d.note, 1)}
                              disabled={isSubmitting || count >= available}
                              className="px-1.5 py-0.5 hover:bg-surface-alt text-text-muted hover:text-text transition-colors cursor-pointer disabled:opacity-30"
                            >
                              <ChevronUp className="size-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStep(d.note, -1)}
                              disabled={isSubmitting || count <= 0}
                              className="px-1.5 py-0.5 hover:bg-surface-alt text-text-muted hover:text-text transition-colors cursor-pointer disabled:opacity-30"
                            >
                              <ChevronDown className="size-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Subtotal */}
                      <div className="col-span-3 text-right font-mono font-bold text-xs text-text">
                        {formatCurrency(subtotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Summary Row: Total Slip Amount & Remaining Vault Cash ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Card 1: Total Deposit Amount */}
          <div className="bg-surface rounded-2xl border border-border p-4 flex items-center gap-3.5 shadow-xs">
            <div className="size-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Coins className="size-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-text-muted">
                Total Slip Deposit Amount
              </div>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalDepositAmount)}
              </div>
            </div>
          </div>

          {/* Card 2: Projected Remaining Vault Cash */}
          <div className="bg-surface rounded-2xl border border-border p-4 flex items-center gap-3.5 shadow-xs">
            <div
              className={`size-11 rounded-2xl flex items-center justify-center shrink-0 ${
                projectedRemainingVault < 0
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                  : "bg-sky-50 dark:bg-sky-950/40 text-blue-600 dark:text-blue-400"
              }`}
            >
              <BarChart3 className="size-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-text-muted">
                Remaining Frozen Vault Cash
              </div>
              <div
                className={`text-2xl font-black font-mono ${
                  projectedRemainingVault < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {formatCurrency(Math.max(0, projectedRemainingVault))}
              </div>
            </div>
          </div>
        </div>
      </UIModalBody>

      {/* ── Modal Footer ── */}
      <UIModalFooter className="border-t border-border/80 px-6 py-3.5 bg-surface shrink-0 flex items-center justify-between">
        <span className="text-xs text-text-muted font-mono">
          {totalDepositAmount > 0
            ? `${DENOMINATIONS_CONFIG.reduce((sum, d) => sum + (Number(counts[d.note]) || 0), 0)} notes selected`
            : "No notes entered"}
        </span>
        <div className="flex items-center gap-2.5">

          <UIButton
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            Cancel
          </UIButton>
          <UIButton
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Generating Slip..."
            disabled={isSubmitting || totalDepositAmount <= 0}
            className="px-5 font-bold shadow-xs cursor-pointer"
          >
            Create Deposit Slip
          </UIButton>
        </div>
      </UIModalFooter>

    </UIModal>
  );
};

export default CreateBankDepositSlipDialog;
