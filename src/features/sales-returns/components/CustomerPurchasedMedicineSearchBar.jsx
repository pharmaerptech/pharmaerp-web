// src/features/sales-returns/components/CustomerPurchasedMedicineSearchBar.jsx

import React, { useState, useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import { Search, X, Pill, FlaskConical, Package, AlertCircle, ChevronRight, Hash, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CustomerPurchasedMedicineSearchBar
 * Searches exclusively within medicines that the selected customer has previously purchased in their sales bills.
 */
export const CustomerPurchasedMedicineSearchBar = forwardRef(
  (
    {
      customer,
      distinctMedicines = [],
      isLoading = false,
      onSelectMedicine,
      placeholder = "Search purchased medicines by name, brand, or batch...",
      size = "md",
      className = "",
    },
    ref
  ) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const listRef = useRef(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => {
        setSearchTerm("");
        setIsOpen(false);
        setSelectedIndex(-1);
      },
      input: inputRef.current,
    }));

    // Filter distinct medicines based on search term
    const filteredMedicines = useMemo(() => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) return distinctMedicines.slice(0, 20);

      return distinctMedicines.filter((m) => {
        const nameMatch = m.name?.toLowerCase().includes(q);
        const brandMatch = m.brand?.toLowerCase().includes(q);
        const catMatch = m.category?.toLowerCase().includes(q);
        const batchMatch = m.bills?.some((b) => b.batch?.toLowerCase().includes(q));
        const billMatch = m.bills?.some((b) => b.invoiceNo?.toLowerCase().includes(q));
        return nameMatch || brandMatch || catMatch || batchMatch || billMatch;
      });
    }, [searchTerm, distinctMedicines]);

    // Handle outside click
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset selection when results change
    useEffect(() => {
      setSelectedIndex(-1);
    }, [filteredMedicines]);

    const handleSelect = (medicine) => {
      if (!medicine) return;
      if (onSelectMedicine) {
        onSelectMedicine(medicine);
      }
      setSearchTerm("");
      setIsOpen(false);
      setSelectedIndex(-1);
    };

    const handleKeyDown = (e) => {
      if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        setIsOpen(true);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredMedicines.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredMedicines.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredMedicines.length) {
          handleSelect(filteredMedicines[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const isCustomerSelected = Boolean(customer && (customer._id || customer.id || customer.name));

    return (
      <div ref={containerRef} className={cn("relative w-full", className)}>
        {/* Search Input Container */}
        <div
          className={cn(
            "relative flex items-center w-full rounded-xl border border-border bg-surface shadow-2xs transition-all",
            isOpen ? "border-primary ring-2 ring-primary/20" : "hover:border-border-focus",
            !isCustomerSelected && "opacity-75 bg-surface-alt/40"
          )}
        >
          <div className="pl-3.5 pr-2 pointer-events-none text-text-muted">
            <Search className="size-4" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            disabled={!isCustomerSelected}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (isCustomerSelected) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              !isCustomerSelected
                ? "Select a customer first to search their purchased medicines..."
                : placeholder
            }
            className={cn(
              "w-full bg-transparent text-xs text-text placeholder:text-text-muted outline-none py-2.5 pr-8",
              !isCustomerSelected && "cursor-not-allowed"
            )}
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 p-1 text-text-muted hover:text-text rounded-md hover:bg-surface-alt transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && isCustomerSelected && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl animate-in fade-in-50 zoom-in-95 duration-100">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-border/70 bg-surface-alt/70 px-3.5 py-2 text-[11px] font-semibold text-text-muted">
              <span>
                {filteredMedicines.length > 0 ? (
                  <span>
                    Purchased Medicines (
                    <strong className="text-text font-bold">{filteredMedicines.length}</strong> distinct):
                  </span>
                ) : (
                  <span>No matching medicines found in customer's purchase history</span>
                )}
              </span>
              <span className="text-[10px] text-text-muted/70 hidden sm:inline-block">
                ↑↓ to navigate · Enter to select
              </span>
            </div>

            {/* Results List */}
            <div ref={listRef} className="max-h-[320px] overflow-y-auto p-1.5 space-y-1">
              {filteredMedicines.length > 0 ? (
                filteredMedicines.map((med, idx) => {
                  const isSelected = idx === selectedIndex;
                  const isFullyReturned = med.totalAvailableQty <= 0;
                  const billCount = med.bills?.length || 1;

                  return (
                    <div
                      key={med.productId || med.name || idx}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => handleSelect(med)}
                      className={cn(
                        "group/item relative flex items-center justify-between rounded-xl p-2.5 transition-all cursor-pointer border border-transparent",
                        isSelected
                          ? "bg-primary/10 border-primary/20 text-primary shadow-2xs"
                          : "hover:bg-surface-hover text-text",
                        isFullyReturned && "opacity-60"
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors mt-0.5",
                            isSelected
                              ? "bg-primary text-white border-primary"
                              : "bg-surface-alt border-border text-text-muted group-hover/item:border-primary/40 group-hover/item:text-primary"
                          )}
                        >
                          <Pill className="size-4" />
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs sm:text-sm truncate text-text group-hover/item:text-primary transition-colors">
                              {med.name}
                            </span>
                            {isFullyReturned ? (
                              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                Fully Returned
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                {med.totalAvailableQty} avail to return
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-text-muted font-mono mt-0.5 flex-wrap">
                            {med.brand && <span>{med.brand}</span>}
                            {med.pack && (
                              <>
                                <span>•</span>
                                <span>Pack: {med.pack}</span>
                              </>
                            )}
                            {med.bills?.[0]?.expiry && med.bills[0].expiry !== "—" && (
                              <>
                                <span>•</span>
                                <span>Exp: {med.bills[0].expiry}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>
                              Bought in <strong>{billCount}</strong> {billCount === 1 ? "bill" : "bills"} ({med.totalSoldQty} units)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pl-2">
                        <span className="text-[11px] font-bold text-primary group-hover/item:translate-x-0.5 transition-transform flex items-center">
                          Select <ChevronRight className="size-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-text-muted space-y-1">
                  <p className="font-semibold text-text">No purchased medicines match "{searchTerm}"</p>
                  <p className="text-[11px]">Only medicines from customer's previous sales bills are shown.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

CustomerPurchasedMedicineSearchBar.displayName = "CustomerPurchasedMedicineSearchBar";
export default CustomerPurchasedMedicineSearchBar;
