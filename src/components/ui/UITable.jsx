import React, { forwardRef } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const UITable = forwardRef(
  ({ children, className, containerClassName, containerRef, stickyHeader = false, ...props }, ref) => (
    <div
      ref={containerRef}
      data-table-scroll="true"
      className={cn(
        "relative w-full overflow-x-auto rounded-2xl border border-border bg-surface shadow-2xs isolate table-scroll-container",
        containerClassName
      )}
    >
      <table
        ref={ref}
        className={cn(
          "w-full caption-bottom text-sm text-text font-sans",
          stickyHeader ? "border-separate border-spacing-0" : "border-collapse",
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  )
);
UITable.displayName = "UITable";

export const UITableHeader = forwardRef(({ children, className, sticky = false, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "border-b border-border/80 bg-surface-alt/95 backdrop-blur-xs text-text-muted select-none",
      sticky && "sticky top-0 z-20 shadow-xs",
      className
    )}
    {...props}
  >
    {children}
  </thead>
));
UITableHeader.displayName = "UITableHeader";

export const UITableBody = forwardRef(({ children, className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-b-0 divide-y divide-border/60", className)} {...props}>
    {children}
  </tbody>
));
UITableBody.displayName = "UITableBody";

export const UITableRow = forwardRef(
  ({ children, className, selected = false, hoverable = true, ...props }, ref) => (
    <tr
      ref={ref}
      data-state={selected ? "selected" : undefined}
      className={cn(
        "border-b border-border/60 transition-colors duration-100 last:border-b-0",
        hoverable && "hover:bg-surface-hover/70",
        selected && "bg-primary/5 font-medium",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
);
UITableRow.displayName = "UITableRow";

export const UITableHead = forwardRef(
  (
    {
      children,
      className,
      sortable = false,
      sortDirection = null, // "asc" | "desc" | null
      onSort,
      align = "left",
      sticky = false,
      ...props
    },
    ref
  ) => {
    const alignClass = align === "right" ? "text-right justify-end" : align === "center" ? "text-center justify-center" : "text-left justify-start";

    return (
      <th
        ref={ref}
        onClick={sortable ? onSort : undefined}
        className={cn(
          "h-10 px-3.5 align-middle text-xs font-bold uppercase tracking-wider text-text-muted select-none whitespace-nowrap",
          sticky && "sticky top-0 z-20 bg-surface-alt/95 backdrop-blur-xs border-b border-border shadow-xs",
          sortable && "cursor-pointer hover:text-text group transition-colors",
          align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
          className
        )}
        {...props}
      >
        <div className={cn("inline-flex items-center gap-1.5", alignClass)}>
          <span>{children}</span>
          {sortable && (
            <span className="text-text-muted group-hover:text-primary transition-colors">
              {sortDirection === "asc" ? (
                <ArrowUp className="size-3.5 text-primary stroke-[2.5]" />
              ) : sortDirection === "desc" ? (
                <ArrowDown className="size-3.5 text-primary stroke-[2.5]" />
              ) : (
                <ArrowUpDown className="size-3.5 opacity-50 group-hover:opacity-100" />
              )}
            </span>
          )}
        </div>
      </th>
    );
  }
);
UITableHead.displayName = "UITableHead";

export const UITableCell = forwardRef(
  ({ children, className, align = "left", mono = false, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "p-3.5 align-middle text-xs sm:text-sm text-text",
        align === "right" && "text-right",
        align === "center" && "text-center",
        mono && "font-mono tabular-nums",
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
);
UITableCell.displayName = "UITableCell";

export const UITableEmpty = forwardRef(
  (
    {
      colSpan = 1,
      title = "No records found",
      description = "Try adjusting your filters or search query.",
      icon = <Inbox className="size-8 text-text-muted/60" />,
      action,
      className,
      ...props
    },
    ref
  ) => (
    <tr ref={ref} {...props}>
      <td colSpan={colSpan} className={cn("py-12 px-4 text-center select-none", className)}>
        <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
          {icon}
          <h4 className="text-sm font-bold text-text">{title}</h4>
          {description && <p className="text-xs text-text-muted">{description}</p>}
          {action && <div className="pt-2">{action}</div>}
        </div>
      </td>
    </tr>
  )
);
UITableEmpty.displayName = "UITableEmpty";

export const UITableLoading = forwardRef(
  ({ colSpan, columns, rows = 6, className, ...props }, ref) => {
    const colsCount = Math.max(1, Number(columns || colSpan || 6));
    return (
      <>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <tr
            key={rowIdx}
            ref={rowIdx === 0 ? ref : undefined}
            className="border-b border-border/40 animate-pulse"
            {...props}
          >
            {Array.from({ length: colsCount }).map((_, colIdx) => (
              <td key={colIdx} className={cn("px-4 py-3.5", className)}>
                <div
                  className={cn(
                    "h-4 bg-surface-alt rounded",
                    colIdx === 0
                      ? "w-3/4"
                      : colIdx === colsCount - 1
                      ? "w-1/2 ml-auto"
                      : colIdx % 3 === 0
                      ? "w-4/5"
                      : colIdx % 2 === 0
                      ? "w-2/3"
                      : "w-3/5"
                  )}
                />
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  }
);
UITableLoading.displayName = "UITableLoading";

export default UITable;
