import { createBrowserRouter, Navigate } from "react-router-dom";

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
  PipelineLevelGuard,
} from "@/guards";
import { PIPELINE_LEVELS, WORK_MODES } from "@/contexts/routePipelinePolicy";

import authRoutes from "@/features/auth/routes/authRoutes";
import userRoutes from "@/features/user/routes/userRoutes";

import { AcceptInvitationPage } from "@/features/workspace/pages";
import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
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
import doctorRoutes from "@/features/doctors/routes/doctorRoutes";
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
import financialPeriodRoutes from "@/features/finance/financial-periods/routes/financialPeriodRoutes";
import ledgerRoutes from "@/features/finance/ledger/routes/ledgerRoutes";
import gstLedgerRoutes from "@/features/finance/gst-ledger/routes/gstLedgerRoutes";
import reportsRoutes from "@/features/finance/reports/routes/reportsRoutes";
import { ReportsHubPage } from "@/features/reports";

import salesRoutes from "@/features/sales/routes/salesRoutes";
import billingRoutes from "@/features/billing/routes/billingRoutes";
import salesReturnRoutes from "@/features/sales-returns/routes/salesReturnRoutes";
import purchasesRoutes from "@/features/purchases/routes/purchasesRoutes";
import helpCenterRoutes from "@/features/help-center/routes/helpCenterRoutes";
import operationsRoutes from "@/features/operations/routes/operationsRoutes";
import ChooseWorkModePage from "@/features/operations/pages/ChooseWorkModePage";
import NotFoundPage from "@/pages/NotFoundPage";

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
    errorElement: <RouteErrorBoundary />,
    children: [
      // ── Choose Work Mode ──
      {
        path: ROUTES.CHOOSE_MODE,
        element: <ChooseWorkModePage />,
      },
      // ── Step 1 & Core Essentials (Always accessible once workspace exists) ──
      ...setupRoutes,
      ...userRoutes,
      ...settingsRoutes,
      ...helpCenterRoutes,
      ...guardRouteList(createCompanyRoutes, "company").map((route) => ({
        ...route,
        element: (
          <PipelineLevelGuard
            allowedLevels={[PIPELINE_LEVELS.WORKSPACE]}
            allowedModes={[WORK_MODES.OPERATION]}
            allowDuringOnboarding
          >
            {route.element}
          </PipelineLevelGuard>
        ),
      })),

      // ── Guarded by CompanyRequiredGuard (Requires Step 1 Company to be created) ──
      {
        element: <CompanyRequiredGuard />,
        children: [
          {
            element: (
              <PipelineLevelGuard
                allowedLevels={[PIPELINE_LEVELS.WORKSPACE]}
                allowDuringOnboarding
              />
            ),
            children: guardRouteList(existingCompanyRoutes, "company"),
          },
          {
            element: (
              <PipelineLevelGuard
                allowedLevels={[PIPELINE_LEVELS.COMPANY]}
                allowDuringOnboarding
              />
            ),
            children: guardRouteList(branchRoutes, "branch"),
          },
        ],
      },

      // ── Guarded Operational Application (Requires 100% Setup Complete) ──
      {
        element: <SetupCenterGuard />,
        children: [
          ...dashboardRoutes.map((route) => {
            if (route.path === ROUTES.WORKSPACE_DASHBOARD) {
              return {
                ...route,
                element: (
                  <PipelineLevelGuard
                    allowedLevels={[PIPELINE_LEVELS.WORKSPACE]}
                    allowedModes={[WORK_MODES.VIEW]}
                  >
                    {route.element}
                  </PipelineLevelGuard>
                ),
              };
            }
            if (route.path === ROUTES.COMPANY_DASHBOARD) {
              return {
                ...route,
                element: (
                  <ActiveCompanyGuard>
                    <PipelineLevelGuard
                      allowedLevels={[PIPELINE_LEVELS.COMPANY]}
                      allowedModes={[WORK_MODES.VIEW]}
                    >
                      {route.element}
                    </PipelineLevelGuard>
                  </ActiveCompanyGuard>
                ),
              };
            }
            if (route.path === ROUTES.BRANCH_DASHBOARD) {
              return {
                ...route,
                element: (
                  <ActiveCompanyGuard>
                    <ActiveBranchGuard>
                      <PipelineLevelGuard
                        allowedLevels={[PIPELINE_LEVELS.BRANCH]}
                        allowedModes={[WORK_MODES.VIEW]}
                      >
                        {route.element}
                      </PipelineLevelGuard>
                    </ActiveBranchGuard>
                  </ActiveCompanyGuard>
                ),
              };
            }
            return route;
          }),

          // ── Workspace Level Routes (Floor 1) ──
          {
            element: (
              <PipelineLevelGuard allowedLevels={[PIPELINE_LEVELS.WORKSPACE]} />
            ),
            children: [
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
            ],
          },

          // ── Guarded by ActiveCompanyGuard (Requires active company selection) ──
          {
            element: <ActiveCompanyGuard />,
            children: [
              // ── Company Level Routes (Floor 2) ──
              {
                element: (
                  <PipelineLevelGuard allowedLevels={[PIPELINE_LEVELS.COMPANY]} />
                ),
                children: [
                  // Parties
                  ...guardRouteList(customerRoutes, "customer"),
                  ...guardRouteList(supplierRoutes, "supplier"),

                  // Clinical References
                  ...guardRouteList(doctorRoutes, "doctor"),

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

                  // Corporate Treasury & Bank Management
                  ...treasuryRoutes.map((route) => ({
                    ...route,
                    element: (
                      <PermissionGuard
                        permissions={[
                          "bank-account:view",
                          "fund-transfer:view",
                          "cheque:view",
                          "bank-deposit-slip:view",
                        ]}
                      >
                        {route.element}
                      </PermissionGuard>
                    ),
                  })),
                  ...guardRouteList(bankAccountRoutes, "bank-account"),
                  ...guardRouteList(fundTransferRoutes, "fund-transfer"),
                  ...guardRouteList(chequeRoutes, "cheque"),
                  ...guardRouteList(bankDepositSlipRoutes, "bank-deposit-slip"),
                  ...bankTransactionRoutes.map((route) => ({
                    ...route,
                    element: (
                      <PermissionGuard permission="bank-transaction:view">
                        {route.element}
                      </PermissionGuard>
                    ),
                  })),
                ],
              },

              // ── Shared Company & Branch Global Catalog Masters ──
              {
                element: (
                  <PipelineLevelGuard
                    allowedLevels={[
                      PIPELINE_LEVELS.COMPANY,
                      PIPELINE_LEVELS.BRANCH,
                    ]}
                  />
                ),
                children: [
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
                ],
              },

              // ── Branch Level Routes (Floor 3 — Requires active branch selection) ──
              {
                element: <ActiveBranchGuard />,
                children: [
                  {
                    element: (
                      <PipelineLevelGuard
                        allowedLevels={[PIPELINE_LEVELS.BRANCH]}
                      />
                    ),
                    children: [
                      // Reports Hub (Branch View)
                      {
                        path: ROUTES.REPORTS_HUB,
                        element: (
                          <PermissionGuard permission="report:view">
                            <ReportsHubPage />
                          </PermissionGuard>
                        ),
                      },
                      {
                        path: "/reports/:category/:subReport",
                        element: (
                          <PermissionGuard permission="report:view">
                            <ReportsHubPage />
                          </PermissionGuard>
                        ),
                      },
                      {
                        path: "/reports/:reportKey",
                        element: (
                          <PermissionGuard permission="report:view">
                            <ReportsHubPage />
                          </PermissionGuard>
                        ),
                      },

                      // Branch Cash & Counter Payments
                      ...guardRouteList(branchCashRoutes, "cash-account"),
                      ...guardRouteList(cashExchangeRoutes, "cash-exchange"),
                      ...guardRouteList(paymentQrRoutes, "payment-qr"),
                      ...cashTransactionRoutes.map((route) => ({
                        ...route,
                        element: (
                          <PermissionGuard permission="cash-transaction:view">
                            {route.element}
                          </PermissionGuard>
                        ),
                      })),

                      // Branch Inventory & Stock
                      {
                        path: "/inventory",
                        element: <Navigate to={ROUTES.STOCK_METRICS} replace />,
                      },
                      {
                        path: "/inventory/transfer-orders",
                        element: <TransferOrdersPage />,
                      },
                      {
                        path: "/inventory/transfer-orders/create",
                        element: <CreateTransferOrderPage />,
                      },
                      {
                        path: "/inventory/transfer-orders/:id/edit",
                        element: <CreateTransferOrderPage />,
                      },
                      ...guardRouteList(workspaceProductRoutes, "product"),

                      // Marketplace
                      ...guardRouteList(
                        marketplaceStoreRoutes,
                        "marketplace-store"
                      ),
                      ...guardRouteList(
                        marketplaceProductRoutes,
                        "marketplace-product"
                      ),

                      // Sales & POS, Invoicing & Purchases
                      ...guardRouteList(salesRoutes, "pos"),
                      ...guardRouteList(billingRoutes, "bill"),
                      ...guardRouteList(salesReturnRoutes, "bill"),
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
