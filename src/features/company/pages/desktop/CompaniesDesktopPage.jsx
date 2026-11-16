// src/features/company/pages/desktop/CompaniesDesktopPage.jsx

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Copy,
  MapPin,
  Mail,
  Phone,
  Edit3,
  Trash2,
  MoreVertical,
  Eye,
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
  uiToast,
} from "@/components/ui";
import useCompany from "@/features/company/hooks/useCompany";
import { cn } from "@/lib/utils";

const PAGE_LIMIT = 20;

const statusBadgeVariant = (status) => {
  switch (status) {
    case "active":
      return { variant: "soft", color: "success", label: "Active" };
    case "inactive":
      return { variant: "soft", color: "neutral", label: "Inactive" };
    case "suspended":
      return { variant: "soft", color: "danger", label: "Suspended" };
    default:
      return { variant: "soft", color: "neutral", label: status || "Unknown" };
  }
};

export const CompaniesDesktopPage = ({
  companies = [],
  allCompanies = [],
  stats = [],

  filters = { search: "", status: "all", type: "all" },
  statusOptions = [],
  companyTypeOptions = [],

  isLoading = false,

  handleFilterChange,
  handleSearchChange,
  handleClearFilters,
  canCreateCompany = true,
  canDeleteCompany = true,

  handleRefresh,
  handleCreateCompany,
  handleViewCompany,
  handleEditCompany,
  handleDeleteCompany,
}) => {
  const tableContainerRef = useRef(null);
  const { currentCompany } = useCompany();

  // Infinite Scroll state - incremental client-side batches
  const [visibleCount, setVisibleCount] = useState(PAGE_LIMIT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sync visible count during render when filters change
  const currentFilterKey = `${filters.search || ""}-${filters.status || ""}-${filters.type || ""}`;
  const [prevFilterKey, setPrevFilterKey] = useState(currentFilterKey);
  if (prevFilterKey !== currentFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setVisibleCount(PAGE_LIMIT);
  }

  // Scroll to top on filter change
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [currentFilterKey]);

  const displayedCompanies = useMemo(() => {
    return (companies || []).slice(0, visibleCount);
  }, [companies, visibleCount]);

  const hasMore = visibleCount < (companies || []).length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + PAGE_LIMIT, (companies || []).length)
      );
      setIsLoadingMore(false);
    }, 120);
  }, [isLoadingMore, hasMore, companies]);

  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.status && filters.status !== "all") ||
      (filters.type && filters.type !== "all")
  );

  const handleCopy = useCallback((text, label) => {
    if (!text || text === "-") return;
    navigator.clipboard.writeText(text);
    uiToast.success(`${label} Copied`, `"${text}" copied to clipboard.`);
  }, []);

  // 4 Top Stat Cards
  const statCards = useMemo(() => {
    const list = allCompanies.length ? allCompanies : companies;
    const total = list.length;
    const active = list.filter((c) => c.status === "active").length;
    const inactive = list.filter((c) => c.status === "inactive").length;
    const suspended = list.filter((c) => c.status === "suspended").length;

    return [
      {
        id: "total",
        title: "Total Companies",
        value: stats.find((s) => s.id === "total")?.value ?? total,
        subtitle: "Registered legal entities",
        icon: Building2,
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
      },
      {
        id: "active",
        title: "Active Profiles",
        value: stats.find((s) => s.id === "active")?.value ?? active,
        subtitle: "Operational business units",
        icon: CheckCircle2,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      },
      {
        id: "inactive",
        title: "Inactive Profiles",
        value: stats.find((s) => s.id === "inactive")?.value ?? inactive,
        subtitle: "Dormant or paused",
        icon: Clock,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      },
      {
        id: "suspended",
        title: "Suspended",
        value: stats.find((s) => s.id === "suspended")?.value ?? suspended,
        subtitle: "Compliance locks",
        icon: AlertTriangle,
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
      },
    ];
  }, [allCompanies, companies, stats]);

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden select-none">
      {/* ── 1. Top Stat Cards Grid ───────────────────────────────────────── */}
      <div className="shrink-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.id}
                className="bg-surface rounded-xl border border-border p-3 flex items-center gap-3 shadow-2xs transition-colors"
              >
                <div
                  className={cn(
                    "size-9 rounded-lg flex items-center justify-center shrink-0 border",
                    stat.bg,
                    stat.border,
                    stat.color
                  )}
                >
                  <Icon className="size-4.5 stroke-[1.8]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11.5px] font-medium text-text-muted truncate">
                    {stat.title}
                  </div>
                  <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-text-muted truncate mt-0.5">
                    {stat.subtitle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. Streamlined Single-Row Toolbar ────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px] sm:min-w-[240px]">
          <UIInput
            type="text"
            value={filters.search || ""}
            onChange={(e) => handleSearchChange?.(e.target.value)}
            placeholder="Search company by name, code, GSTIN, PAN, city..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange?.("")}
            className="w-full"
          />
        </div>

        {/* Company Type Select */}
        <div className="w-[150px] sm:w-[170px]">
          <UISelect
            value={filters.type || "all"}
            onChange={(val) => handleFilterChange?.({ type: val })}
            options={companyTypeOptions}
            placeholder="All Types"
            size="md"
          />
        </div>

        {/* Status Select */}
        <div className="w-[130px] sm:w-[145px]">
          <UISelect
            value={filters.status || "all"}
            onChange={(val) => handleFilterChange?.({ status: val })}
            options={statusOptions}
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
            className="h-10 px-2.5 text-xs text-text-muted hover:text-text"
            title="Reset all filters"
          >
            Reset
          </UIButton>
        )}

        {/* Action Cluster (Right) */}
        <div className="flex items-center gap-1.5 ml-auto">
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={handleRefresh}
            className="h-10 w-10 p-0 text-text-muted hover:text-text cursor-pointer"
            title="Refresh company profiles"
          >
            <RefreshCw
              className={cn(
                "size-4 text-text-muted hover:text-primary",
                isLoading && "animate-spin text-primary"
              )}
            />
          </UIButton>

          {canCreateCompany && (
            <PermissionGate permission="company:create">
              <UIButton
                type="button"
                variant="primary"
                size="md"
                startIcon={<Plus className="size-4" />}
                onClick={handleCreateCompany}
                className="h-10 px-3.5 text-xs font-semibold shadow-xs"
              >
                Add Company
              </UIButton>
            </PermissionGate>
          )}
        </div>
      </div>

      {/* ── 3. Constrained-Height Table with Sticky Header & Infinite Scroll ── */}
      <div className="flex-1 min-h-0 rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
        <UITableScrollArea containerRef={tableContainerRef} className="divide-y divide-border/60">
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full"
          >
            {/* Sticky Table Header */}
            <UITableHeader
              sticky
              className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs"
            >
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
                <UITableHead sticky className="min-w-[280px]">Company Entity &amp; Code</UITableHead>
                <UITableHead sticky className="min-w-[130px]">Business Type</UITableHead>
                <UITableHead sticky className="min-w-[170px]">GSTIN &amp; PAN</UITableHead>
                <UITableHead sticky className="min-w-[200px]">Contact Info</UITableHead>
                <UITableHead sticky className="min-w-[210px]">Registered Location</UITableHead>
                <UITableHead sticky align="center" className="min-w-[90px]">Status</UITableHead>
                <UITableHead sticky align="right" className="w-14 min-w-[56px] text-right">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading && displayedCompanies.length === 0 ? (
                <UITableLoading colSpan={7} rows={8} />
              ) : displayedCompanies.length === 0 ? (
                <UITableEmpty
                  colSpan={7}
                  title="No companies found"
                  description={
                    hasActiveFilters
                      ? "No company profiles match your active search or filter criteria."
                      : "Register your primary legal entity to unlock billing and accounting."
                  }
                  action={
                    hasActiveFilters ? (
                      <UIButton variant="outline" size="sm" onClick={handleClearFilters}>
                        Clear Filters
                      </UIButton>
                    ) : (
                      <PermissionGate permission="company:create">
                        <UIButton
                          variant="primary"
                          size="sm"
                          onClick={handleCreateCompany}
                          startIcon={<Plus className="size-4" />}
                        >
                          Register First Company
                        </UIButton>
                      </PermissionGate>
                    )
                  }
                />
              ) : (
                displayedCompanies.map((company) => {
                  const isCurrent = currentCompany?._id === company._id;
                  const name = company.displayName || company.name || "Untitled Company";
                  const code = company.companyCode || "N/A";
                  const type = company.displayType || company.type || "Proprietorship";
                  const gstin = company.displayGstin || company.gstin || "-";
                  const pan = company.displayPan || company.pan || "-";
                  const email = company.displayEmail || company.email || "-";
                  const phone = company.displayPhone || company.phones?.mobile || "-";
                  const location =
                    company.locationSummary ||
                    company.addressLine1 ||
                    [company.address?.city, company.address?.state].filter(Boolean).join(", ") ||
                    "Registered Office Not Set";
                  const statusMeta = statusBadgeVariant(company.status);

                  return (
                    <UITableRow
                      key={company._id}
                      onClick={() => handleViewCompany?.(company)}
                      className={cn(
                        "hover:bg-surface-alt/50 transition-colors cursor-pointer",
                        isCurrent && "bg-primary/[0.03]"
                      )}
                    >
                      {/* Company Name & Code */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="size-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20 uppercase shadow-2xs">
                            {name.charAt(0) || "C"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                onClick={() => handleViewCompany?.(company)}
                                className="font-bold text-xs text-text hover:text-primary transition-colors cursor-pointer truncate"
                                title={name}
                              >
                                {name}
                              </span>
                              <span className="font-mono text-[10.5px] font-bold px-1.5 py-0.2 rounded bg-surface-alt border border-border text-text-muted">
                                {code}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {isCurrent ? (
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Active Context
                                </span>
                              ) : (
                                <span className="text-[10.5px] text-text-muted">
                                  {company.displayOwnerName ? `Owner: ${company.displayOwnerName}` : "Company Entity"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </UITableCell>

                      {/* Business Type */}
                      <UITableCell className="py-2.5 px-3">
                        <UIBadge variant="soft" color="primary" size="xs" className="capitalize">
                          {type}
                        </UIBadge>
                      </UITableCell>

                      {/* Tax Credentials (GSTIN / PAN) */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="space-y-0.5 text-xs font-mono">
                          {gstin !== "-" ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-text-muted font-sans font-semibold">GST:</span>
                              <span className="font-bold text-text truncate max-w-[110px]" title={gstin}>
                                {gstin}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(gstin, "GSTIN");
                                }}
                                className="p-0.5 text-text-muted hover:text-text cursor-pointer"
                                title="Copy GSTIN"
                              >
                                <Copy className="size-2.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-text-muted text-[11px] font-sans">No GSTIN</span>
                          )}

                          {pan !== "-" && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="text-[10px] text-text-muted font-sans font-semibold">PAN:</span>
                              <span className="text-text-muted truncate max-w-[90px]">{pan}</span>
                            </div>
                          )}
                        </div>
                      </UITableCell>

                      {/* Contact Info */}
                      <UITableCell className="py-2.5 px-3 min-w-[200px]">
                        <div className="space-y-0.5 text-xs">
                          {email !== "-" && (
                            <div className="flex items-center gap-1.5 text-text truncate max-w-[190px]" title={email}>
                              <Mail className="size-3 text-text-muted shrink-0" />
                              <span className="truncate">{email}</span>
                            </div>
                          )}
                          {phone !== "-" && (
                            <div className="flex items-center gap-1.5 text-text-muted text-[11px]">
                              <Phone className="size-3 text-text-muted shrink-0" />
                              <span>{phone}</span>
                            </div>
                          )}
                          {email === "-" && phone === "-" && (
                            <span className="text-text-muted text-xs">—</span>
                          )}
                        </div>
                      </UITableCell>

                      {/* Registered Location */}
                      <UITableCell className="py-2.5 px-3 min-w-[210px]">
                        <div className="flex items-center gap-1.5 text-xs text-text-muted max-w-[200px] truncate" title={location}>
                          <MapPin className="size-3 text-text-muted shrink-0" />
                          <span className="truncate">{location}</span>
                        </div>
                      </UITableCell>

                      {/* Status */}
                      <UITableCell align="center" className="py-2.5 px-3">
                        <UIBadge
                          variant={statusMeta.variant}
                          color={statusMeta.color}
                          size="xs"
                        >
                          {statusMeta.label}
                        </UIBadge>
                      </UITableCell>

                      {/* Actions */}
                      <UITableCell
                        align="right"
                        className="py-2.5 px-3 w-14 min-w-[56px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end">
                          {/* Overflow Menu */}
                          <UIDropdown>
                            <UIDropdownTrigger asChild>
                              <UIButton
                                type="button"
                                variant="ghost"
                                size="xs"
                                className="size-7 p-0 text-text-muted hover:text-text cursor-pointer"
                                title="More options"
                              >
                                <MoreVertical className="size-3.5" />
                              </UIButton>
                            </UIDropdownTrigger>
                            <UIDropdownMenu align="end" className="w-44">
                              <UIDropdownItem
                                icon={<Eye className="size-4" />}
                                onClick={() => handleViewCompany?.(company)}
                              >
                                View Company
                              </UIDropdownItem>
                              <UIDropdownItem
                                icon={<Edit3 className="size-4" />}
                                onClick={() => handleEditCompany?.(company)}
                              >
                                Edit Company
                              </UIDropdownItem>
                              {canDeleteCompany && (
                                <>
                                  <UIDropdownDivider />
                                  <UIDropdownItem
                                    destructive
                                    icon={<Trash2 className="size-4" />}
                                    onClick={() => handleDeleteCompany?.(company)}
                                  >
                                    Delete Company
                                  </UIDropdownItem>
                                </>
                              )}
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

          {/* Infinite Scroll sentinel */}
          <UIInfiniteScroll
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onLoadMore={handleLoadMore}
            scrollThreshold={0.8}
          />
        </UITableScrollArea>
      </div>
    </div>
  );
};

export default CompaniesDesktopPage;
