import {
  createText,
  backdrop,
  resume,
  addBackground,
} from "../../game/assets/sprites";
import { isTouch, useDimensions } from "../Dimensions";
import Row from "../Row";
import "./index.css";
import { useCallback } from "react";
import { useWorld } from "../../bindings/hooks";
import { repeat } from "../../game/math/std";
import { colors } from "../../game/assets/colors";

export default function Paused({ initial }: { initial: boolean }) {
  const { setPaused, setInitial } = useWorld();
  const dimensions = useDimensions();
  const handleResume = useCallback(
    (event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();

      setPaused(false);

      if (initial) {
        setInitial(false);
      }
    },
    [initial, setPaused, setInitial]
  );

  return (
    <div className="Paused">
      <div className="Cover">
        {Array.from({ length: dimensions.renderedRows }).map(
          (_, index) => (
            <Row
              key={index}
              cells={repeat(
                backdrop,
                dimensions.visibleColumns + dimensions.padding * 2
              )}
            />
          ),
          dimensions.renderedRows
        )}
      </div>

      <div className="Overlay">
        {initial ? (
          <>
            {isTouch ? (
              <>
                <Row cells={createText("▀█▀ █▀▄ █▀▄")} />
                <Row cells={createText(" █  █▄█ █▄█")} />
                <Row cells={createText(" █  █ █ █  ")} />
              </>
            ) : (
              <>
                <Row cells={createText("▄▀▀ █   █ ▄▀▀ █ █")} />
                <Row cells={createText("█   █   █ █   █▄▀")} />
                <Row cells={createText("▀▄▄ ▀▄▄ █ ▀▄▄ █ █")} />
              </>
            )}
            <Row />
            <Row
              cells={createText(
                "to start the game",
                colors.white,
                colors.black
              )}
            />
          </>
        ) : (
          <>
            <Row cells={createText("█▀▄ █▀▄ █ █ ▄▀▀ ▄▀▀")} />
            <Row cells={createText("█▄█ █▄█ █ █ █▄▄ █▄▄")} />
            <Row cells={createText("█   █ █ █▄▀ ▄▄▀ █▄▄")} />
            <Row />
            <Row
              cells={addBackground(
                [
                  ...createText(isTouch ? "Tap " : "Press "),
                  ...(isTouch ? [resume] : createText("ESC")),
                  ...createText(" to resume"),
                ],
                colors.black
              )}
            />
          </>
        )}
      </div>
      <div className="Resume" id="resume" onClick={handleResume} />
    </div>
  );
}
