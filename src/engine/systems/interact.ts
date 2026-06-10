import { World } from "../ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import {
  combine,
  copy,
  getDistance,
  signedDistance,
} from "../../game/math/std";
import { PLAYER } from "../components/player";
import { REFERENCE } from "../components/reference";
import { createSequence, getSequence } from "./sequence";
import { POPUP } from "../components/popup";
import { LEVEL } from "../components/level";
import { InteractSequence, SEQUENCABLE } from "../components/sequencable";
import { VIEWABLE } from "../components/viewable";
import { getActiveViewable } from "../../bindings/hooks";
import { getDiscoveryTab, isInPopup, popupActions, popupIdles } from "./popup";
import { rerenderEntity } from "./renderer";
import { isControllable } from "./freeze";
import { IDENTIFIABLE } from "../components/identifiable";
import { LOCKABLE } from "../components/lockable";
import { farming, none, spawn } from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { getUnlockSprite, isUnlockable } from "./action";
import { ORIENTABLE, orientationPoints } from "../components/orientable";
import { canRevive } from "./fate";
import { REVIVABLE } from "../components/revivable";
import { FARMABLE } from "../components/farmable";
import { MOUNTABLE } from "../components/mountable";
import { canMount, isMounting } from "./vessel";
import { canPlant } from "./harvest";
import { addBackground } from "../../game/assets/ui";
import { CONDITIONABLE } from "../components/conditionable";
import { TypedEntity } from "../entities";
import { canPlot } from "./build";
import { isCooperating } from "./damage";

