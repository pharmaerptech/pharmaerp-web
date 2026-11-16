// src/features/company/pages/CompanyOperationsStarterPage.jsx

import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useIsMobile } from "@/hooks";
import useCompany from "../hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import customerService from "@/features/parties/customers/services/customerService";
import supplierService from "@/features/parties/suppliers/services/supplierService";
import bankAccountService from "@/features/finance/treasury/bank-management/bank-accounts/services/bankAccountService";
import CustomerDialog from "@/features/parties/customers/components/CustomerDialog";
import SupplierDialog from "@/features/parties/suppliers/components/SupplierDialog";

import CompanyOperationsStarterDesktopPage from "./desktop/CompanyOperationsStarterDesktopPage";
import CompanyOperationsStarterMobilePage from "./mobile/CompanyOperationsStarterMobilePage";

const extractTotal = (res) => {
  const d = res.data?.data || res.data || {};
  if (typeof d.meta?.total === "number") return d.meta.total;
  if (typeof d.total === "number") return d.total;
  if (Array.isArray(d)) return d.length;
  if (Array.isArray(d.data)) return d.data.length;
  if (Array.isArray(d.customers)) return d.customers.length;
  if (Array.isArray(d.suppliers)) return d.suppliers.length;
  if (Array.isArray(d.bankAccounts)) return d.bankAccounts.length;
  return 0;
};

export const CompanyOperationsStarterPage = () => {
  const isMobile = useIsMobile();
  const { currentCompany } = useCompany();
  const {
    branches,
    getCompanyBranches,
    getCompanyBranchesStatus,
  } = useBranch();

  const companyId = currentCompany?._id || currentCompany?.id;

  const [realStats, setRealStats] = useState({
    customersCount: 0,
    suppliersCount: 0,
    bankAccountsCount: 0,
    isLoaded: false,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Modal dialog states
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Fallback to Redux state if available
  const reduxCustomersCount = useSelector(
    (state) => state.customer?.total || state.customer?.customers?.length || 0
  );
  const reduxSuppliersCount = useSelector(
    (state) => state.supplier?.total || state.supplier?.suppliers?.length || 0
  );
  const reduxBankAccountsCount = useSelector(
    (state) => state.bankAccount?.total || state.bankAccount?.bankAccounts?.length || 0
  );

  const fetchRealCompanyStats = useCallback(async (cId) => {
    if (!cId) return;
    try {
      const [custRes, suppRes, bankRes] = await Promise.allSettled([
        customerService.getCustomers({ limit: 1 }),
        supplierService.getSuppliers({ limit: 1 }),
        bankAccountService.getBankAccounts({ limit: 1 }),
      ]);

      setRealStats({
        customersCount: custRes.status === "fulfilled" ? extractTotal(custRes.value) : reduxCustomersCount,
        suppliersCount: suppRes.status === "fulfilled" ? extractTotal(suppRes.value) : reduxSuppliersCount,
        bankAccountsCount: bankRes.status === "fulfilled" ? extractTotal(bankRes.value) : reduxBankAccountsCount,
        isLoaded: true,
      });
    } catch {
      setRealStats({
        customersCount: reduxCustomersCount,
        suppliersCount: reduxSuppliersCount,
        bankAccountsCount: reduxBankAccountsCount,
        isLoaded: true,
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, [reduxCustomersCount, reduxSuppliersCount, reduxBankAccountsCount]);

  useEffect(() => {
    let isSubscribed = true;
    if (companyId) {
      if (typeof getCompanyBranches === "function") {
        getCompanyBranches(companyId).catch(() => null);
      }
      Promise.allSettled([
        customerService.getCustomers({ limit: 1 }),
        supplierService.getSuppliers({ limit: 1 }),
        bankAccountService.getBankAccounts({ limit: 1 }),
      ]).then(([custRes, suppRes, bankRes]) => {
        if (!isSubscribed) return;
        setRealStats({
          customersCount: custRes.status === "fulfilled" ? extractTotal(custRes.value) : reduxCustomersCount,
          suppliersCount: suppRes.status === "fulfilled" ? extractTotal(suppRes.value) : reduxSuppliersCount,
          bankAccountsCount: bankRes.status === "fulfilled" ? extractTotal(bankRes.value) : reduxBankAccountsCount,
          isLoaded: true,
        });
      }).catch(() => {
        if (!isSubscribed) return;
        setRealStats({
          customersCount: reduxCustomersCount,
          suppliersCount: reduxSuppliersCount,
          bankAccountsCount: reduxBankAccountsCount,
          isLoaded: true,
        });
      });
    }
    return () => {
      isSubscribed = false;
    };
  }, [companyId, getCompanyBranches, reduxCustomersCount, reduxSuppliersCount, reduxBankAccountsCount]);

  const handleRefresh = useCallback(() => {
    if (companyId) {
      setIsLoadingStats(true);
      if (typeof getCompanyBranches === "function") {
        getCompanyBranches(companyId).catch(() => null);
      }
      fetchRealCompanyStats(companyId);
    }
  }, [companyId, getCompanyBranches, fetchRealCompanyStats]);

  const pageProps = {
    company: currentCompany,
    branches: branches || [],
    customersCount: realStats.isLoaded ? realStats.customersCount : reduxCustomersCount,
    suppliersCount: realStats.isLoaded ? realStats.suppliersCount : reduxSuppliersCount,
    bankAccountsCount: realStats.isLoaded ? realStats.bankAccountsCount : reduxBankAccountsCount,
    isLoading: getCompanyBranchesStatus === "loading" || isLoadingStats,
    onRefresh: handleRefresh,
    onOpenCustomerModal: () => setIsCustomerModalOpen(true),
    onOpenSupplierModal: () => setIsSupplierModalOpen(true),
  };

  return (
    <>
      {isMobile ? (
        <CompanyOperationsStarterMobilePage {...pageProps} />
      ) : (
        <CompanyOperationsStarterDesktopPage {...pageProps} />
      )}

      <CustomerDialog
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        mode="create"
        customerData={null}
        onSuccess={() => {
          handleRefresh();
        }}
      />

      <SupplierDialog
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        mode="create"
        supplierData={null}
        onSuccess={() => {
          handleRefresh();
        }}
      />
    </>
  );
};

export default CompanyOperationsStarterPage;
