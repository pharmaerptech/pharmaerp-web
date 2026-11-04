import { useState, useEffect, useMemo, useRef } from "react";
import {
  Banknote,
  QrCode,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Percent,
  PlusCircle,
  MinusCircle,
  Calculator,
  Trash2,
  Receipt,
  User,
  RotateCcw,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getOpenBusinessDay } from "@/features/operations/business-days/store/businessDayThunk";
import { UIModal, UIButton, UIIconButton, UISelect } from "@/components/ui";
import { PermissionGate } from "@/components/common/PermissionGate";
import usePaymentQr from "@/features/finance/treasury/payment-qr/hooks/usePaymentQr";
import { useBranchCash } from "@/features/finance/treasury/cash-management/branch-cash/hooks/useBranchCash";
import useBranch from "@/features/branch/hooks/useBranch";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import { CashBreakdownModal, decomposeAmount } from "./CashBreakdownModal";
import { getBranchInitials } from "@/utils";
import invoiceService from "../services/invoiceService";
import customerService from "@/features/parties/customers/services/customerService";
import creditNoteService from "@/features/sales/credit-notes/services/creditNoteService";

/** Safe number parser */
const safeNum = (v) => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

/** Compute scheme discount threshold check. */
const computeSchemeDiscount = (qty, schemePercent) => {
  const normalizedQty = safeNum(qty);
  const normalizedScheme = safeNum(schemePercent);
  if (normalizedQty <= 0 || normalizedScheme <= 0) {
    return { schemeApply: false, finalDiscountPercent: 0 };
  }
  if (normalizedScheme === 50) {
    if (normalizedQty < 2) return { schemeApply: false, finalDiscountPercent: 0 };
    return { schemeApply: true, finalDiscountPercent: normalizedScheme };
  }
  const fullFreeQty = (normalizedQty * normalizedScheme) / (100 - normalizedScheme);
  const quarterThreshold = (normalizedScheme / (100 - normalizedScheme)) / 0.4;
  if (fullFreeQty >= quarterThreshold) {
    return { schemeApply: true, finalDiscountPercent: normalizedScheme };
  }
  return { schemeApply: false, finalDiscountPercent: 0 };
};

/**
 * Intelligently balances payments so that total equals grandTotal.
 * When `targetIndex` is set to `desiredAmount`, any excess over grandTotal
 * is deducted from other payment legs (prioritizing the row directly above, then cash/upi/card).
 */
const rebalancePaymentsOnUpdate = (currentPayments, targetIndex, desiredAmount, targetGrandTotal) => {
  const next = currentPayments.map((p) => ({ ...p }));
  const clampedDesired = Math.max(0, Number(desiredAmount) || 0);
  next[targetIndex].amount = clampedDesired;
  if (next[targetIndex].paymentType === "Cash") {
    next[targetIndex].cashDetails = null;
  }

  // Calculate total across all rows
  let currentTotal = next.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  let excess = Math.round((currentTotal - targetGrandTotal) * 100) / 100;

  if (excess > 0.005) {
    // Priority for reduction:
    // 1. First look at row directly above targetIndex
    // 2. Then other non-target rows
    const otherIndices = [];
    if (targetIndex > 0) otherIndices.push(targetIndex - 1);
    for (let i = 0; i < next.length; i++) {
      if (i !== targetIndex && !otherIndices.includes(i)) {
        otherIndices.push(i);
      }
    }

    for (const idx of otherIndices) {
      if (excess <= 0.005) break;
      const availableInRow = Number(next[idx].amount) || 0;
      if (availableInRow <= 0) continue;

      const deduction = Math.min(availableInRow, excess);
      next[idx].amount = Math.round((availableInRow - deduction) * 100) / 100;
      if (next[idx].paymentType === "Cash") {
        next[idx].cashDetails = null;
      }
      excess = Math.round((excess - deduction) * 100) / 100;
    }

    // If there is still excess (i.e. even reducing all other rows to 0 wasn't enough),
    // clamp the target row itself to targetGrandTotal!
    if (excess > 0.005) {
      next[targetIndex].amount = Math.max(0, Math.round((next[targetIndex].amount - excess) * 100) / 100);
      if (next[targetIndex].paymentType === "Cash") {
        next[targetIndex].cashDetails = null;
      }
    }
  }

  return next;
};

const PAYMENT_TYPE_OPTIONS = [
  { value: "Cash", label: "Cash", icon: <Banknote className="size-4 text-emerald-600" /> },
  { value: "UPI", label: "UPI / QR", icon: <QrCode className="size-4 text-purple-600" /> },
  { value: "Credit", label: "Credit (Pay Later)", icon: <Receipt className="size-4 text-rose-600" /> },
  { value: "Advance", label: "Advance Deposit", icon: <Wallet className="size-4 text-amber-600" /> },
  { value: "CreditNote", label: "Credit Note", icon: <Receipt className="size-4 text-indigo-600" /> },
];

