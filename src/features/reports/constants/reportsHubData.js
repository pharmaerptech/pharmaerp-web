// src/features/reports/constants/reportsHubData.js

import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Truck,
  Calculator,
  FileText,
  BarChart2,
  Tag,
  Sliders,
  Receipt,
  FilePlus,
  Clock,
  Download,
  Percent,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Boxes,
  UserCheck,
  CreditCard,
  Building2,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Database,
  Share2,
  SlidersHorizontal,
  Wallet,
  QrCode,
} from "lucide-react";

/**
 * ── 1. Top KPI Stat Cards for Reports Front Page (Image 2) ──────────────────
 */
export const REPORTS_OVERVIEW_STATS = [
  {
    id: "total-sales",
    title: "Total Sales",
    value: "₹12,48,500",
    trend: "12.5%",
    trendDirection: "up",
    trendLabel: "vs previous period",
    color: "emerald",
    icon: TrendingUp,
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
    sparklineColor: "#10b981",
    sparklinePath: "M 0,22 C 15,22 25,28 38,20 C 50,12 62,25 75,10 C 85,5 92,15 100,6",
  },
  {
    id: "total-purchase",
    title: "Total Purchase",
    value: "₹8,32,400",
    trend: "8.2%",
    trendDirection: "up",
    trendLabel: "vs previous period",
    color: "sky",
    icon: ShoppingCart,
    iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400",
    sparklineColor: "#0ea5e9",
    sparklinePath: "M 0,26 C 20,26 30,30 45,22 C 60,14 70,20 85,15 C 92,12 96,16 100,11",
  },
  {
    id: "stock-value",
    title: "Current Stock Value",
    value: "₹18,75,300",
    trend: "5.1%",
    trendDirection: "up",
    trendLabel: "vs previous period",
    color: "purple",
    icon: Package,
    iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400",
    sparklineColor: "#a855f7",
    sparklinePath: "M 0,24 C 18,24 25,18 42,22 C 58,26 68,14 82,12 C 90,10 95,16 100,9",
  },
  {
    id: "total-customers",
    title: "Total Customers",
    value: "3,482",
    trend: "18.3%",
    trendDirection: "up",
    trendLabel: "vs previous period",
    color: "amber",
    icon: Users,
    iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
    sparklineColor: "#f59e0b",
    sparklinePath: "M 0,27 C 15,27 28,20 40,24 C 55,28 65,16 80,18 C 90,20 95,12 100,8",
  },
];

/**
 * ── Helper to generate 31 daily trend points ────────────────────────────────
 */
export const generateDailyTrend = (val1Mul = 1, val2Mul = 1) => [
  { date: "01 Oct", sales: Math.round(48 * val1Mul), profit: Math.round(24 * val2Mul) },
  { date: "02 Oct", sales: Math.round(42 * val1Mul), profit: Math.round(20 * val2Mul) },
  { date: "03 Oct", sales: Math.round(55 * val1Mul), profit: Math.round(28 * val2Mul) },
  { date: "04 Oct", sales: Math.round(78 * val1Mul), profit: Math.round(38 * val2Mul) },
  { date: "05 Oct", sales: Math.round(50 * val1Mul), profit: Math.round(25 * val2Mul) },
  { date: "06 Oct", sales: Math.round(46 * val1Mul), profit: Math.round(22 * val2Mul) },
  { date: "07 Oct", sales: Math.round(62 * val1Mul), profit: Math.round(32 * val2Mul) },
  { date: "08 Oct", sales: Math.round(38 * val1Mul), profit: Math.round(18 * val2Mul) },
  { date: "09 Oct", sales: Math.round(45 * val1Mul), profit: Math.round(23 * val2Mul) },
  { date: "10 Oct", sales: Math.round(70 * val1Mul), profit: Math.round(36 * val2Mul) },
  { date: "11 Oct", sales: Math.round(54 * val1Mul), profit: Math.round(26 * val2Mul) },
  { date: "12 Oct", sales: Math.round(48 * val1Mul), profit: Math.round(23 * val2Mul) },
  { date: "13 Oct", sales: Math.round(82 * val1Mul), profit: Math.round(42 * val2Mul) },
  { date: "14 Oct", sales: Math.round(60 * val1Mul), profit: Math.round(30 * val2Mul) },
  { date: "15 Oct", sales: Math.round(52 * val1Mul), profit: Math.round(26 * val2Mul) },
  { date: "16 Oct", sales: Math.round(66 * val1Mul), profit: Math.round(34 * val2Mul) },
  { date: "17 Oct", sales: Math.round(44 * val1Mul), profit: Math.round(21 * val2Mul) },
  { date: "18 Oct", sales: Math.round(58 * val1Mul), profit: Math.round(29 * val2Mul) },
  { date: "19 Oct", sales: Math.round(76 * val1Mul), profit: Math.round(38 * val2Mul) },
  { date: "20 Oct", sales: Math.round(52 * val1Mul), profit: Math.round(27 * val2Mul) },
  { date: "21 Oct", sales: Math.round(49 * val1Mul), profit: Math.round(24 * val2Mul) },
  { date: "22 Oct", sales: Math.round(79 * val1Mul), profit: Math.round(40 * val2Mul) },
  { date: "23 Oct", sales: Math.round(56 * val1Mul), profit: Math.round(28 * val2Mul) },
  { date: "24 Oct", sales: Math.round(62 * val1Mul), profit: Math.round(31 * val2Mul) },
  { date: "25 Oct", sales: Math.round(84 * val1Mul), profit: Math.round(43 * val2Mul) },
  { date: "26 Oct", sales: Math.round(58 * val1Mul), profit: Math.round(29 * val2Mul) },
  { date: "27 Oct", sales: Math.round(54 * val1Mul), profit: Math.round(27 * val2Mul) },
  { date: "28 Oct", sales: Math.round(72 * val1Mul), profit: Math.round(37 * val2Mul) },
  { date: "29 Oct", sales: Math.round(48 * val1Mul), profit: Math.round(24 * val2Mul) },
  { date: "30 Oct", sales: Math.round(68 * val1Mul), profit: Math.round(34 * val2Mul) },
  { date: "31 Oct", sales: Math.round(58 * val1Mul), profit: Math.round(30 * val2Mul) },
];

/**
 * ── 2. The 9 Master Report Categories with Full 45-Report Configurations ───
 */
