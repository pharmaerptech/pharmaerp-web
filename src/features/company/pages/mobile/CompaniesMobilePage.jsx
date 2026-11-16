// src/features/company/pages/mobile/CompaniesMobilePage.jsx

import {
  Building2,
  Plus,
  Download,
  RotateCcw,
  Search,
  MoreHorizontal,
  Eye,
  Edit3,
  Users,
  Trash2,
  MapPin,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  UISearchInput,
  UIButton,
  UIBadge,
  UIEmptyState,
  UIDropdown,
  UIDropdownTrigger,
  UIDropdownMenu,
  UIDropdownItem,
  UIDropdownDivider,
  UISelect,
  UIPagination,
  UISkeleton,
  PermissionGate,
  UI_TOOLBAR_VIEWS as VIEW_MODES,
} from "@/components/ui";
import { CompanyEmployeesDrawer, CompanyTableView } from "../../components";
import { cn } from "@/lib/utils";

const formatMemberCount = (company) => {
  const count =
    company?.memberCount ??
    company?.membersCount ??
    company?.highlights?.totalMembers ??
    0;
  return `${count} ${count === 1 ? "Member" : "Members"}`;
};

const formatLocation = (company) => {
  if (company?.locationSummary) return company.locationSummary;
  const parts = [
    company?.address?.addressLine1,
    company?.address?.city,
    company?.address?.state,
  ].filter(Boolean);
  if (parts.length) return parts.join(", ");
  return company?.address?.city || company?.address?.state || "India";
};

