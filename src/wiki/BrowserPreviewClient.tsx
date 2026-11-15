import Stats from "../components/Stats";
import Terminal from "../components/Terminal";
import Controls from "../components/Controls";
import { DemoFrame } from "./DemoFrame";
import type { SceneName } from "./sceneDefinitions";

export default function BrowserPreviewClient({
  name,
  shadows,
  children,
}: React.PropsWithChildren<{ name: SceneName | "servers"; shadows: boolean }>) {
  const compact = !["game", "interface", "servers"].includes(name);
  return (
    <>
      <Stats />
      <Terminal shadows={shadows}>{compact && <DemoFrame />}</Terminal>
      <Controls compact={compact} pauseOnBlur={name !== "servers"}>
        {children}
      </Controls>
    </>
  );
}
