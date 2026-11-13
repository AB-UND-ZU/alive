import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { LEVEL } from "../components/level";
import { RENDERABLE } from "../components/renderable";
import { normalize } from "../../game/math/std";
import { FOG, Fog } from "../components/fog";
import { Light, LIGHT } from "../components/light";
import { aspectRatio } from "../../renderers/interface/dimensions";
import {
  getObstruction,
  traceCircularVisiblity,
} from "../../game/math/tracing";
import { REFERENCE } from "../components/reference";
import { disposeEntity, getCellEntities } from "./map";
import { rerenderEntity } from "./renderer";
import { FRAGMENT } from "../components/fragment";
import { STRUCTURABLE } from "../components/structurable";
import { TypedEntity } from "../entities";
import { LAYER } from "../components/layer";
import { Entity } from "ecs";
import { getEntityStats } from "./damage";
import { levelConfig } from "../../game/levels";

type Change = {
  x: number;
  y: number;
  entityId: number;
  to: Fog["visibility"];
};

type Sight = {
  size: number;
  x: number;
  y: number;
  radius: number;
  cells: Position[];
  obstructions: ReturnType<typeof getObstruction>[];
};

export const isHidden = (world: World, position: Position) =>
  getCellEntities(world, position).some(
    (entity) => entity[FOG]?.visibility === "hidden"
  );

const getLayerCells = (world: World, hero: TypedEntity) => {
  const structure = hero[LAYER]?.structure;

  if (!structure) return [];

  return world
    .getEntities([POSITION, LAYER])
    .filter((entity) => entity[LAYER].structure === structure)
    .map((entity) => entity[POSITION]);
};

// keep only plain values, so a sight never holds on to a previous level
const traceSight = (
  world: World,
  size: number,
  position: Position,
  radius: number
): Sight => {
  const cells = traceCircularVisiblity(world, position, radius).map((cell) => ({
    x: normalize(cell.x, size),
    y: normalize(cell.y, size),
  }));

  return {
    size,
    x: position.x,
    y: position.y,
    radius,
    cells,
    obstructions: cells.map((cell) => getObstruction(world, cell)),
  };
};

// tracing reads nothing but these obstructions, so the same ones give the same sight
const isSightCurrent = (
  world: World,
  sight: Sight,
  size: number,
  position: Position,
  radius: number
) =>
  sight.size === size &&
  sight.x === position.x &&
  sight.y === position.y &&
  sight.radius === radius &&
  sight.cells.every(
    (cell, index) => getObstruction(world, cell) === sight.obstructions[index]
  );

const commitVisibility = (world: World, changes: Change[]) => {
  const level = world.metadata.gameEntity[LEVEL];

  // apply in map order, regardless of which revealable found a change first
  changes.sort(
    (left, right) =>
      left.x - right.x || left.y - right.y || left.entityId - right.entityId
  );

  for (const change of changes) {
    const entity = level.map[change.x][change.y][change.entityId];

    // skip if air already removed, or fixed
    if (!entity || entity[FOG].fixed) continue;

    // remove revealed air
    if (entity[FOG].type === "air" && change.to !== "hidden") {
      disposeEntity(world, entity);
      continue;
    }

    // reveal attached structure and fragments
    const structureId =
      STRUCTURABLE in entity ? change.entityId : entity[FRAGMENT]?.structure;
    const structure = world.getEntityByIdAndComponents(structureId, [FOG]);
    if (
      structure &&
      structure[FOG].visibility === "hidden" &&
      change.to === "visible"
    ) {
      world
        .getEntities([FRAGMENT, FOG, POSITION])
        .filter((fragment) => fragment[FRAGMENT].structure === structureId)
        .forEach((fragment) => {
          if (fragment[FOG].visibility === "hidden") {
            fragment[FOG].visibility = "fog";
            rerenderEntity(world, fragment);

            // also remove any air above fragments
            getCellEntities(world, fragment[POSITION]).forEach((cell) => {
              if (
                FOG in cell &&
                cell[FOG].type === "air" &&
                change.to !== "hidden"
              ) {
                disposeEntity(world, cell);
              }
            });
          }
        });

      structure[FOG].visibility = "fog";
      rerenderEntity(world, structure);
    }

    // reveal entity itself
    entity[FOG].visibility = change.to;
    rerenderEntity(world, entity);
  }
};