export const MASTER_CATEGORIES_DATA = {
  // ── 1. Sales Reports ──────────────────────────────────────────────
  "sales": {
    id: "sales-reports",
    slug: "sales",
    title: "Sales Reports",
    subtitle: "Sales analysis, billing reports and customer insights",
    theme: {
      headerBg: "bg-[#edfcf2] dark:bg-emerald-950/25",
      headerBorder: "border-[#d3f4de] dark:border-emerald-900/30",
      iconBg: "bg-[#d1fae5] dark:bg-emerald-900/40 text-[#059669] dark:text-emerald-400",
      activeTabBg: "bg-[#edfcf2] dark:bg-emerald-950/40 text-[#047857] dark:text-emerald-300 border-[#a7f3d0] dark:border-emerald-800/50",
      activeIconBg: "bg-[#d1fae5] dark:bg-emerald-900/50 text-[#059669] dark:text-emerald-400",
    },
    icon: ShoppingCart,
    items: [
      { id: "sales-summary", slug: "summary", title: "Sales Summary", subtitle: "Daily, monthly, yearly sales report", icon: BarChart2 },
      { id: "sales-detail", slug: "detail", title: "Sales Detail Report", subtitle: "Invoice wise detailed sales", icon: FileText },
      { id: "customer-sales", slug: "customer", title: "Customer Sales Report", subtitle: "Customer wise purchase analysis", icon: FileText },
      { id: "product-sales", slug: "product", title: "Product Sales Report", subtitle: "Best selling & slow moving products", icon: FileText },
      { id: "sales-return", slug: "return", title: "Sales Return Report", subtitle: "Returned items and credit notes", icon: FileText },
    ],
    tabs: {
      "summary": {
        id: "sales-summary",
        slug: "summary",
        title: "Sales Summary",
        subtitle: "Daily, monthly, and yearly sales overview with gross billing, GST tax, and payment mode breakdown.",
        stats: [
          { id: "s1", dataKey: "totalSales", title: "Total Net Sales", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "for period", icon: Tag, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
          { id: "s2", dataKey: "totalInvoices", title: "Total Invoices", value: "0", trend: "—", trendDirection: "up", trendLabel: "bills cleared", icon: FileText, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
          { id: "s3", dataKey: "cashSales", title: "Cash Collected", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "counter cash", icon: Wallet, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
          { id: "s4", dataKey: "upiSales", title: "UPI & Digital Sales", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "digital payments", icon: QrCode, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
        ],
        chart: { title: "Sales Revenue & Invoices Trend", metric1Label: "Net Sales", metric2Label: "Bills Cleared", metric1Color: "#059669", metric2Color: "#38bdf8", data: [] },
        filterPlaceholder: "Search by invoice no., doctor, customer...",
        columns: [
          { key: "date", label: "Date" },
          { key: "invoiceNo", label: "Invoice No." },
          { key: "customer", label: "Customer" },
          { key: "doctor", label: "Prescribing Doctor" },
          { key: "items", label: "Items", align: "center" },
          { key: "billAmount", label: "Subtotal", align: "right", isCurrency: true },
          { key: "discount", label: "Discount", align: "right", isCurrency: true },
          { key: "tax", label: "GST Tax", align: "right", isCurrency: true },
          { key: "netAmount", label: "Net Total", align: "right", isCurrency: true, highlight: true },
          { key: "paymentMode", label: "Payment Mode", align: "center" },
          { key: "status", label: "Status", align: "center", isStatus: true },
        ],
        rows: [],
      },
      "detail": {
        id: "sales-detail",
        slug: "detail",
        title: "Sales Detail Report",
        subtitle: "Invoice wise line item breakdown with medicine, batch, quantity, GST rate, and margins.",
        stats: [
          { id: "sd1", dataKey: "grossSales", title: "Gross Sales", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "before discount", icon: Receipt, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
          { id: "sd2", dataKey: "totalDiscounts", title: "Total Discounts", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "down", trendLabel: "counter discounts", icon: Percent, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
          { id: "sd3", dataKey: "gstCollected", title: "GST Collected", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "tax output", icon: Tag, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
          { id: "sd4", dataKey: "netRealized", title: "Net Realized", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "total net revenue", icon: TrendingUp, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
        ],
        chart: { title: "Gross vs Net Realization", metric1Label: "Gross Billing", metric2Label: "Net Realized", metric1Color: "#10b981", metric2Color: "#0284c7", data: [] },
        filterPlaceholder: "Search medicine, batch, invoice number...",
        columns: [
          { key: "date", label: "Date" },
          { key: "invoiceNo", label: "Invoice No." },
          { key: "item", label: "Medicine / Product" },
          { key: "batch", label: "Batch No." },
          { key: "qty", label: "Qty", align: "center" },
          { key: "unitPrice", label: "Unit Rate", align: "right", isCurrency: true },
          { key: "gstRate", label: "GST %", align: "center" },
          { key: "discount", label: "Discount", align: "right", isCurrency: true },
          { key: "total", label: "Total (₹)", align: "right", isCurrency: true, highlight: true },
          { key: "cashier", label: "Dispensed By" },
        ],
        rows: [],
      },
      "customer": {
        id: "customer-sales",
        slug: "customer",
        title: "Customer Sales Report",
        subtitle: "Customer wise purchase frequency, total billing volume, outstanding ledger, and loyalty insights.",
        stats: [
          { id: "cs1", dataKey: "activeBuyers", title: "Active Buyers", value: "0", trend: "—", trendDirection: "up", trendLabel: "unique customers", icon: Users, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
          { id: "cs2", dataKey: "totalBilling", title: "Total Billing", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "customer spend", icon: ShoppingCart, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
          { id: "cs3", dataKey: "udharGiven", title: "Udhar Credit Given", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "down", trendLabel: "credit sales issued", icon: CreditCard, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
          { id: "cs4", dataKey: "avgSpend", title: "Average Spend / Buyer", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "per active customer", icon: TrendingUp, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
        ],
        chart: { title: "Patient Volume & Spend Trend", metric1Label: "Total Billing", metric2Label: "Credit Given", metric1Color: "#6366f1", metric2Color: "#10b981", data: [] },
        filterPlaceholder: "Search customer name, phone number, code...",
        columns: [
          { key: "customer", label: "Patient / Customer" },
          { key: "phone", label: "Phone Number" },
          { key: "visits", label: "Visits", align: "center" },
          { key: "totalSpend", label: "Total Billing", align: "right", isCurrency: true, highlight: true },
          { key: "outstanding", label: "Udhar Outstanding", align: "right", isCurrency: true },
          { key: "lastVisit", label: "Last Visit" },
          { key: "segment", label: "Segment", align: "center" },
          { key: "mode", label: "Preferred Mode", align: "center" },
        ],
        rows: [],
      },
      "product": {
        id: "product-sales",
        slug: "product",
        title: "Product Sales Report",
        subtitle: "Product wise turnover, units dispensed, revenue ranking, and inventory velocity.",
        stats: [
          { id: "ps1", dataKey: "distinctSkus", title: "Distinct SKUs Sold", value: "0", trend: "—", trendDirection: "up", trendLabel: "unique medicines", icon: Boxes, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
          { id: "ps2", dataKey: "top10Share", title: "Top 10 SKU Share", value: "0%", trend: "—", trendDirection: "up", trendLabel: "of total revenue", icon: Percent, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
          { id: "ps3", dataKey: "totalUnits", title: "Total Units Dispensed", value: "0", trend: "—", trendDirection: "up", trendLabel: "bottles & strips sold", icon: Tag, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
          { id: "ps4", dataKey: "totalRevenue", title: "Total Product Revenue", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "from dispensed items", icon: TrendingUp, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
        ],
        chart: { title: "Medicine Volume & Revenue Trend", metric1Label: "Revenue Produced", metric2Label: "Units Sold", metric1Color: "#f59e0b", metric2Color: "#10b981", data: [] },
        filterPlaceholder: "Search medicine name, brand, salt composition...",
        columns: [
          { key: "name", label: "Medicine / SKU" },
          { key: "manufacturer", label: "Manufacturer" },
          { key: "category", label: "Category" },
          { key: "units", label: "Units Sold", align: "center" },
          { key: "avgPrice", label: "Avg Price", align: "right", isCurrency: true },
          { key: "revenue", label: "Total Revenue", align: "right", isCurrency: true, highlight: true },
          { key: "margin", label: "Margin %", align: "center" },
          { key: "stock", label: "Stock Status", align: "center" },
        ],
        rows: [],
      },
      "return": {
        id: "sales-return",
        slug: "return",
        title: "Sales Return Report",
        subtitle: "Customer sales returns, credit note receipts, return reasons, and stock reversal history.",
        stats: [
          { id: "sr1", dataKey: "totalReturnValue", title: "Total Return Value", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "down", trendLabel: "returned goods", icon: RotateCcw, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
          { id: "sr2", dataKey: "totalVouchers", title: "Return Vouchers", value: "0", trend: "—", trendDirection: "down", trendLabel: "credit/return notes", icon: FileText, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
          { id: "sr3", dataKey: "cashRefunds", title: "Counter Cash Refunds", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "down", trendLabel: "disbursed from till", icon: Wallet, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
          { id: "sr4", dataKey: "creditNotes", title: "Credit Notes Issued", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "down", trendLabel: "store credit issued", icon: Tag, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
        ],
        chart: { title: "Daily Return & Refund Trend", metric1Label: "Return Value (₹)", metric2Label: "Credit Notes", metric1Color: "#f43f5e", metric2Color: "#8b5cf6", data: [] },
        filterPlaceholder: "Search return no., original invoice, patient...",
        columns: [
          { key: "date", label: "Date" },
          { key: "returnNo", label: "Return Voucher" },
          { key: "originalInvoice", label: "Original Invoice" },
          { key: "customer", label: "Customer" },
          { key: "items", label: "Returned Medicine" },
          { key: "refundAmount", label: "Refund (₹)", align: "right", isCurrency: true, highlight: true },
          { key: "reason", label: "Return Reason" },
          { key: "mode", label: "Mode", align: "center" },
          { key: "processedBy", label: "Approved By" },
        ],
        rows: [],
      },
    },
  },

  // ── 2. Purchase Reports ───────────────────────────────────────────
  "purchase": {
    id: "purchase-reports",
    slug: "purchase",
    title: "Purchase Reports",
    subtitle: "Purchase analysis and supplier insights",
    theme: {
      headerBg: "bg-[#f0f7ff] dark:bg-sky-950/25",
      headerBorder: "border-[#dbeafe] dark:border-sky-900/30",
      iconBg: "bg-[#e0f2fe] dark:bg-sky-900/40 text-[#0284c7] dark:text-sky-400",
      activeTabBg: "bg-[#f0f7ff] dark:bg-sky-950/40 text-[#0369a1] dark:text-sky-300 border-[#bae6fd] dark:border-sky-800/50",
      activeIconBg: "bg-[#e0f2fe] dark:bg-sky-900/50 text-[#0284c7] dark:text-sky-400",
    },
    icon: Truck,
    items: [
      { id: "purchase-summary", slug: "summary", title: "Purchase Summary", subtitle: "Daily, monthly, yearly purchase report", icon: BarChart2 },
      { id: "purchase-detail", slug: "detail", title: "Purchase Detail Report", subtitle: "Invoice wise detailed purchase", icon: FileText },
      { id: "supplier-purchase", slug: "supplier", title: "Supplier Purchase Report", subtitle: "Supplier wise purchase analysis", icon: FileText },
      { id: "purchase-return", slug: "return", title: "Purchase Return Report", subtitle: "Returned items and debit notes", icon: FileText },
      { id: "grn-report", slug: "grn", title: "GRN Report", subtitle: "Goods receipt note report", icon: FileText },
    ],
    tabs: {
      "summary": {
        id: "purchase-summary",
        slug: "summary",
        title: "Purchase Summary",
        subtitle: "Procurement volume, vendor invoice tracking, credit terms, and stock entry overview.",
        stats: [
          { id: "p1", dataKey: "totalPurchases", title: "Total Purchases", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "for period", icon: ShoppingCart, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
          { id: "p2", dataKey: "totalBills", title: "Bills Received", value: "0", trend: "—", trendDirection: "up", trendLabel: "invoices processed", icon: FileText, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
          { id: "p3", dataKey: "taxableAmount", title: "Taxable Inward", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "procurement subtotal", icon: Tag, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
          { id: "p4", dataKey: "totalGst", title: "Input GST ITC", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "tax credit claimed", icon: Percent, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
        ],
        chart: { title: "Purchase Volume & Inward Stock", metric1Label: "Purchase Spend", metric2Label: "Bills Inward", metric1Color: "#0284c7", metric2Color: "#10b981", data: [] },
        filterPlaceholder: "Search purchase invoice, supplier, medicine...",
        columns: [
          { key: "date", label: "Date" },
          { key: "billNo", label: "Bill / PB No." },
          { key: "supplierBillNo", label: "Vendor Inv No." },
          { key: "supplier", label: "Distributor / Supplier" },
          { key: "items", label: "SKUs", align: "center" },
          { key: "grossAmount", label: "Gross Amount", align: "right", isCurrency: true },
          { key: "tax", label: "GST Input", align: "right", isCurrency: true },
          { key: "netPayable", label: "Net Payable", align: "right", isCurrency: true, highlight: true },
          { key: "amountPaid", label: "Paid", align: "right", isCurrency: true },
          { key: "amountDue", label: "Due", align: "right", isCurrency: true },
          { key: "deliveryStatus", label: "Delivery", align: "center", isStatus: true },
        ],
        rows: [],
      },
      "detail": {
        id: "purchase-detail",
        slug: "detail",
        title: "Purchase Detail Report",
        subtitle: "Invoice wise line item breakdown with medicine, batch, quantity received, purchase rate, and GST slabs.",
        stats: [
          { id: "pd1", dataKey: "totalLineItems", title: "Line Items", value: "0", trend: "—", trendDirection: "up", trendLabel: "lines received", icon: FileText, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
          { id: "pd2", dataKey: "totalQty", title: "Delivered Units", value: "0", trend: "—", trendDirection: "up", trendLabel: "bottles & strips", icon: Package, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
          { id: "pd3", dataKey: "totalTaxable", title: "Taxable Inward", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "pre-tax value", icon: Tag, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
          { id: "pd4", dataKey: "totalInwardCost", title: "Realized Inward", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "total line cost", icon: TrendingUp, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
        ],
        chart: { title: "Purchase Inward Items vs Valuation", metric1Label: "Inward Value", metric2Label: "Line Items", metric1Color: "#0284c7", metric2Color: "#10b981", data: [] },
        filterPlaceholder: "Search medicine, batch, vendor bill...",
        columns: [
          { key: "date", label: "Date" },
          { key: "billNo", label: "Bill No." },
          { key: "supplier", label: "Supplier" },
          { key: "item", label: "Medicine Name" },
          { key: "pack", label: "Pack" },
          { key: "batch", label: "Batch No." },
          { key: "expiry", label: "Expiry" },
          { key: "qty", label: "Qty Received", align: "center" },
          { key: "freeQty", label: "Free", align: "center" },
          { key: "unitCost", label: "Purchase Rate", align: "right", isCurrency: true },
          { key: "mrp", label: "MRP", align: "right", isCurrency: true },
          { key: "gstRate", label: "GST %", align: "center" },
          { key: "total", label: "Total Inward", align: "right", isCurrency: true, highlight: true },
          { key: "status", label: "Status", align: "center", isStatus: true },
        ],
        rows: [],
      },
      "supplier": {
        id: "supplier-purchase",
        slug: "supplier",
        title: "Supplier Purchase Report",
        subtitle: "Supplier-wise procurement volume, invoice count, GST input breakdown, and outstanding payables.",
        stats: [
          { id: "ps1", dataKey: "activeSuppliers", title: "Active Distributors", value: "0", trend: "—", trendDirection: "up", trendLabel: "supplying vendors", icon: Truck, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
          { id: "ps2", dataKey: "totalProcurement", title: "Total Procurement", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "procurement volume", icon: Building2, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
          { id: "ps3", dataKey: "totalBills", title: "Invoices Received", value: "0", trend: "—", trendDirection: "up", trendLabel: "inward clearance", icon: FileText, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
          { id: "ps4", dataKey: "totalOutstanding", title: "Outstanding Payables", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "down", trendLabel: "due to stockists", icon: CreditCard, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
        ],
        chart: { title: "Supplier Procurement Volume Share", metric1Label: "Total Purchased", metric2Label: "Outstanding", metric1Color: "#0284c7", metric2Color: "#10b981", data: [] },
        filterPlaceholder: "Search distributor, GSTIN, mobile...",
        columns: [
          { key: "supplier", label: "Distributor / Supplier" },
          { key: "code", label: "Supplier Code" },
          { key: "gstin", label: "GSTIN" },
          { key: "phone", label: "Mobile Number" },
          { key: "billsCount", label: "Bills Received", align: "center" },
          { key: "taxableAmount", label: "Taxable Total", align: "right", isCurrency: true },
          { key: "gstAmount", label: "GST Input", align: "right", isCurrency: true },
          { key: "totalPurchases", label: "Total Procurement", align: "right", isCurrency: true, highlight: true },
          { key: "outstanding", label: "Payable Due", align: "right", isCurrency: true },
          { key: "lastPurchase", label: "Last Inward" },
        ],
        rows: [],
      },
      "return": {
        id: "purchase-return",
        slug: "return",
        title: "Purchase Return Report",
        subtitle: "Returned items, debit note vouchers, return reasons, and vendor adjustment credits.",
        stats: [
          { id: "pr1", dataKey: "totalReturnValue", title: "Total Return Value", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "down", trendLabel: "returned goods", icon: RotateCcw, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
          { id: "pr2", dataKey: "totalVouchers", title: "Debit Notes Issued", value: "0", trend: "—", trendDirection: "down", trendLabel: "vouchers cleared", icon: FileText, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
          { id: "pr3", dataKey: "gstReversed", title: "GST Input Reversed", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "down", trendLabel: "ITC reversed", icon: CheckCircle2, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
          { id: "pr4", dataKey: "pendingAdjustment", title: "Pending Claims", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "down", trendLabel: "awaiting credit note", icon: AlertTriangle, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
        ],
        chart: { title: "Monthly Debit Notes & Vendor Replacements", metric1Label: "Return Value", metric2Label: "Vouchers", metric1Color: "#f43f5e", metric2Color: "#10b981", data: [] },
        filterPlaceholder: "Search debit note, supplier, return reason...",
        columns: [
          { key: "date", label: "Date" },
          { key: "returnNo", label: "Debit Note / Voucher" },
          { key: "billNo", label: "Original Bill No." },
          { key: "supplier", label: "Supplier" },
          { key: "items", label: "Returned Items" },
          { key: "refundAmount", label: "Debit Value (₹)", align: "right", isCurrency: true, highlight: true },
          { key: "gstCredit", label: "GST Reversed", align: "right", isCurrency: true },
          { key: "reason", label: "Return Reason" },
          { key: "status", label: "Settlement Status", align: "center", isStatus: true },
        ],
        rows: [],
      },
      "grn": {
        id: "grn-report",
        slug: "grn",
        title: "GRN Report / Stock Inward Log",
        subtitle: "Goods receipt note register, inspected batches, receiving pharmacist, and QC pass audit.",
        stats: [
          { id: "pg1", dataKey: "totalInwards", title: "Total Inwards", value: "0", trend: "—", trendDirection: "up", trendLabel: "goods receipt logs", icon: FileText, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
          { id: "pg2", dataKey: "totalSkusReceived", title: "SKUs Received", value: "0", trend: "—", trendDirection: "up", trendLabel: "distinct medicines", icon: CheckCircle2, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
          { id: "pg3", dataKey: "totalUnitsReceived", title: "Units Received", value: "0", trend: "—", trendDirection: "up", trendLabel: "bottles & strips", icon: Boxes, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
          { id: "pg4", dataKey: "inwardValuation", title: "Inward Valuation", value: "₹0.00", isCurrency: true, trend: "—", trendDirection: "up", trendLabel: "dock to shelf", icon: Clock, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
        ],
        chart: { title: "Daily Goods Receipts & QC Pass Rate", metric1Label: "Inward Value", metric2Label: "QC Cleared", metric1Color: "#0284c7", metric2Color: "#10b981", data: [] },
        filterPlaceholder: "Search GRN number, vendor invoice, supplier...",
        columns: [
          { key: "grnNo", label: "Inward / PB No." },
          { key: "date", label: "Receipt Date" },
          { key: "supplierBillNo", label: "Vendor Invoice No." },
          { key: "supplier", label: "Distributor / Supplier" },
          { key: "itemsReceived", label: "SKUs Received", align: "center" },
          { key: "totalUnits", label: "Units Received", align: "center" },
          { key: "inwardValue", label: "Inward Value", align: "right", isCurrency: true, highlight: true },
          { key: "receivedBy", label: "Received By" },
          { key: "status", label: "QC Status", align: "center", isStatus: true },
        ],
        rows: [],
      },
    },
  },

  // ── 3. Inventory Reports ──────────────────────────────────────────
  "inventory": {
    id: "inventory-reports",
    slug: "inventory",
    title: "Inventory Reports",
    subtitle: "Stock position, movement and valuation",
    theme: {
      headerBg: "bg-[#faf5ff] dark:bg-purple-950/25",
      headerBorder: "border-[#f3e8ff] dark:border-purple-900/30",
      iconBg: "bg-[#f3e8ff] dark:bg-purple-900/40 text-[#9333ea] dark:text-purple-400",
      activeTabBg: "bg-[#faf5ff] dark:bg-purple-950/40 text-[#7e22ce] dark:text-purple-300 border-[#e9d5ff] dark:border-purple-800/50",
      activeIconBg: "bg-[#f3e8ff] dark:bg-purple-900/50 text-[#9333ea] dark:text-purple-400",
    },
    icon: Package,
    items: [
      { id: "current-stock", slug: "current-stock", title: "Current Stock Report", subtitle: "Current stock with quantity and value", icon: FileText },
      { id: "stock-movement", slug: "stock-movement", title: "Stock Movement Report", subtitle: "Stock in/out movement history", icon: FileText },
      { id: "stock-valuation", slug: "stock-valuation", title: "Stock Valuation Report", subtitle: "Stock value at cost and MRP", icon: FileText },
      { id: "expiry-report", slug: "expiry", title: "Expiry Report", subtitle: "Near expiry and expired products", icon: FileText },
      { id: "low-stock", slug: "low-stock", title: "Low Stock Report", subtitle: "Products below reorder level", icon: FileText },
    ],
    tabs: {
      "current-stock": {
        id: "current-stock",
        slug: "current-stock",
        title: "Current Stock Report",
        subtitle: "Real-time on-shelf physical stock inventory, batch tracking, and warehouse valuation.",
        stats: [
          { id: "i1", title: "Current Stock Value", value: "₹18,75,300", trend: "5.1%", trendDirection: "up", trendLabel: "vs previous month", icon: Package, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
          { id: "i2", title: "Total Units on Hand", value: "42,650", trend: "3.4%", trendDirection: "up", trendLabel: "bottles & strips", icon: Boxes, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
          { id: "i3", title: "Zero Stock SKUs", value: "14", trend: "8.0%", trendDirection: "down", trendLabel: "out of stock items", icon: AlertTriangle, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
          { id: "i4", title: "Reorder Triggered", value: "36", trend: "2.5%", trendDirection: "up", trendLabel: "below minimum level", icon: RotateCcw, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
        ],
        chart: { title: "Stock Inward vs Dispensed Outward", metric1Label: "Stock Inward", metric2Label: "Sales Dispensed", metric1Color: "#a855f7", metric2Color: "#10b981", data: generateDailyTrend(0.8, 0.82) },
        filterPlaceholder: "Search medicine name, generic composition, rack location...",
        columns: [
          { key: "name", label: "Medicine / Product" },
          { key: "batch", label: "Batch No." },
          { key: "expiry", label: "Expiry Date" },
          { key: "rack", label: "Rack / Shelf" },
          { key: "stockQty", label: "Stock Qty", align: "center" },
          { key: "purchaseRate", label: "Cost Price", align: "right", isCurrency: true },
          { key: "mrp", label: "MRP", align: "right", isCurrency: true },
          { key: "totalValue", label: "Stock Valuation", align: "right", isCurrency: true, highlight: true },
          { key: "status", label: "Status", align: "center", isStatus: true },
        ],
        rows: [
          { id: "1", name: "Augmentin 625 Duo Tablet", batch: "AG-6251", expiry: "12/2026", rack: "R-02 / B4", stockQty: 240, purchaseRate: 160.0, mrp: 204.5, totalValue: 38400.0, status: "Normal" },
          { id: "2", name: "Pan D Capsule (15s)", batch: "PND-992", expiry: "08/2026", rack: "R-01 / A2", stockQty: 180, purchaseRate: 148.0, mrp: 198.0, totalValue: 26640.0, status: "Normal" },
          { id: "3", name: "Telma 40mg Tablet", batch: "TLM-441", expiry: "04/2027", rack: "R-03 / C1", stockQty: 310, purchaseRate: 185.0, mrp: 245.0, totalValue: 57350.0, status: "Normal" },
          { id: "4", name: "Dolo 650mg Paracetamol", batch: "DOL-112", expiry: "10/2027", rack: "R-01 / A1", stockQty: 850, purchaseRate: 24.5, mrp: 32.0, totalValue: 20825.0, status: "Fast Moving" },
          { id: "5", name: "Glycomet GP2 Forte", batch: "GLY-087", expiry: "03/2026", rack: "R-04 / D2", stockQty: 145, purchaseRate: 220.0, mrp: 285.0, totalValue: 31900.0, status: "Normal" },
          { id: "6", name: "Shelcal 500 Calcium Strip", batch: "SHL-701", expiry: "09/2026", rack: "R-02 / B1", stockQty: 290, purchaseRate: 102.0, mrp: 135.0, totalValue: 29580.0, status: "Normal" },
          { id: "7", name: "Rosuvas 10mg Strip", batch: "RSV-810", expiry: "05/2027", rack: "R-03 / C3", stockQty: 85, purchaseRate: 295.0, mrp: 380.0, totalValue: 25075.0, status: "Low Stock" },
          { id: "8", name: "Allegra 120mg Tablet", batch: "ALG-303", expiry: "11/2026", rack: "R-02 / B5", stockQty: 160, purchaseRate: 168.0, mrp: 215.0, totalValue: 26880.0, status: "Normal" },
          { id: "9", name: "Thyronorm 50mcg (100s)", batch: "THY-612", expiry: "01/2027", rack: "R-05 / E1", stockQty: 60, purchaseRate: 138.0, mrp: 175.0, totalValue: 8280.0, status: "Low Stock" },
          { id: "10", name: "Montair LC Kid Syrup", batch: "MNT-223", expiry: "07/2026", rack: "R-06 / F2", stockQty: 115, purchaseRate: 122.0, mrp: 162.0, totalValue: 14030.0, status: "Normal" },
        ],
      },
    },
  },

  // ── 4. Customer Reports ───────────────────────────────────────────
  "customer": {
    id: "customer-reports",
    slug: "customer",
    title: "Customer Reports",
    subtitle: "Customer analysis and outstanding",
    theme: {
      headerBg: "bg-[#fff8f1] dark:bg-orange-950/25",
      headerBorder: "border-[#ffedd5] dark:border-orange-900/30",
      iconBg: "bg-[#ffedd5] dark:bg-orange-900/40 text-[#ea580c] dark:text-orange-400",
      activeTabBg: "bg-[#fff8f1] dark:bg-orange-950/40 text-[#c2410c] dark:text-orange-300 border-[#fed7aa] dark:border-orange-800/50",
      activeIconBg: "bg-[#ffedd5] dark:bg-orange-900/50 text-[#ea580c] dark:text-orange-400",
    },
    icon: Users,
    items: [
      { id: "customer-list", slug: "list", title: "Customer List", subtitle: "All customers with details", icon: BarChart2 },
      { id: "customer-purchase-report", slug: "purchases", title: "Customer Purchase Report", subtitle: "Customer wise purchase history", icon: FileText },
      { id: "customer-outstanding", slug: "outstanding", title: "Outstanding Report", subtitle: "Customer pending payments", icon: FileText },
      { id: "customer-credit", slug: "credit", title: "Customer Credit Report", subtitle: "Credit limit and usage", icon: FileText },
      { id: "customer-aging", slug: "aging", title: "Customer Aging Report", subtitle: "Outstanding aging analysis", icon: FileText },
    ],
    tabs: {
      "list": {
        id: "customer-list",
        slug: "list",
        title: "Customer List",
        subtitle: "Complete pharmacy patient profiles, chronic medication schedules, and contact details.",
        stats: [
          { id: "c1", title: "Total Registered", value: "3,482", trend: "18.3%", trendDirection: "up", trendLabel: "patient accounts", icon: Users, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
          { id: "c2", title: "Active This Month", value: "642", trend: "12.0%", trendDirection: "up", trendLabel: "purchased in Oct", icon: UserCheck, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
          { id: "c3", title: "Chronic Patients", value: "1,120", trend: "5.4%", trendDirection: "up", trendLabel: "monthly refills", icon: ShieldCheck, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
          { id: "c4", title: "Credit Accounts", value: "84", trend: "1.2%", trendDirection: "down", trendLabel: "udhar accounts", icon: CreditCard, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
        ],
        chart: { title: "Patient Registration Growth & Refills", metric1Label: "Registered Patients", metric2Label: "Refill Visits", metric1Color: "#f97316", metric2Color: "#10b981", data: generateDailyTrend(0.88, 0.7) },
        filterPlaceholder: "Search patient name, mobile, address, doctor...",
        columns: [
          { key: "name", label: "Customer / Patient" },
          { key: "phone", label: "Mobile" },
          { key: "city", label: "Area / City" },
          { key: "doctor", label: "Primary Doctor" },
          { key: "totalBills", label: "Total Bills", align: "center" },
          { key: "lifetimeSpend", label: "Lifetime Spend", align: "right", isCurrency: true, highlight: true },
          { key: "outstanding", label: "Balance Due", align: "right", isCurrency: true },
          { key: "tier", label: "Tier", align: "center" },
        ],
        rows: [
          { id: "1", name: "Rakesh Sharma", phone: "+91 98765 43210", city: "Civil Lines", doctor: "Dr. Arvind Mehta", totalBills: 48, lifetimeSpend: 68450.0, outstanding: 0.0, tier: "VIP Gold" },
          { id: "2", name: "Neha Patel", phone: "+91 98234 11223", city: "Model Town", doctor: "Dr. K. S. Sethi", totalBills: 24, lifetimeSpend: 32100.0, outstanding: 450.0, tier: "Silver" },
          { id: "3", name: "Amit Verma", phone: "+91 99100 88776", city: "Green Park", doctor: "Dr. Arvind Mehta", totalBills: 36, lifetimeSpend: 44600.0, outstanding: 1200.0, tier: "Gold" },
          { id: "4", name: "Sunita Jain", phone: "+91 94123 55667", city: "Gandhi Nagar", doctor: "Dr. R. Gupta", totalBills: 19, lifetimeSpend: 28300.0, outstanding: 0.0, tier: "Silver" },
          { id: "5", name: "Vikram Singh", phone: "+91 98989 33445", city: "Defense Colony", doctor: "Dr. P. K. Rao", totalBills: 15, lifetimeSpend: 24850.0, outstanding: 2500.0, tier: "Regular" },
          { id: "6", name: "Dr. Arvind Mehta Clinic", phone: "+91 98221 77889", city: "Central Market", doctor: "Self Prescribing", totalBills: 82, lifetimeSpend: 134200.0, outstanding: 0.0, tier: "Platinum" },
          { id: "7", name: "Pooja Malhotra", phone: "+91 97654 22110", city: "Lajpat Nagar", doctor: "Dr. K. S. Sethi", totalBills: 11, lifetimeSpend: 14950.0, outstanding: 0.0, tier: "Regular" },
          { id: "8", name: "Manoj Deshmukh", phone: "+91 98450 66778", city: "Railway Colony", doctor: "Dr. R. Gupta", totalBills: 28, lifetimeSpend: 36800.0, outstanding: 850.0, tier: "Silver" },
          { id: "9", name: "Kavita Rao", phone: "+91 99887 44332", city: "Sector 14", doctor: "Dr. Arvind Mehta", totalBills: 31, lifetimeSpend: 41600.0, outstanding: 0.0, tier: "Gold" },
          { id: "10", name: "Deepak Choudhary", phone: "+91 94321 00987", city: "Shastri Nagar", doctor: "Dr. P. K. Rao", totalBills: 9, lifetimeSpend: 11200.0, outstanding: 600.0, tier: "Regular" },
        ],
      },
    },
  },

  // ── 5. Supplier Reports ───────────────────────────────────────────
  "supplier": {
    id: "supplier-reports",
    slug: "supplier",
    title: "Supplier Reports",
    subtitle: "Supplier analysis and outstanding",
    theme: {
      headerBg: "bg-[#fff1f2] dark:bg-rose-950/25",
      headerBorder: "border-[#ffe4e6] dark:border-rose-900/30",
      iconBg: "bg-[#ffe4e6] dark:bg-rose-900/40 text-[#e11d48] dark:text-rose-400",
      activeTabBg: "bg-[#fff1f2] dark:bg-rose-950/40 text-[#be123c] dark:text-rose-300 border-[#fecdd3] dark:border-rose-800/50",
      activeIconBg: "bg-[#ffe4e6] dark:bg-rose-900/50 text-[#e11d48] dark:text-rose-400",
    },
    icon: Truck,
    items: [
      { id: "supplier-list", slug: "list", title: "Supplier List", subtitle: "All suppliers with details", icon: BarChart2 },
      { id: "supplier-purchase-report", slug: "purchases", title: "Supplier Purchase Report", subtitle: "Supplier wise purchase history", icon: FileText },
      { id: "supplier-outstanding", slug: "outstanding", title: "Outstanding Report", subtitle: "Supplier pending payments", icon: FileText },
      { id: "supplier-credit", slug: "credit", title: "Supplier Credit Report", subtitle: "Credit limit and usage", icon: FileText },
      { id: "supplier-aging", slug: "aging", title: "Supplier Aging Report", subtitle: "Outstanding aging analysis", icon: FileText },
    ],
    tabs: {
      "list": {
        id: "supplier-list",
        slug: "list",
        title: "Supplier List",
        subtitle: "Pharma distributors, stockist ledger balance, drug license numbers, and payment terms.",
        stats: [
          { id: "sp1", title: "Total Vendors", value: "128", trend: "4.2%", trendDirection: "up", trendLabel: "verified distributors", icon: Building2, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
          { id: "sp2", title: "Active Suppliers", value: "64", trend: "2.1%", trendDirection: "up", trendLabel: "ordered this month", icon: Truck, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
          { id: "sp3", title: "Total Payables", value: "₹4,12,800", trend: "6.8%", trendDirection: "down", trendLabel: "vendor balances", icon: CreditCard, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
          { id: "sp4", title: "Avg Credit Period", value: "24 Days", trend: "2 Days", trendDirection: "up", trendLabel: "payment turnaround", icon: Calendar, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
        ],
        chart: { title: "Monthly Supplier Procurement & Payables", metric1Label: "Purchases Made", metric2Label: "Payments Disbursed", metric1Color: "#f43f5e", metric2Color: "#0ea5e9", data: generateDailyTrend(0.78, 0.72) },
        filterPlaceholder: "Search vendor name, GSTIN, DL number, contact...",
        columns: [
          { key: "name", label: "Distributor Name" },
          { key: "contact", label: "Contact Person" },
          { key: "phone", label: "Phone" },
          { key: "gstin", label: "GSTIN" },
          { key: "creditDays", label: "Credit Days", align: "center" },
          { key: "totalPurchased", label: "Total Purchases", align: "right", isCurrency: true },
          { key: "currentBalance", label: "Outstanding Due", align: "right", isCurrency: true, highlight: true },
          { key: "status", label: "Status", align: "center", isStatus: true },
        ],
        rows: [
          { id: "1", name: "MedPlus Distributors", contact: "Sunil Chopra", phone: "+91 98111 22334", gstin: "07AAAAA0000A1Z5", creditDays: 21, totalPurchased: 248500.0, currentBalance: 34200.0, status: "Active" },
          { id: "2", name: "Apex Pharma Agencies", contact: "Rajiv Khurana", phone: "+91 98222 33445", gstin: "07BBBBB1111B2Z6", creditDays: 30, totalPurchased: 184200.0, currentBalance: 28400.0, status: "Active" },
          { id: "3", name: "Shree Ganesh Medicals", contact: "Ganesh Patel", phone: "+91 98333 44556", gstin: "07CCCCC2222C3Z7", creditDays: 15, totalPurchased: 312000.0, currentBalance: 64500.0, status: "Active" },
          { id: "4", name: "Sun Pharma Depot", contact: "Anil Saxena", phone: "+91 98444 55667", gstin: "07DDDDD3333D4Z8", creditDays: 30, totalPurchased: 145000.0, currentBalance: 12000.0, status: "Active" },
          { id: "5", name: "Cipla Distribution Centre", contact: "Vikrant Joshi", phone: "+91 98555 66778", gstin: "07EEEEE4444E5Z9", creditDays: 21, totalPurchased: 268000.0, currentBalance: 45000.0, status: "Active" },
          { id: "6", name: "Abbott Healthcare Depot", contact: "Pankaj Seth", phone: "+91 98666 77889", gstin: "07FFFFF5555F6Z1", creditDays: 30, totalPurchased: 122000.0, currentBalance: 18500.0, status: "Active" },
          { id: "7", name: "Universal Surgicals Co.", contact: "Mohan Lal", phone: "+91 98777 88990", gstin: "07GGGGG6666G7Z2", creditDays: 14, totalPurchased: 89000.0, currentBalance: 9800.0, status: "Active" },
          { id: "8", name: "Zydus Lifesciences", contact: "Hitesh Shah", phone: "+91 98888 99001", gstin: "07HHHHH7777H8Z3", creditDays: 21, totalPurchased: 198000.0, currentBalance: 32000.0, status: "Active" },
          { id: "9", name: "Mankind Speciality Agency", contact: "Alok Tiwari", phone: "+91 98999 00112", gstin: "07IIIII8888I9Z4", creditDays: 15, totalPurchased: 154000.0, currentBalance: 24100.0, status: "Active" },
          { id: "10", name: "Torrent Pharma Logistics", contact: "Sanjay Dave", phone: "+91 98000 11223", gstin: "07JJJJJ9999J0Z5", creditDays: 30, totalPurchased: 210000.0, currentBalance: 38200.0, status: "Active" },
        ],
      },
    },
  },

  // ── 6. Financial Reports ──────────────────────────────────────────
  "financial": {
    id: "financial-reports",
    slug: "financial",
    title: "Financial Reports",
    subtitle: "Profit, loss, tax and accounting reports",
    theme: {
      headerBg: "bg-[#f0fdfa] dark:bg-teal-950/25",
      headerBorder: "border-[#ccfbf1] dark:border-teal-900/30",
      iconBg: "bg-[#ccfbf1] dark:bg-teal-900/40 text-[#0d9488] dark:text-teal-400",
      activeTabBg: "bg-[#f0fdfa] dark:bg-teal-950/40 text-[#0f766e] dark:text-teal-300 border-[#99f6e4] dark:border-teal-800/50",
      activeIconBg: "bg-[#ccfbf1] dark:bg-teal-900/50 text-[#0d9488] dark:text-teal-400",
    },
    icon: Calculator,
    items: [
      { id: "profit-loss", slug: "profit-loss", title: "Profit & Loss Report", subtitle: "Revenue, cost and profit analysis", icon: BarChart2 },
      { id: "day-book", slug: "day-book", title: "Day Book", subtitle: "Daily transaction summary", icon: FileText },
      { id: "cash-flow", slug: "cash-flow", title: "Cash Flow Report", subtitle: "Inflow and outflow analysis", icon: FileText },
      { id: "payment-collection", slug: "payment-collection", title: "Payment Collection Report", subtitle: "Received payments report", icon: FileText },
      { id: "expense-report", slug: "expense", title: "Expense Report", subtitle: "All business expenses", icon: FileText },
    ],
    tabs: {
      "profit-loss": {
        id: "profit-loss",
        slug: "profit-loss",
        title: "Profit & Loss Report",
        subtitle: "Trading statement, gross medicine margins, operating overheads, and net pharmacy profit.",
        stats: [
          { id: "fn1", title: "Operating Revenue", value: "₹12,48,500", trend: "12.5%", trendDirection: "up", trendLabel: "sales turnover", icon: TrendingUp, iconBg: "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400" },
          { id: "fn2", title: "Cost of Goods (COGS)", value: "₹8,32,400", trend: "8.2%", trendDirection: "up", trendLabel: "cost of drugs sold", icon: ShoppingCart, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
          { id: "fn3", title: "Gross Pharmacy Margin", value: "₹4,16,100", trend: "16.8%", trendDirection: "up", trendLabel: "33.3% gross rate", icon: Tag, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
          { id: "fn4", title: "Net Net Margin", value: "₹3,29,800", trend: "14.2%", trendDirection: "up", trendLabel: "26.4% bottomline", icon: Percent, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
        ],
        chart: { title: "Revenue vs Cost of Goods vs Net Margin", metric1Label: "Gross Sales", metric2Label: "Gross Profit", metric1Color: "#0d9488", metric2Color: "#10b981", data: generateDailyTrend(1, 0.42) },
        filterPlaceholder: "Search account head, ledger, voucher...",
        columns: [
          { key: "period", label: "Accounting Period" },
          { key: "revenue", label: "Gross Sales Revenue", align: "right", isCurrency: true },
          { key: "cogs", label: "Cost of Sales (COGS)", align: "right", isCurrency: true },
          { key: "grossProfit", label: "Gross Margin", align: "right", isCurrency: true },
          { key: "operatingExpenses", label: "Operating Expenses", align: "right", isCurrency: true },
          { key: "netProfit", label: "Net Profit (EBITDA)", align: "right", isCurrency: true, highlight: true },
          { key: "marginPct", label: "Net Margin %", align: "center" },
        ],
        rows: [
          { id: "1", period: "Week 4 (25-31 Oct)", revenue: 345000.0, cogs: 228000.0, grossProfit: 117000.0, operatingExpenses: 24000.0, netProfit: 93000.0, marginPct: "27.0%" },
          { id: "2", period: "Week 3 (18-24 Oct)", revenue: 312000.0, cogs: 209000.0, grossProfit: 103000.0, operatingExpenses: 21500.0, netProfit: 81500.0, marginPct: "26.1%" },
          { id: "3", period: "Week 2 (11-17 Oct)", revenue: 298000.0, cogs: 199000.0, grossProfit: 99000.0, operatingExpenses: 22000.0, netProfit: 77000.0, marginPct: "25.8%" },
          { id: "4", period: "Week 1 (01-10 Oct)", revenue: 293500.0, cogs: 196400.0, grossProfit: 97100.0, operatingExpenses: 18800.0, netProfit: 78300.0, marginPct: "26.7%" },
          { id: "5", period: "September 2024", revenue: 1120000.0, cogs: 760000.0, grossProfit: 360000.0, operatingExpenses: 82000.0, netProfit: 278000.0, marginPct: "24.8%" },
          { id: "6", period: "August 2024", revenue: 1085000.0, cogs: 742000.0, grossProfit: 343000.0, operatingExpenses: 79500.0, netProfit: 263500.0, marginPct: "24.3%" },
          { id: "7", period: "July 2024", revenue: 1040000.0, cogs: 710000.0, grossProfit: 330000.0, operatingExpenses: 76000.0, netProfit: 254000.0, marginPct: "24.4%" },
          { id: "8", period: "Q2 FY25", revenue: 3245000.0, cogs: 2212000.0, grossProfit: 1033000.0, operatingExpenses: 237500.0, netProfit: 795500.0, marginPct: "24.5%" },
          { id: "9", period: "Q1 FY25", revenue: 3010000.0, cogs: 2080000.0, grossProfit: 930000.0, operatingExpenses: 224000.0, netProfit: 706000.0, marginPct: "23.5%" },
          { id: "10", period: "H1 FY25 Total", revenue: 6255000.0, cogs: 4292000.0, grossProfit: 1963000.0, operatingExpenses: 461500.0, netProfit: 1501500.0, marginPct: "24.0%" },
        ],
      },
    },
  },

  // ── 7. GST Reports ────────────────────────────────────────────────
  "gst": {
    id: "gst-reports",
    slug: "gst",
    title: "GST Reports",
    subtitle: "GST filing and tax reports",
    theme: {
      headerBg: "bg-[#f5f3ff] dark:bg-indigo-950/25",
      headerBorder: "border-[#ede9fe] dark:border-indigo-900/30",
      iconBg: "bg-[#ede9fe] dark:bg-indigo-900/40 text-[#7c3aed] dark:text-indigo-400",
      activeTabBg: "bg-[#f5f3ff] dark:bg-indigo-950/40 text-[#6d28d9] dark:text-indigo-300 border-[#ddd6fe] dark:border-indigo-800/50",
      activeIconBg: "bg-[#ede9fe] dark:bg-indigo-900/50 text-[#7c3aed] dark:text-indigo-400",
    },
    icon: Receipt,
    badgeText: "GST",
    items: [
      { id: "gst-sales", slug: "sales", title: "GST Sales Report", subtitle: "B2B, B2C, Export sales", icon: FileText },
      { id: "gst-purchase", slug: "purchase", title: "GST Purchase Report", subtitle: "Input tax credit analysis", icon: FileText },
      { id: "gstr-1", slug: "gstr-1", title: "GSTR-1 Report", subtitle: "Outward supplies summary", icon: FileText },
      { id: "gstr-3b", slug: "gstr-3b", title: "GSTR-3B Report", subtitle: "Monthly GST summary", icon: FileText },
      { id: "hsn-summary", slug: "hsn", title: "HSN Summary Report", subtitle: "HSN wise sales and purchase", icon: FileText },
    ],
    tabs: {
      "sales": {
        id: "gst-sales",
        slug: "sales",
        title: "GST Sales Report",
        subtitle: "Outward taxable supplies, CGST + SGST + IGST liability breakdown for monthly GST returns.",
        stats: [
          { id: "g1", title: "Taxable Turnover", value: "₹11,14,732", trend: "12.2%", trendDirection: "up", trendLabel: "assessable value", icon: Receipt, iconBg: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400" },
          { id: "g2", title: "CGST Output", value: "₹66,884", trend: "10.5%", trendDirection: "up", trendLabel: "central tax", icon: Tag, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
          { id: "g3", title: "SGST Output", value: "₹66,884", trend: "10.5%", trendDirection: "up", trendLabel: "state tax", icon: Tag, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
          { id: "g4", title: "Total Tax Liability", value: "₹1,33,768", trend: "11.1%", trendDirection: "up", trendLabel: "total tax generated", icon: Percent, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
        ],
        chart: { title: "Taxable Supplies & Output GST Collected", metric1Label: "Taxable Amount", metric2Label: "GST Tax", metric1Color: "#7c3aed", metric2Color: "#10b981", data: generateDailyTrend(0.9, 0.12) },
        filterPlaceholder: "Search GST invoice, HSN code, tax slab...",
        columns: [
          { key: "invoiceNo", label: "Invoice No." },
          { key: "date", label: "Date" },
          { key: "gstType", label: "Supply Type", align: "center" },
          { key: "taxableValue", label: "Taxable Value", align: "right", isCurrency: true },
          { key: "gstRate", label: "Rate", align: "center" },
          { key: "cgst", label: "CGST (₹)", align: "right", isCurrency: true },
          { key: "sgst", label: "SGST (₹)", align: "right", isCurrency: true },
          { key: "totalTax", label: "Total Tax", align: "right", isCurrency: true },
          { key: "invoiceTotal", label: "Invoice Total", align: "right", isCurrency: true, highlight: true },
        ],
        rows: [
          { id: "1", invoiceNo: "INV-001482", date: "31 Oct 2024", gstType: "B2C Retail", taxableValue: 1066.96, gstRate: "12%", cgst: 64.02, sgst: 64.02, totalTax: 128.04, invoiceTotal: 1195.0 },
          { id: "2", invoiceNo: "INV-001481", date: "31 Oct 2024", gstType: "B2C Retail", taxableValue: 1982.14, gstRate: "12%", cgst: 118.93, sgst: 118.93, totalTax: 237.86, invoiceTotal: 2220.0 },
          { id: "3", invoiceNo: "INV-001480", date: "31 Oct 2024", gstType: "B2C Retail", taxableValue: 875.0, gstRate: "12%", cgst: 52.5, sgst: 52.5, totalTax: 105.0, invoiceTotal: 980.0 },
          { id: "4", invoiceNo: "INV-001479", date: "30 Oct 2024", gstType: "B2C Retail", taxableValue: 1607.14, gstRate: "12%", cgst: 96.43, sgst: 96.43, totalTax: 192.86, invoiceTotal: 1800.0 },
          { id: "5", invoiceNo: "INV-001478", date: "30 Oct 2024", gstType: "B2C Retail", taxableValue: 2875.0, gstRate: "12%", cgst: 172.5, sgst: 172.5, totalTax: 345.0, invoiceTotal: 3220.0 },
          { id: "6", invoiceNo: "INV-001477", date: "29 Oct 2024", gstType: "B2C Retail", taxableValue: 580.36, gstRate: "12%", cgst: 34.82, sgst: 34.82, totalTax: 69.64, invoiceTotal: 650.0 },
          { id: "7", invoiceNo: "INV-001476", date: "29 Oct 2024", gstType: "B2C Retail", taxableValue: 1678.57, gstRate: "12%", cgst: 100.71, sgst: 100.71, totalTax: 201.43, invoiceTotal: 1880.0 },
          { id: "8", invoiceNo: "INV-001475", date: "28 Oct 2024", gstType: "B2C Retail", taxableValue: 794.64, gstRate: "12%", cgst: 47.68, sgst: 47.68, totalTax: 95.36, invoiceTotal: 890.0 },
          { id: "9", invoiceNo: "INV-001474", date: "28 Oct 2024", gstType: "B2C Retail", taxableValue: 3455.36, gstRate: "12%", cgst: 207.32, sgst: 207.32, totalTax: 414.64, invoiceTotal: 3870.0 },
          { id: "10", invoiceNo: "INV-001473", date: "27 Oct 2024", gstType: "B2C Retail", taxableValue: 1339.29, gstRate: "12%", cgst: 80.36, sgst: 80.36, totalTax: 160.71, invoiceTotal: 1500.0 },
        ],
      },
    },
  },

  // ── 8. Product Reports ────────────────────────────────────────────
  "product": {
    id: "product-reports",
    slug: "product",
    title: "Product Reports",
    subtitle: "Product analysis and performance",
    theme: {
      headerBg: "bg-[#fff1f2] dark:bg-rose-950/25",
      headerBorder: "border-[#ffe4e6] dark:border-rose-900/30",
      iconBg: "bg-[#ffe4e6] dark:bg-rose-900/40 text-[#f43f5e] dark:text-rose-400",
      activeTabBg: "bg-[#fff1f2] dark:bg-rose-950/40 text-[#e11d48] dark:text-rose-300 border-[#fecdd3] dark:border-rose-800/50",
      activeIconBg: "bg-[#ffe4e6] dark:bg-rose-900/50 text-[#f43f5e] dark:text-rose-400",
    },
    icon: Tag,
    items: [
      { id: "product-list", slug: "list", title: "Product List", subtitle: "All products with details", icon: FileText },
      { id: "product-movement", slug: "movement", title: "Product Movement Report", subtitle: "Stock in/out movement", icon: FileText },
      { id: "fast-moving", slug: "fast-moving", title: "Fast Moving Products", subtitle: "Top selling products", icon: FileText },
      { id: "slow-moving", slug: "slow-moving", title: "Slow Moving Products", subtitle: "Low performing products", icon: FileText },
      { id: "non-moving", slug: "non-moving", title: "Non Moving Products", subtitle: "No sales for selected period", icon: FileText },
    ],
    tabs: {
      "list": {
        id: "product-list",
        slug: "list",
        title: "Product List",
        subtitle: "Pharmacy inventory catalog, Schedule H drug flags, salt formulations, and pack sizes.",
        stats: [
          { id: "pr1", title: "Master Catalog SKUs", value: "2,840", trend: "38 added", trendDirection: "up", trendLabel: "in database", icon: Boxes, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
          { id: "pr2", title: "Schedule H / H1", value: "412", trend: "Prescription", trendDirection: "up", trendLabel: "mandatory Rx", icon: ShieldCheck, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
          { id: "pr3", title: "Generic Medicines", value: "680", trend: "24.0%", trendDirection: "up", trendLabel: "cost-effective salts", icon: Tag, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
          { id: "pr4", title: "Discontinued SKUs", value: "18", trend: "Phased out", trendDirection: "down", trendLabel: "delisted by pharma", icon: AlertTriangle, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
        ],
        chart: { title: "Catalog Volume by Therapy Category", metric1Label: "Total SKUs", metric2Label: "Active Stock", metric1Color: "#f43f5e", metric2Color: "#0ea5e9", data: generateDailyTrend(0.7, 0.6) },
        filterPlaceholder: "Search brand name, active salt, therapeutic class...",
        columns: [
          { key: "brand", label: "Brand / Medicine Name" },
          { key: "salt", label: "Active Salt Composition" },
          { key: "manufacturer", label: "Manufacturer" },
          { key: "schedule", label: "Schedule", align: "center" },
          { key: "hsn", label: "HSN Code", align: "center" },
          { key: "mrp", label: "MRP", align: "right", isCurrency: true },
          { key: "stock", label: "Stock Units", align: "center" },
          { key: "status", label: "Status", align: "center", isStatus: true },
        ],
        rows: [
          { id: "1", brand: "Augmentin 625 Duo", salt: "Amoxicillin (500mg) + Clavulanic Acid (125mg)", manufacturer: "GSK Pharmaceuticals", schedule: "Schedule H", hsn: "300410", mrp: 204.5, stock: 240, status: "Active" },
          { id: "2", brand: "Pan D Capsule", salt: "Pantoprazole (40mg) + Domperidone (30mg)", manufacturer: "Alkem Laboratories", schedule: "Schedule H", hsn: "300490", mrp: 198.0, stock: 180, status: "Active" },
          { id: "3", brand: "Telma 40mg Tablet", salt: "Telmisartan (40mg)", manufacturer: "Glenmark Pharma", schedule: "Schedule H", hsn: "300490", mrp: 245.0, stock: 310, status: "Active" },
          { id: "4", brand: "Dolo 650mg Tablet", salt: "Paracetamol (650mg)", manufacturer: "Micro Labs", schedule: "OTC", hsn: "300490", mrp: 32.0, stock: 850, status: "Active" },
          { id: "5", brand: "Glycomet GP2 Forte", salt: "Glimepiride (2mg) + Metformin (1000mg)", manufacturer: "USV Pharma", schedule: "Schedule H", hsn: "300490", mrp: 285.0, stock: 145, status: "Active" },
          { id: "6", brand: "Shelcal 500 Calcium", salt: "Calcium Carbonate (1250mg) + Vitamin D3", manufacturer: "Torrent Pharma", schedule: "OTC", hsn: "300450", mrp: 135.0, stock: 290, status: "Active" },
          { id: "7", brand: "Rosuvas 10mg Strip", salt: "Rosuvastatin (10mg)", manufacturer: "Sun Pharma", schedule: "Schedule H", hsn: "300490", mrp: 380.0, stock: 85, status: "Active" },
          { id: "8", brand: "Allegra 120mg Tablet", salt: "Fexofenadine (120mg)", manufacturer: "Sanofi India", schedule: "Schedule H", hsn: "300490", mrp: 215.0, stock: 160, status: "Active" },
          { id: "9", brand: "Thyronorm 50mcg", salt: "Thyroxine Sodium (50mcg)", manufacturer: "Abbott India", schedule: "Schedule H", hsn: "300439", mrp: 175.0, stock: 60, status: "Active" },
          { id: "10", brand: "Montair LC Kid Syrup", salt: "Levocetirizine (2.5mg) + Montelukast (4mg)", manufacturer: "Cipla Health", schedule: "Schedule H", hsn: "300490", mrp: 162.0, stock: 115, status: "Active" },
        ],
      },
    },
  },

  // ── 9. Custom Reports ─────────────────────────────────────────────
  "custom": {
    id: "custom-reports",
    slug: "custom",
    title: "Custom Reports",
    subtitle: "Create and manage custom reports",
    theme: {
      headerBg: "bg-[#fffbeb] dark:bg-amber-950/25",
      headerBorder: "border-[#fef3c7] dark:border-amber-900/30",
      iconBg: "bg-[#fef3c7] dark:bg-amber-900/40 text-[#d97706] dark:text-amber-400",
      activeTabBg: "bg-[#fffbeb] dark:bg-amber-950/40 text-[#b45309] dark:text-amber-300 border-[#fde68a] dark:border-amber-800/50",
      activeIconBg: "bg-[#fef3c7] dark:bg-amber-900/50 text-[#d97706] dark:text-amber-400",
    },
    icon: Sliders,
    items: [
      { id: "create-custom-report", slug: "create", title: "Create Custom Report", subtitle: "Build your own report", icon: FilePlus },
      { id: "saved-custom-reports", slug: "saved", title: "Saved Custom Reports", subtitle: "View and run saved reports", icon: FileText },
      { id: "scheduled-reports", slug: "scheduled", title: "Scheduled Reports", subtitle: "Automate report delivery", icon: Clock },
      { id: "export-data", slug: "export", title: "Export Data", subtitle: "Export reports in Excel/PDF", icon: Download },
      { id: "report-templates", slug: "templates", title: "Report Templates", subtitle: "Pre-built report templates", icon: FileText },
    ],
    tabs: {
      "saved": {
        id: "saved-custom-reports",
        slug: "saved",
        title: "Saved Custom Reports",
        subtitle: "Saved custom queries, automated email schedules, and custom analytical data views.",
        stats: [
          { id: "cr1", title: "Saved Reports", value: "18", trend: "4 active crons", trendDirection: "up", trendLabel: "custom workflows", icon: Sliders, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
          { id: "cr2", title: "Scheduled Auto Runs", value: "6 Daily", trend: "08:00 PM", trendDirection: "up", trendLabel: "night audit", icon: Clock, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
          { id: "cr3", title: "Exports This Month", value: "84", trend: "Excel & PDF", trendDirection: "up", trendLabel: "exported files", icon: Download, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
          { id: "cr4", title: "Custom Dashboards", value: "3", trend: "Director View", trendDirection: "up", trendLabel: "executive views", icon: Database, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
        ],
        chart: { title: "Automated Report Executions & Downloads", metric1Label: "Auto Runs", metric2Label: "Downloads", metric1Color: "#f59e0b", metric2Color: "#0284c7", data: generateDailyTrend(0.5, 0.4) },
        filterPlaceholder: "Search saved report name, creator, schedule...",
        columns: [
          { key: "reportName", label: "Report Name" },
          { key: "category", label: "Domain" },
          { key: "frequency", label: "Schedule", align: "center" },
          { key: "recipients", label: "Notification Channels" },
          { key: "lastRun", label: "Last Generated" },
          { key: "fileFormat", label: "Format", align: "center" },
          { key: "status", label: "Status", align: "center", isStatus: true },
        ],
        rows: [
          { id: "1", reportName: "Daily Evening Cashier Reconciliation", category: "Finance", frequency: "Daily at 10 PM", recipients: "Owner WhatsApp, Email", lastRun: "31 Oct 2024 22:00", fileFormat: "PDF", status: "Active" },
          { id: "2", reportName: "Near Expiry <60 Days Alert", category: "Inventory", frequency: "Every Monday 9 AM", recipients: "Store Manager Email", lastRun: "28 Oct 2024 09:00", fileFormat: "Excel", status: "Active" },
          { id: "3", reportName: "Doctor Prescription Volume Share", category: "Sales", frequency: "1st of Every Month", recipients: "Director Email", lastRun: "01 Oct 2024 00:00", fileFormat: "PDF", status: "Active" },
          { id: "4", reportName: "Schedule H1 Register Export", category: "Compliance", frequency: "On Demand", recipients: "Drug Inspector Portal", lastRun: "25 Oct 2024 15:30", fileFormat: "Excel", status: "Active" },
          { id: "5", reportName: "High Margin Skincare & Wellness", category: "Sales", frequency: "Weekly", recipients: "POS Counter 1", lastRun: "29 Oct 2024 08:00", fileFormat: "CSV", status: "Active" },
          { id: "6", reportName: "Supplier Outstanding & Debit Notes", category: "Suppliers", frequency: "Bi-Weekly", recipients: "Accounts Email", lastRun: "26 Oct 2024 11:00", fileFormat: "Excel", status: "Active" },
          { id: "7", reportName: "Slow Moving Dead Stock Dump", category: "Inventory", frequency: "Monthly", recipients: "Pharmacist WhatsApp", lastRun: "15 Oct 2024 10:00", fileFormat: "Excel", status: "Active" },
          { id: "8", reportName: "GSTR-1 Monthly JSON Pre-Check", category: "GST", frequency: "10th of Month", recipients: "CA Email", lastRun: "10 Oct 2024 17:00", fileFormat: "JSON", status: "Active" },
          { id: "9", reportName: "VIP Patient Udhar Recovery List", category: "Customers", frequency: "Every Friday", recipients: "Counter Staff", lastRun: "25 Oct 2024 18:00", fileFormat: "PDF", status: "Active" },
          { id: "10", reportName: "Narcotic Stock Discrepancy Log", category: "Compliance", frequency: "Daily", recipients: "Chief Pharmacist", lastRun: "31 Oct 2024 21:00", fileFormat: "PDF", status: "Active" },
        ],
      },
    },
  },
};


/**
 * ── Sub-Report Custom Datasets ──────────────────────────────────────────────
 * Provides distinct configurations, stats, charts, columns, and rows for all
 * 45 sub-reports across all 9 categories.
 */
const SUB_REPORTS_CATALOG = {
  // ── 3. Inventory Sub-Reports

  // ── 3. Inventory Sub-Reports
  "inventory:stock-movement": {
    stats: [
      { id: "im1", title: "Inward Stock Qty", value: "4,200", trend: "18.4%", trendDirection: "up", trendLabel: "units received", icon: Package, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
      { id: "im2", title: "Dispensed Outward", value: "3,850", trend: "14.2%", trendDirection: "up", trendLabel: "sales fulfillment", icon: ShoppingCart, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "im3", title: "Net Stock Delta", value: "+350", trend: "Stable", trendDirection: "up", trendLabel: "monthly buffer", icon: Boxes, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "im4", title: "Turnover Velocity", value: "4.2x", trend: "High", trendDirection: "up", trendLabel: "annualized turns", icon: TrendingUp, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
    ],
    chart: { title: "Daily Physical Inward vs Outward Dispensed", metric1Label: "Inward Qty", metric2Label: "Outward Qty", metric1Color: "#a855f7", metric2Color: "#10b981", data: generateDailyTrend(0.85, 0.8) },
    filterPlaceholder: "Search medicine, movement type, batch, invoice reference...",
    columns: [
      { key: "date", label: "Date" },
      { key: "item", label: "Medicine Name" },
      { key: "batch", label: "Batch" },
      { key: "movementType", label: "Type", align: "center" },
      { key: "refNo", label: "Doc Reference" },
      { key: "inQty", label: "Inward", align: "center" },
      { key: "outQty", label: "Outward", align: "center" },
      { key: "balanceQty", label: "Closing Stock", align: "center", highlight: true },
      { key: "user", label: "Authorized By" },
    ],
    rows: [
      { id: "1", date: "31 Oct 2024", item: "Augmentin 625 Duo Tablet", batch: "AG-6251", movementType: "Sale Outward", refNo: "INV-001482", inQty: 0, outQty: 2, balanceQty: 240, user: "Devansh" },
      { id: "2", date: "31 Oct 2024", item: "Pan D Capsule (15s)", batch: "PND-992", movementType: "Sale Outward", refNo: "INV-001482", inQty: 0, outQty: 1, balanceQty: 180, user: "Devansh" },
      { id: "3", date: "30 Oct 2024", item: "Telma 40mg Tablet", batch: "TLM-441", movementType: "PO Inward", refNo: "PUR-88392", inQty: 150, outQty: 0, balanceQty: 310, user: "Suresh" },
      { id: "4", date: "30 Oct 2024", item: "Dolo 650mg Paracetamol", batch: "DOL-112", movementType: "Sale Outward", refNo: "INV-001479", inQty: 0, outQty: 4, balanceQty: 850, user: "Devansh" },
      { id: "5", date: "29 Oct 2024", item: "Shelcal 500 Calcium Strip", batch: "SHL-701", movementType: "Sale Outward", refNo: "INV-001476", inQty: 0, outQty: 3, balanceQty: 290, user: "Suresh" },
    ],
  },
  "inventory:stock-valuation": {
    stats: [
      { id: "iv1", title: "Cost Valuation", value: "₹18,75,300", trend: "5.1%", trendDirection: "up", trendLabel: "inventory at cost", icon: Package, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
      { id: "iv2", title: "Retail MRP Value", value: "₹24,18,000", trend: "4.8%", trendDirection: "up", trendLabel: "potential realization", icon: Tag, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "iv3", title: "Unrealized Margin", value: "₹5,42,700", trend: "28.9%", trendDirection: "up", trendLabel: "gross profit locked", icon: Percent, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "iv4", title: "Total Distinct SKUs", value: "1,240", trend: "18 categories", trendDirection: "up", trendLabel: "active product codes", icon: Boxes, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
    ],
    chart: { title: "Stock Valuation by Therapeutic Category", metric1Label: "Cost Value", metric2Label: "MRP Value", metric1Color: "#a855f7", metric2Color: "#059669", data: generateDailyTrend(0.9, 0.72) },
    filterPlaceholder: "Search therapeutic category, brand, composition...",
    columns: [
      { key: "category", label: "Therapeutic Category" },
      { key: "totalSkus", label: "Total SKUs", align: "center" },
      { key: "stockQty", label: "Units in Stock", align: "center" },
      { key: "costValue", label: "Valuation at Cost", align: "right", isCurrency: true },
      { key: "mrpValue", label: "Valuation at MRP", align: "right", isCurrency: true },
      { key: "marginAmount", label: "Unrealized Profit", align: "right", isCurrency: true, highlight: true },
      { key: "marginPct", label: "Margin %", align: "center" },
    ],
    rows: [
      { id: "1", category: "Antibiotics & Anti-infectives", totalSkus: 142, stockQty: 4800, costValue: 384000.0, mrpValue: 498000.0, marginAmount: 114000.0, marginPct: "22.9%" },
      { id: "2", category: "Cardiovascular & Hypertension", totalSkus: 185, stockQty: 6200, costValue: 465000.0, mrpValue: 604000.0, marginAmount: 139000.0, marginPct: "23.0%" },
      { id: "3", category: "Gastrointestinal & Antacids", totalSkus: 110, stockQty: 5400, costValue: 270000.0, mrpValue: 351000.0, marginAmount: 81000.0, marginPct: "23.1%" },
      { id: "4", category: "Anti-diabetic Formulations", totalSkus: 125, stockQty: 4900, costValue: 342000.0, mrpValue: 444000.0, marginAmount: 102000.0, marginPct: "23.0%" },
      { id: "5", category: "Analgesics & Pain Management", totalSkus: 95, stockQty: 8800, costValue: 176000.0, mrpValue: 237000.0, marginAmount: 61000.0, marginPct: "25.7%" },
    ],
  },
  "inventory:expiry": {
    stats: [
      { id: "ie1", title: "Expired Stock", value: "0 Units", trend: "Clean", trendDirection: "up", trendLabel: "zero on shelf", icon: ShieldCheck, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "ie2", title: "Critical (<30 Days)", value: "8 SKUs", trend: "Immediate", trendDirection: "down", trendLabel: "return to supplier", icon: AlertTriangle, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
      { id: "ie3", title: "Warning (30-60 Days)", value: "19 SKUs", trend: "₹18,400", trendDirection: "down", trendLabel: "dispense first", icon: Clock, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "ie4", title: "Watchlist (60-90 Days)", value: "34 SKUs", trend: "₹42,000", trendDirection: "up", trendLabel: "monitored shelf", icon: RotateCcw, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
    ],
    chart: { title: "Upcoming Expiry Risk Distribution by Month", metric1Label: "Expiring Stock Value", metric2Label: "Units Affected", metric1Color: "#f43f5e", metric2Color: "#f59e0b", data: generateDailyTrend(0.4, 0.35) },
    filterPlaceholder: "Search medicine name, batch no, shelf rack, days remaining...",
    columns: [
      { key: "name", label: "Medicine / Product" },
      { key: "batch", label: "Batch No." },
      { key: "expiryDate", label: "Expiry Date" },
      { key: "daysRemaining", label: "Days Left", align: "center" },
      { key: "rack", label: "Shelf Location" },
      { key: "stockQty", label: "Qty on Hand", align: "center" },
      { key: "riskValue", label: "Value at Risk", align: "right", isCurrency: true, highlight: true },
      { key: "status", label: "Alert Tier", align: "center", isStatus: true },
    ],
    rows: [
      { id: "1", name: "Amoxyclav 375mg Tablet", batch: "AMX-109", expiryDate: "15 Nov 2024", daysRemaining: "15 Days", rack: "R-02 / B3", stockQty: 45, riskValue: 4950.0, status: "Critical" },
      { id: "2", name: "Cetrizine 10mg Strip", batch: "CTZ-882", expiryDate: "28 Nov 2024", daysRemaining: "28 Days", rack: "R-01 / A4", stockQty: 120, riskValue: 2400.0, status: "Critical" },
      { id: "3", name: "Cough Syrup 100ml", batch: "CS-4410", expiryDate: "10 Dec 2024", daysRemaining: "40 Days", rack: "R-05 / E2", stockQty: 30, riskValue: 3300.0, status: "Warning" },
      { id: "4", name: "Ranitidine 150mg Tab", batch: "RNT-319", expiryDate: "20 Dec 2024", daysRemaining: "50 Days", rack: "R-03 / C2", stockQty: 90, riskValue: 1800.0, status: "Warning" },
      { id: "5", name: "Azithromycin 250mg", batch: "AZT-904", expiryDate: "15 Jan 2025", daysRemaining: "75 Days", rack: "R-02 / B1", stockQty: 55, riskValue: 5500.0, status: "Watchlist" },
    ],
  },
  "inventory:low-stock": {
    stats: [
      { id: "il1", title: "Below Reorder Level", value: "36 SKUs", trend: "Reorder", trendDirection: "down", trendLabel: "trigger PO", icon: AlertTriangle, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
      { id: "il2", title: "Out of Stock (Zero)", value: "14 SKUs", trend: "Urgent", trendDirection: "down", trendLabel: "lost sales risk", icon: Boxes, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "il3", title: "Recommended PO Value", value: "₹1,42,000", trend: "Estimated", trendDirection: "up", trendLabel: "restock cost", icon: ShoppingCart, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "il4", title: "Fast-Moving Out Risk", value: "8 SKUs", trend: "High Priority", trendDirection: "down", trendLabel: "daily runners", icon: TrendingUp, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
    ],
    chart: { title: "Stock Shortage Distribution Across Racks", metric1Label: "Current Units", metric2Label: "Min Required", metric1Color: "#f43f5e", metric2Color: "#0284c7", data: generateDailyTrend(0.3, 0.6) },
    filterPlaceholder: "Search low stock product, composition, rack location...",
    columns: [
      { key: "name", label: "Medicine Name" },
      { key: "rack", label: "Rack / Shelf" },
      { key: "currentStock", label: "Current Stock", align: "center" },
      { key: "reorderLevel", label: "Min Reorder Level", align: "center" },
      { key: "maxLevel", label: "Max Capacity", align: "center" },
      { key: "dailyConsumption", label: "Daily Run Rate", align: "center" },
      { key: "suggestedQty", label: "Suggested PO Qty", align: "center", highlight: true },
      { key: "status", label: "Stock Status", align: "center", isStatus: true },
    ],
    rows: [
      { id: "1", name: "Thyronorm 50mcg (100s)", rack: "R-05 / E1", currentStock: 6, reorderLevel: 25, maxLevel: 100, dailyConsumption: 4, suggestedQty: 80, status: "Critical" },
      { id: "2", name: "Rosuvas 10mg Strip", rack: "R-03 / C3", currentStock: 12, reorderLevel: 30, maxLevel: 120, dailyConsumption: 5, suggestedQty: 90, status: "Low Stock" },
      { id: "3", name: "Glycomet 500mg SR", rack: "R-04 / D1", currentStock: 0, reorderLevel: 40, maxLevel: 200, dailyConsumption: 8, suggestedQty: 160, status: "Out of Stock" },
      { id: "4", name: "Pantocid 40mg Strip", rack: "R-01 / A3", currentStock: 15, reorderLevel: 50, maxLevel: 150, dailyConsumption: 6, suggestedQty: 100, status: "Low Stock" },
      { id: "5", name: "Liv 52 DS Syrup", rack: "R-06 / F1", currentStock: 4, reorderLevel: 20, maxLevel: 60, dailyConsumption: 3, suggestedQty: 40, status: "Critical" },
    ],
  },

  // ── 4. Customer Sub-Reports
  "customer:purchases": {
    stats: [
      { id: "cp1", title: "Repeat Purchases", value: "68.4%", trend: "14.2%", trendDirection: "up", trendLabel: "loyalty refill rate", icon: UserCheck, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "cp2", title: "Avg Basket Size", value: "₹890", trend: "3.2 items", trendDirection: "up", trendLabel: "per visit", icon: ShoppingCart, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "cp3", title: "Top Patient Spend", value: "₹68,450", trend: "VIP Gold", trendDirection: "up", trendLabel: "annual spend", icon: Tag, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "cp4", title: "Active Prescriptions", value: "482", trend: "28 Doctors", trendDirection: "up", trendLabel: "doctor linked", icon: FileText, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
    ],
    chart: { title: "Customer Inward Visits vs Billed Volume", metric1Label: "Billed Amount", metric2Label: "Cash Collected", metric1Color: "#ea580c", metric2Color: "#10b981", data: generateDailyTrend(0.8, 0.75) },
    filterPlaceholder: "Search patient name, mobile, prescription doctor...",
    columns: [
      { key: "date", label: "Date" },
      { key: "invoiceNo", label: "Invoice No." },
      { key: "customer", label: "Patient Name" },
      { key: "phone", label: "Phone" },
      { key: "items", label: "Items", align: "center" },
      { key: "billAmount", label: "Bill Total", align: "right", isCurrency: true, highlight: true },
      { key: "paymentMode", label: "Payment", align: "center" },
      { key: "doctor", label: "Doctor" },
    ],
    rows: [
      { id: "1", date: "31 Oct 2024", invoiceNo: "INV-001481", customer: "Rakesh Sharma", phone: "+91 98765 43210", items: 5, billAmount: 2220.0, paymentMode: "UPI", doctor: "Dr. Arvind Mehta" },
      { id: "2", date: "31 Oct 2024", invoiceNo: "INV-001480", customer: "Neha Patel", phone: "+91 98234 11223", items: 2, billAmount: 980.0, paymentMode: "Card", doctor: "Dr. K. S. Sethi" },
      { id: "3", date: "30 Oct 2024", invoiceNo: "INV-001478", customer: "Amit Verma", phone: "+91 99100 88776", items: 6, billAmount: 3220.0, paymentMode: "UPI", doctor: "Dr. Arvind Mehta" },
      { id: "4", date: "29 Oct 2024", invoiceNo: "INV-001476", customer: "Sunita Jain", phone: "+91 94123 55667", items: 3, billAmount: 1880.0, paymentMode: "UPI", doctor: "Dr. R. Gupta" },
      { id: "5", date: "28 Oct 2024", invoiceNo: "INV-001474", customer: "Vikram Singh", phone: "+91 98989 33445", items: 7, billAmount: 3870.0, paymentMode: "Card", doctor: "Dr. P. K. Rao" },
    ],
  },
  "customer:outstanding": {
    stats: [
      { id: "co1", title: "Total Udhar Outstanding", value: "₹84,200", trend: "1.2%", trendDirection: "down", trendLabel: "total credit balance", icon: CreditCard, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
      { id: "co2", title: "Owing Patients", value: "48", trend: "84 Accounts", trendDirection: "down", trendLabel: "active balance dues", icon: Users, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "co3", title: "Overdue >30 Days", value: "₹18,400", trend: "6 patients", trendDirection: "down", trendLabel: "followup needed", icon: AlertTriangle, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
      { id: "co4", title: "Monthly Recovery", value: "₹62,800", trend: "92.4%", trendDirection: "up", trendLabel: "settlement rate", icon: CheckCircle2, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
    ],
    chart: { title: "Customer Credit Issued vs Collected", metric1Label: "Credit Given", metric2Label: "Cash Recovered", metric1Color: "#ea580c", metric2Color: "#10b981", data: generateDailyTrend(0.5, 0.45) },
    filterPlaceholder: "Search patient name, phone, outstanding amount...",
    columns: [
      { key: "customer", label: "Patient / Customer" },
      { key: "phone", label: "Mobile" },
      { key: "creditLimit", label: "Assigned Limit", align: "right", isCurrency: true },
      { key: "totalDue", label: "Current Due", align: "right", isCurrency: true, highlight: true },
      { key: "overdueDays", label: "Overdue Days", align: "center" },
      { key: "lastPaymentDate", label: "Last Settled" },
      { key: "status", label: "Account Status", align: "center", isStatus: true },
    ],
    rows: [
      { id: "1", customer: "Vikram Singh", phone: "+91 98989 33445", creditLimit: 10000.0, totalDue: 2500.0, overdueDays: "18 Days", lastPaymentDate: "10 Oct 2024", status: "Active Due" },
      { id: "2", customer: "Amit Verma", phone: "+91 99100 88776", creditLimit: 5000.0, totalDue: 1200.0, overdueDays: "5 Days", lastPaymentDate: "25 Oct 2024", status: "Active Due" },
      { id: "3", customer: "Manoj Deshmukh", phone: "+91 98450 66778", creditLimit: 5000.0, totalDue: 850.0, overdueDays: "12 Days", lastPaymentDate: "18 Oct 2024", status: "Active Due" },
      { id: "4", customer: "Deepak Choudhary", phone: "+91 94321 00987", creditLimit: 3000.0, totalDue: 600.0, overdueDays: "8 Days", lastPaymentDate: "22 Oct 2024", status: "Active Due" },
      { id: "5", customer: "Neha Patel", phone: "+91 98234 11223", creditLimit: 5000.0, totalDue: 450.0, overdueDays: "2 Days", lastPaymentDate: "29 Oct 2024", status: "Active Due" },
    ],
  },
  "customer:credit": {
    stats: [
      { id: "cc1", title: "Credit Accounts", value: "84", trend: "Assigned", trendDirection: "up", trendLabel: "pre-approved limits", icon: CreditCard, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "cc2", title: "Total Assigned Pool", value: "₹3,50,000", trend: "Disbursed", trendDirection: "up", trendLabel: "maximum credit limit", icon: Tag, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "cc3", title: "Pool Utilized", value: "24.1%", trend: "Safe", trendDirection: "up", trendLabel: "healthy buffer", icon: Percent, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "cc4", title: "Zero Default Rate", value: "99.2%", trend: "Top Tier", trendDirection: "up", trendLabel: "chronic patients", icon: ShieldCheck, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
    ],
    chart: { title: "Credit Utilization by Patient Tier", metric1Label: "Limit Assigned", metric2Label: "Balance Utilized", metric1Color: "#ea580c", metric2Color: "#0284c7", data: generateDailyTrend(0.6, 0.25) },
    filterPlaceholder: "Search patient, credit limit, tier...",
    columns: [
      { key: "customer", label: "Patient Name" },
      { key: "tier", label: "Tier", align: "center" },
      { key: "creditLimit", label: "Credit Limit", align: "right", isCurrency: true },
      { key: "usedCredit", label: "Utilized", align: "right", isCurrency: true },
      { key: "availableCredit", label: "Available Buffer", align: "right", isCurrency: true, highlight: true },
      { key: "utilizationPct", label: "Utilized %", align: "center" },
      { key: "status", label: "Credit Status", align: "center", isStatus: true },
    ],
    rows: [
      { id: "1", customer: "Dr. Arvind Mehta Clinic", tier: "Platinum", creditLimit: 50000.0, usedCredit: 0.0, availableCredit: 50000.0, utilizationPct: "0.0%", status: "Healthy" },
      { id: "2", customer: "Rakesh Sharma", tier: "VIP Gold", creditLimit: 25000.0, usedCredit: 0.0, availableCredit: 25000.0, utilizationPct: "0.0%", status: "Healthy" },
      { id: "3", customer: "Vikram Singh", tier: "Regular", creditLimit: 10000.0, usedCredit: 2500.0, availableCredit: 7500.0, utilizationPct: "25.0%", status: "Active" },
      { id: "4", customer: "Amit Verma", tier: "Gold", creditLimit: 10000.0, usedCredit: 1200.0, availableCredit: 8800.0, utilizationPct: "12.0%", status: "Active" },
      { id: "5", customer: "Sunita Jain", tier: "Silver", creditLimit: 5000.0, usedCredit: 0.0, availableCredit: 5000.0, utilizationPct: "0.0%", status: "Healthy" },
    ],
  },
  "customer:aging": {
    stats: [
      { id: "ca1", title: "Current (0-15 Days)", value: "₹45,200", trend: "53.6%", trendDirection: "up", trendLabel: "within cycle", icon: CheckCircle2, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "ca2", title: "16-30 Days Due", value: "₹20,600", trend: "24.5%", trendDirection: "up", trendLabel: "grace period", icon: Clock, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "ca3", title: "31-60 Days Overdue", value: "₹12,400", trend: "14.7%", trendDirection: "down", trendLabel: "reminder sent", icon: AlertTriangle, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "ca4", title: "60+ Days Critical", value: "₹6,000", trend: "7.1%", trendDirection: "down", trendLabel: "escalated", icon: RotateCcw, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
    ],
    chart: { title: "Aging Buckets Distribution of Patient Dues", metric1Label: "Total Dues", metric2Label: "Recoverable", metric1Color: "#ea580c", metric2Color: "#10b981", data: generateDailyTrend(0.5, 0.4) },
    filterPlaceholder: "Search patient aging bucket, name, phone...",
    columns: [
      { key: "customer", label: "Patient Name" },
      { key: "totalDue", label: "Total Outstanding", align: "right", isCurrency: true, highlight: true },
      { key: "current", label: "0-15 Days", align: "right", isCurrency: true },
      { key: "days16to30", label: "16-30 Days", align: "right", isCurrency: true },
      { key: "days31to60", label: "31-60 Days", align: "right", isCurrency: true },
      { key: "daysOver60", label: "60+ Days", align: "right", isCurrency: true },
      { key: "action", label: "Followup Stage", align: "center" },
    ],
    rows: [
      { id: "1", customer: "Vikram Singh", totalDue: 2500.0, current: 0.0, days16to30: 2500.0, days31to60: 0.0, daysOver60: 0.0, action: "Gentle Reminder" },
      { id: "2", customer: "Amit Verma", totalDue: 1200.0, current: 1200.0, days16to30: 0.0, days31to60: 0.0, daysOver60: 0.0, action: "Current Cycle" },
      { id: "3", customer: "Manoj Deshmukh", totalDue: 850.0, current: 850.0, days16to30: 0.0, days31to60: 0.0, daysOver60: 0.0, action: "Current Cycle" },
      { id: "4", customer: "Harish Bhatia", totalDue: 3400.0, current: 0.0, days16to30: 0.0, days31to60: 3400.0, daysOver60: 0.0, action: "Phone Call" },
      { id: "5", customer: "Sanjay Singhania", totalDue: 2600.0, current: 0.0, days16to30: 0.0, days31to60: 0.0, daysOver60: 2600.0, action: "Personal Visit" },
    ],
  },

  // ── 5. Supplier Sub-Reports
  "supplier:purchases": {
    stats: [
      { id: "sp1", title: "Total Purchases", value: "₹8,32,400", trend: "8.2%", trendDirection: "up", trendLabel: "vendor purchases", icon: Truck, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
      { id: "sp2", title: "Vendor Invoices", value: "412", trend: "64 vendors", trendDirection: "up", trendLabel: "received & logged", icon: FileText, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "sp3", title: "GST Input Booked", value: "₹99,880", trend: "12% avg", trendDirection: "up", trendLabel: "eligible ITC", icon: Tag, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "sp4", title: "Total Paid", value: "₹6,17,900", trend: "74.2%", trendDirection: "up", trendLabel: "cleared to date", icon: CreditCard, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
    ],
    chart: { title: "Supplier Purchases vs Payments Settled", metric1Label: "Purchased", metric2Label: "Payments", metric1Color: "#e11d48", metric2Color: "#0284c7", data: generateDailyTrend(0.75, 0.65) },
    filterPlaceholder: "Search distributor, bill number, GSTIN...",
    columns: [
      { key: "supplier", label: "Distributor Name" },
      { key: "billsCount", label: "Bills Count", align: "center" },
      { key: "totalPurchased", label: "Total Billed", align: "right", isCurrency: true },
      { key: "taxInput", label: "GST Input", align: "right", isCurrency: true },
      { key: "paidAmount", label: "Paid Amount", align: "right", isCurrency: true },
      { key: "netDue", label: "Outstanding Due", align: "right", isCurrency: true, highlight: true },
      { key: "terms", label: "Credit Days", align: "center" },
    ],
    rows: [
      { id: "1", supplier: "MedPlus Distributors", billsCount: 18, totalPurchased: 284500.0, taxInput: 34140.0, paidAmount: 242000.0, netDue: 42500.0, terms: "30 Days" },
      { id: "2", supplier: "Apex Pharma Agencies", billsCount: 14, totalPurchased: 198200.0, taxInput: 23784.0, paidAmount: 185000.0, netDue: 13200.0, terms: "21 Days" },
      { id: "3", supplier: "Shree Ganesh Medicals", billsCount: 12, totalPurchased: 164000.0, taxInput: 19680.0, paidAmount: 124000.0, netDue: 40000.0, terms: "15 Days" },
      { id: "4", supplier: "Sun Pharma Depot", billsCount: 9, totalPurchased: 142000.0, taxInput: 17040.0, paidAmount: 142000.0, netDue: 0.0, terms: "Immediate" },
      { id: "5", supplier: "Cipla Distribution Hub", billsCount: 15, totalPurchased: 189000.0, taxInput: 22680.0, paidAmount: 155000.0, netDue: 34000.0, terms: "30 Days" },
    ],
  },
  "supplier:outstanding": {
    stats: [
      { id: "so1", title: "Total Supplier Dues", value: "₹2,14,500", trend: "Healthy", trendDirection: "up", trendLabel: "current payables", icon: Truck, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
      { id: "so2", title: "Dues in Term", value: "₹1,82,000", trend: "84.8%", trendDirection: "up", trendLabel: "within credit window", icon: CheckCircle2, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "so3", title: "Overdue Dues", value: "₹32,500", trend: "3 bills", trendDirection: "down", trendLabel: "priority payout", icon: AlertTriangle, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "so4", title: "Next Pay Batch", value: "05 Nov", trend: "₹64,000", trendDirection: "up", trendLabel: "scheduled RTGS", icon: Calendar, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
    ],
    chart: { title: "Upcoming Vendor Payment Schedule", metric1Label: "Payable Amount", metric2Label: "Discounts Available", metric1Color: "#e11d48", metric2Color: "#059669", data: generateDailyTrend(0.65, 0.5) },
    filterPlaceholder: "Search vendor, due date, invoice reference...",
    columns: [
      { key: "supplier", label: "Supplier Name" },
      { key: "gstin", label: "GSTIN" },
      { key: "totalDue", label: "Total Payable", align: "right", isCurrency: true, highlight: true },
      { key: "dueDate", label: "Payment Due Date" },
      { key: "overdueDays", label: "Overdue Status", align: "center" },
      { key: "paymentMode", label: "Mode", align: "center" },
      { key: "status", label: "Status", align: "center", isStatus: true },
    ],
    rows: [
      { id: "1", supplier: "MedPlus Distributors", gstin: "27AABCM8821Q1Z4", totalDue: 42500.0, dueDate: "05 Nov 2024", overdueDays: "Due in 5 Days", paymentMode: "RTGS", status: "Upcoming" },
      { id: "2", supplier: "Shree Ganesh Medicals", gstin: "27AABCS9912K1Z9", totalDue: 40000.0, dueDate: "02 Nov 2024", overdueDays: "Due in 2 Days", paymentMode: "NEFT", status: "Upcoming" },
      { id: "3", supplier: "Cipla Distribution Hub", gstin: "27AABCC4481P1Z1", totalDue: 34000.0, dueDate: "10 Nov 2024", overdueDays: "Due in 10 Days", paymentMode: "RTGS", status: "Upcoming" },
      { id: "4", supplier: "Apex Pharma Agencies", gstin: "27AABCA3319L1Z2", totalDue: 13200.0, dueDate: "28 Oct 2024", overdueDays: "3 Days Over", paymentMode: "Cheque", status: "Overdue" },
      { id: "5", supplier: "Torrent Pharma Logistics", gstin: "27AABCT7723N1Z5", totalDue: 13400.0, dueDate: "08 Nov 2024", overdueDays: "Due in 8 Days", paymentMode: "NEFT", status: "Upcoming" },
    ],
  },
  "supplier:credit": {
    stats: [
      { id: "sc1", title: "Total Vendor Credit", value: "₹15,00,000", trend: "64 Vendors", trendDirection: "up", trendLabel: "combined credit lines", icon: CreditCard, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
      { id: "sc2", title: "Credit Utilized", value: "14.3%", trend: "Low Risk", trendDirection: "up", trendLabel: "plenty of capacity", icon: Percent, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "sc3", title: "Avg Credit Period", value: "28 Days", trend: "+3 days", trendDirection: "up", trendLabel: "improved terms", icon: Clock, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "sc4", title: "Preferred Credit Tier", value: "8 Vendors", trend: "45 Days", trendDirection: "up", trendLabel: "top distributors", icon: ShieldCheck, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
    ],
    chart: { title: "Vendor Credit Assigned vs Utilized", metric1Label: "Credit Limit", metric2Label: "Balance Utilized", metric1Color: "#e11d48", metric2Color: "#f59e0b", data: generateDailyTrend(0.7, 0.3) },
    filterPlaceholder: "Search vendor credit terms, limit, ratings...",
    columns: [
      { key: "supplier", label: "Supplier Name" },
      { key: "creditTerms", label: "Credit Window", align: "center" },
      { key: "creditLimit", label: "Max Limit", align: "right", isCurrency: true },
      { key: "usedCredit", label: "Utilized", align: "right", isCurrency: true },
      { key: "availableCredit", label: "Available", align: "right", isCurrency: true, highlight: true },
      { key: "termsDays", label: "Grace Period", align: "center" },
      { key: "rating", label: "Trust Tier", align: "center" },
    ],
    rows: [
      { id: "1", supplier: "MedPlus Distributors", creditTerms: "30 Days", creditLimit: 200000.0, usedCredit: 42500.0, availableCredit: 157500.0, termsDays: "30 Days", rating: "Tier 1 Prime" },
      { id: "2", supplier: "Apex Pharma Agencies", creditTerms: "21 Days", creditLimit: 150000.0, usedCredit: 13200.0, availableCredit: 136800.0, termsDays: "21 Days", rating: "Tier 1 Prime" },
      { id: "3", supplier: "Shree Ganesh Medicals", creditTerms: "15 Days", creditLimit: 100000.0, usedCredit: 40000.0, availableCredit: 60000.0, termsDays: "15 Days", rating: "Tier 2" },
      { id: "4", supplier: "Cipla Distribution Hub", creditTerms: "30 Days", creditLimit: 250000.0, usedCredit: 34000.0, availableCredit: 216000.0, termsDays: "30 Days", rating: "Tier 1 Prime" },
      { id: "5", supplier: "Torrent Pharma Logistics", creditTerms: "21 Days", creditLimit: 120000.0, usedCredit: 13400.0, availableCredit: 106600.0, termsDays: "21 Days", rating: "Tier 2" },
    ],
  },
  "supplier:aging": {
    stats: [
      { id: "sa1", title: "Current (0-30 Days)", value: "₹1,82,000", trend: "84.8%", trendDirection: "up", trendLabel: "within terms", icon: CheckCircle2, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "sa2", title: "31-60 Days Over", value: "₹22,000", trend: "10.3%", trendDirection: "down", trendLabel: "approaching limit", icon: Clock, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "sa3", title: "61-90 Days Over", value: "₹10,500", trend: "4.9%", trendDirection: "down", trendLabel: "disputed invoices", icon: AlertTriangle, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
      { id: "sa4", title: "Over 90 Days", value: "₹0", trend: "0%", trendDirection: "up", trendLabel: "no bad debts", icon: ShieldCheck, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
    ],
    chart: { title: "Supplier Payable Aging Analysis", metric1Label: "Total Payables", metric2Label: "Current Terms", metric1Color: "#e11d48", metric2Color: "#0284c7", data: generateDailyTrend(0.65, 0.55) },
    filterPlaceholder: "Search supplier payable aging, vendor name, bill reference...",
    columns: [
      { key: "supplier", label: "Supplier Name" },
      { key: "totalDue", label: "Total Payable", align: "right", isCurrency: true, highlight: true },
      { key: "current0to30", label: "0-30 Days", align: "right", isCurrency: true },
      { key: "days31to60", label: "31-60 Days", align: "right", isCurrency: true },
      { key: "days61to90", label: "61-90 Days", align: "right", isCurrency: true },
      { key: "over90", label: "> 90 Days", align: "right", isCurrency: true },
      { key: "status", label: "Status", align: "center", isStatus: true },
    ],
    rows: [
      { id: "1", supplier: "MedPlus Distributors", totalDue: 42500.0, current0to30: 42500.0, days31to60: 0.0, days61to90: 0.0, over90: 0.0, status: "Normal" },
      { id: "2", supplier: "Shree Ganesh Medicals", totalDue: 40000.0, current0to30: 40000.0, days31to60: 0.0, days61to90: 0.0, over90: 0.0, status: "Normal" },
      { id: "3", supplier: "Cipla Distribution Hub", totalDue: 34000.0, current0to30: 34000.0, days31to60: 0.0, days61to90: 0.0, over90: 0.0, status: "Normal" },
      { id: "4", supplier: "Apex Pharma Agencies", totalDue: 13200.0, current0to30: 0.0, days31to60: 13200.0, days61to90: 0.0, over90: 0.0, status: "Review" },
      { id: "5", supplier: "Universal Surgicals", totalDue: 10500.0, current0to30: 0.0, days31to60: 0.0, days61to90: 10500.0, over90: 0.0, status: "Disputed" },
    ],
  },

  // ── 6. Financial Sub-Reports
  "financial:day-book": {
    stats: [
      { id: "fb1", title: "Today's Inflow", value: "₹42,800", trend: "+14.2%", trendDirection: "up", trendLabel: "cash & UPI receipts", icon: TrendingUp, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "fb2", title: "Today's Outflow", value: "₹8,400", trend: "3 vouchers", trendDirection: "down", trendLabel: "vendor & opex cash", icon: ShoppingCart, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
      { id: "fb3", title: "Bank Deposits", value: "₹25,000", trend: "Settled", trendDirection: "up", trendLabel: "counter cash deposit", icon: Building2, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "fb4", title: "Closing Till Cash", value: "₹9,400", trend: "Matched", trendDirection: "up", trendLabel: "counter float balance", icon: Tag, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
    ],
    chart: { title: "Day Book Inward Receipts vs Outward Disbursements", metric1Label: "Receipts", metric2Label: "Payments", metric1Color: "#059669", metric2Color: "#f43f5e", data: generateDailyTrend(0.85, 0.4) },
    filterPlaceholder: "Search voucher, account head, narration, cashier...",
    columns: [
      { key: "time", label: "Time" },
      { key: "voucherNo", label: "Voucher No." },
      { key: "accountHead", label: "Account Head" },
      { key: "narration", label: "Description / Narration" },
      { key: "debit", label: "Debit (Out)", align: "right", isCurrency: true },
      { key: "credit", label: "Credit (In)", align: "right", isCurrency: true, highlight: true },
      { key: "balance", label: "Running Till", align: "right", isCurrency: true },
      { key: "cashier", label: "Cashier" },
    ],
    rows: [
      { id: "1", time: "09:00 AM", voucherNo: "OB-001", accountHead: "Opening Float", narration: "Cash drawer opening float", debit: 0.0, credit: 5000.0, balance: 5000.0, cashier: "Devansh" },
      { id: "2", time: "11:30 AM", voucherNo: "CS-1481", accountHead: "Retail Counter 1", narration: "Retail POS billing sales", debit: 0.0, credit: 12450.0, balance: 17450.0, cashier: "Devansh" },
      { id: "3", time: "02:15 PM", voucherNo: "PV-042", accountHead: "Store Expenses", narration: "Emergency generator diesel", debit: 1200.0, credit: 0.0, balance: 16250.0, cashier: "Suresh" },
      { id: "4", time: "05:00 PM", voucherNo: "BD-012", accountHead: "Bank Deposit", narration: "Cash deposited to HDFC current a/c", debit: 15000.0, credit: 0.0, balance: 1250.0, cashier: "Devansh" },
      { id: "5", time: "09:30 PM", voucherNo: "CS-1482", accountHead: "Evening POS Shift", narration: "Evening session counter collection", debit: 0.0, credit: 25350.0, balance: 26600.0, cashier: "Devansh" },
    ],
  },
  "financial:cash-flow": {
    stats: [
      { id: "fc1", title: "Net Cash from Ops", value: "₹3,12,000", trend: "18.4%", trendDirection: "up", trendLabel: "operating cash flow", icon: TrendingUp, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "fc2", title: "Vendor Payouts", value: "₹6,17,900", trend: "Purchases", trendDirection: "down", trendLabel: "procurement payments", icon: ShoppingCart, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
      { id: "fc3", title: "OpEx Cash Disbursed", value: "₹82,000", trend: "Rent & Wages", trendDirection: "down", trendLabel: "monthly operations", icon: Tag, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "fc4", title: "Closing Cash & Bank", value: "₹4,82,400", trend: "+₹1,12,000", trendDirection: "up", trendLabel: "liquid liquidity", icon: Building2, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
    ],
    chart: { title: "Monthly Cash Inflow vs Outflow Trends", metric1Label: "Cash Inflow", metric2Label: "Cash Outflow", metric1Color: "#059669", metric2Color: "#e11d48", data: generateDailyTrend(0.9, 0.65) },
    filterPlaceholder: "Search monthly cash flow, capital expenses, operating heads...",
    columns: [
      { key: "month", label: "Month / Period" },
      { key: "operatingInflow", label: "Operating Receipts", align: "right", isCurrency: true },
      { key: "operatingOutflow", label: "Operating Payments", align: "right", isCurrency: true },
      { key: "netOperating", label: "Net Operating Cash", align: "right", isCurrency: true, highlight: true },
      { key: "capitalExp", label: "Capex Investments", align: "right", isCurrency: true },
      { key: "netCash", label: "Net Cash Position", align: "right", isCurrency: true },
    ],
    rows: [
      { id: "1", month: "October 2024", operatingInflow: 1248500.0, operatingOutflow: 699900.0, netOperating: 548600.0, capitalExp: 45000.0, netCash: 503600.0 },
      { id: "2", month: "September 2024", operatingInflow: 1120000.0, operatingOutflow: 642000.0, netOperating: 478000.0, capitalExp: 22000.0, netCash: 456000.0 },
      { id: "3", month: "August 2024", operatingInflow: 1080000.0, operatingOutflow: 615000.0, netOperating: 465000.0, capitalExp: 18000.0, netCash: 447000.0 },
      { id: "4", month: "July 2024", operatingInflow: 995000.0, operatingOutflow: 580000.0, netOperating: 415000.0, capitalExp: 35000.0, netCash: 380000.0 },
      { id: "5", month: "June 2024", operatingInflow: 940000.0, operatingOutflow: 540000.0, netOperating: 400000.0, capitalExp: 12000.0, netCash: 388000.0 },
    ],
  },
  "financial:payment-collection": {
    stats: [
      { id: "fp1", title: "Total Collections", value: "₹12,48,500", trend: "12.5%", trendDirection: "up", trendLabel: "monthly sales cash", icon: TrendingUp, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "fp2", title: "UPI QR Share", value: "54.8%", trend: "₹6,84,000", trendDirection: "up", trendLabel: "instant digital receipts", icon: Tag, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "fp3", title: "Counter Cash", value: "33.0%", trend: "₹4,12,000", trendDirection: "down", trendLabel: "physical currency", icon: CreditCard, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "fp4", title: "Card POS Machine", value: "12.2%", trend: "₹1,52,500", trendDirection: "up", trendLabel: "debit & credit cards", icon: CreditCard, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
    ],
    chart: { title: "Daily Payment Collections Breakdown by Channel", metric1Label: "Digital (UPI + Card)", metric2Label: "Cash", metric1Color: "#0284c7", metric2Color: "#f59e0b", data: generateDailyTrend(0.7, 0.45) },
    filterPlaceholder: "Search collections date, cashier counter, channel...",
    columns: [
      { key: "date", label: "Date" },
      { key: "counter", label: "POS Counter" },
      { key: "cashAmount", label: "Cash Collected", align: "right", isCurrency: true },
      { key: "upiAmount", label: "UPI Received", align: "right", isCurrency: true },
      { key: "cardAmount", label: "Card Received", align: "right", isCurrency: true },
      { key: "totalCollected", label: "Total Inward", align: "right", isCurrency: true, highlight: true },
      { key: "bankDeposit", label: "Auto Bank Remittance", align: "center" },
    ],
    rows: [
      { id: "1", date: "31 Oct 2024", counter: "Counter 1 (Main)", cashAmount: 14200.0, upiAmount: 22400.0, cardAmount: 4800.0, totalCollected: 41400.0, bankDeposit: "Settled 100%" },
      { id: "2", date: "30 Oct 2024", counter: "Counter 1 (Main)", cashAmount: 12500.0, upiAmount: 18900.0, cardAmount: 3200.0, totalCollected: 34600.0, bankDeposit: "Settled 100%" },
      { id: "3", date: "29 Oct 2024", counter: "Counter 2 (Express)", cashAmount: 9800.0, upiAmount: 16500.0, cardAmount: 2900.0, totalCollected: 29200.0, bankDeposit: "Settled 100%" },
      { id: "4", date: "28 Oct 2024", counter: "Counter 1 (Main)", cashAmount: 15400.0, upiAmount: 24200.0, cardAmount: 5100.0, totalCollected: 44700.0, bankDeposit: "Settled 100%" },
      { id: "5", date: "27 Oct 2024", counter: "Counter 1 (Main)", cashAmount: 11200.0, upiAmount: 15400.0, cardAmount: 3400.0, totalCollected: 30000.0, bankDeposit: "Settled 100%" },
    ],
  },
  "financial:expenses": {
    stats: [
      { id: "fe1", title: "Total OpEx Billed", value: "₹82,000", trend: "3.2%", trendDirection: "down", trendLabel: "of gross revenue", icon: Tag, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
      { id: "fe2", title: "Staff Payroll", value: "₹32,000", trend: "3 Pharmacists", trendDirection: "up", trendLabel: "monthly salaries", icon: Users, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "fe3", title: "Store Rent & Power", value: "₹38,000", trend: "Fixed", trendDirection: "up", trendLabel: "utilities & lease", icon: Building2, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "fe4", title: "Packaging & Bags", value: "₹12,000", trend: "Consumables", trendDirection: "up", trendLabel: "pos supplies", icon: Package, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
    ],
    chart: { title: "Store Operating Expenses by Category", metric1Label: "Budget", metric2Label: "Actual Spent", metric1Color: "#f43f5e", metric2Color: "#0284c7", data: generateDailyTrend(0.4, 0.38) },
    filterPlaceholder: "Search expense category, payee, description...",
    columns: [
      { key: "date", label: "Date" },
      { key: "voucherNo", label: "Voucher No." },
      { key: "category", label: "Expense Head" },
      { key: "payee", label: "Payee / Vendor" },
      { key: "description", label: "Description" },
      { key: "amount", label: "Amount", align: "right", isCurrency: true, highlight: true },
      { key: "paymentMode", label: "Mode", align: "center" },
      { key: "status", label: "Approval", align: "center", isStatus: true },
    ],
    rows: [
      { id: "1", date: "31 Oct 2024", voucherNo: "EXP-088", category: "Store Utilities", payee: "State Electricity Board", description: "Pharmacy AC & deep freezer power", amount: 14200.0, paymentMode: "Bank Netbanking", status: "Approved" },
      { id: "2", date: "28 Oct 2024", voucherNo: "EXP-087", category: "Consumables", payee: "PackWell Printers", description: "5000 printed medicine carry bags", amount: 6500.0, paymentMode: "UPI", status: "Approved" },
      { id: "3", date: "25 Oct 2024", voucherNo: "EXP-086", category: "Maintenance", payee: "CoolTech Refrigeration", description: "Vaccine chiller maintenance & QC", amount: 2400.0, paymentMode: "Cash", status: "Approved" },
      { id: "4", date: "20 Oct 2024", voucherNo: "EXP-085", category: "Software", payee: "Cloud Sync Gateway", description: "E-invoice & automated WhatsApp API", amount: 1800.0, paymentMode: "Card", status: "Approved" },
      { id: "5", date: "15 Oct 2024", voucherNo: "EXP-084", category: "Rent", payee: "Central Market Landlord", description: "Premises advance monthly lease", amount: 24000.0, paymentMode: "NEFT", status: "Approved" },
    ],
  },

  // ── 7. GST Sub-Reports
  "gst:purchase": {
    stats: [
      { id: "gp1", title: "Eligible ITC Inward", value: "₹89,200", trend: "100% Valid", trendDirection: "up", trendLabel: "claimable tax credit", icon: Tag, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
      { id: "gp2", title: "12% Bracket Inward", value: "₹54,000", trend: "Medicines", trendDirection: "up", trendLabel: "formulations tax", icon: Percent, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "gp3", title: "18% Bracket Inward", value: "₹28,200", trend: "Nutraceuticals", trendDirection: "up", trendLabel: "supplements tax", icon: Percent, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "gp4", title: "GSTR-2B Matched", value: "99.4%", trend: "Synced", trendDirection: "up", trendLabel: "reconciled with portal", icon: ShieldCheck, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
    ],
    chart: { title: "Input Tax Credit (ITC) Accumulated vs Set Off", metric1Label: "Eligible ITC", metric2Label: "Output Tax Setoff", metric1Color: "#9333ea", metric2Color: "#059669", data: generateDailyTrend(0.7, 0.6) },
    filterPlaceholder: "Search vendor bill, supplier GSTIN, tax bracket...",
    columns: [
      { key: "date", label: "Bill Date" },
      { key: "billNo", label: "Invoice No." },
      { key: "supplier", label: "Distributor" },
      { key: "gstin", label: "Supplier GSTIN" },
      { key: "taxableValue", label: "Taxable Value", align: "right", isCurrency: true },
      { key: "cgst", label: "CGST", align: "right", isCurrency: true },
      { key: "sgst", label: "SGST", align: "right", isCurrency: true },
      { key: "totalTax", label: "Total ITC", align: "right", isCurrency: true, highlight: true },
      { key: "invoiceTotal", label: "Gross Bill", align: "right", isCurrency: true },
    ],
    rows: [
      { id: "1", date: "31 Oct 2024", billNo: "PUR-88401", supplier: "MedPlus Distributors", gstin: "27AABCM8821Q1Z4", taxableValue: 48500.0, cgst: 2910.0, sgst: 2910.0, totalTax: 5820.0, invoiceTotal: 54320.0 },
      { id: "2", date: "30 Oct 2024", billNo: "PUR-88392", supplier: "Apex Pharma Agencies", gstin: "27AABCA3319L1Z2", taxableValue: 32400.0, cgst: 1944.0, sgst: 1944.0, totalTax: 3888.0, invoiceTotal: 36288.0 },
      { id: "3", date: "29 Oct 2024", billNo: "PUR-88370", supplier: "Shree Ganesh Medicals", gstin: "27AABCS9912K1Z9", taxableValue: 89000.0, cgst: 5340.0, sgst: 5340.0, totalTax: 10680.0, invoiceTotal: 99680.0 },
      { id: "4", date: "28 Oct 2024", billNo: "PUR-88355", supplier: "Sun Pharma Depot", gstin: "27AABCS1209M1Z8", taxableValue: 18500.0, cgst: 462.5, sgst: 462.5, totalTax: 925.0, invoiceTotal: 19425.0 },
      { id: "5", date: "27 Oct 2024", billNo: "PUR-88340", supplier: "Cipla Distribution Hub", gstin: "27AABCC4481P1Z1", taxableValue: 64200.0, cgst: 3852.0, sgst: 3852.0, totalTax: 7704.0, invoiceTotal: 71904.0 },
    ],
  },
  "gst:gstr-1": {
    stats: [
      { id: "g1", title: "Outward Taxable Sales", value: "₹11,14,732", trend: "1,482 Bills", trendDirection: "up", trendLabel: "total net revenue", icon: FileText, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
      { id: "g2", title: "Total Output GST", value: "₹1,33,768", trend: "₹66,884 each", trendDirection: "up", trendLabel: "CGST + SGST", icon: Tag, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "g3", title: "Table 7 (B2C Small)", value: "100%", trend: "1,482 Bills", trendDirection: "up", trendLabel: "consumer retail", icon: Users, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "g4", title: "HSN Summary Rows", value: "24", trend: "Validated", trendDirection: "up", trendLabel: "ready for JSON export", icon: ShieldCheck, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
    ],
    chart: { title: "GSTR-1 Monthly Outward Tax Liability", metric1Label: "Taxable Turnover", metric2Label: "Output Tax", metric1Color: "#9333ea", metric2Color: "#0ea5e9", data: generateDailyTrend(0.85, 0.4) },
    filterPlaceholder: "Search GSTR-1 rate slab, table section, HSN summary...",
    columns: [
      { key: "period", label: "Tax Period" },
      { key: "section", label: "GSTR-1 Section" },
      { key: "invoiceCount", label: "Invoice Count", align: "center" },
      { key: "taxableValue", label: "Taxable Value", align: "right", isCurrency: true },
      { key: "cgst", label: "Central Tax", align: "right", isCurrency: true },
      { key: "sgst", label: "State Tax", align: "right", isCurrency: true },
      { key: "totalTax", label: "Total GST", align: "right", isCurrency: true, highlight: true },
    ],
    rows: [
      { id: "1", period: "October 2024", section: "Table 7 - B2C Retail (12%)", invoiceCount: 1140, taxableValue: 785000.0, cgst: 47100.0, sgst: 47100.0, totalTax: 94200.0 },
      { id: "2", period: "October 2024", section: "Table 7 - B2C Retail (18%)", invoiceCount: 220, taxableValue: 182000.0, cgst: 16380.0, sgst: 16380.0, totalTax: 32760.0 },
      { id: "3", period: "October 2024", section: "Table 7 - B2C Retail (5%)", invoiceCount: 122, taxableValue: 147732.0, cgst: 3693.3, sgst: 3693.3, totalTax: 7386.6 },
    ],
  },
  "gst:gstr-3b": {
    stats: [
      { id: "g3b1", title: "Outward Tax Payable", value: "₹1,33,768", trend: "3.1 Table", trendDirection: "up", trendLabel: "gross tax due", icon: FileText, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
      { id: "g3b2", title: "Eligible ITC Setoff", value: "₹89,200", trend: "Table 4", trendDirection: "up", trendLabel: "purchases credit", icon: CheckCircle2, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "g3b3", title: "Net Cash Tax Due", value: "₹44,568", trend: "Table 6.1", trendDirection: "up", trendLabel: "payable in challan", icon: CreditCard, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "g3b4", title: "Late Fee & Interest", value: "₹0", trend: "On Time", trendDirection: "up", trendLabel: "zero penalty", icon: ShieldCheck, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
    ],
    chart: { title: "GSTR-3B Tax Liability vs ITC Setoff", metric1Label: "Tax Payable", metric2Label: "ITC Available", metric1Color: "#9333ea", metric2Color: "#10b981", data: generateDailyTrend(0.75, 0.5) },
    filterPlaceholder: "Search GSTR-3B tax period, filing status...",
    columns: [
      { key: "period", label: "Month" },
      { key: "outwardTaxable", label: "Outward Taxable", align: "right", isCurrency: true },
      { key: "outputTax", label: "Output Tax", align: "right", isCurrency: true },
      { key: "eligibleItc", label: "Eligible ITC", align: "right", isCurrency: true },
      { key: "netTaxPayable", label: "Net Cash Due", align: "right", isCurrency: true, highlight: true },
      { key: "paidInCash", label: "Paid in Cash", align: "right", isCurrency: true },
      { key: "status", label: "Filing Status", align: "center", isStatus: true },
    ],
    rows: [
      { id: "1", period: "October 2024", outwardTaxable: 1114732.0, outputTax: 133768.0, eligibleItc: 89200.0, netTaxPayable: 44568.0, paidInCash: 44568.0, status: "Filed" },
      { id: "2", period: "September 2024", outwardTaxable: 1000000.0, outputTax: 120000.0, eligibleItc: 82000.0, netTaxPayable: 38000.0, paidInCash: 38000.0, status: "Filed" },
      { id: "3", period: "August 2024", outwardTaxable: 964285.0, outputTax: 115714.0, eligibleItc: 78500.0, netTaxPayable: 37214.0, paidInCash: 37214.0, status: "Filed" },
    ],
  },
  "gst:hsn": {
    stats: [
      { id: "gh1", title: "HSN 3004 (Medicines)", value: "₹11,80,000", trend: "94.5%", trendDirection: "up", trendLabel: "core formulations", icon: Package, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
      { id: "gh2", title: "HSN 3005 (Wadding)", value: "₹42,000", trend: "3.4%", trendDirection: "up", trendLabel: "cotton & gauze", icon: Tag, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "gh3", title: "HSN 3006 (Appliances)", value: "₹26,500", trend: "2.1%", trendDirection: "up", trendLabel: "dental & surgicals", icon: Boxes, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "gh4", title: "HSN Codes Tracked", value: "12", trend: "6-digit code", trendDirection: "up", trendLabel: "portal compliant", icon: ShieldCheck, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
    ],
    chart: { title: "HSN Chapter 30 Revenue Contribution", metric1Label: "Taxable Value", metric2Label: "GST Amount", metric1Color: "#9333ea", metric2Color: "#f59e0b", data: generateDailyTrend(0.85, 0.4) },
    filterPlaceholder: "Search HSN code, product description...",
    columns: [
      { key: "hsnCode", label: "HSN Code" },
      { key: "description", label: "Description" },
      { key: "uqc", label: "UQC", align: "center" },
      { key: "totalQty", label: "Total Qty", align: "center" },
      { key: "taxableValue", label: "Taxable Turnover", align: "right", isCurrency: true },
      { key: "cgst", label: "CGST", align: "right", isCurrency: true },
      { key: "sgst", label: "SGST", align: "right", isCurrency: true },
      { key: "totalTax", label: "Total GST", align: "right", isCurrency: true, highlight: true },
    ],
    rows: [
      { id: "1", hsnCode: "300410", description: "Medicaments containing penicillins or derivatives", uqc: "BOX", totalQty: 2480, taxableValue: 485000.0, cgst: 29100.0, sgst: 29100.0, totalTax: 58200.0 },
      { id: "2", hsnCode: "300490", description: "Other medicaments of mixed or unmixed products", uqc: "TAB", totalQty: 5400, taxableValue: 695000.0, cgst: 41700.0, sgst: 41700.0, totalTax: 83400.0 },
      { id: "3", hsnCode: "300510", description: "Adhesive dressings and other articles having an adhesive layer", uqc: "ROL", totalQty: 680, taxableValue: 42000.0, cgst: 2520.0, sgst: 2520.0, totalTax: 5040.0 },
      { id: "4", hsnCode: "300610", description: "Sterile surgical catgut and suture materials", uqc: "NOS", totalQty: 180, taxableValue: 26500.0, cgst: 1590.0, sgst: 1590.0, totalTax: 3180.0 },
    ],
  },

  // ── 8. Product Sub-Reports
  "product:movement": {
    stats: [
      { id: "pm1", title: "Active Catalog SKUs", value: "1,240", trend: "100% active", trendDirection: "up", trendLabel: "monitored medicines", icon: Package, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
      { id: "pm2", title: "High Velocity SKUs", value: "84", trend: "Top 20%", trendDirection: "up", trendLabel: "dispensed daily", icon: TrendingUp, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "pm3", title: "Average Turnover", value: "14.2 Days", trend: "Fast", trendDirection: "up", trendLabel: "inventory turn", icon: Clock, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "pm4", title: "Slow Velocity SKUs", value: "32", trend: "Review", trendDirection: "down", trendLabel: "low movement", icon: AlertTriangle, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
    ],
    chart: { title: "Product Dispensing Velocity by Dosage Form", metric1Label: "Units Sold", metric2Label: "Current Stock", metric1Color: "#e11d48", metric2Color: "#059669", data: generateDailyTrend(0.85, 0.75) },
    filterPlaceholder: "Search brand name, generic salt, velocity tier...",
    columns: [
      { key: "brand", label: "Medicine Name" },
      { key: "salt", label: "Salt Composition" },
      { key: "inwardQty", label: "Inward Units", align: "center" },
      { key: "soldQty", label: "Sold Units", align: "center" },
      { key: "currentStock", label: "Stock Left", align: "center", highlight: true },
      { key: "turnoverRatio", label: "Turnover Ratio", align: "center" },
      { key: "velocity", label: "Velocity", align: "center" },
    ],
    rows: [
      { id: "1", brand: "Dolo 650mg Paracetamol", salt: "Paracetamol (650mg)", inwardQty: 1000, soldQty: 850, currentStock: 850, turnoverRatio: "4.8x", velocity: "Fast" },
      { id: "2", brand: "Augmentin 625 Duo Tablet", salt: "Amoxicillin + Clavulanic", inwardQty: 300, soldQty: 240, currentStock: 240, turnoverRatio: "3.6x", velocity: "Fast" },
      { id: "3", brand: "Pan D Capsule (15s)", salt: "Pantoprazole + Domperidone", inwardQty: 250, soldQty: 180, currentStock: 180, turnoverRatio: "3.2x", velocity: "Fast" },
      { id: "4", brand: "Telma 40mg Tablet", salt: "Telmisartan (40mg)", inwardQty: 400, soldQty: 310, currentStock: 310, turnoverRatio: "3.8x", velocity: "Fast" },
      { id: "5", brand: "Glycomet GP2 Forte", salt: "Glimepiride + Metformin", inwardQty: 200, soldQty: 145, currentStock: 145, turnoverRatio: "2.4x", velocity: "Moderate" },
    ],
  },
  "product:fast-moving": {
    stats: [
      { id: "pf1", title: "Top 20 Revenue Share", value: "54.8%", trend: "High Impact", trendDirection: "up", trendLabel: "of total pharmacy sales", icon: TrendingUp, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "pf2", title: "Average Days on Shelf", value: "4.2 Days", trend: "Rapid Turn", trendDirection: "up", trendLabel: "high turnover items", icon: Clock, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "pf3", title: "Weekly Reorder Lines", value: "18 SKUs", trend: "Scheduled", trendDirection: "up", trendLabel: "auto PO generated", icon: ShoppingCart, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
      { id: "pf4", title: "Zero Stock Risk", value: "Minimal", trend: "Safety Buffer", trendDirection: "up", trendLabel: "buffered minimums", icon: ShieldCheck, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
    ],
    chart: { title: "Top 10 Fast-Moving Medicines Revenue Contribution", metric1Label: "Revenue", metric2Label: "Profit", metric1Color: "#e11d48", metric2Color: "#10b981", data: generateDailyTrend(0.95, 0.7) },
    filterPlaceholder: "Search fast moving product, manufacturer, ranking...",
    columns: [
      { key: "rank", label: "Rank", align: "center" },
      { key: "brand", label: "Medicine Name" },
      { key: "manufacturer", label: "Pharma Company" },
      { key: "unitsSold", label: "Units Sold", align: "center" },
      { key: "revenue", label: "Revenue Generated", align: "right", isCurrency: true, highlight: true },
      { key: "profit", label: "Gross Profit", align: "right", isCurrency: true },
      { key: "currentStock", label: "In Stock", align: "center" },
    ],
    rows: [
      { id: "1", rank: "#1", brand: "Augmentin 625 Duo Tablet", manufacturer: "GSK Pharmaceuticals", unitsSold: 420, revenue: 85890.0, profit: 18700.0, currentStock: 240 },
      { id: "2", rank: "#2", brand: "Telma 40mg Tablet", manufacturer: "Glenmark Pharma", unitsSold: 380, revenue: 93100.0, profit: 22800.0, currentStock: 310 },
      { id: "3", rank: "#3", brand: "Pan D Capsule (15s)", manufacturer: "Alkem Laboratories", unitsSold: 340, revenue: 67320.0, profit: 17000.0, currentStock: 180 },
      { id: "4", rank: "#4", brand: "Dolo 650mg Paracetamol", manufacturer: "Micro Labs", unitsSold: 1200, revenue: 38400.0, profit: 9000.0, currentStock: 850 },
      { id: "5", rank: "#5", brand: "Glycomet GP2 Forte", manufacturer: "USV Pharma", unitsSold: 210, revenue: 59850.0, profit: 13650.0, currentStock: 145 },
    ],
  },
  "product:slow-moving": {
    stats: [
      { id: "psm1", title: "Slow Moving Items", value: "32 SKUs", trend: "Monitored", trendDirection: "down", trendLabel: ">45 days without turn", icon: AlertTriangle, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "psm2", title: "Capital Tied Up", value: "₹48,200", trend: "Locked", trendDirection: "down", trendLabel: "inventory value", icon: Tag, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
      { id: "psm3", title: "Avg Days Idle", value: "54 Days", trend: "Aging", trendDirection: "down", trendLabel: "since last sale", icon: Clock, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "psm4", title: "Supplier Returnable", value: "18 SKUs", trend: "Debit Note", trendDirection: "up", trendLabel: "eligible for return", icon: RotateCcw, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
    ],
    chart: { title: "Capital Tied in Slow-Moving Inventory", metric1Label: "Tied Value", metric2Label: "Units", metric1Color: "#f43f5e", metric2Color: "#f59e0b", data: generateDailyTrend(0.4, 0.3) },
    filterPlaceholder: "Search slow moving brand, days idle, action required...",
    columns: [
      { key: "brand", label: "Medicine Name" },
      { key: "manufacturer", label: "Pharma Company" },
      { key: "stockQty", label: "Stock Qty", align: "center" },
      { key: "lastSoldDate", label: "Last Sale Date" },
      { key: "daysIdle", label: "Days Without Sale", align: "center" },
      { key: "tiedValue", label: "Tied Value", align: "right", isCurrency: true, highlight: true },
      { key: "action", label: "Recommended Action", align: "center" },
    ],
    rows: [
      { id: "1", brand: "Cardivas 3.125mg Tablet", manufacturer: "Sun Pharma", stockQty: 45, lastSoldDate: "05 Sep 2024", daysIdle: "56 Days", tiedValue: 6750.0, action: "Doctor Detailing" },
      { id: "2", brand: "Zoryl M1 Forte", manufacturer: "Intas Pharma", stockQty: 30, lastSoldDate: "12 Sep 2024", daysIdle: "49 Days", tiedValue: 4800.0, action: "Counter Push" },
      { id: "3", brand: "Nebicard 2.5mg Tablet", manufacturer: "Torrent Pharma", stockQty: 25, lastSoldDate: "18 Aug 2024", daysIdle: "74 Days", tiedValue: 3950.0, action: "Return to Vendor" },
      { id: "4", brand: "Atorlip 20mg Tablet", manufacturer: "Cipla", stockQty: 20, lastSoldDate: "22 Aug 2024", daysIdle: "70 Days", tiedValue: 4200.0, action: "Return to Vendor" },
      { id: "5", brand: "Preva 75mg Capsule", manufacturer: "Lupin", stockQty: 18, lastSoldDate: "01 Sep 2024", daysIdle: "60 Days", tiedValue: 3240.0, action: "Doctor Detailing" },
    ],
  },
  "product:non-moving": {
    stats: [
      { id: "pnm1", title: "Non-Moving Items", value: "14 SKUs", trend: "Zero Sales", trendDirection: "down", trendLabel: ">90 days dead stock", icon: AlertTriangle, iconBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400" },
      { id: "pnm2", title: "Dead Stock Value", value: "₹22,400", trend: "At Cost", trendDirection: "down", trendLabel: "locked funds", icon: Tag, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "pnm3", title: "Expiry Risk", value: "6 Batches", trend: "<6 Months", trendDirection: "down", trendLabel: "action before expiry", icon: Clock, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
      { id: "pnm4", title: "Debit Note Prepared", value: "8 SKUs", trend: "₹14,200", trendDirection: "up", trendLabel: "ready for return", icon: CheckCircle2, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
    ],
    chart: { title: "Dead Inventory Write-off & Return Analysis", metric1Label: "Dead Value", metric2Label: "Claimable", metric1Color: "#f43f5e", metric2Color: "#10b981", data: generateDailyTrend(0.3, 0.25) },
    filterPlaceholder: "Search dead product, batch no, supplier return...",
    columns: [
      { key: "brand", label: "Medicine Name" },
      { key: "batch", label: "Batch No." },
      { key: "expiry", label: "Expiry Date" },
      { key: "stockQty", label: "Units Left", align: "center" },
      { key: "costPrice", label: "Unit Cost", align: "right", isCurrency: true },
      { key: "deadValue", label: "Total Locked", align: "right", isCurrency: true, highlight: true },
      { key: "daysZeroSale", label: "Days Dormant", align: "center" },
      { key: "status", label: "Action Status", align: "center", isStatus: true },
    ],
    rows: [
      { id: "1", brand: "Rablet D Capsule", batch: "RBL-801", expiry: "04/2025", stockQty: 25, costPrice: 180.0, deadValue: 4500.0, daysZeroSale: "110 Days", status: "Return to Vendor" },
      { id: "2", brand: "Ocid 20mg Capsule", batch: "OCD-441", expiry: "06/2025", stockQty: 40, costPrice: 65.0, deadValue: 2600.0, daysZeroSale: "98 Days", status: "Return to Vendor" },
      { id: "3", brand: "Cipcal 500mg Strip", batch: "CPC-112", expiry: "03/2025", stockQty: 35, costPrice: 90.0, deadValue: 3150.0, daysZeroSale: "125 Days", status: "Return to Vendor" },
      { id: "4", brand: "Eldoper 2mg Capsule", batch: "ELD-902", expiry: "08/2025", stockQty: 50, costPrice: 42.0, deadValue: 2100.0, daysZeroSale: "105 Days", status: "Doctor Detailing" },
      { id: "5", brand: "Voveran SR 100mg", batch: "VOV-331", expiry: "05/2025", stockQty: 30, costPrice: 160.0, deadValue: 4800.0, daysZeroSale: "135 Days", status: "Write-off Review" },
    ],
  },

  // ── 9. Custom Sub-Reports
  "custom:create": {
    stats: [
      { id: "ccr1", title: "Custom Queries", value: "8", trend: "Saved", trendDirection: "up", trendLabel: "active builders", icon: Sliders, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "ccr2", title: "Data Fields Available", value: "84", trend: "All Modules", trendDirection: "up", trendLabel: "sales, inventory, gst", icon: Database, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "ccr3", title: "Automated Webhooks", value: "3", trend: "Active", trendDirection: "up", trendLabel: "WhatsApp & Email", icon: Clock, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "ccr4", title: "Export Formats", value: "CSV, XLSX, PDF", trend: "Instant", trendDirection: "up", trendLabel: "file engines", icon: Download, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
    ],
    chart: { title: "Custom Report Builds & Executions", metric1Label: "Runs", metric2Label: "Downloads", metric1Color: "#f59e0b", metric2Color: "#0284c7", data: generateDailyTrend(0.5, 0.4) },
    filterPlaceholder: "Search query title, domain module, created by...",
    columns: [
      { key: "templateName", label: "Query Name" },
      { key: "module", label: "Source Module", align: "center" },
      { key: "fieldsCount", label: "Fields Included", align: "center" },
      { key: "filterRules", label: "Filter Conditions" },
      { key: "format", label: "Output Format", align: "center" },
      { key: "createdBy", label: "Author" },
      { key: "lastRun", label: "Last Tested" },
    ],
    rows: [
      { id: "1", templateName: "High Margin Diabetic Formulations", module: "Inventory", fieldsCount: 8, filterRules: "Category = Diabetic AND Margin > 25%", format: "Excel", createdBy: "Devansh", lastRun: "31 Oct 2024" },
      { id: "2", templateName: "Schedule H1 Weekly Doctor Audit", module: "Sales", fieldsCount: 12, filterRules: "Schedule = H1 AND Date >= 7 Days", format: "PDF", createdBy: "Suresh", lastRun: "28 Oct 2024" },
      { id: "3", templateName: "Supplier Debit Notes Pending Settlement", module: "Purchases", fieldsCount: 7, filterRules: "Status = Approved AND Balance > 0", format: "CSV", createdBy: "Accounts", lastRun: "25 Oct 2024" },
    ],
  },
  "custom:scheduled": {
    stats: [
      { id: "csr1", title: "Active Crons", value: "5 Jobs", trend: "Automated", trendDirection: "up", trendLabel: "standing schedules", icon: Clock, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "csr2", title: "Daily Evening Dispatch", value: "10:00 PM", trend: "WhatsApp", trendDirection: "up", trendLabel: "owner summary", icon: Share2, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "csr3", title: "Weekly Inventory Sync", value: "Mon 09 AM", trend: "Store Email", trendDirection: "up", trendLabel: "expiry report", icon: FileText, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "csr4", title: "Delivery Success Rate", value: "100%", trend: "0 Failures", trendDirection: "up", trendLabel: "30-day reliability", icon: CheckCircle2, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
    ],
    chart: { title: "Automated Delivery Triggers by Channel", metric1Label: "WhatsApp Dispatches", metric2Label: "Email Dispatches", metric1Color: "#f59e0b", metric2Color: "#10b981", data: generateDailyTrend(0.5, 0.45) },
    filterPlaceholder: "Search automated schedule, trigger time, recipients...",
    columns: [
      { key: "reportName", label: "Schedule Title" },
      { key: "frequency", label: "Cadence", align: "center" },
      { key: "time", label: "Trigger Time", align: "center" },
      { key: "channel", label: "Channel", align: "center" },
      { key: "recipients", label: "Recipients" },
      { key: "lastSent", label: "Last Dispatched" },
      { key: "status", label: "Status", align: "center", isStatus: true },
    ],
    rows: [
      { id: "1", reportName: "Daily Cash & UPI Till Reconciliation", frequency: "Daily", time: "10:00 PM", channel: "WhatsApp", recipients: "+91 98200 11223 (Owner)", lastSent: "31 Oct 2024 22:00", status: "Active" },
      { id: "2", reportName: "Near Expiry Stock <60 Days Alert", frequency: "Weekly", time: "Mon 09:00 AM", channel: "Email", recipients: "storemanager@pharmacy.com", lastSent: "28 Oct 2024 09:00", status: "Active" },
      { id: "3", reportName: "Doctor Prescription Turnover Share", frequency: "Monthly", time: "1st of Month", channel: "Email", recipients: "director@pharmacy.com", lastSent: "01 Oct 2024 00:00", status: "Active" },
      { id: "4", reportName: "Low Stock Emergency Restock PO", frequency: "Daily", time: "08:00 AM", channel: "WhatsApp", recipients: "+91 94112 44332 (Purchaser)", lastSent: "31 Oct 2024 08:00", status: "Active" },
    ],
  },
  "custom:export": {
    stats: [
      { id: "ce1", title: "Recent Export Jobs", value: "28", trend: "This Month", trendDirection: "up", trendLabel: "data downloads", icon: Download, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "ce2", title: "Total Records Exported", value: "48,200", trend: "Excel & CSV", trendDirection: "up", trendLabel: "verified rows", icon: FileText, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "ce3", title: "Avg Generation Time", value: "1.2s", trend: "High Speed", trendDirection: "up", trendLabel: "client-side engine", icon: Clock, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "ce4", title: "Retention Window", value: "30 Days", trend: "Secure", trendDirection: "up", trendLabel: "download logs", icon: ShieldCheck, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
    ],
    chart: { title: "Export Jobs Volume by File Format", metric1Label: "Excel Exports", metric2Label: "PDF Exports", metric1Color: "#f59e0b", metric2Color: "#0284c7", data: generateDailyTrend(0.55, 0.4) },
    filterPlaceholder: "Search export job, file name, exported by...",
    columns: [
      { key: "jobId", label: "Job ID" },
      { key: "reportName", label: "Export File Name" },
      { key: "dateRange", label: "Data Period" },
      { key: "format", label: "Format", align: "center" },
      { key: "fileSize", label: "Size", align: "center" },
      { key: "exportedBy", label: "Requested By" },
      { key: "status", label: "Status", align: "center", isStatus: true },
    ],
    rows: [
      { id: "1", jobId: "EXP-2024-118", reportName: "Sales_Summary_Oct_2024.xlsx", dateRange: "01 Oct - 31 Oct 2024", format: "Excel", fileSize: "1.4 MB", exportedBy: "Devansh", status: "Ready" },
      { id: "2", jobId: "EXP-2024-117", reportName: "GSTR1_Outward_Supplies.json", dateRange: "01 Oct - 31 Oct 2024", format: "JSON", fileSize: "420 KB", exportedBy: "CA Consultant", status: "Ready" },
      { id: "3", jobId: "EXP-2024-116", reportName: "Inventory_Valuation_Cost_MRP.csv", dateRange: "As of 31 Oct 2024", format: "CSV", fileSize: "840 KB", exportedBy: "Devansh", status: "Ready" },
      { id: "4", jobId: "EXP-2024-115", reportName: "Schedule_H1_Register_Signed.pdf", dateRange: "01 Oct - 31 Oct 2024", format: "PDF", fileSize: "2.8 MB", exportedBy: "Suresh (Pharmacist)", status: "Ready" },
    ],
  },
  "custom:templates": {
    stats: [
      { id: "ct1", title: "Built-in Templates", value: "12", trend: "Pharma Ready", trendDirection: "up", trendLabel: "pre-configured views", icon: FileText, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
      { id: "ct2", title: "Regulatory Audits", value: "4", trend: "Compliant", trendDirection: "up", trendLabel: "drug inspector standard", icon: ShieldCheck, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
      { id: "ct3", title: "Financial & Tax", value: "5", trend: "CA Approved", trendDirection: "up", trendLabel: "accounting models", icon: Tag, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
      { id: "ct4", title: "Inventory Restock", value: "3", trend: "PO Assisted", trendDirection: "up", trendLabel: "reorder algorithms", icon: Package, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
    ],
    chart: { title: "Standard Template Usage Across Pharmacy Shifts", metric1Label: "Times Run", metric2Label: "Exports", metric1Color: "#f59e0b", metric2Color: "#10b981", data: generateDailyTrend(0.6, 0.45) },
    filterPlaceholder: "Search template standard, domain, regulatory purpose...",
    columns: [
      { key: "templateTitle", label: "Template Standard" },
      { key: "category", label: "Domain" },
      { key: "compliance", label: "Regulatory Standard", align: "center" },
      { key: "recommendedFor", label: "Recommended For" },
      { key: "updatedAt", label: "Last Updated" },
      { key: "status", label: "Status", align: "center", isStatus: true },
    ],
    rows: [
      { id: "1", templateTitle: "Schedule H1 Register & Prescription Log", category: "Compliance", compliance: "Drugs & Cosmetics Act", recommendedFor: "Drug Inspector Audit", updatedAt: "Oct 2024", status: "Verified" },
      { id: "2", templateTitle: "Daily Cashier Drawer End-of-Day Balancing", category: "Finance", compliance: "Internal Audit", recommendedFor: "Shift Handover", updatedAt: "Oct 2024", status: "Verified" },
      { id: "3", templateTitle: "Fast Mover Reorder Schedule (PO Suggested)", category: "Inventory", compliance: "Supply Chain", recommendedFor: "Weekly Procurement", updatedAt: "Oct 2024", status: "Verified" },
      { id: "4", templateTitle: "Monthly GST 3B Set-off Computation", category: "GST", compliance: "GSTN Schema v1.4", recommendedFor: "Monthly CA Filing", updatedAt: "Oct 2024", status: "Verified" },
    ],
  },
};

// Auto-enrich all categories in MASTER_CATEGORIES_DATA
for (const [catKey, category] of Object.entries(MASTER_CATEGORIES_DATA)) {
  for (const item of category.items) {
    const catalogKey = `${catKey}:${item.slug}`;
    const altCatalogKey = `${catKey}:${item.id}`;
    const extra = SUB_REPORTS_CATALOG[catalogKey] || SUB_REPORTS_CATALOG[altCatalogKey];

    if (!category.tabs[item.slug]) {
      if (extra) {
        category.tabs[item.slug] = {
          id: item.id,
          slug: item.slug,
          title: item.title,
          subtitle: item.subtitle,
          ...extra,
        };
      } else {
        // Fallback dedicated sub-report data so every tab always has complete config
        category.tabs[item.slug] = {
          id: item.id,
          slug: item.slug,
          title: item.title,
          subtitle: item.subtitle,
          stats: [
            { id: "st1", title: "Tracked Records", value: "340", trend: "+8.4%", trendDirection: "up", trendLabel: "vs last cycle", icon: FileText, iconBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" },
            { id: "st2", title: "Active Turnaround", value: "98.2%", trend: "Optimal", trendDirection: "up", trendLabel: "execution rate", icon: CheckCircle2, iconBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400" },
            { id: "st3", title: "Audited Lines", value: "1,240", trend: "Verified", trendDirection: "up", trendLabel: "reconciled items", icon: ShieldCheck, iconBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" },
            { id: "st4", title: "Report Status", value: "Active", trend: "Realtime", trendDirection: "up", trendLabel: "live database feed", icon: Tag, iconBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" },
          ],
          chart: { title: `${item.title} Monthly Analysis`, metric1Label: "Primary Metric", metric2Label: "Secondary Metric", metric1Color: "#059669", metric2Color: "#0284c7", data: generateDailyTrend(0.7, 0.6) },
          filterPlaceholder: `Search ${item.title.toLowerCase()}...`,
          columns: [
            { key: "date", label: "Date" },
            { key: "item", label: "Record Reference" },
            { key: "category", label: "Category" },
            { key: "qty", label: "Quantity / Units", align: "center" },
            { key: "amount", label: "Billed Value", align: "right", isCurrency: true, highlight: true },
            { key: "status", label: "Status", align: "center", isStatus: true },
          ],
          rows: [
            { id: "1", date: "31 Oct 2024", item: `${item.title} Ref #001`, category: category.title, qty: 12, amount: 2450.0, status: "Active" },
            { id: "2", date: "30 Oct 2024", item: `${item.title} Ref #002`, category: category.title, qty: 8, amount: 1890.0, status: "Active" },
            { id: "3", date: "29 Oct 2024", item: `${item.title} Ref #003`, category: category.title, qty: 15, amount: 3420.0, status: "Active" },
            { id: "4", date: "28 Oct 2024", item: `${item.title} Ref #004`, category: category.title, qty: 6, amount: 980.0, status: "Active" },
            { id: "5", date: "27 Oct 2024", item: `${item.title} Ref #005`, category: category.title, qty: 22, amount: 5120.0, status: "Active" },
          ],
        };
      }
    }

    // Always register aliases for both full id and clean suffix so any URL format resolves cleanly
    if (category.tabs[item.slug]) {
      category.tabs[item.id] = category.tabs[item.slug];
      const cleanSuffix = item.id.replace(`${catKey}-`, "");
      category.tabs[cleanSuffix] = category.tabs[item.slug];
    }
  }
}

/**
 * Normalization helper: resolves category slug and tab config
 */
export const resolveCategoryAndTab = (categoryParam, subReportParam) => {
  let catKey = "sales";
  let tabKey = "summary";

  if (categoryParam) {
    const cleanCat = categoryParam.toLowerCase().replace("-reports", "");
    if (cleanCat in MASTER_CATEGORIES_DATA) {
      catKey = cleanCat;
    } else {
      // Find by report id
      for (const [cKey, cData] of Object.entries(MASTER_CATEGORIES_DATA)) {
        if (cData.id === categoryParam || cData.items.some((it) => it.id === categoryParam || it.slug === categoryParam)) {
          catKey = cKey;
          break;
        }
      }
    }
  }

  const categoryData = MASTER_CATEGORIES_DATA[catKey] || MASTER_CATEGORIES_DATA["sales"];

  if (subReportParam) {
    const cleanTab = subReportParam.toLowerCase();
    if (cleanTab in categoryData.tabs) {
      tabKey = categoryData.tabs[cleanTab]?.slug || cleanTab;
    } else {
      // Try to find matching item slug or id
      const matched = categoryData.items.find(
        (it) =>
          it.id.toLowerCase() === cleanTab ||
          it.slug.toLowerCase() === cleanTab ||
          it.id.toLowerCase().replace(`${catKey}-`, "") === cleanTab
      );
      if (matched) {
        tabKey = matched.slug;
      }
    }
  } else {
    // Default to first tab of the category
    tabKey = categoryData.items[0]?.slug || Object.keys(categoryData.tabs)[0];
  }

  const tabConfig = categoryData.tabs[tabKey] || Object.values(categoryData.tabs)[0];

  return {
    categoryData,
    tabConfig,
    catKey,
    tabKey,
  };
};

/**
 * Backward compatibility alias for sales summary view
 */
export const SALES_REPORTS_CONFIG = MASTER_CATEGORIES_DATA["sales"].tabs;
export const REPORT_DIRECTORY_CATEGORIES = Object.values(MASTER_CATEGORIES_DATA);
