import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import { Search, X, Loader2, User, Phone, MapPin, CreditCard, Plus, ChevronRight, Check, Eye, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import customerService from "../services/customerService";
import CustomerDialog from "./CustomerDialog";

/**
 * B2cCustomerSearchBar
 * Dedicated search bar for Company Customers.
 * Supports real-time debounced search by customer name or phone.
 * Restricts queries strictly to active company, enforces 2-char minimum, and limits top 5 matches.
 * On focus/click when empty, displays Walk-in Customer as instant single choice.
 */
export const B2cCustomerSearchBar = forwardRef(
  (
    {
      value: controlledValue,
      selectedCustomer,
      walkInCustomer: propWalkInCustomer,
      onSelectCustomer,
      onViewCustomerDetails,
      placeholder = "Search customer or select Walk-in...",
      size = "md", // "sm" | "md" | "lg"
      debounceMs = 250,
      disabled = false,
      autoFocus = false,
      showAddNewAction = true,
      onAddNewCustomer,
      onInputChange,
      className = "",
      inputClassName = "",
      dropdownClassName = "",
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined;
    const [searchTerm, setSearchTerm] = useState(selectedCustomer?.name || "");
    const currentValue = isControlled ? controlledValue : searchTerm;
    const isWalkInMode = !currentValue || currentValue.trim().length < 2;

    const [walkInCustomer, setWalkInCustomer] = useState(propWalkInCustomer || null);
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [detailCustomer, setDetailCustomer] = useState(null);

    // Keep walkInCustomer synchronized if prop is provided or fetch once on mount
    useEffect(() => {
      if (propWalkInCustomer) {
        setWalkInCustomer(propWalkInCustomer);
        return;
      }
      let isMounted = true;
      customerService
        .getWalkInCustomer()
        .then((res) => {
          if (!isMounted) return;
          const w = res.data?.data || res.data;
          if (w) {
            setWalkInCustomer({
              id: w._id || w.id,
              _id: w._id || w.id,
              name: w.name || "Walk-in Customer",
              phone: w.mobile || w.phone || "",
              mobile: w.mobile || w.phone || "",
              isWalkIn: true,
              customerType: "walk_in",
              customerCode: w.customerCode || "WALK-IN",
              ...w,
            });
          }
        })
        .catch((err) => {
          console.warn("B2cCustomerSearchBar: Failed to fetch walk-in customer:", err);
        });
      return () => {
        isMounted = false;
      };
    }, [propWalkInCustomer]);

    const handleOpenDetails = useCallback(
      async (cust) => {
        if (!cust) return;
        if (onViewCustomerDetails) {
          onViewCustomerDetails(cust);
          return;
        }
        // Immediately display dialog with currently known customer data
        setIsOpen(false);
        setDetailCustomer(cust);
        setIsDetailDialogOpen(true);

        // Fetch complete customer profile & relationships from API (matching CustomersPage)
        const custId = cust?._id || cust?.id;
        if (custId) {
          try {
            const res = await customerService.getCustomerById(custId);
            const fullCust = res.data?.data || res.data;
            if (fullCust) {
              setDetailCustomer(fullCust);
            }
          } catch (err) {
            console.warn("B2cCustomerSearchBar: Failed to fetch full customer details:", err);
          }
        }
      },
      [onViewCustomerDetails]
    );

    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const listRef = useRef(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: handleClear,
      input: inputRef.current,
    }));

    // Company Customer Search via backend API (minimum 2 chars, top 5 results)
    const executeSearch = useCallback(
      async (query) => {
        const q = (query || "").trim();

        // Require at least 2 characters before querying backend or opening results
        if (!q || q.length < 2) {
          setResults([]);
          setIsLoading(false);
          setIsOpen(false);
          return;
        }

        setIsLoading(true);

        try {
          // Strictly fetch company-scoped customers from API with generous limit for dropdown scrolling
          const res = await customerService.getCustomers({ search: q, limit: 50 });
          const list = res.data?.data?.customers || res.data?.customers || res.data?.data || [];
          if (Array.isArray(list)) {
            const mapped = list.map((apiCust) => {
              const address =
                apiCust.address ||
                (apiCust.billingAddress
                  ? [apiCust.billingAddress.addressLine1, apiCust.billingAddress.city]
                      .filter(Boolean)
                      .join(", ")
                  : "") ||
                "";

              return {
                id: apiCust._id || apiCust.id,
                _id: apiCust._id || apiCust.id,
                name: apiCust.name || apiCust.displayName,
                phone: apiCust.phone || apiCust.mobile || "",
                email: apiCust.email || "",
                address,
                billingAddress: apiCust.billingAddress,
                creditBalance: apiCust.creditBalance || apiCust.advanceBalance || 0,
                billingType: "B2C",
                ...apiCust,
              };
            });
            setResults(mapped);
          } else {
            setResults([]);
          }
        } catch (err) {
          console.warn("API Customer search failed:", err);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

    // Initial load and query change effect - ONLY run if at least 2 characters typed
    useEffect(() => {
      const q = (currentValue || "").trim();
      if (!q || q.length < 2) {
        setResults([]);
        setIsLoading(false);
        // Do NOT force close the dropdown here!
        // When in focus, 0 or 1 character displays the Walk-in customer dropdown.
        return;
      }

      setIsLoading(true);
      const timer = setTimeout(() => {
        executeSearch(currentValue);
      }, debounceMs);

      return () => clearTimeout(timer);
    }, [currentValue, debounceMs, executeSearch]);

    // Keep input text synced with selected customer if not actively typing
    useEffect(() => {
      if (selectedCustomer && !isOpen) {
        setSearchTerm(selectedCustomer.name);
      }
    }, [selectedCustomer, isOpen]);

    // Scroll highlighted item into view during keyboard navigation (Arrow Up / Down)
    useEffect(() => {
      if (selectedIndex >= 0 && listRef.current) {
        const container = listRef.current;
        const selectedEl = container.querySelector(`[data-index="${selectedIndex}"]`);
        if (selectedEl) {
          if (selectedIndex === 0) {
            container.scrollTop = 0;
          } else if (selectedIndex === results.length) {
            container.scrollTop = container.scrollHeight;
          } else if (typeof selectedEl.scrollIntoView === "function") {
            selectedEl.scrollIntoView({ block: "nearest", inline: "nearest" });
          }
        }
      }
    }, [selectedIndex, results.length]);

    // Click outside handler
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
      const val = e.target.value;
      if (!isControlled) {
        setSearchTerm(val);
      }
      if (onInputChange) onInputChange(val);

      const trimmed = val.trim();
      // Keep dropdown open: 0 or 1 char shows Walk-in, 2+ chars shows search
      setIsOpen(true);
      if (trimmed.length < 2) {
        setSelectedIndex(0);
        setResults([]);
        setIsLoading(false);
      } else {
        setSelectedIndex(-1);
      }
    };

    const handleClear = () => {
      if (!isControlled) {
        setSearchTerm("");
      }
      setSelectedIndex(0);
      setResults([]);
      setIsLoading(false);
      if (onInputChange) onInputChange("");
      if (onSelectCustomer) onSelectCustomer(null);
      setIsOpen(true);
      inputRef.current?.focus();
    };

    const handleSelect = (customer) => {
      if (!isControlled) {
        setSearchTerm(customer.name);
      }
      setIsOpen(false);
      if (onSelectCustomer) {
        onSelectCustomer(customer);
      }
    };

    const handleKeyDown = (e) => {
      if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
        setIsOpen(true);
        if (isWalkInMode) {
          setSelectedIndex(0);
        }
        return;
      }

      if (!isOpen) return;

      if (isWalkInMode) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex(0);
        } else if (e.key === "Enter") {
          e.preventDefault();
          const targetWalkIn = walkInCustomer || {
            name: "Walk-in Customer",
            isWalkIn: true,
            customerType: "walk_in",
            customerCode: "WALK-IN",
          };
          handleSelect(targetWalkIn);
        } else if (e.key === "Escape") {
          setIsOpen(false);
        }
        return;
      }

      const hasCreateOption = showAddNewAction && Boolean(currentValue?.trim());
      const totalItems = (isLoading ? 0 : results.length) + (hasCreateOption ? 1 : 0);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (totalItems === 0) return;
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (totalItems === 0) return;
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0) {
          e.preventDefault();
          if (!isLoading && selectedIndex < results.length && results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          } else if (hasCreateOption && (isLoading || selectedIndex === results.length)) {
            setIsOpen(false);
            if (onAddNewCustomer) {
              onAddNewCustomer(currentValue.trim());
            }
          }
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const sizeClasses = {
      sm: "h-8.5 text-xs px-2.5 rounded-lg",
      md: "h-10 text-sm px-3 rounded-xl",
      lg: "h-11.5 text-base px-3.5 rounded-xl",
    }[size] || "h-10 text-sm px-3 rounded-xl";

    return (
      <div ref={containerRef} className={cn("relative w-full select-none", isOpen && "z-30", className)}>
        {/* Search Input Box */}
        <div
          className={cn(
            "group relative flex items-center w-full bg-surface border border-border shadow-2xs transition-all duration-150 ease-out",
            "hover:border-border-strong focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
            disabled && "opacity-60 bg-surface-alt cursor-not-allowed pointer-events-none",
            sizeClasses,
            inputClassName
          )}
        >
          <div className="flex items-center text-emerald-600 dark:text-emerald-400 shrink-0 mr-2.5">
            {isLoading ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <User className="size-4" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={currentValue}
            onChange={handleInputChange}
            onFocus={() => {
              setIsOpen(true);
              if (!currentValue || currentValue.trim().length < 2) {
                setSelectedIndex(0);
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoFocus={autoFocus}
            placeholder={placeholder}
            className="w-full h-full bg-transparent border-0 outline-none text-text placeholder:text-text-muted/60 font-medium"
          />

          {/* Customer details button (when a customer is selected) */}
          {selectedCustomer && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetails(selectedCustomer);
              }}
              className="p-1 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-md transition-colors cursor-pointer ml-1"
              title="View customer details & relationships"
              aria-label="View customer details"
            >
              <Eye className="size-4" />
            </button>
          )}

          {currentValue && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-1 text-text-muted hover:text-text rounded-md hover:bg-surface-hover transition-colors cursor-pointer ml-0.5"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Dropdown Results List - Render when open: shows Walk-in for 0 or 1 char, or search results for 2+ chars */}
        {isOpen && (
          <div
            className={cn(
              "absolute left-0 right-0 top-[calc(100%+6px)] z-30 flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--app-shadow-xl)] animate-in fade-in-50 zoom-in-95 duration-100",
              isWalkInMode ? "h-auto max-h-[240px]" : "h-[340px]",
              dropdownClassName
            )}
          >
            {isWalkInMode ? (
              /* Pre-type Mode: Single Walk-in Customer Suggestion */
              <>
                <div className="flex items-center justify-between border-b border-border/60 bg-surface-alt/60 px-3.5 py-2 text-[11px] font-semibold text-text-muted shrink-0">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Store className="size-3.5" /> Walk-in Customer
                  </span>
                  <span className="text-[10px] text-text-muted/80">
                    Quick Selection
                  </span>
                </div>

                <div ref={listRef} className="p-1.5">
                  <div
                    data-index={0}
                    onMouseEnter={() => setSelectedIndex(0)}
                    onClick={() => {
                      const targetWalkIn = walkInCustomer || {
                        name: "Walk-in Customer",
                        isWalkIn: true,
                        customerType: "walk_in",
                        customerCode: "WALK-IN",
                      };
                      handleSelect(targetWalkIn);
                    }}
                    className={cn(
                      "group/item relative flex items-center justify-between rounded-xl p-2.5 transition-all cursor-pointer border",
                      selectedIndex === 0
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold shadow-2xs"
                        : "border-transparent hover:bg-surface-hover text-text"
                    )}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors mt-0.5",
                          selectedIndex === 0
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        )}
                      >
                        <Store className="size-4" />
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs truncate text-text group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400 transition-colors">
                            {walkInCustomer?.name || "Walk-in Customer"}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shrink-0">
                            Default Walk-in
                          </span>
                        </div>

                        <p className="text-[11px] text-text-muted mt-0.5 truncate">
                          Counter sale without customer name or phone
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] text-text-muted/70 font-mono hidden sm:inline-block">
                        Press ↵ Enter
                      </span>
                      {selectedIndex === 0 && <Check className="size-4 text-emerald-600" />}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Search Mode: 2+ characters typed - Query results, skeletons, Add New */
              <>
                {/* Dropdown Top Bar */}
                <div className="flex items-center justify-between border-b border-border/60 bg-surface-alt/60 px-3.5 py-2 text-[11px] font-semibold text-text-muted shrink-0">
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <User className="size-3" /> Company Customers
                  </span>
                  <span className="text-[10px] text-text-muted/70">
                    {isLoading ? "Searching..." : `${results.length} found`}
                  </span>
                </div>

                {/* Results / Skeletons / Empty state Area */}
                <div ref={listRef} className="flex-1 overflow-y-auto p-1.5 space-y-1 scroll-smooth min-h-0">
                  {isLoading ? (
                    /* Skeleton Loader (4 items matching customer card geometry) */
                    <div className="space-y-1">
                      {Array.from({ length: 4 }).map((_, sIdx) => (
                        <div
                          key={`skeleton-cust-${sIdx}`}
                          className="flex items-start gap-2.5 rounded-xl p-2.5 border border-border/40 bg-surface-alt/30 animate-pulse select-none"
                        >
                          <div className="size-8 rounded-lg bg-border/50 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0 space-y-2 py-0.5">
                            <div className="h-3.5 bg-border/60 rounded w-1/3" />
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 bg-border/40 rounded w-20" />
                              <div className="h-2.5 bg-border/40 rounded w-32" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : results.length > 0 ? (
                    results.map((cust, idx) => {
                      const isSelected = selectedCustomer?.id === cust.id || idx === selectedIndex;

                      return (
                        <div
                          key={cust.id || idx}
                          data-index={idx}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={() => handleSelect(cust)}
                          className={cn(
                            "group/item relative flex items-center justify-between rounded-xl p-2.5 transition-all cursor-pointer border",
                            isSelected
                              ? "bg-primary-soft/60 border-primary/30 text-primary font-bold shadow-2xs"
                              : "border-transparent hover:bg-surface-hover text-text"
                          )}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <div
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors mt-0.5",
                                isSelected
                                  ? "bg-primary text-white border-primary"
                                  : cust.isWalkIn
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : "bg-surface-alt text-text-muted border-border"
                              )}
                            >
                              {cust.isWalkIn ? <Store className="size-4" /> : <User className="size-4" />}
                            </div>

                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs truncate text-text group-hover/item:text-primary transition-colors">
                                  {cust.name}
                                </span>
                                {cust.isWalkIn && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shrink-0">
                                    Walk-in
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5">
                                {cust.phone && (
                                  <div className="flex items-center gap-1 text-[11px] text-text-muted font-mono shrink-0">
                                    <Phone className="size-3 text-text-muted/70" /> {cust.phone}
                                  </div>
                                )}
                                {cust.address && (
                                  <div className="flex items-center gap-1 text-[11px] text-text-muted truncate max-w-[280px]">
                                    <MapPin className="size-3 text-emerald-600/70 dark:text-emerald-400/70 shrink-0" />
                                    <span className="truncate">{cust.address}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDetails(cust);
                              }}
                              className="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-alt transition-all shrink-0 cursor-pointer"
                              title="View customer details & relationships"
                              aria-label="View customer details"
                            >
                              <Eye className="size-3.5" />
                            </button>
                            {isSelected && <Check className="size-4 text-primary" />}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full min-h-[160px] flex flex-col items-center justify-center p-4 text-center">
                      <p className="text-xs font-semibold text-text">No customer found</p>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        No matching customer in directory for &quot;{currentValue}&quot;
                      </p>
                    </div>
                  )}
                </div>

                {/* Last Option: Create User (Fixed position at bottom) */}
                {showAddNewAction && Boolean(currentValue?.trim()) && (
                  <div className="p-1 border-t border-border bg-surface-alt/60 shrink-0 backdrop-blur-xs">
                    <button
                      type="button"
                      data-index={results.length}
                      onClick={() => {
                        setIsOpen(false);
                        if (onAddNewCustomer) {
                          onAddNewCustomer(currentValue.trim());
                        }
                      }}
                      onMouseEnter={() => setSelectedIndex(results.length)}
                      className={cn(
                        "w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left text-xs transition-colors cursor-pointer",
                        selectedIndex === results.length
                          ? "bg-primary text-white font-bold shadow-xs"
                          : "hover:bg-primary/10 text-primary font-semibold bg-primary/5 border border-primary/20"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            "size-6 rounded-md flex items-center justify-center shrink-0",
                            selectedIndex === results.length ? "bg-white/20 text-white" : "bg-primary/20 text-primary"
                          )}
                        >
                          <Plus className="size-3.5 stroke-[2.5]" />
                        </div>
                        <div className="truncate">
                          Create User &quot;<span className="font-bold underline decoration-dotted">{currentValue.trim()}</span>&quot;
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] uppercase font-mono tracking-wider font-bold shrink-0 px-1.5 py-0.5 rounded",
                          selectedIndex === results.length ? "bg-white/20 text-white" : "bg-primary/15 text-primary"
                        )}
                      >
                        + Add New
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Customer Details Dialog */}
        {isDetailDialogOpen && detailCustomer && (
          <CustomerDialog
            isOpen={isDetailDialogOpen}
            onClose={() => {
              setIsDetailDialogOpen(false);
              setDetailCustomer(null);
            }}
            mode="view"
            customerData={detailCustomer}
            onSubmitUpdate={async (customerId, payload) => {
              const res = await customerService.updateCustomer(customerId, payload);
              const updated = res.data?.data || res.data;
              if (updated) {
                setDetailCustomer(updated);
                if (onSelectCustomer) {
                  onSelectCustomer(updated);
                }
                if (updated.name && !isControlled) {
                  setSearchTerm(updated.name);
                }
              }
              return updated;
            }}
            onSuccess={(updated) => {
              if (updated) {
                setDetailCustomer(updated);
                if (onSelectCustomer) {
                  onSelectCustomer(updated);
                }
                if (updated.name && !isControlled) {
                  setSearchTerm(updated.name);
                }
              }
            }}
          />
        )}
      </div>
    );
  }
);

B2cCustomerSearchBar.displayName = "B2cCustomerSearchBar";
export default B2cCustomerSearchBar;

