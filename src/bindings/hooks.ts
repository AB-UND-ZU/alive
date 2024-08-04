import { Entity } from "ecs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { World as WorldType } from "../engine";
import { RENDERABLE } from "../engine/components/renderable";
import { PLAYER } from "../engine/components/player";
import { POSITION } from "../engine/components/position";

export type WorldContext = {
  ecs: WorldType | null;
};

const initialContext: WorldContext = { ecs: null };
const Context = createContext(initialContext);

export const WorldProvider = Context.Provider;

export const useWorld = () => useContext(Context);

// somehow React's useId can give duplicate IDs, hence why generating own sequence
let lastId = 0;

const generateId = () => {
  lastId += 1;
  return lastId;
}

const useId = () => {
  const id = useRef<number>();

  if (!id.current) {
    id.current = generateId();
  }

  return id.current;
};

export const useRenderable = (componentNames: string[]) => {
  const { ecs } = useWorld();
  const id = useId();
  const pendingGeneration = useRef(-1);
  const setGeneration = useState(-1)[1];

  const [entities, setEntities] = useState<Entity[]>([]);
  const listener = useCallback(() => {
    if (!ecs) return null;

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

    ecs.metadata.listeners[id] = listener;

    return () => {
      delete ecs.metadata.listeners[id];
    };
  }, [id, ecs, listener]);

  return entities;
};

export const useHero = () => {
  // assume first player entity to be hero
  const players = useRenderable([PLAYER, POSITION]);

  return players.length === 0 ? null : players[0];
};
