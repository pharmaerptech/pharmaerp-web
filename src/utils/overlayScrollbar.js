// src/utils/overlayScrollbar.js

const attachedContainers = new WeakMap();

/**
 * Attaches a floating overlay scrollbar (WhatsApp/macOS style) to a scrollable table container.
 * The container's native scrollbars are hidden via CSS so they take zero layout width.
 * A floating thumb is superimposed directly over the right/bottom edge of the content within the parent box.
 * 
 * @param {HTMLElement} container - The scrollable element (e.g. tableContainerRef.current)
 * @returns {object|null} Controller handle
 */
export function attachOverlayScrollbar(container) {
  if (!container || !(container instanceof HTMLElement)) return null;

  // If container is managed by React's UITableScrollArea, skip it completely
  if (
    container.hasAttribute("data-react-overlay-scroll") ||
    container.closest("[data-react-overlay-scroll]") ||
    container.parentElement?.hasAttribute("data-react-overlay-scroll")
  ) {
    return null;
  }

  const parent = container.parentElement;
  if (!parent) return null;

  if (attachedContainers.has(container)) {
    const existing = attachedContainers.get(container);
    // If the thumb elements were removed by React virtual DOM re-render, re-attach them
    if (existing.vThumb && !parent.contains(existing.vThumb)) {
      parent.appendChild(existing.vThumb);
    }
    if (existing.hThumb && !parent.contains(existing.hThumb)) {
      parent.appendChild(existing.hThumb);
    }
    existing.update();
    return existing;
  }

  // Ensure parent has position: relative so overlay thumbs are positioned within it
  if (window.getComputedStyle(parent).position === "static") {
    parent.style.position = "relative";
  }

  // Create vertical floating thumb
  const vThumb = document.createElement("div");
  vThumb.className = "table-overlay-scrollbar-thumb table-overlay-scrollbar-v";
  vThumb.setAttribute("aria-hidden", "true");
  vThumb.setAttribute("title", "Scroll table");

  // Create horizontal floating thumb
  const hThumb = document.createElement("div");
  hThumb.className = "table-overlay-scrollbar-thumb table-overlay-scrollbar-h";
  hThumb.setAttribute("aria-hidden", "true");
  hThumb.setAttribute("title", "Scroll table horizontally");

  parent.appendChild(vThumb);
  parent.appendChild(hThumb);

  let hideTimeout = null;
  let isDraggingV = false;
  let isDraggingH = false;

  const updatePositions = () => {
    if (!container.isConnected || !parent.isConnected) {
      handle.destroy();
      return;
    }

    // Re-attach thumbs if React re-render removed them from the DOM
    if (!parent.contains(vThumb)) {
      parent.appendChild(vThumb);
    }
    if (!parent.contains(hThumb)) {
      parent.appendChild(hThumb);
    }

    const { clientHeight, scrollHeight, scrollTop, clientWidth, scrollWidth, scrollLeft, offsetTop, offsetLeft } = container;

    // Vertical thumb calculation
    if (scrollHeight > clientHeight + 2) {
      vThumb.style.display = "block";
      const availableHeight = clientHeight - 8; // 4px padding top/bottom
      const thumbHeight = Math.max(30, Math.min(availableHeight * 0.8, (clientHeight / scrollHeight) * availableHeight));
      const maxScrollTop = scrollHeight - clientHeight;
      const scrollRatio = maxScrollTop > 0 ? Math.max(0, Math.min(1, scrollTop / maxScrollTop)) : 0;
      const maxThumbTop = availableHeight - thumbHeight;
      const thumbTop = offsetTop + 4 + scrollRatio * maxThumbTop;

      vThumb.style.height = `${thumbHeight}px`;
      vThumb.style.transform = `translate3d(0, ${thumbTop}px, 0)`;
    } else {
      vThumb.style.display = "none";
    }

    // Horizontal thumb calculation
    if (scrollWidth > clientWidth + 2) {
      hThumb.style.display = "block";
      const availableWidth = clientWidth - 8; // 4px padding left/right
      const thumbWidth = Math.max(30, Math.min(availableWidth * 0.8, (clientWidth / scrollWidth) * availableWidth));
      const maxScrollLeft = scrollWidth - clientWidth;
      const scrollRatio = maxScrollLeft > 0 ? Math.max(0, Math.min(1, scrollLeft / maxScrollLeft)) : 0;
      const maxThumbLeft = availableWidth - thumbWidth;
      const thumbLeft = offsetLeft + 4 + scrollRatio * maxThumbLeft;

      hThumb.style.width = `${thumbWidth}px`;
      hThumb.style.transform = `translate3d(${thumbLeft}px, 0, 0)`;
    } else {
      hThumb.style.display = "none";
    }
  };

  const showScrollbars = () => {
    updatePositions();
    vThumb.classList.add("is-scrolling");
    hThumb.classList.add("is-scrolling");

    if (hideTimeout) clearTimeout(hideTimeout);
    if (!isDraggingV && !isDraggingH) {
      hideTimeout = setTimeout(() => {
        vThumb.classList.remove("is-scrolling");
        hThumb.classList.remove("is-scrolling");
      }, 800);
    }
  };

  const onScroll = () => {
    showScrollbars();
  };

  const onWheel = () => {
    showScrollbars();
  };

  // Dragging support for vertical thumb
  vThumb.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingV = true;
    vThumb.classList.add("is-dragging", "is-scrolling");
    vThumb.setPointerCapture(e.pointerId);

    const startY = e.clientY;
    const startScrollTop = container.scrollTop;
    const availableHeight = container.clientHeight - 8;
    const thumbHeight = vThumb.offsetHeight;
    const maxThumbTop = availableHeight - thumbHeight;
    const maxScrollTop = container.scrollHeight - container.clientHeight;

    const onPointerMove = (moveEvent) => {
      if (!isDraggingV) return;
      const deltaY = moveEvent.clientY - startY;
      const scrollDelta = maxThumbTop > 0 ? (deltaY / maxThumbTop) * maxScrollTop : 0;
      container.scrollTop = startScrollTop + scrollDelta;
      showScrollbars();
    };

    const onPointerUp = (upEvent) => {
      isDraggingV = false;
      vThumb.classList.remove("is-dragging");
      try {
        vThumb.releasePointerCapture(upEvent.pointerId);
      } catch (_) {}
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      hideTimeout = setTimeout(() => {
        vThumb.classList.remove("is-scrolling");
        hThumb.classList.remove("is-scrolling");
      }, 800);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  });

  // Dragging support for horizontal thumb
  hThumb.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingH = true;
    hThumb.classList.add("is-dragging", "is-scrolling");
    hThumb.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startScrollLeft = container.scrollLeft;
    const availableWidth = container.clientWidth - 8;
    const thumbWidth = hThumb.offsetWidth;
    const maxThumbLeft = availableWidth - thumbWidth;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    const onPointerMove = (moveEvent) => {
      if (!isDraggingH) return;
      const deltaX = moveEvent.clientX - startX;
      const scrollDelta = maxThumbLeft > 0 ? (deltaX / maxThumbLeft) * maxScrollLeft : 0;
      container.scrollLeft = startScrollLeft + scrollDelta;
      showScrollbars();
    };

    const onPointerUp = (upEvent) => {
      isDraggingH = false;
      hThumb.classList.remove("is-dragging");
      try {
        hThumb.releasePointerCapture(upEvent.pointerId);
      } catch (_) {}
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      hideTimeout = setTimeout(() => {
        vThumb.classList.remove("is-scrolling");
        hThumb.classList.remove("is-scrolling");
      }, 800);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  });

  container.addEventListener("scroll", onScroll, { passive: true });
  container.addEventListener("wheel", onWheel, { passive: true });

  // Observe resize of container and its content
  const resizeObserver = new ResizeObserver(() => {
    updatePositions();
  });
  resizeObserver.observe(container);
  if (container.firstElementChild) {
    resizeObserver.observe(container.firstElementChild);
  }

  // Initial calculation
  updatePositions();

  const handle = {
    vThumb,
    hThumb,
    update: updatePositions,
    destroy: () => {
      if (hideTimeout) clearTimeout(hideTimeout);
      container.removeEventListener("scroll", onScroll);
      container.removeEventListener("wheel", onWheel);
      resizeObserver.disconnect();
      vThumb.remove();
      hThumb.remove();
      attachedContainers.delete(container);
    },
  };

  attachedContainers.set(container, handle);
  return handle;
}

/**
 * Automatically scans and attaches overlay scrollbars to all table scroll containers.
 * Observes DOM mutations to handle page transitions and dynamic content seamlessly.
 * 
 * @returns {function} Cleanup function
 */
export function initAllOverlayScrollbars() {
  const selector = ".table-scroll-container, [data-table-scroll], div.overflow-y-auto:has(table), div.overflow-auto:has(table)";

  const scan = () => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      if (el instanceof HTMLElement && el.parentElement) {
        attachOverlayScrollbar(el);
      }
    });
  };

  // Immediate scan
  scan();

  // MutationObserver for page navigation and newly mounted tables
  const observer = new MutationObserver(() => {
    scan();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
  };
}
