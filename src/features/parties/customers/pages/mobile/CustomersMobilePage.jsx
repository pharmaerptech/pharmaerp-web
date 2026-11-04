// src/features/parties/customers/pages/mobile/CustomersMobilePage.jsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiFilter,
  FiMoreVertical,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiInfo,
} from "react-icons/fi";
import { LuStore } from "react-icons/lu";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { BiSortAlt2 } from "react-icons/bi";

import {
  AppBox,
  AppButton,
  AppCard,
  AppHeading,
  AppIconButton,
  AppMenu,
  AppSearchInput,
  AppSelect,
  AppStack,
  AppStatusBadge,
  AppTag,
  AppText,
  PermissionGate,
} from "@/components";

const typeColorMap = {
  walk_in: "teal",
  retail: "success",
  wholesale: "primary",
  hospital: "purple",
  clinic: "warning",
  corporate: "info",
  other: "neutral",
};

const statusColorMap = {
  active: "success",
  inactive: "neutral",
  blocked: "danger",
};

const getCategoryIcon = (type = "") => {
  const normType = String(type).toLowerCase();
  if (normType === "hospital") {
    return <HiOutlineBuildingOffice2 />;
  }
  return <LuStore />;
};

const CustomersMobilePage = ({
  customers = [],
  stats,
  filters,
  totalCustomers = 0,
  filteredCustomersCount = 0,
  hasFilteredCustomers,
  handleFilterChange,
  handleSearchChange,
  handleClearFilters,
  handleCreateCustomer,
  handleViewCustomer,
  handleEditCustomer,
  handleDeleteCustomer,
  handleViewCreditNotes,
  handleRefresh,
  isLoading,
}) => {
  const shouldRenderPagination = hasFilteredCustomers && totalCustomers > 10;
  const navigate = useNavigate();

  return (
    <section className="w-full bg-bg">
      <AppBox sx={containerSx}>


        {/* Header Block */}
        <AppBox sx={headerWrapperSx}>
          <AppStack
            direction="row"
            align="center"
            justify="space-between"
            gap={1}
          >
            <AppBox sx={{ minWidth: 0, flex: 1 }}>
              <AppHeading level={1} weight={800} sx={pageTitleSx}>
                Customers
              </AppHeading>
              <AppText variant="body2" weight={600} sx={pageSubtitleSx}>
                View and manage all your customer records.
              </AppText>
            </AppBox>

            <AppStack
              direction="row"
              align="center"
              gap={0.5}
              sx={{ flexShrink: 0 }}
            >
              <AppIconButton
                icon={<FiRefreshCw />}
                variant="outlined"
                colorVariant="neutral"
                size="small"
                rounded="md"
                onClick={handleRefresh}
                loading={isLoading}
                disabled={isLoading}
                sx={actionHeaderIconBtnSx}
              />
              <PermissionGate permission="customer:create">
                <AppButton
                  variant="contained"
                  colorVariant="success"
                  size="small"
                  rounded="md"
                  startIcon={<FiPlus />}
                  onClick={handleCreateCustomer}
                  sx={addCustomerBtnSx}
                >
                  Add
                </AppButton>
              </PermissionGate>
            </AppStack>
          </AppStack>
        </AppBox>

        {/* Filter bar options */}
        <AppBox sx={filterSectionSx}>
          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <AppSearchInput
              name="search"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search customers..."
              clearable
              onClear={() => handleSearchChange("")}
              size="small"
              variant="bordered"
              rounded="md"
              sx={searchBarSx}
              inputSx={inputOverrideSx}
            />
            <AppButton
              variant="outlined"
              colorVariant="neutral"
              size="small"
              rounded="md"
              startIcon={<FiFilter />}
              sx={filterToggleBtnSx}
            >
              Filter
            </AppButton>
            <AppButton
              variant="outlined"
              colorVariant="neutral"
              size="small"
              rounded="md"
              startIcon={<BiSortAlt2 className="text-[14px]" />}
              endIcon={<FiChevronDown className="text-[12px]" />}
              sx={sortBtnSx}
            >
              Sort
            </AppButton>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <AppSelect
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              options={[
                { label: "Customer Type", value: "all" },
                { label: "Retail", value: "retail" },
                { label: "Wholesale", value: "wholesale" },
                { label: "Hospital", value: "hospital" },
                { label: "Clinic", value: "clinic" },
                { label: "Corporate", value: "corporate" },
              ]}
              size="small"
              variant="bordered"
              rounded="md"
              sx={selectInputSx}
              inputSx={inputOverrideSx}
            />
            <AppSelect
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              options={[
                { label: "Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
                { label: "Blocked", value: "blocked" },
              ]}
              size="small"
              variant="bordered"
              rounded="md"
              sx={selectInputSx}
              inputSx={inputOverrideSx}
            />
          </div>
        </AppBox>

        {/* Showing label row */}
        <AppBox sx={showingLabelWrapperSx}>
          <AppText variant="body2" sx={showingLabelTextSx}>
            Showing 1 to {filteredCustomersCount} of {totalCustomers} customers
          </AppText>
        </AppBox>

        {/* Listing Stream cards */}
        <AppBox sx={listingListWrapperSx}>
          {!hasFilteredCustomers ? (
            <AppCard
              variant="default"
              rounded="md"
              bordered
              padding="md"
              sx={emptyCardContainerSx}
            >
              <AppStack
                direction="column"
                align="center"
                justify="center"
                gap={1}
                sx={{ py: 4, width: "100%" }}
              >
                <FiSearch className="text-[28px] text-text-muted/60" />
                <AppHeading
                  level={3}
                  weight={700}
                  align="center"
                  sx={{ m: 0, fontSize: "13px", width: "100%" }}
                >
                  No match found
                </AppHeading>
                <AppText
                  variant="body2"
                  align="center"
                  sx={emptyStateSubTextSx}
                >
                  Refine keywords or reset dropdown properties to inspect workspace targets.
                </AppText>
              </AppStack>
            </AppCard>
          ) : (
            <AppStack direction="column" gap={1}>
              {customers.map((cust) => {
                const normType = String(cust.customerType || cust.type).toLowerCase();
                const colorVariant = typeColorMap[normType] || "primary";

                return (
                  <AppCard
                    key={cust.id}
                    variant="default"
                    rounded="lg"
                    bordered
                    shadow="none"
                    padding="none"
                    onClick={() => handleViewCustomer(cust)}
                    sx={customerListingItemCardSx}
                  >
                    <AppStack
                      direction="row"
                      align="center"
                      justify="space-between"
                      gap={1.2}
                      fullWidth
                    >
                      {/* Left: Icon box */}
                      <AppBox
                        sx={{
                          ...avatarIconFrameSx,
                          bgcolor: `var(--app-color-${colorVariant}-soft)`,
                          color: `var(--app-color-${colorVariant})`,
                        }}
                      >
                        {getCategoryIcon(cust.customerType || cust.type)}
                      </AppBox>

                      {/* Middle Grid: Name & Phone (Line 1), Code/Type & Status (Line 2) */}
                      <div className="grid grid-cols-[1.25fr_1fr] gap-x-2 gap-y-0.5 items-center flex-1 min-w-0">
                        {/* Line 1 Col 1: Customer Name */}
                        <AppHeading
                          level={3}
                          weight={750}
                          sx={{
                            ...customerCardTitleTextSx,
                            fontSize: "12.5px",
                            lineHeight: 1.25,
                            color: "var(--app-color-text)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            m: 0,
                          }}
                        >
                          {cust.displayName}
                        </AppHeading>

                        {/* Line 1 Col 2: Phone number */}
                        <AppText
                          variant="body2"
                          weight={600}
                          sx={{
                            ...customerCardPhoneTextSx,
                            fontSize: "11px",
                            color: "var(--app-color-text-muted)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            m: 0,
                          }}
                        >
                          {cust.displayMobile || "-"}
                        </AppText>

                        {/* Line 2 Col 1: Code and Type Tag */}
                        <AppStack direction="row" align="center" gap={1} sx={{ minWidth: 0 }}>
                          <AppText
                            variant="caption"
                            weight={700}
                            sx={{
                              ...customerCardSubTextSx,
                              fontSize: "10.5px",
                              color: "var(--app-color-text-muted)",
                              whiteSpace: "nowrap",
                              m: 0,
                            }}
                          >
                            {cust.displayCode || cust.code || "-"}
                          </AppText>
                          <AppTag
                            label={cust.displayType || "Retail"}
                            variant="soft"
                            colorVariant={colorVariant}
                            rounded="sm"
                            sx={{
                              ...categoryTagOverrideSx,
                              height: 16,
                              fontSize: "8.5px",
                              fontWeight: 700,
                              px: 0.6,
                              textTransform: "capitalize",
                            }}
                          />
                        </AppStack>

                        {/* Line 2 Col 2: Status badge */}
                        <AppBox sx={{ display: "inline-flex" }}>
                          <AppStatusBadge
                            status={String(cust.displayStatus).toLowerCase()}
                            label={cust.displayStatus || ""}
                            variant="soft"
                            size="small"
                            rounded="md"
                            colorVariant={
                              statusColorMap[String(cust.displayStatus).toLowerCase()] || "neutral"
                            }
                            sx={{
                              ...statusBadgeOverrideSx,
                              height: 18,
                              fontSize: "9px",
                              fontWeight: 750,
                              px: 0.8,
                              textTransform: "capitalize",
                            }}
                          />
                        </AppBox>
                      </div>

                      {/* Right: Action Buttons (Eye and Dropdown) */}
                      <AppStack
                        direction="row"
                        align="center"
                        gap={0.5}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        sx={{ flexShrink: 0 }}
                      >
                        <AppIconButton
                          icon={<FiEye />}
                          variant="text"
                          colorVariant="neutral"
                          size="small"
                          rounded="md"
                          onClick={() => handleViewCustomer(cust)}
                          sx={{
                            color: "var(--app-color-text-muted)",
                            padding: "4px",
                            minWidth: "auto",
                            "& svg": { fontSize: 16 }
                          }}
                        />
                        <RowActionDropdownTrigger
                          customer={cust}
                          onView={handleViewCustomer}
                          onEdit={handleEditCustomer}
                          onDelete={handleDeleteCustomer}
                          onViewCreditNotes={handleViewCreditNotes}
                        />
                      </AppStack>
                    </AppStack>
                  </AppCard>
                );
              })}
            </AppStack>
          )}
        </AppBox>

        {/* Mobile Pagination */}
        {shouldRenderPagination && (
          <AppBox sx={paginationFooterWrapperSx}>
            <AppStack
              direction="row"
              align="center"
              justify="center"
              gap={0.5}
              sx={{ width: "100%" }}
            >
              <AppIconButton
                icon={<FiChevronLeft />}
                variant="outlined"
                colorVariant="neutral"
                size="small"
                rounded="md"
                disabled
                sx={paginationArrowBtnSx}
              />
              <span className="flex h-[30px] min-w-[30px] items-center justify-center rounded-md bg-success text-[11.5px] font-bold text-text-inverse shadow-sm">
                1
              </span>
              <span className="flex h-[30px] min-w-[30px] items-center justify-center rounded-md border border-border bg-surface text-[11.5px] font-bold text-text transition active:bg-surface-active">
                2
              </span>
              <span className="flex h-[30px] min-w-[30px] items-center justify-center rounded-md border border-border bg-surface text-[11.5px] font-bold text-text transition active:bg-surface-active">
                3
              </span>
              <span className="flex h-[30px] min-w-[30px] items-center justify-center text-[11.5px] font-bold text-text-muted">
                ...
              </span>
              <span className="flex h-[30px] min-w-[30px] items-center justify-center rounded-md border border-border bg-surface text-[11.5px] font-bold text-text transition active:bg-surface-active">
                249
              </span>
              <AppIconButton
                icon={<FiChevronRight />}
                variant="outlined"
                colorVariant="neutral"
                size="small"
                rounded="md"
                sx={paginationArrowBtnSx}
              />
            </AppStack>
          </AppBox>
        )}

        {/* Bottom Read-Only Info Banner */}
        <AppBox sx={infoBannerSx}>
          <AppStack direction="row" align="center" gap={1.2}>
            <FiInfo className="text-[18px] text-blue-600 flex-shrink-0" />
            <AppText variant="body2" sx={infoBannerTextSx}>
              You can view customer details by clicking on the eye icon.
              All actions are read-only in this version.
            </AppText>
          </AppStack>
        </AppBox>
      </AppBox>
    </section>
  );
};

const RowActionDropdownTrigger = ({
  customer,
  onView,
  onEdit,
  onDelete,
  onViewCreditNotes,
}) => {
  const isWalkIn = Boolean(
    customer?.isWalkIn ||
    customer?.customerType === "walk_in" ||
    customer?.type === "walk_in" ||
    customer?.displayType?.toLowerCase?.() === "walk_in" ||
    customer?.displayType?.toLowerCase?.() === "walk-in"
  );

  const menuConfigItems = [
    {
      id: "view",
      label: "View Details",
      icon: <FiEye />,
      onClick: () => onView?.(customer),
    },
    ...(!isWalkIn
      ? [
          {
            id: "credit_notes",
            label: "Credit Notes",
            icon: <FiEye />,
            onClick: () => onViewCreditNotes?.(customer),
          },
        ]
      : []),
    {
      id: "edit",
      label: "Edit Customer",
      icon: <FiEdit2 />,
      onClick: () => onEdit?.(customer),
    },
    ...(!isWalkIn
      ? [
          { id: "divider_row", type: "divider" },
          {
            id: "remove",
            label: "Remove Profile",
            icon: <FiTrash2 />,
            danger: true,
            onClick: () => onDelete?.(customer),
          },
        ]
      : []),
  ];

  return (
    <AppMenu
      trigger={
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className="inline-flex h-7 w-7 items-center justify-center border-0 bg-transparent p-0 text-text-muted transition hover:text-text focus:outline-none"
        >
          <FiMoreVertical className="text-[17px]" />
        </button>
      }
      triggerProps={{
        onClick: (e) => {
          e.stopPropagation();
          e.preventDefault();
        },
      }}
      items={menuConfigItems}
      dense
      minWidth={165}
    />
  );
};

/* Style Definitions */
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
  pb: 1.25,
  px: 0.5,
};