export default function setupInteract(world: World) {
  let referenceGenerations = -1;

  const onUpdate = (delta: number) => {
    const heroEntity = world.getEntity([
      PLAYER,
      POSITION,
      RENDERABLE,
      SEQUENCABLE,
    ]);
    const size = world.metadata.gameEntity[LEVEL].size;

    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    let activated = false;
    const interactEntities: TypedEntity<
      "POSITION" | "RENDERABLE" | "SEQUENCABLE"
    >[] = [
      ...world.getEntities([POSITION, POPUP, RENDERABLE, SEQUENCABLE]),
      ...world.getEntities([POSITION, LOCKABLE, RENDERABLE, SEQUENCABLE]),
      ...world.getEntities([POSITION, REVIVABLE, RENDERABLE, SEQUENCABLE]),
      ...world.getEntities([POSITION, FARMABLE, RENDERABLE, SEQUENCABLE]),
      ...world.getEntities([POSITION, MOUNTABLE, RENDERABLE, SEQUENCABLE]),
    ];

    if (heroEntity) {
      interactEntities.unshift(heroEntity);
    }

    for (const entity of interactEntities) {
      const buildCondition = entity[CONDITIONABLE]?.build;
      const buildOrientation = entity[ORIENTABLE]?.facing || "up";
      const entityId = world.getEntityId(entity);
      const distance = heroEntity
        ? getDistance(entity[POSITION], heroEntity[POSITION], size, 1, false)
        : Infinity;
      const interactSequence = getSequence(world, entity, "interact");
      const isAdjacent =
        !!heroEntity &&
        !isMounting(world, heroEntity) &&
        (!entity[POPUP] ||
          (entity[POPUP] && isCooperating(world, heroEntity, entity))) &&
        (!entity[MOUNTABLE] ||
          (entity[MOUNTABLE] && canMount(world, heroEntity, entity))) &&
        (entity[REVIVABLE]
          ? canRevive(world, entity, heroEntity)
          : isControllable(world, heroEntity)) &&
        !isInPopup(world, heroEntity) &&
        !(entity[LOCKABLE] && !isUnlockable(world, entity)) &&
        ((entity !== heroEntity && !buildCondition) ||
          (buildCondition &&
            canPlot(
              world,
              heroEntity,
              combine(
                size,
                entity[POSITION],
                orientationPoints[buildOrientation]
              )
            ) &&
            (!interactSequence ||
              interactSequence.args.orientation === buildOrientation))) &&
        entity[IDENTIFIABLE]?.name !== "use" &&
        ((entity[FARMABLE] && distance === 0 && canPlant(world, heroEntity)) ||
          (!entity[FARMABLE] && distance <= 1));

      // reset stale active interact
      const activeEntity = world.getEntityById(world.metadata.interact.active);
      if (world.metadata.interact.active && !activeEntity) {
        world.metadata.interact.active = undefined;
      }

      // reset last viewed popup
      if (
        heroEntity &&
        world.metadata.interact.last === entityId &&
        ((!isAdjacent && !isInPopup(world, heroEntity)) ||
          getDistance(
            heroEntity[POSITION],
            world.metadata.interact.origin,
            size
          ) !== 0)
      ) {
        world.metadata.interact.last = undefined;
      }

      if (isAdjacent) {
        const viewables = world.getEntities([VIEWABLE, POSITION]);
        const viewable = getActiveViewable(viewables);
        const offset = buildCondition
          ? orientationPoints[buildOrientation]
          : {
              x: signedDistance(viewable[POSITION].x, entity[POSITION].x, size),
              y: signedDistance(viewable[POSITION].y, entity[POSITION].y, size),
            };
        const orientation = buildCondition
          ? buildOrientation
          : offset.y <= -2
          ? "down"
          : offset.x <= -7
          ? "right"
          : offset.x >= 7
          ? "left"
          : "up";
        const delta = orientationPoints[orientation];
        const horizontal = orientation === "left" || orientation === "right";
        const text = buildCondition
          ? "PLOT"
          : entity[LOCKABLE]
          ? "OPEN"
          : entity[FARMABLE]
          ? "PLANT"
          : entity[REVIVABLE]
          ? "SPAWN"
          : entity[MOUNTABLE]
          ? "BOAT"
          : popupActions[getDiscoveryTab(world, entity)];
        const targetPosition = combine(
          size,
          entity[POSITION],
          {
            x:
              orientation === "left"
                ? delta.x * text.length
                : orientation === "right"
                ? delta.x * (text.length + 1)
                : 0,
            y: horizontal ? 0 : delta.y * 2,
          },
          buildCondition ? delta : { x: 0, y: 0 }
        );

        if (
          !interactSequence &&
          !world.metadata.interact.active &&
          world.metadata.interact.last !== entityId
        ) {
          // show new interact
          const sprite = buildCondition
            ? none
            : entity[LOCKABLE]
            ? getUnlockSprite(world, entity)
            : entity[REVIVABLE]
            ? spawn
            : entity[FARMABLE]
            ? farming
            : entity[MOUNTABLE]
            ? none
            : popupIdles[getDiscoveryTab(world, entity)];
          createSequence<"interact", InteractSequence>(
            world,
            entity,
            "interact",
            "popupInteract",
            {
              active: true,
              orientation,
              generation: 0,
              text,
              sprite:
                !sprite || sprite === none
                  ? none
                  : addBackground([sprite], colors.black)[0],
              offset: buildCondition ? delta : { x: 0, y: 0 },
            }
          );
          world.metadata.interact = {
            position: targetPosition,
            size: { x: horizontal ? text.length + 2 : text.length, y: 1 },
            active: entityId,
            last: undefined,
            origin: copy(heroEntity[POSITION]),
          };
          activated = true;
          rerenderEntity(world, heroEntity);
        } else if (
          interactSequence?.args.active &&
          world.metadata.interact?.active === entityId &&
          (targetPosition.x !== world.metadata.interact.position.x ||
            targetPosition.y !== world.metadata.interact.position.y)
        ) {
          // update position while building
          world.metadata.interact.position = targetPosition;
          rerenderEntity(world, heroEntity);
        }
      } else if (!isAdjacent && interactSequence?.args.active) {
        // abort sequence
        interactSequence.args.active = false;
        if (!activated) {
          world.metadata.interact.active = undefined;
        }
      }
    }
  };

  return { onUpdate };
}
