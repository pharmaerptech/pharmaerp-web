import React, { useMemo } from "react";
import {
  FiPlus,
  FiActivity,
  FiLock,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
} from "react-icons/fi";

import {
  AppBox,
  AppBreadcrumb,
  AppButton,
  AppCard,
  AppHeading,
  AppSelect,
  AppStack,
  AppText,
  AppTable,
  AppTableSkeleton,
  AppTag,
  AppStatCard,
  AppSearchInput,
  AppIconButton,
  AppMenu,
  AppEmptyState,
  AppAlert,
  PermissionGate,
} from "@/components";
import { usePermission } from "@/hooks";
import { formatDate } from "@/utils";

const typeOptions = [
  { label: "All Types", value: "all" },
  { label: "Financial Year", value: "YEAR" },
  { label: "Quarterly Period", value: "QUARTER" },
  { label: "Monthly Period", value: "MONTH" },
  { label: "Adjustment Period", value: "ADJUSTMENT" },
];

const statusOptions = [
  { label: "All Statuses", value: "all" },
  { label: "Open Period", value: "OPEN" },
  { label: "Closed Period", value: "CLOSED" },
  { label: "Locked Period", value: "LOCKED" },
];

const statusColorMap = {
  OPEN: "success",
  CLOSED: "warning",
  LOCKED: "neutral",
};

