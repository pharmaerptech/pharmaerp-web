import React from "react";
import {
  FiArrowRight,
  FiFileText,
  FiGitBranch,
  FiLayers,
  FiXCircle,
  FiRefreshCw,
  FiPlus,
  FiDownload,
  FiUpload,
  FiBookOpen,
  FiChevronRight,
  FiChevronLeft,
  FiMoreHorizontal,
  FiExternalLink,
  FiEye,
  FiCheckCircle,
  FiEdit2,
} from "react-icons/fi";

import {
  AppBox,
  AppBreadcrumb,
  AppButton,
  AppCard,
  AppHeading,
  AppIconButton,
  AppSearchInput,
  AppSelect,
  AppStack,
  AppStatusBadge,
  AppTag,
  AppText,
  PageHeader,
  AppMenu,
  PermissionGate,
  AppTable,
} from "@/components";
import { usePermission } from "@/hooks";

// Map status to badge color
const statusColorMap = {
  active: "success",
  inactive: "neutral",
};

// Toolbar for Account Groups (removed redundant Filters button)
const GroupsTableToolbar = ({
  filters,
  rootGroupOptions,
  statusOptions,
  handleFilterChange,
  handleCreateGroup,
}) => (
  <div className="border-b border-border px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
    <div className="flex items-center gap-3 flex-1 min-w-[300px]">
      <AppSearchInput
        name="search"
        value={filters.search}
        onChange={(e) => handleFilterChange("search", e.target.value)}
        placeholder="Search account groups..."
        clearable
        onClear={() => handleFilterChange("search", "")}
        size="small"
        variant="bordered"
        rounded="md"
        sx={{ maxWidth: 220, width: "100%" }}
        inputSx={filterInputSx}
      />
      <AppSelect
        name="status"
        value={filters.status}
        onChange={(e) => handleFilterChange("status", e.target.value)}
        options={statusOptions}
        size="small"
        variant="bordered"
        rounded="md"
        sx={{ width: 110 }}
        inputSx={filterInputSx}
      />
      <AppSelect
        name="underGroup"
        value={filters.underGroup}
        onChange={(e) => handleFilterChange("underGroup", e.target.value)}
        options={rootGroupOptions}
        size="small"
        variant="bordered"
        rounded="md"
        sx={{ width: 180 }}
        inputSx={filterInputSx}
      />
    </div>
    <PermissionGate permission="account-group:create">
      <AppButton
        type="button"
        variant="contained"
        colorVariant="success"
        rounded="md"
        size="small"
        startIcon={<FiPlus />}
        onClick={handleCreateGroup}
        sx={addButtonSx}
      >
        Add Account Group
      </AppButton>
    </PermissionGate>
  </div>
);

