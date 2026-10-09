# Multi-Level Dashboards Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build three dedicated, high-density, theme-compatible dashboard pages in Pharma ERP — **Branch Dashboard**, **Company Dashboard**, and **Workspace Dashboard** — that are pixel-perfect replicas of the provided reference mockups, backed by a unified multi-scope backend aggregation API.

**Architecture:** 
1. **Frontend Architecture:** Three separate dedicated page modules (`BranchDashboardPage.jsx`, `CompanyDashboardPage.jsx`, `WorkspaceDashboardPage.jsx`) mounted on dedicated routes (`/dashboard/branch`, `/dashboard/company`, `/dashboard/workspace`), with `/dashboard` dynamically routing to the appropriate scope. Built with PharmaERP's native `UI*` components (`UIStatCard`, `UICard`, `UIButton`, `UIBadge`, `UITable`), Geist tabular typography (`font-mono tabular-nums`), responsive 12-column compact grids, and full compatibility across light/dark modes and all color themes (`emerald`, `classicBlue`, `slate`, `warm`, `indigo`).
2. **Backend Architecture:** A scalable aggregation module in `pharmaerp-api` with dedicated endpoints (`/api/v1/dashboard/branch`, `/api/v1/dashboard/company`, `/api/v1/dashboard/workspace`) executing MongoDB aggregation pipelines against real collections (`SalesInvoice`, `WorkspaceProduct`, `Batch`, `PurchaseBill`, `TransferOrder`, `BusinessDay`, `Shift`, `Customer`, `Supplier`, `MarketplaceStore`, `BankAccount`) with strict tenant scoping.
3. **Sidebar & Navigation:** Integrated sidebar navigation with dedicated items/sub-items and compact contextual footer widgets displaying branch/company/workspace status.

**Tech Stack:** React 19, Redux Toolkit, React Router DOM v7, Tailwind CSS v4, Lucide React, Framer Motion, Express.js, MongoDB / Mongoose.

---

## 🧭 Workflow Phasing Strategy

Per user specification, we execute phase-by-phase with user review gates:
1. **Phase 1 (Current Step):** Complete visual & technical blueprint design of the **First Dashboard (Branch Dashboard)** + Full implementation plan for all 3 dashboards.
2. **Phase 2 (User Review Gate):** User reviews the Branch Dashboard design and suggests adjustments.
3. **Phase 3:** Refine Branch Dashboard per feedback and implement Branch Dashboard frontend + backend.
4. **Phase 4:** Proceed to Company Dashboard (design review -> implementation).
5. **Phase 5:** Proceed to Workspace Dashboard (design review -> implementation).
6. **Phase 6:** Global navigation, sidebar integration, theme/dark mode compliance & compact layout verification.

---

## 📐 Deep Analysis of Reference Images

### 1. Branch Dashboard (Image 1)
- **Top Header:** 
  - Left: Context selector `Branch: Indore - Main Branch (MB-001)`.
  - Right: `[📅 Oct 01, 2026 ▾]` date picker, `🟢 Business Day: OPEN` status pill.
- **Top 5 KPI Metric Cards:**
  1. `Today's Sales`: Green cart icon | `₹ 1,24,580` | `▲ 12.6% vs yesterday`
  2. `Total Invoices`: Blue document icon | `218` | `▲ 8.2% vs yesterday`
  3. `New Customers`: Purple users icon | `32` | `▲ 28.0% vs yesterday`
  4. `Avg. Bill Value`: Orange credit card icon | `₹ 572` | `▲ 4.5% vs yesterday`
  5. `Items Sold`: Pink/red package icon | `1,842` | `▲ 10.1% vs yesterday`
- **Middle Section (Visuals & Shift):**
  - **Sales Trend (Left ~45%):** Bar chart (Sales Amount ₹) + Line chart (Invoices count) with hourly buckets (`8 AM` to `10 PM`), interactive tooltip (`2:00 PM | Sales: ₹ 1,24,580 | Invoices: 218`), timeframe dropdown `[Today ▾]`.
  - **Payment Mode Breakdown (Center ~25%):** Donut chart with center text `₹ 1.24 L / Total Sales`, legend: Cash (42.3%), UPI (28.6%), Card (18.4%), Credit/Khata (7.2%), Others (3.5%).
  - **Current Shift (Right ~30%):** Live card with `[Live 🟢]` badge, Shift title `Morning Shift (08:00 AM - 02:00 PM)`, metadata rows: Cashier (`Rohit Sharma`), Counter (`Counter 1`), Sales (`₹ 1,24,580`), Invoices (`218`), Cash in Drawer (`₹ 18,250`), `View Details →` link.
