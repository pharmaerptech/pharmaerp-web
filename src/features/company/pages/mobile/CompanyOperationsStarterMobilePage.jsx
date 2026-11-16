// src/features/company/pages/mobile/CompanyOperationsStarterMobilePage.jsx

import { useNavigate } from "react-router-dom";
import {
  GitBranch,
  Users,
  Truck,
  Landmark,
  Plus,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";

import { ROUTES } from "@/constants";
import { useNavigationPipeline, WORK_MODES } from "@/contexts";
import usePermission from "@/hooks/usePermission";

export const CompanyOperationsStarterMobilePage = ({
  branches = [],
  customersCount = 0,
  suppliersCount = 0,
  bankAccountsCount = 0,
  onOpenCustomerModal,
  onOpenSupplierModal,
}) => {
  const navigate = useNavigate();
  const { enterBranch } = useNavigationPipeline();
  const { can, isOwner } = usePermission();

  const canCreateBranch = isOwner || can("branch:create");
  const canCreateCustomer = isOwner || can("customer:create");
  const canCreateSupplier = isOwner || can("supplier:create");

  // Exactly 4 high-frequency operations
  const CORE_OPERATIONS = [
    {
      id: "branches-network",
      title: "Store Branches Network",
      subtitle: "Retail Outlets & POS",
      icon: GitBranch,
      color: "blue",
      path: ROUTES.BRANCHES,
    },
    {
      id: "customers-ledger",
      title: "Customers Master",
      subtitle: "Debtors & Receivables",
      icon: Users,
      color: "emerald",
      path: ROUTES.CUSTOMERS,
    },
    {
      id: "suppliers-ledger",
      title: "Suppliers & Vendors",
      subtitle: "Procurement & Payables",
      icon: Truck,
      color: "amber",
      path: ROUTES.SUPPLIERS,
    },
    {
      id: "treasury-banking",
      title: "Corporate Treasury & Banking",
      subtitle: "Bank Accounts & Vouchers",
      icon: Landmark,
      color: "indigo",
      path: ROUTES.BANK_ACCOUNTS,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-3 p-2.5 font-sans pb-24 select-none">
      {/* ── 1. 2x2 Stat Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs">
          <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mb-1">
            <GitBranch className="size-3.5" />
          </div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">Branches</span>
          <span className="text-base font-bold font-mono text-text">{branches.length}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs">
          <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-1">
            <Users className="size-3.5" />
          </div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">Customers</span>
          <span className="text-base font-bold font-mono text-text">{customersCount}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs">
          <div className="size-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center mb-1">
            <Truck className="size-3.5" />
          </div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">Suppliers</span>
          <span className="text-base font-bold font-mono text-text">{suppliersCount}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-surface border border-border/90 shadow-2xs">
          <div className="size-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-1">
            <Landmark className="size-3.5" />
          </div>
          <span className="text-[10px] text-text-muted uppercase tracking-wider block font-medium">Bank Accounts</span>
          <span className="text-base font-bold font-mono text-text">{bankAccountsCount}</span>
        </div>
      </div>

      {/* ── 2. Quick Action Buttons ───────────────────────────── */}
      <div className="flex items-center gap-2">
        {canCreateBranch && (
          <button
            type="button"
            onClick={() => navigate(ROUTES.CREATE_BRANCH)}
            className="flex-1 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98]"
          >
            <Plus className="size-3.5" />
            <span>Add Branch</span>
          </button>
        )}

        {canCreateCustomer && (
          <button
            type="button"
            onClick={onOpenCustomerModal}
            className="flex-1 h-9 px-3 rounded-lg bg-surface border border-border text-text text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <Users className="size-3.5 text-text-muted" />
            <span>Add Customer</span>
          </button>
        )}

        {canCreateSupplier && (
          <button
            type="button"
            onClick={onOpenSupplierModal}
            className="flex-1 h-9 px-3 rounded-lg bg-surface border border-border text-text text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <Truck className="size-3.5 text-text-muted" />
            <span>Add Supplier</span>
          </button>
        )}
      </div>

      {/* ── 3. Core Company Operations ────────────────────────── */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider px-0.5">
          Company Operations
        </span>

        {CORE_OPERATIONS.map((op) => {
          const Icon = op.icon;
          return (
            <div
              key={op.id}
              onClick={() => navigate(op.path)}
              className="p-3 rounded-xl bg-surface border border-border/90 hover:border-primary/50 shadow-2xs flex items-center justify-between active:scale-[0.99] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                    op.color === "blue"
                      ? "bg-blue-500/10 text-blue-600"
                      : op.color === "emerald"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : op.color === "amber"
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-indigo-500/10 text-indigo-600"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text">{op.title}</h4>
                  <p className="text-[10px] text-text-muted">{op.subtitle}</p>
                </div>
              </div>
              <ArrowRight className="size-3.5 text-text-muted" />
            </div>
          );
        })}
      </div>

      {/* ── 4. Branches Jump List or Empty State ─────────────────────────────── */}
      {branches.length > 0 ? (
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Branches & POS Launch
            </span>
            <span className="text-[10px] text-text-muted">({branches.length})</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {branches.slice(0, 4).map((branch) => (
              <div
                key={branch._id || branch.id}
                className="p-2.5 rounded-lg bg-surface border border-border flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-text truncate">{branch.name}</h5>
                  <span className="text-[10px] text-text-muted">{branch.code || "Branch"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => enterBranch(branch, WORK_MODES.OPERATION)}
                  className="h-7 px-2.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shrink-0"
                >
                  <ShoppingCart className="size-3" />
                  <span>Launch POS</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-surface border border-dashed border-primary/30 text-center space-y-2">
          <p className="text-xs text-text-muted">No store branches configured yet for this company.</p>
          <button
            type="button"
            onClick={() => navigate(ROUTES.CREATE_BRANCH)}
            className="h-7.5 px-3 rounded-lg bg-primary text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="size-3" />
            <span>Create First Branch</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CompanyOperationsStarterMobilePage;
