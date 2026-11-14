import type { World } from "./ecs";
import type { Entity } from "./entities";
import { PLAYER } from "./components/player";
import { TEST_MODE } from "./utils";

export const isTestMode = (world: World, player?: Partial<Entity>) => {
  const actor =
    player ||
    (world.metadata.localPlayerId === undefined
      ? world.getEntity([PLAYER])
      : world.getEntityById(world.metadata.localPlayerId));
  return world.metadata.warpPlayer || world.metadata.network
    ? !!actor?.[PLAYER]?.admin
    : TEST_MODE;
};
