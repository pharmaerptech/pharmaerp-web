import React from "react";
import { useIsMobile } from "@/hooks";
import CreditNotesDesktopPage from "./desktop/CreditNotesDesktopPage";
import CreditNotesMobilePage from "./mobile/CreditNotesMobilePage";

export const CreditNotesPage = () => {
  const isMobile = useIsMobile();

  return isMobile ? <CreditNotesMobilePage /> : <CreditNotesDesktopPage />;
};

export default CreditNotesPage;

