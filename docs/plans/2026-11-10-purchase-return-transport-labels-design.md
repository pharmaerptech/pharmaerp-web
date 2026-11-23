# Technical Design Document: Purchase Return Transport Box Labels & Inter-Branch Transfer Workflow

**Date**: 2026-11-10  
**Status**: Approved  
**Author**: Antigravity  
**Domain**: Purchases / Inventory / Logistics (`pharmaerp-web`)

---

## 1. Executive Summary

In pharmaceutical distribution and retail chain operations, returning quarantined, scrap, or sellable medicines to suppliers often involves packing the consignment into physical cartons/boxes at a dispensary or local branch and routing them through an intermediary company branch (e.g., Central Supply Chain Depot / Returns Warehouse) before final return to the manufacturer or vendor.

This feature introduces:
1. A **"Create Transport Label"** action directly on the Purchase Return creation terminal (`CreatePurchaseReturnDesktopPage.jsx` and `CreatePurchaseReturnMobilePage.jsx`).
2. A **"Print Transport Label"** action inside the Purchase Return View Details modal (`PurchaseReturnDetailsModal.jsx`).
3. A **"Transfer to Other Branch"** workflow in `PurchaseReturnDetailsModal.jsx` that prefills and routes the return items into the Inter-Branch Transfer Order subsystem (`ROUTES.CREATE_TRANSFER_ORDER`).
4. A dedicated, high-fidelity **`ReturnBoxLabelModal.jsx`** component capable of rendering and printing compliant 4" × 6" thermal adhesive stickers or standard A4 sheets with:
   - Target **Supplier Name** & GSTIN.
   - Origin / Sender: **Current Branch** details.
   - Destination: **Final Selected Branch** (Logistics Hub).
   - Package Meta: Box Number (*Box X of Y*), Debit Note reference, batch item counts, total units, and scannable barcode.

---

## 2. Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. PURCHASE RETURN TERMINAL (CreatePurchaseReturnDesktop/Mobile)       │
│    - Operator stages items, auto-selects supplier                      │
│    - Action: [ Create Transport Label ]                                │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Opens with Staged Items & Supplier
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. RETURN BOX LABEL MODAL (ReturnBoxLabelModal.jsx)                    │
│    - Origin: Current Branch (useBranch)                                │
│    - Destination: Final Selected Branch (Dropdown from branches)       │
│    - Supplier: Target Creditor / Vendor                                │
│    - Configuration: Number of Boxes (Stepper: 1..N), Format (4x6 / A4) │
│    - Output: Live Preview & window.print() formatting                  │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ 3. PURCHASE RETURN DETAILS MODAL (PurchaseReturnDetailsModal.jsx)      │
│    - Opened from Returns Register or Post-Creation Confirmation        │
│    - Action A: [ 🏷️ Transport Label ]  --> Opens ReturnBoxLabelModal  │
│    - Action B: [ 🚚 Transfer to Branch ] --> Handoff to Transfer Order │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Prefilled State
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 4. INTER-BRANCH TRANSFER ORDER (CreateTransferOrderPage.jsx)           │
│    - Prefilled source branch, items, quantities, and scrap/shelf motive│
│    - Operator completes dispatch to destination warehouse              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Specifications

### 3.1. `ReturnBoxLabelModal.jsx`
- **Location**: `src/features/purchases/components/ReturnBoxLabelModal.jsx`
- **Props**:
  - `isOpen` (boolean): Visibility state.
  - `onClose` (function): Close callback.
  - `returnRecord` (object): Purchase return or staged return data:
    - `debitNoteNo` or `returnNo`
    - `returnDate`
    - `returnMotive`
    - `supplier` (businessName, gstNumber, phone, city)
    - `branch` (name, address, phone, gstNumber, drugLicenseNumber)
    - `items` (array of batches / medicines with return quantities)
- **Local State**:
  - `destinationBranchId`: Selected target company branch ID.
  - `boxCount`: Number of physical boxes packed (integer, min 1, default 1).
  - `printFormat`: `"THERMAL_4X6"` (default) or `"A4_SHEET"`.
  - `boxNotes`: Optional transport notes (e.g., "Fragile", "Refrigerated 2-8°C").
- **Print Routine**:
  - Injects print HTML into an iframe or popup window with strict `@page { size: 4in 6in; margin: 0; }` for thermal or `@page { size: A4 portrait; margin: 10mm; }` for A4.
  - Includes Code128-compatible barcode or structured 2D matrix for rapid scanner verification.

### 3.2. Integration in `CreatePurchaseReturnDesktopPage.jsx` & `CreatePurchaseReturnMobilePage.jsx`
- Adds a secondary action button in the sticky header and beside the Summary Card:
  - `<UIButton variant="outline" size="sm" startIcon={<Package className="size-4" />} onClick={() => setLabelModalOpen(true)} disabled={items.length === 0}>Transport Label</UIButton>`
- Passes the currently selected supplier, current branch, and staged items into `ReturnBoxLabelModal`.

### 3.3. Integration in `PurchaseReturnDetailsModal.jsx`
- Adds two buttons in the modal footer:
  1. `Transport Label`: Launches `ReturnBoxLabelModal` populated with `purchaseReturn`.
  2. `Transfer to Other Branch`: Triggers `handleTransferToBranch()`, which calls:
     ```javascript
     navigate(ROUTES.CREATE_TRANSFER_ORDER, {
       state: {
         transferType: purchaseReturn.returnMotive === "SELLABLE" ? "STANDARD" : "SCRAP",
         sourceBranchId: purchaseReturn.branchId?._id || currentBranch?._id,
         prefilledItems: purchaseReturn.items.map(item => ({
           productId: item.productId?._id || item.productId,
           name: item.productName,
           batchId: item.batchId?._id || item.batchId,
           batchNo: item.batchNo,
           qty: item.returnQty,
           stock: item.returnQty,
           category: purchaseReturn.returnMotive === "SELLABLE" ? "standard" : "scrap",
           isScrap: purchaseReturn.returnMotive !== "SELLABLE",
         })),
         remarks: `Inter-branch transit for Debit Note #${purchaseReturn.debitNoteNo || purchaseReturn.returnNo} to supplier ${supplier.businessName || ""}`,
       },
     });
     ```

---

## 4. Label Layout & Aesthetics

Each box label includes:
- **Title Banner**: `PHARMA CONSIGNMENT RETURN LABEL` + `BOX X OF Y` badge.
- **Reference Strip**: Debit Note #, Reference Memo, Return Date, Motive (`Shelf Return` / `Quarantined Scrap`).
- **FROM (Origin Branch)**: Branch Name, Full Address, GSTIN, Drug License #, Contact Phone.
- **TO (Destination Branch)**: Selected Company Branch Name, Hub Address, Contact.
- **SUPPLIER / CREDITOR**: Business Name, GSTIN, State / City.
- **MANIFEST SUMMARY**: Total Batches count, Total Units packed.
- **BARCODE**: Visual barcode of `DN-XXXX-BX` with human-readable text.

---

## 5. Testing & Verification

1. **Unit & Build Testing**:
   - `npm run build` in `pharmaerp-web` ensuring clean compilation.
   - Unit test verification in `pharmaerp-api`.
2. **Interactive Testing**:
   - Verify label generation with 1 box and multi-box (`Box 1 of 3`, `Box 2 of 3`, `Box 3 of 3`).
   - Verify branch exclusion (current branch does not appear in destination dropdown).
   - Verify handoff to `CREATE_TRANSFER_ORDER` carries all item quantities and batches seamlessly.
