import { Entity } from "ecs";
import { World } from "../ecs";
import { entities } from "../../engine";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import {
  BurnSequence,
  DecaySequence,
  SEQUENCABLE,
  SmokeSequence,
} from "../components/sequencable";
import { BURNABLE } from "../components/burnable";
import { disposeEntity, getCell, registerEntity } from "./map";
import { createSequence } from "./sequence";
import { getSequence } from "./sequence";
import { AFFECTABLE } from "../components/affectable";
import { SWIMMABLE } from "../components/swimmable";
import { copy } from "../../game/math/std";
import { BELONGABLE } from "../components/belongable";
import { CASTABLE, getEmptyCastable } from "../components/castable";
import { ORIENTABLE } from "../components/orientable";
import { SPRITE } from "../components/sprite";
import { createText, none } from "../../game/assets/sprites";
import { FOG } from "../components/fog";
import { FRAGMENT } from "../components/fragment";
import { STRUCTURABLE } from "../components/structurable";
import { getItemSprite, queueMessage } from "../../game/assets/utils";
import { colors } from "../../game/assets/colors";
import { getLootable } from "./collect";
import { INVENTORY } from "../components/inventory";
import { ITEM } from "../components/item";
import { createItemAsDrop } from "./drop";

export const isBurnable = (world: World, entity: Entity) => BURNABLE in entity;

export const getBurnables = (world: World, position: Position) =>
  Object.values(getCell(world, position)).filter((entity) =>
    isBurnable(world, entity)
  ) as Entity[];

export const isBurning = (world: World, entity: Entity) =>
  entity[BURNABLE]?.burning;

export const getBurning = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isBurning(world, entity)
  ) as Entity | undefined;

// create static smoke animation from point where unit or terrain extinguishes
export const extinguishEntity = (world: World, entity: Entity) => {
  if (entity[AFFECTABLE]) {
    entity[AFFECTABLE].burn = 0;
  }
  if (entity[BURNABLE]) {
    entity[BURNABLE].burning = false;
  }

  const castableEntity = entities.createSpell(world, {
    [BELONGABLE]: { faction: entity[BELONGABLE]?.faction || "nature" },
    [CASTABLE]: getEmptyCastable(world, entity),
    [ORIENTABLE]: {},
    [POSITION]: copy(entity[POSITION]),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });
  createSequence<"smoke", SmokeSequence>(
    world,
    castableEntity,
    "smoke",
    "smokeWind",
    { generation: 0, extinguish: 3, simmer: false }
  );
};

