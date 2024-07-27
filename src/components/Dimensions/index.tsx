import { enableBodyScroll } from "body-scroll-lock";

import { useEffect, useLayoutEffect } from "react";
import "./index.css";
import React from "react";

/**
 * Prevent mobile browsers from trying to scroll and thus collapse the window height
 */
export default function Dimensions({
  appRef,
}: {
  appRef: React.RefObject<HTMLDivElement>;
}) {
  useLayoutEffect(() => {
    const fullHeight = window.innerHeight;
    document.documentElement.style.setProperty("--100vh", `${fullHeight}px`);
  }, []);

  useEffect(() => {
    if (!appRef.current) return;

    enableBodyScroll(appRef.current);
  }, [appRef]);

  return null;
}
