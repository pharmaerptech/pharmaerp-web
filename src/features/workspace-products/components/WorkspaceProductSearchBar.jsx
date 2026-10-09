// src/features/workspace-products/components/WorkspaceProductSearchBar.jsx

import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import { Search, X, Loader2, Package, Tag, Building2, Info, CheckCircle2, AlertCircle, Plus, ChevronRight, Hash, FlaskConical, Pill, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import workspaceProductService from "../services/workspaceProductService";
import WorkspaceProductDetailsModal from "./WorkspaceProductDetailsModal";
import useBranch from "@/features/branch/hooks/useBranch";

/**
 * WorkspaceProductSearchBar
 * Reusable, high-performance workspace product search component with real-time autocompletion,
 * detailed product info preview, keyboard navigation, and product detail fetching.
 */
export const WorkspaceProductSearchBar = forwardRef(
  (
    {
      value: controlledValue,
      defaultValue = "",
      branchId: requestedBranchId,
      onChange,
      onSelectProduct,
      onProductDetailsLoaded,
      placeholder = "Search workspace products by name, SKU, brand, category or composition...",
      size = "md", // "sm" | "md" | "lg"
      debounceMs = 250,
      limit = 15,
      productType,
      statusFilter = "all", // "all" | "active" | "inactive"
      disabled = false,
      autoFocus = false,
      showDetailsPreview = true,
      showQuickCreateAction = true,
      onCreateProductClick,
      shortcut = "⌘K",
      enableShortcut = true,
      className = "",
      inputClassName = "",
      dropdownClassName = "",
      inputProps = {},
    },
    ref
  ) => {
    const { currentBranch } = useBranch();
    const branchId =
      requestedBranchId !== undefined
        ? requestedBranchId
        : currentBranch?._id || currentBranch?.id || null;
    const isControlled = controlledValue !== undefined;
    const [searchTerm, setSearchTerm] = useState(defaultValue);
    const currentValue = isControlled ? controlledValue : searchTerm;

    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [error, setError] = useState(null);

    // Selected product details inspection modal
    const [inspectedProduct, setInspectedProduct] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const listRef = useRef(null);
    const searchRequestIdRef = useRef(0);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: handleClear,
      input: inputRef.current,
    }));

    // Debounced search query
    const executeSearch = useCallback(
      async (query) => {
        const requestId = ++searchRequestIdRef.current;

        // Sanitize query by stripping non-alphanumeric characters (symbols like -, /, spaces, etc.)
        const cleanedQuery = (query || "").replace(/[^a-zA-Z0-9]/g, "").trim();

        if (!query || !query.trim() || !cleanedQuery) {
          setResults([]);
          setIsLoading(false);
          setError(null);
          return;
        }

        if (branchId === null) {
          setResults([]);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          // Pass both the sanitized query and original raw query for maximum backend matching
          const params = {
            search: cleanedQuery || query.trim(),
            limit,
            summary: true,
          };
          if (branchId) params.branchId = branchId;
          if (productType) params.productType = productType;
          if (statusFilter && statusFilter !== "all") params.status = statusFilter;

          const response = await workspaceProductService.getWorkspaceProducts(params);
          const productsList = response.data?.data?.products || response.data?.data || response.data?.products || [];

          if (requestId === searchRequestIdRef.current) {
            setResults(Array.isArray(productsList) ? productsList : []);
          }
        } catch (err) {
          console.error("Error searching workspace products:", err);
          if (requestId === searchRequestIdRef.current) {
            setError(err?.response?.data?.message || err.message || "Failed to search workspace products");
            setResults([]);
          }
        } finally {
          if (requestId === searchRequestIdRef.current) {
            setIsLoading(false);
          }
        }
      },
      [branchId, limit, productType, statusFilter]
    );

    useEffect(() => {
      searchRequestIdRef.current += 1;
      setResults([]);
      setIsLoading(false);
    }, [branchId]);

    // Debounce watcher
    useEffect(() => {
      const timer = setTimeout(() => {
        if (currentValue && currentValue.trim()) {
          executeSearch(currentValue);
        } else {
          searchRequestIdRef.current += 1;
          setResults([]);
          setIsLoading(false);
        }
      }, debounceMs);

      return () => clearTimeout(timer);
    }, [currentValue, debounceMs, executeSearch]);

    // Keyboard shortcut listener (Cmd+K or Ctrl+K)
    useEffect(() => {
      if (!enableShortcut || disabled) return;

      const handleGlobalKeyDown = (e) => {
        const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
        if (isCmdK) {
          const activeTag = document.activeElement?.tagName?.toLowerCase();
          if (activeTag !== "input" && activeTag !== "textarea") {
            e.preventDefault();
            inputRef.current?.focus();
            setIsOpen(true);
          }
        }
      };

      window.addEventListener("keydown", handleGlobalKeyDown);
      return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [enableShortcut, disabled]);

    // Click outside handler to close dropdown
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Scroll selected item into view
    useEffect(() => {
      if (selectedIndex >= 0 && listRef.current) {
        const selectedEl = listRef.current.children[selectedIndex];
        if (selectedEl) {
          selectedEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
    }, [selectedIndex]);

    const handleInputChange = (e) => {
      const val = e.target.value;
      if (!isControlled) {
        setSearchTerm(val);
      }
      if (onChange) {
        onChange(e);
      }
      setIsOpen(true);
      setSelectedIndex(-1);
    };

    const handleClear = () => {
      if (!isControlled) {
        setSearchTerm("");
      }
      if (onChange) {
        onChange({ target: { value: "" } });
      }
      setResults([]);
      setSelectedIndex(-1);
      setIsOpen(false);
      inputRef.current?.focus();
    };

    // Fetch full workspace product details by ID and handle selection
    const handleSelectProductItem = async (product, e) => {
      if (e) e.stopPropagation();

      setIsLoadingDetails(true);
      let fullDetails = product;

      try {
        if (product?._id) {
          const response = await workspaceProductService.getWorkspaceProductById(product._id);
          fullDetails = response.data?.data || response.data || product;
        }
      } catch (err) {
        console.warn("Could not fetch extended product details, using basic info:", err);
      } finally {
        setIsLoadingDetails(false);
      }

      // Clear search term after selection for fast subsequent scanning
      if (!isControlled) {
        setSearchTerm("");
      }
      setIsOpen(false);

      // Call parent callbacks
      if (onProductDetailsLoaded) {
        onProductDetailsLoaded(fullDetails);
      }
      if (onSelectProduct) {
        onSelectProduct(product, fullDetails);
      }
    };

    const handleInspectDetails = async (product, e) => {
      e.stopPropagation();
      setInspectedProduct(product);
      setIsLoadingDetails(true);
      setIsDetailsModalOpen(true);

      try {
        if (product?._id) {
          const response = await workspaceProductService.getWorkspaceProductById(product._id);
          const fullDetails = response.data?.data || response.data || product;
          setInspectedProduct(fullDetails);
        }
      } catch (err) {
        console.warn("Could not fetch product details:", err);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    const handleKeyDown = (e) => {
      if (!isOpen && e.key === "ArrowDown") {
        setIsOpen(true);
        return;
      }

      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0 && results[selectedIndex]) {
          e.preventDefault();
          handleSelectProductItem(results[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    // Styling dimensions
    const sizeClasses = {
      sm: "h-8.5 text-xs px-2.5 rounded-lg",
      md: "h-10 text-sm px-3 rounded-xl",
      lg: "h-12 text-base px-3.5 rounded-xl",
    }[size] || "h-10 text-sm px-3 rounded-xl";

    const iconSizes = {
      sm: "size-3.5",
      md: "size-4",
      lg: "size-4.5",
    }[size] || "size-4";

    return (
      <div ref={containerRef} className={cn("relative w-full select-none", className)}>
        {/* Input Bar */}
        <div
          className={cn(
            "group relative flex items-center w-full bg-surface border border-border shadow-2xs transition-all duration-150 ease-out",
            "hover:border-border-strong focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
            disabled && "opacity-60 bg-surface-alt cursor-not-allowed pointer-events-none",
            sizeClasses,
            inputClassName
          )}
        >
          {/* Search or Spinner Icon */}
          <div className="flex items-center text-text-muted shrink-0 mr-2.5">
            {isLoading || isLoadingDetails ? (
              <Loader2 className={cn("animate-spin text-primary", iconSizes)} />
            ) : (
              <Search className={cn("text-text-muted group-focus-within:text-primary transition-colors", iconSizes)} />
            )}
          </div>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={currentValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoFocus={autoFocus}
            placeholder={placeholder}
            className="w-full h-full bg-transparent border-0 outline-none text-text placeholder:text-text-muted/60"
            {...inputProps}
          />

          {/* Action icons / Shortcut badge */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {currentValue && !disabled ? (
              <button
                type="button"
                tabIndex={-1}
                onClick={handleClear}
                aria-label="Clear search"
                className="p-1 text-text-muted hover:text-text rounded-md hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <X className={iconSizes} />
              </button>
            ) : shortcut && enableShortcut ? (
              <kbd className="hidden sm:inline-flex items-center font-mono font-semibold text-[10px] text-text-muted bg-surface-alt border border-border/80 rounded-md px-1.5 py-0.5 shadow-2xs">
                {shortcut}
              </kbd>
            ) : null}
          </div>
        </div>

        {/* Results Autocomplete Dropdown */}
        {isOpen && (currentValue?.trim() || isLoading) && (
          <div
            className={cn(
              "absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--app-shadow-xl)] animate-in fade-in-50 zoom-in-95 duration-100",
              dropdownClassName
            )}
          >
            {/* Header Status */}
            <div className="flex items-center justify-between border-b border-border/60 bg-surface-alt/60 px-3.5 py-2 text-[11px] font-medium text-text-muted">
              <span>
                {isLoading ? (
                  <span className="flex items-center gap-1.5 text-primary font-semibold">
                    <Loader2 className="size-3 animate-spin" /> Searching workspace catalog...
                  </span>
                ) : results.length > 0 ? (
                  <span>
                    Found <strong className="text-text font-bold">{results.length}</strong> workspace product{results.length > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span>Workspace catalog search</span>
                )}
              </span>

              <span className="hidden sm:inline-block text-[10px] text-text-muted/70">
                Use ↑ ↓ to navigate, ↵ to select
              </span>
            </div>

            {/* Results List */}
            <div ref={listRef} className="max-h-[340px] overflow-y-auto p-1.5 space-y-1">
              {results.length > 0 ? (
                results.map((product, idx) => {
                  const getSafeStr = (val) => {
                    if (!val) return null;
                    if (typeof val === "object") return val.name || val.title || val.slug || val.id || null;
                    return String(val);
                  };

                  const isSelected = idx === selectedIndex;
                  const name = getSafeStr(product.displayName || product.name || "Unnamed Product");
                  const sku = getSafeStr(product.displaySku || product.sku || product.code);
                  const category = getSafeStr(product.displayCategory || product.category);
                  const manufacturer = getSafeStr(product.displayManufacturer || product.manufacturer || product.brand);
                  const dosageForm = getSafeStr(product.displayDosageForm || product.dosageForm || product.productType);
                  const strength = getSafeStr(product.displayStrength || product.strength);
                  const status = product.displayStatus || product.status || "active";
                  const isActive = status === "active";

                  return (
                    <div
                      key={product._id || product.id || idx}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={(e) => handleSelectProductItem(product, e)}
                      className={cn(
                        "group/item relative flex items-center justify-between rounded-xl p-2.5 transition-all cursor-pointer border border-transparent",
                        isSelected
                          ? "bg-primary-soft/60 border-primary/20 text-primary shadow-2xs"
                          : "hover:bg-surface-hover text-text"
                      )}
                    >
                      {/* Left: Product Icon & Info */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors mt-0.5",
                            isSelected
                              ? "bg-primary text-white border-primary"
                              : "bg-surface-alt border-border text-text-muted group-hover/item:border-primary/40 group-hover/item:text-primary"
                          )}
                        >
                          {dosageForm?.toLowerCase().includes("tab") || dosageForm?.toLowerCase().includes("cap") ? (
                            <Pill className="size-4.5" />
                          ) : dosageForm?.toLowerCase().includes("syrup") || dosageForm?.toLowerCase().includes("liq") ? (
                            <FlaskConical className="size-4.5" />
                          ) : (
                            <Package className="size-4.5" />
                          )}
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                          {/* Title & Status */}
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate text-text group-hover/item:text-primary transition-colors">
                              {name}
                            </span>
                          </div>

                          {/* Secondary attributes row */}
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-text-muted">
                            {sku && (
                              <span className="flex items-center gap-1 font-mono text-[11px] bg-surface-alt px-1.5 py-0.5 rounded border border-border/60">
                                <Hash className="size-3 text-text-muted" />
                                {sku}
                              </span>
                            )}

                            {category && (
                              <span className="flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400">
                                <Tag className="size-3" />
                                {category}
                              </span>
                            )}

                            {manufacturer && (
                              <span className="flex items-center gap-1 text-[11px] truncate max-w-[180px]">
                                <Building2 className="size-3" />
                                {manufacturer}
                              </span>
                            )}

                            {(dosageForm || strength) && (
                              <span className="text-[11px] text-text-muted/80">
                                {[dosageForm, strength].filter(Boolean).join(" • ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {product.stock !== undefined && product.stock > 0 && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap mr-1">
                            <Layers className="size-3 text-emerald-600 dark:text-emerald-400" /> {product.stock} Qty
                          </span>
                        )}
                        
                        {product.stock !== undefined && product.stock <= 0 && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-red-700 dark:text-red-300 bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/30 whitespace-nowrap mr-1">
                            <Layers className="size-3 text-red-600 dark:text-red-400" /> Out of Stock
                          </span>
                        )}

                        {showDetailsPreview && (
                          <button
                            type="button"
                            onClick={(e) => handleInspectDetails(product, e)}
                            title="View Full Product Details"
                            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface border border-transparent hover:border-border transition-all shadow-2xs"
                          >
                            <Info className="size-4" />
                          </button>
                        )}
                        <ChevronRight
                          className={cn(
                            "size-4 transition-transform",
                            isSelected ? "text-primary translate-x-0.5" : "text-text-muted/40"
                          )}
                        />
                      </div>
                    </div>
                  );
                })
              ) : !isLoading ? (
                <div className="p-6 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-surface-alt text-text-muted border border-border mb-2">
                    <Package className="size-5" />
                  </div>
                  <p className="text-sm font-semibold text-text">No workspace products found</p>
                  <p className="text-xs text-text-muted mt-1 max-w-[280px] mx-auto">
                    We couldn&apos;t find any product matching &quot;{currentValue}&quot; in your workspace catalog.
                  </p>

                  {showQuickCreateAction && onCreateProductClick && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setIsOpen(false);
                        onCreateProductClick(currentValue);
                      }}
                      className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      Create Custom Product
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Product Details Inspection Modal */}
        {isDetailsModalOpen && (
          <WorkspaceProductDetailsModal
            open={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            product={inspectedProduct}
            isLoading={isLoadingDetails}
            onSelect={(prod) => {
              setIsDetailsModalOpen(false);
              handleSelectProductItem(prod);
            }}
          />
        )}
      </div>
    );
  }
);

WorkspaceProductSearchBar.displayName = "WorkspaceProductSearchBar";
export default WorkspaceProductSearchBar;
