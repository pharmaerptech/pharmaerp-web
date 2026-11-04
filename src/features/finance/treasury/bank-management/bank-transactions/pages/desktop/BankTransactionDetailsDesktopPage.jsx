import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiXCircle,
  FiCheckCircle,
  FiInfo,
  FiUser,
  FiCalendar,
} from "react-icons/fi";
import { LuBuilding2 } from "react-icons/lu";

import {
  AppBox,
  AppBreadcrumb,
  AppButton,
  AppCard,
  AppHeading,
  AppStack,
  AppText,
  PageHeader,
} from "@/components";
import { formatCurrency, formatDate, formatDateTime } from "@/utils";

const resolveTxTimestamp = (tx) => {
  if (!tx) return null;
  const d = tx.transactionDate ? new Date(tx.transactionDate) : null;
  const isMidnightUTC =
    d &&
    !Number.isNaN(d.getTime()) &&
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0;

  if (isMidnightUTC && (tx.postedAt || tx.createdAt)) {
    return tx.postedAt || tx.createdAt;
  }
  return tx.transactionDate || tx.postedAt || tx.createdAt;
};

const BankTransactionDetailsDesktopPage = ({
  transaction,
  isLoading = false,
  isActioning = false,
  error,
  handleBack,
  handleRefresh,
  handleCancel,
  clearLocalErrors,
}) => {
  if (isLoading) {
    return (
      <section className="min-h-[calc(100vh-58px)] bg-bg px-6 py-5 flex items-center justify-center">
        <AppText variant="body1" sx={{ color: "var(--app-color-text-muted)", fontWeight: 600 }}>
          Loading transaction details...
        </AppText>
      </section>
    );
  }

  if (!transaction) {
    return (
      <section className="min-h-[calc(100vh-58px)] bg-bg px-6 py-5">
        <div className="mx-auto w-full max-w-[1000px] text-center py-10">
          <AppHeading level={2} weight={700} sx={{ color: "var(--app-color-text)" }}>
            Transaction Not Found
          </AppHeading>
          <AppText variant="body1" sx={{ color: "var(--app-color-danger)", mt: 1 }}>
            {error || "The requested bank transaction does not exist or has been deleted."}
          </AppText>
          <AppButton variant="contained" colorVariant="primary" onClick={handleBack} sx={{ mt: 3 }}>
            Back to Transactions
          </AppButton>
        </div>
      </section>
    );
  }

  const status = String(transaction.status || "").toUpperCase();
  const isCancelled = status === "CANCELLED";
  const isCredit = transaction.direction === "CREDIT";

  const getStatusBadge = (status) => {
    const raw = String(status || "").toUpperCase();
    let bg = "bg-[#f8f9fa] text-[#495057] border-[#dee2e6]";

    if (raw === "DRAFT") bg = "bg-[#fff9db] text-[#f08c00] border-[#ffe066]";
    else if (raw === "POSTED") bg = "bg-[#ebfbee] text-[#2b8a3e] border-[#c3fae8]";
    else if (raw === "CANCELLED") bg = "bg-[#f1f3f5] text-[#868e96] border-[#e9ecef]";

    return (
      <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase border ${bg}`}>
        {raw}
      </span>
    );
  };

  return (
    <section className="min-h-[calc(100vh-58px)] bg-bg px-6 py-5">
      <div className="mx-auto w-full max-w-[1000px]">
        {/* Page Header */}
        <PageHeader
          title="Bank Transaction Details"
          subtitle={`Transaction Number: ${transaction.transactionNumber}`}
          extra={
            <AppBreadcrumb
              size="small"
              variant="text"
              items={[
                { label: "Dashboard" },
                { label: "Finance & Accounting" },
                { label: "Treasury" },
                { label: "Bank Transactions", onClick: handleBack },
                { label: transaction.transactionNumber, current: true },
              ]}
              sx={breadcrumbSx}
              itemSx={breadcrumbItemSx}
              currentItemSx={breadcrumbCurrentSx}
            />
          }
          align="flex-start"
          justify="space-between"
          sx={pageHeaderSx}
          contentSx={pageHeaderContentSx}
        />

        {/* Action toolbar */}
        <div className="mt-4 flex items-center justify-between">
          <AppButton
            type="button"
            variant="outlined"
            colorVariant="neutral"
            rounded="md"
            size="small"
            startIcon={<FiArrowLeft />}
            onClick={handleBack}
            disabled={isActioning}
            sx={actionBtnSx}
          >
            Back
          </AppButton>

          <AppStack direction="row" gap={1.5} align="center">
            <AppButton
              type="button"
              variant="outlined"
              colorVariant="neutral"
              rounded="md"
              size="small"
              startIcon={<FiRefreshCw />}
              onClick={handleRefresh}
              disabled={isActioning}
              sx={actionBtnSx}
            >
              Refresh
            </AppButton>

            {!isCancelled && (
              <AppButton
                type="button"
                variant="outlined"
                colorVariant="danger"
                rounded="md"
                size="small"
                startIcon={<FiXCircle />}
                onClick={handleCancel}
                disabled={isActioning}
                sx={actionBtnSx}
              >
                Void Transaction
              </AppButton>
            )}
          </AppStack>
        </div>

        {/* Server errors */}
        {error && (
          <div className="mt-4 p-3 bg-danger-soft text-danger text-[12.5px] font-semibold rounded-md flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={clearLocalErrors}
              className="text-danger font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Split panels details */}
        <div className="mt-5 grid grid-cols-3 gap-5">
          {/* Left panel: Primary transaction summary */}
          <div className="col-span-1">
            <AppCard variant="default" rounded="lg" bordered shadow="sm" sx={leftCardSx}>
              <div className="p-4 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-alt flex items-center justify-center border border-border shadow-xs">
                  <LuBuilding2 className="text-[22px] text-text" />
                </div>
                <AppHeading level={2} weight={700} sx={titleSx}>
                  {transaction.transactionNumber}
                </AppHeading>
                <div className="mt-2 flex items-center gap-1.5 justify-center">
                  {getStatusBadge(transaction.status)}
                  <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold bg-surface-alt border border-border text-text-muted">
                    {transaction.transactionType}
                  </span>
                </div>

                <div className="mt-6 py-4 px-2 w-full bg-surface-alt/10 border-y border-border/60">
                  <span className="text-[11px] text-text-muted uppercase tracking-wider block">Transaction Amount</span>
                  <span
                    className={`text-[23px] font-black mt-1 block ${
                      isCredit ? "text-[#2b8a3e]" : "text-[#fa5252]"
                    }`}
                  >
                    {isCredit ? "+" : "-"} {formatCurrency(transaction.amount)}
                  </span>
                </div>

                {/* Info List */}
                <div className="mt-4 w-full text-left text-[12.5px] space-y-2.5 pt-3">
                  <div>
                    <span className="text-text-muted block font-semibold">Transaction Date</span>
                    <span className="font-semibold text-text block mt-0.5">
                      {formatDateTime(resolveTxTimestamp(transaction))}
                    </span>
                  </div>

                  <div>
                    <span className="text-text-muted block font-semibold">Reference Document / UTR</span>
                    <span className="font-semibold text-text block mt-0.5 font-mono">
                      {transaction.referenceNumber || "-"}
                    </span>
                  </div>

                  {transaction.narration && (
                    <div className="pt-2">
                      <span className="text-text-muted block font-bold">Narration</span>
                      <p className="text-[11.8px] leading-relaxed text-text italic mt-0.5">
                        "{transaction.narration}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </AppCard>
          </div>

          {/* Right panel: Accounting and Audit Trail */}
          <div className="col-span-2 space-y-5">
            {/* Bookkeeping Card */}
            <AppCard variant="default" rounded="lg" bordered shadow="sm" sx={rightCardSx}>
              <div className="px-5 py-4 border-b border-border">
                <AppHeading level={3} weight={700} sx={cardTitleSx}>
                  General Ledger Bookkeeping Accounts
                </AppHeading>
              </div>

              <div className="p-5 space-y-4 text-[12.5px]">
                {/* Bank Account Details */}
                <div className="grid grid-cols-3 py-1 border-b border-border/30">
                  <span className="font-bold text-text-muted">Originating Bank Account:</span>
                  <span className="col-span-2 text-text font-bold">
                    {transaction.bankAccountId
                      ? `${transaction.bankAccountId.accountName} (No. *${String(
                          transaction.bankAccountId.accountNumber || ""
                        ).slice(-4)})`
                      : "-"}
                  </span>
                </div>

                {/* Counterparty Offset Details */}
                <div className="grid grid-cols-3 py-1 border-b border-border/30">
                  <span className="font-bold text-text-muted">Offset ledger Account:</span>
                  <span className="col-span-2 text-text font-bold">
                    {transaction.counterpartyAccountId
                      ? `${transaction.counterpartyAccountId.accountCode} — ${transaction.counterpartyAccountId.accountName}`
                      : "System Auto-resolved (Charges/Interest)"}
                  </span>
                </div>

                {/* Associated Voucher */}
                <div className="grid grid-cols-3 py-1">
                  <span className="font-bold text-text-muted">Journal Voucher Link:</span>
                  <span className="col-span-2">
                    {transaction.journalVoucherId ? (
                      <Link
                        to={`/finance/journal-vouchers/${
                          transaction.journalVoucherId._id || transaction.journalVoucherId
                        }`}
                        className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                      >
                        {transaction.journalVoucherId.voucherNumber || "View Journal Voucher"}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </span>
                </div>
              </div>
            </AppCard>

            {/* Audit Trail Card */}
            <AppCard variant="default" rounded="lg" bordered shadow="sm" sx={rightCardSx}>
              <div className="px-5 py-4 border-b border-border">
                <AppHeading level={3} weight={700} sx={cardTitleSx}>
                  Transaction Audit Trail
                </AppHeading>
              </div>

              <div className="p-5 space-y-4 text-[12.5px]">
                {/* Created By */}
                <div className="flex items-center gap-4 py-1 border-b border-border/30">
                  <FiUser className="text-text-muted" />
                  <div className="flex-1">
                    <span className="text-[11px] text-text-muted block">Created By</span>
                    <span className="font-bold text-text mt-0.5 block">
                      {transaction.createdBy?.name || "-"} ({transaction.createdBy?.email || ""})
                    </span>
                  </div>
                  <span className="text-text-muted text-[11px] shrink-0">
                    {formatDate(transaction.createdAt)}
                  </span>
                </div>

                {/* Posted By */}
                {transaction.postedAt && (
                  <div className="flex items-center gap-4 py-1 border-b border-border/30">
                    <FiCheckCircle className="text-[#2b8a3e]" />
                    <div className="flex-1">
                      <span className="text-[11px] text-text-muted block">Posted & Ledger Cleared</span>
                      <span className="font-bold text-text mt-0.5 block">
                        {transaction.postedBy?.name || "-"} ({transaction.postedBy?.email || ""})
                      </span>
                    </div>
                    <span className="text-text-muted text-[11px] shrink-0">
                      {formatDate(transaction.postedAt)}
                    </span>
                  </div>
                )}

                {/* Cancelled By & Reason */}
                {isCancelled && (
                  <div className="flex items-start gap-4 py-1.5 p-3 bg-danger-soft/10 border border-danger/15 rounded-md">
                    <FiXCircle className="text-[#fa5252] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] text-danger font-extrabold block">Void / Cancelled</span>
                      <span className="font-bold text-text mt-0.5 block">
                        {transaction.cancelledBy?.name || "-"} ({transaction.cancelledBy?.email || ""})
                      </span>
                      {transaction.cancellationReason && (
                        <p className="mt-1 text-[11.8px] leading-relaxed text-text italic">
                          Reason: "{transaction.cancellationReason}"
                        </p>
                      )}
                    </div>
                    <span className="text-text-muted text-[11px] shrink-0 mt-0.5">
                      {formatDate(transaction.cancelledAt)}
                    </span>
                  </div>
                )}
              </div>
            </AppCard>
          </div>
        </div>
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

const actionBtnSx = {
  height: 34,
  fontSize: "11.5px",
  fontWeight: 600,
};

const leftCardSx = {
  bgcolor: "var(--app-color-surface)",
  borderColor: "var(--app-color-border)",
  height: "100%",
};

const rightCardSx = {
  bgcolor: "var(--app-color-surface)",
  borderColor: "var(--app-color-border)",
};

const titleSx = {
  m: 0,
  mt: 2,
  fontSize: "16px",
  color: "var(--app-color-text)",
};

const cardTitleSx = {
  m: 0,
  fontSize: "14px",
  color: "var(--app-color-text)",
};

export default BankTransactionDetailsDesktopPage;
