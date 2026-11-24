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
  Loader2,
  Receipt,
  UserSquare2,
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
  uiToast,
} from "@/components/ui";
import useBranch from "@/features/branch/hooks/useBranch";
import useCompany from "@/features/company/hooks/useCompany";
import branchService from "@/features/branch/services/branchService";
import purchaseReturnService from "../services/purchaseReturnService";
import { printPurchaseReturnDebitNote } from "../utils/printDebitNote";
import { cn } from "@/lib/utils";

// Minimal vector Code39 barcode generator for reliable thermal & desktop print rendering
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
    "$": "010101000", "/": "010100010", "+": "010001010", "%": "000101010",
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
  onDispatched,
}) => {
  const { currentBranch, branches = [], workspaceBranches = [], getWorkspaceBranches } = useBranch();
  const { companies = [], currentCompany, getWorkspaceCompanies } = useCompany();

  // Local state for fetched workspace branches & loading indicator
  const [availableBranches, setAvailableBranches] = useState(workspaceBranches || []);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  // Local state for enriched return record (auto-enriches missing sub-suppliers on saved returns)
  const [activeRecord, setActiveRecord] = useState(returnRecord);

  useEffect(() => {
    setActiveRecord(returnRecord);
    if (!isOpen || !returnRecord?._id) return;

    const hasMissingSub = (returnRecord.items || []).some((i) => !i.subSupplierName);
    if (hasMissingSub) {
      purchaseReturnService
        .getPurchaseReturnById(returnRecord._id)
        .then((res) => {
          const fresh = res.data?.data || res.data;
          if (fresh?._id) {
            setActiveRecord(fresh);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, returnRecord?._id]);

  const currentRecord = activeRecord || returnRecord;

  // Directly fetch all workspace branches (including all companies) on modal mount
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingBranches(true);

    branchService
      .getWorkspaceBranches({ includeAll: true, forShipping: true })
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setAvailableBranches(list);
        }
      })
      .catch((err) => {
        console.warn("Direct workspace branches fetch failed, using available store branches:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingBranches(false);
      });

    if (getWorkspaceCompanies) {
      getWorkspaceCompanies().catch(() => {});
    }
  }, [isOpen, getWorkspaceCompanies]);

  // Extract origin branch and company
  const originBranch = currentRecord?.branchId || currentBranch || {};
  const originBranchId = originBranch?._id || currentBranch?._id;

  const originCompanyId =
    currentRecord?.companyId?._id ||
    currentRecord?.companyId ||
    currentCompany?._id ||
    originBranch?.companyId?._id ||
    originBranch?.companyId;

  const originCompany = useMemo(() => {
    if (currentRecord?.companyId && typeof currentRecord.companyId === "object") {
      return currentRecord.companyId;
    }
    return (
      companies.find((c) => String(c._id) === String(originCompanyId)) ||
      currentCompany ||
      null
    );
  }, [companies, currentRecord?.companyId, originCompanyId, currentCompany]);

  // Filter other companies attached to workspace (excluding origin company)
  const otherCompanies = useMemo(() => {
    const list = companies.filter(
      (c) => String(c._id) !== String(originCompanyId)
    );
    return list.length > 0 ? list : companies;
  }, [companies, originCompanyId]);

  // State management
  const [destinationType, setDestinationType] = useState(
    currentRecord?.shippingDetails?.destinationType || "COMPANY_BRANCH"
  );
  const [destinationCompanyId, setDestinationCompanyId] = useState(
    currentRecord?.shippingDetails?.destinationCompanyId?._id ||
    currentRecord?.shippingDetails?.destinationCompanyId ||
    ""
  );
  const [destinationBranchId, setDestinationBranchId] = useState(
    currentRecord?.shippingDetails?.destinationBranchId?._id ||
    currentRecord?.shippingDetails?.destinationBranchId ||
    ""
  );
  const [courierName, setCourierName] = useState(
    currentRecord?.shippingDetails?.courierName || ""
  );
  const [trackingNo, setTrackingNo] = useState(
    currentRecord?.shippingDetails?.trackingNo || ""
  );
  const [boxCount, setBoxCount] = useState(
    currentRecord?.shippingDetails?.boxCount || 1
  );
  const [packageNotes, setPackageNotes] = useState(
    currentRecord?.shippingDetails?.packageNotes || ""
  );
  const [creditNoteNo, setCreditNoteNo] = useState(
    currentRecord?.creditNoteNo || ""
  );
  const [printFormat, setPrintFormat] = useState("THERMAL_4X6");
  const [previewTab, setPreviewTab] = useState("MASTER");
  const [packingMode, setPackingMode] = useState("SUB_SUPPLIER");
  const [isDispatching, setIsDispatching] = useState(false);

  // Sync modal state when switching between different return records
  useEffect(() => {
    if (!isOpen) return;
    const sd = currentRecord?.shippingDetails || {};
    setDestinationType(sd.destinationType || "COMPANY_BRANCH");
    setDestinationCompanyId(sd.destinationCompanyId?._id || sd.destinationCompanyId || "");
    setDestinationBranchId(sd.destinationBranchId?._id || sd.destinationBranchId || "");
    setCourierName(sd.courierName || "");
    setTrackingNo(sd.trackingNo || "");
    setBoxCount(sd.boxCount || 1);
    setPackageNotes(sd.packageNotes || "");
    setCreditNoteNo(currentRecord?.creditNoteNo || "");
    setPreviewTab("MASTER");
  }, [isOpen, currentRecord?._id, currentRecord?.creditNoteNo]);

  const isSupplierDispatch = destinationType === "SUPPLIER";

  // Default to first other company if unselected
  useEffect(() => {
    if (!destinationCompanyId && otherCompanies.length > 0) {
      setDestinationCompanyId(otherCompanies[0]._id);
    }
  }, [otherCompanies, destinationCompanyId]);

  // If a company is selected and no branches found yet, trigger targeted fetch
  useEffect(() => {
    if (!isOpen || !destinationCompanyId) return;

    const hasCompanyBranches = availableBranches.some((b) => {
      const bCompId = b.companyId?._id || b.companyId || b.company?._id || b.company;
      return String(bCompId) === String(destinationCompanyId);
    });

    if (!hasCompanyBranches) {
      branchService
        .getWorkspaceBranches({ companyId: destinationCompanyId, includeAll: true })
        .then((res) => {
          const list = res.data?.data || res.data || [];
          if (Array.isArray(list) && list.length > 0) {
            setAvailableBranches((prev) => {
              const prevIds = new Set(prev.map((b) => String(b._id)));
              const newItems = list.filter((b) => !prevIds.has(String(b._id)));
              return [...prev, ...newItems];
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen, destinationCompanyId, availableBranches]);

  // Combine all branch sources safely
  const allBranches = useMemo(() => {
    const map = new Map();
    (branches || []).forEach((b) => map.set(String(b._id), b));
    (workspaceBranches || []).forEach((b) => map.set(String(b._id), b));
    (availableBranches || []).forEach((b) => map.set(String(b._id), b));
    return Array.from(map.values());
  }, [branches, workspaceBranches, availableBranches]);

  // Filter branches for the chosen destination company (strictly excluding origin facility)
  const eligibleDestinationBranches = useMemo(() => {
    return allBranches.filter((b) => {
      // Exclude origin facility
      if (originBranchId && String(b._id) === String(originBranchId)) return false;

      // If destinationCompanyId selected, match company
      if (destinationCompanyId) {
        const bCompId =
          b.companyId?._id ||
          (typeof b.companyId === "string" ? b.companyId : null) ||
          b.company?._id ||
          (typeof b.company === "string" ? b.company : null);

        if (bCompId) {
          return String(bCompId) === String(destinationCompanyId);
        }
      }
      return true;
    });
  }, [allBranches, originBranchId, destinationCompanyId]);

  // Default destination branch when eligible branches change
  useEffect(() => {
    if (eligibleDestinationBranches.length > 0) {
      const exists = eligibleDestinationBranches.some(
        (b) => String(b._id) === String(destinationBranchId)
      );
      if (!exists) {
        setDestinationBranchId(eligibleDestinationBranches[0]._id);
      }
    } else {
      setDestinationBranchId("");
    }
  }, [eligibleDestinationBranches, destinationBranchId]);

  const selectedDestinationCompany = useMemo(() => {
    return companies.find((c) => String(c._id) === String(destinationCompanyId)) || null;
  }, [companies, destinationCompanyId]);

  const selectedDestinationBranch = useMemo(() => {
    return (
      allBranches.find((b) => String(b._id) === String(destinationBranchId)) ||
      eligibleDestinationBranches[0] ||
      null
    );
  }, [allBranches, destinationBranchId, eligibleDestinationBranches]);

  // Extract supplier details
  const supplier =
    (currentRecord?.shippingDetails?.destinationSupplierId &&
    typeof currentRecord.shippingDetails.destinationSupplierId === "object"
      ? currentRecord.shippingDetails.destinationSupplierId
      : null) ||
    (currentRecord?.supplier && typeof currentRecord.supplier === "object"
      ? currentRecord.supplier
      : null) ||
    (currentRecord?.supplierId && typeof currentRecord.supplierId === "object"
      ? currentRecord.supplierId
      : null) ||
    {};
  const supplierId =
    supplier?._id ||
    (typeof currentRecord?.supplierId === "string" ? currentRecord.supplierId : null) ||
    (typeof currentRecord?.shippingDetails?.destinationSupplierId === "string"
      ? currentRecord.shippingDetails.destinationSupplierId
      : null);
  const supplierName =
    supplier.businessName || supplier.name || currentRecord?.supplierName || "Target Supplier";
  const supplierGst = supplier.gstNumber || currentRecord?.supplierGst || "";
  const supplierPhone = supplier.mobile || supplier.phone || currentRecord?.supplierMobile || "";
  const supplierAddress =
    typeof supplier.address === "string"
      ? supplier.address
      : [
          supplier.address?.addressLine1 || supplier.address?.street,
          supplier.address?.city,
          supplier.address?.state,
          supplier.address?.pincode,
        ]
          .filter(Boolean)
          .join(", ");

  // Consignment metadata
  const debitNoteNo =
    currentRecord?.debitNoteNo || currentRecord?.returnNo || "DN-RETURN";
  const returnMotive = currentRecord?.returnMotive || "SCRAP_EXPIRED";
  const items = currentRecord?.items || [];
  const totalUnits = items.reduce(
    (sum, it) => sum + (Number(it.returnQty) || 0),
    0
  );
  const totalBatches = items.length;

  // Sub-Supplier Boxes Partitioning (1 small box per unique sub-supplier)
  const subSupplierBoxes = useMemo(() => {
    if (!items || items.length === 0) return [];

    const map = new Map();
    items.forEach((item) => {
      let subName = (
        item.subSupplierName ||
        item.subSupplier?.businessName ||
        item.subSupplier?.name ||
        ""
      ).trim();

      const mainName = String(supplierName || "").trim().toLowerCase();
      const originCompName = String(
        originCompany?.name ||
        originCompany?.legalName ||
        currentCompany?.name ||
        ""
      ).trim().toLowerCase();

      // If subName matches the origin company or the main supplier, it is NOT a valid sub-supplier
      if (
        subName &&
        (subName.toLowerCase() === mainName ||
          (originCompName && subName.toLowerCase() === originCompName))
      ) {
        subName = "";
      }

      const subId =
        subName && (item.subSupplierId || item.subSupplier?._id || subName.toLowerCase());

      const subGst =
        subName
          ? item.subSupplierGst || item.subSupplier?.gstNumber || ""
          : "";

      const key = subId ? String(subId) : "unassigned_direct";
      if (!map.has(key)) {
        map.set(key, {
          key,
          id: item.subSupplierId || item.subSupplier?._id || null,
          name: subName || "Direct / Main Supplier Stock",
          gstNumber: subGst || (subName ? "" : supplierGst),
          isSubSupplier: Boolean(subName),
          items: [],
          totalBatches: 0,
          totalUnits: 0,
        });
      }

      const group = map.get(key);
      group.items.push(item);
      group.totalBatches += 1;
      group.totalUnits += Number(item.returnQty) || 0;
    });

    return Array.from(map.values());
  }, [items, supplierGst]);

  const hasSubSuppliers = useMemo(() => {
    return subSupplierBoxes.some((b) => b.isSubSupplier) || subSupplierBoxes.length > 1;
  }, [subSupplierBoxes]);

  const isHierarchical = packingMode === "SUB_SUPPLIER" && subSupplierBoxes.length > 0;
  const effectiveBoxCount = isHierarchical ? subSupplierBoxes.length : Number(boxCount) || 1;

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

  const handlePrintDebitNote = () => {
    printPurchaseReturnDebitNote(currentRecord, {
      originBranch,
      originCompany,
      courierName: courierName?.trim() || "",
      trackingNo: trackingNo?.trim() || "",
      boxCount: effectiveBoxCount,
      mode: "DEBIT_NOTE",
    });
  };

  const handlePrintCreditNote = () => {
    printPurchaseReturnDebitNote(currentRecord, {
      originBranch,
      originCompany,
      courierName: courierName?.trim() || "",
      trackingNo: trackingNo?.trim() || "",
      boxCount: effectiveBoxCount,
      mode: "CREDIT_NOTE",
    });
  };

  const handlePrint = () => {
    const printWin = window.open("", "_blank", "width=850,height=750");
    if (!printWin) {
      alert("Please allow popups to print box labels.");
      return;
    }

    const isThermal = printFormat === "THERMAL_4X6";

    const toBlockHtml = isSupplierDispatch
      ? `
          <div class="route-block to-block">
            <span class="block-tag">TO (SUPPLIER / CREDITOR):</span>
            <div class="company-sub">DIRECT SUPPLIER RETURN</div>
            <div class="facility-name">${supplierName}</div>
            <div class="facility-address">${supplierAddress || "Supplier Address"}</div>
            <div class="tax-line">
              ${supplierGst ? `<span>GSTIN: <strong>${supplierGst}</strong></span>` : ""}
              ${supplierPhone ? `<span>Ph: <strong>${supplierPhone}</strong></span>` : ""}
            </div>
          </div>
        `
      : `
          <div class="route-block to-block">
            <span class="block-tag">TO (DESTINATION HUB):</span>
            <div class="company-sub">${selectedDestinationCompany?.name || "Target Company"}</div>
            <div class="facility-name">${selectedDestinationBranch?.name || "Target Hub / Branch"}</div>
            <div class="facility-address">
              ${
                typeof selectedDestinationBranch?.address === "string"
                  ? selectedDestinationBranch.address
                  : [
                      selectedDestinationBranch?.address?.street ||
                        selectedDestinationBranch?.address?.addressLine1,
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
        `;

    const fromBlockHtml = `
      <div class="route-block from-block">
        <span class="block-tag">FROM (ORIGIN FACILITY):</span>
        <div class="company-sub">${originCompany?.name || originCompany?.legalName || "Origin Company"}</div>
        <div class="facility-name">${originBranch?.name || "Active Facility"}</div>
        <div class="facility-address">
          ${
            typeof originBranch?.address === "string"
              ? originBranch.address
              : [
                  originBranch?.address?.street || originBranch?.address?.addressLine1,
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
    `;

    const middleBannerHtml = isSupplierDispatch
      ? courierName || trackingNo
        ? `
            <div class="supplier-strip">
              <span class="supplier-tag">COURIER / DISPATCH TRACKING:</span>
              <div class="supplier-name">${courierName || "Direct Transport"}</div>
              <div class="supplier-meta">
                ${trackingNo ? `<span>LR / Tracking No: <strong style="font-family:monospace;">${trackingNo}</strong></span>` : ""}
                <span>Mode: <strong>Direct to Supplier</strong></span>
              </div>
            </div>
          `
        : `
            <div class="supplier-strip">
              <span class="supplier-tag">DISPATCH CHANNEL:</span>
              <div class="supplier-name">DIRECT RETURN TO SUPPLIER</div>
              <div class="supplier-meta">
                <span>Debit Note: <strong>${debitNoteNo}</strong></span>
              </div>
            </div>
          `
      : `
          <div class="supplier-strip">
            <span class="supplier-tag">RETURNED GOODS FOR SUPPLIER:</span>
            <div class="supplier-name">${supplierName}</div>
            <div class="supplier-meta">
              ${supplierGst ? `<span>GSTIN: <strong>${supplierGst}</strong></span>` : ""}
              ${supplierAddress ? `<span>Location: ${supplierAddress}</span>` : ""}
              ${courierName ? `<span>Courier: <strong>${courierName}</strong></span>` : ""}
              ${trackingNo ? `<span>LR/AWB: <strong>${trackingNo}</strong></span>` : ""}
            </div>
          </div>
        `;

    let labelsHtml = "";

    if (isHierarchical) {
      // 1. MASTER OUTER CARTON LABEL
      const masterBarcodeSvg = generateBarcodeSvg(`${debitNoteNo}-MASTER`);
      labelsHtml += `
        <div class="label-box ${isThermal ? "thermal-label" : "a4-label"} master-label">
          <div class="header-strip">
            <div class="title-wrap">
              <span class="subhead">${isSupplierDispatch ? "DIRECT SUPPLIER RETURN" : "PHARMA MASTER CONSIGNMENT"}</span>
              <h1 class="main-title">MASTER CONSIGNMENT DISPATCH LABEL</h1>
            </div>
            <div class="box-badge master-badge">
              <span class="box-label">CARTON</span>
              <span class="box-number">MASTER (OUTER)</span>
            </div>
          </div>

          <div class="ref-bar">
            <div>
              <span class="label-key">DEBIT NOTE REF:</span>
              <span class="label-val mono">${debitNoteNo}</span>
            </div>
            <div>
              <span class="label-key">DATE:</span>
              <span class="label-val">${formatDate(currentRecord?.returnDate)}</span>
            </div>
            <div>
              <span class="label-key">MOTIVE:</span>
              <span class="label-val">${returnMotive}</span>
            </div>
          </div>

          <div class="routing-grid">
            ${fromBlockHtml}
            ${toBlockHtml}
          </div>

          ${middleBannerHtml}

          <!-- Inner Sub-Boxes Manifest -->
          <div class="manifest-strip">
            <div class="manifest-title">INNER SUB-BOXES MANIFEST (${subSupplierBoxes.length} BOXES PACKED INSIDE):</div>
            <table class="manifest-table">
              <thead>
                <tr>
                  <th style="width: 14%;">BOX #</th>
                  <th style="width: 50%;">SUB-SUPPLIER NAME</th>
                  <th style="width: 18%; text-align: center;">BATCHES</th>
                  <th style="width: 18%; text-align: right;">UNITS</th>
                </tr>
              </thead>
              <tbody>
                ${subSupplierBoxes
                  .map(
                    (b, idx) => `
                  <tr>
                    <td style="font-weight: 800; font-family: monospace;">BOX ${idx + 1}</td>
                    <td>
                      <strong style="font-size: 9.5px;">${b.name}</strong>
                      ${b.gstNumber ? `<div style="font-size: 7.5px; color: #555;">GST: ${b.gstNumber}</div>` : ""}
                    </td>
                    <td style="text-align: center; font-family: monospace; font-weight: 800;">${b.totalBatches}</td>
                    <td style="text-align: right; font-family: monospace; font-weight: 800;">${b.totalUnits}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="cargo-summary">
            <div class="cargo-stat">
              <span class="stat-num">${totalBatches}</span>
              <span class="stat-lbl">Total Batches</span>
            </div>
            <div class="cargo-stat">
              <span class="stat-num">${totalUnits}</span>
              <span class="stat-lbl">Total Units</span>
            </div>
            <div class="cargo-stat">
              <span class="stat-num">${subSupplierBoxes.length} SUB-BOXES</span>
              <span class="stat-lbl">Outer Master Carton</span>
            </div>
          </div>

          ${
            packageNotes
              ? `<div class="notes-strip"><strong>Transport Notes:</strong> ${packageNotes}</div>`
              : ""
          }

          <div class="barcode-wrap">
            ${masterBarcodeSvg}
          </div>
        </div>
      `;

      // 2. INNER SUB-BOX LABELS (1 PER UNIQUE SUB-SUPPLIER)
      subSupplierBoxes.forEach((box, i) => {
        const subBoxBarcodeSvg = generateBarcodeSvg(`${debitNoteNo}-S${i + 1}`);
        labelsHtml += `
          <div class="label-box ${isThermal ? "thermal-label" : "a4-label"} sub-box-label">
            <div class="header-strip">
              <div class="title-wrap">
                <span class="subhead">PHARMA INNER RETURN BOX</span>
                <h1 class="main-title">SUB-SUPPLIER RETURN BOX</h1>
              </div>
              <div class="box-badge sub-box-badge">
                <span class="box-label">SUB-BOX</span>
                <span class="box-number">${i + 1} OF ${subSupplierBoxes.length}</span>
              </div>
            </div>

            <div class="ref-bar">
              <div>
                <span class="label-key">CONSIGNMENT REF:</span>
                <span class="label-val mono">${debitNoteNo}</span>
              </div>
              <div>
                <span class="label-key">DATE:</span>
                <span class="label-val">${formatDate(currentRecord?.returnDate)}</span>
              </div>
              <div>
                <span class="label-key">MASTER CARTON:</span>
                <span class="label-val mono">${debitNoteNo}-MASTER</span>
              </div>
            </div>

            <div class="sub-supplier-highlight">
              <span class="subhead-small">SUB-SUPPLIER (INNER BOX RECIPIENT):</span>
              <div class="sub-supplier-name">${box.name}</div>
              <div class="sub-supplier-meta">
                ${box.gstNumber ? `<span>GSTIN: <strong>${box.gstNumber}</strong></span>` : ""}
                <span>Batches: <strong>${box.totalBatches}</strong></span>
                <span>Units: <strong>${box.totalUnits}</strong></span>
                <span>Parent Consignment: <strong>${debitNoteNo}</strong></span>
              </div>
            </div>

            <div class="routing-grid">
              ${fromBlockHtml}
              ${toBlockHtml}
            </div>

            <div class="cargo-summary">
              <div class="cargo-stat">
                <span class="stat-num">${box.totalBatches}</span>
                <span class="stat-lbl">Sub-Box Batches</span>
              </div>
              <div class="cargo-stat">
                <span class="stat-num">${box.totalUnits}</span>
                <span class="stat-lbl">Sub-Box Units</span>
              </div>
              <div class="cargo-stat">
                <span class="stat-num">BOX ${i + 1} / ${subSupplierBoxes.length}</span>
                <span class="stat-lbl">Inner Box</span>
              </div>
            </div>

            ${
              packageNotes
                ? `<div class="notes-strip"><strong>Transport Notes:</strong> ${packageNotes}</div>`
                : ""
            }

            <div class="barcode-wrap">
              ${subBoxBarcodeSvg}
            </div>
          </div>
        `;
      });
    } else {
      // Standard Sequential Labels
      for (let i = 1; i <= effectiveBoxCount; i++) {
        const barcodeData = `${debitNoteNo}-B${i}`;
        const barcodeSvg = generateBarcodeSvg(barcodeData);

        labelsHtml += `
          <div class="label-box ${isThermal ? "thermal-label" : "a4-label"}">
            <div class="header-strip">
              <div class="title-wrap">
                <span class="subhead">${isSupplierDispatch ? "DIRECT SUPPLIER RETURN" : "PHARMA CONSIGNMENT RETURN"}</span>
                <h1 class="main-title">${isSupplierDispatch ? "SUPPLIER DISPATCH LABEL" : "CONSIGNMENT DISPATCH LABEL"}</h1>
              </div>
              <div class="box-badge">
                <span class="box-label">BOX</span>
                <span class="box-number">${i} OF ${effectiveBoxCount}</span>
              </div>
            </div>

            <div class="ref-bar">
              <div>
                <span class="label-key">DEBIT NOTE REF:</span>
                <span class="label-val mono">${debitNoteNo}</span>
              </div>
              <div>
                <span class="label-key">DATE:</span>
                <span class="label-val">${formatDate(currentRecord?.returnDate)}</span>
              </div>
              <div>
                <span class="label-key">MOTIVE:</span>
                <span class="label-val">${returnMotive}</span>
              </div>
            </div>

            <div class="routing-grid">
              ${fromBlockHtml}
              ${toBlockHtml}
            </div>

            ${middleBannerHtml}

            <div class="cargo-summary">
              <div class="cargo-stat">
                <span class="stat-num">${totalBatches}</span>
                <span class="stat-lbl">Batches / Items</span>
              </div>
              <div class="cargo-stat">
                <span class="stat-num">${totalUnits}</span>
                <span class="stat-lbl">Total Units</span>
              </div>
              <div class="cargo-stat">
                <span class="stat-num">BOX ${i} / ${effectiveBoxCount}</span>
                <span class="stat-lbl">Consignment Partition</span>
              </div>
            </div>

            ${
              packageNotes
                ? `<div class="notes-strip"><strong>Transport Notes:</strong> ${packageNotes}</div>`
                : ""
            }

            <div class="barcode-wrap">
              ${barcodeSvg}
            </div>
          </div>
        `;
      }
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
            .master-badge {
              background: #000;
              border-color: #000;
            }
            .sub-box-badge {
              background: #1e3a8a;
              border-color: #1e3a8a;
            }
            .box-label {
              font-size: 7px;
              font-weight: 700;
              letter-spacing: 0.1em;
              display: block;
            }
            .box-number {
              font-size: 12px;
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
              margin-bottom: 1px;
            }
            .company-sub {
              font-size: 9px;
              font-weight: 800;
              color: #111;
              text-transform: uppercase;
              letter-spacing: 0.02em;
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
            .manifest-strip {
              border: 1.5px solid #000;
              padding: 4px 6px;
              background: #fafafa;
              margin-bottom: 6px;
              border-radius: 3px;
            }
            .manifest-title {
              font-size: 7.5px;
              font-weight: 800;
              letter-spacing: 0.05em;
              color: #333;
              margin-bottom: 3px;
              text-transform: uppercase;
            }
            .manifest-table, .item-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 8px;
            }
            .manifest-table th, .manifest-table td,
            .item-table th, .item-table td {
              border: 1px solid #777;
              padding: 2.5px 4px;
              text-align: left;
            }
            .manifest-table th, .item-table th {
              background: #eaeaea;
              font-weight: 800;
              color: #000;
            }
            .sub-supplier-highlight {
              border: 2px solid #000;
              background: #fffbe6;
              padding: 6px 8px;
              margin-bottom: 6px;
              border-radius: 3px;
            }
            .subhead-small {
              font-size: 7.5px;
              font-weight: 800;
              letter-spacing: 0.05em;
              color: #8c6b00;
              display: block;
            }
            .sub-supplier-name {
              font-size: 13px;
              font-weight: 900;
              color: #000;
              line-height: 1.2;
            }
            .sub-supplier-meta {
              font-size: 8px;
              color: #333;
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-top: 2px;
            }
            .items-wrap {
              border: 1px solid #000;
              margin-bottom: 6px;
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

  const handleDispatchAndPrint = async () => {
    if (!currentRecord?._id) {
      handlePrint();
      return;
    }

    if (isSupplierDispatch) {
      if (!supplierId) {
        uiToast.error("No supplier is linked to this Debit Note for direct supplier dispatch.");
        return;
      }
    } else if (!destinationBranchId) {
      uiToast.error("Please select a destination branch");
      return;
    }

    setIsDispatching(true);
    try {
      const payload = isSupplierDispatch
        ? {
            destinationType: "SUPPLIER",
            destinationCompanyId: null,
            destinationBranchId: null,
            destinationSupplierId: supplierId,
            courierName: courierName?.trim() || "",
            trackingNo: trackingNo?.trim() || "",
            boxCount: effectiveBoxCount,
            packageNotes: packageNotes?.trim() || undefined,
            creditNoteNo: creditNoteNo?.trim() || undefined,
          }
        : {
            destinationType: "COMPANY_BRANCH",
            destinationCompanyId: destinationCompanyId || null,
            destinationBranchId,
            destinationSupplierId: null,
            courierName: courierName?.trim() || "",
            trackingNo: trackingNo?.trim() || "",
            boxCount: effectiveBoxCount,
            packageNotes: packageNotes?.trim() || undefined,
            creditNoteNo: creditNoteNo?.trim() || undefined,
          };

      const res = await purchaseReturnService.dispatchReturnBox(currentRecord._id, payload);
      const updatedData = res.data?.data || res.data;
      const cnNo = updatedData?.creditNoteNo || creditNoteNo?.trim();

      uiToast.success(
        cnNo
          ? `Consignment dispatched & Credit Note #${cnNo} created for ${supplierName}!`
          : isSupplierDispatch
          ? `Consignment dispatched directly to supplier ${supplierName}!`
          : `Consignment dispatched to ${selectedDestinationBranch?.name || "destination hub"}!`
      );

      if (onDispatched) {
        onDispatched(updatedData);
      }

      handlePrint();
    } catch (err) {
      console.error("Failed to dispatch return box:", err);
      uiToast.error(
        err.response?.data?.message || err.message || "Failed to dispatch return box"
      );
    } finally {
      setIsDispatching(false);
    }
  };

  const activeSubBox = useMemo(() => {
    if (!isHierarchical || previewTab === "MASTER") return null;
    const idx = Number(previewTab);
    return subSupplierBoxes[idx] || subSupplierBoxes[0] || null;
  }, [isHierarchical, previewTab, subSupplierBoxes]);

  const previewBarcodeSvg = useMemo(() => {
    if (!isHierarchical) {
      return generateBarcodeSvg(`${debitNoteNo}-B${effectiveBoxCount > 1 ? previewTab : 1}`);
    }
    if (previewTab === "MASTER") {
      return generateBarcodeSvg(`${debitNoteNo}-MASTER`);
    }
    const idx = Number(previewTab);
    return generateBarcodeSvg(`${debitNoteNo}-S${idx + 1}`);
  }, [debitNoteNo, isHierarchical, previewTab, effectiveBoxCount]);

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
              Dispatch packed boxes to a workspace branch or directly to the supplier, print labels &amp; Debit Note
            </UIModalDescription>
          </div>
        </div>
      </UIModalHeader>

      <UIModalBody className="py-4 space-y-4 max-h-[75vh] overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Routing & Packing Configuration (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* Origin Facility Information Strip */}
            <div className="p-2.5 rounded-xl bg-surface-alt border border-border/80 space-y-1">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                Origin Consignment Dispatcher
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text truncate">
                  {originCompany?.name || "Origin Company"}
                </span>
                <UIBadge variant="soft" color="primary">
                  {originBranch?.name || "Active Facility"}
                </UIBadge>
              </div>
            </div>

            {/* Dispatch Destination Mode Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text flex items-center gap-1.5">
                <Truck className="size-3.5 text-primary" />
                Dispatch Destination *
              </label>
              <UITabs
                tabs={[
                  { id: "COMPANY_BRANCH", label: "Workspace Branch" },
                  { id: "SUPPLIER", label: "Direct to Supplier" },
                ]}
                activeTab={destinationType}
                onChange={(t) => setDestinationType(t)}
                variant="segmented"
                size="xs"
              />
            </div>

            {isSupplierDispatch ? (
              /* Direct to Supplier Pre-filled Card */
              <div className="p-3 rounded-xl bg-primary-soft/40 border border-primary/25 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                    <UserSquare2 className="size-3.5" />
                    Target Supplier
                  </span>
                  <UIBadge variant="soft" color="primary" size="xs">
                    From Debit Note
                  </UIBadge>
                </div>
                <div className="text-sm font-bold text-text leading-snug">
                  {supplierName}
                </div>
                {supplierGst && (
                  <div className="text-[11px] font-mono text-text-muted">
                    GSTIN: <strong className="text-text">{supplierGst}</strong>
                  </div>
                )}
                {supplierPhone && (
                  <div className="text-[11px] text-text-muted">
                    Phone: <strong className="text-text">{supplierPhone}</strong>
                  </div>
                )}
                {supplierAddress && (
                  <div className="text-[11px] text-text-muted leading-tight">
                    {supplierAddress}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 1. Destination Company Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-primary" />
                    Target Company (Workspace) *
                  </label>
                  <UISelect
                    value={destinationCompanyId}
                    onChange={(val) => {
                      setDestinationCompanyId(val);
                      setDestinationBranchId("");
                    }}
                    options={otherCompanies.map((c) => ({
                      value: c._id,
                      label: `${c.name || c.legalName} ${c.code ? `(${c.code})` : ""}`,
                    }))}
                    placeholder="Select workspace company..."
                    size="sm"
                  />
                </div>

                {/* 2. Destination Branch Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text flex items-center gap-1.5">
                    <Truck className="size-3.5 text-primary" />
                    Destination Branch / Hub *
                  </label>
                  <UISelect
                    value={destinationBranchId}
                    onChange={(val) => setDestinationBranchId(val)}
                    options={eligibleDestinationBranches.map((b) => ({
                      value: b._id,
                      label: b.branchCode ? `${b.name} (${b.branchCode})` : b.name,
                    }))}
                    placeholder={
                      isLoadingBranches
                        ? "Loading branches..."
                        : eligibleDestinationBranches.length === 0
                        ? "No branches available for selected company"
                        : "Select destination branch..."
                    }
                    size="sm"
                  />
                  <span className="text-[11px] text-text-muted block">
                    The box will be received at <strong className="text-text">{selectedDestinationBranch?.name || "Selected Branch"}</strong>.
                  </span>
                </div>
              </>
            )}

            {/* Optional Courier / Transport & LR / Tracking No. */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-muted block">
                  Courier / Transport (Optional)
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. BlueDart / Self"
                  className="w-full h-8 px-2.5 border border-border rounded-lg bg-surface text-xs font-medium text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-muted block">
                  LR / Tracking No. (Optional)
                </label>
                <input
                  type="text"
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value)}
                  placeholder="e.g. LR-984512"
                  className="w-full h-8 px-2.5 border border-border rounded-lg bg-surface text-xs font-mono font-medium text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
                />
              </div>
            </div>

            {/* Optional Supplier Credit Note # */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
                  <Receipt className="size-3 text-primary" />
                  Supplier Credit Note # (Optional)
                </label>
                <span className="text-[10px] text-primary font-medium">Auto-generated on dispatch if blank</span>
              </div>
              <input
                type="text"
                value={creditNoteNo}
                onChange={(e) => setCreditNoteNo(e.target.value)}
                placeholder="Leave blank to auto-generate (e.g. CN-BR01-2026-0001)"
                className="w-full h-8 px-2.5 border border-border rounded-lg bg-surface text-xs font-mono font-medium text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>

            {/* 3. Packaging & Box Partitioning */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Boxes className="size-3.5 text-primary" />
                  Consignment Packaging *
                </label>
                {hasSubSuppliers && (
                  <UIBadge variant="soft" color="primary" size="xs">
                    Sub-Supplier Mode
                  </UIBadge>
                )}
              </div>

              {hasSubSuppliers ? (
                <div className="space-y-2">
                  <UITabs
                    tabs={[
                      { id: "SUB_SUPPLIER", label: `By Sub-Supplier (${subSupplierBoxes.length} Boxes)` },
                      { id: "MANUAL", label: "Manual Box Count" },
                    ]}
                    activeTab={packingMode}
                    onChange={(t) => setPackingMode(t)}
                    variant="segmented"
                    size="xs"
                  />

                  {isHierarchical ? (
                    <div className="p-2.5 rounded-xl bg-surface-alt border border-border space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-text flex items-center gap-1">
                          <Package className="size-3 text-primary" />
                          Master Outer Carton
                        </span>
                        <UIBadge variant="outline" size="xs">1 Master Label</UIBadge>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                        <span className="font-semibold text-text flex items-center gap-1">
                          <Boxes className="size-3 text-primary" />
                          {subSupplierBoxes.length} Sub-Supplier Inner Boxes
                        </span>
                        <UIBadge variant="soft" color="success" size="xs">
                          {subSupplierBoxes.length} Inner Labels
                        </UIBadge>
                      </div>
                      <div className="space-y-1 pt-1 border-t border-border">
                        {subSupplierBoxes.map((box, idx) => (
                          <div
                            key={box.key || idx}
                            className="flex items-center justify-between text-[11px] text-text-muted"
                          >
                            <span className="truncate max-w-44 font-medium text-text">
                              Box {idx + 1}: {box.name}
                            </span>
                            <span className="font-mono text-[10px]">
                              {box.totalBatches} b / {box.totalUnits} u
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-1">
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
                  )}
                </div>
              ) : (
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
              )}
            </div>

            {/* 4. Print Format Picker */}
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

            {/* 5. Optional Transport Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted block">
                Carton Handling Instructions (Optional)
              </label>
              <input
                type="text"
                value={packageNotes}
                onChange={(e) => setPackageNotes(e.target.value)}
                placeholder="e.g. Fragile glass bottles / Keep refrigerated"
                className="w-full h-8 px-2.5 border border-border rounded-lg bg-surface text-xs font-medium text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>

            {/* Consignment Metadata */}
            <div className="p-3 rounded-xl bg-surface-alt border border-border space-y-1 text-xs">
              <div className="font-semibold text-text flex items-center justify-between">
                <span>Debit Note Reference</span>
                <span className="font-mono text-primary font-bold">{debitNoteNo}</span>
              </div>
              <div className="text-text-muted flex justify-between text-[11px]">
                <span>Total Units</span>
                <strong className="text-text">{totalUnits} units ({totalBatches} batches)</strong>
              </div>
              <div className="text-text-muted flex justify-between text-[11px]">
                <span>Target Supplier</span>
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

              {isHierarchical ? (
                <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] pb-1">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("MASTER")}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-bold shrink-0 cursor-pointer transition-colors",
                      previewTab === "MASTER"
                        ? "bg-primary text-primary-contrast"
                        : "bg-surface-alt hover:bg-surface-hover text-text-muted"
                    )}
                  >
                    📦 Master Outer
                  </button>
                  {subSupplierBoxes.map((box, idx) => (
                    <button
                      key={box.key || idx}
                      type="button"
                      onClick={() => setPreviewTab(idx)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] font-bold shrink-0 cursor-pointer transition-colors max-w-28 truncate",
                        previewTab === idx
                          ? "bg-primary text-primary-contrast"
                          : "bg-surface-alt hover:bg-surface-hover text-text-muted"
                      )}
                      title={`Box ${idx + 1}: ${box.name} (${box.totalUnits} units)`}
                    >
                      Box {idx + 1}: {box.name}
                    </button>
                  ))}
                </div>
              ) : (
                effectiveBoxCount > 1 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-text-muted mr-1">Preview Box:</span>
                    {Array.from({ length: effectiveBoxCount }, (_, i) => i + 1).slice(0, 5).map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPreviewTab(num)}
                        className={cn(
                          "size-5.5 rounded text-[11px] font-bold flex items-center justify-center cursor-pointer transition-colors",
                          previewTab === num
                            ? "bg-primary text-primary-contrast"
                            : "bg-surface-alt hover:bg-surface-hover text-text-muted"
                        )}
                      >
                        {num}
                      </button>
                    ))}
                    {effectiveBoxCount > 5 && (
                      <span className="text-[11px] text-text-muted font-mono">+{effectiveBoxCount - 5}</span>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Sticker Preview Box */}
            <div className="border-2 border-text/80 bg-white text-black p-3.5 rounded-lg shadow-sm font-sans space-y-2.5 max-w-md mx-auto select-none">
              {isHierarchical ? (
                previewTab === "MASTER" ? (
                  /* ─── LIVE PREVIEW: MASTER CONSIGNMENT LABEL ─── */
                  <>
                    <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                      <div>
                        <span className="text-[8px] font-extrabold tracking-wider text-neutral-600 block uppercase">
                          {isSupplierDispatch ? "Direct Supplier Return" : "Pharma Master Consignment"}
                        </span>
                        <div className="text-sm font-black tracking-tight leading-none text-black">
                          MASTER CONSIGNMENT DISPATCH LABEL
                        </div>
                      </div>
                      <div className="bg-black text-white px-2 py-0.5 rounded text-center shrink-0">
                        <span className="text-[7px] font-bold tracking-widest block leading-none">CARTON</span>
                        <span className="text-xs font-mono font-black leading-none">MASTER (OUTER)</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] border-b border-black/80 pb-1 font-mono">
                      <span>
                        <strong className="font-sans text-neutral-600">REF:</strong> {debitNoteNo}
                      </span>
                      <span>
                        <strong className="font-sans text-neutral-600">DATE:</strong> {formatDate(currentRecord?.returnDate)}
                      </span>
                      <span className="font-sans font-bold text-neutral-800">
                        {subSupplierBoxes.length} SUB-BOXES
                      </span>
                    </div>

                    {/* Routing Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[9px] border-b border-black/80 pb-2">
                      <div className="border border-neutral-400 p-1.5 rounded bg-neutral-50/70">
                        <span className="text-[7.5px] font-bold text-neutral-500 uppercase block mb-0.5">
                          FROM (Origin Facility):
                        </span>
                        <div className="text-[8px] font-bold text-neutral-700 truncate">
                          {originCompany?.name || originCompany?.legalName || "Origin Company"}
                        </div>
                        <div className="font-extrabold text-[10px] text-black leading-tight truncate">
                          {originBranch?.name || "Active Facility"}
                        </div>
                        <div className="text-[8px] text-neutral-600 leading-tight truncate mt-0.5">
                          {typeof originBranch?.address === "string"
                            ? originBranch.address
                            : [originBranch?.address?.street || originBranch?.address?.addressLine1, originBranch?.address?.city].filter(Boolean).join(", ") || "Origin Branch"}
                        </div>
                        {originBranch?.gstNumber && (
                          <div className="text-[7.5px] font-mono text-neutral-800 mt-1">
                            GST: {originBranch.gstNumber}
                          </div>
                        )}
                      </div>

                      {isSupplierDispatch ? (
                        <div className="border border-neutral-400 p-1.5 rounded bg-neutral-50/70">
                          <span className="text-[7.5px] font-bold text-neutral-500 uppercase block mb-0.5">
                            TO (Supplier / Creditor):
                          </span>
                          <div className="text-[8px] font-bold text-neutral-700 truncate">
                            DIRECT SUPPLIER RETURN
                          </div>
                          <div className="font-extrabold text-[10px] text-black leading-tight truncate">
                            {supplierName}
                          </div>
                          <div className="text-[8px] text-neutral-600 leading-tight truncate mt-0.5">
                            {supplierAddress || "Supplier Address"}
                          </div>
                          {supplierGst && (
                            <div className="text-[7.5px] font-mono text-neutral-800 mt-1">
                              GST: {supplierGst}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border border-neutral-400 p-1.5 rounded bg-neutral-50/70">
                          <span className="text-[7.5px] font-bold text-neutral-500 uppercase block mb-0.5">
                            TO (Destination Hub):
                          </span>
                          <div className="text-[8px] font-bold text-neutral-700 truncate">
                            {selectedDestinationCompany?.name || "Target Company"}
                          </div>
                          <div className="font-extrabold text-[10px] text-black leading-tight truncate">
                            {selectedDestinationBranch?.name || "Target Branch"}
                          </div>
                          <div className="text-[8px] text-neutral-600 leading-tight truncate mt-0.5">
                            {typeof selectedDestinationBranch?.address === "string"
                              ? selectedDestinationBranch.address
                              : [selectedDestinationBranch?.address?.street || selectedDestinationBranch?.address?.addressLine1, selectedDestinationBranch?.address?.city].filter(Boolean).join(", ") || "Destination Hub"}
                          </div>
                          {selectedDestinationBranch?.gstNumber && (
                            <div className="text-[7.5px] font-mono text-neutral-800 mt-1">
                              GST: {selectedDestinationBranch.gstNumber}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Inner Sub-Boxes Manifest Table Preview */}
                    <div className="border border-black bg-neutral-50/70 p-2 rounded text-[9px] space-y-1">
                      <div className="font-extrabold uppercase text-[7.5px] text-neutral-600 flex justify-between">
                        <span>Sub-Boxes Packed Inside ({subSupplierBoxes.length})</span>
                        <span>Batches / Units</span>
                      </div>
                      <div className="space-y-1">
                        {subSupplierBoxes.map((b, idx) => (
                          <div
                            key={b.key || idx}
                            className="flex items-center justify-between border-t border-neutral-200 pt-0.5"
                          >
                            <span className="font-bold text-neutral-900 truncate max-w-44">
                              Box {idx + 1}: {b.name}
                            </span>
                            <span className="font-mono text-neutral-700 shrink-0">
                              {b.totalBatches} b • {b.totalUnits} u
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cargo Strip */}
                    <div className="grid grid-cols-3 gap-1 text-center border border-black p-1 text-[9px]">
                      <div>
                        <strong className="block font-mono text-[11px] leading-tight">{totalBatches}</strong>
                        <span className="text-[7px] text-neutral-600 uppercase font-bold">Total Batches</span>
                      </div>
                      <div>
                        <strong className="block font-mono text-[11px] leading-tight">{totalUnits}</strong>
                        <span className="text-[7px] text-neutral-600 uppercase font-bold">Total Units</span>
                      </div>
                      <div>
                        <strong className="block font-mono text-[11px] leading-tight">{subSupplierBoxes.length} SUB-BOXES</strong>
                        <span className="text-[7px] text-neutral-600 uppercase font-bold">Consignment Box</span>
                      </div>
                    </div>

                    {packageNotes && (
                      <div className="text-[8.5px] border border-dashed border-neutral-400 p-1 rounded bg-neutral-50 text-neutral-800">
                        <strong>Notes:</strong> {packageNotes}
                      </div>
                    )}

                    <div
                      className="pt-1 flex justify-center"
                      dangerouslySetInnerHTML={{ __html: previewBarcodeSvg }}
                    />
                  </>
                ) : (
                  /* ─── LIVE PREVIEW: SUB-SUPPLIER INNER BOX LABEL ─── */
                  <>
                    <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                      <div>
                        <span className="text-[8px] font-extrabold tracking-wider text-neutral-600 block uppercase">
                          Pharma Inner Return Box
                        </span>
                        <div className="text-sm font-black tracking-tight leading-none text-black">
                          SUB-SUPPLIER RETURN BOX
                        </div>
                      </div>
                      <div className="bg-blue-900 text-white px-2 py-0.5 rounded text-center shrink-0">
                        <span className="text-[7px] font-bold tracking-widest block leading-none">SUB-BOX</span>
                        <span className="text-xs font-mono font-black leading-none">
                          {Number(previewTab) + 1} OF {subSupplierBoxes.length}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] border-b border-black/80 pb-1 font-mono">
                      <span>
                        <strong className="font-sans text-neutral-600">REF:</strong> {debitNoteNo}
                      </span>
                      <span>
                        <strong className="font-sans text-neutral-600">DATE:</strong> {formatDate(currentRecord?.returnDate)}
                      </span>
                      <span>
                        <strong className="font-sans text-neutral-600">MASTER:</strong> {debitNoteNo}-MASTER
                      </span>
                    </div>

                    {/* Sub-Supplier Highlight Strip */}
                    <div className="border-2 border-black bg-amber-50/90 p-2 rounded text-[9px]">
                      <span className="text-[7.5px] font-black text-amber-900 uppercase block tracking-wider">
                        SUB-SUPPLIER (INNER BOX RECIPIENT):
                      </span>
                      <div className="font-black text-sm text-black leading-tight">
                        {activeSubBox?.name || "Direct Supplier"}
                      </div>
                      <div className="flex items-center gap-3 text-[8px] font-mono text-neutral-800 mt-1">
                        {activeSubBox?.gstNumber && (
                          <span>GSTIN: <strong>{activeSubBox.gstNumber}</strong></span>
                        )}
                        <span>Batches: <strong>{activeSubBox?.totalBatches}</strong></span>
                        <span>Units: <strong>{activeSubBox?.totalUnits}</strong></span>
                      </div>
                    </div>

                    {/* Mini Routing Strip */}
                    <div className="grid grid-cols-2 gap-2 text-[8.5px] border-b border-black/80 pb-1.5">
                      <div className="truncate">
                        <span className="text-neutral-500 uppercase text-[7px] font-bold block">FROM:</span>
                        <strong className="truncate block text-neutral-900">{originBranch?.name || "Origin Branch"}</strong>
                      </div>
                      <div className="truncate">
                        <span className="text-neutral-500 uppercase text-[7px] font-bold block">TO:</span>
                        <strong className="truncate block text-neutral-900">
                          {isSupplierDispatch ? supplierName : selectedDestinationBranch?.name || "Destination Hub"}
                        </strong>
                      </div>
                    </div>

                    {/* Cargo Strip */}
                    <div className="grid grid-cols-3 gap-1 text-center border border-black p-1 text-[9px]">
                      <div>
                        <strong className="block font-mono text-[11px] leading-tight">{activeSubBox?.totalBatches || 0}</strong>
                        <span className="text-[7px] text-neutral-600 uppercase font-bold">Sub Batches</span>
                      </div>
                      <div>
                        <strong className="block font-mono text-[11px] leading-tight">{activeSubBox?.totalUnits || 0}</strong>
                        <span className="text-[7px] text-neutral-600 uppercase font-bold">Sub Units</span>
                      </div>
                      <div>
                        <strong className="block font-mono text-[11px] leading-tight">
                          BOX {Number(previewTab) + 1}/{subSupplierBoxes.length}
                        </strong>
                        <span className="text-[7px] text-neutral-600 uppercase font-bold">Inner Box</span>
                      </div>
                    </div>

                    {packageNotes && (
                      <div className="text-[8.5px] border border-dashed border-neutral-400 p-1 rounded bg-neutral-50 text-neutral-800">
                        <strong>Notes:</strong> {packageNotes}
                      </div>
                    )}

                    <div
                      className="pt-1 flex justify-center"
                      dangerouslySetInnerHTML={{ __html: previewBarcodeSvg }}
                    />
                  </>
                )
              ) : (
                /* ─── LIVE PREVIEW: STANDARD SEQUENTIAL BOX LABEL ─── */
                <>
                  <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                    <div>
                      <span className="text-[8px] font-extrabold tracking-wider text-neutral-600 block uppercase">
                        {isSupplierDispatch ? "Direct Supplier Return" : "Pharma Consignment Return"}
                      </span>
                      <div className="text-sm font-black tracking-tight leading-none text-black">
                        {isSupplierDispatch ? "SUPPLIER DISPATCH LABEL" : "CONSIGNMENT DISPATCH LABEL"}
                      </div>
                    </div>
                    <div className="bg-black text-white px-2 py-0.5 rounded text-center shrink-0">
                      <span className="text-[7px] font-bold tracking-widest block leading-none">BOX</span>
                      <span className="text-xs font-mono font-black leading-none">
                        {previewTab} OF {effectiveBoxCount}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] border-b border-black/80 pb-1 font-mono">
                    <span>
                      <strong className="font-sans text-neutral-600">REF:</strong> {debitNoteNo}
                    </span>
                    <span>
                      <strong className="font-sans text-neutral-600">DATE:</strong> {formatDate(currentRecord?.returnDate)}
                    </span>
                    <span className="font-sans font-bold text-neutral-800">
                      {returnMotive}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[9px] border-b border-black/80 pb-2">
                    <div className="border border-neutral-400 p-1.5 rounded bg-neutral-50/70">
                      <span className="text-[7.5px] font-bold text-neutral-500 uppercase block mb-0.5">
                        FROM (Origin Facility):
                      </span>
                      <div className="text-[8px] font-bold text-neutral-700 truncate">
                        {originCompany?.name || originCompany?.legalName || "Origin Company"}
                      </div>
                      <div className="font-extrabold text-[10px] text-black leading-tight truncate">
                        {originBranch?.name || "Active Facility"}
                      </div>
                      <div className="text-[8px] text-neutral-600 leading-tight truncate mt-0.5">
                        {typeof originBranch?.address === "string"
                          ? originBranch.address
                          : [originBranch?.address?.street || originBranch?.address?.addressLine1, originBranch?.address?.city].filter(Boolean).join(", ") || "Origin Branch"}
                      </div>
                      {originBranch?.gstNumber && (
                        <div className="text-[7.5px] font-mono text-neutral-800 mt-1">
                          GST: {originBranch.gstNumber}
                        </div>
                      )}
                    </div>

                    {isSupplierDispatch ? (
                      <div className="border border-neutral-400 p-1.5 rounded bg-neutral-50/70">
                        <span className="text-[7.5px] font-bold text-neutral-500 uppercase block mb-0.5">
                          TO (Supplier / Creditor):
                        </span>
                        <div className="text-[8px] font-bold text-neutral-700 truncate">
                          DIRECT SUPPLIER RETURN
                        </div>
                        <div className="font-extrabold text-[10px] text-black leading-tight truncate">
                          {supplierName}
                        </div>
                        <div className="text-[8px] text-neutral-600 leading-tight truncate mt-0.5">
                          {supplierAddress || "Supplier Address"}
                        </div>
                        {supplierGst && (
                          <div className="text-[7.5px] font-mono text-neutral-800 mt-1">
                            GST: {supplierGst}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="border border-neutral-400 p-1.5 rounded bg-neutral-50/70">
                        <span className="text-[7.5px] font-bold text-neutral-500 uppercase block mb-0.5">
                          TO (Destination Hub):
                        </span>
                        <div className="text-[8px] font-bold text-neutral-700 truncate">
                          {selectedDestinationCompany?.name || "Target Company"}
                        </div>
                        <div className="font-extrabold text-[10px] text-black leading-tight truncate">
                          {selectedDestinationBranch?.name || "Target Branch"}
                        </div>
                        <div className="text-[8px] text-neutral-600 leading-tight truncate mt-0.5">
                          {typeof selectedDestinationBranch?.address === "string"
                            ? selectedDestinationBranch.address
                            : [selectedDestinationBranch?.address?.street || selectedDestinationBranch?.address?.addressLine1, selectedDestinationBranch?.address?.city].filter(Boolean).join(", ") || "Destination Hub"}
                        </div>
                        {selectedDestinationBranch?.gstNumber && (
                          <div className="text-[7.5px] font-mono text-neutral-800 mt-1">
                            GST: {selectedDestinationBranch.gstNumber}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isSupplierDispatch ? (
                    <div className="border border-black bg-neutral-100 p-1.5 rounded text-[9px]">
                      <span className="text-[7.5px] font-bold text-neutral-600 uppercase block">
                        {courierName || trackingNo ? "COURIER / DISPATCH TRACKING:" : "DISPATCH CHANNEL:"}
                      </span>
                      <div className="font-black text-xs text-black leading-tight">
                        {courierName || "DIRECT RETURN TO SUPPLIER"}
                      </div>
                      <div className="flex items-center gap-3 text-[8px] font-mono text-neutral-700 mt-0.5">
                        {trackingNo && <span>LR / AWB: <strong>{trackingNo}</strong></span>}
                        <span>Mode: Direct Supplier</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-black bg-neutral-100 p-1.5 rounded text-[9px]">
                      <span className="text-[7.5px] font-bold text-neutral-600 uppercase block">
                        RETURN FOR SUPPLIER / CREDITOR:
                      </span>
                      <div className="font-black text-xs text-black leading-tight">
                        {supplierName}
                      </div>
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-[8px] font-mono text-neutral-700 mt-0.5">
                        {supplierGst && <span>GSTIN: {supplierGst}</span>}
                        {courierName && <span>Courier: {courierName}</span>}
                        {trackingNo && <span>LR: {trackingNo}</span>}
                      </div>
                    </div>
                  )}

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
                      <strong className="block font-mono text-[11px] leading-tight">BOX {previewTab}/{effectiveBoxCount}</strong>
                      <span className="text-[7px] text-neutral-600 uppercase font-bold">Box Index</span>
                    </div>
                  </div>

                  {packageNotes && (
                    <div className="text-[8.5px] border border-dashed border-neutral-400 p-1 rounded bg-neutral-50 text-neutral-800">
                      <strong>Notes:</strong> {packageNotes}
                    </div>
                  )}

                  <div
                    className="pt-1 flex justify-center"
                    dangerouslySetInnerHTML={{ __html: previewBarcodeSvg }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </UIModalBody>

      <UIModalFooter className="border-t border-border pt-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <span className="text-xs text-text-muted">
            Format: <strong className="text-text">{printFormat === "THERMAL_4X6" ? "4\" × 6\" Thermal Label" : "A4 Sheet"}</strong>
            {isHierarchical ? (
              <span> (<strong>1 Master Label</strong> + <strong>{subSupplierBoxes.length} Sub-Box Labels</strong>)</span>
            ) : (
              <span> ({effectiveBoxCount} {effectiveBoxCount === 1 ? "box" : "boxes"})</span>
            )}
          </span>
          <div className="flex items-center flex-wrap justify-end gap-2">
            <UIButton variant="outline" size="sm" onClick={onClose}>
              Cancel
            </UIButton>

            <UIButton
              variant="outline"
              size="sm"
              onClick={handlePrintDebitNote}
              startIcon={<Receipt className="size-4 text-primary" />}
              title="Print GST Section 34 Debit Note voucher"
            >
              Print Debit Note
            </UIButton>

            {(currentRecord?.creditNoteNo || creditNoteNo) && (
              <UIButton
                variant="outline"
                size="sm"
                onClick={handlePrintCreditNote}
                startIcon={<Receipt className="size-4 text-success" />}
                title="Print Supplier Credit Note voucher"
              >
                Print Credit Note
              </UIButton>
            )}

            {currentRecord?._id ? (
              <>
                <UIButton
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  startIcon={<Printer className="size-4" />}
                  title="Print labels without updating dispatch status"
                >
                  Print Labels Only
                </UIButton>

                <UIButton
                  variant="primary"
                  size="sm"
                  onClick={handleDispatchAndPrint}
                  disabled={isDispatching}
                  startIcon={
                    isDispatching ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Truck className="size-4" />
                    )
                  }
                  className="font-bold shadow-xs px-4"
                >
                  {isDispatching
                    ? "Dispatching..."
                    : isHierarchical
                    ? `Dispatch & Print (1 Master + ${subSupplierBoxes.length} Boxes)`
                    : isSupplierDispatch
                    ? `Dispatch to Supplier & Print (${effectiveBoxCount})`
                    : `Dispatch & Print ${effectiveBoxCount} ${effectiveBoxCount === 1 ? "Label" : "Labels"}`}
                </UIButton>
              </>
            ) : (
              <UIButton
                variant="primary"
                size="sm"
                onClick={handlePrint}
                startIcon={<Printer className="size-4" />}
                className="font-bold shadow-xs px-4"
              >
                {isHierarchical
                  ? `Print Labels (1 Master + ${subSupplierBoxes.length} Sub-Boxes)`
                  : `Print ${effectiveBoxCount} ${effectiveBoxCount === 1 ? "Label" : "Labels"}`}
              </UIButton>
            )}
          </div>
        </div>
      </UIModalFooter>
    </UIModal>
  );
};

export default ReturnBoxLabelModal;