// Pagination footer (hidden conditionally when total groups count <= 10)
const TableFooter = ({
  total,
  currentPage,
  totalPages,
  pageSize,
  handlePageChange,
  handlePageSizeChange,
}) => {
  const startEntry = total > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endEntry = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-3.5">
      <AppText variant="body2" sx={footerTextSx}>
        Showing {startEntry} to {endEntry} of {total} account groups
      </AppText>

      <AppStack direction="row" align="center" gap={1}>
        <AppSelect
          name="tablePageSize"
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          options={[
            { label: "10 / page", value: 10 },
            { label: "20 / page", value: 20 },
            { label: "50 / page", value: 50 },
          ]}
          size="small"
          variant="bordered"
          rounded="md"
          sx={pageSizeSelectSx}
          inputSx={pageSizeInputSx}
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

const AccountGroupsDesktopPage = ({
  accountGroups = [],
  totalCount = 0,
  currentPage = 1,
  pageSize = 10,
  totalPages = 1,
  handlePageChange,
  handlePageSizeChange,
  stats = {},
  filters = {},
  rootGroupOptions = [],
  statusOptions = [],
  isLoading = false,
  handleFilterChange,
  handleCreateGroup,
  handleViewGroup,
  handleEditGroup,
  handleDeleteGroup,
  handleRefresh,
  handleBackToCOA,
}) => {
  // Define columns matching the design specs
  const columns = [
    {
      id: "name",
      key: "name",
      label: "Group Name",
      minWidth: 200,
      render: (_, row) => (
        <AppText variant="body2" sx={rowNameBoldSx}>
          {row.name}
        </AppText>
      ),
    },
    {
      id: "code",
      key: "code",
      label: "Group Code",
      minWidth: 120,
      render: (_, row) => (
        <AppText variant="body2" sx={rowTextMutedSx}>
          {row.code}
        </AppText>
      ),
    },
    {
      id: "level",
      key: "level",
      label: "Level",
      minWidth: 80,
      render: (_, row) => (
        <AppText variant="body2" sx={rowTextSx}>
          {row.level}
        </AppText>
      ),
    },
    {
      id: "underGroup",
      key: "underGroup",
      label: "Under Group",
      minWidth: 140,
      render: (_, row) => (
        <AppText variant="body2" sx={rowTextMutedSx}>
          {row.underGroup}
        </AppText>
      ),
    },
    {
      id: "accountsCount",
      key: "accountsCount",
      label: "Accounts",
      minWidth: 90,
      render: (_, row) => (
        <AppText variant="body2" sx={rowTextSx}>
          {row.accountsCount}
        </AppText>
      ),
    },
    {
      id: "status",
      key: "status",
      label: "Status",
      minWidth: 100,
      render: (_, row) => (
        <AppStatusBadge
          status={row.status}
          label={row.status}
          variant="soft"
          size="small"
          rounded="md"
          colorVariant={statusColorMap[row.status] || "neutral"}
          sx={statusBadgeSx}
        />
      ),
    },
    {
      id: "actions",
      key: "actions",
      label: "Actions",
      align: "right",
      width: 90,
      render: (_, row) => (
        <AppStack direction="row" align="center" justify="flex-end" gap={0.5}>
          <AppMenu
            trigger={
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-transparent text-text-muted hover:text-text focus:outline-none"
              >
                <FiMoreHorizontal className="text-[16px]" />
              </button>
            }
            items={[
              { id: "view", label: "View Details", icon: <FiEye />, onClick: () => handleViewGroup(row._id) },
              { id: "edit", label: "Edit Group", icon: <FiEdit2 />, onClick: () => handleEditGroup(row._id) },
            ]}
            dense
            minWidth={140}
          />
        </AppStack>
      ),
    },
  ];

  return (
    <section className="min-h-[calc(100vh-58px)] bg-bg px-6 py-5">
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Page Header with breadcrumbs */}
        <PageHeader
          title="Account Groups"
          subtitle="View and manage all account groups in your chart of accounts."
          extra={
            <AppBreadcrumb
              size="small"
              variant="text"
              items={[
                { label: "Dashboard" },
                { label: "Finance & Accounting", onClick: handleBackToCOA },
                { label: "Account Groups", current: true },
              ]}
              sx={breadcrumbSx}
              itemSx={breadcrumbItemSx}
              currentItemSx={breadcrumbCurrentSx}
            />
          }
          actions={
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
          }
          align="flex-start"
          justify="space-between"
          sx={pageHeaderSx}
          contentSx={pageHeaderContentSx}
        />

        {/* Layout grid containing sidebars and table */}
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_290px] gap-5">
          {/* Left Table Section */}
          <div className="min-w-0">
            <AppCard
              variant="default"
              rounded="lg"
              bordered
              shadow="sm"
              padding="none"
              sx={tableCardSx}
            >
              <GroupsTableToolbar
                filters={filters}
                rootGroupOptions={rootGroupOptions}
                statusOptions={statusOptions}
                handleFilterChange={handleFilterChange}
                handleCreateGroup={handleCreateGroup}
              />

              <AppTable
                columns={columns}
                rows={accountGroups}
                getRowId={(row) => row._id}
                dense
                bordered={false}
                rounded={false}
                hover
                sx={tableSx}
                headSx={tableHeadSx}
                cellSx={tableCellSx}
              />

              {/* Conditional pagination display: hide if 10 or fewer rows */}
              {totalCount > 10 && (
                <TableFooter
                  total={totalCount}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  handlePageChange={handlePageChange}
                  handlePageSizeChange={handlePageSizeChange}
                />
              )}
            </AppCard>
          </div>

          {/* Right Sidebar Section */}
          <div className="space-y-4">
            {/* Account Groups Summary widget card */}
            <AppCard
              variant="default"
              rounded="lg"
              bordered
              shadow="sm"
              padding="none"
              sx={sideCardSx}
            >
              <div className="px-4 py-3.5 border-b border-border">
                <AppHeading level={3} weight={700} sx={sideCardTitleSx}>
                  Account Groups Summary
                </AppHeading>
              </div>
              <div className="p-4 space-y-3.5">
                <div className="flex justify-between items-center text-[12.5px]">
                  <span className="text-text-muted font-medium">Total Groups</span>
                  <span className="font-bold text-text">{stats.totalGroups}</span>
                </div>
                <div className="flex justify-between items-center text-[12.5px]">
                  <span className="text-text-muted font-medium">Root Groups</span>
                  <span className="font-bold text-text">{stats.rootGroups}</span>
                </div>
                <div className="flex justify-between items-center text-[12.5px]">
                  <span className="text-text-muted font-medium">Under Groups</span>
                  <span className="font-bold text-text">{stats.underGroups}</span>
                </div>
                <div className="flex justify-between items-center text-[12.5px]">
                  <span className="text-text-muted font-medium">Total Accounts</span>
                  <span className="font-bold text-text">{stats.totalAccounts}</span>
                </div>
                <div className="flex justify-between items-center text-[12.5px]">
                  <span className="text-text-muted font-medium">Active Groups</span>
                  <span className="font-bold text-success">{stats.activeGroups}</span>
                </div>
                <div className="flex justify-between items-center text-[12.5px]">
                  <span className="text-text-muted font-medium">Inactive Groups</span>
                  <span className="font-bold text-text-muted">{stats.inactiveGroups}</span>
                </div>
                <div className="my-2 h-[1px] bg-divider" />
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-text-muted">Last Updated</span>
                  <span className="text-text font-semibold">{stats.lastUpdated}</span>
                </div>
              </div>
            </AppCard>

            {/* Quick Actions widget card */}
            <AppCard
              variant="default"
              rounded="lg"
              bordered
              shadow="sm"
              padding="none"
              sx={sideCardSx}
            >
              <div className="px-4 py-3.5 border-b border-border">
                <AppHeading level={3} weight={700} sx={sideCardTitleSx}>
                  Quick Actions
                </AppHeading>
              </div>
              <div className="p-2 space-y-0.5">
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  className="w-full text-left flex items-center gap-2 p-1.5 rounded-md hover:bg-surface-hover transition text-[11.5px] font-medium text-text"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-success-soft text-success text-[12px] shrink-0">
                    <FiPlus />
                  </span>
                  Add Root Group
                </button>
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  className="w-full text-left flex items-center gap-2 p-1.5 rounded-md hover:bg-surface-hover transition text-[11.5px] font-medium text-text"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-success-soft text-success text-[12px] shrink-0">
                    <FiPlus />
                  </span>
                  Add Sub Group
                </button>
                <button
                  type="button"
                  className="w-full text-left flex items-center gap-2 p-1.5 rounded-md hover:bg-surface-hover transition text-[11.5px] font-medium text-text"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-purple-soft text-purple text-[12px] shrink-0">
                    <FiBookOpen />
                  </span>
                  View Group Hierarchy
                </button>
                <button
                  type="button"
                  className="w-full text-left flex items-center gap-2 p-1.5 rounded-md hover:bg-surface-hover transition text-[11.5px] font-medium text-text"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-primary-soft text-primary text-[12px] shrink-0">
                    <FiUpload />
                  </span>
                  Import Groups
                </button>
                <button
                  type="button"
                  className="w-full text-left flex items-center gap-2 p-1.5 rounded-md hover:bg-surface-hover transition text-[11.5px] font-medium text-text"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-primary-soft text-primary text-[12px] shrink-0">
                    <FiDownload />
                  </span>
                  Export Groups
                </button>
              </div>
            </AppCard>

            {/* Help & Support support card */}
            <AppCard
              variant="default"
              rounded="lg"
              bordered
              shadow="sm"
              padding="none"
              sx={sideCardSx}
            >
              <div className="p-4">
                <AppHeading level={3} weight={700} sx={sideCardTitleSx}>
                  Help & Support
                </AppHeading>
                <AppText variant="body2" sx={helpDescSx}>
                  Organize your chart of accounts using groups for better structure and reporting.
                </AppText>
                <button
                  type="button"
                  className="mt-3.5 text-[11px] font-bold text-primary flex items-center gap-1 hover:underline text-left"
                >
                  View User Guide <FiArrowRight className="text-[12px]" />
                </button>
              </div>
            </AppCard>
          </div>
        </div>

        {/* Banner banner information */}
        <div className="mt-5">
          <AppCard
            variant="default"
            rounded="xl"
            bordered
            shadow="none"
            padding="none"
            sx={bannerCardSx}
          >
            <div className="flex items-center justify-between w-full p-4 md:p-5">
              <div className="flex items-center gap-4">
                <AppBox sx={bannerIconBoxSx}>
                  <FiLayers className="text-[18px]" />
                </AppBox>
                <div>
                  <AppHeading level={2} weight={600} sx={bannerTitleSx}>
                    About Account Groups
                  </AppHeading>
                  <AppText variant="body2" sx={bannerDescSx}>
                    Account groups help you organize accounts in a hierarchical structure. Root groups are top-level groups with no parent.
                  </AppText>
                </div>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    </section>
  );
};