const FinancialPeriodsDesktopPage = ({
  financialPeriods = [],
  searchParams,
  currentPage,
  pageSize,
  totalPeriods,
  isLoading = false,
  isUpdating = false,
  error,
  clearError,
  handleSearchChange,
  handleFilterChange,
  handlePageChange,
  handlePageSizeChange,
  handleUpdateStatus,
  handleCreate,
  handleRefresh,
}) => {
  const { can } = usePermission();
  const currentActivePeriod = useMemo(() => {
    return financialPeriods.find((p) => p.isCurrent)?.periodCode || "-";
  }, [financialPeriods]);

  const stats = useMemo(() => {
    const counts = { total: totalPeriods, open: 0, closed: 0, locked: 0 };
    financialPeriods.forEach((p) => {
      if (p.status === "OPEN") counts.open++;
      else if (p.status === "CLOSED") counts.closed++;
      else if (p.status === "LOCKED") counts.locked++;
    });
    return counts;
  }, [financialPeriods, totalPeriods]);

  const statsList = useMemo(() => [
    {
      id: "total_periods",
      title: "Defined Periods",
      value: stats.total,
      description: "Total periods in database",
      colorVariant: "primary",
      icon: <FiCalendar />,
    },
    {
      id: "active_period",
      title: "Active Period",
      value: currentActivePeriod,
      description: "Currently open period",
      colorVariant: "success",
      icon: <FiActivity />,
    },
    {
      id: "closed_periods",
      title: "Closed Periods",
      value: stats.closed,
      description: "Read-only periods",
      colorVariant: "warning",
      icon: <FiLock />,
    },
    {
      id: "locked_periods",
      title: "Locked Periods",
      value: stats.locked,
      description: "Fully frozen periods",
      colorVariant: "neutral",
      icon: <FiLock />,
    },
  ], [stats, currentActivePeriod]);

  const getStatusBadge = (status) => {
    const raw = String(status || "").toUpperCase();
    return (
      <AppTag
        label={raw}
        variant="soft"
        colorVariant={statusColorMap[raw] || "neutral"}
        rounded="md"
        sx={statusBadgeSx}
      />
    );
  };

  const columns = useMemo(() => [
    {
      id: "periodCode",
      key: "periodCode",
      label: "Period Code",
      minWidth: 150,
      render: (_, p) => (
        <AppText variant="body2" sx={tableValueMonoSx}>
          {p.periodCode}
        </AppText>
      ),
    },
    {
      id: "periodType",
      key: "periodType",
      label: "Type",
      minWidth: 150,
      render: (_, p) => (
        <AppText variant="body2" sx={tableValueSx}>
          {p.periodType}
        </AppText>
      ),
    },
    {
      id: "startDate",
      key: "startDate",
      label: "Start Date",
      minWidth: 150,
      render: (_, p) => (
        <AppText variant="body2" sx={tableValueMutedSx}>
          {formatDate(p.startDate)}
        </AppText>
      ),
    },
    {
      id: "endDate",
      key: "endDate",
      label: "End Date",
      minWidth: 150,
      render: (_, p) => (
        <AppText variant="body2" sx={tableValueMutedSx}>
          {formatDate(p.endDate)}
        </AppText>
      ),
    },
    {
      id: "isCurrent",
      key: "isCurrent",
      label: "Current Active",
      minWidth: 150,
      render: (_, p) => (
        p.isCurrent ? (
          <AppTag
            label="ACTIVE PERIOD"
            variant="soft"
            colorVariant="success"
            rounded="md"
            sx={tagSx}
          />
        ) : (
          <AppText variant="body2" sx={tableValueMutedSx}>-</AppText>
        )
      ),
    },
    {
      id: "status",
      key: "status",
      label: "Status",
      minWidth: 150,
      render: (_, p) => getStatusBadge(p.status),
    },
    {
      id: "actions",
      key: "actions",
      label: "Actions",
      align: "center",
      minWidth: 180,
      render: (_, p) => {
        if (!can("financial-period:update")) {
          return <AppText variant="body2" sx={tableValueMutedSx}>-</AppText>;
        }

        return (
          <AppStack direction="row" gap={1} justify="center" align="center">
            {p.status === "OPEN" && (
              <AppButton
                size="tiny"
                variant="outlined"
                colorVariant="warning"
                onClick={() => handleUpdateStatus(p._id, "CLOSED")}
                disabled={isUpdating}
              >
                Close Period
              </AppButton>
            )}

            {p.status === "CLOSED" && (
              <>
                <AppButton
                  size="tiny"
                  variant="outlined"
                  colorVariant="danger"
                  onClick={() => handleUpdateStatus(p._id, "LOCKED")}
                  disabled={isUpdating}
                >
                  Lock Period
                </AppButton>
                <AppButton
                  size="tiny"
                  variant="outlined"
                  colorVariant="neutral"
                  onClick={() => handleUpdateStatus(p._id, "OPEN")}
                  disabled={isUpdating}
                >
                  Re-Open
                </AppButton>
              </>
            )}

            {p.status === "LOCKED" && (
              <AppButton
                size="tiny"
                variant="outlined"
                colorVariant="neutral"
                onClick={() => handleUpdateStatus(p._id, "OPEN")}
                disabled={isUpdating}
              >
                Unlock to Open
              </AppButton>
            )}
          </AppStack>
        );
      },
    },
  ], [isUpdating, handleUpdateStatus, can]);

  return (
    <section className="min-h-[calc(100vh-58px)] bg-bg px-5 py-4">
      <div className="mx-auto w-full max-w-[1500px]">
        {/* Page Header */}
        <AppBox
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
          sx={pageHeaderSx}
        >
          <AppBox sx={pageHeaderContentSx}>
            <AppHeading level={1} weight={650}>
              Financial Periods
            </AppHeading>
            <AppText variant="body2" sx={pageHeaderSubtitleSx}>
              Manage fiscal periods, freeze account postings, or open new adjustment periods.
            </AppText>
            <AppBreadcrumb
              size="small"
              variant="text"
              items={[
                { label: "Dashboard", href: "/" },
                { label: "Finance & Accounting", href: "/finance" },
                { label: "Financial Periods", current: true },
              ]}
              sx={breadcrumbSx}
              itemSx={breadcrumbItemSx}
              currentItemSx={breadcrumbCurrentSx}
            />
          </AppBox>

          <AppStack
            direction="row"
            align="center"
            justify="flex-end"
            gap={1.1}
            sx={{ flexShrink: 0 }}
          >
            <AppButton
              type="button"
              variant="outlined"
              colorVariant="neutral"
              rounded="md"
              size="small"
              startIcon={<FiRefreshCw />}
              onClick={handleRefresh}
              loading={isLoading}
              disabled={isLoading}
              sx={secondaryButtonSx}
            >
              Refresh
            </AppButton>
            <PermissionGate permission="financial-period:create">
              <AppButton
                type="button"
                variant="contained"
                colorVariant="primary"
                rounded="md"
                size="small"
                startIcon={<FiPlus />}
                onClick={handleCreate}
                disabled={isLoading}
                sx={primaryButtonSx}
              >
                Create Period
              </AppButton>
            </PermissionGate>
          </AppStack>
        </AppBox>

        {/* Stats Grid */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {statsList.map((stat) => (
            <AppStatCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              subtitle={stat.description}
              icon={stat.icon}
              colorVariant={stat.colorVariant}
              variant="default"
              sx={statCardSx}
              iconSx={statIconSx}
            />
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <AppAlert
            severity="error"
            variant="soft"
            title="Something went wrong"
            closable
            onClose={clearError}
            sx={alertSx}
          >
            {error}
          </AppAlert>
        )}

        {/* Table & Filters Card */}
        <AppCard
          variant="default"
          rounded="lg"
          bordered
          shadow="sm"
          padding="none"
          sx={tableCardSx}
        >
          {/* Filters Toolbar */}
          <div className="border-b border-border px-3.5 py-3">
            <div className="grid grid-cols-[minmax(0,1fr)_160px_160px] items-center gap-3">
              <AppSearchInput
                name="search"
                value={searchParams.search}
                onChange={handleSearchChange}
                placeholder="Search period code..."
                clearable
                onClear={() => handleSearchChange("")}
                size="small"
                variant="bordered"
                rounded="md"
                sx={searchSx}
                inputSx={filterInputSx}
              />

              <AppSelect
                name="periodType"
                value={searchParams.periodType}
                onChange={(e) => handleFilterChange("periodType", e.target.value)}
                options={typeOptions}
                size="small"
                variant="bordered"
                rounded="md"
                sx={selectSx}
                inputSx={filterInputSx}
              />

              <AppSelect
                name="status"
                value={searchParams.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                options={statusOptions}
                size="small"
                variant="bordered"
                rounded="md"
                sx={selectSx}
                inputSx={filterInputSx}
              />
            </div>
          </div>

          {/* Table Container */}
          {isLoading ? (
            <AppTableSkeleton rows={8} columns={7} showHeader={false} />
          ) : financialPeriods.length === 0 ? (
            <AppEmptyState
              title="No Financial Periods Defined"
              description='Click "Create Period" to initialize new fiscal calendar slots.'
              icon={<FiCalendar />}
              action={
                <AppButton
                  variant="contained"
                  colorVariant="primary"
                  rounded="md"
                  startIcon={<FiPlus />}
                  onClick={handleCreate}
                  sx={primaryButtonSx}
                >
                  Create Period
                </AppButton>
              }
              size="page"
              sx={stateSx}
            />
          ) : (
            <AppTable
              columns={columns}
              rows={financialPeriods}
              getRowId={(row) => row._id}
              dense
              bordered={false}
              rounded={false}
              hover
              stickyHeader
              minWidth={1150}
              maxHeight="calc(100vh - 340px)"
              sx={tableSx}
              headSx={tableHeadSx}
              cellSx={tableCellSx}
            />
          )}

          {/* Table Footer */}
          {totalPeriods > pageSize ? (
            <TableFooter
              totalPeriods={totalPeriods}
              currentPage={currentPage}
              pageSize={pageSize}
              handlePageChange={handlePageChange}
              handlePageSizeChange={handlePageSizeChange}
            />
          ) : null}
        </AppCard>
      </div>
    </section>
  );
};

const TableFooter = ({
  totalPeriods,
  currentPage,
  pageSize,
  handlePageChange,
  handlePageSizeChange,
}) => {
  const startEntry = (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalPeriods);
  const totalPages = Math.ceil(totalPeriods / pageSize) || 1;

  return (
    <div className="flex items-center justify-between border-t border-border px-3.5 py-3">
      <AppText variant="body2" sx={footerTextSx}>
        Showing {startEntry} to {endEntry} of {totalPeriods} periods
      </AppText>

      <AppStack direction="row" align="center" gap={1}>
        <AppMenu
          trigger={
            <AppButton
              type="button"
              variant="outlined"
              colorVariant="neutral"
              rounded="md"
              size="small"
              endIcon={<FiChevronRight className="rotate-90" />}
              sx={pageSizeButtonSx}
            >
              {pageSize} per page
            </AppButton>
          }
          items={[
            { id: "10", label: "10 per page", onClick: () => handlePageSizeChange(10) },
            { id: "20", label: "20 per page", onClick: () => handlePageSizeChange(20) },
            { id: "50", label: "50 per page", onClick: () => handlePageSizeChange(50) },
            { id: "100", label: "100 per page", onClick: () => handlePageSizeChange(100) },
          ]}
          dense
          minWidth={120}
        />

        <AppIconButton
          icon={<FiChevronLeft />}
          variant="outlined"
          colorVariant="neutral"
          size="small"
          rounded="md"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        />

        <span className="flex h-[31px] min-w-[31px] items-center justify-center rounded-md bg-primary px-2 text-[12px] font-bold text-text-inverse">
          {currentPage}
        </span>

        <AppIconButton
          icon={<FiChevronRight />}
          variant="outlined"
          colorVariant="neutral"
          size="small"
          rounded="md"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        />
      </AppStack>
    </div>
  );
};

// Styling variables
const pageHeaderSx = { width: "100%" };
const pageHeaderSubtitleSx = {
  mt: 0.55,
  fontSize: "13px",
  lineHeight: "20px",
  color: "var(--app-color-text-muted)",
};
const pageHeaderContentSx = {
  minWidth: 0,
  "& h1, & h2, & h3, & h4": {
    m: 0,
    fontSize: "25px",
    lineHeight: 1.15,
    letterSpacing: "-0.45px",
    color: "var(--app-color-text)",
  },
};

const breadcrumbSx = { mt: 1 };
const breadcrumbItemSx = {
  fontSize: "12px",
  color: "var(--app-color-text-muted)",
};
const breadcrumbCurrentSx = {
  fontSize: "12px",
  fontWeight: 650,
  color: "var(--app-color-text)",
};

const primaryButtonSx = {
  height: 36,
  px: 1.6,
  fontSize: "12px",
  fontWeight: 700,
};
const secondaryButtonSx = {
  height: 36,
  minWidth: 92,
  px: 1.4,
  fontSize: "12px",
  fontWeight: 650,
};

const alertSx = { mt: 3 };

const statCardSx = {
  minHeight: 88,
  bgcolor: "var(--app-color-surface)",
  borderColor: "var(--app-color-border)",
  p: 1.5,
  "& p:first-of-type": { fontSize: "11px" },
  "& h1, & h2, & h3, & h4": { fontSize: "18px" },
  "& p:last-of-type": { fontSize: "11px" },
};
const statIconSx = {
  width: 38,
  height: 38,
  minWidth: 38,
  borderRadius: "11px",
};

const tableCardSx = {
  mt: 3,
  overflow: "hidden",
  bgcolor: "var(--app-color-surface)",
  borderColor: "var(--app-color-border)",
  "& > div": { minWidth: 0 },
};

const searchSx = { width: "100%" };
const selectSx = { width: "100%" };
const filterInputSx = {
  height: 36,
  fontSize: "12px",
  bgcolor: "var(--app-color-surface)",
};

const tableSx = {
  "& .MuiTableContainer-root": {
    borderRadius: 0,
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "&::-webkit-scrollbar": { display: "none" },
  },
};
const tableHeadSx = {
  bgcolor: "var(--app-color-surface-alt)",
  "& .MuiTableCell-root": {
    fontSize: "11.2px",
    fontWeight: 750,
    color: "var(--app-color-text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
};
const tableCellSx = {
  py: 1.2,
  fontSize: "12px",
  borderColor: "var(--app-color-border)",
};

const tableValueSx = {
  fontSize: "12px",
  fontWeight: 650,
  color: "var(--app-color-text)",
};
const tableValueMonoSx = {
  fontSize: "12px",
  fontWeight: 700,
  fontFamily: "var(--font-mono, monospace)",
  color: "var(--app-color-text)",
};
const tableValueMutedSx = {
  fontSize: "12px",
  fontWeight: 550,
  color: "var(--app-color-text-muted)",
};

const tagSx = {
  width: "fit-content",
  height: 22,
  px: 0.8,
  fontSize: "10.5px",
  fontWeight: 700,
};

const statusBadgeSx = {
  width: "fit-content",
  height: 22,
  px: 1.5,
  fontSize: "10.5px",
  fontWeight: 700,
  textTransform: "uppercase",
};

const footerTextSx = { fontSize: "12px", color: "var(--app-color-text-muted)" };
const pageSizeButtonSx = {
  height: 34,
  minWidth: 122,
  px: 1.2,
  fontSize: "12px",
  fontWeight: 600,
};
const stateSx = { minHeight: 430 };

export default FinancialPeriodsDesktopPage;