export const getEntityVision = (world: World, entity: Entity): Light => {
  const level = world.metadata.gameEntity[LEVEL].name;
  const vision =
    levelConfig[level].vision + getEntityStats(world, entity).vision;

  return calculateVision(vision);
};

const baseLight = 3.55;

export const calculateVision = (vision: number) => {
  const extra = (vision * 43) / 64;

  return {
    darkness: 0,
    brightness: baseLight + extra,
    visibility: baseLight + extra,
  };
};

export default function setupVisibility(world: World) {
  let referencesGeneration = -1;
  const sights = new WeakMap<Entity, Sight>();
  // increasing marks per cell, so they never need to be cleared
  let marks = new Uint32Array(0);
  let mark = 0;

  const onUpdate = (delta: number) => {
    const revealables = world
      .getEntities([LIGHT, POSITION])
      .filter((entity) => entity[LIGHT].visibility > 0);

    if (
      revealables.length === 0 ||
      world.metadata.gameEntity[LEVEL].initialized.length === 0
    )
      return;

    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    const size = world.metadata.gameEntity[LEVEL].size;

    // start over for another map size, or before marks exceed their range
    if (marks.length !== size * size || mark + 2 > 0xffffffff) {
      marks = new Uint32Array(size * size);
      mark = 0;
    }
    const visibleMark = mark + 1;
    const checkedMark = mark + 2;
    mark = checkedMark;

    // cells in sight and within hero layer
    const visibleCells: Position[] = [];
    for (const revealable of revealables) {
      const radius = revealable[LIGHT].visibility;
      const flooredRadius = radius < aspectRatio ? 0 : radius;

      if (flooredRadius === 0) continue;

      let sight = sights.get(revealable);
      if (
        !sight ||
        !isSightCurrent(world, sight, size, revealable[POSITION], flooredRadius)
      ) {
        sight = traceSight(world, size, revealable[POSITION], flooredRadius);
        sights.set(revealable, sight);
      }

      visibleCells.push(...sight.cells, ...getLayerCells(world, revealable));
    }

    for (const cell of visibleCells) {
      marks[normalize(cell.x, size) * size + normalize(cell.y, size)] =
        visibleMark;
    }

    // compare each cell once and only keep actual changes
    const changes: Change[] = [];
    const checkCell = (x: number, y: number) => {
      const index = x * size + y;

      if (marks[index] === checkedMark) return;

      const to = marks[index] === visibleMark ? "visible" : "fog";
      marks[index] = checkedMark;

      for (const entity of getCellEntities(world, { x, y })) {
        const visibility = entity[FOG]?.visibility;

        // mark entity as changed unless trying to settle fog on darkness, thus revealing it
        if (
          visibility &&
          visibility !== to &&
          !(visibility === "hidden" && to === "fog")
        ) {
          changes.push({ x, y, entityId: world.getEntityId(entity), to });
        }
      }
    };

    // apply fog with one extra cell around revealables
    for (const revealable of revealables) {
      const radius = revealable[LIGHT].visibility;
      const flooredRadius = radius < aspectRatio ? 0 : radius;

      const visionHorizontal = Math.ceil(flooredRadius / aspectRatio);
      const visionVertical = Math.ceil(flooredRadius);

      for (let x = 0; x < visionHorizontal * 2 + 3; x += 1) {
        for (let y = 0; y < visionVertical * 2 + 3; y += 1) {
          checkCell(
            normalize(
              x - (visionHorizontal + 1) + revealable[POSITION].x,
              size
            ),
            normalize(y - (visionVertical + 1) + revealable[POSITION].y, size)
          );
        }
      }
    }

    // reveal visible area, also where it exceeds the fog area
    for (const cell of visibleCells) {
      checkCell(normalize(cell.x, size), normalize(cell.y, size));
    }

    // apply changes
    commitVisibility(world, changes);
  };

  return { onUpdate };
}
