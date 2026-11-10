// pharmaerp-web/src/features/purchases/components/ReturnBoxLabelModal.jsx

import React, { useState, useMemo, useEffect } from "react";
import {
  Package,
  Printer,
  Building2,
  Truck,
  ArrowRight,
  ShieldCheck,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Boxes,
} from "lucide-react";
import {
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
  UIButton,
  UISelect,
  UIBadge,
  UITabs,
} from "@/components/ui";
import useBranch from "@/features/branch/hooks/useBranch";
import { cn } from "@/lib/utils";

// Minimal vector Code39 barcode generator for reliable print rendering without external dependencies
const generateBarcodeSvg = (text) => {
  const clean = String(text).toUpperCase().replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g, "") || "PKG";
  const fullText = `*${clean}*`;
  
  // Code 39 character patterns (9 bars: 0=narrow, 1=wide)
  const patterns = {
    "0": "000110100", "1": "100100001", "2": "001100001", "3": "101100000",
    "4": "000110001", "5": "100110000", "6": "001110000", "7": "000100101",
    "8": "100100100", "9": "001100100", "A": "100001001", "B": "001001001",
    "C": "101001000", "D": "000011001", "E": "100011000", "F": "001011000",
    "G": "000001101", "H": "100001100", "I": "001001100", "J": "000011100",
    "K": "100000011", "L": "001000011", "M": "101000010", "N": "000010011",
    "O": "100010010", "P": "001010010", "Q": "000000111", "R": "100000110",
    "S": "001000110", "T": "000010110", "U": "110000001", "V": "011000001",
    "W": "111000000", "X": "010010001", "Y": "110010000", "Z": "011010000",
    "-": "010000101", ".": "110000100", " ": "011000100", "*": "010010100",
    "$": "010101000", "/": "010100010", "+": "010001010", "%": "000101010"
  };

  let bars = [];
  let x = 10;
  const narrow = 2;
  const wide = 5;
  const height = 44;

  for (let i = 0; i < fullText.length; i++) {
    const char = fullText[i];
    const pattern = patterns[char] || patterns["-"];
    for (let p = 0; p < pattern.length; p++) {
      const isBar = p % 2 === 0;
      const isWide = pattern[p] === "1";
      const w = isWide ? wide : narrow;
      if (isBar) {
        bars.push(`<rect x="${x}" y="0" width="${w}" height="${height}" fill="#000" />`);
      }
      x += w;
    }
    // inter-character gap
    x += narrow;
  }

  const totalWidth = x + 10;
  return `<svg viewBox="0 0 ${totalWidth} ${height + 14}" width="100%" height="52" xmlns="http://www.w3.org/2000/svg">
    ${bars.join("")}
    <text x="${totalWidth / 2}" y="${height + 11}" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle" fill="#000">${fullText}</text>
  </svg>`;
};

