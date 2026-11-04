import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiXCircle,
  FiCheckCircle,
  FiUser,
} from "react-icons/fi";
import { LuBuilding2 } from "react-icons/lu";

import {
  AppBox,
  AppCard,
  AppHeading,
  AppIconButton,
  AppStack,
  AppText,
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

const BankTransactionDetailsMobilePage = ({
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
      <section className="w-full bg-bg py-8 flex items-center justify-center">
        <AppText variant="body2" sx={{ color: "var(--app-color-text-muted)", fontWeight: 650 }}>
          Loading transaction details...
        </AppText>
      </section>
    );
  }

  if (!transaction) {
    return (
      <section className="w-full bg-bg px-4 py-8 text-center">
        <AppHeading level={2} weight={700} sx={{ fontSize: "16px", color: "var(--app-color-text)" }}>
          Transaction Not Found
        </AppHeading>
        <AppText variant="body2" sx={{ color: "var(--app-color-danger)", mt: 1 }}>
          {error || "The requested bank transaction does not exist."}
        </AppText>
        <AppIconButton
          icon={<FiArrowLeft />}
          variant="filled"
          colorVariant="primary"
          onClick={handleBack}
          sx={{ mt: 3, mx: "auto" }}
        />
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
      <span className={`inline-flex items-center rounded px-1.5 py-0.2 text-[8px] font-bold uppercase border ${bg}`}>
        {raw}
      </span>
    );
  };

  return (
    <section className="w-full bg-bg pb-20">
      <AppBox sx={containerSx}>
        {/* Mobile Page Header */}
        <AppBox sx={headerWrapperSx}>
          <AppStack direction="row" align="center" gap={1} justify="space-between">
            <AppStack direction="row" align="center" gap={1} sx={{ minWidth: 0, flex: 1 }}>
              <AppIconButton
                icon={<FiArrowLeft />}
                variant="outlined"
                colorVariant="neutral"
                size="small"
                rounded="md"
                onClick={handleBack}
                disabled={isActioning}
                sx={actionHeaderIconBtnSx}
              />
              <AppBox sx={{ minWidth: 0, flex: 1 }}>
                <AppHeading level={1} weight={700} sx={pageTitleSx}>
                  {transaction.transactionNumber}
                </AppHeading>
                <AppText variant="body2" sx={pageSubtitleSx}>
                  Bank statement transaction info
                </AppText>
              </AppBox>
            </AppStack>

            <AppIconButton
              icon={<FiRefreshCw />}
              variant="outlined"
              colorVariant="neutral"
              size="small"
              rounded="md"
              onClick={handleRefresh}
              disabled={isActioning}
              sx={actionHeaderIconBtnSx}
            />
          </AppStack>
        </AppBox>

        {/* Server errors */}
        {error && (
          <div className="mx-2 mb-3 p-3 bg-danger-soft text-danger text-[11.5px] font-semibold rounded-md flex justify-between items-center">
            <span className="flex-1">{error}</span>
            <button
              onClick={clearLocalErrors}
              className="text-danger font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content list */}
        <div className="px-2 space-y-4">
          {/* Main info card */}
          <AppCard variant="default" rounded="lg" bordered shadow="sm" sx={formCardSx}>
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-alt flex items-center justify-center text-text border border-border/40 shrink-0 shadow-xs">
                <LuBuilding2 className="text-[20px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <AppHeading level={2} weight={700} sx={{ m: 0, fontSize: "14px", color: "var(--app-color-text)" }}>
                    {transaction.transactionNumber}
                  </AppHeading>
                  {getStatusBadge(transaction.status)}
                  <span className="inline-flex items-center rounded px-1.5 py-0.2 text-[8.5px] font-semibold bg-surface-alt border border-border text-text-muted">
                    {transaction.transactionType}
                  </span>
                </div>
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  Date: {formatDateTime(resolveTxTimestamp(transaction))}
                </span>
              </div>
            </div>

            <div className="border-t border-border/65 p-4 bg-surface-alt/5 text-center">
              <span className="text-[10px] text-text-muted uppercase tracking-wider block">Transaction Amount</span>
              <span
                className={`text-[22px] font-black mt-1 block ${
                  isCredit ? "text-[#2b8a3e]" : "text-[#fa5252]"
                }`}
              >
                {isCredit ? "+" : "-"} {formatCurrency(transaction.amount)}
              </span>
            </div>
          </AppCard>

          {/* Bookkeeping Card */}
          <AppCard variant="default" rounded="lg" bordered shadow="sm" sx={formCardSx}>
            <div className="p-3.5 border-b border-border">
              <span className="text-[11.5px] font-bold text-text">Bookkeeping Allocation</span>
            </div>

            <div className="p-3.5 space-y-3 text-[12px] leading-relaxed">
              <div className="flex justify-between border-b border-border/30 pb-2">
                <span className="text-text-muted">Bank Account:</span>
                <span className="font-bold text-text">
                  {transaction.bankAccountId
                    ? `${transaction.bankAccountId.accountName} (*${String(
                        transaction.bankAccountId.accountNumber || ""
                      ).slice(-4)})`
                    : "-"}
                </span>
              </div>

              <div className="flex justify-between border-b border-border/30 pb-2">
                <span className="text-text-muted">Offset Account:</span>
                <span className="font-bold text-text">
                  {transaction.counterpartyAccountId
                    ? `${transaction.counterpartyAccountId.accountCode} - ${transaction.counterpartyAccountId.accountName}`
                    : "System Auto-resolved"}
                </span>
              </div>

              {transaction.journalVoucherId && (
                <div className="flex justify-between pt-1">
                  <span className="text-text-muted">Journal Voucher:</span>
                  <Link
                    to={`/finance/journal-vouchers/${
                      transaction.journalVoucherId._id || transaction.journalVoucherId
                    }`}
                    className="text-primary font-bold hover:underline"
                  >
                    {transaction.journalVoucherId.voucherNumber || "View Postings"}
                  </Link>
                </div>
              )}
            </div>
          </AppCard>

          {/* Audit trail card */}
          <AppCard variant="default" rounded="lg" bordered shadow="sm" sx={formCardSx}>
            <div className="p-3.5 border-b border-border">
              <span className="text-[11.5px] font-bold text-text">Audit Trail</span>
            </div>

            <div className="p-3.5 space-y-4 text-[11.5px] leading-relaxed">
              {/* Created */}
              <div className="flex items-start gap-3">
                <FiUser className="text-text-muted mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-text-muted font-semibold block">Created By</span>
                  <span className="font-bold text-text block">
                    {transaction.createdBy?.name || "-"}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    {formatDate(transaction.createdAt)}
                  </span>
                </div>
              </div>

              {/* Posted */}
              {transaction.postedAt && (
                <div className="flex items-start gap-3 pt-2 border-t border-border/30">
                  <FiCheckCircle className="text-[#2b8a3e] mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-text-muted font-semibold block">Posted & Ledger Cleared</span>
                    <span className="font-bold text-text block">
                      {transaction.postedBy?.name || "-"}
                    </span>
                    <span className="text-[10px] text-text-muted block mt-0.5">
                      {formatDate(transaction.postedAt)}
                    </span>
                  </div>
                </div>
              )}

              {/* Cancelled */}
              {isCancelled && (
                <div className="flex items-start gap-3 pt-3 p-2.5 bg-danger-soft/10 border border-danger/15 rounded-md">
                  <FiXCircle className="text-[#fa5252] mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-danger font-extrabold block">Void / Cancelled</span>
                    <span className="font-bold text-text block">
                      {transaction.cancelledBy?.name || "-"}
                    </span>
                    {transaction.cancellationReason && (
                      <p className="mt-1 text-[11px] text-text italic">
                        Reason: "{transaction.cancellationReason}"
                      </p>
                    )}
                    <span className="text-[10px] text-text-muted block mt-0.5">
                      {formatDate(transaction.cancelledAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </AppCard>
        </div>

        {/* mobile actions fixed bottom bar */}
        {!isCancelled && (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border p-3 flex gap-2.5 shadow-lg max-w-[460px] mx-auto w-full">
            <button
              type="button"
              disabled={isActioning}
              onClick={handleCancel}
              className="flex-1 py-2 text-[12px] font-bold bg-danger text-surface rounded-md hover:bg-danger/90 transition flex items-center justify-center gap-1.5"
            >
              <FiXCircle />
              <span>Void Transaction</span>
            </button>
          </div>
        )}
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
  px: 0.5,
  pt: 0,
  pb: 0,
};

const headerWrapperSx = {
  pt: 1.5,
  pb: 1,
  px: 0.5,
};

const pageTitleSx = {
  m: 0,
  fontSize: "17.5px",
  lineHeight: 1.15,
  letterSpacing: "-0.3px",
  color: "var(--app-color-text)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 160,
};

const pageSubtitleSx = {
  mt: 0.2,
  fontSize: "11px",
  lineHeight: "15px",
  color: "var(--app-color-text-muted)",
};

const actionHeaderIconBtnSx = {
  height: 32,
  width: 32,
  minWidth: 32,
  borderColor: "var(--app-color-border)",
};

const formCardSx = {
  bgcolor: "var(--app-color-surface)",
  borderColor: "var(--app-color-border)",
  overflow: "hidden",
};

const cardTitleSx = {
  m: 0,
  fontSize: "12px",
  color: "var(--app-color-text)",
};

const inputSx = {
  minHeight: 35,
  fontSize: "12.0px",
  bgcolor: "var(--app-color-surface)",
};

export default BankTransactionDetailsMobilePage;