- **Lower Section Row 1 (3 Operational Table Cards):**
  - **Low Stock Items:** `#`, `Product`, `Batch`, `Stock` (highlighted red/amber), `Reorder At`.
  - **Near Expiry Items (≤ 60 days):** `#`, `Product`, `Batch`, `Expiry` (e.g. Nov 2026), `Stock`.
  - **Today's Purchase Receipts:** `#`, `Supplier`, `Invoice No.`, `Items`, `Amount`, `Status` (Received / Pending badges).
- **Lower Section Row 2 (3 Operational Table Cards):**
  - **Today's Recent Sales:** `Time`, `Invoice No.`, `Customer`, `Items`, `Amount`, `Payment` (UPI / Card / Cash pills).
  - **Today's Online Orders (Pahuch):** `#`, `Order No.`, `Customer`, `Amount`, `Status` (Preparing, Packed, Out for Delivery, Delivered, Cancelled).
  - **Inter-Branch Transfers:** `#`, `From -> To`, `Items`, `Status` (In Transit, Completed, Pending, Cancelled).
- **Bottom Sidebar Widget:**
  - Branch Info card: "Indore - Main Branch (MB-001)", Business Day: `OPEN 🟢`, Current Shift: `Morning 🟢`, Cashier: `Rohit S.`, Counter: `1`, `[Branch Settings]` button.

---

### 2. Company Dashboard (Image 2)
- **Top Header:** 
  - Context selector `Company: Traveller Medico Pvt. Ltd.`.
  - Right: Date range `[📅 Oct 01, 2026 - Oct 31, 2026 ▾]`, Segmented filter: `Today | This Month | This Quarter | This Year`.
- **Top 6 KPI Metric Cards:**
  1. `Total Sales`: `₹ 68,12,430` | `▲ 14.6% vs last month`
  2. `Total Purchases`: `₹ 42,18,900` | `▲ 8.2% vs last month`
  3. `Gross Profit`: `₹ 26,48,530` | `▲ 16.3% vs last month`
  4. `Outstanding Receivables`: `₹ 12,28,300` | `▲ 6.8% vs last month`
  5. `Outstanding Payables`: `₹ 18,42,750` | `▲ 11.2% vs last month`
  6. `Bank Balance`: `₹ 48,32,120` | `▲ 4.1% vs last month`
- **Middle Section Row 1 (3 Cards):**
  - **Sales vs Purchases Trend (~35%):** Clustered bar chart (Sales vs Purchases) over last 6 months (May to Oct).
  - **Branch Performance Leaderboard (~35%):** Ranked table of company branches (`Indore - Main`, `Bhopal - MP Nagar`, `Ujjain`, `Dewas`, `Indore - Vijay Nagar`) with Sales, Profit, and Growth %.
  - **Sales by Product Category (~30%):** Donut chart (`₹ 68.12 L Total Sales`) with Allopathic (56.3%), Generics (18.4%), OTC (11.2%), Health & Wellness (7.8%), Personal Care (4.1%), Others (2.2%).
- **Middle Section Row 2 (3 Cards):**
  - **Top Selling Products (~35%):** Table with Product name, Category, Units Sold, Sales Amount.
  - **GST Summary (~30%):** Output GST (`₹ 10,28,450`), Input Tax Credit (`₹ 6,82,310`), Net GST Payable (`₹ 3,46,140`), mini bar chart breakdown (CGST, SGST, IGST).
  - **Inventory Alerts (All Branches) (~35%):** Out of Stock (`58`), Low Stock (`142`), Near Expiry (<30d) (`46`), Expired (`18`).
- **Bottom Section Row 3 (3 Cards):**
  - **Recent Purchases (~35%):** Date, Supplier, Invoice No, Items, Amount, Status.
  - **Recent Sales (All Branches) (~35%):** Date, Branch, Invoice No, Amount, Payment method.
  - **Inter-Branch Transfers (~30%):** Date, From -> To, Items count, Status pill.
- **Bottom Sidebar Widget:**
  - Company Info card: "Traveller Medico Pvt. Ltd. (GSTIN: 23ABCDE1234F1Z5)", Branches: `5 / 8` progress bar, `[Company Settings]` button.

---

### 3. Workspace Dashboard (Image 3)
- **Top Header:**
  - Context selector `Workspace: Traveller Healthcare Group`.
  - Right: Date range `[📅 Oct 01, 2026 - Oct 31, 2026 ▾]`, Timeframe pills: `Today | This Month | This Quarter | This Year`.
