import { useMemo, useState } from "react";
import {
  FiCopy,
  FiEdit2,
  FiEye,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiStar,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiMoreVertical,
  FiUpload,
} from "react-icons/fi";
import { LuBuilding2 } from "react-icons/lu";
import { FaWallet, FaRegDotCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants";

import {
  AppAlert,
  AppBox,
  AppBreadcrumb,
  AppButton,
  AppCard,
  AppHeading,
  AppIconButton,
  AppSearchInput,
  AppSelect,
  AppStack,
  AppStatCard,
  AppStatusBadge,
  AppTable,
  AppTag,
  AppText,
  AppMenu,
  PermissionGate,
} from "@/components";
import { usePermission } from "@/hooks";

import { BANK_ACCOUNT_TYPE } from "../../constants/bankAccount.constant";

// Dynamic CSS-based Bank Brand Logos
const BankLogo = ({ bankName }) => {
  const name = String(bankName || "").toLowerCase();
  
  if (name.includes("hdfc")) {
    return (
      <div className="w-8 h-8 rounded-md bg-[#1d4f91] border border-border flex items-center justify-center text-white font-extrabold text-[9px] shrink-0 select-none shadow-sm">
        <span className="tracking-tighter">HDFC</span>
      </div>
    );
  }
  if (name.includes("icici")) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#ff7a00] border border-[#d65f00] flex items-center justify-center text-white font-extrabold text-[12px] shrink-0 select-none shadow-sm relative">
        <span className="italic font-serif leading-none mt-[-1px]">i</span>
      </div>
    );
  }
  if (name.includes("axis")) {
    return (
      <div className="w-8 h-8 rounded-md bg-[#971a43] border border-border flex items-center justify-center text-white font-bold text-[9px] shrink-0 select-none shadow-sm">
        <span>AXIS</span>
      </div>
    );
  }
  if (name.includes("state") || name.includes("sbi")) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#00a3e0] border border-border flex items-center justify-center shrink-0 select-none shadow-sm relative">
        <div className="w-3.5 h-3.5 rounded-full bg-[#00a3e0] border-[2.5px] border-white flex items-center justify-center relative">
          <div className="absolute w-[2.5px] h-[7px] bg-white bottom-[-5px] left-[3px]"></div>
        </div>
      </div>
    );
  }
  if (name.includes("yes")) {
    return (
      <div className="w-8 h-8 rounded-md bg-[#004b93] border border-border flex items-center justify-center text-white font-extrabold text-[9px] shrink-0 select-none shadow-sm">
        <span>YES</span>
      </div>
    );
  }
  if (name.includes("kotak")) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#0039a6] border border-[#ea1c24] flex items-center justify-center text-white font-extrabold text-[12px] shrink-0 select-none shadow-sm">
        <span className="text-[#ea1c24] font-sans">k</span>
      </div>
    );
  }
  if (name.includes("canara")) {
    return (
      <div className="w-8 h-8 rounded-md bg-[#00a3e0] border border-border flex items-center justify-center text-[#ffd100] font-extrabold text-[8px] shrink-0 select-none shadow-sm">
        <span className="tracking-tighter">CNB</span>
      </div>
    );
  }
  if (name.includes("baroda") || name.includes("bob")) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#f05a28] border border-border flex items-center justify-center text-white font-extrabold text-[10px] shrink-0 select-none shadow-sm">
        <span>BOB</span>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-md bg-surface-alt border border-border flex items-center justify-center text-text-muted font-bold text-[10px] shrink-0 shadow-sm">
      <LuBuilding2 className="text-[16px]" />
    </div>
  );
};

const statIcons = {
  total_accounts: <LuBuilding2 />,
  total_balance: <FaWallet />,
  active_accounts: <LuBuilding2 />,
  inactive_accounts: <LuBuilding2 />,
};

