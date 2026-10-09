import { createBrowserRouter } from "react-router-dom";

import { ROUTES } from "@/constants";

import {
  PublicLayout,
  AuthLayout,
  AppLayout,
} from "@/layouts";

import {
  GuestRoute,
  ProtectedRoute,
  WorkspaceRequiredRoute,
  PermissionGuard,
  SetupCenterGuard,
  CompanyRequiredGuard,
  ActiveCompanyGuard,
  ActiveBranchGuard,
} from "@/guards";

import authRoutes from "@/features/auth/routes/authRoutes";
import userRoutes from "@/features/user/routes/userRoutes";

import { AcceptInvitationPage } from "@/features/workspace/pages";
import workspaceRoutes from "@/features/workspace/routes/workspaceRoutes";
import setupRoutes from "@/features/setup/routes/setupRoutes";
import dashboardRoutes from "@/features/dashboard/routes/dashboardRoutes";

import { createCompanyRoutes, existingCompanyRoutes } from "@/features/company/routes/companyRoutes";
import branchRoutes from "@/features/branch/routes/branchRoutes";
import accessControlRoutes from "@/features/access-control/routes/accessControlRoutes";
import catalogRoutes from "@/features/catalog/routes/catalogRoutes";
import subscriptionRoutes from "@/features/subscription/routes/subscriptionRoutes";

import globalProductRoutes from "@/features/global-products/routes/globalProductRoutes";
import workspaceProductRoutes from "@/features/workspace-products/routes/workspaceProductRoutes";
import settingsRoutes from "@/features/settings/routes/settingsRoutes";

import HomePage from "@/pages/HomePage";
import UIShowcasePage from "@/pages/UIShowcasePage";

import { LandingPage } from "@/features/landing";
import TransferOrdersPage from "@/pages/inventory/TransferOrdersPage";
import CreateTransferOrderPage from "@/pages/inventory/CreateTransferOrderPage";
import hsnMasterRoutes from "@/features/hsn-master/routes/hsnMasterRoutes";
import manufacturerMasterRoutes from "@/features/manufacturer-master/routes/manufacturerMasterRoutes";
import uomMasterRoutes from "@/features/uom-master/routes/uomMasterRoutes";
import categoryMasterRoutes from "@/features/category-master/routes/categoryMasterRoutes";
import productFormMasterRoutes from "@/features/product-form-master/routes/productFormMasterRoutes";
import saltMasterRoutes from "@/features/salt-master/routes/saltMasterRoutes";
import bankMasterRoutes from "@/features/bank-master/routes/bankMasterRoutes";
import marketplaceStoreRoutes from "@/features/marketplace/stores/routes/marketplaceStoreRoutes";
import marketplaceProductRoutes from "@/features/marketplace/products/routes/marketplaceProductRoutes";
import customerRoutes from "@/features/parties/customers/routes/customerRoutes";
import supplierRoutes from "@/features/parties/suppliers/routes/supplierRoutes";
import financeRoutes from "@/features/finance/routes/financeRoutes";
import journalVoucherRoutes from "@/features/finance/journal-vouchers/routes/journalVoucherRoutes";
import accountGroupRoutes from "@/features/finance/chart-of-accounts/account-groups/routes/accountGroupRoutes";
import accountRoutes from "@/features/finance/chart-of-accounts/accounts/routes/accountRoutes";
import accountBalanceRoutes from "@/features/finance/account-balances/routes/accountBalanceRoutes";
import treasuryRoutes from "@/features/finance/treasury/routes/treasuryRoutes";
import fundTransferRoutes from "@/features/finance/treasury/fund-transfers/routes/fundTransferRoutes";
import cashExchangeRoutes from "@/features/finance/treasury/cash-management/exchange-cash/routes/cashExchangeRoutes";
import chequeRoutes from "@/features/finance/treasury/cheque-management/routes/chequeRoutes";
import bankDepositSlipRoutes from "@/features/finance/treasury/bank-deposit-slips/routes/bankDepositSlipRoutes";
import bankAccountRoutes from "@/features/finance/treasury/bank-management/bank-accounts/routes/bankAccountRoutes";
import branchCashRoutes from "@/features/finance/treasury/cash-management/branch-cash/routes/branchCashRoutes";

import paymentQrRoutes from "@/features/finance/treasury/payment-qr/routes/paymentQrRoutes";
import bankTransactionRoutes from "@/features/finance/treasury/bank-management/bank-transactions/routes/bankTransactionRoutes";
import cashTransactionRoutes from "@/features/finance/treasury/cash-management/cash-transactions/routes/cashTransactionRoutes";
import cashDenominationRoutes from "@/features/finance/treasury/cash-management/cash-denominations/routes/cashDenominationRoutes";
import financialPeriodRoutes from "@/features/finance/financial-periods/routes/financialPeriodRoutes";
import ledgerRoutes from "@/features/finance/ledger/routes/ledgerRoutes";
import gstLedgerRoutes from "@/features/finance/gst-ledger/routes/gstLedgerRoutes";
import reportsRoutes from "@/features/finance/reports/routes/reportsRoutes";

