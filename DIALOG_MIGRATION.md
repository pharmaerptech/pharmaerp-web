# 🏥 Pharmacy ERP — Pages → Dialogs Migration Plan

> **What this file is**: A complete, step-by-step plan to migrate every CRUD
> (Create / Edit / View) page in the ERP frontend into reusable in-place dialogs
> (using the existing `UIModal` system). This removes ~53 routes, ~120 files, and
> eliminates redundant navigation. After this migration, every module follows one
> pattern: **one list page → dialog for everything**.
>
> **Who is this for**: Any developer or agent picking up a phase of this work.
> Read this file fully before touching any module. Follow one phase at a time.
>
> **Companion files**:
> - `SIMPLIFICATION.md` — overall ERP simplification plan (F01–F24)
> - `PRODUCT.md` — product overview

---

## Table of Contents

1. [Why Dialogs](#1-why-dialogs)
2. [What We Use — Existing UI Primitives](#2-what-we-use--existing-ui-primitives)
3. [Dialog Classification Rule](#3-dialog-classification-rule)
4. [Dialog Component Standard](#4-dialog-component-standard)
5. [UIModal Enhancement Needed First](#5-uimodal-enhancement-needed-first)
6. [Phase 1 — Masters (Quickest Wins)](#phase-1--masters)
7. [Phase 2 — Treasury](#phase-2--treasury)
8. [Phase 3 — Finance COA & Journal Vouchers](#phase-3--finance-coa--journal-vouchers)
9. [Phase 4 — Org & Access Control](#phase-4--org--access-control)
10. [Phase 5 — Parties (Customers & Suppliers)](#phase-5--parties-customers--suppliers)
11. [Phase 6 — Workspace Products (View Dialog Only)](#phase-6--workspace-products-view-dialog-only)
12. [Phase 7 — Shared Dialog Registry & Final Cleanup](#phase-7--shared-dialog-registry--final-cleanup)
13. [Pages That NEVER Become Dialogs](#pages-that-never-become-dialogs)
14. [Full File Deletion Checklist](#full-file-deletion-checklist)
15. [Route Reduction Summary](#route-reduction-summary)
16. [Implementation Rules & Guardrails](#implementation-rules--guardrails)

---

## 1. Why Dialogs

### Current problem (example — Bank Accounts)

```
User clicks "Add Bank Account"
  → navigates to /treasury/bank-accounts/create
    → loads CreateBankAccountPage.jsx
      → renders CreateBankAccountDesktopPage.jsx   (desktop)
      → renders CreateBankAccountMobilePage.jsx    (mobile)
        → fills form → saves → navigates back to /treasury/bank-accounts
          → page reloads list
```

**Files involved per entity**: List Page + Create Page + Edit Page + Details Page
× Desktop variant + Mobile variant = **8–10 files**, **3–4 routes**.

### After dialogs

```
User clicks "Add Bank Account"
  → dialog slides open over the same page
    → fills form → saves → dialog closes → list refreshes in-place
```

**Files involved**: 1 list page + 1 dialog component. **2 files**, **1 route**.

### Benefits

| Benefit | Detail |
|---|---|
| **Speed** | No route transition, no white-screen flash between pages |
| **Less code** | ~120 files deleted, ~20 dialogs added → net −100 files |
| **Fewer routes** | ~73 → ~20 (−53 routes) |
| **Cross-context reuse** | `CustomerDialog` opens from Customers list AND from Billing screen |
| **Mobile simplicity** | One dialog works on both desktop & mobile. No separate `*MobilePage.jsx` for forms |
| **UX consistency** | Every entity follows the same pattern everywhere in the app |

---

## 2. What We Use — Existing UI Primitives

All dialogs are built with these already-existing components. **Do not introduce new libraries**.

### Dialog shell
```js
import {
  UIModal,          // The dialog wrapper — backdrop, spring animation, Esc-to-close
  UIModalHeader,    // px-6 pt-6 pb-2, right-padding for close button
  UIModalTitle,     // h2, bold, text-text
  UIModalDescription, // text-sm text-text-muted
  UIModalBody,      // scrollable, max-h-[70vh], p-6
  UIModalFooter,    // border-t, flex justify-end gap-3
} from '@/components/ui';
```

### Form inputs
```js
import {
  UIInput,          // text fields
  UISelect,         // dropdown fields
  UIDatePicker,     // date fields
  UICheckbox,       // boolean toggles
  UISwitch,         // on/off toggles
  UIFileUpload,     // image/file upload
  UIFormSection,    // groups fields under a section heading
  UIFormActions,    // Cancel + Submit button row (can reuse in footer)
} from '@/components/ui';
```

### View mode (read-only display)
```js
import {
  UIDetailRow,      // single label → value row, supports copyable, badge, mono
  UIKeyValueList,   // renders a list of UIDetailRow items from an array
  UIBadge,          // status chips
  UIStatCard,       // balance / summary numbers
} from '@/components/ui';
```

### Actions and feedback
```js
import {
  UIButton,         // primary / outline / danger / ghost variants
  UIIconButton,     // icon-only button (edit ✏️, view ℹ️, delete 🗑️)
  UIConfirmDialog,  // confirmation before delete — already exists
  UIAlert,          // inline error / warning inside dialog body
  UILoadingState,   // spinner for async loading inside dialog
  UISkeleton,       // skeleton loader while fetching entity for edit/view
} from '@/components/ui';
```

### Icons (use react-icons/fi or lucide-react consistently)
```js
import { FiPlus, FiEdit3, FiEye, FiTrash2, FiX } from 'react-icons/fi';
// OR from lucide-react (check what the list page already uses)
```

---

## 3. Dialog Classification Rule

Before converting any module, apply this decision matrix:

| Criterion | → Dialog ✅ | → Stay as Page ❌ |
|---|---|---|
| Total field count | ≤ 25 fields | > 25 fields |
| Workflow steps | Single step | Multi-step wizard |
| Has complex line-item tables | No (or very small) | Yes (billing lines, PO lines) |
| Needs to be reused cross-context | Yes | No |
| Frequency | Daily or regular | Setup-only (mostly) |

### Entities → Dialog ✅
Customers, Suppliers, Bank Accounts, Fund Transfers, Cheques, Payment QR,
Cash Denominations, Account Groups, Accounts (COA), Financial Periods,
Journal Vouchers, Roles, Company (post-setup), Branch, Shifts, HSN, Manufacturer,
Salt Composition, Category, Product Form, UoM, Bank Master

### Entities → Stay as Page ❌
POS Billing/Terminal, Purchase Bill, Workspace Product (Create/Edit), Workspace Product Import,
Global Products, Settings, Ledger, Account Balances, Opening Balances, Day Closings, Marketplace

---

## 4. Dialog Component Standard

### File location convention
```
src/features/<feature>/<sub-feature>/components/<Entity>Dialog.jsx
```
Examples:
```
src/features/parties/customers/components/CustomerDialog.jsx
src/features/finance/treasury/bank-management/bank-accounts/components/BankAccountDialog.jsx
src/features/finance/chart-of-accounts/account-groups/components/AccountGroupDialog.jsx
src/features/access-control/components/RoleDialog.jsx
```

### Props contract (every dialog uses this shape)
```jsx
<EntityDialog
  isOpen={boolean}          // required — controls open/close
  onClose={function}        // required — called on Esc, backdrop click, Cancel button
  mode={'create'|'edit'|'view'}  // required
  entityId={string|null}    // undefined/null for create; entity _id for edit/view
  onSuccess={function}      // optional — called after successful save, receives saved entity
  // Entity-specific extra props (e.g. defaultSupplierId, defaultAccountGroupId)
/>
```

### Internal structure template
```jsx
import React, { useState, useEffect } from 'react';
import {
  UIModal, UIModalHeader, UIModalTitle, UIModalDescription,
  UIModalBody, UIModalFooter,
  UIFormSection, UIInput, UISelect,
  UIButton, UIAlert, UILoadingState, UISkeleton,
  UIDetailRow, UIKeyValueList,
} from '@/components/ui';

const INITIAL_FORM = {
  fieldName: '',
  // ... all fields
};

export function EntityDialog({ isOpen, onClose, mode, entityId, onSuccess }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [entityData, setEntityData] = useState(null); // for edit/view

  // ── Reset state whenever dialog opens/closes ──────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setFormData(INITIAL_FORM);
      setFormErrors({});
      setServerError(null);
      setEntityData(null);
    }
  }, [isOpen]);

  // ── Fetch entity data for edit or view ────────────────────────────────────
  useEffect(() => {
    if (!isOpen || mode === 'create' || !entityId) return;
    setIsFetching(true);
    // call your existing hook/thunk/service here
    getEntityById(entityId)
      .then((data) => {
        setEntityData(data);
        if (mode === 'edit') {
          setFormData({ /* map data to form fields */ });
        }
      })
      .catch((err) => setServerError(err.message))
      .finally(() => setIsFetching(false));
  }, [isOpen, mode, entityId]);

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errors = {};
    // validation logic
    return errors;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setIsSubmitting(true);
    try {
      const saved = mode === 'create'
        ? await createEntity(formData)
        : await updateEntity(entityId, formData);
      onSuccess?.(saved);
      onClose();
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isView = mode === 'view';
  const isCreate = mode === 'create';
  const title = isCreate ? 'Add Entity' : isView ? 'Entity Details' : 'Edit Entity';

  return (
    <UIModal isOpen={isOpen} onClose={onClose} size="md" mobileSheet>
      <UIModalHeader>
        <UIModalTitle>{title}</UIModalTitle>
        <UIModalDescription>
          {isCreate ? 'Fill in the details below.' : isView ? 'View entity information.' : 'Update the details below.'}
        </UIModalDescription>
      </UIModalHeader>

      <UIModalBody>
        {/* Loading skeleton while fetching for edit/view */}
        {isFetching && <UISkeleton rows={4} />}

        {/* Server error alert */}
        {serverError && !isFetching && (
          <UIAlert variant="error" onDismiss={() => setServerError(null)}>
            {serverError}
          </UIAlert>
        )}

        {/* VIEW MODE — read-only key/value list */}
        {isView && !isFetching && entityData && (
          <UIKeyValueList items={[
            { label: 'Field 1', value: entityData.field1 },
            { label: 'Field 2', value: entityData.field2, copyable: true },
            // ...
          ]} />
        )}

        {/* CREATE / EDIT MODE — form */}
        {!isView && !isFetching && (
          <form id="entity-form" onSubmit={handleSubmit}>
            <UIFormSection title="Section Title">
              <UIInput
                label="Field Label"
                name="fieldName"
                value={formData.fieldName}
                onChange={(e) => handleFieldChange('fieldName', e.target.value)}
                error={Boolean(formErrors.fieldName)}
                helperText={formErrors.fieldName}
                required
              />
              {/* more fields */}
            </UIFormSection>
          </form>
        )}
      </UIModalBody>

      <UIModalFooter>
        <UIButton variant="outline" onClick={onClose} disabled={isSubmitting}>
          {isView ? 'Close' : 'Cancel'}
        </UIButton>
        {isView ? (
          <UIButton variant="primary" onClick={() => { /* switch to edit mode or open edit */ }}>
            Edit
          </UIButton>
        ) : (
          <UIButton
            variant="primary"
            type="submit"
            form="entity-form"
            isLoading={isSubmitting}
          >
            {isCreate ? 'Create' : 'Save Changes'}
          </UIButton>
        )}
      </UIModalFooter>
    </UIModal>
  );
}
```

### How to open from the list page
```jsx
// In EntityListPage.jsx
const [dialogState, setDialogState] = useState({
  isOpen: false,
  mode: 'create',
  entityId: null,
});

const openCreate = () => setDialogState({ isOpen: true, mode: 'create', entityId: null });
const openEdit = (id) => setDialogState({ isOpen: true, mode: 'edit', entityId: id });
const openView = (id) => setDialogState({ isOpen: true, mode: 'view', entityId: id });
const closeDialog = () => setDialogState((prev) => ({ ...prev, isOpen: false }));

// In the JSX:
<UIButton onClick={openCreate}>+ Add Entity</UIButton>

// In table row action buttons:
<UIIconButton icon={<FiEye />} onClick={() => openView(row._id)} tooltip="View" />
<UIIconButton icon={<FiEdit3 />} onClick={() => openEdit(row._id)} tooltip="Edit" />

// Dialog:
<EntityDialog
  isOpen={dialogState.isOpen}
  onClose={closeDialog}
  mode={dialogState.mode}
  entityId={dialogState.entityId}
  onSuccess={(saved) => {
    refreshList();
    showToast('Saved successfully');
  }}
/>
```

### How to open from other pages (cross-context)
```jsx
// In POSTerminalPage.jsx — view customer from billing
import { CustomerDialog } from '@/features/parties/customers/components/CustomerDialog';

const [customerDialogState, setCustomerDialogState] = useState({ isOpen: false, customerId: null });

// When user clicks ℹ️ next to a selected customer:
<UIIconButton
  icon={<FiInfo />}
  onClick={() => setCustomerDialogState({ isOpen: true, customerId: selectedCustomer._id })}
  tooltip="View Customer"
/>

<CustomerDialog
  isOpen={customerDialogState.isOpen}
  onClose={() => setCustomerDialogState({ isOpen: false, customerId: null })}
  mode="view"
  entityId={customerDialogState.customerId}
/>
```

---

## 5. UIModal Enhancement Needed First

**Before implementing any dialogs**, add the `mobileSheet` prop to `UIModal`.
This makes dialogs behave as bottom-sheets on mobile (slide up from bottom).

**File**: `src/components/ui/UIModal.jsx`

**Changes needed**:

```jsx
// 1. Add mobileSheet to the props destructuring:
{
  isOpen = false,
  onClose,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
  showCloseButton = true,
  mobileSheet = false,   // ← ADD THIS
  children,
  className,
  overlayClassName,
  ...props
}

// 2. Change outer wrapper className:
// BEFORE:
className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
// AFTER:
className={cn(
  "fixed inset-0 z-50 flex p-4 sm:p-6 overflow-y-auto",
  mobileSheet ? "items-end sm:items-center" : "items-center justify-center"
)}

// 3. Change modal card className (add mobile rounding variant):
// BEFORE:
className={cn(
  "relative w-full bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col font-sans",
  appliedSize, className
)}
// AFTER:
className={cn(
  "relative w-full bg-surface border border-border shadow-2xl overflow-hidden z-10 flex flex-col font-sans",
  mobileSheet ? "rounded-t-3xl sm:rounded-3xl" : "rounded-3xl",
  appliedSize, className
)}
```

**Optional**: Add a drag-handle bar at the top of mobile sheets:
```jsx
{mobileSheet && (
  <div className="flex justify-center pt-3 pb-1 sm:hidden">
    <div className="w-10 h-1 rounded-full bg-border" />
  </div>
)}
```

> **Do this step first** (Task P0-T1) before any phase begins.

---

## Phase 1 — Masters

> **Goal**: Convert all master data modules to dialogs. These are the simplest forms
> (2–4 fields each). Do these first to learn the pattern.
>
> **Priority**: Highest — fewest dependencies, fastest to implement.

---

### M01 — HSN Codes

**Feature path**: `src/features/hsn-master/`

**Current state**:
- `pages/HsnMasterPage.jsx` — list page (may have inline create or navigate to create)
- `pages/desktop/HsnMasterDesktopPage.jsx`
- `pages/mobile/HsnMasterMobilePage.jsx`
- Check if create/edit pages exist under `pages/`

**Form fields** (total: 3 fields):
| Field | Type | Required |
|---|---|---|
| HSN Code | text | ✅ |
| Description | text | ✅ |
| GST Rate (%) | number | ✅ |

**Dialog spec**:
- Size: `sm` (`max-w-md`)
- mobileSheet: `true`
- Modes: `create`, `edit`, `view`

**New file to create**:
```
src/features/hsn-master/components/HsnDialog.jsx
```

**Tasks**:
- [ ] **M01-T1**: Create `HsnDialog.jsx` with create/edit/view modes using the standard template above
- [ ] **M01-T2**: Update `HsnMasterPage.jsx` — replace `navigate(ROUTES.CREATE_HSN)` with `setDialogState({ isOpen: true, mode: 'create' })`; add ℹ️ and ✏️ icon buttons to table rows
- [ ] **M01-T3**: Update `pages/desktop/HsnMasterDesktopPage.jsx` and `pages/mobile/HsnMasterMobilePage.jsx` to receive dialog state handlers from the parent instead of using `navigate`
- [ ] **M01-T4**: Remove create/edit/details routes from `hsnRoutes.jsx` (if they exist), keep the list route
- [ ] **M01-T5**: Delete create/edit/details page files (if they exist)

**Routes file**: `src/features/hsn-master/routes/` — remove all except list route.

---

### M02 — Manufacturers

**Feature path**: `src/features/manufacturer-master/`

**Form fields** (total: 3–4 fields):
| Field | Type | Required |
|---|---|---|
| Manufacturer Name | text | ✅ |
| Country | text/select | ❌ |
| Contact / Phone | text | ❌ |
| Website | text | ❌ |

**Dialog spec**:
- Size: `sm`
- mobileSheet: `true`

**New file**:
```
src/features/manufacturer-master/components/ManufacturerDialog.jsx
```

**Tasks**:
- [ ] **M02-T1**: Create `ManufacturerDialog.jsx`
- [ ] **M02-T2**: Update `ManufacturerMasterPage.jsx` to use dialog
- [ ] **M02-T3**: Update desktop/mobile page files
- [ ] **M02-T4**: Remove create/edit/details routes
- [ ] **M02-T5**: Delete old page files

---

### M03 — Salt Compositions

**Feature path**: `src/features/salt-master/`

**Form fields** (total: 2–3 fields):
| Field | Type | Required |
|---|---|---|
| Salt Name / Composition | text | ✅ |
| Common Uses | text | ❌ |
| Status | select (Active/Inactive) | ✅ |

**Dialog spec**: Size `sm`, mobileSheet `true`

**New file**:
```
src/features/salt-master/components/SaltDialog.jsx
```

**Tasks**:
- [ ] **M03-T1**: Create `SaltDialog.jsx`
- [ ] **M03-T2**: Update list page to use dialog
- [ ] **M03-T3**: Remove routes, delete old pages

---

### M04 — Categories

**Feature path**: `src/features/category-master/`

**Form fields** (total: 2–3 fields):
| Field | Type | Required |
|---|---|---|
| Category Name | text | ✅ |
| Description | text | ❌ |
| Status | select | ✅ |

**Dialog spec**: Size `sm`, mobileSheet `true`

**New file**:
```
src/features/category-master/components/CategoryDialog.jsx
```

**Tasks**:
- [ ] **M04-T1**: Create `CategoryDialog.jsx`
- [ ] **M04-T2**: Update list page
- [ ] **M04-T3**: Remove routes, delete old pages

---

### M05 — Product Forms

**Feature path**: `src/features/product-form-master/`

**Form fields** (total: 2–3 fields):
| Field | Type | Required |
|---|---|---|
| Form Name (Tablet, Syrup, etc.) | text | ✅ |
| Abbreviation | text | ❌ |
| Status | select | ✅ |

**Dialog spec**: Size `sm`, mobileSheet `true`

**New file**:
```
src/features/product-form-master/components/ProductFormDialog.jsx
```

**Tasks**:
- [ ] **M05-T1**: Create `ProductFormDialog.jsx`
- [ ] **M05-T2**: Update list page
- [ ] **M05-T3**: Remove routes, delete old pages

---

### M06 — Units of Measure (UoM)

**Feature path**: `src/features/uom-master/`

**Form fields** (total: 2–3 fields):
| Field | Type | Required |
|---|---|---|
| Unit Name (Strip, Bottle, etc.) | text | ✅ |
| Symbol (e.g. "Str", "Bot") | text | ❌ |
| Status | select | ✅ |

**Dialog spec**: Size `sm`, mobileSheet `true`

**New file**:
```
src/features/uom-master/components/UomDialog.jsx
```

**Tasks**:
- [ ] **M06-T1**: Create `UomDialog.jsx`
- [ ] **M06-T2**: Update list page
- [ ] **M06-T3**: Remove routes, delete old pages

---

### M07 — Bank Master (Banks Directory)

**Feature path**: `src/features/bank-master/`

**Form fields** (total: 3–4 fields):
| Field | Type | Required |
|---|---|---|
| Bank Name | text | ✅ |
| IFSC Prefix (first 4 chars) | text | ❌ |
| Short Code | text | ❌ |
| Status | select | ✅ |

**Dialog spec**: Size `sm`, mobileSheet `true`

**New file**:
```
src/features/bank-master/components/BankMasterDialog.jsx
```

**Tasks**:
- [ ] **M07-T1**: Create `BankMasterDialog.jsx`
- [ ] **M07-T2**: Update BankMasterPage
- [ ] **M07-T3**: Remove routes, delete old pages

---

## Phase 2 — Treasury

> **Goal**: Convert all Treasury sub-modules. These are still simple forms
> but involve financial data and require care around state.
>
> **Start after Phase 1 is complete and UIModal `mobileSheet` is working.**

---

### T01 — Financial Periods

**Feature path**: `src/features/finance/financial-periods/`

**Current files** (to delete after migration):
```
pages/CreateFinancialPeriodPage.jsx            ← DELETE
pages/desktop/CreateFinancialPeriodDesktopPage.jsx  ← DELETE
pages/mobile/CreateFinancialPeriodMobilePage.jsx    ← DELETE
```
**Keep**: `pages/FinancialPeriodsPage.jsx`

**Form fields** (total: 4 fields):
| Field | Type | Required | Notes |
|---|---|---|---|
| Period Name | text | ✅ | e.g. "FY 2025-26" |
| Start Date | date | ✅ | Auto-fills April 1 of current FY |
| End Date | date | ✅ | Auto-fills March 31 of next FY |
| Period Type | select | ✅ | Only show "Year" (F11 from SIMPLIFICATION.md) |

**Auto-fill logic** (put inside `useEffect` when `mode === 'create'`):
```js
const today = new Date();
const fyYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
const startDate = `${fyYear}-04-01`;
const endDate = `${fyYear + 1}-03-31`;
const periodName = `FY ${fyYear}-${String(fyYear + 1).slice(2)}`;
```

**View mode**: Shows period name, date range, status (OPEN / CLOSED), journal entry count.
In `view` mode, also show an action button: "Close Period" (if OPEN) or "Re-open" (if CLOSED).

**Dialog spec**:
- Size: `md`
- mobileSheet: `true`
- Modes: `create`, `view` (no edit — periods are financial records)

**New file**:
```
src/features/finance/financial-periods/components/FinancialPeriodDialog.jsx
```

**Routes to remove** from `financialPeriodRoutes.jsx`:
```js
// REMOVE:
{ path: ROUTES.CREATE_FINANCIAL_PERIOD, element: <CreateFinancialPeriodPage /> }
// KEEP:
{ path: ROUTES.FINANCIAL_PERIODS, element: <FinancialPeriodsPage /> }
```

**Tasks**:
- [ ] **T01-T1**: Create `FinancialPeriodDialog.jsx` with create + view modes (no edit)
- [ ] **T01-T2**: Update `FinancialPeriodsPage.jsx` — "+ New Period" → opens dialog; row click → opens view dialog
- [ ] **T01-T3**: Remove create route from `financialPeriodRoutes.jsx`
- [ ] **T01-T4**: Delete 3 create page files

---

### T02 — Bank Accounts

**Feature path**: `src/features/finance/treasury/bank-management/bank-accounts/`

**Current files** (to delete after migration):
```
pages/CreateBankAccountPage.jsx                ← DELETE
pages/EditBankAccountPage.jsx                  ← DELETE
pages/BankAccountDetailsPage.jsx               ← DELETE
pages/desktop/CreateBankAccountDesktopPage.jsx ← DELETE
pages/desktop/EditBankAccountDesktopPage.jsx   ← DELETE
pages/desktop/BankAccountDetailsDesktopPage.jsx← DELETE
pages/mobile/CreateBankAccountMobilePage.jsx   ← DELETE
pages/mobile/EditBankAccountMobilePage.jsx     ← DELETE
pages/mobile/BankAccountDetailsMobilePage.jsx  ← DELETE
```
**Keep**: `pages/BankAccountsPage.jsx`, `pages/desktop/BankAccountsDesktopPage.jsx`, `pages/mobile/BankAccountsMobilePage.jsx`

**Form fields** (total: 8 fields — confirmed from `CreateBankAccountDesktopPage.jsx`):
| Field | Type | Required | Notes |
|---|---|---|---|
| Bank (from Bank Master) | select | ✅ | `bankMasterId` |
| Account Nickname / Name | text | ✅ | `accountName` |
| Account Holder Name | text | ✅ | `accountHolderName` |
| Account Number | text | ✅ | `accountNumber` |
| IFSC Code | text (uppercase) | ✅ | `ifscCode` |
| Branch Name | text | ✅ | `branchName` |
| Account Type | select | ✅ | Current / Savings |
| Is Primary Account | switch/boolean | ❌ | `isPrimary` |

**View mode** shows: bank name, account name, account number (copyable), IFSC (copyable), branch, type, primary badge, current balance (from ledger), status.

**Dialog spec**:
- Size: `lg` (max-w-2xl)
- mobileSheet: `true`
- Modes: `create`, `edit`, `view`

**New file**:
```
src/features/finance/treasury/bank-management/bank-accounts/components/BankAccountDialog.jsx
```

**Routes to change** in `bankAccountRoutes.jsx`:
```js
// BEFORE (4 routes):
{ path: ROUTES.BANK_ACCOUNTS,           element: <BankAccountsPage /> },
{ path: ROUTES.CREATE_BANK_ACCOUNT,     element: <CreateBankAccountPage /> },
{ path: ROUTES.BANK_ACCOUNT_DETAILS(),  element: <BankAccountDetailsPage /> },
{ path: ROUTES.EDIT_BANK_ACCOUNT(),     element: <EditBankAccountPage /> },

// AFTER (1 route):
{ path: ROUTES.BANK_ACCOUNTS, element: <BankAccountsPage /> },
```

**How to update `BankAccountsPage.jsx`**:
```js
// REMOVE these navigate calls:
const handleAddAccount = () => navigate(ROUTES.CREATE_BANK_ACCOUNT);    // ← REMOVE
const handleEditAccount = (account) => navigate(ROUTES.EDIT_BANK_ACCOUNT(account._id));  // ← REMOVE
const handleViewDetails = (account) => navigate(ROUTES.BANK_ACCOUNT_DETAILS(account._id)); // ← REMOVE

// REPLACE with dialog state:
const [dialogState, setDialogState] = useState({ isOpen: false, mode: 'create', entityId: null });
const openCreate = () => setDialogState({ isOpen: true, mode: 'create', entityId: null });
const openEdit = (account) => setDialogState({ isOpen: true, mode: 'edit', entityId: account._id });
const openView = (account) => setDialogState({ isOpen: true, mode: 'view', entityId: account._id });
const closeDialog = () => setDialogState((prev) => ({ ...prev, isOpen: false }));
```

**Cross-context use**: `BankAccountDialog` imported in:
- `FundTransfersPage.jsx` — ℹ️ next to from/to account selectors → view mode
- (future) Dashboard → quick bank balance view

**Tasks**:
- [x] **T02-T1**: Create `BankAccountDialog.jsx` with create/edit/view modes
- [x] **T02-T2**: Update `BankAccountsPage.jsx` — replace navigate calls with dialog state
- [x] **T02-T3**: Update `BankAccountsDesktopPage.jsx` and `BankAccountsMobilePage.jsx` — receive new dialog handlers in props
- [x] **T02-T4**: Update `bankAccountRoutes.jsx` — remove 3 routes, keep 1
- [x] **T02-T5**: Delete 9 page files listed above

---

### T03 — Fund Transfers

**Feature path**: `src/features/finance/treasury/fund-transfers/`

**Current files** (to delete):
```
pages/CreateFundTransferPage.jsx              ← DELETE
pages/FundTransferDetailsPage.jsx             ← DELETE
pages/desktop/CreateFundTransferDesktopPage.jsx ← DELETE
pages/desktop/FundTransferDetailsDesktopPage.jsx ← DELETE
pages/mobile/CreateFundTransferMobilePage.jsx   ← DELETE
pages/mobile/FundTransferDetailsMobilePage.jsx  ← DELETE
```
**Keep**: `FundTransfersPage.jsx`

**Form fields** (total: 5 fields):
| Field | Type | Required | Notes |
|---|---|---|---|
| From Account | select | ✅ | bank accounts list |
| To Account | select | ✅ | bank accounts list |
| Amount | number | ✅ | in ₹ |
| Transfer Date | date | ✅ | defaults to today |
| Notes / Narration | text | ❌ | |

> **Important**: Fund transfers are financial records. No edit — only create and view.

**View mode**: Shows from/to account names, amount, date, reference number, narration.
Both account names should have a ℹ️ icon that opens `BankAccountDialog` in view mode.

**Dialog spec**:
- Size: `sm` (max-w-md)
- mobileSheet: `true`
- Modes: `create`, `view` (no edit)

**New file**:
```
src/features/finance/treasury/fund-transfers/components/FundTransferDialog.jsx
```

**Tasks**:
- [ ] **T03-T1**: Create `FundTransferDialog.jsx`
- [ ] **T03-T2**: Update `FundTransfersPage.jsx`
- [ ] **T03-T3**: Remove routes, delete page files

---

### T04 — Cheques

**Feature path**: `src/features/finance/treasury/cheque-management/`

**Form fields** (total: 6 fields):
| Field | Type | Required | Notes |
|---|---|---|---|
| Cheque Number | text | ✅ | |
| Party Name | text | ✅ | payer or payee |
| Bank Account | select | ✅ | from bank accounts list |
| Amount | number | ✅ | |
| Cheque Date | date | ✅ | |
| Type | select | ✅ | Received / Issued |

**View mode**: Shows all fields + Status (Pending / Cleared / Bounced) with action buttons
"Mark as Cleared" and "Mark as Bounced" (if status is Pending).

**Dialog spec**:
- Size: `md`
- mobileSheet: `true`
- Modes: `create`, `view` (no edit — cheques are financial records)

**New file**:
```
src/features/finance/treasury/cheque-management/components/ChequeDialog.jsx
```

**Tasks**:
- [x] **T04-T1**: Create `ChequeDialog.jsx`
- [x] **T04-T2**: Update `ChequesPage.jsx`
- [x] **T04-T3**: Remove routes, delete page files

---

### T05 — Payment QR (UPI / QR Codes)

**Feature path**: `src/features/finance/treasury/payment-qr/`

**Current files** (to delete):
```
pages/CreatePaymentQrPage.jsx                ← DELETE
pages/EditPaymentQrPage.jsx                  ← DELETE
pages/PaymentQrDetailsPage.jsx               ← DELETE
pages/desktop/* (3 variants)                 ← DELETE
pages/mobile/* (3 variants)                  ← DELETE
```
**Keep**: `PaymentQrsPage.jsx`

**Form fields** (total: 4 fields):
| Field | Type | Required | Notes |
|---|---|---|---|
| Name / Label | text | ✅ | e.g. "HDFC UPI" |
| UPI ID | text | ✅ | e.g. "pharmacy@hdfcbank" |
| Description | text | ❌ | |
| QR Code Image | file upload | ❌ | use `UIFileUpload` |

**View mode**: Shows name, UPI ID (copyable), QR code image displayed large (≥200×200px).
A "Share QR" button to download the QR image.

**Dialog spec**:
- Size: `md`
- mobileSheet: `true`
- Modes: `create`, `edit`, `view`

**New file**:
```
src/features/finance/treasury/payment-qr/components/PaymentQrDialog.jsx
```

**Tasks**:
- [x] **T05-T1**: Create `PaymentQrDialog.jsx`
- [x] **T05-T2**: Update `PaymentQrsPage.jsx`
- [x] **T05-T3**: Remove 3 routes, delete 9 page files

---

### T06 — Cash Denominations

**Feature path**: `src/features/finance/treasury/cash-management/cash-denominations/`

**Form fields**: Denomination entry — a grid of denomination × count:
| Denomination | Count field |
|---|---|
| ₹500 | number input |
| ₹200 | number input |
| ₹100 | number input |
| ₹50 | number input |
| ₹20 | number input |
| ₹10 | number input |
| ₹5 | number input |
| ₹2 | number input |
| ₹1 | number input |
| Total (auto-calculated) | read-only |

**Dialog spec**:
- Size: `md`
- mobileSheet: `true`
- Grid layout: 2-column (Denomination label | Count input)
- Total shown in footer above action buttons

**New file**:
```
src/features/finance/treasury/cash-management/cash-denominations/components/CashDenominationDialog.jsx
```

**Tasks**:
- [ ] **T06-T1**: Create `CashDenominationDialog.jsx`
- [ ] **T06-T2**: Update the denomination list page
- [ ] **T06-T3**: Remove routes, delete old pages

---

## Phase 3 — Finance COA & Journal Vouchers

> **Goal**: Convert Chart of Accounts (Account Groups, Accounts) and Journal Vouchers.

---

### F01 — Account Groups

**Feature path**: `src/features/finance/chart-of-accounts/account-groups/`

**Current files** (to delete):
```
pages/CreateAccountGroupPage.jsx               ← DELETE
pages/EditAccountGroupPage.jsx                 ← DELETE
pages/AccountGroupDetailsPage.jsx              ← DELETE
pages/desktop/CreateAccountGroupDesktopPage.jsx ← DELETE
pages/desktop/EditAccountGroupDesktopPage.jsx   ← DELETE
pages/desktop/AccountGroupDetailsDesktopPage.jsx← DELETE
pages/mobile/* (3 files)                       ← DELETE
```
**Keep**: `AccountGroupsPage.jsx`

**Form fields** (total: 4 fields):
| Field | Type | Required | Notes |
|---|---|---|---|
| Group Name | text | ✅ | e.g. "Cash & Bank" |
| Group Code | text | ✅ | auto-generated or manual |
| Nature | select | ✅ | ASSET / LIABILITY / INCOME / EXPENSE / EQUITY |
| Description | text | ❌ | |

> **Per SIMPLIFICATION.md F02**: No `parentGroupId` field in the form.
> Show a flat list of groups. The `parentGroupId` stays in the DB but is not shown in UI.

**View mode**: Name, Code, Nature badge, account count, status.

**Dialog spec**:
- Size: `sm`
- mobileSheet: `true`
- Modes: `create`, `edit`, `view`

**New file**:
```
src/features/finance/chart-of-accounts/account-groups/components/AccountGroupDialog.jsx
```

**Tasks**:
- [x] **F01-T1**: Create `AccountGroupDialog.jsx`
- [x] **F01-T2**: Update `AccountGroupsPage.jsx`
- [x] **F01-T3**: Remove routes, delete 9 page files

---

### F02 — Accounts (Chart of Accounts)

**Feature path**: `src/features/finance/chart-of-accounts/accounts/`

**Current files** (to delete):
```
pages/CreateAccountPage.jsx          ← DELETE
pages/EditAccountPage.jsx            ← DELETE
pages/AccountDetailsPage.jsx         ← DELETE
pages/desktop/* (3 files)            ← DELETE
pages/mobile/* (3 files)             ← DELETE
```

**Form fields** (total: ~8 fields after F03/F04 from SIMPLIFICATION.md):
| Field | Type | Required | Notes |
|---|---|---|---|
| Account Group | select | ✅ | triggers nature badge |
| Account Name | text | ✅ | |
| Account Code | text | ✅ | auto-generated or manual |
| Category | select | ✅ | filtered by group nature (F04) |
| Nature | read-only badge | — | auto-derived from group (F03 — not an input) |
| Opening Balance | number | ❌ | |
| Balance Type | select | ❌ | Dr / Cr |
| Description | text | ❌ | |

**Nature auto-derive** (from F03):
```js
// When group is selected, show nature as a badge — not a form field
const selectedGroup = accountGroups.find(g => g._id === formData.accountGroupId);
const natureBadge = selectedGroup?.nature; // show this as UIBadge, not UISelect
```

**Category filter by group nature** (from F04):
```js
// Filtered options based on selectedGroup.nature
const categoryMap = {
  ASSET:     ['CASH', 'BANK', 'CUSTOMER', 'INVENTORY', 'FIXED_ASSET'],
  LIABILITY: ['SUPPLIER', 'GST', 'LIABILITY'],
  INCOME:    ['SALES', 'INCOME'],
  EXPENSE:   ['PURCHASE', 'EXPENSE'],
  EQUITY:    ['EQUITY'],
};
```

**View mode**: Account name, code, group, category badge, nature badge, opening balance, current balance.

**Dialog spec**:
- Size: `md`
- mobileSheet: `true`
- Modes: `create`, `edit`, `view`

**New file**:
```
src/features/finance/chart-of-accounts/accounts/components/AccountDialog.jsx
```

**Tasks**:
- [x] **F02-T1**: Create `AccountDialog.jsx` with nature auto-derive and category filter
- [x] **F02-T2**: Update `AccountsPage.jsx` and `AccountBalancesPage.jsx`
- [x] **F02-T3**: Remove routes, delete 9 page files

---

### F03 — Journal Vouchers (Manual Adjustments)

**Feature path**: `src/features/finance/journal-vouchers/`

**Current files** (to delete):
```
pages/CreateJournalVoucherPage.jsx          ← DELETE
pages/EditJournalVoucherPage.jsx            ← DELETE
pages/JournalVoucherDetailsPage.jsx         ← DELETE
pages/desktop/* (3 files)                   ← DELETE
pages/mobile/* (3 files)                    ← DELETE
```

**Form fields** (total: ~6 fields + line-item table):
| Field | Type | Required | Notes |
|---|---|---|---|
| Voucher Type | select | ✅ | See renamed types below |
| Date | date | ✅ | defaults to today |
| Reference / Voucher No | text | ❌ | auto-generated |
| Narration | text | ✅ | description of entry |
| **Debit/Credit Entries** | table | ✅ | min 2 rows (one debit, one credit) |
| — Account | select | ✅ | from accounts list |
| — Dr Amount | number | — | |
| — Cr Amount | number | — | |

**Voucher type labels** (from SIMPLIFICATION.md F12):
```js
const voucherTypeOptions = [
  { value: 'JOURNAL',          label: 'Adjustment Entry' },
  { value: 'CONTRA',           label: 'Cash Transfer' },
  { value: 'PAYMENT',          label: 'Payment Made' },
  { value: 'RECEIPT',          label: 'Payment Received' },
  { value: 'OPENING_BALANCE',  label: 'Opening Balance' },
];
```

**Auto-post on save** (from SIMPLIFICATION.md F12):
```js
// When submitting, always include status: 'POSTED'
const payload = { ...formData, status: 'POSTED' };
```

**View mode**: Voucher type, date, narration, all debit/credit entries in a clean table,
total debits = total credits (validated), status badge (POSTED / DRAFT).

**Dialog spec**:
- Size: `xl` (max-w-4xl) — needs space for the line-item table
- mobileSheet: `true` — on mobile the line-item table scrolls horizontally
- Modes: `create`, `edit`, `view`

**New file**:
```
src/features/finance/journal-vouchers/components/JournalVoucherDialog.jsx
```

**Tasks**:
- [x] **F03-T1**: Create `JournalVoucherDialog.jsx` with debit/credit table
- [x] **F03-T2**: Update `JournalVouchersPage.jsx`
- [x] **F03-T3**: Remove routes, delete 9 page files


---

## Phase 4 — Org & Access Control

> **Goal**: Convert Company, Branch, Shifts, and Roles to dialogs.

---

### O01 — Company

**Feature path**: `src/features/company/`

**Current files** (to delete — post-setup nav only, setup flow pages stay):
```
pages/CreateCompanyPage.jsx          ← DELETE (post-setup nav only)
pages/EditCompanyPage.jsx            ← DELETE
pages/CompanyDetailsPage.jsx         ← DELETE
pages/desktop/* (create, edit, details) ← DELETE
pages/mobile/* (create, edit, details)  ← DELETE
```
> **Keep**: `CompaniesPage.jsx` — used in Settings → My Pharmacy tab.
> **Keep untouched**: Any pages used during the onboarding/setup flow.

**Form fields** (total: ~15 fields — fits `lg` modal):
| Field | Type | Required |
|---|---|---|
| Company Name | text | ✅ |
| Business Type (Pharmacy / Medical) | select | ✅ |
| GSTIN | text | ❌ |
| PAN Number | text | ❌ |
| Drug License No | text | ❌ |
| Email | email | ❌ |
| Phone | text | ✅ |
| Address Line 1 | text | ✅ |
| Address Line 2 | text | ❌ |
| City | text | ✅ |
| State | select | ✅ |
| Pincode | text | ✅ |
| Logo | file upload | ❌ |

**View mode**: All company details in a clean UIKeyValueList. Logo shown prominently.

**Dialog spec**:
- Size: `lg` (max-w-2xl)
- mobileSheet: `true`
- Modes: `create` (rare — usually one company), `edit`, `view`

**New file**:
```
src/features/company/components/CompanyDialog.jsx
```

**Tasks**:
- [ ] **O01-T1**: Create `CompanyDialog.jsx` *(Skipped — kept as full page per user preference)*
- [ ] **O01-T2**: Update `CompaniesPage.jsx` + Settings → My Pharmacy tab *(Skipped — kept as full page)*
- [ ] **O01-T3**: Remove post-setup create/edit/details routes *(Skipped)*
- [ ] **O01-T4**: Delete post-setup page files *(Skipped)*

---

### O02 — Branch

**Feature path**: `src/features/branch/`

**Form fields** (total: ~10 fields):
| Field | Type | Required |
|---|---|---|
| Branch Name | text | ✅ |
| Branch Code | text | ✅ |
| Email | email | ❌ |
| Phone | text | ✅ |
| Address Line 1 | text | ✅ |
| City | text | ✅ |
| State | select | ✅ |
| Pincode | text | ✅ |
| Is Default Branch | switch | ❌ |
| Status | select | ✅ |

**Dialog spec**:
- Size: `lg`
- mobileSheet: `true`
- Modes: `create`, `edit`, `view`

**New file**:
```
src/features/branch/components/BranchDialog.jsx
```

**Tasks**:
- [ ] **O02-T1**: Create `BranchDialog.jsx` *(Skipped — kept as full page per user preference)*
- [ ] **O02-T2**: Update `BranchesPage.jsx` *(Skipped)*
- [ ] **O02-T3**: Remove routes, delete 9 page files *(Skipped)*

---

### O03 — Shifts

**Feature path**: `src/features/operations/shifts/`

**Form fields** (total: 4 fields):
| Field | Type | Required |
|---|---|---|
| Shift Name | text | ✅ | e.g. "Morning" |
| Start Time | time | ✅ | |
| End Time | time | ✅ | |
| Break Duration (minutes) | number | ❌ | |

**Dialog spec**:
- Size: `sm`
- mobileSheet: `true`
- Modes: `create`, `edit`, `view`

**New file**:
```
src/features/operations/shifts/components/ShiftDialog.jsx
```

**Tasks**:
- [x] **O03-T1**: Create `ShiftDialog.jsx` / `CreateShiftDialog.jsx`
- [x] **O03-T2**: Update `ShiftsPage.jsx`
- [x] **O03-T3**: Remove routes, delete page files

---

### O04 — Roles

**Feature path**: `src/features/access-control/`

**Current files** (to delete):
```
pages/CreateRolePage.jsx           ← DELETE
pages/EditRolePage.jsx             ← DELETE
pages/RoleDetailsPage.jsx          ← DELETE
pages/desktop/* (3 files)          ← DELETE
pages/mobile/* (3 files)           ← DELETE
```
**Keep**: `RolesPage.jsx`, `PermissionPage.jsx`

**Form fields — 2-step flow inside the dialog**:

*Step 1 — Choose Template* (from SIMPLIFICATION.md F15):
```
[ Owner ]        — Full access to everything
[ Pharmacist ]   — Billing, Stock, Customers, Receipts
[ Accountant ]   — Finance, Reports, Payments, Ledger (no POS)
[ Store Helper ] — Stock view, POS billing only
[ Delivery ]     — View orders, delivery status only
[ Custom ]       — Manual permission selection (current behavior)
```

*Step 2 — Role Details + Permissions*:
| Field | Type | Required |
|---|---|---|
| Role Name | text | ✅ |
| Description | text | ❌ |
| Permissions (checkboxes grouped by module) | multi-select | ✅ |

**Template constants file to create**:
```
src/features/access-control/constants/pharmacyRoleTemplates.constant.js
```

```js
export const PHARMACY_ROLE_TEMPLATES = {
  OWNER: {
    label: 'Owner',
    description: 'Full access to everything',
    icon: '👑',
    permissions: ['*'], // all permissions
  },
  PHARMACIST: {
    label: 'Pharmacist',
    description: 'Billing, Stock, Customers, Receipts',
    icon: '💊',
    permissions: ['billing:*', 'inventory:*', 'customer:*', 'receipt:*'],
  },
  ACCOUNTANT: {
    label: 'Accountant',
    description: 'Finance, Reports, Payments, Ledger',
    icon: '📊',
    permissions: ['finance:*', 'report:*', 'payment:*', 'ledger:*'],
  },
  HELPER: {
    label: 'Store Helper',
    description: 'Stock view, POS billing only',
    icon: '🏪',
    permissions: ['billing:create', 'inventory:view'],
  },
  DELIVERY: {
    label: 'Delivery',
    description: 'View orders and delivery status',
    icon: '🛵',
    permissions: ['order:view', 'delivery:*'],
  },
};
```

**Dialog spec**:
- Size: `xl` (max-w-4xl) — needs space for permission checkboxes
- mobileSheet: `true`
- Modes: `create`, `edit`, `view`
- In `create` mode: show template picker step first, then form+permissions

**New files**:
```
src/features/access-control/components/RoleDialog.jsx
src/features/access-control/constants/pharmacyRoleTemplates.constant.js
```

**Tasks**:
- [x] **O04-T1**: Create `pharmacyRoleTemplates.constant.js`
- [x] **O04-T2**: Create `RoleDialog.jsx` with template picker + permissions
- [x] **O04-T3**: Update `RolesPage.jsx`
- [x] **O04-T4**: Remove create/edit/details routes, keep list + PermissionPage routes
- [x] **O04-T5**: Delete 9 page files


---

## Phase 5 — Parties (Customers & Suppliers)

> **Goal**: Convert the two most important cross-context entities.
> **These are done last** because they are used from both their own list page
> AND from Billing (POSTerminalPage) and Purchases. Do Phase 1–4 first so
> the dialog pattern is established before tackling these.

---

### P01 — Customers

**Feature path**: `src/features/parties/customers/`

**Current files** (to delete):
```
pages/CreateCustomerPage.jsx                   ← DELETE
pages/EditCustomerPage.jsx                     ← DELETE
pages/CustomerDetailsPage.jsx                  ← DELETE
pages/desktop/CreateCustomerDesktopPage.jsx    ← DELETE (1238 lines — ~37 KB)
pages/desktop/EditCustomerDesktopPage.jsx      ← DELETE (38 KB)
pages/desktop/CustomerDetailsDesktopPage.jsx   ← DELETE (1127 lines — ~48 KB)
pages/mobile/CreateCustomerMobilePage.jsx      ← DELETE
pages/mobile/EditCustomerMobilePage.jsx        ← DELETE
pages/mobile/CustomerDetailsMobilePage.jsx     ← DELETE
```
**Keep**: `CustomersPage.jsx`, `CustomersDesktopPage.jsx`, `CustomersMobilePage.jsx`

**Form fields** — Customer has multi-step form in current code. Flatten into single-scroll dialog:

*Section 1 — Basic Info*:
| Field | Type | Required |
|---|---|---|
| Customer Name | text | ✅ |
| Customer Type | select | ✅ | Individual / Business |
| Email | email | ❌ |
| Phone | text | ✅ |
| Alternate Phone | text | ❌ |

*Section 2 — Address*:
| Field | Type | Required |
|---|---|---|
| Address Line 1 | text | ❌ |
| City | text | ❌ |
| State | select | ❌ |
| Pincode | text | ❌ |

*Section 3 — GST & Business*:
| Field | Type | Required |
|---|---|---|
| GSTIN | text | ❌ |
| PAN | text | ❌ |

*Section 4 — Opening Balance*:
| Field | Type | Required |
|---|---|---|
| Opening Balance | number | ❌ |
| Balance Type | select | ❌ | Dr (they owe us) / Cr (we owe them) |

**View mode**: Full customer profile — contact, address, GST info, outstanding balance (prominent),
recent sales summary. Add "Edit" and "Record Payment" action buttons in footer.

**Dialog spec**:
- Size: `lg` (max-w-2xl)
- mobileSheet: `true`
- Modes: `create`, `edit`, `view`
- Scrollable body (contact + address fits, ~20 fields total)

**New file**:
```
src/features/parties/customers/components/CustomerDialog.jsx
```

**Routes to change** in `customerRoutes.jsx`:
```js
// BEFORE (4 routes):
{ path: ROUTES.CUSTOMERS,          element: <CustomersPage /> },
{ path: ROUTES.CREATE_CUSTOMER,    element: <CreateCustomerPage /> },
{ path: ROUTES.CUSTOMER_DETAILS(), element: <CustomerDetailsPage /> },
{ path: ROUTES.EDIT_CUSTOMER(),    element: <EditCustomerPage /> },

// AFTER (1 route):
{ path: ROUTES.CUSTOMERS, element: <CustomersPage /> },
```

**Cross-context use — Billing (POSTerminalPage)**:
```jsx
// In src/features/billing/pages/POSTerminalPage.jsx
// When a customer is selected in the billing screen, show ℹ️ icon beside their name

import { CustomerDialog } from '@/features/parties/customers/components/CustomerDialog';

// Add to component state:
const [customerViewDialogOpen, setCustomerViewDialogOpen] = useState(false);
const [viewCustomerId, setViewCustomerId] = useState(null);

// In customer selector JSX, beside the selected customer name:
{selectedCustomer && (
  <UIIconButton
    icon={<FiInfo size={14} />}
    onClick={() => {
      setViewCustomerId(selectedCustomer._id);
      setCustomerViewDialogOpen(true);
    }}
    tooltip="View Customer Details"
    size="xs"
  />
)}

// At the bottom of POSTerminalPage JSX:
<CustomerDialog
  isOpen={customerViewDialogOpen}
  onClose={() => setCustomerViewDialogOpen(false)}
  mode="view"
  entityId={viewCustomerId}
/>
```

**Tasks**:
- [x] **P01-T1**: Create `CustomerDialog.jsx` with create/edit/view + all 4 sections
- [x] **P01-T2**: Update `CustomersPage.jsx` — replace navigate with dialog state
- [x] **P01-T3**: Update `CustomersDesktopPage.jsx` + `CustomersMobilePage.jsx` — new props
- [x] **P01-T4**: Add `CustomerDialog` view mode to `POSTerminalPage.jsx` with ℹ️ button
- [x] **P01-T5**: Update `customerRoutes.jsx` — remove 3 routes
- [x] **P01-T6**: Delete 9 page files

---

### P02 — Suppliers

**Feature path**: `src/features/parties/suppliers/`

**Same pattern as Customers.** Supplier has similar sections.

**Form fields**:
*Section 1 — Basic Info*: Name, Type (Distributor/Manufacturer/Wholesale), Email, Phone
*Section 2 — Address*: Address, City, State, Pincode
*Section 3 — GST & Business*: GSTIN, PAN, Drug License No, Bank details for payment
*Section 4 — Opening Balance*: Opening balance, balance type

**View mode**: Supplier profile — contact, address, bank details for payment, outstanding payable (prominent).
Footer actions: "Edit", "Record Payment to Supplier".

**Dialog spec**:
- Size: `lg`
- mobileSheet: `true`
- Modes: `create`, `edit`, `view`

**New file**:
```
src/features/parties/suppliers/components/SupplierDialog.jsx
```

**Cross-context use — Purchases**:
```jsx
// In any purchase bill page — when supplier is selected, show ℹ️ icon
<SupplierDialog
  isOpen={supplierViewDialogOpen}
  onClose={() => setSupplierViewDialogOpen(false)}
  mode="view"
  entityId={viewSupplierId}
/>
```

**Tasks**:
- [x] **P02-T1**: Create `SupplierDialog.jsx`
- [x] **P02-T2**: Update `SuppliersPage.jsx`
- [x] **P02-T3**: Update desktop/mobile list pages
- [x] **P02-T4**: Add `SupplierDialog` view to purchase pages
- [x] **P02-T5**: Remove 3 routes
- [x] **P02-T6**: Delete 9 page files

---

## Phase 6 — Workspace Products (View Dialog Only)

> **Goal**: Products have too many fields (25+) for create/edit dialogs.
> Keep those as pages. **Only** convert the View/Details page to a dialog.

**Feature path**: `src/features/workspace-products/`

**Files to DELETE** (details pages only):
```
pages/WorkspaceProductDetailsPage.jsx               ← DELETE
pages/desktop/WorkspaceProductDetailsDesktopPage.jsx← DELETE
pages/mobile/WorkspaceProductDetailsMobilePage.jsx  ← DELETE
```

**Files to KEEP** (create/edit stay as full pages):
```
pages/CreateWorkspaceProductPage.jsx          ✅ keep
pages/EditWorkspaceProductPage.jsx            ✅ keep
pages/WorkspaceProductImportPage.jsx          ✅ keep
pages/WorkspaceProductsPage.jsx               ✅ keep
```

**New file** (view-only dialog):
```
src/features/workspace-products/components/ProductViewDialog.jsx
```

**What the view dialog shows**:
- Product image (if available) or placeholder
- Product name, brand, manufacturer
- Batch number, expiry date (highlight in red if < 30 days, amber if < 90 days)
- MRP, Selling Price, Purchase Rate, GST %
- Current stock quantity (highlight in red if below minimum)
- HSN code, Category, Form, UoM, Salt composition
- Footer actions: "Edit Product" (navigates to edit page), "Add Stock" (opens stock entry)

**Dialog spec**:
- Size: `xl` (max-w-4xl)
- mobileSheet: `true`
- Mode: `view` only

**Tasks**:
- [ ] **W01-T1**: Create `ProductViewDialog.jsx`
- [ ] **W01-T2**: Update `WorkspaceProductsPage.jsx` — row ℹ️ icon → opens view dialog instead of navigating
- [ ] **W01-T3**: Remove details page route from product routes (keep create/edit/import/list routes)
- [ ] **W01-T4**: Delete 3 details page files

---

## Phase 7 — Shared Dialog Registry & Final Cleanup

> **Goal**: Make all dialogs importable from a single place for cross-context use.
> Clean up all remaining routes. Verify the UIModal `mobileSheet` prop.

---

### X01 — Shared Dialog Registry

**New file**:
```
src/components/dialogs/index.js
```

```js
// src/components/dialogs/index.js
// Central registry for all entity dialogs.
// Import from here when using a dialog cross-context (e.g. CustomerDialog in Billing).

export { CustomerDialog } from '@/features/parties/customers/components/CustomerDialog';
export { SupplierDialog } from '@/features/parties/suppliers/components/SupplierDialog';
export { BankAccountDialog } from '@/features/finance/treasury/bank-management/bank-accounts/components/BankAccountDialog';
export { FundTransferDialog } from '@/features/finance/treasury/fund-transfers/components/FundTransferDialog';
export { ChequeDialog } from '@/features/finance/treasury/cheque-management/components/ChequeDialog';
export { PaymentQrDialog } from '@/features/finance/treasury/payment-qr/components/PaymentQrDialog';
export { CashDenominationDialog } from '@/features/finance/treasury/cash-management/cash-denominations/components/CashDenominationDialog';
export { AccountGroupDialog } from '@/features/finance/chart-of-accounts/account-groups/components/AccountGroupDialog';
export { AccountDialog } from '@/features/finance/chart-of-accounts/accounts/components/AccountDialog';
export { FinancialPeriodDialog } from '@/features/finance/financial-periods/components/FinancialPeriodDialog';
export { JournalVoucherDialog } from '@/features/finance/journal-vouchers/components/JournalVoucherDialog';
export { CompanyDialog } from '@/features/company/components/CompanyDialog';
export { BranchDialog } from '@/features/branch/components/BranchDialog';
export { ShiftDialog } from '@/features/operations/shifts/components/ShiftDialog';
export { RoleDialog } from '@/features/access-control/components/RoleDialog';
export { ProductViewDialog } from '@/features/workspace-products/components/ProductViewDialog';
export { HsnDialog } from '@/features/hsn-master/components/HsnDialog';
export { ManufacturerDialog } from '@/features/manufacturer-master/components/ManufacturerDialog';
export { SaltDialog } from '@/features/salt-master/components/SaltDialog';
export { CategoryDialog } from '@/features/category-master/components/CategoryDialog';
export { ProductFormDialog } from '@/features/product-form-master/components/ProductFormDialog';
export { UomDialog } from '@/features/uom-master/components/UomDialog';
export { BankMasterDialog } from '@/features/bank-master/components/BankMasterDialog';
```

**Tasks**:
- [ ] **X01-T1**: Create `src/components/dialogs/index.js` with all exports
- [ ] **X01-T2**: Audit all route files and remove all now-unused routes
- [ ] **X01-T3**: Search for any remaining `navigate(ROUTES.CREATE_*)` or `navigate(ROUTES.EDIT_*)` that should be dialogs — fix them
- [ ] **X01-T4**: Search for `navigate(ROUTES.*_DETAILS*)` that should be dialogs — fix them
- [ ] **X01-T5**: Verify `UIModal` has `mobileSheet` prop working on actual mobile screen
- [ ] **X01-T6**: Delete the artifact MD in `.gemini/` — this file (`DIALOG_MIGRATION.md`) in the repo root is the single source of truth

---

## Pages That NEVER Become Dialogs

These stay as full pages. Do not convert them.

| Page / Feature | Reason |
|---|---|
| **Billing / POS Terminal** (`POSTerminalPage.jsx`) | Full-screen POS workflow, complex layout |
| **Purchase Bill Create/Edit** | Complex line-item form, many fields |
| **Workspace Product Create** | 25+ fields, photo upload, complex form |
| **Workspace Product Edit** | Same |
| **Workspace Product Import** | Multi-step wizard |
| **Global Products (Medicine Database)** | Browse + import flow |
| **Settings** | Tab-based settings page |
| **Ledger / Account Statement** | Data-heavy read-only view |
| **Account Balances** | Summary dashboard |
| **Opening Balances** | Bulk entry table |
| **Day Closings** | Workflow page |
| **Marketplace** | Browse/catalog |
| **Financial Reports** | PDF/table reports |
| **GST Ledger** | Read-only report |
| **Onboarding / Setup** | Multi-step onboarding wizard |
| **Auth pages** | Login, register, etc. |
| **Dashboard** | Main dashboard |

---

## Full File Deletion Checklist

Mark ✅ as you delete each file after the dialog is verified working.

### Parties
```
[x] src/features/parties/customers/pages/CreateCustomerPage.jsx
[x] src/features/parties/customers/pages/EditCustomerPage.jsx
[x] src/features/parties/customers/pages/CustomerDetailsPage.jsx
[x] src/features/parties/customers/pages/desktop/CreateCustomerDesktopPage.jsx
[x] src/features/parties/customers/pages/desktop/EditCustomerDesktopPage.jsx
[x] src/features/parties/customers/pages/desktop/CustomerDetailsDesktopPage.jsx
[x] src/features/parties/customers/pages/mobile/CreateCustomerMobilePage.jsx
[x] src/features/parties/customers/pages/mobile/EditCustomerMobilePage.jsx
[x] src/features/parties/customers/pages/mobile/CustomerDetailsMobilePage.jsx

[x] src/features/parties/suppliers/pages/CreateSupplierPage.jsx
[x] src/features/parties/suppliers/pages/EditSupplierPage.jsx
[x] src/features/parties/suppliers/pages/SupplierDetailsPage.jsx
[x] src/features/parties/suppliers/pages/desktop/CreateSupplierDesktopPage.jsx
[x] src/features/parties/suppliers/pages/desktop/EditSupplierDesktopPage.jsx
[x] src/features/parties/suppliers/pages/desktop/SupplierDetailsDesktopPage.jsx
[x] src/features/parties/suppliers/pages/mobile/CreateSupplierMobilePage.jsx
[x] src/features/parties/suppliers/pages/mobile/EditSupplierMobilePage.jsx
[x] src/features/parties/suppliers/pages/mobile/SupplierDetailsMobilePage.jsx
```

### Finance — COA
```
[x] src/features/finance/chart-of-accounts/account-groups/pages/CreateAccountGroupPage.jsx
[x] src/features/finance/chart-of-accounts/account-groups/pages/EditAccountGroupPage.jsx
[x] src/features/finance/chart-of-accounts/account-groups/pages/AccountGroupDetailsPage.jsx
[x] .../pages/desktop/CreateAccountGroupDesktopPage.jsx
[x] .../pages/desktop/EditAccountGroupDesktopPage.jsx
[x] .../pages/desktop/AccountGroupDetailsDesktopPage.jsx
[x] .../pages/mobile/* (3 files)

[x] src/features/finance/chart-of-accounts/accounts/pages/CreateAccountPage.jsx
[x] src/features/finance/chart-of-accounts/accounts/pages/EditAccountPage.jsx
[x] src/features/finance/chart-of-accounts/accounts/pages/AccountDetailsPage.jsx
[x] .../pages/desktop/* (3 files)
[x] .../pages/mobile/* (3 files)
```

### Finance — Periods & Vouchers
```
[x] src/features/finance/financial-periods/pages/CreateFinancialPeriodPage.jsx
[x] src/features/finance/financial-periods/pages/desktop/CreateFinancialPeriodDesktopPage.jsx
[x] src/features/finance/financial-periods/pages/mobile/CreateFinancialPeriodMobilePage.jsx

[x] src/features/finance/journal-vouchers/pages/CreateJournalVoucherPage.jsx
[x] src/features/finance/journal-vouchers/pages/EditJournalVoucherPage.jsx
[x] src/features/finance/journal-vouchers/pages/JournalVoucherDetailsPage.jsx
[x] .../pages/desktop/* (3 files)
[x] .../pages/mobile/* (3 files)
```

### Treasury
```
[x] src/features/finance/treasury/bank-management/bank-accounts/pages/CreateBankAccountPage.jsx
[x] .../pages/EditBankAccountPage.jsx
[x] .../pages/BankAccountDetailsPage.jsx
[x] .../pages/desktop/CreateBankAccountDesktopPage.jsx
[x] .../pages/desktop/EditBankAccountDesktopPage.jsx
[x] .../pages/desktop/BankAccountDetailsDesktopPage.jsx
[x] .../pages/mobile/* (3 files)

[x] src/features/finance/treasury/fund-transfers/pages/CreateFundTransferPage.jsx
[x] .../pages/FundTransferDetailsPage.jsx
[x] .../pages/desktop/* (2 files)
[x] .../pages/mobile/* (2 files)

[x] src/features/finance/treasury/cheque-management/pages/CreateChequePage.jsx
[x] .../pages/ChequeDetailsPage.jsx
[x] .../pages/desktop/* (2 files)
[x] .../pages/mobile/* (2 files)

[x] src/features/finance/treasury/payment-qr/pages/CreatePaymentQrPage.jsx
[x] .../pages/EditPaymentQrPage.jsx
[x] .../pages/PaymentQrDetailsPage.jsx
[x] .../pages/desktop/* (3 files)
[x] .../pages/mobile/* (3 files)
```

### Access Control & Operations
```
[x] src/features/access-control/pages/CreateRolePage.jsx
[x] src/features/access-control/pages/EditRolePage.jsx
[x] src/features/access-control/pages/RoleDetailsPage.jsx
[x] .../pages/desktop/* (3 files)
[x] .../pages/mobile/* (3 files)

[x] src/features/operations/shifts/pages/CreateShiftPage.jsx
[x] .../pages/desktop/CreateShiftDesktopPage.jsx
[x] .../pages/mobile/CreateShiftMobilePage.jsx
```

### Company & Branch (Preserved as Full Pages per User Instruction)
```
[SKIPPED] Company pages preserved as full pages
[SKIPPED] Branch pages preserved as full pages
```

### Phase 1 Masters (Skipped per User Instruction)
```
[SKIPPED] Master modules (HSN, Manufacturer, Salt, Category, Form, UOM, Bank Master)
```

### Workspace Products (partial — details only)
```
[ ] src/features/workspace-products/pages/WorkspaceProductDetailsPage.jsx
[ ] .../pages/desktop/WorkspaceProductDetailsDesktopPage.jsx
[ ] .../pages/mobile/WorkspaceProductDetailsMobilePage.jsx
```

---

## Route Reduction Summary

| Module | Before | After | Removed |
|---|---|---|---|
| Customers | 4 routes | 1 route | −3 |
| Suppliers | 4 routes | 1 route | −3 |
| Account Groups | 4 routes | 1 route | −3 |
| Accounts (COA) | 4 routes | 1 route | −3 |
| Financial Periods | 2 routes | 1 route | −1 |
| Journal Vouchers | 4 routes | 1 route | −3 |
| Bank Accounts | 4 routes | 1 route | −3 |
| Fund Transfers | 3 routes | 1 route | −2 |
| Cheques | 3 routes | 1 route | −2 |
| Payment QR | 4 routes | 1 route | −3 |
| Roles | 4 routes | 1 route | −3 |
| Company | 4 routes | 1 route | −3 |
| Branch | 4 routes | 1 route | −3 |
| Masters × 7 modules | ~3 each = 21 | 1 each = 7 | −14 |
| Shifts | 2 routes | 1 route | −1 |
| Products (partial) | 1 route | 0 routes | −1 |
| **TOTAL** | **~76 routes** | **~21 routes** | **−55 routes** |

---

## Implementation Rules & Guardrails

These must be followed during every phase of implementation.

### 1. State reset on dialog close
Every dialog MUST reset its form state when `isOpen` changes to `false`:
```js
useEffect(() => {
  if (!isOpen) {
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setServerError(null);
    setEntityData(null);
  }
}, [isOpen]);
```

### 2. Data fetching only when open
For edit/view modes, only fetch entity data when `isOpen === true` and `entityId` is set.
Never fetch when the dialog is closed. This avoids API calls on every list page render.

### 3. Use existing hooks / Redux thunks
Do NOT duplicate API logic inside dialogs. Use the same `useXxx` custom hooks that
the old pages used. Example:
```js
// BankAccountDialog.jsx — reuse the same hook
import useBankAccount from '../hooks/useBankAccount';
const { createBankAccount, updateBankAccount, getBankAccountById } = useBankAccount();
```

### 4. Delete page files only after verification
Do NOT delete old page files until:
1. The dialog is implemented and working
2. The list page has been updated to use the dialog
3. The route has been removed from the routes file
4. You have manually tested create + edit + view in the dialog

### 5. Keep mobile and desktop list pages
The migration removes `Create*DesktopPage`, `Edit*DesktopPage`, `*DetailsDesktopPage`.
It does NOT remove `*DesktopPage` (the list). The list page stays; only the
sub-pages (create/edit/details) are converted to dialogs.

### 6. Do not break existing imports
When removing a file, check its `index.js` exports and remove the export.
Check for any other file that imports the deleted component.

### 7. One module at a time
Complete all tasks for one module (create dialog → update list page → remove routes
→ delete files) before moving to the next. Do not partially migrate multiple modules.

### 8. Toast notifications on success
Every dialog's `onSuccess` callback should trigger a toast notification via the
existing toast system. The list page passes this in:
```js
onSuccess={(saved) => {
  refreshList();
  toast.success('Bank account saved successfully');
}}
```

### 9. Confirm before delete — use UIConfirmDialog
Any delete action in the list page should use `UIConfirmDialog` (already built),
not `window.confirm()`. Example in BankAccountsPage:
```js
// REMOVE:
if (window.confirm('Are you sure...')) { ... }

// REPLACE WITH:
<UIConfirmDialog
  isOpen={confirmDeleteOpen}
  onClose={() => setConfirmDeleteOpen(false)}
  onConfirm={handleConfirmedDelete}
  title="Delete Bank Account?"
  description="This will permanently remove the bank account."
  intent="danger"
  itemName={accountToDelete?.displayName}
/>
```

### 10. UIModal size reference
```
sm  → max-w-md  (~448px)   — use for: HSN, Manufacturer, Salt, Category, Form, UoM, Bank Master, Shifts, Financial Periods, Fund Transfers
md  → max-w-lg  (~512px)   — use for: Accounts, Bank Accounts, Cheques, Payment QR, Cash Denominations
lg  → max-w-2xl (~672px)   — use for: Customers, Suppliers, Company, Branch
xl  → max-w-4xl (~896px)   — use for: Journal Vouchers, Roles, Product View
```

---

*Last updated: Phase 0 (planning complete). Start with Phase 1 → M01 HSN Codes.*
*Work through phases in order. Do not skip phases.*
