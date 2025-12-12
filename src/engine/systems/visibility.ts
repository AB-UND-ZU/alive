import { World } from "../ecs";
import { POSITION } from "../components/position";
import { LEVEL } from "../components/level";
import { RENDERABLE } from "../components/renderable";
import { normalize } from "../../game/math/std";
import { FOG, Fog } from "../components/fog";
import { PLAYER } from "../components/player";
import { Light, LIGHT } from "../components/light";
import { aspectRatio } from "../../components/Dimensions/sizing";
import { traceCircularVisiblity } from "../../game/math/tracing";
import { REFERENCE } from "../components/reference";
import { disposeEntity, getCell } from "./map";
import { rerenderEntity } from "./renderer";
import { FRAGMENT } from "../components/fragment";
import { STRUCTURABLE } from "../components/structurable";
import { TypedEntity } from "../entities";
import { LAYER } from "../components/layer";
import { Entity } from "ecs";
import { getEntityStats } from "./damage";
import { levelConfig } from "../../game/levels";

type PendingChanges = Record<
  number,
  Record<
    number,
    Record<string, { from: Fog["visibility"]; to: Fog["visibility"] }>
  >
>;

const getLayerCells = (world: World, hero: TypedEntity) => {
  const structure = hero[LAYER]?.structure;

  if (!structure) return [];

  return world
    .getEntities([POSITION, LAYER])
    .filter((entity) => entity[LAYER].structure === structure)
    .map((entity) => entity[POSITION]);
};

const markVisibility = (
  world: World,
  pendingChanges: PendingChanges = {},
  x: number,
  y: number,
  visibility: Fog["visibility"]
) => {
  const level = world.metadata.gameEntity[LEVEL];

  const normalizedX = normalize(x, level.size);
  const normalizedY = normalize(y, level.size);
  const cell = getCell(world, { x, y });

  for (const entityId in cell) {
    const fog = cell[entityId][FOG];

    if (!fog) continue;

    const pendingColumn = (pendingChanges[normalizedX] =
      pendingChanges[normalizedX] || {});
    const pendingCell = (pendingColumn[normalizedY] =
      pendingColumn[normalizedY] || {});
    const pendingChange = pendingCell[entityId];

    // remove pending change if it would be set to initial value
    if (pendingChange) {
      if (pendingChange.from === visibility) {
        delete pendingCell[entityId];
      }
      if (
        pendingChange.to !== visibility &&
        !(pendingChange.from === "hidden" && visibility === "fog")
      ) {
        pendingChange.to = visibility;
      }
      continue;
    }

    // mark entity as changed unless trying to settle fog on darkness, thus revealing it
    if (
      fog.visibility !== visibility &&
      !(fog.visibility === "hidden" && visibility === "fog")
    ) {
      pendingCell[entityId] = { from: fog.visibility, to: visibility };
    }
  }
};

const commitVisibility = (world: World, pendingChanges: PendingChanges) => {
  const level = world.metadata.gameEntity[LEVEL];
  for (const x in pendingChanges) {
    const column = pendingChanges[x];
    for (const y in column) {
      const pendingChange = column[y];
      for (const entityId in pendingChange) {
        const entity = level.map[x][y][entityId];

        // skip if air already removed, or fixed
        if (!entity || entity[FOG].fixed) continue;

        // remove revealed air
        if (
          entity[FOG].type === "air" &&
          pendingChange[entityId].to !== "hidden"
        ) {
          disposeEntity(world, entity);
          continue;
        }

        // reveal attached structure and fragments
        const structureId =
          STRUCTURABLE in entity
            ? parseInt(entityId, 10)
            : entity[FRAGMENT]?.structure;
        const structure = world.getEntityByIdAndComponents(structureId, [FOG]);
        if (
          structure &&
          structure[FOG].visibility === "hidden" &&
          pendingChange[entityId].to === "visible"
        ) {
          world
            .getEntities([FRAGMENT, FOG, POSITION])
            .filter((fragment) => fragment[FRAGMENT].structure === structureId)
            .forEach((fragment) => {
              if (fragment[FOG].visibility === "hidden") {
                fragment[FOG].visibility = "fog";
                rerenderEntity(world, fragment);

                // also remove any air above fragments
                Object.values(getCell(world, fragment[POSITION])).forEach(
                  (cell) => {
                    if (
                      FOG in cell &&
                      cell[FOG].type === "air" &&
                      pendingChange[entityId].to !== "hidden"
                    ) {
                      disposeEntity(world, cell);
                    }
                  }
                );
              }
            });

          structure[FOG].visibility = "fog";
          rerenderEntity(world, structure);
        }

        // reveal entity itself
        entity[FOG].visibility = pendingChange[entityId].to;
        rerenderEntity(world, entity);
      }
    }
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

  const onUpdate = (delta: number) => {
    const hero = world.getEntity([PLAYER, LIGHT, POSITION]);

    if (!hero || !world.metadata.gameEntity[LEVEL].initialized) return;

    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    const radius = hero[LIGHT].visibility;
    const flooredRadius = radius < aspectRatio ? 0 : radius;

    const visionHorizontal = Math.ceil(flooredRadius / aspectRatio);
    const visionVertical = Math.ceil(flooredRadius);
    const pendingChanges: PendingChanges = {};

    // apply fog with one extra cell around player
    for (let x = 0; x < visionHorizontal * 2 + 3; x += 1) {
      for (let y = 0; y < visionVertical * 2 + 3; y += 1) {
        markVisibility(
          world,
          pendingChanges,
          x - (visionHorizontal + 1) + hero[POSITION].x,
          y - (visionVertical + 1) + hero[POSITION].y,
          "fog"
        );
      }
    }

    // reveal visible area
    const visibleCells = traceCircularVisiblity(
      world,
      hero[POSITION],
      flooredRadius
    );

    for (const cell of visibleCells) {
      markVisibility(world, pendingChanges, cell.x, cell.y, "visible");
    }

    // show all entities within hero layer
    const layerCells = flooredRadius === 0 ? [] : getLayerCells(world, hero);

    for (const cell of layerCells) {
      markVisibility(world, pendingChanges, cell.x, cell.y, "visible");
    }

    // apply changes
    commitVisibility(world, pendingChanges);
  };

  return { onUpdate };
}
