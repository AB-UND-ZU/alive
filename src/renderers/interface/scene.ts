import type { World } from "../../engine";
import { Position, POSITION } from "../../engine/components/position";
import { LEVEL } from "../../engine/components/level";
import { MOVABLE } from "../../engine/components/movable";
import { RENDERABLE } from "../../engine/components/renderable";
import { SPRITE } from "../../engine/components/sprite";
import { CASTABLE } from "../../engine/components/castable";
import { HOMING } from "../../engine/components/homing";
import { STICKY } from "../../engine/components/sticky";
import { FRAGMENT } from "../../engine/components/fragment";
import { TypedEntity } from "../../engine/entities";
import { getCell } from "../../engine/systems/map";
import { getEnterable } from "../../engine/systems/enter";
import { normalize } from "../../game/math/std";
import { getClosestQuadrant } from "../../game/math/path";

export type SceneEntity = [
  number,
  number,
  boolean,
  string | number,
  TypedEntity<"POSITION">
];

export type SceneViewport = {
  position: Position;
  fraction: Position;
  overscan: Position;
  columns: number;
  rows: number;
  viewable?: { MOVABLE?: { flying?: boolean } } | null;
  structure?: number;
};

export const collectScene = (
  world: World,
  {
    position,
    fraction,
    overscan,
    columns,
    rows,
    viewable,
    structure,
  }: SceneViewport,
  stickyCastables: Record<number, Position>
): SceneEntity[] => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const flyingPadding = viewable?.[MOVABLE]?.flying ? 4 : 0;
  const fractionX = Math.sign(fraction.x);
  const fractionY = Math.sign(fraction.y);

  const renderableEntities: SceneEntity[] = [];
  for (
    let offsetX = 0;
    offsetX <
    columns + Math.abs(overscan.x) + Math.abs(fractionX) + flyingPadding;
    offsetX += 1
  ) {
    for (
      let offsetY = 0;
      offsetY <
      rows + Math.abs(overscan.y) + Math.abs(fractionY) + flyingPadding + 1;
      offsetY += 1
    ) {
      const oddX = columns % 2;
      const renderedX =
        offsetX -
        (columns - oddX) / 2 +
        position.x -
        Math.max(0, overscan.x) -
        Math.max(0, fractionX) -
        flyingPadding / 2;

      const oddY = rows % 2;
      const renderedY =
        offsetY -
        (rows - oddY) / 2 +
        position.y -
        Math.max(0, overscan.y) -
        Math.max(0, fractionY) -
        flyingPadding / 2;

      const renderedPosition = { x: renderedX, y: renderedY };
      const cell = getCell(world, renderedPosition);
      const inside =
        !!structure &&
        getEnterable(world, renderedPosition)?.[FRAGMENT]?.structure ===
          structure;

      for (const entityId in cell) {
        const entity = cell[entityId] as TypedEntity<"POSITION">;

        // render castables and sticky separately
        if (
          !(RENDERABLE in entity) ||
          !(SPRITE in entity) ||
          (CASTABLE in entity &&
            !(HOMING in entity) &&
            entity[CASTABLE]?.caster !== parseInt(entityId)) ||
          STICKY in entity
        )
          continue;

        renderableEntities.push([
          renderedX,
          renderedY,
          inside,
          entityId,
          entity,
        ]);
      }
    }
  }

  // given that hero is positioned absolutely,
  // find closest quadrant to virtually place all castables
  const castableEntities = world.getEntities([CASTABLE, POSITION]);
  for (const entity of castableEntities) {
    const entityId = world.getEntityId(entity);

    if (HOMING in entity || entity[CASTABLE].caster === entityId) continue;

    let castableQuadrant = stickyCastables[entityId];

    // check if quadrant has been calculated before
    if (!castableQuadrant) {
      const normalizedX = normalize(position.x, size);
      const normalizedY = normalize(position.y, size);
      const { quadrant } = getClosestQuadrant(
        { x: normalizedX, y: normalizedY },
        entity[POSITION],
        size,
        1
      );
      const wrapX = Math.floor((position.x - normalizedX) / size);
      const wrapY = Math.floor((position.y - normalizedY) / size);
      castableQuadrant = {
        x: wrapX + quadrant.x,
        y: wrapY + quadrant.y,
      };
      stickyCastables[entityId] = castableQuadrant;
    }

    renderableEntities.push([
      entity[POSITION].x + castableQuadrant.x * size,
      entity[POSITION].y + castableQuadrant.y * size,
      !!structure,
      entityId,
      entity,
    ]);
  }

  const stickyEntities = world.getEntities([STICKY, POSITION]);
  for (const entity of stickyEntities) {
    const entityId = world.getEntityId(entity);

    renderableEntities.push([
      position.x,
      position.y,
      !!structure,
      entityId,
      entity,
    ]);
  }

  return renderableEntities;
};