const pageTitleSx = {
  m: 0,
  fontSize: "21px",
  lineHeight: 1.15,
  letterSpacing: "-0.4px",
  color: "var(--app-color-text)",
};

const pageSubtitleSx = {
  mt: 0.2,
  fontSize: "11.5px",
  color: "var(--app-color-text-muted)",
};

const actionHeaderIconBtnSx = {
  height: 32,
  width: 32,
  minWidth: 32,
  borderColor: "var(--app-color-border)",
};

const addCustomerBtnSx = {
  height: 32,
  fontSize: "11px",
  fontWeight: 750,
  px: 1.2,
  boxShadow: "var(--app-shadow-xs)",
  "& .MuiButton-startIcon": {
    marginRight: "4px",
    fontSize: "12px",
  },
};

const filterSectionSx = {
  px: 0.5,
  pb: 1,
};

const searchBarSx = {
  width: "100%",
};

const filterToggleBtnSx = {
  height: 35,
  fontSize: "11.5px",
  fontWeight: 650,
  borderColor: "var(--app-color-border)",
  color: "var(--app-color-text)",
  px: 1.2,
  "& .MuiButton-startIcon": {
    marginRight: "4px",
    fontSize: "12px",
  },
};

const sortBtnSx = {
  height: 35,
  fontSize: "11.5px",
  fontWeight: 650,
  borderColor: "var(--app-color-border)",
  color: "var(--app-color-text)",
  px: 1.2,
  "& .MuiButton-startIcon": {
    marginRight: "4px",
    fontSize: "12px",
  },
};

