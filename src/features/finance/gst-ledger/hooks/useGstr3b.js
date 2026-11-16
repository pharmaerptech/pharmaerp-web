import { useState, useEffect, useCallback, useMemo } from "react";
import useBranch from "@/features/branch/hooks/useBranch";
import useCompany from "@/features/company/hooks/useCompany";
import gstLedgerService from "../services/gstLedgerService";
import { calculateGstr3bSummary } from "../utils/gstr3bSummaryCalculator";
import * as XLSX from "xlsx";

export const FINANCIAL_YEARS = ["2026-27", "2025-26", "2024-25", "2023-24"];

export const getMonthsForFinancialYear = (fyString) => {
  const [startYearStr] = fyString.split("-");
  const startYear = parseInt(startYearStr, 10) || 2026;
  const nextYear = startYear + 1;

  return [
    { key: `${startYear}-04`, label: `April ${startYear}`, month: 4, year: startYear },
    { key: `${startYear}-05`, label: `May ${startYear}`, month: 5, year: startYear },
    { key: `${startYear}-06`, label: `June ${startYear}`, month: 6, year: startYear },
    { key: `${startYear}-07`, label: `July ${startYear}`, month: 7, year: startYear },
    { key: `${startYear}-08`, label: `August ${startYear}`, month: 8, year: startYear },
    { key: `${startYear}-09`, label: `September ${startYear}`, month: 9, year: startYear },
    { key: `${startYear}-10`, label: `October ${startYear}`, month: 10, year: startYear },
    { key: `${startYear}-11`, label: `November ${startYear}`, month: 11, year: startYear },
    { key: `${startYear}-12`, label: `December ${startYear}`, month: 12, year: startYear },
    { key: `${nextYear}-01`, label: `January ${nextYear}`, month: 1, year: nextYear },
    { key: `${nextYear}-02`, label: `February ${nextYear}`, month: 2, year: nextYear },
    { key: `${nextYear}-03`, label: `March ${nextYear}`, month: 3, year: nextYear },
  ];
};

export const getDateRangeForPeriod = (periodKey) => {
  const [yearStr, monthStr] = periodKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)).toISOString();
  // Last day of month
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999)).toISOString();

  return { startDate, endDate };
};

