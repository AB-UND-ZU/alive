import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { copy } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { disposeEntity, getCell, registerEntity } from "./map";
import { ITEM } from "../components/item";
import { ORIENTABLE } from "../components/orientable";
import { EQUIPPABLE } from "../components/equippable";
import { COUNTABLE } from "../components/countable";
import { createSequence, getSequence } from "./sequence";
import {
  ArrowSequence,
  HitSequence,
  SEQUENCABLE,
} from "../components/sequencable";
import { entities } from "..";
import { PROJECTILE } from "../components/projectile";
import { SPRITE } from "../components/sprite";
import { arrow, woodShot } from "../../game/assets/sprites";
import { INVENTORY } from "../components/inventory";
import { removeFromInventory } from "./trigger";
import { createItemAsDrop } from "./drop";
import { BELONGABLE } from "../components/belongable";
import { calculateDamage, isFriendlyFire } from "./damage";
import { SHOOTABLE } from "../components/shootable";

export const getShootable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (target) => SHOOTABLE in target && COUNTABLE in target
  ) as Entity | undefined;

export const shootArrow = (world: World, entity: Entity, bow: Entity) => {
  // consume one arrow from inventory
  const arrowId = entity[INVENTORY].items.find(
    (itemId: number) =>
      world.assertByIdAndComponents(itemId, [ITEM])[ITEM].stackable === "arrow"
  );
  const arrowEntity = world.assertByIdAndComponents(arrowId, [ITEM]);
  if (arrowEntity[ITEM].amount === 1) {
    removeFromInventory(world, entity, arrowEntity);
    disposeEntity(world, arrowEntity);
  } else {
    arrowEntity[ITEM].amount -= 1;
  }

  const tick =
    world.assertByIdAndComponents(entity[MOVABLE].reference, [REFERENCE])[
      REFERENCE
    ].tick / 2;

  const frameId = world.getEntityId(
    entities.createFrame(world, {
      [REFERENCE]: {
        tick,
        delta: 0,
        suspended: true,
        suspensionCounter: -1,
      },
      [RENDERABLE]: { generation: 0 },
    })
  );
  const shotEntity = entities.createShot(world, {
    [BELONGABLE]: { tribe: entity[BELONGABLE].tribe },
    [MOVABLE]: {
      orientations: [],
      reference: frameId,
      lastInteraction: 0,
      spring: { duration: tick },
    },
    [ORIENTABLE]: { facing: entity[ORIENTABLE].facing },
    [POSITION]: copy(entity[POSITION]),
    [PROJECTILE]: {
      damage: bow[ITEM].amount,
      material: bow[ITEM].material,
    },
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: woodShot,
  });
  registerEntity(world, shotEntity);

  // let arrow move
  createSequence<"arrow", ArrowSequence>(
    world,
    shotEntity,
    "arrow",
    "arrowShot",
    {
      range: 9,
      origin: copy(entity[POSITION]),
    }
  );
};

export default function setupBallistics(world: World) {
  let referenceGenerations = -1;

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle projectile collision
    for (const entity of world.getEntities([
      POSITION,
      PROJECTILE,
      RENDERABLE,
      SEQUENCABLE,
    ])) {
      // hit crossing enemies
      const targetEntity = getShootable(world, entity[POSITION]);

      if (targetEntity && !isFriendlyFire(world, entity, targetEntity)) {
        // inflict damage
        const attack = entity[PROJECTILE].damage;
        const armor = world.getEntityByIdAndComponents(
          targetEntity[EQUIPPABLE]?.armor,
          [ITEM]
        );
        const defense = armor ? armor[ITEM].amount : 0;
        const damage = calculateDamage(attack, defense);

        targetEntity[COUNTABLE].hp = Math.max(
          0,
          targetEntity[COUNTABLE].hp - damage
        );

        // add hit marker
        createSequence<"hit", HitSequence>(
          world,
          targetEntity,
          "hit",
          "damageHit",
          {
            damage: damage,
          }
        );

        // increment arrow hit counter on target
        targetEntity[SHOOTABLE].hits += 1;
        disposeEntity(world, entity, false);
        continue;
      }

      // drop finished projectiles
      if (!getSequence(world, entity, "arrow")) {
        const arrowEntity = createItemAsDrop(
          world,
          entity[POSITION],
          entities.createItem,
          {
            [ITEM]: {
              stackable: "arrow",
              amount: 1,
            },
            [SPRITE]: arrow,
          }
        );
        const containerEntity = world.assertById(arrowEntity[ITEM].carrier);
        registerEntity(world, containerEntity);
        disposeEntity(world, entity);
        continue;
      }
    }
  };

  return { onUpdate };
}
