# PharmaERP Frontend UI & Page Architecture Standards

> **Note for Future AI Agents & Developers**:  
> This document defines the mandatory layout, scroll behavior, and component patterns for desktop pages in `pharmaerp-web`. Always follow these rules when creating new pages or refactoring existing ones. Do NOT deviate from these patterns unless explicitly instructed by the user.

---

## 1. Core Architecture Principles

1. **Header Consistency**: The desktop layout (`AppDesktopLayout`) provides standard padding. Page containers must use `pt-0` so the top stat cards sit at the exact same vertical distance from the header across all pages. Never add large top margins or redundant `<h1>` / breadcrumb headers to standard pages.
2. **Standard 3-Tier Layout**:
   - **Tier 1 (Top)**: Compact 4-Card KPI Stat Grid (`shrink-0`).
   - **Tier 2 (Middle)**: Single-row Filter & Search Toolbar (`shrink-0`).
   - **Tier 3 (Bottom)**: Scrollable Table with Sticky Header & Infinite Scroll (`flex-1 min-h-0`).
3. **Fixed Viewport vs. Scrollable Pages**:
   - **Table/Directory/Management Pages**: **100% Fixed Viewport** (`overflow-hidden`). The page itself does NOT scroll; **only the table body scrolls**.
   - **Forms, Profiles, Hubs & Reports**: **Naturally Scrollable** (`overflow-y-auto`). Allows scrolling to reach form fields, action buttons, or multi-row card sections.

---

## 2. Fixed Viewport Table Pages (Standard Template)

All list/management pages (e.g. Sales Invoices, Sales Returns, Customers, Suppliers, Doctors, Purchases, Transfer Orders, Stock Metrics, Shifts, Business Days, Companies, Branches, Staff/Members, Roles, Permissions, Financial Periods, Bank Accounts, UPI QR, Cash Accounts, Cheques, Fund Transfers, Chart of Accounts, General Vouchers) follow this exact layout.

### Canonical Outer Container
```jsx
<div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden select-none">
  {/* Tier 1: Stat Cards Grid */}
  {/* Tier 2: Filter Toolbar */}
  {/* Tier 3: Table with Infinite Scroll */}
</div>
```

### Tier 1: Top 4-Card KPI Stat Grid
- Responsive 4-card grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 shrink-0`.
- Card height: `h-[68px] sm:h-[72px]`.
- Icon badge: `size-9 rounded-lg` with theme-based subtle border and background (`bg-primary/10 text-primary border-primary/20`).
- Content: Uppercase small label (`text-[11px] text-text-muted`), bold value (`text-lg sm:text-xl font-bold font-mono`), and bottom status pill/subtext.
- Always include `shrink-0` so the stat bar never compresses when table data loads.

### Tier 2: Single-Row Filter Toolbar
- Container: `shrink-0 flex items-center justify-between gap-2 bg-surface border border-border/80 rounded-lg px-2.5 py-1.5 shadow-2xs`.
- **Search Bar Starts Flush at Left**: `relative flex-1 max-w-xs sm:max-w-sm`.
  - **CRITICAL**: Never leave empty space at the left when there is no branch or company selector! The search bar must always start from the very beginning of the toolbar.
- **`<CompanyFilterSelect>` Component**:
  - Dynamically renders company selector when at workspace level.
  - Automatically collapses to `null` at company or branch level without leaving dead space.
- **Compact Select Dropdowns**: `h-8 text-xs bg-bg border-border rounded-md`.
- **Action Buttons**:
  - Reset filters button (`size-8` icon button).
  - Refresh button (`size-8` icon button with spin indicator).
  - Primary CTA button (`+ Add Entity` or `+ Create`, `h-8 px-3 text-xs font-semibold`).

### Tier 3: Table Area with Infinite Scroll & Hidden Scrollbar
- Container: `<UITableScrollArea className="flex-1 min-h-0 border border-border/80 rounded-lg bg-surface flex flex-col shadow-2xs overflow-hidden">`.
- Header: `<UITableHeader className="sticky top-0 z-20 bg-surface-alt/90 backdrop-blur-xs border-b border-border text-text-muted text-[11px] font-semibold uppercase tracking-wider">`.
- Body: Rows rendered via `<UITableBody>`.
- **Infinite Scrolling (NO Pagination)**:
  - Do NOT use traditional pagination (page numbers, next/prev buttons, page size selects).
  - Place `<UIInfiniteScroll onLoadMore={fetchNextPage} hasMore={hasNextPage} isLoading={isFetchingNextPage} />` inside or immediately at the end of the scroll area.
- **Overlay Scrollbar Behavior**:
  - The table scrollbar is **invisible by default**.
  - It becomes visible **ONLY while the user is actively scrolling**, and fades out automatically ~1 second after scrolling stops.
  - Powered by `UITableScrollArea` and `attachOverlayScrollbar(element)` (`src/utils/overlayScrollbar.js`).

---

## 3. Fixed Viewport vs. Naturally Scrollable Classification

In `src/layouts/app/desktop/AppDesktopLayout.jsx`, the `<main>` container applies either fixed viewport or vertical document scroll based on the route:

```jsx
<main
  className={cn(
    "mt-[62px] min-w-0 flex-1 flex flex-col",
    isFixedViewportPage
      ? "h-[calc(100dvh-62px)] max-h-[calc(100dvh-62px)] overflow-hidden py-2 sm:py-2.5 px-3 sm:px-5"
      : "min-h-[calc(100dvh-62px)] overflow-y-auto py-3 sm:py-4 px-3 sm:px-5"
  )}