export default function setupBurn(world: World) {
  let referenceGenerations = -1;

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // burn terrain
    for (const entity of world.getEntities([
      POSITION,
      BURNABLE,
      RENDERABLE,
      SEQUENCABLE,
    ])) {
      // skip if not burning
      if (!isBurning(world, entity)) continue;

      // burn whole structures
      const burningEntities = [];
      const structureId = entity[STRUCTURABLE]
        ? world.getEntityId(entity)
        : entity[FRAGMENT]?.structure;
      const structureEntity = world.getEntityByIdAndComponents(structureId, [
        STRUCTURABLE,
      ]);

      if (structureEntity) {
        const fragmentEntities = world
          .getEntities([POSITION, BURNABLE, FRAGMENT, RENDERABLE, SEQUENCABLE])
          .filter(
            (fragmentEntity) =>
              fragmentEntity[FRAGMENT].structure === structureId
          );

        // light up all fragments
        fragmentEntities.forEach((fragmentEntity) => {
          fragmentEntity[BURNABLE].burning = true;
        });

        burningEntities.push(...fragmentEntities);
      } else {
        burningEntities.push(entity);
      }

      // create burning animation
      burningEntities.forEach((burningEntity) => {
        const simmer = burningEntity[BURNABLE].simmer;
        if (
          !getSequence(world, burningEntity, "burn") &&
          !getSequence(world, burningEntity, "smoke")
        ) {
          if (!simmer) {
            createSequence<"burn", BurnSequence>(
              world,
              burningEntity,
              "burn",
              "fireBurn",
              { generation: 0 }
            );
          }

          if (
            burningEntity[BURNABLE].eternal ||
            burningEntity[BURNABLE].remains ||
            simmer
          )
            createSequence<"smoke", SmokeSequence>(
              world,
              burningEntity,
              "smoke",
              "smokeWind",
              { generation: 0, extinguish: 0, simmer }
            );
        }
      });
    }

    // burn units
    for (const entity of world.getEntities([
      POSITION,
      AFFECTABLE,
      RENDERABLE,
      SEQUENCABLE,
    ])) {
      if (entity[AFFECTABLE].burn > 0 && !getSequence(world, entity, "burn")) {
        createSequence<"burn", BurnSequence>(
          world,
          entity,
          "burn",
          "fireBurn",
          { generation: 0 }
        );
        queueMessage(world, entity, {
          line: createText("BURNING", colors.yellow),
          orientation: "up",
          fast: false,
          delay: 0,
        });
      }
    }

    // extinguish swimming units
    for (const entity of world.getEntities([
      AFFECTABLE,
      BELONGABLE,
      POSITION,
      RENDERABLE,
      SEQUENCABLE,
      SWIMMABLE,
    ])) {
      if (entity[SWIMMABLE].swimming && entity[AFFECTABLE].burn > 0) {
        extinguishEntity(world, entity);
      }
    }

    // decay combusted units
    for (const entity of world.getEntities([
      POSITION,
      BURNABLE,
      RENDERABLE,
      SEQUENCABLE,
      SPRITE,
    ])) {
      if (!entity[BURNABLE].combusted) continue;

      if (!getSequence(world, entity, "decay")) {
        createSequence<"decay", DecaySequence>(
          world,
          entity,
          "decay",
          "creatureDecay",
          { fast: true }
        );
      }
    }

    // dispose decayed units
    for (const entity of world.getEntities([
      POSITION,
      BURNABLE,
      RENDERABLE,
      SEQUENCABLE,
      SPRITE,
    ])) {
      if (!entity[BURNABLE].combusted || !entity[BURNABLE].decayed) continue;

      const remains = entity[BURNABLE].remains;

      if (remains) {
        entities.createGround(world, {
          [FOG]: { visibility: "hidden", type: "terrain" },
          [POSITION]: copy(entity[POSITION]),
          [SPRITE]: remains,
          [RENDERABLE]: { generation: 0 },
        });
      }

      // transfer smoke sequence
      const smokeState = entity[SEQUENCABLE].states.smoke;
      const castableEntity = entities.createSpell(world, {
        [BELONGABLE]: { faction: entity[BELONGABLE]?.faction || "nature" },
        [CASTABLE]: getEmptyCastable(world, entity),
        [ORIENTABLE]: {},
        [POSITION]: copy(entity[POSITION]),
        [RENDERABLE]: { generation: 0 },
        [SEQUENCABLE]: {
          states: smokeState ? { smoke: smokeState } : {},
        },
        [SPRITE]: none,
      });
      registerEntity(world, castableEntity);

      disposeEntity(world, entity, true);

      // check if there are any drops in same cell and re-drop to fix sprites
      const lootable = getLootable(world, entity[POSITION]);
      const itemEntity =
        lootable &&
        world.getEntityByIdAndComponents(lootable[INVENTORY].items[0], [ITEM]);

      if (itemEntity) {
        disposeEntity(world, lootable, false);

        const dropEntity = createItemAsDrop(
          world,
          copy(entity[POSITION]),
          entities.createItem,
          {
            [ITEM]: itemEntity[ITEM],
            [SPRITE]: getItemSprite(itemEntity[ITEM]),
          }
        );
        const carrierEntity = world.assertById(dropEntity[ITEM].carrier);
        registerEntity(world, carrierEntity);
      }
    }
  };

  return { onUpdate };
}
