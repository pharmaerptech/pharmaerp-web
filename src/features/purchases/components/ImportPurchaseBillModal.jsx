import React, { useState, useRef } from "react";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Building2,
  Calendar,
  Hash,
  Package,
  X,
  Loader2,
  BadgeAlert,
  HelpCircle,
} from "lucide-react";
import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
  UIButton,
  UIBadge,
} from "@/components/ui";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";
import purchaseBillService from "../services/purchaseBillService";

export const ImportPurchaseBillModal = ({
  isOpen,
  onClose,
  onApplyPrefill,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState("upload"); // "upload" | "preview"
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parsedResult, setParsedResult] = useState(null);
  const [rawTextMode, setRawTextMode] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep("upload");
    setIsLoading(false);
    setError(null);
    setParsedResult(null);
    setPastedText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const parseWithPayload = async (payload) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await purchaseBillService.parsePurchaseBillImport(payload);
      const data = res.data?.data;
      if (!data || !data.items || data.items.length === 0) {
        throw new Error("No line items could be parsed from the provided document. Please check the format.");
      }
      setParsedResult(data);
      setStep("preview");
    } catch (err) {
      console.error("Purchase bill import failed:", err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to parse purchase bill. Please verify the file and try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    parseWithPayload(formData);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleSampleClick = (sampleKey) => {
    parseWithPayload({ sampleKey });
  };

  const handlePastedTextSubmit = () => {
    if (!pastedText.trim()) {
      setError("Please paste invoice text first");
      return;
    }
    parseWithPayload({ rawText: pastedText });
  };

  const handleConvertToPurchaseBill = () => {
    if (!parsedResult) return;

    if (onApplyPrefill) {
      onApplyPrefill(parsedResult);
    } else {
      navigate(ROUTES.CREATE_PURCHASE_BILL || "/purchases/bills/create", {
        state: { prefillData: parsedResult },
      });
    }
    handleClose();
  };

  const supplier = parsedResult?.matchedSupplier || parsedResult?.suggestedSupplier;
  const isSupplierMatched = Boolean(parsedResult?.matchedSupplier);
  const items = parsedResult?.items || [];
  const matchedCount = items.filter((i) => i.isMatched).length;
  const newProductCount = items.length - matchedCount;

  return (
    <UIModal isOpen={isOpen} onClose={handleClose} size={step === "preview" ? "4xl" : "lg"}>
      <UIModalHeader>
        <div className="flex items-center justify-between w-full">
          <div>
            <UIModalTitle className="flex items-center gap-2 text-base font-bold text-text">
              <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />
              <span>Import Purchase Bill (PDF / OCR)</span>
            </UIModalTitle>
            <UIModalDescription className="text-xs text-text-muted mt-0.5">
              {step === "upload"
                ? "Upload a supplier bill PDF or choose a sample to inspect preview"
                : "Verify parsed invoice details and items before converting to purchase bill"}
            </UIModalDescription>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
      </UIModalHeader>

      <UIModalBody className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 p-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* ── STEP 1: UPLOAD & SAMPLES ───────────────────────────────────── */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
                  : "border-border hover:border-emerald-500/60 hover:bg-surface-alt/60 bg-surface"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,text/plain"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center justify-center gap-2.5">
                <div className="size-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  {isLoading ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    <UploadCloud className="size-6" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-text">
                    {isLoading ? "Parsing purchase bill..." : "Click or drag supplier invoice PDF here"}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    Supports Marg ERP, Galaxy Pharma, Basant, and standard GST tax invoices
                  </div>
                </div>
                {!isLoading && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-surface-alt border border-border text-text-muted">
                    <FileText className="size-3" /> PDF up to 10MB
                  </span>
                )}
              </div>
            </div>

            {/* Quick Sample Invoices */}
            <div className="rounded-2xl border border-border bg-surface-alt/50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-500" />
                  Or Try Built-in Pharma Invoices (1-Click)
                </span>
                <span className="text-[10px] text-text-muted font-mono">Instant OCR Test</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSampleClick("galaxy-pharma")}
                  className="flex flex-col items-start p-2.5 rounded-xl border border-border/80 bg-surface hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition-all shadow-2xs group"
                >
                  <span className="text-[11px] font-bold text-text group-hover:text-emerald-600 truncate w-full">
                    Galaxy Pharma
                  </span>
                  <span className="text-[10px] text-text-muted font-mono mt-0.5">
                    INV01671 · 4 Items
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 mt-1">₹5,458.00</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSampleClick("agam-medical")}
                  className="flex flex-col items-start p-2.5 rounded-xl border border-border/80 bg-surface hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition-all shadow-2xs group"
                >
                  <span className="text-[11px] font-bold text-text group-hover:text-emerald-600 truncate w-full">
                    Agam Medical Agency
                  </span>
                  <span className="text-[10px] text-text-muted font-mono mt-0.5">
                    A003183 · 11 Items
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 mt-1">₹11,707.00</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSampleClick("basant-medical")}
                  className="flex flex-col items-start p-2.5 rounded-xl border border-border/80 bg-surface hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition-all shadow-2xs group"
                >
                  <span className="text-[11px] font-bold text-text group-hover:text-emerald-600 truncate w-full">
                    Basant Medical Stores
                  </span>
                  <span className="text-[10px] text-text-muted font-mono mt-0.5">
                    2627/R01252 · 28 Items
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 mt-1">₹45,646.00</span>
                </button>
              </div>
            </div>

            {/* Paste Raw Text Accordion */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setRawTextMode(!rawTextMode)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>{rawTextMode ? "▾ Hide raw invoice text paste" : "▸ Paste raw invoice text instead"}</span>
              </button>
              {rawTextMode && (
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={5}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste full text of invoice (e.g. copied from Marg ERP invoice or PDF)..."
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end">
                    <UIButton
                      size="sm"
                      variant="primary"
                      onClick={handlePastedTextSubmit}
                      disabled={isLoading || !pastedText.trim()}
                    >
                      Parse Text
                    </UIButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: STAGED PREVIEW ─────────────────────────────────────── */}
        {step === "preview" && parsedResult && (
          <div className="space-y-4">
            {/* Top Overview Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-2xl border border-border bg-surface-alt/70">
              {/* Supplier Info */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-text-muted" />
                  <span className="text-[10px] uppercase font-bold text-text-muted">Supplier</span>
                  {isSupplierMatched ? (
                    <UIBadge variant="solid" color="success" className="text-[9px] px-1.5 py-0 h-4">
                      Matched
                    </UIBadge>
                  ) : (
                    <UIBadge variant="soft" color="warning" className="text-[9px] px-1.5 py-0 h-4">
                      Suggested
                    </UIBadge>
                  )}
                </div>
                <div className="text-xs font-bold text-text truncate">
                  {supplier?.businessName || supplier?.name || "Imported Supplier"}
                </div>
                <div className="text-[11px] text-text-muted font-mono">
                  GSTIN: {supplier?.gstNumber || supplier?.gstin || "N/A"}
                </div>
              </div>

              {/* Invoice Metadata */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Hash className="size-3.5 text-text-muted" />
                  <span className="text-[10px] uppercase font-bold text-text-muted">Invoice No & Date</span>
                </div>
                <div className="text-xs font-bold text-text font-mono">
                  {parsedResult.invoice?.invoiceNo || "N/A"}
                </div>
                <div className="text-[11px] text-text-muted flex items-center gap-1">
                  <Calendar className="size-3" />
                  <span>Date: {parsedResult.invoice?.date || "Today"}</span>
                  {parsedResult.invoice?.dueDate && (
                    <span className="ml-1 text-[10px]">(Due: {parsedResult.invoice.dueDate})</span>
                  )}
                </div>
              </div>

              {/* Items & Status Summary */}
              <div className="space-y-1 md:text-right">
                <div className="text-[10px] uppercase font-bold text-text-muted">Parsed Items</div>
                <div className="text-xs font-bold text-text">
                  <span className="text-emerald-600 font-extrabold">{items.length} Items</span>
                  <span className="text-text-muted font-normal text-[11px] ml-1.5">
                    ({matchedCount} matched, {newProductCount} new)
                  </span>
                </div>
                <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  Total: ₹{(parsedResult.totals?.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Parsed Items Table */}
            <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xs">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs font-sans">
                  <thead className="sticky top-0 bg-surface-alt border-b border-border text-[10.5px] uppercase font-bold text-text-muted tracking-wider select-none z-10">
                    <tr>
                      <th className="py-2 px-2.5 text-left w-8">#</th>
                      <th className="py-2 px-2.5 text-left">Item Name</th>
                      <th className="py-2 px-2 text-left w-14">Pack</th>
                      <th className="py-2 px-2 text-left w-20">Batch</th>
                      <th className="py-2 px-2 text-center w-16">Expiry</th>
                      <th className="py-2 px-2 text-right w-14">Qty</th>
                      <th className="py-2 px-2 text-right w-12">Free</th>
                      <th className="py-2 px-2 text-right w-16">MRP</th>
                      <th className="py-2 px-2 text-right w-18">Rate</th>
                      <th className="py-2 px-2 text-center w-12">GST</th>
                      <th className="py-2 px-2.5 text-right w-20">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-surface-alt/40 transition-colors">
                        <td className="py-1.5 px-2.5 text-text-muted text-[11px] font-mono">{idx + 1}</td>
                        <td className="py-1.5 px-2.5">
                          <div className="font-semibold text-text truncate max-w-[220px]" title={item.name}>
                            {item.name}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {item.isMatched ? (
                              <span className="text-[9.5px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-1 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                                Matched Catalog
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                                New Item
                              </span>
                            )}
                            {item.hsn && (
                              <span className="text-[9.5px] text-text-muted font-mono">
                                HSN: {item.hsn}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-text-muted text-[11px]">{item.pack || "10's"}</td>
                        <td className="py-1.5 px-2 font-mono text-[11px] text-text font-medium">{item.batch || "-"}</td>
                        <td className="py-1.5 px-2 text-center font-mono text-[11px] text-text-muted">{item.expiry || "-"}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-text font-bold">{item.qty}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-text-muted text-[11px]">{item.freeQty || 0}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-text-muted text-[11px]">₹{item.mrp?.toFixed(2) || "0.00"}</td>
                        <td className="py-1.5 px-2 text-right font-mono text-text font-semibold text-emerald-700 dark:text-emerald-400">
                          ₹{item.rate?.toFixed(2) || "0.00"}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono text-[11px] text-text-muted">{item.gst}%</td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-text font-bold">
                          ₹{(item.amount || item.qty * item.rate)?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-border bg-surface-alt/40 text-xs">
              <div className="flex items-center gap-4 text-text-muted">
                <div>
                  <span>Subtotal: </span>
                  <span className="font-mono font-semibold text-text">
                    ₹{(parsedResult.totals?.subtotal || 0).toFixed(2)}
                  </span>
                </div>
                {parsedResult.totals?.discount > 0 && (
                  <div>
                    <span>Discount: </span>
                    <span className="font-mono font-semibold text-rose-600">
                      -₹{parsedResult.totals.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div>
                  <span>GST: </span>
                  <span className="font-mono font-semibold text-text">
                    ₹{(parsedResult.totals?.totalGst || (parsedResult.totals?.sgst || 0) + (parsedResult.totals?.cgst || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted font-medium">Grand Total:</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  ₹{(parsedResult.totals?.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
      </UIModalBody>

      <UIModalFooter className="flex items-center justify-between">
        {step === "preview" ? (
          <>
            <UIButton
              type="button"
              variant="outline"
              size="md"
              startIcon={<RotateCcw className="size-3.5" />}
              onClick={() => setStep("upload")}
            >
              Back to Upload
            </UIButton>
            <div className="flex items-center gap-2">
              <UIButton type="button" variant="ghost" size="md" onClick={handleClose}>
                Cancel
              </UIButton>
              <UIButton
                type="button"
                variant="primary"
                size="md"
                startIcon={<CheckCircle2 className="size-4 text-white" />}
                endIcon={<ArrowRight className="size-4 text-white" />}
                onClick={handleConvertToPurchaseBill}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
              >
                OK - Convert into Purchase Bill
              </UIButton>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-end w-full">
            <UIButton type="button" variant="outline" size="md" onClick={handleClose}>
              Cancel
            </UIButton>
          </div>
        )}
      </UIModalFooter>
    </UIModal>
  );
};

export default ImportPurchaseBillModal;
