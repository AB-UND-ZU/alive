import { useCallback, useMemo, useRef, useState } from "react";
import { createWorld } from "../../engine";
import { WorldProvider } from "../../bindings/hooks";
import { PLAYER } from "../../engine/components/player";
import { isGhost } from "../../engine/systems/fate";
import { ensureAudio, suspendAudio } from "../../game/sound/resumable";
import {
  forestName,
  forestSize,
  generateForest,
} from "../../game/levels/forest";
import { createLevel } from "../../engine/ecs";

export default function World(props: React.PropsWithChildren) {
  const [paused, setPaused] = useState(false);
  const pauseRef = useRef(paused);

  // generate initial world
  // TODO: find better way to prevent double generation
  const [ecs] = useState(() => {
    const world = createWorld();
    createLevel(world, forestName, forestSize);
    setTimeout(generateForest, 0, world);
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
    () => ({ ecs, paused, setPaused: handlePause }),
    [ecs, paused, handlePause]
  );

  return <WorldProvider value={context} {...props} />;
}
