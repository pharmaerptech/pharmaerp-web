# Purchase Return Transport Box Labels & Inter-Branch Transfer Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Provide physical carton/box transport label printing (with Supplier, Current Branch, and Final Selected Branch) directly during Purchase Return creation and inside the View Details modal, along with a 1-click handoff to transfer return goods to another company branch.

**Architecture:** A reusable, high-fidelity `ReturnBoxLabelModal.jsx` modal handles destination branch selection, multi-box count (*Box X of Y*), 4" × 6" thermal sticker vs. A4 paper layout toggling, live interactive label preview, and CSS print output. `CreatePurchaseReturnDesktopPage.jsx` (and Mobile) exposes a "Transport Label" action for staged items, while `PurchaseReturnDetailsModal.jsx` exposes both "Transport Label" and a direct "Transfer to Other Branch" dispatch button routed to `ROUTES.CREATE_TRANSFER_ORDER`.

**Tech Stack:** React 19, Lucide React, Tailwind CSS, PharmaERP Reusable UI Component Library (`UIModal`, `UISelect`, `UIButton`, `UIBadge`), browser `@media print` CSS engine.

---

### Task 1: Create `ReturnBoxLabelModal.jsx` Component

**Files:**
- Create: `pharmaerp-web/src/features/purchases/components/ReturnBoxLabelModal.jsx`

**Step 1: Write `ReturnBoxLabelModal.jsx`**
Build the modal with:
1. Destination branch picker using `UISelect` populated from `useBranch()` (filtering out current branch).
2. Number of boxes stepper (1 to 99).
3. Label print format selector: `4" × 6" Thermal Sticker` (default) vs `Standard A4 Sheet`.
4. Live interactive preview of the sticker containing:
   - Debit Note # and Date.
   - BOX X OF Y indicator.
   - **FROM**: Current Branch name, address, GSTIN, Drug License.
   - **TO**: Final Selected Branch name, hub address.
   - **RETURN FOR SUPPLIER**: Vendor business name, GSTIN, State.
   - Motive, batch count, total units, and Code128 visual barcode.
5. `handlePrint()` routine creating a dedicated clean print window with `@page { size: 4in 6in; margin: 0; }` for thermal or `@page { size: A4 portrait; margin: 10mm; }` for A4.

**Step 2: Build verification**
Run: `cd pharmaerp-web && npm run build`
Expected: Build succeeds with 0 errors.

**Step 3: Commit**
```bash
git add pharmaerp-web/src/features/purchases/components/ReturnBoxLabelModal.jsx
git commit -m "feat(purchases): create ReturnBoxLabelModal with thermal and A4 print engine"
```

---

### Task 2: Integrate "Create Transport Label" Button in Purchase Return Terminal

**Files:**
- Modify: `pharmaerp-web/src/features/purchases/pages/desktop/CreatePurchaseReturnDesktopPage.jsx`
- Modify: `pharmaerp-web/src/features/purchases/pages/mobile/CreatePurchaseReturnMobilePage.jsx`

**Step 1: Add Transport Label Action in Header and Summary**
1. Add state: `const [showBoxLabelModal, setShowBoxLabelModal] = useState(false);`
2. Add `<UIButton variant="outline" size="sm" startIcon={<Package className="size-4" />} onClick={() => setShowBoxLabelModal(true)} disabled={items.length === 0}>Create Transport Label</UIButton>` in the page header actions.
3. Wire `ReturnBoxLabelModal` passing `items`, `selectedSupplier`, `currentBranch`, `returnMotive`, and temporary memo identifier `PR-DRAFT`.

**Step 2: Build verification**
Run: `cd pharmaerp-web && npm run build`
Expected: PASS with 0 errors.

**Step 3: Commit**
```bash
git add pharmaerp-web/src/features/purchases/pages/desktop/CreatePurchaseReturnDesktopPage.jsx pharmaerp-web/src/features/purchases/pages/mobile/CreatePurchaseReturnMobilePage.jsx
git commit -m "feat(purchases): add transport label generator button to return creation terminal"
```

---

### Task 3: Integrate "Transport Label" and "Transfer to Other Branch" in View Details Modal

**Files:**
- Modify: `pharmaerp-web/src/features/purchases/components/PurchaseReturnDetailsModal.jsx`

**Step 1: Add Actions to Modal Footer**
1. Import `useNavigate`, `ROUTES`, and `ReturnBoxLabelModal`.
2. Add state `const [showBoxLabelModal, setShowBoxLabelModal] = useState(false);`
3. Add action buttons in footer:
   - `<UIButton variant="outline" size="sm" startIcon={<Package className="size-4" />} onClick={() => setShowBoxLabelModal(true)}>Transport Label</UIButton>`
   - `<UIButton variant="outline" size="sm" startIcon={<Truck className="size-4" />} onClick={handleTransferToBranch}>Transfer to Other Branch</UIButton>`
4. Implement `handleTransferToBranch`:
   ```javascript
   const handleTransferToBranch = () => {
     navigate(ROUTES.CREATE_TRANSFER_ORDER, {
       state: {
         transferType: purchaseReturn.returnMotive === "SELLABLE" ? "STANDARD" : "SCRAP",
         sourceBranchId: purchaseReturn.branchId?._id || currentBranch?._id,
         prefilledItems: (purchaseReturn.items || []).map((item) => ({
           productId: item.productId?._id || item.productId,
           name: item.productName,
           batchId: item.batchId?._id || item.batchId,
           batchNo: item.batchNo,
           qty: item.returnQty,
           stock: item.returnQty,
           category: purchaseReturn.returnMotive === "SELLABLE" ? "standard" : "scrap",
           isScrap: purchaseReturn.returnMotive !== "SELLABLE",
         })),
         remarks: `Transfer of Debit Note #${purchaseReturn.debitNoteNo || purchaseReturn.returnNo} to central branch for supplier return`,
       },
     });
     onClose();
   };
   ```
5. Mount `<ReturnBoxLabelModal isOpen={showBoxLabelModal} onClose={() => setShowBoxLabelModal(false)} returnRecord={purchaseReturn} />`.

**Step 2: Build verification**
Run: `cd pharmaerp-web && npm run build`
Expected: PASS with 0 errors.

**Step 3: Commit**
```bash
git add pharmaerp-web/src/features/purchases/components/PurchaseReturnDetailsModal.jsx
git commit -m "feat(purchases): add transport label and inter-branch transfer buttons in view details modal"
```

---

### Task 4: End-to-End Verification & Documentation

**Files:**
- Modify: `docs/plans/task.md`

**Step 1: Run production build & verify all test suites**
Run: `cd pharmaerp-web && npm run build`
Run: `cd pharmaerp-api && npm test tests/unit/purchaseReturn.test.js`

**Step 2: Update task tracker**
Update `docs/plans/task.md` marking Task 144 as complete.
