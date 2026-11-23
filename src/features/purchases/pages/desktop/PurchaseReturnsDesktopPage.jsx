// src/features/purchases/pages/desktop/PurchaseReturnsDesktopPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Undo2,
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  Building2,
  Truck,
  Receipt,
  FileSpreadsheet,
  Package,
  Boxes,
  AlertTriangle,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import {
  UIPageHeader,
  UIStatCard,
  UIFilterBar,
  UITabs,
  UIButton,
  UIIconButton,
  UIInput,
  UISearchInput,
  UISelect,
  UIBadge,
  UIStatusIndicator,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  UITableEmpty,
  UITableLoading,
  uiToast,
} from "@/components/ui";
import purchaseReturnService from "../../services/purchaseReturnService";
import { PurchaseReturnDetailsModal } from "../../components/PurchaseReturnDetailsModal";
import useBranch from "@/features/branch/hooks/useBranch";
import { ROUTES } from "@/constants";

const PAGE_LIMIT = 25;

const formatCurrency = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return "0.00";
  return Number(val).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const PurchaseReturnsDesktopPage = () => {
  const navigate = useNavigate();
  const { currentBranch, activeBranchId } = useBranch();

  // Direction Switch: "outgoing" (Returns created by this branch) vs "incoming" (Boxes received from other branches)
  const [direction, setDirection] = useState("outgoing");

  // Filters State
  const [search, setSearch] = useState("");
  const [returnMotive, setReturnMotive] = useState("all");
  const [status, setStatus] = useState("all");

  // Data & Pagination State
  const [returns, setReturns] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Receiving state map for individual rows
  const [receivingMap, setReceivingMap] = useState({});

  // Modal State
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch Returns
  const fetchReturns = useCallback(
    async (pageToFetch = 1, isInitial = false) => {
      if (isInitial) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const params = {
          page: pageToFetch,
          limit: PAGE_LIMIT,
          branchId: activeBranchId,
          direction,
          search: search.trim() || undefined,
          returnMotive: returnMotive !== "all" ? returnMotive : undefined,
          status: status !== "all" ? status : undefined,
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
        console.error("Failed to fetch purchase returns:", err);
        uiToast.error("Failed to load purchase returns");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeBranchId, direction, search, returnMotive, status]
  );

  useEffect(() => {
    fetchReturns(1, true);
  }, [fetchReturns]);

  const handleLoadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore) {
      fetchReturns(page + 1, false);
    }
  };

  const handleOpenPreview = (ret) => {
    setSelectedReturn(ret);
    setIsPreviewOpen(true);
  };

  const handleReceiveBox = async (ret, e) => {
    if (e) e.stopPropagation();
    const returnId = ret._id;
    setReceivingMap((prev) => ({ ...prev, [returnId]: true }));
    try {
      await purchaseReturnService.receiveReturnBox(returnId);
      uiToast.success(
        `Consignment box ${ret.debitNoteNo || ret.returnNo} marked as RECEIVED!`
      );
      fetchReturns(1, true);
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
      console.error("Failed to receive return box:", err);
      uiToast.error(
        err.response?.data?.message || err.message || "Failed to receive box"
      );
    } finally {
      setReceivingMap((prev) => ({ ...prev, [returnId]: false }));
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalVal = returns.reduce((acc, r) => acc + (r.grandTotal || 0), 0);
    const taxVal = returns.reduce((acc, r) => acc + (r.totalGst || 0), 0);
    const scrapCount = returns.filter(
      (r) => r.returnMotive === "EXPIRED" || r.returnMotive === "BROKEN"
    ).length;
    const sellableCount = returns.filter(
      (r) => r.returnMotive === "SELLABLE"
    ).length;
    const inTransitCount = returns.filter(
      (r) => r.shippingDetails?.transitStatus === "IN_TRANSIT"
    ).length;
    const receivedCount = returns.filter(
      (r) => r.shippingDetails?.transitStatus === "RECEIVED"
    ).length;

    return {
      totalVal,
      taxVal,
      scrapCount,
      sellableCount,
      inTransitCount,
      receivedCount,
    };
  }, [returns]);

  const directionTabs = [
    {
      id: "outgoing",
      label: "Outgoing Returns (Debit Notes)",
      icon: <ArrowUpRight className="size-3.5" />,
    },
    {
      id: "incoming",
      label: "Incoming Consignments (Boxes from other branches)",
      icon: <ArrowDownLeft className="size-3.5 text-primary" />,
    },
  ];

  const motiveTabs = [
    { id: "all", label: "All Returns", icon: <Boxes className="size-3.5" /> },
    { id: "SELLABLE", label: "Sellable Shelf", icon: <Package className="size-3.5" /> },
    { id: "EXPIRED", label: "Expired Scrap", icon: <Trash2 className="size-3.5" /> },
    { id: "BROKEN", label: "Broken Scrap", icon: <AlertTriangle className="size-3.5" /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <UIPageHeader
        title="Purchase Returns & Consignment Transfers"
        description={`Manage supplier returns, Section 34 GST Debit Notes, and inter-company return box shipping for ${currentBranch?.name || "Active Facility"}`}
        actions={
          <div className="flex items-center gap-2.5">
            <UIButton
              variant="outline"
              size="sm"
              onClick={() => fetchReturns(1, true)}
              startIcon={<RefreshCw className="size-3.5" />}
              title="Refresh list"
            >
              Refresh
            </UIButton>

            <UIButton
              variant="primary"
              size="sm"
              onClick={() => navigate(ROUTES.CREATE_PURCHASE_RETURN)}
              startIcon={<Plus className="size-3.5" />}
              className="font-bold shadow-xs"
            >
              New Purchase Return
            </UIButton>
          </div>
        }
      />

      {/* 2. Top Direction Segmented Navigation */}
      <div className="flex items-center justify-between bg-surface border border-border p-2 rounded-2xl shadow-xs">
        <UITabs
          tabs={directionTabs}
          activeTab={direction}
          onChange={(tabId) => {
            setDirection(tabId);
            setPage(1);
          }}
          variant="segmented"
          size="sm"
        />

        <div className="hidden sm:flex items-center gap-2 text-xs text-text-muted px-2">
          <Building2 className="size-3.5 text-primary" />
          <span>
            Active Facility: <strong className="text-text">{currentBranch?.name || "Main Warehouse"}</strong>
          </span>
        </div>
      </div>

      {/* 3. KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <UIStatCard
          title={direction === "outgoing" ? "Total Debit Notes" : "Total Consignments"}
          value={totalCount}
          subtitle={direction === "outgoing" ? "Issued by active facility" : "Routed to this branch"}
          icon={direction === "outgoing" ? <Undo2 className="size-5" /> : <Truck className="size-5" />}
          color="primary"
          variant="default"
          isLoading={isLoading}
        />

        <UIStatCard
          title={direction === "outgoing" ? "Total Debit Value" : "Consignment Value"}
          value={formatCurrency(stats.totalVal)}
          prefix="₹"
          subtitle={direction === "outgoing" ? "Direct AP reduction claimed" : "Total returned cargo"}
          icon={<Receipt className="size-5" />}
          color="success"
          variant="default"
          isLoading={isLoading}
        />

        <UIStatCard
          title="Consignment Transit"
          value={stats.inTransitCount}
          subtitle={`${stats.receivedCount} marked as received`}
          icon={<Truck className="size-5" />}
          color="warning"
          variant="default"
          isLoading={isLoading}
        />

        <UIStatCard
          title="Scrap Bin Items"
          value={stats.scrapCount}
          subtitle={`${stats.sellableCount} sellable returns`}
          icon={<Trash2 className="size-5" />}
          color="purple"
          variant="default"
          isLoading={isLoading}
        />
      </div>

      {/* 4. Filters & Motive Tabs */}
      <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Segmented Motive Tabs */}
          <UITabs
            tabs={motiveTabs}
            activeTab={returnMotive}
            onChange={(tabId) => setReturnMotive(tabId)}
            variant="segmented"
            size="sm"
          />

          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-64 sm:w-72">
              <UISearchInput
                value={search}
                onChange={(val) => setSearch(val)}
                placeholder="Search debit note, supplier, memo..."
                size="sm"
              />
            </div>

            <div className="w-40">
              <UISelect
                value={status}
                onChange={(val) => setStatus(val)}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "CONFIRMED", label: "Confirmed" },
                  { value: "CANCELLED", label: "Cancelled" },
                  { value: "DRAFT", label: "Draft" },
                ]}
                size="sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border/60">
          <span>
            Showing <strong className="text-text">{returns.length}</strong> of{" "}
            <strong className="text-text">{totalCount}</strong> {direction === "outgoing" ? "purchase returns" : "incoming consignments"}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Package className="size-3.5 text-primary" />
            Mode: <strong className="text-text uppercase font-semibold">{direction === "outgoing" ? "Outgoing Returns" : "Incoming Consignments"}</strong>
          </span>
        </div>
      </div>

      {/* 5. Returns Data Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
        <UITable>
          <UITableHeader>
            <UITableRow className="bg-surface-alt/60">
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px]">
                {direction === "outgoing" ? "Debit Note #" : "Box / Note Ref #"}
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px]">
                {direction === "outgoing" ? "Date" : "Dispatched Date"}
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px]">
                {direction === "outgoing" ? "Supplier" : "Origin Facility"}
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px]">
                {direction === "outgoing" ? "Motive" : "Target Supplier"}
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-center">
                {direction === "outgoing" ? "Items" : "Boxes Packed"}
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-right">
                Debit Total
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-center">
                Transit Status
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-center">
                Status
              </UITableHead>
              <UITableHead className="py-3 px-4 font-semibold text-text-muted uppercase text-[11px] text-center">
                Action
              </UITableHead>
            </UITableRow>
          </UITableHeader>

          <UITableBody>
            {isLoading ? (
              <UITableLoading colSpan={9} />
            ) : returns.length === 0 ? (
              <UITableEmpty
                colSpan={9}
                title={direction === "outgoing" ? "No purchase returns found" : "No incoming return boxes found"}
                description={
                  direction === "outgoing"
                    ? "Click 'New Purchase Return' or return quarantined stock directly from the Expired & Scrap items register."
                    : "No box consignments have been routed to this facility from other branches yet."
                }
              />
            ) : (
              returns.map((ret) => {
                const supplier = ret.supplierId || {};
                const originBranch = ret.branchId || {};
                const originCompany = ret.companyId || {};
                const shipping = ret.shippingDetails || {};
                const itemCount = (ret.items || []).length;
                const isReceiving = !!receivingMap[ret._id];

                return (
                  <UITableRow
                    key={ret._id}
                    className="hover:bg-surface-hover transition-colors cursor-pointer"
                    onClick={() => handleOpenPreview(ret)}
                  >
                    {/* Column 1: Ref */}
                    <UITableCell className="py-3.5 px-4 font-mono font-bold text-text">
                      <div className="flex items-center gap-1.5">
                        <span>{ret.debitNoteNo || ret.returnNo}</span>
                      </div>
                      {ret.debitNoteNo && ret.returnNo !== ret.debitNoteNo && (
                        <span className="block font-sans text-[11px] font-normal text-text-muted">
                          Memo: {ret.returnNo}
                        </span>
                      )}
                    </UITableCell>

                    {/* Column 2: Date */}
                    <UITableCell className="py-3.5 px-4 text-xs text-text-muted font-medium">
                      {formatDate(direction === "outgoing" ? ret.returnDate : shipping.dispatchedAt || ret.returnDate)}
                    </UITableCell>

                    {/* Column 3: Supplier (Outgoing) or Origin Facility (Incoming) */}
                    <UITableCell className="py-3.5 px-4">
                      {direction === "outgoing" ? (
                        <>
                          <div className="font-semibold text-xs text-text truncate max-w-52">
                            {supplier.businessName || "Unknown Supplier"}
                          </div>
                          {supplier.gstNumber && (
                            <div className="text-[11px] text-text-muted font-mono">
                              GST: {supplier.gstNumber}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="font-semibold text-xs text-text truncate max-w-52">
                            {originBranch.name || "Origin Branch"}
                          </div>
                          <div className="text-[11px] text-text-muted truncate max-w-52">
                            {originCompany.name || "Origin Company"}
                          </div>
                        </>
                      )}
                    </UITableCell>

                    {/* Column 4: Motive (Outgoing) or Target Supplier (Incoming) */}
                    <UITableCell className="py-3.5 px-4">
                      {direction === "outgoing" ? (
                        <UIBadge
                          variant="soft"
                          color={
                            ret.returnMotive === "SELLABLE"
                              ? "primary"
                              : ret.returnMotive === "EXPIRED"
                              ? "warning"
                              : "error"
                          }
                        >
                          {ret.returnMotive}
                        </UIBadge>
                      ) : (
                        <div className="font-medium text-xs text-text truncate max-w-44">
                          {supplier.businessName || "Supplier"}
                        </div>
                      )}
                    </UITableCell>

                    {/* Column 5: Items count (Outgoing) or Boxes (Incoming) */}
                    <UITableCell className="py-3.5 px-4 text-center font-bold text-xs">
                      {direction === "outgoing" ? (
                        itemCount
                      ) : (
                        <UIBadge variant="soft" color="primary">
                          {shipping.boxCount || 1} {shipping.boxCount === 1 ? "Box" : "Boxes"}
                        </UIBadge>
                      )}
                    </UITableCell>

                    {/* Column 6: Debit Total */}
                    <UITableCell className="py-3.5 px-4 text-right font-mono font-bold text-xs text-primary">
                      ₹{formatCurrency(ret.grandTotal)}
                    </UITableCell>

                    {/* Column 7: Transit Status */}
                    <UITableCell className="py-3.5 px-4 text-center">
                      <UIBadge
                        variant="soft"
                        color={
                          shipping.transitStatus === "RECEIVED"
                            ? "success"
                            : shipping.transitStatus === "IN_TRANSIT"
                            ? shipping.destinationType === "SUPPLIER"
                              ? "primary"
                              : "warning"
                            : "default"
                        }
                        title={
                          shipping.courierName || shipping.trackingNo
                            ? [
                                shipping.courierName ? `Courier: ${shipping.courierName}` : "",
                                shipping.trackingNo ? `LR/AWB: ${shipping.trackingNo}` : "",
                              ]
                                .filter(Boolean)
                                .join(" • ")
                            : undefined
                        }
                      >
                        {shipping.transitStatus === "IN_TRANSIT"
                          ? shipping.destinationType === "SUPPLIER"
                            ? "Dispatched to Supplier"
                            : "In Transit"
                          : shipping.transitStatus === "RECEIVED"
                          ? "Received"
                          : "Not Dispatched"}
                      </UIBadge>
                    </UITableCell>

                    {/* Column 8: Status */}
                    <UITableCell className="py-3.5 px-4 text-center">
                      <UIStatusIndicator
                        status={
                          ret.status === "CONFIRMED"
                            ? "success"
                            : ret.status === "CANCELLED"
                            ? "error"
                            : "draft"
                        }
                        label={ret.status}
                        variant="badge"
                        size="xs"
                        pulse={ret.status === "CONFIRMED"}
                      />
                    </UITableCell>

                    {/* Column 9: Action */}
                    <UITableCell
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        {direction === "incoming" && shipping.transitStatus === "IN_TRANSIT" && (
                          <UIButton
                            variant="primary"
                            size="xs"
                            onClick={(e) => handleReceiveBox(ret, e)}
                            disabled={isReceiving}
                            startIcon={
                              isReceiving ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="size-3.5" />
                              )
                            }
                            className="font-bold shadow-2xs px-2.5"
                          >
                            {isReceiving ? "Receiving..." : "Receive Box"}
                          </UIButton>
                        )}

                        <UIButton
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenPreview(ret)}
                          startIcon={<Eye className="size-3.5" />}
                          title="View & Print Debit Note"
                        >
                          View
                        </UIButton>
                      </div>
                    </UITableCell>
                  </UITableRow>
                );
              })
            )}
          </UITableBody>
        </UITable>

        {hasMore && (
          <div className="p-4 border-t border-border flex justify-center">
            <UIButton
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? "Loading more..." : "Load More"}
            </UIButton>
          </div>
        )}
      </div>

      {/* 6. Details & Printable Debit Note Modal */}
      <PurchaseReturnDetailsModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        purchaseReturn={selectedReturn}
        onUpdated={(updated) => {
          setSelectedReturn(updated);
          fetchReturns(page, false);
        }}
      />
    </div>
  );
};

export default PurchaseReturnsDesktopPage;
