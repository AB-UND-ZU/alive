import o9n from "o9n";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./components/App";

o9n.install();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
