import { Entity } from "ecs";
import { World } from "../ecs";
import { entities } from "../../engine";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import {
  BurnSequence,
  SEQUENCABLE,
  SmokeSequence,
} from "../components/sequencable";
import { BURNABLE } from "../components/burnable";
import { getCell } from "./map";
import { createSequence } from "./sequence";
import { getSequence } from "./sequence";
import { AFFECTABLE } from "../components/affectable";
import { SWIMMABLE } from "../components/swimmable";
import { copy } from "../../game/math/std";
import { BELONGABLE } from "../components/belongable";
import { CASTABLE } from "../components/castable";
import { ORIENTABLE } from "../components/orientable";
import { SPRITE } from "../components/sprite";
import { none } from "../../game/assets/sprites";

export const isBurning = (world: World, entity: Entity) =>
  entity[BURNABLE]?.burning;

export const getBurning = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isBurning(world, entity)
  ) as Entity | undefined;

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

      // create burning animation
      if (!getSequence(world, entity, "burn")) {
        createSequence<"burn", BurnSequence>(
          world,
          entity,
          "burn",
          "fireBurn",
          { generation: 0 }
        );
        createSequence<"smoke", SmokeSequence>(
          world,
          entity,
          "smoke",
          "smokeWind",
          { generation: 0, extinguish: 0 }
        );
      }
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
      }
    }

    // extinguish units
    for (const entity of world.getEntities([
      AFFECTABLE,
      BELONGABLE,
      POSITION,
      RENDERABLE,
      SEQUENCABLE,
      SWIMMABLE,
    ])) {
      if (entity[SWIMMABLE].swimming && entity[AFFECTABLE].burn > 0) {
        entity[AFFECTABLE].burn = 0;
        const castableEntity = entities.createSpell(world, {
          [BELONGABLE]: { faction: entity[BELONGABLE].faction },
          [CASTABLE]: {
            affected: {},
            damage: 0,
            burn: 0,
            freeze: 0,
            caster: world.getEntityId(entity),
          },
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
          { generation: 0, extinguish: 3 }
        );
      }
    }
  };

  return { onUpdate };
}
