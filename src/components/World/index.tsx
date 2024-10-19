import { useCallback, useMemo, useState } from "react";
import { generateWorld } from "../../bindings";
import { createWorld } from "../../engine";
import { WorldProvider } from "../../bindings/hooks";
import { useDimensions } from "../Dimensions";
import { PLAYER } from "../../engine/components/player";
import { isDead } from "../../engine/systems/damage";

export default function World(props: React.PropsWithChildren) {
  const [paused, setPaused] = useState(false);
  const dimensions = useDimensions();

  // generate initial world
  // TODO: find better way to prevent double generation
  const [ecs] = useState(() => {
    const world = createWorld(dimensions.mapSize);
    setTimeout(generateWorld, 0, world);
    return world;
  });

  const handlePause = useCallback(
    (newPaused: React.SetStateAction<boolean>) => {
      // only prevent pausing when hero is dead
      const heroEntity = ecs.getEntity([PLAYER]);
      const pauseAttempt =
        newPaused === true ||
        (typeof newPaused === "function" && newPaused(false));
      if (pauseAttempt && (!heroEntity || isDead(ecs, heroEntity))) return;

      setPaused(newPaused);
    },
    [setPaused, ecs]
  );

  const context = useMemo(
    () => ({ ecs, paused, setPaused: handlePause }),
    [ecs, paused, handlePause]
  );

  return <WorldProvider value={context} {...props} />;
}
