import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiPlus,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiSlash,
  FiTrendingUp,
  FiMoreVertical,
  FiRefreshCw,
  FiEdit2,
} from "react-icons/fi";

import {
  AppBox,
  AppBreadcrumb,
  AppButton,
  AppCard,
  AppHeading,
  AppInput,
  AppSelect,
  AppStack,
  AppTablePagination,
  AppText,
  AppTable,
  AppMenu,
  PageHeader,
  PermissionGate,
} from "@/components";
import { ROUTES } from "@/constants";
import { formatCurrency, formatDate } from "@/utils";

const chequeTypeOptions = [
  { label: "All Cheque Types", value: "all" },
  { label: "Received Cheques", value: "RECEIVED" },
  { label: "Issued Cheques", value: "ISSUED" },
];

const statusOptions = [
  { label: "All Statuses", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Deposited", value: "DEPOSITED" },
  { label: "Cleared", value: "CLEARED" },
  { label: "Bounced", value: "BOUNCED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const ChequesDesktopPage = ({
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
  const navigate = useNavigate();

  // Aggregate stats
  const stats = useMemo(() => {
    let pendingAmt = 0;
    let bouncedCount = 0;

    cheques.forEach((c) => {
      if (c.status === "PENDING" || c.status === "DEPOSITED") {
        pendingAmt += c.amount || 0;
      } else if (c.status === "BOUNCED") {
        bouncedCount++;
      }
    });

    return { pendingAmt, bouncedCount, count: totalCheques };
  }, [cheques, totalCheques]);

  const getStatusBadge = (status) => {
    const raw = String(status || "").toUpperCase();
    let bg = "bg-[#fff9db] text-[#f08c00] border-[#ffe066]";

    if (raw === "CLEARED") bg = "bg-[#ebfbee] text-[#2b8a3e] border-[#c3fae8]";
    else if (raw === "BOUNCED") bg = "bg-[#fff5f5] text-[#fa5252] border-[#ffc9c9]";
    else if (raw === "CANCELLED") bg = "bg-[#f1f3f5] text-[#868e96] border-[#e9ecef]";
    else if (raw === "DEPOSITED") bg = "bg-[#e8f0fe] text-[#1a73e8] border-[#adcdfc]";

    return (
      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9.5px] font-bold uppercase border ${bg}`}>
        {raw}
      </span>
    );
  };

  const getChequeTypeBadge = (type) => {
    const isReceived = type === "RECEIVED";
    const bg = isReceived ? "bg-primary-soft text-primary border border-primary/20" : "bg-purple-soft text-purple border border-purple/20";
    return (
      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase border ${bg}`}>
        {type}
      </span>
    );
  };

  const columns = useMemo(() => [
    {
      id: "chequeNumber",
      label: "Cheque Number",
      minWidth: 130,
      render: (_, c) => (
        <AppText variant="body2" sx={tableValueMonoSx}>
          {c.chequeNumber}
        </AppText>
      ),
    },
    {
      id: "chequeDate",
      label: "Cheque Date",
      minWidth: 120,
      render: (_, c) => (
        <AppText variant="body2" sx={tableValueMutedSx}>
          {formatDate(c.chequeDate)}
        </AppText>
      ),
    },
    {
      id: "chequeType",
      label: "Type",
      minWidth: 110,
      render: (_, c) => getChequeTypeBadge(c.chequeType),
    },
    {
      id: "drawnBank",
      label: "Drawn Bank Account",
      minWidth: 180,
      render: (_, c) => (
        <AppText variant="body2" sx={tableValueMutedSx}>
          {c.bankAccountId?.bankName || "Unknown Bank"}
        </AppText>
      ),
    },
    {
      id: "partyName",
      label: "Party / Payee Name",
      minWidth: 160,
      render: (_, c) => (
        <AppText variant="body2" sx={tableValueSx}>
          {c.partyName}
        </AppText>
      ),
    },
    {
      id: "amount",
      label: "Amount",
      minWidth: 120,
      align: "right",
      render: (_, c) => (
        <span className="text-[12.5px] font-black text-text">
          {formatCurrency(c.amount)}
        </span>
      ),
    },
    {
      id: "status",
      label: "Status",
      align: "center",
      minWidth: 110,
      render: (_, c) => getStatusBadge(c.status),
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      width: 100,
      render: (_, c) => {
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

        // Deposit: received + pending
        if (isReceived && isPending) {
          menuItems.push({
            id: "deposit",
            label: "Deposit Cheque",
            icon: <FiCheckCircle />,
            onClick: () => handleDeposit(c._id),
          });
        }

        // Clear & Bounce: deposited received or pending issued
        if ((isReceived && isDeposited) || (!isReceived && isPending)) {
          menuItems.push({
            id: "clear",
            label: "Clear Cheque",
            icon: <FiCheckCircle />,
            onClick: () => {
              const date = prompt("Enter clearance date (YYYY-MM-DD) or leave empty:");
              if (date !== null) handleClear(c._id, date);
            },
          }, {
            id: "bounce",
            label: "Bounce Cheque",
            icon: <FiAlertTriangle />,
            onClick: () => {
              const reason = prompt("Enter bounce reason:");
              if (reason) {
                const charges = prompt("Enter bounce charges (INR):", "0");
                handleBounce(c._id, reason, Number(charges) || 0);
              }
            },
          });
        }

        // Cancel: not cleared, bounced, cancelled
        if (!isCleared && !isBounced && !isCancelled) {
          menuItems.push({
            id: "cancel",
            label: "Cancel Cheque",
            icon: <FiSlash />,
            onClick: () => {
              const reason = prompt("Enter cancellation reason:");
              if (reason !== null) handleCancel(c._id, reason);
            },
          });
        }

        return (
          <AppStack direction="row" gap={0.5} justify="flex-end" align="center">
            <AppMenu
              trigger={
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-transparent text-text-muted hover:text-text hover:bg-surface-hover focus:outline-none cursor-pointer"
                >
                  <FiMoreVertical className="text-[16px]" />
                </button>
              }
              items={menuItems}
              dense
              minWidth={160}
            />
          </AppStack>
        );
      },
    },
  ], [handleViewDetails, handleEditCheque, handleDeposit, handleClear, handleBounce, handleCancel]);

  const showPagination = totalCheques > pageSize;

  return (
    <section className="min-h-[calc(100vh-58px)] bg-bg px-6 py-5">
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Page Header */}
        <PageHeader
          title="Cheque Management"
          subtitle="Record incoming customer cheques and outgoing vendor cheque payments."
          extra={
            <AppStack direction="row" gap={2} align="center">
              <AppBreadcrumb
                size="small"
                variant="text"
                items={[
                  { label: "Dashboard", onClick: () => navigate(ROUTES.DASHBOARD) },
                  { label: "Finance & Accounting", onClick: () => navigate(ROUTES.FINANCE) },
                  { label: "Treasury", onClick: () => navigate(ROUTES.TREASURY) },
                  { label: "Cheques", current: true },
                ]}
                sx={breadcrumbSx}
                itemSx={breadcrumbItemSx}
                currentItemSx={breadcrumbCurrentSx}
              />
              <AppButton
                variant="outlined"
                colorVariant="neutral"
                size="small"
                rounded="md"
                startIcon={<FiRefreshCw />}
                onClick={handleRefresh}
                loading={isLoading}
                sx={importButtonSx}
              >
                Refresh
              </AppButton>
              <PermissionGate permission="cheque:create">
                <AppButton
                  variant="filled"
                  colorVariant="success"
                  size="small"
                  rounded="md"
                  startIcon={<FiPlus />}
                  onClick={handleCreateNew}
                  sx={primaryButtonSx}
                >
                  New Cheque
                </AppButton>
              </PermissionGate>
            </AppStack>
          }
          align="flex-start"
          justify="space-between"
          sx={pageHeaderSx}
          contentSx={pageHeaderContentSx}
        />

        {/* Stats Grid */}
        <div className="mt-5 grid grid-cols-3 gap-4">
          <AppCard variant="default" rounded="lg" bordered shadow="sm" sx={statCardSx}>
            <div className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-text-muted tracking-wider block">Total Cheques</span>
                <span className="text-[20px] font-extrabold text-text mt-1 block">{stats.count}</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-surface-alt text-text flex items-center justify-center border border-border">
                <FiClock className="text-[18px]" />
              </div>
            </div>
          </AppCard>

          <AppCard variant="default" rounded="lg" bordered shadow="sm" sx={statCardSx}>
            <div className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-text-muted tracking-wider block">In Clearance Pipeline</span>
                <span className="text-[20px] font-extrabold text-[#2b8a3e] mt-1 block">
                  {formatCurrency(stats.pendingAmt)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#ebfbee] text-[#2b8a3e] flex items-center justify-center border border-[#c3fae8]">
                <FiTrendingUp className="text-[18px]" />
              </div>
            </div>
          </AppCard>

          <AppCard variant="default" rounded="lg" bordered shadow="sm" sx={statCardSx}>
            <div className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-text-muted tracking-wider block">Bounced Items</span>
                <span className="text-[20px] font-extrabold text-[#fa5252] mt-1 block">{stats.bouncedCount}</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#fff5f5] text-[#fa5252] flex items-center justify-center border border-[#ffc9c9]">
                <FiAlertTriangle className="text-[18px]" />
              </div>
            </div>
          </AppCard>
        </div>

        {/* Feedback alerts */}
        {(error || message) && (
          <div
            className={`mt-4 p-3 text-[12.5px] font-semibold rounded-md flex justify-between items-center ${
              error ? "bg-danger-soft text-danger" : "bg-success-soft text-success"
            }`}
          >
            <span>{error || message}</span>
            <button
              onClick={clearFeedback}
              className={`font-bold hover:underline ${error ? "text-danger" : "text-success"}`}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Table & Filters Card */}
        <AppCard
          variant="default"
          rounded="lg"
          bordered
          shadow="sm"
          padding="none"
          sx={mainCardSx}
        >
          {/* Filters Toolbar */}
          <div className="p-4 border-b border-border bg-surface-hover/20 flex items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <AppInput
                label="Search Cheques"
                name="search"
                value={searchParams.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search number, drawer..."
                startIcon={<FiSearch />}
                size="small"
                fullWidth={false}
                formControlSx={{ width: 260 }}
                inputSx={compactFilterInputSx}
                labelSx={filterLabelSx}
              />

              <AppSelect
                label="Cheque Type"
                name="chequeType"
                value={searchParams.chequeType}
                onChange={(e) => handleFilterChange("chequeType", e.target.value)}
                options={chequeTypeOptions}
                size="small"
                variant="bordered"
                rounded="md"
                fullWidth={false}
                formControlSx={{ width: 180 }}
                inputSx={compactFilterInputSx}
                labelSx={filterLabelSx}
              />

              <AppSelect
                label="Status"
                name="status"
                value={searchParams.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                options={statusOptions}
                size="small"
                variant="bordered"
                rounded="md"
                fullWidth={false}
                formControlSx={{ width: 140 }}
                inputSx={compactFilterInputSx}
                labelSx={filterLabelSx}
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="w-full relative">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <AppText variant="body1" sx={{ color: "var(--app-color-text-muted)", fontWeight: 650 }}>
                  Retrieving cheques ledger...
                </AppText>
              </div>
            ) : cheques.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FiClock className="text-[40px] text-text-muted/40 mb-3" />
                <AppHeading level={3} weight={600} sx={{ m: 0, fontSize: "14px", color: "var(--app-color-text)" }}>
                  No Cheques Found
                </AppHeading>
                <AppText variant="body2" sx={{ color: "var(--app-color-text-muted)", mt: 0.5 }}>
                  There are no cheque records matching your filter parameters.
                </AppText>
              </div>
            ) : (
              <AppTable
                columns={columns}
                rows={cheques}
                getRowId={(row) => row._id}
                sx={tableSx}
                headSx={tableHeadSx}
                cellSx={tableCellSx}
              />
            )}
          </div>

          {/* Table Footer */}
          {showPagination && (
            <AppBox sx={paginationFooterWrapperSx}>
              <AppTablePagination
                page={currentPage}
                pageSize={pageSize}
                totalItems={totalCheques}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </AppBox>
          )}
        </AppCard>
      </div>
    </section>
  );
};

