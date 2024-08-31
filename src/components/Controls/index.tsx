import { useCallback, useEffect, useRef } from "react";
import { useDimensions } from "../Dimensions";
import "./index.css";
import { MOVABLE } from "../../engine/components/movable";
import { useHero, useWorld } from "../../bindings/hooks";
import { REFERENCE } from "../../engine/components/reference";
import { Orientation } from "../../engine/components/orientable";
import { degreesToOrientations, pointToDegree } from "../../game/math/tracing";
import Row from "../Row";
import { createText } from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";

export const keyToOrientation: Record<KeyboardEvent["key"], Orientation> = {
  ArrowUp: "up",
  w: "up",
  ArrowRight: "right",
  d: "right",
  ArrowDown: "down",
  s: "down",
  ArrowLeft: "left",
  a: "left",
};

export default function Controls() {
  const dimensions = useDimensions();
  const { ecs } = useWorld();
  const hero = useHero();
  const pressedOrientations = useRef<Orientation[]>([]);
  const touchOrigin = useRef<[number, number] | undefined>(undefined);

  const handleMove = useCallback(
    (orientations: Orientation[]) => {
      if (!hero || !ecs) return;

      const reference = ecs.getEntityById(hero[MOVABLE].reference)[REFERENCE];

      if (!reference) return;

      hero[MOVABLE].orientations = orientations;
      const pendingOrientation = orientations[0];

      if (pendingOrientation) {
        hero[MOVABLE].pendingOrientation = pendingOrientation;
      }

      if (orientations.length === 0) {
        reference.pendingSuspended = true;
      } else {
        reference.pendingSuspended = false;
        reference.suspended = false;
      }
    },
    [hero, ecs]
  );

  const handleKeyMove = useCallback(
    (event: KeyboardEvent) => {
      // since macOS doesn't fire keyup when meta key is pressed, prevent it from moving.
      // still not working: arrow keydown -> meta keydown -> arrow keyup -> meta keyup
      // also prevent repeat events
      if (
        event.type === "keydown" &&
        (event.altKey || event.shiftKey || event.metaKey || event.repeat)
      )
        return;

      const orientation = keyToOrientation[event.key];

      // TODO: add spell handling
      if (!orientation) return;

      const orientations = pressedOrientations.current;

      if (event.type === "keydown") {
        orientations.unshift(orientation);
      } else if (event.type === "keyup") {
        orientations.splice(orientations.indexOf(orientation), 1);
      }

      handleMove(orientations);
    },
    [handleMove]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        touchOrigin.current = undefined;
        pressedOrientations.current = [];
        handleMove(pressedOrientations.current);
        return;
      }

      event.preventDefault();

      const [x, y] = [event.touches[0].clientX, event.touches[0].clientY];

      if (!touchOrigin.current) {
        touchOrigin.current = [x, y];
      }

      const [deltaX, deltaY] = [
        x - touchOrigin.current[0],
        y - touchOrigin.current[1],
      ];

      if (Math.sqrt(deltaX ** 2 + deltaY ** 2) <= 5) {
        // handle spell
        return;
      }

      const degrees = pointToDegree({ x: deltaX, y: deltaY });
      const nextOrientations = degreesToOrientations(degrees);

      if (nextOrientations.length > 0) {
        if (
          !nextOrientations.every(
            (orientation, index) =>
              orientation === pressedOrientations.current[index]
          )
        ) {
          handleMove(nextOrientations);
        }
        pressedOrientations.current = nextOrientations;
      } else {
        pressedOrientations.current = [];
      }
    },
    [handleMove]
  );

  useEffect(() => {
    if (!hero) return;

    window.addEventListener("keydown", handleKeyMove);
    window.addEventListener("keyup", handleKeyMove);

    window.addEventListener("touchstart", handleTouchMove);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchMove);
    window.addEventListener("touchcancel", handleTouchMove);

    return () => {
      window.removeEventListener("keydown", handleKeyMove);
      window.removeEventListener("keyup", handleKeyMove);

      window.removeEventListener("touchstart", handleTouchMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchMove);
      window.removeEventListener("touchcancel", handleTouchMove);
    };
  }, [handleKeyMove, handleTouchMove, hero]);

  return (
    <footer className="Controls">
      <Row
        cells={createText(
          "═".repeat(dimensions.columns + 1 - (dimensions.columns % 2)),
          colors.grey
        )}
      />
    </footer>
  );
}
