import "./index.css";
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
      <Paused />
    </main>
  );
}