export const ReturnBoxLabelModal = ({
  isOpen,
  onClose,
  returnRecord,
}) => {
  const { currentBranch, branches = [] } = useBranch();

  // Local configuration states
  const [destinationBranchId, setDestinationBranchId] = useState("");
  const [boxCount, setBoxCount] = useState(1);
  const [printFormat, setPrintFormat] = useState("THERMAL_4X6");
  const [packageNotes, setPackageNotes] = useState("");
  const [previewBoxIndex, setPreviewBoxIndex] = useState(1);

  // Extract source & destination branch objects
  const originBranch = returnRecord?.branchId || currentBranch || {};
  const originBranchId = originBranch?._id || currentBranch?._id;

  // Filter available destination branches (exclude current facility)
  const eligibleDestinationBranches = useMemo(() => {
    return branches.filter((b) => String(b._id) !== String(originBranchId));
  }, [branches, originBranchId]);

  // Default to first eligible destination branch
  useEffect(() => {
    if (!destinationBranchId && eligibleDestinationBranches.length > 0) {
      setDestinationBranchId(eligibleDestinationBranches[0]._id);
    }
  }, [eligibleDestinationBranches, destinationBranchId]);

  const selectedDestinationBranch = useMemo(() => {
    return branches.find((b) => String(b._id) === String(destinationBranchId)) || eligibleDestinationBranches[0] || null;
  }, [branches, destinationBranchId, eligibleDestinationBranches]);

  // Extract supplier details
  const supplier =
    returnRecord?.supplier ||
    returnRecord?.supplierId ||
    {};
  const supplierName =
    supplier.businessName || supplier.name || returnRecord?.supplierName || "Target Supplier";
  const supplierGst = supplier.gstNumber || returnRecord?.supplierGst || "";
  const supplierAddress =
    typeof supplier.address === "string"
      ? supplier.address
      : [supplier.address?.city, supplier.address?.state].filter(Boolean).join(", ");

  // Consignment metadata
  const debitNoteNo =
    returnRecord?.debitNoteNo || returnRecord?.returnNo || "DN-RETURN";
  const returnMotive = returnRecord?.returnMotive || "SCRAP_EXPIRED";
  const items = returnRecord?.items || [];
  const totalUnits = items.reduce(
    (sum, it) => sum + (Number(it.returnQty) || 0),
    0
  );
  const totalBatches = items.length;

  const formatDate = (d) => {
    if (!d) return new Date().toLocaleDateString("en-IN");
    const parsed = new Date(d);
    return isNaN(parsed.getTime())
      ? String(d)
      : parsed.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  const handlePrint = () => {
    const printWin = window.open("", "_blank", "width=850,height=750");
    if (!printWin) {
      alert("Please allow popups to print box labels.");
      return;
    }

    const isThermal = printFormat === "THERMAL_4X6";

    let labelsHtml = "";
    for (let i = 1; i <= boxCount; i++) {
      const barcodeData = `${debitNoteNo}-B${i}`;
      const barcodeSvg = generateBarcodeSvg(barcodeData);

      labelsHtml += `
        <div class="label-box ${isThermal ? "thermal-label" : "a4-label"}">
          <!-- Header Bar -->
          <div class="header-strip">
            <div class="title-wrap">
              <span class="subhead">PHARMA CONSIGNMENT RETURN</span>
              <h1 class="main-title">CONSIGNMENT DISPATCH LABEL</h1>
            </div>
            <div class="box-badge">
              <span class="box-label">BOX</span>
              <span class="box-number">${i} OF ${boxCount}</span>
            </div>
          </div>

          <!-- Document Reference Bar -->
          <div class="ref-bar">
            <div>
              <span class="label-key">DEBIT NOTE / ORDER REF:</span>
              <span class="label-val mono">${debitNoteNo}</span>
            </div>
            <div>
              <span class="label-key">DATE:</span>
              <span class="label-val">${formatDate(returnRecord?.returnDate)}</span>
            </div>
            <div>
              <span class="label-key">MOTIVE:</span>
              <span class="label-val">${returnMotive}</span>
            </div>
          </div>

          <!-- FROM & TO Section -->
          <div class="routing-grid">
            <div class="route-block from-block">
              <span class="block-tag">FROM (ORIGIN FACILITY):</span>
              <div class="facility-name">${originBranch?.name || "Active Facility"}</div>
              <div class="facility-address">
                ${
                  typeof originBranch?.address === "string"
                    ? originBranch.address
                    : [
                        originBranch?.address?.street,
                        originBranch?.address?.city,
                        originBranch?.address?.state,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Origin Branch Address"
                }
              </div>
              <div class="tax-line">
                ${originBranch?.gstNumber ? `<span>GSTIN: <strong>${originBranch.gstNumber}</strong></span>` : ""}
                ${originBranch?.drugLicenseNumber ? `<span>DL: <strong>${originBranch.drugLicenseNumber}</strong></span>` : ""}
              </div>
            </div>

            <div class="route-block to-block">
              <span class="block-tag">TO (DESTINATION FACILITY / HUB):</span>
              <div class="facility-name">${selectedDestinationBranch?.name || "Target Company Branch"}</div>
              <div class="facility-address">
                ${
                  typeof selectedDestinationBranch?.address === "string"
                    ? selectedDestinationBranch.address
                    : [
                        selectedDestinationBranch?.address?.street,
                        selectedDestinationBranch?.address?.city,
                        selectedDestinationBranch?.address?.state,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Destination Hub Address"
                }
              </div>
              <div class="tax-line">
                ${selectedDestinationBranch?.gstNumber ? `<span>GSTIN: <strong>${selectedDestinationBranch.gstNumber}</strong></span>` : ""}
                ${selectedDestinationBranch?.phone ? `<span>Ph: <strong>${selectedDestinationBranch.phone}</strong></span>` : ""}
              </div>
            </div>
          </div>

          <!-- Supplier Creditor Banner -->
          <div class="supplier-strip">
            <span class="supplier-tag">RETURNED GOODS FOR SUPPLIER:</span>
            <div class="supplier-name">${supplierName}</div>
            <div class="supplier-meta">
              ${supplierGst ? `<span>GSTIN: <strong>${supplierGst}</strong></span>` : ""}
              ${supplierAddress ? `<span>Location: ${supplierAddress}</span>` : ""}
            </div>
          </div>

          <!-- Cargo Manifest Summary -->
          <div class="cargo-summary">
            <div class="cargo-stat">
              <span class="stat-num">${totalBatches}</span>
              <span class="stat-lbl">Batches / Items</span>
            </div>
            <div class="cargo-stat">
              <span class="stat-num">${totalUnits}</span>
              <span class="stat-lbl">Total Return Units</span>
            </div>
            <div class="cargo-stat">
              <span class="stat-num">BOX ${i} / ${boxCount}</span>
              <span class="stat-lbl">Consignment Partition</span>
            </div>
          </div>

          ${
            packageNotes
              ? `<div class="notes-strip"><strong>Transport Notes:</strong> ${packageNotes}</div>`
              : ""
          }

          <!-- Barcode Footer -->
          <div class="barcode-wrap">
            ${barcodeSvg}
          </div>
        </div>
      `;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Transport Box Labels - ${debitNoteNo}</title>
          <style>
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: #fff;
              color: #000;
            }
            @page {
              ${
                isThermal
                  ? "size: 4in 6in; margin: 0;"
                  : "size: A4 portrait; margin: 10mm;"
              }
            }
            .label-box {
              border: 2.5px solid #000;
              background: #fff;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              ${
                isThermal
                  ? `
                    width: 3.85in;
                    height: 5.85in;
                    margin: 0.075in auto;
                    page-break-after: always;
                    padding: 12px;
                  `
                  : `
                    width: 100%;
                    max-width: 180mm;
                    margin: 0 auto 16mm auto;
                    padding: 14px;
                    page-break-inside: avoid;
                    border-radius: 4px;
                  `
              }
            }
            .header-strip {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #000;
              padding-bottom: 6px;
              margin-bottom: 6px;
            }
            .subhead {
              font-size: 8px;
              font-weight: 800;
              letter-spacing: 0.08em;
              color: #444;
              text-transform: uppercase;
              display: block;
            }
            .main-title {
              margin: 0;
              font-size: 15px;
              font-weight: 900;
              letter-spacing: -0.02em;
            }
            .box-badge {
              border: 2px solid #000;
              background: #000;
              color: #fff;
              padding: 4px 8px;
              text-align: center;
              border-radius: 4px;
            }
            .box-label {
              font-size: 7px;
              font-weight: 700;
              letter-spacing: 0.1em;
              display: block;
            }
            .box-number {
              font-size: 13px;
              font-weight: 900;
              font-family: monospace;
            }
            .ref-bar {
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              border-bottom: 1px solid #000;
              padding-bottom: 5px;
              margin-bottom: 6px;
            }
            .label-key {
              font-weight: 700;
              color: #555;
              margin-right: 3px;
            }
            .label-val {
              font-weight: 800;
            }
            .mono {
              font-family: monospace;
            }
            .routing-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              border-bottom: 1.5px solid #000;
              padding-bottom: 8px;
              margin-bottom: 6px;
            }
            .route-block {
              border: 1px solid #444;
              padding: 6px;
              background: #fafafa;
              border-radius: 3px;
            }
            .block-tag {
              font-size: 8px;
              font-weight: 800;
              color: #555;
              text-transform: uppercase;
              display: block;
              margin-bottom: 2px;
            }
            .facility-name {
              font-size: 11.5px;
              font-weight: 800;
              line-height: 1.2;
              margin-bottom: 2px;
            }
            .facility-address {
              font-size: 8.5px;
              color: #333;
              line-height: 1.2;
              margin-bottom: 3px;
            }
            .tax-line {
              font-size: 8px;
              color: #222;
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
            }
            .supplier-strip {
              border: 1.5px solid #000;
              background: #f4f4f4;
              padding: 6px 8px;
              margin-bottom: 6px;
              border-radius: 3px;
            }
            .supplier-tag {
              font-size: 7.5px;
              font-weight: 800;
              letter-spacing: 0.05em;
              color: #444;
              display: block;
            }
            .supplier-name {
              font-size: 13px;
              font-weight: 900;
              color: #000;
              line-height: 1.2;
            }
            .supplier-meta {
              font-size: 8.5px;
              color: #333;
              display: flex;
              gap: 8px;
              margin-top: 2px;
            }
            .cargo-summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 4px;
              border: 1px solid #000;
              text-align: center;
              padding: 4px;
              margin-bottom: 6px;
            }
            .stat-num {
              display: block;
              font-size: 13px;
              font-weight: 900;
              font-family: monospace;
            }
            .stat-lbl {
              font-size: 7.5px;
              font-weight: 700;
              text-transform: uppercase;
              color: #555;
            }
            .notes-strip {
              font-size: 8.5px;
              border: 1px dashed #666;
              padding: 4px 6px;
              margin-bottom: 6px;
              background: #fff;
            }
            .barcode-wrap {
              text-align: center;
              padding-top: 2px;
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const previewBarcodeSvg = useMemo(() => {
    return generateBarcodeSvg(`${debitNoteNo}-B${previewBoxIndex}`);
  }, [debitNoteNo, previewBoxIndex]);

  return (
    <UIModal isOpen={isOpen} onClose={onClose} size="2xl">
      <UIModalHeader className="border-b border-border pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-primary-soft border border-primary/20 flex items-center justify-center text-primary">
            <Package className="size-5" />
          </div>
          <div>
            <UIModalTitle className="text-base font-bold text-text">
              Print Return Transport Box Labels
            </UIModalTitle>
            <UIModalDescription className="text-xs text-text-muted">
              Generate barcode stickers for routing packed consignment to company hub & supplier
            </UIModalDescription>
          </div>
        </div>
      </UIModalHeader>

      <UIModalBody className="py-4 space-y-4 max-h-[75vh] overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Packing Configuration (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. Destination Branch Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text flex items-center gap-1.5">
                <Building2 className="size-3.5 text-primary" />
                Final Selected Branch (Destination) *
              </label>
              <UISelect
                value={destinationBranchId}
                onChange={(val) => setDestinationBranchId(val)}
                options={eligibleDestinationBranches.map((b) => ({
                  value: b._id,
                  label: b.name,
                }))}
                placeholder="Select destination hub..."
                size="sm"
              />
              <span className="text-[11px] text-text-muted block">
                Goods will be routed from <strong className="text-text">{originBranch?.name || "Active Facility"}</strong> to this branch.
              </span>
            </div>

            {/* 2. Number of Packed Boxes (Stepper) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text flex items-center gap-1.5">
                <Boxes className="size-3.5 text-primary" />
                Total Number of Packed Boxes *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBoxCount((prev) => Math.max(1, prev - 1))}
                  className="size-8 rounded-lg border border-border bg-surface hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
                >
                  <Minus className="size-3.5" />
                </button>
                <div className="h-8 px-4 border border-border rounded-lg bg-surface font-mono font-bold text-sm text-text flex items-center justify-center min-w-16">
                  {boxCount}
                </div>
                <button
                  type="button"
                  onClick={() => setBoxCount((prev) => Math.min(99, prev + 1))}
                  className="size-8 rounded-lg border border-border bg-surface hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-text cursor-pointer transition-colors"
                >
                  <Plus className="size-3.5" />
                </button>
                <span className="text-xs text-text-muted font-medium ml-1">
                  {boxCount === 1 ? "1 label" : `${boxCount} sequential labels`}
                </span>
              </div>
            </div>

            {/* 3. Print Format Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text flex items-center gap-1.5">
                <Printer className="size-3.5 text-primary" />
                Print Sticker Format
              </label>
              <UITabs
                tabs={[
                  { id: "THERMAL_4X6", label: "4\" × 6\" Thermal Roll" },
                  { id: "A4_SHEET", label: "A4 Sheet (Standard)" },
                ]}
                activeTab={printFormat}
                onChange={(t) => setPrintFormat(t)}
                variant="segmented"
                size="xs"
              />
            </div>

            {/* 4. Optional Transport Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted block">
                Carton / Handling Instructions (Optional)
              </label>
              <input
                type="text"
                value={packageNotes}
                onChange={(e) => setPackageNotes(e.target.value)}
                placeholder="e.g. Fragile liquids / Keep refrigerated / Heavy"
                className="w-full h-8 px-2.5 border border-border rounded-lg bg-surface text-xs font-medium text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>

            {/* Information Card */}
            <div className="p-3 rounded-xl bg-surface-alt border border-border space-y-1 text-xs">
              <div className="font-semibold text-text flex items-center justify-between">
                <span>Consignment Reference</span>
                <span className="font-mono text-primary font-bold">{debitNoteNo}</span>
              </div>
              <div className="text-text-muted flex justify-between text-[11px]">
                <span>Total Return Units</span>
                <strong className="text-text">{totalUnits} units ({totalBatches} batches)</strong>
              </div>
              <div className="text-text-muted flex justify-between text-[11px]">
                <span>Target Creditor</span>
                <strong className="text-text truncate max-w-44">{supplierName}</strong>
              </div>
            </div>
          </div>

          {/* Right Column: Live Label Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-text flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                Live Label Preview
              </span>
              {boxCount > 1 && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-text-muted mr-1">Preview Box:</span>
                  {Array.from({ length: boxCount }, (_, i) => i + 1).slice(0, 5).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPreviewBoxIndex(num)}
                      className={cn(
                        "size-5.5 rounded text-[11px] font-bold flex items-center justify-center cursor-pointer transition-colors",
                        previewBoxIndex === num
                          ? "bg-primary text-primary-contrast"
                          : "bg-surface-alt hover:bg-surface-hover text-text-muted"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                  {boxCount > 5 && (
                    <span className="text-[11px] text-text-muted font-mono">+{boxCount - 5}</span>
                  )}
                </div>
              )}
            </div>

            {/* Sticker Preview Box */}
            <div className="border-2 border-text/80 bg-white text-black p-3.5 rounded-lg shadow-sm font-sans space-y-2.5 max-w-md mx-auto select-none">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                <div>
                  <span className="text-[8px] font-extrabold tracking-wider text-neutral-600 block uppercase">
                    Pharma Consignment Return
                  </span>
                  <div className="text-sm font-black tracking-tight leading-none text-black">
                    CONSIGNMENT DISPATCH LABEL
                  </div>
                </div>
                <div className="bg-black text-white px-2 py-0.5 rounded text-center shrink-0">
                  <span className="text-[7px] font-bold tracking-widest block leading-none">BOX</span>
                  <span className="text-xs font-mono font-black leading-none">
                    {previewBoxIndex} OF {boxCount}
                  </span>
                </div>
              </div>

              {/* Ref Line */}
              <div className="flex items-center justify-between text-[9px] border-b border-black/80 pb-1 font-mono">
                <span>
                  <strong className="font-sans text-neutral-600">REF:</strong> {debitNoteNo}
                </span>
                <span>
                  <strong className="font-sans text-neutral-600">DATE:</strong> {formatDate(returnRecord?.returnDate)}
                </span>
                <span className="font-sans font-bold text-neutral-800">
                  {returnMotive}
                </span>
              </div>

              {/* FROM & TO Grid */}
              <div className="grid grid-cols-2 gap-2 text-[9px] border-b border-black/80 pb-2">
                <div className="border border-neutral-400 p-1.5 rounded bg-neutral-50/70">
                  <span className="text-[7.5px] font-bold text-neutral-500 uppercase block mb-0.5">
                    FROM (Origin Facility):
                  </span>
                  <div className="font-extrabold text-[10px] text-black leading-tight truncate">
                    {originBranch?.name || "Active Facility"}
                  </div>
                  <div className="text-[8px] text-neutral-600 leading-tight truncate mt-0.5">
                    {typeof originBranch?.address === "string"
                      ? originBranch.address
                      : [originBranch?.address?.street, originBranch?.address?.city].filter(Boolean).join(", ") || "Origin Branch"}
                  </div>
                  {originBranch?.gstNumber && (
                    <div className="text-[7.5px] font-mono text-neutral-800 mt-1">
                      GST: {originBranch.gstNumber}
                    </div>
                  )}
                </div>

                <div className="border border-neutral-400 p-1.5 rounded bg-neutral-50/70">
                  <span className="text-[7.5px] font-bold text-neutral-500 uppercase block mb-0.5">
                    TO (Destination Hub):
                  </span>
                  <div className="font-extrabold text-[10px] text-black leading-tight truncate">
                    {selectedDestinationBranch?.name || "Target Company Branch"}
                  </div>
                  <div className="text-[8px] text-neutral-600 leading-tight truncate mt-0.5">
                    {typeof selectedDestinationBranch?.address === "string"
                      ? selectedDestinationBranch.address
                      : [selectedDestinationBranch?.address?.street, selectedDestinationBranch?.address?.city].filter(Boolean).join(", ") || "Destination Hub"}
                  </div>
                  {selectedDestinationBranch?.gstNumber && (
                    <div className="text-[7.5px] font-mono text-neutral-800 mt-1">
                      GST: {selectedDestinationBranch.gstNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Supplier Banner */}
              <div className="border border-black bg-neutral-100 p-1.5 rounded text-[9px]">
                <span className="text-[7.5px] font-bold text-neutral-600 uppercase block">
                  RETURN FOR SUPPLIER / CREDITOR:
                </span>
                <div className="font-black text-xs text-black leading-tight">
                  {supplierName}
                </div>
                {supplierGst && (
                  <div className="text-[8px] font-mono text-neutral-700 mt-0.5">
                    GSTIN: {supplierGst}
                  </div>
                )}
              </div>

              {/* Cargo Strip */}
              <div className="grid grid-cols-3 gap-1 text-center border border-black p-1 text-[9px]">
                <div>
                  <strong className="block font-mono text-[11px] leading-tight">{totalBatches}</strong>
                  <span className="text-[7px] text-neutral-600 uppercase font-bold">Batches</span>
                </div>
                <div>
                  <strong className="block font-mono text-[11px] leading-tight">{totalUnits}</strong>
                  <span className="text-[7px] text-neutral-600 uppercase font-bold">Units</span>
                </div>
                <div>
                  <strong className="block font-mono text-[11px] leading-tight">BOX {previewBoxIndex}/{boxCount}</strong>
                  <span className="text-[7px] text-neutral-600 uppercase font-bold">Box Index</span>
                </div>
              </div>

              {packageNotes && (
                <div className="text-[8.5px] border border-dashed border-neutral-400 p-1 rounded bg-neutral-50 text-neutral-800">
                  <strong>Notes:</strong> {packageNotes}
                </div>
              )}

              {/* Vector Barcode */}
              <div
                className="pt-1 flex justify-center"
                dangerouslySetInnerHTML={{ __html: previewBarcodeSvg }}
              />
            </div>
          </div>
        </div>
      </UIModalBody>

      <UIModalFooter className="border-t border-border pt-3">
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-text-muted">
            Format: <strong className="text-text">{printFormat === "THERMAL_4X6" ? "4\" × 6\" Thermal Label" : "A4 Sheet"}</strong> ({boxCount} {boxCount === 1 ? "box" : "boxes"})
          </span>
          <div className="flex items-center gap-2">
            <UIButton variant="outline" size="sm" onClick={onClose}>
              Cancel
            </UIButton>
            <UIButton
              variant="primary"
              size="sm"
              onClick={handlePrint}
              startIcon={<Printer className="size-4" />}
              className="font-bold shadow-xs px-4"
            >
              Print {boxCount} {boxCount === 1 ? "Label" : "Labels"}
            </UIButton>
          </div>
        </div>
      </UIModalFooter>
    </UIModal>
  );
};

export default ReturnBoxLabelModal;
