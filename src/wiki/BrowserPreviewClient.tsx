import Stats from "../components/Stats";
import Terminal from "../components/Terminal";
import Controls from "../components/Controls";
import { DemoFrame } from "./DemoFrame";
import type { SceneName } from "./sceneDefinitions";

export default function BrowserPreviewClient({
  name,
  shadows,
  children,
}: React.PropsWithChildren<{ name: SceneName; shadows: boolean }>) {
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
