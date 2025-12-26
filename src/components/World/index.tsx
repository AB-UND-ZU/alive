import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createWorld } from "../../engine";
import { WorldProvider } from "../../bindings/hooks";
import { ensureAudio, suspendAudio } from "../../game/sound/resumable";
import { createLevel, createSystems } from "../../engine/ecs";
import { LevelName } from "../../engine/components/level";
import { levelConfig } from "../../game/levels";
import { useDimensions } from "../Dimensions";

const initialLevel: LevelName = "LEVEL_MENU";

export default function World(props: React.PropsWithChildren) {
  const dimensions = useDimensions();
  const [paused, setPaused] = useState(true);
  const [suspended, setSuspended] = useState(true);
  const [initial, setInitial] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const pauseRef = useRef(paused);

  // generate initial world
  // TODO: find better way to prevent double generation
  const [ecs] = useState(() => {
    const world = createWorld();
    world.metadata.suspend = () => setSuspended(true);
    world.metadata.resume = () => setSuspended(false);
    world.metadata.setFlipped = setFlipped;
    createLevel(world, initialLevel, levelConfig[initialLevel].size);
    createSystems(world);
    setTimeout(() => {
      levelConfig[initialLevel].generator(world);
      // run one game tick to initialize map
      ecs.update(0);
      world.metadata.resume();
    }, 0);

    return world;
  });

  const handlePause = useCallback(
    (action: React.SetStateAction<boolean>) => {
      const newPause =
        typeof action === "function" ? action(pauseRef.current) : action;

      // toggle sound
      if (newPause) {
        suspendAudio();
      } else {
        ensureAudio();
      }

      setPaused(newPause);
      pauseRef.current = newPause;
    },
    [setPaused, pauseRef]
  );

  const context = useMemo(
    () => ({
      ecs,
      suspended,
      setSuspended,
      paused,
      setPaused: handlePause,
      initial,
      setInitial,
      flipped,
      setFlipped,
    }),
    [ecs, suspended, setSuspended, paused, handlePause, initial, flipped]
  );

  // expose utilities to world metadata
  useEffect(() => {
    ecs.metadata.dimensions = dimensions;
  }, [ecs.metadata, dimensions]);

  return <WorldProvider value={context} {...props} />;
}
