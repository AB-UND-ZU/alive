import { cameraSpring } from "../../engine/motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { World as WorldType } from "../../engine";
import { RENDERABLE } from "../../engine/components/renderable";
import { PLAYER } from "../../engine/components/player";
import { Position, POSITION } from "../../engine/components/position";
import { getEntityGeneration } from "../../engine/systems/renderer";
import { REFERENCE } from "../../engine/components/reference";
import { VIEWABLE } from "../../engine/components/viewable";
import { signedDistance } from "../../game/math/std";
import { LEVEL } from "../../engine/components/level";
import { LIGHT } from "../../engine/components/light";
import { Entity, TypedEntity } from "../../engine/entities";
import { IDENTIFIABLE } from "../../engine/components/identifiable";

export type SaveStatus = { saving: boolean; name?: string; failed?: boolean };

export type WorldContext = {
  ecs: WorldType | null;
  initial: boolean;
  setInitial: React.Dispatch<React.SetStateAction<boolean>>;
  loadingSounds?: boolean;
  suspended: boolean;
  setSuspended: React.Dispatch<React.SetStateAction<boolean>>;
  paused: boolean;
  setPaused: React.Dispatch<React.SetStateAction<boolean>>;
  flipped: boolean;
  setFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  saveStatus?: SaveStatus;
  saveGame: () => void;
  openMenu: () => void;
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
  saveGame: () => {},
  openMenu: () => {},
};
const Context = createContext(initialContext);

export const WorldProvider = Context.Provider;

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

export const useRenderable = <C extends keyof Entity>(
  componentNames: C[],
  identifier?: string
) => {
  const { ecs } = useWorld();
  const id = useId();
  const pendingGeneration = useRef(-1);
  const setGeneration = useState(-1)[1];

  const [entities, setEntities] = useState<TypedEntity<"RENDERABLE" | C>[]>([]);
  const listener = useCallback(
    (reset = false) => {
      if (reset) {
        pendingGeneration.current = -1;
        setGeneration(-1);
      }

      if (!ecs) return null;

      const entities = identifier
        ? (ecs
            .getEntities([RENDERABLE, IDENTIFIABLE, ...componentNames])
            .filter(
              (entity) => entity[IDENTIFIABLE].name === identifier
            ) as TypedEntity<"RENDERABLE" | C>[])
        : ecs.getEntities([RENDERABLE, ...componentNames]);
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
    [componentNames, ecs, setGeneration, identifier]
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

export const getActiveViewable = (
  viewables: TypedEntity<"VIEWABLE" | "POSITION">[]
) =>
  viewables
    .filter((entity) => entity[VIEWABLE].active)
    .sort(
      (left, right) => right[VIEWABLE].priority - left[VIEWABLE].priority
    )[0];

export const useViewable = () => {
  const viewables = useRenderable([VIEWABLE, POSITION]);
  return getActiveViewable(viewables);
};

const zeroFraction = { x: 0, y: 0 };
export const useViewpoint = () => {
  const { ecs } = useWorld();
  const renderedViewable = useViewable();
  // read world directly until renderables are listed, e.g. in loaded worlds
  const viewable =
    renderedViewable ||
    (ecs && getActiveViewable(ecs.getEntities([VIEWABLE, POSITION])));
  const level = ecs?.metadata.gameEntity[LEVEL]?.name;
  const committed = useRef<{ position: Position; level?: string }>();

  // start right at the viewpoint in new or loaded worlds
  const previous = committed.current;
  const jump = !previous || previous.level !== level;
  const x = viewable?.[POSITION].x;
  const y = viewable?.[POSITION].y;
  let position = previous?.position || { x: 0, y: 0 };

  if (ecs && x !== undefined && y !== undefined) {
    const size = ecs.metadata.gameEntity[LEVEL].size;
    position = jump
      ? { x, y }
      : {
          x: position.x + signedDistance(position.x, x, size),
          y: position.y + signedDistance(position.y, y, size),
        };
  }

  useEffect(() => {
    if (x === undefined || y === undefined) return;
    committed.current = { position, level };
  });

  return {
    position,
    jump,
    config: viewable?.[VIEWABLE].spring || cameraSpring,
    radius: viewable?.[LIGHT]?.brightness || Infinity,
    fraction: viewable?.[VIEWABLE].fraction || zeroFraction,
    viewable,
  };
};

export function useOverscan(x: number, y: number, reset?: boolean) {
  const previous = useRef<Position | null>(null);
  const next = useRef<Position>({ x, y });

  if (!previous.current) {
    previous.current = next.current;
  }

  if (next.current.x !== x || next.current.y !== y) {
    previous.current = next.current;
    next.current = { x, y };
  }

  if (reset) {
    previous.current = { x, y };
    next.current = { x, y };
  }

  return {
    x: next.current.x - previous.current.x,
    y: next.current.y - previous.current.y,
  };
}
