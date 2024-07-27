import { enableBodyScroll } from "body-scroll-lock";

import { useEffect, useLayoutEffect } from "react";
import "./index.css";
import React from "react";

const updateDimensions = () => {
  const fullHeight = window.innerHeight;
  document.documentElement.style.setProperty("--100vh", `${fullHeight}px`);
};

/**
 * Prevent mobile browsers from trying to scroll and thus collapse the window height
 */
export default function Dimensions({
  appRef,
}: {
  appRef: React.RefObject<HTMLDivElement>;
}) {
  useLayoutEffect(updateDimensions, []);

  useEffect(() => {
    if (!appRef.current) return;

    enableBodyScroll(appRef.current);
    window.addEventListener("resize", updateDimensions, true);

    return () => window.removeEventListener("resize", updateDimensions);
  }, [appRef]);

  return null;
}