- **Top 6 KPI Metric Cards:**
  1. `Total Revenue`: `₹ 1,48,32,450` | `▲ 12.5% vs last month`
  2. `Total Purchases`: `₹ 92,14,300` | `▲ 8.3% vs last month`
  3. `Gross Profit`: `₹ 56,18,150` | `▲ 18.2% vs last month`
  4. `Active Companies`: `3 / 3` | `0% vs last month`
  5. `Active Branches`: `12 / 15` | `▲ 20% vs last month`
  6. `Total Staff`: `38 / 50` | `▲ 11% vs last month`
- **Middle Section Row 1 (3 Cards):**
  - **Revenue & Profit Trend (~38%):** Combo Clustered Bar (Sales Revenue & Purchases) + Overlay Line (Gross Profit) over 6 months with interactive tooltip.
  - **Top Companies by Revenue (~32%):** Ranked list of legal companies with TRV-01 codes, Sales amount, Growth %, and progress bar.
  - **Branch Performance (~30%):** Top branches ranked by sales and growth.
- **Middle Section Row 2 (3 Cards):**
  - **Sales by Category (~32%):** Donut chart (`₹ 1.48 Cr Total Sales`) with 6 categories.
  - **Stock Alerts (~32%):** Out of Stock (`12`), Low Stock (`28`), Near Expiry (`16`), Expired (`8`).
  - **Financial Summary (~36%):** Key financial metrics with icons: Cash in Branches (`₹ 12,48,500`), Bank Account Balance (`₹ 48,32,120`), Pending Customer Receivables (`₹ 18,21,300`), Pending Supplier Payables (`₹ 32,18,450`), Net GST Payable (`₹ 6,82,100`).
- **Bottom Section Row 3 (2 Cards):**
  - **Recent Business Activity (~60%):** Comprehensive activity feed table: Time, Type (Sale, Purchase, Transfer, Payment, User), Description, Company/Branch, Amount, User.
  - **Subscription & Usage (~40%):** Growth Plan badge, validity date, progress bars for Branches (`8/15`), Staff Seats (`24/50`), Storage (`62/200 GB`), Days left badge (`10 Days left`), `[View Details]` button.
- **Bottom Sidebar Widget:**
  - Current Plan: "Growth Plan (Valid till 15 Mar 2027)", Progress bars for Branches (`8/15`), Staff Seats (`24/50`), Storage (`62/200 GB`), `[👑 Upgrade Plan]` button.

---

## 🛠️ Step-by-Step Task Breakdown

### Phase 1: Designing & Structuring the First Dashboard (Branch Dashboard)

#### Task 1.1: Component Architecture for Branch Dashboard
**Files to create:**
- `pharmaerp-web/src/features/dashboard/pages/BranchDashboardPage.jsx`
- `pharmaerp-web/src/features/dashboard/components/branch/BranchDashboardHeader.jsx`
- `pharmaerp-web/src/features/dashboard/components/branch/BranchKpiGrid.jsx`
- `pharmaerp-web/src/features/dashboard/components/branch/BranchSalesTrendCard.jsx`
- `pharmaerp-web/src/features/dashboard/components/branch/BranchPaymentBreakdownCard.jsx`
- `pharmaerp-web/src/features/dashboard/components/branch/BranchCurrentShiftCard.jsx`
- `pharmaerp-web/src/features/dashboard/components/branch/BranchLowStockCard.jsx`
- `pharmaerp-web/src/features/dashboard/components/branch/BranchNearExpiryCard.jsx`
- `pharmaerp-web/src/features/dashboard/components/branch/BranchPurchaseReceiptsCard.jsx`
- `pharmaerp-web/src/features/dashboard/components/branch/BranchRecentSalesCard.jsx`
- `pharmaerp-web/src/features/dashboard/components/branch/BranchOnlineOrdersCard.jsx`
- `pharmaerp-web/src/features/dashboard/components/branch/BranchInterBranchTransfersCard.jsx`
- `pharmaerp-web/src/features/dashboard/components/shared/SidebarBranchStatusWidget.jsx`

#### Task 1.2: Backend Branch Dashboard Aggregation API
**Files to create/modify:**
- Modify `pharmaerp-api/src/modules/dashboard/dashboard.repository.js`:
  - `getBranchDashboardData(workspaceId, companyId, branchId, date)`
    - Aggregates `SalesInvoice` for today (sum sales, count invoices, calculate average bill value, count unique customers, calculate items sold).
    - Hourly bucket aggregation for sales amount and invoice volume (`8 AM` to `10 PM`).
    - Payment mode aggregation (Cash, UPI, Card, Credit, Others).
    - Shift lookup: active shift for branch, cashier user name, counter, shift sales, cash in drawer from `Shift` model.
    - Low stock query: `WorkspaceProduct` / `Batch` where stock <= reorderLevel (limit 5).
    - Near expiry query: `Batch` where expiryDate <= now + 60 days (limit 5).
    - Recent purchase bills: `PurchaseBill` where branchId = branchId (limit 5).
    - Recent sales invoices: `SalesInvoice` where branchId = branchId (limit 5).
    - Online orders: `FulfillmentOrder` where store/branchId = branchId (limit 5).
    - Inter-branch transfers: `TransferOrder` where sourceBranchId or destinationBranchId = branchId (limit 5).
