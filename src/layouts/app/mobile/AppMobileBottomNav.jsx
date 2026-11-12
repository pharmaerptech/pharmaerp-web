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
import usePermission from "@/hooks/usePermission";

const AppMobileBottomNav = () => {
  const { isSetupComplete, companyCompleted, branchCompleted } = useSetupStatus();
  const { workMode } = useWorkMode();
  const { currentLevel } = useNavigationPipeline();
  const { isOwner, isLoaded, can, canAny, canWorkLevel, canWorkMode } =
    usePermission();

  const setupNavItems = [
    ...(isOwner || canWorkLevel(PIPELINE_LEVELS.WORKSPACE)
      ? [
          {
            label: "Setup",
            path: ROUTES.SETUP_CENTER,
            icon: <FiCheckCircle />,
            end: true,
          },
        ]
      : []),
    ...(companyCompleted && (isOwner || canWorkLevel(PIPELINE_LEVELS.COMPANY))
      ? [
          {
            label: "Companies",
            path: ROUTES.COMPANIES,
            icon: <FiBriefcase />,
          },
        ]
      : []),
    ...(companyCompleted &&
    branchCompleted &&
    (isOwner || canWorkLevel(PIPELINE_LEVELS.BRANCH))
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
    let items = [];

    if (currentLevel === PIPELINE_LEVELS.WORKSPACE) {
      items = isOp
        ? [
            { label: "Companies", path: ROUTES.COMPANIES, icon: <FiBriefcase />, permission: "company:view", level: "workspace", mode: "operation" },
            { label: "Members", path: ROUTES.WORKSPACE_MEMBERS, icon: <FiUsers />, permission: "workspace-member:view", level: "workspace", mode: "operation" },
            { label: "Roles", path: ROUTES.ROLES, icon: <FiShield />, permission: "role:view", level: "workspace", mode: "operation" },
            { label: "Settings", path: ROUTES.SETTINGS, icon: <FiMoreHorizontal /> },
          ]
        : [
            { label: "Dashboard", path: ROUTES.WORKSPACE_DASHBOARD, icon: <FiHome />, end: true, permission: "dashboard:view", level: "workspace", mode: "view" },
            { label: "Companies", path: ROUTES.COMPANIES, icon: <FiBriefcase />, permission: "company:view", level: "workspace", mode: "view" },
            { label: "Members", path: ROUTES.WORKSPACE_MEMBERS, icon: <FiUsers />, permission: "workspace-member:view", level: "workspace", mode: "view" },
            { label: "Roles", path: ROUTES.ROLES, icon: <FiShield />, permission: "role:view", level: "workspace", mode: "view" },
            { label: "Settings", path: ROUTES.SETTINGS, icon: <FiMoreHorizontal /> },
          ];
    } else if (currentLevel === PIPELINE_LEVELS.COMPANY) {
      items = isOp
        ? [
            { label: "Branches", path: ROUTES.BRANCHES, icon: <FiMapPin />, permission: "branch:view", level: "company", mode: "operation" },
            { label: "Customers", path: ROUTES.CUSTOMERS, icon: <FiUsers />, permission: "customer:view", level: "company", mode: "operation" },
            { label: "Suppliers", path: ROUTES.SUPPLIERS, icon: <FiBriefcase />, permission: "supplier:view", level: "company", mode: "operation" },
            { label: "Accounts", path: ROUTES.ACCOUNTS, icon: <FiFileText />, permission: "account:view", level: "company", mode: "operation" },
            { label: "Settings", path: ROUTES.SETTINGS, icon: <FiMoreHorizontal /> },
          ]
        : [
            { label: "Dashboard", path: ROUTES.COMPANY_DASHBOARD, icon: <FiHome />, end: true, permission: "dashboard:view", level: "company", mode: "view" },
            { label: "Branches", path: ROUTES.BRANCHES, icon: <FiMapPin />, permission: "branch:view", level: "company", mode: "view" },
            { label: "GSTR-1", path: ROUTES.GSTR1, icon: <FiFileText />, permission: "report:view", level: "company", mode: "view" },
            { label: "Reports", path: ROUTES.REPORTS, icon: <FiBarChart2 />, permission: "report:view", level: "company", mode: "view" },
            { label: "Settings", path: ROUTES.SETTINGS, icon: <FiMoreHorizontal /> },
          ];
    } else {
      items = isOp
        ? [
            { label: "POS", path: ROUTES.SALES, icon: <FiShoppingCart />, permission: "sale:create", level: "branch", mode: "operation" },
            { label: "Invoices", path: ROUTES.BILLING, icon: <FiFileText />, permission: "sale:view", level: "branch", mode: "operation" },
            { label: "Stock", path: ROUTES.WORKSPACE_PRODUCTS, icon: <FiBox />, permission: "product:view", level: "branch", mode: "operation" },
            { label: "Shifts", path: "/operations/shifts", icon: <FiClock />, permission: "sale:view", level: "branch", mode: "operation" },
            { label: "Settings", path: ROUTES.SETTINGS, icon: <FiMoreHorizontal /> },
          ]
        : [
            { label: "Dashboard", path: ROUTES.BRANCH_DASHBOARD, icon: <FiHome />, end: true, permission: "dashboard:view", level: "branch", mode: "view" },
            { label: "Reports", path: ROUTES.REPORTS_HUB, icon: <FiBarChart2 />, permission: "report:view", level: "branch", mode: "view" },
            { label: "Stock", path: ROUTES.STOCK_METRICS, icon: <FiBox />, permission: "stock:view", level: "branch", mode: "view" },
            { label: "Settings", path: ROUTES.SETTINGS, icon: <FiMoreHorizontal /> },
          ];
    }

    if (!isLoaded || isOwner) return items;

    return items.filter((item) => {
      if (item.level && !canWorkLevel(item.level)) return false;
      if (item.mode && !canWorkMode(item.mode)) return false;
      if (item.permissions?.length && !canAny(item.permissions)) return false;
      if (item.permission && !can(item.permission)) return false;
      return true;
    });
  }, [currentLevel, workMode, isLoaded, isOwner, canWorkLevel, canWorkMode, can, canAny]);

  const navItems = isSetupComplete ? contextNavItems : setupNavItems;
  const gridColsClass =
    navItems.length <= 2
      ? "grid-cols-2"
      : navItems.length === 3
        ? "grid-cols-3"
        : navItems.length === 4
          ? "grid-cols-4"
          : "grid-cols-5";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur-md">
      <div className={`mx-auto grid h-[64px] max-w-md items-center ${gridColsClass}`}>
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
