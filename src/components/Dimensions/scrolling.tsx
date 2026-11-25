import { enableBodyScroll } from "body-scroll-lock";
import { useEffect, useRef } from "react";
import { DimensionOptions, useResizeListener } from "./sizing";

const useScrollLock = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    enableBodyScroll(container);

    if (!window.CSS?.supports?.("-webkit-touch-callout", "none")) return;
    // Cancel WebKit's tap-and-hold loupe across the whole game. Canceling
    // touchstart also suppresses its click, so deliver the tap on release.
    let tapTarget: EventTarget | null = null;
    const preventLoupe = (event: TouchEvent) => {
      if (event.cancelable) event.preventDefault();
      tapTarget =
        event.defaultPrevented && event.touches.length === 1 ? event.target : null;
    };
    const handlePointer = (event: PointerEvent) => {
      if (event.pointerType !== "touch" || !event.isPrimary) return;
      if (event.type === "pointerup" && tapTarget && event.target === tapTarget) {
        tapTarget.dispatchEvent(new PointerEvent("click", event));
      }
      tapTarget = null;
    };
    const listeners = new AbortController();
    const { signal } = listeners;
    container.addEventListener("touchstart", preventLoupe, { passive: false, signal });
    for (const type of ["pointerdown", "pointerup", "pointercancel"] as const)
      container.addEventListener(type, handlePointer, { signal });
    return () => listeners.abort();
  }, []);

  return containerRef;
};

export default function ScrollLock({
  options,
  ...props
}: React.ComponentProps<"div"> & { options?: DimensionOptions }) {
  const containerRef = useScrollLock();

  useResizeListener((dimensions) => {
    document.documentElement.style.setProperty(
      "--game-height",
      `${dimensions.rows * dimensions.cellHeight}px`
    );
    document.documentElement.style.setProperty(
      "--pixel-size",
      `${dimensions.pixelSize}px`
    );
    document.documentElement.style.setProperty(
      "--cell-height",
      `${dimensions.cellHeight}px`
    );
    document.documentElement.style.setProperty(
      "--cell-width",
      `${dimensions.cellWidth}px`
    );
    document.documentElement.style.setProperty(
      "--left-offset",
      `${dimensions.leftOffset}px`
    );
    document.documentElement.style.setProperty(
      "--right-offset",
      `${dimensions.rightOffset}px`
    );
    document.documentElement.style.setProperty(
      "--top-offset",
      `${dimensions.topOffset}px`
    );
    document.documentElement.style.setProperty(
      "--bottom-offset",
      `${dimensions.bottomOffset}px`
    );
    document.documentElement.style.setProperty(
      "--terminal-width",
      `${dimensions.terminalWidth}px`
    );
    document.documentElement.style.setProperty(
      "--terminal-height",
      `${dimensions.terminalHeight}px`
    );
    document.documentElement.style.setProperty(
      "--hud-rows",
      `${dimensions.hudRows}`
    );
  }, options);

  return <div {...props} ref={containerRef} />;
}
