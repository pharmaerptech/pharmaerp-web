import React from "react";
import {
  FiSearch,
  FiPlus,
  FiEye,
  FiSlash,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiMoreVertical,
  FiRefreshCw,
  FiEdit2,
} from "react-icons/fi";
import { LuWallet } from "react-icons/lu";

import {
  AppBox,
  AppCard,
  AppHeading,
  AppIconButton,
  AppInput,
  AppSelect,
  AppStack,
  AppTablePagination,
  AppText,
  AppMenu,
} from "@/components";
import { formatDate, formatCurrency } from "@/utils";

const chequeTypeOptions = [
  { label: "All Types", value: "all" },
  { label: "Received", value: "RECEIVED" },
  { label: "Issued", value: "ISSUED" },
];

const statusOptions = [
  { label: "All Statuses", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Deposited", value: "DEPOSITED" },
  { label: "Cleared", value: "CLEARED" },
  { label: "Bounced", value: "BOUNCED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const ChequesMobilePage = ({
  cheques = [],
  searchParams,
  currentPage,
  pageSize,
  totalCheques,
  isLoading = false,
  error,
  message,
  clearFeedback,
  handleSearchChange,
  handleFilterChange,
  handlePageChange,
  handlePageSizeChange,
  handleDeposit,
  handleClear,
  handleBounce,
  handleCancel,
  handleViewDetails,
  handleCreateNew,
  handleEditCheque,
  handleRefresh,
}) => {
  const showPagination = cheques.length > 0;
  const shouldRenderPagination = showPagination && totalCheques > pageSize;

  const getStatusBadge = (status) => {
    const raw = String(status || "").toUpperCase();
    let bg = "bg-[#fff9db] text-[#f08c00] border-[#ffe066]";

    if (raw === "CLEARED") bg = "bg-[#ebfbee] text-[#2b8a3e] border-[#c3fae8]";
    else if (raw === "BOUNCED") bg = "bg-[#fff5f5] text-[#fa5252] border-[#ffc9c9]";
    else if (raw === "CANCELLED") bg = "bg-[#f1f3f5] text-[#868e96] border-[#e9ecef]";
    else if (raw === "DEPOSITED") bg = "bg-[#e8f0fe] text-[#1a73e8] border-[#adcdfc]";

    return (
      <span className={`inline-flex items-center rounded px-1.5 py-0.2 text-[8.5px] font-bold uppercase border ${bg}`}>
        {raw}
      </span>
    );
  };

  const getChequeTypeBadge = (type) => {
    const isReceived = type === "RECEIVED";
    const bg = isReceived ? "bg-primary-soft text-primary border border-primary/20" : "bg-purple-soft text-purple border border-purple/20";
    const label = isReceived ? "RCVD" : "ISSUED";

    return (
      <span className={`inline-flex items-center rounded-md px-1.5 py-0.2 text-[8px] font-bold border ${bg}`}>
        {label}
      </span>
    );
  };

  return (
    <section className="w-full bg-bg pb-6">
      <AppBox sx={containerSx}>
        {/* Mobile Page Header */}
        <AppBox sx={headerWrapperSx}>
          <AppStack direction="row" align="center" justify="space-between" gap={1}>
            <AppBox sx={{ minWidth: 0, flex: 1, pr: 1.5 }}>
              <AppHeading level={1} weight={800} sx={pageTitleSx}>
                Cheques Ledger
              </AppHeading>
              <AppText variant="body2" sx={pageSubtitleSx}>
                Verify, deposit and clear cheques ({totalCheques})
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
              <AppIconButton
                icon={<FiPlus />}
                variant="filled"
                colorVariant="success"
                size="small"
                rounded="md"
                onClick={handleCreateNew}
                sx={createNewBtnSx}
              />
            </AppStack>
          </AppStack>
        </AppBox>

        {/* Feedback Alert */}
        {(error || message) && (
          <div
            className={`mb-3 p-3 text-[11px] font-semibold rounded-md flex justify-between items-center ${
              error ? "bg-danger-soft text-danger" : "bg-success-soft text-success"
            }`}
          >
            <span className="flex-1">{error || message}</span>
            <button
              onClick={clearFeedback}
              className={`font-bold hover:underline ml-2 ${error ? "text-danger" : "text-success"}`}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search & Filters Toolbar */}
        <div className="px-0 mb-3 space-y-2">
          <AppInput
            value={searchParams.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search number, drawers..."
            startIcon={<FiSearch />}
            size="small"
            inputSx={searchMobileInputSx}
          />

          <div className="grid grid-cols-2 gap-2">
            <AppSelect
              name="chequeType"
              value={searchParams.chequeType}
              onChange={(e) => handleFilterChange("chequeType", e.target.value)}
              options={chequeTypeOptions}
              size="small"
              inputSx={compactFilterInputSx}
            />
            <AppSelect
              name="status"
              value={searchParams.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              options={statusOptions}
              size="small"
              inputSx={compactFilterInputSx}
            />
          </div>
        </div>

        {/* Card Stream */}
        <div className="px-0 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AppText variant="body2" sx={{ color: "var(--app-color-text-muted)", fontWeight: 650 }}>
                Querying cheques...
              </AppText>
            </div>
          ) : cheques.length === 0 ? (
            <AppCard variant="default" rounded="lg" bordered padding="md" sx={emptyCardSx}>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FiClock className="text-[40px] text-text-muted/40 mb-2" />
                <AppHeading level={3} weight={600} sx={{ m: 0, fontSize: "13px", color: "var(--app-color-text)" }}>
                  No Cheques Found
                </AppHeading>
                <AppText variant="body2" sx={{ color: "var(--app-color-text-muted)", mt: 0.5 }}>
                  Adjust filters or create a new cheque register.
                </AppText>
              </div>
            </AppCard>
          ) : (
            <AppStack direction="column" gap={1.2}>
              {cheques.map((c) => {
                const isReceived = c.chequeType === "RECEIVED";
                const isPending = c.status === "PENDING";
                const isDeposited = c.status === "DEPOSITED";
                const isCleared = c.status === "CLEARED";
                const isBounced = c.status === "BOUNCED";
                const isCancelled = c.status === "CANCELLED";

                const menuItems = [
                  {
                    id: "view",
                    label: "View Details",
                    icon: <FiEye />,
                    onClick: () => handleViewDetails(c._id),
                  },
                ];

                if (c.status === "PENDING" && handleEditCheque) {
                  menuItems.push({
                    id: "edit",
                    label: "Edit Cheque",
                    icon: <FiEdit2 />,
                    onClick: () => handleEditCheque(c._id),
                  });
                }

                if (isReceived && isPending) {
                  menuItems.push({
                    id: "deposit",
                    label: "Deposit Cheque",
                    icon: <FiCheckCircle />,
                    onClick: () => handleDeposit(c._id),
                  });
                }

                if ((isReceived && isDeposited) || (!isReceived && isPending)) {
                  menuItems.push({
                    id: "clear",
                    label: "Clear Cheque",
                    icon: <FiCheckCircle />,
                    onClick: () => {
                      const date = prompt("Clear Date (YYYY-MM-DD):");
                      if (date !== null) handleClear(c._id, date);
                    },
                  }, {
                    id: "bounce",
                    label: "Bounce Cheque",
                    icon: <FiAlertTriangle />,
                    onClick: () => {
                      const reason = prompt("Bounce Reason:");
                      if (reason) {
                        const charges = prompt("Charges (INR):", "0");
                        handleBounce(c._id, reason, Number(charges) || 0);
                      }
                    },
                  });
                }

                if (!isCleared && !isBounced && !isCancelled) {
                  menuItems.push({
                    id: "cancel",
                    label: "Cancel Cheque",
                    icon: <FiSlash />,
                    onClick: () => {
                      const reason = prompt("Cancellation Reason:");
                      if (reason !== null) handleCancel(c._id, reason);
                    },
                  });
                }

                return (
                  <AppCard
                    key={c._id}
                    variant="default"
                    rounded="lg"
                    bordered
                    shadow="sm"
                    padding="none"
                    sx={chequeCardSx}
                  >
                    <AppStack direction="row" align="center" gap={1.5} justify="space-between" sx={{ width: "100%", p: 1.5 }}>
                      {/* Left Side Clickable details wrapper */}
                      <AppStack
                        direction="row"
                        align="center"
                        gap={1.5}
                        sx={{ minWidth: 0, flex: 1, cursor: "pointer" }}
                        onClick={() => handleViewDetails(c._id)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/10">
                          <LuWallet className="text-[20px]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <AppHeading level={3} weight={700} sx={txTitleSx}>
                              #{c.chequeNumber}
                            </AppHeading>
                            <span className="shrink-0">{getChequeTypeBadge(c.chequeType)}</span>
                            <span className="shrink-0">{getStatusBadge(c.status)}</span>
                          </div>
                          <AppText variant="body2" sx={descriptionTextSx}>
                            {c.partyName} ({c.bankAccountId?.bankName || "Unknown Bank"})
                          </AppText>
                        </div>
                      </AppStack>

                      {/* Right Side Stack */}
                      <AppStack direction="row" align="center" gap={1} sx={{ flexShrink: 0 }}>
                        <AppStack direction="column" align="flex-end" gap={0.5} sx={rightMetadataStackSx}>
                          <span className="text-[9.5px] text-text-muted block">Amount</span>
                          <span className="text-[12.5px] font-extrabold block mt-0.5 text-text">
                            {formatCurrency(c.amount)}
                          </span>
                        </AppStack>

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
                      <div>
                        <span className="text-text-muted block font-semibold">Cheque Date</span>
                        <span className="font-bold text-text block mt-0.5">
                          {formatDate(c.chequeDate)}
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
                totalItems={totalCheques}
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

const compactFilterInputSx = {
  height: 32,
  fontSize: "11.5px",
  bgcolor: "var(--app-color-surface)",
};

const chequeCardSx = {
  bgcolor: "var(--app-color-surface)",
  border: "1px solid var(--app-color-border)",
  boxShadow:
    "0 2px 10px color-mix(in_srgb, var(--app-color-text) 5%, transparent)",
  transition: "all 0.15s ease",
  "&:active": {
    transform: "scale(0.99)",
  },
};

const txTitleSx = {
  m: 0,
  fontSize: "12.5px",
  color: "var(--app-color-text)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 110,
};

const descriptionTextSx = {
  mt: 0.25,
  fontSize: "10.5px",
  color: "var(--app-color-text-muted)",
};

const rightMetadataStackSx = {
  pl: 1.5,
  borderLeft:
    "1px solid color-mix(in_srgb, var(--app-color-border) 60%, transparent)",
  minWidth: { xs: 85, sm: 100 },
  maxWidth: { xs: 100, sm: 120 },
  flexShrink: 0,
};

const emptyCardSx = {
  borderColor: "var(--app-color-border)",
  bgcolor: "var(--app-color-surface)",
  width: "100%",
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

export default ChequesMobilePage;