import salesRoutes from "@/features/sales/routes/salesRoutes";
import billingRoutes from "@/features/billing/routes/billingRoutes";
import purchasesRoutes from "@/features/purchases/routes/purchasesRoutes";
import helpCenterRoutes from "@/features/help-center/routes/helpCenterRoutes";
import operationsRoutes from "@/features/operations/routes/operationsRoutes";

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="mt-3 text-lg font-medium text-text">Page Not Found</p>
        <p className="mt-2 text-sm text-text-muted">
          The page you are looking for does not exist.
        </p>
      </div>
    </div>
  );
};

/**
 * Guards a list of routes with action-level granularity:
 * - If route path contains /create, /invite, /import, or /new -> `${domain}:create`
 * - If route path contains /edit, /settings, or /assign -> `${domain}:update`
 * - Otherwise -> `${domain}:view`
 */
const guardRouteList = (routeList, baseDomain, overrides = {}) => {
  return routeList.map((route) => {
    if (overrides[route.path]) {
      const perm = overrides[route.path];
      return {
        ...route,
        element: Array.isArray(perm) ? (
          <PermissionGuard permissions={perm}>{route.element}</PermissionGuard>
        ) : (
          <PermissionGuard permission={perm}>{route.element}</PermissionGuard>
        ),
      };
    }

    const pathStr = String(route.path || "").toLowerCase();
    let action = "view";

    if (
      pathStr.includes("/create") ||
      pathStr.includes("/invite") ||
      pathStr.includes("/import") ||
      pathStr.includes("/new")
    ) {
      action = "create";
    } else if (
      pathStr.includes("/edit") ||
      pathStr.includes("/settings") ||
      pathStr.includes("/assign")
    ) {
      action = "update";
    }

    const permissionKey = `${baseDomain}:${action}`;

    return {
      ...route,
      element: (
        <PermissionGuard permission={permissionKey}>
          {route.element}
        </PermissionGuard>
      ),
    };
  });
};

