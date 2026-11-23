// src/components/common/GroupByDropdown.jsx

import React from "react";
import { Layers, Building2, UserSquare2, Boxes, AlertOctagon, ListFilter } from "lucide-react";
import { UISelect } from "@/components/ui";

export const GROUP_BY_OPTIONS = [
  { value: "none", label: "Group By: None (Flat List)", icon: ListFilter },
  { value: "supplier", label: "Group By: Supplier", icon: UserSquare2 },
  { value: "branch", label: "Group By: Branch / Store", icon: Building2 },
  { value: "itemType", label: "Group By: Item Type", icon: Boxes },
  { value: "condition", label: "Group By: Condition (Expired/Broken)", icon: AlertOctagon },
];

/**
 * Reusable Group By Dropdown
 */
export const GroupByDropdown = ({
  value = "none",
  onChange,
  size = "sm",
  className = "w-56",
  disabled = false,
}) => {
  return (
    <div className={className}>
      <UISelect
        size={size}
        options={GROUP_BY_OPTIONS}
        value={value}
        onChange={(val) => {
          const resolvedVal = typeof val === "object" && val !== null ? val.value : val;
          if (onChange) onChange(resolvedVal || "none");
        }}
        placeholder="Group By..."
        disabled={disabled}
      />
    </div>
  );
};

/**
 * Helper to partition inventory items into groups
 * @param {Array} items
 * @param {string} groupBy
 * @returns {Array<{ key: string, title: string, subtitle?: string, items: Array, itemCount: number, totalQty: number, isIncoming?: boolean }>}
 */
export const groupInventoryItems = (items = [], groupBy = "none") => {
  if (!Array.isArray(items) || items.length === 0) return [];

  const calculateQty = (item) => {
    return Number(
      item.affectedQty ??
      item.returnQty ??
      item.transferQty ??
      item.scrapStock ??
      item.shelfStock ??
      item.scrapQty ??
      item.batchQty ??
      item.stock ??
      item.qty ??
      1
    ) || 0;
  };

  if (!groupBy || groupBy === "none") {
    const totalQty = items.reduce((acc, item) => acc + calculateQty(item), 0);
    return [
      {
        key: "all",
        title: "All Records",
        items,
        itemCount: items.length,
        totalQty,
      },
    ];
  }

  const map = new Map();

  items.forEach((item) => {
    let key = "other";
    let title = "Other";
    let subtitle = "";
    let isIncomingGroup = false;

    if (groupBy === "supplier") {
      const supId =
        item.supplierId ||
        item.supplier?._id ||
        (item.isIncoming ? `incoming-${item.sourceBranchId || "ext"}` : "unassigned");
      const supName =
        item.supplierName ||
        item.supplier?.businessName ||
        item.supplier?.name ||
        (item.isIncoming
          ? item.sourceBranchName
            ? `📦 Incoming: ${item.sourceBranchName}`
            : "📦 Incoming Inter-Branch"
          : "Unassigned Supplier");
      const supGst = item.supplierGst || item.supplier?.gstNumber || "";
      key = String(supId);
      title = supName;
      subtitle = supGst
        ? `GSTIN: ${supGst}`
        : item.isIncoming && item.sourceTransferOrderNo
        ? `Ref: #${item.sourceTransferOrderNo}`
        : "";
    } else if (groupBy === "branch") {
      if (item.isIncoming) {
        key = `incoming-${item.sourceBranchId || "ext"}`;
        title = `📦 Incoming Stock (From: ${item.sourceBranchName || "Inter-Branch Store"})`;
        subtitle = item.sourceTransferOrderNo ? `Ref: #${item.sourceTransferOrderNo}` : "Received Transfer";
        isIncomingGroup = true;
      } else {
        key = `current-${item.branchId || item.branch_id || "current"}`;
        title = `🏢 Current Branch (${item.branchName || "Active Facility"})`;
        subtitle = "Owned Stock";
      }
    } else if (groupBy === "itemType") {
      const cat = item.category || item.sourceBin || (item.scrapQty > 0 ? "scrap" : "shelf");
      if (cat === "shelf_expired") {
        key = "shelf_expired";
        title = "Shelf-Expired Items";
        subtitle = "Active on retail shelves";
      } else if (cat === "scrap_expired" || cat === "SCRAP_EXPIRED") {
        key = "scrap_expired";
        title = "Quarantined Scrap (Expired)";
        subtitle = "Quarantined in branch scrap bin";
      } else if (cat === "broken" || cat === "SCRAP_BROKEN") {
        key = "broken";
        title = "Quarantined Scrap (Broken/Damaged)";
        subtitle = "Damaged packaging / broken vials";
      } else {
        key = "scrap_general";
        title = "Scrap Bin Items";
        subtitle = "Quarantined stock";
      }
    } else if (groupBy === "condition") {
      const isFresh =
        item.category === "fresh_return" ||
        item.category === "shelf_fresh" ||
        item.scrapType === "FRESH_RETURN" ||
        (item.batchNo && (item.batchNo.includes("[FRESH_RETURN]") || item.batchNo.includes("[SCRAP]")));
      const isBroken =
        item.category === "broken" ||
        item.sourceBin === "SCRAP_BROKEN" ||
        item.scrapType === "BROKEN" ||
        (item.batchNo && item.batchNo.includes("[BROKEN]"));
      if (isFresh) {
        key = "fresh_return";
        title = "Fresh Return Condition";
        subtitle = "Intact, sellable returned medicine";
      } else if (isBroken) {
        key = "broken";
        title = "Broken / Damaged Condition";
        subtitle = "Physical damage or unsealed containers";
      } else {
        key = "expired";
        title = "Expired Condition";
        subtitle = "Past stated expiry date";
      }
    }

    if (!map.has(key)) {
      map.set(key, {
        key,
        title,
        subtitle,
        items: [],
        itemCount: 0,
        totalQty: 0,
        isIncoming: isIncomingGroup,
      });
    }

    const group = map.get(key);
    group.items.push(item);
    group.itemCount += 1;
    group.totalQty += calculateQty(item);
  });

  return Array.from(map.values());
};

export default GroupByDropdown;

