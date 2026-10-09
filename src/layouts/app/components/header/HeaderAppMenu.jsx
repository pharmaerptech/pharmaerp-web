// src/layouts/app/components/header/HeaderAppMenu.jsx

import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Building2,
  Layers,
  Clock,
  CalendarDays,
  Wallet,
  Boxes,
  Truck,
  ArrowLeftRight,
  Users,
  Contact,
  Landmark,
  QrCode,
  FileUp,
  RefreshCw,
  X,
  ExternalLink,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

// 1. Dashboards Group (3 Levels)
const DASHBOARDS = [
  {
    id: "branch-dashboard",
    title: "Branch Dashboard",
    description: "Daily counter sales, live shifts & local stock",
    path: ROUTES.BRANCH_DASHBOARD,
    icon: Store,
    badge: "Branch",
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200/50",
  },
  {
    id: "company-dashboard",
    title: "Company Dashboard",
    description: "Multi-branch sales, GST & vendor bills",
    path: ROUTES.COMPANY_DASHBOARD,
    icon: Building2,
    badge: "Company",
    color: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200/50",
  },
  {
    id: "workspace-dashboard",
    title: "Workspace Dashboard",
    description: "Organization overview, quotas & growth",
    path: ROUTES.WORKSPACE_DASHBOARD,
    icon: Layers,
    badge: "Workspace",
    color: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200/50",
  },
];

