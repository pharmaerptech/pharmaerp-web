import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/constants";
import { useIsMobile, usePermission } from "@/hooks";

import TreasuryDesktopPage from "./desktop/TreasuryDesktopPage";
import TreasuryMobilePage from "./mobile/TreasuryMobilePage";

const TreasuryPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);

  // Statistics/metric cards data
  const stats = useMemo(() => {
    return [
      {
        id: "totalBankBalance",
        title: "Total Bank Balance",
        value: "₹ 25,48,230.00",
        description: "Across 8 Bank Accounts",
        colorVariant: "success",
      },
      {
        id: "totalCashBalance",
        title: "Total Cash Balance",
        value: "₹ 4,35,120.00",
        description: "Branch Cash (Running & Frozen)",
        colorVariant: "warning",
      },
      {
        id: "totalFundsInTransit",
        title: "Total Funds in Transit",
        value: "₹ 1,25,000.00",
        description: "In Transit / Pending",
        colorVariant: "purple",
      },
      {
        id: "todaysTransactions",
        title: "Today's Transactions",
        value: "28",
        description: "Bank: 16  Cash: 12",
        colorVariant: "info",
      },
      {
        id: "unreconciledItems",
        title: "Unreconciled Items",
        value: "15",
        description: "Bank: 9  Cash: 6",
        colorVariant: "danger",
      },
    ];
  }, []);

  // Treasury processing flow steps
  const processingFlow = useMemo(() => {
    return [
      {
        id: "moneyMovement",
        title: "Money Movement",
        description: "Cash / Bank / UPI / Cheque",
        colorVariant: "success",
      },
      {
        id: "treasuryTransaction",
        title: "Treasury Transaction",
        description: "Record in Treasury",
        colorVariant: "purple",
      },
      {
        id: "journalVoucher",
        title: "Journal Voucher",
        description: "Auto / Manual Journal",
        colorVariant: "info",
      },
      {
        id: "ledgerImpact",
        title: "Ledger Impact",
        description: "Update Ledger",
        colorVariant: "warning",
      },
      {
        id: "accountBalance",
        title: "Account Balance",
        description: "Reflect in Accounts",
        colorVariant: "success",
      },
    ];
  }, []);

  // Treasury modules with permission mappings
  const modules = useMemo(() => {
    const rawModules = [
      {
        id: "bankAccounts",
        title: "Bank Accounts",
        description: "Manage bank accounts, deposits and withdrawals",
        colorVariant: "success",
        path: "/finance/treasury/bank-accounts",
        permission: "bank-account:view",
      },
      {
        id: "branchCash",
        title: "Branch Cash",
        description: "Manage running cash and frozen reserve for this branch",
        colorVariant: "warning",
        path: ROUTES.BRANCH_CASH,
        permission: "cash-account:view", // reusing old permission for now
      },
      {
        id: "fundTransfers",
        title: "Fund Transfers",
        description: "Transfer funds between bank accounts and cash accounts",
        colorVariant: "purple",
        path: "/finance/treasury/fund-transfers",
        permission: "fund-transfer:view",
      },
      {
        id: "bankTransactions",
        title: "Bank Transactions",
        description: "Record and manage all bank transactions",
        colorVariant: "info",
        path: "/finance/treasury/bank-transactions",
        permission: "bank-transaction:view",
      },
      {
        id: "cashTransactions",
        title: "Cash Transactions",
        description: "Record and manage all cash transactions",
        colorVariant: "warning",
        path: "/finance/treasury/cash-transactions",
        permission: "cash-transaction:view",
      },
      {
        id: "chequeManagement",
        title: "Cheque Management",
        description: "Manage cheques, issues, deposits and clearances",
        colorVariant: "info",
        path: "/finance/treasury/cheque-management",
        permission: "cheque:view",
      },
      {
        id: "bankDepositSlips",
        title: "Bank Deposit Slips",
        description: "Manage bank deposit slips and confirm cash deposits",
        colorVariant: "success",
        path: ROUTES.BANK_DEPOSIT_SLIPS,
        permission: "bank-deposit-slip:view",
      },
      {
        id: "cashInTransit",
        title: "Cash In Transit",
        description: "Company-wide view of cash in transit to bank",
        colorVariant: "primary",
        path: ROUTES.CASH_IN_TRANSIT,
        permission: "bank-deposit-slip:view",
      },
      {
        id: "paymentQrUpi",
        title: "Payment QR / UPI",
        description: "Manage UPI QR codes and digital payments",
        colorVariant: "success",
        path: "/finance/treasury/payment-qrs",
        permission: "payment-qr:view",
      },
      {
        id: "cashDenominations",
        title: "Cash Denominations",
        description: "Manage cash denominations and cash counting",
        colorVariant: "purple",
        path: "/finance/treasury/cash-denominations",
        permission: "cash-denomination:view",
      },
      {
        id: "cashExchanges",
        title: "Cash Exchanges",
        description: "Exchange cash denominations (khulli paisa) with customers",
        colorVariant: "warning",
        path: ROUTES.CASH_EXCHANGES,
        permission: "cash-exchange:view",
      },
    ];

    return rawModules.filter((m) => !m.permission || can(m.permission));
  }, [can]);

  // Recent transactions list
  const recentTransactions = useMemo(() => {
    return [
      {
        id: "tx1",
        account: "HDFC Bank A/C",
        description: "NEFT Received from ABC Pharma",
        amount: "₹ 1,25,000.00",
        time: "10:30 AM",
        type: "received",
        colorVariant: "success",
      },
      {
        id: "tx2",
        account: "Cash Account - Main",
        description: "Cash Deposit",
        amount: "₹ 45,000.00",
        time: "09:45 AM",
        type: "deposit",
        colorVariant: "warning",
      },
      {
        id: "tx3",
        account: "ICICI Bank A/C",
        description: "Cheque Deposit - #456789",
        amount: "₹ 75,000.00",
        time: "Yesterday, 05:15 PM",
        type: "pending",
        colorVariant: "info",
      },
    ];
  }, []);

  // Quick actions list with target routes and permissions
  const quickActions = useMemo(() => {
    const rawActions = [
      {
        id: "addBankAccount",
        title: "Add Bank Account",
        path: ROUTES.BANK_ACCOUNTS,
        colorVariant: "success",
        permission: "bank-account:create",
      },
      {
        id: "viewBranchCash",
        title: "View Branch Cash",
        path: ROUTES.BRANCH_CASH,
        colorVariant: "warning",
        permission: "cash-account:view",
      },
      {
        id: "recordBankTransaction",
        title: "Record Bank Transaction",
        path: "/finance/treasury/bank-transactions/create",
        colorVariant: "info",
        permission: "bank-transaction:create",
      },
      {
        id: "recordCashTransaction",
        title: "Record Cash Transaction",
        path: "/finance/treasury/cash-transactions/create",
        colorVariant: "warning",
        permission: "cash-transaction:create",
      },
      {
        id: "fundTransfer",
        title: "Fund Transfer",
        path: "/finance/treasury/fund-transfers/create",
        colorVariant: "purple",
        permission: "fund-transfer:create",
      },
      {
        id: "manageCheques",
        title: "Manage Cheques",
        path: "/finance/treasury/cheque-management",
        colorVariant: "info",
        permission: "cheque:view",
      },
      {
        id: "createBankDepositSlip",
        title: "Create Deposit Slip",
        path: ROUTES.CREATE_BANK_DEPOSIT_SLIP,
        colorVariant: "success",
        permission: "bank-deposit-slip:create",
      },
      {
        id: "cashDenominations",
        title: "Cash Denominations",
        path: "/finance/treasury/cash-denominations",
        colorVariant: "purple",
        permission: "cash-denomination:view",
      },
    ];

    return rawActions.filter((a) => !a.permission || can(a.permission));
  }, [can]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);

  const handleModuleClick = useCallback(
    (item) => {
      if (item.path) {
        navigate(item.path);
      }
    },
    [navigate],
  );

  const handleQuickActionClick = useCallback(
    (action) => {
      if (action.path) {
        navigate(action.path);
      }
    },
    [navigate],
  );

  const pageProps = {
    stats,
    processingFlow,
    modules,
    recentTransactions,
    quickActions,
    isLoading,
    handleRefresh,
    handleModuleClick,
    handleQuickActionClick,
  };

  return isMobile ? (
    <TreasuryMobilePage {...pageProps} />
  ) : (
    <TreasuryDesktopPage {...pageProps} />
  );
};

export default TreasuryPage;
