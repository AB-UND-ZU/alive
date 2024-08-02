import { createContext, useContext, useRef, useState } from "react";

import type { World as WorldType } from "../../engine";
import { useFrame } from "@react-three/fiber";
import { RENDERABLE } from "../../engine/components/renderable";
import { Entity } from "ecs";

export type WorldContext = {
  world: WorldType | null;
};

const initialContext: WorldContext = { world: null };
const Context = createContext(initialContext);

export const WorldProvider = Context.Provider;

export const useWorld = () => useContext(Context);

export const useRenderable = (componentNames: string[]) => {
  const { world } = useWorld();
  const pendingGeneration = useRef(0);
  const setGeneration = useState(0)[1];
  const [entities, setEntities] = useState<Entity[]>([]);

  useFrame(() => {
    if (!world) return null;

    const entities = world.getEntities([RENDERABLE, ...componentNames]);
    const nextGeneration = entities.reduce(
      (total, entity) => total + entity[RENDERABLE].generation,
      0
    );

    if (nextGeneration > pendingGeneration.current) {
      pendingGeneration.current = nextGeneration;
      setGeneration(nextGeneration);
      setEntities(entities);
    }
  });

  return entities;
};
