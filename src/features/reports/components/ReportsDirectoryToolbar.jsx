// src/features/reports/components/ReportsDirectoryToolbar.jsx

import React from "react";
import {
  Search,
  Calendar,
  Building2,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { UIInput, UISelect, UIButton } from "@/components/ui";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories (45 Reports)" },
  { value: "sales-reports", label: "Sales Reports" },
  { value: "purchase-reports", label: "Purchase Reports" },
  { value: "inventory-reports", label: "Inventory Reports" },
  { value: "customer-reports", label: "Customer Reports" },
  { value: "supplier-reports", label: "Supplier Reports" },
  { value: "financial-reports", label: "Financial Reports" },
  { value: "gst-reports", label: "GST Reports" },
  { value: "product-reports", label: "Product Reports" },
  { value: "custom-reports", label: "Custom Reports" },
];

const STORE_OPTIONS = [
  { value: "all", label: "All Stores" },
  { value: "main-store", label: "Main Store" },
  { value: "branch-north", label: "North Branch Pharmacy" },
  { value: "branch-central", label: "Central Medical Store" },
];

const DATE_RANGE_OPTIONS = [
  { value: "this-month", label: "01 Oct 2024 → 31 Oct 2024" },
  { value: "last-month", label: "01 Sep 2024 → 30 Sep 2024" },
  { value: "this-quarter", label: "01 Jul 2024 → 30 Sep 2024" },
  { value: "this-fy", label: "01 Apr 2024 → 31 Mar 2025" },
];

export const ReportsDirectoryToolbar = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStore,
  onStoreChange,
  selectedDateRange,
  onDateRangeChange,
  onResetFilters,
}) => {
  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedCategory !== "all" ||
    selectedStore !== "all" ||
    selectedDateRange !== "this-month";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 shrink-0 py-0.5">
      {/* ── Left: Prominent Search & Quick Category Filter ───────────────── */}
      <div className="flex items-center gap-2 flex-1 min-w-[280px]">
        {/* Search Input */}
        <div className="flex-1 max-w-md min-w-[220px]">
          <UIInput
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search reports (e.g. Sales, GST, Stock, Expiry, Profit)..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => onSearchChange("")}
          />
        </div>

        {/* Category Filter Select */}
        <div className="w-[180px] sm:w-[210px] hidden sm:block">
          <UISelect
            value={selectedCategory}
            onChange={(val) => onCategoryChange(val)}
            options={CATEGORY_OPTIONS}
            size="md"
          />
        </div>
      </div>

      {/* ── Right: Date Range & Store Selector (Matching Image 2 Top-Right) ── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Date Range Picker Dropdown */}
        <div className="w-[200px] sm:w-[220px]">
          <UISelect
            value={selectedDateRange}
            onChange={(val) => onDateRangeChange(val)}
            options={DATE_RANGE_OPTIONS}
            startIcon={<Calendar className="size-3.5 text-text-muted" />}
            size="md"
          />
        </div>

        {/* Store Selector */}
        <div className="w-[130px] sm:w-[145px]">
          <UISelect
            value={selectedStore}
            onChange={(val) => onStoreChange(val)}
            options={STORE_OPTIONS}
            startIcon={<Building2 className="size-3.5 text-text-muted" />}
            size="md"
          />
        </div>

        {/* Reset Button (only shown when filtered) */}
        {hasActiveFilters && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={onResetFilters}
            className="h-10 px-2.5 text-xs text-text-muted hover:text-text"
            title="Reset filters"
          >
            <RotateCcw className="size-3.5" />
          </UIButton>
        )}
      </div>
    </div>
  );
};

export default ReportsDirectoryToolbar;

