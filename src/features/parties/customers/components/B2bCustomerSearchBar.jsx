// src/features/parties/customers/components/B2bCustomerSearchBar.jsx

import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import {
  Search,
  X,
  Loader2,
  Building2,
  Phone,
  MapPin,
  Briefcase,
  Plus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import customerService from "../services/customerService";

/**
 * B2bCustomerSearchBar
 * Dedicated search bar for B2B Commercial Parties (Wholesalers & Retailers).
 */
export const B2bCustomerSearchBar = forwardRef(
  (
    {
      value: controlledValue,
      selectedCustomer,
      onSelectCustomer,
      b2bPartyType = "all", // "all" | "wholesaler" | "retailer"
      placeholder = "Search B2B party by name, phone, or GST...",
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
    ref,
  ) => {
    const isControlled = controlledValue !== undefined;
    const [searchTerm, setSearchTerm] = useState(selectedCustomer?.name || "");
    const currentValue = isControlled ? controlledValue : searchTerm;

    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const listRef = useRef(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: handleClear,
      input: inputRef.current,
    }));

    // Local & API B2B Customer Filter (minimum 2 chars, top 5 results)
    const executeSearch = useCallback(
      async (query) => {
        const q = (query || "").trim().toLowerCase();

        // Dropdown & API search require at least 2 characters
        if (!q || q.length < 2) {
          setResults([]);
          setIsLoading(false);
          setIsOpen(false);
          return;
        }

        setIsLoading(true);

        let apiResults = [];
        try {
          const types =
            b2bPartyType === "all"
              ? "retail,wholesale"
              : b2bPartyType === "wholesaler"
                ? "wholesale"
                : "retail";
          const res = await customerService.getCustomers({
            search: q,
            customerType: types,
            limit: 50,
          });
          const list =
            res.data?.data?.customers ||
            res.data?.customers ||
            res.data?.data ||
            [];
          if (Array.isArray(list)) {
            apiResults = list;
          }
        } catch (err) {
          console.warn("API Customer search failed:", err);
        }

        // Map API results
        const mappedResults = apiResults.map((apiCust) => {
          const address =
            apiCust.address ||
            (apiCust.billingAddress
              ? [
                  apiCust.billingAddress.addressLine1,
                  apiCust.billingAddress.city,
                ]
                  .filter(Boolean)
                  .join(", ")
              : "") ||
            "";

          return {
            id: apiCust._id || apiCust.id,
            _id: apiCust._id || apiCust.id,
            name: apiCust.name || apiCust.displayName,
            companyName: apiCust.companyName || apiCust.name,
            phone: apiCust.phone || apiCust.mobile || "",
            gstin: apiCust.gstNumber || "",
            address,
            billingAddress: apiCust.billingAddress,
            partyType: apiCust.customerType || "wholesale",
            creditLimit: apiCust.creditLimit || 0,
            creditDays: apiCust.creditDays || 0,
            outstandingAmount: apiCust.outstandingAmount || 0,
            openingBalance: apiCust.openingBalance || 0,
            balanceType:
              apiCust.balanceType || apiCust.openingBalanceType || "dr",
            billingType: "B2B",
            ...apiCust,
          };
        });

        setResults(mappedResults);
        setIsLoading(false);
        if (q) {
          setIsOpen(true);
        }
      },
      [b2bPartyType],
    );

    // Initial load and query change effect - ONLY run if user has typed at least 2 characters
    useEffect(() => {
      const q = (currentValue || "").trim();
      if (!q || q.length < 2) {
        setResults([]);
        setIsLoading(false);
        setIsOpen(false);
        return;
      }

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
        const selectedEl =
          container.querySelector(`[data-index="${selectedIndex}"]`) ||
          container.children[selectedIndex];
        if (selectedEl) {
          if (selectedIndex === 0) {
            container.scrollTop = 0;
          } else if (selectedIndex === results.length - 1) {
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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
      const val = e.target.value;
      if (!isControlled) {
        setSearchTerm(val);
      }
      if (selectedCustomer && onSelectCustomer) {
        onSelectCustomer(null);
      }
      if (onInputChange) onInputChange(val);
      if (val.trim().length >= 2) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
        setResults([]);
      }
      setSelectedIndex(-1);
    };

    const handleClear = () => {
      if (!isControlled) {
        setSearchTerm("");
      }
      setSelectedIndex(-1);
      setIsOpen(false);
      setResults([]);
      if (onSelectCustomer) onSelectCustomer(null);
      if (onInputChange) onInputChange("");
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
      if (!isOpen && e.key === "ArrowDown") {
        if (currentValue?.trim() && results.length > 0) {
          setIsOpen(true);
        }
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
          handleSelect(results[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const sizeClasses =
      {
        sm: "h-8.5 text-xs px-2.5 rounded-lg",
        md: "h-10 text-sm px-3 rounded-xl",
        lg: "h-11.5 text-base px-3.5 rounded-xl",
      }[size] || "h-10 text-sm px-3 rounded-xl";

    return (
      <div
        ref={containerRef}
        className={cn("relative w-full select-none", isOpen && "z-30", className)}
      >
        {/* Search Input Box */}
        <div
          className={cn(
            "group relative flex items-center w-full bg-surface border border-border shadow-2xs transition-all duration-150 ease-out",
            "hover:border-border-strong focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
            disabled &&
              "opacity-60 bg-surface-alt cursor-not-allowed pointer-events-none",
            sizeClasses,
            inputClassName,
          )}
        >
          <div className="flex items-center text-purple-600 dark:text-purple-400 shrink-0 mr-2.5">
            {isLoading ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <Building2 className="size-4" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={currentValue}
            onChange={handleInputChange}
            onFocus={() => {
              if (
                currentValue &&
                currentValue.trim().length >= 2 &&
                results.length > 0
              ) {
                setIsOpen(true);
                if (results.length === 0) {
                  executeSearch(currentValue);
                }
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoFocus={autoFocus}
            placeholder={placeholder}
            className="w-full h-full bg-transparent border-0 outline-none text-text placeholder:text-text-muted/60 font-medium"
          />

          {currentValue && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-1 text-text-muted hover:text-text rounded-md hover:bg-surface-hover transition-colors cursor-pointer ml-1.5"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Dropdown Results List - Only render when open AND user has typed at least 2 characters */}
        {isOpen && Boolean(currentValue?.trim()?.length >= 2) && (
          <div
            className={cn(
              "absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--app-shadow-xl)] animate-in fade-in-50 zoom-in-95 duration-100",
              dropdownClassName,
            )}
          >
            {/* Dropdown Top Bar */}
            <div className="flex items-center justify-between border-b border-border/60 bg-surface-alt/60 px-3.5 py-2 text-[11px] font-semibold text-text-muted">
              <span className="flex items-center gap-1 text-purple-700 dark:text-purple-400">
                <Building2 className="size-3" /> Commercial Parties (B2B)
              </span>
              <span className="text-[10px] text-text-muted/70">
                {results.length} found
              </span>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              className="relative max-h-[300px] overflow-y-auto p-1.5 space-y-1 scroll-smooth"
            >
              {results.length > 0 ? (
                results.map((cust, idx) => {
                  const isSelected =
                    selectedCustomer?.id === cust.id || idx === selectedIndex;

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
                          : "border-transparent hover:bg-surface-hover text-text",
                      )}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors mt-0.5",
                            isSelected
                              ? "bg-primary text-white border-primary"
                              : "bg-purple-500/10 text-purple-600 border-purple-500/20",
                          )}
                        >
                          <Building2 className="size-4" />
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs truncate text-text group-hover/item:text-primary transition-colors">
                              {cust.name}
                            </span>
                            {cust.partyType && (
                              <span className="rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                                {cust.partyType}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-text-muted mt-0.5">
                            {cust.phone && (
                              <span className="flex items-center gap-1 font-mono shrink-0">
                                <Phone className="size-3 text-text-muted/70" />{" "}
                                {cust.phone}
                              </span>
                            )}
                            {cust.gstin && (
                              <span className="flex items-center gap-1 truncate max-w-[150px] shrink-0">
                                <Briefcase className="size-3 text-purple-500/70" />{" "}
                                {cust.gstin}
                              </span>
                            )}
                            {cust.address && (
                              <span className="flex items-center gap-1 truncate max-w-[240px]">
                                <MapPin className="size-3 text-purple-500/70 shrink-0" />
                                <span className="truncate">{cust.address}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {cust.creditLimit > 0 && (
                          <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                            Limit: ₹{cust.creditLimit}
                          </span>
                        )}
                        {isSelected && (
                          <Check className="size-4 text-primary" />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : !isLoading ? (
                <div className="p-4 text-center">
                  <p className="text-xs font-semibold text-text">
                    No B2B party found
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    No matching commercial party for &quot;{currentValue}&quot;
                  </p>

                  {showAddNewAction && (
                    <button
                      type="button"
                      onClick={() => {
                        const newCust = {
                          id: `cust-custom-${Date.now()}`,
                          name: currentValue || "New Party",
                          phone: "",
                          gstin: "",
                          billingType: "B2B",
                        };
                        handleSelect(newCust);
                        if (onAddNewCustomer) onAddNewCustomer(currentValue);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      <Plus className="size-3.5" /> Use &quot;{currentValue}
                      &quot; as Party
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    );
  },
);

B2bCustomerSearchBar.displayName = "B2bCustomerSearchBar";
export default B2bCustomerSearchBar;
