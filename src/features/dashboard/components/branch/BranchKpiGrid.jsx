// src/features/dashboard/components/branch/BranchKpiGrid.jsx

import {
  ShoppingCart,
  FileText,
  Users,
  CreditCard,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UIStatCard } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

export const BranchKpiGrid = ({ kpis, className, isLoading = false }) => {
  const navigate = useNavigate();

  const cards = [
    {
      id: "todays-sales",
      title: "Today's Sales",
      value: `₹ ${(kpis?.todaysSales ?? 0).toLocaleString("en-IN")}`,
      growth: kpis?.todaysSalesGrowth ?? 0,
      growthLabel: "vs yesterday",
      icon: ShoppingCart,
      color: "success",
      route: ROUTES.REPORTS_SALES,
    },
    {
      id: "total-invoices",
      title: "Total Invoices",
      value: (kpis?.totalInvoices ?? 0).toLocaleString("en-IN"),
      growth: kpis?.totalInvoicesGrowth ?? 0,
      growthLabel: "vs yesterday",
      icon: FileText,
      color: "blue",
      route: ROUTES.REPORTS_SALES,
    },
    {
      id: "new-customers",
      title: "New Customers",
      value: (kpis?.newCustomers ?? 0).toLocaleString("en-IN"),
      growth: kpis?.newCustomersGrowth ?? 0,
      growthLabel: "vs yesterday",
      icon: Users,
      color: "purple",
      route: ROUTES.REPORTS_CUSTOMER,
    },
    {
      id: "avg-bill-value",
      title: "Avg. Bill Value",
      value: `₹ ${(kpis?.avgBillValue ?? 0).toLocaleString("en-IN")}`,
      growth: kpis?.avgBillValueGrowth ?? 0,
      growthLabel: "vs yesterday",
      icon: CreditCard,
      color: "warning",
      route: ROUTES.REPORTS_SALES,
    },
    {
      id: "items-sold",
      title: "Items Sold",
      value: (kpis?.itemsSold ?? 0).toLocaleString("en-IN"),
      growth: kpis?.itemsSoldGrowth ?? 0,
      growthLabel: "vs yesterday",
      icon: Package,
      color: "error",
      route: ROUTES.REPORTS_PRODUCT,
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5", className)}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <UIStatCard
            key={card.id}
            title={card.title}
            value={card.value}
            growth={card.growth}
            growthLabel={card.growthLabel}
            icon={<Icon />}
            color={card.color}
            density="compact"
            variant="interactive"
            isLoading={isLoading}
            onClick={() => card.route && navigate(card.route)}
          />
        );
      })}
    </div>
  );
};

export default BranchKpiGrid;
