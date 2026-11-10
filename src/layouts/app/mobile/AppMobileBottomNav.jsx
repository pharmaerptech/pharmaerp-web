// src/layouts/app/mobile/AppMobileBottomNav.jsx

import { useMemo } from "react";
import { NavLink } from "react-router-dom";

import {
  FiBarChart2,
  FiBox,
  FiHome,
  FiMoreHorizontal,
  FiShoppingCart,
  FiCheckCircle,
  FiBriefcase,
  FiMapPin,
  FiHelpCircle,
  FiUsers,
  FiShield,
  FiFileText,
  FiClock,
} from "react-icons/fi";

import { ROUTES } from "@/constants";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import { useWorkMode, WORK_MODES } from "@/contexts";
import {
  useNavigationPipeline,
  PIPELINE_LEVELS,
} from "@/contexts/NavigationPipelineContext";

const AppMobileBottomNav = () => {
  const { isSetupComplete, companyCompleted, branchCompleted } = useSetupStatus();
  const { workMode } = useWorkMode();
  const { currentLevel } = useNavigationPipeline();

  const setupNavItems = [
    {
      label: "Setup",
      path: ROUTES.SETUP_CENTER,
      icon: <FiCheckCircle />,
      end: true,
    },
    ...(companyCompleted
      ? [
          {
            label: "Companies",
            path: ROUTES.COMPANIES,
            icon: <FiBriefcase />,
          },
        ]
      : []),
    ...(companyCompleted && branchCompleted
      ? [
          {
            label: "Branches",
            path: ROUTES.BRANCHES,
            icon: <FiMapPin />,
          },
        ]
      : []),
    {
      label: "Settings",
      path: ROUTES.SETTINGS,
      icon: <FiMoreHorizontal />,
    },
    {
      label: "Help",
      path: ROUTES.HELP_CENTER,
      icon: <FiHelpCircle />,
    },
  ];

  const contextNavItems = useMemo(() => {
    const isOp = workMode === WORK_MODES.OPERATION;

    if (currentLevel === PIPELINE_LEVELS.WORKSPACE) {
      if (isOp) {
        return [
          { label: "Companies", path: ROUTES.COMPANIES, icon: <FiBriefcase /> },
          { label: "Members", path: ROUTES.WORKSPACE_MEMBERS, icon: <FiUsers /> },
          { label: "Roles", path: ROUTES.ROLES, icon: <FiShield /> },
          { label: "Settings", path: ROUTES.SETTINGS, icon: <FiMoreHorizontal /> },
        ];
      }
      return [
        { label: "Dashboard", path: ROUTES.WORKSPACE_DASHBOARD, icon: <FiHome />, end: true },
        { label: "Companies", path: ROUTES.COMPANIES, icon: <FiBriefcase /> },
        { label: "Members", path: ROUTES.WORKSPACE_MEMBERS, icon: <FiUsers /> },
        { label: "Roles", path: ROUTES.ROLES, icon: <FiShield /> },
        { label: "Settings", path: ROUTES.SETTINGS, icon: <FiMoreHorizontal /> },
      ];
    }

    if (currentLevel === PIPELINE_LEVELS.COMPANY) {
      if (isOp) {
        return [
          { label: "Branches", path: ROUTES.BRANCHES, icon: <FiMapPin /> },
          { label: "Customers", path: ROUTES.CUSTOMERS, icon: <FiUsers /> },
          { label: "Suppliers", path: ROUTES.SUPPLIERS, icon: <FiBriefcase /> },
          { label: "Accounts", path: ROUTES.ACCOUNTS, icon: <FiFileText /> },
          { label: "Settings", path: ROUTES.SETTINGS, icon: <FiMoreHorizontal /> },
        ];
      }
      return [
        { label: "Dashboard", path: ROUTES.COMPANY_DASHBOARD, icon: <FiHome />, end: true },
        { label: "Branches", path: ROUTES.BRANCHES, icon: <FiMapPin /> },
        { label: "GSTR-1", path: ROUTES.GSTR1, icon: <FiFileText /> },
        { label: "Reports", path: ROUTES.REPORTS, icon: <FiBarChart2 /> },
        { label: "Settings", path: ROUTES.SETTINGS, icon: <FiMoreHorizontal /> },
      ];
    }

    // Branch Level
    if (isOp) {
      return [
        { label: "POS", path: ROUTES.SALES, icon: <FiShoppingCart /> },
        { label: "Invoices", path: ROUTES.BILLING, icon: <FiFileText /> },
        { label: "Stock", path: ROUTES.WORKSPACE_PRODUCTS, icon: <FiBox /> },
        { label: "Shifts", path: "/operations/shifts", icon: <FiClock /> },
        { label: "Settings", path: ROUTES.SETTINGS, icon: <FiMoreHorizontal /> },
      ];
    }

    return [
      { label: "Dashboard", path: ROUTES.BRANCH_DASHBOARD, icon: <FiHome />, end: true },
      { label: "Reports", path: ROUTES.REPORTS_HUB, icon: <FiBarChart2 /> },
      { label: "Stock", path: ROUTES.STOCK_METRICS, icon: <FiBox /> },
      { label: "Settings", path: ROUTES.SETTINGS, icon: <FiMoreHorizontal /> },
    ];
  }, [currentLevel, workMode]);

  const navItems = isSetupComplete ? contextNavItems : setupNavItems;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur-md">
      <div
        className={`mx-auto grid h-[64px] max-w-md items-center ${
          navItems.length === 3
            ? "grid-cols-3"
            : navItems.length === 4
              ? "grid-cols-4"
              : "grid-cols-5"
        }`}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              [
                "flex h-full flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition",
                isActive
                  ? "text-primary font-bold"
                  : "text-text-muted hover:text-primary",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-xl text-[20px] transition",
                    isActive ? "bg-primary-soft text-primary" : "",
                  ].join(" ")}
                >
                  {item.icon}
                </span>

                <span className="leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default AppMobileBottomNav;