const BankAccountsDesktopPage = ({
  accounts = [],
  dashboardStats = [],
  filters,
  activeFilterChips = [],
  uniqueBanks = [],
  isLoading,
  hasError,
  error,
  message,
  totalAccounts = 0,
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  hasAccounts,
  hasFilteredAccounts,
  handleFilterChange,
  handleSearchChange,
  handleRemoveFilter,
  handleClearFilters,
  handleRefresh,
  handlePageChange,
  handlePageSizeChange,
  handleAddAccount,
  handleEditAccount,
  handleViewDetails,
  handleSetPrimary,
  handleDeleteAccount,
  clearMessage,
}) => {
  const navigate = useNavigate();
  const { can } = usePermission();
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyNumber = (accountNumber, id) => {
    navigator.clipboard.writeText(accountNumber);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const accountTypeOptions = useMemo(() => {
    return [
      { label: "All Account Types", value: "all" },
      ...Object.values(BANK_ACCOUNT_TYPE).map((type) => ({
        label: type === "CURRENT" ? "Current Account" : type === "SAVINGS" ? "Savings Account" : type.replace(/_/g, " "),
        value: type,
      })),
    ];
  }, []);

  const statusOptions = [
    { label: "All Status", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  const bankOptions = useMemo(() => {
    return uniqueBanks.map((b) => ({
      label: b === "all" ? "All Banks" : b,
      value: b,
    }));
  }, [uniqueBanks]);

  // Paged accounts calculations
  const pagedAccounts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return accounts.slice(start, start + pageSize);
  }, [accounts, currentPage, pageSize]);

  const columns = useMemo(
    () => [
    {
      id: "accountDetails",
      key: "displayName",
      label: "Account Name",
      minWidth: 220,
      render: (_, account) => (
        <div className="flex items-center gap-3 min-w-0 h-full">
          <BankLogo bankName={account.displayBank} />
          <div className="flex flex-col min-w-0 justify-center">
            <div className="flex items-center gap-1.5 flex-wrap">
              <AppHeading level={3} weight={700} sx={accountNameSx}>
                {account?.displayName || "-"}
              </AppHeading>
              {account?.isPrimary && (
                <span className="inline-flex items-center rounded bg-[#e6fcf5] px-1.5 py-0.5 text-[9px] font-bold text-[#0ca678] uppercase tracking-wide">
                  Primary
                </span>
              )}
            </div>
            <AppText variant="body2" sx={branchSubtitleSx}>
              {account?.displayBranch || "-"}
            </AppText>
          </div>
        </div>
      ),
    },
    {
      id: "bankDetails",
      key: "displayIfsc",
      label: "Bank Details",
      minWidth: 150,
      render: (_, account) => (
        <div className="flex flex-col justify-center">
          <AppText variant="body2" sx={bankCodeSx}>
            {account?.displayIfsc || "-"}
          </AppText>
          <AppText variant="body2" sx={bankNameSubSx}>
            {account?.displayBank || "-"}
          </AppText>
        </div>
      ),
    },
    {
      id: "accountNumber",
      key: "displayAccountNumber",
      label: "Account No.",
      minWidth: 150,
      render: (_, account) => (
        <div className="flex items-center gap-1.5">
          <AppText variant="body2" sx={accountNumSx}>
            {account?.displayAccountNumber || "-"}
          </AppText>
          {account?.displayAccountNumber && (
            <button
              onClick={() => handleCopyNumber(account.displayAccountNumber, account._id)}
              className="text-text-muted hover:text-primary transition p-1 hover:bg-surface-hover rounded cursor-pointer"
              title="Copy Account Number"
            >
              {copiedId === account._id ? (
                <FiCheck className="text-[12px] text-success" />
              ) : (
                <FiCopy className="text-[12px]" />
              )}
            </button>
          )}
        </div>
      ),
    },
    {
      id: "registeredMobile",
      key: "registeredMobile",
      label: "Registered Mobile",
      minWidth: 140,
      render: (_, account) => (
        <AppText variant="body2" sx={mobileSx}>
          {account?.registeredMobile || "-"}
        </AppText>
      ),
    },
    {
      id: "accountType",
      key: "displayType",
      label: "Account Type",
      minWidth: 120,
      render: (_, account) => {
        const isSavings = String(account?.accountType).toUpperCase() === "SAVINGS";
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase border ${
              isSavings
                ? "bg-[#ebfbee] text-[#2b8a3e] border-[#c3fae8]"
                : "bg-[#e7f5ff] text-[#1c7ed6] border-[#d0ebff]"
            }`}
          >
            {account?.displayType || "-"}
          </span>
        );
      },
    },
    {
      id: "currentBalance",
      key: "balance",
      label: "Current Balance",
      minWidth: 140,
      render: (_, account) => (
        <AppText variant="body2" sx={balanceSx}>
          ₹ {account?.balance?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
        </AppText>
      ),
    },
    {
      id: "status",
      key: "displayStatus",
      label: "Status",
      minWidth: 100,
      render: (_, account) => {
        const isActive = account?.displayStatus === "active";
        return (
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-success" : "bg-danger"}`}></span>
            <span
              className={`text-[12px] font-semibold capitalize ${
                isActive ? "text-[#2b8a3e]" : "text-[#c92a2a]"
              }`}
            >
              {account?.displayStatus}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      key: "actions",
      label: "Actions",
      align: "right",
      width: 80,
      render: (_, account) => {
        const menuItems = [
          {
            id: "view",
            label: "View Details",
            icon: <FiEye />,
            onClick: () => handleViewDetails(account),
          },
          can("bank-account:update") && {
            id: "edit",
            label: "Edit Account",
            icon: <FiEdit2 />,
            onClick: () => handleEditAccount(account),
          },
          can("bank-account:delete") && {
            id: "delete",
            label: "Delete Account",
            icon: <FiTrash2 />,
            danger: true,
            onClick: () => handleDeleteAccount(account),
          },
        ].filter(Boolean);

        if (!account.isPrimary && can("bank-account:update")) {
          menuItems.unshift({
            id: "set-primary",
            label: "Set as Primary",
            icon: <FiStar className="text-warning" />,
            onClick: () => handleSetPrimary(account),
          });
        }

        return (
          <AppStack direction="row" align="center" justify="flex-end" gap={0.5}>
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
              minWidth={150}
            />
          </AppStack>
        );
      },
    },
  ], [
    can,
    copiedId,
    handleViewDetails,
    handleEditAccount,
    handleDeleteAccount,
    handleSetPrimary,
  ]);

  return (
    <section className="min-h-[calc(100vh-58px)] bg-bg px-6 py-5">
      {message && <TopToast message={message} onClose={clearMessage} />}

      <div className="mx-auto w-full max-w-[1500px]">
        {/* Page Header */}
        <AppBox
          display="flex"
          alignItems="flex-start"
          justifyContent="space-between"
          sx={pageHeaderSx}
        >
          <AppBox sx={pageHeaderContentSx}>
            <AppHeading level={1} weight={700}>
              Bank Accounts
            </AppHeading>
            <AppText variant="body2" sx={pageHeaderSubtitleSx}>
              Manage all your bank accounts in one place.
            </AppText>
            <AppBreadcrumb
              size="small"
              variant="text"
              items={[
                { label: "Dashboard", onClick: () => navigate(ROUTES.DASHBOARD) },
                { label: "Finance & Accounting", onClick: () => navigate(ROUTES.FINANCE) },
                { label: "Treasury", onClick: () => navigate(ROUTES.TREASURY) },
                { label: "Bank Accounts", current: true },
              ]}
              sx={breadcrumbSx}
              itemSx={breadcrumbItemSx}
              currentItemSx={breadcrumbCurrentSx}
            />
          </AppBox>

          <AppStack direction="row" gap={1.5} align="center">
            <AppButton
              type="button"
              variant="outlined"
              colorVariant="neutral"
              rounded="md"
              size="small"
              startIcon={<FiRefreshCw />}
              onClick={handleRefresh}
              loading={isLoading}
              sx={importButtonSx}
            >
              Refresh
            </AppButton>
            <PermissionGate permission="bank-account:create">
              <AppButton
                type="button"
                variant="filled"
                colorVariant="success"
                rounded="md"
                size="small"
                startIcon={<FiPlus />}
                onClick={handleAddAccount}
                sx={primaryButtonSx}
              >
                Add Bank Account
              </AppButton>
            </PermissionGate>
          </AppStack>
        </AppBox>

        {/* Dashboard Stats */}
        <StatsGrid stats={dashboardStats} />

        {/* Bank Accounts Card and Table */}
        <AppCard variant="default" rounded="lg" bordered sx={tableCardSx}>
          <TableToolbar
            filters={filters}
            activeFilterChips={activeFilterChips}
            accountTypeOptions={accountTypeOptions}
            statusOptions={statusOptions}
            bankOptions={bankOptions}
            handleFilterChange={handleFilterChange}
            handleSearchChange={handleSearchChange}
            handleRemoveFilter={handleRemoveFilter}
            handleClearFilters={handleClearFilters}
          />

          {showInitialSkeleton(isLoading, hasAccounts) ? (
            <AppBox sx={{ p: 5 }}>
              <AppText variant="body2" sx={{ textAlign: "center", color: "var(--app-color-text-muted)" }}>
                Loading bank accounts...
              </AppText>
            </AppBox>
          ) : !hasFilteredAccounts ? (
            <AppBox sx={{ p: 5, textAlign: "center" }}>
              <AppText variant="body1" sx={{ fontWeight: 600, color: "var(--app-color-text)" }}>
                No bank accounts found
              </AppText>
              <AppText variant="body2" sx={{ color: "var(--app-color-text-muted)", mt: 1 }}>
                Try modifying your filters or search keywords.
              </AppText>
              {(filters.search || filters.accountType !== "all" || filters.status !== "all" || filters.bank !== "all") && (
                <AppButton variant="text" colorVariant="primary" onClick={handleClearFilters} sx={{ mt: 2 }}>
                  Clear Filters
                </AppButton>
              )}
            </AppBox>
          ) : (
            <AppTable
              columns={columns}
              rows={pagedAccounts}
              getRowId={(row) => row._id}
              sx={tableSx}
              headSx={tableHeadSx}
              cellSx={tableCellSx}
            />
          )}

          {hasFilteredAccounts && totalAccounts > pageSize ? (
            <TableFooter
              totalAccounts={totalAccounts}
              currentPage={currentPage}
              totalPages={totalPages}
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

const showInitialSkeleton = (isLoading, hasAccounts) => isLoading && !hasAccounts;

const TopToast = ({ message, onClose }) => (
  <div className="fixed left-1/2 top-4 z-[1400] w-[calc(100%-32px)] max-w-md -translate-x-1/2">
    <AppAlert
      severity="success"
      variant="filled"
      title={message}
      closable
      onClose={onClose}
      sx={toastSx}
    />
  </div>
);

const StatsGrid = ({ stats }) => (
  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {stats.map((stat) => {
      let iconColor = "bg-success/10 text-success";
      if (stat.id === "total_balance") iconColor = "bg-info/10 text-info";
      if (stat.id === "active_accounts") iconColor = "bg-purple-100 text-[#7048e8]";
      if (stat.id === "inactive_accounts") iconColor = "bg-[#fff3bf] text-[#f08c00]";

      return (
        <AppStatCard
          key={stat.id}
          title={stat.title}
          value={stat.value}
          subtitle={stat.description}
          icon={statIcons[stat.id] || <LuBuilding2 />}
          colorVariant={stat.colorVariant}
          variant="default"
          sx={statCardSx}
          iconSx={{
            ...statIconSx,
            className: `${iconColor} ${statIconSx.className || ""}`,
          }}
        />
      );
    })}
  </div>
);

const TableToolbar = ({
  filters,
  activeFilterChips,
  accountTypeOptions,
  statusOptions,
  bankOptions,
  handleFilterChange,
  handleSearchChange,
  handleRemoveFilter,
  handleClearFilters,
}) => (
  <div className="border-b border-border px-4 py-3 bg-[#fdfdfd]">
    <div className="grid grid-cols-[minmax(0,1fr)_140px_140px_160px_104px] items-center gap-3">
      <AppSearchInput
        name="search"
        value={filters.search}
        onChange={handleSearchChange}
        placeholder="Search bank accounts by name, code, IFSC..."
        clearable
        onClear={() => handleSearchChange("")}
        size="small"
        variant="bordered"
        rounded="md"
        sx={searchSx}
        inputSx={filterInputSx}
      />

      <AppSelect
        name="status"
        value={filters.status}
        onChange={handleFilterChange}
        options={statusOptions}
        size="small"
        variant="bordered"
        rounded="md"
        sx={selectSx}
        inputSx={filterInputSx}
      />

      <AppSelect
        name="bank"
        value={filters.bank}
        onChange={handleFilterChange}
        options={bankOptions}
        size="small"
        variant="bordered"
        rounded="md"
        sx={selectSx}
        inputSx={filterInputSx}
      />

      <AppSelect
        name="accountType"
        value={filters.accountType}
        onChange={handleFilterChange}
        options={accountTypeOptions}
        size="small"
        variant="bordered"
        rounded="md"
        sx={selectSx}
        inputSx={filterInputSx}
      />

      <AppButton
        type="button"
        variant="outlined"
        colorVariant="neutral"
        rounded="md"
        size="small"
        startIcon={<FiSearch />}
        sx={filterButtonSx}
        disabled
      >
        Filters
      </AppButton>
    </div>

    {activeFilterChips.length ? (
      <AppStack direction="row" align="center" gap={0.7} sx={chipsRowSx}>
        {activeFilterChips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => handleRemoveFilter(chip.key)}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-alt px-2.5 py-1 text-[11px] font-semibold text-text-muted transition hover:bg-surface-hover cursor-pointer"
          >
            {chip.label}
          </button>
        ))}

        <button
          type="button"
          onClick={handleClearFilters}
          className="text-[11px] font-semibold text-primary cursor-pointer hover:underline"
        >
          Clear all
        </button>
      </AppStack>
    ) : null}
  </div>
);

const TableFooter = ({
  totalAccounts,
  currentPage,
  totalPages,
  pageSize,
  handlePageChange,
  handlePageSizeChange,
}) => {
  const startEntry = (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, totalAccounts);

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3.5 bg-white">
      <AppText variant="body2" sx={footerTextSx}>
        Showing {startEntry} to {endEntry} of {totalAccounts} accounts
      </AppText>

      <AppStack direction="row" align="center" gap={1}>
        <AppButton
          type="button"
          variant="outlined"
          colorVariant="neutral"
          rounded="md"
          size="small"
          endIcon={<FiChevronRight className="rotate-90" />}
          sx={pageSizeButtonSx}
        >
          {pageSize} / page
        </AppButton>

        <AppIconButton
          icon={<FiChevronLeft />}
          variant="outlined"
          colorVariant="neutral"
          size="small"
          rounded="md"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        />

        <span className="flex h-[31px] min-w-[31px] items-center justify-center rounded-md border border-[#00b85c] bg-[#e6fcf5] px-2 text-[12px] font-bold text-[#00b85c]">
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

const pageHeaderSx = { width: "100%", mb: 3 };
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
    fontSize: "26px",
    lineHeight: 1.15,
    letterSpacing: "-0.5px",
    color: "var(--app-color-text)",
  },
};

const breadcrumbSx = { mt: 1 };
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

const primaryButtonSx = {
  height: 38,
  px: 1.8,
  fontSize: "12.5px",
  fontWeight: 700,
  bgcolor: "#00b85c",
  color: "white",
  "&:hover": { bgcolor: "#009e4f" },
};
const importButtonSx = {
  height: 38,
  px: 1.8,
  fontSize: "12.5px",
  fontWeight: 650,
  borderColor: "var(--app-color-border)",
  color: "var(--app-color-text)",
  bgcolor: "white",
};

const secondaryButtonSx = {
  height: 36,
  minWidth: 92,
  px: 1.4,
  fontSize: "12px",
  fontWeight: 650,
};

const statCardSx = {
  minHeight: 90,
  bgcolor: "var(--app-color-surface)",
  borderColor: "var(--app-color-border)",
  p: 2,
  "& p:first-of-type": { fontSize: "11.5px", fontWeight: 650, color: "var(--app-color-text-muted)" },
  "& h1, & h2, & h3, & h4": { fontSize: "19px", fontWeight: 750, mt: 0.5 },
  "& p:last-of-type": { fontSize: "11px", color: "var(--app-color-text-muted)" },
};
const statIconSx = {
  width: 40,
  height: 40,
  minWidth: 40,
  borderRadius: "50%",
  "& svg": { fontSize: 18 },
};

const tableCardSx = {
  mt: 4,
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
const filterButtonSx = {
  height: 36,
  px: 1.25,
  fontSize: "12px",
  fontWeight: 650,
};
const chipsRowSx = { mt: 1.2, flexWrap: "wrap" };

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
    fontSize: "11.5px",
    fontWeight: 750,
    color: "var(--app-color-text-muted)",
    textTransform: "capitalize",
    py: 1.5,
  },
};
const tableCellSx = {
  py: 1.5,
  fontSize: "12.5px",
  borderColor: "var(--app-color-border)",
};
const tableValueSx = {
  fontSize: "12.5px",
  fontWeight: 650,
  color: "var(--app-color-text)",
};
const tableValueMutedSx = {
  fontSize: "12px",
  fontWeight: 550,
  color: "var(--app-color-text-muted)",
};

