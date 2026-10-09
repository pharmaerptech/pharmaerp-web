import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/constants";
import { useIsMobile } from "@/hooks";

import FinanceDesktopPage from "./desktop/FinanceDesktopPage";
import FinanceMobilePage from "./mobile/FinanceMobilePage";

const FinancePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);

  // Mock data representing financial metrics
  const financeStats = useMemo(() => {
    return [
      {
        id: "totalAccounts",
        title: "Total Accounts",
        value: "1,248",
        description: "Chart of Accounts",
        colorVariant: "success",
      },
      {
        id: "totalBalance",
        title: "Total Balance",
        value: "₹ 12,45,680.00",
        description: "Total Balance",
        colorVariant: "purple",
      },
      {
        id: "currentPeriod",
        title: "Current Period",
        value: "May 2024 - 25",
        description: "01 May 2024 - 31 Mar 2025",
        colorVariant: "warning",
      },
      {
        id: "totalTransactions",
        title: "Total Transactions",
        value: "3,245",
        description: "This Financial Year",
        colorVariant: "success",
      },
    ];
  }, []);

  // List of active modules within Finance & Accounting
  const financeModules = useMemo(() => {
    return [
      {
        id: "accounts",
        title: "Accounts",
        description: "General ledger accounts and classification",
        colorVariant: "success",
        path: ROUTES.ACCOUNTS,
      },
      {
        id: "accountGroups",
        title: "Account Groups",
        description: "Group hierarchy and account classification",
        colorVariant: "info",
        path: ROUTES.ACCOUNT_GROUPS,
      },
      {
        id: "financialPeriods",
        title: "Financial Periods",
        description: "Define and manage your financial periods",
        colorVariant: "warning",
        path: "/finance/financial-periods",
      },
      {
        id: "journalVouchers",
        title: "Journal Vouchers",
        description: "Record general journal entries and adjustments",
        colorVariant: "info",
        path: "/finance/journal-vouchers",
      },
      {
        id: "receipts",
        title: "Receipts",
        description: "Record and manage receipt transactions",
        colorVariant: "success",
        path: "/finance/receipts",
      },
      {
        id: "payments",
        title: "Payments",
        description: "Record and manage payment transactions",
        colorVariant: "danger",
        path: "/finance/payments",
      },
      {
        id: "treasury",
        title: "Treasury",
        description: "Manage your banks, cash and payment methods",
        colorVariant: "success", // teal-green style
        path: "/finance/treasury",
      },
      {
        id: "ledger",
        title: "General Ledger",
        description: "View account statement balances and posting ledgers",
        colorVariant: "primary",
        path: ROUTES.LEDGER,
      },
      {
        id: "accountBalances",
        title: "Account Balances",
        description: "View and recalculate chart of account balances",
        colorVariant: "success",
        path: ROUTES.ACCOUNT_BALANCES,
      },
      {
        id: "reports",
        title: "Reports",
        description: "View financial reports and statements",
        colorVariant: "warning",
        path: "/finance/reports",
      },
    ];
  }, []);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);

  const handleModuleClick = useCallback(
    (module) => {
      if (module.path) {
        navigate(module.path);
      }
    },
    [navigate],
  );

  const pageProps = {
    stats: financeStats,
    modules: financeModules,
    isLoading,
    handleRefresh,
    handleModuleClick,
  };

  return isMobile ? (
    <FinanceMobilePage {...pageProps} />
  ) : (
    <FinanceDesktopPage {...pageProps} />
  );
};

export default FinancePage;
