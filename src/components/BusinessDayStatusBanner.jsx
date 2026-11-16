import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getOpenBusinessDay } from "@/features/operations/business-days/store/businessDayThunk";
import useBranch from "@/features/branch/hooks/useBranch";
import { CalendarDays, Clock } from "lucide-react";

/**
 * BusinessDayStatusBanner
 *
 * Persistent top-of-layout banner that shows the active Business Day status.
 * Renders on every page to give the pharmacist constant context on what
 * day they are operating in.
 *
 * Shows:
 *   - When a Business Day is OPEN: date, day number, active shift indicator
 *   - When NO Business Day is open: a soft warning to open one
 */
const BusinessDayStatusBanner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentBranch } = useBranch();
  const { openBusinessDay } = useSelector((state) => state.businessDay);
  const activeShift = useSelector((state) => state.shift?.activeShift || state.shift?.currentShift);

  useEffect(() => {
    if (currentBranch?._id) {
      dispatch(getOpenBusinessDay(currentBranch._id));
    }
  }, [currentBranch?._id, dispatch]);

  if (!openBusinessDay) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-2 bg-warning/6 border-b border-warning/15 text-xs cursor-pointer hover:bg-warning/10 transition-colors"
        onClick={() => navigate("/operations/business-days")}
        title="Click to open a Business Day"
      >
        <CalendarDays className="w-3.5 h-3.5 text-warning flex-shrink-0" />
        <span className="text-warning font-medium">No Business Day is open.</span>
        <span className="text-text-muted">Open a Business Day to start operations.</span>
        <span className="ml-auto text-warning underline text-xs">Open Now →</span>
      </div>
    );
  }

  const displayDate = new Date(openBusinessDay.businessDate).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (openBusinessDay.status === "closing") {
    return (
      <div
        className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs cursor-pointer hover:bg-amber-500/15 transition-colors"
        onClick={() => navigate("/operations/business-days")}
        title="Business Day is currently closing. Click to review."
      >
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping flex-shrink-0" />
        <CalendarDays className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <span className="font-semibold text-amber-700 dark:text-amber-300">
          Business Day Closing in Progress ({displayDate})
        </span>
        <span className="text-amber-700/70 dark:text-amber-300/70 font-mono">{openBusinessDay.businessDayNo}</span>
        <span className="ml-auto text-amber-700 dark:text-amber-300 font-medium">Operations Paused →</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 bg-primary/5 border-b border-primary/10 text-xs cursor-pointer hover:bg-primary/8 transition-colors"
      onClick={() => navigate("/operations/business-days")}
      title="Click to manage Business Day"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
      <CalendarDays className="w-3.5 h-3.5 text-primary flex-shrink-0" />
      <span className="font-medium text-primary">{displayDate}</span>
      <span className="text-text-muted font-mono">{openBusinessDay.businessDayNo}</span>
      <span className="text-border mx-1">|</span>
      {activeShift?.status === "closing" ? (
        <>
          <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Shift Closing in Progress
          </span>
        </>
      ) : activeShift?.status === "open" ? (
        <>
          <Clock className="w-3.5 h-3.5 text-success flex-shrink-0" />
          <span className="text-success font-medium">Shift Active</span>
        </>
      ) : (
        <>
          <Clock className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          <span className="text-text-muted">No active shift</span>
        </>
      )}
      <span className="ml-auto text-text-muted">
        {openBusinessDay.shifts?.length || 0} shift{openBusinessDay.shifts?.length === 1 ? "" : "s"} today
      </span>
    </div>
  );
};

export default BusinessDayStatusBanner;
