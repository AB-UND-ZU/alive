import { ComponentType, lazy, LazyExoticComponent, Suspense } from "react";
import type { RendererProps } from "./interface/types";

export type BrowserRendererName = "three-js" | "html";

export const browserRenderer = (): BrowserRendererName => {
  if (process.env.NODE_ENV === "development") {
    if (
      window.location.pathname.split("/").includes("html") ||
      new URLSearchParams(window.location.search).get("renderer") === "html"
    )
      return "html";
  }
  return process.env.REACT_APP_RENDERER === "html" ? "html" : "three-js";
};

let Renderer: LazyExoticComponent<ComponentType<RendererProps>>;
if (process.env.NODE_ENV === "development") {
  Renderer =
    browserRenderer() === "html"
      ? lazy(() => import("./html"))
      : lazy(() => import("./three-js"));
} else if (process.env.REACT_APP_RENDERER === "html") {
  Renderer = lazy(() => import("./html"));
} else {
  Renderer = lazy(() => import("./three-js"));
}

export default function BrowserRenderer(props: RendererProps) {
  return (
    <Suspense fallback={null}>
      <Renderer {...props} />
    </Suspense>
  );
}
