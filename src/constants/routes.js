export const ROUTES = {
  HOME: "/",
  UI_SHOWCASE: "/ui-showcase",
  CHOOSE_MODE: "/choose-mode",

  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // Subscription
  UPGRADE_PLAN: "/subscription/upgrade-plan",
  CHECKOUT: "/subscription/checkout",

  // Members & Staff
  MEMBERS: "/members",
  WORKSPACE_MEMBERS: "/members",
  WORKSPACE_MEMBER_DETAILS: (memberId = ":memberId") =>
    `/members/${memberId}`,
  WORKSPACE_INVITATIONS: "/members/invitations",
  INVITE_WORKSPACE_MEMBER: "/members/invite",
  ACCEPT_WORKSPACE_INVITATION: "/invitations/:token",

  // Company
  COMPANIES: "/companies",
  CREATE_COMPANY: "/companies/create",
  EDIT_COMPANY: "/companies/:companyId/edit",
  COMPANY_DETAILS: "/companies/:companyId",
  COMPANY_SETTINGS: "/companies/:companyId/settings",

  // Branch
  BRANCHES: "/branches",
  CREATE_BRANCH: "/branches/create",
  EDIT_BRANCH: "/branches/:branchId/edit",
  BRANCH_DETAILS: "/branches/:branchId",
  BRANCH_SETTINGS: "/branches/:branchId/settings",

  // Roles & Permissions
  ROLES: "/roles-permissions",
  CREATE_ROLE: "/roles-permissions/create",
  EDIT_ROLE: "/roles-permissions/:roleId/edit",
  ROLE_DETAILS: "/roles-permissions/:roleId",
  PERMISSIONS: "/roles-permissions/permissions",

  // Parties
  PARTIES: "/parties",

  // Parties - Customers
  CUSTOMERS: "/parties/customers",

  CREATE_CUSTOMER: "/parties/customers/create",

  CUSTOMER_DETAILS: (customerId = ":customerId") =>
    `/parties/customers/${customerId}`,

  EDIT_CUSTOMER: (customerId = ":customerId") =>
    `/parties/customers/${customerId}/edit`,

  CUSTOMER_SETTLEMENTS: "/parties/customers/settlements",

  // Parties - Suppliers
  SUPPLIERS: "/parties/suppliers",

  CREATE_SUPPLIER: "/parties/suppliers/create",

  SUPPLIER_DETAILS: (supplierId = ":supplierId") =>
    `/parties/suppliers/${supplierId}`,

  EDIT_SUPPLIER: (supplierId = ":supplierId") =>
    `/parties/suppliers/${supplierId}/edit`,

  // Clinical - Doctors (Prescription Reference)
  DOCTORS: "/doctors",
  CREATE_DOCTOR: "/doctors/create",
  DOCTOR_DETAILS: (doctorId = ":doctorId") => `/doctors/${doctorId}`,
  EDIT_DOCTOR: (doctorId = ":doctorId") => `/doctors/${doctorId}/edit`,

  // Finance
  FINANCE: "/finance",

  // Finance - Ledger
  LEDGER: "/finance/ledger",

  // Finance - GST Ledger
  GSTR1: "/finance/gst-ledger/gstr-1",
  GSTR2: "/finance/gst-ledger/gstr-2",
  GSTR3B: "/finance/gst-ledger/gstr-3b",

  // Reports & Analytics Hub
  REPORTS_HUB: "/reports",
  REPORTS_SALES: "/reports/sales",
  REPORTS_SALES_SUB: (subReport = ":subReport") => `/reports/sales/${subReport}`,
  REPORTS_PURCHASE: "/reports/purchase",
  REPORTS_PURCHASE_SUB: (subReport = ":subReport") => `/reports/purchase/${subReport}`,
  REPORTS_INVENTORY: "/reports/inventory",
  REPORTS_INVENTORY_SUB: (subReport = ":subReport") => `/reports/inventory/${subReport}`,
  REPORTS_CUSTOMER: "/reports/customer",
  REPORTS_CUSTOMER_SUB: (subReport = ":subReport") => `/reports/customer/${subReport}`,
  REPORTS_SUPPLIER: "/reports/supplier",
  REPORTS_SUPPLIER_SUB: (subReport = ":subReport") => `/reports/supplier/${subReport}`,
  REPORTS_FINANCIAL: "/reports/financial",
  REPORTS_FINANCIAL_SUB: (subReport = ":subReport") => `/reports/financial/${subReport}`,
  REPORTS_GST: "/reports/gst",
  REPORTS_GST_SUB: (subReport = ":subReport") => `/reports/gst/${subReport}`,
  REPORTS_PRODUCT: "/reports/product",
  REPORTS_PRODUCT_SUB: (subReport = ":subReport") => `/reports/product/${subReport}`,
  REPORTS_CUSTOM: "/reports/custom",
  REPORTS_CUSTOM_SUB: (subReport = ":subReport") => `/reports/custom/${subReport}`,
  REPORTS_CATEGORY: (category = ":category") => `/reports/${category}`,
  REPORTS_SUB: (category = ":category", subReport = ":subReport") => `/reports/${category}/${subReport}`,
  REPORTS_HUB_VIEWER: (reportKey = ":reportKey") => `/reports/${reportKey}`,

  // Finance - Legacy Reports
  REPORTS: "/finance/reports",
  REPORT_VIEWER: "/finance/reports/:reportType",

  // Finance - Chart Of Accounts
  CHART_OF_ACCOUNTS: "/finance/chart-of-accounts",

  // Finance - Chart Of Accounts - Account Groups

  ACCOUNT_GROUPS: "/finance/chart-of-accounts/account-groups",

  CREATE_ACCOUNT_GROUP: "/finance/chart-of-accounts/account-groups/create",

  ACCOUNT_GROUP_DETAILS: (groupId = ":groupId") =>
    `/finance/chart-of-accounts/account-groups/${groupId}`,

  EDIT_ACCOUNT_GROUP: (groupId = ":groupId") =>
    `/finance/chart-of-accounts/account-groups/${groupId}/edit`,

  // Finance - Chart Of Accounts - Accounts

  ACCOUNTS: "/finance/chart-of-accounts/accounts",

  CREATE_ACCOUNT: "/finance/chart-of-accounts/accounts/create",

  ACCOUNT_DETAILS: (accountId = ":accountId") =>
    `/finance/chart-of-accounts/accounts/${accountId}`,

  EDIT_ACCOUNT: (accountId = ":accountId") =>
    `/finance/chart-of-accounts/accounts/${accountId}/edit`,

  // Finance - Account Balances
  ACCOUNT_BALANCES: "/finance/account-balances",

  // Finance - Journal Vouchers

  JOURNAL_VOUCHERS: "/finance/journal-vouchers",

  CREATE_JOURNAL_VOUCHER: "/finance/journal-vouchers/create",

  JOURNAL_VOUCHER_DETAILS: (voucherId = ":voucherId") =>
    `/finance/journal-vouchers/${voucherId}`,

  EDIT_JOURNAL_VOUCHER: (voucherId = ":voucherId") =>
    `/finance/journal-vouchers/${voucherId}/edit`,

  // Finance - Financial Periods
  FINANCIAL_PERIODS: "/finance/financial-periods",
  CREATE_FINANCIAL_PERIOD: "/finance/financial-periods/create",

  // Treasury
  TREASURY: "/finance/treasury",

  // Finance - Treasury - Bank Accounts

  BANK_ACCOUNTS: "/finance/treasury/bank-accounts",

  CREATE_BANK_ACCOUNT: "/finance/treasury/bank-accounts/create",

  BANK_ACCOUNT_DETAILS: (bankAccountId = ":bankAccountId") =>
    `/finance/treasury/bank-accounts/${bankAccountId}`,

  EDIT_BANK_ACCOUNT: (bankAccountId = ":bankAccountId") =>
    `/finance/treasury/bank-accounts/${bankAccountId}/edit`,

  // Finance - Treasury - Branch Cash
  BRANCH_CASH: "/finance/treasury/branch-cash",



  // Finance - Treasury - Payment QR

  PAYMENT_QRS: "/finance/treasury/payment-qrs",

  CREATE_PAYMENT_QR: "/finance/treasury/payment-qrs/create",

  PAYMENT_QR_DETAILS: (paymentQrId = ":paymentQrId") =>
    `/finance/treasury/payment-qrs/${paymentQrId}`,

  EDIT_PAYMENT_QR: (paymentQrId = ":paymentQrId") =>
    `/finance/treasury/payment-qrs/${paymentQrId}/edit`,

  // Finance - Treasury - UPI Transactions & Daily Tally
  UPI_TRANSACTIONS: "/finance/treasury/upi-transactions",



  // Finance - Treasury - Bank Transactions

  BANK_TRANSACTIONS: "/finance/treasury/bank-transactions",

  BANK_TRANSACTION_DETAILS: (bankTransactionId = ":bankTransactionId") =>
    `/finance/treasury/bank-transactions/${bankTransactionId}`,

  // Finance - Treasury - Cash Transactions

  CASH_TRANSACTIONS: "/finance/treasury/cash-transactions",

  CASH_TRANSACTION_DETAILS: (cashTransactionId = ":cashTransactionId") =>
    `/finance/treasury/cash-transactions/${cashTransactionId}`,

  // Finance - Treasury - Fund Transfers
  FUND_TRANSFERS: "/finance/treasury/fund-transfers",
  CREATE_FUND_TRANSFER: "/finance/treasury/fund-transfers/create",
  FUND_TRANSFER_DETAILS: (fundTransferId = ":fundTransferId") =>
    `/finance/treasury/fund-transfers/${fundTransferId}`,

  // Finance - Treasury - Cash Exchanges
  CASH_EXCHANGES: "/finance/treasury/cash-exchanges",
  CREATE_CASH_EXCHANGE: "/finance/treasury/cash-exchanges/create",
  CASH_EXCHANGE_DETAILS: (cashExchangeId = ":cashExchangeId") =>
    `/finance/treasury/cash-exchanges/${cashExchangeId}`,

  // Finance - Treasury - Cheques
  CHEQUES: "/finance/treasury/cheque-management",
  CREATE_CHEQUE: "/finance/treasury/cheque-management/create",
  CHEQUE_DETAILS: (chequeId = ":chequeId") =>
    `/finance/treasury/cheque-management/${chequeId}`,

  // Finance - Treasury - Bank Deposit Slips
  BANK_DEPOSIT_SLIPS: "/finance/treasury/bank-deposit-slips",
  CASH_IN_TRANSIT: "/finance/treasury/cash-in-transit",
  CREATE_BANK_DEPOSIT_SLIP: "/finance/treasury/bank-deposit-slips/create",
  BANK_DEPOSIT_SLIP_DETAILS: (slipId = ":slipId") =>
    `/finance/treasury/bank-deposit-slips/${slipId}`,

  // Catalog
  CATALOG: "/catalog",

  // Catalog - Global Products
  GLOBAL_PRODUCTS: "/catalog/global-products",
  GLOBAL_PRODUCT_DETAILS: "/catalog/global-products/:productId",

  // Catalog - Workspace Products
  WORKSPACE_PRODUCTS: "/workspace-products",
  CREATE_WORKSPACE_PRODUCT: "/workspace-products/create",
  EDIT_WORKSPACE_PRODUCT: "/workspace-products/:productId/edit",
  WORKSPACE_PRODUCT_DETAILS: "/workspace-products/:productId",
  WORKSPACE_PRODUCT_IMPORT: "/workspace-products/import",
  WORKSPACE_PRODUCT_SEARCH: "/workspace-products/search",

  // Inventory - Stock Metrics
  STOCK_METRICS: "/inventory/stock-metrics",

  // Catalog - HSN Master (Read-Only Workspace View)
  HSN_MASTER: "/catalog/hsn-master",

  // Catalog - Manufacturer Master
  MANUFACTURER_MASTER: "/catalog/manufacturer-master",

  // Catalog - UOM Master
  UOM_MASTER: "/catalog/uom-master",

  // Catalog - Category Master
  CATEGORY_MASTER: "/catalog/category-master",

  // Catalog - Product Form Master
  PRODUCT_FORM_MASTER: "/catalog/product-form-master",

  // Catalog - Salt Master
  SALT_MASTER: "/catalog/salt-master",

  BANK_MASTER: "/catalog/bank-master",

  // Marketplace Portal
  MARKETPLACE: "/marketplace",

  // Marketplace Stores
  MARKETPLACE_STORES: "/marketplace/stores",
  CREATE_MARKETPLACE_STORE: "/marketplace/stores/create",
  MARKETPLACE_STORE_DETAILS: (storeId = ":storeId") =>
    `/marketplace/stores/${storeId}`,
  EDIT_MARKETPLACE_STORE: (storeId = ":storeId") =>
    `/marketplace/stores/${storeId}/edit`,

  // Marketplace Products
  MARKETPLACE_PRODUCTS: "/marketplace/products",
  CREATE_MARKETPLACE_PRODUCT: "/marketplace/products/create",
  MARKETPLACE_PRODUCT_DETAILS: (productId = ":productId") =>
    `/marketplace/products/${productId}`,
  EDIT_MARKETPLACE_PRODUCT: (productId = ":productId") =>
    `/marketplace/products/${productId}/edit`,

  // Setup
  SETUP_CENTER: "/setup",

  // Dashboard
  DASHBOARD: "/dashboard",
  BRANCH_DASHBOARD: "/dashboard/branch",
  COMPANY_DASHBOARD: "/dashboard/company",
  WORKSPACE_DASHBOARD: "/dashboard/workspace",

  // User Profile
  PROFILE: "/me",

  // Sales & POS
  SALES: "/sales",
  SALE_EDIT: (invoiceId = ":invoiceId") => `/sales/edit/${invoiceId}`,
  SALE_EDIT_ROUTE: "/sales/edit/:invoiceId",

  // Billing & Invoices
  BILLING: "/billing",
  SALES_RETURNS: "/sales-returns",
  CREDIT_NOTES: "/sales/credit-notes",

  // Purchases & Procurement
  PURCHASES: "/purchases",
  CREATE_PURCHASE_BILL: "/purchases/bills/create",
  EDIT_PURCHASE_BILL: (billId = ":billId") => `/purchases/bills/${billId}/edit`,

  // Help & Support
  HELP_CENTER: "/help-center",

  // Settings
  SETTINGS: "/settings",

  // Management
  USERS: "/users",

  // Welcome
  WELCOME: "/welcome",

  // Fallback
  NOT_FOUND: "*",
};
