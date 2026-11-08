import { World } from "../engine";
import { Sprite } from "../engine/components/sprite";
import { getSegments, lootHeight } from "../components/Entity/utils";
import { getFacingLayers } from "../game/assets/ui";
import { isLootable } from "../engine/systems/collect";
import { getParticles } from "../engine/systems/sequence";
import { none } from "../game/assets/sprites";
import { Pixels } from "./visuals";
import { normalize } from "../game/math/std";

export function worldRows(
  world: World,
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    inside?: boolean;
  }
) {
  const grid = Array.from({ length: bounds.height }, () =>
    Array.from(
      { length: bounds.width },
      () => [] as { z: number; sprite: Sprite }[]
    )
  );
  const put = (x: number, y: number, z: number, sprite: Sprite) => {
    const size = world.metadata.gameEntity.LEVEL.size;
    const row = grid[Math.round(normalize(y - bounds.y, size))];
    const cell = row?.[Math.round(normalize(x - bounds.x, size))];
    if (cell) cell.push({ z, sprite });
  };
  for (const entity of world.getEntities([
    "SPRITE",
    "POSITION",
    "RENDERABLE",
  ])) {
    if (entity.FOG?.type === "air") continue;
    getSegments(
      world,
      entity,
      {
        isTransparent: false,
        receiveShadow: false,
      },
      bounds.inside
    ).forEach((segment, index) =>
      put(
        entity.POSITION.x + segment.offsetX,
        entity.POSITION.y + segment.offsetY,
        segment.offsetZ + index / 1000,
        {
          ...segment.sprite,
          layers: getFacingLayers(
            segment.sprite,
            segment.facing,
            segment.amount
          ),
        }
      )
    );
    if (isLootable(world, entity))
      for (const id of entity.INVENTORY?.items || []) {
        const item = world.getEntityByIdAndComponents(id, ["SPRITE", "ITEM"]);
        if (item)
          put(entity.POSITION.x, entity.POSITION.y, lootHeight, {
            ...item.SPRITE,
            layers: getFacingLayers(
              item.SPRITE,
              item.ORIENTABLE?.facing,
              item.ITEM.amount
            ),
          });
      }
    for (const particle of getParticles(world, entity))
      put(
        entity.POSITION.x + particle.PARTICLE.offsetX,
        entity.POSITION.y + particle.PARTICLE.offsetY,
        particle.PARTICLE.offsetZ,
        {
          ...particle.SPRITE,
          layers: getFacingLayers(
            particle.SPRITE,
            particle.ORIENTABLE?.facing,
            particle.PARTICLE.amount
          ),
        }
      );
  }
  return grid.map((row) =>
    row.map((cell) =>
      cell.length
        ? {
            name: "World cell",
            layers: cell
              .sort((a, b) => a.z - b.z)
              .flatMap(({ sprite }) => sprite.layers),
          }
        : none
    )
  );
}
export function WorldDiagram({
  rows,
  label,
}: {
  rows: Sprite[][];
  label: string;
}) {
  return (
    <div className="WorldDiagram InterfaceScroll">
      <Pixels rows={rows} label={label} />
    </div>
  );
}
