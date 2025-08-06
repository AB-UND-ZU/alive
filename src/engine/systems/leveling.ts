import { Entity } from "ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { SWIMMABLE } from "../components/swimmable";
import { World } from "../ecs";
import { getEntityGeneration, rerenderEntity } from "./renderer";
import { REFERENCE } from "../components/reference";
import { STATS } from "../components/stats";
import { createSequence } from "./sequence";
import {
  ProgressSequence,
  SEQUENCABLE,
  XpSequence,
} from "../components/sequencable";
import { queueMessage } from "../../game/assets/utils";
import { createText, none } from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";
import { INVENTORY } from "../components/inventory";
import { LOOTABLE } from "../components/lootable";
import { ITEM } from "../components/item";
import { entities } from "..";
import { BELONGABLE } from "../components/belongable";
import { CASTABLE } from "../components/castable";
import { ORIENTABLE } from "../components/orientable";
import { SPRITE } from "../components/sprite";
import { copy, getDistance } from "../../game/math/std";
import { disposeEntity } from "./map";
import { FOG } from "../components/fog";
import { PLAYER } from "../components/player";
import { isDead } from "./damage";
import { isGhost } from "./fate";
import { LEVEL } from "../components/level";

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
  entity[STATS].level > 0 && entity[STATS].xp >= entity[STATS].maxXp;

export default function setupLeveling(world: World) {
  let referencesGeneration = -1;
  let worldGeneration = -1;
  const size = world.metadata.gameEntity[LEVEL].size;
  const entityGenerations: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    // level up entities
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

    // animate XP collection
    const hero = world.getEntity([PLAYER, POSITION]);
    const currentWorldGeneration =
      world.metadata.gameEntity[RENDERABLE].generation;

    if (
      !hero ||
      isDead(world, hero) ||
      isGhost(world, hero) ||
      currentWorldGeneration === worldGeneration
    )
      return;

    worldGeneration = currentWorldGeneration;

    for (const entity of world.getEntities([
      FOG,
      INVENTORY,
      LOOTABLE,
      POSITION,
    ])) {
      // skip if not visible or not in range
      if (
        entity[FOG].visibility !== "visible" ||
        getDistance(hero[POSITION], entity[POSITION], size, 1) > 4
      )
        continue;

      // skip if not XP drop
      const xpItem = entity[INVENTORY].items.find(
        (itemId) =>
          world.assertByIdAndComponents(itemId, [ITEM])[ITEM].stat === "xp"
      );
      if (!xpItem) continue;

      const xpEntity = world.assertByIdAndComponents(xpItem, [ITEM]);
      const amount = xpEntity[ITEM].amount;

      const castableEntity = entities.createSpell(world, {
        [BELONGABLE]: { faction: "nature" },
        [CASTABLE]: {
          medium: "true",
          affected: {},
          damage: 0,
          burn: 0,
          freeze: 0,
          heal: 0,
          caster: world.getEntityId(entity),
        },
        [ORIENTABLE]: {},
        [POSITION]: copy(entity[POSITION]),
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: { states: {} },
        [SPRITE]: none,
      });
      createSequence<"xp", XpSequence>(
        world,
        castableEntity,
        "xp",
        "acquireXp",
        {
          generation: 0,
        }
      );

      if (amount === 1) {
        disposeEntity(world, entity);
      } else {
        xpEntity[ITEM].amount -= 1;
        const containerEntity = world.assertById(xpEntity[ITEM].carrier);
        rerenderEntity(world, containerEntity);
      }
    }
  };

  return { onUpdate };
}