- Modify `pharmaerp-api/src/modules/dashboard/dashboard.service.js`
- Modify `pharmaerp-api/src/modules/dashboard/dashboard.controller.js`
- Modify `pharmaerp-api/src/modules/dashboard/dashboard.routes.js`:
  - Mount `GET /api/v1/dashboard/branch`

---

### Phase 2: Company Dashboard Implementation

#### Task 2.1: Component Architecture for Company Dashboard
**Files to create:**
- `pharmaerp-web/src/features/dashboard/pages/CompanyDashboardPage.jsx`
- `pharmaerp-web/src/features/dashboard/components/company/CompanyDashboardHeader.jsx`
- `pharmaerp-web/src/features/dashboard/components/company/CompanyKpiGrid.jsx` (6 KPI cards)
- `pharmaerp-web/src/features/dashboard/components/company/CompanySalesPurchasesChartCard.jsx` (Last 6 months clustered bars)
- `pharmaerp-web/src/features/dashboard/components/company/CompanyBranchPerformanceCard.jsx` (Ranked branches table)
- `pharmaerp-web/src/features/dashboard/components/company/CompanyCategoryDonutCard.jsx` (Product category split)
- `pharmaerp-web/src/features/dashboard/components/company/CompanyTopSellingProductsCard.jsx` (Top 5 medicines)
- `pharmaerp-web/src/features/dashboard/components/company/CompanyGstSummaryCard.jsx` (Output, ITC, Net Payable + Mini Bar)
- `pharmaerp-web/src/features/dashboard/components/company/CompanyInventoryAlertsCard.jsx` (4 alert items with counts & chevrons)
- `pharmaerp-web/src/features/dashboard/components/company/CompanyRecentPurchasesCard.jsx` (Supplier bills table)
- `pharmaerp-web/src/features/dashboard/components/company/CompanyRecentSalesCard.jsx` (Cross-branch sales table)
- `pharmaerp-web/src/features/dashboard/components/company/CompanyInterBranchTransfersCard.jsx` (Transfers table)
- `pharmaerp-web/src/features/dashboard/components/shared/SidebarCompanyStatusWidget.jsx`

#### Task 2.2: Backend Company Dashboard Aggregation API
**Files to modify:**
- `pharmaerp-api/src/modules/dashboard/dashboard.repository.js`:
  - `getCompanyDashboardData(workspaceId, companyId, timeframe)`:
    - Sum sales, purchases, gross profit for current month vs last month.
    - Calculate outstanding receivables (Customer ledger debit balances) and payables (Supplier ledger credit balances).
    - Aggregate company bank account balances.
    - 6-month sales vs purchases trend aggregation.
    - Branch-by-branch sales, profit, and growth ranking.
    - Sales by category aggregation from item master.
    - Top selling products by units sold.
    - GST calculation: Output GST (collected), Input Tax Credit (purchases), Net GST payable + CGST/SGST/IGST breakdown.
    - Inventory alert counts across all branches: Out of stock, Low stock, Near expiry (<30d), Expired.
    - Recent purchases, recent sales across branches, and inter-branch transfers.
- Mount `GET /api/v1/dashboard/company`.

---

### Phase 3: Workspace Dashboard Implementation

#### Task 3.1: Component Architecture for Workspace Dashboard
**Files to create:**
- `pharmaerp-web/src/features/dashboard/pages/WorkspaceDashboardPage.jsx`
- `pharmaerp-web/src/features/dashboard/components/workspace/WorkspaceDashboardHeader.jsx`
- `pharmaerp-web/src/features/dashboard/components/workspace/WorkspaceKpiGrid.jsx` (6 KPI cards)
- `pharmaerp-web/src/features/dashboard/components/workspace/WorkspaceRevenueProfitTrendCard.jsx` (6-month combo bar + line)
- `pharmaerp-web/src/features/dashboard/components/workspace/WorkspaceTopCompaniesCard.jsx` (Company ranking with progress bars)
- `pharmaerp-web/src/features/dashboard/components/workspace/WorkspaceBranchPerformanceCard.jsx` (Top branches)
- `pharmaerp-web/src/features/dashboard/components/workspace/WorkspaceCategoryDonutCard.jsx` (Category split)
- `pharmaerp-web/src/features/dashboard/components/workspace/WorkspaceStockAlertsCard.jsx` (4 alerts)
- `pharmaerp-web/src/features/dashboard/components/workspace/WorkspaceFinancialSummaryCard.jsx` (5 financial metrics with icons)
- `pharmaerp-web/src/features/dashboard/components/workspace/WorkspaceRecentActivityCard.jsx` (Activity feed table)
- `pharmaerp-web/src/features/dashboard/components/workspace/WorkspaceSubscriptionUsageCard.jsx` (Plan quotas & countdown)
- `pharmaerp-web/src/features/dashboard/components/shared/SidebarWorkspaceStatusWidget.jsx`

