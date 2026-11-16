import { useState } from "react";
import { FiPlus, FiSearch, FiChevronRight, FiFilter } from "react-icons/fi";
import dayjs from "dayjs";
import { AppText, AppEmptyState } from "@/components";
import { BranchFilterSelect, BranchBadge } from "@/components/shared";
import { ConfirmDepositModal, CancelSlipModal } from "../../components/BankDepositSlipActionModals";

const getStatusColor = (status) => {
  switch (status) {
    case "PENDING":
      return "text-warning bg-warning-soft border-warning/20";
    case "DEPOSITED":
      return "text-success bg-success-soft border-success/20";
    case "CANCELLED":
      return "text-danger bg-danger-soft border-danger/20";
    default:
      return "text-text-muted bg-surface-alt border-border";
  }
};

const BankDepositSlipsMobilePage = ({
  bankDepositSlips,
  searchParams,
  currentPage,
  pageSize,
  totalSlips,
  isLoading,
  error,
  message,
  clearFeedback,
  handleSearchChange,
  handleFilterChange,
  handlePageChange,
  handleConfirmDeposit,
  handleCancelSlip,
  handleViewDetails,
  handleCreateNew,
  canCreateSlip = true,
  isCompanyLevel = false,
  selectedBranchId = "all",
  setSelectedBranchId,
}) => {
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const totalPages = Math.ceil(totalSlips / pageSize) || 1;

  const openConfirmModal = (e, slip) => {
    e.stopPropagation();
    setSelectedSlip(slip);
    setIsConfirmModalOpen(true);
  };

  const openCancelModal = (e, slip) => {
    e.stopPropagation();
    setSelectedSlip(slip);
    setIsCancelModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-surface-alt">
      <div className="flex-none px-4 py-4 bg-surface border-b border-border shadow-sm z-10">
        <div className="flex items-center justify-between mb-4">
          <AppText variant="h6" className="font-bold text-text">
            Deposit Slips
          </AppText>
          {canCreateSlip && (
            <button
              onClick={handleCreateNew}
              className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full shadow-md"
            >
              <FiPlus size={20} />
            </button>
          )}
        </div>

        {/* Company Level Branch Filter */}
        {isCompanyLevel && (
          <div className="mb-3">
            <BranchFilterSelect
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              placeholder="All Branches"
              className="w-full"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchParams.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-alt border border-border rounded-xl text-[14px] text-text outline-none focus:border-primary transition"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition ${
              showFilters || searchParams.status !== "all" 
                ? "bg-primary-soft text-primary border-primary/30" 
                : "bg-surface border-border text-text-muted"
            }`}
          >
            <FiFilter size={18} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-border animate-in slide-in-from-top-2">
            <select
              value={searchParams.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-[14px] text-text outline-none focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="DEPOSITED">Deposited</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-3">
        {error && (
          <div className="p-3 bg-danger-soft text-danger rounded-xl text-[13px] flex justify-between items-center shadow-sm">
            <span>{error}</span>
            <button onClick={clearFeedback} className="font-bold p-1">&times;</button>
          </div>
        )}
        {message && (
          <div className="p-3 bg-success-soft text-success rounded-xl text-[13px] flex justify-between items-center shadow-sm">
            <span>{message}</span>
            <button onClick={clearFeedback} className="font-bold p-1">&times;</button>
          </div>
        )}

        {isLoading && bankDepositSlips.length === 0 ? (
          <div className="flex items-center justify-center p-10">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : bankDepositSlips.length === 0 ? (
          <div className="bg-surface rounded-xl p-6 shadow-sm border border-border mt-4">
            <AppEmptyState
              title="No deposit slips"
              description="Create a new bank deposit slip."
              actionLabel={canCreateSlip ? "Create Slip" : undefined}
              onAction={canCreateSlip ? handleCreateNew : undefined}
            />
          </div>
        ) : (
          bankDepositSlips.map((slip) => (
            <div
              key={slip._id}
              onClick={() => handleViewDetails(slip._id)}
              className="bg-surface rounded-xl p-4 shadow-sm border border-border flex flex-col gap-3 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between">
                <div>
                  <AppText variant="subtitle2" className="font-bold text-text">
                    {slip.slipNumber}
                  </AppText>
                  {isCompanyLevel && (
                    <div className="mt-1">
                      <BranchBadge branch={slip.branchId} />
                    </div>
                  )}
                  <AppText variant="body2" className="text-[12px] text-text-muted mt-0.5">
                    {dayjs(slip.slipDate).format("DD MMM YYYY")}
                  </AppText>
                  {slip.dayClosingId?.dayClosingNo && (
                    <span className="text-[10px] text-text-muted font-mono block mt-0.5">
                      DC: {slip.dayClosingId.dayClosingNo}
                    </span>
                  )}
                </div>
                <div className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusColor(slip.status)}`}>
                  {slip.status}
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-y border-border/50">
                <div>
                  <p className="text-[11px] text-text-muted">Amount</p>
                  <p className="text-[15px] font-bold text-primary mt-0.5">
                    ₹{slip.amount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-text-muted">To Bank A/c</p>
                  <p className="text-[13px] font-medium text-text mt-0.5">
                    {slip.toBankAccountId?.accountName ||
                      slip.toBankAccountId?.bankMasterId?.name ||
                      slip.toBankAccountId?.bankName ||
                      slip.toBankAccount?.bankName ||
                      "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-2">
                  {slip.status === "PENDING" && (
                    <>
                      <button
                        onClick={(e) => openConfirmModal(e, slip)}
                        className="px-3 py-1.5 bg-success-soft text-success text-[12px] font-medium rounded-lg"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={(e) => openCancelModal(e, slip)}
                        className="px-3 py-1.5 bg-danger-soft text-danger text-[12px] font-medium rounded-lg"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
                <FiChevronRight className="text-border" size={20} />
              </div>
            </div>
          ))
        )}

        {totalSlips > pageSize && (
          <div className="flex items-center justify-center gap-4 py-4 mt-2">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-4 py-2 bg-surface border border-border rounded-xl text-[13px] text-text font-medium disabled:opacity-50 shadow-sm"
            >
              Prev
            </button>
            <span className="text-[13px] text-text-muted font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-4 py-2 bg-surface border border-border rounded-xl text-[13px] text-text font-medium disabled:opacity-50 shadow-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ConfirmDepositModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={(payload) => {
          handleConfirmDeposit(selectedSlip?._id, payload);
          setIsConfirmModalOpen(false);
        }}
        isLoading={isLoading}
        slip={selectedSlip}
      />

      <CancelSlipModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={(payload) => {
          handleCancelSlip(selectedSlip?._id, payload);
          setIsCancelModalOpen(false);
        }}
        isLoading={isLoading}
      />
    </div>
  );
};

export default BankDepositSlipsMobilePage;
