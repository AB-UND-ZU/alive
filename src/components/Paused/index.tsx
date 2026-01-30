import {
  createText,
  backdrop,
  resume,
  addBackground,
  createDialog,
} from "../../game/assets/sprites";
import { isTouch, useDimensions } from "../Dimensions";
import Row from "../Row";
import "./index.css";
import { useCallback } from "react";
import { useWorld } from "../../bindings/hooks";
import { repeat } from "../../game/math/std";
import { colors } from "../../game/assets/colors";

export default function Paused() {
  const { paused, setPaused, initial, setInitial, suspended } = useWorld();
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

  if (!paused && !initial && !suspended) return null;

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
          )
        )}
      </div>

      <div className="Overlay">
        {suspended ? (
          <>
            <Row cells={createDialog("Loading map...")} />
            <Row />
            <Row />
          </>
        ) : initial ? (
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
