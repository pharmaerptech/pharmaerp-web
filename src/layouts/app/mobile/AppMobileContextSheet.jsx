import React, { useEffect, useState } from "react";
import {
  FiX,
  FiShoppingBag,
  FiBriefcase,
  FiMapPin,
  FiCheck,
  FiPlus,
  FiChevronRight,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants";

import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import useCompany from "@/features/company/hooks/useCompany";
import useBranch from "@/features/branch/hooks/useBranch";
import useUser from "@/features/user/hooks/useUser";
import { usePermission } from "@/hooks";
import { useNavigationPipeline } from "@/contexts/NavigationPipelineContext";
import { UITabs } from "@/components/ui";

const getWorkspaceFromItem = (item) => {
  return item?.workspace || item || null;
};

const AppMobileContextSheet = ({ isOpen, onClose }) => {
  const { updateActiveContext } = useUser();
  const { isOwner, can, canWorkLevel, canWorkMode } = usePermission();
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspace();
  const { ascendToWorkspace, enterCompany, enterBranch } = useNavigationPipeline();

  const canWorkspace = isOwner || canWorkLevel("workspace");
  const canCompany = isOwner || canWorkLevel("company");
  const canBranch = isOwner || canWorkLevel("branch");
  const canOperation = isOwner || canWorkMode("operation");

  const {
    companies,
    currentCompany,
    getWorkspaceCompanies,
    setCurrentCompany,
    clearCurrentCompany,
  } = useCompany();
  const {
    branches,
    currentBranch,
    getCompanyBranches,
    setCurrentBranch,
    clearCurrentBranch,
  } = useBranch();

  const [activeTab, setActiveTab] = useState("branch");

  useEffect(() => {
    if (isOpen) {
      if (!currentWorkspace?._id && canWorkspace) setActiveTab("workspace");
      else if ((!currentCompany?._id || !currentBranch?._id) && canCompany) {
        setActiveTab("company");
      } else {
        setActiveTab("branch");
      }
    }
  }, [isOpen, currentWorkspace, currentCompany, currentBranch, canWorkspace, canCompany]);

  if (!isOpen) return null;

  const handleWorkspaceSelect = async (workspaceItem) => {
    if (!canWorkspace) return;
    const workspace = getWorkspaceFromItem(workspaceItem);
    if (!workspace?._id) return;

    setCurrentWorkspace(workspace);
    clearCurrentCompany();
    clearCurrentBranch();

    try {
      await updateActiveContext({
        workspaceId: workspace._id,
        companyId: null,
        branchId: null,
      });

      await getWorkspaceCompanies();
      ascendToWorkspace();
      setActiveTab("company");
    } catch (error) {
      console.error("Failed to update mobile workspace context:", error);
    }
  };

  const handleCompanySelect = async (company) => {
    if (!canCompany || !company?._id || !currentWorkspace?._id) return;

    setCurrentCompany(company);
    clearCurrentBranch();

    try {
      await updateActiveContext({
        workspaceId: currentWorkspace._id,
        companyId: company._id,
        branchId: null,
      });

      await getCompanyBranches(company._id);
      enterCompany(company);
      setActiveTab("branch");
    } catch (error) {
      console.error("Failed to transition mobile company context:", error);
    }
  };

  const handleBranchSelect = async (branch) => {
    if (!canBranch || !branch?._id || !currentWorkspace?._id || !currentCompany?._id) return;

    setCurrentBranch(branch);

    try {
      await updateActiveContext({
        workspaceId: currentWorkspace._id,
        companyId: currentCompany._id,
        branchId: branch._id,
      });
      enterBranch(branch);
      onClose();
    } catch (error) {
      console.error("Failed to finalize mobile branch context:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      <div className="flex max-h-[85vh] w-full flex-col rounded-t-[24px] bg-surface text-text shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out">
        <div className="flex flex-col items-center px-5 pt-3 pb-2 shrink-0">
          <div className="h-1 w-12 rounded-full bg-divider/60 mb-4" />

          <div className="flex w-full items-center justify-between">
            <div>
              <h3 className="text-[16px] font-bold tracking-tight text-text">
                Switch Context
              </h3>
              <p className="text-[11px] font-normal text-text-muted mt-0.5">
                Navigate across your permitted infrastructure
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-bg text-text-muted active:scale-90 transition shadow-xs"
            >
              <FiX className="text-base" />
            </button>
          </div>
        </div>

        <div className="mx-5 my-2.5 shrink-0">
          <UITabs
            tabs={[
              {
                id: "workspace",
                label: "Workspace",
                icon: <FiShoppingBag className="text-xs" />,
                disabled: !canWorkspace,
              },
              {
                id: "company",
                label: "Company",
                icon: <FiBriefcase className="text-xs" />,
                disabled: !currentWorkspace?._id || !canCompany,
              },
              {
                id: "branch",
                label: "Branch",
                icon: <FiMapPin className="text-xs" />,
                disabled: !currentCompany?._id || !canBranch,
              },
            ]}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId)}
            variant="segmented"
            size="sm"
            fullWidth={true}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-2">
          {activeTab === "workspace" && canWorkspace && (
            <div className="space-y-2.5 animate-in fade-in duration-200">
              {workspaces?.map((item) => {
                const ws = getWorkspaceFromItem(item);
                const isActive = ws?._id === currentWorkspace?._id;
                return (
                  <button
                    key={ws?._id}
                    type="button"
                    onClick={() => handleWorkspaceSelect(item)}
                    className={`flex w-full items-center justify-between rounded-xl p-3.5 text-left transition-all active:scale-[0.98] ${
                      isActive
                        ? "bg-primary-soft/40 border border-primary/30"
                        : "bg-bg/60 border border-transparent hover:bg-bg"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                          isActive
                            ? "bg-primary text-white shadow-md shadow-primary/20"
                            : "bg-surface text-text-muted border border-divider/60"
                        }`}
                      >
                        <FiShoppingBag className="text-[16px]" />
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`text-[13px] font-bold truncate ${isActive ? "text-primary" : "text-text"}`}
                        >
                          {ws?.name}
                        </div>
                        <div className="text-[10px] text-text-muted font-medium mt-0.5 tracking-wide uppercase">
                          {ws?.type || "Standard"}
                        </div>
                      </div>
                    </div>
                    {isActive ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-xs">
                        <FiCheck className="text-[11px] stroke-[3]" />
                      </div>
                    ) : (
                      <FiChevronRight className="text-text-muted/60 text-base" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === "company" && canCompany && (
            <div className="space-y-2.5 animate-in fade-in duration-200">
              <div className="flex justify-between items-center mb-1 pl-1">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Available Companies
                </span>
                {canWorkspace && canOperation && (isOwner || can("company:create")) && (
                  <Link
                    to={ROUTES.CREATE_COMPANY}
                    onClick={onClose}
                    className="text-[11px] font-bold text-primary flex items-center gap-1 bg-primary-soft/80 px-2.5 py-1.5 rounded-lg active:scale-95 transition"
                  >
                    <FiPlus className="stroke-[3]" /> New Company
                  </Link>
                )}
              </div>

              {companies?.length ? (
                companies.map((comp) => {
                  const isActive = comp?._id === currentCompany?._id;
                  return (
                    <button
                      key={comp?._id}
                      type="button"
                      onClick={() => handleCompanySelect(comp)}
                      className={`flex w-full items-center justify-between rounded-xl p-3.5 text-left transition-all active:scale-[0.98] ${
                        isActive
                          ? "bg-primary-soft/40 border border-primary/30"
                          : "bg-bg/60 border border-transparent hover:bg-bg"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                            isActive
                              ? "bg-primary text-white shadow-md shadow-primary/20"
                              : "bg-surface text-text-muted border border-divider/60"
                          }`}
                        >
                          <FiBriefcase className="text-[16px]" />
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`text-[13px] font-bold truncate ${isActive ? "text-primary" : "text-text"}`}
                          >
                            {comp?.name}
                          </div>
                          <div className="text-[10px] text-text-muted font-mono mt-0.5">
                            {comp?.gstin
                              ? `GST: ${comp.gstin}`
                              : "No Registration Identifier"}
                          </div>
                        </div>
                      </div>
                      {isActive ? (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-xs">
                          <FiCheck className="text-[11px] stroke-[3]" />
                        </div>
                      ) : (
                        <FiChevronRight className="text-text-muted/60 text-base" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-10 bg-bg/40 rounded-xl border border-dashed border-divider p-4">
                  <FiBriefcase className="text-text-muted/40 text-2xl mx-auto mb-2" />
                  <p className="text-[13px] font-bold text-text mb-1">
                    {!isOwner ? "You don't have any company." : "No active operating contexts registered."}
                  </p>
                  <p className="text-[11px] font-medium text-text-muted">
                    {!isOwner
                      ? "No company access has been granted for your account in this workspace."
                      : "Create your first company to begin operations."}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "branch" && canBranch && (
            <div className="space-y-2.5 animate-in fade-in duration-200">
              <div className="flex justify-between items-center mb-1 pl-1">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Select Branch Location
                </span>
                {canCompany && canOperation && (isOwner || can("branch:create")) && (
                  <Link
                    to={ROUTES.CREATE_BRANCH}
                    onClick={onClose}
                    className="text-[11px] font-bold text-primary flex items-center gap-1 bg-primary-soft/80 px-2.5 py-1.5 rounded-lg active:scale-95 transition"
                  >
                    <FiPlus className="stroke-[3]" /> New Branch
                  </Link>
                )}
              </div>

              {branches?.length ? (
                branches.map((br) => {
                  const isActive = br?._id === currentBranch?._id;
                  return (
                    <button
                      key={br?._id}
                      type="button"
                      onClick={() => handleBranchSelect(br)}
                      className={`flex w-full items-center justify-between rounded-xl p-3.5 text-left transition-all active:scale-[0.98] ${
                        isActive
                          ? "bg-primary-soft/40 border border-primary/30"
                          : "bg-bg/60 border border-transparent hover:bg-bg"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                            isActive
                              ? "bg-primary text-white shadow-md shadow-primary/20"
                              : "bg-surface text-text-muted border border-divider/60"
                          }`}
                        >
                          <FiMapPin className="text-[16px]" />
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`text-[13px] font-bold truncate ${isActive ? "text-primary" : "text-text"}`}
                          >
                            {br?.name}
                          </div>
                          <div className="text-[10px] text-text-muted mt-0.5 font-medium">
                            {br?.city || "Primary Distribution Core"}
                          </div>
                        </div>
                      </div>
                      {isActive && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-xs">
                          <FiCheck className="text-[11px] stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-10 bg-bg/40 rounded-xl border border-dashed border-divider p-4">
                  <FiMapPin className="text-text-muted/40 text-2xl mx-auto mb-2" />
                  <p className="text-[13px] font-bold text-text mb-1">
                    {!isOwner ? "No Branch Access" : "No localized branches linked to this context."}
                  </p>
                  <p className="text-[11px] font-medium text-text-muted">
                    {!isOwner
                      ? "No branches are assigned to your account under this company."
                      : "Create your first branch location to proceed."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppMobileContextSheet;
