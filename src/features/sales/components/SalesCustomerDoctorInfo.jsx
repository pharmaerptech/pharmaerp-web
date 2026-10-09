// src/features/sales/components/SalesCustomerDoctorInfo.jsx
// Phase 2: Compact horizontal POS strip — replaces multi-row grid form.
// Logic: 100% identical (same props, same callbacks, same B2cCustomerSearchBar).

import React, { useRef } from "react";
import { Stethoscope, Calendar } from "lucide-react";
import { B2cCustomerSearchBar } from "@/features/parties/customers/components/B2cCustomerSearchBar";
import { cn } from "@/lib/utils";

export const SalesCustomerDoctorInfo = ({
  customerSearchBarRef,
  selectedCustomer,
  onSelectCustomer,
  customerName,
  onChangeCustomerName,
  customerPhone,
  onChangeCustomerPhone,
  doctorName,
  onChangeDoctorName,
  saleDate,
  onChangeSaleDate,
  onAddNewCustomer,
}) => {
  const internalRef = useRef(null);
  const activeRef = customerSearchBarRef || internalRef;

  return (
    <div className="flex items-end gap-3 flex-wrap">

      {/* 1. Patient / Customer Name (search) */}
      <div className="flex-1 min-w-[180px] space-y-0.5">
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
          Patient / Customer *
        </span>
        <B2cCustomerSearchBar
          ref={activeRef}
          value={customerName}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={(cust) => {
            onSelectCustomer(cust);
            if (cust?.name) onChangeCustomerName(cust.name);
            if (cust?.phone) onChangeCustomerPhone(cust.phone);
          }}
          onInputChange={(val) => {
            if (selectedCustomer) onSelectCustomer(null);
            onChangeCustomerName(val);
          }}
          showAddNewAction={true}
          onAddNewCustomer={onAddNewCustomer}
          placeholder="Search name or type new..."
          size="sm"
        />
      </div>

      {/* 2. Doctor Name */}
      <div className="w-[160px] space-y-0.5">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
          Doctor
        </span>
        <div className="relative">
          <input
            type="text"
            value={doctorName}
            onChange={(e) => onChangeDoctorName(e.target.value)}
            className="w-full h-[34px] rounded-lg border border-border pl-7 pr-2 text-[12px] bg-surface text-text focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all placeholder:text-text-muted/50"
            placeholder="Dr. Name"
          />
          <Stethoscope className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-text-muted pointer-events-none" />
        </div>
      </div>

      {/* 3. Sale Date (read-only chip) */}
      <div className="w-[140px] space-y-0.5">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
          Sale Date
        </span>
        <div className="relative">
          <input
            type="date"
            value={saleDate}
            readOnly
            disabled
            className="w-full h-[34px] rounded-lg border border-border pl-7 pr-2 text-[12px] bg-surface-alt text-text-muted cursor-not-allowed outline-none"
          />
          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-text-muted pointer-events-none" />
        </div>
      </div>

    </div>
  );
};

export default SalesCustomerDoctorInfo;
