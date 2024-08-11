import { World } from "../ecs";
import { POSITION } from "../components/position";
import { LEVEL } from "../components/level";
import { RENDERABLE } from "../components/renderable";
import { normalize } from "../../game/math/std";
import { FOG, Fog } from "../components/fog";
import { PLAYER } from "../components/player";

export const setVisibility = (
  world: World,
  x: number,
  y: number,
  visibility: Fog["visibility"]
) => {
  const level = world.metadata.gameEntity[LEVEL];

  const normalizedX = normalize(x, level.size);
  const normalizedY = normalize(y, level.size);

  const column = (level.map[normalizedX] = level.map[normalizedX] || {});
  const cell = (column[normalizedY] = column[normalizedY] || {});
  const gameId = world.getEntityId(world.metadata.gameEntity);

  if (!(gameId in cell)) {
    cell[gameId] = { [FOG]: { visibility: "hidden" } };
  }

  for (const entityId in cell) {
    if (!(FOG in cell[entityId])) continue;
    cell[entityId][FOG].visibility = visibility;
  }
};

export default function setupVisibility(world: World) {
  let lastGeneration = -1;

  const onUpdate = (delta: number) => {
    const hero = world.getEntity([PLAYER]);
    const generation = world.metadata.gameEntity[RENDERABLE].generation;

    if (!hero || lastGeneration === generation) return;

    // apply fog
    for (let x = 0; x < 11; x += 1) {
      for (let y = 0; y < 11; y += 1) {
        setVisibility(
          world,
          x - 5 + hero[POSITION].x,
          y - 5 + hero[POSITION].y,
          "fog"
        );
      }
    }

    // reveal visible area
    for (let x = 0; x < 9; x += 1) {
      for (let y = 0; y < 9; y += 1) {
        setVisibility(
          world,
          x - 4 + hero[POSITION].x,
          y - 4 + hero[POSITION].y,
          "visible"
        );
      }
    }

    lastGeneration = generation;
  };

  return { onUpdate };
}
