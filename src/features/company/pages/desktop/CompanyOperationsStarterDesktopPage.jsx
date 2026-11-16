// src/features/company/pages/desktop/CompanyOperationsStarterDesktopPage.jsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  GitBranch,
  Users,
  Truck,
  Landmark,
  Plus,
  ArrowRight,
  RefreshCw,
  Store,
  ChevronRight,
  Building2,
  ShoppingCart,
  Zap,
} from "lucide-react";

import { ROUTES } from "@/constants";
import { useNavigationPipeline, WORK_MODES } from "@/contexts";
import usePermission from "@/hooks/usePermission";

export const CompanyOperationsStarterDesktopPage = ({
  company = {},
  branches = [],
  customersCount = 0,
  suppliersCount = 0,
  bankAccountsCount = 0,
  isLoading = false,
  onRefresh,
  onOpenCustomerModal,
  onOpenSupplierModal,
}) => {
  const navigate = useNavigate();
  const { enterBranch } = useNavigationPipeline();
  const { can, isOwner } = usePermission();

  const canCreateBranch = isOwner || can("branch:create");
  const canCreateCustomer = isOwner || can("customer:create");
  const canCreateSupplier = isOwner || can("supplier:create");

  // Exactly 4 high-frequency operations for Company Level
  const CORE_OPERATIONS = useMemo(
    () => [
      {
        id: "branches-network",
        title: "Store Branches Network",
        subtitle: "Retail & Wholesale Outlets",
        description: "Manage store branches, configure outlet operating hours, and jump directly into counter billing.",
        icon: GitBranch,
        accent: "blue",
        badge: "Alt + B",
        path: ROUTES.BRANCHES,
        actionLabel: "Manage Branches",
        isPrimary: true,
      },
      {
        id: "customers-ledger",
        title: "Customers Master",
        subtitle: "Debtors & Receivables",
        description: "B2B client ledgers, customer credit limits, outstanding dues, settlements, and debtor balances.",
        icon: Users,
        accent: "emerald",
        badge: "Alt + C",
        path: ROUTES.CUSTOMERS,
        actionLabel: "View Customers",
        isPrimary: false,
      },
      {
        id: "suppliers-ledger",
        title: "Suppliers & Vendors",
        subtitle: "Procurement & Payables",
        description: "Pharmaceutical distributors, vendor purchase ledgers, credit terms, and payable balances.",
        icon: Truck,
        accent: "amber",
        badge: "Alt + V",
        path: ROUTES.SUPPLIERS,
        actionLabel: "View Suppliers",
        isPrimary: false,
      },
      {
        id: "treasury-banking",
        title: "Corporate Treasury & Banking",
        subtitle: "Bank Accounts & Vouchers",
        description: "Corporate bank accounts, statements reconciliation, journal adjustment vouchers, and ledger accounts.",
        icon: Landmark,
        accent: "indigo",
        badge: "Alt + T",
        path: ROUTES.BANK_ACCOUNTS,
        actionLabel: "View Bank Accounts",
        isPrimary: false,
      },
    ],
    []
  );

  return (
    <div className="w-full min-h-full flex-1 flex flex-col pt-0 pb-6 px-2 sm:px-3 gap-3 text-text font-sans select-none">
      {/* ── 1. Top 4-Card KPI Stat Grid (shrink-0, per UI_STANDARDS.md) ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 shrink-0">
        {/* Card 1: Store Branches */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs h-[68px] sm:h-[72px]">
          <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <GitBranch className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block truncate">
              Store Branches
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-text leading-tight">
                {branches.length}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Active Outlets
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Customers & Debtors */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs h-[68px] sm:h-[72px]">
          <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Users className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block truncate">
              Debtors / Customers
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-text leading-tight">
                {customersCount}
              </span>
              <span className="text-[10px] font-medium text-text-muted">
                Client Accounts
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Suppliers & Creditors */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs h-[68px] sm:h-[72px]">
          <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Truck className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block truncate">
              Creditors / Suppliers
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-text leading-tight">
                {suppliersCount}
              </span>
              <span className="text-[10px] font-medium text-text-muted">
                Distributors
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Treasury Bank Accounts */}
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs h-[68px] sm:h-[72px]">
          <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Landmark className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block truncate">
              Bank Accounts
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-bold font-mono text-text leading-tight">
                {bankAccountsCount}
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                Treasury Accounts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Company Command Header (shrink-0, NO search bar or filters) ─────── */}
      <div className="shrink-0 flex items-center justify-between gap-3 bg-surface border border-border/90 rounded-xl px-3.5 py-2.5 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Building2 className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-text truncate">
                {company?.name || "Company Operations"}
              </h2>
              {company?.code && (
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-surface-alt border border-border text-text-muted">
                  {company.code}
                </span>
              )}
              {company?.gstin && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-alt border border-border text-text-muted hidden md:inline-block">
                  GST: {company.gstin}
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted truncate mt-0.5">
              Multi-branch store management, receivables ledger, vendor procurement, and corporate treasury
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {canCreateBranch && (
            <button
              type="button"
              onClick={() => navigate(ROUTES.CREATE_BRANCH)}
              className="h-8.5 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add Branch</span>
            </button>
          )}

          {canCreateCustomer && (
            <button
              type="button"
              onClick={onOpenCustomerModal}
              className="h-8.5 px-3 rounded-lg bg-surface border border-border text-text hover:bg-surface-alt text-xs font-medium flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Users className="size-3.5 text-text-muted" />
              <span className="hidden sm:inline">Add Customer</span>
            </button>
          )}

          {canCreateSupplier && (
            <button
              type="button"
              onClick={onOpenSupplierModal}
              className="h-8.5 px-3 rounded-lg bg-surface border border-border text-text hover:bg-surface-alt text-xs font-medium flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Truck className="size-3.5 text-text-muted" />
              <span className="hidden sm:inline">Add Supplier</span>
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="size-8.5 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text transition-all active:scale-[0.98] cursor-pointer"
              title="Refresh Company Metrics"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {/* ── 3. Focused Core Operations Launchpad (2x2 Grid) ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
        {CORE_OPERATIONS.map((op) => {
          const Icon = op.icon;
          const isBlue = op.accent === "blue";
          const isEmerald = op.accent === "emerald";
          const isAmber = op.accent === "amber";

          return (
            <div
              key={op.id}
              onClick={() => navigate(op.path)}
              className={`group relative flex flex-col justify-between p-4 rounded-xl bg-surface border transition-all cursor-pointer shadow-2xs hover:shadow-sm active:scale-[0.99] ${
                op.isPrimary
                  ? "border-blue-500/40 hover:border-blue-500/70 bg-gradient-to-br from-blue-500/[0.03] to-transparent"
                  : "border-border/90 hover:border-primary/50"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-11 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                        isBlue
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
                          : isEmerald
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                          : isAmber
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                          : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25"
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text group-hover:text-primary transition-colors flex items-center gap-2">
                        {op.title}
                        {op.isPrimary && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                            <Zap className="size-2.5" /> Core
                          </span>
                        )}
                      </h3>
                      <span className="text-[11px] font-medium text-text-muted">
                        {op.subtitle}
                      </span>
                    </div>
                  </div>

                  <kbd className="px-2 py-0.5 rounded-md bg-surface-alt border border-border text-[11px] font-mono font-medium text-text-muted">
                    {op.badge}
                  </kbd>
                </div>

                <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-3.5">
                  {op.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <span className="text-xs font-semibold text-text group-hover:text-primary transition-colors flex items-center gap-1.5">
                  <span>{op.actionLabel}</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="text-[10px] text-text-muted">Click to open</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 4. Branch Quick Jump Cards (Direct Counter Launcher) ──────────────────── */}
      <div className="shrink-0 flex flex-col gap-2.5 p-3.5 rounded-xl bg-surface border border-border/90 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-primary" />
            <span className="text-xs font-bold text-text">Store Branches & Instant Counter Launcher</span>
            <span className="text-[10px] text-text-muted font-medium">
              ({branches.length} {branches.length === 1 ? "location" : "locations"})
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.BRANCHES)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Manage All Branches</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        {branches.length === 0 ? (
          <div className="p-5 rounded-xl bg-surface-alt/60 border border-dashed border-primary/30 text-center">
            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <Store className="size-5" />
            </div>
            <h4 className="text-xs font-bold text-text mb-0.5">No store branches configured yet for this company</h4>
            <p className="text-[11px] text-text-muted max-w-md mx-auto mb-3">
              Create your first physical pharmacy branch outlet or retail counter under this company to unlock counter billing, inventory management, and cashier registers.
            </p>
            <button
              type="button"
              onClick={() => navigate(ROUTES.CREATE_BRANCH)}
              className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-primary/90 transition-all"
            >
              <Plus className="size-3.5" />
              <span>Create First Branch</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {branches.slice(0, 6).map((branch) => (
              <div
                key={branch._id || branch.id}
                className="p-3 rounded-xl bg-surface-alt/50 border border-border/80 hover:border-primary/40 flex items-center justify-between gap-2.5 transition-all group"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-text truncate group-hover:text-primary transition-colors">
                    {branch.name}
                  </h4>
                  <span className="text-[10px] text-text-muted truncate block">
                    {branch.code || "Branch"} {branch.city ? `• ${branch.city}` : ""}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => enterBranch(branch, WORK_MODES.OPERATION)}
                  className="h-7 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 shadow-2xs active:scale-[0.98] cursor-pointer"
                  title="Launch POS Counter in this Branch"
                >
                  <ShoppingCart className="size-3" />
                  <span>Launch POS</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyOperationsStarterDesktopPage;
