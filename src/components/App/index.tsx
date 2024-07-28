import { useState } from "react";
import Controls from "../Controls";
import Dimensions from "../Dimensions";
import Stats from "../Stats";
import Terminal from "../Terminal";
import "./index.css";
import { generate } from "../../worlds";
import { createWorld } from "../../engine";

export default function App() {
  // generate initial world
  // TODO: find better way to prevent double generation
  const [world] = useState(() => {
    const world = createWorld();
    setTimeout(generate, 0, world);
    return world;
  });

  return (
    <Dimensions className="App">
      <Stats />
      <Terminal world={world} />
      <Controls />
    </Dimensions>
  );
}
