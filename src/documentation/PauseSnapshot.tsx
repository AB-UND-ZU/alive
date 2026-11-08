import { useState } from "react";
import { WorldProvider, useWorld } from "../bindings/hooks";
import Paused from "../components/Paused";
import { createPreviewWorld } from "./scenes";

export function PauseSnapshot() {
  const defaults = useWorld();
  const [ecs] = useState(() => createPreviewWorld("interface"));
  return (
    <WorldProvider
      value={{
        ...defaults,
        ecs,
        paused: true,
        initial: false,
        suspended: false,
        saveStatus: { saving: false, name: "20261011-151323" },
      }}
    >
      <div className="PauseSnapshot">
        <Paused />
      </div>
    </WorldProvider>
  );
}
