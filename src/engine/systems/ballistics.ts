import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add, copy } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { disposeEntity, getCell, registerEntity } from "./map";
import { ITEM, STACK_SIZE } from "../components/item";
import { ORIENTABLE, orientationPoints } from "../components/orientable";
import { EQUIPPABLE } from "../components/equippable";
import { createSequence, getSequence } from "./sequence";
import { ArrowSequence, SEQUENCABLE } from "../components/sequencable";
import { entities } from "..";
import { PROJECTILE } from "../components/projectile";
import { SPRITE } from "../components/sprite";
import { arrow, woodShot } from "../../game/assets/sprites";
import { INVENTORY } from "../components/inventory";
import { removeFromInventory } from "./trigger";
import { createItemAsDrop, dropEntity } from "./drop";
import { BELONGABLE } from "../components/belongable";
import {
  calculateDamage,
  createAmountMarker,
  isEnemy,
  isFriendlyFire,
} from "./damage";
import { SHOOTABLE } from "../components/shootable";
import { isCollision } from "./movement";
import { isImmersible, isSubmerged } from "./immersion";
import { collectItem, getCollecting, getLootable } from "./collect";
import { rerenderEntity } from "./renderer";
import { STATS } from "../components/stats";
import { getLockable } from "./action";
import { invertOrientation } from "../../game/math/path";

export const getProjectiles = (world: World, position: Position) =>
  Object.values(getCell(world, position)).filter(
    (target) => PROJECTILE in target
  ) as Entity[];

export const getShootable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (target) => SHOOTABLE in target && STATS in target
  ) as Entity | undefined;

export const isBouncable = (world: World, position: Position) =>
  isCollision(world, position) ||
  isSubmerged(world, position) ||
  getLockable(world, position) ||
  getLootable(world, position);

export const getStackableArrow = (world: World, position: Position) => {
  const lootable = getLootable(world, position);

  if (!lootable) return;

  const arrowId = lootable[INVENTORY].items.findLast((itemId: number) => {
    const arrowEntity = world.assertByIdAndComponents(itemId, [ITEM]);
    return (
      arrowEntity[ITEM].stackable === "arrow" &&
      arrowEntity[ITEM].amount < STACK_SIZE
    );
  });

  return arrowId && world.assertById(arrowId);
};

export const shootArrow = (world: World, entity: Entity, bow: Entity) => {
  // consume one arrow from inventory
  const arrowId = entity[INVENTORY].items.findLast(
    (itemId: number) =>
      world.assertByIdAndComponents(itemId, [ITEM])[ITEM].stackable === "arrow"
  );
  const arrowEntity = world.assertByIdAndComponents(arrowId, [ITEM]);
  if (!isEnemy(world, entity)) {
    if (arrowEntity[ITEM].amount === 1) {
      removeFromInventory(world, entity, arrowEntity);
      disposeEntity(world, arrowEntity);
    } else {
      arrowEntity[ITEM].amount -= 1;
    }
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
    [BELONGABLE]: { faction: entity[BELONGABLE].faction },
    [MOVABLE]: {
      orientations: [],
      reference: frameId,
      lastInteraction: 0,
      spring: { duration: tick },
      flying: false,
    },
    [ORIENTABLE]: { facing: entity[ORIENTABLE].facing },
    [POSITION]: copy(entity[POSITION]),
    [PROJECTILE]: {
      damage: bow[ITEM].amount + entity[STATS].power,
      material: bow[ITEM].material,
      moved: false,
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
      caster: world.getEntityId(entity),
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
      const isFlying = getSequence(world, entity, "arrow");
      const hitBoxes = [];
      const orientation = entity[ORIENTABLE]?.facing || "up";
      const oppositeOrientation = invertOrientation(orientation);

      if (!isFlying) {
        hitBoxes.push(entity[POSITION]);
      }

      if (entity[PROJECTILE].moved) {
        hitBoxes.push(
          add(entity[POSITION], orientationPoints[oppositeOrientation])
        );
      }

      let hit = false;
      for (const hitBox of hitBoxes) {
        const targetEntity = getShootable(world, hitBox);

        if (targetEntity && !isFriendlyFire(world, entity, targetEntity)) {
          // inflict damage
          const attack = entity[PROJECTILE].damage;
          const shield = world.getEntityByIdAndComponents(
            targetEntity[EQUIPPABLE]?.shield,
            [ITEM]
          );
          const resistance = shield ? shield[ITEM].amount : 0;
          const { damage, hp } = calculateDamage(
            "physical",
            attack,
            resistance,
            {},
            targetEntity[STATS]
          );
          targetEntity[STATS].hp = hp;

          // add hit marker
          createAmountMarker(world, targetEntity, -damage, orientation);

          // increment arrow hit counter on target
          if (!isEnemy(world, entity)) {
            targetEntity[SHOOTABLE].hits = Math.min(
              targetEntity[SHOOTABLE].hits + 1,
              10
            );
          }
          disposeEntity(world, entity, false);
          hit = true;
          break;
        }
      }
      if (hit) continue;

      // drop arrows only after fully reaching end
      if (isFlying) continue;

      // don't drop enemy arrows
      if (isEnemy(world, entity)) {
        disposeEntity(world, entity);
        continue;
      }

      // stack into arrows
      const arrowStack = getStackableArrow(world, entity[POSITION]);
      if (arrowStack) {
        arrowStack[ITEM].amount += 1;
        const containerEntity = world.assertById(arrowStack[ITEM].carrier);
        rerenderEntity(world, containerEntity);
        disposeEntity(world, entity, false);
        continue;
      }

      // bounce off walls or allies
      const shootable = getShootable(world, entity[POSITION]);
      if (
        isBouncable(world, entity[POSITION]) ||
        (shootable && isFriendlyFire(world, entity, shootable))
      ) {
        const targetPosition = add(
          entity[POSITION],
          orientationPoints[oppositeOrientation]
        );

        const lootable = getLootable(world, targetPosition);
        const collecting = getCollecting(world, targetPosition);
        const container = collecting ? undefined : lootable;

        const drop = dropEntity(
          world,
          { [SHOOTABLE]: { hits: 1 } },
          entity[POSITION],
          !!container,
          2,
          container ? undefined : oppositeOrientation
        )[0];

        // add to container that finished bouncing
        if (container) {
          collectItem(world, container, drop);
        }

        disposeEntity(world, entity, false);
        continue;
      }

      // drop finished projectiles
      const arrowEntity = createItemAsDrop(
        world,
        entity[POSITION],
        entities.createItem,
        {
          [ITEM]: {
            stackable: "arrow",
            amount: 1,
            bound: false,
          },
          [SPRITE]: arrow,
        },
        !isImmersible(world, entity[POSITION])
      );
      const containerEntity = world.assertById(arrowEntity[ITEM].carrier);
      registerEntity(world, containerEntity);
      disposeEntity(world, entity);
      continue;
    }
  };

  return { onUpdate };
}
