import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiInbox,
  FiEye,
  FiMoreVertical,
  FiRefreshCw,
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
  AppText,
  AppTablePagination,
  AppMenu,
} from "@/components";
import { ROUTES } from "@/constants";
import { formatCurrency, formatDate } from "@/utils";
import { BranchFilterSelect } from "@/components/shared";
import { CashTransactionDetailsDialog } from "../../components";
import { BillingInvoiceDetailsDrawer } from "@/features/billing/components/BillingInvoiceDetailsDrawer";

const typeOptions = [
  { label: "All Types", value: "all" },
  { label: "Cash Inward", value: "CASH_IN" },
  { label: "Cash Outward", value: "CASH_OUT" },
  { label: "Direct Expense", value: "EXPENSE" },
  { label: "Petty Cash Log", value: "PETTY_CASH" },
  { label: "Other Transaction", value: "OTHER" },
];

const directionOptions = [
  { label: "All Directions", value: "all" },
  { label: "Inward (Credit)", value: "CREDIT" },
  { label: "Outward (Debit)", value: "DEBIT" },
];

const statusOptions = [
  { label: "All Statuses", value: "all" },
  { label: "Draft", value: "DRAFT" },
  { label: "Posted to Ledger", value: "POSTED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const CashTransactionsMobilePage = ({
  cashTransactions = [],

  searchParams,
  currentPage,
  pageSize,
  totalTransactions,
  isLoading = false,
  isCompanyLevel = false,
  selectedBranchId = "all",
  setSelectedBranchId,
  error,
  clearError,
  handleSearchChange,
  handleFilterChange,
  handlePageChange,
  handlePageSizeChange,
  handleRefresh,
}) => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedInvoiceForDrawer, setSelectedInvoiceForDrawer] = useState(null);

  const partitionOptions = useMemo(() => {
    return [
      { label: "All Partitions", value: "all" },
      { label: "Running Cash", value: "running" },
      { label: "Frozen Cash", value: "frozen" },
    ];
  }, []);


  const handleCardClick = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleOpenInvoiceDrawer = (txn) => {
    setSelectedTransaction(null);
    const inv = txn.invoice || {};
    setSelectedInvoiceForDrawer({
      id: inv._id || inv.id || txn.rawId || txn._id || txn.id,
      invoiceNo: inv.invoiceNo || txn.referenceNumber,
      amount: txn.amount,
      grandTotal: inv.grandTotal || txn.amount,
      date: inv.date || txn.transactionDate,
      customer: inv.customerId?.name || txn.counterpartyAccountId?.accountName,
      phone: inv.customerId?.mobile || inv.customerId?.phone,
      items: inv.items || [],
      payments: inv.payments || [],
      status: inv.status,
    });
  };

  const getDirectionBadge = (direction) => {
    const isCredit = String(direction).toUpperCase() === "CREDIT";
    const bg = isCredit ? "bg-[#ebfbee] text-[#2b8a3e] border-[#c3fae8]" : "bg-[#fff5f5] text-[#fa5252] border-[#ffc9c9]";
    const label = isCredit ? "IN" : "OUT";

    return (
      <span className={`inline-flex items-center rounded-md px-1.5 py-0.2 text-[8.5px] font-bold border ${bg}`}>
        {label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const raw = String(status || "").toUpperCase();
    let bg = "bg-[#f8f9fa] text-[#495057] border-[#dee2e6]";

    if (raw === "DRAFT") bg = "bg-[#fff9db] text-[#f08c00] border-[#ffe066]";
    else if (raw === "POSTED") bg = "bg-[#ebfbee] text-[#2b8a3e] border-[#c3fae8]";
    else if (raw === "CANCELLED") bg = "bg-[#f1f3f5] text-[#868e96] border-[#e9ecef]";

    return (
      <span className={`inline-flex items-center rounded px-1.5 py-0.2 text-[8px] font-bold uppercase border ${bg}`}>
        {raw}
      </span>
    );
  };

  const hasFilteredTransactions = cashTransactions.length > 0;
  const shouldRenderPagination = hasFilteredTransactions && totalTransactions > pageSize;

  return (
    <section className="w-full bg-bg pb-6">
      <AppBox sx={containerSx}>
        {/* Mobile Page Header */}
        <AppBox sx={headerWrapperSx}>
          <AppStack direction="row" align="center" justify="space-between" gap={1}>
            <AppBox sx={{ minWidth: 0, flex: 1, pr: 1.5 }}>
              <AppHeading level={1} weight={800} sx={pageTitleSx}>
                Cash Transactions
              </AppHeading>
              <AppText variant="body2" sx={pageSubtitleSx}>
                Verify and manage cash ledger entries
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
            </AppStack>
          </AppStack>
        </AppBox>

        {/* Search & Filters Toolbar */}
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
            name="search"
            value={searchParams.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search transactions..."
            startIcon={<FiSearch />}
            size="small"
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

        {/* Collapsible Panel */}
        {showFilters && (
          <div className="px-0 mb-3">
            <AppCard
              variant="default"
              rounded="lg"
              bordered
              shadow="none"
              padding="none"
              sx={filterCardSx}
            >
              <div className="p-3.5 space-y-3.5">
                <AppSelect
                  label="Transaction Type"
                  name="transactionType"
                  value={searchParams.transactionType}
                  onChange={(e) => handleFilterChange("transactionType", e.target.value)}
                  options={typeOptions}
                  size="small"
                  variant="bordered"
                  rounded="md"
                  inputSx={compactFilterInputSx}
                  labelSx={labelSx}
                />

                <AppSelect
                  label="Direct Flow Direction"
                  name="direction"
                  value={searchParams.direction}
                  onChange={(e) => handleFilterChange("direction", e.target.value)}
                  options={directionOptions}
                  size="small"
                  variant="bordered"
                  rounded="md"
                  inputSx={compactFilterInputSx}
                  labelSx={labelSx}
                />

                <AppSelect
                  label="Post Status"
                  name="status"
                  value={searchParams.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  options={statusOptions}
                  size="small"
                  variant="bordered"
                  rounded="md"
                  inputSx={compactFilterInputSx}
                  labelSx={labelSx}
                />

                <AppSelect
                  label="Cash Partition"
                  name="partition"
                  value={searchParams.partition}
                  onChange={(e) => handleFilterChange("partition", e.target.value)}
                  options={partitionOptions}
                  size="small"
                  variant="bordered"
                  rounded="md"
                  inputSx={compactFilterInputSx}
                  labelSx={labelSx}
                />
              </div>
            </AppCard>
          </div>
        )}

        {/* Content list */}
        <div className="px-0 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AppText variant="body2" sx={{ color: "var(--app-color-text-muted)", fontWeight: 650 }}>
                Querying cash statements...
              </AppText>
            </div>
          ) : cashTransactions.length === 0 ? (
            <AppCard variant="default" rounded="lg" bordered padding="md" sx={emptyCardSx}>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FiInbox className="text-[40px] text-text-muted/40 mb-2" />
                <AppHeading level={3} weight={600} sx={{ m: 0, fontSize: "13px", color: "var(--app-color-text)" }}>
                  No Statements Found
                </AppHeading>
                <AppText variant="body2" sx={{ color: "var(--app-color-text-muted)", mt: 0.5 }}>
                  Adjust search keyword filters.
                </AppText>
              </div>
            </AppCard>
          ) : (
            <AppStack direction="column" gap={1.2}>
              {cashTransactions.map((tx) => {
                const cashLabel = tx.cashPartition === "running" ? "Running Cash" : "Frozen Cash";
                const isCredit = tx.direction === "CREDIT";

                return (
                  <AppCard
                    key={tx._id}
                    variant="default"
                    rounded="lg"
                    bordered
                    shadow="sm"
                    padding="none"
                    sx={transactionCardSx}
                  >
                    <AppStack direction="row" align="center" gap={1.5} justify="space-between" sx={{ width: "100%", p: 1.5 }}>
                      {/* Left Side Clickable details wrapper */}
                      <AppStack
                        direction="row"
                        align="center"
                        gap={1.5}
                        sx={{ minWidth: 0, flex: 1, cursor: "pointer" }}
                        onClick={() => handleCardClick(tx)}
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/10">
                          <LuWallet className="text-[20px]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <AppHeading level={3} weight={700} sx={txTitleSx}>
                              {tx.transactionNumber}
                            </AppHeading>
                            <span className="shrink-0">{getDirectionBadge(tx.direction)}</span>
                            <span className="shrink-0">{getStatusBadge(tx.status)}</span>
                          </div>
                          <AppText variant="body2" sx={descriptionTextSx}>
                            {tx.transactionType} ({cashLabel})
                          </AppText>
                        </div>
                      </AppStack>

                      {/* Right Side Stack */}
                      <AppStack direction="row" align="center" gap={1} sx={{ flexShrink: 0 }}>
                        <AppStack direction="column" align="flex-end" gap={0.5} sx={rightMetadataStackSx}>
                          <span className="text-[9.5px] text-text-muted block">Amount</span>
                          <span className={`text-[12.5px] font-extrabold block mt-0.5 ${isCredit ? "text-[#2b8a3e]" : "text-[#fa5252]"}`}>
                            {isCredit ? "+" : "-"} {formatCurrency(tx.amount)}
                          </span>
                        </AppStack>

                        <AppMenu
                          triggerIcon={<FiMoreVertical />}
                          items={[
                            {
                              label: "View Details",
                              icon: <FiEye />,
                              onClick: (e) => {
                                e.stopPropagation();
                                handleCardClick(tx);
                              },
                            },
                          ]}
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
                        <span className="text-text-muted block font-semibold">Transaction Date</span>
                        <span className="font-bold text-text block mt-0.5">
                          {formatDate(tx.transactionDate)}
                        </span>
                      </div>

                      {tx.referenceNumber && (
                        <div>
                          <span className="text-text-muted block font-semibold">Ref/Voucher</span>
                          <span className="font-bold text-text block mt-0.5 font-mono">
                            {tx.referenceNumber}
                          </span>
                        </div>
                      )}
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
                totalItems={totalTransactions}
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

      {/* Cash Transaction Details Dialog */}
      {selectedTransaction && (
        <CashTransactionDetailsDialog
          isOpen={Boolean(selectedTransaction)}
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
          onOpenInvoiceDrawer={handleOpenInvoiceDrawer}
          onTransactionUpdated={() => handleRefresh?.()}
        />
      )}

      {/* Full Invoice Drawer if drill down is triggered */}
      <BillingInvoiceDetailsDrawer
        invoice={selectedInvoiceForDrawer}
        isOpen={Boolean(selectedInvoiceForDrawer)}
        onClose={() => setSelectedInvoiceForDrawer(null)}
      />
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

const filterCardSx = {
  bgcolor: "var(--app-color-surface)",
  borderColor: "var(--app-color-border)",
};

const labelSx = {
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--app-color-text-muted)",
  mb: 0.5,
};

const compactFilterInputSx = {
  height: 32,
  fontSize: "11.5px",
  bgcolor: "var(--app-color-surface)",
};

const transactionCardSx = {
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
  fontSize: "12px",
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

export default CashTransactionsMobilePage;
