import type { World } from "../ecs";
import { selectViewable } from "../players";
import { normalize, signedDistance } from "../../game/math/std";
import { POSITION } from "../components/position";
import { LEVEL } from "../components/level";
import { PLAYER } from "../components/player";

/** Keep dependencies outside the view without streaming unrelated terrain. */
export const selectNetworkView = (world: World, playerId: number) => {
  const player = world.getEntityByIdAndComponents(playerId, [PLAYER, POSITION]);
  if (!player) return;
  const popup = world.getEntityById(player[PLAYER].popup)?.POPUP;
  if (popup?.active && popup.tabs[popup.horizontalIndex] === "map") {
    const level = world.metadata.gameEntity[LEVEL];
    return {
      entities: undefined,
      cells: level.initialized.flatMap((column, x) =>
        column.flatMap((initialized, y) =>
          initialized ? [x * level.size + y] : []
        )
      ),
    };
  }
  const camera = selectViewable(
    world.getEntities(["VIEWABLE", POSITION]),
    world,
    playerId
  );
  const centers = [player[POSITION], camera?.[POSITION]].filter(
    Boolean
  ) as (typeof player.POSITION)[];
  const size = world.metadata.gameEntity[LEVEL].size;
  const width = Math.ceil(world.metadata.dimensions.renderedColumns / 2) + 12;
  const height = Math.ceil(world.metadata.dimensions.renderedRows / 2) + 8;
  const selected = new Set<number>();
  const pending = world
    .getEntities([])
    .filter(
      (entity) =>
        !entity.POSITION ||
        entity.IDENTIFIABLE ||
        entity.VIEWABLE ||
        entity.POI ||
        centers.some(
          (center) =>
            Math.abs(signedDistance(center.x, entity.POSITION!.x, size)) <=
              width &&
            Math.abs(signedDistance(center.y, entity.POSITION!.y, size)) <=
              height
        )
    );
  const add = (id: number | undefined) => {
    if (!id || selected.has(id)) return;
    const entity = world.getEntityById(id);
    if (entity) pending.push(entity);
  };
  const visited = new Set<object>();
  const references = (value: unknown) => {
    if (!value || typeof value !== "object" || visited.has(value)) return;
    visited.add(value);
    const id = world.getEntityId(value);
    if (id) {
      add(id);
      return;
    }
    for (const child of Object.values(value)) references(child);
  };
  for (let index = 0; index < pending.length; index++) {
    const entity = pending[index],
      id = world.getEntityId(entity);
    if (selected.has(id)) continue;
    selected.add(id);
    add(entity.FRAGMENT?.structure);
    add(entity.LAYER?.structure);
    add(entity.CASTABLE?.caster);
    add(entity.EXERTABLE?.castable);
    add(entity.HOMING?.target);
    add(entity.SOUL?.tombstoneId);
    add(entity.POPUP?.source);
    add(entity.POPUP?.viewpoint);
    add(entity.POPUP?.owner);
    add(entity.FOCUSABLE?.target);
    add(entity.FOCUSABLE?.pendingTarget);
    add(entity.PLAYER?.popup);
    add(entity.PLAYER?.mount);
    for (const state of Object.values(entity.SEQUENCABLE?.states || {})) {
      add(state?.reference);
      references(state?.args);
      for (const particle of Object.values(state?.particles || {}))
        add(particle);
    }
  }
  const cells = new Set<number>();
  const initialized = world.metadata.gameEntity[LEVEL].initialized;
  for (const center of centers)
    for (let dx = -width; dx <= width; dx++)
      for (let dy = -height; dy <= height; dy++) {
        const x = normalize(center.x + dx, size),
          y = normalize(center.y + dy, size);
        if (initialized[x]?.[y]) cells.add(x * size + y);
      }
  return { entities: selected, cells: [...cells].sort((a, b) => a - b) };
};
