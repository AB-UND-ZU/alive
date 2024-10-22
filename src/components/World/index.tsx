import { useCallback, useMemo, useRef, useState } from "react";
import { generateWorld } from "../../bindings";
import { createWorld } from "../../engine";
import { WorldProvider } from "../../bindings/hooks";
import { useDimensions } from "../Dimensions";
import { PLAYER } from "../../engine/components/player";
import { isDead } from "../../engine/systems/damage";

export default function World(props: React.PropsWithChildren) {
  const [paused, setPaused] = useState(false);
  const pauseRef = useRef(paused);
  const dimensions = useDimensions();
  
  // generate initial world
  // TODO: find better way to prevent double generation
  const [ecs] = useState(() => {
    const world = createWorld(dimensions.mapSize);
    setTimeout(generateWorld, 0, world);
    return world;
  });

  const handlePause = useCallback(
    (action: React.SetStateAction<boolean>) => {
      // only prevent pausing when hero is dead
      const heroEntity = ecs.getEntity([PLAYER]);
      const newPause = typeof action === 'function' ? action(pauseRef.current) : action;
        
      if (newPause && (!heroEntity || isDead(ecs, heroEntity))) return;

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
