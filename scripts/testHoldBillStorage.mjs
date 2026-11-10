// scripts/testHoldBillStorage.mjs
/* global console, globalThis */
import assert from "node:assert/strict";
import {
  HELD_BILLS_STORAGE_KEY,
  HOLD_TYPE,
  getHeldBills,
  getAutoHeldBill,
  saveHeldBill,
  saveAutoHeldBill,
  consumeAutoHeldBill,
  removeAutoHeldBill,
  clearBranchHeldBills,
  clearAllHeldBillsStorage,
  hasMeaningfulSalesDraft,
} from "../src/features/sales/services/holdBillStorage.js";

const createMockWindow = () => {
  const store = new Map();
  const dispatchedEvents = [];
  return {
    dispatchedEvents,
    localStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, val) => store.set(key, String(val)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear(),
    },
    dispatchEvent: (evt) => {
      dispatchedEvents.push(evt);
    },
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    },
  };
};

const setupEnv = () => {
  const mockWin = createMockWindow();
  globalThis.window = mockWin;
  globalThis.CustomEvent = mockWin.CustomEvent;
  return mockWin;
};

const TENANT_A = { workspaceId: "ws1", companyId: "co1", branchId: "br1" };
const TENANT_B = { workspaceId: "ws1", companyId: "co1", branchId: "br2" };

