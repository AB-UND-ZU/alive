import o9n from "o9n";
import React from "react";
import ReactDOM from "react-dom/client";

__webpack_public_path__ =
  (process.env.PUBLIC_URL || "").replace(/\/$/, "") + "/";

const path = window.location.pathname;
const query = new URLSearchParams(window.location.search);
const clientBase = (process.env.PUBLIC_URL || "").replace(/\/$/, "") + "/";
const featurePreview =
  path === clientBase + "preview.html" ||
  (process.env.NODE_ENV === "development" &&
    ["/preview.html", "/html/preview.html", "/terminal/preview.html"].includes(
      path
    ));
const interfacePreview =
  path === clientBase + "interface-preview.html" ||
  (process.env.NODE_ENV === "development" &&
    path === "/interface-preview.html");
const developmentClient =
  interfacePreview ||
  featurePreview ||
  query.has("preview") ||
  ["/html", "/html/", "/terminal", "/terminal/"].some(
    (prefix) =>
      path === prefix ||
      path.startsWith(prefix + (prefix.endsWith("/") ? "" : "/"))
  );

if (
  process.env.REACT_APP_WIKI === "true" &&
  (process.env.NODE_ENV !== "development" || !developmentClient)
) {
  void import("./wiki");
} else {
  o9n.install();
  const mount = ({ default: App }: { default: React.ComponentType }) => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  };
  if (featurePreview) {
    void import("./wiki/preview");
  } else if (process.env.REACT_APP_RENDERER === "terminal") {
    void import("./renderers/terminal/App").then(mount);
  } else if (
    process.env.NODE_ENV === "development" &&
    (path.split("/").includes("terminal") ||
      query.get("renderer") === "terminal")
  ) {
    void import("./renderers/terminal/App").then(mount);
  } else if (interfacePreview) {
    void import("./wiki/interface");
  } else {
    void import("./components/App").then(mount);
  }
}
