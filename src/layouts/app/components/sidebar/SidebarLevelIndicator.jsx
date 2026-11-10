// src/layouts/app/components/sidebar/SidebarLevelIndicator.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Building2,
  Store,
  ChevronRight,
  ChevronLeft,
  ChevronsUpDown,
  Check,
  X,
  ArrowUp,
  ArrowRight,
} from "lucide-react";

import { API_STATUS, TOKEN_KEY } from "@/constants";
import { storage } from "@/utils";
import useCompany from "@/features/company/hooks/useCompany";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import useBranch from "@/features/branch/hooks/useBranch";
import { usePermission } from "@/hooks";
import { useSetupStatus } from "@/features/setup/hooks/useSetupStatus";
import {
  useNavigationPipeline,
  PIPELINE_STORAGE_KEYS,
} from "@/contexts/NavigationPipelineContext";
import { UISkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Clean Company Initial / Logo Badge
 */
const CompanyAvatar = ({ company, size = "md", className = "", isSetupPending = false }) => {
  const sizeClasses = {
    sm: "size-6 text-[11px] rounded-[6px]",
    md: "size-7 text-xs rounded-[7px]",
    lg: "size-8 text-[13px] rounded-[8px]",
  };

  if (isSetupPending) {
    return (
      <div
        className={cn(
          sizeClasses[size] || sizeClasses.md,
          "flex shrink-0 items-center justify-center bg-primary/10 text-primary font-bold border border-primary/20 shadow-2xs",
          className
        )}
      >
        <Building2 className="size-3.5" />
      </div>
    );
  }

  const name = company?.name || "Company";
  const initial = name.charAt(0).toUpperCase();

  if (company?.logo) {
    return (
      <img
        src={company.logo}
        alt={name}
        className={cn(
          sizeClasses[size] || sizeClasses.md,
          "shrink-0 object-cover border border-border/60",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClasses[size] || sizeClasses.md,
        "flex shrink-0 items-center justify-center bg-primary-soft text-primary font-bold border border-primary/20 shadow-2xs",
        className
      )}
    >
      {initial}
    </div>
  );
};

/**
 * Shimmering Skeleton List
 */
const SelectorSkeletonList = ({ count = 3, iconType = "avatar" }) => {
  return (
    <div className="space-y-1 py-0.5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-2.5 rounded-[8px] px-2.5 py-2 bg-surface-alt/40"
        >
          <div className="flex min-w-0 items-center gap-2.5 flex-1">
            {iconType === "avatar" ? (
              <UISkeleton className="size-6 rounded-[5px] shrink-0" />
            ) : (
              <div className="flex size-6 shrink-0 items-center justify-center rounded-[5px] bg-border/80">
                <Store className="size-3.5 opacity-30" />
              </div>
            )}
            <UISkeleton className={`h-3.5 ${index % 2 === 0 ? "w-28" : "w-36"} rounded-[4px]`} />
          </div>
          <UISkeleton className="size-3.5 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
};

export const SidebarLevelIndicator = ({
  collapsed = false,
  onToggleCollapse,
  onExpand,
  showClose = false,
  onClose,
  onOpenChange,
}) => {
  const dispatch = useDispatch();
  const triggerRef = useRef(null);
  const companyTriggerRef = useRef(null);
  const branchTriggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const {
    isWorkspaceLevel,
    isCompanyLevel,
    isBranchLevel,
    ascendToWorkspace,
    ascendToCompany,
    enterCompany,
    enterBranch,
    triggerTransition,
  } = useNavigationPipeline();

  const { currentWorkspace } = useWorkspace();
  const { isOwner } = usePermission();
  const {
    companies = [],
    currentCompany,
    setCurrentCompany,
    getWorkspaceCompanies,
    getWorkspaceCompaniesStatus,
  } = useCompany();
  const {
    branches = [],
    currentBranch,
    setCurrentBranch,
    clearCurrentBranch,
    getCompanyBranches,
    getCompanyBranchesStatus,
  } = useBranch();
  const { companyCompleted } = useSetupStatus();

  const lastFetchedBranchesCompanyRef = useRef(null);

  // Proactively fetch companies once if workspace exists and companies have not been fetched yet
  useEffect(() => {
    if (
      currentWorkspace?._id &&
      getWorkspaceCompaniesStatus === API_STATUS.IDLE &&
      Boolean(storage.get(TOKEN_KEY))
    ) {
      getWorkspaceCompanies().catch(() => null);
    }
  }, [
    currentWorkspace?._id,
    getWorkspaceCompaniesStatus,
    getWorkspaceCompanies,
  ]);

  // Proactively fetch branches once per active company change
  useEffect(() => {
    if (!currentCompany?._id) {
      lastFetchedBranchesCompanyRef.current = null;
      return;
    }

    if (
      Boolean(storage.get(TOKEN_KEY)) &&
      lastFetchedBranchesCompanyRef.current !== currentCompany._id &&
      getCompanyBranchesStatus !== API_STATUS.LOADING
    ) {
      lastFetchedBranchesCompanyRef.current = currentCompany._id;
      getCompanyBranches(currentCompany._id).catch(() => null);
    }
  }, [currentCompany?._id, getCompanyBranches, getCompanyBranchesStatus]);

  // "companies" | "branches"
  const [dropdownType, setDropdownType] = useState("companies");
  const [isOpen, setIsOpen] = useState(false);

  const dropdownOpen = isOpen && !collapsed;

  // Notify parent of dropdown open state to prevent unwanted auto-collapse
  useEffect(() => {
    onOpenChange?.(dropdownOpen);
  }, [dropdownOpen, onOpenChange]);

  const [dropdownCoords, setDropdownCoords] = useState({
    top: 0,
    left: 0,
    width: 240,
  });
  const [collapsedTooltip, setCollapsedTooltip] = useState(null);

  const isCompanyLoading =
    getWorkspaceCompaniesStatus === API_STATUS.LOADING ||
    (getWorkspaceCompaniesStatus === API_STATUS.IDLE && !companies?.length);

  const isBranchLoading =
    getCompanyBranchesStatus === API_STATUS.LOADING ||
    (Boolean(currentCompany?._id) &&
      getCompanyBranchesStatus === API_STATUS.IDLE &&
      !branches?.length);

  const hasNoCompanyAccess = !isOwner && !isCompanyLoading && companies.length === 0;
  const hasNoBranchAccess =
    !isOwner && !isBranchLoading && companies.length > 0 && branches.length === 0;

  // Toggle Dropdown with specific type
  const handleToggleDropdown = (type) => {
    if (dropdownOpen && dropdownType === type) {
      setIsOpen(false);
    } else {
      setDropdownType(type);
      setIsOpen(true);

      if (!storage.get(TOKEN_KEY)) return;

      if (type === "companies") {
        if (
          getWorkspaceCompaniesStatus !== API_STATUS.LOADING &&
          (!companies?.length || getWorkspaceCompaniesStatus === API_STATUS.ERROR)
        ) {
          getWorkspaceCompanies().catch(() => null);
        }
      } else if (type === "branches") {
        if (
          currentCompany?._id &&
          getCompanyBranchesStatus !== API_STATUS.LOADING &&
          (!branches?.length || getCompanyBranchesStatus === API_STATUS.ERROR)
        ) {
          getCompanyBranches(currentCompany._id).catch(() => null);
        }
      }
    }
  };

  // Position calculation for floating dropdown portal
  const updateDropdownPosition = useCallback(() => {
    const activeEl = collapsed
      ? triggerRef.current
      : dropdownType === "branches"
        ? branchTriggerRef.current || triggerRef.current
        : companyTriggerRef.current || triggerRef.current;

    if (!activeEl) return;
    const rect = activeEl.getBoundingClientRect();

    if (collapsed) {
      setDropdownCoords({
        top: Math.max(8, Math.min(Math.round(rect.top), window.innerHeight - 340)),
        left: Math.round(rect.right + 8),
        width: 250,
      });
    } else {
      const roundedLeft = Math.round(rect.left);
      const targetWidth = Math.min(250, Math.max(225, Math.round(rect.width)));
      const spaceBelow = window.innerHeight - rect.bottom;
      const topPos =
        spaceBelow < 300
          ? Math.max(8, Math.round(rect.top - 280))
          : Math.round(rect.bottom + 6);

      setDropdownCoords({
        top: topPos,
        left: roundedLeft,
        width: targetWidth,
      });
    }
  }, [collapsed, dropdownType]);

  useEffect(() => {
    if (dropdownOpen) {
      updateDropdownPosition();
      const handleResize = () => updateDropdownPosition();
      window.addEventListener("resize", handleResize, { passive: true });
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [dropdownOpen, updateDropdownPosition]);

  // Click outside and escape handling
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (event) => {
      const isInsideTrigger =
        (triggerRef.current && triggerRef.current.contains(event.target)) ||
        (companyTriggerRef.current && companyTriggerRef.current.contains(event.target)) ||
        (branchTriggerRef.current && branchTriggerRef.current.contains(event.target));

      if (
        !isInsideTrigger &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  // Switch / Enter Company Handler
  const handleSelectCompany = (company) => {
    if (!company?._id) return;
    setIsOpen(false);

    if (isWorkspaceLevel) {
      // Descending from Workspace -> Company: exactly ONE loader ("Entering Company Level")
      enterCompany(company);
      getCompanyBranches(company._id).catch(() => null);
    } else {
      // Peer switch at Company level: exactly ONE loader ("Switching Company")
      if (company._id === currentCompany?._id) return;

      triggerTransition({
        type: "company",
        title: "Switching Company",
        fromName: currentCompany?.name || currentWorkspace?.name || "Company",
        toName: company.name,
        duration: 650,
      });

      dispatch({ type: "APP/RESET_STATE" });
      setCurrentCompany(company);
      clearCurrentBranch();
      try {
        localStorage.setItem(PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID, company._id);
        localStorage.removeItem(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID);
      } catch {
        // ignore storage errors
      }

      // Pre-fetch branches for newly selected company in background
      getCompanyBranches(company._id).catch(() => null);
    }
  };

  // Switch / Enter Branch Handler
  const handleSelectBranch = (branch) => {
    if (!branch?._id) return;
    setIsOpen(false);

    if (isCompanyLevel) {
      // Descending from Company -> Branch: exactly ONE loader ("Entering Branch Level")
      enterBranch(branch);
    } else {
      // Peer switch at Branch level: exactly ONE loader ("Switching Branch")
      if (branch._id === currentBranch?._id) return;

      triggerTransition({
        type: "branch",
        title: "Switching Branch",
        fromName: currentBranch?.name || currentCompany?.name || "Branch",
        toName: branch.name,
        duration: 650,
      });

      dispatch({ type: "APP/RESET_STATE" });
      setCurrentBranch(branch);
      try {
        localStorage.setItem(PIPELINE_STORAGE_KEYS.ACTIVE_BRANCH_ID, branch._id);
      } catch {
        // ignore storage errors
      }
    }
  };

  // Tooltip for collapsed mode
  const handleMouseEnter = () => {
    if (!collapsed || !triggerRef.current || dropdownOpen) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCollapsedTooltip({
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    });
  };

  const handleMouseLeave = () => {
    setCollapsedTooltip(null);
  };

  // Common Collapse / Close Button on Right
  const collapseOrCloseButton = (
    <div className="flex items-center shrink-0">
      {onToggleCollapse && !showClose && (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
          className="flex size-6.5 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-text-muted transition hover:bg-surface-hover hover:text-text active:scale-[0.95]"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}

      {showClose && onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="flex size-6.5 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-text-muted transition hover:bg-surface-hover hover:text-text active:scale-[0.95]"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );

  // Floating Dropdown Content Renderer
  const renderDropdownContent = () => {
    if (dropdownType === "companies") {
      return (
        <div>
          <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
            <span>{isWorkspaceLevel ? "Select any company" : "Switch Company"}</span>
            <span className="text-[10px] font-normal lowercase">({companies.length})</span>
          </div>

          <div className="max-h-[220px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-0.5 mt-1">
            {isCompanyLoading ? (
              <SelectorSkeletonList count={3} iconType="avatar" />
            ) : companies?.length ? (
              companies.map((comp) => {
                const isSelected = comp?._id === currentCompany?._id;
                return (
                  <button
                    key={comp?._id}
                    type="button"
                    onClick={() => handleSelectCompany(comp)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-[8px] px-2 py-1.5 text-left transition-all active:scale-[0.98] ${
                      isSelected
                        ? "bg-primary-soft/60 text-primary font-bold"
                        : "text-text hover:bg-surface-hover"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <CompanyAvatar company={comp} size="sm" />
                      <span className="truncate text-xs font-semibold">{comp?.name}</span>
                    </div>
                    {isSelected ? (
                      <Check className="size-3.5 shrink-0 text-primary stroke-[2.5]" />
                    ) : (
                      <ArrowRight className="size-3 shrink-0 text-text-muted" />
                    )}
                  </button>
                );
              })
            ) : hasNoCompanyAccess ? (
              <div className="p-3 text-center text-xs text-text-muted space-y-1 bg-surface-alt/40 rounded-[8px] border border-dashed border-border/70">
                <p className="font-semibold text-text">No company access</p>
                <p className="text-[11px]">No companies are assigned to your account.</p>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-text-muted space-y-1">
                <p className="font-semibold text-text">No companies created yet</p>
                <p className="text-[11px]">Set up your legal entity to continue.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Branch Dropdown
    return (
      <div>
        <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
          <span className="truncate">
            {isCompanyLevel ? "Select any branch" : "Switch Branch"}
          </span>
          <span className="text-[10px] font-normal lowercase">({branches.length})</span>
        </div>

        <div className="max-h-[220px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-0.5 mt-1">
          {isBranchLoading ? (
            <SelectorSkeletonList count={3} iconType="branch" />
          ) : branches?.length ? (
            branches.map((br) => {
              const isSelected = br?._id === currentBranch?._id;
              return (
                <button
                  key={br?._id}
                  type="button"
                  onClick={() => handleSelectBranch(br)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-[8px] px-2 py-1.5 text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? "bg-primary-soft/60 text-primary font-bold"
                      : "text-text hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex size-5.5 shrink-0 items-center justify-center rounded-[5px] bg-primary/10 text-primary">
                      <Store className="size-3" />
                    </div>
                    <span className="truncate text-xs font-semibold">{br?.name}</span>
                  </div>
                  {isSelected ? (
                    <Check className="size-3.5 shrink-0 text-primary stroke-[2.5]" />
                  ) : (
                    <ArrowRight className="size-3 shrink-0 text-text-muted" />
                  )}
                </button>
              );
            })
          ) : hasNoBranchAccess ? (
            <div className="p-3 text-center text-xs text-text-muted space-y-1 bg-surface-alt/40 rounded-[8px] border border-dashed border-border/70">
              <p className="font-semibold text-text">No branch access</p>
              <p className="text-[11px]">No branches assigned under this company.</p>
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-text-muted space-y-1">
              <p className="font-semibold text-text">No branch created yet</p>
              <p className="text-[11px]">Add your primary branch to complete setup.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. COLLAPSED MINI-RAIL VIEW (68px)
  // ─────────────────────────────────────────────────────────────────────────────
  if (collapsed) {
    const collapsedConfig = isWorkspaceLevel
      ? {
          title: currentWorkspace?.name || "Workspace",
          tag: "L1",
          icon: Layers,
          color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
          tagColor: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
          defaultType: "companies",
        }
      : isCompanyLevel
      ? {
          title: currentCompany?.name || "Company",
          tag: "L2",
          icon: Building2,
          color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
          tagColor: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
          defaultType: "branches",
        }
      : {
          title: currentBranch?.name || "Branch",
          tag: "L3",
          icon: Store,
          color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          tagColor: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
          defaultType: "branches",
        };

    const RailIcon = collapsedConfig.icon;
    const handleCollapsedExpand = () => {
      setCollapsedTooltip(null);
      setIsOpen(false);
      if (onExpand) {
        onExpand();
      } else {
        onToggleCollapse?.();
      }
    };

    return (
      <div className="relative flex flex-col items-center justify-center border-b border-border p-2 gap-1.5">
          <button
            ref={triggerRef}
            type="button"
            onClick={handleCollapsedExpand}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            aria-label={`${collapsedConfig.title} — Expand sidebar`}
            className={cn(
              "relative flex size-9 cursor-pointer items-center justify-center rounded-xl border shadow-2xs transition-all hover:scale-105 active:scale-[0.96]",
              collapsedConfig.color
            )}
          >
            <RailIcon className="size-4" />
            <span
              className={cn(
                "absolute -top-1 -right-1 px-1 py-0.2 rounded-full text-[8.5px] font-extrabold uppercase leading-none border border-border shadow-2xs",
                collapsedConfig.tagColor
              )}
            >
              {collapsedConfig.tag}
            </span>
          </button>

          {(onExpand || onToggleCollapse) && (
            <button
              type="button"
              onClick={handleCollapsedExpand}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="flex size-6 cursor-pointer items-center justify-center rounded-md text-text-muted transition hover:bg-surface-hover hover:text-text active:scale-[0.95]"
            >
              <ChevronRight className="size-3.5" />
            </button>
          )}

          {/* Floating Tooltip */}
          {collapsedTooltip &&
            createPortal(
              <div
                style={{
                  position: "fixed",
                  top: collapsedTooltip.top,
                  left: collapsedTooltip.left,
                  transform: "translateY(-50%)",
                  zIndex: 9999,
                }}
                className="pointer-events-none rounded-[6px] border border-border bg-surface px-2.5 py-1.5 text-xs text-text shadow-[var(--app-shadow-lg)] whitespace-nowrap space-y-0.5"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "px-1 py-0.2 rounded text-[9px] font-extrabold uppercase leading-none",
                      collapsedConfig.tagColor
                    )}
                  >
                    {collapsedConfig.tag}
                  </span>
                  <p className="font-bold text-text">{collapsedConfig.title}</p>
                </div>
                <p className="text-[10px] text-text-muted">Click to expand sidebar</p>
              </div>,
              document.body
            )}
        </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. EXPANDED VIEW (Desktop 240px & Mobile Drawer 275px)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex flex-col shrink-0 border-b border-border bg-surface/50">
        {/* ── LEVEL 1: WORKSPACE ─────────────────────────────────────── */}
        {isWorkspaceLevel && (
          <div className="flex flex-col gap-1.5 p-2.5">
            {/* Identity & Collapse */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-2xs">
                  <Layers className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 leading-none">
                    Workspace
                  </div>
                  <div
                    className="text-[13px] font-bold text-text truncate leading-tight mt-0.5"
                    title={currentWorkspace?.name}
                  >
                    {currentWorkspace?.name || "Global Workspace"}
                  </div>
                </div>
              </div>

              {collapseOrCloseButton}
            </div>

            {/* Gateway to Company (No Branch Shown) */}
            <button
              ref={companyTriggerRef}
              type="button"
              onClick={() => handleToggleDropdown("companies")}
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[8px] border border-border/80 bg-surface-alt/60 hover:bg-surface-hover px-2.5 py-1.5 text-left transition-all active:scale-[0.98] shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="size-3.5 text-primary shrink-0" />
                <span className="truncate text-xs font-semibold text-text">
                  {currentCompany?.name ? `Enter: ${currentCompany.name}` : "Select any company"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-text-muted">
                <span className="text-[10.5px] font-medium text-text-muted/80">{companies.length}</span>
                <ChevronsUpDown className="size-3" />
              </div>
            </button>
          </div>
        )}

        {/* ── LEVEL 2: COMPANY ───────────────────────────────────────── */}
        {isCompanyLevel && (
          <div className="flex flex-col gap-1.5 p-2.5">
            {/* Top: Go Up to Workspace + Collapse */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <button
                type="button"
                onClick={ascendToWorkspace}
                title="Ascend to Workspace"
                className="flex items-center gap-1.5 px-1.5 py-0.5 -ml-1 rounded-md text-[11px] font-semibold text-text-muted hover:text-primary hover:bg-surface-hover transition-all cursor-pointer group"
              >
                <ArrowUp className="size-3 text-purple-500 group-hover:-translate-y-0.5 transition-transform" />
                <span className="truncate max-w-[155px]">
                  {currentWorkspace?.name || "Workspace"}
                </span>
              </button>

              {collapseOrCloseButton}
            </div>

            {/* Active Company Selector */}
            <button
              ref={companyTriggerRef}
              type="button"
              onClick={() => handleToggleDropdown("companies")}
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[8px] p-1.5 text-left hover:bg-surface-hover transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CompanyAvatar company={currentCompany} size="sm" isSetupPending={!companyCompleted} />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 leading-none">
                    Company
                  </div>
                  <div
                    className="text-[13px] font-bold text-text truncate leading-tight mt-0.5"
                    title={currentCompany?.name}
                  >
                    {currentCompany?.name || "Select Company"}
                  </div>
                </div>
              </div>
              <ChevronsUpDown className="size-3.5 text-text-muted shrink-0" />
            </button>

            {/* Gateway to Branch */}
            <button
              ref={branchTriggerRef}
              type="button"
              onClick={() => handleToggleDropdown("branches")}
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[8px] border border-border/80 bg-surface-alt/60 hover:bg-surface-hover px-2.5 py-1.5 text-left transition-all active:scale-[0.98] shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Store className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate text-xs font-semibold text-text">
                  {currentBranch?.name ? `Enter: ${currentBranch.name}` : "Select any branch"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-text-muted">
                <span className="text-[10.5px] font-medium text-text-muted/80">{branches.length}</span>
                <ChevronsUpDown className="size-3" />
              </div>
            </button>
          </div>
        )}

        {/* ── LEVEL 3: BRANCH ────────────────────────────────────────── */}
        {isBranchLevel && (
          <div className="flex flex-col gap-1.5 p-2.5">
            {/* Top: Go Up to Company + Collapse */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <button
                type="button"
                onClick={ascendToCompany}
                title="Ascend to Company"
                className="flex items-center gap-1.5 px-1.5 py-0.5 -ml-1 rounded-md text-[11px] font-semibold text-text-muted hover:text-primary hover:bg-surface-hover transition-all cursor-pointer group"
              >
                <ArrowUp className="size-3 text-blue-500 group-hover:-translate-y-0.5 transition-transform" />
                <span className="truncate max-w-[155px]">
                  {currentCompany?.name || "Company"}
                </span>
              </button>

              {collapseOrCloseButton}
            </div>

            {/* Active Branch Selector */}
            <button
              ref={branchTriggerRef}
              type="button"
              onClick={() => handleToggleDropdown("branches")}
              className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[8px] p-1.5 text-left hover:bg-surface-hover transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                  <Store className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 leading-none">
                    Branch
                  </div>
                  <div
                    className="text-[13px] font-bold text-text truncate leading-tight mt-0.5"
                    title={currentBranch?.name}
                  >
                    {currentBranch?.name || "Select Branch"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-text-muted">
                <span className="text-[10.5px] font-medium text-text-muted/80">{branches.length}</span>
                <ChevronsUpDown className="size-3.5" />
              </div>
            </button>
          </div>
        )}

        {/* Floating Portal Dropdown */}
        {createPortal(
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, scale: 0.97, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -4 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  position: "fixed",
                  top: dropdownCoords.top,
                  left: dropdownCoords.left,
                  width: dropdownCoords.width,
                  zIndex: 9999,
                }}
                className="overflow-hidden rounded-[14px] border border-border bg-surface p-2 shadow-[var(--app-shadow-xl)]"
              >
                {renderDropdownContent()}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
  );
};

export default SidebarLevelIndicator;
