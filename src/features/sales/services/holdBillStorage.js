// src/features/sales/services/holdBillStorage.js

/**
 * Storage key and hold classification constants for persistent browser-held bills
 */
export const HELD_BILLS_STORAGE_KEY = "pharmaerp_held_bills_v1";
export const HELD_BILLS_SYNC_EVENT = "pharmaerp_held_bills_change";

export const HOLD_TYPE = {
  AUTO: "auto",
  MANUAL: "manual",
};

/**
 * Normalize holdType with backward compatibility for legacy manual holds
 */
export const getBillHoldType = (bill) =>
  bill?.holdType === HOLD_TYPE.AUTO ? HOLD_TYPE.AUTO : HOLD_TYPE.MANUAL;

/**
 * Helper to dispatch in-window sync event (native 'storage' event only fires cross-tab)
 */
export const notifyHeldBillsUpdated = () => {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent(HELD_BILLS_SYNC_EVENT, {
          detail: { timestamp: Date.now() },
        })
      );
    } catch (err) {
      console.warn("Could not dispatch hold bills sync event:", err);
    }
  }
};

/**
 * Safe parser for localStorage
 */
export const loadAllRawHeldBills = () => {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(HELD_BILLS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading held bills from localStorage:", err);
    return [];
  }
};

/**
 * Safe writer for localStorage
 */
export const saveAllRawHeldBills = (bills) => {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const list = Array.isArray(bills) ? bills : [];
    window.localStorage.setItem(HELD_BILLS_STORAGE_KEY, JSON.stringify(list));
    notifyHeldBillsUpdated();
    return true;
  } catch (err) {
    console.error("Error writing held bills to localStorage:", err);
    return false;
  }
};

/**
 * Check whether a held bill matches tenant criteria
 */
export const isMatchingTenant = (bill, workspaceId, companyId, branchId) => {
  if (!bill) return false;

  const bBranch = bill.branchId ? String(bill.branchId) : null;
  const tBranch = branchId ? String(branchId) : null;
  // Branch is strictly mandatory
  if (!bBranch || !tBranch || bBranch !== tBranch) {
    return false;
  }

  const bComp = bill.companyId ? String(bill.companyId) : null;
  const tComp = companyId ? String(companyId) : null;
  if (tComp && bComp && bComp !== tComp) {
    return false;
  }

  const bWs = bill.workspaceId ? String(bill.workspaceId) : null;
  const tWs = workspaceId ? String(workspaceId) : null;
  if (tWs && bWs && bWs !== tWs) {
    return false;
  }

  return true;
};

/**
 * Check whether an in-progress POS draft contains any user-entered info worth auto-holding
 */
export const hasMeaningfulSalesDraft = (draft = {}) => {
  if (!draft || typeof draft !== "object") return false;
  if (Array.isArray(draft.cart) && draft.cart.length > 0) return true;
  if (
    draft.customer ||
    draft.selectedB2cCustomer ||
    draft.selectedB2bParty ||
    draft.selectedCustomer
  ) {
    return true;
  }
  if (String(draft.customerName || "").trim().length > 0) return true;
  if (String(draft.customerPhone || "").trim().length > 0) return true;
  if (draft.selectedDoctor) return true;
  if (String(draft.doctorName || "").trim().length > 0) return true;
  if (draft.isReturnInvoice) return true;
  return false;
};

/**
 * Generate human-friendly sequential token for manual holds in current branch (e.g. HB-01)
 */