export const router = createBrowserRouter([
  // Public
  {
    element: (
      <GuestRoute>
        <PublicLayout />
      </GuestRoute>
    ),
    children: [
      {
        path: ROUTES.HOME,
        element: <LandingPage />,
      },
      {
        path: "/features",
        element: <HomePage />,
      },
      {
        path: "/pricing",
        element: <HomePage />,
      },
      {
        path: "/blog",
        element: <HomePage />,
      },
      {
        path: "/contact",
        element: <HomePage />,
      },
      {
        path: "/about",
        element: <HomePage />,
      },
      {
        path: "/privacy-policy",
        element: <HomePage />,
      },
      {
        path: "/terms-of-service",
        element: <HomePage />,
      },
      {
        path: "/ui-showcase",
        element: <UIShowcasePage />,
      },
      {
        path: "/ui-components",
        element: <UIShowcasePage />,
      },
    ],
  },

  // Auth
  {
    element: (
      <GuestRoute>
        <AuthLayout />
      </GuestRoute>
    ),
    children: authRoutes,
  },

  // Public/Hybrid Workspace Invitation Acceptance
  {
    path: ROUTES.ACCEPT_WORKSPACE_INVITATION,
    element: <AcceptInvitationPage />,
  },

  // Protected ERP Application & Setup Onboarding
  {
    element: (
      <ProtectedRoute>
        <WorkspaceRequiredRoute>
          <AppLayout />
        </WorkspaceRequiredRoute>
      </ProtectedRoute>
    ),
    children: [
      // ── Step 1 & Core Essentials (Always accessible once workspace exists) ──
      ...setupRoutes,
      ...userRoutes,
      ...settingsRoutes,
      ...helpCenterRoutes,
      ...guardRouteList(createCompanyRoutes, "company"),

      // ── Guarded by CompanyRequiredGuard (Requires Step 1 Company to be created) ──
      {
        element: <CompanyRequiredGuard />,
        children: [
          ...guardRouteList(existingCompanyRoutes, "company"),
          ...guardRouteList(branchRoutes, "branch"),
        ],
      },

      // ── Guarded Operational Application (Requires 100% Setup Complete) ──
      {
        element: <SetupCenterGuard />,
        children: [
          ...dashboardRoutes,

          // Organization & Members
          ...guardRouteList(workspaceRoutes, "workspace", {
            [ROUTES.WORKSPACE_MEMBERS]: "workspace-member:view",
            "/members/:memberId": "workspace-member:view",
            [ROUTES.WORKSPACE_INVITATIONS]: "workspace-member:view",
            [ROUTES.INVITE_WORKSPACE_MEMBER]: "workspace-member:create",
          }),

          // Roles & Permissions
          ...guardRouteList(accessControlRoutes, "role"),

          // Subscriptions
          ...subscriptionRoutes.map((route) => ({
            ...route,
            element: (
              <PermissionGuard permission="subscription:view">
                {route.element}
              </PermissionGuard>
            ),
          })),

          // ── Guarded by ActiveCompanyGuard (Requires active company selection) ──
          {
            element: <ActiveCompanyGuard />,
            children: [
              // Parties
          ...guardRouteList(customerRoutes, "customer"),
          ...guardRouteList(supplierRoutes, "supplier"),

              // Finance & Chart of Accounts
          ...financeRoutes.map((route) => ({
            ...route,
            element: (
              <PermissionGuard
                permissions={[
                  "account:view",
                  "journal-voucher:view",
                  "ledger:view",
                  "report:view",
                ]}
              >
                {route.element}
              </PermissionGuard>
            ),
          })),
          ...guardRouteList(accountRoutes, "account"),
          ...guardRouteList(accountGroupRoutes, "account-group"),
          ...accountBalanceRoutes.map((route) => ({
            ...route,
            element: (
              <PermissionGuard permission="account-balance:view">
                {route.element}
              </PermissionGuard>
            ),
          })),
          ...guardRouteList(financialPeriodRoutes, "financial-period"),
          ...guardRouteList(journalVoucherRoutes, "journal-voucher"),
          ...ledgerRoutes.map((route) => ({
            ...route,
            element: (
              <PermissionGuard permission="ledger:view">
                {route.element}
              </PermissionGuard>
            ),
          })),
          ...gstLedgerRoutes.map((route) => ({
            ...route,
            element: (
              <PermissionGuard permission="ledger:view">
                {route.element}
              </PermissionGuard>
            ),
          })),
          ...reportsRoutes.map((route) => ({
            ...route,
            element: (
              <PermissionGuard permission="report:view">
                {route.element}
              </PermissionGuard>
            ),
          })),

              // ── Guarded by ActiveBranchGuard (Requires active branch selection) ──
              {
                element: <ActiveBranchGuard />,
                children: [
                  // Treasury
          ...treasuryRoutes.map((route) => ({
            ...route,
            element: (
              <PermissionGuard
                permissions={[
                  "bank-account:view",
                  "branch-cash:view",
                  "fund-transfer:view",
                  "cheque:view",
                  "payment-qr:view",
                  "cash-denomination:view",
                  "bank-deposit-slip:view",
                ]}
              >
                {route.element}
              </PermissionGuard>
            ),
          })),
          ...guardRouteList(bankAccountRoutes, "bank-account"),
          ...guardRouteList(branchCashRoutes, "cash-account"),

          ...guardRouteList(fundTransferRoutes, "fund-transfer"),
          ...guardRouteList(cashExchangeRoutes, "cash-exchange"),
          ...guardRouteList(chequeRoutes, "cheque"),
          ...guardRouteList(bankDepositSlipRoutes, "bank-deposit-slip"),
          ...guardRouteList(paymentQrRoutes, "payment-qr"),
          ...bankTransactionRoutes.map((route) => ({
            ...route,
            element: (
              <PermissionGuard permission="bank-transaction:view">
                {route.element}
              </PermissionGuard>
            ),
          })),
          ...cashTransactionRoutes.map((route) => ({
            ...route,
            element: (
              <PermissionGuard permission="cash-transaction:view">
                {route.element}
              </PermissionGuard>
            ),
          })),
                  ...guardRouteList(cashDenominationRoutes, "cash-denomination"),
                ],
              },

              // Inventory & Catalog
          {
            path: "/inventory/transfer-orders",
            element: <TransferOrdersPage />,
          },
          {
            path: "/inventory/transfer-orders/create",
            element: <CreateTransferOrderPage />,
          },
          ...catalogRoutes.map((route) => ({
            ...route,
            element: (
              <PermissionGuard
                permissions={[
                  "product:view",
                  "global-product:view",
                  "category:view",
                  "hsn:view",
                  "manufacturer:view",
                  "salt:view",
                  "uom:view",
                  "product-form:view",
                  "bank-master:view",
                ]}
              >
                {route.element}
              </PermissionGuard>
            ),
          })),
          ...guardRouteList(workspaceProductRoutes, "product"),
          ...globalProductRoutes.map((route) => ({
            ...route,
            element: (
              <PermissionGuard permission="global-product:view">
                {route.element}
              </PermissionGuard>
            ),
          })),
          ...guardRouteList(hsnMasterRoutes, "hsn"),
          ...guardRouteList(manufacturerMasterRoutes, "manufacturer"),
          ...guardRouteList(uomMasterRoutes, "uom"),
          ...guardRouteList(categoryMasterRoutes, "category"),
          ...guardRouteList(productFormMasterRoutes, "product-form"),
          ...guardRouteList(saltMasterRoutes, "salt"),
          ...guardRouteList(bankMasterRoutes, "bank-master"),

              // Marketplace
              ...guardRouteList(marketplaceStoreRoutes, "marketplace-store"),
              ...guardRouteList(marketplaceProductRoutes, "marketplace-product"),

              {
                element: <ActiveBranchGuard />,
                children: [
                  // Sales & POS, Invoicing & Purchases
                  ...guardRouteList(salesRoutes, "pos"),
                  ...guardRouteList(billingRoutes, "bill"),
                  ...guardRouteList(purchasesRoutes, "purchase"),

                  // Shifts & Closings
                  ...operationsRoutes,
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // 404
  {
    path: ROUTES.NOT_FOUND,
    element: <NotFoundPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
