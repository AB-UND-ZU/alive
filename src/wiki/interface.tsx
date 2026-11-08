import { createRoot } from "react-dom/client";
import { StaticInterface } from "./StaticInterface";
import { muteAudio } from "../game/sound/resumable";
import "../components/App/index.css";
import "./static-interface.css";
muteAudio();
createRoot(document.getElementById("root")!).render(
  <StaticInterface labels={window.location.hash !== "#reference"} />
);