// Styling variables
const breadcrumbSx = { mt: 0 };
const breadcrumbItemSx = {
  fontSize: "12px",
  color: "var(--app-color-text-muted)",
  cursor: "pointer",
  "&:hover": { color: "var(--app-color-primary)" },
};
const breadcrumbCurrentSx = {
  fontSize: "12px",
  fontWeight: 650,
  color: "var(--app-color-text)",
};

const pageHeaderSx = { width: "100%" };
const pageHeaderContentSx = {
  minWidth: 0,
  "& h1, & h2, & h3, & h4": {
    m: 0,
    fontSize: "23px",
    lineHeight: 1.15,
    letterSpacing: "-0.4px",
    color: "var(--app-color-text)",
  },
};

const primaryButtonSx = {
  height: 38,
  px: 2.5,
  fontSize: "12.5px",
  fontWeight: 700,
  bgcolor: "#00b85c",
  color: "white",
  whiteSpace: "nowrap",
  "&:hover": { bgcolor: "#009e4f" },
};

const importButtonSx = {
  height: 38,
  px: 2.5,
  fontSize: "12.5px",
  fontWeight: 650,
  borderColor: "var(--app-color-border)",
  color: "var(--app-color-text)",
  bgcolor: "white",
  whiteSpace: "nowrap",
};