const accountNameSx = {
  m: 0,
  maxWidth: 240,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "13px",
  lineHeight: 1.25,
  color: "var(--app-color-text)",
};
const branchSubtitleSx = {
  mt: 0.3,
  maxWidth: 250,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "11px",
  lineHeight: "18px",
  color: "var(--app-color-text-muted)",
};

const bankCodeSx = {
  fontSize: "12.5px",
  fontWeight: 650,
  fontFamily: "monospace",
  color: "var(--app-color-text)",
};
const bankNameSubSx = {
  mt: 0.3,
  fontSize: "11px",
  color: "var(--app-color-text-muted)",
};

const accountNumSx = {
  fontSize: "12.5px",
  fontWeight: 600,
  fontFamily: "monospace",
  color: "var(--app-color-text)",
};

const ifscSx = {
  fontSize: "12.5px",
  fontWeight: 600,
  fontFamily: "monospace",
  color: "var(--app-color-text)",
};

const mobileSx = {
  fontSize: "12.5px",
  fontWeight: 600,
  color: "var(--app-color-text)",
};

const balanceSx = {
  fontSize: "12.5px",
  fontWeight: 700,
  color: "var(--app-color-text)",
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
  textTransform: "capitalize",
};
const toastSx = { boxShadow: "var(--app-shadow-lg)" };
const footerTextSx = { fontSize: "12px", color: "var(--app-color-text-muted)" };
const pageSizeButtonSx = {
  height: 34,
  minWidth: 122,
  px: 1.2,
  fontSize: "12px",
  fontWeight: 600,
};

export default BankAccountsDesktopPage;
