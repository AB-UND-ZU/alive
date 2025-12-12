import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createWorld } from "../../engine";
import { worldContextRef, WorldProvider } from "../../bindings/hooks";
import { PLAYER } from "../../engine/components/player";
import { isGhost } from "../../engine/systems/fate";
import { ensureAudio, suspendAudio } from "../../game/sound/resumable";
import { createLevel, createSystems } from "../../engine/ecs";
import { LevelName } from "../../engine/components/level";
import { levelConfig } from "../../game/levels";

const initialLevel: LevelName = "LEVEL_MENU";

export default function World(props: React.PropsWithChildren) {
  const [paused, setPaused] = useState(true);
  const [initial, setInitial] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const pauseRef = useRef(paused);

  // generate initial world
  // TODO: find better way to prevent double generation
  const [ecs] = useState(() => {
    const world = createWorld();
    createLevel(world, initialLevel, levelConfig[initialLevel].size);
    setTimeout(levelConfig[initialLevel].generator, 0, world);
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
    () => ({
      ecs,
      paused,
      setPaused: handlePause,
      initial,
      setInitial,
      flipped,
      setFlipped,
    }),
    [ecs, paused, handlePause, initial, flipped]
  );
  useEffect(() => {
    worldContextRef.current = context;
  }, [context]);

  return <WorldProvider value={context} {...props} />;
}
