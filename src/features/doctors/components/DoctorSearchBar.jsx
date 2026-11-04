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
  Stethoscope,
  Building2,
  Award,
  Hash,
  Plus,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import doctorService from "../services/doctorService";

/**
 * DoctorSearchBar
 * Real-time debounced company-scoped search for prescribing doctors.
 * Displays specialty, hospital, and medical council reg # in suggestions.
 * Offers direct "+ Add as new Doctor" quick-create action.
 */
export const DoctorSearchBar = forwardRef(
  (
    {
      value: controlledValue,
      selectedDoctor,
      onSelectDoctor,
      placeholder = "Dr. Name / Specialty...",
      size = "sm", // "sm" | "md"
      debounceMs = 250,
      disabled = false,
      autoFocus = false,
      showAddNewAction = true,
      onAddNewDoctor,
      onInputChange,
      className = "",
      inputClassName = "",
      dropdownClassName = "",
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined;
    const [searchTerm, setSearchTerm] = useState(selectedDoctor?.name || "");
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

    // Company Doctor Search via backend API (minimum 2 chars, top 5 results)
    const executeSearch = useCallback(
      async (query) => {
        const q = (query || "").trim();

        if (!q || q.length < 2) {
          setResults([]);
          setIsLoading(false);
          setIsOpen(false);
          return;
        }

        setIsLoading(true);

        try {
          const res = await doctorService.getDoctors({ search: q, limit: 50 });
          const list =
            res.data?.data?.doctors || res.data?.doctors || res.data?.data || [];
          if (Array.isArray(list)) {
            const mapped = list.map((doc) => ({
              id: doc._id || doc.id,
              _id: doc._id || doc.id,
              name: doc.name,
              doctorCode: doc.doctorCode || "",
              specialty: doc.specialty || "General Physician",
              hospitalName: doc.hospitalName || "",
              registrationNumber: doc.registrationNumber || "",
              address: doc.address || doc.clinicAddress || "",
              mobile: doc.mobile || doc.phone || "",
              status: doc.status || "active",
            }));
            setResults(mapped);
          } else {
            setResults([]);
          }
        } catch (err) {
          console.warn("Doctor search query failed:", err);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      },
      []
    );

    useEffect(() => {
      const q = (currentValue || "").trim();
      if (!q || q.length < 2) {
        setResults([]);
        setIsLoading(false);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      const timer = setTimeout(() => {
        executeSearch(currentValue);
      }, debounceMs);

      return () => clearTimeout(timer);
    }, [currentValue, debounceMs, executeSearch]);

    // Keep input text synced with selected doctor if not actively typing
    useEffect(() => {
      if (selectedDoctor && !isOpen) {
        setSearchTerm(selectedDoctor.name);
      }
    }, [selectedDoctor, isOpen]);

    // Scroll highlighted item into view during keyboard navigation
    useEffect(() => {
      if (selectedIndex >= 0 && listRef.current) {
        const container = listRef.current;
        const selectedEl =
          container.querySelector(`[data-index="${selectedIndex}"]`);
        if (selectedEl) {
          if (selectedIndex === 0) {
            container.scrollTop = 0;
          } else if (selectedIndex >= results.length) {
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
      if (onInputChange) onInputChange("");
      if (onSelectDoctor) onSelectDoctor(null);
      inputRef.current?.focus();
    };

    const handleSelect = (doctor) => {
      if (!isControlled) {
        setSearchTerm(doctor.name);
      }
      setIsOpen(false);
      if (onSelectDoctor) {
        onSelectDoctor(doctor);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }

      const hasCreateOption = showAddNewAction && Boolean(currentValue?.trim());
      const totalItems = (isLoading ? 0 : results.length) + (hasCreateOption ? 1 : 0);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        if (totalItems === 0) return;
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (totalItems === 0) return;
        setSelectedIndex((prev) => (prev <= 0 ? totalItems - 1 : prev - 1));
      } else if (e.key === "Enter") {
        if (isOpen && selectedIndex >= 0) {
          e.preventDefault();
          if (!isLoading && selectedIndex < results.length) {
            handleSelect(results[selectedIndex]);
          } else if (hasCreateOption && onAddNewDoctor) {
            setIsOpen(false);
            onAddNewDoctor(currentValue.trim());
          }
        }
      }
    };

    const isSm = size === "sm";

    return (
      <div ref={containerRef} className={cn("relative w-full", isOpen && "z-30", className)}>
        {/* Search input container */}
        <div className="relative flex items-center w-full">
          <Stethoscope
            className={cn(
              "absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors",
              isSm ? "size-3.5" : "size-4",
              selectedDoctor ? "text-sky-600 dark:text-sky-400" : "text-text-muted"
            )}
          />

          <input
            ref={inputRef}
            type="text"
            value={currentValue}
            onChange={handleInputChange}
            onFocus={() => {
              if ((currentValue || "").trim().length >= 2) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoFocus={autoFocus}
            placeholder={placeholder}
            className={cn(
              "w-full rounded-lg border border-border pl-8 pr-7 text-text bg-surface",
              "focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all placeholder:text-text-muted/60",
              isSm ? "h-[34px] text-[12px]" : "h-10 text-sm",
              selectedDoctor && "font-semibold border-sky-500/50 bg-sky-500/5",
              inputClassName
            )}
          />

          {/* Right trailing icons (Loader or Clear) */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin text-text-muted" />
            ) : currentValue ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-0.5 rounded-full hover:bg-surface-hover text-text-muted hover:text-text transition-colors"
                title="Clear doctor"
              >
                <X className="size-3" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Dropdown suggestions list */}
        {isOpen && (currentValue || "").trim().length >= 2 && (
          <div
            className={cn(
              "absolute left-0 right-0 top-[calc(100%+6px)] z-30 flex flex-col h-[340px] overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--app-shadow-xl)] animate-in fade-in-50 zoom-in-95 duration-100",
              dropdownClassName
            )}
          >
            {/* Dropdown Top Bar */}
            <div className="flex items-center justify-between border-b border-border/60 bg-surface-alt/60 px-3.5 py-2 text-[11px] font-semibold text-text-muted shrink-0">
              <span className="flex items-center gap-1 text-sky-700 dark:text-sky-400">
                <Stethoscope className="size-3" /> Prescribing Doctors
              </span>
              <span className="text-[10px] text-text-muted/70">
                {isLoading ? "Searching..." : `${results.length} found`}
              </span>
            </div>

            {/* Results scroll area */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-1.5 space-y-1 scroll-smooth min-h-0">
              {isLoading ? (
                /* Skeleton Loader (4 items matching doctor card geometry) */
                <div className="space-y-1">
                  {Array.from({ length: 4 }).map((_, sIdx) => (
                    <div
                      key={`skeleton-doc-${sIdx}`}
                      className="flex items-start gap-2.5 rounded-xl p-2.5 border border-border/40 bg-surface-alt/30 animate-pulse select-none"
                    >
                      <div className="size-8 rounded-lg bg-border/50 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-2 py-0.5">
                        <div className="h-3.5 bg-border/60 rounded w-2/5" />
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 bg-border/40 rounded w-24" />
                          <div className="h-2.5 bg-border/40 rounded w-28" />
                        </div>
                      </div>
                      <div className="h-4 w-12 bg-border/30 rounded shrink-0" />
                    </div>
                  ))}
                </div>
              ) : results.length > 0 ? (
                results.map((doc, idx) => {
                  const isHighlighted = selectedIndex === idx;
                  const isSelected =
                    (selectedDoctor?._id || selectedDoctor?.id) === doc.id;

                  return (
                    <button
                      key={doc.id || idx}
                      type="button"
                      data-index={idx}
                      onClick={() => handleSelect(doc)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer border",
                        isHighlighted
                          ? "bg-primary-soft/60 border-primary/30 text-primary font-bold shadow-2xs"
                          : "border-transparent hover:bg-surface-hover text-text",
                        isSelected && "font-bold text-primary"
                      )}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div
                          className={cn(
                            "size-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-[11px] border mt-0.5",
                            isSelected || isHighlighted
                              ? "bg-primary text-white border-primary"
                              : "bg-sky-500/10 text-sky-600 border-sky-500/20"
                          )}
                        >
                          {doc.name?.replace(/^(Dr\.?|Doctor)\s+/i, "").charAt(0)?.toUpperCase() || "D"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-text truncate">
                            {doc.name}
                          </div>
                          <div className="text-[10px] text-text-muted flex flex-wrap items-center gap-1.5 mt-0.5">
                            {doc.specialty && (
                              <span className="text-sky-700 dark:text-sky-400 font-medium truncate max-w-[120px]">
                                {doc.specialty}
                              </span>
                            )}
                            {doc.hospitalName && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[130px]">
                                  {doc.hospitalName}
                                </span>
                              </>
                            )}
                            {doc.address && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[140px] text-text-muted">
                                  {doc.address}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        {doc.registrationNumber ? (
                          <span className="font-mono text-[10px] text-text-muted bg-surface-alt px-1.5 py-0.5 rounded">
                            {doc.registrationNumber}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="h-full min-h-[160px] flex flex-col items-center justify-center p-4 text-center">
                  <p className="text-xs font-semibold text-text">No doctor found</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    No matching doctor in directory for &quot;{currentValue}&quot;
                  </p>
                </div>
              )}
            </div>

            {/* Last Option: Create Doctor (Fixed position at bottom) */}
            {showAddNewAction && Boolean(currentValue?.trim()) && (
              <div className="p-1 border-t border-border bg-surface-alt/60 shrink-0 backdrop-blur-xs">
                <button
                  type="button"
                  data-index={results.length}
                  onClick={() => {
                    setIsOpen(false);
                    if (onAddNewDoctor) {
                      onAddNewDoctor(currentValue.trim());
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
                      Create Doctor &quot;<span className="font-bold underline decoration-dotted">{currentValue.trim()}</span>&quot;
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
          </div>
        )}
      </div>
    );
  }
);

DoctorSearchBar.displayName = "DoctorSearchBar";

export default DoctorSearchBar;
