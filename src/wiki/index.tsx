const wikiBase = new URL(
  (process.env.PUBLIC_URL || "").replace(/\/$/, "") + "/",
  window.location.origin
);
if (window.location.pathname === new URL("preview.html", wikiBase).pathname) {
  const [scene, variant] = window.location.hash.slice(1).split("/");
  const query = new URLSearchParams(window.location.search);
  const renderer = scene === "clients" ? variant : query.get("renderer");
  const suffix =
    renderer === "html" || renderer === "terminal" ? renderer + "/" : "";
  const target = new URL("../" + suffix, wikiBase);
  query.delete("renderer");
  if (scene === "clients") query.set("preview", "");
  else target.pathname += "preview.html";
  target.search = query.toString();
  target.hash = scene === "clients" ? "" : window.location.hash;
  window.location.replace(target.href);
} else if (
  window.location.pathname ===
  new URL("interface-preview.html", wikiBase).pathname
) {
  const target = new URL("../interface-preview.html", wikiBase);
  target.hash = window.location.hash;
  window.location.replace(target.href);
} else {
  document.body.className = "App Wiki";
  void import("./App");
}

export {};