export const generateHoldNumber = (existingBranchBills) => {
  const manualBills = (Array.isArray(existingBranchBills) ? existingBranchBills : []).filter(
    (b) => getBillHoldType(b) !== HOLD_TYPE.AUTO
  );
  const maxNumber = manualBills.reduce((max, bill) => {
    const match = /^HB-(\d+)$/i.exec(String(bill?.holdNumber || "").trim());
    if (!match) return max;
    const parsed = parseInt(match[1], 10);
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);
  const nextNum = Math.max(manualBills.length + 1, maxNumber + 1);
  return `HB-${String(nextNum).padStart(2, "0")}`;
};

/**
 * Retrieve held bills strictly filtered by workspaceId, companyId, and branchId.
 * Automatic hold always takes top priority, followed by manual holds newest-first.
 */
export const getHeldBills = (workspaceId, companyId, branchId) => {
  if (!branchId) return [];
  const allBills = loadAllRawHeldBills();
  return allBills
    .filter((bill) => isMatchingTenant(bill, workspaceId, companyId, branchId))
    .sort((a, b) => {
      const aIsAuto = getBillHoldType(a) === HOLD_TYPE.AUTO ? 1 : 0;
      const bIsAuto = getBillHoldType(b) === HOLD_TYPE.AUTO ? 1 : 0;
      if (aIsAuto !== bIsAuto) return bIsAuto - aIsAuto;
      return new Date(b.heldAt || 0) - new Date(a.heldAt || 0);
    });
};

/**
 * Get the current automatic hold for a branch (if any)
 */
export const getAutoHeldBill = (workspaceId, companyId, branchId) => {
  if (!branchId) return null;
  const bills = getHeldBills(workspaceId, companyId, branchId);
  return bills.find((bill) => getBillHoldType(bill) === HOLD_TYPE.AUTO) || null;
};

/**
 * Calculate totals snapshot for a cart
 */
export const computeCartSnapshot = (cart = [], billingMode = "B2C") => {
  const safeItems = Array.isArray(cart) ? cart : [];
  let itemCount = 0;
  let subtotal = 0;

  safeItems.forEach((item) => {
    const qty = Math.max(1, Number(item.qty) || 1);
    const rate = Number(item.price) || 0;
    const disc = Math.max(0, Math.min(100, Number(item.disc) || 0));

    itemCount += qty;
    if (billingMode === "B2B") {
      subtotal += rate * qty;
    } else {
      subtotal += rate * qty * (1 - disc / 100);
    }
  });

  const grandTotal = Math.round(subtotal);
  return {
    itemCount,
    uniqueItemCount: safeItems.length,
    subtotal: Math.round(subtotal * 100) / 100,
    grandTotal,
  };
};

const buildHeldBillRecord = ({
  workspaceId,
  companyId,
  branchId,
  billingMode = "B2C",
  b2bPartyType = "all",
  customer = null,
  customerName = "",
  customerPhone = "",
  doctorName = "",
  doctorId = null,
  saleDate = null,
  isReturnInvoice = false,
  cart = [],
  note = "",
  holdType = HOLD_TYPE.MANUAL,
  holdNumber,
}) => {
  const normalizedMode = billingMode === "B2B" ? "B2B" : "B2C";
  const snapshot = computeCartSnapshot(cart, normalizedMode);
  const normalizedType =
    holdType === HOLD_TYPE.AUTO ? HOLD_TYPE.AUTO : HOLD_TYPE.MANUAL;

  return {
    id: `${normalizedType === HOLD_TYPE.AUTO ? "autohold" : "hold"}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    holdType: normalizedType,
    holdNumber,
    heldAt: new Date().toISOString(),
    workspaceId: workspaceId ? String(workspaceId) : null,
    companyId: companyId ? String(companyId) : null,
    branchId: String(branchId),
    note: (note || "").trim(),

    // Context & customer metadata
    billingMode: normalizedMode,
    b2bPartyType: b2bPartyType || "all",
    customer: customer || null,
    customerName: customerName || customer?.name || "",
    customerPhone: customerPhone || customer?.mobile || customer?.phone || "",
    doctorName: doctorName || "",
    doctorId: doctorId || null,
    saleDate: saleDate || new Date().toISOString(),
    isReturnInvoice: Boolean(isReturnInvoice),

    // Deep serialized cart items
    cart: (Array.isArray(cart) ? cart : []).map((item) => ({
      ...item,
      qty: Number(item.qty) || 1,
      price: Number(item.price) || 0,
      disc: Number(item.disc) || 0,
    })),

    // Snapshot totals
    itemCount: snapshot.itemCount,
    uniqueItemCount: snapshot.uniqueItemCount,
    subtotal: snapshot.subtotal,
    grandTotal: snapshot.grandTotal,
  };
};

/**
 * Save a new manual held bill to localStorage under tenant scope
 */
export const saveHeldBill = ({
  workspaceId,
  companyId,
  branchId,
  billingMode = "B2C",
  b2bPartyType = "all",
  customer = null,
  customerName = "",
  customerPhone = "",
  doctorName = "",
  doctorId = null,
  saleDate = null,
  isReturnInvoice = false,
  cart = [],
  note = "",
  holdType = HOLD_TYPE.MANUAL,
}) => {
  if (!branchId) {
    console.warn("Cannot hold bill without branchId");
    return null;
  }

  if (holdType === HOLD_TYPE.AUTO) {
    return saveAutoHeldBill({
      workspaceId,
      companyId,
      branchId,
      billingMode,
      b2bPartyType,
      customer,
      customerName,
      customerPhone,
      doctorName,
      doctorId,
      saleDate,
      isReturnInvoice,
      cart,
      note,
    });
  }

  const allBills = loadAllRawHeldBills();
  const existingBranchBills = allBills.filter((b) =>
    isMatchingTenant(b, workspaceId, companyId, branchId)
  );

  const newHeldBill = buildHeldBillRecord({
    workspaceId,
    companyId,
    branchId,
    billingMode,
    b2bPartyType,
    customer,
    customerName,
    customerPhone,
    doctorName,
    doctorId,
    saleDate,
    isReturnInvoice,
    cart,
    note,
    holdType: HOLD_TYPE.MANUAL,
    holdNumber: generateHoldNumber(existingBranchBills),
  });

  const updatedList = [newHeldBill, ...allBills];
  saveAllRawHeldBills(updatedList);

  return newHeldBill;
};

/**
 * Save or replace the single automatic held bill for this branch when leaving/refreshing POS
 */
export const saveAutoHeldBill = (draft = {}) => {
  const {
    workspaceId,
    companyId,
    branchId,
    billingMode = "B2C",
    b2bPartyType = "all",
    customer = null,
    customerName = "",
    customerPhone = "",
    doctorName = "",
    doctorId = null,
    saleDate = null,
    isReturnInvoice = false,
    cart = [],
    note = "Auto-held while away from POS",
  } = draft;

  if (!branchId) {
    return null;
  }

  const resolvedCustomer =
    customer ||
    draft.selectedB2cCustomer ||
    draft.selectedB2bParty ||
    draft.selectedCustomer ||
    null;

  if (!hasMeaningfulSalesDraft({ ...draft, customer: resolvedCustomer })) {
    return null;
  }

  const allBills = loadAllRawHeldBills();
  // Replace any prior automatic hold for the same tenant; keep all manual holds & other branches
  const withoutPriorAuto = allBills.filter(
    (b) =>
      !(
        isMatchingTenant(b, workspaceId, companyId, branchId) &&
        getBillHoldType(b) === HOLD_TYPE.AUTO
      )
  );

  const newAutoBill = buildHeldBillRecord({
    workspaceId,
    companyId,
    branchId,
    billingMode,
    b2bPartyType,
    customer: resolvedCustomer,
    customerName: customerName || resolvedCustomer?.name || "",
    customerPhone:
      customerPhone || resolvedCustomer?.mobile || resolvedCustomer?.phone || "",
    doctorName,
    doctorId,
    saleDate,
    isReturnInvoice,
    cart,
    note,
    holdType: HOLD_TYPE.AUTO,
    holdNumber: "AUTO",
  });

  saveAllRawHeldBills([newAutoBill, ...withoutPriorAuto]);
  return newAutoBill;
};

/**
 * Remove only the automatic hold for a specific tenant (leaves manual holds intact)
 */
export const removeAutoHeldBill = (workspaceId, companyId, branchId) => {
  if (!branchId) return false;
  const allBills = loadAllRawHeldBills();
  const updatedList = allBills.filter(
    (b) =>
      !(
        isMatchingTenant(b, workspaceId, companyId, branchId) &&
        getBillHoldType(b) === HOLD_TYPE.AUTO
      )
  );
  if (updatedList.length === allBills.length) return true;
  return saveAllRawHeldBills(updatedList);
};

/**
 * Retrieve and immediately consume (pop) the automatic hold for a branch on POS return
 */
export const consumeAutoHeldBill = (workspaceId, companyId, branchId) => {
  if (!branchId) return null;
  const autoBill = getAutoHeldBill(workspaceId, companyId, branchId);
  if (!autoBill) return null;
  removeHeldBill(autoBill.id);
  return autoBill;
};

/**
 * Remove a specific held bill by ID
 */
export const removeHeldBill = (billId) => {
  if (!billId) return false;
  const allBills = loadAllRawHeldBills();
  const updatedList = allBills.filter((b) => b.id !== billId);
  return saveAllRawHeldBills(updatedList);
};

/**
 * Clear all held bills (both automatic and manual) for a specific branch (e.g., on shift close)
 */
export const clearBranchHeldBills = (workspaceId, companyId, branchId) => {
  if (!branchId) return false;
  const allBills = loadAllRawHeldBills();
  const updatedList = allBills.filter(
    (b) => !isMatchingTenant(b, workspaceId, companyId, branchId)
  );
  return saveAllRawHeldBills(updatedList);
};

/**
 * Clear all held bills across the entire device storage (used on logout / session expiry)
 */
export const clearAllHeldBillsStorage = () => {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    window.localStorage.removeItem(HELD_BILLS_STORAGE_KEY);
    notifyHeldBillsUpdated();
    return true;
  } catch (err) {
    console.error("Error clearing held bills from localStorage:", err);
    return false;
  }
};

export default {
  HELD_BILLS_STORAGE_KEY,
  HELD_BILLS_SYNC_EVENT,
  HOLD_TYPE,
  getBillHoldType,
  hasMeaningfulSalesDraft,
  getHeldBills,
  getAutoHeldBill,
  saveHeldBill,
  saveAutoHeldBill,
  consumeAutoHeldBill,
  removeAutoHeldBill,
  removeHeldBill,
  clearBranchHeldBills,
  clearAllHeldBillsStorage,
  computeCartSnapshot,
  notifyHeldBillsUpdated,
};