// Styling components
const breadcrumbSx = { mt: 0 };
const breadcrumbItemSx = {
  fontSize: "12px",
  color: "var(--app-color-text-muted)",
};
const breadcrumbCurrentSx = {
  fontSize: "12px",
  fontWeight: 650,
  color: "var(--app-color-text)",
};

const pageHeaderSx = {
  width: "100%",
};

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

const secondaryButtonSx = {
  height: 34,
  minWidth: 100,
  px: 1.25,
  fontSize: "11.5px",
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const addButtonSx = {
  height: 34,
  fontSize: "11.5px",
  fontWeight: 600,
};

const tableCardSx = {
  bgcolor: "var(--app-color-surface)",
  borderColor: "var(--app-color-border)",
  overflow: "hidden",
};

const sideCardSx = {
  bgcolor: "var(--app-color-surface)",
  borderColor: "var(--app-color-border)",
  overflow: "hidden",
};

const sideCardTitleSx = {
  m: 0,
  fontSize: "12.8px",
  color: "var(--app-color-text)",
};

const helpDescSx = {
  mt: 1,
  fontSize: "11.2px",
  color: "var(--app-color-text-muted)",
  lineHeight: "15px",
};

const rowNameBoldSx = {
  fontSize: "12.8px",
  fontWeight: 700,
  color: "var(--app-color-text)",
};

const rowTextSx = {
  fontSize: "12.5px",
  color: "var(--app-color-text)",
};

const rowTextMutedSx = {
  fontSize: "12.5px",
  color: "var(--app-color-text-muted)",
};

const statusBadgeSx = {
  height: 22,
  px: 1.2,
  fontSize: "10px",
  fontWeight: 600,
  textTransform: "capitalize",
};

const filterInputSx = {
  height: 34,
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
  "& th": {
    py: 1.5,
    px: 2,
    fontSize: "11.2px",
    fontWeight: 700,
    color: "var(--app-color-text-muted)",
    textTransform: "uppercase",
    borderBottom: "1px solid var(--app-color-border)",
  },
};

const tableCellSx = {
  py: 1.75,
  px: 2,
  borderBottom: "1px solid var(--app-color-border)",
};

const pageSizeButtonSx = {
  height: 31,
  fontSize: "11.5px",
  fontWeight: 600,
};

const pageSizeSelectSx = { width: 110 };
const pageSizeInputSx = { height: 31, fontSize: "11.5px", py: 0 };

const footerTextSx = {
  fontSize: "12px",
  fontWeight: 500,
  color: "var(--app-color-text-muted)",
};

const bannerCardSx = {
  bgcolor: "var(--app-color-info-soft)",
  borderColor: "color-mix(in srgb, var(--app-color-info) 10%, transparent)",
  boxShadow: "none",
};

const bannerIconBoxSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 38,
  height: 38,
  borderRadius: "10px",
  bgcolor: "var(--app-color-surface)",
  color: "var(--app-color-info)",
  fontSize: "18px",
  flexShrink: 0,
};

const bannerTitleSx = {
  m: 0,
  fontSize: "14px",
  fontWeight: 600,
  color: "var(--app-color-info)",
};

const bannerDescSx = {
  mt: 0.25,
  fontSize: "12px",
  lineHeight: "16px",
  color: "var(--app-color-text-muted)",
};

// Transparency applied to action icon buttons as requested by the user
const actionIconButtonSx = {
  p: 0,
  height: 28,
  width: 28,
  minWidth: 28,
  bgcolor: "transparent",
  border: "none",
  boxShadow: "none",
  color: "var(--app-color-text-muted)",
  "&:hover": {
    bgcolor: "var(--app-color-surface-hover)",
    color: "var(--app-color-text)",
  },
};

export default AccountGroupsDesktopPage;
