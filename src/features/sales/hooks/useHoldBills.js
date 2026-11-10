// src/features/sales/hooks/useHoldBills.js

import { useState, useEffect, useCallback, useMemo } from "react";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import {
  HOLD_TYPE,
  getBillHoldType,
  getHeldBills,
  getAutoHeldBill,
  saveHeldBill,
  saveAutoHeldBill,
  consumeAutoHeldBill,
  removeAutoHeldBill,
  removeHeldBill,
  clearBranchHeldBills,
  HELD_BILLS_STORAGE_KEY,
  HELD_BILLS_SYNC_EVENT,
} from "../services/holdBillStorage";

/**
 * Custom hook to manage branch-scoped held bills (auto + manual) with multi-tab reactivity.
 */
export const useHoldBills = () => {
  const { currentWorkspace } = useWorkspace();
  const { currentCompany } = useCompany();
  const { currentBranch } = useBranch();

  const workspaceId = useMemo(
    () => currentWorkspace?._id || currentWorkspace?.id || null,
    [currentWorkspace]
  );
  const companyId = useMemo(
    () => currentCompany?._id || currentCompany?.id || null,
    [currentCompany]
  );
  const branchId = useMemo(
    () => currentBranch?._id || currentBranch?.id || null,
    [currentBranch]
  );

  const [heldBills, setHeldBills] = useState(() => {
    return getHeldBills(workspaceId, companyId, branchId);
  });

  // Re-fetch bills from storage
  const refetch = useCallback(() => {
    if (!branchId) {
      setHeldBills([]);
      return;
    }
    const freshBills = getHeldBills(workspaceId, companyId, branchId);
    setHeldBills(freshBills);
  }, [workspaceId, companyId, branchId]);

  // Sync on branch or tenant change
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Listen for storage events (cross-tab) and custom events (same-tab)
  useEffect(() => {
    const handleStorageEvent = (e) => {
      if (!e.key || e.key === HELD_BILLS_STORAGE_KEY) {
        refetch();
      }
    };

    const handleCustomSyncEvent = () => {
      refetch();
    };

    window.addEventListener("storage", handleStorageEvent);
    window.addEventListener(HELD_BILLS_SYNC_EVENT, handleCustomSyncEvent);

    return () => {
      window.removeEventListener("storage", handleStorageEvent);
      window.removeEventListener(HELD_BILLS_SYNC_EVENT, handleCustomSyncEvent);
    };
  }, [refetch]);

  const autoHeldBill = useMemo(
    () => heldBills.find((b) => getBillHoldType(b) === HOLD_TYPE.AUTO) || null,
    [heldBills]
  );

  const manualHeldBills = useMemo(
    () => heldBills.filter((b) => getBillHoldType(b) !== HOLD_TYPE.AUTO),
    [heldBills]
  );

  /**
   * Hold the active bill manually
   */
  const holdBill = useCallback(
    ({
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
    }) => {
      if (!branchId) {
        console.warn("useHoldBills: Cannot hold bill without an active branch.");
        return null;
      }

      const created = saveHeldBill({
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
      });

      refetch();
      return created;
    },
    [workspaceId, companyId, branchId, refetch]
  );

  /**
   * Save/replace the automatic hold for the current branch
   */
  const saveAutoHold = useCallback(
    (draft, overrideTenant = null) => {
      const targetWs = overrideTenant?.workspaceId ?? workspaceId;
      const targetCo = overrideTenant?.companyId ?? companyId;
      const targetBr = overrideTenant?.branchId ?? branchId;
      if (!targetBr) return null;

      return saveAutoHeldBill({
        ...draft,
        workspaceId: targetWs,
        companyId: targetCo,
        branchId: targetBr,
      });
    },
    [workspaceId, companyId, branchId]
  );

  /**
   * Read the current automatic hold from storage synchronously
   */
  const getAutoHold = useCallback(() => {
    if (!branchId) return null;
    return getAutoHeldBill(workspaceId, companyId, branchId);
  }, [workspaceId, companyId, branchId]);

  /**
   * Consume (retrieve + remove) the automatic hold for the current branch
   */
  const consumeAutoHold = useCallback(() => {
    if (!branchId) return null;
    const bill = consumeAutoHeldBill(workspaceId, companyId, branchId);
    if (bill) {
      refetch();
    }
    return bill;
  }, [workspaceId, companyId, branchId, refetch]);

  /**
   * Remove any automatic hold for the current branch (leaves manual holds intact)
   */
  const removeAutoHold = useCallback(() => {
    if (!branchId) return false;
    const ok = removeAutoHeldBill(workspaceId, companyId, branchId);
    refetch();
    return ok;
  }, [workspaceId, companyId, branchId, refetch]);

  /**
   * Resume a held bill by ID (removes it from held bills storage and returns it)
   */
  const resumeBill = useCallback(
    (billId) => {
      if (!billId) return null;
      const freshBills = getHeldBills(workspaceId, companyId, branchId);
      const target =
        freshBills.find((b) => b.id === billId) ||
        heldBills.find((b) => b.id === billId);
      if (target) {
        removeHeldBill(billId);
        refetch();
        return target;
      }
      return null;
    },
    [workspaceId, companyId, branchId, heldBills, refetch]
  );

  /**
   * Discard a held bill by ID
   */
  const discardBill = useCallback(
    (billId) => {
      if (!billId) return false;
      const success = removeHeldBill(billId);
      refetch();
      return success;
    },
    [refetch]
  );

  /**
   * Clear all held bills (both automatic and manual) for current branch
   */
  const clearAll = useCallback(() => {
    if (!branchId) return false;
    const success = clearBranchHeldBills(workspaceId, companyId, branchId);
    refetch();
    return success;
  }, [workspaceId, companyId, branchId, refetch]);

  return {
    heldBills,
    autoHeldBill,
    manualHeldBills,
    count: heldBills.length,
    manualCount: manualHeldBills.length,
    hasAutoHold: Boolean(autoHeldBill),
    holdBill,
    saveAutoHold,
    getAutoHold,
    consumeAutoHold,
    removeAutoHold,
    resumeBill,
    discardBill,
    clearAll,
    refetch,
    workspaceId,
    companyId,
    branchId,
    currentBranch,
  };
};

export default useHoldBills;
