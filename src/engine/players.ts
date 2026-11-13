import type { World } from "./ecs";
import type { Entity, TypedEntity } from "./entities";
import { POPUP } from "./components/popup";
import { IDENTIFIABLE } from "./components/identifiable";
import { VIEWABLE } from "./components/viewable";
import { LAYER } from "./components/layer";
import { STRUCTURABLE } from "./components/structurable";
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
  for (const player of world.getEntities([
    PLAYER,
    POSITION,
    STATS,
    ...components,
  ])) {
    if (player[PLAYER].ghost || player[STATS].hp <= 0) continue;
    const next = getDistance(position, player[POSITION], size);
    if (next < distance) {
      closest = player;
      distance = next;
    }
  }
  return closest;
};

export const selectViewable = (
  viewables: TypedEntity<"VIEWABLE" | "POSITION">[],
  world?: World
) => {
  const id = world?.metadata.localPlayerId;
  const player =
    id === undefined
      ? undefined
      : world?.getEntityByIdAndComponents(id, [PLAYER, LAYER]);
  return viewables
    .filter((entity) => {
      if (id === undefined) return entity[VIEWABLE].active;
      if (!player) return false;
      if (entity[PLAYER] && world?.getEntityId(entity) !== id) return false;
      if (entity[VIEWABLE].owner !== undefined && entity[VIEWABLE].owner !== id)
        return false;
      if (entity[STRUCTURABLE])
        return player[LAYER].structure === world?.getEntityId(entity);
      return entity[VIEWABLE].active;
    })
    .sort(
      (left, right) => right[VIEWABLE].priority - left[VIEWABLE].priority
    )[0];
};

export const getPopupPlayer = <C extends keyof Entity>(
  world: World,
  entity: Partial<Entity>,
  components: C[]
) => {
  const owner = entity[POPUP]?.owner;
  if (owner !== undefined)
    return world.getEntityByIdAndComponents(owner, components);
  const hero = world
    .getEntities([IDENTIFIABLE])
    .find((candidate) => candidate[IDENTIFIABLE].name === "hero");
  return hero && world.getEntityComponents(hero, components);
};
