import { useCallback, useEffect, useRef } from "react";
import { useDimensions } from "../Dimensions";
import { useHero } from "../World/hooks";
import "./index.css";
import { keyToOrientation, Orientation, orientationPoints } from "./utils";
import { MOVABLE } from "../../engine/components/movable";

export default function Controls() {
  const dimensions = useDimensions();
  const hero = useHero();
  const pressedOrientations = useRef<Orientation[]>([]);

  const handleMove = useCallback((orientation: Orientation) => {
    if (!hero) return;

    const point = orientationPoints[orientation];
    hero[MOVABLE].dx = point[0];
    hero[MOVABLE].dy = point[1];
  }, [hero]);

  const handleKeyMove = useCallback((event: KeyboardEvent) => {
    // since macOS doesn't fire keyup when meta key is pressed, prevent it from moving.
    // still not working: arrow keydown -> meta keydown -> arrow keyup -> meta keyup
    if (
      event.type === "keydown" &&
      (event.altKey || event.shiftKey || event.metaKey)
    )
      return;

    const orientation = keyToOrientation[event.key];
    const orientations = pressedOrientations.current;
    const lastOrientation = orientations[0];
    if (event.type === "keyup") {
      if (orientation)
        orientations.splice(orientations.indexOf(orientation), 1);
      return;
    }
    if (event.repeat) return;

    if (orientation) {
      orientations.unshift(orientation);
      const nextOrientation = pressedOrientations.current[0];
      if (nextOrientation && nextOrientation !== lastOrientation) {
        handleMove(nextOrientation);
      }
    } else if (event.key === " ") {
      // handle action
    }
  }, [handleMove]);

  useEffect(() => {
    if (!hero) return;

    window.addEventListener("keydown", handleKeyMove);
    window.addEventListener("keyup", handleKeyMove);

    return () => {
      window.removeEventListener("keydown", handleKeyMove);
      window.removeEventListener("keyup", handleKeyMove);
    };
  }, [handleKeyMove, hero]);

  return <footer className="Controls">{"═".repeat(dimensions.columns)}</footer>;
}
