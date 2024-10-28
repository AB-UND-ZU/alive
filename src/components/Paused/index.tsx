import { createText, overlay, resume } from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";
import { isTouch, useDimensions } from "../Dimensions";
import Row from "../Row";
import "./index.css";
import { useCallback } from "react";
import { useWorld } from "../../bindings/hooks";
import { repeat } from "../../game/math/std";

export default function Paused() {
  const { setPaused } = useWorld();
  const dimensions = useDimensions();
  const handleResume = useCallback(
    (event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();

      setPaused(false);
    },
    [setPaused]
  );

  return (
    <div className="Paused">
      <div className="Cover">
        {Array.from({ length: dimensions.renderedRows - 5 }).map(
          (_, index) => (
            <Row
              key={index}
              cells={repeat(overlay, 21 + dimensions.padding * 2)
              }
            />
          ),
          dimensions.renderedRows - 5
        )}
      </div>

      <div className="Overlay">
        <Row cells={createText("█▀▄ █▀▄ █ █ ▄▀▀ ▄▀▀", colors.white)} />
        <Row cells={createText("█▄█ █▄█ █ █ █▄▄ █▄▄", colors.white)} />
        <Row cells={createText("█   █ █ █▄▀ ▄▄▀ █▄▄", colors.white)} />
        <Row />
        <Row
          cells={[
            ...createText(isTouch ? "Tap " : "Press ", colors.white),
            ...(isTouch ? [resume] : createText("ESC", colors.white)),
            ...createText(" to resume", colors.white),
          ]}
        />
      </div>
      <div className="Resume" id="resume" onClick={handleResume} />
    </div>
  );
}
