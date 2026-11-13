import { lazy, Suspense } from "react";
import type { RendererProps } from "./interface/types";

const ThreeJsRenderer = lazy(() => import("./three-js"));
const HtmlRenderer = lazy(() => import("./html"));
export type BrowserRendererName = "three-js" | "html";

export const browserRenderer = (): BrowserRendererName =>
  new URLSearchParams(window.location.search).get("renderer") === "html"
    ? "html"
    : "three-js";

export default function BrowserRenderer({
  renderer = browserRenderer(),
  ...props
}: RendererProps & { renderer?: BrowserRendererName }) {
  return (
    <Suspense fallback={null}>
      {renderer === "html" ? (
        <HtmlRenderer {...props} />
      ) : (
        <ThreeJsRenderer {...props} />
      )}
    </Suspense>
  );
}