const selectInputSx = {
  width: "100%",
};

const inputOverrideSx = {
  height: 35,
  fontSize: "11.5px",
  bgcolor: "var(--app-color-surface)",
  color: "var(--app-color-text)",
};

const inlineAddCustomerBtnSx = {
  height: 35,
  fontSize: "11px",
  fontWeight: 750,
  bgcolor: "var(--app-color-success, #10b981)",
  color: "var(--app-color-text-inverse, #ffffff)",
  px: 1,
  boxShadow: "none",
  textTransform: "none",
  whiteSpace: "nowrap",
  "& .MuiButton-startIcon": {
    marginRight: "4px",
    fontSize: "12px",
  },
  "&:hover": {
    bgcolor: "color-mix(in_srgb, var(--app-color-success) 90%, black)",
  },
};

const showingLabelWrapperSx = {
  px: 0.5,
  pt: 0.5,
  pb: 1,
};

const showingLabelTextSx = {
  fontSize: "11.5px",
  color: "var(--app-color-text-muted)",
  fontWeight: 500,
};

const listingListWrapperSx = {
  px: 0.5,
  py: 1,
  bgcolor: "color-mix(in_srgb, var(--app-color-surface-alt) 25%, transparent)",
  overflowY: "auto",
  msOverflowStyle: "none",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": {
    display: "none",
    width: 0,
    height: 0,
  },
};

