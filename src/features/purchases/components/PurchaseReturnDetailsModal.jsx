// src/features/purchases/components/PurchaseReturnDetailsModal.jsx

import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Printer,
  X,
  Building2,
  Truck,
  Calendar,
  Receipt,
  ShieldCheck,
  Package,
  Boxes,
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
  UIInfoCard,
  UISummaryCard,
  UIButton,
  UIIconButton,
  UIBadge,
  UIStatusIndicator,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  uiToast,
} from "@/components/ui";
import { ReturnBoxLabelModal } from "./ReturnBoxLabelModal";
import { printPurchaseReturnDebitNote } from "../utils/printDebitNote";
import purchaseReturnService from "../services/purchaseReturnService";
import useBranch from "@/features/branch/hooks/useBranch";

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const cleanBatchNo = (val) =>
  String(val || "")
    .replace(/\s*\[(EXPIRED|BROKEN|SCRAP|FRESH_RETURN|IN|INCOMING)\]/gi, "")
    .trim();

export const PurchaseReturnDetailsModal = ({
  isOpen,
  onClose,
  purchaseReturn,
  onUpdated,
}) => {
  const navigate = useNavigate();
  const { currentBranch, activeBranchId } = useBranch();
  const [showBoxLabelModal, setShowBoxLabelModal] = useState(false);
  const [isReceivingBox, setIsReceivingBox] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [showIngestConfirm, setShowIngestConfirm] = useState(false);

  // Local state for auto-enriching return record if items lack subSupplierName
  const [detailedReturn, setDetailedReturn] = useState(purchaseReturn);

  useEffect(() => {
    setDetailedReturn(purchaseReturn);
    if (!isOpen || !purchaseReturn?._id) return;

    const hasMissingSub = (purchaseReturn.items || []).some((i) => !i.subSupplierName);
    if (hasMissingSub) {
      purchaseReturnService
        .getPurchaseReturnById(purchaseReturn._id)
        .then((res) => {
          const fresh = res.data?.data || res.data;
          if (fresh?._id) {
            setDetailedReturn(fresh);
            if (onUpdated) {
              onUpdated(fresh);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, purchaseReturn?._id]);

  if (!isOpen || !purchaseReturn) return null;

  const activeReturn = detailedReturn || purchaseReturn;
  const supplier = activeReturn.supplierId || {};
  const branch = activeReturn.branchId || {};
  const shipping = activeReturn.shippingDetails || {};

  const destBranch = shipping.destinationBranchId || {};
  const destCompany = shipping.destinationCompanyId || {};

  const isDestinationFacility =
    shipping.destinationBranchId &&
    (String(destBranch._id || destBranch) === String(activeBranchId) ||
      String(destBranch._id || destBranch) === String(currentBranch?._id));

  const isCreationBranch =
    Boolean(branch._id || branch) &&
    (String(branch._id || branch) === String(activeBranchId) ||
      String(branch._id || branch) === String(currentBranch?._id));

  const isOtherBranch = !isCreationBranch;

  const handleReceiveBox = async () => {
    setIsReceivingBox(true);
    try {
      const res = await purchaseReturnService.receiveReturnBox(activeReturn._id);
      uiToast.success("Consignment box received successfully!");
      if (onUpdated) {
        onUpdated(res.data?.data || res.data);
      }
    } catch (err) {
      console.error("Failed to receive box:", err);
      uiToast.error(
        err.response?.data?.message || err.message || "Failed to mark box as received"
      );
    } finally {
      setIsReceivingBox(false);
    }
  };

  const isAlreadyIngested = Boolean(activeReturn.ingestionDetails?.ingestedToStore);

  const freshItems = (activeReturn.items || []).filter((item) => {
    const isBroken =
      item.sourceBin === "SCRAP_BROKEN" ||
      activeReturn.returnMotive === "BROKEN" ||
      (item.batchNo && item.batchNo.includes("[BROKEN]"));
    const isExpired =
      item.sourceBin === "SCRAP_EXPIRED" ||
      activeReturn.returnMotive === "EXPIRED" ||
      (item.batchNo && item.batchNo.includes("[EXPIRED]"));
    return !isBroken && !isExpired;
  });

  const hasFreshItems = freshItems.length > 0;
  const totalFreshQty = freshItems.reduce(
    (acc, i) => acc + (Number(i.returnQty) || 0),
    0
  );

  const handleIngestFreshStock = async () => {
    setIsIngesting(true);
    try {
      const res = await purchaseReturnService.ingestFreshStockToStore(
        activeReturn._id,
        activeBranchId || currentBranch?._id
      );
      const updated = res.data?.data || res.data;
      uiToast.success(
        `Successfully ingested ${totalFreshQty} fresh unit(s) into store shelf inventory!`
      );
      setShowIngestConfirm(false);
      if (updated?._id) {
        setDetailedReturn(updated);
        if (onUpdated) onUpdated(updated);
      }
    } catch (err) {
      console.error("Failed to ingest fresh stock:", err);
      uiToast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to ingest fresh stock into store"
      );
    } finally {
      setIsIngesting(false);
    }
  };

  const handlePrintDebitNote = () => {
    printPurchaseReturnDebitNote(activeReturn, {
      originBranch: branch,
      mode: "DEBIT_NOTE",
    });
  };

  const handlePrintCreditNote = () => {
    printPurchaseReturnDebitNote(activeReturn, {
      originBranch: branch,
      mode: "CREDIT_NOTE",
    });
  };

  const handlePrint = () => {
    handlePrintDebitNote();
  };

  return (
    <>
      <UIModal isOpen={isOpen} onClose={onClose} size="xl">
        <UIModalHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between w-full pr-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <UIModalTitle className="text-lg font-bold text-text">
                  Debit Note #{activeReturn.debitNoteNo || activeReturn.returnNo}
                </UIModalTitle>
                {activeReturn.creditNoteNo && (
                  <UIBadge variant="soft" color="success" className="font-mono font-bold text-xs">
                    Credit Note #{activeReturn.creditNoteNo}
                  </UIBadge>
                )}
                <UIStatusIndicator
                  status={
                    activeReturn.status === "CONFIRMED"
                      ? "success"
                      : activeReturn.status === "CANCELLED"
                      ? "error"
                      : "draft"
                  }
                  label={activeReturn.status}
                  variant="badge"
                  size="xs"
                />
                <UIBadge
                  variant="soft"
                  color={
                    activeReturn.returnMotive === "SELLABLE"
                      ? "primary"
                      : "warning"
                  }
                >
                  {activeReturn.returnMotive}
                </UIBadge>
              </div>
              <UIModalDescription className="text-xs text-text-muted">
                Issued on {formatDate(activeReturn.returnDate)} • Reference Memo: {activeReturn.returnNo}
                {activeReturn.creditNoteNo && (
                  <span> • Supplier Credit Note: <strong className="text-success font-mono font-bold">{activeReturn.creditNoteNo}</strong></span>
                )}
              </UIModalDescription>
            </div>
          </div>
        </UIModalHeader>

        <UIModalBody className="space-y-5 py-5 max-h-[75vh] overflow-y-auto">
          {/* Box Transport Banner (Inter-Company or Direct to Supplier) */}
          {shipping?.transitStatus === "IN_TRANSIT" && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Truck className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-text">
                      {shipping.destinationType === "SUPPLIER"
                        ? `Dispatched to Supplier (${shipping.boxCount || 1} ${shipping.boxCount === 1 ? "box" : "boxes"})`
                        : `Box Consignment In Transit (${shipping.boxCount || 1} ${shipping.boxCount === 1 ? "box" : "boxes"})`}
                    </span>
                    <UIBadge variant="soft" color="warning" size="xs">
                      {shipping.destinationType === "SUPPLIER" ? "SUPPLIER DISPATCH" : "IN TRANSIT"}
                    </UIBadge>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {shipping.destinationType === "SUPPLIER" ? (
                      <>
                        Dispatched directly to{" "}
                        <strong className="text-text">
                          {shipping.destinationSupplierId?.businessName ||
                            shipping.destinationSupplierId?.name ||
                            supplier.businessName ||
                            "Supplier"}
                        </strong>{" "}
                        on {formatDate(shipping.dispatchedAt)}
                      </>
                    ) : (
                      <>
                        Dispatched to{" "}
                        <strong className="text-text">{destBranch?.name || "Destination Branch"}</strong>
                        {destCompany?.name ? ` (${destCompany.name})` : ""} on {formatDate(shipping.dispatchedAt)}
                      </>
                    )}
                    {shipping.courierName ? ` • Courier: ${shipping.courierName}` : ""}
                    {shipping.trackingNo ? ` • LR/AWB: ${shipping.trackingNo}` : ""}
                    {shipping.packageNotes ? ` • Notes: ${shipping.packageNotes}` : ""}
                  </p>
                </div>
              </div>

              {shipping.destinationType !== "SUPPLIER" && (isDestinationFacility || true) && (
                <UIButton
                  variant="primary"
                  size="sm"
                  onClick={handleReceiveBox}
                  disabled={isReceivingBox}
                  startIcon={
                    isReceivingBox ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )
                  }
                  className="font-bold shrink-0 shadow-xs"
                >
                  {isReceivingBox ? "Receiving..." : "Receive Box"}
                </UIButton>
              )}
            </div>
          )}

          {shipping?.transitStatus === "RECEIVED" && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
              <div className="size-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-text">
                    Consignment Received ({shipping.boxCount || 1} {shipping.boxCount === 1 ? "box" : "boxes"})
                  </span>
                  <UIBadge variant="soft" color="success" size="xs">
                    RECEIVED
                  </UIBadge>
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Delivered to <strong className="text-text">{destBranch?.name || "Facility"}</strong>
                  {destCompany?.name ? ` (${destCompany.name})` : ""} on {formatDate(shipping.receivedAt)}
                </p>
              </div>
            </div>
          )}

          {/* Fresh Stock Ingested into Store Inventory Banner */}
          {isAlreadyIngested && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-text">
                      Fresh Stock Ingested into Store Inventory
                    </span>
                    <UIBadge variant="soft" color="success" size="xs">
                      INGESTED TO STORE
                    </UIBadge>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Restocked directly to{" "}
                    <strong className="text-text">
                      {activeReturn.ingestionDetails?.ingestedBranchId?.name ||
                        currentBranch?.name ||
                        branch?.name ||
                        "Store"}
                    </strong>
                    {activeReturn.ingestionDetails?.ingestedAt
                      ? ` on ${formatDate(activeReturn.ingestionDetails.ingestedAt)}`
                      : ""}
                    {activeReturn.ingestionDetails?.ingestedBy?.name
                      ? ` by ${activeReturn.ingestionDetails.ingestedBy.name}`
                      : ""}
                  </p>
                </div>
              </div>
              <UIBadge variant="soft" color="success" className="font-bold shrink-0">
                Stock Matrix Active
              </UIBadge>
            </div>
          )}

          {/* Info Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UIInfoCard
              title={supplier.businessName || "Supplier"}
              description="Creditor Details"
              icon={<Truck className="size-4.5" />}
              color="primary"
              variant="accent"
              actions={
                (supplier._id || activeReturn.supplierId) && (
                  <button
                    type="button"
                    onClick={() => {
                      const suppId = supplier._id || activeReturn.supplierId?._id || activeReturn.supplierId;
                      onClose?.();
                      navigate(`/finance/reports/supplier-ledger?supplierId=${suppId}`);
                    }}
                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                    title="Open this supplier's ledger statement"
                  >
                    View Ledger <ArrowUpRight className="size-3" />
                  </button>
                )
              }
              items={[
                { label: "GSTIN", value: supplier.gstNumber || "Unregistered" },
                { label: "Phone", value: supplier.mobile || "—" },
                { label: "Drug License", value: supplier.drugLicenseNumber || "—" },
              ]}
            />

            <UIInfoCard
              title={branch.name || "Main Warehouse"}
              description="Dispatch Facility & Accounting"
              icon={<Building2 className="size-4.5" />}
              color="success"
              variant="accent"
              items={[
                { label: "Transit Status", value: shipping?.transitStatus || "NOT_DISPATCHED" },
                { label: "Remarks", value: activeReturn.remarks || "No remarks" },
              ]}
            />
          </div>

          {/* Line Items Table */}
          <div className="border border-border rounded-2xl overflow-hidden shadow-xs">
            <UITable>
              <UITableHeader>
                <UITableRow className="bg-surface-alt/60">
                  <UITableHead className="py-2.5 px-3 text-center text-[11px] uppercase font-semibold text-text-muted w-10">
                    #
                  </UITableHead>
                  <UITableHead className="py-2.5 px-3 text-[11px] uppercase font-semibold text-text-muted">
                    Medicine & Pack
                  </UITableHead>
                  <UITableHead className="py-2.5 px-3 text-[11px] uppercase font-semibold text-text-muted font-mono">
                    Batch
                  </UITableHead>
                  <UITableHead className="py-2.5 px-3 text-center text-[11px] uppercase font-semibold text-text-muted">
                    Expiry
                  </UITableHead>
                  <UITableHead className="py-2.5 px-3 text-center text-[11px] uppercase font-semibold text-text-muted">
                    Qty
                  </UITableHead>
                  <UITableHead className="py-2.5 px-3 text-right text-[11px] uppercase font-semibold text-text-muted">
                    Rate
                  </UITableHead>
                  <UITableHead className="py-2.5 px-3 text-right text-[11px] uppercase font-semibold text-text-muted">
                    GST %
                  </UITableHead>
                  <UITableHead className="py-2.5 px-3 text-right text-[11px] uppercase font-semibold text-text-muted">
                    Amount
                  </UITableHead>
                </UITableRow>
              </UITableHeader>

              <UITableBody>
                {(activeReturn.items || []).map((item, idx) => (
                  <UITableRow key={idx} className="hover:bg-surface-hover transition-colors">
                    <td className="py-2.5 px-3 text-center text-text-muted font-medium text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-text text-xs">
                      {item.productName}
                      {item.pack && (
                        <span className="block text-[11px] text-text-muted font-normal">
                          {item.pack}
                        </span>
                      )}
                      {item.subSupplierName &&
                        item.subSupplierName.toLowerCase() !== String(branch?.companyId?.name || currentBranch?.companyId?.name || "").trim().toLowerCase() &&
                        item.subSupplierName.toLowerCase() !== String(supplier?.businessName || supplier?.name || "").trim().toLowerCase() && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 mt-1">
                            Sub: {item.subSupplierName}
                          </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-xs">
                      {String(item.batchNo || "").replace(/\s*\[(EXPIRED|BROKEN|SCRAP|FRESH_RETURN|IN|INCOMING)\]/gi, "").trim() || item.batchNo}
                    </td>
                    <td className="py-2.5 px-3 text-center text-text-muted text-xs">
                      {item.expiry || "-"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-xs">
                      {item.returnQty}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-xs">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-text-muted text-xs">
                      {item.gstPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-text text-xs">
                      {formatCurrency(item.totalAmount)}
                    </td>
                  </UITableRow>
                ))}
              </UITableBody>
            </UITable>
          </div>

          {/* Financial Calculation Breakdown */}
          <div className="flex justify-end">
            <div className="w-80">
              <UISummaryCard
                title="Debit Note Summary"
                items={[
                  {
                    label: "Taxable Subtotal",
                    value: formatCurrency(activeReturn.taxableSubtotal),
                  },
                  {
                    label: "Total GST (ITC Reversal)",
                    value: formatCurrency(activeReturn.totalGst),
                    isDeduction: true,
                  },
                  ...(activeReturn.roundOff
                    ? [
                        {
                          label: "Round Off",
                          value: formatCurrency(activeReturn.roundOff),
                        },
                      ]
                    : []),
                ]}
                total={{
                  label: "Grand Total Debit",
                  value: formatCurrency(activeReturn.grandTotal),
                }}
                variant="compact"
              />
            </div>
          </div>
        </UIModalBody>

        <UIModalFooter className="border-t border-border pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <UIButton
                variant="outline"
                size="sm"
                onClick={() => setShowBoxLabelModal(true)}
                startIcon={<Package className="size-4 text-primary" />}
                className="font-medium"
              >
                Print Return Transport Box Labels
              </UIButton>

              {hasFreshItems && !isAlreadyIngested && isOtherBranch && (
                <UIButton
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIngestConfirm(true)}
                  disabled={isIngesting}
                  startIcon={<Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />}
                  className="font-bold border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-xs"
                >
                  Ingest Fresh Stock into Store
                </UIButton>
              )}
            </div>

            <div className="flex items-center gap-2 justify-end">
              <UIButton variant="outline" size="sm" onClick={onClose}>
                Close
              </UIButton>
              <UIButton
                variant={activeReturn.creditNoteNo ? "outline" : "primary"}
                size="sm"
                onClick={handlePrintDebitNote}
                startIcon={<Printer className="size-4" />}
                className="font-medium shadow-xs"
              >
                Print Debit Note
              </UIButton>
              {activeReturn.creditNoteNo && (
                <UIButton
                  variant="primary"
                  size="sm"
                  onClick={handlePrintCreditNote}
                  startIcon={<Printer className="size-4" />}
                  className="font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Print Credit Note
                </UIButton>
              )}
            </div>
          </div>
        </UIModalFooter>
      </UIModal>

      {/* Confirmation Modal for Ingesting Fresh General Stock */}
      {showIngestConfirm && (
        <UIModal isOpen={showIngestConfirm} onClose={() => setShowIngestConfirm(false)} size="md">
          <UIModalHeader className="border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="size-4.5" />
              </div>
              <div>
                <UIModalTitle className="text-base font-bold text-text">
                  Ingest Fresh Stock into Store
                </UIModalTitle>
                <UIModalDescription className="text-xs text-text-muted">
                  Add fresh return items directly to shelf inventory (Stock Matrix)
                </UIModalDescription>
              </div>
            </div>
          </UIModalHeader>

          <UIModalBody className="py-4 space-y-4">
            <div className="p-3 bg-surface-alt/50 border border-border rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-text-muted">Target Facility:</span>
                <span className="font-bold text-text">
                  {currentBranch?.name || branch?.name || "Active Facility"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Eligible Fresh Items:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {freshItems.length} {freshItems.length === 1 ? "item" : "items"} ({totalFreshQty} units)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Debit Note:</span>
                <span className="font-mono font-medium text-text">
                  #{activeReturn.debitNoteNo || activeReturn.returnNo}
                </span>
              </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              <UITable>
                <UITableHeader>
                  <UITableRow className="bg-surface-alt/60">
                    <UITableHead className="py-2 px-2.5 text-[11px]">Product</UITableHead>
                    <UITableHead className="py-2 px-2.5 text-[11px] font-mono">Batch</UITableHead>
                    <UITableHead className="py-2 px-2.5 text-[11px] text-center">Exp</UITableHead>
                    <UITableHead className="py-2 px-2.5 text-[11px] text-right">Qty</UITableHead>
                  </UITableRow>
                </UITableHeader>
                <UITableBody>
                  {freshItems.map((item, idx) => (
                    <UITableRow key={idx}>
                      <td className="py-1.5 px-2.5 text-xs font-medium text-text">
                        {item.productName}
                        {item.pack && <span className="text-[10px] text-text-muted block">({item.pack})</span>}
                      </td>
                      <td className="py-1.5 px-2.5 text-xs font-mono">{cleanBatchNo(item.batchNo)}</td>
                      <td className="py-1.5 px-2.5 text-xs text-center text-text-muted">{item.expiry || "-"}</td>
                      <td className="py-1.5 px-2.5 text-xs font-bold text-right">{item.returnQty}</td>
                    </UITableRow>
                  ))}
                </UITableBody>
              </UITable>
            </div>

            <p className="text-[11px] text-text-muted leading-relaxed">
              These units will be credited immediately to the active store&apos;s active sellable shelf stock and can be billed or transferred right away.
            </p>
          </UIModalBody>

          <UIModalFooter className="border-t border-border pt-3">
            <div className="flex items-center justify-end gap-2 w-full">
              <UIButton variant="outline" size="sm" onClick={() => setShowIngestConfirm(false)} disabled={isIngesting}>
                Cancel
              </UIButton>
              <UIButton
                variant="primary"
                size="sm"
                onClick={handleIngestFreshStock}
                disabled={isIngesting}
                startIcon={isIngesting ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                {isIngesting ? "Ingesting..." : "Confirm & Ingest"}
              </UIButton>
            </div>
          </UIModalFooter>
        </UIModal>
      )}

      {/* Transport Box Labels Generator Modal */}
      {showBoxLabelModal && (
        <ReturnBoxLabelModal
          isOpen={showBoxLabelModal}
          onClose={() => setShowBoxLabelModal(false)}
          returnRecord={activeReturn}
          onDispatched={(updated) => {
            if (onUpdated) {
              onUpdated(updated);
            }
          }}
        />
      )}
    </>
  );
};

export default PurchaseReturnDetailsModal;
