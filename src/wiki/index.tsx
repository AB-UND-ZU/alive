const route = window.location.pathname.split("/").pop();
if (route === "preview.html") {
  void import("./preview");
} else if (route === "interface-preview.html") {
  void import("./interface");
} else {
  document.body.className = "App Wiki";
  void import("./App");
}

export {};
