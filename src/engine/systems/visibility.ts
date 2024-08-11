import { World } from "../ecs";
import { POSITION } from "../components/position";
import { LEVEL } from "../components/level";
import { RENDERABLE } from "../components/renderable";
import { normalize } from "../../game/math/std";
import { FOG, Fog } from "../components/fog";
import { PLAYER } from "../components/player";
import { LIGHT } from "../components/light";
import { aspectRatio } from "../../components/Dimensions/sizing";

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
    const fog = cell[entityId][FOG];

    if (!fog || (visibility === "fog" && fog.visibility === "hidden"))
      continue;

    fog.visibility = visibility;
  }
};

export default function setupVisibility(world: World) {
  let lastGeneration = -1;

  const onUpdate = (delta: number) => {
    const hero = world.getEntity([PLAYER]);
    const generation = world.metadata.gameEntity[RENDERABLE].generation;

    if (!hero || lastGeneration === generation) return;

    const visionHorizontal = Math.floor(hero[LIGHT].brightness / aspectRatio);
    const visionVertical = hero[LIGHT].brightness;

    // apply fog with one extra cell around player
    for (let x = 0; x < visionHorizontal * 2 + 3; x += 1) {
      for (let y = 0; y < visionVertical * 2 + 3; y += 1) {
        setVisibility(
          world,
          x - (visionHorizontal + 1) + hero[POSITION].x,
          y - (visionVertical + 1) + hero[POSITION].y,
          "fog"
        );
      }
    }

    // reveal visible area
    for (let x = 0; x < visionHorizontal * 2 + 1; x += 1) {
      for (let y = 0; y < visionVertical * 2 + 1; y += 1) {
        setVisibility(
          world,
          x - visionHorizontal + hero[POSITION].x,
          y - visionVertical + hero[POSITION].y,
          "visible"
        );
      }
    }

    lastGeneration = generation;
  };

  return { onUpdate };
}
