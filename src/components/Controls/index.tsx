import { useCallback, useEffect, useRef } from "react";
import { useDimensions } from "../Dimensions";
import "./index.css";
import { MOVABLE, Orientation, Point } from "../../engine/components/movable";
import { useHero } from "../../bindings/hooks";
import { REFERENCE } from "../../engine/components/reference";

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

// degrees are counted from top center clockwise, from 0 to 360
export const pointToDegree = (point: Point) => {
  const radian = Math.atan2(point.y, point.x);
  return ((radian * 180) / Math.PI + 450) % 360;
};

export const degreesToOrientations = (degrees: number): Orientation[] => {
  const normalized = degrees % 360;

  const step = 360 / 16;

  if (normalized <= step) return ["up"];
  if (normalized <= step * 2) return ["up", "right"];
  if (normalized <= step * 3) return ["right", "up"];
  if (normalized <= step * 5) return ["right"];
  if (normalized <= step * 6) return ["right", "down"];
  if (normalized <= step * 7) return ["down", "right"];
  if (normalized <= step * 9) return ["down"];
  if (normalized <= step * 10) return ["down", "left"];
  if (normalized <= step * 11) return ["left", "down"];
  if (normalized <= step * 13) return ["left"];
  if (normalized <= step * 14) return ["left", "up"];
  if (normalized <= step * 15) return ["up", "left"];
  return ["up"];
};

export default function Controls() {
  const dimensions = useDimensions();
  const hero = useHero();
  const pressedOrientations = useRef<Orientation[]>([]);
  const touchOrigin = useRef<[number, number] | undefined>(undefined);

  const handleMove = useCallback(
    (orientations: Orientation[]) => {
      if (!hero) return;

      hero[MOVABLE].orientations = orientations;
      const pendingOrientation = orientations[0];

      if (pendingOrientation) {
        hero[MOVABLE].pendingOrientation = pendingOrientation;
      }

      if (orientations.length === 0) {
        hero[REFERENCE].pendingSuspended = true;
      } else {
        hero[REFERENCE].pendingSuspended = false;
        hero[REFERENCE].suspended = false;
      }
    },
    [hero]
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
      {"═".repeat(dimensions.columns + 1 - (dimensions.columns % 2))}
    </footer>
  );
}