const statCardSx = {
  bgcolor: "var(--app-color-surface)",
  borderColor: "var(--app-color-border)",
};

const mainCardSx = {
  mt: 5,
  bgcolor: "var(--app-color-surface)",
  borderColor: "var(--app-color-border)",
};

const compactFilterInputSx = {
  height: 32,
  fontSize: "11.5px",
  bgcolor: "var(--app-color-surface)",
};

const filterLabelSx = {
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--app-color-text-muted)",
  mb: 0.5,
};

const tableSx = {
  width: "100%",
  "& .MuiTable-root": {
    width: "100%",
  },
};

const tableHeadSx = {
  bgcolor: "color-mix(in_srgb, var(--app-color-surface-alt) 25%, var(--app-color-surface))",
  "& th": {
    fontSize: "11px",
    fontWeight: 750,
    textTransform: "uppercase",
    color: "var(--app-color-text-muted)",
    py: 1.5,
    borderBottom: "1px solid var(--app-color-divider)",
  },
};

const tableCellSx = {
  py: 1.5,
  fontSize: "12.5px",
  borderBottom: "1px solid var(--app-color-divider)",
};

const tableValueSx = {
  fontSize: "12.5px",
  fontWeight: 650,
  color: "var(--app-color-text)",
};

const tableValueMutedSx = {
  fontSize: "12.5px",
  fontWeight: 650,
  color: "var(--app-color-text-muted)",
};

const tableValueMonoSx = {
  fontSize: "12px",
  fontFamily: "var(--font-mono, monospace)",
  fontWeight: 750,
  color: "var(--app-color-text)",
};

const paginationFooterWrapperSx = {
  px: 2,
  py: 2,
  borderTop: "1px solid var(--app-color-divider)",
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  width: "100%",
  "& > div": {
    width: "auto",
  },
};

export default ChequesDesktopPage;
