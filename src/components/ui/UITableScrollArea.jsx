// src/components/ui/UITableScrollArea.jsx

import React, { forwardRef, useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * UITableScrollArea
 *
 * Provides a WhatsApp/macOS-style floating overlay scrollbar for tables.
 * The native scrollbars take 0 layout width (hidden via CSS), ensuring the table
 * gets 100% full width and the table header has ZERO offset.
 * A floating, draggable scrollbar thumb is superimposed directly ABOVE the right
 * (and bottom) side of the table when scrolling, and smoothly fades out when idle.
 *
 * @param {React.ReactNode} children - Table and infinite scroll elements
 * @param {string} className - Classes for the inner scrollable container
 * @param {string} containerClassName - Classes for the outer relative wrapper
 * @param {React.RefObject} containerRef - External ref to the scrollable container (e.g. tableContainerRef)
 * @param {number} autoHideDelay - Delay in ms before scrollbar fades out (default: 800ms)
 */
export const UITableScrollArea = forwardRef(
  (
    {
      children,
      className,
      containerRef,
      containerClassName,
      autoHideDelay = 800,
      onScroll: externalOnScroll,
      onWheel: externalOnWheel,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef(null);
    const scrollContainerRef = containerRef || ref || internalRef;

    const [isScrolling, setIsScrolling] = useState(false);
    const [isDraggingY, setIsDraggingY] = useState(false);
    const [isDraggingX, setIsDraggingX] = useState(false);
    const [thumbHeight, setThumbHeight] = useState(0);
    const [thumbTop, setThumbTop] = useState(0);
    const [thumbWidth, setThumbWidth] = useState(0);
    const [thumbLeft, setThumbLeft] = useState(0);
    const [canScrollY, setCanScrollY] = useState(false);
    const [canScrollX, setCanScrollX] = useState(false);

    const hideTimerRef = useRef(null);
    const isDraggingYRef = useRef(false);
    const isDraggingXRef = useRef(false);
    isDraggingYRef.current = isDraggingY;
    isDraggingXRef.current = isDraggingX;

    const updateThumb = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const { clientHeight, scrollHeight, scrollTop, clientWidth, scrollWidth, scrollLeft } = container;

      // Vertical calculation
      if (scrollHeight > clientHeight + 2) {
        setCanScrollY(true);
        const availableHeight = clientHeight - 8; // 4px padding top and bottom
        const calculatedHeight = Math.max(
          32,
          Math.min(availableHeight * 0.8, (clientHeight / scrollHeight) * availableHeight)
        );
        const maxScrollTop = scrollHeight - clientHeight;
        const scrollRatio = maxScrollTop > 0 ? Math.max(0, Math.min(1, scrollTop / maxScrollTop)) : 0;
        const maxThumbTop = availableHeight - calculatedHeight;
        const calculatedTop = 4 + scrollRatio * maxThumbTop;

        setThumbHeight(calculatedHeight);
        setThumbTop(calculatedTop);
      } else {
        setCanScrollY(false);
      }

      // Horizontal calculation
      if (scrollWidth > clientWidth + 2) {
        setCanScrollX(true);
        const availableWidth = clientWidth - 8; // 4px padding left and right
        const calculatedWidth = Math.max(
          32,
          Math.min(availableWidth * 0.8, (clientWidth / scrollWidth) * availableWidth)
        );
        const maxScrollLeft = scrollWidth - clientWidth;
        const scrollRatio = maxScrollLeft > 0 ? Math.max(0, Math.min(1, scrollLeft / maxScrollLeft)) : 0;
        const maxThumbLeft = availableWidth - calculatedWidth;
        const calculatedLeft = 4 + scrollRatio * maxThumbLeft;

        setThumbWidth(calculatedWidth);
        setThumbLeft(calculatedLeft);
      } else {
        setCanScrollX(false);
      }
    }, [scrollContainerRef]);

    const showScrollbars = useCallback(() => {
      updateThumb();
      setIsScrolling(true);

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (!isDraggingYRef.current && !isDraggingXRef.current) {
        hideTimerRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, autoHideDelay);
      }
    }, [updateThumb, autoHideDelay]);

    const handleScroll = useCallback(
      (e) => {
        showScrollbars();
        if (typeof externalOnScroll === "function") {
          externalOnScroll(e);
        }
      },
      [showScrollbars, externalOnScroll]
    );

    const handleWheel = useCallback(
      (e) => {
        showScrollbars();
        if (typeof externalOnWheel === "function") {
          externalOnWheel(e);
        }
      },
      [showScrollbars, externalOnWheel]
    );

    // Dragging support for vertical thumb
    const handleThumbPointerDown = useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        const container = scrollContainerRef.current;
        if (!container) return;

        setIsDraggingY(true);
        setIsScrolling(true);

        const startY = e.clientY;
        const startScrollTop = container.scrollTop;
        const availableHeight = container.clientHeight - 8;
        const maxThumbTop = availableHeight - thumbHeight;
        const maxScrollTop = container.scrollHeight - container.clientHeight;

        const onPointerMove = (moveEvent) => {
          const deltaY = moveEvent.clientY - startY;
          const scrollDelta = maxThumbTop > 0 ? (deltaY / maxThumbTop) * maxScrollTop : 0;
          container.scrollTop = startScrollTop + scrollDelta;
          updateThumb();
        };

        const onPointerUp = () => {
          setIsDraggingY(false);
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerUp);

          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => {
            setIsScrolling(false);
          }, autoHideDelay);
        };

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
      },
      [scrollContainerRef, thumbHeight, updateThumb, autoHideDelay]
    );

    // Dragging support for horizontal thumb
    const handleThumbHPointerDown = useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();

        const container = scrollContainerRef.current;
        if (!container) return;

        setIsDraggingX(true);
        setIsScrolling(true);

        const startX = e.clientX;
        const startScrollLeft = container.scrollLeft;
        const availableWidth = container.clientWidth - 8;
        const maxThumbLeft = availableWidth - thumbWidth;
        const maxScrollLeft = container.scrollWidth - container.clientWidth;

        const onPointerMove = (moveEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const scrollDelta = maxThumbLeft > 0 ? (deltaX / maxThumbLeft) * maxScrollLeft : 0;
          container.scrollLeft = startScrollLeft + scrollDelta;
          updateThumb();
        };

        const onPointerUp = () => {
          setIsDraggingX(false);
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerUp);

          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => {
            setIsScrolling(false);
          }, autoHideDelay);
        };

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
      },
      [scrollContainerRef, thumbWidth, updateThumb, autoHideDelay]
    );

    // Observe changes to container dimensions and child content
    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      updateThumb();

      const resizeObserver = new ResizeObserver(() => {
        updateThumb();
      });

      resizeObserver.observe(container);
      if (container.firstElementChild) {
        resizeObserver.observe(container.firstElementChild);
      }

      const mutationObserver = new MutationObserver(() => {
        updateThumb();
      });

      mutationObserver.observe(container, { childList: true, subtree: true });

      const onWindowResize = () => {
        updateThumb();
      };
      window.addEventListener("resize", onWindowResize);

      return () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
        window.removeEventListener("resize", onWindowResize);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      };
    }, [scrollContainerRef, updateThumb]);

    // Keep thumb position updated on component re-renders (e.g. data arrival)
    useEffect(() => {
      updateThumb();
    });

    const isVisible = isScrolling || isDraggingY || isDraggingX;

    return (
      <div
        className={cn(
          "relative flex-1 min-h-0 w-full overflow-hidden flex flex-col",
          containerClassName
        )}
        onPointerEnter={updateThumb}
      >
        {/* Scrollable Container (Native scrollbar hidden via CSS: 0 layout width) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onWheel={handleWheel}
          data-table-scroll="true"
          data-react-overlay-scroll="true"
          className={cn(
            "relative flex-1 min-h-0 overflow-y-auto overflow-x-auto table-scroll-container",
            className
          )}
          {...props}
        >
          {children}
        </div>

        {/* Vertical Floating Overlay Scrollbar (Over the right side of the table) */}
        {canScrollY && (
          <div
            className={cn(
              "table-overlay-scrollbar-thumb table-overlay-scrollbar-v",
              isVisible && "is-scrolling",
              isDraggingY && "is-dragging"
            )}
            style={{
              transform: `translate3d(0, ${thumbTop}px, 0)`,
              height: `${thumbHeight}px`,
            }}
            onPointerDown={handleThumbPointerDown}
            aria-hidden="true"
            title="Scroll table"
          />
        )}

        {/* Horizontal Floating Overlay Scrollbar (Over the bottom of the table) */}
        {canScrollX && (
          <div
            className={cn(
              "table-overlay-scrollbar-thumb table-overlay-scrollbar-h",
              isVisible && "is-scrolling",
              isDraggingX && "is-dragging"
            )}
            style={{
              transform: `translate3d(${thumbLeft}px, 0, 0)`,
              width: `${thumbWidth}px`,
            }}
            onPointerDown={handleThumbHPointerDown}
            aria-hidden="true"
            title="Scroll table horizontally"
          />
        )}
      </div>
    );
  }
);

UITableScrollArea.displayName = "UITableScrollArea";
export default UITableScrollArea;