export const CompaniesMobilePage = ({
  companies = [],
  paginatedCompanies = [],
  stats = [],
  filters,
  viewMode = VIEW_MODES.GRID,
  onViewModeChange,
  statusOptions = [],
  companyTypeOptions = [],
  totalCompanies = 0,
  filteredCompaniesCount = 0,
  hasCompanies,
  hasFilteredCompanies,
  isLoading,
  currentPage = 1,
  pageSize = 6,
  totalPages = 1,
  handlePageChange,
  handlePageSizeChange,
  handleFilterChange,
  handleSearchChange,
  handleClearFilters,
  canCreateCompany = true,
  canDeleteCompany = true,
  handleCreateCompany,
  handleViewCompany,
  handleEditCompany,
  handleViewEmployees,
  handleDeleteCompany,
  handleRefresh,
  activeFilterChips = [],
  selectedCompanyForEmployees,
  isEmployeeDrawerOpen,
  handleCloseEmployeesDrawer,
}) => {
  const activeCount =
    stats.find((s) => s.id === "active")?.value ??
    companies.filter((c) => c.status === "active").length;
  const inactiveCount =
    (stats.find((s) => s.id === "inactive")?.value || 0) +
    (stats.find((s) => s.id === "suspended")?.value || 0);

  const shouldShowPagination = hasFilteredCompanies && filteredCompaniesCount > pageSize;
  const displayList = paginatedCompanies.length ? paginatedCompanies : companies;

  const handleExportCSV = () => {
    if (!companies.length) return;
    const headers = [
      "Company Name",
      "Type",
      "Status",
      "Email",
      "Phone",
      "Location",
      "Employees",
    ];
    const rows = companies.map((c) => [
      `"${c.displayName || c.name || ""}"`,
      `"${c.displayType || c.type || ""}"`,
      `"${c.status || ""}"`,
      `"${c.displayEmail || c.email || ""}"`,
      `"${c.displayPhone || ""}"`,
      `"${c.locationSummary || ""}"`,
      `"${c.memberCount ?? 0}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `companies_mobile_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full bg-bg text-text p-2.5 sm:p-3 pb-20 space-y-2.5 max-w-[480px] mx-auto">
      {/* ── 1. Header Area with Minimal Padding ── */}
      <div className="flex flex-col gap-2 pt-0.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-text tracking-tight flex items-center gap-1.5">
              <span className="font-mono tabular-nums">{totalCompanies}</span> Companies
            </h1>
            <div className="flex items-center gap-3 text-xs font-semibold mt-0.5">
              <span className="inline-flex items-center gap-1 text-text">
                <span className="size-2 rounded-full bg-success ring-2 ring-success/20" />
                Active{" "}
                <strong className="font-mono tabular-nums text-text font-bold">
                  {activeCount}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1 text-text">
                <span className="size-2 rounded-full bg-error ring-2 ring-error/20" />
                Inactive{" "}
                <strong className="font-mono tabular-nums text-text font-bold">
                  {inactiveCount}
                </strong>
              </span>
            </div>
          </div>

          {canCreateCompany && (
            <PermissionGate permission="company:create">
              <UIButton
                type="button"
                variant="primary"
                size="sm"
                startIcon={<Plus className="size-3.5" />}
                onClick={handleCreateCompany}
              >
                Add Company
              </UIButton>
            </PermissionGate>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2">
          <UIButton
            type="button"
            variant="outline"
            size="xs"
            fullWidth
            startIcon={
              <RotateCcw
                className={`size-3.5 text-text-muted ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            }
            onClick={handleRefresh}
          >
            Refresh
          </UIButton>

          <UIButton
            type="button"
            variant="outline"
            size="xs"
            fullWidth
            startIcon={<Download className="size-3.5 text-text-muted" />}
            onClick={handleExportCSV}
          >
            Export
          </UIButton>
        </div>
      </div>

      {/* ── 2. Compact Search & Filter Toolbar with View Switcher ── */}
      <div className="bg-surface border border-border/60 rounded-xl p-2.5 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <UISearchInput
              placeholder="Search companies..."
              value={filters.search}
              onChange={handleSearchChange}
              onClear={() => handleSearchChange("")}
              size="sm"
            />
          </div>

          {/* Segmented View Switcher */}
          <div className="flex items-center rounded-lg border border-border bg-surface-alt/75 p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange?.(VIEW_MODES.GRID)}
              className={cn(
                "flex items-center justify-center p-1.5 rounded-md transition-all text-xs cursor-pointer",
                viewMode === VIEW_MODES.GRID
                  ? "bg-surface text-primary shadow-xs font-bold"
                  : "text-text-muted hover:text-text"
              )}
              title="Grid View"
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange?.(VIEW_MODES.LIST)}
              className={cn(
                "flex items-center justify-center p-1.5 rounded-md transition-all text-xs cursor-pointer",
                viewMode === VIEW_MODES.LIST
                  ? "bg-surface text-primary shadow-xs font-bold"
                  : "text-text-muted hover:text-text"
              )}
              title="List View"
            >
              <List className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <UISelect
            value={filters.type}
            onChange={(val) => handleFilterChange({ type: val })}
            options={companyTypeOptions}
            placeholder="All Types"
            size="sm"
          />
          <UISelect
            value={filters.status}
            onChange={(val) => handleFilterChange({ status: val })}
            options={statusOptions}
            placeholder="All Status"
            size="sm"
          />
        </div>

        {activeFilterChips.length > 0 && (
          <div className="flex justify-end">
            <UIButton
              type="button"
              variant="ghost"
              size="xs"
              startIcon={<RotateCcw className="size-3 text-text-muted" />}
              onClick={handleClearFilters}
            >
              Reset Filters
            </UIButton>
          </div>
        )}
      </div>

      {/* ── 3. Company Cards Stream / List ── */}
      {isLoading && !hasCompanies ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-surface rounded-2xl p-4 flex flex-col items-center space-y-2.5 shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
            >
              <UISkeleton className="size-16 rounded-[12px]" />
              <UISkeleton className="h-4 w-28 rounded" />
              <UISkeleton className="h-3 w-20 rounded" />
              <div className="w-full pt-2.5 border-t border-border/30 grid grid-cols-2 gap-2">
                <UISkeleton className="h-6 rounded" />
                <UISkeleton className="h-6 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : !hasCompanies ? (
        <div className="py-8 bg-surface rounded-2xl shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          <UIEmptyState
            icon={<Building2 className="size-8 text-primary" />}
            title="No companies yet"
            description="Add business units or company profiles to manage operations."
            primaryAction={
              <PermissionGate permission="company:create">
                <UIButton
                  variant="primary"
                  size="sm"
                  startIcon={<Plus className="size-3.5" />}
                  onClick={handleCreateCompany}
                >
                  Add Company
                </UIButton>
              </PermissionGate>
            }
          />
        </div>
      ) : !hasFilteredCompanies ? (
        <div className="py-8 bg-surface rounded-2xl shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          <UIEmptyState
            icon={<Search className="size-8 text-text-muted" />}
            title="No matching companies"
            description="Try changing your search keywords or active filters."
            primaryAction={
              <UIButton variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </UIButton>
            }
          />
        </div>
      ) : viewMode === VIEW_MODES.LIST ? (
        <CompanyTableView
          companies={displayList}
          onView={handleViewCompany}
          onEdit={handleEditCompany}
          onViewEmployees={handleViewEmployees}
          onDelete={canDeleteCompany ? handleDeleteCompany : undefined}
        />
      ) : (
        <div className="space-y-2.5">
          {displayList.map((company) => {
            const name = company.displayName || company.name || "Untitled";
            const type = company.displayType || company.type || "Proprietorship";
            const memberCountText = formatMemberCount(company);
            const location = formatLocation(company);
            const status = company.status || "active";

            return (
              <div
                key={company._id}
                onClick={() => handleViewCompany(company)}
                className="bg-surface rounded-2xl shadow-xs transition-all duration-150 flex flex-col relative border-0 ring-1 ring-black/[0.04] dark:ring-white/[0.06] hover:ring-primary/40 p-3.5 space-y-2.5 cursor-pointer active:scale-[0.99]"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-primary font-bold text-xs uppercase border border-primary/20">
                      <Building2 className="size-5" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-text tracking-tight truncate">
                        {name}
                      </h3>
                      <p className="text-xs text-text-muted font-medium truncate capitalize mt-0.5">
                        {type}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <UIBadge
                      variant="soft"
                      color={status === "active" ? "success" : "neutral"}
                      className="text-[10px] capitalize font-semibold py-0 px-1.5"
                    >
                      {status}
                    </UIBadge>

                    <UIDropdown align="right">
                      <UIDropdownTrigger asChild>
                        <button
                          type="button"
                          aria-label="Actions menu"
                          className="size-8 rounded-xl flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
                        >
                          <MoreHorizontal className="size-5" />
                        </button>
                      </UIDropdownTrigger>

                      <UIDropdownMenu width="w-48" className="shadow-2xl border border-border/60">
                        <UIDropdownItem
                          icon={<Eye className="size-4 text-primary" />}
                          onClick={() => handleViewCompany(company)}
                        >
                          View Company
                        </UIDropdownItem>
                        <UIDropdownItem
                          icon={<Edit3 className="size-4" />}
                          onClick={() => handleEditCompany(company)}
                        >
                          Edit Company
                        </UIDropdownItem>
                        {canDeleteCompany && (
                          <>
                            <UIDropdownDivider />
                            <UIDropdownItem
                              destructive
                              icon={<Trash2 className="size-4" />}
                              onClick={() => handleDeleteCompany(company)}
                            >
                              Delete Company
                            </UIDropdownItem>
                          </>
                        )}
                      </UIDropdownMenu>
                    </UIDropdown>
                  </div>
                </div>

                {/* Shaded 2-Column Metadata Strip */}
                <div className="bg-surface-alt/75 border-t border-border/30 p-2.5 rounded-xl grid grid-cols-2 gap-2 text-left">
                  <div>
                    <span className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                      <Users className="size-3 text-text-muted/70 shrink-0" />
                      Members Access
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewEmployees?.(company);
                      }}
                      className="block text-xs font-bold text-primary font-mono tabular-nums text-left mt-0.5 hover:underline"
                    >
                      {memberCountText}
                    </button>
                  </div>

                  <div>
                    <span className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="size-3 text-text-muted/70 shrink-0" />
                      Location
                    </span>
                    <p className="block text-xs font-semibold text-text truncate mt-0.5" title={location}>
                      {location}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4. Bottom Pagination ── */}
      {shouldShowPagination && (
        <div className="bg-surface rounded-xl shadow-xs ring-1 ring-black/[0.04] dark:ring-white/[0.06] overflow-hidden">
          <UIPagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={filteredCompaniesCount}
            pageSize={pageSize}
            pageSizeOptions={[6, 12, 24]}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            showSummary
            showPageSize={false}
          />
        </div>
      )}

      {/* ── Employee Access Drawer ── */}
      <CompanyEmployeesDrawer
        isOpen={isEmployeeDrawerOpen}
        onClose={handleCloseEmployeesDrawer}
        company={selectedCompanyForEmployees}
      />
    </div>
  );
};

export default CompaniesMobilePage;
