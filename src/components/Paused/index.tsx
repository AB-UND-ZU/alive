import { createText, overlay, resume } from "../../game/assets/sprites";
import { isTouch, useDimensions } from "../Dimensions";
import Row from "../Row";
import "./index.css";
import { useCallback } from "react";
import { useWorld } from "../../bindings/hooks";
import { repeat } from "../../game/math/std";

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
        {Array.from({ length: dimensions.renderedRows - 5 }).map(
          (_, index) => (
            <Row
              key={index}
              cells={repeat(overlay, 21 + dimensions.padding * 2)}
            />
          ),
          dimensions.renderedRows - 5
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
            <Row cells={createText("to start the game")} />
          </>
        ) : (
          <>
            <Row cells={createText("█▀▄ █▀▄ █ █ ▄▀▀ ▄▀▀")} />
            <Row cells={createText("█▄█ █▄█ █ █ █▄▄ █▄▄")} />
            <Row cells={createText("█   █ █ █▄▀ ▄▄▀ █▄▄")} />
            <Row />
            <Row
              cells={[
                ...createText(isTouch ? "Tap " : "Press "),
                ...(isTouch ? [resume] : createText("ESC")),
                ...createText(" to resume"),
              ]}
            />
          </>
        )}
      </div>
      <div className="Resume" id="resume" onClick={handleResume} />
    </div>
  );
}
