// src/layouts/app/components/header/HeaderElevatorPipeline.jsx

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Building2,
  Store,
  ChevronRight,
  ChevronDown,
  Check,
  Plus,
  ArrowUpRight,
  ArrowUp,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useNavigationPipeline, PIPELINE_LEVELS } from "@/contexts/NavigationPipelineContext";
import { useWorkMode } from "@/contexts/WorkModeContext";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import { cn } from "@/lib/utils";

export const HeaderElevatorPipeline = ({ className = "" }) => {
  const navigate = useNavigate();
  const {
    currentLevel,
    isWorkspaceLevel,
    isCompanyLevel,
    isBranchLevel,
    ascendToWorkspace,
    ascendToCompany,
    enterCompany,
    enterBranch,
  } = useNavigationPipeline();

  const { currentWorkspace } = useWorkspace();
  const { currentCompany, companies, setCurrentCompany } = useCompany();
  const { currentBranch, branches, setCurrentBranch } = useBranch();
  const { workMode } = useWorkMode();

  // Dropdown states for sibling company and branch switchers
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);

  const companyMenuRef = useRef(null);
  const branchMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (companyMenuRef.current && !companyMenuRef.current.contains(e.target)) {
        setIsCompanyMenuOpen(false);
      }
      if (branchMenuRef.current && !branchMenuRef.current.contains(e.target)) {
        setIsBranchMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const workspaceName = currentWorkspace?.name || "Workspace";
  const companyName = currentCompany?.name || "Select Company";
  const branchName = currentBranch?.name || "Select Branch";

  const hasCompanies = Array.isArray(companies) && companies.length > 0;
  const hasBranches = Array.isArray(branches) && branches.length > 0;

  return (
    <nav
      aria-label="Hierarchy Pipeline"
      className={cn(
        "flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-surface/80 border border-border/70 backdrop-blur-md shadow-2xs select-none max-w-full overflow-x-auto no-scrollbar",
        className
      )}
    >
      {/* ── FLOOR 1: WORKSPACE ─────────────────────────────────────── */}
      <div className="relative flex items-center shrink-0">
        <button
          type="button"
          onClick={ascendToWorkspace}
          title={`Floor 1: ${workspaceName} (Click to ascend)`}
          className={cn(
            "group flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer",
            isWorkspaceLevel
              ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 shadow-2xs"
              : "text-text-muted hover:text-text hover:bg-surface-hover/80"
          )}
        >
          <div
            className={cn(
              "flex size-5 items-center justify-center rounded-md text-[10px] font-bold shrink-0 transition-colors",
              isWorkspaceLevel
                ? "bg-purple-600 text-white shadow-2xs"
                : "bg-surface-hover text-text-muted group-hover:text-purple-600"
            )}
          >
            <Layers className="size-3" />
          </div>

          <span className="truncate max-w-[80px] sm:max-w-[120px] lg:max-w-[140px] font-medium leading-none">
            {workspaceName}
          </span>

          <span
            className={cn(
              "px-1 py-0.5 rounded text-[9px] font-bold tracking-tight uppercase leading-none",
              isWorkspaceLevel
                ? "bg-purple-500/20 text-purple-700 dark:text-purple-300"
                : "bg-border/60 text-text-muted"
            )}
          >
            L1
          </span>
        </button>
      </div>

      {/* Divider */}
      <ChevronRight className="size-3.5 text-text-muted/40 shrink-0" />

      {/* ── FLOOR 2: COMPANY ───────────────────────────────────────── */}
      <div className="relative flex items-center shrink-0" ref={companyMenuRef}>
        <div
          className={cn(
            "flex items-center rounded-xl transition-all border",
            isCompanyLevel
              ? "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 shadow-2xs"
              : currentCompany
              ? "border-transparent text-text-muted hover:text-text hover:bg-surface-hover/80"
              : "border-dashed border-border/80 text-text-muted/60 opacity-60"
          )}
        >
          {/* Main Click / Ascend action */}
          <button
            type="button"
            onClick={() => {
              if (currentCompany) {
                if (isBranchLevel) {
                  ascendToCompany();
                } else if (!isCompanyLevel) {
                  ascendToCompany();
                }
              } else if (hasCompanies) {
                setIsCompanyMenuOpen((prev) => !prev);
              }
            }}
            disabled={!currentCompany && !hasCompanies}
            title={
              currentCompany
                ? `Floor 2: ${companyName}${isBranchLevel ? " (Click to ascend)" : ""}`
                : "Select a Company"
            }
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-semibold cursor-pointer"
          >
            <div
              className={cn(
                "flex size-5 items-center justify-center rounded-md text-[10px] font-bold shrink-0 transition-colors",
                isCompanyLevel
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-surface-hover text-text-muted"
              )}
            >
              <Building2 className="size-3" />
            </div>

            <span className="truncate max-w-[90px] sm:max-w-[130px] lg:max-w-[160px] font-medium leading-none">
              {companyName}
            </span>

            <span
              className={cn(
                "px-1 py-0.5 rounded text-[9px] font-bold tracking-tight uppercase leading-none",
                isCompanyLevel
                  ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-border/60 text-text-muted"
              )}
            >
              L2
            </span>
          </button>

          {/* Sibling dropdown arrow */}
          {hasCompanies && (
            <button
              type="button"
              onClick={() => setIsCompanyMenuOpen((prev) => !prev)}
              aria-label="Switch company"
              title="Switch company"
              className="px-1 py-1 pr-1.5 text-text-muted hover:text-text transition-colors cursor-pointer"
            >
              <ChevronDown
                className={cn(
                  "size-3 transition-transform duration-200",
                  isCompanyMenuOpen && "rotate-180"
                )}
              />
            </button>
          )}
        </div>

        {/* Company Dropdown Menu */}
        <AnimatePresence>
          {isCompanyMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-border bg-surface p-1.5 shadow-xl backdrop-blur-md"
            >
              <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Select Company (Floor 2)
              </div>
              <div className="max-h-56 overflow-y-auto space-y-0.5 no-scrollbar">
                {companies.map((c) => {
                  const isSelected = c?._id === currentCompany?._id;
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => {
                        enterCompany(c);
                        setIsCompanyMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left",
                        isSelected
                          ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold"
                          : "text-text hover:bg-surface-hover"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="size-3.5 shrink-0 text-text-muted" />
                        <span className="truncate">{c.name}</span>
                      </div>
                      {isSelected && <Check className="size-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Quick action to create company if allowed */}
              <div className="mt-1 pt-1 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsCompanyMenuOpen(false);
                    navigate("/companies/create");
                  }}
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  <Plus className="size-3.5 shrink-0" />
                  <span>Create New Company</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <ChevronRight className="size-3.5 text-text-muted/40 shrink-0" />

      {/* ── FLOOR 3: BRANCH ────────────────────────────────────────── */}
      <div className="relative flex items-center shrink-0" ref={branchMenuRef}>
        <div
          className={cn(
            "flex items-center rounded-xl transition-all border",
            isBranchLevel
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-2xs"
              : currentBranch
              ? "border-transparent text-text-muted hover:text-text hover:bg-surface-hover/80"
              : "border-dashed border-border/80 text-text-muted/60 opacity-60"
          )}
        >
          {/* Main Click action */}
          <button
            type="button"
            onClick={() => {
              if (currentBranch && !isBranchLevel) {
                enterBranch(currentBranch);
              } else if (hasBranches) {
                setIsBranchMenuOpen((prev) => !prev);
              }
            }}
            disabled={!currentCompany}
            title={
              !currentCompany
                ? "Select a company first to view branches"
                : currentBranch
                ? `Floor 3: ${branchName}`
                : "Select a Branch"
            }
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-semibold cursor-pointer"
          >
            <div
              className={cn(
                "flex size-5 items-center justify-center rounded-md text-[10px] font-bold shrink-0 transition-colors",
                isBranchLevel
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-surface-hover text-text-muted"
              )}
            >
              <Store className="size-3" />
            </div>

            <span className="truncate max-w-[90px] sm:max-w-[130px] lg:max-w-[160px] font-medium leading-none">
              {branchName}
            </span>

            <span
              className={cn(
                "px-1 py-0.5 rounded text-[9px] font-bold tracking-tight uppercase leading-none",
                isBranchLevel
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "bg-border/60 text-text-muted"
              )}
            >
              L3
            </span>
          </button>

          {/* Sibling dropdown arrow */}
          {hasBranches && currentCompany && (
            <button
              type="button"
              onClick={() => setIsBranchMenuOpen((prev) => !prev)}
              aria-label="Switch branch"
              title="Switch branch"
              className="px-1 py-1 pr-1.5 text-text-muted hover:text-text transition-colors cursor-pointer"
            >
              <ChevronDown
                className={cn(
                  "size-3 transition-transform duration-200",
                  isBranchMenuOpen && "rotate-180"
                )}
              />
            </button>
          )}
        </div>

        {/* Branch Dropdown Menu */}
        <AnimatePresence>
          {isBranchMenuOpen && currentCompany && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-border bg-surface p-1.5 shadow-xl backdrop-blur-md"
            >
              <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Select Branch in {currentCompany.name} (Floor 3)
              </div>
              <div className="max-h-56 overflow-y-auto space-y-0.5 no-scrollbar">
                {branches.map((b) => {
                  const isSelected = b?._id === currentBranch?._id;
                  return (
                    <button
                      key={b._id}
                      type="button"
                      onClick={() => {
                        enterBranch(b);
                        setIsBranchMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left",
                        isSelected
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold"
                          : "text-text hover:bg-surface-hover"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Store className="size-3.5 shrink-0 text-text-muted" />
                        <span className="truncate">{b.name}</span>
                      </div>
                      {isSelected && <Check className="size-3.5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Quick action to create branch */}
              <div className="mt-1 pt-1 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsBranchMenuOpen(false);
                    navigate("/branches/create");
                  }}
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  <Plus className="size-3.5 shrink-0" />
                  <span>Create New Branch</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default HeaderElevatorPipeline;

