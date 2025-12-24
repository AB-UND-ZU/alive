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
import { Position, POSITION } from "../engine/components/position";
import { getEntityGeneration } from "../engine/systems/renderer";
import { REFERENCE } from "../engine/components/reference";
import { VIEWABLE } from "../engine/components/viewable";
import { signedDistance } from "../game/math/std";
import { LEVEL } from "../engine/components/level";
import { LIGHT } from "../engine/components/light";
import { Entity, TypedEntity } from "../engine/entities";

export type WorldContext = {
  ecs: WorldType | null;
  initial: boolean;
  setInitial: React.Dispatch<React.SetStateAction<boolean>>;
  suspended: boolean;
  setSuspended: React.Dispatch<React.SetStateAction<boolean>>;
  paused: boolean;
  setPaused: React.Dispatch<React.SetStateAction<boolean>>;
  flipped: boolean;
  setFlipped: React.Dispatch<React.SetStateAction<boolean>>;
};

const initialContext: WorldContext = {
  ecs: null,
  initial: true,
  setInitial: () => {},
  suspended: false,
  setSuspended: () => {},
  paused: false,
  setPaused: () => {},
  flipped: false,
  setFlipped: () => {},
};
const Context = createContext(initialContext);

export const WorldProvider = Context.Provider;

export const worldContextRef = { current: initialContext };

export const useWorld = () => useContext(Context);

// R3F mounts a second React tree, hence React.useId leads to duplicate IDs
let lastId = 0;

const generateId = () => {
  lastId += 1;
  return lastId;
};

const useId = () => {
  const id = useRef<number>();

  if (!id.current) {
    id.current = generateId();
  }

  return id.current;
};

export const useRenderable = <C extends keyof Entity>(componentNames: C[]) => {
  const { ecs } = useWorld();
  const id = useId();
  const pendingGeneration = useRef(-1);
  const setGeneration = useState(-1)[1];

  const [entities, setEntities] = useState<TypedEntity<"RENDERABLE" | C>[]>([]);
  const listener = useCallback(
    (reset = false) => {
      if (reset) {
        setGeneration(-1);
        return;
      }

      if (!ecs) return null;

      const entities = ecs.getEntities([RENDERABLE, ...componentNames]);
      const nextGeneration =
        entities.length === 0
          ? -1
          : entities.reduce(
              (total, entity) => total + getEntityGeneration(ecs, entity),
              0
            );

      if (nextGeneration !== pendingGeneration.current) {
        pendingGeneration.current = nextGeneration;
        setGeneration(nextGeneration);
        setEntities(entities);
      }
    },
    [componentNames, ecs, setGeneration]
  );

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

export const useGame = () => {
  const { ecs } = useWorld();

  useRenderable([REFERENCE]);

  return ecs?.metadata.gameEntity;
};

export const useViewable = () => {
  const viewables = useRenderable([VIEWABLE, POSITION]);

  return viewables
    .filter((entity) => entity[VIEWABLE].active)
    .sort(
      (left, right) => right[VIEWABLE].priority - left[VIEWABLE].priority
    )[0];
};

const defaultSpring = {
  mass: 1,
  friction: 30,
  tension: 100,
};

const zeroFraction = { x: 0, y: 0 };
export const useViewpoint = () => {
  const viewable = useViewable();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { ecs } = useWorld();

  const x = viewable?.[POSITION].x;
  const y = viewable?.[POSITION].y;

  useEffect(() => {
    if (!ecs || x === undefined || y === undefined) return;

    const size = ecs.metadata.gameEntity[LEVEL].size;

    setPosition((prevPosition) => ({
      x: prevPosition.x + signedDistance(prevPosition.x, x, size),
      y: prevPosition.y + signedDistance(prevPosition.y, y, size),
    }));
  }, [x, y, ecs]);

  return {
    position,
    config: viewable?.[VIEWABLE].spring || defaultSpring,
    radius: viewable?.[LIGHT]?.brightness || Infinity,
    fraction: viewable?.[VIEWABLE].fraction || zeroFraction,
    viewable,
  };
};

export function useOverscan(x: number, y: number) {
  const previous = useRef<Position | null>(null);
  const next = useRef<Position>({ x, y });

  if (!previous.current) {
    previous.current = next.current;
  }

  if (next.current.x !== x || next.current.y !== y) {
    previous.current = next.current;
    next.current = { x, y };
  }

  return {
    x: next.current.x - previous.current.x,
    y: next.current.y - previous.current.y,
  };
}
