import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import type { World as WorldType } from "../../engine";
import { RENDERABLE } from "../../engine/components/renderable";
import { Entity } from "ecs";
import { PLAYER } from "../../engine/components/player";
import { MAP } from "../../engine/components/map";
import { POSITION } from "../../engine/components/position";

export type WorldContext = {
  ecs: WorldType | null;
};

const initialContext: WorldContext = { ecs: null };
const Context = createContext(initialContext);

export const WorldProvider = Context.Provider;

export const useWorld = () => useContext(Context);

export const useRenderable = (componentNames: string[]) => {
  const { ecs } = useWorld();
  const id = useId();
  const pendingGeneration = useRef(0);
  const setGeneration = useState(0)[1];

  const [entities, setEntities] = useState<Entity[]>([]);
  const listener = useCallback(() => {
    if (!ecs) return null;

    const metadata = ecs.getEntity([MAP]);

    if (!metadata) return;

    const entities = ecs.getEntities([RENDERABLE, ...componentNames]);
    const nextGeneration = entities.reduce(
      (total, entity) => total + entity[RENDERABLE].generation,
      0
    );

    if (nextGeneration > pendingGeneration.current) {
      pendingGeneration.current = nextGeneration;
      setGeneration(nextGeneration);
      setEntities(entities);
    }
  }, [componentNames, ecs, setGeneration]);

  // provide listener to ECS systems
  useEffect(() => {
    if (!ecs) return;

    const metadata = ecs.getEntity([MAP]);

    if (!metadata) return;

    metadata[MAP].listeners[id] = listener;

    return () => {
      delete metadata[MAP].listeners[id];
    };
  }, [id, ecs, listener]);

  return entities;
};

export const useHero = () => {
  // assume first player entity to be hero
  const players = useRenderable([PLAYER, POSITION]);

  return players.length === 0 ? null : players[0];
};
