import { World } from "../ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add, copy, getDistance, signedDistance } from "../../game/math/std";
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
import { addBackground, farming, none, spawn } from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { getUnlockSprite, isUnlockable } from "./action";
import { orientationPoints } from "../components/orientable";
import { canRevive } from "./fate";
import { REVIVABLE } from "../components/revivable";
import { FARMABLE } from "../components/farmable";
import { MOUNTABLE } from "../components/mountable";
import { canMount, isMounting } from "./vessel";

export default function setupInteract(world: World) {
  let referenceGenerations = -1;

  const onUpdate = (delta: number) => {
    const heroEntity = world.getEntity([PLAYER, POSITION, RENDERABLE]);
    const size = world.metadata.gameEntity[LEVEL].size;

    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    let activated = false;
    const interactEntities = [
      ...world.getEntities([POSITION, POPUP, RENDERABLE, SEQUENCABLE]),
      ...world.getEntities([POSITION, LOCKABLE, RENDERABLE, SEQUENCABLE]),
      ...world.getEntities([POSITION, REVIVABLE, RENDERABLE, SEQUENCABLE]),
      ...world.getEntities([POSITION, FARMABLE, RENDERABLE, SEQUENCABLE]),
      ...world.getEntities([POSITION, MOUNTABLE, RENDERABLE, SEQUENCABLE]),
    ];

    for (const entity of interactEntities) {
      const entityId = world.getEntityId(entity);
      const distance = heroEntity
        ? getDistance(entity[POSITION], heroEntity[POSITION], size, 1, false)
        : Infinity;
      const isAdjacent =
        !!heroEntity &&
        !isMounting(world, heroEntity) &&
        (!entity[MOUNTABLE] ||
          (entity[MOUNTABLE] && canMount(world, heroEntity, entity))) &&
        (entity[REVIVABLE]
          ? canRevive(world, entity, heroEntity)
          : isControllable(world, heroEntity)) &&
        !isInPopup(world, heroEntity) &&
        !(entity[LOCKABLE] && !isUnlockable(world, entity)) &&
        entity !== heroEntity &&
        entity[IDENTIFIABLE]?.name !== "use" &&
        ((entity[FARMABLE] && !entity[FARMABLE].planted && distance === 0) ||
          (!entity[FARMABLE] && distance <= 1));
      const interactSequence = getSequence(world, entity, "interact");

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

      if (
        isAdjacent &&
        !interactSequence &&
        !world.metadata.interact.active &&
        world.metadata.interact.last !== entityId
      ) {
        const viewables = world.getEntities([VIEWABLE, POSITION]);
        const viewable = getActiveViewable(viewables);
        const offset = {
          x: signedDistance(viewable[POSITION].x, entity[POSITION].x, size),
          y: signedDistance(viewable[POSITION].y, entity[POSITION].y, size),
        };
        const orientation =
          offset.y <= -2
            ? "down"
            : offset.x <= -7
            ? "right"
            : offset.x >= 7
            ? "left"
            : "up";
        const delta = orientationPoints[orientation];
        const horizontal = orientation === "left" || orientation === "right";
        const text = entity[LOCKABLE]
          ? "OPEN"
          : entity[FARMABLE]
          ? "PLANT"
          : entity[REVIVABLE]
          ? "SPAWN"
          : entity[MOUNTABLE]
          ? "BOAT"
          : popupActions[getDiscoveryTab(world, entity)];
        const sprite = entity[LOCKABLE]
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
          }
        );
        world.metadata.interact = {
          position: add(entity[POSITION], {
            x:
              orientation === "left"
                ? delta.x * text.length
                : orientation === "right"
                ? delta.x * (text.length + 1)
                : 0,
            y: horizontal ? 0 : delta.y * 2,
          }),
          size: { x: horizontal ? text.length + 2 : text.length, y: 1 },
          active: entityId,
          last: undefined,
          origin: copy(heroEntity[POSITION]),
        };
        activated = true;
        rerenderEntity(world, heroEntity);
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
