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
    document.documentElement.style.setProperty("--cell-height", `${dimensions.cellHeight}px`);
    document.documentElement.style.setProperty("--cell-width", `${dimensions.cellWidth}px`);
  });

  return <div {...props} ref={containerRef} />;
}
