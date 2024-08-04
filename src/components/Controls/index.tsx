import { useCallback, useEffect, useRef } from "react";
import { useDimensions } from "../Dimensions";
import "./index.css";
import { MOVABLE, Orientation } from "../../engine/components/movable";
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

export default function Controls() {
  const dimensions = useDimensions();
  const hero = useHero();
  const pressedOrientations = useRef<Orientation[]>([]);

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
