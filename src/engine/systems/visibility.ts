import { World } from "../ecs";
import { POSITION } from "../components/position";
import { LEVEL } from "../components/level";
import { RENDERABLE } from "../components/renderable";
import { normalize } from "../../game/math/std";
import { FOG, Fog } from "../components/fog";
import { PLAYER } from "../components/player";
import { LIGHT } from "../components/light";
import { aspectRatio } from "../../components/Dimensions/sizing";
import { traceCircularVisiblity } from "../../game/math/tracing";

type PendingChanges = Record<
  number,
  Record<
    number,
    Record<string, { from: Fog["visibility"]; to: Fog["visibility"] }>
  >
>;

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

  const cell = level.map[normalizedX][normalizedY];

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
        entity[FOG].visibility = pendingChange[entityId].to;
        entity[RENDERABLE].generation += 1;
      }
    }
  }
};

export default function setupVisibility(world: World) {
  let lastGeneration = -1;

  const onUpdate = (delta: number) => {
    const hero = world.getEntity([PLAYER]);
    const generation = world.metadata.gameEntity[RENDERABLE].generation;

    if (!hero || lastGeneration === generation) return;

    const radius = hero[LIGHT].brightness;
    const visionHorizontal = Math.floor(radius / aspectRatio);
    const visionVertical = hero[LIGHT].brightness;
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
    const visibleCells = traceCircularVisiblity(world, hero[POSITION], radius);

    for (const cell of visibleCells) {
      markVisibility(world, pendingChanges, cell.x, cell.y, "visible");
    }

    // apply changes
    commitVisibility(world, pendingChanges);

    lastGeneration = generation;
  };

  return { onUpdate };
}