import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { UIBadge, uiToast } from "@/components/ui";
import { ROUTES } from "@/constants";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";

/**
 * Check if a path or any child paths match the active pathname
 */
const isBranchActive = (item, pathname, search = "") => {
  if (item.path) {
    const hasQuery = item.path.includes("?");
    if (hasQuery) {
      const [itemPath, itemQuery] = item.path.split("?");
      if (pathname === itemPath && search === `?${itemQuery}`) return true;
    } else {
      if (pathname === item.path) return true;
    }
  }
  if (item.children) {
    return item.children.some((child) => isBranchActive(child, pathname, search));
  }
  return false;
};

/**
 * Evaluates whether an item is gated behind unfinished setup
 */
const checkIsItemLocked = (item, setupInfo) => {
  const { isSetupComplete, companyCompleted } = setupInfo;
  if (isSetupComplete) return false;

  const path = item.path || "";
  const id = item.id || "";

  // Always accessible
  if (
    path === ROUTES.SETUP_CENTER ||
    path === ROUTES.SETTINGS ||
    path === ROUTES.HELP_CENTER ||
    id === "setup-center" ||
    id === "settings" ||
    id === "help"
  ) {
    return false;
  }

  // Companies accessible in Step 1
  if (id === "companies" || path === ROUTES.COMPANIES || path.includes("/companies")) {
    return false;
  }

  // Company Operations, Starter & Branches accessible in Step 2 once company exists
  if (
    id === "company-operations-starter" ||
    id === "company-ops" ||
    id === "company-branches" ||
    id === "company-branches-view" ||
    id === "company-branch-operations-hub" ||
    id === "branches" ||
    path === ROUTES.COMPANY_OPERATIONS_STARTER ||
    path === ROUTES.BRANCH_OPERATIONS_HUB ||
    path === ROUTES.BRANCHES ||
    path.startsWith("/company/operations") ||
    path.startsWith("/branch-operations") ||
    path.includes("/branches")
  ) {
    return !companyCompleted;
  }

  // If item has children, check if any child is accessible
  if (item.children && item.children.length > 0) {
    return item.children.every((child) => checkIsItemLocked(child, setupInfo));
  }

  // All other operational routes require full setup
  return true;
};

