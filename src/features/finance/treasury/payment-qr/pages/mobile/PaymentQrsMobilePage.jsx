import React, { useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiRefreshCw,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiStar,
  FiInbox,
  FiAlertCircle,
  FiFilter,
  FiCopy,
  FiMoreVertical,
} from "react-icons/fi";
import { LuQrCode } from "react-icons/lu";

import {
  AppBox,
  AppButton,
  AppCard,
  AppHeading,
  AppIconButton,
  AppInput,
  AppSelect,
  AppStack,
  AppTag,
  AppText,
  AppTablePagination,
  AppMenu,
} from "@/components";
import { BranchFilterSelect, BranchBadge } from "@/components/shared";

const providerOptions = [
  { label: "All Providers", value: "all" },
  { label: "Google Pay", value: "gpay" },
  { label: "PhonePe", value: "phonepe" },
  { label: "Paytm", value: "paytm" },
  { label: "BHIM", value: "bhim" },
  { label: "Razorpay", value: "razorpay" },
  { label: "Cashfree", value: "cashfree" },
  { label: "Other", value: "other" },
];

const statusFilterOptions = [
  { label: "All Statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const PaymentQrsMobilePage = ({
  filters,
  stats,
  pagedQrs = [],
  totalQrs = 0,
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  activeFilterChips = [],
  isLoading = false,
  serverError,
  serverMessage,
  handleFilterChange,
  handleRemoveChip,
  handleClearFilters,
  handlePageChange,
  handlePageSizeChange,
  handleRefresh,
  handleCreateQr,
  canCreateQr = true,
  handleEditQr,
  handleViewDetails,
  handleDeleteQr,
  handleSetPrimary,
  clearError,
  clearMessage,
  currentBranch,
  isCompanyLevel = false,
  selectedBranchId = "all",
  setSelectedBranchId,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const hasFilteredQrs = pagedQrs.length > 0;
  const shouldRenderPagination = hasFilteredQrs && totalQrs > pageSize;

  const handleCopyUpiId = (e, upiId) => {
    e.stopPropagation();
    navigator.clipboard.writeText(upiId);
    alert(`Copied UPI ID: ${upiId}`);
  };

  const getProviderTag = (provider) => {
    const raw = String(provider || "").toUpperCase();
    let bg = "bg-[#f8f9fa] text-[#495057] border-[#dee2e6]";
    if (raw === "GPAY") bg = "bg-[#e8f0fe] text-[#1a73e8] border-[#adcdfc]";
    else if (raw === "PHONEPE") bg = "bg-[#f3e8ff] text-[#7c3aed] border-[#ddd6fe]";
    else if (raw === "PAYTM") bg = "bg-[#e0f2fe] text-[#0284c7] border-[#bae6fd]";
    else if (raw === "BHIM") bg = "bg-[#ccfbf1] text-[#0d9488] border-[#99f6e4]";
    else if (raw === "RAZORPAY") bg = "bg-[#e0e7ff] text-[#4f46e5] border-[#c7d2fe]";
    else if (raw === "CASHFREE") bg = "bg-[#ffedd5] text-[#ea580c] border-[#fed7aa]";

    return (
      <span className={`inline-flex items-center rounded px-1.5 py-0.2 text-[8px] font-bold uppercase border ${bg}`}>
        {raw}
      </span>
    );
  };

  return (
    <section className="w-full bg-bg pb-6">
      <AppBox sx={containerSx}>
        {/* Mobile Page Header */}
        <AppBox sx={headerWrapperSx}>
          <AppStack direction="row" align="center" gap={1} justify="space-between">
            <AppBox sx={{ minWidth: 0, flex: 1, pr: 1.5 }}>
              <AppHeading level={1} weight={850} sx={pageTitleSx}>
                Payment QRs
              </AppHeading>
              <AppText variant="body2" sx={pageSubtitleSx}>
                {currentBranch ? `${currentBranch.name} (${stats.totalCount || 0})` : `UPI QR directories (${stats.totalCount || 0})`}
              </AppText>
            </AppBox>

            <AppStack direction="row" gap={1} align="center" sx={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
              <AppIconButton
                icon={<FiRefreshCw className={isLoading ? "animate-spin" : ""} />}
                variant="outlined"
                colorVariant="neutral"
                size="small"
                rounded="md"
                onClick={handleRefresh}
                disabled={isLoading}
                sx={refreshMobileBtnSx}
              />
              {canCreateQr && (
                <AppIconButton
                  icon={<FiPlus />}
                  variant="filled"
                  colorVariant="success"
                  size="small"
                  rounded="md"
                  onClick={handleCreateQr}
                  sx={createNewBtnSx}
                />
              )}
            </AppStack>
          </AppStack>
        </AppBox>

        {/* inline Search Field */}
        {isCompanyLevel && (
          <div className="mb-2">
            <BranchFilterSelect
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              size="sm"
              className="w-full"
            />
          </div>
        )}
        <div className="px-0 mb-3 flex gap-2">
          <AppInput
            placeholder="Search UPI ID or label..."
            name="search"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            size="small"
            startIcon={<FiSearch className="text-text-muted text-[14px]" />}
            inputSx={searchMobileInputSx}
            sx={{ flex: 1 }}
          />

          <AppIconButton
            icon={<FiFilter />}
            variant={showFilters ? "filled" : "outlined"}
            colorVariant={showFilters ? "primary" : "neutral"}
            size="medium"
            rounded="md"
            onClick={() => setShowFilters(!showFilters)}
            sx={filterBtnSx}
          />
        </div>

        {/* Server Success / Failure Banner Notifications */}
        {serverError && (
          <div className="mb-3 p-3 bg-danger-soft text-danger text-[11px] font-semibold rounded-md border border-danger/25 flex items-center justify-between shadow-sm">
            <span className="flex items-center gap-1.5">
              <FiAlertCircle />
              {serverError}
            </span>
            <button type="button" onClick={clearError} className="font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {serverMessage && (
          <div className="mb-3 p-3 bg-success-soft text-success text-[11px] font-semibold rounded-md border border-success/25 flex items-center justify-between shadow-sm">
            <span>{serverMessage}</span>
            <button type="button" onClick={clearMessage} className="font-bold hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Collapsible Mobile Filters Dropdown panel */}
        {showFilters && (
          <div className="px-0 mb-3">
            <AppCard variant="default" rounded="lg" bordered shadow="none" padding="none" sx={expandableFiltersCardSx}>
              <div className="p-3.5 space-y-3.5">
                <AppSelect
                  label="Status Filter"
                  name="status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  options={statusFilterOptions}
                  size="small"
                  variant="bordered"
                  rounded="md"
                  inputSx={compactFilterInputSx}
                  labelSx={labelSx}
                />

                <AppSelect
                  label="Provider Filter"
                  name="provider"
                  value={filters.provider}
                  onChange={(e) => handleFilterChange("provider", e.target.value)}
                  options={providerOptions}
                  size="small"
                  variant="bordered"
                  rounded="md"
                  inputSx={compactFilterInputSx}
                  labelSx={labelSx}
                />

                <div className="flex gap-2 justify-end pt-1">
                  <AppButton variant="text" colorVariant="primary" size="small" onClick={handleClearFilters}>
                    Clear Filters
                  </AppButton>
                  <AppButton variant="contained" colorVariant="primary" size="small" onClick={() => setShowFilters(false)}>
                    Close
                  </AppButton>
                </div>
              </div>
            </AppCard>
          </div>
        )}

        {/* Filter chips container */}
        {activeFilterChips.length > 0 && (
          <div className="px-0 pb-3 flex items-center gap-1.5 flex-wrap">
            {activeFilterChips.map((chip) => (
              <AppTag
                key={chip.key}
                label={chip.label}
                variant="soft"
                colorVariant="primary"
                onDelete={() => handleRemoveChip(chip.key)}
                size="small"
                rounded="md"
                sx={filterChipSx}
              />
            ))}
          </div>
        )}

        {/* Cards Stack */}
        <div className="px-0 space-y-3">
          {isLoading && !hasFilteredQrs ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-1 bg-surface rounded-lg border border-border">
              <FiRefreshCw className="text-[20px] text-primary animate-spin" />
              <AppText variant="body2" sx={{ color: "var(--app-color-text-muted)", fontWeight: 650 }}>
                Loading registries...
              </AppText>
            </div>
          ) : !hasFilteredQrs ? (
            <AppCard variant="default" rounded="lg" bordered shadow="none" sx={emptyCardSx}>
              <div className="flex flex-col items-center justify-center text-center w-full py-16 px-4">
                <FiInbox className="text-[32px] text-text-muted/40 mb-2" />
                <AppHeading level={3} weight={700} align="center" sx={{ m: 0, fontSize: "12.5px", width: "100%", color: "var(--app-color-text)", mb: 0.5 }}>
                  No Payment QRs Found
                </AppHeading>
                <AppText variant="body2" align="center" sx={emptyStateSubTextSx}>
                  Add a new UPI QR register or refine filter criteria.
                </AppText>
                {activeFilterChips.length > 0 && (
                  <AppButton variant="text" colorVariant="primary" size="small" onClick={handleClearFilters} sx={{ mt: 1.5 }}>
                    Reset Filters
                  </AppButton>
                )}
              </div>
            </AppCard>
          ) : (
            <AppStack direction="column" gap={1.2}>
              {pagedQrs.map((qr) => {
                const isActive = String(qr.status || "").toUpperCase() === "ACTIVE";

                const menuItems = [
                  {
                    id: "view",
                    label: "View Details",
                    icon: <FiEye />,
                    onClick: () => handleViewDetails(qr._id),
                  },
                  {
                    id: "edit",
                    label: "Edit",
                    icon: <FiEdit2 />,
                    onClick: () => handleEditQr(qr._id),
                  },
                ];

                if (!qr.isPrimary) {
                  menuItems.push({
                    id: "set-primary",
                    label: "Set As Primary",
                    icon: <FiStar />,
                    onClick: () => handleSetPrimary(qr._id),
                  });
                }

                menuItems.push({
                  id: "delete",
                  label: "Delete",
                  icon: <FiTrash2 />,
                  onClick: () => handleDeleteQr(qr._id),
                });

                return (
                  <AppCard
                    key={qr._id}
                    variant="default"
                    rounded="lg"
                    bordered
                    shadow="sm"
                    padding="none"
                    sx={qrCardSx}
                  >
                    <AppStack direction="row" align="center" gap={1.5} justify="space-between" sx={{ width: "100%", p: 1.5 }}>
                      {/* Left Side Clickable details wrapper */}
                      <AppStack
                        direction="row"
                        align="center"
                        gap={1.5}
                        sx={{ minWidth: 0, flex: 1, cursor: "pointer" }}
                        onClick={() => handleViewDetails(qr._id)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/10">
                          <LuQrCode className="text-[20px]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <AppHeading level={3} weight={700} sx={qrTitleSx}>
                              {qr.label || "UPI QR Register"}
                            </AppHeading>
                            {qr.branchId && (
                              <BranchBadge branch={qr.branchId} />
                            )}
                            {getProviderTag(qr.provider)}
                            {qr.isPrimary && (
                              <span className="inline-flex items-center rounded bg-[#fff9db] px-1.5 py-0.2 text-[8px] font-bold text-[#f08c00] uppercase tracking-wide">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-success" : "bg-danger"}`}></span>
                            <span className={`text-[10px] font-bold capitalize ${isActive ? "text-success" : "text-danger"}`}>
                              {String(qr.status || "").toLowerCase()}
                            </span>
                          </div>
                        </div>
                      </AppStack>

                      {/* Right Side Stack */}
                      <AppStack direction="row" align="center" gap={1} sx={{ flexShrink: 0 }}>
                        <AppMenu
                          triggerIcon={<FiMoreVertical />}
                          items={menuItems}
                          triggerProps={{
                            size: "small",
                            sx: {
                              color: "var(--app-color-text-muted)",
                              backgroundColor: "transparent",
                              border: "none",
                              p: 0.5,
                              minWidth: 0,
                              "&:hover": {
                                backgroundColor: "var(--app-color-surface-hover, #f1f5f9)",
                              },
                            },
                          }}
                        />
                      </AppStack>
                    </AppStack>

                    {/* Metadata Drawer details */}
                    <div className="px-3.5 pb-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] border-t border-dashed border-border/80 pt-3">
                      <div className="col-span-2">
                        <span className="text-text-muted block font-semibold">UPI ID / Address</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-bold text-text block break-all font-mono">
                            {qr.upiId}
                          </span>
                          <AppIconButton
                            icon={<FiCopy className="text-[10px]" />}
                            variant="text"
                            colorVariant="neutral"
                            size="small"
                            onClick={(e) => handleCopyUpiId(e, qr.upiId)}
                            sx={{ p: "2px" }}
                          />
                        </div>
                      </div>

                      <div className="col-span-2">
                        <span className="text-text-muted block font-semibold">Linked Settlement Bank</span>
                        <span className="font-bold text-primary block mt-0.5 break-words">
                          {qr.bankAccountId
                            ? `${qr.bankAccountId.bankMasterId?.name || "Bank"} (*${String(qr.bankAccountId.accountNumber || "").slice(-4)})`
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </AppCard>
                );
              })}
            </AppStack>
          )}

          {/* Conditional Pagination Footer */}
          {shouldRenderPagination && (
            <AppBox sx={paginationFooterWrapperSx}>
              <AppTablePagination
                page={currentPage}
                pageSize={pageSize}
                totalItems={totalQrs}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                showPageSize={false}
                showSummary={true}
                showFirstLast={false}
                compact={true}
                size="small"
                align="center"
                rounded="md"
                sx={{
                  width: "100%",
                  justifyContent: "center !important",
                  alignItems: "center",
                  textAlign: "center",
                  "& .MuiPagination-root": {
                    display: "flex !important",
                    justifyContent: "center !important",
                    width: "100%",
                  },
                  "& .MuiPagination-ul": {
                    justifyContent: "center !important",
                    width: "100%",
                  },
                }}
                summarySx={{
                  textAlign: "center",
                  width: "100%",
                  mb: 0.5,
                }}
                paginationSx={{
                  display: "flex !important",
                  justifyContent: "center !important",
                  alignItems: "center",
                  width: "100%",
                  "& .MuiPagination-ul": {
                    justifyContent: "center !important",
                    width: "100%",
                  },
                }}
              />
            </AppBox>
          )}
        </div>
      </AppBox>
    </section>
  );
};

// MUI style configurations
const containerSx = {
  position: "relative",
  zIndex: 1,
  width: "100%",
  maxWidth: { xs: 430, sm: 460 },
  mx: "auto",
  px: 0,
  pt: 0,
  pb: 0,
};

const headerWrapperSx = {
  pt: 1,
  pb: 1.5,
  px: 0,
};

const pageTitleSx = {
  m: 0,
  fontSize: "21px",
  fontWeight: 800,
  color: "var(--app-color-text)",
  letterSpacing: "-0.5px",
};

const pageSubtitleSx = {
  mt: 0.4,
  fontSize: "11.5px",
  color: "var(--app-color-text-muted)",
};

const createNewBtnSx = {
  height: 36,
  width: 36,
  minWidth: 36,
  p: 0,
};

const refreshMobileBtnSx = {
  height: 36,
  width: 36,
  minWidth: 36,
  p: 0,
};

const searchMobileInputSx = {
  height: 42,
  fontSize: "13px",
  bgcolor: "var(--app-color-surface)",
};

const filterBtnSx = {
  height: 42,
  width: 42,
  minWidth: 42,
  p: 0,
  borderColor: "var(--app-color-border)",
  bgcolor: "var(--app-color-surface)",
  flexShrink: 0,
};

const expandableFiltersCardSx = {
  bgcolor: "var(--app-color-surface)",
  borderColor: "var(--app-color-border)",
};

const compactFilterInputSx = {
  height: 32,
  fontSize: "11.5px",
  bgcolor: "var(--app-color-surface)",
};

const labelSx = {
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--app-color-text)",
  mb: 0.5,
};

const filterChipSx = {
  height: 22,
  fontSize: "10px",
  bgcolor: "var(--app-color-surface-hover)",
  border: "1px solid var(--app-color-border)",
  "& svg": { fontSize: "10px" },
};

const qrCardSx = {
  bgcolor: "var(--app-color-surface)",
  border: "1px solid var(--app-color-border)",
  boxShadow:
    "0 2px 10px color-mix(in_srgb, var(--app-color-text) 5%, transparent)",
  transition: "all 0.15s ease",
  "&:active": {
    transform: "scale(0.99)",
  },
};

const qrTitleSx = {
  m: 0,
  fontSize: "12.5px",
  color: "var(--app-color-text)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 150,
};

const emptyCardSx = {
  borderColor: "var(--app-color-border)",
  bgcolor: "var(--app-color-surface)",
  width: "100%",
};

const emptyStateSubTextSx = {
  color: "var(--app-color-text-muted)",
  fontSize: "11.5px",
  maxWidth: 260,
  mt: 0.5,
  lineHeight: 1.4,
};

const paginationFooterWrapperSx = {
  px: 0,
  pt: 2,
  pb: 2,
  borderTop: "1px solid var(--app-color-divider)",
  display: "flex",
  justifyContent: "center",
  width: "100%",
  "& > div": {
    width: "100%",
    display: "flex !important",
    justifyContent: "center !important",
    alignItems: "center",
    "& .MuiPagination-ul": {
      justifyContent: "center !important",
    },
    "& .MuiPagination-root": {
      display: "flex !important",
      justifyContent: "center !important",
    },
  },
};

export default PaymentQrsMobilePage;
