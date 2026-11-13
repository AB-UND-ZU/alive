import type { World } from "./ecs";
import type { Entity, TypedEntity } from "./entities";
import { PLAYER } from "./components/player";
import { POSITION, Position } from "./components/position";
import { STATS } from "./components/stats";
import { LEVEL } from "./components/level";
import { getDistance } from "../game/math/std";

/** A network view must never fall back to controlling somebody else's hero. */
export const getLocalPlayer = <C extends keyof Entity>(
  world: World,
  components: C[]
) =>
  world.metadata.localPlayerId === undefined
    ? world.getEntity([PLAYER, ...components])
    : world.getEntityByIdAndComponents(world.metadata.localPlayerId, [
        PLAYER,
        ...components,
      ]);

/** Stable ties follow entity order, as single-player queries already do. */
export const getClosestPlayer = <C extends keyof Entity>(
  world: World,
  position: Position,
  components: C[]
) => {
  let closest: TypedEntity<"PLAYER" | "POSITION" | "STATS" | C> | undefined;
  let distance = Infinity;
  const size = world.metadata.gameEntity[LEVEL].size;
  for (const player of world.getEntities([PLAYER, POSITION, STATS, ...components])) {
    if (player[PLAYER].ghost || player[STATS].hp <= 0) continue;
    const next = getDistance(position, player[POSITION], size);
    if (next < distance) {
      closest = player;
      distance = next;
    }
  }
  return closest;
};
