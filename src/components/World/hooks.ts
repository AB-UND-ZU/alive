import { createContext, useContext } from "react";

import type { World as WorldType } from "../../engine";

export type WorldContext = {
  world: WorldType | null;
};

const initialContext: WorldContext = { world: null };
const Context = createContext(initialContext);

export const WorldProvider = Context.Provider;

export const useWorld = () => useContext(Context);

export const useEntity = (componentNames: string[]) => {
  // TODO: implement reactivity
  const { world } = useWorld();

  if (!world) return null;

  return world.getEntity(componentNames);
}
