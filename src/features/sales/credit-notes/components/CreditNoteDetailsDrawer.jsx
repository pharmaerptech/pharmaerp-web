// src/features/sales/credit-notes/components/CreditNoteDetailsDrawer.jsx

import React from "react";
import { CreditNoteDetailsDialog } from "./CreditNoteDetailsDialog";

/**
 * CreditNoteDetailsDrawer
 * Re-routed to the standardized CreditNoteDetailsDialog modal component
 * as requested for desktop/mobile UX consistency across ERP modules.
 */
export const CreditNoteDetailsDrawer = (props) => {
  return <CreditNoteDetailsDialog {...props} />;
};

export default CreditNoteDetailsDrawer;
