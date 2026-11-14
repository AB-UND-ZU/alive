import { useWorld } from "../interface/hooks";
import { useDimensions } from "../../components/Dimensions";
import type { SceneName } from "../../wiki/sceneDefinitions";
import BrowserPreview from "./BrowserPreview";

export default function FeaturePreview({
  children,
}: React.PropsWithChildren<{ name: SceneName; shadows: boolean }>) {
  const { ecs, paused, suspended } = useWorld();
  const dimensions = useDimensions();
  if (!ecs) return null;
  return (
    <div className="ClientTerminal">
      <BrowserPreview
        world={ecs}
        columns={Math.max(
          33,
          Math.min(65, Math.floor(dimensions.screenWidth / 9))
        )}
        rows={30}
        cellWidth={9}
        cellHeight={16}
        paused={paused || suspended}
      />
      {children}
    </div>
  );
}
