// src/features/setup/pages/SetupCenterPage.jsx

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { useIsMobile } from "@/hooks";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import useCompany from "@/features/company/hooks/useCompany";
import {
  useNavigationPipeline,
  PIPELINE_LEVELS,
  WORK_MODES,
  PIPELINE_STORAGE_KEYS,
} from "@/contexts";

import { getWorkspaceSetupStatus } from "@/features/workspace/store/workspaceThunk";
import {
  selectWorkspaceSetupStatus,
  selectWorkspaceSetupStatusVersion,
} from "@/features/workspace/store/workspaceSelector";
import { setupSteps as defaultSetupSteps } from "../constants/setupSteps";

import SetupCenterDesktopPage from "./desktop/SetupCenterDesktopPage";
import SetupCenterMobilePage from "./mobile/SetupCenterMobilePage";

const SetupCenterPage = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentWorkspace, activeWorkspace } = useWorkspace();
  const workspace = currentWorkspace || activeWorkspace || null;
  const workspaceId = workspace?._id || workspace?.id;

  const { companies, currentCompany, getCompanies, setCurrentCompany } = useCompany();
  const { setLevel, setWorkMode, safeSetStorage, enterCompany } = useNavigationPipeline();

  // Single source of truth for all setup step completion
  const setupStatus = useSelector(selectWorkspaceSetupStatus);
  // Incremented by createCompany/createBranch thunks → triggers this effect
  const setupVersion = useSelector(selectWorkspaceSetupStatusVersion);

  useEffect(() => {
    if (!workspaceId) return;
    dispatch(getWorkspaceSetupStatus(workspaceId));
  }, [workspaceId, setupVersion, dispatch]);

  // Fetch companies list if company step is completed so we can auto-assign company context on branch click
  useEffect(() => {
    if (setupStatus?.steps?.company?.completed && (!companies || companies.length === 0)) {
      getCompanies?.().catch(() => null);
    }
  }, [setupStatus?.steps?.company?.completed, companies, getCompanies]);

  // Map API response flags to a flat completion lookup
  const setupState = useMemo(
    () => ({
      company: setupStatus?.steps?.company?.completed ?? false,
      branch: setupStatus?.steps?.branch?.completed ?? false,
    }),
    [setupStatus],
  );

  const mappedSetupSteps = useMemo(
    () =>
      defaultSetupSteps.map((step) => {
        const locked = step.requiredFields.some((field) => !setupState[field]);
        const completed = Boolean(setupState[step.id]);
        const targetRoute = completed
          ? step.completedRoute || step.route
          : step.route;

        return {
          ...step,
          completed,
          locked,
          disabled: locked,
          onClick: async () => {
            if (locked || !targetRoute) return;

            if (step.id === "branch") {
              let targetCompany =
                currentCompany ||
                (Array.isArray(companies) && companies[0]) ||
                null;

              if (!targetCompany && typeof getCompanies === "function") {
                try {
                  const res = await getCompanies();
                  const list = res?.data?.data || res?.data || res || [];
                  if (Array.isArray(list) && list.length > 0) {
                    targetCompany = list[0];
                  }
                } catch {
                  // fallback gracefully
                }
              }

              if (targetCompany?._id || targetCompany?.id) {
                const cId = targetCompany._id || targetCompany.id;
                setCurrentCompany(targetCompany);
                safeSetStorage?.(
                  PIPELINE_STORAGE_KEYS.ACTIVE_COMPANY_ID,
                  String(cId),
                );
              }
              navigate(targetRoute, { state: { fromSetupCenter: true } });
              return;
            }

            if (step.id === "company") {
              navigate(targetRoute, { state: { fromSetupCenter: true } });
              return;
            }

            navigate(targetRoute);
          },
        };
      }),
    [
      navigate,
      setupState,
      companies,
      currentCompany,
      setCurrentCompany,
      setLevel,
      setWorkMode,
      safeSetStorage,
      enterCompany,
    ],
  );

  const completedStepsCount = mappedSetupSteps.filter(
    (step) => step.completed,
  ).length;

  // Use API progress if available (accurate), else compute locally
  const progress =
    setupStatus?.progress?.percentage ??
    (mappedSetupSteps.length
      ? Math.round((completedStepsCount / mappedSetupSteps.length) * 100)
      : 0);

  const nextStep = mappedSetupSteps.find(
    (step) => !step.completed && !step.locked,
  );

  const isAllCompleted = completedStepsCount === mappedSetupSteps.length && mappedSetupSteps.length > 0;

  const pageProps = {
    workspace,
    mappedSetupSteps,
    completedStepsCount,
    progress,
    nextStep,
    isAllCompleted,
  };

  return isMobile ? (
    <SetupCenterMobilePage {...pageProps} />
  ) : (
    <SetupCenterDesktopPage {...pageProps} />
  );
};

export default SetupCenterPage;
