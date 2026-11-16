// src/features/purchases/pages/mobile/PurchasesMobilePage.jsx

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Truck,
  Eye,
  CheckCircle2,
} from "lucide-react";
import {
  UICard,
  UIButton,
  UIBadge,
} from "@/components/ui";
import { PermissionGate } from "@/components/common/PermissionGate";
import { cn } from "@/lib/utils";
import {
  PURCHASES_STATS,
  PURCHASE_ORDERS,
  PURCHASE_SUPPLIERS,
} from "../../constants/purchasesData";
import { CreatePurchaseOrderModal } from "../../components/CreatePurchaseOrderModal";
import { PurchaseOrderDetailsModal } from "../../components/PurchaseOrderDetailsModal";
import { BranchFilterSelect, BranchBadge } from "@/components/shared";
import { useBranchFilter } from "@/hooks";

export const PurchasesMobilePage = () => {
  const { isCompanyLevel, selectedBranchId, setSelectedBranchId } = useBranchFilter();
  const [orders, setOrders] = useState(PURCHASE_ORDERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const statusTabs = ["all", "Ordered", "Received", "Draft"];

  const filteredOrders = useMemo(() => {
    return orders.filter((po) => {
      const matchesSearch =
        po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplier.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" || po.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, selectedStatus]);

  const handleCreateSuccess = (newPO) => {
    setOrders([newPO, ...orders]);
    setToastMessage(`✅ PO "${newPO.poNumber}" created.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMarkReceived = (poId) => {
    setOrders((prev) =>
      prev.map((po) =>
        po.id === poId
          ? { ...po, status: "Received", paymentStatus: "Paid" }
          : po
      )
    );
    setToastMessage("✅ Goods intake marked as Received.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCancelPO = (poId) => {
    setOrders((prev) =>
      prev.map((po) =>
        po.id === poId ? { ...po, status: "Cancelled" } : po
      )
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Received":
        return <UIBadge variant="soft" intent="success">Received</UIBadge>;
      case "Ordered":
        return <UIBadge variant="soft" intent="info">Ordered</UIBadge>;
      case "Partially Received":
        return <UIBadge variant="soft" intent="warning">Partial</UIBadge>;
      case "Draft":
        return <UIBadge variant="soft" intent="neutral">Draft</UIBadge>;
      case "Cancelled":
        return <UIBadge variant="soft" intent="error">Cancelled</UIBadge>;
      default:
        return <UIBadge variant="soft" intent="info">{status}</UIBadge>;
    }
  };

  return (
    <section className="min-h-[100dvh] w-full bg-bg px-3.5 pt-3 pb-24 font-sans space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-[9999] flex items-center gap-2 rounded-xl border border-primary/30 bg-surface/95 p-3 text-xs font-semibold text-text shadow-xl backdrop-blur-md">
          <CheckCircle2 className="size-4 text-primary shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-text tracking-tight">Purchases & POs</h1>
          <p className="text-xs text-text-muted">{orders.length} purchase orders</p>
        </div>

        <PermissionGate permission="purchase:create">
          <UIButton
            variant="primary"
            size="xs"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="size-3.5" />}
          >
            Create PO
          </UIButton>
        </PermissionGate>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl border border-border bg-surface shadow-2xs">
          <p className="text-[11px] text-text-muted font-medium">Total Procurement</p>
          <p className="text-base font-extrabold font-mono text-text mt-0.5">₹5,84,200</p>
        </div>
        <div className="p-3 rounded-xl border border-border bg-surface shadow-2xs">
          <p className="text-[11px] text-text-muted font-medium">Open Shipments</p>
          <p className="text-base font-extrabold font-mono text-primary mt-0.5">6 Orders</p>
        </div>
      </div>

      {/* Search & Tabs */}
      <div className="space-y-2">
        {isCompanyLevel && (
          <BranchFilterSelect
            value={selectedBranchId}
            onChange={setSelectedBranchId}
            size="sm"
            className="w-full"
          />
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search POs..."
            className="w-full rounded-xl border border-border bg-surface-alt/70 pl-9 pr-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedStatus(tab)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap",
                selectedStatus === tab
                  ? "bg-primary text-primary-contrast shadow-2xs"
                  : "bg-surface-alt text-text-muted border border-border/70"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* PO Card List */}
      <div className="space-y-2.5">
        {filteredOrders.map((po) => (
          <div
            key={po.id}
            onClick={() => setSelectedPO(po)}
            className="p-3.5 rounded-xl border border-border bg-surface shadow-2xs space-y-2 cursor-pointer hover:border-primary/40 active:scale-[0.99] transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono font-bold text-primary text-xs">{po.poNumber}</span>
                <p className="font-bold text-xs text-text mt-0.5">{po.supplier}</p>
              </div>
              {getStatusBadge(po.status)}
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
              <span className="text-text-muted text-[11px]">Due: {po.expectedDate}</span>
              <span className="font-mono font-extrabold text-text">
                ₹{po.totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <CreatePurchaseOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreateSuccess}
      />

      {/* Details Modal */}
      <PurchaseOrderDetailsModal
        po={selectedPO}
        isOpen={Boolean(selectedPO)}
        onClose={() => setSelectedPO(null)}
        onMarkReceived={handleMarkReceived}
        onCancelPO={handleCancelPO}
      />
    </section>
  );
};

export default PurchasesMobilePage;
