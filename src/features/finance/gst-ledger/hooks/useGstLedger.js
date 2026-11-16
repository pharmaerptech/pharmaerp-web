import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useBranch from "@/features/branch/hooks/useBranch";
import gstLedgerService from "../services/gstLedgerService";
import { isCreditNoteEntry } from "../utils/gstr1SummaryCalculator";

export const useGstLedger = (type = "GSTR-1") => {
  const { currentBranch, branches = [], getCompanyBranches } = useBranch();

  const PAGE_LIMIT = 10;
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [serverStats, setServerStats] = useState(null);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    search: "",
    branchId: currentBranch?._id || "all",
  });

  const hasUserScrolledRef = useRef(false);

  useEffect(() => {
    const markScrolled = () => {
      hasUserScrolledRef.current = true;
    };
    window.addEventListener("wheel", markScrolled, { passive: true });
    window.addEventListener("touchmove", markScrolled, { passive: true });
    return () => {
      window.removeEventListener("wheel", markScrolled);
      window.removeEventListener("touchmove", markScrolled);
    };
  }, []);

  const handleTableScroll = useCallback(() => {
    hasUserScrolledRef.current = true;
  }, []);

  // Ensure branches are loaded if needed
  useEffect(() => {
    if (getCompanyBranches && (!branches || branches.length === 0)) {
      getCompanyBranches().catch(() => {});
    }
  }, [getCompanyBranches, branches]);

  // Keep branchId filter synced if currentBranch changes and no explicit branch selection was made
  useEffect(() => {
    if (currentBranch?._id) {
      setFilters((prev) => {
        if (prev.branchId === "all") {
          return { ...prev, branchId: currentBranch._id };
        }
        return prev;
      });
    }
  }, [currentBranch?._id]);

  // Fetch initial batch (Page 1) or refresh on filter change
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    hasUserScrolledRef.current = false;

    try {
      const params = {
        page: 1,
        limit: PAGE_LIMIT,
        ...filters,
      };

      // Remove empty params
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      if (params.branchId === "all") delete params.branchId;
      if (params.companyId === "all") delete params.companyId;
      if (params.branchId === "all") delete params.branchId;
      if (params.companyId === "all") delete params.companyId;

      const response =
        type === "GSTR-1"
          ? await gstLedgerService.getGstr1Ledger(params)
          : await gstLedgerService.getGstr2Ledger(params);

      const data = response?.data?.data || response?.data || {};
      const fetchedEntries = data.entries || [];
      const totalCount = data.total !== undefined ? data.total : fetchedEntries.length;

      setEntries(fetchedEntries);
      setTotal(totalCount);
      setPage(1);
      setHasMore(fetchedEntries.length < totalCount);

      if (data.stats) {
        setServerStats(data.stats);
      }
    } catch (err) {
      console.error(`Error fetching ${type} ledger entries:`, err);
      setError(
        err?.response?.data?.message || err.message || `Failed to fetch ${type} records`
      );
      setEntries([]);
      setTotal(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [type, filters]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Load next batch via Infinite Scroll
  const loadMore = useCallback(async () => {
    if (loading || isLoadingMore || !hasMore || !hasUserScrolledRef.current) return;

    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const params = {
        page: nextPage,
        limit: PAGE_LIMIT,
        ...filters,
      };

      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      if (params.branchId === "all") delete params.branchId;
      if (params.companyId === "all") delete params.companyId;

      const response =
        type === "GSTR-1"
          ? await gstLedgerService.getGstr1Ledger(params)
          : await gstLedgerService.getGstr2Ledger(params);

      const data = response?.data?.data || response?.data || {};
      const newEntries = data.entries || [];
      const totalCount = data.total !== undefined ? data.total : total;

      if (newEntries.length > 0) {
        setEntries((prev) => {
          const existingIds = new Set(prev.map((e) => e._id));
          const filteredNew = newEntries.filter((e) => !existingIds.has(e._id));
          const combined = [...prev, ...filteredNew];
          setHasMore(combined.length < totalCount);
          return combined;
        });
        setPage(nextPage);
        setTotal(totalCount);
      } else {
        setHasMore(false);
      }

      if (data.stats) {
        setServerStats(data.stats);
      }
    } catch (err) {
      console.error(`Error loading more ${type} entries:`, err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [type, loading, isLoadingMore, hasMore, total, page, filters]);

  const round2 = (val) => Math.round((Number(val || 0) + Number.EPSILON) * 100) / 100;

  const isDeductionEntry = (entry, ledgerType) => {
    if (!entry) return false;
    if (ledgerType === "GSTR-2") {
      const group = String(entry.groupDescription || "").toUpperCase();
      const narration = String(entry.narration || "").toUpperCase();
      const vNum = String(entry.voucherNumber || "").toUpperCase();
      return (
        group.includes("DEBIT NOTE") ||
        narration.includes("DEBIT NOTE") ||
        narration.includes("PURCHASE RETURN") ||
        vNum.startsWith("PR-") ||
        vNum.startsWith("DN-")
      );
    }
    return isCreditNoteEntry(entry);
  };

  const stats = useMemo(() => {
    if (serverStats && serverStats.grossTaxable !== undefined) {
      return serverStats;
    }
    return entries.reduce(
      (acc, curr) => {
        const isCredit = isDeductionEntry(curr, type);
        const factor = isCredit ? -1 : 1;
        const taxable = Number(curr.taxableAmount || 0);
        const cgst = Number(curr.cgst || 0);
        const sgst = Number(curr.sgst || 0);
        const igst = Number(curr.igst || 0);
        const gst = cgst + sgst + igst;
        const amt = Number(curr.totalAmount || 0);

        acc.totalTaxable = round2(acc.totalTaxable + factor * taxable);
        acc.totalCgst = round2(acc.totalCgst + factor * cgst);
        acc.totalSgst = round2(acc.totalSgst + factor * sgst);
        acc.totalIgst = round2(acc.totalIgst + factor * igst);
        acc.totalGst = round2(acc.totalGst + factor * gst);
        acc.totalAmount = round2(acc.totalAmount + factor * amt);

        if (isCredit) {
          acc.creditNoteCount += 1;
          acc.creditTaxable = round2(acc.creditTaxable + taxable);
          acc.creditCgst = round2(acc.creditCgst + cgst);
          acc.creditSgst = round2(acc.creditSgst + sgst);
          acc.creditIgst = round2(acc.creditIgst + igst);
          acc.creditGst = round2(acc.creditGst + gst);
          acc.creditTotalAmount = round2(acc.creditTotalAmount + amt);
        } else {
          acc.invoiceCount += 1;
          acc.grossTaxable = round2(acc.grossTaxable + taxable);
          acc.grossCgst = round2(acc.grossCgst + cgst);
          acc.grossSgst = round2(acc.grossSgst + sgst);
          acc.grossIgst = round2(acc.grossIgst + igst);
          acc.grossGst = round2(acc.grossGst + gst);
          acc.grossTotalAmount = round2(acc.grossTotalAmount + amt);
        }
        return acc;
      },
      {
        totalTaxable: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        totalGst: 0,
        totalAmount: 0,
        count: total || entries.length,
        invoiceCount: 0,
        creditNoteCount: 0,
        grossTaxable: 0,
        grossCgst: 0,
        grossSgst: 0,
        grossIgst: 0,
        grossGst: 0,
        grossTotalAmount: 0,
        creditTaxable: 0,
        creditCgst: 0,
        creditSgst: 0,
        creditIgst: 0,
        creditGst: 0,
        creditTotalAmount: 0,
      }
    );
  }, [entries, total, serverStats, type]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      search: "",
      branchId: currentBranch?._id || "all",
    });
  };

  const exportToCsv = async () => {
    let exportRows = entries;
    try {
      const params = { all: true, ...filters };
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      if (params.branchId === "all") delete params.branchId;
      if (params.companyId === "all") delete params.companyId;
      const response =
        type === "GSTR-1"
          ? await gstLedgerService.getGstr1Ledger(params)
          : await gstLedgerService.getGstr2Ledger(params);
      const data = response?.data?.data || response?.data || {};
      if (Array.isArray(data.entries) && data.entries.length > 0) {
        exportRows = data.entries;
      }
    } catch {
      // fallback to loaded entries
    }

    if (!exportRows.length) return;

    const headers = [
      "Voucher Date",
      "Voucher No",
      "Branch",
      "GST Type",
      "Taxable Amount",
      "CGST",
      "SGST",
      "IGST",
      "Total Amount",
      "Narration",
    ];

    const rows = exportRows.map((e) => [
      e.voucherDate ? new Date(e.voucherDate).toLocaleDateString() : "-",
      `"${e.voucherNumber || ""}"`,
      `"${e.branchId?.name || "-"}"`,
      e.gstType || type,
      e.taxableAmount || 0,
      e.cgst || 0,
      e.sgst || 0,
      e.igst || 0,
      e.totalAmount || 0,
      `"${(e.narration || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${type.toLowerCase()}_records_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const createEntry = async (payload) => {
    try {
      const entryPayload = {
        ...payload,
        branchId: payload.branchId || (filters.branchId !== "all" ? filters.branchId : currentBranch?._id) || null,
      };

      if (type === "GSTR-1") {
        await gstLedgerService.createGstr1Ledger(entryPayload);
      } else {
        await gstLedgerService.createGstr2Ledger(entryPayload);
      }
      await fetchEntries();
      return { success: true };
    } catch (err) {
      console.error(`Error creating ${type} entry:`, err);
      const msg = err?.response?.data?.message || err.message || "Failed to create entry";
      return { success: false, error: msg };
    }
  };

  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (type !== "GSTR-1") return null;
    setSummaryLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      if (params.branchId === "all") delete params.branchId;
      if (params.companyId === "all") delete params.companyId;
      const response = await gstLedgerService.getGstr1Summary(params);
      const data = response?.data?.data || response?.data || null;
      setSummaryData(data);
      return data;
    } catch (err) {
      console.error("Error fetching GSTR-1 summary:", err);
      return null;
    } finally {
      setSummaryLoading(false);
    }
  }, [type, filters]);

  useEffect(() => {
    if (type === "GSTR-1") {
      fetchSummary();
    }
  }, [type, filters, fetchSummary]);

  return {
    entries,
    total,
    page,
    limit: PAGE_LIMIT,
    loading,
    isLoadingMore,
    hasMore,
    loadMore,
    handleTableScroll,
    error,
    filters,
    stats,
    branches,
    currentBranch,
    summaryData,
    summaryLoading,
    fetchSummary,
    setPage,
    handleFilterChange,
    handleResetFilters,
    refetch: fetchEntries,
    exportToCsv,
    createEntry,
  };
};

export default useGstLedger;