const run = () => {
  // 1. hasMeaningfulSalesDraft detects empty vs non-empty drafts
  assert.equal(hasMeaningfulSalesDraft({}), false);
  assert.equal(
    hasMeaningfulSalesDraft({
      billingMode: "B2C",
      cart: [],
      customerName: "   ",
      customerPhone: "",
      doctorName: "",
      isReturnInvoice: false,
    }),
    false
  );
  assert.equal(
    hasMeaningfulSalesDraft({ cart: [{ id: "p1", name: "Dolo", price: 30, qty: 1 }] }),
    true
  );
  assert.equal(hasMeaningfulSalesDraft({ customerName: "Rahul" }), true);
  assert.equal(hasMeaningfulSalesDraft({ doctorName: "Dr. Verma" }), true);
  assert.equal(hasMeaningfulSalesDraft({ selectedB2bParty: { id: "c1", name: "MedCorp" } }), true);
  assert.equal(hasMeaningfulSalesDraft({ isReturnInvoice: true }), true);

  // 2. Manual holds + 3rd bill auto-hold priority sorting
  setupEnv();
  const manual1 = saveHeldBill({
    ...TENANT_A,
    customerName: "Manual 1",
    cart: [{ id: "m1", name: "Item 1", price: 100, qty: 1 }],
  });
  const manual2 = saveHeldBill({
    ...TENANT_A,
    customerName: "Manual 2",
    cart: [{ id: "m2", name: "Item 2", price: 200, qty: 1 }],
  });
  assert.equal(manual1.holdType, HOLD_TYPE.MANUAL);
  assert.equal(manual1.holdNumber, "HB-01");
  assert.equal(manual2.holdNumber, "HB-02");

  const auto1 = saveAutoHeldBill({
    ...TENANT_A,
    billingMode: "B2C",
    customerName: "Auto Customer",
    customerPhone: "9876543210",
    doctorName: "Dr. Sen",
    doctorId: "doc1",
    isReturnInvoice: false,
    cart: [{ id: "a1", name: "Auto Med", price: 50, qty: 2 }],
  });
  assert.ok(auto1);
  assert.equal(auto1.holdType, HOLD_TYPE.AUTO);
  assert.equal(auto1.holdNumber, "AUTO");
  assert.equal(auto1.doctorId, "doc1");

  // Auto hold MUST be first (priority) regardless of timestamps
  const queue = getHeldBills(TENANT_A.workspaceId, TENANT_A.companyId, TENANT_A.branchId);
  assert.equal(queue.length, 3);
  assert.equal(queue[0].id, auto1.id);
  assert.equal(queue[0].holdType, HOLD_TYPE.AUTO);

  // 3. Updating auto-hold replaces previous auto-hold for same branch, keeps manual holds
  const auto2 = saveAutoHeldBill({
    ...TENANT_A,
    customerName: "Auto Updated",
    cart: [{ id: "a2", name: "Auto Med 2", price: 75, qty: 3 }],
  });
  const queueAfterUpdate = getHeldBills(TENANT_A.workspaceId, TENANT_A.companyId, TENANT_A.branchId);
  assert.equal(queueAfterUpdate.length, 3);
  assert.equal(queueAfterUpdate[0].id, auto2.id);
  assert.equal(queueAfterUpdate[0].customerName, "Auto Updated");

  // Creating a manual hold while auto-hold exists assigns HB-03 (ignoring auto-hold)
  const manual3 = saveHeldBill({
    ...TENANT_A,
    customerName: "Manual 3",
    cart: [{ id: "m3", name: "Item 3", price: 120, qty: 1 }],
  });
  assert.equal(manual3.holdNumber, "HB-03");

  // Auto hold STILL has priority over newer manual hold
  const queueWithNewManual = getHeldBills(TENANT_A.workspaceId, TENANT_A.companyId, TENANT_A.branchId);
  assert.equal(queueWithNewManual[0].holdType, HOLD_TYPE.AUTO);

  // 4. Tenant isolation: saving/consuming auto-hold in Branch B does not touch Branch A
  const branchBAuto = saveAutoHeldBill({
    ...TENANT_B,
    customerName: "Branch B Customer",
    cart: [{ id: "b1", name: "B Med", price: 40, qty: 1 }],
  });
  assert.equal(getAutoHeldBill(TENANT_A.workspaceId, TENANT_A.companyId, TENANT_A.branchId).customerName, "Auto Updated");
  assert.equal(getAutoHeldBill(TENANT_B.workspaceId, TENANT_B.companyId, TENANT_B.branchId).id, branchBAuto.id);

  // 5. consumeAutoHeldBill retrieves & removes ONLY auto-hold, preserving manual holds
  const consumed = consumeAutoHeldBill(TENANT_A.workspaceId, TENANT_A.companyId, TENANT_A.branchId);
  assert.equal(consumed.id, auto2.id);
  assert.equal(getAutoHeldBill(TENANT_A.workspaceId, TENANT_A.companyId, TENANT_A.branchId), null);
  const remainingA = getHeldBills(TENANT_A.workspaceId, TENANT_A.companyId, TENANT_A.branchId);
  assert.equal(remainingA.length, 3);
  assert.ok(remainingA.every((b) => b.holdType === HOLD_TYPE.MANUAL));

  // 6. Empty draft is NOT auto-held
  assert.equal(saveAutoHeldBill({ ...TENANT_A, cart: [] }), null);
  assert.equal(getAutoHeldBill(TENANT_A.workspaceId, TENANT_A.companyId, TENANT_A.branchId), null);

  // 7. removeAutoHeldBill only removes auto-hold for that branch
  saveAutoHeldBill({
    ...TENANT_A,
    customerName: "Temp Auto",
    cart: [{ id: "x1", name: "X", price: 10, qty: 1 }],
  });
  removeAutoHeldBill(TENANT_A.workspaceId, TENANT_A.companyId, TENANT_A.branchId);
  assert.equal(getAutoHeldBill(TENANT_A.workspaceId, TENANT_A.companyId, TENANT_A.branchId), null);
  assert.equal(getHeldBills(TENANT_A.workspaceId, TENANT_A.companyId, TENANT_A.branchId).length, 3);

  // 8. clearBranchHeldBills clears BOTH auto & manual for Branch A, keeps Branch B intact
  saveAutoHeldBill({
    ...TENANT_A,
    customerName: "Before Shift Close",
    cart: [{ id: "s1", name: "S", price: 10, qty: 1 }],
  });
  clearBranchHeldBills(TENANT_A.workspaceId, TENANT_A.companyId, TENANT_A.branchId);
  assert.equal(getHeldBills(TENANT_A.workspaceId, TENANT_A.companyId, TENANT_A.branchId).length, 0);
  assert.equal(getHeldBills(TENANT_B.workspaceId, TENANT_B.companyId, TENANT_B.branchId).length, 1);

  // 9. clearAllHeldBillsStorage clears EVERYTHING on logout
  saveAutoHeldBill({
    ...TENANT_A,
    customerName: "Logout Auto",
    cart: [{ id: "l1", name: "L", price: 20, qty: 1 }],
  });
  saveHeldBill({
    ...TENANT_A,
    customerName: "Logout Manual",
    cart: [{ id: "l2", name: "L2", price: 30, qty: 1 }],
  });
  clearAllHeldBillsStorage();
  assert.equal(globalThis.window.localStorage.getItem(HELD_BILLS_STORAGE_KEY), null);
  assert.equal(getHeldBills(TENANT_A.workspaceId, TENANT_A.companyId, TENANT_A.branchId).length, 0);
  assert.equal(getHeldBills(TENANT_B.workspaceId, TENANT_B.companyId, TENANT_B.branchId).length, 0);

  console.log("All holdBillStorage tests passed!");
};

run();