const emptyCardContainerSx = {
  borderColor: "var(--app-color-border)",
  bgcolor: "var(--app-color-surface)",
  width: "100%",
};

const emptyStateSubTextSx = {
  fontSize: "11px",
  color: "var(--app-color-text-muted)",
  px: 2,
  textAlign: "center",
  width: "100%",
};

const customerListingItemCardSx = {
  p: 1.2,
  bgcolor: "var(--app-color-surface)",
  borderColor: "var(--app-color-border)",
  boxShadow: "var(--app-shadow-xs)",
  cursor: "pointer",
  transition: "background-color 0.1s ease",
  "&:hover": {
    bgcolor: "var(--app-color-surface)",
  },
};

const avatarIconFrameSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  borderRadius: "8px",
  fontSize: "16px",
  flexShrink: 0,
};

const customerCardTitleTextSx = {
  m: 0,
  fontSize: "12.5px",
  lineHeight: 1.25,
  color: "var(--app-color-text)",
};

const customerCardSubTextSx = {
  fontSize: "10.5px",
  color: "var(--app-color-text-muted)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const customerCardPhoneTextSx = {
  fontSize: "11px",
  color: "var(--app-color-text-muted)",
};

const statusBadgeOverrideSx = {
  height: 18,
  fontSize: "9px",
  fontWeight: 750,
  px: 0.8,
  textTransform: "capitalize",
};

const categoryTagOverrideSx = {
  height: 16,
  fontSize: "8.5px",
  fontWeight: 700,
  px: 0.6,
  textTransform: "capitalize",
};

const paginationFooterWrapperSx = {
  px: 0.5,
  pt: 2,
  pb: 2,
  borderTop: "1px solid var(--app-color-divider)",
  display: "flex",
  justifyContent: "center",
  width: "100%",
};

const paginationArrowBtnSx = {
  height: 30,
  width: 30,
  minWidth: 30,
  borderColor: "var(--app-color-border)",
};

const infoBannerSx = {
  mt: 1.5,
  mb: 3,
  mx: 0.5,
  p: 1.2,
  borderRadius: "8px",
  bgcolor: "#eff6ff",
  border: "1px solid #dbeafe",
};

const infoBannerTextSx = {
  fontSize: "11px",
  color: "#1e40af",
  lineHeight: 1.4,
  fontWeight: 500,
};

export default CustomersMobilePage;
