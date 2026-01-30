import { enableBodyScroll } from "body-scroll-lock";
import { useEffect, useRef } from "react";
import { useResizeListener } from "./sizing";

const useScrollLock = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    enableBodyScroll(containerRef.current);
  }, [containerRef]);

  return containerRef;
};

export default function ScrollLock(props: React.ComponentProps<"div">) {
  const containerRef = useScrollLock();

  useResizeListener(dimensions => {
    document.documentElement.style.setProperty("--100vh", `${dimensions.screenHeight}px`);
    document.documentElement.style.setProperty("--pixel-size", `${dimensions.pixelSize}px`);
    document.documentElement.style.setProperty("--cell-height", `${dimensions.cellHeight}px`);
    document.documentElement.style.setProperty("--cell-width", `${dimensions.cellWidth}px`);
    document.documentElement.style.setProperty("--left-offset", `${dimensions.leftOffset}px`);
    document.documentElement.style.setProperty("--right-offset", `${dimensions.rightOffset}px`);
    document.documentElement.style.setProperty("--top-offset", `${dimensions.topOffset}px`);
    document.documentElement.style.setProperty("--bottom-offset", `${dimensions.bottomOffset}px`);
    document.documentElement.style.setProperty("--terminal-width", `${dimensions.terminalWidth}px`);
    document.documentElement.style.setProperty("--hud-rows", `${dimensions.hudRows}`);
  });

  return <div {...props} ref={containerRef} />;
}
