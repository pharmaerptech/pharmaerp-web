// src/features/finance/treasury/cash-management/branch-cash/components/InitializeBranchCashModal.jsx

import React, { useState, useEffect } from "react";
import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalBody,
  UIModalFooter,
  UIButton,
  UIAlert,
} from "@/components/ui";
import {
  Coins,
  AlertTriangle,
  Building2,
  FileText,
  Info,
  Banknote,
  Save,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useBranchCash } from "../hooks/useBranchCash";
import useBranch from "@/features/branch/hooks/useBranch";

const DENOMINATIONS_CONFIG = [
  { note: 500, label: "₹ 500", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800", icon: "P" },
  { note: 200, label: "₹ 200", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800", icon: "P" },
  { note: 100, label: "₹ 100", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800", icon: "P" },
  { note: 50,  label: "₹ 50",  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", icon: "P" },
  { note: 20,  label: "₹ 20",  color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800", icon: "P" },
  { note: 10,  label: "₹ 10",  color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800", icon: "P" },
  { note: 5,   label: "₹ 5",   color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200 dark:border-pink-800", icon: "P" },
  { note: 2,   label: "₹ 2",   color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700", icon: "i" },
  { note: 1,   label: "₹ 1",   color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700", icon: "i" },
];

const formatCurrency = (val) =>
  `₹ ${Number(val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const InitializeBranchCashModal = ({ isOpen, onClose }) => {
  const { currentBranch } = useBranch();
  const { initializeBranchCash, initializeStatus, error: apiError, resetStatus } =
    useBranchCash();

  const [counts, setCounts] = useState(
    DENOMINATIONS_CONFIG.reduce((acc, d) => ({ ...acc, [d.note]: 0 }), {})
  );
  const [narration, setNarration] = useState("");
  const [validationError, setValidationError] = useState("");

  const isSubmitting = initializeStatus === "loading";

  useEffect(() => {
    if (isOpen) {
      setCounts(
        DENOMINATIONS_CONFIG.reduce((acc, d) => ({ ...acc, [d.note]: 0 }), {})
      );
      setNarration("");
      setValidationError("");
      if (typeof resetStatus === "function") resetStatus();
    }
  }, [isOpen, resetStatus]);

  useEffect(() => {
    if (initializeStatus === "success") {
      onClose();
      if (typeof resetStatus === "function") resetStatus();
    }
  }, [initializeStatus, onClose, resetStatus]);

  const totalAmount = DENOMINATIONS_CONFIG.reduce((sum, d) => {
    const qty = Number(counts[d.note]) || 0;
    return sum + d.note * qty;
  }, 0);

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

  const handleSubmit = async () => {
    if (!currentBranch?._id) {
      setValidationError("No active branch selected.");
      return;
    }
    if (totalAmount < 0 || Number.isNaN(totalAmount)) {
      setValidationError("Opening cash amount cannot be negative.");
      return;
    }

    const openingDenominations = DENOMINATIONS_CONFIG.map((d) => ({
      denomination: d.note,
      count: Number(counts[d.note]) || 0,
      quantity: Number(counts[d.note]) || 0,
      amount: (Number(counts[d.note]) || 0) * d.note,
    })).filter((d) => d.count > 0);

    const payload = {
      branchId: currentBranch._id,
      branchName: currentBranch.name || currentBranch.branchName || "",
      openingAmount: totalAmount,
      openingDenominations,
      narration: narration?.trim() || "",
    };

    try {
      await initializeBranchCash(payload).unwrap();
      onClose();
    } catch {
      // Error handled via Redux state
    }
  };

  if (!isOpen) return null;

  const branchName = currentBranch?.name || "Makati Branch";
  const branchCode =
    currentBranch?.code ||
    currentBranch?.branchCode ||
    (currentBranch?._id ? `MB-${String(currentBranch._id).slice(-3).toUpperCase()}` : "MB-001");

  return (
    <UIModal
      isOpen={isOpen}
      onClose={isSubmitting ? undefined : onClose}
      size="2xl"
      className="w-[940px] max-w-[95vw] max-h-[92vh] flex flex-col overflow-hidden select-none"
    >
      {/* ── Modal Header: Blue Icon + Title + Subtitle ── */}
      <UIModalHeader className="border-b border-border/80 px-6 py-4.5 bg-surface shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Coins className="size-5" />
          </div>
          <div>
            <UIModalTitle className="text-xl font-bold text-text tracking-tight">
              Initialize Branch Cash
            </UIModalTitle>
            <p className="text-xs text-text-muted mt-0.5">
              Set the initial cash balance for this branch
            </p>
          </div>
        </div>
      </UIModalHeader>

      <UIModalBody className="p-6 overflow-y-auto space-y-4 bg-bg flex-1">
        {/* Error Alert */}
        {(validationError || apiError) && (
          <UIAlert
            intent="danger"
            title="Validation Error"
            description={validationError || apiError}
            onClose={() => setValidationError("")}
          />
        )}

        {/* ── Amber Warning Banner ── */}
        <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-3.5 flex items-start gap-3">
          <div className="size-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <AlertTriangle className="size-4" />
          </div>
          <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5 leading-relaxed">
            <div className="font-bold">
              Note: Initializing branch cash will set the opening balance in the RUNNING partition.
            </div>
            <p className="text-amber-800/90 dark:text-amber-300/80">
              Ensure the physical cash matches this amount (leave at ₹ 0.00 if starting with an empty drawer). This will be recorded as the initial amount for the branch.
            </p>
          </div>
        </div>

        {/* ── 2-Column Form Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ══════════ LEFT COLUMN: Branch Info, Narration & Info Box ══════════ */}
          <div className="lg:col-span-5 space-y-4">
            {/* Card 1: Branch Information */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-text">
                <Building2 className="size-4 text-text-muted" />
                <span>Branch Information</span>
              </div>
              <div className="bg-surface-alt/70 rounded-xl p-3 border border-border/70 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Branch Name</span>
                  <span className="font-bold text-text">{branchName}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <span className="text-text-muted">Branch Code</span>
                  <span className="font-bold text-text font-mono">{branchCode}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Narration (Optional) */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-text">
                <FileText className="size-4 text-text-muted" />
                <span>Narration (Optional)</span>
              </div>
              <p className="text-[11px] text-text-muted leading-tight">
                Add notes for this initial cash setup (e.g., opening balance, initial float, etc.)
              </p>
              <div className="relative pt-1">
                <textarea
                  value={narration}
                  onChange={(e) => setNarration(e.target.value.slice(0, 500))}
                  placeholder="Initial setup notes..."
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full text-xs bg-surface border border-border rounded-xl p-3 outline-none focus:border-primary transition resize-none placeholder:text-text-muted/60"
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] text-text-muted font-mono">
                  {narration.length}/500
                </span>
              </div>
            </div>

            {/* Card 3: Blue Information Callout */}
            <div className="bg-sky-50/80 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 rounded-2xl p-3.5 flex items-start gap-3">
              <div className="size-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Info className="size-4 stroke-[2.5]" />
              </div>
              <div className="text-xs text-sky-950 dark:text-sky-200 space-y-0.5">
                <div className="font-bold text-blue-600 dark:text-blue-400">
                  Information
                </div>
                <p className="text-[11.5px] leading-relaxed text-sky-900/90 dark:text-sky-300/80">
                  Enter the count of each denomination below, or leave all counts at 0 to initialize with ₹ 0.00. Only non-zero denominations will be saved.
                </p>
              </div>
            </div>
          </div>

          {/* ══════════ RIGHT COLUMN: Denominations Stepper Table ══════════ */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
              <div className="px-4 py-3 border-b border-border bg-surface-alt/50 flex items-center gap-2">
                <Banknote className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-text">Cash Denominations</span>
              </div>

              {/* Table Headers */}
              <div className="grid grid-cols-12 px-4 py-2 border-b border-border/80 text-[11px] font-bold text-text-muted uppercase tracking-wider bg-surface-alt/30">
                <div className="col-span-4">Denomination</div>
                <div className="col-span-4 text-center">Count</div>
                <div className="col-span-4 text-right">Subtotal</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border/50">
                {DENOMINATIONS_CONFIG.map((d) => {
                  const count = Number(counts[d.note]) || 0;
                  const subtotal = d.note * count;

                  return (
                    <div
                      key={d.note}
                      className="grid grid-cols-12 px-4 py-2 items-center hover:bg-surface-alt/30 transition text-xs"
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

                      {/* Stepper Count Input */}
                      <div className="col-span-4 flex items-center justify-center">
                        <div className="flex items-center border border-border rounded-lg bg-surface shadow-2xs overflow-hidden w-28">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={count === 0 ? "0" : count}
                            onChange={(e) => handleCountChange(d.note, e.target.value)}
                            disabled={isSubmitting}
                            className="w-full text-center font-mono font-semibold text-xs py-1.5 px-2 bg-transparent outline-none text-text"
                          />
                          <div className="flex flex-col border-l border-border shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStep(d.note, 1)}
                              disabled={isSubmitting}
                              className="px-1.5 py-0.5 hover:bg-surface-alt text-text-muted hover:text-text transition-colors cursor-pointer"
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
                      <div className="col-span-4 text-right font-mono font-bold text-xs text-text">
                        {formatCurrency(subtotal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Opening Amount Card */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                  <Banknote className="size-4" />
                </div>
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Total Opening Amount
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalAmount)}
              </div>
            </div>
          </div>
        </div>
      </UIModalBody>

      {/* ── Modal Footer ── */}
      <UIModalFooter className="border-t border-border/80 px-6 py-4 bg-surface flex items-center justify-between shrink-0">
        <UIButton
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-5 py-2 rounded-xl text-xs font-bold"
        >
          Cancel
        </UIButton>

        <UIButton
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || totalAmount < 0}
          isLoading={isSubmitting}
          startIcon={<Save className="size-4" />}
          className="px-6 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shadow-xs cursor-pointer"
        >
          Initialize Cash
        </UIButton>
      </UIModalFooter>
    </UIModal>
  );
};

export default InitializeBranchCashModal;

