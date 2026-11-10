| Status | Task |
|---|---|
| [x] | Task 1: Data Models & Schema Enhancements (Job, Staging, Product & Invoice) |
| [x] | Task 2: Field Extraction, Normalization & Validation Helper |
| [x] | Task 3: Core Import Engine Service (Chunk Streaming, Staging & Materialization) |
| [x] | Task 4: API Controller, Validation & Routes |
| [x] | Task 5: Frontend Service & Interactive Import Modal Component |
| [x] | Task 6: End-to-End Verification & Edge Case Testing |
| [x] | Task 7: Marg ERP Statement Parser & Pack Normalizer (Unit Tests & Logic) |
| [x] | Task 8: Integrate Marg ERP Parsing into Service, Controller & Auto-detection |
| [x] | Task 9: Verification on User's Exact Marg ERP Sales Statement Sample |
| [x] | Task 11: Investigate and Fix ECOSPRIN AV 75 CAP 10X15 Matching Failure |
| [x] | Task 12: Council Deliberation & Single-Column Phone-Lead State Machine Invoicing |
| [x] | Task 13: Set Customer Type to 'other' & Materialize All Historical Sales Invoices |
| [x] | Task 15: Remove tooltips from both Hold and Return buttons in POS |
| [x] | Task 16: Migrate B2C/B2B Switch to UITabs & align Return Button with UI Guidelines |
| [x] | Task 17: Add missing 'Party / Business Name *' heading and align layout in B2B Customer Strip |
| [x] | Task 18: Implement Direct Return Item Pickup from Customer History in Return Mode |
| [x] | Task 19: Make Return button in Customer History appear only on hover matching normal mode |
| [x] | Task 20: Update Sales Invoice Preview Modal for Return Invoice & Credit Note mode |
| [x] | Task 21: Update Sales Checkout Modal for Return Mode (Amount to Return, Cash Refund & Advance Deposit) |
| [x] | Task 22: Backend Sales Return API Module, Restock, GSTR-1 Credit Note Reversal & Shift Cash Management |
| [x] | Task 23: Cash Drawer Denominations Capture in Refund Settlement Mode |
| [x] | Task 24: Connect Return Workflow to Backend Return API & Customer Advance Credit Deposit |
| [x] | Task 25: Update GSTR-1 page to calculate Net applicable GST & Taxable turnover deducting Credit Notes / Sales Returns |
| [x] | Task 26: Fix Cash Counter & Shift Cash Deduction for Sales Return Refunds |
| [x] | Task 27: View Shift Detail: Display Returned Bills, Refund Amounts & Breakdown |
| [x] | Task 28: Fix Inventory Restock on Sales Return (Batches, Facility & Inventory Ledger) |
| [x] | Task 29: Council Deliberation & Brainstorming for Dedicated Sales Return System (Isolated Models & Standalone UI Page) |
| [x] | Task 30: Dedicated Backend Sales Return Data Model & Repository (`salesReturn.model.js` & `salesReturn.repository.js`) |
| [x] | Task 31: Sales Return API Controller, Routes & Service Migration |
| [x] | Task 32: Frontend Sales Return Feature (Dedicated Page, Routing, Left Drawer Sidebar Entry) |
| [x] | Task 33: Verification & Integration Testing |
| [x] | Task 34: Root Cause Investigation: Inspect Sales Return Filters Frontend & Backend Query Flow |
| [x] | Task 35: Backend Fix: Search matching customer name/phone, Flexible Return/Refund Type, Billing Mode, and Accurate Date Boundaries in `return.service.js` |
| [x] | Task 36: Frontend Fix: Debounce search, fix Date Range calculation and page resets in `SalesReturnDesktopPage.jsx` & `SalesReturnMobilePage.jsx` |
| [x] | Task 37: End-to-End Verification of all Sales Return Filters (Search, Date Preset, Refund Type, Billing Mode) |
| [x] | Task 38: Fix UISelect onChange signatures in `SalesReturnDesktopPage.jsx` and add defensive handling in `UISelect.jsx` |
| [x] | Task 39: Build & Verify Dropdown Selection End-to-End |
| [x] | Task 40: Investigate & Fix Sales Return Details Drawer View (Eye icon click) |
| [x] | Task 41: End-to-End Verification of Sales Return Details Drawer & Print Flow |
| [x] | Task 42: Migrate Sales Return Details to Centered UIModal matching SalesInvoicePreviewModal.jsx:L360 |
| [x] | Task 43: Verification of Centered Preview Modal on Desktop & Mobile |
| [x] | Task 44: Fix React Hook Ordering ('Rendered more hooks than during previous render') in SalesReturnDetailsDrawer |
| [x] | Task 45: Align Sales Return Details Preview with BillingInvoiceDetailsDrawer.jsx layout, metadata cards, and payment breakdown |
| [x] | Task 46: Integrate Customer Name/Phone & POS Terminal Search Bar into CreateSalesReturnModal (New Sales Return) |
| [x] | Task 47: Increase New Sales Return Modal Height & Dropdown Boundary to Prevent Clipping |
| [x] | Task 48: Council Deliberation & Infinite Scrolling Implementation (Limit 10) in CreateSalesReturnModal |
| [x] | Task 49: Shift Connection, Original Sale Bill Return Tracking & Double-Return Prevention |
| [x] | Task 50: (Reverted per user request) Separate Partition for Returned Bills & Display Returned Bill Number in SalesInvoicePreviewModal |
| [x] | Task 51: Include Return-Related Bills with Numbers & Amounts in BillingInvoiceDetailsDrawer |
| [x] | Task 52: Prominent Un-truncated Error Banner in SalesCheckoutModal at Line 785 |
| [x] | Task 53: Align Shift Accounting, Schema & Real-Time Sync for Dedicated SalesReturn Model |
| [x] | Task 54: Council Deliberation & Removal of Sales Return Components from Sale Bill Invoice Page |
| [x] | Task 55: Create Dedicated Sales Return Page (/sales-returns/create) replacing Modal |
| [x] | Task 56: Council Deliberation & POS-Style Sales Return Terminal (Customer Strip, History Panel, Customer-Purchased Medicine Search & Bill-Wise Pickup) |
| [x] | Task 57: Scrap Store Branch, Automatic Scrap Transfer Order & Sales Return Motive Selection (General vs Expired vs Broken) |
| [x] | Task 58: Systematic Investigation & Fix for Missing Expiry Date Across Sales Invoices, History, Pickups & Returns |
| [x] | Task 59: Auto-Resolution & Seeder to Create 'Scrap Store' Branch with General Details for All Existing Companies |
| [x] | Task 60: Root Cause Investigation & Fix: Inventory Restock & New Batch Creation on Sales Return (Batch & ProductFacility Stock Increase in Current & Scrap Branches) |
| [x] | Task 61: Council Deliberation on Branch Scrap Bin Architecture & Stock Matrix Expired Items Button |
| [x] | Task 62: Backend Scrap Bin Implementation on Batch & ProductFacility (Remove Transfer Order & Scrap Store Branch) |
| [x] | Task 63: Backend Query Support for Expired & Scrap Items (with filters, branch scoping & search) |
| [x] | Task 64: Frontend Stock Matrix Feature: Expired & Scrap Items View with UI Primitives, Filters & Checkboxes |
| [x] | Task 65: End-to-End Verification & Testing |
| [x] | Task 66: Dedicated Expired & Scrap Items Page Routes, Navigation & Header Integration |
| [x] | Task 67: Universal Dual-Layout Desktop Page (ExpiredScrapItemsDesktopPage.jsx) |
| [x] | Task 68: Universal Dual-Layout Mobile Page (ExpiredScrapItemsMobilePage.jsx) |
| [x] | Task 69: Wire Stock Matrix Buttons & Sidebar Navigation to Dedicated Page |
| [x] | Task 70: End-to-End Build & Verification |
| [x] | Task 71: Council Deliberation & Resolution for Same-Batch Broken vs Expired Return Separation |
| [x] | Task 72: Schema & Batch Resolution: Add originalBatchNo & scrapType, Differentiate Target Batch by Scrap Reason |
| [x] | Task 73: Verification & Multi-Return Unit Testing |
| [x] | Task 74: Add Branch Filter, Expiry Presets & Custom Date Range Pickers to ExpiredScrapItemsDesktopPage.jsx |
| [x] | Task 75: Add Branch Filter, Expiry Presets & Custom Date Range Pickers to ExpiredScrapItemsMobilePage.jsx |
| [x] | Task 76: Add Branch Filter & Custom Date Range to ExpiredScrapItemsModal.jsx |
| [x] | Task 77: Verification & Build Testing |
| [x] | Task 78: Root Cause Diagnosis & Schema Scoping for POS Batch Selection |
| [x] | Task 79: Backend Fix: Normalize branch_id, productId, stock, expiry in workspaceProduct.controller.js |
| [x] | Task 80: Frontend Fix: Safe ID Extraction, Branch Scoping, Expiry Formatting & Real Batch Retention in WorkspaceProductBatchSelectorModal.jsx |
| [x] | Task 81: End-to-End Verification & Unit Tests in pharmaerp-api and Build in pharmaerp-web |
| [x] | Task 82: Council Deliberation on Scrap Transfer Order Architecture & State Hand-off |
| [x] | Task 83: Data Schema & Backend Transfer Order Service: Support transferType="SCRAP", Scrap Batch Deduction, and Destination Scrap Bin Receipt |
| [x] | Task 84: Frontend CreateTransferOrderPage.jsx: Location State Prefill, Scrap Transfer Mode Badge, and Staged Scrap Items |
| [x] | Task 85: Add "Create Transfer Order" Action to ExpiredScrapItemsDesktopPage, MobilePage, and Modal with Navigation State |
| [x] | Task 86: Unit Testing & Verification in pharmaerp-api (Scrap Transfer Creation, Receipt, and Cancel) |
| [x] | Task 87: End-to-End Build & Verification in pharmaerp-web |
| [x] | Task 88: Add Current-Branch-Only Enforcement & Visual Indicators to ExpiredScrapItemsDesktopPage.jsx |
| [x] | Task 89: Add Current-Branch-Only Enforcement & Visual Indicators to ExpiredScrapItemsMobilePage.jsx and ExpiredScrapItemsModal.jsx |
| [x] | Task 90: Add Source Branch Validation to CreateTransferOrderPage.jsx and Backend transferOrder.service.js |
| [x] | Task 91: Verification & End-to-End Build Testing |
| [x] | Task 92: Root Cause Investigation & Scope Formulation (B2B Sale Bill without GST -> B2C, Sales Return -> Registered vs Unregistered) |
| [x] | Task 93: Backend Fix: Enforce B2C Invoice Creation for B2B Customers without GST in `invoice.service.js` and GSTR-1 Ledger Mapping |
| [x] | Task 94: Backend Fix: Sales Return Routing to Registered vs Unregistered Parties based strictly on GST Number in `return.service.js` |
| [x] | Task 95: Core GST Calculations Fix: Update `gstr1SummaryCalculator.js` in `pharmaerp-api` and `pharmaerp-web` |
| [x] | Task 96: Frontend Integration: Update POS & Sales Billing (`POSTerminalPage.jsx`, `SalesDesktopPage.jsx`, `SalesMobilePage.jsx`) to handle B2B parties without GST as B2C |
| [x] | Task 97: Frontend Integration: Update Sales Return Creation (`CreateSalesReturnDesktopPage.jsx`, `CreateSalesReturnMobilePage.jsx`, `CreateSalesReturnModal.jsx`) |
| [x] | Task 98: Unit & Integration Verification Tests for B2B/B2C Invoices, Sales Returns, and GSTR-1 Group Allocation |
| [x] | Task 99: Summary Calculator Overhaul: Unify `deduceGstrGroup`, Re-classify Misleading DB Records, and Fix Credit Note Turnover Netting in `gstr1SummaryCalculator.js` |
| [x] | Task 100: Fix GSTR Date Filtering, Inclusive End-of-Day Boundaries, Branch Voucher Resolution for Sales Returns, and Auto-Sync in `gstLedger.repository.js` |
| [x] | Task 101: Fix GSTR-1 Summary Registered vs Unregistered Credit Note Allocation & Party Populate in Backend and Frontend |
| [x] | Task 102: Systematic Investigation & Fix: Scoped Purchase Bill Batch & ProductFacility Ingestion to Current/Bill Branch |
| [x] | Task 103: Council Deliberation & Architecture Specification for Moving Shelf-Expired Stock to Branch Scrap Bin |
| [x] | Task 104: Backend API Endpoint & Service: move-to-scrap-bin (Atomic Shelf Batch Deduction, Scrap Batch Increment & ProductFacility Sync) |
| [x] | Task 105: Frontend Service & Desktop Register Integration: ExpiredScrapItemsDesktopPage.jsx (Dynamic Button Switching & Confirm Dialog) |
| [x] | Task 106: Frontend Mobile & Modal Integration: ExpiredScrapItemsMobilePage.jsx and ExpiredScrapItemsModal.jsx |
| [x] | Task 107: Unit Tests in pharmaerp-api for Move-to-Scrap-Bin Operation |
| [x] | Task 108: End-to-End Build & Verification in pharmaerp-web |
| [x] | Task 109: Exclude Shelf-Expired Items from "All Expired & Scrap" Tab across Desktop, Mobile, and Modal Views |
| [x] | Task 110: Verification & End-to-End Build Testing in pharmaerp-web |
| [x] | Task 111: Remove Redundant Header Panel from ExpiredScrapItemsDesktopPage.jsx and Relocate Action Buttons & Back Navigation to Toolbar |
| [x] | Task 112: Verification & End-to-End Build in pharmaerp-web |
| [x] | Task 113: Backend - Enhance getProductFacilityBatchesByQueryV2 with Motive Filtering (Scrap Bin Only for 'all', Shelf Only for 'shelf_expired'), Pagination Meta & Summary Counts |
| [x] | Task 114: Frontend - Implement Server-Side Pagination with UIInfiniteScroll in ExpiredScrapItemsDesktopPage.jsx |
| [x] | Task 115: Frontend - Implement Server-Side Pagination with UIInfiniteScroll in ExpiredScrapItemsMobilePage.jsx and ExpiredScrapItemsModal.jsx |
| [x] | Task 116: Unit Tests in pharmaerp-api for Batch Motive Querying & Pagination |
| [x] | Task 117: Verification & End-to-End Build in pharmaerp-web |
| [x] | Task 118: Align Expired & Scrap Items Table with Purchases Table Architecture (UITable containerClassName, divide-y, typography, and infinite scroll endMessage) |
| [x] | Task 119: Verification & End-to-End Build in pharmaerp-web |
| [x] | Task 120: Backend - Create StockAdjustment Model, Schema, and Relationships |
| [x] | Task 121: Backend - Implement addExpiredBrokenStock Controller, Validation, and Routes in workspaceProduct |
| [x] | Task 122: Backend - Unit Tests in pharmaerp-api for Expired & Broken Stock Adjustment |
| [x] | Task 123: Frontend - Service Method in workspaceProductService for Stock Adjustment |
| [x] | Task 124: Frontend - Create AddExpiredBrokenStockModal with Reused WorkspaceProductSearchBar, Batch Picker & Segmented Classification |
| [x] | Task 125: Frontend - Integrate "Add Expired / Broken Stock" Button on StockMetricsDesktopPage and ExpiredScrapItemsDesktopPage |
| [x] | Task 126: Frontend - Verification & End-to-End Build in pharmaerp-web |
| [x] | Task 127: Fix Mongoose 9 pre-save middleware signature in stockAdjustment.model.js (remove legacy next parameter) |
| [x] | Task 128: Council Deliberation & Multi-Tier Purchase Return Blueprint (Internal vs External Evaluation) |
| [x] | Task 129: Design Dedicated Single-Company Purchase Return System (Workflow, Data Schema, Stock Deduction, GST Debit Note & UI Flow) |
| [x] | Task 130: Backend - Purchase Return Constants, Model & Schema (`purchaseReturn.constant.js` & `purchaseReturn.model.js`) |
| [x] | Task 131: Backend - Purchase Return Repository (`purchaseReturn.repository.js`) |
| [x] | Task 132: Backend - FIFO Inflow Matching, Stock Decrement, Journal Voucher & GST Service (`purchaseReturn.service.js`) |
| [x] | Task 133: Backend - Validations, Controller & Routes Mounting (`purchaseReturn.routes.js`) |
| [x] | Task 134: Backend - Automated Unit & Integration Tests in pharmaerp-api |
| [x] | Task 135: Frontend - Purchase Return API Service & Route Definitions (`purchaseReturnService.js` & `AppRoutes.jsx`) |
| [x] | Task 136: Frontend - Integrate "Return to Supplier" Action on Expired & Scrap Items Page (Desktop, Mobile, Modal) |
| [x] | Task 137: Frontend - Create Purchase Return Terminal Page (`CreatePurchaseReturnPage.jsx`) |
| [x] | Task 138: Frontend - Purchase Returns Register & Printable Debit Note Modal (`PurchaseReturnsDesktopPage.jsx` & `PurchaseReturnDetailsModal.jsx`) |
| [x] | Task 139: End-to-End Build & System Verification across API and Web |
| [x] | Task 140: Upgrade Purchase Return Pages with PharmaERP v3.0 Reusable UI Primitives (PageHeader, StatCards, FilterBar, SummaryCard, InfoCard, Tabs & Motion) |
| [x] | Task 141: Automatic Supplier Selection based on Selected Return Batches (Backend Enrichment, Scrap Page Handoff, and Auto-Resolution in Return Terminal) |
| [x] | Task 142: Multi-Supplier Auto-Partitioning & Batch Debit Note Generation (Group by Supplier, Multi-Note Execution & GST Section 34 Isolation) |
| [x] | Task 143: Streamline & Polish Purchase Return Terminal with Swiss Minimalist UI Design (Single-Bar Context Strip, Spotlight Search, Tabular Steppers, and Sleek Summary) |
| [x] | Task 144: Council Deliberation & Brainstorming for Return Box Labels & Inter-Branch Dispatch Routing |
| [x] | Task 145: Create `ReturnBoxLabelModal.jsx` (Thermal 4x6 / A4 Label Generator with Barcode, Current Branch, Destination Branch & Supplier) |
| [x] | Task 146: Integrate "Create Transport Label" Button in Purchase Return Creation Terminal (Desktop & Mobile) |
| [x] | Task 147: Integrate "Transport Label" & "Transfer to Other Branch" Actions in `PurchaseReturnDetailsModal.jsx` |
| [x] | Task 148: End-to-End Build & System Verification across Purchases and Transfer Orders |