#### Task 3.2: Backend Workspace Dashboard Aggregation API
**Files to modify:**
- `pharmaerp-api/src/modules/dashboard/dashboard.repository.js`:
  - `getWorkspaceDashboardData(workspaceId, timeframe)`:
    - Group consolidated revenue, purchases, gross profit.
    - Active companies count, active branches count vs plan limit, total staff count vs quota.
    - 6-month revenue, purchases, profit trends.
    - Company revenue leaderboard.
    - Branch performance leaderboard.
    - Stock alert counts for workspace.
    - Group financial summary (Cash in branches, Bank accounts, Receivables, Payables, Net GST).
    - Multi-entity recent activity feed (Sales, Purchases, Transfers, Payments, Users).
    - Subscription plan details, quota usage (branches, seats, storage).
- Mount `GET /api/v1/dashboard/workspace`.

---

### Phase 4: Routing, Navigation & Sidebar Integration

#### Task 4.1: Routing Configuration
**Files to modify:**
- `pharmaerp-web/src/constants/routes.constant.js`:
  - `ROUTES.DASHBOARD` = `"/dashboard"`
  - `ROUTES.WORKSPACE_DASHBOARD` = `"/dashboard/workspace"`
  - `ROUTES.COMPANY_DASHBOARD` = `"/dashboard/company"`
  - `ROUTES.BRANCH_DASHBOARD` = `"/dashboard/branch"`
- `pharmaerp-web/src/features/dashboard/routes/dashboardRoutes.jsx` and `src/app/routes.jsx`:
  - Route `/dashboard/workspace` -> `WorkspaceDashboardPage`
  - Route `/dashboard/company` -> `CompanyDashboardPage`
  - Route `/dashboard/branch` -> `BranchDashboardPage`
  - Route `/dashboard` -> `DashboardRouter` (auto-redirects to appropriate dashboard based on context or user preference, with easy in-page scope switcher tabs).

#### Task 4.2: Sidebar Menu & Bottom Status Widgets
**Files to modify:**
- `pharmaerp-web/src/layouts/app/components/sidebar/sidebarNavConfig.js`:
  - Add collapsible or grouped sub-items under Dashboard:
    - Workspace Dashboard
    - Company Dashboard
    - Branch Dashboard
- `pharmaerp-web/src/layouts/app/desktop/AppDesktopSidebar.jsx`:
  - Render dynamic bottom widget matching reference images:
    - When on Branch Dashboard: Render Branch Info Widget (Branch code, Business Day `OPEN 🟢`, Shift, Cashier, `[Branch Settings]`).
    - When on Company Dashboard: Render Company Info Widget (GSTIN, Branches `5/8` progress bar, `[Company Settings]`).
    - When on Workspace Dashboard: Render Current Plan Widget (Growth Plan, Branches, Seats, Storage progress bars, `[👑 Upgrade Plan]`).

---

### Phase 5: Design System Polish, Theme Compatibility & Compact Layout Verification

#### Task 5.1: High-Density & Compact Spacing
- Ensure container padding is `p-4 sm:p-5`, inter-card gap is `gap-3.5 sm:gap-4`.
- Tight table cells (`py-2 px-3 text-xs sm:text-sm`).
- High information density so the entire dashboard fits cleanly with minimal excess whitespace.

#### Task 5.2: Multi-Theme & Dark Mode Verification
- Test with all themes: `emerald`, `classicBlue`, `slate`, `warm`, `indigo`.
- Test in both Light Mode (`bg-bg`, `bg-surface`, `border-border`) and Dark Mode.
- Verify zero hardcoded color clashes.

---

## 🚦 Phase 1 Approval Gate

We pause here for user review of **Phase 1 (First Dashboard Design & Overall Phasing)**.  
Once approved or modified, we proceed directly with Phase 2 implementation.