>
```

### Pages that MUST be Fixed Viewport (`isFixedViewportPage = true`)
- All billing & POS pages (`/sales`, `/sale`, `/billing`)
- Sales returns (`/sales-returns`)
- Customer & Supplier lists (`/parties/customers`, `/parties/suppliers`)
- Doctors directory (`/doctors`)
- Purchases hub (`/purchases`)
- Transfer orders (`/inventory/transfer-orders`)
- Stock metrics (`/inventory/stock-metrics`, `/stock-metrics`)
- Workspace products (`/workspace-products`)
- Shifts & Business days (`/operations/shifts`, `/operations/business-days`)
- Companies directory (`/companies`)
- Branches directory (`/branches`)
- Workspace members table (`/members`, `/workspace/members`)
- Roles table (`/roles-permissions`)
- Permission catalog table (`/roles-permissions/permissions`, `/access-control`)
- Financial periods (`/finance/financial-periods`)
- Banking & Treasury tables (`/finance/treasury/...`)
- Chart of accounts (`/finance/chart-of-accounts/...`)
- General/Journal vouchers (`/finance/journal-vouchers`, `/finance/ledger`)

### Pages that MUST be Naturally Scrollable (`isFixedViewportPage = false`)
- **Operations Hubs**:
  - All Company Operations (`/company-operations`)
  - All Branch Operations (`/branch-operations`)
- **Reports Pages**:
  - Financial Statements Hub (`/finance/reports`)
  - General Reports Hub (`/reports`)
  - Report Detail Viewers (`/reports/:category/:subReport`, `/finance/reports/:reportType`)
- **Multi-Field Form & Creation Pages** (Do NOT trap in `overflow-hidden`):
  - Member Invite Form (`/members/invite`)
  - Workspace Invitations List (`/members/invitations`)
  - Role Creation & Edit Forms (`/roles-permissions/create`, `/roles-permissions/:id/edit`)
- **Profile & Detail View Pages** (Do NOT trap in `overflow-hidden`):
  - Role Details View Page (`/roles-permissions/:roleId`)
  - Staff / Member Details View Page (`/members/:memberId`, `/workspace/members/:memberId`)

> [!IMPORTANT]
> When adding subroutes (like `/invite`, `/create`, `/edit`, or `:id` detail views), never use loose prefix matching in `AppDesktopLayout.jsx` without negative guards (e.g. `!isMemberInviteOrInvitation && !isRoleFormPage && !isRoleDetailsPage && !isMemberDetailsPage`). Trapping form or detail view pages in `overflow-hidden` prevents users from scrolling down to submit buttons and lower content sections.

---

## 4. Multi-Module Hub Pages (Operations & Reports)

Pages like **All Company Operations**, **All Branch Operations**, and **Financial Reports** contain card directories rather than a single table.

### Rules for Hub Pages:
1. **No Redundant Page Header**: Do not display a bulky `PageHeader` with large `<h1>`, breadcrumbs, or descriptive paragraphs.
2. **Stat Cards at Top**: Start directly with the 4-card KPI stat grid at `pt-0`.
3. **Filter & Search Toolbar**: Provide a search input and category filter pills (`All`, `Core`, `Ledgers`, `Treasury`, `Tax`, etc.).
4. **Action Buttons**: Place directory navigation (e.g., `Companies Directory`, `Branches Directory`) and `Refresh` buttons on the right side of the filter toolbar.
5. **Modern Card Design**:
   - `p-4 rounded-xl bg-surface border border-border shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]`
   - Top row: `size-10 rounded-lg` icon container with tinted badge, category tag, and keyboard shortcut.
   - Middle: Bold title (`text-sm font-semibold`), subtitle, and 2-3 line description with `line-clamp-3`.
   - Bottom: Subtle border divider with `"Open View"` / `"Generate Statement"` and directional arrow `ArrowRight`.
6. **Naturally Scrollable**: Hubs must allow vertical document scrolling so all cards and bottom panels are easily accessible.

---

## 5. Sidebar Drawer Rules

1. **Closed Rail State**:
   - Clicking anywhere in empty/whitespace areas of the closed sidebar **opens the drawer**.
   - Hovering over empty sidebar space displays the double-sided resize arrow (`cursor: col-resize` / `cursor: ew-resize`).
   - Clicking the top level indicator icon (Workspace / Company / Branch level badge) **opens the drawer**.
   - Clicking any navigation icon directly executes navigation and does NOT open the drawer.
2. **No Duplicate Settings Icons**:
   - The Settings navigation item is pinned strictly to the bottom of the sidebar.
   - Never duplicate the Settings icon in the main nav groups or header area.

---

## 6. Standard Desktop Table Page Code Skeleton

Use this reference when building any new fixed viewport desktop table page:

```jsx
import React, { useState, useMemo } from "react";
import {
  Search,
  X,
  RefreshCw,
  RotateCcw,
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  UITable,
  UITableHeader,
  UITableBody,
  UITableHead,
  UITableRow,
  UITableCell,
  UITableScrollArea,
  UIInfiniteScroll,
} from "@/components/ui";
import { CompanyFilterSelect } from "@/components/shared";

