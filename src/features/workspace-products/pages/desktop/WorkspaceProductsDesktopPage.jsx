// src/features/workspace-products/pages/desktop/WorkspaceProductsDesktopPage.jsx

import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  Plus,
  Download,
  Upload,
  Eye,
  Edit3,
  Trash2,
  MoreVertical,
  XCircle,
} from "lucide-react";

import {
  UIButton,
  UIInput,
  UISelect,
  UIBadge,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  UITableEmpty,
  UITableLoading,
  UIInfiniteScroll,
  UITableScrollArea,
  UIDropdown,
  UIDropdownTrigger,
  UIDropdownMenu,
  UIDropdownItem,
  UIDropdownDivider,
  UIModal,
  UIModalHeader,
  UIModalTitle,
  UIModalDescription,
  UIModalBody,
  UIModalFooter,
  PermissionGate,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks";

const STATUS_SELECT_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export const WorkspaceProductsDesktopPage = ({
  products = [],
  dashboardStats = [],
  filters = { search: "", productType: "all", status: "all" },
  activeFilterChips = [],
  productTypeOptions = [],

  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  handleLoadMore,
  hasError = false,
  error = null,
  message = null,

  totalProducts = 0,

  handleFilterChange,
  handleSearchChange,
  handleRemoveFilter,
  handleClearFilters,
  handleRefresh,
  handleCreateProduct,
  handleViewProductDetails,
  handleEditProduct,
  handleDeleteProduct,
  handleImportWorkspaceProducts,
  handleOpenImportGst,
  clearMessage,
}) => {
  const tableContainerRef = useRef(null);
  const { can } = usePermission();

  // Delete Confirmation Modal state
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await handleDeleteProduct(productToDelete);
      setProductToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.productType !== "all" ||
    filters.status !== "all";

  // Stat card icon resolution
  const statIcons = {
    total_products: <Boxes className="size-4.5 stroke-[1.8]" />,
    active_products: <CheckCircle2 className="size-4.5 stroke-[1.8]" />,
    inactive_products: <AlertTriangle className="size-4.5 stroke-[1.8]" />,
    categories_count: <Layers className="size-4.5 stroke-[1.8]" />,
  };

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-alt border border-primary/30 shadow-lg text-text text-xs sm:text-sm font-medium"
          >
            <CheckCircle2 className="size-4.5 text-primary shrink-0" />
            <span>{message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Compact 4-Card Statistics Grid ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {dashboardStats.map((stat) => {
          const isWarning = stat.colorVariant === "warning";
          const isSuccess = stat.colorVariant === "success";
          const isInfo = stat.colorVariant === "info";

          const iconContainerClass = isSuccess
            ? "bg-success-soft text-success"
            : isWarning
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : isInfo
            ? "bg-primary/10 text-primary"
            : "bg-info-soft text-info";

          return (
            <div
              key={stat.id}
              className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors"
            >
              <div
                className={cn(
                  "size-9 rounded-lg flex items-center justify-center shrink-0",
                  iconContainerClass
                )}
              >
                {statIcons[stat.id] || <Boxes className="size-4.5 stroke-[1.8]" />}
              </div>
              <div className="min-w-0">
                <div className="text-[11.5px] font-medium text-text-muted truncate">
                  {stat.title}
                </div>
                <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                  {typeof stat.value === "number" ? stat.value.toLocaleString("en-IN") : stat.value || 0}
                </div>
                <div className="text-[10px] text-text-muted truncate mt-0.5">
                  {stat.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 2. Streamlined Single-Row Toolbar ────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Compact Search Input */}
        <div className="w-[240px] sm:w-[280px] lg:w-[320px]">
          <UIInput
            type="text"
            value={filters.search || ""}
            onChange={handleSearchChange}
            placeholder="Search custom products by name, SKU..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange("")}
            className="w-full"
          />
        </div>

        {/* Product Type / Category Select */}
        <div className="w-[170px] sm:w-[195px]">
          <UISelect
            name="productType"
            value={filters.productType}
            onChange={(val) => handleFilterChange({ productType: val })}
            options={productTypeOptions}
            placeholder="All Categories"
            size="md"
          />
        </div>

        {/* Status Select */}
        <div className="w-[130px] sm:w-[150px]">
          <UISelect
            name="status"
            value={filters.status}
            onChange={(val) => handleFilterChange({ status: val })}
            options={STATUS_SELECT_OPTIONS}
            placeholder="All Status"
            size="md"
          />
        </div>

        {/* Quick Reset */}
        {hasActiveFilters && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleClearFilters}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
            className="h-10 px-2 text-xs text-text-muted hover:text-text"
            title="Reset all filters"
          >
            Reset
          </UIButton>
        )}

        {/* Toolbar Action Cluster (Right) */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Refresh Button */}
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={handleRefresh}
            className="h-10 w-10 p-0 text-text-muted hover:text-text"
            title="Refresh custom products"
          >
            <RefreshCw
              className={cn(
                "size-4 text-text-muted hover:text-primary",
                isLoading && "animate-spin text-primary"
              )}
            />
          </UIButton>

          {/* Import Stock Button */}
          <PermissionGate permission="product:create">
            <UIButton
              type="button"
              variant="outline"
              size="md"
              startIcon={<Download className="size-3.5 text-text-muted" />}
              onClick={handleImportWorkspaceProducts}
              className="h-10 px-3 text-xs font-semibold hidden sm:inline-flex"
              title="Import Inventory from Excel"
            >
              Import Stock
            </UIButton>
          </PermissionGate>

          {/* Import GST Button */}
          <PermissionGate permission="product:create">
            <UIButton
              type="button"
              variant="outline"
              size="md"
              startIcon={<Upload className="size-3.5 text-text-muted" />}
              onClick={handleOpenImportGst}
              className="h-10 px-3 text-xs font-semibold hidden md:inline-flex"
              title="Import GST Masters"
            >
              Import GST
            </UIButton>
          </PermissionGate>

          {/* Create Custom Product Button */}
          <PermissionGate permission="product:create">
            <UIButton
              type="button"
              variant="primary"
              size="md"
              startIcon={<Plus className="size-3.5" />}
              onClick={handleCreateProduct}
              className="h-10 px-3.5 text-xs font-semibold shadow-xs"
            >
              Create Product
            </UIButton>
          </PermissionGate>
        </div>
      </div>

      {/* ── Active Filter Chips (if any) ────────────────────── */}
      {activeFilterChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {activeFilterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => handleRemoveFilter(chip.key)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-alt px-2.5 py-0.5 text-[11px] font-medium text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
            >
              <span>{chip.label}</span>
              <XCircle className="size-3 text-text-muted/70 hover:text-rose-500" />
            </button>
          ))}
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-[11px] font-semibold text-primary hover:underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ────── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
        <UITableScrollArea containerRef={tableContainerRef}>
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full"
          >
            {/* Sticky Table Header */}
            <UITableHeader
              sticky
              className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs border-b border-border"
            >
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text-muted uppercase tracking-wider bg-surface-alt/70 h-10">
                <UITableHead sticky className="min-w-[240px]">Product Name & SKU</UITableHead>
                <UITableHead sticky className="min-w-[130px]">Category</UITableHead>
                <UITableHead sticky className="min-w-[170px]">Manufacturer / Marketer</UITableHead>
                <UITableHead sticky className="min-w-[120px]">Dosage Form</UITableHead>
                <UITableHead sticky className="min-w-[120px]">Strength</UITableHead>
                <UITableHead sticky align="center" className="min-w-[100px]">Status</UITableHead>
                <UITableHead sticky align="right" className="min-w-[70px]">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading && products.length === 0 ? (
                <UITableLoading rows={8} columns={7} />
              ) : products.length === 0 ? (
                <UITableEmpty
                  colSpan={7}
                  title="No custom products found"
                  description={
                    hasActiveFilters
                      ? "No custom products match your active search or filters. Try clearing your search parameters."
                      : "No local workspace products created yet."
                  }
                  action={
                    hasActiveFilters ? (
                      <UIButton
                        variant="secondary"
                        size="sm"
                        onClick={handleClearFilters}
                      >
                        Clear Filters
                      </UIButton>
                    ) : (
                      <PermissionGate permission="product:create">
                        <UIButton
                          variant="primary"
                          size="sm"
                          startIcon={<Plus className="size-3.5" />}
                          onClick={handleCreateProduct}
                        >
                          Create Custom Product
                        </UIButton>
                      </PermissionGate>
                    )
                  }
                />
              ) : (
                products.map((product) => {
                  const isActive = product.displayStatus === "active";

                  return (
                    <UITableRow
                      key={product._id}
                      onClick={() => handleViewProductDetails(product)}
                      className="last:border-b-0 group cursor-pointer transition-colors hover:bg-surface-hover/70 h-13"
                    >
                      {/* Product Name & SKU / Notes */}
                      <UITableCell className="py-2.5">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-text truncate hover:text-primary transition-colors text-xs sm:text-sm leading-tight">
                            {product.displayName || "—"}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-text-muted truncate mt-0.5">
                            <span className="text-[11px] font-mono font-bold text-text/80">
                              {product.displaySku || "—"}
                            </span>
                            {product.notes ? (
                              <>
                                <span className="text-text-muted/40 font-sans">•</span>
                                <span className="text-[11px] text-text-muted truncate max-w-[180px]">
                                  {product.notes}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </UITableCell>

                      {/* Category */}
                      <UITableCell className="py-2.5">
                        <UIBadge
                          variant="secondary"
                          className="text-[11px] font-medium"
                        >
                          {product.displayCategory || "Custom"}
                        </UIBadge>
                      </UITableCell>

                      {/* Manufacturer / Marketer */}
                      <UITableCell className="py-2.5">
                        <span className="text-xs text-text-muted truncate block max-w-[170px]">
                          {product.displayManufacturer || "—"}
                        </span>
                      </UITableCell>

                      {/* Dosage Form */}
                      <UITableCell className="py-2.5">
                        <span className="text-xs text-text-muted truncate block">
                          {product.displayDosageForm || "—"}
                        </span>
                      </UITableCell>

                      {/* Strength */}
                      <UITableCell className="py-2.5">
                        <span className="text-xs text-text-muted font-mono truncate block max-w-[130px]">
                          {product.displayStrength || "—"}
                        </span>
                      </UITableCell>

                      {/* Status */}
                      <UITableCell align="center" className="py-2.5">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-500/10 border border-border px-2 py-0.5 text-[11px] font-semibold text-text-muted">
                            Inactive
                          </span>
                        )}
                      </UITableCell>

                      {/* Actions */}
                      <UITableCell
                        align="right"
                        className="py-2.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <UIDropdown>
                          <UIDropdownTrigger asChild>
                            <button
                              type="button"
                              className="size-8 rounded-lg hover:bg-surface-alt border border-transparent hover:border-border text-text-muted hover:text-text flex items-center justify-center transition-colors cursor-pointer"
                              title="Product actions"
                            >
                              <MoreVertical className="size-4" />
                            </button>
                          </UIDropdownTrigger>
                          <UIDropdownMenu align="end" className="w-44">
                            <UIDropdownItem
                              icon={<Eye className="size-4 text-text-muted shrink-0" />}
                              onClick={() => handleViewProductDetails(product)}
                            >
                              View Details
                            </UIDropdownItem>
                            {can("product:update") && (
                              <UIDropdownItem
                                icon={<Edit3 className="size-4 text-text-muted shrink-0" />}
                                onClick={() => handleEditProduct(product)}
                              >
                                Edit Product
                              </UIDropdownItem>
                            )}
                            {can("product:delete") && (
                              <>
                                <UIDropdownDivider />
                                <UIDropdownItem
                                  destructive
                                  icon={<Trash2 className="size-4 text-error shrink-0" />}
                                  onClick={() => setProductToDelete(product)}
                                >
                                  Delete Product
                                </UIDropdownItem>
                              </>
                            )}
                          </UIDropdownMenu>
                        </UIDropdown>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Infinite Scroll Trigger */}
          {!isLoading && (
            <UIInfiniteScroll
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
            />
          )}
        </UITableScrollArea>
      </div>

      {/* Delete Product Confirmation Dialog */}
      <UIModal
        open={Boolean(productToDelete)}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <UIModalHeader>
          <UIModalTitle className="flex items-center gap-2 text-error">
            <Trash2 className="size-5" />
            Delete Custom Product
          </UIModalTitle>
          <UIModalDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-text">
              {productToDelete?.displayName || "this custom product"}
            </span>
            ? This action cannot be undone.
          </UIModalDescription>
        </UIModalHeader>
        <UIModalBody>
          <p className="text-xs text-text-muted leading-relaxed">
            Deleting this product will remove its workspace record. Existing completed
            bills and batches will maintain historical audit records, but new orders will
            no longer be able to select this product.
          </p>
        </UIModalBody>
        <UIModalFooter>
          <UIButton
            variant="outline"
            onClick={() => setProductToDelete(null)}
            disabled={isDeleting}
          >
            Cancel
          </UIButton>
          <UIButton
            variant="destructive"
            onClick={confirmDelete}
            loading={isDeleting}
            disabled={isDeleting}
          >
            Delete Product
          </UIButton>
        </UIModalFooter>
      </UIModal>
    </div>
  );
};

export default WorkspaceProductsDesktopPage;
