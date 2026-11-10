import o9n from "o9n";
import React from "react";
import ReactDOM from "react-dom/client";

if (process.env.REACT_APP_WIKI === "true") {
  void import("./wiki");
} else {
  o9n.install();
  void import("./components/App").then(({ default: App }) => {
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
}
