import { ComponentType, lazy, LazyExoticComponent, Suspense } from "react";
import type { RendererProps } from "./interface/types";

export type BrowserRendererName = "excalibur" | "three-js" | "html";

export const browserRenderer = (): BrowserRendererName => {
  if (process.env.NODE_ENV === "development") {
    const requested = new URLSearchParams(window.location.search).get(
      "renderer"
    );
    const path = window.location.pathname.split("/");
    for (const name of ["excalibur", "three-js", "html"] as const)
      if (requested === name || (!requested && path.includes(name)))
        return name;
  }
  if (process.env.REACT_APP_RENDERER === "html") return "html";
  if (process.env.REACT_APP_RENDERER === "three-js") return "three-js";
  return "excalibur";
};

let Renderer: LazyExoticComponent<ComponentType<RendererProps>>;
if (process.env.NODE_ENV === "development") {
  const name = browserRenderer();
  if (name === "html") Renderer = lazy(() => import("./html"));
  else if (name === "three-js") Renderer = lazy(() => import("./three-js"));
  else Renderer = lazy(() => import("./excalibur"));
} else if (process.env.REACT_APP_RENDERER === "html") {
  Renderer = lazy(() => import("./html"));
} else if (process.env.REACT_APP_RENDERER === "three-js") {
  Renderer = lazy(() => import("./three-js"));
} else {
  Renderer = lazy(() => import("./excalibur"));
}

export default function BrowserRenderer(props: RendererProps) {
  return (
    <Suspense fallback={null}>
      <Renderer {...props} />
    </Suspense>
  );
}