export const SalesCheckoutModal = ({
  isOpen,
  onClose,
  customer,
  customerPhone,
  doctor,
  doctorId,
  saleDate,
  billingMode = "B2C",
  cartSummary = {},
  onCompleteSale,
  activeShift: activeShiftProp,
  shiftId: shiftIdProp,
  existingInvoiceNo = null,
  isReturnInvoice = false,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentBranch } = useBranch();
  const branchId = currentBranch?._id || currentBranch?.id;
  const { paymentQrs, getPaymentQrs } = usePaymentQr();
  const { fetchBranchCash, runningCash, runningDenominations } = useBranchCash();
  const reduxActiveShift = useSelector((state) => state.shift?.activeShift);
  const activeShift = activeShiftProp ?? reduxActiveShift;
  const { openBusinessDay } = useSelector((state) => state.businessDay || {});

  const isShiftClosed = !activeShift || String(activeShift.status || "").toLowerCase() !== "open";
  // The business day is only considered closed if:
  // 1. openBusinessDay exists in state and its status is not open, OR
  // 2. openBusinessDay is missing/closed AND the cashier's activeShift is also closed
  const isBusinessDayClosed = openBusinessDay
    ? String(openBusinessDay.status || "").toLowerCase() !== "open"
    : isShiftClosed;
  const isSessionBlocked = isBusinessDayClosed || isShiftClosed;

  const hasReturnItems = useMemo(
    () => (cartSummary?.items || []).some((i) => i.isReturnItem),
    [cartSummary]
  );
  const isReturn = isReturnInvoice || hasReturnItems;

  useEffect(() => {
    if (isOpen && branchId) {
      getPaymentQrs({ branchId, status: "ACTIVE" });
      fetchBranchCash(branchId);
      if (!openBusinessDay) {
        dispatch(getOpenBusinessDay(branchId));
      }
    }
  }, [isOpen, branchId, getPaymentQrs, fetchBranchCash, dispatch, openBusinessDay]);

  // Branch-scoped serial invoice or return memo number (e.g. AEB-2627-0001 or RET-AEB-2627-0001)
  const defaultInvoiceNo = useMemo(() => {
    if (existingInvoiceNo) return existingInvoiceNo;
    const branchInitials = getBranchInitials(currentBranch);
    const dateObj = saleDate ? new Date(saleDate) : new Date();
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();
    const fyString = month >= 3
      ? `${year.toString().slice(-2)}${(year + 1).toString().slice(-2)}`
      : `${(year - 1).toString().slice(-2)}${year.toString().slice(-2)}`;
    return isReturn ? `RET-${branchInitials}-${fyString}-0001` : `${branchInitials}-${fyString}-0001`;
  }, [currentBranch, saleDate, existingInvoiceNo, isReturn]);

  const [nextInvoiceNo, setNextInvoiceNo] = useState("");

  useEffect(() => {
    if (existingInvoiceNo) return;
    if (!isOpen || !branchId) return;
    let isMounted = true;

    const fetchNumberPromise =
      isReturn && typeof invoiceService?.getNextReturnNumber === "function"
        ? invoiceService.getNextReturnNumber({
            branchId,
            date: saleDate ? new Date(saleDate).toISOString() : new Date().toISOString(),
          })
        : typeof invoiceService?.getNextInvoiceNumber === "function"
        ? invoiceService.getNextInvoiceNumber({
            branchId,
            date: saleDate ? new Date(saleDate).toISOString() : new Date().toISOString(),
          })
        : Promise.resolve({});

    fetchNumberPromise
      .then((res) => {
        const fetchedNo =
          res?.data?.data?.nextReturnNumber ||
          res?.data?.data?.nextReturnNo ||
          res?.data?.data?.nextInvoiceNo ||
          res?.data?.data?.nextInvoiceNumber ||
          res?.data?.nextInvoiceNo ||
          res?.data?.nextInvoiceNumber;
        if (isMounted && fetchedNo) {
          setNextInvoiceNo(fetchedNo);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch next number:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen, branchId, saleDate, existingInvoiceNo, isReturn]);

  const displayInvoiceNo = existingInvoiceNo || nextInvoiceNo || defaultInvoiceNo;

  // Main operating cash counter (Branch Running Cash)
  const availableCash = useMemo(() => {
    return runningCash || 0;
  }, [runningCash]);

  // Filter QRs strictly for the current branch
  const branchQrs = useMemo(() => {
    if (!paymentQrs || !branchId) return [];
    return paymentQrs.filter((q) => {
      const qBranchId = q.branchId?._id || q.branchId?.id || q.branchId;
      return !qBranchId || String(qBranchId) === String(branchId);
    });
  }, [paymentQrs, branchId]);

  // Primary QR — pre-selected for UPI payments (zero friction for cashier)
  const primaryQr = useMemo(() => {
    if (!branchQrs || branchQrs.length === 0) return null;
    return branchQrs.find((q) => q.isPrimary && q.status === "ACTIVE") ||
           branchQrs.find((q) => q.status === "ACTIVE") ||
           branchQrs[0] || null;
  }, [branchQrs]);

  const upiOptions = useMemo(() => {
    const activeList = (branchQrs || []).filter((q) => q.status === "ACTIVE");
    if (activeList.length === 0) {
      return [{ value: "", label: "No active UPI QR configured for this branch", disabled: true }];
    }
    return activeList.map((qr) => ({
      value: String(qr._id),
      label: qr.label ? `${qr.label} (${qr.upiId})${qr.isPrimary ? " ★" : ""}` : qr.upiId,
      icon: <QrCode className="size-3.5 text-purple-600" />,
    }));
  }, [branchQrs]);

  const [discountPercent, setDiscountPercent] = useState(customer?.defaultDiscount || 0);
  const [notes, setNotes] = useState("");

  // Real-time Customer Credit & Advance profile
  const [customerDetails, setCustomerDetails] = useState(null);
  const [customerCreditNotes, setCustomerCreditNotes] = useState([]);

  useEffect(() => {
    const custId = customer?._id || customer?.id;
    if (isOpen && custId) {
      let isMounted = true;
      customerService
        .getCustomerById(custId)
        .then((res) => {
          if (isMounted) {
            setCustomerDetails(res?.data?.data || res?.data || null);
          }
        })
        .catch(() => {});

      creditNoteService
        .getCustomerCreditNotes(custId)
        .then((res) => {
          if (isMounted) {
            const raw = res?.data?.data ?? res?.data;
            const list = Array.isArray(raw)
              ? raw
              : Array.isArray(raw?.activeNotes)
              ? raw.activeNotes
              : Array.isArray(raw?.creditNotes)
              ? raw.creditNotes
              : [];
            setCustomerCreditNotes(list);
          }
        })
        .catch(() => {
          if (isMounted) setCustomerCreditNotes([]);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setCustomerDetails(null);
      setCustomerCreditNotes([]);
    }
  }, [isOpen, customer?._id, customer?.id]);

  const effectiveCustomer = customerDetails || customer;
  const isWalkIn = Boolean(
    effectiveCustomer?.isWalkIn ||
    effectiveCustomer?.customerType === "walk_in" ||
    customer?.isWalkIn ||
    customer?.customerType === "walk_in" ||
    (customer?.name && customer.name.toLowerCase().includes("walk-in"))
  );
  const creditLimit = Number(effectiveCustomer?.creditLimit || 0);
  const creditOutstanding = Number(effectiveCustomer?.creditOutstanding || 0);
  const availableCredit = Number(
    effectiveCustomer?.availableCredit !== undefined
      ? effectiveCustomer.availableCredit
      : Math.max(0, creditLimit - creditOutstanding)
  );
  const advanceBalance = Number(effectiveCustomer?.advanceBalance || 0);
  const creditNoteBalance = Number(
    effectiveCustomer?.creditNoteBalance !== undefined
      ? effectiveCustomer.creditNoteBalance
      : customerCreditNotes.reduce((s, cn) => s + (Number(cn.balanceAmount) || 0), 0)
  );
  const creditDays = Number(effectiveCustomer?.creditDays || 15);

  // Detailed Billing & Tax Calculations
  const items = cartSummary?.items || [];
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * Math.max(1, Number(item.qty) || 1), 0);
  const isB2B = billingMode === "B2B";

  const itemDiscount = items.reduce((sum, item) => {
    return sum + ((Number(item.price) || 0) * Math.max(1, Number(item.qty) || 1) * (Number(item.disc) || 0)) / 100;
  }, 0);

  const schemeDiscount = isB2B ? items.reduce((sum, item) => {
    if (!item?.schemeDiscountPercent) return sum;
    const rate = Number(item.price) || 0;
    const qty = Math.max(1, Number(item.qty) || 1);
    const schemePct = Number(item.schemeDiscountPercent) || 0;
    const schemeCheck = computeSchemeDiscount(qty, schemePct);
    if (!schemeCheck.schemeApply) return sum;
    return sum + (rate * qty * schemePct) / 100;
  }, 0) : 0;

  const subtotalAfterDiscounts = subtotal - itemDiscount - schemeDiscount;
  const extraDiscountAmt = (subtotalAfterDiscounts * (Number(discountPercent) || 0)) / 100;

  const gstSlabMap = {};
  items.forEach((item) => {
    const rate = Number(item.price) || 0;
    const qty = Math.max(1, Number(item.qty) || 1);
    const discPct = Number(item.disc) || 0;
    const rawSchemePct = isB2B ? (Number(item.schemeDiscountPercent) || 0) : 0;
    const schemeCheck = computeSchemeDiscount(qty, rawSchemePct);
    const schemePct = schemeCheck.schemeApply ? rawSchemePct : 0;
    const lineSubtotal = rate * qty * (1 - discPct / 100) * (1 - schemePct / 100);
    const lineFinal = lineSubtotal * (1 - (Number(discountPercent) || 0) / 100);
    const gstPct = Number(item.gst !== undefined && item.gst !== null ? item.gst : 5);

    let taxable, taxAmt;
    if (isB2B) {
      taxable = lineFinal;
      taxAmt = lineFinal * (gstPct / 100);
    } else {
      taxable = lineFinal / (1 + gstPct / 100);
      taxAmt = lineFinal - taxable;
    }
    const halfTax = taxAmt / 2;
    if (!gstSlabMap[gstPct]) gstSlabMap[gstPct] = { gstPct, taxable: 0, cgst: 0, sgst: 0, total: 0 };
    gstSlabMap[gstPct].taxable += taxable;
    gstSlabMap[gstPct].cgst += halfTax;
    gstSlabMap[gstPct].sgst += halfTax;
    gstSlabMap[gstPct].total += taxAmt;
  });

  const gstSlabs = Object.values(gstSlabMap).sort((a, b) => a.gstPct - b.gstPct);
  const totalTaxable = gstSlabs.reduce((acc, s) => acc + s.taxable, 0);
  const totalGst = gstSlabs.reduce((acc, s) => acc + s.total, 0);
  const exactGrandTotal = Math.max(0, totalTaxable + totalGst);
  const grandTotal = Math.round(exactGrandTotal);
  const roundOff = grandTotal - exactGrandTotal;

  // Multi-Row Payments State
  const [payments, setPayments] = useState([]);
  const [isSplitMode, setIsSplitMode] = useState(false);
  
  // Initialize payments ONLY when the modal transitions closed -> open.
  // Guarded by a ref so unstable prop/selector references can never cause a setState loop.
  const wasOpenRef = useRef(false);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const justOpened = isOpen && !wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (!justOpened) return;

    // Full reset on opening: never carry over previous bill amounts or denominations
    setIsSplitMode(false);
    setPayments([
      {
        id: Date.now(),
        paymentType: "Cash",
        amount: grandTotal,
        branchId: branchId || "",
        cashDetails: null,
      },
    ]);
    setDiscountPercent(customer?.defaultDiscount || 0);
    setNotes("");
    setErrorMessage(null);
    setCashBreakdownTarget(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Keep the single default cash row in sync when grandTotal changes (e.g. quantity adjustment, item addition/removal, extra discount).
  // Functional update returns `prev` when nothing changes, so this can't loop.
  useEffect(() => {
    if (!isOpen) return;
    setPayments((prev) => {
      if (prev.length !== 1) return prev;
      const row = prev[0];
      if (row.paymentType !== "Cash" || Number(row.amount) === grandTotal) return prev;
      return [{ ...row, amount: grandTotal, cashDetails: null }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grandTotal]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const [cashBreakdownTarget, setCashBreakdownTarget] = useState(null); // index of row

  const totalPaid = useMemo(
    () => Math.round(payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) * 100) / 100,
    [payments]
  );
  const balanceDiff = Math.round((grandTotal - totalPaid) * 100) / 100;
  const shortfall = Math.max(0, balanceDiff);
  const overpayment = Math.max(0, -balanceDiff);
  const isExactBalance = Math.abs(balanceDiff) <= 0.01;

  const handleAddOrFillPayment = (paymentType, fillAmount) => {
    setIsSplitMode(true);
    const existingIdx = payments.findIndex((p) => p.paymentType === paymentType);
    if (existingIdx >= 0) {
      const updatedPayments = [...payments];
      updatedPayments[existingIdx] = {
        ...updatedPayments[existingIdx],
        amount: Math.round(((Number(updatedPayments[existingIdx].amount) || 0) + fillAmount) * 100) / 100,
      };
      if (paymentType === "Cash") updatedPayments[existingIdx].cashDetails = null;
      setPayments(updatedPayments);
    } else {
      const newRow = {
        id: Date.now(),
        paymentType,
        amount: fillAmount,
        branchId: branchId || "",
      };
      if (paymentType === "UPI" && primaryQr?._id) {
        newRow.paymentQrId = String(primaryQr._id);
      }
      if (paymentType === "Credit") {
        const baseDate = saleDate ? new Date(saleDate) : new Date();
        const defaultDueDate = new Date(baseDate);
        defaultDueDate.setDate(defaultDueDate.getDate() + (creditDays || 15));
        newRow.creditDueDate = defaultDueDate.toISOString().split("T")[0];
      }
      setPayments([...payments, newRow]);
    }
    setErrorMessage(null);
  };


  const paymentTypeOptions = useMemo(() => {
    if (isReturn) {
      if (isWalkIn) {
        return [
          { value: "Cash", label: "Cash Refund", icon: <Banknote className="size-4 text-emerald-600" /> },
        ];
      }
      return [
        { value: "Cash", label: "Cash Refund", icon: <Banknote className="size-4 text-emerald-600" /> },
        { value: "CreditNote", label: "Issue Credit Note", icon: <Receipt className="size-4 text-indigo-600" /> },
      ];
    }
    if (isWalkIn) {
      return PAYMENT_TYPE_OPTIONS.filter((opt) => opt.value === "Cash" || opt.value === "UPI");
    }
    return PAYMENT_TYPE_OPTIONS;
  }, [isReturn, isWalkIn]);

  const handleUpdate = (index, field, value) => {
    const next = [...payments];
    const updated = { ...next[index], [field]: value };
    if (field === "paymentType" && value === "Cash") {
      updated.branchId = branchId || "";
      delete updated.paymentQrId;
      delete updated.creditDueDate;
      delete updated.creditNoteAllocations;
      updated.cashDetails = null;
    }
    // Auto-select primary QR when switching to UPI
    if (field === "paymentType" && value === "UPI") {
      if (!updated.paymentQrId && primaryQr?._id) {
        updated.paymentQrId = String(primaryQr._id);
      }
      delete updated.creditDueDate;
      delete updated.creditNoteAllocations;
    }
    if (field === "paymentType" && value === "Credit") {
      if (!updated.creditDueDate) {
        const baseDate = saleDate ? new Date(saleDate) : new Date();
        const defaultDueDate = new Date(baseDate);
        defaultDueDate.setDate(defaultDueDate.getDate() + (creditDays || 15));
        updated.creditDueDate = defaultDueDate.toISOString().split("T")[0];
      }
      delete updated.paymentQrId;
      delete updated.creditNoteAllocations;
    }
    if (field === "paymentType" && value === "Advance") {
      delete updated.paymentQrId;
      delete updated.creditDueDate;
      delete updated.creditNoteAllocations;
      delete updated.cashDetails;
      if (!effectiveCustomer?._id && !effectiveCustomer?.id) {
        setErrorMessage("Advance payment requires selecting a registered customer profile with available deposit.");
      } else {
        const available = Number(advanceBalance || 0);
        if (available <= 0) {
          setErrorMessage(`Customer "${effectiveCustomer?.name || "Customer"}" has no advance deposit available (Balance: ₹0.00).`);
        } else if (next.length === 1 && available < grandTotal) {
          // Smart auto-split: Maximum possible from advance deposit, remainder in cash
          setIsSplitMode(true);
          const remainder = Math.round((grandTotal - available) * 100) / 100;
          updated.amount = available;
          next[index] = updated;
          next.push({
            id: Date.now() + 1,
            paymentType: "Cash",
            amount: remainder,
            branchId: branchId || "",
            cashDetails: null,
          });
          setPayments(next);
          return;
        }
      }
    }
    if (field === "paymentType" && value === "Card") {
      delete updated.paymentQrId;
      delete updated.creditDueDate;
      delete updated.creditNoteAllocations;
    }
    if (field === "paymentType" && value === "CreditNote") {
      delete updated.paymentQrId;
      delete updated.creditDueDate;
      delete updated.cashDetails;
      if (isReturn) {
        updated.amount = grandTotal;
      } else {
        if (!effectiveCustomer?._id && !effectiveCustomer?.id) {
          setErrorMessage("Credit Note payment requires selecting a registered customer profile first.");
        } else {
          const available = Number(creditNoteBalance || 0);
          if (available <= 0) {
            setErrorMessage(`Customer "${effectiveCustomer?.name || "Customer"}" has no available credit notes to redeem (Balance: ₹0.00).`);
          } else if (next.length === 1 && available < grandTotal) {
            // Smart auto-split: Maximum possible from credit note, remainder in cash
            setIsSplitMode(true);
            const remainder = Math.round((grandTotal - available) * 100) / 100;
            updated.amount = available;
            next[index] = updated;
            next.push({
              id: Date.now() + 1,
              paymentType: "Cash",
              amount: remainder,
              branchId: branchId || "",
              cashDetails: null,
            });
            setPayments(next);
            return;
          }
        }
      }
    }
    if (field === "paymentType" && value !== "Cash") {
      delete updated.cashDetails;
    }
    if (field === "amount" && updated.paymentType === "Cash") {
      updated.cashDetails = null;
    }
    next[index] = updated;
    setPayments(next);
  };

  const hasUncapturedCash = useMemo(() => {
    return payments.some((p) => {
      if (p.paymentType !== "Cash") return false;
      const target = Number(p.amount) || 0;
      if (target <= 0) return false;
      if (!p.cashDetails) return true;
      const received = Number(p.cashDetails.receivedTotal ?? p.cashDetails.dispensedTotal) || 0;
      const returned = Number(p.cashDetails.returnedTotal ?? p.cashDetails.customerChangeTotal) || 0;
      const expectedChange = Math.max(0, received - target);
      return received < target || returned !== expectedChange;
    });
  }, [payments]);


  const handleAddRow = () => {
    setIsSplitMode(true);
    setPayments([
      ...payments,
      {
        id: Date.now(),
        paymentType: "UPI",
        amount: shortfall,
        branchId: branchId || "",
        paymentQrId: primaryQr?._id ? String(primaryQr._id) : undefined,
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    const next = [...payments];
    next.splice(index, 1);
    if (next.length === 0) next.push({ id: Date.now(), paymentType: "Cash", amount: grandTotal });
    setPayments(next);
  };

  const handleConfirmCashBreakdown = (data) => {
    if (cashBreakdownTarget !== null) {
      handleUpdate(cashBreakdownTarget, 'cashDetails', data);
      setCashBreakdownTarget(null);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleProcessSale = async () => {
    if (isBusinessDayClosed && isShiftClosed) {
      setErrorMessage("Cannot create sale bill. The shift is closed, the business day is closed.");
      return;
    }

    if (isBusinessDayClosed) {
      setErrorMessage("Cannot create sale bill. The Business Day is closed for this branch.");
      return;
    }

    if (isShiftClosed) {
      setErrorMessage("Cannot create sale bill. The shift is closed. Please open a shift before billing.");
      return;
    }

    if (shortfall > 0.01) {
      setErrorMessage(
        isReturn
          ? `Cannot process return. Settled refund amount (₹${totalPaid.toFixed(2)}) is less than total refund due (₹${grandTotal.toFixed(2)}).`
          : `Cannot process sale. Collected amount (₹${totalPaid.toFixed(2)}) is less than Grand Total (₹${grandTotal.toFixed(2)}). Allocate any remaining balance to Credit (Udhar) or another payment mode.`
      );
      return;
    }

    if (overpayment > 0.01) {
      setErrorMessage(
        isReturn
          ? `Cannot process return. Settled refund amount (₹${totalPaid.toFixed(2)}) exceeds total refund due (₹${grandTotal.toFixed(2)}).`
          : `Cannot process sale. Total payment amount (₹${totalPaid.toFixed(2)}) exceeds Grand Total (₹${grandTotal.toFixed(2)}). Customer cannot pay more than the bill amount.`
      );
      return;
    }

    if (hasUncapturedCash) {
      setErrorMessage(
        isReturn
          ? "Please open the cash drawer and select the exact currency notes to dispense for this refund."
          : "Please capture the exact cash denominations given by the customer for all cash payments."
      );
      return;
    }

    const creditNoteRow = payments.find((p) => p.paymentType === "CreditNote");
    const hasCreditNote = Boolean(creditNoteRow);
    const creditRow = payments.find((p) => p.paymentType === "Credit");
    const hasCredit = Boolean(creditRow);
    const advanceRow = payments.find((p) => p.paymentType === "Advance");
    const hasAdvance = Boolean(advanceRow);
    const hasCust = Boolean(effectiveCustomer?._id || effectiveCustomer?.id);

    if (isWalkIn) {
      const hasDisallowed = payments.some((p) =>
        ["Credit", "Advance", "CreditNote"].includes(p.paymentType)
      );
      if (hasDisallowed) {
        setErrorMessage(
          isReturn
            ? "Returns for Walk-in Customers can only be settled via Cash Refund. Register customer phone number to issue Credit Notes."
            : "Walk-in customers cannot bill on Credit, use Advances, or redeem Credit Notes. Please choose Cash or UPI."
        );
        return;
      }
    }

    if ((hasCredit || hasAdvance || hasCreditNote) && !hasCust) {
      setErrorMessage(
        hasCreditNote
          ? (isReturn ? "Issuing a Credit Note requires selecting a registered customer profile first." : "Redeeming a Credit Note requires selecting a registered customer profile.")
          : hasCredit
          ? "Credit billing requires selecting a registered customer profile first."
          : "Advance payment requires selecting a registered customer profile with available deposit."
      );
      return;
    }

    if (!isReturn && hasCredit) {
      const totalCreditReq = payments
        .filter((p) => p.paymentType === "Credit")
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      if (totalCreditReq > availableCredit) {
        setErrorMessage(
          `Credit limit exceeded! Requested ₹${totalCreditReq.toFixed(2)}, but customer available credit limit is ₹${availableCredit.toFixed(2)}.`
        );
        return;
      }
    }

    if (!isReturn && hasAdvance) {
      const totalAdvanceReq = payments
        .filter((p) => p.paymentType === "Advance")
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      if (totalAdvanceReq > advanceBalance) {
        setErrorMessage(
          `Insufficient advance balance! Requested ₹${totalAdvanceReq.toFixed(2)}, but customer advance deposit is ₹${advanceBalance.toFixed(2)}.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const salePayload = {
        invoiceNo: displayInvoiceNo,
        branchId: branchId || undefined,
        customer: customerPhone ? { ...customer, phone: customerPhone } : customer,
        doctor: doctor || null,
        doctorId: doctorId || null,
        date: saleDate ? new Date(saleDate).toISOString() : new Date().toISOString(),
        billingMode,
        partyType: isB2B ? customer?.partyType || "wholesaler" : "retail_consumer",
        isReturn,
        returnType: isReturn ? (payments[0]?.paymentType === "CreditNote" || payments[0]?.paymentType === "Credit" ? "credit_note" : "cash_refund") : undefined,
        items,
        subtotal,
        itemDiscount,
        schemeDiscount,
        extraDiscount: extraDiscountAmt,
        taxableAmount: totalTaxable,
        tax: totalGst,
        roundOff,
        grandTotal,
        gstSlabs,
        paymentMethod: isReturn ? (payments[0]?.paymentType === "CreditNote" || payments[0]?.paymentType === "Credit" ? "Credit Note" : "Cash") : ((isSplitMode || payments.length > 1) ? "Split" : (payments[0]?.paymentType || "Cash")),
        shiftId: shiftIdProp || activeShift?._id || null,
        creditDueDate: creditRow?.creditDueDate || undefined,
        creditStatus: hasCredit ? "PENDING" : undefined,
        cashTendered: payments.reduce((sum, p) => p.paymentType === "Cash" ? sum + (p.cashDetails?.receivedTotal || Number(p.amount)) : sum, 0),
        changeDue: payments.reduce((sum, p) => p.paymentType === "Cash" ? sum + (p.cashDetails?.returnedTotal || 0) : sum, 0),
        denominations: [],
        payments: payments.map(p => {
          const amt = Number(p.amount) || 0;
          let cashDenoms = [];
          let retDenoms = [];
          if (p.paymentType === "Cash") {
            if (p.cashDetails?.received) {
              cashDenoms = Object.entries(p.cashDetails.received)
                .filter(([, qty]) => Number(qty) > 0)
                .map(([val, qty]) => ({ denomination: Number(val), quantity: Number(qty) }));
            }
            if (cashDenoms.length === 0 && amt > 0) {
              const autoD = decomposeAmount(amt);
              cashDenoms = Object.entries(autoD).map(([val, qty]) => ({ denomination: Number(val), quantity: Number(qty) }));
            }
            if (p.cashDetails?.returned) {
              retDenoms = Object.entries(p.cashDetails.returned)
                .filter(([, qty]) => Number(qty) > 0)
                .map(([val, qty]) => ({ denomination: Number(val), quantity: Number(qty) }));
            }
          }
          return {
            paymentType: p.paymentType,
            amount: amt,
            paymentQrId: p.paymentType === "UPI" ? (p.paymentQrId || (primaryQr?._id ? String(primaryQr._id) : undefined)) : undefined,
            txnRefNo: p.txnRefNo,
            creditDueDate: p.paymentType === "Credit" ? p.creditDueDate : undefined,
            creditNoteAllocations: p.paymentType === "CreditNote" ? (p.creditNoteAllocations || []) : undefined,
            branchId: p.paymentType === "Cash" ? branchId : undefined,
            cashPartition: p.paymentType === "Cash" ? "running" : undefined,
            denominations: cashDenoms,
            returnedDenominations: retDenoms,
          };
        }),
        notes,
      };

      await onCompleteSale(salePayload);
    } catch (err) {
      console.error("Sale invoice creation error:", err);
      setErrorMessage(err?.response?.data?.message || err.message || "Failed to create invoice in backend");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UIModal isOpen={isOpen} onClose={onClose} size="2xl" title={isReturn ? "Return Preview & Refund Settlement" : "Sale Preview & Checkout"} showCloseButton={false}>
      <div className="p-0 font-sans flex flex-col md:flex-row h-[84vh] max-h-[660px] overflow-hidden">

        {/* ── LEFT: Receipt Preview (Balanced width, ~48%) ── */}
        <div className="w-full md:w-[48%] shrink-0 border-r border-border bg-surface-alt/10 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
            {/* Receipt Paper */}
            <div className="w-full max-w-sm bg-surface shadow-md border border-border rounded-xl overflow-hidden">
              {/* Receipt Header Band */}
              <div className={cn("px-5 py-3 text-white text-center", isReturn ? "bg-error" : "bg-primary")}>
                <h2 className="text-[12.5px] font-black uppercase tracking-widest">
                  {isReturn ? "Sales Return Memo" : (isB2B ? "Tax Invoice" : "Retail Receipt")}
                </h2>
                <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-mono font-bold tracking-wider">
                  <span>{isReturn ? "Ret:" : "Inv:"}</span>
                  <span>{displayInvoiceNo}</span>
                </div>
                <p className="text-[10px] opacity-75 mt-1">
                  {new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Billed To */}
              <div className="px-4 py-2.5 border-b border-dashed border-border/70">
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-text-muted mb-0.5">Billed To</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-bold text-xs text-text leading-tight">{customer?.name || "Walk-in Customer"}</p>
                  {isWalkIn && (
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Walk-in
                    </span>
                  )}
                </div>
                {customer?.mobile && <p className="text-[10.5px] text-text-muted font-mono mt-0.5">{customer.mobile}</p>}
                {customer?.gstin && <p className="text-[10px] text-text-muted font-mono">GSTIN: {customer.gstin}</p>}
                {!isWalkIn && creditNoteBalance > 0 && (
                  <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                    <Receipt className="size-3" />
                    <span>Credit Note: ₹{creditNoteBalance.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Items list (compact) */}
              <div className="px-4 py-2.5 border-b border-dashed border-border/70">
                <div className="flex justify-between text-[9px] font-bold uppercase text-text-muted mb-1.5">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                <div className="space-y-1 font-mono text-[10.5px]">
                  {items.slice(0, 6).map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-text-muted truncate max-w-[170px]">
                        {item.name} <span className="text-[9.5px]">×{item.qty}</span>
                      </span>
                      <span className="font-bold text-text tabular-nums">
                        ₹{((Number(item.price) || 0) * Math.max(1, Number(item.qty) || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {items.length > 6 && (
                    <div className="text-text-muted text-[9.5px] italic">+{items.length - 6} more items…</div>
                  )}
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="px-4 py-2.5 space-y-1 font-mono text-[10.5px]">
                <div className="flex justify-between">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="text-text">₹{subtotal.toFixed(2)}</span>
                </div>
                {itemDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Item Disc.</span>
                    <span>-₹{itemDiscount.toFixed(2)}</span>
                  </div>
                )}
                {schemeDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Scheme Disc.</span>
                    <span>-₹{schemeDiscount.toFixed(2)}</span>
                  </div>
                )}
                {extraDiscountAmt > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Extra Disc. ({discountPercent}%)</span>
                    <span>-₹{extraDiscountAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-dotted border-border/60">
                  <span className="text-text-muted">Taxable</span>
                  <span className="text-text">₹{totalTaxable.toFixed(2)}</span>
                </div>
                {gstSlabs.map((slab) => (
                  <div key={slab.gstPct} className="flex justify-between text-purple-600 dark:text-purple-400 text-[10px]">
                    <span>GST {slab.gstPct}%</span>
                    <span className="font-bold">₹{slab.total.toFixed(2)}</span>
                  </div>
                ))}
                {roundOff !== 0 && (
                  <div className="flex justify-between text-text-muted text-[10px]">
                    <span>Round Off</span>
                    <span>{roundOff > 0 ? "+" : "-"}₹{Math.abs(roundOff).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Grand Total Bar */}
              <div className="px-4 py-2.5 bg-primary text-primary-contrast flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                  {isReturn ? "Refund Total" : "Grand Total"}
                </span>
                <span className="text-lg font-black font-mono tabular-nums">₹{grandTotal.toFixed(2)}</span>
              </div>

              {/* Payment Summary in receipt preview if Credit Note applied */}
              {(() => {
                const cnRow = payments.find((p) => p.paymentType === "CreditNote");
                const cnAmt = Number(cnRow?.amount || 0);
                if (cnAmt > 0) {
                  return (
                    <div className="px-4 py-1.5 bg-indigo-500/10 border-t border-indigo-500/20 text-[10.5px] font-mono flex justify-between items-center text-indigo-700 dark:text-indigo-300">
                      <span className="font-bold flex items-center gap-1">
                        <Receipt className="size-3" />
                        {isReturn ? "Credit Note to Issue:" : "Credit Note Applied:"}
                      </span>
                      <span className="font-black">₹{cnAmt.toFixed(2)}</span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Extra Discount Controls */}
              <div className="px-4 py-2.5 border-t border-dashed border-border/60 bg-surface-alt/50 space-y-1.5">
                <label className="text-[9px] font-bold text-text-muted uppercase tracking-wider block">
                  Extra Discount Preset (%)
                </label>
                <div className="flex gap-1 flex-wrap items-center">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPercent(pct)}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all border cursor-pointer",
                        Number(discountPercent) === pct
                          ? "bg-primary text-primary-contrast border-primary/20 shadow-xs"
                          : "border-border bg-surface text-text hover:bg-surface-hover"
                      )}
                    >
                      {pct}%
                    </button>
                  ))}
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-14 h-[26px] rounded-md border border-border bg-surface px-1.5 text-[10px] font-mono font-bold text-center focus:border-primary focus:outline-none"
                    placeholder="Custom"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Payment Collection (Balanced width, ~52%, 2-Column fields) ── */}
        <div className="w-full md:w-[52%] flex-1 flex flex-col min-h-0 bg-surface overflow-hidden">

          {/* Amount to Collect / Return Header Bar */}
          <div className={cn(
            "px-5 py-3 border-b border-border shrink-0 flex items-center justify-between",
            isReturn ? "bg-rose-500/5" : "bg-surface-alt/40"
          )}>
            <div>
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                isReturn ? "text-error" : "text-text-muted"
              )}>
                {isReturn ? "Amount to Return / Refund" : "Amount to Collect"}
              </p>
              <p className={cn(
                "text-2xl font-black tabular-nums font-mono leading-none mt-0.5",
                isReturn ? "text-error" : "text-text"
              )}>
                ₹{grandTotal.toFixed(2)}
              </p>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5",
              isExactBalance
                ? "bg-success-soft text-success border-success/30"
                : overpayment > 0
                ? "bg-error-soft text-error border-error/30"
                : "bg-warning-soft text-warning border-warning/30"
            )}>
              {isExactBalance
                ? "✓ Balanced"
                : overpayment > 0
                ? (isReturn ? `Excess Refund ₹${overpayment.toFixed(2)}` : `Overpaid by ₹${overpayment.toFixed(2)}`)
                : (isReturn ? `Pending Refund ₹${shortfall.toFixed(2)}` : `Short ₹${shortfall.toFixed(2)}`)}
            </div>
          </div>

          {/* Overpayment Warning & Auto-Balance Banner */}
          {overpayment > 0 && (
            <div className="mx-5 mt-3 p-3 rounded-xl bg-error/10 border-2 border-error/40 text-error flex items-center justify-between gap-3 animate-in fade-in shrink-0 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="size-4.5 text-error shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider block text-error">
                    Overpayment Detected
                  </span>
                  <p className="text-xs font-semibold text-error truncate">
                    Total payments (₹{totalPaid.toFixed(2)}) exceed bill amount by ₹{overpayment.toFixed(2)}. Payments must exactly equal ₹{grandTotal.toFixed(2)}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const rebalanced = rebalancePaymentsOnUpdate(payments, payments.length - 1, payments[payments.length - 1].amount, grandTotal);
                  setPayments(rebalanced);
                  setErrorMessage(null);
                }}
                className="px-3 py-1 rounded-lg bg-error text-white text-[11px] font-bold hover:bg-error/90 cursor-pointer shadow-xs whitespace-nowrap shrink-0 transition-colors"
              >
                Auto-Balance Split
              </button>
            </div>
          )}

          {/* Prominent Full Error Message Banner */}
          {errorMessage && (
            <div className="mx-5 mt-3 p-3 rounded-xl bg-error/10 border-2 border-error/40 text-error flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-1 shadow-sm shrink-0">
              <div className="flex items-start gap-2.5 min-w-0">
                <AlertCircle className="size-4.5 text-error shrink-0 mt-0.5" />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider block text-error">
                    Action Required / Error
                  </span>
                  <p className="text-xs font-semibold leading-relaxed break-words text-error selection:bg-error/20">
                    {errorMessage}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="p-1 rounded-md hover:bg-error/20 text-error transition-colors shrink-0 cursor-pointer"
                title="Dismiss error"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Payment Methods (2-column grid layout, fits without scrolling) */}
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
            {payments.length > 1 && (
              <div className="flex items-center justify-between px-1 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  Split Tender Active ({payments.length} parts)
                </span>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                  isExactBalance
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                    : overpayment > 0
                    ? "text-error bg-error/10 border-error/30"
                    : "text-amber-600 bg-amber-500/10 border-amber-500/30"
                )}>
                  Paid: ₹{totalPaid.toFixed(2)} / ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            )}
            {payments.map((row, index) => (
              <div key={row.id} className="p-3.5 rounded-xl border border-border bg-surface shadow-xs space-y-2.5">

                {/* 2-Column: Payment Type (Col 1) + Amount (Col 2) */}
                <div className="grid grid-cols-2 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                      {isReturn ? "Settlement Method" : "Payment Method"}
                    </label>
                    <UISelect
                      value={row.paymentType}
                      onChange={(val) => handleUpdate(index, "paymentType", val)}
                      options={paymentTypeOptions}
                      size="sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                        {isReturn ? "Refund Amount (₹)" : "Amount (₹)"}
                      </label>
                      <div className="flex items-center gap-1.5">
                        {shortfall > 0 && payments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleUpdate(index, "amount", Math.round(((Number(row.amount) || 0) + shortfall) * 100) / 100)}
                            className="text-[9.5px] font-bold text-primary hover:underline cursor-pointer"
                            title="Add shortfall to this payment mode"
                          >
                            + Fill ₹{shortfall.toFixed(2)}
                          </button>
                        )}
                        {overpayment > 0 && Number(row.amount || 0) >= overpayment && (
                          <button
                            type="button"
                            onClick={() => handleUpdate(index, "amount", Math.round(((Number(row.amount) || 0) - overpayment) * 100) / 100)}
                            className="text-[9.5px] font-bold text-error hover:underline cursor-pointer"
                            title="Trim overpayment from this payment mode"
                          >
                            - Trim ₹{overpayment.toFixed(2)}
                          </button>
                        )}
                        {payments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            className="text-text-muted hover:text-error transition-colors p-0.5 cursor-pointer rounded"
                            title="Remove payment row"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={row.amount}
                        onChange={(e) => handleUpdate(index, "amount", e.target.value)}
                        className="w-full h-8 rounded-lg border border-border bg-surface-alt text-xs font-mono font-bold text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 px-2.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>

                {/* If UPI: 2-Column layout for UPI Account & Txn Ref */}
                {row.paymentType === "UPI" && (
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/50 animate-in fade-in">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                        UPI Account
                      </label>
                      <UISelect
                        value={row.paymentQrId || (primaryQr?._id ? String(primaryQr._id) : "")}
                        onChange={(val) => handleUpdate(index, "paymentQrId", val)}
                        options={upiOptions}
                        size="sm"
                        placeholder="Select UPI Account"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                        Txn Ref No (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UPI Ref / Txn ID"
                        value={row.txnRefNo || ""}
                        onChange={(e) => handleUpdate(index, "txnRefNo", e.target.value)}
                        className="w-full h-8 rounded-lg border border-border bg-surface-alt text-xs focus:border-primary focus:outline-none px-2.5"
                      />
                    </div>
                  </div>
                )}

                {/* If Cash: 2-Column layout for Drawer Info & Denominations Action */}
                {row.paymentType === "Cash" && (
                  <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-border/50 items-center">
                    {/* Col 1: Cash Drawer Available */}
                    <div className="p-2 rounded-lg border border-success/20 bg-success-soft/10 flex items-center gap-2">
                      <Wallet className="size-3.5 text-success shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[9.5px] font-bold text-text-muted uppercase block leading-none">
                          {activeShift ? "Shift Drawer" : "Running Cash"}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-success truncate block">
                          ₹{Number(availableCash).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Col 2: Notes / Denominations Stepper Button */}
                    <div className="flex items-center gap-1.5 flex-1">
                      <UIButton
                        variant={row.cashDetails ? "soft" : "outline"}
                        size="xs"
                        fullWidth
                        onClick={() => setCashBreakdownTarget(index)}
                        startIcon={<Calculator className="size-3" />}
                        className={cn(
                          "h-8 text-[11px] font-bold flex-1",
                          !row.cashDetails ? "border-amber-400/60 text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20" : ""
                        )}
                      >
                        {row.cashDetails
                          ? (isReturn ? "Edit Refund Notes" : "Edit Notes")
                          : (isReturn ? "Cash Drawer & Notes *" : "Cash Drawer & Notes *")}
                      </UIButton>
                    </div>
                  </div>
                )}

                {/* Cash: Captured Denominations Summary (2-column badges) */}
                {row.paymentType === "Cash" && row.cashDetails && (() => {
                  const receivedMap = row.cashDetails.received || row.cashDetails.dispensed || {};
                  const returnedMap = row.cashDetails.returned || row.cashDetails.customerChange || {};
                  const receivedEntries = Object.entries(receivedMap).filter(([, qty]) => Number(qty) > 0).sort(([a], [b]) => Number(b) - Number(a));
                  const returnedEntries = Object.entries(returnedMap).filter(([, qty]) => Number(qty) > 0).sort(([a], [b]) => Number(b) - Number(a));

                  return (
                    <div className="p-2 rounded-lg border border-success/30 bg-success-soft/10 text-[10.5px] font-mono space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between text-[10px] font-bold text-success">
                        <span>{isReturn ? "Notes Dispensed:" : "Notes Received:"} ₹{Number(row.cashDetails.receivedTotal ?? row.cashDetails.dispensedTotal).toLocaleString("en-IN")}</span>
                        <span>Net: ₹{Number(row.cashDetails.netApplied || row.cashDetails.netRefund || row.amount).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {receivedEntries.map(([denom, qty]) => (
                          <span key={`rec-${denom}`} className="px-1.5 py-0.5 rounded bg-surface border border-success/30 text-[10px] font-bold text-text">
                            ₹{denom}×{qty}
                          </span>
                        ))}
                      </div>
                      {Number(row.cashDetails.returnedTotal ?? row.cashDetails.customerChangeTotal) > 0 && (
                        <div className="pt-1 border-t border-success/20 flex items-center justify-between text-[10px] text-warning font-bold">
                          <span>{isReturn ? "Change from Customer:" : "Change Returned:"}</span>
                          <span>₹{Number(row.cashDetails.returnedTotal ?? row.cashDetails.customerChangeTotal).toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Cash: warning if denominations missing */}
                {row.paymentType === "Cash" && !row.cashDetails && (
                  <div className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center gap-1.5 text-[10.5px] text-amber-700 dark:text-amber-300 font-medium">
                    <AlertCircle className="size-3.5 text-amber-600 shrink-0" />
                    <span>
                      {isReturn
                        ? "Open cash drawer and select currency notes to dispense for this refund."
                        : "Exact currency denominations required for this cash payment."}
                    </span>
                  </div>
                )}

                {/* Cash: warning in return mode if drawer cash is low */}
                {row.paymentType === "Cash" && isReturn && availableCash < Number(row.amount || 0) && (
                  <div className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center gap-1.5 text-[10.5px] text-amber-700 dark:text-amber-300 font-medium">
                    <AlertCircle className="size-3.5 text-amber-600 shrink-0" />
                    <span>Current drawer cash (₹{availableCash.toFixed(2)}) is less than refund amount (₹{Number(row.amount || 0).toFixed(2)}). Consider 'Issue Credit Note'.</span>
                  </div>
                )}

                {/* If Credit: Customer Credit Balance & Due Date Selector */}
                {row.paymentType === "Credit" && (
                  <div className="pt-2 border-t border-rose-500/20 space-y-2 animate-in fade-in">
                    {!effectiveCustomer?._id && !effectiveCustomer?.id ? (
                      <div className="p-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>Credit billing requires selecting a registered customer profile first.</span>
                      </div>
                    ) : isReturn ? (
                      <div className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-text-muted uppercase block">Current Outstanding</span>
                            <span className="text-xs font-mono font-bold text-rose-600">
                              ₹{creditOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-text-muted uppercase block">Outstanding After Credit Note</span>
                            <span className="text-xs font-mono font-bold text-emerald-600">
                              ₹{Math.max(0, creditOutstanding - Number(row.amount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] text-text-muted">
                          A credit note of ₹{Number(row.amount || 0).toFixed(2)} will be credited to this customer's account ledger.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2 p-2 rounded-lg border border-rose-500/20 bg-rose-500/5 text-center">
                          <div>
                            <span className="text-[9px] font-bold text-text-muted uppercase block">Credit Limit</span>
                            <span className="text-[11px] font-mono font-bold text-text">
                              ₹{creditLimit.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-text-muted uppercase block">Outstanding</span>
                            <span className="text-[11px] font-mono font-bold text-rose-600">
                              ₹{creditOutstanding.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-text-muted uppercase block">Available</span>
                            <span className={cn(
                              "text-[11px] font-mono font-bold",
                              availableCredit >= Number(row.amount || 0) ? "text-emerald-600" : "text-rose-600"
                            )}>
                              ₹{availableCredit.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        {availableCredit > 0 && Number(row.amount || 0) < Math.min(grandTotal, availableCredit) && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const maxCred = Math.min(grandTotal, availableCredit);
                                const rebalanced = rebalancePaymentsOnUpdate(payments, index, maxCred, grandTotal);
                                setPayments(rebalanced);
                                setErrorMessage(null);
                              }}
                              className="px-2.5 py-1 rounded bg-rose-600 text-white text-[10.5px] font-bold hover:bg-rose-700 cursor-pointer transition-all shadow-2xs"
                            >
                              Max Credit (₹{Math.min(grandTotal, availableCredit).toFixed(2)})
                            </button>
                          </div>
                        )}

                        {Number(row.amount || 0) > availableCredit && (
                          <div className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5">
                            <AlertCircle className="size-3.5 shrink-0" />
                            <span>Requested amount exceeds available credit limit by ₹{(Number(row.amount || 0) - availableCredit).toFixed(2)}</span>
                          </div>
                        )}

                        {(() => {
                          const baseTime = saleDate
                            ? new Date(saleDate).getTime()
                            : new Date().setHours(0, 0, 0, 0);
                          const dueTime = row.creditDueDate
                            ? new Date(row.creditDueDate).getTime()
                            : 0;
                          const diffDays =
                            dueTime && !isNaN(dueTime)
                              ? Math.max(0, Math.round((dueTime - baseTime) / (1000 * 60 * 60 * 24)))
                              : (creditDays || 15);

                          return (
                            <div className="space-y-2 pt-1 border-t border-border/50">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                                  Maturity Due Date
                                </label>
                                <span className="text-[11px] font-medium text-text-muted">
                                  Term: <strong className="text-primary font-mono font-bold">{diffDays} days</strong>
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                                <input
                                  type="date"
                                  value={row.creditDueDate || ""}
                                  min={new Date().toISOString().split("T")[0]}
                                  onChange={(e) => handleUpdate(index, "creditDueDate", e.target.value)}
                                  className="w-full h-8.5 rounded-lg border border-border bg-surface-alt text-xs font-mono font-bold text-text focus:border-primary focus:outline-none px-2.5"
                                />

                                <div className="flex items-center gap-1.5">
                                  {[7, 15, 30, 45].map((preset) => {
                                    const isSelected = diffDays === preset;
                                    return (
                                      <button
                                        key={preset}
                                        type="button"
                                        onClick={() => {
                                          const d = new Date(baseTime);
                                          d.setDate(d.getDate() + preset);
                                          handleUpdate(index, "creditDueDate", d.toISOString().split("T")[0]);
                                        }}
                                        className={cn(
                                          "flex-1 h-7 rounded-md text-[10.5px] font-semibold transition-all cursor-pointer border",
                                          isSelected
                                            ? "bg-primary text-primary-foreground border-primary shadow-2xs font-bold"
                                            : "bg-surface-alt hover:bg-surface border-border text-text-muted hover:text-text"
                                        )}
                                      >
                                        {preset}d
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              
                            </div>
                            
                          );
                        })()}
                      </>
                    )}
                  </div>
                )}

                {/* If Credit Note: Customer Credit Note Balance & Auto-Apply */}
                {row.paymentType === "CreditNote" && (
                  <div className="pt-2 border-t border-indigo-500/20 space-y-2 animate-in fade-in">
                    {!effectiveCustomer?._id && !effectiveCustomer?.id ? (
                      <div className="p-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-2">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>Credit Note requires selecting a registered customer profile first.</span>
                      </div>
                    ) : isReturn ? (
                      <div className="p-3 rounded-xl border border-indigo-500/25 bg-indigo-500/10 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Receipt className="size-4 text-indigo-600 shrink-0" />
                          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                            Issue Credit Note Voucher of ₹{Number(row.amount || 0).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted leading-relaxed">
                          A formal return Credit Note voucher will be generated and credited to{" "}
                          <strong>{effectiveCustomer?.name || "Customer"}</strong>&apos;s account.
                          The customer can redeem this balance during future sales checkouts.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="p-2.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Receipt className="size-4 text-indigo-600" />
                              <div>
                                <span className="text-[9.5px] font-bold text-text-muted uppercase block leading-none">
                                  Available Credit Note Balance
                                </span>
                                <span className="text-xs font-mono font-bold text-indigo-600">
                                  ₹{creditNoteBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {creditNoteBalance > 0 && Number(row.amount || 0) < Math.min(grandTotal, creditNoteBalance) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const maxCn = Math.min(grandTotal, creditNoteBalance);
                                    const rebalanced = rebalancePaymentsOnUpdate(payments, index, maxCn, grandTotal);
                                    setPayments(rebalanced);
                                    setErrorMessage(null);
                                  }}
                                  className="px-2.5 py-1 rounded bg-indigo-600 text-white text-[10.5px] font-bold hover:bg-indigo-700 cursor-pointer transition-all shadow-2xs"
                                >
                                  Max Apply (₹{Math.min(grandTotal, creditNoteBalance).toFixed(2)})
                                </button>
                              )}
                              <div className="text-right">
                                <span className="text-[9.5px] font-bold text-text-muted uppercase block leading-none">
                                  Balance After Bill
                                </span>
                                <span className={cn(
                                  "text-xs font-mono font-bold",
                                  creditNoteBalance >= Number(row.amount || 0) ? "text-emerald-600" : "text-rose-600"
                                )}>
                                  ₹{Math.max(0, creditNoteBalance - Number(row.amount || 0)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {Number(row.amount || 0) > creditNoteBalance && (
                          <div className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5">
                            <AlertCircle className="size-3.5 shrink-0" />
                            <span>Requested amount exceeds available credit note balance by ₹{(Number(row.amount || 0) - creditNoteBalance).toFixed(2)}</span>
                          </div>
                        )}

                        {customerCreditNotes.length > 0 && (
                          <div className="p-2.5 rounded-lg border border-border bg-surface-alt/40 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
                              <span>Available Credit Notes ({customerCreditNotes.length})</span>
                              <span className="text-primary font-mono lowercase text-[9.5px]">Auto-FIFO FIFO enabled</span>
                            </div>
                            <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                              {customerCreditNotes.map((cn) => {
                                const noteBal = Number(cn.balanceAmount || 0);
                                const issueDate = cn.issueDate || cn.date || cn.createdAt;
                                const formattedDate = issueDate ? new Date(issueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
                                return (
                                  <div
                                    key={cn._id}
                                    className="flex items-center justify-between text-[11px] p-1.5 rounded-lg border border-border/70 bg-surface text-text hover:border-primary/40 transition-colors"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Receipt className="size-3 text-indigo-600 shrink-0" />
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono font-bold text-primary truncate">{cn.creditNoteNo}</span>
                                          <span className="text-text-muted text-[9.5px]">({formattedDate})</span>
                                        </div>
                                        {cn.sourceReturnNo && (
                                          <span className="text-[9.5px] text-text-muted block">
                                            Return: {cn.sourceReturnNo}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="font-mono font-bold text-emerald-600 text-xs block">
                                        ₹{noteBal.toFixed(2)}
                                      </span>
                                      <span className="text-[9px] text-text-muted">Available</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* If Advance: Prepaid Deposit Balance Info */}
                {row.paymentType === "Advance" && (
                  <div className="pt-2 border-t border-amber-500/20 space-y-2 animate-in fade-in">
                    {!effectiveCustomer?._id && !effectiveCustomer?.id ? (
                      <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>Advance billing requires selecting a registered customer profile.</span>
                      </div>
                    ) : (
                      <>
                        <div className="p-2 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wallet className="size-4 text-amber-600" />
                            <div>
                              <span className="text-[9.5px] font-bold text-text-muted uppercase block leading-none">
                                Prepaid Advance Held
                              </span>
                              <span className="text-xs font-mono font-bold text-amber-600">
                                ₹{advanceBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {advanceBalance > 0 && Number(row.amount || 0) < Math.min(grandTotal, advanceBalance) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const maxAdv = Math.min(grandTotal, advanceBalance);
                                  const rebalanced = rebalancePaymentsOnUpdate(payments, index, maxAdv, grandTotal);
                                  setPayments(rebalanced);
                                  setErrorMessage(null);
                                }}
                                className="px-2.5 py-1 rounded bg-amber-600 text-white text-[10.5px] font-bold hover:bg-amber-700 cursor-pointer transition-all shadow-2xs"
                              >
                                Max Apply (₹{Math.min(grandTotal, advanceBalance).toFixed(2)})
                              </button>
                            )}
                            <div className="text-right">
                              <span className="text-[9.5px] font-bold text-text-muted uppercase block leading-none">
                                Remaining After Bill
                              </span>
                              <span className={cn(
                                "text-xs font-mono font-bold",
                                advanceBalance >= Number(row.amount || 0) ? "text-emerald-600" : "text-rose-600"
                              )}>
                                ₹{Math.max(0, advanceBalance - Number(row.amount || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {Number(row.amount || 0) > advanceBalance && (
                          <div className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5">
                            <AlertCircle className="size-3.5 shrink-0" />
                            <span>Amount exceeds available advance deposit by ₹{(Number(row.amount || 0) - advanceBalance).toFixed(2)}. Consider Split mode.</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Quick Settle Shortfall Options */}
            {shortfall > 0 && !isReturn && (
              <div className="p-2.5 rounded-xl border border-warning/30 bg-warning-soft/10 space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between text-[10px] font-bold text-warning uppercase tracking-wider">
                  <span>Settle Shortfall (₹{shortfall.toFixed(2)} remaining)</span>
                  <span>Select mode</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {!isWalkIn && effectiveCustomer?._id && availableCredit > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAddOrFillPayment("Credit", Math.min(shortfall, availableCredit))}
                      className="px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 border border-rose-500/30 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                    >
                      <Receipt className="size-3" />
                      + Put ₹{Math.min(shortfall, availableCredit).toFixed(2)} on Credit (Udhar)
                    </button>
                  )}
                  {!isWalkIn && effectiveCustomer?._id && creditNoteBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAddOrFillPayment("CreditNote", Math.min(shortfall, creditNoteBalance))}
                      className="px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 border border-indigo-500/30 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                    >
                      <Receipt className="size-3" />
                      + Pay ₹{Math.min(shortfall, creditNoteBalance).toFixed(2)} from Credit Note
                    </button>
                  )}
                  {!isWalkIn && effectiveCustomer?._id && advanceBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAddOrFillPayment("Advance", Math.min(shortfall, advanceBalance))}
                      className="px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                    >
                      <Wallet className="size-3" />
                      + Pay ₹{Math.min(shortfall, advanceBalance).toFixed(2)} from Advance
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddOrFillPayment("UPI", shortfall)}
                    className="px-2.5 py-1 rounded-md text-[10.5px] font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 border border-purple-500/30 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                  >
                    <QrCode className="size-3" />
                    + Add ₹{shortfall.toFixed(2)} UPI
                  </button>
                </div>
              </div>
            )}

            {/* Compact Add Split Payment */}
            {!isReturn && (
              <button
                type="button"
                onClick={handleAddRow}
                className="w-full py-2 rounded-lg border border-dashed border-primary/40 text-primary text-xs font-bold bg-primary-soft/5 hover:bg-primary-soft/15 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="size-3.5" />
                Add Split Payment Method
              </button>
            )}
          </div>

          {/* Footer: Compact, Shorter Confirm Button (Fit) */}
          <div className="px-4 py-2.5 border-t border-border bg-surface shrink-0 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {errorMessage ? (
                <div
                  className="flex items-center gap-1.5 text-error cursor-pointer hover:underline"
                  title={errorMessage}
                  onClick={() => {}}
                >
                  <AlertCircle className="size-3.5 shrink-0 text-error" />
                  <span className="text-[11px] font-bold truncate block">
                    {errorMessage}
                  </span>
                </div>
              ) : isBusinessDayClosed && isShiftClosed ? (
                <div className="flex items-center gap-1.5 text-error">
                  <AlertCircle className="size-3.5 shrink-0 text-error" />
                  <span className="text-[11px] font-bold truncate block">
                    ⚠️ The shift is closed, the business day is closed
                  </span>
                </div>
              ) : isBusinessDayClosed ? (
                <div className="flex items-center gap-1.5 text-error">
                  <AlertCircle className="size-3.5 shrink-0 text-error" />
                  <span className="text-[11px] font-bold truncate block">
                    ⚠️ The Business Day is closed for this branch
                  </span>
                </div>
              ) : isShiftClosed ? (
                <div className="flex items-center gap-1.5 text-error">
                  <AlertCircle className="size-3.5 shrink-0 text-error" />
                  <span className="text-[11px] font-bold truncate block">
                    ⚠️ The shift is closed. Open a shift to bill
                  </span>
                </div>
              ) : overpayment > 0 ? (
                <span className="text-[11px] font-bold text-error truncate block">
                  ⚠️ Overpaid by ₹{overpayment.toFixed(2)}. Payments must equal ₹{grandTotal.toFixed(2)}
                </span>
              ) : shortfall > 0 ? (
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 truncate block">
                  ⚠️ Short by ₹{shortfall.toFixed(2)}. Settle remaining shortfall to continue
                </span>
              ) : hasUncapturedCash ? (
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 truncate block">
                  ⚠️ Select cash denominations to continue
                </span>
              ) : (
                <span className="text-[11px] text-text-muted truncate block">
                  {items.length} item{items.length !== 1 ? "s" : ""} · {isReturn ? "Sales Return Memo" : (isB2B ? "B2B Invoice" : "B2C Receipt")}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <UIButton variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </UIButton>
              <PermissionGate
                permission="pos:create"
                fallback={
                  <UIButton variant="primary" size="sm" disabled>
                    Permission Required
                  </UIButton>
                }
              >
                <UIButton
                  variant={isReturn ? "destructive" : "success"}
                  size="sm"
                  className="px-5 font-bold"
                  isLoading={isSubmitting}
                  loadingText={isReturn ? "Processing Return..." : "Processing..."}
                  disabled={isSubmitting || !isExactBalance || hasUncapturedCash || isSessionBlocked}
                  onClick={handleProcessSale}
                  startIcon={isReturn ? <RotateCcw className="size-4" /> : <CheckCircle2 className="size-4" />}
                >
                  {isBusinessDayClosed && isShiftClosed
                    ? "Shift & Business Day Closed"
                    : isBusinessDayClosed
                    ? "Business Day Closed"
                    : isShiftClosed
                    ? "Shift Closed"
                    : overpayment > 0
                    ? `Overpaid by ₹${overpayment.toFixed(2)}`
                    : shortfall > 0
                    ? `Short by ₹${shortfall.toFixed(2)}`
                    : isReturn
                        ? (payments[0]?.paymentType === "CreditNote" || payments[0]?.paymentType === "Credit"
                            ? "Confirm Return & Issue Credit Note"
                            : "Confirm Return & Dispense Cash")
                        : (isSplitMode || payments.length > 1
                            ? "Confirm Split Sale"
                            : payments[0]?.paymentType === "CreditNote"
                            ? "Confirm Sale (Paid by Credit Note)"
                            : "Confirm Sale")}
                </UIButton>
              </PermissionGate>
            </div>
          </div>

        </div>
      </div>

      {(() => {
        return (
          <CashBreakdownModal
            isOpen={cashBreakdownTarget !== null}
            onClose={() => setCashBreakdownTarget(null)}
            onConfirm={handleConfirmCashBreakdown}
            mode={isReturn ? "refund" : "sale"}
            targetAmount={cashBreakdownTarget !== null ? Number(payments[cashBreakdownTarget]?.amount || 0) : 0}
            initialReceived={cashBreakdownTarget !== null ? (payments[cashBreakdownTarget]?.cashDetails?.received || payments[cashBreakdownTarget]?.cashDetails?.dispensed) : {}}
            initialReturned={cashBreakdownTarget !== null ? (payments[cashBreakdownTarget]?.cashDetails?.returned || payments[cashBreakdownTarget]?.cashDetails?.customerChange) : {}}
            availableDenominations={runningDenominations || []}
            availableBalance={runningCash || 0}
            cashAccountName={activeShift ? "Shift Cash Drawer" : "Branch Cash (Running)"}
          />
        );
      })()}
    </UIModal>
  );
};

export default SalesCheckoutModal;

