// src/features/sales/components/SalesCustomerDoctorInfo.jsx
// Phase 2: Compact horizontal POS strip — customer & doctor search bar integration.

import React, { useRef } from "react";
import { Calendar } from "lucide-react";
import { B2cCustomerSearchBar } from "@/features/parties/customers/components/B2cCustomerSearchBar";
import { DoctorSearchBar } from "@/features/doctors/components/DoctorSearchBar";

export const SalesCustomerDoctorInfo = ({
  customerSearchBarRef,
  selectedCustomer,
  walkInCustomer,
  onSelectCustomer,
  customerName,
  onChangeCustomerName,
  customerPhone,
  onChangeCustomerPhone,
  selectedDoctor,
  onSelectDoctor,
  doctorName,
  onChangeDoctorName,
  saleDate,
  onChangeSaleDate,
  onAddNewCustomer,
  onAddNewDoctor,
}) => {
  const internalRef = useRef(null);
  const activeRef = customerSearchBarRef || internalRef;

  return (
    <div className="flex items-end gap-3 flex-wrap">
      {/* 1. Patient / Customer Name (search) */}
      <div className="flex-1 min-w-[220px] space-y-0.5">
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
          Patient / Customer
        </span>
        <B2cCustomerSearchBar
          ref={activeRef}
          value={customerName}
          selectedCustomer={selectedCustomer}
          walkInCustomer={walkInCustomer}
          onSelectCustomer={(cust) => {
            onSelectCustomer(cust);
            if (cust?.name) onChangeCustomerName(cust.name);
            else onChangeCustomerName("");
            if (cust?.phone || cust?.mobile) onChangeCustomerPhone(cust.phone || cust.mobile);
            else onChangeCustomerPhone("");
          }}
          onInputChange={(val) => {
            if (selectedCustomer) onSelectCustomer(null);
            onChangeCustomerName(val);
          }}
          showAddNewAction={true}
          onAddNewCustomer={onAddNewCustomer}
          placeholder="Search customer or select Walk-in..."
          size="sm"
        />
      </div>

      {/* 2. Doctor Name (debounced search with quick create - now flex-1 min-w-[220px]) */}
      <div className="flex-1 min-w-[220px] space-y-0.5">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
          Prescribing Doctor
        </span>
        <DoctorSearchBar
          value={doctorName}
          selectedDoctor={selectedDoctor}
          onSelectDoctor={(doc) => {
            if (onSelectDoctor) onSelectDoctor(doc);
            if (doc?.name) onChangeDoctorName(doc.name);
          }}
          onInputChange={(val) => {
            if (selectedDoctor && onSelectDoctor) onSelectDoctor(null);
            onChangeDoctorName(val);
          }}
          showAddNewAction={true}
          onAddNewDoctor={onAddNewDoctor}
          placeholder="Search Dr. or add new..."
          size="sm"
        />
      </div>

      {/* 3. Sale Date (read-only chip) */}
      <div className="w-[130px] shrink-0 space-y-0.5">
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