export const useGstr3b = () => {
  const { currentBranch, branches = [], getCompanyBranches } = useBranch();
  const { currentCompany } = useCompany();

  const [selectedFy, setSelectedFy] = useState("2026-27");
  const returnPeriods = useMemo(() => getMonthsForFinancialYear(selectedFy), [selectedFy]);

  // Default to September of current FY or first month
  const [selectedPeriod, setSelectedPeriod] = useState("2026-09");
  const [branchId, setBranchId] = useState(currentBranch?._id || "all");
  const [companyId, setCompanyId] = useState("all");

  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Drilldown modal state
  const [drillDownData, setDrillDownData] = useState(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

  useEffect(() => {
    if (getCompanyBranches && (!branches || branches.length === 0)) {
      getCompanyBranches().catch(() => {});
    }
  }, [getCompanyBranches, branches]);

  useEffect(() => {
    if (currentBranch?._id && branchId === "all") {
      setBranchId(currentBranch._id);
    }
  }, [currentBranch?._id]);

  // Ensure selectedPeriod is valid when FY changes
  useEffect(() => {
    const valid = returnPeriods.some((p) => p.key === selectedPeriod);
    if (!valid && returnPeriods.length > 0) {
      setSelectedPeriod(returnPeriods[5]?.key || returnPeriods[0]?.key);
    }
  }, [selectedFy, returnPeriods, selectedPeriod]);

  const activePeriodObj = useMemo(() => {
    return returnPeriods.find((p) => p.key === selectedPeriod) || returnPeriods[0];
  }, [returnPeriods, selectedPeriod]);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { startDate, endDate } = getDateRangeForPeriod(selectedPeriod);
    const params = {
      startDate,
      endDate,
      branchId: branchId === "all" ? undefined : branchId,
      companyId: companyId === "all" ? undefined : companyId,
      fy: selectedFy,
      returnPeriod: selectedPeriod,
    };

    try {
      // 1. Attempt dedicated GSTR-3B backend summary endpoint
      try {
        const response = await gstLedgerService.getGstr3bSummary(params);
        const data = response?.data?.data || response?.data;
        if (data && data.section31 && data.section4) {
          setSummaryData(data);
          return data;
        }
      } catch (err) {
        console.warn("Backend GSTR-3B summary endpoint fallback to client-side calculation:", err);
      }

      // 2. Fallback: Fetch raw GSTR-1 and GSTR-2 entries and calculate in client
      const [gstr1Res, gstr2Res] = await Promise.all([
        gstLedgerService.getGstr1Ledger({ ...params, all: true }),
        gstLedgerService.getGstr2Ledger({ ...params, all: true }),
      ]);

      const gstr1Entries = gstr1Res?.data?.data?.entries || gstr1Res?.data?.entries || [];
      const gstr2Entries = gstr2Res?.data?.data?.entries || gstr2Res?.data?.entries || [];

      const calculated = calculateGstr3bSummary(gstr1Entries, gstr2Entries, {
        companyGstin: currentCompany?.gstin || "",
      });

      setSummaryData(calculated);
      return calculated;
    } catch (fallbackErr) {
      console.error("Error calculating GSTR-3B summary:", fallbackErr);
      setError("Failed to load GSTR-3B summary. Please check connection and retry.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, selectedFy, branchId, companyId, currentCompany?.gstin]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const openDrillDown = useCallback((rowItem) => {
    if (!rowItem) return;
    setDrillDownData(rowItem);
    setIsDrillDownOpen(true);
  }, []);

  const closeDrillDown = useCallback(() => {
    setIsDrillDownOpen(false);
    setDrillDownData(null);
  }, []);

  // Export to Excel
  const exportToExcel = useCallback(() => {
    if (!summaryData) return;

    const wb = XLSX.utils.book_new();

    // 1. Summary Cards Sheet
    const cardsData = [
      ["GSTR-3B GST Summary Return", ""],
      ["Company", currentCompany?.name || "Company"],
      ["GSTIN", currentCompany?.gstin || "-"],
      ["Financial Year", selectedFy],
      ["Return Period", activePeriodObj?.label || selectedPeriod],
      ["Branch", branches.find((b) => b._id === branchId)?.name || "All Branches"],
      ["Generated At", new Date().toLocaleString("en-IN")],
      [],
      ["Metric", "Total Value (₹)", "IGST (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)"],
      [
        "Total Taxable Outward Supplies",
        summaryData.summaryCards?.totalTaxableOutward?.value || 0,
        summaryData.summaryCards?.totalTaxableOutward?.igst || 0,
        summaryData.summaryCards?.totalTaxableOutward?.cgst || 0,
        summaryData.summaryCards?.totalTaxableOutward?.sgst || 0,
        summaryData.summaryCards?.totalTaxableOutward?.cess || 0,
      ],
      [
        "Output GST Liability",
        summaryData.summaryCards?.outputGst?.value || 0,
        summaryData.summaryCards?.outputGst?.igst || 0,
        summaryData.summaryCards?.outputGst?.cgst || 0,
        summaryData.summaryCards?.outputGst?.sgst || 0,
        summaryData.summaryCards?.outputGst?.cess || 0,
      ],
      [
        "Eligible ITC",
        summaryData.summaryCards?.eligibleItc?.value || 0,
        summaryData.summaryCards?.eligibleItc?.igst || 0,
        summaryData.summaryCards?.eligibleItc?.cgst || 0,
        summaryData.summaryCards?.eligibleItc?.sgst || 0,
        summaryData.summaryCards?.eligibleItc?.cess || 0,
      ],
      [
        "ITC Reversal",
        summaryData.summaryCards?.itcReversal?.value || 0,
        summaryData.summaryCards?.itcReversal?.igst || 0,
        summaryData.summaryCards?.itcReversal?.cgst || 0,
        summaryData.summaryCards?.itcReversal?.sgst || 0,
        summaryData.summaryCards?.itcReversal?.cess || 0,
      ],
      [
        "Net ITC Available",
        summaryData.summaryCards?.netItc?.value || 0,
        summaryData.summaryCards?.netItc?.igst || 0,
        summaryData.summaryCards?.netItc?.cgst || 0,
        summaryData.summaryCards?.netItc?.sgst || 0,
        summaryData.summaryCards?.netItc?.cess || 0,
      ],
      [
        "Net GST Liability (Cash Payable)",
        summaryData.summaryCards?.netGstLiability?.value || 0,
        summaryData.summaryCards?.netGstLiability?.igst || 0,
        summaryData.summaryCards?.netGstLiability?.cgst || 0,
        summaryData.summaryCards?.netGstLiability?.sgst || 0,
        summaryData.summaryCards?.netGstLiability?.cess || 0,
      ],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(cardsData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary Overview");

    // 2. Section 3.1 Sheet
    const sec31Rows = [
      ["3.1 Details of outward supplies and inward supplies liable to reverse charge"],
      [],
      ["Code", "Particulars", "Taxable Value (₹)", "IGST (₹)", "CGST (₹)", "SGST/UTGST (₹)", "Cess (₹)", "Total Tax (₹)"],
      ...(summaryData.section31?.rows || []).map((r) => [
        r.code,
        r.description,
        r.taxable,
        r.igst,
        r.cgst,
        r.sgst,
        r.cess,
        r.totalTax,
      ]),
      [
        summaryData.section31?.total?.code || "Total",
        summaryData.section31?.total?.description || "Total",
        summaryData.section31?.total?.taxable || 0,
        summaryData.section31?.total?.igst || 0,
        summaryData.section31?.total?.cgst || 0,
        summaryData.section31?.total?.sgst || 0,
        summaryData.section31?.total?.cess || 0,
        summaryData.section31?.total?.totalTax || 0,
      ],
    ];
    const wsSec31 = XLSX.utils.aoa_to_sheet(sec31Rows);
    XLSX.utils.book_append_sheet(wb, wsSec31, "Section 3.1 Outward");

    // 3. Section 4 ITC Sheet
    const sec4Rows = [
      ["4. Eligible ITC & Reversals"],
      [],
      ["Code", "Details", "IGST (₹)", "CGST (₹)", "SGST/UTGST (₹)", "Cess (₹)", "Total ITC (₹)"],
      ["--", "(A) ITC Available", "", "", "", "", ""],
      ...(summaryData.section4?.available?.rows || []).map((r) => [
        r.code,
        r.description,
        r.igst,
        r.cgst,
        r.sgst,
        r.cess,
        r.totalItc,
      ]),
      [
        summaryData.section4?.available?.total?.code || "4(A)",
        summaryData.section4?.available?.total?.description || "Total Available ITC",
        summaryData.section4?.available?.total?.igst || 0,
        summaryData.section4?.available?.total?.cgst || 0,
        summaryData.section4?.available?.total?.sgst || 0,
        summaryData.section4?.available?.total?.cess || 0,
        summaryData.section4?.available?.total?.totalItc || 0,
      ],
      [],
      ["--", "(B) ITC Reversed", "", "", "", "", ""],
      ...(summaryData.section4?.reversed?.rows || []).map((r) => [
        r.code,
        r.description,
        r.igst,
        r.cgst,
        r.sgst,
        r.cess,
        r.totalItc,
      ]),
      [
        summaryData.section4?.reversed?.total?.code || "4(B)",
        summaryData.section4?.reversed?.total?.description || "Total Reversed ITC",
        summaryData.section4?.reversed?.total?.igst || 0,
        summaryData.section4?.reversed?.total?.cgst || 0,
        summaryData.section4?.reversed?.total?.sgst || 0,
        summaryData.section4?.reversed?.total?.cess || 0,
        summaryData.section4?.reversed?.total?.totalItc || 0,
      ],
      [],
      [
        "4(C)",
        "(C) Net ITC Available (A) - (B)",
        summaryData.section4?.netItc?.igst || 0,
        summaryData.section4?.netItc?.cgst || 0,
        summaryData.section4?.netItc?.sgst || 0,
        summaryData.section4?.netItc?.cess || 0,
        summaryData.section4?.netItc?.totalItc || 0,
      ],
    ];
    const wsSec4 = XLSX.utils.aoa_to_sheet(sec4Rows);
    XLSX.utils.book_append_sheet(wb, wsSec4, "Section 4 ITC");

    // 4. Tax Liability & Utilization Sheet
    const liabRows = [
      ["5/6. Tax Liability and Utilization Breakdown"],
      [],
      ["Description", "IGST (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Total (₹)"],
      [
        "Output Tax Liability",
        summaryData.taxLiability?.outputTax?.igst || 0,
        summaryData.taxLiability?.outputTax?.cgst || 0,
        summaryData.taxLiability?.outputTax?.sgst || 0,
        summaryData.taxLiability?.outputTax?.cess || 0,
        summaryData.taxLiability?.outputTax?.total || 0,
      ],
      [
        "Reverse Charge Liability (RCM)",
        summaryData.taxLiability?.rcmTax?.igst || 0,
        summaryData.taxLiability?.rcmTax?.cgst || 0,
        summaryData.taxLiability?.rcmTax?.sgst || 0,
        summaryData.taxLiability?.rcmTax?.cess || 0,
        summaryData.taxLiability?.rcmTax?.total || 0,
      ],
      [
        "Total Tax Liability",
        summaryData.taxLiability?.totalLiability?.igst || 0,
        summaryData.taxLiability?.totalLiability?.cgst || 0,
        summaryData.taxLiability?.totalLiability?.sgst || 0,
        summaryData.taxLiability?.totalLiability?.cess || 0,
        summaryData.taxLiability?.totalLiability?.total || 0,
      ],
      [
        "Less: Paid Through ITC (Rule 88A)",
        summaryData.taxLiability?.itcUtilized?.igst || 0,
        summaryData.taxLiability?.itcUtilized?.cgst || 0,
        summaryData.taxLiability?.itcUtilized?.sgst || 0,
        summaryData.taxLiability?.itcUtilized?.cess || 0,
        summaryData.taxLiability?.itcUtilized?.total || 0,
      ],
      [
        "Net Tax Payable in Cash",
        summaryData.taxLiability?.cashPayable?.igst || 0,
        summaryData.taxLiability?.cashPayable?.cgst || 0,
        summaryData.taxLiability?.cashPayable?.sgst || 0,
        summaryData.taxLiability?.cashPayable?.cess || 0,
        summaryData.taxLiability?.cashPayable?.total || 0,
      ],
      [],
      ["Closing ITC Balance (Carried Forward)", ""],
      [
        "Balance ITC",
        summaryData.taxLiability?.closingItcBalance?.igst || 0,
        summaryData.taxLiability?.closingItcBalance?.cgst || 0,
        summaryData.taxLiability?.closingItcBalance?.sgst || 0,
        summaryData.taxLiability?.closingItcBalance?.cess || 0,
        summaryData.taxLiability?.closingItcBalance?.total || 0,
      ],
    ];
    const wsLiab = XLSX.utils.aoa_to_sheet(liabRows);
    XLSX.utils.book_append_sheet(wb, wsLiab, "Tax Payment & Set-Off");

    const fileName = `GSTR-3B_${selectedFy}_${selectedPeriod}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [summaryData, currentCompany, selectedFy, selectedPeriod, activePeriodObj, branchId, branches]);

  // Export to PDF
  const exportToPdf = useCallback(() => {
    window.print();
  }, []);

  return {
    financialYears: FINANCIAL_YEARS,
    selectedFy,
    setSelectedFy,
    returnPeriods,
    selectedPeriod,
    setSelectedPeriod,
    activePeriodObj,
    branches,
    branchId,
    setBranchId,
    companyId,
    setCompanyId,
    currentBranch,
    summaryData,
    loading,
    error,
    refetch: fetchSummary,
    drillDownData,
    isDrillDownOpen,
    openDrillDown,
    closeDrillDown,
    exportToExcel,
    exportToPdf,
  };
};

export default useGstr3b;
