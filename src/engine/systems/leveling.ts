import { Entity } from "ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { SWIMMABLE } from "../components/swimmable";
import { World } from "../ecs";
import { getEntityGeneration, rerenderEntity } from "./renderer";
import { REFERENCE } from "../components/reference";
import { STATS } from "../components/stats";
import { createSequence } from "./sequence";
import { ProgressSequence } from "../components/sequencable";
import { queueMessage } from "../../game/assets/utils";
import { createText } from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";

export type Level = {
  level: number;
  xp: number;
  maxHp: number;
  maxMp: number;
};

const levels: Level[] = [
  { level: 1, xp: 3, maxHp: 1, maxMp: 0 },
  { level: 2, xp: 5, maxHp: 0, maxMp: 1 },
  { level: 3, xp: 10, maxHp: 1, maxMp: 1 },
  { level: 4, xp: 15, maxHp: 1, maxMp: 1 },
  { level: 5, xp: 25, maxHp: 2, maxMp: 1 },
  { level: 6, xp: 40, maxHp: 2, maxMp: 1 },
  { level: 7, xp: 60, maxHp: 2, maxMp: 2 },
  { level: 8, xp: 75, maxHp: 2, maxMp: 2 },
  { level: 9, xp: 99, maxHp: 3, maxMp: 3 },
  { level: 10, xp: 99, maxHp: 3, maxMp: 3 },
];
export const initialLevel = levels[0];
const maxLevel = levels.slice(-1)[0];

export const hasLevelUp = (world: World, entity: Entity) =>
  entity[STATS].level > 0 && entity[STATS].xp === entity[STATS].maxXp;

export default function setupLeveling(world: World) {
  let referencesGeneration = -1;
  const entityGenerations: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    for (const entity of world.getEntities([POSITION, SWIMMABLE, STATS])) {
      const entityId = world.getEntityId(entity);
      const entityGeneration = getEntityGeneration(world, entity);

      if (entityGenerations[entityId] === entityGeneration) continue;

      entityGenerations[entityId] = entityGeneration;

      if (hasLevelUp(world, entity)) {
        const currentLevel = levels.find(
          (level) => level.level === entity[STATS].level
        )!;
        entity[STATS].xp = 0;
        entity[STATS].level = Math.min(maxLevel.level, entity[STATS].level + 1);
        const targetLevel = levels.find(
          (level) => level.level === entity[STATS].level
        )!;
        entity[STATS].maxXp = targetLevel.xp;

        createSequence<"progress", ProgressSequence>(
          world,
          entity,
          "progress",
          "levelUp",
          {
            dropped: false,
            maxHp: currentLevel.maxHp,
            maxMp: currentLevel.maxMp,
          }
        );

        queueMessage(world, entity, {
          line: createText("Level up", colors.silver),
          orientation: "up",
          fast: false,
          delay: 0,
        });

        rerenderEntity(world, entity);
      }
    }
  };

  return { onUpdate };
}
