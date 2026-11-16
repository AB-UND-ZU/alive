import { useWorld } from "../interface/hooks";
import { useDimensions } from "../../components/Dimensions";
import { sceneLayout, SceneName } from "../../wiki/sceneDefinitions";
import BrowserPreview from "./BrowserPreview";

export default function FeaturePreview({
  name,
  children,
}: React.PropsWithChildren<{ name: SceneName; shadows: boolean }>) {
  const { ecs, paused, suspended } = useWorld();
  const dimensions = useDimensions();
  if (!ecs) return null;
  return (
    <div className="ClientTerminal">
      <BrowserPreview
        world={ecs}
        columns={
          name === "comparison"
            ? 11
            : Math.max(33, Math.floor(dimensions.screenWidth / 18))
        }
        rows={sceneLayout(name).rows}
        cellWidth={18}
        cellHeight={32}
        sceneOnly={name === "comparison"}
        paused={paused || suspended}
      />
      {children}
    </div>
  );
}
