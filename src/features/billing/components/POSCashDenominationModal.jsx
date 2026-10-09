import React, { useState, useEffect, useMemo } from "react";
import { UIModal, UIModalHeader, UIModalTitle, UIModalDescription, UIModalBody, UIModalFooter, UIButton, UIInput } from "@/components/ui";

const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
const INITIAL_COUNTS = DENOMINATIONS.reduce((acc, d) => ({ ...acc, [d]: "" }), {});

export const POSCashDenominationModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialDenominations = [],
  initialReturnedDenominations = [],
  requiredAmount = 0
}) => {
  const [receivedCounts, setReceivedCounts] = useState(INITIAL_COUNTS);
  const [returnedCounts, setReturnedCounts] = useState(INITIAL_COUNTS);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      
      const newRec = { ...INITIAL_COUNTS };
      initialDenominations.forEach(d => {
        if (d.denomination && d.quantity) newRec[d.denomination] = d.quantity;
      });
      setReceivedCounts(newRec);

      const newRet = { ...INITIAL_COUNTS };
      initialReturnedDenominations.forEach(d => {
        if (d.denomination && d.quantity) newRet[d.denomination] = d.quantity;
      });
      setReturnedCounts(newRet);
    }
  }, [isOpen, initialDenominations, initialReturnedDenominations]);

  const receivedTotal = useMemo(() => {
    return DENOMINATIONS.reduce((sum, d) => sum + d * (parseInt(receivedCounts[d]) || 0), 0);
  }, [receivedCounts]);

  const returnedTotal = useMemo(() => {
    return DENOMINATIONS.reduce((sum, d) => sum + d * (parseInt(returnedCounts[d]) || 0), 0);
  }, [returnedCounts]);

  const netAmount = receivedTotal - returnedTotal;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (netAmount !== requiredAmount) {
      setError(`Net amount (₹${netAmount}) must exactly match required amount (₹${requiredAmount}).`);
      return;
    }

    if (receivedTotal < requiredAmount) {
      setError(`Received total (₹${receivedTotal}) cannot be less than required amount (₹${requiredAmount}).`);
      return;
    }

    const denominations = DENOMINATIONS.map(d => ({ denomination: d, quantity: parseInt(receivedCounts[d]) || 0 })).filter(d => d.quantity > 0);
    const returnedDenominations = DENOMINATIONS.map(d => ({ denomination: d, quantity: parseInt(returnedCounts[d]) || 0 })).filter(d => d.quantity > 0);

    onSubmit(denominations, returnedDenominations);
  };

  return (
    <UIModal isOpen={isOpen} onClose={onClose} size="lg" mobileSheet>
      <UIModalHeader>
        <UIModalTitle>Cash Denominations</UIModalTitle>
        <UIModalDescription>Enter denominations for cash received and change returned.</UIModalDescription>
      </UIModalHeader>
      <UIModalBody>
        <form id="pos-cash-denom" onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-surface-alt rounded-xl border border-border font-bold text-sm">
            <span>Required Bill Amount:</span>
            <span className="text-primary font-mono text-lg">₹ {requiredAmount.toLocaleString("en-IN")}</span>
          </div>
          
          {error && <div className="text-sm text-error bg-error-soft/50 p-2 rounded-lg border border-error/30">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            {/* Received */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase text-emerald-600 border-b border-border pb-1">Customer Paid (Received)</h4>
              <div className="space-y-1">
                {DENOMINATIONS.map(denom => (
                  <div key={`rec-${denom}`} className="grid grid-cols-[60px_1fr] items-center gap-2">
                    <span className="text-xs font-mono font-bold text-text-muted">₹ {denom}</span>
                    <UIInput
                      type="number"
                      min="0"
                      className="h-7 text-xs"
                      value={receivedCounts[denom]}
                      onChange={(e) => setReceivedCounts(prev => ({ ...prev, [denom]: e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0) }))}
                    />
                  </div>
                ))}
              </div>
              <div className="pt-2 font-bold text-sm text-emerald-600 text-right">
                Total: ₹ {receivedTotal.toLocaleString("en-IN")}
              </div>
            </div>

            {/* Returned */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase text-amber-600 border-b border-border pb-1">Change Given (Returned)</h4>
              <div className="space-y-1">
                {DENOMINATIONS.map(denom => (
                  <div key={`ret-${denom}`} className="grid grid-cols-[60px_1fr] items-center gap-2">
                    <span className="text-xs font-mono font-bold text-text-muted">₹ {denom}</span>
                    <UIInput
                      type="number"
                      min="0"
                      className="h-7 text-xs"
                      value={returnedCounts[denom]}
                      onChange={(e) => setReturnedCounts(prev => ({ ...prev, [denom]: e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0) }))}
                    />
                  </div>
                ))}
              </div>
              <div className="pt-2 font-bold text-sm text-amber-600 text-right">
                Total: ₹ {returnedTotal.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <div className={`flex justify-between items-center p-3 rounded-xl border font-bold text-sm ${netAmount === requiredAmount ? 'bg-success-soft/30 border-success text-success' : 'bg-surface-alt border-border text-text'}`}>
            <span>Net Amount (Received - Returned):</span>
            <span className="font-mono text-lg">₹ {netAmount.toLocaleString("en-IN")}</span>
          </div>
        </form>
      </UIModalBody>
      <UIModalFooter>
        <UIButton variant="outline" onClick={onClose}>Cancel</UIButton>
        <UIButton variant="primary" type="submit" form="pos-cash-denom">Confirm & Checkout</UIButton>
      </UIModalFooter>
    </UIModal>
  );
};

export default POSCashDenominationModal;
