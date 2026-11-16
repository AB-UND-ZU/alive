import Stats from "../components/Stats";
import Terminal from "../components/Terminal";
import Controls from "../components/Controls";
import { DemoFrame } from "./DemoFrame";
import { sceneLayout, SceneName } from "./sceneDefinitions";
import BrowserRenderer from "../renderers/browser";
import { useWorld } from "../renderers/interface/hooks";

export default function BrowserPreviewClient({
  name,
  shadows,
  children,
}: React.PropsWithChildren<{ name: SceneName; shadows: boolean }>) {
  const { ecs, paused, suspended } = useWorld();
  if (name === "comparison") {
    const { columns, rows } = sceneLayout(name);
    return ecs ? (
      <div className="ComparisonClient">
        <BrowserRenderer
          world={ecs}
          columns={columns}
          rows={rows}
          cellWidth={18}
          cellHeight={32}
          paused={paused || suspended}
          shadows={shadows}
        />
      </div>
    ) : null;
  }
  return (
    <>
      <Stats />
      <Terminal shadows={shadows}>
        {name !== "game" && name !== "interface" && <DemoFrame />}
      </Terminal>
      <Controls compact={name !== "game" && name !== "interface"}>
        {children}
      </Controls>
    </>
  );
}
