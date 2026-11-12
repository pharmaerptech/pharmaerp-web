// src/features/dashboard/components/company/CompanyKpiGrid.jsx

import {
  BarChart3,
  ShoppingCart,
  TrendingUp,
  Smartphone,
  Wallet,
  Landmark,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UIStatCard } from "@/components/ui";
import { ROUTES } from "@/constants";

const formatCurrency = (val) => {
  const num = Number(val ?? 0);
  return `₹ ${num.toLocaleString("en-IN")}`;
};

export const CompanyKpiGrid = ({ kpis, isLoading = false }) => {
  const navigate = useNavigate();

  const cards = [
    {
      id: "sales",
      title: "Total Sales",
      value: formatCurrency(kpis?.totalSales),
      growth: kpis?.totalSalesGrowth ?? 0,
      growthLabel: "vs prior period",
      icon: BarChart3,
      color: "success",
      route: ROUTES.GSTR1,
    },
    {
      id: "purchases",
      title: "Total Purchases",
      value: formatCurrency(kpis?.totalPurchases),
      growth: kpis?.totalPurchasesGrowth ?? 0,
      growthLabel: "vs prior period",
      icon: ShoppingCart,
      color: "blue",
      route: ROUTES.GSTR2,
    },
    {
      id: "profit",
      title: "Gross Profit",
      value: formatCurrency(kpis?.grossProfit),
      growth: kpis?.grossProfitGrowth ?? 0,
      growthLabel: "margin realization",
      icon: TrendingUp,
      color: "warning",
      route: ROUTES.REPORTS,
    },
    {
      id: "receivables",
      title: "Customer Receivables",
      value: formatCurrency(kpis?.outstandingReceivables),
      growth: kpis?.outstandingReceivablesGrowth ?? 0,
      growthLabel: "customer credit dues",
      icon: Smartphone,
      color: "purple",
      route: ROUTES.CUSTOMERS,
    },
    {
      id: "payables",
      title: "Supplier Payables",
      value: formatCurrency(kpis?.outstandingPayables),
      growth: kpis?.outstandingPayablesGrowth ?? 0,
      growthLabel: "distributor dues",
      icon: Wallet,
      color: "error",
      route: ROUTES.SUPPLIERS,
    },
    {
      id: "bank",
      title: "Corporate Treasury",
      value: formatCurrency(kpis?.bankBalance),
      growth: kpis?.bankBalanceGrowth ?? 0,
      growthLabel: "liquid bank balances",
      icon: Landmark,
      color: "info",
      route: ROUTES.BANK_ACCOUNTS,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-3.5">
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

export default CompanyKpiGrid;
