// src/features/purchases/pages/mobile/PurchaseReturnsMobilePage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Undo2,
  RefreshCw,
  Eye,
  Truck,
  Building2,
  Receipt,
  CheckCircle2,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import {
  UIButton,
  UIBadge,
  UILoadingState,
  UITabs,
  uiToast,
} from "@/components/ui";
import purchaseReturnService from "../../services/purchaseReturnService";
import { PurchaseReturnDetailsModal } from "../../components/PurchaseReturnDetailsModal";
import useBranch from "@/features/branch/hooks/useBranch";
import { ROUTES } from "@/constants";

const PAGE_LIMIT = 20;

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

export const PurchaseReturnsMobilePage = () => {
  const navigate = useNavigate();
  const { currentBranch, activeBranchId } = useBranch();

  const [direction, setDirection] = useState("outgoing");
  const [search, setSearch] = useState("");
  const [returnMotive, setReturnMotive] = useState("all");

  const [returns, setReturns] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [receivingMap, setReceivingMap] = useState({});
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchReturns = useCallback(
    async (pageToFetch = 1) => {
      if (pageToFetch === 1) setIsLoading(true);

      try {
        const params = {
          page: pageToFetch,
          limit: PAGE_LIMIT,
          branchId: activeBranchId,
          direction,
          search: search.trim() || undefined,
          returnMotive: returnMotive !== "all" ? returnMotive : undefined,
        };

        const res = await purchaseReturnService.getPurchaseReturns(params);
        const data = res.data?.data || res.data || {};
        const list = data.data || [];
        const total = data.total || 0;

        if (pageToFetch === 1) {
          setReturns(list);
        } else {
          setReturns((prev) => [...prev, ...list]);
        }

        setTotalCount(total);
        setHasMore(pageToFetch * PAGE_LIMIT < total);
        setPage(pageToFetch);
      } catch (err) {
        console.error("Failed to load mobile purchase returns:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [activeBranchId, direction, search, returnMotive]
  );

  useEffect(() => {
    fetchReturns(1);
  }, [fetchReturns]);

  const handleReceiveBox = async (ret, e) => {
    if (e) e.stopPropagation();
    const returnId = ret._id;
    setReceivingMap((prev) => ({ ...prev, [returnId]: true }));
    try {
      await purchaseReturnService.receiveReturnBox(returnId);
      uiToast.success(
        `Consignment ${ret.debitNoteNo || ret.returnNo} marked as RECEIVED!`
      );
      fetchReturns(1);
      if (selectedReturn?._id === returnId) {
        setSelectedReturn((prev) => ({
          ...prev,
          shippingDetails: {
            ...prev?.shippingDetails,
            transitStatus: "RECEIVED",
            receivedAt: new Date(),
          },
        }));
      }
    } catch (err) {
      console.error("Failed to receive box:", err);
      uiToast.error(
        err.response?.data?.message || err.message || "Failed to receive box"
      );
    } finally {
      setReceivingMap((prev) => ({ ...prev, [returnId]: false }));
    }
  };

  const directionTabs = [
    {
      id: "outgoing",
      label: "Outgoing",
      icon: <ArrowUpRight className="size-3.5" />,
    },
    {
      id: "incoming",
      label: "Incoming Boxes",
      icon: <ArrowDownLeft className="size-3.5 text-primary" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-card border-b px-4 py-3 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-text flex items-center gap-1.5">
              <Undo2 className="size-4.5 text-primary" />
              Purchase Returns
            </h1>
            <p className="text-[11px] text-text-muted">
              {currentBranch?.name || "Active Facility"} • {totalCount} records
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchReturns(1)}
            className="p-1.5 text-text-muted hover:text-text rounded"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>

        {/* Direction Switcher */}
        <UITabs
          tabs={directionTabs}
          activeTab={direction}
          onChange={(id) => {
            setDirection(id);
            setPage(1);
          }}
          variant="segmented"
          size="xs"
        />

        {/* Search */}
        <div className="relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              direction === "outgoing"
                ? "Search debit note or supplier..."
                : "Search box ref, branch, or supplier..."
            }
            className="w-full h-9 pl-9 pr-3 border rounded-lg bg-background text-xs"
          />
        </div>
      </div>

      {/* Card List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          <UILoadingState text="Loading purchase returns..." />
        ) : returns.length === 0 ? (
          <div className="py-16 text-center text-text-muted space-y-2">
            <Undo2 className="size-8 mx-auto text-text-muted/40" />
            <div className="text-sm font-medium">
              {direction === "outgoing"
                ? "No purchase returns found"
                : "No incoming consignments found"}
            </div>
            <p className="text-xs">
              {direction === "outgoing"
                ? "Tap the button below to issue a supplier debit note."
                : "Boxes dispatched from other facilities will appear here."}
            </p>
          </div>
        ) : (
          returns.map((ret) => {
            const supplier = ret.supplierId || {};
            const originBranch = ret.branchId || {};
            const originCompany = ret.companyId || {};
            const shipping = ret.shippingDetails || {};
            const itemCount = (ret.items || []).length;
            const isReceiving = !!receivingMap[ret._id];

            return (
              <div
                key={ret._id}
                onClick={() => {
                  setSelectedReturn(ret);
                  setIsPreviewOpen(true);
                }}
                className="bg-card border rounded-xl p-3.5 shadow-2xs space-y-2.5 active:bg-surface/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-mono font-bold text-sm text-text">
                      {ret.debitNoteNo || ret.returnNo}
                    </div>
                    {ret.creditNoteNo && (
                      <div className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        CN: {ret.creditNoteNo}
                      </div>
                    )}
                    <div className="font-medium text-xs text-text mt-0.5">
                      {direction === "outgoing"
                        ? supplier.businessName || "Supplier"
                        : `${originBranch.name || "Origin Branch"} (${originCompany.name || "Origin"})`}
                    </div>
                    {direction === "incoming" && supplier.businessName && (
                      <div className="text-[11px] text-text-muted">
                        Supplier: {supplier.businessName}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-primary">
                      {formatCurrency(ret.grandTotal)}
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {formatDate(direction === "outgoing" ? ret.returnDate : shipping.dispatchedAt || ret.returnDate)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-[11px]">
                  <div className="flex items-center gap-1.5">
                    {direction === "outgoing" ? (
                      <>
                        <UIBadge variant={ret.returnMotive === "SELLABLE" ? "default" : "warning"}>
                          {ret.returnMotive}
                        </UIBadge>
                        <span className="text-text-muted">{itemCount} items</span>
                      </>
                    ) : (
                      <>
                        <UIBadge variant="soft" color="primary">
                          {shipping.boxCount || 1} Box(es)
                        </UIBadge>
                        <UIBadge
                          variant="soft"
                          color={shipping.transitStatus === "RECEIVED" ? "success" : "warning"}
                        >
                          {shipping.transitStatus || "IN_TRANSIT"}
                        </UIBadge>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {direction === "incoming" && shipping.transitStatus === "IN_TRANSIT" && (
                      <UIButton
                        variant="primary"
                        size="xs"
                        onClick={(e) => handleReceiveBox(ret, e)}
                        disabled={isReceiving}
                        startIcon={
                          isReceiving ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-3" />
                          )
                        }
                        className="font-bold h-7 px-2.5 text-[11px]"
                      >
                        {isReceiving ? "Receiving..." : "Receive"}
                      </UIButton>
                    )}

                    <UIBadge variant={ret.status === "CONFIRMED" ? "outline" : "destructive"}>
                      {ret.status}
                    </UIBadge>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Add Action */}
      <div className="fixed bottom-6 right-4 z-40">
        <UIButton
          variant="primary"
          size="lg"
          onClick={() => navigate(ROUTES.CREATE_PURCHASE_RETURN)}
          startIcon={<Plus className="size-5" />}
          className="rounded-full shadow-lg font-bold h-12 px-5"
        >
          New Return
        </UIButton>
      </div>

      {/* Details Modal */}
      <PurchaseReturnDetailsModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        purchaseReturn={selectedReturn}
        onUpdated={(updated) => {
          setSelectedReturn(updated);
          fetchReturns(page);
        }}
      />
    </div>
  );
};

export default PurchaseReturnsMobilePage;
