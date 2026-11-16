import React from "react";
import {
  FiSearch,
  FiPlus,
  FiEye,
  FiMoreVertical,
  FiRefreshCw,
} from "react-icons/fi";
import { LuWallet } from "react-icons/lu";

import {
  AppCard,
  AppHeading,
  AppInput,
  AppText,
  AppTablePagination,
  AppButton,
  AppIconButton,
  AppMenu,
} from "@/components";
import { formatDate } from "@/utils";
import { BranchFilterSelect, BranchBadge } from "@/components/shared";

const CashExchangesMobilePage = ({
  cashExchanges = [],
  searchParams,
  currentPage,
  pageSize,
  totalExchanges,
  isLoading = false,
  error,
  message,
  clearFeedback,
  handleSearchChange,
  handlePageChange,
  handlePageSizeChange,
  handleViewDetails,
  handleCreateNew,
  canCreateExchange = true,
  handleRefresh,
  isCompanyLevel = false,
  selectedBranchId = "all",
  setSelectedBranchId,
}) => {
  const hasFilteredExchanges = cashExchanges.length > 0;
  const shouldRenderPagination = hasFilteredExchanges && totalExchanges > pageSize;

  return (
    <section className="min-h-screen bg-bg pb-24 relative">
      {/* Top App Bar area */}
      <div className="sticky top-0 z-20 bg-surface border-b border-border shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LuWallet className="text-primary text-xl" />
            <AppHeading level={3} weight={700} sx={{ fontSize: 18 }}>
              Cash Exchanges
            </AppHeading>
          </div>
          <div className="flex gap-2">
            <AppIconButton
              variant="ghost"
              icon={<FiRefreshCw />}
              onClick={handleRefresh}
              loading={isLoading}
              size="sm"
            />
          </div>
        </div>

        {/* Global Feedback */}
        {(error || message) && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex justify-between items-center ${
              error ? "bg-danger-soft text-danger" : "bg-success-soft text-success"
            }`}
          >
            <span>{error || message}</span>
            <button
              onClick={clearFeedback}
              className="underline opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Mobile Search */}
        <div className="px-4 py-3 bg-bg space-y-2">
          {isCompanyLevel && (
            <BranchFilterSelect
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              size="sm"
              className="w-full"
            />
          )}
          <AppInput
            placeholder="Search exchanges..."
            value={searchParams.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            prefix={<FiSearch className="text-text-muted" />}
            size="sm"
          />
        </div>
      </div>

      {/* Main List */}
      <div className="px-4 pt-4 pb-20 space-y-4">
        {isLoading && !hasFilteredExchanges ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <AppText size="sm" sx={{ color: "var(--color-text-muted)" }}>
              Loading exchanges...
            </AppText>
          </div>
        ) : !hasFilteredExchanges ? (
          <div className="text-center py-12 bg-surface rounded-xl border border-border shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-soft flex items-center justify-center">
              <LuWallet className="text-primary text-2xl" />
            </div>
            <AppHeading level={4} weight={700} sx={{ marginBottom: 4 }}>
              No Exchanges Found
            </AppHeading>
            <AppText size="sm" sx={{ color: "var(--color-text-muted)", marginBottom: 16 }}>
              {searchParams.search
                ? "Try adjusting your search"
                : "Record your first denomination exchange"}
            </AppText>
            {searchParams.search && (
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => handleSearchChange("")}
              >
                Clear Search
              </AppButton>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {cashExchanges.map((row) => (
              <AppCard
                key={row._id}
                variant="default"
                rounded="lg"
                bordered
                shadow="sm"
                padding="none"
              >
                {/* Header: Num, Status, Action */}
                <div className="flex items-start justify-between px-4 py-3 border-b border-border bg-surface/50">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <AppText size="sm" weight={700} sx={{ fontFamily: "monospace" }}>
                        {row.exchangeNumber}
                      </AppText>
                      {row.branchId && (
                        <BranchBadge branch={row.branchId} />
                      )}
                    </div>
                    <AppText size="xs" sx={{ color: "var(--color-text-muted)" }}>
                      {formatDate(row.exchangeDate)}
                    </AppText>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success-soft text-success border border-success/20">
                      COMPLETED
                    </div>
                    <AppMenu
                      trigger={
                        <button className="p-1 rounded hover:bg-bg">
                          <FiMoreVertical className="text-text-muted" />
                        </button>
                      }
                      items={[
                        {
                          label: "View Details",
                          icon: <FiEye />,
                          onClick: () => handleViewDetails(row._id),
                        },
                      ]}
                      align="end"
                    />
                  </div>
                </div>

                {/* Body: Amounts */}
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div>
                    <AppText size="xs" sx={{ color: "var(--color-text-muted)", marginBottom: 2 }}>
                      Account
                    </AppText>
                    <AppText size="sm" weight={600}>
                      Branch Cash
                    </AppText>
                  </div>
                  <div />
                  <div>
                    <AppText size="xs" sx={{ color: "var(--color-text-muted)", marginBottom: 2 }}>
                      Received
                    </AppText>
                    <AppText size="sm" weight={700} sx={{ color: "var(--color-success)" }}>
                      ₹{(row.totalReceived || 0).toLocaleString("en-IN")}
                    </AppText>
                  </div>
                  <div>
                    <AppText size="xs" sx={{ color: "var(--color-text-muted)", marginBottom: 2 }}>
                      Given
                    </AppText>
                    <AppText size="sm" weight={700} sx={{ color: "var(--color-warning)" }}>
                      ₹{(row.totalGiven || 0).toLocaleString("en-IN")}
                    </AppText>
                  </div>
                </div>
              </AppCard>
            ))}

            {shouldRenderPagination && (
              <div className="py-2 bg-surface rounded-lg border border-border">
                <AppTablePagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={totalExchanges}
                  onChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  hidePageSize
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button for Create (Branch level only) */}
      {canCreateExchange && (
        <div className="fixed bottom-6 right-4 z-20">
          <button
            onClick={handleCreateNew}
            className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/30 active:scale-95 transition-transform"
          >
            <FiPlus size={24} />
          </button>
        </div>
      )}
    </section>
  );
};

export default CashExchangesMobilePage;