// 2. Daily Counter & Cash Routine (Essential daily store operations)
const DAILY_COUNTER_OPS = [
  {
    id: "shifts",
    title: "Shifts",
    description: "Register opening float & cashier handover",
    path: "/operations/shifts",
    icon: Clock,
    color: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  },
  {
    id: "business-days",
    title: "Business Days",
    description: "Day open/close & EOD session audit",
    path: "/operations/business-days",
    icon: CalendarDays,
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  {
    id: "branch-cash",
    title: "Cash Counter",
    description: "Drawer cash, vault & denominations",
    path: ROUTES.BRANCH_CASH,
    icon: Wallet,
    color: "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
  },
  {
    id: "cash-exchanges",
    title: "Cash Exchanges",
    description: "Change & note denomination swap",
    path: ROUTES.CASH_EXCHANGES,
    icon: RefreshCw,
    color: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
  },
];

// 3. Stock & Procurement (Medicine catalog, inwards & transfers)
const INVENTORY_SUPPLY_OPS = [
  {
    id: "pharmacy-stock",
    title: "Pharmacy Stock",
    description: "Medicine catalog, batch stock & salts",
    path: ROUTES.WORKSPACE_PRODUCTS,
    icon: Boxes,
    color: "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400",
  },
  {
    id: "purchases",
    title: "Purchases (GRN)",
    description: "Distributor inward crates & bills",
    path: ROUTES.PURCHASES,
    icon: Truck,
    color: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400",
  },
  {
    id: "transfer-orders",
    title: "Transfer Orders",
    description: "Inter-branch stock requisitions",
    path: "/inventory/transfer-orders",
    icon: ArrowLeftRight,
    color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
  },
  {
    id: "deposit-slips",
    title: "Bank Deposit Slips",
    description: "Drawer cash deposits to bank account",
    path: ROUTES.BANK_DEPOSIT_SLIPS,
    icon: FileUp,
    color: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400",
  },
];

// 4. Parties & Banking (Customers, suppliers & payments)
const PARTIES_BANKING_OPS = [
  {
    id: "customers",
    title: "Customers (Khata)",
    description: "Patient credit ledger & payments",
    path: ROUTES.CUSTOMERS,
    icon: Users,
    color: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  },
  {
    id: "suppliers",
    title: "Suppliers",
    description: "Distributor balances & payables",
    path: ROUTES.SUPPLIERS,
    icon: Contact,
    color: "bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400",
  },
  {
    id: "payment-qrs",
    title: "Payment QRs",
    description: "Countertop digital UPI standees",
    path: ROUTES.PAYMENT_QRS,
    icon: QrCode,
    color: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
  },
  {
    id: "bank-accounts",
    title: "Bank Accounts",
    description: "Corporate & branch bank balances",
    path: ROUTES.BANK_ACCOUNTS,
    icon: Landmark,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  },
];

export const HeaderAppMenu = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const renderOpCard = (item) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleNavigate(item.path)}
        className={cn(
          "group p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex items-center gap-2.5",
          isActive
            ? "border-primary bg-primary/5 shadow-2xs"
            : "border-border/60 bg-surface hover:border-border hover:bg-surface-hover hover:shadow-2xs"
        )}
      >
        <div className={cn("p-2 rounded-lg shrink-0", item.color)}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-xs text-text truncate group-hover:text-primary transition-colors">
            {item.title}
          </div>
          <div className="text-[10px] text-text-muted truncate leading-tight">
            {item.description}
          </div>
        </div>
        <ExternalLink className="size-3 text-text-muted/40 group-hover:text-text-muted shrink-0 transition-colors mr-0.5" />
      </button>
    );
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {/* ── TRIGGER: 9-Dot Dotted Grid Menu Icon ────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="App Launcher & Quick Menu"
        aria-expanded={isOpen}
        title="Dashboards & Daily Operations"
        className={cn(
          "flex items-center justify-center size-9 rounded-full border transition-all duration-150 cursor-pointer shadow-2xs",
          isOpen
            ? "border-primary/40 bg-primary/10 text-primary ring-2 ring-primary/20 scale-102"
            : "border-border/80 bg-surface text-text-muted hover:text-text hover:bg-surface-hover active:scale-95"
        )}
      >
        {/* Iconic 9-Dot Dotted Grid SVG (Waffle Menu) */}
        <svg
          className="size-4.5 transition-transform duration-200"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <circle cx="5" cy="5" r="2" />
          <circle cx="12" cy="5" r="2" />
          <circle cx="19" cy="5" r="2" />
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="12" cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
        </svg>
      </button>

      {/* ── DROPDOWN POPOVER (Search bar removed per user instruction) ─ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 top-full mt-2 w-[410px] sm:w-[480px] max-h-[85vh] overflow-hidden flex flex-col rounded-2xl border border-border bg-surface/98 backdrop-blur-md shadow-2xl z-50 text-text"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-border/70 bg-surface-alt/40">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="5" cy="5" r="2" />
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="19" cy="5" r="2" />
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                    <circle cx="5" cy="19" r="2" />
                    <circle cx="12" cy="19" r="2" />
                    <circle cx="19" cy="19" r="2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text leading-tight">
                    Quick Operations Launcher
                  </h3>
                  <p className="text-[10px] text-text-muted leading-tight">
                    Dashboards &amp; high-frequency daily pharmacy workflows
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface-alt transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 max-h-[calc(85vh-90px)]">
              {/* ── SECTION 1: DASHBOARDS ─────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-text-muted">
                    Multi-Level Dashboards
                  </span>
                  <span className="text-[10px] font-mono text-text-muted/80">
                    3 Tiers
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {DASHBOARDS.map((dash) => {
                    const Icon = dash.icon;
                    const isActive = location.pathname === dash.path;

                    return (
                      <button
                        key={dash.id}
                        type="button"
                        onClick={() => handleNavigate(dash.path)}
                        className={cn(
                          "group p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between relative overflow-hidden",
                          isActive
                            ? "border-primary bg-primary/5 shadow-2xs"
                            : "border-border/70 bg-surface hover:border-border hover:bg-surface-hover hover:shadow-2xs"
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className={cn("p-1.5 rounded-lg border shrink-0", dash.color)}>
                              <Icon className="size-4" />
                            </div>
                            <span className="text-[9px] font-semibold font-mono uppercase px-1.5 py-0.5 rounded-md bg-surface-alt border border-border/60 text-text-muted">
                              {dash.badge}
                            </span>
                          </div>
                          <div className="font-bold text-xs text-text group-hover:text-primary transition-colors leading-snug">
                            {dash.title}
                          </div>
                        </div>
                        <div className="text-[10px] text-text-muted line-clamp-2 mt-1 leading-tight">
                          {dash.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── SECTION 2: DAILY COUNTER & CASH ROUTINE ───────── */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-text-muted">
                    Daily Counter &amp; Cash Routine
                  </span>
                  <span className="text-[10px] font-medium text-text-muted">
                    Shift &amp; Register
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DAILY_COUNTER_OPS.map(renderOpCard)}
                </div>
              </div>

              {/* ── SECTION 3: STOCK & PROCUREMENT ────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-text-muted">
                    Stock &amp; Procurement
                  </span>
                  <span className="text-[10px] font-medium text-text-muted">
                    Batches &amp; Receiving
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INVENTORY_SUPPLY_OPS.map(renderOpCard)}
                </div>
              </div>

              {/* ── SECTION 4: PARTIES & BANKING ──────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-text-muted">
                    Parties &amp; Banking
                  </span>
                  <span className="text-[10px] font-medium text-text-muted">
                    Ledgers &amp; Accounts
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PARTIES_BANKING_OPS.map(renderOpCard)}
                </div>
              </div>
            </div>

            {/* Subtle footer */}
            <div className="px-3.5 py-2 border-t border-border/60 bg-surface-alt/40 flex items-center justify-between text-[11px] text-text-muted">
              <span>Direct access to daily pharmacy workflows</span>
              <span className="font-mono text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border">
                ESC to close
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeaderAppMenu;
