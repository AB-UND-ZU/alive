import { useCallback, useMemo, useRef, useState } from "react";
import { createWorld } from "../../engine";
import { WorldProvider } from "../../bindings/hooks";
import { PLAYER } from "../../engine/components/player";
import { isGhost } from "../../engine/systems/fate";
import { ensureAudio, suspendAudio } from "../../game/sound/resumable";
import { createLevel, createSystems } from "../../engine/ecs";
import {
  generateOverworld,
  overworldSize,
  overworldName,
} from "../../game/levels/overworld";

export default function World(props: React.PropsWithChildren) {
  const [paused, setPaused] = useState(true);
  const [initial, setInitial] = useState(true);
  const pauseRef = useRef(paused);

  // generate initial world
  // TODO: find better way to prevent double generation
  const [ecs] = useState(() => {
    const world = createWorld();
    createLevel(world, overworldName, overworldSize);
    setTimeout(generateOverworld, 0, world);
    createSystems(world);
    return world;
  });

  const handlePause = useCallback(
    (action: React.SetStateAction<boolean>) => {
      // only prevent pausing when hero is dead
      const heroEntity = ecs.getEntity([PLAYER]);
      const newPause =
        typeof action === "function" ? action(pauseRef.current) : action;

      if (newPause && (!heroEntity || isGhost(ecs, heroEntity))) return;

      // toggle sound
      if (newPause) {
        suspendAudio();
      } else {
        ensureAudio();
      }

      setPaused(newPause);
      pauseRef.current = newPause;
    },
    [setPaused, ecs, pauseRef]
  );

  const context = useMemo(
    () => ({ ecs, paused, setPaused: handlePause, initial, setInitial }),
    [ecs, paused, handlePause, initial]
  );

  return <WorldProvider value={context} {...props} />;
}
