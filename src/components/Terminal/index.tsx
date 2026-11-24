import "./index.css";
import { useCallback, useState } from "react";
import { LEVEL } from "../../engine/components/level";
import Paused from "../Paused";
import { useDimensions } from "../Dimensions";
import Row from "../Row";
import { colors } from "../../game/assets/colors";
import { overscanRows } from "../Dimensions/sizing";
import { createText } from "../../game/assets/ui";
import { useWorld } from "../../renderers/interface/hooks";
import BrowserRenderer from "../../renderers/browser";

export const frameColor = colors.silver;

export default function Terminal({
  children,
  shadows = true,
}: React.PropsWithChildren<{ shadows?: boolean }>) {
  const dimensions = useDimensions();
  const { ecs, paused, suspended } = useWorld();

  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const preparingMap = !ready && ecs?.metadata.gameEntity[LEVEL]?.name === "LEVEL_ISLAND";

  return (
    <main className="Terminal">
      <div className="LeftEdge">
        {Array.from({ length: dimensions.renderedRows - overscanRows + 1 }).map(
          (_, index) => (
            <Row key={index} cells={createText("│", frameColor)} />
          )
        )}
      </div>
      {ecs && (
        <BrowserRenderer
          world={ecs}
          columns={dimensions.renderedColumns}
          rows={dimensions.renderedRows}
          cellWidth={dimensions.cellWidth}
          cellHeight={dimensions.cellHeight}
          paused={paused || suspended}
          shadows={shadows}
          onReady={preparingMap ? onReady : undefined}
        />
      )}
      <div className="RightEdge">
        {Array.from({ length: dimensions.renderedRows - overscanRows + 1 }).map(
          (_, index) => (
            <Row key={index} cells={createText("│", frameColor)} />
          )
        )}
      </div>
      {children}
      <Paused preparingMap={preparingMap} />
    </main>
  );
}
