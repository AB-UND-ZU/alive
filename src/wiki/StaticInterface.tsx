import { useEffect } from "react";
import { useWorld } from "../bindings/hooks";
import Dimensions from "../components/Dimensions";
import World from "../components/World";
import Stats from "../components/Stats";
import Terminal from "../components/Terminal";
import Controls from "../components/Controls";
import { createPreviewWorld } from "./scenes";
import { InterfaceLabels } from "./InterfaceLabels";

function InterfaceWorld({ labels }: { labels: boolean }) {
  const { setPaused } = useWorld();
  useEffect(() => setPaused(false), [setPaused]);
  return (
    <>
      <Stats />
      <Terminal>{labels && <InterfaceLabels />}</Terminal>
      <Controls />
    </>
  );
}
export function StaticInterface({ labels = true }: { labels?: boolean }) {
  return (
    <Dimensions className="App StaticInterface">
      <World
        createInitialWorld={() => createPreviewWorld("interface")}
        persistent={false}
      >
        <InterfaceWorld labels={labels} />
      </World>
    </Dimensions>
  );
}
