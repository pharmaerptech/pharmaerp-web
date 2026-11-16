// src/components/ui/UIInfiniteScroll.jsx

import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * UIInfiniteScroll
 * 
 * Reusable intersection-observer component for infinite scrolling.
 * Supports window scroll and scrollable parent containers (via rootRef).
 * 
 * @param {Function} onLoadMore - Callback fired when sentinel enters viewport
 * @param {boolean} hasMore - Whether additional records exist to load
 * @param {boolean} isLoading - Whether a fetch is currently in progress
 * @param {React.RefObject} rootRef - Optional ref to a scrollable container
 * @param {string} rootMargin - Margin around the root (default: "160px")
 * @param {number} threshold - Intersection threshold (default: 0.1)
 * @param {React.ReactNode} loader - Custom loading component
 * @param {React.ReactNode} endMessage - Custom end-of-list message
 * @param {boolean} disabled - Disable observer triggers
 * @param {string} className - Wrapper container class
 * @param {React.ReactNode} children - Children content
 */
export const UIInfiniteScroll = ({
  onLoadMore,
  hasMore = false,
  isLoading = false,
  rootRef = null,
  scrollContainerRef = null,
  rootMargin = "160px",
  threshold = 0.1,
  loader = null,
  loadingIndicator = null,
  endMessage = null,
  disabled = false,
  className = "",
  children,
}) => {
  const sentinelRef = useRef(null);
  const loadingRef = useRef(isLoading);
  loadingRef.current = isLoading;

  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;

  // Ensure threshold is always a valid number between 0 and 1
  const safeThreshold =
    typeof threshold === "number" && threshold >= 0 && threshold <= 1
      ? threshold
      : 0.1;

  const resolvedRoot = (rootRef || scrollContainerRef)?.current || null;
  const activeLoader = loader || loadingIndicator;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || disabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first.isIntersecting &&
          hasMoreRef.current &&
          !loadingRef.current &&
          typeof onLoadMore === "function"
        ) {
          onLoadMore();
        }
      },
      {
        root: resolvedRoot,
        rootMargin,
        threshold: safeThreshold,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, resolvedRoot, rootMargin, safeThreshold, disabled]);

  return (
    <div
      data-infinite-scroll="true"
      className={cn("w-full flex flex-col ui-infinite-scroll", className)}
    >
      {children}

      {/* Sentinel Trigger */}
      <div
        ref={sentinelRef}
        aria-hidden="true"
        className="h-4 w-full pointer-events-none opacity-0 shrink-0"
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="py-4 flex items-center justify-center gap-2 text-xs font-medium text-text-muted select-none">
          {activeLoader || (
            <>
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Loading more items...</span>
            </>
          )}
        </div>
      )}

      {/* End of list message */}
      {!hasMore && !isLoading && endMessage && (
        <div className="py-4 text-center text-xs text-text-muted select-none">
          {endMessage}
        </div>
      )}
    </div>
  );
};

export default UIInfiniteScroll;
