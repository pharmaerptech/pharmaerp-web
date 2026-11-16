// src/features/doctors/pages/desktop/DoctorsDesktopPage.jsx

import React, { useState, useMemo, useRef } from "react";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  RotateCcw,
  Plus,
  Stethoscope,
  Building2,
  Award,
  Hash,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
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
  PermissionGate,
} from "@/components/ui";
import { CompanyFilterSelect, CompanyBadge } from "@/components/shared";
import { cn } from "@/lib/utils";
import { DoctorFilterModal, SPECIALTY_FILTER_OPTIONS } from "../../components/DoctorFilterModal";

const getInitials = (name) => {
  if (!name) return "DR";
  const clean = name.replace(/^(dr\.?|dr)\s+/i, "");
  return clean
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

export const DoctorsDesktopPage = ({
  doctors = [],
  total = 0,
  hasMore = false,
  isLoading = false,
  isLoadingMore = false,
  summary = {},
  filters = {},
  onSearchChange,
  onSpecialtyChange,
  onStatusChange,
  onSortChange,
  onResetFilters,
  onRefresh,
  onLoadMore,
  onOpenCreateDialog,
  onOpenEditDialog,
  onOpenViewDialog,
  onOpenDeleteConfirm,
  companyFilter,
}) => {
  const tableContainerRef = useRef(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const handleCopy = (text, key, e) => {
    if (e) e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.specialty && filters.specialty !== "all") count++;
    if (filters.status && filters.status !== "all") count++;
    if (filters.sort && filters.sort !== "createdAt-desc") count++;
    return count;
  }, [filters]);

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden">
      {/* ── 1. Compact 4-Card Statistics Grid (Customer Parity) ─────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
        {/* Card 1: Total Doctors */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-info-soft text-info flex items-center justify-center shrink-0">
            <Stethoscope className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Total Doctors
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {Number(summary.totalDoctors || total || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Company-wide reference directory
            </div>
          </div>
        </div>

        {/* Card 2: Active Practitioners */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-success-soft text-success flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Active Practitioners
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {Number(summary.activeDoctors || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate mt-0.5">
              Ready for prescription billing
            </div>
          </div>
        </div>

        {/* Card 3: Clinical Specialties */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Award className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Clinical Specialties
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {Number(summary.specialtiesCount || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Medical departments represented
            </div>
          </div>
        </div>

        {/* Card 4: Affiliated Hospitals */}
        <div className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors">
          <div className="size-9 rounded-lg bg-warning-soft text-warning flex items-center justify-center shrink-0">
            <Building2 className="size-4.5 stroke-[1.8]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-text-muted truncate">
              Hospitals & Clinics
            </div>
            <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
              {Number(summary.hospitalsCount || 0).toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-text-muted truncate mt-0.5">
              Healthcare centers affiliated
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Toolbar ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Compact Search Input (Consistent Decreased Width) */}
        <div className="w-[240px] sm:w-[280px] lg:w-[320px]">
          <UIInput
            type="text"
            value={filters.search || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search doctors by name, hospital, reg #..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => onSearchChange("")}
            className="w-full"
          />
        </div>

        {/* Upfront Specialty Filter */}
        <div className="w-[170px] sm:w-[195px]">
          <UISelect
            value={filters.specialty || "all"}
            onChange={(val) => onSpecialtyChange(val)}
            options={SPECIALTY_FILTER_OPTIONS}
            placeholder="All Specialties"
            size="md"
          />
        </div>

        {/* Workspace Level Company Filter (Zero width/elements at Company level) */}
        <CompanyFilterSelect
          value={companyFilter?.selectedCompanyId || "all"}
          onChange={companyFilter?.setSelectedCompanyId}
          size="md"
          className="w-[170px] sm:w-[195px]"
        />

        {/* Filter Modal Trigger Button */}
        <UIButton
          type="button"
          variant={activeFilterCount > 0 ? "secondary" : "outline"}
          size="md"
          onClick={() => setIsFilterModalOpen(true)}
          startIcon={
            <Filter
              className={cn(
                "size-3.5",
                activeFilterCount > 0 ? "text-primary" : "text-text-muted"
              )}
            />
          }
          className={cn(
            "h-10 px-3 text-xs sm:text-sm font-semibold gap-1.5 transition-all select-none",
            activeFilterCount > 0 &&
              "border-primary/40 bg-primary/10 text-primary font-bold shadow-2xs"
          )}
          title="Open filters dialog"
        >
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="size-4.5 rounded-full bg-primary text-white text-[10.5px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </UIButton>

        {/* Quick Reset (only visible when filters or search query are active) */}
        {(activeFilterCount > 0 ||
          filters.search ||
          (filters.specialty && filters.specialty !== "all")) && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={onResetFilters}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
            className="h-10 px-2 text-xs text-text-muted hover:text-text"
            title="Reset all filters"
          >
            Reset
          </UIButton>
        )}

        {/* Toolbar Action Cluster */}
        <div className="flex items-center gap-1.5 ml-auto">
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={onRefresh}
            className="h-10 w-10 p-0 text-text-muted hover:text-text"
            title="Refresh doctors table"
          >
            <RefreshCw
              className={cn(
                "size-4 text-text-muted hover:text-primary",
                isLoading && "animate-spin text-primary"
              )}
            />
          </UIButton>

          <PermissionGate permission="doctor:create">
            <UIButton
              type="button"
              variant="primary"
              size="md"
              startIcon={<Plus className="size-3.5" />}
              onClick={onOpenCreateDialog}
              className="h-10 px-3.5 text-xs font-semibold shadow-xs"
            >
              Add Doctor
            </UIButton>
          </PermissionGate>
        </div>
      </div>

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
                <UITableHead sticky className="min-w-[240px]">
                  Doctor Profile
                </UITableHead>
                <UITableHead sticky align="center" className="min-w-[140px]">
                  Specialty
                </UITableHead>
                <UITableHead sticky className="min-w-[180px]">
                  Hospital / Clinic
                </UITableHead>
                <UITableHead sticky align="center" className="min-w-[130px]">
                  Medical Reg #
                </UITableHead>
                <UITableHead sticky className="min-w-[160px]">
                  Contact Info
                </UITableHead>
                <UITableHead sticky align="center" className="min-w-[100px]">
                  Status
                </UITableHead>
                <UITableHead sticky align="right" className="min-w-[80px]">
                  Actions
                </UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading && doctors.length === 0 ? (
                <UITableLoading colSpan={7} rows={8} />
              ) : doctors.length === 0 ? (
                <UITableEmpty
                  colSpan={7}
                  title="No doctors found"
                  description={
                    filters.search || activeFilterCount > 0
                      ? "No doctors match your active filter criteria. Try clearing search or resetting filters."
                      : "No doctor profiles registered yet."
                  }
                  action={
                    filters.search || activeFilterCount > 0 ? (
                      <UIButton
                        variant="secondary"
                        size="sm"
                        onClick={onResetFilters}
                      >
                        Clear Filters
                      </UIButton>
                    ) : (
                      <UIButton
                        variant="primary"
                        size="sm"
                        startIcon={<Plus className="size-4" />}
                        onClick={onOpenCreateDialog}
                      >
                        Add First Doctor
                      </UIButton>
                    )
                  }
                />
              ) : (
                doctors.map((doc) => {
                  const id = doc._id || doc.id;
                  const initials = getInitials(doc.name);

                  return (
                    <UITableRow
                      key={id}
                      onClick={() => onOpenViewDialog(doc)}
                      className="group cursor-pointer transition-colors hover:bg-surface-hover/70 h-13 border-b border-border/60 last:border-b-0"
                    >
                      {/* 1. Doctor Profile */}
                      <UITableCell className="py-2">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-lg bg-info-soft text-info font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="text-xs sm:text-[13px] font-bold text-text group-hover:text-primary transition-colors truncate max-w-[200px] sm:max-w-[240px]">
                                {doc.name}
                              </div>
                              <CompanyBadge company={doc.companyId} />
                            </div>
                            <div className="text-[11px] text-text-muted font-mono flex items-center gap-1.5 mt-0.5">
                              {doc.doctorCode ? (
                                <span className="bg-surface-alt px-1.5 py-0.5 rounded text-[10px] font-semibold text-text-muted">
                                  {doc.doctorCode}
                                </span>
                              ) : null}
                              {doc.address && (
                                <span className="truncate max-w-[140px] text-text-muted">
                                  {doc.address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </UITableCell>

                      {/* 2. Specialty */}
                      <UITableCell align="center" className="py-2">
                        <span className="inline-flex items-center gap-1 font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full text-xs">
                          <Award className="size-3" />
                          <span className="truncate max-w-[130px]">
                            {doc.specialty || "General Physician"}
                          </span>
                        </span>
                      </UITableCell>

                      {/* 3. Hospital / Clinic */}
                      <UITableCell className="py-2">
                        {doc.hospitalName ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-text">
                            <Building2 className="size-3.5 text-text-muted shrink-0" />
                            <span className="truncate max-w-[180px]">
                              {doc.hospitalName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted italic">
                            Independent Practice
                          </span>
                        )}
                      </UITableCell>

                      {/* 4. Registration # */}
                      <UITableCell align="center" className="py-2">
                        {doc.registrationNumber ? (
                          <button
                            type="button"
                            onClick={(e) =>
                              handleCopy(doc.registrationNumber, `reg-${id}`, e)
                            }
                            className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-alt border border-border text-text hover:border-primary/40 transition cursor-pointer"
                            title="Click to copy registration number"
                          >
                            <span>{doc.registrationNumber}</span>
                            {copiedKey === `reg-${id}` ? (
                              <Check className="size-3 text-success shrink-0" />
                            ) : (
                              <Copy className="size-3 text-text-muted group-hover:text-text shrink-0" />
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-text-muted font-mono">—</span>
                        )}
                      </UITableCell>

                      {/* 5. Contact Info */}
                      <UITableCell className="py-2">
                        <div className="space-y-0.5">
                          {(doc.mobile || doc.phone) ? (
                            <button
                              type="button"
                              onClick={(e) =>
                                handleCopy(doc.mobile || doc.phone, `mob-${id}`, e)
                              }
                              className="flex items-center gap-1 font-mono text-[13px] font-bold text-text/90 tracking-tight hover:text-primary transition cursor-pointer"
                              title="Click to copy mobile number"
                            >
                              <Phone className="size-3 text-text-muted" />
                              <span>{doc.mobile || doc.phone}</span>
                              {copiedKey === `mob-${id}` ? (
                                <Check className="size-3 text-success" />
                              ) : null}
                            </button>
                          ) : (
                            <span className="text-xs text-text-muted font-mono">
                              No mobile
                            </span>
                          )}
                          {doc.email && (
                            <div className="text-[11px] text-text-muted truncate max-w-[150px] flex items-center gap-1">
                              <Mail className="size-2.5 text-text-muted shrink-0" />
                              <span className="truncate">{doc.email}</span>
                            </div>
                          )}
                        </div>
                      </UITableCell>

                      {/* 6. Status */}
                      <UITableCell align="center" className="py-2">
                        <UIBadge
                          variant={doc.status === "active" ? "success" : "neutral"}
                          size="sm"
                        >
                          {(doc.status || "active").toUpperCase()}
                        </UIBadge>
                      </UITableCell>

                      {/* 7. Actions Dropdown */}
                      <UITableCell align="right" className="py-2">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-end"
                        >
                          <UIDropdown>
                            <UIDropdownTrigger asChild>
                              <UIButton
                                variant="ghost"
                                size="sm"
                                className="size-8 p-0 text-text-muted hover:text-text hover:bg-surface-hover rounded-lg"
                                title="Actions"
                              >
                                <MoreVertical className="size-4" />
                              </UIButton>
                            </UIDropdownTrigger>
                            <UIDropdownMenu align="end" className="w-48">
                              <UIDropdownItem
                                onClick={() => onOpenViewDialog(doc)}
                                icon={<Eye className="size-4 text-sky-600" />}
                              >
                                View Profile
                              </UIDropdownItem>
                              <PermissionGate permission="doctor:update">
                                <UIDropdownItem
                                  onClick={() => onOpenEditDialog(doc)}
                                  icon={<Edit3 className="size-4 text-amber-600" />}
                                >
                                  Edit Doctor
                                </UIDropdownItem>
                              </PermissionGate>
                              <UIDropdownDivider />
                              <PermissionGate permission="doctor:delete">
                                <UIDropdownItem
                                  onClick={() => onOpenDeleteConfirm(doc)}
                                  icon={<Trash2 className="size-4 text-error" />}
                                  className="text-error hover:bg-error-soft/60 focus:bg-error-soft/60"
                                >
                                  Delete Doctor
                                </UIDropdownItem>
                              </PermissionGate>
                            </UIDropdownMenu>
                          </UIDropdown>
                        </div>
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
              onLoadMore={onLoadMore}
              hasMore={hasMore}
              isLoading={isLoadingMore}
              rootRef={tableContainerRef}
            />
          )}
        </UITableScrollArea>
      </div>

      {/* ── Filter Modal Dialog ──────────────────────────────────────────────── */}
      <DoctorFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        selectedSpecialty={filters.specialty || "all"}
        onChangeSpecialty={(val) => onSpecialtyChange(val)}
        selectedStatus={filters.status || "all"}
        onChangeStatus={(val) => onStatusChange(val)}
        sortOption={filters.sort || "createdAt-desc"}
        onChangeSort={(val) => onSortChange(val)}
        onReset={onResetFilters}
      />
    </div>
  );
};

export default DoctorsDesktopPage;
