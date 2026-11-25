import React from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Layers } from "lucide-react";
import { UIModal, UIModalHeader, UIModalTitle, UIModalBody } from "./ui/UIModal";
import ProductFacilityTable from "./ProductFacilityTable";
import { ROUTES } from "@/constants";

/**
 * ProductFacilityTableDialog Component
 * Full-screen / Modal Dialog to inspect Product Facility stock details & batch allocations.
 */
const ProductFacilityTableDialog = ({ open, onClose, children, data }) => {
  const navigate = useNavigate();
  if (!open) return null;

  return (
    <UIModal open={open} isOpen={open} onClose={onClose} size="3xl" closeOnBackdrop={true}>
      <UIModalHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers className="size-4" />
          </div>
          <div>
            <UIModalTitle>Stock Matrix</UIModalTitle>
            <p className="text-xs text-text-muted mt-0.5">
              Multi-branch inventory levels, batch allocations, and expiry radar
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onClose();
            navigate(ROUTES.STOCK_METRICS);
          }}
          className="mr-6 hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-surface-hover text-text-muted hover:text-primary transition-all cursor-pointer"
          title="Open Dedicated Full Page Register"
        >
          <ExternalLink className="size-3" />
          <span>Full Register</span>
        </button>
      </UIModalHeader>
      <UIModalBody className="p-0 sm:p-4 bg-surface-alt/30 max-h-[75vh]">
        {children || <ProductFacilityTable {...(data ? { data } : {})} />}
      </UIModalBody>
    </UIModal>
  );
};

export default ProductFacilityTableDialog;

