# Accounts, Account Groups & Cheques Dialog Migration Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Fix the infinite request loop on the Accounts page, completely remove the Chart of Accounts hub page and routes, migrate Accounts, Account Groups, and Cheques to rich, in-place dialog workflows (`create`, `edit`, `view`), and delete all 27 dedicated sub-page files and unneeded routes.

**Architecture:** Stabilize hook functions with `useCallback` in `useAccount` and `useAccountGroup` to eliminate dependency churn; rewrite `AccountDialog`, `AccountGroupDialog`, and `ChequeDialog` using `UI*` components with live card/cheque previews and 3-KPI view profiles; simplify routes in `accountRoutes.jsx`, `accountGroupRoutes.jsx`, and `chequeRoutes.jsx` to single entry points; remove `chartOfAccountsRoutes.jsx` and remove Chart of Accounts from sidebar and search.

**Tech Stack:** React 19, Redux Toolkit, Tailwind CSS, Lucide / React Icons, Reusable UI Design System (`@/components/ui`).

---

### Task 1: Fix Infinite API Loop in useAccount, useAccountGroup, and AccountsPage
**Files:**
- Modify: `src/features/finance/chart-of-accounts/accounts/hooks/useAccount.js`
- Modify: `src/features/finance/chart-of-accounts/account-groups/hooks/useAccountGroup.js`
- Modify: `src/features/finance/chart-of-accounts/accounts/pages/AccountsPage.jsx`

### Task 2: Remove Chart of Accounts Page, Routes, and Sidebar / Search References
**Files:**
- Modify: `src/layouts/app/components/sidebar/sidebarNavConfig.js`
- Modify: `src/features/finance/pages/FinancePage.jsx`
- Modify: `src/app/routes.jsx`
- Delete: `src/features/finance/chart-of-accounts/routes/chartOfAccountsRoutes.jsx`
- Delete: `src/features/finance/chart-of-accounts/pages/ChartOfAccountsPage.jsx`
- Delete: `src/features/finance/chart-of-accounts/pages/desktop/ChartOfAccountsDesktopPage.jsx`
- Delete: `src/features/finance/chart-of-accounts/pages/mobile/ChartOfAccountsMobilePage.jsx`
- Delete/Modify: `src/features/finance/chart-of-accounts/pages/index.js`

### Task 3: Redesign AccountDialog UI & Migrate Accounts to In-Place Dialogs
**Files:**
- Modify: `src/features/finance/chart-of-accounts/accounts/components/AccountDialog.jsx`
- Modify: `src/features/finance/chart-of-accounts/accounts/pages/AccountsPage.jsx`
- Modify: `src/features/finance/chart-of-accounts/accounts/pages/desktop/AccountsDesktopPage.jsx`
- Modify: `src/features/finance/chart-of-accounts/accounts/routes/accountRoutes.jsx`
- Modify: `src/features/finance/chart-of-accounts/accounts/pages/index.js`
- Modify: `src/features/finance/chart-of-accounts/accounts/pages/desktop/index.js`
- Modify: `src/features/finance/chart-of-accounts/accounts/pages/mobile/index.js`
- Delete: 9 dedicated Account sub-page files

### Task 4: Redesign AccountGroupDialog UI & Migrate Account Groups to In-Place Dialogs
**Files:**
- Modify: `src/features/finance/chart-of-accounts/account-groups/components/AccountGroupDialog.jsx`
- Modify: `src/features/finance/chart-of-accounts/account-groups/pages/AccountGroupsPage.jsx`
- Modify: `src/features/finance/chart-of-accounts/account-groups/pages/desktop/AccountGroupsDesktopPage.jsx`
- Modify: `src/features/finance/chart-of-accounts/account-groups/routes/accountGroupRoutes.jsx`
- Modify: `src/features/finance/chart-of-accounts/account-groups/pages/index.js`
- Modify: `src/features/finance/chart-of-accounts/account-groups/pages/desktop/index.js`
- Modify: `src/features/finance/chart-of-accounts/account-groups/pages/mobile/index.js`
- Delete: 9 dedicated Account Group sub-page files

### Task 5: Redesign ChequeDialog UI & Migrate Cheques to In-Place Dialogs
**Files:**
- Modify: `src/features/finance/treasury/cheque-management/components/ChequeDialog.jsx`
- Modify: `src/features/finance/treasury/cheque-management/pages/ChequesPage.jsx`
- Modify: `src/features/finance/treasury/cheque-management/pages/desktop/ChequesDesktopPage.jsx`
- Modify: `src/features/finance/treasury/cheque-management/routes/chequeRoutes.jsx`
- Modify: `src/features/finance/treasury/cheque-management/pages/index.js`
- Modify: `src/features/finance/treasury/cheque-management/pages/desktop/index.js`
- Modify: `src/features/finance/treasury/cheque-management/pages/mobile/index.js`
- Delete: 6 dedicated Cheque sub-page files

### Task 6: Documentation & Production Build Verification
**Files:**
- Modify: `DIALOG_MIGRATION.md`
- Modify: `docs/plans/task.md`
- Run: `npm run build`