const SidebarItem = ({
  item,
  level = 1,
  collapsed = false,
  onItemClick,
  onExpand,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const setupInfo = useSetupStatus();
  const { isSetupComplete, completedCount, totalSteps } = setupInfo;

  const hasChildren = Boolean(item.children && item.children.length > 0);
  const activeInBranch = isBranchActive(item, location.pathname, location.search);
  const isLocked = useMemo(() => checkIsItemLocked(item, setupInfo), [item, setupInfo]);

  // Auto-expand if active route is inside this branch
  const [isOpen, setIsOpen] = useState(activeInBranch);

  // Tooltip coordinates for unclipped portal tooltip in collapsed rail mode
  const [tooltipPos, setTooltipPos] = useState(null);
  const itemRef = useRef(null);

  useEffect(() => {
    if (activeInBranch) {
      setIsOpen(true);
    }
  }, [location.pathname, activeInBranch]);

  const handleMouseEnter = () => {
    if (!collapsed || !itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    setTooltipPos({
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    });
  };

  const handleMouseLeave = () => {
    setTooltipPos(null);
  };

  const handleLockedClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    uiToast.info("Setup Required", `Complete setup to unlock ${item.label}`);
    navigate(ROUTES.SETUP_CENTER);
  };

  const Icon = item.icon;

  // Dynamic badge for Setup Center vs custom badge
  const displayBadge = useMemo(() => {
    if (item.id === "setup-center" || item.path === ROUTES.SETUP_CENTER) {
      if (!isSetupComplete) {
        return `${completedCount}/${totalSteps}`;
      }
      return null;
    }
    return item.badge || null;
  }, [item, isSetupComplete, completedCount, totalSteps]);

  // ── Collapsed Rail Mode ────────────────────────────────────────────
  if (collapsed) {
    const handleCollapsedParentClick = (e) => {
      setTooltipPos(null);
      if (isLocked) {
        handleLockedClick(e);
        return;
      }

      if (hasChildren) {
        setIsOpen(true);
        onItemClick?.(e);
      } else {
        onItemClick?.(e);
      }
    };

    return (
      <div
        ref={itemRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative flex justify-center py-0.5"
      >
        {item.path && !isLocked ? (
          <NavLink
            to={item.path.includes("?") ? { pathname: item.path.split("?")[0], search: `?${item.path.split("?")[1]}` } : item.path}
            onClick={(e) => {
              setTooltipPos(null);
              if (hasChildren) {
                setIsOpen(true);
              }
              onItemClick?.(e);
            }}
            title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
            className={() => {
              const isItemActive = item.path.includes("?")
                ? location.pathname === item.path.split("?")[0] && location.search === `?${item.path.split("?")[1]}`
                : location.pathname === item.path;
              return cn(
                "flex size-9 items-center justify-center rounded-[8px] transition-colors duration-150 relative cursor-pointer",
                isItemActive
                  ? "bg-primary/10 text-primary"
                  : "text-text hover:bg-surface-hover"
              );
            }}
          >
            {Icon && <Icon className="size-4" />}
            {displayBadge && (
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" />
            )}
          </NavLink>
        ) : (
          <button
            type="button"
            onClick={handleCollapsedParentClick}
            title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
            className={cn(
              "flex size-9 items-center justify-center rounded-[8px] transition-colors duration-150 cursor-pointer relative",
              isLocked && "opacity-50 hover:opacity-80",
              activeInBranch
                ? "bg-primary/10 text-primary"
                : "text-text hover:bg-surface-hover"
            )}
          >

            {Icon && <Icon className="size-4" />}
            {isLocked && (
              <span className="absolute -bottom-0.5 -right-0.5 flex size-3 items-center justify-center rounded-full bg-surface border border-border text-text-muted">
                <Lock className="size-2" />
              </span>
            )}
          </button>
        )}

        {/* Unclipped Portal Floating Tooltip */}
        {tooltipPos &&
          createPortal(
            <div
              style={{
                position: "fixed",
                top: tooltipPos.top,
                left: tooltipPos.left,
                transform: "translateY(-50%)",
                zIndex: 9999,
              }}
              className="pointer-events-none flex items-center gap-1.5 rounded-[6px] border border-border bg-surface px-2.5 py-1 text-[12px] font-medium text-text shadow-[var(--app-shadow-lg)] whitespace-nowrap"
            >
              <span>{item.label}</span>
              {isLocked ? (
                <span className="text-[10px] text-text-muted font-normal flex items-center gap-1 text-warning">
                  <Lock className="size-2.5" /> (Locked)
                </span>
              ) : item.children ? (
                <span className="text-[10px] text-text-muted font-normal">
                  ({item.children.length})
                </span>
              ) : null}
            </div>,
            document.body
          )}
      </div>
    );
  }

  // ── Expanded Mode: Strictly 13px font size across ALL levels ─────────
  return (
    <div ref={itemRef} className="flex flex-col">
      {hasChildren ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2.5 rounded-[8px] px-2.5",
            "text-[13px] font-medium text-text transition-colors duration-150 cursor-pointer select-none",
            "hover:bg-surface-hover",
            isLocked && "opacity-60",
            activeInBranch && "text-text"
          )}
        >
          {/* Left: Icon + Label */}
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  activeInBranch ? "text-primary" : "text-text-muted"
                )}
              />
            )}
            <span className="truncate text-[13px] font-medium text-text">{item.label}</span>
            {isLocked && <Lock className="size-3 shrink-0 text-text-muted/60" />}
          </div>

          {/* Right: Expand/Collapse Arrow */}
          <span className="shrink-0 text-text-muted transition-transform duration-150">
            {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </span>
        </button>
      ) : isLocked ? (
        <button
          type="button"
          onClick={handleLockedClick}
          className="flex h-9 w-full items-center justify-between gap-2.5 rounded-[8px] px-2.5 text-[13px] font-medium text-text-muted transition-colors duration-150 select-none hover:bg-surface-hover opacity-60 hover:opacity-90 cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && <Icon className="size-4 shrink-0 text-text-muted/70" />}
            <span className="truncate text-[13px] font-medium text-text-muted">{item.label}</span>
          </div>

          <span className="inline-flex items-center gap-1 rounded-md bg-surface-alt px-1.5 py-0.5 text-[10px] font-semibold text-text-muted border border-border/60">
            <Lock className="size-2.5" />
            <span>Locked</span>
          </span>
        </button>
      ) : (
        <NavLink
          to={item.path.includes("?") ? { pathname: item.path.split("?")[0], search: `?${item.path.split("?")[1]}` } : item.path}
          onClick={onItemClick}
          className={() => {
            const isItemActive = item.path.includes("?")
              ? location.pathname === item.path.split("?")[0] && location.search === `?${item.path.split("?")[1]}`
              : location.pathname === item.path;
            return cn(
              "group flex h-9 items-center justify-between gap-2.5 rounded-[8px] px-2.5",
              "text-[13px] font-medium transition-colors duration-150 select-none",
              isItemActive
                ? "bg-primary/10 text-primary hover:bg-primary/15 font-medium"
                : "text-text hover:bg-surface-hover"
            );
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  "text-current"
                )}
              />
            )}
            <span className="truncate text-[13px] font-medium text-current">{item.label}</span>
          </div>

          {/* Right side: Quick Filter Pills, Marg Shortcut Badge, OR Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            {item.quickFilters && item.quickFilters.length > 0 && (
              item.quickFilters.map((qf) => {
                const isFilterActive =
                  location.pathname === item.path &&
                  location.search === `?segment=${qf.segment}`;

                return (
                  <span
                    key={qf.segment}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`${item.path}?segment=${qf.segment}`);
                      onItemClick?.(e);
                    }}
                    className={cn(
                      "inline-flex items-center px-1.5 py-0.5 rounded-[5px] text-[10px] font-bold cursor-pointer transition-all duration-150",
                      isFilterActive
                        ? "bg-primary text-white"
                        : "bg-surface-alt text-text-muted hover:bg-surface-hover hover:text-text border border-border/60"
                    )}
                  >
                    {qf.label}
                  </span>
                );
              })
            )}

            {item.shortcut && (
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-[4px] border border-border/70 bg-surface-alt/80 text-[9.5px] font-mono font-medium text-text-muted/80 opacity-0 group-hover:opacity-100 transition-opacity select-none shadow-2xs">
                {item.shortcut}
              </kbd>
            )}

            {displayBadge && (
              <UIBadge
                variant={item.id === "setup-center" && !isSetupComplete ? "primary" : "primary"}
                size="xs"
                className={item.id === "setup-center" && !isSetupComplete ? "animate-pulse font-bold" : ""}
              >
                {displayBadge}
              </UIBadge>
            )}
          </div>
        </NavLink>


      )}

      {/* Nested Children Tree */}
      <AnimatePresence initial={false}>
        {hasChildren && isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="relative ml-4 pl-2.5 pt-0.5 space-y-0.5 border-l border-border/80">
              {item.children.map((child) => (
                <SidebarItem
                  key={child.id || child.label}
                  item={child}
                  level={level + 1}
                  collapsed={false}
                  onItemClick={onItemClick}
                  onExpand={onExpand}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SidebarItem;
