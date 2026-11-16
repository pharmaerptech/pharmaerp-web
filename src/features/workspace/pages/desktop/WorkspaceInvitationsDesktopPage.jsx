// src/features/workspace/pages/desktop/WorkspaceInvitationsDesktopPage.jsx

import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  Mail,
  Plus,
  RotateCcw,
  RefreshCw,
  Search,
  Copy,
  Check,
  Send,
  XCircle,
  Clock,
  CheckCircle2,
  Users,
  Shield,
  GitBranch,
  AlertCircle,
  Trash2,
} from "lucide-react";

import {
  UIButton,
  UIInput,
  UISelect,
  UIBadge,
  UITable,
  UITableHeader,
  UITableBody,
  UITableRow,
  UITableHead,
  UITableCell,
  UITableEmpty,
  UITableLoading,
  UIInfiniteScroll,
  UITableScrollArea,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const PAGE_LIMIT = 20;

const statusBadgeVariant = (status) => {
  switch (status) {
    case "accepted":
      return { variant: "soft", color: "success", label: "Accepted" };
    case "pending":
      return { variant: "soft", color: "warning", label: "Pending" };
    case "expired":
      return { variant: "soft", color: "neutral", label: "Expired" };
    case "cancelled":
      return { variant: "soft", color: "danger", label: "Cancelled" };
    default:
      return { variant: "soft", color: "neutral", label: status };
  }
};

export default function WorkspaceInvitationsDesktopPage({
  workspace,
  invitations = [],
  stats = [],

  filters = { search: "", status: "all" },
  statusOptions = [],

  isLoading = false,
  copiedId = null,

  handleFilterChange,
  handleSearchChange,
  handleClearFilters,

  handleRefresh,
  handleInviteMember,
  handleViewMembers,
  handleCancelInvitation,
  handleResendInvitation,
  handleCopyLink,
}) {
  const tableContainerRef = useRef(null);

  // Infinite Scroll state - incremental client-side batches
  const [visibleCount, setVisibleCount] = useState(PAGE_LIMIT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Reset visible count and scroll to top on filter change
  useEffect(() => {
    setVisibleCount(PAGE_LIMIT);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [filters.search, filters.status]);

  const displayedInvitations = useMemo(() => {
    return (invitations || []).slice(0, visibleCount);
  }, [invitations, visibleCount]);

  const hasMore = visibleCount < (invitations || []).length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + PAGE_LIMIT, (invitations || []).length)
      );
      setIsLoadingMore(false);
    }, 120);
  }, [isLoadingMore, hasMore, invitations]);

  const hasActiveFilters = Boolean(
    filters.search || (filters.status && filters.status !== "all")
  );

  // 4 Top Stat Cards
  const statCards = useMemo(() => {
    const total = invitations.length;
    const pending = invitations.filter((i) => i.effectiveStatus === "pending").length;
    const accepted = invitations.filter((i) => i.effectiveStatus === "accepted").length;
    const closed = invitations.filter(
      (i) => i.effectiveStatus === "cancelled" || i.effectiveStatus === "expired"
    ).length;

    return [
      {
        id: "total",
        title: "Total Invitations",
        value: stats.find((s) => s.id === "total")?.value ?? total,
        subtitle: "Workspace team invites",
        icon: Mail,
        color: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
      },
      {
        id: "pending",
        title: "Pending Action",
        value: stats.find((s) => s.id === "pending")?.value ?? pending,
        subtitle: "Awaiting registration",
        icon: Clock,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      },
      {
        id: "accepted",
        title: "Accepted & Active",
        value: stats.find((s) => s.id === "accepted")?.value ?? accepted,
        subtitle: "Joined workspace",
        icon: CheckCircle2,
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      },
      {
        id: "closed",
        title: "Expired & Revoked",
        value:
          (stats.find((s) => s.id === "expired")?.value ?? 0) +
          (stats.find((s) => s.id === "cancelled")?.value ?? closed),
        subtitle: "Lapsed or cancelled",
        icon: AlertCircle,
        color: "text-rose-600 dark:text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
      },
    ];
  }, [invitations, stats]);

  return (
    <div className="w-full flex flex-col gap-3.5 bg-bg select-text">
      {/* ── 1. Top Stat Cards Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.id}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-surface border border-border shadow-2xs transition-all"
            >
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0 border",
                  stat.bg,
                  stat.border,
                  stat.color
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] font-medium text-text-muted truncate">
                  {stat.title}
                </div>
                <div className="text-xl sm:text-[22px] font-bold text-text leading-tight font-mono tabular-nums">
                  {stat.value}
                </div>
                <div className="text-[10px] text-text-muted truncate mt-0.5">
                  {stat.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 2. Streamlined Single-Row Toolbar ────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px] sm:min-w-[240px]">
          <UIInput
            type="text"
            value={filters.search || ""}
            onChange={handleSearchChange}
            placeholder="Search by invitee email, role, or notes..."
            startIcon={<Search className="size-4 text-text-muted" />}
            size="md"
            variant="outline"
            isClearable
            onClear={() => handleSearchChange?.({ target: { value: "" } })}
            className="w-full"
          />
        </div>

        {/* Status Select */}
        <div className="w-[140px] sm:w-[160px]">
          <UISelect
            value={filters.status || "all"}
            onChange={(val) => handleFilterChange?.({ status: val })}
            options={statusOptions}
            placeholder="All Status"
            size="md"
          />
        </div>

        {/* Quick Reset */}
        {hasActiveFilters && (
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            onClick={handleClearFilters}
            startIcon={<RotateCcw className="size-3.5 text-text-muted" />}
            className="h-10 px-2.5 text-xs text-text-muted hover:text-text"
            title="Reset all filters"
          >
            Reset
          </UIButton>
        )}

        {/* Action Cluster (Right) */}
        <div className="flex items-center gap-1.5 ml-auto">
          <UIButton
            type="button"
            variant="ghost"
            size="md"
            disabled={isLoading}
            onClick={handleRefresh}
            className="h-10 w-10 p-0 text-text-muted hover:text-text cursor-pointer"
            title="Refresh invitations"
          >
            <RefreshCw
              className={cn(
                "size-4 text-text-muted hover:text-primary",
                isLoading && "animate-spin text-primary"
              )}
            />
          </UIButton>

          <UIButton
            type="button"
            variant="outline"
            size="md"
            startIcon={<Users className="size-4 text-text-muted" />}
            onClick={handleViewMembers}
            className="h-10 px-3 text-xs"
          >
            View Members
          </UIButton>

          <UIButton
            type="button"
            variant="primary"
            size="md"
            startIcon={<Plus className="size-4" />}
            onClick={handleInviteMember}
            className="h-10 px-3.5 text-xs font-semibold shadow-xs"
          >
            Invite Member
          </UIButton>
        </div>
      </div>

      {/* ── 3. Table with Sticky Header & Infinite Scroll ── */}
      <div className="rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden flex flex-col relative">
        <UITableScrollArea containerRef={tableContainerRef} className="divide-y divide-border/60">
          <UITable
            stickyHeader
            containerClassName="static overflow-visible rounded-none border-0 shadow-none bg-transparent isolate-auto"
            className="w-full"
          >
            {/* Sticky Table Header */}
            <UITableHeader
              sticky
              className="sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs select-none shadow-xs"
            >
              <UITableRow className="border-b border-border text-[11px] font-semibold text-text uppercase tracking-wider bg-surface-alt">
                <UITableHead sticky className="min-w-[220px]">Invitee &amp; Credentials</UITableHead>
                <UITableHead sticky className="min-w-[150px]">Designated Role</UITableHead>
                <UITableHead sticky className="min-w-[160px]">Branch Clearance</UITableHead>
                <UITableHead sticky align="center" className="min-w-[110px]">Status</UITableHead>
                <UITableHead sticky className="min-w-[130px]">Sent Date</UITableHead>
                <UITableHead sticky className="min-w-[140px]">Expires At</UITableHead>
                <UITableHead sticky align="right" className="min-w-[160px]">Actions</UITableHead>
              </UITableRow>
            </UITableHeader>

            <UITableBody>
              {isLoading && displayedInvitations.length === 0 ? (
                <UITableLoading colSpan={7} rows={8} />
              ) : displayedInvitations.length === 0 ? (
                <UITableEmpty
                  colSpan={7}
                  title="No invitations found"
                  description={
                    hasActiveFilters
                      ? "No invitations match your active filter criteria."
                      : "No pending or past invitations found in this workspace."
                  }
                  action={
                    hasActiveFilters ? (
                      <UIButton variant="outline" size="sm" onClick={handleClearFilters}>
                        Clear Filters
                      </UIButton>
                    ) : (
                      <UIButton
                        variant="primary"
                        size="sm"
                        onClick={handleInviteMember}
                        startIcon={<Plus className="size-4" />}
                      >
                        Send First Invitation
                      </UIButton>
                    )
                  }
                />
              ) : (
                displayedInvitations.map((invitation) => {
                  const statusMeta = statusBadgeVariant(invitation.effectiveStatus);
                  const isPending = invitation.effectiveStatus === "pending";
                  const isCopied = copiedId === invitation._id;

                  return (
                    <UITableRow
                      key={invitation._id}
                      className="hover:bg-surface-alt/50 transition-colors"
                    >
                      {/* Invitee Email */}
                      <UITableCell className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {invitation.displayEmail.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-text block truncate">
                              {invitation.displayEmail}
                            </span>
                            <span className="text-[10.5px] text-text-muted block">
                              Invited by {invitation.displayInvitedBy}
                            </span>
                          </div>
                        </div>
                      </UITableCell>

                      {/* Designated Role */}
                      <UITableCell className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-surface-alt border border-border/50 text-text">
                          <Shield className="size-3 text-primary" />
                          <span>{invitation.displayRole}</span>
                        </span>
                      </UITableCell>

                      {/* Branch Clearance */}
                      <UITableCell className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                          <GitBranch className="size-3.5 text-text-muted shrink-0" />
                          <span>{invitation.storeFootprint}</span>
                        </span>
                      </UITableCell>

                      {/* Status */}
                      <UITableCell align="center" className="py-2.5 px-3">
                        <UIBadge
                          variant={statusMeta.variant}
                          color={statusMeta.color}
                          size="xs"
                        >
                          {statusMeta.label}
                        </UIBadge>
                      </UITableCell>

                      {/* Sent Date */}
                      <UITableCell className="py-2.5 px-3">
                        <span className="text-xs text-text font-medium">
                          {invitation.displayCreatedAt}
                        </span>
                      </UITableCell>

                      {/* Expires At */}
                      <UITableCell className="py-2.5 px-3">
                        <span className="text-xs text-text-muted">
                          {invitation.displayExpiresAt}
                        </span>
                      </UITableCell>

                      {/* Actions */}
                      <UITableCell align="right" className="py-2.5 px-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending ? (
                            <>
                              <UIButton
                                variant="ghost"
                                size="xs"
                                onClick={() => handleCopyLink(invitation)}
                                startIcon={
                                  isCopied ? (
                                    <Check className="size-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="size-3" />
                                  )
                                }
                                title="Copy invite link"
                              >
                                {isCopied ? "Copied" : "Copy"}
                              </UIButton>

                              <UIButton
                                variant="outline"
                                size="xs"
                                onClick={() => handleResendInvitation(invitation)}
                                startIcon={<Send className="size-3 text-primary" />}
                                className="text-primary hover:text-primary-hover hover:border-primary/40"
                              >
                                Resend
                              </UIButton>

                              <UIButton
                                variant="ghost"
                                size="xs"
                                onClick={() => handleCancelInvitation(invitation)}
                                className="text-destructive hover:bg-destructive/10"
                                title="Revoke invitation"
                              >
                                Revoke
                              </UIButton>
                            </>
                          ) : (
                            <span className="text-xs text-text-muted italic pr-2">
                              {invitation.effectiveStatus === "accepted"
                                ? "Member Active"
                                : "Closed"}
                            </span>
                          )}
                        </div>
                      </UITableCell>
                    </UITableRow>
                  );
                })
              )}
            </UITableBody>
          </UITable>

          {/* Infinite Scroll sentinel */}
          <UIInfiniteScroll
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onLoadMore={handleLoadMore}
            scrollThreshold={0.8}
          />
        </UITableScrollArea>
      </div>
    </div>
  );
}