export const ExampleDesktopPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <div className="w-full h-full max-h-full flex-1 flex flex-col min-h-0 bg-bg px-2 sm:px-3 pt-0 pb-1 gap-2.5 text-text font-sans transition-colors overflow-hidden select-none">
      {/* ── 1. Top Stat Cards Grid (shrink-0) ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 shrink-0">
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-surface border border-border/80 shadow-2xs h-[68px] sm:h-[72px]">
          <div className="size-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Building2 className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider block">Total Items</span>
            <div className="text-lg sm:text-xl font-bold font-mono text-text leading-tight mt-0.5">128</div>
          </div>
        </div>
        {/* Repeat 3 more stat cards (Active, Pending, Attention) */}
      </div>

      {/* ── 2. Single-Row Filter Toolbar (shrink-0) ─────────────────────── */}
      <div className="shrink-0 flex items-center justify-between gap-2 bg-surface border border-border/80 rounded-lg px-2.5 py-1.5 shadow-2xs">
        {/* Left Side: Search (Flush at start) + Dynamic Filters */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs sm:max-w-sm">
            <Search className="size-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-8 pr-7 py-1 text-xs rounded-md bg-bg border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Company filter (collapses to null at company/branch level) */}
          <CompanyFilterSelect value={selectedCompany} onChange={setSelectedCompany} />

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2 text-xs rounded-md bg-bg border border-border text-text"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="size-8 rounded-md bg-bg border border-border flex items-center justify-center text-text-muted hover:text-text"
            title="Reset Filters"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>

        {/* Right Side: Refresh & Primary CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={refetch}
            className="size-8 rounded-md bg-bg border border-border flex items-center justify-center text-text-muted hover:text-text"
            title="Refresh"
          >
            <RefreshCw className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-2xs hover:bg-primary/90"
          >
            <Plus className="size-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* ── 3. Table Area with Infinite Scroll (flex-1 min-h-0) ─────────── */}
      <UITableScrollArea className="flex-1 min-h-0 border border-border/80 rounded-lg bg-surface flex flex-col shadow-2xs overflow-hidden">
        <UITable>
          <UITableHeader className="sticky top-0 z-20 bg-surface-alt/90 backdrop-blur-xs border-b border-border text-text-muted text-[11px] font-semibold uppercase tracking-wider">
            <UITableRow>
              <UITableHead className="py-2 px-3">Name</UITableHead>
              <UITableHead className="py-2 px-3">Status</UITableHead>
              <UITableHead className="py-2 px-3 text-right">Actions</UITableHead>
            </UITableRow>
          </UITableHeader>
          <UITableBody>
            {items.map((item) => (
              <UITableRow key={item.id} className="hover:bg-surface-alt/40 border-b border-border/40 text-xs">
                <UITableCell className="py-2 px-3 font-medium text-text">{item.name}</UITableCell>
                <UITableCell className="py-2 px-3">{item.status}</UITableCell>
                <UITableCell className="py-2 px-3 text-right">...</UITableCell>
              </UITableRow>
            ))}
          </UITableBody>
        </UITable>

        {/* Infinite Scroll Trigger */}
        <UIInfiniteScroll
          hasMore={hasMore}
          isLoading={isLoadingMore}
          onLoadMore={loadMore}
        />
      </UITableScrollArea>
    </div>
  );
};
```

---

## 7. Developer Pre-Flight Checklist

Before marking any desktop UI task complete, verify:
- [ ] Stat card grid sits close to header (`pt-0 pb-1 px-2 sm:px-3 gap-2.5`).
- [ ] No `PageHeader`, duplicate `<h1>`, or breadcrumbs pushing content down.
- [ ] Search input starts flush at the very left; no empty gap left by missing company/branch selectors.
- [ ] The whole page is fixed (`overflow-hidden`), and only `<UITableScrollArea>` scrolls (for table pages).
- [ ] Table has **infinite scrolling**; pagination buttons and page number rows are removed.
- [ ] Scrollbar is **hidden by default** and only appears during active scroll (`UITableScrollArea` / `overlay-scrollbar`).
- [ ] Form and creation pages (`/invite`, `/create`, `/edit`) are excluded from `isFixedViewportPage` in `AppDesktopLayout.jsx`.
- [ ] Run `npm --prefix pharmaerp-web run build` and ensure **0 errors**.
