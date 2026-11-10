import React from "react";
import { createRoot } from "react-dom/client";
import App from "../../src/components/App";
import { seedRandom } from "../../src/testing/env";
import "../../src/index.css";
seedRandom(42);
createRoot(document.getElementById("root")!).render(<App />);
