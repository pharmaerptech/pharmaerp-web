// src/pages/AccessDeniedPage.jsx

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  ArrowLeft,
  LayoutDashboard,
  Lock,
  User,
  Building,
  KeyRound,
  Layers,
  Eye,
} from "lucide-react";

import { ROUTES } from "@/constants";
import useAuth from "@/features/auth/hooks/useAuth";
import useWorkspace from "@/features/workspace/hooks/useWorkspace";
import usePermission from "@/hooks/usePermission";
import { getPipelineDefaultRoute } from "@/contexts/routePipelinePolicy";

const AccessDeniedPage = ({
  requiredPermission,
  requiredLevels = null,
  requiredModes = null,
  denialType = "permission",
  message = null,
  title = "You don't have access to this page",
  description = "This page is restricted by workspace security policies. Your assigned role does not have permission to view or manage this section.",
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const {
    myAccess,
    isOwner,
    workAccess,
    allowedWorkLevels,
    allowedWorkModes,
  } = usePermission();

  const userRoleName = isOwner
    ? "Workspace Owner"
    : myAccess?.role?.name || user?.role || "Team Member";

  const formattedPermissions = Array.isArray(requiredPermission)
    ? requiredPermission
    : requiredPermission
      ? [requiredPermission]
      : [];

  const resolvedTitle =
    denialType === "level"
      ? "Work Level Restricted"
      : denialType === "mode"
        ? "Work Mode Restricted"
        : denialType === "context"
          ? "No Active Branch / Company Selected"
          : title;

  const resolvedDescription =
    message ||
    (denialType === "level"
      ? `Your role only allows ${allowedWorkLevels?.join(", ") || "assigned"} level access.`
      : denialType === "mode"
        ? `Your role only allows ${allowedWorkModes?.join(" / ") || "assigned"} work mode access.`
        : description);

  const safeHomeRoute = isOwner
    ? ROUTES.SETUP_CENTER
    : getPipelineDefaultRoute(
        workAccess?.defaultWorkLevel || "branch",
        workAccess?.defaultWorkMode || "view",
        workAccess,
      ) || ROUTES.DASHBOARD;

  return (
    <div className="flex min-h-[calc(100dvh-120px)] w-full items-center justify-center bg-transparent py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center text-center max-w-lg w-full"
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, duration: 0.6 }}
          className="relative mb-6"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-error/15 blur-2xl"
            style={{ width: "150px", height: "150px", left: "-27px", top: "-27px" }}
          />
          <div className="relative flex size-24 items-center justify-center rounded-[28px] bg-error/10 ring-1 ring-error/25 shadow-xl shadow-error/5">
            <ShieldAlert className="size-12 text-error" strokeWidth={1.75} />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-error text-white shadow-md border-2 border-bg"
          >
            <Lock className="size-3.5" />
          </motion.div>
        </motion.div>

        <div className="space-y-2.5 mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-error/10 px-3 py-1 text-xs font-semibold text-error ring-1 ring-error/20">
            <Lock className="size-3" />
            <span>Access Restricted</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            {resolvedTitle}
          </h1>

          <p className="text-sm sm:text-base text-text-muted leading-relaxed max-w-md mx-auto">
            {resolvedDescription}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="w-full rounded-2xl border border-border bg-surface/70 p-4.5 backdrop-blur-sm shadow-sm space-y-3 mb-7 text-left"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Access Credentials
            </span>
            <span className="text-xs font-mono text-error font-medium">
              HTTP 403 Forbidden
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-center gap-2 rounded-xl bg-bg/80 p-2.5 border border-border/40">
              <User className="size-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-text-muted text-[11px]">Your Role</p>
                <p className="font-semibold text-text truncate">{userRoleName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-bg/80 p-2.5 border border-border/40">
              <Building className="size-4 text-secondary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-text-muted text-[11px]">Workspace</p>
                <p className="font-semibold text-text truncate">
                  {currentWorkspace?.name || "Active Workspace"}
                </p>
              </div>
            </div>

            {Array.isArray(allowedWorkLevels) && (
              <div className="flex items-center gap-2 rounded-xl bg-bg/80 p-2.5 border border-border/40">
                <Layers className="size-4 text-emerald-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-text-muted text-[11px]">Allowed Levels</p>
                  <p className="font-semibold text-text capitalize truncate">
                    {allowedWorkLevels.join(", ")}
                  </p>
                </div>
              </div>
            )}

            {Array.isArray(allowedWorkModes) && (
              <div className="flex items-center gap-2 rounded-xl bg-bg/80 p-2.5 border border-border/40">
                <Eye className="size-4 text-purple-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-text-muted text-[11px]">Allowed Work Modes</p>
                  <p className="font-semibold text-text capitalize truncate">
                    {allowedWorkModes.join(", ")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {(requiredLevels?.length || requiredModes?.length) && (
            <div className="rounded-xl bg-error/5 p-2.5 border border-error/15 text-[11px] text-error">
              Required scope:{" "}
              {requiredLevels?.length ? `Level (${requiredLevels.join(" / ")}) ` : ""}
              {requiredModes?.length ? `Mode (${requiredModes.join(" / ")})` : ""}
            </div>
          )}

          {formattedPermissions.length > 0 && (
            <div className="rounded-xl bg-error/5 p-2.5 border border-error/15">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-error mb-1.5">
                <KeyRound className="size-3.5" />
                <span>Required Permission{formattedPermissions.length > 1 ? "s" : ""}:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formattedPermissions.map((perm) => (
                  <code
                    key={perm}
                    className="rounded-md bg-error/10 px-2 py-0.5 text-[11px] font-mono text-error font-semibold"
                  >
                    {perm}
                  </code>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text transition-all hover:bg-surface-hover hover:border-border-strong active:scale-[0.98] cursor-pointer shadow-sm"
          >
            <ArrowLeft className="size-4" />
            Go Back
          </button>

          <button
            type="button"
            onClick={() => navigate(safeHomeRoute, { replace: true })}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-contrast transition-all hover:bg-primary-hover active:scale-[0.98] cursor-pointer shadow-sm shadow-primary/20"
          >
            <LayoutDashboard className="size-4" />
            Go to Permitted Workspace
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AccessDeniedPage;
